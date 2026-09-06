# Método: one page de produto

O documento semanal que um time de produto publica para governar e para
comunicar. Nada aqui nomeia cliente, sistema ou pessoa: isso é binding.

## O que é, e o que não é

Um one page é **o estado do produto numa página, com o julgamento de quem o
conduz**. Ele carrega o roadmap resumido, as métricas que importam, e as ações e
decisões em aberto.

Não é relatório de status. Relatório de status conta o que foi feito; o one page
diz **o que isso significa e o que se decidiu por causa disso**. A diferença
aparece na seção de ação e decisão: se ela está vazia, o que existe é um
relatório.

Não é documentação do produto, não é backlog e não é ata de reunião.

## Para que serve

Duas decisões, e são de públicos diferentes:

1. **Governança.** É a pauta da conversa periódica entre quem lidera produto e
   quem conduz o time. A pergunta que ele responde ali é "o que mudou desde a
   última vez, e o que precisa de decisão".
2. **Comunicação.** É o que o resto da organização lê para saber onde o produto
   está, sem participar da conversa.

Servir aos dois é requisito, não conveniência. Um artefato que só governa vira
documento interno que ninguém lê; um que só comunica vira vitrine sem consequência.

## O ciclo

O one page é **cíclico e incremental**. Cada publicação é uma versão nova e
imutável, e a cadeia de versões é o histórico. Não se edita a versão publicada:
publica-se outra.

Isso significa que **o valor está tanto no documento atual quanto no incremento**.
O documento atual é o que se lê; o incremento é o que se discute.

**Toda versão carrega um insight central**: uma frase curta que diz o que é
essencial e o que mudou. É a primeira coisa que o leitor vê, e é o que vai no
aviso enviado a quem não vai abrir o documento.

## Entradas mínimas

Se falta alguma, pergunte. Nunca invente.

- O que aconteceu no período (entregas, atrasos, mudanças de plano).
- As leituras de métrica disponíveis, com a fonte de cada uma.
- A versão anterior do artefato, para saber o que mudou.
- As decisões que ficaram abertas na versão anterior.

## Estrutura da saída

Cinco blocos, nesta ordem. Bloco vazio é permitido e às vezes é a resposta certa.

1. **Cabeçalho.** Quem publica e quando.
2. **Objetivos em destaque.** De um a três, cada um com o número grande e o
   enunciado inteiro ao lado. O número sozinho não se interpreta.
3. **Roadmap.** A versão resumida (ver abaixo).
4. **Indicadores que importam.** A tabela.
5. **Ação e decisão.** O que se decidiu, o que trava, o que precisa de resposta.

### Sobre o número em destaque

Ele é **texto de exibição, não um decimal**. Formatos legítimos incluem
percentual, fração de marcos, duração, contagem, e a ausência declarada. Forçar
tudo a virar percentual produz número falso.

Objetivo abandonado **permanece visível, riscado**. Apagar a linha esconde a
decisão de abandonar, que costuma ser a informação mais valiosa do trimestre.

## O roadmap

O roadmap é **definição de quem conduz o produto**, não do sistema. Dois modos,
trocáveis a qualquer momento:

### Modo linha do tempo

Uma matriz de faixas por colunas de tempo.

- As **faixas** podem ser quaisquer, mas a preferência é **faixa de objetivo**,
  ligada logicamente à meta que o time persegue. Faixa que não se liga a nada
  costuma ser trabalho que ninguém pediu.
- As **colunas** são unidades de calendário. A preferência é a unidade curta
  (semana ou quinzena), porque coluna longa esconde atraso.
- A célula é texto livre, e a granularidade varia legitimamente entre times. Não
  normalize.

### Modo agora, próximo, depois

Três estados, mais o estacionamento. Aqui o foco não é atividade: é **marco
grande e seu critério de conclusão**. Marco sem critério de conclusão é desejo.

### A faixa "outros", nos dois modos

Sempre existe. É onde entra o que foi feito e **não tem relação explícita com
nenhum objetivo**. Ela é honestidade, não sobra: um roadmap em que tudo se
encaixa perfeitamente nas faixas é um roadmap escrito depois do fato.

