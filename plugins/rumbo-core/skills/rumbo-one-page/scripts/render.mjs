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
 * O que toda pagina do core tem (esqueleto, seletor de versao, marca, tema,
 * markdown, insight, painel de acao e decisao) vem de `scripts/pagina.mjs`, no
 * plugin. Aqui fica o que so o one page sabe desenhar: a serie de leituras, a
 * grade do roadmap nos dois cortes, e a cadeia com o roadmap projetado.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { preset } from "./blocos.mjs";
import {
  args, lerJson, esc, nada, num, sinal, data, md,
  blocoInsight, blocoProsa, decisoes, linkDeFontes,
  carregarCasa, blocoMarca, trilha, avisoVersao, montarPagina, urlSegura,
} from "../../../scripts/pagina.mjs";

// ---------------------------------------------------------------------------
// argumentos e arquivos
// ---------------------------------------------------------------------------

const opts = args(process.argv);
const saida = opts.saida || ".rumbo/artefato.html";

/** O CSS que e so deste artefato, resolvido a partir deste script. */
const onePageCss = readFileSync(new URL("./one-page.css", import.meta.url), "utf8");

/** Identidade da casa (marca, tema, simbolo) e o ajuste que e so deste artefato. */
const { marca, config, tema, simbolo, paginaCss } = carregarCasa(opts, {
  configPadrao: ".rumbo/one-page.config.json",
  rotulo: "render",
});

/* --esqueleto <tipo>: o desenho proposto, com dado de exemplo, para a pessoa ver a
   pagina antes de qualquer numero (modo desenhar). O desenho e o do config, quando
   ja ha um, ou o de partida do tipo; o dado e o do exemplo mais proximo. Nada aqui
   e versao: a pagina sai sem historico, e com o aviso de que e esqueleto. */
const esqueleto = typeof opts.esqueleto === "string" ? opts.esqueleto : null;
function envelopeDeEsqueleto(tipo) {
  const exemplo = ["marketing", "juridico"].includes(tipo) ? `exemplo-envelope-${tipo}.json`
    : tipo === "financeiro" ? "exemplo-envelope-juridico.json"
    : tipo === "produto" ? "exemplo-envelope.json" : "exemplo-envelope-marketing.json";
  const env = JSON.parse(readFileSync(new URL(`./${exemplo}`, import.meta.url), "utf8"));
  env.meta = { ...(env.meta ?? {}), desenho: config.desenho ?? preset(tipo) ?? preset("produto") };
  env.squad = tipo;
  // O funil nao tem exemplo proprio: tres estagios de mostra, so para o esqueleto.
  const usa = (t) => env.meta.desenho.abas.some((a) => a.blocos.some((b) => b.tipo === t));
  if (usa("funil") && !env.itens.some((i) => i.kind === "funil"))
    env.itens.push(
      { kind: "funil", slug: "f-contato", texto: "Contato feito", payload: { ordem: 1, contagem: 23, regra: "reunião marcada com o decisor" } },
      { kind: "funil", slug: "f-proposta", texto: "Proposta enviada", payload: { ordem: 2, contagem: 8, regra: "proposta com preço entregue" } },
      { kind: "funil", slug: "f-fechado", texto: "Contrato assinado", payload: { ordem: 3, contagem: 2, regra: "contrato assinado pelas duas partes" } },
    );
  return env;
}
const novoOnePage = esqueleto ? envelopeDeEsqueleto(esqueleto) : lerJson(opts["one-page"], true);
const novoRoadmap = esqueleto ? null : lerJson(opts.roadmap);
// --anterior pedido e ausente falha: virar v1 em silencio apagaria o historico da pagina.
const anterior = esqueleto ? {} : (typeof opts.anterior === "string" ? lerJson(opts.anterior, true) : null) ?? {};

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
      const url = urlSegura(q.url);
      return url
        ? `<a class="${classes}" href="${esc(url)}" target="_blank" rel="noopener" title="${titulo}">${esc(q.id ?? "")}</a>`
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

