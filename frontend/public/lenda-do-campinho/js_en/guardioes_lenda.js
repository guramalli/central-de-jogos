/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   ☠️ GUARDIÕES DAS QUESTS LENDÁRIAS, DE VERDADE (v326, pedido do dono: "tem que ser maiores e mais amedrontadores,
   combar skills... com buff de alimento eu tomava hit de 600 no máximo, não faz nem cócegas").
   Antes: vida ×10, mas ataque só 15% acima dos bichos comuns da dungeon e um único chute de longe.
   Agora cada um dos 9 guardiões (lendas.js):
   - é MUITO maior (bichos ~75%, gente ~45%), com aura vermelha pulsando, brasas subindo e barra de chefão no topo;
   - acorda com um rugido (a tela treme) e solta COMBOS: 3–4 golpes em área seguidos (bola, onda, raio, anel) do
     elemento dele, cada um com o nome do golpe — os quadrados acendem antes, então dá para desviar;
   - em 66% e 33% da vida chama 2 reforços da própria dungeon; abaixo de 50% entra em FÚRIA (bate 30% mais forte e
     encadeia os combos mais rápido);
   - ataque e vida calibrados para quem chega com os melhores itens, poções e comidas (testado na suíte s18).
   Carregar DEPOIS de lendas.js e magias_adv.js.
   ============================================================ */
const GUARD_ATK = 2.9, GUARD_HP = 55, GUARD_COMBO = 2.0, GUARD_FURIA = 1.3;
// elemento e combo de cada guardião: [forma, nome do golpe]
const GUARD_EST = {
  metro: { el: 'energia', combo: [['raio', 'Last Train Headlight'], ['bola', 'Sparks on the Tracks'], ['anel', 'Platform Shock']] },
  tumba: { el: 'areia', combo: [['onda', 'Desert Wind'], ['bola', 'Quicksand'], ['bola', 'Scarab\'s Curse']] },
  fogo: { el: 'fogo', campo: true, combo: [['onda', 'Crater Breath'], ['bola', 'Blazing Cleats'], ['anel', 'Eruption']] },
  navegador: { el: 'agua', combo: [['onda', 'Deck Wave'], ['onda', 'Undertow'], ['bola', 'Cannonball']] },
  cavaleiro: { el: 'terra', combo: [['raio', 'Black Slide Tackle'], ['anel', 'Defensive Wall'], ['bola', 'Shield Bash']] },
  farao: { el: 'areia', combo: [['bola', 'Striker\'s Eye'], ['bola', 'Sand Rain'], ['bola', 'Pharaoh\'s Storm'], ['anel', 'Sarcophagus']] },
  pocos: { el: 'fogo', campo: true, combo: [['anel', 'Fire Pit'], ['bola', 'Magma Rain'], ['onda', 'Lava River']] },
  dragao: { el: 'fogo', campo: true, combo: [['onda', 'King\'s Breath'], ['onda', 'Second Wind'], ['bola', 'Meteor'], ['anel', 'Wings of Fire']] },
  aniquilador: { el: 'energia', combo: [['raio', 'Star Ray'], ['bola', 'Supernova'], ['raio', 'Comet'], ['anel', 'Annihilation']] },
};
// ajuste fino por guardião [ataque, vida], medido na s18 (o poder do jogador cresce mais rápido que o dos adversários
// nos níveis altos: sem isso o do nível 24 matava 7 vezes e o Aniquilador caía em 55 s sem uma poção)
const GUARD_AJUSTE = { metro: [0.5, 0.55], tumba: [0.6, 0.8], fogo: [0.7, 0.9], navegador: [0.85, 0.9], cavaleiro: [0.95, 1], farao: [0.8, 1], pocos: [1, 1], dragao: [1, 1], aniquilador: [1.7, 3] };
const guardDe = m => m && m.d && m.d.lendaGuardiao ? GUARD_EST[m.d.lendaGuardiao] : null;

/* ---------- atributos: o ataque deixa de ser "de bicho comum" ---------- */
for (const L of (typeof QLENDAS !== 'undefined' ? QLENDAS : [])) {
  const d = MONSTROS['guard_' + L.id]; if (!d || d._guardForte) continue;
  d._guardForte = true;
  const [ka, kh] = GUARD_AJUSTE[L.id] || [1, 1];
  d.atk = Math.round(d.atk / 1.15 * GUARD_ATK * ka);
  d.hp = Math.round(d.hp / 10 * GUARD_HP * kh);
  d.def = Math.round(d.def * 1.15);
  d.xp = Math.round(d.xp * 1.4);
  if (d.ranged) { d.ranged.dano = Math.round(d.atk * 0.8); d.ranged.cd = 2200; }
  d.falas = ['Nobody touches the chest!', 'You\'re not getting past me!', 'This treasure is MINE!', 'I\'ve seen better stars fall!'];
}

/* ---------- tamanho ---------- */
{
  const _altGuard = alturaEnt;
  alturaEnt = function (e) {
    const h = _altGuard.apply(this, arguments);
    const d = e && e.d; if (!d || !d.lendaGuardiao || e === G.p) return h;
    return h * (d.look && d.look.tipo && d.look.tipo !== 'humano' ? 1.75 : 1.45);
  };
}

/* ---------- comportamento: rugido, combos, reforços, fúria ---------- */
{
  const ag = () => G.agora;
  function invoca(m) {
    const L = QLENDA_POR_ID[m.d.lendaGuardiao], c = L && CACADAS.find(k => k.id === L.caca); if (!c || !MONSTROS[c.m]) return;
    for (let i = 0; i < 2; i++) {
      const x = Math.floor(m.x) + (i ? 2 : -2), y = Math.floor(m.y);
      const n = criaMonstro({ m: c.m, x, y, raio: 2, invocado: true }); if (!n) continue;
      n.bravo = true; G.mons.push(n); efeito('toque', n.x, n.y);
    }
    texto(m, '📣 Backup!', '#ff9a4a', 1400, -0.5); log(`☠️ ${m.d.nome} called for backup!`, 'l-dano');
  }
  const _atualizaMonstroGuard = atualizaMonstro;
  atualizaMonstro = function (m) {
    const r = _atualizaMonstroGuard.apply(this, arguments);
    const g = guardDe(m); if (!g || !G.p || !G.save || G.save.hp <= 0) return r;
    const t = ag();
    if (m.voltando || dist(m, G.p) > 10) { m._fila = null; return r; } // o combo que começou vai até o fim (só para se ele voltar para casa ou você fugir)
    if (!m.bravo && !(m._fila && m._fila.length)) return r;
    if (!m._acordou) {
      m._acordou = true; m._cdCombo = t + 2500;
      texto(m, `☠️ ${m.d.nome.toUpperCase()}!`, '#ff4a4a', 1800, -0.6); if (typeof tremeTela === 'function') tremeTela(9, 500);
      log(`☠️ ${m.d.nome} woke up! Careful: the squares that light up are area attacks — get off them!`, 'l-dano'); try { som('chefe'); } catch (e) { }
    }
    const pct = m.hp / m.d.hp;
    if (!m.furia && pct < 0.5) {
      m.furia = true; texto(m, '😡 RAGE!', '#ff3a1a', 1600, -0.6); if (typeof tremeTela === 'function') tremeTela(10, 600);
      log(`😡 ${m.d.nome} flew into a RAGE: hits harder and attacks faster!`, 'l-dano');
    }
    m._reforcos = m._reforcos || 0;
    if ((m._reforcos === 0 && pct < 0.66) || (m._reforcos === 1 && pct < 0.33)) { m._reforcos++; invoca(m); }
    // a fila do combo: cada golpe mira onde você está NA HORA (e acende 0,7 s antes)
    if (m._fila && m._fila.length) {
      const passo = m._fila[0];
      if (t >= passo.em) {
        m._fila.shift();
        const tiles = tilesMagia(passo.forma, m, G.p);
        if (tiles.length) {
          G.magAdv.push({ m, tiles, el: g.el, campo: !!g.campo && passo.forma !== 'raio', t: t + 700, mult: GUARD_COMBO * (m.furia ? GUARD_FURIA : 1) * (passo.forma === 'anel' ? 1.15 : 1) });
          m.golpe = t; m.flip = G.p.x < m.x; texto(m, passo.nome + '!', `rgb(${MAG_EL[g.el].cor})`, 900, -0.4);
          if (typeof tremeTela === 'function') tremeTela(3, 150);
        }
      }
      return r;
    }
    if (t >= (m._cdCombo || 0) && dist(m, G.p) <= 6.5) {
      m._fila = g.combo.map(([forma, nome], i) => ({ forma, nome, em: t + i * (m.furia ? 560 : 700) }));
      m._cdCombo = t + (m.furia ? 6000 : 8500) + g.combo.length * 650;
    }
    return r;
  };
  // fúria: o golpe normal (perto e de longe) também fica mais forte
  const _recebeGuard = recebeDano;
  recebeDano = function (dano, m) { if (m && m.furia && m.d && m.d.lendaGuardiao) dano = Math.round(dano * GUARD_FURIA); return _recebeGuard.call(this, dano, m); };
  // os reforços não voltam (não lotam a caverna) e somem quando o guardião cai
  const _matarGuard = matar;
  matar = function (m) {
    const r = _matarGuard.apply(this, arguments);
    if (m && m.sp && m.sp.invocado) G.respawns = G.respawns.filter(x => x.sp !== m.sp);
    if (m && m.d && m.d.lendaGuardiao) { G.mons = G.mons.filter(x => !(x.sp && x.sp.invocado)); G.respawns = G.respawns.filter(x => !(x.sp && x.sp.invocado)); }
    return r;
  };
}

/* ---------- visual: aura vermelha com brasas e a barra de chefão ---------- */
{
  const _desenhaEntGuard = desenhaEnt;
  desenhaEnt = function (ctx, e) {
    if (e && e.d && e.d.lendaGuardiao && e.hp > 0) {
      const t = G.agora, alt = alturaEnt(e) * T, x = e.x * T, y = e.y * T, f = e.furia ? 1 : 0;
      const pul = 1 + Math.sin(t / (f ? 120 : 260)) * 0.08, rx = Math.max(34, alt * 0.42) * pul, ry = rx * 0.38;
      ctx.save();
      const gr = ctx.createRadialGradient(x, y, rx * 0.15, x, y, rx);
      gr.addColorStop(0, f ? 'rgba(255,140,40,0.55)' : 'rgba(200,20,30,0.5)'); gr.addColorStop(0.6, f ? 'rgba(220,40,10,0.32)' : 'rgba(120,0,20,0.3)'); gr.addColorStop(1, 'rgba(40,0,10,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = f ? 'rgba(255,170,60,0.85)' : 'rgba(255,50,50,0.7)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(x, y, rx * 0.8, ry * 0.8, 0, 0, 7); ctx.stroke();
      // brasas subindo em volta (sempre as mesmas 10, em ciclo — sem criar nada novo por quadro)
      for (let i = 0; i < 10; i++) {
        const fase = ((t / (1400 - f * 500)) + i * 0.137 + (e.uid || 0) * 0.31) % 1, ang = i * 2.39 + (e.uid || 0);
        const bx = x + Math.cos(ang) * rx * 0.7, by = y - fase * alt * 1.05 + Math.sin(ang) * ry * 0.6;
        ctx.globalAlpha = (1 - fase) * 0.85; ctx.fillStyle = i % 3 ? (f ? '#ffb040' : '#ff4a2a') : '#ffe08a';
        ctx.beginPath(); ctx.arc(bx, by, 2.2 + (i % 3), 0, 7); ctx.fill();
      }
      ctx.restore();
    }
    return _desenhaEntGuard.apply(this, arguments);
  };
  const _desenhaGuard = desenha;
  desenha = function (dt) {
    const r = _desenhaGuard.apply(this, arguments);
    if (!G.rodando || !G.mapa || !G.mapa.lenda || !G.p) return r;
    const m = G.mons.find(x => x.d && x.d.lendaGuardiao && x.hp > 0 && (x.bravo || dist(x, G.p) < 9)); if (!m) return r;
    const ctx = CTX, W = CV.width, k = Math.min(1.6, Math.max(0.9, W / 1100)), bw = Math.min(W * 0.62, 560 * k), bh = 14 * k, bx = (W - bw) / 2, by = 80 * k; // abaixo da plaquinha com o nome do lugar
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = 'rgba(20,6,10,0.78)'; ctx.fillRect(bx - 6, by - 24 * k, bw + 12, bh + 30 * k);
    ctx.font = `bold ${Math.round(14 * k)}px Fredoka, sans-serif`; ctx.textAlign = 'center'; ctx.fillStyle = m.furia ? '#ffb040' : '#ff6a6a';
    ctx.fillText(`☠️ ${m.d.nome}${m.furia ? ' — RAGE!' : ''}`, W / 2, by - 7 * k);
    ctx.fillStyle = '#3a0a10'; ctx.fillRect(bx, by, bw, bh);
    const p = Math.max(0, m.hp / m.d.hp), gr = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    gr.addColorStop(0, m.furia ? '#ff7a1a' : '#b8102a'); gr.addColorStop(1, m.furia ? '#ffc040' : '#ff3a4a');
    ctx.fillStyle = gr; ctx.fillRect(bx, by, bw * p, bh);
    ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 2; ctx.strokeRect(bx, by, bw, bh);
    for (const q of [0.66, 0.5, 0.33]) { ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(bx + bw * q - 1, by, 2, bh); }
    ctx.restore();
    return r;
  };
}
