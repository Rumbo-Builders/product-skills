#!/usr/bin/env bash
# Pipeline de QA do deck. Gera, valida, renderiza e confere as regras da casa.
#
#   bash qa.sh deck.js Saida.pptx
#
# Reprova o build se encontrar travessão, pontuação em série ou vocabulário
# proibido no texto do PDF. As regras estão em metodo/_principios.md.
#
# Para estender o vocabulário proibido de um cliente, aponte RUMBO_VOCAB_EXTRA
# para um arquivo com um termo por linha (regex ERE aceito).
set -uo pipefail

GEN="${1:-deck.js}"
OUT="${2:-Saida.pptx}"
BASE="$(basename "$OUT" .pptx)"

echo "== gerando =="
node "$GEN" || exit 1

# Localiza os utilitários da skill pptx. O caminho varia conforme o ambiente.
SK=""
for d in \
  /mnt/skills/public/pptx/scripts/office \
  "${CLAUDE_CONFIG_DIR:-$HOME/.claude}/skills/synced/pptx/scripts/office" \
  "$HOME/.claude/skills/pptx/scripts/office" \
  "$HOME/mnt/.claude/skills/pptx/scripts/office"
do
  [ -f "$d/validate.py" ] && SK="$d" && break
done

if [ -n "$SK" ]; then
  echo "== validando =="
  python3 "$SK/validate.py" "$OUT" || exit 1
else
  echo "aviso: scripts da skill pptx não encontrados. Pulando validação de XML."
fi

echo "== renderizando =="
rm -rf render && mkdir -p render
if [ -n "$SK" ] && [ -f "$SK/soffice.py" ]; then
  python3 "$SK/soffice.py" --convert-to pdf --outdir render "$OUT" >/dev/null 2>&1
elif command -v soffice >/dev/null 2>&1; then
  soffice --headless --convert-to pdf --outdir render "$OUT" >/dev/null 2>&1
else
  echo "aviso: LibreOffice não encontrado. Não é possível renderizar."
  echo "Instale libreoffice ou rode este passo em um ambiente que o tenha."
  exit 0
fi

if ! command -v pdftoppm >/dev/null 2>&1; then
  echo "aviso: poppler-utils não encontrado. Instale para gerar as imagens."
  exit 0
fi
pdftoppm -jpeg -r 100 "render/$BASE.pdf" render/s

echo "== conferindo as regras da casa =="
FALHOU=0
if command -v pdftotext >/dev/null 2>&1; then
  TXT="$(pdftotext -layout "render/$BASE.pdf" -)"

  DASH=$(printf '%s' "$TXT" | grep -c "—")
  if [ "$DASH" -gt 0 ]; then
    echo "FALHA: $DASH ocorrência(s) de travessão. Regra da casa: nenhuma."
    printf '%s' "$TXT" | grep -n "—" | head -20
    FALHOU=1
  else
    echo "ok: nenhum travessão"
  fi

  SERIE=$(printf '%s' "$TXT" | grep -cE "[!?]{2,}")
  if [ "$SERIE" -gt 0 ]; then
    echo "FALHA: $SERIE ocorrência(s) de pontuação em série."
    printf '%s' "$TXT" | grep -nE "[!?]{2,}" | head -20
    FALHOU=1
  else
    echo "ok: nenhuma pontuação em série"
  fi

  VOCAB='alavanc|leverage|vale (destacar|ressaltar)|em suma|de forma holística|sinergia|game changer|desbloquear potencial|mergulhar fundo|no cenário atual|é importante notar'
  if [ -n "${RUMBO_VOCAB_EXTRA:-}" ] && [ -f "${RUMBO_VOCAB_EXTRA}" ]; then
    EXTRA="$(grep -v '^[[:space:]]*$' "$RUMBO_VOCAB_EXTRA" | grep -v '^#' | paste -sd'|' -)"
    [ -n "$EXTRA" ] && VOCAB="$VOCAB|$EXTRA"
    echo "     (vocabulário estendido por $RUMBO_VOCAB_EXTRA)"
  fi
  VOC=$(printf '%s' "$TXT" | grep -ciE "$VOCAB")
  if [ "$VOC" -gt 0 ]; then
    echo "FALHA: $VOC ocorrência(s) de vocabulário proibido."
    printf '%s' "$TXT" | grep -niE "$VOCAB" | head -20
    FALHOU=1
  else
    echo "ok: nenhum termo proibido"
  fi
else
  echo "aviso: pdftotext não encontrado. Regras da casa não verificadas."
fi

echo
if [ "$FALHOU" -eq 1 ]; then
  echo "BUILD REPROVADO. Corrija o texto e rode de novo."
  exit 1
fi
echo "Build aprovado no automático. Falta o que a máquina não vê:"
echo "  leia render/s-*.jpg um por um, slide a slide."
