// Jocelino — obra_jogo.js — a obra do Bira no mapa (o roteiro do Godot: roteiro.gd/_bira/trabalho/_gratificacao):
// a conversa com o Mestre Bira (lista da manhã, pagamento, extra, imprevisto, horário), as tarefas nos objetos do
// canteiro (monte, peneira, masseira, entulho, mato, mangueira, rolo e colher na obra), a carga entregue na obra, a arte da
// etapa e o fim do expediente às 17h (a parte feita fica a receber). As regras estão em obra.js.

// Onde renascem (e contam) o entulho e o mato da obra: o retângulo do canteiro da vez (CANTEIROS, mapa_vila.js), que muda com a obra.
const CANTEIRO = { get x() { return canteiroDaVez().ret.x; }, get y() { return canteiroDaVez().ret.y; }, get w() { return canteiroDaVez().ret.w; }, get h() { return canteiroDaVez().ret.h; } };
const EXTRAS_OBRA = { tijolos: 10, areia: 3, massa: 2, pedras: 5, telhas: 10, ripas: 5 };
const CARGA_TAREFA = { tijolo: 'tijolos', pedra: 'pedras', telha: 'telhas', ripa: 'ripas' };
const nomeTarefa = id => TAREFAS_OBRA[id].texto;
const textoLista = l => Object.keys(l.metas).map(id => `• ${nomeTarefa(id)}: ${Math.min(l.metas[id], l.feito[id] || 0)}/${l.metas[id]}`).join('\n');
const listaDeHoje = () => G.obra.lista && G.obra.lista.dia === G.dia ? G.obra.lista : null;
const falaBira = (txt, depois) => { abrirConversa('Mestre Bira', urlArte('retratos/bira_normal'), Array.isArray(txt) ? txt : [txt], depois); return true; };
// (15/10) LAVAR NO MEIO, PINTAR NO FIM: a mangueira e o rolo de pintura são do canteiro. O Bira entrega cada um na 1ª lista que
// pede a tarefa (junto com a lista; num save antigo com a lista já pega, na próxima conversa). Uma vez só (G.obra.deu): guardou
// no baú, continua lá. Mochila cheia: cai no chão, do lado do Jocelino.
// (C14) A colher também: o ofício está na lista do meio-oficial para cima (sem ela na mochila, o Bira dá uma).
const FERRAMENTA_DA_TAREFA_OBRA = { lavar: 'mangueira', pintar: 'rolo', assentar: 'colher', rebocar: 'colher' };
const FALA_FERRAMENTA_OBRA = {
  mangueira: 'Toma a mangueira do canteiro: hoje tem lavar o chão da obra. Jato no chão, que a poeira e a massa seca saem.',
  rolo: 'Chegou a hora da tinta! Toma o rolo de pintura, a lata já tá aberta. Passa na parede da obra, de baixo pra cima.',
  colher: 'Cadê a sua colher? Toma uma do canteiro: assentar e rebocar é com ela, na obra.',
};
// (C14) A 1ª lista de cada função nova: o Bira diz o que mudou no dia (uma vez; G.obra.listaFuncao). O mestre ouve quando fala com
// ele (a lista do mestre chega de manhã, pela prancheta: equipe_obra.js).
const FALA_LISTA_DA_FUNCAO = {
  1: 'Meio-oficial já pega na colher: toda lista tem ofício agora, assentar ou rebocar, com a colher na obra. Do carregar, você faz menos.',
  2: 'Pedreiro não carrega peso: tijolo, pedra e telha, a turma leva. O seu serviço é a colher: assentar e rebocar. E um servicinho leve, que ninguém é de ferro.',
  3: n => `Mestre não carrega tijolo: confere. Passe em ${n} ${n === 1 ? 'peão' : 'peões'}, veja a frente de cada um (é só falar com ele no canteiro) e faça a parte fina com a colher. O carregar a turma faz sozinha.`,
};
function falaDaFuncaoNova(l) {
  const o = G.obra; if (!l || (o.listaFuncao || 0) >= o.funcao || !FALA_LISTA_DA_FUNCAO[o.funcao]) return [];
  // (C15) a frase do mestre fala de conferir: só com a lista que pede (o save de antes, sem conferir, ouve na próxima lista)
  if (o.funcao >= 3 && !l.metas.conferir) return [];
  o.listaFuncao = o.funcao; const f = FALA_LISTA_DA_FUNCAO[o.funcao];
  return [typeof f === 'function' ? f(l.metas.conferir) : f];
}
// A ferramenta que a lista pede e o Jocelino não tem. A mangueira e o rolo: uma vez só (guardou no baú, continua lá). (C15) A colher
// é a de todo dia de quem tem ofício: faltou na mochila (e não está no ferreiro), o Bira repõe.
const faltaFerramentaDaObra = t => { const f = FERRAMENTA_DA_TAREFA_OBRA[t]; if (!f || G.mochila.total(f) > 0) return false;
  if (f === 'colher') return G.obra.funcao >= 1 && !(G.ferreiro && G.ferreiro.oficina && G.ferreiro.oficina.id === 'colher');
  return !(G.obra.deu || {})[f]; };
