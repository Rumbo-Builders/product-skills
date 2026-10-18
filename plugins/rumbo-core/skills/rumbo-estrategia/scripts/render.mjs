#!/usr/bin/env node
/**
 * Renderizador da estrategia: envelope entra, pagina de duas abas sai.
 *
 * Este e o destino SEM SERVIDOR. Quem publica depois e o proprio agente, numa
 * pagina hospedada, com a URL da versao anterior para manter o link. O historico
 * viaja embutido na pagina, no bloco `rumbo-envelopes`, trilha `estrategia`.
 *
 * O que este script existe para impedir:
 *
 * 1. A DISTINCAO APAGADA. Renuncia, fonte, criterio de matar e teste sao campos,
 *    e e daqui que eles saem para a tela. O corpo livre explica; nao substitui.
 * 2. A VERSAO ANTIGA QUE MUDA SOZINHA. Cada versao congela a cascata inteira e a
 *    ultima leitura de cada KR que o one page enviou. Publicar uma versao nova
 *    nao pode alterar o que uma antiga mostra.
 * 3. O QUE SAIU, APAGADO. Escolha abandonada e aposta morta ficam riscadas, com
 *    a palavra. Apagar a linha esconde a decisao de largar.
 * 4. A PROPOSTA QUE VIRA DECLARACAO. O que o modelo preencheu e a lideranca nao
 *    confirmou leva pilula na tela, pela lista `propostas` da alca. Prefixo no
 *    texto some na primeira edicao; a pilula so sai quando a lista esvazia.
 *
 * Uso:
 *   node render.mjs --estrategia envelope-estrategia.json
 *                   [--anterior .rumbo/anterior-estrategia.json]
 *                   [--one-page .rumbo/anterior.json]
 *                   [--marca .rumbo/marca.json] [--tema .rumbo/tema.css]
 *                   [--config .rumbo/estrategia.config.json] [--titulo "..."]
 *                   [--saida .rumbo/estrategia.html]
 *
 * NUNCA RENDERIZE SEM --anterior QUANDO JA EXISTE VERSAO PUBLICADA. Sem ele esta
 * sai como v1 e recarimba a historia. E a regra que o one page aprendeu.
 *
 * `--one-page` e a cadeia da pagina do one page: e dela que vem a ultima leitura
 * de cada KR e de cada aposta que declara `payload.leitura`. Sem ela a celula
 * diz "sem leitura", e nunca fica vazia.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import regras from "../../../scripts/regras.cjs";
const { servesDe } = regras;
import { dirname } from "node:path";
import {
  args, lerJson, esc, nada, num, data, md,
  blocoInsight, blocoProsa, decisoes, GENEROS, linkDeFontes,
  carregarCasa, blocoMarca, trilha, avisoVersao, montarPagina,
} from "../../../scripts/pagina.mjs";

// ---------------------------------------------------------------------------
// argumentos e arquivos
// ---------------------------------------------------------------------------

const opts = args(process.argv);
const saida = opts.saida || ".rumbo/estrategia.html";

const estrategiaCss = readFileSync(new URL("./estrategia.css", import.meta.url), "utf8");

const { marca, config, tema, simbolo, paginaCss } = carregarCasa(opts, {
  configPadrao: ".rumbo/estrategia.config.json",
  rotulo: "render",
});

const novo = lerJson(opts.estrategia, true);
if (novo.kind !== "estrategia") {
  console.error(`[render] o envelope e kind "${novo.kind}", e este render e da estrategia.`);
  process.exit(1);
}
// --anterior pedido e ausente falha: virar v1 em silencio apagaria o historico da pagina.
const anterior = (typeof opts.anterior === "string" ? lerJson(opts.anterior, true) : null) ?? {};
const onePage = lerJson(opts["one-page"]);

if (!opts.anterior) {
  console.error("[render] aviso: sem --anterior, esta sai como v1. Se ja existe versao publicada, pare e passe o --anterior: republicar sem ele recarimba a v1.");
}

// ---------------------------------------------------------------------------
// vocabulario da tela
// ---------------------------------------------------------------------------

const ESTAGIOS = [
  ["aspiracao", "Aspiração", "O que é vencer, aos olhos de quem compra"],
  ["onde_jogar", "Onde jogar", "Em que recorte de cliente, geografia, canal e produto"],
  ["como_ganhar", "Como ganhar", "Que vantagem de custo ou de valor faz vencer ali"],
  ["capacidade", "Capacidades", "As poucas coisas que a empresa faz com perfeição"],
  ["sistema", "Sistemas", "Os ritos e medidas que sustentam as capacidades"],
];
const ROTULO_ESTAGIO = Object.fromEntries(ESTAGIOS.map(([id, r]) => [id, r]));

/* A situacao e a capacidade observada contra a declarada: a lente do gap. Tres
   valores, e a palavra vai na tela, nunca so a cor. */
