# rumbo-estrategia: plano de construção

> **Documento de planejamento, histórico.** O método vigente é `plugins/rumbo-core/metodo/estrategia.md`: a renúncia é só onde é essencial, sistemas são opcionais, e apostas e OKRs vivem no sistema da casa quando há um.

**Status:** plano, nada construído. Escrito em 2026-10-11 para guiar a construção da skill
de estratégia no `rumbo-core`.
**Escopo deste MVP:** sem servidor. O artefato é publicado como página, com o histórico de
versões embutido, igual ao destino sem servidor do one page. A origem que fala o contrato
(o ProductOps) entra na Fase 1 e não muda nada do que está aqui, exceto o que a seção 12
nomeia.
**Regra de autoria deste documento:** nenhum nome de cliente, pessoa ou ferramenta de
cliente. Ele pode morar neste repositório, que é público.

---

## 0. Em uma frase, e as decisões já tomadas

A skill `rumbo-estrategia` conduz a liderança pelas cinco escolhas da cascata Playing to
Win, pelas apostas que vão prová-las e pelos OKRs que as medem, e publica um **artefato de
estratégia** versionado: corpo livre, poucas alças estruturadas com identificador estável,
e uma revisão por conselho.

O que já está decidido, porque veio da evidência dos outros artefatos e do que o ProductOps
ensinou ao parar:

- **O método mora em um lugar só.** Cascata, apostas e OKR são um método, um arquivo, uma
  skill. Nada disso vai para código de servidor.
- **O modelo nunca pontua.** Não existe score de aspiração, nota de alinhamento nem
  veredito numérico. A régua é feita de perguntas que o modelo faz e de campos que a alça
  exige. Quem escolhe é a liderança; o modelo propõe e registra.
- **Toda escolha carrega fonte e renúncia.** Sem fonte não entra. Sem renúncia não é
  escolha, é platitude. Os dois campos são obrigatórios na alça, e a régua executável
  reprova a ausência.
- **A cascata tem relógio próprio.** Ela nasce com o ciclo e só é reaberta no conselho, e
  só a escolha que recebeu sinal. O one page semanal não a reescreve.
- **O que o modelo erra em silêncio fica em script.** Diff entre versões, idade de cada
  fonte, cobertura de escolha por aposta e KR, horizonte vencido de aposta: tudo isso é
  conta, e conta é do pré-processador, não do modelo.
- **Corpo livre, alças obrigatórias.** A forma livre é o que faz o artefato ser adotado e
  também o que deixa o usuário apagar a distinção que o método vende. A distinção mora nas
  alças, e a régua a defende.

---

## 1. O que é o artefato de estratégia, e o que não é

Um artefato de estratégia é **a estratégia de um ciclo numa página, com as escolhas, o que
elas renunciam, as apostas que vão prová-las, os resultados que as medem, e o julgamento de
quem conduz sobre o elo mais fraco**.

Ele carrega cinco escolhas encadeadas, no vocabulário de Playing to Win:

| Estágio | A pergunta | O que a alça exige além do texto |
|---|---|---|
| Aspiração | O que é vencer, aos olhos de quem compra? | renúncia e fonte |
| Onde jogar | Em que recorte de cliente, geografia, canal e produto? | renúncia e fonte, e a aspiração que serve |
| Como ganhar | Que vantagem de custo ou de valor faz vencer ali? | renúncia e fonte, e o onde jogar que serve |
| Capacidades | As poucas coisas que a empresa precisa fazer com perfeição | renúncia (a distração fatal) e fonte, e o como ganhar que serve |
| Sistemas | Os ritos e medidas que sustentam as capacidades | fonte, e a capacidade que serve |

Não é plano de negócios, não é deck de visão, não é lista de iniciativas, não é OKR solto.
A diferença aparece na renúncia: se nenhuma escolha diz o que a empresa deixa de fazer, o
que existe é um texto de missão.

Não é o one page. O one page é semanal e é do time; a estratégia é do ciclo e é da casa. O
one page aponta a estratégia; nunca a copia.

---

## 2. Para que serve: ritos e relógios

Três ritos consomem o artefato, e cada um lê uma coisa diferente:

1. **Nascimento do ciclo.** A liderança escreve a cascata, as apostas e os OKRs. É a
   única vez em que as cinco escolhas são conduzidas do zero. Produz a v1.
2. **Conselho mensal.** Lê o que mudou desde a última versão: apostas que morreram ou
   validaram, premissas refutadas, KRs fora de rota, escolhas com sinal contrário. Produz
   uma versão nova só se algo mudou. Semana sem mudança aponta a mesma versão de novo.
3. **Fechamento do trimestre.** Lê a cascata inteira contra o resultado: cada KR com
   baseline, meta e leitura final; cada aposta com desfecho; cada premissa com veredito. O
   ciclo seguinte nasce dessa nota, não de folha em branco.

Os relógios, para que um não puxe o outro:

| O que | Muda quando | Quem move |
|---|---|---|
| Cascata | nascimento do ciclo, e no conselho só a escolha com sinal | liderança |
| Apostas | conselho, e quando o critério de matar dispara | liderança com o builder |
| Definição de OKR | nascimento e fechamento do trimestre | liderança |
| Leitura de KR | semanal, pelo one page | quem conduz o produto |

A leitura de KR não é desta skill. Ela entra pelo one page, como hoje. Separar definição de
leitura é o que impede o KR de virar coluna que alguém sobrescreve.

---

## 3. As três camadas: o que vai onde

| Camada | Arquivo | Conteúdo |
|---|---|---|
| Método | `plugins/rumbo-core/metodo/estrategia.md` | as cinco escolhas, a régua por estágio, apostas, OKR, coerência, erros recorrentes, régua executável, checklist |
| Skill | `plugins/rumbo-core/skills/rumbo-estrategia/SKILL.md` | só o fluxo da conversa, no molde do one page |
| Binding | plugin do cliente, fora deste repositório | de onde vêm as fontes, para onde publica, vocabulário, quem senta no conselho |

