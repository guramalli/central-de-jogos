/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🛡️ ONLINE SEGURO (v407 — Raio-X U1, U5, U6, I8; dono: "faça tudo menos I1")
   Para as crianças conviverem com segurança no mundo compartilhado:
   - U1 NOME DO TIME DE LISTAS: o nome que aparece no ranking e na ficha do site é montado de DUAS LISTAS (prefixo + lugar),
     como as guildas. As listas são as MESMAS do servidor (backend src/lenda/times.js): só acrescente nomes no FIM.
     Quem já tinha time com nome digitado escolhe um da lista (o jogo oferece ao abrir o time); até escolher, o site mostra "Time".
   - U5 CONVITES SÓ DE AMIGOS (ligado por padrão): convite de caça em grupo só chega de amigos e colegas de guilda
     (guilda e torcida já eram só de amigos). Dá para liberar em ⚙️ › 🌐 Online.
   - U5 FICAR INVISÍVEL no mundo: você continua vendo os outros, mas ninguém vê você nem os seus emotes.
   - U5 🚩 DENUNCIAR (botão direito no jogador, ou no painel 💬): motivos PRONTOS (sem texto livre); manda o ID do jogador
     para a equipe do site (vira um aviso no painel do admin e um e-mail).
   - U6 APAGAR MEUS DADOS DO JOGO (⚙️ › 💾 Conta): apaga do servidor o save online, ranking, casa, guilda, feira e torcidas.
     O personagem deste aparelho continua.
   - I8 👥 JOGANDO AGORA: no painel 💬 (tecla Y) aparece quem está nas cidades de TODOS os lugares, com "🧭 Como chegar".
   Servidor: "lenda-prefs" e "mundo-quem" (socketMundo.js), POST /api/lenda/denunciar, DELETE /api/lenda/meus-dados.
   Prefixo osg*. Carregar DEPOIS de menu_jogador.js (usa mundo_online.js, menu_jogador.js e, na hora do clique, como_chegar.js).
   ============================================================ */

