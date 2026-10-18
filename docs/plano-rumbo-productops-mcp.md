# Rumbo + ProductOps: a base para a skill operar estratégia, apostas e OKRs

> **Documento de planejamento, histórico.** O que vale hoje está no `MODULO.md` e nos métodos; aqui, renúncia obrigatória e "cinco escolhas" são do plano original, e mudaram (renúncia só onde é essencial, sistemas opcionais).

Documento de trabalho para evoluir as skills do `rumbo-core` (e os bindings de cliente) agora que o ProductOps fala MCP. Ele descreve o que existe do lado do ProductOps, a régua de cada camada da estratégia (extraída dos prompts e das regras que o produto já usa) e o que cada skill precisa fazer.

Estado de referência: ProductOps em produção, revisão `productops-00175`, contrato do dossiê `1.3-productops`, 13/10/2026.

---

## 1. Por que este documento existe

A skill hoje sabe publicar dois artefatos versionados (estratégia e one page, com roadmap) por REST. O ProductOps passou a ter mais três coisas que a skill ainda não usa:

1. **Apostas e OKRs como fonte de verdade**, no módulo relacional, com avaliação por IA, quadrantes, RICE, marcos, resultados e histórico de status.
2. **Um servidor MCP** que deixa a conversa criar, ler, atualizar e avaliar apostas e OKRs com a mesma chave `po_`.
3. **Propostas da IA sobre a cascata**, gravadas como anotações que a liderança aceita ou recusa.

O objetivo é que a skill conduza o processo inteiro, da cascata à aposta da semana, e registre cada decisão onde ela mora, sem o usuário abrir a tela para digitar o que já disse na conversa.

---

## 2. A história em três camadas

| Camada | Artefato | Onde mora | Cadência | Quem escreve |
|---|---|---|---|---|
| Estratégica | Cascata: aspiração, onde jogar, como ganhar, capacidades, sistemas, premissas, decisões | ProductOps, versionado por ciclo | Ciclo (conselho, fechamento) | Skill `rumbo-estrategia`, por REST |
| Tática | Apostas | ProductOps, módulo relacional | Semana | Skill de apostas, por MCP; ou a tela |
| Tática | OKRs (medem as apostas) | ProductOps, módulo relacional | Semana | Skill de apostas/OKRs, por MCP; ou a tela |
| Operacional | One page do squad, com o roadmap dele | ProductOps, versionado por squad | Semana | Skill `rumbo-one-page`, por REST |
| Transversal | Diagnóstico: sinais, propostas da IA, alertas, análise estratégica | ProductOps | Contínua | Calculado; propostas pedidas pela skill ou pela tela |

Três regras que atravessam tudo:

- **A cascata não carrega apostas nem OKRs.** Desde o contrato 1.3 ela termina em capacidades, sistemas e premissas. Apostas e OKRs vivem no módulo e aparecem no dossiê da estratégia como contexto (`apostas_do_ciclo`, `okrs_do_ciclo`).
- **Squads fazem apostas.** Toda aposta tem (ou deveria ter) um squad responsável. O one page do squad conta o que andou nas apostas dele.
- **Julgamento é humano; aritmética e regra são do sistema.** A skill pergunta o que é escolha e propõe; o sistema valida, calcula RICE, sinaliza e registra.

---

## 3. O que existe hoje no ProductOps

### 3.1 Origem e autenticação

- Base: a URL da instância, em `RUMBO_ONEPAGE_API_PRODUCTOPS`. Não entra no repo.
- Chave: `po_...`, criada em Configuração › Chaves de API. Mostrada uma vez. O banco guarda o sha256.
- A chave resolve **usuário e empresa**. Nunca há `companyId` na chamada: a empresa é a da chave.
- **Escopos** por chave, marcados na criação:

| Escopo | Libera |
|---|---|
| `artefatos` | REST do contrato rumbo (publicar e ler estratégia, one page, roadmap) e as tools de dossiê do MCP |
| `apostas` | Tools de apostas no MCP |
| `okrs` | Tools de OKRs no MCP |
| `insights` | Tool de avaliação da cascata por IA |

Chave sem o escopo recebe, no MCP, um **resultado de tool com erro** dizendo qual escopo falta. No REST, 403. Chave ausente ou revogada: 401 HTTP.

### 3.2 REST do contrato rumbo (já usado pela skill)

