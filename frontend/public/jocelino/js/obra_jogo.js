// Jocelino — obra_jogo.js — a obra do Bira no mapa (o roteiro do Godot: roteiro.gd/_bira/trabalho/_gratificacao):
// a conversa com o Mestre Bira (lista da manhã, pagamento, extra, imprevisto, horário), as tarefas nos objetos do
// canteiro (monte, peneira, masseira, entulho, mato, regador e colher na parede), a carga entregue na obra, a arte da
// etapa e o fim do expediente às 17h (a parte feita fica a receber). As regras estão em obra.js.

// Onde renascem (e contam) o entulho e o mato da obra: o retângulo do canteiro da vez (CANTEIROS, mapa_vila.js), que muda com a obra.
const CANTEIRO = { get x() { return canteiroDaVez().ret.x; }, get y() { return canteiroDaVez().ret.y; }, get w() { return canteiroDaVez().ret.w; }, get h() { return canteiroDaVez().ret.h; } };
const EXTRAS_OBRA = { tijolos: 10, areia: 3, massa: 2, pedras: 5, telhas: 10, ripas: 5 };
const CARGA_TAREFA = { tijolo: 'tijolos', pedra: 'pedras', telha: 'telhas', ripa: 'ripas' };
const nomeTarefa = id => TAREFAS_OBRA[id].texto;
const textoLista = l => Object.keys(l.metas).map(id => `• ${nomeTarefa(id)}: ${Math.min(l.metas[id], l.feito[id] || 0)}/${l.metas[id]}`).join('\n');
const listaDeHoje = () => G.obra.lista && G.obra.lista.dia === G.dia ? G.obra.lista : null;
const falaBira = (txt, depois) => { abrirConversa('Mestre Bira', urlArte('retratos/bira_normal'), Array.isArray(txt) ? txt : [txt], depois); return true; };

// O "!" em cima do Bira: tem lista nova, pagamento ou gratificação esperando.
function biraTemNovidade() {
  if (!G.obra) return false;
  if (G.obra.gratificacao || G.obra.aReceber > 0) return true;
  const l = listaDeHoje();
  return !Obra.aberta(G.dia, G.minutos) && (!l || (Obra.completa() && !l.paga));
}

