/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   📐 AGÊNCIA 3.0 — ETAPA 1: MODELO DE DADOS (v335). Segue o documento do dono "Minigame Empresário de
   Futebol — Design Detalhado". Aqui ficam SÓ os dados e as fórmulas (nada de tela), para dar para testar
   tudo sem abrir janelas (_teste/s20_agencia_modelo.js):
   - escala do design: atributos 1–20, potencial P de 0,5 a 5 estrelas (escondido), 6 traços 0–100;
   - olheiros com atributos (olho técnico, leitura de caráter, rede de contatos, especialidade, salário, lealdade);
   - famílias com arquétipo e 2 necessidades ocultas (principal peso 2, secundária peso 1);
   - agência com reputação 0–100, 5 níveis (pontos + metas, decisão do dono) e semanas de 5 min no relógio;
   - a conversão das agências antigas (v323–v334) para o formato novo, sem perder jogador, Hall nem álbum.
   ATENÇÃO: nesta etapa NADA é ligado no jogo (AGM_ATIVO = false): a tela continua a da v333/v334.
   A conversão só roda quando a tela nova entrar (Etapa 2). Carregar DEPOIS de agencia.js.
   ============================================================ */
// Etapa 2: liga SÓ no modo de teste (localStorage rac_agencia3 = '1') até todas as etapas ficarem prontas; no fim vira true
const AGM_ATIVO = (() => { try { return localStorage.getItem('rac_agencia3') === '1'; } catch (e) { return false; } })();
const AGM_VERSAO = 2;
const AGM_SEMANA_MS = 5 * 60000, AGM_MAX_SEMANAS = 120; // decisão do dono: 1 semana = 5 min de relógio; fechado conta até 10 h
const AGM_VALOR_BASE = 1000000; // o design usa 50.000 (R$); ajustado à economia de tostões do jogo

