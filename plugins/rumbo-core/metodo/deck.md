# Método: deck

Apresentação em padrão de consultoria. As regras de escrita de `_principios.md` valem
integralmente aqui: o sistema visual faz o deck parecer de consultoria, esta gramática
faz ele funcionar como uma.

Catálogo de infográficos em `deck-infograficos.md`.

## O que é, e o que não é

Um deck de decisão carrega um argumento até uma escolha.

Não é relatório (que informa sem concluir), não é plano (que tem meta e calendário) e
não é documento com slides. **Se o pedido é estratégia, o deck não leva meta, projeção
nem cronograma.** Prioridade é ordem de dependência, não calendário. Se houver
sequência, declare na linha de fonte: "a sequência é de dependência, não de calendário".

Se o pedido for plano, aí entram metas e datas, e é outro deck.

## Entradas mínimas

- Os números, **com fonte e ressalva**. Deck bonito com número errado é pior que slide
  feio: ele circula.
- O argumento fechado. Deck não é onde você descobre a tese.
- A decisão que está na mesa, e de quem é.

**Pesquise e feche o conteúdo antes de abrir o gerador.** Faltou um número, deixe o
slide incompleto e pergunte. Um quadro a menos é recuperável; um número inventado no
deck da liderança, não.

## Storyline primeiro

Escreva a lista de títulos de ação, em ordem, antes de qualquer slide. Se a sequência
de títulos não conta a história sozinha, o deck não vai contar.

## Título de ação

Todo slide de conteúdo tem título que é **frase completa com verbo, carregando a
conclusão**. Quem ler só os títulos, na ordem, sai com o argumento inteiro.

| Não | Sim |
|---|---|
| Receita | A receita está parada: sete meses de execução resultaram em 2,7% de crescimento |
| Mercado | O mercado cresce 10,5%. O grupo de referência cresce 15,8%. Todo o resto cresce 5,6% |
| Prioridades | A ordem sai da tese, não de meta: primeiro a compra, porque tudo depende dela |

O rótulo curto não some: vira o **kicker** em caixa alta acima do título.

Duas linhas é o limite. Se não couber, o slide está tentando dizer duas coisas.
**Um argumento por slide.** Se o título precisa de "e" para caber duas ideias, são dois
slides.

## Anatomia do slide de conteúdo

```
KICKER EM CAIXA ALTA                                      [logo]
Título de ação, frase completa, até duas linhas
────────────────────────────────────────────────────────────────
QUADRO N · O QUE ESTÁ SENDO MOSTRADO · RECORTE TEMPORAL

    [ infográfico ]                  [ painel de leitura ]

────────────────────────────────────────────────────────────────
Conclusão em uma linha
Fonte: origem, recorte, ressalva metodológica.
```

O **painel de leitura** ao lado do gráfico é o que separa deck de consultoria de
relatório. O gráfico mostra o dado; o painel diz o que concluir. Sem painel, cada
pessoa na sala lê uma coisa.

## Etiqueta de quadro

Formato: `QUADRO N · descrição do que está sendo medido · recorte temporal`

Numeração sequencial no deck inteiro, para a discussão ("volta no quadro 7"). Use
contador que incrementa sozinho, nunca número escrito à mão: a ordem dos slides muda.

## Linha de fonte

Uma por slide com número, no rodapé, em itálico e cor apagada. Contém origem, recorte
e a ressalva quando houver.

## Arquitetura do deck

```
Capa
Sumário executivo            ← a tese inteira em um slide
Divisor: seção 01
  3 a 6 quadros
  Síntese da seção
Divisor: seção 02
  ...
Princípios / regras de decisão
Limites e onde a tese pode quebrar
Fecho
Anexo (quando houver material que não cabe no argumento)
```

Duas exigências que decks comuns pulam:

- **Síntese ao fim de cada seção**, com título de ação que fecha a seção.
- **Slide de limites**, dizendo o que não fazemos e sob quais condições a tese quebra.
  Deck de decisão sem lista de riscos é deck de venda.

**O que não cabe no argumento desce para o anexo, e não é apagado.** Fica conferível,
fora do caminho, e disponível para a pergunta que aparecer. É isso que permite manter um
argumento por slide sem a sensação de estar escondendo material: nada some, tudo é
ranqueado. O quadro que sobrevive no corpo é o que sustenta a decisão em jogo.

## Escolha do infográfico

O formato sai da pergunta, não do gosto.

| A pergunta é | Use |
|---|---|
| Quão grande é cada recorte do mercado | Funil de barras proporcionais |
| Dois recortes do mesmo conjunto se contradizem | Butterfly |
| De onde veio a variação | Ponte (waterfall) ou decomposição em pp |
| Qual a distância entre nós e a referência | Dumbbell |
| Como várias séries evoluíram lado a lado | Small multiples |
| Qual a ordem e a dependência | Escada |
| O que existe hoje e o que falta | Tabela de diagnóstico com coluna de status |
| Duas curvas que deveriam andar juntas se separam | Tesoura |

**Nunca** use caixinha com setinha para representar processo. Se é processo, é escada
ou ciclo desenhado, com as etapas dimensionadas.

Gráfico é forma vetorial desenhada, não gráfico nativo, salvo onde o catálogo abrir
exceção.

## Densidade de destaque

Proporção por página, como referência:

| Camada | Fatia | O que é |
|---|---|---|
| Base e autoridade | ~70% | Cor de texto, neutros, a cor que carrega o argumento |
| Conteúdo de apoio | ~25% | Superfícies, réguas, fundos |
| Destaque | ~5% | A cor que chama atenção |

Destaque acima de 5% deixa de destacar. É a razão de "nunca mais de três cores num
mesmo gráfico" funcionar: não é regra de contagem, é regra de proporção.

Cor de alerta só para alerta. Cor de ação só para ação, e documento que não tem ação
não usa essa cor.

## Erros recorrentes de render

Só aparecem na imagem. Por isso o deck é inspecionado slide a slide, sempre.

- Conteúdo empilhado no topo, terço inferior vazio. Empurre para baixo.
- Rótulo de valor colidindo com a linha do gráfico. Afaste ou desligue.
- Etiqueta de quadro colidindo com o cabeçalho da tabela logo abaixo.
- Texto dentro de barra estreita. Condicione: barra estreita, texto vai para fora.
- Última régua da tabela batendo na frase de conclusão.

## Checklist antes de entregar

- [ ] Ler só os títulos, em ordem, conta a história inteira
- [ ] Um argumento por slide
- [ ] Todo slide com número tem linha de fonte
- [ ] Etiquetas de quadro em sequência, sem buraco
- [ ] Nenhum slide com o terço inferior vazio
- [ ] Renderizado em imagem e inspecionado slide a slide
- [ ] Cada seção termina em síntese
- [ ] Existe slide de limites
- [ ] Passou o checklist de `_principios.md`

## Nunca

- Nunca entregar `.pptx` que você não viu renderizado.
- Nunca inventar número para fechar um quadro.
- Nunca esconder ressalva de método fora da linha de fonte.