const SITUACAO = { existe: "existe", em_construcao: "em construção", nao_existe: "não existe" };
const QUADRANTE = {
  expansao_mercado: "expansão de mercado",
  apostas_risco: "aposta de risco",
  operacao_qualidade: "operação e qualidade",
  diferenciacao_valor: "diferenciação de valor",
};
const DIRECAO = { sobe: "sobe", desce: "desce", binario: "binário" };
const ROTULO_CAMPO = {
  renuncia: "renúncia", fonte: "fonte", serve: "serve", estado: "estado", situacao: "situação",
  hipotese: "hipótese", indicador: "indicador", criterio_matar: "morre se", horizonte: "horizonte",
  quadrante: "quadrante", teste: "teste", prazo: "prazo", sobre: "sobre", objetivo: "objetivo",
  baseline: "baseline", meta: "meta", unidade: "unidade", direcao: "direção", elo_mais_fraco: "elo mais fraco",
};

/** Pilulas do que o modelo propos e a lideranca nao confirmou. */
function pilulasPropostas(p) {
  return (p?.propostas ?? [])
    .map((c) => `<span class="marca-estado proposta">proposta do modelo: ${esc(ROTULO_CAMPO[c] ?? c)}</span>`)
    .join("");
}

/* O titulo do pai no lugar do slug. Slug em monospace e ruido para quem le no
   conselho; o texto curto da escolha de cima diz a mesma coisa em portugues. */
const curto = (s, n = 72) => {
  const t = String(s ?? "").trim();
  return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t;
};

// ---------------------------------------------------------------------------
// leituras congeladas: a ultima de cada KR e aposta, vinda do one page
// ---------------------------------------------------------------------------

function leiturasDoOnePage(cadeia) {
  if (!cadeia) return new Map();
  const t = trilha(cadeia, "one_page");
  const versoes = [...t.historico, ...(t.atual ? [t.atual] : [])];
  const m = new Map();
  for (const v of versoes)
    for (const l of (v.envelope ?? v).leituras ?? []) {
      if (!l?.slug) continue;
      const lista = m.get(l.slug) ?? [];
      const i = lista.findIndex((x) => x.periodo === l.periodo);
      if (i >= 0) lista[i] = l; else lista.push(l);
      m.set(l.slug, lista);
    }
  for (const [, l] of m) l.sort((a, b) => String(b.periodo).localeCompare(String(a.periodo)));
  return m;
}

/** O que a versao congela: por slug de leitura, a atual e a anterior. */
function congelar(env, cadeiaOnePage) {
  const series = leiturasDoOnePage(cadeiaOnePage);
  const out = {};
  for (const i of env.itens ?? []) {
    const slug = i.payload?.leitura;
    if (!slug || !["kr", "aposta"].includes(i.kind)) continue;
    const s = series.get(slug);
    if (!s?.length) continue;
    const copia = (l) => ({ periodo: l.periodo ?? null, valor_num: l.valor_num ?? null, texto: l.texto ?? null, unidade: l.unidade ?? null, fonte: l.fonte ?? null });
    out[slug] = { atual: copia(s[0]), anterior: s[1] ? copia(s[1]) : null };
  }
  return out;
}

