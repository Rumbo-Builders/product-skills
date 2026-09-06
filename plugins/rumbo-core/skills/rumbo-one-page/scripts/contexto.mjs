#!/usr/bin/env node
/**
 * Pré-processador do one page: dossiê em JSON entra, briefing em markdown sai.
 *
 * O modelo NUNCA lê o JSON. Três motivos, e todos já custaram caro em outros
 * lugares: JSON grande consome contexto que faria falta na redação; o modelo
 * apura mal quando precisa cruzar listas por identificador; e um campo ausente
 * no meio de um objeto passa despercebido, enquanto uma lacuna nomeada em prosa
 * vira pergunta.
 *
 * Tudo aqui é determinístico. O que este script decide, o modelo não redecide.
 *
 * Uso:
 *   node contexto.mjs --time <id> [--ano 2026] [--trimestre 3] [--saida dir]
 *
 * Ambiente:
 *   RUMBO_ONEPAGE_API    base da API que fala o contrato do dossiê
 *   RUMBO_ONEPAGE_TOKEN  credencial (opcional se a API aceitar sessão)
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// argumentos
// ---------------------------------------------------------------------------

function args(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const chave = a.slice(2);
      const proximo = argv[i + 1];
      if (proximo && !proximo.startsWith("--")) {
        out[chave] = proximo;
        i++;
      } else {
        out[chave] = true;
      }
    }
  }
  return out;
}

const opts = args(process.argv);
const time = opts.time || opts.squad;
const base = process.env.RUMBO_ONEPAGE_API;
const saida = opts.saida || ".rumbo-one-page";

if (!time) {
  console.error("Falta --time <identificador>.");
  process.exit(1);
}
if (!base) {
  console.error(
    "Falta RUMBO_ONEPAGE_API no ambiente. É a base da API que devolve o dossiê.",
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// busca
// ---------------------------------------------------------------------------

/**
 * Cabeçalho de autenticação.
 *
 * O padrão é `Authorization: Bearer`, mas o nome do cabeçalho é configurável
 * porque isto é método, não binding: cada cliente autentica do seu jeito, e
 * cravar um nome aqui obrigaria a bifurcar o script por cliente, que é
 * exatamente o que a biblioteca existe para evitar.
 */
function cabecalhos(extra = {}) {
  const h = { Accept: "application/json", ...extra };
  const token = process.env.RUMBO_ONEPAGE_TOKEN;
  if (!token) return h;
  const nome = process.env.RUMBO_ONEPAGE_AUTH_HEADER || "Authorization";
  h[nome] = nome.toLowerCase() === "authorization" ? `Bearer ${token}` : token;
  return h;
}

async function buscar(caminho) {
  const url = `${base.replace(/\/$/, "")}${caminho}`;
  const r = await fetch(url, { headers: cabecalhos() });
  if (r.status === 404) return null;
  if (!r.ok) {
    const corpo = await r.text();
    throw new Error(`${r.status} em ${caminho}: ${corpo.slice(0, 300)}`);
  }
  return r.json();
}

// ---------------------------------------------------------------------------
// formatação
// ---------------------------------------------------------------------------

const nada = "nao informado";

function valorExibido(leitura) {
  if (!leitura) return nada;
  if (leitura.texto) return leitura.texto;
  if (leitura.valor == null) return nada;
  return String(leitura.valor);
}

/** A seta sai da direção já calculada, nunca do sinal cru. */
function seta(direcao) {
  if (direcao === "melhora") return "melhorou";
  if (direcao === "piora") return "piorou";
  if (direcao === "estavel") return "estavel";
  return "";
}

function tabelaIndicadores(indicadores) {
  if (!indicadores?.length) return "_Nenhum indicador registrado._\n";

  const linhas = [
    "| indicador | atual | anterior | variacao | leitura | origem |",
    "|---|---|---|---|---|---|",
  ];

  for (const i of indicadores) {
    const atual = i.leituras?.[0];
    const anterior = i.leituras?.[1];
    const d = i.delta;
    const variacao = d
      ? `${d.valor > 0 ? "+" : ""}${d.valor}${d.pct != null ? ` (${d.pct}%)` : ""}, ${seta(d.direcao)}${
          d.dias_entre_leituras != null
            ? `, ${d.dias_entre_leituras}d entre leituras`
            : ""
        }`
      : "sem base de comparacao";

    linhas.push(
      `| \`${i.slug}\` ${i.nome && i.nome !== i.slug ? `(${i.nome})` : ""} | ${valorExibido(atual)} | ${valorExibido(anterior)} | ${variacao} | ${atual?.periodo ?? nada} | ${i.confianca} |`,
    );
  }
  return linhas.join("\n") + "\n";
}

