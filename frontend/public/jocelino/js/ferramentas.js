// Jocelino — ferramentas.js — o item da mão: ferramentas (foice, machado, picareta, pá, regador) golpeiam o ladrilho
// alvo como no Stardew: o ladrilho do clique se for um dos 8 em volta do Jocelino (clicar no desenho de uma pedra ou na
// copa de uma árvore mira nela); clique longe faz ele virar para o lado do clique e bater na frente; a tecla C bate na
// frente. Segurar o botão repete o golpe. Gasta 2 de energia (de 270). O detrito certo treme, perde vida e, quando quebra, solta os itens no
// chão, que pulam e vêm para a mochila quando o Jocelino passa perto. Comida na mão: botão direito come.

const ENERGIA_MAX = 270, CUSTO_GOLPE = 2;
const NOME_FERRAMENTA = { foice: 'a foice', machado: 'o machado', picareta: 'a picareta', pa: 'a pá', regador: 'o regador', colher: 'a colher', mangueira: 'a mangueira', rolo: 'o rolo de pintura' };   // (tarefa 7: sem a colher, a seta dizia "Use colher na plaquinha")

// O começo do jogo: a mochila com as ferramentas (as mesmas do Godot) e a energia cheia.
INICIADORES.push(s => {
  G.mochila = new Mochila(Mochila.JOGADOR);   // (48 espaços; o save de 36 ganha os novos vazios, deDict)
  if (s.mochila) G.mochila.deDict(s.mochila);
  else for (const f of ['foice', 'machado', 'picareta', 'pa', 'regador']) G.mochila.adicionar(f, 1);
  G.sel = s.sel || 0;
  G.energiaMax = ENERGIA_MAX;
  G.energia = s.energia == null || s.energia === 100 && !s.mochila ? ENERGIA_MAX : s.energia;
});
COLETORES.push(s => { s.mochila = G.mochila.paraDict(); s.sel = G.sel; });

const itemDaMao = () => G.mochila ? G.mochila.idEm(G.sel) : '';
// O nível da ferramenta (0 = comum; o Seu Tonico melhora na etapa 5).
const nivelFerramenta = id => (G.nivelFerr && G.nivelFerr[id]) || 0;

// O detrito cujo desenho está sob o ponto (a copa da árvore, o alto da pedra), não só o ladrilho do pé.
function detritoSob(px, py) {
  let melhor = null, d = 1e9;
  for (const o of G.mapa.objs) {
    if (o.tipo !== 'detrito') continue;
    const img = spr(o.nome);
    const w = img ? img.naturalWidth : TILE, h = img ? img.naturalHeight : TILE;
    if (px < o.x - w / 2 || px > o.x + w / 2 || py < o.y - h || py > o.y + 4) continue;
    const dist = Math.hypot(o.x - px, o.y - 20 - py);
    if (dist < d) { d = dist; melhor = o; }
  }
  return melhor;
}
// O alvo do golpe e a direção em que o Jocelino vira.
// Um objeto que recebe ferramenta (a plaquinha do serviço, o lote da obra) sob o mouse, pelo desenho inteiro (teste de 12/10:
// a plaquinha tem um ladrilho e meio; clicar na tábua de cima acertava o ladrilho vazio de cima e "nada acontecia").
function interComFerramentaSob(px, py) {
  let melhor = null, d = 1e9;
  for (const o of G.mapa.objs) {
    if (o.tipo !== 'inter' || !o.ferramenta || !o.tiles || !o.tiles.length) continue;
    const img = spr(o.nome);
    const w = img ? img.naturalWidth : TILE, h = img ? img.naturalHeight : TILE;
    if (px < o.x - w / 2 || px > o.x + w / 2 || py < o.y - h || py > o.y + 4) continue;
    const dist = Math.hypot(o.x - px, o.y - 20 - py);
    if (dist < d) { d = dist; melhor = o; }
  }
  return melhor;
}
function alvoDoGolpe(peloTeclado) {
  const j = G.jog, p = j.ladrilho();
  const frente = dir => ({ dir, x: p.x + DIR_VET[dir][0], y: p.y + DIR_VET[dir][1] });
  // (teste de 12/10) Vindo de cima, o Jocelino entra um pouco no ladrilho da pedra (a colisão é pequena): sem nada na frente e
  // com o detrito no próprio ladrilho, o golpe vai nele, e não no ladrilho vazio de baixo.
  const aqui = G.mapa.ocupado.get(chaveT(p.x, p.y)), noProprio = aqui && aqui.tipo === 'detrito';
  if (peloTeclado) { const f = frente(j.dir); return noProprio && !G.mapa.ocupado.get(chaveT(f.x, f.y)) ? { dir: j.dir, x: p.x, y: p.y } : f; }
  const mm = mouseMundo();
  let t = { x: Math.floor(mm.x / TILE), y: Math.floor(mm.y / TILE) };
  const o = detritoSob(mm.x, mm.y) || interComFerramentaSob(mm.x, mm.y);
  const cheb = a => Math.max(Math.abs(a.x - p.x), Math.abs(a.y - p.y));
  if (o) t = o.tiles.reduce((a, b) => cheb(b) < cheb(a) ? b : a);
  const perto = cheb(t) <= 1 && (t.x !== p.x || t.y !== p.y || (!!o && noProprio));   // clicar no detrito do próprio ladrilho vale
  // Vira pelo vetor do Jocelino até o alvo (ou até o clique, quando é longe).
  const ax = perto ? (t.x + 0.5) * TILE : mm.x, ay = perto ? (t.y + 0.5) * TILE : mm.y;
  const dx = ax - j.x, dy = ay - (j.y - 18);
  const dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? DIR.ESQUERDA : DIR.DIREITA) : (dy < 0 ? DIR.CIMA : DIR.BAIXO);
  if (perto) return { dir, x: t.x, y: t.y };
  if (Math.hypot(dx, dy) < TILE * 0.5) return frente(j.dir);      // clique em cima do próprio Jocelino
  // (C5, 16/10; o teste crítico B: ~20 cliques na árvore de longe, a mangueira de longe na obra, sem nenhum aviso) O clique de longe
  // EM CIMA de uma coisa que a ferramenta trabalha (o detrito, a obra, a plaquinha do serviço), com nada na frente do Jocelino para
  // bater: o mesmo "Chegue mais perto." da horta, sem gastar o golpe. Com alguma coisa na frente, bate nela como antes.
  const f = frente(dir), naFrente = G.mapa.ocupado.get(chaveT(f.x, f.y)), sob = o || G.mapa.ocupado.get(chaveT(t.x, t.y));
  if (!naFrente && sob && (sob.tipo === 'detrito' || (sob.tipo === 'inter' && sob.ferramenta))) f.longe = true;
  return f;
}
// O aviso do clique de longe (a horta, a árvore, a obra, o lugar da reforma): o mesmo texto, sem repetir a cada clique colado.
let _avisoPertoEm = -1e9;
function avisarChegueMaisPerto(extra = '') {
  const ag = performance.now(); if (ag - _avisoPertoEm < 900) return; _avisoPertoEm = ag;
  avisar('Chegue mais perto.' + (extra ? ' ' + extra : ''));
}

