/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🏅 CONQUISTAS (v154): títulos com nome emblemático.
   Cada estádio vencido vale um título ("Príncipe do Parque", "Rei do Maracanã"...),
   e também há conquistas de jornada, arenas e estatísticas.
   - Tudo é calculado a partir da FICHA PÚBLICA (a mesma que o servidor monta do save):
     aparece igual no jogo e na página do jogador no site (📜 Personagens), sem mudar o servidor.
   - Janela 🏅 Conquistas (menu ☰ Mais, menu do celular e Ficha); aviso quando ganha uma nova.
   Carregar DEPOIS de estadios.js, personagens.js e divulgar.js.
   ============================================================ */
const venceuEst = (f, id) => (f.arenas || []).some(a => a.id === id && a.vitorias > 0);
const CONQ_ESTADIO = {
  cairo: ['Pharaoh of Cairu', '🐫'], toquio: ['Samurai of Tókyo', '🗾'], doha: ['Sultan of the Dunes', '🏜️'], miami: ['Star of Miamy', '🌴'],
  lisboa: ['Eagle of Luz', '🦅'], madri: ['Galáctico of the Bernabéo', '👑'], milao: ['Maestro of San Syro', '🎼'], munique: ['Kaiser of Aliança Arena', '🏰'],
  londres: ['Lord of Stamford Brydge', '🎩'], paris: ['Prince of the Park', '🗼'], buenos: ['Master of the Bombonerra', '🎺'], rio: ['King of the Maracanã', '🏆'], santos: ['Vila Belmiro Kid', '🐟'],
};
const CONQUISTAS = [];
// estádios
for (const e of (typeof ESTADIOS !== 'undefined' ? ESTADIOS : [])) {
  const [nome, ic] = CONQ_ESTADIO[e.host] || [`Champion at ${e.nome}`, '🏟️'];
  CONQUISTAS.push({ id: 'c_' + e.id, cat: 'Stadiums', ic, nome, desc: `Beat ${e.time} at ${e.nome}.`, dica: `Challenge ${e.time} at ${e.nome} (level ${e.req}+).`, ok: f => venceuEst(f, e.id) });
}
CONQUISTAS.push({ id: 'c_estadios_todos', cat: 'Stadiums', ic: '🌍', nome: 'Legend of the World\'s Stadiums', desc: 'Beat all 12 teams, in every stadium in the world.', dica: 'Beat the team of each of the 12 stadiums.', ok: f => (typeof ESTADIOS !== 'undefined' ? ESTADIOS : []).every(e => venceuEst(f, e.id)) });
// arenas
CONQUISTAS.push(
  { id: 'c_arena_1', cat: 'Arenas', ic: '⚔️', nome: 'Arena Challenger', desc: 'Beat an arena boss.', dica: 'Beat any arena boss.', ok: f => (f.arenas || []).some(a => !/^est_/.test(a.id) && a.vitorias > 0) },
  { id: 'c_arena_todas', cat: 'Arenas', ic: '🛡️', nome: 'Arena Gladiator', desc: 'Beat the boss of every arena.', dica: 'Beat the boss of each arena.', ok: f => typeof ARENAS !== 'undefined' && ARENAS.every(a => (f.arenas || []).some(x => x.id === a.id && x.vitorias > 0)) },
  { id: 'c_mitico', cat: 'Arenas', ic: '✨', nome: 'Mythic Hunter', desc: 'Won a mythic item in an arena.', dica: 'Arena bosses sometimes drop a mythic item.', ok: f => (f.arenas || []).some(a => a.miticos > 0) },
);
// jornada
for (const [n, nome, ic] of [[25, 'Pro', '⚽'], [50, 'Rising Star', '⭐'], [100, 'International Star', '🌟'], [200, 'Living Legend', '🔥'], [300, 'Myth of Atlantis', '🔱'], [400, 'Galaxy Star', '🌌']])
  CONQUISTAS.push({ id: 'c_nivel_' + n, cat: 'Journey', ic, nome, desc: `Reached level ${n}.`, dica: `Reach level ${n}.`, ok: f => (f.nivel || 0) >= n });
