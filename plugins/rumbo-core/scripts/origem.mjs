#!/usr/bin/env node
/**
 * A origem que fala o contrato: de onde a skill le o dossie e para onde publica.
 *
 * Sem variavel nenhuma, nao ha origem, e a skill segue no destino sem servidor
 * (render + pagina publicada). Com `RUMBO_ONEPAGE_API` e `RUMBO_ONEPAGE_TOKEN`,
 * a skill fala com a origem, como sempre falou.
 *
 * ORIGEM NOMEADA. Quem atende mais de uma casa tem mais de uma origem, e uma
 * variavel global so serve a uma delas. `RUMBO_ORIGEM=productops` faz os scripts
 * lerem `RUMBO_ONEPAGE_API_PRODUCTOPS` e `RUMBO_ONEPAGE_TOKEN_PRODUCTOPS` (e
 * `RUMBO_ONEPAGE_AUTH_HEADER_PRODUCTOPS`, se houver). Sem `RUMBO_ORIGEM`, as
 * variaveis sem sufixo valem, e nada muda para quem ja usa.
 *
 * Uso como modulo:  import { origem, cabecalhos, buscar } from "../../../scripts/origem.mjs"
 * Uso como CLI:     node origem.mjs --mostrar      (imprime a origem resolvida, sem o token)
 *
 * A CHAVE SO VAI PARA A API CONFIGURADA, e por canal cifrado. Toda chamada passa
 * por `pedir`: sem https (salvo localhost) nao sai; redirecionamento e erro, e
 * nao segue, porque cabecalho de autenticacao proprio atravessa o redirect; e
 * corpo de erro sai com a chave mascarada, porque proxy que ecoa cabecalho poe a
 * chave no log de quem rodou.
 */

const sufixoDe = (nome) => (nome ? `_${String(nome).toUpperCase().replace(/[^A-Z0-9]/g, "_")}` : "");

/** Resolve a origem pelo ambiente. `api` null significa "sem origem". */
export function origem(env = process.env) {
  const sufixo = sufixoDe(env.RUMBO_ORIGEM);
  const ler = (chave) => env[`${chave}${sufixo}`] ?? (sufixo ? undefined : env[chave]);
  const api = (ler("RUMBO_ONEPAGE_API") ?? "").replace(/\/$/, "");
  return {
    nome: env.RUMBO_ORIGEM || null,
    api: api || null,
    token: ler("RUMBO_ONEPAGE_TOKEN") || null,
    header: ler("RUMBO_ONEPAGE_AUTH_HEADER") || "Authorization",
  };
}

/**
 * Cabecalho de autenticacao. O padrao e `Authorization: Bearer`, mas o nome e
 * configuravel porque isto e metodo, nao binding: cada origem autentica do seu jeito.
 */
export function cabecalhos(extra = {}, o = origem()) {
  const h = { Accept: "application/json", ...extra };
  if (!o.token) return h;
  h[o.header] = o.header.toLowerCase() === "authorization" ? `Bearer ${o.token}` : o.token;
  return h;
}

/** A API so vale por https, salvo localhost: em http a chave viaja aberta. */
export function apiSegura(api) {
  try {
    const u = new URL(api);
    return u.protocol === "https:" || (u.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(u.hostname));
  } catch {
    return false;
  }
}

/** Texto com a chave trocada por asteriscos, para erro e log. */
export function mascarar(texto, o = origem()) {
  let t = String(texto ?? "");
  if (o.token) t = t.split(o.token).join("***");
  return t.replace(/(bearer\s+)[A-Za-z0-9._~+/=-]{8,}/gi, "$1***");
}

/** A chamada a origem, com as tres travas acima. Devolve a Response. */
export async function pedir(caminho, init = {}, o = origem()) {
  if (!o.api) throw new Error("Sem origem: falta RUMBO_ONEPAGE_API (ou a variavel com o sufixo de RUMBO_ORIGEM).");
  if (!apiSegura(o.api)) throw new Error(`A origem ${o.api} nao e https: a chave nao sai por canal aberto.`);
  try {
    return await fetch(`${o.api}${caminho}`, { ...init, headers: cabecalhos(init.headers ?? {}, o), redirect: "error" });
  } catch (e) {
    throw new Error(mascarar(`${caminho}: ${e.cause?.message ?? e.message}${/redirect/i.test(String(e.cause?.message ?? e.message)) ? " (a origem redirecionou, e a chave nao segue redirecionamento)" : ""}`, o));
  }
}

/** GET na origem: 404 vira null; outro erro lanca com o inicio do corpo, mascarado. */
export async function buscar(caminho, o = origem()) {
  const r = await pedir(caminho, {}, o);
  if (r.status === 404) return null;
  if (!r.ok) {
    const corpo = await r.text();
    throw new Error(mascarar(`${r.status} em ${caminho}: ${corpo.slice(0, 300)}`, o));
  }
  return r.json();
}

/** Sai com erro legivel quando a origem e obrigatoria e nao existe. */
export function exigirOrigem(o = origem()) {
  if (o.api && apiSegura(o.api)) return o;
  if (o.api) {
    console.error(`A origem ${o.api} nao e https. A chave nao sai por canal aberto; use https, ou localhost para teste.`);
    process.exit(1);
  }
  const dica = o.nome
    ? `RUMBO_ORIGEM=${o.nome} esta definido, mas falta RUMBO_ONEPAGE_API${sufixoDe(o.nome)} no ambiente.`
    : "Falta RUMBO_ONEPAGE_API no ambiente. E a base da origem que fala o contrato.";
  console.error(dica);
  console.error("Sem origem, o caminho e o local: contexto-local.mjs para o briefing e render.mjs para a pagina.");
  process.exit(1);
}

if (process.argv[1] && process.argv[1].endsWith("origem.mjs")) {
  const o = origem();
  console.log(`origem: ${o.nome ?? "(sem nome)"}`);
  console.log(`api:    ${o.api ?? "(nenhuma; destino sem servidor)"}`);
  // Nenhum caractere da chave: so se ela existe, e em que cabecalho vai.
  console.log(`token:  ${o.token ? `presente (${o.header})` : "(nenhum)"}`);
  if (o.api && !apiSegura(o.api)) console.log("aviso:  a api nao e https; nenhum script envia a chave para ela.");
}
