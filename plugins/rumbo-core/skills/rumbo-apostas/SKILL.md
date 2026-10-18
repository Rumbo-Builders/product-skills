---
name: rumbo-apostas
description: >-
  Guia a criação, a edição e o acompanhamento das apostas da casa, uma
  conversa por etapa, e grava no sistema de apostas quando ele existe. Use
  quando pedirem "nova aposta", "criar uma aposta", "editar a aposta", "revisar
  a aposta", "mudar o status da aposta", "matar a aposta", "a aposta venceu",
  "marcos da aposta", "resultado esperado", "revisão semanal das apostas",
  "status das apostas", "o que andou nas apostas", ou quando colarem uma ideia
  pedindo para virar aposta. Skill genérica: se o pedido for de uma casa
  específica e existir skill derivada dela, ela é que roda.
---

# rumbo-apostas

Skill de método. Cliente-agnóstica: não conhece sistema, canal nem pessoa. Quando
roda a partir de uma derivada, o binding vem dela.

## Antes de qualquer coisa

Leia, nesta ordem:

1. `${CLAUDE_PLUGIN_ROOT}/metodo/_principios.md`
2. `${CLAUDE_PLUGIN_ROOT}/metodo/conducao.md`: como guiar. Vale a conversa inteira.
3. `${CLAUDE_PLUGIN_ROOT}/metodo/apostas.md`: o que é uma boa aposta, e o
   acompanhamento.
4. `${CLAUDE_PLUGIN_ROOT}/metodo/escrita.md`, para a redação.

**O texto da aposta é de quem responde por ela.** Você pergunta, devolve a
fraqueza com o critério do método, sugere no máximo duas reescritas, e registra o
que a pessoa escolheu. O que você propôs e ela não confirmou vai em
`payload.propostas`, nunca com prefixo no texto.

**Você não inventa número.** Priorização (alcance, impacto, certeza, esforço) se
pergunta falando; o cálculo é do sistema.

## De que casa, e onde a aposta vive

Sem casa nomeada, pergunte antes de abrir qualquer arquivo. Depois, onde a aposta
vive:

- **Com o sistema da casa** (o módulo está ligado quando qualquer tool do ProductOps aparece entre as suas, com o nome puro ou com prefixo de servidor (`mcp__<servidor>__ciclo_ativo`); a regra inteira está em `MODULO.md`, "Quando ligar"): leia `${CLAUDE_PLUGIN_ROOT}/modulos/productops/MODULO.md`, seção
  "Apostas". É lá que se lê, grava e acompanha.
- **Sem ele**, a aposta vive no envelope da estratégia e muda numa revisão dela.
  Conduza igual, valide o rascunho, e entregue-o em
  `.rumbo/aposta-<slug>.json`, pronto para a próxima revisão da estratégia
  (`rumbo-estrategia`, etapa `amarracao`). Diga isso em uma frase, sem prometer o
  que não vai acontecer agora, e não fale do módulo.
  - **Editar** lê e grava o mesmo `.rumbo/aposta-<slug>.json`; sem ele, a aposta
    está no envelope da estratégia, e o rascunho parte dela.
  - **Acompanhar** grava a mudança de status como `payload.estado` com
    `payload.estado_motivo` no rascunho, e a próxima revisão da estratégia a leva.
  - Sem estratégia publicada ainda, rode o validador sem `--cascata`: ele avisa
    que não conferiu a amarração, e a escolha servida fica como pergunta.

**A cascata publicada à mão.** Toda aposta serve uma escolha. Com o sistema da
casa, ela vem de `estrategia_contexto`; sem ele, de `.rumbo/anterior-estrategia.json`.
Guarde a cópia em `.rumbo/anterior-estrategia.json`: o validador e o tradutor leem
dela.

## Três modos, e o roteiro de cada um

Pergunte, se o pedido não disser: **criar uma aposta, editar uma que existe, ou
acompanhar as do squad?** Depois, a primeira chamada:

```bash
node ${CLAUDE_PLUGIN_ROOT}/skills/rumbo-apostas/scripts/estado.mjs --time <casa> --modo nova|editar|acompanhar
```

Mostre o roteiro que ele imprime antes da primeira pergunta, e a cada etapa:

```bash
node ${CLAUDE_PLUGIN_ROOT}/skills/rumbo-apostas/scripts/estado.mjs --time <casa> --modo nova --concluir hipotese
```

