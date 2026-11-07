/* =====================================================================
   CENA — desenhador de cenas de moléculas para a "Aula em trilha"
   Formato: bloco.cena = { elementos:[...] } ; passo.cena_acoes = [...]
   Coordenadas da cena: x de 0 a 100 (esquerda → direita),
                        y de 0 a 60  (topo → base).
   Uso:
     const cena = Cena.criar(gSvg, bloco.cena, {x:10, y:320, largura:340});
     cena.executar(acao, animar)   // animar=false aplica o estado final já pronto
     cena.limpar();  cena.parar();
   ===================================================================== */
(function (global) {
  const NS = "http://www.w3.org/2000/svg";
  const PAL_ESCURO = {
    fundo: "#262626", agua: "#7cc4ff", gelo: "#dff4ff", geloBorda: "#dff4ff", H: "#ffffff", Hb: "none", ligacao: "#dff4ff",
    ion: "#f2b84b", ionMenos: "#b9a5ff", acucar: "#ff9fc7", particula: "#e9826f",
    gordura: "#f5d76e", bacteria: "#7ddc9a", bactBorda: "#3f8f5c", bactSeca: "#5fae7a", bactDano: "#6a3b3b",
    caixa: "#e8e2d0", caixaFundo: "#ffffff12", estrutura: "#f2c79b", cadeia: "#e6c27a", o2: "#ff8a8a", fungo: "#b9d36b", levedura: "#e8c98a",
    giz: "#f4f1e8", dano: "#ff6b6b",
    azul: "#7cc4ff", laranja: "#ffb070", verde: "#8fe3b0", vermelho: "#ff8a8a",
    roxo: "#c7a6ff", cinza: "#bdbdbd", ambar: "#ffd479", rosa: "#ff9fc7", hmais: "#ff6b6b", acido: "#c7a6ff", anion: "#9fd0ff"
  };
  const PAL_CLARO = {
    fundo: "#ffffff", agua: "#2b7fd4", gelo: "#cfe8fa", geloBorda: "#2b7fd4", H: "#ffffff", Hb: "#5d6b78", ligacao: "#2b7fd4",
    ion: "#f0a91e", ionMenos: "#8b6be0", acucar: "#d6337a", particula: "#c9472f",
    gordura: "#d9a90f", bacteria: "#3fb46a", bactBorda: "#1f7a42", bactSeca: "#2d8a50", bactDano: "#8a3a3a",
    caixa: "#6b6a64", caixaFundo: "#0000000a", estrutura: "#b8742d", cadeia: "#a8741a", o2: "#d62828", fungo: "#5f7d1e", levedura: "#b07a1e",
    giz: "#1d1d1b", dano: "#d62828",
    azul: "#1f6fd1", laranja: "#d9650b", verde: "#1a8a47", vermelho: "#d62828",
    roxo: "#6b3fd1", cinza: "#6b6a64", ambar: "#a86f00", rosa: "#d6337a", hmais: "#e03131", acido: "#7a52d6", anion: "#7a52d6"
  };
  const RAIO = { fungo: 4.5, levedura: 2.8, agua: 1.35, ion: 2.6, acucar: 2.9, particula: 1.7, gordura: 3.0, bacteria: 4.8, cadeia: 5.2, o2: 1.6, h: 1.3, ha: 2.0, a: 1.9 };
  const SOLUTO = { ion: 1, acucar: 1, particula: 1, gordura: 1, bacteria: 1, cadeia: 1 };
  const S = 4.4; // espaçamento da rede de gelo

  function mk(tag, at, par) { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); if (par) par.appendChild(e); return e; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function dist(a, b, c, d) { return Math.hypot(a - c, b - d); }

  function criar(raiz, def, opt) {
    const PAL = opt.tema === "claro" ? PAL_CLARO : PAL_ESCURO;
    def = def || { elementos: [] };
    const K = opt.largura / 100, X0 = opt.x, Y0 = opt.y;
    const root = mk("g", { transform: `translate(${X0},${Y0}) scale(${K})` }, raiz);
    const L = {
      halo: mk("g", {}, root), pontes: mk("g", {}, root), bonds: mk("g", {}, root),
      parts: mk("g", {}, root), els: mk("g", {}, root), ann: mk("g", {}, root)
    };
    let parts = [], els = {}, timers = [], procs = [], sites = new Set(), discos = [], pontes = [], raf = 0, last = 0, frame = 0;

    /* ---------- elementos declarados ---------- */
    function construirEl(d) {
      const g = mk("g", { opacity: 0 }, L.els);
      const e = { def: d, g, x: d.x, y: d.y, esc: 1, vis: false, dano: false, tipo: d.tipo };
      desenharEl(e);
      els[d.id] = e; posEl(e);
      return e;
    }
    function desenharEl(e) {
      const d = e.def, g = e.g; g.innerHTML = "";
      const t = d.tipo, tam = d.tamanho || 1;
      if (t === "agua") { desenharAgua(g, -90, false, tam); }
      else if (t === "ion") {
        const neg = /−|-/.test(d.rotulo || "");
        mk("circle", { r: RAIO.ion * tam, fill: neg ? PAL.ionMenos : PAL.ion, stroke: "#00000040", "stroke-width": .3 }, g);
        const tx = mk("text", { "text-anchor": "middle", y: 1.1 * tam, "font-size": 2.8 * tam, "font-weight": 700, fill: "#2b2b2b", "font-family": "system-ui,sans-serif" }, g);
        tx.textContent = d.rotulo || "+";
      }
      else if (t === "acucar") { hexagono(g, RAIO.acucar * tam, PAL.acucar); if (d.rotulo) rot(g, 0, RAIO.acucar * tam + 4, d.rotulo, 3.4); }
      else if (t === "particula") { mk("circle", { r: RAIO.particula * tam, fill: PAL.particula }, g); }
      else if (t === "fungo") {
        const cor = PAL.fungo, s = tam;
        mk("path", { d: `M0,${4*s} L0,${-1*s} L${-2.6*s},${-3.6*s} M0,${-1*s} L${2.4*s},${-3.2*s} L${3.4*s},${-5*s} M${2.4*s},${-3.2*s} L${4.4*s},${-2.4*s} M0,${1.5*s} L${-3*s},${0.5*s}`, stroke: cor, "stroke-width": .55 * s, fill: "none", "stroke-linecap": "round" }, g);
        [[-2.6, -3.6], [3.4, -5], [4.4, -2.4], [-3, .5]].forEach(([x, y]) => mk("circle", { cx: x * s, cy: y * s, r: .75 * s, fill: cor }, g));
        if (d.rotulo) rot(g, 0, 7.6 * s, d.rotulo, 3.2);
      }
      else if (t === "levedura") {
        mk("ellipse", { rx: 2.6 * tam, ry: 2 * tam, fill: PAL.levedura, stroke: PAL.cadeia, "stroke-width": .35 }, g);
        mk("ellipse", { cx: 2.7 * tam, cy: -1.3 * tam, rx: 1.2 * tam, ry: 1 * tam, fill: PAL.levedura, stroke: PAL.cadeia, "stroke-width": .35 }, g);
        if (d.rotulo) rot(g, 0, 5.4 * tam, d.rotulo, 3.2);
      }
      else if (t === "cadeia") {
        const n = d.unidades || 4, cor = PAL[d.cor] || PAL.cadeia, r = 1.25 * tam, dx = 2.3 * tam;
        let pth = ""; for (let i = 0; i < n; i++) { const x = (i - (n - 1) / 2) * dx, y = (i % 2 ? .9 : -.9) * tam; pth += (i ? "L" : "M") + x.toFixed(2) + "," + y.toFixed(2); }
        mk("path", { d: pth, stroke: cor, "stroke-width": .5, fill: "none" }, g);
        for (let i = 0; i < n; i++) { const gg = mk("g", { transform: `translate(${((i - (n - 1) / 2) * dx).toFixed(2)},${((i % 2 ? .9 : -.9) * tam).toFixed(2)})` }, g); hexagono(gg, r, cor); }
        if (d.rotulo) rot(g, 0, 4.6 * tam, d.rotulo, 3.3);
      }
      else if (t === "rede") {
        const w = d.w || 30, h = d.h || 24, cor = PAL[d.cor] || PAL.cadeia;
        mk("rect", { x: -w / 2, y: -h / 2, width: w, height: h, rx: 2, fill: cor + "10", stroke: "none" }, g);
        let pth = "";
        for (let k = 0; k < 5; k++) { const y = -h / 2 + h * (k + .5) / 5; pth += `M${-w / 2},${y.toFixed(1)}`; for (let x = -w / 2; x <= w / 2; x += 3) pth += `L${x.toFixed(1)},${(y + Math.sin(x * .6 + k) * 1.4).toFixed(1)}`; }
        for (let k = 0; k < 6; k++) { const x = -w / 2 + w * (k + .5) / 6; pth += `M${x.toFixed(1)},${-h / 2}`; for (let y = -h / 2; y <= h / 2; y += 3) pth += `L${(x + Math.sin(y * .7 + k) * 1.3).toFixed(1)},${y.toFixed(1)}`; }
        mk("path", { d: pth, stroke: cor, "stroke-width": .45, fill: "none", "stroke-opacity": .8 }, g);
        if (d.rotulo) rot(g, 0, -h / 2 - 1.8, d.rotulo, 3.4);
      }
      else if (t === "gordura") { mk("circle", { r: RAIO.gordura * tam, fill: PAL.gordura, opacity: .9 }, g); }
      else if (t === "bacteria") {
        const w = 10 * tam, h = 5.4 * tam;
        e.corpo = mk("rect", { x: -w / 2, y: -h / 2, width: w, height: h, rx: h / 2, fill: e.dano ? PAL.bactDano : PAL.bacteria, stroke: e.dano ? PAL.dano : PAL.bactBorda, "stroke-width": .5 }, g);
        if (e.dano) mk("path", { d: `M${-w / 4},${-h / 2} l1.4,2 l-1.6,1.4 l1.8,2`, stroke: PAL.dano, "stroke-width": .6, fill: "none" }, g);
        if (d.rotulo) rot(g, 0, h / 2 + 3.6, d.rotulo, 3.2);
      }
      else if (t === "caixa" || t === "estrutura") {
        const w = d.w || 20, h = d.h || 14;
        const est = t === "estrutura";
        mk("rect", { x: -w / 2, y: -h / 2, width: w, height: h, rx: est ? 3 : 1.2, fill: est ? PAL.estrutura + "14" : PAL.caixaFundo, stroke: e.dano ? PAL.dano : (est ? PAL.estrutura : PAL.caixa), "stroke-width": .55, "stroke-dasharray": e.dano ? "2.2 1.6" : "none" }, g);
        if (e.dano) for (let i = 0; i < 4; i++) { const px = rnd(-w / 2.4, w / 2.4), py = (i % 2 ? -1 : 1) * h / 2; mk("path", { d: `M${px},${py} l${rnd(-1.5, 1.5)},${-Math.sign(py) * 2} l${rnd(-1.5, 1.5)},${-Math.sign(py) * 1.8}`, stroke: PAL.dano, "stroke-width": .5, fill: "none" }, g); }
        if (d.rotulo) rot(g, 0, est ? -h / 2 - 1.8 : h / 2 - 1.8, d.rotulo, 3.3);
      }
    }
    function hexagono(g, r, cor) {
      let p = ""; for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i + Math.PI / 6; p += (i ? "L" : "M") + (r * Math.cos(a)).toFixed(2) + "," + (r * Math.sin(a)).toFixed(2); }
      mk("path", { d: p + "Z", fill: cor + "33", stroke: cor, "stroke-width": .55 }, g);
    }
    function rot(g, x, y, txt, fs, cor) {
      const t = mk("text", { x, y, "text-anchor": "middle", "font-size": fs || 3.6, fill: cor || PAL.giz, "font-family": "Caveat, 'Patrick Hand', cursive", stroke: PAL.fundo, "stroke-width": .9, "paint-order": "stroke", "stroke-linejoin": "round" }, g);
      t.textContent = txt; return t;
    }
    function posEl(e) { e.g.setAttribute("transform", `translate(${e.x.toFixed(2)},${e.y.toFixed(2)}) scale(${e.esc})`); }
    function raioEl(e) { const t = e.tipo, tam = e.def.tamanho || 1; if (t === "cadeia") return ((e.def.unidades || 4) * 2.3 * tam) / 2 + .6; return (RAIO[t] || 3) * tam * e.esc; }

    /* ---------- moléculas (partículas) ---------- */
    function desenharAgua(g, ang, gelo, tam) {
      tam = tam || 1;
      const o = mk("circle", { r: RAIO.agua * tam, fill: gelo ? PAL.gelo : PAL.agua }, g);
      const hs = [];
      [-52, 52].forEach(da => { const a = (ang + da) * Math.PI / 180; hs.push(mk("circle", { cx: Math.cos(a) * 1.55 * tam, cy: Math.sin(a) * 1.55 * tam, r: .62 * tam, fill: PAL.H, stroke: PAL.Hb, "stroke-width": .22 }, g)); });
      return { o, hs };
    }
    function novaParte(tipo, x, y, op) {
      op = op || {};
      const g = mk("g", { opacity: 0 }, L.parts);
      const p = { tipo, x, y, vx: 0, vy: 0, modo: "livre", casa: null, lim: op.lim || { t: "r", x1: 1, y1: 1, x2: 99, y2: 59 }, agit: op.agit == null ? .6 : op.agit, g, alfa: 0, alvoAlfa: 1, ang: op.ang == null ? rnd(0, 360) : op.ang, grupo: op.grupo || "w", gelo: false, id: Math.random() };
      if (tipo === "agua") p.vis = desenharAgua(g, p.ang, false);
      else if (tipo === "ion") mk("circle", { r: 1.9, fill: PAL.ion }, g);
      else if (tipo === "acucar") hexagono(g, 2.2, PAL.acucar);
      else if (tipo === "gordura") mk("circle", { r: 2.4, fill: PAL.gordura }, g);
      else if (tipo === "o2") { mk("circle", { cx: -.8, r: 1, fill: PAL.o2 }, g); mk("circle", { cx: .8, r: 1, fill: PAL.o2 }, g); }
      else if (tipo === "h") { mk("circle", { r: 1.35, fill: PAL.hmais }, g); const t = mk("text", { "text-anchor": "middle", y: .75, "font-size": 2, "font-weight": 700, fill: "#fff", "font-family": "system-ui,sans-serif" }, g); t.textContent = "+"; }
      else if (tipo === "ha") { mk("circle", { r: 1.9, fill: PAL.acido + "33", stroke: PAL.acido, "stroke-width": .5 }, g); mk("circle", { cx: 1.75, cy: -1.2, r: .95, fill: PAL.hmais }, g); }
      else if (tipo === "a") { mk("circle", { r: 1.9, fill: PAL.anion + "26", stroke: PAL.anion, "stroke-width": .5, "stroke-dasharray": ".9 .6" }, g); const t = mk("text", { "text-anchor": "middle", y: .9, "font-size": 2.8, "font-weight": 700, fill: PAL.anion, "font-family": "system-ui,sans-serif" }, g); t.textContent = "−"; }
      else mk("circle", { r: RAIO.particula, fill: PAL.particula }, g);
      parts.push(p); return p;
    }
    function setGelo(p, v) {
      if (p.tipo !== "agua" || p.gelo === v) return; p.gelo = v;
      p.vis.o.setAttribute("fill", v ? PAL.gelo : PAL.agua); p.vis.o.setAttribute("stroke", v ? PAL.geloBorda : "none"); p.vis.o.setAttribute("stroke-width", v ? .3 : 0);
    }
    function orient(p, ang) {
      if (p.tipo !== "agua") return; p.ang = ang;
      const a1 = (ang - 52) * Math.PI / 180, a2 = (ang + 52) * Math.PI / 180;
      p.vis.hs[0].setAttribute("cx", Math.cos(a1) * 1.55); p.vis.hs[0].setAttribute("cy", Math.sin(a1) * 1.55);
      p.vis.hs[1].setAttribute("cx", Math.cos(a2) * 1.55); p.vis.hs[1].setAttribute("cy", Math.sin(a2) * 1.55);
    }
    function remover(p) { p.alvoAlfa = 0; p.morrer = true; }
    function livres(grupo, cond) { return parts.filter(p => p.tipo === "agua" && p.modo === "livre" && !p.morrer && !p.reserva && (!grupo || p.grupo === grupo || grupo === "*") && (!cond || cond(p))); }
    function maisProxima(lista, x, y) { let b = null, bd = 1e9; for (const p of lista) { const d = dist(p.x, p.y, x, y); if (d < bd) { bd = d; b = p; } } return b; }
    function solutos(area) {
      const out = [];
      for (const id in els) { const e = els[id]; if (e.vis && SOLUTO[e.tipo] && (!area || dentro(area, e.x, e.y))) out.push({ x: e.x, y: e.y, r: raioEl(e), el: e }); }
      for (const p of parts) if (p.tipo !== "agua" && !p.morrer && (!area || dentro(area, p.x, p.y))) out.push({ x: p.x, y: p.y, r: RAIO[p.tipo] || 1.8, p });
      return out;
    }
    function dentro(a, x, y) { return x >= a[0] && x <= a[2] && y >= a[1] && y <= a[3]; }
    function areaDe(a) {
      if (a.dentro && els[a.dentro]) { const e = els[a.dentro], w = (e.def.w || 20) / 2 - 1.8, h = (e.def.h || 14) / 2 - 1.8; return [e.x - w, e.y - h, e.x + w, e.y + h]; }
      return a.area || [2, 2, 98, 58];
    }

    /* ---------- laço de animação ---------- */
    function tick(t) {
      const dt = Math.min(.05, (t - (last || t)) / 1000); last = t; frame++;
      procs = procs.filter(fn => fn(t) !== false);
      const obst = Object.values(els).filter(e => e.vis && e.tipo === "caixa");
      for (const p of parts) {
        if (p.modo === "livre") {
          const a = p.agit * 38;
          p.vx += (Math.random() - .5) * a * dt * 6; p.vy += (Math.random() - .5) * a * dt * 6;
          const damp = Math.pow(.18, dt); p.vx *= damp; p.vy *= damp;
          const vmax = 3 + p.agit * 9; const v = Math.hypot(p.vx, p.vy); if (v > vmax) { p.vx *= vmax / v; p.vy *= vmax / v; }
          p.x += p.vx * dt; p.y += p.vy * dt;
          const l = p.lim;
          if (l.t === "r") { if (p.x < l.x1) { p.x = l.x1; p.vx = Math.abs(p.vx); } if (p.x > l.x2) { p.x = l.x2; p.vx = -Math.abs(p.vx); } if (p.y < l.y1) { p.y = l.y1; p.vy = Math.abs(p.vy); } if (p.y > l.y2) { p.y = l.y2; p.vy = -Math.abs(p.vy); } }
          else { const d = dist(p.x, p.y, l.cx, l.cy); if (d > l.r) { p.x = l.cx + (p.x - l.cx) * l.r / d; p.y = l.cy + (p.y - l.cy) * l.r / d; p.vx *= -.5; p.vy *= -.5; } }
          if (l.t === "r") {
            for (const dk of discos) { const d = dist(p.x, p.y, dk.cx, dk.cy); if (d < dk.r && d > .01) { p.x = dk.cx + (p.x - dk.cx) * dk.r / d; p.y = dk.cy + (p.y - dk.cy) * dk.r / d; } }
            for (const e of obst) { const w = (e.def.w || 20) / 2 + 1.4, h = (e.def.h || 14) / 2 + 1.4; if (l.x1 >= e.x - w && l.x2 <= e.x + w && l.y1 >= e.y - h && l.y2 <= e.y + h) continue; if (Math.abs(p.x - e.x) < w && Math.abs(p.y - e.y) < h) { const dx = w - Math.abs(p.x - e.x), dy = h - Math.abs(p.y - e.y); if (dx < dy) p.x = e.x + Math.sign(p.x - e.x || 1) * w; else p.y = e.y + Math.sign(p.y - e.y || 1) * h; } }
          }
          if (p.tipo === "agua" && frame % 3 === 0) orient(p, p.ang + (Math.random() - .5) * 30 * p.agit);
        } else if (p.casa) {
          const vel = p.modo === "indo" ? 2.2 : 7;
          const k = 1 - Math.exp(-vel * dt);
          p.x += (p.casa.x - p.x) * k; p.y += (p.casa.y - p.y) * k;
          if (p.modo === "indo" && dist(p.x, p.y, p.casa.x, p.casa.y) < .35) { p.modo = p.modoFinal || "preso"; if (p.modo === "gelo") { setGelo(p, true); orient(p, -90); } if (p.modo === "livre") { p.casa = null; continue; } }
          const j = p.modo === "gelo" ? .05 : .22;
          p.jx = (Math.random() - .5) * j; p.jy = (Math.random() - .5) * j;
        }
        if (p.alfa !== p.alvoAlfa) { p.alfa += Math.sign(p.alvoAlfa - p.alfa) * Math.min(Math.abs(p.alvoAlfa - p.alfa), dt * 2.2); p.g.setAttribute("opacity", p.alfa.toFixed(2)); }
        p.g.setAttribute("transform", `translate(${(p.x + (p.jx || 0)).toFixed(2)},${(p.y + (p.jy || 0)).toFixed(2)})`);
      }
      const mortos = parts.filter(p => p.morrer && p.alfa <= 0); if (mortos.length) { mortos.forEach(p => p.g.remove()); parts = parts.filter(p => !(p.morrer && p.alfa <= 0)); }
      if (frame % 6 === 0) ligacoesGelo();
      desenharPontes();
      raf = requestAnimationFrame(tick);
    }
    function ligacoesGelo() {
      const gs = parts.filter(p => p.modo === "gelo" && !p.morrer);
      let d = "";
      for (let i = 0; i < gs.length; i++) for (let j = i + 1; j < gs.length; j++) {
        const a = gs[i], b = gs[j]; if (Math.abs(a.x - b.x) > S * 1.2 || Math.abs(a.y - b.y) > S * 1.2) continue;
        if (dist(a.x, a.y, b.x, b.y) < S * 1.12) d += `M${a.x.toFixed(1)},${a.y.toFixed(1)}L${b.x.toFixed(1)},${b.y.toFixed(1)}`;
      }
      L.bonds.innerHTML = d ? `<path d="${d}" stroke="${PAL.ligacao}" stroke-opacity=".35" stroke-width=".35" fill="none" stroke-dasharray=".8 .6"/>` : "";
    }
    function desenharPontes() {
      if (!pontes.length) { if (L.pontes.childNodes.length) L.pontes.innerHTML = ""; return; }
      let d = ""; for (const pr of pontes) { const a = pr.a, b = pr.b; if (b.alfa < .3) continue; d += `M${a.x.toFixed(2)},${a.y.toFixed(2)}L${b.x.toFixed(2)},${b.y.toFixed(2)}`; }
      L.pontes.innerHTML = `<path d="${d}" stroke="${PAL.ambar}" stroke-width=".45" stroke-dasharray="1 .8" fill="none"/>`;
    }
    function iniciar() { if (!raf) { last = 0; raf = requestAnimationFrame(tick); } }

    /* ---------- tween genérico ---------- */
    function tween(dur, fn, anim) {
      if (!anim || !dur) { fn(1); return; }
      const t0 = performance.now();
      procs.push(t => { const k = Math.min(1, (t - t0) / dur); fn(k < 1 ? (1 - Math.cos(k * Math.PI)) / 2 : 1); return k < 1; });
    }
    function fade(node, anim) { if (!anim) { node.setAttribute("opacity", 1); return; } node.setAttribute("opacity", 0); tween(700, k => node.setAttribute("opacity", k), true); }

    /* ---------- AÇÕES ---------- */
    const A = {};
    A.aparecer = (a, an) => { const e = els[a.elemento]; if (!e) return; e.vis = true; fade(e.g, an); };
    A.sumir = (a, an) => { const e = els[a.elemento]; if (!e) return; e.vis = false; tween(an ? 600 : 0, k => e.g.setAttribute("opacity", 1 - k), an); };
    A.mover = (a, an) => { const e = els[a.elemento]; if (!e) return; const x0 = e.x, y0 = e.y; if (!e.vis) { e.vis = true; e.g.setAttribute("opacity", 1); } tween(an ? (a.duracao || 1500) : 0, k => { e.x = x0 + (a.para[0] - x0) * k; e.y = y0 + (a.para[1] - y0) * k; posEl(e); }, an); };
    A.destacar = (a, an) => { const e = els[a.elemento]; if (!e || !an) return; tween(1600, k => { e.esc = 1 + .35 * Math.sin(k * Math.PI * 2) * (1 - k); posEl(e); }, true); };
    A.danificar = (a, an) => { const e = els[a.alvo || a.elemento]; if (!e) return; e.dano = true; const op = e.g.getAttribute("opacity"); desenharEl(e); e.g.setAttribute("opacity", op); if (an) A.destacar({ elemento: e.def.id }, true); if (a.rotulo) A.rotulo({ x: e.x, y: e.y - raioEl(e) - 4, texto: a.rotulo, cor: "vermelho" }, an); };

    A.aguas = (a, an) => {
      const ar = areaDe(a);
      for (let i = 0; i < (a.n || 20); i++) {
        const p = novaParte("agua", rnd(ar[0], ar[2]), rnd(ar[1], ar[3]), { grupo: a.grupo || "w", agit: a.agitacao, lim: { t: "r", x1: ar[0], y1: ar[1], x2: ar[2], y2: ar[3] } });
        if (!an) { p.alfa = 1; p.g.setAttribute("opacity", 1); }
      }
    };
    A.solutos = (a, an) => {
      const ar = areaDe(a);
      for (let i = 0; i < (a.n || 6); i++) {
        const p = novaParte(a.especie || "particula", rnd(ar[0], ar[2]), rnd(ar[1], ar[3]), { grupo: "sol", agit: a.agitacao == null ? .35 : a.agitacao, lim: { t: "r", x1: ar[0], y1: ar[1], x2: ar[2], y2: ar[3] } });
        if (!an) { p.alfa = 1; p.g.setAttribute("opacity", 1); }
      }
    };
    A.agitar = (a) => { parts.forEach(p => { if (!a.grupo || p.grupo === a.grupo) p.agit = a.agitacao; }); };

    A.pontes = (a, an) => {
      const e = els[a.alvo]; if (!e) return;
      const n = a.n || 4, R = a.distancia || 6.5;
      for (let i = 0; i < n; i++) {
        const ang = (45 + 90 * i) * Math.PI / 180, x = e.x + Math.cos(ang) * R, y = e.y + Math.sin(ang) * R;
        const p = novaParte("agua", x, y, { ang: (ang * 180 / Math.PI) + 180 });
        p.modo = "preso"; p.casa = { x, y };
        if (!an) { p.alfa = 1; p.g.setAttribute("opacity", 1); }
        else { p.alfa = 0; p.alvoAlfa = 0; timers.push(setTimeout(() => p.alvoAlfa = 1, i * 450)); }
        pontes.push({ a: e, b: p });
      }
    };

    A.hidratar = (a, an) => {
      const e = els[a.alvo]; if (!e) return;
      const re = raioEl(e), cam = a.camadas || 1, n = a.n || 8;
      const r1 = a.raio || re + 2.3, r2 = r1 + 2.9;
      const n1 = cam === 2 ? Math.max(4, Math.round(n * .42)) : n, n2 = n - n1;
      const pos = [];
      for (let i = 0; i < n1; i++) { const t = 2 * Math.PI * i / n1; pos.push([r1, t]); }
      for (let i = 0; i < n2; i++) { const t = 2 * Math.PI * (i + .5) / n2; pos.push([r2, t]); }
      const ion = e.tipo === "ion";
      e.hid = (e.hid || []).filter(q => !q.morrer);
      const antigos = e.hid.slice(); e.hid = [];
      pos.forEach(([r, t], i) => {
        const x = e.x + Math.cos(t) * r, y = e.y + Math.sin(t) * r;
        let p = antigos.length ? antigos.shift() : maisProxima(livres(a.grupo || "*"), x, y);
        if (!p) p = novaParte("agua", rnd(2, 98), rnd(2, 58));
        e.hid.push(p);
        p.ligada = cam === 2 && i < n1;
        p.reserva = false; p.modo = an ? "indo" : "preso"; p.modoFinal = "preso"; p.casa = { x, y };
        if (ion) orient(p, t * 180 / Math.PI); // oxigênio voltado ao cátion
        if (!an) { p.x = x; p.y = y; p.alfa = 1; p.g.setAttribute("opacity", 1); }
      });
      antigos.forEach(q => { q.modo = "livre"; q.casa = null; });
      const rh = (cam === 2 ? r2 : r1) + 1.9;
      if (e.halo) e.halo.remove();
      const halo = mk("g", {}, L.halo); e.halo = halo;
      if (a.halo !== false) mk("circle", { cx: e.x, cy: e.y, r: rh, fill: PAL.azul + "14", stroke: PAL.azul, "stroke-width": .35, "stroke-dasharray": "1.2 1" }, halo);
      if (a.rotulo) rot(halo, e.x, e.y + rh + 3.8, a.rotulo, 3.4, PAL.azul);
      if (an) { halo.setAttribute("opacity", 0); timers.push(setTimeout(() => fade(halo, true), 1800)); }
    };

    A.congelar = (a, an) => {
      const ar = areaDe(a);
      const nuc = a.nucleos || [[(ar[0] + ar[2]) / 2, (ar[1] + ar[3]) / 2]];
      const R = a.raio == null ? 999 : a.raio;
      const sol = solutos(ar);
      const ev = a.evitar_raio;
      // 1) solutos: presos no lugar (com bolsão líquido) ou expulsos do cristal
      if (ev != null) {
        sol.forEach(s => {
          if (s.p) { s.p.modo = "preso"; s.p.casa = { x: s.p.x, y: s.p.y }; }
          const rb = s.r + ev - 1.2;
          const nb = Math.max(2, Math.round(rb * .9));
          for (let i = 0; i < nb; i++) { const t = rnd(0, 6.28), rr = rnd(s.r + 1.2, rb); const p = novaParte("agua", s.x + Math.cos(t) * rr, s.y + Math.sin(t) * rr, { agit: .55, lim: { t: "c", cx: s.x, cy: s.y, r: rb } }); if (!an) { p.alfa = 1; p.g.setAttribute("opacity", 1); } }
        });
      } else if (a.expulsar !== false) {
        sol.forEach(s => {
          if (s.el && s.el.tipo === "bacteria") return;
          let x = s.x, y = s.y;
          for (let it = 0; it < 3; it++) for (const [nx, ny] of nuc) { const d = dist(x, y, nx, ny); if (d < R + 1.5) { const k = (R + 2.4) / (d || .01); x = nx + (x - nx) * k; y = ny + (y - ny) * k; } }
          x = Math.min(Math.max(x, ar[0] + 1), ar[2] - 1); y = Math.min(Math.max(y, ar[1] + 1), ar[3] - 1);
          if (s.p) { s.p.modo = an ? "indo" : "preso"; s.p.modoFinal = "preso"; s.p.casa = { x, y }; if (!an) { s.p.x = x; s.p.y = y; } }
          else if (s.el) A.mover({ elemento: s.el.def.id, para: [x, y], duracao: a.duracao || 3000 }, an);
        });
      }
      // 2) sítios da rede hexagonal
      const st = [];
      const dy = S * .866;
      for (let j = 0, y = ar[1] + S / 2; y <= ar[3] - .6; j++, y += dy) for (let x = ar[0] + S / 2 + (j % 2 ? S / 2 : 0); x <= ar[2] - .6; x += S) {
        const key = x.toFixed(1) + "," + y.toFixed(1); if (sites.has(key)) continue;
        let dn = 1e9; for (const [nx, ny] of nuc) dn = Math.min(dn, dist(x, y, nx, ny)); if (dn > R) continue;
        if (ev != null && sol.some(s => dist(x, y, s.x, s.y) < s.r + ev)) continue;
        if (ev == null && sol.some(s => s.el && s.el.tipo === "bacteria" && dist(x, y, s.x, s.y) < 3.2)) { /* cristal atravessa a célula */ }
        st.push({ x, y, key, dn });
      }
      st.sort((p, q) => p.dn - q.dn);
      st.forEach(s => sites.add(s.key));
      if (R < 900) nuc.forEach(([nx, ny]) => discos.push({ cx: nx, cy: ny, r: R + S * .55 }));
      else discos.push({ cx: (ar[0] + ar[2]) / 2, cy: (ar[1] + ar[3]) / 2, r: 0, area: ar });
      const ocupar = s => {
        let p = maisProxima(livres(a.grupo || "*", q => q.lim.t === "r" && dentro([ar[0] - 6, ar[1] - 6, ar[2] + 6, ar[3] + 6], q.x, q.y)), s.x, s.y);
        if (!p) { p = novaParte("agua", s.x + rnd(-6, 6), s.y + rnd(-6, 6)); if (!an) p.alfa = 1; }
        p.reserva = true; p.casa = { x: s.x, y: s.y };
        if (an) { p.modo = "indo"; p.modoFinal = "gelo"; }
        else { p.modo = "gelo"; p.x = s.x; p.y = s.y; setGelo(p, true); orient(p, -90); p.alfa = 1; p.g.setAttribute("opacity", 1); }
        p.sitio = s.key;
      };
      const limpaSobra = () => {
        // águas livres que ficaram dentro da região congelada desaparecem (viraram gelo)
        livres("*", q => q.lim.t === "r" && dentro(ar, q.x, q.y) && (R > 900 || nuc.some(([nx, ny]) => dist(q.x, q.y, nx, ny) < R))).forEach(remover);
      };
      if (!an || !a.duracao) { st.forEach(ocupar); if (!an) limpaSobra(); else timers.push(setTimeout(limpaSobra, 1500)); return; }
      const t0 = performance.now(); let i = 0;
      procs.push(t => { const k = Math.min(1, (t - t0) / a.duracao); const alvo = Math.floor(k * st.length); while (i < alvo) ocupar(st[i++]); if (k >= 1) { while (i < st.length) ocupar(st[i++]); timers.push(setTimeout(limpaSobra, 1800)); return false; } });
    };

    A.derreter = (a, an) => {
      const [cx, cy] = a.centro, R = a.raio || 10;
      const alvo = parts.filter(p => p.modo === "gelo" || (p.modoFinal === "gelo" && p.modo === "indo")).filter(p => dist(p.casa.x, p.casa.y, cx, cy) < R).sort((p, q) => dist(p.x, p.y, cx, cy) - dist(q.x, q.y, cx, cy));
      const liberar = p => { if (p.sitio) sites.delete(p.sitio); p.modo = "livre"; p.reserva = false; p.modoFinal = null; setGelo(p, false); p.agit = a.agitacao == null ? .7 : a.agitacao; p.lim = { t: "c", cx, cy, r: R }; p.grupo = a.grupo || "w"; };
      discos = discos.filter(d => dist(d.cx, d.cy, cx, cy) > R || d.r === 0);
      if (!an) { alvo.forEach(liberar); return; }
      const dur = a.duracao || 2500, t0 = performance.now(); let i = 0;
      procs.push(t => { const k = Math.min(1, (t - t0) / dur); const n = Math.floor(k * alvo.length); while (i < n) liberar(alvo[i++]); return k < 1; });
    };

    A.desidratar = (a, an) => {
      const e = els[a.alvo]; if (!e) return;
      const n = a.n || 8, ps = [];
      for (let i = 0; i < n; i++) { const p = novaParte("agua", e.x + rnd(-3, 3), e.y + rnd(-1.2, 1.2), { agit: .8 }); p.modo = "preso"; p.casa = { x: p.x, y: p.y }; ps.push(p); if (!an) { p.alfa = 1; } }
      const sair = () => ps.forEach(p => { p.modo = "livre"; p.lim = { t: "r", x1: 2, y1: 2, x2: 98, y2: 58 }; const t = Math.atan2(p.y - e.y, p.x - e.x); p.vx = Math.cos(t) * 14; p.vy = Math.sin(t) * 14; });
      if (!an) { ps.forEach(p => { const t = rnd(0, 6.28); p.x = e.x + Math.cos(t) * rnd(9, 20); p.y = e.y + Math.sin(t) * rnd(8, 16); p.modo = "livre"; p.lim = { t: "r", x1: 2, y1: 2, x2: 98, y2: 58 }; p.g.setAttribute("opacity", 1); }); e.esc = .78; posEl(e); if (e.corpo) e.corpo.setAttribute("fill", PAL.bactSeca); return; }
      timers.push(setTimeout(() => { sair(); tween(1800, k => { e.esc = 1 - .22 * k; posEl(e); }, true); if (e.corpo) e.corpo.setAttribute("fill", PAL.bactSeca); }, 900));
    };

    A.coletar = (a, an) => {
      const ps = parts.filter(p => p.tipo === (a.especie || "particula") && !p.morrer);
      const [cx, cy] = a.para;
      ps.forEach((p, i) => { const r = 2.2 * Math.sqrt(i), t = i * 2.4; const x = cx + Math.cos(t) * r, y = cy + Math.sin(t) * r; p.casa = { x, y }; p.modo = an ? "indo" : "preso"; p.modoFinal = "preso"; if (!an) { p.x = x; p.y = y; } });
    };

    A.rotulo = (a, an) => { const g = mk("g", {}, L.ann); rot(g, a.x, a.y, a.texto, a.tamanho || 3.9, PAL[a.cor] || PAL.giz); fade(g, an); };
    A.circulo = (a, an) => { const g = mk("g", {}, L.ann); const c = PAL[a.cor] || PAL.ambar; mk("circle", { cx: a.x, cy: a.y, r: a.r || 6, fill: "none", stroke: c, "stroke-width": .5, "stroke-dasharray": "1.4 1" }, g); if (a.rotulo) rot(g, a.x, a.y - (a.r || 6) - 1.6, a.rotulo, 3.6, c); fade(g, an); };
    A.linha = (a, an) => { const g = mk("g", {}, L.ann); mk("line", { x1: a.de[0], y1: a.de[1], x2: a.para[0], y2: a.para[1], stroke: PAL[a.cor] || PAL.giz + "66", "stroke-width": .4, "stroke-dasharray": "1.5 1.2" }, g); fade(g, an); };
    A.seta = (a, an) => {
      const g = mk("g", {}, L.ann); const c = PAL[a.cor] || PAL.giz;
      const [x1, y1] = a.de, [x2, y2] = a.para, t = Math.atan2(y2 - y1, x2 - x1);
      mk("line", { x1, y1, x2, y2, stroke: c, "stroke-width": .55 }, g);
      mk("path", { d: `M${x2},${y2}L${x2 - 2 * Math.cos(t - .45)},${y2 - 2 * Math.sin(t - .45)}L${x2 - 2 * Math.cos(t + .45)},${y2 - 2 * Math.sin(t + .45)}Z`, fill: c }, g);
      if (a.rotulo) rot(g, x1, y1 + (y2 > y1 ? -1.6 : 4), a.rotulo, 3.6, c);
      fade(g, an);
    };
    A.evaporar = (a, an) => {
      const ar = a.area || [0, 0, 100, 60];
      const alvo = parts.filter(p => p.tipo === "agua" && !p.morrer && !p.ligada && dentro(ar, p.x, p.y) && (!a.apenas || (a.apenas === "livre" ? p.modo === "livre" : p.modo !== "livre"))).slice(0, a.n || 9999);
      alvo.forEach((p, i) => {
        const sair = () => { p.modo = "indo"; p.modoFinal = "preso"; p.casa = { x: p.x + rnd(-6, 6), y: -8 }; p.alvoAlfa = 0; p.morrer = true; if (p.sitio) sites.delete(p.sitio); };
        if (!an) { p.g.remove(); p.morrer = true; p.alfa = 0; return; }
        timers.push(setTimeout(sair, rnd(0, a.duracao || 3000)));
      });
      if (!an) parts = parts.filter(p => !(p.morrer && p.alfa <= 0));
      if (a.apenas !== "livre") Object.values(els).forEach(e => { if (e.hid) e.hid = e.hid.filter(q => q.ligada); if (e.halo && an) tween(1500, k => e.halo.setAttribute("opacity", 1 - k), true); else if (e.halo) e.halo.setAttribute("opacity", 0); });
    };
    A.prender = (a, an) => {
      const ar = areaDe(a);
      parts.filter(p => p.tipo === "agua" && p.modo === "livre" && !p.morrer && (!a.grupo || p.grupo === a.grupo)).slice(0, a.n || 999).forEach(p => {
        const x = rnd(ar[0], ar[2]), y = rnd(ar[1], ar[3]);
        p.lim = { t: "r", x1: ar[0], y1: ar[1], x2: ar[2], y2: ar[3] };
        if (a.agitacao != null) p.agit = a.agitacao;
        if (!an) { p.x = x; p.y = y; return; }
        p.modo = "indo"; p.modoFinal = "livre"; p.casa = { x, y };
      });
    };
    A.vagar = (a, an) => {
      const e = els[a.elemento]; if (!e) return;
      const ar = a.area || [6, 6, 94, 54]; let vx = 0, vy = 0, t0 = 0;
      const ag = a.agitacao == null ? .5 : a.agitacao;
      e.vagando = true;
      procs.push(t => { if (!e.vagando) return false; const dt = t0 ? Math.min(.05, (t - t0) / 1000) : 0; t0 = t;
        vx += (Math.random() - .5) * ag * 40 * dt * 6; vy += (Math.random() - .5) * ag * 40 * dt * 6; const dmp = Math.pow(.2, dt); vx *= dmp; vy *= dmp;
        e.x += vx * dt; e.y += vy * dt; if (e.x < ar[0] || e.x > ar[2]) { vx *= -1; e.x = Math.min(Math.max(e.x, ar[0]), ar[2]); } if (e.y < ar[1] || e.y > ar[3]) { vy *= -1; e.y = Math.min(Math.max(e.y, ar[1]), ar[3]); } posEl(e); });
    };
    A.organizar = (a, an) => {
      const ar = a.area || [10, 10, 90, 50], sp = a.espaco || 5.5;
      const ps = parts.filter(p => p.tipo === (a.especie || "acucar") && !p.morrer && (!a.de_area || dentro(a.de_area, p.x, p.y)));
      const cols = Math.max(1, Math.floor((ar[2] - ar[0]) / sp));
      ps.forEach((p, i) => { const x = ar[0] + (i % cols) * sp + sp / 2, y = ar[1] + Math.floor(i / cols) * sp * .9 + sp / 2; p.casa = { x, y }; p.modo = an ? "indo" : "preso"; p.modoFinal = "preso"; if (!an) { p.x = x; p.y = y; } });
    };
    A.congelar_solutos = (a, an) => { parts.filter(p => p.tipo !== "agua" && !p.morrer && (!a.de_area || dentro(a.de_area, p.x, p.y))).forEach(p => { p.modo = "preso"; p.casa = { x: p.x, y: p.y }; }); };
    A.limpar_rotulos = () => { L.ann.innerHTML = ""; };
    /* ---------- ácidos: HA ⇌ H⁺ + A⁻ ---------- */
    function limR(ar) { return { t: "r", x1: ar[0], y1: ar[1], x2: ar[2], y2: ar[3] }; }
    function parteVis(p, an, atraso) { if (!an) { p.alfa = 1; p.g.setAttribute("opacity", 1); } else if (atraso) { p.alvoAlfa = 0; timers.push(setTimeout(() => { if (!p.morrer) p.alvoAlfa = 1; }, atraso)); } }
    function daEspecie(esp, ar, grupo) { return parts.filter(p => p.tipo === esp && !p.morrer && (!grupo || p.grupo === grupo) && (!ar || dentro(ar, p.x, p.y))); }
    // acidos: {n, area|dentro, frac (0..1 dissociados), grupo, agitacao}
    A.acidos = (a, an) => {
      const ar = areaDe(a), n = a.n || 10, fr = a.frac || 0, nd = Math.round(n * fr), lim = limR(ar), ag = a.agitacao == null ? .45 : a.agitacao, gr = a.grupo || "acid";
      for (let i = 0; i < n; i++) {
        const x = rnd(ar[0], ar[2]), y = rnd(ar[1], ar[3]);
        if (i < nd) { parteVis(novaParte("a", x, y, { grupo: gr, agit: ag, lim }), an); parteVis(novaParte("h", Math.min(ar[2], x + 3), y, { grupo: gr, agit: ag * 1.4, lim }), an); }
        else parteVis(novaParte("ha", x, y, { grupo: gr, agit: ag, lim }), an);
      }
    };
    // protons: {n, area|dentro, grupo}
    A.protons = (a, an) => { const ar = areaDe(a); for (let i = 0; i < (a.n || 8); i++) parteVis(novaParte("h", rnd(ar[0], ar[2]), rnd(ar[1], ar[3]), { grupo: a.grupo || "hm", agit: a.agitacao == null ? .7 : a.agitacao, lim: limR(ar) }), an); };
    // dissociar: {area|dentro, frac (fração dos HA da área) | n, grupo, duracao}
    A.dissociar = (a, an) => {
      const ar = areaDe(a), lista = daEspecie("ha", ar, a.grupo);
      const k = a.n != null ? Math.min(a.n, lista.length) : Math.round(lista.length * (a.frac == null ? 1 : a.frac));
      const dur = a.duracao || 2500;
      lista.slice(0, k).forEach((p, i) => {
        const fazer = () => { if (p.morrer) return; remover(p); p.alfa = 0; p.g.setAttribute("opacity", 0);
          const na = novaParte("a", p.x, p.y, { grupo: p.grupo, agit: p.agit, lim: p.lim }); na.alfa = 1; na.g.setAttribute("opacity", 1);
          const nh = novaParte("h", p.x + 1.8, p.y - 1.2, { grupo: p.grupo, agit: Math.max(.6, p.agit * 1.4), lim: p.lim }); nh.alfa = 1; nh.g.setAttribute("opacity", 1); nh.vx = rnd(4, 9); nh.vy = rnd(-6, 6); };
        if (!an) fazer(); else timers.push(setTimeout(fazer, dur * i / Math.max(1, k)));
      });
    };
    // associar: {area|dentro, frac|n, grupo, duracao} — A⁻ captura um H⁺ próximo e volta a HA
    A.associar = (a, an) => {
      const ar = areaDe(a), lista = daEspecie("a", ar, a.grupo);
      const k = a.n != null ? Math.min(a.n, lista.length) : Math.round(lista.length * (a.frac == null ? 1 : a.frac));
      const dur = a.duracao || 2500;
      lista.slice(0, k).forEach((p, i) => {
        const fazer = () => { if (p.morrer) return; const hs = daEspecie("h", ar); const h = maisProxima(hs, p.x, p.y); if (h) { remover(h); h.alfa = 0; h.g.setAttribute("opacity", 0); }
          remover(p); p.alfa = 0; p.g.setAttribute("opacity", 0); const n = novaParte("ha", p.x, p.y, { grupo: p.grupo, agit: p.agit, lim: p.lim }); n.alfa = 1; n.g.setAttribute("opacity", 1); };
        if (!an) fazer(); else timers.push(setTimeout(fazer, dur * i / Math.max(1, k)));
      });
    };
    // atravessar: {especie, de:area|id, para:area|id, n, duracao, grupo_novo} — partículas passam de uma região a outra (ex.: HA cruza a membrana)
    A.atravessar = (a, an) => {
      const reg = r => typeof r === "string" ? areaDe({ dentro: r }) : (r || [2, 2, 98, 58]);
      const de = a.de ? reg(a.de) : null, para = reg(a.para);
      let lista = daEspecie(a.especie || "ha", null, a.grupo).filter(p => !de || dentro(de, p.x, p.y));
      if (a.fora) { const f = reg(a.fora); lista = lista.filter(p => !dentro(f, p.x, p.y)); }
      lista = lista.slice(0, a.n == null ? lista.length : a.n);
      const dur = a.duracao || 3000;
      lista.forEach((p, i) => {
        const fazer = () => { const x = rnd(para[0], para[2]), y = rnd(para[1], para[3]); p.lim = limR(para); if (a.grupo_novo) p.grupo = a.grupo_novo;
          if (!an) { p.x = x; p.y = y; p.modo = "livre"; p.casa = null; return; } p.modo = "indo"; p.modoFinal = "livre"; p.casa = { x, y }; };
        if (!an) fazer(); else timers.push(setTimeout(fazer, dur * i / Math.max(1, lista.length)));
      });
    };
    // remover_especie: {especie, area|dentro, n}
    A.remover_especie = (a, an) => { const ar = (a.area || a.dentro) ? areaDe(a) : null; daEspecie(a.especie, ar, a.grupo).slice(0, a.n == null ? 999 : a.n).forEach(p => { remover(p); if (!an) { p.alfa = 0; } }); };
    A.limpar_cena = () => limpar();

    function limpar() {
      timers.forEach(clearTimeout); timers = []; procs = [];
      parts.forEach(p => p.g.remove()); parts = []; sites = new Set(); discos = []; pontes = [];
      Object.values(L).forEach(l => l.innerHTML = "");
      els = {}; (def.elementos || []).forEach(construirEl);
    }

    function executar(a, anim) {
      const fn = A[a.tipo]; if (!fn) return;
      if (anim && a.atraso) timers.push(setTimeout(() => fn(a, true), a.atraso));
      else fn(a, anim);
    }

    limpar(); iniciar();
    return {
      executar, limpar,
      parar() { timers.forEach(clearTimeout); timers = []; procs = []; cancelAnimationFrame(raf); raf = 0; root.remove(); },
      acoes: Object.keys(A)
    };
  }

  global.Cena = { criar };
})(window);