function usarItemDaMao(peloTeclado) {
  const j = G.jog;
  if (!j || menuAberto() || j.golpe > 0 || j.travado > 0) return;
  const id = itemDaMao();
  if (typeof varaNaMao === 'function' && varaNaMao(id)) return;   // a vara de pescar tem o seu jeito (pesca_jogo.js)
  if (!Itens.ehFerramenta(id)) return;
  if (j.carga && j.carga.id) { avisar('Primeiro entregue o que está carregando.'); return; }
  const alvo = alvoDoGolpe(peloTeclado);
  if (alvo.longe) { j.dir = alvo.dir; avisarChegueMaisPerto(); return; }   // (C5) de longe: vira para lá e avisa, sem golpe
  const custo = (typeof Habilidades !== 'undefined' ? Habilidades.custo(id, typeof golpeDeAcabamento === 'function' && golpeDeAcabamento(id, alvo)) : CUSTO_GOLPE) * (1 + 0.5 * nivelFerramenta(id)) * (typeof fatorArMina === 'function' ? fatorArMina() : 1) * (typeof fatorEnergiaLote === 'function' ? fatorEnergiaLote(id, alvo) : 1);
  if (G.energia < custo) { avisar('O Jocelino está esgotado. Coma alguma coisa ou vá dormir.'); return; }
  j.dir = alvo.dir;
  const pf = PERFIL_GOLPE[perfilDe(id)];
  j.golpe = pf.dur; j.golpeItem = id; j.golpeT = 0; j.golpeAlvo = { x: alvo.x, y: alvo.y }; j.acertou = false; j._somSubida = false;
  G.energia = Math.max(0, G.energia - custo);
  if (id === 'foice') sons.tocar('golpe', 1.2, 0.08, -8);
  hudSujo();
}

