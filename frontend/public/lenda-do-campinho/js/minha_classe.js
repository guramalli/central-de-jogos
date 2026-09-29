/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🎓 MINHA CLASSE (v166): o que o seu personagem é, a especialidade,
   as deficiências, quais atributos subir (e como estão os seus), o jeito
   certo de jogar, o especial (Shift) e as magias da classe.
   Abre pela Ficha, pelo ☰ Mais e pelo menu do celular.
   Carregar DEPOIS de vocacoes.js e jogadas_info.js.
   ============================================================ */
const CLASSE_GUIA = {
  paredao: { sobe: ['defesa', 'folego'], modo: 'drible', jeito: 'Jogue COLADO no adversário (modo Drible, tecla X). Você aguenta o tranco: chame a marcação e segure vários de uma vez.' },
  driblador: { sobe: ['habilidade', 'folego'], modo: 'chute', jeito: 'Jogue de LONGE (modo Chute, tecla X). Mantenha distância: quando o adversário encostar, dê uns passos para trás e volte a chutar.' },
  cerebro: { sobe: ['inteligencia', 'habilidade'], modo: 'chute', jeito: 'Jogue de longe e use as jogadas especiais: você tem muito foco. Hipnotize quem chegar perto e use as jogadas em área nos grupos.' },
  motorzinho: { sobe: ['folego', 'inteligencia'], modo: 'drible', jeito: 'Você cansa pouco e se cura muito: aguente as lutas longas, use a Raiz do Campo nos grupos e cure-se sempre que o fôlego baixar.' },
};
function modalMinhaClasse() {
  const s = G.save; if (!s) return;
  if (!s.classe) { if (typeof modalEscolheClasse === 'function') modalEscolheClasse(true); return; }
  const c = CLASSES[s.classe], v = (typeof VOCACAO !== 'undefined' && VOCACAO[s.classe]) || {}, g = CLASSE_GUIA[s.classe] || { sobe: [c.principal], jeito: '' };
  const st = stats();
  // atributos: os recomendados com ⭐ e a barra de cada um
  const attrs = el('div', { class: 'mc-attrs' });
  const maxA = Math.max(...Object.keys(ATRIBUTOS).map(k => (st.atr && st.atr[k]) || s.atr[k] || 0), 1);
  for (const k of Object.keys(ATRIBUTOS)) {
    const a = ATRIBUTOS[k]; const val = (st.atr && st.atr[k]) || s.atr[k] || 0; const i = g.sobe.indexOf(k);
    const tag = i === 0 ? '⭐ o mais importante' : i === 1 ? '⭐ também bom' : '';
    attrs.append(el('div', { class: 'mc-attr' + (i >= 0 ? ' rec' : '') },
      el('span', { class: 'mc-ic' }, a.icone), el('div', {}, el('b', {}, `${a.nome} `, el('small', {}, tag)), el('small', {}, a.desc),
        el('div', { class: 'mc-bar' }, el('i', { style: `width:${Math.round(val / maxA * 100)}%;background:${a.cor}` }))), el('b', { class: 'mc-val' }, val)));
  }
  const pontos = s.pontos || 0;
  const dicaPts = pontos ? el('p', { class: 'mc-pts' }, `Você tem ${pontos} ponto(s) para distribuir! Para um ${c.nome}, coloque em ${ATRIBUTOS[g.sobe[0]].nome}${g.sobe[1] ? ' e ' + ATRIBUTOS[g.sobe[1]].nome : ''}.`, ' ', el('button', { class: 'btn verde mini', type: 'button', onclick: () => { fechaModal(); abreFicha(); } }, 'Distribuir agora')) : null;
  // magias da classe
  const mags = el('div', { class: 'lista' });
  for (const id of (v.magias || [])) {
    const dr = DRIBLES[id]; if (!dr) continue; const tem = s.dribles.includes(id);
    mags.append(el('div', { class: 'linha-item' + (tem ? '' : ' bloq') }, iconeClone(iconeDrible(id)), el('div', { class: 'nm' }, el('b', {}, dr.nome), typeof seloJogada === 'function' ? seloJogada(dr) : null, el('small', {}, dr.desc)), el('small', { class: 'jog-onde' }, tem ? '✔ Você sabe' : `Aprende sozinho no nível ${dr.lvl}`)));
  }
  const modoTxt = g.modo === 'chute' ? 'Chute (de longe)' : 'Drible (colado)';
  abreModal.largo = true;
  abreModal(el('h2', {}, `${c.emoji} Minha classe: ${c.nome}`),
    el('div', { class: 'mc-topo', style: `--cor:${c.cor}` },
      el('p', {}, el('b', {}, v.papel ? `Como o ${v.papel} do Tibia. ` : ''), c.desc),
      el('div', { class: 'mc-duas' },
        el('div', { class: 'mc-bom' }, el('b', {}, '💪 Especialidade'), el('p', {}, v.forte || '—'), el('p', {}, el('small', {}, '✨ ' + c.passiva))),
        el('div', { class: 'mc-ruim' }, el('b', {}, '⚠️ Deficiência'), el('p', {}, v.fraco || '—'))),
      el('p', { class: 'mc-jeito' }, el('b', {}, '🎮 Como jogar: '), g.jeito, el('br'), el('small', {}, `Modo recomendado: ${modoTxt}. Seu modo agora: ${G.modo === 'chute' ? 'Chute' : 'Drible'}.`))),
    el('h3', {}, '📊 Atributos (⭐ = os melhores para a sua classe)'), attrs, dicaPts,
    el('h3', {}, `⚡ Especial (tecla ${teclaEspecial()}): ${c.especial.nome}`), el('p', {}, c.especial.desc),
    el('h3', {}, '🪄 Magias da classe'), mags,
    el('p', { class: 'vazio' }, 'Quer refazer seus pontos? O Seu Zé (na Vila) redistribui os atributos.'),
    el('div', { class: 'opcoes' }, typeof modalJogadas === 'function' ? el('button', { class: 'btn roxo', type: 'button', onclick: modalJogadas }, '📖 Todas as minhas jogadas') : null, el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'Fechar')));
}
{
  const lista = document.querySelector('.tb-lista');
  if (lista && !document.getElementById('btnMinhaClasse')) { const b = el('button', { class: 'btn', id: 'btnMinhaClasse', type: 'button', role: 'menuitem' }, '🎓 Minha classe'); b.addEventListener('click', () => modalMinhaClasse()); lista.prepend(b); }
  const grade = document.querySelector('#celMenu .cm-grade');
  if (grade && !document.getElementById('cmMinhaClasse')) grade.prepend(el('button', { class: 'btn cm-bt', id: 'cmMinhaClasse', type: 'button', onclick: () => { if (typeof fechaMenuCel === 'function') fechaMenuCel(); modalMinhaClasse(); } }, el('span', { class: 'cm-ic' }, '🎓'), 'Classe'));
  if (typeof abreFicha === 'function') { const _abreFichaMc = abreFicha; abreFicha = function () { const r = _abreFichaMc.apply(this, arguments); const box = document.getElementById('modalConteudo'); if (box && !box.querySelector('.bt-classe') && G.save && G.save.classe) { const c = CLASSES[G.save.classe]; box.querySelector('h2') && box.querySelector('h2').after(el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo bt-classe', type: 'button', onclick: modalMinhaClasse }, `${c.emoji} Minha classe: ${c.nome} — especialidade, deficiências e o que subir`))); } return r; }; }
}
{
  const st = document.createElement('style');
  st.textContent = `.mc-topo { border-left: 5px solid var(--cor); padding-left: 10px; } .mc-duas { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 6px 0; }
  .mc-bom, .mc-ruim { border-radius: 10px; padding: 6px 10px; } .mc-bom { background: rgba(58,168,74,.14); } .mc-ruim { background: rgba(200,60,40,.12); } .mc-bom p, .mc-ruim p { margin: 3px 0; }
  .mc-jeito { background: #fff6d8; border-radius: 8px; padding: 6px 10px; }
  .mc-attrs { display: grid; gap: 6px; } .mc-attr { display: grid; grid-template-columns: 30px 1fr 44px; gap: 8px; align-items: center; padding: 5px 8px; border-radius: 8px; background: rgba(0,0,0,.05); }
  .mc-attr.rec { background: rgba(255,210,63,.22); box-shadow: 0 0 0 2px rgba(255,190,40,.6) inset; } .mc-ic { font-size: 22px; text-align: center; } .mc-attr small { display: block; opacity: .85; }
  .mc-bar { height: 7px; background: rgba(0,0,0,.12); border-radius: 4px; margin-top: 3px; overflow: hidden; } .mc-bar i { display: block; height: 100%; } .mc-val { font-size: 18px; text-align: right; }
  .mc-pts { background: #e8ffe8; border-radius: 8px; padding: 6px 10px; font-weight: 700; }
  @media (max-width: 600px) { .mc-duas { grid-template-columns: 1fr; } }`;
  document.head.append(st);
}