/* ---------- U1: nome do time escolhido em listas ---------- */
const OSG_TIME_PREF = ['Esporte Clube', 'Grêmio', 'Atlético', 'Unidos do', 'Sociedade Esportiva', 'Real', 'Independente', 'Juventude do', 'Estrela do', 'Operário', 'Ferroviário', 'Associação', 'Clube Atlético', 'União do'];
const OSG_TIME_LUGAR = ['Campinho', 'Poeirão', 'Morro Alto', 'Ladeira', 'Pombal', 'Coqueiral', 'Areia Branca', 'Serra Azul', 'Rio Seco', 'Pedra Lisa', 'Lagoa Verde', 'Cajueiro', 'Mangueiral', 'Ventania', 'Trovão', 'Beira-Mar', 'Vale Verde', 'Alto da Colina', 'Barro Vermelho', 'Pau-Brasil', 'Sol Nascente', 'Quebra-Canela', 'Boa Vista', 'Porto Alegre do Norte', 'Ribeirão Fundo', 'Chapadão', 'Maracujá', 'Bananal', 'Jatobá', 'Ipê Amarelo', 'Buriti', 'Cachoeirinha', 'Pedra Branca', 'Vila Nova', 'Canoas', 'Monte Verde', 'Três Coqueiros', 'Carnaubal', 'Sertãozinho', 'Mangue Seco', 'Arraial', 'Ponte Velha', 'Siriema', 'Tucano', 'Jabuticabal', 'Morro do Sabiá', 'Lajedo', 'Aroeira'];
function osgNomeTime(partes) {
  const m = /^(\d{1,3})\.(\d{1,3})$/.exec(String(partes || '')); if (!m) return null;
  const p = OSG_TIME_PREF[+m[1]], l = OSG_TIME_LUGAR[+m[2]];
  return p && l ? `${p} ${l}` : null;
}
// o seletor (duas listas + como fica): { el, nome(), partes() }
function osgSeletorTime(partesIni) {
  const m = /^(\d{1,3})\.(\d{1,3})$/.exec(String(partesIni || '')) || [null, '0', String(Math.floor(Math.random() * OSG_TIME_LUGAR.length))];
  const sel = (lista, ini) => { const s = el('select', { class: 'osg-sel' }, ...lista.map((n, i) => el('option', { value: String(i) }, n))); s.value = String(Math.min(lista.length - 1, +ini || 0)); s.addEventListener('keydown', e => e.stopPropagation()); return s; };
  const a = sel(OSG_TIME_PREF, m[1]), b = sel(OSG_TIME_LUGAR, m[2]);
  const partes = () => `${a.value}.${b.value}`, nome = () => osgNomeTime(partes());
  const ver = el('b', { class: 'osg-nome-time' }, nome());
  a.onchange = b.onchange = () => { ver.textContent = nome(); };
  return { el: el('span', { class: 'osg-seletor' }, a, b, el('small', {}, 'Vai ficar assim: '), ver), nome, partes };
}
// time antigo (nome digitado): escolher um nome das listas para aparecer no site
function osgModalNomeTime() {
  const t = G.save && G.save.time; if (!t) return;
  const sel = osgSeletorTime(t.partes);
  abreModal(el('h2', {}, '⚽ Nome do seu time'),
    el('p', {}, 'No ranking e na sua ficha do site, o nome do time é escolhido nestas listas (assim ninguém vê palavras feias). Escolha o seu:'),
    sel.el,
    el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', type: 'button', onclick: () => { t.partes = sel.partes(); t.nome = sel.nome(); salvar(); fechaModal(); log(`⚽ Seu time agora se chama ${t.nome}!`, 'l-xp'); if (typeof abrirTime === 'function') abrirTime(); } }, 'Usar este nome'),
      el('button', { class: 'btn', type: 'button', onclick: () => { fechaModal(); if (typeof abrirTime === 'function') abrirTime(); } }, 'Agora não')));
}
if (typeof abrirTime === 'function') {
  const _abrirTimeOsg = abrirTime; let perguntou = false;
  abrirTime = function () {
    const r = _abrirTimeOsg.apply(this, arguments);
    try {
      const t = G.save && G.save.time;
      if (t && !t.partes && !perguntou && osgOnline()) { perguntou = true; setTimeout(() => perguntaJogo('Seu time precisa de um nome das listas para aparecer no ranking e na ficha do site. Escolher agora?', { sim: 'Escolher', nao: 'Depois' }).then(ok => { if (ok) osgModalNomeTime(); }), 300); }
    } catch (e) { }
    return r;
  };
}

/* ---------- U5: preferências (convites e invisível) ---------- */
const osgOnline = () => typeof PORTAL !== 'undefined' && PORTAL.ativo && !!PORTAL.token && !window.LENDA_STEAM;
const OSG_PREFS_KEY = 'rac_online_prefs';
let OSG_PREFS = Object.assign({ convitesTodos: false, invisivel: false }, (() => { try { return JSON.parse(localStorage.getItem(OSG_PREFS_KEY) || '{}') || {}; } catch (e) { return {}; } })());
const osgInvisivel = () => !!OSG_PREFS.invisivel;
function osgMandaPrefs() { const s = window.LENDA_SOCK; if (s && s.connected) s.emit('lenda-prefs', { convitesTodos: !!OSG_PREFS.convitesTodos, invisivel: !!OSG_PREFS.invisivel }, () => { }); }
function osgMudaPref(k, v) {
  OSG_PREFS[k] = !!v; try { localStorage.setItem(OSG_PREFS_KEY, JSON.stringify(OSG_PREFS)); } catch (e) { }
  osgMandaPrefs();
  if (k === 'invisivel') log(v ? '🙈 Você está invisível no mundo: vê os outros, mas ninguém vê você.' : '👀 Você voltou a aparecer para os outros jogadores.', 'l-sis');
}
// a conexão compartilhada (torre_coop.js, lendaSock) manda as preferências sempre que (re)conecta
// e, com a conexão aberta (ex.: entrou numa cidade), a caça em grupo e a Torre já escutam nela — o convite de um amigo
// chega mesmo sem ter aberto a janela do grupo antes
setInterval(() => {
  const s = window.LENDA_SOCK; if (!s || s._osg) return; s._osg = true;
  s.on('connect', osgMandaPrefs); if (s.connected) osgMandaPrefs();
  try { if (typeof CG !== 'undefined' && !CG.sock && typeof cgEscuta === 'function' && s._api === (typeof cgApi === 'function' ? cgApi() : '')) { CG.sock = s; cgEscuta(s); } } catch (e) { }
  try { if (typeof CO !== 'undefined' && !CO.sock && typeof coEscuta === 'function' && s._api === PORTAL.api) { CO.sock = s; coEscuta(s); } } catch (e) { }
}, 1000);

