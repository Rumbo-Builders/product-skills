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
  skills/<skill>/
    SKILL.md         só o fluxo da conversa
    scripts/         o que roda: motor, tema, QA
    assets/          binários que a skill precisa
```

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

**Um cliente novo**
1. `cp -r templates/plugin-cliente plugins/rumbo-<cliente>`
2. Preencha `plugin.json`, `.mcp.json`, `contexto/perfil.md`
3. Registre em `.claude-plugin/marketplace.json`
4. Renomeie `skills/NOME-DA-SKILL/` e preencha o contrato de cinco seções

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
