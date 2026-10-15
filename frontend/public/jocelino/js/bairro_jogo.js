// Jocelino — bairro_jogo.js — o Bairro Novo no mundo: a carta do loteamento (depois da promoção a pedreiro), o mapa com a
// rua em L e os 14 terrenos, a casa desenhada pela fase (arte pronta), a placa de cada terreno, os donos esperando.

CARTAS.prefeitura_bairro = { de: 'Prefeitura da Vila Maré', dia: 1e9, aoLer: () => { G.bairro.aberto = true; if (G.bairro.chegados < 2) G.bairro.chegados = 2; },
  texto: 'Sr. Jocelino, o loteamento Bairro Novo foi aprovado! A rua nova sai do canto leste da Vila. Já tem gente comprando terreno e procurando pedreiro de confiança: a Dona Nena e o Tonhão. Os pedidos ficam no quadro de Serviços.' };
// A carta chega na manhã seguinte à promoção a pedreiro (e a um save antigo de quem já é).
MANHA.push(() => { if (G.bairro && !G.bairro.aberto && G.obra && G.obra.funcao >= 2 && !G.correio.caixa.includes('prefeitura_bairro') && !G.correio.lidas.includes('prefeitura_bairro')) G.correio.caixa.push('prefeitura_bairro'); });

