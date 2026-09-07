# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Convenções de autoria — biblioteca de skills da Rumbo

Este repo tem **uma** regra estrutural, e todas as outras existem pra protegê-la:

> **O método mora em um lugar só. Skill nenhuma o copia.**

Melhorar "o que é um bom roadmap" tem que ser editar **um** arquivo. No dia em que
isso virar "editar onze arquivos", a biblioteca já morreu — ela só ainda não sabe.

---

## As três camadas

| Camada | O que é | Muda quando | Onde vive |
|---|---|---|---|
| **Método** | A PI da Rumbo. O que é um bom roadmap, a régua de qualidade, o formato de saída. Abstrato, sem cliente, sem ferramenta. | Você aprende algo | `plugins/rumbo-core/metodo/<nome>.md` |
| **Skill de método** | O gatilho + o fluxo de conversa. Quando disparar, que perguntas fazer, em que ordem. Cliente-agnóstica. | Raramente | `plugins/rumbo-core/skills/<nome>/SKILL.md` |
| **Binding de cliente** | Os plugues: quais sistemas são input, quais são output, qual canal, vocabulário, stakeholders, IDs. | A cada projeto | `plugins/rumbo-<cliente>/` |

Se você está escrevendo algo e não sabe em qual das três ele cai, use o teste:

- Vale pra **todo** cliente? → método
- É **como conduzir a conversa**, não o conteúdo? → skill de método
- Tem um **ID, um nome de pessoa ou um nome de ferramenta** dentro? → binding

---

## Anatomia de um plugin

```
plugins/rumbo-core/
  metodo/            prosa: a PI. Um assunto por arquivo, e material de apoio
                     ao lado (escrita.md, escrita-antes-e-depois.md)
  scripts/           o que serve MAIS DE UMA skill. Hoje só o configurar.mjs
  skills/<skill>/
    SKILL.md         só o fluxo da conversa
    scripts/         o que roda: motor, tema, QA
    assets/          binários que a skill precisa
```

`scripts/` na raiz é para o que nenhuma skill pode ser dona. O configurador de
primeira vez está lá porque o que ele grava (cor, fonte, logo, tom) é lido pelo
deck, pelo one page, pelas release notes e pela escrita. Script compartilhado
morando dentro de uma skill é a mesma doença do método copiado: um dia alguém
mexe nele por causa do one page e o deck muda de cor.

Divisão de trabalho: **`metodo/` é o que se lê, `scripts/` é o que roda, `SKILL.md`
é o que conduz.** Se o SKILL.md está explicando o método, ele engordou: o texto
desce para `metodo/` e fica a referência.

## Régua executável

Critério de qualidade que só existe em prosa não é aplicado. Onde a regra for
verificável por máquina, deixe-a rodando: um grep, um script que reprova o build.
`skills/rumbo-deck/scripts/qa.sh` é o exemplo, ele falha o build se achar travessão
ou vocabulário proibido no PDF renderizado.

E o inverso vale igual: o que a máquina não vê (colisão de layout, se o argumento
fecha) a skill tem que mandar o humano olhar, e nunca reportar como conferido o que
não foi conferido.

---

## Como rodar

Não há build, nem suíte de testes, nem `package.json`. O que existe são scripts por
skill, e cada um roda direto. Os caminhos abaixo saem de `plugins/rumbo-core/skills/`:

```bash
# deck: gera, valida o XML, renderiza e reprova o build pelas regras da casa
bash rumbo-deck/scripts/qa.sh deck.js Saida.pptx

# primeira vez, uma só: a entrevista vira .rumbo/ (serve todas as skills)
node ../scripts/configurar.mjs --casa <id> --nome "<Nome>" --acento "#1f4f7a"

# one page: contexto → redação → régua → publicação
node rumbo-one-page/scripts/contexto.mjs --time <id> [--ano 2026] [--trimestre 3]
bash rumbo-one-page/scripts/validar.sh envelope.json
node rumbo-one-page/scripts/publicar.mjs envelope.json --rascunho   # ou --publicar

# ...ou, sem origem que fale o contrato, o caminho sem servidor
node rumbo-one-page/scripts/contexto-local.mjs --anterior anterior.json \
  --movimento movimento.json --triagem triagem.json
node rumbo-one-page/scripts/render.mjs --one-page envelope.json \
  --roadmap envelope-roadmap.json --anterior .rumbo/anterior.json

# release notes: commits da janela → HTML → PDF renderizado
bash rumbo-release-notes/scripts/coletar.sh <repo> 2026-08-27 [2026-09-03] [branch]
bash rumbo-release-notes/scripts/gerar.sh notas.html Saida.pdf

# régua de texto, em qualquer arquivo (os greps completos estão em _principios.md)
grep -nE "—|[!?]{2,}" arquivo.md
```

