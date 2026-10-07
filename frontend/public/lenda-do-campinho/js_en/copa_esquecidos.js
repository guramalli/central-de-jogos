/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   👻 COPA DOS ESQUECIDOS — NÚCLEO (v410, frente MECÂNICAS; o dono aprovou em 06/10/2026). Prefixo cq / CQ.
   Especificação e CONTRATO de nomes: _avaliacao/COPA_ESQUECIDOS.md. Este arquivo cuida de:
   - os 12 ADVERSÁRIOS (fantasmas simpáticos: d.fantasma = true → a frente ARTE desenha translúcido) e o jeito de
     cada um jogar: substituições (Reserva), massagem nos colegas (Massagista), gandula que rouba a bola e foge,
     muralha (só cai com jogada forte), faixas de impedimento no chão (pisou, volta), cartões (amarelo = mais lento;
     vermelho = sem jogadas 3 s), torcida em bando (golpe em área), bumbo (onda que empurra), mascote resistente,
     craque que desvia chute de longe, goleiro que defende pela frente e técnico que fortalece os vizinhos.
   - a PRESSÃO de cada ala (frio / escuridão / barulho / prorrogação = as três) e as 3 COMIDAS que a anulam;
     aviso na entrada e um quadrinho no alto da tela.
   - os 4 CHEFÕES das alas (volta depois de vencido, como nas arenas; 1ª vitória do dia = prêmio grande) com o
     lance decisivo (lance_chefe.js) funcionando neles.
   - a FINAL "Os Onze Esquecidos" (cq_onze): depois do sg_f3 e do nível 950, semanal (segunda-feira), mais difícil a
     cada semana vencida; 4 setores (ataque, meio, zaga, goleiro-capitão) e termina com o LANCE DECISIVO valendo a taça.
   - recompensas: Ingressos Esquecidos → Seu Saudade troca por peças do Uniforme dos Esquecidos (700/800/900, sem
     sorteio, padrão de itens de faixa = épico), materiais de refino cq_mat_1..3, mascote Bolinha Esquecida (1 em 5.000
     com garantia), XP pela régua do balanço (xpNivel/220 por vitória) e tostões pela bzRenda.
   Os números ficam em CQ_BAL (a frente BALANÇO mede e ajusta). Os mapas são da frente MAPAS (copa_mapas.js), os
   desenhos da ARTE (copa_arte.js) e as falas/missões da MISSÕES (copa_historia.js).
   Carregar NO FIM do index.html (depois de lance_chefe.js, balanco_v407.js, mascotes.js, adornos2.js, saga_origem.js);
   ordem do contrato: copa_esquecidos → copa_arte → copa_mapas → copa_historia.
   ============================================================ */

/* ======================= ⚖️ números (fácil de ajustar) ======================= */
const CQ_BAL = {
  // vida e força dos adversários em relação a statsNivel(L); crescem de ala em ala.
  // Referência: Vale Jurássico (560–700) usa vida ×2,0 com XP ×1,6 (vida/XP = 1,25). Aqui a XP é a régua (×1) e a
  // vida ×1,50–1,65 → vida/XP 1,50–1,65 = +20% a +32% de tempo por nível com as comidas certas (antes de medir).
  ala: { vestiario: { hp: 1.50, atk: 1.80 }, tunel: { hp: 1.55, atk: 1.85 }, arquibancada: { hp: 1.60, atk: 1.90 }, gramado: { hp: 1.65, atk: 1.95 } },
  xp: 1.0,        // XP por vitória = xp × xpNivel(L)/220 (a régua do balanço_v407 completa o resto na hora da vitória)
  renda: 0.9,     // tostões médios = renda × bzRenda(L) (o resto vem do loot)
  // v410 (balanço, medido com o s31b): a vida de cada um foi acertada para a vitória levar, com a comida da ala, ~1,2× (vestiário)
  // a 1,35× (gramado) o tempo de uma vitória no Vale Jurássico (jur_trike com o Banquete: ~7 s). Antes: 0,4× a 1,4×
  // (o Craque, o Técnico e a Torcida caíam em 3 s; o Mascote levava 16 s). Sem a comida: 1,0–1,7× (vestiário, arquibancada)
  // e 2,4–3,3× (túnel, gramado: o Suco/as 3 comidas dão ataque), sem cansar (0–2 poções).
  tipo: {         // ajuste fino por adversário (vida, ataque, defesa, XP)
    cq_reserva: { hp: 0.85, atk: 1.0, xp: 1.0 }, cq_massagista: { hp: 0.83, atk: 0.7, xp: 1.0 }, cq_gandula: { hp: 1.0, atk: 0.9, xp: 0.8 },
    cq_zagueiro: { hp: 1.3, atk: 1.0, def: 1.4, xp: 1.2 }, cq_bandeirinha: { hp: 1.56, atk: 0.85, xp: 1.0 }, cq_arbitro: { hp: 1.73, atk: 0.8, xp: 1.0 },
    cq_torcida: { hp: 1.13, atk: 0.55, xp: 0.55 }, cq_bumbo: { hp: 1.05, atk: 0.9, xp: 1.1 }, cq_mascote: { hp: 1.15, atk: 0.8, def: 1.6, xp: 2.0 },
    cq_craque: { hp: 2.15, atk: 1.05, xp: 1.1 }, cq_goleiro: { hp: 1.58, atk: 0.85, def: 1.3, xp: 1.2 }, cq_tecnico: { hp: 2.18, atk: 0.6, xp: 1.0 },
  },
  // pressão das alas (sem a comida certa); com a comida, some
  pressao: {
    frio: { dano: 0.30, regen: 0.5 },                    // +30% de cansaço por golpe e metade da recuperação de fôlego
    escuro: { raio: 4.5, raioComida: 9, longe: 0.20 },   // vê só 4,5 quadradinhos; chute/jogada de mais longe que isso: −20% (v410: era −40%; sem o suco a vitória já leva ~2,5×)
    barulho: { foco: 0.8, regenFoco: 0.5 },              // jogadas custam +80% de foco; o foco volta 50% mais devagar (v410: era +60%/40%: sem o chá ficava só 1,3× mais lento)
  },
  prorrogacao: { passo: 20000, atk: 0.06, max: 0.48 },   // Gramado: +6% de força a cada 20 s de briga (até +48%)
  muralha: 0.3, muralhaForte: 1.2,                         // golpe fraco passa 30%; "forte" = jogada, ou golpe ≥ 1,2× o seu golpe máximo
  desvia: 0.65, desviaLonge: 2.2,                          // Craque Sem Taça desvia 65% do que vem de mais de 2,2 quadradinhos
  goleiro: { bloqueia: 0.8, cone: 1.2, vira: 1600 },       // defende 80% do que vem de frente (±69°); vira para você a cada 1,6 s
  tecnico: { raio: 4, atk: 0.25, def: 0.20 },              // vizinhos do Técnico: +25% de força e −20% de dano recebido
  gandula: { foco: 0.06, foge: 2600, devolve: 1.5 },
  massagem: 0.14, invocadosMax: 8,
  ola: { cada: 45000, vel: 6, foco: 0.10 },                // Arquibancada: a ola atravessa o mapa (só cansa o foco de quem não comeu o chá)
  // v410: capitães medidos sozinhos com a comida da ala: ~2 min (antes 3,5–5 min ou não venciam, com 45–90 poções)
  chefe: { hp: 2.0, atk: 1.2, hpTipo: { cq_cap_vestiario: 0.5, cq_rei_arquibancada: 0.7, cq_craque_final: 0.7 }, teto: 0.28, xpGrande: 0.5, xpPequeno: 0.1, volta: 180000, ouro: 60, ingressos: [5, 1], mat: [3, 1] },
  onze: { hpSetor: { ataque: 3.2, meio: 3.2, zaga: 4.0 }, atkSetor: { ataque: 2.2, meio: 1.8, zaga: 2.0 }, hpCap: 3.0, atkCap: 2.4, // v410: vida −20% (setores) e −33% (capitão)
    dif: 0.12, difMax: 10, tempo: 600000, piso: 0.10, xp: 1.5, ouro: 400, ingressos: [15, 2] },
  ingresso: 1 / 40, mat: 0.02,                             // chance por adversário
  troca: { 700: 50, 800: 70, 900: 90 },                    // ingressos por peça do Uniforme dos Esquecidos
  bolinha: { chance: 1 / 5000, garantia: 8000 },
  comidaPreco: 15000,
  // v410: atributos das comidas da Copa (+N × (1 + nível/25), como toda comida). O Suco e o Chá davam +26/+22 de ataque/jogada:
  // com eles a vitória ficava 3× mais rápida que sem (o que pesa é a comida, não a pressão). Caldo = defesa (não muda o tempo).
  comida: { caldo: 26, cenoura: 14, cha: 14 },
};
window.CQ_BAL = CQ_BAL;
const CQ = { p: null, ala: null, mapa: null, tele: [], tP: 0, hud: '', forte: 0, olaT: 0, final: null, apagaoAte: 0, txtT: new WeakMap(), err: null };
const cqXpNivel = L => Math.max(1, xpPara(L + 1) - xpPara(L));
const cqFatorXp = L => { try { return typeof bzFatorXp === 'function' ? bzFatorXp(L) : 1; } catch (e) { return 1; } };
const cqRenda = L => { try { return typeof bzRenda === 'function' ? bzRenda(L) : Math.round(0.8 * L ** 1.5); } catch (e) { return Math.round(0.8 * L ** 1.5); } };
const cqRed = v => (typeof bzRedondo === 'function' ? bzRedondo(v) : Math.round(v));
const cqHoje = () => (typeof hojeArena === 'function' ? hojeArena() : new Date().toISOString().slice(0, 10));
const cqSemana = () => (typeof tarSemanaId === 'function' ? tarSemanaId() : cqHoje());
const cqErro = e => { if (!CQ.err) { CQ.err = e; console.warn('copa dos esquecidos', e); } };
function cqTxt(m, txt, cor, ms = 1400) { const t = CQ.txtT.get(m) || 0; if (G.agora - t < ms) return; CQ.txtT.set(m, G.agora); texto(m, txt, cor || '#ffe14a', 1100, -0.9); }

/* ======================= as alas e a pressão ======================= */
const CQ_PRESSOES = {
  frio: { ic: '🥶', nome: 'Cold', mal: 'you get tired faster', comida: 'cq_caldo' },
  escuro: { ic: '🌑', nome: 'Darkness', mal: 'you can only see up close', comida: 'cq_cenoura' },
  barulho: { ic: '📢', nome: 'Noise', mal: 'moves cost more focus', comida: 'cq_cha' },
};
const CQ_ALAS = {
  vestiario: { mapa: 'cq_vestiario', nome: 'Abandoned Locker Room', niveis: [700, 760], pressao: ['frio'], chefe: 'cq_cap_vestiario',
    titulo: '🥶 Freezing locker room!', sub: 'Hot food helps: Seu Saudade’s Hot Broth.' },
  tunel: { mapa: 'cq_tunel', nome: 'Players’ Tunnel', niveis: [760, 830], pressao: ['escuro'], chefe: 'cq_xerife_tunel',
    titulo: '🌑 Dark tunnel!', sub: 'You can only see up close. Carrot Juice helps you see.' },
  arquibancada: { mapa: 'cq_arquibancada', nome: 'Infinite Stands', niveis: [830, 900], pressao: ['barulho'], chefe: 'cq_rei_arquibancada',
    titulo: '📢 What a racket!', sub: 'Moves cost more focus. Fennel Tea calms you down.' },
  gramado: { mapa: 'cq_gramado', nome: 'Eternal Final Pitch', niveis: [900, 950], pressao: ['frio', 'escuro', 'barulho'], chefe: 'cq_craque_final',
    titulo: '⏱️ Extra time!', sub: 'Cold, dark and noise all at once: eat all 3 Cup foods at the same time.' },
};
const CQ_MAPA_ALA = {}; for (const [k, a] of Object.entries(CQ_ALAS)) CQ_MAPA_ALA[a.mapa] = k;
window.CQ_PRESSAO_SEM_AVISO = true; // o aviso das pressões ao entrar é este daqui (a frente MISSÕES desliga o dela com isto)
// a ala de um mapa: m.cqAla (a frente MAPAS marca 'cq_gramado' etc.; salas extras também), o id do contrato ou um id começando com o da ala
function cqAlaDoMapa(m) {
  if (!m) return null; const ma = m.cqAla && String(m.cqAla).replace(/^cq_/, ''); if (ma && CQ_ALAS[ma]) return ma; if (CQ_MAPA_ALA[m.id]) return CQ_MAPA_ALA[m.id];
  const r = /^cq_(vestiario|tunel|arquibancada|gramado)/.exec(m.id || ''); return r ? r[1] : null;
}

