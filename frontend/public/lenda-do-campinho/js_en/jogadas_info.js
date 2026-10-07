/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   📖 JOGADAS EXPLICADAS (v160): cada jogada mostra de que TIPO é
   (colado, de longe, em área, cura, reforço) e o que mais faz (deixa tonto,
   atravessa...). Selo na barra de atalhos, no professor e na janela
   "Minhas jogadas" (☰ Mais, menu do celular e Ficha).
   Carregar DEPOIS de vocacoes.js e ui.js.
   ============================================================ */
function tipoJogada(dr) {
  if (!dr) return null;
  const T = {
    melee: { k: 'perto', ic: '👟', rot: 'Close', cor: '#e8841a', expl: 'Hits 1 opponent: they must be targeted and right next to you.' },
    dist: { k: 'longe', ic: '🎯', rot: 'Far', cor: '#2f7fe0', expl: `Hits 1 targeted opponent up to ${dr.alcance || 5} steps away, with nothing in the way.` },
    area: { k: 'area', ic: '💥', rot: 'Area', cor: '#b04ae0', expl: `Hits ALL opponents around you (radius ${dr.raio || 1}).` },
    cura: { k: 'cura', ic: '💚', rot: 'Heal', cor: '#25a84a', expl: 'Restores YOUR stamina. No target needed.' },
    buff: { k: 'reforco', ic: '⚡', rot: 'Boost', cor: '#d4a010', expl: 'A good effect on you for a few seconds. No target needed.' },
  }[dr.tipo] || { k: 'reforco', ic: '⭐', rot: 'Special', cor: '#888', expl: '' };
  // v267: de longe mas acerta um grupo (Chuva de Bolas, Toque de Mestre...) = ÁREA de longe
  if (dr.tipo === 'dist' && dr.areaAlvo) Object.assign(T, { k: 'area', ic: '💥', rot: 'Long-range area', cor: '#b04ae0', expl: `Shoots from far away (up to ${dr.alcance || 5} steps) and hits the target and EVERYONE around it.` });
  const extras = [];
  if (dr.areaAlvo) extras.push(['💥', `area hit on the target (radius ${dr.areaAlvo}) and on everyone right next to you`]);
  if (dr.atravessa) extras.push(['➡️', 'goes through and hits whoever is behind']);
  if (dr.atordoa) extras.push(['💫', `deixa tonto ${dr.atordoa / 1000} s`]);
  if (dr.efeitoMagia === 'provoca') extras.push(['🛡️', 'pulls opponents in and you take less damage']);
  if (dr.efeitoMagia === 'torcida') extras.push(['🎺', 'gets faster and regenerates']);
  return Object.assign({}, T, { extras });
}
function seloJogada(dr, curto) {
  const t = tipoJogada(dr); if (!t) return null;
  return el('span', { class: 'selo-jog', style: `background:${t.cor}`, title: t.expl }, `${t.ic} ${t.rot}`, ...(curto ? [] : t.extras.map(([ic, tx]) => el('span', { class: 'selo-extra' }, ` · ${ic} ${tx}`))));
}
// v267: nome curto (faixa da barra) e a ordem dos grupos
const TJ_FAIXA = { perto: 'CLOSE', longe: 'FAR', area: 'AREA', cura: 'HEAL', reforco: 'BOOST' };
const TJ_GRUPOS = [['perto', '👟 Close', 'right next to the targeted opponent', '#e8841a'], ['area', '💥 Area', 'hits several at once', '#b04ae0'], ['longe', '🎯 Far', 'one targeted opponent, at a distance', '#2f7fe0'], ['cura', '💚 Heal', 'restores your stamina (HP)', '#25a84a'], ['reforco', '⚡ Boost', 'effect on you, no target', '#d4a010']];
function legendaTiposJogada() { return el('div', { class: 'legenda-tj' }, TJ_GRUPOS.map(([k, nome, , cor]) => el('span', { style: `background:${cor}` }, nome))); }
function textoJogada(dr) { const t = tipoJogada(dr); return t ? `${t.ic} ${t.rot}: ${t.expl}${t.extras.length ? ' Extra: ' + t.extras.map(x => x[1]).join(', ') + '.' : ''}` : ''; }

/* ---------- janela "Minhas jogadas" ---------- */
function modalJogadas() {
  const s = G.save; if (!s) return;
  const daClasse = dr => !dr.classe || dr.classe === s.classe;
  const lista = Object.entries(DRIBLES).filter(([, dr]) => daClasse(dr)).sort((a, b) => a[1].lvl - b[1].lvl);
  const grupos = [['melee', '👟 Close (right next to the opponent)'], ['dist', '🎯 Far'], ['area', '💥 Area'], ['cura', '💚 Heal'], ['buff', '⚡ Boost']];
  const corpo = el('div', { class: 'jog-lista' });
  for (const [tipo, titulo] of grupos) {
    const js = lista.filter(([, dr]) => dr.tipo === tipo); if (!js.length) continue;
    corpo.append(el('h3', {}, titulo));
    for (const [id, dr] of js) {
      const tem = s.dribles.includes(id);
      const onde = tem ? '✔ You know it' : dr.classe ? `Learned automatically at level ${dr.lvl} (class move)` : `Learned automatically at level ${dr.lvl}`; // v186: todo drible vem pelo nível
      const num = [`${dr.foco} focus`, `recarga ${(Math.max(dr.cd, 1000) / 1000).toFixed(dr.cd % 1000 ? 1 : 0)} s`, dr.alcance ? `alcance ${dr.alcance}` : null, dr.raio ? `raio ${dr.raio}` : null, dr.dur ? `dura ${dr.dur / 1000} s` : null].filter(Boolean).join(' · ');
      corpo.append(el('div', { class: 'linha-item' + (tem ? '' : ' bloq') }, iconeClone(iconeDrible(id)),
        el('div', { class: 'nm' }, el('b', {}, dr.nome), seloJogada(dr), el('small', {}, dr.desc), el('small', { class: 'jog-num' }, num)),
        el('small', { class: 'jog-onde' }, onde)));
    }
  }
  abreModal.largo = true;
  abreModal(el('h2', {}, '📖 My moves'),
    el('p', { class: 'vazio' }, 'Close and Far need a TARGETED opponent (click on them). Area hits several at once. Heal and Boost work on you. They all cost FOCUS (blue bar) and then need to recharge. Put your moves on the hotbar to use them quickly.'),
    corpo, el('div', { class: 'opcoes' }, el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'Close')));
}

