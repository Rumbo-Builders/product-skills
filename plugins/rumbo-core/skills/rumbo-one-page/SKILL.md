---
name: rumbo-one-page
description: >-
  Cria ou atualiza o one page semanal de um time de produto, com roadmap,
  objetivos, indicadores e ação e decisão, guiando a conversa etapa por etapa,
  e publica o artefato. Use quando pedirem one page, one pager, "me guia no one
  page", atualizar o one page, atualizar o roadmap do time, "o que mudou essa semana",
  preparar a pauta do 1:1 de produto, atualizar os indicadores do squad, ou
  quando disserem que precisam publicar o status do produto. Skill genérica: se
  o pedido for de um time específico e existir skill derivada dele, ela é que
  roda.
---

# rumbo-one-page

> **Onde estão os arquivos.** `${CLAUDE_PLUGIN_ROOT}` é a raiz do plugin rumbo-core:
> a pasta que contém `metodo/`, `scripts/` e `skills/`, duas acima deste SKILL.md.
> O Claude Code a define. Em outro agente (o Codex, por exemplo), troque pela raiz
> real ao ler um caminho e ao rodar um comando, ou defina a variável no mesmo
> comando: `CLAUDE_PLUGIN_ROOT=<raiz> node ...`.

Skill de método. Cliente-agnóstica: não conhece sistema, canal nem pessoa.
Quando roda a partir de uma derivada, o binding vem dela.

## Antes de qualquer coisa

Leia, nesta ordem:

1. `${CLAUDE_PLUGIN_ROOT}/metodo/_principios.md`
2. `${CLAUDE_PLUGIN_ROOT}/metodo/conducao.md`: como guiar a conversa, etapa por
   etapa. Vale o fluxo inteiro.
3. `${CLAUDE_PLUGIN_ROOT}/metodo/one-page.md`, que traz a estrutura, os seis
   géneros de decisão, os dois modos de roadmap e o contrato do dossiê
4. `${CLAUDE_PLUGIN_ROOT}/metodo/one-page-blocos.md`: o núcleo, o desenho de cada
   time e o catálogo de blocos (ações, trilha mensal, verba, checklist, funil)
5. `${CLAUDE_PLUGIN_ROOT}/metodo/escrita.md`, para a redação

**Você não calcula número.** Escrever um número plausível neste documento é o
pior defeito possível, porque ele circula e alguém decide com base nele.

**Mas quem conduz o produto é uma fonte.** Número que não está no dossiê não é
número inexistente: é número que você ainda não perguntou. Métrica apurada à mão
é o caso comum, e entra registrada com `fonte: "manual"` — isso é procedência
declarada, e o método a aceita. Diante de um número sem origem, a ordem é
**perguntar, registrar, e só então recusar** se não vier resposta. Recusar de
saída transforma a ferramenta em obstáculo, e já transformou: uma sessão inteira
se recusou a escrever o documento com números que a pessoa tinha acabado de
informar. Leia "Procedência" no método antes de recusar qualquer número.

**Você não escreve tabela.** Nem a grade do roadmap, nem a tabela de
indicadores. As duas são montadas dos dados: a grade vem do artefato de roadmap
que o one page aponta, e a tabela vem das leituras que você envia. Escrever
qualquer uma das duas em markdown no corpo é o erro mais caro deste fluxo,
porque produz um documento que parece certo e diverge da fonte na semana
seguinte.

**Marcador vale na PROSA, e só nela.** Fora do bloco de indicadores, para
explicar o que a tabela não diz, use `{{identificador}}` e
`{{identificador.delta_pct}}`. Quem substitui é o renderizador, a partir da
leitura congelada na versão.

## Antes de ler qualquer arquivo, saiba de quem é o documento

**Sem time nomeado, pergunte. É a primeira coisa, antes de abrir arquivo.** Ler
método e binding para depois descobrir que não se sabe o time gasta o tempo de
quem está esperando.

**Se receberem um artefato pronto colado na conversa, pergunte de qual time e de
qual ambiente ele veio, antes de comparar com o dossiê.** Não presuma que é do
time que você está montando. Isso já custou uma sessão inteira: um documento de
outro time, vindo de outro ambiente, foi comparado contra o dossiê da produção, e
a divergência inteira foi interpretada como dado faltando. Duas perguntas de uma
linha teriam evitado.

O conteúdo colado costuma ser bom insumo. O que não se herda dele são os números
e a grade, que pertencem ao time de onde vieram.

