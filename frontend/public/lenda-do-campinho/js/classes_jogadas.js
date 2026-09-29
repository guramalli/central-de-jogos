/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   ⚔️ JOGADAS PRÓPRIAS DE CADA CLASSE (v261)
   Jogo de um jogador só: cada classe precisa se virar sozinha (como no Diablo II), então
   toda classe tem um pouco de tudo, mas é FORTE em 2 coisas, MÉDIA em 2 e FRACA em 1:
     🛡️ Paredão    — forte: dano colado e aguentar pancada · fraco: correr/controlar
         Bote (nv 15): dispara até o adversário e chega dando o tranco.
         Lateral na Área (nv 35): arremesso de longe com a força de perto.
     🎯 Artilheiro — forte: dano de longe e mobilidade · fraco: aguentar pancada
         Recuo (nv 15): salta para longe de quem está colado.
         Folha Seca (nv 35): chute que atravessa a fila inteira.
     🧠 Cérebro    — forte: área e controle · fraco: aguentar pancada (se o foco acabar)
         Cabeça Fria (nv 15): o dano gasta foco (mana) no lugar do fôlego (HP).
         Gramado Encharcado (nv 35): chão que deixa todo mundo lento e vai machucando.
     💚 Motorzinho — forte: recuperação e aguentar · fraco: dano num alvo só
         Chamar o Caramelo (nv 15): o vira-lata da Vila joga do seu lado.
         Ponto de Hidratação (nv 35): círculo que cura você e machuca quem entrar.
   Carregar DEPOIS de vocacoes.js (usa VOCACAO, VOC_MODO, danoMagia, CD_GRUPO).
   ============================================================ */