/* ======================= itens ======================= */
Object.assign(ITENS, {
  // as 3 comidas que anulam a pressão (Seu Saudade vende) — sem força nova: menos atributos que o Banquete dos Anões
  cq_caldo: { nome: 'Locker Room Hot Broth', tipo: 'comida', cq: 'frio', efeito: { dur: 900, regen: 14, atr: { folego: CQ_BAL.comida.caldo, defesa: CQ_BAL.comida.caldo } }, lvl: 700, preco: CQ_BAL.comidaPreco, venda: 3000,
    desc: 'A nice hot soup: it chases away the COLD of the Forgotten Cup. +Stamina, +Defense and lots of recovery for 15 min.', iconeBase: 'i_feijoada', matiz: 20 },
  cq_cenoura: { nome: 'Tunnel Carrot Juice', tipo: 'comida', cq: 'escuro', efeito: { dur: 900, regenFoco: 7, atr: { inteligencia: CQ_BAL.comida.cenoura, habilidade: CQ_BAL.comida.cenoura } }, lvl: 700, preco: CQ_BAL.comidaPreco, venda: 3000,
    desc: 'Helps you see in the DARK of the Forgotten Cup. +Intelligence, +Skill and focus for 15 min.', iconeBase: 'i_suco_verde', matiz: 160 },
  cq_cha: { nome: 'Stands Fennel Tea', tipo: 'comida', cq: 'barulho', efeito: { dur: 900, regenFoco: 12, atr: { inteligencia: CQ_BAL.comida.cha, folego: CQ_BAL.comida.cha } }, lvl: 700, preco: CQ_BAL.comidaPreco, venda: 3000,
    desc: 'Keeps you calm in the NOISE of the Forgotten Cup: moves don’t cost extra focus. +Intelligence, +Stamina and lots of focus for 15 min.', iconeBase: 'i_vitamina', matiz: 70 },
  // moeda de troca (não se vende: venda 0 fica fora do "Vender todo o loot")
  ingresso_esquecido: { nome: 'Forgotten Ticket', tipo: 'loot', venda: 0, peso: 0.01, iconeBase: 'i_ingresso', matiz: 200,
    desc: 'A yellowed ticket from the Origin Cup, the final that never ended. Seu Saudade, kit manager of the Forgotten Stadium, trades tickets for pieces of the Forgotten Uniform.' },
  // materiais de refino dos itens 700+ (do +5 em diante)
  cq_mat_1: { nome: 'Old Pennant Scrap', tipo: 'loot', venda: 700 * 16, iconeBase: 'i_retalho', matiz: 200, desc: 'A little piece of a pennant from the Origin Cup. Upgrade material for items of level 700 to 799.' },
  cq_mat_2: { nome: 'Rusty Tunnel Whistle', tipo: 'loot', venda: 800 * 16, iconeBase: 'i_apito_ouro', matiz: 180, desc: 'A whistle that never blew the final whistle. Upgrade material for items of level 800 to 899.' },
  cq_mat_3: { nome: 'Eternal Final Net Thread', tipo: 'loot', venda: 900 * 16, iconeBase: 'i_fio_ouro', matiz: 230, desc: 'A thread from the goal net of the final that never ended. Upgrade material for items of level 900 or higher.' },
  // troféu da final (móvel para a casa; a frente ARTE pode trocar o desenho)
  taca_esquecidos: { nome: 'Forgotten Trophy', tipo: 'movel', obj: 'taca_liga', preco: 0, venda: 0, raro: true,
    desc: 'The Origin Cup trophy! You beat the Forgotten Eleven and the final is finally over. Furniture for your house.' },
});
if (typeof ICON_ALIAS !== 'undefined') ICON_ALIAS.taca_esquecidos = 'taca_liga';
const CQ_MAT = L => L >= 900 ? 'cq_mat_3' : L >= 800 ? 'cq_mat_2' : 'cq_mat_1';

// 👕 Uniforme dos Esquecidos — 6 peças × 3 faixas, SEM sorteio (troca com o Seu Saudade). Os números saem do padrão
// dos itens (padrao_itens.js: faixaMv → épico, como as faixas 400+); os de baixo só dão a "cara" (quais bônus).
const CQ_FAIXAS = [{ L: 700, suf: '_700', nome: 'of Memory', cor: '#9aa8b8', cor2: '#e8dcc0', matiz: 190 },
  { L: 800, suf: '_800', nome: 'of Longing', cor: '#a89a8c', cor2: '#efe3c8', matiz: 250 },
  { L: 900, suf: '_900', nome: 'of Eternity', cor: '#b4aed0', cor2: '#fff4d8', matiz: 300 }];
const CQ_UE = {
  ue_cabeca: ['Beret', 'cabeca', { def: 38, st: { hp: 2400, drible: 17, chute: 17, visao: 19 }, avatar: 'chapeu-boina' }, 'i_boina'],
  ue_camisa: ['Faded Jersey', 'camisa', { def: 175, st: { hp: 7600, defesa: 24 }, avatar: 'roupa-futebol' }, 'i_camisa_tempestade'],
  ue_calcao: ['Flannel Shorts', 'calcao', { def: 48, st: { vel: 30, hp: 1500 }, avatar: 'baixo-shorts' }, 'i_calcao_tempestade'],
  ue_perna: ['Wool Socks', 'perna', { def: 68, st: { defesa: 20, hp: 2850 } }, 'i_caneleira_gelo_eterno'],
  ue_chuteira: ['Old Leather Cleats', 'chuteira', { atk: 236, st: { vel: 54, chute: 21, drible: 21 } }, 'i_chuteira_runica'],
  ue_acessorio: ['Old-Time Fans’ Scarf', 'acessorio', { def: 20, st: { foco: 1750, regen: 15, hp: 1100 }, avatar: 'pescoco-cachecol' }, 'i_cachecol'],
};
const CQ_UE_IDS = [];
for (const f of CQ_FAIXAS) for (const [base, [nome, slot, x, ic]] of Object.entries(CQ_UE)) {
  const id = base + f.suf, k = f.L / 545; // (escala da faixa Tempestade, nível 545)
  const st = {}; for (const [a, v] of Object.entries(x.st)) st[a] = Math.round(v * k);
  const nomeF = `${nome} ${f.nome}`; // ex.: Boina da Memória, Camisa Desbotada da Saudade, Chuteira de Couro Antigo da Eternidade
  ITENS[id] = Object.assign({ nome: nomeF, tipo: 'equip', slot, lvl: f.L, venda: Math.round(f.L * f.L * 9), faixaMv: 'esquecidos' + f.suf, cqUniforme: true, iconeBase: ic, matiz: f.matiz,
    desc: `Forgotten Uniform (tier ${f.L}). Trade Forgotten Tickets with Seu Saudade, in the Forgotten Stadium.` },
    x.atk ? { atk: Math.round(x.atk * k) } : { def: Math.round(x.def * k) }, { st },
    x.avatar ? { avatar: x.avatar } : {}, slot === 'camisa' ? { cor: f.cor, cor2: f.cor2 } : {});
  CQ_UE_IDS.push(id);
}

/* ======================= os adversários ======================= */
const cqLook = (folha, cor, extra) => Object.assign({ tipo: 'humano', corpo: 'm', alt: 1.75, folha, pele: 'pele-clara', cabelo: 'cabelo-curto', corCabelo: 'castanho', roupa: 'roupa-futebol', corRoupa: cor, baixo: 'baixo-shorts', corBaixo: '#d8d2c0' }, extra || {});
// [id, nome, nível, arquétipo (velocidade/alcance), ala, tipo de jogo, visual (uniformes antigos, cores desbotadas), falas]
const CQ_ADV = [
  ['cq_reserva', 'Eternal Sub', 705, 'meia', 'vestiario', 'reserva', cqLook('arq_volante', '#9fb39a', { pele: 'pele-morena', corCabelo: 'preto' }), ['Coach, put me in!', 'I’ve been warming up for a hundred years...', 'Substitution!']],
  ['cq_massagista', 'Sleepwalking Masseur', 722, 'meia', 'vestiario', 'massagista', cqLook('gordinho', '#d8d4c4', { roupa: 'roupa-jaleco', chapeu: 'chapeu-gorro', pescoco: 'pescoco-apito', corCabelo: 'grisalho' }), ['Zzz... massage...', 'Zzz... hang in there, team...', 'Huh? Is it the second half already?']],
  ['cq_gandula', 'Lightning Ball Kid', 740, 'rapido', 'vestiario', 'gandula', cqLook('magrelo', '#c8b07a', { roupa: 'roupa-moletom', chapeu: 'chapeu-bone', pele: 'pele-negra', corCabelo: 'preto', alt: 1.5 }), ['That ball is mine!', 'Catch me if you can!', 'Wheee!']],
  ['cq_zagueiro', 'Brick-Wall Defender', 770, 'zagueiro', 'tunel', 'zagueiro', cqLook('arq_zagueiro', '#8a96a8', { pele: 'pele-negra', corCabelo: 'preto', alt: 1.85 }), ['Nobody gets past me!', 'Weak hit? Didn’t feel a thing!', 'A hundred-year-old wall!']],
  ['cq_bandeirinha', 'Offside Linesman', 790, 'meia', 'tunel', 'bandeirinha', cqLook('arq_arbitro', '#c8b86a', { corBaixo: '#3a3a42' }), ['OFFSIDE!', 'Go back, go back!', 'Flag up!']],
  ['cq_arbitro', 'Forgotten Referee', 812, 'meia', 'tunel', 'arbitro', cqLook('arq_arbitro', '#4a4a52', { corCabelo: 'grisalho', corBaixo: '#2a2a30' }), ['Tweet! Card!', 'Foul!', 'I never blew the final whistle...']],
  ['cq_torcida', 'Mist Crowd', 838, 'fanatico', 'arquibancada', 'torcida', cqLook('arq_torcedor', '#a89aa8', { pescoco: 'pescoco-cachecol', pele: 'pele-media', corCabelo: 'preto', alt: 1.6 }), ['Oh-lay-lay!', 'Champions!', 'Come on, team!']],
  ['cq_bumbo', 'Thunder Drum', 860, 'zagueiro', 'arquibancada', 'bumbo', cqLook('grandao', '#b07a6a', { roupa: 'roupa-regata', pele: 'pele-morena', corCabelo: 'preto' }), ['BOOM! BOOM!', 'Feel the beat!', 'BOOM-BOOM-BOOM!']],
  ['cq_mascote', 'Lost Mascot', 884, 'zagueiro', 'arquibancada', 'mascote', cqLook('gordinho', '#c8a86a', { roupa: 'roupa-moletom', chapeu: 'chapeu-gorro', alt: 1.9 }), ['Where’s my team?', 'Hug!', 'I just wanted to cheer...']],
  ['cq_craque', 'Trophyless Star', 906, 'rapido', 'gramado', 'craque', cqLook('arq_ponta', '#c8a87a', { pele: 'pele-morena', corCabelo: 'loiro' }), ['Long shot? Deflected!', 'Face me one-on-one!', 'I almost won the title...']],
  ['cq_goleiro', 'Thousand-Save Keeper', 924, 'zagueiro', 'gramado', 'goleiro', cqLook('arq_goleiro', '#8a8a6a', { alt: 1.9 }), ['Nothing gets past me from the front!', 'A thousand saves and counting!', 'Try from the side!']],
  ['cq_tecnico', 'Voiceless Coach', 942, 'meia', 'gramado', 'tecnico', cqLook('treinador', '#6a6458', { roupa: 'roupa-terno', baixo: 'baixo-jeans', chapeu: 'chapeu-panama', corCabelo: 'grisalho' }), ['(makes hand signals)', '(points at the clipboard)', '(whistles without a sound)']],
];
const CQ_ID = new Set();
function cqMonta(id, nome, L, arq, look, falas) {
  const m = montaMonstro(id, nome, arq, L, { falas, look });
  m.cq = true; m.fantasma = true; CQ_ID.add(id);
  return m;
}
for (const [id, nome, L, arq, ala, tipo, look, falas] of CQ_ADV) {
  const m = cqMonta(id, nome, L, arq, look, falas), b = statsNivel(L), A = CQ_BAL.ala[ala], k = CQ_BAL.tipo[id] || {};
  m.cqTipo = tipo; m.cqAla = ala;
  m.hp = Math.round(b.hp * A.hp * (k.hp || 1)); m.atk = Math.round(b.atk * A.atk * (k.atk || 1)); m.def = Math.round(b.def * (k.def || ARQUETIPO[arq].def));
  m.xp = Math.round(b.xp * CQ_BAL.xp * (k.xp || 1));
  if (m.ranged) m.ranged.dano = Math.round(m.atk * 0.95);
  const r = cqRenda(L); m.ouro = [Math.round(r * CQ_BAL.renda * 0.75), Math.round(r * CQ_BAL.renda * 1.25)];
  m.loot = [['ingresso_esquecido', CQ_BAL.ingresso, 1, 1], [CQ_MAT(L), CQ_BAL.mat, 1, 1], ['elixir_multiverso', 0.05, 1, 1], ['foco_multiverso', 0.04, 1, 1], ['fio_ouro', 0.03, 1, 1]];
  if (tipo === 'zagueiro') m.cqMuralha = CQ_BAL.muralha;
  if (tipo === 'craque') m.cqDesvia = CQ_BAL.desvia;
  if (tipo === 'goleiro') m.cqFrente = CQ_BAL.goleiro.bloqueia;
  if (tipo === 'torcida') { m.grupo = 'cq_torcida'; m._mag = { el: 'confete', forma: 'bola', campo: false }; } // golpe em área (magias_adv.js): confete que deixa tonto
  else m._mag = null; // os outros jogam do jeito deles (abaixo), sem a magia da cidade
  if (tipo === 'mascote') m.vel = 200;
}