/**
 * Indicadores e acao e decisao ocupam a linha inteira, uma sob a outra. A
 * tabela cabe sem espremer a observacao, e os cartoes de decisao usam a largura.
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
        ? um ? `, de origem ${esc(so)}` : `, todos de origem ${esc(so)}`
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
      <h2>Roadmap, corte enxuto${roadmapProjetado ? ` (v${Number(roadmapProjetado.__versao ?? env.meta?.roadmapVersao) || "?"})` : ""}</h2>
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
// o desenho do time: abas e blocos que o time escolheu
// ---------------------------------------------------------------------------
//
// Envelope com meta.desenho e desenhado bloco a bloco, na ordem do time. Sem ele,
// o caminho e o de sempre, logo abaixo, e a pagina de produto sai identica. O
// catalogo e a regua estao em blocos.mjs e em metodo/one-page-blocos.md.

const TITULO_PADRAO = {
  objetivos: "Objetivos", decisoes: "Ação e decisão", indicadores: "Indicadores que importam",
  saude: "Indicadores de saúde", trilha_mensal: "Meta mês a mês", roadmap: "Roadmap",
  acoes: "Ações para chegar lá", verba: "Verba", checklist: "Checklist",
  funil: "Funil", outras_frentes: "Outras frentes",
};
const ROTULO_ROTA = { no_ritmo: "no ritmo", em_risco: "em risco", fora_de_rota: "fora de rota" };
const ROTULO_STATUS = {
  realizado: "realizado", confirmado: "confirmado", em_andamento: "em andamento", planejado: "planejado",
  a_propor: "a propor", negociado: "negociado", bloqueado: "bloqueado", cancelado: "cancelado",
};
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const mesCurto = (per) => {
  const [a, m] = String(per ?? "").split("-").map(Number);
  return m && MESES[m - 1] ? `${MESES[m - 1]}/${esc(String(a).slice(2))}` : esc(per ?? nada);
};
/** Prazo legivel: mes vira "nov/26", dia vira "12/11". */
const prazoTexto = (v) => {
  const [a, m, d] = String(v ?? "").split("-");
  if (d) return esc(`${d}/${m}`);
  return m ? mesCurto(`${a}-${m}`) : esc(v ?? nada);
};
const reais = (v) => (typeof v === "number" ? `R$ ${v.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}` : nada);
const aDefinir = (v) => typeof v === "string" && v.trim().toLowerCase() === "a definir";
const alvoTexto = (v) => (aDefinir(v) ? `<span class="a-definir">a definir</span>` : esc(v ?? nada));
const bloco = (titulo, corpo, sub = "") =>
  `<div class="bloco">
      <h2>${esc(titulo)}</h2>${sub ? `\n      <p class="subtitulo">${sub}</p>` : ""}
      ${corpo}
    </div>`;

/** KRs agrupados por objetivo. Sem payload.objetivo em nenhum, vale o card de sempre. */
function blocoObjetivos(itens, titulo) {
  const okrs = itens.filter((i) => i.kind === "okr");
  if (!okrs.some((o) => o.payload?.objetivo)) return objetivos(itens).replace("<h2>Objetivos em destaque</h2>", `<h2>${esc(titulo)}</h2>`);
  const grupos = new Map();
  for (const o of okrs) {
    const ob = o.payload?.objetivo ?? { slug: o.slug, titulo: o.texto };
    if (!grupos.has(ob.slug)) grupos.set(ob.slug, { ob, krs: [] });
    grupos.get(ob.slug).krs.push(o);
  }
  const html = [...grupos.values()].map(({ ob, krs }, n) => {
    const rota = krs.find((k) => k.payload?.rota)?.payload;
    return `<section class="objetivo-grupo">
        <header class="objetivo-cab">
          <span class="objetivo-cod">O${n + 1}</span>
          <h3 class="objetivo-titulo">${esc(ob.titulo)}</h3>
          ${rota?.rota ? `<span class="rota ${esc(rota.rota)}">${esc(ROTULO_ROTA[rota.rota] ?? rota.rota)}</span>` : ""}
        </header>
        ${rota?.rota_motivo ? `<p class="rota-motivo">${esc(rota.rota_motivo)}</p>` : ""}
        <ul class="krs">${krs.map((k) => {
          const p = k.payload ?? {};
          return `<li class="kr">
            <span class="kr-nome">${esc(k.texto)}</span>
            <span class="kr-meta"><span class="de">${esc(p.baseline ?? nada)}</span><span class="seta" aria-hidden="true">→</span><span class="para">${alvoTexto(p.meta)}</span></span>
            <span class="kr-unidade">${esc(p.unidade ?? "")}${p.atual != null ? ` · atual <b>${esc(p.atual)}</b>` : ""}</span>
          </li>`;
        }).join("")}</ul>
      </section>`;
  }).join("");
  return bloco(titulo, `<div class="objetivos-grupos">${html}</div>`);
}

