# product-skills

Skills de Claude Code que produzem os artefatos de um time de produto no padrão de uma
consultoria: o one page semanal, o deck de decisão, as release notes e qualquer texto que
saia em nome da empresa.

Você conversa normalmente. A skill dispara pelo que você escreve, pergunta o que não tem
como adivinhar, mostra um rascunho, e só publica quando você mandar.

## Veja antes de instalar

![One page semanal gerado pela skill rumbo-one-page](docs/exemplo-one-page.png)

**[Abrir a demo publicada](https://claude.ai/code/artifact/12451f2c-b2a7-40ba-8d4f-806944dbf3d0)**
e clicar nas duas abas. É um one page de verdade, com o roadmap detalhado ao lado, o
estacionamento do que ficou de fora e o seletor de versões funcionando.

O time de engajamento não existe: produto, pessoas e números são fictícios. A fonte que
gera essa página está em [`docs/demo/`](docs/demo/), e ela roda com um comando.

Quatro decisões de método que a imagem mostra:

- **O insight vem antes de qualquer número.** A primeira linha diz o que aconteceu e o
  que está em jogo. Quem lê só ela já sabe do que se trata.
- **A grade do roadmap é projetada, não digitada.** Ela é o roadmap detalhado agrupado
  por quinzena, então as duas não podem divergir.
- **Os valores ficam congelados na versão.** O que a v1 dizia continua dizendo, mesmo
  depois que a métrica mudar. É o que permite comparar semanas.
- **Ação e decisão é obrigatória.** Risco com impacto declarado, pergunta com
  destinatário nomeado, próximo passo. Se essa seção está vazia, o que existe é um
  relatório, e o método reprova.

## Comece a usar

Do zero ao seu primeiro artefato publicado, sem escrever uma linha de skill.

### 1. Instale

```
/plugin marketplace add Rumbo-Builders/product-skills
/plugin install rumbo-core@rumbo
```

Precisa do `node` na máquina, e nada mais para começar.

### 2. Configure a casa, uma vez

> configura a minha marca

São seis perguntas, sobre nome, cor, fontes, logo, tom de voz e as ressalvas da casa. O
que sai é um `.rumbo/` na pasta de trabalho, e ele serve **todas** as skills daqui em
diante. Detalhe na seção [A casa](#a-casa-configure-uma-vez-e-vale-para-todas-as-skills).

### 3. Peça

> monta o one page do meu time dessa semana

A skill pergunta o que não tem como saber: o período, de onde vem o que aconteceu, e
quem lê. Depois monta o rascunho e para.

### 4. Refine no rascunho

O ciclo é conversa. Você corrige o insight, discorda de uma leitura, manda tirar uma
linha do roadmap. Nada sai enquanto você não mandar publicar, porque publicar comunica e
aviso não se despublica.

### 5. Republique na mesma URL, toda semana

O histórico das versões viaja dentro da própria página, e é ele que alimenta o briefing
do ciclo seguinte. A página publicada é a entrada da próxima semana.

A demo lá em cima é o fim do passo 5, na primeira versão.

As outras skills entram do mesmo jeito, pelo que você escreve:

> revisa esse e-mail antes de eu mandar pro board
>
> quais foram as novidades do produto entre 27/08 e hoje
>
> monta o deck da reunião de terça com esse conteúdo

## As quatro skills

| Skill | Dispara quando pedem | Produz |
|---|---|---|
| `rumbo-one-page` | one page, status do squad, "o que mudou essa semana", pauta do 1:1 | uma página com one page e roadmap, versionada, em rascunho antes de publicar |
| `rumbo-deck` | apresentação, slides, deck, pptx, one-pager | `.pptx` em padrão de consultoria, com storyline de títulos de ação e infográficos desenhados |
| `rumbo-release-notes` | release notes, novidades da semana, "o que mudou no produto" | PDF para público não técnico, a partir dos commits da janela |
| `rumbo-escrita` | revisar texto, "tirar cara de IA", "ver se está no padrão" | o texto reescrito, com a regra que justifica cada mudança |

## Por que o resultado é constante

Pedir a um assistente "monta o one page do time" funciona uma vez. Na semana seguinte sai
outro documento, com outra estrutura e outro critério de relevância. O padrão existia,
mas morava na cabeça de quem pediu.

Este repositório é a régua, escrita uma vez e aplicada sempre.

**O critério é arquivo, não instrução solta.** `metodo/_principios.md` vale para todo
entregável, e cada método tem o seu. Melhorar o padrão é editar um arquivo, e a melhoria
vale para todas as skills na mesma hora.

**Onde a regra é verificável, ela roda.** O QA do deck extrai o texto do PDF renderizado
e reprova o build se achar travessão, pontuação em série ou vocabulário de consultoria
genérica. A régua do one page reprova envelope com decisão sem responsável, pergunta sem
destinatário, número digitado à mão no lugar do valor apurado, ou tabela escrita em
markdown onde deveria vir dos dados.

**O que a máquina não vê vai para você, nomeado.** Colisão de layout, se o argumento
fecha, se o insight é mesmo o essencial. A skill manda olhar e nunca reporta como
conferido o que não foi conferido.

**Nada sai sozinho.** Publicar é sempre duas etapas, rascunho e publicação, e nenhuma
skill manda para Slack, e-mail ou página compartilhada sem confirmação explícita.

## A casa: configure uma vez, e vale para todas as skills

O `.rumbo/` na pasta de trabalho é o que faz deck, one page, release notes e revisão de
texto saírem com a mesma cara:

| Arquivo | O que guarda | Quem lê |
|---|---|---|
| `perfil.md` | tom, quem lê, vocabulário, cuidados | o modelo, antes de escrever |
| `marca.json` | cores, fontes, logo, ressalvas | os scripts |
| `tema.css` | o tema derivado das suas duas cores | one page e release notes |
| `tema.js` | o mesmo tema, no formato do deck | o motor do `.pptx` |

O gerador **confere contraste** e diz o que ajustou. Cor de marca não vira cor de letra
só porque é bonita: um acento que reprova é escurecido até passar, com o original
reservado para preenchimento. Quem enxerga bem nunca percebe esse defeito, e por isso ele
é dito em voz alta.

Cor vira variável e o script confere. **Tom não vira variável**, e por isso mora em prosa
no `perfil.md`, que você escreve e a skill lê. Uma linha nasce lá dentro e não sai: o tom
ajusta o registro, e não suspende a régua. Nenhum "escrevemos mais solto" libera travessão
ou vocabulário de consultoria.

`.rumbo/` não entra em repositório, e já está no `.gitignore`. Ele carrega nome, cor e
logo, e a checagem de vazamento deste repo só lê texto: um PNG de logo passaria por ela
sem ser visto.

## O one page não precisa de servidor nenhum

Há dois destinos, e o método os trata como equivalentes. Se o seu time já tem um sistema
que recebe o artefato, a skill publica nele. Se não tem, ela **monta a página e publica**,
e o histórico das versões vive dentro dela.

Cada versão guarda uma cópia das grades que projetou, então publicar um roadmap novo não
muda o que uma versão já publicada mostra.

**A régua é a mesma dos dois jeitos.** Com servidor ou sem, o envelope é o mesmo, os seis
géneros de decisão são os mesmos, e a mesma verificação reprova número inventado, tabela
escrita à mão e pergunta sem destinatário. O destino barato não é o destino ruim.

**O que precisa estar na máquina:** `pptxgenjs` para o deck, LibreOffice e poppler para
renderizar e conferir o `.pptx`, Chrome ou Chromium para o PDF das release notes. A
configuração da casa e o one page sem servidor não precisam de nada além do `node`. Sem
essas ferramentas os scripts avisam e param, e o que não foi conferido é reportado como
não conferido.

## Como construir o seu

A partir daqui é o outro caminho: não usar, e sim estender. Você só precisa dele quando
o time tem sistema próprio para ler e escrever, e quer que a skill dispare sozinha com o
vocabulário da casa.

A skill de método é cliente-agnóstica de propósito: ela não conhece ferramenta, ID nem
nome de pessoa. Quem conhece é a skill derivada, que você escreve no plugin do seu time.

Uma derivada tem cinco seções e cabe em trinta linhas:

```markdown
---
name: one-page-engajamento
description: >-
  Use quando pedirem o one page do time de Engajamento, o status semanal do
  engajamento, ou a pauta do 1:1 do time.
---

## ENTRADAS
Dossiê do time `engajamento` na API interna. Métricas manuais entram por conversa.

## SAÍDAS
Rascunho no espaço de produto. Publicação só depois do meu ok.

## DESVIOS
Aqui "dormentes" são contas sem uso há mais de 30 dias, não 60.

## DELEGAÇÃO
Carregue a skill `rumbo-one-page` e execute o fluxo dela com este binding.
Onde o método conflitar com este arquivo, este arquivo vence.
```

Três coisas que fazem isso funcionar:

1. **A derivada delega pelo nome, nunca por caminho de arquivo.** Plugin instalado só
   enxerga o próprio diretório, então `plugins/rumbo-core/...` não existe na máquina de
   quem instalou.
2. **Fato do time mora no `contexto/perfil.md`**, uma vez só. Stakeholders, cadência,
   vocabulário e tom são lidos por todas as skills daquele time.
3. **Se a derivada passou de trinta linhas, ela está fazendo o trabalho de outro
   arquivo.** Ou virou método, e sobe generalizada, ou virou contexto, e desce para o
   perfil. `templates/plugin-cliente/` é o esqueleto para copiar, e as convenções estão
   em [CLAUDE.md](CLAUDE.md).

## Onde ficam os clientes

**Não aqui.** Cada cliente tem o próprio repositório de plugins, na organização dele, no
formato `<cliente>-claude-plugins`. Três motivos, e o primeiro sozinho já decide:

1. **Isolamento por construção.** Quem está na org de um cliente não tem acesso à do
   outro. Não é uma regra a manter, é uma parede que já existe.
2. **Este repositório é público.** O método é cliente-agnóstico por regra, então
   publicá-lo não expõe ninguém. Perfil de cliente, sim. Um CI reprova qualquer commit
   que nomeie um cliente.
3. **A skill deixa de ser refém de um repositório.** Instalada como plugin na org do
   cliente, ela vale em qualquer sessão daquele time.

Quem usa instala dois marketplaces: este, com o método, e o da própria empresa, com o
binding. Sem o `rumbo-core` instalado, a derivada não tem para onde delegar.

## Mapa

```
plugins/rumbo-core/
  metodo/          a PI: princípios, escrita, deck, release notes, one page
  scripts/         o que serve mais de uma skill: hoje a configuração da casa
  skills/          o fluxo de cada conversa, e os scripts que rodam
templates/         esqueletos para copiar: método novo, skill nova, plugin de cliente
docs/demo/         a fonte da demo publicada, toda fictícia
CLAUDE.md          convenções de autoria, e como rodar cada script
```

Divisão de trabalho: `metodo/` é o que se lê, `scripts/` é o que roda, `SKILL.md` é o
que conduz.

## Estado

Quatro métodos escritos e as skills genéricas correspondentes. Nenhum binding de cliente
mora aqui, e nenhum jamais morou: eles saíram antes do primeiro commit, de propósito. O
que entra no histórico do git não sai mais.

Dívida conhecida: o `templates/plugin-cliente/contexto/perfil.md` ainda pede campos que
não deveriam entrar num plugin, como quem não pode ser copiado e escopo comercial. A
régua correta é simples, se o cliente não pode ler, não entra. O template precisa ser
corrigido antes de servir ao próximo cliente.
