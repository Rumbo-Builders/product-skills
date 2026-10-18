# rumbo-estrategia: a experiência completa, como está hoje

Documento de trabalho para discutir melhorias. Descreve o que existe no repositório
`product-skills` (branch `rumbo-estrategia`, outubro de 2026): as instruções que o
agente segue, o fluxo da conversa com a liderança, como a cascata é conduzida e
completada, como entram "o que tem de ser verdade" e "ação e decisão", e o que a
máquina confere antes de publicar. No fim há uma lista de pontos de atrito que eu
observei lendo o código e o método, para servir de pauta.


> **Atualizado em 17/10/2026.** Mudou desde a primeira leitura deste documento:
> - Sistemas virou estágio opcional, e o padrão é não ter: com OKRs e one page, eles
>   são os sistemas. A régua avisa quando há sistema declarado (não mais quando falta),
>   a tela e a página escondem o estágio vazio, e o briefing deixou de cobrar
>   "capacidade sem sistema" (atrito 7).
> - Ação e decisão: de três a quatro itens centrais, cada um com `payload.sobre`
>   apontando a escolha ou premissa. Mais de quatro avisa; `sobre` inexistente reprova.
>   Nova etapa `pendencias`, antes de `conferir`, para fechar, mover ao one page ou
>   manter cada item, e para reler a cascata com o que a máquina não vê e com tensão e
>   oportunidade por estágio (atritos 1, 2, 11, 12, 13 e 15).
> - Módulo ProductOps: `estrategia_avaliar` saiu. Ficou uma análise só:
>   `estrategia_analisar` gera o parecer sobre a versão (também em rascunho), que
>   lembra a leitura anterior e o que foi ignorado, e sugere até 4 itens de ação e
>   decisão; `estrategia_acao_decidir` adiciona (vai para `propostas_aceitas`) ou
>   ignora cada um; `estrategia_analise` lê. `link_publico_*` gerencia quem lê sem login.

> **Atualizado em 18/10/2026, depois de uma revisão real conduzida pela skill.** As
> seções 2, 4 e 5 abaixo descrevem o fluxo anterior. O que vale agora:
> - **A condução é conversa, por padrão.** O agente mostra o roteiro numerado (o mapa
>   do `estado.mjs`) antes da primeira pergunta e passa uma etapa por mensagem, com
>   uma pergunta só no fim. Em revisão, cada escolha vem em blocos separados: Hoje
>   (literal), Proposta (só se houver motivo), Por quê, Fonte. Sem tabela larga, que
>   corta no terminal. O que é tático estaciona e sai na etapa `insights`.
> - **O roteiro tem 21 etapas**: base, contexto, fontes; aspiração, onde jogar, como
>   ganhar, capacidades, sistemas, amarração; premissas, elo, pendências, insights;
>   insight, escrita, validação com IA sobre o rascunho, conferir, validar, publicar;
>   comunicar, binding.
> - **Revisão pole todas as etapas.** O sinal do briefing ("Por onde começar") diz
>   onde insistir, não o que pular.
> - **Fontes:** a declaração principal é o rito mais recente da liderança; o resto é
>   contexto tático, e o tático não entra na cascata.
> - **Renúncia só onde é essencial.** A régua deixou de reprovar escolha sem renúncia.
> - **Onde jogar** é um recorte por alça, com `payload.recorte` no nome da casa
>   ("Molécula"). Ferramenta e entrega são como ganhar ou aposta.
> - **Capacidades** passam por três filtros (já existe e é medida? é tarefa
>   operacional? quem sustenta?) e levam `sustentada_por`. Todo squad pendura na
>   cascata por aposta ou capacidade.
> - **Apostas e OKRs são sistema** quando a casa tem onde eles vivem: a etapa
>   `amarracao` só confere a ligação, e as alças ficam fora do envelope.
> - **Premissa não é pergunta nem competência.** O agente propõe as crenças sem
>   evidência que derrubam a cascata; pergunta vai para ação e decisão.
> - **Régua:** avisa prefixo "Proposta" no texto e recorte repetido.

