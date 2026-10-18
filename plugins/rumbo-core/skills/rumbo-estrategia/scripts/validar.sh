#!/usr/bin/env bash
# Régua executável da estratégia.
#
# Critério que só existe em prosa não é aplicado. O que a máquina vê, reprova
# aqui; o que ela não vê (se a renúncia dói, se o como ganhar sobrevive à
# imitação, se o KR é outcome, se o elo mais fraco é mesmo o mais fraco) a skill
# manda a pessoa olhar, e nunca reporta como conferido.
#
# Uso: bash validar.sh envelope-estrategia.json [--anterior anterior-estrategia.json]
#
# `--anterior` liga o aviso de slug que sumiu sem estado de saída. Sem ele, o
# script diz que não conferiu isso, em vez de calar.
set -uo pipefail

ENV_JSON="${1:-envelope-estrategia.json}"
ANTERIOR=""
shift || true
while [ $# -gt 0 ]; do
  case "$1" in
    --anterior) ANTERIOR="${2:-}"; shift 2 ;;
    *) shift ;;
  esac
done

if [ ! -f "$ENV_JSON" ]; then
  echo "FALHA: arquivo '$ENV_JSON' nao existe."
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "aviso: node nao encontrado. Nao da para validar o envelope."
  exit 0
fi

FALHOU=0

echo "== estrutura =="
# O nome do arquivo vai por argumento, nunca dentro do codigo: um nome com aspa
# viraria codigo executado.
if ! node -e "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'))" "$ENV_JSON" 2>/dev/null; then
  echo "FALHA: '$ENV_JSON' nao e JSON valido."
  exit 1
fi
echo "ok: JSON valido"

# ---------------------------------------------------------------------------
# As alças, a cadeia e a publicação
# ---------------------------------------------------------------------------