## Binding, e o caminho de quem não tem nenhum

A derivada traz a origem dos dados, o destino da publicação, os canais e o
vocabulário. Sem binding, pergunte antes de começar: **de onde vem o dossiê,
qual time, e para onde publica.**

**Precedência, e ela importa quando há derivada.** O binding da derivada vence o
perfil da casa em `.rumbo/perfil.md`, que vence o default. Com uma derivada ativa,
o `.rumbo/` só preenche o que o binding não definiu, e nunca reescreve
vocabulário, tom, origem ou destino que a derivada declarou. Um `.rumbo/`
esquecido numa pasta de trabalho não pode mudar o documento de um cliente sem
ninguém perceber.

**Há dois destinos, e o método os trata como equivalentes.** Leia "Dois destinos"
no método antes de escolher.

| | Origem que fala o contrato | Página publicada por você |
|---|---|---|
| Contexto | `contexto.mjs`, busca o dossiê | `contexto-local.mjs`, recebe arquivos |
| Publicação | `publicar.mjs`, envia o envelope | `render.mjs`, monta a página |
| Precisa de | `RUMBO_ONEPAGE_API` e `RUMBO_ONEPAGE_TOKEN` | nada |
| Versiona | a origem | a própria página, no bloco embutido |

O segundo é o padrão para quem chega sem infraestrutura. **A régua é a mesma nos
dois**, e é isso que impede o destino barato de virar o destino ruim.

**Módulo ProductOps, só se as tools estiverem na sessão.** Pela regra única,
o módulo está ligado quando qualquer tool do ProductOps aparece entre as suas, com o nome puro ou com prefixo de servidor (`mcp__<servidor>__ciclo_ativo`); a regra inteira está em `MODULO.md`, "Quando ligar". Ligado, leia a seção "No one page" de
`${CLAUDE_PLUGIN_ROOT}/modulos/productops/MODULO.md` antes do passo 2: o desenho do
squad, os OKRs dele, os sinais apurados e o que andou nas apostas vêm de lá. Sem as tools, ignore este parágrafo e
não fale dele.

## Primeira vez: configure antes de escrever

Se não existe `.rumbo/marca.json` na pasta de trabalho e não há binding, **pare e
configure**. São seis perguntas, e elas valem para todas as skills do core, não só
para este documento:

1. Como a casa se chama, e por extenso.
2. A cor da marca. Uma só já basta; uma segunda entra como acento gráfico.
3. As duas fontes, título e corpo. Na página elas vêm do Google Fonts, que é o
   único host que o artefato aceita: nome que não existir lá cai no genérico em
   silêncio.
4. Um símbolo em SVG para a página, e o PNG do logo se houver deck. Opcionais, e
   os dois artefatos saem bem sem eles.
5. O tom: como se escreve aqui, e o que esta casa chama diferente.
6. As ressalvas da casa, para o rodapé das release notes. **O one page não tem
   rodapé**, então elas não aparecem nele: se um cuidado precisa sair no one page,
   ele entra no corpo ou numa decisão, e não numa nota de pé.

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/configurar.mjs --casa <id> --nome "<Nome>" \
  --acento "#333333" [--destaque "#888888"] [--fonte-titulo "..."] \
  [--fonte-corpo "..."] [--simbolo simbolo.svg] [--logo-claro logo.png] \
  [--tom "..."] [--ressalva "uma ressalva"]
