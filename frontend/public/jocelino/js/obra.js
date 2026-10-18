// Jocelino — obra.js — a obra do Mestre Bira (lista_mestre.gd do Godot), as regras: a lista de tarefas do dia (de
// de sol a sol, 6h–17h), a diária da função, o extra, o imprevisto do cimento, as etapas de cada obra (2 dias trabalhados
// por etapa, 3 no prédio, com gratificação) e as obras em sequência, cada uma no seu lugar com a arte das etapas.

const FUNCOES = ['Servente', 'Meio-oficial', 'Pedreiro', 'Mestre de obras'];
const DIARIAS = ECO.obra.diarias;
// (a obra é de sol a sol: das 6h, quando o Jocelino acorda, às 17h, quando a pensão abre; 13/10)
const OBRA_ABRE = 6 * 60, OBRA_FECHA = 17 * 60, OBRA_EXTRA = ECO.obra.extra, OBRA_GORJETA = ECO.obra.gorjeta, OBRA_IMPREVISTO = ECO.obra.imprevisto, DIAS_POR_ETAPA = 2;
const TAREFAS_OBRA = {
  // (diário de 13/10: "não diz onde pegá-las, nem onde entregá-las" — cada tarefa diz de onde e para onde)
  tijolos: { texto: 'Carregar tijolos do monte para a obra', meta: 20, hab: 'alvenaria', xp: 1 },
  areia: { texto: 'Peneirar areia na peneira do canteiro', meta: 5, hab: 'alvenaria', xp: 3 },
  entulho: { texto: 'Tirar o entulho do canteiro (pá)', meta: 8, hab: 'alvenaria', xp: 2 },
  massa: { texto: 'Levar massa da masseira ao Zé', meta: 4, hab: 'alvenaria', xp: 4 },
  // (15/10, o dono: "molhar a obra com o regador, não vejo sentido nisso") LAVAR NO MEIO, PINTAR NO FIM: nas etapas do meio a
  // mangueira lava o chão da obra; no acabamento o rolo pinta a parede. Mesma meta, XP e habilidade do molhar de antes.
  lavar: { texto: 'Lavar o chão da obra (mangueira)', meta: 6, hab: 'acabamento', xp: 1 },
  pintar: { texto: 'Pintar a parede da obra (rolo de pintura)', meta: 6, hab: 'acabamento', xp: 1 },
  capinar: { texto: 'Capinar o mato do canteiro (foice)', meta: 10, hab: 'acabamento', xp: 1 },
  pedras: { texto: 'Levar pedras do monte para o alicerce', meta: 15, hab: 'alvenaria', xp: 1 },
  telhas: { texto: 'Subir telhas do monte para a obra', meta: 20, hab: 'alvenaria', xp: 1 },
  ripas: { texto: 'Levar ripas da pilha para o telhado', meta: 10, hab: 'alvenaria', xp: 1 },
  // (onda final, o robô #23) com a pedreira aberta, as pedras vêm do quintal ou de lá (a seta vai à pedreira quando o quintal não tem pedra)
  buscar_pedra: { get texto() { return typeof G !== 'undefined' && G.lugares && G.lugares.pedreira ? 'Trazer 10 pedras (quintal ou pedreira, picareta) e entregar na obra' : 'Trazer 10 pedras do quintal (picareta) e entregar na obra'; }, meta: 10, hab: 'alvenaria', xp: 1, funcaoMax: 1 },
  assentar: { texto: 'Assentar tijolo na obra (colher)', meta: 10, hab: 'alvenaria', xp: 3, funcaoMin: 1 },
  rebocar: { texto: 'Chapiscar e rebocar a parede (colher)', meta: 8, hab: 'acabamento', xp: 3, funcaoMin: 1 },
  buscar_cimento: { texto: 'Imprevisto: buscar 2 sacos de cimento no Ananias', meta: 2, hab: 'negocio', xp: 2 },
  // (C14, 16/10) A tarefa do mestre de obras: passar no peão, ver a frente dele (o que faz, quanto já fez) e falar com ele. Sem
  // arte nova: é a conversa com o peão no canteiro (conferirPeao, obra_jogo.js), com o retrato dele.
  conferir: { texto: 'Conferir a frente de um peão (fale com ele no canteiro)', meta: 3, hab: 'alvenaria', xp: 3, funcaoMin: 3 },
};
// (C14, 16/10; o teste crítico B: "pedreiro e mestre recebem do Bira a mesma lista do servente do dia 3") A CARREIRA MUDA O DIA,
// como os níveis do Stardew mudam o que se faz (o regador automático tira a rega do dia): o conjunto da etapa continua, e o que a
// função pega muda. Servente: 3 a 4 de carregar (como sempre). Meio-oficial: 3, com 1 de ofício (a colher) e o carregar a 70%.
// Pedreiro: os 2 ofícios e 1 carregar leve (tijolo, pedra e telha, o peso, a turma do Bira leva). Mestre: conferir a frente de 3
// peões e 1 ofício pela metade; o carregar é da turma (lista.turma, que ela faz sozinha de hora em hora: equipe_obra.js).
const OFICIOS_OBRA = ['assentar', 'rebocar'], CARREGAR_PESADO = ['tijolos', 'pedras', 'telhas'];
const OBRA_CARREGAR_MEIO = 0.7, OBRA_OFICIO_MESTRE = 0.5;
const TURMA_REDONDA_VALE = 1.5;   // (C15) o dia da turma redonda vale 1,5 dia na etapa (Obra.avancar)
const ehOficio = id => OFICIOS_OBRA.includes(id);
// As ferramentas da lavagem e da pintura (o Bira entrega na 1ª lista que pede: obra_jogo.js).
ITENS.mangueira = { nome: 'Mangueira', pilha: 1, ferramenta: true, descricao: 'Do canteiro do Mestre Bira: lava o chão da obra.' };
ITENS.rolo = { nome: 'Rolo de pintura', pilha: 1, ferramenta: true, descricao: 'Do canteiro do Mestre Bira: pinta a parede da obra no acabamento.' };
const PREMIOS_CASA = ECO.obra.premiosCasa;
// (C14) `oficio`: o ofício da etapa que não tem colher na lista do servente (a marcação da 1ª fiada no gabarito, o baldrame no
// alicerce, o emboço da cumeeira no telhado). Só o meio-oficial para cima o pega.
const ETAPAS_CASA = [
  { nome: 'Gabarito', tarefas: ['capinar', 'entulho', 'areia', 'buscar_pedra'], oficio: 'assentar' },
  { nome: 'Alicerce', tarefas: ['pedras', 'areia', 'massa', 'entulho'], oficio: 'assentar' },
  { nome: 'Meia parede', tarefas: ['tijolos', 'massa', 'areia', 'lavar', 'assentar'] },
  { nome: 'Paredes', tarefas: ['tijolos', 'massa', 'lavar', 'entulho', 'assentar'] },
  { nome: 'Telhado', tarefas: ['telhas', 'ripas', 'massa', 'entulho'], oficio: 'rebocar' },
  { nome: 'Acabamento', tarefas: ['entulho', 'capinar', 'pintar', 'areia', 'rebocar'] },
];
const OBRAS = [
  { id: 'casa_zelia', nome: 'Casa da Dona Zélia', cliente: 'Dona Zélia', mapa: 'vila', etapas: ETAPAS_CASA, premios: PREMIOS_CASA, arte: n => 'objetos/casa_zelia_' + (n + 1) },
  { id: 'mercado', nome: 'Reforma do Mercado Municipal', cliente: 'Prefeitura', mapa: 'vila',
    etapas: [ETAPAS_CASA[0], ETAPAS_CASA[3], ETAPAS_CASA[4], ETAPAS_CASA[5]], premios: ECO.obra.premiosMercado,
    arte: n => 'objetos/mercado_' + Math.min(3, n) },
  // (15/10, o dono: "apareceu apenas um ladrilho ali no meio do terreno ... parece que existem paredes transparentes") A Escola
  // mostrava o alicerce e o muro de 1 ladrilho num lote 6x4 todo sólido. Agora cada etapa ocupa o lote, como a obra da Robin no
  // Stardew: no gabarito, o chão de terra batida do lote inteiro (dá para andar por cima: obra_jogo.js); depois a estrutura do
  // tamanho do lote, a mesma arte de 6 ladrilhos das obras do Bairro Novo (o baldrame, as paredes, o telhado subindo); no
  // acabamento, a Escola pronta.
  { id: 'escola', nome: 'Escola da Vila', cliente: 'Professor Paulo', mapa: 'vila', etapas: ETAPAS_CASA, premios: PREMIOS_CASA,
    arte: n => ['texturas/chao_pedreira', 'objetos/predio_obra_1', 'objetos/predio_obra_2', 'objetos/predio_obra_2', 'objetos/predio_obra_3'][n] || 'objetos/escola' },
  // (C15) o prédio é a obra do mestre: 3 dias de trabalho por etapa (7 etapas = 21 dias; a turma redonda encurta: Obra.avancar)
  { id: 'predio', nome: 'Edifício Maré', cliente: 'J. Moreira', mapa: 'vila', diasPorEtapa: 3,
    etapas: ['Fundação', 'Térreo', '1º andar', '2º andar', '3º andar', '4º andar', 'Cobertura'].map((nome, i) => ({ nome, tarefas: i === 0 ? ['pedras', 'areia', 'massa', 'entulho'] : ['tijolos', 'massa', 'ripas', i === 6 ? 'pintar' : 'lavar', 'entulho'], oficio: i === 6 ? 'rebocar' : 'assentar' })),   // (a Cobertura é o fim: pinta)
    premios: Array.from({ length: 7 }, (_, i) => i === 6 ? ECO.obra.premiosPredio.fim : ECO.obra.premiosPredio.etapa),
    arte: n => 'objetos/predio_' + Math.min(7, n + 1) },
];
// As reformas pela Vila (no Mercado): o que o Bira toca enquanto o pedreiro não vira mestre (o Edifício Maré é do mestre)
// e o que o mestre recomeça depois do prédio, até a construtora.
const REFORMAS = { id: 'reformas', nome: 'Reformas pela Vila', cliente: 'moradores', mapa: 'vila', lugar: 'mercado',
  etapas: [ETAPAS_CASA[3], ETAPAS_CASA[5]], premios: ECO.obra.premiosReformas, arte: () => 'objetos/mercado_3' };