const SIMBOLOS = { percent: "%", pct: "%", "%": "%", brl: " R$", usd: " US$" };
/**
 * A unidade so entra quando o valor e numero puro. Baseline e meta de KR sao
 * texto de quem escreveu ("6%", "sim", "3 redes"), e colar "percent" em cima de
 * "6%" saia como "6%%": numero que ninguem informou.
 */
function comUnidade(valor, unidade) {
  const u = String(unidade ?? "").trim();
  if (!u || !/^-?\d+([.,]\d+)?$/.test(String(valor).trim())) return valor;
  const s = SIMBOLOS[u.toLowerCase()];
  return s ? `${valor}${esc(s)}` : `${valor} ${esc(u)}`;
}
const valorDe = (l) => (l?.texto ? esc(l.texto) : comUnidade(num(l?.valor_num, 2), l?.unidade));

function celulaLeitura(slug, congeladas) {
  const c = slug ? congeladas[slug] : null;
  if (!c?.atual) return `<span class="sem-leitura">${slug ? "sem leitura" : "sem leitura ligada"}</span>`;
  return `<span class="atual">${valorDe(c.atual)}</span> <span class="quando">em ${esc(c.atual.periodo ?? nada)}${c.atual.fonte ? `, origem ${esc(c.atual.fonte)}` : ""}</span>`;
}

// ---------------------------------------------------------------------------
// aba Cascata
// ---------------------------------------------------------------------------

/**
 * A linha de baixo do cartao: fonte, e o pai quando a pilha nao basta para dizer
 * qual e. Com uma escolha so no estagio de cima, a pilha ja diz; com duas ou
 * mais, o texto curto do pai entra.
 */
function linhaFonte(p, itens) {
  const partes = [p.fonte ? `Fonte: ${esc(p.fonte)}` : "Sem fonte"];
  if (p.sustentada_por) partes.push(`sustentada por ${esc(p.sustentada_por)}`);
  // serve pode listar mais de uma escolha: a linha diz todas as que ela sustenta.
  const alvos = servesDe(p);
  const pais = alvos.map((s) => itens.find((i) => i.slug === s)).filter(Boolean);
  const irmaos = pais.length ? itens.filter((i) => i.kind === "escolha" && i.payload?.estagio === pais[0].payload?.estagio && (i.payload?.estado ?? "vigente") !== "abandonada") : [];
  if (pais.length && (irmaos.length > 1 || pais.length > 1)) partes.push(`sustenta: ${pais.map((x) => esc(curto(x.texto))).join("; ")}`);
  for (const s of alvos.filter((s) => !itens.some((i) => i.slug === s)))
    partes.push(`sustenta <code>${esc(s)}</code>, que não está neste envelope`);
  return partes.join(" · ");
}

function escolha(e, ctx) {
  const p = e.payload ?? {};
  const estado = p.estado ?? "vigente";
  const ehElo = e.slug === ctx.elo;
  const classes = ["escolha", esc(estado), ehElo ? "elo" : ""].filter(Boolean).join(" ");
  const marcas = [];
  if (ehElo) marcas.push(`<span class="marca-estado elo-rotulo">Elo mais fraco${ctx.eloProposto ? " (proposta do modelo)" : ""}</span>`);
  if (estado === "revisada") marcas.push(`<span class="marca-estado">revisada na v${Number(ctx.versao) || "?"}</span>`);
  if (estado === "abandonada") marcas.push(`<span class="marca-estado">abandonada</span>`);
  if (p.situacao) marcas.push(`<span class="marca-estado situacao ${esc(p.situacao)}">${esc(SITUACAO[p.situacao] ?? String(p.situacao).replace(/_/g, " "))}</span>`);
  marcas.push(pilulasPropostas(p));
  const marcasHtml = marcas.join("");
  return `<div class="${classes}" id="escolha-${esc(e.slug)}">
          ${marcasHtml ? `<span class="marcas">${marcasHtml}</span>` : ""}
          <p class="escolha-texto">${p.recorte ? `<b class="recorte">${esc(p.recorte)}</b>` : ""}${esc(e.texto)}</p>
          ${p.renuncia ? `<p class="renuncia"><b>Renúncia</b>${esc(p.renuncia)}</p>` : ""}
          <p class="fonte">${linhaFonte(p, ctx.itens)}</p>
        </div>`;
}