echo "== envelope =="
# `node -` le o script do stdin, entao process.argv[1] e "-" e o arquivo cai em
# argv[2]. Errar isso fazia o bloco crashar e o script seguir reportando "ok":
# silencio virando aprovacao, que e o pior defeito possivel numa regua.
# A regua de aposta, objetivo e KR mora no plugin, em scripts/regras.cjs: as
# skills de apostas e de OKRs usam a mesma, e regra escrita em dois lugares diverge.
REGRAS="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../scripts" && pwd)/regras.cjs"
SAIDA=$(RUMBO_REGRAS="$REGRAS" node - "$ENV_JSON" "$ANTERIOR" <<'NODE'
const fs = require('fs');
const regras = require(process.env.RUMBO_REGRAS);
const env = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const anteriorArq = process.argv[3] || '';
const problemas = [];
const avisos = [];

const ESTAGIOS = ['aspiracao', 'onde_jogar', 'como_ganhar', 'capacidade', 'sistema'];
const ACIMA = { onde_jogar: 'aspiracao', como_ganhar: 'onde_jogar', capacidade: 'como_ganhar', sistema: 'capacidade' };
const ESTADO_ESCOLHA = ['vigente', 'revisada', 'abandonada'];
const { ESTADO_APOSTA, servesDe } = regras;
const ESTADO_PREMISSA = ['aberta', 'confirmada', 'refutada'];
const GENEROS = ['decisao_roadmap', 'risco', 'pergunta', 'nota_metodo', 'dependencia', 'proximo_passo'];
const KINDS = ['escolha', 'aposta', 'okr', 'kr', 'premissa', 'decisao'];
const SAIDA_ESCOLHA = ['abandonada'];
const SAIDA_APOSTA = ['morta', 'concluida', 'validada'];
const SAIDA_PREMISSA = ['refutada', 'confirmada'];
const SITUACOES = ['existe', 'em_construcao', 'nao_existe'];

if (env.kind !== 'estrategia') problemas.push(`kind "${env.kind}" nao e "estrategia"`);

const itens = Array.isArray(env.itens) ? env.itens : [];
const falta = (v) => v == null || !String(v).trim();

// Identificador estavel: sem ele o historico do item se perde entre versoes.
const porSlug = new Map();
itens.forEach((i, n) => {
  if (!i.slug || !/^[a-z0-9][a-z0-9-]{0,119}$/.test(i.slug)) {
    problemas.push(`itens[${n}]: identificador ausente ou fora do formato (minusculas e hifens)`);
  } else if (porSlug.has(i.slug)) {
    problemas.push(`itens[${n}]: identificador duplicado "${i.slug}"`);
  } else porSlug.set(i.slug, i);
  if (falta(i.texto)) problemas.push(`itens[${n}]: texto vazio`);
});

const existe = (s) => porSlug.has(s);
const kindDe = (s) => porSlug.get(s)?.kind;
const estagioDe = (s) => porSlug.get(s)?.payload?.estagio;
const ctx = { existe, kindDe };
const junta = (r) => { problemas.push(...r.problemas); avisos.push(...r.avisos); };

itens.forEach((i, n) => {
  const p = i.payload ?? {};
  const id = `itens[${n}]${i.slug ? ` ${i.slug}` : ''}`;
  switch (i.kind) {
    case 'escolha': {
      if (!ESTAGIOS.includes(p.estagio)) {
        problemas.push(`${id}: escolha sem estagio valido (${ESTAGIOS.join(', ')})`);
        break;
      }
      // Renuncia so quando essencial: escrever o "fora" de toda escolha e redundancia.
      // O teste do oposto continua sendo a pergunta da conducao, nao um campo.
      if (!falta(p.recorte) && p.estagio !== 'onde_jogar')
        avisos.push(`${id}: recorte e rotulo de onde jogar; em ${p.estagio} ele e ignorado`);
      if (falta(p.fonte)) problemas.push(`${id}: escolha sem fonte. Sem fonte nao entra`);
      if (p.estado && !ESTADO_ESCOLHA.includes(p.estado))
        problemas.push(`${id}: estado "${p.estado}" fora de ${ESTADO_ESCOLHA.join(', ')}`);
      if (p.situacao && !SITUACOES.includes(p.situacao))
        avisos.push(`${id}: situacao "${p.situacao}" fora de ${SITUACOES.join(', ')}; a lente do gap so funciona com os tres valores`);
      if (p.estagio === 'aspiracao') {
        if (p.serve) avisos.push(`${id}: aspiracao nao serve ninguem; o campo serve e ignorado`);
      } else if (!servesDe(p).length) {
        problemas.push(`${id}: ${p.estagio} sem serve: a escolha de cima que ela sustenta`);
      } else {
        // serve pode listar mais de uma escolha, todas do estagio de cima.
        for (const sv of servesDe(p)) {
          if (!existe(sv) || kindDe(sv) !== 'escolha') problemas.push(`${id}: serve aponta "${sv}", que nao e uma escolha deste envelope`);
          else if (estagioDe(sv) !== ACIMA[p.estagio]) problemas.push(`${id}: ${p.estagio} serve "${sv}" (${estagioDe(sv)}), e so pode servir ${ACIMA[p.estagio]}`);
        }
      }
      break;
    }
    case 'aposta': junta(regras.validarAposta(i, id, ctx)); break;
    case 'okr': junta(regras.validarOkr(i, id, ctx)); break;
    case 'kr': junta(regras.validarKr(i, id, ctx)); break;
    case 'premissa': {
      if (falta(p.sobre)) problemas.push(`${id}: premissa sem sobre`);
      else if (!existe(p.sobre) || !['escolha', 'aposta'].includes(kindDe(p.sobre)))
        problemas.push(`${id}: sobre aponta "${p.sobre}", que nao e escolha nem aposta deste envelope`);
      if (falta(p.teste)) problemas.push(`${id}: premissa sem teste. Premissa sem teste e esperanca`);
      if (p.estado && !ESTADO_PREMISSA.includes(p.estado))
        problemas.push(`${id}: estado "${p.estado}" fora de ${ESTADO_PREMISSA.join(', ')}`);
      break;
    }
    case 'decisao': {
      const g = i.genero;
      if (!GENEROS.includes(g)) {
        problemas.push(`${id}: decisao sem genero valido`);
      } else {
        if (g === 'pergunta' && !(i.escala_para || []).length)
          problemas.push(`${id}: pergunta sem destinatario, nunca sera respondida`);
        if (g === 'risco' && !p.impacto)
          problemas.push(`${id}: risco sem impacto declarado`);
        if (g === 'decisao_roadmap' && !i.afeta_roadmap_slug)
          problemas.push(`${id}: decisao de roadmap sem dizer o que move`);
      }
      // A ancora diz de qual trecho a decisao trata; a tela mostra o item ali.
      if (!falta(p.sobre) && !(existe(p.sobre) && ['escolha', 'premissa'].includes(kindDe(p.sobre))))
        problemas.push(`${id}: sobre aponta "${p.sobre}", que nao e escolha nem premissa deste envelope`);
      break;
    }
    default:
      problemas.push(`${id}: kind "${i.kind}" desconhecido (${KINDS.join(', ')})`);
  }
});

// A cascata que a publicacao exige, e as cardinalidades que so avisam.
const vigentes = (est) =>
  itens.filter((i) => i.kind === 'escolha' && i.payload?.estagio === est && (i.payload?.estado ?? 'vigente') !== 'abandonada');

if (env.status === 'published') {
  if (falta(env.insight)) problemas.push('publicar sem insight: e a primeira coisa que o leitor ve');
  const elo = env.meta?.elo_mais_fraco;
  if (falta(elo)) problemas.push('publicar sem meta.elo_mais_fraco: versao sem elo mais fraco e versao que nao foi lida');
  else if (!existe(elo) || !['escolha', 'aposta', 'premissa'].includes(kindDe(elo)))
    problemas.push(`meta.elo_mais_fraco aponta "${elo}", que nao e escolha, aposta nem premissa deste envelope`);
  for (const est of ['aspiracao', 'onde_jogar', 'como_ganhar'])
    if (!vigentes(est).length) problemas.push(`publicar sem escolha vigente em ${est}`);

  // Proposta do modelo nao vira declaracao por omissao. O campo entra preenchido,
  // mas marcado; publicar com proposta pendente e publicar o que ninguem declarou.
  const pendentes = [];
  for (const i of itens) for (const c of i.payload?.propostas ?? []) pendentes.push(`${i.slug}.${c}`);
  for (const c of env.meta?.propostas ?? []) pendentes.push(`meta.${c}`);
  if (pendentes.length)
    avisos.push(`${pendentes.length} campo(s) ainda sao proposta do modelo, nao confirmada pela lideranca: ${pendentes.join(', ')}. A revisao seguinte nao os herda`);
}

// O prefixo antigo: "Proposta:" no texto some na primeira edicao, e a proposta
// vira declaracao sem ninguem ter dito. O lugar dela e o campo propostas.
for (const i of itens)
  for (const [c, v] of [['texto', i.texto], ...['renuncia', 'teste', 'criterio_matar'].map((k) => [k, i.payload?.[k]])])
    if (typeof v === 'string' && /^\s*propost[ao]\b/i.test(v))
      avisos.push(`${i.slug}.${c}: comeca com "Proposta". Tire o prefixo e liste o campo em payload.propostas, ou confirme com a lideranca`);

// Dois onde jogar com o mesmo recorte e um recorte escrito duas vezes.
const recortes = new Map();
for (const i of itens)
  if (i.kind === 'escolha' && i.payload?.estagio === 'onde_jogar' && (i.payload?.estado ?? 'vigente') !== 'abandonada' && !falta(i.payload?.recorte)) {
    const r = String(i.payload.recorte).trim().toLowerCase();
    recortes.set(r, [...(recortes.get(r) ?? []), i.slug]);
  }
for (const [r, slugs] of recortes)
  if (slugs.length > 1) avisos.push(`recorte "${r}" em ${slugs.length} onde jogar (${slugs.join(', ')}): junte ou de nome diferente`);

// propostas apontando campo que nao existe e lista desatualizada.
for (const i of itens) for (const c of i.payload?.propostas ?? [])
  if (i.payload?.[c] == null) avisos.push(`${i.slug}: propostas cita "${c}", mas o campo nao esta preenchido`);

if (vigentes('aspiracao').length > 1) avisos.push(`${vigentes('aspiracao').length} aspiracoes vigentes: o metodo espera uma`);
const caps = vigentes('capacidade').length;
if (caps < 3 || caps > 5) avisos.push(`${caps} capacidade(s) vigente(s): o metodo pede de tres a cinco`);
// Sistemas sao OKRs, one page e conselho: com eles, nao se declara sistema.
if (vigentes('sistema').length) avisos.push(`${vigentes('sistema').length} sistema(s) declarado(s): se a casa roda OKRs e one page, eles sao os sistemas; retire`);
const decisoes = itens.filter((i) => i.kind === 'decisao');
if (decisoes.length > 4) avisos.push(`${decisoes.length} itens de acao e decisao: o metodo pede 3 ou 4 centrais. Volte a etapa pendencias: feche, funda ou leve ao one page`);
const soltas = decisoes.filter((i) => falta(i.payload?.sobre)).map((i) => i.slug);
if (soltas.length) avisos.push(`acao e decisao sem payload.sobre: ${soltas.join(', ')}. Sem ancora, o item nao aparece no trecho`);
const abertas = itens.filter((i) => i.kind === 'premissa' && (i.payload?.estado ?? 'aberta') === 'aberta').length;
if (abertas < 1 || abertas > 4) avisos.push(`${abertas} premissa(s) aberta(s): o metodo pede de uma a quatro`);
if (Array.isArray(env.leituras) && env.leituras.length) avisos.push('leituras nao e deste artefato: indicador e do one page');

// Slug da versao anterior que sumiu sem estado de saida.
if (anteriorArq) {
  let cadeia;
  try { cadeia = JSON.parse(fs.readFileSync(anteriorArq, 'utf8')); }
  catch (e) { problemas.push(`--anterior ${anteriorArq} ilegivel: ${e.message}`); cadeia = null; }
  const antes = cadeia?.estrategia?.atual?.envelope ?? cadeia?.atual?.envelope ?? cadeia?.envelope ?? cadeia;
  const versao = cadeia?.estrategia?.atual?.versao ?? cadeia?.atual?.versao ?? '?';
  for (const i of antes?.itens ?? []) {
    if (existe(i.slug)) continue;
    const e = i.payload?.estado;
    const saiu =
      (i.kind === 'escolha' && SAIDA_ESCOLHA.includes(e)) ||
      (i.kind === 'aposta' && SAIDA_APOSTA.includes(e)) ||
      (i.kind === 'premissa' && SAIDA_PREMISSA.includes(e)) ||
      i.kind === 'decisao';
    if (!saiu) avisos.push(`"${i.slug}" [${i.kind}] da v${versao} sumiu sem estado de saida: riscado fica, apagado some`);
  }
} else {
  avisos.push('sem --anterior: nao conferi se algum slug da versao anterior sumiu');
}

problemas.forEach((p) => console.log(`FALHA: ${p}`));
avisos.forEach((a) => console.log(`aviso: ${a}`));
NODE
)
STATUS_NODE=$?

