#!/usr/bin/env bash
# Régua executável do one page.
#
# Critério que só existe em prosa não é aplicado. O que a máquina vê, reprova
# aqui; o que ela não vê (se o argumento fecha, se o insight é mesmo o
# essencial) a skill manda a pessoa olhar, e nunca reporta como conferido.
#
# Uso: bash validar.sh envelope.json
set -uo pipefail

ENV_JSON="${1:-envelope.json}"

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
# As regras que quebram outro artefato
# ---------------------------------------------------------------------------

echo "== envelope =="
# `node -` le o script do stdin, entao process.argv[1] e "-" e o arquivo cai em
# argv[2]. Errar isso fazia o bloco crashar e o script seguir reportando "ok":
# silencio virando aprovacao, que e o pior defeito possivel numa regua.
SAIDA=$(node - "$ENV_JSON" <<'NODE'
const fs = require('fs');
const alvo = process.argv[2];
const env = JSON.parse(fs.readFileSync(alvo, 'utf8'));
const problemas = [];

const itens = Array.isArray(env.itens) ? env.itens : [];
const leituras = Array.isArray(env.leituras) ? env.leituras : [];

// Identificador estavel: sem ele o historico do item se perde entre versoes.
const vistos = new Set();
itens.forEach((i, n) => {
  if (!i.slug || !/^[a-z0-9][a-z0-9-]{0,119}$/.test(i.slug)) {
    problemas.push(`itens[${n}]: identificador ausente ou fora do formato (minusculas e hifens)`);
  } else if (vistos.has(i.slug)) {
    problemas.push(`itens[${n}]: identificador duplicado "${i.slug}"`);
  } else vistos.add(i.slug);

  if (!i.texto || !String(i.texto).trim()) problemas.push(`itens[${n}]: texto vazio`);

  if (i.kind === 'decisao') {
    const g = i.genero;
    const generos = ['decisao_roadmap','risco','pergunta','nota_metodo','dependencia','proximo_passo'];
    if (!generos.includes(g)) {
      problemas.push(`itens[${n}]: decisao sem genero valido`);
    } else {
      if (g === 'pergunta' && !(i.escala_para||[]).length)
        problemas.push(`itens[${n}]: pergunta sem destinatario, nunca sera respondida`);
      if (g === 'risco' && !i.payload?.impacto)
        problemas.push(`itens[${n}]: risco sem impacto declarado`);
      if (g === 'decisao_roadmap' && !i.afeta_roadmap_slug)
        problemas.push(`itens[${n}]: decisao de roadmap sem dizer que faixa move`);
    }
  }
});

// Marcador que nao resolve publicaria um buraco no lugar do numero.
const conhecidos = new Set(leituras.map(l => String(l.slug||'').toLowerCase()));
(env.leituras_existentes || []).forEach(s => conhecidos.add(String(s).toLowerCase()));
const corpo = `${env.body_md||''}\n${env.body_md_enxuto||''}`;
const marcadores = new Set();
for (const m of corpo.matchAll(/\{\{\s*([a-z0-9][a-z0-9-]*)(?:\.[a-z_]+)?\s*\}\}/gi))
  marcadores.add(m[1].toLowerCase());
for (const mk of marcadores)
  if (!conhecidos.has(mk))
    problemas.push(`marcador {{${mk}}} nao resolve contra nenhuma leitura enviada`);

if (env.status === 'published' && !String(env.insight||'').trim())
  problemas.push('publicar sem insight central: e a primeira coisa que o leitor ve');

problemas.forEach(p => console.log(p));
NODE
)
STATUS_NODE=$?

if [ "$STATUS_NODE" != "0" ]; then
  echo "FALHA: a checagem de envelope nao rodou (node saiu com $STATUS_NODE)."
  echo "       Nao trate isso como aprovado: nada foi conferido."
  FALHOU=1
elif [ -n "$SAIDA" ]; then
  echo "FALHA: problema(s) de envelope."
  printf '%s\n' "$SAIDA" | sed 's/^/  - /'
  FALHOU=1
else
  echo "ok: envelope integro"
fi

# ---------------------------------------------------------------------------
# O desenho do time e os blocos
# ---------------------------------------------------------------------------
#
# A regra mora em blocos.mjs, a mesma lista que o render desenha e que o briefing
# usa para os sinais. Sem meta.desenho vale o desenho de produto, que e o de sempre.

echo "== desenho e blocos =="
BLOCOS_MJS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/blocos.mjs"
SAIDA_BL=$(node --input-type=module -e "
import { readFileSync } from 'node:fs';
const { validarBlocos } = await import(process.argv[1]);
const env = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const r = validarBlocos(env);
r.problemas.forEach((p) => console.log('FALHA: ' + p));
r.avisos.forEach((a) => console.log('aviso: ' + a));
" "$BLOCOS_MJS" "$ENV_JSON")
STATUS_BL=$?
if [ "$STATUS_BL" != "0" ]; then
  echo "FALHA: a checagem de blocos nao rodou (node saiu com $STATUS_BL)."
  echo "       Nao trate isso como aprovado: nada foi conferido."
  FALHOU=1
else
  NFALHA=$(printf '%s\n' "$SAIDA_BL" | grep -c '^FALHA: ' || true)
  if [ "$NFALHA" -gt 0 ]; then
    echo "FALHA: $NFALHA problema(s) de desenho ou de bloco."
    printf '%s\n' "$SAIDA_BL" | grep '^FALHA: ' | sed 's/^FALHA: /  - /'
    FALHOU=1
  else
    echo "ok: desenho e blocos integros"
  fi
  printf '%s\n' "$SAIDA_BL" | grep '^aviso: ' | sed 's/^/  /' || true
fi

# ---------------------------------------------------------------------------
# Digito solto no bloco de indicadores
# ---------------------------------------------------------------------------

echo "== numero no corpo =="
CORPO=$(node -e "
const e=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));
console.log((e.body_md||'')+'\n'+(e.body_md_enxuto||''));
" "$ENV_JSON")

