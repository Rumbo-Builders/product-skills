#!/usr/bin/env node
/**
 * Renderizador do artefato de produto: envelope entra, pagina de duas abas sai.
 *
 * Este e o destino SEM SERVIDOR. Quem publica depois e o proprio agente, numa
 * pagina hospedada, com a URL do artefato anterior para manter o link. Existe um
 * segundo destino, `publicar.mjs`, para quem tem uma origem que fala o contrato
 * do dossie. O envelope e a regua sao os mesmos nos dois.
 *
 * O que este script existe para impedir:
 *
 * 1. A GRADE REDIGITADA. O corte enxuto do one page e GERADO do envelope de
 *    roadmap, aqui. Roadmap mantido em dois lugares diverge em semanas, e a
 *    divergencia so aparece quando alguem decide com base no errado.
 * 2. O NUMERO DIGITADO. A tabela de indicadores e montada das leituras, e o
 *    marcador {{identificador}} no corpo e substituido aqui, pela leitura
 *    congelada na versao. O modelo explica numero; nao produz numero.
 * 3. A VERSAO ANTIGA QUE MUDA SOZINHA. Cada versao de one page guarda uma copia
 *    do roadmap que projetou. Publicar um roadmap novo nao pode alterar o que uma
 *    versao ja publicada mostra.
 *
 * Uso:
 *   node render.mjs --one-page envelope.json [--roadmap envelope-roadmap.json]
 *                   [--anterior .rumbo/anterior.json]
 *                   [--marca .rumbo/marca.json] [--tema .rumbo/tema.css]
 *                   [--config .rumbo/one-page.config.json]
 *                   [--saida .rumbo/artefato.html]
 *
 * Omitir --roadmap significa "o roadmap nao mudou nesta semana": o one page
 * aponta a mesma versao de novo, e o contador dele nao anda.
 *
 * DOIS ARQUIVOS DE CONFIGURACAO, e a divisao e a mesma das camadas do metodo.
 * `marca.json` e da CASA e vale para todas as skills: nome, cor, fonte, logo,
 * logo. `one-page.config.json` e so deste artefato: modo do roadmap,
 * granularidade, de onde vem o movimento. Cor escrita nos dois diverge.
 *
 * Sem marca nem tema ele roda no tema neutro, que nao e a identidade de ninguem.
 * Rode `scripts/configurar.mjs`, na raiz do plugin, uma vez.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";

// ---------------------------------------------------------------------------
// argumentos e arquivos do plugin
// ---------------------------------------------------------------------------

function args(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    if (!argv[i].startsWith("--")) continue;
    const chave = argv[i].slice(2);
    const proximo = argv[i + 1];
    if (proximo && !proximo.startsWith("--")) { out[chave] = proximo; i++; }
    else out[chave] = true;
  }
  return out;
}

const opts = args(process.argv);
const saida = opts.saida || ".rumbo/artefato.html";

function ler(caminho, obrigatorio = false) {
  if (!caminho || caminho === true || !existsSync(caminho)) {
    if (obrigatorio) {
      console.error(`[render] falta ${caminho || "o arquivo"}.`);
      process.exit(1);
    }
    return null;
  }
  try { return JSON.parse(readFileSync(caminho, "utf8")); }
  catch (e) { console.error(`[render] ${caminho} nao e JSON valido: ${e.message}`); process.exit(1); }
}

/** Arquivos do proprio plugin, resolvidos a partir deste script: assim o
 *  renderizador funciona tanto instalado quanto rodado do repositorio. */
const daqui = (rel) => readFileSync(new URL(rel, import.meta.url), "utf8");

const modelo = daqui("./modelo.html");
const motor = daqui("./base.css");

/** Identidade da casa, compartilhada com o deck e as release notes. */
const marca = ler(opts.marca ?? ".rumbo/marca.json") ?? {};
/** Ajuste que e so deste artefato. Opcional: o render tem default para tudo. */
const config = ler(opts.config ?? ".rumbo/one-page.config.json") ?? {};

/** Tema da casa se houver; o neutro se nao. O neutro nao e identidade de
 *  ninguem, e existe para o documento sair legivel antes da configuracao. */
const caminhoTema = opts.tema ?? ".rumbo/tema.css";
const tema = existsSync(caminhoTema) ? readFileSync(caminhoTema, "utf8") : daqui("./tema-neutro.css");
if (!existsSync(caminhoTema)) {
  console.error("[render] aviso: sem tema configurado, saindo no neutro. Rode scripts/configurar.mjs para gerar o seu.");
}

/** Simbolo opcional. Sem ele o cabecalho sai so com o nome, e isso e valido. */
const caminhoSimbolo = marca.logo?.simbolo;
const simbolo =
  caminhoSimbolo && existsSync(caminhoSimbolo)
    ? readFileSync(caminhoSimbolo, "utf8").replace(/<!--[\s\S]*?-->/g, "").trim()
    : "";