Havendo conversa em andamento no mesmo modo, pergunte se continua ou recomeça.
Depois de gravar tudo, `--descartar`.

### Criar (`--modo nova`)

1. **Base.** A casa, a cascata publicada, e se a aposta nasce de uma ideia colada.
2. **Escolha.** Que escolha da cascata ela prova? Mostre as candidatas, em lista,
   com o texto literal. Nenhuma serve? Pergunte se é roadmap ou se falta uma
   escolha na cascata, e pare até saber.
3. **Problema.** O que hoje não funciona, para quem.
4. **Hipótese.** "Se, então, porque." Cobre o porquê na substância: é ele que diz o
   que se aprende quando a aposta morre.
5. **Medida.** Indicador com unidade, e o resultado esperado com a janela.
6. **Matar.** O que mata, até quando, e o horizonte. Sem data, não segue.
7. **Quadrante.** As duas perguntas e a regra de ouro; diga qual e por quê.
8. **Priorização.** Em perguntas faladas, nunca um número seu.
9. **Dono e squad.** Uma pessoa responde, um squad executa.
10. **Validar.** Escreva o rascunho em `.rumbo/aposta-<slug>.json`, na forma de
    `scripts/exemplo-aposta.json`, e rode:

    ```bash
    node ${CLAUDE_PLUGIN_ROOT}/scripts/validar-alcas.mjs .rumbo/aposta-<slug>.json --cascata .rumbo/anterior-estrategia.json
    ```

11. **Gravar.** Mostre o rascunho inteiro, campo a campo, no vocabulário da
    pessoa, e espere o sim. Com o sistema da casa, o `MODULO.md` diz as tools e o
    tradutor monta os campos.
12. **Avaliação da IA.** O veredito do sistema, em blocos curtos. O que for vago
    ou desalinhado volta à etapa que toca, como proposta.
13. **Marcos.** O primeiro é a decisão de matar ou seguir, na data do critério.
    Os outros, só entrega ou decisão.
14. **OKR.** Ofereça o objetivo que a mede: "quer criar o OKR desta aposta agora?".
    Com sim, siga pela `rumbo-okrs`, modo `novo`, com a aposta já servida.
15. **Insights.** O estacionamento, de uma vez.

### Editar (`--modo editar`)

1. **Base.** Qual aposta. Liste as do ciclo, curtas, e a pessoa escolhe.
2. **Visão.** A aposta de hoje inteira, uma vez: tese, medida, critério, marcos,
   resultados, dono, status.
3. **Tese, medida, matar, quadrante, dono, marcos.** Uma etapa por mensagem, cada
   item em Hoje, Proposta, Por quê, Fonte (`metodo/conducao.md`). Onde está bom,
   diga em uma frase por que está, e siga.
4. **Validar e gravar.** Só o que mudou, campo a campo, e cada mudança confirmada.
   Status não muda aqui: muda no acompanhamento, com o motivo.
5. **Avaliação da IA**, se a tese mudou.

### Acompanhar (`--modo acompanhar`)

1. **Base.** Do squad, para o rito dele, ou por relevância, para a liderança.
2. **Lista.** As apostas, curtas, começando pelas que têm critério de matar
   vencido ou marco atrasado.
3. **Uma a uma**, as três perguntas de `metodo/apostas.md`: o que mudou desde o
   último status? o critério disparou, ou o marco venceu? o status ainda é
   verdade? Proponha o status e o motivo; quem responde pela aposta decide.
   Critério disparado é uma pergunta só: matamos, pausamos ou ganha prazo novo?
4. **Gravar.** Cada status com o motivo, depois do sim daquela aposta.
5. **Resumo.** As mudanças da semana, em lista curta: é matéria do one page do
   squad. Ofereça levar para lá.

## Recusas

Não grave, e diga por quê:

- Aposta sem escolha servida, depois de ter perguntado.
- Aposta sem critério de matar com data.
- Status sem motivo, ou motivo que não é de quem decide.
- Remover marco ou resultado sem a palavra explícita.

**E recusar demais também é defeito.** A pessoa declarando é fonte. Devolva a
pergunta duas vezes; na terceira, registre como está, com a fraqueza anotada em
`propostas`, e siga.

## Limites

- Não é a estratégia. Mudar uma escolha da cascata é `rumbo-estrategia`.
- Não é o roadmap. Tarefa e entrega do squad moram nele.
- Não calcula priorização nem saúde: número é do sistema.
- Não grava sem confirmação, e não comunica nada.
