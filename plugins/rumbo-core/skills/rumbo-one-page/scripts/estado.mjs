#!/usr/bin/env node
/**
 * Onde a montagem do one page parou, e o que falta.
 *
 * O roteiro existia só na prosa do SKILL.md, e prosa não sobrevive a sessão
 * longa: o modelo pula etapa, esquece o que já foi decidido, e quem está do
 * outro lado não tem como saber em que ponto a coisa fica irreversível. Pior,
 * sessão interrompida não tinha volta, e a única saída era começar de novo. Um
 * PM relatou exatamente isso: criou e recriou o documento, sem visibilidade de
 * onde estava.
 *
 * O estado mora em arquivo pelo mesmo motivo que a régua de qualidade é
 * executável: critério que só existe em prosa não é aplicado.
 *
 * Uso:
 *   node estado.mjs --time <id>                      mostra o mapa e onde parou
 *   node estado.mjs --time <id> --concluir lacunas   marca e avança
 *   node estado.mjs --time <id> --escolher base=anterior
 *   node estado.mjs --time <id> --recomecar          zera, preservando as escolhas
 *   node estado.mjs --time <id> --descartar          apaga, depois de publicar
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";

/**
 * O MAPA. Mudar a granularidade é mudar esta lista, e só ela.
 *
 * Provisório de propósito: a divisão veio do relato de um PM e de leitura do
 * fluxo, não de observação de várias sessões reais. Ajustar depois custa uma
 * edição aqui; ter dez etapas espalhadas pela prosa custaria uma reescrita.
 *
 * `para: true` é etapa que exige resposta de quem conduz. As outras encadeiam
 * sozinhas, e é isso que evita transformar condução em interrogatório.
 */
const MAPA = [
  { id: "base",      fase: "Preparar", titulo: "de onde parte esta versao",   para: true },
  { id: "contexto",  fase: "Preparar", titulo: "dossie e briefing",           para: false },
  { id: "lacunas",   fase: "Preparar", titulo: "o que o dossie nao disse",    para: true },
  { id: "roadmap",   fase: "Montar",   titulo: "confirmar e publicar antes",  para: true,
    salta: "quando nenhuma faixa se moveu, apontando a mesma versao de novo" },
  { id: "escrita",   fase: "Montar",   titulo: "corpo, leituras e observacoes", para: true },
  { id: "insight",   fase: "Montar",   titulo: "a frase do que mudou",        para: true },
  { id: "conferir",  fase: "Fechar",   titulo: "mostrar o rascunho e esperar", para: true },
  { id: "validar",   fase: "Fechar",   titulo: "a regua executavel",          para: false },
  { id: "publicar",  fase: "Fechar",   titulo: "rascunho, depois versao",     para: true },
  { id: "comunicar", fase: "Comunicar",titulo: "canal, privados, mensagem",   para: true },
  { id: "binding",   fase: "Comunicar",titulo: "o que o binding acrescenta",  para: true,
    salta: "quando o binding nao declara passo nenhum, que e o caso comum" },
];

function args(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const chave = a.slice(2);
    const proximo = argv[i + 1];
    if (proximo && !proximo.startsWith("--")) {
      out[chave] = proximo;
      i++;
    } else {
      out[chave] = true;
    }
  }
  return out;
}

const opts = args(process.argv);
const time = opts.time || opts.squad;
const saida = opts.saida || ".rumbo";

if (!time) {
  console.error("Falta --time <identificador>.");
  process.exit(1);
}

const arquivo = join(saida, `estado-${time}.json`);

function novo() {
  return {
    time,
    iniciado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString(),
    concluidas: [],
    escolhas: {},
  };
}

function ler() {
  if (!existsSync(arquivo)) return null;
  try {
    return JSON.parse(readFileSync(arquivo, "utf8"));
  } catch {
    // Estado corrompido não trava a sessão: vale menos que o trabalho de quem
    // está esperando, e recomeçar o mapa é barato.
    console.error(`[estado] ${arquivo} ilegivel. Recomecando o mapa.`);
    return null;
  }
}

function gravar(e) {
  e.atualizado_em = new Date().toISOString();
  mkdirSync(saida, { recursive: true });
  writeFileSync(arquivo, JSON.stringify(e, null, 2), "utf8");
}

