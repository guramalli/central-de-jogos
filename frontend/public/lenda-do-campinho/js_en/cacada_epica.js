/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   👑 CAÇADA ÉPICA — OS ECOS DO MULTIVERSO (v369, lista do dono: "Caçada da Vez épica para 400+: chefões do Multiverso
   que mudam toda semana").
   - Toda segunda-feira o Multiverso "ecoa" 3 chefões lendários do jogo (Titã, Rei Rex, Supremo, Dragão Ancião...).
     O ECO tem a força do SEU nível (400 a 1000) e um PODER DA SEMANA diferente:
       🌠 Chuva de Meteoros · 🛡️ Escudeiros (escudo enquanto os ajudantes vivem) · 🌀 Teletransporte (aparece atrás de você)
       🔥 Rastro de Fogo · 😡 Fúria Dupla (fica bravo com 60% e com 30% da vida)
     Todos também têm a ONDA DE CHOQUE e a INVESTIDA dos chefões da Torre. 6 minutos por luta, na ARENA DOS ECOS.
   - Prêmio de cada Eco (1ª vitória da semana): XP, tostões e Fichas da Torre (+ chance de peça do Multiverso).
     Os 3 da semana: SELO DO CAÇADOR ÉPICO. Os selos liberam MOLDURAS DE NOME (bronze 1, prata 3, ouro 6, cometa 10,
     multiverso 16) — prêmio só de jogar, nada à venda (Steam: nada aleatório por tostões/Passe/DLC).
   - Onde: Caçadora Estela, no Estádio do Multiverso, ou 🎯 Tarefas de caça → aba 👑 Épica (nível 400+, depois da Copa
     Intergaláctica — as mesmas regras do Multiverso).
   Carregar DEPOIS de tarefas.js, torre_infinita.js, torre_desafio.js, chefes_vivos.js e adornos2.js.
   ============================================================ */
const CE_NIVEL = 400, CE_TEMPO = 360000, CE_FICHAS = 6, CE_FICHAS_SELO = 15;
const CE_W = 35, CE_H = 30, CE_CX = 17, CE_CY = 14;
const CE_AFIXOS = {
  meteoros: { nome: '🌠 Meteor Shower', dica: 'Red circles on the ground: get out of them before the rock falls!' },
  escudo: { nome: '🛡️ Squires', dica: 'The Echo calls helpers. While any of them is standing, the Echo barely feels your hits: take down the helpers first!' },
  teleporte: { nome: '🌀 Teleport', dica: 'The Echo vanishes and appears BEHIND you, with an area attack: get away from the purple circle!' },
  fogo: { nome: '🔥 Fire Trail', dica: 'Wherever the Echo goes, the ground catches fire. Don\'t stand on the flames!' },
  furia: { nome: '😡 Double Fury', dica: 'The Echo gets angry at 60% and again at 30% health: faster and stronger each time. Save your potions for the end!' },
};
const CE_MOLDURAS = [
  { id: 'bronze', selos: 1, nome: 'Bronze Frame', c: ['#5a2e10', '#c87a3a', '#ffd0a0'], txt: '#ffd8b0' },
  { id: 'prata', selos: 3, nome: 'Silver Frame', c: ['#4a5a6a', '#b8c8d8', '#ffffff'], txt: '#eef6ff' },
  { id: 'ouro', selos: 6, nome: 'Starry Gold Frame', c: ['#8a5a10', '#e8b020', '#fff3b0'], txt: '#ffe680', estrelas: true },
  { id: 'cometa', selos: 10, nome: 'Comet Frame', c: ['#0a3a7a', '#3ac8ff', '#e8ffff'], txt: '#bff4ff', estrelas: true },
  { id: 'multiverso', selos: 16, nome: 'Multiverse Frame', arcoiris: true, txt: '#ffffff', estrelas: true },
];
// os chefões que podem ecoar (todos com arte própria)
function cePool() {
  if (cePool.c) return cePool.c;
  return cePool.c = Object.entries(MONSTROS).filter(([id, d]) => d && d.chefe && d.look && d.look.spr && d.look.tipo !== 'humano' && !d.treino && !/^(tr_|ce_)/.test(id) && nivelMonstro(d) >= 150).map(([id]) => id);
}
function ceDados() {
  const s = G.save; if (!s.cacEpica) s.cacEpica = { semana: '', feitos: [], selo: false, selos: 0, moldura: null, vitorias: 0 };
  const c = s.cacEpica, id = tarSemanaId();
  if (c.semana !== id) Object.assign(c, { semana: id, feitos: [], selo: false });
  return c;
}
// os 3 Ecos da semana: sorteio fixo pela semana (todo mundo vê os mesmos)
function ceEcosDaSemana(sem) {
  sem = sem || tarSemanaId(); let h = 7; for (const ch of 'ecos' + sem) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const r = mulberry(h), pool = cePool().slice(), af = Object.keys(CE_AFIXOS), out = [];
  for (let k = 0; k < 3 && pool.length; k++) out.push({ base: pool.splice((r() * pool.length) | 0, 1)[0], afixo: af.splice((r() * af.length) | 0, 1)[0] });
  return out;
}
const ceNivel = () => Math.max(CE_NIVEL, Math.min(1000, (G.save && G.save.nivel) || CE_NIVEL)) + 3;
const cePode = () => { const s = G.save; if (!s) return 'no game'; if (s.nivel < CE_NIVEL) return `🔒 Only from level ${CE_NIVEL}`; return typeof mvPodeIr === 'function' ? mvPodeIr() : ''; };
const ceCurto = id => String((MONSTROS[id] && MONSTROS[id].nome) || id).split(',')[0];
// o Eco: um chefão da Torre com o nível do jogador (calibrado na s29: ~2,5–4 min e várias poções para quem está bem preparado)
function ceEco(base, afixo, L) {
  const id = `ce_${base}_${L}`; delete MONSTROS[id]; // sempre de novo: a fúria muda vel/atk do Eco durante a luta
  const b = MONSTROS[base];
  const m = montaMonstro(id, `${ceCurto(base)}, Echo of the Multiverse`, 'chefe', L, { falas: (b.falas || []).concat(['I am the echo of a legend!', 'The Multiverse brought me back!']), proj: (b.ranged && b.ranged.proj) || 'bola' });
  m.look = Object.assign({}, b.look); m.respawn = 999999999; m.ceEco = true; m.ceAfixo = afixo; m.base = base;
  m.hp = Math.round(m.hp * 10); m.xp = Math.round(m.xp * 3); m.atk = Math.round(m.atk * 2.9); m.def = Math.round(m.def * 1.15);
  if (m.ranged) m.ranged.dano = Math.round(m.ranged.dano * 2.6);
  if (afixo === 'escudo') m.hp = Math.round(m.hp * 0.92); // o escudo já alonga a luta
  if (afixo === 'furia') m.hp = Math.round(m.hp * 0.9);
  m.tetoGolpe = 0.28; m.ouro = [L * 300, L * 450]; m.loot = [];
  return id;
}
function ceLacaio(L) {
  const id = `ce_lacaio_${L}`; if (MONSTROS[id]) return id;
  const pool = typeof torrePool === 'function' ? torrePool().comuns : []; const base = pool.length ? pool[(Math.random() * pool.length) | 0] : null;
  const m = montaMonstro(id, 'Echo Squire', 'zagueiro', L, { falas: ['Protect the Echo!', 'Nobody gets past!'] });
  m.look = base ? Object.assign({}, MONSTROS[base].look) : { tipo: 'torre_pedra', spr: 'torre_pedra' };
  m.hp = Math.round(m.hp * 1.6); m.atk = Math.round(m.atk * 1.4); m.respawn = 999999999; m.ceLacaio = true; m.loot = []; m.xp = Math.round(m.xp * 0.5); m.ouro = [L, L * 2];
  return id;
}

/* ---------- a arena (redonda, flutuando entre as galáxias) ---------- */
const CE = { idx: 0, mapa: null };
function criaArenaEcos() {
  const W = CE_W, H = CE_H, cx = CE_CX, cy = CE_CY, r = mulberry(9191);
  const b = new Construtor('arena_ecos', '👑 Echo Arena', W, H, CH.ESTRELAS, 9191);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const d = Math.hypot(x - cx, (y - cy) * 1.1);
    if (d <= 12.5) b.chao(x, y, d >= 11.2 ? CH.METAL : CH.MV_PRACA); else b.obj(x, y, 'x');
  }
  // um campinho de verdade no meio (é uma arena de FUTEBOL entre as galáxias), com o anel de passarela em volta
  for (let y = 6; y <= 21; y++) for (let x = 7; x <= 27; x++) if (Math.hypot(x - cx, (y - cy) * 1.1) < 11 && (y <= 6 || y >= 21 || x <= 7 || x >= 27)) b.chao(x, y, CH.METAL);
  b.campo(8, 7, 19, 14, CH.CAMPO);
  for (let k = 0; k < 12; k++) { const ang = k / 12 * Math.PI * 2 + 0.2; const x = Math.round(cx + Math.cos(ang) * 11.7), y = Math.round(cy + Math.sin(ang) * 11.7 / 1.1); if (y < 23) b.obj(x, y, k % 3 === 0 ? 'holofote' : 'cristal_flutuante'); }
  b.npc('porteiro_ecos', 14, 24); b.m.inicio = { x: 17, y: 24 }; b.m.renasce = { x: 17, y: 24 };
  // v378: a arena também recebe LUTAS ESPECIAIS (ex.: o Guardião Desperto, despertar.js) — window.ceEspecial() diz qual
  const esp = ceEsp(), e = esp || (G.save ? ceEcosDaSemana()[CE.idx] : null);
  if (e && MONSTROS[e.base]) { const id = ceEco(e.base, e.afixo, esp ? esp.L : ceNivel()); if (esp && esp.ajusta) esp.ajusta(MONSTROS[id]); b.spawn(id, cx, 9, 1, 1); }
  Object.assign(b.m, { ecos: true, fechado: true, luzes: ['holofote', 'cristal_flutuante'], luzCor: '190,120,255', espaco: { tinta: 'rgba(120,60,220,0.18)' } });
  return b.m;
}
MAPAS_DEF.arena_ecos = criaArenaEcos;
function ceEntra(i) {
  const pode = cePode(); if (pode) { log(pode, 'l-sis'); return; }
  const e = ceEcosDaSemana()[i]; if (!e) return;
  CE.idx = i; ceDados().idx = i;
  fechaModal(); trocaMapa('arena_ecos', 17.5, 24.5);
  banner(`👑 ${ceCurto(e.base)}, Echo of the Multiverse`, `${CE_AFIXOS[e.afixo].nome} — ${CE_AFIXOS[e.afixo].dica}`);
}
const ceEsp = () => { try { return typeof window.ceEspecial === 'function' ? window.ceEspecial() : null; } catch (e) { return null; } };
function ceVoltaHub() { fechaModal(); som('porta'); trocaMapa('multiverso', 30.5, 39.5); }