Sem mudança de forma. O que mudou no conteúdo:

- `POST /api/product-artifacts` com `kind: "estrategia"`: alças `aposta`, `okr` e `kr` ainda são **aceitas** e gravadas, mas geram o aviso "a cascata não carrega apostas e OKRs desde o contrato 1.3". Não aparecem na tela nem no dossiê. A recusa entra quando a skill for atualizada.
- `POST` com `kind: "one_page"`: aceita `meta.farol` (`verde | amarelo | vermelho`) e `meta.farol_motivo`. Outro valor de farol é recusado.
- `GET /api/product-artifacts/context?squad=<casa>&kind=estrategia` (dossiê da estratégia), contrato `1.3-productops`:
  - saíram: `apostas`, `okrs`, `cobertura`;
  - entraram: `apostas_do_ciclo` (do módulo: id, título, quadrante, status, relevância, hipótese, indicador, dono) e `okrs_do_ciclo` (id, título, escopo, status, resumo, aposta ligada, squad, KRs com tipo, direção e meta);
  - continuam: `cascata`, `premissas`, `decisoes_abertas`, `escolhas_com_sinal`, `o_que_mudou`, `anotacoes_abertas`, `propostas_aceitas`, `lacunas`.
- `GET /api/product-artifacts/context?squad=<squad>` (dossiê do one page): o bloco `okrs` agora vem dos **objetivos do squad no módulo de OKRs** (`fonte: "productops:okrs"`), um KR por linha, com o status do objetivo.
- Sinais calculados na leitura da estratégia: só `premissa_vencida` e `sumiu_sem_saida` (este último só para escolha e premissa). Os sinais de aposta e KR saíram da cascata.

### 3.3 Servidor MCP

- Endpoint: `POST <base>/api/mcp`, header `Authorization: Bearer <chave>`. Sem estado, sem stream: `GET` responde 405.
- Configuração do cliente (vai no plugin do cliente, por exemplo `<cliente>-padroes`):

```json
{
  "mcpServers": {
    "productops": {
      "type": "http",
      "url": "${RUMBO_ONEPAGE_API_PRODUCTOPS}/api/mcp",
      "headers": { "Authorization": "Bearer ${RUMBO_ONEPAGE_TOKEN_PRODUCTOPS}" }
    }
  }
}
```

- 20 tools. Nomes em português, um verbo por tool. As de escrita devolvem o registro gravado; as de erro devolvem `isError` com a mensagem da regra.

| Tool | Escopo | O que faz | Entradas principais |
|---|---|---|---|
| `ciclo_ativo` | nenhum | Empresa da chave e ciclo vigente (ou o mais recente) | — |
| `squads_listar` | nenhum | Squads com `id`, `slug`, `name` | — |
| `pessoas_buscar` | nenhum | Membros por nome ou email, com `id` e papel | `q` (2+ letras) |
| `estrategia_contexto` | artefatos | Dossiê da estratégia (seção 3.2) | — |
| `one_page_contexto` | artefatos | Dossiê do one page do squad | `squad` (slug) |
| `estrategia_analisar` | insights | IA lê a versão (publicada ou rascunho), lembra a leitura anterior e grava o parecer com até 4 sugestões de ação e decisão | — |
| `estrategia_analise` | artefatos | lê a análise gravada da versão | — |
| `estrategia_acao_decidir` | insights | adiciona ou ignora cada sugestão da análise | — |
| `one_page_desenho_ver`, `one_page_desenho_definir` | artefatos | lê e grava o desenho do squad (definir só líder ou admin) | — |
| `link_publico_ver`, `_definir`, `_emails`, `_fechar` | artefatos | quem lê a página sem login | — |
| `apostas_listar` | apostas | Apostas do ciclo, da mais relevante para a menos | `cycleId?`, `squad?` (slug), `status?` |
| `aposta_obter` | apostas | Aposta com marcos, resultados e as cinco últimas mudanças de status | `id` |
| `aposta_criar` | apostas | Cria no ciclo vigente; RICE calculado pelo sistema | seção 5.2 |
| `aposta_atualizar` | apostas | Atualiza só os campos enviados | `id` + campos |
| `aposta_avaliar_ia` | apostas | Avaliação cética contra a cascata do ciclo e os documentos. Não grava | `id` |
| `aposta_mudar_status` | apostas | Muda status e grava no histórico quem, por onde e por quê | `id`, `executionStatus`, `summary`, `analysis?` |
| `aposta_marco_criar` | apostas | Marco com descrição (até 220) e data | `id`, `description`, `dueDate`, `status?` |
| `aposta_resultado_criar` | apostas | Resultado esperado com métrica e janela | `id`, `name`, `description`, `metric`, `objectiveRelation`, `startDate`, `endDate` |
| `okrs_listar` | okrs | Objetivos do ciclo com KRs, squad, dono e aposta ligada | `cycleId?`, `squad?` |
| `okr_obter` | okrs | Um objetivo com KRs | `id` |
| `okr_criar` | okrs | Cria objetivo e KRs. A validação por IA dos KRs fica de fora: use `kr_avaliar_ia` antes | seção 5.4 |
| `okr_atualizar` | okrs | Título, conexão com a estratégia, resumo e KRs (substituem os atuais). Só dono ou admin | `id` + campos |
| `okr_mudar_status` | okrs | Status com motivo (até 280). Só dono ou admin | `id`, `executionStatus`, `statusSummary` |
| `kr_avaliar_ia` | okrs | Diz se o KR é outcome ou output e sugere versão melhor. Não grava | `title`, `objetivo?` |

