/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   VOCAÇÕES (como no Tibia): as 4 classes ganham papel de verdade,
   pontos fortes, pontos fracos e um pacote de 3 "magias" próprias
   (aprendidas sozinhas nos níveis 10, 25 e 45).
     🛡️ Paredão  = Knight   — corpo a corpo e aguenta tudo; fraco de longe
     🎯 Artilheiro = Paladino/arqueiro — chuta de longe com força; sofre colado
     🧠 Cérebro  = Mago     — jogadas de longe em área, muito foco; pouco fôlego
     💚 Motorzinho = Druida — curas fortes, regeneração e magia que prende em área
   Os ids no save não mudam (paredao, driblador, cerebro, motorzinho): quem já
   joga continua com a mesma classe, só com as regras novas.
   Carregar DEPOIS de lances.js (envolve stats, usarDrible, danoMaxJogador...).
   ============================================================ */
// v364 (dono: "vamos reequilibrar as classes"): medido com o jogador preparado contra um alvo de vida enorme (dano por minuto, níveis
// 50–450): o Artilheiro causava +48% a +68% da média e Paredão/Motorzinho −24% a −37%. Agora: 1 alvo ≈ Artilheiro +10%, Cérebro ±,
// Paredão −10% (é o tanque: toma 3–4× menos dano), Motorzinho −5%; em grupo de 3 todos ficam em ±15%.
// dano = fator em TODO ataque da classe; area = jogadas de área de perto (antes usavam o 'perto')
const VOCACAO = {
  paredao: { papel: 'Knight', hp: 1.35, foco: 0.8, perto: 1.85, area: 1.2, longe: 0.7, alcance: 0, cura: 1, colado: 1, dano: 1.05,
    forte: 'Very strong close-range hits (+85%) and lots of stamina (+35%).', fraco: 'Weak long shots (−30%).', magias: ['carrinho', 'tranco', 'chamar_marcacao'] },
  driblador: { papel: 'Paladin', hp: 0.9, foco: 1, perto: 0.7, longe: 1.1, alcance: 2, cura: 1, colado: 1.25, dano: 0.9,
    forte: 'Long-range shot (+2 range) and more crits.', fraco: 'Up close to an opponent: dribble −30% and takes +25% damage.', magias: ['trivela', 'chuva_bolas', 'canhao'] },
  cerebro: { papel: 'Mage', hp: 0.75, foco: 1.5, perto: 0.8, longe: 1, alcance: 0, cura: 1, colado: 1, magia: 1.55,
    forte: 'Lots of focus (+50%) and long-range/area moves (+55%).', fraco: 'Low stamina (−25%).', magias: ['lancamento', 'hipnose', 'toque_mestre'] },
  motorzinho: { papel: 'Druid', hp: 1, foco: 1.25, perto: 1.3, longe: 1.3, alcance: 0, cura: 1.6, colado: 1, dano: 1.02,
    forte: 'Heals 60% stronger, +25% focus, regeneration, area magic that holds enemies in place and +30% to dribbling and shooting.', fraco: 'Has no strong single-target move (their spells are healing and area).', magias: ['agua_gelada', 'grito_torcida', 'raiz'] },
};
const vocDe = () => (G.save && VOCACAO[G.save.classe]) || null;

// ---------- as classes com a cara nova ----------
// v407 (Raio-X, criação enxuta): UMA frase por classe, sem comparar com outro jogo (os detalhes ficam no "ver mais")
Object.assign(CLASSES.paredao, { nome: 'The Wall', emoji: '🛡️', desc: 'Plays up close and stands strong.' });
Object.assign(CLASSES.driblador, { nome: 'Top Scorer', emoji: '🎯', cor: '#ff9a3a', desc: 'Shoots from far away with power and aim.',
  passiva: 'Aim: higher critical chance (damage x1.8 — "SCREAMER!").' });
CLASSES.driblador.especial = Object.assign({}, CLASSES.driblador.especial, { nome: 'Eye on Target', desc: 'Your next 3 attacks are guaranteed critical hits.' });
Object.assign(CLASSES.cerebro, { desc: 'Reads the game and makes plays that hit several at once.' });
Object.assign(CLASSES.motorzinho, { emoji: '💚', desc: 'Takes care of the team: heals, runs and never gets tired.' });

