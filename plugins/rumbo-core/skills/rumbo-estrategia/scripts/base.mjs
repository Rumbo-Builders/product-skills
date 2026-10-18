#!/usr/bin/env node
/**
 * De onde parte esta revisao: da anterior, ou do zero.
 *
 * O QUE NAO SE HERDA e a parte importante deste script. Partir da anterior
 * carrega a cascata, as apostas, os OKRs e as premissas com estado, que e o que
 * a revisao vai confrontar. Nao carrega:
 *
 *   insight              some. Ele e "o que mudou NESTA revisao". Herdado, vira a
 *                        frase do conselho passado assinada como se fosse de hoje.
 *   meta.elo_mais_fraco  some. O elo e julgamento desta leitura, nao da anterior.
 *   meta.revisao         some. Nascimento, conselho ou fechamento e desta versao.
 *   year, quarter        somem. Sao o relogio da revisao, e a revisao e esta.
 *   escala_para          some das decisoes. Nomear alguem ja e enviar: herdar a
 *                        lista reenvia sem ninguem ter pedido. Genero "pergunta"
 *                        fica entao invalido de proposito, ate alguem reconfirmar
 *                        que a pergunta segue de pe e para quem.
 *   campos propostos     somem. O que o modelo preencheu como proposta e a
 *                        lideranca nao confirmou (a lista `propostas` da alca)
 *                        nao atravessa a versao: a escolha fica invalida de
 *                        proposito ate alguem dizer a renuncia, o criterio de
 *                        matar ou o teste com as proprias palavras. Prefixo no
 *                        texto nao serve: some na primeira edicao e a proposta
 *                        vira declaracao sem ninguem ter dito.
 *
 * De onde vem a anterior depende do destino. Sem origem no ambiente, ela vem da
 * propria pagina publicada, no bloco `rumbo-envelopes`, trilha `estrategia`, e
 * chega por `--de`. Com origem (RUMBO_ONEPAGE_API ou a variante de RUMBO_ORIGEM),
 * o script busca a ultima publicada da casa e ainda grava uma copia em
 * `.rumbo/anterior-estrategia.json`, para contexto, validar e render lerem a
 * mesma versao.
 *
 * Uso:
 *   node base.mjs --time <casa> --branco                   esqueleto vazio
 *   node base.mjs --time <casa> --de .rumbo/anterior-estrategia.json
 *   node base.mjs --time <casa> [--versao N]               da origem, quando ha uma
 *
 * `--de` aceita o envelope cru ou a cadeia inteira extraida da pagina.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { args, lerJson, exigirId } from "../../../scripts/pagina.mjs";
import { buscar, origem } from "../../../scripts/origem.mjs";

const opts = args(process.argv);
const time = opts.time || opts.casa;
exigirId(time, "base");
const saida = opts.saida || ".rumbo";

/** Esqueleto de envelope. E o mesmo para quem parte do zero e para quem herda. */
export function esqueleto(time) {
  return {
    time,
    kind: "estrategia",
    ciclo: null,
    insight: null,
    meta: { revisao: null, elo_mais_fraco: null },
    body_md: "",
    itens: [],
    leituras: [],
    canais: [],
  };
}

/** A cadeia da pagina ou o envelope cru: os dois servem. */
export function envelopeDe(arquivo) {
  if (arquivo?.estrategia) return arquivo.estrategia.atual?.envelope ?? null;
  if (arquivo?.atual?.envelope) return arquivo.atual.envelope;
  if (arquivo?.envelope) return arquivo.envelope;
  return arquivo;
}

/**
 * A transformacao, pura de proposito. Devolve o envelope e a lista do que foi
 * retirado, para ser dita em voz alta. Retirada silenciosa vira surpresa.
 */
export function herdar(artefato, time, versao) {
  const env = esqueleto(time);
  const retirado = [];

  env.body_md = artefato.body_md ?? "";
  if (artefato.ciclo) env.ciclo = artefato.ciclo;

  const v = versao ? `v${versao}` : "a versao anterior";
  if (artefato.insight) retirado.push(`o insight d${v.startsWith("v") ? "a " + v : "e " + v}: ele diz o que mudou naquela revisao`);
  if (artefato.meta?.elo_mais_fraco) retirado.push("o elo mais fraco: e julgamento desta leitura, nao da anterior");
  if (artefato.meta?.revisao) retirado.push(`a marca de revisao "${artefato.meta.revisao}": esta versao tem a sua`);
  if (artefato.year || artefato.quarter) retirado.push("ano e trimestre: sao o relogio desta revisao");

  let escaladasLimpas = 0;
  const propostasLimpas = [];
  for (const item of artefato.itens ?? []) {
    const novo = { kind: item.kind, slug: item.slug, texto: item.texto };
    if (item.genero) novo.genero = item.genero;
    if (item.afeta_roadmap_slug) novo.afeta_roadmap_slug = item.afeta_roadmap_slug;
    const payload = { ...(item.payload ?? {}) };
    for (const campo of payload.propostas ?? []) {
      if (payload[campo] != null) { delete payload[campo]; propostasLimpas.push(`${item.slug}.${campo}`); }
    }
    delete payload.propostas;
    if (Object.keys(payload).length) novo.payload = payload;
    if ((item.escala_para ?? []).length) escaladasLimpas++;
    env.itens.push(novo);
  }
  if (escaladasLimpas)
    retirado.push(`${escaladasLimpas} lista(s) de escalada: nomear ja e enviar, e reenviar sem pedido nao se faz`);
  if (propostasLimpas.length)
    retirado.push(`${propostasLimpas.length} campo(s) que eram proposta do modelo e ninguem confirmou (${propostasLimpas.join(", ")}): a alca fica invalida ate a lideranca dizer`);

  return { envelope: env, retirado };
}