const JOGADAS_CLASSE = {
  bote: { nome: 'Bote', tipo: 'melee', lvl: 15, foco: 40, cd: 5000, alcance: 5, poder: 2.2, skill: 'drible', fx: 'impacto', cor: '#6aa8ff', classe: 'paredao', atordoa: 1000, efeitoMagia: 'bote',
    desc: 'Dá o bote: dispara até o adversário marcado (até 5 passos) e chega com um tranco. Dano forte e ele fica tonto 1 s.' },
  lateral_area: { nome: 'Lateral na Área', tipo: 'dist', lvl: 35, foco: 55, cd: 3000, alcance: 5, poder: 3.2, skill: 'drible', fx: 'explosao', cor: '#4a8ae8', classe: 'paredao', modoVoc: 'perto', areaAlvo: 1.2,
    desc: 'Arremesso lateral com a força do zagueiro: acerta de longe o alvo e quem estiver colado nele. Usa a força de perto do Paredão.' },
  recuo: { nome: 'Recuo', tipo: 'buff', lvl: 15, foco: 25, cd: 6000, classe: 'driblador', efeitoMagia: 'recuo', cor: '#ffb03a',
    desc: 'Salta 3 passos para longe de quem está colado e deixa ele tonto 1 s. Aí é só voltar a chutar de longe.' },
  folha_seca: { nome: 'Folha Seca', tipo: 'dist', lvl: 35, foco: 70, cd: 3500, alcance: 7, poder: 2.6, skill: 'chute', fx: 'bola', cor: '#ffe14a', classe: 'driblador', efeitoMagia: 'fura',
    desc: 'O chute que cai no último instante e atravessa a fila inteira: acerta todos na linha até o alvo e um pouco além.' },
  cabeca_fria: { nome: 'Cabeça Fria', tipo: 'buff', lvl: 15, foco: 40, cd: 3000, dur: 60000, classe: 'cerebro', efeitoMagia: 'escudo_foco', cor: '#8ac8ff',
    desc: 'Por 1 minuto, o dano que você levar gasta o seu foco (mana) no lugar do fôlego (HP): cada 1 de foco segura 2 de dano. Se o foco acabar, volta a gastar fôlego.' },
  gramado_encharcado: { nome: 'Gramado Encharcado', tipo: 'dist', lvl: 35, foco: 70, cd: 9000, alcance: 6, poder: 0.9, skill: 'drible', fx: 'area', cor: '#5aa8ff', classe: 'cerebro', efeitoMagia: 'lama', raioZona: 2, durZona: 6000,
    desc: 'Encharca o gramado em volta do alvo por 6 s: quem estiver ali fica bem lento e leva dano a cada segundo.' },
  mascote_caramelo: { nome: 'Chamar o Caramelo', tipo: 'buff', lvl: 15, foco: 60, cd: 10000, dur: 180000, classe: 'motorzinho', efeitoMagia: 'mascote', cor: '#d08a3a',
    desc: 'O Caramelo, o vira-lata da Vila, joga do seu lado por 3 minutos: vai atrás de quem você marcar e dá umas mordidinhas.' },
  ponto_hidratacao: { nome: 'Ponto de Hidratação', tipo: 'cura', lvl: 35, foco: 80, cd: 12000, dur: 8000, poder: 0.9, classe: 'motorzinho', efeitoMagia: 'hidrata', fx: 'curaforte', cor: '#5affe0',
    desc: 'Marca um círculo no chão por 8 s: dentro dele você recupera fôlego (HP) a cada segundo e os adversários levam dano.' },
};
Object.assign(DRIBLES, JOGADAS_CLASSE);
if (typeof EMOJI_DRIBLE !== 'undefined') Object.assign(EMOJI_DRIBLE, { bote: '🐍', lateral_area: '🙌', recuo: '↩️', folha_seca: '🍂', cabeca_fria: '🧊', gramado_encharcado: '💧', mascote_caramelo: '🐕', ponto_hidratacao: '🚰' });
{ // entram na lista de magias da classe (aprende sozinho no nível, aparece no cartão da classe)
  const novas = { paredao: ['bote', 'lateral_area'], driblador: ['recuo', 'folha_seca'], cerebro: ['cabeca_fria', 'gramado_encharcado'], motorzinho: ['mascote_caramelo', 'ponto_hidratacao'] };
  for (const [c, l] of Object.entries(novas)) { const v = VOCACAO[c]; v.magias = [...v.magias.filter(m => !l.includes(m)), ...l].sort((a, b) => DRIBLES[a].lvl - DRIBLES[b].lvl); }
}
// o que cada classe tem de forte e de fraco (cartão da classe e "Minha classe")
Object.assign(VOCACAO.paredao, { forte: 'Corpo a corpo (+35% de dano) e muito fôlego (+35%). Cada ponto de Defesa também aumenta o seu dano. Dá o Bote em quem está longe.', fraco: 'Chute de longe fraco (−30%) e pouca mobilidade.' });
Object.assign(VOCACAO.driblador, { forte: 'Chute de longe (+15% de dano e +2 de alcance) e o Recuo para escapar.', fraco: 'Colado no adversário: drible −30% e toma +25% de dano.' });
Object.assign(VOCACAO.cerebro, { forte: 'Muito foco (+50%), jogadas de longe e em área (+45%) e a Cabeça Fria, que faz o dano gastar foco no lugar do fôlego. Cada ponto de Inteligência também aumenta o seu dano.', fraco: 'Pouco fôlego (−25%): se o foco acabar, fica frágil.' });
Object.assign(VOCACAO.motorzinho, { forte: 'Curas 60% mais fortes, +25% de foco e o Caramelo jogando do seu lado. Cada ponto de Fôlego também aumenta o seu dano.', fraco: 'Pouco dano num alvo só: as vitórias demoram mais.' });
// v261: acertos do balanceamento (teste de caça: as 4 classes perto da mesma XP por minuto)
VOCACAO.cerebro.magia = 1.45; // era 1.35
DRIBLES.lancamento.poder = 3.3; // era 2.6 (o Cérebro começava devagar)
DRIBLES.canhao.poder = 5.8; // era 6.5: o Artilheiro caçava bem mais rápido que as outras classes
VOCACAO.driblador.longe = 1.15; // era 1.4 (o Artilheiro fazia ~70-80% mais XP que a média nos níveis 100-150)
VOCACAO.paredao.perto = 1.35; // era 1.2 (matava devagar)
VOCACAO.motorzinho.perto = 1.15; // era 1 (o dano fraco agora é compensado pelo Caramelo)
// v261: o atributo principal de cada classe também "bate" (sinergia, como no Diablo II). Antes só a Habilidade (do Artilheiro)
// aumentava o dano de tudo; quem seguia a recomendação do Paredão (Defesa) ou do Motorzinho (Fôlego) ficava para trás.
const SINERGIA = { paredao: ['defesa', 0.004], motorzinho: ['folego', 0.003], cerebro: ['inteligencia', 0.0025] }; // % de dano a mais por ponto (a Inteligência já fortalece as jogadas especiais)
{
  const _stJC = stats;
  stats = function () {
    const st = _stJC.apply(this, arguments); const s = G.save, k = s && SINERGIA[s.classe];
    if (k && st.atr) st.danoMult *= 1 + (st.atr[k[0]] || 0) * k[1];
    return st;
  };
}
// o som de cada jogada nova (reaproveita os sons gravados das parecidas)
const SOM_JOGADA = { bote: 'dr_carrinho', lateral_area: 'dr_lancamento', recuo: 'dr_chapeu', folha_seca: 'dr_trivela', cabeca_fria: 'cl_leitura', gramado_encharcado: 'dr_raiz', mascote_caramelo: 'moeda', ponto_hidratacao: 'dr_agua_gelada' };

