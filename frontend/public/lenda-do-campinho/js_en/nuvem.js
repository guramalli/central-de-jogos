/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   NUVEM: save online e casas dos outros jogadores
   Só liga DENTRO do site e com login (PORTAL, de portal.js).
   Cada um joga no seu aparelho; o servidor guarda:
   - o SAVE (comprimido): continua em outro computador ou celular;
   - a CASA publicada: aparece nas portas do mapa para os outros,
     com a vitrine dos itens mais valiosos, e dá para entrar e visitar.
   Rotas: /api/lenda/save, /api/lenda/casa, /api/lenda/casas, /api/lenda/casa/:id
   Carregar DEPOIS de portal.js.
   ============================================================ */
const NUVEM = { ativa: !!(typeof PORTAL !== 'undefined' && PORTAL.ativo && PORTAL.token), sujo: false, ultimoEnvio: 0, enviando: false, parada: false, vizinhos: {}, status: '' };

async function nuvemPede(metodo, caminho, corpo) {
  const r = await fetch(PORTAL.api + '/api/lenda' + caminho, { method: metodo, keepalive: metodo !== 'GET', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + PORTAL.token }, body: corpo ? JSON.stringify(corpo) : undefined });
  if (r.status === 401) { NUVEM.parada = true; nuvemStatus('⚠️ Log in to the site again to save online'); }
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, dados: j };
}
// gzip + base64 (o save vira ~1/5 do tamanho)
async function comprime(txt) {
  const s = new Blob([txt]).stream().pipeThrough(new CompressionStream('gzip'));
  const buf = new Uint8Array(await new Response(s).arrayBuffer());
  let bin = ''; for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
  return btoa(bin);
}
async function descomprime(b64) {
  const bin = atob(b64); const buf = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  const s = new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'));
  return await new Response(s).text();
}
function nuvemStatus(txt) { NUVEM.status = txt; const e = document.getElementById('nuvemStatus'); if (e) e.textContent = txt; }

