// Jocelino — pesca.js — a pesca (a do Stardew; pesca.gd do Godot), as regras: o peixe depende do lugar (mar, rio, alto-mar),
// da estação, da hora, da chuva e do "fundo"; 8% vem lixo; os lendários (um por lugar) saem uma vez. O minijogo é o da
// barra do Stardew: a faixa verde sobe segurando e cai solta; o medidor enche com o peixe dentro dela.

const DADOS_PEIXE = {
  sardinha: { preco: 8, dif: 30, jeito: 'dardo' }, pescada: { preco: 14, dif: 35, jeito: 'liso' }, tainha: { preco: 18, dif: 50, jeito: 'misto' },
  baiacu: { preco: 6, dif: 80, jeito: 'boia' }, robalo: { preco: 35, dif: 50, jeito: 'misto' }, caranguejo: { preco: 20, dif: 30, jeito: 'afunda' },
  lagosta: { preco: 70, dif: 70, jeito: 'afunda' }, lambari: { preco: 6, dif: 35, jeito: 'dardo' }, piau: { preco: 15, dif: 45, jeito: 'misto' },
  cascudo: { preco: 18, dif: 75, jeito: 'misto' }, traira: { preco: 32, dif: 60, jeito: 'dardo' },
  cavala: { preco: 30, dif: 70, jeito: 'liso' }, garoupa: { preco: 45, dif: 55, jeito: 'afunda' }, dourado: { preco: 55, dif: 78, jeito: 'misto' },
  camarao: { preco: 25, dif: 40, jeito: 'liso' }, polvo: { preco: 60, dif: 95, jeito: 'afunda' },
};
const TODAS = [0, 1, 2, 3];
const LUGARES_PESCA = {
  mar: [{ id: 'sardinha', est: TODAS, horas: [6, 20], peso: 6 }, { id: 'pescada', est: TODAS, horas: [6, 26], peso: 4 }, { id: 'tainha', est: [0, 1], horas: [6, 19], peso: 4 },
    { id: 'baiacu', est: [3], horas: [9, 18], peso: 3 }, { id: 'robalo', est: [2, 3], horas: [16, 24], fundo: true, peso: 2 }, { id: 'caranguejo', est: TODAS, horas: [18, 26], peso: 3 },
    { id: 'lagosta', est: [1], horas: [6, 26], chuva: true, fundo: true, peso: 1 }],
  rio: [{ id: 'lambari', est: TODAS, horas: [6, 20], peso: 6 }, { id: 'piau', est: [0, 1, 2], horas: [6, 19], peso: 4 }, { id: 'cascudo', est: TODAS, horas: [18, 26], peso: 3 },
    { id: 'traira', est: [2, 3], horas: [6, 26], fundo: true, peso: 2 }],
  alto: [{ id: 'cavala', est: TODAS, horas: [5, 15], peso: 6 }, { id: 'garoupa', est: TODAS, horas: [5, 15], peso: 4 }, { id: 'dourado', est: [2, 3], horas: [5, 15], peso: 3 },
    { id: 'camarao', est: TODAS, horas: [5, 15], peso: 5 }, { id: 'polvo', est: [0, 1], horas: [5, 15], peso: 2 }, { id: 'robalo', est: TODAS, horas: [5, 15], peso: 3 }],
};
const LENDARIOS = {
  tainha_rainha: { local: 'mar', est: [1], chuva: true, fundo: true, dif: 95, jeito: 'misto', preco: 400 },
  robalo_flecha: { local: 'mar', est: [3], horas: [18, 22], fundo: true, dif: 100, jeito: 'dardo', preco: 500 },
  bagre_assombrado: { local: 'rio', est: TODAS, horas: [24, 26], dif: 95, jeito: 'afunda', preco: 450 },
  traira_velha: { local: 'rio', est: [2], chuva: true, fundo: true, dif: 100, jeito: 'dardo', preco: 500 },
  mero: { local: 'alto', est: [0], cardume: true, dif: 110, jeito: 'afunda', preco: 800 },
};
for (const id in LENDARIOS) DADOS_PEIXE[id] = { preco: LENDARIOS[id].preco, dif: LENDARIOS[id].dif, jeito: LENDARIOS[id].jeito };
const PESCA_LIXO = 0.08, PESCA_LENDARIO = 0.05;
const _estPesca = dia => Math.floor((dia - 1) / 28) % 4;
const _hora = min => Math.floor(min / 60);

