#!/usr/bin/env node
/**
 * Onde a montagem do one page parou, e o que falta.
 *
 * O roteiro existia so na prosa do SKILL.md, e prosa nao sobrevive a sessao
 * longa: o modelo pula etapa, esquece o que ja foi decidido, e quem esta do
 * outro lado nao tem como saber em que ponto a coisa fica irreversivel. Pior,
 * sessao interrompida nao tinha volta, e a unica saida era comecar de novo. Um
 * PM relatou exatamente isso: criou e recriou o documento, sem visibilidade de
 * onde estava.
 *
 * O MOTOR mora em `scripts/etapas.mjs`, no plugin, porque a estrategia usa o
 * mesmo. O que e deste artefato e so o mapa abaixo.
 *
 * Uso:
 *   node estado.mjs --time <id> [--modo desenhar|semana|leitura|reformar] [--config arq] [--tipo marketing]
 *   node estado.mjs --time <id>                      mostra o mapa e onde parou
 *   node estado.mjs --time <id> --concluir lacunas   marca e avanca
 *   node estado.mjs --time <id> --escolher base=anterior
 *   node estado.mjs --time <id> --recomecar          zera, preservando as escolhas
 *   node estado.mjs --time <id> --descartar          apaga, depois de publicar
 */

import { readFileSync, existsSync } from "node:fs";
import { rodar } from "../../../scripts/etapas.mjs";
import { blocosDe, preset } from "./blocos.mjs";

/**
 * OS MAPAS. Quatro modos, e o da semana e montado do desenho do time.
 *
 *   desenhar   o primeiro one page de um time: o desenho antes do conteudo
 *   semana     a atualizacao: uma etapa por bloco que o time escolheu
 *   leitura    a passada de cinco minutos: so os numeros e o que mudou
 *   reformar   mudar o desenho, sem reescrever o conteudo
 *
 * Sem --modo, e semana, que e o caso de quase toda sessao.
 *
 * O desenho vem de --config (.rumbo/one-page.config.json, campo desenho) ou do
 * preset do --tipo; sem nenhum dos dois, o de produto, que e o roteiro de sempre.
 * Com o sistema da casa, o desenho do squad vem do one_page_desenho_ver: grave-o
 * no config antes de abrir o mapa, para o roteiro sair igual ao da tela.
 *
 * `para: true` e etapa que exige resposta de quem conduz. As outras encadeiam
 * sozinhas, e e isso que evita transformar conducao em interrogatorio.
 */
const argv = process.argv;
const opcao = (nome) => { const i = argv.indexOf(nome); return i >= 0 ? argv[i + 1] : undefined; };
const modo = opcao("--modo") ?? "semana";

function desenho() {
  const arq = opcao("--config") ?? ".rumbo/one-page.config.json";
  if (existsSync(arq)) {
    try { const c = JSON.parse(readFileSync(arq, "utf8")); if (c.desenho) return c.desenho; } catch { /* config ilegivel cai no preset */ }
  }
  return preset(opcao("--tipo") ?? "produto");
}

/** A etapa de cada bloco, na ordem em que o time os le. O nucleo vira tres etapas. */
const ETAPA_DO_BLOCO = {
  roadmap:        { id: "roadmap",     titulo: "o roadmap: confirmar e publicar antes", salta: "quando nenhuma faixa se moveu, apontando a mesma versao de novo" },
  objetivos:      { id: "objetivos",   titulo: "os objetivos: leitura e status, um a um" },
  trilha_mensal:  { id: "trilha",      titulo: "a meta do mes contra o realizado" },
  indicadores:    { id: "indicadores", titulo: "as leituras, e a observacao de cada uma" },
  saude:          { id: "saude",       titulo: "os indicadores de saude" },
  acoes:          { id: "acoes",       titulo: "as acoes: o que andou, o que venceu, o que entra" },
  verba:          { id: "verba",       titulo: "a verba: realizado contra aprovado" },
  checklist:      { id: "checklist",   titulo: "a checklist: o que foi feito, o que venceu" },
  funil:          { id: "funil",       titulo: "o funil: a contagem de cada estagio" },
  outras_frentes: { id: "frentes",     titulo: "outras frentes, curtas" },
};