MAPAS_DEF.bairro = () => {
  const b = new Construtor('bairro', BAIRRO.LARG, BAIRRO.ALT, 1978);
  b.livre = { x: 1, y: 1, w: BAIRRO.LARG - 2, h: BAIRRO.ALT - 2 }; b.inicio = { x: 2, y: 10 };
  // A rua em L (linhas 9–10 e coluna 48–49) ainda é só mato baixo: a Prefeitura abre a rua de terra e depois as calçadas.
  const naRua = (x, y) => RUAS_BAIRRO.linhas.some(l => y >= l - 1 && y <= l + 2 && x <= 50) || (x >= 47 && x <= 50 && y >= 8 && y <= 33);
  b.saida(1, 9, 1, 2, 'vila', 44, 14);
  for (let x = 0; x < b.larg; x += 2) { b.enfeite('objetos/arvore_mata', x, 0, false); b.enfeite('objetos/arvore_mata', x, b.alt - 1, false); }
  for (let y = 2; y < b.alt - 1; y += 2) { if (y < 8 || y > 11) b.enfeite('objetos/arvore_mata', 0, y, false); b.enfeite('objetos/arvore_mata', b.larg - 1, y, false); }
  // O loteamento ainda no mato: mato e pedra espalhados (fora da rua; nos terrenos, somem quando o dono chega).
  const f = mulberry(1978);
  for (let k = 0; k < 140; k++) { const x = 1 + Math.floor(f() * (b.larg - 2)), y = 1 + Math.floor(f() * (b.alt - 2)), r = f(); if (b.chaoEm(x, y) !== CH.GRAMA || b.saidaEm(x, y) || naRua(x, y)) continue; b.detrito(r < 0.75 ? 'mato' : 'pedra', x, y); }
  b.paredesDaBorda();
  b.aoMontar = () => poeBairro(b);
  return b;
};
// A arte da casa pela fase (1 fundação, 2 paredes, 3 telhado, 4+ pronta); '' antes da fundação.
// A folha de desenho de quem tem id de cliente diferente do personagem.
const FOLHA_DE = { cida: 'dona_cida' };
function arteDaCasa(t) {
  const x = G.bairro.terrenos[t], d = DONOS.find(o => o.terreno === t); if (!x || !d || x.fase < 1) return '';
  return TIPOS_CASA[d.casa].arte + Math.min(4, x.fase);
}
// Redesenha os terrenos: estacas e placa; a casa da fase; (Task 4) a varanda, o muro, a calçada; os donos.
function poeBairro(b) {
  if (!b || b.id !== 'bairro' || !G.bairro) return;
  aplicarRuas(b);
  for (const o of b.objs.filter(o => o.doBairro)) b.tirar(o);
  for (const t in TERRENOS) {
    const T = TERRENOS[t], w = T.tipo === 'casa' ? 5 : 6, dono = T.tipo === 'casa' ? Bairro.donoDe(t) : null;
    // Com dono (ou obra), o terreno fica limpo.
    if (dono) for (let y = T.y; y < T.y + 6; y++) for (let x = T.x; x < T.x + w; x++) { const o = b.ocupado.get(chaveT(x, y)); if (o && o.tipo === 'detrito') b.tirar(o); }
    const marca = (o, extra) => Object.assign(o, { doBairro: true }, extra || {});
    if (T.tipo === 'casa') {
      const arte = arteDaCasa(t);
      if (arte) marca(b.interativo('casa_' + t, arte, T.x, T.y + 4, 5, 3, [78, 62]), { acao: () => { abrirPlaca(`A casa ${dono ? (dono.nome.startsWith('Dona') ? 'da ' : 'de ') + dono.nome : ''} no Bairro Novo.`); return true; } });
      else for (const [ex, ey] of [[T.x, T.y + 1], [T.x + 4, T.y + 1], [T.x, T.y + 4], [T.x + 4, T.y + 4]]) marca(b.enfeite('objetos/estaca_terreno', ex, ey, false));
      if (!arte) marca(b.interativo('placa_' + t, 'objetos/placa_terreno', T.x + 2, T.y + 3, 1, 1, [10, 6]), { acao: () => { abrirPlaca(dono ? `Terreno ${dono.nome.startsWith('Dona') ? 'da ' : 'de '}${dono.nome}.` : 'Terreno à venda.'); return true; } });
      const x = G.bairro.terrenos[t];
      // Varanda (fase 5): o piso na frente da porta (textura recortada); fase 6: a calçada na frente da porta e o muro do lado
      // direito (o muro nunca tampa a porta, que fica no meio da casa).
      const piso = (id, tx, ty, w2, tex) => { const o = marca(b.interativo(id, 'objetos/alicerce', tx, ty, w2, 1, null, false)); o.y = ty * TILE; o.desenha = ctx => desenhaPiso(ctx, tex, tx, ty, w2, 1); return o; };
      if (x.fase >= 5) piso('varanda_' + t, T.x, T.y + 5, 3, TIPOS_CASA[DONOS.find(d => d.terreno === t).casa].varanda.ladrilho ? 'texturas/piso_ladrilho' : 'texturas/piso_cimento');
      if (x.fase >= 6) marca(b.interativo('muro_' + t, 'objetos/muro', T.x + 3, T.y + 5, 3, 1));   // o muro no recuo, ao lado da varanda (nunca na frente da porta)
      if (x.mudou && Bairro.caprichada(t)) marca(b.interativo('placa_jocelino_' + t, 'objetos/placa_jocelino', T.x + 5, T.y + 4, 1, 1, null, false), { acao: () => { abrirPlaca('"Construída por Jocelino" — casa caprichada do começo ao fim.'); return true; } });
    }
    if (T.tipo === 'comercio') {
      const c = G.bairro.comercios[t], K = COMERCIOS[t];
      if (c.fase >= 1) { for (let y = T.y; y < T.y + 6; y++) for (let x2 = T.x; x2 < T.x + 6; x2++) { const o = b.ocupado.get(chaveT(x2, y)); if (o && o.tipo === 'detrito') b.tirar(o); }
        marca(b.interativo('predio_' + t, c.fase >= 4 ? K.arte : 'objetos/predio_obra_' + Math.min(3, c.fase), T.x, T.y + 4, 6, 3, [90, 62]), { acao: () => abrirComercio(t) }); }
      else marca(b.interativo('placa_' + t, 'objetos/placa_terreno', T.x + 2, T.y + 3, 1, 1, [10, 6]), { acao: () => { abrirPlaca(Bairro.casasProntas() >= K.libera ? `Terreno da ${K.nome}: o pedido está no quadro de Serviços.` : `Terreno reservado: a ${K.nome}. (Vem com ${K.libera} casa${K.libera > 1 ? 's' : ''} pronta${K.libera > 1 ? 's' : ''} no bairro.)`); return true; } });
      if (c.fase >= 5) { const o = marca(b.interativo('entrada_' + t, 'objetos/alicerce', T.x + 1, T.y + 5, 4, 1, null, false)); o.y = (T.y + 5) * TILE; o.desenha = ctx => { const img = spr('texturas/calcada'); if (img) ctx.drawImage(img, 0, 0, 4 * TILE, TILE, (T.x + 1) * TILE, (T.y + 5) * TILE, 4 * TILE, TILE); }; }
      // O dono no balcão (a frente do prédio) no horário.
      let m = b.moradores.find(p => p.id === 'balcao_' + t);
      if (Bairro.comercioPronto(t) && !m) { m = b.morador('balcao_' + t, CLIENTE_NOME[K.dono], T.x + 3, T.y + 5, DIR.BAIXO); m.pele = FOLHA_DE[K.dono] || K.dono; m.aoConversar = () => abrirComercio(t); }
    }
    if (T.tipo === 'publico') {
      const n = Bairro.publico(t), P = PUBLICOS[t];
      if (n >= 1) { for (let y = T.y; y < T.y + 6; y++) for (let x2 = T.x; x2 < T.x + 6; x2++) { const o = b.ocupado.get(chaveT(x2, y)); if (o && o.tipo === 'detrito') b.tirar(o); }
        marca(b.interativo('predio_' + t, n >= 2 ? P.arte : 'objetos/predio_obra_2', T.x, T.y + 4, 6, 3, [90, 62]), { acao: () => { abrirPlaca(n >= 2 ? `${P.nome} do Bairro Novo.` : `${P.nome}: falta o acabamento (pedido da Prefeitura).`); return true; } });
        if (t === 'praca' && n >= 2) for (const [bx, by] of [[T.x, T.y + 5], [T.x + 4, T.y + 5]]) marca(b.enfeite('objetos/banco_praca', bx, by, true, 20, 8)); }
      else for (const [ex, ey] of [[T.x, T.y + 1], [T.x + 5, T.y + 1], [T.x, T.y + 4], [T.x + 5, T.y + 4]]) marca(b.enfeite('objetos/estaca_terreno', ex, ey, false));
    }
  }
  // Os donos: esperam de pé na frente do terreno (8h–17h) até a mudança; depois moram (passeiam perto de casa de dia).
  for (const d of DONOS.slice(0, G.bairro.chegados)) {
    const T = TERRENOS[d.terreno], x = G.bairro.terrenos[d.terreno], id = 'dono_' + d.id;
    let m = b.moradores.find(p => p.id === id);
    if (!m) { m = b.morador(id, d.nome, T.x + 2, T.y + 6, DIR.BAIXO); m.pele = d.id; m.aoConversar = () => conversarDono(d); }
    m.mora = x.mudou; m.vagueia = x.mudou; m.area = x.mudou ? { x: T.x * TILE, y: (T.y + 6) * TILE + 30, w: 5 * TILE, h: TILE } : null;
  }
}
// De dia na rua; de noite em casa (some); o dono que ainda não se mudou só aparece das 8h às 17h.
ATUALIZADORES.push(() => {
  if (G.mapaId !== 'bairro' || !G.bairro) return;
  for (const m of G.mapa.moradores) if (m.id.startsWith('dono_')) m.visivel = m.mora ? G.minutos >= 6 * 60 && G.minutos < 21 * 60 : G.minutos >= 8 * 60 && G.minutos < 17 * 60;
});
function conversarDono(d) {
  const x = G.bairro.terrenos[d.terreno];
  const fala = x.mudou ? ['Casa nova, vida nova! Obrigado, Seu Jocelino. Passo na pensão da Rosa pra jantar qualquer dia.']
    : x.fase > 0 ? [`A casa está subindo! Já estamos na fase ${x.fase} de 6.`, 'O próximo serviço está no quadro de Serviços da Vila.']
    : ['Comprei este terreno com muito suor. Quero uma casa direita, Seu Jocelino.', 'O pedido da fundação está no quadro de Serviços da Vila.'];
  abrirConversa(d.nome, urlArte('retratos/' + d.id + '_normal'), fala); return true;
}
AO_ENTRAR_MAPA.push(id => { if (id === 'bairro') poeBairro(G.mapa); });
MANHA.push(() => { if (MAPAS.bairro) poeBairro(MAPAS.bairro); });

