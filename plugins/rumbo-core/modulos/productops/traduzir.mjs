#!/usr/bin/env node
/**
 * O envelope da estrategia, partido para o ProductOps. Sem o modulo ativo, nada
 * aqui roda: o envelope continua inteiro e a pagina local mostra cascata, apostas
 * e OKRs, como sempre.
 *
 * Com o ProductOps, a mesma estrategia mora em dois lugares, e e por isso que este
 * script existe. A cascata (escolhas, premissas, decisoes) vai pelo REST do
 * contrato 1.3, que nao carrega mais apostas nem OKRs. Apostas e OKRs vao pelo MCP,
 * para o modulo relacional. O envelope segue sendo um so, e e ele que a regua le.
 *
 * Duas saidas, e nenhuma grava nada na origem:
 *
 *   --cascata saida.json   o envelope sem as alcas aposta, okr e kr, para o
 *                          publicar.mjs. Avisa o que ficaria apontando para alca
 *                          que saiu (elo mais fraco, premissa sobre aposta).
 *   --tatico               o briefing das chamadas MCP, em markdown: cada aposta e
 *                          cada OKR com o rascunho dos campos que o envelope ja
 *                          responde e a lista do que falta perguntar. Quem chama a
 *                          tool e o modelo, depois de mostrar e ouvir confirmacao.
 *
 * O que o envelope nao sabe (dono, squad, RICE, escopo do OKR) o script nao inventa:
 * lista em "falta perguntar". Numero e do sistema: o RICE nao e calculado aqui.
 *
 * VINCULOS. Slug e o handle no envelope; id e o handle no ProductOps. A
 * correspondencia mora em `.rumbo/productops.json`, e e ela que separa criar de
 * atualizar na revisao seguinte. Sem ela, a segunda revisao duplica cada aposta.
 *
 *   node traduzir.mjs envelope.json --cascata envelope-origem.json
 *   node traduzir.mjs envelope.json --tatico [--vinculos .rumbo/productops.json]
 *   node traduzir.mjs --vincular <slug> <id> [--vinculos .rumbo/productops.json]
 *   node traduzir.mjs aposta.json --tatico --cascata-de .rumbo/anterior-estrategia.json
 *
 * O ultimo e o das skills de apostas e de OKRs: um rascunho com uma aposta ou um
 * objetivo, e a cascata emprestada da estrategia publicada para montar a tese.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import regras from "../../scripts/regras.cjs";
// serve pode ser lista; a tese segue pela primeira escolha, que e a principal.
const serve1 = (p) => regras.servesDe(p)[0];

const args = process.argv.slice(2);
const opcao = (nome) => {
  const i = args.indexOf(nome);
  return i >= 0 ? args[i + 1] : undefined;
};
const VINCULOS = opcao("--vinculos") ?? ".rumbo/productops.json";
const TATICO = new Set(["aposta", "okr", "kr"]);

function lerVinculos() {
  if (!existsSync(VINCULOS)) return {};
  return JSON.parse(readFileSync(VINCULOS, "utf8"));
}

// --vincular: grava a correspondencia depois que a tool devolveu o id.
if (args[0] === "--vincular") {
  const [, slug, id] = args;
  if (!slug || !id || id.startsWith("--")) {
    console.error("Uso: node traduzir.mjs --vincular <slug> <id> [--vinculos arquivo]");
    process.exit(1);
  }
  const v = lerVinculos();
  v[slug] = id;
  mkdirSync(dirname(VINCULOS), { recursive: true });
  writeFileSync(VINCULOS, `${JSON.stringify(v, null, 2)}\n`);
  console.log(`${slug} -> ${id} em ${VINCULOS}`);
  process.exit(0);
}

const arquivo = args[0];
if (!arquivo || arquivo.startsWith("--") || (!args.includes("--cascata") && !args.includes("--tatico"))) {
  console.error("Uso: node traduzir.mjs envelope.json (--cascata saida.json | --tatico [--cascata-de estrategia.json]) [--vinculos arquivo]");
  process.exit(1);
}

const envelope = JSON.parse(readFileSync(arquivo, "utf8"));
// --cascata-de: a aposta ou o OKR editado sozinho, sem envelope de estrategia. As
// escolhas vem da estrategia publicada, so para a tese e a amarracao; o rascunho
// continua so com as alcas do arquivo.
const deFora = opcao("--cascata-de");
const deCadeia = (c) => c?.estrategia?.atual?.envelope ?? c?.atual?.envelope ?? c?.envelope ?? c;
const emprestadas = deFora ? (deCadeia(JSON.parse(readFileSync(deFora, "utf8")))?.itens ?? []).filter((i) => i.kind === "escolha") : [];
const proprias = envelope.itens ?? [];
const itens = [...proprias, ...emprestadas.filter((e) => !proprias.some((i) => i.slug === e.slug))];
const porSlug = new Map(itens.map((i) => [i.slug, i]));

// ---------------------------------------------------------------- cascata

if (args.includes("--cascata")) {
  const saida = opcao("--cascata");
  if (!saida || saida.startsWith("--")) {
    console.error("--cascata pede o arquivo de saida.");
    process.exit(1);
  }
  const fora = new Set(itens.filter((i) => TATICO.has(i.kind)).map((i) => i.slug));
  const cascata = { ...envelope, itens: itens.filter((i) => !TATICO.has(i.kind)) };
  writeFileSync(saida, `${JSON.stringify(cascata, null, 2)}\n`);

  console.log(`${saida}: ${cascata.itens.length} alcas; ${fora.size} taticas ficaram de fora (vao pelo MCP).`);
  const avisos = [];
  if (fora.has(envelope.meta?.elo_mais_fraco)) {
    avisos.push(`meta.elo_mais_fraco aponta ${envelope.meta.elo_mais_fraco}, que e aposta. Na origem, o elo mais fraco e uma escolha ou premissa: aponte a escolha que a aposta serve, ou a premissa que a sustenta.`);
  }
  for (const i of cascata.itens) {
    if (i.kind === "premissa" && fora.has(i.payload?.sobre)) {
      const servida = serve1(porSlug.get(i.payload.sobre)?.payload);
      avisos.push(`premissa ${i.slug} e sobre ${i.payload.sobre}, que e aposta. Na origem ela precisa apontar uma escolha${servida ? ` (a aposta serve ${servida})` : ""}.`);
    }
  }
  if (avisos.length) {
    console.log("\nAntes de publicar na origem:");
    avisos.forEach((a) => console.log(`  - ${a}`));
    process.exitCode = 2;
  }
  process.exit();
}

// ---------------------------------------------------------------- tatico

const vinculos = lerVinculos();
const ESTADO_APOSTA = {
  proposta: "NOT_STARTED",
  ativa: "VALIDATING",
  validada: "ON_TRACK",
  concluida: "DONE",
  morta: "CANCELLED",
};
const ROTULO_ESTAGIO = {
  aspiracao: "Aspiração",
  onde_jogar: "Onde jogar",
  como_ganhar: "Como ganhar",
  capacidade: "Capacidade",
  sistema: "Sistema",
};

/** A tese que a aposta serve: da escolha servida subindo ate o onde jogar. */
function tese(slug) {
  const partes = [];
  let atual = porSlug.get(slug);
  while (atual && atual.kind === "escolha" && atual.payload?.estagio !== "aspiracao") {
    partes.push(`${ROTULO_ESTAGIO[atual.payload.estagio] ?? atual.payload.estagio}: ${atual.texto}`);
    atual = porSlug.get(serve1(atual.payload));
  }
  return partes.length ? `${partes.join(". ")} (${slug})` : null;
}

