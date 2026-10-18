#!/usr/bin/env node
/**
 * O que toda pagina versionada do core compartilha.
 *
 * Este modulo e do PLUGIN, nao de uma skill. O one page e a estrategia publicam
 * a mesma forma de pagina: titulo estavel, seletor de versao, abas, historico
 * embutido num bloco JSON, e os mesmos pedacos de texto (escape, markdown
 * minimo, insight como manchete, painel de acao e decisao). Tudo isso morava
 * dentro do render do one page e subiu para ca pela regra do repositorio:
 * script que serve mais de uma skill morando dentro de uma delas e a mesma
 * doenca do metodo copiado. Um dia alguem mexe nele por causa de um artefato e
 * o outro muda de cara.
 *
 * O que fica com cada skill e o que so ela sabe desenhar: a grade do roadmap e
 * a tabela de indicadores no one page, a cascata e as apostas na estrategia.
 *
 * Nenhuma dependencia alem do node.
 */

import { readFileSync, existsSync } from "node:fs";

/** Arquivos ao lado deste modulo, resolvidos a partir dele: funciona instalado
 *  e rodado do repositorio. */
const daqui = (rel) => readFileSync(new URL(rel, import.meta.url), "utf8");

// ---------------------------------------------------------------------------
// argumentos e leitura
// ---------------------------------------------------------------------------

export function args(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    if (!argv[i].startsWith("--")) continue;
    const chave = argv[i].slice(2);
    const proximo = argv[i + 1];
    if (proximo && !proximo.startsWith("--")) {
      // Flag repetida acumula, para quem recebe mais de um arquivo do mesmo tipo.
      if (chave in out) out[chave] = [].concat(out[chave], proximo);
      else out[chave] = proximo;
      i++;
    } else out[chave] = true;
  }
  return out;
}

/** Arquivo ausente devolve null, e quem chama decide o que dizer sobre a
 *  ausencia. Obrigatorio e ausente encerra: pagina sem envelope nao existe. */
export function lerJson(caminho, obrigatorio = false, rotulo = "render") {
  if (!caminho || caminho === true || !existsSync(caminho)) {
    if (obrigatorio) {
      console.error(`[${rotulo}] falta ${caminho || "o arquivo"}.${/anterior/.test(String(caminho)) ? " Extraia a versao anterior da pagina publicada com scripts/extrair.mjs." : ""}`);
      process.exit(1);
    }
    return null;
  }
  try { return JSON.parse(readFileSync(caminho, "utf8")); }
  catch (e) { console.error(`[${rotulo}] ${caminho} nao e JSON valido: ${e.message}`); process.exit(1); }
}

// ---------------------------------------------------------------------------
// texto
// ---------------------------------------------------------------------------

export const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const nada = "nao informado";

export function num(v, casas = 1) {
  if (v == null || v === "" || Number.isNaN(Number(v))) return nada;
  return Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: casas });
}

export const sinal = (v, casas = 1) =>
  v == null || Number.isNaN(v) ? nada : `${v > 0 ? "+" : v < 0 ? "-" : ""}${num(Math.abs(v), casas)}`;

/**
 * Data so com dia ("2026-07-01") e formatada pelas partes, sem passar por Date:
 * o construtor le a string como meia-noite UTC, e no fuso da casa ela virava o
 * dia anterior. Um prazo de 30/11 saindo como 29/11 e numero que ninguem
 * informou. Carimbo com hora continua passando pelo fuso local, que e o certo.
 */
export function data(d) {
  if (!d) return nada;
  const s = String(d);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  const x = new Date(d);
  // Texto que nao e data volta escapado: prazo vem do envelope, e o envelope e dado de fora.
  return Number.isNaN(x.getTime()) ? esc(s) : x.toLocaleDateString("pt-BR");
}

/** Dias de calendario entre uma data e outra (hoje, por padrao). Positivo e
 *  passado. Conta por dia, nao por hora, pelo mesmo motivo de `data`. */
export function dias(de, ate = new Date()) {
  const diaUTC = (v) => {
    if (v == null || v === "") return NaN;
    const m = typeof v === "string" ? v.match(/^(\d{4})-(\d{2})-(\d{2})$/) : null;
    if (m) return Date.UTC(+m[1], +m[2] - 1, +m[3]);
    const x = new Date(v);
    return Number.isNaN(x.getTime()) ? NaN : Date.UTC(x.getFullYear(), x.getMonth(), x.getDate());
  };
  const a = diaUTC(de);
  const b = diaUTC(ate);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((b - a) / 86400000);
}

/** Markdown minimo: titulo, paragrafo, lista, negrito, codigo. Nada de tabela,
 *  de proposito: tabela no corpo e o erro que a regua reprova antes de chegar aqui. */
