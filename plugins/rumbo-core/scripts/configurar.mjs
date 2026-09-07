#!/usr/bin/env node
/**
 * Primeira vez: a entrevista vira o perfil da casa.
 *
 * Este script e do PLUGIN, nao de uma skill. O que ele grava em `.rumbo/` e lido
 * pelo one page, pelo deck, pelas release notes e pela escrita. Identidade escrita
 * em dois lugares diverge na semana em que alguem editar so um, e foi por isso que
 * ele subiu de dentro do one page para ca.
 *
 * Quem pergunta e a skill, porque escolher a cor da marca e o tom da casa e
 * conversa. O que este script faz e o que a conversa erra: conferir contraste,
 * derivar o conjunto completo de variaveis a partir de duas cores, e montar o tema
 * claro, o escuro e o do deck sem que ninguem precise escrever CSS.
 *
 * A REGRA QUE ELE APLICA: cor de marca nao vira cor de letra so porque e bonita.
 * Um acento que reprova em contraste sobre fundo claro e escurecido ate passar,
 * e o valor original fica reservado para preenchimento. Publicar um documento
 * que parte dos leitores nao consegue ler e um defeito silencioso: quem enxerga
 * bem nunca percebe.
 *
 * O QUE ELE NAO ESCREVE E PROPOSITAL. O tom de voz sai em `perfil.md`, em prosa,
 * porque quem le tom e o modelo, nao o motor. E o script nunca sobrescreve um
 * `perfil.md` que ja existe: cor se regera, texto escrito a mao nao.
 *
 * Uso:
 *   node configurar.mjs --casa <id> --nome "<Nome>" --acento "#1f4f7a"
 *                       [--destaque "#4b9fd5"] [--fonte-titulo "Fraunces"]
 *                       [--fonte-corpo "Inter"] [--simbolo caminho.svg]
 *                       [--logo-claro logo.png] [--logo-escuro logo-branco.png]
 *                       [--logo-aspecto 1.13] [--favicon "📈"]
 *                       [--tom "direto, sem introducao"]
 *                       [--ressalva "uma nota"] [--ressalva "outra"]
 *                       [--saida .rumbo]
 *
 * Escreve `marca.json`, `tema.css`, `tema.js` e, se ainda nao existir, `perfil.md`.
 *
 * `.rumbo/` NAO ENTRA EM REPOSITORIO. Ele carrega nome, cor e logo de cliente, e a
 * checagem de vazamento so le texto: um PNG de logo passa por ela sem ser visto.
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function args(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    if (!argv[i].startsWith("--")) continue;
    const chave = argv[i].slice(2);
    const proximo = argv[i + 1];
    if (proximo && !proximo.startsWith("--")) {
      if (chave in out) out[chave] = [].concat(out[chave], proximo);
      else out[chave] = proximo;
      i++;
    } else out[chave] = true;
  }
  return out;
}

const o = args(process.argv);
const saida = o.saida || ".rumbo";

/** `--time` continua valendo: o one page chamava assim antes deste script subir. */
const casa = o.casa || o.time;

if (!casa || !o.acento) {
  console.error("Falta --casa <identificador> e --acento <#hex>.");
  console.error("A cor de acento e a unica cor obrigatoria: o resto e derivado dela.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// cor
// ---------------------------------------------------------------------------

function hex2rgb(h) {
  const s = String(h).trim().replace(/^#/, "");
  const c = s.length === 3 ? s.split("").map((x) => x + x).join("") : s;
  if (!/^[0-9a-f]{6}$/i.test(c)) {
    console.error(`"${h}" nao e uma cor hexadecimal.`);
    process.exit(1);
  }
  return [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16));
}

const rgb2hex = (r, g, b) =>
  "#" + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");

function rgb2hsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h, s, l];
}

function hsl2hex(h, s, l) {
  const f = (n) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    return 255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)));
  };
  return rgb2hex(f(0), f(8), f(4));
}

