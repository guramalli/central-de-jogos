// Jocelino — empreitas.js — as empreitas do Jocelino (a lavoura do Stardew; empreitadas.gd do Godot), as regras:
// - curtas (uma tarde): leva o material, usa a ferramenta certa N vezes no lugar e recebe na hora;
// - longas (vários dias): aceita gastando o material, trabalha 1 vez por dia (N golpes com a ferramenta), a obra
//   avança à noite (esqueceu um dia, não avança; a chuva conta nas de cimento), pronta paga à noite com a qualidade.
// O quadro de Serviços da Vila mostra 2 a 4 por dia (mais com a reputação), só o que a função libera.

const EMPREITAS_CURTAS = {
  consertar_banca: { nome: 'Consertar a banca do Lourival', cliente: 'lourival', mapa: 'praia', x: 10, y: 8, material: { madeira: 5 }, ferramenta: 'machado', vezes: 4, paga: 25 },
  tabua_pier: { nome: 'Tapar tábua solta do píer', cliente: 'lourival', mapa: 'praia', x: 29, y: 15, material: { madeira: 3 }, ferramenta: 'machado', vezes: 3, paga: 20 },
  limpar_trilha: { nome: 'Limpar a trilha da mata', cliente: 'juca', mapa: 'mata', x: 30, y: 11, material: {}, ferramenta: 'foice', vezes: 8, paga: 18 },
  escorar_ponte: { nome: 'Escorar a ponte da mata', cliente: 'juca', mapa: 'mata', x: 25, y: 15, material: { madeira: 4 }, ferramenta: 'machado', vezes: 4, paga: 25 },
  remendar_calcada: { nome: 'Remendar a calçada da praça', cliente: 'zelia', mapa: 'vila', x: 27, y: 16, material: { cimento: 2 }, ferramenta: 'pa', vezes: 4, paga: 30 },
  cerca_zelia: { nome: 'Consertar a cerca da Dona Zélia', cliente: 'zelia', mapa: 'vila', x: 35, y: 10, material: { madeira: 4 }, ferramenta: 'machado', vezes: 3, paga: 22 },
  telhas_juca: { nome: 'Trocar telhas do Tio Juca', cliente: 'juca', mapa: 'quintal', x: 9, y: 9, material: { telha: 6 }, ferramenta: 'carga', vezes: 1, paga: 20 },
  desentulhar_ananias: { nome: 'Desentulhar o terreno do Seu Ananias', cliente: 'ananias', mapa: 'vila', x: 11, y: 13, material: {}, ferramenta: 'pa', vezes: 6, paga: 25 },
};
for (const id in EMPREITAS_CURTAS) Object.assign(EMPREITAS_CURTAS[id], { funcaoMin: 0, tipo: 'curta' });
const EMPREITAS_LONGAS = {
  calcada_cimento: { nome: 'Calçada de cimento', cliente: 'tonico', mapa: 'vila', x: 19, y: 16, material: { cimento: 3, pedra: 6 }, ferramenta: 'pa', vezesDia: 3, dias: 2, paga: 60, funcaoMin: 1, cura: true, artes: ['objetos/vala', 'objetos/alicerce'] },
  cerca_madeira: { nome: 'Cerca de madeira', cliente: 'juca', mapa: 'quintal', x: 26, y: 13, material: { madeira: 10 }, ferramenta: 'machado', vezesDia: 3, dias: 2, paga: 55, funcaoMin: 1, artes: ['objetos/vala', 'objetos/cerca'] },
  muro_baixo: { nome: 'Muro baixo de tijolo', cliente: 'zelia', mapa: 'vila', x: 33, y: 13, material: { tijolo: 30, cimento: 2 }, ferramenta: 'colher', vezesDia: 3, dias: 3, paga: 85, funcaoMin: 1, artes: ['objetos/vala', 'objetos/alicerce', 'objetos/muro'] },
  baldrame: { nome: 'Baldrame de tijolo', cliente: 'cida', mapa: 'vila', x: 8, y: 17, material: { tijolo: 20, cimento: 2 }, ferramenta: 'colher', vezesDia: 3, dias: 3, paga: 90, funcaoMin: 2, cura: true, artes: ['objetos/vala', 'objetos/alicerce', 'objetos/alicerce'] },
  muro_chapiscado: { nome: 'Muro chapiscado', cliente: 'ananias', mapa: 'vila', x: 3, y: 15, material: { tijolo: 50, cimento: 4, cal: 2 }, ferramenta: 'colher', vezesDia: 3, dias: 5, paga: 220, funcaoMin: 2, hab: { h: 'acabamento', n: 3 }, cura: true, artes: ['objetos/vala', 'objetos/alicerce', 'objetos/muro'] },
  quiosque_praia: { nome: 'Quiosque na praia', cliente: 'lourival', mapa: 'praia', x: 27, y: 6, material: { madeira: 20, telha: 10, cimento: 2 }, ferramenta: 'colher', vezesDia: 3, dias: 4, paga: 260, funcaoMin: 2, artes: ['objetos/vala', 'objetos/alicerce', 'objetos/muro', 'objetos/quiosque_praia'] },
  ponte_pedra: { nome: 'Ponte de pedra', cliente: 'juca', mapa: 'mata', x: 12, y: 15, material: { pedra: 30, cimento: 4 }, ferramenta: 'colher', vezesDia: 3, dias: 5, paga: 320, funcaoMin: 2, hab: { h: 'alvenaria', n: 5 }, cura: true, artes: ['objetos/monte_pedras', 'objetos/alicerce', 'objetos/ponte_pedra'] },
};
for (const id in EMPREITAS_LONGAS) EMPREITAS_LONGAS[id].tipo = 'longa';
const dadosEmpreita = id => EMPREITAS_CURTAS[id] || EMPREITAS_LONGAS[id];
const CLIENTE_NOME = { lourival: 'Seu Lourival', juca: 'Tio Juca', zelia: 'Dona Zélia', ananias: 'Seu Ananias', tonico: 'Seu Tonico', cida: 'Dona Cida' };