// O que cada função pede (obras do Bira entregues, nível de Alvenaria, empreitas entregues).
const REQUISITOS_FUNCAO = ECO.obra.requisitos;
const Obra = {
  iniciar(s) {
    const o = s.obra || {};
    G.obra = { indice: o.indice || 0, etapa: o.etapa || 0, diasEtapa: o.diasEtapa || 0, funcao: o.funcao || 0, entregues: o.entregues || 0,
      lista: o.lista ? JSON.parse(JSON.stringify(o.lista)) : null, aReceber: o.aReceber || 0, primeira: o.primeira !== false, gratificacao: o.gratificacao || null,
      deu: Object.assign({}, o.deu || {}),   // (as ferramentas do canteiro que o Bira já entregou: mangueira, rolo)
      listaFuncao: o.listaFuncao || 0 };   // (C14) a função da última 1ª lista explicada pelo Bira (a 1ª lista de cada função tem a frase)
    // (C20, rodada 2) Save do pedreiro que entregou as reformas depois da Escola com o índice já no prédio (o avancar de antes passava o
    // índice para 4 e o Edifício Maré contava como entregue sem o mestre): o índice volta para o prédio, que é a obra do mestre.
    if (G.obra.indice > 3 && G.obra.funcao < 3) { G.obra.indice = 3; G.obra.etapa = 0; G.obra.diasEtapa = 0; }
    if (G.obra.etapa >= Obra.obra().etapas.length) { G.obra.etapa = 0; G.obra.diasEtapa = 0; }   // save antigo do pedreiro no meio do prédio
    // (15/10) Save antigo no meio de uma lista com 'molhar': vira a tarefa da etapa (lavar ou pintar), com o que já tinha feito.
    const l = G.obra.lista;
    if (l && l.metas && 'molhar' in l.metas) {
      const t = Obra.tarefaDoMolhar();
      l.metas[t] = (l.metas[t] || 0) + l.metas.molhar; delete l.metas.molhar;
      if (l.feito && 'molhar' in l.feito) { l.feito[t] = (l.feito[t] || 0) + l.feito.molhar; delete l.feito.molhar; }
    }
  },
  // A tarefa que ficou no lugar do 'molhar' na etapa de agora: pintar no acabamento, lavar no meio.
  tarefaDoMolhar() { const e = Obra.obra().etapas[G.obra.etapa]; return e && e.tarefas.includes('pintar') ? 'pintar' : 'lavar'; },
  salvar(s) { s.obra = JSON.parse(JSON.stringify(G.obra)); },
  obra() { return G.obra.indice >= OBRAS.length || (G.obra.indice === 3 && G.obra.funcao < 3) ? REFORMAS : OBRAS[G.obra.indice]; },
  arteAtual() { return Obra.obra().arte(G.obra.etapa); },
  diaria() { return DIARIAS[G.obra.funcao]; },
  // O que ainda falta para a função f (0 em tudo = pode subir).
  falta(f = G.obra.funcao + 1) {
    const r = REQUISITOS_FUNCAO[f];
    if (!r) return null;
    const alv = typeof Habilidades !== 'undefined' ? Habilidades.nivel('alvenaria') : 0, emp = G.empreitas ? G.empreitas.entregues : 0;
    return { obras: Math.max(0, r.obras - G.obra.entregues), alvenaria: Math.max(0, r.alvenaria - alv), empreitas: Math.max(0, r.empreitas - emp) };
  },
  podeSubir() { const f = Obra.falta(); return !!f && !f.obras && !f.alvenaria && !f.empreitas; },
  subir() { if (!Obra.podeSubir()) return G.obra.funcao; G.obra.funcao++; return G.obra.funcao; },
  textoFalta() {
    const f = Obra.falta(); if (!f) return 'Você chegou ao topo da obra: mestre de obras.';
    const t = [];
    if (f.obras) t.push(`${f.obras} ${f.obras === 1 ? 'obra entregue' : 'obras entregues'}`);
    if (f.alvenaria) t.push(`Alvenaria ${REQUISITOS_FUNCAO[G.obra.funcao + 1].alvenaria}`);
    if (f.empreitas) t.push(`${f.empreitas} ${f.empreitas === 1 ? 'empreita entregue' : 'empreitas entregues'}`);
    return t.length ? 'falta ' + t.join(', ') : 'pronto para subir: fale com o Mestre Bira';
  },
  aberta(dia, min) {
    if ((dia - 1) % 7 === 6) return 'domingo';
    if (typeof Clima !== 'undefined' && Clima.chove(dia)) return 'chuva';
    if (min < OBRA_ABRE) return 'cedo';
    if (min >= OBRA_FECHA) return 'tarde';
    return '';
  },
  // Os ofícios da etapa (a colher): os da lista dela ou, sem nenhum, o `oficio` da etapa.
  oficiosDaEtapa(e = Obra.obra().etapas[G.obra.etapa]) { const o = e.tarefas.filter(ehOficio); return o.length ? o : [e.oficio || 'assentar']; },
  // A lista do dia: as tarefas da etapa que a função pega (ver OFICIOS_OBRA), fixa pelo dia e pela obra; às vezes o imprevisto.
  sortear(dia) {
    const f = mulberry(dia * 7919 + G.obra.indice * 31 + G.obra.etapa), fn = G.obra.funcao, e = Obra.obra().etapas[G.obra.etapa];
    const pode = e.tarefas.filter(id => {
      const t = TAREFAS_OBRA[id]; return (t.funcaoMin == null || fn >= t.funcaoMin) && (t.funcaoMax == null || fn <= t.funcaoMax); });
    // k tarefas sorteadas do monte, com a meta × fator (as pedras de fora, buscar_pedra, ficam nas 10 que o texto diz)
    const tira = (monte, k, metas, fator = 1) => { const pool = monte.filter(id => !(id in metas));
      for (let i = 0; i < k && pool.length; i++) { const id = pool.splice(Math.floor(f() * pool.length), 1)[0], m = TAREFAS_OBRA[id].meta;
        metas[id] = id === 'buscar_pedra' || fator === 1 ? m : Math.max(1, Math.round(m * fator)); }
      return metas; };
    let metas = {}, turma = null;
    if (fn <= 0) {   // servente: 3 ou 4 (o sorteio de sempre: a s33 joga o começo igual)
      tira(pode, Math.min(pode.length, 3 + (f() < 0.5 ? 1 : 0)), metas);
    } else if (fn === 1) {   // meio-oficial: 1 de ofício + 2 de carregar a 70%
      tira(Obra.oficiosDaEtapa(e), 1, metas); tira(pode.filter(id => !ehOficio(id)), 2, metas, OBRA_CARREGAR_MEIO);
    } else if (fn === 2) {   // pedreiro: assentar e rebocar + 1 carregar leve a 70%
      for (const id of OFICIOS_OBRA) metas[id] = TAREFAS_OBRA[id].meta;
      tira(pode.filter(id => !ehOficio(id) && !CARREGAR_PESADO.includes(id)), 1, metas, OBRA_CARREGAR_MEIO);
    } else {   // mestre: conferir 3 peões + 1 ofício pela metade; o carregar (3 ou 4) é da turma
      metas.conferir = TAREFAS_OBRA.conferir.meta; tira(Obra.oficiosDaEtapa(e), 1, metas, OBRA_OFICIO_MESTRE);
      turma = tira(pode.filter(id => !ehOficio(id) && id !== 'conferir'), 3 + (f() < 0.5 ? 1 : 0), {});
    }
    if (G.obra.primeira) { G.obra.primeira = false; return { metas: { tijolos: 10, areia: 3 } }; }   // o primeiro dia é leve (Godot)
    if (turma) return { metas, turma };   // (o imprevisto do cimento é da turma do mestre: o Damião vai ao Ananias)
    // (onda final, o robô #27) o imprevisto do cimento só quando o depósito abre (8h): antes disso ele fica guardado e entra na lista
    // às 8h (obra_jogo.js), se a lista ainda não estiver completa; antes o jogador esperava até 2 horas pelo depósito
    if (f() < OBRA_IMPREVISTO) { if (G.minutos >= DEPOSITO_HORARIO.abre) metas.buscar_cimento = 2; else return { metas, imprevisto: true }; }
    return { metas };
  },
  // (C15, rodada 1) A tarefa da turma que ainda falta (o mestre pode ajudar nela com as mãos).
  turmaPede(id, l = G.obra && G.obra.lista) { if (!l || !l.turma || !l.turma[id] || G.obra.funcao < 3 || l.dia !== G.dia) return false; const T = Obra.turmaDe(l); return (T.feito[id] || 0) < T.metas[id]; },
  // (C14) A lista da turma do mestre ({metas, feito}): a lista.turma; numa lista sem turma (o save de antes), a própria lista.
  turmaDe(l = G.obra.lista) { if (!l) return { metas: {}, feito: {} }; if (!l.turma) return l; if (!l.feitoTurma) l.feitoTurma = {}; return { metas: l.turma, feito: l.feitoTurma }; },
  // (C15) Quantas tarefas da lista da turma ficaram prontas ({feitas, total}); e se o dia da turma fechou redondo (todas).
  turmaFeita(l = G.obra.lista) { if (!l || !l.turma) return { feitas: 0, total: 0 }; const T = Obra.turmaDe(l), ids = Object.keys(T.metas);
    return { feitas: ids.filter(id => (T.feito[id] || 0) >= T.metas[id]).length, total: ids.length }; },
  turmaRedonda(l = G.obra.lista) { const r = Obra.turmaFeita(l); return r.total > 0 && r.feitas === r.total; },
  // (C15) Os dias de trabalho de cada etapa da obra (o prédio, 3; as outras, 2).
  diasPorEtapa(o = Obra.obra()) { return o.diasPorEtapa || DIAS_POR_ETAPA; },
  // (C14) O mestre conferiu a frente de um peão (uma vez por peão por dia). '' = não conta (não é mestre, a lista não pede, já
  // conferiu); senão o resultado do trabalho ('ok' ou 'completa').
  conferir(peaoId) {
    const l = G.obra.lista;
    if (G.obra.funcao < 3 || !l || l.dia !== G.dia || l.paga || l.fechado || !l.metas.conferir || (l.feito.conferir || 0) >= l.metas.conferir) return '';
    l.conferidos = l.conferidos || {}; if (l.conferidos[peaoId]) return '';
    l.conferidos[peaoId] = true;
    return Obra.trabalho('conferir', 1);
  },
  // (15/10, T4) As melhorias de Alvenaria: a tarefa conta em dobro na lista (a Peneira ligeira, o Ombro de pedreiro, a Colher ligeira).
  // O XP continua o do que se fez de verdade (n); só a lista anda mais depressa. Só o que o Jocelino faz: a turma do Bira
  // (equipe_obra.js, turma = true) conta 1 por 1.
  emDobro(id) { const m = { areia: 'peneira_ligeira', pedras: 'ombro_de_pedreiro', telhas: 'ombro_de_pedreiro', assentar: 'colher_ligeira' }[id]; return m && typeof Habilidades !== 'undefined' && Habilidades.ganho(m) ? ECO.niveis.obraEmDobro : 1; },
  trabalho(id, n = 1, turma = false) {
    const l = G.obra.lista;
    if (!l || l.dia !== G.dia) return 'sem_lista';
    const L = turma ? Obra.turmaDe(l) : l;   // (C14) a turma do mestre trabalha na lista dela
    // (C15, rodada 1; o E7: "o Jocelino pode ajudar em qualquer frente") O MESTRE AJUDA COM AS MÃOS: o que ele carrega, peneira ou
    // quebra numa tarefa da turma conta na lista da turma (não na dele), um por um, com o XP do serviço. Devolve 'turma'.
    if (!L.metas[id] && !turma && Obra.turmaPede(id, l)) {
      const T = Obra.turmaDe(l); T.feito[id] = Math.min(T.metas[id], (T.feito[id] || 0) + n);
      if (typeof Habilidades !== 'undefined') Habilidades.ganhar(TAREFAS_OBRA[id].hab, TAREFAS_OBRA[id].xp * n * Habilidades.fatorObra());
      return 'turma';
    }
    if (!L.metas[id]) return 'nao_pede';
    L.feito[id] = Math.min(L.metas[id], (L.feito[id] || 0) + n * (turma ? 1 : Obra.emDobro(id)));
    if (G.limpou && !(turma && l.turma)) G.limpou['obra_' + id] = (G.limpou['obra_' + id] || 0) + 1;   // já fez essa tarefa uma vez (as setas, guia_setas.js)
    // (T11 das histórias) o Ler planta do Mestre Bira (o B3): a experiência do serviço e a da tarefa completa, +10%
    if (typeof Habilidades !== 'undefined') Habilidades.ganhar(TAREFAS_OBRA[id].hab, (TAREFAS_OBRA[id].xp * n * (Habilidades.tem('organizado') && ['tijolos', 'massa', 'entulho'].includes(id) ? 2 : 1) + (L.feito[id] === L.metas[id] ? 10 : 0)) * Habilidades.fatorObra());
    return Obra.completa() ? 'completa' : 'ok';
  },
  fracao() { const l = G.obra.lista; if (!l) return 0; let m = 0, f = 0; for (const id in l.metas) { m += l.metas[id]; f += Math.min(l.metas[id], l.feito[id] || 0); } return m ? f / m : 0; },
  completa() { return Obra.fracao() >= 1; },
  pagar() {
    const l = G.obra.lista;
    if (!l || l.paga || !Obra.completa()) return 0;
    l.paga = true; l.contou = true;
    if (l.extra) { const v = l.valorExtra || 0; l.valorExtra = 0; return v; }
    // (C16) o dia redondo do mestre (ECO.obra.mestreRedondo) não sai mais aqui: só à noite, quando a turma fecha a lista dela (obra_jogo.js)
    return Obra.diaria() + (l.metas.buscar_cimento ? OBRA_GORJETA : 0) + (typeof Habilidades !== 'undefined' ? (Habilidades.tem('prumo_de_ouro') ? 15 : Habilidades.tem('olho_de_prumo') ? 5 : 0) : 0);
  },
  // Meio-dia (ou a noite, se o jogador não voltou ao Bira): a parte feita vira dinheiro a receber; ≥ 50% conta o dia.
  fecharDia() {
    const l = G.obra.lista;
    if (!l || l.paga || l.fechado) return { fracao: 0, valor: 0, contou: !!(l && l.contou) };
    if (l.extra) { l.fechado = true; return { fracao: Obra.fracao(), valor: 0, contou: true }; }   // a diária já saiu; o extra pela metade não paga
    const fr = Obra.fracao(), valor = Math.floor(Obra.diaria() * fr);
    l.fechado = true; l.contou = fr >= 0.5; G.obra.aReceber += valor;
    return { fracao: fr, valor, contou: l.contou };
  },
  // Um dia trabalhado: a cada diasPorEtapa (2; o prédio, 3), a etapa sobe (com gratificação); a última etapa entrega a obra e passa
  // para a próxima. (C15) O dia em que a turma do mestre fecha a lista dela redonda vale um dia e meio (TURMA_REDONDA_VALE): como os
  // ajudantes do Bancho no Dave, a turma bem escalada rende, e a obra anda mais depressa (o prédio, de 21 dias para até 14). A sobra
  // passa para a etapa seguinte.
  avancar(turmaRedonda = false) {
    const o = Obra.obra(), r = { etapaNova: false, obraPronta: false, premio: null }, N = Obra.diasPorEtapa(o);
    G.obra.diasEtapa += turmaRedonda ? TURMA_REDONDA_VALE : 1;
    if (G.obra.diasEtapa < N) return r;
    G.obra.diasEtapa -= N; r.etapaNova = true; r.premio = o.premios[G.obra.etapa];
    if (G.obra.etapa + 1 >= o.etapas.length && typeof Habilidades !== 'undefined' && Habilidades.tem('artista')) r.premio = Object.assign({}, r.premio, { dinheiro: r.premio.dinheiro + 50 });
    // (C20, rodada 2) Só a obra da lista (OBRAS[indice]) passa o índice adiante. As reformas do pedreiro (a vez do prédio sem o mestre:
    // Obra.obra() devolve REFORMAS) contam como obra entregue, mas não pulam o Edifício Maré: antes o índice ia para 4 e o prédio
    // ficava "entregue" (a carta do Moreira, a arte do prédio pronto) com o Jocelino ainda pedreiro.
    if (G.obra.etapa + 1 >= o.etapas.length) { r.obraPronta = true; G.obra.entregues++; if (o === OBRAS[G.obra.indice]) G.obra.indice = Math.min(OBRAS.length, G.obra.indice + 1); G.obra.etapa = 0; G.obra.diasEtapa = 0; }
    else G.obra.etapa++;
    return r;
  },
};
INICIADORES.push(s => Obra.iniciar(s));
COLETORES.push(s => Obra.salvar(s));