Teste de pertencimento, o mesmo do CLAUDE.md: vale para todo cliente, é método; é como
conduzir a conversa, é skill; tem ID, nome de pessoa ou de ferramenta, é binding.

O material bruto do método já existe nos prompts do ProductOps (`prompts/*.txt` naquele
repositório). Eles viram régua de qualidade em prosa, na forma de perguntas. O que **não**
atravessa: o tom de personagem, a nota de 1 a 10, o veredito em uma frase e o JSON de
saída. A seção 5 faz essa tradução.

---

## 4. O envelope `estrategia`

Mesmo envelope dos outros artefatos. O que muda é o `kind`, as alças e dois campos de topo.

### 4.1 Campos de topo

| Campo | O que é |
|---|---|
| `time` | identificador da casa. No MVP a estratégia é da empresa inteira, não do squad |
| `kind` | `estrategia` |
| `year`, `quarter` | o trimestre em que esta versão foi publicada, o relógio da revisão |
| `ciclo` | `{ slug, rotulo, inicio, fim }`. O ciclo estratégico, anual ou semestral. No MVP é metadado; na Fase 1 resolve contra o ciclo cadastrado |
| `insight` | uma frase: o que mudou nesta revisão. Obrigatória para publicar |
| `meta.revisao` | `nascimento`, `conselho` ou `fechamento` |
| `meta.elo_mais_fraco` | slug da escolha ou aposta que o conselho considera o elo mais fraco. O corpo explica |
| `body_md` | prosa livre, sem tabela: o que mudou, por que o elo é o elo, o que o conselho decidiu olhar |
| `itens` | as alças, abaixo |
| `leituras` | vazio. Indicador é do one page |
| `canais` | vazio no MVP |

### 4.2 As alças

Seis tipos. Cada um existe porque outra coisa decide sobre ele: cobertura, diff, revisão.

**`escolha`** (uma linha da cascata)

```json
{
  "kind": "escolha",
  "slug": "cg-integracao-em-um-dia",
  "texto": "Ganhar pela integração com o sistema da loja em um dia, sem projeto",
  "payload": {
    "estagio": "como_ganhar",
    "serve": "oj-distribuidoras-regionais",
    "renuncia": "Não vender para quem exige integração sob medida, mesmo pagando mais",
    "fonte": "Ata do conselho de 2026-09-28",
    "estado": "vigente"
  }
}
```

- `estagio`: `aspiracao`, `onde_jogar`, `como_ganhar`, `capacidade` ou `sistema`.
- `serve`: slug da escolha de cima. Onde jogar serve a aspiração; como ganhar serve um
  onde jogar; capacidade serve um como ganhar; sistema serve uma capacidade. A aspiração
  não serve ninguém.
- `renuncia`: o que esta escolha deixa de fazer, que um concorrente faria. É o teste do
  oposto em forma de campo. Na capacidade, é a distração fatal: o que a empresa aceita
  fazer de forma mediana.
- `fonte`: documento, ata ou declaração, com nome e data. Procedência declarada: a
  liderança dizendo em voz alta é fonte legítima, e entra como "declaração de <papel>,
  <data>".
- `estado`: `vigente`, `revisada` (o texto mudou nesta versão) ou `abandonada`. Escolha
  abandonada **permanece visível, riscada**. A decisão de largar é a informação mais
  valiosa do ciclo.

Cardinalidade esperada: uma aspiração vigente; um ou mais onde jogar; um ou mais como
ganhar; de três a cinco capacidades; zero ou mais sistemas. Fora disso a régua avisa, não
reprova, exceto na publicação sem aspiração, onde jogar ou como ganhar.

**`aposta`** (o que vai provar uma escolha neste ciclo)

```json
{
  "kind": "aposta",
  "slug": "ap-pedido-por-foto",
  "texto": "Pedido por foto do bloco de papel",
  "payload": {
    "serve": "cap-onboarding-sem-gente",
    "problema": "Loja pequena não digita pedido; o vendedor digita por ela e o erro volta como devolução",
    "hipotese": "Se a loja mandar a foto do pedido e a plataforma pré-preencher, então 60% dos pedidos dessas lojas entram sem o vendedor, porque a barreira é digitação e não confiança",
    "indicador": "Percentual de pedidos das lojas da coorte entrando sem toque do vendedor",
    "criterio_matar": "Abaixo de 30% em 2026-12-15 com ao menos 40 lojas na coorte",
    "horizonte": "2026-12-31",
    "quadrante": "operacao_qualidade",
    "estado": "ativa"
  }
}
```

- `serve`: slug de uma escolha. Aposta que não serve escolha nenhuma é iniciativa, e vai
  para o roadmap, não para cá.
- `hipotese`: na forma "se, então, porque". O "porque" é o mecanismo causal, e é o que a
  régua em prosa cobra.
- `indicador`: o que prova, com unidade. Vira leitura no one page quando a aposta roda.
- `criterio_matar`: o que, até quando, mata a aposta. Sem ele a aposta nunca morre, e vira
  linha permanente de roadmap.
- `quadrante`: opcional. `expansao_mercado`, `apostas_risco`, `operacao_qualidade` ou
  `diferenciacao_valor`, com a definição que está na seção 5.7. RICE fica fora do MVP;
  quem quiser escreve no payload e a régua ignora.
- `estado`: `proposta`, `ativa`, `validada`, `morta` ou `concluida`. Morta permanece
  visível, riscada, com o motivo no corpo.

**`okr`** (um objetivo)

```json
{
  "kind": "okr",
  "slug": "okr-base-que-paga",
  "texto": "A base de lojas passa a pagar pelo que usa",
  "payload": { "serve": "cg-integracao-em-um-dia", "estado": "ativo" }
}
```

- `serve`: slug de escolha ou de aposta.
- O objetivo é frase, não número. O número mora no KR.

**`kr`** (um resultado-chave do objetivo)

