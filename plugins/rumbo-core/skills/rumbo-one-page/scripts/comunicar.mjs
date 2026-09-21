#!/usr/bin/env node
/**
 * O plano de comunicacao, antes de comunicar.
 *
 * Publicar comunica, e nao da para despublicar um aviso. Mesmo assim o unico
 * lugar onde canal e destinatario apareciam era DEPOIS do envio, no relatorio
 * de entrega. Quem publicava aprovava o documento e descobria o resto pelo
 * retorno.
 *
 * Pior: nomear alguem numa alca de escalada JA E ENVIAR. A pessoa recebe
 * privado, e em nenhum momento isso aparecia como envio. Este script existe
 * para dizer, antes, tres coisas: quem recebe, por onde, e o que vai escrito.
 *
 * Ele nao envia nada. Envio e o passo seguinte, e deliberadamente separado.
 *
 * Uso:
 *   node comunicar.mjs --envelope env.json --time <id>
 *   node comunicar.mjs --envelope env.json --time <id> --canais a,b   grava e mostra
 *   node comunicar.mjs --envelope env.json --time <id> --sem-canal    grava lista vazia
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

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
const saida = opts.saida || ".rumbo";

/**
 * Quem recebe privado, e por qual alca.
 *
 * Uma entrada por pessoa, com os itens dela juntos: a origem manda uma mensagem
 * por pessoa, nao uma por alca, e o plano tem de mostrar o que a pessoa vai ver,
 * nao o que o envelope declara.
 */
export function privados(itens) {
  const porPessoa = new Map();
  for (const item of itens ?? []) {
    for (const id of item.escala_para ?? item.escalaPara ?? []) {
      const lista = porPessoa.get(id) ?? [];
      lista.push(item);
      porPessoa.set(id, lista);
    }
  }
  return porPessoa;
}

/** Nome legivel de um id, a partir do dossie. Sem dossie, devolve o proprio id. */
export function nomes(dossie) {
  const mapa = new Map();
  const d = dossie?.destinatarios ?? {};
  for (const p of d.squad ?? []) mapa.set(p.id, `${p.nome} (${p.papel})`);
  for (const p of d.frequentes ?? []) if (!mapa.has(p.id)) mapa.set(p.id, p.nome);
  return mapa;
}

/**
 * A mensagem, reconstruida.
 *
 * NAO e a mensagem literal: quem a compoe e a origem, no momento do envio, e o
 * formato pertence a ela. Isto e o conteudo que ela vai receber, mostrado na
 * forma em que costuma sair, para quem aprova saber o que esta aprovando.
 */
export function mensagem(envelope, titulo) {
  const linhas = [];
  linhas.push(`**${envelope.squad} · ${titulo}**`);
  if (envelope.insight) linhas.push("", envelope.insight);
  const escaladas = (envelope.itens ?? []).filter(
    (i) => (i.escala_para ?? i.escalaPara ?? []).length > 0,
  );
  if (escaladas.length) {
    linhas.push("", "Escalado:");
    escaladas.slice(0, 5).forEach((d) => linhas.push(`• ${d.texto}`));
  }
  linhas.push("", "<a URL absoluta da versao, preenchida no envio>");
  return linhas.join("\n");
}

if (process.argv[1] && process.argv[1].endsWith("comunicar.mjs")) {
  const time = opts.time || opts.squad;
  if (!opts.envelope || !time) {
    console.error("Uso: node comunicar.mjs --envelope <arq.json> --time <id>");
    process.exit(1);
  }

  const envelope = JSON.parse(readFileSync(opts.envelope, "utf8"));

  // Gravacao da escolha, quando ela vem. Canal so entra no envelope por decisao
  // explicita: nao ha canal padrao aqui de proposito.
  if (typeof opts.canais === "string") {
    envelope.canais = opts.canais
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    writeFileSync(opts.envelope, JSON.stringify(envelope, null, 2), "utf8");
  } else if (opts["sem-canal"]) {
    envelope.canais = [];
    writeFileSync(opts.envelope, JSON.stringify(envelope, null, 2), "utf8");
  }

  const caminhoDossie = join(saida, `dossie-${time}.json`);
  let dossie = null;
  if (existsSync(caminhoDossie)) {
    try {
      const cru = JSON.parse(readFileSync(caminhoDossie, "utf8"));
      dossie = cru.dossie ?? cru;
    } catch {
      console.error(`[comunicar] ${caminhoDossie} ilegivel: seguindo sem nomes.`);
    }
  }

  const mapaNomes = nomes(dossie);
  const pessoas = privados(envelope.itens);
  const disponiveis = dossie?.destinatarios?.canais ?? [];
  const titulo = envelope.kind === "roadmap" ? "Roadmap" : "One Page";

  const out = [];
  out.push("", `Plano de comunicacao: ${time}, ${titulo}`, "");

  out.push("  CANAL");
  if ((envelope.canais ?? []).length === 0) {
    out.push("    nenhum declarado: nada sai para canal");
  } else {
    for (const slug of envelope.canais) {
      const conhecido = disponiveis.find((c) => c.slug === slug);
      out.push(
        `    ${slug}${conhecido ? ` (${conhecido.nome})` : "  NAO consta no dossie, confira o slug"}`,
      );
    }
  }
  if (disponiveis.length) {
    out.push(
      `    disponiveis: ${disponiveis.map((c) => c.slug + (c.padrao ? " (padrao)" : "")).join(", ")}`,
    );
  }
  out.push("");

  out.push("  PRIVADO, por alca de escalada");
  if (pessoas.size === 0) {
    out.push("    ninguem: nenhum item escala para alguem");
  } else {
    for (const [id, itens] of pessoas) {
      const nome = mapaNomes.get(id);
      out.push(`    ${nome ?? id}${nome ? "" : "  id fora do dossie, confira"}`);
      itens.forEach((i) => out.push(`      por: ${i.texto}`));
    }
    out.push("");
    out.push("    Nomear em escala_para JA E ENVIAR. Tirar o nome e a unica");
    out.push("    forma de nao enviar.");
  }
  out.push("");

  out.push("  MENSAGEM que a origem vai compor");
  mensagem(envelope, `${titulo} v<proxima>`)
    .split("\n")
    .forEach((l) => out.push(`    ${l}`));
  out.push("");

  out.push("  Nada foi enviado por este script.");
  out.push("  Confirme canal e privados com quem publica, item por item, e so");
  out.push("  entao publique. O envio acontece no --publicar, nao aqui.");
  out.push("");

  console.log(out.join("\n"));
}