/* ---------- os chefões das alas ---------- */
// [id, nome, nível, ala, visual, falas, golpes, reservas que chama]
const CQ_CHEFES = [
  ['cq_cap_vestiario', 'Locker Room Captain', 763, 'vestiario', cqLook('arq_centroavante', '#7a9a8a', { chapeu: 'chapeu-faixa', pele: 'pele-morena', corCabelo: 'preto', alt: 1.9 }),
    ['Nobody leaves the locker room without playing!', 'Subs, warm up!', 'I’ve been waiting a hundred years for the whistle!'], ['bomba', 'chuva', 'subst'], ['cq_reserva', 'cq_massagista']],
  ['cq_xerife_tunel', 'Tunnel Sheriff', 833, 'tunel', cqLook('arq_arbitro', '#5a5a3a', { chapeu: 'chapeu-cartola', corCabelo: 'grisalho', alt: 1.9 }),
    ['Here, the rules are the boss!', 'Offside! Again!', 'Lights out!'], ['impedimento', 'cartao', 'apagao'], ['cq_zagueiro', 'cq_arbitro']],
  ['cq_rei_arquibancada', 'King of the Stands', 903, 'arquibancada', cqLook('grandao', '#8a6a8a', { chapeu: 'chapeu-coroa', pescoco: 'pescoco-cachecol', roupa: 'roupa-regata', pele: 'pele-negra', corCabelo: 'preto' }),
    ['OH-LAY-LAY, OH-LAH-LAH!', 'The stands are mine!', 'Louder, fans!'], ['bumbo', 'ola', 'chuva'], ['cq_torcida', 'cq_torcida', 'cq_bumbo']],
  ['cq_craque_final', 'Star of the Final', 953, 'gramado', cqLook('arq_ponta', '#d8c08a', { chapeu: 'chapeu-louros', pele: 'pele-retinta', corCabelo: 'preto', alt: 1.9 }),
    ['The final never ended!', 'One-on-one, now!', 'Extra time... forever!'], ['drible', 'chute', 'chuva'], ['cq_craque', 'cq_goleiro']],
];
const CQ_CHEFE_ALA = {};
for (const [id, nome, L, ala, look, falas, kit, adds] of CQ_CHEFES) {
  const ch = cqMonta(id, nome, L, 'chefe', Object.assign({ grande: true }, look), falas), b = statsNivel(L);
  ch.cqChefe = true; ch.cqAla = ala; ch.cqKit = kit; ch.cqAdds = adds; CQ_CHEFE_ALA[ala] = id;
  ch.hp = Math.round(ch.hp * CQ_BAL.chefe.hp * ((CQ_BAL.chefe.hpTipo || {})[id] || 1)); ch.atk = Math.round(b.atk * 1.6 * CQ_BAL.chefe.atk); if (ch.ranged) ch.ranged.dano = Math.round(ch.atk * 0.9);
  ch.tetoGolpe = CQ_BAL.chefe.teto; ch.respawn = CQ_BAL.chefe.volta;
  ch.xp = Math.max(1, Math.round(cqXpNivel(L) * CQ_BAL.chefe.xpPequeno / cqFatorXp(L))); // a régua multiplica na vitória: dá ~0,1 nível; a 1ª do dia ganha o resto (abaixo)
  ch.ouro = [Math.round(cqRenda(L) * 4), Math.round(cqRenda(L) * 6)];
  ch.loot = [['elixir_multiverso', 1, 2, 4], ['foco_multiverso', 1, 1, 3], ['fio_ouro', 1, 1, 3]];
  if (id === 'cq_craque_final') { ch.cqDesvia = 0.5; ch.cqProrrChefe = true; }
}

/* ---------- a final: Os Onze Esquecidos (números montados na hora, pelo seu nível e pela dificuldade da semana) ---------- */
const CQ_ONZE_SETORES = [
  { id: 'cq_onze_ataque', tipo: 'onze_ataque', nome: 'Attack', qtd: 3, y: 12, look: cqLook('arq_centroavante', '#7a8aa8', { pele: 'pele-retinta', corCabelo: 'preto' }),
    poder: '⚡ Lightning counterattack: they charge in a straight line. Get out of the red stripe!' },
  { id: 'cq_onze_meio', tipo: 'onze_meio', nome: 'Midfielder', qtd: 3, y: 9, look: cqLook('arq_meia', '#7a8aa8', { corCabelo: 'castanho' }),
    poder: '🔁 One-two: they restore each other’s stamina and the pass steals focus. Take them down one at a time!' },
  { id: 'cq_onze_zaga', tipo: 'onze_zaga', nome: 'Defense', qtd: 4, y: 6, look: cqLook('arq_zagueiro', '#7a8aa8', { pele: 'pele-negra', corCabelo: 'preto' }),
    poder: '🚩 Offside line and 🧱 wall: use strong moves and step off the stripes!' },
  { id: 'cq_onze', tipo: 'onze_cap', nome: 'Goalkeeper-captain', qtd: 1, y: 4, look: cqLook('arq_goleiro', '#a89a6a', { chapeu: 'chapeu-faixa', alt: 1.95, grande: true }),
    poder: '🧤 A thousand saves from the front: attack from the sides! At the end, the DECISIVE SHOT wins the trophy.' },
];
for (const S of CQ_ONZE_SETORES) {
  const cap = S.tipo === 'onze_cap';
  const m = cqMonta(S.id, cap ? 'Captain of the Forgotten Eleven' : `${S.nome === 'Defense' ? 'Center Back' : S.nome === 'Attack' ? 'Striker' : 'Midfielder'} of the Forgotten Eleven`, 953, cap ? 'chefe' : S.tipo === 'onze_zaga' ? 'zagueiro' : S.tipo === 'onze_meio' ? 'meia' : 'rapido', S.look,
    cap ? ['Will the final end today?', 'Nothing gets past from the front!', 'Show me your shot!'] : ['For the Forgotten!', 'The final isn’t over!', 'Come on, team!']);
  m.cqTipo = S.tipo; m.cqOnze = true; m.loot = []; m.respawn = 999999999;
  if (cap) { m.cqChefe = true; m.cqKit = ['bumbo', 'chuva', 'chute']; m.cqAdds = ['cq_onze_zaga', 'cq_onze_meio']; m.cqFrente = 0.75; m.cqPiso = true; m.tetoGolpe = CQ_BAL.chefe.teto; }
  if (S.tipo === 'onze_zaga') m.cqMuralha = 0.35;
  m._mag = null;
}
// ajusta força/vida dos Onze para o nível L e a dificuldade D (chamado ao entrar em campo)
function cqOnzeMonta(L, D) {
  const b = statsNivel(L), f = 1 + CQ_BAL.onze.dif * (D - 1), O = CQ_BAL.onze, fx = cqFatorXp(L);
  for (const S of CQ_ONZE_SETORES) {
    const m = MONSTROS[S.id], cap = S.tipo === 'onze_cap', set = S.tipo.slice(5);
    m.nivel = L; m._nv = null;
    if (cap) { m.hp = Math.round(b.hp * 18 * O.hpCap * f); m.atk = Math.round(b.atk * 1.6 * O.atkCap * f); m.def = Math.round(b.def * 1.3); m.xp = Math.max(1, Math.round(cqXpNivel(L) * 0.02 / fx)); }
    else { m.hp = Math.round(b.hp * O.hpSetor[set] * f); m.atk = Math.round(b.atk * O.atkSetor[set] * f); m.def = Math.round(b.def * (set === 'zaga' ? 1.4 : 1)); m.xp = Math.max(1, Math.round(cqXpNivel(L) * 0.004 / fx)); }
    if (m.ranged) m.ranged.dano = Math.round(m.atk * 0.9);
    m.ouro = [Math.round(cqRenda(L) * 0.5), Math.round(cqRenda(L))];
  }
}

/* ======================= NPCs (a frente MISSÕES completa falas e missões) ======================= */
NPCS.seu_saudade = Object.assign({ nome: 'Seu Saudade, the kit manager', cqRoupeiro: true, loja: ['cq_caldo', 'cq_cenoura', 'cq_cha', 'elixir_multiverso', 'foco_multiverso'],
  look: { tipo: 'humano', corpo: 'm', alt: 1.7, folha: 'vovo', pele: 'pele-clara', cabelo: 'cabelo-curto', corCabelo: 'grisalho', roupa: 'roupa-xadrez', corRoupa: '#9a8a7a', baixo: 'baixo-jeans', chapeu: 'chapeu-boina', fantasma: true },
  ola: 'Welcome to the Forgotten Stadium! I keep the uniforms of every team that never won anything. Bring me Forgotten Tickets and I’ll trade them for a piece of our uniform. And bring hot food: inside it’s cold, dark and very noisy!' }, NPCS.seu_saudade || {});
NPCS.dona_memoria = NPCS.dona_memoria || { nome: 'Dona Memória, the fan', look: { tipo: 'humano', corpo: 'f', alt: 1.62, folha: 'vova', pele: 'pele-negra', cabelo: 'cabelo-coque', corCabelo: 'grisalho', roupa: 'roupa-camiseta', corRoupa: '#b8a0b8', baixo: 'baixo-saia', pescoco: 'pescoco-cachecol', fantasma: true },
  ola: 'I saw every game of the Origin Cup... except the end of the final. I’m still waiting for the whistle!' };
if (typeof PAPEL !== 'undefined') Object.assign(PAPEL, { seu_saudade: PAPEL.seu_saudade || 'adulto', dona_memoria: PAPEL.dona_memoria || 'adulta' });

/* ======================= estado salvo ======================= */
function cqDados() {
  const s = G.save; if (!s) return null;
  if (!s.cq || typeof s.cq !== 'object') s.cq = {};
  const c = s.cq; if (!c.chefes) c.chefes = {}; if (typeof c.abates !== 'number') c.abates = 0;
  if (!c.final) c.final = { semana: '', dif: 1, venceuSemana: false, vitorias: 0, semanasVencidas: 0 };
  return c;
}
const cqChefeReg = id => { const c = cqDados(); return c.chefes[id] || (c.chefes[id] = { dia: null, volta: 0, vitorias: 0 }); };

/* ======================= pressão: comidas, efeitos e aviso ======================= */
function cqCalcPressao() {
  const ala = CQ.ala && CQ_ALAS[CQ.ala]; if (!ala || !G.save) { CQ.p = null; return; }
  const tem = new Set(); for (const c of comidasAtivas(G.save)) { const it = ITENS[c.id]; if (it && it.cq) tem.add(it.cq); }
  const p = {}; for (const k of ala.pressao) p[k] = tem.has(k) ? 0 : 1;
  CQ.p = p;
}
const cqEscuroRaio = () => { if (G.agora < CQ.apagaoAte) return 2.6; const p = CQ.p; if (!p || p.escuro === undefined) return 0; return p.escuro ? CQ_BAL.pressao.escuro.raio : CQ_BAL.pressao.escuro.raioComida; };
{ // frio: menos recuperação de fôlego; barulho: jogadas mais caras e foco que volta devagar
  const _statsCq = stats;
  stats = function () {
    const r = _statsCq.apply(this, arguments); const p = CQ.p; if (!p) return r;
    if (p.frio) r.regenHp *= 1 - CQ_BAL.pressao.frio.regen;
    if (p.barulho) { r.custoFoco *= 1 + CQ_BAL.pressao.barulho.foco; r.regenFoco *= 1 - CQ_BAL.pressao.barulho.regenFoco; }
    return r;
  };
}
function cqAvisoEntrada() {
  const a = CQ_ALAS[CQ.ala]; if (!a) return;
  cqCalcPressao(); const falta = a.pressao.filter(k => CQ.p && CQ.p[k]);
  setTimeout(() => { if (CQ.ala !== cqAlaDoMapa(G.mapa)) return; banner(a.titulo, falta.length ? a.sub : 'You’re ready: the right food is already working!'); }, 1300);
  log(`${a.titulo} ${a.sub}${falta.length ? '' : ' ✔ You’ve already eaten what you need.'}`, falta.length ? 'l-dano' : 'l-xp');
}
function cqHud() {
  let h = document.getElementById('cqHud');
  const a = CQ.ala && CQ_ALAS[CQ.ala];
  if (!a || !G.save) { if (h) h.remove(); CQ.hud = ''; return; }
  const linhas = [];
  for (const k of a.pressao) {
    const P = CQ_PRESSOES[k], c = ITENS[P.comida];
    if (CQ.p && CQ.p[k]) linhas.push(['ruim', `${P.ic} ${P.nome}: ${P.mal} — eat ${c.nome}`]);
    else linhas.push(['ok', `${P.ic} ${P.nome} canceled ✔`]);
  }
  if (G.agora < CQ.apagaoAte) linhas.push(['ruim', '💡 Blackout! The lights will be back in a moment']);
  const ch = a.chefe && MONSTROS[a.chefe], reg = ch && cqDados().chefes[a.chefe];
  if (ch && reg && reg.volta > Date.now() && cqAlaDoMapa(G.mapa) === CQ.ala && !CQ.final) { const seg = Math.ceil((reg.volta - Date.now()) / 1000); linhas.push(['info', `👑 ${ch.nome} returns in ${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}`]); }
  const chave = linhas.map(l => l.join('|')).join('#') + (CQ.final ? 'F' : '');
  if (chave === CQ.hud && h) return; CQ.hud = chave;
  if (!h) { h = el('div', { id: 'cqHud' }); document.body.append(h); }
  h.classList.toggle('com-final', !!CQ.final); h.innerHTML = '';
  for (const [c, t] of linhas) h.append(el('div', { class: 'cq-l ' + c }, t));
}

