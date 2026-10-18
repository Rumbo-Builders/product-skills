#!/usr/bin/env node
/**
 * Publica um envelope na origem que fala o contrato. Serve a todo kind: o que
 * distingue one page, roadmap e estrategia e o `kind` dentro do envelope, e por
 * isso o script mora aqui, na raiz do plugin, e nao dentro de uma skill.
 *
 * Duas etapas, e a separacao e o ponto. `--rascunho` grava a versao e devolve a
 * URL de conferencia, sem comunicar nada. `--publicar` fecha a versao. Publicar
 * direto tira do autor a unica chance de ver o artefato antes que ele saia.
 *
 * COMUNICAR E UMA TERCEIRA CHAVE. Publicar com alguem em `escala_para`, ou com
 * canal, envia mensagem: privado para cada pessoa, post em cada canal. Por isso
 * `--publicar` com destinatario recusa e lista quem receberia, ate vir
 * `--comunicar`, que so se passa depois que a pessoa respondeu a lista, item por
 * item, na etapa comunicar. Mensagem enviada nao se desenvia.
 *
 * Uso:
 *   node publicar.mjs envelope.json --rascunho
 *   node publicar.mjs envelope.json --publicar [--comunicar]
 *
 * Ambiente: RUMBO_ONEPAGE_API e RUMBO_ONEPAGE_TOKEN, ou as variantes com o
 * sufixo de RUMBO_ORIGEM (ver origem.mjs).
 */

import { readFileSync } from "node:fs";
import { exigirOrigem, mascarar, origem, pedir } from "./origem.mjs";

const arquivo = process.argv[2];
const publicar = process.argv.includes("--publicar");
const rascunho = process.argv.includes("--rascunho");
const comunicar = process.argv.includes("--comunicar");

if (!arquivo || arquivo.startsWith("--")) {
  console.error("Uso: node publicar.mjs envelope.json [--rascunho|--publicar]");
  process.exit(1);
}
if (!publicar && !rascunho) {
  console.error("Escolha --rascunho ou --publicar. Nao ha modo padrao de proposito: publicar comunica.");
  process.exit(1);
}

const o = exigirOrigem(origem());

let envelope;
try {
  envelope = JSON.parse(readFileSync(arquivo, "utf8"));
} catch (e) {
  console.error(`Nao consegui ler ${arquivo}: ${e.message}`);
  process.exit(1);
}

// Quem receberia mensagem com esta publicacao. Sem --comunicar, nada sai.
const privados = [...new Set((envelope.itens ?? []).flatMap((i) => i.escala_para ?? i.escalaPara ?? []))];
const canaisDoEnvelope = (envelope.canais ?? []).map((c) => c.slug ?? c);
if (publicar && !comunicar && (privados.length || canaisDoEnvelope.length)) {
  console.error("Esta publicacao envia mensagem, e ninguem confirmou a lista:");
  privados.forEach((p) => console.error(`  privado para ${p}`));
  canaisDoEnvelope.forEach((c) => console.error(`  canal ${c}`));
  console.error("\nMostre a lista na etapa comunicar, espere a resposta item por item, e repita com --comunicar.");
  console.error("Pergunta com destinatario envia privado ao publicar: sem a lista confirmada, nao ha publicacao.");
  process.exit(1);
}

envelope.status = publicar ? "published" : "draft";
// Canal so faz sentido publicando. Num rascunho e ruido para quem le o envelope depois.
if (!publicar) delete envelope.canais;

function relatarComunicacao(corpo) {
  if (!corpo.comunicacao) {
    if (!publicar) console.log("\nRascunho: nada foi comunicado.");
    return;
  }
  const { canais = [], dms = [] } = corpo.comunicacao;
  console.log("\nComunicacao:");
  canais.forEach((c) => console.log(`  canal ${c.slug}: ${c.ok ? "enviado" : `FALHOU (${c.erro})`}`));
  dms.forEach((d) => console.log(`  privado para ${d.userId}: ${d.ok ? "enviado" : `FALHOU (${d.erro})`}`));
  if ([...canais, ...dms].some((x) => !x.ok)) {
    console.log("\nA versao foi publicada. Parte dos avisos nao saiu: leia o erro de cada linha antes de reenviar.");
  }
}

try {
  const r = await pedir("/api/product-artifacts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(envelope),
  }, o);
  const corpo = await r.json().catch(() => ({}));

  if (r.status === 422) {
    console.error("Envelope recusado pela origem:\n");
    (corpo.problemas ?? []).forEach((p) => console.error(`  - ${p.campo}: ${p.erro}`));
    console.error("\nO corpo do documento nao e validado. So o envelope: identificadores, generos e marcadores.");
    process.exit(1);
  }
  if (!r.ok) {
    console.error(mascarar(`Falhou (${r.status}): ${corpo.error ?? JSON.stringify(corpo).slice(0, 300)}`, o));
    process.exit(1);
  }

  console.log(`Versao ${corpo.version} gravada como ${corpo.status} em ${o.nome ?? o.api}.`);
  console.log(`Confira em: ${o.api}${corpo.url_preview}`);
  if (corpo.gravado?.marcadores_congelados?.length) {
    console.log(`Marcadores congelados: ${corpo.gravado.marcadores_congelados.map((m) => m.slug).join(", ")}`);
  }
  if (corpo.gravado?.ignorados?.length) {
    console.log(`Campos que a origem nao guarda: ${corpo.gravado.ignorados.join(", ")}`);
  }
  if (corpo.avisos?.length) {
    console.log("\nAvisos:");
    corpo.avisos.forEach((a) => console.log(`  - ${a}`));
  }
  relatarComunicacao(corpo);
} catch (e) {
  console.error(mascarar(`Falhou: ${e.message}`, o));
  process.exit(1);
}
