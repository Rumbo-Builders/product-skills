/**
 * Teste de fumaca de seguranca: envenena toda folha de texto de um envelope com
 * HTML executavel, e o slug da primeira aba com um fecha-script. A pagina
 * renderizada a partir dele nao pode conter nenhum dos dois cru. As fumacas do
 * one page e da estrategia chamam este arquivo; ele nao e regra de metodo.
 *
 * Uso: node veneno.cjs entrada.json saida.json
 */
const fs = require('fs');
const [, , ent, sai] = process.argv;
const V = '<img src=x onerror=alert(1)>';
const PRESERVA = new Set(['kind', 'slug', 'genero', 'tipo', 'estagio', 'serve', 'objetivo', 'kr', 'sobre', 'leitura', 'faixa', 'coluna', 'periodo', 'status', 'rota', 'direcao', 'estado', 'situacao', 'quadrante', 'categoria', 'horizonte']);
const anda = (v, k) => {
  if (typeof v === 'string') return PRESERVA.has(k) ? v : v + V;
  if (Array.isArray(v)) return v.map((x) => anda(x, k));
  if (v && typeof v === 'object') { const o = {}; for (const [kk, x] of Object.entries(v)) o[kk] = anda(x, kk); return o; }
  return v;
};
const e = anda(JSON.parse(fs.readFileSync(ent, 'utf8')), '');
// datas e prazos invalidos, e a aba com script no slug
for (const i of e.itens || []) { if (i.payload) { if ('prazo' in i.payload) i.payload.prazo = V; if ('horizonte' in i.payload) i.payload.horizonte = V; } }
if (e.meta && e.meta.desenho) e.meta.desenho.abas[0].slug = 'x"</script><script>alert(2)</script>';
fs.writeFileSync(sai, JSON.stringify(e));
