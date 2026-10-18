#!/usr/bin/env bash
# Teste de fumaça da estratégia.
#
# Três coisas, e cada uma é uma expectativa que falha em voz alta:
#   1. A régua aprova o exemplo.
#   2. A régua reprova cada violação, uma por vez, numa cópia mutada do exemplo.
#   3. O render guarda a v1 intacta sob a v2, com o seletor de versão.
#
# Critério que só existe em prosa não é aplicado. Este script é o que impede a
# régua de afrouxar sem ninguém perceber: afrouxou, um caso abaixo passa a sair
# com exit 0, e o teste reprova.
#
# Uso: bash fumaca.sh [diretorio-de-saida]
set -uo pipefail

AQUI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXEMPLO="$AQUI/exemplo-envelope-estrategia.json"
SAIDA="${1:-$(mktemp -d)}"
mkdir -p "$SAIDA"

if ! command -v node >/dev/null 2>&1; then
  echo "aviso: node nao encontrado. NADA FOI TESTADO. Nao trate isso como aprovado."
  exit 0
fi

FALHOU=0
CASOS=0

# espera <exit esperado> <rotulo> <arquivo> [args extras do validar]
espera() {
  local esperado="$1" rotulo="$2" arquivo="$3"
  shift 3
  CASOS=$((CASOS + 1))
  local log="$SAIDA/caso-$CASOS.log"
  bash "$AQUI/validar.sh" "$arquivo" "$@" >"$log" 2>&1
  local st=$?
  if [ "$st" = "$esperado" ]; then
    echo "ok    $rotulo"
  else
    echo "FALHA $rotulo: esperava exit $esperado, saiu $st (veja $log)"
    FALHOU=1
  fi
}

# muta <exit esperado> <rotulo> <js sobre e, com item(slug) a mao>
muta() {
  local esperado="$1" rotulo="$2" js="$3"
  local arq="$SAIDA/mut-$((CASOS + 1)).json"
  node -e "
const fs = require('fs');
const e = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
const item = (s) => e.itens.find((i) => i.slug === s);
$js;
fs.writeFileSync(process.argv[2], JSON.stringify(e, null, 2));
" "$EXEMPLO" "$arq"
  espera "$esperado" "$rotulo" "$arq"
}

echo "== regua: o exemplo aprova =="
espera 0 "exemplo aprovado" "$EXEMPLO"

# avisa <rotulo> <trecho do aviso> <js>: aprova, e o aviso aparece. Aviso que some
# em silencio e regua que afrouxou sem ninguem ver.
avisa() {
  local rotulo="$1" trecho="$2" js="$3"
  muta 0 "$rotulo" "$js"
  if ! grep -q "aviso:.*$trecho" "$SAIDA/caso-$CASOS.log"; then
    echo "FALHA $rotulo: aprovou, mas sem o aviso \"$trecho\" (veja $SAIDA/caso-$CASOS.log)"
    FALHOU=1
  fi
}

