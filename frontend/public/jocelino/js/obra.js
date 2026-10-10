// Jocelino — obra.js — a obra do Mestre Bira (lista_mestre.gd do Godot), as regras: a lista de tarefas do dia (de
// manhã, 7h–12h), a diária da função, o extra, o imprevisto do cimento, as etapas de cada obra (2 dias trabalhados
// por etapa, com gratificação) e as obras em sequência, cada uma no seu lugar com a arte das etapas.

const FUNCOES = ['Servente', 'Meio-oficial', 'Pedreiro', 'Mestre de obras'];
const DIARIAS = [30, 45, 60, 90];
const OBRA_ABRE = 7 * 60, OBRA_FECHA = 12 * 60, OBRA_EXTRA = 8, OBRA_GORJETA = 10, OBRA_IMPREVISTO = 0.18, DIAS_POR_ETAPA = 2;
const TAREFAS_OBRA = {
  tijolos: { texto: 'Carregar tijolos', meta: 20, hab: 'alvenaria', xp: 1 },
  areia: { texto: 'Peneirar areia', meta: 5, hab: 'alvenaria', xp: 3 },
  entulho: { texto: 'Juntar entulho', meta: 8, hab: 'alvenaria', xp: 2 },
  massa: { texto: 'Levar massa ao Zé', meta: 4, hab: 'alvenaria', xp: 4 },
  molhar: { texto: 'Molhar a parede', meta: 6, hab: 'acabamento', xp: 1 },
  capinar: { texto: 'Capinar o canteiro', meta: 10, hab: 'acabamento', xp: 1 },
  pedras: { texto: 'Levar pedras para o alicerce', meta: 15, hab: 'alvenaria', xp: 1 },
  telhas: { texto: 'Subir telhas', meta: 20, hab: 'alvenaria', xp: 1 },
  ripas: { texto: 'Levar ripas para o telhado', meta: 10, hab: 'alvenaria', xp: 1 },
  buscar_pedra: { texto: 'Trazer 10 pedras da pedreira', meta: 10, hab: 'alvenaria', xp: 1, funcaoMax: 1 },
  assentar: { texto: 'Assentar tijolo', meta: 10, hab: 'alvenaria', xp: 3, funcaoMin: 1 },
  rebocar: { texto: 'Chapiscar e rebocar a parede', meta: 8, hab: 'acabamento', xp: 3, funcaoMin: 1 },
  buscar_cimento: { texto: 'Imprevisto: buscar 2 sacos de cimento no Ananias', meta: 2, hab: 'negocio', xp: 2 },
};
const PREMIOS_CASA = [{ dinheiro: 15, itens: { madeira: 15 } }, { dinheiro: 20, itens: { pedra: 20 } }, { dinheiro: 20, itens: { cafe: 3 } },
  { dinheiro: 25, itens: { cimento: 2 } }, { dinheiro: 30, itens: { pao: 3 } }, { dinheiro: 60, itens: { tijolo: 20 } }];
