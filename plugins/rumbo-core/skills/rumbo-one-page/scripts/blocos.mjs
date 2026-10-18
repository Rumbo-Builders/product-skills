/**
 * Os blocos do one page: o catalogo, o desenho, a regua de cada bloco e os sinais
 * da semana. O metodo esta em metodo/one-page-blocos.md; aqui mora o que roda.
 *
 * Um lugar so, porque tres scripts precisam da mesma lista: o validar.sh (que
 * reprova), o render.mjs (que desenha) e os briefings (que dizem por onde
 * comecar). Bloco novo entra aqui e no catalogo do metodo, e em mais nenhum lugar.
 *
 * O contrato com o sistema da casa e o mesmo: desenho { tipo, abas: [ { slug,
 * titulo, blocos: [ { tipo, titulo?, corte? } ] } ] } e as alcas okr, meta_mes,
 * acao, verba, checklist, funil, frente e decisao.
 */

import { readFileSync } from "node:fs";

export const BLOCOS = [
  "nucleo", "insight", "objetivos", "decisoes", "indicadores", "saude", "trilha_mensal",
  "roadmap", "acoes", "verba", "checklist", "funil", "outras_frentes", "texto",
];

/** Que alca alimenta cada bloco. Alca de um tipo cujo bloco nao esta no desenho nao aparece, e reprova. */
export const ALCA_DO_BLOCO = {
  objetivos: "okr", decisoes: "decisao", trilha_mensal: "meta_mes", acoes: "acao",
  verba: "verba", checklist: "checklist", funil: "funil", outras_frentes: "frente",
};

export const STATUS_ACAO = ["realizado", "confirmado", "em_andamento", "planejado", "a_propor", "negociado", "bloqueado", "cancelado"];
export const ROTAS = ["no_ritmo", "em_risco", "fora_de_rota"];
export const A_DEFINIR = (v) => typeof v === "string" && v.trim().toLowerCase() === "a definir";

const falta = (v) => v == null || !String(v).trim();
const mesOuDia = (v) => /^\d{4}-\d{2}(-\d{2})?$/.test(String(v ?? ""));
/** O prazo de um mes vence no fim do mes. */
const venceEm = (prazo) => {
  const [a, m, d] = String(prazo).split("-").map(Number);
  return d ? new Date(a, m - 1, d, 23, 59) : new Date(a, m, 0, 23, 59);
};

/** O preset de um tipo de time, de desenhos.json. */
export function preset(tipo) {
  const todos = JSON.parse(readFileSync(new URL("./desenhos.json", import.meta.url), "utf8"));
  return todos[tipo] ?? null;
}

/** O desenho do envelope, ou o do produto: sem desenho, vale o layout de sempre. */
export const desenhoDe = (env) => env?.meta?.desenho ?? preset("produto");

/** Os tipos de bloco do desenho, com o atalho nucleo aberto em insight, objetivos e decisoes. */
export function blocosDe(desenho) {
  const out = [];
  for (const aba of desenho?.abas ?? [])
    for (const b of aba.blocos ?? [])
      if (b.tipo === "nucleo") out.push({ ...b, tipo: "insight", aba: aba.slug }, { ...b, tipo: "objetivos", aba: aba.slug }, { ...b, tipo: "decisoes", aba: aba.slug });
      else out.push({ ...b, aba: aba.slug });
  return out;
}

