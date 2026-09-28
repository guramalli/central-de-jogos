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
    melee: { ic: '👟', rot: 'Colado', cor: '#e8a020', expl: 'Acerta 1 adversário: precisa estar marcado e encostado em você.' },
    dist: { ic: '🎯', rot: 'De longe', cor: '#3a8ae0', expl: `Acerta 1 adversário marcado a até ${dr.alcance || 5} passos, sem nada no caminho.` },
    area: { ic: '💥', rot: 'Em área', cor: '#c04ae0', expl: `Acerta TODOS os adversários em volta de você (raio ${dr.raio || 1}).` },
    cura: { ic: '💚', rot: 'Cura', cor: '#2aa84a', expl: 'Recupera o SEU fôlego. Não precisa de alvo.' },
    buff: { ic: '⚡', rot: 'Reforço', cor: '#d0a010', expl: 'Um efeito bom em você por alguns segundos. Não precisa de alvo.' },
  }[dr.tipo] || { ic: '⭐', rot: 'Especial', cor: '#888', expl: '' };
  const extras = [];
  if (dr.areaAlvo) extras.push(['💥', `em área no alvo (raio ${dr.areaAlvo}) e em todos colados em você`]);
  if (dr.atravessa) extras.push(['➡️', 'atravessa e acerta quem está atrás']);
  if (dr.atordoa) extras.push(['💫', `deixa tonto ${dr.atordoa / 1000} s`]);
  if (dr.efeitoMagia === 'provoca') extras.push(['🛡️', 'puxa os adversários e você toma menos dano']);
  if (dr.efeitoMagia === 'torcida') extras.push(['🎺', 'fica mais rápido e regenera']);
  return Object.assign({}, T, { extras });
}
function seloJogada(dr, curto) {
  const t = tipoJogada(dr); if (!t) return null;
  return el('span', { class: 'selo-jog', style: `background:${t.cor}`, title: t.expl }, `${t.ic} ${t.rot}`, ...(curto ? [] : t.extras.map(([ic, tx]) => el('span', { class: 'selo-extra' }, ` · ${ic} ${tx}`))));
}
function textoJogada(dr) { const t = tipoJogada(dr); return t ? `${t.ic} ${t.rot}: ${t.expl}${t.extras.length ? ' Extra: ' + t.extras.map(x => x[1]).join(', ') + '.' : ''}` : ''; }

/* ---------- janela "Minhas jogadas" ---------- */
function modalJogadas() {
  const s = G.save; if (!s) return;
  const daClasse = dr => !dr.classe || dr.classe === s.classe;
  const lista = Object.entries(DRIBLES).filter(([, dr]) => daClasse(dr)).sort((a, b) => a[1].lvl - b[1].lvl);
  const grupos = [['melee', '👟 Colado (encostado no adversário)'], ['dist', '🎯 De longe'], ['area', '💥 Em área'], ['cura', '💚 Cura'], ['buff', '⚡ Reforço']];
  const corpo = el('div', { class: 'jog-lista' });
  for (const [tipo, titulo] of grupos) {
    const js = lista.filter(([, dr]) => dr.tipo === tipo); if (!js.length) continue;
    corpo.append(el('h3', {}, titulo));
    for (const [id, dr] of js) {
      const tem = s.dribles.includes(id);
      const onde = tem ? '✔ Você sabe' : dr.classe ? `Aprende sozinho no nível ${dr.lvl} (vocação)` : `Aprende sozinho no nível ${dr.lvl}`; // v186: todo drible vem pelo nível
      const num = [`${dr.foco} de foco`, `recarga ${(Math.max(dr.cd, 1000) / 1000).toFixed(dr.cd % 1000 ? 1 : 0)} s`, dr.alcance ? `alcance ${dr.alcance}` : null, dr.raio ? `raio ${dr.raio}` : null, dr.dur ? `dura ${dr.dur / 1000} s` : null].filter(Boolean).join(' · ');
      corpo.append(el('div', { class: 'linha-item' + (tem ? '' : ' bloq') }, iconeClone(iconeDrible(id)),
        el('div', { class: 'nm' }, el('b', {}, dr.nome), seloJogada(dr), el('small', {}, dr.desc), el('small', { class: 'jog-num' }, num)),
        el('small', { class: 'jog-onde' }, onde)));
    }
  }
  abreModal.largo = true;
  abreModal(el('h2', {}, '📖 Minhas jogadas'),
    el('p', { class: 'vazio' }, 'Colado e De longe precisam de um adversário MARCADO (clique nele). Em área acerta todos em volta. Cura e Reforço são em você. Todas gastam FOCO (barra azul) e depois precisam recarregar. Coloque as jogadas na barra de atalhos para usar rápido.'),
    corpo, el('div', { class: 'opcoes' }, el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'Fechar')));
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
    const b = el('button', { class: 'btn', id: 'btnJogadas', type: 'button', role: 'menuitem' }, '📖 Minhas jogadas'); b.addEventListener('click', () => modalJogadas());
    lista.prepend(b);
  }
  const grade = document.querySelector('#celMenu .cm-grade');
  if (grade && !document.getElementById('cmJogadas')) grade.append(el('button', { class: 'btn cm-bt', id: 'cmJogadas', type: 'button', onclick: () => { if (typeof fechaMenuCel === 'function') fechaMenuCel(); modalJogadas(); } }, el('span', { class: 'cm-ic' }, '📖'), 'Jogadas'));
  if (typeof abreFicha === 'function') { const _abreFichaJ = abreFicha; abreFicha = function () { const r = _abreFichaJ.apply(this, arguments); const box = document.getElementById('modalConteudo'); if (box && !box.querySelector('.bt-jogadas')) box.append(el('div', { class: 'opcoes' }, el('button', { class: 'btn roxo bt-jogadas', type: 'button', onclick: modalJogadas }, '📖 Minhas jogadas (tipos: área, cura, de longe...)'))); return r; }; }
}
{
  const st = document.createElement('style');
  st.textContent = `.selo-jog { display: inline-block; color: #fff; font-size: 11px; font-weight: 800; padding: 1px 7px; border-radius: 10px; margin: 2px 0 2px 6px; vertical-align: middle; text-shadow: 0 1px 0 rgba(0,0,0,.35); }
  .selo-extra { font-weight: 700; } .jog-num { display: block; opacity: .8; } .jog-onde { min-width: 120px; text-align: right; font-weight: 700; }
  .slot .tipo-j { position: absolute; right: 1px; bottom: 1px; font-size: 11px; line-height: 1; filter: drop-shadow(0 1px 0 rgba(0,0,0,.6)); pointer-events: none; }`;
  document.head.append(st);
}