// As ruas entregues mudam o chão (texturas que já existem) e põem os postes (arte pronta; a luz é a de LUZES).
LUZES['objetos/poste'] = [[24, 22, 70]];
function aplicarRuas(b) {
  if (!b || b.id !== 'bairro') return;
  const n = Bairro.ruas(), R = RUAS_BAIRRO;
  if (n >= 1) {
    for (const l of R.linhas) { b.pinta(1, l - 1, 50, 1, CH.CALCADA); b.pinta(1, l + 2, 50, 1, CH.CALCADA); }
    b.pinta(R.coluna - 1, R.linhas[0] - 1, 1, R.linhas[2] + 3 - (R.linhas[0] - 1), CH.CALCADA); b.pinta(R.fim + 1, R.linhas[0] - 1, 1, R.linhas[2] + 3 - (R.linhas[0] - 1), CH.CALCADA);
    for (const l of R.linhas) b.pinta(1, l, R.fim, 2, CH.CAMINHO);
    b.pinta(R.coluna, R.linhas[0], 2, R.linhas[2] + 2 - R.linhas[0], CH.CAMINHO);
    // A rua e a calçada prontas ficam limpas (sem mato nem pedra em cima).
    for (let y = R.linhas[0] - 1; y <= R.linhas[2] + 2; y++) for (let x = 1; x <= R.fim + 1; x++) { const c = b.chaoEm(x, y); if (c !== CH.CAMINHO && c !== CH.CALCADA) continue; const o = b.ocupado.get(chaveT(x, y)); if (o && o.tipo === 'detrito') b.tirar(o); }
  }
  b.chaoCanvas = null;   // o chão é remontado com as texturas novas
  for (const o of b.objs.filter(o => o.id === 'poste' || o.id === 'muda')) b.tirar(o);
  // Mudas e postes na calçada de cima de cada rua, nos vãos entre os terrenos (nunca na frente de uma porta).
  const vaos = [10, 17, 24, 31, 40];
  if (n >= 2) for (const l of R.linhas) for (const x of vaos) { const o = b.interativo('muda', 'objetos/muda_arvore', x - 1, l + 2, 1, 1, null, false); o.acao = () => { abrirPlaca('Uma muda de árvore da Prefeitura. Daqui a uns anos vai dar sombra.'); return true; }; }
  if (n >= 3) for (const l of R.linhas) for (const x of vaos) { const o = b.interativo('poste', 'objetos/poste', x, l - 1, 1, 1, [8, 6]); o.acao = () => { abrirPlaca('Poste de luz do Bairro Novo.'); return true; }; }
}