/* ---------- tabelas ---------- */
const AGM_ATR = { fin: '🎯 Finalização', pas: '🎽 Passe', dri: '🌀 Drible', mar: '🛡️ Marcação', fis: '💪 Físico', vel: '⚡ Velocidade', ref: '🧤 Reflexos', psc: '📍 Posicionamento' };
const AGM_ATR_LINHA = ['fin', 'pas', 'dri', 'mar', 'fis', 'vel'], AGM_ATR_GOL = ['ref', 'pas', 'psc', 'mar', 'fis', 'vel']; // goleiro troca Finalização e Drible
const AGM_POS = { // [nome, pesos do overall]
  GOL: ['Goleiro', { ref: 3, psc: 3, fis: 1, pas: 1, vel: 0.5, mar: 0.5 }],
  ZAG: ['Zagueiro', { mar: 3, fis: 2.5, vel: 1, pas: 1, dri: 0.5, fin: 0.3 }],
  LAT: ['Lateral', { vel: 2.5, mar: 2, pas: 1.5, fis: 1.5, dri: 1, fin: 0.5 }],
  VOL: ['Volante', { mar: 3, pas: 2.5, fis: 1.5, vel: 1, dri: 1, fin: 0.5 }],
  MEI: ['Meia', { pas: 3, dri: 2, fin: 1.5, vel: 1, fis: 1, mar: 1 }],
  ATA: ['Atacante', { fin: 3, vel: 2, dri: 2, fis: 1, pas: 1, mar: 0.5 }],
};
const AGM_TRACOS = { // [nome, quando alto, quando baixo]
  disciplina: ['Disciplina', 'evolui mais rápido no treino', 'falta treino, cai em eventos de balada'],
  ambicao: ['Ambição', 'aceita desafios, quer ir para a Europa cedo', 'prefere ficar perto de casa'],
  temperamento: ['Temperamento', 'expulsões, brigas, polêmicas', 'calmo sob provocação'],
  estabilidade: ['Estabilidade emocional', 'rende bem em peneiras e jogos grandes', 'trava sob pressão'],
  saudade: ['Saudade de casa', 'sofre em transferências para longe', 'adapta-se rápido'],
  lealdade: ['Lealdade ao agente', 'resiste a agentes rivais', 'ouve propostas de outros'],
};
const AGM_ESPECIAIS = {
  craque_varzea: ['⚽ Craque de várzea', '+drible, −tática'],
  filho_ex: ['👨‍👦 Filho de ex-jogador', 'família exigente, +visibilidade'],
  pe_quente: ['🔥 Pé quente', '+chance em jogos decisivos'],
  estudioso: ['📚 Estudioso', 'família valoriza escola, +disciplina'],
  baladeiro: ['🌙 Baladeiro', 'eventos noturnos frequentes'],
};
const AGM_NECESSIDADES = { dinheiro: '💰 Dinheiro', estudo: '📚 Estudo', proximidade: '🏠 Proximidade', seguranca: '🛡️ Segurança', status: '⭐ Status', transparencia: '📄 Transparência' };
const AGM_ARQUETIPOS = { // [nome, necessidades prováveis, o que irrita, se bem atendido, parentes possíveis]
  pai_ambicioso: ['Pai ambicioso', ['dinheiro', 'status'], 'promessas vagas', 'aceita comissão maior', ['pai']],
  mae_protetora: ['Mãe protetora', ['seguranca', 'estudo'], 'falar de dinheiro cedo', 'confiança inicial alta depois do contrato', ['mae']],
  avo: ['Criado pela avó', ['proximidade', 'seguranca'], 'pressa, pressão', 'lealdade máxima ao agente', ['avo_f', 'avo_m']],
  desconfiada: ['Família desconfiada', ['transparencia'], 'cláusulas longas', 'vira referência e indica outros garotos', ['mae', 'pai', 'tia']],
  tio: ['Tio "empresário"', ['dinheiro'], 'ser ignorado', 'some da história, mas cobra depois', ['tio']],
  estruturada: ['Família estruturada', ['status', 'estudo'], 'plano sem detalhes', 'aceita contrato longo', ['mae', 'pai']],
};
const AGM_REGIOES = { // [nome, custo por semana de missão, chance de joia (4★+), rival (×), nível da agência, arquétipos mais comuns, piso de P]
  varzea: ['🏘️ Várzea da cidade', 10000, 0.03, 1.0, 1, ['pai_ambicioso', 'avo', 'tio', 'mae_protetora'], 0.5],
  interior: ['🌾 Interior', 25000, 0.05, 0.5, 1, ['avo', 'mae_protetora', 'desconfiada'], 0.5],
  nordeste: ['🌵 Nordeste', 30000, 0.07, 1.0, 2, ['avo', 'mae_protetora', 'pai_ambicioso'], 0.5],
  escolinhas: ['🏫 Escolinhas particulares', 60000, 0.04, 1.0, 2, ['estruturada', 'pai_ambicioso', 'mae_protetora'], 1.5],
  campeonatos: ['🏆 Campeonatos de base', 80000, 0.08, 1.8, 3, ['pai_ambicioso', 'estruturada', 'tio', 'desconfiada'], 1.0],
};
const AGM_OLHEIRO_NIVEIS = { // [nome, faixa dos atributos, nível da agência para contratar, preço para contratar]
  iniciante: ['🧢 Iniciante', [4, 8], 1, 50000], regional: ['🎯 Regional', [8, 12], 2, 2500000],
  nacional: ['🌎 Nacional', [12, 16], 4, 20000000], lendario: ['👑 Lendário', [16, 20], 5, 120000000],
};
// níveis da agência (reputação 0–100) — o design + as metas concretas (decisão do dono: pontos E metas)
const AGM_NIVEIS = [null, // [reputação, nome, máx. de jogadores, o que libera]
  [0, 'Escritório de bairro', 2, 'olheiros Iniciantes, várzea e interior'],
  [20, 'Agência regional', 3, 'olheiros Regionais, Nordeste e escolinhas, 4 ações por semana'],
  [40, 'Agência conhecida', 4, 'campeonatos de base, convites de clubes grandes'],
  [65, 'Agência nacional', 5, 'olheiros Nacionais, patrocínios nacionais'],
  [85, 'Agência internacional', 6, 'olheiro Lendário, contatos na Europa'],
];
const AGM_METAS = [null, null, // [texto, (a) => [atual, alvo]] — para chegar ao nível k
  [['Assine com 2 garotos', a => [a.marcos.assinados, 2]], ['Tenha 1 garoto aprovado numa peneira', a => [a.marcos.aprovados, 1]]],
  [['Tenha 3 aprovações em peneiras ou testes', a => [a.marcos.aprovados, 3]], ['Coloque 1 garoto na base de um clube médio ou grande', a => [a.marcos.baseMedio, 1]], ['Resolva bem 3 acontecimentos', a => [a.marcos.bons, 3]]],
  [['Consiga 2 contratos profissionais', a => [a.marcos.contratos, 2]], ['Feche 1 patrocínio', a => [a.marcos.patroc, 1]], ['Feche 1 transferência', a => [a.marcos.transf, 1]]],
  [['Venda 1 jogador para o exterior', a => [a.marcos.fora, 1]], ['Tenha um jogador com overall 16 ou mais', a => [agmOvrMax(a), 16]], ['Forme 1 Lenda da agência', a => [a.lendas.length, 1]]],
];
const AGM_REP_GANHO = { peneira: 2, contratoPro: 5, vendaMin: 5, vendaMax: 20, rompeu: -8, familiaInsatisfeita: -4 };
const AGM_CLUBES_BASE = { // degraus da base (13–17 anos)
  pequeno: ['Pequeno', 8, 0, 'ajuda de custo, pouca visibilidade', 1.0],
  medio: ['Médio', 11, 30, 'alojamento, +visibilidade semanal', 1.0],
  grande: ['Grande', 13, 60, 'treino melhor (ganho ×1,3), a família ganha Status', 1.3],
}; // [nome, overall mínimo, visibilidade mínima, contrato de base, multiplicador do treino]
const AGM_PATROCINIOS = { // [nome, visibilidade mínima, pagamento por semana, obrigação (1 ação a cada N semanas)]
  loja: ['Loja local', 20, 0, 4], regional: ['Marca regional', 45, 30000, 3], nacional: ['Marca nacional', 70, 150000, 2], global: ['Marca global', 90, 800000, 1],
};
const AGM_TERMOS = { // termo do contrato com a família → necessidades que ele atende
  comissao: ['dinheiro'], duracao: ['transparencia'], adiantamento: ['dinheiro'], ajuda: ['dinheiro', 'seguranca'],
  bolsa: ['estudo'], saida: ['transparencia'], restricao: ['proximidade'], acompanhante: ['seguranca'],
};

