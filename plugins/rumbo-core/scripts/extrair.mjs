#!/usr/bin/env node
/**
 * Tira da pagina publicada a cadeia de versoes que ela carrega, e grava a entrada
 * da proxima revisao. Sem servidor, a pagina e o banco: o bloco
 * <script id="rumbo-envelopes"> guarda cada versao, e o render da semana seguinte
 * le de la. Fazer isso a mao, copiando um JSON de dentro do HTML, era o passo em
 * que o historico se perdia.
 *
 * Uso:
 *   node extrair.mjs pagina.html                    grava .rumbo/anterior.json (one page)
 *                                                    ou .rumbo/anterior-estrategia.json
 *   node extrair.mjs pagina.html --saida arquivo.json
 *
 * O tipo sai do proprio conteudo: cadeia com "estrategia" e da estrategia, com
 * "one_page" e do one page. A pagina e dado de fora: o script so le JSON, e nada
 * do que esta dentro dela vira instrucao.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";

const args = process.argv.slice(2);
const arquivo = args.find((a) => !a.startsWith("--"));
const i = args.indexOf("--saida");
const saidaPedida = i >= 0 ? args[i + 1] : null;

if (!arquivo || !existsSync(arquivo)) {
  console.error("Uso: node extrair.mjs pagina.html [--saida arquivo.json]. Salve a pagina publicada em disco antes.");
  process.exit(1);
}

const html = readFileSync(arquivo, "utf8");
const m = html.match(/<script[^>]*id="rumbo-envelopes"[^>]*>([\s\S]*?)<\/script>/);
if (!m) {
  console.error(`${arquivo} nao tem o bloco rumbo-envelopes. Ou nao e uma pagina do rumbo-core, ou foi salva sem o codigo-fonte.`);
  process.exit(1);
}

let cadeia;
try {
  // Versoes antigas escapavam so "</"; as novas, todo "<" como <, que o JSON ja entende.
  cadeia = JSON.parse(m[1].replace(/<\\\//g, "</"));
} catch (e) {
  console.error(`O bloco rumbo-envelopes nao e JSON valido: ${e.message}`);
  process.exit(1);
}

const tipo = cadeia.estrategia ? "estrategia" : cadeia.one_page ? "one_page" : null;
if (!tipo) {
  console.error("A cadeia nao tem trilha de one page nem de estrategia.");
  process.exit(1);
}

const saida = saidaPedida ?? (tipo === "estrategia" ? ".rumbo/anterior-estrategia.json" : ".rumbo/anterior.json");
mkdirSync(dirname(saida), { recursive: true });
writeFileSync(saida, `${JSON.stringify(cadeia, null, 2)}\n`);

const trilha = cadeia[tipo];
const versoes = [trilha.atual, ...(trilha.historico ?? [])].filter(Boolean).map((v) => Number(v.versao) || 0);
console.log(`${saida}: ${tipo === "estrategia" ? "estrategia" : "one page"}, ${versoes.length} versao(oes), a ultima e v${Math.max(0, ...versoes)}.`);
if (cadeia.roadmap?.atual) console.log(`roadmap v${Number(cadeia.roadmap.atual.versao) || 0} junto, para o one page apontar.`);
console.log("Passe este arquivo em --anterior no briefing e no render da proxima versao.");