const ETAPAS_CASA = [
  { nome: 'Gabarito', tarefas: ['capinar', 'entulho', 'areia', 'buscar_pedra'] },
  { nome: 'Alicerce', tarefas: ['pedras', 'areia', 'massa', 'entulho'] },
  { nome: 'Meia parede', tarefas: ['tijolos', 'massa', 'areia', 'molhar', 'assentar'] },
  { nome: 'Paredes', tarefas: ['tijolos', 'massa', 'molhar', 'entulho', 'assentar'] },
  { nome: 'Telhado', tarefas: ['telhas', 'ripas', 'massa', 'entulho'] },
  { nome: 'Acabamento', tarefas: ['entulho', 'capinar', 'molhar', 'areia', 'rebocar'] },
];
const OBRAS = [
  { id: 'casa_zelia', nome: 'Casa da Dona Zélia', cliente: 'Dona Zélia', mapa: 'vila', etapas: ETAPAS_CASA, premios: PREMIOS_CASA, arte: n => 'objetos/casa_zelia_' + (n + 1) },
  { id: 'mercado', nome: 'Reforma do Mercado Municipal', cliente: 'Prefeitura', mapa: 'vila',
    etapas: [ETAPAS_CASA[0], ETAPAS_CASA[3], ETAPAS_CASA[4], ETAPAS_CASA[5]], premios: [PREMIOS_CASA[0], PREMIOS_CASA[3], PREMIOS_CASA[4], { dinheiro: 120, itens: { tijolo: 30 } }],
    arte: n => 'objetos/mercado_' + Math.min(3, n) },
  { id: 'escola', nome: 'Escola da Vila', cliente: 'Professor Paulo', mapa: 'vila', etapas: ETAPAS_CASA, premios: PREMIOS_CASA,
    arte: n => n < 2 ? 'objetos/alicerce' : n < 5 ? 'objetos/muro' : 'objetos/escola' },
  { id: 'predio', nome: 'Edifício Maré', cliente: 'J. Santos', mapa: 'vila',
    etapas: ['Fundação', 'Térreo', '1º andar', '2º andar', '3º andar', '4º andar', 'Cobertura'].map((nome, i) => ({ nome, tarefas: i === 0 ? ['pedras', 'areia', 'massa', 'entulho'] : ['tijolos', 'massa', 'ripas', 'molhar', 'entulho'] })),
    premios: Array.from({ length: 7 }, (_, i) => i === 6 ? { dinheiro: 1000, itens: { barra_aco: 3, madeira_lei: 5 } } : { dinheiro: 150, itens: { cimento: 3 } }),
    arte: n => 'objetos/predio_' + Math.min(7, n + 1) },
];
// As reformas pela Vila (no Mercado): o que o Bira toca enquanto o pedreiro não vira mestre (o Edifício Maré é do mestre)
// e o que o mestre recomeça depois do prédio, até a construtora.
const REFORMAS = { id: 'reformas', nome: 'Reformas pela Vila', cliente: 'moradores', mapa: 'vila', lugar: 'mercado',
  etapas: [ETAPAS_CASA[3], ETAPAS_CASA[5]], premios: [{ dinheiro: 40, itens: { cimento: 2 } }, { dinheiro: 80, itens: { tijolo: 20 } }], arte: () => 'objetos/mercado_3' };

// O que cada função pede (obras do Bira entregues, nível de Alvenaria, empreitas entregues).
const REQUISITOS_FUNCAO = [null, { obras: 1, alvenaria: 2, empreitas: 0 }, { obras: 2, alvenaria: 4, empreitas: 3 }, { obras: 4, alvenaria: 6, empreitas: 10 }];
const Obra = {
  iniciar(s) {
    const o = s.obra || {};
    G.obra = { indice: o.indice || 0, etapa: o.etapa || 0, diasEtapa: o.diasEtapa || 0, funcao: o.funcao || 0, entregues: o.entregues || 0,
      lista: o.lista ? JSON.parse(JSON.stringify(o.lista)) : null, aReceber: o.aReceber || 0, primeira: o.primeira !== false, gratificacao: o.gratificacao || null };
    if (G.obra.etapa >= Obra.obra().etapas.length) { G.obra.etapa = 0; G.obra.diasEtapa = 0; }   // save antigo do pedreiro no meio do prédio
  },
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
    return t.length ? 'falta ' + t.join(', ') : 'pronto para subir: fale com o Mestre Bira de manhã';
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
    if (f() < OBRA_IMPREVISTO) metas.buscar_cimento = 2;
    return { metas };
  },
  trabalho(id, n = 1) {
    const l = G.obra.lista;
    if (!l || l.dia !== G.dia) return 'sem_lista';
    if (!l.metas[id]) return 'nao_pede';
    l.feito[id] = Math.min(l.metas[id], (l.feito[id] || 0) + n);
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
    return Obra.diaria() + (G.obra.funcao >= 3 ? 20 : 0) +   // o mestre ganha o dia redondo
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
