#!/usr/bin/env node
/**
 * Onde a conversa das release notes parou, e o que falta. O motor e o scripts/etapas.mjs do
 * plugin, o mesmo das outras skills; aqui mora so o mapa, e o mapa e o roteiro
 * que a pessoa ve na conversa, numerado, antes da primeira pergunta
 * (metodo/conducao.md).
 *
 * Uso:
 *   node estado.mjs --time <id>                   mostra o mapa e onde parou
 *   node estado.mjs --time <id> --concluir janela
 *   node estado.mjs --time <id> --descartar       apaga, ao terminar
 *
 * `para: true` e etapa que exige resposta de quem conduz.
 */

import { rodar } from "../../../scripts/etapas.mjs";

const MAPA = [
  { id: "janela", fase: "Preparar", titulo: "repositorio, janela, branch e publico", para: true },
  { id: "coletar", fase: "Preparar", titulo: "os commits da janela, com o corpo", para: false },
  { id: "filtrar", fase: "Montar", titulo: "o que entra, em numeros, pela tabela de tipos", para: true },
  { id: "traduzir", fase: "Montar", titulo: "cada item: o que ficou diferente, para quem", para: true },
  { id: "manchete", fase: "Montar", titulo: "a manchete da semana", para: true },
  { id: "mostrar", fase: "Fechar", titulo: "o rascunho em texto, e esperar", para: true },
  { id: "gerar", fase: "Fechar", titulo: "o HTML na marca da casa, e o PDF", para: false },
  { id: "conferir", fase: "Fechar", titulo: "o render pagina a pagina, e a regua", para: true },
];

rodar({ mapa: MAPA, rotulo: "Release notes", prefixo: "estado-release-notes", argv: process.argv });
