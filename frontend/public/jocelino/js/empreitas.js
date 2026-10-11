// Jocelino — empreitas.js — as empreitas do Jocelino (a lavoura do Stardew; empreitadas.gd do Godot), as regras:
// - curtas (uma tarde): leva o material, usa a ferramenta certa N vezes no lugar e recebe na hora;
// - longas, o laço da lavoura: reservar no quadro (sem gastar), começar na plaquinha com o material (o plantar), cuidar
//   cada dia com a ferramenta da etapa (o regar: pá, colher, regador, machado), a noite avança o dia cuidado (a chuva
//   faz a cura; o concreto não pega e a pintura não seca na chuva), pronta se entrega com um clique e o cliente paga à
//   noite (a caixa de envio). Reserva não começada em 3 dias: o cliente desiste, sem multa (o Help Wanted do Stardew).
// O quadro de Serviços da Vila mostra 2 a 4 por dia, só o que a função libera.

const EMPREITAS_CURTAS = {
  consertar_banca: { nome: 'Consertar a banca do Lourival', cliente: 'lourival', mapa: 'praia', x: 10, y: 8, material: { madeira: 5 }, ferramenta: 'machado', vezes: 4 },
  tabua_pier: { nome: 'Tapar tábua solta do píer', cliente: 'lourival', mapa: 'praia', x: 29, y: 15, material: { madeira: 3 }, ferramenta: 'machado', vezes: 3 },
  limpar_trilha: { nome: 'Limpar a trilha da mata', cliente: 'juca', mapa: 'mata', x: 30, y: 11, material: {}, ferramenta: 'foice', vezes: 8 },
  escorar_ponte: { nome: 'Escorar a ponte da mata', cliente: 'juca', mapa: 'mata', x: 25, y: 15, material: { madeira: 4 }, ferramenta: 'machado', vezes: 4 },
  remendar_calcada: { nome: 'Remendar a calçada da praça', cliente: 'zelia', mapa: 'vila', x: 27, y: 16, material: { cimento: 2 }, ferramenta: 'pa', vezes: 4 },
  cerca_zelia: { nome: 'Consertar a cerca da Dona Zélia', cliente: 'zelia', mapa: 'vila', x: 35, y: 10, material: { madeira: 4 }, ferramenta: 'machado', vezes: 3 },
  telhas_juca: { nome: 'Trocar telhas do Tio Juca', cliente: 'juca', mapa: 'quintal', x: 9, y: 9, material: { telha: 6 }, ferramenta: 'carga', vezes: 1 },
  desentulhar_ananias: { nome: 'Desentulhar o terreno do Seu Ananias', cliente: 'ananias', mapa: 'vila', x: 11, y: 13, material: {}, ferramenta: 'pa', vezes: 6 },
};
ecoCampo(EMPREITAS_CURTAS, 'paga', ECO.empreitas.paga);   // o pagamento de cada uma mora no ECO
for (const id in EMPREITAS_CURTAS) Object.assign(EMPREITAS_CURTAS[id], { funcaoMin: 0, tipo: 'curta' });
// As longas: `etapas` é a ferramenta de cada dia (empreitadas.gd); `concreto`: a pá e a colher não pegam na chuva;
// `pintura`: o último dia é pintar (não se faz na chuva); `reforma`: acabamento (pedido no fim de ano).
const EMPREITAS_LONGAS = {
  calcada_cimento: { nome: 'Calçada da ferraria', piso: true, area: { w: 4, h: 1, textura: 'texturas/calcada' }, cliente: 'tonico', mapa: 'vila', x: 11, y: 23, junto: 'oficina', material: { cimento: 3, pedra: 6 }, etapas: ['pa', 'regador'], funcaoMin: 1, concreto: true, artes: ['objetos/vala', 'objetos/alicerce'] },
  cerca_madeira: { nome: 'Cerca do galpão do Tio Juca', cliente: 'juca', mapa: 'quintal', x: 32, y: 23, material: { madeira: 10 }, etapas: ['pa', 'machado'], funcaoMin: 1, artes: ['objetos/vala', 'objetos/cerca'] },
  muro_baixo: { nome: 'Muro da divisa da casa da Dona Zélia', cliente: 'zelia', mapa: 'vila', x: 33, y: 9, junto: 'casa_zelia', material: { tijolo: 30, cimento: 2 }, etapas: ['pa', 'colher', 'colher'], funcaoMin: 1, artes: ['objetos/vala', 'objetos/alicerce', 'objetos/muro'] },
  baldrame: { nome: 'Baldrame do puxadinho do Mercado', fundacao: true, cliente: 'bento', mapa: 'vila', x: 44, y: 18, junto: 'mercado', material: { tijolo: 20, cimento: 2 }, etapas: ['pa', 'colher', 'regador'], funcaoMin: 2, artes: ['objetos/vala', 'objetos/alicerce', 'objetos/alicerce'] },
  muro_chapiscado: { nome: 'Muro chapiscado dos fundos do depósito', cliente: 'ananias', mapa: 'vila', x: 5, y: 3, junto: 'deposito', material: { tijolo: 50, cimento: 4, cal: 2 }, etapas: ['pa', 'colher', 'colher', 'colher', 'regador'], funcaoMin: 2, hab: { h: 'acabamento', n: 3 }, reforma: true, artes: ['objetos/vala', 'objetos/alicerce', 'objetos/muro'] },
  quiosque_praia: { nome: 'Quiosque na praia', cliente: 'lourival', mapa: 'praia', x: 27, y: 6, material: { madeira: 20, telha: 10, cimento: 2 }, etapas: ['pa', 'colher', 'machado', 'machado'], funcaoMin: 2, artes: ['objetos/vala', 'objetos/alicerce', 'objetos/muro', 'objetos/quiosque_praia'] },
  ponte_pedra: { nome: 'Ponte de pedra', cliente: 'juca', mapa: 'mata', x: 12, y: 16, material: { pedra: 30, cimento: 4 }, etapas: ['pa', 'colher', 'colher', 'regador', 'regador'], funcaoMin: 2, hab: { h: 'alvenaria', n: 5 }, artes: ['objetos/monte_pedras', 'objetos/alicerce', 'objetos/ponte_pedra'] },
  calcada_colorida: { nome: 'Calçada colorida da praça', piso: true, area: { w: 3, h: 2, textura: 'texturas/piso_ladrilho' }, cliente: 'zelia', mapa: 'vila', x: 27, y: 17, junto: 'roda_samba', material: { lajota: 10, cimento: 2 }, etapas: ['pa', 'colher', 'regador'], funcaoMin: 2, concreto: true, reforma: true, artes: ['objetos/vala', 'objetos/alicerce', 'objetos/alicerce'] },
  // Os serviços melhores (as sementes melhores do Stardew; empreitadas.gd), liberados por Alvenaria e Acabamento.
  baldrame_concreto: { nome: 'Baldrame da casa nova do Seu Lourival', fundacao: true, cliente: 'lourival', mapa: 'praia', x: 12, y: 7, junto: 'banca_peixe', material: { cimento: 4, pedra: 10, vergalhao: 4 }, etapas: ['pa', 'colher', 'regador', 'regador'], funcaoMin: 2, hab: { h: 'alvenaria', n: 2 }, concreto: true, artes: ['objetos/vala', 'objetos/alicerce', 'objetos/alicerce'] },
  cimentado_queimado: { nome: 'Cimentado queimado na porta do depósito', piso: true, area: { w: 3, h: 1, textura: 'texturas/piso_cimento' }, cliente: 'ananias', mapa: 'vila', x: 6, y: 9, junto: 'deposito', material: { cimento: 6, pigmento: 2 }, etapas: ['pa', 'colher', 'regador', 'regador'], funcaoMin: 2, hab: { h: 'acabamento', n: 4 }, concreto: true, reforma: true, artes: ['objetos/vala', 'objetos/alicerce'] },
  sapata_corrida: { nome: 'Sapata corrida do galpão do Tio Juca', fundacao: true, cliente: 'juca', mapa: 'quintal', x: 30, y: 20, material: { cimento: 8, pedra: 20, vergalhao: 8 }, etapas: ['pa', 'pa', 'colher', 'regador', 'regador', 'regador'], funcaoMin: 2, hab: { h: 'alvenaria', n: 5 }, concreto: true, artes: ['objetos/vala', 'objetos/vala', 'objetos/alicerce'] },
  muro_rebocado: { nome: 'Muro rebocado e pintado do quintal da Dona Zélia', cliente: 'zelia', mapa: 'vila', x: 42, y: 6, junto: 'casa_zelia', material: { tijolo: 60, cimento: 6, tinta: 2 }, etapas: ['pa', 'colher', 'colher', 'colher', 'regador', 'regador', 'colher'], funcaoMin: 2, hab: { h: 'acabamento', n: 6 }, pintura: true, reforma: true, artes: ['objetos/vala', 'objetos/alicerce', 'objetos/muro'] },
  ladrilho: { nome: 'Piso de ladrilho na porta do Mercado', piso: true, area: { w: 3, h: 1, textura: 'texturas/piso_ladrilho' }, cliente: 'bento', mapa: 'vila', x: 39, y: 23, junto: 'mercado', material: { cimento: 4, ladrilho: 30 }, etapas: ['pa', 'colher', 'colher', 'regador', 'regador', 'colher'], funcaoMin: 2, hab: { h: 'acabamento', n: 8 }, reforma: true, artes: ['objetos/vala', 'objetos/alicerce'] },
  radier: { nome: 'Radier do galpão do Tio Juca', piso: true, area: { w: 3, h: 3, textura: 'texturas/piso_cimento' }, cliente: 'juca', mapa: 'quintal', x: 34, y: 20, material: { cimento: 15, pedra: 30, vergalhao: 15 }, etapas: ['pa', 'pa', 'colher', 'colher', 'regador', 'regador', 'regador', 'regador'], funcaoMin: 2, hab: { h: 'alvenaria', n: 8 }, concreto: true, artes: ['objetos/vala', 'objetos/alicerce', 'objetos/alicerce'] },
};
ecoCampo(EMPREITAS_LONGAS, 'paga', ECO.empreitas.paga);   // o pagamento de cada uma mora no ECO
for (const id in EMPREITAS_LONGAS) { const E = EMPREITAS_LONGAS[id]; Object.assign(E, { tipo: 'longa', dias: E.etapas.length, vezesDia: 3, ferramenta: E.etapas[0] }); }
// A largura do lote em ladrilhos (a arte da última etapa: muro e quiosque ocupam 3).
const larguraLote = E => { if (E.area) return E.area.w; const a = E.artes[E.artes.length - 1]; return a === 'objetos/muro' || a.endsWith('_praia') ? 3 : 2; };
// Os ladrilhos do lote: a plaquinha à esquerda e a obra (o piso tem área: largura × altura, para baixo).
const tilesDoLote = E => { const r = [{ x: E.x - 1, y: E.y }], h = E.area ? E.area.h : 1; for (let j = 0; j < h; j++) for (let i = 0; i < larguraLote(E); i++) r.push({ x: E.x + i, y: E.y + j }); return r; };
// As que não saem do quadro de Serviços (a capina, as obras da Prefeitura): registradas pelos outros scripts.
const EMPREITAS_EXTRAS = {};
// As fundações avulsas saíram do quadro (o Bairro Novo: fundação só onde vira casa); ficam aqui para o save antigo terminar.
for (const id of ['baldrame', 'baldrame_concreto', 'sapata_corrida']) { EMPREITAS_EXTRAS[id] = Object.assign(EMPREITAS_LONGAS[id], { antiga: true }); delete EMPREITAS_LONGAS[id]; }
const dadosEmpreita = id => EMPREITAS_CURTAS[id] || EMPREITAS_LONGAS[id] || EMPREITAS_EXTRAS[id] || null;
const CLIENTE_NOME = { lourival: 'Seu Lourival', juca: 'Tio Juca', zelia: 'Dona Zélia', ananias: 'Seu Ananias', tonico: 'Seu Tonico', cida: 'Dona Cida', rosa: 'Rosa', bento: 'Seu Bento do Mercado' };
const NOME_DIA = { pa: 'pá', colher: 'colher', regador: 'regador', machado: 'machado', foice: 'foice' };
// Ganchos de quem quer saber da entrega (a Prefeitura dá o prêmio): (id, qualidade) → texto para o resumo ou ''.
const AO_ENTREGAR = [];
// Ganchos que completam G.empreitas ao iniciar (a Prefeitura, as cartas, o Tião): (save) → nada.
const AO_INICIAR_EMPREITAS = [];