```

Ele grava `.rumbo/` com `marca.json`, `tema.css`, `tema.js` e um `perfil.md` com
lacunas. **O tom e o vocabulário você escreve no `perfil.md`**, porque são prosa:
quem lê tom é o modelo, e o script só cuida do que é conta. Depois de preenchido,
leia-o antes de redigir.

**Leia o que o script responde sobre contraste, e repasse.** Cor de marca não vira
cor de letra só porque é bonita: um acento que reprova é escurecido até passar, e o
original fica reservado para preenchimento. Quem enxerga bem nunca percebe o
defeito, e por isso ele precisa ser dito em voz alta.

O que é só deste artefato, e não da casa, vai num `.rumbo/one-page.config.json`
opcional: o `desenho` do time, o `tom` do time, `roadmap.modo`,
`roadmap.granularidade`, `movimento.origem`, um `titulo` próprio e
`"assinatura": false` para tirar a linha da Rumbo do rodapé. Sem ele o render usa
os defaults, e o desenho de produto.

**O tom do time ajusta o registro, dentro da régua da casa.** Marketing escreve
mais direto, jurídico mais formal: o `tom` do config diz como, em uma ou duas
frases, e você o lê na etapa do corpo. Travessão, ênfase gráfica e vocabulário de
consultoria continuam reprovando em qualquer tom.

Sem configuração nenhuma o documento sai no tema neutro, que **não é a identidade
de ninguém** e existe só para a página ser legível antes da primeira conversa.

## Quatro modos

O one page não é só de time de produto. Cada time tem um **desenho**: as abas, os
blocos de cada aba e os títulos (`metodo/one-page-blocos.md`). O modo diz o que a
conversa faz com ele. Se o pedido não disser, pergunte, com uma regra só: **time
sem one page ainda é `desenhar`; time com one page é `semana`.**

| Modo | Quando | O que a conversa faz |
|---|---|---|
| `desenhar` | o primeiro one page de um time | o desenho antes de qualquer número, e um esqueleto para ver |
| `semana` | a atualização de toda semana | uma etapa por bloco que o time escolheu |
| `leitura` | semana sem mudança de estrutura | só os números, o que mudou e a frase |
| `reformar` | o time quer outra forma | muda o desenho, sem reescrever o conteúdo |

```bash
node ${CLAUDE_PLUGIN_ROOT}/skills/rumbo-one-page/scripts/estado.mjs --time <id> --modo desenhar|semana|leitura|reformar
```

**O desenho vem do sistema da casa, quando há.** Com o módulo, leia o desenho do
squad (o `MODULO.md` diz a tool) e grave-o em `.rumbo/one-page.config.json`, campo
`desenho`, antes de abrir o mapa da semana: o roteiro sai dos blocos dele. Sem o
módulo, o desenho mora nesse config.

### Desenhar (`--modo desenhar`)

1. **O time.** Que time é, quem lê o one page, em que rito.
2. **O que se decide.** O que quem lê precisa decidir toda semana. É dessa resposta
   que sai o desenho, não do tipo do time.
3. **A proposta.** O desenho de partida do tipo (`scripts/desenhos.json`), mostrado
   como lista de abas e blocos, com uma frase de por que cada bloco está ali.
4. **Cada bloco**, um por mensagem quando houver dúvida: fica, sai, troca de nome.
   A regra é a do método: bloco só entra se alguém o lê toda semana. Insight,
   objetivos e ação e decisão ficam na primeira aba sempre.
5. **As abas**: títulos, ordem, e onde cada bloco mora.
6. **O tom do time**, em uma ou duas frases, para o `tom` do config.
7. **O esqueleto.** Grave o desenho em `.rumbo/one-page.config.json` e renderize:

   ```bash
   node ${CLAUDE_PLUGIN_ROOT}/skills/rumbo-one-page/scripts/render.mjs --esqueleto <tipo> \
     --saida .rumbo/esqueleto.html
   ```

   Ele desenha o desenho com dado de exemplo, na marca da casa, com o aviso de que
   nenhum número é do time. Mostre a página à pessoa e espere: é aqui que ela vê se
   o desenho cabe nela.
8. **Gravar o desenho.** Com o módulo, no squad, depois do sim. Sem ele, o config
   já é o desenho.
9. **A primeira versão** segue pelo modo `semana`, em branco.

### Semana (`--modo semana`)

O Fluxo abaixo. As etapas de bloco (5 em diante) são as do desenho do time, na
ordem dele: o mapa já sai montado, e o time de jurídico não passa pelo roadmap.

### Leitura (`--modo leitura`)

Para a semana em que nada estrutural mudou: herde a última publicada, peça os
números da semana com a origem de cada um, pergunte o que mudou (status de ação,
prazo, uma decisão nova) e escreva a frase. A régua, a conferência e a publicação
são as de sempre. Se no meio aparecer mudança de estrutura, pare e diga que é
`semana`.

### Reformar (`--modo reformar`)

Mostre o desenho de hoje inteiro, uma vez. Pergunte o que sai, o que entra e o que
muda de nome, renderize o esqueleto com o desenho novo e grave depois do sim. O
desenho novo vale **da próxima versão em diante**; as versões publicadas continuam
mostrando o desenho que tinham.

## Conduzir, e deixar ver

**A primeira chamada da sessão é esta, antes de qualquer arquivo:**

```bash
node ${CLAUDE_PLUGIN_ROOT}/skills/rumbo-one-page/scripts/estado.mjs --time <identificador>
```

Ele imprime o mapa das etapas, onde a montagem parou, e a linha que diz se
alguma mensagem já saiu. Havendo montagem em andamento, **pergunte se continua
ou recomeça**, em vez de decidir por quem está esperando.

A cada etapa vencida, marque e mostre o mapa de novo:

```bash
node ${CLAUDE_PLUGIN_ROOT}/skills/rumbo-one-page/scripts/estado.mjs --time <id> --concluir lacunas
node ${CLAUDE_PLUGIN_ROOT}/skills/rumbo-one-page/scripts/estado.mjs --time <id> --escolher base="partiu da v4"
```

Isso existe porque o roteiro só vivia nesta prosa, e prosa não sobrevive a
sessão longa: um PM montou e remontou o mesmo documento sem nunca saber em que
ponto estava, nem em que ponto a coisa ficava irreversível. Marcar etapa não é
burocracia: é o que permite retomar amanhã.

**O mapa é o roteiro que a pessoa vê.** Mostre-o antes da primeira pergunta, e
diga o número de cada etapa ao entrar nela. A condução segue
`metodo/conducao.md`: uma etapa por mensagem, uma pergunta só no fim, e na
atualização, depois de mostrar uma vez o one page da semana passada inteiro e
curto, cada seção em Hoje (o que a versão anterior dizia), Proposta (o que muda
nesta semana), Por quê e Fonte. Sem tabela larga na conversa: a tabela é do
render.

O mapa mora em `scripts/estado.mjs`, numa lista só, e as etapas de lá são as
deste Fluxo, uma a uma, pelo mesmo id. Mudou a granularidade, mudou a lista, e
a prosa acompanha.

Depois de publicar, `--descartar`: o estado guarda número que já virou versão, e
guardar convida a reaproveitar leitura velha na semana seguinte.

## Fluxo

1. **De onde parte esta versão** (etapa `base`). **Pergunte antes de buscar
   qualquer coisa**: partir da última publicada, de uma versão específica, ou em
   branco.

   ```bash
   node ${CLAUDE_PLUGIN_ROOT}/skills/rumbo-one-page/scripts/base.mjs --time <id>              # da ultima publicada
   node ${CLAUDE_PLUGIN_ROOT}/skills/rumbo-one-page/scripts/base.mjs --time <id> --versao 4   # de uma especifica
   node ${CLAUDE_PLUGIN_ROOT}/skills/rumbo-one-page/scripts/base.mjs --time <id> --branco     # do zero
   ```

   **O que não se herda é a parte que importa, e o script diz em voz alta o que
   tirou.** Some o insight, que era o que mudou naquela versão. Somem os valores
   atuais dos objetivos, porque número herdado é dado velho publicado como novo.
   Somem as listas de escalada, porque nomear alguém já é enviar DM, e reenviar
   sem pedido não se faz. Some a alça de métrica, que quem cria é o servidor.

   Tirar a escalada deixa as decisões de género `pergunta` inválidas de
   propósito, até alguém reconfirmar que a pergunta segue de pé e para quem. A
   recusa ali é a pergunta certa, não um defeito.

   Sem versão anterior, o script diz e segue em branco. Primeira vez de um time
   não tem esta escolha, e o mapa não deve fingir que tem.

2. **Buscar contexto e montar o briefing** (etapa `contexto`).

   ```bash
   node ${CLAUDE_PLUGIN_ROOT}/skills/rumbo-one-page/scripts/contexto.mjs \
     --time <identificador> [--ano 2026] [--trimestre 3]
   ```

   Ele busca o dossiê e a versão anterior, apura o diff, e devolve um briefing em
   markdown. **Leia o briefing, não o JSON.** O arquivo cru fica salvo ao lado
   para consulta pontual, e não deve ser lido inteiro.

   **Sem origem que fale o contrato, use o irmão local:**

   ```bash
   node ${CLAUDE_PLUGIN_ROOT}/skills/rumbo-one-page/scripts/contexto-local.mjs \
     --anterior anterior.json --movimento movimento.json --triagem triagem.json
   ```

   Ele não busca nada: recebe a versão anterior, extraída da página publicada com
   `node ${CLAUDE_PLUGIN_ROOT}/scripts/extrair.mjs pagina.html` (grava
   `.rumbo/anterior.json`), e o movimento do período, que **você monta** lendo a
   ferramenta onde o trabalho do time vive. O formato está em
   `scripts/exemplo-movimento.json`.

   **A triagem é sua; a conta é do script.** Escolher o que da ferramenta
   pertence ao roadmap é julgamento: nem toda entrega registrada é aposta do
   produto, e uma regra determinística para isso enche o roadmap de trabalho que
   ninguém pediu. Registre cada decisão em `triagem.json`, com o motivo de quem
   ficou de fora: identificador já decidido não volta a ser perguntado, e é isso
   que permite ler a ferramenta toda semana sem reclassificar a lista inteira.

3. **Abrir pelas lacunas** (etapa `lacunas`). O briefing termina com as perguntas que o dossiê não
   respondeu. Faça-as antes de escrever. Este é o passo que separa um documento
   honesto de um bonito.

   **A resposta vira registro, não só texto.** Número que vier na resposta entra
   como leitura com `fonte: "manual"`; contexto que vier vira nota de método ou
   item de ação e decisão. Perguntar e depois usar a resposta apenas na prosa
   desperdiça a apuração: na semana seguinte ela não existe mais, e você pergunta
   de novo.

4. **Confirmar o roadmap, e publicá-lo primeiro** (etapa `roadmap`, só quando o desenho do time tem o bloco de roadmap). Carregue o anterior e pergunte
   o que mudou, em vez de pedir para descrever de novo. Se o modo ou a
   granularidade mudarem, é escolha de quem conduz, e vale da versão em diante.

   O roadmap é **artefato próprio**: publique-o antes, e depois faça o one page
   **apontar a versão** publicada. Se nada mudou nele, aponte a mesma versão de
   novo. Nunca redigite a grade dentro do one page.

   **O apontamento é obrigatório quando já existe roadmap publicado**, e a origem
   recusa sem ele. Não é formalidade: sem apontar, a leitura cai no roadmap mais
   recente, e publicar um roadmap novo mudaria a grade de um one page já
   publicado sem ninguém ter editado nada. Sem roadmap nenhum ainda, siga: a
   página declara a ausência.

   **Use `scripts/exemplo-envelope-roadmap.json` como forma.** Ele mostra o que
   não se adivinha: `faixa` e `coluna` moram dentro de `payload`, a faixa
   "outros" é declarada como as demais, e `payload.issues` anexa as ocorrências
   de cada célula. Adivinhar essa forma já custou quatro tentativas às cegas.

5. **Os blocos do time**, um por etapa, na ordem do desenho. O briefing traz, em
   "Desenho do time e por onde começar", os sinais de cada bloco: comece por eles,
   dentro da etapa do bloco, nunca como diagnóstico na abertura.

   - **Objetivos** (etapa `objetivos`). Um por mensagem: a leitura nova de cada KR,
     de quando é, e se o status do objetivo ainda é verdade. Status é do dono:
     proponha, e pergunte. Com o sistema da casa, os KRs vêm de lá e não se
     redigitam, e mudar o status é a `rumbo-okrs`, modo `acompanhar`, só daquele
     objetivo; volte ao one page em seguida.
   - **Trilha mensal** (etapa `trilha`). A meta do mês corrente contra o realizado,
     KR a KR. "A definir" é pergunta ao dono: quem define, e até quando.
   - **Indicadores e saúde** (etapas `indicadores` e `saude`). As leituras da
     semana, em lista: o valor, a variação que o briefing já apurou, e a observação
     que você propõe ("ruim e melhorando"). Saúde é leitura com
     `categoria: "saude"`. Número sem origem é pergunta, nunca estimativa.
   - **Ações** (etapa `acoes`). As vencidas primeiro: andou, mudou de prazo, ou
     cai? Depois as novas. Cada uma com prazo, status do vocabulário e o KR que
     move. Cancelada fica, riscada.
   - **Verba** (etapa `verba`). O realizado do mês com a fonte, contra o aprovado.
   - **Checklist** (etapa `checklist`). O que foi feito, o que venceu, com o dono.
   - **Funil** (etapa `funil`). A contagem de cada estágio, com a regra e a fonte.
   - **Outras frentes** (etapa `frentes`). Curto. Se a lista cresce, pergunte se
     falta um objetivo.

   Use os exemplos como forma: `scripts/exemplo-envelope.json` para produto,
   `exemplo-envelope-marketing.json` e `exemplo-envelope-juridico.json` para os
   outros blocos.

6. **As apostas do time** (etapa `apostas`). Com o sistema da casa: o que andou
   em cada aposta do squad desde a semana passada, em uma linha cada. Critério de
   matar vencido ou marco atrasado vira pergunta, e mudar status é a
   `rumbo-apostas`, modo `acompanhar`. Sem apostas no sistema, a etapa salta.

7. **Ação e decisão** (etapa `decisoes`). As da versão anterior, uma a uma:
   fecha, segue (para quem, de novo), ou vira outra coisa. Depois, as que
   surgiram nas etapas 5 e 6. Classifique cada item em um dos seis géneros, e
   preencha o que aquele género exige.

8. **O corpo** (etapa `escrita`). A narrativa é sua; os números não. O corpo do
   one page é a **narrativa que a tabela não conta**. Se você não tem nada a dizer
   além do que os números já mostram, deixe curto. Você escreve, a pessoa revisa,
   no registro do `tom` do time quando o config tem um.

9. **O insight e o farol** (etapa `insight`). Uma frase: o que é essencial e o que mudou.
   Se você não consegue escrevê-la, o documento ainda não está pronto.

   **O farol do squad** vai junto: `meta.farol` com `verde`, `amarelo` ou
   `vermelho`, e `meta.farol_motivo` numa frase. É o que o acompanhamento de
   squads mostra no card. É julgamento de quem conduz o squad: **pergunte, não
   infira** de indicador ou de risco aberto. Sem resposta, omita os dois campos;
   o card fica "sem status", que é honesto.

10. **Mostrar antes de publicar** (etapa `conferir`). Devolva o rascunho na conversa e espere
   convergência. Publicar texto não aprovado é desperdício, e a publicação
   comunica.

11. **Validar** (etapa `validar`).

   ```bash
   bash ${CLAUDE_PLUGIN_ROOT}/skills/rumbo-one-page/scripts/validar.sh envelope.json
   ```

   Ele reprova dígito solto no bloco de indicadores, marcador que não resolve,
   item de roadmap sem identificador, decisão sem o campo do género, e as regras
   de escrita da casa.

12. **Publicar em duas etapas** (etapa `publicar`).

   ```bash
   node ${CLAUDE_PLUGIN_ROOT}/skills/rumbo-one-page/scripts/publicar.mjs envelope.json --rascunho
   # confira a URL devolvida. Sem destinatario nem canal no envelope:
   node ${CLAUDE_PLUGIN_ROOT}/skills/rumbo-one-page/scripts/publicar.mjs envelope.json --publicar
   ```

   Rascunho não comunica nada. **Com alguém em `escala_para` ou canal no
   envelope, o `--publicar` recusa e lista quem receberia**: a publicação passa
   para a etapa seguinte, depois da lista confirmada, com `--comunicar`. Sem
   destinatário nenhum, **publique com `canais` vazio**: a versão fica
   gravada e nenhuma mensagem sai. Quem escolhe canal e destinatários é quem
   publica, na etapa seguinte, item por item.

   **Sem origem que fale o contrato, o destino é uma página que você publica:**

   ```bash
   node ${CLAUDE_PLUGIN_ROOT}/skills/rumbo-one-page/scripts/render.mjs \
     --one-page envelope.json --roadmap envelope-roadmap.json \
     --anterior .rumbo/anterior.json --saida .rumbo/artefato.html
   ```

   Omitir `--roadmap` significa que o roadmap não mudou nesta semana: o one page
   aponta a mesma versão de novo, e o contador dela não anda.

   **Confira o arquivo antes de publicar**, e só então publique, com o título e o
   ícone que o script imprime no fim. Na republicação, **recupere a URL da versão
   anterior e publique nela**: publicar sem ela cria uma página nova e quebra o
   link que já circulou.

   Depois de publicada, a página é a entrada da semana seguinte: o bloco
   `rumbo-envelopes` dentro dela é o que alimenta o `--anterior` do próximo ciclo,
   pelo `extrair.mjs`. **Sem a ferramenta de publicar página** (fora do Claude, por
   exemplo), entregue o caminho do HTML: quem publica é a pessoa, e na mesma URL.

   **Leia o `gravado` da resposta.** Ele diz quantas alças entraram por tipo,
   quais marcadores foram congelados com que rótulo e observação, e — em
   `ignorados` — os campos que você mandou e o servidor não guarda. `ignorados`
   vazio é a resposta boa; qualquer coisa ali é campo com nome errado sumindo em
   silêncio.

13. **Canal, privados e mensagem** (etapa `comunicar`).

    ```bash
    node ${CLAUDE_PLUGIN_ROOT}/skills/rumbo-one-page/scripts/comunicar.mjs --envelope envelope.json --time <id>
    ```

    Ele não envia nada. Mostra três coisas, e é para mostrá-las que existe: quem
    recebe em privado, **com nome e não com identificador**; qual canal, com os
    disponíveis ao lado; e a mensagem que a origem vai compor, reconstruída.

    **Nomear alguém em `escala_para` já é enviar.** A pessoa recebe privado, e
    até aqui isso não aparecia em lugar nenhum como envio: o autor aprovava o
    documento e descobria o resto pelo relatório de entrega, depois. Tirar o
    nome é a única forma de não enviar.

    Leve o plano inteiro a quem publica e **espere resposta item por item**.
    Silêncio não é autorização: sem resposta, não sai.

    ```bash
    node ${CLAUDE_PLUGIN_ROOT}/skills/rumbo-one-page/scripts/comunicar.mjs --envelope envelope.json --time <id> --canais <slug>
    node ${CLAUDE_PLUGIN_ROOT}/skills/rumbo-one-page/scripts/comunicar.mjs --envelope envelope.json --time <id> --sem-canal
    ```

    Confirmado item por item, aí sim
    `publicar.mjs envelope.json --publicar --comunicar` publica e envia. Aviso enviado não se
    desfaz, e é por isso que esta etapa é a última e não a primeira.

    A mensagem mostrada é reconstrução fiel do conteúdo, não os bytes literais:
    quem compõe é a origem, no envio. Se o que ela vai dizer importa mais que o
    conteúdo, o lugar de mudar é a origem, não aqui.

    **Sem origem, ninguém envia nada por você.** A publicação é o link da página.
    Mostre a mesma lista (quem recebe, por que, em que canal) e o texto pronto
    para a pessoa colar, uma mensagem por destinatário quando forem perguntas. Ela
    envia; você não. Sem resposta à lista, a etapa fica aberta.

14. **O que o binding acrescenta** (etapa `binding`).

    O método para aqui. Um binding pode declarar passos próprios depois da
    comunicação, e é onde entra o que só existe na casa de um cliente: abrir
    trabalho a partir das decisões, registrar em outro sistema, avisar um
    fluxo interno.

    Se o binding declara algum, execute os dele agora, com as mesmas regras
    desta etapa: sugerir, mostrar, esperar resposta, e nunca agir sozinho. Se
    não declara nenhum, a etapa salta e a montagem acabou.

    **Nada aqui é automático por padrão.** Um passo de binding que dispara sem
    ser confirmado é a mesma falha que esta etapa inteira existe para corrigir.

## Recusas

Não publique, e diga por quê:

- Sem insight central.
- Sem nenhuma decisão, e sem declarar que não houve nenhuma.
- Com métrica que aparece na tabela, não se moveu, e não tem explicação.
- Com pergunta sem destinatário nomeado.
- Com número que você não conseguiu rastrear até uma fonte **depois de ter
  perguntado**. Antes de perguntar não é recusa, é pergunta pendente.

E não comunique, mesmo com o documento aprovado:

- Sem o plano de comunicação ter sido mostrado e respondido, canal e privados.
- Com destinatário que você não conseguiu nomear. Identificador solto num plano
  não é pessoa: ninguém aprova o que não consegue ler.

Recusar é o trabalho. Um one page com um número inventado destrói mais confiança
do que dez semanas sem publicar.

**E recusar demais também é defeito.** Recusa que devolve à pessoa uma informação
que ela mesma acabou de dar não protege ninguém: gasta o tempo dela e ensina que
a ferramenta atrapalha. Antes de recusar um número, confira se a pergunta foi
feita e ficou sem resposta. Se não foi feita, faça.

## Limites

- Depende de haver o que contar. Semana sem movimento produz um one page curto, e
  isso é resultado válido: não encha com atividade que ninguém pediu.
- O dossiê é tão bom quanto a origem. Se o time não registra entrega, o
  movimento vem vazio, e o documento deve dizer isso em vez de preencher.
- Não decide sozinha publicar em canal. Toda saída que vai para fora é
  confirmada antes.
- Não edita versão publicada. Errou, publica outra.
