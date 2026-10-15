// Jocelino — pensao_tela.js — a Pensão da Rosa jogável (o sushi bar do Bancho, no Dave the Diver): a reforma da casa da
// Dona Cotinha, a despensa, o quadro de giz (o "Today's Menu": o cardápio da noite montado antes de abrir), a janta das 17h até
// o último freguês (no palco: o pedido, o prato no passe da Rosa, levar a quem pediu, a bebida, a louça), os balões e as frases
// dos clientes, o selo da fama e o relatório no resumo da noite; se o Jocelino falta, a Rosa serve sozinha.
// Tradução das seções da pensão de jogo/principal.gd e das telas hud/cardapio_menu.gd e cena_rosa.gd, com as correções da
// revisão (prato preso na mão, aviso do café, pedra de obra, cardápio sem ingrediente).

const FRASES_CLIENTE = { coracao: ['Que sustância!', 'Tá aprovado!', 'Igual da minha mãe!'], suor: ['Arde, mas é bom!', 'Cadê a pedra?'],
  choro: ['Lembrei de Aracaju...', 'Que doce, meu Deus!'], nojo: ['Faltou coisa aqui...', 'Hmm...'] };
const SONS_ROSA = ['TSSSS!', 'PLOFT!', 'VAPT!', 'CHIIII!', 'TCHAN!'];

