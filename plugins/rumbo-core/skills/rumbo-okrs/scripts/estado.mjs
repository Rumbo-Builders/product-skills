#!/usr/bin/env node
/**
 * Onde a conversa sobre OKRs parou, e o que falta.
 *
 * O motor mora em `scripts/etapas.mjs`, no plugin. O que e desta skill sao os tres
 * mapas abaixo, um por modo, cada um com o proprio arquivo de estado.
 *
 * Uso:
 *   node estado.mjs --time <casa> --modo novo|editar|acompanhar
 *   node estado.mjs --time <casa> --modo novo --concluir krs
 *   node estado.mjs --time <casa> --modo editar --escolher objetivo="<id>"
 *   node estado.mjs --time <casa> --modo acompanhar --descartar
 */

import { rodar } from "../../../scripts/etapas.mjs";

/**
 * OS MAPAS. Mudar a granularidade e mudar estas listas, e so elas.
 *
 * O KR tem etapa propria, e uma passada de cada vez: e onde a entrega se disfarca
 * de resultado. Gravar vem depois da regua e da avaliacao do KR, nunca antes.
 *
 * `para: true` e etapa que exige resposta de quem conduz.
 */
const MAPAS = {
  novo: [
    { id: "base",       fase: "Preparar", titulo: "de que casa, do squad ou da casa, e a cascata a mao", para: true },
    { id: "serve",      fase: "Objetivo", titulo: "que escolha ou aposta ele serve",        para: true },
    { id: "objetivo",   fase: "Objetivo", titulo: "a frase do objetivo, sem numero",       para: true },
    { id: "krs",        fase: "KRs",      titulo: "cada KR: outcome, baseline, meta, direcao", para: true },
    { id: "leitura",    fase: "KRs",      titulo: "de onde vem a leitura de cada KR",       para: true },
    { id: "dono",       fase: "KRs",      titulo: "dono, escopo e trimestre",               para: true },
    { id: "validar",    fase: "Gravar",   titulo: "a regua executavel",                     para: false },
    { id: "avaliar_ia", fase: "Gravar",   titulo: "a avaliacao da IA de cada KR",           para: true,
      salta: "sem o sistema da casa" },
    { id: "gravar",     fase: "Gravar",   titulo: "mostrar o rascunho inteiro, e gravar",   para: true },
    { id: "insights",   fase: "Fechar",   titulo: "o que ficou fora",                       para: true,
      salta: "quando nada foi estacionado" },
  ],
  editar: [
    { id: "base",       fase: "Preparar", titulo: "qual objetivo, e a cascata a mao",       para: true },
    { id: "visao",      fase: "Preparar", titulo: "o objetivo de hoje, inteiro, uma vez",   para: false },
    { id: "serve",      fase: "Polir",    titulo: "a ligacao: escolha, aposta, objetivo pai", para: true },
    { id: "objetivo",   fase: "Polir",    titulo: "a frase do objetivo",                    para: true },
    { id: "krs",        fase: "Polir",    titulo: "cada KR, um por vez",                    para: true },
    { id: "dono",       fase: "Polir",    titulo: "dono, escopo e trimestre",               para: true },
    { id: "validar",    fase: "Gravar",   titulo: "a regua executavel",                     para: false },
    { id: "avaliar_ia", fase: "Gravar",   titulo: "a avaliacao da IA dos KRs que mudaram",  para: true,
      salta: "quando nenhum KR mudou, ou sem o sistema da casa" },
    { id: "gravar",     fase: "Gravar",   titulo: "so o que mudou; KRs vao inteiros",       para: true },
    { id: "insights",   fase: "Fechar",   titulo: "o que ficou fora",                       para: true,
      salta: "quando nada foi estacionado" },
  ],
  acompanhar: [
    { id: "base",       fase: "Preparar",  titulo: "de que squad, ou os da casa",           para: true },
    { id: "lista",      fase: "Preparar",  titulo: "os objetivos, e por onde comecar",      para: false },
    { id: "objetivos",  fase: "Um a um",   titulo: "a leitura, o status, se o KR ainda mede", para: true },
    { id: "gravar",     fase: "Gravar",    titulo: "cada status com o motivo do dono",      para: true },
    { id: "resumo",     fase: "Fechar",    titulo: "o resumo, para o one page",             para: true },
    { id: "insights",   fase: "Fechar",    titulo: "o que ficou fora",                      para: true,
      salta: "quando nada foi estacionado" },
  ],
};

const i = process.argv.indexOf("--modo");
const modo = i >= 0 ? process.argv[i + 1] : undefined;
if (!MAPAS[modo]) {
  console.error(`Falta --modo, um de: ${Object.keys(MAPAS).join(", ")}.`);
  process.exit(1);
}

rodar({ mapa: MAPAS[modo], rotulo: `OKRs (${modo})`, prefixo: `estado-okrs-${modo}`, argv: process.argv });
