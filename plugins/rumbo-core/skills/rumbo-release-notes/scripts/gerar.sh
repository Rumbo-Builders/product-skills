#!/usr/bin/env bash
# Gera o PDF a partir do HTML e renderiza para conferência.
#
#   bash gerar.sh notas.html Release-Notes.pdf
#
# Usa o Chrome como impressora headless. Depois renderiza em JPG, porque o
# método exige conferir o resultado, não só gerar o arquivo.
set -uo pipefail

HTML="${1:?uso: gerar.sh <arquivo.html> [saida.pdf]}"
OUT="${2:-$(basename "${HTML%.html}").pdf}"
[ -f "$HTML" ] || { echo "erro: $HTML não existe" >&2; exit 1; }

CHROME=""
for c in \
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  "/Applications/Chromium.app/Contents/MacOS/Chromium" \
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" \
  "$(command -v google-chrome 2>/dev/null)" \
  "$(command -v chromium 2>/dev/null)"
do
  [ -n "$c" ] && [ -x "$c" ] && CHROME="$c" && break
done
[ -z "$CHROME" ] && { echo "erro: nenhum Chrome ou Chromium encontrado" >&2; exit 1; }

ABS="$(cd "$(dirname "$HTML")" && pwd)/$(basename "$HTML")"
echo "== imprimindo =="
"$CHROME" --headless --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="$OUT" "file://$ABS" 2>/dev/null
[ -s "$OUT" ] || { echo "FALHA: o PDF não foi gerado" >&2; exit 1; }
echo "gerado: $OUT ($(du -h "$OUT" | cut -f1))"

if command -v pdftoppm >/dev/null 2>&1; then
  echo "== renderizando para conferência =="
  rm -rf render && mkdir -p render
  pdftoppm -jpeg -r 110 "$OUT" render/p
  echo "páginas: $(ls render/p-*.jpg 2>/dev/null | wc -l | tr -d ' ')"
  echo
  echo "Leia render/p-*.jpg antes de entregar. O que a máquina não vê:"
  echo "  texto cortado no fim da página, item órfão, área quebrada ao meio,"
  echo "  cor que sumiu na impressão, rodapé colado no conteúdo."
else
  echo "aviso: pdftoppm não encontrado. O PDF NÃO foi conferido."
fi