function conversarBira() {
  const o = G.obra;
  // 1) Gratificação da etapa (ou da obra pronta).
  if (o.gratificacao) {
    const r = o.gratificacao; o.gratificacao = null;
    if (r.premio) { G.dinheiro += r.premio.dinheiro; G.ganhoHoje += r.premio.dinheiro; for (const id in r.premio.itens) { const resto = G.mochila.adicionar(id, r.premio.itens[id]); if (resto) soltar(id, resto, G.jog.x, G.jog.y); } hudSujo(); }
    const itens = r.premio ? Object.entries(r.premio.itens).map(([id, q]) => Itens.qtd(q, id)).join(', ') : '';
    sons.tocar('fanfarra', 1, 0, -6);
    if (r.obraPronta) return falaBira([`${r.nomeObra} pronta! Festa da cumeeira, rapaz! Toma a gratificação: Cr$ ${r.premio.dinheiro}${itens ? ' e ' + itens : ''}.`,
      Obra.obra().id === 'reformas' && o.funcao < 3 ? 'O Edifício Maré do Seu Moreira é serviço pra mestre de obras. Até lá, a gente toca as reformas pela Vila.' : `A próxima obra é ${Obra.obra().nome}. Começa do zero.`]);
    return falaBira(`Etapa entregue! Toma a gratificação: Cr$ ${r.premio.dinheiro}${itens ? ' e ' + itens : ''}. Amanhã começa a etapa: ${Obra.obra().etapas[o.etapa].nome}. O serviço muda.`);
  }
  // 2) A parte de ontem (ou de hoje cedo).
  if (o.aReceber > 0) { const v = o.aReceber; o.aReceber = 0; G.dinheiro += v; G.ganhoHoje += v; if (typeof lojinhaDepoisDaDiaria === 'function') lojinhaDepoisDaDiaria(); hudSujo(); sons.tocar('moedas', 1, 0.05, -6); return falaBira(v >= Obra.diaria() ? `A diária da lista completa, rapaz: Cr$ ${v}. Serviço inteiro, pagamento inteiro.` : `A parte que você fez: Cr$ ${v}. Serviço pela metade, pagamento pela metade.`); }
  // A promoção (meio-oficial e pedreiro: o Bira; mestre de obras: o Seu Moreira, no canteiro).
  if (Obra.podeSubir() && o.funcao < 2) {
    if (o.funcao === 0 && !G.mochila.cabe('colher')) return falaBira('Rapaz, tenho novidade pra você. Mas abre um espaço na mochila primeiro!');
    const f = Obra.subir(); sons.tocar('fanfarra', 1, 0, -4);
    if (f === 1) { G.mochila.adicionar('colher', 1); hudSujo(); return falaBira(['Rapaz, você é bom de serviço. A partir de hoje é meio-oficial! A diária sobe para Cr$ ' + DIARIAS[1] + '.', 'Toma a minha colher velha: agora você assenta tijolo e chapisca. E já pode pegar empreita maior no quadro da Vila.']); }
    return falaBira(['Pedreiro! Levantou parede, rebocou, entregou obra. A diária agora é Cr$ ' + DIARIAS[2] + '.', 'Empreita boa no quadro agora é com você: baldrame, quiosque, ponte. Capricha que o povo paga mais.']);
  }
  // 3) Horário, domingo e chuva.
  const fechada = Obra.aberta(G.dia, G.minutos);
  if (fechada === 'domingo') return falaBira('Domingo é dia de descanso, rapaz. Vai cuidar das suas coisas.');
  if (fechada === 'chuva') return falaBira('Com essa chuva não dá pra trabalhar. Hoje a obra fica fechada.');
  if (fechada === 'cedo') return falaBira('Ainda tá escuro, rapaz. Assim que o sol sair a gente começa.');
  if (fechada === 'tarde') return falaBira('Por hoje a obra parou, rapaz: às cinco a turma vai embora. Amanhã tem mais, a hora que você chegar.');
  let l = listaDeHoje();
  // 4) A lista do dia.
  if (!l) {
    // (13/10) O primeiro encontro é a contratação: o Tio Juca disse que o Bira paga servente por dia; aqui ele confirma e diz o porquê.
    const contratacao = o.primeira;
    l = o.lista = Object.assign({ dia: G.dia, feito: {}, paga: false }, Obra.sortear(G.dia));
    if (G.mapa && G.mapa.id === 'vila') poeEntulhoDaObra(G.mapa);   // (quebrou entulho antes da lista? o canteiro completa o que ela pede)
    sons.tocar('pagina', 1, 0.05, -6);
    const fala = [`Bom dia, ${FUNCOES[o.funcao].toLowerCase()}! Hoje na ${Obra.obra().nome} (${Obra.obra().etapas[o.etapa].nome}):\n${textoLista(l)}`, 'Terminou, volta aqui que eu acerto a diária.'];
    if (contratacao) fala.unshift(`Então você é o sobrinho do Juca! Ele me falou de você. Servente eu preciso, sim: Cr$ ${Obra.diaria()} por dia, pago quando a lista do dia fica pronta.`,
      'A obra é de sol a sol, até as cinco: chegou, trabalhou. Quem aprende o ofício aqui vira meio-oficial, e meio-oficial já levanta a casa da família.');
    return falaBira(fala);
  }
  // Imprevisto: o cimento comprado no Ananias.
  if (l.metas.buscar_cimento && (l.feito.buscar_cimento || 0) < l.metas.buscar_cimento && G.mochila.total('cimento') > 0) {
    const n = Math.min(G.mochila.total('cimento'), l.metas.buscar_cimento - (l.feito.buscar_cimento || 0));
    G.mochila.remover('cimento', n); G.dinheiro += n * 12; Obra.trabalho('buscar_cimento', n); hudSujo();
  }
  // As pedras trazidas na mochila: o Bira recebe também (o passo diz "traga e fale comigo"; teste de 13/10: "não falava onde").
  { const e = entregarPedrasDaMochila();
    if (e && !Obra.completa()) return falaBira(`Boa, ${Itens.qtd(e.n, 'pedra')} pro alicerce! Faltam ${l.metas[e.t] - l.feito[e.t]}${e.t === 'buscar_pedra' ? (G.lugares && G.lugares.pedreira ? ': as do quintal ou da pedreira, na picareta' : ': as do quintal, na picareta') : ': o resto tem no monte do canteiro'}.`); }
  // 5) Lista completa: a diária e o extra.
  if (Obra.completa() && !l.paga) {
    const v = Obra.pagar(); G.dinheiro += v; G.ganhoHoje += v; if (typeof lojinhaDepoisDaDiaria === 'function') lojinhaDepoisDaDiaria(); hudSujo(); sons.tocar('moedas', 1, 0.05, -4);
    if (o.funcao <= 1 && !l.extra) return falaBira(`Lista completa! A diária: Cr$ ${v}.`, () => perguntar(`Mestre Bira: "Quer um extra hoje? Pago Cr$ ${valorExtra()}."`, ['Quero', 'Hoje não'], i => {
      if (i !== 0) return;
      const ids = Object.keys(EXTRAS_OBRA).filter(id => Obra.obra().etapas[o.etapa].tarefas.includes(id));
      const id = ids[G.dia % ids.length] || 'tijolos';
      l.extra = true; l.paga = false; l.metas[id] = (l.metas[id] || 0) + EXTRAS_OBRA[id]; l.valorExtra = valorExtra();
      avisar(`Extra: ${nomeTarefa(id)} mais ${EXTRAS_OBRA[id]}.`);
    }));
    return falaBira(`Lista completa! ${l.extra ? 'O extra' : 'A diária'}: Cr$ ${v}. Bom serviço.`);
  }
  if (l.paga) return falaBira('Por hoje tá pago, rapaz. Amanhã tem mais.');
  // 6) O que falta.
  if (o.funcao >= 3) return falaBira(`Mestre, a turma tá esperando as ordens na prancheta. Falta:\n${textoLista(l)}`);
  return falaBira(`Ainda falta:\n${textoLista(l)}`);
}
// O extra paga OBRA_EXTRA (o dobro com Fama), sem a diária de novo.
const valorExtra = () => OBRA_EXTRA * (typeof Habilidades !== 'undefined' && Habilidades.tem('fama') ? 2 : 1);

