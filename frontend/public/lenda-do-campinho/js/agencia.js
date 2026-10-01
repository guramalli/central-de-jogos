/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   ⭐ LENDAS FC — AGÊNCIA (v323): o modo EMPRESÁRIO (ideia do dono). Liberado no nível 400 OU ao
   "zerar" os outros modos: campeão da Liga da Coroa na Carreira E campeão do Mundial Interclubes no Clube.
   "Você já foi uma lenda dentro de campo. Agora descubra quem será a próxima."
   O ciclo: descobrir → desenvolver → representar → negociar → vender → construir reputação.
   De propósito SIMPLES (nada de virar um Brasfoot dentro do jogo):
   - 5 atributos (Velocidade, Finalização, Drible, Visão, Defesa), 6 personalidades, 5 níveis de reputação,
     4 olheiros, 5 regiões (Bairro → Estado → Brasil → América do Sul → Europa), 10 tipos de acontecimento,
     contratos, testes em clubes, transferências e patrocínios.
   - O POTENCIAL de verdade fica escondido: o olheiro dá uma faixa (ex.: 80–90) e uma avaliação paga aperta
     a faixa. Dá para errar: o "craque" pode parar no 63 e o que você quase ignorou chegar no 94.
   - O tempo anda no relógio de verdade: 1 período = 20 minutos (3 meses na vida dos garotos), e continua
     enquanto o jogo está fechado (até 10 horas). As missões dos olheiros também levam tempo real.
   - O dinheiro é o tostão do jogo: comissões de contratos, transferências e patrocínios vão para o seu bolso.
   - Conexão com o resto do jogo: os profissionais que você representa aparecem no Mercado do seu clube.
   Telas: ☀️ Hoje · 🔎 Talentos · 👤 Meus jogadores · 💼 Negociações · 🏢 Agência.
   Carregar NO FIM.
   ============================================================ */
const AG_NIVEL = 400, AG_PERIODO = 20 * 60000, AG_MAX_ATRASO = 30;
const AG_REP = [ // [pontos, título, estrelas]
  [0, 'Empresário desconhecido', ''], [100, 'Empresário local', '⭐'], [500, 'Empresário regional', '⭐⭐'], [1800, 'Empresário nacional', '⭐⭐⭐'],
  [6000, 'Empresário internacional', '⭐⭐⭐⭐'], [18000, 'Superagente', '⭐⭐⭐⭐⭐']];
// v333 (Agência 2.0): subir de nível pede METAS concretas além dos pontos — o dono achou rápido demais chegar à fase 2
const agOvrMax = a => Math.max(0, ...a.jogadores.map(j => j.ovrMax || j.ovr), ...(a.hall || []).map(h => h.ovr));
const AG_METAS = [null,
  [['Assine com 2 talentos', a => [a.marcos.assinados, 2]], ['Tenha 1 jogador aprovado num teste de clube', a => [a.marcos.aprovados, 1]]],
  [['Consiga 1 contrato profissional', a => [a.marcos.contratos, 1]], ['Resolva bem 2 problemas dos seus jogadores', a => [a.marcos.bons, 2]], ['Represente 3 jogadores ao mesmo tempo', a => [a.jogadores.length, 3]]],
  [['Consiga 3 contratos profissionais', a => [a.marcos.contratos, 3]], ['Feche 1 transferência', a => [a.marcos.transf, 1]], ['Feche 1 patrocínio', a => [a.marcos.patroc, 1]]],
  [['Feche 3 transferências', a => [a.marcos.transf, 3]], ['Venda 1 jogador para um clube de fora do Brasil', a => [a.marcos.fora, 1]], ['Tenha um jogador com overall 75 ou mais', a => [agOvrMax(a), 75]]],
  [['Feche uma venda de 30 milhões de tostões', a => [a.totais.vendaMax, 30000000]], ['Venda jogadores para clubes de 3 países', a => [Object.keys(a.paises || {}).length, 3]], ['Tenha um jogador com overall 85 ou mais', a => [agOvrMax(a), 85]]],
];
const AG_REGIOES = [
  { id: 'bairro', nome: '🏘️ Bairro', rep: 0, pot: [48, 80], ovr: [30, 44] },
  { id: 'estado', nome: '🗺️ Estado', rep: 1, pot: [54, 85], ovr: [34, 48] },
  { id: 'brasil', nome: '🇧🇷 Brasil', rep: 2, pot: [60, 89], ovr: [38, 52] },
  { id: 'america', nome: '🌎 América do Sul', rep: 3, pot: [64, 92], ovr: [40, 54], fora: 1 },
  { id: 'europa', nome: '🌍 Europa', rep: 4, pot: [68, 95], ovr: [42, 56], fora: 1 },
];
const AG_OLHEIROS = [ // [id, nome, reputação para contratar, preço para contratar, custo da missão, minutos, bônus de potencial, precisão (largura da faixa)]
  ['base', '🧢 Olheiro de base', 0, 0, 60000, 20, 0, 10],
  ['especialista', '🎯 Olheiro especialista', 1, 2500000, 400000, 40, 4, 7],
  ['internacional', '🌎 Olheiro internacional', 3, 20000000, 2000000, 60, 6, 6],
  ['lendario', '👑 Olheiro lendário', 4, 120000000, 9000000, 90, 8, 4],
];
const AG_PERS = {
  ambicioso: { nome: '🔥 Ambicioso', cresce: 1.25, prob: 1.0, desc: 'Evolui rápido.' },
  relaxado: { nome: '😎 Relaxado', cresce: 0.8, prob: 0.6, desc: 'Evolui menos, mas dá poucos problemas.' },
  trabalhador: { nome: '💪 Trabalhador', cresce: 1.2, prob: 0.5, desc: 'Treina muito bem.' },
  ganancioso: { nome: '💰 Ganancioso', cresce: 1.0, prob: 1.2, desc: 'Exige salários maiores.' },
  leal: { nome: '❤️ Leal', cresce: 1.0, prob: 0.5, desc: 'Dificilmente pede transferência.' },
  temperamental: { nome: '😡 Temperamental', cresce: 1.05, prob: 1.8, desc: 'Pode criar problemas.' },
};
const AG_ATR = { vel: '⚡ Velocidade', fin: '🎯 Finalização', dri: '🌀 Drible', vis: '👁️ Visão', def: '🛡️ Defesa' };
const AG_POS = { ATA: ['Atacante', { fin: 6, vel: 3, dri: 2, vis: -4, def: -10 }], MEI: ['Meia', { vis: 6, dri: 4, fin: 0, vel: 0, def: -6 }], LAT: ['Lateral', { vel: 6, def: 2, vis: 0, dri: 0, fin: -6 }],
  VOL: ['Volante', { def: 5, vis: 4, vel: 0, dri: -2, fin: -5 }], ZAG: ['Zagueiro', { def: 9, vel: 0, vis: -2, dri: -6, fin: -8 }] };
// clubes inventados (nada de time de verdade), por degrau: [nome, país, cor]
const AG_CLUBES = [
  { nivel: 0, ovr: 40, salario: 15000, nomes: [['Várzea Unidos', 'Brasil', '#2a7a3a'], ['Real Campinho FC', 'Brasil', '#d8282e'], ['Atlético da Vila', 'Brasil', '#2a4aa0']] },
  { nivel: 1, ovr: 52, salario: 60000, nomes: [['União FC', 'Brasil', '#1a1a1a'], ['Esporte Clube Litoral', 'Brasil', '#3ad0c0'], ['Ferroviário da Serra', 'Brasil', '#c0302a']] },
  { nivel: 2, ovr: 62, salario: 220000, nomes: [['Imperial FC', 'Brasil', '#6a3ad9'], ['Estrela do Norte', 'Brasil', '#e0a030'], ['Galo de Prata', 'Brasil', '#8a8a9a']] },
  { nivel: 3, ovr: 70, salario: 700000, nomes: [['Deportivo Andino', 'Argentina', '#7ab8ff'], ['Club Celeste', 'Uruguai', '#5ac8ff'], ['Atlético Cafetero', 'Colômbia', '#f8d838']] },
  { nivel: 4, ovr: 78, salario: 2400000, nomes: [['Real Ibérico', 'Espanha', '#f4f4f8'], ['Albion United', 'Inglaterra', '#c0302a'], ['Calcio Romano', 'Itália', '#1a3a8a'], ['Kraft München', 'Alemanha', '#d02a2a'], ['Paris Étoile', 'França', '#1a2a6a'], ['Porto Atlântico', 'Portugal', '#2a8a4a']] },
];
const AG_MARCAS = ['Chuteiras Foguete', 'Refri Gol', 'Isotônico Raio', 'Tênis Pulo Alto', 'Banco Bola de Ouro', 'Celular Drible', 'Lanche do Craque'];
const AG_NOMES_M = ['João', 'Pedrinho', 'Davi', 'Caio', 'Enzo', 'Lucas', 'Matheus', 'Rafa', 'Gabriel', 'Thiago', 'Bruninho', 'Kauã', 'Miguel', 'Arthur', 'Heitor', 'Juan', 'Mateo', 'Diego', 'Nico', 'Luca'];
const AG_NOMES_F = ['Ana', 'Bia', 'Duda', 'Lara', 'Sofia', 'Júlia', 'Manu', 'Clara', 'Luana', 'Isa', 'Yasmin', 'Valentina', 'Lívia', 'Malu', 'Mel', 'Camila', 'Lucía', 'Martina'];
const AG_SOBRENOMES = ['Silva', 'Souza', 'Santos', 'Oliveira', 'Pereira', 'Costa', 'Rocha', 'Almeida', 'Lima', 'Gomes', 'Ribeiro', 'Martins', 'Barbosa', 'Moreira', 'Fernández', 'Rodríguez', 'Pérez', 'Torres'];

