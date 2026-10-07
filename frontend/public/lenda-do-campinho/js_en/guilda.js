/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🛡️ GUILDAS — "MMO leve", etapa 3 (v382; dono: "pode criar a parte de guilda")
   ☰ Mais › 🛡️ Guilda. Público infantil: NADA de texto livre.
   - Nome montado com partes de listas ("Os Leões de Fogo", "As Águias Douradas"), escudo e cor de listas.
   - Até 30 membros; líder, vices e membros. Entra por CONVITE de líder/vice, só AMIGO de quem convida.
   - META DA SEMANA: os adversários que cada um derrota (com pelo menos 60% do seu nível) somam para a guilda; cada faixa atingida dá um
     prêmio (XP + tostões, pelo seu nível) para quem ajudou com pelo menos 50 na semana. Ranking semanal das guildas.
   - Frases prontas para a guilda inteira; o escudo aparece em cima do nome nas cidades; colegas de guilda podem
     caçar em grupo mesmo sem ser amigos.
   Servidor: /api/lenda/guilda (routes/lendaGuilda.js) + socket "guilda-*" (socketMundo.js). Steam: desligado.
   Carregar DEPOIS de mundo_online.js e caca_grupo.js.
   ============================================================ */
const GLD = { dados: null, pend: 0, tEnvio: 0, carregando: false, convitesVistos: new Set() };
const GLD_LIBERADO = true;
// (cópia das listas do servidor — a ordem é a mesma de src/lenda/guilda.js)
const GLD_NOMES = [['Lions', 'm'], ['Eagles', 'f'], ['Sharks', 'm'], ['Dragons', 'm'], ['Wolves', 'm'], ['Panthers', 'f'], ['Owls', 'f'], ['Tigers', 'm'], ['Falcons', 'm'], ['Foxes', 'f'], ['Rockets', 'm'], ['Comets', 'm'], ['Stars', 'f'], ['Beasts', 'f'], ['Aces', 'm'], ['Titans', 'm'], ['Guardians', 'm'], ['Legends', 'f'], ['Phoenix', 'f'], ['Pirates', 'm'], ['Bears', 'm'], ['Jaguars', 'f']];
const GLD_COMPL = [['of Fire', 'of Fire'], ['of the Thunder', 'of the Thunder'], ['of Campinho', 'of Campinho'], ['of the Village', 'of the Village'], ['of the Moon', 'of the Moon'], ['of the Stars', 'of the Stars'], ['of the Sea', 'of the Sea'], ['of the Goal', 'of the Goal'], ['of the Sandlot', 'of the Sandlot'], ['of the Future', 'of the Future'], ['Golden', 'Golden'], ['Galácticos', 'Galactic'], ['Unbeatable', 'Unbeatable'], ['Unstoppable', 'Unstoppable'], ['Legendary', 'Legendary'], ['Blue', 'Blue'], ['Red', 'Red'], ['Speedy', 'Speedy'], ['Furious', 'Furious'], ['Brilliant', 'Brilliant'], ['of the Rainbow', 'of the Rainbow'], ['of the Forest', 'of the Forest']];
const GLD_ESCUDOS = ['🦁', '🦅', '🐉', '⚡', '🔥', '🌟', '⚽', '🛡️', '🐺', '🦈', '🚀', '👑', '🐯', '🦊', '🌙', '💎'];
const GLD_CORES = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#1abc9c', '#3498db', '#9b59b6', '#ec407a'];
const GLD_FRASES = ['Let\'s hit the goal! 🎯', 'Let\'s hunt together!', 'Good morning, guild! ☀️', 'Good night, guild! 🌙', 'Thanks, team! 🙏', 'Congrats! 🎉', 'Who wants to group up? 👥', 'I\'m at the Tower 🗼', 'I\'m in the Multiverse 🌌', 'I need help! 🆘', 'I leveled up! ⬆️', 'We\'re the best! 🏆'];
const GLD_PREMIO = [{ xp: 0.03, ouro: 200 }, { xp: 0.06, ouro: 500 }, { xp: 0.12, ouro: 1200 }, { xp: 0.2, ouro: 3000 }]; // por faixa: fração do nível em XP + tostões × nível
const GLD_NIVEL_CRIAR = 20;
const gldLigado = () => GLD_LIBERADO && typeof PORTAL !== 'undefined' && PORTAL.ativo && !!PORTAL.token && !window.LENDA_STEAM;
const gldNome = (n, c) => { const a = GLD_NOMES[n], b = GLD_COMPL[c]; if (!a || !b) return ''; const f = a[1] === 'f'; return `${f ? 'The' : 'The'} ${a[0]} ${f ? b[1] : b[0]}`; };
const gldBadge = (g, tam = 34) => el('span', { class: 'gld-badge', style: `background:${g.cor};width:${tam}px;height:${tam}px;font-size:${Math.round(tam * 0.6)}px` }, g.escudo);
async function gldPede(metodo, caminho, corpo) {
  const r = await fetch(PORTAL.api + '/api/lenda/guilda' + caminho, { method: metodo, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + PORTAL.token }, body: corpo ? JSON.stringify(corpo) : undefined });
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, dados: j };
}
const gldErro = r => (r && r.dados && r.dados.error) || (r && r.status === 503 ? 'Guilds are still on their way to the server. Try again later!' : 'That didn\'t work right now. Try again in a moment.');
async function gldCarrega() {
  let r; try { r = await gldPede('GET', '/minha'); } catch (e) { r = { ok: false }; }
  if (!r.ok) return r;
  GLD.dados = r.dados;
  for (const c of r.dados.convites || []) if (!GLD.convitesVistos.has(c.id)) { GLD.convitesVistos.add(c.id); log(`🛡️ ${c.de} invited you to the guild ${c.guilda.escudo} ${c.guilda.nome}! Open ☰ More › 🛡️ Guild.`, 'l-xp'); banner('🛡️ Guild invite!', `${c.guilda.escudo} ${c.guilda.nome}`); }
  gldLigaSocket();
  return r;
}