// ---------- no mapa ----------
function poeObraNoMapa(b) {
  if (b.id !== 'vila') return;
  // A obra da vez mudou (a casa da Dona Zélia ficou pronta, o Mercado começou...): o canteiro muda junto, e a turma vai com ele.
  if (b.canteiro !== lugarDoCanteiro()) { poeCanteiro(b, lugarDoCanteiro()); tiraEntulhoVelho(b); if (typeof poePeoes === 'function') poePeoes(b); }
  const casa = b.objs.find(o => o.obraId === 'casa_zelia');
  if (casa) casa.nome = G.obra.indice === 0 ? Obra.arteAtual() : 'objetos/casa_zelia_6';
  const merc = b.objs.find(o => o.id === 'mercado');
  if (merc) { merc.obraId = 'mercado'; merc.nome = G.obra.indice < 1 ? 'objetos/mercado_0' : G.obra.indice === 1 ? Obra.arteAtual() : 'objetos/mercado_3'; merc.acao = () => acaoNaObra(merc); merc.ferramenta = (o, id) => ferramentaNaObra(o, id); }
  if (casa) { casa.acao = () => acaoNaObra(casa); casa.ferramenta = (o, id) => ferramentaNaObra(o, id); }
  const bira = b.moradores.find(m => m.id === 'bira'); if (bira) bira.aoConversar = () => conversarBira();
  // A escola e o Edifício Maré nos lotes livres da Vila (LOTES_DAS_OBRAS). Entulho, mato ou achado que tenha ficado no lote
  // (do save, do canteiro velho) sai: nada fica escondido debaixo da obra.
  for (const [obraId, idx] of [['escola', 2], ['predio', 3]]) {
    const [x, y, w, h] = LOTES_DAS_OBRAS[obraId];
    let ob = b.objs.find(o => o.obraId === obraId);
    const daVez = Obra.obra().id === obraId;
    if ((daVez || G.obra.indice > idx) && !ob) { ob = b.interativo('obra_' + obraId, 'objetos/alicerce', x, y, w, h); ob.obraId = obraId; }
    if (ob) {
      ob.nome = daVez ? Obra.arteAtual() : (obraId === 'escola' ? 'objetos/escola' : 'objetos/predio_7'); ob.acao = () => acaoNaObra(ob); ob.ferramenta = (o2, id) => ferramentaNaObra(o2, id);
      for (const o2 of b.objs.filter(q => (q.tipo === 'detrito' || q.achado) && (q.tiles || []).some(t => ob.tiles.some(u => u.x === t.x && u.y === t.y)))) b.tirar(o2);
      for (const t of ob.tiles) b.ocupado.set(chaveT(t.x, t.y), ob);
    }
  }
  // O Seu Moreira vem oferecer o cargo de mestre de obras (volta todo dia até aceitar).
  const santos = b.moradores.find(m => m.id === 'santos');
  if (G.obra.funcao === 2 && Obra.podeSubir()) {
    if (!santos) { const g = canteiroDaVez().gente.santos, s = b.morador('santos', 'Seu Moreira', g[0], g[1], DIR.ESQUERDA); s.aoConversar = () => propostaDeMestre(); }
  } else if (santos) b.moradores = b.moradores.filter(m => m !== santos);
  const ze = b.moradores.find(m => m.id === 'ze'); if (ze) ze.aoConversar = () => conversarZe(ze);
  for (const [id, f] of [['monte_tijolos', pegarDoMonte], ['pilha_ripas', () => pegarCargaObra('ripa', 'itens/ripa', 'ripas')], ['peneira', peneirar], ['masseira', () => pegarCargaObra('massa', 'itens/massa', 'massa')]]) {
    const o = b.objs.find(x => x.id === id); if (o) o.acao = () => { f(o); return true; };
  }
}
function propostaDeMestre() {
  abrirConversa('Seu Moreira', urlArte('retratos/santos_normal'), ['Jocelino, o Bira me contou: quatro obras entregues, empreita pela Vila inteira, parede no prumo.', 'Quero você de mestre de obras. Vai comandar a turma: o Zé, o Severino, o Cícero e o Damião. A primeira obra é o Edifício Maré.'],
    () => perguntar('Seu Moreira: "Aceita ser mestre de obras da J. Moreira?"', ['Aceito!', 'Agora não'], i => {
      if (i !== 0) { avisar('O Seu Moreira volta amanhã para perguntar de novo.'); return; }
      Obra.subir(); G.obra.indice = 3; G.obra.etapa = 0; G.obra.diasEtapa = 0; G.obra.lista = null;
      if (typeof EquipeObra !== 'undefined') EquipeObra.iniciar({});
      sons.tocar('fanfarra', 1, 0, -2); avisar(`Mestre de obras! A diária agora é Cr$ ${DIARIAS[3]}. A turma espera as ordens na prancheta.`);
      if (MAPAS.vila) { poeObraNoMapa(MAPAS.vila); poeEntulhoDaObra(MAPAS.vila); }   // (o canteiro vai para o prédio)
    }));
  return true;
}
function obraDaVez(o) { return o.obraId === (Obra.obra().lugar || Obra.obra().id); }
// A obra da vez nas frases e nas setas do guia (o canteiro segue a obra: a casa da Dona Zélia, depois o Mercado...).
const OBRA_NA_FRASE = { casa_zelia: 'a obra da casa da Dona Zélia', mercado: 'a obra do Mercado', reformas: 'a obra do Mercado', escola: 'a obra da Escola', predio: 'a obra do Edifício Maré' };
const aObraDaVez = () => OBRA_NA_FRASE[lugarDoCanteiro()] || 'a obra';
const idDaObraDaVez = () => { const o = G.mapa && G.mapa.objs.find(x => x.obraId && obraDaVez(x)); return o ? o.id : 'casa_zelia'; };
function acaoNaObra(o) {
  if (!obraDaVez(o)) { abrirPlaca({ casa_zelia: 'A casa da Dona Zélia, pronta. Bonita, né?', mercado: G.obra.indice > 1 ? 'O Mercado Municipal reformado e aberto.' : 'O Mercado Municipal, precisando de reforma.', escola: 'A Escola da Vila, pronta para as crianças.', predio: 'O Edifício Maré da J. Moreira.' }[o.obraId] || ''); return true; }
  const l = listaDeHoje(), c = G.jog.carga || {};
  if (c.id && CARGA_TAREFA[c.id]) {
    const t = c.id === 'pedra' && l && l.metas.buscar_pedra ? 'buscar_pedra' : CARGA_TAREFA[c.id];
    const r = Obra.trabalho(t, c.qtd);
    if (r === 'sem_lista') { avisar('Primeiro pegue a lista com o Mestre Bira.'); return true; }
    if (r === 'nao_pede') { avisar('Hoje a lista não pede isso.'); return true; }
    largarCarga(); sons.tocar('pousar', 1, 0.05, -4); avisar(r === 'completa' ? 'Lista completa! Fale com o Mestre Bira.' : `Feito: ${nomeTarefa(t)}.`); return true;
  }
  // Pedras trazidas na mochila (as do quintal, na picareta; depois também da pedreira).
  const e = entregarPedrasDaMochila();
  if (e) { avisar(e.r === 'completa' ? 'Lista completa! Fale com o Mestre Bira.' : `Entregou ${Itens.qtd(e.n, 'pedra')} (${nomeTarefa(e.t)} ${l.feito[e.t]}/${l.metas[e.t]}).`); return true; }
  abrirPlaca(`${Obra.obra().nome} — etapa: ${Obra.obra().etapas[G.obra.etapa].nome}.${l ? '\n' + textoLista(l) : ' O Mestre Bira passa a lista do dia: é só falar com ele.'}`);
  return true;
}
// As pedras da mochila valem para "trazer pedras" e para "levar pedras para o alicerce" (diário de 13/10: "não aceita pedras
// que peguei" — só valia a pedra do monte, nos braços). Devolve {t, n, r} ou null.
function entregarPedrasDaMochila() {
  const l = listaDeHoje(); if (!l || G.mochila.total('pedra') <= 0) return null;
  const t = ['buscar_pedra', 'pedras'].find(k => l.metas[k] && (l.feito[k] || 0) < l.metas[k]); if (!t) return null;
  const n = Math.min(G.mochila.total('pedra'), l.metas[t] - (l.feito[t] || 0));
  G.mochila.remover('pedra', n); const r = Obra.trabalho(t, n); hudSujo(); sons.tocar('pousar', 1, 0.05, -4);
  return { t, n, r };
}
function ferramentaNaObra(o, id) {
  if (!obraDaVez(o)) return;
  const l = listaDeHoje(); if (!l) { avisar('Primeiro pegue a lista com o Mestre Bira.'); return; }
  const H = typeof Habilidades !== 'undefined' ? Habilidades : { tem: () => false };
  let t = '', n = 1;
  if (id === 'regador') { t = 'molhar'; n = H.tem('pintor') ? 5 : H.tem('capricho') ? 3 : 1; }
  else if (id === 'colher') { t = l.metas.assentar && (l.feito.assentar || 0) < l.metas.assentar ? 'assentar' : 'rebocar'; if (t === 'rebocar') n = H.tem('pintor') ? 5 : H.tem('capricho') ? 3 : 1; }
  if (!t) return;
  const r = Obra.trabalho(t, n);
  if (r === 'nao_pede') avisar('Hoje a lista não pede isso.');
  else if (r === 'completa') avisar('Lista completa! Fale com o Mestre Bira.');
}
const faltaNaLista = id => { const l = listaDeHoje(); return !!(l && l.metas[id] && (l.feito[id] || 0) < l.metas[id]); };
// Clicar no monte, nas ripas ou na masseira com o material do canteiro nos braços devolve.
function devolveuCarga() {
  const c = G.jog.carga || {};
  if (!c.id || !['tijolo', 'pedra', 'telha', 'ripa', 'massa', 'entulho'].includes(c.id)) return false;
  largarCarga(); sons.tocar('pousar', 1, 0.05, -6); avisar('Devolveu o material ao monte.'); return true;
}
// O monte mostra o material que a lista pede (teste de 13/10: com "levar pedras", o monte continuava de tijolos e só virava
// pedra depois do clique).
const ARTE_MONTE = { pedra: 'objetos/monte_pedras', telha: 'objetos/monte_telhas', tijolo: 'objetos/monte_tijolos' };
const materialDoMonte = () => faltaNaLista('pedras') ? 'pedra' : faltaNaLista('telhas') ? 'telha' : faltaNaLista('tijolos') ? 'tijolo' : '';
ATUALIZADORES.push(() => {
  if (G.mapaId !== 'vila' || !G.mapa || !G.obra) return;
  const o = G.mapa.objs.find(x => x.id === 'monte_tijolos'), m = materialDoMonte();
  if (o && m && o.nome !== ARTE_MONTE[m]) o.nome = ARTE_MONTE[m];
});
function pegarDoMonte(o) {
  if (devolveuCarga()) return;
  if (!listaDeHoje()) { avisar('Primeiro pegue a lista com o Mestre Bira.'); return; }
  const mat = materialDoMonte();
  if (!mat) { avisar('Hoje a lista não pede tijolo, pedra nem telha.'); return; }
  o.nome = ARTE_MONTE[mat];
  pegarCarga(mat, 99, 'itens/' + mat);
}
function pegarCargaObra(mat, icone, tarefa) {
  if (devolveuCarga()) return;
  if (!listaDeHoje()) { avisar('Primeiro pegue a lista com o Mestre Bira.'); return; }
  if (!faltaNaLista(tarefa)) { avisar('Hoje a lista não pede isso.'); return; }
  pegarCarga(mat, 99, icone);
}
function peneirar() {
  const r = Obra.trabalho('areia', 1);
  if (r === 'sem_lista') { avisar('Primeiro pegue a lista com o Mestre Bira.'); return; }
  if (r === 'nao_pede') { avisar('Hoje a lista não pede areia.'); return; }
  const pn = G.mapa && G.mapa.objs.find(x => x.id === 'peneira');   // (a peneira do canteiro da vez)
  sons.tocar('terra', 1.2, 0.08, -6); if (pn) lascas(pn.x, pn.y - TILE, 'terra');
  if (r === 'completa') avisar('Lista completa! Fale com o Mestre Bira.');
}
function conversarZe(p) {
  const c = G.jog.carga || {};
  if (c.id === 'massa') {
    const r = Obra.trabalho('massa', 1);
    if (r !== 'nao_pede' && r !== 'sem_lista') { largarCarga(); sons.tocar('pousar', 0.9, 0.05, -4); abrirConversa('Zé', urlArte('retratos/ze_normal'), [r === 'completa' ? 'Valeu! Massa no ponto. Lista completa, fala com o Bira.' : 'Isso! Massa boa é igual feijão: nem mole, nem dura.']); return true; }
  }
  const f = FALAS.ze, lista = typeof f === 'function' ? f() : f;
  abrirConversa('Zé', urlArte('retratos/ze_normal'), lista);
  return true;
}
// O entulho e o mato do canteiro da vez renascem toda manhã, na conta da lista do dia: a de hoje (o que ainda falta) ou a que o
// Bira vai dar (o sorteio é fixo pelo dia), mais 2 de folga; o que a lista não pede fica em 2, de enfeite. (tarefa 7, o robô
// jogador: a lista pedia "Capinar o mato do canteiro" 10 vezes com 8 matos. 15/10, o robô de novo: pedia 10 com 9 alcançáveis —
// os presos saíam DEPOIS de contar.) Agora cada um só nasce se, com ele, tudo continua alcançável: as coisas do canteiro, a
// obra, os outros montinhos e o resto da Vila (nada de fora fica preso). Primeiro nascem espaçados (sem fechar corredor); se o
// canteiro for apertado, a 2ª passada aperta, e a folga cede antes do que a lista pede (a s2 confere: sempre o que ela pede).
function poeEntulhoDaObra(b) {
  if (b.id !== 'vila' || !G.obra) return;
  tiraEntulhoVelho(b);
  const C = canteiroDaVez(), R = C.ret, f = mulberry(G.dia * 389 + 7);
  const daObra = o => (o.det === 'mato' || o.det === 'entulho') && !o.empreitaDet && dentroR(R, o.tiles[0].x, o.tiles[0].y);
  const grade = gradeDaVila(b), solta = o => { const t = o.tiles[0]; b.tirar(o); grade[t.y * b.larg + t.x] = andaNaVila(b, t.x, t.y) ? 1 : 0; };
  let vis = alcancaveisNaVila(b, grade);
  for (const o of b.objs.filter(o => daObra(o) && !alcancaLadrilho(vis, o.tiles[0]))) solta(o);   // (o que ficou preso de ontem)
  vis = alcancaveisNaVila(b, grade);
  const foraDoRet = v => { let n = 0; for (const k of v) { const [x, y] = k.split(',').map(Number); if (!dentroR(R, x, y)) n++; } return n; };
  const fora0 = foraDoRet(vis), obra = b.objs.find(o => o.obraId && obraDaVez(o));
  const pecas = b.objs.filter(o => o.doCanteiro && o.tiles).concat(obra ? [obra] : []);
  // (cada coisa do canteiro continua com 2 lados para chegar, como no canteiro vazio; quem trabalha nele não fica ilhado)
  const lados = (o, v) => { const s = new Set(); for (const t of o.tiles) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (v.has(chaveT(t.x + dx, t.y + dy)) && !o.tiles.some(u => u.x === t.x + dx && u.y === t.y + dy)) s.add(dx + ',' + dy); return s.size; };
  const ladosMin = new Map(pecas.map(o => [o, Math.min(2, lados(o, vis))]));
  const ladrilhoDe = m => chaveT(Math.floor(m.x / TILE), Math.floor((m.y - 6) / TILE));
  const turma = (b.moradores || []).filter(m => C.gente[m.id] && vis.has(ladrilhoDe(m))).map(ladrilhoDe);
  const tudoAlcanca = v => pecas.every(o => lados(o, v) >= ladosMin.get(o)) && turma.every(k => v.has(k)) && b.objs.every(o => !daObra(o) || alcancaLadrilho(v, o.tiles[0])) && foraDoRet(v) >= fora0;
  // Quantos: o que a lista pede (falta) + 2; sem pedido, 2.
  const pede = metasDaObraHoje(), quer = {}, minimo = {};
  for (const [det, t] of [['entulho', 'entulho'], ['mato', 'capinar']]) { minimo[det] = pede[t] || 0; quer[det] = minimo[det] ? minimo[det] + 2 : 2; }
  // Onde pode: grama livre do ret, fora do "fora", dos lotes reservados, do pé de um enfeite baixo e de perto de quem está na Vila.
  const reserva = reservaDaVila(b), gente = new Set((b.moradores || []).filter(m => m.visivel !== false).map(m => chaveT(Math.floor(m.x / TILE), Math.floor((m.y - 6) / TILE))));
  const eu = G.mapa === b && G.jog ? G.jog.ladrilho() : null;   // (nada nasce em cima de ninguém, nem do lado do Jocelino)
  const cands = [];
  for (let y = R.y; y < R.y + R.h; y++) for (let x = R.x; x < R.x + R.w; x++) {
    if (b.ocupado.has(chaveT(x, y)) || b.chaoEm(x, y) !== CH.GRAMA || !grade[y * b.larg + x] || C.fora.some(r => dentroR(r, x, y)) || reserva.has(chaveT(x, y))) continue;
    if (gente.has(chaveT(x, y)) || (eu && Math.abs(eu.x - x) <= 1 && Math.abs(eu.y - y) <= 1)) continue;
    cands.push({ x, y, r: f() });
  }
  cands.sort((a, c) => a.r - c.r);
  const conta = det => b.objs.filter(o => o.det === det && daObra(o)).length;
  const vizOcupados = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => b.ocupado.has(chaveT(x + dx, y + dy))).length;
  // Primeiro o que a lista pede (espaçados; se não couber, apertando), depois a folga (do mesmo jeito).
  for (const [espaco, alvo] of [[true, minimo], [false, minimo], [true, quer], [false, quer]]) {
    for (let mudou = true; mudou;) {
      mudou = false;
      for (const det of ['entulho', 'mato']) {
        if (conta(det) >= alvo[det]) continue;
        for (const c of cands) {
          if (c.usado || b.ocupado.has(chaveT(c.x, c.y)) || !alcancaLadrilho(vis, c) || (espaco && vizOcupados(c.x, c.y) > 1)) continue;
          const o = b.detrito(det, c.x, c.y); if (!o) { c.usado = true; continue; }
          grade[c.y * b.larg + c.x] = 0;
          const v = alcancaveisNaVila(b, grade);
          if (!tudoAlcanca(v)) { solta(o); c.usado = true; continue; }   // (fecharia um caminho: com mais montinhos, só piora)
          c.usado = true; vis = v; mudou = true; break;   // (um de cada, alternando: o entulho e o mato se espalham juntos)
        }
      }
    }
  }
}
// O entulho e o mato de um canteiro velho (a obra mudou) somem; o do canteiro da vez e o das empreitas ficam.
function tiraEntulhoVelho(b) {
  const R = canteiroDaVez().ret, todos = Object.values(CANTEIROS).map(c => c.ret);
  for (const o of b.objs.filter(o => (o.det === 'mato' || o.det === 'entulho') && !o.empreitaDet)) {
    const t = o.tiles[0];
    if (!dentroR(R, t.x, t.y) && todos.some(r => dentroR(r, t.x, t.y))) b.tirar(o);
  }
}
// O que a lista do dia ainda pede: a de hoje (o que falta), ou a que o Bira vai dar hoje (o sorteio é fixo pelo dia e pela obra;
// o "primeira vez" fica como estava).
function metasDaObraHoje() {
  const l = listaDeHoje();
  if (l) { const r = {}; if (!l.paga && !l.fechado) for (const id in l.metas) r[id] = Math.max(0, l.metas[id] - (l.feito[id] || 0)); return r; }
  const p = G.obra.primeira, r = Obra.sortear(G.dia); G.obra.primeira = p;
  return r.metas || {};
}
// Os ladrilhos da Vila guardados para outra coisa: os lotes das empreitas e da Prefeitura (mesmo antes de aceitas) e o lugar
// da carroça do viajante (com o Seu Nonato do lado). Nem o canteiro nem o entulho dele vão para lá.
function reservaDaVila(b) {
  const r = new Set(), lote = E => { if (E && E.mapa === b.id && (E.area || E.artes) && typeof tilesDoLote === 'function') for (const t of tilesDoLote(E)) r.add(chaveT(t.x, t.y)); };
  if (typeof EMPREITAS_LONGAS !== 'undefined') for (const id in EMPREITAS_LONGAS) lote(EMPREITAS_LONGAS[id]);
  if (typeof PREFEITURA_OBRAS !== 'undefined') for (const id in PREFEITURA_OBRAS) lote(Object.assign({ mapa: 'vila' }, PREFEITURA_OBRAS[id]));
  if (typeof LOCAL_CURTA !== 'undefined') for (const id in LOCAL_CURTA) { const E = dadosEmpreita(id), a = LOCAL_CURTA[id].area; if (E && E.mapa === b.id && a) for (let x = a.x; x < a.x + a.w; x++) for (let y = a.y; y < a.y + a.h; y++) r.add(chaveT(x, y)); }
  if (b.id === 'vila' && typeof VIAJANTE_LUGAR !== 'undefined') for (let x = VIAJANTE_LUGAR.x; x <= VIAJANTE_LUGAR.x + 4; x++) for (const y of [VIAJANTE_LUGAR.y - 1, VIAJANTE_LUGAR.y]) r.add(chaveT(x, y));
  for (const o of b.objs) if (o.tipo === 'enfeite' && !o.solido) r.add(chaveT(Math.floor(o.x / TILE), Math.floor(o.y / TILE) - 1));   // (o arbusto, a bandeirinha)
  return r;
}
// Os ladrilhos da Vila aonde o pé do Jocelino chega (a partir da chegada do quintal), e se um ladrilho tem um vizinho (até na diagonal) alcançável.
// Com a grade (1 = o pé cabe), a conta não pergunta à colisão de novo (poeEntulhoDaObra testa um montinho de cada vez).
const andaNaVila = (b, x, y) => x >= 0 && y >= 0 && x < b.larg && y < b.alt && !bate({ x: (x + 0.5) * TILE - 14, y: y * TILE + 22, w: 28, h: 14 }, b);
function gradeDaVila(b) { const g = new Uint8Array(b.larg * b.alt); for (let y = 0; y < b.alt; y++) for (let x = 0; x < b.larg; x++) g[y * b.larg + x] = andaNaVila(b, x, y) ? 1 : 0; return g; }
function alcancaveisNaVila(b, grade = null) {
  const anda = grade ? (x, y) => x >= 0 && y >= 0 && x < b.larg && y < b.alt && grade[y * b.larg + x] === 1 : (x, y) => andaNaVila(b, x, y);
  const vis = new Set([chaveT(23, 3)]), fila = [[23, 3]];
  while (fila.length) { const [cx, cy] = fila.shift(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = cx + dx, y = cy + dy, k = chaveT(x, y); if (vis.has(k) || !anda(x, y)) continue; vis.add(k); fila.push([x, y]); } }
  return vis;
}
const alcancaLadrilho = (vis, t) => { for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) if (vis.has(chaveT(t.x + i, t.y + j))) return true; return false; };
// Quebrar entulho e mato no canteiro conta na lista.
function quebrouNaObra(o) {
  if (G.mapaId !== 'vila' || !dentroR(CANTEIRO, o.tiles[0].x, o.tiles[0].y)) return;
  if (o.det === 'entulho') Obra.trabalho('entulho', 1);
  else if (o.det === 'mato') Obra.trabalho('capinar', 1);
}