/* ---------- dados ---------- */
const agRnd = (a, b) => a + Math.random() * (b - a), agRi = (a, b) => Math.floor(agRnd(a, b + 1)), agPega = l => l[(Math.random() * l.length) | 0];
const agFmt = n => fmt(Math.round(n));
// zerou a Carreira (campeão da liga do topo, a Liga da Coroa) e o Clube (campeão do Mundial Interclubes)?
// v325: também vale chegar à fama máxima (Lenda Mundial 3.000/3.000, "o topo do mundo") — o dono chegou lá e esperava a Agência
function agZerouCarreira() { try { const c = G.save.carreira; return !!(c && ((c.fama || 0) >= CARR_FAMA_MAX || (c.titulosLiga || []).some(t => t.liga === CARR_TIERS[CARR_TIER_MAX].liga))); } catch (e) { return false; } }
function agZerouClube() { return !!(G.save && G.save.flags && G.save.flags.campeao_mundial_interclubes); }
function agLiberada() { const s = G.save; return !!s && ((s.nivel || 1) >= AG_NIVEL || (agZerouCarreira() && agZerouClube())); }
function agDados() {
  const s = G.save; if (!s) return null;
  if (!s.agencia || typeof s.agencia !== 'object') s.agencia = null;
  const a = s.agencia;
  if (a && !a.marcos) { // v333: agências antigas — conta o que já foi feito (e mantém o nível que já tinham)
    const pros = a.jogadores.filter(j => j.fase === 'pro').length;
    a.marcos = { assinados: a.jogadores.length + (a.hall || []).length, aprovados: a.jogadores.filter(j => j.fase === 'base' || j.fase === 'pro').length, contratos: pros, transf: Object.keys(a.paises || {}).length, fora: Object.keys(a.paises || {}).filter(p => p !== 'Brasil').length, patroc: 0, bons: 0 };
    if (a.nivel == null) { let k = 0; for (let i = 0; i < AG_REP.length; i++) if (a.rep >= AG_REP[i][0]) k = i; a.nivel = k; }
  }
  return a;
}
// as metas do próximo nível: [[texto, atual, alvo, feito]] (a 1ª é sempre a dos pontos de reputação)
function agMetas(a, k) {
  a = a || agDados(); k = k == null ? agNivelRep(a) + 1 : k; if (!AG_METAS[k]) return [];
  return [[`Junte ${fmt(AG_REP[k][0])} pontos de reputação`, a => [a.rep, AG_REP[k][0]]], ...AG_METAS[k]].map(([t, f]) => { const [v, alvo] = f(a); return [t, Math.min(v, alvo), alvo, v >= alvo]; });
}
function agMarco(chave, n = 1) { const a = agDados(); if (!a) return; a.marcos[chave] = (a.marcos[chave] || 0) + n; agConfereNivel(); }
// o que cada nível libera (para mostrar na hora de subir e na lista de metas)
function agLibera(k) {
  const l = AG_REGIOES.filter(r => r.rep === k).map(r => `região ${r.nome}`).concat(AG_OLHEIROS.filter(o => o[2] === k).map(o => `${o[1]} para contratar`));
  l.push(`👤 até ${agMaxJogadores(null, k)} jogadores`); return l.join(' · ');
}
function agConfereNivel() {
  const a = agDados(); if (!a) return;
  while (a.nivel + 1 < AG_REP.length && agMetas(a).every(m => m[3])) {
    const k = ++a.nivel;
    banner('⭐ ' + AG_REP[k][1].toUpperCase(), 'Sua agência subiu de nível!'); som('nivel');
    log(`🕴️ Agência: agora você é ${AG_REP[k][1]}! Liberado: ${agLibera(k)}.`, 'l-lvl');
    agEvento({ tipo: 'nivel', txt: `🎖️ SUA AGÊNCIA SUBIU DE NÍVEL: ${AG_REP[k][2]} ${AG_REP[k][1]}! Liberado: ${agLibera(k)}.` });
    agFila('escritorio', `🎖️ ${AG_REP[k][1].toUpperCase()}!`, `Liberado: ${agLibera(k)}. O escritório na Vila ganhou um troféu novo!`, 'confete');
    if (typeof agDecoraEscritorio === 'function') agDecoraEscritorio();
  }
}
function agCria() {
  const s = G.save; const nome = (s.nome || 'Lenda').split(' ')[0].toUpperCase() + ' SPORTS';
  s.agencia = { nome, rep: 0, nivel: 0, olheiros: { base: 1 }, missoes: [], achados: [], jogadores: [], eventos: [], titulos: {}, totais: { transf: 0, comissao: 0, descobertas: 0, vendaMax: 0 },
    marcos: { assinados: 0, aprovados: 0, contratos: 0, transf: 0, fora: 0, patroc: 0, bons: 0 }, ultimo: Date.now(), seq: 1 };
  agEvento({ tipo: 'boasvindas', txt: '☀️ Bem-vindo(a) à sua agência! Comece pequeno: mande o seu Olheiro de base procurar talentos no Bairro (aba 🔎 Talentos) e converse com as famílias. O escritório fica na Vila do Campinho, na rua de cima.' });
  return s.agencia;
}
function agNivelRep(a) { a = a || agDados(); return a ? a.nivel || 0 : 0; }
function agRepTxt(a) { const k = agNivelRep(a); return `${AG_REP[k][2] || '☆'} ${AG_REP[k][1]}`; }
function agMaxJogadores(a, k) { return [2, 3, 5, 7, 9, 12][k != null ? k : agNivelRep(a)] || 12; } // v333: começo modesto
function agGanhaRep(n, motivo) { const a = agDados(); a.rep = Math.round(a.rep + n); agConfereNivel(); }
// valor de mercado (tostões): cresce muito com o overall; jovem com potencial vale mais
function agValor(j) {
  const base = 50000 * Math.exp((j.ovr - 45) / 7);
  const idade = j.idade < 21 ? 1 + (21 - j.idade) * 0.08 : j.idade > 29 ? Math.max(0.3, 1 - (j.idade - 29) * 0.12) : 1;
  const potEst = j.potV ? (j.potV[0] + j.potV[1]) / 2 : j.pot, pot = 1 + Math.max(0, potEst - j.ovr) * 0.02; // o mercado enxerga o potencial ESTIMADO
  return Math.round(base * idade * pot * (1 + (j.fama || 0) / 200));
}
function agOvr(j) {
  const p = AG_POS[j.pos][1], peso = { vel: 1, fin: 1, dri: 1, vis: 1, def: 1 };
  for (const k in p) peso[k] += Math.max(0, p[k]) / 4;
  let soma = 0, tot = 0; for (const k in peso) { soma += j.atr[k] * peso[k]; tot += peso[k]; }
  return Math.round(soma / tot);
}
function agAtrDe(ovr, pos) { const p = AG_POS[pos][1], atr = {}; for (const k of Object.keys(AG_ATR)) atr[k] = clamp(Math.round(ovr + (p[k] || 0) + agRnd(-4, 4)), 10, 99); return atr; }
function agNovoTalento(reg, ol) {
  const a = agDados(); const menina = Math.random() < 0.35, pos = agPega(Object.keys(AG_POS));
  const peleList = ['pele-clara', 'pele-media', 'pele-morena', 'pele-negra', 'pele-retinta'];
  const cabs = menina ? CABELOS_F : CABELOS_M;
  // potencial de verdade (escondido): a região e o olheiro mudam a sorte; o lendário às vezes acha um FENÔMENO
  let pot = agRnd(reg.pot[0], reg.pot[1]) + ol[6] * agRnd(0.3, 1.2);
  if (Math.random() < 0.06 + ol[6] * 0.01) pot += agRnd(4, 9);            // uma joia
  if (ol[0] === 'lendario' && Math.random() < 0.05) pot = agRnd(95, 99);  // fenômeno
  pot = clamp(Math.round(pot), 45, 99);
  const idade = agRi(14, 16), ovr0 = clamp(Math.round(agRnd(reg.ovr[0], reg.ovr[1])), 25, 60);
  const j = { id: 'ag' + (a.seq++), nome: `${agPega(menina ? AG_NOMES_F : AG_NOMES_M)} ${agPega(AG_SOBRENOMES)}`, menina, pos, idade, pot, atr: agAtrDe(ovr0, pos), ovr: 0,
    pers: agPega(Object.keys(AG_PERS)), regiao: reg.id, fase: 'achado', moral: 70, fama: 0, clube: null, salario: 0, comissao: 0, contratoAte: 0, parado: 0, hist: [],
    look: { tipo: 'humano', corpo: menina ? 'f' : 'm', alt: 1.55, pele: agPega(peleList), cabelo: agPega(cabs), corCabelo: agPega(['preto', 'castanho', 'loiro', 'ruivo', 'preto']), roupa: 'roupa-futebol', corRoupa: '#f4f4f8', baixo: 'baixo-shorts' } };
  j.ovr = agOvr(j);
  const larg = ol[7]; const meio = pot + agRnd(-larg * 0.6, larg * 0.6); j.potV = [clamp(Math.round(meio - larg / 2), 40, 99), clamp(Math.round(meio + larg / 2), 40, 99)];
  return j;
}
function agHist(j, txt) { j.hist.unshift(`T${G.save.agencia.nPer || 0}: ${txt}`); j.hist = j.hist.slice(0, 6); }

/* ---------- acontecimentos ---------- */
function agEvento(ev) { const a = agDados(); if (!a) return; ev.id = 'e' + (a.seq++); ev.quando = Date.now(); a.eventos.unshift(ev); a.eventos = a.eventos.slice(0, 24); agAvisa(); }
function agAvisa() { try { const a = agDados(); const n = a ? a.eventos.filter(e => !e.visto).length : 0; for (const b of document.querySelectorAll('.btn-agencia')) b.dataset.n = n || ''; const tb = document.getElementById('tbAgencia'); if (tb) tb.hidden = !(G.save && agLiberada()); } catch (e) { } }
const agJog = id => agDados().jogadores.find(j => j.id === id);
function agClube(nivel) { const c = AG_CLUBES[clamp(nivel, 0, 4)]; const [nome, pais, cor] = agPega(c.nomes); return { nome, pais, cor, nivel: c.nivel }; }