### Dois cortes do mesmo roadmap

- **Detalhado**, para a discussão com quem patrocina o trabalho. Traz as
  entregas potencialmente relacionadas a cada faixa.
- **Enxuto**, que é o que entra no one page.

O enxuto é **gerado a partir do detalhado**, nunca redigitado. Roadmap mantido em
dois lugares diverge em semanas.

### O roadmap é artefato próprio, e o one page o projeta

Publique o **artefato de roadmap primeiro**. O one page então **aponta a versão
que projeta**, e a grade é montada a partir dela na hora de exibir.

Escrever a grade dentro do corpo do one page é o erro clássico aqui: funciona na
primeira semana e, na terceira, o quadro do one page e o roadmap contam coisas
diferentes. Se o roadmap não mudou, o one page aponta a mesma versão de novo.

### Estacionamento

Lista **limitada** de iniciativas não priorizadas que ainda merecem discussão, e
**tipada** (oportunidade ou dor). Estacionamento sem limite é cemitério;
estacionamento sem motivo registrado é lista de arrependimentos.

## Indicadores

**A leitura é o registro.** Não existe catálogo a preencher antes de começar:
uma métrica passa a existir porque alguém gravou uma leitura dela. A identidade é
um identificador estável, e as propriedades (unidade, direção desejada,
definição) são os últimos valores informados ao longo da série.

**Nenhuma cadência é presumida.** O ideal é ler com frequência, mas existem
métricas que fecham no mês, que só existem uma vez, e que são binárias (um
projeto inteiro entregou ou não entregou). Todas são legítimas. O que não pode
faltar é **saber quanto tempo separa uma leitura da outra**, porque comparar
leituras distantes sem dizer isso é enganoso.

**A comparação não é sempre temporal.** Comparar duas coortes nomeadas (o
comportamento antigo contra o novo) é uma leitura válida.

**A meta é opcional**, e quando existe pode ser um valor ou uma regra (acima de,
abaixo de).

**O estado é uma frase de julgamento, não um sinal luminoso.** "Ruim e
melhorando" carrega o que nenhuma cor expressa. O julgamento fica **ao lado do
número visível**, nunca no lugar dele: julgamento com a evidência à vista é
leitura, julgamento sem ela é opinião fantasiada de medição.

### O bloco de indicadores é TABELA, e ela não se escreve à mão

Linhas de indicador, colunas de período, e a observação na última coluna. É assim
em toda a evidência, e é a única forma que mostra trajetória.

**Você não escreve essa tabela.** Ela é montada a partir das leituras que você
envia, congeladas na versão. Cada leitura leva o rótulo legível e, quando houver
julgamento, a observação. Uma frase em prosa com dois números dentro **não
substitui a tabela**: ela destrói a leitura, porque quem abre um indicador quer
ver a série, não uma afirmação sobre ela.

Prosa sobre indicador é bem-vinda **fora** do bloco, para explicar o que a tabela
não diz. É lá que o marcador vale.

**Definição que muda sem trocar o identificador é a corrupção real de uma
série.** Quando isso acontecer, sinalize; não bloqueie.

## Ação e decisão

Seis géneros, e o género determina o que o item precisa carregar:

| Género | O que é | Exige |
|---|---|---|
| Decisão que move o roadmap | mudança de rumo já tomada | o que sai e o que entra |
| Risco | algo que pode dar errado | o impacto, e quem resolve |
| Pergunta aberta | precisa de decisão de terceiro | **um destinatário nomeado** |
| Nota de método | ressalva sobre como um número foi apurado | qual indicador afeta |
| Dependência externa | espera por alguém de fora | prazo e quem |
| Próximo passo | o que vem a seguir | nada além do texto |

Pergunta sem destinatário nunca é respondida. Risco sem impacto é desabafo.
Decisão que não diz o que move não é rastreável na semana seguinte.

Há **duas naturezas** aqui, e confundi-las incha o documento: existe o **registro
corrido** (tudo o que foi decidido, acumulando) e o **recorte do ciclo** (o que
entra nesta versão). O one page mostra o recorte.

