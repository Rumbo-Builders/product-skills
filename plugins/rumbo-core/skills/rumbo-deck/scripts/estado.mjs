#!/usr/bin/env node
/**
 * Onde a conversa do deck parou, e o que falta. O motor e o scripts/etapas.mjs do
 * plugin, o mesmo das outras skills; aqui mora so o mapa, e o mapa e o roteiro
 * que a pessoa ve na conversa, numerado, antes da primeira pergunta
 * (metodo/conducao.md).
 *
 * Uso:
 *   node estado.mjs --time <id>                   mostra o mapa e onde parou
 *   node estado.mjs --time <id> --concluir pedido
 *   node estado.mjs --time <id> --descartar       apaga, ao terminar
 *
 * `para: true` e etapa que exige resposta de quem conduz.
 */

import { rodar } from "../../../scripts/etapas.mjs";

const MAPA = [
  { id: "pedido", fase: "Preparar", titulo: "para quem, para que decisao, quantos slides", para: true },
  { id: "storyline", fase: "Historia", titulo: "os titulos de acao, em ordem, aprovados", para: true },
  { id: "lacunas", fase: "Historia", titulo: "o numero ou a fonte que falta em cada slide", para: true },
  { id: "montar", fase: "Montar", titulo: "o deck sobre o motor e o tema da casa", para: false },
  { id: "qa", fase: "Conferir", titulo: "a regua executavel, que reprova o build", para: false },
  { id: "slides", fase: "Conferir", titulo: "cada slide como imagem: colisao, estouro, rodape", para: true },
  { id: "checklist", fase: "Conferir", titulo: "o checklist do metodo, e o que nao bateu", para: true },
  { id: "entregar", fase: "Fechar", titulo: "o arquivo, e o que ficou pendente", para: true },
];

rodar({ mapa: MAPA, rotulo: "Deck", prefixo: "estado-deck", argv: process.argv });