echo "== regua: cada violacao reprova, uma por vez =="
muta 1 "kind errado"                       "e.kind = 'one_page'"
muta 1 "slug duplicado"                    "e.itens[1].slug = e.itens[0].slug"
muta 1 "slug fora do formato"              "e.itens[0].slug = 'Asp Dono'"
muta 1 "texto vazio"                       "e.itens[0].texto = ''"
muta 1 "escolha sem fonte"                 "delete item('asp-dono-decide-sem-planilha').payload.fonte"
muta 1 "estagio invalido"                  "item('cap-onboarding-sem-gente').payload.estagio = 'pilar'"
muta 1 "onde jogar sem serve"              "delete item('oj-distribuidoras-regionais').payload.serve"
muta 1 "serve pulando um estagio"          "item('cap-onboarding-sem-gente').payload.serve = 'asp-dono-decide-sem-planilha'"
muta 1 "serve para slug inexistente"       "item('cg-integracao-em-um-dia').payload.serve = 'nao-existe'"
muta 1 "estado de escolha invalido"        "item('cg-integracao-em-um-dia').payload.estado = 'pausada'"
muta 1 "aposta sem serve"                  "delete item('ap-pedido-por-foto').payload.serve"
muta 1 "aposta servindo uma aposta"        "item('ap-pedido-por-foto').payload.serve = 'ap-plano-plus'"
muta 1 "aposta sem hipotese"               "delete item('ap-pedido-por-foto').payload.hipotese"
muta 1 "aposta sem indicador"              "delete item('ap-pedido-por-foto').payload.indicador"
muta 1 "aposta sem criterio de matar"      "delete item('ap-pedido-por-foto').payload.criterio_matar"
muta 1 "aposta sem horizonte"              "delete item('ap-plano-plus').payload.horizonte"
muta 1 "okr servindo um kr"                "item('okr-base-que-paga').payload.serve = 'kr-ativacoes-mes'"
muta 1 "kr sem baseline"                   "delete item('kr-ativacoes-mes').payload.baseline"
muta 1 "kr sem unidade"                    "delete item('kr-ativacoes-mes').payload.unidade"
muta 1 "kr com direcao invalida"           "item('kr-churn-cotacao').payload.direcao = 'melhora'"
muta 1 "kr com objetivo que nao e okr"     "item('kr-churn-cotacao').payload.objetivo = 'ap-plano-plus'"
muta 1 "premissa sem teste"                "delete item('prem-industria-paga-por-loja').payload.teste"
muta 1 "premissa sobre slug inexistente"   "item('prem-industria-paga-por-loja').payload.sobre = 'x'"
muta 1 "pergunta sem destinatario"         "item('quem-arbitra-preco-do-plus').escala_para = []"
muta 1 "risco sem impacto"                 "delete item('onboarding-fora-do-sprint').payload.impacto"
muta 1 "decisao sem genero valido"         "item('onboarding-fora-do-sprint').genero = 'alerta'"
muta 1 "publicar sem insight"              "e.insight = ''"
muta 1 "publicar sem elo mais fraco"       "delete e.meta.elo_mais_fraco"
muta 1 "elo mais fraco apontando um kr"    "e.meta.elo_mais_fraco = 'kr-ativacoes-mes'"
muta 1 "publicar sem como ganhar vigente"  "item('cg-integracao-em-um-dia').payload.estado = 'abandonada'"
muta 1 "tabela markdown no corpo"          "e.body_md += '\n| a | b |\n|---|---|\n'"
muta 1 "travessao na renuncia"             "item('cg-integracao-em-um-dia').payload.renuncia = 'Nao vender — nunca'"
muta 1 "pontuacao em serie no insight"     "e.insight = 'Mudou tudo?!'"
muta 1 "vocabulario proibido na hipotese"  "item('ap-plano-plus').payload.hipotese = 'Se alavancarmos o giro, entao 20% pagam, porque sim'"
muta 1 "holistica com acento no corpo"     "e.body_md += '\\nUma visão de forma holística do ciclo.'"
muta 1 "kind desconhecido"                 "e.itens.push({ kind: 'iniciativa', slug: 'x-1', texto: 'x' })"
muta 1 "serve em lista com um estagio errado" "item('cap-onboarding-sem-gente').payload.serve = ['cg-integracao-em-um-dia', 'asp-dono-decide-sem-planilha']"
muta 1 "decisao com sobre inexistente"     "item('rodada-de-preco-por-loja').payload.sobre = 'nao-existe'"