// ---------- estado e salvamento ----------
INICIADORES.push(s => { G.pensao = new Pensao(); G.pensao.deDict(s.pensao); G.turno = null; G.relatorioPensao = null; });
COLETORES.push(s => { s.pensao = G.pensao.paraDict(); });
MANHA.push(() => {
  if (typeof Guia !== 'undefined' ? Guia.liberado('pensao') : G.dia >= 2) G.pensao.abrirReforma();
  G.pensao.manha(G.dia);
  if (typeof marmitaDaManha === 'function') marmitaDaManha();   // (depois da pensão abrir: no dia da inauguração já tem marmita)
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
    if (f) {
      const p = G.pensao, amp = p.ampliacoes || [], aberta = ['pronta', 'aberta'].includes(e);
      // (as 5 etapas: fechada e limpando, a fachada velha; do telhado à pintura, a obra; pronta, a pensão com o letreiro)
      let nome = ['fechada', 'limpar'].includes(e) ? 'objetos/pensao_fechada' : ECO.reforma.some(x => x.id === e) ? 'objetos/pensao_reforma' : 'objetos/pensao', pe = [13, 8, 5, 4];
      if (aberta && p.obra) { nome = 'objetos/pensao_obra'; pe = [13, 9, 5, 5]; }
      else if (aberta && amp.includes('sobrado')) { nome = 'objetos/pensao_sobrado'; pe = [12, 8, 7, 4]; }
      else if (aberta && amp.includes('varanda')) { nome = 'objetos/pensao_ampliada'; pe = [12, 8, 7, 4]; }
      const placa = aberta ? 'Pensão da Rosa' : 'Pensão da Dona Cotinha';
      if ((f.pe || [13, 8, 5, 4]).join() === pe.join()) { f.nome = nome; f.placa = placa; }
      else { vila.tirar(f); const n = vila.interativo('pensao', nome, ...pe); Object.assign(n, { acao: f.acao, placa, pe }); vila.pensao = n; }
    }
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
  if (vila) poePlacaPatrimonio(vila);
}
// O letreiro da fachada (a arte objetos/pensao_letreiro, do Higgsfield): só depois da pintura (pronta ou aberta), por cima da
// plaquinha da arte da fachada (LETREIROS), 1,5 vez a largura dela (conferido na foto reforma_fachada da s30; sem a arte, nada).
const LETREIRO_PENSAO = { arte: 'objetos/pensao_letreiro', largura: 1.5 };
EXTRAS_MUNDO.push(m => {
  if (!m || m.id !== 'vila' || !G.pensao || !['pronta', 'aberta'].includes(G.pensao.estado)) return [];
  const f = m.objs.find(o => o.id === 'pensao'), L = f && LETREIROS[f.nome]; if (!L) return [];
  return [{ tipo: 'camada', y: f.y + 0.1, desenha(ctx) {
    const img = spr(LETREIRO_PENSAO.arte), fa = spr(f.nome); if (!img || !fa) return;
    const w = L.w * LETREIRO_PENSAO.largura, h = w * img.naturalHeight / img.naturalWidth;
    ctx.drawImage(img, f.x - fa.naturalWidth / 2 + L.x - w / 2, f.y - fa.naturalHeight + L.y - h / 2, w, h);
  } }];
});

// ---------- reforma ----------
function pensaoFachada() {
  if (G.pensao.estado === 'fechada') {
    const L = typeof Lojinha !== 'undefined' ? Lojinha.estado() : null;
    if (L && L.conversou) {
      perguntar(`A lojinha da Dona Cotinha, à venda. Entrada: Cr$ ${ECO.lojinha.entrada} (o resto em ${ECO.lojinha.parcelas} domingos de Cr$ ${ECO.lojinha.parcela}).`, [`Comprar (Cr$ ${ECO.lojinha.entrada})`, 'Agora não'], i => {
        if (i !== 0) return; const r = Lojinha.comprar();
        if (r === 'ok') { sons.tocar('fanfarra', 1, 0, -4); atualizarPensaoMundo(); hudSujo(); abrirPlaca('A chave é de vocês! A Rosa chorou. Agora a reforma: comece limpando o salão.'); }
        else abrirPlaca(`Ainda falta: Cr$ ${ECO.lojinha.entrada - G.dinheiro} para a entrada.`);
      });
      return true;
    }
    abrirPlaca(L && L.sonho ? 'Uma lojinha fechada, com tábuas na porta. A Rosa quer conversar com você sobre ela.' : 'Uma pensão abandonada, com tábuas na porta. Uma placa apagada: "Pensão da Dona Cotinha".');
    return true;
  }
  if (G.pensao.obra && !G.pensao.obra.hoje && typeof trabalharNaObra === 'function') {
    perguntar(`A obra da pensão (${Ampliacao.dados(G.pensao.obra.id).nome}) está esperando: faltam ${G.pensao.obra.falta} dias.`, ['Trabalhar na obra (gasta energia)', 'Entrar na pensão', 'Agora não'],
      i => { if (i === 0) { trabalharNaObra(); atualizarPensaoMundo(); } else if (i === 1) { if (pensaoNoPalco()) entrarPalco(); else entrarPalco(); } });
    return true;
  }
  if (typeof pensaoNoPalco === 'function' && pensaoNoPalco()) { entrarPalco(); return true; }
  // Na reforma, a entrega é na porta: a Rosa pergunta se entrega o material que o Jocelino trouxe.
  const p = G.pensao, leva = Object.entries(p.faltaMaterial()).map(([it, f]) => [it, Math.min(G.mochila.total(it), f)]).filter(([, n]) => n > 0);
  if (leva.length) {
    const lista = leva.map(([it, n]) => Itens.qtd(n, it)).join(', ');
    perguntar(`Rosa: "Trouxe material pra reforma?"`, [`Entregar ${lista}`, 'Entrar no salão', 'Agora não'], i => {
      if (i === 0) { const txt = p.entregar(G.mochila, G.dia); atualizarPensaoMundo(); hudSujo(); sons.tocar('madeira', 0.8, 0.08, -4); sons.tocar('feito', 1, 0.03, -6); abrirPlaca(txt); }
      else if (i === 1) { entrarPalco(); sons.tocar('porta', 1, 0.05, -4); }
    });
    return true;
  }
  entrarPalco();
  sons.tocar('porta', 1, 0.05, -4);
  return true;
}
ATUALIZADORES.push(() => {
  if (G.pensao.estado !== 'limpar' || G.mapaId !== 'pensao_dentro') return;
  if (!G.mapa.objs.some(o => o.tipo === 'detrito')) {
    G.pensao.limpou();
    atualizarPensaoMundo();
    sons.tocar('feito', 1, 0.03, 0);
    abrirPlaca('Salão limpo! Agora o telhado: o material entregue à Rosa e os dias de trabalho no salão.');
  }
});
function pensaoPlaquinha() {
  const p = G.pensao;
  if (p.estado === 'limpar') abrirPlaca(`Rosa: "Primeiro a limpeza, amor: clique em cada sujeira do chão. Faltam ${sujeirasDaReforma().length}."`);
  else if (emReforma()) {   // (do telhado à pintura) a Rosa recebe o material da etapa; o trabalho é no lugar dela, no salão
    const E = ECO.reforma.find(x => x.id === p.estado), txt = p.entregar(G.mochila, G.dia);
    if (txt) { atualizarPensaoMundo(); hudSujo(); sons.tocar('feito', 1, 0.03, 0); abrirPlaca(`${txt}`); }
    else { const falta = Object.entries(p.faltaMaterial());
      abrirPlaca(falta.length ? `Rosa: "${E.nome}: ainda falta ${falta.map(([i, q]) => Itens.qtd(q, i)).join(', ')}, amor."`
        : p.comecaAmanha(G.dia) ? `Rosa: "O material já tá aqui. ${E.nome}: amanhã a gente começa, amor, que hoje já teve reforma."`
        : p.feitaHoje(G.dia) ? `Rosa: "Por hoje chega, amor: ${minuscula(E.nome)}, amanhã tem mais (falta${E.dias - (p.reforma.dias || 0) > 1 ? 'm' : ''} ${E.dias - (p.reforma.dias || 0)} dia(s))."`
        : `Rosa: "O material já tá aqui. ${E.nome}: agora é trabalho, ${E.dias - (p.reforma.dias || 0)} dia(s) no salão."`); }
  } else if (p.estado === 'pronta') abrirPlaca('Tudo pronto! A Pensão da Rosa abre amanhã. A janta começa às 17h e vai até o último freguês.');
  else if (p.estado === 'aberta') abrirPainelPensao();
  return true;
}
TAREFAS.push(() => {
  const p = G.pensao;
  if (!p) return [];
  if (p.estado === 'limpar') return [{ texto: 'Pensão: limpar o salão (a casa amarela da Dona Cotinha, na Vila, ao lado do depósito)', feito: SUJEIRA_PALCO.length - sujeirasDaReforma().length, meta: SUJEIRA_PALCO.length, mapa: 'pensao' }];
  const E = ECO.reforma.find(x => x.id === p.estado);
  if (E) {   // (do telhado à pintura) primeiro o material para a Rosa; depois os dias de trabalho no salão
    const pede = Object.values(E.material).reduce((a, q) => a + q, 0), falta = Object.values(p.faltaMaterial()).reduce((a, q) => a + q, 0);
    // (revisão final) Sem o material na mochila, a linha diz onde buscar; com ele, onde fica a pensão.
    const fr = typeof faltaDaReforma === 'function' ? faltaDaReforma() : null;
    if (falta > 0) return [{ texto: `Pensão — ${E.nome}: ${Object.keys(E.material).map(i => Itens.nome(i).toLowerCase()).join(' e ')} para a Rosa (${fr ? origemDoMaterial(fr.item) : 'a pensão é a casa amarela da Dona Cotinha, na Vila, ao lado do depósito'})`, feito: pede - falta, meta: pede }];
    return [{ texto: p.comecaAmanha(G.dia) ? `Pensão — ${E.nome}: começa amanhã (a reforma de hoje já foi)` : p.feitaHoje(G.dia) ? `Pensão — ${E.nome}: amanhã tem mais (o trabalho de hoje já foi)` : `Pensão — ${E.nome}: dias de trabalho no salão (clique no lugar da obra)`, feito: p.reforma.dias || 0, meta: E.dias, mapa: 'pensao' }];
  }
  if (pensaoAbreHoje() && p.ultimaJanta !== G.dia && G.minutos < 20 * 60) return [{ texto: 'Janta na Pensão da Rosa às 17h', lembrete: true }];   // (lembrete fixo: não tira as ideias do quadro)
  return [];
});

// (a despensa está em despensa.js)

// (14/10, Tarefa D1) A categoria e o tempo de fogo do prato, para o quadro e o caderno: "Caldo e cozido · pronto em ~7 s".
// (revisão da D1) O tempo de verdade: o do prato vezes o fator da noite (o fogão, a equipe e a Rosa como chef), o mesmo do iniciarJanta.
function fatorDePreparo(p) { const b = typeof bonusMelhorias === 'function' ? bonusMelhorias(p) : { preparo: 1 }; return (typeof Equipe !== 'undefined' ? Equipe.preparo(p) : 1) * b.preparo * (typeof Chef !== 'undefined' ? Chef.preparo(p) : 1); }
const textoCozinha = id => `${nomeCategoria(id)} · pronto em ~${(Math.round(TurnoJanta.preparoDe(id) * (G.pensao ? fatorDePreparo(G.pensao) : 1) * 10) / 10).toLocaleString('pt-BR')} s`;
// ---------- o quadro de giz: o cardápio da noite (o "Today's Menu" do Bancho; o cardápio do Bancho, 13/10) ----------
// Às 17h, ao entrar no salão (ou já dentro), o quadro abre sozinho e a janta espera: o modal pausa o jogo (não há turno, ninguém
// chega e a paciência não corre) até "Abrir a pensão", que faz as panelas na hora (montarNoite: os ingredientes saem da
// despensa) e começa a janta. O quadro vem com a escolha da noite anterior (p.cardapioNoite). Três jeitos do mesmo quadro:
// - 'abertura': a janta esperando (o botão "Abrir a pensão");
// - 'durante': no meio da janta (o Dave: abrir o cardápio no meio do turno pausa e deixa repor e ligar o Auto Supply): mais uma
//   panela agora e o "Rosa repõe";
// - 'plano': fora da hora (de manhã, no domingo, depois da janta): a escolha fica guardada para a noite.
// A arte é o tema do restaurante (a/ui/pensao, do Higgsfield: a lousa, as tábuas, a divisória e os enfeites de giz).
const jantaEsperaCardapio = () => !!G.pensao && !G.turno && pensaoAbreHoje() && G.pensao.ultimaJanta !== G.dia && G.minutos >= TurnoJanta.ABRE && G.minutos < 20 * 60;
const SEM_PEDRA = { randf: () => 1, randi: () => 0 };   // (a conta do quadro não sorteia a pedra da sopa de volta)
const rngDaNoite = k => { const f = mulberry(k); return { randf: f, randi: () => Math.floor(f() * 4294967296) }; };
// (onda final) A conta do quadro EM SEQUÊNCIA, na mesma ordem do montarNoite e sobre UMA cópia da despensa: cada prato da escolha
// faz as panelas que a despensa ainda dá depois dos de antes dele (os pratos dividem o ovo e o arroz), até as vagas do degrau.
// Antes, cada prato descontava todas as panelas dos outros: dois pratos com o mesmo ovo escasso ficavam os dois "fora do quadro"
// e o "Abrir" fazia as panelas do primeiro sem aviso. Devolve { efe: {prato: panelas que vai fazer}, da: {prato: panelas que a
// despensa dá na vez dele}, antes: {prato: a despensa na vez dele}, sobra: a cópia depois de todos (o prato fora da escolha
// entra no fim: é o que a despensa dá depois do quadro) }.
function contaDoQuadro(p, escolha) {
  const q = Object.create(p); q.despensa = Object.assign({}, p.despensa);
  const r = { efe: {}, da: {}, antes: {}, sobra: q, semVaga: new Set() }, ocupa = new Set(p.pratosDaNoite());
  for (const id of Object.keys(escolha || {})) {
    if (!p.receitas.includes(id)) continue;
    const n = escolha[id].panelas | 0;
    r.antes[id] = Object.assign({}, q.despensa); r.da[id] = Math.min(99, q.rende(id));
    if (n <= 0) continue;
    if (!ocupa.has(id) && ocupa.size >= p.vagas()) { r.efe[id] = 0; r.semVaga.add(id); continue; }   // (o montarNoite: não coube no quadro)
    let k = 0; for (; k < n && q.rende(id) > 0; k++) q.consumir(id, SEM_PEDRA);
    r.efe[id] = k; if (k) ocupa.add(id);
  }
  return r;
}
// Quantas panelas do prato a despensa dá na vez dele (o prato fora da escolha: depois de todas as panelas do quadro).
const daNaVez = (C, id) => id in C.da ? C.da[id] : Math.min(99, C.sobra.rende(id));
function panelasQueDa(p, escolha, id) { return daNaVez(contaDoQuadro(p, escolha), id); }
// (correção 1) O que falta para uma panela do prato, com o que as panelas de antes dele já separaram ("ovo (as panelas do quadro gastam)").
function faltaNoQuadro(p, C, id) {
  const P = Pratos.PRATOS[id], q = Object.create(p);
  q.despensa = id in C.antes ? C.antes[id] : C.sobra.despensa;
  const f = Object.keys(P.porcao).filter(x => q._tem(x) < P.porcao[x]);
  return listaE(f.map(nomeNaPanela)) + (f.some(x => p._tem(x) >= P.porcao[x]) ? ' (as panelas do quadro gastam)' : '');
}
// Os convidados da festa do tema (3, e mais 2 com a varanda) e quantos clientes a noite costuma ter (o "~N" do quadro): os da
// noite (clientesHoje) mais os convidados que o iniciarJanta põe na fila (inauguração, festa, festa do Patrimônio, o VIP).
const convidadosDaFesta = () => ECO.pensao.convidados.festa + (typeof temAmpliacao === 'function' && temAmpliacao('varanda') ? ECO.pensao.convidados.varanda : 0);
function clientesEsperados() {
  const p = G.pensao, ev = t => typeof Eventos !== 'undefined' ? Eventos.hoje(p, G.dia, t) : null;
  return clientesHoje() + (p.ultimaJanta === -1 && !p.fama ? ECO.pensao.convidados.inauguracao : 0) + (p.festaDia === G.dia ? ECO.pensao.premio5.festaClientes : 0)
    + (ev('festa') ? convidadosDaFesta() : 0) + (ev('vip') ? 1 : 0);
}
// (tarefa 6) O quadro dos robôs de teste (s20 e s23, o mesmo para os dois): como um jogador que conta, o prato mais caro que a
// despensa dá, as panelas para os clientes que a noite costuma ter (o "~N" do quadro), o "Rosa repõe" ligado; se a despensa não
// dá panelas bastantes, o próximo prato completa (até as vagas). Grava em p.cardapioNoite e devolve a escolha.
function quadroDoRobo(p) {
  const esc = {}; let falta = clientesEsperados();
  for (const id of p.receitas.filter(i => p.rende(i) > 0).sort((a, b) => p.preco(b, 1) - p.preco(a, 1))) {
    if (falta <= 0 || Object.keys(esc).length >= p.vagas()) break;
    const k = p.porcoesPorPanela(id), n = Math.min(panelasQueDa(p, esc, id), Math.ceil(falta / k));
    if (n > 0) { esc[id] = { panelas: n, repoe: true }; falta -= n * k; }
  }
  p.cardapioNoite = esc;
  return esc;
}
// O que o ingrediente da receita é na panela: "1 peixe", "2 peixes", "1 farinha", "2 cocos".
const ingredienteNaPanela = (k, q) => k === 'peixe' ? (q === 1 ? '1 peixe' : q + ' peixes') : q === 1 ? '1 ' + nomeNaPanela(k) : q + ' ' + Itens.plural(nomeNaPanela(k));
const panelasTxt = n => `${n} ${n === 1 ? 'panela' : 'panelas'}`;
const listaE = a => a.length < 2 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' e ' + a[a.length - 1];   // "a, b e c"
// As panelas que o prato vai mesmo fazer: no plano, as escolhidas; na abertura, as da conta em sequência (0 se a despensa não dá
// nenhuma na vez dele: o prato fica fora do quadro hoje). Na abertura o quadro MOSTRA o que dá hoje, mas a escolha guardada
// (p.cardapioNoite) não muda sozinha: é o cardápio que o jogador montou (o Dave), e só o − e o + dele a mudam.
const panelasEfetivas = (C, esc, id, modo) => { const n = ((esc[id] || {}).panelas | 0); return modo === 'plano' || !n ? n : (C.efe[id] || 0); };
// Os avisos do quadro: a inauguração, o VIP, a festa e o prato que não aguenta a noite (C: a conta em sequência do quadro).
function avisosDoQuadro(p, esc, modo = 'abertura', C = contaDoQuadro(p, esc)) {
  const r = [], ev = t => typeof Eventos !== 'undefined' ? Eventos.hoje(p, G.dia, t) : null, vip = ev('vip'), festa = ev('festa'), nome = id => Pensao.prato(id).nome;
  if (p.ultimaJanta === -1 && !p.fama) r.push(`Hoje é a inauguração: a Vila vem convidada (${ECO.pensao.convidados.inauguracao} a mais). A festa começa quando a pensão abrir.`);
  if (p.festaDia === G.dia) r.push('Hoje é a festa do Patrimônio: a Vila inteira vem comemorar.');
  // (correção 1) o VIP fora do quadro: só promete o prato à parte se a despensa ainda dá, depois de todas as panelas do quadro
  if (vip) { const v = vipDe(vip.id), noQuadro = panelasEfetivas(C, esc, vip.prato, modo) > 0 || p.porcoes(vip.prato) > 0;
    r.push(`Hoje ${v.nome} pede ${nome(vip.prato)}` + (noQuadro ? '.' : C.sobra.rende(vip.prato) > 0 ? ': fora do quadro, a Rosa faz à parte com a despensa.' : ', e falta ingrediente na despensa!')); }
  if (festa) r.push(`Hoje é a ${festa.nome}: ${nome(festa.prato)} vale 50% mais e os convidados pedem ele` + (panelasEfetivas(C, esc, festa.prato, modo) > 0 ? '.' : ' — fora do quadro: ponha uma panela.'));
  // O prato que não aguenta a noite: as porções que o quadro vai fazer (e, com o repõe, o que a despensa ainda dá depois delas, um
  // prato de cada vez, na mesma ordem) contra os clientes de sempre.
  const N = clientesEsperados(), cheios = Object.keys(C.efe).filter(id => C.efe[id] > 0);
  let panelas = 0, porcoes = 0, aguenta = 0;
  const resto = Object.create(p); resto.despensa = Object.assign({}, C.sobra.despensa);
  for (const id of cheios) { const n = C.efe[id], k = p.porcoesPorPanela(id); panelas += n; porcoes += n * k; aguenta += n * k;
    if (esc[id].repoe) for (let j = 0; j < 99 && resto.rende(id) > 0; j++) { resto.consumir(id, SEM_PEDRA); aguenta += k; } }
  if (cheios.length && aguenta < N) r.push(`${cheios.length === 1 ? nome(cheios[0]) : 'No quadro'}: ${panelasTxt(panelas)} = ${porcoes} porções; a noite costuma ter ~${N} clientes. Quem ficar sem prato leva o prato da casa.`);
  return r;
}
function pensaoQuadro() {
  const p = G.pensao;
  if (p.estado !== 'aberta') { abrirPlaca('O quadro de giz ainda está em branco. A Rosa escreve o cardápio quando a pensão abrir.'); return true; }
  const modo = G.turno ? 'durante' : jantaEsperaCardapio() ? 'abertura' : 'plano';
  // A escolha é o próprio cardápio da noite (só receitas do caderno). (onda final) Ela não muda sozinha: na abertura o quadro mostra
  // as panelas que a despensa dá hoje (a conta em sequência), e a escolha guardada continua a que o jogador montou (o Dave).
  const esc = {};
  for (const [id, e] of Object.entries(p.cardapioNoite || {})) if (p.receitas.includes(id)) esc[id] = { panelas: Math.max(0, e.panelas | 0), repoe: e.repoe !== false };
  p.cardapioNoite = esc;
  const lousa = el('div', { class: 'lousa quadro-cardapio ' + modo });
  let filtro = '';   // (Tarefa D1) a categoria escolhida no filtro do quadro ('' = todas)
  const marca = k => { if (G.limpou) G.limpou[k] = (G.limpou[k] || 0) + 1; };
  // (14/10, o jogador: "quando clico para adicionar uma panela a tela do cardápio dá uma piscada") O redesenho monta tudo fora da tela
  // e troca de uma vez (replaceChildren), guardando a rolagem e a fala da Rosa (que nascia escondida e piscava até o guia reescrever).
  const desenha = () => {
    const rolagem = lousa.scrollTop, f0 = lousa.querySelector('.qc-rosa'), fVis = !!(f0 && !f0.hidden), fTxt = f0 ? f0.querySelector('.guia-faixa-texto').textContent : '';
    const caixa = el('div');
    const CQ = contaDoQuadro(p, esc), efe = id => panelasEfetivas(CQ, esc, id, modo);
    const ocupa = modo === 'durante' ? new Set(p.pratosDaNoite()) : new Set(Object.keys(esc).filter(id => efe(id) > 0));
    const temVaga = id => ocupa.has(id) || ocupa.size < p.vagas();
    const ev = t => typeof Eventos !== 'undefined' ? Eventos.hoje(p, G.dia, t) : null, vip = ev('vip'), festa = ev('festa');
    // Os pratos do quadro: os escolhidos (e os que estão na panela), depois os que a despensa dá; o resto vai numa linha só.
    // (correção 1) o escolhido que a despensa já não dá fica na lista, desmarcado, com o que falta (a escolha fica para amanhã)
    const lista = [...new Set([...Object.keys(esc).filter(id => efe(id) > 0), ...(modo === 'durante' ? p.pratosDaNoite() : []), ...Object.keys(esc).filter(id => esc[id].panelas > 0),
      ...p.receitas.filter(id => p.rende(id) > 0)])].filter(id => p.receitas.includes(id));
    const sem = p.receitas.filter(id => !lista.includes(id));
    // (Tarefa D1) o filtro por categoria: só as categorias que estão na lista; o filtro só esconde a linha (a escolha guardada e as
    // panelas dos pratos escondidos não mudam)
    const cats = Object.keys(CATEGORIAS).filter(c => lista.some(id => categoriaDe(id) === c));
    if (filtro && !cats.includes(filtro)) filtro = '';
    const depois = modo === 'plano' && (p.ultimaJanta === G.dia || G.minutos >= 20 * 60);
    caixa.append(el('div', { class: 'giz-titulo' }, depois ? 'Cardápio de amanhã' : 'Cardápio da noite'),
      el('div', { class: 'qc-topo' }, el('span', {}, p.nomeComEstrelas()), el('span', { class: 'qc-vagas' }, `Vagas no quadro: ${ocupa.size} de ${p.vagas()}`),
        el('span', {}, `A noite costuma ter ~${clientesEsperados()} clientes`)),
      // (15/10, a clareza) a panela, a porção, as vagas, o "Rosa repõe" e o prato da casa: uma linha e o "(?)"
      linhaAjuda('quadro', 'Cada panela dá algumas porções (1 porção = 1 cliente); a sobra vai para o lixo.',
        [GLOSSARIO.vagasQuadro, GLOSSARIO.panela, GLOSSARIO.precoPanela, GLOSSARIO.repoe, GLOSSARIO.casa, GLOSSARIO.sobra, GLOSSARIO.curtida]));
    if (modo !== 'durante') for (const a of avisosDoQuadro(p, esc, modo, CQ)) caixa.append(el('div', { class: 'qc-aviso' }, a));
    else caixa.append(el('div', { class: 'qc-aviso' }, 'A janta está correndo (o relógio parou aqui): mais uma panela agora, ou ligue e desligue o "Rosa repõe".'));
    // (correção 1) A fala da Rosa na primeira vez: uma faixa fixa na lousa, acima da lista (guia_setas.js escreve nela; a seta fica no elemento).
    caixa.append(el('div', { class: 'guia-faixa qc-rosa', hidden: true }, el('img', { src: urlArte('retratos/rosa_normal'), alt: '' }), el('div', { class: 'guia-faixa-texto' })));
    if (cats.length > 1) caixa.append(el('div', { class: 'qc-filtro' }, ...[''].concat(cats).map(c => el('button', { class: 'tabua mini qc-cat' + (filtro === c ? ' acesa' : ''), 'data-cat': c,
      onclick: e2 => { e2.stopPropagation(); filtro = c; sons.tocar('cursor', 1.1, 0.04, -8); desenha(); } }, c ? CATEGORIAS[c] : 'Todos'))));
    const corpo = el('div', { class: 'qc-lista' });
    lista.filter(id => !filtro || categoriaDe(id) === filtro).forEach((id, i) => {
      const P = Pratos.PRATOS[id], e0 = esc[id] || { panelas: 0, repoe: true }, k = p.porcoesPorPanela(id), m = daNaVez(CQ, id);
      const e = { panelas: modo === 'durante' ? e0.panelas : efe(id), repoe: e0.repoe };   // (na abertura, o que a despensa dá)
      const marcado = modo === 'durante' ? p.porcoes(id) > 0 : e.panelas > 0;
      const guardado = modo === 'abertura' && !e.panelas && e0.panelas > 0;   // (escolhido, mas a despensa não dá hoje)
      const tag = vip && vip.prato === id ? ' · o pedido do VIP' : festa && festa.prato === id ? ' · o prato da festa' : festa && festa.categoria && categoriaDe(id) === festa.categoria ? ` · ${CATEGORIAS[festa.categoria].toLowerCase()}: vale 50% mais na festa` : '';
      const info = modo === 'durante' ? `Na panela: ${p.porcoes(id)} porções · a despensa dá mais ${panelasTxt(p.rende(id))} (${k} porções cada)`
        : modo === 'abertura' && CQ.semVaga.has(id) ? `${p.textoPreco(id)} · cada panela dá ${k} porções · não coube no quadro (vagas: ${p.vagas()})${tag}`   // (correção 2)
        : modo === 'abertura' && !m ? `${p.textoPreco(id)} · cada panela dá ${k} porções · falta ${faltaNoQuadro(p, CQ, id)}${tag}`
        : `${p.textoPreco(id)} · cada panela dá ${k} porções · a despensa dá ${panelasTxt(m)}${modo === 'plano' && e.panelas > m ? ' hoje' : ''}`
          + (modo === 'abertura' && e.panelas > 0 && e0.panelas > e.panelas ? ` (o cardápio guardado pede ${e0.panelas})` : '') + tag;
      const realce = modo !== 'durante' && !marcado && ((festa && festa.prato === id) || (vip && vip.prato === id));   // o prato da festa ou do VIP fora do quadro
      const mexe = (d, comoNome) => ev2 => { ev2.stopPropagation();
        if (modo === 'durante') {   // mais uma panela agora, na hora (o Dave: repor no meio do turno)
          if (!temVaga(id)) { avisar(`Só cabem ${p.vagas()} pratos no quadro (a fama abre mais).`); return; }
          const r = p.prepararPanela(id, 1, rngDaNoite(G.dia * 53 + p.porcoes(id) + 7));
          if (!r.feitas) { avisar(`Falta ${listaE(r.faltou.map(nomeNaPanela))} na despensa.`); return; }
          // (onda final) a panela de agora é só desta noite: não soma no cardápio guardado (o de amanhã); o prato novo entra com 0
          // panelas, só para a Rosa saber se repõe
          esc[id] = Object.assign({ panelas: 0, repoe: true }, esc[id]);
          sons.tocar('prato_tchan', 0.9, 0.05, -4); avisar(`A Rosa fez mais uma panela de ${P.nome}: ${p.porcoes(id)} porções.`); desenha(); return;
        }
        // (tarefa 6) o prato guardado que a despensa não dá hoje: o − tira a escolha guardada (o Dave: o jogador limpa o cardápio quando quiser)
        if (d < 0 && guardado) { esc[id] = { panelas: 0, repoe: e0.repoe }; marca('cardapio_panela'); sons.tocar('cursor', 1, 0.04, -8); desenha(); return; }
        if ((comoNome && e.panelas > 0) || (d < 0 && !e.panelas)) return;   // (o nome só põe no quadro; tirar é no −)
        if (d > 0 && e.panelas === 0 && !temVaga(id)) { avisar(`Só cabem ${p.vagas()} pratos no quadro (a fama abre mais).`); return; }
        if (d > 0 && modo === 'abertura' && e.panelas >= m) { avisar(m ? `A despensa só dá ${panelasTxt(m)} de ${P.nome}.` : `Falta ingrediente para ${P.nome} na despensa.`); return; }
        const novo = !e.panelas;
        esc[id] = { panelas: clamp(e.panelas + d, 0, 99), repoe: esc[id] ? esc[id].repoe : true };   // (prato que nunca esteve no quadro: repõe ligado)
        if (d > 0 && novo) marca('cardapio_prato'); if (!comoNome) marca('cardapio_panela');
        sons.tocar('cursor', 1, 0.04, -8); desenha(); };
      const podeMais = modo === 'durante' ? p.rende(id) > 0 && temVaga(id) : (e.panelas > 0 || temVaga(id)) && (modo === 'plano' || e.panelas < m);
      const linha = el('div', { class: 'qc-prato' + (marcado ? ' marcado' : '') + (realce ? ' realce' : ''), 'data-prato': id },
        el('img', { src: urlArte(iconePratoGrande(id)), alt: '' }),
        el('div', { class: 'qc-meio' }, el('div', { class: 'qc-nome giz', 'data-guia': 'prato', title: P.desc, onclick: mexe(1, true) }, P.nome), el('div', { class: 'qc-cat-info' }, textoCozinha(id)), el('div', { class: 'qc-info' }, info)),
        el('div', { class: 'qc-panelas' },
          modo === 'durante' ? null : el('button', { class: 'tabua mini qc-menos' + (e.panelas > 0 || guardado ? '' : ' desligada'), 'data-guia': 'menos', onclick: mexe(-1),
            title: guardado ? 'Tira do cardápio guardado' : null }, '−'),
          modo === 'durante' ? null : el('span', { class: 'qc-conta' }, e.panelas > 0 ? `${panelasTxt(e.panelas)} = ${e.panelas * k} porções` : 'fora do quadro'),
          el('button', { class: 'tabua mini qc-mais' + (podeMais ? '' : ' desligada'), 'data-guia': 'mais', onclick: mexe(1) }, modo === 'durante' ? '+ 1 panela agora' : '+')),
        el('button', { class: 'tabua qc-repoe' + (e.repoe ? ' acesa' : ' desligada'), 'data-guia': 'repoe', style: marcado ? '' : 'visibility:hidden',
          title: 'Ligado: quando a panela acaba, a Rosa faz outra com a despensa. Desligado: o prato sai do quadro.',
          onclick: ev2 => { ev2.stopPropagation(); esc[id] = Object.assign({ panelas: 0 }, esc[id], { repoe: !e0.repoe }); sons.tocar('cursor', 1.2, 0.04, -8); desenha(); } },
          e.repoe ? 'Rosa repõe' : 'Não repõe'));
      if (i) corpo.append(el('div', { class: 'giz-divisoria' }));
      corpo.append(linha);
    });
    if (!lista.length) corpo.append(el('div', { class: 'qc-aviso' }, 'A despensa não dá nenhum prato hoje: traga ingrediente (a Mercearia, o píer, a horta).'));
    caixa.append(corpo);
    if (sem.length) caixa.append(el('div', { class: 'qc-sem' }, 'Sem ingrediente: ' + sem.map(id => { const P = Pratos.PRATOS[id], f = Object.keys(P.porcao).filter(x => p._tem(x) < P.porcao[x]);
      return `${P.nome} (falta ${listaE(f.map(nomeNaPanela))})`; }).join(' · ')));
    // (Tarefa C) cada bebida com o preço dela (pago à parte)
    const C = ECO.pensao.pratoCasa, beb = (typeof bebidasDaPensao === 'function' ? bebidasDaPensao(p) : Object.keys(Pratos.BEBIDAS)).map(b => Pratos.BEBIDAS[b].toLowerCase() + (TurnoJanta.precoBebida(b) ? ` (Cr$ ${TurnoJanta.precoBebida(b)})` : b === 'cafe' ? ' (de graça; na medida antes do prato, +30% no prato)' : ' (de graça)'));
    caixa.append(el('div', { class: 'qc-casa' }, `Sempre tem: ${C.nome} (Cr$ ${C.preco}, sem curtida) e ${beb.join(', ')}.`));
    const principal = modo === 'abertura' ? el('button', { class: 'tabua acesa qc-abrir', 'data-guia': 'abrir', onclick: e2 => { e2.stopPropagation(); abrirAPensao(); } }, 'Abrir a pensão')
      : el('button', { class: 'tabua acesa', onclick: e2 => { e2.stopPropagation(); fecharModal(); } }, modo === 'durante' ? 'Voltar ao salão' : 'Guardar o cardápio');
    caixa.append(el('div', { class: 'qc-rodape' },
      el('img', { class: 'giz-enfeite palmeira', src: urlArte('ui/pensao/palmeirinha_giz'), alt: '' }),
      el('button', { class: 'tabua', onclick: e2 => { e2.stopPropagation(); _aoFecharModal = null; fecharModal(); _voltaAoQuadro = modo === 'abertura'; abrirCaderno(); } }, 'Caderno'),
      el('img', { class: 'giz-enfeite seta', src: urlArte('ui/pensao/seta_giz'), alt: '' }), principal,
      el('img', { class: 'giz-enfeite seta volta', src: urlArte('ui/pensao/seta_giz'), alt: '' }),
      el('button', { class: 'tabua', onclick: e2 => { e2.stopPropagation(); _aoFecharModal = null; fecharModal(); _voltaAoQuadro = modo === 'abertura'; abrirDespensa(); } }, 'Despensa'),
      el('img', { class: 'giz-enfeite palmeira', src: urlArte('ui/pensao/palmeirinha_giz'), alt: '' })));
    lousa.replaceChildren(...caixa.childNodes);
    if (fVis) { const f1 = lousa.querySelector('.qc-rosa'); if (f1) { f1.hidden = false; f1.querySelector('.guia-faixa-texto').textContent = fTxt; } }
    lousa.scrollTop = rolagem;
  };
  desenha();
  // Fechou sem abrir: a janta continua esperando (o botão "Cardápio" e os nichos abrem de novo).
  abrirModal(lousa, () => { if (jantaEsperaCardapio() && noSalaoDaPensao()) avisar('A janta espera o cardápio: clique em "Cardápio", lá embaixo, quando quiser abrir.'); });
  sons.tocar('abrir', 1.1, 0.03, -6);
  return true;
}
// "Abrir a pensão": as panelas da escolha saem da despensa na hora e a janta começa. Sem panela nenhuma, pergunta antes.
function abrirAPensao() {
  const p = G.pensao, esc = p.cardapioNoite || {}, CQ = contaDoQuadro(p, esc);
  const vai = () => {
    // (onda final) faz exatamente o que o quadro mostrou (as panelas da conta em sequência, na mesma ordem) e devolve a escolha
    // guardada como o jogador montou (o montarNoite grava o que recebe)
    const faz = {};
    for (const id of Object.keys(esc)) faz[id] = { panelas: CQ.efe[id] || 0, repoe: esc[id].repoe };
    const r = p.montarNoite(faz, rngDaNoite(G.dia * 53 + 11));
    p.cardapioNoite = esc;
    p.cardapio = Object.keys(r.feitas);   // (o quadro antigo: o salão de cima e os textos velhos leem daqui)
    _aoFecharModal = null; fecharModal();
    if (typeof _marcaTela === 'function') _marcaTela('cardapio');
    if (r.semVaga.length) avisar(`Não coube no quadro: ${r.semVaga.map(id => Pratos.PRATOS[id].nome).join(', ')}.`);
    const menos = r.faltou.filter(id => r.feitas[id] > 0);   // (correção 1) o que não saiu nenhuma o quadro já mostrou ("falta …")
    if (menos.length) avisar(`A despensa não deu tudo: ${menos.map(id => Pratos.PRATOS[id].nome).join(', ')} saiu com menos panelas.`);
    iniciarJanta();
  };
  if (!Object.keys(CQ.efe).some(id => CQ.efe[id] > 0)) {
    const C = ECO.pensao.pratoCasa;
    perguntar(`Nenhuma panela no quadro. Abrir só com o prato da casa? Todo mundo leva o ${C.nome} (Cr$ ${C.preco}, sem curtida).`, ['Abrir só com o prato da casa', 'Voltar ao quadro'], i => { if (i === 0) vai(); else pensaoQuadro(); });
    return;
  }
  vai();
}
// A sobra da noite, em texto ("Sobrou: 3 porções de PF do Peão Valente (foram para o lixo)."), ou '' sem sobra.
function textoSobra(sobra) {
  const s = Object.entries(sobra || {}).filter(([, n]) => n > 0);
  if (!s.length) return '';
  const total = s.reduce((t, [, n]) => t + n, 0);
  return `Sobrou: ${s.map(([id, n], i) => `${n} ${i ? '' : n === 1 ? 'porção ' : 'porções '}de ${Pensao.prato(id).nome}`).join(', ')} (${total === 1 ? 'foi' : 'foram'} para o lixo).`;
}

// ---------- a janta ----------
// Os clientes da noite: o degrau, as melhorias e o pessoal do Grêmio aos sábados (o Cofre pronto).
function clientesHoje() { return G.pensao.clientesDaNoite() + (typeof bonusMelhorias === 'function' ? bonusMelhorias(G.pensao).clientes : 0) + (typeof Gremio !== 'undefined' ? Gremio.clientesExtra(G.dia) : 0); }
function iniciarJanta() {
  G.turno = new TurnoJanta();
  G.turno.rotatividade = true;   // (14/10, o Dave) chegadas espaçadas, banco sorteado sem louça, o cliente entra e sai andando
  G.turno._nichos = G.pensao.pratosDaNoite().slice();   // (onda final) a ordem dos nichos da noite: cada prato fica no nicho dele
  // (o cardápio do Bancho) A janta começou por outro caminho com o quadro da abertura aberto: o quadro sai (sem o aviso de espera).
  if ($('#modal .quadro-cardapio')) { _aoFecharModal = null; fecharModal(); }
  const festa = typeof Eventos !== 'undefined' ? Eventos.hoje(G.pensao, G.dia, 'festa') : null, vip = typeof Eventos !== 'undefined' ? Eventos.hoje(G.pensao, G.dia, 'vip') : null;
  const festaPatrimonio = G.pensao.festaDia === G.dia;   // a noite de festa da 5ª estrela
  const inauguracao = G.pensao.ultimaJanta === -1 && !G.pensao.fama;   // (revisão final) a primeira janta da pensão: a inauguração (sem fama: não é save antigo)
  G.turno.iniciar(G.pensao, G.dia, clientesHoje());
  // A inauguração (a especificação do roteiro; o Dave: a noite especial com convidados): a Vila vem convidada — 3 a mais, com o
  // enfeite da festa no palco e a conta dos bem servidos no resumo (o mesmo jeito da noite de festa do Patrimônio).
  if (inauguracao) { G.turno.inauguracao = true;
    for (let k = 0; k < ECO.pensao.convidados.inauguracao; k++) G.turno._fila.push({ minuto: 17 * 60 + 15 + k * 30, cliente: Object.assign({}, Pratos.CLIENTES[(G.dia * 5 + k * 3) % Pratos.CLIENTES.length], { convidado: true }) });
    G.turno._fila.sort((a, b) => a.minuto - b.minuto); }
  // A noite de festa da 5ª estrela: a Vila inteira vem como convidada (nunca sai da fila por repetir um morador).
  if (festaPatrimonio) { for (let k = 0; k < ECO.pensao.premio5.festaClientes; k++) G.turno._fila.push({ minuto: 17 * 60 + 15 + k * 25, cliente: Object.assign({}, Pratos.CLIENTES[(G.dia * 7 + k) % Pratos.CLIENTES.length], { convidado: true }) });
    G.turno._fila.sort((a, b) => a.minuto - b.minuto); avisar('Noite de festa: a Vila inteira veio comemorar o Patrimônio!'); }
  if (festa) { G.turno.pratoTema = festa.prato; G.turno.festa = festa.nome; G.turno.categoriaTema = festa.categoria || '';
    // Os convidados da festa: 3 a mais, que pedem o prato do tema.
    for (let k = 0, nc = convidadosDaFesta(); k < nc; k++) { const c = Pratos.CLIENTES[(G.dia + k * 3) % Pratos.CLIENTES.length]; G.turno._fila.push({ minuto: 17 * 60 + 20 + k * 40, cliente: Object.assign({}, c, { pedeTema: festa.prato, convidado: true }) }); }
    G.turno._fila.sort((a, b) => a.minuto - b.minuto); }
  if (typeof Paladar !== 'undefined' && Paladar.vem(G.pensao, G.dia)) { G.turno.paladar = true; G.turno._fila.push({ minuto: 19 * 60, cliente: Paladar.cliente() }); G.turno._fila.sort((a, b) => a.minuto - b.minuto); }
  if (typeof Clientela !== 'undefined') { G.turno.moradores = Clientela.porNaFila(G.turno, G.pensao, G.dia); G.turno.filho = Clientela.filhoDaNoite(G.dia); }
  if (vip) { const v = vipDe(vip.id); G.turno.vip = { nome: v.nome, prato: vip.prato }; G.turno._fila.push({ minuto: 18 * 60 + 30, cliente: { id: v.id, nome: v.nome, mania: 'vip', prato: vip.prato } }); G.turno._fila.sort((a, b) => a.minuto - b.minuto); }
  if (typeof Equipe !== 'undefined') {
    const t = G.turno, p = G.pensao, b = typeof bonusMelhorias === 'function' ? bonusMelhorias(p) : { preparo: 1, bocas: 0, gorjeta: 0, paciencia: 1, farinha: 0 };
    t.fatorPreparo = fatorDePreparo(p); t.bocas = Chef.bocas(p) + Equipe.bocasExtra(p) + b.bocas;
    t.gorjetaExtra = Equipe.gorjetaExtra(p) + b.gorjeta; t.paciencia = b.paciencia; t.farinhaMax = TurnoJanta.FARINHA_MAX + b.farinha; t.farinha = t.farinhaMax;
    t.passeMax = TurnoJanta.PASSE_MAX + (b.passe || 0); t.maquina = !!b.maquina;   // (Tarefa D1) a bancada do passe e a máquina de refresco
  }
  G.pensao.ultimaJanta = G.dia;
  G.relatorioPensao = null;
  // (14/10, os sons) já baixa os sons da janta; a inauguração e as noites de festa abrem com rojão e a plateia
  sons.preparar(SONS_DA_JANTA);
  // (14/10) a folha de andar de cada freguês da noite (moradores e avulsos) já começa a baixar: ninguém entra sem a arte dele
  // (sem a folha pronta, o Personagem só não aparece; nunca com a arte de outro)
  if (typeof precarregarArtes === 'function') precarregarArtes([...new Set(G.turno._fila.map(f => `personagens/${f.cliente.id}/andar`))]);
  if (inauguracao || festaPatrimonio || festa) tocarSomDoEvento({ tipo: 'inauguracao' });
  if (G.turno.festa) avisar(`Hoje é a ${G.turno.festa}! ${Pratos.PRATOS[G.turno.pratoTema].nome}${G.turno.categoriaTema ? ` e todo ${CATEGORIAS[G.turno.categoriaTema].toLowerCase()}` : ''} vale 50% mais.`);
  if (G.turno.vip) avisar(`Hoje janta ${G.turno.vip.nome}: ele vai pedir ${Pratos.PRATOS[G.turno.vip.prato].nome}.`);
  if (G.turno.moradores && G.turno.moradores.length) avisar(`Hoje é dia de ${G.turno.moradores.map(c => c.nome).join(' e ')} jantar na pensão.`);
  if (G.turno.filho === 'ritinha') avisar('A Ritinha veio ajudar no caixa: hoje a gorjeta sai 10% maior!');
  else if (G.turno.filho === 'zezinho') avisar('O Zezinho veio "ajudar" na pensão. Fique de olho nas cocadas!');
  // (o aviso da inauguração vai junto com o do começo: a pilha de avisos não cresce por cima da frase da seta)
  avisar((inauguracao ? 'Inauguração da Pensão da Rosa: a Vila veio convidada! ' : '') + (noPalco() ? 'A janta começou! A Rosa põe os pratos no passe da cozinha: pegue e leve a quem pediu. Bebida: no bebedouro.' : 'A janta começou! Clique no cliente (ou no balcão na frente dele) para anotar o pedido.'));
}
MANHA.push(() => { const p = G.pensao; if (p && p.estado === 'aberta') for (const id of p.liberarDoDegrau()) G.feitosHoje.push(`A Rosa aprendeu uma receita nova: ${Pratos.PRATOS[id].nome}.`); });
// A despesa da noite do degrau (gás, gelo, luz, como a do Cooksta) e os salários saem do bolso, nunca deixando ele negativo.
// (Tarefa A) O que saiu de verdade: primeiro a despesa, depois os salários; o que o bolso não cobriu fica no naoCobriu. Vale para a
// janta com o Jocelino e para a noite da Rosa sozinha (as duas fecham a conta do mesmo jeito: TurnoJanta.conta).
function pagarDespesaDaNoite(r) {
  r.despesa = G.pensao.despesa(); r.salarios = typeof Equipe !== 'undefined' ? Equipe.salarios(G.pensao) : 0;
  const custo = Math.min(r.despesa + r.salarios, Math.max(0, G.dinheiro));
  G.dinheiro -= custo; G.ganhoHoje -= custo; r.custo = custo;
  r.despesaPaga = Math.min(r.despesa, custo); r.salariosPagos = custo - r.despesaPaga; r.naoCobriu = r.despesa + r.salarios - custo;
  return custo;
}
// (revisão da Tarefa A) A noite em que o Jocelino não serviu: a Rosa se vira sozinha (TurnoJanta.rosaSozinha), o bolso recebe os
// pratos e paga a despesa e os salários, e a conta fecha como na janta (sem gorjeta nem prêmio). Devolve o relatório.
function noiteDaRosaSozinha(linhas) {
  const f = mulberry(G.dia * 77);
  // (o cardápio do Bancho) A Rosa usa o cardápio da noite anterior (ou só o prato da casa) e a sobra vai para o lixo; a fama
  // não conta o prato da casa (paraFama), como na janta com o Jocelino.
  const rs = TurnoJanta.rosaSozinha(G.pensao, { randf: f, randi: () => Math.floor(f() * 4294967296) });
  G.pensao.registrarNoite(TurnoJanta.paraFama(rs).estrelas, G.dia, 0);
  G.dinheiro += rs.ganho; G.ganhoHoje += rs.ganho;
  // A despesa da noite e os salários saem mesmo sem o Jocelino (nunca deixa o bolso negativo; a pensão não fecha por isso).
  rs.premios = 0; pagarDespesaDaNoite(rs);
  { const c = TurnoJanta.conta(rs); rs.receita = c.receita; rs.lucro = c.lucro; }
  linhas.push(`A Rosa se virou sozinha na pensão: ${rs.servidos} ${rs.servidos === 1 ? 'cliente' : 'clientes'}${deCasaDaRosa(G.pensao, rs)}, Cr$ ${rs.ganho}.`);
  { const sb = textoSobra(rs.sobra); if (sb) linhas.push('   ' + sb); }
  linhas.push(linhaDoLucroNoResumo(rs));
  return rs;
}
function encerrarJanta() {
  if (!G.turno) return;
  // (revisão da Tarefa B) o prato na mão do ajudante "Leva prato" volta ao passe antes de fechar: o fechar conta ele no lixo
  if (typeof AJUDANTES !== 'undefined' && typeof largarTarefaDoAjudante === 'function') AJUDANTES.forEach(largarTarefaDoAjudante);
  const inaug = G.turno.inauguracao, r = G.turno.fechar();
  const total = r.ganho + r.gorjeta;
  // (14/10, os sons do Dave) A janta acabou: a vinheta de samba toca já. Com o fechamento do caixa na tela, os sons da noite
  // (o degrau, as receitas, o Paladar) ficam para a contagem dele, um de cada vez; sem fechamento (salão antigo), tocam aqui.
  const comFechamento = typeof noPalco === 'function' && noPalco() && typeof abrirFechamento === 'function';
  const somFim = (...a) => { if (!comFechamento) sons.tocar(...a); };
  if (noSalaoDaPensao()) tocarSomDoEvento({ tipo: 'fim_janta' });
  if (r.convidados && G.feitosHoje) G.feitosHoje.push(inaug ? `A inauguração da Pensão da Rosa: ${r.convidadosServidos || 0} de ${r.convidados} convidados bem servidos. A Vila já sabe o caminho!` : `Os convidados da festa: ${r.convidadosServidos || 0} de ${r.convidados} bem servidos.`);
  G.dinheiro += total; G.ganhoHoje += total;
  // O cliente especial e os pedidos da Vila. Receitas novas da noite: a do VIP bem servido, a da festa e as do degrau.
  // (14/10, Tarefa A) O dinheiro dos prêmios da noite (o VIP, os pedidos da Vila e as metas) entra na receita do fechamento.
  r.aprendidas = []; r.premios = 0;
  if (typeof Eventos !== 'undefined') {
    const vip = Eventos.hoje(G.pensao, G.dia, 'vip');
    if (vip) { vip.fim = r.vip === 'servido' ? 'servido' : 'faltou';
      if (r.vip === 'servido') { const pr = vipDe(vip.id).premio; G.dinheiro += pr.dinheiro; r.premios += pr.dinheiro || 0; r.curtidas += pr.curtidas; G.pensao.pitadas += pr.pitadas; r.premioVip = pr;
        const rv = receitaDoVip(vip.id); if (rv && G.pensao.liberarReceita(rv)) r.aprendidas.push(rv);
        const fn = Eventos.premiar(G.pensao, vip.id); if (fn) { r.premioFuncao = fn; avisar(`${vipDe(vip.id).nome} deu de presente: ${TEXTO_FUNCAO[fn]}!`); } } }
    const fe = Eventos.hoje(G.pensao, G.dia, 'festa');
    if (fe) { fe.fim = 'feita'; const f = FESTAS.find(x => x.nome === fe.nome); if (f && f.ensina && G.pensao.liberarReceita(f.ensina)) r.aprendidas.push(f.ensina); }
    r.pedidosFeitos = Eventos.depoisDaJanta(G.pensao, r, G.dia);
    for (const e of r.pedidosFeitos) { G.dinheiro += e.premio; r.premios += e.premio || 0; r.curtidas += 2; }
  }
  const pit0 = G.pensao.pitadas;
  const grauAntes = G.pensao.grau();   // antes dos garfos: se eles completam o degrau, a subida aparece hoje
  if (r.paladar && typeof Paladar !== 'undefined') {
    const p = G.pensao; p.garfos = Math.max(p.garfos || 0, r.paladar); p.paladarNotas.push({ dia: G.dia, nota: r.paladar });
    CARTAS['paladar_' + G.dia] = { de: 'Gazeta de Santos', dia: G.dia + 1, texto: Paladar.materia(r.paladar) };
    avisar(`O cliente de chapéu-coco era o Doutor Paladar, da Gazeta! Nota: ${r.paladar} ${r.paladar === 1 ? 'garfo' : 'garfos'}. A matéria sai amanhã.`); somFim(r.paladar >= 4 ? 'fanfarra' : 'cliente_hmpf', 1, 0, -4);
  }
  const fama = TurnoJanta.paraFama(r);   // (o cardápio do Bancho) o prato da casa não conta para a fama, as pitadas nem o chef
  r.subiu = G.pensao.registrarNoite(fama.estrelas, G.dia, r.curtidas);
  if (!r.subiu && G.pensao.grau() > grauAntes) r.subiu = G.pensao.grau();
  // A Rosa ganha experiência com cada prato que saiu.
  if (typeof Chef !== 'undefined') { const c = Chef.ganhar(G.pensao, fama.servidos); r.chef = c;
    if (c.subiu) { avisar(`A Rosa subiu para chef nível ${c.subiu}! Cozinha mais rápido${Chef.NIVEIS_INVENTA.includes(c.subiu) ? ' e ganhou uma boca a mais no fogão' : ''}.`); somFim('rosa_animada', 1, 0.05, -2); }
    for (const id of c.inventou) { avisar(`A Rosa inventou uma receita: ${Pratos.PRATOS[id].nome}! Já está no caderno.`); somFim('fanfarra', 1.1, 0, -4); } }
  r.pitadasGanhas = G.pensao.pitadas - pit0;
  if (typeof Clientela !== 'undefined') Clientela.registrarAmizade(G.amizade || (G.amizade = {}), r.favoritos);
  r.aprendidas.push(...G.pensao.liberarDoDegrau());
  for (const id of r.aprendidas) { avisar(`Receita nova no caderno da Rosa: ${Pratos.PRATOS[id].nome}!`); somFim('fanfarra', 1.15, 0, -6); }
  pagarDespesaDaNoite(r);
  // As metas da noite (servir, bebida na medida, nota) e as de estado.
  if (typeof Metas !== 'undefined') { r.metasFeitas = Metas.conferir(G.pensao, r); metasPagas(r.metasFeitas); for (const m of r.metasFeitas) r.premios += (m.premio && m.premio.dinheiro) || 0; }
  { const c = TurnoJanta.conta(r); r.receita = c.receita; r.lucro = c.lucro; }   // a conta fecha: o bolso mudou exatamente pelo lucro
  if (r.subiu) { somFim('degrau_fanfarra', 1, 0, -2); avisar(`A pensão ganhou mais uma estrela: agora é ${G.pensao.nomeComEstrelas(r.subiu)}!`); }
  // (o cardápio do Bancho, 13/10) A sobra da panela foi para o lixo no fechar (r.sobra = { prato: porções }); a marmita do
  // Jocelino a Rosa faz de manhã.
  G.relatorioPensao = r;
  G.turno = null;
  // (revisão da E2) a janta acabou no meio de um minijogo (o copo, a cerveja, a caipirinha) ou da peneira: fecham junto, sem ir para a
  // bandeja e sem contar nada (nem derramou, nem desandou); senão o minijogo ficava por cima do fechamento
  G.copo = null; G.peneira = null;
  if (typeof sincronizarMao === 'function') sincronizarMao();   // (revisão dos sons) o copo ou a peneira na mão calam já (o fechamento abre um modal)
  if (G.jog && G.jog.carga && G.jog.carga.id === 'prato') G.jog.carga = {};
  const sal = MAPAS.pensao_dentro;
  if (sal) sal.clientes = [];
  avisar('A janta acabou: Cr$ ' + total + '.');
  hudSujo();
  if (typeof noPalco === 'function' && noPalco() && typeof abrirFechamento === 'function') abrirFechamento(r);
}
// (o cardápio do Bancho, 13/10) Às 17h, no salão, o quadro de giz abre sozinho uma vez por entrada (fechou, abre de novo pelo
// "Cardápio" ou pelos nichos, ou na próxima vez que entrar); a janta só começa no "Abrir a pensão".
let _entradaSalao = 0, _quadroAbriu = '';
// (correção 1) O Caderno e a Despensa abertos pelo quadro da abertura: fechou, volta ao quadro (se a janta ainda espera).
let _voltaAoQuadro = false;
AO_ENTRAR_MAPA.push(id => { if (id === 'pensao_palco' || id === 'pensao_dentro') _entradaSalao++; });
ATUALIZADORES.push(dt => {
  const t = G.turno;
  if (_voltaAoQuadro) { _voltaAoQuadro = false; if (!t && jantaEsperaCardapio() && noSalaoDaPensao()) { pensaoQuadro(); return; } }
  if (!t) {
    if (jantaEsperaCardapio() && noSalaoDaPensao() && _quadroAbriu !== G.dia + ':' + _entradaSalao) { _quadroAbriu = G.dia + ':' + _entradaSalao; pensaoQuadro(); }
    return;
  }
  t.tick(dt, G.minutos);
  const noSalao = noSalaoDaPensao();
  for (const ev of t.eventos) {
    // (as cenas de prato) o VIP cansou de esperar e foi embora: a vaga de cena guardada para ele volta para a noite
    if (ev.tipo === 'embora' && ev.cliente && ev.cliente.mania === 'vip' && typeof CenaPrato !== 'undefined') CenaPrato.soltarVaga(t);
    if (ev.tipo === 'pronto' && noSalao) { if (!noPalco()) mostrarCenaRosa(ev.prato); }
    else if (ev.tipo === 'pagou' && noSalao) {
      if (noPalco() && typeof flutuar === 'function' && PALCO.ASSENTOS[ev.mesa]) {
        const A = PALCO.ASSENTOS[ev.mesa]; flutuar(A.x, A.y - 200, `+Cr$ ${ev.valor}`, '#ffd34d');
        if (ev.estrelas >= 4) setTimeout(() => flutuar(A.x + 30, A.y - 230, '+1 ❤ curtida', '#ff7a8a'), 250);
      }
    }
    else if (ev.tipo === 'embora') {
      // O cliente foi embora com o prato dele na mão do Jocelino: a Rosa guarda o prato (nada trava).
      if (G.jog.carga && G.jog.carga.id === 'prato' && G.jog.carga.mesa === ev.mesa) { G.jog.carga = {}; ev.semSom = true; avisar(`${ev.cliente.nome} foi embora antes do prato chegar. A Rosa guardou o prato.`); }
      else if (noSalao) { avisar(ev.louca ? `${ev.cliente.nome} não aguentou a louça suja do lado e foi embora.` : `${ev.cliente.nome} cansou de esperar e foi embora resmungando.`); }
    } else if (ev.tipo === 'louca' && noSalao) {
      // (14/10, o desgosto) a primeira vez no jogo, a Rosa avisa (uma vez só; a seta da primeira vez vai na louça: guia_setas.js)
      if (G.limpou && !G.limpou.janta_desgosto) { G.limpou.janta_desgosto = 1; avisar('Rosa: "Louça suja espanta freguês: recolha antes de alguém sentar!"'); }
      else avisar(`${ev.cliente.nome} sentou do lado da louça suja e torceu o nariz: recolha logo, senão ele vai embora!`);
    } else if (ev.tipo === 'farinha_baixa' && noSalao) { avisar(`Rosa: "Jocelino, a farinheira tá no fim (${ev.farinha})! Peneira mais farinha pra mim."`);   // (Tarefa C) chama uma vez até repor
    } else if (ev.tipo === 'maquina_serviu' && noSalao && G.limpou && !G.limpou.janta_maquina) {   // (Tarefa D1) a 1ª vez, uma frase só
      G.limpou.janta_maquina = 1; avisar(`Rosa: "A máquina de refresco encheu o ${Pratos.BEBIDAS[ev.bebida].toLowerCase()} sozinha! O guaraná e o caldo ela serve; a cerveja e o cafezinho continuam com você."`);
    } else if (ev.tipo === 'ultima_rodada' && noSalao) { avisar('A Rosa bate o sino: "Última rodada!" Quem chegar agora pede mais bebida.');
    } else if (ev.tipo === 'cafe' && noSalao) avisar(`Sem ingrediente na despensa: ${ev.cliente.nome} tomou só um cafezinho.`);
    // (o cardápio do Bancho) a panela que acabou: a Rosa repõe, ou o prato sai do quadro; quem fica sem prato leva o prato da casa
    else if (ev.tipo === 'panela' && noSalao) avisar(`A panela de ${Pensao.prato(ev.prato).nome} acabou: a Rosa já fez outra.`);
    else if (ev.tipo === 'prato_saiu' && noSalao) avisar(`${Pensao.prato(ev.prato).nome} acabou${ev.motivo === 'faltou' ? ' e falta ingrediente para outra panela' : ''}: saiu do quadro.${G.pensao.pratosDaNoite().length ? '' : ` Quem chegar agora leva o prato da casa (${ECO.pensao.pratoCasa.nome}).`}`);
    else if (ev.tipo === 'casa' && noSalao && !t._avisouCasa) { t._avisouCasa = true; avisar(`${ev.cliente.nome} levou o prato da casa (${ECO.pensao.pratoCasa.nome}): barato e sem curtida. Mais panelas no quadro, mais prato de verdade.`); }
    else if (ev.tipo === 'vip_faltou' && noSalao) { avisar(`${ev.cliente.nome} queria ${Pratos.PRATOS[ev.prato].nome} e não tinha! Foi embora decepcionado.`); }
    else if (ev.tipo === 'chegou' && noSalao && ev.cliente.morador) { const d = Clientela.dado(ev.cliente.id); if (d) avisar(`${d.nome}: "${d.fala}"`); }
    else if (ev.tipo === 'favorito' && noSalao) { const d = Clientela.dado(ev.cliente.id); if (d) avisar(`${d.nome}: "${d.elogio}" (+1 ❤ de amizade)`);
      if (noPalco() && PALCO.ASSENTOS[ev.mesa]) { const A = PALCO.ASSENTOS[ev.mesa]; setTimeout(() => flutuar(A.x - 30, A.y - 260, '+1 ❤ amizade', '#ff5d7a'), 500); } }
    else if (ev.tipo === 'zezinho_cocada' && noSalao) { avisar('Zezinho: "Eu? Que cocada? Não vi cocada nenhuma..." (sumiu uma porção de cocada da panela)'); }
    // (as cenas de prato, 14/10) o prato especial entregue: as faixas de cinema descem e a cena toca (o jogo pausa)
    else if (ev.tipo === 'servido' && noSalao && typeof CenaPrato !== 'undefined') ev.cena = CenaPrato.aoServir(t, ev);
    else if (ev.tipo === 'vip_servido' && noSalao) { avisar(`${ev.cliente.nome}: "${vipDe(ev.cliente.id).frase}"`); }
    // (14/10) gostou (4★ ou mais, prato certo): os corações sobem da cabeça dele (a cena de prato tem a reação dela)
    if (ev.tipo === 'servido' && noSalao && !ev.cena && ev.certo !== false && ev.estrelas >= 4 && typeof coracaoNoPalco === 'function' && noPalco()) coracaoNoPalco(ev.mesa);
    // (14/10, o desgosto) o cheiro do vizinho (a reação 'nojo' de quem não está do lado da louça): o balão de desgosto por uns segundos
    if (ev.tipo === 'reacao' && ev.reacao === 'nojo' && noSalao && typeof desgostoNoPalco === 'function' && noPalco()) desgostoNoPalco(ev.mesa);
    // (14/10, os sons do Dave) o som de cada evento: somDoEvento (sons.js), com a moderação do sons.tocar
    if (noSalao) tocarSomDoEvento(ev);
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
  if (!t || i >= t.mesas.length) { abrirPlaca('Uma banqueta no balcão. Os peões chegam para a janta a partir das 17h.'); return true; }
  const m = t.mesas[i], mao = G.jog.carga || {};
  if (m.estado === 'pedido') { t.anotar(i); sons.tocar('letra', 1, 0.03, -2); }
  else if (m.estado === 'prato') {
    if (mao.id === 'prato') {
      if (mao.mesa !== i) avisar(`Esse prato é da banqueta ${mao.mesa + 1}.`);
      else if (t.servir(i)) { G.jog.carga = {}; sons.tocar('pousar', 1, 0.05, -2); }
    } else avisar(m.pronto ? 'O prato saiu! Pegue no balcão da Rosa e leve a quem pediu.' : 'A Rosa está preparando...');
  } else if (m.estado === 'comendo') avisar(`${m.cliente.nome} está comendo.`);
  else if (m.estado === 'suja') { t.limpar(i); sons.tocar('pegar', 1.4, 0.05, -6); }
  else avisar('Banqueta vazia.');
  sincronizaClientes();
  return true;
}
// Clique (ou X) no balcão corrido: o cliente da banqueta naquela coluna; senão, o balcão.
function pensaoBalcaoCorrido(px) {
  const x = Math.floor((px ?? mouseMundo().x) / TILE);
  const i = SALAO.ASSENTOS.findIndex((a, k) => a[0] === x && G.turno && k < G.turno.mesas.length && G.turno.mesas[k].estado !== 'livre');
  return i >= 0 ? pensaoMesa(i) : pensaoBalcao();
}
// (tarefa 6) O painel de montar o prato (abrirMontar, o "Pronto!") saiu: era só do salão antigo de cima, e o jogo não chega mais
// lá (toda entrada vai ao palco; o save antigo e a reforma também). A regra do prato certo (TurnoJanta.montar) fica, nos testes.
function pensaoBalcao() {
  abrirPlaca('O balcão de azulejo e o fogão da Rosa.');
  return true;
}

// ---------- a cena da Rosa (o show de faca do Bancho): não pausa ----------
function mostrarCenaRosa(prato) {
  if (typeof noPalco === 'function' && noPalco()) return;   // no palco a Rosa já cozinha à vista
  let c = $('#cena');
  if (!c) { c = el('div', { id: 'cena', hidden: true }); document.body.append(c); }
  c.innerHTML = '';
  c.append(el('div', { class: 'cena-som' }, sorteio(SONS_ROSA)), el('img', { class: 'cena-rosa', src: urlArte('retratos/rosa_cozinha_normal') }),
    el('img', { class: 'cena-prato', src: urlArte(iconePratoGrande(prato)) }));
  c.hidden = false;
  c.classList.remove('entra'); void c.offsetWidth; c.classList.add('entra');
  sons.tocar('agua', 0.6, 0.1, -4);
  clearTimeout(c._t1); clearTimeout(c._t2);
  c._t1 = setTimeout(() => { const r = c.querySelector('.cena-rosa'); if (r) r.src = urlArte('retratos/rosa_cozinha_alegre'); }, 800);
  c._t2 = setTimeout(() => { c.hidden = true; }, 1700);
}

// ---------- balões dos clientes (desenhados no mundo) e o passa-prato ----------
function desenhaBaloes(ctx, b) {
  const t = G.turno;
  if (!t) return;
  let k = 0;
  t.mesas.forEach(m => { if (m.estado === 'prato' && m.pronto && !m.montado) { desenhaPrato(ctx, m.prato, (SALAO.COZINHA[0] - 0.6 - k) * TILE, SALAO.COZINHA[1] * TILE + 8, 1, 0.7); k++; } });
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
    else { ctx.globalAlpha = m.pronto ? 1 : 0.45; desenhaPrato(ctx, m.prato, x, y + 20, 1, 0.82); ctx.globalAlpha = 1; }
    const lim = (m.estado === 'pedido' ? TurnoJanta.PACIENCIA_PEDIDO : TurnoJanta.PACIENCIA_PRATO) * (t.pacienciaDe ? t.pacienciaDe(m) : 1);   // (Tarefa E1) a da noite e a do jeito, como o tick
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
  const linha2 = `${p.curtidas} curtidas` + (r ? `  ·  Hoje: Cr$ ${r.ganho + r.gorjeta}  ·  ${r.servidos} pratos servidos` : '');
  const chave = g + linha2 + p.progresso().toFixed(2);
  if (selo._k === chave) return;
  selo._k = chave;
  // (15/10, a clareza) o que é cada número do selo, ao passar o mouse (a tela A Pensão, no rodapé, tem o resto)
  selo.title = `${GLOSSARIO.curtida}\nHoje: o dinheiro da janta até agora (pratos, bebidas e gorjeta) e quantos pratos já saíram.\n`
    + (px ? `A barrinha: quanto falta para "${px.nome}" (veja em "A Pensão", no rodapé).` : 'A pensão já está no último degrau.');
  selo.innerHTML = '';
  selo.append(el('div', { class: 'grau' }, spr('ui/selo_' + g) ? el('img', { src: urlArte(`ui/selo_${g}`), class: 'selo-img' }) : null, 'Pensão da Rosa · ' + p.nomeComEstrelas(g)), el('div', {}, linha2));
  if (px) selo.append(el('div', { class: 'progresso' }, el('div', { style: `width:${p.progresso() * 100}%` })));   // no degrau mais alto não tem barra
}
// O que falta para o próximo degrau, em texto.
function textoFalta(f) {
  const t = [];
  if (f.curtidas) t.push(`${f.curtidas} ${f.curtidas === 1 ? 'curtida' : 'curtidas'}`);
  if (f.sabor) t.push(`melhor sabor +${f.sabor} (caprichar e servir no salão)`);
  if (f.pesquisadas) t.push(`${f.pesquisadas} ${f.pesquisadas === 1 ? 'receita pesquisada' : 'receitas pesquisadas'}`);
  if (f.visitas) t.push(`${f.visitas} ${f.visitas === 1 ? 'visita' : 'visitas'} do Doutor Paladar com ${f.garfos} garfos`);
  if (f.concurso) t.push(`${f.concurso} ${f.concurso === 1 ? 'vitória' : 'vitórias'} no concurso da Rádio`);
  return t.length ? 'faltam ' + t.join(', ') : 'quase lá';
}
// ---------- (15/10, a clareza) o que cada número quer dizer, na própria tela ----------
// O dono: "No cardápio tem o número de sabor, para que serve isso?" e "na equipe aparece 'posto', o que significa?". Como no Dave
// (o Bancho explica cada número ao lado dele: o Best Taste no Cooksta, o Assign na equipe), cada tela ganha UMA linha curta com o
// que importa e um "(?)" que abre e fecha o detalhe. Só texto e o botão de sempre (nada desenhado). O que foi aberto continua
// aberto quando a tela se redesenha (o + de uma panela, o Treinar).
const _ajudaAberta = new Set();
ATUALIZADORES.push(() => { if (_ajudaAberta.size && $('#modal') && $('#modal').hidden) _ajudaAberta.clear(); });   // (fechou a tela: na próxima, tudo fechado)
function linhaAjuda(chave, curta, detalhe) {
  const aberta = _ajudaAberta.has(chave);
  const det = el('div', { class: 'ajuda-detalhe', hidden: !aberta }, ...[].concat(detalhe).map(t => el('div', {}, t)));
  // (um texto clicável, não uma tábua: as tábuas são as ações da tela; o "(?)" só abre a explicação)
  const vira = e => { e.stopPropagation(); det.hidden = !det.hidden; q.textContent = det.hidden ? '(?)' : '(fechar)'; if (det.hidden) _ajudaAberta.delete(chave); else { _ajudaAberta.add(chave); det.scrollIntoView({ block: 'nearest' }); } };
  const q = el('span', { class: 'ajuda-q', role: 'button', tabindex: 0, 'data-ajuda': chave, title: 'O que é isso?', onclick: vira,
    onkeydown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); vira(e); } } }, aberta ? '(fechar)' : '(?)');
  return el('div', { class: 'ajuda', 'data-ajuda': chave }, curta ? el('span', { class: 'ajuda-curta' }, curta + ' ') : null, q, det);
}
// As frases de cada termo do restaurante, num lugar só (as telas usam as mesmas palavras).
const GLOSSARIO = {
  curtida: 'Curtida: cada cliente que sai com 4 estrelas ou mais deixa 1 curtida. As curtidas sobem a pensão de degrau.',
  sabor: `Sabor: o nível do prato × ${ECO.pensao.saborPorNivel}. Ele não muda o preço nem as estrelas do cliente: serve para a pensão subir de degrau.`,
  melhorSabor: 'Melhor sabor: o maior sabor entre os pratos que já saíram para um cliente. Caprichar no caderno e não servir ainda não conta.',
  pesquisadas: 'Receitas pesquisadas: as que a Rosa aprendeu no caderno gastando pitadas (as 4 do começo não contam).',
  pitada: 'Pitadas de tempero: pagam a pesquisa de receita nova no caderno. Toda janta com estrela dá pitadas; metas e clientes especiais também.',
  despesa: 'Despesa da noite: gás, gelo e luz. Sai do bolso toda noite que a pensão abre; cada degrau novo cobra mais.',
  garfos: 'Garfos: a nota do Doutor Paladar, o crítico da Gazeta, que vem disfarçado. Os dois últimos degraus pedem visitas dele com nota alta.',
  concurso: 'Concurso da Rádio: no último dia da estação, 3 pratos para os jurados. O último degrau pede uma vitória.',
  degrau: 'Degrau (as estrelas da pensão): quando tudo o que ele pede está feito, a pensão sobe; abre mais pratos no quadro, banquetas, clientes e vagas na equipe.',
  panela: 'Panela: a Rosa cozinha a receita uma vez e ela rende algumas porções. Porção: um prato para um cliente.',
  repoe: '"Rosa repõe": ligado, quando a panela acaba a Rosa faz outra com o que tem na despensa. Desligado, o prato sai do quadro.',
  vagasQuadro: 'Vagas no quadro: quantos pratos diferentes cabem no cardápio da noite. A fama abre mais.',
  casa: 'Prato da casa: sempre tem, não gasta despensa; é barato e não dá curtida. Quem fica sem prato do quadro leva ele.',
  sobra: 'Sobra: o que ficou na panela no fim da noite vai para o lixo. Faça só as panelas que a noite pede.',
  raridade: 'Raridade (★): o ingrediente raro (★★ ou mais) deixa o prato mais caro e dá 1 estrela a mais ao cliente.',
  // (15/10, a clareza) o preço do quadro e do caderno é o que a panela cobra (Pensao.precoDaPanela)
  precoPanela: `Preço: o que o cliente paga por porção, já com o ingrediente principal que vai para a panela (★★ vale ${Math.round((ECO.pratos.raridade[2] - 1) * 100)}% mais, ★★★ ${Math.round((ECO.pratos.raridade[3] - 1) * 100)}% mais). No peixe frito e no pirão vale o peixe que estiver na despensa (a Rosa usa o mais comum primeiro); sem peixe nenhum, o quadro mostra de quanto a quanto. A gorjeta e a festa vêm por cima.`,
  nivelPrato: 'Nível do prato: sobe com o Caprichar (do 1 ao 10). Mais nível: mais preço, mais porções por panela e mais sabor.',
  chef: 'Rosa chef: ela sobe de nível com cada prato que sai, e cozinha mais rápido. Bocas no fogão: quantos pratos ela faz ao mesmo tempo.',
};
// O próximo degrau que pede mais sabor do que a pensão já serviu (o caderno e a Pensão): { grau, d } ou null.
function degrauDoSabor(p) {
  const m = p.melhorSabor();
  for (let i = p.grau(); i < Pensao.DEGRAUS.length; i++) if (Pensao.DEGRAUS[i].sabor > m) return { grau: i + 1, d: Pensao.DEGRAUS[i] };
  return null;
}
const nomeDoDegrau = (g, d) => `${'★'.repeat(g - 1)} ${d.nome}`;
// (15/10, o dono: "o número de sabor, para que serve?") A linha do sabor do prato: o número, para que serve e o que falta.
// O sabor só conta no degrau da fama (o Best Taste do Cooksta no Dave): o maior entre os pratos caprichados E servidos.
function textoSaborDoPrato(p, id) {
  const s = p.sabor(id), serv = ((p.servidos || {})[id] || 0) * Pensao.SABOR_POR_NIVEL, alvo = degrauDoSabor(p);
  let t = `Sabor ${s} — conta para a fama: `;
  t += alvo ? `${nomeDoDegrau(alvo.grau, alvo.d)} pede melhor sabor ${alvo.d.sabor} (hoje a pensão tem ${p.melhorSabor()}). Caprichar e servir sobe.`
    : 'a pensão já tem todo o sabor que os degraus pedem.';
  if (s > serv) t += serv ? ` Este prato só foi servido com sabor ${serv}: sirva de novo para valer ${s}.` : ' Este prato ainda não foi servido: sirva para contar.';
  return t;
}
// ---------- A Pensão: os 6 degraus da fama, o que cada um pede e libera (a tela do Cooksta) ----------
function abrirPainelPensao() {
  const p = G.pensao, g = p.grau();
  const caixa = el('div', { class: 'painel painel-pensao' });
  caixa.append(el('div', { class: 'titulo titulo-tela' }, 'A Pensão da Rosa'),
    el('div', { class: 'pp-resumo' }, `${p.curtidas} curtidas · melhor sabor ${p.melhorSabor()} · ${p.pesquisadas()} ${p.pesquisadas() === 1 ? 'receita pesquisada' : 'receitas pesquisadas'} · ${p.pitadas} ${p.pitadas === 1 ? 'pitada' : 'pitadas'} · despesa da noite Cr$ ${p.despesa()}`),
    // (15/10, a clareza) o que é cada número do resumo e dos degraus, no "(?)"
    linhaAjuda('pensao', 'Cada degrau pede o que está na linha dele; cumpriu tudo, a pensão ganha uma estrela.',
      [GLOSSARIO.curtida, GLOSSARIO.melhorSabor + ' ' + GLOSSARIO.sabor, GLOSSARIO.pesquisadas, GLOSSARIO.pitada, GLOSSARIO.despesa, GLOSSARIO.garfos, GLOSSARIO.concurso]));
  const lista = el('div', { class: 'pp-lista' });
  Pensao.DEGRAUS.forEach((d, i) => {
    const n = i + 1, atual = n === g, feito = n < g;
    const req = n === 1 ? 'O começo de tudo.' : ['Pede: ' + `${d.curtidas} curtidas`, d.sabor ? `melhor sabor ${d.sabor}` : '', d.pesquisadas ? `${d.pesquisadas} receitas pesquisadas` : '', d.garfos ? `${d.garfos} garfos do Doutor Paladar em ${d.visitas || 1} ${(d.visitas || 1) === 1 ? 'visita' : 'visitas'}` : '', d.concurso ? `${d.concurso} vitória no concurso da Rádio` : ''].filter(Boolean).join(' · ');
    lista.append(el('div', { class: 'pp-degrau' + (atual ? ' atual' : feito ? ' feito' : '') },
      spr('ui/selo_' + n) ? el('img', { src: urlArte(`ui/selo_${n}`) }) : el('div', { class: 'pp-num' }, n),
      el('div', {}, el('b', {}, Pensao.textoEstrelas(i) + ' ' + d.nome + (atual ? '  ← agora' : feito ? '  ✓' : '')), el('div', { class: 'pp-req' }, req),
        el('div', { class: 'pp-libera' }, `Abre: ${d.vagas} pratos no quadro · ${d.mesas} banquetas · ${d.clientes} clientes por noite · despesa Cr$ ${d.despesa} por noite`))));
  });
  const px = p.proximoDegrau();
  caixa.append(lista, el('div', { class: 'pp-falta' }, px ? `Para "${px.nome}": ${textoFalta(px.falta)}.` : '★★★★★ A pensão é Patrimônio da Vila! Não tem mais estrela para ganhar.'),
    el('div', { style: 'display:flex;gap:8px;justify-content:flex-end;margin-top:8px' }, el('button', { class: 'botao', onclick: e => { e.stopPropagation(); fecharModal(); abrirMetas(); } }, 'Ver as metas'), el('button', { class: 'botao', onclick: e => { e.stopPropagation(); fecharModal(); abrirAmpliacao(); } }, 'Ampliar a pensão'), el('button', { class: 'botao forte', onclick: e => { e.stopPropagation(); fecharModal(); } }, 'Fechar')));
  abrirModal(caixa);
  sons.tocar('abrir', 1, 0.03, -6);
  return true;
}

