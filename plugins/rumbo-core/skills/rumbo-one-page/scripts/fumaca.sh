#!/usr/bin/env bash
# Teste de fumaça do one page, por tipo de time.
#
# Aprova os três exemplos (produto, marketing, jurídico), reprova cada violação
# de desenho e de bloco numa cópia mutada, confere os quatro modos do mapa, o
# esqueleto e a herança. Régua que afrouxa sem ninguém perceber é o que ele
# existe para pegar.
#
# Uso: bash fumaca.sh [diretorio-de-saida]
set -uo pipefail

AQUI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MKT="$AQUI/exemplo-envelope-marketing.json"
JUR="$AQUI/exemplo-envelope-juridico.json"
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
  bash "$AQUI/validar.sh" "$arquivo" >"$log" 2>&1
  local st=$?
  if [ "$st" != "$esperado" ]; then
    echo "FALHA $rotulo: esperava exit $esperado, saiu $st (veja $log)"; FALHOU=1
  elif [ -n "$trecho" ] && ! grep -q "$trecho" "$log"; then
    echo "FALHA $rotulo: sem \"$trecho\" na saida (veja $log)"; FALHOU=1
  else
    echo "ok    $rotulo"
  fi
}

# muta <exit> <rotulo> <base> <js sobre e, com item(slug)> [trecho]
muta() {
  local arq="$SAIDA/mut-$((CASOS + 1)).json"
  node -e "
const fs = require('fs');
const e = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
const item = (s) => e.itens.find((i) => i.slug === s);
const aba = (s) => e.meta.desenho.abas.find((a) => a.slug === s);
$4;
fs.writeFileSync(process.argv[2], JSON.stringify(e, null, 2));
" "$3" "$arq"
  espera "$1" "$2" "$arq" "${5:-}"
}

echo "== regua: os tres exemplos aprovam =="
espera 0 "produto, sem desenho" "$AQUI/exemplo-envelope.json"
espera 0 "marketing" "$MKT"
espera 0 "juridico, com a definir avisando" "$JUR" "a definir"

echo "== regua: o desenho =="
muta 1 "bloco fora do catalogo"          "$MKT" "aba('one-page').blocos.push({ tipo: 'mural' })"
muta 1 "primeira aba sem decisoes"       "$MKT" "aba('one-page').blocos = [{ tipo: 'insight' }, { tipo: 'objetivos' }, { tipo: 'indicadores' }]; aba('outras').blocos.push({ tipo: 'decisoes' })"
muta 1 "bloco repetido"                  "$MKT" "aba('outras').blocos.push({ tipo: 'acoes' })"
muta 1 "roadmap com corte invalido"      "$MKT" "aba('outras').blocos.push({ tipo: 'roadmap', corte: 'medio' })"
muta 1 "sete abas"                       "$MKT" "for (let n = 0; n < 4; n++) e.meta.desenho.abas.push({ slug: 'a' + n, titulo: 'A' + n, blocos: [] })"
muta 1 "alca sem o bloco no desenho"     "$MKT" "aba('acoes').blocos = [{ tipo: 'acoes' }]"
muta 1 "slug de aba fora do formato"     "$MKT" "aba('outras').slug = 'x</script>'"
muta 0 "nucleo solto: aprova"            "$MKT" "aba('one-page').blocos = [{ tipo: 'insight' }, { tipo: 'objetivos' }, { tipo: 'indicadores' }, { tipo: 'trilha_mensal' }, { tipo: 'saude' }, { tipo: 'decisoes' }]"