/* ---------- o relógio: períodos e missões ---------- */
function agTick() {
  const s = G.save, a = agDados(); if (!s || !a || !agLiberada()) return;
  const agora = Date.now();
  // v334: com o Modo Treino ligado a agência fica PAUSADA (pedido do dono): o relógio dela e as viagens dos olheiros
  // são empurrados para frente pelo tempo pausado — inclusive o tempo com o jogo fechado no Modo Treino
  if (s.treinoOn) { const d = agora - (a.pausaUlt || agora); if (d > 0) { a.ultimo += d; for (const m of a.missoes) { m.fim += d; if (m.ini) m.ini += d; } } a.pausaUlt = agora; return; }
  a.pausaUlt = null;
  // missões dos olheiros que terminaram
  for (const m of a.missoes.slice()) if (agora >= m.fim) {
    a.missoes.splice(a.missoes.indexOf(m), 1);
    const reg = AG_REGIOES.find(r => r.id === m.regiao), ol = AG_OLHEIROS.find(o => o[0] === m.olheiro);
    const n = agRi(1, ol[0] === 'base' ? 2 : 3), novos = Array.from({ length: n }, () => agNovoTalento(reg, ol));
    a.achados.push(...novos); a.achados = a.achados.slice(-10);
    a.totais.descobertas += n; agGanhaRep(n * 4, 'descoberta');
    const melhor = novos.reduce((x, y) => (y.potV[1] > x.potV[1] ? y : x));
    agEvento({ tipo: 'achado', txt: `🔎 ${ol[1]} voltou de ${reg.nome}: ${n} talento(s)! O melhor: ${melhor.nome}, ${melhor.idade} anos, ${AG_POS[melhor.pos][0]}, potencial estimado ${melhor.potV[0]}–${melhor.potV[1]}.` });
    if (melhor.potV[1] >= 88) agFila('descoberta', '💎 JOIA ENCONTRADA!', `${ol[1]} viu ${melhor.nome} (${melhor.idade} anos) jogando em ${reg.nome}: potencial estimado ${melhor.potV[0]}–${melhor.potV[1]}! Corra para a aba 🔎 Talentos.`, 'confete');
    agTitulos();
  }
  // períodos (3 meses cada)
  let n = Math.floor((agora - a.ultimo) / AG_PERIODO); if (n <= 0) return;
  n = Math.min(n, AG_MAX_ATRASO); a.ultimo = agora - ((agora - a.ultimo) % AG_PERIODO);
  for (let k = 0; k < n; k++) agPeriodo();
  try { salvar(); } catch (e) { }
}
function agPeriodo() {
  const a = agDados(); a.nPer = (a.nPer || 0) + 1;
  // talentos achados e não contratados vão embora com o tempo
  for (const j of a.achados) j.espera = (j.espera || 0) + 1;
  const foram = a.achados.filter(j => j.espera > 6); if (foram.length) a.achados = a.achados.filter(j => j.espera <= 6);
  for (const j of a.jogadores.slice()) agPeriodoJogador(j);
}
function agPeriodoJogador(j) {
  const a = agDados(), P = AG_PERS[j.pers];
  j.idade = Math.round((j.idade + 0.25) * 100) / 100;
  // evolução: corre atrás do potencial (mais rápido jovem, no lugar certo e com a cabeça boa)
  const amb = { achado: 1, treino: 1, escolinha: 1.3, base: 1.4, pro: 1.15 }[j.fase] || 1;
  const moral = 0.6 + j.moral / 250, idade = j.idade < 18 ? 1.2 : j.idade < 22 ? 1 : j.idade < 25 ? 0.5 : j.idade < 30 ? 0.1 : -0.6;
  const antes = j.ovr;
  if (j.parado > 0) j.parado--;
  else {
    const passo = idade >= 0 ? Math.max(0, (j.pot - j.ovr)) * 0.055 * P.cresce * amb * moral * idade + agRnd(-0.6, 1.2) : idade * agRnd(0.5, 1.5);
    // cada atributo tem o seu teto pelo perfil da posição (atacante não vira zagueiro): potencial + ajuste da posição
    const k = Object.keys(AG_ATR), perfil = AG_POS[j.pos][1], teto = at => clamp(j.pot + (perfil[at] || 0) + 3, 20, 99);
    const sobe = (at, v) => { j.atr[at] = passo < 0 ? clamp(Math.round(j.atr[at] + v), 10, 99) : Math.max(j.atr[at], Math.min(teto(at), Math.round(j.atr[at] + v))); };
    for (let i = 0; i < 2; i++) sobe(agPega(k), passo * agRnd(0.6, 1.6));
    for (const at of k) if (Math.random() < 0.4) sobe(at, passo * agRnd(0.2, 0.9));
    j.ovr = Math.min(j.pot, agOvr(j));
  }
  j.ovrMax = Math.max(j.ovrMax || 0, j.ovr);
  if (j.ovr > antes + 1) { agHist(j, `evoluiu +${j.ovr - antes} (overall ${j.ovr})`); if (j.ovr - antes >= 3) agEvento({ tipo: 'evolucao', jog: j.id, txt: `📈 ${j.nome} evoluiu +${j.ovr - antes}! Overall agora: ${j.ovr}.` }); }
  // salário e comissão do período
  if (j.fase === 'pro' || j.fase === 'base') { const c = Math.round(j.salario * 3 * j.comissao / 100); if (c > 0) { G.save.ouro += c; a.totais.comissao += c; } }
  if (j.fase === 'escolinha') j.escolinha = (j.escolinha || 0) - 1, j.escolinha <= 0 && (j.fase = 'treino', agHist(j, 'terminou a temporada na escolinha'));
  // fama: jogando vai aparecendo
  if (j.fase === 'pro') j.fama = clamp((j.fama || 0) + Math.max(0, j.ovr - AG_CLUBES[j.clube.nivel].ovr) * 0.4 + agRnd(0, 2), 0, 100);
  // contrato acabando: o clube quer renovar (ou ele fica livre)
  if (j.fase === 'pro' && a.nPer >= j.contratoAte && !a.eventos.some(e => e.jog === j.id && e.tipo === 'contrato' && !e.feito)) { agPropostaContrato(j, j.clube, true); }
  // aposentadoria
  if (j.idade >= 35) { agHall(j, 'aposentou-se'); a.jogadores.splice(a.jogadores.indexOf(j), 1); agEvento({ tipo: 'info', txt: `👋 ${j.nome} pendurou as chuteiras aos 35 anos. Obrigado por tudo, craque!` }); return; }
  // acontecimentos (um de cada vez por jogador)
  if (a.eventos.some(e => e.jog === j.id && !e.feito && e.acoes)) return;
  const r = Math.random();
  if (r < 0.12 * P.prob) agProblema(j);
  else if (j.fase === 'pro' && !j.meuClube && r < 0.12 * P.prob + 0.18 && j.ovr >= AG_CLUBES[Math.min(4, j.clube.nivel + 1)].ovr - 3 && !(j.pers === 'leal' && Math.random() < 0.6)) agPropostaTransferencia(j);
  else if (j.fase === 'pro' && (j.fama || 0) > 25 && r > 0.85) agPatrocinio(j);
  else if (j.fase === 'pro' && r > 0.8 && j.ovr > AG_CLUBES[j.clube.nivel].ovr + 4) { j.fama += 5; agEvento({ tipo: 'info', jog: j.id, txt: `⭐ ${j.nome} foi o destaque da rodada pelo ${j.clube.nome}! A fama dele cresceu.` }); }
  else if ((j.fase === 'treino' || j.fase === 'escolinha') && j.idade >= 15.5 && r > 0.75) agEvento({ tipo: 'decisao', jog: j.id, txt: `🧒 ${j.nome} (${Math.floor(j.idade)} anos, overall ${j.ovr}) está pronto para o próximo passo. Que tal um TESTE num clube? (aba 👤 Meus jogadores)` });
}
// problemas pessoais: v333 viraram CONVERSAS (agencia_escritorio.js, AG_CONVERSAS) — cada uma com 2 etapas de escolhas,
// e o resultado depende da personalidade do jogador. (Eventos antigos com botões continuam funcionando abaixo.)
function agProblema(j) {
  const tipos = Object.keys(AG_CONVERSAS).filter(k => AG_CONVERSAS[k].quando(j)), k = agPega(tipos);
  agEvento({ tipo: 'problema', jog: j.id, conv: k, txt: AG_CONVERSAS[k].txt(j), acoes: 'conversa' });
}
const AG_FNS = new Map(); // (as escolhas dos problemas não vão para o save: são refeitas se o jogo recarregar)
{
  const _evento = agEvento;
  agEvento = function (ev) { const fns = ev._fns; delete ev._fns; _evento(ev); if (fns) AG_FNS.set(ev.id, fns); };
}
function agResolveProblema(ev, k) {
  const j = agJog(ev.jog), [nome, custo] = ev.acoes[k], s = G.save;
  if (custo && s.ouro < custo) { log('Tostões insuficientes.', 'l-dano'); return; }
  if (custo) s.ouro -= custo;
  const fns = AG_FNS.get(ev.id); let msg;
  if (fns && j) msg = fns[k](); else if (j) { // recarregou o jogo: decisão padrão sensata
    if (custo) { j.moral = Math.min(100, j.moral + 10); msg = 'Resolvido.'; } else { j.moral -= 10; msg = 'Ele ficou chateado.'; }
  }
  if (j) { j.moral = clamp(j.moral, 0, 100); agHist(j, `${nome.toLowerCase()} — ${msg}`); }
  ev.feito = true; ev.resultado = `${nome}: ${msg || 'ok'}`; log(`🕴️ ${ev.resultado}`, 'l-xp'); salvar();
}

/* ---------- contratos, testes, transferências, patrocínios ---------- */
function agClubesParaTeste(j) { // 3 clubes: um fácil, um médio e um difícil
  const nv = clamp(Math.floor((j.ovr + (j.pot - j.ovr) * 0.35 - 36) / 9), 0, 3);
  return [agClube(Math.max(0, nv - 1)), agClube(nv), agClube(nv + 1)].map(c => ({ ...c, chance: agChanceTeste(j, c.nivel) }));
}
function agChanceTeste(j, nivel) { const efetivo = j.ovr + (j.pot - j.ovr) * 0.3; /* os clubes também enxergam um pouco do potencial */ return clamp(Math.round(50 + (efetivo - AG_CLUBES[nivel].ovr) * 4), 5, 95); }
function agFazTeste(j, c) {
  const a = agDados(); if (j.testePer === a.nPer) return; j.testePer = a.nPer;
  const ok = Math.random() * 100 < c.chance;
  if (ok) { j.fase = 'base'; j.clube = { nome: c.nome, pais: c.pais, cor: c.cor, nivel: c.nivel }; j.look.corRoupa = c.cor; j.salario = Math.round(AG_CLUBES[c.nivel].salario * 0.25); j.comissao = 10; j.contratoAte = agDados().nPer + 8;
    agHist(j, `aprovado no teste do ${c.nome}!`); agGanhaRep(15 + c.nivel * 10); agMarco('aprovados'); banner('✅ APROVADO!', `${j.nome} → ${c.nome}`); som('nivel'); }
  else { agHist(j, `recusado no teste do ${c.nome}`); j.moral = Math.max(0, j.moral - 8); som('erro'); }
  agEvento({ tipo: 'teste', jog: j.id, txt: ok ? `🔔 RESULTADO DO TESTE: ${j.nome} foi APROVADO(A) no ${c.nome}! Vai jogar na base do clube.` : `🔔 RESULTADO DO TESTE: ${j.nome} foi recusado(a) pelo ${c.nome}. Dá para tentar outro clube.`, feito: true });
  salvar();
}
function agPropostaContrato(j, clube, renova) {
  const c = AG_CLUBES[clube.nivel]; const ganan = j.pers === 'ganancioso' ? 1.2 : 1;
  const salario = Math.round(c.salario * (0.6 + Math.max(0, j.ovr - c.ovr) * 0.06 + (j.fama || 0) / 300) * agRnd(0.85, 1.1)), anos = agRi(2, 4), com = agRi(7, 10);
  agEvento({ tipo: 'contrato', jog: j.id, clube, renova, txt: `📑 ${renova ? 'RENOVAÇÃO' : 'PRIMEIRO CONTRATO PROFISSIONAL'}: o ${clube.nome} oferece ${agFmt(salario)} tostões por mês, ${anos} anos. Sua comissão: ${com}%.`,
    oferta: { salario, anos, com, exige: ganan }, acoes: true });
}
function agPropostaTransferencia(j) {
  const nv = Math.min(4, j.clube.nivel + (Math.random() < 0.7 ? 1 : 0)), clube = agClube(nv); if (clube.nome === j.clube.nome) return;
  const valor = Math.round(agValor(j) * agRnd(0.75, 1.05));
  agEvento({ tipo: 'transferencia', jog: j.id, clube, txt: `📩 NOVA PROPOSTA: o ${clube.nome} (${clube.pais}) quer contratar ${j.nome}. Oferta: ${agFmt(valor)} tostões.`, oferta: { valor }, acoes: true });
}
function agPatrocinio(j) {
  const valor = Math.round(agValor(j) * agRnd(0.03, 0.06)), marca = agPega(AG_MARCAS);
  agEvento({ tipo: 'patrocinio', jog: j.id, txt: `📣 PATROCINADOR INTERESSADO: "${marca}" quer patrocinar ${j.nome} por 1 ano. Oferta: ${agFmt(valor)} tostões (sua parte: 20%).`, oferta: { valor, marca }, acoes: true });
}
// negociar: pede mais e o outro lado aceita ou não (quanto mais você pede, menor a chance)
function agNegocia(ev, pedido) {
  const j = agJog(ev.jog); if (!j) { ev.feito = true; return; }
  const o = ev.oferta; let txt;
  if (ev.tipo === 'contrato') {
    const exagero = (pedido.salario / o.salario - 1) * 2.2 + (pedido.com - o.com) * 0.08 + (pedido.anos - o.anos) * 0.05;
    const ok = pedido.salario <= o.salario && pedido.com <= o.com ? true : Math.random() > clamp(exagero, 0.05, 0.95);
    if (!ok) { ev.feito = true; txt = `❌ O ${ev.clube.nome} recusou a contraproposta.`; if (!ev.renova) j.moral -= 5; else { j.fase = 'treino'; j.clube = null; j.salario = 0; agHist(j, 'ficou sem clube (não renovou)'); } }
    else agFechaContrato(j, ev, pedido), txt = `🤝 ACORDO FECHADO! ${j.nome} assinou com o ${ev.clube.nome}: ${agFmt(pedido.salario)} por mês, ${pedido.anos} anos, ${pedido.com}% de comissão.`;
  } else if (ev.tipo === 'transferencia') {
    const pede = pedido.valor / o.valor - 1, ok = Math.random() > clamp(pede * 1.6, 0.05, 0.95);
    if (ok) { agVende(j, ev, pedido.valor); txt = null; } else { ev.feito = true; txt = `❌ O ${ev.clube.nome} desistiu: achou caro demais.`; }
  } else if (ev.tipo === 'patrocinio') {
    const pede = pedido.valor / o.valor - 1, ok = Math.random() > clamp(pede * 1.4, 0.05, 0.95);
    if (ok) { agPatrocinioFecha(j, ev, pedido.valor); txt = null; } else { ev.feito = true; txt = `❌ A marca ${o.marca} desistiu do patrocínio.`; }
  }
  if (txt) { ev.resultado = txt; log('🕴️ ' + txt, 'l-sis'); }
  salvar();
}
function agFechaContrato(j, ev, p) {
  const a = agDados(); j.fase = 'pro'; j.clube = ev.clube; j.look.corRoupa = ev.clube.cor; j.salario = p.salario; j.comissao = p.com; j.contratoAte = a.nPer + p.anos * 4;
  ev.feito = true; ev.resultado = `🤝 Contrato assinado: ${agFmt(p.salario)}/mês, ${p.anos} anos, ${p.com}% para você.`;
  agHist(j, `${ev.renova ? 'renovou' : 'assinou'} com o ${ev.clube.nome}`); agGanhaRep(ev.renova ? 10 : 30 + ev.clube.nivel * 15); if (!ev.renova) agMarco('contratos'); som('moeda'); agTitulos();
}
function agVende(j, ev, valor) {
  const a = agDados(), com = Math.round(valor * Math.max(5, j.comissao || 10) / 100);
  G.save.ouro += com; a.totais.transf += valor; a.totais.comissao += com; a.totais.vendaMax = Math.max(a.totais.vendaMax, valor); j.vendaMax = Math.max(j.vendaMax || 0, valor);
  j.clube = ev.clube; j.look.corRoupa = ev.clube.cor; j.fama = (j.fama || 0) + 10; j.salario = Math.round(AG_CLUBES[ev.clube.nivel].salario * (0.8 + Math.max(0, j.ovr - AG_CLUBES[ev.clube.nivel].ovr) * 0.05)); j.contratoAte = a.nPer + 12;
  (a.paises = a.paises || {})[ev.clube.pais] = 1;
  ev.feito = true; ev.resultado = `💼 TRANSFERÊNCIA FECHADA: ${j.nome} → ${ev.clube.nome} por ${agFmt(valor)}. Sua comissão: 💰 ${agFmt(com)} tostões!`;
  agHist(j, `vendido ao ${ev.clube.nome} por ${agFmt(valor)}`); agGanhaRep(20 + valor / 1e6 * 1.5); agMarco('transf'); if (ev.clube.pais !== 'Brasil') agMarco('fora'); banner('💼 TRANSFERÊNCIA!', `${j.nome} → ${ev.clube.nome}`); som('moeda'); log('🕴️ ' + ev.resultado, 'l-loot'); agTitulos();
}
function agPatrocinioFecha(j, ev, valor) {
  const com = Math.round(valor * 0.2); G.save.ouro += com; agDados().totais.comissao += com; j.fama = (j.fama || 0) + 4;
  ev.feito = true; ev.resultado = `📣 Patrocínio fechado com ${ev.oferta.marca}: ${agFmt(valor)}. Sua parte: 💰 ${agFmt(com)} tostões.`; agHist(j, `patrocínio da ${ev.oferta.marca}`); agGanhaRep(8); agMarco('patroc'); som('moeda'); log('🕴️ ' + ev.resultado, 'l-loot');
}

