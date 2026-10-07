/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   👻⚽ COPA DOS ESQUECIDOS — ARTE (v410; dono: "acho legal usarmos roupas translúcidas e personagens também, fazendo
   com que se pareçam fantasmas mesmo")
   1) FANTASMAS POR CÓDIGO: todo adversário/NPC com `fantasma: true` no def é desenhado translúcido (~60%), desbotado num
      tom azul-acinzentado, com um brilho de névoa em volta, as pernas se desfazendo em névoa e flutuando um pouquinho.
      Simpáticos, sem susto. O efeito é aplicado NO SPRITE do corpo (spriteBoneco/aSprite) enquanto o fantasma é desenhado,
      então segue tudo o que o desenhaEnt faz com o corpo (tranco ao apanhar, golpe, gingado, inclinação, espelho, chute
      de lances.js). Cada pose vira fantasma UMA vez (guardada junto da pose; ~1 ms) e conta no orçamento de bonecos por
      quadro da v408.6 (desempenho_v408.js).
      `fantasma` pode ser true ou { alfa: 0.6, nevoa: 1 } (alfa = quanto aparece; nevoa = 0 sem névoa nos pés).
   2) ARTES NOVAS (Higgsfield, recortadas pelo crivo): props do estádio, Taça dos Esquecidos, ingresso, materiais de
      refino, Uniforme dos Esquecidos (6 peças × 3 faixas), Mascote Perdido e Bumbo Trovão (sprites), mascote Bolinha
      Esquecida, bustos do Seu Saudade e da Dona Memória, os escudos dos 8 times inventados (Álbum dos Esquecidos) e as
      8 cenas dos capítulos (window.CQ_CAP_IMG).
      As artes NÃO entram na carga inicial (ASSETS): só no ASSET_SET — cada uma baixa quando aparece pela 1ª vez.
   3) LOOKS de boneco sugeridos (uniformes antigos e desbotados, sem cores de clube real) para os adversários, chefões e
      NPCs da Copa: só valem para quem NÃO tiver look no def (ou tiver look.cqa = true).
   Prefixo: cqa / CQA_. Carregar DEPOIS de copa_esquecidos.js (e de lances.js, dialogo_npc.js, multiverso.js);
   pode ficar antes ou depois de desempenho_v408.js.
   ============================================================ */

/* ---------- 2) artes: registro sob demanda ---------- */
const CQA_PROPS = { // nome: largura do desenho em quadradinhos (todos bloqueiam o próprio quadradinho)
  cq_bilheteria: 2.0, cq_catraca: 0.9, cq_placa: 1.6, cq_trofeus: 1.3, cq_armarios: 1.6, cq_banco_reservas: 2.0, cq_refletor: 0.9,
  cq_faixa: 2.2, cq_trave: 3.0, cq_cesto_bolas: 1.0, cq_taca_pedestal: 1.3,
  cq_chuveiro: 0.9, cq_lampada: 0.6, cq_maca: 1.6, cq_relogio: 0.9, cq_portal: 2.3,
};
const CQA_MINI = { cq_bilheteria: '#7a9ac0', cq_armarios: '#6a8a6a', cq_banco_reservas: '#8a7a5a', cq_trave: '#f0ece0', cq_faixa: '#b0a8c8', cq_portal: '#9ac8ff', cq_taca_pedestal: '#d8d0b0' };
const CQA_UE = ['cabeca', 'camisa', 'calcao', 'perna', 'chuteira', 'acessorio'];
const CQA_ARTE = [
  ...Object.keys(CQA_PROPS),
  'i_taca_esquecidos', 'i_ingresso_esquecido', 'i_cq_mat_1', 'i_cq_mat_2', 'i_cq_mat_3',
  ...CQA_UE.flatMap(p => ['700', '800', '900'].map(f => `i_ue_${p}_${f}`)),
  'cq_mascote', 'cq_bumbo',
  ...['', '_f', '_a'].flatMap(s => [1, 2, 3, 4].map(k => `pet_bolinha_esquecida${s}_c${k}`)),
  // escudos do Álbum dos Esquecidos, na ordem dos times da frente MISSÕES (copa_historia.js): 1 Unidos do Banco, 2 Relâmpago
  // da Várzea, 3 Muralha FC, 4 Trio da Origem, 5 Ola EC, 6 Mascotinhos da Colina, 7 Quase Lá FC, 8 Prancheta Atlético
  ...[1, 2, 3, 4, 5, 6, 7, 8].map(k => `cq_escudo_${k}`),
];
window.CQA_ARTE_LISTA = CQA_ARTE; // (s12: toda arte da Copa existe e abre)
CQA_ARTE.forEach(n => ASSET_SET.add(n));
for (const [k, w] of Object.entries(CQA_PROPS)) { OBJ_INFO[k] = { w, b: 1 }; OBJ_BLOQUEIA.add(k); }
Object.assign(OBJ_MINI, CQA_MINI);
// adversários que são SPRITE (não boneco): look: { tipo: 'cq_mascote', spr: 'cq_mascote' } — altura em quadradinhos
Object.assign(ALTURA_BICHO, { cq_mascote: 1.9, cq_bumbo: 1.75 });

