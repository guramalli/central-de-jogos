// Jocelino — reforma_palco.js — a reforma da pensão no salão de lado (teste de 12/10: o cômodo de cima, com a arte velha da
// versão Godot, saiu do jogo). Durante a reforma (as 5 etapas de ECO.reforma: limpar, telhado, balcão, cozinha, pintura), a
// porta leva ao mesmo salão de lado da janta, vazio: 8 sujeiras no chão da frente (entulho e mato, arte que já existe) saem com
// um clique cada (o Jocelino vai até lá e limpa, gastando um pouco de energia). Depois, cada etapa pede o material entregue à
// Rosa (clique nela, ou na porta) e dias de trabalho no lugar dela, no salão (roteiro de 13/10; a reforma da Robin no Stardew,
// com o trabalho à vista como no bar do Bancho): a camada do "antes" (o buraco no telhado, o balcão quebrado, a cozinha
// vazia, a parede descascada) fica no lugar até a etapa acabar.

const SUJEIRA_PALCO = [['objetos/entulho_1', 420], ['objetos/mato_2', 560], ['objetos/entulho_2', 700], ['objetos/mato_3', 840],
  ['objetos/entulho_3', 980], ['objetos/mato_1', 1120], ['objetos/entulho_1', 1260], ['objetos/mato_4', 1450]];
