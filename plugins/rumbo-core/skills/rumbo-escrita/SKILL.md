---
name: rumbo-escrita
description: >-
  Normas de escrita da Rumbo. Aplique sempre que produzir ou revisar qualquer texto
  que saia em nome da Rumbo ou de um cliente: e-mail, mensagem, post, comunicado
  interno, proposta, documento, one-pager ou slide. Use também quando pedirem para
  "revisar o texto", "melhorar a escrita", "ver se está no padrão", "tirar cara de
  IA", ou quando reclamarem que um texto "parece escrito por IA". Skill genérica: se
  o pedido for de um cliente específico e existir skill derivada dele, ela é que roda.
---

# rumbo-escrita

Skill de método. Cliente-agnóstica: não conhece ferramenta, ID nem destinatário
nomeado. Quando roda a partir de uma derivada, o binding vem dela.

## Antes de qualquer coisa

Leia, nesta ordem:

1. `${CLAUDE_PLUGIN_ROOT}/metodo/_principios.md`
2. `${CLAUDE_PLUGIN_ROOT}/metodo/escrita.md`

Consulte `${CLAUDE_PLUGIN_ROOT}/metodo/escrita-antes-e-depois.md` quando precisar
mostrar uma reescrita ao usuário, ou quando estiver em dúvida sobre como desfazer um
travessão, uma antítese ou uma ênfase gráfica.

Não reproduza método aqui. Este arquivo é só o fluxo.

## Binding

Se uma derivada delegou para cá, ela definiu ENTRADAS, SAÍDAS e DESVIOS, e o
`contexto/perfil.md` do cliente traz destinatários, vocabulário e tom. **Onde o método
conflitar com o binding, o binding vence.**

Sem binding (o usuário chamou direto), pergunte o destinatário antes de escrever. Não
assuma registro.

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

1. **Reunir as entradas mínimas:** a conclusão em uma frase, o destinatário nomeado, e
   o que deve acontecer depois da leitura. Faltando qualquer uma, pergunte.
2. **Escrever ou revisar**, aplicando estrutura e registro do método.
3. **Passar a régua**, na ordem do checklist de `_principios.md`. Em arquivo, rode os
   greps de lá; em texto colado na conversa, confira lendo.
4. **Devolver.** Em revisão, mostre o antes e o depois lado a lado e diga qual regra
   cada mudança atende. Reescrever sem dizer por quê não ensina nada. Quando o texto vai
   para fora ou pede uma decisão, entregue junto o teste de leitura de `escrita.md`: ele
   exige outra pessoa, então nunca o reporte como conferido.
5. **Só publique com confirmação explícita.** Nada sai para canal externo sem o
   usuário mandar.

## Revisão: o que reportar

Separe o que é regra do que é sugestão. Regra quebrada é apontada como quebra, com o
trecho; questão de gosto é oferecida como alternativa. Misturar as duas faz o usuário
descartar as duas.

Se o texto está bom, diga que está bom. Reescrever por reescrever é ruído.

## Limites

- Trata **texto em prosa**. Deck é `rumbo-deck`, que já aplica estas regras.
- As regras valem para **entregável**. Documentação interna de repo, commit, código e
  comentário estão fora.
- Não decide conteúdo. Se o argumento está errado, diga, mas não invente o certo.
