# Método: os blocos do one page

O one page nasceu para time de produto, e por isso fixou a forma dele: roadmap em
faixas, indicadores, ação e decisão. Times de marketing, jurídico, financeiro e
comercial precisam de outra forma, e quando não a encontram montam a página à mão,
fora da régua, sem versão e sem ligação com os objetivos da casa. Este arquivo é o
catálogo que resolve isso sem abrir mão da régua: **um núcleo que todo one page
tem, e blocos tipados que cada time escolhe.**

O que é um bom one page continua em `one-page.md`. Aqui mora só a forma.

## O núcleo

Todo one page, de qualquer time, tem:

- **o insight**, a frase do que mudou nesta versão;
- **objetivos**, com a leitura de cada resultado-chave e o status com o motivo do
  dono;
- **ação e decisão**, de três a quatro itens centrais, nos seis gêneros;
- **procedência** em todo número.

O núcleo não sai de nenhum desenho. Um time pode mudar o nome da aba onde ele
mora, nunca tirá-lo.

## O desenho de um time

O desenho diz quais abas a página tem, em que ordem, que blocos cada aba mostra e
com que título:

```json
{ "tipo": "marketing",
  "abas": [ { "slug": "one-page", "titulo": "One page",
              "blocos": [ { "tipo": "nucleo" }, { "tipo": "indicadores", "titulo": "Leitura da semana" } ] } ] }
```

- **É do time, e muda raramente.** Com o sistema da casa, é configuração do squad,
  e o servidor congela o vigente em cada versão publicada. Sem servidor, mora em
  `.rumbo/one-page.config.json` e viaja em `meta.desenho` de cada versão. Nos dois,
  a versão antiga mostra o desenho que tinha.
- **A primeira aba tem o núcleo**: `insight`, `objetivos` e `decisoes`, juntos no
  atalho `nucleo` ou soltos, para caber outro bloco entre eles (o preset de produto
  põe o roadmap e os indicadores ali no meio).
- **Bloco só entra se alguém do time o lê toda semana.** Bloco que ninguém atualiza
  vira "a definir" permanente, e o leitor aprende a pular a página.
- **O título é do time; o que o bloco exige, não.** "Leitura da semana" no lugar de
  "Indicadores que importam" é escolha de registro. A régua do bloco é a mesma.
- **Um bloco aparece uma vez**, exceto o roadmap, que pode aparecer nos dois cortes.
- No máximo seis abas e dez blocos por aba.

Desenhos de partida por tipo de time estão em
`skills/rumbo-one-page/scripts/desenhos.json`: produto, marketing, comercial,
jurídico, financeiro, operações e outro. São ponto de partida para a conversa,
nunca imposição.

## O catálogo

| Bloco | O que mostra | Alças | O que exige |
|---|---|---|---|
| `insight` | a frase do que mudou | `insight` do envelope | obrigatório ao publicar |
| `objetivos` | os KRs, agrupados por objetivo | `okr` | o que `okr.md` pede do KR; `payload.objetivo { slug, titulo }` agrupa |
| `decisoes` | ação e decisão | `decisao` | os seis gêneros de `one-page.md` |
| `nucleo` | atalho: insight, objetivos e decisões, nessa ordem | | |
| `indicadores` | a tabela das leituras, com a origem | leituras sem categoria `saude` | origem em toda leitura; número só pelo marcador no corpo |
| `saude` | indicadores de saúde, com a série | leituras com `categoria: "saude"` | a mesma regra das leituras |
| `trilha_mensal` | a meta de cada mês de cada KR, e o realizado | `meta_mes` | `kr` que existe, `periodo` AAAA-MM, `alvo` número ou "a definir"; realizado com fonte |
| `roadmap` | o roadmap publicado, `corte: "enxuto"` ou `"detalhado"` | o artefato de roadmap | o que `one-page.md` já pede |
| `acoes` | as ações para chegar lá | `acao` | prazo, status no vocabulário fechado, e o `okr` que ela move |
| `verba` | aprovado contra realizado, por período | `verba` | aprovado numérico e fonte, sempre |
| `checklist` | itens de conformidade ou de implantação | `checklist` | dono e prazo; `feito` verdadeiro ou falso |
| `funil` | estágios de um pipeline | `funil` | `ordem`, a `regra` do que conta, `contagem` numérica |
| `outras_frentes` | o que anda e não serve objetivo nenhum | `frente` | curto; se cresce, falta um objetivo |
| `texto` | o corpo em prosa | `body_md` | a narrativa que a tabela não conta |

### Objetivos e KRs

- Cada alça `okr` é um resultado-chave medido: baseline, meta, unidade, direção e o
  atual. `payload.objetivo` agrupa os KRs do mesmo objetivo; quando os OKRs vêm do
  sistema da casa, é o objetivo de lá, e eles não se redigitam.
- O status do objetivo é `rota` (`no_ritmo`, `em_risco`, `fora_de_rota`) com
  `rota_motivo`, na voz do dono, como em `okr.md`.
- **A trilha mensal** (`meta_mes`, uma alça por KR e por mês) diz se o KR está na
  rota mês a mês.
- **"A definir" é lacuna, não célula.** Exatamente essa string, no alvo ou na meta.
  Ela aparece na página e entra no briefing como pergunta, com o dono. Página com
  quase tudo "a definir" precisa de uma conversa antes de uma publicação.

### Ações para chegar lá

- Uma ação tem **prazo** (AAAA-MM-DD ou AAAA-MM), **status** e o **KR que ela move**
  (`kr`, o slug da alça `okr`). Ação que não move KR nenhum é outra frente.
- O status tem vocabulário fechado: `realizado`, `confirmado`, `em_andamento`,
  `planejado`, `a_propor`, `negociado`, `bloqueado`, `cancelado`. Palavra fora da
  lista reprova, porque é por ela que o leitor separa o que está de pé do que é
  intenção. Cancelada fica visível, riscada: a decisão de largar é informação.
- Ação vencida sem status novo é o primeiro sinal da semana.

### Verba

- Uma alça por rubrica e por período: `periodo` AAAA-MM, `aprovado` numérico,
  `realizado` quando houver, e **fonte sempre** (de onde vem o aprovado, ou o
  extrato do realizado).
- `meta.verba_total`, quando declarado, fecha com a soma do aprovado, com
  tolerância de um centavo. Total que não fecha reprova: é o número que alguém vai
  repetir em reunião.

### Checklist

- Item, dono e prazo. Feito ou não feito, sem meio-termo; "em andamento" é ação, e
  vai para o bloco de ações. Item vencido e não feito é sinal.

### Funil

- Cada estágio declara a **regra do que conta** ("proposta enviada com preço"), a
  ordem e a contagem. Contagem sem regra é número que cada um lê de um jeito.

## O que a régua confere

O `validar.sh` do one page reprova: bloco fora do catálogo; primeira aba sem
insight, objetivos e decisões; bloco repetido; alça de um tipo cujo bloco não está
no desenho; ação sem prazo ou com status fora da lista; ação ou meta do mês
apontando KR que não existe; meta do mês sem período AAAA-MM; verba sem aprovado
numérico ou sem fonte; total de verba declarado que não fecha; checklist sem dono
ou sem `feito`; funil sem regra ou sem contagem numérica. Avisa: "a definir";
ação sem KR; bloco do desenho sem nenhuma alça; prazo vencido em ação não
realizada ou em checklist não feito.

O que a máquina não vê: se o bloco é lido toda semana, se o título diz o que o
leitor procura, se o desenho cabe na pessoa que vai mantê-lo.