/* ---------- professor: selo em cada jogada ---------- */
if (typeof modalProfessor === 'function') {
  const _modalProfessorJ = modalProfessor;
  modalProfessor = function (npc) {
    const r = _modalProfessorJ.apply(this, arguments);
    for (const li of document.querySelectorAll('#modalConteudo .lista .linha-item')) {
      const nome = (li.querySelector('.nm b') || {}).textContent; const dr = Object.values(DRIBLES).find(d => d.nome === nome);
      if (dr && !li.querySelector('.selo-jog')) li.querySelector('.nm b').after(seloJogada(dr));
    }
    return r;
  };
}

/* ---------- botões ---------- */
{
  const lista = document.querySelector('.tb-lista');
  if (lista && !document.getElementById('btnJogadas')) {
    const b = el('button', { class: 'btn', id: 'btnJogadas', type: 'button', role: 'menuitem' }, '📖 My moves'); b.addEventListener('click', () => modalJogadas());
    lista.prepend(b);
  }
  const grade = document.querySelector('#celMenu .cm-grade');
  if (grade && !document.getElementById('cmJogadas')) grade.append(el('button', { class: 'btn cm-bt', id: 'cmJogadas', type: 'button', onclick: () => { if (typeof fechaMenuCel === 'function') fechaMenuCel(); modalJogadas(); } }, el('span', { class: 'cm-ic' }, '📖'), 'Moves'));
  if (typeof abreFicha === 'function') { const _abreFichaJ = abreFicha; abreFicha = function () { const r = _abreFichaJ.apply(this, arguments); const box = document.getElementById('modalConteudo'); if (box && !box.querySelector('.bt-jogadas')) box.append(el('div', { class: 'opcoes' }, el('button', { class: 'btn roxo bt-jogadas', type: 'button', onclick: modalJogadas }, '📖 My moves (types: area, heal, long-range...)'))); return r; }; }
}
{
  const st = document.createElement('style');
  st.textContent = `.selo-jog { display: inline-block; color: #fff; font-size: 11px; font-weight: 800; padding: 1px 7px; border-radius: 10px; margin: 2px 0 2px 6px; vertical-align: middle; text-shadow: 0 1px 0 rgba(0,0,0,.35); }
  .selo-extra { font-weight: 700; } .jog-num { display: block; opacity: .8; } .jog-onde { min-width: 120px; text-align: right; font-weight: 700; }
  .slot .tipo-j { position: absolute; right: 1px; bottom: 1px; font-size: 11px; line-height: 1; filter: drop-shadow(0 1px 0 rgba(0,0,0,.6)); pointer-events: none; }
  /* v267: cada tipo de jogada com cor própria — faixa embaixo do atalho e grupos na lista de Habilidades */
  #hotbar .slot.tj { box-shadow: inset 0 0 0 3px var(--tj); }
  #hotbar .slot .faixa-tj { position: absolute; left: 0; right: 0; bottom: 0; background: var(--tj); color: #fff; font: 900 8.5px/1.35 Nunito, sans-serif; letter-spacing: .3px; text-align: center; text-shadow: 0 1px 0 rgba(0,0,0,.45); pointer-events: none; border-radius: 0 0 4px 4px; }
  .dribles-lista .grupo-tj { margin: 8px 0 3px; padding: 3px 8px; border-radius: 6px; background: var(--tj); color: #fff; font: 800 12.5px Nunito, sans-serif; text-shadow: 0 1px 0 rgba(0,0,0,.35); }
  .dribles-lista .grupo-tj small { font-weight: 700; opacity: .95; }
  .drible-card.tj { border-left: 5px solid var(--tj) !important; }
  @media (max-width: 600px) { #hotbar .slot .faixa-tj { font-size: 6.5px; letter-spacing: 0; } #hotbar .slot.tj { box-shadow: inset 0 0 0 2px var(--tj); } }
  .legenda-tj { display: flex; flex-wrap: wrap; gap: 3px; margin: 3px 0 2px; } .legenda-tj span { color: #fff; font: 800 10.5px Nunito, sans-serif; padding: 1px 6px; border-radius: 8px; text-shadow: 0 1px 0 rgba(0,0,0,.35); }`;
  document.head.append(st);
}