echo "== regua: cada bloco =="
muta 1 "acao com status fora da lista"   "$MKT" "item('acao-fala-feira-varejo').payload.status = 'feito'"
muta 1 "acao sem prazo"                  "$MKT" "delete item('acao-fala-feira-varejo').payload.prazo"
muta 1 "acao movendo kr inexistente"     "$MKT" "item('acao-fala-feira-varejo').payload.kr = 'kr-nao-existe'"
muta 0 "acao sem kr: aviso"              "$MKT" "delete item('acao-fala-feira-varejo').payload.kr" "sem kr"
muta 0 "acao cancelada: aprova"          "$MKT" "item('acao-caso-de-cliente').payload.status = 'cancelado'"
muta 1 "meta do mes com kr inexistente"  "$MKT" "item('kr-cadastros-mes-2026-11').payload.kr = 'x'"
muta 1 "meta do mes com periodo invalido" "$MKT" "item('kr-cadastros-mes-2026-11').payload.periodo = 'novembro'"
muta 1 "meta do mes com alvo em texto"   "$MKT" "item('kr-cadastros-mes-2026-11').payload.alvo = 'uns 300'"
muta 1 "realizado sem fonte"             "$MKT" "delete item('kr-cadastros-mes-2026-10').payload.fonte"
muta 1 "verba sem fonte"                 "$MKT" "delete item('verba-google-nov').payload.fonte"
muta 1 "verba com aprovado em texto"     "$MKT" "item('verba-google-nov').payload.aprovado = '4 mil'"
muta 1 "total de verba que nao fecha"    "$MKT" "e.meta.verba_total = 20000" "nao fecha"
muta 1 "rota fora da lista"              "$MKT" "item('kr-cadastros-mes').payload.rota = 'verde'"
muta 1 "rota sem motivo"                 "$MKT" "delete item('kr-cadastros-mes').payload.rota_motivo"
muta 1 "checklist sem dono"              "$JUR" "delete item('chk-canal-de-denuncia').payload.dono"
muta 1 "checklist em andamento"          "$JUR" "item('chk-canal-de-denuncia').payload.feito = 'em andamento'"
muta 0 "checklist vencido: aviso"        "$JUR" "item('chk-canal-de-denuncia').payload.prazo = '2026-01-10'" "vencido"
muta 1 "funil sem regra"                 "$MKT" "aba('outras').blocos.push({ tipo: 'funil' }); e.itens.push({ kind: 'funil', slug: 'f1', texto: 'Contato', payload: { ordem: 1, contagem: 3 } })"
muta 1 "travessao numa acao"             "$MKT" "item('acao-fala-feira-varejo').texto = 'Fala na feira — regional'"

echo "== mapas: os quatro modos =="
CFG="$SAIDA/config-juridico.json"
node -e "const fs=require('fs');const e=JSON.parse(fs.readFileSync(process.argv[1]));fs.writeFileSync(process.argv[2],JSON.stringify({desenho:e.meta.desenho}))" "$JUR" "$CFG"
node "$AQUI/estado.mjs" --time fumaca --config "$CFG" --saida "$SAIDA/rumbo" >"$SAIDA/estado-semana.log" 2>&1
if grep -q "checklist" "$SAIDA/estado-semana.log" && ! grep -q "roadmap " "$SAIDA/estado-semana.log"; then
  echo "ok    semana do juridico: tem checklist e nao tem roadmap"
else
  echo "FALHA o mapa da semana nao saiu do desenho (veja $SAIDA/estado-semana.log)"; FALHOU=1
fi
if node "$AQUI/estado.mjs" --time "x/../../fora" --saida "$SAIDA/rumbo" >/dev/null 2>&1; then
  echo "FALHA --time com ../ deveria recusar"; FALHOU=1
else
  echo "ok    --time com ../ recusa, e nada e escrito fora do .rumbo"
fi
for modo in desenhar leitura reformar; do
  if node "$AQUI/estado.mjs" --time fumaca --modo "$modo" --saida "$SAIDA/rumbo" >"$SAIDA/estado-$modo.log" 2>&1; then
    echo "ok    estado.mjs --modo $modo"
  else
    echo "FALHA estado.mjs --modo $modo (veja $SAIDA/estado-$modo.log)"; FALHOU=1
  fi
done

echo "== render: os desenhos e o esqueleto =="
SEM="$SAIDA/nao-existe.json"
for t in marketing juridico; do
  node "$AQUI/render.mjs" --one-page "$AQUI/exemplo-envelope-$t.json" --marca "$SEM" --tema "$SEM" --config "$SEM" --saida "$SAIDA/$t.html" >"$SAIDA/render-$t.log" 2>&1
  if grep -q 'data-alvo="acoes"' "$SAIDA/$t.html" && grep -q "Ações para chegar lá" "$SAIDA/$t.html"; then
    echo "ok    $t: as abas do desenho na pagina"
  else
    echo "FALHA $t: a pagina nao tem as abas do desenho (veja $SAIDA/render-$t.log)"; FALHOU=1
  fi