// ---------- ajudantes ----------
function jcLivre(tx, ty) { return typeof grLivre === 'function' && typeof GRADE !== 'undefined' && GRADE.on ? grLivre(tx, ty, G.p) : podeAndar(tx, ty) && !G.mons.some(m => Math.floor(m.x) === tx && Math.floor(m.y) === ty); }
function jcTeleporta(tx, ty) {
  const p = G.p; efeito('vento', p.x, p.y, '#ffffff');
  p.x = tx + 0.5; p.y = ty + 0.5; p.pas = null; p.fila = null; G.caminho = null; G.acaoChegar = null; p.mov = false;
  efeito('puff', p.x, p.y);
}
// confere tudo antes de usar (igual ao usarDrible do jogo) e devolve o custo; null = não dá
function jcPode(id) {
  const dr = DRIBLES[id], s = G.save; if (!dr || !s || s.hp <= 0 || !s.dribles.includes(id)) return null;
  if (dr.classe !== s.classe) { log(`${dr.nome} é uma jogada de outra classe.`, 'l-sis'); return null; }
  if (s.nivel < dr.lvl) { log(`Você precisa do nível ${dr.lvl} para usar ${dr.nome}.`, 'l-sis'); return null; }
  const st = stats(), custo = Math.ceil(dr.foco * st.custoFoco), grupo = grupoDrible(dr);
  if (s.foco < custo) { log(`Foco (mana) insuficiente para ${dr.nome} (precisa de ${custo}).`, 'l-sis'); som('erro'); return null; }
  if (G.agora < (G.cds[grupo] || 0) || G.agora < (G.cds[id] || 0)) return null;
  return { dr, st, custo, grupo };
}
function jcPaga(id, c) {
  const s = G.save, p = G.p; s.foco -= c.custo; treinaSkill('visao', c.custo);
  G.cds[c.grupo] = G.agora + CD_GRUPO[c.grupo]; G.cds[id] = G.agora + c.dr.cd;
  tituloSkill(p, c.dr.nome, c.dr.cor); p.golpe = G.agora; som(SOM_JOGADA[id] || 'skill'); G.uiSujo = true;
}
function jcDano(dr, m, modo) { VOC_MODO = modo; try { return danoMagia(dr, m); } finally { VOC_MODO = null; } }
function jcAtordoa(m, ms) { m.atordoado = G.agora + (m.d.chefe ? ms * 0.3 : ms); }

// ---------- as zonas no chão (Gramado Encharcado e Ponto de Hidratação) ----------
G.zonas = [];
function jcZonaDe(e, tipo) { return G.zonas.find(z => z.tipo === tipo && Math.hypot(e.x - z.x, e.y - z.y) <= z.r + 0.2); }