/* ---------- utilidades ---------- */
const agmMeia = v => Math.round(v * 2) / 2;                     // arredonda para meia estrela
const agmUm = v => Math.round(v * 10) / 10;                      // uma casa decimal (atributos guardam frações do treino)
const agmIdade = j => j.idadeSem / 52;                           // idade em anos (o jogo guarda em semanas)
const agmAtrDe = pos => pos === 'GOL' ? AGM_ATR_GOL : AGM_ATR_LINHA;
const agmTraco = () => clamp(Math.round((Math.random() + Math.random()) * 50), 0, 100); // 0–100, mais gente no meio
function agmNivelDeRep(rep) { let k = 1; for (let i = 1; i < AGM_NIVEIS.length; i++) if (rep >= AGM_NIVEIS[i][0]) k = i; return k; }
function agmOvrMax(a) { return Math.max(0, ...a.jogadores.map(j => Math.max(j.ovrMax || 0, agmOverall(j))), ...a.lendas.map(l => l.ovr || 0)); }

/* ---------- as fórmulas do design ---------- */
// margem de erro do olheiro (estrelas); reobservar multiplica por 0,6
function agmMargem(olho, reobs = 0) { return (0.25 + (20 - clamp(olho, 1, 20)) * 0.1) * Math.pow(0.6, reobs); }
// relatório: centro (P + ruído de −m/2 a +m/2) ± m, arredondado para meia estrela
function agmFaixa(P, m) { const c = P + agRnd(-m / 2, m / 2); return { c: clamp(agmMeia(c), 0.5, 5), m: Math.max(0.5, agmMeia(m)), mr: m, lo: clamp(agmMeia(c - m), 0.5, 5), hi: clamp(agmMeia(c + m), 0.5, 5) }; } // mr = margem de verdade (sem arredondar)
function agmTeto(P) { return 8 + P * 2.4; }                     // 5★ chega a 20; 2★ para em 12,8
function agmOverall(j) { const p = AGM_POS[j.pos][1]; let s = 0, t = 0; for (const k of agmAtrDe(j.pos)) { s += (j.atr[k] || 0) * (p[k] || 0.5); t += p[k] || 0.5; } return agmUm(s / t); }
function agmFIdadeTreino(anos) { return anos < 16 ? 1.3 : anos < 19 ? 1.0 : anos < 22 ? 0.7 : anos < 30 ? 0.3 : 0; }
// ganho de um treino: base × Disciplina/50 × f(idade) × (1 − atributo/teto)
function agmGanho(j, at, base, mult = 1) { return Math.max(0, base * (j.pers.disciplina / 50) * agmFIdadeTreino(agmIdade(j)) * (1 - (j.atr[at] || 0) / agmTeto(j.P)) * mult); }
function agmCandidatos(rede, semanas) { return 1 + Math.floor(rede / 5) + Math.floor(semanas / 2); }
// decisão da família: Confiança + Σ(termo atende × peso × 10) − (comissão − 10) × 2 → >70 aceita, 50–70 contraproposta, <50 recusa (+15 com rival)
function agmNotaFamilia(f, termos) {
  const atende = new Set(); for (const [t, ns] of Object.entries(AGM_TERMOS)) if (agmTermoAtende(t, termos)) ns.forEach(n => atende.add(n));
  const peso = n => n === f.need[0] ? 2 : n === f.need[1] ? 1 : 0;
  let nota = f.confianca; for (const n of atende) nota += peso(n) * 10;
  nota -= ((termos.comissao || 10) - 10) * 2;
  const lim = f.rival ? 15 : 0;
  return { nota: Math.round(nota), decisao: nota > 70 + lim ? 'aceita' : nota >= 50 + lim ? 'contraproposta' : 'recusa' };
}
function agmTermoAtende(t, T) { // quando cada termo "atende" a necessidade
  if (t === 'comissao') return (T.comissao || 10) <= 8; if (t === 'duracao') return T.anos != null && T.anos <= 2;
  if (t === 'adiantamento') return (T.adiantamento || 0) > 0; if (t === 'ajuda') return (T.ajuda || 0) > 0;
  return !!T[t];
}
function agmChancePeneira(j, at, instr) { // por rodada: (atributo + Forma/10 + Estabilidade/20) / 30, ± instrução
  const p = ((j.atr[at] || 0) + j.estado.forma / 10 + j.pers.estabilidade / 20) / 30;
  return clamp(p + (instr === 'simples' ? 0.05 : instr === 'arrisca' ? -0.10 : 0), 0.02, 0.98);
}
function agmRiscoLesao(fadiga) { return Math.max(0, fadiga - 70) * 0.02; }
function agmValor(j) { // 1,35^(overall − 8) × f(idade) × (0,5 + Visibilidade/100)
  const a = agmIdade(j), f = a <= 20 ? 1.5 : a <= 23 ? 1.2 : a <= 30 ? 1.0 : Math.max(0.3, 1 - (a - 30) * 0.12);
  return Math.round(AGM_VALOR_BASE * Math.pow(1.35, agmOverall(j) - 8) * f * (0.5 + (j.visib || 0) / 100));
}
function agmChanceRival(P, regiao) { return clamp((P / 5) * 0.45 * (AGM_REGIOES[regiao] ? AGM_REGIOES[regiao][3] : 1), 0, 0.9); } // proporcional ao potencial REAL: vira pista
function agmAcoesSemana(nivel) { return 2 + nivel; }            // 3 no nível 1, +1 por nível
function agmMaxJogadores(nivel) { return AGM_NIVEIS[clamp(nivel, 1, 5)][2]; }

