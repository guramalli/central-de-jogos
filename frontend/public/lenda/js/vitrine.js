/* Lenda do Campinho — vitrine (/lenda/). © 2026 Educação Gamer. Todos os direitos reservados. */
/* ============================================================
   VITRINE — liga a capa viva na abertura e cuida das seções: barra do topo
   (vidro ao rolar, menu no celular), jornada (rolagem presa no computador,
   faixa de arrastar no celular), entradas em cascata, destaques que
   inclinam no mouse, trailer que só baixa no clique, galeria em tela cheia,
   botões de copiar e a marca "já viu a vitrine" (o jogo não manda de novo).
   Expõe window.Vitrine com as contas puras (testadas em tests/lenda).
   ============================================================ */
(function (raiz) {
  'use strict';

  // Quanto da jornada já passou (0 a 1), pela posição da seção na tela.
  function progressoJornada(topo, alturaSecao, alturaTela) {
    const total = alturaSecao - alturaTela;
    if (!(total > 0)) return 0;
    return Math.min(1, Math.max(0, -topo / total));
  }
  function etapaAtiva(prog, n) { return n > 0 ? Math.min(n - 1, Math.max(0, Math.round(prog * (n - 1)))) : 0; }
  function proximoIndice(i, delta, n) { return n > 0 ? (((i + delta) % n) + n) % n : 0; }
  raiz.Vitrine = { progressoJornada, etapaAtiva, proximoIndice };
  if (typeof document === 'undefined') return;

  const doc = document, win = window;
  const reduz = win.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mouseFino = win.matchMedia('(pointer: fine)').matches;
  const $ = (s, r = doc) => r.querySelector(s);
  const $$ = (s, r = doc) => [...r.querySelectorAll(s)];
  const idioma = () => (doc.documentElement.lang === 'en' ? 'en' : 'pt');
  const texto = (k) => ((win.TEXTOS && win.TEXTOS[idioma()] && win.TEXTOS[idioma()][k]) || '');

  // Quem viu a vitrine não é mais mandado pra cá pelo jogo (js/vitrine_entrada.js).
  try { win.localStorage.setItem('lenda_vitrine_vista', '1'); } catch (e) { /* armazenamento bloqueado */ }

  // ---------- Abertura ----------
  const nav = $('#nav'), conteudo = $('#heroConteudo'), heroCapa = $('#heroCapa');
  const largo = () => win.innerWidth / win.innerHeight > 0.8;
  if (win.CapaViva) {
    win.CapaViva.monta(heroCapa, {
      horizontal: { src: '/lenda-do-campinho/a/capa.webp', bola: [76, 19], sol: [45, 77] },
      vertical: { src: '/lenda-do-campinho/a/capa_vertical.webp', bola: [70, 40.5], sol: [50, 70] },
      alt: heroCapa.dataset.alt || '',
      rolagem: true,
      aoQuadro: ({ mx, my }) => {
        if (!largo()) return;
        conteudo.style.setProperty('--mx', (mx * 10).toFixed(2) + 'px');
        conteudo.style.setProperty('--my', (my * 6).toFixed(2) + 'px');
      },
    });
  }

  // ---------- Barra do topo ----------
  const botaoMenu = $('#navMenu');
  const fechaMenu = () => { nav.classList.remove('aberta'); botaoMenu.setAttribute('aria-expanded', 'false'); };
  botaoMenu.addEventListener('click', () => botaoMenu.setAttribute('aria-expanded', String(nav.classList.toggle('aberta'))));
  $$('#navLinks a').forEach((a) => a.addEventListener('click', fechaMenu));
  doc.addEventListener('keydown', (e) => { if (e.key === 'Escape') fechaMenu(); });

  // ---------- Jornada ----------
  const secao = $('#jornada'), trilho = $('#trilho'), etapas = $$('.etapa', trilho);
  const fundo = $('#jornadaFundo'), regua = $('#regua'), marcos = $$('#marcos span');
  const presa = () => win.innerWidth >= 700 && !reduz;
  let ativaAntes = -1;
  function marcaEtapa(prog) {
    regua.style.width = (prog * 100).toFixed(2) + '%';
    const ativa = etapaAtiva(prog, etapas.length);
    if (ativa === ativaAntes) return;
    ativaAntes = ativa;
    etapas.forEach((e, i) => e.classList.toggle('ativa', i === ativa));
    marcos.forEach((m, i) => m.classList.toggle('feito', i <= ativa));
    fundo.style.background = `radial-gradient(ellipse at 70% 30%, ${etapas[ativa].dataset.cor}, transparent 70%)`;
  }
  function jornada() {
    if (!presa()) { trilho.style.transform = ''; if (reduz) etapas.forEach((e) => e.classList.add('ativa')); return; }
    const r = secao.getBoundingClientRect();
    const prog = progressoJornada(r.top, secao.offsetHeight, win.innerHeight);
    trilho.style.transform = `translateX(${(-prog * Math.max(0, trilho.scrollWidth - win.innerWidth)).toFixed(1)}px)`;
    marcaEtapa(prog);
  }
  trilho.addEventListener('scroll', () => {
    if (presa()) return;
    const max = trilho.scrollWidth - trilho.clientWidth;
    marcaEtapa(max > 0 ? trilho.scrollLeft / max : 0);
  }, { passive: true });

  // ---------- Rolagem ----------
  function aoRolar() {
    const rol = Math.min(1, win.scrollY / win.innerHeight);
    conteudo.style.setProperty('--rol', rol.toFixed(3));
    conteudo.style.opacity = String(Math.max(0, 1 - rol * 1.4));
    nav.classList.toggle('solida', win.scrollY > 40);
    jornada();
  }
  win.addEventListener('scroll', aoRolar, { passive: true });
  win.addEventListener('resize', aoRolar);
  aoRolar();
  if (!presa()) marcaEtapa(0);

  // ---------- Entradas em cascata ----------
  if ('IntersectionObserver' in win) {
    const io = new IntersectionObserver((ents) => {
      for (const e of ents) if (e.isIntersecting) { e.target.classList.add('lc-visivel'); io.unobserve(e.target); }
    }, { threshold: 0.15 });
    $$('.lc-entra').forEach((el) => io.observe(el));
  } else {
    $$('.lc-entra').forEach((el) => el.classList.add('lc-visivel'));
  }

  // ---------- Destaques: inclinam seguindo o mouse ----------
  if (mouseFino && !reduz) {
    $$('.destaque').forEach((c) => {
      const corpo = $('.destaque-corpo', c);
      c.addEventListener('pointermove', (e) => {
        const r = c.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        corpo.style.setProperty('--rx', (-y * 8).toFixed(2) + 'deg');
        corpo.style.setProperty('--ry', (x * 10).toFixed(2) + 'deg');
        corpo.style.setProperty('--gx', ((x + 0.5) * 100).toFixed(1) + '%');
        corpo.style.setProperty('--gy', ((y + 0.5) * 100).toFixed(1) + '%');
      });
      c.addEventListener('pointerleave', () => { corpo.style.setProperty('--rx', '0deg'); corpo.style.setProperty('--ry', '0deg'); });
    });
  }

  // ---------- Trailer: o vídeo só é baixado no clique ----------
  const quadroTrailer = $('#trailerQuadro');
  const fonteTrailer = () => `video/trailer_${idioma()}.mp4`;
  $('#trailerPlay').addEventListener('click', () => {
    const v = doc.createElement('video');
    v.controls = true; v.playsInline = true; v.preload = 'auto'; v.poster = 'a/poster.webp'; v.src = fonteTrailer();
    quadroTrailer.replaceChildren(v);
    v.play().catch(() => { /* navegador bloqueou o play automático: fica o botão do player */ });
  });
  // Trocou o idioma com o vídeo parado: troca o trailer também.
  doc.addEventListener('idioma', () => { const v = $('video', quadroTrailer); if (v && v.paused) v.src = fonteTrailer(); });

  // ---------- Galeria em tela cheia ----------
  const fotos = $$('.galeria-item'), caixa = $('#caixaFoto'), imgGrande = $('#caixaFotoImg'), legenda = $('#caixaFotoLegenda');
  let atual = 0;
  function mostra(i) {
    atual = proximoIndice(i, 0, fotos.length);
    const f = fotos[atual];
    imgGrande.src = f.dataset.grande;
    imgGrande.alt = $('img', f).alt;
    legenda.textContent = $('.galeria-legenda', f).textContent;
  }
  fotos.forEach((f, i) => f.addEventListener('click', () => { mostra(i); caixa.showModal(); }));
  $('#caixaAnterior').addEventListener('click', () => mostra(atual - 1));
  $('#caixaProxima').addEventListener('click', () => mostra(atual + 1));
  $('#caixaFechar').addEventListener('click', () => caixa.close());
  caixa.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); mostra(atual - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); mostra(atual + 1); }
  });
  caixa.addEventListener('click', (e) => { if (e.target === caixa) caixa.close(); });
  let x0 = null;
  imgGrande.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
  imgGrande.addEventListener('pointerup', (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) mostra(atual + (dx < 0 ? 1 : -1));
  });

  // ---------- Copiar descrições (kit de imprensa) ----------
  $$('[data-copia]').forEach((b) => b.addEventListener('click', async () => {
    const alvo = doc.getElementById(b.dataset.copia);
    const txt = alvo.innerText.trim();
    try { await win.navigator.clipboard.writeText(txt); }
    catch (e) {
      const r = doc.createRange(); r.selectNodeContents(alvo);
      const s = win.getSelection(); s.removeAllRanges(); s.addRange(r); doc.execCommand('copy'); s.removeAllRanges();
    }
    b.textContent = texto('imp.copiado') || 'Copiado!';
    setTimeout(() => { b.textContent = texto('imp.copiar') || 'Copiar'; }, 1600);
  }));
})(typeof window !== 'undefined' ? window : globalThis);
