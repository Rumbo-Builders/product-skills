#!/usr/bin/env node
/**
 * Confere que os manifestos de cada agente dizem a mesma coisa.
 *
 * O rumbo-core se instala por dois caminhos: o Claude Code lê
 * `.claude-plugin/marketplace.json` e `plugins/rumbo-core/.claude-plugin/plugin.json`;
 * o Codex e os agentes do formato portável leem `.agents/plugins/marketplace.json` e
 * `plugins/rumbo-core/plugin.json`. Quatro arquivos com nome e versão são a mesma
 * doença do método copiado: um dia alguém sobe a versão num só, e um dos dois
 * agentes instala a velha. Este script reprova o CI quando divergem.
 *
 * Também confere que cada skill tem SKILL.md com `name` igual ao nome da pasta, e a
 * nota de onde estão os arquivos, que é o que a faz rodar fora do Claude Code.
 *
 * Uso: node .github/conferir-manifestos.mjs   (da raiz do repositório)
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const problemas = [];
const ler = (p) => {
  try { return JSON.parse(readFileSync(p, "utf8")); }
  catch (e) { problemas.push(`${p}: ${e.message}`); return {}; }
};

const claudeMk = ler(".claude-plugin/marketplace.json");
const agentesMk = ler(".agents/plugins/marketplace.json");

for (const entrada of claudeMk.plugins ?? []) {
  const raiz = entrada.source;
  const claude = ler(join(raiz, ".claude-plugin/plugin.json"));
  const portavel = ler(join(raiz, "plugin.json"));
  const nomes = new Set([entrada.name, claude.name, portavel.name]);
  const versoes = new Set([entrada.version, claude.version, portavel.version]);
  if (nomes.size !== 1) problemas.push(`${entrada.name}: nomes divergem entre os manifestos (${[...nomes].join(", ")})`);
  if (versoes.size !== 1) problemas.push(`${entrada.name}: versoes divergem (marketplace do Claude ${entrada.version}, .claude-plugin ${claude.version}, plugin.json ${portavel.version})`);

  const noAgentes = (agentesMk.plugins ?? []).find((p) => p.name === entrada.name);
  if (!noAgentes) problemas.push(`${entrada.name}: falta em .agents/plugins/marketplace.json`);
  else if (noAgentes.source?.path?.replace(/^\.\//, "") !== raiz.replace(/^\.\//, ""))
    problemas.push(`${entrada.name}: o caminho em .agents/plugins/marketplace.json (${noAgentes.source?.path}) nao e o do marketplace do Claude (${raiz})`);

  const skills = join(raiz, "skills");
  for (const s of existsSync(skills) ? readdirSync(skills) : []) {
    const arq = join(skills, s, "SKILL.md");
    if (!existsSync(arq)) { problemas.push(`${arq}: nao existe`); continue; }
    const texto = readFileSync(arq, "utf8");
    const nome = texto.match(/^name:\s*(\S+)/m)?.[1];
    if (nome !== s) problemas.push(`${arq}: name "${nome}" nao e o nome da pasta "${s}"`);
    if (texto.includes("${CLAUDE_PLUGIN_ROOT}") && !texto.includes("Onde estão os arquivos"))
      problemas.push(`${arq}: usa \${CLAUDE_PLUGIN_ROOT} sem a nota "Onde estão os arquivos", e fora do Claude Code o caminho sai vazio`);
  }
}

if (problemas.length) {
  problemas.forEach((p) => console.log(`FALHA: ${p}`));
  process.exit(1);
}
console.log(`ok: manifestos do Claude Code e do formato portavel batem (${(claudeMk.plugins ?? []).length} plugin).`);