/** A regua do desenho e de cada bloco. Devolve problemas (reprovam) e avisos. */
export function validarBlocos(env, hoje = new Date()) {
  const problemas = [];
  const avisos = [];
  const itens = Array.isArray(env.itens) ? env.itens : [];
  const desenho = env.meta?.desenho;

  // O desenho, quando declarado. Sem ele vale o de produto, que e o layout de sempre.
  if (desenho) {
    const abas = desenho.abas ?? [];
    if (!abas.length) problemas.push("meta.desenho sem abas");
    if (abas.length > 6) problemas.push(`meta.desenho com ${abas.length} abas: o maximo e seis`);
    const slugsAba = new Set();
    for (const aba of abas) {
      if (falta(aba.slug) || falta(aba.titulo)) problemas.push("aba do desenho sem slug ou sem titulo");
      else if (!/^[a-z0-9][a-z0-9-]{0,59}$/.test(aba.slug)) problemas.push(`aba "${aba.slug}": slug so com minusculas, digitos e hifen`);
      if (slugsAba.has(aba.slug)) problemas.push(`aba "${aba.slug}" repetida no desenho`);
      slugsAba.add(aba.slug);
      if ((aba.blocos ?? []).length > 10) problemas.push(`aba "${aba.slug}" com mais de dez blocos`);
      for (const b of aba.blocos ?? []) {
        if (!BLOCOS.includes(b.tipo)) problemas.push(`bloco "${b.tipo}" fora do catalogo (${BLOCOS.join(", ")})`);
        if (b.tipo === "roadmap" && b.corte && !["enxuto", "detalhado"].includes(b.corte))
          problemas.push(`roadmap com corte "${b.corte}": e enxuto ou detalhado`);
      }
    }
    const primeira = blocosDe({ abas: abas.slice(0, 1) }).map((b) => b.tipo);
    for (const t of ["insight", "objetivos", "decisoes"])
      if (!primeira.includes(t)) problemas.push(`a primeira aba nao tem ${t}: o nucleo (insight, objetivos, decisoes) mora nela`);
    const vistos = new Map();
    for (const b of blocosDe(desenho)) {
      const chave = b.tipo === "roadmap" ? `roadmap:${b.corte ?? "enxuto"}` : b.tipo;
      if (vistos.has(chave)) problemas.push(`bloco "${chave}" aparece duas vezes no desenho`);
      vistos.set(chave, true);
    }
  }

  const tipos = new Set(blocosDe(desenhoDe(env)).map((b) => b.tipo));
  for (const [bloco, kind] of Object.entries(ALCA_DO_BLOCO)) {
    const n = itens.filter((i) => i.kind === kind).length;
    if (n && !tipos.has(bloco)) problemas.push(`${n} alca(s) ${kind}, e o desenho nao tem o bloco ${bloco}: elas nao apareceriam`);
    if (!n && tipos.has(bloco) && desenho) avisos.push(`o bloco ${bloco} esta no desenho e nao tem nenhuma alca ${kind}`);
  }
  const leituras = Array.isArray(env.leituras) ? env.leituras : [];
  if (desenho && tipos.has("saude") && !leituras.some((l) => l.categoria === "saude"))
    avisos.push('o bloco saude esta no desenho e nenhuma leitura tem categoria "saude"');

  const okrs = new Set(itens.filter((i) => i.kind === "okr").map((i) => i.slug));
  const id = (i) => `${i.kind} ${i.slug ?? "?"}`;

  for (const i of itens) {
    const p = i.payload ?? {};
    switch (i.kind) {
      case "okr":
        if (p.rota && !ROTAS.includes(p.rota)) problemas.push(`${id(i)}: rota "${p.rota}" fora de ${ROTAS.join(", ")}`);
        else if (p.rota && falta(p.rota_motivo)) problemas.push(`${id(i)}: rota sem rota_motivo. Status muda com o motivo, na voz do dono`);
        if (p.objetivo && (falta(p.objetivo.slug) || falta(p.objetivo.titulo))) problemas.push(`${id(i)}: payload.objetivo precisa de slug e titulo`);
        if (A_DEFINIR(p.meta)) avisos.push(`${id(i)}: meta "a definir". Vira lacuna no briefing, com o dono`);
        break;
      case "meta_mes":
        if (falta(p.kr) || !okrs.has(p.kr)) problemas.push(`${id(i)}: kr "${p.kr ?? ""}" nao e uma alca okr deste envelope`);
        if (!/^\d{4}-\d{2}$/.test(String(p.periodo ?? ""))) problemas.push(`${id(i)}: periodo "${p.periodo ?? ""}" nao e AAAA-MM`);
        if (A_DEFINIR(p.alvo)) avisos.push(`${id(i)}: alvo "a definir". Vira lacuna no briefing, com o dono`);
        else if (typeof p.alvo !== "number") problemas.push(`${id(i)}: alvo e numero ou "a definir"`);
        if (p.realizado != null && falta(p.fonte)) problemas.push(`${id(i)}: realizado sem fonte`);
        break;
      case "acao":
        if (!mesOuDia(p.prazo)) problemas.push(`${id(i)}: prazo "${p.prazo ?? ""}" nao e AAAA-MM-DD nem AAAA-MM`);
        if (!STATUS_ACAO.includes(p.status)) problemas.push(`${id(i)}: status "${p.status ?? ""}" fora de ${STATUS_ACAO.join(", ")}`);
        if (falta(p.kr)) avisos.push(`${id(i)}: acao sem kr. Acao que nao move KR nenhum e outra frente`);
        else if (!okrs.has(p.kr)) problemas.push(`${id(i)}: kr "${p.kr}" nao e uma alca okr deste envelope`);
        if (mesOuDia(p.prazo) && venceEm(p.prazo) < hoje && !["realizado", "cancelado"].includes(p.status))
          avisos.push(`${id(i)}: prazo ${p.prazo} vencido e status "${p.status}". Andou, mudou ou cai?`);
        break;
      case "verba":
        if (!/^\d{4}-\d{2}$/.test(String(p.periodo ?? ""))) problemas.push(`${id(i)}: periodo "${p.periodo ?? ""}" nao e AAAA-MM`);
        if (typeof p.aprovado !== "number") problemas.push(`${id(i)}: aprovado nao e numero`);
        if (p.realizado != null && typeof p.realizado !== "number") problemas.push(`${id(i)}: realizado nao e numero`);
        if (falta(p.fonte)) problemas.push(`${id(i)}: verba sem fonte`);
        break;
      case "checklist":
        if (falta(p.dono)) problemas.push(`${id(i)}: checklist sem dono`);
        if (typeof p.feito !== "boolean") problemas.push(`${id(i)}: feito e verdadeiro ou falso; "em andamento" e acao`);
        if (!mesOuDia(p.prazo)) problemas.push(`${id(i)}: prazo "${p.prazo ?? ""}" nao e AAAA-MM-DD nem AAAA-MM`);
        else if (p.feito === false && venceEm(p.prazo) < hoje) avisos.push(`${id(i)}: prazo ${p.prazo} vencido e o item nao foi feito`);
        break;
      case "funil":
        if (falta(p.regra)) problemas.push(`${id(i)}: estagio sem regra do que conta`);
        if (typeof p.contagem !== "number") problemas.push(`${id(i)}: contagem nao e numero`);
        if (!Number.isInteger(p.ordem)) problemas.push(`${id(i)}: estagio sem ordem inteira`);
        break;
      default:
    }
  }

  // O total de verba que alguem vai repetir em reuniao tem de fechar.
  const total = env.meta?.verba_total;
  if (total != null) {
    const soma = itens.filter((i) => i.kind === "verba").reduce((s, i) => s + (Number(i.payload?.aprovado) || 0), 0);
    if (typeof total !== "number") problemas.push("meta.verba_total nao e numero");
    else if (Math.abs(soma - total) > 0.01) problemas.push(`meta.verba_total e ${total} e a soma do aprovado e ${soma}: nao fecha`);
  }

  return { problemas, avisos };
}

