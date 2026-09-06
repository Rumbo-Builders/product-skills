# Catálogo de infográficos

Todos desenhados com `addShape` e `addText`. Nenhum usa gráfico nativo, exceto onde
indicado.

Convenções: `M` margem, `CW` largura útil, `H` altura do slide, e as cores vêm do tema
(`C.ACC1`, `C.ACC2`, `C.ACC3`, `C.INK`, `C.PAPER3`, `C.RULE`, `C.ALTA`, `C.ATEN`, ...).
O motor está em `../skills/rumbo-deck/scripts/base.js`; os valores concretos de cor e
fonte vêm do tema do cliente, nunca daqui.

Regra de escolha, e a razão de o catálogo existir: **o formato sai da pergunta, não do
gosto**. A tabela de decisão está em `deck.md`.

---

## 1. Funil de mercado (recortes proporcionais)

**Quando:** mostrar o tamanho de cada recorte do mercado.

**Como:** três barras horizontais empilhadas verticalmente, largura proporcional à
métrica que define o recorte (número de unidades, não faturamento, se o argumento for
de cobertura). Rótulo à esquerda, número grande dentro da barra em branco, qualificador
em branco translúcido logo abaixo.

**Armadilha:** quando a terceira barra fica estreita, o texto não cabe dentro.
Condicione:

```js
const inside = w > 3.2;
s.addText(valor, inside
  ? { x: x + 0.3, y: y + 0.2, color: C.PAPER, ... }
  : { x: x + w + 0.25, y: y + 0.2, color: cor, ... });
```

**Fechamento:** faixa de KPI no rodapé com 3 ou 4 números que sintetizam o funil.

---

## 2. Butterfly (dois recortes contraditórios)

**Quando:** o mesmo conjunto ordena de um jeito por uma métrica e de outro por outra.
O caso canônico é do tipo "12,6% das unidades respondem por 50,3% das vendas".

**Como:** eixo central com faixa de rótulo de 3,1 pol. Barras crescem para a esquerda
(métrica A) e para a direita (métrica B) a partir das bordas dessa faixa. Escala comum
às duas metades. Valor numérico fora da ponta de cada barra.

```js
const cx = M + CW / 2, half = CW / 2 - 1.55, sc = half / maxValor;
// barra esquerda: x = cx - 1.55 - largura
// barra direita:  x = cx + 1.55
```

**Ênfase:** a linha que importa em opacidade cheia, as outras em `transparency: 55`.
O olho vai direto ao ponto sem precisar de seta.

---

## 3. Decomposição em pontos percentuais

**Quando:** separar quanto da variação veio de cada fator (volume, preço, mix).

**Como:** barras horizontais empilhadas por segmento, uma linha por recorte, legenda de
cor acima. Total ao final da barra em bold.

**Cuidado de layout:** a legenda colide com a conclusão do rodapé se a área de plotagem
começar tarde. Comece em `y0 = 2,45`, altura de linha `0,53`, legenda deslocada `+0,14`.

---

## 4. Ponte / waterfall

**Quando:** explicar de onde saiu a variação entre dois pontos.

**Como:** escala vertical com grade horizontal em 4 níveis (linha do zero em `RULE2`,
as outras em `RULE`). Três tipos de coluna:

- `tot` (total): da linha zero até o valor, cor `ACC1`, rótulo sem sinal, em `INK`
- `up` (entrada positiva): cor `BAIXA`, rótulo com `+`
- `dn` (saída): cor `ATEN`, rótulo com `−`

Conector tracejado `RULE2` entre o topo de uma coluna e a próxima, exceto antes de um
total.

```js
const yv = v => gy + gh * (hi - v) / (hi - lo);
const bw = gw / n * 0.60, gap = gw / n;
```

**Uso característico:** terminar com uma coluna de "recorrente" que remove o efeito não
repetível. É o que impede o deck de comemorar um número que não se repete.

---

## 5. Dumbbell (gap contra a referência)

**Quando:** uma única distância importa mais que a série toda. Do tipo "3.500 itens por
unidade contra mais de 10.000 na referência".