/* ---------- U5: 🚩 denunciar (motivos prontos) ---------- */
const OSG_MOTIVOS = ['Nome ou apelido feio', 'Está me incomodando ou me seguindo', 'Pediu dados pessoais (telefone, endereço, foto, rede social)', 'Está trapaceando', 'Outro problema']; // (mesma ordem do servidor: lenda/limites.js)
function osgDenuncia(alvo) {
  if (!osgOnline() || !alvo || !alvo.id) return avisoJogo('🚩 Para avisar a equipe, entre na sua conta do site.');
  abreModal(el('h2', {}, `🚩 Denunciar ${alvo.apelido || 'jogador'}`),
    el('p', {}, 'A equipe do Educação Gamer vai olhar. Escolha o que aconteceu:'),
    el('div', { class: 'osg-motivos' }, ...OSG_MOTIVOS.map((m, i) => el('button', { class: 'btn', type: 'button', onclick: () => osgMandaDenuncia(alvo, i) }, m))),
    el('p', { class: 'dica' }, '💡 Se alguém pedir seus dados ou deixar você com medo, conte para um adulto. Você também pode 🔇 silenciar a pessoa (só você deixa de ver).'));
}
async function osgMandaDenuncia(alvo, i) {
  const cab = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + PORTAL.token };
  let r = null;
  try {
    r = await fetch(PORTAL.api + '/api/lenda/denunciar', { method: 'POST', headers: cab, body: JSON.stringify({ alvoId: alvo.id, motivo: i, onde: G.mapa && G.mapa.id }) });
    if (r.status === 404 && !(await r.clone().json().catch(() => ({}))).error) // servidor antigo (sem a rota): vai como feedback
      r = await fetch(PORTAL.api + '/api/feedback', { method: 'POST', headers: cab, body: JSON.stringify({ type: 'outro', message: `🚩 DENÚNCIA no Lenda do Campinho\nJogador denunciado: ${alvo.apelido || '?'} (id ${alvo.id})\nMotivo: ${OSG_MOTIVOS[i]}` }) });
  } catch (e) { r = null; }
  fechaModal();
  if (r && r.ok) return avisoJogo('🚩 Obrigado! A equipe do site recebeu o aviso. Se quiser, silencie a pessoa: botão direito nela › 🔇 Silenciar.');
  let msg = ''; try { msg = (await r.json()).error || ''; } catch (e) { }
  avisoJogo('🚩 ' + (msg || 'Não deu para mandar agora. Tente de novo daqui a pouco.'));
}
// no menu do botão direito em cima de um jogador (menu_jogador.js)
if (typeof mjAbre === 'function') {
  const _mjAbreOsg = mjAbre;
  mjAbre = function (a) {
    const r = _mjAbreOsg.apply(this, arguments);
    try {
      const m = document.getElementById('mjMenu');
      if (m && a && !m.querySelector('.osg-den')) { const b = el('button', { class: 'btn mini osg-den', type: 'button', title: 'Avisar a equipe do site' }, '🚩 Denunciar'); b.onclick = () => { mjFecha(); osgDenuncia({ id: a.id, apelido: a.apelido }); }; m.append(b); }
    } catch (e) { }
    return r;
  };
}