**O que escala é marcado explicitamente**, com destinatário. O resto é
informação.

## O elo entre one page e roadmap

O one page **não copia** o roadmap: ele mostra o corte enxuto e o que mudou.

Cada decisão que move o roadmap **nomeia a faixa que move**, pelo identificador
estável. Duas coisas caem de graça daí:

1. A história do roadmap se escreve sozinha: um item que mudou três vezes carrega
   o porquê de cada mudança.
2. O estacionamento passa a ter motivo registrado.

## Régua de qualidade

- O insight central existe e diz algo que a versão anterior não dizia.
- Todo número tem fonte, e a ressalva de método, quando existe, está visível.
- Nenhum número aparece sem que se possa dizer de onde veio.
- Métrica que não se moveu tem explicação, ou está declarada como não medida.
- Existe ao menos uma decisão, ou está declarado que não houve nenhuma.
- Toda pergunta tem destinatário.
- Todo item de roadmap tem identificador estável, e ele não mudou sem motivo.
- O documento cabe numa página quando impresso.

## Régua executável

O que a máquina vê, deixe rodando. O que ela não vê (se o argumento fecha, se o
insight é mesmo o essencial), mande a pessoa olhar, e nunca reporte como
conferido o que não foi.

```bash
# Nenhum dígito solto dentro do bloco de métricas: o valor entra por marcador,
# e quem substitui é o renderizador. Isso elimina a classe inteira de erro
# aritmético de um modelo de linguagem.
# Marcador esperado: {{identificador}} ou {{identificador.sufixo}}

# Todo marcador resolve contra uma leitura conhecida
grep -oE '\{\{[a-z0-9-]+' artefato.md | sort -u

# Identificador de item de roadmap ausente ou repetido
```

## Erros recorrentes

- **Tratar o one page como relatório.** Sintoma: seção de ação e decisão vazia
  semana após semana. O documento vira ruído e para de ser lido.
- **Redigitar o roadmap resumido.** Ele diverge do detalhado, e a divergência só
  aparece quando alguém decide com base no errado.
- **Deixar o modelo calcular.** Modelo de linguagem erra aritmética sobre número
  lido de contexto, esquece o valor anterior, e preenche um número plausível
  quando não tem o número. Ele deve **explicar** o número, nunca produzi-lo.
- **Semáforo no lugar do número.** Vira opinião com aparência de medição.
- **Apagar o que foi abandonado.** A decisão de largar é informação.
- **Encher o roadmap para parecer cheio.** A faixa "outros" existe justamente
  para não precisar disso.
- **Publicar sem ter o que dizer.** Semana sem novidade é resultado válido, e se
  declara.

## O contrato do dossiê

Esta é a peça que torna o método portável: **a skill não conhece a origem dos
dados, conhece este formato**. Quem devolver isto serve a mesma skill.

O dossiê é montado antes de o modelo escrever, e obedece a oito princípios, todos
com a mesma raiz (o modelo é bom em explicar e ruim em apurar):

1. **Toda aritmética já feita.** Diferenças, percentuais, dias decorridos.
2. **Todo vínculo já resolvido.** Nada de identificadores para casar.
3. **Direção semântica, não sinal.** "melhora" ou "piora", já cruzando o sinal
   com a direção desejada.
4. **Proveniência em todo número.** Fonte e momento da apuração.
5. **O que mudou desde a última publicação**, apurado, não deduzido.
6. **Lacunas declaradas.** Quem recebe buraco silencioso preenche o buraco. O
   dossiê **nomeia** o que falta, e é isso que permite recusar em vez de inventar.
7. **Orçamento de contexto.** Os primeiros N, contagens, e endereço para o detalhe.
8. **Zero prosa da origem.** Fato estruturado. A redação é do modelo, senão o que
   sai é paráfrase.

Blocos: identificação e período; publicação anterior; objetivos e metas; roadmap
publicado; movimento do período; indicadores com série e variação; decisões
abertas; destinatários possíveis; lacunas; endereços de detalhe.