// ---------- as magias de cada vocação ----------
const MAGIAS = {
  // Paredão (Knight)
  carrinho: { nome: 'Slide Tackle', tipo: 'melee', lvl: 10, foco: 30, cd: 4000, poder: 2.4, skill: 'drible', fx: 'impacto', cor: '#7ab8ff', classe: 'paredao', atordoa: 2000, desc: 'Slide tackle for the ball: strong damage and the opponent is dizzy for 2 s.' },
  chamar_marcacao: { nome: 'Call the Markers', tipo: 'buff', lvl: 45, foco: 40, cd: 15000, dur: 6000, fx: 'escudo', cor: '#4a8ae8', classe: 'paredao', efeitoMagia: 'provoca', desc: 'Pulls everyone nearby toward you and you take 30% less damage for 6 s.' },
  tranco: { nome: 'Defender\'s Shove', tipo: 'area', lvl: 25, foco: 60, cd: 4000, raio: 1.5, poder: 3.2, skill: 'drible', fx: 'area', cor: '#4a8ae8', classe: 'paredao', atordoa: 1200, desc: 'Dribbles everyone up close to you and leaves them dizzy.' },
  // Artilheiro (Paladino)
  trivela: { nome: 'Outside-Foot Curler', tipo: 'dist', lvl: 10, foco: 25, cd: 2500, alcance: 6, poder: 2.2, skill: 'chute', fx: 'bola', cor: '#ffd23f', classe: 'driblador', atravessa: true, desc: 'An outside-of-the-foot shot that curves and also hits whoever is behind.' },
  chuva_bolas: { nome: 'Ball Shower', tipo: 'dist', lvl: 25, foco: 60, cd: 4000, alcance: 6, poder: 2.0, skill: 'chute', fx: 'explosao', cor: '#ffb03a', classe: 'driblador', areaAlvo: 1.6, desc: 'Lots of balls rain down around the target, from far away.' },
  canhao: { nome: 'Cannon', tipo: 'dist', lvl: 45, foco: 110, cd: 5000, alcance: 7, poder: 5.5, skill: 'chute', fx: 'explosao', cor: '#ff7a3a', classe: 'driblador', desc: 'The strongest rocket in the game, from very far away.' }, // v364: era 6,5
  // Cérebro (Mago)
  lancamento: { nome: 'Long Ball', tipo: 'dist', lvl: 10, foco: 35, cd: 2000, alcance: 7, poder: 2.6, skill: 'drible', fx: 'bolaforte', cor: '#b07aff', classe: 'cerebro', desc: 'A 40-meter long ball that hits dead on.' },
  hipnose: { nome: 'Hypnosis', tipo: 'dist', lvl: 25, foco: 50, cd: 10000, alcance: 6, poder: 0.8, skill: 'drible', fx: 'estrelas', cor: '#d07aff', classe: 'cerebro', atordoa: 4000, desc: 'The opponent stands still, hypnotized, for 4 s.' },
  toque_mestre: { nome: 'Master Touch', tipo: 'dist', lvl: 45, foco: 140, cd: 4000, alcance: 7, poder: 4.0, skill: 'drible', fx: 'raio', cor: '#9a5aff', classe: 'cerebro', areaAlvo: 2.2, desc: 'A genius play that dribbles everyone around the target.' },
  // Motorzinho (Druida)
  agua_gelada: { nome: 'Ice-Cold Water', tipo: 'cura', lvl: 10, foco: 30, cd: 1000, poder: 2.0, fx: 'curaforte', cor: '#5affe0', classe: 'motorzinho', desc: 'A strong, refreshing heal.' },
  grito_torcida: { nome: 'Crowd Roar', tipo: 'cura', lvl: 25, foco: 60, cd: 20000, poder: 1.5, fx: 'curaforte', cor: '#5aff9a', classe: 'motorzinho', efeitoMagia: 'torcida', desc: 'The crowd sings: heals, and you get faster and regenerate for 12 s.' },
  raiz: { nome: 'Pitch Roots', tipo: 'area', lvl: 45, foco: 100, cd: 6000, raio: 2.3, poder: 3.4, skill: 'drible', fx: 'area', cor: '#4fc26a', classe: 'motorzinho', atordoa: 2000, desc: 'The grass holds everyone around: damage and they\'re stuck for 2 s.' },
};
Object.assign(DRIBLES, MAGIAS);
if (typeof EMOJI_DRIBLE !== 'undefined') Object.assign(EMOJI_DRIBLE, { carrinho: '🦵', chamar_marcacao: '📣', tranco: '💪', trivela: '🌀', chuva_bolas: '🌧️', canhao: '💣', lancamento: '🎯', hipnose: '😵‍💫', toque_mestre: '🪄', agua_gelada: '🧊', grito_torcida: '🎺', raiz: '🌱' });