Todo registro de mudança de status de aposta feito pelo MCP aparece no histórico como `"<nome do dono da chave> via MCP"`.

### 3.4 Anotações e propostas da IA

- Anotação é a camada humana sobre a versão imutável da estratégia: `comentario` (resolver) ou `proposta` (aceitar ou recusar), ancorada numa alça por slug.
- Nova coluna `origem`: `humano` ou `sistema`. As propostas da IA têm `origem = sistema`, sem autor, e `payload = { campo, motivo }`.
- As propostas **aceitas** voltam no dossiê em `propostas_aceitas`. As **abertas**, em `anotacoes_abertas`. É assim que a revisão seguinte da estratégia incorpora o que a liderança aprovou.

---

## 4. A régua da cascata (o que a skill exige em cada estágio)

Extraído dos prompts que o ProductOps usa para avaliar cada estágio (`winning-aspiration`, `where-to-play`, `how-to-win`, `must-have-capabilities`, `strategy-review`, `strategic-analysis`, `estrategia-propostas`). A skill deve aplicar estas regras **antes** de gravar, conduzindo com perguntas, e não deixar para a IA do servidor descobrir depois.

### 4.1 Aspiração vencedora

Pergunta: o que é vencer, aos olhos de quem compra?

Leis:

1. **Teste do oposto.** Se o oposto da frase for absurdo ("qualidade" contra "baixa qualidade"), não é escolha. Toda escolha real rejeita uma alternativa que um concorrente escolheria.
2. **Dinheiro é prêmio, não aspiração.** Faturamento, market share e retorno ao acionista são consequência. Se a frase fala de meta interna antes de falar do cliente, está errada.
3. **Miopia do produto.** A aspiração é sobre o valor na vida do cliente, não sobre ter o melhor produto. Pampers não queria "a fralda mais seca"; queria "o desenvolvimento saudável do bebê".
4. **Vencer, não participar.** "Manter posição", "ser uma opção viável", "atender bem" não servem. Exige intenção de dominar um espaço.
5. **Pragmatismo, sem autoajuda.** Se a dor é prática, de custo ou de urgência, a vitória pode ser puramente funcional. "Conectar a receita médica ao remédio na mão" é uma vitória legítima.

Escala de referência: 1 a 4 platitude; 5 a 7 boa ideia mal focada; 8 a 10 escolha real e difícil focada no cliente.

Pergunta de provocação típica: "Se o seu concorrente disser exatamente a mesma coisa, como o cliente descobre quem é quem?"

### 4.2 Onde jogar

Pergunta: em que recorte de cliente, geografia, canal e produto?

Leis:

1. **A arte do não.** Onde jogar é sobre o que a empresa decide ignorar. Quem atende todos os perfis, regiões ou canais não escolheu.
2. **Fim da ambiguidade.** Exige recorte preciso de demografia, geografia, canal e produto. "Brasil" ou "todos os pacientes" é falta de foco.
3. **Teste da dor.** Deixar mercado de lado precisa doer. Se não ficou dinheiro óbvio na mesa, a escolha foi falsa.
4. **Amarração.** O terreno é o ambiente onde a aspiração consegue virar realidade.