/* ---------- I8: 👥 jogando agora (todas as cidades) e 🧭 como chegar ---------- */
async function osgQuem() {
  try { if (typeof moConecta === 'function') await moConecta(); } catch (e) { return null; }
  const s = window.LENDA_SOCK || (typeof MO !== 'undefined' && MO.sock); if (!s || !s.connected) return null;
  return new Promise(ok => { const t = setTimeout(() => ok(null), 6000); s.emit('mundo-quem', null, r => { clearTimeout(t); ok(r && r.ok ? r : null); }); });
}
const osgLugar = id => { try { return typeof ccNome === 'function' ? ccNome(id) : (typeof nomeLugarPers === 'function' ? nomeLugarPers(id) : id); } catch (e) { return id; } };
function osgComoChegar(mapa) {
  if (G.mapa && G.mapa.id === mapa) return avisoJogo(`📍 Você já está em ${osgLugar(mapa)}!`);
  let rota = null; try { rota = typeof ccRota === 'function' ? ccRota(mapa) : null; } catch (e) { }
  const linhas = [];
  if (rota && rota.viagem) linhas.push('🧭 Viagem: ' + rota.viagem);
  const cam = rota && typeof ccCaminhoTxt === 'function' ? ccCaminhoTxt(rota) : '';
  if (cam) linhas.push('🚶 Caminho ' + cam);
  avisoJogo(linhas.length ? linhas.join(' · ') : `📍 Fica em ${osgLugar(mapa)}. Procure no 🗺️ mapa do jogo!`, { titulo: `Como chegar: ${osgLugar(mapa)}` });
}
// a janela "👥 jogando agora" (de qualquer lugar: ☰ Menu › Social, ou o painel 💬 fora das cidades)
async function osgModalQuem() {
  if (!osgOnline()) return avisoJogo('👥 Entre na sua conta do site para ver quem está jogando.');
  const r = await osgQuem();
  if (!r) return avisoJogo('👥 Não deu para ver quem está jogando agora. Tente de novo daqui a pouco.');
  abreModal(el('h2', {}, `👥 ${r.total} jogando agora nas cidades`),
    el('p', { class: 'dica' }, '🌐 Os outros jogadores aparecem nas cidades e nos centros (não nas caças, casas e arenas). Sem chat livre: lá dá para mandar emotes e frases prontas (💬 ou tecla Y).'),
    osgInvisivel() ? el('p', { class: 'dica osg-inv' }, '🙈 Você está invisível: ninguém vê você (⚙️ › 🌐 Online).') : '',
    osgListaQuem(r));
}
// no ☰ Menu (grupo Social)
(function osgPoeBotao(t = 0) {
  if (window.LENDA_STEAM || typeof PORTAL === 'undefined' || !PORTAL.ativo) return;
  const lista = document.querySelector('.tb-lista'); if (!lista) { if (t < 40) setTimeout(() => osgPoeBotao(t + 1), 500); return; }
  if (document.getElementById('btnJogandoAgora')) return;
  const b = el('button', { class: 'btn', id: 'btnJogandoAgora', type: 'button', role: 'menuitem' }, '👥 Jogando agora'); b.onclick = osgModalQuem;
  lista.append(b);
})();
function osgListaQuem(r) {
  const amigos = (typeof MO !== 'undefined' && MO.amigos && MO.amigos.ids) || new Set();
  const lista = (r.lista || []).map(x => el('div', { class: 'mo-pessoa' },
    el('span', {}, `${amigos.has(String(x.id)) ? '🤝 ' : ''}${x.apelido} · Nv ${x.nivel} · ${osgLugar(x.mapa)}`),
    el('button', { class: 'btn mini', type: 'button', onclick: () => osgComoChegar(x.mapa) }, '🧭 Como chegar')));
  return lista.length ? el('div', { class: 'mo-lista' }, ...lista) : el('p', { class: 'vazio' }, 'Ninguém nas cidades agora. Chame um amigo!');
}
if (typeof moPainel === 'function') {
  const _moPainelOsg = moPainel;
  moPainel = async function () {
    if (!osgOnline()) return _moPainelOsg.apply(this, arguments);
    // fora das cidades (caça, casa, arena): em vez do aviso, mostra quem está jogando nas cidades
    if (typeof MO !== 'undefined' && !MO.mapa) return osgModalQuem();
    const res = await _moPainelOsg.apply(this, arguments);
    try {
      const C = document.getElementById('modalConteudo'); if (!C) return res;
      if (osgInvisivel()) C.insertBefore(el('p', { class: 'dica osg-inv' }, '🙈 Você está invisível: ninguém vê você nem os seus emotes (⚙️ › 🌐 Online).'), C.children[1] || null);
      const caixa = el('details', { class: 'osg-quem' }, el('summary', {}, '👥 Jogando agora em todas as cidades…'));
      C.append(caixa);
      osgQuem().then(r => { if (!r || !document.body.contains(caixa)) return; caixa.querySelector('summary').textContent = `👥 ${r.total} jogando agora em todas as cidades`; caixa.append(osgListaQuem(r)); });
    } catch (e) { }
    return res;
  };
}