// ---------- o Caramelo ----------
G.aliados = [];
function jcSoltaCaramelo(dur) {
  const p = G.p; let c = G.aliados.find(a => a.caramelo);
  if (!c) { c = { uid: ++G.uid, caramelo: true, d: { nome: 'Caramelo', look: { tipo: 'cachorro' } }, x: p.x - 0.8, y: p.y + 0.3, flip: false, fase: 0, mov: false, r: 0.28, cdAtk: 0 }; G.aliados.push(c); }
  c.ate = G.agora + dur; efeito('estrelas', c.x, c.y, '#ffd08a'); texto(c, 'Au au!', '#ffd08a', 900);
}
function jcAtualizaCaramelo(c, dt) {
  const p = G.p, s = G.save;
  if (G.agora > c.ate || s.hp <= 0) { efeito('puff', c.x, c.y); G.aliados.splice(G.aliados.indexOf(c), 1); if (s.hp > 0) log('🐕 O Caramelo cansou e foi tirar um cochilo. Chame de novo quando quiser.', 'l-sis'); return; }
  if (dist(c, p) > 9) { c.x = p.x - 0.7; c.y = p.y + 0.3; efeito('puff', c.x, c.y); }
  // alvo: quem você marcou (perto de você) ou quem está te marcando
  let a = G.alvo && G.mons.includes(G.alvo) && dist(G.alvo, p) < 7 ? G.alvo : null;
  if (!a) a = G.mons.filter(m => m.bravo && !m.d.treino && dist(m, p) < 5).sort((x, y) => dist(x, c) - dist(y, c))[0] || null;
  const destino = a || { x: p.x - (p.flip ? -0.9 : 0.9), y: p.y + 0.35 };
  const d = dist(c, destino), perto = a ? 0.95 : 0.6, v = velJogador() * 1.1 * dt / 1000;
  c.mov = d > perto;
  if (c.mov) { const k = Math.min(1, v / d); c.x += (destino.x - c.x) * k; c.y += (destino.y - c.y) * k; c.fase = (c.fase || 0) + dt * 0.012; if (Math.abs(destino.x - c.x) > 0.02) c.flip = destino.x < c.x; }
  if (a && d <= 1.15 && G.agora >= c.cdAtk) {
    c.cdAtk = G.agora + 1500; c.golpe = G.agora; c.flip = a.x < c.x;
    const forca = 0.3 + 0.3 * Math.min(1, Math.max(0, (s.nivel - 15) / 60)); // o Caramelo cresce com você: 30% do seu drible no nível 15, 60% a partir do 75
    const dano = Math.max(1, Math.round(danoMaxJogador('drible') * (0.15 + 0.85 * Math.random()) * forca - a.d.def * 0.4));
    efeito('impacto', a.x, a.y, '#d08a3a'); aplicaDano(a, dano);
    if (Math.random() < 0.12) texto(c, 'Grrr!', '#ffd08a', 700);
  }
}