const Pesca = {
  possiveis({ local, dia, minutos, chove, fundo }) {
    const est = _estPesca(dia), h = _hora(minutos);
    return (LUGARES_PESCA[local] || []).filter(p => p.est.includes(est) && h >= p.horas[0] && h < p.horas[1] && (!p.chuva || chove) && (!p.fundo || fundo));
  },
  _lendario(c) {
    const est = _estPesca(c.dia), h = _hora(c.minutos);
    return Object.keys(LENDARIOS).find(id => { const L = LENDARIOS[id];
      return L.local === c.local && !(G.pesca && G.pesca.lendarios.includes(id)) && L.est.includes(est) && (!L.horas || (h >= L.horas[0] && h < L.horas[1]))
        && (!L.chuva || c.chove) && (!L.fundo || c.fundo) && (!L.cardume || c.cardume); }) || '';
  },
  fisgar(c, rng = Math.random) {
    if (rng() < PESCA_LIXO) return { tipo: 'lixo', id: 'ferro_velho' };
    const L = Pesca._lendario(c); if (L && rng() < PESCA_LENDARIO) return { tipo: 'lendario', id: L };
    const ps = Pesca.possiveis(c); if (!ps.length) return { tipo: 'nada', id: '' };
    const peso = p => p.peso * (p.peso <= 2 && (c.chove || c.fundo) ? 1.6 : 1) * (p.peso <= 2 && c.isca ? 1.5 : 1) * (p.peso <= 3 && c.cardume ? 2 : 1);
    let x = rng() * ps.reduce((s, p) => s + peso(p), 0);
    for (const p of ps) { x -= peso(p); if (x <= 0) return { tipo: 'peixe', id: p.id }; }
    return { tipo: 'peixe', id: ps[0].id };
  },
  faixa(nivel, molinete) { return 0.17 + 0.014 * nivel + (molinete ? 0.05 : 0); },
  xp(id, perfeita, lendario) { return Math.round(5 + DADOS_PEIXE[id].dif / 3) * (perfeita ? 2 : 1) * (lendario ? 5 : 1); },
};

// ---------- o minijogo (a barra do Stardew): posições de 0 (embaixo) a 1 (em cima) ----------
const Pescaria = {
  novo(id, { faixa, bau }, rng = Math.random) {
    const D = DADOS_PEIXE[id];
    return { id, dif: D.dif, jeito: D.jeito, pos: 0.3, alvo: 0.5, faixaY: 0, faixaV: 0, faixaH: faixa, medidor: 0.3, perfeita: true,
      bau: bau ? { y: 0.15 + rng() * 0.7, prog: 0, visivel: false, pego: false } : null, t: 0, fim: null };
  },
  _alvo(e, rng) {
    const r = rng();
    if (e.jeito === 'afunda') return r < 0.6 ? r / 0.6 * 0.5 : 0.5 + (r - 0.6) / 0.4 * 0.5;
    if (e.jeito === 'boia') return r < 0.6 ? 0.5 + r / 0.6 * 0.5 : (r - 0.6) / 0.4 * 0.5;
    if (e.jeito === 'liso') return Math.max(0, Math.min(1, e.pos + (r - 0.5) * 0.4));
    return r;
  },
  passo(e, dt, segurando, rng = Math.random) {
    if (e.fim) return e.fim;
    e.t += dt;
    // A faixa verde: segurar acelera para cima, soltar puxa para baixo; quica fraco nas bordas.
    e.faixaV += (segurando ? 1.6 : -1.6) * dt; e.faixaY += e.faixaV * dt;   // 0,25 px por quadro no trilho de 568 px do Stardew
    if (e.faixaY < 0) { e.faixaY = 0; e.faixaV *= -0.3; }
    if (e.faixaY > 1 - e.faixaH) { e.faixaY = 1 - e.faixaH; e.faixaV *= -0.3; }
    // O peixe persegue um alvo que troca com a dificuldade; o jeito muda a velocidade e para onde vai.
    const troca = (e.dif / 4000) * (e.jeito === 'dardo' ? 1.5 : 1) * 60 * dt;   // a chance por quadro do Stardew
    if (rng() < troca) e.alvo = Pescaria._alvo(e, rng);
    // Como no Stardew, o peixe desliza até o alvo (mais devagar perto dele): tempo (20 + (100 − dif)) / 60 s, dardo mais
    // rápido, liso mais lento; nunca passa da velocidade máxima 0,4 + dif/100.
    const tau = (20 + (100 - Math.min(100, e.dif))) / 60 * (e.jeito === 'dardo' ? 0.67 : e.jeito === 'liso' ? 1.4 : 1);
    const vmax = (0.4 + e.dif / 100) * (e.jeito === 'dardo' ? 1.5 : e.jeito === 'liso' ? 0.7 : 1);
    e.pos += Math.max(-vmax, Math.min(vmax, (e.alvo - e.pos) / tau)) * dt; e.pos = Math.max(0, Math.min(1, e.pos));
    const dentro = p => p >= e.faixaY && p <= e.faixaY + e.faixaH;
    if (dentro(e.pos)) e.medidor += 0.12 * dt; else { e.medidor -= 0.18 * dt; e.perfeita = false; }
    if (e.bau && !e.bau.pego) {
      if (e.t >= 1) e.bau.visivel = true;
      if (e.bau.visivel) { e.bau.prog = Math.max(0, e.bau.prog + (dentro(e.bau.y) ? 0.5 : -0.3) * dt); if (e.bau.prog >= 1) e.bau.pego = true; }
    }
    if (e.medidor >= 1) e.fim = 'pegou'; else if (e.medidor <= 0) e.fim = 'escapou';
    return e.fim;
  },
};

