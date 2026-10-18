---
name: rumbo-estrategia
description: >-
  Conduz a liderança pela estratégia de um ciclo: a cascata de escolhas
  (aspiração, onde jogar, como ganhar, capacidades), o que tem de ser verdade
  e o elo mais fraco, e publica o artefato versionado, guiando a conversa
  etapa por etapa. Use quando pedirem "estratégia do ciclo", "me guia na
  estratégia", "atualizar a cascata", "revisar a estratégia", "polir a
  cascata", "cascata", "playing to win", "aspiração", "onde jogar", "como
  ganhar", "revisão estratégica", "pauta do conselho", "fecha o trimestre",
  "o que tem de ser verdade", "elo mais fraco", ou quando colarem a ata de um
  conselho pedindo para virar estratégia. Criar, editar ou acompanhar uma
  aposta ou um OKR é das skills rumbo-apostas e rumbo-okrs. Skill genérica: se
  o pedido for de uma casa específica e existir skill derivada dela, ela é que
  roda.
---

# rumbo-estrategia

Skill de método. Cliente-agnóstica: não conhece sistema, canal nem pessoa.
Quando roda a partir de uma derivada, o binding vem dela.

## Antes de qualquer coisa

Leia, nesta ordem:

1. `${CLAUDE_PLUGIN_ROOT}/metodo/_principios.md`
2. `${CLAUDE_PLUGIN_ROOT}/metodo/conducao.md`: como guiar a conversa. Vale o
   fluxo inteiro.
3. `${CLAUDE_PLUGIN_ROOT}/metodo/estrategia.md`, que traz as escolhas, a régua por
   estágio em perguntas, premissas, ação e decisão, apostas, OKR e o envelope
4. `${CLAUDE_PLUGIN_ROOT}/metodo/escrita.md`, para a redação

**Você não pontua.** Não existe score de aspiração, nota de alinhamento nem
veredito numérico. A régua é feita de perguntas que você faz e de campos que a
alça exige. Quem escolhe é a liderança; você propõe e registra.

**O texto da escolha é da liderança.** Onde a resposta for fraca, diga por que
considera fraca e devolva a pergunta, no máximo duas vezes por escolha. Na
terceira, registre a escolha como está, com uma decisão de gênero `nota_metodo`
apontando a fraqueza. Recusar de saída transforma a ferramenta em obstáculo, e
já transformou no one page.

**Toda escolha carrega fonte.** Sem fonte não entra. A renúncia é escrita só onde
é essencial; a escolha se prova no teste do oposto, que é pergunta sua. A liderança dizendo em voz alta é fonte legítima, e entra
como "declaração de <papel>, <data>". O que não entra: escolha que ninguém
declarou, premissa que você deduziu, número que ninguém informou.

**Você não lê os JSON.** O briefing que `contexto.mjs` escreve é o que você lê. O
que ele decide (diff, idade de fonte, cobertura, por onde começar) você não
redecide.

## Antes de ler qualquer arquivo, saiba de que casa é

**Sem casa nomeada, pergunte. É a primeira coisa, antes de abrir arquivo.** A
estratégia é da casa, não do squad: uma casa com vários times tem uma estratégia
e vários one pages apontando os KRs dela.

**Se receberem uma ata ou um documento colado, pergunte de qual casa e de qual
rito ele veio, antes de ler.** O documento vira fonte, com nome e data. O que
entra no envelope é o nome e a data; o resumo que você fez dele não entra.

## Binding, e o caminho de quem não tem nenhum

A derivada traz as fontes, o destino da publicação, o vocabulário e quem senta no
conselho. Sem binding, pergunte antes de começar: **de que casa é, qual o ciclo,
e para onde publica.**

**Precedência, e ela importa quando há derivada.** O binding da derivada vence o
perfil da casa em `.rumbo/perfil.md`, que vence o default. Com uma derivada ativa,
o `.rumbo/` só preenche o que o binding não definiu, e nunca reescreve
vocabulário, tom, origem ou destino que a derivada declarou. Um `.rumbo/`
esquecido numa pasta de trabalho não pode mudar o documento de um cliente sem
ninguém perceber.