/** A meta de cada mes de cada KR, com o realizado. "a definir" aparece escrito, nunca vazio. */
function blocoTrilha(itens, titulo) {
  const metas = itens.filter((i) => i.kind === "meta_mes");
  if (!metas.length) return bloco(titulo, `<p class="vazio">Nenhuma meta mensal nesta versão.</p>`);
  const meses = [...new Set(metas.map((m) => m.payload?.periodo))].sort();
  const krs = [...new Set(metas.map((m) => m.payload?.kr))];
  const nome = (slug) => itens.find((i) => i.slug === slug)?.texto ?? slug;
  const linhas = krs.map((kr) => `<tr><th scope="row">${esc(nome(kr))}</th>${meses.map((mes) => {
    const m = metas.find((x) => x.payload?.kr === kr && x.payload?.periodo === mes)?.payload;
    if (!m) return `<td class="n">${nada}</td>`;
    const real = m.realizado != null ? `<span class="real-mes">${esc(m.realizado)}</span>` : "";
    return `<td class="n">${real}${real ? `<span class="de-meta">de ${alvoTexto(m.alvo)}</span>` : alvoTexto(m.alvo)}</td>`;
  }).join("")}</tr>`).join("");
  return bloco(titulo, `<div class="rolagem"><table class="trilha">
      <thead><tr><th>Resultado-chave</th>${meses.map((m) => `<th class="n">${mesCurto(m)}</th>`).join("")}</tr></thead>
      <tbody>${linhas}</tbody>
    </table></div>`, "Realizado sobre a meta de cada mês. Sem realizado, a célula mostra só a meta.");
}

function blocoAcoes(itens, titulo) {
  const acoes = itens.filter((i) => i.kind === "acao");
  if (!acoes.length) return bloco(titulo, `<p class="vazio">Nenhuma ação nesta versão.</p>`);
  const nome = (slug) => itens.find((i) => i.slug === slug)?.texto;
  const linhas = acoes.map((a) => {
    const p = a.payload ?? {};
    return `<tr class="acao-linha st-${esc(p.status ?? "")}">
        <td class="acao-txt"><b>${esc(a.texto)}</b>${p.dono ? `<span>${esc(p.dono)}</span>` : ""}</td>
        <td class="n">${prazoTexto(p.prazo)}</td>
        <td class="kr-ref">${p.kr ? esc(curtoTexto(nome(p.kr) ?? p.kr)) : `<span class="vazio">sem KR</span>`}</td>
        <td><span class="status ${esc(p.status ?? "")}">${esc(ROTULO_STATUS[p.status] ?? p.status ?? nada)}</span></td>
      </tr>`;
  }).join("");
  return bloco(titulo, `<div class="rolagem"><table class="acoes">
      <thead><tr><th>Ação</th><th>Prazo</th><th>Move</th><th>Status</th></tr></thead>
      <tbody>${linhas}</tbody>
    </table></div>`);
}

