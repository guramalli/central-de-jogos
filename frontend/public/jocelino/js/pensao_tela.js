// Jocelino — pensao_tela.js — a Pensão da Rosa jogável (o sushi bar do Bancho, no Dave the Diver): a reforma da casa da
// Dona Cotinha, a despensa, o quadro de giz (o "Today's Menu"), a janta das 17h às 21h (anotar na banqueta, a Rosa
// prepara com a cena cômica, montar o prato no balcão, levar à banqueta, limpar a louça), os balões e as frases dos
// clientes, o selo da fama e o relatório no resumo da noite; se o Jocelino falta, a Rosa serve sozinha.
// Tradução das seções da pensão de jogo/principal.gd e das telas hud/cardapio_menu.gd, montar_menu.gd, cena_rosa.gd,
// com as correções da revisão (prato preso na mão, aviso do café, pedra de obra, cardápio sem ingrediente).

const FRASES_CLIENTE = { coracao: ['Que sustância!', 'Tá aprovado!', 'Igual da minha mãe!'], suor: ['Arde, mas é bom!', 'Cadê a pedra?'],
  choro: ['Lembrei de Aracaju...', 'Que doce, meu Deus!'], nojo: ['Faltou coisa aqui...', 'Hmm...'] };
const SONS_ROSA = ['TSSSS!', 'PLOFT!', 'VAPT!', 'CHIIII!', 'TCHAN!'];

// ---------- estado e salvamento ----------
INICIADORES.push(s => { G.pensao = new Pensao(); G.pensao.deDict(s.pensao); G.turno = null; G.relatorioPensao = null; });
COLETORES.push(s => { s.pensao = G.pensao.paraDict(); });
MANHA.push(() => {
  if (G.dia >= 2) G.pensao.abrirReforma();
  G.pensao.manha(G.dia);
  atualizarPensaoMundo();
});
AO_MONTAR.push(b => { if (b.id === 'vila' || b.id === 'pensao_dentro') atualizarPensaoMundo(b); });

function pensaoAbreHoje() { return G.pensao.estado === 'aberta' && !relogio.domingo(); }

// A fachada (3 estados) e, dentro, as banquetas e a Rosa.
function atualizarPensaoMundo(so) {
  const e = G.pensao.estado;
  const vila = so && so.id === 'vila' ? so : MAPAS.vila;
  if (vila) {
    const f = vila.objs.find(o => o.id === 'pensao');
    if (f) { f.nome = ['fechada', 'limpar'].includes(e) ? 'objetos/pensao_fechada' : ['telhas', 'mesas'].includes(e) ? 'objetos/pensao_reforma' : 'objetos/pensao'; f.placa = ['pronta', 'aberta'].includes(e) ? 'Pensão da Rosa' : 'Pensão da Dona Cotinha'; }
  }
  const sal = so && so.id === 'pensao_dentro' ? so : MAPAS.pensao_dentro;
  if (!sal) return;
  const quer = ['pronta', 'aberta'].includes(e) ? Math.min(G.pensao.mesas, SALAO.ASSENTOS.length) : 0;
  while (sal.banquetas.length < quer) {
    const i = sal.banquetas.length, a = SALAO.ASSENTOS[i];
    const b = sal.interativo('banqueta_' + i, 'objetos/banqueta', a[0], a[1], 1, 1, [10, 6]);
    b.acao = () => pensaoMesa(i);
    b.alvoAlto = 170;   // o clique pega o cliente inteiro (cabeça e balão), não só a banqueta
    sal.banquetas.push(b);
  }
  if (e === 'aberta' && !sal.rosa) sal.rosa = sal.morador('rosa', 'Rosa', SALAO.COZINHA[0] + 1, SALAO.COZINHA[1] - 1, DIR.BAIXO);
}