Provocação típica: "Se você tivesse orçamento para um único canal e uma única cidade, qual escolheria para não fechar amanhã?"

### 4.3 Como ganhar

Pergunta: que vantagem de custo ou de valor faz vencer ali?

Leis:

1. **Teste da vantagem.** É vantagem de custo estrutural ou diferenciação irrefutável de valor. "Fazer melhor o que os outros fazem" não conta.
2. **Ilusão das melhores práticas.** "Qualidade", "melhor atendimento", "excelência" são atestado de óbito: todo concorrente tenta.
3. **Teste da imitação.** Se um concorrente com dinheiro copia em seis meses, não há vantagem.
4. **Amarração.** A vantagem faz sentido no onde jogar e entrega a aspiração.

Provocação típica: "O que você faz nos bastidores que torna financeiramente impossível para o concorrente fazer igual?"

### 4.4 Capacidades

Pergunta: quais as poucas coisas que a empresa precisa fazer com perfeição?

Leis:

1. **Capacidade não é departamento.** "Atendimento" é área; "resolver barreiras de acesso em menos de 10 minutos" é capacidade.
2. **Filtro da vantagem.** Cada capacidade é motor direto do como ganhar.
3. **Mediocridade intencional.** Para ser excepcional em poucas coisas, a empresa aceita ser mediana no resto. Nomeie a **distração fatal**: a atividade clássica do setor que será ignorada.
4. Frases curtas, de 4 a 8 palavras, orientadas a ação.
5. De três a cinco capacidades. Fora disso a origem avisa.

### 4.5 Sistemas

Pergunta: que ritos e medidas sustentam as capacidades?

- Cada sistema serve uma capacidade (`serve` aponta a capacidade).
- Sistema dispensa renúncia; precisa de fonte.
- Ao menos um sistema declarado. Sem nenhum, a origem avisa.

### 4.6 Premissas: o que tem de ser verdade

- Cada premissa aponta a escolha que sustenta (`sobre`), tem **teste executável** e **prazo**.
- De duas a quatro premissas abertas por versão.
- Premissa aberta com prazo vencido vira o sinal `premissa_vencida`: confirmar ou refutar.

### 4.7 A cascata como um todo

Critérios de revisão (prompts `strategy-review` e `estrategia-propostas`):

1. **Coerência:** cada estágio serve exatamente o de cima. Onde jogar sustenta a aspiração; como ganhar é o caminho no campo escolhido; capacidades viabilizam o como ganhar; sistemas sustentam as capacidades.
2. **Escolha de verdade:** escolha sem renúncia clara é platitude. Renúncia genérica não conta.
3. **Diferenciação:** o como ganhar não é copiável.
4. **Fonte:** escolha sem fonte datada é opinião.
5. **Elo mais fraco:** toda versão publicada declara qual escolha ou premissa é o ponto mais frágil (`meta.elo_mais_fraco`). É julgamento da leitura, não herdado da versão anterior.

Análise estratégica (prompt `strategic-analysis`) olha os mesmos cinco itens com **tensão** (risco real, incoerência, gargalo), **oportunidade** (ação concreta e priorizável) e **criticidade** (alta, média, baixa). A skill pode usar esse formato para fechar a revisão de um conselho.

---

## 5. A régua das apostas e dos OKRs

### 5.1 O que é uma aposta

A aposta é o primeiro artefato tático: a forma de provar uma escolha da cascata com investimento limitado e critério claro de aprendizado. Ela não fica na cascata; ela serve a cascata.

### 5.2 Campos de uma aposta no ProductOps