O mais próximo de um teste que este repo tem são dois exemplos, e eles servem de
smoke test. Rode os dois depois de mexer no motor do deck ou em qualquer régua:

```bash
node rumbo-deck/scripts/exemplo.js                                  # → Exemplo.pptx
bash rumbo-one-page/scripts/validar.sh rumbo-one-page/scripts/exemplo-envelope.json
```

Nenhuma dependência está declarada, e nenhuma vem com o repo: `pptxgenjs` para o
deck, LibreOffice e poppler (`pdftoppm`, `pdftotext`) para renderizar e conferir,
Chrome ou Chromium para o PDF das release notes.

**Script que não acha a ferramenta sai com 0 e um aviso.** `qa.sh` sem LibreOffice
imprime aviso e encerra aprovado sem ter renderizado nada; `validar.sh` sem `node`
faz o mesmo. Leia a saída inteira antes de dizer que passou, e confira se cada etapa
de fato rodou. Silêncio virando aprovação é o pior defeito de uma régua, e o
comentário no meio de `validar.sh` existe porque isso já aconteceu aqui.

## O que roda: arquitetura dos scripts

Três fluxos, e os três com a mesma forma: determinístico onde dá, e o humano olha o
que a máquina não vê.

**Deck.** `base.js` é o motor sobre `pptxgenjs`, cliente-agnóstico: `criar(tema)`
devolve os helpers de desenho (`capa`, `chrome`, `slideL`, `tabela`, `escada`,
`ponte`, `kpiStrip`). Cor, fonte e logo vêm do tema, e `tema-neutro.js` é o de
referência; geometria e proporção são fixas e não são tema. `qa.sh` gera, valida,
converte para PDF, extrai o texto e reprova o build no travessão, na pontuação em
série e no vocabulário proibido (`RUMBO_VOCAB_EXTRA` aponta a lista extra de um
cliente). Depois manda ler `render/s-*.jpg` slide a slide, porque colisão de layout
não aparece no texto.

**One page. Dois destinos, e o mesmo envelope.** Com origem que fale o contrato:
`contexto.mjs` → redação → `validar.sh` → `publicar.mjs`. Sem origem nenhuma:
`contexto-local.mjs` → redação → `validar.sh` → `render.mjs`, que monta uma página
de duas abas (one page e roadmap detalhado) para o agente publicar, com o histórico
das versões embutido nela e cada versão carregando a cópia da grade que projetou.
A régua é a mesma nos dois, e é isso que impede o destino barato de virar o destino
ruim. A regra que explica o desenho: **o modelo nunca lê o dossiê JSON.** `contexto.mjs` transforma o
dossiê em briefing markdown, e o que ele decide o modelo não redecide. `validar.sh`
reprova envelope sem identificador estável, decisão sem gênero, pergunta sem
destinatário, marcador `{{x}}` que não resolve, dígito solto no bloco de indicadores
e tabela markdown escrita à mão. `publicar.mjs` exige `--rascunho` ou `--publicar`,
sem modo padrão, porque publicar comunica e aviso não se despublica. Ambiente:
`RUMBO_ONEPAGE_API` e `RUMBO_ONEPAGE_TOKEN`.

**Release notes.** `coletar.sh` traz os commits da janela com o corpo inteiro, porque
o porquê está no corpo e a triagem é trabalho do método, não do script. O modelo
escreve o HTML sobre `modelo.html` e `base.css`, e `gerar.sh` imprime pelo Chrome
headless e renderiza em JPG para conferência.

---

## Composição: delegação, não caminho de arquivo

Plugin instalado só enxerga o próprio diretório. O plugin do cliente **não**
consegue ler `plugins/rumbo-core/metodo/roadmap.md` — esse caminho não existe na
máquina de quem instalou.

Por isso a skill derivada nunca lê o método. Ela monta o binding e **delega**:

