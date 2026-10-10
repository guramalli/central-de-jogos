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
  const naRua = (x, y) => (y >= 9 && y <= 10 && x < 50) || (x >= 48 && x <= 49 && y >= 9);
  b.saida(1, 9, 1, 2, 'vila', 44, 6);
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
    if (dono) for (let y = T.y; y < T.y + 7; y++) for (let x = T.x; x < T.x + w; x++) { const o = b.ocupado.get(chaveT(x, y)); if (o && o.tipo === 'detrito') b.tirar(o); }
    const marca = (o, extra) => Object.assign(o, { doBairro: true }, extra || {});
    if (T.tipo === 'casa') {
      const arte = arteDaCasa(t);
      if (arte) marca(b.interativo('casa_' + t, arte, T.x, T.y + 4, 5, 3, [78, 62]), { acao: () => { abrirPlaca(`A casa ${dono ? (dono.nome.startsWith('Dona') ? 'da ' : 'de ') + dono.nome : ''} no Bairro Novo.`); return true; } });
      else for (const [ex, ey] of [[T.x, T.y + 1], [T.x + 4, T.y + 1], [T.x, T.y + 4], [T.x + 4, T.y + 4]]) marca(b.enfeite('objetos/estaca_terreno', ex, ey, false));
      if (!arte) marca(b.interativo('placa_' + t, 'objetos/placa_terreno', T.x + 2, T.y + 3, 1, 1, [10, 6]), { acao: () => { abrirPlaca(dono ? `Terreno ${dono.nome.startsWith('Dona') ? 'da ' : 'de '}${dono.nome}.` : 'Terreno à venda.'); return true; } });
      const x = G.bairro.terrenos[t];
      // Varanda (fase 5): o piso na frente da porta (textura recortada); fase 6: a calçada na frente da porta e o muro do lado
      // direito (o muro nunca tampa a porta, que fica no meio da casa).
      const piso = (id, tx, ty, w2, tex) => { const o = marca(b.interativo(id, 'objetos/alicerce', tx, ty, w2, 1, null, false)); o.y = ty * TILE; o.desenha = ctx => { const img = spr(tex); if (img) ctx.drawImage(img, 0, 0, w2 * TILE, TILE, tx * TILE, ty * TILE, w2 * TILE, TILE); }; return o; };
      if (x.fase >= 5) piso('varanda_' + t, T.x, T.y + 5, 3, TIPOS_CASA[DONOS.find(d => d.terreno === t).casa].varanda.ladrilho ? 'texturas/piso_ladrilho' : 'texturas/piso_cimento');
      if (x.fase >= 6) { marca(b.interativo('muro_' + t, 'objetos/muro', T.x + 3, T.y + 6, 3, 1)); piso('calcada_' + t, T.x, T.y + 6, 3, 'texturas/calcada'); }
      if (x.mudou && Bairro.caprichada(t)) marca(b.interativo('placa_jocelino_' + t, 'objetos/placa_jocelino', T.x + 4, T.y + 5, 1, 1, null, false), { acao: () => { abrirPlaca('"Construída por Jocelino" — casa caprichada do começo ao fim.'); return true; } });
    }
    if (T.tipo === 'comercio') {
      const c = G.bairro.comercios[t], K = COMERCIOS[t];
      if (c.fase >= 1) { for (let y = T.y; y < T.y + 7; y++) for (let x2 = T.x; x2 < T.x + 6; x2++) { const o = b.ocupado.get(chaveT(x2, y)); if (o && o.tipo === 'detrito') b.tirar(o); }
        marca(b.interativo('predio_' + t, c.fase >= 4 ? K.arte : 'objetos/predio_obra_' + Math.min(3, c.fase), T.x, T.y + 4, 6, 3, [90, 62]), { acao: () => abrirComercio(t) }); }
      else marca(b.interativo('placa_' + t, 'objetos/placa_terreno', T.x + 2, T.y + 3, 1, 1, [10, 6]), { acao: () => { abrirPlaca(Bairro.casasProntas() >= K.libera ? `Terreno da ${K.nome}: o pedido está no quadro de Serviços.` : `Terreno reservado: a ${K.nome}. (Vem com ${K.libera} casa${K.libera > 1 ? 's' : ''} pronta${K.libera > 1 ? 's' : ''} no bairro.)`); return true; } });
      if (c.fase >= 5) { const o = marca(b.interativo('calcada_' + t, 'objetos/alicerce', T.x + 1, T.y + 6, 4, 1, null, false)); o.y = (T.y + 6) * TILE; o.desenha = ctx => { const img = spr('texturas/calcada'); if (img) ctx.drawImage(img, 0, 0, 4 * TILE, TILE, (T.x + 1) * TILE, (T.y + 6) * TILE, 4 * TILE, TILE); }; }
      // O dono no balcão (a frente do prédio) no horário.
      let m = b.moradores.find(p => p.id === 'balcao_' + t);
      if (Bairro.comercioPronto(t) && !m) { m = b.morador('balcao_' + t, CLIENTE_NOME[K.dono], T.x + 3, T.y + 5, DIR.BAIXO); m.pele = K.dono; m.aoConversar = () => abrirComercio(t); }
    }
  }
  // Os donos: esperam de pé na frente do terreno (8h–17h) até a mudança; depois moram (passeiam perto de casa de dia).
  for (const d of DONOS.slice(0, G.bairro.chegados)) {
    const T = TERRENOS[d.terreno], x = G.bairro.terrenos[d.terreno], id = 'dono_' + d.id;
    let m = b.moradores.find(p => p.id === id);
    if (!m) { m = b.morador(id, d.nome, T.x + 2, T.y + 8, DIR.BAIXO); m.pele = d.id; m.aoConversar = () => conversarDono(d); }
    m.mora = x.mudou; m.vagueia = x.mudou; m.area = x.mudou ? { x: T.x * TILE, y: (T.y + 7) * TILE + 30, w: 5 * TILE, h: TILE } : null;
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
  const n = Bairro.ruas();
  if (n >= 1) { b.pinta(1, 9, 49, 2, CH.CAMINHO); b.pinta(48, 9, 2, 25, CH.CAMINHO); }   // a rua aberta: terra batida
  if (n >= 2) { b.pinta(1, 8, 47, 1, CH.CALCADA); b.pinta(1, 11, 47, 1, CH.CALCADA); }
  // A rua e a calçada prontas ficam limpas (sem mato nem pedra em cima).
  if (n >= 1) for (let x = 1; x < 50; x++) for (const y of n >= 2 ? [8, 9, 10, 11] : [9, 10]) { const o = b.ocupado.get(chaveT(x, y)); if (o && o.tipo === 'detrito') b.tirar(o); }
  b.chaoCanvas = null;   // o chão é remontado com as texturas novas
  for (const o of b.objs.filter(o => o.id === 'poste')) b.tirar(o);
  if (n >= 3) for (let x = 8; x < 48; x += 7) { const o = b.interativo('poste', 'objetos/poste', x, 8, 1, 1, [8, 6]); o.acao = () => { abrirPlaca('Poste de luz do Bairro Novo.'); return true; }; }
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
  const sextaNoBar = (G.dia - 1) % 7 === 4 && G.minutos >= 19 * 60 && G.minutos < 23 * 60 && Bairro.aberto('bar'), T = TERRENOS.bar;
  for (const m of G.mapa.moradores) if (m.id.startsWith('dono_') && m.mora) { if (sextaNoBar) { m.area = { x: T.x * TILE, y: (T.y + 7) * TILE + 30, w: 6 * TILE, h: TILE }; m.visivel = true; } else if (m._areaCasa) m.area = m._areaCasa; if (!m._areaCasa && m.area && !sextaNoBar) m._areaCasa = m.area; }
});