/* ---------- socket: frases da guilda (usa a conexão do mundo compartilhado) ---------- */
async function gldLigaSocket() {
  if (typeof moConecta !== 'function') return;
  try { await moConecta(); } catch (e) { return; }
  const s = MO.sock; if (!s) return;
  if (!s._gldEscuta) {
    s._gldEscuta = true;
    s.on('guilda-frase', ({ de, apelido, i }) => {
      const f = GLD_FRASES[i]; if (!f) return; const eu = de === PORTAL.contaId;
      log(`🛡️ ${eu ? 'You' : apelido}: ${f}`, 'l-xp');
      const o = MO.outros.get(de); if (eu) moBalao('eu', f); else if (o && !MO_ESCONDE && !MO_MUDOS.has(de)) moBalao(de, f);
    });
    s.on('guilda-convite', () => gldCarrega());
    s.on('connect', () => s.emit('guilda-ligar', {}, () => { }));
  }
  s.emit('guilda-ligar', {}, () => { });
}

/* ---------- janela ---------- */
async function gldAbre() {
  if (!gldLigado()) return avisoJogo('🛡️ Guilds only work on the website (educacaogamer.com.br), with your account.');
  abreModal(el('h2', {}, '🛡️ Guild'), el('p', { class: 'vazio' }, 'Loading...'));
  const r = await gldCarrega();
  if (!r.ok) return abreModal(el('h2', {}, '🛡️ Guild'), el('p', {}, gldErro(r)));
  GLD.dados.guilda ? gldTelaGuilda() : gldTelaSemGuilda();
}
function gldTelaSemGuilda() {
  const d = GLD.dados, convites = (d.convites || []).map(c => el('div', { class: 'amg-linha amg-novo' }, el('span', {}, gldBadge(c.guilda, 26), ` ${c.guilda.nome} — invite from ${c.de}`), el('div', { class: 'amg-botoes' },
    el('button', { class: 'btn mini amarelo', type: 'button', onclick: async () => { const r = await gldPede('POST', `/convite/${c.id}/aceitar`); if (!r.ok) return avisoJogo('🛡️ ' + gldErro(r)); som('nivel'); banner('🛡️ Welcome to the guild!', `${c.guilda.escudo} ${c.guilda.nome}`); gldAbre(); } }, '✅ Join'),
    el('button', { class: 'btn mini', type: 'button', onclick: async () => { await gldPede('DELETE', `/convite/${c.id}`); gldAbre(); } }, '❌'))));
  abreModal(el('h2', {}, '🛡️ Guild'),
    el('p', {}, 'A guild brings together up to 30 friends: you get a crest, hunt together, hit the WEEKLY GOAL and win prizes.'),
    convites.length ? el('div', { class: 'amg-lista' }, ...convites) : el('p', { class: 'vazio' }, 'No invites right now. A friend who has a guild can invite you.'),
    el('div', { class: 'opcoes' },
      el('button', { class: 'btn amarelo', type: 'button', onclick: gldTelaCriar }, '➕ Create a guild'),
      el('button', { class: 'btn', type: 'button', onclick: gldRanking }, '🏆 Weekly ranking')));
}
function gldTelaCriar() {
  if (G.save.nivel < GLD_NIVEL_CRIAR) return avisoJogo(`🛡️ You need to be level ${GLD_NIVEL_CRIAR} to create a guild. But you can join a friend's guild before that!`);
  const esc = { n: 0, c: 0, e: 0, k: 5 };
  const prev = el('div', { class: 'gld-prev' });
  const atualiza = () => { prev.innerHTML = ''; prev.append(gldBadge({ escudo: GLD_ESCUDOS[esc.e], cor: GLD_CORES[esc.k] }, 54), el('b', {}, gldNome(esc.n, esc.c))); };
  const sel = (lista, k, rot) => { const s = el('select', { onchange: e => { esc[k] = +e.target.value; atualiza(); } }, ...lista.map((x, i) => el('option', { value: i }, rot(x, i)))); return s; };
  const grade = (lista, k, desenha) => el('div', { class: 'gld-grade' }, ...lista.map((x, i) => { const b = el('button', { type: 'button', class: 'gld-op', onclick: () => { esc[k] = i; [...b.parentNode.children].forEach(c => c.classList.toggle('on', c === b)); atualiza(); } }, desenha(x)); if (i === esc[k]) b.classList.add('on'); return b; }));
  atualiza();
  abreModal(el('h2', {}, '➕ Create guild'), prev,
    el('div', { class: 'gld-campos' }, el('label', {}, 'Name: ', sel(GLD_NOMES, 'n', x => x[0])), el('label', {}, 'Ending: ', sel(GLD_COMPL, 'c', x => x[0] === x[1] ? x[0] : `${x[0]} / ${x[1]}`))),
    el('h3', {}, 'Crest'), grade(GLD_ESCUDOS, 'e', x => x),
    el('h3', {}, 'Color'), grade(GLD_CORES, 'k', x => el('span', { class: 'gld-cor', style: `background:${x}` })),
    el('div', { class: 'opcoes' },
      el('button', { class: 'btn amarelo', type: 'button', onclick: async () => { const r = await gldPede('POST', '/criar', { nome: esc.n, complemento: esc.c, escudo: esc.e, cor: esc.k, nivel: G.save.nivel }); if (!r.ok) return avisoJogo('🛡️ ' + gldErro(r)); som('nivel'); banner('🛡️ Guild created!', `${r.dados.guilda.escudo} ${r.dados.guilda.nome}`); gldAbre(); } }, '🛡️ Create'),
      el('button', { class: 'btn', type: 'button', onclick: gldAbre }, '← Back')));
}
function gldTelaGuilda() {
  const d = GLD.dados, g = d.guilda, eu = d.eu, metas = d.metas || [2000, 10000, 30000, 80000], min = d.minAjuda || 50;
  const ehChefe = eu.papel === 'lider' || eu.papel === 'vice';
  // meta da semana
  const total = g.pontosSemana, topo = metas[metas.length - 1];
  const barra = el('div', { class: 'gld-barra' }, el('i', { style: `width:${Math.min(100, total / topo * 100)}%` }), ...metas.map(m => el('span', { class: 'gld-marca', style: `left:${m / topo * 100}%` })));
  const faixas = metas.map((m, i) => {
    const chegou = total >= m, pego = (eu.premios || 0) & (1 << i), p = GLD_PREMIO[i];
    const txt = `Goal ${i + 1}: ${m.toLocaleString('en-US')} — +${Math.round(p.xp * 100)}% of a level in XP and ${(p.ouro * G.save.nivel).toLocaleString('en-US')} coins`;
    return el('div', { class: 'gld-faixa' + (chegou ? ' ok' : '') }, el('span', {}, (pego ? '✅ ' : chegou ? '🎁 ' : '🔒 ') + txt),
      chegou && !pego ? el('button', { class: 'btn mini amarelo', type: 'button', disabled: eu.pontosSemana < min ? 'disabled' : null, title: eu.pontosSemana < min ? `Help with ${min} opponents this week to claim` : '', onclick: () => gldResgata(i) }, eu.pontosSemana < min ? `faltam ${min - eu.pontosSemana} seus` : 'Claim') : '');
  });
  const icone = { lider: '👑', vice: '⭐', membro: '⚽' };
  const membros = (d.membros || []).map(m => {
    const eu2 = m.userId === PORTAL.contaId, botoes = [];
    if (!eu2 && eu.papel === 'lider') {
      botoes.push(el('button', { class: 'btn mini', type: 'button', onclick: () => gldAcao('/cargo', { userId: m.userId, papel: m.papel === 'vice' ? 'membro' : 'vice' }) }, m.papel === 'vice' ? '⬇ Member' : '⭐ Co-leader'));
      botoes.push(el('button', { class: 'btn mini', type: 'button', onclick: async () => { if (await perguntaJogo(`Hand the leadership over to ${m.apelido}? You'll become co-leader.`, { sim: 'Hand over', nao: 'Cancel' })) gldAcao('/lider', { userId: m.userId }); } }, '👑'));
    }
    if (!eu2 && (eu.papel === 'lider' && m.papel !== 'lider' || eu.papel === 'vice' && m.papel === 'membro'))
      botoes.push(el('button', { class: 'btn mini', type: 'button', onclick: async () => { if (await perguntaJogo(`Remove ${m.apelido} from the guild?`, { sim: 'Take off', nao: 'Cancel' })) gldAcao('/expulsar', { userId: m.userId }); } }, '🚪'));
    return el('div', { class: 'amg-linha' }, el('span', {}, `${icone[m.papel] || '⚽'} ${m.apelido}${eu2 ? ' (you)' : ''} · ${m.pontosSemana.toLocaleString('en-US')} this week`), el('div', { class: 'amg-botoes' }, ...botoes));
  });
  const convidar = el('div', { class: 'co-amigos' });
  abreModal(el('h2', { class: 'gld-titulo' }, gldBadge(g, 40), ` ${g.nome}`, g.numero ? el('small', {}, ` #${g.numero}`) : ''),
    el('h3', {}, `🎯 Weekly goal: ${total.toLocaleString('en-US')} opponents`), barra, el('div', { class: 'gld-faixas' }, ...faixas),
    el('p', { class: 'dica' }, `You helped with ${eu.pontosSemana.toLocaleString('en-US')} this week. Opponents from level ${gldMinNivel(G.save.nivel)} (60% of yours) and up count; prizes go to everyone who helped with at least ${min}. The week resets on Monday.`),
    el('h3', {}, '💬 Talk to the guild'), el('div', { class: 'gld-frases' }, ...GLD_FRASES.map((f, i) => el('button', { class: 'btn', type: 'button', onclick: () => { if (MO.sock && MO.sock.connected) MO.sock.emit('guilda-frase', { i }); else avisoJogo('🛡️ Connecting... try again in a moment.'); } }, f))),
    el('h3', {}, `👥 Members (${(d.membros || []).length}/30)`), el('div', { class: 'amg-lista' }, ...membros),
    ehChefe ? el('h3', {}, '📨 Invite friends') : '', ehChefe ? convidar : '',
    el('div', { class: 'opcoes' },
      el('button', { class: 'btn', type: 'button', onclick: gldRanking }, '🏆 Weekly ranking'),
      el('button', { class: 'btn', type: 'button', onclick: async () => { if (await perguntaJogo(eu.papel === 'lider' ? 'Leave the guild? The leadership goes to a co-leader (or the oldest member).' : 'Leave the guild?', { sim: 'Exit', nao: 'Stay' })) { await gldPede('POST', '/sair'); GLD.dados = null; gldLigaSocket(); gldAbre(); } } }, '🚪 Leave the guild')));
  if (ehChefe) gldListaConvidar(convidar);
}
async function gldListaConvidar(caixa) {
  caixa.append(el('p', { class: 'vazio' }, 'Loading friends...'));
  let lista = []; try { const r = await amgPede('GET', '/amigos'); lista = (r.ok && r.dados.amigos) || []; } catch (e) { }
  caixa.innerHTML = '';
  const dentro = new Set((GLD.dados.membros || []).map(m => m.userId));
  const fora = lista.filter(a => !dentro.has(a.id));
  if (!fora.length) caixa.append(el('p', { class: 'vazio' }, 'No friends to invite right now.'));
  for (const a of fora.slice(0, 20)) caixa.append(el('div', { class: 'amg-linha' }, el('span', {}, `${a.apelido} · Lv ${a.nivel}`),
    el('button', { class: 'btn mini', type: 'button', onclick: async ev => { const r = await gldPede('POST', '/convidar', { userId: a.id }); ev.target.textContent = r.ok ? '✅ Invited' : '❌'; ev.target.disabled = true; if (!r.ok) avisoJogo('🛡️ ' + gldErro(r)); } }, '📨 Invite')));
  caixa.append(el('button', { class: 'btn mini', type: 'button', onclick: () => typeof modalAmigos === 'function' && modalAmigos() }, '➕ Add friends'));
}
async function gldAcao(caminho, corpo) { const r = await gldPede('POST', caminho, corpo); if (!r.ok) avisoJogo('🛡️ ' + gldErro(r)); gldAbre(); }
async function gldResgata(i) {
  const r = await gldPede('POST', '/premio', { faixa: i });
  if (!r.ok) return avisoJogo('🛡️ ' + gldErro(r));
  const s = G.save, p = GLD_PREMIO[i], xp = Math.round((xpPara(s.nivel + 1) - xpPara(s.nivel)) * p.xp), ouro = p.ouro * s.nivel;
  s.ouro += ouro; ganhaXp(xp); som('nivel');
  log(`🛡️ Prize for guild goal ${i + 1}: +${xp.toLocaleString('en-US')} XP and +${ouro.toLocaleString('en-US')} coins!`, 'l-xp');
  banner('🛡️ Guild goal!', `+${ouro.toLocaleString('en-US')} coins and XP`); G.uiSujo = true; salvar(); gldAbre();
}
async function gldRanking() {
  let r; try { r = await gldPede('GET', '/ranking'); } catch (e) { r = { ok: false }; }
  if (!r.ok) return avisoJogo('🛡️ ' + gldErro(r));
  const lista = r.dados.ranking || [];
  abreModal(el('h2', {}, '🏆 Guilds of the week'),
    lista.length ? el('div', { class: 'amg-lista' }, ...lista.map(g => el('div', { class: 'amg-linha' }, el('span', {}, `${g.pos}º `, gldBadge(g, 24), ` ${g.nome}`), el('b', {}, g.pontosSemana.toLocaleString('en-US'))))) : el('p', { class: 'vazio' }, 'No guild has scored any points this week yet. Be the first!'),
    el('div', { class: 'opcoes' }, el('button', { class: 'btn', type: 'button', onclick: gldAbre }, '← Back')));
}