// ícones com ARTE PRÓPRIA (no lugar do ícone-base tingido que a MECÂNICAS usou enquanto não havia arte) e a taça da casa
function cqaPoeIcones() {
  const ids = ['ingresso_esquecido', 'cq_mat_1', 'cq_mat_2', 'cq_mat_3', 'taca_esquecidos', ...CQA_UE.flatMap(p => ['700', '800', '900'].map(f => `ue_${p}_${f}`))];
  for (const id of ids) { const it = ITENS[id], n = 'i_' + id; if (!it || !ASSET_SET.has(n)) continue; ICON_ALIAS[id] = n; delete it.iconeBase; delete it.matiz; }
  if (ITENS.taca_esquecidos) ITENS.taca_esquecidos.obj = 'cq_taca_pedestal'; // (móvel da casa: a taça no pedestal)
}
cqaPoeIcones();

// bustos da conversa (dialogo_npc.js): a/busto_<id>_v410.webp
const CQA_BUSTOS = { seu_saudade: 'a/busto_seu_saudade_v410.webp', dona_memoria: 'a/busto_dona_memoria_v410.webp' };
if (typeof bustoNPC === 'function') {
  const _bustoCqa = bustoNPC, img = {};
  bustoNPC = function (id) {
    if (!CQA_BUSTOS[id]) return _bustoCqa.apply(this, arguments);
    if (!img[id]) { img[id] = new Image(); img[id].src = CQA_BUSTOS[id]; }
    return img[id];
  };
}

// cenas dos capítulos da Copa (copa_historia.js lê window.CQ_CAP_IMG; arte 16:9 no estilo das cenas do Multiverso)
window.CQ_CAP_IMG = { ingresso: 'cap_cq_ingresso', estadio: 'cap_cq_estadio', times: 'cap_cq_times', anfitrioes: 'cap_cq_anfitrioes',
  final: 'cap_cq_final', apito: 'cap_cq_apito', taca: 'cap_cq_taca', torcida: 'cap_cq_torcida' };
Object.values(window.CQ_CAP_IMG).forEach(n => { ASSET_SET.add(n); CQA_ARTE.push(n); });