const Empreitas = {
  RESERVA: 3,
  iniciar(s) {
    const e = s.empreitas || {};
    G.empreitas = { feitas: Object.assign({}, e.feitas || {}), dia: e.dia || 0, quadro: (e.quadro || []).slice(), aceitas: JSON.parse(JSON.stringify(e.aceitas || {})), entregues: e.entregues || 0, reputacao: Object.assign({}, e.reputacao || {}), capina: e.capina ? JSON.parse(JSON.stringify(e.capina)) : null, caprichados: e.caprichados || 0, labia: e.labia || 0, receitasExtras: (e.receitasExtras || []).slice() };
    // Save antigo (etapas 2 a 5): a longa aceita já tinha gastado o material, então segue em obra (ou pronta) de onde parou.
    for (const id in G.empreitas.aceitas) {
      const a = G.empreitas.aceitas[id], E = dadosEmpreita(id) && dadosEmpreita(id).tipo === 'longa' ? dadosEmpreita(id) : null;
      if (!E || a.estado) continue;
      Object.assign(a, { estado: a.dias >= E.dias ? 'pronta' : 'obra', aditivo: '', porTiao: 0, carta: false, prefeitura: false, lista: E.etapas.slice() });
    }
    for (const f of AO_INICIAR_EMPREITAS) f(s);
  },
  salvar(s) { s.empreitas = JSON.parse(JSON.stringify(G.empreitas)); },
  funcao() { return G.obra ? G.obra.funcao : 0; },
  limite() { return Empreitas.funcao() >= 3 ? 2 : 1; },
  // As longas aceitas (do quadro, das cartas, do bairro) contam no limite; a Prefeitura e a capina não.
  longasContadas() { return Object.keys(G.empreitas.aceitas).filter(k => { const E = dadosEmpreita(k), a = G.empreitas.aceitas[k]; return E && E.tipo === 'longa' && !a.prefeitura; }).length; },
  libera(id) {
    const E = dadosEmpreita(id);
    if (!E || Empreitas.funcao() < E.funcaoMin) return false;
    return !E.hab || typeof Habilidades === 'undefined' || Habilidades.nivel(E.hab.h) >= E.hab.n;
  },
  // 2 a 4 pedidos (mais com a reputação), fixos pelo dia; pelo menos uma longa quando a função já libera.
  quadroDoDia(dia) {
    const f = mulberry(dia * 6151 + 11), n = Empreitas.faixa().pedidos;
    const livre = id => Empreitas.libera(id) && !G.empreitas.aceitas[id];
    const curtas = Object.keys(EMPREITAS_CURTAS).filter(livre), longas = Object.keys(EMPREITAS_LONGAS).filter(livre), r = [];
    if (!G.empreitas.capina && Empreitas.libera('capina_ananias')) curtas.push('capina_ananias');
    // Fim de ano: as reformas aparecem em dobro no sorteio.
    if (Empreitas.emFimDeAno(dia)) for (const id of longas.slice()) if (EMPREITAS_LONGAS[id].reforma) longas.push(id);
    if (longas.length) r.push(longas.splice(Math.floor(f() * longas.length), 1)[0]);
    const pool = curtas.concat(longas);
    while (r.length < n && pool.length) { const id = pool.splice(Math.floor(f() * pool.length), 1)[0]; if (!r.includes(id)) r.push(id); }
    return r;
  },
  // Mestre de obras: as empreitas pedem 20% menos material (arredondando para cima).
  material(id) { const E = dadosEmpreita(id), f = typeof Habilidades !== 'undefined' && Habilidades.tem('mestre_de_obras') ? 0.8 : 1, r = {}; for (const m in E.material) r[m] = Math.ceil(E.material[m] * f); return r; },
  // Aceitar: a curta começa; a longa fica reservada (não gasta nada).
  aceitar(id, mochila, dinheiro, opc = {}) {
    const E = dadosEmpreita(id);
    if (!E) return 'nao';
    if (G.empreitas.aceitas[id]) return 'ja';
    if (!opc.prefeitura && !Empreitas.libera(id)) return 'funcao';
    if (E.tipo === 'capina') { if (G.empreitas.capina) return 'ja'; G.empreitas.capina = { dia: G.dia, estacao: Math.floor((G.dia - 1) / 28) % 4, pos: [], limpo: false, nasceu: 0 }; G.empreitas.quadro = G.empreitas.quadro.filter(x => x !== id); return 'ok'; }
    if (E.tipo === 'longa') {
      if (!opc.prefeitura && Empreitas.longasContadas() >= Empreitas.limite()) return 'limite';
      G.empreitas.aceitas[id] = { tipo: 'longa', estado: 'reservada', dia: G.dia, dias: 0, feitoHoje: 0, trabalhou: false, aditivo: '', porTiao: 0, carta: !!opc.carta, prefeitura: !!opc.prefeitura, lista: [] };
    } else G.empreitas.aceitas[id] = { tipo: 'curta', dia: G.dia, vezes: 0 };
    G.empreitas.quadro = G.empreitas.quadro.filter(x => x !== id);
    return 'ok';
  },
  // As ferramentas dos dias; o acelerador (o Speed-Gro) tira 25%, começando pelos de regador (fica pelo menos 1).
  listaDias(id, aditivo = '') {
    const l = dadosEmpreita(id).etapas.slice();
    if (aditivo !== 'acelerador') return l;
    for (let k = Math.floor(l.length * 0.25); k > 0 && l.length > 1; k--) {
      const i = l.filter(x => x === 'regador').length > 1 ? l.lastIndexOf('regador') : l.length - 1;
      l.splice(i, 1);
    }
    return l;
  },
  // Começar (o plantar): o material sai da mochila e a obra começa no dia 0.
  comecar(id, mochila) {
    const a = G.empreitas.aceitas[id];
    if (!a || a.estado !== 'reservada') return 'estado';
    const mat = Empreitas.material(id);
    for (const m in mat) if (mochila.total(m) < mat[m]) return 'material';
    for (const m in mat) mochila.remover(m, mat[m]);
    Object.assign(a, { estado: 'obra', dias: 0, feitoHoje: 0, trabalhou: false, lista: Empreitas.listaDias(id, a.aditivo) });
    return 'ok';
  },
  ferramentaHoje(id) { const a = G.empreitas.aceitas[id]; return a && a.estado === 'obra' ? a.lista[a.dias] || '' : ''; },
  // Na chuva: o concreto não pega (pá e colher) e o dia de pintar espera.
  impedeHoje(id, chove) {
    if (!chove) return '';
    const E = dadosEmpreita(id), a = G.empreitas.aceitas[id], f = Empreitas.ferramentaHoje(id);
    if (E.concreto && (f === 'pa' || f === 'colher')) return 'concreto';
    if (E.pintura && a && a.estado === 'obra' && a.dias === a.lista.length - 1) return 'pintura';
    return '';
  },
  // Mão firme: o dia de pá ou de colher sai com 1 golpe.
  golpesDoDia(id) { const f = Empreitas.ferramentaHoje(id); return (f === 'pa' || f === 'colher') && typeof Habilidades !== 'undefined' && Habilidades.tem('mao_firme') ? 1 : 3; },
  trabalhar(id, ferr) {
    const E = dadosEmpreita(id), a = G.empreitas.aceitas[id];
    if (!E || !a) return 'nao';
    if (E.tipo === 'longa') {
      if (a.estado !== 'obra') return 'estado';
      if (a.trabalhou) return 'feito_hoje';
      const chuva = Empreitas.impedeHoje(id, typeof Clima !== 'undefined' && Clima.chove(G.dia));
      if (chuva) return chuva;
      const hoje = Empreitas.ferramentaHoje(id);
      if (ferr !== hoje) return 'ferramenta';
      a.feitoHoje++;
      if (a.feitoHoje >= Empreitas.golpesDoDia(id)) a.trabalhou = true;
      if (typeof Habilidades !== 'undefined') Habilidades.ganhar(hoje === 'colher' || hoje === 'pa' ? 'alvenaria' : 'folego', a.trabalhou ? 5 : 1);
      return 'ok';
    }
    if (ferr !== E.ferramenta) return 'ferramenta';
    for (const m in E.material) if (G.mochila.total(m) < E.material[m]) return 'material';
    a.vezes++;
    if (typeof Habilidades !== 'undefined') Habilidades.ganhar(E.ferramenta === 'pa' ? 'alvenaria' : 'folego', 2);
    if (a.vezes < E.vezes) return 'ok';
    for (const m in E.material) G.mochila.remover(m, E.material[m]);
    G.dinheiro += E.paga; G.ganhoHoje = (G.ganhoHoje || 0) + E.paga;
    Empreitas._entregou(id);
    return 'pronta';
  },
  // Entregar (o colher): o cliente paga à noite.
  entregar(id) { const a = G.empreitas.aceitas[id]; if (!a || a.estado !== 'pronta') return 'estado'; a.estado = 'entregue'; return 'ok'; },
  textoEstado(id) {
    const E = dadosEmpreita(id), a = G.empreitas.aceitas[id];
    if (!E || !a) return '';
    if (E.tipo !== 'longa') return 'em andamento';
    const prazo = a.prefeitura && a.estado !== 'entregue' ? ` · entregar até ${DIAS[(a.dia + 5) % 7]}` : '';
    if (a.estado === 'reservada') return (a.prefeitura ? 'aceita: começar com o material' : `reservada: começar até ${DIAS[(a.dia + Empreitas.RESERVA - 2) % 7]}`) + prazo;
    if (a.estado === 'obra') { const f = Empreitas.ferramentaHoje(id); return `dia ${a.dias + 1}/${a.lista.length}: ${a.trabalhou ? 'hoje feito' : 'hoje é dia de ' + (NOME_DIA[f] || f)}` + prazo; }
    if (a.estado === 'pronta') return 'pronta: entregar na plaquinha' + prazo;
    return 'entregue: paga à noite';
  },
  _entregou(id, q = 1) {
    const E = dadosEmpreita(id);
    delete G.empreitas.aceitas[id];
    // A obra fica no mapa (muros, pisos, cerca, quiosque, ponte); a fundação sozinha não (ela é o começo de uma casa).
    if (E.tipo === 'longa' && !E.fundacao && !E.bairro) G.empreitas.feitas[id] = q;
    G.empreitas.entregues++;
    if (q >= 1.5) G.empreitas.caprichados = (G.empreitas.caprichados || 0) + 1;
    G.empreitas.reputacao[E.cliente] = (G.empreitas.reputacao[E.cliente] || 0) + 1;
    if (typeof Clientela !== 'undefined' && G.amizade) Clientela.registrarAmizade(G.amizade, [E.cliente]);
    // Lábia: a amizade sobe 50% mais rápido (um coração a mais a cada duas entregas).
    if (typeof Habilidades !== 'undefined' && Habilidades.tem('labia')) { G.empreitas.labia = (G.empreitas.labia || 0) + 1; if (G.empreitas.labia % 2 === 0 && typeof Clientela !== 'undefined' && G.amizade) Clientela.registrarAmizade(G.amizade, [E.cliente]); }
    return AO_ENTREGAR.map(f => f(id, q)).filter(Boolean);
  },
  // A noite: a reserva vence; o dia cuidado (ou o de regador na chuva) avança; a entregue paga.
  noite(chove) {
    const r = [];
    for (const id of Object.keys(G.empreitas.aceitas)) {
      const E = dadosEmpreita(id), a = G.empreitas.aceitas[id];
      if (!E || E.tipo !== 'longa') continue;
      if (a.estado === 'reservada') {
        if (!a.prefeitura && G.dia >= a.dia + Empreitas.RESERVA - 1) { delete G.empreitas.aceitas[id]; r.push({ id, desistiu: true }); }
        continue;
      }
      if (a.estado === 'obra') {
        if (a.trabalhou || (chove && Empreitas.ferramentaHoje(id) === 'regador')) a.dias++;
        a.feitoHoje = 0; a.trabalhou = false;
        if (a.dias >= a.lista.length) a.estado = 'pronta';
        r.push({ id, entregue: false, dias: a.dias, pronta: a.estado === 'pronta' });
        continue;
      }
      if (a.estado === 'entregue') {
        const q = Empreitas.qualidade(mulberry(G.dia * 977 + id.length), ADITIVOS[a.aditivo] || 0, a.porTiao * 2 > a.lista.length), valor = Empreitas.pagamento(id, a, q);
        G.dinheiro += valor;
        r.push({ id, entregue: true, valor, qualidade: q, extra: Empreitas._entregou(id, q) });
      }
    }
    return r;
  },
};
// A capina do terreno do Seu Ananias (a cultura que rebrota do Stardew): aceita uma vez; a cada 3 dias 6 matos nascem
// no terreno; limpo, paga Cr$ 30 à noite; acaba na troca de estação. Não conta no limite de longas.
EMPREITAS_EXTRAS.capina_ananias = { nome: 'Capina do terreno do Seu Ananias', cliente: 'ananias', mapa: 'vila', x: 11, y: 3, junto: 'deposito', material: {}, ferramenta: 'foice', paga: ECO.empreitas.paga.capina_ananias, funcaoMin: 0, tipo: 'capina', matos: 6, cada: 3 };
Object.assign(Empreitas, {
  // O fim de ano: a última semana da Primavera e as duas primeiras do Verão (reformas antes do Natal).
  emFimDeAno(dia) { const est = Math.floor((dia - 1) / 28) % 4, d = (dia - 1) % 28 + 1; return (est === 2 && d >= 22) || (est === 3 && d <= 14); },
  fatorEpoca(id, dia = G.dia) { const E = dadosEmpreita(id); return E && E.reforma && Empreitas.emFimDeAno(dia) ? 1.2 : 1; },
  capinaNasce(dia) { const c = G.empreitas.capina; return !!c && (dia - c.dia) % EMPREITAS_EXTRAS.capina_ananias.cada === 0; },
  capinaNoite() {
    const c = G.empreitas.capina; if (!c || !c.limpo) return 0;
    c.limpo = false; const v = EMPREITAS_EXTRAS.capina_ananias.paga; G.dinheiro += v; Empreitas._entregou('capina_ananias', 1); return v;
  },
});
// Os aditivos (o adubo do Stardew): cal e impermeabilizante melhoram a qualidade (nível 1 e 2); o acelerador (o Speed-Gro)
// encurta a obra. Um por obra, antes de começar ou no dia 0 sem golpe.
const ADITIVOS = { cal: 1, impermeabilizante: 2, acelerador: 0 };
const NOME_QUALIDADE = { 1: 'normal', 1.25: 'bom', 1.5: 'caprichado', 2: 'impecável' };
// A Fala da Vila (as faixas de reputação): mais pedidos e pagamento melhor.
const FAIXAS_VILA = [
  { nome: 'Biscateiro', entregues: 0, caprichados: 0, pedidos: 2, fator: ECO.empreitas.faixas[0] },
  { nome: 'Pedreiro de confiança', entregues: 8, caprichados: 0, pedidos: 3, fator: ECO.empreitas.faixas[1] },
  { nome: 'Mestre da Vila', entregues: 20, caprichados: 5, pedidos: 4, fator: ECO.empreitas.faixas[2] },
];
Object.assign(Empreitas, {
  aplicarAditivo(id, aditivo, mochila) {
    const a = G.empreitas.aceitas[id];
    if (!a || a.tipo !== 'longa' || !(aditivo in ADITIVOS)) return 'nao';
    if (a.aditivo) return 'ja';
    if (!(a.estado === 'reservada' || (a.estado === 'obra' && a.dias === 0 && a.feitoHoje === 0 && !a.trabalhou))) return 'tarde';
    if (aditivo === 'acelerador' && Empreitas.listaDias(id, 'acelerador').length === dadosEmpreita(id).etapas.length) return 'curta';
    if (mochila.total(aditivo) < 1) return 'falta';
    mochila.remover(aditivo, 1); a.aditivo = aditivo;
    if (a.estado === 'obra') a.lista = Empreitas.listaDias(id, aditivo);
    return 'ok';
  },
  // A fórmula do Stardew para o ouro, com Acabamento no lugar de Farming e o aditivo no lugar do adubo (empreitadas.gd);
  // o impecável (o irídio) só com o impermeabilizante, a metade da chance.
  qualidade(rng = Math.random, F = 0, semImpecavel = false) {
    if (Empreitas.funcao() < 2) return 1;
    const A = typeof Habilidades !== 'undefined' ? Habilidades.nivel('acabamento') : 0, ouro = 0.2 * (A / 10) + 0.2 * F * ((A + 2) / 12) + 0.01, r = rng();
    if (F >= 2 && r < ouro / 2) return semImpecavel ? 1.5 : 2;
    if (r < ouro) return 1.5;
    return rng() < Math.min(0.75, ouro * 2) ? 1.25 : 1;
  },
  faixa() {
    let i = 0;
    for (let k = 1; k < FAIXAS_VILA.length; k++) if (G.empreitas.entregues >= FAIXAS_VILA[k].entregues && (G.empreitas.caprichados || 0) >= FAIXAS_VILA[k].caprichados) i = k;
    return Object.assign({ i }, FAIXAS_VILA[i]);
  },
  pagamento(id, a, q, dia = G.dia) {
    const E = dadosEmpreita(id);
    return Math.round(E.paga * q * Empreitas.fatorEpoca(id, dia) * Empreitas.faixa().fator * (a && a.carta ? ECO.empreitas.carta : 1)) + (q > 1 && typeof Habilidades !== 'undefined' && Habilidades.tem('artista') ? 50 : 0);
  },
});
INICIADORES.push(s => Empreitas.iniciar(s));
COLETORES.push(s => Empreitas.salvar(s));