// aprende sozinho as magias da vocação ao chegar no nível (e confere ao carregar o jogo)
function aprendeMagiasDaVocacao() {
  const s = G.save, v = vocDe(); if (!s || !v) return;
  for (const id of v.magias) if (s.nivel >= DRIBLES[id].lvl && !s.dribles.includes(id)) aprendeDrible(id);
}
(function () {
  const _subiu = subiuNivel; subiuNivel = function (...r) { const x = _subiu.apply(this, r); try { aprendeMagiasDaVocacao(); } catch (e) { } return x; };
  const _ini = iniciarJogo; iniciarJogo = async function (...r) { const x = await _ini.apply(this, r); setTimeout(() => { try { aprendeMagiasDaVocacao(); } catch (e) { } }, 1500); return x; };
})();

// ---------- números: fôlego, foco, cura e dano de perto x de longe ----------
let VOC_MODO = null; // 'perto' | 'area' | 'longe' | 'magia' enquanto um ataque está sendo calculado
(function () {
  const _stats = stats;
  stats = function () {
    const st = _stats(); const v = vocDe(); if (!v) return st;
    st.maxHp = Math.round(st.maxHp * v.hp); st.maxFoco = Math.round(st.maxFoco * v.foco); st.curaMult *= v.cura;
    st.danoMult *= v.dano || 1;
    if (VOC_MODO === 'perto') st.danoMult *= v.perto;
    else if (VOC_MODO === 'area') st.danoMult *= (v.area || v.perto);
    else if (VOC_MODO === 'longe') st.danoMult *= v.longe;
    else if (VOC_MODO === 'magia') st.danoMult *= (v.magia || v.longe);
    return st;
  };
  const _dm = danoMaxJogador;
  danoMaxJogador = function (modo) { VOC_MODO = modo === 'chute' ? 'longe' : 'perto'; try { return _dm(modo); } finally { VOC_MODO = null; } };
})();
function alcanceChute() { const v = vocDe(); return 4.3 + (v ? v.alcance : 0); }

// Artilheiro colado no adversário toma mais dano
(function () {
  const _rd = recebeDano;
  recebeDano = function (dano, m) {
    const v = vocDe();
    if (v && v.colado > 1 && m && m.d && !m.d.ranged && dist(m, G.p) < 1.6) dano = Math.round(dano * v.colado);
    if ((G.buffs.provoca || 0) > G.agora) dano = Math.max(1, Math.round(dano * 0.7));
    return _rd(dano, m);
  };
})();

