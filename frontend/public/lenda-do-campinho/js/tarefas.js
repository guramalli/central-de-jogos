/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🎯 TAREFAS DE CAÇA (v209), como o sistema do Tibia de 2025:
   - CAÇADA DA VEZ (Bounty): 3 adversários do seu nível sorteados; você escolhe
     1 e vence N deles. Prêmio: XP extra + pontos de tarefa. Troca grátis 1x por
     dia (depois custa 3 pontos).
   - SEMANAIS: 6 tarefas que mudam toda segunda-feira. Cada uma dá pontos e XP;
     fazendo as 6, bônus de pontos.
   - LOJA DE PONTOS: garrafas, isotônicos, tostões, figurinhas e bônus de XP.
   Só entram adversários do seu nível que você consegue alcançar (mapas liberados
   ou que você já enfrentou). Carregar DEPOIS de pocoes.js e analisador.js.
   ============================================================ */
const TAR_BOUNTY_N = 60, TAR_BOUNTY_PTS = 10, TAR_SEM_PTS = 6, TAR_SEM_BONUS = 20, TAR_TROCA_PTS = 3;
function tarDados() {
  const s = G.save; if (!s.tarefas) s.tarefas = { pts: 0, bounty: null, opcoes: null, trocaDia: '', semana: null, bonusXpMs: 0 };
  return s.tarefas;
}
function tarHoje() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function tarSemanaId() { const d = new Date(); const seg = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7)); return `${seg.getFullYear()}-${seg.getMonth() + 1}-${seg.getDate()}`; } // a semana começa na segunda
// adversários que servem: do seu nível, com lugar para caçar que você alcança
function tarCandidatos(min = 3, semLimite = false) {
  const s = G.save, nv = s.nivel, idx = indice();
  const todos = Object.entries(MONSTROS).filter(([id, d]) => d && !d.chefe && !d.treino && !d.pedra && !d.arena && d.xp > 0 && idx.spawn[id] && !/^est_/.test(id)).map(([id, d]) => ({ id, d, nv: nivelMonstro(d) }));
  const alcanca = x => {
    if (typeof tarMapaBloqueado === 'function' && tarMapaBloqueado(idx.spawn[x.id].mapa)) return false; // v345: mapa travado (ex.: Expansão da versão Steam)
    if ((s.kills[x.id] || 0) > 0) return true; // já enfrentou: sabe chegar lá
    const mapa = idx.spawn[x.id].mapa; const caca = typeof CACA_POR_ID !== 'undefined' && CACA_POR_ID[mapa]; const casa = caca ? caca.host : mapa;
    // v251: cidades do mundo (voo liberado: nível + contrato/fama) e Atlântida também contam — antes só o Brasil contava
    // e quem estava no nível 120 recebia tarefas do Estádio (nível 36–57), sempre as mesmas
    if (typeof VOOS !== 'undefined' && VOOS[casa] && casa !== 'cidade') { try { return s.nivel >= VOOS[casa].lvl && (typeof podeViajar !== 'function' || podeViajar(casa).ok); } catch (e) { return false; } }
    if (casa === 'atlantida') return s.nivel >= (typeof ATL_NIVEL !== 'undefined' ? ATL_NIVEL : 195);
    // v338: os planetas (Lua, Marte, Saturno, Nebulosa) e o Multiverso também contam — antes ficavam de fora e quem estava
    // no nível 355 recebia sempre Yeti e Touro (Atlântida, ~270), os mais "próximos" que o jogo achava
    if (typeof PLANETAS !== 'undefined') { const p = PLANETAS.find(x => x.id === casa); if (p) return s.nivel >= p.req; }
    if (['pedraforte', 'picos_nublados', 'torre_infinita', 'multiverso'].includes(casa) && typeof mvPodeIr === 'function') return !mvPodeIr();
    return Object.prototype.hasOwnProperty.call(MAPAS_FLAG, casa) && (!MAPAS_FLAG[casa] || s.flags[MAPAS_FLAG[casa]]);
  };
  let l = [];
  for (const [a, b] of [[-8, 4], [-14, 6], [-20, 8], [-30, 10]]) { l = todos.filter(x => x.nv >= nv + a && x.nv <= nv + b && alcanca(x)); if (l.length >= min) return l; }
  if (l.length >= 3 && !semLimite) return l; // v251: com 3 ou mais até 30 níveis abaixo, não desce mais que isso
  return todos.filter(alcanca).sort((a, b) => Math.abs(a.nv - nv) - Math.abs(b.nv - nv)).slice(0, 6);
}
function tarSorteia(n, evita = []) {
  // v251: evita repetir os adversários das últimas tarefas (usa os repetidos só se não houver outros do seu nível)
  const t = G.save && G.save.tarefas, rec = (t && t.recentes) || [];
  const l = tarCandidatos(Math.max(6, n + evita.length)).filter(x => !evita.includes(x.id)); const out = [];
  for (const pool of [l.filter(x => !rec.includes(x.id)), l.filter(x => rec.includes(x.id))])
    while (pool.length && out.length < n) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0].id);
  if (out.length < n) { // poucos adversários do seu nível alcançáveis: completa com os mais próximos (as semanais precisam de 6)
    const nv = G.save.nivel; const resto = Object.keys(MONSTROS).filter(id => !out.includes(id) && !evita.includes(id)).map(id => ({ id, nv: nivelMonstro(MONSTROS[id]) }));
    const ok = new Set(tarCandidatos(99, true).map(x => x.id)); resto.filter(x => ok.has(x.id)).sort((a, b) => Math.abs(a.nv - nv) - Math.abs(b.nv - nv)).forEach(x => { if (out.length < n) out.push(x.id); });
  }
  if (t) t.recentes = rec.filter(id => !out.includes(id)).concat(out).slice(-9);
  return out;
}
const tarNome = id => (MONSTROS[id] && MONSTROS[id].nome) || id;
function tarXp(id, n, k) { const d = MONSTROS[id]; return Math.round((d ? d.xp : 10) * n * k); }
function tarOndeFica(id) { const sp = indice().spawn[id]; if (!sp) return ''; try { return getMapa(sp.mapa).nome.split(' —')[0]; } catch (e) { return ''; } }
// a semana nova chega sozinha
function tarConfereSemana() {
  const t = tarDados(), id = tarSemanaId();
  if (!t.semana || t.semana.id !== id) {
    const tipos = tarSorteia(6);
    t.semana = { id, bonus: false, lista: tipos.map((tp, i) => { const n = [25, 30, 40, 50, 60, 80][i] || 40; return { tipo: tp, n, p: 0, feita: false }; }) };
  }
  if (!t.bounty && (!t.opcoes || !t.opcoes.length)) t.opcoes = tarSorteia(3);
  // v338 (uma vez): tarefas sorteadas antes da correção dos planetas, muito abaixo do seu nível, são trocadas
  // (só as que ainda não começaram — nada de perder progresso)
  if (!t.revisaPlanetas) {
    t.revisaPlanetas = true; const nv = G.save.nivel, baixo = id => MONSTROS[id] && nivelMonstro(MONSTROS[id]) < nv - 30;
    const nivelOk = new Set(tarCandidatos(3).map(x => x.id)); if (!nivelOk.size || [...nivelOk].every(baixo)) return; // nada melhor para oferecer
    if (!t.bounty && (t.opcoes || []).some(baixo)) t.opcoes = tarSorteia(3);
    if (t.semana) { const usados = t.semana.lista.map(q => q.tipo); for (const q of t.semana.lista) if (!q.feita && !q.p && baixo(q.tipo)) { const [novo] = tarSorteia(1, usados); if (novo && !baixo(novo)) { usados.push(novo); q.tipo = novo; } } }
  }
}
// vitórias contam para as tarefas
{
  const _matarTar = matar;
  matar = function (m) {
    const r = _matarTar.apply(this, arguments);
    try {
      if (!G.save || !m || !m.tipo) return r; const t = tarDados();
      const b = t.bounty;
      if (b && b.tipo === m.tipo && b.p < b.n) {
        b.p++; G.uiSujo = true;
        if (b.p >= b.n) {
          ganhaXp(b.xp); t.pts += TAR_BOUNTY_PTS; t.bounty = null; t.opcoes = tarSorteia(3); if (typeof carreiraEvento === 'function') carreiraEvento('tarefa', {});
          const msg = `🎯 Caçada da vez completa! +${fmt(b.xp)} XP e +${TAR_BOUNTY_PTS} pontos de tarefa. Escolha a próxima em 🎯 Tarefas de caça.`;
          log(msg, 'l-xp'); if (typeof avisoTela === 'function') avisoTela(msg, 'l-xp'); som('nivel');
        } else if (b.p % 10 === 0 && typeof avisoTela === 'function') avisoTela(`🎯 Caçada da vez: ${b.p}/${b.n} ${tarNome(b.tipo)}`, 'l-info');
      }
      const sem = t.semana;
      if (sem) for (const q of sem.lista) if (!q.feita && q.tipo === m.tipo) {
        q.p++;
        if (q.p >= q.n) {
          q.feita = true; t.pts += TAR_SEM_PTS; if (typeof carreiraEvento === 'function') carreiraEvento('tarefaSemana', {}); const xp = tarXp(q.tipo, q.n, 0.6); ganhaXp(xp);
          log(`📅 Tarefa da semana feita: ${q.n} ${tarNome(q.tipo)}! +${fmt(xp)} XP e +${TAR_SEM_PTS} pontos.`, 'l-xp'); if (typeof avisoTela === 'function') avisoTela(`📅 Tarefa da semana feita: ${tarNome(q.tipo)}! +${TAR_SEM_PTS} pontos`, 'l-xp');
          if (!sem.bonus && sem.lista.every(x => x.feita)) { sem.bonus = true; t.pts += TAR_SEM_BONUS; log(`🏆 Todas as tarefas da semana! +${TAR_SEM_BONUS} pontos de bônus.`, 'l-lvl'); banner('SEMANA COMPLETA!', `+${TAR_SEM_BONUS} pontos de tarefa`); }
        }
      }
    } catch (e) { }
    return r;
  };
}
// bônus de XP comprado na loja: +30% enquanto durar (só conta o tempo jogando)
{
  const _ganhaXpTar = ganhaXp;
  ganhaXp = function (n) { const s = G.save; if (s && s.tarefas && s.tarefas.bonusXpMs > 0 && n > 0) arguments[0] = Math.round(n * 1.3); return _ganhaXpTar.apply(this, arguments); };
  const _atualizaTar = atualiza;
  atualiza = function (dt) {
    const s = G.save; const t = s && s.tarefas;
    if (t && t.bonusXpMs > 0 && G.rodando && !G.pausado) { t.bonusXpMs -= dt || 16; if (t.bonusXpMs <= 0) { t.bonusXpMs = 0; log('⏰ O bônus de XP acabou.', 'l-sis'); } }
    return _atualizaTar.apply(this, arguments);
  };
}
// a melhor garrafa/isotônico que o nível permite
function tarMelhor(stat) {
  const L = LINHAS_RECUP.find(l => l.stat === stat); if (!L) return null; const nv = G.save.nivel; let melhor = L.ids[0];
  for (const id of L.ids) if (ITENS[id] && (ITENS[id].lvl || 0) <= nv) melhor = id; return melhor;
}
const TAR_LOJA = [
  { id: 'folego', pts: 15, nome: () => `10× ${ITENS[tarMelhor('hp')].nome}`, da: () => recebeItem(tarMelhor('hp'), 10) },
  { id: 'foco', pts: 15, nome: () => `10× ${ITENS[tarMelhor('foco')].nome}`, da: () => recebeItem(tarMelhor('foco'), 10) },
  { id: 'ouro', pts: 10, nome: () => `${fmt(G.save.nivel * 250)} tostões`, da: () => { G.save.ouro += G.save.nivel * 250; } },
  { id: 'figs', pts: 12, nome: () => '3 Pacotinhos de Figurinhas', da: () => recebeItem('pacotinho', 3) },
  { id: 'xp', pts: 25, nome: () => 'Bônus de XP: +30% por 30 minutos de jogo', da: () => { tarDados().bonusXpMs += 30 * 60000; } },
];
function modalTarefas(aba = 'vez') {
  const s = G.save; if (!s) return; tarConfereSemana(); const t = tarDados();
  const abas = el('div', { class: 'opcoes tar-abas' }, ...[['vez', '🎯 Caçada da vez'], ['semana', '📅 Da semana'], ['loja', `🛒 Loja (${t.pts} pontos)`]].map(([k, r]) => el('button', { class: 'btn' + (k === aba ? ' amarelo' : ''), type: 'button', onclick: () => modalTarefas(k) }, r)));
  const corpo = el('div', { class: 'tar-corpo' });
  if (aba === 'vez') {
    if (t.bounty) {
      const b = t.bounty;
      corpo.append(el('div', { class: 'tar-card ativa' }, el('b', {}, `Vença ${b.n} ${tarNome(b.tipo)}`), el('div', { class: 'tar-bar' }, el('i', { style: `width:${Math.round(b.p / b.n * 100)}%` })),
        el('small', {}, `${b.p}/${b.n} · onde: ${tarOndeFica(b.tipo)} · prêmio: ${fmt(b.xp)} XP e ${TAR_BOUNTY_PTS} pontos`)),
        el('div', { class: 'opcoes' }, el('button', { class: 'btn mini', type: 'button', onclick: () => { t.bounty = null; t.opcoes = tarSorteia(3); G.uiSujo = true; modalTarefas('vez'); } }, 'Desistir desta caçada')));
    } else {
      corpo.append(el('p', {}, 'Escolha um adversário para caçar. Vencendo todos, você ganha XP extra e pontos de tarefa.'));
      for (const tp of t.opcoes || []) {
        const d = MONSTROS[tp]; const xp = tarXp(tp, TAR_BOUNTY_N, 1);
        corpo.append(el('div', { class: 'tar-card' }, el('div', {}, el('b', {}, `${TAR_BOUNTY_N}× ${tarNome(tp)}`), el('small', {}, ` Nv ${nivelMonstro(d)} · ${tarOndeFica(tp)}`), el('div', { class: 'tar-premio' }, `Prêmio: ${fmt(xp)} XP + ${TAR_BOUNTY_PTS} pontos`)),
          el('button', { class: 'btn verde mini', type: 'button', onclick: () => { t.bounty = { tipo: tp, n: TAR_BOUNTY_N, p: 0, xp }; t.opcoes = null; salvar(); G.uiSujo = true; modalTarefas('vez'); } }, 'Caçar este')));
      }
      const gratis = t.trocaDia !== tarHoje();
      corpo.append(el('div', { class: 'opcoes' }, el('button', { class: 'btn mini', type: 'button', disabled: !gratis && t.pts < TAR_TROCA_PTS ? 'disabled' : null, onclick: () => { if (gratis) t.trocaDia = tarHoje(); else t.pts -= TAR_TROCA_PTS; t.opcoes = tarSorteia(3, t.opcoes || []); modalTarefas('vez'); } }, gratis ? '🔄 Sortear outros (grátis hoje)' : `🔄 Sortear outros (${TAR_TROCA_PTS} pontos)`)));
    }
  } else if (aba === 'semana') {
    const sem = t.semana;
    corpo.append(el('p', {}, `Mudam toda segunda-feira. Cada uma vale ${TAR_SEM_PTS} pontos e XP; fazendo as 6, mais ${TAR_SEM_BONUS} pontos.`));
    for (const q of sem.lista) corpo.append(el('div', { class: 'tar-card' + (q.feita ? ' feita' : '') }, el('div', {}, el('b', {}, `${q.feita ? '✔ ' : ''}Vença ${q.n} ${tarNome(q.tipo)}`), el('small', {}, ` · ${tarOndeFica(q.tipo)}`),
      el('div', { class: 'tar-bar' }, el('i', { style: `width:${Math.round(Math.min(q.p, q.n) / q.n * 100)}%` })), el('small', {}, `${Math.min(q.p, q.n)}/${q.n}`))));
    if (sem.bonus) corpo.append(el('p', { class: 'dica' }, '🏆 Semana completa! Volte na segunda para novas tarefas.'));
  } else {
    corpo.append(el('p', {}, `Você tem ${t.pts} pontos de tarefa.${t.bonusXpMs > 0 ? ` Bônus de XP ativo: faltam ${Math.ceil(t.bonusXpMs / 60000)} min.` : ''}`));
    for (const o of TAR_LOJA) if (!o.mostra || o.mostra()) corpo.append(el('div', { class: 'tar-card' }, el('b', {}, o.nome()), el('button', { class: 'btn amarelo mini', type: 'button', disabled: t.pts < o.pts ? 'disabled' : null, onclick: () => { if (t.pts < o.pts) return; t.pts -= o.pts; o.da(); log(`🛒 Trocou ${o.pts} pontos por: ${o.nome()}.`, 'l-loot'); som('moeda'); salvar(); G.uiSujo = true; modalTarefas('loja'); } }, `${o.pts} pontos`)));
  }
  abreModal.largo = true;
  abreModal(el('h2', {}, '🎯 Tarefas de caça'), abas, corpo, el('div', { class: 'opcoes' }, el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'Fechar')));
}
{
  const poe = () => {
    const lista = document.querySelector('#topo .tb-lista');
    if (lista && !document.getElementById('btnTarefas')) lista.prepend(el('button', { class: 'btn', id: 'btnTarefas', type: 'button', role: 'menuitem', onclick: () => { if (G.save) modalTarefas(); } }, '🎯 Tarefas de caça'));
    const grade = document.querySelector('#celMenu .cm-grade');
    if (grade && !document.getElementById('cmTarefas')) grade.prepend(el('button', { class: 'btn cm-bt', id: 'cmTarefas', type: 'button', onclick: () => { if (typeof fechaMenuCel === 'function') fechaMenuCel(); if (G.save) modalTarefas(); } }, el('span', { class: 'cm-ic' }, '🎯'), 'Tarefas'));
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(poe, 0)); else setTimeout(poe, 0);
  const _iniTar = iniciarJogo; iniciarJogo = async function () { const r = await _iniTar.apply(this, arguments); poe(); try { tarConfereSemana(); } catch (e) { } return r; };
  const st = document.createElement('style');
  st.textContent = `.tar-corpo { display: grid; gap: 8px; } .tar-abas .btn { min-width: 140px; }
  .tar-card { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 12px; border-radius: 10px; background: rgba(0,0,0,.05); }
  .tar-card > div { flex: 1; } .tar-card.ativa { display: grid; background: rgba(255,210,63,.25); } .tar-card.feita { opacity: .7; }
  .tar-premio { font-size: 13px; opacity: .85; } .tar-bar { height: 8px; background: rgba(0,0,0,.12); border-radius: 4px; overflow: hidden; margin: 4px 0; } .tar-bar i { display: block; height: 100%; background: #3aa84a; }`;
  document.head.append(st);
}
// v214: andamento da caçada da vez ao lado da etiqueta "📜 Missões" (canto de baixo da tela); clicar abre as Tarefas
{
  const _rastTar = atualizaRastreador;
  atualizaRastreador = function () {
    const r = _rastTar.apply(this, arguments);
    const R = document.getElementById('rastreador'), b = G.save && G.save.tarefas && G.save.tarefas.bounty;
    if (!R || !b) return r;
    const pc = Math.round(Math.min(b.p, b.n) / b.n * 100);
    const bt = el('button', { class: 'btn mini rast-tarefa', type: 'button', title: `Caçada da vez: vença ${b.n} ${tarNome(b.tipo)} (${tarOndeFica(b.tipo)}). Clique para ver as tarefas.`, onclick: ev => { ev.stopPropagation(); modalTarefas('vez'); } },
      el('span', {}, `🎯 ${b.p}/${b.n} ${tarNome(b.tipo)}`), el('i', { class: 'rt-bar' }, el('i', { style: `width:${pc}%` })));
    const et = R.querySelector(':scope > .rast-etiqueta');
    if (et) { const linha = el('div', { class: 'rast-linha' }); et.replaceWith(linha); linha.append(et, bt); }
    else if (getComputedStyle(R).flexDirection === 'column-reverse') R.insertBefore(bt, R.querySelector(':scope > .rast') || null); else R.append(bt);
    return r;
  };
  const st = document.createElement('style');
  st.textContent = `#rastreador .rast-linha { display: flex; gap: 5px; align-items: center; flex-wrap: wrap; pointer-events: none; }
  #rastreador .rast-linha .rast-etiqueta { align-self: auto; }
  #rastreador .rast-tarefa { pointer-events: auto; align-self: flex-start; margin: 3px 0; opacity: .92; font-size: 13px; padding: 4px 10px 6px; position: relative; max-width: 260px; }
  #rastreador .rast-tarefa > span { display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  #rastreador .rast-tarefa .rt-bar { position: absolute; left: 8px; right: 8px; bottom: 2px; height: 3px; border-radius: 2px; background: rgba(0,0,0,.3); overflow: hidden; }
  #rastreador .rast-tarefa .rt-bar i { display: block; height: 100%; background: #6aff9a; }`;
  document.head.append(st);
}

/* v251: ao entrar, as opções da Caçada da Vez e as semanais AINDA NÃO COMEÇADAS que ficaram muito abaixo do seu nível
   (sorteadas antes da correção das cidades do mundo) são sorteadas de novo. Progresso e caçada ativa não mudam. */
{
  const _iniTarV251 = iniciarJogo;
  iniciarJogo = async function (...a) {
    const r = await _iniTarV251.apply(this, a);
    try {
      const s = G.save, t = s && s.tarefas; if (!t) return r;
      const baixo = id => MONSTROS[id] && nivelMonstro(MONSTROS[id]) < s.nivel - 15;
      if (!t.bounty && t.opcoes && t.opcoes.length && t.opcoes.some(baixo)) t.opcoes = tarSorteia(3);
      if (t.semana && Array.isArray(t.semana.lista)) {
        const trocar = t.semana.lista.filter(x => !x.feita && !x.p && baixo(x.tipo));
        if (trocar.length) { const novos = tarSorteia(trocar.length, t.semana.lista.filter(x => !trocar.includes(x)).map(x => x.tipo)); trocar.forEach((x, i) => { if (novos[i]) x.tipo = novos[i]; }); }
      }
    } catch (e) { }
    return r;
  };
}
