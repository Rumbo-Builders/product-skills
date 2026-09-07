#!/usr/bin/env node
/**
 * Pré-processador do one page SEM ORIGEM: arquivos entram, briefing sai.
 *
 * Irmão do `contexto.mjs`, que busca o dossiê numa API que fala o contrato. Aqui
 * não há API. A versão anterior vem da própria página publicada, e o movimento do
 * período vem de um arquivo que alguém montou da ferramenta que o time usa.
 *
 * ELE NÃO BUSCA NADA. Recebe o movimento já normalizado, e faz só o que o modelo
 * erra em silêncio: aritmética e comparação por identificador.
 *
 * A DIVISÃO É PROPOSITAL. Escolher o que da ferramenta pertence ao roadmap é
 * julgamento, não aritmética: nem toda entrega registrada é aposta do produto, e
 * uma regra determinística para isso enche o roadmap de trabalho que ninguém
 * pediu. A triagem fica com quem lê; a conta fica aqui.
 *
 * O modelo NUNCA lê os JSON de entrada inteiros. Três motivos, e todos já custaram
 * caro: JSON grande consome contexto que faria falta na redação; o modelo apura mal
 * quando precisa cruzar listas por identificador; e um campo ausente no meio de um
 * objeto passa despercebido, enquanto uma lacuna nomeada em prosa vira pergunta.
 *
 * Uso:
 *   node contexto-local.mjs [--anterior anterior.json] [--movimento movimento.json]
 *                           [--triagem triagem.json] [--time <identificador>]
 *                           [--ano 2026] [--trimestre 3] [--saida .rumbo]
 *
 * O formato do arquivo de movimento está em `exemplo-movimento.json`.
 *
 * Nada é obrigatório. Sem `--anterior` ele diz que é a primeira versão, em vez de
 * quebrar: a primeira semana é justamente quando não há o que ler.
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// argumentos e leitura
// ---------------------------------------------------------------------------

function args(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const chave = a.slice(2);
    const proximo = argv[i + 1];
    if (proximo && !proximo.startsWith("--")) {
      // --movimento aceita repetição: uma leitura por semana acumula.
      if (chave in out) out[chave] = [].concat(out[chave], proximo);
      else out[chave] = proximo;
      i++;
    } else out[chave] = true;
  }
  return out;
}

const opts = args(process.argv);
const time = opts.time || "produto";
const saida = opts.saida || ".rumbo";

/** Arquivo ausente devolve null, e cada bloco decide o que dizer sobre a ausência. */
function ler(caminho) {
  if (!caminho || caminho === true || !existsSync(caminho)) return null;
  try {
    return JSON.parse(readFileSync(caminho, "utf8"));
  } catch (e) {
    console.error(`[contexto] ${caminho} nao e JSON valido: ${e.message}`);
    process.exit(1);
  }
}

const anterior = ler(opts.anterior) ?? {};
const triagem = ler(opts.triagem) ?? { projetos: {}, issues: {} };
const movimento = []
  .concat(opts.movimento ?? [])
  .map(ler)
  .filter(Boolean);

const nada = "nao informado";
const hoje = new Date();

// ---------------------------------------------------------------------------
// formatação
// ---------------------------------------------------------------------------

/** Número em pt-BR. Vírgula decimal, ponto de milhar, variação sempre com sinal. */
function num(v, casas = 1) {
  if (v == null || Number.isNaN(v)) return nada;
  return v.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: casas,
  });
}

function sinal(v, casas = 1) {
  if (v == null || Number.isNaN(v)) return nada;
  return `${v > 0 ? "+" : v < 0 ? "-" : ""}${num(Math.abs(v), casas)}`;
}

function data(d) {
  if (!d) return nada;
  const x = new Date(d);
  return Number.isNaN(x.getTime()) ? nada : x.toLocaleDateString("pt-BR");
}

function dias(de, ate = hoje) {
  if (!de) return null;
  const a = new Date(de);
  if (Number.isNaN(a.getTime())) return null;
  return Math.round((new Date(ate) - a) / 86400000);
}

// ---------------------------------------------------------------------------
// versões publicadas
// ---------------------------------------------------------------------------

/**
 * O artifact guarda { atual, historico[] } por tipo. A versão que vem a seguir é
 * uma a mais que a atual, e é o script que a conta: contador errado quebra o
 * apontamento de roadmap, que é o que sustenta a imutabilidade do que já saiu.
 */
