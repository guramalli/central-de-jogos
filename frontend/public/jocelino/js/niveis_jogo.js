// Jocelino — niveis_jogo.js — as recompensas de nível que viram coisa no mundo (plano de 15/10, T4; spec
// docs/superpowers/specs/2026-10-15-niveis-recompensa.md): os itens novos das receitas de Fabricar, o caminho de pedra do quintal
// (Alvenaria 1) e o tronco de cogumelo (Fôlego 7). O nível de cada uma mora em NIVEIS_RECOMPENSA (habilidades.js) e os números no
// ECO.niveis. A manta, a manta boa e a lona (na plaquinha do lote) ficam em empreitas.js; a escada de corda, em mina_jogo.js.

Object.assign(ITENS, {
  escada_corda: { nome: 'Escada de corda', pilha: 99, ferramenta: false, descricao: 'Na pedreira funda, com ela na mão, botão direito no chão: desce uma bancada na hora.' },
  tronco_cogumelo: { nome: 'Tronco de cogumelo', pilha: 9, ferramenta: false, colocavel: true, descricao: 'No quintal, botão direito na grama para colocar: dá 1 cogumelo a cada 3 dias. Até 4 troncos; o machado ou a picareta recolhe.' },
  lona: { nome: 'Lona encerada', pilha: 99, ferramenta: false, descricao: 'Instale na plaquinha do lote (com ela na mão): a chuva não para o concreto nem a pintura daquela empreita.' },
});
// (os itens que já existiam e ganham uso: a descrição diz o que fazem de verdade)
ITENS.manta.descricao = 'Instale na plaquinha do lote (com ela na mão): faz sozinha os dias de regador da empreita (a cura).';
ITENS.manta_boa.descricao = 'Instale na plaquinha do lote (com ela na mão): faz sozinha os dias de regador e de pá da empreita. Na chuva, o concreto só pega com a lona.';
ITENS.caminho_pedra.descricao = 'No quintal, botão direito na grama: faz caminho (mato e galho não nascem em cima). A picareta tira.';
MATERIAIS_OBRA.add('lona'); MATERIAIS_OBRA.add('escada_corda');

// ---------- o caminho de pedra (Alvenaria 1): o chão de caminho na grama do quintal ----------
// G.caminhos = ['x,y', ...] (no save). O chão vira CH.CAMINHO (a texturas/caminho de sempre); a rebrota do quintal e a cova só
// nascem na grama, então mato e galho não nascem em cima. A picareta devolve o caminho para a mochila.
INICIADORES.push(s => { G.caminhos = (s.caminhos || []).slice(); });
COLETORES.push(s => { s.caminhos = (G.caminhos || []).slice(); });
AO_MONTAR.push(b => { if (b.id !== 'quintal') return; for (const k of G.caminhos || []) { const [x, y] = k.split(',').map(Number); b.pinta(x, y, 1, 1, CH.CAMINHO); } b.chaoCanvas = null; });
function podeFazerCaminho(b, x, y) {
  if (b.id !== 'quintal') return 'O caminho de pedra vai no quintal.';
  if (!b.livreEm(x, y) || b.ocupado.has(chaveT(x, y)) || b.saidaEm(x, y)) return 'Aqui não dá.';
  if (b.chaoEm(x, y) !== CH.GRAMA) return 'Aqui já é caminho.';
  if (typeof Horta !== 'undefined' && Horta.cova(x, y)) return 'Aqui tem cova: feche com a picareta antes.';
  if (typeof reservadoQuintal === 'function' && reservadoQuintal(x, y)) return 'Esse terreno é da obra da família.';
  return '';
}
function fazerCaminho(x, y) {
  const b = G.mapa, m = podeFazerCaminho(b, x, y); if (m) { avisar(m); return false; }
  if (!G.mochila.remover('caminho_pedra', 1)) return false;
  G.caminhos.push(chaveT(x, y)); b.pinta(x, y, 1, 1, CH.CAMINHO); b.chaoCanvas = null;
  sons.tocar('pedra', 1.2, 0.05, -8); hudSujo(); return true;
}
ACOES_NO_CHAO.push(t => {
  if (!G.mapa || !G.jog || itemDaMao() !== 'caminho_pedra') return false;
  if (G.mapa.id !== 'quintal') { avisar('O caminho de pedra vai no quintal.'); return true; }
  if (G.jog.carga && G.jog.carga.id) { avisar('Primeiro largue o que está carregando.'); return true; }
  if (!perto1(t)) { avisar('Chegue mais perto.'); return true; }
  fazerCaminho(t.x, t.y); return true;
});
// A picareta no caminho que o Jocelino fez (o da trilha do mapa não sai): volta a ser grama e o caminho vai para a mochila.
function caminhoAcertado(id, alvo) {
  const b = G.mapa, k = chaveT(alvo.x, alvo.y);
  if (id !== 'picareta' || !b || b.id !== 'quintal' || !(G.caminhos || []).includes(k)) return false;
  G.caminhos = G.caminhos.filter(c => c !== k); b.pinta(alvo.x, alvo.y, 1, 1, CH.GRAMA); b.chaoCanvas = null;
  const sobra = G.mochila.adicionar('caminho_pedra', 1); if (sobra) soltar('caminho_pedra', 1, (alvo.x + 0.5) * TILE, (alvo.y + 0.5) * TILE);
  lascas((alvo.x + 0.5) * TILE, (alvo.y + 0.5) * TILE, 'pedra'); sons.tocar('pedra', 1, 0.08, -6); hudSujo(); return true;
}