| Campo (MCP) | Obrigatório | O que é | Como a skill conduz |
|---|---|---|---|
| `title` | sim | Nome curto da aposta | Verbo e objeto: "Cotação pelo WhatsApp" |
| `parentStrategyText` | sim | **Onde ganhar**: a tese de onde jogar e como ganhar que a aposta serve | Cite a escolha da cascata pelo texto e, se quiser, pelo slug |
| `ownerId` | sim | Dono, membro da empresa | `pessoas_buscar` antes. Nunca invente id |
| `squadId` | não | Squad responsável | `squads_listar` antes. Pergunte sempre: squads fazem apostas |
| `problemStatement` | sim | O problema real, na voz do cliente | Sem solução embutida |
| `hypothesis` | sim | O mecanismo causal | Formato da seção 5.5 |
| `quadrant` | sim | Um dos quatro quadrantes | Seção 5.3, pelas duas perguntas |
| `laggingIndicator` | sim | Indicador final, com unidade | Outcome, não output |
| `expectedReturn`, `investmentCap` | não | Retorno esperado e teto de investimento, em número | Pergunte; sem número, deixe vazio |
| `reach` | sim | RICE: alcance (> 0) | Número de clientes, contas ou eventos no período |
| `impact` | sim | RICE: impacto, inteiro de 1 a 5 | Pergunte com a escala falada |
| `confidence` | sim | RICE: confiança, de 0 a 100 | Quanto da hipótese já tem evidência |
| `effort` | sim | RICE: esforço (> 0) | Pessoa-semana ou pessoa-mês, sempre na mesma unidade da casa |
| `executionStatus` | não | Status inicial; padrão "Não iniciada" | Seção 5.6 |
| `relevanceLevel` | não | Baixa, média, alta, crítica; padrão média | Relevância para a estratégia, não urgência |
| `hasRoadmapPlanning` | não | Entra no roadmap de execução; padrão sim | — |

O RICE é calculado pelo sistema: `(reach × impact × confidence/100) / effort`. A skill **não calcula nem mostra outro número**.

### 5.3 Os quatro quadrantes (definição oficial do módulo)

O quadrante sai de duas perguntas, nesta ordem:

1. **Foco no cliente:** a aposta busca clientes novos (aquisição) ou aprofunda os atuais (retenção)?
2. **Foco na solução:** usa a solução que a empresa já sabe construir e vender (existente) ou exige solução nova?

| | Solução existente | Solução nova |
|---|---|---|
| **Aquisição** | `EXPANSAO_MERCADO`: avanço previsível em mercado já dominado, com produto próximo do que a empresa sabe fazer. ICP conhecido, canal existente. Receita nova, risco baixo. | `APOSTAS_RISCO`: a expertise de produto **ou** de mercado dá um salto grande. Outro modelo de risco, outra regulação, outro processo de venda. Riscos de valor e de execução se somam. |
| **Retenção** | `OPERACAO_QUALIDADE`: proteger e otimizar a base. Sem receita nova direta. Eficiência, custo, gaps, margem. | `DIFERENCIACAO_VALOR`: aprofundar o valor percebido pelo cliente atual para reter e aumentar LTV. Sem receita nova direta; o retorno vem de menos churn e mais engajamento. |

**Regra de ouro** entre expansão e risco: a empresa já tem a expertise de produto **e** de mercado para entregar com previsibilidade? Sim às duas: expansão. Não a qualquer uma: aposta de risco. **O ICP ser o mesmo não basta** para classificar como expansão. Exemplo: empresa de automação de pedidos que lança crédito para o mesmo cliente é aposta de risco, porque exige expertise financeira e regulatória que ela não tem.

### 5.4 Campos de um OKR no ProductOps

| Campo (MCP) | Obrigatório | Regra |
|---|---|---|
| `title` | sim | O objetivo, qualitativo e claro |
| `year`, `quarter` | sim | O trimestre precisa cair dentro do ciclo |
| `scope` | sim | `COMPANY` (dono precisa ser admin da empresa) ou `SQUAD` (exige `squadId`) |
| `squadId` | se SQUAD | `squads_listar` |
| `ownerId` | sim | `pessoas_buscar` |
| `betId` | não, mas recomendado | **A aposta que o objetivo mede.** Mesmo ciclo e mesma empresa |
| `parentObjectiveId` | não | Objetivo da empresa que este desdobra. Mesmo ciclo e mesma empresa |
| `strategyConnection` | sim | Como o objetivo se liga à estratégia, com 10 ou mais caracteres |
| `executionStatus` | não | `ON_TRACK`, `AT_RISK`, `OFF_TRACK`; padrão `AT_RISK` |
| `statusSummary` | não | Até 280 caracteres |
| `keyResults[]` | não | Cada um com `title`, `type` (`BINARY`, `PERCENT`, `NUMERIC`), `direction` (`INCREASE`, `DECREASE`, exigido fora de BINARY) e `targetValue` (número, exigido fora de BINARY) |

Regras de KR (prompt `okr-validation`):