const dataDe = (texto) => String(texto ?? "").match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? null;
const minuscula = (t) => (t ? t.charAt(0).toLowerCase() + t.slice(1) : t);
const json = (o) => ["```json", JSON.stringify(o, null, 2), "```"].join("\n");

const linhas = ["# Camada tática para o ProductOps", ""];
linhas.push(
  "Rascunho das chamadas. Nada foi gravado. Leia `ciclo_ativo`, `squads_listar` e `pessoas_buscar` antes, mostre cada rascunho na conversa e chame a tool só depois da confirmação.",
  "",
);

const apostas = itens.filter((i) => i.kind === "aposta");
const okrs = itens.filter((i) => i.kind === "okr");
const krs = itens.filter((i) => i.kind === "kr");

linhas.push(`## Apostas (${apostas.length})`, "");
for (const a of apostas) {
  const p = a.payload ?? {};
  const id = vinculos[a.slug];
  const falta = [];
  const morte = p.criterio_matar ? ` Matamos a aposta se ${minuscula(p.criterio_matar.replace(/\.$/, ""))}.` : "";
  const parent = tese(serve1(p));
  if (!parent) falta.push(`parentStrategyText: a aposta serve "${serve1(p)}", que não é escolha deste envelope`);
  if (!p.quadrante) falta.push("quadrant: conduza pelas duas perguntas do método");
  if (!p.criterio_matar) falta.push("critério de matar: sem ele não é aposta");
  falta.push("ownerId (pessoas_buscar)", "squadId (squads_listar; pergunte sempre)", "reach, impact (1 a 5), confidence (0 a 100), effort");

  const campos = {
    title: a.texto,
    parentStrategyText: parent ?? undefined,
    problemStatement: p.problema,
    hypothesis: `${(p.hipotese ?? "").trim().replace(/([^.!?])$/, "$1.")}${morte}`.trim() || undefined,
    quadrant: p.quadrante ? p.quadrante.toUpperCase() : undefined,
    laggingIndicator: p.indicador,
    executionStatus: ESTADO_APOSTA[p.estado],
  };

  linhas.push(`### ${a.texto} \`${a.slug}\``, "");
  if (id) {
    linhas.push(`Já existe no ProductOps (\`${id}\`). Compare com \`aposta_obter\` e use \`aposta_atualizar\` só nos campos que mudaram. Estado novo vai por \`aposta_mudar_status\`, com o motivo, nunca pelo atualizar.`, "");
  } else {
    linhas.push("Nova: `aposta_criar`. Depois, `aposta_avaliar_ia` e o veredito na conversa.", "");
  }
  linhas.push(json(campos), "");
  if (p.estado === "ativa") linhas.push("`ativa` virou `VALIDATING`. Se a hipótese já está provada e a aposta escala, é `ON_TRACK`: pergunte.", "");
  const quando = dataDe(p.criterio_matar);
  // Os marcos do rascunho, e o de matar ou seguir quando ele nao veio.
  const marcos = (p.marcos ?? []).map((m) => ({ description: m.texto, dueDate: m.data }));
  if (quando && !marcos.some((m) => m.dueDate === quando)) marcos.push({ description: "Decisão de matar ou seguir", dueDate: quando });
  if (!quando && p.criterio_matar) falta.push("data do critério de matar: o marco precisa dela em AAAA-MM-DD");
  for (const m of marcos) linhas.push(`Marco (\`aposta_marco_criar\`): \`${JSON.stringify(m)}\``);
  if (marcos.length) linhas.push("");
  // Resultados esperados: a relacao com o objetivo o rascunho nao sabe, e se pergunta.
  for (const r of p.resultados ?? []) {
    linhas.push(`Resultado (\`aposta_resultado_criar\`): \`${JSON.stringify({ name: r.texto, description: r.descricao ?? r.texto, metric: r.metrica, startDate: r.inicio, endDate: r.fim })}\``);
    falta.push(`objectiveRelation do resultado "${r.texto}": a que objetivo ele se liga`);
  }
  if ((p.resultados ?? []).length) linhas.push("");
  linhas.push("Falta perguntar:", ...falta.map((f) => `- ${f}`), "");
}