export function md(texto) {
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
// blocos que toda pagina tem
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
export const TETO_INSIGHT = 34.4; // 2,15rem, o tamanho de manchete curta
export const MIN_INSIGHT = 22;    // abaixo disto deixa de ler como manchete

export function blocoInsight(texto) {
  if (!texto || !String(texto).trim()) return "";
  const n = String(texto).trim().length;
  const teto = Math.max(MIN_INSIGHT, Math.min(TETO_INSIGHT, (2 * 1750) / n));
  return `<div class="bloco insight-cerca" style="--insight-teto: ${teto.toFixed(1)}px">
      <p class="insight">${esc(texto)}</p>
    </div>`;
}

/**
 * Bloco de prosa, com a decisao de coluna unica ou duas colunas tomada AQUI e nao
 * no CSS. Duas colunas preenchem a folha e preservam a medida de leitura, mas um
 * bloco de um paragrafo virava duas colunas de duas linhas, que le pior que o
 * paragrafo inteiro. CSS nao conta paragrafo; o renderizador conta.
 */
export function blocoProsa(html) {
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

export const GENEROS = {
  decisao_roadmap: "Decisão que move o roadmap",
  risco: "Risco",
  pergunta: "Pergunta aberta",
  nota_metodo: "Nota de método",
  dependencia: "Dependência externa",
  proximo_passo: "Próximo passo",
};

/** Devolve so o miolo: quem embrulha e o chamador, porque este bloco pode dividir
 *  a linha com outro e nao pode trazer bloco proprio. Os seis generos sao os do
 *  metodo do one page, e a estrategia usa os mesmos. */
export function decisoes(itens) {
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

// ---------------------------------------------------------------------------
// a casa: marca, tema, simbolo
// ---------------------------------------------------------------------------

/**
 * O Google Fonts e o unico host de fonte que a pagina publicada aceita. Familia
 * do sistema nao vai para o link: pedir "Georgia" de la devolve 404 e a pagina
 * espera por nada. Nome que nao existir la cai no fallback em silencio, e por
 * isso o primeiro render se confere no navegador.
 */
export const DO_SISTEMA = /^(system-ui|-apple-system|georgia|arial|helvetica|times|times new roman|courier|verdana|tahoma|sans-serif|serif|monospace|ui-monospace)$/i;

export function linkDeFontes(fontes = {}) {
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

/**
 * DOIS ARQUIVOS DE CONFIGURACAO, e a divisao e a mesma das camadas do metodo.
 * `marca.json` e da CASA e vale para todas as skills: nome, cor, fonte, logo.
 * O `config` e so daquele artefato (`one-page.config.json`,
 * `estrategia.config.json`). Cor escrita nos dois diverge.
 *
 * Sem marca nem tema a pagina sai no tema neutro, que nao e a identidade de
 * ninguem. Rode `scripts/configurar.mjs`, na raiz do plugin, uma vez.
 */
export function carregarCasa(opts, { configPadrao, rotulo = "render" } = {}) {
  const marca = lerJson(opts.marca ?? ".rumbo/marca.json", false, rotulo) ?? {};
  const config = lerJson(opts.config ?? configPadrao, false, rotulo) ?? {};

  const caminhoTema = opts.tema ?? ".rumbo/tema.css";
  const temaConfigurado = existsSync(caminhoTema);
  const tema = temaConfigurado ? readFileSync(caminhoTema, "utf8") : daqui("./tema-neutro.css");
  if (!temaConfigurado) {
    console.error(`[${rotulo}] aviso: sem tema configurado, saindo no neutro. Rode scripts/configurar.mjs para gerar o seu.`);
  }

  /** Simbolo opcional. Sem ele o cabecalho sai so com o nome, e isso e valido. */
  const caminhoSimbolo = marca.logo?.simbolo;
  const simbolo =
    caminhoSimbolo && existsSync(caminhoSimbolo)
      ? svgSeguro(readFileSync(caminhoSimbolo, "utf8").replace(/<!--[\s\S]*?-->/g, "").trim(), rotulo)
      : "";

  return { marca, config, tema, temaConfigurado, simbolo, paginaCss: daqui("./pagina.css") };
}

/**
 * O simbolo entra inline na pagina publicada, e SVG carrega script. Sem um
 * sanitizador de verdade, a regra e recusar o que pode executar, e dizer.
 */
export function svgSeguro(svg, rotulo = "pagina") {
  if (/<script|<foreignObject|javascript:|\son[a-z]+\s*=|<iframe|<embed|<object/i.test(svg)) {
    console.error(`[${rotulo}] aviso: o simbolo tem script, evento ou objeto embutido, e ficou de fora da pagina. Use um SVG so de desenho.`);
    return "";
  }
  return svg;
}

/**
 * O identificador do time vira nome de arquivo em .rumbo/. Com "/" ou "..", ele
 * escreveria e apagaria fora dali. So letras, digitos, hifen e sublinhado.
 */
export function exigirId(v, rotulo = "rumbo") {
  if (v != null && v !== true && !/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(String(v))) {
    console.error(`[${rotulo}] --time "${v}" nao e um identificador: use letras, digitos, hifen e sublinhado.`);
    process.exit(1);
  }
  return v;
}

/** So http e https viram link: javascript: e data: num href executam ao clicar. */
export const urlSegura = (u) => (/^https?:\/\//i.test(String(u ?? "").trim()) ? String(u).trim() : null);

export function blocoMarca(marca, simbolo) {
  return `${simbolo}\n      <b>${esc(marca.nome ?? marca.casa ?? "")}</b>`;
}

// ---------------------------------------------------------------------------
// cadeia de versoes
// ---------------------------------------------------------------------------

/** A pagina guarda { atual, historico[] } por trilha. A versao que vem a seguir e
 *  uma a mais que a atual, e e o script que a conta. */
export function trilha(anterior, tipo) {
  const t = (anterior ?? {})[tipo] ?? {};
  // A cadeia vem da pagina publicada, que e dado de fora: a versao entra na pagina
  // como numero, e so como numero.
  const comoNumero = (v) => (v && typeof v === "object" ? { ...v, versao: Number(v.versao) || 0 } : v);
  const historico = Array.isArray(t.historico) ? t.historico.map(comoNumero) : [];
  const atual = comoNumero(t.atual ?? null);
  return { historico, atual, versao: atual?.versao ?? historico.at(-1)?.versao ?? 0 };
}

export function avisoVersao(versao, publicadoEm, frase = "Ela e imutavel.") {
  return `<div class="aviso-versao"><b>v${Number(versao) || 0}</b><span>Voce esta lendo uma versao anterior, publicada em ${data(publicadoEm)}. ${frase}</span></div>`;
}

// ---------------------------------------------------------------------------
// a pagina
// ---------------------------------------------------------------------------

/**
 * O esqueleto. A pagina publicada ja vem embrulhada em doctype, html, head e
 * body, entao aqui comeca direto no title.
 *
 * UMA URL, VARIAS ABAS, e a ordem importa: a primeira aba e o documento, e e a
 * que abre. As outras sao o detalhe, que menos gente abre.
 *
 * O seletor de versao troca o bloco .versao inteiro, e cada bloco carrega o que
 * aquela versao congelou: publicar uma versao nova nao pode mudar o que uma
 * antiga mostra.
 */
export function montarPagina({ titulo, fontes = "", estilo, marcaHtml, opcoes, periodo = "", abas, versoesHtml, envelopes, rodape = "" }) {
  if (!Array.isArray(abas) || !abas.length) throw new Error("montarPagina: nenhuma aba declarada");
  // Dentro de <script>: todo "<" escapado, senao um id com "</script>" fecha o bloco.
  const inicial = JSON.stringify(abas[0].id).replace(/</g, "\\u003c");
  const botoes = abas
    .map((a, i) => `<button class="aba" role="tab" id="aba-${esc(a.id)}" aria-controls="painel-${esc(a.id)}" aria-selected="${i === 0 ? "true" : "false"}" data-alvo="${esc(a.id)}">${esc(a.rotulo)}</button>`)
    .join("\n    ");
  // Todo "<", e nao so "</": "<!--" tambem engole o script que vem depois.
  const json = JSON.stringify(envelopes, null, 2).replace(/</g, "\\u003c");

  return `<title>${esc(titulo)}</title>
${fontes}
<style>
${estilo}
</style>

<main class="folha">
  <header class="topo">
    <span class="marca">${marcaHtml}</span>
    <span class="topo-meta">
      <span class="versoes">
        <label for="sel-versao">Versão</label>
        <select id="sel-versao">${opcoes}</select>
      </span>
      <span>${esc(periodo)}</span>
    </span>
  </header>

  <nav class="abas" role="tablist" aria-label="Seções do documento">
    ${botoes}
  </nav>

${versoesHtml}
${rodape}
</main>

<script type="application/json" id="rumbo-envelopes">
${json}
</script>

<script>
  (function () {
    var abas = Array.prototype.slice.call(document.querySelectorAll(".aba"));
    var sel = document.getElementById("sel-versao");
    var versoes = Array.prototype.slice.call(document.querySelectorAll(".versao"));

    function mostrar(versao, alvo) {
      versoes.forEach(function (v) { v.hidden = v.dataset.versao !== versao; });
      abas.forEach(function (a) {
        a.setAttribute("aria-selected", a.dataset.alvo === alvo ? "true" : "false");
      });
      document.querySelectorAll(".painel").forEach(function (p) {
        p.hidden = p.dataset.alvo !== alvo;
      });
    }

    function estado() {
      var ligada = abas.filter(function (a) { return a.getAttribute("aria-selected") === "true"; })[0];
      return {
        versao: sel ? sel.value : versoes[0].dataset.versao,
        alvo: ligada ? ligada.dataset.alvo : ${inicial},
      };
    }

    abas.forEach(function (a) {
      a.addEventListener("click", function () { mostrar(estado().versao, a.dataset.alvo); });
    });
    if (sel) sel.addEventListener("change", function () { mostrar(sel.value, estado().alvo); });

    mostrar(estado().versao, ${inicial});
  })();
</script>
`;
}
