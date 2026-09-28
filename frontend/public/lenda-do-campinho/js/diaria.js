/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🎁 RECOMPENSA DIÁRIA (v209), como a Daily Reward do Tibia:
   entrou no dia, ganha um presente. Dias seguidos formam uma sequência de 7
   (o 7º é o melhor); faltou mais de um dia, a sequência recomeça.
   Os presentes crescem com o nível. Carregar DEPOIS de tarefas.js.
   ============================================================ */
function diaHoje() { return tarHoje(); }
function diasEntre(a, b) { const p = x => { const [y, m, d] = x.split('-').map(Number); return Date.UTC(y, m - 1, d); }; return Math.round((p(b) - p(a)) / 86400000); }
function diaTostoes(k) { return (50 + G.save.nivel * 20) * k; }
const DIARIA = [
  { ic: '💰', nome: () => `${fmt(diaTostoes(1))} tostões`, da: () => { G.save.ouro += diaTostoes(1); } },
  { ic: '🧃', nome: () => `5× ${ITENS[tarMelhor('hp')].nome}`, da: () => recebeItem(tarMelhor('hp'), 5) },
  { ic: '🥤', nome: () => `5× ${ITENS[tarMelhor('foco')].nome}`, da: () => recebeItem(tarMelhor('foco'), 5) },
  { ic: '💰', nome: () => `${fmt(diaTostoes(2))} tostões`, da: () => { G.save.ouro += diaTostoes(2); } },
  { ic: '🃏', nome: () => 'Pacotinho de Figurinhas', da: () => recebeItem('pacotinho', 1) },
  { ic: '🎒', nome: () => `10 garrafas + 10 isotônicos`, da: () => { recebeItem(tarMelhor('hp'), 10); recebeItem(tarMelhor('foco'), 10); } },
  { ic: '🏆', nome: () => `${fmt(diaTostoes(4))} tostões, 5 pontos de tarefa e +30% de XP por 30 min`, da: () => { G.save.ouro += diaTostoes(4); const t = tarDados(); t.pts += 5; t.bonusXpMs += 30 * 60000; } },
];
// em que dia da sequência está e se já pegou hoje
function diariaEstado() {
  const s = G.save; if (!s.diaria) s.diaria = { ult: '', seq: 0 };
  const d = s.diaria, hoje = diaHoje();
  if (d.ult === hoje) return { pegou: true, dia: d.seq };
  const seguido = d.ult && diasEntre(d.ult, hoje) === 1;
  return { pegou: false, dia: seguido ? d.seq % 7 + 1 : 1, perdeu: !!d.ult && !seguido && d.seq > 1 };
}
function modalDiaria() {
  const s = G.save; if (!s) return; const st = diariaEstado();
  const trilha = el('div', { class: 'dr-trilha' }, ...DIARIA.map((r, k) => {
    const n = k + 1, feito = n < st.dia || (st.pegou && n === st.dia), hojeE = n === st.dia && !st.pegou;
    return el('div', { class: 'dr-dia' + (feito ? ' feito' : '') + (hojeE ? ' hoje' : '') }, el('small', {}, `Dia ${n}`), el('span', { class: 'dr-ic' }, feito ? '✔' : r.ic), el('small', { class: 'dr-nome' }, r.nome()));
  }));
  const pegar = () => {
    const e = diariaEstado(); if (e.pegou) return;
    DIARIA[e.dia - 1].da(); s.diaria = { ult: diaHoje(), seq: e.dia };
    log(`🎁 Recompensa diária (dia ${e.dia}): ${DIARIA[e.dia - 1].nome()}!`, 'l-loot'); som('moeda'); salvar(); G.uiSujo = true;
    if (typeof atualizaBotaoDiaria === 'function') atualizaBotaoDiaria(); modalDiaria();
  };
  abreModal.largo = true;
  abreModal(el('h2', {}, '🎁 Recompensa diária'),
    el('p', {}, st.pegou ? 'Você já pegou o presente de hoje. Volte amanhã para continuar a sequência!' : (st.perdeu ? 'Você ficou um tempo fora e a sequência recomeçou. ' : '') + 'Entre todo dia: quanto mais dias seguidos, melhor o presente. O 7º dia é o maior!'),
    trilha,
    el('div', { class: 'opcoes' }, st.pegou ? null : el('button', { class: 'btn verde', type: 'button', onclick: pegar }, `Pegar o presente do dia ${st.dia}`), el('button', { class: 'btn', type: 'button', onclick: fechaModal }, st.pegou ? 'Fechar' : 'Depois')));
}
function atualizaBotaoDiaria() {
  const b = document.getElementById('btnDiaria'); if (!b || !G.save) return;
  b.classList.toggle('dr-tem', !diariaEstado().pegou);
}
{
  const poe = () => {
    const lista = document.querySelector('#topo .tb-lista');
    if (lista && !document.getElementById('btnDiaria')) lista.prepend(el('button', { class: 'btn', id: 'btnDiaria', type: 'button', role: 'menuitem', onclick: () => { if (G.save) modalDiaria(); } }, '🎁 Recompensa diária'));
    const grade = document.querySelector('#celMenu .cm-grade');
    if (grade && !document.getElementById('cmDiaria')) grade.prepend(el('button', { class: 'btn cm-bt', id: 'cmDiaria', type: 'button', onclick: () => { if (typeof fechaMenuCel === 'function') fechaMenuCel(); if (G.save) modalDiaria(); } }, el('span', { class: 'cm-ic' }, '🎁'), 'Diária'));
    atualizaBotaoDiaria();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(poe, 0)); else setTimeout(poe, 0);
  // ao entrar: espera as outras janelas (história, avisos) fecharem e mostra o presente do dia
  let espera = null;
  const _iniDr = iniciarJogo;
  iniciarJogo = async function () {
    const r = await _iniDr.apply(this, arguments); poe();
    clearInterval(espera); const t0 = Date.now();
    espera = setInterval(() => {
      if (!G.save || Date.now() - t0 > 600000) { clearInterval(espera); return; }
      if (diariaEstado().pegou) { clearInterval(espera); return; }
      const livre = G.rodando && !G.pausado && $('#modal').hidden && !(typeof HIST !== 'undefined' && HIST) && (G.save.st.tempo > 60 || G.save.nivel > 1);
      if (livre && Date.now() - t0 > 2500) { clearInterval(espera); modalDiaria(); }
    }, 1000);
    return r;
  };
  const st = document.createElement('style');
  st.textContent = `.dr-trilha { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin: 10px 0; }
  .dr-dia { display: grid; justify-items: center; gap: 3px; padding: 8px 4px; border-radius: 10px; background: rgba(0,0,0,.06); text-align: center; }
  .dr-dia.feito { opacity: .55; } .dr-dia.hoje { background: rgba(255,210,63,.45); outline: 2px solid #e0a800; }
  .dr-ic { font-size: 26px; } .dr-nome { font-size: 11.5px; line-height: 1.2; }
  #btnDiaria.dr-tem::after { content: ' ●'; color: #e0302a; }
  @media (max-width: 600px) { .dr-trilha { grid-template-columns: repeat(4, 1fr); } }`;
  document.head.append(st);
}