Object.assign(ITENS, {
  cavala: { nome: 'Cavala', pilha: 99, ferramenta: false, energia: 35, descricao: 'Do alto-mar. Vende na banca ou vai para a despensa da Rosa.' },
  garoupa: { nome: 'Garoupa', pilha: 99, ferramenta: false, energia: 45, descricao: 'Do alto-mar, gorda e saborosa.' },
  dourado: { nome: 'Dourado', pilha: 99, ferramenta: false, energia: 50, descricao: 'Do alto-mar, na primavera e no verão.' },
  tainha_rainha: { nome: 'Tainha-Rainha', pilha: 9, ferramenta: false, descricao: 'Lendária da praia. Leve para a Rosa ver!' },
  robalo_flecha: { nome: 'Robalo-Flecha', pilha: 9, ferramenta: false, descricao: 'Lendário da ponta do píer. Leve para a Rosa ver!' },
  bagre_assombrado: { nome: 'Bagre-Assombrado', pilha: 9, ferramenta: false, descricao: 'Lendário do rio, de madrugada. Leve para a Rosa ver!' },
  traira_velha: { nome: 'Traíra-Velha', pilha: 9, ferramenta: false, descricao: 'Lendária do poço da cachoeira. Leve para a Rosa ver!' },
  mero: { nome: 'Mero do Lourival', pilha: 9, ferramenta: false, descricao: 'O peixe que o Lourival caça há 30 anos. Leve para a Rosa ver!' },
  isca: { nome: 'Isca', pilha: 99, ferramenta: false, descricao: 'Da banca do Lourival. Com a vara boa ou o molinete, o peixe morde mais rápido e o raro aparece mais.' },
  minhoca: { nome: 'Minhoca', pilha: 99, ferramenta: false, descricao: 'Achada cavando a grama. Serve de isca.' },
  covo: { nome: 'Covo de siri', pilha: 9, ferramenta: false, descricao: 'Ponha na água da margem com isca: de manhã tem siri, caranguejo ou camarão.' },
  vara_boa: { nome: 'Vara boa', pilha: 1, ferramenta: true, descricao: 'Da banca do Lourival. Aceita isca.' },
  molinete: { nome: 'Molinete', pilha: 1, ferramenta: true, descricao: 'Do Seu Tonico. Barra de pesca maior e aceita isca.' },
});
for (const id of ['cavala', 'garoupa', 'dourado']) Pratos.INGREDIENTES[id] = { raridade: 3, fase: 3, origem: 'Alto-mar com o Lourival' };
for (const id of ['camarao', 'polvo']) if (Pratos.INGREDIENTES[id]) Pratos.INGREDIENTES[id].origem += ' e alto-mar com o Lourival';
for (const id in DADOS_PEIXE) PRECO_CAIXA[id] = DADOS_PEIXE[id].preco;
const fatorPeixe = id => !DADOS_PEIXE[id] || typeof Habilidades === 'undefined' ? 1 : Habilidades.tem('mestre_do_pier') ? 1.5 : Habilidades.tem('pescador') ? 1.25 : 1;
const precoPeixe = id => Math.round(DADOS_PEIXE[id].preco * fatorPeixe(id) * (typeof Habilidades !== 'undefined' ? Habilidades.bonusVenda() : 1));