echo "== regua: o que so avisa nao reprova =="
muta 0 "capacidade servindo dois como ganhar" "e.itens.push({ kind: 'escolha', slug: 'cg-dois', texto: 'Outro caminho', payload: { estagio: 'como_ganhar', serve: 'oj-distribuidoras-regionais', fonte: 'Ata de 2026-09-28', estado: 'vigente' } }); item('cap-onboarding-sem-gente').payload.serve = ['cg-integracao-em-um-dia', 'cg-dois']"
muta 0 "uma premissa so: aprova sem aviso de contagem" "e.itens = e.itens.filter((i) => i.slug !== 'prem-loja-fotografa-o-bloco')"
muta 0 "escolha sem renuncia: o padrao, aprova" "delete item('cg-integracao-em-um-dia').payload.renuncia"
avisa "prefixo Proposta no texto: aviso"   "comeca com"     "item('cg-integracao-em-um-dia').payload.renuncia = 'Proposta: nao vender para rede'"
avisa "recorte repetido: aviso"            "recorte"        "e.itens.filter((i) => i.payload?.estagio === 'onde_jogar').forEach((i) => { i.payload.recorte = 'Canal'; }); e.itens.push({ kind: 'escolha', slug: 'oj-dois', texto: 'Outro canal', payload: { estagio: 'onde_jogar', recorte: 'canal', serve: 'asp-dono-decide-sem-planilha', fonte: 'Ata de 2026-09-28', estado: 'vigente' } })"
muta 0 "duas capacidades: aviso"           "item('cap-cobranca-sem-boleto').payload.estado = 'abandonada'"
muta 0 "sistema declarado: aviso"          "e.itens.push({ kind: 'escolha', slug: 'sis-comite', texto: 'Comite quinzenal', payload: { estagio: 'sistema', serve: 'cap-onboarding-sem-gente', fonte: 'Ata de 2026-09-28', estado: 'vigente' } })"
muta 0 "mais de 4 decisoes: aviso"         "e.itens.push({ kind: 'decisao', slug: 'd-4', texto: 'x', genero: 'proximo_passo' }, { kind: 'decisao', slug: 'd-5', texto: 'y', genero: 'proximo_passo' })"
muta 0 "hipotese sem porque: aviso"        "item('ap-plano-plus').payload.hipotese = 'Se sugerir, entao pagam'"
muta 0 "quadrante fora da lista: aviso"    "item('ap-plano-plus').payload.quadrante = 'moonshot'"
muta 0 "rascunho sem insight: so publicado exige" "delete e.status; e.insight = ''"
muta 0 "situacao fora da lista: aviso"       "item('cap-onboarding-sem-gente').payload.situacao = 'limita'"
muta 0 "proposta pendente ao publicar: aviso" "item('cg-integracao-em-um-dia').payload.propostas = ['renuncia']"
muta 0 "elo mais fraco pode ser premissa"    "e.meta.elo_mais_fraco = 'prem-industria-paga-por-loja'"
muta 1 "elo mais fraco nao pode ser decisao" "e.meta.elo_mais_fraco = 'quem-arbitra-preco-do-plus'"

echo "== heranca: proposta nao confirmada nao atravessa a versao =="
node "$AQUI/base.mjs" --time fumaca --de "$EXEMPLO" --saida "$SAIDA/rumbo" >"$SAIDA/base.log" 2>&1
if node -e "
const e = JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'));
const a = e.itens.find((i) => i.slug === 'ap-plano-plus');
process.exit(a && a.payload.criterio_matar === undefined && a.payload.propostas === undefined && a.payload.hipotese ? 0 : 1);
" "$SAIDA/rumbo/base-estrategia-fumaca.json" && grep -q 'proposta do modelo' "$SAIDA/base.log"; then
  echo "ok    base.mjs tira o campo proposto e diz em voz alta"
else
  echo "FALHA base.mjs herdou campo proposto sem confirmacao (veja $SAIDA/base.log)"; FALHOU=1
fi

echo "== render: a v1 fica intacta sob a v2 =="
RENDER="$AQUI/render.mjs"
# Sem marca nem tema, de proposito: o teste nao pode depender do .rumbo de quem roda.
SEM="$SAIDA/nao-existe.json"
node "$RENDER" --estrategia "$EXEMPLO" --marca "$SEM" --tema "$SEM" --config "$SEM" --saida "$SAIDA/v1.html" >"$SAIDA/render-v1.log" 2>&1 \
  || { echo "FALHA render da v1 (veja $SAIDA/render-v1.log)"; FALHOU=1; }