// O acerto (no meio do golpe).
// O acerto: o ladrilho do alvo e, com a ferramenta reforçada (pá, regador, colher), os seguintes em linha.
function acertar(id, alvo) {
  const vistos = new Set();   // a casa ou o lote de vários ladrilhos leva um golpe só
  const tiles = typeof areaDoGolpe === 'function' ? areaDoGolpe(id, alvo, G.jog ? G.jog.dir : 0) : [alvo];
  for (const t of tiles) {
    // A foice em leque só corta o que a foice já corta (o mato): nunca arranca planta da horta nem mexe em serviço.
    if (id === 'foice' && (t.x !== alvo.x || t.y !== alvo.y)) {
      const o = G.mapa.ocupado.get(chaveT(t.x, t.y)), D = o && o.tipo === 'detrito' && DETRITOS[o.det];
      if (!D || !(D.ferramenta === 'foice' || (D.aceita || []).includes('foice'))) continue;
    }
    acertarUm(id, t, vistos);
  }
}
function acertarUm(id, alvo, vistos) {
  if (typeof VARAS !== 'undefined' && VARAS.includes(id)) return;   // a vara não bate em nada
  const m = G.mapa;
  if (typeof golpeNoLocal === 'function' && golpeNoLocal(id, alvo, vistos)) return;   // o serviço curto no lugar de verdade (a ponte, o píer...)
  const o = m.ocupado.get(chaveT(alvo.x, alvo.y));
  if (o && vistos) { if (vistos.has(o)) return; vistos.add(o); }
  if (o && o.tipo === 'detrito') {
    const D = DETRITOS[o.det];
    const certa = D.ferramenta === id || (D.aceita || []).includes(id);
    if (!certa) { o.treme = 0.25; sons.tocar('madeira', 1.6, 0.05, -10); avisar('Isso sai com ' + (NOME_FERRAMENTA[D.ferramenta] || D.ferramenta) + '.'); return; }
    if (D.nivel && nivelFerramenta(id) < D.nivel) { o.treme = 0.25; sons.tocar('madeira', 1.6, 0.05, -10); avisar(`Isso pede ${NOME_FERRAMENTA[id] || id} mais forte (o Seu Tonico melhora).`); return; }
    o.vida -= typeof danoDaFerramenta === 'function' ? danoDaFerramenta(id) : 1; o.treme = 0.3;
    if (id !== 'foice') G.tremor = Math.max(G.tremor || 0, D.material === 'pedra' ? 0.14 : 0.1);
    lascas(o.x, o.y - 20, D.material);
    sons.tocar(D.material === 'pedra' ? 'pedra' : D.material === 'mato' ? 'foice' : 'madeira', 1, 0.08, -4);
    if (o.vida <= 0) quebrar(o);
    return;
  }
  if (o && o.tipo === 'inter' && o.ferramenta) { o.ferramenta(o, id, alvo); return; }
  if (id === 'pa' && !o && G.mapa.chaoEm(alvo.x, alvo.y) === CH.GRAMA && typeof minhocaAoCavar === 'function') minhocaAoCavar(alvo);   // às vezes sai minhoca
  if (typeof chaoAcertado === 'function' && chaoAcertado(id, alvo)) return;   // a horta: a pá cava, o regador rega
  if (id === 'regador') { lascas((alvo.x + 0.5) * TILE, (alvo.y + 0.5) * TILE, 'agua'); sons.tocar('agua', 1, 0.1, -4); }   // a Roça sobe só na cova
  else if (id !== 'mangueira' && id !== 'rolo') sons.tocar('terra', 1.3, 0.1, -10);   // (a água e a tinta já têm o som delas)
}
function quebrar(o) {
  const m = G.mapa, D = DETRITOS[o.det];
  m.tirar(o);
  if (G.limpou) G.limpou[o.det] = (G.limpou[o.det] || 0) + 1;   // o que já aprendeu a limpar (as setas, guia_setas.js)
  for (const id in D.solta) soltar(id, D.solta[id], o.x, o.y - 10, true);   // (o que sai do detrito conta na coleta do recado)
  if (typeof Habilidades !== 'undefined') for (const [id, q] of Object.entries(Habilidades.sobraAoQuebrar(o.det))) soltar(id, q, o.x, o.y - 10, true);   // (15/10, T4) Pedra de sobra, Lenha boa
  if (o.det === 'entulho' && Math.random() < (typeof Habilidades !== 'undefined' && Habilidades.tem('limpinho') ? 0.25 : 0.15)) soltar('ferro_velho', 1, o.x, o.y - 10);
  if (typeof quebrouNaObra === 'function') quebrouNaObra(o);
  if (typeof quebrouEmpreita === 'function') quebrouEmpreita(o);
  if (typeof quebrouNaMina === 'function') quebrouNaMina(o);
  if (typeof quebrouNoGuia === 'function') quebrouNoGuia(o);
  if (typeof quebrouNoQuintal === 'function') quebrouNoQuintal(o);
  if (typeof quebrouNaMata === 'function') quebrouNaMata(o);
  if (typeof Habilidades !== 'undefined') {
    const limpeza = ['mato', 'galho', 'entulho'].includes(o.det) && Habilidades.tem('faxineiro') ? 2 : 1;
    Habilidades.ganhar(o.det === 'entulho' ? 'alvenaria' : 'folego', limpeza * (o.det === 'entulho' ? 2 : 1));
  }
  if (D.vira) m.detrito(D.vira, o.tiles[0].x, o.tiles[0].y);
  sons.tocar('quebra', 1, 0.1, -4);
}