// ---------- usar as jogadas novas ----------
{
  const _udJC = usarDrible;
  usarDrible = function (id) {
    const dr = DRIBLES[id];
    if (!dr || !JOGADAS_CLASSE[id] || !dr.efeitoMagia) return _udJC.apply(this, arguments); // Lateral na Área usa o caminho normal (dist + área no alvo)
    const c = jcPode(id); if (!c) return;
    const p = G.p, a = G.alvo && G.mons.includes(G.alvo) ? G.alvo : null;
    if (dr.efeitoMagia === 'bote') {
      if (!a || dist(p, a) > dr.alcance + 0.5 || !linhaVisao(p, a)) { log(`Marque um adversário a até ${dr.alcance} passos, sem obstáculo, para dar o ${dr.nome}.`, 'l-sis'); return; }
      if (dist(p, a) > 1.5) { // chega do lado dele, no quadrado mais perto de você
        const ax = Math.floor(a.x), ay = Math.floor(a.y); let melhor = null, md = 1e9;
        for (const [sx, sy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) { const tx = ax + sx, ty = ay + sy; if (!jcLivre(tx, ty)) continue; const dd = Math.hypot(tx + 0.5 - p.x, ty + 0.5 - p.y); if (dd < md) { md = dd; melhor = { x: tx, y: ty }; } }
        if (!melhor) { log('Não tem espaço do lado dele para dar o bote.', 'l-sis'); return; }
        jcTeleporta(melhor.x, melhor.y);
      }
      p.flip = a.x < p.x; efeito('impacto', a.x, a.y, dr.cor); efeito('vento', a.x, a.y, dr.cor);
      aplicaDano(a, jcDano(dr, a, 'perto')); if (G.mons.includes(a)) jcAtordoa(a, dr.atordoa);
    } else if (dr.efeitoMagia === 'recuo') {
      const pertos = G.mons.filter(m => !m.d.treino && dist(m, p) < 2.6);
      const ref = pertos.length ? pertos : a ? [a] : [];
      if (!ref.length) { log('Ninguém colado em você para dar o Recuo.', 'l-sis'); return; }
      const cx = ref.reduce((s, m) => s + m.x, 0) / ref.length, cy = ref.reduce((s, m) => s + m.y, 0) / ref.length;
      const ang = Math.atan2(p.y - cy, p.x - cx); let destino = null;
      for (const dAng of [0, 0.4, -0.4, 0.8, -0.8, 1.3, -1.3]) for (const r of [3, 2]) {
        if (destino) break;
        const tx = Math.floor(p.x + Math.cos(ang + dAng) * r), ty = Math.floor(p.y + Math.sin(ang + dAng) * r);
        if ((tx !== Math.floor(p.x) || ty !== Math.floor(p.y)) && jcLivre(tx, ty) && segLivre(p.x, p.y, tx + 0.5, ty + 0.5)) destino = { x: tx, y: ty };
      }
      if (!destino) { log('Sem espaço para recuar!', 'l-sis'); return; }
      pertos.filter(m => dist(m, p) < 1.7).forEach(m => { jcAtordoa(m, 1000); efeito('estrelas', m.x, m.y, dr.cor); });
      jcTeleporta(destino.x, destino.y); if (a) p.flip = a.x < p.x;
    } else if (dr.efeitoMagia === 'fura') {
      const alc = dr.alcance + ((vocDe() && vocDe().alcance) || 0);
      if (!a || dist(p, a) > alc + 0.5 || !linhaVisao(p, a)) { log(`Marque um alvo a até ${alc} passos, sem obstáculo, para a ${dr.nome}.`, 'l-sis'); return; }
      p.flip = a.x < p.x;
      const dx = a.x - p.x, dy = a.y - p.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d, fim = d + 2;
      const naLinha = G.mons.filter(m => { if (m.d.treino && m !== a) return false; const t = (m.x - p.x) * ux + (m.y - p.y) * uy; if (t < 0.3 || t > fim) return false; return Math.abs((m.x - p.x) * uy - (m.y - p.y) * ux) < 0.75; });
      const danos = naLinha.map(m => [m, jcDano(dr, m, 'longe')]);
      projetil(p, { x: p.x + ux * fim, y: p.y + uy * fim }, 'bolaforte', () => danos.forEach(([m, dn]) => { if (G.mons.includes(m)) { efeito('impacto', m.x, m.y, dr.cor); aplicaDano(m, dn); } }));
    } else if (dr.efeitoMagia === 'escudo_foco') {
      G.buffs.escudoFoco = G.agora + dr.dur; G.escudoAvisou = false; efeito('escudo', p.x, p.y, dr.cor);
      log('🧊 Cabeça Fria! Por 1 minuto, o dano gasta o seu foco (mana) no lugar do fôlego (HP).', 'l-info');
    } else if (dr.efeitoMagia === 'lama') {
      if (!a || dist(p, a) > dr.alcance + 0.5 || !linhaVisao(p, a)) { log(`Marque um alvo a até ${dr.alcance} passos, sem obstáculo, para o ${dr.nome}.`, 'l-sis'); return; }
      p.flip = a.x < p.x;
      G.zonas.push({ tipo: 'lama', x: Math.floor(a.x) + 0.5, y: Math.floor(a.y) + 0.5, r: dr.raioZona, ate: G.agora + dr.durZona, prox: G.agora + 300, dr, t0: G.agora });
      efeito('area', a.x, a.y, dr.cor, dr.raioZona);
    } else if (dr.efeitoMagia === 'mascote') {
      jcSoltaCaramelo(dr.dur); log('🐕 O Caramelo chegou para jogar do seu lado! Ele vai atrás de quem você marcar.', 'l-info');
    } else if (dr.efeitoMagia === 'hidrata') {
      G.zonas.push({ tipo: 'hidrata', x: Math.floor(p.x) + 0.5, y: Math.floor(p.y) + 0.5, r: 1.6, ate: G.agora + dr.dur, prox: G.agora, dr, t0: G.agora });
      efeito(dr.fx, p.x, p.y, dr.cor); log('🚰 Ponto de Hidratação! Fique dentro do círculo para recuperar fôlego (HP).', 'l-info');
    }
    jcPaga(id, c);
  };
}

// ---------- Cabeça Fria: o dano sai do foco ----------
const CABECA_FRIA_POR_FOCO = 2; // 1 de foco segura 2 de dano (com 1 para 1 o Cérebro vivia bebendo isotônico)
{
  const _rdJC = recebeDano;
  recebeDano = function (dano, m) {
    const s = G.save;
    if (s && s.hp > 0 && (G.buffs.escudoFoco || 0) > G.agora && s.foco > 0 && dano > 0) {
      const segura = Math.min(dano, Math.floor(s.foco) * CABECA_FRIA_POR_FOCO), gasta = Math.ceil(segura / CABECA_FRIA_POR_FOCO); // cada 1 de foco segura 2 de dano
      s.foco = Math.max(0, s.foco - gasta); dano -= segura;
      texto(G.p, '-' + gasta, '#8ac8ff'); G.uiSujo = true;
      if (dano <= 0) { G.p.hitT = G.agora; return; }
    }
    return _rdJC.call(this, dano, m);
  };
}

// ---------- a cada quadro: zonas, Caramelo e avisos ----------
{
  const _atJC = atualiza;
  atualiza = function (dt) {
    const r = _atJC.apply(this, arguments);
    if (!G.save || G.pausado) return r;
    const s = G.save;
    for (let i = G.zonas.length - 1; i >= 0; i--) {
      const z = G.zonas[i]; if (G.agora > z.ate) { G.zonas.splice(i, 1); continue; }
      if (G.agora < z.prox) continue; z.prox = G.agora + 1000;
      const dentro = G.mons.filter(m => !m.d.treino && Math.hypot(m.x - z.x, m.y - z.y) <= z.r + 0.2);
      if (z.tipo === 'lama') dentro.forEach(m => { m.bravo = true; aplicaDano(m, jcDano(z.dr, m, s.classe === 'cerebro' ? 'magia' : null)); });
      if (z.tipo === 'hidrata') {
        dentro.forEach(m => { m.bravo = true; aplicaDano(m, jcDano(z.dr, m, 'perto')); });
        if (s.hp > 0 && Math.hypot(G.p.x - z.x, G.p.y - z.y) <= z.r + 0.2) {
          const st = stats(); const cura = Math.round((st.nivel * 1.2 + st.visao * 3 + 20) * 0.45 * st.curaMult * rnd(0.9, 1.1));
          if (s.hp < st.maxHp) { s.hp = Math.min(st.maxHp, s.hp + cura); texto(G.p, '+' + cura, '#6aff9a'); G.uiSujo = true; }
        }
      }
    }
    for (const c of [...G.aliados]) if (c.caramelo) jcAtualizaCaramelo(c, dt || 16);
    if (G.buffs.escudoFoco && G.agora >= G.buffs.escudoFoco && !G.escudoAvisou) { G.escudoAvisou = true; G.buffs.escudoFoco = 0; if (G.rodando) log('🧊 A Cabeça Fria acabou: o dano volta a gastar fôlego (HP).', 'l-sis'); }
    return r;
  };
  // no Gramado Encharcado, o adversário anda bem mais devagar
  const _amJC = atualizaMonstro;
  atualizaMonstro = function (m, dt) { if (G.zonas.length && jcZonaDe(m, 'lama')) return _amJC.call(this, m, (dt || 16) * 0.4); return _amJC.apply(this, arguments); };
  // trocar de mapa: as zonas somem e o Caramelo vem junto
  const _emJC = entrarMapa;
  entrarMapa = function () { const r = _emJC.apply(this, arguments); G.zonas = []; if (G.p) for (const c of G.aliados) { c.x = G.p.x - 0.7; c.y = G.p.y + 0.3; } return r; };
  // o desenho das zonas no chão
  const _dccJC = desenhaChaoClima;
  desenhaChaoClima = function (ctx) {
    const r = _dccJC.apply(this, arguments);
    for (const z of G.zonas) {
      const resta = z.ate - G.agora, a = Math.min(1, (G.agora - z.t0) / 250) * Math.min(1, resta / 400), pul = 1 + Math.sin(G.agora / 260) * 0.03;
      ctx.save(); ctx.globalAlpha = a;
      ctx.beginPath(); ctx.ellipse(z.x * T, z.y * T, (z.r + 0.4) * T * pul, (z.r + 0.4) * T * 0.62 * pul, 0, 0, 7);
      ctx.fillStyle = z.tipo === 'lama' ? 'rgba(70,130,210,0.30)' : 'rgba(110,235,120,0.24)'; // lama azul, hidratação verde ctx.fill();
      ctx.lineWidth = 3; ctx.setLineDash([10, 7]); ctx.lineDashOffset = -G.agora / 40; ctx.strokeStyle = z.tipo === 'lama' ? 'rgba(150,200,255,0.9)' : 'rgba(170,255,160,0.95)'; ctx.stroke();
      ctx.restore();
    }
    return r;
  };
}
// jogo novo / outro save: sem Caramelo nem zonas sobrando
{ const _iniJC = iniciarJogo; iniciarJogo = async function () { G.aliados = []; G.zonas = []; G.buffs.escudoFoco = 0; return _iniJC.apply(this, arguments); }; }
