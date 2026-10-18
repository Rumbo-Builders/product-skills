#!/usr/bin/env bash
# Teste de fumaça dos OKRs.
#
# A régua do rascunho é a mesma do envelope da estratégia (scripts/regras.cjs),
# e este script é o que impede ela de afrouxar sem ninguém ver: aprova o exemplo,
# reprova cada violação numa cópia mutada, confere os três mapas e o tradutor.
#
# Uso: bash fumaca.sh [diretorio-de-saida]
set -uo pipefail

AQUI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN="$(cd "$AQUI/../../.." && pwd)"
EXEMPLO="$AQUI/exemplo-okr.json"
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

# muta <exit> <rotulo> <js sobre o (objetivo, op o payload), k e b (os dois KRs)> [trecho]
muta() {
  local arq="$SAIDA/mut-$((CASOS + 1)).json"
  node -e "
const fs = require('fs');
const e = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
const o = e.itens[0], op = o.payload, k = e.itens[1], b = e.itens[2];
$3;
fs.writeFileSync(process.argv[2], JSON.stringify(e, null, 2));
" "$EXEMPLO" "$arq"
  espera "$1" "$2" "$arq" "${4:-}"
}

echo "== regua: o exemplo aprova =="
espera 0 "exemplo aprovado" "$EXEMPLO"

echo "== regua: cada violacao reprova =="
muta 1 "objetivo sem serve"              "delete op.serve"
muta 1 "objetivo servindo um kr"         "op.serve = 'kr-ativacoes-mes'"
muta 1 "kr sem objetivo"                 "delete k.payload.objetivo"
muta 1 "kr com objetivo de fora"         "k.payload.objetivo = 'okr-nao-existe'"
muta 1 "kr sem baseline"                 "delete k.payload.baseline"
muta 1 "kr sem meta"                     "delete k.payload.meta"
muta 1 "kr sem unidade"                  "delete k.payload.unidade"
muta 1 "kr com direcao invalida"         "k.payload.direcao = 'melhora'"
muta 1 "rota invalida"                   "op.rota = 'verde'"
muta 1 "rota sem motivo"                 "delete op.rota_motivo"
muta 1 "vocabulario proibido no kr"      "k.texto = 'Alavancar ativacoes'"

echo "== regua: o que so avisa nao reprova =="
muta 0 "objetivo servindo aposta e escolha" "op.serve = ['ap-pedido-por-foto', 'cap-onboarding-sem-gente']"
muta 0 "kr de entrega: aviso"            "k.texto = 'Lancar o onboarding sem vendedor'" "verbo de entrega"
muta 0 "objetivo com numero: aviso"      "o.texto = 'Chegar a 120 lojas ativas'" "objetivo com numero"
muta 0 "objetivo sem kr: aviso"          "e.itens = [o]" "objetivo sem KR"

CASOS=$((CASOS + 1))
node "$VALIDAR" "$EXEMPLO" >"$SAIDA/caso-$CASOS.log" 2>&1
if [ $? = 0 ] && grep -q "nao conferido" "$SAIDA/caso-$CASOS.log"; then
  echo "ok    sem --cascata: aprova, e diz que nao conferiu a amarracao"
else
  echo "FALHA sem --cascata deveria aprovar com aviso de nao conferido"; FALHOU=1
fi

echo "== mapas: os tres modos rodam =="
for modo in novo editar acompanhar; do
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
if grep -q "strategyConnection" "$SAIDA/tatico.md" && grep -q '"type": "BINARY"' "$SAIDA/tatico.md" && grep -q '"executionStatus": "ON_TRACK"' "$SAIDA/tatico.md"; then
  echo "ok    conexao com a estrategia, KR binario e rota no rascunho das tools"
else
  echo "FALHA tradutor sem conexao, KR binario ou rota (veja $SAIDA/tatico.md)"; FALHOU=1
fi

echo
if [ "$FALHOU" = "0" ]; then
  echo "Fumaca aprovada: $CASOS caso(s) da regua, tres mapas, tradutor. Saida em $SAIDA."
else
  echo "Fumaca REPROVADA. Saida em $SAIDA."
  exit 1
fi