function cascata(env, ctx) {
  const escolhas = (env.itens ?? []).filter((i) => i.kind === "escolha");
  return `<div class="bloco">
      <h2>Cascata</h2>
      <p class="subtitulo">As escolhas, de cima para baixo, e de onde cada uma veio. A renúncia aparece onde é essencial.</p>
      <ol class="cascata">${ESTAGIOS.map(([id, rotulo, pergunta]) => {
        const lista = escolhas.filter((e) => e.payload?.estagio === id);
        // Sistemas so aparece quando declarado: com OKRs e one page, eles sao os sistemas.
        if (id === "sistema" && !lista.length) return "";
        return `
        <li class="estagio">
          <span class="estagio-rotulo">${rotulo}<span class="estagio-pergunta">${pergunta}</span></span>
          <div class="estagio-corpo">${lista.length ? lista.map((e) => escolha(e, ctx)).join("\n") : `<p class="vazio">Nenhuma escolha registrada.</p>`}</div>
        </li>`;
      }).join("")}
      </ol>
    </div>`;
}

function premissas(env, ctx) {
  const itens = env.itens ?? [];
  const lista = itens.filter((i) => i.kind === "premissa");
  const miolo = lista.length
    ? `<ul class="premissas">${lista.map((pr) => {
        const p = pr.payload ?? {};
        const estado = p.estado ?? "aberta";
        const ehElo = pr.slug === ctx.elo;
        const pai = p.sobre ? itens.find((i) => i.slug === p.sobre) : null;
        const sobre = pai ? ` · sobre: ${esc(curto(pai.texto))}` : p.sobre ? ` · sobre <code>${esc(p.sobre)}</code>` : "";
        const marcas = [
          ehElo ? `<span class="marca-estado elo-rotulo">Elo mais fraco${ctx.eloProposto ? " (proposta do modelo)" : ""}</span>` : "",
          pilulasPropostas(p),
        ].join("");
        return `<li class="premissa ${esc(estado)}${ehElo ? " elo" : ""}">
          <span class="estado ${esc(estado)}">${esc(estado)}</span>
          <span class="premissa-corpo">
            ${marcas ? `<span class="marcas">${marcas}</span>` : ""}
            <b>${esc(pr.texto)}</b>
            <span class="teste">Teste: ${esc(p.teste ?? nada)}${p.prazo && !String(p.teste ?? "").includes(String(p.prazo)) ? `, até ${data(p.prazo)}` : ""}${sobre}</span>
          </span>
        </li>`;
      }).join("")}</ul>`
    : `<p class="vazio">Nenhuma premissa registrada. O que tem de ser verdade para esta estratégia valer?</p>`;
  return `<div class="bloco">
      <h2>O que tem de ser verdade</h2>
      <p class="subtitulo">Premissas com teste e prazo. Refutada reabre a escolha no conselho.</p>
      ${miolo}
    </div>`;
}

/**
 * O painel de decisao, no desenho que a leitura de conselho pede: as perguntas
 * agrupadas por quem responde, os riscos a vista, e o resto recolhido. Dezesseis
 * cartoes numa pilha escondiam as tres que importavam.
 */
