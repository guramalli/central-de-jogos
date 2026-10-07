/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🎁 RECOMPENSA DIÁRIA (v209), como a Daily Reward do Tibia:
   entrou no dia, ganha um presente. Dias seguidos formam uma sequência de 7
   (o 7º é o melhor); faltou um dia, a sequência PAUSA e continua de onde parou (v407, Raio-X R11).
   Os presentes crescem com o nível. Carregar DEPOIS de tarefas.js.
   ============================================================ */
function diaHoje() { return tarHoje(); }
function diasEntre(a, b) { const p = x => { const [y, m, d] = x.split('-').map(Number); return Date.UTC(y, m - 1, d); }; return Math.round((p(b) - p(a)) / 86400000); }
function diaTostoes(k) { return (50 + G.save.nivel * 20) * k; }
const DIARIA = [
  { ic: '💰', nome: () => `${fmt(diaTostoes(1))} coins`, da: () => { G.save.ouro += diaTostoes(1); } },
  { ic: '🧃', nome: () => `5× ${ITENS[tarMelhor('hp')].nome}`, da: () => recebeItem(tarMelhor('hp'), 5) },
  { ic: '🥤', nome: () => `5× ${ITENS[tarMelhor('foco')].nome}`, da: () => recebeItem(tarMelhor('foco'), 5) },
  { ic: '💰', nome: () => `${fmt(diaTostoes(2))} coins`, da: () => { G.save.ouro += diaTostoes(2); } },
  { ic: '🃏', nome: () => 'Sticker Pack', da: () => recebeItem('pacotinho', 1) },
  { ic: '🎒', nome: () => `10 bottles + 10 drinks`, da: () => { recebeItem(tarMelhor('hp'), 10); recebeItem(tarMelhor('foco'), 10); } },
  { ic: '🏆', nome: () => `${fmt(diaTostoes(4))} coins, 5 task points and +30% XP for 30 min`, da: () => { G.save.ouro += diaTostoes(4); const t = tarDados(); t.pts += 5; t.bonusXpMs += 30 * 60000; } },
];
// em que dia da sequência está e se já pegou hoje
function diariaEstado() {
  const s = G.save; if (!s.diaria) s.diaria = { ult: '', seq: 0 };
  const d = s.diaria, hoje = diaHoje();
  if (d.ult === hoje) return { pegou: true, dia: d.seq };
  // v407 (Raio-X R11): faltou um dia (ou vários)? A sequência PAUSA e continua de onde parou — nada de "medo de perder".
  const pausou = !!d.ult && diasEntre(d.ult, hoje) > 1 && d.seq >= 1;
  return { pegou: false, dia: d.ult ? d.seq % 7 + 1 : 1, perdeu: false, pausou };
}
function modalDiaria() {
  const s = G.save; if (!s) return; const st = diariaEstado();
  const trilha = el('div', { class: 'dr-trilha' }, ...DIARIA.map((r, k) => {
    const n = k + 1, feito = n < st.dia || (st.pegou && n === st.dia), hojeE = n === st.dia && !st.pegou;
    return el('div', { class: 'dr-dia' + (feito ? ' feito' : '') + (hojeE ? ' hoje' : '') }, el('small', {}, `Day ${n}`), el('span', { class: 'dr-ic' }, feito ? '✔' : r.ic), el('small', { class: 'dr-nome' }, r.nome()));
  }));
  const pegar = () => {
    const e = diariaEstado(); if (e.pegou) return;
    DIARIA[e.dia - 1].da(); s.diaria = { ult: diaHoje(), seq: e.dia };
    log(`🎁 Daily Reward (day ${e.dia}): ${DIARIA[e.dia - 1].nome()}!`, 'l-loot'); som('moeda'); salvar(); G.uiSujo = true;
    if (typeof atualizaBotaoDiaria === 'function') atualizaBotaoDiaria(); modalDiaria();
  };
  abreModal.largo = true;
  abreModal(el('h2', {}, '🎁 Daily Reward'),
    el('p', {}, st.pegou ? 'You already got today\'s gift. Come back another day to keep your streak going (it won\'t disappear if you miss a day)!' : (st.pausou ? 'So glad you\'re back! Your streak was saved and waiting for you. ' : '') + 'Play every day: the more days in a row, the better the gift. Day 7 is the biggest!'),
    trilha,
    el('div', { class: 'opcoes' }, st.pegou ? null : el('button', { class: 'btn verde', type: 'button', onclick: pegar }, `Get the gift for day ${st.dia}`), el('button', { class: 'btn', type: 'button', onclick: fechaModal }, st.pegou ? 'Close' : 'Later')));
}
function atualizaBotaoDiaria() {
  const b = document.getElementById('btnDiaria'); if (!b || !G.save) return;
  b.classList.toggle('dr-tem', !diariaEstado().pegou);
}
{
  const poe = () => {
    const lista = document.querySelector('#topo .tb-lista');
    if (lista && !document.getElementById('btnDiaria')) lista.prepend(el('button', { class: 'btn', id: 'btnDiaria', type: 'button', role: 'menuitem', onclick: () => { if (G.save) modalDiaria(); } }, '🎁 Daily Reward'));
    const grade = document.querySelector('#celMenu .cm-grade');
    if (grade && !document.getElementById('cmDiaria')) grade.prepend(el('button', { class: 'btn cm-bt', id: 'cmDiaria', type: 'button', onclick: () => { if (typeof fechaMenuCel === 'function') fechaMenuCel(); if (G.save) modalDiaria(); } }, el('span', { class: 'cm-ic' }, '🎁'), 'Daily'));
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
      if (!G.save || Date.now() - t0 > 1800000) { clearInterval(espera); return; } // v407: 30 min (o tutorial pode levar mais de 10)
      if (diariaEstado().pegou) { clearInterval(espera); return; }
      if (typeof hjAssumeDiaria === 'function' && hjAssumeDiaria()) { clearInterval(espera); return; } // v407 (Raio-X I2): quem volta num dia novo vê o cartão "Hoje" (com o presente dentro), uma janela só
      const tutFeito = typeof TUTORIAL === 'undefined' || G.save.tut >= TUTORIAL.length; // v407 (Raio-X R2c): o presente abria no meio do tutorial (passo 7); agora só depois dele
      const livre = tutFeito && G.rodando && !G.pausado && $('#modal').hidden && !(typeof HIST !== 'undefined' && HIST) && !G.jogoC && !G.fut && (G.save.st.tempo > 60 || G.save.nivel > 1) && (typeof rvQuieto !== 'function' || rvQuieto()); // v295: nunca no meio de uma partida da carreira · v407 (Raio-X A1): nem junto da faixa de nível
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
