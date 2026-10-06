/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   CAPA VIVA — a arte da capa "respirando": a câmera entra e respira,
   a bola pulsa e solta faíscas douradas, sobe poeira de luz, os raios de
   sol giram, e tudo acompanha o mouse (e, se pedido, a rolagem).
   Usada pela tela inicial do jogo (js/inicio.js) e pela vitrine (/lenda/).
   Script clássico (sem import/export): o jogo — e a versão Steam — carrega
   tudo sem módulos. Expõe window.CapaViva.
   O laço só roda com a capa na tela e a aba visível: quando o jogo começa,
   #inicio some e a animação para. Com "reduzir movimento" fica só a arte.
   ============================================================ */
(function (raiz) {
  'use strict';

  // Quantos "passos de 60 quadros por segundo" cabem no tempo que passou: a
  // animação anda igual em 60, 120, 144 ou 360 Hz. No máximo 3 (aba que volta
  // depois de muito tempo não dá um salto).
  function fatorTempo(dtMs) { return dtMs > 0 ? Math.min(3, dtMs / (1000 / 60)) : 0; }
  function deveAnimar(e) { return !!(e && e.visivel && !e.abaOculta && !e.reduzMovimento); }
  // Arte em pé (2:3) quando o espaço é "em pé" (largura/altura ≤ 0,8).
  function usaVertical(largura, altura, temVertical) { return !!temVertical && altura > 0 && largura / altura <= 0.8; }

  function monta(alvo, op) {
    const doc = alvo.ownerDocument, win = doc.defaultView;
    const mm = (q) => !!(win.matchMedia && win.matchMedia(q).matches);
    const reduz = mm('(prefers-reduced-motion: reduce)'), mouseFino = mm('(pointer: fine)');
    alvo.classList.add('capa-viva');
    const palco = doc.createElement('div'); palco.className = 'cv-palco';
    const camera = doc.createElement('div'); camera.className = 'cv-camera';
    const img = doc.createElement('img'); img.alt = op.alt || ''; img.decoding = 'async'; img.setAttribute('fetchpriority', 'high');
    const raios = doc.createElement('div'); raios.className = 'cv-raios';
    const brilho = doc.createElement('div'); brilho.className = 'cv-brilho';
    camera.append(img, raios, brilho); palco.append(camera);
    const cv = doc.createElement('canvas'); cv.className = 'cv-faiscas'; cv.setAttribute('aria-hidden', 'true');
    alvo.append(palco, cv);
    const ctx = cv.getContext('2d');

    // Uma arte só é baixada: a que serve pro formato do espaço agora.
    let cfg = null;
    function escolheArte() {
      const vert = usaVertical(alvo.clientWidth, alvo.clientHeight, !!op.vertical);
      const novo = vert ? op.vertical : op.horizontal;
      if (novo === cfg) return;
      cfg = novo;
      palco.classList.toggle('cv-vertical', vert);
      img.src = cfg.src;
      raios.style.left = cfg.sol[0] + '%'; raios.style.top = cfg.sol[1] + '%';
      brilho.style.left = cfg.bola[0] + '%'; brilho.style.top = cfg.bola[1] + '%';
    }

    let W = 0, H = 0, dpr = 1;
    function medir() {
      dpr = Math.min(2, win.devicePixelRatio || 1);
      W = cv.width = Math.round(alvo.clientWidth * dpr); H = cv.height = Math.round(alvo.clientHeight * dpr);
      escolheArte();
    }

    const parts = [];
    function bolaNaTela() {
      const r = palco.getBoundingClientRect(), a = alvo.getBoundingClientRect();
      return { x: (r.left - a.left + r.width * cfg.bola[0] / 100) * dpr, y: (r.top - a.top + r.height * cfg.bola[1] / 100) * dpr, raio: r.width * 0.03 * dpr };
    }
    function nasceFaisca() {
      const b = bolaNaTela();
      const ang = Math.PI * (0.62 + Math.random() * 0.28); // rastro para baixo-esquerda, como na arte
      const v = (1.2 + Math.random() * 2.6) * dpr;
      parts.push({ x: b.x + (Math.random() - 0.5) * b.raio, y: b.y + (Math.random() - 0.5) * b.raio, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v * 0.7 - 0.4 * dpr,
        vida: 1, dec: 0.012 + Math.random() * 0.018, t: (1 + Math.random() * 2.2) * dpr, cor: Math.random() < 0.7 ? '255,214,102' : '255,255,255', poeira: false });
    }
    function nascePoeira() {
      parts.push({ x: Math.random() * W, y: H + 10, vx: (Math.random() - 0.5) * 0.3 * dpr, vy: -(0.3 + Math.random() * 0.7) * dpr,
        vida: 1, dec: 0.002 + Math.random() * 0.003, t: (1 + Math.random() * 2.5) * dpr, cor: Math.random() < 0.5 ? '165,180,252' : '255,226,150', poeira: true });
    }

    let mx = 0, my = 0, ax = 0, ay = 0, antes = 0, rafId = 0, visivel = true, acF = 0, acP = 0;
    function quadro(agora) {
      rafId = 0;
      const k = fatorTempo(agora - antes); antes = agora;
      const suave = Math.min(1, 0.06 * k);
      mx += (ax - mx) * suave; my += (ay - my) * suave;
      const rolagem = op.rolagem ? Math.min(1, Math.max(0, win.scrollY / Math.max(1, alvo.clientHeight))) : 0;
      palco.style.transform = `translate(calc(-50% + ${(-mx * 22).toFixed(2)}px), calc(-50% + ${(-my * 14 + rolagem * 120).toFixed(2)}px)) scale(${(1 + rolagem * 0.08).toFixed(4)})`;
      if (op.aoQuadro) op.aoQuadro({ mx, my, rolagem });
      ctx.clearRect(0, 0, W, H);
      if (rolagem < 1) {
        acF += 3 * k; acP += 0.35 * k;
        while (acF >= 1) { nasceFaisca(); acF--; }
        while (acP >= 1) { nascePoeira(); acP--; }
      }
      for (let i = parts.length - 1; i >= 0; i--) {
        const q = parts[i];
        q.x += q.vx * k; q.y += q.vy * k; q.vida -= q.dec * k;
        if (q.poeira) q.x += Math.sin((q.y + i) * 0.01) * 0.3 * dpr * k;
        else { q.vy += 0.03 * dpr * k; q.vx *= Math.pow(0.99, k); }
        if (q.vida <= 0) { parts.splice(i, 1); continue; }
        const a = q.poeira ? Math.sin(q.vida * Math.PI) * 0.7 : q.vida;
        ctx.beginPath(); ctx.fillStyle = `rgba(${q.cor},${a.toFixed(3)})`; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 8 * dpr;
        ctx.arc(q.x, q.y, q.t * (q.poeira ? 1 : q.vida + 0.3), 0, Math.PI * 2); ctx.fill();
      }
      liga();
    }
    function liga() {
      const pode = deveAnimar({ visivel, abaOculta: doc.hidden, reduzMovimento: reduz });
      if (pode && !rafId) { if (!antes) antes = win.performance.now(); rafId = win.requestAnimationFrame(quadro); }
      else if (!pode && rafId) { win.cancelAnimationFrame(rafId); rafId = 0; }
      if (!pode) { antes = 0; parts.length = 0; ctx.clearRect(0, 0, W, H); }
    }

    const aoMover = (e) => { ax = e.clientX / win.innerWidth - 0.5; ay = e.clientY / win.innerHeight - 0.5; };
    if (mouseFino && !reduz) win.addEventListener('pointermove', aoMover, { passive: true });
    win.addEventListener('resize', medir);
    doc.addEventListener('visibilitychange', liga);
    let io = null;
    if (win.IntersectionObserver) {
      io = new win.IntersectionObserver((ents) => { visivel = ents[ents.length - 1].isIntersecting; if (visivel) medir(); liga(); });
      io.observe(alvo);
    }
    medir(); liga();
    return {
      destroi() {
        if (rafId) win.cancelAnimationFrame(rafId); rafId = 0;
        if (io) io.disconnect();
        win.removeEventListener('pointermove', aoMover); win.removeEventListener('resize', medir); doc.removeEventListener('visibilitychange', liga);
        palco.remove(); cv.remove(); alvo.classList.remove('capa-viva');
      },
    };
  }

  raiz.CapaViva = { monta, fatorTempo, deveAnimar, usaVertical };
})(typeof window !== 'undefined' ? window : globalThis);