// ---------- reforma ----------
function pensaoFachada() {
  if (G.pensao.estado === 'fechada') { abrirPlaca('Uma pensão abandonada, com tábuas na porta. Uma placa apagada: "Pensão da Dona Cotinha".'); return true; }
  if (typeof pensaoNoPalco === 'function' && pensaoNoPalco()) { entrarPalco(); return true; }
  // Na reforma, a entrega é na porta: a Rosa pergunta se entrega o material que o Jocelino trouxe.
  const p = G.pensao, falta = p.faltaMaterial(), k = Object.keys(falta)[0];
  if (k && falta[k] > 0 && G.mochila.total(k) > 0) {
    const n = Math.min(G.mochila.total(k), falta[k]);
    perguntar(`Rosa: "Trouxe ${Itens.qtd(n, k)}? ${k === 'telha' ? 'É para o telhado!' : 'Dá para as banquetas!'}"`, [`Entregar ${Itens.qtd(n, k)}`, 'Entrar no salão', 'Agora não'], i => {
      if (i === 0) { const txt = p.entregar(G.mochila, G.dia); atualizarPensaoMundo(); hudSujo(); sons.tocar('madeira', 0.8, 0.08, -4); sons.tocar('feito', 1, 0.03, -6);
        if (p.estado === 'pronta') G.feitosHoje.push('A pensão ficou pronta: abre amanhã!');
        const f2 = p.faltaMaterial(), k2 = Object.keys(f2)[0]; abrirPlaca(k2 && f2[k2] > 0 ? `${txt} Falta: ${Itens.qtd(f2[k2], k2)}.` : txt); }
      else if (i === 1) { entrarMapa('pensao_dentro', { x: 14, y: 12 }); sons.tocar('porta', 1, 0.05, -4); }
    });
    return true;
  }
  entrarMapa('pensao_dentro', { x: 14, y: 12 });
  sons.tocar('porta', 1, 0.05, -4);
  return true;
}
ATUALIZADORES.push(() => {
  if (G.pensao.estado !== 'limpar' || G.mapaId !== 'pensao_dentro') return;
  if (!G.mapa.objs.some(o => o.tipo === 'detrito')) {
    G.pensao.limpou();
    atualizarPensaoMundo();
    sons.tocar('feito', 1, 0.03, 0);
    abrirPlaca(`Salão limpo! Agora o telhado: entregue ${Pensao.TELHAS} telhas na plaquinha (o Seu Ananias vende).`);
  }
});
function pensaoPlaquinha() {
  const p = G.pensao;
  if (p.estado === 'limpar') abrirPlaca(`Reforma da pensão: limpe o salão (mato com a foice, entulho com a pá). Faltam ${G.mapa.objs.filter(o => o.tipo === 'detrito').length}.`);
  else if (p.estado === 'telhas' || p.estado === 'mesas') {
    const txt = p.entregar(G.mochila, G.dia);
    atualizarPensaoMundo(); hudSujo();
    const falta = p.faltaMaterial();
    if (p.estado === 'pronta') { G.feitosHoje.push('A pensão ficou pronta: abre amanhã!'); sons.tocar('feito', 1, 0.03, 0); }
    const k = Object.keys(falta)[0];
    abrirPlaca(k && falta[k] > 0 ? `${txt} Falta: ${Itens.qtd(falta[k], k)}.` : txt);
  } else if (p.estado === 'pronta') abrirPlaca('Tudo pronto! A Pensão da Rosa abre amanhã. A janta é das 17h às 21h.');
  else if (p.estado === 'aberta') abrirPainelPensao();
  return true;
}
TAREFAS.push(() => {
  const p = G.pensao;
  if (!p) return [];
  if (p.estado === 'limpar') return [{ texto: 'Pensão: limpar o salão (casa da Dona Cotinha)' }];
  if (p.estado === 'telhas') return [{ texto: 'Pensão: entregar telhas na porta da pensão', feito: p.telhas, meta: Pensao.TELHAS }];
  if (p.estado === 'mesas') return [{ texto: 'Pensão: madeira das banquetas', feito: p.madeira, meta: Pensao.MADEIRA }];
  if (pensaoAbreHoje() && p.ultimaJanta !== G.dia && G.minutos < 20 * 60) return [{ texto: 'Janta na Pensão da Rosa às 17h' }];
  return [];
});

// (a despensa está em despensa.js)