// ---------- itens no chão ----------
// coleta: o item veio do mundo (detrito quebrado) e conta na coleta do recado; a sobra de baú, prêmio, compra ou da mão que o
// jogador solta com a mochila cheia não conta (revisão da T3).
function soltar(id, qtd, x, y, coleta = false) {
  for (let k = 0; k < qtd; k++) G.mapa.itens.push({ id, qtd: 1, x: x + rnd(-14, 14), y, vx: rnd(-80, 80), vy: rnd(-30, 30), z: 0, vz: rnd(260, 340), t: 0, coleta,
    desenha(ctx) { ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(this.x, this.y, 12, 4, 0, 0, Math.PI * 2); ctx.fill(); desenhaPe(ctx, 'itens/' + this.id, this.x, this.y - this.z - 2, 1, 0.6); } });
}
ATUALIZADORES.push(dt => {
  const m = G.mapa, j = G.jog;
  if (!m || !j) return;
  // Golpe: a ferramenta gira e acerta no meio.
  if (j.golpe > 0) {
    const pf = PERFIL_GOLPE[perfilDe(j.golpeItem)];
    j.golpeT = (j.golpeT || 0) + dt;
    if (!j._somSubida && !SEM_ZUNIDO.has(j.golpeItem) && j.golpeT >= pf.subida - 0.06) { j._somSubida = true; sons.tocar('golpe', j.golpeItem === 'picareta' ? 0.9 : 1, 0.08, -10); }   // (a colher, a mangueira e o rolo não zunem: não há pancada)
    if (!j.acertou && j.golpeT >= pf.acerto) {
      j.acertou = true; acertar(j.golpeItem, j.golpeAlvo);
      const pc = pontoDoGolpe(j);
      if (pc && j.golpeItem === 'colher') lascas(pc.x, pc.y, 'massa', 3);   // respingos de massa na ponta da colher
      // (15/10) a mangueira espirra água onde o jato bate no chão; o rolo pinga tinta
      if (pc && j.golpeItem === 'mangueira') { lascas(pc.x, pc.y, 'agua', 8); sons.tocar('agua', 1.2, 0.1, -6); }
      if (pc && j.golpeItem === 'rolo') { lascas(pc.x, pc.y, 'tinta', 3); sons.tocar('derramar', 1.3, 0.1, -14); }
    }
  }
  // Segurar o botão repete o golpe (como no Stardew).
  // (correção 2) segurar no mundo e arrastar até o HUD (o quadro, o cartão, a barrinha) não continua golpeando
  if (G.mouse.segura && !(j.golpe > 0) && !menuAberto() && !(typeof mouseNoPainelDoHud === 'function' && mouseNoPainelDoHud(G.mouse.x, G.mouse.y))) usarItemDaMao();
  if (G.tremor > 0) G.tremor = Math.max(0, G.tremor - dt);
  for (const it of m.itens) {
    it.t += dt;
    if (it.z > 0 || it.vz > 0) { it.vz -= 900 * dt; it.z = Math.max(0, it.z + it.vz * dt); if (it.z === 0) { it.vz = it.vz < -60 ? -it.vz * 0.35 : 0; it.vx *= 0.6; } it.x += it.vx * dt; it.y += it.vy * dt; }
    // Depois de assentar, vem para o Jocelino quando ele passa perto.
    const d = Math.hypot(j.x - it.x, j.y - it.y);
    if (it.t > 0.45 && d < 1.6 * TILE) { it.x += (j.x - it.x) * Math.min(1, dt * 9); it.y += (j.y - it.y) * Math.min(1, dt * 9); }
    if (it.t > 0.45 && d < 22) {
      const sobra = G.mochila.adicionar(it.id, it.qtd);
      if (sobra < it.qtd) { it.pegou = true; avisar('+ ' + Itens.qtd(it.qtd - sobra, it.id)); sons.tocar('pegar', 1, 0.05, -4); hudSujo(); if (it.coleta) for (const f of AO_PEGAR) f(it.id, it.qtd - sobra); }
    }
  }
  m.itens = m.itens.filter(i => !i.pegou);
  if (LASCAS._mapa !== G.mapaId) { LASCAS.length = 0; LASCAS._mapa = G.mapaId; }   // trocou de mapa: as lascas ficam para trás
  for (const l of LASCAS) { l.t += dt; l.x += l.vx * dt; l.y += l.vy * dt; l.vy += 600 * dt; }
  for (let i = LASCAS.length - 1; i >= 0; i--) if (LASCAS[i].t > 0.5) LASCAS.splice(i, 1);
});

// Lascas que voam no golpe (terra, madeira, pedra, água).
const LASCAS = [];
const FX_LASCA = { pedra: 'lasca_pedra', madeira: 'lasca_madeira', mato: 'lasca_mato', agua: 'gota', massa: 'lasca_pedra', tinta: 'gota' };   // (a massa: o cinza da lasca de pedra; a tinta azul-clara: a gota)
function lascas(x, y, tipo, n = 7) { if (!MODO_TESTE.efeitos) return; for (let k = 0; k < n; k++) LASCAS.push({ x, y, vx: rnd(-140, 140), vy: rnd(-260, -80), t: 0, fx: FX_LASCA[tipo] || 'lasca_terra' }); }