function painelDecisoes(itens) {
  const lista = itens.filter((i) => i.kind === "decisao");
  if (!lista.length) return `<p class="vazio">Nenhuma decisão nesta versão, e isso está declarado.</p>`;

  const perguntas = lista.filter((d) => d.genero === "pergunta");
  const riscos = lista.filter((d) => d.genero === "risco");
  const resto = lista.filter((d) => d.genero !== "pergunta" && d.genero !== "risco");

  // A chave do grupo e o conjunto de quem responde, nao a ordem em que foi
  // escrito: "Ana e Bia" e "Bia e Ana" sao o mesmo grupo.
  const grupos = new Map();
  for (const q of perguntas) {
    const para = [...(q.escala_para ?? [])].sort((a, b) => String(a).localeCompare(String(b), "pt-BR")).join(" e ") || "sem destinatário";
    if (!grupos.has(para)) grupos.set(para, []);
    grupos.get(para).push(q);
  }

  const blocos = [];
  if (perguntas.length)
    blocos.push(`<div class="perguntas">${[...grupos]
      .map(([para, ps]) => `<div class="grupo-perguntas"><h3>Para ${esc(para)}</h3>${decisoes(ps)}</div>`)
      .join("")}</div>`);
  if (riscos.length) blocos.push(`<div class="grupo-perguntas"><h3>Riscos</h3>${decisoes(riscos)}</div>`);
  if (resto.length) {
    const contagem = {};
    for (const d of resto) contagem[d.genero] = (contagem[d.genero] ?? 0) + 1;
    const resumo = Object.entries(contagem).map(([g, n]) => `${n} ${esc((GENEROS[g] ?? g).toLowerCase())}`).join(", ");
    blocos.push(`<details class="recolhido"><summary>${resto.length} item(ns) sem resposta pendente: ${resumo}</summary>${decisoes(resto)}</details>`);
  }
  return blocos.join("\n");
}

function painelCascata(env, ctx) {
  const elo = ctx.elo ? (env.itens ?? []).find((i) => i.slug === ctx.elo) : null;
  return `<section class="painel" role="tabpanel" data-alvo="cascata" aria-labelledby="aba-cascata">
    ${blocoInsight(env.insight)}
    ${cascata(env, ctx)}
    ${premissas(env, ctx)}
    <div class="bloco">
      <h2>Ação e decisão</h2>
      <p class="subtitulo">Perguntas por quem responde, riscos à vista, o resto recolhido.${elo ? ` Elo mais fraco: ${esc(elo.texto)}.` : ""}</p>
      ${painelDecisoes(env.itens ?? [])}
    </div>
    ${blocoProsa(md(env.body_md ?? ""))}
  </section>`;
}

// ---------------------------------------------------------------------------
// aba Apostas e resultados
// ---------------------------------------------------------------------------

function apostas(env, congeladas, ctx) {
  const itens = env.itens ?? [];
  const lista = itens.filter((i) => i.kind === "aposta");
  if (!lista.length)
    return `<div class="bloco"><h2>Apostas</h2><p class="vazio">Nenhuma aposta registrada nesta versão.</p></div>`;

  const escolhas = itens.filter((i) => i.kind === "escolha");
  const ordem = (slug) => {
    const e = escolhas.find((x) => x.slug === slug);
    const est = ESTAGIOS.findIndex(([id]) => id === e?.payload?.estagio);
    return (est < 0 ? 99 : est) * 1000 + Math.max(0, escolhas.indexOf(e));
  };
  const grupos = new Map();
  for (const a of lista) {
    const k = servesDe(a.payload)[0] ?? "";
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k).push(a);
  }
  const chaves = [...grupos.keys()].sort((x, y) => ordem(x) - ordem(y));

  const cartao = (a) => {
    const p = a.payload ?? {};
    const estado = p.estado ?? "proposta";
    const ehElo = a.slug === ctx.elo;
    const marcas = [
      ehElo ? `<span class="marca-estado elo-rotulo">Elo mais fraco${ctx.eloProposto ? " (proposta do modelo)" : ""}</span>` : "",
      pilulasPropostas(p),
    ].join("");
    return `<div class="aposta ${esc(estado)}${ehElo ? " elo" : ""}" id="aposta-${esc(a.slug)}">
          <span class="aposta-cabeca"><b>${esc(a.texto)}</b><span class="estado ${esc(estado)}">${esc(estado)}</span>${p.quadrante ? `<span class="quadrante">${esc(QUADRANTE[p.quadrante] ?? p.quadrante.replace(/_/g, " "))}</span>` : ""}</span>
          ${marcas ? `<span class="marcas">${marcas}</span>` : ""}
          <dl>
            ${p.problema ? `<dt>Problema</dt><dd>${esc(p.problema)}</dd>` : ""}
            <dt>Hipótese</dt><dd>${esc(p.hipotese ?? nada)}</dd>
            <dt>Indicador</dt><dd>${esc(p.indicador ?? nada)}${p.leitura ? `<span class="leitura">Última leitura: ${celulaLeitura(p.leitura, congeladas)}</span>` : ""}</dd>
            <dt>Morre se</dt><dd>${esc(p.criterio_matar ?? nada)}</dd>
            <dt>Horizonte</dt><dd>${data(p.horizonte)}</dd>
          </dl>
        </div>`;
  };

  return `<div class="bloco">
      <h2>Apostas</h2>
      <p class="subtitulo">Agrupadas pela escolha que provam. Morta fica riscada, com o motivo no corpo.</p>
      ${chaves.map((k) => {
        const e = escolhas.find((x) => x.slug === k);
        return `<div class="grupo-apostas">
        <h3>${e ? esc(e.texto) : `Escolha <code>${esc(k || "?")}</code> não encontrada`}</h3>
        ${e ? `<p class="grupo-estagio">${ROTULO_ESTAGIO[e.payload?.estagio] ?? ""}</p>` : ""}
        <div class="apostas-lista">${grupos.get(k).map(cartao).join("\n")}</div>
      </div>`;
      }).join("\n")}
    </div>`;
}