AO_MONTAR.push(b => { if (b.id === 'vila') poeObraNoMapa(b); });
DEPOIS_DE_MONTAR.push(b => { if (b.id === 'vila') poeEntulhoDaObra(b); });   // (com o Grêmio, os lotes e a carroça já no lugar)
AO_ENTRAR_MAPA.push(id => { if (id === 'vila') poeObraNoMapa(G.mapa); });
MANHA.push(() => { if (MAPAS.vila) { poeObraNoMapa(MAPAS.vila); poeEntulhoDaObra(MAPAS.vila); } });
// (onda final, o robô #27) O imprevisto guardado entra na lista às 8h, quando o depósito abre (com a lista já completa, não vem).
ATUALIZADORES.push(() => {
  const l = G.obra && listaDeHoje();
  if (!l || !l.imprevisto || G.minutos < DEPOSITO_HORARIO.abre) return;
  l.imprevisto = false;
  if (l.paga || l.fechado || Obra.completa()) return;
  l.metas.buscar_cimento = 2; hudSujo();
  avisar('Imprevisto na obra: o Bira precisa de 2 sacos de cimento. O depósito do Seu Ananias acabou de abrir.');
});
// Às 17h a obra para; a parte feita fica a receber.
ATUALIZADORES.push(() => {
  const l = G.obra && listaDeHoje();
  if (l && G.minutos >= OBRA_FECHA && !l.paga && !l.fechado) { const r = Obra.fecharDia(); if (r.valor) avisar(`Cinco da tarde: a obra parou. A parte que você fez (Cr$ ${r.valor}) o Bira acerta depois.`); }
});
// A noite: o dia trabalhado faz a obra andar; a etapa nova fica para o Bira acertar de manhã.
NOITE.push(linhas => {
  const l = listaDeHoje(); if (!l) return;
  if (!l.paga && !l.fechado) Obra.fecharDia();
  if (!l.contou) return;
  const nome = Obra.obra().nome, r = Obra.avancar();
  if (r.etapaNova) { G.obra.gratificacao = Object.assign({ nomeObra: nome }, r); linhas.push(r.obraPronta ? `${nome} ficou pronta! O Mestre Bira quer falar com você.` : `A obra avançou: começa a etapa ${Obra.obra().etapas[G.obra.etapa].nome}.`); }
  if (MAPAS.vila) poeObraNoMapa(MAPAS.vila);
});
TAREFAS.push(() => G.obra && Obra.podeSubir() ? [{ texto: G.obra.funcao === 2 ? '★ Carreira: o Seu Moreira quer falar com você no canteiro' : '★ Carreira: fale com o Mestre Bira (promoção!)', urgente: true }] : []);
TAREFAS.push(() => {
  if (!G.obra) return [];
  const l = listaDeHoje(), fechada = Obra.aberta(G.dia, G.minutos);
  if (!l) return fechada ? [] : [{ texto: 'Obra: falar com o Mestre Bira, na Vila' }];
  if (l.paga) return [];
  if (Obra.completa()) return [{ texto: 'Obra: lista completa, receber com o Bira', mapa: 'vila' }];
  return Object.keys(l.metas).filter(id => (l.feito[id] || 0) < l.metas[id]).map(id => ({ texto: 'Obra: ' + nomeTarefa(id), feito: l.feito[id] || 0, meta: l.metas[id], mapa: 'vila' }));
});