/* ---------- a luta: poder da semana + onda de choque + investida ---------- */
function cePasso(dt) {
  const M = G.mapa;
  if (!M || !M.ecos) { if (CE.mapa) { CE.mapa = null; ceHud(false); try { if (window.ceEspecialFim) window.ceEspecialFim(); } catch (e) { } } return; }
  if (CE.mapa !== M) Object.assign(CE, { mapa: M, t: 0, resta: (ceEsp() && ceEsp().tempo) || CE_TEMPO, acabou: false, venceu: false, onda: 7000, aviso: 0, dash: 9000, meteoros: 6000, pisos: null, chama: 12000, tp: 8000, tpGolpe: 0, fogos: [], fogoT: 0, fogoDano: 0, furia: 0, brilho: 0 });
  const eco = G.mons.find(m => m.d.ceEco && m.hp > 0);
  if (CE.acabou || CE.venceu || !eco) { ceHud(true, eco); return; }
  const p = G.p, st = stats(), af = eco.d.ceAfixo;
  if (eco.bravo && G.save.hp > 0) {
    CE.t += dt; CE.resta -= dt;
    // fúria (todos com 50%; a Fúria Dupla com 60% e 30%)
    const lim = af === 'furia' ? [0.6, 0.3] : [0.5];
    if (CE.furia < lim.length && eco.hp < eco.d.hp * lim[CE.furia]) {
      CE.furia++; eco.d.vel = (eco.d.vel || 100) * 1.25; eco.d.atk = Math.round(eco.d.atk * 1.2); eco.d.atkCd = Math.round((eco.d.atkCd || 1000) * 0.88);
      banner(`😡 ${ceCurto(eco.tipo.replace(/^ce_|_\d+$/g, ''))} got FURIOUS${CE.furia > 1 ? ' AGAIN' : ''}!`, 'Faster and stronger!'); som('chefe_aviso'); if (typeof tremeTela === 'function') tremeTela(7, 450);
    }
    const bravo = CE.furia > 0;
    // onda de choque com aviso
    if (CE.t >= CE.onda && !CE.aviso) { CE.aviso = CE.t + 900; texto(eco, '⚠️ SHOCKWAVE!', '#ff5a5a', 900, -0.6); efeito('area', eco.x, eco.y, '#ff3a3a', 3.2); som('chefe_aviso'); }
    if (CE.aviso && CE.t >= CE.aviso) {
      CE.aviso = 0; CE.onda = CE.t + (bravo ? 6000 : 8000); efeito('impacto', eco.x, eco.y, '#ff5a2a', 3.2); efeito('area', eco.x, eco.y, '#ffb03a', 3.2); som('chefe_choque'); if (typeof tremeTela === 'function') tremeTela(6, 400);
      if (Math.hypot(p.x - eco.x, p.y - eco.y) <= 3.2) recebeDano(Math.round(st.maxHp * 0.15), eco);
    }
    // investida
    if (eco._dash) {
      const pas = dt / 1000 * 14; let k = 0;
      while (k < pas && CE.t < eco._dash.fim) { const nx = eco.x + eco._dash.dx * 0.25, ny = eco.y + eco._dash.dy * 0.25; if (!podeAndar(nx, ny)) { eco._dash.fim = 0; break; } eco.x = nx; eco.y = ny; k += 0.25; }
      if (CE.t >= eco._dash.fim) { if (Math.hypot(p.x - eco.x, p.y - eco.y) <= 1.5) { recebeDano(Math.round(st.maxHp * 0.08), eco); efeito('impacto', p.x, p.y, '#ff5a2a'); } eco._dash = null; }
    } else if (CE.t >= CE.dash) {
      const dx = p.x - eco.x, dy = p.y - eco.y, d = Math.hypot(dx, dy); CE.dash = CE.t + (bravo ? 7000 : 10000);
      if (d > 2.5) { eco._dash = { dx: dx / d, dy: dy / d, fim: CE.t + 350 }; texto(eco, 'CHARGE!', '#ffb03a', 700, -0.6); eco.flip = dx < 0; }
    }
    // poderes da semana
    if (af === 'meteoros') {
      if (!CE.pisos && CE.t >= CE.meteoros) {
        const pts = [{ x: p.x, y: p.y }]; for (let k = 0; k < (bravo ? 3 : 2); k++) pts.push({ x: p.x + (Math.random() * 7 - 3.5), y: p.y + (Math.random() * 6 - 3) });
        CE.pisos = { ate: CE.t + 1400, pts, prox: 0 }; fala(eco, 'METEOR SHOWER!');
      }
      if (CE.pisos) {
        if (CE.t >= CE.pisos.prox) { CE.pisos.prox = CE.t + 400; for (const q of CE.pisos.pts) efeito('area', q.x, q.y, '#ff2a2a', 1.5); }
        if (CE.t >= CE.pisos.ate) {
          for (const q of CE.pisos.pts) { efeito('impacto', q.x, q.y, '#ff9a3a', 1.6); efeito('puff', q.x, q.y); }
          if (CE.pisos.pts.some(q => Math.hypot(p.x - q.x, p.y - q.y) <= 1.5)) recebeDano(Math.round(st.maxHp * 0.2), eco);
          if (typeof tremeTela === 'function') tremeTela(5, 250);
          CE.pisos = null; CE.meteoros = CE.t + (bravo ? 5000 : 6500);
        }
      }
    } else if (af === 'escudo') {
      if (CE.t >= CE.chama) {
        CE.chama = CE.t + (bravo ? 18000 : 22000);
        const L = ceNivel();
        if (G.mons.filter(m => m.d.ceLacaio).length < 4) for (let k = 0; k < 2; k++) {
          const ang = Math.random() * Math.PI * 2, x = Math.round(eco.x + Math.cos(ang) * 2.5), y = Math.round(eco.y + Math.sin(ang) * 2.2);
          const nm = criaMonstro({ m: ceLacaio(L), x, y, raio: 2 }); if (nm) { nm.bravo = true; G.mons.push(nm); efeito('area', nm.x, nm.y, '#5ab4ff', 1.3); }
        }
        fala(eco, 'SQUIRES, TO ME!'); som('apito');
      }
      if (G.mons.some(m => m.d.ceLacaio && m.hp > 0) && CE.t >= CE.brilho) { CE.brilho = CE.t + 500; efeito('area', eco.x, eco.y, '#5ab4ff', 1.5); }
    } else if (af === 'teleporte') {
      if (!CE.tpGolpe && CE.t >= CE.tp) {
        CE.tp = CE.t + (bravo ? 7000 : 9000);
        for (let k = 0; k < 12; k++) {
          const ang = Math.random() * Math.PI * 2, nx = p.x + Math.cos(ang) * 1.8, ny = p.y + Math.sin(ang) * 1.6;
          if (!podeAndar(nx, ny)) continue;
          efeito('puff', eco.x, eco.y); eco.x = nx; eco.y = ny; eco._dash = null; efeito('puff', nx, ny);
          CE.tpGolpe = CE.t + 1000; CE.tpX = nx; CE.tpY = ny; texto(eco, '🌀 BEHIND YOU!', '#c77aff', 1000, -0.6); som('chefe_aviso'); break;
        }
      }
      if (CE.tpGolpe) {
        if (CE.t >= (CE.tpPisca || 0)) { CE.tpPisca = CE.t + 330; efeito('area', CE.tpX, CE.tpY, '#c77aff', 2.3); }
        if (CE.t >= CE.tpGolpe) { CE.tpGolpe = 0; efeito('impacto', CE.tpX, CE.tpY, '#c77aff', 2.3); if (Math.hypot(p.x - CE.tpX, p.y - CE.tpY) <= 2.3) recebeDano(Math.round(st.maxHp * 0.18), eco); }
      }
    } else if (af === 'fogo') {
      if (CE.t >= CE.fogoT) {
        CE.fogoT = CE.t + (bravo ? 450 : 650);
        const ult = CE.fogos[CE.fogos.length - 1];
        if (!ult || Math.hypot(ult.x - eco.x, ult.y - eco.y) > 0.7) CE.fogos.push({ x: eco.x, y: eco.y, ate: CE.t + 8000, prox: 0 });
      }
      CE.fogos = CE.fogos.filter(f => f.ate > CE.t).slice(-24);
      for (const f of CE.fogos) if (CE.t >= f.prox) { f.prox = CE.t + 420; efeito('area', f.x, f.y, '#ff6a1a', 0.8); }
      if (CE.t >= CE.fogoDano && CE.fogos.some(f => Math.hypot(p.x - f.x, p.y - f.y) <= 0.8)) { CE.fogoDano = CE.t + 500; recebeDano(Math.max(1, Math.round(st.maxHp * 0.05)), eco); texto(p, '🔥', '#ff8a2a', 400, -0.6); }
    }
    // tempo esgotado
    if (CE.resta <= 0) {
      CE.acabou = true; CE.resta = 0; banner('⏰ Time\'s up!', 'The Echo went back to the Multiverse... try again!'); som('erro');
      log(ceEsp() ? `⏰ Time's up for the fight. Try again whenever you want (the offering was already made).` : `⏰ Time's up for the fight against the Echo. Try again whenever you want: the Echo stays there until Monday.`, 'l-dano');
      setTimeout(() => { if (G.mapa && G.mapa.ecos) ceVoltaHub(); }, 1600);
    }
  }
  ceHud(true, eco);
}
{
  const _atCE = atualiza;
  atualiza = function (dt) { const r = _atCE.apply(this, arguments); try { cePasso(dt || 16); } catch (e) { if (!window._ceErr) { window._ceErr = e; console.warn('epic hunt', e); } } return r; };
}
// os ajudantes seguram o golpe: enquanto houver Escudeiro em pé, o Eco leva só 25% do dano
{
  const _adCE = aplicaDano;
  aplicaDano = function (m, dano) {
    try {
      if (m && m.d && m.d.ceEco && m.d.ceAfixo === 'escudo' && dano > 0 && G.mons.some(o => o.d.ceLacaio && o.hp > 0)) {
        arguments[1] = Math.max(1, Math.round(dano * 0.25));
        if (G.agora - (m._ceTxt || 0) > 1500) { m._ceTxt = G.agora; texto(m, '🛡️ SHIELD! Take down the Squires!', '#8ad0ff', 1100, -0.9); }
      }
    } catch (e) { }
    return _adCE.apply(this, arguments);
  };
}
// cada golpe comum do Eco também tira 3% do fôlego máximo (como os chefões da Torre)
{
  const _maCE = monstroAtaca;
  monstroAtaca = function (m) {
    const r = _maCE.apply(this, arguments);
    try { if (G.mapa && G.mapa.ecos && m.d.ceEco && G.save.hp > 0) recebeDano(Math.max(1, Math.round(stats().maxHp * 0.03)), m); } catch (e) { }
    return r;
  };
}

