#!/usr/bin/env node
/**
 * Regua executavel do rascunho de uma aposta ou de um objetivo, antes de gravar.
 *
 * As skills de apostas e de OKRs editam uma alca por vez, no sistema da casa, sem
 * envelope de estrategia. A regra e a mesma do envelope (`regras.cjs`), e e por
 * isso que este script nao tem regra propria de aposta ou de KR: so le o rascunho,
 * chama a regua comum e diz o resultado.
 *
 * Uso:
 *   node validar-alcas.mjs rascunho.json [--cascata .rumbo/anterior-estrategia.json]
 *
 * O rascunho tem `itens`, no vocabulario do metodo: uma aposta, ou um okr e os kr
 * dele. Sem `--cascata`, a amarracao com a escolha vira aviso de "nao conferi", e
 * nunca aprovacao calada. Sai com 1 se reprovar, com 0 se aprovar.
 */

import { readFileSync, existsSync } from "node:fs";
import regras from "./regras.cjs";

const args = process.argv.slice(2);
const arquivo = args.find((a) => !a.startsWith("--"));
const i = args.indexOf("--cascata");
const pedida = i >= 0 ? args[i + 1] : undefined;
// Sem estrategia publicada ainda, o arquivo nao existe: e aviso, nao parada.
const cascataArq = pedida && existsSync(pedida) ? pedida : undefined;

if (!arquivo) {
  console.error("Uso: node validar-alcas.mjs rascunho.json [--cascata estrategia.json]");
  process.exit(1);
}

const ler = (arq) => {
  try { return JSON.parse(readFileSync(arq, "utf8")); }
  catch (e) { console.log(`FALHA: ${arq} ilegivel: ${e.message}`); process.exit(1); }
};

const rascunho = ler(arquivo);
const itens = Array.isArray(rascunho.itens) ? rascunho.itens : [];
const problemas = [];
const avisos = [];

// A cascata publicada da as escolhas que a aposta e o objetivo podem servir.
const deCadeia = (c) => c?.estrategia?.atual?.envelope ?? c?.atual?.envelope ?? c?.envelope ?? c;
const emprestadas = cascataArq ? (deCadeia(ler(cascataArq))?.itens ?? []) : [];
const porSlug = new Map([...emprestadas, ...itens].map((x) => [x.slug, x]));
const ctx = cascataArq ? { existe: (s) => porSlug.has(s), kindDe: (s) => porSlug.get(s)?.kind } : null;
if (pedida && !cascataArq) avisos.push(`--cascata ${pedida} nao existe: sem estrategia publicada, a amarracao com a escolha nao foi conferida`);
else if (!cascataArq) avisos.push("sem --cascata: a amarracao com a escolha nao foi conferida");

if (!itens.length) problemas.push("rascunho sem itens: nada a conferir");

const vistos = new Set();
itens.forEach((it, n) => {
  const id = `itens[${n}]${it.slug ? ` ${it.slug}` : ""}`;
  if (!it.slug || !/^[a-z0-9][a-z0-9-]{0,119}$/.test(it.slug)) problemas.push(`${id}: identificador ausente ou fora do formato (minusculas e hifens)`);
  else if (vistos.has(it.slug)) problemas.push(`${id}: identificador duplicado`);
  vistos.add(it.slug);
  if (regras.falta(it.texto)) problemas.push(`${id}: texto vazio`);
  const r =
    it.kind === "aposta" ? regras.validarAposta(it, id, ctx)
    : it.kind === "okr" ? regras.validarOkr(it, id, ctx)
    : it.kind === "kr" ? regras.validarKr(it, id, ctx ?? { existe: (s) => porSlug.has(s), kindDe: (s) => porSlug.get(s)?.kind })
    : { problemas: [`${id}: kind "${it.kind}" nao e aposta, okr nem kr`], avisos: [] };
  problemas.push(...r.problemas);
  avisos.push(...r.avisos);

  // Marcos e resultados esperados da aposta, quando o rascunho os traz.
  const p = it.payload ?? {};
  for (const [k, m] of (p.marcos ?? []).entries())
    if (regras.falta(m.texto) || !/^\d{4}-\d{2}-\d{2}$/.test(m.data ?? "")) problemas.push(`${id}: marco ${k + 1} sem texto ou sem data AAAA-MM-DD`);
  const morte = String(p.criterio_matar ?? "").match(/\d{4}-\d{2}-\d{2}/)?.[0];
  if (it.kind === "aposta" && morte && !(p.marcos ?? []).some((m) => m.data === morte))
    avisos.push(`${id}: nenhum marco em ${morte}, a data do criterio de matar. O primeiro marco e a decisao de matar ou seguir`);
  for (const [k, r2] of (p.resultados ?? []).entries())
    if (regras.falta(r2.texto) || regras.falta(r2.metrica)) problemas.push(`${id}: resultado esperado ${k + 1} sem texto ou sem metrica`);
});

// O objetivo precisa de ao menos um KR, e o KR, de um objetivo do rascunho.
for (const o of itens.filter((x) => x.kind === "okr"))
  if (!itens.some((k) => k.kind === "kr" && k.payload?.objetivo === o.slug)) avisos.push(`${o.slug}: objetivo sem KR. O numero mora no KR`);

problemas.push(...regras.casa(itens));

problemas.forEach((p) => console.log(`FALHA: ${p}`));
avisos.forEach((a) => console.log(`aviso: ${a}`));
if (problemas.length) {
  console.log(`\nRascunho reprovado: ${problemas.length} problema(s). Nada se grava assim.`);
  process.exit(1);
}
console.log("\nRascunho aprovado pela regua executavel.");
console.log("O que a maquina nao ve continua com voce: se o porque da hipotese e mecanismo de verdade,");
console.log("se o criterio de matar mata mesmo, e se o KR e o que o cliente faz, nao o que o time entrega.");
