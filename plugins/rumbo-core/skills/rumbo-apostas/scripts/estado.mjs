#!/usr/bin/env node
/**
 * Onde a conversa sobre apostas parou, e o que falta.
 *
 * O motor mora em `scripts/etapas.mjs`, no plugin, e e o mesmo da estrategia e do
 * one page. O que e desta skill sao os tres mapas abaixo, um por modo, e cada modo
 * tem o proprio arquivo de estado: criar uma aposta e acompanhar as do squad na
 * mesma semana nao podem sobrescrever um ao outro.
 *
 * Uso:
 *   node estado.mjs --time <casa> --modo nova|editar|acompanhar
 *   node estado.mjs --time <casa> --modo nova --concluir problema
 *   node estado.mjs --time <casa> --modo editar --escolher aposta="<id>"
 *   node estado.mjs --time <casa> --modo acompanhar --descartar
 */

import { rodar } from "../../../scripts/etapas.mjs";

/**
 * OS MAPAS. Mudar a granularidade e mudar estas listas, e so elas.
 *
 * O mapa e o roteiro que a pessoa ve na conversa, numerado, antes da primeira
 * pergunta. Gravar e sempre uma etapa propria, depois da regua, e nunca acontece
 * sem a resposta de quem decide.
 *
 * `para: true` e etapa que exige resposta de quem conduz.
 */
const MAPAS = {
  nova: [
    { id: "base",        fase: "Preparar", titulo: "de que casa, e a cascata publicada a mao", para: true },
    { id: "escolha",     fase: "Tese",     titulo: "que escolha da cascata ela prova",          para: true },
    { id: "problema",    fase: "Tese",     titulo: "o problema, para quem",                     para: true },
    { id: "hipotese",    fase: "Tese",     titulo: "se, entao, porque",                         para: true },
    { id: "medida",      fase: "Medida",   titulo: "indicador com unidade e resultado esperado", para: true },
    { id: "matar",       fase: "Medida",   titulo: "criterio de matar com data, e horizonte",   para: true },
    { id: "quadrante",   fase: "Medida",   titulo: "quadrante pela regra de ouro",              para: true,
      salta: "quando a casa nao usa quadrante" },
    { id: "priorizacao", fase: "Medida",   titulo: "alcance, impacto, certeza e esforco, em perguntas", para: true,
      salta: "quando a casa nao prioriza por numero" },
    { id: "dono",        fase: "Medida",   titulo: "dono e squad",                              para: true },
    { id: "validar",     fase: "Gravar",   titulo: "a regua executavel",                        para: false },
    { id: "gravar",      fase: "Gravar",   titulo: "mostrar o rascunho inteiro, e gravar",      para: true },
    { id: "avaliar_ia",  fase: "Gravar",   titulo: "a avaliacao da IA, e o que volta dela",     para: true,
      salta: "sem o sistema da casa" },
    { id: "marcos",      fase: "Gravar",   titulo: "o marco de matar ou seguir, e os outros",   para: true },
    { id: "okr",         fase: "Fechar",   titulo: "o objetivo que a mede",                     para: true },
    { id: "insights",    fase: "Fechar",   titulo: "o que ficou fora",                          para: true,
      salta: "quando nada foi estacionado" },
  ],
  editar: [
    { id: "base",        fase: "Preparar", titulo: "qual aposta, e a cascata publicada a mao", para: true },
    { id: "visao",       fase: "Preparar", titulo: "a aposta de hoje, inteira, uma vez",        para: false },
    { id: "tese",        fase: "Polir",    titulo: "escolha servida, problema e hipotese",      para: true },
    { id: "medida",      fase: "Polir",    titulo: "indicador e resultados esperados",          para: true },
    { id: "matar",       fase: "Polir",    titulo: "criterio de matar e horizonte",             para: true },
    { id: "quadrante",   fase: "Polir",    titulo: "quadrante e priorizacao",                   para: true,
      salta: "quando a casa nao usa nenhum dos dois" },
    { id: "dono",        fase: "Polir",    titulo: "dono e squad",                              para: true },
    { id: "marcos",      fase: "Polir",    titulo: "marcos: o que vence, o que sai, o que entra", para: true },
    { id: "validar",     fase: "Gravar",   titulo: "a regua executavel",                        para: false },
    { id: "gravar",      fase: "Gravar",   titulo: "so o que mudou, campo a campo",             para: true },
    { id: "avaliar_ia",  fase: "Gravar",   titulo: "a avaliacao da IA, se a tese mudou",        para: true,
      salta: "quando a tese nao mudou, ou sem o sistema da casa" },
    { id: "insights",    fase: "Fechar",   titulo: "o que ficou fora",                          para: true,
      salta: "quando nada foi estacionado" },
  ],
  acompanhar: [
    { id: "base",        fase: "Preparar",  titulo: "de que squad, ou por relevancia",          para: true },
    { id: "lista",       fase: "Preparar",  titulo: "as apostas, e por onde comecar",           para: false },
    { id: "apostas",     fase: "Uma a uma", titulo: "o que mudou, o criterio, o status",        para: true },
    { id: "gravar",      fase: "Gravar",    titulo: "cada status com o motivo, confirmado",     para: true },
    { id: "resumo",      fase: "Fechar",    titulo: "o resumo da semana, para o one page",      para: true },
    { id: "insights",    fase: "Fechar",    titulo: "o que ficou fora",                         para: true,
      salta: "quando nada foi estacionado" },
  ],
};

const i = process.argv.indexOf("--modo");
const modo = i >= 0 ? process.argv[i + 1] : undefined;
if (!MAPAS[modo]) {
  console.error(`Falta --modo, um de: ${Object.keys(MAPAS).join(", ")}.`);
  process.exit(1);
}

rodar({ mapa: MAPAS[modo], rotulo: `Apostas (${modo})`, prefixo: `estado-apostas-${modo}`, argv: process.argv });
