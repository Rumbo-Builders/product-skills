# Método: release notes de produto

Notícia semanal do que mudou no produto, escrita para quem não lê código. As regras de
`_principios.md` e a estrutura de `escrita.md` valem aqui sem repetição.

## O que é, e o que não é

Um documento que responde uma pergunta só: **o que ficou diferente para quem usa o
produto, e por que isso importa.**

Não é changelog (que lista mudanças sem hierarquia), não é release técnico (que fala de
implementação) e não é relatório de esforço do time. Se o leitor terminar sabendo o que
o time fez mas não o que mudou para o usuário, o documento falhou.

O teste: alguém do comercial consegue contar uma dessas novidades para um cliente sem
abrir o produto.

## Entradas mínimas

- **A janela.** Datas de início e fim, explícitas. "Semana passada" não é janela.
- **Os repositórios** que entram, e a branch.
- **O público**, nomeado. Muda o quanto de mecânica cabe.

Sem as três, pergunte. Não assuma janela nem público.

## O filtro

Nem tudo que foi commitado é novidade. O tipo do commit já separa quase tudo:

| Tipo | Entra? |
|---|---|
| `feat` | Sim, é o coração do documento |
| `fix` | Sim, se o usuário sentia o defeito. Não, se era bug interno ou de teste |
| `perf` | Só se o usuário percebe. "Ficou mais rápido" é notícia; "cache em memória" não |
| `refactor`, `chore`, `test`, `ci`, `style`, `build`, `deps` | Não |

Um `fix(test)` ou `chore(ci)` nunca vira item. Se o time quiser ver isso, é outro
documento.

**Escopo sem correspondência no produto sai.** Se o escopo do commit é uma peça interna
(`cache`, `telemetry`, `migration`, `crypto`), o item só sobrevive se você conseguir
dizer o que o usuário nota. Se não conseguir, ele não entra.

## A tradução

Todo item responde três coisas, nesta ordem:

1. **O que ficou diferente**, do ponto de vista de quem usa
2. **Para quem**, quando não for todo mundo
3. **O que isso destrava**, ou que problema para de acontecer

O corpo do commit costuma trazer o item 3. Leia-o: é onde está o porquê. O assunto
sozinho quase nunca basta.

| Commit | Item de release note |
|---|---|
| `feat(ubs): classify UBS access and hide restricted units from patients` | Unidades de saúde com acesso restrito não aparecem mais na busca. Antes o paciente via unidade que não podia usar, e descobria só na porta. |
| `perf(cache): store autocomplete index in persistent_term` | A busca responde mais rápido em quem digita devagar. (Ou nada, se ninguém notar.) |
| `fix(test): give async renders a timeout CI can meet` | Não entra. |

**Nenhum jargão de código.** Nome de biblioteca, de estrutura de dados, de ferramenta de
build ou de camada técnica não aparece. Se o termo só existe dentro do repositório, ele
não existe no documento.

**Nunca afirme impacto que o commit não sustenta.** "Melhora a conversão" não está no
commit. O que está é o que mudou na tela.

## Agrupamento

Por **área de produto**, nunca por tipo nem por repositório. O leitor não quer "as
correções" e "as novidades" separadas: ele quer saber o que mudou em busca, em preço, em
cadastro.

O escopo do commit costuma dar a área de graça. Quando o escopo for técnico, classifique
pela área que o usuário reconhece.

Área com um item só é área. Não force agrupamento para encher seção.

## Janela longa: mês, trimestre

Mesmo método, edição diferente. Um mês traz 30 ou 40 mudanças, e a triagem passa a
ser a maior parte do trabalho: num mês real de produto medimos 34 mudanças virando
11 itens.

O que muda:

- **A manchete deixa de ser um item e passa a ser o movimento do período.** O título
  carrega a síntese; a manchete carrega o item que melhor a representa.
- **Cabe um painel de números** no topo, com três ou quatro medidas. Regra dura: só
  entra número que apareça sustentado em algum item do documento. Painel com número
  que não se explica adiante é enfeite.
- **Semanal não leva painel.** Quatro itens não precisam de painel de números.
- **Vale uma seção "em aberto"** com o que atravessa para o período seguinte.

## Estrutura do documento

```
Cabeçalho: produto, janela em datas, uma linha de o que a semana significou
A manchete: o item mais relevante, com o porquê
Por área de produto:
  Área
    item, item, item
Em aberto: o que ficou pela metade e continua na semana que vem (se houver)
Rodapé: janela, quantidade de mudanças consideradas, onde conferir
```

**A manchete não é o primeiro item da lista, é o que mais importa.** Escolher qual é
já é trabalho editorial, e é o que separa este documento de um changelog.

Semana sem novidade para o usuário é resultado válido. Diga isso em uma linha, em vez
de promover um `chore` a manchete.

## Régua de qualidade

- [ ] Nenhum item contém termo que só existe dentro do repositório
- [ ] Todo item diz o que mudou para quem usa, não o que foi construído
- [ ] A manchete foi escolhida, não herdada da ordem dos commits
- [ ] Agrupado por área de produto
- [ ] Nenhum `chore`, `test`, `ci` ou `refactor` virou item
- [ ] A janela aparece em datas, no cabeçalho e no rodapé
- [ ] Quantidade de mudanças consideradas está declarada
- [ ] Passou o checklist de `_principios.md`

## Erros recorrentes

- **Traduzir o assunto e ignorar o corpo.** O porquê está no corpo. Sem ele o item vira
  descrição de tela.
- **Listar tudo por medo de omitir.** Documento de vinte itens não é lido. O filtro é
  o trabalho.
- **Promover trabalho interno a novidade** em semana fraca. Semana fraca é informação.
- **Escrever para o time de engenharia** porque foi ele que gerou o insumo. O público
  é outro.
- **Inventar o impacto.** Se o commit não diz o que melhorou, o item diz só o que mudou.

## Nunca

- Nunca inventar item, número ou impacto que o commit não sustente.
- Nunca incluir commit cujo sentido você não entendeu. Pergunte, ou deixe de fora e
  diga que deixou.
- Nunca publicar sem o usuário revisar. Este documento fala em nome do time.