const SUJEIRA_ESCALA = 1.6, CUSTO_SUJEIRA = 2;
const emReforma = () => !!G.pensao && ECO.reforma.some(e => e.id === G.pensao.estado);
// O lugar do trabalho de cada etapa no palco (px de mundo, 1920×1080): a área do clique (o retângulo que o artista mediu na
// camada), o pé (o x onde o Jocelino para, no chão y 900), o ponto da seta (no meio da arte), a camada do "antes" (some
// quando a etapa acaba) e a altura de desenho dela (ordem): o telhado e a cozinha por cima da cozinha pronta e por baixo da
// Rosa (301); o balcão por cima do balcão, do passe e do bebedouro e por baixo do Jocelino (900); a parede logo depois do fundo.
const REFORMA_LUGAR = {
  telhado: { area: { x0: 570, y0: 0, x1: 1000, y1: 215 }, pe: 780, seta: { x: 785, y: 200 }, camada: 'salao/reforma_telhado_buraco', ordem: 300.6 },
  balcao: { area: { x0: 360, y0: 757, x1: 1275, y1: 907 }, pe: 780, seta: { x: 780, y: 800 }, camada: 'salao/reforma_balcao_quebrado', ordem: 890 },   // (revisão final: o clique começa em 360, onde a porta acaba)
  cozinha: { area: { x0: 1300, y0: 545, x1: 1740, y1: 766 }, pe: 1500, seta: { x: 1520, y: 650 }, camada: 'salao/reforma_cozinha_vazia', ordem: 300.5 },
  pintura: { area: { x0: 0, y0: 304, x1: 1920, y1: 631 }, pe: 960, seta: { x: 960, y: 460 }, camada: 'salao/reforma_parede_descascada', ordem: 1 },
};
const naAreaReforma = (L, px, py) => !!L && px >= L.area.x0 && px <= L.area.x1 && py >= L.area.y0 && py <= L.area.y1;
const minuscula = s => s[0].toLowerCase() + s.slice(1);
const GOLPES_DIA = 3;   // o "3 golpes por dia": o terceiro clique no lugar conta o dia de trabalho
const etapaReforma = id => ECO.reforma.find(e => e.id === id);
// Um golpe no lugar da etapa (o Jocelino já andou até lá): com o material todo e uma vez por dia; o 3º golpe é o dia de trabalho.
function trabalharNaReforma() {
  const p = G.pensao, L = REFORMA_LUGAR[p.estado]; if (!L) return;
  const falta = p.faltaMaterial();
  if (Object.keys(falta).length) { avisar(`Falta material: ${Object.entries(falta).map(([i, q]) => Itens.qtd(q, i)).join(', ')} (entregue à Rosa).`); return; }
  // (um dia de trabalho por dia na reforma inteira: se a etapa anterior acabou hoje, esta começa amanhã)
  if (p.reforma.hoje === G.dia) { avisar(p.reforma.dias ? 'Por hoje chega nessa parte: amanhã tem mais.' : `A reforma de hoje já foi: amanhã começa ${minuscula(etapaReforma(p.estado).nome)}.`); return; }
  if (G.energia < CUSTO_SUJEIRA * 2) { avisar('O Jocelino está esgotado. Coma alguma coisa ou vá dormir.'); return; }
  G.energia -= CUSTO_SUJEIRA * 2; p._golpes = (p._golpes || 0) + 1; sons.tocar('golpe', 1, 0.1, -6); hudSujo();
  if (p._golpes < GOLPES_DIA) { avisar(`${etapaReforma(p.estado).nome}: ${p._golpes}/${GOLPES_DIA} hoje (se parar, amanhã recomeça do zero).`); return; }
  p._golpes = 0; const antes = p.estado, r = p.trabalharReforma(G.dia); atualizarPensaoMundo();
  if (r === 'ok') {
    if (G.limpou) G.limpou['reforma_' + antes] = (G.limpou['reforma_' + antes] || 0) + 1;   // (a seta da primeira vez some)
    sons.tocar('feito', 1, 0.03, -4);
    const prox = etapaReforma(p.estado);
    avisar(p.estado !== antes ? `${etapaReforma(antes).nome}: pronto!${prox ? ' Amanhã: ' + minuscula(prox.nome) + '.' : p.estado === 'pronta' ? ' A Pensão da Rosa abre amanhã!' : ''}` : 'Mais um dia de trabalho na reforma.');
    if (p.estado === 'pronta') G.feitosHoje.push('A reforma acabou: a pensão abre amanhã!');
  }
}
// As camadas do "antes" das etapas que ainda não acabaram (a atual e as seguintes), cada uma no salão inteiro (1920×1080).
function camadasDaReforma() {
  const p = G.pensao; if (!p) return [];
  const k = ECO.reforma.findIndex(e => e.id === p.estado); if (k < 0) return [];
  return ECO.reforma.slice(k).filter(e => REFORMA_LUGAR[e.id]).map(e => ({ tipo: 'camada', y: REFORMA_LUGAR[e.id].ordem, desenha(ctx) {
    const img = spr(REFORMA_LUGAR[e.id].camada); if (img) ctx.drawImage(img, 0, 0, PALCO.LARG, PALCO.ALT);
  } }));
}
// As sujeiras que faltam (só na etapa de limpar), com a posição no palco (px de mundo, o pé no chão da frente).
function sujeirasDaReforma() {
  const p = G.pensao; if (!p || p.estado !== 'limpar') return [];
  const limpos = p.limpos || [];
  return SUJEIRA_PALCO.map(([arte, x], k) => ({ k, arte, x, y: PALCO.CHAO_Y + 30 })).filter(s => !limpos.includes(s.k));
}
function limparSujeira(k) {
  const p = G.pensao; if (!p || p.estado !== 'limpar' || (p.limpos || []).includes(k)) return;
  if (G.energia < CUSTO_SUJEIRA) { avisar('O Jocelino está esgotado. Coma alguma coisa ou vá dormir.'); return; }
  G.energia = Math.max(0, G.energia - CUSTO_SUJEIRA); (p.limpos = p.limpos || []).push(k);
  sons.tocar(SUJEIRA_PALCO[k][0].includes('mato') ? 'foice' : 'pedra', 1, 0.08, -6); hudSujo();
  if (!sujeirasDaReforma().length) {
    p.limpou(); atualizarPensaoMundo(); sons.tocar('feito', 1, 0.03, 0);
    const E = etapaReforma(p.estado);
    abrirPlaca(`Salão limpo! Agora ${minuscula(E.nome)}: traga ${Object.entries(E.material).map(([i, q]) => Itens.qtd(q, i)).join(', ')} (o Seu Ananias vende no depósito), entregue à Rosa e trabalhe ${E.dias} dia(s) no buraco do telhado.`);
  }
}
// As sujeiras desenhadas no chão da frente (a arte já pronta, só posicionada e na escala do palco).
MAPAS_DEF.pensao_palco = (orig => () => {
  const b = orig(), e0 = b.extras;
  b.extras = () => [...(e0 ? e0() : []), ...camadasDaReforma(), ...sujeirasDaReforma().map(s => ({ tipo: 'camada', y: s.y, desenha(ctx) {
    const img = spr(s.arte); if (!img) return;
    const w = img.naturalWidth * SUJEIRA_ESCALA, h = img.naturalHeight * SUJEIRA_ESCALA;
    ctx.drawImage(img, s.x - w / 2, s.y - h, w, h);
  } }))];
  return b;
})(MAPAS_DEF.pensao_palco);
// O clique: a sujeira (o Jocelino vai até ela), o lugar da etapa (trabalhar) e a Rosa (entrega o material), só na reforma.
{ const a0 = palcoAlvoEm; palcoAlvoEm = function (px, py) {
  if (emReforma()) {
    for (const s of sujeirasDaReforma()) if (Math.abs(px - s.x) < 50 && py > s.y - 110 && py < s.y + 25) return { tipo: 'sujeira', k: s.k, x: s.x };
    // (o lugar da cozinha encosta na Rosa: faltando material, o clique é dela; com o material todo, é do trabalho)
    const L = REFORMA_LUGAR[G.pensao.estado], R = PALCO.ROSA, falta = Object.keys(G.pensao.faltaMaterial()).length > 0;
    const naRosa = Math.abs(px - R.x) < 75 && py > R.y - 260 && py < R.y + 25, noLugar = naAreaReforma(L, px, py);
    if (noLugar && !(falta && naRosa)) return { tipo: 'reforma_lugar', x: clamp(L.pe, PALCO.X_MIN, PALCO.X_MAX) };
    if (naRosa) return { tipo: 'rosa_reforma', x: clamp(R.x - 60, PALCO.X_MIN, PALCO.X_MAX) };
  }
  return a0(px, py);
}; }
{ const g0 = palcoAgir; palcoAgir = function (a) {
  if (a && a.tipo === 'sujeira') return limparSujeira(a.k);
  if (a && a.tipo === 'reforma_lugar') return trabalharNaReforma();
  if (a && a.tipo === 'rosa_reforma') return pensaoPlaquinha();
  return g0.call(this, a);
}; }
// Quem estiver no cômodo antigo na reforma (um save de antes) vai para o salão de lado.
ATUALIZADORES.push(() => { if (G.mapaId === 'pensao_dentro' && emReforma()) entrarPalco(); });