function trilha(tipo) {
  const t = anterior[tipo] ?? {};
  const historico = Array.isArray(t.historico) ? t.historico : [];
  const atual = t.atual ?? null;
  const versaoAtual = atual?.versao ?? historico.at(-1)?.versao ?? 0;
  return { atual, historico, versaoAtual, proxima: versaoAtual + 1 };
}

const onePage = trilha("one_page");
const roadmap = trilha("roadmap");

/** Envelope da versão publicada imediatamente anterior à atual. */
function penultimo(t) {
  const h = t.historico;
  if (!h.length) return null;
  const ultimo = h.at(-1);
  return (ultimo?.versao ?? 0) === t.versaoAtual ? (h.at(-2) ?? null) : ultimo;
}

// ---------------------------------------------------------------------------
// blocos do briefing
// ---------------------------------------------------------------------------

/**
 * O diff é o que pauta a conversa. Comparado por identificador, nunca por texto:
 * texto de modelo muda de redação sem mudar de conteúdo, e um diff textual
 * apontaria mudança onde não houve.
 */
function blocoDiff(t, rotulo) {
  const antes = penultimo(t);
  if (!t.atual) return `_Nenhum ${rotulo} publicado ainda._\n`;
  if (!antes) return `_Primeira versao publicada do ${rotulo}: nao ha o que comparar._\n`;

  const mapa = (env) =>
    new Map((env?.envelope?.itens ?? env?.itens ?? []).map((i) => [i.slug, i]));
  const a = mapa(antes);
  const b = mapa(t.atual.envelope ?? t.atual);

  const novos = [...b.values()].filter((i) => !a.has(i.slug));
  const sumiram = [...a.values()].filter((i) => !b.has(i.slug));
  const mudaram = [...b.values()].filter(
    (i) => a.has(i.slug) && a.get(i.slug).texto !== i.texto,
  );

  const partes = [
    `Comparando v${antes.versao ?? "?"} com v${t.versaoAtual} do ${rotulo}.\n`,
  ];
  const lista = (titulo, itens, fmt) => {
    if (!itens.length) return;
    partes.push(`**${titulo}** (${itens.length})`);
    itens.slice(0, 15).forEach((i) => partes.push(fmt(i)));
    if (itens.length > 15) partes.push(`- _e mais ${itens.length - 15}_`);
    partes.push("");
  };
  lista("Novos", novos, (i) => `- \`${i.slug}\` [${i.kind ?? "item"}] ${i.texto}`);
  lista("Sumiram", sumiram, (i) => `- \`${i.slug}\` [${i.kind ?? "item"}] ${i.texto}`);
  lista(
    "Mudaram",
    mudaram,
    (i) => `- \`${i.slug}\`: "${a.get(i.slug).texto}" -> "${i.texto}"`,
  );

  if (partes.length === 1) partes.push("_Nenhuma alca mudou._\n");
  return partes.join("\n");
}

function gradeRoadmap() {
  const env = roadmap.atual?.envelope ?? roadmap.atual;
  if (!env) return "_Nenhum roadmap publicado ainda._\n";

  const meta = env.meta ?? {};
  const itens = env.itens ?? [];
  const alca = (i) => i.payload ?? i;

  if (meta.modo === "now_next_later") {
    const grupos = { now: [], next: [], later: [], parking: [] };
    for (const i of itens) (grupos[alca(i).estadoNnl] ?? grupos.later).push(i);
    const bloco = (titulo, lista) =>
      `**${titulo}**\n` +
      (lista.length
        ? lista.map((i) => `- \`${i.slug}\` ${i.texto}`).join("\n")
        : "- _vazio_") +
      "\n";
    return [
      `Modo: agora / proximo / depois (v${roadmap.versaoAtual})\n`,
      bloco("Agora", grupos.now),
      bloco("Proximo", grupos.next),
      bloco("Depois", grupos.later),
      bloco("Estacionamento", grupos.parking),
    ].join("\n");
  }

  const faixas = meta.faixas ?? [];
  const colunas = meta.colunas ?? [];
  if (!faixas.length || !colunas.length) {
    return `Modo: linha do tempo (v${roadmap.versaoAtual}), sem faixas ou colunas declaradas.\n`;
  }

  const cab = `| faixa | ${colunas.map((c) => c.rotulo + (c.atual ? " (atual)" : "")).join(" | ")} |`;
  const sep = `|---|${colunas.map(() => "---").join("|")}|`;
  const linhas = faixas.map((f) => {
    const celulas = colunas.map((c) => {
      const achados = itens.filter(
        (i) => alca(i).faixa === f.slug && alca(i).coluna === c.slug,
      );
      return achados.length ? achados.map((x) => x.texto).join("; ") : "";
    });
    return `| **${f.titulo}** | ${celulas.join(" | ")} |`;
  });

  const estacionados = itens.filter((i) => alca(i).estadoNnl === "parking");
  const extra = estacionados.length
    ? [
        "",
        `**Estacionamento** (${estacionados.length})`,
        ...estacionados.map(
          (i) =>
            `- \`${i.slug}\` ${i.texto}${alca(i).estacionamento?.motivo ? `: ${alca(i).estacionamento.motivo}` : ""}`,
        ),
      ]
    : [];

  return [
    `Modo: linha do tempo, granularidade ${meta.granularidade ?? nada} (v${roadmap.versaoAtual})\n`,
    cab,
    sep,
    ...linhas,
    ...extra,
    "",
  ].join("\n");
}