function blocoVerba(env, titulo) {
  const verbas = (env.itens ?? []).filter((i) => i.kind === "verba");
  if (!verbas.length) return bloco(titulo, `<p class="vazio">Nenhuma verba nesta versão.</p>`);
  const meses = [...new Set(verbas.map((v) => v.payload?.periodo))].sort();
  const rubricas = [...new Set(verbas.map((v) => v.texto))];
  const de = (r, m) => verbas.find((v) => v.texto === r && v.payload?.periodo === m)?.payload;
  const linhas = rubricas.map((r) => `<tr><th scope="row">${esc(r)}</th>${meses.map((m) => {
    const p = de(r, m);
    if (!p) return `<td class="n">${nada}</td>`;
    return `<td class="n">${reais(p.aprovado)}${p.realizado != null ? `<span class="de-meta">realizado ${reais(p.realizado)}</span>` : ""}</td>`;
  }).join("")}<td class="n total">${reais(verbas.filter((v) => v.texto === r).reduce((s, v) => s + (v.payload?.aprovado ?? 0), 0))}</td></tr>`).join("");
  const porMes = meses.map((m) => reais(verbas.filter((v) => v.payload?.periodo === m).reduce((s, v) => s + (v.payload?.aprovado ?? 0), 0)));
  const total = verbas.reduce((s, v) => s + (v.payload?.aprovado ?? 0), 0);
  const fontes = [...new Set(verbas.map((v) => v.payload?.fonte).filter(Boolean))];
  return bloco(titulo, `<div class="rolagem"><table class="verba">
      <thead><tr><th>Rubrica</th>${meses.map((m) => `<th class="n">${mesCurto(m)}</th>`).join("")}<th class="n">Total</th></tr></thead>
      <tbody>${linhas}</tbody>
      <tfoot><tr><td>Total aprovado</td>${porMes.map((v) => `<td class="n">${v}</td>`).join("")}<td class="n">${reais(total)}</td></tr></tfoot>
    </table></div>
    ${fontes.length ? `<p class="legenda">Fonte: ${fontes.map(esc).join("; ")}.</p>` : ""}`);
}

function blocoChecklist(itens, titulo) {
  const lista = itens.filter((i) => i.kind === "checklist");
  if (!lista.length) return bloco(titulo, `<p class="vazio">Nenhum item nesta versão.</p>`);
  return bloco(titulo, `<ul class="checklist">${lista.map((c) => {
    const p = c.payload ?? {};
    return `<li class="${p.feito ? "feito" : "pendente"}">
        <span class="marca-check" aria-hidden="true">${p.feito ? "✓" : ""}</span>
        <span class="check-corpo"><b>${esc(c.texto)}</b><span>${p.feito ? "feito" : "pendente"} · ${esc(p.dono ?? nada)} · até ${prazoTexto(p.prazo)}</span></span>
      </li>`;
  }).join("")}</ul>`);
}

function blocoFunil(itens, titulo) {
  const estagios = itens.filter((i) => i.kind === "funil").sort((a, b) => (a.payload?.ordem ?? 0) - (b.payload?.ordem ?? 0));
  if (!estagios.length) return bloco(titulo, `<p class="vazio">Nenhum estágio nesta versão.</p>`);
  return bloco(titulo, `<ol class="funil">${estagios.map((e) => `<li>
      <span class="funil-n">${esc(e.payload?.contagem ?? nada)}</span>
      <span class="funil-corpo"><b>${esc(e.texto)}</b><span>${esc(e.payload?.regra ?? "")}</span></span>
    </li>`).join("")}</ol>`);
}

function blocoFrentes(itens, titulo) {
  const frentes = itens.filter((i) => i.kind === "frente");
  if (!frentes.length) return bloco(titulo, `<p class="vazio">Nenhuma outra frente nesta versão.</p>`);
  return bloco(titulo, `<ul class="frentes">${frentes.map((f) => `<li><b>${esc(f.texto)}</b>${f.payload?.dono ? `<span>${esc(f.payload.dono)}</span>` : ""}</li>`).join("")}</ul>`);
}

/** Leituras de saude: o nome, o valor de agora e os ultimos da serie. */
function blocoSaude(porSlug, titulo) {
  const series = [...porSlug.values()].filter((s) => s[0]?.categoria === "saude");
  if (!series.length) return bloco(titulo, `<p class="vazio">Nenhum indicador de saúde nesta versão.</p>`);
  return bloco(titulo, `<ul class="saude">${series.map((s) => `<li>
      <span class="nome">${esc(s[0].nome ?? s[0].slug)}</span>
      <span class="valor">${valorDe(s[0])}</span>
      <span class="trilha-saude">${s.slice(0, 4).reverse().map((l) => `${esc(String(l.periodo ?? ""))} <b>${valorDe(l)}</b>`).join(" · ")}</span>
      <span class="det">origem: ${esc(s[0].fonte ?? nada)}</span>
    </li>`).join("")}</ul>`);
}