// ---------- quadro de giz (Today's Menu) ----------
function pensaoQuadro() {
  const p = G.pensao;
  if (p.estado !== 'aberta') { abrirPlaca('O quadro de giz ainda está em branco. A Rosa escreve o cardápio quando a pensão abrir.'); return true; }
  const caixa = el('div', { class: 'lousa' });
  const desenha = () => {
    caixa.innerHTML = '';
    const melhorRar = id => { const pr = Pratos.PRATOS[id].principal; if (pr !== 'peixe') return Pratos.raridade(pr); return Math.max(1, ...Pratos.PEIXES.filter(x => p.despensa[x] > 0 && p.aceita(x)).map(Pratos.raridade)); };
    caixa.append(el('div', { class: 'lousa-titulo' }, '~ Pensão da Rosa ~'));
    const esq = el('div', { class: 'lousa-esq' }, el('div', { class: 'giz-am' }, 'Sempre tem'),
      Object.values(Pratos.BEBIDAS).map(b => el('div', {}, '- ' + b)), el('div', { class: 'giz-mi' }, '(vem com o prato)'),
      el('div', { class: 'lousa-fama' }, el('div', { class: 'giz-am' }, p.nomeGrau(p.grau())),
        el('div', {}, `${p.curtidas} curtidas`),
        el('div', {}, `Pratos: ${p.cardapio.length} de ${p.vagas()}`)));
    const dir = el('div', { class: 'lousa-dir' }, el('div', { class: 'giz-am' }, 'Pratos de hoje'));
    const desc = el('div', { class: 'giz-mi lousa-desc' }, 'Clique para pôr ou tirar do quadro. Ingrediente vai na despensa.');
    p.receitas.forEach((id, i) => {
      const pr = Pratos.PRATOS[id], rende = p.rende(id), marcado = p.cardapio.includes(id);
      dir.append(el('div', { class: 'prato-linha' + (marcado ? ' marcado' : ''),
        onmouseenter: () => { desc.textContent = pr.desc; }, onmouseleave: () => { desc.textContent = 'Clique para pôr ou tirar do quadro. Ingrediente vai na despensa.'; },
        onclick: e => { e.stopPropagation();
          if (marcado) p.cardapio = p.cardapio.filter(x => x !== id);
          else if (p.cardapio.length < p.vagas()) p.cardapio.push(id);
          else avisar(`Só cabem ${p.vagas()} pratos no quadro (a fama abre mais).`);
          sons.tocar('cursor', 1, 0.04, -8); desenha(); } },
        el('img', { src: 'a/' + iconePrato(id) + '.webp' }),
        el('div', { class: 'prato-meio' }, el('div', { class: 'faixa', style: `background:${['#c4473a', '#d48a2c', '#3f8a5a', '#3a6ea5', '#8a4fa0', '#b0476e'][i % 6]}` }, pr.nome),
          el('div', { class: rende > 0 ? '' : 'falta' }, '★'.repeat(melhorRar(id)) + '   ' + (rende > 0 ? 'rende ' + rende : 'falta ingrediente'))),
        el('div', { class: 'prato-preco' }, 'Cr$ ' + p.preco(id, 1), el('div', { class: 'giz-mi' }, 'Nv ' + p.nivel(id) + (marcado ? ' · no quadro' : '')))));
    });
    dir.append(desc, el('button', { class: 'botao', style: 'align-self:flex-end', onclick: e => { e.stopPropagation(); fecharModal(); abrirCaderno(); } }, 'Caderno de receitas ▸'));
    caixa.append(el('div', { class: 'lousa-corpo' }, esq, dir));
  };
  desenha();
  abrirModal(caixa);
  sons.tocar('abrir', 1.1, 0.03, -6);
  return true;
}

