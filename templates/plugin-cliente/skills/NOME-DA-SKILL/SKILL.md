---
name: <metodo>-<cliente>
description: >-
  <Gatilhos DESTE cliente. Precisa conter o nome do cliente ou um termo que só
  existe nele — duas derivadas que disparam com as mesmas palavras é bug.
  Ex.: Use quando o usuário pedir o <artefato> da <Cliente>, disser "<termo interno
  deles>", "o <artefato> do <ritual deles>", ou colar <material típico> da <Cliente>
  pedindo para transformar.>
---

# <metodo>-<cliente>

Binding. Não contém método — o método está no `rumbo-core`.

Antes de começar, leia `${CLAUDE_PLUGIN_ROOT}/contexto/perfil.md`.

## ENTRADAS

- <de onde ler: id do data source, JQL, planilha, canal — com o identificador real>

## SAÍDAS

- <onde escrever, em que formato, com que nome/título>

## DESVIOS

- <o que este cliente faz diferente do método. Vazio é resultado válido.>

## DELEGAÇÃO

Carregue a skill `rumbo-<metodo>` e execute o fluxo dela com as ENTRADAS, SAÍDAS e
DESVIOS acima. Onde o método conflitar com este arquivo, **este arquivo vence**.