const curtoTexto = (t) => (String(t).length > 48 ? `${String(t).slice(0, 45)}…` : String(t));

/** Um bloco do desenho, desenhado com o dado da versao. */
function desenharBloco(b, env, rm, porSlug, corpo) {
  const titulo = b.titulo ?? TITULO_PADRAO[b.tipo] ?? b.tipo;
  const itens = env.itens ?? [];
  switch (b.tipo) {
    case "insight": return blocoInsight(env.insight);
    case "objetivos": return blocoObjetivos(itens, b.titulo ?? "Objetivos");
    case "decisoes": return bloco(titulo, decisoes(itens), "O que se decidiu, o que trava, e o que precisa de resposta.");
    case "indicadores": {
      const sem = new Map([...porSlug].filter(([, s]) => s[0]?.categoria !== "saude"));
      const sub = subtituloIndicadores(sem);
      return bloco(titulo, `${tabelaIndicadores(sem)}
      <p class="legenda">Valores congelados nesta versão. Não mudam quando a leitura mudar depois.</p>`, sub ? `${sub.charAt(0).toUpperCase()}${sub.slice(1)}` : "");
    }
    case "saude": return blocoSaude(porSlug, titulo);
    case "trilha_mensal": return blocoTrilha(itens, titulo);
    case "roadmap": {
      const det = b.corte === "detalhado";
      const t = b.titulo ?? `Roadmap, corte ${det ? "detalhado" : "enxuto"}${rm ? ` (v${Number(rm.__versao ?? env.meta?.roadmapVersao) || "?"})` : ""}`;
      return `${bloco(t, rm ? grade(rm, det) : `<p class="vazio">Nenhum roadmap publicado ainda.</p>`)}${det && rm ? estacionamento(rm.itens ?? []) : ""}`;
    }
    case "acoes": return blocoAcoes(itens, titulo);
    case "verba": return blocoVerba(env, titulo);
    case "checklist": return blocoChecklist(itens, titulo);
    case "funil": return blocoFunil(itens, titulo);
    case "outras_frentes": return blocoFrentes(itens, titulo);
    case "texto": return blocoProsa(corpo);
    default: return "";
  }
}

/** Os paineis de uma versao, um por aba do desenho DELA, e um aviso nas abas que ela nao tinha. */
function paineisDoDesenho(env, rm, porSlug, slugsAtuais) {
  const corpo = marcadores(md(env.body_md ?? ""), porSlug);
  const desenho = env.meta.desenho;
  const proprias = (desenho.abas ?? []).map((aba, n) => {
    const blocos = aba.blocos.flatMap((b) => (b.tipo === "nucleo" ? [{ tipo: "insight" }, { tipo: "objetivos" }, { tipo: "decisoes" }] : [b]));
    return `<section class="painel" role="tabpanel" data-alvo="${esc(aba.slug)}" aria-labelledby="aba-${esc(aba.slug)}"${n ? " hidden" : ""}>
    ${blocos.map((b) => desenharBloco(b, env, rm, porSlug, corpo)).join("\n    ")}
  </section>`;
  });
  const faltam = slugsAtuais.filter((s) => !(desenho.abas ?? []).some((a) => a.slug === s));
  return [...proprias, ...faltam.map((s) => `<section class="painel" role="tabpanel" data-alvo="${esc(s)}" hidden>
    <p class="vazio">Esta aba não existia nesta versão.</p>
  </section>`)].join("\n    ");
}

// ---------------------------------------------------------------------------
// cadeia de versoes
// ---------------------------------------------------------------------------

const antesOnePage = trilha(anterior, "one_page");
const antesRoadmap = trilha(anterior, "roadmap");
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

/* As abas da pagina sao as do desenho da versao mais nova. Versao antiga com
   outro desenho mostra as dela, e um aviso nas abas que nao tinha. */