// estatísticas
const est = f => f.estatisticas || {};
CONQUISTAS.push(
  { id: 'c_abates_1k', cat: 'Stats', ic: '💨', nome: 'Tireless Dribbler', desc: 'Dribbled past 1,000 opponents.', dica: 'Dribble past 1,000 opponents.', ok: f => est(f).abates >= 1000 },
  { id: 'c_abates_10k', cat: 'Stats', ic: '🌪️', nome: 'Dribble Master', desc: 'Dribbled past 10,000 opponents.', dica: 'Dribble past 10,000 opponents.', ok: f => est(f).abates >= 10000 },
  { id: 'c_chefes_50', cat: 'Stats', ic: '💪', nome: 'Boss Hunter', desc: 'Beat 50 bosses.', dica: 'Beat 50 bosses.', ok: f => est(f).chefes >= 50 },
  { id: 'c_gols_100', cat: 'Stats', ic: '🥅', nome: 'Top Scorer', desc: 'Scored 100 goals.', dica: 'Score 100 goals.', ok: f => est(f).gols >= 100 },
  { id: 'c_penalti', cat: 'Stats', ic: '🧊', nome: 'Ice in the Veins', desc: 'Scored 5 out of 5 in the penalty challenge.', dica: 'Score 5 penalties in a row.', ok: f => est(f).recordePenalti >= 5 },
  { id: 'c_quiz_100', cat: 'Stats', ic: '🎓', nome: 'Soccer Professor', desc: 'Got 100 quiz questions right.', dica: 'Get 100 quiz questions right.', ok: f => est(f).quiz >= 100 },
  { id: 'c_album', cat: 'Stats', ic: '🎴', nome: 'Complete Album', desc: 'Completed the sticker album.', dica: 'Collect every sticker in the album.', ok: f => typeof FIGURINHAS !== 'undefined' && est(f).figurinhas >= FIGURINHAS.length },
  { id: 'c_montarias_5', cat: 'Stats', ic: '🛹', nome: 'Mount Collector', desc: 'Has 5 mounts.', dica: 'Get 5 mounts.', ok: f => (f.montarias || []).length >= 5 },
  { id: 'c_titulo', cat: 'Stats', ic: '🥇', nome: 'Champion with My Team', desc: 'Won a title with your club.', dica: 'Become champion with My Team.', ok: f => f.time && f.time.titulos > 0 },
);
function conquistasDe(f) { return f ? CONQUISTAS.filter(c => { try { return !!c.ok(f); } catch (e) { return false; } }) : []; }

/* ---------- janela ---------- */
function listaConquistas(f, soGanhas) {
  const tem = new Set(conquistasDe(f).map(c => c.id)); const box = el('div', { class: 'cq-grade' });
  for (const cat of ['Stadiums', 'Arenas', 'Journey', 'Stats']) {
    const itens = CONQUISTAS.filter(c => c.cat === cat && (!soGanhas || tem.has(c.id))); if (!itens.length) continue;
    box.append(el('h3', { class: 'cq-cat' }, `${cat} (${itens.filter(c => tem.has(c.id)).length}/${CONQUISTAS.filter(c => c.cat === cat).length})`));
    const g = el('div', { class: 'cq-lista' });
    for (const c of itens) { const ok = tem.has(c.id); g.append(el('div', { class: 'cq-card' + (ok ? ' ok' : ''), title: ok ? c.desc : c.dica }, el('span', { class: 'cq-ic' }, ok ? c.ic : '🔒'), el('div', {}, el('b', {}, c.nome), el('small', {}, ok ? c.desc : c.dica)))); }
    box.append(g);
  }
  return { box, n: tem.size };
}
function modalConquistas() {
  if (!G.save) return; const f = fichaDoSaveLocal(G.save); const { box, n } = listaConquistas(f, false);
  abreModal(el('h2', {}, `🏅 Achievements — ${n} of ${CONQUISTAS.length}`), el('p', { class: 'vazio' }, 'The titles you win also show up on your player page on the website (📜 Characters).'), box,
    el('div', { class: 'opcoes' }, n ? el('button', { class: 'btn amarelo', type: 'button', onclick: () => divulgar({ feito: `I have ${n} achievements in Lenda do Campinho!` }) }, '📣 Share') : null, el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'Close')));
}

/* ---------- página do jogador (no jogo e no site) ---------- */
if (typeof paginaFicha === 'function') {
  const _paginaFichaCq = paginaFicha;
  paginaFicha = function (dados) {
    const f = dados && dados.ficha; if (!f) return _paginaFichaCq.apply(this, arguments);
    const arenasSo = (f.arenas || []).filter(a => !/^est_/.test(a.id)); // estádios têm caixa própria
    const partes = _paginaFichaCq.call(this, Object.assign({}, dados, { ficha: Object.assign({}, f, { arenas: arenasSo }) }));
    const ganhas = conquistasDe(f);
    const titulos = el('div', { class: 'tbia-caixa' }, el('div', { class: 'tbia-titulo' }, `🏅 Titles and achievements (${ganhas.length} of ${CONQUISTAS.length})`),
      ganhas.length ? el('div', { class: 'cq-selos' }, ...ganhas.map(c => el('span', { class: 'cq-selo', title: c.desc }, `${c.ic} ${c.nome}`))) : el('p', { class: 'tbia-vazio' }, 'No achievements yet.'));
    const estadios = (typeof ESTADIOS !== 'undefined' ? ESTADIOS : []).map(e => { const a = (f.arenas || []).find(x => x.id === e.id); return a && a.vitorias ? [e.nome, e.time, `${a.vitorias} win(s)`] : null; }).filter(Boolean);
    const caixaEst = caixaPers('Stadiums', estadios, { cabecalho: ['Stadium', 'Team beaten', 'Wins'], vazio: 'No teams beaten in the stadiums yet.' });
    for (const p of partes) { const t = p && p.querySelector && p.querySelector('.tbia-titulo'); if (t && t.textContent === 'Achievements') t.textContent = 'Stats'; } // a caixa antiga de números
    partes.splice(1, 0, titulos); // logo depois das informações do personagem
    const iArenas = partes.findIndex(p => p && p.textContent && /^Arenas/.test(p.textContent)); partes.splice(iArenas >= 0 ? iArenas + 1 : partes.length, 0, caixaEst);
    return partes;
  };
}

