/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🎓 DRIBLES POR NÍVEL (v186, pedido do dono): antes os dribles vinham de
   missões (quem pulava uma missão ficava sem o drible). Agora TODO drible
   chega sozinho ao alcançar o nível dele, igual às magias da classe.
   - Quem já joga: ao entrar, ganha os dribles do seu nível que faltavam.
   - As missões continuam dando XP, tostões e itens (só não dão mais drible).
   - (v227) Os NPCs não têm mais o botão "Dribles que ensino".
   Carregar DEPOIS de vocacoes.js e jogadas_info.js.
   ============================================================ */
// as missões não dão mais drible; as falas de fim avisam em que nível ele chega
const FIM_DRIBLE_NIVEL = {
  q_pombos: 'Nice! You warmed up well. Dribbles come with experience: with every new level you learn them on your own (the STEP-OVER arrives at level 2 — use it on the hotbar when you\'re right next to an opponent).',
  q_penaltis: 'What a strike! A penalty star. (The PLACED SHOT, which attacks from far away, arrives on its own at level 6.)',
  q_escola: 'Congratulations! Take this wristband. (You\'ll learn BREATHER, which recovers stamina, on your own at level 4.)',
  q_tonhao: 'You beat Tonhão! The road to the BEACH (east) is open. At level 10, come back here for the tryout!',
  p_caranguejos: 'Great job on the sand! (The RAINBOW FLICK arrives on its own at level 12: the ball goes over and the defender is left staring at the sky!)',
  p_futevolei: 'Not a single ball dropped! (The VOLLEY, a powerful long-range shot, arrives on its own at level 15.)',
  c_skate: 'The court is clear! (The ELASTICO arrives on its own at level 20: this way, that way... and you\'re through.)',
  c_alas: 'My shelves thank you! My late husband was a fitness coach, and he said CHAMPION\'S STAMINA comes with time: at level 22 it\'s yours.',
  t_volantes: 'First lesson done! (The NUTMEG, the boldest dribble in soccer, arrives on its own at level 28.)', // v407 (Raio-X U3): era "mais humilhante"
  t_preparadores: 'The fitness coaches thank you for the rest! (The ONE-TWO arrives on its own at level 32.)',
  e_meias: 'The secret to my screamer? Practice! The BICYCLE KICK, the most beautiful goal in the world, arrives on its own at level 40.',
  e_paredao: 'GOOOOAL! You\'re the STAR! Take the GOLDEN NUMBER 10 JERSEY. (The LIGHTNING STEP-OVER arrives on its own at level 55.) Now the world is waiting for you: talk to Flight Attendant Luana at the City airport!', // v407 (Raio-X R8): era "rumo à Lenda (nível 60)"
};
const TEXTO_DRIBLE_NIVEL = {
  q_escola: 'A good player is also a good student! Answer 5 questions right with me and get a gift.',
  e_meias: 'I\'m Dadá, I played here for 20 years. Beat 25 playmaking midfielders and I\'ll tell you the secret to my screamer.',
};
for (const m of MISSOES) {
  if (!m.rec || !m.rec.drible) continue;
  delete m.rec.drible;
  if (FIM_DRIBLE_NIVEL[m.id]) m.fim = FIM_DRIBLE_NIVEL[m.id];
  if (TEXTO_DRIBLE_NIVEL[m.id]) m.texto = TEXTO_DRIBLE_NIVEL[m.id];
}

// aprende sozinho todo drible (fora os da classe, que vocacoes.js cuida) ao chegar no nível dele
function aprendeDriblesDoNivel() {
  const s = G.save; if (!s || !s.dribles) return;
  const novos = Object.keys(DRIBLES).filter(id => !DRIBLES[id].classe && s.nivel >= (DRIBLES[id].lvl || 1) && !s.dribles.includes(id))
    .sort((a, b) => DRIBLES[a].lvl - DRIBLES[b].lvl);
  for (const id of novos) aprendeDrible(id);
}
(function () {
  const _subiu = subiuNivel; subiuNivel = function (...r) { const x = _subiu.apply(this, r); try { aprendeDriblesDoNivel(); } catch (e) { } return x; };
  const _ini = iniciarJogo; iniciarJogo = async function (...r) { const x = await _ini.apply(this, r); setTimeout(() => { try { aprendeDriblesDoNivel(); } catch (e) { } }, 1600); return x; };
})();

// professor: mostra o que ele ensina e quando chega (não vende mais)
modalProfessor = function (npc) {
  const s = G.save; const lista = el('div', { class: 'lista' });
  for (const id of npc.d.professor) {
    const dr = DRIBLES[id]; if (!dr) continue; const tem = s.dribles.includes(id);
    lista.append(el('div', { class: 'linha-item' + (tem ? '' : ' bloq') }, iconeClone(iconeDrible(id)),
      el('div', { class: 'nm' }, el('b', {}, dr.nome), typeof seloJogada === 'function' ? seloJogada(dr) : null, el('small', {}, `${dr.desc} ${dr.foco} focus.`)),
      el('small', { class: 'jog-onde' }, tem ? '✔ You know it' : `Arrives on its own at level ${dr.lvl}`)));
  }
  abreModal(el('h2', {}, 'Dribbles with ' + npc.d.nome),
    el('p', {}, 'Dribbles come with experience: when you reach each one\'s level, you learn it on your own and it goes to the hotbar. Attack dribbles need a targeted opponent.'),
    lista, el('div', { class: 'opcoes' }, el('button', { class: 'btn', onclick: () => abrirNPC(npc) }, 'Back')));
};