/* ---------- vitória e prêmios ---------- */
function ceVenceu(m) {
  const esp = ceEsp();
  if (esp) { // luta especial: o prêmio é dela (sem mexer nos Ecos da semana)
    CE.venceu = true; G.mons = G.mons.filter(o => o === m || !o.d.ceLacaio); G.respawns = []; CE.fogos = []; CE.pisos = null;
    try { esp.aoVencer(m); } catch (e) { console.warn('luta especial', e); }
    return;
  }
  const c = ceDados(), i = CE.idx, e = ceEcosDaSemana()[i], L = m.d.nivel || ceNivel(), s = G.save;
  const xpNivel = x => Math.max(1, xpPara(x + 1) - xpPara(x));
  CE.venceu = true; c.vitorias = (c.vitorias || 0) + 1;
  G.mons = G.mons.filter(o => o === m || !o.d.ceLacaio); G.respawns = []; CE.fogos = []; CE.pisos = null;
  let txt;
  if (!c.feitos.includes(i)) {
    c.feitos.push(i);
    const xp = Math.round(xpNivel(L) * 0.9), ouro = L * 9000;
    ganhaXp(xp); s.ouro += ouro; recebeItem('ficha_torre', CE_FICHAS);
    txt = `+${fmt(xp)} XP, +${fmt(ouro)} coins and ${CE_FICHAS} Tower Tokens.`;
    const faixa = typeof mvFaixaDe === 'function' ? mvFaixaDe(Math.min(L, 545)) : null, pecas = faixa ? Object.keys(faixa.pecas) : [];
    if (pecas.length && Math.random() < 0.06) { const pc = pecas[(Math.random() * pecas.length) | 0]; recebeItem(pc, 1); txt += ` ✨ And it dropped: ${ITENS[pc].nome}!`; }
    if (!c.selo && c.feitos.length >= 3) {
      c.selo = true; c.selos = (c.selos || 0) + 1; recebeItem('ficha_torre', CE_FICHAS_SELO); if (ITENS.bau_torre) recebeItem('bau_torre', 1);
      txt += ` 🏅 ALL 3 ECHOES OF THE WEEK! +1 Epic Hunter Seal (you have ${c.selos}), +${CE_FICHAS_SELO} Tokens and a Tower Chest.`;
      // v370 (dono: "a moldura podia ser escolhida nos Adornos, assim não confunde"): não entra sozinha no nome
      const nova = CE_MOLDURAS.find(f => f.selos === c.selos); if (nova) txt += ` 🖼️ New name frame unlocked: ${nova.nome}! Choose it in Equipment → ✨ Cosmetics.`;
      banner('🏅 EPIC HUNTER SEAL!', 'You beat all 3 Echoes of the week!');
    }
  } else { recebeItem('ficha_torre', 1); txt = 'You already beat this Echo this week: +1 Tower Token.'; }
  log(`👑 You beat ${m.d.nome}! ${txt}`, 'l-lvl'); som('nivel'); salvar(); G.uiSujo = true;
  setTimeout(() => {
    if (!G.mapa || !G.mapa.ecos) return;
    abreModal(el('h2', {}, `👑 ${ceCurto(e ? e.base : m.tipo)} defeated!`), el('p', {}, txt), el('p', { class: 'dica' }, `Echoes beaten this week: ${c.feitos.length}/3 · Seals: ${c.selos || 0}`),
      el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', onclick: () => modalEcos() }, '👑 See this week\'s Echoes'), el('button', { class: 'btn', onclick: ceVoltaHub }, '🏟️ Back to the Stadium')));
  }, 900);
}
{
  const _mtCE = matar;
  matar = function (m) {
    const r = _mtCE.apply(this, arguments);
    try {
      if (G.mapa && G.mapa.ecos) {
        G.respawns = G.respawns.filter(x => x.sp !== m.sp); // cada luta é uma luta: ninguém volta
        if (m && m.d && m.d.ceEco && !CE.venceu && !CE.acabou) ceVenceu(m);
      }
    } catch (e) { if (!window._ceErr) { window._ceErr = e; console.warn('epic hunt', e); } }
    return r;
  };
  // sem fôlego na arena: acorda no Estádio
  const _rnCE = renascer;
  renascer = function () { if (G.mapa && G.mapa.ecos) G.mapa = getMapa('multiverso'); return _rnCE.apply(this, arguments); };
  // toda entrada na arena (inclusive ao recarregar o jogo lá dentro) monta a luta do zero, com o Eco escolhido por último
  const _emCE = entrarMapa;
  entrarMapa = function (id) {
    if (id === 'arena_ecos') { delete MAPAS.arena_ecos; CE.mapa = null; try { CE.idx = Math.max(0, Math.min(2, (G.save && G.save.cacEpica && G.save.cacEpica.idx) || CE.idx || 0)); } catch (e) { } }
    return _emCE.apply(this, arguments);
  };
}