```json
{
  "kind": "kr",
  "slug": "kr-ativacoes-mes",
  "texto": "Lojas ativadas por mês sobem de 120 para 200",
  "payload": {
    "objetivo": "okr-base-que-paga",
    "baseline": "120",
    "meta": "200",
    "unidade": "lojas/mês",
    "direcao": "sobe",
    "leitura": "ativacoes-mes",
    "prazo": "2026-12-31",
    "estado": "ativo"
  }
}
```

- `objetivo`: slug do `okr` pai.
- `baseline`, `meta`, `unidade`, `direcao`: obrigatórios. `direcao` é `sobe`, `desce` ou
  `binario`. KR binário tem baseline "não" e meta "sim".
- `leitura`: slug da leitura que o one page envia para este KR. Opcional na v1; sem ele, o
  briefing diz "KR sem leitura ligada".
- O texto do KR é outcome, nunca entrega. A régua em prosa da seção 5.8 diz como separar.

**`premissa`** (o que tem de ser verdade)

```json
{
  "kind": "premissa",
  "slug": "prem-industria-paga-por-loja",
  "texto": "A indústria paga por loja ativa a partir de 2 mil lojas na base",
  "payload": {
    "sobre": "cg-integracao-em-um-dia",
    "teste": "Duas propostas de indústria com preço por loja aceitas até 2026-11-30",
    "prazo": "2026-11-30",
    "estado": "aberta"
  }
}
```

- `sobre`: slug de escolha ou aposta.
- `teste`: como se verifica, com data. Premissa sem teste é esperança.
- `estado`: `aberta`, `confirmada` ou `refutada`. Refutada é o sinal mais forte para
  reabrir a escolha no conselho.

**`decisao`**: a mesma alça do one page, com os seis gêneros e as mesmas exigências
(pergunta com destinatário, risco com impacto, decisão de roadmap dizendo o que move).
Aqui `afeta_roadmap_slug` pode apontar uma escolha ou uma aposta, e por isso o nome
genérico do campo na Fase 1 deve virar `afeta`. No MVP, manter o nome atual para a régua do
one page continuar valendo.

### 4.3 Estados, supersede e o que a versão congela

- Versão publicada é imutável. Mudou, publica outra.
- Escolha e aposta que saem permanecem riscadas por uma versão inteira, e só depois podem
  ser omitidas. Apagar na mesma revisão em que se decide largar esconde a decisão.
- Cada versão congela a cascata completa, não só o diff. O diff é calculado pelo
  pré-processador na revisão seguinte, por slug.
- O `slug` é o handle. Texto muda de redação sem mudar de slug. Slug que muda é item novo,
  e o histórico se perde: a régua avisa quando um slug da versão anterior some sem estado
  `abandonada` ou `morta`.

### 4.4 Ligação com o one page

O item `okr` do one page hoje é "objetivo em destaque, com atual e meta". Com uma
estratégia publicada, ele ganha um ponteiro:

```json
{ "kind": "okr", "slug": "kr-ativacoes-mes", "texto": "Lojas ativadas por mês sobem de 120 para 200",
  "payload": { "kr": "kr-ativacoes-mes", "atual": "151", "meta": "200", "baseline": "120", "progressoPct": 39 } }
```

- `payload.kr` aponta o slug do KR na estratégia. Sem estratégia publicada, o item segue
  como hoje, e nada quebra.
- A faixa do roadmap, que já tem o campo `aposta` em texto livre, passa a aceitar
  `payload.aposta` com o slug da aposta. Texto livre continua válido para casa sem
  estratégia publicada.
- Essas duas mudanças são no método do one page, em duas linhas, e na régua do one page
  entram só como aviso: "item okr sem ponteiro para KR, e existe estratégia publicada".

É por esses ponteiros que a Fase 3 do plano maior (cobertura, órfãos, deriva,
envelhecimento) sai de graça, por consulta de slug.

### 4.5 Exemplo completo

Casa fictícia: uma plataforma de pedidos para distribuidoras regionais de bebidas. Tudo
inventado. Copie a forma, não os valores. Este arquivo vira
`scripts/exemplo-envelope-estrategia.json`, com os campos `_leia` como no exemplo do one
page.

