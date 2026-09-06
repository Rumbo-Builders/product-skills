---
name: rumbo-<metodo>
description: >-
  <Lista de situações e palavras que disparam esta skill — não um resumo. Escreva o
  que o usuário realmente digita, incluindo quando ele não sabe que existe skill.
  Ex.: Use quando o usuário pedir para montar, revisar ou atualizar um <artefato>,
  disser "monta o <artefato>", "revisa esse <artefato>", ou colar material bruto
  pedindo para virar um. Skill genérica: se o pedido for de um cliente específico,
  a skill derivada daquele cliente é que deve rodar.>
---

# rumbo-<metodo>

Skill de método. **Cliente-agnóstica**: não conhece ferramenta, ID nem stakeholder.
Quando roda a partir de uma skill derivada, o binding vem dela.

## Antes de qualquer coisa

Leia, nesta ordem:

1. `${CLAUDE_PLUGIN_ROOT}/metodo/_principios.md`
2. `${CLAUDE_PLUGIN_ROOT}/metodo/<metodo>.md`

O que estiver nesses arquivos é o método. **Não reproduza método aqui** — este
arquivo é só o fluxo da conversa.

## Binding

Se uma skill derivada delegou para cá, ela já definiu ENTRADAS, SAÍDAS e DESVIOS.
Use-os. **Onde o método conflitar com o binding, o binding vence.**

Se ninguém delegou (o usuário chamou esta skill direto), você não tem binding:
pergunte de onde ler e onde escrever antes de começar. Não assuma ferramenta.

## Fluxo

1. **Reunir entradas.** Confira as "Entradas mínimas" do método. Faltou alguma,
   pergunte — não preencha por conta.
2. **<Passo do método.>**
3. **<Passo do método.>**
4. **Mostrar antes de gravar.** Devolva a prévia e espere convergência explícita
   ("pode gravar", "ok", "manda"). Toda mensagem antes disso é correção, nunca
   ordem de gravar.
5. **Gravar** no destino do binding.
6. **Passar a régua** de qualidade do método e reportar o que não bateu.

## Limites

<Onde este método NÃO vale, e o que fazer nesse caso. Uma skill que não sabe onde
para age fora do escopo. Se depende de ferramenta no ambiente, diga o que acontece
quando ela falta, e nunca entregue como conferido o que não foi conferido.>

- ...

## Nunca

- Nunca inventar dado que não veio das entradas. Vazio é resultado válido.
- Nunca publicar em canal externo (Slack, e-mail, página compartilhada) sem
  confirmação explícita nesta conversa.
