/* Deck de exemplo. Exercita o motor de ponta a ponta.
   Os números são fictícios e existem só para mostrar a forma.

   node exemplo.js   →   Exemplo.pptx
*/
const { criar, fmtPct } = require('./base.js');
const D = criar(require('./tema-neutro.js'));
const { pres, C, capa, divider, slideL, chrome, exlabel, lead, fecho, source,
        tabela, escada, ponte, kpiStrip } = D;

/* Capa */
capa('Exemplo de deck', 'O motor roda sem marca e sem logo: o tema é que carrega a identidade',
     'Peça de demonstração do rumbo-core. Nenhum número aqui é real.',
     'Rumbo · exemplo gerado por exemplo.js');

/* Seção */
divider('SEÇÃO 01', 'Diagnóstico', 'O que existe hoje, o que é parcial e o que não existe.');

/* Tabela de diagnóstico */
let s = slideL();
chrome(s, 'Diagnóstico', 'Três das cinco capacidades não existem, e as duas que existem são parciais');
exlabel(s, 'capacidades avaliadas · situação atual');
lead(s, 'A leitura é de existência, não de maturidade. Parcial significa que a capacidade opera, mas sem cobertura ou sem dono.', 2.20);
tabela(s, ['Capacidade', 'Hoje', 'Por que importa'], [
  ['Medição de uso', 'Parcial', 'Sem ela, nenhuma priorização se sustenta', C.ATEN],
  ['Ciclo de descoberta', 'Não existe', 'A decisão vira opinião do mais graduado', C.ALTA],
  ['Régua de qualidade', 'Parcial', 'O retrabalho aparece só na entrega', C.ATEN],
  ['Cadência de revisão', 'Não existe', 'O plano envelhece sem ninguém notar', C.ALTA],
  ['Documentação viva', 'Não existe', 'O conhecimento sai junto com a pessoa', C.ALTA]
]);
fecho(s, 'A ordem de ataque sai da dependência: medição primeiro, porque as outras quatro leem dela.');
source(s, 'Fonte: dados fictícios, gerados para demonstração do motor. Elaboração Rumbo.');

/* Escada de prioridades */
s = slideL();
chrome(s, 'Prioridades', 'A sequência é de dependência, não de calendário: cada passo só abre com o anterior fechado');
exlabel(s, 'ordem de dependência entre as frentes');
escada(s, [
  ['Instrumentar o uso', 'Sem número de uso, as três frentes seguintes discutem no escuro.', C.ACC1],
  ['Abrir o ciclo de descoberta', 'Com uso medido, a descoberta passa a ter critério de parada.', C.ACC2],
  ['Publicar a régua', 'A régua só vale quando existe evidência para conferi-la.', C.ACC3],
  ['Instalar a cadência', 'Fecha o ciclo: o que foi medido volta para a decisão.', C.ACC1]
]);
source(s, 'A sequência é de dependência, não de calendário. Elaboração Rumbo.');

/* Ponte */
s = slideL();
chrome(s, 'Variação', 'Metade do crescimento do período veio de um efeito que não se repete');
exlabel(s, 'decomposição da variação · período fictício');
ponte(s, [
  { l: 'Base', v: 100.0, t: 'tot' },
  { l: 'Volume', v: 8.4, t: 'up' },
  { l: 'Preço', v: 4.1, t: 'up' },
  { l: 'Mix', v: -2.6, t: 'dn' },
  { l: 'Não recorrente', v: -6.2, t: 'dn' },
  { l: 'Recorrente', v: 103.7, t: 'tot' }
], { lo: 90, hi: 118, ticks: [90, 100, 110, 118] });
kpiStrip(s, [
  [fmtPct(9.9), 'crescimento reportado', C.ACC1],
  [fmtPct(3.7), 'crescimento recorrente', C.BAIXA],
  ['6,2 p.p.', 'efeito não repetível', C.ATEN]
]);
source(s, 'Fonte: dados fictícios. A coluna "recorrente" remove o efeito não repetível.');

pres.writeFile({ fileName: 'Exemplo.pptx' })
  .then(() => console.log('Exemplo.pptx gerado. Agora renderize e inspecione slide a slide.'));