```json
{
  "time": "distribuidora-exemplo",
  "kind": "estrategia",
  "year": 2026,
  "quarter": 4,
  "ciclo": { "slug": "2026-h2", "rotulo": "2º semestre de 2026", "inicio": "2026-07-01", "fim": "2026-12-31" },
  "insight": "A aposta do pedido por foto virou o caminho da capacidade de onboarding, e a integração sob medida saiu de vez do onde jogar.",
  "meta": { "revisao": "conselho", "elo_mais_fraco": "cap-onboarding-sem-gente" },
  "body_md": "## O que mudou\n\nO conselho confirmou a renúncia à integração sob medida depois de perder duas contas grandes que a pediam. A capacidade de onboarding sem gente ganhou a aposta do pedido por foto como caminho.\n\n## O elo mais fraco\n\nOnboarding sem gente é a capacidade que sustenta o como ganhar e é a que menos existe hoje: cada ativação leva uma hora e meia de vendedor.\n",
  "itens": [
    { "kind": "escolha", "slug": "asp-dono-decide-sem-planilha", "texto": "O dono da loja pequena decide o que comprar sem planilha e sem vendedor na linha",
      "payload": { "estagio": "aspiracao", "renuncia": "Não servir a rede grande que compra por licitação interna", "fonte": "Declaração do CEO, conselho de 2026-07-06", "estado": "vigente" } },
    { "kind": "escolha", "slug": "oj-distribuidoras-regionais", "texto": "Distribuidoras regionais de bebidas com até 300 lojas atendidas, no Sudeste, vendendo pelo app da distribuidora",
      "payload": { "estagio": "onde_jogar", "serve": "asp-dono-decide-sem-planilha", "renuncia": "Fora: atacado nacional, marketplace próprio e integração sob medida", "fonte": "Ata do conselho de 2026-09-28", "estado": "revisada" } },
    { "kind": "escolha", "slug": "cg-integracao-em-um-dia", "texto": "Ganhar pela integração com o sistema da loja em um dia, sem projeto",
      "payload": { "estagio": "como_ganhar", "serve": "oj-distribuidoras-regionais", "renuncia": "Não vender para quem exige integração sob medida, mesmo pagando mais", "fonte": "Ata do conselho de 2026-09-28", "estado": "vigente" } },
    { "kind": "escolha", "slug": "cap-onboarding-sem-gente", "texto": "Ativar uma loja em 30 minutos sem vendedor",
      "payload": { "estagio": "capacidade", "serve": "cg-integracao-em-um-dia", "renuncia": "Ser mediano em relatório gerencial para a distribuidora", "fonte": "Comitê de produto de 2026-10-02", "estado": "vigente" } },
    { "kind": "escolha", "slug": "cap-catalogo-sincronizado", "texto": "Catálogo e preço sincronizados com o sistema da loja todo dia",
      "payload": { "estagio": "capacidade", "serve": "cg-integracao-em-um-dia", "renuncia": "Não manter catálogo editado à mão para ninguém", "fonte": "Comitê de produto de 2026-10-02", "estado": "vigente" } },
    { "kind": "escolha", "slug": "cap-cobranca-sem-boleto", "texto": "Cobrar na própria plataforma, sem boleto nem conferência manual",
      "payload": { "estagio": "capacidade", "serve": "cg-integracao-em-um-dia", "renuncia": "Não operar cobrança para quem fatura fora da plataforma", "fonte": "Comitê de produto de 2026-10-02", "estado": "vigente" } },
    { "kind": "escolha", "slug": "sis-comite-quinzenal", "texto": "Comitê quinzenal de roadmap e OKR com a liderança comercial",
      "payload": { "estagio": "sistema", "serve": "cap-onboarding-sem-gente", "fonte": "Ata do conselho de 2026-09-28", "estado": "vigente" } },
    { "kind": "aposta", "slug": "ap-pedido-por-foto", "texto": "Pedido por foto do bloco de papel",
      "payload": { "serve": "cap-onboarding-sem-gente", "problema": "Loja pequena não digita pedido; o vendedor digita por ela e o erro volta como devolução", "hipotese": "Se a loja mandar a foto do pedido e a plataforma pré-preencher, então 60% dos pedidos dessas lojas entram sem o vendedor, porque a barreira é digitação e não confiança", "indicador": "Percentual de pedidos das lojas da coorte entrando sem toque do vendedor", "criterio_matar": "Abaixo de 30% em 2026-12-15 com ao menos 40 lojas na coorte", "horizonte": "2026-12-31", "quadrante": "operacao_qualidade", "estado": "ativa" } },
    { "kind": "aposta", "slug": "ap-plano-plus", "texto": "Plano pago com sortimento sugerido",
      "payload": { "serve": "cap-catalogo-sincronizado", "problema": "A loja compra o que sempre comprou e perde margem em categoria que não conhece", "hipotese": "Se a plataforma sugerir sortimento a partir do giro de lojas parecidas, então 20% das lojas pagam o plano, porque o ganho de margem é maior que a mensalidade", "indicador": "Lojas pagantes do plano sobre lojas ativas", "criterio_matar": "Abaixo de 8% de conversão em 2026-12-15", "horizonte": "2027-03-31", "quadrante": "diferenciacao_valor", "estado": "proposta" } },
    { "kind": "okr", "slug": "okr-base-que-paga", "texto": "A base de lojas passa a pagar pelo que usa",
      "payload": { "serve": "cg-integracao-em-um-dia", "estado": "ativo" } },
    { "kind": "kr", "slug": "kr-ativacoes-mes", "texto": "Lojas ativadas por mês sobem de 120 para 200",
      "payload": { "objetivo": "okr-base-que-paga", "baseline": "120", "meta": "200", "unidade": "lojas/mês", "direcao": "sobe", "leitura": "ativacoes-mes", "prazo": "2026-12-31", "estado": "ativo" } },
    { "kind": "kr", "slug": "kr-churn-cotacao", "texto": "Cancelamento mensal de lojas cai de 6% para 3%",
      "payload": { "objetivo": "okr-base-que-paga", "baseline": "6%", "meta": "3%", "unidade": "percent", "direcao": "desce", "leitura": "churn-mensal", "prazo": "2026-12-31", "estado": "ativo" } },
    { "kind": "premissa", "slug": "prem-industria-paga-por-loja", "texto": "A indústria paga por loja ativa a partir de 2 mil lojas na base",
      "payload": { "sobre": "cg-integracao-em-um-dia", "teste": "Duas propostas de indústria com preço por loja aceitas até 2026-11-30", "prazo": "2026-11-30", "estado": "aberta" } },
    { "kind": "decisao", "slug": "quem-arbitra-preco-do-plus", "texto": "Quem arbitra o preço do plano pago quando o comercial fecha abaixo da tabela?", "genero": "pergunta", "escala_para": ["ceo"] },
    { "kind": "decisao", "slug": "onboarding-fora-do-sprint", "texto": "O onboarding em 30 minutos está desenhado e fora do sprint", "genero": "risco",
      "payload": { "impacto": "Sem ele o KR de ativações não tem como dobrar sem contratar", "quem_resolve": "liderança de produto, no comitê de 2026-10-16" } }
  ],
  "leituras": [],
  "canais": []
}
```

---

## 5. O método: a régua por escolha, em perguntas

Princípio que rege a seção inteira: **o modelo pergunta, a liderança escolhe, o modelo
registra**. Nenhuma pergunta vira nota. Onde a resposta for fraca, o modelo diz por que
considera fraca e devolve a pergunta, no máximo duas vezes por escolha. Na terceira, registra
a escolha como está, com uma `decisao` de gênero `nota_metodo` apontando a fraqueza. Recusar
de saída transforma a ferramenta em obstáculo, e já transformou no one page.

### 5.1 Aspiração

- **Teste do oposto.** Se o contrário da frase for absurdo, ninguém escolheu nada. O
  campo `renuncia` existe para forçar o contrário possível: um concorrente faria o oposto?