> **Atualizado em 18/10/2026, segunda leva.** A condução virou regra de todas as
> skills, em `metodo/conducao.md`. Apostas e OKRs ganharam método próprio
> (`metodo/apostas.md`, `metodo/okr.md`) e skills próprias, `rumbo-apostas` e
> `rumbo-okrs`, cada uma com três modos (criar, editar, acompanhar) e um roteiro
> por modo. O rascunho de uma aposta ou de um objetivo passa pela mesma régua das
> alças do envelope (`scripts/regras.cjs`), e o tradutor do módulo monta as
> chamadas das tools a partir dele. O one page ganhou etapas próprias para
> objetivos, indicadores, apostas do time e ação e decisão. Alinhado ao ProductOps:
> `serve` aceita mais de uma escolha, e as premissas vão de uma a quatro.

---

## 1. Contexto mínimo

**Rumbo** é uma biblioteca de skills para agentes (Claude Code / plugins) voltada a
gestão de produto. A regra estrutural do repo: o método mora num lugar só.

Três camadas:

| Camada | Arquivo | Papel |
|---|---|---|
| Método | `plugins/rumbo-core/metodo/estrategia.md` | O que é uma boa estratégia, a régua, o envelope. Cliente-agnóstico. |
| Skill de método | `plugins/rumbo-core/skills/rumbo-estrategia/SKILL.md` | Gatilho e fluxo da conversa: o que perguntar, em que ordem. |
| Binding de cliente | plugin `rumbo-<cliente>` ou pasta `.rumbo/` | Fontes, destino, vocabulário, quem senta no conselho. |

Divisão de trabalho: `metodo/` é o que se lê, `scripts/` é o que roda, `SKILL.md` é o
que conduz.

**O artefato.** "A estratégia de um ciclo numa página, com as escolhas, o que elas
renunciam, as apostas que vão prová-las, os resultados que as medem, e o julgamento
de quem conduz sobre o elo mais fraco." É da **casa** (empresa ou unidade), não do
squad. O one page semanal de cada squad aponta os KRs dela.

Vocabulário: Playing to Win (Lafley e Martin), com cinco escolhas encadeadas,
mais apostas, OKRs e premissas.

---

## 2. Os princípios de condução (valem o fluxo inteiro)

São as instruções mais importantes, porque definem a postura do agente:

1. **O agente não pontua.** Nada de score de aspiração, nota de alinhamento ou
   veredito numérico. A régua é feita de perguntas e de campos obrigatórios.
2. **O texto da escolha é da liderança.** O agente pergunta, diz por que acha a
   resposta fraca, sugere no máximo duas reescritas e registra o que a pessoa
   escolheu.
3. **Regra das duas devoluções.** Resposta fraca: o agente devolve a pergunta, no
   máximo duas vezes por escolha. Na terceira, registra a escolha como está e cria
   uma decisão de gênero `nota_metodo` apontando a fraqueza. Justificativa escrita:
   "recusar de saída transforma a ferramenta em obstáculo, e já transformou no one
   page".
4. **Toda escolha carrega fonte e renúncia.** Sem fonte não entra; sem renúncia não
   é escolha, é platitude. Declaração da liderança na conversa é fonte legítima
   ("declaração de <papel>, <data>"). O que não entra: escolha que ninguém
   declarou, premissa que o agente deduziu, número que ninguém informou.
5. **Proposta do agente fica marcada no campo, não no texto.** Quando a origem não
   traz renúncia, critério de matar ou teste, o agente pode propor, e lista o nome
   do campo em `payload.propostas`. A página mostra uma pílula "proposta", a régua
   avisa ao publicar, e a revisão seguinte **não herda** o campo proposto: ele some
   e a alça fica inválida até alguém confirmar com as próprias palavras.
6. **O agente não lê os JSON.** Scripts transformam os dados em briefing markdown.
   O que o briefing decide (diff, idade de fonte, cobertura, escolhas com sinal) o
   agente não redecide.
7. **Nascimento conduz as cinco; revisão reabre só o que tem sinal.** Reescrever a
   cascata a cada conselho "é o erro que transforma estratégia em ata".
8. **Uma escolha por vez, de cima para baixo.** Nunca pedir a cascata inteira de uma
   vez. Pergunta a aspiração, registra, passa ao onde jogar já amarrando à
   aspiração registrada.
