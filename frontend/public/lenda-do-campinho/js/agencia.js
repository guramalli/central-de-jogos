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
  [0, 'Empresário desconhecido', ''], [100, 'Empresário local', '⭐'], [450, 'Empresário regional', '⭐⭐'], [1600, 'Empresário nacional', '⭐⭐⭐'],
  [5000, 'Empresário internacional', '⭐⭐⭐⭐'], [15000, 'Superagente', '⭐⭐⭐⭐⭐']];
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
function agZerouCarreira() { try { const c = G.save.carreira; return !!(c && (c.titulosLiga || []).some(t => t.liga === CARR_TIERS[CARR_TIER_MAX].liga)); } catch (e) { return false; } }
function agZerouClube() { return !!(G.save && G.save.flags && G.save.flags.campeao_mundial_interclubes); }
function agLiberada() { const s = G.save; return !!s && ((s.nivel || 1) >= AG_NIVEL || (agZerouCarreira() && agZerouClube())); }
function agDados() {
  const s = G.save; if (!s) return null;
  if (!s.agencia || typeof s.agencia !== 'object') s.agencia = null;
  return s.agencia;
}
function agCria() {
  const s = G.save; const nome = (s.nome || 'Lenda').split(' ')[0].toUpperCase() + ' SPORTS';
  s.agencia = { nome, rep: 0, olheiros: { base: 1 }, missoes: [], achados: [], jogadores: [], eventos: [], titulos: {}, totais: { transf: 0, comissao: 0, descobertas: 0, vendaMax: 0 }, ultimo: Date.now(), seq: 1 };
  agEvento({ tipo: 'boasvindas', txt: '☀️ Bem-vindo(a) à sua agência! Mande o seu Olheiro de base procurar talentos no Bairro (aba 🔎 Talentos).' });
  return s.agencia;
}
function agNivelRep(a) { let k = 0; for (let i = 0; i < AG_REP.length; i++) if ((a || agDados()).rep >= AG_REP[i][0]) k = i; return k; }
function agRepTxt(a) { const k = agNivelRep(a); return `${AG_REP[k][2] || '☆'} ${AG_REP[k][1]}`; }
function agMaxJogadores(a) { return 3 + agNivelRep(a) * 2; }
function agGanhaRep(n, motivo) {
  const a = agDados(); const k0 = agNivelRep(a); a.rep = Math.round(a.rep + n);
  const k1 = agNivelRep(a); if (k1 > k0) { banner('⭐ ' + AG_REP[k1][1].toUpperCase(), 'Sua agência subiu de nível!'); som('nivel'); log(`🕴️ Agência: agora você é ${AG_REP[k1][1]}! Novas regiões e olheiros liberados.`, 'l-lvl'); }
}
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
function agAvisa() { try { const a = agDados(); const n = a ? a.eventos.filter(e => !e.visto).length : 0; for (const b of document.querySelectorAll('.btn-agencia')) b.dataset.n = n || ''; } catch (e) { } }
const agJog = id => agDados().jogadores.find(j => j.id === id);
function agClube(nivel) { const c = AG_CLUBES[clamp(nivel, 0, 4)]; const [nome, pais, cor] = agPega(c.nomes); return { nome, pais, cor, nivel: c.nivel }; }