```
plugins/rumbo-acme/skills/roadmap-acme/SKILL.md
  └─ "carregue a skill rumbo-roadmap e execute o fluxo dela com este binding"
       └─ plugins/rumbo-core/skills/rumbo-roadmap/SKILL.md
            └─ lê ${CLAUDE_PLUGIN_ROOT}/metodo/roadmap.md
```

Cada plugin só toca nos próprios arquivos. `${CLAUDE_PLUGIN_ROOT}` é a raiz do
plugin **que contém a skill que está rodando** — nunca do outro.

**Regra dura:** nenhum SKILL.md de plugin de cliente pode conter um caminho que
comece com `plugins/`, `../` ou `~/`.

---

## O contrato da skill derivada

Uma skill derivada tem **cinco seções e nada mais**:

1. **frontmatter** — `name` + `description` com os gatilhos daquele cliente
2. **ENTRADAS** — de onde ler (data_source_id, JQL, planilha, canal)
3. **SAÍDAS** — onde escrever, em que formato, com que nome
4. **DESVIOS** — o que esse cliente chama diferente; exceções ao método
5. **DELEGAÇÃO** — qual skill de método executar, e a linha de precedência

Precedência, sempre nessas palavras:

> Onde o método conflitar com este arquivo, **este arquivo vence**.

### Teto de tamanho: ~30 linhas

Não é estética, é diagnóstico. Se uma derivada está estourando, uma das duas
coisas aconteceu — e as duas têm conserto conhecido:

| Sintoma | O que de fato é | Conserto |
|---|---|---|
| A derivada está explicando *como fazer* | O desvio virou método | Sobe pra `metodo/`, generalizado |
| A derivada está descrevendo o cliente | É contexto, não binding | Desce pro `contexto/perfil.md` |

Nunca resolva estourando o teto.

---

## Contexto do cliente: perfil ≠ skill

`plugins/rumbo-<cliente>/contexto/perfil.md` é lido por **todas** as skills daquele
cliente: stakeholders, cadência, vocabulário, tom, o que não se fala.

Escrever stakeholders dentro de `roadmap-acme` **e** dentro de `follow-up-acme` é o
começo da divergência. Fato de cliente vai pro perfil, uma vez.

### Binding sem plugin: `.rumbo/` na pasta de trabalho

Um plugin de cliente exige um repositório e uma instalação, e quem só quer usar o
método hoje não tem nenhum dos dois. Para esse caso existe uma quarta forma, que é
o mesmo binding sem o plugin: `node plugins/rumbo-core/scripts/configurar.mjs`
grava um `.rumbo/` na pasta de trabalho.

| Arquivo | O que é | Quem lê |
|---|---|---|
| `perfil.md` | tom, quem lê, vocabulário, cuidados | o modelo |
| `marca.json` | cores, fontes, logo, favicon, ressalvas | os scripts |
| `tema.css` | derivado de `marca.json` | one page e release notes |
| `tema.js` | derivado de `marca.json` | o motor do deck |

A divisão é a mesma das três camadas, um nível abaixo: `marca.json` e `perfil.md`
são da casa e valem para todas as skills; o que é de uma skill só fica com ela
(`one-page.config.json`, ao lado). Cor escrita nos dois diverge na semana em que
alguém editar só um.

**Tom ajusta registro, não suspende a régua.** Formal ou direto é escolha da casa.
Travessão, ênfase gráfica e vocabulário de consultoria continuam reprovando. Sem
essa linha escrita no `perfil.md`, "tom de voz" vira a porta dos fundos por onde a
régua sai.

**`.rumbo/` não entra em repositório**, e está no `.gitignore` daqui. Ele carrega
nome, cor e logo, e a checagem de vazamento só lê texto: um PNG de logo passa por
ela sem ser visto.

---

## Descriptions são gatilho, não resumo

A `description` do frontmatter é o único texto que decide se a skill dispara. Ela
não é uma descrição — é uma **lista de situações e palavras**. Escreva as palavras
que o usuário realmente digita, incluindo as que ele digita *sem* saber que existe
uma skill.

Bom: `Use SEMPRE que o usuário disser "roadmap da Acme", "o trimestral", "planejar o
Q3", ou colar a ata do comitê da Acme — mesmo que não diga a palavra skill.`

Ruim: `Gera roadmaps para o cliente Acme.`

Para derivadas, os gatilhos **precisam** conter o nome do cliente ou um termo que só
existe naquele cliente. Duas derivadas que disparam com as mesmas palavras é bug.

---