// ---------- o tronco de cogumelo (Fôlego 7; o Mushroom Log do Stardew): no quintal, 1 cogumelo a cada 3 dias ----------
// É um colocado do quintal (quintal_coisas.js): c.prox = o dia em que o cogumelo fica pronto (3 dias depois de pôr ou de colher).
// Pronto, um cogumelo balança em cima do tronco; o botão direito colhe. O machado ou a picareta recolhe (com o cogumelo, se tiver).
COLOCAVEIS_QUINTAL.push('tronco_cogumelo');
LIMITE_COLOCADO.tronco_cogumelo = ECO.niveis.tronco.maximo;
const troncoPronto = c => G.dia >= c.prox;
function colherTronco(c) {
  if (!troncoPronto(c)) { const f = c.prox - G.dia; abrirPlaca(`O tronco de cogumelo: o próximo cogumelo sai ${f <= 1 ? 'amanhã' : `em ${f} dias`}.`); return true; }
  if (!G.mochila.cabe('cogumelo')) { avisar('A mochila está cheia.'); return true; }
  G.mochila.adicionar('cogumelo', 1); c.prox = G.dia + ECO.niveis.tronco.dias;
  for (const f of AO_PEGAR) f('cogumelo', 1);   // (a coleta do recado)
  sons.tocar('pegar', 1.1, 0.05, -4); avisar('+ 1 cogumelo do mato.'); hudSujo(); return true;
}
COLOCADO_ACAO.tronco_cogumelo = (o, c) => {
  if (c.prox == null) c.prox = G.dia + ECO.niveis.tronco.dias;
  o.acao = () => colherTronco(c);
  o.ferramenta = (p, id) => {
    if (id !== 'machado' && id !== 'picareta') return;
    if (troncoPronto(c) && G.mochila.cabe('cogumelo')) { G.mochila.adicionar('cogumelo', 1); for (const f of AO_PEGAR) f('cogumelo', 1); }
    recolher(p);
  };
};
// O cogumelo pronto balança em cima do tronco (a arte do item, só posicionada, como o ícone da plaquinha).
EXTRAS_MUNDO.push(m => m.id !== 'quintal' || !G.horta ? [] : m.objs.filter(o => o.item === 'tronco_cogumelo').map(o => {
  const c = G.horta.colocados.find(x => x.x === o.cx && x.y === o.cy && x.id === 'tronco_cogumelo');
  return c && troncoPronto(c) ? { y: o.y + 1, desenha(ctx) { desenhaPe(ctx, 'itens/cogumelo', o.x, o.y - 40 + Math.sin((G.agora || 0) * 3) * 3, 1, 0.6); } } : null;
}).filter(Boolean));