9. **Nada sai sozinho.** Publicar e comunicar exigem confirmação explícita.
   "Nomear alguém já é enviar."

---

## 3. Ritos e relógios

Três ritos consomem o artefato:

| Rito | O que acontece | Produz |
|---|---|---|
| Nascimento do ciclo | Liderança escreve cascata, apostas e OKRs do zero | v1 |
| Conselho mensal | Lê o que mudou: apostas mortas ou validadas, premissas refutadas, KRs fora de rota | Versão nova só se algo mudou |
| Fechamento do trimestre | Cascata inteira contra o resultado: KR com leitura final, aposta com desfecho, premissa com veredito | Base do ciclo seguinte |

Relógios separados: cascata muda no nascimento (e no conselho, só escolha com
sinal); apostas no conselho ou quando o critério de matar dispara; definição de OKR
no nascimento e fechamento; **leitura de KR é semanal, pelo one page**, nunca por
este artefato.

---

## 4. O fluxo passo a passo

O agente roda `estado.mjs --time <casa>` como primeira chamada. Ele imprime um mapa
de etapas (hoje 21, ver a nota do topo) e onde a montagem parou; havendo montagem em andamento, o agente
pergunta se continua ou recomeça. A cada etapa vencida, marca e mostra o mapa de
novo. Etapas marcadas "para" exigem resposta humana.

Antes do fluxo: se não há casa nomeada, pergunta. Se colarem uma ata, pergunta de
qual casa e de qual rito ela veio antes de ler. Sem binding, pergunta casa, ciclo e
destino. Sem `.rumbo/marca.json`, roda o configurador (identidade visual e tom).

### Fase Preparar

**1. `base`: de onde parte.** Pergunta antes de buscar: nascimento em branco ou
revisão da última publicada. `base.mjs` herda escolhas, apostas, OKRs e premissas
com estado, e **diz em voz alta o que não herda**: insight, elo mais fraco, marca de
revisão, ano e trimestre, listas de escalada (perguntas). Também descarta campos
que eram proposta não confirmada.

**2. `contexto`: o briefing.** O agente lê as atas e documentos na conversa e
normaliza a lista de fontes (nome, tipo, data). `contexto.mjs` lê a versão anterior,
as fontes e, se houver, a cadeia de leituras do one page, e escreve um briefing com
estas seções:

- Ciclo e revisão (próxima versão, dias para o fim do ciclo)
- Estado da cascata (cada escolha com renúncia, fonte, idade da fonte, `serve`)
- **Escolhas com sinal**: premissa refutada, aposta morta, KR fora de rota (pior que
  baseline ou andando contra a direção), fonte com mais de 120 dias. "São estas, e
  só estas, que a etapa `cascata` reabre."
- Apostas (horizonte, indicador, leitura, critério de matar, se venceu)
- Objetivos e KRs com a última leitura
- Premissas (marca vencidas)
- Cobertura: escolha sem aposta nem objetivo abaixo dela, `serve` apontando slug
  inexistente, capacidade sem sistema
- O que mudou entre as duas últimas versões, por slug
- Fontes disponíveis, e quais nenhuma escolha cita
- **Perguntar antes de escrever** (as lacunas)

**3. `lacunas`.** O agente faz as perguntas do fim do briefing antes de escrever. A
resposta vira registro (fonte com data, premissa com teste, decisão com gênero), não
só prosa. Lacunas que o script gera hoje:

- sem versão anterior (é nascimento), sem ciclo, sem fontes
- fonte citada que não está na lista; escolha sem fonte
- estágio obrigatório sem escolha vigente
- aposta com horizonte vencido; critério de matar vencido; aposta ativa sem leitura
- KR sem leitura ligada, leitura inexistente, leitura velha
- premissa com prazo vencido ("refutada reabre a escolha X")
- pergunta da versão anterior ("foi respondida? a escalada não se herda")
- campo que foi proposta do agente e ninguém confirmou
- sempre: qual o elo mais fraco, e qual o insight

### Fase Montar