if [ "$STATUS_NODE" != "0" ]; then
  echo "FALHA: a checagem de envelope nao rodou (node saiu com $STATUS_NODE)."
  echo "       Nao trate isso como aprovado: nada foi conferido."
  FALHOU=1
else
  FALHAS=$(printf '%s\n' "$SAIDA" | grep -c '^FALHA: ' || true)
  if [ "$FALHAS" -gt 0 ]; then
    echo "FALHA: $FALHAS problema(s) de envelope."
    printf '%s\n' "$SAIDA" | grep '^FALHA: ' | sed 's/^FALHA: /  - /'
    FALHOU=1
  else
    echo "ok: envelope integro"
  fi
  printf '%s\n' "$SAIDA" | grep '^aviso: ' | sed 's/^/  /' || true
fi

# ---------------------------------------------------------------------------
# Tabela escrita a mao no corpo
# ---------------------------------------------------------------------------

echo "== tabela escrita a mao =="
BODY=$(node -e "
const e=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));
console.log(e.body_md||'');
" "$ENV_JSON")
PIPES=$(printf '%s' "$BODY" | grep -cE '^\s*\|.*\|' || true)
if [ "$PIPES" -gt 0 ]; then
  echo "FALHA: $PIPES linha(s) de tabela markdown no corpo."
  echo "       A cascata, as apostas e os KRs sao montados das alcas, nunca escritos a mao."
  printf '%s' "$BODY" | grep -nE '^\s*\|.*\|' | head -3 | sed 's/^/  /'
  FALHOU=1
