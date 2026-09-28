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
  q_pombos: 'Boa! Aqueceu bem. Os dribles vêm com a experiência: a cada nível novo você aprende sozinho (a PEDALADA chega no nível 2 — use na barra de atalhos quando estiver colado num adversário).',
  q_penaltis: 'Que batida! Craque de pênalti. (O CHUTE COLOCADO, que ataca de longe, chega sozinho no nível 6.)',
  q_escola: 'Parabéns! Leve essa munhequeira. (O RESPIRO, que recupera o fôlego, você aprende sozinho no nível 4.)',
  q_tonhao: 'Você venceu o Tonhão! A estrada pra PRAIA (leste) está liberada. No nível 10, volte aqui pra peneira!',
  p_caranguejos: 'Mandou bem na areia! (O CHAPÉU chega sozinho no nível 12: a bola passa por cima e o marcador fica olhando pro céu!)',
  p_futevolei: 'Nenhuma bola caiu! (O VOLEIO, chute forte à distância, chega sozinho no nível 15.)',
  c_skate: 'A quadra está livre! (O ELÁSTICO chega sozinho no nível 20: pra lá, pra cá... e passou.)',
  c_alas: 'Minhas prateleiras agradecem! Meu falecido marido era preparador e dizia que o FÔLEGO DE CAMPEÃO vem com o tempo: no nível 22 ele é seu.',
  t_volantes: 'Primeira lição cumprida! (A CANETA, o drible mais humilhante do futebol, chega sozinha no nível 28.)',
  t_preparadores: 'Os preparadores agradecem o descanso! (A TABELINHA chega sozinha no nível 32.)',
  e_meias: 'O segredo do meu golaço? Treino! A BICICLETA, o golaço mais bonito do mundo, chega sozinha no nível 40.',
  e_paredao: 'GOOOOL! Você é o CRAQUE! Toma a CAMISA 10 DE OURO. (A PEDALADA RELÂMPAGO chega sozinha no nível 55.) Agora... rumo à Lenda (nível 60)!',
};
const TEXTO_DRIBLE_NIVEL = {
  q_escola: 'Jogador bom também é bom aluno! Responda 5 perguntas certas comigo e ganhe um presente.',
  e_meias: 'Eu sou o Dadá, joguei aqui 20 anos. Vence 25 meias armadores e eu te conto o segredo do meu golaço.',
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
      el('div', { class: 'nm' }, el('b', {}, dr.nome), typeof seloJogada === 'function' ? seloJogada(dr) : null, el('small', {}, `${dr.desc} ${dr.foco} de foco.`)),
      el('small', { class: 'jog-onde' }, tem ? '✔ Você sabe' : `Chega sozinho no nível ${dr.lvl}`)));
  }
  abreModal(el('h2', {}, 'Dribles com ' + npc.d.nome),
    el('p', {}, 'Os dribles vêm com a experiência: ao chegar no nível de cada um, você aprende sozinho e ele vai para a barra de atalhos. Os de ataque precisam de um adversário marcado.'),
    lista, el('div', { class: 'opcoes' }, el('button', { class: 'btn', onclick: () => abrirNPC(npc) }, 'Voltar')));
};
