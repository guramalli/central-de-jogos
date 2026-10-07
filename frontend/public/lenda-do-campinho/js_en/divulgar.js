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
    const semAsas = Object.assign({}, look, { costas: null }); delete semAsas._kb; // v296: sem a chave da aparência COM asas (o cache devolvia o boneco errado)
    const corpo = spriteBoneco(semAsas, 'frente', 0); if (!corpo || !corpo.c) return null;
    // o mesmo recorte de cima que o spriteBoneco faz
    const topo = Math.max(0, Math.min(...(META_BONECOS[nome] || []).filter(Boolean).map(m => m.cabeca ? m.cabeca[1] : 20)) - ({ coroa: 40, cartola: 50, espartano: 48, louros: 22 }[sp.chapeu] || (sp.chapeu ? 26 : 4)));
    const PX = 150, PY = 60, c = mkCanvas(FOLHA_CW + PX * 2, FOLHA_CH + PY), x = c.getContext('2d');
    x.translate(PX, PY); comAcessorios(x, sp, 'f', meta, 'tras'); x.drawImage(corpo.c, 10, topo);
    return { c, ox: PX + 10, oy: PY + topo, w: corpo.c.width, h: corpo.c.height };
  } catch (e) { return null; }
}
// v359 (dono: "crie mais opções para essas telas de compartilhamento"): formato, fundo, estilo, conquista e números
const DV_FORMATOS = { // posições de cada parte do cartão
  retrato: { nome: '📱 Post', W: 1080, H: 1350, logoW: 560, logoY: 30, corpoY: 330, corpoH: 640, nomeY: 1000, nivelY: 1055, feitoY: 1130, numY: 1180, rodY: 1300 },
  story: { nome: '📲 Story', W: 1080, H: 1920, logoW: 700, logoY: 110, corpoY: 520, corpoH: 820, nomeY: 1440, nivelY: 1505, feitoY: 1590, numY: 1650, rodY: 1850 },
  quadrado: { nome: '⬛ Square', W: 1080, H: 1080, logoW: 380, logoY: 20, corpoY: 262, corpoH: 480, nomeY: 800, nivelY: 848, feitoY: 905, numY: 928, rodY: 1036 },
};
const DV_FUNDOS = [ // [id, nome, arte, nível mínimo]
  ['campinho', '🌅 Home Pitch', 'titulo', 1], ['estadio', '🏟️ Stadium', 'cap_clube_estadio_3', 1], ['festa', '🎆 Party Night', 'cap_clube_estadio_4', 20],
  ['praia', '🌙 Beach at Night', 'cap_gloria_4', 50], ['atlantida', '🌊 Atlantis', 'cap_atl_1', 195], ['espaco', '🚀 Space', 'cap_esp_2', 250], ['multiverso', '🌀 Multiverse', 'cap_mv_1', 400],
];
const DV_ESTILOS = { // [nome, cor do véu (r,g,b), cor do nome, borda]
  classico: ['💜 Classic', '20,10,50', '#ffe14a', null],
  ouro: ['🥇 Gold', '50,30,0', '#ffe680', ['#8a5a10', '#ffe680', '#d8a020', '#fff3b0', '#8a5a10']],
  noite: ['🌌 Night', '5,15,45', '#9fe6ff', ['#1a5ad0', '#4ad0ff', '#1a5ad0']],
  campo: ['🌿 Pitch', '5,40,15', '#b8ff7a', ['#1a7a2a', '#7ad04a', '#1a7a2a']],
  arcoiris: ['🌈 Rainbow', '30,10,50', '#ffffff', ['#ff4a4a', '#ffa63a', '#ffe14a', '#5ad85a', '#4aa6ff', '#9a5aff']],
};
function dvCfg() {
  const s = G.save; const c = s.divulgaCfg = (s.divulgaCfg && typeof s.divulgaCfg === 'object') ? s.divulgaCfg : {};
  if (!DV_FORMATOS[c.formato]) c.formato = 'retrato'; if (!DV_ESTILOS[c.estilo]) c.estilo = 'classico';
  if (!DV_FUNDOS.some(f => f[0] === c.fundo && (s.nivel || 1) >= f[3])) c.fundo = 'campinho'; if (c.numeros === undefined) c.numeros = true;
  return c;
}
// as conquistas que dá para mostrar no cartão (só números do jogo, nada pessoal)
function dvFeitos(o) {
  const s = G.save, L = [], add = t => { if (t && !L.includes(t)) L.push(t); };
  add(o.feitoOriginal); add(`I reached level ${s.nivel}!`);
  try { const t = s.torre && s.torre.max; if (t > 0) add(`I climbed to floor ${t} of the Infinite Tower!`); } catch (e) { }
  try { if (s.st && s.st.chefes > 0) add(`I’ve already beaten ${s.st.chefes} bosses!`); } catch (e) { }
  try { const n = typeof ARENAS !== 'undefined' ? ARENAS.filter(a => regArena(a.id).vitorias > 0).length : 0; if (n) add(`I beat ${n} arena bosses!`); } catch (e) { }
  try { const n = Object.keys(s.figs || {}).length; if (n >= 10) add(`I already have ${n} stickers in my album!`); } catch (e) { }
  try { const n = s.agencia && s.agencia.lendas ? s.agencia.lendas.length : 0; if (n) add(`I developed ${n} ${n > 1 ? 'Legends' : 'Legend'} at my Agency!`); } catch (e) { }
  try { if (s.skin && SKINS[s.skin]) add(`Check out my ${SKINS[s.skin].nome} skin!`); } catch (e) { }
  try { if (s.montaria && MONTARIAS[s.montaria]) add(`Check out my ${MONTARIAS[s.montaria].nome} mount!`); } catch (e) { }
  try { const m = window.ADORNOS2 && ADORNOS2.atual('mascote'), op = m && ADORNOS2.OPCOES.mascote.find(x => x[0] === m); if (op) add(`This is my pet: ${op[1]}!`); } catch (e) { }
  add('Come play with me!');
  return L;
}
function dvNumeros() {
  const s = G.save, L = [['⭐', s.nivel, 'level']];
  try { if (s.st && s.st.chefes) L.push(['👑', s.st.chefes, 'bosses']); } catch (e) { }
  try { if (s.torre && s.torre.max) L.push(['🗼', s.torre.max, 'Tower floor']); } catch (e) { }
  try { if (s.st && s.st.gols) L.push(['⚽', s.st.gols, 'gols']); } catch (e) { }
  try { const n = Object.keys(s.figs || {}).length; if (n) L.push(['🃏', n, 'figurinhas']); } catch (e) { }
  return L.slice(0, 4);
}
const dvFmt = n => Number(n || 0).toLocaleString('en-US');
// o boneco (demora um pouco para carregar as peças): fica guardado enquanto a janela estiver aberta
async function dvRetrato(o) {
  if (o._ret) return o._ret;
  const s = G.save, skin0 = s.skin; if (o.skin) s.skin = o.skin;
  try {
    const mont = o.montaria && typeof montariaPintada === 'function' ? montariaPintada(o.montaria, 0, specDe(lookJogador())) : null;
    if (mont) return (o._ret = { mont });
    const look = lookJogador(true); try { preCarrega(look); } catch (e) { }
    const pc = mkCanvas(420, 560); pintaAparencia(pc, look, { inteiro: true });
    await new Promise(r => setTimeout(r, 700)); pintaAparencia(pc, look, { inteiro: true }); await new Promise(r => setTimeout(r, 300));
    return (o._ret = { pc, larg: retratoLargo(look) }); // asas/capa: o quadro do boneco é estreito e cortava as asas dos lados
  } finally { s.skin = skin0; }
}
async function montaCartao(o = {}) {
  const s = G.save, cfg = o.cfg || dvCfg(), F = DV_FORMATOS[cfg.formato] || DV_FORMATOS.retrato, { W, H } = F, k = F.corpoH / 640, quad = F === DV_FORMATOS.quadrado;
  const est = DV_ESTILOS[cfg.estilo] || DV_ESTILOS.classico, fdef = DV_FUNDOS.find(f => f[0] === cfg.fundo) || DV_FUNDOS[0];
  const c = mkCanvas(W, H), x = c.getContext('2d');
  const fundo = await carregaImg(ASSET_DIR + fdef[2] + '.webp'), logo = await carregaImg(ASSET_DIR + 'logo_jogo.webp');
  if (fundo) { const kf = Math.max(W / fundo.width, H / fundo.height); x.drawImage(fundo, (W - fundo.width * kf) / 2, (H - fundo.height * kf) / 2, fundo.width * kf, fundo.height * kf); } else { x.fillStyle = '#2b1b5e'; x.fillRect(0, 0, W, H); }
  const v = est[1], g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, `rgba(${v},.55)`); g.addColorStop(0.45, `rgba(${v},.3)`); g.addColorStop(1, `rgba(${v},.92)`); x.fillStyle = g; x.fillRect(0, 0, W, H);
  if (logo) { const lw = F.logoW, lh = lw * logo.height / logo.width; x.drawImage(logo, (W - lw) / 2, F.logoY, lw, lh); }
  // o jogador: montado (a arte já tem o piloto) ou em pé, com um brilho atrás
  const cy = F.corpoY + F.corpoH * 0.58, rb = 380 * k, brilho = x.createRadialGradient(W / 2, cy, 20, W / 2, cy, rb), skc = o.skin && SKINS[o.skin] ? SKINS[o.skin].cor : '#ffe070';
  brilho.addColorStop(0, skc + 'aa'); brilho.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = brilho; x.beginPath(); x.arc(W / 2, cy, rb, 0, 7); x.fill();
  const r = await dvRetrato(o);
  if (r.mont) { const mw = 820 * k, mh = mw * r.mont.height / r.mont.width; x.drawImage(r.mont, (W - mw) / 2, F.corpoY + F.corpoH * 0.94 - mh, mw, mh); }
  else if (r.larg) { const kk = F.corpoH / r.larg.h; x.drawImage(r.larg.c, (W - r.larg.w * kk) / 2 - r.larg.ox * kk, F.corpoY - r.larg.oy * kk, r.larg.c.width * kk, r.larg.c.height * kk); }
  else x.drawImage(r.pc, (W - 480 * k) / 2, F.corpoY, 480 * k, F.corpoH);
  // o mascote (adornos) do lado
  try {
    const m = !r.mont && window.ADORNOS2 && ADORNOS2.atual('mascote'), voa = m === 'arara' || m === 'dragao';
    const pn = m && (ADORNOS2.petNome ? ADORNOS2.petNome(m) : `pet_${m}`), im = m && (aSprite(`${pn}_c1`) || await carregaImg(ASSET_DIR + `${pn}_c1.webp`)); // a arte pode ainda não ter carregado
    if (im) { const ph = F.corpoH * (voa ? 0.3 : 0.26), pw = ph * im.width / im.height; x.drawImage(im, W / 2 + F.corpoH * 0.3, F.corpoY + F.corpoH * (voa ? 0.6 : 0.97) - ph, pw, ph); }
  } catch (e) { }
  // nome, nível, conquista, números e o convite
  x.textAlign = 'center'; x.lineJoin = 'round';
  x.fillStyle = est[2]; x.font = `900 ${quad ? 64 : 72}px Fredoka, "Segoe UI", sans-serif`; x.strokeStyle = '#3d2410'; x.lineWidth = 10;
  x.strokeText(s.nome, W / 2, F.nomeY); x.fillText(s.nome, W / 2, F.nomeY);
  const fase = typeof FASES !== 'undefined' ? FASES[faseIdx(s.nivel)].nome : '';
  x.font = '800 40px Nunito, "Segoe UI", sans-serif'; x.fillStyle = '#ffffff'; x.fillText(`Level ${s.nivel}${fase ? ' · ' + fase : ''}`, W / 2, F.nivelY);
  if (o.feito) {
    x.fillStyle = '#9dffb0'; const t = '🏆 ' + o.feito;
    if (cfg.numeros) { let f = 46; do { x.font = `800 ${f}px Nunito, "Segoe UI", sans-serif`; f -= 2; } while (x.measureText(t).width > W - 80 && f > 26); x.fillText(t, W / 2, F.feitoY); }
    else { x.font = '800 46px Nunito, "Segoe UI", sans-serif'; textoQuebrado(x, t, W / 2, F.feitoY, W - 120, 56); }
  }
  if (cfg.numeros) {
    const nums = dvNumeros(), bw = Math.min(240, (W - 80) / nums.length - 16), bh = quad ? 60 : 80, y0 = F.numY;
    nums.forEach(([ic, n, rot], i) => {
      const bx = W / 2 - (nums.length * (bw + 16) - 16) / 2 + i * (bw + 16);
      x.fillStyle = 'rgba(0,0,0,.45)'; x.beginPath(); x.roundRect(bx, y0, bw, bh, 16); x.fill(); x.strokeStyle = est[2]; x.lineWidth = 3; x.stroke();
      x.fillStyle = '#ffffff'; x.font = `900 ${quad ? 28 : 34}px Nunito, "Segoe UI", sans-serif`; x.fillText(`${ic} ${dvFmt(n)}`, bx + bw / 2, y0 + bh * 0.48);
      x.fillStyle = '#d8d0ff'; x.font = `700 ${quad ? 18 : 22}px Nunito, "Segoe UI", sans-serif`; x.fillText(rot, bx + bw / 2, y0 + bh * 0.84);
    });
  }
  x.font = `800 ${quad ? 30 : 34}px Nunito, "Segoe UI", sans-serif`; x.fillStyle = est[2]; x.fillText('⚽ Play free: educacaogamer.com.br/lenda-do-campinho', W / 2, F.rodY);
  // moldura do estilo
  if (est[3]) {
    const gb = x.createLinearGradient(0, 0, W, H); est[3].forEach((cor, i) => gb.addColorStop(i / (est[3].length - 1), cor));
    x.strokeStyle = gb; x.lineWidth = 22; x.beginPath(); x.roundRect(11, 11, W - 22, H - 22, 36); x.stroke();
    x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = 3; x.beginPath(); x.roundRect(24, 24, W - 48, H - 48, 26); x.stroke();
  }
  return c;
}
function textoDivulgar(o) {
  const s = G.save; return `${o.feito ? o.feito + ' ' : ''}I'm ${s.nome}, level ${s.nivel} in Lenda do Campinho! ⚽ Come play too, it's free: ${DIVULGA_URL}`;
}
async function divulgar(o = {}) {
  const s = G.save; if (!s) return;
  if (o.feitoOriginal === undefined) o.feitoOriginal = o.feito || null;
  if (!o.feito) o.feito = `I reached level ${s.nivel}!`;
  if (o.skin === undefined) o.skin = s.skin || null;
  if (o.montaria === undefined) o.montaria = s.montado && typeof montariaAtual === 'function' && montariaAtual() && MONT_ARTE[s.montaria] ? s.montaria : null;
  const cfg = dvCfg(); let url = null, arq = null, vez = 0;
  abreModal(el('h2', {}, '📣 Share'), el('p', {}, 'Making your card...'));
  const img = el('img', { alt: 'Your player card', class: 'dv-img' }), txtEl = el('p', { class: 'vazio' }), status = el('span', { class: 'dv-status' });
  const abre = link => { try { window.open(link, '_blank', 'noopener'); } catch (e) { } };
  const baixar = el('a', { class: 'btn', href: '#', download: 'lenda-do-campinho.png' }, '⬇️ Download image');
  async function refaz() {
    const minha = ++vez; status.textContent = '⏳'; img.style.opacity = '0.5';
    const c = await montaCartao(o); if (minha !== vez) return;
    const blob = await new Promise(r => c.toBlob(r, 'image/png')); if (minha !== vez) return;
    if (url) URL.revokeObjectURL(url); url = URL.createObjectURL(blob);
    arq = blob && typeof File === 'function' ? new File([blob], 'lenda-do-campinho.png', { type: 'image/png' }) : null;
    img.src = url; img.style.opacity = '1'; img.className = 'dv-img dv-' + cfg.formato; baixar.href = url; status.textContent = ''; txtEl.textContent = textoDivulgar(o);
    try { salvar(); } catch (e) { }
  }
  const chips = (rotulo, itens, atual, muda) => el('div', { class: 'dv-linha' }, el('b', {}, rotulo),
    ...itens.map(([id, nome, trava]) => el('button', {
      type: 'button', class: 'dv-chip' + (id === atual() ? ' on' : ''), disabled: !!trava, title: trava || '',
      onclick: ev => { if (id === atual()) return; muda(id); ev.currentTarget.parentNode.querySelectorAll('.dv-chip').forEach(b => b.classList.toggle('on', b === ev.currentTarget)); refaz(); }
    }, trava ? '🔒 ' + nome.replace(/^\S+\s/, '') : nome)));
  const feitos = dvFeitos(o), selFeito = el('select', { class: 'dv-sel', onchange: () => { o.feito = selFeito.value; refaz(); } }, ...feitos.map(f => el('option', { value: f }, f)));
  if (!feitos.includes(o.feito)) selFeito.prepend(el('option', { value: o.feito }, o.feito));
  selFeito.value = o.feito;
  const numBt = el('label', { class: 'dv-num' }, el('input', { type: 'checkbox', checked: cfg.numeros ? 'checked' : null, onchange: ev => { cfg.numeros = ev.target.checked; refaz(); } }), ' Show my stats (level, bosses, Tower...)');
  const podeCopiarImg = typeof ClipboardItem === 'function' && navigator.clipboard && navigator.clipboard.write;
  const pode = () => arq && navigator.canShare && navigator.canShare({ files: [arq] });
  abreModal.largo = true;
  abreModal(el('h2', {}, '📣 Share'),
    el('div', { class: 'dv-caixa' },
      el('div', { class: 'dv-prev' }, img, status),
      el('div', { class: 'dv-ops' },
        chips('Format', Object.entries(DV_FORMATOS).map(([id, f]) => [id, f.nome]), () => cfg.formato, id => { cfg.formato = id; }),
        chips('Background', DV_FUNDOS.map(([id, nome, , nv]) => [id, nome, (s.nivel || 1) < nv ? `Unlocks at level ${nv}` : null]), () => cfg.fundo, id => { cfg.fundo = id; }),
        chips('Style', Object.entries(DV_ESTILOS).map(([id, e]) => [id, e[0]]), () => cfg.estilo, id => { cfg.estilo = id; }),
        el('div', { class: 'dv-linha' }, el('b', {}, 'Achievement'), selFeito), numBt)),
    txtEl,
    el('div', { class: 'opcoes' },
      el('button', { class: 'btn amarelo', type: 'button', onclick: async () => { if (pode()) { try { await navigator.share({ files: [arq], title: 'Lenda do Campinho', text: textoDivulgar(o) }); } catch (e) { } } else baixar.click(); } }, '📤 Share'),
      baixar,
      podeCopiarImg ? el('button', { class: 'btn', type: 'button', onclick: async () => { try { const b = await (await fetch(url)).blob(); await navigator.clipboard.write([new ClipboardItem({ 'image/png': b })]); log('🖼️ Image copied! Just paste it into the chat.', 'l-sis'); } catch (e) { log('Couldn’t copy the image here: use ⬇️ Download image.', 'l-sis'); } } }, '🖼️ Copy image') : null,
      el('button', { class: 'btn verde dv-whats', type: 'button', onclick: () => abre('https://wa.me/?text=' + encodeURIComponent(textoDivulgar(o))) }, '💬 WhatsApp'),
      el('button', { class: 'btn', type: 'button', onclick: async () => { const t = textoDivulgar(o); try { await navigator.clipboard.writeText(t); log('📋 Text copied! Just paste it wherever you want.', 'l-sis'); } catch (e) { textoParaCopiar(t); } } }, '📋 Copy text')),
    el('p', { class: 'vazio' }, 'Tip: Story is for statuses and stories; Post and Square are for the feed. Don’t include your real name or where you live!'));
  await refaz();
}
// convite que aparece e some sozinho (depois de uma conquista)
function oferecerDivulgar(o) {
  const antigo = document.getElementById('convDivulgar'); if (antigo) antigo.remove();
  const b = el('button', { id: 'convDivulgar', class: 'btn amarelo', type: 'button', onclick: () => { b.remove(); divulgar(o); } }, '📣 Share: ' + (o.feito || 'minha conquista'));
  document.body.append(b); setTimeout(() => b.remove(), 20000);
}
// a cada 50 níveis
if (typeof subiuNivel === 'function') { const _subiuDv = subiuNivel; subiuNivel = function () { const r = _subiuDv.apply(this, arguments); try { if (G.save && G.save.nivel % 50 === 0) oferecerDivulgar({ feito: `I reached level ${G.save.nivel}!` }); } catch (e) { } return r; }; }
// botões na Ficha e no Visual
if (typeof abreFicha === 'function') { const _abreFichaDv = abreFicha; abreFicha = function () { const r = _abreFichaDv.apply(this, arguments); const box = document.getElementById('modalConteudo'); if (box && !box.querySelector('.bt-divulgar')) box.append(el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo bt-divulgar', type: 'button', onclick: () => divulgar({}) }, '📣 Share my player'))); return r; }; }
if (typeof modalVisual === 'function') { const _modalVisualDv = modalVisual; modalVisual = function () { const r = _modalVisualDv.apply(this, arguments); const box = document.getElementById('modalConteudo'); const s = G.save; if (box && !box.querySelector('.bt-divulgar')) box.append(el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo bt-divulgar', type: 'button', onclick: () => divulgar({ feito: s.skin && SKINS[s.skin] ? `Check out my ${SKINS[s.skin].nome} skin!` : s.montaria && MONTARIAS[s.montaria] ? `Check out my ${MONTARIAS[s.montaria].nome} mount!` : null, montaria: s.montaria && MONT_ARTE[s.montaria] ? s.montaria : null }) }, '📣 Share my look'))); return r; }; }
// menu ☰ do celular
{ const grade = document.querySelector('#celMenu .cm-grade'); if (grade && !document.getElementById('cmDivulgar')) grade.append(el('button', { class: 'btn cm-bt', id: 'cmDivulgar', type: 'button', onclick: () => { if (typeof fechaMenuCel === 'function') fechaMenuCel(); divulgar({}); } }, el('span', { class: 'cm-ic' }, '📣'), 'Share')); }
{ const st = document.createElement('style'); st.textContent = `#convDivulgar { position: fixed; left: 50%; top: 72px; transform: translateX(-50%); z-index: 60; box-shadow: 0 4px 14px rgba(0,0,0,.35); animation: dvPisca 1.6s ease-in-out infinite; } @keyframes dvPisca { 50% { transform: translateX(-50%) scale(1.05); } } .dv-caixa { display: flex; gap: 14px; align-items: flex-start; flex-wrap: wrap; justify-content: center; margin-bottom: 6px; } .dv-prev { position: relative; flex: 0 0 auto; } .dv-img { width: 300px; max-width: 80vw; border-radius: 12px; display: block; box-shadow: 0 4px 16px rgba(0,0,0,.35); transition: opacity .2s; } .dv-img.dv-story { width: 230px; } .dv-status { position: absolute; top: 8px; right: 10px; font-size: 22px; } .dv-ops { flex: 1 1 280px; display: flex; flex-direction: column; gap: 10px; min-width: 240px; text-align: left; } .dv-linha { display: flex; flex-wrap: wrap; gap: 5px; align-items: center; } .dv-linha > b { width: 100%; font-size: 13px; opacity: .8; } .dv-chip { border: 2px solid #c9a46a; background: #fff8e8; border-radius: 999px; padding: 4px 10px; font: 700 13px Nunito, sans-serif; cursor: pointer; color: #4a2e10; } .dv-chip.on { background: #ffd23a; border-color: #b8860b; } .dv-chip:disabled { opacity: .5; cursor: default; } .dv-sel { width: 100%; padding: 6px; border-radius: 8px; border: 2px solid #c9a46a; font: 700 14px Nunito, sans-serif; background: #fff8e8; color: #4a2e10; } .dv-num { font-size: 13px; font-weight: 700; cursor: pointer; }`; document.head.append(st); }