done
grep -q 'class="a-definir"' "$SAIDA/juridico.html" && echo "ok    a definir sai escrito, nao vazio" || { echo "FALHA a definir nao aparece escrito"; FALHOU=1; }
grep -q "R\$ 18.000" "$SAIDA/marketing.html" && echo "ok    a verba soma o total do trimestre" || { echo "FALHA o total da verba nao aparece"; FALHOU=1; }
grep -q "assinatura" "$SAIDA/marketing.html" && echo "ok    a assinatura sai por padrao" || { echo "FALHA sem assinatura"; FALHOU=1; }
echo '{"assinatura": false}' > "$SAIDA/sem-assinatura.json"
node "$AQUI/render.mjs" --one-page "$MKT" --marca "$SEM" --tema "$SEM" --config "$SAIDA/sem-assinatura.json" --saida "$SAIDA/sem.html" >/dev/null 2>&1
grep -q 'class="assinatura"' "$SAIDA/sem.html" && { echo "FALHA a casa nao conseguiu desligar a assinatura"; FALHOU=1; } || echo "ok    a casa desliga a assinatura"
node "$AQUI/render.mjs" --esqueleto comercial --marca "$SEM" --tema "$SEM" --config "$SEM" --saida "$SAIDA/esqueleto.html" >/dev/null 2>&1
grep -q "Esqueleto" "$SAIDA/esqueleto.html" && grep -q "Pipeline" "$SAIDA/esqueleto.html" && echo "ok    esqueleto do comercial, com o aviso e o funil" || { echo "FALHA esqueleto"; FALHOU=1; }

echo "== seguranca: texto envenenado nao sai cru =="
VENENO="$AQUI/../../../scripts/veneno.cjs"
for t in exemplo-envelope exemplo-envelope-marketing exemplo-envelope-juridico; do
  node "$VENENO" "$AQUI/$t.json" "$SAIDA/veneno-$t.json"
  node "$AQUI/render.mjs" --one-page "$SAIDA/veneno-$t.json" --roadmap "$AQUI/exemplo-envelope-roadmap.json" --marca "$SEM" --tema "$SEM" --config "$SEM" --saida "$SAIDA/veneno-$t.html" >/dev/null 2>&1
  if grep -q '<img src=x' "$SAIDA/veneno-$t.html" || grep -q '<script>alert' "$SAIDA/veneno-$t.html"; then
    echo "FALHA $t: HTML envenenado saiu cru na pagina (veja $SAIDA/veneno-$t.html)"; FALHOU=1
  else
    echo "ok    $t: nenhum campo envenenado sai cru"
  fi
done

echo "== heranca: o desenho atravessa, o numero da semana nao =="
# O caminho vai por ambiente: como argumento, o base.mjs acharia que foi chamado direto.
if BASE="$AQUI/base.mjs" node --input-type=module -e "
import { readFileSync } from 'node:fs';
const { herdar } = await import(process.env.BASE);
const e = JSON.parse(readFileSync(process.argv[1], 'utf8'));
const r = herdar(e, 'marketing');
const f = r.envelope;
const mes = new Date().toISOString().slice(0, 7);
const aberto = f.itens.filter((i) => ['meta_mes', 'verba'].includes(i.kind) && i.payload?.periodo >= mes && i.payload?.realizado !== undefined);
process.exit(f.meta.desenho && !aberto.length && f.itens.some((i) => i.kind === 'acao') ? 0 : 1);
" "$MKT"; then
  echo "ok    base.mjs herda o desenho e tira o realizado do mes aberto"
else
  echo "FALHA heranca do desenho ou do realizado"; FALHOU=1
fi

echo
if [ "$FALHOU" = "0" ]; then
  echo "Fumaca aprovada: $CASOS caso(s) da regua, quatro modos, render e heranca. Saida em $SAIDA."
  echo "O que a maquina nao ve continua com voce: abra $SAIDA/marketing.html e $SAIDA/juridico.html e olhe as abas."
else
  echo "Fumaca REPROVADA. Saida em $SAIDA."
  exit 1
fi
