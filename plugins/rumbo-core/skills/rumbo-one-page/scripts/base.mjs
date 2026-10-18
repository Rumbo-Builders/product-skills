#!/usr/bin/env node
/**
 * De onde parte esta versao: da anterior, ou do zero.
 *
 * A escolha existe porque nao havia nenhuma. Quem montava a versao da semana
 * ou redigitava tudo, ou copiava a anterior na mao, e um PM acabou criando e
 * recriando o documento sem nunca ter sido perguntado o que queria.
 *
 * O QUE NAO SE HERDA e a parte importante deste script. Partir da anterior
 * carrega estrutura, nunca numero nem envio:
 *
 *   insight          some. Ele e "o que mudou NESTA versao". Herdado, vira a
 *                    frase da semana passada assinada como se fosse de hoje.
 *   payload.atual    some dos objetivos, com o progresso junto. Numero herdado
 *                    e a forma mais barata de publicar um dado velho como novo.
 *   escala_para      some das decisoes. Nomear alguem ja e enviar DM: herdar a
 *                    lista reenvia para as mesmas pessoas sem ninguem ter
 *                    pedido. Genero "pergunta" fica entao invalido de
 *                    proposito, ate alguem reconfirmar que a pergunta segue de
 *                    pe e para quem.
 *   metrica_ref      some inteiro. Essa alca quem cria e o servidor, ao
 *                    congelar as leituras; mandar de volta e recusado.
 *
 *   realizado        some das metas do mes e da verba do mes corrente em diante,
 *   contagem         e a contagem some do funil: e a leitura desta semana.
 *
 * Herda: o corpo, as decisoes com o genero, os objetivos com meta e base, o
 * apontamento para a versao do roadmap, o desenho do time (meta.desenho), e a
 * estrutura dos blocos: acoes com o status (a confirmar na conversa), checklist
 * com o feito, verba com o aprovado, metas do mes com o alvo, frentes.
 *
 * Uso:
 *   node base.mjs --time <id>                  da ultima publicada
 *   node base.mjs --time <id> --versao 4       de uma versao especifica
 *   node base.mjs --time <id> --branco         esqueleto vazio
 *   node base.mjs --time <id> --de arq.json    de um artefato ja em disco
 *
 * Ambiente: RUMBO_ONEPAGE_API e RUMBO_ONEPAGE_TOKEN, ou as variantes com o
 * sufixo de RUMBO_ORIGEM (ver scripts/origem.mjs na raiz do plugin).
 */

import { exigirId } from "../../../scripts/pagina.mjs";
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { buscar as buscarNaOrigem, origem } from "../../../scripts/origem.mjs";

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
exigirId(time, "base");
const saida = opts.saida || ".rumbo";

/** Esqueleto de envelope. E o mesmo para quem parte do zero e para quem herda. */
export function esqueleto(time) {
  return {
    squad: time,
    kind: "one_page",
    insight: null,
    meta: {},
    body_md: "",
    itens: [],
    leituras: [],
    canais: [],
  };
}

/**
 * A transformacao, pura de proposito: o que decide o que sobrevive nao depende
 * de rede, e por isso da para conferir com um arquivo em disco.
 *
 * Devolve o envelope e a lista do que foi retirado, para ser dita em voz alta.
 * Retirada silenciosa vira surpresa na hora do 422.
 */