// ---------- a janta ----------
function iniciarJanta() {
  G.turno = new TurnoJanta();
  const festa = typeof Eventos !== 'undefined' ? Eventos.hoje(G.pensao, G.dia, 'festa') : null, vip = typeof Eventos !== 'undefined' ? Eventos.hoje(G.pensao, G.dia, 'vip') : null;
  G.turno.iniciar(G.pensao, G.dia, G.pensao.clientesDaNoite() + (typeof bonusMelhorias === 'function' ? bonusMelhorias(G.pensao).clientes : 0) + (festa ? 3 : 0));
  if (festa) { G.turno.pratoTema = festa.prato; G.turno.festa = festa.nome; }
  if (vip) { const v = vipDe(vip.id); G.turno.vip = { nome: v.nome, prato: vip.prato }; G.turno._fila.push({ minuto: 18 * 60 + 30, cliente: { id: v.id, nome: v.nome, mania: 'vip', prato: vip.prato } }); G.turno._fila.sort((a, b) => a.minuto - b.minuto); }
  if (typeof Equipe !== 'undefined') {
    const t = G.turno, p = G.pensao, b = typeof bonusMelhorias === 'function' ? bonusMelhorias(p) : { preparo: 1, bocas: 0, gorjeta: 0, paciencia: 1, farinha: 0 };
    t.fatorPreparo = Equipe.preparo(p) * b.preparo; t.bocas = TurnoJanta.BOCAS + Equipe.bocasExtra(p) + b.bocas;
    t.gorjetaExtra = Equipe.gorjetaExtra(p) + b.gorjeta; t.paciencia = b.paciencia; t.farinhaMax = TurnoJanta.FARINHA_MAX + b.farinha; t.farinha = t.farinhaMax;
  }
  G.pensao.ultimaJanta = G.dia;
  G.relatorioPensao = null;
  if (G.turno.festa) avisar(`Hoje é a ${G.turno.festa}! ${Pratos.PRATOS[G.turno.pratoTema].nome} vale 50% mais.`);
  if (G.turno.vip) avisar(`Hoje janta ${G.turno.vip.nome}: ele vai pedir ${Pratos.PRATOS[G.turno.vip.prato].nome}.`);
  avisar(noPalco() ? 'A janta começou! A Rosa põe os pratos no passe da cozinha: pegue e leve a quem pediu. Bebida: no bebedouro.' : 'A janta começou! Clique no cliente (ou no balcão na frente dele) para anotar o pedido.');
}
function encerrarJanta() {
  if (!G.turno) return;
  const r = G.turno.fechar();
  const total = r.ganho + r.gorjeta;
  G.dinheiro += total; G.ganhoHoje += total;
  // O cliente especial e os pedidos da Vila.
  if (typeof Eventos !== 'undefined') {
    const vip = Eventos.hoje(G.pensao, G.dia, 'vip');
    if (vip) { vip.fim = r.vip === 'servido' ? 'servido' : 'faltou';
      if (r.vip === 'servido') { const pr = vipDe(vip.id).premio; G.dinheiro += pr.dinheiro; r.curtidas += pr.curtidas; G.pensao.pitadas += pr.pitadas; r.premioVip = pr; } }
    const fe = Eventos.hoje(G.pensao, G.dia, 'festa'); if (fe) fe.fim = 'feita';
    r.pedidosFeitos = Eventos.depoisDaJanta(G.pensao, r, G.dia);
    for (const e of r.pedidosFeitos) { G.dinheiro += e.premio; r.curtidas += 2; }
  }
  r.subiu = G.pensao.registrarNoite(r.estrelas, G.dia, r.curtidas);
  // A despesa da noite do degrau (gás, gelo, luz), como a do Cooksta.
  r.despesa = G.pensao.despesa(); G.dinheiro -= r.despesa; G.ganhoHoje -= r.despesa;
  r.salarios = typeof Equipe !== 'undefined' ? Equipe.salarios(G.pensao) : 0; G.dinheiro -= r.salarios; G.ganhoHoje -= r.salarios;
  if (r.subiu) { G.correio.caixa.push('fama_' + r.subiu); sons.tocar('fanfarra', 1, 0, -2); avisar(`A pensão subiu: agora é "${G.pensao.nomeGrau(r.subiu)}"!`); }
  G.relatorioPensao = r;
  G.turno = null;
  if (G.jog && G.jog.carga && G.jog.carga.id === 'prato') G.jog.carga = {};
  const sal = MAPAS.pensao_dentro;
  if (sal) sal.clientes = [];
  avisar('A janta acabou: Cr$ ' + total + '.');
  hudSujo();
}
ATUALIZADORES.push(dt => {
  const t = G.turno;
  if (!t) {
    if (pensaoAbreHoje() && G.pensao.ultimaJanta !== G.dia && noSalaoDaPensao() && G.minutos >= TurnoJanta.ABRE && G.minutos < 20 * 60) iniciarJanta();
    return;
  }
  t.tick(dt, G.minutos);
  const noSalao = noSalaoDaPensao();
  for (const ev of t.eventos) {
    if (ev.tipo === 'pronto' && noSalao) { mostrarCenaRosa(ev.prato); sons.tocar('prato_tchan', 1, 0.05, -4); }
    else if (ev.tipo === 'pagou' && noSalao) sons.tocar(SONS_LISTA.some(n => n.startsWith('moedas')) ? 'moedas' : 'dinheiro', 1.1, 0.05, -6);
    else if (ev.tipo === 'embora') {
      // O cliente foi embora com o prato dele na mão do Jocelino: a Rosa guarda o prato (nada trava).
      if (G.jog.carga && G.jog.carga.id === 'prato' && G.jog.carga.mesa === ev.mesa) { G.jog.carga = {}; avisar(`${ev.cliente.nome} foi embora antes do prato chegar. A Rosa guardou o prato.`); }
      else if (noSalao) { avisar(`${ev.cliente.nome} cansou de esperar e foi embora resmungando.`); sons.tocar('cliente_hmpf', 1, 0.08, -4); }
    } else if (ev.tipo === 'cafe' && noSalao) avisar(`Sem ingrediente na despensa: ${ev.cliente.nome} tomou só um cafezinho.`);
    else if (ev.tipo === 'vip_faltou' && noSalao) { avisar(`${ev.cliente.nome} queria ${Pratos.PRATOS[ev.prato].nome} e não tinha! Foi embora decepcionado.`); sons.tocar('cliente_hmpf', 0.9, 0.05, -2); }
    else if (ev.tipo === 'vip_servido' && noSalao) { avisar(`${ev.cliente.nome}: "${vipDe(ev.cliente.id).frase}"`); sons.tocar('fanfarra', 1.1, 0, -6); }
  }
  t.eventos = [];
  sincronizaClientes();
  if (t.encerrado(G.minutos)) encerrarJanta();
});