/* ---------- 3) looks sugeridos (uniformes antigos: listras, golas, meiões altos, topetes de época) ---------- */
// cores desbotadas e combinações que não lembram clube real; o fantasma ainda desbota tudo um pouco mais
const cqaL = (o) => Object.assign({ tipo: 'humano', cqa: true, chuteira: '#4a3626' }, o);
const CQA_LOOKS = {
  cq_reserva: cqaL({ folha: 'magrelo', pele: 'pele-clara', cabelo: 'cabelo-topete', corCabelo: 'castanho', camisa: '#9a8fb5', estampa: 'listras', cor2: '#ece2cc', calcao: '#5a5470', meia: '#ece2cc', numero: 12, alt: 1.66 }),
  cq_massagista: cqaL({ folha: 'gordinha', corpo: 'f', pele: 'pele-media', cabelo: 'cabelo-coque', corCabelo: 'grisalho', camisa: '#e2d6bc', estampa: 'gola', cor2: '#7a9a8a', calcao: '#6a7a70', meia: '#e2d6bc', alt: 1.6 }),
  cq_gandula: cqaL({ folha: 'bone_reta', pele: 'pele-morena', cabelo: 'cabelo-curto', corCabelo: 'preto', camisa: '#c9a46a', estampa: 'faixa', cor2: '#7a5a8a', calcao: '#4a4060', meia: '#c9a46a', alt: 1.45 }),
  cq_zagueiro: cqaL({ folha: 'grandao', pele: 'pele-escura', cabelo: 'cabelo-raspado', corCabelo: 'preto', camisa: '#7f8f6a', estampa: 'listras', cor2: '#d9c48a', calcao: '#3e4636', meia: '#7f8f6a', numero: 3, grande: true }),
  cq_bandeirinha: cqaL({ folha: 'adulto', pele: 'pele-clara', cabelo: 'cabelo-curto', corCabelo: 'ruivo', camisa: '#d6c070', estampa: 'gola', cor2: '#3a3a4a', calcao: '#2e2e3a', meia: '#2e2e3a', alt: 1.7 }),
  cq_arbitro: cqaL({ folha: 'careca', pele: 'pele-media', corCabelo: 'grisalho', camisa: '#3a3a46', estampa: 'gola', cor2: '#ece2cc', calcao: '#2a2a30', meia: '#2a2a30', alt: 1.72 }),
  cq_torcida: cqaL({ folha: 'moletom_m', pele: 'pele-morena', cabelo: 'cabelo-cacheado', corCabelo: 'castanho', camisa: '#b08aa0', calcao: '#5a5060', meia: '#b08aa0', alt: 1.62 }),
  cq_craque: cqaL({ folha: 'adulto', pele: 'pele-media', cabelo: 'cabelo-topete', corCabelo: 'preto', camisa: '#5f7f9a', estampa: 'listras', cor2: '#f0e6d0', calcao: '#f0e6d0', meia: '#5f7f9a', numero: 10, alt: 1.72 }),
  cq_goleiro: cqaL({ folha: 'goleiro', pele: 'pele-clara', cabelo: 'cabelo-curto', corCabelo: 'loiro', camisa: '#6a6a7a', estampa: 'gola', cor2: '#c8b890', calcao: '#2a2a2a', meia: '#6a6a7a', numero: 1, alt: 1.8 }),
  cq_tecnico: cqaL({ folha: 'sobretudo_m', pele: 'pele-clara', cabelo: 'cabelo-curto', corCabelo: 'grisalho', camisa: '#5a4a3a', calcao: '#3a3430', alt: 1.74 }),
  cq_cap_vestiario: cqaL({ folha: 'barbudo', pele: 'pele-media', cabelo: 'cabelo-curto', corCabelo: 'castanho', camisa: '#a87a5a', estampa: 'faixa', cor2: '#f0e0c0', calcao: '#4a3a2a', meia: '#a87a5a', numero: 5, grande: true }),
  cq_xerife_tunel: cqaL({ folha: 'colete_m', pele: 'pele-escura', cabelo: 'cabelo-curto', corCabelo: 'grisalho', camisa: '#4a4a5a', estampa: 'gola', cor2: '#d8b84a', calcao: '#2a2a34', meia: '#2a2a34', grande: true }),
  cq_rei_arquibancada: cqaL({ folha: 'gordinho', pele: 'pele-morena', cabelo: 'cabelo-black-power', corCabelo: 'preto', camisa: '#8a5a8a', estampa: 'listras', cor2: '#e8d8a0', calcao: '#4a3048', meia: '#8a5a8a', grande: true }),
  cq_craque_final: cqaL({ folha: 'adulto', pele: 'pele-clara', cabelo: 'cabelo-topete', corCabelo: 'loiro', camisa: '#e8e0d0', estampa: 'gola', cor2: '#c8a040', calcao: '#3a3a4a', meia: '#e8e0d0', numero: 10, grande: true }),
  // NPCs (com o busto da conversa combinando: boina/cardigã e coque branco/xale)
  seu_saudade: cqaL({ folha: 'boina_m', pele: 'pele-clara', cabelo: 'cabelo-curto', corCabelo: 'grisalho', camisa: '#6a5a4a', calcao: '#4a4440', alt: 1.64 }),
  dona_memoria: cqaL({ folha: 'vova', corpo: 'f', pele: 'pele-clara', cabelo: 'cabelo-coque', corCabelo: 'grisalho', camisa: '#7a8aa8', calcao: '#5a5a6a', alt: 1.56 }),
  // sprites (arte própria)
  cq_mascote: { tipo: 'cq_mascote', spr: 'cq_mascote', grande: true, cqa: true },
  cq_bumbo: { tipo: 'cq_bumbo', spr: 'cq_bumbo', grande: true, cqa: true },
};
window.CQA_LOOKS = CQA_LOOKS;
// Mascote Perdido e Bumbo Trovão: o contrato pede ARTE PRÓPRIA (não boneco) — se o def ainda usa um boneco, troca pelo
// sprite (CQA_SPRITE_FORCA = false deixa o look da MECÂNICAS como está)
const CQA_SPRITE_FORCA = true;
function cqaPoeLooks() {
  for (const [id, L] of Object.entries(CQA_LOOKS)) {
    const d = (typeof MONSTROS !== 'undefined' && MONSTROS[id]) || (typeof NPCS !== 'undefined' && NPCS[id]);
    if (!d) continue;
    const sprite = L.spr && CQA_SPRITE_FORCA && d.look && d.look.tipo === 'humano';
    if (d.look && !d.look.cqa && !sprite) continue;
    d.look = Object.assign({}, L);
  }
}
cqaPoeLooks();
{ const _iniCqa = iniciarJogo; iniciarJogo = async function () { try { cqaPoeLooks(); } catch (e) { } return _iniCqa.apply(this, arguments); }; }