**Dois destinos, um envelope.** Sem origem no ambiente, o destino é a página que
você publica: o histórico das versões viaja embutido nela. Com origem, a
estratégia vai para a origem que fala o contrato, como o one page vai, e a
anterior vem dela. A origem são `RUMBO_ONEPAGE_API` e `RUMBO_ONEPAGE_TOKEN`, ou
as variantes com o sufixo de `RUMBO_ORIGEM` (`RUMBO_ORIGEM=productops` lê
`RUMBO_ONEPAGE_API_PRODUCTOPS` e `RUMBO_ONEPAGE_TOKEN_PRODUCTOPS`), para quem
atende mais de uma casa. `node ${CLAUDE_PLUGIN_ROOT}/scripts/origem.mjs --mostrar`
diz qual está ativa. A régua e o envelope são os mesmos nos dois destinos.

**Módulo ProductOps, só se as tools estiverem na sessão.** Pela regra única,
o módulo está ligado quando qualquer tool do ProductOps aparece entre as suas, com o nome puro ou com prefixo de servidor (`mcp__<servidor>__ciclo_ativo`); a regra inteira está em `MODULO.md`, "Quando ligar". Ligado, leia
`${CLAUDE_PLUGIN_ROOT}/modulos/productops/MODULO.md` antes do passo 1: ele
acrescenta propostas aceitas, apostas e OKRs gravados no módulo, aposta avulsa e
revisão semanal das apostas. Sem as tools, ignore este parágrafo e não fale dele.

## Primeira vez: configure antes de escrever

Se não existe `.rumbo/marca.json` na pasta de trabalho e não há binding, **pare e
configure**. As seis perguntas são as mesmas de toda skill do core e estão na
skill `rumbo-one-page` e no README. O script é o mesmo:

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/configurar.mjs --casa <id> --nome "<Nome>" \
  --acento "#333333" [--destaque "#888888"] [--fonte-titulo "..."] \
  [--fonte-corpo "..."] [--simbolo simbolo.svg] [--tom "..."]
