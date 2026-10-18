/**
 * A regua de aposta, objetivo e resultado-chave, num lugar so.
 *
 * Quem usa: o validar.sh da estrategia (quando as alcas viajam no envelope) e os
 * validadores das skills de apostas e de OKRs (quando elas vivem no sistema da
 * casa e sao editadas uma a uma). Regra escrita em dois arquivos diverge na semana
 * em que alguem mexe so num deles, e por isso esta e CommonJS: o validar.sh roda
 * o node pelo stdin, e la `require` e o que funciona.
 *
 * Cada funcao recebe o item no vocabulario do metodo (kind, slug, texto, payload)
 * e um contexto que sabe dizer se um slug existe e de que tipo ele e. Sem
 * contexto (a aposta editada sozinha, sem a cascata a mao), a amarracao vira
 * aviso de "nao conferi", nunca aprovacao calada.
 */

const ESTADO_APOSTA = ['proposta', 'ativa', 'validada', 'morta', 'concluida'];
const QUADRANTES = ['expansao_mercado', 'apostas_risco', 'operacao_qualidade', 'diferenciacao_valor'];
const DIRECOES = ['sobe', 'desce', 'binario'];
const ROTAS = ['no_ritmo', 'em_risco', 'fora_de_rota'];

const falta = (v) => v == null || !String(v).trim();

/** serve pode ser um slug ou uma lista deles: uma alca pode servir mais de uma escolha. */
const servesDe = (p) => (Array.isArray(p?.serve) ? p.serve : [p?.serve]).filter((s) => typeof s === 'string' && s.trim()).map((s) => s.trim());

/* Verbo de entrega no comeco do KR: "lancar o app" e roadmap, nao resultado. */
const ENTREGA = /^\s*(lan[cç]ar|entregar|implementar|implantar|criar|construir|desenvolver|publicar|concluir|finalizar|terminar|subir|migrar)\b/i;

/** Sem contexto, nao ha como conferir a amarracao; diz isso em vez de calar. */
function amarra(id, slugs, tipos, rotulo, ctx, r) {
  if (!ctx) {
    r.avisos.push(`${id}: ${rotulo} "${slugs.join(', ')}" nao conferido: sem a cascata a mao`);
    return;
  }
  for (const s of slugs)
    if (!ctx.existe(s) || !tipos.includes(ctx.kindDe(s)))
      r.problemas.push(`${id}: ${rotulo} aponta "${s}", que nao e ${tipos.join(' nem ')} deste envelope`);
}

function validarAposta(i, id, ctx) {
  const p = i.payload ?? {};
  const r = { problemas: [], avisos: [] };
  const serve = servesDe(p);
  if (!serve.length) r.problemas.push(`${id}: aposta sem serve. Aposta que nao serve escolha e iniciativa, e vai para o roadmap`);
  else amarra(id, serve, ['escolha'], 'serve', ctx, r);
  if (falta(p.hipotese)) r.problemas.push(`${id}: aposta sem hipotese`);
  else if (!/\bporque\b/i.test(p.hipotese)) r.avisos.push(`${id}: hipotese sem "porque": o mecanismo causal e cobrado na substancia`);
  if (falta(p.indicador)) r.problemas.push(`${id}: aposta sem indicador`);
  if (falta(p.criterio_matar)) r.problemas.push(`${id}: aposta sem criterio de matar: nunca morre, e vira linha permanente de roadmap`);
  else if (!/\d{4}-\d{2}-\d{2}/.test(p.criterio_matar)) r.avisos.push(`${id}: criterio de matar sem data ISO legivel: o briefing nao vai conseguir cobrar o vencido`);
  if (falta(p.horizonte)) r.problemas.push(`${id}: aposta sem horizonte`);
  if (p.estado && !ESTADO_APOSTA.includes(p.estado))
    r.problemas.push(`${id}: estado "${p.estado}" fora de ${ESTADO_APOSTA.join(', ')}`);
  if (p.quadrante && !QUADRANTES.includes(p.quadrante))
    r.avisos.push(`${id}: quadrante "${p.quadrante}" fora de ${QUADRANTES.join(', ')}`);
  return r;
}

