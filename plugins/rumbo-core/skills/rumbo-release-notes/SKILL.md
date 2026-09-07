---
name: rumbo-release-notes
description: >-
  Transforma os commits de uma janela em um documento de novidades de produto para
  público não técnico, em PDF. Use quando pedirem release notes, novidades da
  semana, "o que mudou no produto", changelog para o time, resumo de entregas, ou
  quando perguntarem como contar ao time o que saiu. Skill genérica: se o pedido
  for de um produto específico e existir skill derivada dele, ela é que roda.
---

# rumbo-release-notes

Skill de método. Cliente-agnóstica: não conhece repositório, público nem destino.
Quando roda a partir de uma derivada, o binding vem dela.

## Antes de qualquer coisa

Leia, nesta ordem:

1. `${CLAUDE_PLUGIN_ROOT}/metodo/_principios.md`
2. `${CLAUDE_PLUGIN_ROOT}/metodo/release-notes.md`
3. `${CLAUDE_PLUGIN_ROOT}/metodo/escrita.md`, para a estrutura do texto

## Binding

A derivada traz repositório, branch, público, tema e destino. Sem binding, pergunte
os três obrigatórios antes de coletar: **janela em datas, repositórios e público.**

Sem derivada, o tema da casa é `.rumbo/tema.css`, gerado uma vez e compartilhado
com o one page e o deck. Aponte o `modelo.html` para ele em vez de escrever cor à
mão. Sem ele, o `base.css` sai nos próprios defaults, que não são identidade de
ninguém.

## O perfil da casa

Antes de escrever, **procure `.rumbo/perfil.md` na pasta de trabalho**. Ele traz
tom, quem lê, vocabulário e cuidados, e vale para todas as skills do core. Se
existir, leia-o: o que ele diz sobre registro e vocabulário vence o default.

**O tom ajusta o registro, e não suspende a régua.** Nenhuma linha do perfil
libera travessão, ênfase gráfica ou vocabulário de consultoria genérica.

Não existe? Rode a configuração de primeira vez, uma só, e ela serve todas as
skills daqui em diante:

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/configurar.mjs --casa <id> --nome "<Nome>" \
  --acento "#333333" [--destaque "#888888"] [--fonte-titulo "..."] \
  [--fonte-corpo "..."] [--simbolo simbolo.svg] [--logo-claro logo.png] \
  [--logo-escuro logo-branco.png] [--tom "..."] [--ressalva "..."]
```

## Fluxo

1. **Coletar.**

   ```bash
   bash ${CLAUDE_PLUGIN_ROOT}/skills/rumbo-release-notes/scripts/coletar.sh \
     <repo> <desde> [ate] [branch]
   ```

   Ele devolve a contagem por tipo e os commits **com corpo**. O corpo é onde está o
   porquê: ler só o assunto produz item de changelog, não de release note.

2. **Filtrar** pela tabela de tipos do método. Diga em números quantos entraram e
   quantos saíram, e por quê.

3. **Traduzir.** Cada item responde o que ficou diferente, para quem, e o que
   destrava. Nenhum termo que só existe dentro do repositório.

4. **Escolher a manchete.** É trabalho editorial, não a ordem dos commits. Semana sem
   novidade para o usuário é resultado válido, e se declara.

5. **Mostrar antes de gerar.** Devolva o rascunho em texto na conversa e espere
   convergência. Gerar PDF de um texto não aprovado é desperdício.

6. **Montar o HTML** a partir de `scripts/modelo.html`, com `base.css` e o `tema.css`
   do cliente ao lado. Depois:

   ```bash
   bash ${CLAUDE_PLUGIN_ROOT}/skills/rumbo-release-notes/scripts/gerar.sh notas.html Saida.pdf
   ```

7. **Conferir o render.** Leia `render/p-*.jpg` página a página. O gerador não vê
   texto cortado, item órfão nem área quebrada ao meio.

8. **Passar a régua** de qualidade do método e reportar o que não bateu.

## Commit que você não entendeu

Não adivinhe e não invente impacto. Duas saídas, nesta ordem: pergunte ao usuário, ou
deixe de fora e **diga que deixou**, com o hash. Item inventado sobre o que mudou no
produto é o pior defeito possível neste documento.

## Limites

- Depende de higiene de commit. Em repositório com mensagens do tipo "ajustes" e "wip"
  este método não produz documento: ele produz uma lista de perguntas. Diga isso em vez
  de preencher.
- Cobre o que está na branch principal. Trabalho em branch aberta não aparece, e o
  documento não deve fingir que aparece.
- Requer Chrome ou Chromium para o PDF. Sem `pdftoppm`, o PDF sai mas **não foi
  conferido**: diga isso em vez de entregar como pronto.
- Não publica. O documento fala em nome do time e sai só com revisão do usuário.

## Nunca

- Nunca inventar item, impacto ou número que o commit não sustente.
- Nunca promover `chore`, `test`, `ci` ou `refactor` a novidade para encher semana fraca.
