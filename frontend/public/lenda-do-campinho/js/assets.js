/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   RUMO AO CRAQUE — artes geradas (pasta a/)
   carregamento, chão texturizado, interiores e ícones
   ============================================================ */
const ASSET_DIR = 'a/';
const ASSETS = 'arbusto arquibancada arvore b_ap1 b_ap2 b_bazar b_casa b_ct b_escola b_loja b_padaria balcao banca banco banco_reservas barra barreiras bau bebedouro bicicletario boia boneco cachorro cachorro2 cadeira_praia caixa_correio cama canteiro caranguejo carro carro2 carteira castelo cone_deco cones coqueiro coqueiro2 d_arrancada d_caneta d_chapeu d_chute_colocado d_elastico d_pedalada d_respiro d_voleio dc_cogumelo dc_dente dc_flor1 dc_flor2 dc_flor3 dc_flor4 dc_folhas dc_margarida dc_pedra1 dc_pedra2 dc_poca dc_trevo dc_tufo1 dc_tufo2 dc_tufo3 dc_tufo4 estante gaivota geladeira grade guarda_roupa guarda_sol hidrante holofote i_acai i_agua i_agua_coco i_apito_velho i_bola i_bola_murcha i_bola_praia i_bone i_calcao_camuflado i_calcao_praia i_calcao_pro i_calcao_tactel i_camisa10 i_camisa_ct i_camisa_futsal i_camisa_listrada i_camisa_vila i_camiseta i_caneleira_carbono i_caneleira_papelao i_caneleira_plastico i_cartao i_cartao_vermelho i_chuteira_couro i_chuteira_ouro i_chuteira_pano i_chuteira_pro i_chuteira_society i_chuteira_travas i_colar_havaiano i_concha i_cone i_coroa i_cronometro i_faixa_capitao i_faixa_suor i_headset i_isotonico i_louros i_luva i_medalha_bronze i_medalha_colecionador i_medalha_ouro i_medalha_prata i_munhequeira i_oculos_sol i_osso i_pacotinho i_pe_descalco i_pena i_prancheta i_roda_skate i_shorts_rasgado i_suco_verde i_tenis_velho i_vitamina isopor lixeira lousa mangueira maquina mesa palmeira_vaso pedra placa placar pombo pombo2 ponto_onibus poste poste2 prancha prancheta_cav quadro quiosque rampa rede sacola_bolas sofa t_agua t_areia t_asfalto t_barro t_calcada t_campo t_grama t_madeira t_pedra t_piso t_pista t_quadra t_terra tapete titulo toalha torre trofeu tv vaso i_pao_queijo i_coxinha i_pastel i_tapioca i_banana i_sanduiche i_feijoada i_brigadeiro i_prato_feito i_melancia i_retalho i_couro i_fio_ouro i_oficina i_gema i_tostao'.split(' ');
const ASSET_SET = new Set(ASSETS);
const PORTAS = { b_casa: { x: 0.46, y: 0.86 }, b_bazar: { x: 0.49, y: 0.81 }, b_escola: { x: 0.475, y: 0.87 }, b_loja: { x: 0.54, y: 0.9 }, b_ct: { x: 0.52, y: 0.89 }, b_ap1: { x: 0.5, y: 0.93 }, b_ap2: { x: 0.55, y: 0.92 }, b_padaria: { x: 0.5, y: 0.9 } };
const FACE_BICHO = { pombo: 'e', pombo2: 'e', cachorro: 'e', cachorro2: 'e', gaivota: 'e', caranguejo: 'f', boneco: 'f' };

const SPR = {};
function spr(nome) {
  let e = SPR[nome];
  if (!e) {
    e = SPR[nome] = { im: new Image(), ok: false, err: false };
    e.im.onload = () => { e.ok = true; }; e.im.onerror = () => { e.err = true; };
    e.im.src = ASSET_DIR + nome + '.webp';
  }
  return e;
}
// Carrega tudo (sprites + peças do avatar do jogador) mostrando progresso
function carregaAssets(extras = [], onProg) {
  const lista = ASSETS.map(n => spr(n));
  const imgs = extras.map(u => pegaImg(u));
  return new Promise(res => {
    const t0 = performance.now();
    const tick = () => {
      const tot = lista.length + imgs.length;
      const ok = lista.filter(e => e.ok || e.err).length + imgs.filter(e => e.ok || e.err).length;
      onProg && onProg(ok / tot);
      if (ok >= tot || performance.now() - t0 > 15000) res(); else setTimeout(tick, 80);
    };
    tick();
  });
}