// ---------- a animação do golpe ----------
// Como o Stardew: o golpe pesado (picareta, machado, pá) sobe a ferramenta por cima da cabeça, segura um instante e desce
// rápido até o ladrilho alvo (no acerto, a ponta está em cima dele); a foice varre em arco na frente; o regador inclina e
// derrama. Cada quadro-chave: tempo, ângulo da ferramenta (graus, 0 = para a direita, 90 = para baixo), a mão (relativa ao
// pé do Jocelino), tamanho, encurtamento (quando aponta para a câmera ou para longe) e se fica atrás do corpo.
// O lado esquerdo é o direito espelhado.
const K = (t, ang, hx, hy, esc = 1, enc = 1, atras = false) => ({ t, ang, hx, hy, esc, enc, atras });
const PERFIL_GOLPE = {
  pesada: { dur: 0.40, subida: 0.17, acerto: 0.22, quadros: {
    [DIR.BAIXO]: [K(0, -84, 6, -74, 1, 1, true), K(0.15, -96, 2, -100, 1, 1, true), K(0.19, -100, 2, -104, 1, 1, true), K(0.205, 90, 1, -86, 1.05, 0.35),
      K(0.22, 90, 0, -45, 1.15), K(0.30, 86, 0, -44, 1.15), K(0.40, -84, 6, -74, 1, 1, true)],
    [DIR.CIMA]: [K(0, -70, 6, -64, 1, 1, true), K(0.15, -90, 0, -104), K(0.19, -92, 0, -108), K(0.205, -90, 0, -84, 1, 0.5, true),
      K(0.22, -90, 0, -50, 1.05, 0.2, true), K(0.30, -90, 0, -50, 1.05, 0.22, true), K(0.40, -70, 6, -64, 1, 1, true)],
    [DIR.DIREITA]: [K(0, -110, 6, -74, 1, 1, true), K(0.15, -150, -2, -96, 1, 1, true), K(0.19, -158, -4, -98, 1, 1, true), K(0.205, -40, 14, -84, 1.05),
      K(0.22, 50, 20, -54, 1.15), K(0.30, 46, 20, -53, 1.15), K(0.40, -110, 6, -74, 1, 1, true)],
  } },
  pa: { dur: 0.38, subida: 0.15, acerto: 0.21, quadros: {
    [DIR.BAIXO]: [K(0, -84, 6, -74, 1, 1, true), K(0.14, -84, 4, -88, 1, 1, true), K(0.18, -86, 4, -90, 1, 1, true), K(0.195, 90, 2, -76, 1, 0.4), K(0.21, 92, 0, -48, 1.15),
      K(0.29, 88, 0, -50, 1.15), K(0.38, -84, 6, -74, 1, 1, true)],
    [DIR.CIMA]: [K(0, -70, 6, -64, 1, 1, true), K(0.14, -90, 0, -96), K(0.18, -90, 0, -98), K(0.21, -90, 0, -50, 1.05, 0.2, true),
      K(0.29, -90, 0, -52, 1.05, 0.24, true), K(0.38, -70, 6, -64, 1, 1, true)],
    [DIR.DIREITA]: [K(0, -110, 6, -74, 1, 1, true), K(0.14, -120, 2, -88, 1, 1, true), K(0.18, -126, 0, -90, 1, 1, true), K(0.21, 52, 20, -54, 1.15),
      K(0.29, 48, 18, -56, 1.15), K(0.38, -110, 6, -74, 1, 1, true)],
  } },
  foice: { dur: 0.30, subida: 0.06, acerto: 0.13, quadros: {
    [DIR.BAIXO]: [K(0, -10, 10, -58, 1.1), K(0.06, 10, 8, -56, 1.1), K(0.13, 90, 0, -48, 1.15), K(0.20, 170, -8, -56, 1.1), K(0.30, 190, -10, -58, 1.1)],
    [DIR.CIMA]: [K(0, 190, -10, -66, 1.1, 1, true), K(0.06, 210, -8, -68, 1.1, 1, true), K(0.13, 270, 0, -52, 1.1, 0.17, true), K(0.20, 330, 8, -68, 1.1, 1, true), K(0.30, 350, 10, -66, 1.1, 1, true)],
    [DIR.DIREITA]: [K(0, -100, 12, -64, 1.1, 1, true), K(0.06, -70, 14, -62, 1.1), K(0.13, 30, 20, -54, 1.15), K(0.20, 80, 16, -52, 1.1), K(0.30, 95, 14, -54, 1.1)],
  } },
  regador: { dur: 0.55, subida: 0.12, acerto: 0.22, quadros: {
    [DIR.BAIXO]: [K(0, -45, 0, -54), K(0.12, -45, 0, -50), K(0.22, -10, 0, -48), K(0.45, -10, 0, -48), K(0.55, -45, 0, -54)],
    [DIR.CIMA]: [K(0, -45, 0, -70, 1, 1, true), K(0.12, -45, 0, -74, 1, 1, true), K(0.22, -80, 0, -78, 1, 1, true), K(0.45, -80, 0, -78, 1, 1, true), K(0.55, -45, 0, -70, 1, 1, true)],
    [DIR.DIREITA]: [K(0, -45, 18, -58), K(0.12, -45, 20, -56), K(0.22, 0, 24, -52), K(0.45, 0, 24, -52), K(0.55, -45, 18, -58)],
  } },
};
// A colher de pedreiro ASSENTA MASSA (15/10: "a animação do uso da colher de pedreiro está a antiga ainda"): agachado, pega a
// massa, leva, espalha arrastando e alisa batendo de leve com a ponta (golpe_colher.webp). Sem subir nada: um gesto mais
// calmo que a pancada (0,52 s contra 0,40), cada quadro com o seu tempo (marcas = onde começam os quadros 1, 2 e 3); o
// acerto é no alisar (quadro 3), quando a ponta toca a massa. As poses de ferramenta (só para quando a folha ainda não
// carregou) são as da pá, esticadas no tempo.
PERFIL_GOLPE.colher = { dur: 0.52, subida: 0.26, acerto: 0.36, marcas: [0.13, 0.26, 0.36], quadros: {} };
for (const d in PERFIL_GOLPE.pa.quadros) PERFIL_GOLPE.colher.quadros[d] = PERFIL_GOLPE.pa.quadros[d].map(k => ({ ...k, t: k.t * 0.52 / 0.38 }));
// (15/10, o dono: "regar a parede não está legal") LAVAR NO MEIO, PINTAR NO FIM. A mangueira (golpe_mangueira.webp): mira, o jato
// bate no chão à frente e varre de um lado para o outro; o acerto é na 2ª varrida (quadro 3), quando a água espirra. O rolo
// (golpe_rolo.webp): carregado embaixo, sobe, no alto, desce pingando; o acerto é na descida (quadro 3). Sem pancada, sem zunido.
// As poses de ferramenta (só para quando a folha ainda não carregou): a do regador e a da pá, esticadas no tempo.
PERFIL_GOLPE.mangueira = { dur: 0.6, subida: 0.22, acerto: 0.34, marcas: [0.1, 0.22, 0.34], quadros: {} };
for (const d in PERFIL_GOLPE.regador.quadros) PERFIL_GOLPE.mangueira.quadros[d] = PERFIL_GOLPE.regador.quadros[d].map(k => ({ ...k, t: k.t * 0.6 / 0.55 }));
PERFIL_GOLPE.rolo = { dur: 0.6, subida: 0.3, acerto: 0.45, marcas: [0.15, 0.3, 0.45], quadros: {} };
for (const d in PERFIL_GOLPE.pa.quadros) PERFIL_GOLPE.rolo.quadros[d] = PERFIL_GOLPE.pa.quadros[d].map(k => ({ ...k, t: k.t * 0.6 / 0.38 }));
const SEM_ZUNIDO = new Set(['foice', 'colher', 'mangueira', 'rolo']);
function perfilDe(id) { return ['foice', 'regador', 'pa', 'colher', 'mangueira', 'rolo'].includes(id) ? id : 'pesada'; }
// Onde a ferramenta toca o chão no quadro de impacto da folha desenhada, relativo ao pé (LEIA_golpe.txt): as lascas saem dali.
// (a mangueira: onde a água cai no chão; o rolo: o meio do rolo na parede, descendo)
const CONTATO_GOLPE = { colher: { [DIR.BAIXO]: [-7, 9], [DIR.CIMA]: [31, -1], [DIR.ESQUERDA]: [-19, -1], [DIR.DIREITA]: [18, -1] },
  mangueira: { [DIR.BAIXO]: [39, 11], [DIR.CIMA]: [-36, 6], [DIR.ESQUERDA]: [-37, 3], [DIR.DIREITA]: [37, 3] },
  rolo: { [DIR.BAIXO]: [15, -26], [DIR.CIMA]: [34, -41], [DIR.ESQUERDA]: [-44, -48], [DIR.DIREITA]: [43, -48] } };