## Nomes

| Coisa | Padrão | Exemplo |
|---|---|---|
| Plugin de cliente | `rumbo-<cliente>` | `rumbo-acme` |
| Skill de método | `rumbo-<metodo>` | `rumbo-roadmap` |
| Skill derivada | `<metodo>-<cliente>` | `roadmap-acme` |
| Arquivo de método | `<metodo>.md` | `roadmap.md` |

Nomes de skill são globais na sessão — colisão entre dois clientes quebra os dois.

---

## Como adicionar

**Um método novo**
1. `plugins/rumbo-core/metodo/<nome>.md` — copie `templates/metodo.md`
2. `plugins/rumbo-core/skills/rumbo-<nome>/SKILL.md` — copie `templates/skill-de-metodo/`
3. Bump da `version` em `plugins/rumbo-core/.claude-plugin/plugin.json`

**Um cliente novo.** Não aqui. O plugin do cliente nasce e vive no repositório da
organização dele, no formato `<cliente>-claude-plugins`, e o CI deste repo reprova
commit que nomeie qualquer cliente.

1. `cp -r templates/plugin-cliente <repo-do-cliente>/plugins/rumbo-<cliente>`
2. Preencha `plugin.json`, `.mcp.json`, `contexto/perfil.md`
3. Registre no `marketplace.json` **daquele** repositório
4. Renomeie `skills/NOME-DA-SKILL/` e preencha o contrato de cinco seções

Quem usa instala dois marketplaces: este, com o método, e o do próprio cliente, com o
binding. Sem o `rumbo-core` instalado, a derivada não tem para onde delegar.

O `templates/plugin-cliente/contexto/perfil.md` ainda pede campos que não deveriam
entrar num plugin (como cada pessoa decide, quem não pode ser copiado, escopo
comercial). A régua é: se o cliente não pode ler, não entra. Corrija o template antes
de servir ao próximo cliente.

**Uma derivada nova para cliente existente**
1. `cp -r templates/plugin-cliente/skills/NOME-DA-SKILL plugins/rumbo-<cliente>/skills/<metodo>-<cliente>`
2. Cinco seções. Se passar de 30 linhas, veja a tabela de sintomas acima.

---

## `.mcp.json`: um por cliente, e é o ponto

Cada plugin de cliente carrega os conectores **daquele** cliente. É o que impede o
Jira do cliente A de aparecer na sessão do cliente B, e o que faz encerrar um
contrato ser `uninstall`.

Credencial não entra no repo. Use `${VAR}` no `.mcp.json` e deixe a variável no
ambiente. Rodar `git grep -iE 'sk-|token|secret|Bearer'` antes de commitar é barato.

## O CI checa uma coisa só

`.github/workflows/sem-vazamento.yml` reprova o commit se qualquer arquivo contiver
um nome da lista do segredo `NOMES_DE_CLIENTE` (separada por vírgula,
`gh secret set NOMES_DE_CLIENTE`). A lista não mora no arquivo de propósito: escrevê-la
publicaria exatamente o que ela protege. Sem o segredo o job falha, e é intencional,
porque checagem que passa em silêncio dá confiança sem dar proteção. A busca é por
substring, então nome curto de cliente gera falso positivo; o conserto é renomear no
texto, nunca afrouxar a checagem.

**A checagem lê texto, e só texto.** Imagem entrando no repo (um print de artefato no
README, por exemplo) passa livre pelo CI com nome de cliente, logo ou número interno
dentro. Print vai conferido a olho antes do commit, porque aqui não há rede embaixo.

---

## O que este repo não é

- Não é lugar de **entregável**. Roadmap da Acme é output, mora no Notion do cliente.
- Não é lugar de **dado de cliente**. Perfil descreve como trabalhar com eles, não
  guarda o trabalho.
- Skills daqui **não decidem sozinhas** publicar em canal do cliente. Toda saída que
  sai pra fora (Slack, e-mail, página compartilhada) é confirmada antes.

## Sobre as regras de escrita e este arquivo

`plugins/rumbo-core/metodo/_principios.md` proíbe travessão, ênfase gráfica e
vocabulário de consultoria genérica. Isso vale para **entregável**, não para a
documentação deste repo: README, CLAUDE.md e templates são ferramenta interna e
estão explicitamente fora do escopo. Se um dia você quiser aplicá-las aqui também, é
uma decisão consciente, não uma correção de bug.
