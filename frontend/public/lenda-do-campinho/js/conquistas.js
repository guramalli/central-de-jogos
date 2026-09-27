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
  cairo: ['Faraó do Cairu', '🐫'], toquio: ['Samurai de Tókyo', '🗾'], doha: ['Sultão das Dunas', '🏜️'], miami: ['Astro de Miamy', '🌴'],
  lisboa: ['Águia da Luz', '🦅'], madri: ['Galáctico do Bernabéo', '👑'], milao: ['Maestro do San Syro', '🎼'], munique: ['Kaiser da Aliança Arena', '🏰'],
  londres: ['Lorde de Stamford Brydge', '🎩'], paris: ['Príncipe do Parque', '🗼'], buenos: ['Dono da Bombonerra', '🎺'], rio: ['Rei do Maracanã', '🏆'],
};
const CONQUISTAS = [];
// estádios
for (const e of (typeof ESTADIOS !== 'undefined' ? ESTADIOS : [])) {
  const [nome, ic] = CONQ_ESTADIO[e.host] || [`Campeão no ${e.nome}`, '🏟️'];
  CONQUISTAS.push({ id: 'c_' + e.id, cat: 'Estádios', ic, nome, desc: `Venceu o ${e.time} no ${e.nome}.`, dica: `Desafie o ${e.time} no ${e.nome} (nível ${e.req}+).`, ok: f => venceuEst(f, e.id) });
}
CONQUISTAS.push({ id: 'c_estadios_todos', cat: 'Estádios', ic: '🌍', nome: 'Lenda dos Estádios do Mundo', desc: 'Venceu os 12 times, em todos os estádios do mundo.', dica: 'Vença o time de cada um dos 12 estádios.', ok: f => (typeof ESTADIOS !== 'undefined' ? ESTADIOS : []).every(e => venceuEst(f, e.id)) });
// arenas
CONQUISTAS.push(
  { id: 'c_arena_1', cat: 'Arenas', ic: '⚔️', nome: 'Desafiante das Arenas', desc: 'Venceu um chefão de arena.', dica: 'Vença qualquer chefão de arena.', ok: f => (f.arenas || []).some(a => !/^est_/.test(a.id) && a.vitorias > 0) },
  { id: 'c_arena_todas', cat: 'Arenas', ic: '🛡️', nome: 'Gladiador das Arenas', desc: 'Venceu o chefão de todas as arenas.', dica: 'Vença o chefão de cada arena.', ok: f => typeof ARENAS !== 'undefined' && ARENAS.every(a => (f.arenas || []).some(x => x.id === a.id && x.vitorias > 0)) },
  { id: 'c_mitico', cat: 'Arenas', ic: '✨', nome: 'Caçador de Míticos', desc: 'Ganhou um item mítico numa arena.', dica: 'Os chefões de arena às vezes deixam cair um item mítico.', ok: f => (f.arenas || []).some(a => a.miticos > 0) },
);
// jornada
for (const [n, nome, ic] of [[25, 'Profissional', '⚽'], [50, 'Craque em Ascensão', '⭐'], [100, 'Estrela Internacional', '🌟'], [200, 'Lenda Viva', '🔥'], [300, 'Mito de Atlântida', '🔱'], [400, 'Estrela da Galáxia', '🌌']])
  CONQUISTAS.push({ id: 'c_nivel_' + n, cat: 'Jornada', ic, nome, desc: `Chegou ao nível ${n}.`, dica: `Alcance o nível ${n}.`, ok: f => (f.nivel || 0) >= n });
// estatísticas
const est = f => f.estatisticas || {};
CONQUISTAS.push(
  { id: 'c_abates_1k', cat: 'Estatísticas', ic: '💨', nome: 'Driblador Incansável', desc: 'Driblou 1.000 adversários.', dica: 'Drible 1.000 adversários.', ok: f => est(f).abates >= 1000 },
  { id: 'c_abates_10k', cat: 'Estatísticas', ic: '🌪️', nome: 'Mestre do Drible', desc: 'Driblou 10.000 adversários.', dica: 'Drible 10.000 adversários.', ok: f => est(f).abates >= 10000 },
  { id: 'c_chefes_50', cat: 'Estatísticas', ic: '💪', nome: 'Caça-Chefões', desc: 'Venceu 50 chefões.', dica: 'Vença 50 chefões.', ok: f => est(f).chefes >= 50 },
  { id: 'c_gols_100', cat: 'Estatísticas', ic: '🥅', nome: 'Artilheiro', desc: 'Marcou 100 gols.', dica: 'Marque 100 gols.', ok: f => est(f).gols >= 100 },
  { id: 'c_penalti', cat: 'Estatísticas', ic: '🧊', nome: 'Gelo nas Veias', desc: 'Acertou 5 de 5 no desafio de pênaltis.', dica: 'Acerte os 5 pênaltis seguidos.', ok: f => est(f).recordePenalti >= 5 },
  { id: 'c_quiz_100', cat: 'Estatísticas', ic: '🎓', nome: 'Professor da Bola', desc: 'Acertou 100 perguntas do quiz.', dica: 'Acerte 100 perguntas do quiz.', ok: f => est(f).quiz >= 100 },
  { id: 'c_album', cat: 'Estatísticas', ic: '🎴', nome: 'Álbum Completo', desc: 'Completou o álbum de figurinhas.', dica: 'Junte todas as figurinhas do álbum.', ok: f => typeof FIGURINHAS !== 'undefined' && est(f).figurinhas >= FIGURINHAS.length },
  { id: 'c_montarias_5', cat: 'Estatísticas', ic: '🛹', nome: 'Colecionador de Montarias', desc: 'Tem 5 montarias.', dica: 'Consiga 5 montarias.', ok: f => (f.montarias || []).length >= 5 },
  { id: 'c_titulo', cat: 'Estatísticas', ic: '🥇', nome: 'Campeão com o Meu Time', desc: 'Ganhou um título com o seu clube.', dica: 'Seja campeão com o Meu Time.', ok: f => f.time && f.time.titulos > 0 },
);
function conquistasDe(f) { return f ? CONQUISTAS.filter(c => { try { return !!c.ok(f); } catch (e) { return false; } }) : []; }

