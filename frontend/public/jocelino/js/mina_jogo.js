// Jocelino — mina_jogo.js — a pedreira funda no mundo: a carta do Tonico abre a escada; cada bancada é um mapa sorteado
// (remontado a cada descida, fora do save de detritos); quebrar rocha às vezes revela a escada; o elevador da entrada
// leva às bancadas de 5 em 5; o escuro, a pedra solta e o ar ruim; os baús. As regras estão em mina.js.

CARTAS.tonico_bancadas = { de: 'Seu Tonico', dia: 7, aoLer: () => { G.mina.aberta = true; },
  texto: 'Jocelino, arrumei a escada da pedreira. Lá embaixo tem aço e, mais fundo, bronze. Cuidado com pedra solta, e leve luz: depois da bancada 10 é breu.' };
MAPAS_DEF.bancada = () => {
  const n = G.mina.bancada || 1, b = new Construtor('bancada', 22, 15, 1979 + n);
  b.fundo = 'texturas/chao_pedreira'; b.livre = { x: 2, y: 3, w: 18, h: 10 }; b.inicio = { x: 4, y: 4 };
  for (let x = 0; x <= b.larg; x += 2) { b.enfeite('objetos/rocha_mina_1', x, 1, false); b.enfeite('objetos/rocha_mina_1', x + 1, 2, false); b.enfeite('objetos/rocha_mina_1', x, b.alt - 2, false); }
  for (let y = 3; y < b.alt - 2; y++) { b.enfeite('objetos/rocha_mina_1', 1, y, false); b.enfeite('objetos/rocha_mina_1', b.larg - 2, y, false); }
  b.interativo('sobe_mina', 'objetos/escada_mina', 3, 3, 1, 1, [10, 6], false).acao = () => { subirDaMina(); return true; };
  if (Mina.bau(n)) b.interativo('bau_mina', 'objetos/bau', 11, 8, 1, 1, [16, 10]).acao = () => abrirBauMina(n);
  for (const r of Mina.gerar(n, G.dia)) b.detrito(r.tipo, r.x, r.y);
  b.paredesDaBorda();
  return b;
};
function entrarNaMina() {
  if (!G.mina.aberta) { abrirPlaca('Fechado até o Seu Tonico liberar as bancadas. ("Primeiro a gente arruma a escada", diz ele.)'); return true; }
  descerPara(1); return true;
}
function descerPara(n) {
  G.mina.bancada = n; delete MAPAS.bancada; Mina.chegou(n);
  entrarMapa('bancada', { x: 4, y: 4 }); sons.tocar('pedra', 0.8, 0.05, -6);
  avisar(`Bancada ${n}${n >= MINA.ESCURO ? ' — escuro' : ''}${n >= MINA.AR_RUIM ? ', ar pesado' : ''}.`);
}
function subirDaMina() { G.mina.bancada = 0; delete MAPAS.bancada; entrarMapa('pedreira', { x: 10, y: 9 }); }
function abrirElevador() {
  if (!G.mina.aberta) { abrirPlaca('O elevador de caçamba está parado. O Seu Tonico ainda não liberou as bancadas.'); return true; }
  const andares = []; for (let n = 5; n <= G.mina.elevador; n += 5) andares.push(n);
  if (!andares.length) { abrirPlaca('O elevador de caçamba para de 5 em 5 bancadas. Desça pela escada até a bancada 5 primeiro.'); return true; }
  perguntar('Elevador de caçamba: descer para qual bancada?', andares.map(n => 'Bancada ' + n).concat(['Ficar']), i => { if (i < andares.length) descerPara(andares[i]); });
  return true;
}
// Quebrar rocha na bancada: às vezes a escada aparece; a segunda unidade de minério; pedra de pigmento rara; pedra solta.
function quebrouNaMina(o) {
  if (G.mapaId !== 'bancada' || o.tipo !== 'detrito') return;
  const b = G.mapa, n = G.mina.bancada, t = o.tiles[0];
  if (['ferro', 'aco', 'bronze'].includes(o.det) && Math.random() < 0.5) soltar({ ferro: 'ferro_velho', aco: 'sucata_aco', bronze: 'bronze_velho' }[o.det], 1, o.x, o.y - 10);
  if (o.det === 'pigmento' && Math.random() < 0.1) soltar('pedra_pigmento', 1, o.x, o.y - 10);
  const restantes = b.objs.filter(x => x.tipo === 'detrito').length;
  if (n < MINA.FUNDO && !b.objs.some(x => x.id === 'desce_mina') && Math.random() < Mina.chanceEscada(restantes)) {
    const d = b.interativo('desce_mina', 'objetos/escada_mina', t.x, t.y, 1, 1, [10, 6], false); d.acao = () => { descerPara(n + 1); return true; };
    sons.tocar('fanfarra', 1.4, 0, -10); avisar('Achou a escada para a próxima bancada!');
  }
  if (typeof pedraSolta === 'function') pedraSolta();
}
function abrirBauMina(n) {
  const p = Mina.abrirBau(n); if (!p) return true;
  if (p.dinheiro) { G.dinheiro += p.dinheiro; G.ganhoHoje += p.dinheiro; }
  for (const id in p.itens || {}) { const s = G.mochila.adicionar(id, p.itens[id]); if (s) soltar(id, s, G.jog.x, G.jog.y); }
  const o = G.mapa.objs.find(x => x.id === 'bau_mina'); if (o) G.mapa.tirar(o);
  sons.tocar('fanfarra', 1, 0, -4); avisar(`O baú da bancada ${n}: ${[p.dinheiro ? 'Cr$ ' + p.dinheiro : '', ...Object.entries(p.itens || {}).map(([id, q]) => Itens.qtd(q, id))].filter(Boolean).join(', ')}!`); hudSujo();
  return true;
}
// O save nunca guarda uma bancada (ela muda de sorteio): volta para a entrada da pedreira.
COLETORES.push(s => { if (s.mapa === 'bancada') { s.mapa = 'pedreira'; s.tile = [10, 9]; } if (s.mapas) delete s.mapas.bancada; });
// ---------- os perigos leves: pedra solta, escuro (o lampião clareia) e ar ruim ----------
function pedraSolta() {
  if (G.mapaId !== 'bancada' || Math.random() >= MINA.PEDRA_SOLTA) return false;
  G.energia = Math.max(0, G.energia - 10); G.tremor = Math.max(G.tremor || 0, 0.35); lascas(G.jog.x, G.jog.y - 60, 'pedra');
  sons.tocar('pedra', 0.6, 0.05, -2); avisar('Caiu uma pedra solta do teto! (−10 de energia)'); hudSujo(); return true;
}
const fatorArMina = () => G.mapaId === 'bancada' ? Mina.fatorAr(G.mina.bancada) : 1;
function escuroDaMina() {
  if (G.mapaId !== 'bancada' || G.mina.bancada < MINA.ESCURO) return null;
  const luz = G.mochila.total('lampiao') > 0;
  return { alfa: luz ? 0.35 : 0.75, raio: (luz ? 6 : 2.5) * TILE };
}
// O escuro por cima do mundo (a mesma pintura de cor da noite), com um círculo de luz em volta do Jocelino.
DESENHOS_TELA.push(ctx => {
  const e = escuroDaMina(); if (!e || !G.jog) return;
  const x = (G.jog.x - G.cam.x) * G.zoom, y = (G.jog.y - 40 - G.cam.y) * G.zoom, r = e.raio * G.zoom;
  const g = ctx.createRadialGradient(x, y, r * 0.6, x, y, r);
  g.addColorStop(0, 'rgba(10,8,20,0)'); g.addColorStop(1, `rgba(10,8,20,${e.alfa})`);
  ctx.save(); ctx.fillStyle = g; ctx.fillRect(0, 0, G.larg, G.alt); ctx.restore();
});
let _avisouAr = -1;
ATUALIZADORES.push(() => { if (G.mapaId === 'bancada' && G.mina.bancada >= MINA.AR_RUIM && _avisouAr !== G.mina.bancada) { _avisouAr = G.mina.bancada; avisar('O ar aqui embaixo é pesado: cada golpe cansa mais.'); } });
// ---------- a forja do quintal ----------
function usarForja(o) {
  const chave = o.cx + ',' + o.cy, f = G.mina.forjas[chave];
  if (f) { const r = Mina.tirarBarra(chave, G.mochila);
    if (r === 'trabalhando') abrirPlaca(`A forja está fundindo: ${Itens.nome(f.barra).toLowerCase()} em ${Math.max(1, f.pronta - Mina.agora())} min.`);
    else if (r === 'cheia') avisar('A mochila está cheia.'); else if (r) { avisar('+ ' + Itens.qtd(1, r)); sons.tocar('pegar', 1, 0.05, -4); hudSujo(); }
    return true; }
  const r = Mina.forjar(chave, itemDaMao(), G.mochila);
  if (r === 'ok') { sons.tocar('golpe', 0.8, 0.05, -6); avisar('A forja acendeu: em 30 minutos sai a barra.'); hudSujo(); }
  else abrirPlaca(r === 'falta' ? 'A forja pede 5 sucatas iguais na mão e 1 madeira na mochila.' : 'A forja do quintal: com ferro velho, sucata de aço ou bronze velho na mão (5) e 1 madeira, faz uma barra.');
  return true;
}
// A forja acesa solta fumaça pela chaminé (a mesma fumaça das chaminés da Vila, mapas.js); apagada, nada.
EXTRAS_MUNDO.push(m => m.id !== 'quintal' || !G.mina ? [] : m.objs.filter(o => o.item === 'forja' && G.mina.forjas[o.cx + ',' + o.cy]).map(o => ({ y: o.y + 1, desenha(ctx) {
  const img = spr('objetos/forja'); if (!img) return;
  const bx = o.x - img.naturalWidth / 2 + 32, by = o.y - img.naturalHeight + 9;
  for (const p of fumacaEm(G.agora || 0)) { const n = p.r < 10 ? 1 : p.r < 15 ? 2 : 3; desenhaFx(ctx, 'fumaca_' + n, bx + p.x, by + p.y, { alfa: p.alfa, escala: p.r / [0, 8, 13, 19][n] * 0.9 }); }
} })));
function usarBetoneira(o) {
  const chave = o.cx + ',' + o.cy, b = G.mina.betoneiras[chave];
  if (b) { const r = Mina.tirarProduto(chave, G.mochila);
    if (r === 'trabalhando') abrirPlaca(`A betoneira está fazendo ${Itens.nome(b.produto).toLowerCase()}: fica pronto ${b.pronta - G.dia <= 1 ? 'amanhã' : `em ${b.pronta - G.dia} dias`}.`);
    else if (r === 'cheia') avisar('A mochila está cheia.'); else if (r) { avisar('+ ' + Itens.qtd(1, r)); sons.tocar('pegar', 1, 0.05, -4); hudSujo(); }
    return true; }
  if (itemDaMao() !== 'cimento') { abrirPlaca('A betoneira: com cimento na mão faz bloco; com pigmento na mochila, lajota colorida; com 2 cimentos e vergalhão, manilha.'); return true; }
  const r = Mina.betonar(chave, G.mochila);
  if (r === 'falta') avisar('Falta cimento.'); else if (r !== 'ocupada') { sons.tocar('terra', 0.7, 0.05, -4); avisar(`A betoneira começou: ${Itens.nome(r.produto).toLowerCase()} em ${r.dias} dia(s).`); hudSujo(); }
  return true;
}
// ---------- as marcas no chão (as minhocas do Stardew): 2 por dia pelos mapas; a pá cava um objeto antigo ----------
const MAPAS_MARCA = ['vila', 'praia', 'mata', 'quintal'];
function sortearMarcas() {
  const f = mulberry(G.dia * 433 + 9), pos = {};
  for (let k = 0, n = 0; k < 200 && n < 2; k++) {
    const id = MAPAS_MARCA[Math.floor(f() * MAPAS_MARCA.length)], b = getMapa(id), x = b.livre.x + Math.floor(f() * b.livre.w), y = b.livre.y + Math.floor(f() * b.livre.h);
    if (b.ocupado.has(chaveT(x, y)) || b.saidaEm(x, y) || b.ehAgua(x, y) || ![CH.GRAMA, CH.TERRA].includes(b.chaoEm(x, y)) || (b.trancadas || []).some(r => dentroR(r, x, y))) continue;
    if (id === 'quintal' && typeof Horta !== 'undefined' && Horta.cova(x, y)) continue;
    (pos[id] = pos[id] || []).push([x, y]); n++;
  }
  G.mina.marcas = { dia: G.dia, pos, cavadas: [] };
}
function poeMarcas(b) {
  if (!G.mina || !MAPAS_MARCA.includes(b.id)) return;
  for (const o of b.objs.filter(o => o.id === 'marca_chao')) b.tirar(o);
  if (G.mina.marcas.dia !== G.dia) return;
  for (const [x, y] of G.mina.marcas.pos[b.id] || []) {
    if (G.mina.marcas.cavadas.includes(`${b.id}:${x},${y}`) || b.ocupado.has(chaveT(x, y))) continue;
    const o = b.interativo('marca_chao', 'objetos/marca_chao', x, y, 1, 1, null, false); o.mx = x; o.my = y;
    o.acao = () => { abrirPlaca('Uma marca de terra remexida no chão. Cave com a pá!'); return true; };
    o.ferramenta = (p, id) => { if (id !== 'pa') return; const achado = Mina.cavarMarca(); G.mina.marcas.cavadas.push(`${b.id}:${x},${y}`); b.tirar(p); soltar(achado, 1, p.x, p.y - 10); sons.tocar('terra', 1, 0.05, -4); avisar(`Achou ${Itens.qtd(1, achado)}! (O Museu da Vila gosta.)`); };
  }
}
MANHA.push(() => { if (G.mina) { sortearMarcas(); for (const id in MAPAS) poeMarcas(MAPAS[id]); } });
AO_MONTAR.push(b => poeMarcas(b));
// ---------- a tela do museu ----------
function abrirMuseu() {
  const caixa = el('div', { class: 'painel orelhao' });
  const desenha = () => {
    caixa.innerHTML = '';
    const doados = G.mina.museu.doados, prox = MUSEU.MARCOS.find(([k]) => k > doados.length);
    caixa.append(el('div', { class: 'titulo', style: 'font-size:26px;display:flex;align-items:center;gap:10px' }, el('img', { src: urlArte('objetos/vitrine_museu'), style: 'height:42px' }), 'Museu da Vila'),
      el('div', { class: 'rodape', style: 'text-align:left' }, `${doados.length} de 14 peças.` + (prox ? ` Com ${prox[0]}, um prêmio.` : ' O museu está completo!')));
    const grade = el('div', { class: 'orel-grade' });
    for (const id of MUSEU.ANTIGOS.concat(MUSEU.RAROS)) {
      const tem = doados.includes(id), pode = !tem && G.mochila.total(id) > 0;
      grade.append(el('div', { class: 'orel-item' + (tem || pode ? '' : ' trancado') }, el('img', { src: urlItem(id), style: tem || pode ? '' : 'filter:brightness(0);opacity:.35' }),
        el('div', {}, el('b', {}, tem || pode ? Itens.nome(id) : '???'), el('div', { class: 'orel-preco' }, tem ? (MUSEU.DESCRICAO[id] || Itens.descricao(id)) : pode ? 'Na sua mochila!' : 'Ainda não achado.')),
        pode ? el('button', { class: 'botao', onclick: e => { e.stopPropagation(); const n0 = G.mina.museu.marcos.length; Mina.doar(id, G.mochila); sons.tocar('carimbo', 1, 0.05, -4);
          if (G.mina.museu.marcos.length > n0) { sons.tocar('fanfarra', 1, 0, -4); const p = G.mina.museu.ultimoPremio; avisar('Prêmio do museu: ' + [p.dinheiro ? 'Cr$ ' + p.dinheiro : '', ...Object.entries(p.itens || {}).map(([i, q]) => Itens.qtd(q, i)), p.titulo || ''].filter(Boolean).join(', ')); }
          hudSujo(); desenha(); } }, 'Doar') : null));
    }
    caixa.append(grade, el('div', { style: 'text-align:right;margin-top:10px' }, el('button', { class: 'botao forte', onclick: e => { e.stopPropagation(); fecharModal(); } }, 'Fechar')));
  };
  desenha(); abrirModal(caixa); sons.tocar('abrir', 1, 0.03, -6); return true;
}
// As encomendas de material: uma nova toda manhã no quadro de Serviços (as vencidas saem).
MANHA.push(() => { if (G.mina) Mina.novaEncomenda(G.dia); });