/* ---------- aviso de conquista nova ---------- */
function confereConquistas(silencioso) {
  const s = G.save; if (!s) return; const f = fichaDoSaveLocal(s); if (!f) return;
  const vistas = new Set(s.conquistasVistas || []); const novas = conquistasDe(f).filter(c => !vistas.has(c.id));
  if (!novas.length) return;
  s.conquistasVistas = [...vistas, ...novas.map(c => c.id)];
  if (silencioso) return; // save antigo: o que já tinha não vira "novidade"
  const c = novas[0];
  banner(`🏅 ${c.nome}`, 'New achievement!'); som('nivel');
  for (const k of novas) log(`🏅 ACHIEVEMENT: ${k.nome} — ${k.desc}`, 'l-lendario');
  if (typeof oferecerDivulgar === 'function') oferecerDivulgar({ feito: `I earned the title "${c.nome}"!` });
}
{
  const _iniciarJogoCq = iniciarJogo;
  iniciarJogo = async function () { const r = await _iniciarJogoCq.apply(this, arguments); try { confereConquistas(!G.save.conquistasVistas); } catch (e) { } return r; };
  let proxCq = 0;
  const _atualizaCq = atualiza;
  atualiza = function (dt) { const r = _atualizaCq.apply(this, arguments); if (G.agora > proxCq) { proxCq = G.agora + 3000; try { confereConquistas(false); } catch (e) { } } return r; };
}

/* ---------- botões ---------- */
{
  const lista = document.querySelector('.tb-lista');
  if (lista && !document.getElementById('btnConquistas')) {
    const b = el('button', { class: 'btn', id: 'btnConquistas', type: 'button', role: 'menuitem' }, '🏅 Achievements');
    b.addEventListener('click', () => modalConquistas());
    const ref = lista.querySelector('[data-abre="album"]'); if (ref) ref.after(b); else lista.prepend(b);
  }
  const grade = document.querySelector('#celMenu .cm-grade');
  if (grade && !document.getElementById('cmConquistas')) grade.append(el('button', { class: 'btn cm-bt', id: 'cmConquistas', type: 'button', onclick: () => { if (typeof fechaMenuCel === 'function') fechaMenuCel(); modalConquistas(); } }, el('span', { class: 'cm-ic' }, '🏅'), 'Achievements'));
  if (typeof abreFicha === 'function') { const _abreFichaCq = abreFicha; abreFicha = function () { const r = _abreFichaCq.apply(this, arguments); const box = document.getElementById('modalConteudo'); if (box && !box.querySelector('.bt-conq')) { const n = conquistasDe(fichaDoSaveLocal(G.save)).length; box.append(el('div', { class: 'opcoes' }, el('button', { class: 'btn roxo bt-conq', type: 'button', onclick: modalConquistas }, `🏅 Achievements (${n}/${CONQUISTAS.length})`))); } return r; }; }
}
{
  const st = document.createElement('style');
  st.textContent = `.cq-cat { margin: 10px 0 6px; font-size: 16px; } .cq-lista { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 8px; }
  .cq-card { display: flex; gap: 10px; align-items: center; padding: 8px 10px; border-radius: 10px; background: rgba(0,0,0,.18); opacity: .55; filter: grayscale(.8); }
  .cq-card.ok { opacity: 1; filter: none; background: linear-gradient(135deg, rgba(255,210,63,.28), rgba(255,140,40,.18)); box-shadow: 0 0 0 2px rgba(255,210,63,.55) inset; }
  .cq-card b { display: block; } .cq-card small { display: block; opacity: .85; line-height: 1.25; } .cq-ic { font-size: 26px; min-width: 32px; text-align: center; }
  .cq-selos { display: flex; flex-wrap: wrap; gap: 6px; padding: 8px; } .cq-selo { background: #f4e2b0; color: #4a2c10; border: 1px solid #b8904a; border-radius: 12px; padding: 3px 10px; font-weight: 700; font-size: 13px; }`;
  document.head.append(st);
}