/* ---------- painel no alto ---------- */
function ceHud(on, eco) {
  let h = document.getElementById('ceHud');
  if (!on) { if (h) h.remove(); return; }
  if (!h) { h = el('div', { id: 'ceHud' }); document.body.append(h); }
  const seg = Math.ceil(Math.max(0, CE.resta) / 1000), mm = Math.floor(seg / 60), ss = String(seg % 60).padStart(2, '0');
  const esp = ceEsp(), e = esp || ceEcosDaSemana()[CE.idx], af = e ? CE_AFIXOS[e.afixo].nome : '';
  const esc = G.mons.filter(m => m.d.ceLacaio && m.hp > 0).length;
  const txt = CE.venceu ? (esp ? `🌟 ${esp.titulo}: defeated!` : '👑 Echo defeated!') : `${esp ? '🌟 ' + esp.titulo : `👑 Echo ${CE.idx + 1}/3`} · ⏳ ${mm}:${ss} · ${af}` + (eco ? ` · ❤️ ${Math.ceil(eco.hp / eco.d.hp * 100)}%` : '') + (esc ? ` · 🛡️ ${esc} Squire(s)` : '');
  if (h.textContent !== txt) h.textContent = txt;
  h.classList.toggle('urgente', seg <= 15 && !CE.acabou && !CE.venceu);
}