/** Ultima publicada (ou --versao N) da casa na origem. Sem nenhuma, e nascimento, e o script diz. */
async function anteriorDaOrigem(o) {
  const versao = opts.versao ? `?version=${encodeURIComponent(opts.versao)}` : "";
  let artefato;
  try {
    artefato = await buscar(`/api/product-artifacts/${encodeURIComponent(time)}/estrategia${versao}`, o);
  } catch (e) {
    console.error(`[base] origem ${o.nome ?? o.api} falhou: ${e.message}`);
    process.exit(1);
  }
  if (!artefato) {
    console.error(`[base] a origem ${o.nome ?? o.api} nao tem estrategia publicada para "${time}". Para o nascimento, use --branco.`);
    process.exit(1);
  }
  return artefato;
}

if (process.argv[1] && process.argv[1].endsWith("base.mjs")) {
  if (!time) {
    console.error("Falta --time <casa>.");
    process.exit(1);
  }
  const o = origem();
  const daOrigem = !opts.branco && typeof opts.de !== "string";
  if (daOrigem && !o.api) {
    console.error("Escolha --branco ou --de <arquivo>. Sem origem no ambiente, a anterior vem da pagina publicada.");
    process.exit(1);
  }

  let envelope;
  let retirado = [];
  let procedencia;

  if (opts.branco) {
    envelope = esqueleto(time);
    procedencia = "esqueleto em branco: nascimento do ciclo";
  } else if (daOrigem) {
    const artefato = await anteriorDaOrigem(o);
    const r = herdar(artefato, time, artefato.version);
    envelope = r.envelope;
    retirado = r.retirado;
    procedencia = `v${artefato.version} da origem ${o.nome ?? o.api}`;
    mkdirSync(saida, { recursive: true });
    const copia = join(saida, "anterior-estrategia.json");
    writeFileSync(copia, JSON.stringify(artefato, null, 2), "utf8");
    console.log(`[base] anterior da origem gravada em ${copia}: use-a em --anterior nos passos seguintes`);
  } else {
    const arquivo = lerJson(opts.de, true, "base");
    const artefato = envelopeDe(arquivo);
    const versao = arquivo?.estrategia?.atual?.versao ?? arquivo?.atual?.versao ?? arquivo?.versao ?? null;
    if (!artefato || artefato.kind !== "estrategia") {
      console.error(`[base] ${opts.de} nao traz um envelope de estrategia (kind "${artefato?.kind ?? "?"}").`);
      process.exit(1);
    }
    const r = herdar(artefato, time, versao);
    envelope = r.envelope;
    retirado = r.retirado;
    procedencia = `${versao ? `v${versao}` : "versao anterior"} de ${opts.de}`;
  }

  mkdirSync(saida, { recursive: true });
  const destino = join(saida, `base-estrategia-${time}.json`);
  writeFileSync(destino, JSON.stringify(envelope, null, 2), "utf8");

  const porKind = {};
  for (const i of envelope.itens) porKind[i.kind] = (porKind[i.kind] ?? 0) + 1;
  const resumo = Object.entries(porKind).map(([k, n]) => `${n} ${k}`).join(", ") || "nenhuma alca";

  console.log(`\n[base] ${procedencia}, gravado em ${destino}`);
  console.log(`[base] herdou: ${resumo}; corpo com ${envelope.body_md.length} caracteres${envelope.ciclo ? `; ciclo ${envelope.ciclo.slug ?? envelope.ciclo.rotulo ?? ""}` : "; sem ciclo"}`);

  if (retirado.length) {
    console.log("\n[base] NAO herdou, e o motivo:");
    retirado.forEach((r) => console.log(`  - ${r}`));
  }
  console.log("\n[base] O insight, o elo mais fraco e a marca de revisao sao desta versao. Nada aqui foi decidido hoje.\n");
}