const desenhoAtual = novoOnePage.meta?.desenho;
const abasDaPagina = desenhoAtual
  ? desenhoAtual.abas.map((a) => ({ id: a.slug, rotulo: a.titulo }))
  : [
      { id: "one-page", rotulo: "One page" },
      { id: "roadmap", rotulo: "Roadmap detalhado" },
    ];
/* Versao antiga sem desenho, sob uma pagina com desenho, ainda precisa das abas
   de sempre para ser lida. */
for (const v of [...cadeia.one_page.historico])
  if (desenhoAtual && !(v.envelope ?? v).meta?.desenho)
    for (const a of [{ id: "one-page", rotulo: "One page" }, { id: "roadmap", rotulo: "Roadmap detalhado" }])
      if (!abasDaPagina.some((x) => x.id === a.id)) abasDaPagina.push(a);

const blocos = versoes
  .map((v) => {
    const env = v.envelope ?? v;
    const rm = v.roadmap_projetado ?? projetado;
    const porSlug = serieDeLeituras(
      env,
      cadeia.one_page.historico.filter((h) => h.versao < v.versao),
    );
    const antiga = v.versao !== onePageAtual.versao;
    // Versao com desenho sai bloco a bloco, no desenho que ela congelou; sem desenho, o layout de sempre.
    const paineis = env.meta?.desenho
      ? paineisDoDesenho(env, rm, porSlug, abasDaPagina.map((x) => x.id))
      : `${painelOnePage(env, rm, porSlug)}
    ${painelRoadmap(rm)}`;
    const avisoEsqueleto = esqueleto
      ? `<div class="aviso-versao"><b>Esqueleto</b><span>O desenho proposto, com dado de exemplo. Nenhum número aqui é do time.</span></div>`
      : "";
    return `  <div class="versao" data-versao="${v.versao}"${antiga ? " hidden" : ""}>
    ${avisoEsqueleto}${antiga ? avisoVersao(v.versao, v.publicado_em, "Ela e imutavel, e mostra o desenho e o roadmap que tinha na epoca.") : ""}
    ${paineis}
  </div>`;
  })
  .join("\n");

const opcoes = versoes
  .map((v) => `<option value="${v.versao}">v${v.versao} · ${data(v.publicado_em)}</option>`)
  .join("");

const periodo = novoOnePage.year && novoOnePage.quarter ? `${novoOnePage.year} Q${novoOnePage.quarter}` : "";

/* O titulo nomeia a aba e o cartao na galeria, e por isso e o nome da casa e nao
   uma frase. Ele fica estavel entre republicacoes: titulo que muda le como pagina
   outra. */
/* Com desenho de outro time, o padrao leva o nome do time, e nao "do Produto". */
const tituloDoArtefato =
  opts.titulo || config.titulo ||
  (desenhoAtual && desenhoAtual.tipo !== "produto"
    ? `One Page ${novoOnePage.squad ? novoOnePage.squad.charAt(0).toUpperCase() + novoOnePage.squad.slice(1) : desenhoAtual.tipo} ${marca.nome ?? ""}`.trim()
    : `One Page ${marca.nome ?? marca.casa ?? "do Produto"}`);

/* A assinatura da Rumbo, discreta, no rodape. O link que circula e da casa, e e a
   marca dela que ele mostra; a linha so diz de onde veio, e a casa desliga com
   "assinatura": false no one-page.config.json ou no marca.json. */
function assinatura() {
  if (config.assinatura === false || marca.assinatura === false) return "";
  return `<footer class="assinatura">Feito com o método Rumbo</footer>`;
}

/* UMA URL, DUAS ABAS, e a ordem importa. One page primeiro, porque e o
   documento. O detalhado depois, porque e o que menos gente abre e o que mais
   rola de lado. */
const html = montarPagina({
  titulo: tituloDoArtefato,
  fontes: linkDeFontes(marca.fontes),
  estilo: `${tema}\n\n${paginaCss}\n\n${onePageCss}`,
  marcaHtml: blocoMarca(marca, simbolo),
  opcoes,
  periodo,
  abas: abasDaPagina,
  versoesHtml: blocos,
  rodape: assinatura(),
  envelopes: cadeia,
});

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