/**
 * A série de cada indicador, com a variação já apurada.
 *
 * A direção é semântica, nunca o sinal cru: cruzar o sinal com `sobe_e_bom` é
 * exatamente o tipo de conta que o modelo erra quando está escrevendo prosa.
 */
function indicadores() {
  const env = onePage.atual?.envelope ?? onePage.atual;
  const leituras = env?.leituras ?? [];
  if (!leituras.length) return "_Nenhuma leitura registrada ainda._\n";

  const porSlug = new Map();
  for (const l of leituras) {
    if (!porSlug.has(l.slug)) porSlug.set(l.slug, []);
    porSlug.get(l.slug).push(l);
  }

  const linhas = [
    "| indicador | atual | anterior | variacao | leitura | origem |",
    "|---|---|---|---|---|---|",
  ];

  for (const [slug, serie] of porSlug) {
    serie.sort((a, b) => String(b.periodo).localeCompare(String(a.periodo)));
    const a = serie[0];
    const b = serie[1];
    const un = a.unidade ?? "";

    let variacao = "sem base de comparacao";
    if (b && a.valor_num != null && b.valor_num != null) {
      const d = a.valor_num - b.valor_num;
      const pct = b.valor_num !== 0 ? (d / Math.abs(b.valor_num)) * 100 : null;
      const melhor = a.sobe_e_bom ?? b.sobe_e_bom ?? true;
      const direcao = d === 0 ? "estavel" : d > 0 === !!melhor ? "melhorou" : "piorou";
      const entre = dias(b.periodo, a.periodo);
      variacao =
        `${sinal(d)}${un}` +
        (pct != null ? ` (${sinal(pct)}%)` : "") +
        `, ${direcao}` +
        (entre != null ? `, ${entre}d entre leituras` : "");
    }

    const nome = a.nome && a.nome !== slug ? ` (${a.nome})` : "";
    linhas.push(
      `| \`${slug}\`${nome} | ${num(a.valor_num)}${un} | ${b ? num(b.valor_num) + un : nada} | ${variacao} | ${a.periodo ?? nada} | ${a.fonte ?? nada} |`,
    );
  }
  return linhas.join("\n") + "\n";
}

// ---------------------------------------------------------------------------
// movimento, a partir do arquivo normalizado
// ---------------------------------------------------------------------------

const projetos = movimento.flatMap((d) => d.projetos ?? []);
const issues = movimento.flatMap((d) => d.issues ?? []);
const janela = movimento.map((d) => d.janela_desde).filter(Boolean).sort()[0] ?? null;

/** Faixa já decidida para um projeto: primeiro o roadmap publicado, depois o cache. */
function faixaDe(projeto) {
  const env = roadmap.atual?.envelope ?? roadmap.atual;
  const porSlug = new Map(
    (env?.itens ?? []).map((i) => [i.slug, (i.payload ?? i).faixa]),
  );
  const decidido = triagem.projetos?.[projeto.id];
  if (decidido?.slug && porSlug.has(decidido.slug)) return porSlug.get(decidido.slug);
  return decidido?.faixa ?? null;
}