/** Luminancia relativa da WCAG. A curva nao e linear, e por isso o olho engana. */
function lum(hex) {
  const [r, g, b] = hex2rgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function razao(a, b) {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

const fmt = (n) => n.toFixed(2).replace(".", ",");

/** Escurece (ou clareia) mantendo matiz e saturacao ate passar no contraste. */
function ateContrastar(cor, fundo, alvo = 4.5, sentido = "escuro") {
  let [h, s, l] = rgb2hsl(hex2rgb(cor));
  let atual = cor;
  for (let i = 0; i < 100 && razao(atual, fundo) < alvo; i++) {
    l = sentido === "escuro" ? Math.max(0, l - 0.01) : Math.min(1, l + 0.01);
    atual = hsl2hex(h, s, l);
  }
  return atual;
}

// ---------------------------------------------------------------------------
// derivar o conjunto inteiro a partir do acento
// ---------------------------------------------------------------------------

const acento = "#" + String(o.acento).replace(/^#/, "").toLowerCase();
const destaque = o.destaque ? "#" + String(o.destaque).replace(/^#/, "").toLowerCase() : null;
const [h, sAcento] = rgb2hsl(hex2rgb(acento));

const papel = "#ffffff";
// Neutro puxado para o matiz do acento. Cinza puro le como cor nao escolhida.
const fundo = hsl2hex(h, 0.10, 0.972);
const superficie2 = hsl2hex(h, 0.12, 0.952);
const regua = hsl2hex(h, 0.12, 0.888);
const reguaForte = hsl2hex(h, 0.12, 0.792);
const texto = hsl2hex(h, 0.10, 0.130);
const apagado = ateContrastar(hsl2hex(h, 0.08, 0.44), fundo, 4.5);
const tinta = ateContrastar(acento, papel, 4.5);

// Escuro: mesmo matiz, saturacao contida, e o acento clareado para virar tinta.
const sEsc = Math.min(0.35, sAcento);
const fundoEsc = hsl2hex(h, sEsc, 0.065);
const superficieEsc = hsl2hex(h, sEsc, 0.105);
const superficie2Esc = hsl2hex(h, sEsc, 0.145);
const reguaEsc = hsl2hex(h, sEsc, 0.205);
const reguaForteEsc = hsl2hex(h, sEsc, 0.305);
const textoEsc = hsl2hex(h, 0.12, 0.915);
const apagadoEsc = ateContrastar(hsl2hex(h, 0.10, 0.62), fundoEsc, 4.5, "claro");
const tintaEsc = ateContrastar(destaque ?? acento, fundoEsc, 4.5, "claro");

/* O deck pede de um a tres acentos. O segundo e o destaque, se houver, e senao
   uma versao dessaturada do primeiro. O terceiro e DERIVADO, e por isso vem dito
   no arquivo: uma casa que tem uma terceira cor de verdade troca a mao. */
const acento2 = destaque ?? hsl2hex(h, Math.max(0.12, sAcento * 0.55), 0.55);
const acento3 = hsl2hex((h + 0.5) % 1, Math.max(0.20, sAcento * 0.7), 0.44);

// ---------------------------------------------------------------------------
// o que a regua diz, e o que ela nao perdoa
// ---------------------------------------------------------------------------

const avisos = [];
const r = (a, b) => razao(a, b);

if (r(acento, papel) < 4.5) {
  avisos.push(
    `O acento ${acento} da ${fmt(r(acento, papel))}:1 sobre branco e reprova como letra. ` +
      `A cor de texto virou ${tinta} (${fmt(r(tinta, papel))}:1). O ${acento} continua servindo como preenchimento.`,
  );
}
if (destaque && r(destaque, papel) < 4.5) {
  avisos.push(
    `O destaque ${destaque} da ${fmt(r(destaque, papel))}:1 sobre branco. Ele nao entra como letra em fundo claro: ` +
      `so como preenchimento, ou como letra sobre a superficie escura.`,
  );
}
if (destaque && r(destaque, acento) < 3) {
  avisos.push(
    `Destaque e acento tem so ${fmt(r(destaque, acento))}:1 entre si. Encostados na tela, vao parecer a mesma cor.`,
  );
}

// ---------------------------------------------------------------------------
// arquivos
// ---------------------------------------------------------------------------

const nome = o.nome || casa;
const ressalvas = [].concat(o.ressalva ?? o.rodape ?? []).filter((x) => typeof x === "string");
const caminho = (v) => (typeof v === "string" ? v : null);

const marca = {
  _leia:
    "Identidade da casa, lida por TODAS as skills do rumbo-core. Rode configurar.mjs de novo para regerar, ou edite a mao: quem le este arquivo sao os scripts, nao o gerador.",
  _onde: "Ajuste que vale so para uma skill nao entra aqui. O one page, por exemplo, guarda o dele em one-page.config.json, ao lado.",
  casa,
  nome,
  favicon: o.favicon || "📈",
  cores: {
    acento,
    destaque,
    _leia: "As duas cores que a casa escolheu, como foram escolhidas. O que o contraste exigiu ajustar esta em tema.css, com a conta ao lado.",
  },
  fontes: {
    titulo: o["fonte-titulo"] || null,
    corpo: o["fonte-corpo"] || null,
    _leia:
      "Nomes de familia. Na pagina publicada o render busca no Google Fonts, que e o unico host de fonte que o artifact aceita: nome que nao existir la cai no fallback em silencio, e por isso o primeiro render se confere no navegador.",
  },
  logo: {
    simbolo: caminho(o.simbolo),
    emFundoClaro: caminho(o["logo-claro"]),
    emFundoEscuro: caminho(o["logo-escuro"]),
    aspecto: o["logo-aspecto"] ? Number(o["logo-aspecto"]) : 1.13,
    _simbolo: 'SVG, para a pagina. Use fill="currentColor" nele: assim o simbolo acompanha o tema claro e o escuro sem segunda copia.',
    _png: "PNG, para o deck: o motor do pptx nao desenha SVG. Duas versoes, porque o deck tem quadro claro e quadro escuro.",
  },
  ressalvas,
  _ressalvas: "Notas para o rodape das release notes. O one page NAO tem rodape, e por isso nao as mostra: cuidado que precisa sair nele entra no corpo ou numa decisao.",
};

const css = `/* Tema gerado por configurar.mjs a partir de ${acento}${destaque ? ` e ${destaque}` : ""}.
   Regerar sobrescreve. Editar a mao tambem funciona: quem le isto sao os motores.

   Serve os dois motores de HTML da casa. O one page usa a lista inteira; as
   release notes usam o subconjunto, mais os dois apelidos no fim.

   O que o script conferiu, e voce nao precisa reconferir:
${["   - acento sobre branco: " + fmt(r(acento, papel)) + ":1",
   "   - cor de texto sobre branco: " + fmt(r(tinta, papel)) + ":1",
   "   - auxiliar sobre o fundo: " + fmt(r(apagado, fundo)) + ":1",
   "   - texto sobre fundo escuro: " + fmt(r(textoEsc, fundoEsc)) + ":1",
   "   - tinta sobre fundo escuro: " + fmt(r(tintaEsc, fundoEsc)) + ":1"].join("\n")}

   TODO token e declarado no :root sem condicao. Os blocos abaixo so redefinem:
   cor que existe unicamente dentro de um deles nao se aplica no estado sem
   marcacao, que e o da maioria dos leitores. */

:root {
  color-scheme: light;

  --acento:       ${acento};
  --destaque:     ${destaque ?? acento};

  --papel:        ${papel};
  --fundo:        ${fundo};
  --superficie:   ${papel};
  --superficie-2: ${superficie2};
  --escura:       ${acento};
  --tinta:        ${tinta};
  --texto:        ${texto};
  --apagado:      ${apagado};
  --regua:        ${regua};
  --regua-forte:  ${reguaForte};

  /* Semantica de estado, separada do acento: leitura de entrega, nao identidade. */
  --bom:           #2f6b3f;
  --atencao:       #8a5f00;
  --grave:         #a33131;
  --bom-fundo:     #e8f0e9;
  --atencao-fundo: #f6eddb;
  --grave-fundo:   #f6e6e6;

  --fonte-corpo:   ${JSON.stringify(o["fonte-corpo"] || "system-ui")}, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --fonte-display: ${JSON.stringify(o["fonte-titulo"] || "Georgia")}, Georgia, "Times New Roman", serif;
  --fonte-mono:    ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;

  --e1: 0.25rem; --e2: 0.5rem;  --e3: 0.75rem; --e4: 1rem;
  --e5: 1.5rem;  --e6: 2rem;    --e7: 3rem;    --e8: 4rem;

  --raio: 3px;
  --medida: 68ch;

  /* Apelidos das release notes, que nomearam duas coisas antes do one page
     existir. Um alias e mais barato do que renomear token em folha impressa. */
  --fundo-area:   ${fundo};
  --fonte-titulo: var(--fonte-corpo);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
    --papel:        ${fundoEsc};
    --fundo:        ${fundoEsc};
    --superficie:   ${superficieEsc};
    --superficie-2: ${superficie2Esc};
    --escura:       ${superficie2Esc};
    --tinta:        ${tintaEsc};
    --texto:        ${textoEsc};
    --apagado:      ${apagadoEsc};
    --regua:        ${reguaEsc};
    --regua-forte:  ${reguaForteEsc};
    --bom:           #7fc08c;
    --atencao:       #e0a72e;
    --grave:         #e88b8b;
    --bom-fundo:     #14301d;
    --atencao-fundo: #33280d;
    --grave-fundo:   #331919;
    --fundo-area:   ${fundoEsc};
  }
}

:root[data-theme="dark"] {
  color-scheme: dark;
  --papel:        ${fundoEsc};
  --fundo:        ${fundoEsc};
  --superficie:   ${superficieEsc};
  --superficie-2: ${superficie2Esc};
  --escura:       ${superficie2Esc};
  --tinta:        ${tintaEsc};
  --texto:        ${textoEsc};
  --apagado:      ${apagadoEsc};
  --regua:        ${reguaEsc};
  --regua-forte:  ${reguaForteEsc};
  --bom:           #7fc08c;
  --atencao:       #e0a72e;
  --grave:         #e88b8b;
  --bom-fundo:     #14301d;
  --atencao-fundo: #33280d;
  --grave-fundo:   #331919;
  --fundo-area:   ${fundoEsc};
}
`;

const semGrade = (x) => String(x).replace(/^#/, "").toUpperCase();

const js = `/* Tema do deck, gerado por configurar.mjs a partir de ${acento}${destaque ? ` e ${destaque}` : ""}.
   Regerar sobrescreve. Ele e irmao de tema.css: as duas cores sao as mesmas, e a
   diferenca e so o formato que cada motor le.

   O TERCEIRO ACENTO E DERIVADO, nao escolhido. Ele existe porque o catalogo de
   infograficos pede ate tres, e uma casa que tem uma terceira cor de verdade
   troca esta linha a mao. */
module.exports = {
  autor: ${JSON.stringify(nome)},

  acentos: [${[acento, acento2, acento3].map((c) => JSON.stringify(semGrade(c))).join(", ")}],

  fontes: { titulo: ${JSON.stringify(o["fonte-titulo"] || "Arial")}, corpo: ${JSON.stringify(o["fonte-corpo"] || "Calibri")} },

  /* PNG, nao SVG: o motor do pptx nao desenha vetor. Sem logo o deck e montado
     sem logo, e nada quebra. */
  logos: {
    emFundoClaro: ${JSON.stringify(caminho(o["logo-claro"]))},
    emFundoEscuro: ${JSON.stringify(caminho(o["logo-escuro"]))}
  },
  logoAspecto: ${marca.logo.aspecto}
};
`;

const perfil = `# Perfil da casa · ${nome}

Lido por **todas** as skills do rumbo-core, antes de escrever qualquer coisa. Fato
da casa mora aqui, uma vez. Se você está prestes a repetir uma linha daqui dentro
de um envelope ou de um deck, é sinal de que ela deveria ser lida daqui.

Este arquivo é prosa de propósito. Cor vira variável e o script confere; tom não
vira variável, porque quem lê tom é o modelo.

## Tom

${o.tom ? String(o.tom) : "<Como se escreve aqui. Formal ou direto, slide ou doc, número ou narrativa, quanto de contexto assumir de quem lê.>"}

**O tom ajusta o registro, e não suspende a régua.** Formal ou direto é escolha da
casa. Travessão, ênfase gráfica e vocabulário de consultoria genérica continuam
reprovando em \`metodo/_principios.md\`, e nenhuma linha escrita aqui os libera.

## Quem lê

<Quem recebe os artefatos, e o que cada um faz com eles. Duas ou três linhas. Um
documento escrito sem destinatário sai genérico, e genérico é o defeito que a
régua não pega.>

## Vocabulário

O que esta casa chama diferente. Cada linha aqui é um mal-entendido que não vai
acontecer.

| Aqui se diz | É o que o método chama de |
|---|---|
| <squad> | <time> |

## Cuidados

<O que não se fala, o que é sensível, o que passa por aprovação antes de sair. Se
houver dado sensível, diga como tratá-lo, não o escreva aqui.>
`;

mkdirSync(saida, { recursive: true });

const alvoMarca = join(saida, "marca.json");
const alvoCss = join(saida, "tema.css");
const alvoJs = join(saida, "tema.js");
const alvoPerfil = join(saida, "perfil.md");

writeFileSync(alvoMarca, JSON.stringify(marca, null, 2), "utf8");
writeFileSync(alvoCss, css, "utf8");
writeFileSync(alvoJs, js, "utf8");

/* Regerar cor e barato. Regerar texto escrito a mao apaga trabalho, e por isso o
   perfil so e criado quando ainda nao existe. */
const perfilJaExistia = existsSync(alvoPerfil);
if (!perfilJaExistia) writeFileSync(alvoPerfil, perfil, "utf8");

console.log(`[configurar] ${alvoMarca}`);
console.log(`[configurar] ${alvoCss}`);
console.log(`[configurar] ${alvoJs}`);
console.log(`[configurar] ${alvoPerfil}${perfilJaExistia ? "  (ja existia, preservado)" : "  (novo, com lacunas para preencher)"}`);
console.log("");
console.log("Contraste conferido:");
console.log(`  acento sobre branco     ${fmt(r(acento, papel))}:1`);
console.log(`  cor de texto            ${fmt(r(tinta, papel))}:1`);
console.log(`  auxiliar sobre o fundo  ${fmt(r(apagado, fundo))}:1`);
console.log(`  no escuro, texto        ${fmt(r(textoEsc, fundoEsc))}:1`);
console.log(`  no escuro, tinta        ${fmt(r(tintaEsc, fundoEsc))}:1`);

if (avisos.length) {
  console.log("");
  console.log("Ajustes que o script fez, e que voce precisa saber:");
  avisos.forEach((a) => console.log(`  - ${a}`));
}

// ---------------------------------------------------------------------------
// o que ele NAO conferiu, dito em voz alta
// ---------------------------------------------------------------------------

const pendencias = [];

if (marca.logo.simbolo && !existsSync(marca.logo.simbolo)) {
  pendencias.push(`o simbolo "${marca.logo.simbolo}" nao existe neste caminho. O cabecalho da pagina sai sem ele.`);
} else if (marca.logo.simbolo) {
  const svg = readFileSync(marca.logo.simbolo, "utf8");
  if (!/currentColor/.test(svg))
    pendencias.push(
      'o simbolo nao usa fill="currentColor". Ele mantem a cor original no tema escuro, e pode sumir no fundo.',
    );
}

for (const [chave, rotulo] of [["emFundoClaro", "--logo-claro"], ["emFundoEscuro", "--logo-escuro"]]) {
  const p = marca.logo[chave];
  if (p && !existsSync(p)) pendencias.push(`o PNG de ${rotulo} nao existe em "${p}". O deck e montado sem logo.`);
}
if (!marca.logo.emFundoClaro && !marca.logo.emFundoEscuro)
  pendencias.push("nenhum PNG de logo para o deck. Ele sai sem logo, e isso e valido, mas e escolha e nao acidente.");

if (!perfilJaExistia)
  pendencias.push(`${alvoPerfil} nasceu com lacunas entre < >. Preencha tom, quem le e vocabulario antes de escrever o primeiro artefato.`);

if (pendencias.length) {
  console.log("");
  console.log("O que o script NAO conferiu, e continua com voce:");
  pendencias.forEach((p) => console.log(`  - ${p}`));
}

console.log("");
console.log(`Nao versione ${saida}/: ele carrega nome, cor e logo, e a checagem de vazamento so le texto.`);