/* ---------- 1) o efeito fantasma ---------- */
const CQA = { ativo: null, poses: new WeakMap(), imgs: new WeakMap(), orig: new WeakMap(), chutes: new WeakMap(), ALFA: 0.74 };
function cqaFantasmaDe(e) {
  if (!e || e === G.p || !e.d) return null;
  const f = e.d.fantasma || (e.d.look && e.d.look.fantasma) || (e._dV && e._dV.fantasma); if (!f) return null; // (NPCs: look.fantasma)
  return f === true ? { alfa: CQA.ALFA, nevoa: 1 } : { alfa: f.alfa || CQA.ALFA, nevoa: f.nevoa == null ? 1 : f.nevoa };
}
// a pose (canvas) vira fantasma: desbota, azula, ganha um contorno claro de névoa (lê bem na grama e no escuro), fica
// translúcida e desfaz as pernas em névoa
function cqaFantasmiza(c, cfg, semente, baixo) {
  const W = c.width, H = c.height, a = mkCanvas(W, H), ax = a.getContext('2d');
  ax.drawImage(c, 0, 0);
  // desbotado: tira ~45% da cor e passa um véu azul-acinzentado (só onde há desenho; os traços escuros continuam)
  ax.globalCompositeOperation = 'saturation'; ax.globalAlpha = 0.45; ax.fillStyle = '#808080'; ax.fillRect(0, 0, W, H);
  ax.globalAlpha = 1; ax.globalCompositeOperation = 'destination-in'; ax.drawImage(c, 0, 0);
  ax.globalCompositeOperation = 'source-atop'; ax.fillStyle = 'rgba(140,185,240,0.30)'; ax.fillRect(0, 0, W, H);
  ax.fillStyle = 'rgba(235,245,255,0.10)'; ax.fillRect(0, 0, W, H);
  // as pernas se desfazem: do joelho para baixo o desenho vai sumindo (os pés ficam bem clarinhos)
  if (cfg.nevoa) {
    const y0 = H * (baixo || 0.7), g = ax.createLinearGradient(0, y0, 0, H);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.8)');
    ax.globalCompositeOperation = 'destination-out'; ax.fillStyle = g; ax.fillRect(0, y0, W, H - y0);
  }
  ax.globalCompositeOperation = 'source-over';
  // contorno: a silhueta engordada ~2 px, pintada de azul-névoa, sem o miolo
  const k = Math.max(1.5, W / 110), sil = mkCanvas(W, H), sx = sil.getContext('2d');
  for (const [dx, dy] of [[k, 0], [-k, 0], [0, k], [0, -k], [k * 0.7, k * 0.7], [-k * 0.7, k * 0.7], [k * 0.7, -k * 0.7], [-k * 0.7, -k * 0.7]]) sx.drawImage(a, dx, dy);
  sx.globalCompositeOperation = 'source-in'; sx.fillStyle = 'rgba(205,232,255,1)'; sx.fillRect(0, 0, W, H);
  sx.globalCompositeOperation = 'destination-out'; sx.drawImage(a, 0, 0);
  // junta: brilho de névoa em volta + contorno + corpo translúcido
  const out = mkCanvas(W, H), x = out.getContext('2d');
  x.save(); x.shadowColor = 'rgba(170,215,255,0.9)'; x.shadowBlur = Math.max(6, W * 0.05); x.globalAlpha = 0.55; x.drawImage(sil, 0, 0); x.restore();
  x.globalAlpha = 0.85; x.drawImage(sil, 0, 0); x.globalAlpha = cfg.alfa; x.drawImage(a, 0, 0); x.globalAlpha = 1;
  // névoa nos pés: tufos macios (o desenho muda um pouco a cada quadro da caminhada)
  if (cfg.nevoa) {
    let s = semente * 9301 + 49297; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    for (let i = 0; i < 7; i++) {
      const px = W * (0.32 + rnd() * 0.36), py = H * (0.87 + rnd() * 0.09), r = W * (0.08 + rnd() * 0.07);
      const g = x.createRadialGradient(px, py, 1, px, py, r);
      g.addColorStop(0, 'rgba(225,240,255,0.5)'); g.addColorStop(0.6, 'rgba(190,220,255,0.22)'); g.addColorStop(1, 'rgba(190,220,255,0)');
      x.fillStyle = g; x.beginPath(); x.ellipse(px, py, r, r * 0.62, 0, 0, 7); x.fill();
    }
  }
  return out;
}
const cqaConta = t0 => { if (typeof DSP !== 'undefined' && DSP.noDesenho) DSP.gasto += performance.now() - t0; }; // (orçamento por quadro da v408.6)
{
  // pose de boneco
  const _sbCqa = spriteBoneco;
  spriteBoneco = function (look, vista, q) {
    const r = _sbCqa.apply(this, arguments), e = CQA.ativo;
    if (!e || !r || !r.c || r.c.width < 4) return r;
    let gh = CQA.poses.get(r.c); if (gh) return gh;
    const t0 = performance.now();
    try {
      gh = { c: cqaFantasmiza(r.c, cqaFantasmaDe(e) || { alfa: CQA.ALFA, nevoa: 1 }, (q | 0) + 1 + ({ lado: 10, costas: 20 }[vista] || 0), 0.7) };
      CQA.poses.set(r.c, gh); CQA.orig.set(gh.c, r.c);
    } catch (er) { return r; }
    cqaConta(t0); return gh;
  };
  // chute/desarme (lances.js e jogadas.js): a perna é girada no desenho ORIGINAL e o fantasma vem depois (senão o recorte
  // da perna deixava um "buraco" quadrado no brilho e na névoa). Guardado por ângulo (passos de ~0,08 rad).
  if (typeof spriteChute === 'function') {
    const _scCqa = spriteChute;
    spriteChute = function (base, ang) {
      const o = CQA.orig.get(base); if (!o || !CQA.ativo) return _scCqa.apply(this, arguments);
      let m = CQA.chutes.get(o); if (!m) { m = new Map(); CQA.chutes.set(o, m); }
      const kq = Math.round(ang * 12); let gh = m.get(kq); if (gh) return gh;
      const t0 = performance.now();
      gh = cqaFantasmiza(_scCqa.call(this, o, kq / 12), cqaFantasmaDe(CQA.ativo) || { alfa: CQA.ALFA, nevoa: 1 }, 31, 0.7);
      m.set(kq, gh); cqaConta(t0); return gh;
    };
  }
  // sprite de bicho (Mascote Perdido, Bumbo Trovão, ou qualquer adversário-sprite com fantasma)
  const _aSprCqa = aSprite;
  aSprite = function (nome) {
    const im = _aSprCqa.apply(this, arguments), e = CQA.ativo;
    if (!e || !im) return im;
    let gh = CQA.imgs.get(im); if (gh) return gh;
    const t0 = performance.now();
    try { gh = cqaFantasmiza(im, cqaFantasmaDe(e) || { alfa: CQA.ALFA, nevoa: 1 }, nome.length, 0.76); CQA.imgs.set(im, gh); cqaConta(t0); return gh; } catch (er) { return im; }
  };
}
// a poça de névoa no chão (um desenho só, reaproveitado) — no lugar da sombra escura, que ficava "voando" com o fantasma
const CQA_POCA = (() => {
  const c = mkCanvas(96, 36), x = c.getContext('2d'), g = x.createRadialGradient(48, 18, 2, 48, 18, 46);
  g.addColorStop(0, 'rgba(200,230,255,0.55)'); g.addColorStop(0.55, 'rgba(160,205,255,0.22)'); g.addColorStop(1, 'rgba(160,205,255,0)');
  x.fillStyle = g; x.save(); x.scale(1, 36 / 96); x.beginPath(); x.arc(48, 48, 46, 0, 7); x.fill(); x.restore(); return c;
})();
{
  const SOMBRA = 'rgba(30, 20, 40, 0.25)'; // a sombra que o desenhaEnt pinta primeiro (game.js)
  const _entCqa = desenhaEnt;
  desenhaEnt = function (ctx, e) {
    const cfg = cqaFantasmaDe(e); if (!cfg) return _entCqa.apply(this, arguments);
    const t = G.agora, u = e.uid || 0, alt = (typeof alturaEnt === 'function' ? alturaEnt(e) : 1.6) * T, x = e.x * T, y = e.y * T;
    const fl = 3 + (Math.sin(t / 520 + u) * 0.5 + 0.5) * 5; // flutua 3–8 px, devagar
    const rw = Math.min(alt * 0.62, 72) * (1.05 - fl / 40); // névoa no chão: encolhe um pouco quando ele sobe
    ctx.drawImage(CQA_POCA, x - rw / 2, y - rw * 0.19, rw, rw * 0.375);
    const ant = CQA.ativo; CQA.ativo = e;
    // a sombra escura que o desenhaEnt pinta no chão: no fantasma ela não entra (a poça de névoa faz esse papel)
    const tinha = Object.prototype.hasOwnProperty.call(ctx, 'fill'), fillAnt = ctx.fill; let pulou = false;
    ctx.fill = function () { if (!pulou && this.fillStyle === SOMBRA) { pulou = true; return; } return fillAnt.apply(this, arguments); };
    ctx.save(); ctx.translate(0, -fl); ctx.globalAlpha *= 0.92 + 0.08 * Math.sin(t / 380 + u * 1.7);
    try { return _entCqa.apply(this, arguments); }
    finally {
      ctx.restore(); if (tinha) ctx.fill = fillAnt; else delete ctx.fill; CQA.ativo = ant;
      // fiapos de névoa subindo (sempre os mesmos 3, em ciclo — nada novo por quadro)
      ctx.save(); ctx.fillStyle = 'rgb(215,235,255)';
      for (let i = 0; i < 3; i++) {
        const k = ((t / 1900) + i / 3 + u * 0.13) % 1, px = x + Math.sin(k * 6 + i * 2.1 + u) * alt * 0.16, py = y - fl - alt * 0.1 - k * alt * 0.5;
        ctx.globalAlpha = (1 - k) * 0.28 * (k < 0.15 ? k / 0.15 : 1); ctx.beginPath(); ctx.arc(px, py, 1.8 + i * 0.6 + k * 2.5, 0, 7); ctx.fill();
      }
      ctx.restore();
    }
  };
}
window.CQA = CQA;