/* ---------- U6: apagar meus dados do jogo (no servidor) ---------- */
async function osgApagaDados() {
  if (!osgOnline()) return avisoJogo('Entre na sua conta do site para apagar os dados do jogo guardados lá.');
  if (!(await perguntaJogo('Apagar do site TODOS os seus dados do Lenda do Campinho? (save online, ranking, casa publicada, guilda, anúncios da feira e torcidas). A sua conta do site continua. Não dá para desfazer.', { sim: 'Apagar', nao: 'Cancelar', perigo: true }))) return;
  if (!(await perguntaJogo('Tem certeza? Peça para um adulto confirmar com você.', { sim: 'Sim, apagar', nao: 'Não', perigo: true }))) return;
  let r = null; try { r = await fetch(PORTAL.api + '/api/lenda/meus-dados', { method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + PORTAL.token }, body: JSON.stringify({ confirmar: 'APAGAR' }) }); } catch (e) { }
  if (!r || !r.ok) { let msg = ''; try { msg = (await r.json()).error || ''; } catch (e) { } return avisoJogo(msg || 'Não deu para apagar agora. Tente de novo daqui a pouco.'); }
  // até recarregar a página, o jogo não manda mais nada ao site (senão o save voltaria na hora)
  try { if (typeof NUVEM !== 'undefined') NUVEM.parada = true; PORTAL.ativo = false; } catch (e) { }
  avisoJogo('🗑️ Pronto: seus dados do jogo foram apagados do site. O personagem DESTE aparelho continua aqui. Se você jogar de novo com a conta do site, o jogo volta a salvar online.');
}

{
  const css = document.createElement('style');
  css.textContent = `.osg-seletor { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin: 4px 0 8px; } .osg-sel { font: inherit; padding: 4px 6px; border-radius: 8px; max-width: 100%; }
  .osg-nome-time { color: #2a6a1a; } .osg-motivos { display: flex; flex-direction: column; gap: 6px; margin: 8px 0; } .osg-motivos .btn { text-align: left; justify-content: flex-start; }
  .osg-quem { margin-top: 8px; } .osg-quem summary { cursor: pointer; font-weight: 800; } .osg-inv { background: rgba(120,80,200,.12); border-radius: 8px; padding: 4px 8px; }`;
  document.head.append(css);
}
window.ONLINE_SEGURO = { osgNomeTime, osgSeletorTime, osgDenuncia, osgQuem, osgModalQuem, osgApagaDados, osgMudaPref, OSG_PREFS: () => OSG_PREFS };
