// Jocelino — obra_jogo.js — a obra do Bira no mapa (o roteiro do Godot: roteiro.gd/_bira/trabalho/_gratificacao):
// a conversa com o Mestre Bira (lista da manhã, pagamento, extra, imprevisto, horário), as tarefas nos objetos do
// canteiro (monte, peneira, masseira, entulho, mato, regador e colher na parede), a carga entregue na obra, a arte da
// etapa e o meio-dia (a parte feita fica a receber). As regras estão em obra.js.

const CANTEIRO = { x: 29, y: 3, w: 16, h: 6 };                 // onde renascem o entulho e o mato da obra
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
    if (r.premio) { G.dinheiro += r.premio.dinheiro; G.ganhoHoje += r.premio.dinheiro; for (const id in r.premio.itens) G.mochila.adicionar(id, r.premio.itens[id]); hudSujo(); }
    const itens = r.premio ? Object.entries(r.premio.itens).map(([id, q]) => Itens.qtd(q, id)).join(', ') : '';
    sons.tocar('fanfarra', 1, 0, -6);
    if (r.obraPronta) return falaBira([`${r.nomeObra} pronta! Festa da cumeeira, rapaz! Toma a gratificação: Cr$ ${r.premio.dinheiro}${itens ? ' e ' + itens : ''}.`, `A próxima obra é ${Obra.obra().nome}. Começa do zero.`]);
    return falaBira(`Etapa entregue! Toma a gratificação: Cr$ ${r.premio.dinheiro}${itens ? ' e ' + itens : ''}. Amanhã começa a etapa: ${Obra.obra().etapas[o.etapa].nome}. O serviço muda.`);
  }
  // 2) A parte de ontem (ou de hoje cedo).
  if (o.aReceber > 0) { const v = o.aReceber; o.aReceber = 0; G.dinheiro += v; G.ganhoHoje += v; hudSujo(); sons.tocar('moedas', 1, 0.05, -6); return falaBira(`A parte que você fez: Cr$ ${v}. Serviço pela metade, pagamento pela metade.`); }
  // A promoção (meio-oficial e pedreiro: o Bira; mestre de obras: o Seu Santos, no canteiro).
  if (Obra.podeSubir() && o.funcao < 2) {
    const f = Obra.subir(); sons.tocar('fanfarra', 1, 0, -4);
    if (f === 1) { G.mochila.adicionar('colher', 1); hudSujo(); return falaBira(['Rapaz, você é bom de serviço. A partir de hoje é meio-oficial! A diária sobe para Cr$ 45.', 'Toma a minha colher velha: agora você assenta tijolo e chapisca. E já pode pegar empreita maior no quadro da Vila.']); }
    return falaBira(['Pedreiro! Levantou parede, rebocou, entregou obra. A diária agora é Cr$ 60.', 'Empreita boa no quadro agora é com você: baldrame, quiosque, ponte. Capricha que o povo paga mais.']);
  }
  // 3) Horário, domingo e chuva.
  const fechada = Obra.aberta(G.dia, G.minutos);
  if (fechada === 'domingo') return falaBira('Domingo é dia de descanso, rapaz. Vai cuidar das suas coisas.');
  if (fechada === 'chuva') return falaBira('Com essa chuva não dá pra trabalhar. Hoje a obra fica fechada.');
  if (fechada === 'cedo') return falaBira('A obra abre às 7h. Toma um café e volta.');
  if (fechada === 'tarde') return falaBira('A obra é só de manhã, das 7h ao meio-dia. De tarde é com você: empreita, pedreira, o que quiser. Amanhã cedo tem mais.');
  let l = listaDeHoje();
  // 4) A lista do dia.
  if (!l) {
    l = o.lista = Object.assign({ dia: G.dia, feito: {}, paga: false }, Obra.sortear(G.dia));
    sons.tocar('pagina', 1, 0.05, -6);
    return falaBira([`Bom dia, ${FUNCOES[o.funcao].toLowerCase()}! Hoje na ${Obra.obra().nome} (${Obra.obra().etapas[o.etapa].nome}):\n${textoLista(l)}`, 'Terminou, volta aqui que eu acerto a diária.']);
  }
  // Imprevisto: o cimento comprado no Ananias.
  if (l.metas.buscar_cimento && (l.feito.buscar_cimento || 0) < l.metas.buscar_cimento && G.mochila.total('cimento') > 0) {
    const n = Math.min(G.mochila.total('cimento'), l.metas.buscar_cimento - (l.feito.buscar_cimento || 0));
    G.mochila.remover('cimento', n); G.dinheiro += n * 12; Obra.trabalho('buscar_cimento', n); hudSujo();
  }
  // 5) Lista completa: a diária e o extra.
  if (Obra.completa() && !l.paga) {
    const v = Obra.pagar(); G.dinheiro += v; G.ganhoHoje += v; hudSujo(); sons.tocar('moedas', 1, 0.05, -4);
    if (o.funcao <= 1 && !l.extra) return falaBira(`Lista completa! A diária: Cr$ ${v}.`, () => perguntar(`Mestre Bira: "Quer um extra hoje? Pago Cr$ ${valorExtra()}."`, ['Quero', 'Hoje não'], i => {
      if (i !== 0) return;
      const ids = Object.keys(EXTRAS_OBRA).filter(id => Obra.obra().etapas[o.etapa].tarefas.includes(id));
      const id = ids[G.dia % ids.length] || 'tijolos';
      l.extra = true; l.paga = false; l.metas[id] = (l.metas[id] || 0) + EXTRAS_OBRA[id]; l.valorExtra = valorExtra() - Obra.diaria();
      avisar(`Extra: ${nomeTarefa(id)} mais ${EXTRAS_OBRA[id]}.`);
    }));
    return falaBira(`Lista completa! ${l.extra ? 'O extra' : 'A diária'}: Cr$ ${v}. Bom serviço.`);
  }
  if (l.paga) return falaBira('Por hoje tá pago, rapaz. Amanhã tem mais.');
  // 6) O que falta.
  if (o.funcao >= 3) return falaBira(`Mestre, a turma tá esperando as ordens na prancheta. Falta:\n${textoLista(l)}`);
  return falaBira(`Ainda falta:\n${textoLista(l)}`);
}
// O extra paga OBRA_EXTRA (o dobro com Fama); "pagar" soma a diária — o valorExtra desconta a diária para dar só o extra.
const valorExtra = () => Obra.diaria() + OBRA_EXTRA * (typeof Habilidades !== 'undefined' && Habilidades.tem('fama') ? 2 : 1);