linhas.push(`## OKRs (${okrs.length})`, "");
for (const o of okrs) {
  const p = o.payload ?? {};
  const id = vinculos[o.slug];
  const falta = [];
  const servido = porSlug.get(serve1(p));
  let betId;
  let conexao;
  if (servido?.kind === "aposta") {
    betId = vinculos[servido.slug] ?? `<id de ${servido.slug}, depois de criada>`;
    conexao = `Mede a aposta "${servido.texto}". ${tese(serve1(servido.payload)) ?? ""}`.trim();
  } else {
    conexao = tese(serve1(p));
    falta.push("betId: o objetivo serve uma escolha, não uma aposta. Pergunte qual aposta ele mede; sem nenhuma, siga sem betId");
  }
  if (!conexao || conexao.length < 10) falta.push("strategyConnection: 10 caracteres ou mais");

  const keyResults = krs
    .filter((k) => k.payload?.objetivo === o.slug)
    .map((k) => {
      const kp = k.payload ?? {};
      if (kp.direcao === "binario") return { title: k.texto, type: "BINARY" };
      const alvo = Number(String(kp.meta ?? "").replace(",", ".").replace(/[^\d.-]/g, ""));
      if (!Number.isFinite(alvo) || kp.meta == null) falta.push(`targetValue de ${k.slug}: a meta "${kp.meta}" não é número`);
      return {
        title: k.texto,
        type: /%/.test(`${kp.unidade ?? ""}${kp.meta ?? ""}`) ? "PERCENT" : "NUMERIC",
        direction: kp.direcao === "desce" ? "DECREASE" : "INCREASE",
        targetValue: Number.isFinite(alvo) ? alvo : undefined,
      };
    });

  falta.push(
    "scope: SQUAD (com o squad da aposta) ou COMPANY (dono admin)",
    "ownerId (pessoas_buscar)",
    `year e quarter dentro do ciclo${envelope.ciclo ? ` ${envelope.ciclo.inicio} a ${envelope.ciclo.fim}` : ""}`,
  );

  linhas.push(`### ${o.texto} \`${o.slug}\``, "");
  linhas.push(
    id
      ? `Já existe (\`${id}\`). \`okr_atualizar\` substitui os KRs inteiros: mande a lista completa. Estado vai por \`okr_mudar_status\`, com motivo.`
      : "Novo: rode `kr_avaliar_ia` em cada KR e mostre o veredito antes de `okr_criar`. O create não roda a IA.",
    "",
  );
  const ROTA = { no_ritmo: "ON_TRACK", em_risco: "AT_RISK", fora_de_rota: "OFF_TRACK" };
  linhas.push(json({ title: o.texto, betId, strategyConnection: conexao ?? undefined, executionStatus: ROTA[p.rota], statusSummary: p.rota_motivo, keyResults }), "");
  if (id && p.rota) linhas.push(`Rota mudou? \`okr_mudar_status\` com \`${ROTA[p.rota]}\` e o motivo do dono; o atualizar não muda status.`, "");
  krs
    .filter((k) => k.payload?.objetivo === o.slug)
    .forEach((k) => {
      const b = k.payload?.baseline;
      if (b != null && k.payload?.direcao !== "binario") linhas.push(`- ${k.slug}: baseline ${b} ${k.payload.unidade ?? ""} não tem campo no módulo. Entra no statusSummary ou fica só na página.`);
    });
  linhas.push("", "Falta perguntar:", ...falta.map((f) => `- ${f}`), "");
}

const soltos = krs.filter((k) => !okrs.some((o) => o.slug === k.payload?.objetivo));
if (soltos.length) {
  linhas.push("## KRs sem objetivo neste envelope", "", ...soltos.map((k) => `- ${k.slug}: aponta ${k.payload?.objetivo}`), "");
}

linhas.push(
  "## Depois de cada gravação",
  "",
  `\`node traduzir.mjs --vincular <slug> <id> --vinculos ${VINCULOS}\`, com o id que a tool devolveu. É isso que faz a revisão seguinte atualizar em vez de duplicar.`,
);

console.log(linhas.join("\n"));