// Os clientes sentados nas banquetas (atrás do balcão, de frente para a câmera).
function sincronizaClientes() {
  const sal = MAPAS.pensao_dentro, t = G.turno;
  if (!sal) return;
  const quer = (t ? t.mesas : []).map(m => ['pedido', 'prato', 'comendo'].includes(m.estado) ? m.cliente.id : '');
  sal.clientes = quer.map((id, i) => {
    if (!id) return null;
    const ja = sal.clientes && sal.clientes[i];
    if (ja && ja.id === id) return ja;
    const a = SALAO.ASSENTOS[i];
    return new Personagem(id, t.mesas[i].cliente.nome, (a[0] + 0.5) * TILE, a[1] * TILE + 42, DIR.BAIXO);
  });
}
MAPAS_DEF.pensao_dentro = (orig => () => {
  const b = orig();
  b.extras = () => (b.clientes || []).filter(Boolean);
  b.desenhaPorCima = ctx => desenhaBaloes(ctx, b);
  return b;
})(MAPAS_DEF.pensao_dentro);

function pensaoMesa(i) {
  const t = G.turno;
  if (!t || i >= t.mesas.length) { abrirPlaca('Uma banqueta no balcão. Os peões chegam para a janta das 17h às 21h.'); return true; }
  const m = t.mesas[i], mao = G.jog.carga || {};
  if (m.estado === 'pedido') { t.anotar(i); sons.tocar('letra', 1, 0.03, -2); }
  else if (m.estado === 'prato') {
    if (mao.id === 'prato') {
      if (mao.mesa !== i) avisar(`Esse prato é da banqueta ${mao.mesa + 1}.`);
      else if (t.servir(i)) { G.jog.carga = {}; sons.tocar('pousar', 1, 0.05, -2); }
    } else avisar(m.pronto ? 'O prato saiu! Pegue no balcão da Rosa e monte.' : 'A Rosa está preparando...');
  } else if (m.estado === 'comendo') avisar(`${m.cliente.nome} está comendo.`);
  else if (m.estado === 'suja') { t.limpar(i); sons.tocar('pegar', 1.4, 0.05, -6); }
  else avisar('Banqueta vazia.');
  sincronizaClientes();
  return true;
}
// Clique (ou X) no balcão corrido: o cliente da banqueta naquela coluna; senão, o balcão (montar).
function pensaoBalcaoCorrido(px) {
  const x = Math.floor((px ?? mouseMundo().x) / TILE);
  const i = SALAO.ASSENTOS.findIndex((a, k) => a[0] === x && G.turno && k < G.turno.mesas.length && G.turno.mesas[k].estado !== 'livre');
  return i >= 0 ? pensaoMesa(i) : pensaoBalcao();
}
function pensaoBalcao() {
  if (!G.turno) { abrirPlaca('O balcão de azulejo e o fogão da Rosa. Na hora da janta, os pratos saem daqui.'); return true; }
  if (G.jog.carga && G.jog.carga.id) { avisar('Primeiro leve o que está na mão.'); return true; }
  const i = G.turno.mesaPronta();
  if (i < 0) { avisar('Nenhum prato pronto ainda.'); return true; }
  abrirMontar(i);
  return true;
}
function pensaoMontou(i, componentes, bebida) {
  const t = G.turno;
  if (!t || !t.montar(i, componentes, bebida)) return;
  G.jog.carga = { id: 'prato', mesa: i, icone: iconePrato(t.mesas[i].prato) };
  avisar(`Prato da banqueta ${i + 1} na mão.`);
}