/** A primeira etapa que ainda não foi concluída. */
function atual(e) {
  return MAPA.find((x) => !e.concluidas.includes(x.id)) ?? null;
}

function horasDesde(iso) {
  return (Date.now() - new Date(iso).getTime()) / 36e5;
}

function desenhar(e) {
  const agora = atual(e);
  const linhas = [];

  linhas.push("");
  linhas.push(`One page: ${time}`);

  let faseAnterior = null;
  MAPA.forEach((etapa, i) => {
    if (etapa.fase !== faseAnterior) {
      linhas.push("");
      linhas.push(`  ${etapa.fase}`);
      faseAnterior = etapa.fase;
    }
    const feita = e.concluidas.includes(etapa.id);
    const marca = feita ? "[x]" : agora && agora.id === etapa.id ? "[>]" : "[ ]";
    const n = String(i + 1).padStart(2, " ");
    const escolha = e.escolhas[etapa.id];
    const cauda = escolha
      ? `  ${escolha}`
      : !feita && etapa.para
        ? "  (pede resposta)"
        : "";
    linhas.push(`  ${marca} ${n}. ${etapa.id.padEnd(12)} ${etapa.titulo}${cauda}`);
  });

  linhas.push("");
  if (!agora) {
    linhas.push("  Todas as etapas concluidas.");
  } else {
    linhas.push(`  Agora: ${agora.id}, ${agora.titulo}.`);
    if (agora.salta) linhas.push(`  Salta ${agora.salta}.`);
  }

  // A frase que mais tranquiliza quem está do outro lado, e por isso ela é
  // impressa toda vez, não só quando alguém pergunta.
  const comunicou = e.concluidas.includes("comunicar");
  linhas.push(
    comunicou
      ? "  A comunicacao ja saiu. Aviso enviado nao se desfaz."
      : "  Nada foi comunicado ainda: o envio acontece na etapa comunicar.",
  );
  linhas.push("");
  return linhas.join("\n");
}

// ---------------------------------------------------------------------------
// principal
// ---------------------------------------------------------------------------

let estado = ler();
const existia = estado !== null;
if (!estado) estado = novo();

if (opts.descartar) {
  // Depois de publicar, o estado guarda número que já está na versão. Manter é
  // convite a reaproveitar leitura velha na semana seguinte.
  if (existsSync(arquivo)) unlinkSync(arquivo);
  console.log(`[estado] descartado: ${arquivo}`);
  process.exit(0);
}

if (opts.recomecar) {
  const escolhas = estado.escolhas;
  estado = novo();
  estado.escolhas = escolhas;
  gravar(estado);
  console.log(desenhar(estado));
  process.exit(0);
}

if (typeof opts.escolher === "string") {
  const [chave, ...resto] = opts.escolher.split("=");
  const valor = resto.join("=");
  if (!valor) {
    console.error('Use --escolher <etapa>=<valor>, por exemplo base=anterior.');
    process.exit(1);
  }
  estado.escolhas[chave] = valor;
  gravar(estado);
}

if (typeof opts.concluir === "string") {
  const etapa = MAPA.find((x) => x.id === opts.concluir);
  if (!etapa) {
    console.error(
      `Etapa "${opts.concluir}" nao existe. As etapas sao: ${MAPA.map((x) => x.id).join(", ")}.`,
    );
    process.exit(1);
  }
  if (!estado.concluidas.includes(etapa.id)) estado.concluidas.push(etapa.id);
  gravar(estado);
}

if (!existsSync(arquivo)) gravar(estado);

// Retomada. Só aparece quando havia estado antes desta chamada e ele já andou:
// dizer "voce parou na etapa 1" para quem acabou de começar é ruído.
if (existia && estado.concluidas.length > 0 && !opts.concluir && !opts.escolher) {
  const h = horasDesde(estado.atualizado_em);
  const quando = h < 1 ? "ha menos de uma hora" : `ha ${Math.round(h)} horas`;
  console.log(
    `\n[estado] Ja havia uma montagem em andamento, mexida ${quando}.` +
      `\n          Continuar de onde parou, ou recomecar com --recomecar?`,
  );
}

console.log(desenhar(estado));