**4. `cascata`: as cinco escolhas.** Em nascimento, as cinco, uma por vez. Em
revisão, só as com sinal; sem nenhuma, a etapa salta.

Cada escolha é uma alça `escolha` com `estagio`, `serve` (a de cima), `renuncia`,
`fonte`, `estado` (`vigente`, `revisada`, `abandonada`) e, na capacidade,
`situacao` (`existe`, `em_construcao`, `nao_existe`). O slug é o handle: o texto
muda sem mudar o slug. Escolha que sai fica `abandonada` e permanece riscada por uma
versão inteira.

As perguntas que o agente faz por estágio (régua do método):

| Estágio | Perguntas e testes |
|---|---|
| **Aspiração** (o que é vencer, aos olhos de quem compra) | Teste do oposto: o contrário é absurdo? Um concorrente faria o oposto? Cliente antes de dinheiro: quem é a pessoa e o que muda na vida dela? Valor na vida, não no produto. Vencer, não participar. Pragmatismo: vitória funcional vale. |
| **Onde jogar** (recorte de cliente, geografia, canal, produto) | A arte do não. Teste da dor: que mercado grande ficou de fora, quanto vale? Amarração com a aspiração. Recorte, não portfólio (lista de entregas é roadmap). A geografia costuma ser a que dói. |
| **Como ganhar** (vantagem de custo ou valor) | Teste da vantagem. Ilusão das melhores práticas (qualidade é obrigação). Teste da imitação: um concorrente com dinheiro copia em seis meses? O que nos bastidores torna caro copiar? Regra de preço não é vantagem. |
| **Capacidades** (3 a 5) | Não é departamento: frase com verbo e medida. Filtro da vantagem: cada uma é motor de um como ganhar. Mediocridade intencional: a renúncia é a distração fatal. `situacao` como lente de gap. |
| **Sistemas** | Ritos, medidas e regras que mantêm a capacidade viva. Os ritos que já existem na casa são os sistemas, incluindo o rito que lê este artefato. Evento marcado é próximo passo, não sistema. Pode ficar vazio com aviso. Não exige renúncia. |

`serve` só sobe um estágio: onde jogar serve aspiração, como ganhar serve onde
jogar, capacidade serve como ganhar, sistema serve capacidade.

**5. `apostas`.** O que vai provar cada escolha neste ciclo. Campos: `serve` (uma
escolha), `problema`, `hipotese` em "se, então, porque", `indicador` com unidade,
`criterio_matar` com data, `horizonte`, `estado` (`proposta`, `ativa`, `validada`,
`morta`, `concluida`), `quadrante` e `leitura` opcionais. Aposta que não serve
escolha é iniciativa e vai para o roadmap; sem critério de matar não entra.
Quadrante pela regra de ouro: a empresa já tem expertise de produto **e** de
mercado? Sim às duas, expansão de mercado; não a qualquer uma, aposta de risco.

**6. `okrs`.** Objetivo é frase e serve uma escolha ou aposta. KR é alça própria,
com `objetivo`, `baseline`, `meta`, `unidade`, `direcao` (`sobe`, `desce`,
`binario`), `leitura` (slug que o one page envia) e `prazo`. Outcome, não output.
"Lançar o app" é entrega; "cinco mil lojas ativas" é resultado. Dica do método: os
melhores KRs costumam estar escondidos nos indicadores das apostas.

**7. `premissas`: o que tem de ser verdade, e o elo mais fraco.** Detalhado na
seção 5 abaixo.

**8. `escrita`: o corpo.** Prosa livre, sem tabela: o que mudou, por que o elo é o
elo, o que o conselho decidiu olhar. Cascata, apostas e KRs são montados das alças
pelo render; escrevê-los no corpo é reprovado. Aqui o agente classifica os itens de
ação e decisão (seção 6).

**9. `insight`.** Uma frase: o que mudou nesta revisão. "Se você não consegue
escrevê-la, a revisão não está pronta."

### Fase Fechar

**10. `conferir`: mostrar antes de publicar.** Devolve o rascunho na conversa com a
lista do que está marcado como proposta do agente, e espera convergência explícita.
"Toda mensagem antes dela é correção, nunca ordem de publicar." Este é hoje o único
passo explicitamente de refinamento.