// ==================== (T4b) Negócio, Roça e Pesca ====================
// Os itens novos (a arte do Higgsfield já estava pronta: itens/espantalho, adubo_peixe, adubo_bom, isca_boa e objetos/espantalho);
// a isca boa fica em pesca.js, com a isca. Os números moram no ECO.niveis.
Object.assign(ITENS, {
  espantalho: { nome: 'Espantalho', pilha: 9, ferramenta: false, colocavel: true, descricao: `No quintal, botão direito na grama para colocar: as galinhas não bicam as covas a até ${ECO.niveis.espantalho} passos dele (o quadrado aparece com ele na mão). O machado ou a picareta recolhe.` },
  adubo_peixe: { nome: 'Adubo de peixe', pilha: 99, ferramenta: false, descricao: 'Ponha na cova VAZIA antes de plantar (botão direito com ele na mão): conta como esterco e a planta fica pronta 1 dia antes.' },
  adubo_bom: { nome: 'Adubo bom', pilha: 99, ferramenta: false, descricao: 'Esterco com cal. Ponha na cova VAZIA antes de plantar (botão direito com ele na mão): conta como 2 estercos, muito mais colheita caprichada.' },
});
ITENS.placa_propaganda.descricao = `No quintal, botão direito na grama para colocar: os recados do povo pagam ${Math.round(ECO.niveis.placa * 100)}% a mais. Uma só no quintal; o machado ou a picareta recolhe.`;

// ---------- Roça 2: o espantalho (o do Stardew espanta os corvos; aqui, as galinhas da vizinhança) ----------
// Horta.espantada (horta.js) tira das galinhas as covas no quadrado de 9 × 9 em volta dele. Com ele na mão, o quadrado aparece.
COLOCAVEIS_QUINTAL.push('espantalho', 'placa_propaganda');
LIMITE_COLOCADO.placa_propaganda = 1;
COLOCADO_ACAO.espantalho = o => { o.acao = () => { abrirPlaca(`O espantalho: as galinhas não bicam as covas a até ${ECO.niveis.espantalho} passos dele.`); return true; }; };
COLOCADO_ACAO.placa_propaganda = o => { o.acao = () => { abrirPlaca(`A placa de propaganda do Jocelino: os recados do povo pagam ${Math.round(ECO.niveis.placa * 100)}% a mais.`); return true; }; };
function desenhaAlcanceEspantalho(ctx) {
  if (G.mapaId !== 'quintal' || !G.horta || !G.mouse || itemDaMao() !== 'espantalho' || (typeof menuAberto === 'function' && menuAberto())) return;
  const r = ECO.niveis.espantalho, t = ladrilhoDoMouse();
  const quadrado = (cx, cy, cor) => { ctx.fillStyle = cor; for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) ctx.fillRect(x * TILE + 3, y * TILE + 3, TILE - 6, TILE - 6); };
  ctx.save();
  for (const c of G.horta.colocados) if (c.id === 'espantalho') quadrado(c.x, c.y, 'rgba(255,214,70,0.22)');
  quadrado(t.x, t.y, 'rgba(255,214,70,0.36)');
  ctx.restore();
}

// ---------- Negócio 1: o Olho de comerciante (a dica do item mostra o valor na caixa de venda) ----------
// O valor de 1 unidade na caixa, com o que a caixa já soma (Feirante, Pescador, o Negócio e a Pechincha).
function valorNaCaixa(id) {
  const p = typeof CaixaVenda !== 'undefined' ? CaixaVenda.preco(id) : 0; if (!p) return 0;
  return Math.round(p * (typeof fatorFeira === 'function' ? fatorFeira(id) : 1) * (typeof fatorPeixe === 'function' ? fatorPeixe(id) : 1) * Habilidades.bonusVenda());
}
function valorNaCaixaTxt(id) {
  if (!Habilidades.ganho('olho_de_comerciante')) return '';
  const v = valorNaCaixa(id); return v ? ` · Na caixa de venda: Cr$ ${v} cada` : ' · Não se vende na caixa';
}
function dicaItem(id) { const d = Itens.descricao(id); return Itens.nome(id) + (d ? ' — ' + d : '') + valorNaCaixaTxt(id); }