function gradeRoadmap(roadmap) {
  if (!roadmap?.versao_publicada) {
    return "_Nenhum roadmap publicado ainda._\n";
  }

  const meta = roadmap.meta ?? {};
  const modo = meta.modo ?? "timeline";

  if (modo === "now_next_later") {
    const grupos = { now: [], next: [], later: [], parking: [] };
    for (const item of roadmap.itens ?? []) {
      (grupos[item.estado_nnl] ?? grupos.later).push(item);
    }
    const bloco = (titulo, lista) =>
      `**${titulo}**\n` +
      (lista.length
        ? lista.map((i) => `- \`${i.slug}\` ${i.texto}`).join("\n")
        : "- _vazio_") +
      "\n";
    return [
      `Modo: agora / proximo / depois (v${roadmap.versao_publicada})\n`,
      bloco("Agora", grupos.now),
      bloco("Proximo", grupos.next),
      bloco("Depois", grupos.later),
      bloco("Estacionamento", grupos.parking),
    ].join("\n");
  }

  const faixas = meta.faixas ?? [];
  const colunas = meta.colunas ?? [];
  if (!faixas.length || !colunas.length) {
    return `Modo: linha do tempo (v${roadmap.versao_publicada}), sem faixas ou colunas declaradas.\n`;
  }

  const cabecalho = `| faixa | ${colunas.map((c) => c.rotulo + (c.atual ? " (atual)" : "")).join(" | ")} |`;
  const separador = `|---|${colunas.map(() => "---").join("|")}|`;
  const linhas = faixas.map((f) => {
    const celulas = colunas.map((c) => {
      const achados = (roadmap.itens ?? []).filter(
        (i) => i.faixa === f.slug && i.coluna === c.slug,
      );
      return achados.length ? achados.map((a) => a.texto).join("; ") : "";
    });
    return `| **${f.titulo}** | ${celulas.join(" | ")} |`;
  });

  return [
    `Modo: linha do tempo, granularidade ${meta.granularidade ?? nada} (v${roadmap.versao_publicada})\n`,
    cabecalho,
    separador,
    ...linhas,
    "",
  ].join("\n");
}

/**
 * O diff é o que pauta a conversa. Comparado por identificador, nunca por texto:
 * texto de modelo muda de redação sem mudar de conteúdo, e um diff textual
 * apontaria mudança onde não houve.
 */
function blocoDiff(diff) {
  if (!diff || !diff.anterior) {
    return "_Primeira versao publicada: nao ha o que comparar._\n";
  }

  const partes = [`Comparando v${diff.anterior.versao} com v${diff.atual.versao}.\n`];

  const lista = (titulo, itens, fmt) => {
    if (!itens?.length) return;
    partes.push(`**${titulo}** (${itens.length})`);
    itens.slice(0, 15).forEach((i) => partes.push(fmt(i)));
    if (itens.length > 15) partes.push(`- _e mais ${itens.length - 15}_`);
    partes.push("");
  };

  lista("Novos", diff.novos, (i) => `- \`${i.slug}\` [${i.kind}] ${i.texto}`);
  lista("Sumiram", diff.removidos, (i) => `- \`${i.slug}\` [${i.kind}] ${i.texto}`);
  lista(
    "Mudaram",
    diff.mudados,
    (i) => `- \`${i.slug}\`: "${i.antes?.texto ?? ""}" -> "${i.agora?.texto ?? ""}"`,
  );

  if (partes.length === 1) partes.push("_Nenhuma alca mudou._\n");
  return partes.join("\n");
}