node - "$SAIDA/v1.html" "$SAIDA/anterior.json" <<'NODE'
const fs = require('fs');
const h = fs.readFileSync(process.argv[2], 'utf8');
const m = h.match(/id="rumbo-envelopes">([\s\S]*?)<\/script>/);
if (!m) { console.log('FALHA bloco rumbo-envelopes ausente na v1'); process.exit(1); }
fs.writeFileSync(process.argv[3], m[1].replace(/<\\\//g, '</'));
NODE
[ $? = 0 ] && echo "ok    v1 renderizada com o bloco de historico" || FALHOU=1

node -e "
const fs = require('fs');
const e = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
e.insight = 'Segunda versao: a aposta do plano pago morreu no criterio de matar.';
e.itens.find((i) => i.slug === 'ap-plano-plus').payload.estado = 'morta';
e.itens.find((i) => i.slug === 'cap-cobranca-sem-boleto').payload.estado = 'abandonada';
e.itens = e.itens.filter((i) => i.slug !== 'prem-loja-fotografa-o-bloco');
fs.writeFileSync(process.argv[2], JSON.stringify(e, null, 2));
" "$EXEMPLO" "$SAIDA/v2.json"

espera 0 "v2 valida com --anterior" "$SAIDA/v2.json" --anterior "$SAIDA/anterior.json"
if grep -q 'prem-loja-fotografa-o-bloco.*sumiu sem estado de saida' "$SAIDA/caso-$CASOS.log"; then
  echo "ok    v2 avisa o slug que sumiu sem estado de saida"
else
  echo "FALHA v2 nao avisou o slug que sumiu (veja $SAIDA/caso-$CASOS.log)"; FALHOU=1
fi

node "$RENDER" --estrategia "$SAIDA/v2.json" --anterior "$SAIDA/anterior.json" --marca "$SEM" --tema "$SEM" --config "$SEM" --saida "$SAIDA/v2.html" >"$SAIDA/render-v2.log" 2>&1 \
  || { echo "FALHA render da v2 (veja $SAIDA/render-v2.log)"; FALHOU=1; }

node - "$SAIDA/v1.html" "$SAIDA/v2.html" <<'NODE'
const fs = require('fs');
const bloco = (f) => JSON.parse(fs.readFileSync(f, 'utf8').match(/id="rumbo-envelopes">([\s\S]*?)<\/script>/)[1].replace(/<\\\//g, '</'));
const h = fs.readFileSync(process.argv[3], 'utf8');
const a = bloco(process.argv[2]);
const b = bloco(process.argv[3]);
let falhou = 0;
const checa = (cond, rotulo) => { console.log(`${cond ? 'ok   ' : 'FALHA'} ${rotulo}`); if (!cond) falhou = 1; };
checa(b.estrategia.atual.versao === 2, 'a pagina da v2 carrega a v2 como atual');
checa((h.match(/class="versao"/g) || []).length === 2 && (h.match(/<option/g) || []).length === 2, 'dois blocos de versao e duas opcoes no seletor');
checa(JSON.stringify(b.estrategia.historico[0].envelope) === JSON.stringify(a.estrategia.atual.envelope), 'o envelope da v1 no historico e identico ao publicado');
checa(/marca-estado">abandonada</.test(h), 'escolha abandonada leva a palavra, nao so o risco');
checa(/class="aposta morta"/.test(h) && /class="estado morta">morta</.test(h), 'aposta morta leva a palavra');
checa(/Elo mais fraco</.test(h), 'o elo mais fraco esta rotulado');
checa(/proposta do modelo: morre se</.test(h), 'campo proposto leva pilula com a palavra');
checa(/situacao nao_existe">não existe</.test(h), 'situacao da capacidade sai com a palavra');
checa(/<details class="recolhido">/.test(h) && /<h3>Para ceo<\/h3>/.test(h), 'perguntas agrupadas por destinatario e o resto recolhido');
checa(!/serve <code>/.test(h), 'nenhum slug cru de pai na tela');
checa((h.match(/sem leitura</g) || []).length > 0, 'KR sem one page diz "sem leitura", nao fica vazio');
checa(/aviso-versao/.test(h), 'a v1 antiga carrega o aviso de versao anterior');
process.exit(falhou);
NODE
[ $? = 0 ] || FALHOU=1

echo "== seguranca: texto envenenado nao sai cru =="
node "$AQUI/../../../scripts/veneno.cjs" "$EXEMPLO" "$SAIDA/veneno.json"
node "$RENDER" --estrategia "$SAIDA/veneno.json" --marca "$SEM" --tema "$SEM" --config "$SEM" --saida "$SAIDA/veneno.html" >/dev/null 2>&1
if grep -q '<img src=x' "$SAIDA/veneno.html" || grep -q '<script>alert' "$SAIDA/veneno.html"; then
  echo "FALHA HTML envenenado saiu cru na pagina (veja $SAIDA/veneno.html)"; FALHOU=1
else
  echo "ok    nenhum campo envenenado sai cru"
fi

echo "== estado: o mapa roda =="
if node "$AQUI/estado.mjs" --time fumaca --saida "$SAIDA/rumbo" >"$SAIDA/estado.log" 2>&1 && grep -q 'cascata' "$SAIDA/estado.log"; then
  echo "ok    estado.mjs imprime o mapa"
else
  echo "FALHA estado.mjs (veja $SAIDA/estado.log)"; FALHOU=1
fi

echo
if [ "$FALHOU" = "0" ]; then
  echo "Fumaca aprovada: $CASOS caso(s) da regua, render em duas versoes, estado. Saida em $SAIDA."
  echo "O que a maquina nao ve continua com voce: abra $SAIDA/v2.html e olhe as duas abas e o seletor."
else
  echo "Fumaca REPROVADA. Veja os logs em $SAIDA."
fi
exit $FALHOU