function objetivos(env, congeladas) {
  const itens = env.itens ?? [];
  const okrs = itens.filter((i) => i.kind === "okr");
  if (!okrs.length)
    return `<div class="bloco"><h2>Objetivos e resultados</h2><p class="vazio">Nenhum objetivo registrado nesta versão.</p></div>`;
  const krsDe = (slug) => itens.filter((i) => i.kind === "kr" && i.payload?.objetivo === slug);
  return `<div class="bloco">
      <h2>Objetivos e resultados</h2>
      <p class="subtitulo">O objetivo é frase; o número mora no KR. A leitura vem do one page.</p>
      ${okrs.map((o) => {
        const krs = krsDe(o.slug);
        const p = o.payload ?? {};
        const serve = servesDe(p).map((sv) => {
          const pai = itens.find((i) => i.slug === sv);
          return pai ? `serve: ${esc(curto(pai.texto))}` : `serve <code>${esc(sv)}</code>`;
        }).join(" · ") || "serve <code>?</code>";
        const marcas = pilulasPropostas(p);
        return `<div class="objetivo-estrategia">
        <h3>${esc(o.texto)}</h3>
        <p class="fonte">${serve}${p.estado ? ` · ${esc(p.estado)}` : ""}</p>
        ${marcas ? `<span class="marcas">${marcas}</span>` : ""}
        ${krs.length ? `<div class="rolagem"><table class="krs">
          <thead><tr><th>Resultado-chave</th><th>Baseline</th><th>Meta</th><th>Direção</th><th>Última leitura</th></tr></thead>
          <tbody>${krs.map((k) => {
            const q = k.payload ?? {};
            return `<tr>
            <td>${esc(k.texto)}${q.prazo ? `<span class="quando">até ${data(q.prazo)}</span>` : ""}${pilulasPropostas(q) ? `<span class="marcas">${pilulasPropostas(q)}</span>` : ""}</td>
            <td class="n">${comUnidade(esc(q.baseline ?? nada), q.unidade)}</td>
            <td class="n">${comUnidade(esc(q.meta ?? nada), q.unidade)}</td>
            <td>${esc(DIRECAO[q.direcao] ?? q.direcao ?? nada)}</td>
            <td class="n">${celulaLeitura(q.leitura, congeladas)}</td>
          </tr>`;
          }).join("")}</tbody>
        </table></div>` : `<p class="vazio">Objetivo sem resultado-chave.</p>`}
      </div>`;
      }).join("\n")}
      <p class="legenda">Leituras congeladas nesta versão, vindas do one page. Não mudam quando a leitura mudar depois.</p>
    </div>`;
}

function painelApostas(env, congeladas, ctx) {
  return `<section class="painel" role="tabpanel" data-alvo="apostas" aria-labelledby="aba-apostas" hidden>
    ${apostas(env, congeladas, ctx)}
    ${objetivos(env, congeladas)}
  </section>`;
}