const novoOnePage = ler(opts["one-page"], true);
const novoRoadmap = ler(opts.roadmap);
const anterior = ler(opts.anterior) ?? {};

// ---------------------------------------------------------------------------
// texto
// ---------------------------------------------------------------------------

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const nada = "nao informado";

function num(v, casas = 1) {
  if (v == null || v === "" || Number.isNaN(Number(v))) return nada;
  return Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: casas });
}
const sinal = (v, casas = 1) =>
  v == null || Number.isNaN(v) ? nada : `${v > 0 ? "+" : v < 0 ? "-" : ""}${num(Math.abs(v), casas)}`;

function data(d) {
  if (!d) return nada;
  const x = new Date(d);
  return Number.isNaN(x.getTime()) ? String(d) : x.toLocaleDateString("pt-BR");
}

/** Markdown minimo: titulo, paragrafo, lista, negrito, codigo. Nada de tabela,
 *  de proposito: tabela no corpo e o erro que a regua reprova antes de chegar aqui. */
function md(texto) {
  const linhas = String(texto ?? "").split("\n");
  const fora = [];
  let paragrafo = [];
  let lista = [];

  const inline = (s) =>
    esc(s)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  const fechaParagrafo = () => {
    if (paragrafo.length) { fora.push(`<p>${inline(paragrafo.join(" "))}</p>`); paragrafo = []; }
  };
  const fechaLista = () => {
    if (lista.length) { fora.push(`<ul>${lista.map((i) => `<li>${inline(i)}</li>`).join("")}</ul>`); lista = []; }
  };

  for (const l of linhas) {
    const t = l.trim();
    if (!t) { fechaParagrafo(); fechaLista(); continue; }
    const h = t.match(/^(#{2,4})\s+(.*)$/);
    if (h) { fechaParagrafo(); fechaLista(); fora.push(`<h3>${inline(h[2])}</h3>`); continue; }
    const li = t.match(/^[-*]\s+(.*)$/);
    if (li) { fechaParagrafo(); lista.push(li[1]); continue; }
    fechaLista();
    paragrafo.push(t);
  }
  fechaParagrafo(); fechaLista();
  return fora.join("\n");
}

// ---------------------------------------------------------------------------
// leituras: a serie de cada indicador, com a variacao apurada
// ---------------------------------------------------------------------------

/**
 * Junta as leituras desta versao com as ja congeladas nas anteriores. O marcador
 * precisa resolver mesmo quando a leitura veio numa versao passada, senao a
 * pagina publica um buraco no lugar do numero.
 */
function serieDeLeituras(envelope, historicoOnePage) {
  const todas = [];
  for (const v of historicoOnePage) todas.push(...((v.envelope ?? v).leituras ?? []));
  todas.push(...(envelope.leituras ?? []));

  const porSlug = new Map();
  for (const l of todas) {
    if (!l?.slug) continue;
    const lista = porSlug.get(l.slug) ?? [];
    // Mesma leitura reenviada numa versao nova sobrescreve a antiga.
    const i = lista.findIndex((x) => x.periodo === l.periodo);
    if (i >= 0) lista[i] = l; else lista.push(l);
    porSlug.set(l.slug, lista);
  }
  for (const [, lista] of porSlug)
    lista.sort((a, b) => String(b.periodo).localeCompare(String(a.periodo)));
  return porSlug;
}

/** A direcao e semantica, e sai do cruzamento com sobe_e_bom. Nunca do sinal cru. */
function variacao(serie) {
  const [a, b] = serie;
  if (!a || !b || a.valor_num == null || b.valor_num == null) return null;
  const d = a.valor_num - b.valor_num;
  const pct = b.valor_num !== 0 ? (d / Math.abs(b.valor_num)) * 100 : null;
  const melhor = a.sobe_e_bom ?? b.sobe_e_bom ?? true;
  return {
    delta: d,
    pct,
    direcao: d === 0 ? "estavel" : d > 0 === !!melhor ? "melhorou" : "piorou",
    dias: Math.round((new Date(a.periodo) - new Date(b.periodo)) / 86400000) || null,
  };
}

/**
 * A unidade chega como palavra na leitura ("percent", "dias", "horas"), porque
 * quem a informa e a origem e nao o documento. Colada no numero ela saia como
 * "63percent", que nao e portugues nem notacao.
 *
 * Simbolo gruda, palavra ganha espaco. A lista cobre o que aparece; o que nao
 * estiver nela cai no caso geral, que e o certo para "dias", "horas", "pedidos".
 */
const SIMBOLOS = { percent: "%", pct: "%", "%": "%", brl: " R$", usd: " US$", graus: "°" };

function comUnidade(valor, unidade) {
  const u = String(unidade ?? "").trim();
  if (!u) return valor;
  const s = SIMBOLOS[u.toLowerCase()];
  return s ? `${valor}${esc(s)}` : `${valor} ${esc(u)}`;
}

/* Duas casas no valor exibido. Com uma so, uma leitura de 78,95% saia como 79%
   na tabela, e o documento passava a mostrar um numero que ninguem informou. */
const valorDe = (l) => (l?.texto ? esc(l.texto) : comUnidade(num(l?.valor_num, 2), l?.unidade));

/**
 * Substitui {{identificador}} e {{identificador.delta_pct}} pela leitura congelada.
 * Roda DEPOIS do markdown, sobre HTML ja escapado, e por isso injeta marcacao.
 */
function marcadores(html, porSlug) {
  return html.replace(/\{\{\s*([a-z0-9][a-z0-9-]*)(?:\.([a-z_]+))?\s*\}\}/gi, (todo, slug, campo) => {
    const serie = porSlug.get(slug);
    if (!serie?.length) return `<span class="marcador" title="leitura ausente">${esc(todo)}</span>`;
    const v = variacao(serie);
    let saida;
    if (!campo) saida = valorDe(serie[0]);
    else if (campo === "delta_pct") saida = v?.pct != null ? `${sinal(v.pct)}%` : nada;
    else if (campo === "delta") saida = v ? comUnidade(sinal(v.delta), serie[0].unidade) : nada;
    else if (campo === "periodo") saida = esc(serie[0].periodo ?? nada);
    else saida = valorDe(serie[0]);
    return `<span class="marcador">${saida}</span>`;
  });
}

function tabelaIndicadores(porSlug) {
  if (!porSlug.size) return `<p class="vazio">Nenhum indicador registrado nesta versão.</p>`;

  /** Data curta sob o valor: a coluna de leitura saiu, e a data mora na celula
   *  a que ela pertence. Assim cada linha diz quando foi medida, mesmo quando
   *  uma metrica fecha no mes e a vizinha fecha na semana. */
  const dia = (p) => {
    if (!p) return "";
    const d = new Date(p);
    if (Number.isNaN(d.getTime())) return `<span class="quando">(${esc(p)})</span>`;
    return `<span class="quando">(${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")})</span>`;
  };

  /* A meta ao lado do valor e o que faz a leitura dizer se esta bem ou mal sem
     ninguem precisar lembrar o plano de cabeca. Aceita rotulo proprio: numa curva
     de plano, "esperado" diz mais que "meta". */
  const meta = (l) => {
    const m = l?.meta;
    if (!m || m.valor == null) return "";
    const sinal = m.regra === "acima_de" ? "≥ " : m.regra === "abaixo_de" ? "≤ " : "";
    return `<br><span class="meta-leitura">${esc(m.rotulo ?? "meta")} ${sinal}${comUnidade(num(m.valor, 2), l.unidade)}</span>`;
  };

  const linhas = [];
  for (const [slug, serie] of porSlug) {
    const a = serie[0];
    const v = variacao(serie);
    /* A variacao virou parenteses dentro do atual. O sinal de mais ou de menos
       carrega a direcao sozinho, e por isso a palavra saiu: a regra da casa
       proibe estado que dependa SO de cor, e o sinal e forma, nao tinta. */
    const var_ = v
      ? ` <span class="delta dir ${v.direcao}">(${comUnidade(sinal(v.delta), a.unidade)})</span>`
      /* Sem base de comparacao nao se escreve nada aqui: a coluna Anterior ja
         diz que nao ha leitura anterior, e repetir a ausencia gastava uma linha
         e abria um buraco entre o valor e a data. */
      : "";

    linhas.push(`<tr>
      <td><span class="nome">${esc(a.nome || slug)}</span>${a.definicao ? `<span class="def">${esc(a.definicao)}</span>` : ""}</td>
      <td class="n">${serie[1] ? `${valorDe(serie[1])}<br>${dia(serie[1].periodo)}` : `<span class="def">${nada}</span>`}</td>
      <td class="n"><span class="atual">${valorDe(a)}</span>${var_}<br>${dia(a.periodo)}${meta(a)}</td>
      <td class="obs">${esc(a.observacao ?? "")}${a.fonte ? `<span class="def">origem: ${esc(a.fonte)}</span>` : ""}</td>
    </tr>`);
  }

  return `<div class="rolagem"><table class="indicadores">
    <thead><tr><th>Indicador</th><th>Anterior</th><th>Atual</th><th>O que ela diz</th></tr></thead>
    <tbody>${linhas.join("")}</tbody>
  </table></div>`;
}

// ---------------------------------------------------------------------------
// roadmap
// ---------------------------------------------------------------------------

const alca = (i) => i.payload ?? i;

function chips(item) {
  const issues = alca(item).issues ?? [];
  if (!issues.length) return "";
  return `<span class="chips">${issues
    .map((q) => {
      const critica = /urgent|high|p0|p1/i.test(q.prioridade ?? "");
      const fechada = !!q.concluida_em || /done|closed|completed/i.test(q.estado ?? "");
      const classes = ["chip", critica ? "critica" : "", fechada ? "fechada" : ""].filter(Boolean).join(" ");
      const titulo = esc(`${q.titulo ?? ""}${q.prioridade ? ` (${q.prioridade})` : ""}${q.estado ? `, ${q.estado}` : ""}`);
      return q.url
        ? `<a class="${classes}" href="${esc(q.url)}" target="_blank" rel="noopener" title="${titulo}">${esc(q.id ?? "")}</a>`
        : `<span class="${classes}" title="${titulo}">${esc(q.id ?? "")}</span>`;
    })
    .join("")}</span>`;
}

/**
 * Tres tons, e nenhum deles e decoracao:
 *   risco    o que a conversa da semana discute, com barra de atencao
 *   previsto planejado e ainda nao comecado, em italico apagado
 *   cortado  o que saiu do escopo, riscado e apagado
 *
 * "cortado" nao apaga o item da grade de proposito. A decisao de largar e
 * informacao, e costuma ser a mais valiosa do trimestre: some com a linha e
 * some com o registro de que alguem decidiu.
 */
const TONS = { risco: "risco", previsto: "previsto", cortado: "cortado" };

function celula(item, comChips) {
  const a = alca(item);
  const tom = TONS[a.destaque] ?? TONS[a.tom] ?? "";
  /* O alvo da celula e o que transforma a barra de risco em afirmacao verificavel:
     sem ele, "risco" e opiniao; com ele, e o acumulado ficando abaixo do numero. */
  const alvo = a.alvo ? `<span class="alvo">${esc(a.alvo)}</span>` : "";
  return `<div class="celula${tom ? " " + tom : ""}">${esc(item.texto)}${alvo}${comChips ? chips(item) : ""}</div>`;
}

function estacionamento(itens) {
  const parados = itens.filter((i) => alca(i).estadoNnl === "parking");
  if (!parados.length) return "";
  return `<div class="bloco">
    <h2>Estacionamento</h2>
    <p class="subtitulo">Não priorizado neste trimestre, e ainda assim vivo o bastante para voltar à conversa.</p>
    <ul class="estacionamento">${parados
      .map((i) => {
        const p = alca(i);
        const e = p.estacionamento ?? {};
        return `<li>
          <span class="tipo">${esc(e.tipo ?? "sem tipo")}</span>
          <span class="parado-corpo">
            <b>${esc(i.texto)}</b>
            ${p.descricao ? `<span class="parado-desc">${esc(p.descricao)}</span>` : ""}
            ${e.motivo ? `<span class="criterio">${esc(e.motivo)}</span>` : ""}
          </span>
        </li>`;
      })
      .join("")}</ul>
  </div>`;
}

/**
 * A grade. `comChips` e a unica diferenca entre o corte detalhado (aba Roadmap) e
 * o enxuto (dentro do one page). O enxuto e gerado do mesmo dado, nunca redigitado:
 * e por isso que os dois nao podem divergir.
 */
function grade(env, comChips) {
  if (!env) return `<p class="vazio">Nenhum roadmap publicado ainda. A grade aparece quando houver um.</p>`;
  const meta = env.meta ?? {};
  const itens = (env.itens ?? []).filter((i) => alca(i).estadoNnl !== "parking");

  if (meta.modo === "now_next_later") {
    const grupos = { now: [], next: [], later: [] };
    for (const i of itens) (grupos[alca(i).estadoNnl] ?? grupos.later).push(i);
    const bloco = (titulo, lista) => `<div class="coluna-nnl">
      <h3>${titulo}</h3>
      ${lista.length
        ? `<ul>${lista.map((i) => `<li>${esc(i.texto)}${alca(i).criterio ? `<span class="criterio">Conclui quando: ${esc(alca(i).criterio)}</span>` : ""}${comChips ? chips(i) : ""}</li>`).join("")}</ul>`
        : `<p class="vazio">Vazio.</p>`}
    </div>`;
    return `<div class="nnl">${bloco("Agora", grupos.now)}${bloco("Proximo", grupos.next)}${bloco("Depois", grupos.later)}</div>`;
  }

  const faixas = meta.faixas ?? [];
  const semanas = meta.colunas ?? [];
  if (!faixas.length || !semanas.length)
    return `<p class="vazio">Roadmap em linha do tempo sem faixas ou colunas declaradas.</p>`;

  /* O corte enxuto NAO e um segundo roadmap: ele e o detalhado agrupado. Cada
     coluna declara em que grupo cai, e o enxuto renderiza os grupos. E isso que
     permite a semana no detalhado e a quinzena no one page sem manter duas
     grades, que divergiriam em semanas.

     Sem grupos declarados, os dois cortes usam as mesmas colunas, que e o
     comportamento de antes. */
  const grupos = meta.grupos ?? [];
  const agrupar = !comChips && grupos.length > 0;
  const colunas = agrupar ? grupos : semanas;
  const grupoDe = new Map(semanas.map((c) => [c.slug, c.grupo]));
  const naColuna = (i, c) =>
    agrupar ? grupoDe.get(alca(i).coluna) === c.slug : alca(i).coluna === c.slug;

  const cabecalho = colunas
    .map((c) => `<th scope="col" class="${c.atual ? "agora" : ""}">${esc(c.rotulo)}</th>`)
    .join("");

  const corpo = faixas
    .map((f) => {
      const celulas = colunas
        .map((c) => {
          let achados = itens.filter((i) => alca(i).faixa === f.slug && naColuna(i, c));
          /* Agrupar semanas junta o esforco que atravessa a quinzena, e o mesmo
             texto aparecia duas vezes na celula. No enxuto isso e ruido: quem le
             a quinzena quer saber que a frente esta em curso, nao quantas semanas
             ela ocupa. O detalhado continua mostrando semana a semana. */
          if (agrupar) {
            const vistos = new Set();
            achados = achados.filter((i) => !vistos.has(i.texto) && vistos.add(i.texto));
          }
          return `<td class="${c.atual ? "agora" : ""}">${achados.map((i) => celula(i, comChips)).join("")}</td>`;
        })
        .join("");
      const outros = f.tipo === "outros" ? " outros" : "";
      return `<tr><th scope="row" class="faixa${outros}">${esc(f.titulo)}${
        f.aposta ? `<span class="aposta">${esc(f.aposta)}</span>` : ""
      }</th>${celulas}</tr>`;
    })
    .join("");

  /* A largura minima acompanha o numero de colunas, e o passo depende do corte.
     O DETALHADO pode rolar: ele e a tela de discussao, as celulas levam chips de
     ocorrencia, e quem abre aquela aba esta disposto a rolar de lado.
     O ENXUTO nao pode. Ele e o documento, lido de relance, e a grade cortada
     escondia justamente a coluna do periodo atual, que e onde o olho vai
     primeiro. Com passo menor as seis quinzenas cabem na folha inteira, e o
     texto da celula, que ali e curto, aguenta a coluna mais estreita.

     Isto foi achado olhando um print, e nao pela regua: largura que corta nao
     aparece em nenhuma checagem de texto. */
  const passo = comChips ? 10.5 : 7.5;
  return `<div class="rolagem"><table class="grade" style="min-width: calc(12rem + ${colunas.length} * ${passo}rem)">
    <thead><tr><th scope="col">Faixa</th>${cabecalho}</tr></thead>
    <tbody>${corpo}</tbody>
  </table></div>`;
}

// ---------------------------------------------------------------------------
// one page
// ---------------------------------------------------------------------------

/**
 * O insight e a tese da versao, e ele le como manchete: duas linhas. Tres ja o
 * transformam em paragrafo grande, e a tese perde o peso de abertura.
 *
 * CSS nao sabe quantos caracteres o texto tem, e por isso quem decide o teto do
 * corpo e o renderizador, do mesmo jeito que ele conta paragrafos antes de marcar
 * .prosa-duas. A conta: na folha cheia cabem cerca de 1750 caracteres-vezes-pixel
 * por linha, entao duas linhas pedem `2 * 1750 / caracteres` pixels de corpo.
 *
 * O piso e o teto vem do clamp, que continua mandando na tela estreita: abaixo de
 * mil pixels de folha, duas linhas exigiriam um corpo pequeno demais para uma
 * manchete, e ali ela volta a ocupar tres.
 */
const TETO_INSIGHT = 34.4; // 2,15rem, o tamanho de manchete curta
const MIN_INSIGHT = 22;    // abaixo disto deixa de ler como manchete

function blocoInsight(texto) {
  if (!texto || !String(texto).trim()) return "";
  const n = String(texto).trim().length;
  const teto = Math.max(MIN_INSIGHT, Math.min(TETO_INSIGHT, (2 * 1750) / n));
  return `<div class="bloco insight-cerca" style="--insight-teto: ${teto.toFixed(1)}px">
      <p class="insight">${esc(texto)}</p>
    </div>`;
}

function objetivos(itens) {
  const okrs = itens.filter((i) => i.kind === "okr");
  if (!okrs.length) return "";
  return `<div class="bloco">
    <h2>Objetivos em destaque</h2>
    <ul class="objetivos" data-n="${okrs.length}">${okrs
      .map((o) => {
        const p = o.payload ?? {};
        const abandonado = p.estado === "abandonado";
        return `<li class="objetivo${abandonado ? " abandonado" : ""}">
          <span class="valor">${esc(p.destaque ?? nada)}</span>
          <span class="enunciado">${esc(o.texto)}</span>
          ${abandonado ? `<span class="nota">Abandonado no trimestre</span>` : ""}
        </li>`;
      })
      .join("")}</ul>
  </div>`;
}

const GENEROS = {
  decisao_roadmap: "Decisão que move o roadmap",
  risco: "Risco",
  pergunta: "Pergunta aberta",
  nota_metodo: "Nota de método",
  dependencia: "Dependência externa",
  proximo_passo: "Próximo passo",
};

/** Devolve so o miolo: quem embrulha e o chamador, porque este bloco divide a
 *  linha com a tabela de indicadores e nao pode trazer bloco proprio. */
function decisoes(itens) {
  const lista = itens.filter((i) => i.kind === "decisao");
  if (!lista.length)
    return `<p class="vazio">Nenhuma decisão nesta versão, e isso está declarado.</p>`;

  // Ordem do metodo: o que exige resposta de alguem vem primeiro.
  const ordem = ["pergunta", "decisao_roadmap", "risco", "dependencia", "nota_metodo", "proximo_passo"];
  lista.sort((a, b) => ordem.indexOf(a.genero) - ordem.indexOf(b.genero));

  return `<ul class="decisoes">${lista
      .map((d) => {
        const p = d.payload ?? {};
        const exige = [];
        if (d.afeta_roadmap_slug) exige.push(`<span><b>Move</b> ${esc(d.afeta_roadmap_slug)}</span>`);
        if (p.impacto) exige.push(`<span><b>Impacto</b> ${esc(p.impacto)}</span>`);
        /* O caminho mora DENTRO do item que ele resolve. Solto numa linha propria
           ele obrigava o leitor a ligar dois blocos por conta, e quem le rapido
           ligava errado: o passo aparecia como iniciativa sem causa. */
        if (p.caminho) exige.push(`<span><b>Caminho</b> ${esc(p.caminho)}</span>`);
        if (p.quem_resolve) exige.push(`<span><b>Resolve</b> ${esc(p.quem_resolve)}</span>`);
        if (p.afeta_indicador) exige.push(`<span><b>Afeta</b> ${esc(p.afeta_indicador)}</span>`);
        if (p.prazo) exige.push(`<span><b>Prazo</b> ${data(p.prazo)}</span>`);
        if (p.quem) exige.push(`<span><b>Com</b> ${esc(p.quem)}</span>`);
        if ((d.escala_para ?? []).length)
          exige.push(`<span class="para">Para ${esc(d.escala_para.join(", "))}</span>`);
        return `<li class="decisao ${esc(d.genero ?? "")}">
          <span class="genero">${esc(GENEROS[d.genero] ?? d.genero ?? "Item")}</span>
          <p>${esc(d.texto)}</p>
          ${exige.length ? `<span class="exige">${exige.join("")}</span>` : ""}
        </li>`;
      })
      .join("")}</ul>`;
}

/**
 * A tabela entra DENTRO da secao de indicadores da prosa, logo apos os paragrafos
 * dela. Renderizar as duas como blocos irmaos punha "Indicadores" na tela duas
 * vezes seguidas, e separava a tabela do texto que existe para explica-la.
 *
 * O titulo procurado e o mesmo que a regua do metodo usa para achar digito solto:
 * se o corpo nao tiver secao de indicador, a tabela cai no fim, rotulada.
 */
/**
 * Bloco de prosa, com a decisao de coluna unica ou duas colunas tomada AQUI e nao
 * no CSS. Duas colunas preenchem a folha e preservam a medida de leitura, mas um
 * bloco de um paragrafo virava duas colunas de duas linhas, que le pior que o
 * paragrafo inteiro. CSS nao conta paragrafo; o renderizador conta.
 */
function blocoProsa(html) {
  if (!html.trim()) return "";
  // Lista ocupa a folha inteira em coluna unica: bullet e curto, entao a medida
  // longa nao atrapalha, e partir uma lista em duas colunas quebra a sequencia
  // que o leitor esta seguindo.
  if (/<ul>|<ol>/.test(html)) return `<div class="bloco prosa prosa-larga">${html}</div>`;

  // Dois paragrafos ja se distribuem bem, um em cada coluna. O caso ruim e o de
  // um so, que a coluna parte no meio da frase.
  const paragrafos = (html.match(/<p>/g) ?? []).length;
  return `<div class="bloco prosa${paragrafos >= 2 ? " prosa-duas" : ""}">${html}</div>`;
}

/**
 * Indicadores e acao e decisao voltaram a ocupar a linha inteira, uma sob a
 * outra. A tabela cabe sem espremer a observacao, e os cartoes de decisao usam
 * a largura para caber tres por linha, que e onde eles param de ser uma pilha.
 *
 * O titulo da secao pertence a este bloco. Se o corpo trouxer uma secao chamada
 * "Indicadores", o titulo dela sai, senao a tela mostra o mesmo titulo duas vezes.
 */
const PORTUGUES = ["nenhum", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez"];
const porExtenso = (n) => PORTUGUES[n] ?? String(n);

/**
 * O subtitulo conta os indicadores e diz de onde eles vieram, e as duas coisas
 * saem dos dados. Ele ja esteve escrito a mao aqui, dizendo "quatro leituras" em
 * um documento que mostrava tres: numero que ninguem informou e exatamente o que
 * a regua reprova no corpo, e nao pode entrar pela porta do renderizador.
 */
function subtituloIndicadores(porSlug) {
  const n = porSlug.size;
  if (!n) return "";
  const fontes = new Set();
  for (const [, serie] of porSlug) for (const l of serie) if (l?.fonte) fontes.add(l.fonte);
  const so = fontes.size === 1 ? [...fontes][0] : null;
  /* Concordancia com "indicador", que e masculino: singular apurado, plural todos
     apurados. Escrever a frase inteira nos dois generos e mais barato do que
     montar concordancia por pedaco. */
  const um = n === 1;
  const origem =
    so === "manual"
      ? um ? ", apurado à mão" : ", todos apurados à mão"
      : so
        ? um ? `, de origem ${so}` : `, todos de origem ${so}`
        : "";
  return `${porExtenso(n)} ${um ? "indicador" : "indicadores"}${origem}.`;
}

function secoesFinais(prosa, tabela, itensDecisao, porSlug) {
  const limpa = prosa.replace(/<h3>[^<]*[Ii]ndicador[^<]*<\/h3>/g, "");
  const sub = subtituloIndicadores(porSlug);
  return `${blocoProsa(limpa)}
    <div class="bloco">
      <h2>Indicadores que importam</h2>
      ${sub ? `<p class="subtitulo">${sub.charAt(0).toUpperCase()}${sub.slice(1)}</p>` : ""}
      ${tabela}
      <p class="legenda">Valores congelados nesta versão. Não mudam quando a leitura mudar depois.</p>
    </div>
    <div class="bloco">
      <h2>Ação e decisão</h2>
      <p class="subtitulo">O que se decidiu, o que trava, e o que precisa de resposta.</p>
      ${decisoes(itensDecisao)}
    </div>`;
}

function painelOnePage(env, roadmapProjetado, porSlug) {
  const corpo = marcadores(md(env.body_md ?? ""), porSlug);
  return `<section class="painel" role="tabpanel" data-alvo="one-page" aria-labelledby="aba-one-page">
    ${blocoInsight(env.insight)}
    ${objetivos(env.itens ?? [])}
    <div class="bloco">
      <h2>Roadmap, corte enxuto${roadmapProjetado ? ` (v${roadmapProjetado.__versao ?? env.meta?.roadmapVersao ?? "?"})` : ""}</h2>
      ${grade(roadmapProjetado, false)}
    </div>
    ${secoesFinais(corpo, tabelaIndicadores(porSlug), env.itens ?? [], porSlug)}
  </section>`;
}

function painelRoadmap(env) {
  if (!env)
    return `<section class="painel" role="tabpanel" data-alvo="roadmap" aria-labelledby="aba-roadmap" hidden>
      <p class="vazio">Nenhum roadmap publicado ainda.</p>
    </section>`;
  return `<section class="painel" role="tabpanel" data-alvo="roadmap" aria-labelledby="aba-roadmap" hidden>
    ${env.insight ? `<div class="bloco insight-cerca"><p class="insight">${esc(env.insight)}</p></div>` : ""}
    <div class="bloco">
      <h2>Roadmap, corte detalhado${env.meta?.granularidade ? `, por ${esc(env.meta.granularidade)}` : ""}</h2>
      ${grade(env, true)}
    </div>
    ${estacionamento(env.itens ?? [])}
    ${blocoProsa(md(env.body_md ?? ""))}
  </section>`;
}

// ---------------------------------------------------------------------------
// cadeia de versoes
// ---------------------------------------------------------------------------

const trilhaAnterior = (tipo) => {
  const t = anterior[tipo] ?? {};
  const historico = Array.isArray(t.historico) ? t.historico : [];
  const atual = t.atual ?? null;
  return { historico, atual, versao: atual?.versao ?? historico.at(-1)?.versao ?? 0 };
};

const antesOnePage = trilhaAnterior("one_page");
const antesRoadmap = trilhaAnterior("roadmap");
const agora = new Date();

// Sem --roadmap, o roadmap nao mudou: reaproveita o publicado e o contador nao anda.
const roadmapAtual = novoRoadmap
  ? { versao: antesRoadmap.versao + 1, publicado_em: agora.toISOString(), envelope: novoRoadmap }
  : antesRoadmap.atual;

if (!roadmapAtual && !novoRoadmap) {
  console.error("[render] aviso: nenhum roadmap, nem novo nem anterior. A aba de roadmap vai declarar a ausencia.");
}

// O apontamento nao e formalidade: sem ele a leitura cai no roadmap mais recente,
// e publicar um roadmap novo mudaria a grade de um documento ja publicado.
const versaoRoadmapApontada = novoOnePage.meta?.roadmapVersao ?? roadmapAtual?.versao ?? null;
if (roadmapAtual && versaoRoadmapApontada !== roadmapAtual.versao) {
  console.error(
    `[render] aviso: o one page aponta meta.roadmapVersao ${versaoRoadmapApontada}, e o roadmap desta publicacao e v${roadmapAtual.versao}.`,
  );
}

/** Copia do roadmap projetado, dentro da versao. E o que congela a projecao. */
const projetado = roadmapAtual
  ? { ...JSON.parse(JSON.stringify(roadmapAtual.envelope)), __versao: roadmapAtual.versao }
  : null;

const onePageAtual = {
  versao: antesOnePage.versao + 1,
  publicado_em: agora.toISOString(),
  envelope: novoOnePage,
  roadmap_projetado: projetado,
};

const cadeia = {
  one_page: {
    atual: onePageAtual,
    historico: [...antesOnePage.historico, ...(antesOnePage.atual ? [antesOnePage.atual] : [])],
  },
  roadmap: {
    atual: roadmapAtual,
    historico: novoRoadmap
      ? [...antesRoadmap.historico, ...(antesRoadmap.atual ? [antesRoadmap.atual] : [])]
      : antesRoadmap.historico,
  },
};

// Da mais nova para a mais antiga: quem abre quer a de agora.
const versoes = [cadeia.one_page.atual, ...cadeia.one_page.historico].sort((a, b) => b.versao - a.versao);

const blocos = versoes
  .map((v) => {
    const env = v.envelope ?? v;
    const rm = v.roadmap_projetado ?? projetado;
    const porSlug = serieDeLeituras(
      env,
      cadeia.one_page.historico.filter((h) => h.versao < v.versao),
    );
    const antiga = v.versao !== onePageAtual.versao;
    return `  <div class="versao" data-versao="${v.versao}"${antiga ? " hidden" : ""}>
    ${antiga ? `<div class="aviso-versao"><b>v${v.versao}</b><span>Voce esta lendo uma versao anterior, publicada em ${data(v.publicado_em)}. Ela e imutavel, e mostra o roadmap que projetou na epoca.</span></div>` : ""}
    ${painelOnePage(env, rm, porSlug)}
    ${painelRoadmap(rm)}
  </div>`;
  })
  .join("\n");

const opcoes = versoes
  .map((v) => `<option value="${v.versao}">v${v.versao} · ${data(v.publicado_em)}</option>`)
  .join("");

const periodo = novoOnePage.year && novoOnePage.quarter ? `${novoOnePage.year} Q${novoOnePage.quarter}` : "";

/**
 * O Google Fonts e o unico host de fonte que a pagina publicada aceita. Familia
 * do sistema nao vai para o link: pedir "Georgia" de la devolve 404 e a pagina
 * espera por nada. Nome que nao existir la cai no fallback em silencio, e por
 * isso o primeiro render se confere no navegador.
 */
const DO_SISTEMA = /^(system-ui|-apple-system|georgia|arial|helvetica|times|times new roman|courier|verdana|tahoma|sans-serif|serif|monospace|ui-monospace)$/i;

function linkDeFontes(fontes = {}) {
  const familias = [
    fontes.titulo ? [fontes.titulo, "wght@500;600"] : null,
    fontes.corpo ? [fontes.corpo, "wght@400;500;600;700"] : null,
  ]
    .filter(Boolean)
    .filter(([nome]) => !DO_SISTEMA.test(String(nome).trim()))
    .map(([nome, pesos]) => `family=${encodeURIComponent(String(nome).trim()).replace(/%20/g, "+")}:${pesos}`);

  if (!familias.length) return "";
  return `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${familias.join("&")}&display=swap">`;
}

function blocoMarca() {
  return `${simbolo}\n      <b>${esc(marca.nome ?? marca.casa ?? "")}</b>`;
}

/* O titulo nomeia a aba e o cartao na galeria, e por isso e o nome da casa e nao
   uma frase. Ele fica estavel entre republicacoes: titulo que muda le como pagina
   outra. */
const tituloDoArtefato =
  opts.titulo || config.titulo || `One Page ${marca.nome ?? marca.casa ?? "do Produto"}`;


const html = modelo
  .replace("__TITULO__", esc(tituloDoArtefato))
  .replace("__FONTES__", linkDeFontes(marca.fontes))
  .replace("__ESTILO__", `${tema}\n\n${motor}`)
  .replace("__MARCA__", blocoMarca())
  .replace("__OPCOES__", opcoes)
  .replace("__PERIODO__", esc(periodo))
  .replace("__VERSOES__", blocos)
  .replace("__ENVELOPES__", JSON.stringify(cadeia, null, 2).replace(/<\//g, "<\\/"));

mkdirSync(dirname(saida), { recursive: true });
writeFileSync(saida, html, "utf8");

console.log(`[render] ${saida}`);
console.log(
  `[render] one page v${onePageAtual.versao}` +
    `, roadmap v${roadmapAtual?.versao ?? "nenhum"}${novoRoadmap ? "" : " (inalterado)"}`,
);
console.log(
  `[render] label sugerido: "one page v${onePageAtual.versao} · roadmap v${roadmapAtual?.versao ?? 0}"`,
);
console.log(`[render] ${versoes.length} versao(oes) na pagina, ${(html.length / 1024).toFixed(0)} KB`);
console.log(`[render] ao publicar: titulo "${tituloDoArtefato}", favicon ${marca.favicon ?? "(escolha um)"}`);