1. **Output contra outcome.** Output é tarefa ("lançar o site", "contratar 3 designers"). Outcome é mudança mensurável ("aumentar conversão em 20%", "reduzir churn de 15% para 8%"). KR válido responde "o que muda?", não "o que fazemos?".
2. **Mensurabilidade.** Número, percentual ou estado binário claro.
3. **Resultado, não esforço.** "50 horas de pesquisa" é esforço; "validar 3 hipóteses com 80% de confiança" é resultado.
4. **Ambíguo:** KR que mistura entrega e resultado se separa ou foca no resultado.

Antes de `okr_criar`, a skill roda `kr_avaliar_ia` em cada KR e mostra o veredito. O `okr_criar` pelo MCP **não** roda a IA, de propósito: N chamadas ao modelo dentro de um create estouram tempo.

Qualidade do OKR inteiro (prompt `okr-analysis`): objetivo claro, ligação real com a estratégia, KRs outcomes, ambição balanceada, e OKR de squad desdobrando o da empresa.

### 5.5 A hipótese da aposta e o critério de matar

O módulo avalia a aposta pela rubrica (prompt `bets-validation`), nesta ordem:

1. **Coerência com a cascata:** reforça aspiração, onde jogar, como ganhar e capacidades?
2. **Coerência do quadrante:** problema, hipótese e indicador combinam com o quadrante?
3. **Mecanismo causal:** a hipótese explica como a ação gera resultado mensurável?
4. **Mensurabilidade:** indicador específico, auditável, com unidade?
5. **Foco executivo:** evita generalidade e define escolha real?

O veredito é `ALIGNED`, `MISALIGNED` ou `VAGUE`, com forças, riscos, próxima ação e uma pergunta para abrir a discussão.

Formato que a skill deve conduzir para a hipótese:

> Se **[ação]** para **[quem]**, então **[mudança de comportamento]**, medida por **[indicador com unidade]**. Matamos a aposta se **[condição]** até **[data]**.

O módulo **não tem campo de critério de matar**. Até ter, a skill:

- escreve o critério no fim da `hypothesis`, na frase "Matamos a aposta se ... até ...";
- cria um **marco** (`aposta_marco_criar`) com a descrição "Decisão de matar ou seguir" na data do critério.

Assim a data aparece na linha do tempo e o sistema alerta quando o marco se aproxima.

### 5.6 Status de execução e o rito semanal

| Valor | Rótulo | Quando |
|---|---|---|
| `NOT_STARTED` | Não iniciada | Aprovada, sem trabalho começado |
| `VALIDATING` | Validando | Testando a hipótese antes de escalar |
| `ON_TRACK` | No ritmo | Avançando como previsto |
| `AT_RISK` | Em risco | Sinal de que o indicador ou o prazo não fecham |
| `BLOCKED` | Bloqueada | Depende de algo fora do squad |
| `PAUSED` | Pausada | Decisão de parar sem matar |
| `CANCELLED` | Cancelada | Morreu: o critério de matar disparou ou a cascata mudou |
| `DONE` | Executada | Concluída; o aprendizado vai para a revisão da cascata |

Toda mudança exige um **resumo** (uma frase, o porquê) e aceita uma **análise** mais longa. O histórico guarda quem, quando e por onde. A skill nunca muda status sem dizer o motivo ao usuário e receber confirmação.

Status de OKR: `ON_TRACK`, `AT_RISK`, `OFF_TRACK`, também com resumo obrigatório pelo MCP. A saúde geral do ciclo (prompt `okr-health-evaluation`) prioriza `OFF_TRACK` se houver muitos, `AT_RISK` se predominarem, e só dá `ON_TRACK` sem sinal forte de risco.

### 5.7 Marcos e resultados

- **Marco:** descrição de até 220 caracteres e data. Status `PLANNED`, `IN_PROGRESS`, `ACHIEVED`, `AT_RISK`, `CANCELED`.
- **Resultado:** nome, descrição, métrica, relação com o objetivo (texto livre), janela de início e fim (fim maior ou igual ao início) e status executivo `PLANNED`, `ON_TRACK`, `ATTENTION`, `ACHIEVED`, `CANCELED`.

Use marcos para datas de decisão e entregas que provam a hipótese. Use resultados para o que se espera medir no fim da janela.

---

## 6. O que cada skill precisa fazer

### 6.1 `rumbo-estrategia`: contrato 1.3

Mudanças:

1. **Parar de emitir** alças `aposta`, `okr` e `kr`. Remover do fluxo, do `exemplo-envelope-estrategia.json`, do `validar.sh` e do `render.mjs`. Quando isso entrar, avisar o ProductOps para trocar o aviso por recusa.
2. **Ler o tático do dossiê.** O briefing do `contexto.mjs` ganha duas seções: "Apostas do ciclo" (título, quadrante, status, squad) e "OKRs do ciclo" (objetivo, status, KRs). Elas servem para a revisão perguntar: alguma escolha ficou sem aposta? Alguma aposta não serve escolha nenhuma? O sinal antigo de cobertura passa a ser julgamento conduzido pela skill com esses dados.
3. **Incorporar propostas aceitas.** No início da revisão, listar `propostas_aceitas` e aplicá-las nas alças correspondentes, dizendo em voz alta o que entrou. Listar `anotacoes_abertas` como pauta.
4. **Oferecer a avaliação por IA** (`estrategia_analisar`, escopo `insights`) depois de publicar uma versão: "Quer que o sistema leia a cascata e proponha ajustes para o próximo conselho?". As propostas ficam como anotações; ninguém as aplica sem decisão.
5. **Aplicar a régua da seção 4** durante a condução, estágio por estágio, com as perguntas de provocação.
6. **Emitir `payload.rotulo` nas escolhas** (opcional, até 30 caracteres): o nome curto da escolha, como "Produto", "Cliente", "Canal" em onde jogar, ou "Velocidade de curadoria" em como ganhar. Desde a revisão `productops-00177` a tela lê a cascata como documento e usa o rótulo como cabeçalho da linha da tabela de onde jogar e como título da coluna de como ganhar. Sem ele a tela funciona, mas o nome fica embutido no texto ("Produto: página do produto…"). Ao emitir, tirar o prefixo do `texto`.

### 6.2 Nova skill `rumbo-apostas`

Dois modos.

**Nascimento de uma aposta** (uma por vez):

1. `ciclo_ativo`, `squads_listar`, `estrategia_contexto` para ter a cascata e as apostas existentes.
2. Perguntar qual escolha da cascata a aposta prova. Montar `parentStrategyText` a partir dela.
3. Conduzir problema, hipótese no formato da seção 5.5 e indicador.
4. Classificar o quadrante pelas duas perguntas e pela regra de ouro. Dizer o quadrante e o porquê.
5. Conduzir o RICE com perguntas faladas. Não mostrar conta própria.
6. Dono (`pessoas_buscar`) e squad responsável.
7. Mostrar o rascunho completo e esperar confirmação.
8. `aposta_criar`. Depois `aposta_avaliar_ia` e mostrar veredito, forças, riscos e próxima ação. Se vier `VAGUE` ou `MISALIGNED`, conduzir o ajuste e usar `aposta_atualizar`.
9. Criar o marco do critério de matar e, se houver, os resultados esperados.
10. Oferecer o OKR que mede a aposta (seção 6.3).

**Revisão semanal** (por squad ou por relevância):

1. `apostas_listar` (filtro por squad quando for o rito do squad).
2. Para cada aposta: perguntar o que mudou desde o último status (vem em `aposta_obter`). Propor o novo status com o motivo. Gravar com `aposta_mudar_status` só depois de confirmado.
3. Marco vencido ou critério de matar atingido: perguntar explicitamente "matamos, pausamos ou ganha prazo novo?". Matar é `CANCELLED` com o motivo.
4. Ao fim, resumir as mudanças da semana. Esse resumo alimenta o one page do squad.

### 6.3 OKRs (dentro de `rumbo-apostas` ou skill própria)

1. Partir da aposta: o objetivo mede a aposta (`betId`).
2. Conduzir o objetivo e de um a três KRs.
3. `kr_avaliar_ia` para cada KR antes de gravar; reescrever outputs como outcomes.
4. Escopo `SQUAD` com o squad da aposta, ou `COMPANY` com dono admin.
5. `okr_criar`. No rito semanal, `okr_mudar_status` com resumo.

### 6.4 `rumbo-one-page`

1. Já documentado: `meta.farol` e `meta.farol_motivo` são julgamento de quem conduz; a skill pergunta, não infere.
2. O bloco `okrs` do dossiê agora vem do módulo: use para a seção de objetivos do squad, com o status de cada objetivo.
3. Com escopo `apostas`, a skill pode chamar `apostas_listar` com o squad para escrever "o que andou nas apostas desta semana". Isso é o one page contando a execução tática, que era a ideia de longo prazo.