const Empreitas = {
  iniciar(s) {
    const e = s.empreitas || {};
    G.empreitas = { dia: e.dia || 0, quadro: (e.quadro || []).slice(), aceitas: JSON.parse(JSON.stringify(e.aceitas || {})), entregues: e.entregues || 0, reputacao: Object.assign({}, e.reputacao || {}) };
  },
  salvar(s) { s.empreitas = JSON.parse(JSON.stringify(G.empreitas)); },
  funcao() { return G.obra ? G.obra.funcao : 0; },
  limite() { return Empreitas.funcao() >= 3 ? 2 : 1; },
  libera(id) {
    const E = dadosEmpreita(id);
    if (!E || Empreitas.funcao() < E.funcaoMin) return false;
    return !E.hab || typeof Habilidades === 'undefined' || Habilidades.nivel(E.hab.h) >= E.hab.n;
  },
  // 2 a 4 pedidos (mais com a reputação), fixos pelo dia; pelo menos uma longa quando a função já libera.
  quadroDoDia(dia) {
    const f = mulberry(dia * 6151 + 11), n = 2 + Math.min(2, Math.floor(G.empreitas.entregues / 5));
    const livre = id => Empreitas.libera(id) && !G.empreitas.aceitas[id];
    const curtas = Object.keys(EMPREITAS_CURTAS).filter(livre), longas = Object.keys(EMPREITAS_LONGAS).filter(livre), r = [];
    if (longas.length) r.push(longas.splice(Math.floor(f() * longas.length), 1)[0]);
    const pool = curtas.concat(longas);
    while (r.length < n && pool.length) r.push(pool.splice(Math.floor(f() * pool.length), 1)[0]);
    return r;
  },
  aceitar(id, mochila, dinheiro) {
    const E = dadosEmpreita(id);
    if (!E) return 'nao';
    if (G.empreitas.aceitas[id]) return 'ja';
    if (!Empreitas.libera(id)) return 'funcao';
    if (E.tipo === 'longa') {
      if (Object.keys(G.empreitas.aceitas).filter(k => EMPREITAS_LONGAS[k]).length >= Empreitas.limite()) return 'limite';
      for (const m in E.material) if (mochila.total(m) < E.material[m]) return 'material';
      for (const m in E.material) mochila.remover(m, E.material[m]);
      G.empreitas.aceitas[id] = { tipo: 'longa', dia: G.dia, feitoHoje: 0, dias: 0, trabalhou: false };
    } else G.empreitas.aceitas[id] = { tipo: 'curta', dia: G.dia, vezes: 0 };
    G.empreitas.quadro = G.empreitas.quadro.filter(x => x !== id);
    return 'ok';
  },
  // Um golpe da ferramenta (ou a entrega da carga) no lugar da empreita.
  trabalhar(id, ferr) {
    const E = dadosEmpreita(id), a = G.empreitas.aceitas[id];
    if (!E || !a) return 'nao';
    if (E.tipo === 'longa') {
      if (a.feitoHoje >= E.vezesDia) return 'feito_hoje';
      if (ferr !== E.ferramenta) return 'ferramenta';
      a.feitoHoje++;
      if (a.feitoHoje >= E.vezesDia) a.trabalhou = true;
      if (typeof Habilidades !== 'undefined') Habilidades.ganhar(E.ferramenta === 'colher' || E.ferramenta === 'pa' ? 'alvenaria' : 'folego', a.trabalhou ? 5 : 1);
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
  _entregou(id) {
    const E = dadosEmpreita(id);
    delete G.empreitas.aceitas[id];
    G.empreitas.entregues++;
    G.empreitas.reputacao[E.cliente] = (G.empreitas.reputacao[E.cliente] || 0) + 1;
    if (typeof Clientela !== 'undefined' && G.amizade) Clientela.registrarAmizade(G.amizade, [E.cliente]);
  },
  // Normal, bom ou caprichado (1, 1,25 ou 1,5): só do pedreiro em diante, pelo Acabamento (a qualidade das plantas).
  qualidade(rng = Math.random) {
    if (Empreitas.funcao() < 2) return 1;
    const p = 0.2 * ((typeof Habilidades !== 'undefined' ? Habilidades.nivel('acabamento') : 0) / 10) + 0.01, r = rng();
    return r < p ? 1.5 : r < p * 2.5 ? 1.25 : 1;
  },
  // A noite: as longas trabalhadas hoje (ou na chuva, nas de cimento depois do 1º dia) avançam; prontas pagam.
  noite(chove) {
    const r = [];
    for (const id of Object.keys(G.empreitas.aceitas)) {
      const E = EMPREITAS_LONGAS[id], a = G.empreitas.aceitas[id];
      if (!E) continue;
      if (a.trabalhou || (chove && E.cura && a.dias >= 1)) a.dias++;
      a.feitoHoje = 0; a.trabalhou = false;
      if (a.dias < E.dias) { r.push({ id, entregue: false, dias: a.dias }); continue; }
      const q = Empreitas.qualidade(mulberry(G.dia * 977 + id.length)), valor = Math.round(E.paga * q) + (q > 1 && typeof Habilidades !== 'undefined' && Habilidades.tem('artista') ? 50 : 0);
      G.dinheiro += valor;
      Empreitas._entregou(id);
      r.push({ id, entregue: true, valor, qualidade: q });
    }
    return r;
  },
};
INICIADORES.push(s => Empreitas.iniciar(s));
COLETORES.push(s => Empreitas.salvar(s));