BLOCO=$(printf '%s' "$CORPO" | awk '
  tolower($0) ~ /^#+.*indicador/ {dentro=1; next}
  dentro && /^#+ / {dentro=0}
  dentro {print}
')

if [ -n "$BLOCO" ]; then
  # Numero SOLTO, nao digito dentro de palavra. A fronteira de palavra (\b)
  # e o que separa "341" de "E2E", "S3" ou "P0": num acronimo nao ha fronteira
  # entre a letra e o digito, entao ele nao casa. Sem isso a regra reprovava
  # sigla, e regra que da falso positivo e regra que o autor aprende a ignorar.
  SOLTOS=$(printf '%s' "$BLOCO" | sed 's/{{[^}]*}}//g' | grep -oE '\b[0-9]+([.,][0-9]+)?%?' | head -10)
  if [ -n "$SOLTOS" ]; then
    echo "FALHA: digito solto no bloco de indicadores. O valor entra por marcador."
    printf '%s\n' "$SOLTOS" | sed 's/^/  - /'
    FALHOU=1
  else
    echo "ok: nenhum digito solto"
  fi
else
  # Corpo sem secao de indicadores e valido, e comum: a tabela ja mostra os
  # numeros, e o metodo manda deixar curto quem nao tem o que dizer alem deles.
  # A mensagem diz que a varredura nao se aplicou, e nao que falta alguma coisa:
  # aviso que soa como falta faz o autor inventar secao para calar o script.
  echo "ok: sem secao de indicadores no corpo, nada a varrer"
fi

# ---------------------------------------------------------------------------
# Tabela escrita a mao no corpo
# ---------------------------------------------------------------------------
#
# A grade do roadmap e a tabela de indicadores sao montadas dos dados. Escrever
# qualquer uma em markdown produz um documento que parece certo e diverge da
# fonte na semana seguinte. Este cheque existe porque o erro ja foi cometido:
# e facil de cometer, e invisivel na revisao.

echo "== tabela escrita a mao =="
KIND=$(node -e "
const e=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));
console.log(e.kind||'');
" "$ENV_JSON")

if [ "$KIND" = "one_page" ]; then
  PIPES=$(printf '%s' "$CORPO" | grep -cE '^\s*\|.*\|' || true)
  if [ "$PIPES" -gt 0 ]; then
    echo "FALHA: $PIPES linha(s) de tabela markdown no corpo do one page."
    echo "       A grade do roadmap vem do artefato de roadmap (aponte meta.roadmapVersao)."
    echo "       A tabela de indicadores vem das leituras enviadas."
    printf '%s' "$CORPO" | grep -nE '^\s*\|.*\|' | head -3 | sed 's/^/  /'
    FALHOU=1
  else
    echo "ok: nenhuma tabela escrita a mao"
  fi

  # Roadmap so e cobrado de quem tem o bloco no desenho: marketing e juridico nao tem.
  RM=$(node -e "
const e=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));
const d=e.meta&&e.meta.desenho;
const usa=!d||(d.abas||[]).some(a=>(a.blocos||[]).some(b=>b.tipo==='roadmap'));
console.log(!usa?'nao-usa':(e.meta&&e.meta.roadmapVersao)?'sim':'nao');
" "$ENV_JSON")
  if [ "$RM" = "nao-usa" ]; then
    echo "ok: o desenho do time nao tem roadmap"
  elif [ "$RM" = "nao" ]; then
    echo "aviso: one page sem meta.roadmapVersao. A secao de roadmap vai aparecer vazia."
  else
    echo "ok: aponta uma versao de roadmap"
  fi
fi

# ---------------------------------------------------------------------------
# Regras da casa
# ---------------------------------------------------------------------------

echo "== regras da casa =="
# No corpo E no texto das alcas: acao, checklist e verba sao lidas tanto quanto o
# corpo, e o travessao passaria justamente ali. Campos _ de documentacao ficam fora.
CORPO=$(node -e "
const e=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));
const out=[e.body_md||'', e.body_md_enxuto||'', e.insight||''];
const anda=(v)=>{ if(typeof v==='string') out.push(v); else if(Array.isArray(v)) v.forEach(anda); else if(v&&typeof v==='object') for(const [k,x] of Object.entries(v)) if(!k.startsWith('_')) anda(x); };
(e.itens||[]).forEach(anda);
console.log(out.join('\n'));
" "$ENV_JSON")
DASH=$(printf '%s' "$CORPO" | grep -c "—" || true)
if [ "$DASH" -gt 0 ]; then
  echo "FALHA: $DASH travessao(oes). Regra da casa: nenhum."
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
VOCAB="$(node "$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../scripts" && pwd)/regras.cjs" --vocab)"
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
  echo "O que a maquina nao ve continua com voce: se o insight e mesmo o essencial,"
  echo "se o argumento fecha, e se cada numero tem origem rastreavel."
else
  echo "Reprovado. Conserte antes de publicar."
fi

exit $FALHOU