// O painel de montar (pausa o jogo enquanto aberto: sem pressa, sem reflexo).
function abrirMontar(i) {
  const m = G.turno.mesas[i], pr = Pratos.PRATOS[m.prato];
  const comps = [];
  for (const id of G.pensao.receitas) for (const c of Pratos.PRATOS[id].montar) if (!comps.includes(c)) comps.push(c);
  comps.push('salada');
  const escolhidos = new Set(); let bebida = '';
  const caixa = el('div', { class: 'painel montar' },
    el('div', { class: 'quem' }, `Bilhete da banqueta ${i + 1} (${m.cliente.nome})`),
    el('div', { class: 'bilhete' }, el('img', { src: urlItem('prato_' + m.prato) }),
      el('div', {}, el('b', {}, pr.nome + ': '), pr.montar.map(c => Pratos.COMPONENTES[c].toLowerCase()).join(', '), el('br'), 'Para beber: ' + Pratos.BEBIDAS[m.bebida])),
    el('div', { class: 'comps' }, comps.map(c => el('button', { class: 'botao comp', 'data-comp': c, onclick: e => { e.stopPropagation(); escolhidos.has(c) ? escolhidos.delete(c) : escolhidos.add(c); e.currentTarget.classList.toggle('forte'); sons.tocar('pegar', 1.3, 0.1, -8); } }, Pratos.COMPONENTES[c]))),
    el('div', { class: 'bebidas' }, Object.keys(Pratos.BEBIDAS).map(b => el('button', { class: 'botao', 'data-bebida': b, onclick: e => { e.stopPropagation(); bebida = bebida === b ? '' : b; caixa.querySelectorAll('[data-bebida]').forEach(x => x.classList.toggle('forte', x.dataset.bebida === bebida)); sons.tocar('agua', 1.4, 0.1, -10); } }, Pratos.BEBIDAS[b]))),
    el('div', { style: 'text-align:right;margin-top:10px' }, el('button', { class: 'botao verde pronto', onclick: e => { e.stopPropagation(); fecharModal(); pensaoMontou(i, [...escolhidos], bebida); } }, 'Pronto!')));
  abrirModal(caixa);
}

// ---------- a cena da Rosa (o show de faca do Bancho): não pausa ----------
function mostrarCenaRosa(prato) {
  let c = $('#cena');
  if (!c) { c = el('div', { id: 'cena', hidden: true }); document.body.append(c); }
  c.innerHTML = '';
  c.append(el('div', { class: 'cena-som' }, sorteio(SONS_ROSA)), el('img', { class: 'cena-rosa', src: 'a/retratos/rosa_cozinha_normal.webp' }),
    el('img', { class: 'cena-prato', src: urlItem('prato_' + prato) }));
  c.hidden = false;
  c.classList.remove('entra'); void c.offsetWidth; c.classList.add('entra');
  sons.tocar('agua', 0.6, 0.1, -4);
  clearTimeout(c._t1); clearTimeout(c._t2);
  c._t1 = setTimeout(() => { const r = c.querySelector('.cena-rosa'); if (r) r.src = 'a/retratos/rosa_cozinha_alegre.webp'; }, 800);
  c._t2 = setTimeout(() => { c.hidden = true; }, 1700);
}

// ---------- balões dos clientes (desenhados no mundo) e o passa-prato ----------
function desenhaBaloes(ctx, b) {
  const t = G.turno;
  if (!t) return;
  let k = 0;
  t.mesas.forEach(m => { if (m.estado === 'prato' && m.pronto && !m.montado) { desenhaPe(ctx, iconePrato(m.prato), (SALAO.COZINHA[0] - 0.6 - k) * TILE, SALAO.COZINHA[1] * TILE + 8, 1, 0.7); k++; } });
  t.mesas.forEach((m, i) => {
    if (m.estado === 'livre' || i >= SALAO.ASSENTOS.length) return;
    const a = SALAO.ASSENTOS[i];
    const x = (a[0] + 0.5) * TILE, y = a[1] * TILE - 92;
    ctx.save();
    if (m.estado === 'suja') { texto(ctx, '(louça suja)', x, y + 70, 15, 'rgba(255,255,255,.85)'); ctx.restore(); return; }
    if (m.estado === 'comendo') {
      const fr = FRASES_CLIENTE[m.reacao] || ['Hmm!'];
      texto(ctx, fr[(i + m.vezes) % fr.length], x, y + 8, 17, '#fff');
      if (m.reacao === 'coracao') desenhaFx(ctx, 'coracao', x, y - 18);
      ctx.restore(); return;
    }
    // Balão branco com o pedido (cinza enquanto a Rosa prepara), rabicho e paciência.
    desenhaFx(ctx, m.estado === 'prato' && !m.pronto ? 'balao_pensamento' : 'balao', x, y + 6);
    if (m.estado === 'pedido') texto(ctx, '!', x, y + 12, 34, '#e8452c', '900');
    else { ctx.globalAlpha = m.pronto ? 1 : 0.45; desenhaPe(ctx, iconePrato(m.prato), x, y + 20, 1, 0.82); ctx.globalAlpha = 1; }
    const lim = m.estado === 'pedido' ? TurnoJanta.PACIENCIA_PEDIDO : TurnoJanta.PACIENCIA_PRATO;
    const f = clamp(1 - m.espera / lim, 0, 1);
    // Paciência: o miolo colorido dentro da moldura de madeira (a/fx/barra_moldura).
    if (spr('fx/barra_moldura')) {
      desenhaFx(ctx, 'barra_moldura', x, y + 44);   // a moldura tem o miolo escuro: a cor vai por cima
      ctx.fillStyle = f > 0.5 ? '#5ec43a' : f > 0.25 ? '#e8c22c' : '#e8452c'; ctx.fillRect(x - 26, y + 42, 52 * f, 4);
    }
    ctx.restore();
  });
}
function texto(ctx, s, x, y, tam, cor, peso = '800') {
  ctx.font = `${peso} ${tam}px Nunito`; ctx.textAlign = 'center'; ctx.lineJoin = 'round';
  ctx.lineWidth = 5; ctx.strokeStyle = '#131b1b'; ctx.strokeText(s, x, y); ctx.fillStyle = cor; ctx.fillText(s, x, y);
}