// adversário tonto/hipnotizado fica parado
(function () {
  const _am = atualizaMonstro;
  atualizaMonstro = function (m, dt) { if ((m.atordoado || 0) > G.agora) { m.mov = false; return; } return _am(m, dt); };
  const _de = desenhaEnt;
  desenhaEnt = function (ctx, e) {
    const r = _de(ctx, e);
    if ((e.atordoado || 0) > G.agora && !(typeof FX !== 'undefined' && FX.img.tontura && FX.img.tontura.ok)) { // estrelinhas girando na cabeça (fx.js desenha a animada)
      const h = alturaEnt(e) * T, t = G.agora / 250;
      for (let i = 0; i < 3; i++) { const a = t + i * 2.1; ctx.font = '14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('💫', e.x * T + Math.cos(a) * 14, e.y * T - h - 6 + Math.sin(a) * 4); }
    }
    return r;
  };
})();

// ---------- como as magias funcionam ----------
function danoMagia(dr, m) {
  const st = stats(); const sk = st[dr.skill] || st.drible; treinaSkill(dr.skill || 'drible', 1);
  return critico(Math.round((st.nivel * 0.3 + sk * dr.poder + st.visao * dr.poder * 0.5) * rnd(0.85, 1.15) * st.danoMult * st.poderMult - m.d.def * 0.3), m);
}
(function () {
  const _ud = usarDrible;
  usarDrible = function (id) {
    const dr = DRIBLES[id]; const s = G.save; if (!dr || !s) return _ud(id);
    if (dr.classe && dr.classe !== s.classe) { log(`${dr.nome} is a spell from another vocation.`, 'l-sis'); return; }
    const v = vocDe();
    // o que conta como "de perto" e "de longe" para o dano da vocação
    VOC_MODO = dr.tipo === 'dist' ? (s.classe === 'cerebro' ? 'magia' : 'longe') : dr.tipo === 'area' ? 'area' : dr.tipo === 'melee' ? 'perto' : null;
    const alcanceAntes = dr.alcance; if (dr.tipo === 'dist' && v && v.alcance) dr.alcance = (dr.alcance || 5) + v.alcance; // Artilheiro chuta de mais longe
    const a = G.alvo && G.mons.includes(G.alvo) ? G.alvo : null, cdAntes = G.cds[id];
    try { _ud(id); } finally { dr.alcance = alcanceAntes; }
    const usou = G.cds[id] !== cdAntes;
    try {
      if (usou) {
        const p = G.p;
        // tonto / hipnotizado
        if (dr.atordoa) {
          const alvos = dr.tipo === 'area' ? G.mons.filter(m => naArea(p, m, dr.raio) && !m.d.treino) : a ? [a] : [];
          alvos.forEach(m => { if (!m.d.chefe) m.atordoado = G.agora + dr.atordoa; else m.atordoado = G.agora + dr.atordoa * 0.3; });
        }
        // atravessa: acerta também quem está logo atrás do alvo
        if (dr.atravessa && a) {
          const dx = a.x - p.x, dy = a.y - p.y, d = Math.hypot(dx, dy) || 1;
          const atras = G.mons.filter(m => m !== a && !m.d.treino && Math.hypot(m.x - (a.x + dx / d), m.y - (a.y + dy / d)) < 1.2)[0];
          if (atras) setTimeout(() => { if (G.mons.includes(atras)) { efeito('impacto', atras.x, atras.y, dr.cor); aplicaDano(atras, danoMagia(dr, atras)); } }, 350);
        }
        // área em volta do alvo, de longe
        if (dr.areaAlvo && a) {
          // v195: a área em volta do ALVO e também todos que estão colados em você (cercado, ninguém escapa)
          const cx = a.x, cy = a.y; const outros = G.mons.filter(m => m !== a && !m.d.treino && ((modoGrade() ? naArea({ x: cx, y: cy }, m, dr.areaAlvo) : Math.hypot(m.x - cx, m.y - cy) <= dr.areaAlvo) || naArea(G.p, m, 1)));
          setTimeout(() => { efeito('area', cx, cy, dr.cor, dr.areaAlvo); outros.forEach(m => { if (G.mons.includes(m)) { efeito('impacto', m.x, m.y, dr.cor); aplicaDano(m, danoMagia(dr, m)); } }); }, 380);
        }
        // Grito da Torcida: fica rápido e vai recuperando fôlego
        if (dr.efeitoMagia === 'torcida') { G.buffs.arrancada = G.agora + 12000; G.buffs.torcida = G.agora + 12000; log('🎺 The crowd sings! Faster and recovering stamina for 12 s.', 'l-info'); }
      }
    } finally { VOC_MODO = null; }
  };
  // Chamar a Marcação é um "buff" de outro tipo: a base trataria como Arrancada, então tratamos antes
  const _ud2 = usarDrible;
  usarDrible = function (id) {
    const dr = DRIBLES[id];
    if (dr && dr.efeitoMagia === 'provoca') {
      const s = G.save; const st = stats(); if (!s || s.hp <= 0) return;
      if (dr.classe !== s.classe) { log(`${dr.nome} is a spell from another vocation.`, 'l-sis'); return; }
      if (!s.dribles.includes(id)) return; if (s.nivel < dr.lvl) return;
      const custo = Math.ceil(dr.foco * st.custoFoco); if (s.foco < custo) { log(`Not enough focus for ${dr.nome}.`, 'l-sis'); som('erro'); return; }
      if (G.agora < (G.cds.suporte || 0) || G.agora < (G.cds[id] || 0)) return; // v220: magia de suporte (não trava os ataques)
      const p = G.p; G.buffs.provoca = G.agora + dr.dur;
      G.mons.forEach(m => { if (!m.d.treino && dist(m, p) <= 5) { m.bravo = true; m.voltando = false; } });
      efeito('escudo', p.x, p.y, dr.cor); log('📣 Called the markers! Everyone comes at you, and you take 30% less damage for 6 s.', 'l-info');
      s.foco -= custo; treinaSkill('visao', custo); G.cds.suporte = G.agora + CD_GRUPO.suporte; G.cds[id] = G.agora + dr.cd;
      tituloSkill(p, dr.nome, dr.cor); p.golpe = G.agora; som('dr_chamar_marcacao'); G.uiSujo = true; return;
    }
    return _ud2(id);
  };
})();
// Grito da Torcida: recupera fôlego aos poucos
(function () {
  const _at = atualiza;
  atualiza = function (dt) {
    const r = _at(dt);
    if ((G.buffs.torcida || 0) > G.agora && G.save && G.save.hp > 0) { const st = stats(); G.save.hp = Math.min(st.maxHp, G.save.hp + st.maxHp * 0.03 * dt / 1000); }
    return r;
  };
})();

// ---------- janela de escolha de classe: mostra o papel, forte/fraco e as magias ----------
(function () {
  const _carta = cartaClasse;
  window.VOC_VER_MAIS = window.VOC_VER_MAIS || new Set(); // classes com o "ver mais" aberto (vale enquanto a tela está aberta)
  cartaClasse = function (id, sel, onclick) {
    const b = _carta(id, sel, onclick); const v = VOCACAO[id]; if (!v) return b;
    // v407 (Raio-X, criação enxuta): o cartão mostra ícone, nome e UMA frase; o resto (atributo, passiva, especial, forte/fraco,
    // magias) fica dentro do "ver mais". Saiu o "Como o Knight/Paladino/Mago/Druida do Tibia".
    const det = el('div', { class: 'cc-detalhe' });
    [...b.querySelectorAll('.cc-attr, .cc-pass, .cc-esp')].forEach(e => det.append(e));
    det.append(el('p', { class: 'cc-forte' }, '💪 ', v.forte), el('p', { class: 'cc-fraco' }, '⚠️ ', v.fraco),
      el('div', { class: 'cc-magias' }, el('b', {}, 'Spells: '), v.magias.map(m => `${DRIBLES[m].nome} (lv ${DRIBLES[m].lvl})`).join(' · ')));
    const aberto = VOC_VER_MAIS.has(id); if (aberto) b.classList.add('cc-aberto');
    const mais = el('span', { class: 'cc-vermais', role: 'button', tabindex: '0' }, aberto ? 'see less ▴' : 'see more ▾');
    const troca = ev => { ev.stopPropagation(); ev.preventDefault(); const ab = !b.classList.contains('cc-aberto'); if (ab) VOC_VER_MAIS.add(id); else VOC_VER_MAIS.delete(id); b.classList.toggle('cc-aberto', ab); mais.textContent = ab ? 'see less ▴' : 'see more ▾'; };
    mais.addEventListener('click', troca); mais.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') troca(ev); });
    b.append(mais, det);
    return b;
  };
  const st = document.createElement('style');
  st.textContent = `
  .card-classe { position: relative; }
  .card-classe .cc-detalhe { display: none; }
  .card-classe.cc-aberto .cc-detalhe { display: block; }
  .card-classe .cc-vermais { align-self: flex-start; margin-top: 2px; font: 800 12px Nunito, sans-serif; color: var(--cor, #555); text-decoration: underline; cursor: pointer; padding: 2px 0; }
  .card-classe .cc-vermais:hover { filter: brightness(.8); }
  .card-classe .cc-forte { color: #1a6a2a; font-weight: 700; font-size: 12px; margin: 3px 0 0; }
  .card-classe .cc-fraco { color: #9a3a1a; font-weight: 700; font-size: 12px; margin: 2px 0 0; }
  .card-classe .cc-magias { font-size: 11.5px; margin-top: 4px; background: rgba(0,0,0,.05); border-radius: 6px; padding: 3px 5px; }
  `;
  document.head.append(st);
})();
