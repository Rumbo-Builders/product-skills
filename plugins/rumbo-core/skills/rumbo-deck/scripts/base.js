/* =====================================================================
   base.js · motor de deck para pptxgenjs
   O motor é cliente-agnóstico. Cor, fonte e logo vêm do tema.

   const { criar } = require('./base.js');
   const D = criar(require('./tema-neutro.js'));
   const { pres, C, chrome, source, lead, exlabel, divider } = D;
   ... monte os slides ...
   await pres.writeFile({ fileName: 'Saida.pptx' });

   Geometria e proporções vêm do padrão de consultoria descrito em
   metodo/deck.md e metodo/deck-infograficos.md. Não mexa nelas sem
   renderizar e inspecionar.
===================================================================== */
const pptxgen = require('pptxgenjs');
const fs = require('fs');

/* ---------- geometria (fixa, não é tema) ---------- */
const W = 13.333, H = 7.5, M = 0.72;
const CW = W - 2 * M;

/* ---------- defaults neutros ---------- */
const NEUTROS = {
  INK: '101828', INK2: '1D2939', TXT: '344054', MUT: '667085', MUT2: '98A2B3',
  PAPER: 'FFFFFF', PAPER2: 'FBFCFD', PAPER3: 'F4F6F9',
  RULE: 'E4E7EC', RULE2: 'D0D5DD', SOBRE_ESCURO: 'CDD3DC'
};
const SEMANTICAS = { ALTA: 'B42318', BAIXA: '067647', ATEN: 'B54708', FRIO: '026AA2' };