/* ---------- a meta: conta os adversários do seu nível e manda de tempos em tempos ---------- */
// só vale adversário com pelo menos 60% do seu nível (o jogo não tira mais XP de adversário fraco: sem isso, um nível 600
// enchia a meta derrubando jacarés)
const gldMinNivel = n => Math.max(1, Math.min(n - 15, Math.floor(n * 0.6)));
const gldConta = d => nivelMonstro(d) >= gldMinNivel(G.save.nivel);
{
  const _matarGld = matar;
  matar = function (m) {
    try { if (GLD.dados && GLD.dados.guilda && m && m.d && !m.d.treino && gldConta(m.d)) GLD.pend++; } catch (e) { }
    return _matarGld.apply(this, arguments);
  };
}
setInterval(async () => {
  if (!gldLigado() || !GLD.dados || !GLD.dados.guilda || GLD.pend <= 0 || GLD.enviando) return;
  GLD.enviando = true;
  try {
    const r = await gldPede('POST', '/pontos', { n: GLD.pend });
    if (r.ok && r.dados.pontos > 0) { GLD.pend = Math.max(0, GLD.pend - r.dados.pontos); const g = GLD.dados.guilda; g.pontosSemana = r.dados.guildaSemana ?? g.pontosSemana; GLD.dados.eu.pontosSemana = r.dados.meusSemana ?? GLD.dados.eu.pontosSemana; }
  } catch (e) { } finally { GLD.enviando = false; }
}, 60000);