function etapasDosBlocos(d) {
  const vistos = new Set();
  const out = [];
  for (const b of blocosDe(d)) {
    const e = ETAPA_DO_BLOCO[b.tipo];
    if (!e || vistos.has(e.id)) continue;
    vistos.add(e.id);
    out.push({ ...e, fase: "Montar", para: true });
  }
  // O roadmap e publicado antes, porque o one page aponta a versao dele.
  return [...out.filter((e) => e.id === "roadmap"), ...out.filter((e) => e.id !== "roadmap")];
}

const PREPARAR = [
  { id: "base",      fase: "Preparar", titulo: "de onde parte esta versao",   para: true },
  { id: "contexto",  fase: "Preparar", titulo: "dossie e briefing",           para: false },
  { id: "lacunas",   fase: "Preparar", titulo: "o que o dossie nao disse, e por onde comecar", para: true },
];
const FECHAR = [
  { id: "conferir",  fase: "Fechar",   titulo: "mostrar o rascunho e esperar", para: true },
  { id: "validar",   fase: "Fechar",   titulo: "a regua executavel",          para: false },
  { id: "publicar",  fase: "Fechar",   titulo: "rascunho, depois versao",     para: true },
  { id: "comunicar", fase: "Comunicar",titulo: "canal, privados, mensagem",   para: true },
  { id: "binding",   fase: "Comunicar",titulo: "o que o binding acrescenta",  para: true,
    salta: "quando o binding nao declara passo nenhum, que e o caso comum" },
];

function semana() {
  return [
    ...PREPARAR,
    ...etapasDosBlocos(desenho()),
    { id: "apostas",   fase: "Montar", titulo: "o que andou nas apostas do time", para: true,
      salta: "quando o time nao tem apostas no sistema da casa" },
    { id: "decisoes",  fase: "Montar", titulo: "acao e decisao: fecha, fica, entra", para: true },
    { id: "escrita",   fase: "Montar", titulo: "o corpo: a narrativa que a tabela nao conta", para: true },
    { id: "insight",   fase: "Montar", titulo: "a frase do que mudou, e o farol", para: true },
    ...FECHAR,
  ];
}

const MAPAS = {
  desenhar: () => [
    { id: "time",      fase: "Conhecer", titulo: "que time e, quem le, em que rito",           para: true },
    { id: "decidir",   fase: "Conhecer", titulo: "o que quem le precisa decidir toda semana",  para: true },
    { id: "proposta",  fase: "Desenhar", titulo: "o desenho de partida do tipo do time",       para: true },
    { id: "blocos",    fase: "Desenhar", titulo: "cada bloco: fica, sai, troca de nome",        para: true },
    { id: "abas",      fase: "Desenhar", titulo: "as abas, os titulos e a ordem",               para: true },
    { id: "tom",       fase: "Desenhar", titulo: "o registro do time, dentro da regua da casa", para: true },
    { id: "esqueleto", fase: "Ver",      titulo: "o esqueleto renderizado, com dado de exemplo", para: true },
    { id: "gravar",    fase: "Ver",      titulo: "gravar o desenho do time",                    para: true },
    { id: "primeira",  fase: "Ver",      titulo: "a primeira versao, pelo modo semana",         para: true },
  ],
  semana,
  leitura: () => [
    { id: "base",      fase: "Preparar", titulo: "da ultima publicada",                         para: true },
    { id: "leituras",  fase: "Ler",      titulo: "os numeros da semana, com a origem",          para: true },
    { id: "mudou",     fase: "Ler",      titulo: "o que mudou: status, prazos, uma decisao nova", para: true },
    { id: "insight",   fase: "Ler",      titulo: "a frase do que mudou",                        para: true },
    ...FECHAR,
  ],
  reformar: () => [
    { id: "visao",     fase: "Ver",      titulo: "o desenho de hoje, inteiro, uma vez",         para: false },
    { id: "mudancas",  fase: "Mudar",    titulo: "o que sai, o que entra, o que muda de nome",  para: true },
    { id: "esqueleto", fase: "Mudar",    titulo: "o esqueleto com o desenho novo",              para: true },
    { id: "gravar",    fase: "Mudar",    titulo: "gravar: vale da proxima versao em diante",    para: true },
  ],
};

if (!MAPAS[modo]) {
  console.error(`--modo ${modo} nao existe. Use um de: ${Object.keys(MAPAS).join(", ")}.`);
  process.exit(1);
}

// Cada modo tem o proprio arquivo de estado; o da semana mantem o nome de sempre.
rodar({ mapa: MAPAS[modo](), rotulo: `One page (${modo})`, prefixo: modo === "semana" ? "estado" : `estado-${modo}`, argv });