```

Depois de preenchido, leia o `perfil.md` antes de redigir. O que é só deste
artefato vai num `.rumbo/estrategia.config.json` opcional, com `titulo`. Sem
configuração nenhuma a página sai no tema neutro, que não é a identidade de
ninguém.

## Conduzir como conversa

"Me guia" quer dizer conversa: você mostra o roteiro, e passa por ele com a pessoa,
uma etapa por vez. Vale para o nascimento e para a revisão, e é o padrão, não um
modo que se pede.

**A primeira chamada da sessão é esta, antes de qualquer arquivo:**

```bash
node ${CLAUDE_PLUGIN_ROOT}/skills/rumbo-estrategia/scripts/estado.mjs --time <casa>
```

Ele imprime o roteiro numerado e onde a montagem parou. Havendo montagem em
andamento, **pergunte se continua ou recomeça**, em vez de decidir por quem está
esperando. A cada etapa vencida, marque e diga em que número está:

```bash
node ${CLAUDE_PLUGIN_ROOT}/skills/rumbo-estrategia/scripts/estado.mjs --time <casa> --concluir aspiracao
node ${CLAUDE_PLUGIN_ROOT}/skills/rumbo-estrategia/scripts/estado.mjs --time <casa> --escolher base="partiu da v2"
```

O mapa mora em `scripts/estado.mjs`, numa lista só, e as etapas de lá são as deste
Fluxo, pelo mesmo id. O Fluxo agrupa algumas (o passo 4 são as etapas 4 a 7 do
mapa, um estágio por etapa); o número que você diz à pessoa é sempre o do mapa.
Depois de publicar, `--descartar`.

As regras da conversa são as de `metodo/conducao.md`: o roteiro antes da primeira
pergunta, uma etapa por mensagem com uma pergunta só, Hoje e Proposta nunca
misturados, sem tabela larga, o tático no estacionamento, procurar antes de
pedir. O que é só da estratégia:

- **Em revisão, a visão completa é a cascata de hoje**, que o briefing traz por
  estágio. Mostre-a uma vez, curta, antes da etapa 4.
- **No onde jogar, o bloco Hoje leva o recorte** junto do texto.

## Fluxo

1. **De onde parte** (etapa `base`). **Pergunte antes de buscar qualquer coisa**:
   nascimento do ciclo, em branco, ou revisão da última publicada.

   ```bash
   node ${CLAUDE_PLUGIN_ROOT}/skills/rumbo-estrategia/scripts/base.mjs --time <casa> --branco
   node ${CLAUDE_PLUGIN_ROOT}/skills/rumbo-estrategia/scripts/base.mjs --time <casa> --de .rumbo/anterior-estrategia.json
   node ${CLAUDE_PLUGIN_ROOT}/skills/rumbo-estrategia/scripts/base.mjs --time <casa>        # com origem: última publicada
   ```

   Sem origem, a anterior vem da página publicada. Salve a página em disco e
   extraia, sem copiar JSON à mão:

   ```bash
   node ${CLAUDE_PLUGIN_ROOT}/scripts/extrair.mjs estrategia.html    # grava .rumbo/anterior-estrategia.json
   ```
 Com origem, a forma sem `--de`
   busca a última publicada da casa e grava a mesma cópia. Sem nada publicado lá, o
   script diz, e o caminho é `--branco`. **O que não se herda, o script diz em voz
   alta**: o insight, o elo mais fraco, a marca de revisão, o ano e o trimestre, as
   listas de escalada, e o campo que era proposta sua sem confirmação.

2. **O briefing** (etapa `contexto`).

   ```bash
   node ${CLAUDE_PLUGIN_ROOT}/skills/rumbo-estrategia/scripts/contexto.mjs \
     --time <casa> --anterior .rumbo/anterior-estrategia.json \
     --fontes fontes.json [--one-page .rumbo/anterior.json] [--ciclo <slug>]
   ```

   **A lista de fontes é sua.** Normalize cada documento que leu na conversa com
   nome, tipo e data, no formato de `scripts/exemplo-fontes.json`. **Leia o
   briefing, não o JSON.** Em revisão, ele traz a cascata de hoje inteira, por
   estágio: mostre-a à pessoa uma vez, curta, antes da etapa 4. É a visão completa
   que a revisão vai polir.

3. **Fontes e lacunas** (etapa `fontes`). Primeiro, a pergunta que define o resto:
   **qual é a declaração principal desta revisão?** Costuma ser o rito mais recente
   da liderança. Os outros documentos entram como contexto tático: mostram fricção
   e levantam pergunta, e nunca são fonte de escolha. Depois, as lacunas do fim do
   briefing, as que não se resolvem nas etapas seguintes. **A resposta vira
   registro**: fonte com data, premissa com teste, decisão com gênero.

4. **Aspiração** (etapa `aspiracao`), e cada estágio a seguir na sua etapa:
   **onde jogar** (`onde_jogar`), **como ganhar** (`como_ganhar`), **capacidades**
   (`capacidades`). Um estágio por mensagem, com as perguntas que o método lista
   para ele: teste do oposto, teste da dor, teste da imitação, filtro da vantagem,
   os três filtros da capacidade.

   - **Nascimento pergunta; revisão pole.** Em revisão, todos os estágios passam,
     com sinal ou sem. O briefing diz, em "Por onde começar", onde insistir. Onde a
     escolha está boa, diga em uma frase por que está, e siga. Reescrever o que está
     bom é o erro que transforma estratégia em ata.
   - **Onde jogar é um recorte por alça**, com `recorte` no nome que a casa usa
     ("Molécula" no lugar de "Cliente", se é assim que ela fala). Ferramenta e
     entrega sobem ao como ganhar ou descem às apostas.
   - **Renúncia só onde é essencial.** Não escreva o "fora" de toda escolha. Pergunte
     o teste do oposto; registre a renúncia só se outra escolha se apoia nela, ou se
     é como se vende.
   - **Capacidade leva `situacao` e `sustentada_por`.** Se um squad da casa não
     sustenta nenhuma capacidade nem prova nenhuma aposta, pergunte se falta uma
     capacidade: costuma faltar.
   - Toda escolha entra com `estagio`, `serve` (a escolha de cima), `fonte` e
     `estado`. O slug é o handle: o texto muda sem mudar o slug, e a escolha que
     mudou leva `estado: "revisada"`. A que saiu leva `estado: "abandonada"` e
     **permanece no envelope**, riscada.
   - **O que você propôs, marque em `propostas`, nunca com prefixo no texto.** Texto
     da versão anterior começando por "Proposta:" é o jeito antigo: nesta revisão,
     a pessoa confirma com as próprias palavras, ou o campo vai para `propostas`.

5. **Sistemas** (etapa `sistemas`). Uma pergunta só: "a casa roda OKRs e one page
   neste ciclo?". Se sim, não há sistema, e a etapa salta; sistema da versão
   anterior sai inteiro. Só conduza sistemas quando a casa não tem esses ritos, e
   então cada um serve uma capacidade.

6. **Apostas e OKRs contra a cascata** (etapa `amarracao`). **Quando a casa tem
   onde eles vivem** (o módulo, ou o one page dos squads), eles não se conduzem
   aqui: leia, e confira só a amarração. Mudar uma aposta ou um OKR é outra
   conversa, na `rumbo-apostas` ou na `rumbo-okrs`: ofereça na etapa `insights`. Cada aposta serve uma escolha? Alguma
   escolha ficou sem ninguém provando? O que não amarra vai para o estacionamento,
   e as alças `aposta`, `okr` e `kr` ficam fora do envelope. **Quando não tem**,
   conduza aqui, uma aposta por vez, com a régua de `metodo/apostas.md`, e cada
   objetivo com a de `metodo/okr.md`. Sem apostas em lugar nenhum, a etapa salta.

7. **O que tem de ser verdade** (etapa `premissas`). Leia a cadeia nova de cima para
   baixo e **proponha** as crenças que a sustentam e ainda não têm evidência; a
   pessoa escolhe de uma a quatro, cada uma com teste e data. Antes de propor,
   filtre: pergunta que a próxima rodada responde ("quanto paga", "qual o ritmo")
   vai para ação e decisão; competência que a casa já provou não é premissa.

8. **O elo mais fraco** (etapa `elo`). Percorra a cadeia com a pessoa e pergunte onde
   ela quebra primeiro. Toda versão nomeia um, em `meta.elo_mais_fraco`, e o corpo
   explica por quê. Pode ser escolha, aposta ou premissa.

9. **Ação e decisão** (etapa `pendencias`). Item por item, a lista que vem da versão
   anterior e a que surgiu na conversa. Para cada um, decidam juntos: **fecha**
   (respondido, virou escolha, virou premissa com teste), **vai para o one page**
   (tarefa ou acompanhamento de squad) ou **fica**. Ficam no máximo quatro, cada um
   com gênero e `payload.sobre`. Releia também a cascata com as perguntas que a
   máquina não vê: cada escolha passa no teste do oposto? o como ganhar sobrevive à
   imitação? o elo é mesmo o mais fraco?

10. **O que ficou fora da cascata** (etapa `insights`). Entregue o estacionamento de
    uma vez, em lista curta: cada insight com o que propõe e onde mora (one page,
    módulo, próximo conselho). Nada aqui entra no envelope sem a pessoa pedir. Sem
    nada estacionado, a etapa salta.

11. **O insight** (etapa `insight`). Uma frase: o que mudou nesta revisão. Se você
    não consegue escrevê-la, a revisão não está pronta.

12. **O corpo** (etapa `escrita`). Você escreve e a pessoa revisa. Prosa livre, sem
    tabela: o que mudou, por que o elo é o elo, o que o conselho decidiu olhar. A
    cascata, as premissas e as decisões são montadas das alças pelo render;
    escrevê-las no corpo é o erro que a régua reprova.

13. **Validação com IA** (etapa `analise_ia`). Sobre o rascunho, antes de publicar.
    Com o módulo, grave o rascunho, peça a análise da versão e passe as sugestões de
    ação e decisão com a pessoa, item a item (o `MODULO.md` diz as tools). Sem o
    módulo, faça você a passada: para cada estágio, a tensão com a realidade e a
    ação que destravaria, em blocos curtos. O que vier dela volta à etapa que toca,
    e nunca entra sem a pessoa dizer.

14. **Mostrar antes de publicar** (etapa `conferir`). Devolva o rascunho inteiro na
    conversa, com a lista do que está marcado como proposta sua, e espere
    convergência explícita. Toda mensagem antes dela é correção, nunca ordem de
    publicar.

15. **Validar** (etapa `validar`).

    ```bash
    bash ${CLAUDE_PLUGIN_ROOT}/skills/rumbo-estrategia/scripts/validar.sh envelope-estrategia.json \
      [--anterior .rumbo/anterior-estrategia.json]
    ```

    Ele reprova escolha sem fonte, cadeia que não fecha, aposta sem critério de
    matar, KR sem baseline ou direção, premissa sem teste, pergunta sem
    destinatário, publicação sem insight ou sem elo mais fraco, tabela no corpo, e
    as regras de escrita da casa no corpo e nas alças. Avisa prefixo "Proposta" no
    texto, recorte repetido, sistema declarado e mais de quatro decisões. Com
    `--anterior`, avisa o slug que sumiu sem estado de saída. **Use
    `scripts/exemplo-envelope-estrategia.json` como forma**: o que o exemplo não
    mostra, você infere errado.

16. **Publicar** (etapa `publicar`). Com origem, em duas etapas, e a separação é o
    ponto:

    ```bash
    node ${CLAUDE_PLUGIN_ROOT}/skills/rumbo-estrategia/scripts/publicar.mjs envelope-estrategia.json --rascunho
    node ${CLAUDE_PLUGIN_ROOT}/skills/rumbo-estrategia/scripts/publicar.mjs envelope-estrategia.json --publicar
    ```

    Pergunta com destinatário envia privado ao publicar. Com alguém em
    `escala_para`, o `--publicar` recusa e lista quem receberia: faça antes a etapa
    `comunicar`, espere a resposta item por item, e só então
    `--publicar --comunicar`.

    O rascunho grava a versão e devolve a URL de conferência: mostre-a e espere.
    `--publicar` fecha a versão, e versão publicada é imutável. O `time` do envelope
    é o slug da casa na origem. A origem valida com a mesma régua do passo 15 e
    devolve os avisos; leia-os antes de publicar.

    Sem origem, renderize a página:

    ```bash
    node ${CLAUDE_PLUGIN_ROOT}/skills/rumbo-estrategia/scripts/render.mjs \
      --estrategia envelope-estrategia.json --anterior .rumbo/anterior-estrategia.json \
      [--one-page .rumbo/anterior.json] --saida .rumbo/estrategia.html
    ```

    **Nunca renderize sem `--anterior` quando já existe versão publicada.** Sem ele a
    página sai como v1 e recarimba a história. **Confira o arquivo antes de
    publicar**, e só então publique, com o título e o ícone que o script imprime no
    fim. Sem a ferramenta de publicar página (fora do Claude, por exemplo), entregue
    o caminho do HTML: quem publica é a pessoa, e na mesma URL. Na republicação, **recupere a URL da versão anterior e publique nela**:
    publicar sem ela cria uma página nova e quebra o link que já circulou.

17. **Comunicar** (etapa `comunicar`). A publicação é o link. Mostre quem recebe o
    quê, e por quê. Toda pergunta exige destinatário nomeado, e sem dossiê que
    resolva identificador o `escala_para` leva o nome da pessoa. **Nomear alguém já
    é enviar.** Espere resposta item por item. Silêncio não é autorização.

18. **O que o binding acrescenta** (etapa `binding`). O método para aqui. Um binding
    pode declarar passos próprios depois da comunicação; execute os dele com as
    mesmas regras: sugerir, mostrar, esperar resposta, nunca agir sozinho. Se não
    declara nenhum, a etapa salta e a montagem acabou.

## Recusas

Não publique, e diga por quê:

- Sem insight.
- Sem elo mais fraco nomeado e explicado.
- Com escolha sem fonte **depois de ter perguntado**. Antes de perguntar não é
  recusa, é pergunta pendente.
- Com aposta sem critério de matar.
- Com pergunta sem destinatário nomeado.
- Com cascata que não fecha: escolha abaixo da aspiração sem a de cima.

E não comunique, mesmo com o documento aprovado:

- Sem a lista de destinatários ter sido mostrada e respondida.
- Com destinatário que você não conseguiu nomear.

**E recusar demais também é defeito.** A liderança declarando é fonte. Diante de
uma escolha fraca, devolva a pergunta duas vezes, registre na terceira com a
fraqueza anotada, e siga. Uma estratégia com uma escolha fraca registrada vale
mais que um conselho inteiro sem artefato.

## Limites

- Não é diagnóstico. Medir a casa contra uma linha de base é outro artefato.
- Não é do squad. OKR de squad vive no one page do squad, apontando o KR daqui.
- Não lê documento por script. Quem lê a ata é você, na conversa; o script
  recebe a lista de fontes normalizada.
- Não decide sozinha publicar nem comunicar. Toda saída é confirmada antes.
- Não edita versão publicada. Errou, publica outra.