/* ---------- ao entrar e a cada 5 min (convites novos) ---------- */
if (gldLigado()) { setTimeout(() => { if (G.rodando) gldCarrega(); }, 12000); setInterval(() => { if (G.rodando) gldCarrega(); }, 5 * 60000); }
(function poeBotaoGld(t = 0) {
  if (!gldLigado()) return;
  const lista = document.querySelector('.tb-lista'); if (!lista) { if (t < 40) setTimeout(() => poeBotaoGld(t + 1), 500); return; }
  if (document.getElementById('btnGuilda')) return;
  const b = el('button', { class: 'btn', id: 'btnGuilda', type: 'button', role: 'menuitem' }, '🛡️ Guild'); b.onclick = gldAbre;
  lista.append(b);
})();
{
  const css = document.createElement('style');
  css.textContent = `.gld-badge { display: inline-flex; align-items: center; justify-content: center; border-radius: 30% 30% 50% 50%; border: 2px solid rgba(0,0,0,.35); box-shadow: inset 0 -4px 0 rgba(0,0,0,.18); vertical-align: middle; }
  .gld-prev { display: flex; align-items: center; gap: 12px; padding: 10px; margin: 6px 0; border-radius: 12px; background: rgba(0,0,0,.06); font-size: 20px; }
  .gld-campos { display: flex; flex-wrap: wrap; gap: 10px; } .gld-campos select { font-weight: 700; padding: 4px; border-radius: 8px; }
  .gld-grade { display: flex; flex-wrap: wrap; gap: 6px; } .gld-op { font-size: 22px; width: 44px; height: 42px; border-radius: 10px; border: 2px solid transparent; background: rgba(0,0,0,.06); cursor: pointer; }
  .gld-op.on { border-color: #f1c40f; background: rgba(241,196,15,.2); } .gld-cor { display: inline-block; width: 24px; height: 24px; border-radius: 50%; }
  .gld-titulo { display: flex; align-items: center; gap: 8px; } .gld-titulo small { opacity: .6; font-size: 14px; }
  .gld-barra { position: relative; height: 16px; border-radius: 8px; background: rgba(0,0,0,.12); overflow: hidden; margin: 6px 0; } .gld-barra i { position: absolute; inset: 0 auto 0 0; background: linear-gradient(90deg, #2ecc71, #f1c40f); }
  .gld-marca { position: absolute; top: 0; bottom: 0; width: 2px; background: rgba(0,0,0,.35); }
  .gld-faixas { display: flex; flex-direction: column; gap: 4px; } .gld-faixa { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 4px 8px; border-radius: 8px; background: rgba(0,0,0,.04); font-size: 13px; } .gld-faixa.ok { background: rgba(46,204,113,.15); }
  .co-amigos > .btn.mini { align-self: flex-start; }
  .gld-frases { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 6px; }`;
  document.head.append(css);
}
window.GUILDA = { GLD, gldNome, GLD_NOMES, GLD_COMPL, GLD_FRASES };