/* ---------- janela ---------- */
function listaConquistas(f, soGanhas) {
  const tem = new Set(conquistasDe(f).map(c => c.id)); const box = el('div', { class: 'cq-grade' });
  for (const cat of ['Estádios', 'Arenas', 'Jornada', 'Estatísticas']) {
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
  abreModal(el('h2', {}, `🏅 Conquistas — ${n} de ${CONQUISTAS.length}`), el('p', { class: 'vazio' }, 'Os títulos que você ganha aparecem também na sua página de jogador no site (📜 Personagens).'), box,
    el('div', { class: 'opcoes' }, n ? el('button', { class: 'btn amarelo', type: 'button', onclick: () => divulgar({ feito: `Tenho ${n} conquistas no Lenda do Campinho!` }) }, '📣 Divulgar') : null, el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'Fechar')));
}

/* ---------- página do jogador (no jogo e no site) ---------- */
if (typeof paginaFicha === 'function') {
  const _paginaFichaCq = paginaFicha;
  paginaFicha = function (dados) {
    const f = dados && dados.ficha; if (!f) return _paginaFichaCq.apply(this, arguments);
    const arenasSo = (f.arenas || []).filter(a => !/^est_/.test(a.id)); // estádios têm caixa própria
    const partes = _paginaFichaCq.call(this, Object.assign({}, dados, { ficha: Object.assign({}, f, { arenas: arenasSo }) }));
    const ganhas = conquistasDe(f);
    const titulos = el('div', { class: 'tbia-caixa' }, el('div', { class: 'tbia-titulo' }, `🏅 Títulos e conquistas (${ganhas.length} de ${CONQUISTAS.length})`),
      ganhas.length ? el('div', { class: 'cq-selos' }, ...ganhas.map(c => el('span', { class: 'cq-selo', title: c.desc }, `${c.ic} ${c.nome}`))) : el('p', { class: 'tbia-vazio' }, 'Nenhuma conquista ainda.'));
    const estadios = (typeof ESTADIOS !== 'undefined' ? ESTADIOS : []).map(e => { const a = (f.arenas || []).find(x => x.id === e.id); return a && a.vitorias ? [e.nome, e.time, `${a.vitorias} vitória(s)`] : null; }).filter(Boolean);
    const caixaEst = caixaPers('Estádios', estadios, { cabecalho: ['Estádio', 'Time vencido', 'Vitórias'], vazio: 'Nenhum time vencido nos estádios ainda.' });
    for (const p of partes) { const t = p && p.querySelector && p.querySelector('.tbia-titulo'); if (t && t.textContent === 'Conquistas') t.textContent = 'Estatísticas'; } // a caixa antiga de números
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
  banner(`🏅 ${c.nome}`, 'Nova conquista!'); som('nivel');
  for (const k of novas) log(`🏅 CONQUISTA: ${k.nome} — ${k.desc}`, 'l-lendario');
  if (typeof oferecerDivulgar === 'function') oferecerDivulgar({ feito: `Conquistei o título "${c.nome}"!` });
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
    const b = el('button', { class: 'btn', id: 'btnConquistas', type: 'button', role: 'menuitem' }, '🏅 Conquistas');
    b.addEventListener('click', () => modalConquistas());
    const ref = lista.querySelector('[data-abre="album"]'); if (ref) ref.after(b); else lista.prepend(b);
  }
  const grade = document.querySelector('#celMenu .cm-grade');
  if (grade && !document.getElementById('cmConquistas')) grade.append(el('button', { class: 'btn cm-bt', id: 'cmConquistas', type: 'button', onclick: () => { if (typeof fechaMenuCel === 'function') fechaMenuCel(); modalConquistas(); } }, el('span', { class: 'cm-ic' }, '🏅'), 'Conquistas'));
  if (typeof abreFicha === 'function') { const _abreFichaCq = abreFicha; abreFicha = function () { const r = _abreFichaCq.apply(this, arguments); const box = document.getElementById('modalConteudo'); if (box && !box.querySelector('.bt-conq')) { const n = conquistasDe(fichaDoSaveLocal(G.save)).length; box.append(el('div', { class: 'opcoes' }, el('button', { class: 'btn roxo bt-conq', type: 'button', onclick: modalConquistas }, `🏅 Conquistas (${n}/${CONQUISTAS.length})`))); } return r; }; }
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