/* ---------- títulos (o objetivo final não é "ficar rico") ---------- */
const AG_TITULOS = [
  ['cacador', '🥉 Caçador de Talentos', 'Descubra 10 jogadores.', a => a.totais.descobertas >= 10],
  ['empresario', '🥈 Empresário', 'Tenha 5 jogadores profissionais.', a => a.jogadores.filter(j => j.fase === 'pro').length >= 5],
  ['fifa', '🥇 Agente Internacional', 'Tenha jogadores vendidos para clubes de 5 países.', a => Object.keys(a.paises || {}).length >= 5],
  ['superagente', '👑 Superagente', 'Venda um jogador por 100 milhões de tostões.', a => a.totais.vendaMax >= 100000000],
  ['lendas', '🌟 Descobridor de Lendas', 'Tenha um jogador que chegue a overall 95.', a => a.jogadores.some(j => j.ovr >= 95)],
];
function agTitulos() {
  const a = agDados(); for (const [id, nome, , ok] of AG_TITULOS) if (!a.titulos[id] && ok(a)) { a.titulos[id] = Date.now(); if (id === 'superagente') agFila('superagente', '👑 SUPERAGENTE!', 'Sua agência chegou ao topo do mundo do futebol. Os craques que você descobriu vieram aplaudir!', 'confete'); banner(nome, 'Título de empresário conquistado!'); som('nivel'); log(`🏆 Título da Agência: ${nome}!`, 'l-lvl'); agGanhaRep(150); }
}

/* ---------- arte e animações (v324: 9 créditos do Higgsfield) ----------
   Cenas em tela cheia nos grandes momentos (com confete, moedas, flashes ou carimbo), olheiros e regiões desenhados,
   ícones dos acontecimentos, medalhas dos títulos, o olheiro "viajando" até a região e o garoto da embaixadinha.
   Conteúdo novo: 📸 Álbum da Agência (as cenas que você já viveu) e 🏛️ Hall da Fama (quem passou pela sua agência). */
const agImg = (id, cls) => el('img', { src: `a/${id}.webp`, class: cls || '', alt: '', draggable: 'false' });
const AG_OL_ARTE = { base: 'ag_ol_base', especialista: 'ag_ol_especialista', internacional: 'ag_ol_internacional', lendario: 'ag_ol_lendario' };
const AG_REG_ARTE = { bairro: 'ag_r_bairro', estado: 'ag_r_estado', brasil: 'ag_r_brasil', america: 'ag_r_america', europa: 'ag_r_europa' };
const AG_EV_ARTE = { achado: 'ag_ev_achado', teste: 'ag_ev_teste', decisao: 'ag_ev_teste', contrato: 'ag_ev_contrato', transferencia: 'ag_ev_transferencia', patrocinio: 'ag_ev_patrocinio', problema: 'ag_ev_problema' };
const AG_TIT_ARTE = { cacador: 'ag_t_cacador', empresario: 'ag_t_empresario', fifa: 'ag_t_fifa', superagente: 'ag_t_superagente', lendas: 'ag_t_lendas' };
// [id da cena, legenda no álbum, como liberar]
const AG_ALBUM = [
  ['escritorio', 'A agência abriu as portas', 'Abra a sua agência.'],
  ['descoberta', 'Uma joia na várzea', 'Um olheiro encontra um talento com potencial estimado de 88 ou mais.'],
  ['teste', 'Aprovado no teste!', 'Um jogador seu passa num teste de clube.'],
  ['contrato', 'O primeiro contrato', 'Um jogador seu assina o primeiro contrato profissional.'],
  ['transferencia', 'A grande transferência', 'Feche uma transferência.'],
  ['patrocinio', 'Estrela da propaganda', 'Feche um patrocínio.'],
  ['saudade', 'A família chegou!', 'Ajude um jogador com saudade de casa.'],
  ['superagente', 'O Superagente', 'Conquiste o título de Superagente.'],
];
function agEmbaixadinha(alt = 110) { const d = el('div', { class: 'ag-embx', role: 'img', 'aria-label': 'Garoto fazendo embaixadinha' }); d.style.setProperty('--alt', alt + 'px'); return d; }
// fila de comemorações que aconteceram longe da tela (o olheiro voltou com uma joia, título conquistado...)
function agFila(cena, titulo, texto, efeito) { const a = agDados(); if (!a) return; (a.fila = a.fila || []).push([cena, titulo, texto, efeito]); a.fila = a.fila.slice(-3); }
function agCelebra(cena, titulo, texto, efeito = 'confete', j = null) {
  const a = agDados(); if (a) { a.album = a.album || {}; if (!a.album[cena]) a.album[cena] = Date.now(); }
  document.querySelectorAll('.ag-show').forEach(x => x.remove());
  const ov = el('div', { class: 'ag-show ag-ef-' + efeito, role: 'dialog', 'aria-label': titulo });
  const fecha = () => { ov.classList.add('sai'); setTimeout(() => ov.remove(), 260); document.removeEventListener('keydown', tecla, true); };
  const tecla = e => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); fecha(); } };
  ov.addEventListener('click', fecha); document.addEventListener('keydown', tecla, true);
  const quadro = el('div', { class: 'ag-show-quadro' }, el('div', { class: 'ag-show-moldura' }, agImg('cap_ag_' + cena, 'ag-show-img')),
    el('div', { class: 'ag-show-txt' }, el('b', {}, titulo), texto ? el('p', {}, texto) : '', el('small', {}, 'toque para continuar')));
  ov.append(quadro);
  if (efeito === 'carimbo') quadro.append(el('div', { class: 'ag-carimbo' }, 'APROVADO!'));
  if (j && j.look) quadro.append(el('div', { class: 'ag-show-ret' }, agRetrato(j, 104), el('b', {}, j.nome.split(' ')[0]))); // o craque de verdade, num medalhão
  const n = efeito === 'flash' ? 14 : 34;
  for (let i = 0; i < n; i++) {
    const p = el('i', { class: 'ag-p' }); p.style.left = (Math.random() * 100) + '%'; p.style.animationDelay = (Math.random() * (efeito === 'flash' ? 3 : 1.6)).toFixed(2) + 's';
    p.style.animationDuration = (efeito === 'flash' ? agRnd(0.5, 0.9) : agRnd(2.2, 3.6)).toFixed(2) + 's';
    if (efeito === 'flash') p.style.top = (Math.random() * 80) + '%';
    if (efeito === 'confete' || efeito === 'carimbo') p.style.background = agPega(['#ffd23f', '#ff5a5f', '#3ad0c0', '#6a8aff', '#7ad84a', '#ff9a3a']);
    ov.append(p);
  }
  document.body.append(ov); try { som(efeito === 'moedas' ? 'moeda' : 'nivel'); } catch (e) { }
  return ov;
}
function agMostraFila() { const a = agDados(); if (!a || !a.fila || !a.fila.length) return; const c = a.fila.shift(); setTimeout(() => agCelebra(...c), 350); }
function agHall(j, como) {
  const a = agDados(); a.hall = a.hall || [];
  if (a.hall.some(h => h.id === j.id)) return;
  a.hall.unshift({ id: j.id, nome: j.nome, pos: j.pos, ovr: Math.max(j.ovr, j.ovrMax || 0), venda: j.vendaMax || 0, clube: j.clube ? j.clube.nome : '', como, look: j.look });
  a.hall.sort((x, y) => y.ovr - x.ovr || y.venda - x.venda); a.hall = a.hall.slice(0, 12);
}