// ---------------------------------------------------------------------------
// cadeia de versoes
// ---------------------------------------------------------------------------

const antes = trilha(anterior, "estrategia");
const agora = new Date();

const atual = {
  versao: antes.versao + 1,
  publicado_em: agora.toISOString(),
  envelope: novo,
  leituras_congeladas: congelar(novo, onePage),
};

const cadeia = {
  estrategia: {
    atual,
    historico: [...antes.historico, ...(antes.atual ? [antes.atual] : [])],
  },
};

// Da mais nova para a mais antiga: quem abre quer a de agora.
const versoes = [cadeia.estrategia.atual, ...cadeia.estrategia.historico].sort((a, b) => b.versao - a.versao);

const blocos = versoes
  .map((v) => {
    const env = v.envelope ?? v;
    const antiga = v.versao !== atual.versao;
    const ctx = {
      itens: env.itens ?? [],
      versao: v.versao,
      elo: env.meta?.elo_mais_fraco ?? null,
      eloProposto: (env.meta?.propostas ?? []).includes("elo_mais_fraco"),
    };
    return `  <div class="versao" data-versao="${v.versao}"${antiga ? " hidden" : ""}>
    ${antiga ? avisoVersao(v.versao, v.publicado_em, "Ela e imutavel, e mostra a cascata e as leituras que congelou na epoca.") : ""}
    ${painelCascata(env, ctx)}
    ${painelApostas(env, v.leituras_congeladas ?? {}, ctx)}
  </div>`;
  })
  .join("\n");

const opcoes = versoes
  .map((v) => `<option value="${v.versao}">v${v.versao} · ${data(v.publicado_em)}</option>`)
  .join("");

const periodo = [
  novo.ciclo?.rotulo ?? novo.ciclo?.slug ?? null,
  novo.year && novo.quarter ? `${novo.year} Q${novo.quarter}` : null,
  novo.meta?.revisao ?? null,
].filter(Boolean).join(" · ");

/* O titulo nomeia a aba e o cartao na galeria, e por isso e o nome da casa e nao
   uma frase. Ele fica estavel entre republicacoes. */
const tituloDoArtefato =
  opts.titulo || config.titulo || `Estratégia ${marca.nome ?? marca.casa ?? "da casa"}`;

/* UMA URL, DUAS ABAS. A cascata primeiro, porque e o documento. Apostas e
   resultados depois, porque e o detalhe. */
const html = montarPagina({
  titulo: tituloDoArtefato,
  fontes: linkDeFontes(marca.fontes),
  estilo: `${tema}\n\n${paginaCss}\n\n${estrategiaCss}`,
  marcaHtml: blocoMarca(marca, simbolo),
  opcoes,
  periodo,
  abas: [
    { id: "cascata", rotulo: "Cascata" },
    { id: "apostas", rotulo: "Apostas e resultados" },
  ],
  versoesHtml: blocos,
  envelopes: cadeia,
});

mkdirSync(dirname(saida), { recursive: true });
writeFileSync(saida, html, "utf8");

const nCongeladas = Object.keys(atual.leituras_congeladas).length;
const nPropostas = (novo.itens ?? []).reduce((n, i) => n + (i.payload?.propostas ?? []).length, 0) + (novo.meta?.propostas ?? []).length;
console.log(`[render] ${saida}`);
console.log(`[render] estrategia v${atual.versao}, ${nCongeladas} leitura(s) congelada(s)${onePage ? "" : " (sem --one-page)"}${nPropostas ? `, ${nPropostas} campo(s) ainda como proposta do modelo` : ""}`);
console.log(`[render] label sugerido: "estrategia v${atual.versao} · ${novo.meta?.revisao ?? "revisao"}"`);
console.log(`[render] ${versoes.length} versao(oes) na pagina, ${(html.length / 1024).toFixed(0)} KB`);
console.log(`[render] ao publicar: titulo "${tituloDoArtefato}", favicon ${marca.favicon ?? "(escolha um)"}`);
