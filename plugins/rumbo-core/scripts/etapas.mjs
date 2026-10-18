#!/usr/bin/env node
/**
 * Motor do mapa de etapas: onde a montagem de um artefato parou, e o que falta.
 *
 * O roteiro de cada skill existia so na prosa do SKILL.md, e prosa nao sobrevive
 * a sessao longa: o modelo pula etapa, esquece o que ja foi decidido, e quem esta
 * do outro lado nao tem como saber em que ponto a coisa fica irreversivel. Pior,
 * sessao interrompida nao tinha volta, e a unica saida era comecar de novo.
 *
 * O estado mora em arquivo pelo mesmo motivo que a regua de qualidade e
 * executavel: criterio que so existe em prosa nao e aplicado.
 *
 * ESTE ARQUIVO E O MOTOR, E SO ELE. O mapa de cada artefato fica no
 * `estado.mjs` da propria skill, numa lista so, e e a unica coisa que muda de um
 * artefato para outro. Mudar a granularidade e mudar aquela lista.
 *
 * Uso, a partir do estado.mjs de uma skill:
 *   rodar({ mapa: MAPA, rotulo: "One page", prefixo: "estado", argv: process.argv })
 *
 * E o que a skill expoe para a conversa:
 *   node estado.mjs --time <id>                      mostra o mapa e onde parou
 *   node estado.mjs --time <id> --concluir lacunas   marca e avanca
 *   node estado.mjs --time <id> --escolher base=anterior
 *   node estado.mjs --time <id> --recomecar          zera, preservando as escolhas
 *   node estado.mjs --time <id> --descartar          apaga, depois de publicar
 *
 * `prefixo` nomeia o arquivo em `.rumbo/`: dois artefatos da mesma casa tem dois
 * mapas, e um nao pode sobrescrever o outro.
 */

import { exigirId } from "./pagina.mjs";
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from "node:fs";
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

export function rodar({ mapa, rotulo, prefixo = "estado", argv = process.argv }) {
  const opts = args(argv);
  const time = opts.time || opts.squad;
  exigirId(time, "estado");
  const saida = opts.saida || ".rumbo";

  if (!time) {
    console.error("Falta --time <identificador>.");
    process.exit(1);
  }

  const arquivo = join(saida, `${prefixo}-${time}.json`);

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
      // Estado corrompido nao trava a sessao: vale menos que o trabalho de quem
      // esta esperando, e recomecar o mapa e barato.
      console.error(`[estado] ${arquivo} ilegivel. Recomecando o mapa.`);
      return null;
    }
  }

  function gravar(e) {
    e.atualizado_em = new Date().toISOString();
    mkdirSync(saida, { recursive: true });
    writeFileSync(arquivo, JSON.stringify(e, null, 2), "utf8");
  }

  /** A primeira etapa que ainda nao foi concluida. */
  function atual(e) {
    return mapa.find((x) => !e.concluidas.includes(x.id)) ?? null;
  }

  function horasDesde(iso) {
    return (Date.now() - new Date(iso).getTime()) / 36e5;
  }

  function desenhar(e) {
    const agora = atual(e);
    const linhas = [];

    linhas.push("");
    linhas.push(`${rotulo}: ${time}`);

    let faseAnterior = null;
    mapa.forEach((etapa, i) => {
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

    // A frase que mais tranquiliza quem esta do outro lado, e por isso ela e
    // impressa toda vez, nao so quando alguem pergunta.
    const comunicou = e.concluidas.includes("comunicar");
    if (mapa.some((x) => x.id === "comunicar")) linhas.push(
      comunicou
        ? "  A comunicacao ja saiu. Aviso enviado nao se desfaz."
        : "  Nada foi comunicado ainda: o envio acontece na etapa comunicar.",
    );
    linhas.push("");
    return linhas.join("\n");
  }

  // -------------------------------------------------------------------------
  // principal
  // -------------------------------------------------------------------------

  let estado = ler();
  const existia = estado !== null;
  if (!estado) estado = novo();

  if (opts.descartar) {
    // Depois de publicar, o estado guarda o que ja esta na versao. Manter e
    // convite a reaproveitar dado velho na vez seguinte.
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
    const etapa = mapa.find((x) => x.id === opts.concluir);
    if (!etapa) {
      console.error(
        `Etapa "${opts.concluir}" nao existe. As etapas sao: ${mapa.map((x) => x.id).join(", ")}.`,
      );
      process.exit(1);
    }
    if (!estado.concluidas.includes(etapa.id)) estado.concluidas.push(etapa.id);
    gravar(estado);
  }

  if (!existsSync(arquivo)) gravar(estado);

  // Retomada. So aparece quando havia estado antes desta chamada e ele ja andou:
  // dizer "voce parou na etapa 1" para quem acabou de comecar e ruido.
  if (existia && estado.concluidas.length > 0 && !opts.concluir && !opts.escolher) {
    const h = horasDesde(estado.atualizado_em);
    const quando = h < 1 ? "ha menos de uma hora" : `ha ${Math.round(h)} horas`;
    console.log(
      `\n[estado] Ja havia uma montagem em andamento, mexida ${quando}.` +
        `\n          Continuar de onde parou, ou recomecar com --recomecar?`,
    );
  }

  console.log(desenhar(estado));
}