### 6.5 Diagnóstico e insights

- `estrategia_analisar` para a análise da IA, e `estrategia_acao_decidir` para as sugestões.
- Os sinais da cascata e os alertas do ciclo ficam na tela Diagnóstico › Sinais e alertas. Ainda não há tool MCP para lê-los; quando houver, a skill os usa como pauta do conselho.

### 6.6 Bindings de cliente

Cada binding (por exemplo `estrategia-<cliente>`) declara:

- casa (slug da empresa: `guiadopaciente`) e squads (`guia`);
- o `.mcp.json` com a URL e o header da chave;
- os escopos que a chave do cliente precisa;
- vocabulário e cuidados do setor (no Guia, contexto de saúde: número sobre preço, cobertura ou disponibilidade de remédio leva fonte e ressalva).

---

## 7. Regras de conduta para toda skill que fala com o ProductOps

1. **Ler antes de escrever.** `ciclo_ativo`, `squads_listar` e `pessoas_buscar` dão os ids que as tools de escrita pedem. Nunca invente id, slug ou e-mail.
2. **Mostrar antes de gravar.** Toda escrita (criar, atualizar, mudar status) é precedida do rascunho na conversa e de uma confirmação explícita.
3. **Mudança de status sempre com motivo**, na voz de quem decidiu.
4. **Proposta não é decisão.** O que a IA (do servidor ou da skill) sugere entra como proposta ou como pergunta, nunca como alteração direta.
5. **A empresa é a da chave.** Se a pessoa pedir algo de outra empresa, a skill para e diz que precisa da chave daquela casa.
6. **Sem chave, modo offline.** A skill continua funcionando sem origem: estratégia e one page viram página renderizada; apostas e OKRs viram texto pronto para colar na tela. Nada quebra.
7. **Escopo faltando é informação, não erro.** Se a tool devolver "esta chave não tem o escopo X", a skill explica como criar uma chave com o escopo e segue no modo offline para aquela parte.
8. **Número é do sistema.** RICE, saúde de OKR, sinais, deltas: a skill explica, não calcula outro.

---

## 8. Lacunas conhecidas no ProductOps

Para não reinventar na skill o que o produto ainda vai ter:

| Lacuna | Contorno na skill | Quando resolver no produto |
|---|---|---|
| Aposta sem campo de critério de matar | Frase no fim da hipótese e marco com a data | Campo `killCriteria` + data |
| Aposta sem vínculo estruturado com a escolha da cascata | `parentStrategyText` cita a escolha | Campo com slug da alça servida |
| OKR sem histórico de status | Resumo obrigatório no `okr_mudar_status` | Tabela de histórico como a das apostas |
| Sem tool MCP para sinais e alertas | Usar a tela de Diagnóstico | Tools `sinais_listar`, `alertas_listar` |
| Sem tool MCP para anotações (aceitar, recusar, comentar) | Usar a tela da estratégia | Tools de anotação |
| Contrato 1.3 ainda tolera apostas e OKRs na cascata | Parar de emitir (seção 6.1) | Trocar aviso por recusa depois da skill |

---

## 9. Critérios de aceite da evolução da skill

1. Publicar uma revisão da estratégia do Guia sem alças de aposta, okr e kr, e o ProductOps responder sem o aviso de contrato 1.3.
2. O briefing da revisão mostrar as apostas e os OKRs do ciclo vindos do dossiê, e listar as propostas aceitas aplicadas.
3. Criar uma aposta do zero pela conversa: quadrante explicado, RICE conduzido, squad e dono por id, avaliação por IA mostrada, marco do critério de matar criado. Ela aparece na matriz e no Acompanhamento sob o squad certo.
4. Rodar a revisão semanal de um squad: cada mudança de status com motivo, gravada só após confirmação, com "via MCP" no histórico.
5. Criar o OKR da aposta com KRs avaliados antes, ligado por `betId`, e vê-lo no dossiê do one page do squad.
6. Pedir `estrategia_analisar` e ver as sugestões na aba Análise; adicionar uma e vê-la em `propostas_aceitas` na revisão seguinte.
7. Com uma chave só de `artefatos`, a skill de apostas explicar o escopo faltante e cair para o modo offline sem erro.
8. Sem chave nenhuma, todas as skills funcionarem como hoje.
