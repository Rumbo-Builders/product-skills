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

**Você não calcula número.** O dossiê traz tudo apurado. Se um número que você
precisa não está lá, ele não existe: pergunte ou declare a ausência. Escrever um
número plausível neste documento é o pior defeito possível, porque ele circula e
alguém decide com base nele.

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

## Binding

A derivada traz a origem dos dados, o destino da publicação, os canais e o
vocabulário. Sem binding, pergunte antes de começar: **de onde vem o dossiê,
qual time, e para onde publica.**

As variáveis de ambiente esperadas pelos scripts são `RUMBO_ONEPAGE_API` (a base
da API que fala o contrato do dossiê) e `RUMBO_ONEPAGE_TOKEN`.

## Fluxo

1. **Buscar contexto e montar o briefing.**

   ```bash
   node ${CLAUDE_PLUGIN_ROOT}/skills/rumbo-one-page/scripts/contexto.mjs \
     --time <identificador> [--ano 2026] [--trimestre 3]
   ```

   Ele busca o dossiê e a versão anterior, apura o diff, e devolve um briefing em
   markdown. **Leia o briefing, não o JSON.** O arquivo cru fica salvo ao lado
   para consulta pontual, e não deve ser lido inteiro.

2. **Abrir pelas lacunas.** O briefing termina com as perguntas que o dossiê não
   respondeu. Faça-as antes de escrever. Este é o passo que separa um documento
   honesto de um bonito.

3. **Confirmar o roadmap, e publicá-lo primeiro.** Carregue o anterior e pergunte
   o que mudou, em vez de pedir para descrever de novo. Se o modo ou a
   granularidade mudarem, é escolha de quem conduz, e vale da versão em diante.

   O roadmap é **artefato próprio**: publique-o antes, e depois faça o one page
   **apontar a versão** publicada. Se nada mudou nele, aponte a mesma versão de
   novo. Nunca redigite a grade dentro do one page.

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

## Recusas

Não publique, e diga por quê:

- Sem insight central.
- Sem nenhuma decisão, e sem declarar que não houve nenhuma.
- Com métrica que aparece na tabela, não se moveu, e não tem explicação.
- Com pergunta sem destinatário nomeado.
- Com número que você não conseguiu rastrear até uma fonte.

Recusar é o trabalho. Um one page com um número inventado destrói mais confiança
do que dez semanas sem publicar.

## Limites

- Depende de haver o que contar. Semana sem movimento produz um one page curto, e
  isso é resultado válido: não encha com atividade que ninguém pediu.
- O dossiê é tão bom quanto a origem. Se o time não registra entrega, o
  movimento vem vazio, e o documento deve dizer isso em vez de preencher.
- Não decide sozinha publicar em canal. Toda saída que vai para fora é
  confirmada antes.
- Não edita versão publicada. Errou, publica outra.
