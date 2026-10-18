#!/usr/bin/env bash
# Teste de fumaça das apostas.
#
# A régua do rascunho é a mesma do envelope da estratégia (scripts/regras.cjs),
# e este script é o que impede ela de afrouxar sem ninguém ver: aprova o exemplo,
# reprova cada violação numa cópia mutada, confere os três mapas e o tradutor.
#
# Uso: bash fumaca.sh [diretorio-de-saida]
set -uo pipefail

AQUI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN="$(cd "$AQUI/../../.." && pwd)"
EXEMPLO="$AQUI/exemplo-aposta.json"
CASCATA="$PLUGIN/skills/rumbo-estrategia/scripts/exemplo-envelope-estrategia.json"
VALIDAR="$PLUGIN/scripts/validar-alcas.mjs"
SAIDA="${1:-$(mktemp -d)}"
mkdir -p "$SAIDA"

if ! command -v node >/dev/null 2>&1; then
  echo "aviso: node nao encontrado. NADA FOI TESTADO. Nao trate isso como aprovado."
  exit 0
fi

FALHOU=0
CASOS=0

# espera <exit> <rotulo> <arquivo> [trecho que tem de aparecer]
espera() {
  local esperado="$1" rotulo="$2" arquivo="$3" trecho="${4:-}"
  CASOS=$((CASOS + 1))
  local log="$SAIDA/caso-$CASOS.log"
  node "$VALIDAR" "$arquivo" --cascata "$CASCATA" >"$log" 2>&1
  local st=$?
  if [ "$st" != "$esperado" ]; then
    echo "FALHA $rotulo: esperava exit $esperado, saiu $st (veja $log)"; FALHOU=1
  elif [ -n "$trecho" ] && ! grep -q "$trecho" "$log"; then
    echo "FALHA $rotulo: sem \"$trecho\" na saida (veja $log)"; FALHOU=1
  else
    echo "ok    $rotulo"
  fi
}

# muta <exit> <rotulo> <js sobre a, a aposta> [trecho]
muta() {
  local arq="$SAIDA/mut-$((CASOS + 1)).json"
  node -e "
const fs = require('fs');
const e = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
const a = e.itens[0], p = a.payload;
$3;
fs.writeFileSync(process.argv[2], JSON.stringify(e, null, 2));
" "$EXEMPLO" "$arq"
  espera "$1" "$2" "$arq" "${4:-}"
}

echo "== regua: o exemplo aprova =="
espera 0 "exemplo aprovado" "$EXEMPLO"

echo "== regua: cada violacao reprova =="
muta 1 "sem serve"                     "delete p.serve"
muta 1 "serve que nao e escolha"       "p.serve = 'ap-plano-plus'"
muta 1 "serve inexistente"             "p.serve = 'nao-existe'"
muta 1 "sem hipotese"                  "delete p.hipotese"
muta 1 "sem indicador"                 "delete p.indicador"
muta 1 "sem criterio de matar"         "delete p.criterio_matar"
muta 1 "sem horizonte"                 "delete p.horizonte"
muta 1 "estado invalido"               "p.estado = 'pausada'"
muta 1 "marco sem data"                "p.marcos[0].data = 'novembro'"
muta 1 "resultado sem metrica"         "delete p.resultados[0].metrica"
muta 1 "slug fora do formato"          "a.slug = 'Aposta Nova'"
muta 1 "travessao no problema"         "p.problema = 'Nao cota — nunca'"

echo "== regua: o que so avisa nao reprova =="
muta 0 "serve em lista: aprova"        "p.serve = ['cap-onboarding-sem-gente', 'cap-catalogo-sincronizado']"
muta 0 "hipotese sem porque: aviso"    "p.hipotese = 'Se responder no WhatsApp, entao fecham'" "porque"
muta 0 "matar sem data: aviso"         "p.criterio_matar = 'Se ninguem usar'; p.marcos = []" "data ISO"
muta 0 "sem marco de matar: aviso"     "p.marcos = p.marcos.slice(0, 1)" "decisao de matar ou seguir"
muta 0 "quadrante fora da lista: aviso" "p.quadrante = 'moonshot'" "quadrante"

CASOS=$((CASOS + 1))
node "$VALIDAR" "$EXEMPLO" >"$SAIDA/caso-$CASOS.log" 2>&1
if [ $? = 0 ] && grep -q "nao conferido" "$SAIDA/caso-$CASOS.log"; then
  echo "ok    sem --cascata: aprova, e diz que nao conferiu a amarracao"
else
  echo "FALHA sem --cascata deveria aprovar com aviso de nao conferido"; FALHOU=1
fi

echo "== mapas: os tres modos rodam =="
for modo in nova editar acompanhar; do
  if node "$AQUI/estado.mjs" --time fumaca --modo "$modo" --saida "$SAIDA/rumbo" >"$SAIDA/estado-$modo.log" 2>&1 && grep -q "gravar" "$SAIDA/estado-$modo.log"; then
    echo "ok    estado.mjs --modo $modo"
  else
    echo "FALHA estado.mjs --modo $modo (veja $SAIDA/estado-$modo.log)"; FALHOU=1
  fi
done
if node "$AQUI/estado.mjs" --time fumaca >/dev/null 2>&1; then
  echo "FALHA estado.mjs sem --modo deveria recusar"; FALHOU=1
else
  echo "ok    estado.mjs sem --modo recusa"
fi

echo "== tradutor: o rascunho vira as chamadas, sem gravar nada =="
node "$PLUGIN/modulos/productops/traduzir.mjs" "$EXEMPLO" --tatico --cascata-de "$CASCATA" --vinculos "$SAIDA/vinculos.json" >"$SAIDA/tatico.md" 2>&1
if grep -q "parentStrategyText" "$SAIDA/tatico.md" && grep -q "Decisão de matar ou seguir" "$SAIDA/tatico.md" && grep -q "aposta_resultado_criar" "$SAIDA/tatico.md"; then
  echo "ok    tese, marco de matar e resultado no rascunho das tools"
else
  echo "FALHA tradutor sem tese, marco ou resultado (veja $SAIDA/tatico.md)"; FALHOU=1
fi

echo
if [ "$FALHOU" = "0" ]; then
  echo "Fumaca aprovada: $CASOS caso(s) da regua, tres mapas, tradutor. Saida em $SAIDA."
else
  echo "Fumaca REPROVADA. Saida em $SAIDA."
  exit 1
fi