/* ---------- telas ---------- */
let AG_ABA = 'hoje';
function agRetrato(j, tam = 64) {
  const c = mkCanvas(tam * 0.8, tam); c.className = 'ag-ret';
  [0, 400, 1500].forEach(ms => setTimeout(() => { try { pintaAparencia(c, j.look, { inteiro: true }); } catch (e) { } }, ms));
  return c;
}
const agEstrelasPot = j => j.potV ? `Potencial estimado: ${j.potV[0]}–${j.potV[1]}` : '';
const agFaseTxt = j => ({ achado: 'Descoberto', treino: 'Treinando', escolinha: '🏫 Na escolinha', base: `🧒 Base do ${j.clube && j.clube.nome}`, pro: `⚽ ${j.clube && j.clube.nome} (${j.clube && j.clube.pais})` }[j.fase] || j.fase);
function agCabecalho() {
  const a = agDados(); const prox = Math.max(0, AG_PERIODO - (Date.now() - a.ultimo));
  return el('div', { class: 'ag-cab' },
    el('div', { class: 'ag-cab-id' }, agImg('ag_brasao', 'ag-brasao'), el('div', {}, el('b', { class: 'ag-nome' }, a.nome), el('small', {}, `${agRepTxt()} · ${fmt(a.rep)} pts de reputação`))),
    el('div', { class: 'ag-num' }, el('span', {}, `👤 ${a.jogadores.length}/${agMaxJogadores()} jogadores`), el('span', {}, `💼 ${agFmt(a.totais.transf)} em transferências`), el('span', {}, `💰 ${agFmt(a.totais.comissao)} de comissões`), el('span', {}, `🔎 ${a.totais.descobertas} descobertos`), el('span', { title: 'Cada período = 3 meses na vida dos jogadores' }, G.save.treinoOn ? '⏸️ pausada: Modo Treino ligado' : `⏳ próximo período em ${Math.ceil(prox / 60000)} min`)));
}
function abreAgencia(aba) {
  const s = G.save; if (!s) return;
  if (!agLiberada()) { abreModal(el('h2', {}, '⭐ LENDAS FC — AGÊNCIA'), el('div', { class: 'ag-capa trava' }, agImg('cap_ag_escritorio'), el('span', {}, '🔒')), el('p', {}, `🔒 A Agência abre no nível ${AG_NIVEL}... ou antes, se você zerar os outros modos:`), el('ul', {}, el('li', {}, `${agZerouCarreira() ? '✅' : '⬜'} Carreira: chegar à fama máxima (👑 Lenda Mundial, ${fmt(CARR_FAMA_MAX)}) ou ser campeão da ${CARR_TIERS[CARR_TIER_MAX].liga}`), el('li', {}, `${agZerouClube() ? '✅' : '⬜'} Clube: ser campeão do Mundial Interclubes`)), el('p', { class: 'dica' }, '"Você já foi uma lenda dentro de campo. Agora descubra quem será a próxima." Aqui você vira EMPRESÁRIO: descobre garotos e garotas talentosos, cuida da carreira deles, negocia contratos e transferências.'), el('div', { class: 'opcoes' }, el('button', { class: 'btn', onclick: fechaModal }, 'Ok'))); return; }
  let a = agDados();
  if (!a) {
    abreModal(el('h2', {}, '⭐ LENDAS FC — AGÊNCIA'), el('div', { class: 'ag-capa' }, agImg('cap_ag_escritorio'), agEmbaixadinha(90)), el('p', { style: 'font-size:17px' }, '"Você já foi uma lenda dentro de campo. Agora descubra quem será a próxima."'),
      el('p', {}, 'Monte sua rede de olheiros, descubra talentos na várzea e nas escolinhas, coloque os garotos em testes, negocie contratos, venda para clubes do mundo inteiro... e construa a reputação de SUPERAGENTE.'),
      el('p', { class: 'dica' }, 'O tempo da agência anda no relógio de verdade: a cada 20 minutos passa um período (3 meses na vida dos jogadores), até com o jogo fechado.'),
      el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', onclick: () => { agCria(); salvar(); abreAgencia('hoje'); agCelebra('escritorio', `⭐ ${agDados().nome} ABRIU AS PORTAS!`, 'Você já foi uma lenda dentro de campo. Agora descubra quem será a próxima.', 'confete'); } }, '🕴️ Abrir minha agência'), el('button', { class: 'btn', onclick: fechaModal }, 'Agora não')));
    return;
  }
  agTick(); AG_ABA = aba || AG_ABA;
  const abas = [['hoje', '☀️ Hoje'], ['talentos', '🔎 Talentos'], ['jogadores', '👤 Meus jogadores'], ['negocios', '💼 Negociações'], ['agencia', '🏢 Agência']];
  const nav = el('div', { class: 'ag-abas' }, ...abas.map(([id, nome]) => { const n = id === 'hoje' ? a.eventos.filter(e => !e.visto).length : id === 'negocios' ? a.eventos.filter(e => e.acoes === true && !e.feito).length : 0; return el('button', { class: 'btn mini' + (AG_ABA === id ? ' amarelo' : ''), onclick: () => abreAgencia(id) }, nome + (n ? ` (${n})` : '')); }));
  const corpo = el('div', { class: 'ag-corpo' }, ({ hoje: agTelaHoje, talentos: agTelaTalentos, jogadores: agTelaJogadores, negocios: agTelaNegocios, agencia: agTelaAgencia })[AG_ABA]());
  abreModal.largo = true; abreModal(el('h2', {}, '⭐ LENDAS FC — AGÊNCIA'), agCabecalho(), nav, corpo, el('div', { class: 'opcoes' }, el('button', { class: 'btn', onclick: fechaModal }, 'Fechar')));
  if (AG_ABA === 'hoje') { for (const e of a.eventos) e.visto = true; agAvisa(); }
  agMostraFila();
}
function agTelaHoje() {
  const a = agDados(); const n = a.eventos.filter(e => !e.visto).length;
  const box = el('div', {}, el('h3', {}, `☀️ BOM DIA, EMPRESÁRIO${n ? ` — ${n} acontecimento(s) novo(s)` : ''}`), agMetasMini());
  if (!a.eventos.length) box.append(el('div', { class: 'ag-vazio' }, agEmbaixadinha(), el('p', {}, 'Nada de novo por enquanto. Mande um olheiro procurar talentos!')));
  const lista = el('div', { class: 'lista' });
  for (const e of a.eventos.slice(0, 14)) {
    const j = e.jog && agJog(e.jog);
    const acoes = e.feito ? el('small', { class: 'ag-res' }, e.resultado || '✔ resolvido') : e.acoes === true ? el('button', { class: 'btn amarelo mini', onclick: () => abreAgencia('negocios') }, 'Ver proposta') :
      e.acoes === 'conversa' ? el('button', { class: 'btn amarelo mini', onclick: () => agConversaProblema(e) }, '💬 Conversar') :
      Array.isArray(e.acoes) ? el('div', { class: 'ag-acoes' }, ...e.acoes.map(([nome, custo], k) => el('button', { class: 'btn mini', onclick: () => { agResolveProblema(e, k); abreAgencia('hoje'); if (e.feito && k === 0 && /saudade/.test(e.txt) && j) agCelebra('saudade', '🏠 A família chegou!', `${j.nome} ganhou a visita da família e voltou a sorrir.`, 'confete', j); } }, nome + (custo ? ` (${agFmt(custo)})` : '')))) : '';
        const ic = AG_EV_ARTE[e.tipo] || (e.tipo === 'evolucao' ? null : 'ag_brasao');
    const fig = j ? el('div', { class: 'ag-fig' }, agRetrato(j, 44), ic ? agImg(ic, 'ag-selo') : '') : el('div', { class: 'ag-fig' }, agImg(ic || 'ag_brasao', 'ag-ic-img'));
    lista.append(el('div', { class: 'linha-item ag-ev' + (e.visto ? '' : ' novo') }, fig, el('div', { class: 'nm' }, el('span', {}, e.txt), acoes)));
  }
  box.append(lista); return box;
}
const AG_ESCOLHA = { reg: 'bairro' };
function agTelaTalentos() {
  const a = agDados(), s = G.save, k = agNivelRep();
  const box = el('div');
  box.append(el('h3', {}, '🔎 Mandar um olheiro'));
  const ocupados = new Set(a.missoes.map(m => m.olheiro));
  // escolha por cartões: primeiro a REGIÃO, depois o OLHEIRO (os que não podem ir ficam apagados com o motivo)
  const pode = (o, r) => !r.fora || o[0] === 'internacional' || o[0] === 'lendario';
  if (!AG_REGIOES.some(r => r.id === AG_ESCOLHA.reg && k >= r.rep)) AG_ESCOLHA.reg = 'bairro';
  const regs = el('div', { class: 'ag-cartoes ag-regs' }, ...AG_REGIOES.map(r => {
    const trava = k < r.rep;
    return el('button', { class: 'ag-cartao' + (trava ? ' trava' : '') + (AG_ESCOLHA.reg === r.id ? ' sel' : ''), type: 'button', disabled: trava ? 'disabled' : null, onclick: () => { AG_ESCOLHA.reg = r.id; abreAgencia('talentos'); } },
      agImg(AG_REG_ARTE[r.id], 'ag-cartao-img'), el('b', {}, r.nome.replace(/^\S+\s/, '')), el('small', {}, trava ? `🔒 ${AG_REP[r.rep][1]}` : `potencial até ~${r.pot[1]}${r.fora ? ' · ✈️' : ''}`));
  }));
  const regSel = AG_REGIOES.find(r => r.id === AG_ESCOLHA.reg);
  const ols = el('div', { class: 'ag-cartoes ag-ols' }, ...AG_OLHEIROS.filter(o => a.olheiros[o[0]]).map(o => {
    const viajando = ocupados.has(o[0]), naoVai = !pode(o, regSel), pobre = s.ouro < o[4];
    const motivo = viajando ? '🧳 viajando' : naoVai ? '✈️ só no Brasil' : pobre ? '💸 sem tostões' : `${agFmt(o[4])} · ${o[5]} min`;
    return el('button', { class: 'ag-cartao ag-ol' + (viajando || naoVai || pobre ? ' trava' : ''), type: 'button', title: o[1], onclick: () => {
      if (viajando) { log('Esse olheiro já está viajando.', 'l-sis'); return; }
      if (naoVai) { log('Para fora do Brasil, mande o olheiro internacional (ou o lendário).', 'l-sis'); return; }
      if (s.ouro < o[4]) { log('Tostões insuficientes.', 'l-dano'); return; }
      s.ouro -= o[4]; a.missoes.push({ olheiro: o[0], regiao: regSel.id, fim: Date.now() + o[5] * 60000, ini: Date.now() }); log(`🔎 ${o[1]} partiu para ${regSel.nome}. Volta em ${o[5]} minutos.`, 'l-xp'); try { som('moeda'); } catch (e) { } salvar(); abreAgencia('talentos');
    } }, agImg(AG_OL_ARTE[o[0]], 'ag-ol-img'), el('b', {}, o[1].replace(/^\S+\s/, '')), el('small', {}, motivo));
  }));
  box.append(el('p', { class: 'ag-passo' }, '1️⃣ Escolha a região:'), regs, el('p', { class: 'ag-passo' }, `2️⃣ Toque no olheiro para mandá-lo a ${regSel.nome}:`), ols);
  // olheiros na estrada: o bonequinho anda até a região (a animação continua sozinha até a hora de voltar)
  if (a.missoes.length) box.append(el('div', { class: 'ag-viagens' }, ...a.missoes.map(m => {
    const o = AG_OLHEIROS.find(x => x[0] === m.olheiro), r = AG_REGIOES.find(x => x.id === m.regiao);
    const total = Math.max(1, m.fim - (m.ini || m.fim - o[5] * 60000)), falta = Math.max(0, m.fim - Date.now()), feito = clamp(1 - falta / total, 0, 1);
    const anda = el('div', { class: 'ag-anda' }, agImg(AG_OL_ARTE[o[0]], 'ag-anda-img'));
    anda.style.setProperty('--de', (feito * 100).toFixed(1) + '%'); anda.style.animationDuration = Math.max(1, falta / 1000).toFixed(0) + 's';
    return el('div', { class: 'ag-viagem' }, el('div', { class: 'ag-estrada' }, anda, agImg(AG_REG_ARTE[r.id], 'ag-destino')),
      el('small', {}, `${o[1]} → ${r.nome} · volta em ${Math.max(1, Math.ceil(falta / 60000))} min`));
  })));
  box.append(el('h3', {}, `🧒 Talentos encontrados (${a.achados.length})`));
  if (!a.achados.length) box.append(el('div', { class: 'ag-vazio' }, agEmbaixadinha(), el('p', {}, 'Nenhum talento esperando. Os olheiros trazem garotos e garotas de 14 a 16 anos.')));
  const lista = el('div', { class: 'lista' });
  for (const j of a.achados) {
    const custoAval = Math.max(80000, Math.round(agValor(j) * 0.4)), custoAss = Math.max(50000, Math.round(agValor(j) * 0.6));
    lista.append(el('div', { class: 'linha-item' }, agRetrato(j, 56),
      el('div', { class: 'nm' }, el('b', {}, `${j.nome} — ${j.idade} anos · ${AG_POS[j.pos][0]}`), el('small', {}, `Overall ${j.ovr} · ${agEstrelasPot(j)} · ${AG_PERS[j.pers].nome} · vai embora em ${7 - (j.espera || 0)} períodos`), j.fam ? el('small', { class: 'ag-fam' }, agFamTxt(j)) : '',
        el('div', { class: 'ag-acoes' },
          el('button', { class: 'btn mini', disabled: j.avaliado ? 'disabled' : null, onclick: () => { if (s.ouro < custoAval) { log('Tostões insuficientes.', 'l-dano'); return; } s.ouro -= custoAval; j.avaliado = true; const l2 = 2; j.potV = [clamp(j.pot - agRi(0, l2), 40, 99), clamp(j.pot + agRi(0, l2), 40, 99)]; log(`🔬 Avaliação de ${j.nome}: potencial ${j.potV[0]}–${j.potV[1]}.`, 'l-xp'); salvar(); abreAgencia('talentos'); } }, j.avaliado ? '🔬 Avaliado' : `🔬 Avaliação detalhada (${agFmt(custoAval)})`),
          j.pensa != null && j.pensa === (a.nPer || 0) ? el('small', { class: 'ag-pensa' }, '⏳ A família está pensando. Volte no próximo período.') :
            el('button', { class: 'btn amarelo mini', onclick: () => { if (a.jogadores.length >= agMaxJogadores()) { log(`Sua agência só representa ${agMaxJogadores()} jogadores agora (suba de nível: 🎯 metas na aba 🏢 Agência).`, 'l-sis'); return; } agConversaFamilia(j); } }, `💬 Conversar com a família (a partir de ${agFmt(custoAss)})`),
          el('button', { class: 'btn mini', onclick: () => { a.achados.splice(a.achados.indexOf(j), 1); salvar(); abreAgencia('talentos'); } }, 'Dispensar')))));
  }
  box.append(lista); return box;
}
function agTelaJogadores() {
  const a = agDados(), s = G.save; const box = el('div');
  if (!a.jogadores.length) { box.append(el('div', { class: 'ag-vazio' }, agEmbaixadinha(), el('p', {}, 'Você ainda não representa ninguém. Encontre talentos na aba 🔎 Talentos.'))); return box; }
  for (const j of a.jogadores) {
    const atr = el('div', { class: 'ag-atr' }, ...Object.entries(AG_ATR).map(([k, n]) => el('span', {}, `${n}: ${j.atr[k]}`)));
    const acoes = el('div', { class: 'ag-acoes' });
    if (j.fase === 'treino' || j.fase === 'achado') {
      const custoEsc = Math.max(150000, Math.round(agValor(j) * 0.5));
      acoes.append(el('button', { class: 'btn mini', onclick: () => { if (s.ouro < custoEsc) { log('Tostões insuficientes.', 'l-dano'); return; } s.ouro -= custoEsc; j.fase = 'escolinha'; j.escolinha = 4; agHist(j, 'entrou numa escolinha (1 ano)'); salvar(); abreAgencia('jogadores'); } }, `🏫 Escolinha por 1 ano (${agFmt(custoEsc)})`));
      if (j.idade >= 15 && j.testePer === a.nPer) acoes.append(el('small', {}, '🏟️ Já fez um teste neste período. Próximo teste no próximo período.'));
      else if (j.idade >= 15) for (const c of agClubesParaTeste(j)) acoes.append(el('button', { class: 'btn mini amarelo', onclick: () => { agFazTeste(j, c); abreAgencia('jogadores'); if (j.fase === 'base') agCelebra('teste', `✅ ${j.nome} foi aprovado(a)!`, `Vai jogar na base do ${j.clube.nome}. Agora é treinar e esperar o primeiro contrato profissional.`, 'carimbo', j); } }, `🏟️ Teste no ${c.nome} (${c.chance}%)`));
      else acoes.append(el('small', {}, 'Testes em clubes a partir dos 15 anos.'));
    }
    if (j.fase === 'base' && j.idade >= 16.5 && !a.eventos.some(e => e.jog === j.id && e.tipo === 'contrato' && !e.feito)) acoes.append(el('button', { class: 'btn mini amarelo', onclick: () => { agPropostaContrato(j, j.clube, false); abreAgencia('negocios'); } }, '📑 Pedir o contrato profissional'));
    if (j.fase === 'pro') acoes.append(el('small', {}, `Salário ${agFmt(j.salario)}/mês · comissão ${j.comissao}% · contrato: ${Math.max(0, Math.ceil((j.contratoAte - (a.nPer || 0)) / 4))} ano(s) · valor ${agFmt(agValor(j))}`));
    acoes.append(el('button', { class: 'btn mini', onclick: () => { if (!confirm(`Encerrar a representação de ${j.nome}?`)) return; if (j.fase === 'pro') agHall(j, 'saiu da agência'); a.jogadores.splice(a.jogadores.indexOf(j), 1); salvar(); abreAgencia('jogadores'); } }, 'Encerrar'));
    box.append(el('div', { class: 'linha-item ag-jog' }, agRetrato(j, 72),
      el('div', { class: 'nm' }, el('b', {}, `${j.nome} — ${Math.floor(j.idade)} anos · ${AG_POS[j.pos][0]} · Overall ${j.ovr}`), el('small', {}, `${agFaseTxt(j)} · ${agEstrelasPot(j)} · ${AG_PERS[j.pers].nome} · moral ${Math.round(j.moral)} · fama ${Math.round(j.fama || 0)}${j.parado ? ' · 🤕 parado' : ''}`),
        atr, acoes, j.hist.length ? el('small', { class: 'ag-hist' }, '📜 ' + j.hist.slice(0, 3).join(' · ')) : '')));
  }
  return box;
}
function agComemoraNegocio(e, j) {
  if (!e.feito || !e.resultado || !j) return;
  if (e.tipo === 'contrato' && !e.renova && j.fase === 'pro' && e.resultado.startsWith('🤝')) agCelebra('contrato', `📑 ${j.nome} virou PROFISSIONAL!`, `Contrato assinado com o ${e.clube.nome}. A família inteira veio comemorar!`, 'confete', j);
  else if (e.tipo === 'transferencia' && e.resultado.startsWith('💼')) agCelebra('transferencia', `💼 ${j.nome} → ${e.clube.nome}!`, e.resultado.replace(/^💼 TRANSFERÊNCIA FECHADA: /, ''), 'moedas', j);
  else if (e.tipo === 'patrocinio' && e.resultado.startsWith('📣')) agCelebra('patrocinio', `📣 ${j.nome} é garoto(a)-propaganda!`, e.resultado.replace(/^📣 /, ''), 'flash', j);
}
function agTelaNegocios() {
  const a = agDados(); const box = el('div'); const abertas = a.eventos.filter(e => e.acoes === true && !e.feito);
  if (!abertas.length) { box.append(el('p', { class: 'vazio' }, 'Nenhuma proposta na mesa. Elas chegam quando seus jogadores se destacam.')); return box; }
  for (const e of abertas) {
    const j = agJog(e.jog); if (!j) { e.feito = true; continue; }
    const card = el('div', { class: 'linha-item ag-neg' }, agRetrato(j, 64)); const nm = el('div', { class: 'nm' }, el('b', {}, e.txt)); card.append(nm);
    const o = e.oferta;
    if (e.tipo === 'contrato') {
      nm.append(el('small', {}, j.pers === 'ganancioso' ? '💰 Ele(a) é ganancioso(a): vai ficar chateado(a) se você aceitar sem negociar.' : 'Dá para aceitar agora ou sentar com o diretor e tentar melhorar.'),
        el('div', { class: 'ag-acoes' },
          el('button', { class: 'btn amarelo mini', onclick: () => agConversaNegocio(e, j) }, '💬 Negociar com o diretor'),
          el('button', { class: 'btn mini', onclick: () => { agFechaContrato(j, e, { salario: o.salario, anos: o.anos, com: o.com }); if (j.pers === 'ganancioso') { j.moral = Math.max(0, j.moral - 8); agHist(j, 'queria que você negociasse mais'); } salvar(); abreAgencia('negocios'); agComemoraNegocio(e, j); } }, '✅ Aceitar como está'),
          el('button', { class: 'btn mini', onclick: () => { e.feito = true; e.resultado = 'Você recusou a proposta.'; if (e.renova) { j.fase = 'treino'; j.clube = null; j.salario = 0; } salvar(); abreAgencia('negocios'); } }, '❌ Recusar')));
    } else {
      const aceitar = () => { if (e.tipo === 'transferencia') agVende(j, e, o.valor); else agPatrocinioFecha(j, e, o.valor); salvar(); abreAgencia('negocios'); agComemoraNegocio(e, j); };
      nm.append(el('small', {}, e.tipo === 'transferencia' ? `Valor de mercado estimado: ${agFmt(agValor(j))} · comissão ${Math.max(5, j.comissao || 10)}%` : 'Sua parte: 20% do patrocínio.'),
        el('div', { class: 'ag-acoes' },
          el('button', { class: 'btn amarelo mini', onclick: () => agConversaNegocio(e, j) }, e.tipo === 'transferencia' ? '💬 Negociar com o diretor' : '💬 Negociar com a marca'),
          el('button', { class: 'btn mini', onclick: aceitar }, e.tipo === 'transferencia' ? '✅ Vender como está' : '✅ Aceitar como está'),
          el('button', { class: 'btn mini', onclick: () => { e.feito = true; e.resultado = 'Você recusou.'; salvar(); abreAgencia('negocios'); } }, '❌ Recusar')));
    }
    box.append(card);
  }
  return box;
}
function agTelaAgencia() {
  const a = agDados(), s = G.save, k = agNivelRep(); const box = el('div');
  const prox = AG_REP[k + 1];
  box.append(el('p', {}, `${agRepTxt()} · ${fmt(a.rep)} pontos · Representa até ${agMaxJogadores()} jogadores.`), agMetasBox(a));
  box.append(el('h3', {}, '🔎 Olheiros'));
  const lo = el('div', { class: 'lista' });
  for (const o of AG_OLHEIROS) {
    const tem = a.olheiros[o[0]], trava = k < o[2];
    lo.append(el('div', { class: 'linha-item' + (trava ? ' bloq' : '') }, agImg(AG_OL_ARTE[o[0]], 'ag-ol-mini'), el('div', { class: 'nm' }, el('b', {}, o[1]), el('small', {}, `Missão: ${agFmt(o[4])} tostões, ${o[5]} min · ${o[0] === 'base' ? 'encontra jogadores comuns' : o[0] === 'especialista' ? 'mais chance de achar talentos' : o[0] === 'internacional' ? 'vai à América do Sul e à Europa' : 'chance pequena de achar um FENÔMENO'}`)),
      tem ? el('b', {}, '✔ Contratado') : trava ? el('small', {}, `🔒 ${AG_REP[o[2]][1]}`) : el('button', { class: 'btn amarelo mini', onclick: () => { if (s.ouro < o[3]) { log('Tostões insuficientes.', 'l-dano'); return; } s.ouro -= o[3]; a.olheiros[o[0]] = 1; log(`🕴️ ${o[1]} contratado!`, 'l-loot'); salvar(); abreAgencia('agencia'); } }, `Contratar (${agFmt(o[3])})`)));
  }
  box.append(lo, el('h3', {}, '🏆 Títulos'));
  box.append(el('div', { class: 'ag-medalhas' }, ...AG_TITULOS.map(([id, nome, desc]) => el('div', { class: 'ag-medalha' + (a.titulos[id] ? ' tem' : ''), title: desc }, agImg(AG_TIT_ARTE[id], 'ag-med-img'), el('b', {}, nome.replace(/^\S+\s/, '')), el('small', {}, a.titulos[id] ? '✅ conquistado' : desc)))));
  // 📸 álbum: as cenas que você já viveu (toque para ver de novo)
  const alb = a.album || {}, nAlb = AG_ALBUM.filter(([c]) => alb[c]).length;
  box.append(el('h3', {}, `📸 Álbum da Agência (${nAlb}/${AG_ALBUM.length})`));
  box.append(el('div', { class: 'ag-album' }, ...AG_ALBUM.map(([c, leg, como]) => alb[c]
    ? el('button', { class: 'ag-foto', type: 'button', onclick: () => agCelebra(c, leg, '', 'confete') }, agImg('cap_ag_' + c), el('span', {}, leg))
    : el('div', { class: 'ag-foto trava', title: como }, el('div', { class: 'ag-foto-vazia' }, '❔'), el('span', {}, como)))));
  // 🏛️ hall da fama: quem já passou pela agência (aposentados e quem saiu), pelo melhor overall
  const hall = a.hall || [];
  box.append(el('h3', {}, '🏛️ Hall da Fama'));
  if (!hall.length) box.append(el('p', { class: 'vazio' }, 'Quando um craque seu se aposentar (ou sair da agência como profissional), ele ganha um lugar aqui.'));
  else box.append(el('div', { class: 'lista' }, ...hall.map((h, i) => el('div', { class: 'linha-item' }, el('b', { class: 'pos-tag' }, i + 1), agRetrato(h, 44),
    el('div', { class: 'nm' }, el('b', {}, `${h.nome} · ${AG_POS[h.pos] ? AG_POS[h.pos][0] : ''} · overall máximo ${h.ovr}`), el('small', {}, `${h.como}${h.clube ? ' · último clube: ' + h.clube : ''}${h.venda ? ' · maior venda: ' + agFmt(h.venda) : ''}`))))));
  box.append(el('p', { class: 'dica' }, '📍 O escritório da agência fica na Vila do Campinho, na rua de cima: a secretária, o chefe dos olheiros e o quadro de talentos estão lá. Os profissionais que você representa aparecem no Mercado do seu clube (modo Time) — dá para contratar os seus próprios craques! (Cada craque só aceita um clube à altura dele.)'));
  return box;
}

/* ---------- conexão com o modo Time: seus profissionais no Mercado ---------- */
const AG_MERCADO_FOLGA = 15; // força máxima do craque da agência = força-base da divisão + 15
if (typeof telaMercado === 'function') {
  const _mercadoAg = telaMercado;
  telaMercado = function () {
    const wrap = _mercadoAg.apply(this, arguments);
    try {
      const a = agDados(), t = G.save.time; const pros = a ? a.jogadores.filter(j => j.fase === 'pro' && !t.elenco.some(x => x.agId === j.id)) : [];
      if (!pros.length) return wrap;
      wrap.append(el('h3', {}, '⭐ Craques da sua Agência'));
      const l = el('div', { class: 'lista' });
      for (const j of pros) {
        const cj = { id: 'A_' + j.id, agId: j.id, nome: j.nome, pos: j.pos, atq: Math.round((j.atr.fin + j.atr.dri) / 2), def: j.atr.def, pas: j.atr.vis, fis: j.atr.vel, pot: j.pot, nivel: 1, xp: 0, energia: 100, idade: Math.floor(j.idade), look: { corpo: j.look.corpo, pele: j.look.pele, cabelo: j.look.cabelo, corCabelo: j.look.corCabelo } };
        const preco = Math.round(precoJogador(cj) * 0.9), teto = DIVS[t.div].base + AG_MERCADO_FOLGA;
        // o craque só aceita um clube à altura (senão um overall 95 no time da várzea acabaria com a graça do modo Clube)
        if (ovr(cj) > teto) { l.append(el('div', { class: 'linha-item bloq' }, el('div', { class: 'nm' }, el('b', {}, `⭐ ${j.nome} · ${AG_POS[j.pos][0]} · força ${ovr(cj)}`), el('small', {}, `Só aceita jogar num clube mais forte: suba de divisão (aqui ele topa até força ${teto}).`)))); continue; }
        l.append(cartaJogador(cj, el('span', { class: 'preco-col' }, precoTag(preco), el('button', { class: 'btn amarelo mini', onclick: () => {
          if (t.elenco.length >= 19 || t.caixa < preco) { log(t.caixa < preco ? 'Caixa do clube insuficiente.' : 'Elenco cheio.', 'l-dano'); return; }
          t.caixa -= preco; t.finTemp.sai -= preco; t.elenco.push(cj); j.meuClube = true; j.clube = { nome: t.nome, pais: (typeof PAIS !== 'undefined' && PAIS[t.pais] && PAIS[t.pais].nome) || 'Brasil', cor: t.cor1, nivel: clamp(Math.floor((DIVS[t.div].base - 36) / 9), 0, 4) }; j.look.corRoupa = t.cor1; agHist(j, `foi contratado pelo SEU clube, o ${t.nome}`); log(`⭐ ${j.nome}, da sua agência, agora joga no ${t.nome}!`, 'l-lvl'); som('moeda'); salvar(); abrirTime('mercado');
        } }, 'Contratar'))));
      }
      wrap.append(l);
    } catch (e) { }
    return wrap;
  };
}

/* ---------- botão no menu, aviso de novidades e relógio ---------- */
(function () {
  const poe = () => {
    // v326: botão na barra de cima (versão web), ao lado de Arenas — só para quem já liberou a Agência
    const nav = document.querySelector('#topo .topo-nav'), mais = nav && nav.querySelector('.tb-mais');
    if (mais && !document.getElementById('tbAgencia')) mais.before(el('button', { class: 'btn mini roxo btn-agencia', id: 'tbAgencia', type: 'button', title: 'Agência: o modo Empresário', hidden: 'hidden', onclick: () => abreAgencia() }, '💼 ', el('span', { class: 'tb-rot' }, 'Agência')));
    const lista = document.querySelector('#topo .tb-lista');
    if (lista && !document.getElementById('btnAgencia')) lista.prepend(el('button', { class: 'btn btn-agencia', id: 'btnAgencia', type: 'button', role: 'menuitem', onclick: () => abreAgencia() }, '🕴️ Agência (empresário)'));
    const grade = document.querySelector('#celMenu .cm-grade');
    if (grade && !document.getElementById('cmAgencia')) grade.append(el('button', { class: 'btn cm-bt btn-agencia', id: 'cmAgencia', type: 'button', onclick: () => abreAgencia() }, el('span', { class: 'cm-ic' }, '🕴️'), 'Agência'));
    agAvisa();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(poe, 0)); else setTimeout(poe, 0);
  const _iniAg = iniciarJogo;
  iniciarJogo = async function (...a) { const r = await _iniAg.apply(this, a); poe(); setTimeout(() => { try { const n0 = agDados() ? agDados().eventos.filter(e => !e.visto).length : 0; agTick(); const n = agDados() ? agDados().eventos.filter(e => !e.visto).length : 0; if (n > 0 && n !== n0 || n > 2) log(`🕴️ Agência: ${n} novidade(s) esperando por você (☰ Mais → Agência).`, 'l-xp'); } catch (e) { } }, 3000); return r; };
  setInterval(() => { try { agAvisa(); if (G.rodando && agDados()) { const n0 = agDados().eventos.length; agTick(); if (agDados().eventos.length > n0) { const ev = agDados().eventos[0]; log('🕴️ ' + ev.txt, 'l-xp'); } } } catch (e) { } }, 15000);
  // liberou (nível 400, ou zerou Carreira + Clube): a novidade
  const _subiuAg = subiuNivel;
  const agConfereLibera = () => { try { const s = G.save; if (s && s.flags && agLiberada() && !s.flags.agencia_avisada) { s.flags.agencia_avisada = true; setTimeout(() => { banner('⭐ LENDAS FC — AGÊNCIA', 'O modo Empresário foi liberado!'); log('🕴️ AGÊNCIA LIBERADA! Agora você pode ser EMPRESÁRIO: ☰ Mais → 🕴️ Agência.', 'l-lvl'); }, 2500); } } catch (e) { } };
  subiuNivel = function () { const r = _subiuAg.apply(this, arguments); agConfereLibera(); return r; };
  setInterval(agConfereLibera, 20000); // campeão da Liga da Coroa / do Mundial acontece fora do subiuNivel
  const st = document.createElement('style');
  st.textContent = `
  .btn-agencia[data-n]:not([data-n=""])::after { content: attr(data-n); margin-left: 6px; background: #e0302a; color: #fff; border-radius: 9px; padding: 0 6px; font-size: 11px; font-weight: 800; }
  #tbAgencia { position: relative; }
  #tbAgencia[data-n]:not([data-n=""])::after { position: absolute; top: -6px; right: -6px; margin: 0; min-width: 16px; height: 16px; line-height: 16px; padding: 0 4px; font-size: 10px; text-align: center; border: 1.5px solid #fff; box-sizing: border-box; }
  .ag-cab { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; background: linear-gradient(135deg, #2a1a5e, #4a2a8a); color: #fff6e0; border-radius: 12px; padding: 8px 12px; }
  .ag-cab small { display: block; opacity: .85; }
  .ag-nome { font-size: 18px; letter-spacing: .04em; }
  .ag-num { display: flex; gap: 4px 12px; flex-wrap: wrap; font-weight: 700; font-size: 12px; }
  .ag-abas { display: flex; gap: 6px; flex-wrap: wrap; margin: 8px 0; }
  .ag-corpo { max-height: 58vh; overflow: auto; }
  .ag-ret { width: 44px; height: 56px; flex-shrink: 0; border-radius: 8px; background: radial-gradient(circle at 50% 35%, #6ad86a, #2e8a3a 70%); }
  .ag-jog .ag-ret { width: 58px; height: 72px; }
  .ag-acoes { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px; align-items: center; }
  .ag-atr { display: flex; gap: 10px; flex-wrap: wrap; font-size: 12px; margin-top: 2px; }
  .ag-linha { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; margin: 4px 0; }
  .ag-ev.novo { border-left: 4px solid #ffd23f; }
  .ag-ic { font-size: 28px; width: 44px; text-align: center; }
  .ag-res { color: #2a7a3a; font-weight: 700; }
  .ag-hist { opacity: .75; }
  /* v324: arte e animações */
  .ag-cab { background: linear-gradient(90deg, rgba(34,18,80,.94), rgba(60,30,120,.78)), url(a/cap_ag_escritorio.webp) center 35% / cover; }
  .ag-cab-id { display: flex; align-items: center; gap: 10px; }
  .ag-brasao { width: 46px; height: auto; filter: drop-shadow(0 2px 3px rgba(0,0,0,.5)); animation: agBrilha 4s ease-in-out infinite; }
  @keyframes agBrilha { 0%,100% { transform: rotate(-4deg) scale(1); } 50% { transform: rotate(4deg) scale(1.06); } }
  .ag-fig { position: relative; flex-shrink: 0; width: 48px; display: flex; justify-content: center; }
  .ag-selo { position: absolute; right: -8px; bottom: -6px; width: 26px; height: auto; filter: drop-shadow(0 1px 1px rgba(0,0,0,.4)); }
  .ag-ic-img { width: 42px; height: auto; }
  .ag-ev.novo .ag-selo, .ag-ev.novo .ag-ic-img { animation: agPula 1.2s ease-in-out infinite; }
  @keyframes agPula { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
  .ag-embx { --alt: 110px; width: calc(var(--alt) / 2); height: var(--alt); flex-shrink: 0; background: url(a/a_embaixadinha.webp) 0 0 / calc(var(--alt) * 2) var(--alt) no-repeat; animation: agEmbx .95s steps(4) infinite; }
  @keyframes agEmbx { to { background-position: calc(var(--alt) * -2) 0; } }
  .ag-vazio { display: flex; align-items: center; gap: 14px; padding: 6px 4px; }
  .ag-vazio p { margin: 0; opacity: .85; }
  .ag-passo { margin: 6px 0 4px; font-weight: 700; }
  .ag-cartoes { display: grid; grid-template-columns: repeat(auto-fill, minmax(118px, 1fr)); gap: 8px; }
  .ag-cartao { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 6px 4px 8px; border-radius: 12px; border: 2px solid #c8a46a; background: #fff8e6; cursor: pointer; font: inherit; color: inherit; transition: transform .12s, box-shadow .12s; }
  .ag-cartao:hover:not([disabled]) { transform: translateY(-3px); box-shadow: 0 4px 10px rgba(0,0,0,.18); }
  .ag-cartao.sel { border-color: #e0a000; background: #fff0b8; box-shadow: 0 0 0 3px rgba(255,200,40,.55); }
  .ag-cartao.trava { opacity: .55; filter: grayscale(.7); }
  .ag-cartao b { font-size: 13px; text-align: center; }
  .ag-cartao small { font-size: 11px; text-align: center; opacity: .85; }
  .ag-cartao-img { width: 92px; height: 80px; object-fit: contain; }
  .ag-ol-img { width: 70px; height: 96px; object-fit: contain; }
  .ag-ol:not(.trava):hover .ag-ol-img { animation: agPula .5s ease-in-out infinite; }
  .ag-ol-mini { width: 40px; height: 54px; object-fit: contain; flex-shrink: 0; }
  .ag-viagens { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; }
  .ag-viagem small { display: block; text-align: center; font-weight: 700; }
  .ag-estrada { position: relative; height: 64px; border-radius: 32px; background: repeating-linear-gradient(90deg, #d8b878 0 18px, #c9a35e 18px 22px); border: 2px solid #a8844a; overflow: hidden; }
  .ag-estrada::after { content: ''; position: absolute; left: 0; right: 60px; top: 50%; border-top: 3px dashed rgba(255,255,255,.75); }
  .ag-anda { position: absolute; bottom: 2px; left: 0; width: 44px; z-index: 1; animation-name: agViaja; animation-timing-function: linear; animation-fill-mode: forwards; }
  .ag-anda-img { width: 44px; height: 58px; object-fit: contain; display: block; animation: agPasso .45s ease-in-out infinite alternate; }
  @keyframes agViaja { from { left: calc(var(--de) * 0.85); } to { left: calc(100% - 104px); } }
  @keyframes agPasso { from { transform: translateY(0) rotate(-3deg); } to { transform: translateY(-4px) rotate(3deg); } }
  .ag-destino { position: absolute; right: 4px; top: 2px; width: 58px; height: 58px; object-fit: contain; }
  .ag-medalhas { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; }
  .ag-medalha { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 2px; padding: 8px 6px; border-radius: 12px; background: #fff8e6; border: 2px solid #d8c090; }
  .ag-medalha:not(.tem) .ag-med-img { filter: grayscale(1) brightness(.75); opacity: .55; }
  .ag-medalha.tem { border-color: #e0a000; background: linear-gradient(#fff6c8, #ffe9a0); }
  .ag-medalha.tem .ag-med-img { animation: agBrilha 3s ease-in-out infinite; }
  .ag-med-img { width: 64px; height: 72px; object-fit: contain; }
  .ag-medalha small { font-size: 11px; opacity: .85; }
  .ag-album { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; }
  .ag-foto { display: flex; flex-direction: column; gap: 3px; padding: 4px; border-radius: 10px; border: 2px solid #c8a46a; background: #fff; font: inherit; font-size: 12px; font-weight: 700; color: inherit; cursor: pointer; text-align: center; }
  .ag-foto img { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; border-radius: 7px; }
  .ag-foto.trava { cursor: default; font-weight: 400; opacity: .75; }
  .ag-foto-vazia { aspect-ratio: 16 / 9; border-radius: 7px; background: repeating-linear-gradient(45deg, #e8dcc0 0 10px, #ddd0b0 10px 20px); display: flex; align-items: center; justify-content: center; font-size: 26px; }
  .ag-capa { position: relative; display: flex; align-items: flex-end; justify-content: flex-end; border-radius: 12px; overflow: hidden; margin: 6px 0; }
  .ag-capa > img { width: 100%; aspect-ratio: 16 / 7; object-fit: cover; display: block; }
  .ag-capa .ag-embx { position: absolute; right: 14px; bottom: 6px; filter: drop-shadow(0 3px 3px rgba(0,0,0,.4)); }
  .ag-capa.trava > img { filter: grayscale(.85) brightness(.7); }
  .ag-capa.trava span { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 54px; }
  /* tela cheia das comemorações */
  .ag-show { position: fixed; inset: 0; z-index: 9000; background: rgba(8,4,24,.82); display: flex; align-items: center; justify-content: center; padding: 14px; overflow: hidden; cursor: pointer; animation: agEntra .35s ease-out; }
  .ag-show.sai { animation: agSai .26s ease-in forwards; }
  @keyframes agEntra { from { opacity: 0; } to { opacity: 1; } }
  @keyframes agSai { to { opacity: 0; } }
  .ag-show-quadro { position: relative; width: min(860px, 100%); animation: agSobe .55s cubic-bezier(.2,1.4,.4,1); }
  @keyframes agSobe { from { transform: translateY(40px) scale(.9); opacity: 0; } to { transform: none; opacity: 1; } }
  .ag-show-moldura { border-radius: 16px; overflow: hidden; border: 4px solid #ffd23f; box-shadow: 0 0 0 4px #7a4a10, 0 14px 40px rgba(0,0,0,.6); }
  .ag-show-img { width: 100%; display: block; aspect-ratio: 16 / 9; object-fit: cover; animation: agZoom 9s ease-out forwards; }
  @keyframes agZoom { from { transform: scale(1.12); } to { transform: scale(1); } }
  .ag-show-txt { margin: -26px auto 0; position: relative; width: min(92%, 640px); background: #fff6e0; border: 3px solid #7a4a10; border-radius: 14px; padding: 10px 14px; text-align: center; color: #3a2210; box-shadow: 0 6px 18px rgba(0,0,0,.4); }
  .ag-show-txt b { font-size: clamp(17px, 3.4vw, 24px); display: block; }
  .ag-show-txt p { margin: 4px 0; }
  .ag-show-txt small { opacity: .6; }
  .ag-show-ret { position: absolute; left: 3%; top: 5%; display: flex; flex-direction: column; align-items: center; animation: agMedalhao .5s .3s cubic-bezier(.3,1.6,.5,1) both; }
  @keyframes agMedalhao { from { transform: scale(2.4); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  .ag-show-ret canvas { width: clamp(64px, 13vw, 104px); height: auto; aspect-ratio: 4 / 5; border-radius: 50% 50% 14px 14px; border: 4px solid #ffd23f; box-shadow: 0 0 0 3px #7a4a10, 0 6px 14px rgba(0,0,0,.5); background: radial-gradient(circle at 50% 35%, #8ae88a, #2e8a3a 70%); }
  .ag-show-ret b { margin-top: -10px; background: #7a4a10; color: #fff6e0; border-radius: 8px; padding: 1px 8px; font-size: 13px; position: relative; }
  .ag-carimbo { position: absolute; top: 12%; right: 6%; padding: 6px 18px; border: 6px solid #2aa84a; border-radius: 12px; color: #2aa84a; font-weight: 900; font-size: clamp(26px, 6vw, 54px); letter-spacing: .06em; background: rgba(255,255,255,.88); transform: rotate(-14deg); animation: agCarimbo .5s .45s cubic-bezier(.3,1.6,.5,1) both; }
  @keyframes agCarimbo { from { transform: rotate(-14deg) scale(3); opacity: 0; } to { transform: rotate(-14deg) scale(1); opacity: 1; } }
  .ag-p { position: absolute; top: -20px; width: 10px; height: 14px; border-radius: 2px; pointer-events: none; animation-name: agCai; animation-timing-function: linear; animation-iteration-count: infinite; }
  @keyframes agCai { from { transform: translateY(0) rotate(0); } to { transform: translateY(110vh) rotate(720deg); } }
  .ag-ef-moedas .ag-p { width: 22px; height: 22px; border-radius: 50%; background: radial-gradient(circle at 35% 35%, #fff6a0, #ffc21a 45%, #b07a00); border: 2px solid #8a5a00; }
  .ag-ef-flash .ag-p { width: 120px; height: 120px; border-radius: 50%; background: radial-gradient(circle, rgba(255,255,255,.95), rgba(255,255,255,0) 65%); animation-name: agFlash; animation-iteration-count: infinite; }
  @keyframes agFlash { 0%, 70%, 100% { opacity: 0; transform: scale(.4); } 80% { opacity: 1; transform: scale(1); } }
  @media (max-width: 560px) {
    .ag-cartoes { grid-template-columns: repeat(3, 1fr); gap: 5px; }
    .ag-cartao { padding: 4px 2px 6px; }
    .ag-cartao-img { width: 60px; height: 52px; }
    .ag-ol-img { width: 48px; height: 66px; }
    .ag-cartao b { font-size: 11.5px; } .ag-cartao small { font-size: 10px; }
    .ag-medalhas { grid-template-columns: repeat(2, 1fr); } .ag-album { grid-template-columns: repeat(2, 1fr); }
    .ag-estrada { height: 54px; } .ag-destino { width: 48px; height: 48px; }
    .ag-brasao { width: 38px; }
  }
  @media (prefers-reduced-motion: reduce) { .ag-p, .ag-embx, .ag-anda, .ag-anda-img, .ag-brasao, .ag-show-img { animation: none !important; } }
  `;
  document.head.append(st);
})();
