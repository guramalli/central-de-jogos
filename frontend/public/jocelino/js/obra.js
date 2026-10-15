// Jocelino — obra.js — a obra do Mestre Bira (lista_mestre.gd do Godot), as regras: a lista de tarefas do dia (de
// de sol a sol, 6h–17h), a diária da função, o extra, o imprevisto do cimento, as etapas de cada obra (2 dias trabalhados
// por etapa, com gratificação) e as obras em sequência, cada uma no seu lugar com a arte das etapas.

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
};
// As ferramentas da lavagem e da pintura (o Bira entrega na 1ª lista que pede: obra_jogo.js).
ITENS.mangueira = { nome: 'Mangueira', pilha: 1, ferramenta: true, descricao: 'Do canteiro do Mestre Bira: lava o chão da obra.' };
ITENS.rolo = { nome: 'Rolo de pintura', pilha: 1, ferramenta: true, descricao: 'Do canteiro do Mestre Bira: pinta a parede da obra no acabamento.' };
const PREMIOS_CASA = ECO.obra.premiosCasa;
const ETAPAS_CASA = [
  { nome: 'Gabarito', tarefas: ['capinar', 'entulho', 'areia', 'buscar_pedra'] },
  { nome: 'Alicerce', tarefas: ['pedras', 'areia', 'massa', 'entulho'] },
  { nome: 'Meia parede', tarefas: ['tijolos', 'massa', 'areia', 'lavar', 'assentar'] },
  { nome: 'Paredes', tarefas: ['tijolos', 'massa', 'lavar', 'entulho', 'assentar'] },
  { nome: 'Telhado', tarefas: ['telhas', 'ripas', 'massa', 'entulho'] },
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
  { id: 'predio', nome: 'Edifício Maré', cliente: 'J. Moreira', mapa: 'vila',
    etapas: ['Fundação', 'Térreo', '1º andar', '2º andar', '3º andar', '4º andar', 'Cobertura'].map((nome, i) => ({ nome, tarefas: i === 0 ? ['pedras', 'areia', 'massa', 'entulho'] : ['tijolos', 'massa', 'ripas', i === 6 ? 'pintar' : 'lavar', 'entulho'] })),   // (a Cobertura é o fim: pinta)
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
      deu: Object.assign({}, o.deu || {}) };   // (as ferramentas do canteiro que o Bira já entregou: mangueira, rolo)
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
  // A lista do dia: 3 ou 4 tarefas da etapa (as que a função permite), fixa pelo dia e pela obra; às vezes o imprevisto.
  sortear(dia) {
    const f = mulberry(dia * 7919 + G.obra.indice * 31 + G.obra.etapa);
    const pode = Obra.obra().etapas[G.obra.etapa].tarefas.filter(id => {
      const t = TAREFAS_OBRA[id]; return (t.funcaoMin == null || G.obra.funcao >= t.funcaoMin) && (t.funcaoMax == null || G.obra.funcao <= t.funcaoMax); });
    const n = Math.min(pode.length, 3 + (f() < 0.5 ? 1 : 0)), metas = {};
    const pool = pode.slice();
    while (Object.keys(metas).length < n) { const id = pool.splice(Math.floor(f() * pool.length), 1)[0]; metas[id] = TAREFAS_OBRA[id].meta; }
    if (G.obra.primeira) { G.obra.primeira = false; return { metas: { tijolos: 10, areia: 3 } }; }   // o primeiro dia é leve (Godot)
    // (onda final, o robô #27) o imprevisto do cimento só quando o depósito abre (8h): antes disso ele fica guardado e entra na lista
    // às 8h (obra_jogo.js), se a lista ainda não estiver completa; antes o jogador esperava até 2 horas pelo depósito
    if (f() < OBRA_IMPREVISTO) { if (G.minutos >= DEPOSITO_HORARIO.abre) metas.buscar_cimento = 2; else return { metas, imprevisto: true }; }
    return { metas };
  },
  // (15/10, T4) As melhorias de Alvenaria: a tarefa conta em dobro na lista (a Peneira ligeira, o Ombro de pedreiro, a Colher ligeira).
  // O XP continua o do que se fez de verdade (n); só a lista anda mais depressa. Só o que o Jocelino faz: a turma do Bira
  // (equipe_obra.js, turma = true) conta 1 por 1.
  emDobro(id) { const m = { areia: 'peneira_ligeira', pedras: 'ombro_de_pedreiro', telhas: 'ombro_de_pedreiro', assentar: 'colher_ligeira' }[id]; return m && typeof Habilidades !== 'undefined' && Habilidades.ganho(m) ? ECO.niveis.obraEmDobro : 1; },
  trabalho(id, n = 1, turma = false) {
    const l = G.obra.lista;
    if (!l || l.dia !== G.dia) return 'sem_lista';
    if (!l.metas[id]) return 'nao_pede';
    l.feito[id] = Math.min(l.metas[id], (l.feito[id] || 0) + n * (turma ? 1 : Obra.emDobro(id)));
    if (G.limpou) G.limpou['obra_' + id] = (G.limpou['obra_' + id] || 0) + 1;   // já fez essa tarefa uma vez (as setas, guia_setas.js)
    if (typeof Habilidades !== 'undefined') Habilidades.ganhar(TAREFAS_OBRA[id].hab, TAREFAS_OBRA[id].xp * n * (Habilidades.tem('organizado') && ['tijolos', 'massa', 'entulho'].includes(id) ? 2 : 1) + (l.feito[id] === l.metas[id] ? 10 : 0));
    return Obra.completa() ? 'completa' : 'ok';
  },
  fracao() { const l = G.obra.lista; if (!l) return 0; let m = 0, f = 0; for (const id in l.metas) { m += l.metas[id]; f += Math.min(l.metas[id], l.feito[id] || 0); } return m ? f / m : 0; },
  completa() { return Obra.fracao() >= 1; },
  pagar() {
    const l = G.obra.lista;
    if (!l || l.paga || !Obra.completa()) return 0;
    l.paga = true; l.contou = true;
    if (l.extra) { const v = l.valorExtra || 0; l.valorExtra = 0; return v; }
    return Obra.diaria() + (G.obra.funcao >= 3 ? ECO.obra.mestreRedondo : 0) +   // o mestre ganha o dia redondo
      (l.metas.buscar_cimento ? OBRA_GORJETA : 0) + (typeof Habilidades !== 'undefined' ? (Habilidades.tem('prumo_de_ouro') ? 15 : Habilidades.tem('olho_de_prumo') ? 5 : 0) : 0);
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
  // Um dia trabalhado: a cada 2, a etapa sobe (com gratificação); a última etapa entrega a obra e passa para a próxima.
  avancar() {
    const o = Obra.obra(), r = { etapaNova: false, obraPronta: false, premio: null };
    G.obra.diasEtapa++;
    if (G.obra.diasEtapa < DIAS_POR_ETAPA) return r;
    G.obra.diasEtapa = 0; r.etapaNova = true; r.premio = o.premios[G.obra.etapa];
    if (G.obra.etapa + 1 >= o.etapas.length && typeof Habilidades !== 'undefined' && Habilidades.tem('artista')) r.premio = Object.assign({}, r.premio, { dinheiro: r.premio.dinheiro + 50 });
    if (G.obra.etapa + 1 >= o.etapas.length) { r.obraPronta = true; G.obra.entregues++; G.obra.indice = Math.min(OBRAS.length, G.obra.indice + 1); G.obra.etapa = 0; }
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