- **Cliente antes de dinheiro.** Faturamento, participação e retorno são prêmio. A
  aspiração é sobre quem compra. Pergunta: quem é a pessoa, e o que muda na vida dela?
- **Valor na vida, não no produto.** Não é "o melhor app"; é o que o app faz pela pessoa.
- **Vencer, não participar.** "Manter posição" e "ser uma opção" não são aspiração.
- **Pragmatismo.** Vitória funcional vale: velocidade e conveniência num mercado travado
  são aspiração letal. Não exija transformação de espírito.

### 5.2 Onde jogar

- **A arte do não.** Onde jogar é o que se ignora. Recortes exigidos: cliente, geografia,
  canal, produto. "Brasil" e "todos os pacientes" são preguiça.
- **Teste da dor.** A renúncia precisa deixar dinheiro óbvio na mesa. Se não doeu, não foi
  escolha. Pergunta: que mercado grande ficou de fora, e quanto ele vale?
- **Amarração.** O terreno é onde a aspiração consegue virar verdade. Se a aspiração fala
  de um cliente e o onde jogar de outro, um dos dois está errado.

### 5.3 Como ganhar

- **Teste da vantagem.** Custo estrutural ou diferenciação de valor. "Fazer melhor o que
  todos fazem" não é vantagem.
- **Ilusão das melhores práticas.** Qualidade, atendimento e excelência são obrigação, não
  estratégia.
- **Teste da imitação.** Um concorrente com dinheiro copia em seis meses? Então não há
  vantagem. Pergunta: o que você faz nos bastidores que torna caro para ele copiar?
- **Amarração.** A vantagem precisa valer no terreno escolhido.

### 5.4 Capacidades

- **Capacidade não é departamento.** "Atendimento" é área; "resolver barreira de acesso em
  dez minutos" é capacidade. Frase curta, verbo e medida.
- **Filtro da vantagem.** Cada capacidade é motor exato do como ganhar. Capacidade que não
  serve a um como ganhar sai, ou o como ganhar está incompleto.
- **Mediocridade intencional.** Para ser excepcional em três coisas, a empresa aceita ser
  mediana no resto. A renúncia da capacidade é a distração fatal: a atividade clássica do
  setor que ela decide não dominar.
- Entre três e cinco. Acima disso, nenhuma é prioridade.

### 5.5 Sistemas

- Os ritos, medidas e regras que mantêm a capacidade viva: conselho, comitê, one page,
  gate de entrega, métrica que alguém lê toda semana.
- Sistema serve uma capacidade. Sistema que não sustenta capacidade nenhuma é burocracia.
- No MVP esta é a lista mais curta, e pode ficar vazia com aviso. O método Rumbo já define
  os ritos por camada; a casa registra aqui os que adotou.

### 5.6 Coerência: o elo mais fraco e o que tem de ser verdade

- **Cadeia inteira.** Onde jogar sustenta a aspiração; como ganhar é o caminho lógico no
  terreno; capacidades viabilizam o como ganhar; sistemas sustentam as capacidades. A
  skill percorre a cadeia de cima para baixo e nomeia onde ela quebra.
- **Elo mais fraco.** Toda versão nomeia um, em `meta.elo_mais_fraco`, e o corpo explica.
  Versão sem elo mais fraco é versão que não foi lida.
- **O que tem de ser verdade.** Duas a quatro premissas testáveis, cada uma com teste e
  data. Elas são as alças `premissa`. Premissa refutada é o gatilho de reabertura da escolha
  no conselho.
- **Tensão e oportunidade por estágio.** A matriz que o ProductOps gerava por LLM vira
  pergunta de condução: para cada estágio, o que está em tensão com a realidade observada,
  e qual ação concreta destravaria? A resposta entra como `decisao` com gênero, não como
  matriz.

### 5.7 Apostas

- **Coerência com a cascata.** A aposta reforça uma escolha nomeada. Sem `serve` válido, é
  roadmap.
- **Mecanismo causal.** A hipótese explica como a ação gera o resultado. O "porque" é
  obrigatório na forma e cobrado na substância.
- **Mensurabilidade.** Indicador específico, auditável, com unidade.
- **Critério de matar.** O que, até quando, mata. Aposta sem critério de matar não é
  aposta, é compromisso disfarçado.
- **Quadrante**, quando usado, com a regra de ouro: a empresa já tem a expertise de
  produto **e** a de mercado para entregar com previsibilidade? Sim a ambas, expansão de
  mercado. Não a qualquer uma, aposta de risco. O cliente ser o mesmo não basta.
  - `expansao_mercado`: avanço previsível em mercado dominado, produto próximo do que já
    se sabe fazer e vender.
  - `apostas_risco`: a expertise de produto ou de mercado dá um salto.
  - `operacao_qualidade`: proteger e otimizar a base, sem receita nova direta.
  - `diferenciacao_valor`: aprofundar o valor percebido para reter e aumentar o LTV.

### 5.8 OKR

- **Outcome, não output.** O KR responde "o que muda?", nunca "o que fazemos?". "Lançar o
  app" é entrega; "cinco mil lojas ativas no primeiro mês" é resultado.
- **Mensurável.** Número, percentual ou binário. Baseline, meta, unidade e direção são
  campos, não prosa.
- **Resultado, não esforço.** "Cinquenta horas de pesquisa" é esforço; "três hipóteses
  validadas" é resultado.
- **Ambíguo se mistura.** "Lançar X e atingir Y" separa em entrega no roadmap e KR com o
  Y.
- **Ligação.** Objetivo serve escolha ou aposta. Objetivo que não serve nada é desejo.
- **Hierarquia.** No MVP a estratégia é da casa. OKR de squad vive no one page do squad e
  aponta o KR da casa por `payload.kr`. Desdobramento por squad dentro do artefato de
  estratégia fica para depois.

---

## 6. Entradas mínimas e procedência

Se falta alguma, a skill pergunta. Nunca inventa.

