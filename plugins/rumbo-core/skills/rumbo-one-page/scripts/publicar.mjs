#!/usr/bin/env node
/**
 * Publica o envelope. Duas etapas, e a separação é o ponto.
 *
 * `--rascunho` grava a versão e devolve a URL de conferência, sem comunicar
 * nada. `--publicar` fecha a versão e dispara os avisos. Publicar direto tira do
 * autor a única chance de ver o artefato renderizado antes que ele saia, e
 * publicação comunica: não dá para despublicar um aviso.
 *
 * Uso:
 *   node publicar.mjs envelope.json --rascunho
 *   node publicar.mjs envelope.json --publicar
 *
 * Ambiente: RUMBO_ONEPAGE_API, RUMBO_ONEPAGE_TOKEN
 */

import { readFileSync } from "node:fs";

const arquivo = process.argv[2];
const publicar = process.argv.includes("--publicar");
const rascunho = process.argv.includes("--rascunho");

const base = process.env.RUMBO_ONEPAGE_API;

if (!arquivo || arquivo.startsWith("--")) {
  console.error("Uso: node publicar.mjs envelope.json [--rascunho|--publicar]");
  process.exit(1);
}
if (!publicar && !rascunho) {
  console.error(
    "Escolha --rascunho ou --publicar. Nao ha modo padrao de propósito: publicar comunica.",
  );
  process.exit(1);
}
if (!base) {
  console.error("Falta RUMBO_ONEPAGE_API no ambiente.");
  process.exit(1);
}

let envelope;
try {
  envelope = JSON.parse(readFileSync(arquivo, "utf8"));
} catch (e) {
  console.error(`Nao consegui ler ${arquivo}: ${e.message}`);
  process.exit(1);
}

envelope.status = publicar ? "published" : "draft";

// Canal só faz sentido publicando. Num rascunho é ruído que confunde quem lê o
// envelope depois.
if (!publicar) delete envelope.canais;

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

const headers = cabecalhos({ "Content-Type": "application/json" });

try {
  const r = await fetch(`${base.replace(/\/$/, "")}/api/product-artifacts`, {
    method: "POST",
    headers,
    body: JSON.stringify(envelope),
  });

  const corpo = await r.json().catch(() => ({}));

  if (r.status === 422) {
    console.error("Envelope recusado pelo servidor:\n");
    (corpo.problemas ?? []).forEach((p) =>
      console.error(`  - ${p.campo}: ${p.erro}`),
    );
    console.error(
      "\nO corpo do documento nao e validado. So o envelope: identificadores, generos e marcadores.",
    );
    process.exit(1);
  }

  if (!r.ok) {
    console.error(`Falhou (${r.status}): ${corpo.error ?? JSON.stringify(corpo)}`);
    process.exit(1);
  }

  console.log(`Versao ${corpo.version} gravada como ${corpo.status}.`);
  console.log(`Confira em: ${base.replace(/\/$/, "")}${corpo.url_preview}`);

  if (corpo.avisos?.length) {
    console.log("\nAvisos:");
    corpo.avisos.forEach((a) => console.log(`  - ${a}`));
  }

  if (corpo.comunicacao) {
    const { canais = [], dms = [] } = corpo.comunicacao;
    console.log("\nComunicacao:");
    canais.forEach((c) =>
      console.log(`  canal ${c.slug}: ${c.ok ? "enviado" : `FALHOU (${c.erro})`}`),
    );
    dms.forEach((d) =>
      console.log(
        `  privado para ${d.userId}: ${d.ok ? "enviado" : `FALHOU (${d.erro})`}`,
      ),
    );
    // Falha de entrega não desfaz a publicação: o artefato já está gravado, e
    // reenviar é barato. Mas quem publicou precisa saber.
    if ([...canais, ...dms].some((x) => !x.ok)) {
      console.log(
        "\nA versao foi publicada. Parte dos avisos falhou: reenvie ou avise a mao.",
      );
    }
  } else if (!publicar) {
    console.log("\nRascunho: nada foi comunicado.");
  }
} catch (e) {
  console.error(`Falhou: ${e.message}`);
  process.exit(1);
}