/**
 * Os sinais da semana, a partir da versao anterior: o que perguntar primeiro, na
 * etapa do bloco que ele toca. Os do sistema da casa (aposta atrasada, KR sem
 * leitura no modulo) chegam pelo dossie; estes saem do envelope.
 */
export function sinaisDe(env, hoje = new Date()) {
  const itens = env?.itens ?? [];
  const okrs = new Map(itens.filter((i) => i.kind === "okr").map((i) => [i.slug, i]));
  const mes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
  const s = [];
  for (const i of itens) {
    const p = i.payload ?? {};
    if (i.kind === "okr" && A_DEFINIR(p.meta)) s.push({ bloco: "objetivos", texto: `KR "${i.texto}" com meta a definir. Quem define, e até quando?` });
    if (i.kind === "okr" && !p.leitura && p.atual == null) s.push({ bloco: "objetivos", texto: `KR "${i.texto}" sem leitura ligada nem valor atual. De onde vem o número?` });
    if (i.kind === "meta_mes" && p.periodo === mes) {
      if (A_DEFINIR(p.alvo)) s.push({ bloco: "trilha_mensal", texto: `Meta de ${mes} de "${i.texto}" ainda a definir.` });
      else if (p.realizado == null) s.push({ bloco: "trilha_mensal", texto: `"${i.texto}": meta de ${p.alvo} em ${mes}, e nenhum realizado ainda.` });
      else if (p.realizado < p.alvo && okrs.get(p.kr)?.payload?.direcao !== "desce") s.push({ bloco: "trilha_mensal", texto: `"${i.texto}": ${p.realizado} contra a meta de ${p.alvo} em ${mes}.` });
    }
    if (i.kind === "acao" && mesOuDia(p.prazo) && venceEm(p.prazo) < hoje && !["realizado", "cancelado"].includes(p.status))
      s.push({ bloco: "acoes", texto: `Ação "${i.texto}" venceu em ${p.prazo} e segue ${p.status}. Andou, mudou ou cai?` });
    if (i.kind === "checklist" && p.feito === false && mesOuDia(p.prazo) && venceEm(p.prazo) < hoje)
      s.push({ bloco: "checklist", texto: `"${i.texto}" venceu em ${p.prazo} e não foi feito. Com ${p.dono ?? "quem"}?` });
    if (i.kind === "verba" && typeof p.realizado === "number" && p.realizado > p.aprovado)
      s.push({ bloco: "verba", texto: `${i.texto} em ${p.periodo}: realizado ${p.realizado} acima do aprovado ${p.aprovado}.` });
    if (i.kind === "decisao" && i.genero === "pergunta")
      s.push({ bloco: "decisoes", texto: `Pergunta da versão anterior: "${i.texto}". Fecha, segue para quem, ou vira outra coisa?` });
  }
  return s;
}