/* ---------- a Caçadora (NPC no Estádio do Multiverso) e o porteiro da arena ---------- */
Object.assign(NPCS, {
  cacadora_ecos: { nome: 'Estela the Echo Hunter', ecos: 'cacadora', look: { tipo: 'humano', corpo: 'f', alt: 1.78, pele: 'pele-negra', cabelo: 'cabelo-rabo', corCabelo: 'preto', roupa: 'roupa-terno', corRoupa: '#4a2a8a', baixo: 'baixo-jeans' }, ola: 'The Multiverse keeps the memory of every boss that ever existed. Every Monday, three of them come back as ECHOES — stronger, with new powers. Whoever beats all three wins the Epic Hunter Seal!' },
  porteiro_ecos: { nome: 'Echo Arena Guardian', ecos: 'porteiro', look: { tipo: 'humano', corpo: 'm', alt: 1.8, pele: 'pele-media', cabelo: 'cabelo-curto', corCabelo: 'grisalho', roupa: 'roupa-terno', corRoupa: '#2a1a5a', baixo: 'baixo-jeans' }, ola: 'Beat the Echo before time runs out. If you want to give up, I\'ll take you back to the Stadium.' },
});
if (typeof PAPEL !== 'undefined') Object.assign(PAPEL, { cacadora_ecos: 'adulta', porteiro_ecos: 'adulto' });
{
  const _mvCE = MAPAS_DEF.multiverso;
  MAPAS_DEF.multiverso = function () {
    const m = _mvCE.apply(this, arguments);
    try {
      // perto do Guardião e da loja, num chão livre da praça
      let pos = null;
      for (const [x, y] of [[38, 34], [37, 35], [39, 33], [36, 34], [40, 34]]) { const k = y * m.w + x; if (CH_ANDA(m.chao[k]) && !m.obj[k] && !m.npcs.some(n => n.x === x && n.y === y)) { pos = { x, y }; break; } }
      if (pos) {
        m.npcs.push({ id: 'cacadora_ecos', x: pos.x, y: pos.y });
        // a placa ao lado (se couber)
        const k = pos.y * m.w + pos.x + 1; if (CH_ANDA(m.chao[k]) && !m.obj[k]) { m.obj[k] = { t: 'placa', v: 0 }; (m.placas = m.placas || []).push({ x: pos.x + 1, y: pos.y, texto: '👑 EPIC HUNT — every Monday, 3 legendary bosses come back as ECHOES of the Multiverse. Talk to Estela the Hunter!' }); }
      }
    } catch (e) { }
    return m;
  };
  if (typeof MAPAS !== 'undefined') delete MAPAS.multiverso;
}
function modalEcos(npc) {
  const s = G.save; if (!s) return; const c = ceDados(), ecos = ceEcosDaSemana(), pode = cePode(), L = ceNivel();
  const lista = el('div', { class: 'tar-corpo' });
  ecos.forEach((e, i) => {
    const feito = c.feitos.includes(i), a = CE_AFIXOS[e.afixo];
    lista.append(el('div', { class: 'tar-card' + (feito ? ' feita' : '') },
      el('div', {}, el('b', {}, `${feito ? '✔ ' : ''}${ceCurto(e.base)}, Echo of the Multiverse`), el('small', {}, ` · level ${L}`), el('div', { class: 'tar-premio' }, `${a.nome}: ${a.dica}`),
        el('div', { class: 'tar-premio' }, feito ? 'Beaten this week (fight again: +1 Token).' : `Prize: XP, coins and ${CE_FICHAS} Tower Tokens.`)),
      el('button', { class: 'btn ' + (feito ? '' : 'verde ') + 'mini', type: 'button', disabled: pode ? 'disabled' : null, onclick: () => ceEntra(i) }, feito ? 'Fight again' : '⚔️ Fight')));
  });
  const corpo = [el('p', {}, `Every Monday, 3 legendary bosses come back as ECHOES, with the strength of your level and a power of the week. You have 6 minutes to beat each one in the Echo Arena.`),
    pode ? el('p', { class: 'dica' }, pode) : '', lista,
    el('p', {}, `🏅 This week: ${c.feitos.length}/3 Echoes ${c.selo ? '— SEAL EARNED!' : '— beat all 3 to earn the Epic Hunter Seal (+' + CE_FICHAS_SELO + ' Tokens and a Tower Chest).'}`),
    el('p', { class: 'dica' }, `🖼️ You have ${c.selos || 0} seal(s). Seals unlock NAME FRAMES (at ${CE_MOLDURAS.map(f => f.selos).join(', ')} seals) — choose yours in Equipment → ✨ Cosmetics.`)];
  return { corpo, npc };
}
function abreModalEcos(npc) {
  const { corpo } = (modalEcos.monta || modalEcos)(npc);
  abreModal.largo = true;
  abreModal(el('h2', {}, npc ? npc.d.nome : '👑 Epic Hunt — Echoes of the Multiverse'), npc ? el('div', { class: 'npc-topo' }, retratoNPC(npc), el('div', { class: 'fala' }, el('p', {}, npc.d.ola))) : '',
    ...corpo, el('div', { class: 'opcoes' }, el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'Close')));
}
// modalEcos é chamado pelos botões: reabre a janela certa (Caçadora ou Tarefas)
{
  const _monta = modalEcos;
  modalEcos = function (npc) {
    if (CE.janela === 'tarefas' && !npc) return modalTarefas('epica');
    abreModalEcos(npc || CE.npc || null);
  };
  modalEcos.monta = _monta;
}
{
  const _abCE = abrirNPC;
  abrirNPC = function (npc) {
    const d = npc && npc.d;
    if (d && d.ecos === 'porteiro') return abreModal(el('h2', {}, d.nome), el('div', { class: 'npc-topo' }, retratoNPC(npc), el('div', { class: 'fala' }, el('p', {}, d.ola))),
      el('div', { class: 'opcoes' }, el('button', { class: 'btn', onclick: ceVoltaHub }, '🏟️ Give up and go back to the Stadium'), el('button', { class: 'btn amarelo', onclick: fechaModal }, 'Keep fighting')));
    if (d && d.ecos === 'cacadora') { CE.janela = 'npc'; CE.npc = npc; return abreModalEcos(npc); }
    return _abCE.apply(this, arguments);
  };
  if (typeof iconeNPC === 'function') { const _icCE = iconeNPC; iconeNPC = function (n) { const d = n.d || NPCS[n.id] || {}; return d.ecos ? '👑' : _icCE(n); }; }
}
// a aba 👑 Épica nas Tarefas de caça (nível 400+)
{
  const _mtar = modalTarefas;
  modalTarefas = function (aba) {
    const s = G.save; const temEpica = s && s.nivel >= CE_NIVEL;
    const r = _mtar.call(this, aba === 'epica' ? 'vez' : aba);
    try {
      if (!temEpica) return r;
      const abas = document.querySelector('#modalConteudo .tar-abas') || document.querySelector('.tar-abas'); if (!abas) return r;
      const c = ceDados(); const bt = el('button', { class: 'btn' + (aba === 'epica' ? ' amarelo' : ''), type: 'button', onclick: () => modalTarefas('epica') }, `👑 Epic (${c.feitos.length}/3)`);
      abas.append(bt);
      if (aba === 'epica') {
        CE.janela = 'tarefas'; CE.npc = null;
        for (const b of abas.querySelectorAll('.btn')) if (b !== bt) b.classList.remove('amarelo');
        const corpo = document.querySelector('.tar-corpo'); if (corpo) { corpo.innerHTML = ''; corpo.append(...modalEcos.monta().corpo.filter(Boolean)); }
      }
    } catch (e) { }
    return r;
  };
}