/* Clareia um hex em direção ao branco. t entre 0 e 1. */
function clarear(hex, t) {
  const n = parseInt(String(hex).replace('#', ''), 16);
  const mix = c => Math.round(c + (255 - c) * t);
  const r = mix((n >> 16) & 255), g = mix((n >> 8) & 255), b = mix(n & 255);
  return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

function carregarPng(caminho) {
  if (!caminho) return null;
  if (!fs.existsSync(caminho)) return null;
  return 'image/png;base64,' + fs.readFileSync(caminho).toString('base64');
}

/* =====================================================================
   criar(tema) devolve um deck independente. Chame uma vez por deck.

   tema = {
     autor,
     acentos: ['1F4E79', '5B7C99', 'A8763E'],   // 1 a 3
     neutros: {...}, semanticas: {...},          // sobrescrevem os defaults
     fontes: { titulo, corpo },
     logos: { emFundoClaro: '/caminho.png', emFundoEscuro: '/caminho.png' },
     logoAspecto: 1.13                           // largura / altura
   }
   Sem logo, os slides são montados sem logo. Nada quebra.
===================================================================== */
function criar(tema = {}) {
  const acc = (tema.acentos && tema.acentos.length ? tema.acentos : ['1F4E79']).slice(0, 3);
  const C = Object.assign({}, NEUTROS, SEMANTICAS, tema.neutros || {}, tema.semanticas || {}, {
    ACC1: acc[0],
    ACC2: acc[1] || acc[0],
    ACC3: acc[2] || acc[1] || acc[0],
    ACC1_CLARO: tema.acentoClaro || clarear(acc[0], 0.45),
    ACC1_PALIDO: tema.acentoPalido || clarear(acc[0], 0.62)
  });

  const HF = (tema.fontes && tema.fontes.titulo) || 'Arial';   // carrega peso
  const BF = (tema.fontes && tema.fontes.corpo) || 'Calibri';  // se lê
  const ASP = tema.logoAspecto || 1.13;
  const LOGO_C = carregarPng(tema.logos && tema.logos.emFundoClaro);
  const LOGO_E = carregarPng(tema.logos && tema.logos.emFundoEscuro);

  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE';
  if (tema.autor) pres.author = tema.autor;

  let EX = 0;
  function resetQuadros() { EX = 0; }

  /* ---------- primitivas ---------- */
  function slideL() { const s = pres.addSlide(); s.background = { color: C.PAPER }; return s; }
  function slideD() { const s = pres.addSlide(); s.background = { color: C.INK }; return s; }

  /* Barra vertical de acentos na borda esquerda. Divide por quantos acentos houver. */
  function barraAcentos(s) {
    const n = acc.length, h = H / n;
    acc.forEach((cor, i) => s.addShape(pres.ShapeType.rect,
      { x: 0, y: i * h, w: 0.09, h, fill: { color: cor } }));
  }

  function logo(s, x, y, w, escuro) {
    const data = escuro ? LOGO_E : LOGO_C;
    if (!data) return;
    s.addImage({ data, x, y, w, h: w / ASP });
  }

  /* Cabeçalho padrão: logo, kicker, título de ação, régua. */
  function chrome(s, kicker, title, opt = {}) {
    logo(s, W - M - 0.62, 0.34, 0.62, false);
    if (kicker) s.addText(String(kicker).toUpperCase(), {
      x: M, y: 0.36, w: CW - 1.0, h: 0.24, fontFace: BF, fontSize: 10, bold: true,
      color: opt.kc || C.ACC1, charSpacing: 1.5, margin: 0, valign: 'middle'
    });
    s.addText(title, {
      x: M, y: 0.68, w: opt.tw || CW - 0.9, h: opt.th || 0.86,
      fontFace: HF, fontSize: opt.ts || 24, bold: true, color: C.INK,
      margin: 0, valign: 'top', lineSpacing: opt.tls || 29
    });
    s.addShape(pres.ShapeType.line, { x: M, y: opt.ry || 1.62, w: CW, h: 0, line: { color: C.RULE, width: 1 } });
  }

  /* Linha de fonte. Obrigatória em todo slide com número. */
  function source(s, txt) {
    s.addText(txt, {
      x: M, y: H - 0.52, w: CW, h: 0.26, fontFace: BF, fontSize: 8.5,
      color: C.MUT2, margin: 0, italic: true
    });
  }

  /* Parágrafo de abertura sob a régua. */
  function lead(s, txt, y, opt = {}) {
    s.addText(txt, {
      x: opt.x || M, y, w: opt.w || CW, h: opt.h || 0.5, fontFace: BF,
      fontSize: opt.fs || 13.5, color: opt.c || C.TXT, margin: 0,
      lineSpacing: opt.ls || 19, valign: 'top'
    });
  }

  /* Etiqueta numerada. Contador incrementa sozinho: a ordem dos slides muda. */
  function exlabel(s, txt, y) {
    s.addText('QUADRO ' + (++EX) + ' · ' + String(txt).toUpperCase(), {
      x: M, y: y === undefined ? 1.82 : y, w: CW, h: 0.22, fontFace: BF, fontSize: 8.5,
      bold: true, color: C.MUT, charSpacing: 1.1, margin: 0
    });
  }

  /* Conclusão em uma linha, acima da fonte. */
  function fecho(s, txt, y) {
    s.addText(txt, {
      x: M, y: y === undefined ? 6.52 : y, w: CW, h: 0.32, fontFace: HF,
      fontSize: 12.5, bold: true, color: C.INK, margin: 0
    });
  }

  /* Divisor de seção. */
  function divider(n, t, sub) {
    const s = slideD();
    barraAcentos(s);
    s.addText(n, { x: M, y: 2.55, w: 3, h: 0.7, fontFace: HF, fontSize: 15, bold: true, color: C.ACC1_CLARO, charSpacing: 2.2, margin: 0 });
    s.addText(t, { x: M, y: 3.1, w: 10, h: 1.0, fontFace: HF, fontSize: 32, bold: true, color: C.PAPER, margin: 0 });
    s.addShape(pres.ShapeType.line, { x: M, y: 4.22, w: 3.4, h: 0, line: { color: C.TXT, width: 1 } });
    s.addText(sub, { x: M, y: 4.46, w: 8.8, h: 0.8, fontFace: BF, fontSize: 13.5, color: C.SOBRE_ESCURO, margin: 0, lineSpacing: 20 });
    logo(s, W - M - 0.56, H - 1.05, 0.56, true);
    return s;
  }

  /* Capa. */
  function capa(kicker, tese, sub, rodape) {
    const s = slideD();
    barraAcentos(s);
    logo(s, M, 0.85, 1.26, true);
    s.addText(String(kicker).toUpperCase(), { x: M, y: 2.62, w: 9, h: 0.3, fontFace: BF, fontSize: 11.5, bold: true, color: C.ACC1_PALIDO, charSpacing: 2.6, margin: 0 });
    s.addText(tese, { x: M, y: 3.05, w: 10.2, h: 1.9, fontFace: HF, fontSize: 34, bold: true, color: C.PAPER, margin: 0, lineSpacing: 42 });
    s.addShape(pres.ShapeType.line, { x: M, y: 5.18, w: 4.2, h: 0, line: { color: C.TXT, width: 1 } });
    s.addText(sub, { x: M, y: 5.42, w: 8.4, h: 0.8, fontFace: BF, fontSize: 13.5, color: C.SOBRE_ESCURO, margin: 0, lineSpacing: 20 });
    s.addText(rodape, { x: M, y: H - 0.72, w: 8, h: 0.3, fontFace: BF, fontSize: 9.5, color: C.MUT, margin: 0 });
    return s;
  }

  /* Faixa de KPI no rodapé. itens = [[numero, legenda, cor], ...] */
  function kpiStrip(s, itens, y) {
    const yy = y === undefined ? 6.02 : y;
    s.addShape(pres.ShapeType.line, { x: M, y: yy, w: CW, h: 0, line: { color: C.INK, width: 1.25 } });
    const kw = CW / itens.length;
    itens.forEach((k, i) => {
      s.addText(k[0], { x: M + i * kw, y: yy + 0.14, w: kw - 0.2, h: 0.38, fontFace: HF, fontSize: 19, bold: true, color: k[2] || C.ACC1, margin: 0 });
      s.addText(k[1], { x: M + i * kw, y: yy + 0.56, w: kw - 0.3, h: 0.42, fontFace: BF, fontSize: 10.5, color: C.TXT, margin: 0, lineSpacing: 13 });
    });
  }

  /* Caixa de destaque clara. */
  function destaque(s, txt, y, h) {
    const yy = y === undefined ? 5.98 : y, hh = h === undefined ? 0.72 : h;
    s.addShape(pres.ShapeType.rect, { x: M, y: yy, w: CW, h: hh, fill: { color: C.PAPER3 }, line: { color: C.RULE, width: 1 } });
    s.addText(txt, { x: M + 0.3, y: yy + 0.1, w: CW - 0.6, h: hh - 0.2, fontFace: BF, fontSize: 12, color: C.INK, margin: 0, valign: 'middle', lineSpacing: 16 });
  }

  /* Caixa escura. No máximo uma por seção. */
  function destaqueEscuro(s, titulo, corpo, y, h) {
    const yy = y === undefined ? 4.7 : y, hh = h === undefined ? 1.3 : h;
    s.addShape(pres.ShapeType.rect, { x: M, y: yy, w: CW, h: hh, fill: { color: C.INK } });
    s.addText(titulo, { x: M + 0.38, y: yy + 0.18, w: CW - 0.76, h: 0.34, fontFace: HF, fontSize: 15, bold: true, color: C.PAPER, margin: 0 });
    s.addText(corpo, { x: M + 0.38, y: yy + 0.58, w: CW - 0.76, h: hh - 0.72, fontFace: BF, fontSize: 12, color: C.SOBRE_ESCURO, margin: 0, lineSpacing: 17 });
  }

  /* Callout de ressalva. */
  function ressalva(s, txt, y, h) {
    const yy = y === undefined ? 6.2 : y, hh = h === undefined ? 0.66 : h;
    s.addShape(pres.ShapeType.rect, { x: M, y: yy, w: CW, h: hh, fill: { color: C.PAPER2 }, line: { color: C.ATEN, width: 1 } });
    s.addText(txt, { x: M + 0.32, y: yy + 0.06, w: CW - 0.64, h: hh - 0.12, fontFace: HF, fontSize: 12, bold: true, color: C.ATEN, margin: 0, valign: 'middle', lineSpacing: 16 });
  }

  /* Tabela de diagnóstico. linhas = [[c1, c2, c3, corDoC2], ...] */
  function tabela(s, cabecalhos, linhas, opt = {}) {
    const y0 = opt.y0 || 3.80, rh = opt.rh || 0.51;
    const c1 = opt.c1 || 4.6, c2 = opt.c2 || 2.5;
    const xs = [M, M + c1, M + c1 + c2];
    const ws = [c1, c2, CW - c1 - c2];
    cabecalhos.forEach((h, i) => s.addText(String(h).toUpperCase(), {
      x: xs[i], y: y0 - 0.28, w: ws[i], h: 0.22, fontFace: BF, fontSize: 8.5,
      bold: true, color: C.MUT, charSpacing: 1.1, margin: 0
    }));
    s.addShape(pres.ShapeType.line, { x: M, y: y0 - 0.04, w: CW, h: 0, line: { color: C.INK, width: 1.25 } });
    linhas.forEach((r, i) => {
      const y = y0 + i * rh;
      s.addText(r[0], { x: xs[0], y, w: ws[0], h: rh, fontFace: BF, fontSize: 11.5, bold: true, color: C.INK, valign: 'middle', margin: 0 });
      s.addText(r[1], { x: xs[1], y, w: ws[1], h: rh, fontFace: BF, fontSize: 11, bold: true, color: r[3] || C.TXT, valign: 'middle', margin: 0 });
      s.addText(r[2], { x: xs[2], y, w: ws[2], h: rh, fontFace: BF, fontSize: 11, color: C.TXT, valign: 'middle', margin: 0 });
      s.addShape(pres.ShapeType.line, { x: M, y: y + rh, w: CW, h: 0, line: { color: C.RULE, width: 1 } });
    });
  }

  /* Cartões numerados. itens = [[num, titulo, subtitulo, corpo, ehFundacao], ...] */
  function cartoes(s, itens, opt = {}) {
    const y = opt.y || 2.2, h = opt.h || 2.86, gap = opt.gap || 0.26;
    const cw = (CW - (itens.length - 1) * gap) / itens.length;
    itens.forEach((d, i) => {
      const x = M + i * (cw + gap);
      const dark = !!d[4];
      s.addShape(pres.ShapeType.rect, { x, y, w: cw, h, fill: { color: dark ? C.INK : C.PAPER3 }, line: { color: dark ? C.INK : C.RULE, width: 1 } });
      s.addText(d[0], { x: x + 0.26, y: y + 0.2, w: cw - 0.52, h: 0.28, fontFace: HF, fontSize: 12, bold: true, color: dark ? C.ACC1_CLARO : C.ACC1, margin: 0 });
      s.addText(d[1], { x: x + 0.26, y: y + 0.5, w: cw - 0.52, h: 0.42, fontFace: HF, fontSize: 19, bold: true, color: dark ? C.PAPER : C.INK, margin: 0 });
      s.addText(d[2], { x: x + 0.26, y: y + 0.98, w: cw - 0.52, h: 0.3, fontFace: BF, fontSize: 11, bold: true, color: dark ? C.ACC1_CLARO : C.ACC1, margin: 0 });
      s.addText(d[3], { x: x + 0.26, y: y + 1.38, w: cw - 0.52, h: h - 1.6, fontFace: BF, fontSize: 11.5, color: dark ? C.SOBRE_ESCURO : C.TXT, margin: 0, lineSpacing: 16 });
    });
  }

  /* Dumbbell de gap. */
  function dumbbell(s, a, b, opt = {}) {
    const ax = M + (opt.padX || 1.9), aw = CW - 2 * (opt.padX || 1.9) + 0.4;
    const ay = opt.y || 2.72, lo = opt.lo || 0, hi = opt.hi;
    const xv = v => ax + aw * (v - lo) / (hi - lo);
    (opt.ticks || []).forEach(t => {
      s.addShape(pres.ShapeType.line, { x: xv(t), y: ay - 0.18, w: 0, h: 1.5, line: { color: C.RULE, width: 1 } });
      s.addText(t.toLocaleString('pt-BR'), { x: xv(t) - 0.5, y: ay + 1.38, w: 1.0, h: 0.24, fontFace: BF, fontSize: 9, color: C.MUT, align: 'center', margin: 0 });
    });
    const by = ay + 0.5;
    s.addShape(pres.ShapeType.line, { x: xv(a.v), y: by, w: xv(b.v) - xv(a.v), h: 0, line: { color: C.RULE2, width: 6 } });
    [[a, C.ACC1], [b, C.ACC3]].forEach(([p, cor]) => {
      s.addShape(pres.ShapeType.ellipse, { x: xv(p.v) - 0.145, y: by - 0.145, w: 0.29, h: 0.29, fill: { color: cor } });
      s.addText(p.nome, { x: xv(p.v) - 1.15, y: by - 0.62, w: 2.3, h: 0.28, fontFace: HF, fontSize: 12.5, bold: true, color: C.INK, align: 'center', margin: 0 });
      s.addText(p.rot, { x: xv(p.v) - 1.15, y: by - 0.34, w: 2.3, h: 0.26, fontFace: BF, fontSize: 11, color: cor, align: 'center', margin: 0 });
    });
    if (opt.gapLabel) s.addText(opt.gapLabel, { x: xv(a.v), y: by + 0.26, w: xv(b.v) - xv(a.v), h: 0.3, fontFace: BF, fontSize: 11, bold: true, color: C.TXT, align: 'center', margin: 0 });
  }

  /* Ponte / waterfall. passos = [{l, v, t}] com t em 'tot' | 'up' | 'dn' */
  function ponte(s, passos, opt = {}) {
    const gx = M + 0.55, gy = opt.y || 2.28, gw = CW - 1.1, gh = opt.h || 2.92;
    const lo = opt.lo, hi = opt.hi;
    const yv = v => gy + gh * (hi - v) / (hi - lo);
    (opt.ticks || []).forEach(v => {
      s.addShape(pres.ShapeType.line, { x: gx, y: yv(v), w: gw, h: 0, line: { color: v === 0 ? C.RULE2 : C.RULE, width: 1 } });
      s.addText(String(v), { x: gx - 0.62, y: yv(v) - 0.12, w: 0.52, h: 0.24, fontFace: BF, fontSize: 9, color: C.MUT, align: 'right', margin: 0, valign: 'middle' });
    });
    const n = passos.length, bw = gw / n * 0.60, gap = gw / n;
    let run = 0;
    passos.forEach((st, i) => {
      const cx = gx + gap * i + (gap - bw) / 2;
      let top, bot, col;
      if (st.t === 'tot') { top = yv(Math.max(st.v, 0)); bot = yv(0); col = C.ACC1; run = st.v; }
      else if (st.t === 'up') { top = yv(run + st.v); bot = yv(run); col = C.BAIXA; run += st.v; }
      else { top = yv(run); bot = yv(run + st.v); col = C.ATEN; run += st.v; }
      const hgt = Math.max(Math.abs(bot - top), 0.035);
      s.addShape(pres.ShapeType.rect, { x: cx, y: Math.min(top, bot), w: bw, h: hgt, fill: { color: col } });
      const tot = st.t === 'tot';
      const num = Math.abs(st.v).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
      s.addText(tot ? st.v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : (st.v > 0 ? '+' : '−') + num, {
        x: cx - 0.22, y: Math.min(top, bot) - 0.31, w: bw + 0.44, h: 0.28,
        fontFace: HF, fontSize: 10.5, bold: true, color: tot ? C.INK : col, align: 'center', margin: 0, valign: 'middle'
      });
      if (i < n - 1 && passos[i + 1].t !== 'tot') {
        s.addShape(pres.ShapeType.line, { x: cx + bw, y: yv(run), w: gap - bw, h: 0, line: { color: C.RULE2, width: 1, dashType: 'dash' } });
      }
      s.addText(st.l, { x: cx - 0.24, y: gy + gh + 0.10, w: bw + 0.48, h: 0.5, fontFace: BF, fontSize: 9.5, color: tot ? C.INK : C.TXT, bold: tot, align: 'center', margin: 0, lineSpacing: 12 });
    });
  }

  /* Escada de prioridades. itens = [[titulo, descricao, cor], ...] */
  function escada(s, itens, opt = {}) {
    const base = opt.base || 5.22, step = opt.step || 0.26, gap = opt.gap || 0.24;
    const sw = (CW - (itens.length - 1) * gap) / itens.length;
    itens.forEach((p, i) => {
      const x = M + i * (sw + gap), h = (opt.h0 || 1.44) + i * step, y = base - h;
      const cor = p[2] || C.ACC1;
      s.addShape(pres.ShapeType.rect, { x, y, w: sw, h, fill: { color: C.PAPER3 }, line: { color: C.RULE, width: 1 } });
      s.addShape(pres.ShapeType.rect, { x, y, w: sw, h: 0.06, fill: { color: cor } });
      s.addText('0' + (i + 1), { x: x + 0.22, y: y + 0.18, w: 0.6, h: 0.28, fontFace: HF, fontSize: 13, bold: true, color: cor, margin: 0 });
      s.addText(p[0], { x: x + 0.22, y: y + 0.54, w: sw - 0.44, h: 0.78, fontFace: HF, fontSize: 12.5, bold: true, color: C.INK, margin: 0, lineSpacing: 16 });
      s.addText(p[1], { x, y: base + 0.2, w: sw, h: 1.1, fontFace: BF, fontSize: 10.5, color: C.TXT, margin: 0, lineSpacing: 14.5 });
    });
    s.addShape(pres.ShapeType.line, { x: M, y: base + 0.06, w: CW, h: 0, line: { color: C.INK, width: 1.25 } });
  }

  return {
    pptxgen, pres, W, H, M, CW, C, HF, BF, acentos: acc,
    resetQuadros, slideL, slideD, barraAcentos, logo,
    chrome, source, lead, exlabel, fecho, divider, capa,
    kpiStrip, destaque, destaqueEscuro, ressalva, tabela, cartoes,
    dumbbell, ponte, escada
  };
}

const fmtBRL = n => 'R$ ' + Math.round(n).toLocaleString('pt-BR');
const fmtPct = (n, d = 1) => n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }) + '%';

module.exports = { criar, clarear, fmtBRL, fmtPct, W, H, M, CW, NEUTROS, SEMANTICAS };