// ---------- carregar nos braços (tijolo, pedra, telha, ripa, entulho, balde de massa) ----------
const CARGA_MAX = { tijolo: 5, pedra: 5, telha: 5, ripa: 5, entulho: 4, massa: 1 };
function cargaMax(id) {
  const H = typeof Habilidades !== 'undefined' ? Habilidades : { tem: () => false };
  if (id === 'tijolo') return H.tem('carregador') ? 15 : H.tem('braco_forte') ? 10 : 5;
  if (id === 'entulho') return H.tem('carregador') ? 8 : 4;
  return CARGA_MAX[id] || 1;
}
function pegarCarga(id, qtd, icone) {
  if (G.jog.carga && G.jog.carga.id) { avisar('As mãos já estão ocupadas.'); return false; }
  G.jog.carga = { id, qtd: Math.min(qtd, cargaMax(id)), icone };
  sons.tocar('pegar', 0.9, 0.05, -6);
  return true;
}
function largarCarga() { const c = G.jog.carga || {}; G.jog.carga = {}; return { id: c.id, qtd: c.qtd || 0 }; }
AO_ENTRAR_MAPA.push(id => { if ((id === 'pensao_dentro' || id === 'pensao_palco') && G.jog.carga && G.jog.carga.id && G.jog.carga.id !== 'prato') { largarCarga(); avisar('O Jocelino deixou o material do canteiro na porta.'); } });
NOITE.push(linhas => { if (G.jog && G.jog.carga && G.jog.carga.id && G.jog.carga.id !== 'prato') { largarCarga(); linhas.push('O Jocelino largou o que carregava no canteiro.'); } });
