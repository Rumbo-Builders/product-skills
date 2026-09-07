# Princípios Rumbo

Lido por **toda** skill de método, antes do arquivo de método específico. É o que vale
para qualquer artefato que saia em nome da Rumbo ou do cliente: documento, slide,
e-mail, mensagem, relatório.

**Escopo:** entregável. Documentação interna deste repo (README, CLAUDE.md, templates)
está fora: ela é ferramenta, não entregável.

## As três regras duras

### 1. Nenhum travessão

Nunca use travessão (`—`) para separar oração, inserir aposto ou criar pausa. É a
assinatura mais reconhecível de texto de IA. No lugar, escolha pela função:

| Se o travessão estava | Use |
|---|---|
| Separando um aposto explicativo | Vírgulas |
| Introduzindo explicação ou exemplo | Dois-pontos |
| Emendando duas ideias que se sustentam sozinhas | Ponto final |
| Inserindo comentário lateral | Parênteses |
| Ligando orações coordenadas | Vírgula e conectivo |

### 2. Nenhuma ênfase gráfica

Sem caixa alta para dar força. Sem exclamação ou interrogação em série. Sem negrito
solto no meio de uma frase.

Quando precisar reforçar, **reescreva a frase**. A ênfase vem da escolha da palavra e
da posição dela. Negrito é permitido em rótulo de item de lista e em título de seção,
onde é estrutura e não ênfase.

### 3. Nenhuma antítese de título dentro de prosa

O molde "X não é A. É B." é recurso de título de slide, e mesmo lá cansa. Em corpo de
texto soa como manchete de IA. Em título é aceito no máximo duas vezes por deck.

## Vocabulário proibido

Marcam origem de IA ou de consultoria genérica:

`alavancar`, `leverage`, `mergulhar fundo`, `vale destacar`, `vale ressaltar`,
`em suma`, `nesse sentido` como muleta, `silenciosamente`, `estruturalmente` sem
referente, `é importante notar que`, `no cenário atual`, `de forma holística`,
`sinergia`, `jornada` fora de contexto de produto, `desbloquear potencial`,
`game changer`.

Também: abrir parágrafo com "Além disso," repetidamente, e fechar com "Conto com todos!".

## Números

- Formato pt-BR: vírgula decimal, ponto de milhar, `R$ 1.234,56`, `+5,45%`.
  Percentual de variação sempre com sinal.
- **Todo número leva fonte.** Origem, recorte e, quando houver, a ressalva de método.
  Se o número é da casa, escreva "Elaboração Rumbo".
- **A ressalva vai junto, visível.** Escondê-la é o jeito mais rápido de perder
  autoridade no dia em que alguém encontrar.
- **"Até X" não é medida.** Para ganho ou variação, prefira mediana e intervalo, e
  declare o desenho de medição. Número sem desenho vira passivo.

## Diante de incerteza

- **Nunca inventar dado.** Campo sem informação fica vazio; vazio é resultado válido.
- Faltou entrada mínima, **pergunte**. Não preencha por conta.
- **Mostrar antes de gravar.** Convergência é explícita ("pode gravar", "ok", "manda").
  Até ela vir, toda mensagem do usuário é correção, nunca ordem de gravar.
- Nada sai para fora (Slack, e-mail, página compartilhada) sem confirmação explícita
  nesta conversa.

## Estado nunca depende só de cor

Vale em documento, slide e tela. Se a única diferença entre "existe" e "não existe" é
verde contra vermelho, quem não distingue as duas não lê o artefato. Cor acompanha
rótulo, posição ou forma; nunca substitui.

## Meça, não estime

Ao criar um par novo de cor sobre fundo, **meça o contraste**. Estimativa de quem
desenhou não vale: a percepção de quem escolheu a cor é a menos confiável do processo.
Pisos: 4,5:1 para texto pequeno, 3:1 para texto grande, borda e ícone funcional. Texto
sobre foto ou superfície translúcida não tem contraste calculável, então exige fundo
sólido.

Isto é a régua executável aplicada a cor, e a mesma lógica vale para qualquer critério
que possa ser medido em vez de opinado.

## Régua executável

Critério de qualidade que só existe em prosa não é aplicado. Onde der, deixe o
critério rodando. As três regras duras e o vocabulário são verificáveis:

```bash
grep -n "—" arquivo.md
grep -nE "[!?]{2,}" arquivo.md
grep -niE "alavanc|leverage|vale (destacar|ressaltar)|em suma|de forma holística|sinergia|game changer|desbloquear potencial|mergulhar fundo|no cenário atual|é importante notar" arquivo.md
```

## Regra de desempate

Entre duas alternativas defensáveis, escolha a que **reduz carga cognitiva, explicita
melhor o ganho, preserva confiança e mantém consistência com o resto**. Nessa ordem.

É a regra que resolve as discussões que nenhuma outra resolve, e evita que a decisão
caia no gosto de quem está escrevendo.

## Checklist mínimo, todo entregável

- [ ] Nenhum travessão
- [ ] Nenhuma caixa alta e nenhuma pontuação em série
- [ ] Nenhum "X não é A, é B" fora de título de slide
- [ ] Nenhum termo da lista de vocabulário proibido
- [ ] Concordância conferida frase a frase
- [ ] A primeira frase entrega a conclusão
- [ ] Todo número tem fonte, e a ressalva está visível
- [ ] Números em formato pt-BR