function blocoMovimento() {
  if (!movimento.length) {
    return (
      "_Nenhum arquivo de movimento informado._ Sem ele nao ha movimento apurado, e o\n" +
      "documento deve declarar a ausencia em vez de preencher. Leia a ferramenta onde o\n" +
      "trabalho do time vive, normalize no formato de `exemplo-movimento.json`, e rode\n" +
      "de novo.\n"
    );
  }

  const l = [];
  l.push(`Janela desde ${data(janela)}. ${projetos.length} entrega(s) e ${issues.length} ocorrencia(s) no periodo.`);
  l.push("");

  const concluidos = projetos.filter((p) => p.concluido_em);
  const atrasados = projetos.filter(
    (p) => !p.concluido_em && p.alvo && new Date(p.alvo) < hoje,
  );
  const semFaixa = projetos.filter((p) => !faixaDe(p) && (p.concluido_em || p.alvo));

  if (concluidos.length) {
    l.push(`**Concluido** (${concluidos.length})`);
    concluidos.slice(0, 20).forEach((p) => {
      const f = faixaDe(p);
      l.push(`- ${p.nome} em ${data(p.concluido_em)}${f ? ` [faixa: ${f}]` : " [sem faixa]"}`);
    });
    l.push("");
  }

  if (atrasados.length) {
    l.push(`**Atrasado** (${atrasados.length})`);
    atrasados
      .sort((a, b) => dias(b.alvo) - dias(a.alvo))
      .slice(0, 15)
      .forEach((p) => {
        const f = faixaDe(p);
        l.push(`- ${p.nome}, ${dias(p.alvo)} dias${f ? ` [faixa: ${f}]` : " [sem faixa]"}`);
      });
    l.push("");
  }

  // A faixa "outros" considera atrasado também. Olhar só o concluído deixava um
  // time com sete entregas atrasadas e órfãs receber a lista vazia: a faixa que
  // existe para ser honesta ficava muda justamente quando havia mais o que confessar.
  if (semFaixa.length) {
    l.push(
      `**Candidatos a faixa "outros"** (${semFaixa.length}): tem movimento e nao se liga a objetivo nenhum.`,
    );
    semFaixa.slice(0, 15).forEach((p) => l.push(`- ${p.nome}`));
    l.push("");
  }

  const abertas = issues.filter((i) => !i.concluida_em);
  const fechadas = issues.filter((i) => i.concluida_em);
  const criticas = abertas.filter((i) => /urgent|high/i.test(i.prioridade ?? ""));
  const reativo = issues.filter((i) => (i.rotulos ?? []).some((r) => /bug/i.test(r)));
  l.push(
    `Ocorrencias: ${fechadas.length} fechada(s) na janela, ${abertas.length} aberta(s), ${criticas.length} critica(s) aberta(s), ${reativo.length} marcada(s) como defeito.`,
  );
  l.push("");

  const relevantes = [...criticas, ...fechadas].slice(0, 12);
  if (relevantes.length) {
    l.push("**Ocorrencias que a conversa discute**");
    relevantes.forEach((i) =>
      l.push(
        `- \`${i.id}\` [${i.prioridade ?? "sem prioridade"}, ${i.estado ?? nada}] ${i.titulo}`,
      ),
    );
    l.push("");
  }

  return l.join("\n");
}

/**
 * O que ainda não foi triado. Estar registrado na ferramenta não dá direito ao
 * roadmap, e o que já foi decidido não volta: é isso que impede reclassificar a
 * lista inteira toda semana.
 */
function blocoTriagem() {
  if (!movimento.length) return "_Sem arquivo de movimento, nao ha o que triar._\n";

  const pendProj = projetos.filter((p) => !triagem.projetos?.[p.id]);
  const pendIssue = issues.filter(
    (i) => !triagem.issues?.[i.id] && /urgent|high/i.test(i.prioridade ?? ""),
  );

  if (!pendProj.length && !pendIssue.length) {
    return "_Nada pendente: todo item do dump ja tem destino registrado._\n";
  }

  const l = [];
  if (pendProj.length) {
    l.push(`**Entregas sem destino** (${pendProj.length}). Faixa, faixa "outros", ou fora com motivo.`);
    pendProj.slice(0, 20).forEach((p) => l.push(`- \`${p.id}\` ${p.nome}${p.initiative ? ` (initiative: ${p.initiative})` : ""}`));
    l.push("");
  }
  if (pendIssue.length) {
    l.push(`**Ocorrencias criticas sem destino** (${pendIssue.length}). Anexada a uma celula, ou ignorada com motivo.`);
    pendIssue.slice(0, 20).forEach((i) => l.push(`- \`${i.id}\` [${i.prioridade}] ${i.titulo}`));
    l.push("");
  }
  l.push("A decisao de cada linha vai para `triagem.json`, com o motivo. Sem o motivo, a pergunta volta na semana que vem.");
  return l.join("\n");
}

