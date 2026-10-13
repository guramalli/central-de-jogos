// Jocelino — casa_dentro.js — a casa por dentro (13/10: "crie a casa por dentro, igual no Stardew Valley... a ação de dormir
// e acordar deve aparecer como o Stardew também"; spec docs/superpowers/specs/2026-10-13-casa-por-dentro-design.md).
// Duas casas: a do Tio Juca (onde a família mora no começo) e a da família (depois da mudança), cada uma com as 3 camas. O
// cômodo vem pintado do Higgsfield (cenarios/casa_*_dentro, 960×600); por cima, a cama de casal (a arte troca para o Jocelino
// dormindo), o rádio, as compras do Bazar nos lugares delas, as colisões dos móveis e a porta. Dormir na cama: a tela
// escurece, vem o resumo da noite e, de manhã, a tela clareia com o Jocelino de pé ao lado da cama (como no Stardew).

// Posições em px do cenário (960×600, o canto de cima-esquerdo do cômodo = 0,0). Sólidos: [x, y, largura, altura].
const CASAS = {
  casa_juca_dentro: {
    nome: 'A casa do Tio Juca', cenario: 'cenarios/casa_juca_dentro', larg: 20, alt: 13,
    livre: { x: 1, y: 3, w: 18, h: 8 }, porta: { x: 9, y: 10 }, acorda: { x: 4, y: 9 },
    // a cama de casal no canto da família (1,3× a arte: as camas das crianças, pintadas, são compridas); bx/by/aw = o ladrilho da base
    cama: { arte: 'objetos/cama_juca_casal', dormindo: 'objetos/cama_juca_casal_dormindo', bx: 1, by: 9, aw: 3, w: 140, h: 156 },
    solidos: [[47, 140, 150, 140], [193, 140, 44, 260], [390, 240, 165, 160], [610, 140, 120, 52], [733, 140, 44, 40], [730, 300, 185, 110]],
    radio: { x: 479, y: 96 },
    bazar: { garrafa_termica: { arte: 'objetos/garrafa_termica_mesa', x: 473, y: 303 }, fogao_gas: { arte: 'objetos/fogao_gas', x: 854, y: 190, pe: [48, 30] },
      maquina_costura: { arte: 'objetos/maquina_costura', x: 319, y: 222, pe: [54, 30] }, televisao: { arte: 'objetos/televisao', x: 479, y: 196, pe: [44, 24] },
      bicicleta: { arte: 'objetos/bicicleta_parada', x: 584, y: 478 } },
  },
  casa_familia_dentro: {
    nome: 'A casa da família', cenario: 'cenarios/casa_familia_dentro', larg: 20, alt: 13,
    livre: { x: 1, y: 2, w: 18, h: 9 }, porta: { x: 9, y: 10 }, acorda: { x: 15, y: 4 },
    // (a cama encostada na parede da direita: no meio do quarto, ela fechava o canto de lá)
    cama: { arte: 'objetos/cama_casal', dormindo: 'objetos/cama_casal_dormindo', bx: 17, by: 4, aw: 2, w: 130, h: 145 },
    // as paredes de dentro (a do meio com o vão para o quarto das crianças; as baixas com o vão da cozinha e do quarto do casal).
    // Os vãos ficam com 1 ladrilho inteiro (o pé passa sem raspar; os vãos pintados são um pouco mais estreitos).
    solidos: [[495, 96, 15, 304], [495, 470, 15, 40], [33, 241, 351, 52], [432, 241, 63, 52], [510, 241, 18, 52], [576, 241, 354, 52],
      [513, 96, 77, 60], [590, 96, 40, 43], [33, 96, 40, 63], [185, 96, 134, 41], [189, 160, 81, 55], [148, 293, 137, 48],
      [600, 293, 70, 145], [800, 293, 75, 148], [697, 313, 63, 45]],
    radio: { x: 110, y: 330 },
    bazar: { garrafa_termica: { arte: 'objetos/garrafa_termica_mesa', x: 230, y: 190 }, fogao_gas: { arte: 'objetos/fogao_gas', x: 364, y: 150, pe: [48, 30] },
      maquina_costura: { arte: 'objetos/maquina_costura', x: 69, y: 417, pe: [54, 30] }, televisao: { arte: 'objetos/televisao', x: 456, y: 352, pe: [44, 24] },
      bicicleta: { arte: 'objetos/bicicleta_parada', x: 376, y: 478 } },
  },
};
// Onde a família mora agora (a casa nova depois da mudança).
const casaDaFamilia = () => typeof CasaFamilia !== 'undefined' && CasaFamilia.mudou() ? 'casa_familia_dentro' : 'casa_juca_dentro';
const naCasa = () => !!CASAS[G.mapaId];
const FRASE_BAZAR = {
  garrafa_termica: 'A garrafa térmica: o cafezinho da Rosa vai na mochila toda manhã.',
  fogao_gas: 'O fogão a gás: a marmita da Rosa sai mais forte.',
  maquina_costura: 'A máquina de costura da Rosa: costura para fora e ajuda nas contas.',
  bicicleta: 'A bicicleta: o Jocelino anda mais rápido pela Vila.',
};