// ---------- Negócio 6 e 9: o fiado (a caderneta do Seu Ananias) ----------
// No depósito (Comprar, Mercearia e Sementes), o que o dinheiro não cobre vai para a caderneta, até o limite (Cr$ 300; Cr$ 1.000 no
// Negócio 9). A dívida fica embaixo do dinheiro no HUD e no balcão; paga-se no balcão ("Pagar o fiado") ou o Ananias recebe no
// domingo à noite o que o dinheiro der (o resto fica para o outro domingo, sem juros; enquanto deve o limite, não compra mais fiado).
// (revisão) O Ananias é a ÚLTIMA cobrança da noite: recebe só o que sobrar depois da parcela da lojinha, do Tião e dos salários. E,
// se ficou dívida do domingo (G.fiadoAtrasado), ele só vende fiado de novo depois de receber tudo.
const Fiado = {
  limite() { return Habilidades.ganho('fiado_maior') ? ECO.niveis.fiadoMaior : Habilidades.ganho('fiado') ? ECO.niveis.fiado : 0; },
  livre() { return G.fiadoAtrasado && G.fiado > 0 ? 0 : Math.max(0, Fiado.limite() - (G.fiado || 0)); },
  pagar() {
    const v = Math.min(G.fiado || 0, Math.max(0, Math.floor(G.dinheiro))); if (v > 0) { G.dinheiro -= v; G.fiado -= v; G.gastoHoje = (G.gastoHoje || 0) + v; }
    if (!(G.fiado > 0)) G.fiadoAtrasado = false;
    return v;
  },
  // A linha do balcão (null sem fiado nem dívida).
  linhaLoja(desenha) {
    const lim = Fiado.limite(), d = G.fiado || 0;
    if (!lim && !d) return null;
    const L = lim.toLocaleString('pt-BR'), txt = d > 0 && G.fiadoAtrasado ? `Fiado: você deve Cr$ ${d}, que ficou do domingo. O Ananias só vende fiado de novo depois de receber tudo.`
      : d > 0 ? `Fiado: você deve Cr$ ${d}${lim ? ` (até Cr$ ${L})` : ''}. O Ananias recebe no domingo à noite.` : `Fiado: o que o dinheiro não cobrir vai para a caderneta do Ananias, até Cr$ ${L}. Paga no domingo à noite.`;
    return el('div', { class: 'rodape fiado-loja', style: 'text-align:left;display:flex;justify-content:space-between;align-items:center;gap:10px;margin:2px 0 6px' }, el('span', {}, txt),
      d > 0 && G.dinheiro >= 1 ? el('button', { class: 'botao', onclick: e => { e.stopPropagation(); const v = Fiado.pagar();
        avisar(`Pagou Cr$ ${v} do fiado.${G.fiado ? ` Ainda deve Cr$ ${G.fiado}.` : ' A caderneta ficou limpa.'}`); sons.tocar('dinheiro', 1, 0.05, -4); hudSujo(); desenha(); } }, 'Pagar o fiado') : null);
  },
};
COLETORES.push(s => { s.fiado = G.fiado || 0; s.fiadoAtrasado = !!G.fiadoAtrasado; });
function fiadoNaNoite(linhas) {
  if (!(G.fiado > 0) || !relogio.domingo()) return;
  const v = Fiado.pagar();
  if (G.fiado > 0) G.fiadoAtrasado = true;
  linhas.push(v ? `O Seu Ananias recebeu Cr$ ${v} do fiado.${G.fiado ? ` Ainda falta Cr$ ${G.fiado}, para o outro domingo (até lá, nada de fiado novo).` : ' A caderneta ficou limpa.'}`
    : `O Seu Ananias veio receber o fiado, mas o dinheiro não deu: a dívida (Cr$ ${G.fiado}) fica para o outro domingo (até lá, nada de fiado novo).`);
}
// A cobrança do fiado vai para o FIM da noite, seja qual for a ordem dos scripts: ao começar o jogo (todos os NOITE já estão na
// lista), ela sai de onde estiver e entra por último.
INICIADORES.push(s => {
  G.fiado = Math.max(0, s.fiado || 0); G.fiadoAtrasado = !!s.fiadoAtrasado && G.fiado > 0;
  const i = NOITE.indexOf(fiadoNaNoite); if (i >= 0) NOITE.splice(i, 1); NOITE.push(fiadoNaNoite);
});