**11. `validar`.** `validar.sh envelope.json [--anterior ...]` (detalhe na seção 7).

**12. `publicar`.** Dois destinos, mesmo envelope:

- Com origem (API): `publicar.mjs --rascunho` grava e devolve URL de conferência;
  `--publicar` fecha a versão, que fica imutável. A origem valida com a mesma régua.
- Sem origem: `render.mjs` monta uma página HTML de duas abas (Cascata; Apostas e
  resultados) com o histórico de versões embutido, e o agente publica. Na
  republicação, publica na mesma URL. Nunca renderizar sem `--anterior` quando já
  existe versão, ou a página recarimba a história como v1.

### Fase Comunicar

**13. `comunicar`.** A publicação é o link. O agente mostra quem recebe o quê e por
quê, e espera resposta item por item. Silêncio não é autorização.

**14. `binding`.** Passos que o cliente declarou depois da comunicação (abrir
trabalho, registrar em outro sistema, pautar o conselho). Mesmas regras: sugerir,
mostrar, esperar.

### Recusas

Não publica sem insight; sem elo mais fraco nomeado e explicado; com escolha sem
renúncia ou fonte **depois de ter perguntado**; com aposta sem critério de matar;
com pergunta sem destinatário; com cascata que não fecha. E "recusar demais também
é defeito": uma estratégia com uma escolha fraca registrada vale mais que um
conselho sem artefato.

---

## 5. "O que tem de ser verdade" e o elo mais fraco

Como está hoje:

- Etapa 7, **depois** de cascata, apostas e OKRs.
- **Premissas:** duas a quatro abertas, cada uma alça `premissa` com `sobre` (slug de
  escolha ou aposta), `teste` com critério observável, `prazo` e `estado` (`aberta`,
  `confirmada`, `refutada`). "Premissa sem teste é esperança." Exemplo do envelope:
  "A loja pequena prefere fotografar o bloco a digitar o pedido", sobre uma aposta,
  teste "ao menos 25 das 40 lojas da coorte enviando foto na segunda semana", prazo
  2026-11-15.
- **Premissa refutada é gatilho de reabertura** da escolha no conselho seguinte (o
  briefing a lista em "escolhas com sinal").
- **Elo mais fraco:** depois das premissas, o agente percorre a cadeia de cima para
  baixo com a liderança e pergunta onde ela quebra. Vai em `meta.elo_mais_fraco`
  (slug de escolha, aposta ou premissa; o validador aceita os três) e o corpo explica
  por quê. Obrigatório para publicar. Pode ser proposta do agente (`meta.propostas`).
- **Coerência da cadeia** (método): onde jogar sustenta a aspiração; como ganhar é o
  caminho lógico no terreno; capacidades viabilizam o como ganhar; sistemas
  sustentam as capacidades.
- **Tensão e oportunidade por estágio** (método): para cada estágio, o que está em
  tensão com a realidade observada e qual ação concreta destravaria. "A resposta
  entra como decisão com gênero, não como matriz." Esta instrução está no método
  mas **não aparece como passo explícito no SKILL.md**.

---

## 6. Ação e decisão

A estratégia reusa a alça `decisao` do one page, com os mesmos seis gêneros:

| Gênero | O que é | Exige |
|---|---|---|
| `decisao_roadmap` | mudança de rumo já tomada | `afeta_roadmap_slug` (o que move) |
| `risco` | algo que pode dar errado | `payload.impacto` (e `quem_resolve`, não validado) |
| `pergunta` | precisa de decisão de terceiro | `escala_para` com ao menos um destinatário nomeado |
| `nota_metodo` | ressalva sobre como um número foi apurado | (no one page: qual indicador afeta; na estratégia, também é usada para "escolha fraca registrada") |
| `dependencia` | espera por alguém de fora | prazo e quem (não validado) |
| `proximo_passo` | o que vem a seguir | nada |

Como aparece na página: perguntas agrupadas por quem responde ("Para CEO"), riscos à
vista, e o resto (próximo passo, nota de método, dependência, decisão de roadmap)
recolhido num `<details>` com contagem. Sem itens, a página declara "Nenhuma decisão
nesta versão, e isso está declarado".