// ---------- o selo da fama (o Cooksta do Bancho), embaixo, acima da barra ----------
function atualizaSeloPensao(selo, noSalao) {
  selo.hidden = !noSalao;
  if (!noSalao) return;
  const p = G.pensao, g = p.grau(), px = p.proximoDegrau();
  const r = G.turno ? G.turno.relatorio : null;
  const linha2 = `${p.curtidas} curtidas` + (r ? `  ·  Hoje: Cr$ ${r.ganho + r.gorjeta}  ·  ${r.servidos} servidos` : '');
  const chave = g + linha2 + p.progresso().toFixed(2);
  if (selo._k === chave) return;
  selo._k = chave;
  selo.innerHTML = '';
  selo.append(el('div', { class: 'grau' }, spr('ui/selo_' + g) ? el('img', { src: `a/ui/selo_${g}.webp`, class: 'selo-img' }) : null, 'Pensão da Rosa · ' + p.nomeGrau(g)), el('div', {}, linha2),
    px ? el('div', { class: 'progresso' }, el('div', { style: `width:${p.progresso() * 100}%` })) : null);
}
// O que falta para o próximo degrau, em texto.
function textoFalta(f) {
  const t = [];
  if (f.curtidas) t.push(`${f.curtidas} ${f.curtidas === 1 ? 'curtida' : 'curtidas'}`);
  if (f.sabor) t.push(`melhor sabor +${f.sabor} (caprichar no caderno)`);
  if (f.pesquisadas) t.push(`${f.pesquisadas} ${f.pesquisadas === 1 ? 'receita pesquisada' : 'receitas pesquisadas'}`);
  return t.length ? 'faltam ' + t.join(', ') : 'quase lá';
}
// ---------- A Pensão: os 6 degraus da fama, o que cada um pede e libera (a tela do Cooksta) ----------
function abrirPainelPensao() {
  const p = G.pensao, g = p.grau();
  const caixa = el('div', { class: 'painel painel-pensao' });
  caixa.append(el('div', { class: 'titulo', style: 'font-size:28px' }, 'A Pensão da Rosa'),
    el('div', { class: 'pp-resumo' }, `${p.curtidas} curtidas · melhor sabor ${p.melhorSabor()} · ${p.pesquisadas()} receitas pesquisadas · ${p.pitadas} pitadas · despesa da noite Cr$ ${p.despesa()}`));
  const lista = el('div', { class: 'pp-lista' });
  Pensao.DEGRAUS.forEach((d, i) => {
    const n = i + 1, atual = n === g, feito = n < g;
    const req = n === 1 ? 'O começo de tudo.' : [`${d.curtidas} curtidas`, d.sabor ? `sabor ${d.sabor}` : '', d.pesquisadas ? `${d.pesquisadas} pesquisadas` : ''].filter(Boolean).join(' · ');
    lista.append(el('div', { class: 'pp-degrau' + (atual ? ' atual' : feito ? ' feito' : '') },
      spr('ui/selo_' + n) ? el('img', { src: `a/ui/selo_${n}.webp` }) : el('div', { class: 'pp-num' }, n),
      el('div', {}, el('b', {}, d.nome + (atual ? '  ← agora' : feito ? '  ✓' : '')), el('div', { class: 'pp-req' }, req),
        el('div', { class: 'pp-libera' }, `${d.vagas} pratos no quadro · ${d.mesas} banquetas · ${d.clientes} clientes por noite · despesa Cr$ ${d.despesa}`))));
  });
  const px = p.proximoDegrau();
  caixa.append(lista, el('div', { class: 'pp-falta' }, px ? `Para "${px.nome}": ${textoFalta(px.falta)}.` : 'A pensão é Patrimônio da Vila! Não tem mais degrau para subir.'),
    el('div', { style: 'text-align:right;margin-top:8px' }, el('button', { class: 'botao forte', onclick: e => { e.stopPropagation(); fecharModal(); } }, 'Fechar')));
  abrirModal(caixa);
  sons.tocar('abrir', 1, 0.03, -6);
  return true;
}