// ---------- a noite: fecha a janta ou a Rosa serve sozinha; o relatório no resumo ----------
// (onda final) Uma nota só para a noite: a do fechamento do caixa (Metas.notaDaNoite: o cliente do prato da casa conta, sem
// estrelas) vale também no resumo ao dormir.
// (14/10, Tarefa A) as vendas separadas como no fechamento: os pratos, as bebidas (se houve) e a gorjeta.
function linhaDaJantaNoResumo(r, p) {
  const c = TurnoJanta.conta(r);
  return `Pensão da Rosa ${Pensao.textoEstrelas(p.estrelasCasa())}: ${r.clientes} clientes, ${r.servidos} pratos, Cr$ ${c.pratos}${c.bebidas ? ` + Cr$ ${c.bebidas} em bebidas` : ''} + Cr$ ${r.gorjeta} de gorjeta (nota da noite: ${Metas.notaDaNoite(r)} de 5).`;
}
// A linha do lucro no resumo ao dormir: a receita (com os prêmios), o que saiu e o lucro; e o que o bolso não cobriu.
function linhaDoLucroNoResumo(r) {
  const c = TurnoJanta.conta(r);
  return `   Receita Cr$ ${c.receita}${c.premios ? ` (com Cr$ ${c.premios} de prêmios)` : ''} − despesa e salários Cr$ ${c.despesa + c.salarios} = lucro da noite Cr$ ${c.lucro}.`
    + (r.naoCobriu > 0 ? ` O bolso não cobriu Cr$ ${r.naoCobriu}.` : '');
}
// (onda final) O prato da casa na noite da Rosa sozinha: "sem cardápio" só quando não havia cardápio; com cardápio e falta de
// ingrediente, o que faltou e quem levou o prato da casa; com cardápio sem repõe, quantos levaram.
function deCasaDaRosa(p, rs) {
  if (!rs.casa) return '';
  const C = ECO.pensao.pratoCasa, esc = p.cardapioNoite || {};
  if (!Object.keys(esc).some(id => (esc[id].panelas | 0) > 0 && p.receitas.includes(id))) return ` (sem cardápio: todos levaram o ${C.nome})`;
  const ing = [...new Set(Object.values(rs.ingredientes || {}).flat())];
  if (ing.length) return rs.casa === rs.servidos ? ` (faltou ${listaE(ing.map(nomeNaPanela))}: todos levaram o ${C.nome})`
    : ` (faltou ${listaE(ing.map(nomeNaPanela))}; ${rs.casa === 1 ? 'quem chegou depois levou' : `os ${rs.casa} que chegaram depois levaram`} o ${C.nome})`;
  return ` (${rs.casa} no prato da casa)`;
}
NOITE.push(linhas => {
  if (G.turno) encerrarJanta();
  if (pensaoAbreHoje() && G.pensao.ultimaJanta !== G.dia) noiteDaRosaSozinha(linhas);
  else if (G.relatorioPensao) {
    const r = G.relatorioPensao, p = G.pensao;
    linhas.push(linhaDaJantaNoResumo(r, p));
    if (r.embora) linhas.push(`   ${r.embora} ${r.embora === 1 ? 'foi' : 'foram'} embora sem comer${r.perdida ? ` (Cr$ ${r.perdida} perdidos)` : ''}.`);
    // (o cardápio do Bancho) quem ficou sem prato do quadro levou o prato da casa (o café é só do salão antigo); a sobra foi para o lixo
    if (r.faltou.length) linhas.push(`   Faltou ingrediente para repor: ${r.faltou.map(id => Pratos.PRATOS[id] ? Pratos.PRATOS[id].nome : id).join(', ')}.`);
    if (r.casa) linhas.push(`   ${r.casa} ${r.casa === 1 ? 'cliente levou' : 'clientes levaram'} o prato da casa (${ECO.pensao.pratoCasa.nome}): barato e sem curtida.`);
    if (r.cafes) linhas.push(`   ${r.cafes} ${r.cafes === 1 ? 'cliente tomou' : 'clientes tomaram'} só café (faltou ingrediente).`);
    { const sb = textoSobra(r.sobra); if (sb) linhas.push('   ' + sb); }
    // (revisão da Tarefa A) a despesa e os salários PAGOS, os mesmos da linha do lucro logo abaixo
    { const c = TurnoJanta.conta(r);
      linhas.push(`   ${r.curtidas} ${r.curtidas === 1 ? 'curtida' : 'curtidas'} (clientes de 4 estrelas ou mais) · despesa da noite Cr$ ${c.despesa}${c.salarios ? ` · salários Cr$ ${c.salarios}` : ''} · ${r.bebidas || 0} bebidas${r.desperdicio ? ` · ${r.desperdicio} no lixo` : ''}.`); }
    if (G.relatorioPensao.premioVip) linhas.push(`   O cliente especial adorou! Prêmio: Cr$ ${r.premioVip.dinheiro}, ${r.premioVip.curtidas} curtidas e ${r.premioVip.pitadas} pitadas.`);
    else if (r.vip === 'faltou') linhas.push('   O cliente especial foi embora decepcionado: faltou o prato que ele queria.');
    for (const e of r.pedidosFeitos || []) linhas.push(`   Pedido cumprido: ${e.quem} recebeu ${e.qtd} ${Pratos.PRATOS[e.prato].nome}. Prêmio: Cr$ ${e.premio}.`);
    if (r.lucro != null) linhas.push(linhaDoLucroNoResumo(r));
    if (r.subiu) linhas.push(`A pensão ganhou mais uma estrela: agora é ${p.nomeComEstrelas(r.subiu)}! Mais pratos no quadro, mais banquetas e mais clientes.`);
    else { const px = p.proximoDegrau(); if (px) linhas.push(`   Para "${px.nome}": ${textoFalta(px.falta)}.`); }
    linhas.push('   A Rosa: "' + ['Hoje até o Tonhão pediu bis!', 'Amanhã eu faço mais feijão.', 'O Severino lambeu o prato, Jocelino!', 'A pedra da sopa tá cansada.'][G.dia % 4] + '"');
  }
  G.relatorioPensao = null;
});
// As recompensas de cada estrela nova, uma vez (o save antigo não recebe de novo o que já tinha): a carta da Dona
// Cotinha; na 5ª, o prêmio da Prefeitura, a placa de bronze na fachada e uma noite de festa na pensão.
function premiarEstrelas(linhas) {
  const p = G.pensao, g = p.grau();
  if (p.estrelasPremiadas == null) p.estrelasPremiadas = g;
  while (p.estrelasPremiadas < g) {
    const n = ++p.estrelasPremiadas;
    if (!G.correio.caixa.includes('fama_' + n) && !G.correio.lidas.includes('fama_' + n)) G.correio.caixa.push('fama_' + n);
    if (n === 6) {
      const v = ECO.pensao.premio5.dinheiro; G.dinheiro += v; G.ganhoHoje += v;
      let dia = G.dia + 1; if ((dia - 1) % 7 === 6) dia++; p.festaDia = dia;
      linhas.push(`★★★★★ A Pensão da Rosa é Patrimônio da Vila! A Prefeitura mandou Cr$ ${v} e uma placa de bronze; ${dia === G.dia + 1 ? 'amanhã' : 'na segunda'} tem festa na pensão.`);
      if (MAPAS.vila) poePlacaPatrimonio(MAPAS.vila);
    }
  }
}
NOITE.push(linhas => { if (G.pensao && G.correio) premiarEstrelas(linhas); });
// A placa de bronze "Patrimônio da Vila" na parede da fachada, à direita da porta, sob a janela (enfeite, não é sólida);
// refeita quando a fachada muda de tamanho. Desenhada depois da pensão (o y é o da base + 1) e em 40% do tamanho da arte.
function poePlacaPatrimonio(b) {
  if (!b || b.id !== 'vila' || !G.pensao) return;
  const velha = b.objs.find(o => o.id === 'placa_patrimonio'); if (velha) b.tirar(velha);
  if (G.pensao.grau() < 6) return;
  const f = b.objs.find(o => o.id === 'pensao'); if (!f) return;
  const xs = f.tiles.map(t => t.x), x0 = Math.min(...xs), w = (Math.max(...xs) - x0 + 1) * TILE, y1 = Math.max(...f.tiles.map(t => t.y));
  const o = b.enfeite('objetos/placa_patrimonio', x0, y1, false); o.id = 'placa_patrimonio';
  const px = x0 * TILE + w * 0.68, py = (y1 + 1) * TILE - 64;
  o.y = (y1 + 1) * TILE + 1; o.desenha = ctx => desenhaPe(ctx, 'objetos/placa_patrimonio', px, py, 1, 0.4);
  o.acao = () => abrirPlaca('"Pensão da Rosa — Patrimônio da Vila Maré." A placa de bronze que o Prefeito mandou pôr.');
}
AO_MONTAR.push(b => poePlacaPatrimonio(b));
