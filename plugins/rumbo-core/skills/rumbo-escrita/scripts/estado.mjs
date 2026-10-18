#!/usr/bin/env node
/**
 * Onde a conversa de escrita parou, e o que falta. O motor e o scripts/etapas.mjs do
 * plugin, o mesmo das outras skills; aqui mora so o mapa, e o mapa e o roteiro
 * que a pessoa ve na conversa, numerado, antes da primeira pergunta
 * (metodo/conducao.md).
 *
 * Uso:
 *   node estado.mjs --time <id>                   mostra o mapa e onde parou
 *   node estado.mjs --time <id> --concluir entradas
 *   node estado.mjs --time <id> --descartar       apaga, ao terminar
 *
 * `para: true` e etapa que exige resposta de quem conduz.
 */

import { rodar } from "../../../scripts/etapas.mjs";

const MAPA = [
  { id: "entradas", fase: "Preparar", titulo: "a conclusao, para quem, e onde vai sair", para: true },
  { id: "escrever", fase: "Escrever", titulo: "escrever ou revisar, com estrutura e registro", para: true },
  { id: "regua", fase: "Conferir", titulo: "a regua de _principios.md, na ordem do checklist", para: false },
  { id: "devolver", fase: "Conferir", titulo: "o antes e o depois, com a regra de cada mudanca", para: true },
  { id: "publicar", fase: "Fechar", titulo: "so com confirmacao explicita", para: true },
];

rodar({ mapa: MAPA, rotulo: "Escrita", prefixo: "estado-escrita", argv: process.argv });