for (const id in CASAS) MAPAS_DEF[id] = () => {
  const C = CASAS[id], b = new Construtor(id, C.larg, C.alt, 3);
  b.dentro = true; b.cenario = C.cenario; b.enquadramento = { x: 0, y: 0, w: 960, h: 600 };
  b.livre = C.livre; b.inicio = { x: C.porta.x, y: C.porta.y - 1 };
  b.saida(C.porta.x, C.porta.y, 1, 1, 'quintal', 0, 0);   // a chegada certa vem do AO_ENTRAR_MAPA do quintal (a porta da casa onde mora)
  b.paredesDaBorda();
  for (const [x, y, w, h] of C.solidos) b.solidos.push({ x, y, w, h });
  // A fileira da porta é andável (sem ela, o pé parava na beira da borda e não saía: teste de 13/10, "estou travado dentro da casa");
  // o resto da fileira é parede.
  b.solidos.push({ x: 0, y: C.porta.y * TILE, w: C.porta.x * TILE, h: TILE }, { x: (C.porta.x + 1) * TILE, y: C.porta.y * TILE, w: (C.larg - C.porta.x - 1) * TILE, h: TILE });
  // A cama de casal: botão direito dorme; deitado, a arte troca para o Jocelino dormindo.
  const K = C.cama, cama = b.interativo('cama', K.arte, K.bx, K.by, K.aw, 1, [K.w / 3, (K.h - 6) / 3]);
  cama.alvoAlto = K.h;
  cama.desenha = ctx => { const img = spr(G.jog && G.jog.deitado ? K.dormindo : K.arte); if (img) ctx.drawImage(img, cama.x - K.w / 2, cama.y - K.h, K.w, K.h); };
  cama.acao = () => pedirDormir();
  // O rádio (a TV do Stardew): a previsão e o horóscopo.
  const r = b.interativo('radio', 'objetos/radio', 0, 0, 1, 1, null, false); Object.assign(r, { x: C.radio.x, y: C.radio.y });
  r.acao = () => { abrirPlaca(previsaoDoRadio()); return true; };
  b.aoEntrar = () => poeBazarNaCasa(b);
  return b;
};
// As compras do Bazar nos lugares delas (cada vez que se entra: comprou hoje, aparece).
function poeBazarNaCasa(b) {
  const C = CASAS[b.id]; if (!C) return;
  for (const o of b.objs.filter(o => o.compra)) { b.tirar(o); if (o.caixa) b.solidos = b.solidos.filter(s => s !== o.caixa); }
  for (const id in C.bazar) {
    if (typeof Bazar === 'undefined' || !Bazar.tem(id)) continue;
    const P = C.bazar[id], o = b.interativo('compra_' + id, P.arte, 0, 0, 1, 1, null, false);
    Object.assign(o, { x: P.x, y: P.y, compra: id });
    if (P.pe) { o.caixa = b._caixa(P.x, P.y, P.pe[0], P.pe[1]); b.solidos.push(o.caixa); }
    o.acao = () => { abrirPlaca(id === 'televisao' ? `A televisão da família: a novela das oito junta todo mundo no sofá.\n\n${previsaoDoRadio().replace('Rádio Maré', 'TV Maré')}` : FRASE_BAZAR[id]); return true; };
  }
}
// Entrar: a casa por fora leva para dentro (antes, perguntava "Dormir?").
function entrarEmCasa(id = casaDaFamilia()) { entrarMapa(id, { x: CASAS[id].porta.x, y: CASAS[id].porta.y - 1 }); G.jog.dir = DIR.CIMA; sons.tocar('porta', 1, 0.05, -6); return true; }
// Sair: na frente da porta da casa onde a família mora.
AO_ENTRAR_MAPA.push(id => {
  if (id !== 'quintal' || !G._saindoDeCasa) return;
  G._saindoDeCasa = false;
  const t = CasaFamilia.mudou() ? CasaFamilia.porta() : { x: 7, y: 10 };
  G.jog.x = (t.x + 0.5) * TILE; G.jog.y = t.y * TILE + 36; G.jog.dir = DIR.BAIXO;
  if (G.limpou) G.limpou.casa_porta = (G.limpou.casa_porta || 0) + 1;
});
{ const s0 = entrarMapa; entrarMapa = function (id, tile) { if (CASAS[G.mapaId] && id === 'quintal') G._saindoDeCasa = true; return s0(id, tile); }; }

// ---------- dormir e acordar (o Stardew: deita, a tela escurece, o resumo, a tela clareia ao lado da cama) ----------
let _fade = null;   // { alfa, alvo, vel, depois }
const fadeTela = (alfa, alvo, seg, depois) => { _fade = { alfa, alvo, vel: 1 / seg, depois }; };
ATUALIZADORES.push(dt => {
  if (!_fade) return;
  const f = _fade, d = f.alvo - f.alfa;
  f.alfa = Math.abs(d) <= f.vel * dt ? f.alvo : f.alfa + Math.sign(d) * f.vel * dt;
  if (f.alfa === f.alvo) { const dep = f.depois; f.depois = null; if (f.alvo === 0) _fade = null; if (dep) dep(); }
});
DESENHOS_TELA.push(ctx => { if (!_fade || _fade.alfa <= 0) return; ctx.save(); ctx.fillStyle = `rgba(8,6,20,${_fade.alfa})`; ctx.fillRect(0, 0, G.larg, G.alt); ctx.restore(); });
// Deitar: a cama troca de arte, o Jocelino some do chão e a tela escurece; no escuro, a noite (dormir()).
function deitarNaCama() {
  if (!G.jog || G.jog.deitado) return;
  G.jog.deitado = true; G.jog.andando = false; sons.tocar('pousar', 0.7, 0.05, -10);
  if (G.limpou) G.limpou.casa_dormir = (G.limpou.casa_dormir || 0) + 1;
  fadeTela(0, 1, 1.2, () => dormir());
}
// Acordar (o fim do dormir()): de pé ao lado da cama, dentro da casa onde a família mora, e a tela clareia.
function acordarEmCasa() {
  const id = casaDaFamilia();
  entrarMapa(id, CASAS[id].acorda);
  G.jog.deitado = false; G.jog.dir = DIR.BAIXO;
  fadeTela(1, 0, 1.2);
}