// ---------------------------------------------------------------------------
// lacunas
// ---------------------------------------------------------------------------

/**
 * Quem recebe buraco silencioso preenche o buraco. O briefing NOMEIA o que falta,
 * e é isso que permite perguntar em vez de inventar.
 */
function lacunas() {
  const fora = [];
  const env = onePage.atual?.envelope ?? onePage.atual;
  const envR = roadmap.atual?.envelope ?? roadmap.atual;

  if (!onePage.atual) fora.push(["versao anterior", "Nenhum one page publicado. Esta e a primeira versao, e nao ha incremento a contar."]);
  if (!envR) fora.push(["roadmap", "Nenhum roadmap publicado. Confirme o modo, as faixas e as colunas antes de escrever o one page."]);
  if (!movimento.length) fora.push(["movimento", "Nenhum arquivo de movimento. O periodo esta vazio, e isso precisa ser declarado, nao preenchido."]);

  const leituras = env?.leituras ?? [];
  const porSlug = new Map();
  for (const l of leituras) porSlug.set(l.slug, [...(porSlug.get(l.slug) ?? []), l]);
  for (const [slug, serie] of porSlug) {
    if (serie.length < 2) {
      fora.push([`indicador:${slug}`, "Uma leitura so: nao ha variacao a mostrar. Pergunte a leitura anterior, ou declare que e a primeira."]);
      continue;
    }
    serie.sort((a, b) => String(b.periodo).localeCompare(String(a.periodo)));
    const d = dias(serie[0].periodo);
    if (d != null && d > 21) {
      fora.push([`indicador:${slug}`, `Ultima leitura ha ${d} dias. Metrica que aparece na tabela e nao se moveu precisa de explicacao, ou de declaracao de que nao foi medida.`]);
    }
  }

  for (const f of envR?.meta?.faixas ?? []) {
    if (f.tipo === "objetivo" && !f.aposta) {
      fora.push([`faixa:${f.slug}`, `A faixa "${f.titulo}" nao declara a aposta. Faixa que nao se liga a nada costuma ser trabalho que ninguem pediu.`]);
    }
  }

  const abertas = (env?.itens ?? []).filter(
    (i) => i.kind === "decisao" && i.genero === "pergunta" && !(i.escala_para ?? []).length,
  );
  for (const p of abertas) fora.push([`pergunta:${p.slug}`, "Pergunta sem destinatario nomeado. Nunca sera respondida."]);

  return fora;
}

function decisoesAbertas() {
  const env = onePage.atual?.envelope ?? onePage.atual;
  const itens = (env?.itens ?? []).filter((i) => i.kind === "decisao");
  const vivas = itens.filter((i) =>
    ["pergunta", "risco", "dependencia", "proximo_passo"].includes(i.genero),
  );
  if (!vivas.length) return "_Nenhuma._\n";
  const d = onePage.atual?.publicado_em;
  return (
    vivas
      .map(
        (i) =>
          `- \`${i.slug}\` [${i.genero}] ${i.texto}${d ? ` (da v${onePage.versaoAtual}, ha ${dias(d)} dias)` : ""}` +
          ((i.escala_para ?? []).length ? ` -> ${i.escala_para.join(", ")}` : ""),
      )
      .join("\n") + "\n"
  );
}

function pessoasJaNomeadas() {
  const nomes = new Map();
  const todas = [
    ...(onePage.historico ?? []),
    ...(onePage.atual ? [onePage.atual] : []),
  ];
  for (const v of todas)
    for (const i of v.envelope?.itens ?? v.itens ?? [])
      for (const p of i.escala_para ?? []) nomes.set(p, (nomes.get(p) ?? 0) + 1);
  if (!nomes.size) return "_Ninguem foi nomeado ainda. Pergunta sem destinatario nao e respondida: veja o perfil._\n";
  return (
    [...nomes.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([n, v]) => `- ${n} (${v}x)`)
      .join("\n") + "\n"
  );
}

