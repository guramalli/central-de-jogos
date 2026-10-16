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
// A cozinha está montada: fora da reforma, ou com a etapa 'cozinha' já concluída (a etapa atual vem DEPOIS dela: a pintura).
// Antes disso a Rosa não cozinha (fica parada no salão, ver ROSA_OBRA no palco.js).
function cozinhaPronta() {
  if (!emReforma()) return true;
  return ECO.reforma.findIndex(e => e.id === G.pensao.estado) > ECO.reforma.findIndex(e => e.id === 'cozinha');
}
// O lugar do trabalho de cada etapa no palco (px de mundo, 1920×1080): a área do clique (o retângulo que o artista mediu na
// camada), o pé (o x onde o Jocelino para, no chão y 900), o ponto da seta (no meio da arte), a camada do "antes" (some
// quando a etapa acaba) e a altura de desenho dela (ordem): o telhado e a cozinha por cima da cozinha pronta e por baixo da
// Rosa (301); o balcão por cima do balcão, do passe e do bebedouro e por baixo do Jocelino (900); a parede logo depois do fundo.
const REFORMA_LUGAR = {
  telhado: { area: { x0: 570, y0: 0, x1: 1000, y1: 215 }, pe: 780, seta: { x: 785, y: 200 }, camada: 'salao/reforma_telhado_buraco', ordem: 300.6,
    camadaDia: 'salao/reforma_telhado_buraco_dia' },   // (14/10: de dia, o céu azul pelo buraco, não a lua)
  balcao: { area: { x0: 360, y0: 757, x1: 1275, y1: 907 }, pe: 780, seta: { x: 780, y: 800 }, camada: 'salao/reforma_balcao_quebrado', ordem: 890 },   // (revisão final: o clique começa em 360, onde a porta acaba)
  cozinha: { area: { x0: 1300, y0: 545, x1: 1740, y1: 766 }, pe: 1500, seta: { x: 1520, y: 650 }, camada: 'salao/reforma_cozinha_vazia', ordem: 300.5 },
  pintura: { area: { x0: 0, y0: 304, x1: 1920, y1: 631 }, pe: 960, seta: { x: 960, y: 460 }, camada: 'salao/reforma_parede_descascada', ordem: 1,
    camadaDia: 'salao/reforma_parede_descascada_dia' },   // (14/10: a parede traz a janela; de dia, a com o sol, como o fundo)
};
// Uma camada com a versão de dia e a de noite, na mesma mistura do fundo do palco (cenarioNoiteAlfa, mapas.js): a de dia embaixo e
// a de noite por cima com a escuridão; na janta, só a de noite; sem a de dia carregada (ou sem versão de dia), só a de noite.
function desenhaDiaNoite(ctx, dia, noite, x, y, w, h) {
  const a = cenarioNoiteAlfa(G.mapa), d = dia && a < 1 ? spr(dia) : null, n = spr(noite);
  if (d) ctx.drawImage(d, x, y, w, h);
  if (n && (a > 0 || !d)) { ctx.save(); ctx.globalAlpha = d ? a : 1; ctx.drawImage(n, x, y, w, h); ctx.restore(); }
}
const naAreaReforma = (L, px, py) => !!L && px >= L.area.x0 && px <= L.area.x1 && py >= L.area.y0 && py <= L.area.y1;
// As caixas do clique da sujeira e da Rosa (px de mundo): o clique e o realce usam a mesma.
const caixaDaSujeira = s => ({ x0: s.x - 50, x1: s.x + 50, y0: s.y - 110, y1: s.y + 25 });
function caixaDaRosa() { const R = rosaLugar(), alto = R === PALCO.ROSA ? 260 : 190; return { x0: R.x - 75, x1: R.x + 75, y0: R.y - alto, y1: R.y + 25 }; }
const naCaixa = (c, px, py) => px > c.x0 && px < c.x1 && py > c.y0 && py < c.y1;
const minuscula = s => s[0].toLowerCase() + s.slice(1);
const GOLPES_DIA = 3;   // o "3 golpes por dia": o terceiro clique no lugar conta o dia de trabalho
const etapaReforma = id => ECO.reforma.find(e => e.id === id);
// Um golpe no lugar da etapa (o Jocelino já andou até lá): com o material todo e uma vez por dia; o 3º golpe é o dia de trabalho.
function trabalharNaReforma() {
  const p = G.pensao, L = REFORMA_LUGAR[p.estado]; if (!L) return;
  const falta = p.faltaMaterial();
  if (Object.keys(falta).length) { avisar(`Falta material: ${Object.entries(falta).map(([i, q]) => Itens.qtd(q, i)).join(', ')} (entregue à Rosa).`); return; }
  // (C1, 16/10) um dia de trabalho por dia em cada etapa: acabada uma, a seguinte pode começar na hora, com o material na mão
  if (p.reforma.hoje === G.dia) { avisar('Por hoje chega nessa parte: amanhã tem mais.'); return; }
  if (G.energia < CUSTO_SUJEIRA * 2) { avisar('O Jocelino está esgotado. Coma alguma coisa ou vá dormir.'); return; }
  G.energia -= CUSTO_SUJEIRA * 2; p._golpes = (p._golpes || 0) + 1; sons.tocar('golpe', 1, 0.1, -6); hudSujo();
  if (p._golpes < GOLPES_DIA) { avisar(`${etapaReforma(p.estado).nome}: ${p._golpes}/${GOLPES_DIA} hoje (se parar, amanhã recomeça do zero).`); return; }
  p._golpes = 0; const antes = p.estado, r = p.trabalharReforma(G.dia, G.minutos); atualizarPensaoMundo();
  if (r === 'ok') {
    if (G.limpou) G.limpou['reforma_' + antes] = (G.limpou['reforma_' + antes] || 0) + 1;   // (a seta da primeira vez some)
    if (typeof _setaT !== 'undefined') _setaT = -1;   // (a seta do mundo é recalculada já: com a cena e a fala, o relógio para e ela ficava a de antes)
    sons.tocar('feito', 1, 0.03, -4);
    const prox = etapaReforma(p.estado), falta = Object.entries(p.faltaMaterial());
    if (p.estado === antes) avisar('Mais um dia de trabalho na reforma.');
    else if (prox) avisar(`${etapaReforma(antes).nome}: pronto! Agora: ${minuscula(prox.nome)}${falta.length ? ` (traga ${falta.map(([i, q]) => Itens.qtd(q, i)).join(', ')} à Rosa)` : ''}.`);
    else {   // a pintura: a pensão pronta (abre amanhã ou depois) ou já aberta (a inauguração é hoje)
      const q = quandoAbreAPensao();
      avisar(`${etapaReforma(antes).nome}: pronto! ${q === 'hoje' ? 'A inauguração é hoje, às 17h!' : `A Pensão da Rosa abre ${q}!`}`);
      G.feitosHoje.push(q === 'hoje' ? 'A reforma acabou e a pensão inaugurou no mesmo dia!' : `A reforma acabou: a pensão abre ${q}!`);
      // (14/10, pedido do jogador) a última pincelada no letreiro e a Rosa vendo o sonho começar: a cena de cinema; (C1) logo
      // depois, a Rosa diz quando é a inauguração, com a seta no relógio
      if (typeof CenaPrato !== 'undefined' && CenaPrato.tocarEspecial) CenaPrato.tocarEspecial('letreiro', falaDaInauguracao); else falaDaInauguracao();
    }
  }
}
// (C1) Quando a pensão abre, em palavras: 'hoje', 'amanhã' ou o dia da semana (a pintura no sábado depois das 15h: segunda).
function quandoAbreAPensao() {
  const p = G.pensao, d = p.abreDia;
  return p.estado === 'aberta' || d <= G.dia ? 'hoje' : d === G.dia + 1 ? 'amanhã' : `na ${DIAS[(d - 1) % 7]}`;
}
// (C1, 16/10) A fala da Rosa logo depois da cena da fachada (o relatório B, dia 8: depois da cena nenhuma frase dizia quando a pensão
// abria, e a Semana prometia a inauguração para hoje). Com a seta no relógio (setaDaInauguracao): a hora é o que importa. Com o
// guia, a Rosa já diz aqui o que a apresentação da primeira janta diria (e ela não repete depois).
const FALA_INAUGURACAO = {
  hoje: 'Pronto, Jocelino! Hoje às 17h é a inauguração: a Vila inteira vem. Até lá, traz o que puder pra despensa.',
  amanha: 'Pronto! Amanhã às 17h a gente inaugura. Hoje eu arrumo a cozinha com calma.',
  outro: dia => `Pronto! ${dia[0].toUpperCase() + dia.slice(1)} às 17h a gente inaugura: domingo a família descansa. Até lá eu arrumo a cozinha com calma.`,
};
function falaDaInauguracao() {
  const p = G.pensao; if (!p || !['pronta', 'aberta'].includes(p.estado)) return;
  const q = quandoAbreAPensao(), paginas = ['@emocionada ' + (q === 'hoje' ? FALA_INAUGURACAO.hoje : q === 'amanhã' ? FALA_INAUGURACAO.amanha : FALA_INAUGURACAO.outro(q.replace(/^na /, '')))];
  if (q === 'hoje' && G.guia && G.guia.ativo && typeof Guia !== 'undefined') {
    Guia.tique(false);   // (o passo da primeira janta abre agora, e a apresentação dele sai da fila: a Rosa fala tudo aqui)
    const m = Guia.missao('janta'), intro = m && m.intro, k = intro ? Guia.fila.indexOf(intro) : -1;
    if (k >= 0) { Guia.fila.splice(k, 1); paginas.push('@alegre ' + intro[2][intro[2].length - 1]); }
  }
  abrirConversa('Rosa', urlArte('retratos/rosa_alegre'), paginas);
  const c = document.querySelector('#modal .placa'); if (c) c.classList.add('fala-inauguracao');
}
// A seta no relógio enquanto a Rosa fala da inauguração (guia_setas.js, guiaSetaUI): o relógio fica no canto de cima, e a seta
// vem do lado, apontando para ele.
function setaDaInauguracao() {
  if (typeof HUD === 'undefined' || !HUD.relogio || !document.querySelector('#modal .fala-inauguracao')) return null;
  return { chave: 'inauguracao', el: HUD.relogio, rotulo: quandoAbreAPensao() === 'hoje' ? 'A inauguração: hoje, às 17h' : `A inauguração: ${quandoAbreAPensao()}, às 17h`, lado: 'esquerda' };
}
// As camadas do "antes" das etapas que ainda não acabaram (a atual e as seguintes), cada uma no salão inteiro (1920×1080).
function camadasDaReforma() {
  const p = G.pensao; if (!p) return [];
  const k = ECO.reforma.findIndex(e => e.id === p.estado); if (k < 0) return [];
  return ECO.reforma.slice(k).filter(e => REFORMA_LUGAR[e.id]).map(e => ({ tipo: 'camada', y: REFORMA_LUGAR[e.id].ordem, desenha(ctx) {
    const L = REFORMA_LUGAR[e.id]; desenhaDiaNoite(ctx, L.camadaDia, L.camada, 0, 0, PALCO.LARG, PALCO.ALT);
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
// O realce de onde clicar agora (pedido do jogador, 14/10: "onde pede para clicar precisa ter aquele sombreado que foi colocado
// igual na ponte da mata"). É a mesma luz pulsante dos serviços (desenhaLuzDoServico, empreitas_jogo.js), sempre, com ou sem o
// guia — como o Centro Comunitário do Stardew e o restaurante em obra do Dave, o jogador sempre sabe onde mexer:
// - limpar: cada sujeira que falta;
// - faltando material: a Rosa (é ela quem recebe);
// - com o material todo: a área do clique da etapa (REFORMA_LUGAR.area);
// - o trabalho de hoje feito: nada, e a frase "Amanhã continua" no lugar.
// Devolve { onde: 'sujeira' | 'rosa' | 'lugar' | 'amanha', rets: [{ x, y, w, h, ordem }] } (px de mundo), ou null fora da reforma.
const _ret = (c, ordem) => ({ x: c.x0, y: c.y0, w: c.x1 - c.x0, h: c.y1 - c.y0, ordem });
function realceDaReforma() {
  if (!emReforma()) return null;
  const p = G.pensao;
  if (p.estado === 'limpar') return { onde: 'sujeira', rets: sujeirasDaReforma().map(s => _ret(caixaDaSujeira(s), s.y + 0.01)) };
  const L = REFORMA_LUGAR[p.estado]; if (!L) return null;
  if (Object.keys(p.faltaMaterial()).length) { const R = rosaLugar(); return { onde: 'rosa', rets: [_ret(caixaDaRosa(), R === PALCO.ROSA ? 301.5 : R.y + 1)] }; }
  if (p.reforma.hoje === G.dia) return { onde: 'amanha', rets: [] };
  // (logo por cima da camada do "antes": quem passa na frente cobre a luz; a parede, atrás de tudo, por cima do balcão — senão as
  // prateleiras e a cozinha escondiam a luz inteira)
  return { onde: 'lugar', rets: [_ret(L.area, p.estado === 'pintura' ? 895 : L.ordem + 0.01)] };
}
function camadasDoRealce() {
  const r = realceDaReforma(); if (!r) return [];
  const c = r.rets.map(q => ({ tipo: 'camada', y: q.ordem, desenha(ctx) { desenhaLuzDoServico(ctx, q.x, q.y, q.w, q.h, 1 / (G.zoom || 1), true); } }));
  const L = REFORMA_LUGAR[G.pensao.estado];
  if (r.onde === 'amanha' && L) c.push({ tipo: 'camada', y: 5000, desenha(ctx) { ctx.save(); texto(ctx, 'Amanhã continua', L.seta.x, L.seta.y, Math.round(17 / (G.zoom || 1)), '#fff4cf', '900'); ctx.restore(); } });
  return c;
}
// As sujeiras desenhadas no chão da frente (a arte já pronta, só posicionada e na escala do palco).
MAPAS_DEF.pensao_palco = (orig => () => {
  const b = orig(), e0 = b.extras;
  b.extras = () => [...(e0 ? e0() : []), ...camadasDaReforma(), ...camadasDoRealce(), ...sujeirasDaReforma().map(s => ({ tipo: 'camada', y: s.y, desenha(ctx) {
    const img = spr(s.arte); if (!img) return;
    const w = img.naturalWidth * SUJEIRA_ESCALA, h = img.naturalHeight * SUJEIRA_ESCALA;
    ctx.drawImage(img, s.x - w / 2, s.y - h, w, h);
  } }))];
  return b;
})(MAPAS_DEF.pensao_palco);
// O clique: a sujeira (o Jocelino vai até ela), o lugar da etapa (trabalhar) e a Rosa (entrega o material), só na reforma.
{ const a0 = palcoAlvoEm; palcoAlvoEm = function (px, py) {
  if (emReforma()) {
    for (const s of sujeirasDaReforma()) if (naCaixa(caixaDaSujeira(s), px, py)) return { tipo: 'sujeira', k: s.k, x: s.x };
    // (o lugar da cozinha encosta na Rosa: faltando material, o clique é dela; com o material todo, é do trabalho)
    const L = REFORMA_LUGAR[G.pensao.estado], R = rosaLugar(), falta = Object.keys(G.pensao.faltaMaterial()).length > 0;
    const naRosa = naCaixa(caixaDaRosa(), px, py), noLugar = naAreaReforma(L, px, py);
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
// (C5, 16/10; o teste crítico B, dia 7: perto do lugar da cozinha "nada acontecia", e a tecla X dizia "Chegue perto de um cliente,
// do passe, da farinheira..." — coisas da janta, com o salão em obra) A tecla de ação na reforma: a sujeira, o lugar da etapa (com o
// material todo) ou a Rosa (faltando material) mais perto, até 110 px; longe de tudo, o mesmo "Chegue mais perto." da horta, com o
// lugar que a luz do salão mostra. O clique continua como sempre: o Jocelino anda até lá e faz.
{ const x0 = palcoAgirNaFrente; palcoAgirNaFrente = function () {
  if (!emReforma() || G.turno) return x0.apply(this, arguments);
  const p = G.pensao, L = REFORMA_LUGAR[p.estado], R = rosaLugar(), falta = Object.keys(p.faltaMaterial()).length > 0, c = [];
  for (const s of sujeirasDaReforma()) c.push({ tipo: 'sujeira', k: s.k, x: s.x });
  if (L && !falta) c.push({ tipo: 'reforma_lugar', x: clamp(L.pe, PALCO.X_MIN, PALCO.X_MAX) });
  if (falta) c.push({ tipo: 'rosa_reforma', x: clamp(R.x - 60, PALCO.X_MIN, PALCO.X_MAX) });
  const a = c.filter(q => Math.abs(q.x - G.jog.x) < 110).sort((q, w) => Math.abs(q.x - G.jog.x) - Math.abs(w.x - G.jog.x))[0];
  if (a) return palcoAgir(a);
  const r = realceDaReforma(), onde = r && { sujeira: 'A sujeira do salão está com a luz em volta.', rosa: 'A Rosa recebe o material.', lugar: `O lugar da obra (${minuscula(etapaReforma(p.estado).nome)}) está com a luz em volta.` }[r.onde];
  if (r && r.onde === 'amanha') avisar('Por hoje chega nessa parte: amanhã tem mais.'); else avisarChegueMaisPerto(onde || '');
}; }
// Quem estiver no cômodo antigo na reforma (um save de antes) vai para o salão de lado.
ATUALIZADORES.push(() => { if (G.mapaId === 'pensao_dentro' && emReforma()) entrarPalco(); });
