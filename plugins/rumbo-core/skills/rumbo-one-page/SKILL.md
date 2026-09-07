---
name: rumbo-one-page
description: >-
  Cria ou atualiza o one page semanal de um time de produto, com roadmap,
  indicadores e ação e decisão, e publica o artefato. Use quando pedirem one
  page, one pager, atualizar o roadmap do time, "o que mudou essa semana",
  preparar a pauta do 1:1 de produto, atualizar os indicadores do squad, ou
  quando disserem que precisam publicar o status do produto. Skill genérica: se
  o pedido for de um time específico e existir skill derivada dele, ela é que
  roda.
---

# rumbo-one-page

Skill de método. Cliente-agnóstica: não conhece sistema, canal nem pessoa.
Quando roda a partir de uma derivada, o binding vem dela.

## Antes de qualquer coisa

Leia, nesta ordem:

1. `${CLAUDE_PLUGIN_ROOT}/metodo/_principios.md`
2. `${CLAUDE_PLUGIN_ROOT}/metodo/one-page.md`, que traz a estrutura, os seis
   géneros de decisão, os dois modos de roadmap e o contrato do dossiê
3. `${CLAUDE_PLUGIN_ROOT}/metodo/escrita.md`, para a redação

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
opcional: `roadmap.modo`, `roadmap.granularidade`, `movimento.origem` e um
`titulo` próprio. Sem ele o render usa os defaults.

Sem configuração nenhuma o documento sai no tema neutro, que **não é a identidade
de ninguém** e existe só para a página ser legível antes da primeira conversa.

## Fluxo

1. **Buscar contexto e montar o briefing.**

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

   Ele não busca nada: recebe a versão anterior, extraída do bloco embutido na
   página publicada, e o movimento do período, que **você monta** lendo a
   ferramenta onde o trabalho do time vive. O formato está em
   `scripts/exemplo-movimento.json`.

   **A triagem é sua; a conta é do script.** Escolher o que da ferramenta
   pertence ao roadmap é julgamento: nem toda entrega registrada é aposta do
   produto, e uma regra determinística para isso enche o roadmap de trabalho que
   ninguém pediu. Registre cada decisão em `triagem.json`, com o motivo de quem
   ficou de fora: identificador já decidido não volta a ser perguntado, e é isso
   que permite ler a ferramenta toda semana sem reclassificar a lista inteira.

2. **Abrir pelas lacunas.** O briefing termina com as perguntas que o dossiê não
   respondeu. Faça-as antes de escrever. Este é o passo que separa um documento
   honesto de um bonito.

   **A resposta vira registro, não só texto.** Número que vier na resposta entra
   como leitura com `fonte: "manual"`; contexto que vier vira nota de método ou
   item de ação e decisão. Perguntar e depois usar a resposta apenas na prosa
   desperdiça a apuração: na semana seguinte ela não existe mais, e você pergunta
   de novo.

3. **Confirmar o roadmap, e publicá-lo primeiro.** Carregue o anterior e pergunte
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

4. **Escrever.** A narrativa é sua; os números não. Envie cada leitura com o
   rótulo legível e, quando houver julgamento, a observação: é ela que vira a
   última coluna da tabela, e é onde mora a frase do tipo "ruim e melhorando".
   Classifique cada item de ação e decisão em um dos seis géneros, e preencha o
   que aquele género exige.

   O corpo do one page é a **narrativa que a tabela não conta**. Se você não tem
   nada a dizer além do que os números já mostram, deixe curto.

5. **Escrever o insight central.** Uma frase: o que é essencial e o que mudou.
   Se você não consegue escrevê-la, o documento ainda não está pronto.

6. **Mostrar antes de publicar.** Devolva o rascunho na conversa e espere
   convergência. Publicar texto não aprovado é desperdício, e a publicação
   comunica.

7. **Validar.**

   ```bash
   bash ${CLAUDE_PLUGIN_ROOT}/skills/rumbo-one-page/scripts/validar.sh envelope.json
   ```

   Ele reprova dígito solto no bloco de indicadores, marcador que não resolve,
   item de roadmap sem identificador, decisão sem o campo do género, e as regras
   de escrita da casa.

8. **Publicar em duas etapas.**

   ```bash
   node ${CLAUDE_PLUGIN_ROOT}/skills/rumbo-one-page/scripts/publicar.mjs envelope.json --rascunho
   # confira a URL devolvida, depois:
   node ${CLAUDE_PLUGIN_ROOT}/skills/rumbo-one-page/scripts/publicar.mjs envelope.json --publicar
   ```

   Rascunho não comunica nada. A publicação comunica, e **quem escolhe canal e
   destinatários é quem publica**, item por item.

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
   `rumbo-envelopes` dentro dela é o que alimenta o `--anterior` do próximo ciclo.

   **Leia o `gravado` da resposta.** Ele diz quantas alças entraram por tipo,
   quais marcadores foram congelados com que rótulo e observação, e — em
   `ignorados` — os campos que você mandou e o servidor não guarda. `ignorados`
   vazio é a resposta boa; qualquer coisa ali é campo com nome errado sumindo em
   silêncio.

## Recusas

Não publique, e diga por quê:

- Sem insight central.
- Sem nenhuma decisão, e sem declarar que não houve nenhuma.
- Com métrica que aparece na tabela, não se moveu, e não tem explicação.
- Com pergunta sem destinatário nomeado.
- Com número que você não conseguiu rastrear até uma fonte **depois de ter
  perguntado**. Antes de perguntar não é recusa, é pergunta pendente.

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