/* ---------- molduras de nome (escolhidas em Equipamento → ✨ Adornos) ---------- */
function ceDesenhaMoldura(ctx, f, txt, x, y, px, dpr) {
        ctx.font = `700 ${px}px Fredoka, Nunito, sans-serif`;
        const w = ctx.measureText(txt).width + px * 1.4, h = px * 1.5, x0 = x - w / 2, y0 = y - px * 1.05, k = (G.agora / 1700) % 1;
        const g = ctx.createLinearGradient(x0, y0, x0 + w, y0);
        if (f.arcoiris) { for (let i = 0; i <= 6; i++) g.addColorStop(i / 6, `hsl(${(i * 60 + G.agora / 12) % 360},95%,65%)`); }
        else { g.addColorStop(0, f.c[0]); g.addColorStop(Math.max(0, k - 0.12), f.c[1]); g.addColorStop(k, f.c[2]); g.addColorStop(Math.min(1, k + 0.12), f.c[1]); g.addColorStop(1, f.c[0]); }
        ctx.save();
        ctx.fillStyle = f.arcoiris ? 'rgba(30,10,60,0.8)' : 'rgba(20,12,4,0.75)'; ctx.beginPath(); ctx.roundRect(x0 - 2, y0 - 2, w + 4, h + 4, h / 2); ctx.fill();
        ctx.strokeStyle = g; ctx.lineWidth = (f.selos >= 6 ? 3 : 2.5) * dpr; ctx.beginPath(); ctx.roundRect(x0, y0, w, h, h / 2); ctx.stroke();
        if (f.estrelas) { // estrelinhas nas pontas, piscando
          for (const [sx, fase] of [[x0, 0], [x0 + w, Math.PI]]) {
            const a = 0.55 + 0.45 * Math.sin(G.agora / 260 + fase), rr = px * 0.32 * (0.8 + 0.2 * a), cy = y0 + h / 2;
            ctx.globalAlpha = a; ctx.fillStyle = f.arcoiris ? `hsl(${(G.agora / 8) % 360},100%,75%)` : f.c[2]; ctx.beginPath();
            for (let i = 0; i < 8; i++) { const ang = i * Math.PI / 4, rd = i % 2 ? rr * 0.38 : rr; ctx.lineTo(sx + Math.cos(ang) * rd, cy + Math.sin(ang) * rd); }
            ctx.closePath(); ctx.fill();
          }
          ctx.globalAlpha = 1;
        }
        ctx.restore();
}
{
  const _rotCE = rotulo;
  rotulo = function (ctx, txt, x, y, cor, tam) {
    try {
      const s = G.save, c = s && s.cacEpica, f = c && c.moldura && CE_MOLDURAS.find(q => q.id === c.moldura);
      if (f && (c.selos || 0) >= f.selos && txt === `Lv ${s.nivel} ${s.nome}`) {
        ceDesenhaMoldura(ctx, f, txt, x, y, tam * G.dpr, G.dpr);
        // (o texto vai com um caractere invisível no fim: assim a Moldura Lendária do adornos2 não desenha por cima)
        return _rotCE.call(this, ctx, txt + '​', x, y, f.txt, tam);
      }
    } catch (e) { }
    return _rotCE.apply(this, arguments);
  };
}
{
  const css = document.createElement('style');
  css.textContent = `#ceHud { position: fixed; top: 58px; left: 50%; transform: translateX(-50%); z-index: 60; pointer-events: none; padding: 6px 14px; border-radius: 12px;
    background: rgba(24,8,48,.88); color: #ecdcff; border: 2px solid #9a5aff; font: 800 15px Nunito, 'Segoe UI', sans-serif; white-space: nowrap; box-shadow: 0 4px 14px rgba(0,0,0,.45); max-width: 96vw; overflow: hidden; text-overflow: ellipsis; }
  #ceHud.urgente { color: #fff; background: rgba(140,20,60,.92); }
  .ad-op .ce-amostra { width: 100%; max-width: 150px; height: 40px; }`;
  document.head.append(css);
}
window.CACADA_EPICA = { CE, ceEcosDaSemana, ceDados, ceEco, ceEntra, cePool, CE_AFIXOS, CE_MOLDURAS };