- O ciclo: datas de início e fim, e se esta é a v1 ou uma revisão.
- A versão anterior, quando existir, extraída da página publicada.
- O contexto da casa em prosa: o que vende, para quem, como ganha dinheiro. Vem do
  `perfil.md` do binding ou da conversa.
- As fontes: documentos, atas e declarações que sustentam as escolhas, nomeados com data.
  Formato em `scripts/exemplo-fontes.json`. O modelo pode ter lido o documento inteiro na
  conversa; o que entra no envelope é o nome e a data, nunca o resumo que o modelo fez.
- A liderança disponível para responder. Sem ela, a skill produz as perguntas e para.
- Os KRs vigentes e a última leitura de cada um, do one page, quando houver.

Procedência: a mesma regra do one page. A liderança é fonte legítima; a declaração dela
entra como fonte com data. O que não entra: escolha que ninguém declarou, premissa que o
modelo deduziu, número que ninguém informou.

---

## 7. O fluxo da skill

Mapa de etapas, no mesmo molde do `estado.mjs` do one page. `para` é etapa que espera
resposta de quem conduz.

| id | fase | etapa | para |
|---|---|---|---|
| `base` | Preparar | de onde parte esta revisão: anterior ou branco | sim |
| `contexto` | Preparar | briefing: diff, idade das fontes, cobertura, horizontes vencidos | não |
| `lacunas` | Preparar | o que o briefing não sabe, em perguntas | sim |
| `cascata` | Montar | as cinco escolhas, uma por vez, com renúncia e fonte | sim |
| `apostas` | Montar | o que vai provar as escolhas neste ciclo | sim |
| `okrs` | Montar | objetivos e KRs, outcome com número | sim |
| `premissas` | Montar | o que tem de ser verdade, e o elo mais fraco | sim |
| `escrita` | Montar | o corpo: o que mudou | sim |
| `insight` | Montar | a frase da revisão | sim |
| `conferir` | Fechar | mostrar o rascunho e esperar | sim |
| `validar` | Fechar | a régua executável | não |
| `publicar` | Fechar | render e publicação na mesma URL | sim |
| `comunicar` | Comunicar | destinatários das perguntas e a mensagem sugerida | sim |
| `binding` | Comunicar | o que o binding acrescenta | sim, salta se vazio |

Duas regras do fluxo que o one page não tem:

- **Nascimento conduz as cinco; revisão reabre só o que tem sinal.** Em `--branco`, a
  etapa `cascata` percorre os cinco estágios de cima para baixo. Em revisão, o briefing lista
  as escolhas com sinal (premissa refutada, aposta morta, KR fora de rota, fonte velha) e a
  skill pergunta só sobre elas. Reescrever a cascata inteira a cada conselho é o erro que
  transforma estratégia em ata.
- **Uma escolha por vez, de cima para baixo.** A skill não pede a cascata inteira de uma
  vez. Pergunta a aspiração, registra, passa ao onde jogar já amarrando à aspiração
  registrada. É o que faz a amarração existir no artefato em vez de na cabeça de quem
  responde.

O que não se herda de `--anterior`: o insight, o `meta.elo_mais_fraco` e os
`escala_para` das perguntas. Herdam-se as escolhas, apostas, OKRs e premissas com estado,
que é o que a revisão vai confrontar.

---

## 8. Scripts: o que roda

Todos sem dependência além do `node`. Caminhos a partir de `skills/rumbo-estrategia/scripts/`.

| Script | Faz | Não faz |
|---|---|---|
| `estado.mjs` | mapa de etapas e onde parou, por casa | decidir etapa por conta |
| `contexto.mjs` | lê anterior, fontes e one page; apura diff, idades, cobertura; escreve o briefing em markdown | ler ferramenta externa; julgar |
| `validar.sh` | a régua executável da seção 9 | avaliar substância |
| `render.mjs` | envelope entra, página versionada sai, com histórico embutido | publicar |
| `exemplo-envelope-estrategia.json` | a documentação real do formato | |
| `exemplo-fontes.json` | o formato das fontes normalizadas | |

### 8.1 O briefing que `contexto.mjs` produz

O modelo lê o briefing, nunca os JSON. Seções, nesta ordem:

1. **Ciclo e revisão.** Datas, versão anterior, dias desde a última publicação.
2. **Estado da cascata.** Por estágio: escolha vigente, fonte, idade da fonte em dias,
   renúncia. Escolha com fonte mais velha que N dias (sugestão: 120) marcada "a
   reconfirmar".
3. **Apostas.** Estado, dias até o horizonte ou dias vencidos, indicador com ou sem leitura
   ligada, critério de matar com data passada e estado ainda `ativa`.
4. **OKRs e KRs.** Baseline, meta, última leitura e variação, vindas do one page quando
   houver `--one-page`. KR sem leitura há mais de duas semanas marcado.
5. **Premissas.** Abertas, vencidas, refutadas.
6. **Cobertura.** Escolha sem aposta nem KR que a sirva. Aposta ou objetivo com `serve`
   apontando slug que não existe. Capacidade sem sistema.
7. **O que sumiu.** Slug da versão anterior ausente na atual sem estado de saída.
8. **Lacunas.** As perguntas que o modelo deve fazer antes de escrever.
9. **Fontes disponíveis e não citadas.** Da lista de fontes, o que nenhuma escolha usa.

### 8.2 `exemplo-fontes.json`

```json
{
  "_leia": "Fontes normalizadas que sustentam as escolhas. O modelo pode ter lido o documento inteiro; aqui entra o nome, a data e o tipo. Escolha cita a fonte por 'rotulo'.",
  "fontes": [
    { "id": "f-1", "rotulo": "Ata do conselho de 2026-09-28", "tipo": "ata", "data": "2026-09-28" },
    { "id": "f-2", "rotulo": "Declaração do CEO, conselho de 2026-07-06", "tipo": "declaracao", "data": "2026-07-06" },
    { "id": "f-3", "rotulo": "Pesquisa com 12 lojas, 2026-08", "tipo": "pesquisa", "data": "2026-08-15" }
  ]
}
```

### 8.3 Uso