/* ---------- o relógio: períodos e missões ---------- */
function agTick() {
  const s = G.save, a = agDados(); if (!s || !a || !agLiberada()) return;
  const agora = Date.now();
  // missões dos olheiros que terminaram
  for (const m of a.missoes.slice()) if (agora >= m.fim) {
    a.missoes.splice(a.missoes.indexOf(m), 1);
    const reg = AG_REGIOES.find(r => r.id === m.regiao), ol = AG_OLHEIROS.find(o => o[0] === m.olheiro);
    const n = agRi(1, ol[0] === 'base' ? 2 : 3), novos = Array.from({ length: n }, () => agNovoTalento(reg, ol));
    a.achados.push(...novos); a.achados = a.achados.slice(-10);
    a.totais.descobertas += n; agGanhaRep(n * 4, 'descoberta');
    const melhor = novos.reduce((x, y) => (y.potV[1] > x.potV[1] ? y : x));
    agEvento({ tipo: 'achado', txt: `🔎 ${ol[1]} voltou de ${reg.nome}: ${n} talento(s)! O melhor: ${melhor.nome}, ${melhor.idade} anos, ${AG_POS[melhor.pos][0]}, potencial estimado ${melhor.potV[0]}–${melhor.potV[1]}.` });
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
  if (j.ovr > antes + 1) { agHist(j, `evoluiu +${j.ovr - antes} (overall ${j.ovr})`); if (j.ovr - antes >= 3) agEvento({ tipo: 'evolucao', jog: j.id, txt: `📈 ${j.nome} evoluiu +${j.ovr - antes}! Overall agora: ${j.ovr}.` }); }
  // salário e comissão do período
  if (j.fase === 'pro' || j.fase === 'base') { const c = Math.round(j.salario * 3 * j.comissao / 100); if (c > 0) { G.save.ouro += c; a.totais.comissao += c; } }
  if (j.fase === 'escolinha') j.escolinha = (j.escolinha || 0) - 1, j.escolinha <= 0 && (j.fase = 'treino', agHist(j, 'terminou a temporada na escolinha'));
  // fama: jogando vai aparecendo
  if (j.fase === 'pro') j.fama = clamp((j.fama || 0) + Math.max(0, j.ovr - AG_CLUBES[j.clube.nivel].ovr) * 0.4 + agRnd(0, 2), 0, 100);
  // contrato acabando: o clube quer renovar (ou ele fica livre)
  if (j.fase === 'pro' && a.nPer >= j.contratoAte && !a.eventos.some(e => e.jog === j.id && e.tipo === 'contrato' && !e.feito)) { agPropostaContrato(j, j.clube, true); }
  // aposentadoria
  if (j.idade >= 35) { a.jogadores.splice(a.jogadores.indexOf(j), 1); agEvento({ tipo: 'info', txt: `👋 ${j.nome} pendurou as chuteiras aos 35 anos. Obrigado por tudo, craque!` }); return; }
  // acontecimentos (um de cada vez por jogador)
  if (a.eventos.some(e => e.jog === j.id && !e.feito && e.acoes)) return;
  const r = Math.random();
  if (r < 0.12 * P.prob) agProblema(j);
  else if (j.fase === 'pro' && !j.meuClube && r < 0.12 * P.prob + 0.18 && j.ovr >= AG_CLUBES[Math.min(4, j.clube.nivel + 1)].ovr - 3 && !(j.pers === 'leal' && Math.random() < 0.6)) agPropostaTransferencia(j);
  else if (j.fase === 'pro' && (j.fama || 0) > 25 && r > 0.85) agPatrocinio(j);
  else if (j.fase === 'pro' && r > 0.8 && j.ovr > AG_CLUBES[j.clube.nivel].ovr + 4) { j.fama += 5; agEvento({ tipo: 'info', jog: j.id, txt: `⭐ ${j.nome} foi o destaque da rodada pelo ${j.clube.nome}! A fama dele cresceu.` }); }
  else if ((j.fase === 'treino' || j.fase === 'escolinha') && j.idade >= 15.5 && r > 0.75) agEvento({ tipo: 'decisao', jog: j.id, txt: `🧒 ${j.nome} (${Math.floor(j.idade)} anos, overall ${j.ovr}) está pronto para o próximo passo. Que tal um TESTE num clube? (aba 👤 Meus jogadores)` });
}
// problemas pessoais (eventos pequenos, cada um com 2–3 escolhas)
function agProblema(j) {
  const valor = Math.max(30000, Math.round(agValor(j) * 0.01));
  const tipos = [
    { txt: `🚨 ${j.nome} faltou a três treinos e o clube está irritado.`, acoes: [['Conversar com ele', valor, () => { j.moral = Math.min(100, j.moral + 10); return 'Boa conversa: ele prometeu caprichar.'; }], ['Multar', 0, () => { j.moral -= 15; return 'Multado. Ficou chateado, mas foi treinar.'; }], ['Ignorar', 0, () => Math.random() < 0.5 ? (j.parado += 2, j.moral -= 10, 'Piorou: ficou 2 períodos sem evoluir.') : 'Passou. Desta vez.']] },
    { txt: `📱 ${j.nome} publicou uma foto polêmica nas redes sociais.`, acoes: [['Controlar a situação', valor, () => 'Tudo resolvido com um pedido de desculpas.'], ['Deixar passar', 0, () => Math.random() < 0.5 ? (j.fama = Math.max(0, (j.fama || 0) - 10), 'Pegou mal: a fama caiu.') : (j.fama = (j.fama || 0) + 6, 'Virou meme... e a fama subiu!')]] },
    { txt: `🏠 ${j.nome} está com saudade da família e quer voltar para casa.`, acoes: [['Ajudar (passagens para a família)', valor * 2, () => { j.moral = Math.min(100, j.moral + 20); return 'A família veio visitar. Ele está feliz de novo!'; }], ['Convencer a ficar', 0, () => Math.random() < 0.6 ? (j.moral -= 5, 'Ele ficou, meio tristinho.') : (j.moral -= 20, j.parado += 1, 'Ficou, mas desanimado.')], ['Ignorar', 0, () => { j.moral -= 25; return 'Ele ficou muito chateado com você.'; }]] },
    { txt: `🤕 ${j.nome} sentiu uma lesão leve no treino.`, acoes: [['Fisioterapia completa', valor * 1.5, () => 'Recuperação rápida, já está treinando!'], ['Esperar sarar', 0, () => { j.parado += 2; return 'Vai ficar 2 períodos parado.'; }]] },
  ];
  if (j.fase === 'pro' && (j.pers === 'ganancioso' || Math.random() < 0.3)) tipos.push({ txt: `💰 ${j.nome} quer um aumento de salário no ${j.clube.nome}.`, acoes: [['Negociar com o clube', 0, () => Math.random() < 0.55 ? (j.salario = Math.round(j.salario * 1.25), j.moral += 10, `O clube aceitou: salário agora ${agFmt(j.salario)} por mês.`) : (j.moral -= 10, 'O clube recusou o aumento.')], ['Pedir paciência', 0, () => { j.moral -= 12; return 'Ele aceitou esperar, contrariado.'; }]] });
  const t = agPega(tipos); agEvento({ tipo: 'problema', jog: j.id, txt: t.txt, acoes: t.acoes.map(([nome, custo]) => [nome, custo]), _fns: t.acoes.map(x => x[2]) });
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
    agHist(j, `aprovado no teste do ${c.nome}!`); agGanhaRep(15 + c.nivel * 10); banner('✅ APROVADO!', `${j.nome} → ${c.nome}`); som('nivel'); }
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
  agHist(j, `${ev.renova ? 'renovou' : 'assinou'} com o ${ev.clube.nome}`); agGanhaRep(ev.renova ? 10 : 30 + ev.clube.nivel * 15); som('moeda'); agTitulos();
}
function agVende(j, ev, valor) {
  const a = agDados(), com = Math.round(valor * Math.max(5, j.comissao || 10) / 100);
  G.save.ouro += com; a.totais.transf += valor; a.totais.comissao += com; a.totais.vendaMax = Math.max(a.totais.vendaMax, valor);
  j.clube = ev.clube; j.look.corRoupa = ev.clube.cor; j.fama = (j.fama || 0) + 10; j.salario = Math.round(AG_CLUBES[ev.clube.nivel].salario * (0.8 + Math.max(0, j.ovr - AG_CLUBES[ev.clube.nivel].ovr) * 0.05)); j.contratoAte = a.nPer + 12;
  (a.paises = a.paises || {})[ev.clube.pais] = 1;
  ev.feito = true; ev.resultado = `💼 TRANSFERÊNCIA FECHADA: ${j.nome} → ${ev.clube.nome} por ${agFmt(valor)}. Sua comissão: 💰 ${agFmt(com)} tostões!`;
  agHist(j, `vendido ao ${ev.clube.nome} por ${agFmt(valor)}`); agGanhaRep(20 + valor / 1e6 * 1.5); banner('💼 TRANSFERÊNCIA!', `${j.nome} → ${ev.clube.nome}`); som('moeda'); log('🕴️ ' + ev.resultado, 'l-loot'); agTitulos();
}
function agPatrocinioFecha(j, ev, valor) {
  const com = Math.round(valor * 0.2); G.save.ouro += com; agDados().totais.comissao += com; j.fama = (j.fama || 0) + 4;
  ev.feito = true; ev.resultado = `📣 Patrocínio fechado com ${ev.oferta.marca}: ${agFmt(valor)}. Sua parte: 💰 ${agFmt(com)} tostões.`; agHist(j, `patrocínio da ${ev.oferta.marca}`); agGanhaRep(8); som('moeda'); log('🕴️ ' + ev.resultado, 'l-loot');
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
  const a = agDados(); for (const [id, nome, , ok] of AG_TITULOS) if (!a.titulos[id] && ok(a)) { a.titulos[id] = Date.now(); banner(nome, 'Título de empresário conquistado!'); som('nivel'); log(`🏆 Título da Agência: ${nome}!`, 'l-lvl'); agGanhaRep(150); }
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
    el('div', {}, el('b', { class: 'ag-nome' }, `⭐ ${a.nome}`), el('small', {}, `${agRepTxt()} · ${fmt(a.rep)} pts de reputação`)),
    el('div', { class: 'ag-num' }, el('span', {}, `👤 ${a.jogadores.length}/${agMaxJogadores()} jogadores`), el('span', {}, `💼 ${agFmt(a.totais.transf)} em transferências`), el('span', {}, `💰 ${agFmt(a.totais.comissao)} de comissões`), el('span', {}, `🔎 ${a.totais.descobertas} descobertos`), el('span', { title: 'Cada período = 3 meses na vida dos jogadores' }, `⏳ próximo período em ${Math.ceil(prox / 60000)} min`)));
}
function abreAgencia(aba) {
  const s = G.save; if (!s) return;
  if (!agLiberada()) { abreModal(el('h2', {}, '⭐ LENDAS FC — AGÊNCIA'), el('p', {}, `🔒 A Agência abre no nível ${AG_NIVEL}... ou antes, se você zerar os outros modos:`), el('ul', {}, el('li', {}, `${agZerouCarreira() ? '✅' : '⬜'} Carreira: ser campeão da ${CARR_TIERS[CARR_TIER_MAX].liga}`), el('li', {}, `${agZerouClube() ? '✅' : '⬜'} Clube: ser campeão do Mundial Interclubes`)), el('p', { class: 'dica' }, '"Você já foi uma lenda dentro de campo. Agora descubra quem será a próxima." Aqui você vira EMPRESÁRIO: descobre garotos e garotas talentosos, cuida da carreira deles, negocia contratos e transferências.'), el('div', { class: 'opcoes' }, el('button', { class: 'btn', onclick: fechaModal }, 'Ok'))); return; }
  let a = agDados();
  if (!a) {
    abreModal(el('h2', {}, '⭐ LENDAS FC — AGÊNCIA'), el('p', { style: 'font-size:17px' }, '"Você já foi uma lenda dentro de campo. Agora descubra quem será a próxima."'),
      el('p', {}, 'Monte sua rede de olheiros, descubra talentos na várzea e nas escolinhas, coloque os garotos em testes, negocie contratos, venda para clubes do mundo inteiro... e construa a reputação de SUPERAGENTE.'),
      el('p', { class: 'dica' }, 'O tempo da agência anda no relógio de verdade: a cada 20 minutos passa um período (3 meses na vida dos jogadores), até com o jogo fechado.'),
      el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', onclick: () => { agCria(); salvar(); abreAgencia('hoje'); } }, '🕴️ Abrir minha agência'), el('button', { class: 'btn', onclick: fechaModal }, 'Agora não')));
    return;
  }
  agTick(); AG_ABA = aba || AG_ABA;
  const abas = [['hoje', '☀️ Hoje'], ['talentos', '🔎 Talentos'], ['jogadores', '👤 Meus jogadores'], ['negocios', '💼 Negociações'], ['agencia', '🏢 Agência']];
  const nav = el('div', { class: 'ag-abas' }, ...abas.map(([id, nome]) => { const n = id === 'hoje' ? a.eventos.filter(e => !e.visto).length : id === 'negocios' ? a.eventos.filter(e => e.acoes && !e.feito).length : 0; return el('button', { class: 'btn mini' + (AG_ABA === id ? ' amarelo' : ''), onclick: () => abreAgencia(id) }, nome + (n ? ` (${n})` : '')); }));
  const corpo = el('div', { class: 'ag-corpo' }, ({ hoje: agTelaHoje, talentos: agTelaTalentos, jogadores: agTelaJogadores, negocios: agTelaNegocios, agencia: agTelaAgencia })[AG_ABA]());
  abreModal.largo = true; abreModal(el('h2', {}, '⭐ LENDAS FC — AGÊNCIA'), agCabecalho(), nav, corpo, el('div', { class: 'opcoes' }, el('button', { class: 'btn', onclick: fechaModal }, 'Fechar')));
  if (AG_ABA === 'hoje') { for (const e of a.eventos) e.visto = true; agAvisa(); }
}
function agTelaHoje() {
  const a = agDados(); const n = a.eventos.filter(e => !e.visto).length;
  const box = el('div', {}, el('h3', {}, `☀️ BOM DIA, EMPRESÁRIO${n ? ` — ${n} acontecimento(s) novo(s)` : ''}`));
  if (!a.eventos.length) box.append(el('p', { class: 'vazio' }, 'Nada de novo por enquanto. Mande um olheiro procurar talentos!'));
  const lista = el('div', { class: 'lista' });
  for (const e of a.eventos.slice(0, 14)) {
    const j = e.jog && agJog(e.jog);
    const acoes = e.feito ? el('small', { class: 'ag-res' }, e.resultado || '✔ resolvido') : e.acoes === true ? el('button', { class: 'btn amarelo mini', onclick: () => abreAgencia('negocios') }, 'Ver proposta') :
      Array.isArray(e.acoes) ? el('div', { class: 'ag-acoes' }, ...e.acoes.map(([nome, custo], k) => el('button', { class: 'btn mini', onclick: () => { agResolveProblema(e, k); abreAgencia('hoje'); } }, nome + (custo ? ` (${agFmt(custo)})` : '')))) : '';
    lista.append(el('div', { class: 'linha-item ag-ev' + (e.visto ? '' : ' novo') }, j ? agRetrato(j, 44) : el('span', { class: 'ag-ic' }, '🕴️'), el('div', { class: 'nm' }, el('span', {}, e.txt), acoes)));
  }
  box.append(lista); return box;
}
function agTelaTalentos() {
  const a = agDados(), s = G.save, k = agNivelRep();
  const box = el('div');
  box.append(el('h3', {}, '🔎 Mandar um olheiro'));
  const regSel = el('select', {}, ...AG_REGIOES.map(r => el('option', { value: r.id, disabled: k < r.rep ? 'disabled' : null }, `${r.nome}${k < r.rep ? ` (🔒 ${AG_REP[r.rep][1]})` : ''}`)));
  const ols = AG_OLHEIROS.filter(o => a.olheiros[o[0]]);
  const olSel = el('select', {}, ...ols.map(o => el('option', { value: o[0] }, `${o[1]} — ${agFmt(o[4])} tostões, ${o[5]} min`)));
  const ocupados = new Set(a.missoes.map(m => m.olheiro));
  box.append(el('div', { class: 'ag-linha' }, 'Região: ', regSel, ' Olheiro: ', olSel, el('button', { class: 'btn amarelo', onclick: () => {
    const ol = AG_OLHEIROS.find(o => o[0] === olSel.value), reg = AG_REGIOES.find(r => r.id === regSel.value);
    if (!ol || !reg) return; if (ocupados.has(ol[0])) { log('Esse olheiro já está viajando.', 'l-sis'); return; }
    if (reg.fora && ol[0] !== 'internacional' && ol[0] !== 'lendario') { log('Para fora do Brasil, mande o olheiro internacional (ou o lendário).', 'l-sis'); return; }
    if (s.ouro < ol[4]) { log('Tostões insuficientes.', 'l-dano'); return; }
    s.ouro -= ol[4]; a.missoes.push({ olheiro: ol[0], regiao: reg.id, fim: Date.now() + ol[5] * 60000 }); log(`🔎 ${ol[1]} partiu para ${reg.nome}. Volta em ${ol[5]} minutos.`, 'l-xp'); salvar(); abreAgencia('talentos');
  } }, 'Enviar')));
  if (a.missoes.length) box.append(el('ul', { class: 'dica' }, ...a.missoes.map(m => el('li', {}, `${AG_OLHEIROS.find(o => o[0] === m.olheiro)[1]} em ${AG_REGIOES.find(r => r.id === m.regiao).nome}: volta em ${Math.max(1, Math.ceil((m.fim - Date.now()) / 60000))} min`))));
  box.append(el('h3', {}, `🧒 Talentos encontrados (${a.achados.length})`));
  if (!a.achados.length) box.append(el('p', { class: 'vazio' }, 'Nenhum talento esperando. Os olheiros trazem garotos e garotas de 14 a 16 anos.'));
  const lista = el('div', { class: 'lista' });
  for (const j of a.achados) {
    const custoAval = Math.max(80000, Math.round(agValor(j) * 0.4)), custoAss = Math.max(50000, Math.round(agValor(j) * 0.6));
    lista.append(el('div', { class: 'linha-item' }, agRetrato(j, 56),
      el('div', { class: 'nm' }, el('b', {}, `${j.nome} — ${j.idade} anos · ${AG_POS[j.pos][0]}`), el('small', {}, `Overall ${j.ovr} · ${agEstrelasPot(j)} · ${AG_PERS[j.pers].nome} · vai embora em ${7 - (j.espera || 0)} períodos`),
        el('div', { class: 'ag-acoes' },
          el('button', { class: 'btn mini', disabled: j.avaliado ? 'disabled' : null, onclick: () => { if (s.ouro < custoAval) { log('Tostões insuficientes.', 'l-dano'); return; } s.ouro -= custoAval; j.avaliado = true; const l2 = 2; j.potV = [clamp(j.pot - agRi(0, l2), 40, 99), clamp(j.pot + agRi(0, l2), 40, 99)]; log(`🔬 Avaliação de ${j.nome}: potencial ${j.potV[0]}–${j.potV[1]}.`, 'l-xp'); salvar(); abreAgencia('talentos'); } }, j.avaliado ? '🔬 Avaliado' : `🔬 Avaliação detalhada (${agFmt(custoAval)})`),
          el('button', { class: 'btn amarelo mini', onclick: () => { if (a.jogadores.length >= agMaxJogadores()) { log(`Sua agência só representa ${agMaxJogadores()} jogadores agora (suba a reputação).`, 'l-sis'); return; } if (s.ouro < custoAss) { log('Tostões insuficientes.', 'l-dano'); return; } s.ouro -= custoAss; a.achados.splice(a.achados.indexOf(j), 1); j.fase = 'treino'; agHist(j, 'assinou com a sua agência'); a.jogadores.push(j); agGanhaRep(6 + Math.max(0, j.pot - 75)); log(`✍️ ${j.nome} agora é representado(a) pela ${a.nome}!`, 'l-loot'); som('moeda'); salvar(); abreAgencia('jogadores'); } }, `✍️ Representar (${agFmt(custoAss)})`),
          el('button', { class: 'btn mini', onclick: () => { a.achados.splice(a.achados.indexOf(j), 1); salvar(); abreAgencia('talentos'); } }, 'Dispensar')))));
  }
  box.append(lista); return box;
}
function agTelaJogadores() {
  const a = agDados(), s = G.save; const box = el('div');
  if (!a.jogadores.length) { box.append(el('p', { class: 'vazio' }, 'Você ainda não representa ninguém. Encontre talentos na aba 🔎 Talentos.')); return box; }
  for (const j of a.jogadores) {
    const atr = el('div', { class: 'ag-atr' }, ...Object.entries(AG_ATR).map(([k, n]) => el('span', {}, `${n}: ${j.atr[k]}`)));
    const acoes = el('div', { class: 'ag-acoes' });
    if (j.fase === 'treino' || j.fase === 'achado') {
      const custoEsc = Math.max(150000, Math.round(agValor(j) * 0.5));
      acoes.append(el('button', { class: 'btn mini', onclick: () => { if (s.ouro < custoEsc) { log('Tostões insuficientes.', 'l-dano'); return; } s.ouro -= custoEsc; j.fase = 'escolinha'; j.escolinha = 4; agHist(j, 'entrou numa escolinha (1 ano)'); salvar(); abreAgencia('jogadores'); } }, `🏫 Escolinha por 1 ano (${agFmt(custoEsc)})`));
      if (j.idade >= 15 && j.testePer === a.nPer) acoes.append(el('small', {}, '🏟️ Já fez um teste neste período. Próximo teste no próximo período.'));
      else if (j.idade >= 15) for (const c of agClubesParaTeste(j)) acoes.append(el('button', { class: 'btn mini amarelo', onclick: () => { agFazTeste(j, c); abreAgencia('jogadores'); } }, `🏟️ Teste no ${c.nome} (${c.chance}%)`));
      else acoes.append(el('small', {}, 'Testes em clubes a partir dos 15 anos.'));
    }
    if (j.fase === 'base' && j.idade >= 16.5 && !a.eventos.some(e => e.jog === j.id && e.tipo === 'contrato' && !e.feito)) acoes.append(el('button', { class: 'btn mini amarelo', onclick: () => { agPropostaContrato(j, j.clube, false); abreAgencia('negocios'); } }, '📑 Pedir o contrato profissional'));
    if (j.fase === 'pro') acoes.append(el('small', {}, `Salário ${agFmt(j.salario)}/mês · comissão ${j.comissao}% · contrato: ${Math.max(0, Math.ceil((j.contratoAte - (a.nPer || 0)) / 4))} ano(s) · valor ${agFmt(agValor(j))}`));
    acoes.append(el('button', { class: 'btn mini', onclick: () => { if (!confirm(`Encerrar a representação de ${j.nome}?`)) return; a.jogadores.splice(a.jogadores.indexOf(j), 1); salvar(); abreAgencia('jogadores'); } }, 'Encerrar'));
    box.append(el('div', { class: 'linha-item ag-jog' }, agRetrato(j, 72),
      el('div', { class: 'nm' }, el('b', {}, `${j.nome} — ${Math.floor(j.idade)} anos · ${AG_POS[j.pos][0]} · Overall ${j.ovr}`), el('small', {}, `${agFaseTxt(j)} · ${agEstrelasPot(j)} · ${AG_PERS[j.pers].nome} · moral ${Math.round(j.moral)} · fama ${Math.round(j.fama || 0)}${j.parado ? ' · 🤕 parado' : ''}`),
        atr, acoes, j.hist.length ? el('small', { class: 'ag-hist' }, '📜 ' + j.hist.slice(0, 3).join(' · ')) : '')));
  }
  return box;
}
function agTelaNegocios() {
  const a = agDados(); const box = el('div'); const abertas = a.eventos.filter(e => e.acoes === true && !e.feito);
  if (!abertas.length) { box.append(el('p', { class: 'vazio' }, 'Nenhuma proposta na mesa. Elas chegam quando seus jogadores se destacam.')); return box; }
  for (const e of abertas) {
    const j = agJog(e.jog); if (!j) { e.feito = true; continue; }
    const card = el('div', { class: 'linha-item ag-neg' }, agRetrato(j, 64)); const nm = el('div', { class: 'nm' }, el('b', {}, e.txt)); card.append(nm);
    const o = e.oferta;
    if (e.tipo === 'contrato') {
      const sal = el('input', { type: 'number', value: o.salario, step: Math.max(1000, Math.round(o.salario / 20)), style: 'width:120px' });
      const anos = el('select', {}, ...[1, 2, 3, 4, 5].map(n => el('option', { value: n, selected: n === o.anos ? 'selected' : null }, `${n} anos`)));
      const com = el('select', {}, ...[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(n => el('option', { value: n, selected: n === o.com ? 'selected' : null }, `${n}%`)));
      nm.append(el('div', { class: 'ag-linha' }, 'Salário/mês: ', sal, ' Duração: ', anos, ' Sua comissão: ', com),
        el('div', { class: 'ag-acoes' },
          el('button', { class: 'btn amarelo mini', onclick: () => { agFechaContrato(j, e, { salario: o.salario, anos: o.anos, com: o.com }); salvar(); abreAgencia('negocios'); } }, '✅ Aceitar'),
          el('button', { class: 'btn mini', onclick: () => { agNegocia(e, { salario: +sal.value || o.salario, anos: +anos.value, com: +com.value }); abreAgencia('negocios'); } }, '💬 Contraproposta'),
          el('button', { class: 'btn mini', onclick: () => { e.feito = true; e.resultado = 'Você recusou a proposta.'; if (e.renova) { j.fase = 'treino'; j.clube = null; j.salario = 0; } salvar(); abreAgencia('negocios'); } }, '❌ Recusar')));
    } else {
      const val = el('input', { type: 'number', value: Math.round(o.valor * 1.2), step: Math.max(1000, Math.round(o.valor / 20)), style: 'width:140px' });
      const aceitar = () => { if (e.tipo === 'transferencia') agVende(j, e, o.valor); else agPatrocinioFecha(j, e, o.valor); salvar(); abreAgencia('negocios'); };
      nm.append(el('small', {}, e.tipo === 'transferencia' ? `Valor de mercado estimado: ${agFmt(agValor(j))} · comissão ${Math.max(5, j.comissao || 10)}%` : 'Sua parte: 20% do patrocínio.'),
        el('div', { class: 'ag-acoes' },
          el('button', { class: 'btn amarelo mini', onclick: aceitar }, e.tipo === 'transferencia' ? '✅ Vender' : '✅ Aceitar'),
          el('span', {}, ' Pedir: '), val, el('button', { class: 'btn mini', onclick: () => { agNegocia(e, { valor: +val.value || o.valor }); abreAgencia('negocios'); } }, '💬 Negociar'),
          el('button', { class: 'btn mini', onclick: () => { e.feito = true; e.resultado = 'Você recusou.'; salvar(); abreAgencia('negocios'); } }, '❌ Recusar')));
    }
    box.append(card);
  }
  return box;
}
function agTelaAgencia() {
  const a = agDados(), s = G.save, k = agNivelRep(); const box = el('div');
  const prox = AG_REP[k + 1];
  box.append(el('p', {}, `${agRepTxt()}${prox ? ` — faltam ${fmt(prox[0] - a.rep)} pontos para ${prox[1]}` : ' — o topo!'} · Representa até ${agMaxJogadores()} jogadores.`));
  box.append(el('h3', {}, '🔎 Olheiros'));
  const lo = el('div', { class: 'lista' });
  for (const o of AG_OLHEIROS) {
    const tem = a.olheiros[o[0]], trava = k < o[2];
    lo.append(el('div', { class: 'linha-item' + (trava ? ' bloq' : '') }, el('div', { class: 'nm' }, el('b', {}, o[1]), el('small', {}, `Missão: ${agFmt(o[4])} tostões, ${o[5]} min · ${o[0] === 'base' ? 'encontra jogadores comuns' : o[0] === 'especialista' ? 'mais chance de achar talentos' : o[0] === 'internacional' ? 'vai à América do Sul e à Europa' : 'chance pequena de achar um FENÔMENO'}`)),
      tem ? el('b', {}, '✔ Contratado') : trava ? el('small', {}, `🔒 ${AG_REP[o[2]][1]}`) : el('button', { class: 'btn amarelo mini', onclick: () => { if (s.ouro < o[3]) { log('Tostões insuficientes.', 'l-dano'); return; } s.ouro -= o[3]; a.olheiros[o[0]] = 1; log(`🕴️ ${o[1]} contratado!`, 'l-loot'); salvar(); abreAgencia('agencia'); } }, `Contratar (${agFmt(o[3])})`)));
  }
  box.append(lo, el('h3', {}, '🏆 Títulos'));
  box.append(el('div', { class: 'lista' }, ...AG_TITULOS.map(([id, nome, desc]) => el('div', { class: 'linha-item' + (a.titulos[id] ? '' : ' bloq') }, el('div', { class: 'nm' }, el('b', {}, `${a.titulos[id] ? '✅' : '⬜'} ${nome}`), el('small', {}, desc))))));
  box.append(el('p', { class: 'dica' }, 'Os profissionais que você representa aparecem no Mercado do seu clube (modo Time) — dá para contratar os seus próprios craques! (Cada craque só aceita um clube à altura dele.)'));
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
    const lista = document.querySelector('#topo .tb-lista');
    if (lista && !document.getElementById('btnAgencia')) lista.prepend(el('button', { class: 'btn btn-agencia', id: 'btnAgencia', type: 'button', role: 'menuitem', onclick: () => abreAgencia() }, '🕴️ Agência (empresário)'));
    const grade = document.querySelector('#celMenu .cm-grade');
    if (grade && !document.getElementById('cmAgencia')) grade.append(el('button', { class: 'btn cm-bt btn-agencia', id: 'cmAgencia', type: 'button', onclick: () => abreAgencia() }, el('span', { class: 'cm-ic' }, '🕴️'), 'Agência'));
    agAvisa();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(poe, 0)); else setTimeout(poe, 0);
  const _iniAg = iniciarJogo;
  iniciarJogo = async function (...a) { const r = await _iniAg.apply(this, a); poe(); setTimeout(() => { try { const n0 = agDados() ? agDados().eventos.filter(e => !e.visto).length : 0; agTick(); const n = agDados() ? agDados().eventos.filter(e => !e.visto).length : 0; if (n > 0 && n !== n0 || n > 2) log(`🕴️ Agência: ${n} novidade(s) esperando por você (☰ Mais → Agência).`, 'l-xp'); } catch (e) { } }, 3000); return r; };
  setInterval(() => { try { if (G.rodando && agDados()) { const n0 = agDados().eventos.length; agTick(); if (agDados().eventos.length > n0) { const ev = agDados().eventos[0]; log('🕴️ ' + ev.txt, 'l-xp'); } } } catch (e) { } }, 15000);
  // liberou (nível 400, ou zerou Carreira + Clube): a novidade
  const _subiuAg = subiuNivel;
  const agConfereLibera = () => { try { const s = G.save; if (s && s.flags && agLiberada() && !s.flags.agencia_avisada) { s.flags.agencia_avisada = true; setTimeout(() => { banner('⭐ LENDAS FC — AGÊNCIA', 'O modo Empresário foi liberado!'); log('🕴️ AGÊNCIA LIBERADA! Agora você pode ser EMPRESÁRIO: ☰ Mais → 🕴️ Agência.', 'l-lvl'); }, 2500); } } catch (e) { } };
  subiuNivel = function () { const r = _subiuAg.apply(this, arguments); agConfereLibera(); return r; };
  setInterval(agConfereLibera, 20000); // campeão da Liga da Coroa / do Mundial acontece fora do subiuNivel
  const st = document.createElement('style');
  st.textContent = `
  .btn-agencia[data-n]:not([data-n=""])::after { content: attr(data-n); margin-left: 6px; background: #e0302a; color: #fff; border-radius: 9px; padding: 0 6px; font-size: 11px; font-weight: 800; }
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
  `;
  document.head.append(st);
})();