// a seção "🖼️ Moldura do nome" na janela de Adornos (Equipamento → ✨ Adornos), junto com os outros visuais
{
  const _modalCE = abreModal;
  abreModal = function () {
    const r = _modalCE.apply(this, arguments);
    try {
      const box = document.querySelector('#modalConteudo .adornos .ad2'); if (!box || box.querySelector('.ce-mold') || !G.save) return r;
      const c = ceDados();
      const amostra = f => { const cv = document.createElement('canvas'); cv.width = 300; cv.height = 80; cv.className = 'ad-img ce-amostra'; const x = cv.getContext('2d'); ceDesenhaMoldura(x, f, `Lv ${G.save.nivel}`, 150, 50, 26, 2); x.fillStyle = f.txt; x.textAlign = 'center'; x.fillText(`Lv ${G.save.nivel}`, 150, 50); return cv; };
      const botoes = CE_MOLDURAS.map(f => {
        const ok = (c.selos || 0) >= f.selos, on = c.moldura === f.id;
        return el('button', { type: 'button', class: 'ad-op' + (on ? ' on' : '') + (ok ? '' : ' fechado'), disabled: !ok, onclick: () => { c.moldura = on ? null : f.id; G.uiSujo = true; try { salvar(); } catch (e) { } if (window.abreAdornos) window.abreAdornos(); } },
          amostra(f), el('b', {}, f.nome), el('small', {}, ok ? (on ? 'Using (click to remove)' : 'Use') : `🔒 ${f.selos} Epic Hunter Seal(s)`), el('i', {}, 'Earned by beating the 3 Echoes of the Multiverse in one week (level 400+).'));
      });
      const dica = [...box.querySelectorAll(':scope > p.dica')].pop(); // (a última: a do Pacote Lendário)
      const sec = [el('h3', { class: 'ce-mold' }, `🖼️ Name frame · ${c.selos || 0} seal(s)`), el('div', { class: 'ad-grade' }, ...botoes)];
      if (dica) dica.before(...sec); else box.append(...sec);
    } catch (e) { console.warn('molduras', e); }
    return r;
  };
}
// v391 (dono: "o tamanho do boss está muito pequeno"): o Eco copiava o desenho do bicho comum (um dragãozinho do tamanho de
// qualquer adversário). Agora ele é GRANDE como os Guardiões das Lendas (bicho ×1,75, gente ×1,45), entre 1,5× e 2× a
// altura do seu personagem.
{
  const _altEco = alturaEnt;
  alturaEnt = function (e) {
    const h = _altEco.apply(this, arguments);
    const d = e && e !== G.p && e.d; if (!d || !d.ceEco) return h;
    const eu = G.save ? ALT_FASE[faseIdx(G.save.nivel)] : 1.6;
    const k = d.look && d.look.tipo && d.look.tipo !== 'humano' ? 1.75 : 1.45;
    return Math.max(h, Math.min(eu * 2, Math.max(eu * 1.5, h * k))); // entre 1,5× e 2× o seu personagem (nunca menor que o original)
  };
}