function validarOkr(i, id, ctx) {
  const p = i.payload ?? {};
  const r = { problemas: [], avisos: [] };
  const serve = servesDe(p);
  if (!serve.length) r.problemas.push(`${id}: objetivo sem serve. Objetivo que nao serve nada e desejo`);
  else amarra(id, serve, ['escolha', 'aposta'], 'serve', ctx, r);
  if (p.rota && !ROTAS.includes(p.rota)) r.problemas.push(`${id}: rota "${p.rota}" fora de ${ROTAS.join(', ')}`);
  else if (p.rota && falta(p.rota_motivo)) r.problemas.push(`${id}: rota sem rota_motivo. Status muda com o motivo, na voz do dono`);
  if (/\d/.test(i.texto ?? '')) r.avisos.push(`${id}: objetivo com numero. O objetivo e frase; o numero mora no KR`);
  return r;
}

function validarKr(i, id, ctx) {
  const p = i.payload ?? {};
  const r = { problemas: [], avisos: [] };
  if (falta(p.objetivo)) r.problemas.push(`${id}: kr sem objetivo`);
  else if (ctx && (!ctx.existe(p.objetivo) || ctx.kindDe(p.objetivo) !== 'okr'))
    r.problemas.push(`${id}: objetivo aponta "${p.objetivo}", que nao e um okr deste envelope`);
  for (const c of ['baseline', 'meta', 'unidade', 'direcao'])
    if (falta(p[c])) r.problemas.push(`${id}: kr sem ${c}`);
  if (!falta(p.direcao) && !DIRECOES.includes(p.direcao))
    r.problemas.push(`${id}: direcao "${p.direcao}" fora de ${DIRECOES.join(', ')}`);
  if (ENTREGA.test(i.texto ?? ''))
    r.avisos.push(`${id}: KR comeca com verbo de entrega. Entrega e roadmap; o KR e o que o cliente faz depois`);
  return r;
}

/*
 * O VOCABULARIO PROIBIDO, num lugar so. Os dois validar.sh e o qa.sh do deck leem
 * daqui (`node regras.cjs --vocab` imprime a expressao), e o validar-alcas.mjs usa
 * casa(). Era a mesma lista em quatro arquivos, e as copias divergiram: tres nao
 * pegavam "holistica" com acento. A lista em prosa, com o porque, e a de
 * metodo/_principios.md; esta e a que roda, e as duas andam juntas.
 *
 * O acento e opcional em cada termo, e RUMBO_VOCAB_EXTRA aponta um arquivo com os
 * termos de um cliente, um por linha.
 */
const VOCAB_PADRAO = "alavanc|leverage|mergulhar fundo|vale (destacar|ressaltar)|em suma|de forma hol[ií]stica|sinergia|game changer|desbloquear potencial|no cen[aá]rio atual|[eé] importante notar";

function vocab(env = process.env) {
  const arq = env.RUMBO_VOCAB_EXTRA;
  if (!arq) return VOCAB_PADRAO;
  try {
    const extra = require("fs").readFileSync(arq, "utf8").split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
    return extra.length ? `${VOCAB_PADRAO}|${extra.join("|")}` : VOCAB_PADRAO;
  } catch {
    return VOCAB_PADRAO;
  }
}
const VOCAB = new RegExp(vocab(), "i");

function textosDe(v, out = []) {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => textosDe(x, out));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (!k.startsWith('_')) textosDe(x, out);
  return out;
}

function casa(obj) {
  const problemas = [];
  for (const t of textosDe(obj)) {
    if (t.includes('—')) problemas.push(`travessao em "${t.slice(0, 60)}". Regra da casa: nenhum`);
    if (/[!?]{2,}/.test(t)) problemas.push(`pontuacao em serie em "${t.slice(0, 60)}"`);
    if (VOCAB.test(t)) problemas.push(`vocabulario proibido em "${t.slice(0, 60)}"`);
  }
  return problemas;
}

// `node regras.cjs --vocab` imprime a expressao, para os scripts em bash.
if (require.main === module && process.argv.includes("--vocab")) process.stdout.write(vocab());

module.exports = { VOCAB_PADRAO, vocab, ESTADO_APOSTA, QUADRANTES, DIRECOES, ROTAS, falta, servesDe, validarAposta, validarOkr, validarKr, casa };