// ---------------------------------------------------------------------------
// briefing
// ---------------------------------------------------------------------------

function briefing() {
  const l = [];
  const ano = opts.ano ?? hoje.getFullYear();
  const tri = opts.trimestre ?? Math.floor(hoje.getMonth() / 3) + 1;

  l.push(`# Briefing: ${time}`);
  l.push("");
  l.push(`Periodo ${ano} Q${tri}. Briefing gerado em ${hoje.toLocaleString("pt-BR")}.`);
  l.push("");

  if (onePage.atual) {
    const d = onePage.atual.publicado_em;
    l.push(
      `Ultima publicacao: one page v${onePage.versaoAtual}${d ? `, ha ${dias(d)} dias` : ""}. Roadmap ${roadmap.versaoAtual ? `na v${roadmap.versaoAtual}` : "ainda nao publicado"}.`,
    );
    const ins = (onePage.atual.envelope ?? onePage.atual).insight;
    if (ins) l.push(`> ${ins}`);
  } else {
    l.push("Nenhuma publicacao anterior. Esta e a primeira versao.");
  }
  l.push("");
  l.push(
    roadmap.versaoAtual
      ? `A proxima versao sera **one page v${onePage.proxima}**. O roadmap vai para v${roadmap.proxima} se mudar, e o one page aponta a v${roadmap.versaoAtual} de novo se nao mudar.`
      : `A proxima versao sera **one page v${onePage.proxima}**, e o roadmap sera a **v1**. Publique o roadmap primeiro: e ele que o one page aponta.`,
  );
  l.push("");

  l.push("## O que mudou desde a ultima versao");
  l.push("");
  l.push(blocoDiff(onePage, "one page"));
  l.push(blocoDiff(roadmap, "roadmap"));

  l.push("## Movimento no periodo");
  l.push("");
  l.push(blocoMovimento());

  l.push("## Objetivos e metas");
  l.push("");
  const okrs = ((onePage.atual?.envelope ?? onePage.atual)?.itens ?? []).filter(
    (i) => i.kind === "okr",
  );
  if (okrs.length) {
    okrs.forEach((o) =>
      l.push(
        `- **${o.texto}**: ${o.payload?.destaque ?? nada}${o.payload?.estado === "abandonado" ? " [abandonado, e continua visivel]" : ""}`,
      ),
    );
  } else {
    l.push("_Nenhum objetivo em destaque na versao anterior._");
  }
  l.push("");

  l.push("## Roadmap publicado");
  l.push("");
  l.push(gradeRoadmap());
  l.push("");

  l.push("## Triagem pendente");
  l.push("");
  l.push(blocoTriagem());
  l.push("");

  l.push("## Indicadores");
  l.push("");
  l.push(indicadores());
  l.push("");
  l.push(
    "Use marcador no texto, nunca o digito: `{{identificador}}` e `{{identificador.delta_pct}}`.",
  );
  l.push("");

  l.push("## Decisoes ainda abertas");
  l.push("");
  l.push(decisoesAbertas());

  l.push("## Quem ja foi nomeado antes");
  l.push("");
  l.push(pessoasJaNomeadas());

  // As lacunas ficam por último porque são o que se leva para a conversa.
  l.push("## Perguntar antes de escrever");
  l.push("");
  const fora = lacunas();
  if (fora.length) {
    fora.forEach(([campo, motivo]) => l.push(`- **${campo}**: ${motivo}`));
    l.push("");
    l.push(
      "Cada linha acima e um buraco. Pergunte, ou declare a ausencia no texto. Nao preencha por conta.",
    );
  } else {
    l.push("_Nenhuma lacuna detectada. Isso nao dispensa perguntar._");
  }
  l.push("");

  return l.join("\n");
}

// ---------------------------------------------------------------------------
// principal
// ---------------------------------------------------------------------------

try {
  mkdirSync(saida, { recursive: true });
  const carimbo = hoje.toISOString().slice(0, 10);
  const doc = join(saida, `briefing-${carimbo}.md`);
  const texto = briefing();
  writeFileSync(doc, texto, "utf8");
  console.log(texto);
  console.error(`\n[contexto] briefing em ${doc}`);
} catch (e) {
  console.error(`[contexto] falhou: ${e.message}`);
  process.exit(1);
}