```bash
node estado.mjs --time <casa>
node base.mjs --time <casa> [--branco | --de .rumbo/anterior-estrategia.json]
node contexto.mjs --anterior .rumbo/anterior-estrategia.json --fontes fontes.json \
  [--one-page .rumbo/anterior.json] [--ciclo 2026-h2]
bash validar.sh envelope-estrategia.json
node render.mjs --estrategia envelope-estrategia.json --anterior .rumbo/anterior-estrategia.json \
  --saida .rumbo/estrategia.html
```

`base.mjs` do one page pode ser parametrizado por `kind` em vez de duplicado; decidir na
construção. O que ele não herda muda: aqui somem insight, elo mais fraco e `escala_para`.

---

## 9. Régua executável

O que `validar.sh` reprova:

- JSON inválido; `kind` diferente de `estrategia`.
- Slug ausente, fora do formato ou duplicado; texto vazio.
- `escolha` sem `estagio` válido, sem `renuncia` ou sem `fonte`.
- `escolha` de estágio abaixo da aspiração sem `serve`, ou com `serve` apontando slug
  inexistente ou de estágio errado (onde jogar só serve aspiração, e assim por diante).
- `aposta` sem `serve` válido, sem `hipotese`, sem `indicador`, sem `criterio_matar` ou sem
  `horizonte`.
- `okr` sem `serve` válido.
- `kr` sem `objetivo` válido, ou sem qualquer um de `baseline`, `meta`, `unidade`,
  `direcao`; `direcao` fora de `sobe`, `desce`, `binario`.
- `premissa` sem `sobre` válido ou sem `teste`.
- `decisao` com as mesmas regras do one page: gênero válido, pergunta com destinatário,
  risco com impacto.
- Publicação (`status: published`) sem insight, sem `meta.elo_mais_fraco` apontando slug
  existente, ou sem ao menos uma escolha vigente em aspiração, onde jogar e como ganhar.
- Tabela markdown no corpo.
- Regras da casa: travessão, pontuação em série, vocabulário proibido.

O que só avisa:

- Capacidades vigentes fora do intervalo de três a cinco.
- Nenhum sistema.
- Menos de duas ou mais de quatro premissas abertas.
- `quadrante` presente com valor fora da lista.
- Slug da versão anterior ausente sem estado de saída (precisa de `--anterior`).
- Hipótese sem a palavra "porque". Aviso, não reprovação: a régua em prosa decide.

O que a máquina não vê, e a skill manda a pessoa olhar, nomeando: se a renúncia dói de
verdade, se o como ganhar sobrevive ao teste da imitação, se o KR é outcome, se o elo mais
fraco é mesmo o mais fraco.

---

## 10. Render: a página de estratégia

Página própria por casa, com o mesmo esqueleto do one page: título estável
("Estratégia <casa>"), seletor de versão, duas abas, histórico embutido em
`<script type="application/json" id="rumbo-envelopes">` na trilha `estrategia`, com
`atual` e `historico`.

**Aba Cascata.**
- Insight no topo, como manchete.
- As cinco escolhas empilhadas, de cima para baixo, cada uma com o texto grande, a renúncia
  em linha menor, a fonte e o estado. Revisada ganha marca "revisada na v<N>"; abandonada
  sai riscada. O elo mais fraco ganha o destaque que o one page dá ao risco.
- Premissas como lista com teste, prazo e estado. Estado nunca só por cor: forma e palavra.
- Painel lateral de ação e decisão, igual ao one page.
- Corpo em prosa depois dos blocos.

**Aba Apostas e resultados.**
- Apostas agrupadas pela escolha que servem: título, hipótese, indicador, critério de
  matar, horizonte, quadrante como pílula, estado. Morta sai riscada com o motivo.
- Objetivos com seus KRs: baseline, meta, direção, e a última leitura quando o render
  receber `--one-page` com a trilha do one page. Sem leitura, a célula diz "sem leitura",
  nunca fica vazia.

**O que o render herda do one page sem reescrever:** escape, markdown mínimo, bloco de
marca, fontes do Google, tema da casa, seletor de versão, aviso de versão antiga. Esses
pedaços hoje vivem dentro de `rumbo-one-page/scripts/render.mjs`. Pela regra do repositório,
o que serve mais de uma skill sobe para `plugins/rumbo-core/scripts/`. A construção começa
por essa extração, ou aceita a duplicação consciente no MVP e registra a dívida. Decisão na
seção 15.

**Nunca renderize sem `--anterior` quando já existe versão publicada.** É a regra que o one
page aprendeu com uma v1 recarimbada. Republicação recupera a URL e publica nela.

Casa com um time só pode preferir uma aba Estratégia dentro do artifact do one page, como
a trilha de conselho que um binding já tem. Fica fora do MVP; a página própria serve às duas.

---

## 11. Arquivos a criar e a tocar

Criar:

```
plugins/rumbo-core/
  metodo/estrategia.md
  skills/rumbo-estrategia/
    SKILL.md
    scripts/
      estado.mjs
      contexto.mjs
      validar.sh
      render.mjs
      modelo.html
      exemplo-envelope-estrategia.json
      exemplo-fontes.json
```

Tocar:

- `metodo/one-page.md`: item `okr` aceita `payload.kr`; faixa do roadmap aceita
  `payload.aposta` como slug. Duas linhas cada.
- `skills/rumbo-one-page/scripts/validar.sh`: aviso, não reprovação, para item `okr` sem
  ponteiro quando `--estrategia` for passado. Opcional no MVP.
- `skills/rumbo-one-page/scripts/base.mjs`: parametrizar por `kind`, ou copiar. Decisão.
- `plugins/rumbo-core/scripts/`: o que for extraído do render.
- `.claude-plugin/plugin.json`: versão 0.8.0, descrição e keywords ganham estratégia.
- `README.md`: a tabela das skills ganha a quinta linha.
- `CLAUDE.md`: "Como rodar" ganha os comandos da seção 8.3.
- `templates/plugin-cliente/skills/`: nada. A derivada de estratégia de um cliente usa o
  mesmo contrato de cinco seções.

