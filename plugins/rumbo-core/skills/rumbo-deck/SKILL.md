---
name: rumbo-deck
description: >-
  Constrói apresentações em padrão de consultoria: storyline de títulos de ação,
  infográficos desenhados em pptxgenjs em vez de gráfico nativo, e QA que reprova o
  build. Use sempre que for criar, revisar ou estender um deck, ou quando pedirem
  "apresentação", "slides", "deck", "pptx" ou "one-pager". A identidade visual vem do
  tema do cliente, nunca desta skill. Skill genérica: se o pedido for de um cliente
  específico e existir skill derivada dele, ela é que roda.
---

# rumbo-deck

Skill de método. O motor é cliente-agnóstico; cor, fonte e logo vêm de um **tema**.

## Antes de qualquer coisa

Leia, nesta ordem:

1. `${CLAUDE_PLUGIN_ROOT}/metodo/_principios.md`
2. `${CLAUDE_PLUGIN_ROOT}/metodo/deck.md`
3. `${CLAUDE_PLUGIN_ROOT}/metodo/deck-infograficos.md`, quando for escolher o formato
   de um quadro

**Feche o conteúdo antes de abrir o gerador.** Deck bonito com número errado é pior que
slide feio: ele circula. Faltou um número, deixe o quadro incompleto e pergunte.

## Binding

A derivada do cliente traz ENTRADAS, SAÍDAS, DESVIOS e o **tema**. Sem tema, use
`scripts/tema-neutro.js`, que é um ponto de partida sóbrio e **não é identidade de
ninguém**. Nunca invente cor de marca nem escreva nome de cliente no motor.

Onde o método conflitar com o binding, o binding vence.

## Fluxo

1. **Storyline primeiro.** A lista de títulos de ação, em ordem, aprovada pelo usuário
   antes de qualquer slide. Se a sequência de títulos não conta a história sozinha, o
   deck não vai contar.
2. **Copiar `scripts/base.js` e o tema** para o diretório de trabalho e montar o
   gerador em cima. Há um gerador funcionando em `scripts/exemplo.js`.
3. **Rodar o QA. Sempre.**

   ```bash
   bash ${CLAUDE_PLUGIN_ROOT}/skills/rumbo-deck/scripts/qa.sh deck.js Saida.pptx
   ```

   O script gera, valida o XML, renderiza em JPG e **reprova o build** se encontrar
   travessão, pontuação em série ou vocabulário proibido no PDF. Se um utilitário
   faltar no ambiente, ele avisa e segue em vez de quebrar.
4. **Inspecionar cada slide como imagem.** Colisão de texto, estouro de caixa e rodapé
   sobreposto só aparecem no render. O QA não vê isso; você vê.
5. **Passar o checklist** de `deck.md` e reportar o que não bateu.

## O motor

```js
const { criar } = require('./base.js');
const D = criar(require('./tema-do-cliente.js'));
const { pres, C, capa, divider, slideL, chrome, exlabel, fecho, source } = D;
```

`criar(tema)` devolve um deck independente, com contador de quadros próprio. Um
`criar` por deck. O tema define `acentos` (1 a 3), `fontes`, `logos` e, se quiser,
sobrescreve `neutros` e `semanticas`. **Sem logo o deck é montado sem logo, nada
quebra**, o que permite trabalhar antes de o cliente mandar os assets.

Helpers de desenho disponíveis: `chrome`, `source`, `lead`, `exlabel`, `fecho`,
`divider`, `capa`, `kpiStrip`, `destaque`, `destaqueEscuro`, `ressalva`, `tabela`,
`cartoes`, `dumbbell`, `ponte`, `escada`, `barraAcentos`. Formatos pt-BR em `fmtBRL` e
`fmtPct`, exportados pelo módulo.

Geometria (13,333 × 7,5 pol, margem 0,72) é fixa e não é tema. As coordenadas do
catálogo dependem dela. Não mexa sem renderizar e inspecionar.

## Limites

- É **deck de decisão**. Se o pedido é plano, com meta e calendário, é outro
  artefato: pergunte antes de assumir.
- O tema é do cliente. Se não existe tema e o usuário não passou as cores, use o
  neutro e diga que usou. Não deduza marca de logo nem de site.
- As regras de escrita são de `rumbo-escrita`, aplicadas via `_principios.md`. O
  `qa.sh` verifica as automatizáveis; o resto é leitura.
- Requer `pptxgenjs` no ambiente. Sem LibreOffice e poppler, o QA gera o arquivo mas
  não renderiza, e aí **o deck não foi conferido**: diga isso ao usuário em vez de
  entregar como aprovado.