/* ---------- save na nuvem ---------- */
async function enviaSave(forcar) {
  if (!NUVEM.ativa || NUVEM.parada || NUVEM.enviando || !G.save || !G.rodando) return;
  if (!saveDaConta()) { nuvemStatus(typeof CONTA_SEM_CONFERIR !== 'undefined' && CONTA_SEM_CONFERIR ? '☁️ Couldn\'t check your online save: this time it\'s saved only on this device' : '⚠️ This character belongs to another account: not saved online'); return; }
  if (!forcar && (!NUVEM.sujo || Date.now() - NUVEM.ultimoEnvio < 60000)) return;
  NUVEM.enviando = true;
  try {
    const dados = await comprime(JSON.stringify(G.save));
    // v407 (Raio-X A8): o site recusa save maior que 90.000 letras ("Save grande demais") — antes o jogador via só
    // "Não deu para salvar online agora" e achava que era a internet. Agora a mensagem diz o que é e o que fazer.
    const grande = () => { nuvemStatus('⚠️ Your progress got too big for the cloud: it’s still saved on THIS device. Keep a copy in 💾 Save → Export.'); if (!NUVEM.avisouGrande) { NUVEM.avisouGrande = true; try { log('☁️ Your progress got too big to save online. It’s still saved on this device — keep a copy in 💾 Save → Export.', 'l-dano'); } catch (e) { } } };
    if (dados.length > 90000) { grande(); NUVEM.enviando = false; return; }
    const r = await nuvemPede('PUT', '/save', { dados, nivel: Math.max(1, Math.min(999, G.save.nivel | 0)) });
    if (!r.ok && r.status === 400 && /grande demais/i.test((r.dados && r.dados.error) || '')) grande();
    else if (r.ok) { NUVEM.sujo = false; NUVEM.ultimoEnvio = Date.now(); if (NUVEM.pacote) NUVEM.pacote.pendente = false; nuvemStatus('☁️ Saved online'); }
    else if (r.status !== 429 && r.status !== 401) nuvemStatus('☁️ Couldn\'t save online right now');
  } catch (e) { nuvemStatus('☁️ No connection: saved on this device only'); }
  NUVEM.enviando = false;
}
// save já comprimido de reserva: ao FECHAR a página não dá tempo de comprimir,
// então manda na hora o último pacote pronto (fetch com keepalive).
async function preparaPacote() {
  if (!G.save) return;
  try { NUVEM.pacote = { dados: await comprime(JSON.stringify(G.save)), nivel: Math.max(1, Math.min(999, G.save.nivel | 0)), pendente: true }; } catch (e) { }
}
function enviaPacoteAgora() {
  const p = NUVEM.pacote; if (!p || !p.pendente || NUVEM.parada || !saveDaConta()) return;
  p.pendente = false;
  try { fetch(PORTAL.api + '/api/lenda/save', { method: 'PUT', keepalive: true, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + PORTAL.token }, body: JSON.stringify({ dados: p.dados, nivel: p.nivel }) }).catch(() => { }); } catch (e) { }
}
if (NUVEM.ativa && typeof CompressionStream === 'function') {
  const _salvarNv = salvar;
  // cada salvamento do jogo (automático a cada 20 s, ou ao trocar de mapa) sobe logo para a nuvem,
  // no máximo 1 vez a cada 20 s — não depende do fechamento da página, que não é confiável
  let enviaTimer = null;
  salvar = function () {
    const r = _salvarNv.apply(this, arguments);
    if (G.save) {
      G.save.salvoEm = Date.now(); NUVEM.sujo = true; preparaPacote();
      if (!enviaTimer) enviaTimer = setTimeout(() => { enviaTimer = null; enviaSave(true); }, Math.max(1500, 20000 - (Date.now() - NUVEM.ultimoEnvio)));
    }
    return r;
  };
  setInterval(() => enviaSave(false), 30000);
  // trocou de aba / minimizou: a página continua viva, dá tempo de salvar e mandar o mais recente
  addEventListener('visibilitychange', () => { if (document.hidden && G.rodando) { if (NUVEM.sujo) enviaPacoteAgora(); try { salvar(); } catch (e) { } } });
  // fechou / recarregou: manda o pacote que já estava pronto
  addEventListener('pagehide', () => { if (NUVEM.sujo) enviaPacoteAgora(); });
  // tela inicial: oferecer o save da nuvem
  (async function () {
    const menu = document.getElementById('inicioMenu'); if (!menu) return;
    const caixa = el('div', { class: 'nuvem-caixa' }, '☁️ Looking for your online save...'); menu.prepend(caixa);
    try {
      const r = await nuvemPede('GET', '/save');
      if (r.status === 404) { caixa.textContent = '☁️ Your progress will be saved online automatically (log in with the same account on another device).'; return; }
      if (!r.ok) { caixa.remove(); return; }
      const nuvem = JSON.parse(await descomprime(r.dados.dados));
      NUVEM.online = { save: nuvem, z: r.dados.dados, quando: new Date(r.dados.atualizadoEm).getTime() }; // protege.js
      let local = null; try { local = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch (e) { }
      const quando = new Date(r.dados.atualizadoEm).toLocaleString('en-US', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
      const igual = local && (local.salvoEm || 0) >= new Date(r.dados.atualizadoEm).getTime() - 5000;
      caixa.innerHTML = '';
      caixa.append(el('b', {}, `☁️ Online save: ${nuvem.nome} · level ${nuvem.nivel}`), el('small', {}, ` (saved ${quando})`));
      if (igual) { caixa.append(el('small', { class: 'nuvem-ok' }, ' — same as on this device ✔')); return; }
      if (local) caixa.append(el('small', { class: 'nuvem-aviso' }, ` On this device: ${local.nome} · level ${local.nivel}.`));
      caixa.append(el('button', { class: 'btn amarelo', type: 'button', onclick: async () => {
        if (local && !(await perguntaJogo(`Replace the progress on THIS device (${local.nome}, level ${local.nivel}) with the online save (${nuvem.nome}, level ${nuvem.nivel})?`, { sim: 'Replace', perigo: true }))) return;
        try { localStorage.setItem(SAVE_KEY, JSON.stringify(nuvem)); } catch (e) { }
        iniciarJogo(nuvem);
      } }, '☁️ Continue from online save'));
    } catch (e) { caixa.remove(); }
  })();
}

/* ---------- a minha casa publicada ---------- */
let publicaTimer = null;
function vitrineDaCasa(c) {
  return c.itens.slice().sort((a, b) => ((PONTOS_RAR[raridadeItem(b.id)] || 0) + (b.r || 0)) - ((PONTOS_RAR[raridadeItem(a.id)] || 0) + (a.r || 0))).slice(0, 3).map(i => ({ id: i.id, r: i.r || 0 }));
}
async function publicaCasa() {
  const c = minhaCasa(); if (!c || NUVEM.parada || !saveDaConta()) return;
  const def = CASAS[c.id];
  const r = await nuvemPede('PUT', '/casa', { casaId: c.id, mapa: def.mapa, moveis: c.moveis.map(({ x, y, id }) => ({ x, y, id })), itens: c.itens.map(({ x, y, id, r }) => ({ x, y, id, r: r || 0 })), vitrine: vitrineDaCasa(c), prestigio: Math.min(100000, prestigioCasa(c).pontos) }).catch(() => null);
  if (r && r.status === 429) { clearTimeout(publicaTimer); publicaTimer = setTimeout(publicaCasa, 6000); }
}
if (NUVEM.ativa) {
  avisaMudancaCasa = function (tipo) {
    clearTimeout(publicaTimer);
    if (tipo === 'venda') { nuvemPede('DELETE', '/casa').catch(() => { }); return; }
    publicaTimer = setTimeout(publicaCasa, 4000);
  };
  // quem já tinha casa antes da nuvem: publica uma vez ao abrir o jogo
  const _iniciarJogoNv = iniciarJogo;
  iniciarJogo = async function () { const r = await _iniciarJogoNv.apply(this, arguments); if (minhaCasa()) setTimeout(publicaCasa, 3000); return r; };
}

/* ---------- vizinhança: casas de outros jogadores nas portas ---------- */
function vizinhoDaPorta(id) { const def = CASAS[id]; const v = def && NUVEM.vizinhos[def.mapa]; return v ? v.porPorta[id] : null; }
async function carregaVizinhos(mapa) {
  const ids = CASAS_POR_MAPA[mapa]; if (!ids || !ids.length) return;
  const ja = NUVEM.vizinhos[mapa]; if (ja && Date.now() - ja.em < 120000) return;
  try {
    const r = await fetch(PORTAL.api + `/api/lenda/casas?mapa=${mapa}&limite=${ids.length}`, { headers: PORTAL.token ? { Authorization: 'Bearer ' + PORTAL.token } : {} });
    if (!r.ok) return; const lista = await r.json();
    const minha = minhaCasa(); const porPorta = {}; let i = 0;
    for (const id of ids) { if (minha && minha.id === id) continue; if (lista[i]) porPorta[id] = lista[i++]; }
    NUVEM.vizinhos[mapa] = { em: Date.now(), porPorta };
  } catch (e) { }
}
if (typeof PORTAL !== 'undefined' && PORTAL.ativo) {
  // o texto da porta vira "Casa de NICK" + vitrine com os itens mais valiosos
  const _infoPortaNv = infoPortaCasa;
  infoPortaCasa = function (id) {
    const c = minhaCasa(); const viz = vizinhoDaPorta(id);
    if ((c && c.id === id) || !viz) return _infoPortaNv(id);
    const est = [5, 15, 35, 70, 130].filter(l => viz.prestigio >= l).length;
    return { txt: `🏠 ${viz.apelido}'s House ${estrelasTxt(est)}`, cor: '#8ae8ff', desenha: (ctx, sx, sy, px) => desenhaVitrine(ctx, sx, sy - 24 * px, viz.vitrine || [], px) };
  };
  const _abreCasaPortaNv = abreCasaPorta;
  abreCasaPorta = function (id) {
    const viz = vizinhoDaPorta(id); if (!viz) return _abreCasaPortaNv(id);
    const est = [5, 15, 35, 70, 130].filter(l => viz.prestigio >= l).length;
    const vit = el('div', { class: 'nuvem-vitrine' }, ...(viz.vitrine || []).filter(v => ITENS[v.id]).map(v => { const b = el('div', { class: 'slot rar-' + raridadeItem(v.id) }, iconeClone(iconeItem(v.id))); if (typeof comTip === 'function') comTip(b, () => tipItem(v.id, v.r || 0)); return b; }));
    abreModal(el('h2', {}, `🏠 ${viz.apelido}'s House`), el('p', {}, `Prestige ${estrelasTxt(est)} · 👀 ${viz.visitas || 0} visits`), el('p', {}, 'Showcase (the most valuable items in the house):'), vit,
      el('div', { class: 'opcoes' },
        el('button', { class: 'btn amarelo', type: 'button', onclick: () => { fechaModal(); visitaCasa(viz.userId, id); } }, '👀 Visit'),
        el('button', { class: 'btn', type: 'button', onclick: () => _abreCasaPortaNv(id) }, 'Buy a house just like this for me'),
        el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'Close')));
  };
  // entrar num lugar: busca os vizinhos; entrar na própria casa: mostra as visitas recebidas
  const _entrarMapaNv = entrarMapa;
  entrarMapa = function (id, x, y, silencioso) {
    const r = _entrarMapaNv(id, x, y, silencioso);
    if (CASAS_POR_MAPA[id]) carregaVizinhos(id);
    if (NUVEM.ativa && minhaCasaAqui() && PORTAL.user && PORTAL.user.id) fetch(PORTAL.api + '/api/lenda/casa/' + encodeURIComponent(PORTAL.user.id)).then(r => r.ok ? r.json() : null).then(j => { if (j && j.visitas) log(`👀 Your house has had ${j.visitas} visit(s) from other players!`, 'l-npc'); }).catch(() => { });
    if (G.mapa && G.mapa.visita) { const v = G.mapa.visita; banner(`${v.apelido}'s House`, `Prestige ${estrelasTxt([5, 15, 35, 70, 130].filter(l => v.prestigio >= l).length)} · you're visiting`); }
    return r;
  };
  // itens da casa visitada: E mostra o que é (só olhar)
  const _interacaoPertoNv = interacaoPerto;
  interacaoPerto = function () {
    const base = _interacaoPertoNv(); const v = G.mapa && G.mapa.visita; if (!v || !G.p) return base;
    let melhor = null, md = 1.35;
    for (const it of v.itens) { if (!ITENS[it.id]) continue; const d = Math.hypot(it.x + 0.5 - G.p.x, it.y + 0.5 - G.p.y); if (d < md) { md = d; melhor = { tipo: 'visita', x: it.x + 0.5, y: it.y + 0.5, alt: 0.8, txt: 'View: ' + ITENS[it.id].nome, ref: it }; } }
    return melhor || base;
  };
  const _interagirNv = interagir;
  interagir = function () {
    const it = interacaoPerto();
    if (it && it.tipo === 'visita') { const r = it.ref; const c = iconeClone(iconeItem(r.id)); c.style.width = '64px'; c.style.height = '64px'; abreModal(el('h2', {}, nomeItem(r.id, r.r || 0)), el('div', { class: 'npc-topo' }, c, el('p', {}, `On display at ${G.mapa.visita.apelido}'s house. Rarity: ${RARIDADE[raridadeItem(r.id)].nome}.`)), el('div', { class: 'opcoes' }, el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'Close'))); return; }
    return _interagirNv();
  };
}
function desenhaVitrine(ctx, sx, sy, vitrine, px) {
  const lista = vitrine.filter(v => ITENS[v.id]).slice(0, 3); const tam = 26 * px, gap = 4 * px;
  const x0 = sx - (lista.length * tam + (lista.length - 1) * gap) / 2;
  lista.forEach((v, i) => {
    const x = x0 + i * (tam + gap), y = sy - tam - 4 * px + Math.sin(G.agora / 400 + i) * 2 * px;
    const cor = RARIDADE[raridadeItem(v.id)].cor; const k = bRgb(cor);
    ctx.save(); ctx.fillStyle = `rgba(${k[0]},${k[1]},${k[2]},0.35)`; ctx.beginPath(); ctx.arc(x + tam / 2, y + tam / 2, tam * 0.62, 0, 7); ctx.fill();
    ctx.drawImage(iconeItem(v.id), x, y, tam, tam); ctx.restore();
  });
}
// visitar: monta a casa do outro jogador (móveis e itens) só para olhar
async function visitaCasa(userId, casaId) {
  const def = CASAS[casaId]; if (!def) return;
  let dados = null;
  try { const r = await fetch(PORTAL.api + '/api/lenda/casa/' + encodeURIComponent(userId), { headers: PORTAL.token ? { Authorization: 'Bearer ' + PORTAL.token } : {} }); if (r.ok) dados = await r.json(); } catch (e) { }
  if (!dados) { log('Couldn\'t open this house right now. Try again in a moment.', 'l-sis'); return; }
  const id = 'visita_' + casaId;
  MAPAS_DEF[id] = () => {
    const b = interior(id, `🏠 ${dados.apelido}'s House`, def.iw, def.ih, CH.MADEIRA, def.tema || 'casa', def.mapa);
    const volta = b.m.saidas.find(s => s.volta); volta.tx = def.porta.x; volta.ty = def.porta.y + 1;
    for (const mv of (dados.moveis || [])) { const it = ITENS[mv.id]; if (it && it.obj && mv.x > 0 && mv.y > 1 && mv.x < def.iw - 1 && mv.y < def.ih - 1) b.m.obj[mv.y * b.m.w + mv.x] = { t: it.obj, v: 1 }; }
    b.m.visita = { apelido: dados.apelido, prestigio: dados.prestigio || 0, itens: (dados.itens || []).filter(i => ITENS[i.id]) };
    return b.m;
  };
  delete MAPAS[id]; const m = getMapa(id);
  trocaMapa(id, m.inicio.x + 0.5, m.inicio.y + 0.5);
}

(function () {
  if (!(typeof PORTAL !== 'undefined' && PORTAL.ativo)) return;
  const info = document.querySelector('#topo .topo-info');
  if (info && NUVEM.ativa && !document.getElementById('nuvemStatus')) info.append(el('span', { class: 'tag', id: 'nuvemStatus', title: 'Your progress is saved online in your Educação Gamer account' }, '☁️ Online'));
  const st = document.createElement('style');
  st.textContent = `
  .nuvem-caixa { background: #eaf4ff; border: 2px solid #7ab8ff; border-radius: 10px; padding: 8px 10px; font-size: 13px; color: #1a3a6a; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; justify-content: center; }
  .nuvem-caixa .btn { margin-top: 4px; }
  .nuvem-ok { color: #1a6a2a; font-weight: 800; }
  .nuvem-aviso { color: #8a4a1a; font-weight: 700; }
  .nuvem-vitrine { display: flex; gap: 8px; justify-content: center; margin: 4px 0 8px; }
  .nuvem-vitrine .slot { width: 58px; }
  `;
  document.head.append(st);
})();