/* ---------- criação ---------- */
function agmNovoOlheiro(nivel, a) {
  const [, [lo, hi]] = AGM_OLHEIRO_NIVEIS[nivel], at = () => agRi(lo, hi), menina = Math.random() < 0.4;
  const o = { id: 'ol' + (a ? a.seq++ : Date.now()), nivel, nome: `${menina ? 'Dona' : 'Seu'} ${agPega(menina ? ['Rita', 'Bete', 'Cida', 'Nice', 'Vera', 'Lena'] : ['Tonho', 'Jair', 'Baiano', 'Zico', 'Dedé', 'Bira', 'Nenê'])}`, menina,
    olho: at(), carater: at(), rede: at(), especialidade: agPega(Object.keys(AGM_REGIOES)), lealdade: agRi(55, 90), missao: null };
  o.salario = agmSalarioOl(o); o.exp = 0;
  return o;
}
function agmNovaFamilia(j, regiao, arqForcado) {
  const reg = AGM_REGIOES[regiao] || AGM_REGIOES.varzea, arq = arqForcado || (Math.random() < 0.7 ? agPega(reg[5]) : agPega(Object.keys(AGM_ARQUETIPOS)));
  const A = AGM_ARQUETIPOS[arq], prov = A[1], todas = Object.keys(AGM_NECESSIDADES);
  const principal = Math.random() < 0.75 ? agPega(prov) : agPega(todas);
  const sec = agPega([...prov, ...todas].filter(n => n !== principal));
  const par = agPega(A[4]), P = (typeof AG_PARENTES !== 'undefined' && AG_PARENTES[par]) || ['Dona', 'mãe', 1], f = !!P[2], idoso = par.startsWith('avo');
  return { arq, par, need: [principal, sec], sabe: {}, confianca: 0, paciencia: 5, rival: false,
    nome: `${P[0]} ${agPega(f ? ['Cida', 'Rosa', 'Fátima', 'Lúcia', 'Graça', 'Márcia', 'Sônia', 'Zezé', 'Lourdes', 'Neusa'] : ['Zé', 'Antônio', 'Carlos', 'Jorge', 'Tião', 'Raimundo', 'Valdir', 'Edson', 'Nonato'])}`,
    look: { tipo: 'humano', corpo: f ? 'f' : 'm', alt: 1.7, pele: j.look.pele, cabelo: agPega(f ? ['cabelo-coque', 'cabelo-liso-longo', 'cabelo-cacheado', 'cabelo-rabo'] : ['cabelo-curto', 'cabelo-raspado', 'cabelo-cacheado']),
      corCabelo: idoso ? 'grisalho' : j.look.corCabelo, roupa: agPega(['roupa-camiseta', 'roupa-xadrez', 'roupa-moletom', 'roupa-regata']), corRoupa: agPega(['#d8603a', '#3a8ad8', '#e0b030', '#7a4ab0', '#3aa070', '#c03a5a']), baixo: f ? 'baixo-saia' : 'baixo-jeans' } };
}
// um candidato encontrado por um olheiro numa região (filtro opcional: posição e idade)
function agmNovoCandidato(a, regiao, ol, filtro = {}) {
  const reg = AGM_REGIOES[regiao], menina = Math.random() < 0.35, pos = filtro.pos || agPega(Object.keys(AGM_POS));
  // potencial real P (0,5–5): a maioria é comum; a "joia" (4★+) sai com a chance da região
  const P = Math.random() < reg[2] ? agmMeia(agRnd(4, 5)) : clamp(agmMeia(reg[6] + Math.pow(Math.random(), 1.4) * (3.5 - reg[6])), 0.5, 3.5);
  const anos = filtro.idade ? clamp(filtro.idade, 13, 16) : agRi(13, 16);
  const j = { id: 'ag' + (a ? a.seq++ : Date.now()), v: AGM_VERSAO, nome: `${agPega(menina ? AG_NOMES_F : AG_NOMES_M)} ${agPega(AG_SOBRENOMES)}`, menina, pos, idadeSem: anos * 52 + agRi(0, 51), regiao,
    P, atr: {}, faixa: null, pers: {}, revelados: [], especiais: [], estado: { moral: 70, forma: 60, fadiga: 0 }, lesao: 0, visib: 0, confianca: 0,
    fase: 'descoberta', clube: null, contrato: null, salario: 0, patrocinios: [], rotina: [], hist: [], ovrMax: 0, vendaMax: 0, achadoSem: a ? a.semana : 0,
    look: { tipo: 'humano', corpo: menina ? 'f' : 'm', alt: 1.55, pele: agPega(['pele-clara', 'pele-media', 'pele-morena', 'pele-negra', 'pele-retinta']), cabelo: agPega(menina ? CABELOS_F : CABELOS_M),
      corCabelo: agPega(['preto', 'castanho', 'loiro', 'ruivo', 'preto']), roupa: 'roupa-futebol', corRoupa: '#f4f4f8', baixo: 'baixo-shorts' } };
  for (const t of Object.keys(AGM_TRACOS)) j.pers[t] = agmTraco();
  if (Math.random() < 0.12) j.especiais.push(agPega(Object.keys(AGM_ESPECIAIS)));
  if (j.especiais.includes('estudioso')) j.pers.disciplina = Math.min(100, j.pers.disciplina + 15);
  if (j.especiais.includes('baladeiro')) j.pers.disciplina = Math.max(0, j.pers.disciplina - 15);
  if (j.especiais.includes('filho_ex')) j.visib = 10;
  // atributos de começo: crescem com o potencial e a idade; a posição puxa para cima o que ela mais usa
  const ini = 4 + P * 0.8 + (anos - 13) * 0.6, pesos = AGM_POS[pos][1];
  for (const k of agmAtrDe(pos)) j.atr[k] = clamp(agmUm(ini + ((pesos[k] || 0.5) - 1.5) * 0.7 + agRnd(-1, 1)), 1, agmTeto(P));
  if (j.especiais.includes('craque_varzea') && j.atr.dri) j.atr.dri = clamp(agmUm(j.atr.dri + 1.5), 1, agmTeto(P));
  j.ovrMax = agmOverall(j);
  // a família (arquétipo puxado pela região; filho de ex-jogador = família exigente)
  j.fam = agmNovaFamilia(j, regiao, j.especiais.includes('filho_ex') ? agPega(['estruturada', 'pai_ambicioso']) : j.especiais.includes('estudioso') ? 'estruturada' : null);
  if (j.especiais.includes('estudioso') && !j.fam.need.includes('estudo')) j.fam.need[1] = 'estudo';
  j.fam.rival = Math.random() < agmChanceRival(P, regiao);
  j.fam.confianca = Math.round(20 + (a ? a.rep : 0) * 0.3); // 20 a 50, conforme a reputação
  // o relatório do olheiro: faixa de potencial e os traços que ele conseguiu ler
  if (ol) agmObserva(j, ol, regiao);
  return j;
}
// o olheiro observa (ou reobserva) o garoto: estreita a faixa e lê o caráter
function agmObserva(j, ol, regiao) {
  // v337: reobservar (com o mesmo ou outro olheiro) multiplica a margem por 0,6 — e um olheiro melhor pode apertar ainda mais
  const olho = Math.min(20, ol.olho + (ol.especialidade === regiao ? 3 : 0)), reobs = j.faixa ? (j.faixa.reobs || 0) + 1 : 0;
  const m = j.faixa ? Math.min(agmMargem(olho), (j.faixa.mr || j.faixa.m) * 0.6) : agmMargem(olho);
  j.faixa = { ...agmFaixa(j.P, m), ol: ol.id, olNome: ol.nome, olho, reobs };
  const n = ol.carater >= 16 ? 3 : ol.carater >= 10 ? 2 : ol.carater >= 6 ? 1 : 0;
  for (const t of agEmbM(Object.keys(AGM_TRACOS))) { if (j.revelados.length >= n + Math.min(reobs, 3)) break; if (!j.revelados.includes(t)) j.revelados.push(t); }
  return j.faixa;
}
function agmSalarioOl(o) { const t = o.olho + o.carater + o.rede; return Math.round(t * 1500 * (1 + t / 30)); } // cresce com os atributos
const AGM_REGIOES_OBS = { varzea: 'Muita variação, famílias simples', interior: 'Pouca concorrência de rivais', nordeste: 'Famílias resistem a mudar de cidade', escolinhas: 'Piso alto, famílias exigentes', campeonatos: 'Rivais aparecem com mais frequência' };
const agEmbM = l => { l = l.slice(); for (let i = l.length - 1; i > 0; i--) { const k = (Math.random() * (i + 1)) | 0; [l[i], l[k]] = [l[k], l[i]]; } return l; };
function agmNovaAgencia(nome) {
  const a = { v: AGM_VERSAO, nome, rep: 0, nivel: 1, semana: 0, acoes: agmAcoesSemana(1), relogio: { ultimo: Date.now(), pausaUlt: null },
    olheiros: [], candidatos: [], jogadores: [], lendas: [], eventos: [], titulos: {}, album: {}, hall: [], paises: {}, fila: [], seq: 1,
    marcos: { assinados: 0, aprovados: 0, baseMedio: 0, contratos: 0, transf: 0, fora: 0, patroc: 0, bons: 0 },
    totais: { transf: 0, comissao: 0, descobertas: 0, vendaMax: 0 } };
  a.olheiros.push(agmNovoOlheiro('iniciante', a));
  return a;
}