else
  echo "ok: nenhuma tabela escrita a mao"
fi

# ---------------------------------------------------------------------------
# Regras da casa, no corpo E nas alcas
# ---------------------------------------------------------------------------
#
# Na estrategia o texto da escolha, a renuncia e a hipotese SAO o artefato. Varrer
# so o corpo deixaria passar o travessao justamente onde o leitor mais le. Os
# campos de documentacao (os que comecam com sublinhado) ficam de fora.

echo "== regras da casa =="
CORPO=$(node -e "
const e=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));
const out=[e.body_md||'', e.insight||''];
const anda=(v)=>{ if(typeof v==='string') out.push(v); else if(Array.isArray(v)) v.forEach(anda); else if(v&&typeof v==='object') for(const [k,x] of Object.entries(v)) if(!k.startsWith('_')) anda(x); };
(e.itens||[]).forEach(anda);
console.log(out.join('\n'));
" "$ENV_JSON")

DASH=$(printf '%s' "$CORPO" | grep -c "—" || true)
if [ "$DASH" -gt 0 ]; then
  echo "FALHA: $DASH travessao(oes). Regra da casa: nenhum."
  printf '%s' "$CORPO" | grep -n "—" | head -3 | sed 's/^/  /'
  FALHOU=1
else
  echo "ok: nenhum travessao"