function pontoDoGolpe(j) {
  const c = CONTATO_GOLPE[j.golpeItem] && CONTATO_GOLPE[j.golpeItem][j.dir];
  return c ? { x: j.x + c[0], y: j.y + 2 + c[1] } : null;   // (+2: a folha é desenhada com o pé em j.y + 2)
}
const _suave = (a, b, u) => a + (b - a) * u;
// A pose da ferramenta no instante t (interpolada entre os quadros-chave; a subida desacelera, a descida acelera).
function poseFerramenta(j) {
  const pf = PERFIL_GOLPE[perfilDe(j.golpeItem)];
  const esq = j.dir === DIR.ESQUERDA;
  const ks = pf.quadros[esq ? DIR.DIREITA : j.dir];
  const t = clamp(j.golpeT || 0, 0, pf.dur);
  let i = 0;
  while (i < ks.length - 2 && t > ks[i + 1].t) i++;
  const a = ks[i], b = ks[i + 1];
  let u = clamp((t - a.t) / Math.max(0.001, b.t - a.t), 0, 1);
  u = b.t <= pf.subida ? 1 - (1 - u) * (1 - u) : b.t <= pf.acerto ? u * u : u * u * (3 - 2 * u);
  const r = { ang: _suave(a.ang, b.ang, u), hx: _suave(a.hx, b.hx, u), hy: _suave(a.hy, b.hy, u), esc: _suave(a.esc, b.esc, u), enc: _suave(a.enc, b.enc, u), atras: u < 0.5 ? a.atras : b.atras };
  // Alvo na diagonal: na descida a mão puxa para o lado do alvo.
  const p = j.ladrilho(), al = j.golpeAlvo || p;
  const ddx = clamp(al.x - p.x, -1, 1), ddy = clamp(al.y - p.y, -1, 1);
  const k = t > pf.acerto + 0.1 ? 0 : clamp((t - pf.subida) / Math.max(0.001, pf.acerto - pf.subida), 0, 1);
  if (j.dir === DIR.BAIXO || j.dir === DIR.CIMA) { r.hx += ddx * 30 * k; r.ang += ddx * (j.dir === DIR.BAIXO ? -28 : 28) * k; }
  else r.hy += ddy * 26 * k;
  if (esq) { r.ang = 180 - r.ang; r.hx = -r.hx; }
  return r;
}
const COMPR_FERRAMENTA = 50;           // da mão até a cabeça da ferramenta (pixels, no tamanho 1)
function pontaDaFerramenta(j) {
  const q = poseFerramenta(j), L = COMPR_FERRAMENTA * q.esc * q.enc, a = q.ang * Math.PI / 180;
  return { x: j.x + q.hx + Math.cos(a) * L, y: j.y + q.hy + Math.sin(a) * L };
}
// O corpo acompanha: estica na subida, encolhe e inclina para a frente no impacto.
function poseCorpo(j) {
  const pf = PERFIL_GOLPE[perfilDe(j.golpeItem)], t = j.golpeT || 0;
  if (j.golpeItem === 'regador') return { sx: 1, sy: 1, inc: 0, dy: 0 };
  const sobe = t < pf.subida ? Math.sin(Math.PI / 2 * t / pf.subida) : t < pf.acerto ? 1 - (t - pf.subida) / (pf.acerto - pf.subida) : 0;
  const bate = t >= pf.acerto - 0.015 ? Math.max(0, 1 - (t - pf.acerto) / (pf.dur - pf.acerto)) : 0;
  const lado = j.dir === DIR.DIREITA ? 1 : j.dir === DIR.ESQUERDA ? -1 : 0;
  return { sx: 1 - 0.02 * sobe + 0.05 * bate, sy: 1 + 0.045 * sobe - 0.07 * bate, inc: (-4 * sobe + 6 * bate) * lado * Math.PI / 180, dy: 2 * bate };
}
function _desenhaFerr(ctx, j, q, img, alfa) {
  ctx.save();
  ctx.globalAlpha = alfa;
  ctx.translate(j.x + q.hx, j.y + q.hy);
  if (j.golpeItem === 'regador') {
    // O regador fica de pé e inclina para o lado em que o Jocelino olha.
    ctx.scale(j.dir === DIR.ESQUERDA ? -1 : 1, 1);
    ctx.rotate((q.ang + 45) * Math.PI / 180 * 0.9);
    ctx.drawImage(img, -21, -30, 42, 42);
  } else {
    // Gira para o ângulo, encurta ao longo do cabo e desenha o ícone (cabo embaixo à esquerda, cabeça em cima à direita).
    ctx.rotate(q.ang * Math.PI / 180);
    ctx.scale(q.esc * q.enc, q.esc * (j.dir === DIR.ESQUERDA ? -1 : 1));
    ctx.rotate(Math.PI / 4);
    ctx.drawImage(img, -9, -39, 42, 42);
  }
  ctx.restore();
}
// Desenha a ferramenta: atras = antes do corpo (erguida atrás da cabeça, ou virado para cima); senão, depois do corpo.
function desenhaFerramenta(ctx, j, atras) {
  if (!(j.golpe > 0) || !j.golpeItem) return;
  const q = poseFerramenta(j);
  if (q.atras !== atras) return;
  const img = spr('itens/' + j.golpeItem);
  if (!img) return;
  const pf = PERFIL_GOLPE[perfilDe(j.golpeItem)], t = j.golpeT || 0;
  // Rastro na descida rápida (e na varrida da foice): duas sombras um pouco atrás no tempo.
  if (j.golpeItem !== 'regador' && t > pf.subida && t < pf.acerto + 0.04) {
    for (const [antes, alfa] of [[0.03, 0.18], [0.015, 0.32]]) {
      const sombra = { x: j.x, y: j.y, dir: j.dir, golpeItem: j.golpeItem, golpeAlvo: j.golpeAlvo, golpeT: t - antes, ladrilho: () => j.ladrilho() };
      _desenhaFerr(ctx, j, poseFerramenta(sombra), img, alfa);
    }
  }
  _desenhaFerr(ctx, j, q, img, 1);
  // Água do regador: gotas da bica até o ladrilho.
  if (j.golpeItem === 'regador' && t > 0.18 && t < 0.47 && j.golpeAlvo) {
    const bx = j.x + q.hx + (j.dir === DIR.ESQUERDA ? -16 : j.dir === DIR.DIREITA ? 16 : 0), by = j.y + q.hy;
    const cx = (j.golpeAlvo.x + 0.5) * TILE, cy = (j.golpeAlvo.y + 0.5) * TILE;
    for (let k = 0; k < 6; k++) { const u = (t * 5 + k / 6) % 1; desenhaFx(ctx, 'gota', _suave(bx, cx, u) + Math.sin(k * 7) * 6, _suave(by, cy, u)); }
  }
}
// O quadro da folha de golpe desenhada (a/personagens/jocelino/golpe_<ferramenta>, 4 direções × 4 quadros:
// 0 preparo, 1 no alto, 2 descendo, 3 impacto), pelo tempo do golpe. Quadro de 132x204 com o pé em (66, 162) (no desenho
// original; o arquivo ampliado tem fatorGente(img) vezes isso).
const GOLPE_QUADRO = { w: 132, h: 204, peX: 66, peY: 162 };
function quadroGolpe(j) {
  const pf = PERFIL_GOLPE[perfilDe(j.golpeItem)], t = j.golpeT || 0;
  if (pf.marcas) return t < pf.marcas[0] ? 0 : t < pf.marcas[1] ? 1 : t < pf.marcas[2] ? 2 : 3;   // (a colher: alisa até o fim)
  if (t < pf.subida * 0.4) return 0;
  if (t < pf.subida) return 1;
  if (t < pf.acerto) return 2;
  return t < pf.dur - 0.05 ? 3 : 0;
}
function desenhaGolpeDesenhado(ctx, j) {
  const img = spr('personagens/jocelino/golpe_' + j.golpeItem);
  if (!img) return false;
  const q = quadroGolpe(j), Q = GOLPE_QUADRO, f = fatorGente(img);   // (a folha ampliada tem 3x os pixels do quadro: arte.js)
  ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(j.x, j.y - 2, 20, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.drawImage(img, j.dir * Q.w * f, q * Q.h * f, Q.w * f, Q.h * f, j.x - Q.peX, j.y + 2 - Q.peY, Q.w, Q.h);
  return true;
}
// As lascas (sempre) e a ferramenta da frente (chamado depois do corpo).
function desenhaGolpe(ctx, j) {
  for (const l of LASCAS) desenhaFx(ctx, l.fx, l.x, l.y, { ang: l.t * 9, alfa: Math.max(0, 1 - l.t * 1.6) });
  desenhaFerramenta(ctx, j, false);
}

// ---------- comer (botão direito com comida na mão) ----------
function comerDaMao() {
  const id = itemDaMao(), e = typeof energiaDaComida === 'function' ? energiaDaComida(id) : Itens.energia(id);
  if (!e) return false;
  if (G.energia >= G.energiaMax) { avisar('Jocelino está sem fome agora.'); return true; }
  // Como o Stardew: pergunta antes (um clique errado não come o ovo da pensão).
  perguntar(`Comer ${Itens.nome(id).toLowerCase()}? (+${e} de energia)`, ['Comer', 'Agora não'], i => { if (i === 0) comer(id, e); });
  return true;
}
function comer(id, e) {
  if (typeof Habilidades !== 'undefined' && Habilidades.tem('cafe_no_sangue')) e *= 2;
  if (G.mochila.total(id) < 1) return;
  G.mochila.remover(id, 1);
  G.energia = Math.min(G.energiaMax, G.energia + e);
  if (id === 'marmita' && G.limpou && G.limpou.marmita_almoco === 1) G.limpou.marmita_almoco = 2;   // (C9) o 1º almoço: a seta da barra some
  sons.tocar('pegar', 0.7, 0.05, -4);
  avisar(`Comeu ${Itens.nome(id).toLowerCase()}: +${e} de energia.`);
  hudSujo();
}