Regras de herança: perguntas da versão anterior **não são herdadas**; o briefing
lista cada uma como lacuna ("foi respondida? se segue de pé, para quem?").

Onde os itens nascem na conversa hoje:

- etapa 4, terceira devolução de escolha fraca → `nota_metodo`
- etapa 7, tensão e oportunidade (só no método) → decisão com gênero
- etapa 8, ao escrever o corpo → o agente classifica o que surgiu
- etapa 13, quem recebe o quê → os destinatários das perguntas

---

## 7. O que a máquina confere (validar.sh)

**Reprova:** JSON inválido ou `kind` errado; slug ausente, fora do formato ou
duplicado; texto vazio; escolha sem estágio, renúncia (exceto sistema) ou fonte;
`serve` ausente, inexistente ou de estágio errado; aposta sem `serve`, hipótese,
indicador, critério de matar ou horizonte; objetivo sem `serve`; KR sem objetivo,
baseline, meta, unidade ou direção; premissa sem `sobre` ou teste; decisão fora das
regras dos gêneros; publicação sem insight, sem elo mais fraco válido, ou sem
escolha vigente em aspiração, onde jogar e como ganhar; tabela markdown no corpo;
travessão, pontuação em série e vocabulário proibido no corpo e nas alças.

**Avisa:** capacidades fora de 3 a 5; nenhum sistema; premissas abertas fora de 2 a
4; quadrante ou situação fora da lista; hipótese sem "porque"; proposta do agente
pendente ao publicar; slug da versão anterior que sumiu sem estado de saída;
leituras no envelope.

**O que a máquina não vê, e a condução manda olhar:** se a renúncia dói de verdade,
se o como ganhar sobrevive ao teste da imitação, se o KR é outcome, se o elo mais
fraco é mesmo o mais fraco.

`fumaca.sh` é a régua da régua: aprova o exemplo, reprova cada violação numa cópia
mutada, e confere que a v1 fica intacta sob a v2.

---

## 8. Camada opcional: módulo ProductOps

Só liga quando a sessão tem as tools MCP `ciclo_ativo` e `estrategia_contexto`. Sem
elas, nada muda e o agente não fala do módulo.

O que acrescenta:

- **No briefing:** `estrategia_contexto` traz `propostas_aceitas` (aplicadas nas
  alças, ditas em voz alta, e não marcadas como proposta do agente porque a
  liderança já aceitou na tela), `anotacoes_abertas` (viram pauta junto das
  lacunas), e `apostas_do_ciclo` / `okrs_do_ciclo`, que são fonte de verdade.
  Divergência com o envelope se resolve perguntando; o módulo vence em estado.
- **Ao publicar:** a origem só carrega a cascata, então `traduzir.mjs` parte o
  envelope. A cascata vai pela origem; apostas e OKRs vão pelas tools
  (`aposta_criar`, `aposta_avaliar_ia`, `kr_avaliar_ia`, `okr_criar`), cada uma
  mostrada como rascunho e confirmada antes de gravar. Avaliação `VAGUE` ou
  `MISALIGNED` volta para a conversa.
- **Depois de publicar** (no texto original; hoje é `estrategia_analisar`, ver a nota do topo): oferecia a avaliação, em que a IA do servidor lê
  a cascata e grava propostas como anotações para o próximo conselho. Ninguém as
  aplica sem decisão; as aceitas voltam em `propostas_aceitas`.
- **Só com o módulo:** aposta avulsa entre conselhos, e revisão semanal das apostas
  por squad ("matamos, pausamos ou ganha prazo novo?").
- Conduta: ler antes de escrever, mostrar antes de gravar, status sempre com motivo,
  proposta não é decisão, número (RICE, saúde de OKR) é do sistema.

---

## 9. Pontos de atrito que observei (pauta para a conversa)

Leitura minha do material, não decisões tomadas.

**Refinamento antes de publicar**