fi

BANG=$(printf '%s' "$CORPO" | grep -cE "[!?]{2,}" || true)
if [ "$BANG" -gt 0 ]; then
  echo "FALHA: $BANG ocorrencia(s) de pontuacao em serie."
  FALHOU=1
else
  echo "ok: nenhuma pontuacao em serie"
fi

# A lista mora em scripts/regras.cjs, a mesma das outras reguas.
VOCAB="$(node "$REGRAS" --vocab)"
VOC=$(printf '%s' "$CORPO" | grep -ciE "$VOCAB" || true)
if [ "$VOC" -gt 0 ]; then
  echo "FALHA: $VOC ocorrencia(s) de vocabulario proibido."
  printf '%s' "$CORPO" | grep -niE "$VOCAB" | head -5 | sed 's/^/  /'
  FALHOU=1
else
  echo "ok: vocabulario limpo"
fi

echo
if [ "$FALHOU" = "0" ]; then
  echo "Envelope aprovado pela regua executavel."
  echo "O que a maquina nao ve continua com voce: se cada escolha passa no teste do oposto, se o como"
  echo "ganhar sobrevive ao teste da imitacao, se o KR e outcome, e se o elo mais fraco e"
  echo "mesmo o mais fraco."
else
  echo "Reprovado. Conserte antes de publicar."
fi

exit $FALHOU