**Como:** eixo horizontal com marcas de escala em `RULE`. Linha grossa `RULE2` de 6 pt
ligando dois círculos de 0,29 pol. Círculo da esquerda em `ACC1`, da direita em `ACC3`.
Rótulo de cada ponta acima do círculo (nome em bold, valor na cor do ponto). No meio da
linha, abaixo, o tamanho do gap.

**Fechamento:** três colunas de texto com régua `INK` de 2 pt no topo de cada,
respondendo "o que trava", "o que podemos fazer" e "por que o terceiro ator participa".

---

## 6. Small multiples

**Quando:** comparar a trajetória de 3 a 6 séries sem sobrepor linhas.

**Como:** uma miniatura por série, **mesma escala vertical em todas**. Escala generosa
para as linhas não encostarem no topo. Rótulos de valor acima da linha, em `yv(v) - 0,36`,
nunca em cima dela.

**Regra:** se a escala não for comum a todas as miniaturas, não é small multiples, é um
conjunto de gráficos enganosos.

---

## 7. Escada de prioridades

**Quando:** a ordem importa e cada passo depende do anterior.

**Como:** N cartões de largura igual, altura crescente, base alinhada:

```js
const h = 1.44 + i * 0.26;   // altura cresce
const y = base - h;          // base fixa em 5.22
```

Cada cartão: fundo `PAPER3`, borda `RULE`, faixa colorida de 0,06 pol no topo, número
`01` a `0N` na cor da faixa, título em bold. A descrição vai **abaixo** da base comum,
fora do cartão, para os cartões não estourarem.

Régua `INK` na base e uma frase de dependência logo abaixo.

**Cuidado:** título longo estoura. Se não couber em duas linhas, encurte o título, não
diminua a fonte.

---

## 8. Ciclo

**Quando:** o processo é circular e o ponto é que não há começo.

**Como:** nós distribuídos em círculo por ângulo. O rótulo do nó do topo colide com o
próprio nó se você usar a mesma regra de posicionamento de todos:

```js
const dy = Math.sin(ang) < 0 ? -0.52 : 0.30;   // topo: texto acima
```

---

## 9. Camadas de acesso

**Quando:** mostrar onde estamos e onde está o concorrente numa cadeia.

**Como:** barra horizontal segmentada. O trecho de vantagem recebe rótulo em `INK` bold;
o trecho de desvantagem recebe rótulo em `MUT` regular. A assimetria tipográfica já diz
quem tem vantagem, sem precisar escrever.

---

## 10. Tabela de diagnóstico

**Quando:** listar o que existe, o que é parcial e o que não existe.

**Como:** três colunas (métrica / hoje / por que importa), cabeçalho em caixa alta cor
`MUT`, régua `INK` de 1,25 pt sob o cabeçalho, régua `RULE` de 1 pt sob cada linha.
A coluna "hoje" em bold, colorida por severidade: `ALTA` para não existe, `ATEN` para
parcial.

**Geometria segura:** `y0 = 3,80`, `rh = 0,51`, conclusão em `y = 6,52`. Com `rh = 0,54`
a última régua bate na conclusão.

---

## 11. Cartões numerados

**Quando:** apresentar de 3 a 4 dimensões de igual peso, ou uma delas como fundação.

**Como:** N cartões de largura `(CW - (N-1)*0,26) / N`. Fundo `PAPER3` e borda `RULE`
para os normais. **A dimensão que é pré-requisito das outras recebe fundo `INK`**, com o
número em `ACC1_CLARO` e o texto em branco. A inversão de fundo faz a hierarquia sem
precisar de seta.

Abaixo dos cartões, uma faixa clara com borda `ACC1` pode apontar o que ficou de fora.

---

## 12. Tesoura (duas séries divergindo)

**Quando:** duas curvas que deveriam andar juntas se separam. Do tipo custo de compra
contra preço de venda.

**Como:** gráfico de linha nativo (`addChart`) é aceitável aqui, com `showValue: false`.
Os números vão para um painel de KPI ao lado ou abaixo. A área entre as curvas pode
receber um retângulo translúcido na cor de alerta.