export function herdar(artefato, time) {
  const env = esqueleto(time);
  const retirado = [];

  env.body_md = artefato.body_md ?? artefato.bodyMd ?? "";

  const roadmapVersao =
    artefato.meta?.roadmapVersao ?? artefato.roadmap?.version ?? null;
  if (roadmapVersao) env.meta.roadmapVersao = roadmapVersao;
  // O desenho e do time, e muda raramente: herda inteiro. Com o sistema da casa,
  // quem manda e o do squad, e o servidor ignora este.
  if (artefato.meta?.desenho) env.meta.desenho = artefato.meta.desenho;
  if (artefato.meta?.verba_total != null) env.meta.verba_total = artefato.meta.verba_total;

  if (artefato.insight) {
    retirado.push(
      `o insight da v${artefato.version ?? "?"} ficou de fora: ele diz o que mudou naquela versao`,
    );
  }

  let numerosLimpos = 0;
  let escaladasLimpas = 0;
  let refsDescartadas = 0;

  for (const item of artefato.itens ?? []) {
    if (item.kind === "metrica_ref") {
      refsDescartadas++;
      continue;
    }

    const novo = {
      kind: item.kind,
      slug: item.slug,
      texto: item.texto,
    };
    if (item.genero) novo.genero = item.genero;
    if (item.afetaRoadmapSlug || item.afeta_roadmap_slug) {
      novo.afeta_roadmap_slug = item.afetaRoadmapSlug ?? item.afeta_roadmap_slug;
    }

    const payload = { ...(item.payload ?? {}) };
    if (payload.atual !== undefined || payload.progressoPct !== undefined) {
      delete payload.atual;
      delete payload.progressoPct;
      numerosLimpos++;
    }
    // A leitura da semana passada nao atravessa: realizado do mes que ainda esta
    // aberto, e a contagem do funil, sao numero de agora.
    const mesAberto = new Date().toISOString().slice(0, 7);
    if ((item.kind === "meta_mes" || item.kind === "verba") && payload.realizado !== undefined && String(payload.periodo) >= mesAberto) {
      delete payload.realizado;
      numerosLimpos++;
    }
    if (item.kind === "funil" && payload.contagem !== undefined) {
      delete payload.contagem;
      numerosLimpos++;
    }
    if (Object.keys(payload).length > 0) novo.payload = payload;

    const escala = item.escalaPara ?? item.escala_para ?? [];
    if (escala.length > 0) escaladasLimpas++;

    env.itens.push(novo);
  }

  if (numerosLimpos)
    retirado.push(
      `${numerosLimpos} valor(es) da semana passada (atual de objetivo, realizado do mes aberto, contagem do funil): numero herdado e dado velho publicado como novo`,
    );
  if (escaladasLimpas)
    retirado.push(
      `${escaladasLimpas} lista(s) de escalada: nomear ja e enviar DM, e reenviar sem pedido nao se faz`,
    );
  if (refsDescartadas)
    retirado.push(
      `${refsDescartadas} alca(s) de metrica: quem as cria e o servidor, ao congelar as leituras`,
    );

  return { envelope: env, retirado };
}

async function buscar(caminho) {
  const o = origem();
  if (!o.api) {
    console.error(
      "Sem origem no ambiente (RUMBO_ONEPAGE_API ou a variante de RUMBO_ORIGEM). Use --branco ou --de <arquivo>.",
    );
    process.exit(1);
  }
  try {
    return await buscarNaOrigem(caminho, o);
  } catch (e) {
    console.error(`Falhou em ${caminho}: ${e.message}`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// principal
// ---------------------------------------------------------------------------

if (process.argv[1] && process.argv[1].endsWith("base.mjs")) {
  if (!time) {
    console.error("Falta --time <identificador>.");
    process.exit(1);
  }

  let envelope;
  let retirado = [];
  let procedencia;

  if (opts.branco) {
    envelope = esqueleto(time);
    procedencia = "esqueleto em branco";
  } else {
    let artefato;
    if (typeof opts.de === "string") {
      artefato = JSON.parse(readFileSync(opts.de, "utf8"));
      procedencia = `arquivo ${opts.de}`;
    } else {
      const q = opts.versao ? `?version=${encodeURIComponent(opts.versao)}` : "";
      artefato = await buscar(
        `/api/product-artifacts/${encodeURIComponent(time)}/one_page${q}`,
      );
      if (!artefato) {
        console.log(
          `[base] Nenhuma versao anterior de "${time}". Comecando em branco, e a pagina declara a ausencia.`,
        );
        artefato = null;
      }
      procedencia = artefato ? `v${artefato.version} publicada` : "sem anterior";
    }

    if (artefato) {
      const r = herdar(artefato, time);
      envelope = r.envelope;
      retirado = r.retirado;
    } else {
      envelope = esqueleto(time);
    }
  }

  mkdirSync(saida, { recursive: true });
  const destino = join(saida, `base-${time}.json`);
  writeFileSync(destino, JSON.stringify(envelope, null, 2), "utf8");

  console.log(`\n[base] ${procedencia}, gravado em ${destino}`);
  console.log(
    `[base] herdou: ${envelope.itens.length} alca(s), corpo com ${envelope.body_md.length} caracteres` +
      (envelope.meta.roadmapVersao
        ? `, apontando o roadmap v${envelope.meta.roadmapVersao}`
        : ", sem apontamento de roadmap"),
  );

  if (retirado.length) {
    console.log("\n[base] NAO herdou, e o motivo:");
    retirado.forEach((r) => console.log(`  - ${r}`));
  }
  console.log(
    "\n[base] O insight e os numeros desta versao sao seus. Nada aqui foi apurado hoje.\n",
  );
}
