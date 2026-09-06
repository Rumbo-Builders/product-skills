# product-skills — biblioteca de skills da Rumbo

Método genérico em um plugin. Bindings específicos em um plugin por cliente.
As convenções de autoria estão em [CLAUDE.md](CLAUDE.md) — leia antes de escrever.

## Mapa

```
.claude-plugin/marketplace.json   registro do plugin deste repo
CLAUDE.md                         convenções de autoria (a regra que segura tudo)
plugins/
  rumbo-core/                     método: skills genéricas, cliente-agnósticas
    metodo/
      _principios.md              régua que vale pra todo entregável
      escrita.md                  + escrita-antes-e-depois.md
      deck.md                     + deck-infograficos.md
      release-notes.md
      one-page.md                 one page e roadmap de produto
    skills/
      rumbo-escrita/
      rumbo-deck/scripts/         base.js (motor), tema-neutro.js, exemplo.js, qa.sh
      rumbo-release-notes/scripts/ coletar.sh, base.css, modelo.html, gerar.sh
      rumbo-one-page/scripts/     contexto.mjs, validar.sh, publicar.mjs
templates/                        esqueletos para copiar (nunca carregado como skill)
  metodo.md
  skill-de-metodo/
  plugin-cliente/                 o esqueleto que vai para a org do cliente
```

## Onde ficam os clientes

**Não aqui.** Cada cliente tem o próprio repositório de plugins, na organização
dele, no formato `<cliente>-claude-plugins`.

Três motivos, e o primeiro sozinho já decide:

1. **Isolamento por construção.** Quem está na org de um cliente não tem acesso
   à org do outro. Não é uma regra a manter, é uma parede que já existe.
2. **Este repositório vai ser público.** O método é cliente-agnóstico por regra,
   então publicá-lo não expõe ninguém. Perfil de cliente, sim.
3. **A skill deixa de ser refém de um repositório.** Instalada como plugin na org
   do cliente, ela vale em qualquer sessão daquele time, não só dentro de um repo.

Quem usa instala **dois** marketplaces: este, com o método, e o da própria
empresa, com o binding. A derivada delega para a skill de método pelo NOME, e
sem o `rumbo-core` instalado ela não tem para onde delegar.

## Estado

Quatro métodos escritos (escrita, deck, release notes e one page) e as skills
genéricas correspondentes no `rumbo-core`.

Nenhum binding de cliente mora aqui, e nenhum jamais morou: eles saíram antes do
primeiro commit, de propósito. O que entra no histórico do git não sai mais, e
este repositório é feito para ser público.

O `templates/plugin-cliente/` é o esqueleto que vai para a organização de cada
cliente. Ele ainda pede, no `contexto/perfil.md`, campos que **não deveriam
entrar num plugin**: como cada pessoa decide, quem não pode ser copiado, escopo
comercial. A régua correta é: se o cliente não pode ler, não entra. O template
precisa ser corrigido antes de servir ao próximo cliente.
