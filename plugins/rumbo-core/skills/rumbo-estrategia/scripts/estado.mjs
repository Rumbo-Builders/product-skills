#!/usr/bin/env node
/**
 * Onde a montagem da estrategia parou, e o que falta.
 *
 * O motor mora em `scripts/etapas.mjs`, no plugin, e e o mesmo do one page. O que
 * e deste artefato e so o mapa abaixo, e o nome do arquivo de estado: a mesma
 * casa pode ter um one page e uma estrategia em andamento, e um mapa nao pode
 * sobrescrever o outro.
 *
 * Uso:
 *   node estado.mjs --time <casa>                       mostra o mapa e onde parou
 *   node estado.mjs --time <casa> --concluir fontes     marca e avanca
 *   node estado.mjs --time <casa> --escolher base="partiu da v2"
 *   node estado.mjs --time <casa> --recomecar           zera, preservando as escolhas
 *   node estado.mjs --time <casa> --descartar           apaga, depois de publicar
 */

import { rodar } from "../../../scripts/etapas.mjs";

/**
 * O MAPA. Mudar a granularidade e mudar esta lista, e so ela.
 *
 * O mapa e o roteiro que quem conduz mostra na conversa, numerado, logo no
 * comeco: a pessoa ve as etapas, inclusive a validacao com IA no fim, e passa
 * por elas uma a uma. Por isso cada estagio da cascata e uma etapa propria.
 *
 * Tres regras que o mapa carrega:
 *
 * NASCIMENTO PERGUNTA; REVISAO POLE. Em branco, cada estagio e uma pergunta
 * aberta. Em revisao, cada estagio mostra o texto de hoje e so propoe onde ha
 * motivo; o briefing diz por onde comecar, nao o que pular.
 *
 * UMA ETAPA POR MENSAGEM, DE CIMA PARA BAIXO. A cascata nao se pede inteira de
 * uma vez: aspiracao, registra, onde jogar ja amarrando.
 *
 * O QUE E TATICO ESTACIONA. Insight fora da cascata (OKR que falta, squad sem
 * amarracao) vai para a etapa `insights`, e nao desvia a etapa em curso.
 *
 * `para: true` e etapa que exige resposta de quem conduz.
 */
const MAPA = [
  { id: "base",        fase: "Preparar",  titulo: "de onde parte: em branco ou da ultima publicada", para: true },
  { id: "contexto",    fase: "Preparar",  titulo: "briefing: a cascata de hoje, idades, por onde comecar", para: false },
  { id: "fontes",      fase: "Preparar",  titulo: "a declaracao principal, e o que e contexto tatico", para: true },
  { id: "aspiracao",   fase: "Cascata",   titulo: "aspiracao: o que e vencer",            para: true },
  { id: "onde_jogar",  fase: "Cascata",   titulo: "onde jogar: os recortes",             para: true },
  { id: "como_ganhar", fase: "Cascata",   titulo: "como ganhar: a vantagem",             para: true },
  { id: "capacidades", fase: "Cascata",   titulo: "capacidades: o que sustenta a vantagem", para: true },
  { id: "sistemas",    fase: "Cascata",   titulo: "sistemas",                            para: true,
    salta: "quando a casa roda OKRs e one page: eles sao os sistemas" },
  { id: "amarracao",   fase: "Cascata",   titulo: "apostas e OKRs contra a cascata",     para: true,
    salta: "quando nao ha apostas nem OKRs, nem no envelope nem no sistema da casa" },
  { id: "premissas",   fase: "Coerencia", titulo: "o que tem de ser verdade",            para: true },
  { id: "elo",         fase: "Coerencia", titulo: "o elo mais fraco",                    para: true },
  { id: "pendencias",  fase: "Coerencia", titulo: "acao e decisao: fechar, mover, ficar (ate 4)", para: true },
  { id: "insights",    fase: "Coerencia", titulo: "o que ficou fora da cascata",         para: true,
    salta: "quando nada foi estacionado" },
  { id: "insight",     fase: "Fechar",    titulo: "a frase da revisao",                  para: true },
  { id: "escrita",     fase: "Fechar",    titulo: "o corpo, que voce escreve e a pessoa revisa", para: true },
  { id: "analise_ia",  fase: "Fechar",    titulo: "validacao com IA sobre o rascunho",   para: true },
  { id: "conferir",    fase: "Fechar",    titulo: "mostrar o rascunho e esperar",        para: true },
  { id: "validar",     fase: "Fechar",    titulo: "a regua executavel",                  para: false },
  { id: "publicar",    fase: "Fechar",    titulo: "render e publicacao na mesma URL",    para: true },
  { id: "comunicar",   fase: "Comunicar", titulo: "destinatarios e mensagem",            para: true },
  { id: "binding",     fase: "Comunicar", titulo: "o que o binding acrescenta",          para: true,
    salta: "quando o binding nao declara passo nenhum, que e o caso comum" },
];

rodar({ mapa: MAPA, rotulo: "Estrategia", prefixo: "estado-estrategia", argv: process.argv });
