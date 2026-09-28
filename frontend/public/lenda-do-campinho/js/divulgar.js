/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   📣 DIVULGAR (v152): cartão bonito com o jogador (skin/montaria),
   nível e um feito, para compartilhar (WhatsApp, redes, baixar a imagem).
   - Botões: Ficha, Visual, menu ☰ do celular; depois de uma compra de
     luxo e a cada 50 níveis aparece um convite (some sozinho).
   - Celular: usa o "compartilhar" do aparelho (com a imagem).
   Só nome do personagem, nível e o feito: nada pessoal.
   Carregar DEPOIS de luxo.js.
   ============================================================ */
const DIVULGA_URL = 'https://www.educacaogamer.com.br/lenda-do-campinho/';
const carregaImg = src => new Promise(ok => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = src; });
function textoQuebrado(x, txt, xc, y, larg, alt) {
  const pal = String(txt).split(' '); const linhas = []; let l = '';
  for (const p of pal) { const t = l ? l + ' ' + p : p; if (x.measureText(t).width > larg && l) { linhas.push(l); l = p; } else l = t; }
  if (l) linhas.push(l); linhas.forEach((ln, i) => x.fillText(ln, xc, y + i * alt)); return linhas.length;
}
// v169: retrato de frente com as costas (asas, capa) INTEIRAS, num quadro mais largo que o do boneco.
// Devolve o desenho e onde o corpo ficou dentro dele (ox, oy, w, h), para manter o tamanho de antes.
function retratoLargo(look) {
  try {
    if (typeof spriteBoneco !== 'function' || typeof comAcessorios !== 'function') return null;
    const sp = specDe(look); if (!sp.costas || sp.costas === 'mochila') return null;
    const nome = folhaDoLook(sp, look), f = FOLHAS[nome], meta = (META_BONECOS[nome] || [])[0]; if (!f || !f.ok || !meta) return null;
    const corpo = spriteBoneco(Object.assign({}, look, { costas: null }), 'frente', 0); if (!corpo || !corpo.c) return null;
    // o mesmo recorte de cima que o spriteBoneco faz
    const topo = Math.max(0, Math.min(...(META_BONECOS[nome] || []).filter(Boolean).map(m => m.cabeca ? m.cabeca[1] : 20)) - ({ coroa: 40, cartola: 50, espartano: 48, louros: 22 }[sp.chapeu] || (sp.chapeu ? 26 : 4)));
    const PX = 150, PY = 60, c = mkCanvas(FOLHA_CW + PX * 2, FOLHA_CH + PY), x = c.getContext('2d');
    x.translate(PX, PY); comAcessorios(x, sp, 'f', meta, 'tras'); x.drawImage(corpo.c, 10, topo);
    return { c, ox: PX + 10, oy: PY + topo, w: corpo.c.width, h: corpo.c.height };
  } catch (e) { return null; }
}
async function montaCartao(o = {}) {
  const s = G.save; const W = 1080, H = 1350; const c = mkCanvas(W, H), x = c.getContext('2d');
  const fundo = await carregaImg(ASSET_DIR + 'titulo.webp'), logo = await carregaImg(ASSET_DIR + 'logo_jogo.webp');
  // fundo: o campinho, escurecido
  if (fundo) { const k = Math.max(W / fundo.width, H / fundo.height); x.drawImage(fundo, (W - fundo.width * k) / 2, (H - fundo.height * k) / 2, fundo.width * k, fundo.height * k); } else { x.fillStyle = '#2b1b5e'; x.fillRect(0, 0, W, H); }
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(20,10,50,.55)'); g.addColorStop(0.45, 'rgba(20,10,50,.25)'); g.addColorStop(1, 'rgba(20,10,50,.92)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  if (logo) { const lw = 560, lh = lw * logo.height / logo.width; x.drawImage(logo, (W - lw) / 2, 30, lw, lh); }
  // o jogador: montado (a arte já tem o piloto) ou em pé, com um brilho atrás
  const cy = 700; const brilho = x.createRadialGradient(W / 2, cy, 20, W / 2, cy, 380); const skc = o.skin && SKINS[o.skin] ? SKINS[o.skin].cor : '#ffe070';
  brilho.addColorStop(0, skc + 'aa'); brilho.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = brilho; x.beginPath(); x.arc(W / 2, cy, 380, 0, 7); x.fill();
  const skin0 = s.skin; if (o.skin) s.skin = o.skin;
  try {
    const mont = o.montaria && typeof montariaPintada === 'function' ? montariaPintada(o.montaria, 0, specDe(lookJogador())) : null;
    if (mont) { const mw = 820, mh = mw * mont.height / mont.width; x.drawImage(mont, (W - mw) / 2, cy + 230 - mh, mw, mh); }
    else {
      const look = lookJogador(true); try { preCarrega(look); } catch (e) { }
      const pc = mkCanvas(420, 560); pintaAparencia(pc, look, { inteiro: true });
      await new Promise(r => setTimeout(r, 700)); pintaAparencia(pc, look, { inteiro: true }); await new Promise(r => setTimeout(r, 300));
      const larg = retratoLargo(look); // asas/capa: o quadro do boneco é estreito e cortava as asas dos lados
      if (larg) { const k = 640 / larg.h; x.drawImage(larg.c, (W - larg.w * k) / 2 - larg.ox * k, 330 - larg.oy * k, larg.c.width * k, larg.c.height * k); }
      else x.drawImage(pc, (W - 480) / 2, 330, 480, 640); // entre o logo e o nome
    }
  } finally { s.skin = skin0; }
  // faixa de baixo: nome, nível, feito e o convite
  x.textAlign = 'center'; x.fillStyle = '#ffe14a'; x.font = '900 72px Fredoka, "Segoe UI", sans-serif'; x.strokeStyle = '#3d2410'; x.lineWidth = 10; x.lineJoin = 'round';
  x.strokeText(s.nome, W / 2, 1000); x.fillText(s.nome, W / 2, 1000);
  const fase = typeof FASES !== 'undefined' ? FASES[faseIdx(s.nivel)].nome : '';
  x.font = '800 40px Nunito, "Segoe UI", sans-serif'; x.fillStyle = '#ffffff'; x.fillText(`Nível ${s.nivel}${fase ? ' · ' + fase : ''}`, W / 2, 1055);
  if (o.feito) { x.font = '800 46px Nunito, "Segoe UI", sans-serif'; x.fillStyle = '#9dffb0'; textoQuebrado(x, '🏆 ' + o.feito, W / 2, 1130, 960, 56); }
  x.font = '800 34px Nunito, "Segoe UI", sans-serif'; x.fillStyle = '#ffe14a'; x.fillText('⚽ Jogue grátis: educacaogamer.com.br/lenda-do-campinho', W / 2, 1300);
  return c;
}
function textoDivulgar(o) {
  const s = G.save; return `${o.feito ? o.feito + ' ' : ''}Sou ${s.nome}, nível ${s.nivel} no Lenda do Campinho! ⚽ Vem jogar também, é grátis: ${DIVULGA_URL}`;
}
async function divulgar(o = {}) {
  const s = G.save; if (!s) return;
  if (!o.feito) o.feito = `Cheguei ao nível ${s.nivel}!`;
  if (o.skin === undefined) o.skin = s.skin || null;
  if (o.montaria === undefined) o.montaria = s.montado && typeof montariaAtual === 'function' && montariaAtual() && MONT_ARTE[s.montaria] ? s.montaria : null;
  abreModal(el('h2', {}, '📣 Divulgar'), el('p', {}, 'Montando o seu cartão...'));
  const c = await montaCartao(o); const txt = textoDivulgar(o);
  const blob = await new Promise(r => c.toBlob(r, 'image/png')); const url = URL.createObjectURL(blob);
  const arq = blob && typeof File === 'function' ? new File([blob], 'lenda-do-campinho.png', { type: 'image/png' }) : null;
  const pode = arq && navigator.canShare && navigator.canShare({ files: [arq] });
  const img = el('img', { src: url, alt: 'Cartão do seu jogador', style: 'width:100%;max-width:360px;border-radius:12px;display:block;margin:0 auto 10px;box-shadow:0 4px 16px rgba(0,0,0,.35)' });
  const abre = link => { try { window.open(link, '_blank', 'noopener'); } catch (e) { } };
  const copiar = async () => { try { await navigator.clipboard.writeText(txt); log('📋 Texto copiado! É só colar onde quiser.', 'l-sis'); } catch (e) { prompt('Copie o texto:', txt); } };
  abreModal(el('h2', {}, '📣 Divulgar'), img,
    el('p', { class: 'vazio' }, txt),
    el('div', { class: 'opcoes' },
      pode ? el('button', { class: 'btn amarelo', type: 'button', onclick: async () => { try { await navigator.share({ files: [arq], title: 'Lenda do Campinho', text: txt }); } catch (e) { } } }, '📤 Compartilhar') : null,
      el('a', { class: 'btn' + (pode ? '' : ' amarelo'), href: url, download: 'lenda-do-campinho.png' }, '⬇️ Baixar imagem'),
      el('button', { class: 'btn verde', type: 'button', onclick: () => abre('https://wa.me/?text=' + encodeURIComponent(txt)) }, '💬 WhatsApp'),
      el('button', { class: 'btn', type: 'button', onclick: copiar }, '📋 Copiar texto')),
    el('p', { class: 'vazio' }, 'Dica: baixe a imagem e poste junto com o texto. Não coloque seu nome verdadeiro nem onde você mora!'));
}
// convite que aparece e some sozinho (depois de uma conquista)
function oferecerDivulgar(o) {
  const antigo = document.getElementById('convDivulgar'); if (antigo) antigo.remove();
  const b = el('button', { id: 'convDivulgar', class: 'btn amarelo', type: 'button', onclick: () => { b.remove(); divulgar(o); } }, '📣 Divulgar: ' + (o.feito || 'minha conquista'));
  document.body.append(b); setTimeout(() => b.remove(), 20000);
}
// a cada 50 níveis
if (typeof subiuNivel === 'function') { const _subiuDv = subiuNivel; subiuNivel = function () { const r = _subiuDv.apply(this, arguments); try { if (G.save && G.save.nivel % 50 === 0) oferecerDivulgar({ feito: `Cheguei ao nível ${G.save.nivel}!` }); } catch (e) { } return r; }; }
// botões na Ficha e no Visual
if (typeof abreFicha === 'function') { const _abreFichaDv = abreFicha; abreFicha = function () { const r = _abreFichaDv.apply(this, arguments); const box = document.getElementById('modalConteudo'); if (box && !box.querySelector('.bt-divulgar')) box.append(el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo bt-divulgar', type: 'button', onclick: () => divulgar({}) }, '📣 Divulgar meu jogador'))); return r; }; }
if (typeof modalVisual === 'function') { const _modalVisualDv = modalVisual; modalVisual = function () { const r = _modalVisualDv.apply(this, arguments); const box = document.getElementById('modalConteudo'); const s = G.save; if (box && !box.querySelector('.bt-divulgar')) box.append(el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo bt-divulgar', type: 'button', onclick: () => divulgar({ feito: s.skin && SKINS[s.skin] ? `Olha a minha skin ${SKINS[s.skin].nome}!` : s.montaria && MONTARIAS[s.montaria] ? `Olha a minha montaria ${MONTARIAS[s.montaria].nome}!` : null, montaria: s.montaria && MONT_ARTE[s.montaria] ? s.montaria : null }) }, '📣 Divulgar meu visual'))); return r; }; }
// menu ☰ do celular
{ const grade = document.querySelector('#celMenu .cm-grade'); if (grade && !document.getElementById('cmDivulgar')) grade.append(el('button', { class: 'btn cm-bt', id: 'cmDivulgar', type: 'button', onclick: () => { if (typeof fechaMenuCel === 'function') fechaMenuCel(); divulgar({}); } }, el('span', { class: 'cm-ic' }, '📣'), 'Divulgar')); }
{ const st = document.createElement('style'); st.textContent = `#convDivulgar { position: fixed; left: 50%; top: 72px; transform: translateX(-50%); z-index: 60; box-shadow: 0 4px 14px rgba(0,0,0,.35); animation: dvPisca 1.6s ease-in-out infinite; } @keyframes dvPisca { 50% { transform: translateX(-50%) scale(1.05); } }`; document.head.append(st); }
