---
name: rumbo-okrs
description: >-
  Guia a criação, a edição e o acompanhamento dos OKRs da casa e dos squads,
  uma conversa por etapa, e grava no sistema de OKRs quando ele existe. Use
  quando pedirem "criar OKR", "novo objetivo", "define os OKRs", "editar o
  OKR", "revisar os KRs", "o KR está bom?", "mudar o status do objetivo",
  "objetivo em risco", "OKRs do squad", "acompanhar os OKRs", "fechar os OKRs
  do trimestre", ou quando colarem uma lista de metas pedindo para virar OKR.
  Skill genérica: se o pedido for de uma casa específica e existir skill
  derivada dela, ela é que roda.
---

# rumbo-okrs

> **Onde estão os arquivos.** `${CLAUDE_PLUGIN_ROOT}` é a raiz do plugin rumbo-core:
> a pasta que contém `metodo/`, `scripts/` e `skills/`, duas acima deste SKILL.md.
> O Claude Code a define. Em outro agente (o Codex, por exemplo), troque pela raiz
> real ao ler um caminho e ao rodar um comando, ou defina a variável no mesmo
> comando: `CLAUDE_PLUGIN_ROOT=<raiz> node ...`.

Skill de método. Cliente-agnóstica: não conhece sistema, canal nem pessoa. Quando
roda a partir de uma derivada, o binding vem dela.

## Antes de qualquer coisa

Leia, nesta ordem:

1. `${CLAUDE_PLUGIN_ROOT}/metodo/_principios.md`
2. `${CLAUDE_PLUGIN_ROOT}/metodo/conducao.md`: como guiar. Vale a conversa inteira.
3. `${CLAUDE_PLUGIN_ROOT}/metodo/okr.md`: objetivo, resultado-chave, status e
   acompanhamento.
4. `${CLAUDE_PLUGIN_ROOT}/metodo/escrita.md`, para a redação.

**O texto do objetivo é do dono.** Você pergunta, devolve a fraqueza com o critério
do método, sugere no máximo duas reescritas, e registra o que a pessoa escolheu. O
que você propôs e ela não confirmou vai em `payload.propostas`.

**Você não inventa baseline nem meta.** Número que ninguém informou não entra.
**Status é julgamento do dono**: pergunte, não infira da leitura.

## De que casa, e onde o OKR vive

Sem casa nomeada, pergunte antes de abrir qualquer arquivo. Depois:

- **Com o sistema da casa** (o módulo está ligado quando qualquer tool do ProductOps aparece entre as suas, com o nome puro ou com prefixo de servidor (`mcp__<servidor>__ciclo_ativo`); a regra inteira está em `MODULO.md`, "Quando ligar"): leia `${CLAUDE_PLUGIN_ROOT}/modulos/productops/MODULO.md`, seção "OKRs".
- **Sem ele**, a definição viaja no envelope da estratégia, e a leitura no one page
  do squad. Conduza igual, valide o rascunho, e entregue-o em
  `.rumbo/okr-<slug>.json`, pronto para a próxima revisão da estratégia. Não fale
  do módulo.
  - **Editar** e **acompanhar** trabalham sobre esse rascunho; a rota muda em
    `payload.rota` com `payload.rota_motivo`, e a leitura semanal continua no one
    page do squad.
  - Sem estratégia publicada ainda, rode o validador sem `--cascata`.

**A cascata publicada à mão**, em `.rumbo/anterior-estrategia.json`: todo objetivo
serve uma escolha ou uma aposta.

## Três modos, e o roteiro de cada um

Pergunte, se o pedido não disser: **criar um objetivo, editar um que existe, ou
acompanhar os do squad ou da casa?** Depois, a primeira chamada:

```bash
node ${CLAUDE_PLUGIN_ROOT}/skills/rumbo-okrs/scripts/estado.mjs --time <casa> --modo novo|editar|acompanhar
```

Mostre o roteiro antes da primeira pergunta, e marque cada etapa:

```bash
node ${CLAUDE_PLUGIN_ROOT}/skills/rumbo-okrs/scripts/estado.mjs --time <casa> --modo novo --concluir krs
```

Depois de gravar tudo, `--descartar`.

### Criar (`--modo novo`)

1. **Base.** A casa, se é objetivo da casa ou de um squad, e a cascata publicada.
2. **Serve.** Que escolha ou aposta ele serve. Objetivo de squad aponta também o
   objetivo da casa, quando há.
3. **Objetivo.** A frase, sem número. Número que aparecer desce para o KR.
4. **KRs, um por vez.** Para cada um: outcome ou entrega? (entrega desce para o
   roadmap, e você pergunta o que o cliente faz depois dela); baseline, meta,
   unidade e direção; binário só para comportamento do cliente. Procure o KR
   escondido no indicador da aposta que o objetivo serve.
5. **Leitura.** De onde vem a leitura de cada KR: que indicador do one page do
   squad a envia. Sem leitura, diga que o KR nasce sem ninguém o perseguindo.
6. **Dono, escopo e trimestre.**
7. **Validar.** Rascunho em `.rumbo/okr-<slug>.json`, na forma de
   `scripts/exemplo-okr.json`:

   ```bash
   node ${CLAUDE_PLUGIN_ROOT}/scripts/validar-alcas.mjs .rumbo/okr-<slug>.json --cascata .rumbo/anterior-estrategia.json
   ```

8. **Avaliação da IA de cada KR**, com o sistema da casa, antes de gravar. O que
   voltar fraco retorna à etapa 4, como proposta.
9. **Gravar.** O rascunho inteiro, campo a campo, e o sim da pessoa.

### Editar (`--modo editar`)

1. **Base.** Qual objetivo. Liste os do ciclo, curtos, e a pessoa escolhe.
2. **Visão.** O objetivo de hoje inteiro, uma vez: frase, ligação, KRs com
   baseline e meta, dono, status.
3. **Ligação, objetivo, cada KR, dono.** Uma etapa por mensagem, em Hoje,
   Proposta, Por quê, Fonte. **Trocar um KR no meio do trimestre é decisão**: diga
   o porquê, e ele vai no motivo.
4. **Validar, avaliar os KRs que mudaram, gravar.** Só o que mudou. Os KRs vão
   inteiros na gravação, quando o sistema substitui a lista: mostre a lista final.

### Acompanhar (`--modo acompanhar`)

1. **Base.** Do squad, para o rito dele, ou os da casa, para a liderança.
2. **Lista.** Os objetivos, curtos, começando pelos de leitura velha ou em risco.
3. **Um a um**, as três perguntas de `metodo/okr.md`: a última leitura de cada KR,
   e de quando; o status ainda é verdade; o KR ainda mede o que importa. Proponha
   a rota (no ritmo, em risco, fora de rota) e o motivo; o dono decide.
4. **Gravar.** Cada status com o motivo, depois do sim daquele objetivo.
5. **Resumo.** O que mudou, em lista curta, para o one page do squad.

## Recusas

Não grave, e diga por quê:

- Objetivo que não serve escolha nem aposta, depois de ter perguntado.
- KR sem baseline, meta, unidade ou direção.
- Status sem o motivo do dono.

**E recusar demais também é defeito.** KR que segue de entrega depois de duas
devoluções entra como está, com a fraqueza anotada em `propostas`.

## Limites

- Não é a estratégia nem as apostas: `rumbo-estrategia` e `rumbo-apostas`.
- Não lê o KR toda semana: a leitura é do one page.
- Não calcula saúde de OKR: número é do sistema.
- Não grava sem confirmação, e não comunica nada.