function biraEntregaFerramentas(l) {
  const frases = [];
  for (const t in FERRAMENTA_DA_TAREFA_OBRA) {
    if (!l || !l.metas[t] || !faltaFerramentaDaObra(t)) continue;
    const f = FERRAMENTA_DA_TAREFA_OBRA[t], resto = G.mochila.adicionar(f, 1);
    if (resto) soltar(f, resto, G.jog.x, G.jog.y);
    (G.obra.deu = G.obra.deu || {})[f] = true; hudSujo();
    frases.push(FALA_FERRAMENTA_OBRA[f] + (resto ? ' (A mochila tá cheia: deixei no chão, do seu lado.)' : ''));
  }
  return frases;
}

// O "!" em cima do Bira: tem lista nova, pagamento ou gratificação esperando.
function biraTemNovidade() {
  if (!G.obra) return false;
  if (G.obra.gratificacao || G.obra.aReceber > 0) return true;
  const l = listaDeHoje();
  return !Obra.aberta(G.dia, G.minutos) && (!l || (Obra.completa() && !l.paga));
}

function conversarBira() {
  const o = G.obra;
  // (C14, 16/10; o teste crítico: "o Bira dá a gratificação numa conversa e a lista na outra") UMA CONVERSA SÓ: a gratificação, a
  // parte de ontem e a promoção vão juntando em `antes`, e a lista do dia sai na mesma fala (a última frase de `antes` e a lista
  // na mesma página: "Etapa entregue! Toma a gratificação... A lista de hoje: ...").
  const antes = [];
  // 1) Gratificação da etapa (ou da obra pronta).
  if (o.gratificacao) {
    const r = o.gratificacao; o.gratificacao = null;
    if (r.premio) { G.dinheiro += r.premio.dinheiro; G.ganhoHoje += r.premio.dinheiro; for (const id in r.premio.itens) { const resto = G.mochila.adicionar(id, r.premio.itens[id]); if (resto) soltar(id, resto, G.jog.x, G.jog.y); } hudSujo(); }
    const itens = r.premio ? Object.entries(r.premio.itens).map(([id, q]) => Itens.qtd(q, id)).join(', ') : '';
    sons.tocar('fanfarra', 1, 0, -6);
    if (r.obraPronta) antes.push(`${r.nomeObra} pronta! Festa da cumeeira, rapaz! Toma a gratificação: Cr$ ${r.premio.dinheiro}${itens ? ' e ' + itens : ''}.`,
      Obra.obra().id === 'reformas' && o.funcao < 3 ? 'O Edifício Maré do Seu Moreira é serviço pra mestre de obras. Até lá, a gente toca as reformas pela Vila.' : `A próxima obra é ${Obra.obra().nome}. Começa do zero.`);
    else antes.push(`Etapa entregue! Toma a gratificação: Cr$ ${r.premio.dinheiro}${itens ? ' e ' + itens : ''}. Agora é a etapa ${Obra.obra().etapas[o.etapa].nome}: o serviço muda.`);
  }
  // 2) A parte de ontem (ou de hoje cedo).
  if (o.aReceber > 0) { const v = o.aReceber; o.aReceber = 0; G.dinheiro += v; G.ganhoHoje += v; if (typeof lojinhaDepoisDaDiaria === 'function') lojinhaDepoisDaDiaria(); hudSujo(); sons.tocar('moedas', 1, 0.05, -6); antes.push(v >= Obra.diaria() ? `A diária da lista completa, rapaz: Cr$ ${v}. Serviço inteiro, pagamento inteiro.` : `A parte que você fez: Cr$ ${v}. Serviço pela metade, pagamento pela metade.`); }
  // A promoção (meio-oficial e pedreiro: o Bira; mestre de obras: o Seu Moreira, no canteiro).
  if (Obra.podeSubir() && o.funcao < 2) {
    if (o.funcao === 0 && !G.mochila.cabe('colher')) return falaBira([...antes, 'Rapaz, tenho novidade pra você. Mas abre um espaço na mochila primeiro!']);
    const f = Obra.subir(); sons.tocar('fanfarra', 1, 0, -4);
    if (f === 1) { G.mochila.adicionar('colher', 1); hudSujo(); antes.push('Rapaz, você é bom de serviço. A partir de hoje é meio-oficial! A diária sobe para Cr$ ' + DIARIAS[1] + '.', 'Toma a minha colher velha: agora você assenta tijolo e chapisca. E já pode pegar empreita maior no quadro da Vila.'); }
    else antes.push('Pedreiro! Levantou parede, rebocou, entregou obra. A diária agora é Cr$ ' + DIARIAS[2] + '.', 'Empreita boa no quadro agora é com você: baldrame, quiosque, ponte. Capricha que o povo paga mais.');
  }
  // 3) Horário, domingo e chuva (com o que já tinha a dizer, só isso: a lista fica para o dia de obra).
  const fechada = Obra.aberta(G.dia, G.minutos);
  if (fechada && antes.length) return falaBira(antes);
  if (fechada === 'domingo') return falaBira('Domingo é dia de descanso, rapaz. Vai cuidar das suas coisas.');
  if (fechada === 'chuva') return falaBira('Com essa chuva não dá pra trabalhar. Hoje a obra fica fechada.');
  if (fechada === 'cedo') return falaBira('Ainda tá escuro, rapaz. Assim que o sol sair a gente começa.');
  if (fechada === 'tarde') return falaBira('Por hoje a obra parou, rapaz: às cinco a turma vai embora. Amanhã tem mais, a hora que você chegar.');
  let l = listaDeHoje();
  // A última frase de antes e a lista na mesma página.
  const comLista = (sozinha, junto) => antes.length ? [...antes.slice(0, -1), `${antes[antes.length - 1]}\n${junto}`] : [sozinha];
  // 4) A lista do dia.
  if (!l) {
    // (13/10) O primeiro encontro é a contratação: o Tio Juca disse que o Bira paga servente por dia; aqui ele confirma e diz o porquê.
    const contratacao = o.primeira;
    l = o.lista = Object.assign({ dia: G.dia, feito: {}, paga: false }, Obra.sortear(G.dia));
    // (C15) a lista do mestre que sai do Bira (o dia da promoção, o save carregado depois da manhã): a turma começa o dia agora
    if (o.funcao >= 3 && typeof turmaComecaODia === 'function') turmaComecaODia(false);
    if (G.mapa && G.mapa.id === 'vila') poeEntulhoDaObra(G.mapa);   // (quebrou entulho antes da lista? o canteiro completa o que ela pede)
    sons.tocar('pagina', 1, 0.05, -6);
    const onde = `${Obra.obra().nome} (${Obra.obra().etapas[o.etapa].nome}):\n${textoLista(l)}`;
    const fala = [...comLista(`Bom dia, ${FUNCOES[o.funcao].toLowerCase()}! Hoje na ${onde}`, `A lista de hoje na ${onde}`),
      ...falaDaFuncaoNova(l), ...biraEntregaFerramentas(l), 'Terminou, volta aqui que eu acerto a diária.'];
    if (contratacao) fala.unshift(`Então você é o sobrinho do Juca! Ele me falou de você. Servente eu preciso, sim: Cr$ ${Obra.diaria()} por dia, pago quando a lista do dia fica pronta.`,
      'A obra é de sol a sol, até as cinco: chegou, trabalhou. Quem aprende o ofício aqui vira meio-oficial, e meio-oficial já levanta a casa da família.');
    return falaBira(fala);
  }
  // A lista já pega (a do mestre chega de manhã): o que ainda falta dela, na mesma fala.
  if (antes.length) return falaBira(l.paga || l.fechado ? antes : [...comLista('', `A lista de hoje:\n${textoLista(l)}`), ...falaDaFuncaoNova(l), ...biraEntregaFerramentas(l)].filter(Boolean));
  // A mangueira ou o rolo que a lista pede e o Jocelino ainda não ganhou (o save de antes da troca do regador).
  { const fr = biraEntregaFerramentas(l); if (fr.length) return falaBira(fr); }
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
  if (o.funcao >= 3) return falaBira([`Mestre, o carregar a turma toca pela prancheta. Da sua lista, falta:\n${textoLista(l)}`, ...falaDaFuncaoNova(l)]);
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
    if ((daVez || G.obra.indice > idx) && !ob) { ob = b.interativo('obra_' + obraId, 'objetos/alicerce', x, y, w, h); ob.obraId = obraId; ob.caixaPe = ob.caixa; }
    if (ob) {
      ob.nome = daVez ? Obra.arteAtual() : (obraId === 'escola' ? 'objetos/escola' : 'objetos/predio_7'); ob.acao = () => acaoNaObra(ob); ob.ferramenta = (o2, id) => ferramentaNaObra(o2, id);
      obraNoLote(b, ob, x, y, w, h);
      for (const o2 of b.objs.filter(q => (q.tipo === 'detrito' || q.achado) && (q.tiles || []).some(t => ob.tiles.some(u => u.x === t.x && u.y === t.y)))) b.tirar(o2);
      for (const t of ob.tiles) b.ocupado.set(chaveT(t.x, t.y), ob);
    }
  }
  // (C12, 16/10; o teste crítico: o Edifício Maré "só diz o nome") Antes de o prédio começar, a placa no terreno dele diz de quem é e por
  // que ainda não começou: é obra para mestre de obras (o degrau de cima da carreira). Some quando o prédio vira a obra da vez.
  { const [x, y, w] = LOTES_DAS_OBRAS.predio, antes = G.obra.indice < 3 || (G.obra.indice === 3 && G.obra.funcao < 3), px = x + Math.floor(w / 2);
    let pl = b.objs.find(o => o.id === 'placa_predio');
    if (antes && !pl) {
      for (const o2 of b.objs.filter(q => (q.tipo === 'detrito' || q.achado) && (q.tiles || []).some(t => t.x === px && t.y === y))) b.tirar(o2);
      pl = b.interativo('placa_predio', 'objetos/placa_terreno', px, y, 1, 1, [10, 6]);
      pl.acao = () => { abrirPlaca('Terreno do prédio da J. Moreira: o Edifício Maré. O Bira diz que só um mestre de obras toca uma obra dessas.'); return true; };
    } else if (!antes && pl) b.tirar(pl);
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
// (15/10) A etapa que é chão (o gabarito da Escola: a terra batida, arte pronta repetida no lote inteiro) fica por baixo de quem
// pisa e não bloqueia: dá para andar pelo lote (a caixa do lote fica só para o alcance do botão direito). A estrutura (do tamanho
// do lote) bloqueia pela base, como antes: o que é sólido é o que se vê.
function obraNoLote(b, ob, x, y, w, h) {
  b.solidos = b.solidos.filter(c => c !== ob.caixa);
  const topo = y - h + 1;
  if (ob.nome.startsWith('texturas/')) {
    const tex = ob.nome;
    Object.assign(ob, { solido: false, caixa: { x: x * TILE, y: topo * TILE, w: w * TILE, h: h * TILE }, ordemY: topo * TILE,
      desenha: ctx => desenhaChaoDaObra(ctx, tex, x, topo, w, h) });
    return;
  }
  delete ob.ordemY; delete ob.desenha;
  ob.solido = true; ob.caixa = ob.caixaPe; if (ob.caixa) b.solidos.push(ob.caixa);
}
// A textura repetida no retângulo (em ladrilhos), na escala de verdade (a terra batida tem 192 px: 4x4 ladrilhos).
function desenhaChaoDaObra(ctx, tex, x, y, w, h) {
  const img = spr(tex); if (!img) return;
  const iw = img.naturalWidth, ih = img.naturalHeight, x1 = (x + w) * TILE, y1 = (y + h) * TILE;
  for (let py = y * TILE; py < y1; py += ih) for (let px = x * TILE; px < x1; px += iw) {
    const cw = Math.min(iw, x1 - px), ch = Math.min(ih, y1 - py);
    ctx.drawImage(img, 0, 0, cw, ch, px, py, cw, ch);
  }
}
function propostaDeMestre() {
  abrirConversa('Seu Moreira', urlArte('retratos/santos_normal'), ['Jocelino, o Bira me contou: quatro obras entregues, empreita pela Vila inteira, parede no prumo.', 'Quero você de mestre de obras. Vai comandar a turma: o Zé, o Severino, o Cícero e o Damião. A primeira obra é o Edifício Maré.'],
    () => perguntar('Seu Moreira: "Aceita ser mestre de obras da J. Moreira?"', ['Aceito!', 'Agora não'], i => {
      if (i !== 0) { avisar('O Seu Moreira volta amanhã para perguntar de novo.'); return; }
      Obra.subir(); G.obra.indice = 3; G.obra.etapa = 0; G.obra.diasEtapa = 0; G.obra.lista = null;
      if (typeof EquipeObra !== 'undefined') EquipeObra.iniciar({});
      sons.tocar('fanfarra', 1, 0, -2); avisar(`Mestre de obras! A diária agora é Cr$ ${DIARIAS[3]}. Mestre não carrega: confere a frente da turma e faz a parte fina.`);
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
  if (!obraDaVez(o)) { abrirPlaca({ casa_zelia: 'A casa da Dona Zélia, pronta. Bonita, né?', mercado: G.obra.indice > 1 ? 'O Mercado Municipal reformado e aberto.' : 'O Mercado Municipal, precisando de reforma.', escola: 'A Escola da Vila, pronta para as crianças.', predio: 'O Edifício Maré da J. Moreira: da fundação à cobertura, a obra que o Jocelino tocou de mestre de obras.' }[o.obraId] || ''); return true; }
  const l = listaDeHoje(), c = G.jog.carga || {};
  if (c.id && CARGA_TAREFA[c.id]) {
    const t = c.id === 'pedra' && l && l.metas.buscar_pedra ? 'buscar_pedra' : CARGA_TAREFA[c.id];
    const r = Obra.trabalho(t, c.qtd);
    if (r === 'sem_lista') { avisar('Primeiro pegue a lista com o Mestre Bira.'); return true; }
    if (r === 'nao_pede') { avisar('Hoje a lista não pede isso.'); return true; }
    largarCarga(); sons.tocar('pousar', 1, 0.05, -4); if (r === 'turma') { ajudouATurma(t); return true; }
    avisar(r === 'completa' ? 'Lista completa! Fale com o Mestre Bira.' : `Feito: ${nomeTarefa(t)}.`); return true;
  }
  // Pedras trazidas na mochila (as do quintal, na picareta; depois também da pedreira).
  const e = entregarPedrasDaMochila();
  if (e) { avisar(e.r === 'completa' ? 'Lista completa! Fale com o Mestre Bira.' : `Entregou ${Itens.qtd(e.n, 'pedra')} (${nomeTarefa(e.t)} ${l.feito[e.t]}/${l.metas[e.t]}).`); return true; }
  abrirPlaca(`${Obra.obra().nome} — etapa: ${Obra.obra().etapas[G.obra.etapa].nome}.${l ? '\n' + textoLista(l) : ' O Mestre Bira passa a lista do dia: é só falar com ele.'}`);
  return true;
}
// ---------- (C2, 16/10) a seta de entregar só com o item e o "Falta: X (onde)" ----------
// O teste crítico (dia 2): a seta dizia "Botão direito: entregar as pedras na obra" com 1 pedra na mochila e a lista em 0/10, e no
// quintal o Agora dizia "faltam 1 tarefa(s)" sem dizer qual nem onde. Como no Stardew: o pedido do diário diz o quê e quanto, e a
// entrega é a última coisa, com tudo na mão.
// Quantas pedras da mochila ainda faltam para a tarefa (com o Ombro de pedreiro, cada pedra conta 2).
const faltaDePedras = (l, t = 'buscar_pedra') => Math.ceil(Math.max(0, (l.metas[t] || 0) - (l.feito[t] || 0)) / Obra.emDobro(t));
// Ainda há de onde tirar pedra: o quintal com pedra (o mapa ainda não montado conta como cheio) ou a pedreira aberta.
const pedraAoAlcance = () => { const q = typeof MAPAS !== 'undefined' && MAPAS.quintal; return !q || q.objs.some(o => o.det === 'pedra') || !!(G.lugares && G.lugares.pedreira); };
// A seta e a dica dizem "entregar as pedras" só com as pedras que completam a tarefa na mochila (ou sem mais pedra ao alcance: aí
// entrega o que tem). A tarefa do monte ('pedras') tem o monte do canteiro ao lado: qualquer pedra da mochila vale.
function pedrasParaEntregar(id) {
  const l = listaDeHoje(), tem = G.mochila.total('pedra'); if (!l || !l.metas[id] || tem <= 0) return false;
  if (id !== 'buscar_pedra') return true;
  return tem >= faltaDePedras(l) || !pedraAoAlcance();
}
// A obra do dia pede pedra da mochila (a tarefa "trazer 10 pedras", ainda por fazer)? Antes de pegar a lista, a lista que o Bira vai
// passar (o sorteio é fixo pelo dia e pela etapa). O quadro da Vila não sorteia recado de pedra enquanto isso (recados.js).
function obraPedePedra(dia = G.dia) {
  if (!G.obra || typeof Obra === 'undefined' || Obra.aberta(dia, 12 * 60)) return false;   // domingo e chuva: sem obra
  const l = G.obra.lista && G.obra.lista.dia === dia ? G.obra.lista : null;
  if (l) return !l.paga && (l.feito.buscar_pedra || 0) < (l.metas.buscar_pedra || 0);
  if (G.obra.primeira || G.obra.funcao > TAREFAS_OBRA.buscar_pedra.funcaoMax) return false;   // (a 1ª lista é leve; o sortear a marcaria como dada)
  return !!Obra.sortear(dia).metas.buscar_pedra;
}
// O que falta da lista, nomeado e com o lugar: "Falta: 9 pedras do quintal (picareta) → entregar ao Bira (1 já na mochila)". A tarefa
// de fora da Vila (as pedras) vem primeiro; as outras são no canteiro. '' com a lista completa.
function faltaDaObra(l = listaDeHoje()) {
  const pend = l ? Object.keys(l.metas).filter(id => (l.feito[id] || 0) < l.metas[id]) : []; if (!pend.length) return '';
  const id = pend.includes('buscar_pedra') ? 'buscar_pedra' : pend[0], resto = pend.length - 1;
  let t;
  if (id === 'buscar_pedra') { const n = faltaDePedras(l), tem = Math.min(n, G.mochila.total('pedra')), ped = !!(G.lugares && G.lugares.pedreira);
    t = tem >= n ? `Falta: entregar ${Itens.qtd(n, 'pedra')} da mochila na obra do Bira, na Vila`
      : `Falta: ${Itens.qtd(n - tem, 'pedra')} do quintal${ped ? ' ou da pedreira' : ''} (picareta) → entregar ao Bira${tem ? ` (${tem} já na mochila)` : ''}`; }
  else { const T = id === 'buscar_cimento' ? 'buscar 2 sacos de cimento' : nomeTarefa(id);
    t = `Falta: ${T.charAt(0).toLowerCase() + T.slice(1)} (${l.feito[id] || 0}/${l.metas[id]}), ${id === 'buscar_cimento' ? 'no depósito do Seu Ananias, na Vila' : 'no canteiro da Vila'}`; }
  return t + (resto ? ` e mais ${resto} tarefa${resto > 1 ? 's' : ''}` : '');
}
// As pedras da mochila valem para "trazer pedras" e para "levar pedras para o alicerce" (diário de 13/10: "não aceita pedras
// que peguei" — só valia a pedra do monte, nos braços). Devolve {t, n, r} ou null.
function entregarPedrasDaMochila() {
  const l = listaDeHoje(); if (!l || G.mochila.total('pedra') <= 0) return null;
  const t = ['buscar_pedra', 'pedras'].find(k => l.metas[k] && (l.feito[k] || 0) < l.metas[k]); if (!t) return null;
  const n = Math.min(G.mochila.total('pedra'), Math.ceil((l.metas[t] - (l.feito[t] || 0)) / Obra.emDobro(t)));   // (com o Ombro de pedreiro, cada pedra conta 2)
  G.mochila.remover('pedra', n); const r = Obra.trabalho(t, n); hudSujo(); sons.tocar('pousar', 1, 0.05, -4);
  return { t, n, r };
}
function ferramentaNaObra(o, id) {
  // (C5, 16/10) a ferramenta da obra (a mangueira, o rolo, a colher) na obra que não é a de hoje: avisa qual é, em vez de nada
  if (!obraDaVez(o)) { if (['mangueira', 'rolo', 'colher'].includes(id) && listaDeHoje()) avisar(`Esta não é a obra de hoje. O Bira quer o serviço na obra: ${Obra.obra().nome}.`); return; }
  const l = listaDeHoje(); if (!l) { avisar('Primeiro pegue a lista com o Mestre Bira.'); return; }
  const H = typeof Habilidades !== 'undefined' ? Habilidades : { tem: () => false };
  let t = '', n = 1;
  // (15/10) A mangueira lava o chão e o rolo pinta a parede; o Capricho e o Pintor de mão cheia valem para os dois (3 e 5 por vez).
  if (id === 'mangueira' || id === 'rolo') { t = id === 'mangueira' ? 'lavar' : 'pintar'; n = H.tem('pintor') ? 5 : H.tem('capricho') ? 3 : 1; }
  else if (id === 'regador') { const q = ['lavar', 'pintar'].find(faltaNaLista); if (q) avisar(q === 'lavar' ? 'A obra não se rega: para lavar o chão, use a mangueira.' : 'A parede agora é de tinta: use o rolo de pintura.'); return; }
  else if (id === 'colher') { t = l.metas.assentar && (l.feito.assentar || 0) < l.metas.assentar ? 'assentar' : 'rebocar'; if (t === 'rebocar') n = H.tem('pintor') ? 5 : H.tem('capricho') ? 3 : 1; }
  if (!t) return;
  const r = Obra.trabalho(t, n);
  if (r === 'nao_pede') avisar('Hoje a lista não pede isso.');
  else if (r === 'completa') avisar('Lista completa! Fale com o Mestre Bira.');
  else if (r === 'turma') ajudouATurma(t);
}
// (C15, rodada 1) Para o mestre, a tarefa da turma que falta também vale: ele pode ajudar com as mãos (Obra.trabalho → 'turma').
const faltaNaLista = id => { const l = listaDeHoje(); return !!(l && ((l.metas[id] && (l.feito[id] || 0) < l.metas[id]) || Obra.turmaPede(id, l))); };
// O aviso do serviço do mestre numa frente da turma (não conta na lista dele).
function ajudouATurma(id) {
  const T = Obra.turmaDe(), nome = typeof nomeDaFrente === 'function' ? nomeDaFrente(id) : nomeTarefa(id);
  avisar(`Você ajudou a turma: ${nome.toLowerCase()} ${Math.floor(T.feito[id] || 0)}/${T.metas[id]} (não conta na sua lista).`);
}
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
  if (r === 'turma') ajudouATurma('areia');
  const pn = G.mapa && G.mapa.objs.find(x => x.id === 'peneira');   // (a peneira do canteiro da vez)
  sons.tocar('terra', 1.2, 0.08, -6); if (pn) lascas(pn.x, pn.y - TILE, 'terra');
  if (r === 'completa') avisar('Lista completa! Fale com o Mestre Bira.');
}
function conversarZe(p) {
  const c = G.jog.carga || {};
  if (c.id === 'massa') {
    const r = Obra.trabalho('massa', 1);
    if (r !== 'nao_pede' && r !== 'sem_lista') { largarCarga(); sons.tocar('pousar', 0.9, 0.05, -4); avisar(r === 'completa' ? 'Zé: "Valeu! Massa no ponto. Lista completa, fala com o Bira."' : 'Zé: "Isso! Massa boa é igual feijão: nem mole, nem dura."'); return true; }   // (15/10, o jogador: sem a janela de conversa a cada massa; só o aviso no canto)
  }
  // (C15) o mestre com comida na mão: o Zé come (o conferir fica para o clique seguinte)
  if (typeof ehMestre === 'function' && ehMestre() && typeof alimentarPeao === 'function' && alimentarPeao('ze')) return true;
  if (conferirPeao('ze')) return true;   // (C14) o Zé também é da turma do mestre
  return Conversas.abrir(p || 'ze', { nome: 'Zé' });   // (T2 das conversas) a fala do dia, pelo motor de falas
}
// (C14, 16/10) CONFERIR: o mestre fala com o peão no canteiro e vê a frente dele (a tarefa da turma e quanto já foi). Conta 1 na
// lista do mestre por peão por dia (Obra.conferir) e vale a conversa do dia (+1 de humor). false = não era hora de conferir.
// (C15) CONFERIR VIRA UMA DECISÃO PEQUENA (e não um item de checklist): o peão diz a frente e conta uma coisa do dia dele (o material
// no fim, uma frente sem ninguém, o cansaço, uma ideia: EquipeObra.assunto) e o mestre responde com uma escolha de duas, que muda uma
// coisa pequena no dia da turma (EquipeObra.responder): como o Dave escala os ajudantes do Bancho. A volta do peão sai no aviso do
// canto (sem outra janela). Na 1ª conferida do jogo, a pergunta diz que a resposta muda o dia da turma (a 1ª vez com guia).
function conferirPeao(id) {
  if (typeof EquipeObra === 'undefined' || !G.equipeObra || !Obra.conferir(id)) return false;
  const p = PEOES.find(x => x.id === id), l = G.obra.lista, T = Obra.turmaDe(l);
  if (G.equipeObra.dia === G.dia) EquipeObra.garantirFrentes(T.metas);
  const t = G.equipeObra.frente[id], h = EquipeObra.conversar(id);
  const frente = TAREFAS_OBRA[t] ? `${nomeDaFrente(t).toLowerCase()}${T.metas[t] ? `, ${Math.min(T.metas[t], Math.floor(T.feito[t] || 0))}/${T.metas[t]}` : ''}` : 'sem frente hoje';
  const jeito = h >= 8 ? 'Tá rendendo, mestre!' : h >= 5 ? 'Tô firme, mestre.' : h >= 3 ? 'Tá puxado, mestre... um café cairia bem.' : 'Não tô bem não, mestre.';
  const conta = `(Conferido: ${l.feito.conferir || 0}/${l.metas.conferir}${Obra.completa() ? '. Lista completa: fale com o Mestre Bira' : ''}.)`;
  sons.tocar('pagina', 1, 0.05, -6); hudSujo();
  const nome = p ? p.nome : id, retrato = urlArte('retratos/' + id + '_normal');
  // Sem a turma do mestre (o save de antes): só a frente, como na C14.
  if (!l.turma || G.equipeObra.dia !== G.dia) { abrirConversa(nome, retrato, [`${jeito} A minha frente: ${frente}.\n${conta}`]); return true; }
  const a = EquipeObra.assunto(id, T, (l.feito.conferir || 0) >= (l.metas.conferir || 0)), fa = EquipeObra.falaDoAssunto(id, a), m = /^@\w+ /.exec(fa.texto), emo = m ? m[0] : '';
  const dica = G.limpou && !G.limpou.conferir_escolha ? '\n(O que você responder muda o dia da turma.)' : '';
  if (G.limpou) G.limpou.conferir_escolha = (G.limpou.conferir_escolha || 0) + 1;
  perguntarCom(nome, retrato, `${emo}A minha frente: ${frente}. ${fa.texto.slice(emo.length)}\n${conta}${dica}`, fa.opcoes, i => {
    avisar(EquipeObra.responder(id, a, i)); hudSujo(); sons.tocar('pagina', 1.1, 0.05, -8);
  });
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
  // (C15) A turma do mestre termina o dia dela (as horas que faltam até as 17h) e o resumo diz quanto ela fez; a lista toda feita
  // é o dia redondo, que vale um dia e meio na etapa (só se o mestre fez a parte dele: o dia contou).
  let redonda = false;
  if (l.turma && G.obra.funcao >= 3) {
    if (typeof turmaTrabalhaAte === 'function') turmaTrabalhaAte(24, true);
    const tf = Obra.turmaFeita(l); redonda = tf.feitas === tf.total && tf.total > 0;
    // (C16) o dia redondo do mestre: Cr$ 20 a mais (ECO.obra.mestreRedondo) só quando a turma fecha a lista dela e o mestre fez a parte
    // dele (como no E7: "mais Cr$ 20 quando a lista fecha redonda"); antes saía em toda diária do mestre.
    const mr = ECO.obra.mestreRedondo;
    if (redonda && l.contou && mr && !l.pagouRedondo) { l.pagouRedondo = true; G.dinheiro += mr; G.ganhoHoje = (G.ganhoHoje || 0) + mr; }
    const I = G.equipeObra && G.equipeObra.hoje && G.equipeObra.hoje.ideia, ideia = I && I.errada ? ` A ideia do ${PEOES.find(p => p.id === I.id).nome} não deu certo.` : '';   // (C15, rodada 1)
    linhas.push(`A turma fez ${tf.feitas} de ${tf.total} da lista dela${redonda ? (l.contou ? `: dia redondo, a obra andou um dia e meio e o Bira acertou Cr$ ${mr} a mais.` : ', mas sem a sua parte de mestre o dia não contou na obra.') : ` (com tudo feito, o dia é redondo: a obra anda um dia e meio e o Bira paga Cr$ ${mr} a mais).`}${ideia}`);
  }
  if (!l.contou) return;
  const nome = Obra.obra().nome, r = Obra.avancar(redonda);
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