/* ---------- conversão das agências antigas (v323–v334) ---------- */
const AGM_PERS_V1 = { // a personalidade antiga vira traços (e esses traços já são conhecidos)
  ambicioso: { ambicao: 85, disciplina: 60 }, relaxado: { disciplina: 35, temperamento: 25, ambicao: 35 }, trabalhador: { disciplina: 85, estabilidade: 60 },
  ganancioso: { ambicao: 70, lealdade: 35 }, leal: { lealdade: 85, saudade: 60 }, temperamental: { temperamento: 85, estabilidade: 35 } };
const AGM_DESEJO_V1 = { estudo: 'estudo', dinheiro: 'dinheiro', perto: 'proximidade', sonho: 'status', respeito: 'transparencia' };
const AGM_PAR_V1 = { mae: 'mae_protetora', pai: 'pai_ambicioso', avo_f: 'avo', avo_m: 'avo', tia: 'desconfiada', tio: 'tio' };
const agmV1Atr = v => clamp(agmUm((v || 0) / 5), 1, 20);
const agmV1P = pot => clamp(agmMeia((pot / 5 - 8) / 2.4), 0.5, 5); // inverso do teto: overall 1–99 ÷ 5 = teto 1–20
function agmConverteJogador(o, a1, a) {
  const pos = o.pos in AGM_POS ? o.pos : 'MEI', P = agmV1P(o.pot || 60);
  const j = { id: o.id, v: AGM_VERSAO, nome: o.nome, menina: !!o.menina, pos, idadeSem: Math.round((o.idade || 15) * 52), regiao: { bairro: 'varzea', estado: 'interior', brasil: 'nordeste', america: 'campeonatos', europa: 'campeonatos' }[o.regiao] || 'varzea',
    P, atr: {}, faixa: null, pers: {}, revelados: [], especiais: [], estado: { moral: clamp(Math.round(o.moral == null ? 70 : o.moral), 0, 100), forma: 60, fadiga: 0 },
    lesao: Math.min(4, (o.parado || 0) * 2), visib: clamp(Math.round(o.fama || 0), 0, 100), confianca: 60, fase: 'desenvolvimento', clube: null, contrato: null,
    salario: o.salario || 0, patrocinios: [], rotina: [], hist: (o.hist || []).slice(0, 6), ovrMax: 0, vendaMax: o.vendaMax || 0, look: o.look, meuClube: !!o.meuClube };
  const at = o.atr || {}; // velocidade, finalização, drible, visão (→ passe), defesa (→ marcação); físico = média de defesa e velocidade
  Object.assign(j.atr, { fin: agmV1Atr(at.fin), pas: agmV1Atr(at.vis), dri: agmV1Atr(at.dri), mar: agmV1Atr(at.def), fis: agmV1Atr(((at.def || 0) + (at.vel || 0)) / 2), vel: agmV1Atr(at.vel) });
  for (const k of AGM_ATR_LINHA) j.atr[k] = Math.min(j.atr[k], agmTeto(P));
  for (const t of Object.keys(AGM_TRACOS)) j.pers[t] = agmTraco();
  const pv = AGM_PERS_V1[o.pers]; if (pv) { Object.assign(j.pers, pv); j.revelados = Object.keys(pv); }
  if (o.potV) j.faixa = { c: agmMeia((agmV1P(o.potV[0]) + agmV1P(o.potV[1])) / 2), lo: agmV1P(o.potV[0]), hi: agmV1P(o.potV[1]), m: Math.max(0.5, agmMeia((agmV1P(o.potV[1]) - agmV1P(o.potV[0])) / 2)), ol: null, reobs: o.avaliado ? 1 : 0 };
  // a família da v333 (se já tinha conversado) vira arquétipo + necessidades
  const fam = agmNovaFamilia(j, j.regiao, o.fam && AGM_PAR_V1[o.fam.par]);
  if (o.fam) { fam.nome = o.fam.nome || fam.nome; fam.par = o.fam.par || fam.par; fam.look = o.fam.look || fam.look; const d = AGM_DESEJO_V1[o.fam.desejo]; if (d) { fam.need[0] = d; if (fam.need[1] === d) fam.need[1] = agPega(Object.keys(AGM_NECESSIDADES).filter(n => n !== d)); if (o.fam.sabe) fam.sabe[d] = true; } }
  fam.confianca = 60; j.fam = fam;
  // a fase: achado → descoberta; treino/escolinha/base → desenvolvimento; pro → carreira
  const restoSem = Math.max(0, ((o.contratoAte || 0) - (a1.nPer || 0)) * 13); // 1 período antigo = 3 meses = 13 semanas
  if (o.fase === 'achado') j.fase = 'descoberta';
  else if (o.fase === 'pro') { j.fase = 'carreira'; j.clube = o.clube ? { ...o.clube, tipo: 'pro' } : null; j.contrato = { comissao: o.comissao || 10, ateSemana: a.semana + restoSem }; }
  else if (o.fase === 'base') { j.clube = o.clube ? { ...o.clube, tipo: 'base', degrau: o.clube.nivel >= 2 ? 'grande' : o.clube.nivel >= 1 ? 'medio' : 'pequeno' } : null; j.contrato = { comissao: o.comissao || 10, ateSemana: a.semana + restoSem }; }
  if (j.fase !== 'descoberta' && !j.contrato) j.contrato = { comissao: 10, anos: 2, ateSemana: a.semana + 104 }; // contrato com a família (agência)
  j.ovrMax = Math.max(agmOverall(j), agmV1Atr(o.ovrMax || 0));
  return j;
}
function agmConverte(a1) {
  if (!a1 || a1.v === AGM_VERSAO) return a1;
  const a = agmNovaAgencia(a1.nome || 'LENDA SPORTS'); a.olheiros = []; a.seq = Math.max(a1.seq || 1, 1);
  // reputação: o nível antigo (0–5) vira o novo (1–5), com o avanço proporcional dentro do nível
  const k1 = a1.nivel != null ? a1.nivel : 0, REP1 = [0, 100, 500, 1800, 6000, 18000], k2 = clamp(k1 + 1, 1, 5);
  const ini = REP1[k1] || 0, fim = REP1[k1 + 1] || ini * 2 || 1, frac = clamp(((a1.rep || 0) - ini) / Math.max(1, fim - ini), 0, 0.95);
  a.nivel = k2; a.rep = Math.round(AGM_NIVEIS[k2][0] + frac * ((AGM_NIVEIS[k2 + 1] ? AGM_NIVEIS[k2 + 1][0] : 100) - AGM_NIVEIS[k2][0]));
  a.acoes = agmAcoesSemana(a.nivel);
  for (const id of ['titulos', 'album', 'paises']) a[id] = a1[id] || {};
  a.hall = a1.hall || []; a.fila = a1.fila || []; Object.assign(a.totais, a1.totais || {}); Object.assign(a.marcos, a1.marcos || {});
  a.relogio = { ultimo: Date.now(), pausaUlt: a1.pausaUlt || null }; // a semana nova começa agora (o tempo antigo já foi entregue em períodos)
  // olheiros: cada tipo antigo vira um olheiro do nível equivalente (o de base sempre existe)
  const MAP = { base: 'iniciante', especialista: 'regional', internacional: 'nacional', lendario: 'lendario' };
  for (const [id, tem] of Object.entries(a1.olheiros || { base: 1 })) if (tem && MAP[id]) { const o = agmNovoOlheiro(MAP[id], a); o.v1 = id; a.olheiros.push(o); }
  if (!a.olheiros.length) a.olheiros.push(agmNovoOlheiro('iniciante', a));
  // missões em andamento: continuam, com as semanas que faltam
  for (const m of a1.missoes || []) { const o = a.olheiros.find(x => x.v1 === m.olheiro); if (o) o.missao = { regiao: { bairro: 'varzea', estado: 'interior', brasil: 'nordeste', america: 'campeonatos', europa: 'campeonatos' }[m.regiao] || 'varzea', filtro: {}, semanas: 2, fim: a.semana + Math.max(1, Math.ceil(Math.max(0, m.fim - Date.now()) / AGM_SEMANA_MS)) }; }
  a.candidatos = (a1.achados || []).map(o => agmConverteJogador(o, a1, a));
  a.jogadores = (a1.jogadores || []).map(o => agmConverteJogador(o, a1, a));
  // acontecimentos: os de informação ficam; propostas abertas ficam marcadas (a Etapa 6 trata) — nada se perde
  a.eventos = (a1.eventos || []).map(e => ({ ...e, v1: true, visto: true }));
  return a;
}
// guarda a agência antiga uma vez (cópia de segurança) e converte — só roda quando AGM_ATIVO
function agmMigraSave(s) {
  if (!s || !s.agencia || s.agencia.v === AGM_VERSAO) return false;
  if (!s.agenciaV1) s.agenciaV1 = JSON.parse(JSON.stringify(s.agencia));
  s.agencia = agmConverte(s.agencia); return true;
}