1. O refinamento hoje é basicamente a etapa 10: mostrar o rascunho e esperar
   convergência. Não há uma passada estruturada de crítica antes disso: algo como
   "releia a cascata inteira de cima para baixo, aplique os testes de cada estágio
   contra o texto final e diga onde ainda está fraco". Os testes são aplicados
   escolha a escolha durante a montagem, mas ninguém confere o conjunto depois.
2. A lista "o que a máquina não vê" (renúncia que dói, teste da imitação, KR
   outcome, elo certo) está no método, mas o SKILL.md não diz quando e como o agente
   leva essas quatro perguntas à liderança. Podia virar um roteiro explícito dentro
   de `conferir`.
3. A regra das duas devoluções é por escolha, mas não diz o que conta como uma
   devolução, nem se vale também para aposta, KR e premissa.
4. O método diz "sugere no máximo duas reescritas"; o SKILL.md diz "devolve a
   pergunta no máximo duas vezes". São coisas parecidas, mas não iguais.

**Cascata**

5. Em revisão, só reabre escolha com sinal, e o sinal é mecânico (premissa
   refutada, aposta morta, KR fora de rota, fonte velha). Não está escrito o que
   fazer quando a liderança quer mudar uma escolha sem sinal, ou quando o sinal
   vem de fora (concorrente, mercado, ata nova).
6. A amarração ("o onde jogar já amarrando à aspiração") é instrução de conversa,
   mas a máquina só confere que `serve` aponta o estágio certo, não se faz sentido.
7. Sistemas não exigem renúncia e podem ficar vazios; na prática pode ser o estágio
   que sempre fica de lado.

**O que tem de ser verdade**

8. As premissas entram na etapa 7, depois de cascata, apostas e OKRs. No Playing to
   Win original, "o que teria de ser verdade" é a ferramenta para **escolher** entre
   possibilidades, antes de fixar a escolha. Aqui vira validação no fim. Talvez
   devesse aparecer também durante a etapa 4, em especial no como ganhar.
9. Premissa só pode ser `sobre` escolha ou aposta, e de 2 a 4 no total. Não há
   orientação sobre a que estágio priorizar, nem sobre premissas de mercado ou de
   cliente que sustentam a aspiração.
10. Pequena inconsistência: a tabela de campos do método diz que o elo mais fraco é
    "slug da escolha ou aposta"; a seção de coerência e o validador aceitam
    premissa também.
11. "Tensão e oportunidade por estágio" está no método e não no fluxo da skill.

**Ação e decisão**

12. Os seis gêneros vieram do one page e foram pensados para status semanal.
    `decisao_roadmap` exige `afeta_roadmap_slug`, que não existe na estratégia (não
    há roadmap aqui). `nota_metodo` foi desenhada para ressalva sobre um número e
    está sendo usada para "escolha fraca registrada": é sobrecarga de sentido.
13. Falta um gênero ou campo para "decisão estratégica tomada neste conselho"
    (abandonar uma escolha, matar uma aposta, aceitar um risco) com o slug que ela
    afeta. Hoje a decisão de largar aparece pela escolha riscada, mas a decisão em
    si não tem alça.
14. `risco` exige impacto mas não valida `quem_resolve`; `dependencia` pede prazo e
    quem na tabela, mas o validador não confere.
15. Não há momento explícito no fluxo para levantar riscos e perguntas: eles
    surgem onde der (etapa 4, 7, 8). Uma passada dedicada, ligada ao elo mais fraco
    e às premissas, poderia ajudar.

---

## 10. Onde ler o original

- Método: `plugins/rumbo-core/metodo/estrategia.md`
- Skill: `plugins/rumbo-core/skills/rumbo-estrategia/SKILL.md`
- Mapa das etapas: `plugins/rumbo-core/skills/rumbo-estrategia/scripts/estado.mjs`
- Briefing e lacunas: `.../scripts/contexto.mjs`
- Régua: `.../scripts/validar.sh`
- Forma do envelope: `.../scripts/exemplo-envelope-estrategia.json`
- Módulo: `plugins/rumbo-core/modulos/productops/MODULO.md`
- Plano de construção e decisões: `docs/plano-rumbo-estrategia.md`
- Gêneros de ação e decisão: `plugins/rumbo-core/metodo/one-page.md`, seção "Ação e decisão"