A `description` do SKILL.md é gatilho, não resumo. Palavras que a pessoa digita: "estratégia
do ciclo", "cascata", "playing to win", "aspiração", "onde jogar", "como ganhar",
"apostas do trimestre", "define os OKRs", "revisão estratégica", "pauta do conselho",
"fecha o trimestre", e colar uma ata de conselho pedindo para virar estratégia.

---

## 12. Fora do MVP, e o que muda na Fase 1

Fora, de propósito:

- Origem que fala o contrato: `contexto.mjs` com API e `publicar.mjs`.
- Estratégia por squad e desdobramento hierárquico de OKR dentro do artefato.
- RICE, score, veredito, nota de alinhamento.
- Sinal de mercado como fonte automática. Entra, se entrar, como fonte nomeada.
- Diagnóstico de entrada e linha de base. É outro artefato, depois.
- Comunicação por canal. A publicação é o link; perguntas continuam exigindo destinatário.
- Leitura de documento inteiro pelo script. Quem lê documento é o modelo na conversa; o
  script recebe a lista de fontes normalizada.

O que muda quando a origem existir, e só isso:

- `contexto.mjs` passa a buscar o dossiê na API, no contrato 1.1, em vez de montar dos
  arquivos. O briefing é o mesmo.
- `publicar.mjs` envia o envelope; a origem atribui a versão e recusa na porta com as mesmas
  regras do `validar.sh`.
- O `ciclo` resolve contra o ciclo cadastrado; `time` resolve contra a casa.
- O enum de alças da origem ganha `escolha`, `aposta`, `kr`, `premissa`. O campo
  `afeta_roadmap_slug` vira `afeta`.
- Nada muda no método, no SKILL.md, no envelope nem na régua. Se mudar, o contrato está
  errado.

---

## 13. Critério de pronto e teste de adoção

Pronto quando:

- `validar.sh` aprova o exemplo e reprova cada violação da seção 9, uma por vez, em teste de
  fumaça escrito no `CLAUDE.md`.
- `render.mjs` produz a página do exemplo com duas versões, a v1 intacta sob a v2, e o
  seletor funcionando.
- Uma casa real publica a v1 a partir de uma conversa de nascimento ou de uma ata existente,
  em menos de duas horas de condução.

Adoção, com a régua que o córtex da casa já usa:

- A v1 pauta o rito seguinte (conselho ou kick-off) sem o autor da skill na sala.
- Em três semanas, alguém que não é o autor reabre a v2.
- O one page daquela casa passa a apontar `payload.kr` em ao menos um objetivo.
- A versão do cliente preserva renúncia, critério de matar e premissas. Se a primeira coisa
  que some for a renúncia, a forma livre ganhou da alça, e a régua precisa endurecer.

Se em três semanas nenhuma casa reabrir a v2, a Fase 1 não acontece.

---

## 14. Erros previsíveis

- **A forma livre apaga a distinção.** Já aconteceu no one page: riscos sumiram, metas se
  misturaram a indicadores. Por isso renúncia, fonte, critério de matar e teste são campos
  obrigatórios, e não prosa.
- **Recusar demais.** A liderança declarando é fonte. Perguntar, registrar, e só depois
  recusar.
- **O modelo escrevendo a aspiração.** O texto da escolha é da liderança. O modelo
  pergunta, devolve a fraqueza, sugere no máximo duas reescritas e registra o que a pessoa
  escolheu.
- **Cascata reescrita toda semana.** Relógio do conselho; revisão reabre só o que tem
  sinal.
- **Aposta que vira linha permanente.** Critério de matar com data, e o briefing cobrando
  o vencido.
- **Documento longo.** A cascata cabe numa tela; apostas e OKRs em outra. Se não cabe, há
  escolha demais ou prosa demais.
- **Casa com vários squads tentando pôr tudo num artefato.** No MVP a estratégia é da casa;
  o que é do squad vai para o one page dele, apontando o KR.
- **Confundir estratégia com diagnóstico.** O diagnóstico mede a casa contra a linha de
  base; a estratégia declara escolhas. São artefatos distintos, com relógios distintos.

---

## 15. Decisões a ratificar antes de construir

1. **`kr` como alça própria, separada de `okr`.** Alternativa: KRs aninhados no payload do
   objetivo. A alça própria custa um kind a mais e paga com slug por KR, que é o que o one
   page aponta.
2. **`premissa` como alça própria.** Alternativa: sétimo gênero de `decisao`, com
   `payload.teste`. A alça própria evita tocar a lista de gêneros que o one page valida.
3. **Estratégia da casa no MVP, não do squad.** Desdobramento por squad fica para quando
   uma casa com mais de um time pedir.
4. **Página própria no MVP.** Aba dentro do artifact do one page para casa de um time só
   fica para depois.
5. **Extrair o comum do render para `plugins/rumbo-core/scripts/` antes de construir, ou
   duplicar com dívida registrada.** A regra do repositório pede extração.
6. **Cardinalidades.** Capacidades de três a cinco como aviso; aspiração, onde jogar e como
   ganhar obrigatórios na publicação.
7. **Quadrante opcional, RICE fora.**
8. **Idade de fonte para "a reconfirmar": 120 dias.** A reconfirmação é a mesma ideia que o
   córtex da casa planeja para si.
9. **Versão do `rumbo-core`: 0.8.0.**

---

## Anexo: como o método conversa com o macroprocesso Rumbo

A página do método descreve quatro camadas, cada uma com rito e cadência. Este artefato é o
da camada de Estratégia, consumido no conselho mensal com o C-level. O roadmap e o one page
já cobrem Tática e Operação. A camada de Plataforma fica fora deste plano. A linha de base
do diagnóstico lê três das quatro dimensões a partir destes artefatos: escolhas
estratégicas daqui, governança e sistemas do roadmap e do one page, estrutura e pessoas do
que a casa registra sobre quem executa. A quarta, tecnologia como meio, vem da telemetria
da plataforma de construção.