/* ======================= avisos no chão (faixas, círculos, ondas, a ola) ======================= */
function cqTele(t) { t.t0 = t.t0 || G.agora; CQ.tele.push(t); return t; }
function cqAplica(ef, m, de) {
  const s = G.save, p = G.p; if (!s || s.hp <= 0 || !ef) return;
  const st = stats();
  if (ef.txt) texto(p, ef.txt, ef.cor || '#ffe14a', 1100, -0.7);
  if (ef.foco) { const tira = Math.min(s.foco, Math.round(st.maxFoco * ef.foco)); if (tira > 0) { s.foco -= tira; texto(p, '-' + fmt(tira) + ' foco', '#6ab8ff', 800, -0.3); } }
  if (ef.lento) p.lentoAte = Math.max(p.lentoAte || 0, G.agora + ef.lento);
  if (ef.tonto) p.tontoAte = Math.max(p.tontoAte || 0, G.agora + ef.tonto);
  if (ef.empurra && de) cqEmpurra(p.x - de.x, p.y - de.y, ef.empurra);
  if (ef.dano) recebeDano(Math.max(1, Math.round(st.maxHp * ef.dano)), m);
  G.uiSujo = true;
}
// empurra o jogador n quadradinhos (desliza; nunca atravessa parede nem gente)
function cqEmpurra(dx, dy, n) {
  const p = G.p, d = Math.hypot(dx, dy); if (!p || d < 1e-4) return;
  dx /= d; dy /= d; let alvo = null;
  // v410 (balanço: o bumbo do capitão jogava o jogador para FORA da arena da final, e sair da arena encerra a partida):
  // dentro da arena da final, o empurrão para na beirada de dentro
  const AF = typeof CQ_MAPAS !== 'undefined' ? CQ_MAPAS.final : null, naAF = !!(AF && AF.area && G.mapa && G.mapa.id === AF.mapa && p.x >= AF.area.x + 1 && p.x < AF.area.x + AF.area.w - 1 && p.y >= AF.area.y + 1 && p.y < AF.area.y + AF.area.h - 1);
  for (let k = 1; k <= n * 2; k++) {
    const tx = Math.floor(p.x + dx * k / 2), ty = Math.floor(p.y + dy * k / 2);
    if (naAF && !(tx >= AF.area.x + 1 && tx < AF.area.x + AF.area.w - 1 && ty >= AF.area.y + 1 && ty < AF.area.y + AF.area.h - 1)) break;
    if (tileBloq(tx, ty)) break;
    if (tx === Math.floor(p.x) && ty === Math.floor(p.y)) continue;
    if (!modoGrade() || typeof grLivre !== 'function' || grLivre(tx, ty, p)) alvo = { tx, ty };
  }
  if (!alvo) return;
  G.caminho = null; G.acaoChegar = null; p.fila = null;
  if (modoGrade() && typeof grPasso === 'function') { p.pas = null; grPasso(p, alvo.tx, alvo.ty, 11); }
  else { p.x = alvo.tx + 0.5; p.y = alvo.ty + 0.5; }
  efeito('puff', p.x, p.y);
}
const cqNaFaixa = (t, q) => { const dx = q.x - t.x, dy = q.y - t.y, c = Math.cos(t.ang), s = Math.sin(t.ang); return Math.abs(dx * c + dy * s) <= t.comp / 2 && Math.abs(-dx * s + dy * c) <= t.larg / 2; };
function cqDistSeg(p, a, b) { const vx = b.x - a.x, vy = b.y - a.y, L2 = vx * vx + vy * vy || 1; const k = clamp(((p.x - a.x) * vx + (p.y - a.y) * vy) / L2, 0, 1); return Math.hypot(p.x - (a.x + vx * k), p.y - (a.y + vy * k)); }
function cqTelePasso() {
  if (!CQ.tele.length) return;
  const p = G.p, t = G.agora, vivo = G.save.hp > 0;
  CQ.tele = CQ.tele.filter(e => {
    if (e.m && !G.mons.includes(e.m) && e.tipo !== 'faixa' && e.tipo !== 'ola') return false; // quem lançou saiu de campo: o aviso some
    if (t < e.t0) return true;
    if (e.tipo === 'circ') {
      if (t < e.t0 + e.dur) return true;
      efeito('impacto', e.x, e.y, e.cor || '#ff6a4a');
      if (vivo && Math.hypot(p.x - e.x, p.y - e.y) <= e.r) cqAplica(e.ef, e.m, e);
      return false;
    }
    if (e.tipo === 'linha') {
      if (t < e.t0 + e.dur) return true;
      if (e.dash && e.m && G.mons.includes(e.m)) cqDesliza(e.m, e.x1, e.y1);
      if (vivo && cqDistSeg(p, e, { x: e.x1, y: e.y1 }) <= e.r) cqAplica(e.ef, e.m, e.m || e);
      return false;
    }
    if (e.tipo === 'faixa') {
      if (t >= e.ate) return false;
      if (vivo && t >= e.t0 + e.arma && t >= (e.prox || 0) && cqNaFaixa(e, p)) {
        // pisou, volta: empurra para trás de onde você vinha andando (parado: para longe de quem levantou a bandeira)
        e.prox = t + 1200; const dr = p.pas && p.pas.dir;
        cqAplica(e.ef, e.m, dr && (dr[0] || dr[1]) ? { x: p.x + dr[0], y: p.y + dr[1] } : e.de);
      }
      return true;
    }
    if (e.tipo === 'anel') {
      const k = (t - e.t0 - e.aviso) / e.dur; if (k < 0) return true; if (k > 1) return false;
      e.r = 0.5 + (e.R - 0.5) * k;
      if (!e.hit && vivo && Math.abs(Math.hypot(p.x - e.x, p.y - e.y) - e.r) <= 0.55) { e.hit = true; cqAplica(e.ef, e.m, e); }
      return true;
    }
    if (e.tipo === 'ola') {
      const k = (t - e.t0) / 1000; if (k * e.vel > e.dist) return false;
      e.x = e.x0 + e.dir * k * e.vel;
      if (!e.hit && vivo && Math.abs(p.x - e.x) <= e.larg / 2 && p.y >= e.y0 && p.y <= e.y1) { e.hit = true; cqAplica(e.ef, e.m, { x: p.x - e.dir, y: p.y }); }
      return true;
    }
    return false;
  });
}
// adversário desliza até um ponto (arrancada), parando na primeira parede
function cqDesliza(m, x1, y1) {
  const n = Math.ceil(Math.hypot(x1 - m.x, y1 - m.y) / 0.25); let bx = m.x, by = m.y;
  for (let i = 1; i <= n; i++) { const x = m.x + (x1 - m.x) * i / n, y = m.y + (y1 - m.y) * i / n; if (tileBloq(Math.floor(x), Math.floor(y))) break; bx = x; by = y; }
  efeito('puff', m.x, m.y); m.pas = null; m.cam = null; m.x = Math.floor(bx) + 0.5; m.y = Math.floor(by) + 0.5; m.flip = x1 < m.x;
}
function cqDesenhaTele(ctx) {
  const t = G.agora;
  for (const e of CQ.tele) {
    if (t < e.t0) continue; ctx.save();
    if (e.tipo === 'circ') {
      const k = clamp((t - e.t0) / e.dur, 0, 1), c = e.rgb || '255,60,50';
      ctx.fillStyle = `rgba(${c},${0.12 + 0.18 * k})`; ctx.beginPath(); ctx.ellipse(e.x * T, e.y * T, e.r * T, e.r * T * 0.62, 0, 0, 7); ctx.fill();
      ctx.fillStyle = `rgba(${c},${0.25 + 0.3 * k})`; ctx.beginPath(); ctx.ellipse(e.x * T, e.y * T, e.r * T * k, e.r * T * 0.62 * k, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = `rgba(${c},0.9)`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(e.x * T, e.y * T, e.r * T, e.r * T * 0.62, 0, 0, 7); ctx.stroke();
    } else if (e.tipo === 'linha') {
      const k = clamp((t - e.t0) / e.dur, 0, 1), ang = Math.atan2(e.y1 - e.y, e.x1 - e.x), L = Math.hypot(e.x1 - e.x, e.y1 - e.y);
      ctx.translate(e.x * T, e.y * T); ctx.rotate(ang);
      ctx.fillStyle = `rgba(255,60,50,${0.15 + 0.2 * k})`; ctx.fillRect(0, -e.r * T, L * T, e.r * 2 * T);
      ctx.fillStyle = `rgba(255,140,60,${0.3 + 0.3 * k})`; ctx.fillRect(0, -e.r * T, L * T * k, e.r * 2 * T);
      ctx.strokeStyle = 'rgba(255,40,40,0.9)'; ctx.lineWidth = 3; ctx.strokeRect(0, -e.r * T, L * T, e.r * 2 * T);
    } else if (e.tipo === 'faixa') { // faixa de impedimento: listrada amarelo/vermelho (acende quando "arma")
      const armada = t >= e.t0 + e.arma, fim = clamp((e.ate - t) / 600, 0, 1);
      ctx.translate(e.x * T, e.y * T); ctx.rotate(e.ang); ctx.globalAlpha *= (armada ? 0.75 : 0.35 + 0.2 * Math.sin(t / 90)) * fim;
      const w = e.comp * T, h = e.larg * T, n = Math.max(2, Math.round(e.comp * 2));
      for (let i = 0; i < n; i++) { ctx.fillStyle = i % 2 ? '#ffd23f' : '#ff4a3a'; ctx.fillRect(-w / 2 + i * w / n, -h / 2, w / n + 0.5, h); }
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(-w / 2, -h / 2, w, h);
    } else if (e.tipo === 'anel') {
      const k = (t - e.t0 - e.aviso) / e.dur;
      if (k < 0) { ctx.strokeStyle = `rgba(255,170,60,${0.35 + 0.3 * Math.sin(t / 80)})`; ctx.lineWidth = 3; ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.ellipse(e.x * T, e.y * T, e.R * T, e.R * T * 0.62, 0, 0, 7); ctx.stroke(); }
      else { const r = e.r || 0.5; ctx.strokeStyle = `rgba(255,200,90,${0.9 - 0.5 * k})`; ctx.lineWidth = 10; ctx.beginPath(); ctx.ellipse(e.x * T, e.y * T, r * T, r * T * 0.62, 0, 0, 7); ctx.stroke(); }
    } else if (e.tipo === 'ola') { // a ola: uma faixa colorida de torcida que atravessa o mapa
      const g = ctx.createLinearGradient((e.x - e.larg / 2) * T, 0, (e.x + e.larg / 2) * T, 0);
      g.addColorStop(0, 'rgba(255,90,140,0)'); g.addColorStop(0.5, 'rgba(255,210,80,0.45)'); g.addColorStop(1, 'rgba(90,160,255,0)');
      ctx.fillStyle = g; ctx.fillRect((e.x - e.larg / 2) * T, e.y0 * T, e.larg * T, (e.y1 - e.y0) * T);
    }
    ctx.restore();
  }
  // o cone do goleiro (para onde ele está olhando) e a aura do técnico
  for (const m of G.mons) {
    const d = m.d; if (!d || !d.cq) continue;
    if (d.cqFrente && m.cqOlho != null && m.bravo) { ctx.save(); ctx.fillStyle = 'rgba(150,230,255,0.18)'; ctx.strokeStyle = 'rgba(150,230,255,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(m.x * T, m.y * T); ctx.arc(m.x * T, m.y * T, 1.6 * T, m.cqOlho - CQ_BAL.goleiro.cone, m.cqOlho + CQ_BAL.goleiro.cone); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
    if (d.cqTipo === 'tecnico' && m.bravo) { const r = CQ_BAL.tecnico.raio; ctx.save(); ctx.strokeStyle = `rgba(255,220,120,${0.35 + 0.15 * Math.sin(G.agora / 200)})`; ctx.lineWidth = 3; ctx.setLineDash([6, 10]); ctx.beginPath(); ctx.ellipse(m.x * T, m.y * T, r * T, r * T * 0.62, 0, 0, 7); ctx.stroke(); ctx.restore(); }
    if (m.cqEscudoAte > G.agora) { ctx.save(); ctx.strokeStyle = 'rgba(140,232,255,0.9)'; ctx.fillStyle = 'rgba(140,232,255,0.16)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(m.x * T, m.y * T, 1.05 * T, 0.66 * T, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore(); }
  }
}
{
  const _dccCq = typeof desenhaChaoClima === 'function' ? desenhaChaoClima : null;
  desenhaChaoClima = function (ctx) { if (_dccCq) _dccCq.apply(this, arguments); if (CQ.ala || CQ.tele.length) try { cqDesenhaTele(ctx); } catch (e) { cqErro(e); } };
  // escuridão do Túnel (e do Gramado): só um círculo de luz em volta de você
  const _noiteCq = desenhaNoite;
  desenhaNoite = function (ctx, cam, vw, vh) {
    const r = _noiteCq.apply(this, arguments);
    try {
      const raio = CQ.ala ? cqEscuroRaio() : 0;
      if (raio > 0 && G.p) {
        const cx = G.p.x * T, cy = (G.p.y - 0.5) * T, R = raio * T, forte = raio <= CQ_BAL.pressao.escuro.raio + 0.01;
        const g = ctx.createRadialGradient(cx, cy, R * 0.55, cx, cy, R * 1.25);
        g.addColorStop(0, 'rgba(4,4,16,0)'); g.addColorStop(1, `rgba(4,4,16,${forte ? 0.9 : 0.45})`);
        ctx.save(); ctx.fillStyle = g; ctx.fillRect(cam.x - T, cam.y - T, vw + 2 * T, vh + 2 * T); ctx.restore();
      }
    } catch (e) { cqErro(e); }
    return r;
  };
}

/* ======================= cada adversário joga do seu jeito ======================= */
function cqInvoca(tipo, x, y, o = {}) {
  if (!MONSTROS[tipo] || G.mons.filter(q => q.cqInv).length >= CQ_BAL.invocadosMax) return null;
  const sp = { m: tipo, x: Math.floor(x), y: Math.floor(y), qtd: 1, raio: 2, cqInv: true };
  const n = criaMonstro(sp); if (!n) return null;
  if (o.hp || o.xp != null || o.semLoot) {
    n.d = Object.assign({}, n.d);
    if (o.hp) { n.d.hp = Math.max(1, Math.round(n.d.hp * o.hp)); n.hp = n.d.hp; }
    if (o.xp != null) n.d.xp = Math.round(n.d.xp * o.xp);
    if (o.semLoot) { n.d.loot = []; n.d.ouro = [0, Math.round((n.d.ouro || [0, 0])[1] * 0.2)]; }
  }
  n.cqInv = true; n.bravo = true; G.mons.push(n); efeito('puff', n.x, n.y); efeito('area', n.x, n.y, '#c8d8ff', 1.2);
  return n;
}
function cqCartao(m) {
  const p = G.p, t = G.agora;
  if ((p.cqAmareloAte || 0) > t) { p.cqVermelhoAte = t + 3000; p.cqAmareloAte = 0; texto(m, '🟥 RED CARD!', '#ff5a5a', 1200, -0.9); texto(p, 'No moves for 3 s!', '#ff8a8a', 1300, -0.4); som('apito'); log('🟥 Red card! For 3 seconds you can’t use moves (normal touches still work).', 'l-dano'); }
  else { p.cqAmareloAte = t + 15000; p.lentoAte = Math.max(p.lentoAte || 0, t + 3000); texto(m, '🟨 YELLOW CARD!', '#ffe14a', 1200, -0.9); texto(p, 'mais lento', '#ffe14a', 900, -0.3); som('apito'); }
  m.golpe = t; m.flip = p.x < m.x;
}
function cqGandulaRouba(m) {
  const s = G.save, st = stats(), tira = Math.min(s.foco, Math.round(st.maxFoco * CQ_BAL.gandula.foco));
  if (tira > 0) { s.foco -= tira; m.cqRoubo = (m.cqRoubo || 0) + tira; texto(G.p, '-' + fmt(tira) + ' foco', '#6ab8ff', 800, -0.3); }
  m.cqFoge = G.agora + CQ_BAL.gandula.foge; texto(m, '⚽ STOLE THE BALL!', '#ffe14a', 1200, -0.9);
  if (!CQ.dicaGandula) { CQ.dicaGandula = true; log('⚽ The Lightning Ball Kid stole the ball (and a bit of your focus)! Catch him to get it back.', 'l-info'); }
}
function cqFaixa(m, de, centro, ang, ef, o = {}) {
  return cqTele({ tipo: 'faixa', x: centro.x, y: centro.y, ang, comp: o.comp || 7, larg: o.larg || 0.95, arma: o.arma || 900, ate: G.agora + (o.dura || 6000), ef, m, de: { x: de.x, y: de.y } });
}
const CQ_EF_IMPEDIMENTO = { empurra: 3, dano: 0.05, lento: 1500, txt: '🚩 OFFSIDE! Go back!', cor: '#ffe14a' };
function cqAdv(m, dt) {
  const d = m.d, p = G.p, t = G.agora; if (!p || G.save.hp <= 0) return;
  if (d.cqChefe) { cqChefePasso(m, dt); if (d.cqTipo !== 'onze_cap') return; }
  // prorrogação (Gramado): quanto mais a briga dura, mais forte ele fica
  if (CQ.ala === 'gramado' && !d.cqChefe) {
    if (m.bravo) {
      m.cqBravoT = (m.cqBravoT || 0) + (dt || 16); const P = CQ_BAL.prorrogacao, passo = Math.floor(m.cqBravoT / P.passo);
      if (passo > (m.cqPasso || 0)) { m.cqPasso = passo; m.cqProrr = Math.min(P.max, passo * P.atk); cqTxt(m, `⏱️ EXTRA TIME! +${Math.round(m.cqProrr * 100)}%`, '#ffb03a', 500); }
    } else if (m.cqBravoT) { m.cqBravoT = 0; m.cqPasso = 0; m.cqProrr = 0; }
  }
  if (!m.bravo) return;
  const dd = dist(m, p);
  if (d.cqFrente && (m.cqOlho == null || t >= (m.cqVira || 0))) { m.cqOlho = Math.atan2(p.y - m.y, p.x - m.x); m.cqVira = t + CQ_BAL.goleiro.vira; }
  if (t < (m.cqCd || 0)) return;
  switch (d.cqTipo) {
    case 'reserva': {
      m.cqCd = t + rnd(12000, 16000); if (m.cqInv) return;
      const filhos = G.mons.filter(o => o.cqPai === m && o.hp > 0).length;
      if (filhos < 2) { const n = cqInvoca('cq_reserva', m.x, m.y, { hp: 0.45, xp: 0.25, semLoot: true }); if (n) { n.cqPai = m; texto(m, '🔁 SUBSTITUTION!', '#c8f0ff', 1100, -0.9); som('apito'); } }
      break;
    }
    case 'massagista': {
      const ferido = G.mons.filter(o => o !== m && o.d.cq && !o.d.cqChefe && o.hp > 0 && o.hp < o.d.hp * 0.75 && dist(o, m) <= 5).sort((a, b) => a.hp / a.d.hp - b.hp / b.d.hp)[0];
      m.cqCd = t + (ferido ? 6000 : 1500);
      if (ferido) { const cura = Math.round(ferido.d.hp * CQ_BAL.massagem); ferido.hp = Math.min(ferido.d.hp, ferido.hp + cura); projetil(m, ferido, 'bola', () => { }); texto(ferido, '+' + fmt(cura), '#6aff9a', 900); texto(m, '💤 MASSAGE!', '#b0ffb0', 900, -0.9); }
      break;
    }
    case 'bandeirinha': {
      m.cqCd = t + rnd(8000, 10000); if (dd > 8 || dd < 0.6) { m.cqCd = t + 1200; return; }
      const ux = (m.x - p.x) / dd, uy = (m.y - p.y) / dd; // a faixa fica entre você e ele, atravessada no caminho
      cqFaixa(m, m, { x: p.x + ux * 1.2, y: p.y + uy * 1.2 }, Math.atan2(uy, ux) + Math.PI / 2, CQ_EF_IMPEDIMENTO);
      texto(m, '🚩 OFFSIDE!', '#ffe14a', 1100, -0.9); m.golpe = t; som('apito');
      break;
    }
    case 'arbitro': { m.cqCd = t + rnd(9000, 11000); if (dd <= 4.5) cqCartao(m); else m.cqCd = t + 1500; break; }
    case 'bumbo': {
      m.cqCd = t + rnd(7500, 9000); if (dd > 6) { m.cqCd = t + 1500; return; }
      cqTele({ tipo: 'anel', x: m.x, y: m.y, R: 4.5, aviso: 700, dur: 900, m, ef: { dano: 0.08, empurra: 2.5, foco: 0.04, txt: '🥁 BOOM-BOOM!', cor: '#ffc85a' } });
      texto(m, '🥁 BOOM-BOOM!', '#ffc85a', 1100, -0.9); m.golpe = t;
      break;
    }
    case 'mascote': { m.cqCd = t + rnd(7000, 9000); if (dd <= 1.6 && Math.random() < 0.5) { p.tontoAte = Math.max(p.tontoAte || 0, t + 800); texto(m, '🤗 BIG HUG!', '#ffb0d0', 1100, -0.9); m.golpe = t; } break; }
    case 'craque': {
      m.cqCd = t + rnd(8000, 10000); if (dd > 3) { m.cqCd = t + 1500; return; }
      cqPassaPorTras(m) && texto(m, '🌀 DRIBBLED PAST!', '#c77aff', 1000, -0.9);
      break;
    }
    case 'tecnico': {
      m.cqCd = t + 500;
      for (const o of G.mons) if (o !== m && o.d.cq && dist(o, m) <= CQ_BAL.tecnico.raio) o.cqAuraAte = t + 800;
      if (Math.random() < 0.02) fala(m, d.falas[rndi(0, d.falas.length - 1)]);
      break;
    }
    case 'onze_ataque': {
      m.cqCd = t + rnd(5500, 7000); if (dd < 1.6 || dd > 8) { m.cqCd = t + 1200; return; }
      const ux = (p.x - m.x) / dd, uy = (p.y - m.y) / dd;
      cqTele({ tipo: 'linha', x: m.x, y: m.y, x1: p.x + ux * 1.5, y1: p.y + uy * 1.5, r: 0.8, dur: 950, dash: true, m, ef: { dano: 0.12, txt: '⚡ COUNTERATTACK!', cor: '#ffb03a' } });
      texto(m, '⚡ COUNTERATTACK!', '#ffb03a', 1000, -0.9);
      break;
    }
    case 'onze_meio': {
      m.cqCd = t + rnd(5500, 6500);
      const ferido = G.mons.filter(o => o !== m && o.d.cqOnze && o.hp > 0 && o.hp < o.d.hp * 0.8).sort((a, b) => a.hp / a.d.hp - b.hp / b.d.hp)[0];
      if (ferido) { const cura = Math.round(Math.min(ferido.d.hp, m.d.hp * 2) * 0.12); /* (no capitão o passe recupera pouco: conta o fôlego de quem passa) */ ferido.hp = Math.min(ferido.d.hp, ferido.hp + cura); projetil(m, ferido, 'bola', () => { }); texto(ferido, '+' + fmt(cura), '#6aff9a', 900); texto(m, '🔁 ONE-TWO!', '#b0ffb0', 900, -0.9); }
      else if (dd <= 6 && linhaVisao(m, p)) { projetil(m, p, 'bolaforte', () => cqAplica({ foco: 0.05, tonto: 400, txt: '🔁 PASS!' }, m, m)); m.golpe = t; }
      break;
    }
    case 'onze_zaga': {
      m.cqCd = t + rnd(8000, 10000);
      if (!CQ.final || t < (CQ.final.faixaT || 0) || dd > 7 || dd < 0.6) { m.cqCd = t + 1500; return; }
      CQ.final.faixaT = t + 3500; const ux = (m.x - p.x) / dd, uy = (m.y - p.y) / dd;
      cqFaixa(m, m, { x: p.x + ux * 1.2, y: p.y + uy * 1.2 }, Math.atan2(uy, ux) + Math.PI / 2, CQ_EF_IMPEDIMENTO, { comp: 9 });
      texto(m, '🚩 OFFSIDE LINE!', '#ffe14a', 1100, -0.9);
      break;
    }
  }
}
// aparece do outro lado do jogador (drible)
function cqPassaPorTras(m) {
  const p = G.p, dd = Math.max(0.5, dist(m, p)), ux = (p.x - m.x) / dd, uy = (p.y - m.y) / dd;
  for (const k of [1.4, 1.0, 2.0]) {
    const tx = Math.floor(p.x + ux * k), ty = Math.floor(p.y + uy * k);
    if (tileBloq(tx, ty) || (modoGrade() && typeof grLivre === 'function' && !grLivre(tx, ty, m))) continue;
    efeito('puff', m.x, m.y); m.pas = null; m.cam = null; m.x = tx + 0.5; m.y = ty + 0.5; m.flip = p.x < m.x; efeito('puff', m.x, m.y);
    return true;
  }
  return false;
}
// o gandula foge com a bola (no lugar de correr atrás de você)
function cqFoge(m, dt) {
  const v = tpsDeVel(velMonstro(m.d)) * (dt || 16) / 1000 * 1.35;
  andaAte(m, G.p, v, true); m.mov = true;
}

/* ---------- chefões: fases, reservas, escudo e golpes com aviso ---------- */
function cqFase(m, fase) {
  const b = m.cqb, d = m.d; b.fase = fase;
  const n = fase === 1 ? 2 : 3, adds = d.cqAdds || [];
  for (let i = 0; i < n && adds.length; i++) cqInvoca(adds[i % adds.length], m.x, m.y, { hp: d.cqOnze ? 0.4 : 0.6, xp: d.cqOnze ? 0 : 0.5, semLoot: true });
  m.cqEscudoAte = G.agora + 3500;
  if (fase === 1) { banner('🔁 SUBSTITUTION!', `${d.nome} called in the subs and raised a shield!`); fala(m, d.falas[1] || 'Subs, get out there!'); }
  else { d.atk = Math.round(b.atk0 * 1.2); d.atkCd = Math.round(b.cd0 * 0.75); banner('FINAL MODE!', `${d.nome} is going all out! Watch the ground!`); fala(m, d.falas[2] || 'Now it\'s serious!'); }
  som('apito');
}
function cqChefePasso(m, dt) {
  if (!m.cqb) { m.d = Object.assign({}, m.d); m.cqb = { fase: 0, prox: G.agora + 5000, atk0: m.d.atk, cd0: m.d.atkCd }; }
  const b = m.cqb, d = m.d, t = G.agora;
  if (!m.bravo) { if (b.fase && m.hp >= d.hp) { b.fase = 0; d.atk = b.atk0; d.atkCd = b.cd0; m.cqProrr = 0; m.cqBravoT = 0; } return; }
  const pc = m.hp / d.hp;
  if (b.fase === 0 && pc <= 0.7) cqFase(m, 1); else if (b.fase === 1 && pc <= 0.35) cqFase(m, 2);
  if (d.cqProrrChefe) { m.cqBravoT = (m.cqBravoT || 0) + (dt || 16); const pas = Math.floor(m.cqBravoT / 30000); if (pas > (m.cqPasso || 0)) { m.cqPasso = pas; m.cqProrr = Math.min(0.4, pas * 0.08); cqTxt(m, `⏱️ EXTRA TIME! +${Math.round(m.cqProrr * 100)}%`, '#ffb03a', 500); } }
  if (t >= b.prox && G.save.hp > 0 && dist(m, G.p) < 10) {
    const kit = d.cqKit || ['chuva']; cqGolpe(m, kit[rndi(0, kit.length - 1)]);
    b.prox = t + rnd(5200, 7000) * [1, 0.82, 0.62][b.fase];
  }
}
function cqGolpe(m, g) {
  const p = G.p, d = m.d, dd = Math.max(0.5, dist(m, p)), fase = m.cqb ? m.cqb.fase : 0, dur = fase === 2 ? 950 : 1150;
  const nome = { bomba: 'ICE BOMB', chuva: 'RAIN OF BALLS', subst: 'SUBSTITUTION', impedimento: 'OFFSIDE LINE', cartao: 'CARD', apagao: 'BLACKOUT', bumbo: 'THUNDER DRUM', ola: 'CROWD WAVE', drible: 'DRIBBLE OF THE FINAL', chute: 'SHOT OF THE FINAL' }[g] || g;
  tituloSkill(m, nome + '!', '#c8d8ff'); m.golpe = G.agora; m.flip = p.x < m.x;
  if (g === 'bomba') cqTele({ tipo: 'circ', x: p.x, y: p.y, r: 1.5, dur, m, rgb: '120,200,255', ef: { dano: 0.2, lento: 2500, txt: '🥶 FROZEN!', cor: '#9adcff' } });
  else if (g === 'chuva') { const n = fase === 2 ? 6 : 4; for (let i = 0; i < n; i++) { const a = Math.random() * 7, r = i ? rnd(1, 2.8) : 0; cqTele({ tipo: 'circ', x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r, r: 1.05, dur, t0: G.agora + i * 140, m, ef: { dano: 0.13 } }); } }
  else if (g === 'subst') { const adds = d.cqAdds || []; for (let i = 0; i < 2 && adds.length; i++) cqInvoca(adds[rndi(0, adds.length - 1)], m.x, m.y, { hp: 0.5, xp: 0.3, semLoot: true }); som('apito'); }
  else if (g === 'impedimento') { const ux = (m.x - p.x) / dd, uy = (m.y - p.y) / dd, a = Math.atan2(uy, ux) + Math.PI / 2;
    cqFaixa(m, m, { x: p.x, y: p.y }, a, CQ_EF_IMPEDIMENTO, { arma: 1100, comp: 9 }); cqFaixa(m, m, { x: p.x - ux * 2.5, y: p.y - uy * 2.5 }, a, CQ_EF_IMPEDIMENTO, { arma: 1100, comp: 9 }); som('apito'); }
  else if (g === 'cartao') { if (dd <= 6) cqCartao(m); }
  else if (g === 'apagao') { CQ.apagaoAte = G.agora + 4500; texto(p, '💡 BLACKOUT!', '#ffe14a', 1300, -0.6); if (G.mons.filter(o => o.cqInv).length < 3) cqInvoca((d.cqAdds || ['cq_zagueiro'])[0], m.x, m.y, { hp: 0.5, xp: 0.3, semLoot: true }); }
  else if (g === 'bumbo') cqTele({ tipo: 'anel', x: m.x, y: m.y, R: fase === 2 ? 6.5 : 5.5, aviso: 750, dur: 1000, m, ef: { dano: 0.12, empurra: 3, foco: 0.06, txt: '🥁 BOOM-BOOM!', cor: '#ffc85a' } });
  else if (g === 'ola') { const dir = Math.random() < 0.5 ? 1 : -1; cqTele({ tipo: 'ola', x0: p.x - dir * 9, x: p.x - dir * 9, dir, vel: 7, dist: 18, larg: 1.8, y0: p.y - 6, y1: p.y + 6, m, ef: { dano: 0.1, empurra: 2, foco: 0.08, txt: '🌊 WAVE!', cor: '#ffd23f' } }); }
  else if (g === 'drible') { if (cqPassaPorTras(m)) cqTele({ tipo: 'circ', x: m.x, y: m.y, r: 2.0, dur: 900, m, ef: { dano: 0.18, txt: '🌀 DRIBBLED!' } }); }
  else if (g === 'chute') { const ux = (p.x - m.x) / dd, uy = (p.y - m.y) / dd; cqTele({ tipo: 'linha', x: m.x, y: m.y, x1: m.x + ux * 8, y1: m.y + uy * 8, r: 0.8, dur, m, ef: { dano: 0.24, txt: '⚽ BOOM SHOT!' } }); }
  som('chute');
}
{
  const _amCq = atualizaMonstro;
  atualizaMonstro = function (m, dt) {
    const d = m && m.d; if (!d || !d.cq) return _amCq.apply(this, arguments);
    if (m.cqFoge > G.agora && G.p && G.save.hp > 0) { try { cqFoge(m, dt); } catch (e) { cqErro(e); } return; }
    const r = _amCq.apply(this, arguments);
    try { cqAdv(m, dt); } catch (e) { cqErro(e); }
    return r;
  };
}

/* ======================= dano: muralha, desvio, defesa de frente, aura, escudo, escuridão, piso da final ======================= */
{ // "jogada forte": o que sai de uma jogada (drible da barra / especial da classe), mesmo o chute que voa até o alvo
  const _udCq = usarDrible;
  usarDrible = function () {
    if (G.p && (G.p.cqVermelhoAte || 0) > G.agora) { if (G.agora > (CQ.avisoVermelho || 0)) { CQ.avisoVermelho = G.agora + 900; log(`🟥 Red card: no moves for ${Math.ceil((G.p.cqVermelhoAte - G.agora) / 1000)} more s.`, 'l-sis'); } return; }
    CQ.forte++; try { return _udCq.apply(this, arguments); } finally { CQ.forte--; }
  };
  const _ucCq = usarClasse;
  usarClasse = function () {
    if (G.p && (G.p.cqVermelhoAte || 0) > G.agora) { log('🟥 Red card: wait a little bit to use your class move.', 'l-sis'); return; }
    CQ.forte++; try { return _ucCq.apply(this, arguments); } finally { CQ.forte--; }
  };
  const _projCq = projetil;
  projetil = function (de, para, tipo, cb) {
    if (CQ.forte > 0 && cb && G.p && de === G.p) { const c = cb; cb = function () { CQ.forte++; try { return c.apply(this, arguments); } finally { CQ.forte--; } }; }
    return _projCq.call(this, de, para, tipo, cb);
  };
}
function cqForte(dano) {
  if (CQ.forte > 0) return true;
  try { return dano >= CQ_BAL.muralhaForte * danoMaxJogador(G.modo === 'chute' ? 'chute' : 'drible'); } catch (e) { return false; }
}
const cqPisoAtivo = () => { try { return typeof lchPodeLance === 'function' && lchPodeLance(); } catch (e) { return false; } };
{
  const _adCq = aplicaDano;
  aplicaDano = function (m, dano) {
    const d = m && m.d;
    if (d && d.cq && dano > 0 && G.p) {
      try {
        const t = G.agora, dd = dist(m, G.p);
        if (d.cqDesvia && dd > CQ_BAL.desviaLonge && Math.random() < d.cqDesvia) { m.bravo = true; cqTxt(m, '💨 DODGED! Get closer!', '#bfefff'); efeito('puff', m.x, m.y); return; }
        if (d.cqFrente && m.cqOlho != null) {
          let df = Math.abs(Math.atan2(G.p.y - m.y, G.p.x - m.x) - m.cqOlho); if (df > Math.PI) df = 2 * Math.PI - df;
          if (df < CQ_BAL.goleiro.cone) { dano = Math.max(1, Math.round(dano * (1 - d.cqFrente))); cqTxt(m, '🧤 SAVED! Attack from the sides!', '#9fe8ff'); }
        }
        if (d.cqMuralha && !cqForte(dano)) { dano = Math.max(1, Math.round(dano * d.cqMuralha)); cqTxt(m, '🧱 WALL! Use a strong move!', '#ffd08a'); }
        if ((m.cqAuraAte || 0) > t) dano = Math.max(1, Math.round(dano * (1 - CQ_BAL.tecnico.def)));
        if ((m.cqEscudoAte || 0) > t) { dano = Math.max(1, Math.round(dano * 0.2)); cqTxt(m, '🛡️ SHIELD!', '#8ae8ff', 900); }
        if (CQ.p && CQ.p.escuro && dd > CQ_BAL.pressao.escuro.raio) dano = Math.max(1, Math.round(dano * (1 - CQ_BAL.pressao.escuro.longe)));
        if (d.cqPiso && cqPisoAtivo()) { // a final só termina com o lance decisivo (se o lance estiver ligado)
          const piso = Math.ceil(d.hp * CQ_BAL.onze.piso);
          if (m.hp - dano < piso) { dano = m.hp - piso; if (dano <= 0) { m.bravo = true; cqTxt(m, '⚽ Only the DECISIVE SHOT beats the captain!', '#ffe14a', 2200); return; } }
        }
      } catch (e) { cqErro(e); }
      return _adCq.call(this, m, dano);
    }
    return _adCq.apply(this, arguments);
  };
  const _rdCq = recebeDano;
  recebeDano = function (dano, m) {
    try {
      if (CQ.p && CQ.p.frio && dano > 0) dano = Math.round(dano * (1 + CQ_BAL.pressao.frio.dano));
      if (m && m.d && m.d.cq && dano > 0) {
        let f = 1; if ((m.cqAuraAte || 0) > G.agora) f += CQ_BAL.tecnico.atk; if (m.cqProrr) f += m.cqProrr;
        if (f !== 1) dano = Math.round(dano * f);
      }
    } catch (e) { cqErro(e); }
    return _rdCq.call(this, dano, m);
  };
  const _maCq = monstroAtaca;
  monstroAtaca = function (m) {
    const r = _maCq.apply(this, arguments);
    try { if (m && m.d && m.d.cqTipo === 'gandula' && !(m.cqFoge > G.agora) && G.save.hp > 0 && Math.random() < 0.45) cqGandulaRouba(m); } catch (e) { cqErro(e); }
    return r;
  };
}

/* ======================= vitórias: chefões, ingressos, Bolinha Esquecida ======================= */
function cqChefeVenceu(m) {
  const s = G.save, c = cqChefeReg(m.tipo), L = m.d.nivel || nivelMonstro(m.d), hoje = cqHoje(), grande = c.dia !== hoje, B = CQ_BAL.chefe;
  c.dia = hoje; c.vitorias++; c.volta = Date.now() + B.volta;
  const rs = G.respawns.find(x => x.sp === m.sp); if (rs) rs.em = G.agora + B.volta;
  for (const o of G.mons.filter(o => o.cqInv)) efeito('puff', o.x, o.y);
  G.mons = G.mons.filter(o => !o.cqInv); CQ.tele = [];
  const ing = B.ingressos[grande ? 0 : 1], mat = B.mat[grande ? 0 : 1];
  recebeItem('ingresso_esquecido', ing); recebeItem(CQ_MAT(L), mat);
  let txt = `+${ing} Forgotten Ticket(s) and ${mat}x ${ITENS[CQ_MAT(L)].nome}`;
  if (grande) {
    const xp = Math.round(cqXpNivel(L) * (B.xpGrande - B.xpPequeno)), ouro = cqRed(cqRenda(L) * B.ouro);
    if (xp > 0) ganhaXp(xp); s.ouro += ouro; txt += `, +${fmt(xp)} XP and +${fmt(ouro)} coins (today’s big prize)`;
  } else txt += ' (the big prize comes back tomorrow)';
  log(`👑 ${m.d.nome} beaten! ${txt}. They’ll be back on the field in ${Math.round(B.volta / 60000)} min.`, 'l-lendario');
  salvar(); G.uiSujo = true;
}
function cqContaBolinha(m) {
  const s = G.save, c = cqDados(); if (!s || s.flags.pet_bolinha_esquecida || m.cqInv || m.d.cqOnze) return;
  c.abates++;
  if (Math.random() < CQ_BAL.bolinha.chance || c.abates >= CQ_BAL.bolinha.garantia) {
    s.flags.pet_bolinha_esquecida = true; c.abates = 0;
    banner('⚽ THE LITTLE FORGOTTEN BALL!', 'An old laced leather ball wants to play with you!'); som('nivel');
    log('⚽ A LITTLE FORGOTTEN BALL, which waited a hundred years for the final whistle, decided to come with you! It’s a pet: Equipment → ✨ Cosmetics → pet.', 'l-lvl');
  }
}
{
  const _mtCq = matar;
  matar = function (m) {
    const d = m && m.d, cq = !!(d && d.cq);
    const r = _mtCq.apply(this, arguments);
    if (cq) try {
      if (m.cqInv || (m.sp && m.sp.cqInv)) G.respawns = G.respawns.filter(x => x.sp !== m.sp);
      if (m.cqRoubo > 0 && G.save) { const v = Math.round(m.cqRoubo * CQ_BAL.gandula.devolve); G.save.foco = Math.min(stats().maxFoco, G.save.foco + v); texto(G.p, '+' + fmt(v) + ' foco', '#8ac8ff', 1000, -0.3); log('⚽ You got the ball back from the ball kid (and your focus came back with extra)!', 'l-info'); }
      if (d.cqOnze) cqFinalMatou(m);
      else if (d.cqChefe) cqChefeVenceu(m);
      cqContaBolinha(m);
    } catch (e) { cqErro(e); }
    return r;
  };
}

/* ======================= mapas: chefão garantido, volta do chefão, aviso ao entrar ======================= */
// se o mapa da ala não tiver o chefão, ele fica no ponto mais longe da chegada (a frente MAPAS deve pôr um spawn próprio)
function cqPreparaMapa(m) {
  const ala = cqAlaDoMapa(m); if (!ala || !m || m.id !== CQ_ALAS[ala].mapa || m._cqPronto) return; m._cqPronto = true;
  const ch = CQ_ALAS[ala].chefe; if (m.spawns.some(sp => sp.m === ch)) return;
  const W = m.w, H = m.h, ini = m.inicio || { x: W >> 1, y: H >> 1 }, dd = new Int32Array(W * H).fill(-1), fila = [[Math.floor(ini.x), Math.floor(ini.y)]];
  const anda = (x, y) => x > 0 && y > 0 && x < W - 1 && y < H - 1 && CH_ANDA(m.chao[y * W + x]) && !(m.obj[y * W + x] && OBJ_BLOQUEIA.has(m.obj[y * W + x].t));
  dd[fila[0][1] * W + fila[0][0]] = 0; let melhor = fila[0];
  for (let i = 0; i < fila.length; i++) { const [x, y] = fila[i]; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + a, ny = y + b; if (!anda(nx, ny) || dd[ny * W + nx] >= 0) continue; dd[ny * W + nx] = dd[y * W + x] + 1; fila.push([nx, ny]); if (dd[ny * W + nx] > dd[melhor[1] * W + melhor[0]]) melhor = [nx, ny]; } }
  m.spawns.push({ m: ch, x: melhor[0], y: melhor[1], qtd: 1, raio: 0 });
}
{
  const _gmCq = getMapa;
  getMapa = function (id) { const novo = !MAPAS[id]; const m = _gmCq.apply(this, arguments); if (novo && /^cq_/.test(id)) try { cqPreparaMapa(m); } catch (e) { cqErro(e); } return m; };
  const _emCq = entrarMapa;
  entrarMapa = function (id) {
    if (CQ.final) cqFinalPara();
    const r = _emCq.apply(this, arguments);
    try { cqEntrou(); } catch (e) { cqErro(e); }
    return r;
  };
}
function cqEntrou() {
  CQ.mapa = G.mapa; CQ.tele = []; CQ.apagaoAte = 0; CQ.hud = ''; CQ.tP = 0; CQ.vigiaT = 0; CQ.faixasT = G.agora + 3000;
  CQ.ala = cqAlaDoMapa(G.mapa); CQ.olaT = G.agora + 25000;
  if (!CQ.ala) { CQ.p = null; cqHud(); return; }
  // chefão vencido há pouco: continua fora de campo até a hora dele (mesmo saindo e voltando ao mapa)
  for (const m of G.mons.slice()) if (m.d.cqChefe && !m.d.cqOnze) {
    const reg = cqChefeReg(m.tipo), falta = (reg.volta || 0) - Date.now();
    if (falta > 1000) { G.mons = G.mons.filter(o => o !== m); G.respawns.push({ sp: m.sp, em: G.agora + falta }); }
  }
  if (G.mapa.cqAla || CQ_MAPA_ALA[G.mapa.id]) G.mons = G.mons.filter(m => !m.d.cqOnze); // os Onze só entram pela final
  cqAvisoEntrada(); cqHud();
}
{ // a ola da Arquibancada: de tempos em tempos atravessa o mapa (só cansa o foco de quem não comeu o chá)
  const _atCq = atualiza;
  atualiza = function (dt) {
    const r = _atCq.apply(this, arguments);
    try {
      if (G.save && G.mapa && G.p) { // (atualiza só roda com o jogo andando)
        if (G.mapa !== CQ.mapa) cqEntrou();
        if (CQ.ala || CQ.tele.length) {
          if (G.agora >= CQ.tP) { CQ.tP = G.agora + 400; cqCalcPressao(); cqHud(); }
          cqTelePasso();
          if (CQ.ala === 'tunel' && G.agora >= (CQ.faixasT || 0)) { CQ.faixasT = G.agora + 9000; cqFaixasTunel(); }
          if (CQ.ala === 'arquibancada' && G.agora >= CQ.olaT && G.save.hp > 0) {
            CQ.olaT = G.agora + CQ_BAL.ola.cada; const p = G.p, dir = Math.random() < 0.5 ? 1 : -1;
            cqTele({ tipo: 'ola', x0: p.x - dir * 14, x: p.x - dir * 14, dir, vel: CQ_BAL.ola.vel, dist: 28, larg: 2.2, y0: p.y - 9, y1: p.y + 9, ef: { empurra: 1, foco: CQ.p && CQ.p.barulho ? CQ_BAL.ola.foco : 0, txt: '🌊 THE WAVE PASSED!', cor: '#ffd23f' } });
            log('🌊 CROWD WAVE! It’s going to sweep across the stands...', 'l-info');
          }
          if (CQ.ala === 'gramado' && G.agora >= (CQ.vigiaT || 0)) { CQ.vigiaT = G.agora + 250; cqFinalVigia(); }
          if (CQ.final) cqFinalPasso(dt || 16);
        }
      }
    } catch (e) { cqErro(e); }
    return r;
  };
}

// as faixas de impedimento fixas do Túnel (copa_mapas.js: CQ_MAPAS.tunelFaixas) acendem quando um bandeirinha (ou o Xerife)
// por perto está no jogo: 5 s acesas, depois apagam (dá para passar entre uma e outra)
function cqFaixasTunel() {
  const F = typeof CQ_MAPAS !== 'undefined' && CQ_MAPAS.tunelFaixas; if (!F || !F.length || G.mapa.id !== 'cq_tunel') return;
  const juizes = G.mons.filter(m => m.bravo && m.hp > 0 && (m.d.cqTipo === 'bandeirinha' || m.tipo === 'cq_xerife_tunel')); if (!juizes.length) return;
  let n = 0;
  for (const f of F) {
    const c = { x: f.x + f.w / 2, y: f.y + f.h / 2 }, j = juizes.find(m => Math.hypot(m.x - c.x, m.y - c.y) <= 14); if (!j) continue;
    const v = f.eixo === 'v';
    cqTele({ tipo: 'faixa', x: c.x, y: c.y, ang: v ? Math.PI / 2 : 0, comp: v ? f.h : f.w, larg: v ? f.w : f.h, arma: 900, ate: G.agora + 5000, ef: CQ_EF_IMPEDIMENTO, m: null, de: { x: j.x, y: j.y } }); n++;
  }
  if (n && G.agora > (CQ.avisoFaixa || 0)) { CQ.avisoFaixa = G.agora + 60000; log('🚩 The tunnel’s offside stripes lit up! Step on one and you go back: wait for them to turn off or take another path.', 'l-info'); }
}

/* ======================= refino: materiais dos itens 700+ ======================= */
// MATERIAL raro (do +5 em diante) pelo nível do item: 700–799 cq_mat_1, 800–899 cq_mat_2, 900+ cq_mat_3.
// As Relíquias da Torre continuam pedindo o material de antes (não muda o que já estava combinado com quem as tem).
{
  let relRef = false;
  const _custoCq = custoRefino;
  custoRefino = function (id) { const it = ITENS[id]; const ant = relRef; relRef = !!(it && it.reliquia); try { return _custoCq.apply(this, arguments); } finally { relRef = ant; } };
  const _matCq = materialRaroRefino;
  materialRaroRefino = function (lvl) { return !relRef && lvl >= 700 ? CQ_MAT(lvl) : _matCq.apply(this, arguments); };
}

/* ======================= mascote: Bolinha Esquecida ======================= */
try {
  if (typeof MASC !== 'undefined') MASC.bolinha_esquecida = { bonus: 'foco', v: 0.10, txt: 'foco' }; // o mesmo bônus do Mini-Robô (sem força nova)
  if (typeof ADORNOS2 !== 'undefined' && ADORNOS2.OPCOES && !ADORNOS2.OPCOES.mascote.some(o => o[0] === 'bolinha_esquecida'))
    ADORNOS2.OPCOES.mascote.push(['bolinha_esquecida', 'Little Forgotten Ball', '⚽', { ok: () => !!(G.save && G.save.flags && G.save.flags.pet_bolinha_esquecida), txt: '🔒 Super rare: shows up while you play in the Forgotten Cup' },
      'An old laced leather ball that waited a hundred years for the final whistle. Now it floats by your side!']);
} catch (e) { cqErro(e); }

/* ======================= Seu Saudade: troca de Ingressos e a porta da final ======================= */
function cqTroca(id, custo, npc) {
  const it = ITENS[id]; if (!it) return;
  const faz = () => {
    const tem = contaItem('ingresso_esquecido');
    if (tem < custo) { log(`🎟️ You need ${fmt(custo - tem)} more Forgotten Tickets.`, 'l-sis'); som('erro'); return; }
    removeItem('ingresso_esquecido', custo); recebeItem(id, 1);
    log(`👕 Trade with Seu Saudade: ${fmt(custo)} Forgotten Tickets for ${it.nome}!`, 'l-loot'); som('raro'); salvar(); G.uiSujo = true;
    cqModalTroca(npc);
  };
  if (typeof perguntaJogo === 'function') perguntaJogo(`Trade ${fmt(custo)} Forgotten Tickets for ${it.nome}?`, { sim: 'Replace' }).then(ok => { if (ok) faz(); });
  else faz();
}
function cqModalTroca(npc) {
  const s = G.save, n = contaItem('ingresso_esquecido');
  const secs = CQ_FAIXAS.map(f => {
    const custo = CQ_BAL.troca[f.L], pode = s.nivel >= f.L - 10;
    const ids = CQ_UE_IDS.filter(id => ITENS[id].lvl === f.L);
    return el('div', { class: 'cq-faixa' }, el('b', {}, `Tier ${f.L} ${pode ? '' : `(from level ${f.L - 10})`} — ${fmt(custo)} tickets each`),
      el('div', { class: 'opcoes', style: 'flex-wrap:wrap' }, ...ids.map(id => {
        const ok = pode && n >= custo, b = el('button', { class: 'btn mini' + (ok ? ' amarelo' : ''), type: 'button', disabled: ok ? null : 'disabled', onclick: () => cqTroca(id, custo, npc) }, ITENS[id].nome);
        if (typeof comTip === 'function') try { comTip(b, () => tipItem(id, 0)); } catch (e) { }
        return b;
      })));
  });
  abreModal(el('h2', {}, '👕 Forgotten Uniform'),
    el('p', {}, `You have ${fmt(n)} Forgotten Ticket(s). Pick any piece you want: no luck involved! Tickets drop from opponents in the Forgotten Cup (and lots from the captains and the final).`),
    ...secs,
    el('div', { class: 'opcoes' }, npc ? el('button', { class: 'btn', type: 'button', onclick: () => abrirNPC(npc) }, 'Back') : '', el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'Close')));
}
{
  const _abCq = abrirNPC;
  abrirNPC = function (npc) {
    const r = _abCq.apply(this, arguments);
    try {
      if (npc && npc.d && npc.d.cqRoupeiro) {
        const box = document.getElementById('modalConteudo'), ops = box && [...box.querySelectorAll('.opcoes')].pop(); if (!ops) return r;
        const tchau = [...ops.querySelectorAll('button')].find(b => /Tchau/.test(b.textContent));
        const bTroca = el('button', { class: 'btn amarelo', type: 'button', onclick: () => cqModalTroca(npc) }, `👕 Trade Tickets (${fmt(contaItem('ingresso_esquecido'))})`);
        const bFinal = el('button', { class: 'btn roxo', type: 'button', onclick: () => cqAbreFinal(npc) }, '🏆 The Final of the Forgotten Eleven');
        if (tchau) { tchau.before(bTroca); tchau.before(bFinal); } else ops.append(bTroca, bFinal);
      }
    } catch (e) { cqErro(e); }
    return r;
  };
  if (typeof iconeNPC === 'function') { const _icCq = iconeNPC; iconeNPC = function (n) { const d = n.d || NPCS[n.id] || {}; return d.cqRoupeiro ? '👕' : _icCq(n); }; }
}

/* ======================= 🏆 A FINAL: Os Onze Esquecidos ======================= */
// Joga-se na ARENA DA FINAL, a área cercada do Gramado da Final Eterna (copa_mapas.js: CQ_MAPAS.final = área, portão,
// saída e os pontos da formação). Entrou na arena (com a final liberada) → apito inicial; saiu da arena → a final para.
// O spawn fixo do cq_onze que o mapa tem (para o "onde achar" das missões) não entra em campo: os Onze entram por setor.
function cqArena() {
  try { if (typeof CQ_MAPAS === 'undefined') return null; if (!CQ_MAPAS.final && MAPAS_DEF.cq_gramado) getMapa('cq_gramado'); return CQ_MAPAS.final || null; } catch (e) { return null; }
}
const cqNaArena = (A, p) => !!(A && p && G.mapa && G.mapa.id === A.mapa && p.x >= A.area.x + 1 && p.x < A.area.x + A.area.w - 1 && p.y >= A.area.y + 1 && p.y < A.area.y + A.area.h - 1);
function cqFinalDados() {
  const f = cqDados().final, sem = cqSemana();
  if (f.semana !== sem) { if (f.semana && f.venceuSemana) f.dif = Math.min(CQ_BAL.onze.difMax, (f.dif || 1) + 1); f.semana = sem; f.venceuSemana = false; }
  return f;
}
function cqFinalPode() {
  const s = G.save; if (!s) return 'no game';
  const sg = (s.quests && s.quests.sg_f3 && s.quests.sg_f3.s === 'feita') || s.flags.cq_final_liberada;
  if (sg && s.nivel >= 950) { s.flags.cq_final_liberada = true; return ''; }
  if (s.nivel < 950) return '🔒 The final can only be played from level 950.';
  return '🔒 The final can only be played with the whole Origin Ball (finish the "The Origin Ball" saga).';
}
const cqFinalNivel = () => Math.min(1003, Math.max(953, ((G.save && G.save.nivel) || 950) + 3));
function cqVaiArena() {
  const A = cqArena(); if (!A) { log('The Final Arena is still being built.', 'l-sis'); return; }
  fechaModal(); som('apito'); trocaMapa(A.mapa, A.entrada.x + 1.5, A.entrada.y + 0.5);
}
function cqSaiArena() { const A = cqArena(); if (A && G.mapa && G.mapa.id === A.mapa) { G.caminho = null; if (G.p) G.p.pas = null; entrarMapa(A.mapa, A.volta.x + 0.5, A.volta.y + 0.5, true); } }
function cqAbreFinal(npc) {
  const f = cqFinalDados(), trava = cqFinalPode() || (cqArena() ? '' : '🔒 The Final Arena is still being built.');
  abreModal.largo = true;
  abreModal(el('h2', {}, '🏆 The Final of the Forgotten Eleven'),
    el('p', {}, 'The Origin Cup final never ended: the ball split apart before the whistle. The Forgotten Eleven have waited a hundred years for someone to play the final with them to the end! The Final Arena is on the Eternal Final Pitch, behind the fence.'),
    el('ul', { class: 'ar-regras' },
      el('li', {}, 'They take the field by line: ATTACK → MIDFIELD → DEFENSE → GOALKEEPER-CAPTAIN. Each line has a power.'),
      el('li', {}, 'When the captain is almost worn out, only the DECISIVE SHOT (⚽ Big chance!) wins the final. Missed? No problem: it shows up again.'),
      el('li', {}, `You have ${Math.round(CQ_BAL.onze.tempo / 60000)} minutes. On the Pitch it’s cold, dark and noisy: bring the 3 Cup foods.`),
      el('li', {}, `Every Monday the final starts over, and each week you win makes the next one harder. This week: difficulty ${f.dif || 1}, level ${cqFinalNivel()}.`),
      el('li', {}, f.venceuSemana ? '✅ You already won this week: playing again gives a small prize.' : `Weekly prize: lots of XP, coins, ${CQ_BAL.onze.ingressos[0]} Forgotten Tickets${G.save.flags.cq_campeao ? '' : ' and the FORGOTTEN TROPHY'}.`)),
    trava ? el('p', { class: 'dica' }, trava) : '',
    el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', type: 'button', disabled: trava ? 'disabled' : null, onclick: cqVaiArena }, '⚽ Go to the Final Arena'),
      npc ? el('button', { class: 'btn', type: 'button', onclick: () => abrirNPC(npc) }, 'Back') : '', el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'Not now')));
}
function cqFinalComeca(A) {
  const f = cqFinalDados(), L = cqFinalNivel(), D = f.dif || 1;
  cqOnzeMonta(L, D);
  G.mons = G.mons.filter(m => !m.d.cqOnze);
  CQ.final = { A, L, D, setor: -1, prox: G.agora + 3000, resta: CQ_BAL.onze.tempo, venceu: false, acabou: false, faixaT: 0, relanca: 0 };
  banner('🏆 THE FINAL OF THE FORGOTTEN ELEVEN!', `Difficulty ${D} · level ${L}. First up, the ATTACK!`); som('apito');
  log(`🏆 Kickoff! The Final of the Forgotten Eleven has started (difficulty ${D}). Leaving the arena ends the match.`, 'l-lvl');
}
function cqFinalPara(txt) {
  const F = CQ.final; if (!F) return; CQ.final = null; CQ.tele = [];
  const dela = o => o.d.cqOnze || (o.cqInv && F.A && cqNaArena(F.A, o));
  for (const o of G.mons.filter(dela)) efeito('puff', o.x, o.y);
  G.mons = G.mons.filter(o => !dela(o));
  G.respawns = G.respawns.filter(x => !(x.sp && MONSTROS[x.sp.m] && MONSTROS[x.sp.m].cqOnze));
  const h = document.getElementById('cqFinalHud'); if (h) h.remove();
  if (txt) log(txt, 'l-sis');
}
function cqFinalSetor(i) {
  const F = CQ.final, S = CQ_ONZE_SETORES[i]; if (!S) return; F.setor = i; F.prox = 0;
  const pos = { onze_ataque: 'ataque', onze_meio: 'meio', onze_zaga: 'zaga', onze_cap: 'goleiro' }[S.tipo];
  let pts = (F.A.formacao || []).filter(q => q.pos === pos);
  if (!pts.length) { const c = F.A.centro; pts = Array.from({ length: S.qtd }, (_, k) => ({ x: c.x - S.qtd + 1 + k * 2, y: c.y })); }
  for (const q of pts.slice(0, S.qtd)) { const n = criaMonstro({ m: S.id, x: q.x, y: q.y, qtd: 1, raio: 1, cqInv: true }); if (n) { n.bravo = true; n.cqInv = true; G.mons.push(n); efeito('area', n.x, n.y, '#c8d8ff', 1.3); } }
  banner(`⚽ ${S.nome.toUpperCase()} TAKES THE FIELD!`, S.poder); log(`🏆 ${S.nome} of the Forgotten Eleven: ${S.poder}`, 'l-info'); som('apito');
}
// liga/desliga a final pela posição do jogador (dentro ou fora da arena)
function cqFinalVigia() {
  const A = cqArena(); if (!A || !G.mapa || G.mapa.id !== A.mapa) { if (CQ.final) cqFinalPara(); return; }
  const dentro = cqNaArena(A, G.p);
  if (CQ.final && !dentro) { const F = CQ.final; cqFinalPara(F.venceu || F.acabou ? null : '🏆 You left the Final Arena: the match stopped. Go back in to start over.'); return; }
  if (!CQ.final && dentro && G.save.hp > 0) {
    const trava = cqFinalPode();
    if (trava) { if (G.agora > (CQ.avisoArena || 0)) { CQ.avisoArena = G.agora + 8000; log(trava, 'l-sis'); } return; }
    cqFinalComeca(A);
  }
}
function cqFinalPasso(dt) {
  const F = CQ.final; if (!F) return;
  cqFinalHud();
  if (F.venceu || F.acabou) return;
  if (G.save.hp > 0) F.resta -= dt;
  if (F.setor < 0) { if (G.agora >= F.prox) cqFinalSetor(0); return; }
  const S = CQ_ONZE_SETORES[F.setor], vivos = G.mons.filter(m => m.tipo === S.id && m.hp > 0).length;
  if (!vivos && S.tipo !== 'onze_cap') { if (!F.prox) F.prox = G.agora + 2000; else if (G.agora >= F.prox) cqFinalSetor(F.setor + 1); }
  // o lance decisivo volta a aparecer enquanto o capitão estiver no limite (errar nunca prende ninguém)
  const cap = G.mons.find(m => m.d.cqPiso && m.hp > 0);
  if (cap && cap._lchFeito && cap.hp <= Math.ceil(cap.d.hp * CQ_BAL.onze.piso) + 1 && typeof LCH !== 'undefined' && !LCH.convite && !LCH.lance) {
    if (!F.relanca) F.relanca = G.agora + 3500; else if (G.agora >= F.relanca) { cap._lchFeito = false; F.relanca = 0; }
  }
  if (F.resta <= 0) {
    F.acabou = true; F.resta = 0; banner('⏰ Time’s up!', 'The Forgotten Eleven are still waiting... try again!'); som('erro');
    log('⏰ Time ran out for the final. Go back into the arena whenever you want.', 'l-dano');
    setTimeout(() => { if (CQ.final === F) { cqFinalPara(); cqSaiArena(); } }, 1600);
  }
}
function cqFinalHud() {
  let h = document.getElementById('cqFinalHud'); const F = CQ.final;
  if (!F) { if (h) h.remove(); return; }
  if (!h) { h = el('div', { id: 'cqFinalHud' }); document.body.append(h); }
  const seg = Math.ceil(Math.max(0, F.resta) / 1000), S = CQ_ONZE_SETORES[Math.max(0, F.setor)];
  const vivos = G.mons.filter(m => m.d.cqOnze && m.hp > 0).length;
  const txt = F.venceu ? '🏆 FORGOTTEN CUP CHAMPION!' : `🏆 Final · ${F.setor < 0 ? 'Kickoff...' : `${S.nome} (${vivos})`} · ⏳ ${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')} · Difficulty ${F.D}`;
  if (h.textContent !== txt) h.textContent = txt;
  h.classList.toggle('urgente', seg <= 30 && !F.venceu && !F.acabou);
}
function cqFinalMatou(m) {
  G.respawns = G.respawns.filter(x => x.sp !== m.sp); // os Onze não voltam sozinhos
  const F = CQ.final; if (!F || m.d.cqTipo !== 'onze_cap' || F.venceu) return;
  F.venceu = true; CQ.tele = [];
  const dela = o => o.d.cqOnze || (o.cqInv && cqNaArena(F.A, o));
  for (const o of G.mons.filter(dela)) efeito('puff', o.x, o.y);
  G.mons = G.mons.filter(o => !dela(o));
  const s = G.save, f = cqFinalDados(), L = F.L, O = CQ_BAL.onze, primeira = !f.venceuSemana;
  let txt;
  if (primeira) {
    f.venceuSemana = true; f.vitorias = (f.vitorias || 0) + 1; f.semanasVencidas = (f.semanasVencidas || 0) + 1;
    const xp = Math.round(cqXpNivel(L) * O.xp), ouro = cqRed(cqRenda(L) * O.ouro);
    ganhaXp(xp); s.ouro += ouro; recebeItem('ingresso_esquecido', O.ingressos[0]); recebeItem('cq_mat_3', 5);
    txt = `+${fmt(xp)} XP, +${fmt(ouro)} coins, ${O.ingressos[0]} Forgotten Tickets and 5 Eternal Final Net Threads.`;
    if (!s.flags.cq_campeao) { s.flags.cq_campeao = true; recebeItem('taca_esquecidos', 1); txt += ' 🏆 And the FORGOTTEN TROPHY went into your backpack (it’s furniture for your house)! The Forgotten now cheer for you in the arenas.'; }
  } else { recebeItem('ingresso_esquecido', O.ingressos[1]); const ouro = cqRed(cqRenda(L) * 20); s.ouro += ouro; txt = `You had already won this week: +${O.ingressos[1]} Tickets and +${fmt(ouro)} coins.`; }
  banner('🏆 THE FINAL IS OVER!', 'The Forgotten Eleven lift the trophy together with you!'); som('nivel');
  log(`🏆 You won the Final of the Forgotten Eleven! ${txt}`, 'l-lvl'); salvar(); G.uiSujo = true;
  setTimeout(() => {
    if (CQ.final !== F) return;
    abreModal(el('h2', {}, '🏆 Forgotten Cup Champion!'), el('p', {}, 'The final whistle blew after a hundred years! The Forgotten Eleven are smiling: they remembered why they played. Never giving up is what makes a champion.'), el('p', {}, txt),
      el('p', { class: 'dica' }, `On Monday the final starts over, harder (difficulty ${Math.min(O.difMax, (f.dif || 1) + 1)}).`),
      el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', type: 'button', onclick: () => { fechaModal(); cqFinalPara(); cqSaiArena(); } }, '🚪 Leave the arena'), el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'Stay on the field')));
  }, 2200);
}
// os Esquecidos viram TORCIDA do jogador nas arenas (depois de vencer a final): por enquanto só a festa, sem força nova
function cqTorcidaNasArenas() { return !!(G.save && G.save.flags && G.save.flags.cq_campeao); }
{
  let ult = null, tGrito = 0;
  const _atTor = atualiza;
  atualiza = function (dt) {
    const r = _atTor.apply(this, arguments);
    try {
      if (G.mapa && G.mapa.arena && cqTorcidaNasArenas()) {
        if (ult !== G.mapa) { ult = G.mapa; tGrito = G.agora + 4000; log('👻 The Forgotten Eleven came to cheer for you in the arena!', 'l-info'); }
        if (G.agora >= tGrito) { tGrito = G.agora + 20000; texto(G.p, ['👻 Go, star!', '👻 Don’t give up!', '👻 Champions!'][rndi(0, 2)], '#d8e8ff', 1600, -1.2); }
      } else ult = null;
    } catch (e) { }
    return r;
  };
}

/* ======================= estilo ======================= */
{
  const css = document.createElement('style');
  css.textContent = `#cqHud { position: fixed; top: 58px; left: 50%; transform: translateX(-50%); z-index: 59; pointer-events: none; display: flex; flex-direction: column; align-items: center; gap: 3px; max-width: 96vw; }
  #cqHud.com-final { top: 96px; }
  #cqHud .cq-l { padding: 3px 12px; border-radius: 12px; font: 800 13.5px Nunito, 'Segoe UI', sans-serif; white-space: nowrap; background: rgba(24,16,48,.88); color: #fff; border: 2px solid #8a8aa8; box-shadow: 0 3px 10px rgba(0,0,0,.4); max-width: 96vw; overflow: hidden; text-overflow: ellipsis; }
  #cqHud .cq-l.ruim { border-color: #ff7a5a; color: #ffe0d8; }
  #cqHud .cq-l.ok { border-color: #5ad86a; color: #d8ffd8; }
  #cqHud .cq-l.info { border-color: #ffd23f; color: #fff3c0; }
  body.cel3 #cqHud { top: 48px; } body.cel3 #cqHud .cq-l { font-size: 11.5px; padding: 2px 9px; }
  #cqFinalHud { position: fixed; top: 58px; left: 50%; transform: translateX(-50%); z-index: 60; pointer-events: none; padding: 6px 14px; border-radius: 12px; background: rgba(24,16,48,.9); color: #fff3c0; border: 2px solid #ffd23f; font: 800 15px Nunito, 'Segoe UI', sans-serif; white-space: nowrap; box-shadow: 0 4px 14px rgba(0,0,0,.45); max-width: 96vw; overflow: hidden; text-overflow: ellipsis; }
  #cqFinalHud.urgente { color: #fff; background: rgba(140,20,60,.92); }
  body:has(#modal:not([hidden])) #cqHud { display: none; }
  .cq-faixa { margin: 8px 0; padding: 6px 8px; border: 2px solid #d8c09a; border-radius: 10px; background: #fffaf0; }`;
  document.head.append(css);
}

window.CQ_ESQ = { CQ, CQ_BAL, CQ_ALAS, CQ_PRESSOES, CQ_ADV: CQ_ADV.map(a => a[0]), CQ_CHEFES: CQ_CHEFES.map(c => c[0]), CQ_ONZE: CQ_ONZE_SETORES.map(s => s.id), CQ_UE_IDS,
  alaDoMapa: cqAlaDoMapa, abreTroca: cqModalTroca, abreFinal: cqAbreFinal, finalPode: cqFinalPode, finalDados: cqFinalDados, dados: cqDados, torcidaNasArenas: cqTorcidaNasArenas };