// ---------- no mapa ----------
function poeObraNoMapa(b) {
  if (b.id !== 'vila') return;
  const casa = b.objs.find(o => o.obraId === 'casa_zelia');
  if (casa) casa.nome = G.obra.indice === 0 ? Obra.arteAtual() : 'objetos/casa_zelia_6';
  const merc = b.objs.find(o => o.id === 'mercado');
  if (merc) { merc.obraId = 'mercado'; merc.nome = G.obra.indice < 1 ? 'objetos/mercado_0' : G.obra.indice === 1 ? Obra.arteAtual() : 'objetos/mercado_3'; merc.acao = () => acaoNaObra(merc); merc.ferramenta = (o, id) => ferramentaNaObra(o, id); }
  if (casa) { casa.acao = () => acaoNaObra(casa); casa.ferramenta = (o, id) => ferramentaNaObra(o, id); }
  const bira = b.moradores.find(m => m.id === 'bira'); if (bira) bira.aoConversar = () => conversarBira();
  // A escola e o Edifício Maré nos lotes livres da Vila (a escola ao lado da praça; o prédio ao lado da ferraria).
  for (const [obraId, idx, x, y, w, h] of [['escola', 2, 30, 23, 6, 4], ['predio', 3, 18, 21, 5, 4]]) {
    let ob = b.objs.find(o => o.obraId === obraId);
    if (G.obra.indice >= idx && !ob) { ob = b.interativo('obra_' + obraId, 'objetos/alicerce', x, y, w, h); ob.obraId = obraId; }
    if (ob) { ob.nome = G.obra.indice === idx ? Obra.arteAtual() : (obraId === 'escola' ? 'objetos/escola' : 'objetos/predio_7'); ob.acao = () => acaoNaObra(ob); ob.ferramenta = (o2, id) => ferramentaNaObra(o2, id); }
  }
  // O Seu Santos vem oferecer o cargo de mestre de obras (volta todo dia até aceitar).
  const santos = b.moradores.find(m => m.id === 'santos');
  if (G.obra.funcao === 2 && Obra.podeSubir()) {
    if (!santos) { const s = b.morador('santos', 'Seu Santos', 34, 6, DIR.ESQUERDA); s.aoConversar = () => propostaDeMestre(); }
  } else if (santos) b.moradores = b.moradores.filter(m => m !== santos);
  const ze = b.moradores.find(m => m.id === 'ze'); if (ze) ze.aoConversar = () => conversarZe(ze);
  for (const [id, f] of [['monte_tijolos', pegarDoMonte], ['pilha_ripas', () => pegarCargaObra('ripa', 'objetos/pilha_ripas')], ['peneira', peneirar], ['masseira', () => pegarCargaObra('massa', 'objetos/masseira')]]) {
    const o = b.objs.find(x => x.id === id); if (o) o.acao = () => { f(o); return true; };
  }
}
function propostaDeMestre() {
  abrirConversa('Seu Santos', urlArte('retratos/santos_normal'), ['Jocelino, o Bira me contou: quatro obras entregues, empreita pela Vila inteira, parede no prumo.', 'Quero você de mestre de obras. Vai comandar a turma: o Zé, o Severino, o Cícero e o Damião. A primeira obra é o Edifício Maré.'],
    () => perguntar('Seu Santos: "Aceita ser mestre de obras da J. Santos?"', ['Aceito!', 'Agora não'], i => {
      if (i !== 0) { avisar('O Seu Santos volta amanhã para perguntar de novo.'); return; }
      Obra.subir(); G.obra.indice = 3; G.obra.etapa = 0; G.obra.diasEtapa = 0; G.obra.lista = null;
      if (typeof EquipeObra !== 'undefined') EquipeObra.iniciar({});
      sons.tocar('fanfarra', 1, 0, -2); avisar('Mestre de obras! A diária agora é Cr$ 90. A turma espera as ordens na prancheta.');
      if (MAPAS.vila) poeObraNoMapa(MAPAS.vila);
    }));
  return true;
}
function obraDaVez(o) { return o.obraId === Obra.obra().id; }
function acaoNaObra(o) {
  if (!obraDaVez(o)) { abrirPlaca(o.obraId === 'casa_zelia' ? 'A casa da Dona Zélia, pronta. Bonita, né?' : o.obraId === 'mercado' && G.obra.indice > 1 ? 'O Mercado Municipal reformado e aberto.' : 'O Mercado Municipal, precisando de reforma.'); return true; }
  const l = listaDeHoje(), c = G.jog.carga || {};
  if (c.id && CARGA_TAREFA[c.id]) {
    const t = c.id === 'pedra' && l && l.metas.buscar_pedra ? 'buscar_pedra' : CARGA_TAREFA[c.id];
    const r = Obra.trabalho(t, c.qtd);
    if (r === 'sem_lista') { avisar('Primeiro pegue a lista com o Mestre Bira.'); return true; }
    if (r === 'nao_pede') { avisar('Hoje a lista não pede isso.'); return true; }
    largarCarga(); sons.tocar('pousar', 1, 0.05, -4); avisar(r === 'completa' ? 'Lista completa! Fale com o Mestre Bira.' : `Feito: ${nomeTarefa(t)}.`); return true;
  }
  // Pedras trazidas da pedreira na mochila.
  if (l && l.metas.buscar_pedra && G.mochila.total('pedra') > 0) {
    const n = Math.min(G.mochila.total('pedra'), l.metas.buscar_pedra - (l.feito.buscar_pedra || 0));
    if (n > 0) { G.mochila.remover('pedra', n); const r = Obra.trabalho('buscar_pedra', n); hudSujo(); avisar(r === 'completa' ? 'Lista completa! Fale com o Mestre Bira.' : `Entregou ${n} pedras da pedreira.`); return true; }
  }
  abrirPlaca(`${Obra.obra().nome} — etapa: ${Obra.obra().etapas[G.obra.etapa].nome}.${l ? '\n' + textoLista(l) : ' O Mestre Bira passa a lista de manhã.'}`);
  return true;
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
function pegarDoMonte(o) {
  const l = listaDeHoje(), falta = id => l && l.metas[id] && (l.feito[id] || 0) < l.metas[id];
  const mat = falta('pedras') ? 'pedra' : falta('telhas') ? 'telha' : 'tijolo';
  o.nome = { pedra: 'objetos/monte_pedras', telha: 'objetos/monte_telhas', tijolo: 'objetos/monte_tijolos' }[mat];
  pegarCargaObra(mat, 'itens/' + mat);
}
function pegarCargaObra(mat, icone) {
  const l = listaDeHoje();
  if (!l) { avisar('Primeiro pegue a lista com o Mestre Bira.'); return; }
  pegarCarga(mat, 99, icone);
}
function peneirar() {
  const r = Obra.trabalho('areia', 1);
  if (r === 'sem_lista') { avisar('Primeiro pegue a lista com o Mestre Bira.'); return; }
  if (r === 'nao_pede') { avisar('Hoje a lista não pede areia.'); return; }
  sons.tocar('terra', 1.2, 0.08, -6); lascas(44 * TILE, 8 * TILE, 'terra');
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
// O entulho e o mato do canteiro renascem toda manhã (10 de entulho, 8 de mato), sem fechar a passagem.
function poeEntulhoDaObra(b) {
  if (b.id !== 'vila') return;
  const f = mulberry(G.dia * 389 + 7), C = CANTEIRO;
  const conta = det => b.objs.filter(o => o.det === det && dentroR(C, o.tiles[0].x, o.tiles[0].y)).length;
  for (const [det, quer] of [['entulho', 10], ['mato', 8]]) {
    for (let k = 0, n = conta(det); k < 120 && n < quer; k++) {
      const x = C.x + Math.floor(f() * C.w), y = C.y + Math.floor(f() * C.h);
      if (b.ocupado.has(chaveT(x, y)) || b.chaoEm(x, y) !== CH.GRAMA) continue;
      // Corredor: não fecha a passagem (ao menos um vizinho livre de cada lado).
      if ([[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => b.ocupado.has(chaveT(x + dx, y + dy))).length > 1) continue;
      if (b.detrito(det, x, y)) n++;
    }
  }
}
// Quebrar entulho e mato no canteiro conta na lista.
function quebrouNaObra(o) {
  if (G.mapaId !== 'vila' || !dentroR(CANTEIRO, o.tiles[0].x, o.tiles[0].y)) return;
  if (o.det === 'entulho') Obra.trabalho('entulho', 1);
  else if (o.det === 'mato') Obra.trabalho('capinar', 1);
}

AO_MONTAR.push(b => { if (b.id === 'vila') { poeObraNoMapa(b); poeEntulhoDaObra(b); } });
AO_ENTRAR_MAPA.push(id => { if (id === 'vila') poeObraNoMapa(G.mapa); });
MANHA.push(() => { if (MAPAS.vila) { poeObraNoMapa(MAPAS.vila); poeEntulhoDaObra(MAPAS.vila); } });
// Meio-dia: a obra fecha; a parte feita fica a receber.
ATUALIZADORES.push(() => {
  const l = G.obra && listaDeHoje();
  if (l && G.minutos >= OBRA_FECHA && !l.paga && !l.fechado) { const r = Obra.fecharDia(); if (r.valor) avisar(`Meio-dia: a obra fechou. A parte que você fez (Cr$ ${r.valor}) o Bira acerta depois.`); }
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
TAREFAS.push(() => G.obra && Obra.podeSubir() ? [{ texto: G.obra.funcao === 2 ? '★ Carreira: o Seu Santos quer falar com você no canteiro' : '★ Carreira: fale com o Mestre Bira (promoção!)' }] : []);
TAREFAS.push(() => {
  if (!G.obra) return [];
  const l = listaDeHoje(), fechada = Obra.aberta(G.dia, G.minutos);
  if (!l) return fechada ? [] : [{ texto: 'Obra: falar com o Mestre Bira (7h–12h)' }];
  if (l.paga) return [];
  if (Obra.completa()) return [{ texto: 'Obra: lista completa, receber com o Bira' }];
  return Object.keys(l.metas).filter(id => (l.feito[id] || 0) < l.metas[id]).map(id => ({ texto: 'Obra: ' + nomeTarefa(id), feito: l.feito[id] || 0, meta: l.metas[id] }));
});