// ---------- a noite: fecha a janta ou a Rosa serve sozinha; o relatório no resumo ----------
NOITE.push(linhas => {
  if (G.turno) encerrarJanta();
  if (pensaoAbreHoje() && G.pensao.ultimaJanta !== G.dia) {
    const f = mulberry(G.dia * 77);
    const rs = TurnoJanta.rosaSozinha(G.pensao, { randf: f, randi: () => Math.floor(f() * 4294967296) });
    G.pensao.registrarNoite(rs.estrelas, G.dia, 0);
    G.dinheiro += rs.ganho; G.ganhoHoje += rs.ganho;
    linhas.push(rs.servidos > 0 ? `A Rosa se virou sozinha na pensão: ${rs.servidos} PFs, Cr$ ${rs.ganho}.` : 'A pensão abriu, mas a despensa estava vazia: a Rosa só passou café.');
  } else if (G.relatorioPensao) {
    const r = G.relatorioPensao, p = G.pensao;
    const media = r.estrelas / Math.max(1, r.servidos);
    linhas.push(`Pensão da Rosa: ${r.clientes} clientes, ${r.servidos} pratos, Cr$ ${r.ganho} + Cr$ ${r.gorjeta} de gorjeta (${media.toFixed(1)} estrelas de média).`);
    if (r.embora) linhas.push(`   ${r.embora} ${r.embora === 1 ? 'foi' : 'foram'} embora sem comer.`);
    if (r.faltou.length) linhas.push(`   Faltou ingrediente para: ${r.faltou.map(id => Pratos.PRATOS[id] ? Pratos.PRATOS[id].nome : id).join(', ')}. ${r.cafes} ${r.cafes === 1 ? 'cliente tomou' : 'clientes tomaram'} só café.`);
    linhas.push(`   ${r.curtidas} ${r.curtidas === 1 ? 'curtida' : 'curtidas'} (clientes de 4 estrelas ou mais) · despesa da noite Cr$ ${r.despesa}${r.salarios ? ` · salários Cr$ ${r.salarios}` : ''} · ${r.bebidas || 0} bebidas${r.desperdicio ? ` · ${r.desperdicio} no lixo` : ''}.`);
    if (G.relatorioPensao.premioVip) linhas.push(`   O cliente especial adorou! Prêmio: Cr$ ${r.premioVip.dinheiro}, ${r.premioVip.curtidas} curtidas e ${r.premioVip.pitadas} pitadas.`);
    else if (r.vip === 'faltou') linhas.push('   O cliente especial foi embora decepcionado: faltou o prato que ele queria.');
    for (const e of r.pedidosFeitos || []) linhas.push(`   Pedido cumprido: ${e.quem} recebeu ${e.qtd} ${Pratos.PRATOS[e.prato].nome}. Prêmio: Cr$ ${e.premio}.`);
    if (r.subiu) linhas.push(`A pensão subiu de degrau: agora é "${p.nomeGrau(r.subiu)}"! Mais pratos no quadro, mais banquetas e mais clientes.`);
    else { const px = p.proximoDegrau(); if (px) linhas.push(`   Para "${px.nome}": ${textoFalta(px.falta)}.`); }
    linhas.push('   A Rosa: "' + ['Hoje até o Tonhão pediu bis!', 'Amanhã eu faço mais feijão.', 'O Severino lambeu o prato, Jocelino!', 'A pedra da sopa tá cansada.'][G.dia % 4] + '"');
  }
  G.relatorioPensao = null;
});