function briefing(d, diff) {
  const p = d.meta.periodo;
  const anterior = d.publicacao_anterior?.one_page;

  const linhas = [];

  linhas.push(`# Briefing: ${d.meta.squad.nome}`);
  linhas.push("");
  linhas.push(
    `Periodo ${p.year} Q${p.quarter}, dia ${p.dia} de ${p.total_dias}. Dossie gerado em ${new Date(d.meta.gerado_em).toLocaleString("pt-BR")}.`,
  );
  linhas.push("");

  if (anterior) {
    linhas.push(
      `Ultima publicacao: v${anterior.versao}, ha ${anterior.ha_dias} dias.`,
    );
    if (anterior.insight) linhas.push(`> ${anterior.insight}`);
  } else {
    linhas.push("Nenhuma publicacao anterior deste time.");
  }
  linhas.push("");

  linhas.push("## O que mudou desde a ultima versao");
  linhas.push("");
  linhas.push(blocoDiff(diff));

  linhas.push("## Movimento no periodo");
  linhas.push("");
  const m = d.movimento ?? {};
  linhas.push(
    `Desde ${m.desde ? new Date(m.desde).toLocaleDateString("pt-BR") : nada}.`,
  );
  linhas.push("");
  if (m.features_concluidas?.length) {
    linhas.push(`**Concluido** (${m.features_concluidas.length})`);
    m.features_concluidas.slice(0, 20).forEach((f) =>
      linhas.push(
        `- ${f.titulo}${f.faixa_sugerida ? ` [faixa sugerida: ${f.faixa_sugerida}, via ${f.confianca_faixa}]` : " [sem faixa]"}`,
      ),
    );
    linhas.push("");
  }
  if (m.features_atrasadas?.length) {
    linhas.push(`**Atrasado** (${m.features_atrasadas.length})`);
    m.features_atrasadas
      .slice(0, 15)
      .forEach((f) => linhas.push(`- ${f.titulo}, ${f.dias_de_atraso} dias`));
    linhas.push("");
  }
  if (m.features_sem_faixa?.length) {
    linhas.push(
      `**Candidatos a faixa "outros"** (${m.features_sem_faixa.length}): feito, sem relacao explicita com objetivo.`,
    );
    m.features_sem_faixa.slice(0, 15).forEach((f) => linhas.push(`- ${f.titulo}`));
    linhas.push("");
  }
  if (m.issues) {
    linhas.push(
      `Issues: ${m.issues.fechadas} fechadas no periodo, ${m.issues.abertas} abertas, ${m.issues.p0_p1_abertas} criticas abertas.`,
    );
    linhas.push("");
  }

  linhas.push("## Objetivos e metas");
  linhas.push("");
  if (d.okrs?.length) {
    for (const o of d.okrs) {
      if (o.kr) {
        linhas.push(
          `- **${o.titulo}**: ${o.kr.texto}. Base ${o.kr.baseline ?? nada}, meta ${o.kr.meta ?? nada}, atual ${o.kr.atual ?? nada}${o.kr.progresso_pct != null ? ` (${o.kr.progresso_pct}%)` : ""}.`,
        );
      } else {
        linhas.push(`- **${o.titulo}**: sem meta vinculada.`);
      }
    }
  } else {
    linhas.push("_Nenhum objetivo cadastrado para este time._");
  }
  linhas.push("");

  linhas.push("## Roadmap publicado");
  linhas.push("");
  linhas.push(gradeRoadmap(d.roadmap));
  linhas.push("");

  linhas.push("## Indicadores");
  linhas.push("");
  linhas.push(tabelaIndicadores(d.indicadores));
  linhas.push("");
  linhas.push(
    "Use marcador no texto, nunca o digito: `{{identificador}}` e `{{identificador.delta_pct}}`.",
  );
  linhas.push("");

  linhas.push("## Decisoes ainda abertas");
  linhas.push("");
  if (d.decisoes_abertas?.length) {
    d.decisoes_abertas.forEach((x) =>
      linhas.push(
        `- \`${x.slug}\` [${x.genero}] ${x.texto} (aberta ha ${x.aberta_ha_dias} dias, da v${x.publicada_na_versao})`,
      ),
    );
  } else {
    linhas.push("_Nenhuma._");
  }
  linhas.push("");

  linhas.push("## Destinatarios possiveis");
  linhas.push("");
  const dest = d.destinatarios ?? {};
  if (dest.canais?.length) {
    linhas.push(
      `Canais: ${dest.canais.map((c) => `${c.slug}${c.padrao ? " (padrao)" : ""}`).join(", ")}`,
    );
  }
  if (dest.squad?.length) {
    linhas.push(
      `Time: ${dest.squad.map((s) => `${s.nome} (${s.papel}, id ${s.id})`).join("; ")}`,
    );
  }
  if (dest.frequentes?.length) {
    linhas.push(
      `Ja notificados antes: ${dest.frequentes.map((f) => `${f.nome} (${f.vezes}x, id ${f.id})`).join("; ")}`,
    );
  }
  linhas.push("");

  // As lacunas ficam por último porque são o que se leva para a conversa.
  linhas.push("## Perguntar antes de escrever");
  linhas.push("");
  if (d.lacunas?.length) {
    d.lacunas.forEach((l) => linhas.push(`- **${l.campo}**: ${l.motivo}`));
    linhas.push("");
    linhas.push(
      "Cada linha acima e um buraco no dossie. Pergunte, ou declare a ausencia no texto. Nao preencha por conta.",
    );
  } else {
    linhas.push("_Nenhuma lacuna detectada._");
  }
  linhas.push("");

  return linhas.join("\n");
}

// ---------------------------------------------------------------------------
// principal
// ---------------------------------------------------------------------------

const query = new URLSearchParams({ squad: time });
if (opts.ano) query.set("year", String(opts.ano));
if (opts.trimestre) query.set("quarter", String(opts.trimestre));

try {
  const dossie = await buscar(`/api/product-artifacts/context?${query}`);
  if (!dossie) {
    console.error(`Time "${time}" nao encontrado na origem.`);
    process.exit(1);
  }

  const diff = await buscar(
    `/api/product-artifacts/${encodeURIComponent(time)}/one_page/diff`,
  );

  mkdirSync(saida, { recursive: true });
  const cru = join(saida, `dossie-${time}.json`);
  const doc = join(saida, `briefing-${time}.md`);

  writeFileSync(cru, JSON.stringify({ dossie, diff }, null, 2), "utf8");
  const texto = briefing(dossie, diff);
  writeFileSync(doc, texto, "utf8");

  console.log(texto);
  console.error(`\n[contexto] briefing em ${doc}`);
  console.error(`[contexto] dossie cru em ${cru} (consulta pontual, nao leia inteiro)`);
} catch (e) {
  console.error(`[contexto] falhou: ${e.message}`);
  process.exit(1);
}