// A lojinha (o modelo da carroça do mascate): o que o comércio vende, com o preço; fora do horário, a placa.
function abrirComercio(t) {
  const K = COMERCIOS[t], c = G.bairro.comercios[t];
  if (c.fase < 4) { abrirPlaca(`A ${K.nome}, em obra (fase ${c.fase} de 5).`); return true; }
  if (!Bairro.aberto(t)) { const dias = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo']; abrirPlaca(c.fase < 5 || G.dia < c.abreDia ? `A ${K.nome} abre assim que ficar pronta.` : `A ${K.nome} está fechada. Abre das ${K.abre / 60}h às ${K.fecha / 60}h (folga na ${dias[K.folga]}).`); return true; }
  const caixa = el('div', { class: 'painel orelhao' });
  const desenha = () => {
    caixa.innerHTML = '';
    caixa.append(el('div', { class: 'titulo', style: 'font-size:26px' }, K.nome), el('div', { class: 'rodape', style: 'text-align:left;margin-bottom:8px' }, `Aberta das ${K.abre / 60}h às ${K.fecha / 60}h.`));
    const grade = el('div', { class: 'orel-grade' });
    for (const id in K.vende) { const preco = K.vende[id];
      grade.append(el('div', { class: 'orel-item' }, el('img', { src: urlItem(id) }), el('div', {}, el('b', {}, Itens.nome(id)), el('div', { class: 'orel-preco' }, `Cr$ ${preco}`)),
        el('div', { class: 'orel-bts' }, el('button', { class: 'botao', onclick: e => { e.stopPropagation();
          if (G.dinheiro < preco) { avisar('Não dá: falta dinheiro.'); return; }
          if (!G.mochila.cabe(id)) { avisar('A mochila está cheia.'); return; }
          G.dinheiro -= preco; G.gastoHoje += preco; G.mochila.adicionar(id, 1); sons.tocar('moedas', 1, 0.05, -6); hudSujo(); desenha(); } }, '+1')))); }
    caixa.append(grade, el('div', { style: 'display:flex;justify-content:space-between;align-items:center;margin-top:10px' }, el('div', { style: 'font-weight:900' }, `Cr$ ${G.dinheiro}`), el('button', { class: 'botao forte', onclick: e => { e.stopPropagation(); fecharModal(); } }, 'Até mais!')));
  };
  desenha(); abrirModal(caixa); sons.tocar('abrir', 0.9, 0.03, -6); return true;
}
// O dono do comércio aparece no balcão só no horário; na sexta à noite os moradores ficam na frente do bar.
ATUALIZADORES.push(() => {
  if (G.mapaId !== 'bairro' || !G.bairro) return;
  for (const t in COMERCIOS) { const m = G.mapa.moradores.find(p => p.id === 'balcao_' + t); if (m) m.visivel = Bairro.aberto(t); }
  // (os moradores: ver ondeMorador, mais abaixo)
});

// Com a escola pronta: segunda a sexta, das 8h ao meio-dia, a Ritinha e o Zezinho estão na escola (somem do quintal e
// aparecem na frente da escola do bairro). A rega dos filhos (7h) fica antes.
const naEscola = () => Bairro.publico('escola') >= 2 && (G.dia - 1) % 7 <= 4 && G.minutos >= 8 * 60 && G.minutos < 12 * 60;
ATUALIZADORES.push(() => {
  if (!G.bairro || !G.mapa) return;
  if (G.mapaId === 'quintal') for (const m of G.mapa.moradores) if (m.id === 'zezinho' || m.id === 'ritinha') m.visivel = !naEscola();
  if (G.mapaId === 'bairro') {
    const T = TERRENOS.escola;
    for (const [id, nome, dx] of [['zezinho', 'Zezinho', 1], ['ritinha', 'Ritinha', 4]]) {
      let m = G.mapa.moradores.find(p => p.id === 'escola_' + id);
      if (!m && Bairro.publico('escola') >= 2) { m = G.mapa.morador('escola_' + id, nome, T.x + dx, T.y + 5, DIR.BAIXO); m.pele = id; m.aoConversar = () => { abrirConversa(nome, urlArte('retratos/' + id + '_normal'), ['Pai! A professora deixou a gente brincar no recreio!']); return true; }; }
      if (m) m.visivel = naEscola();
    }
  }
});
// O posto de saúde (a clínica do Harvey): desmaiar acorda no posto pagando Cr$ 30 (ou o que tiver), em vez de perder até Cr$ 100.
function desmaioNoPosto() { if (!G.bairro || Bairro.publico('posto') < 2) return null; const T = TERRENOS.posto; return { custo: 30, mapa: 'bairro', tile: { x: T.x + 3, y: T.y + 6 } }; }

// ---------- a capela: missa no domingo de manhã (8h–10h); os moradores vão; estar na frente da capela dá +10 de amizade ----------
const naMissa = () => Bairro.publico('capela') >= 2 && (G.dia - 1) % 7 === 6 && G.minutos >= 8 * 60 && G.minutos < 10 * 60;
ATUALIZADORES.push(() => {
  if (G.mapaId !== 'bairro' || !G.bairro || !naMissa()) return;
  const T = TERRENOS.capela;
  if (G.bairro.missa === G.dia || !G.jog) return;
  const perto = Math.abs(G.jog.x / TILE - (T.x + 3)) < 5 && Math.abs(G.jog.y / TILE - (T.y + 6)) < 3;
  if (!perto) return;
  G.bairro.missa = G.dia;
  const ids = DONOS.filter(d => G.bairro.terrenos[d.terreno].mudou).map(d => d.id);
  if (typeof Amizade !== 'undefined') Amizade.ganharVarios(ids, 'missa', 'missa');
  avisar('A missa na capela do Bairro Novo. Os vizinhos gostaram de ver o Jocelino lá.'); hudSujo();
});
// ---------- a festa de inauguração: com a padaria, o bar e a escola abertos, a Prefeitura convida ----------
// A carta diz o dia da festa (calculado na hora de ler, para valer também depois de carregar o jogo).
CARTAS.festa_bairro = { de: 'Prefeitura da Vila Maré', dia: 1e9, get texto() { const dias = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'], d = G.bairro && G.bairro.festa.dia;
  return `Sr. Jocelino, o Bairro Novo tem padaria, bar e escola! A Prefeitura convida o senhor e a família para a festa de inauguração, no bairro${d ? ', na ' + dias[(d - 1) % 7] : ''}, das 9h às 17h. O bairro é obra sua.`; } };
MANHA.push(() => {
  if (!G.bairro || G.bairro.festa.dia || G.bairro.festa.feita) return;
  if (Bairro.comercioPronto('padaria') && Bairro.comercioPronto('bar') && Bairro.publico('escola') >= 2) { G.bairro.festa.dia = G.dia + 3; if (!G.correio.caixa.includes('festa_bairro')) G.correio.caixa.push('festa_bairro'); }
});
// No dia marcado ou depois (perdeu o dia? a festa espera o Jocelino aparecer: nunca some).
const festaHoje = () => !!G.bairro && !!G.bairro.festa.dia && G.bairro.festa.dia <= G.dia && !G.bairro.festa.feita && G.minutos >= 9 * 60 && G.minutos < 17 * 60;
TAREFAS.push(() => G.bairro && G.bairro.festa.dia && !G.bairro.festa.feita ? [{ texto: G.bairro.festa.dia <= G.dia ? 'Festa de inauguração no Bairro Novo (das 9h às 17h)' : 'Festa de inauguração do Bairro Novo em ' + (G.bairro.festa.dia - G.dia) + ' dia(s)' }] : []);
const FESTA_ESCOLHAS = [['Discursar', 'O Jocelino discursou de chapéu na mão: "Cada tijolo daqui tem suor de Aracaju e de Praia Grande." Aplausos!'],
  ['Dançar com a Rosa', 'O Jocelino e a Rosa dançaram forró até a sola gastar. O bairro inteiro bateu palma.'], ['Ajudar na barraca', 'O Jocelino ajudou na barraca de pastel e conheceu todo mundo pelo nome.']];
function escolherFesta(i) {
  G.bairro.festa.feita = true; G.dinheiro += 1000; G.ganhoHoje = (G.ganhoHoje || 0) + 1000;
  const ids = DONOS.filter(d => G.bairro.terrenos[d.terreno].mudou).map(d => d.id).concat(['cida', 'orlando']);
  if (typeof Amizade !== 'undefined') Amizade.ganharVarios(ids, 'festa', 'festa');
  sons.tocar('fanfarra', 1, 0, -4); const t = FESTA_ESCOLHAS[i][1] + ' A Prefeitura deu Cr$ 1.000 de prêmio.'; abrirPlaca(t); hudSujo(); return t;
}
ATUALIZADORES.push(() => { if (G.mapaId === 'bairro' && festaHoje() && !menuAberto() && G.comecou !== false) perguntar('A festa de inauguração do Bairro Novo! O que o Jocelino faz?', FESTA_ESCOLHAS.map(e => e[0]).concat(['Só olhar']), i => escolherFesta(Math.min(i, 2))); });

// ---------- os moradores na pensão: quem se mudou passa a jantar na Pensão da Rosa no dia da semana dele ----------
const MORADORES_PENSAO = {
  nena: { dia: 0, prato: 'cuscuz', fala: 'Rosa, um cuscuz igual ao de casa, por favor.', elogio: 'Esse cuscuz me levou pra Aracaju!' },
  neide: { dia: 1, prato: 'sopa_legumes', fala: 'Uma sopinha, Rosa, que o dia foi longo.', elogio: 'Sopa que levanta defunto!' },
  valdir: { dia: 2, prato: 'vatapa', fala: 'Tem vatapá hoje, Dona Rosa?', elogio: 'Vatapá de baiano aprovar!' },
  rosinete: { dia: 3, prato: 'mandioca_frita', fala: 'Uma porção de mandioca pra comemorar a casa nova!', elogio: 'Sequinha e crocante, do jeito certo.' },
  tonha: { dia: 4, prato: 'canjica', fala: 'Canjica, Rosa! Sexta é dia de doce.', elogio: 'Canjica de festa junina!' },
  nenem: { dia: 5, prato: 'pf_peao', fala: 'Um PF caprichado pro Neném aqui.', elogio: 'PF que dá sustância pra semana inteira.' },
};
// Tonhão e Dona Lurdes já jantam na pensão (clientela.js); os outros entram quando se mudam (refeito a cada carregamento).
Bairro.clientela = () => {
  for (const d of DONOS) { const M = MORADORES_PENSAO[d.id]; if (!M || !G.bairro.terrenos[d.terreno].mudou) continue;
    const lista = CLIENTELA[M.dia] || (CLIENTELA[M.dia] = []); if (!lista.some(c => c.id === d.id)) lista.push({ id: d.id, nome: d.nome, prato: M.prato, fala: M.fala, elogio: M.elogio }); }
};
INICIADORES.push(() => { if (G.bairro) Bairro.clientela(); });
MANHA.push(() => { if (G.bairro) Bairro.clientela(); });
// As luzes da noite nas casas prontas e nos prédios (px da arte; a luz que a Vila já usa).
Object.assign(LUZES, { 'objetos/casa_simples_4': [[120, 236, 55]], 'objetos/casa_boa_4': [[120, 236, 60]], 'objetos/sobrado_4': [[120, 284, 55], [120, 170, 40]],
  'objetos/padaria': [[144, 236, 70]], 'objetos/bar_orlando': [[144, 236, 70]], 'objetos/escola': [[144, 236, 60]], 'objetos/capela': [[144, 230, 60]], 'objetos/posto_saude': [[144, 236, 60]] });
// Onde cada morador está: na porta da capela na missa, na frente do bar na sexta à noite, ou na calçada de casa. Quando o
// "onde" muda, ele já aparece lá (o passeio anda em linha reta e não contorna as casas); depois passeia na área.
const noBarSexta = () => (G.dia - 1) % 7 === 4 && G.minutos >= 19 * 60 && G.minutos < 23 * 60 && Bairro.aberto('bar');
function ondeMorador(d) {
  const T = naMissa() ? TERRENOS.capela : noBarSexta() ? TERRENOS.bar : TERRENOS[d.terreno], w = TERRENOS[d.terreno] === T ? 5 : 6;
  return { chave: T === TERRENOS.capela ? 'missa' : T === TERRENOS.bar ? 'bar' : 'casa', area: { x: T.x * TILE, y: (T.y + 6) * TILE + 30, w: w * TILE, h: TILE }, T, w };
}
ATUALIZADORES.push(() => {
  if (G.mapaId !== 'bairro' || !G.bairro) return;
  let k = 0;
  for (const d of DONOS) {
    const m = G.mapa.moradores.find(p => p.id === 'dono_' + d.id); if (!m || !m.mora) continue;
    const o = ondeMorador(d); m.area = o.area; m.vagueia = true;
    if (o.chave !== 'casa') m.visivel = true;
    if (m._onde !== o.chave) { m._onde = o.chave; m.x = (o.T.x + 0.5 + (k % o.w)) * TILE; m.y = (o.T.y + 6) * TILE + 42; m._alvo = null; }
    k++;
  }
});