/* ---------------- chão com texturas ---------------- */
const TEX_CHAO = {
  [CH.GRAMA]: 't_grama', [CH.GRAMA_FLOR]: 't_grama', [CH.TERRA]: 't_terra', [CH.AREIA]: 't_areia', [CH.AREIA_MOLHADA]: 't_areia', [CH.AGUA]: 't_agua',
  [CH.PEDRA]: 't_pedra', [CH.MADEIRA]: 't_madeira', [CH.CAMPO]: 't_campo', [CH.QUADRA]: 't_quadra', [CH.PISO]: 't_piso', [CH.PISTA]: 't_pista',
  [CH.ASFALTO]: 't_asfalto', [CH.CALCADA]: 't_calcada', [CH.CAMPO_TERRA]: 't_barro', [CH.CONCRETO]: 't_calcada', [CH.QUADRA_AZUL]: 't_quadra',
};
const TEMA_PAREDE = {
  casa: { papel: '#f3d9b1', listra: '#e9c996', rodape: '#8a5a32' },
  bazar: { papel: '#c99a62', listra: '#b8854e', rodape: '#5e3a20' },
  escola: { papel: '#e4eef8', listra: '#d6e4f2', rodape: '#4f8a5a' },
  loja: { papel: '#fbe7c6', listra: '#f4d6a6', rodape: '#d0602e' },
  ct: { papel: '#e8f0f6', listra: '#d8e6f0', rodape: '#3a6ad9' },
};
function padrao(ctx, nome, escala) {
  const e = spr(nome); if (!e.ok) return null;
  const p = ctx.createPattern(e.im, 'repeat');
  if (p && p.setTransform) p.setTransform(new DOMMatrix([escala, 0, 0, escala, 0, 0]));
  return p;
}
function renderChao(m) {
  if (m._chao) return m._chao;
  if (!spr('t_grama').ok) return renderChaoVetor(m);
  const W = m.w * T, H = m.h * T; const c = mkCanvas(W, H); const x = c.getContext('2d');
  const r = mulberry(m.w * 131 + m.h * 7 + m.id.length);
  const esc = (2 * T) / 256;
  x.fillStyle = padrao(x, m.interior ? 't_madeira' : 't_grama', esc) || '#86c75a'; x.fillRect(0, 0, W, H);
  // camadas por tipo de chão
  const tipos = Object.keys(ESTILO_CHAO).map(Number).sort((a, b) => ESTILO_CHAO[a].o - ESTILO_CHAO[b].o);
  for (const t of tipos) {
    const est = ESTILO_CHAO[t]; const tiles = [];
    for (let j = 0; j < m.h; j++) for (let i = 0; i < m.w; i++) if (m.chao[j * m.w + i] === t) tiles.push([i, j]);
    if (!tiles.length) continue;
    const e = est.e * T, rad = est.r * T;
    if (e > 0 || rad > 0) { x.fillStyle = t === CH.AGUA ? 'rgba(240,250,255,0.95)' : est.borda; x.globalAlpha = t === CH.AGUA ? 1 : 0.75; x.fill(caminhoTiles(tiles, e + (t === CH.AGUA ? 7 : 3), rad + 3)); x.globalAlpha = 1; }
    const corpo = caminhoTiles(tiles, e, rad);
    x.fillStyle = padrao(x, TEX_CHAO[t], esc) || est.cor; x.fill(corpo);
    x.save(); x.clip(corpo);
    if (t === CH.AREIA_MOLHADA) { x.fillStyle = 'rgba(120,90,40,0.2)'; x.fillRect(0, 0, W, H); }
    if (t === CH.CONCRETO) { x.fillStyle = 'rgba(90,90,120,0.16)'; x.fillRect(0, 0, W, H); }
    if (t === CH.QUADRA_AZUL) { x.globalCompositeOperation = 'color'; x.fillStyle = '#3a6ae0'; x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'source-over'; }
    if (t === CH.CAMPO) for (const [i, j] of tiles) if (Math.floor(i / 2) % 2) { x.fillStyle = 'rgba(255,255,255,0.07)'; x.fillRect(i * T, j * T, T, T); }
    if (t === CH.AGUA) { x.strokeStyle = 'rgba(20,70,140,0.25)'; x.lineWidth = 10; x.stroke(caminhoTiles(tiles, e, rad)); }
    x.restore();
  }
  // enfeites no chão (tufos, flores, pedrinhas)
  const decal = (nome, cx, cy, tam) => { const e = spr(nome); if (!e.ok) return; const w = tam, h = w * e.im.height / e.im.width; x.drawImage(e.im, cx - w / 2, cy - h / 2, w, h); };
  if (!m.interior) for (let j = 0; j < m.h; j++) for (let i = 0; i < m.w; i++) {
    const t = m.chao[j * m.w + i]; const o = m.obj[j * m.w + i];
    if (t === CH.GRAMA || t === CH.GRAMA_FLOR) {
      if (r() < 0.4) decal('dc_tufo' + (1 + ((r() * 4) | 0)), i * T + r() * T, j * T + r() * T, T * (0.3 + r() * 0.15));
      if (t === CH.GRAMA_FLOR || r() < 0.08) decal(['dc_flor1', 'dc_flor2', 'dc_flor3', 'dc_flor4', 'dc_margarida', 'dc_dente', 'dc_trevo'][(r() * 7) | 0], i * T + 10 + r() * (T - 20), j * T + 10 + r() * (T - 20), T * (0.32 + r() * 0.12));
      if (!o && r() < 0.02) decal(['dc_cogumelo', 'dc_folhas', 'dc_pedra1'][(r() * 3) | 0], i * T + r() * T, j * T + r() * T, T * 0.35);
    } else if ((t === CH.TERRA || t === CH.CAMPO_TERRA) && r() < 0.08) decal(r() < 0.5 ? 'dc_pedra1' : 'dc_pedra2', i * T + r() * T, j * T + r() * T, T * 0.28);
  }
  m.campos.forEach(f => drawLinhasCampo(x, f));
  if (m.interior) desenhaParedes(x, m);
  m._chao = c; return c;
}
function desenhaParedes(x, m) {
  const tp = TEMA_PAREDE[m.tema] || TEMA_PAREDE.casa; const W = m.w * T;
  // parede do fundo (2 tiles de altura)
  x.fillStyle = tp.papel; x.fillRect(0, 0, W, 2 * T);
  x.fillStyle = tp.listra; for (let i = 0; i < W; i += 28) x.fillRect(i, 0, 12, 2 * T - 18);
  x.fillStyle = tp.rodape; x.fillRect(0, 2 * T - 18, W, 18); x.fillStyle = 'rgba(0,0,0,0.18)'; x.fillRect(0, 2 * T, W, 8);
  x.fillStyle = shade(tp.rodape, -0.3); x.fillRect(0, 0, W, 10);
  // janelas e quadros
  const jan = (cx) => { rr(x, cx - 34, 26, 68, 58, 8, '#fffaf0', 3); rr(x, cx - 28, 32, 56, 46, 5, grad(x, 0, 32, 0, 78, '#bfe8ff', '#7ac0f0'), 2); x.fillStyle = '#fffaf0'; x.fillRect(cx - 2, 32, 4, 46); x.fillRect(cx - 28, 53, 56, 4); };
  const quadro = (cx) => { rr(x, cx - 22, 30, 44, 36, 4, '#8a5a32', 3); rr(x, cx - 16, 36, 32, 24, 2, '#7ad0a0', 0); x.fillStyle = '#ffe37a'; x.beginPath(); x.arc(cx + 6, 44, 5, 0, 7); x.fill(); };
  for (let i = 2; i < m.w - 2; i += 4) (i / 4) % 2 < 1 ? jan((i + 0.5) * T) : quadro((i + 0.5) * T);
  // laterais e frente
  x.fillStyle = '#4a2e1a'; x.fillRect(0, 0, T * 0.35, m.h * T); x.fillRect(W - T * 0.35, 0, T * 0.35, m.h * T);
  x.fillRect(0, (m.h - 1) * T + T * 0.55, W, T * 0.45);
  const porta = m.saidas.find(s => s.volta);
  if (porta) { x.fillStyle = '#2a1a10'; x.fillRect(porta.x * T + 6, (m.h - 1) * T + T * 0.5, T - 12, T * 0.5); rr(x, porta.x * T + 4, (m.h - 1) * T + 4, T - 8, T * 0.42, 8, '#c0503a', 2); x.fillStyle = 'rgba(255,255,255,0.5)'; x.font = `700 ${T * 0.2}px Fredoka`; x.textAlign = 'center'; x.fillText('SAÍDA', (porta.x + 0.5) * T, (m.h - 1) * T + T * 0.32); }
}

/* ---------------- ícones de item/drible com as artes ---------------- */
const ICON_ALIAS = { apito: 'i_apito_velho' };
const ICONES_ARTE = new Map();
function iconeDeArte(nome) {
  if (ICONES_ARTE.has(nome)) return ICONES_ARTE.get(nome);
  const e = spr(nome); if (!e.ok) return null;
  const c = mkCanvas(96, 96); const x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
  const s = Math.min(88 / e.im.width, 88 / e.im.height); const w = e.im.width * s, h = e.im.height * s;
  x.drawImage(e.im, (96 - w) / 2, (96 - h) / 2, w, h);
  ICONES_ARTE.set(nome, c); return c;
}
function iconeItem(id) {
  const nome = ICON_ALIAS[id] || 'i_' + id;
  return (ASSET_SET.has(nome) && iconeDeArte(nome)) || iconeItemVetor(id);
}
function iconeDrible(id) {
  const nome = 'd_' + id;
  if (ASSET_SET.has(nome)) { const c = iconeDeArte(nome); if (c) return c; }
  return iconeDribleVetor(id);
}
