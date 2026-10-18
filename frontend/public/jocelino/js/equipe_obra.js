// Jocelino — equipe_obra.js — a equipe do mestre de obras (a E7 do Godot, equipe.gd): o Zé, o Severino, o Cícero e o
// Damião trabalham nas frentes que o Jocelino escolhe na prancheta; rendem meta/7 por hora × (1 no ofício, 0,55 fora)
// × (0,4 + 0,08 × humor). O humor sobe com conversa (+1 por dia) e comida (+2 por dia; a marmita da pensão +3), com o
// dia redondo (+1); frente errada tira 1. Com humor ≤ 2, metade das vezes o peão falta. Eventos em 15% dos dias.
// (C15, 16/10; o teste crítico: a turma era enfeite e a prancheta dizia "Frente: undefined") A TURMA PESA, como os ajudantes do
// Bancho no Dave (você os escala e eles rendem) e como o regador automático do Stardew (o serviço anda sem você): a turma trabalha
// das 7h às 17h na lista dela, mesmo com o mestre longe (as horas puladas são recuperadas); fechada a lista inteira, o dia é REDONDO
// e vale um dia e meio na etapa (Obra.avancar). O resumo da noite diz "a turma fez X de Y". CONFERIR É UMA DECISÃO PEQUENA: o peão
// conta uma coisa (o material no fim, uma frente sem ninguém, o cansaço, uma ideia) e a resposta do mestre muda o dia da turma
// (buscar o material = a frente não para; trocar de frente = a frente vazia anda; elogiar = humor; apertar ou a ideia = ritmo).

const PEOES = [
  { id: 'ze', nome: 'Zé', oficio: 'Pedreiro', oficios: ['massa', 'tijolos', 'lavar', 'pintar'], x: 35, y: 4 },   // (15/10: o molhar virou lavar e pintar)
  { id: 'severino', nome: 'Severino', oficio: 'Pedreiro antigo', oficios: ['tijolos', 'pedras', 'massa'], x: 33, y: 7 },
  { id: 'cicero', nome: 'Cícero', oficio: 'Carpinteiro e armador', oficios: ['ripas', 'telhas', 'pedras'], x: 38, y: 4 },
  { id: 'damiao', nome: 'Damião', oficio: 'Servente', oficios: ['entulho', 'areia', 'capinar', 'telhas'], x: 41, y: 7 },
];
const peao = id => PEOES.find(p => p.id === id);
const EVENTO_OBRA = 0.15;   // (C16, rodada 1: o BONUS_REDONDO solto saiu; o dia redondo paga ECO.obra.mestreRedondo, à noite, em obra_jogo.js)
// (C15) As horas da turma (o serviço das 7h às 17h: as horas que fecham às 8h, 9h... 17h; no ofício, de humor 6, a tarefa fecha lá
// pelas 15h), a hora em que o material que está no fim acaba (e a frente para), a chance de faltar material num dia e o ritmo da ideia e
// do "aperta". (rodada 1: medido na s67, o dia redondo sai em ~15% dos dias sem cuidado, o prédio em ~20 dias, e em ~75% com a turma
// bem cuidada, ~15 dias: de humor 8, a ideia OU o "aperta" bastam para o peão fora do ofício fechar a frente dele.)
const TURMA_HORAS = [8, 17], HORA_DA_FALTA = 11, CHANCE_FALTA = 0.7, RITMO_IDEIA = 1.3, RITMO_APERTA = 1.25;
// (C15, rodada 1; a revisão: "a de cima sempre ganha, em 10 dias o jogador aprende") A RESPOSTA DE CIMA TEM CUSTO OU RISCO: buscar o
// material custa Cr$ 5 no Ananias; a ideia aceita dá errado 1 dia em 4 (a frente rende menos: RITMO_IDEIA_ERRADA); trocar de frente
// leva uma hora de caminho e deixa a frente antiga sem ninguém naquele dia (a prancheta ainda pode mandar alguém).
const CUSTO_BUSCAR = 5, CHANCE_IDEIA_ERRADA = 0.25, RITMO_IDEIA_ERRADA = 0.8;
// As falas de cada assunto, em variantes (a do dia sai pelo dia e pelo peão): o material (antes e depois das 11h), a frente vazia e o cansaço.
const FALAS_MATERIAL = [m => `${m} tá no fim. Lá pelas onze a frente para, se ninguém buscar.`, m => `${m} dá até umas onze, se tanto. Depois para tudo.`,
  m => `contei aqui: ${m} não passa das onze. Alguém tem que ir no Ananias.`, m => `vai faltar ${m}. Se ninguém buscar, às onze a gente cruza os braços.`];
const FALAS_SEM_MATERIAL = [(m, f) => `acabou ${m}: ${f} parou.`, (m, f) => `${m} acabou de vez. ${f.charAt(0).toUpperCase() + f.slice(1)} tá parada, olhando pro monte vazio.`,
  (m, f) => `cadê ${m}? Acabou, e ${f} parou.`];
const FALAS_FRENTE = [t => `Mestre, ninguém pegou ${falaFrente(t)}.`, t => `Ô mestre, olha lá: ${falaFrente(t)}, sem ninguém desde cedo.`, t => `Mestre, reparou? Ninguém pegou ${falaFrente(t)} hoje.`,
  t => `Mestre, ninguém foi ${falaFrente(t, 2)} hoje.`];
const FALAS_CANSACO = [x => `Tô moído, mestre. Desde cedo ${x}.`, x => `Ai, mestre, as costas... Desde cedo ${x}, sem parar.`, x => `Mestre, hoje o corpo não tá ajudando. Muito sol ${x}.`,
  () => `Tô no bagaço, mestre. Mas parar eu não paro, não.`];
const variante = (lista, id, k = 0) => lista[(G.dia * 7 + PEOES.findIndex(p => p.id === id) * 3 + k) % lista.length];
// Como o peão fala de cada tarefa: [o tijolo, no tijolo, pro tijolo].
const FRENTE_FALA = { tijolos: ['o tijolo', 'no tijolo', 'pro tijolo'], areia: ['a areia', 'na areia', 'pra areia'], entulho: ['o entulho', 'no entulho', 'pro entulho'],
  massa: ['a massa', 'na massa', 'pra massa'], lavar: ['o lavar', 'no lavar', 'pro lavar'], pintar: ['a pintura', 'na pintura', 'pra pintura'],
  capinar: ['o capinar', 'no capinar', 'pro capinar'], pedras: ['as pedras', 'nas pedras', 'pras pedras'], telhas: ['as telhas', 'nas telhas', 'pras telhas'], ripas: ['as ripas', 'nas ripas', 'pras ripas'] };
const falaFrente = (t, k = 0) => (FRENTE_FALA[t] || ['o serviço', 'no serviço', 'pro serviço'])[k];
// O nome da frente da turma (o texto da lista do Bira é para o Jocelino: "Levar massa da masseira ao Zé" não serve ao próprio Zé).
const NOME_DA_FRENTE = { tijolos: 'Carregar tijolos para a obra', areia: 'Peneirar areia', entulho: 'Tirar o entulho do canteiro', massa: 'Bater e levar a massa',
  lavar: 'Lavar o chão da obra', pintar: 'Pintar a parede da obra', capinar: 'Capinar o mato do canteiro', pedras: 'Levar pedras para o alicerce',
  telhas: 'Subir telhas para a obra', ripas: 'Levar ripas para o telhado' };
const nomeDaFrente = t => NOME_DA_FRENTE[t] || (TAREFAS_OBRA[t] ? TAREFAS_OBRA[t].texto : String(t));
// O material que acaba (a tarefa que depende dele) e a ideia de cada frente.
const MATERIAL_DA_FRENTE = { tijolos: 'o tijolo do monte', telhas: 'a telha do monte', pedras: 'a pedra do monte', ripas: 'a ripa da pilha', massa: 'o cimento da masseira', areia: 'a areia da peneira' };
const IDEIA_DA_FRENTE = {
  tijolos: 'E se eu levar o tijolo no carrinho? Vai o dobro de uma vez.', massa: 'E se a gente bater a massa do lado da obra? Poupa viagem.',
  entulho: 'E se eu juntar o entulho num canto só e tirar de uma vez?', areia: 'E se eu peneirar dois baldes seguidos, sem parar pra ajeitar a peneira?',
  lavar: 'E se eu emendar mais uma mangueira? Chega no fundo sem arrastar.', pintar: 'E se eu passar o rolo grande na parede lisa e o pincel só no canto?',
  capinar: 'E se eu passar a foice de manhãzinha, com o orvalho? Corta mais fácil.', pedras: 'E se a gente fizer uma fila e passar a pedra de mão em mão?',
  telhas: 'E se a gente subir a telha de mão em mão, um no andaime e outro embaixo?', ripas: 'E se eu cortar as ripas todas na medida antes de subir?' };

const EquipeObra = {
  iniciar(s) {
    const e = s.equipeObra || {};
    G.equipeObra = { humor: Object.assign({ ze: 6, severino: 6, cicero: 6, damiao: 6 }, e.humor || {}), frente: Object.assign({}, e.frente || {}),
      faltou: (e.faltou || []).slice(), conversou: Object.assign({}, e.conversou || {}), comeu: Object.assign({}, e.comeu || {}), frac: Object.assign({}, e.frac || {}), dia: e.dia || 0,
      // (C15) o dia da turma: a última hora trabalhada, o material que falta, quem saiu para buscar, o ritmo de cada um e os assuntos já falados
      hoje: e.hoje ? JSON.parse(JSON.stringify(e.hoje)) : EquipeObra.hojeNovo() };
    // (15/10) o save de antes: a frente 'molhar' vira a tarefa da etapa (lavar ou pintar), como a lista (Obra.iniciar)
    const nova = G.obra ? Obra.tarefaDoMolhar() : 'lavar', q = G.equipeObra;
    for (const id in q.frente) if (q.frente[id] === 'molhar') q.frente[id] = nova;
    if ('molhar' in q.frac) { q.frac[nova] = (q.frac[nova] || 0) + q.frac.molhar; delete q.frac.molhar; }
  },
  salvar(s) { s.equipeObra = JSON.parse(JSON.stringify(G.equipeObra)); },
  fator(id, tarefa) { return (peao(id).oficios.includes(tarefa) ? 1 : 0.55) * (0.4 + 0.08 * G.equipeObra.humor[id]); },
  presentes() { return PEOES.map(p => p.id).filter(id => !G.equipeObra.faltou.includes(id)); },
  hojeNovo(hora = TURMA_HORAS[0] - 1) { return { hora, falta: null, fora: {}, ritmo: {}, assuntos: [], redonda: false }; },
  // As tarefas da lista que viram frente (o imprevisto, as pedras de fora e o conferir não são da turma).
  tarefasDaTurma(metas) { return Object.keys(metas || {}).filter(t => t !== 'buscar_cimento' && t !== 'buscar_pedra' && t !== 'conferir'); },
  // (C15) A frente de um peão: a tarefa do ofício dele com menos gente; sem ofício na lista, a tarefa com menos gente. Assim, de
  // manhã, toda tarefa tem alguém (com 4 peões e até 4 tarefas), e quem fica fora do ofício é quem sobra.
  frenteBoa(id, tarefas, ja = {}) {
    if (!tarefas.length) return peao(id).oficios[0];
    const conta = t => Object.keys(ja).filter(o => o !== id && ja[o] === t).length, menor = ts => ts.reduce((a, t) => conta(t) < conta(a) ? t : a, ts[0]);
    const of = tarefas.filter(t => peao(id).oficios.includes(t));
    return of.length ? menor(of) : menor(tarefas);
  },
  // A manhã: quem falta (humor ≤ 2, 50%), as frentes (EquipeObra.frenteBoa) e o material que vai acabar (a metade dos dias).
  bomDia(dia, rng, metas = {}) {
    const q = G.equipeObra; q.dia = dia; q.conversou = {}; q.comeu = {}; q.frac = {};
    q.faltou = PEOES.map(p => p.id).filter(id => q.humor[id] <= 2 && rng.randf() < 0.5);
    const tarefas = EquipeObra.tarefasDaTurma(metas), ja = {};
    for (const id of EquipeObra.presentes()) ja[id] = EquipeObra.frenteBoa(id, tarefas, ja);
    for (const p of PEOES) q.frente[p.id] = ja[p.id] || tarefas.find(t => p.oficios.includes(t)) || tarefas[0] || p.oficios[0];
    q.hoje = EquipeObra.hojeNovo(Math.max(TURMA_HORAS[0] - 1, Math.floor((G.minutos || 0) / 60)));
    // (o sorteio do material é à parte: o rng da manhã continua o mesmo para as faltas e os eventos)
    const f = mulberry(dia * 811 + 3), comMaterial = tarefas.filter(t => MATERIAL_DA_FRENTE[t] && Object.values(ja).includes(t));
    if (comMaterial.length && f() < CHANCE_FALTA) q.hoje.falta = { tarefa: comMaterial[Math.floor(f() * comMaterial.length)], estado: '' };
    return { faltou: q.faltou.slice(), frentes: Object.assign({}, q.frente) };
  },
  // (C15) O save montado ou a promoção no meio do dia: o peão sem frente (ou com uma frente que a lista não tem) ganha a frente boa.
  garantirFrentes(metas) {
    const q = G.equipeObra, tarefas = EquipeObra.tarefasDaTurma(metas); if (!tarefas.length) return;
    const ja = {}; for (const id of EquipeObra.presentes()) if (tarefas.includes(q.frente[id])) ja[id] = q.frente[id];
    for (const id of EquipeObra.presentes()) if (!ja[id]) q.frente[id] = ja[id] = EquipeObra.frenteBoa(id, tarefas, ja);
  },
  // Troca a frente do peão para a próxima tarefa da lista.
  trocar(id, metas) {
    const ts = EquipeObra.tarefasDaTurma(metas);
    if (!ts.length) return G.equipeObra.frente[id];
    const i = ts.indexOf(G.equipeObra.frente[id]);
    return (G.equipeObra.frente[id] = ts[(i + 1) % ts.length]);
  },
  // (C15) A frente parada pela falta de material (a partir das 11h): sem ninguém buscar, até o fim do dia; com o "toca assim", 2 horas.
  parada(t, h) {
    const f = (G.equipeObra.hoje || {}).falta; if (!f || f.tarefa !== t || h < HORA_DA_FALTA) return false;
    return f.estado === 'buscou' ? false : f.estado === 'toca' ? h < HORA_DA_FALTA + 2 : true;
  },
  // Uma hora de trabalho: quanto cada presente rende na frente dele. Com a hora (h): quem foi buscar material não rende nela, e a
  // frente sem material para.
  hora(metas, h = null) {
    const r = {}, H = G.equipeObra.hoje || {};
    for (const id of EquipeObra.presentes()) {
      const t = G.equipeObra.frente[id]; if (!metas[t]) continue;
      if (h != null && ((H.fora || {})[id] === h || EquipeObra.parada(t, h))) continue;
      r[id] = metas[t] / 7 * EquipeObra.fator(id, t) * ((H.ritmo || {})[id] || 1);
    }
    return r;
  },
  // (C15) O assunto do peão na conferida: o material no fim (se é a frente dele), uma frente sem ninguém (se ele está sobrando, fora
  // do ofício ou com a frente pronta), o cansaço (humor ≤ 5) ou uma ideia (humor ≥ 8); no meio, um ou outro, sem repetir no dia.
  // Na última conferida do dia, o material no fim vem de qualquer um ("o Cícero mandou avisar"): o mestre que confere fica sabendo.
  assunto(id, T, ultima = false) {
    const q = G.equipeObra, H = q.hoje || (q.hoje = EquipeObra.hojeNovo()), t = q.frente[id], p = peao(id), falta = (x) => (T.feito[x] || 0) < T.metas[x];
    if (H.falta && !H.falta.estado && falta(H.falta.tarefa)) {
      const dono = EquipeObra.presentes().find(o => q.frente[o] === H.falta.tarefa);
      if (H.falta.tarefa === t) return { tipo: 'material', tarefa: t };
      if (ultima && dono) return { tipo: 'material', tarefa: H.falta.tarefa, recado: dono };
    }
    const outros = EquipeObra.presentes().filter(o => o !== id), vazias = Object.keys(T.metas).filter(x => falta(x) && !outros.some(o => q.frente[o] === x) && x !== t);
    const junto = outros.find(o => q.frente[o] === t) || '';
    if (vazias.length && (junto || !p.oficios.includes(t) || !T.metas[t] || !falta(t))) return { tipo: 'frente', tarefa: vazias.find(x => p.oficios.includes(x)) || vazias[0], de: t, junto };
    const h = q.humor[id], usado = k => (H.assuntos || []).includes(k);
    let k = h <= 5 ? 'cansaco' : h >= 8 ? 'ideia' : (G.dia + PEOES.indexOf(p)) % 2 ? 'ideia' : 'cansaco';
    if (h > 5 && h < 8 && usado(k)) k = k === 'ideia' ? 'cansaco' : 'ideia';
    return { tipo: k, tarefa: t };
  },
  // O que o peão diz e as 2 respostas do mestre (a neutra por último: o Esc escolhe a última). A emoção só quando o retrato
  // existe (o Zé tem todos; os outros, o normal e o alegre).
  falaDoAssunto(id, a) {
    const q = G.equipeObra, depois = HORA_DA_FALTA <= Math.floor(G.minutos / 60);
    const emo = e => typeof ARTE_LISTA !== 'undefined' && ARTE_LISTA.includes(`retratos/${id}_${e}`) ? `@${e} ` : '';
    if (a.tipo === 'material') {
      const busca = (id === 'damiao' || !EquipeObra.presentes().includes('damiao') ? 'Vai lá buscar no Ananias' : 'Manda o Damião buscar no Ananias') + ` (Cr$ ${CUSTO_BUSCAR})`;
      const quem = a.recado ? `o ${peao(a.recado).nome} mandou avisar: ` : '', dela = a.recado ? 'a frente dele' : 'a minha frente', m = MATERIAL_DA_FRENTE[a.tarefa];
      const corpo = depois ? variante(FALAS_SEM_MATERIAL, id)(m, dela) : (a.recado ? FALAS_MATERIAL[0] : variante(FALAS_MATERIAL, id))(m);
      return { texto: `${emo(depois ? 'triste' : 'pensativo')}Mestre, ${quem}${corpo}`, opcoes: [busca, 'Toca assim, que dá pra hoje'] };
    }
    if (a.tipo === 'frente') {
      const T = Obra.turmaDe(), sozinho = !a.junto && T.metas[a.de] && (T.feito[a.de] || 0) < T.metas[a.de];
      const onde = !q.frente[id] || !T.metas[a.de] ? 'Tô sem frente.' : (T.feito[a.de] || 0) >= T.metas[a.de] ? 'O meu já tá pronto.'
        : a.junto ? `Eu tô ${falaFrente(a.de, 1)} junto com o ${peao(a.junto).nome}.` : `Eu tô ${falaFrente(a.de, 1)}${peao(id).oficios.includes(a.de) ? '' : ', que nem é o meu ofício'}.`;
      const custo = sozinho ? ` Mas se eu for, ${falaFrente(a.de)} fica sem ninguém hoje.` : '';
      return { texto: `${emo('pensativo')}${variante(FALAS_FRENTE, id)(a.tarefa)} ${onde}${custo}`, opcoes: [`Vai você ${falaFrente(a.tarefa, 2)}`, 'Fica onde está'] };
    }
    if (a.tipo === 'cansaco') return { texto: `${emo('triste')}${variante(FALAS_CANSACO, id)(falaFrente(a.tarefa, 1))}`, opcoes: ['Bom serviço. Segue no seu ritmo', 'Aperta, que hoje tem que render'] };
    return { texto: `${emo('alegre')}Mestre, tive uma ideia. ${IDEIA_DA_FRENTE[a.tarefa] || 'E se a gente fizer em dupla? Rende mais.'}`, opcoes: ['Boa ideia! Faz do seu jeito', 'Melhor do jeito de sempre'] };
  },
  // A resposta do mestre muda uma coisa pequena no dia da turma. Devolve a frase de volta do peão (o aviso no canto).
  responder(id, a, i) {
    const q = G.equipeObra, H = q.hoje || (q.hoje = EquipeObra.hojeNovo()), nome = peao(id).nome, h = Math.floor(G.minutos / 60);
    (H.assuntos = H.assuntos || []).push(a.tipo);
    if (a.tipo === 'material') {
      if (i !== 0) { H.falta.estado = 'toca'; return `${nome}: "Tá bom, mestre. A gente se vira." (Às 11h ${falaFrente(a.tarefa)} para um tempinho.)`; }
      if (G.dinheiro < CUSTO_BUSCAR) { H.falta.estado = 'toca'; return `${nome}: "Sem os Cr$ ${CUSTO_BUSCAR} não tem material, mestre. A gente se vira." (Às 11h ${falaFrente(a.tarefa)} para um tempinho.)`; }
      G.dinheiro -= CUSTO_BUSCAR; G.gastoHoje = (G.gastoHoje || 0) + CUSTO_BUSCAR; H.falta.estado = 'buscou';
      const quem = EquipeObra.presentes().includes('damiao') ? 'damiao' : id;
      (H.fora = H.fora || {})[quem] = Math.max(TURMA_HORAS[0], h + 1);   // (quem vai ao Ananias perde a próxima hora na frente dele)
      return quem === id ? `${nome}: "Já vou no Ananias, mestre. Volto num pulo." (Cr$ ${CUSTO_BUSCAR}; a frente não para.)` : `Damião: "Deixa comigo, mestre!" (Cr$ ${CUSTO_BUSCAR} no Ananias; a frente não para.)`;
    }
    if (a.tipo === 'frente') {
      if (i !== 0) return `${nome}: "Tá certo, mestre."`;
      const T = Obra.turmaDe(), fica = EquipeObra.presentes().some(o => o !== id && q.frente[o] === a.de);
      q.frente[id] = a.tarefa; (H.fora = H.fora || {})[id] = Math.max(TURMA_HORAS[0], h + 1);   // (a mudança leva uma hora de caminho)
      const largou = !fica && T.metas[a.de] && (T.feito[a.de] || 0) < T.metas[a.de];
      return `${nome}: "Já tô indo, mestre!" (Frente: ${nomeDaFrente(a.tarefa).toLowerCase()}${largou ? `; ${falaFrente(a.de)} fica sem ninguém hoje` : ''}.)`;
    }
    if (a.tipo === 'cansaco') {
      if (i === 0) { q.humor[id] = Math.min(10, q.humor[id] + 1); return `${nome}: "Valeu, mestre. Assim dá gosto." (O humor dele subiu.)`; }
      (H.ritmo = H.ritmo || {})[id] = RITMO_APERTA; q.humor[id] = Math.max(0, q.humor[id] - 1);
      return `${nome}: "Tá bom, mestre..." (Ele aperta o passo hoje, mas fecha a cara.)`;
    }
    if (i !== 0) return `${nome}: "Tá certo, mestre. Do jeito de sempre."`;
    // (a ideia dá errado 1 dia em 4: o peão só descobre no serviço; o aviso vem na hora seguinte e o resumo da noite conta)
    const errada = mulberry(G.dia * 131 + PEOES.findIndex(p => p.id === id) * 17)() < CHANCE_IDEIA_ERRADA;
    (H.ritmo = H.ritmo || {})[id] = errada ? RITMO_IDEIA_ERRADA : RITMO_IDEIA; H.ideia = { id, errada, avisada: false };
    return `${nome}: "Pode deixar, mestre! Vai render." (Ele vai tentar do jeito dele hoje.)`;
  },
  // Comida: uma vez por dia; a marmita da pensão vale +3 (a sustância), o resto +2.
  comer(id, item) {
    const q = G.equipeObra;
    if (!q.comeu[id]) { q.comeu[id] = true; q.humor[id] = Math.min(10, q.humor[id] + (item === 'marmita' ? 3 : 2)); }
    return q.humor[id];
  },
  conversar(id) { const q = G.equipeObra; if (!q.conversou[id]) { q.conversou[id] = true; q.humor[id] = Math.min(10, q.humor[id] + 1); } return q.humor[id]; },
  // O fim do dia: redondo +1 a todos; frente fora do ofício −1.
  fimDoDia(redondo, metas = {}) {
    const q = G.equipeObra;
    for (const p of PEOES) {
      if (q.faltou.includes(p.id)) continue;
      if (redondo) q.humor[p.id] = Math.min(10, q.humor[p.id] + 1);
      if (metas[q.frente[p.id]] && !p.oficios.includes(q.frente[p.id])) q.humor[p.id] = Math.max(0, q.humor[p.id] - 1);
    }
  },
  evento(dia, rng) {
    if (rng.randf() >= EVENTO_OBRA) return null;
    const q = G.equipeObra, k = Math.floor(rng.randf() * 4), ids = PEOES.map(p => p.id), quem = ids[Math.floor(rng.randf() * 4)];
    if (k === 0) { q.humor.damiao = Math.min(10, q.humor.damiao + 1); return { tipo: 'ensinar', texto: 'O Zé passou a manhã ensinando o Damião a assentar tijolo. O Damião ficou todo prosa.' }; }
    if (k === 1) { if (G.dinheiro < 40) return null; for (const id of ids) q.humor[id] = Math.min(10, q.humor[id] + 1); return { tipo: 'capacetes', custo: 40, texto: 'Chegaram capacetes novos para a turma (Cr$ 40). Segurança em primeiro lugar!' }; }
    if (k === 2) { const outro = ids[(ids.indexOf(quem) + 1) % 4]; q.humor[quem] = Math.max(0, q.humor[quem] - 2); q.humor[outro] = Math.max(0, q.humor[outro] - 2); return { tipo: 'briga', texto: `O ${peao(quem).nome} e o ${peao(outro).nome} brigaram por causa de uma colher. O clima azedou.` }; }
    if (G.dinheiro < 20) return null;
    q.humor[quem] = Math.min(10, q.humor[quem] + 2);
    return { tipo: 'aniversario', custo: 20, texto: `Aniversário do ${peao(quem).nome}! Teve bolo na hora do café (Cr$ 20).` };
  },
};
INICIADORES.push(s => EquipeObra.iniciar(s));
COLETORES.push(s => EquipeObra.salvar(s));

// ---------- no jogo (só para o mestre de obras) ----------
const ehMestre = () => G.obra && G.obra.funcao >= 3;
// De manhã o mestre já recebe a lista da etapa; a turma chega (ou falta) e vai para as frentes; às vezes um evento.
MANHA.push(() => {
  if (!ehMestre() || Obra.aberta(G.dia, 8 * 60) === 'domingo' || Obra.aberta(G.dia, 8 * 60) === 'chuva') return;
  G.obra.lista = Object.assign({ dia: G.dia, feito: {}, paga: false }, Obra.sortear(G.dia));
  turmaComecaODia(true);
});
// (C14/C15) A turma começa o dia na lista dela (o carregar): quem veio, as frentes, o material que vai faltar; o mestre confere
// quantos vieram (no máximo 3). De manhã (com o evento do dia) ou quando a lista do mestre sai do Bira no meio do dia (o dia da
// promoção, o save carregado depois da manhã): aí a turma começa na hora em que a lista saiu.
function turmaComecaODia(comEvento = false) {
  const f = mulberry(G.dia * 613 + 9), rng = { randf: f }, r = EquipeObra.bomDia(G.dia, rng, Obra.turmaDe(G.obra.lista).metas);
  { const m = G.obra.lista.metas, n = Math.min(m.conferir || 0, EquipeObra.presentes().length); if (m.conferir) { if (n) m.conferir = n; else delete m.conferir; } }
  if (r.faltou.length) G.feitosHoje.push(`Faltou na obra: ${r.faltou.map(id => peao(id).nome).join(', ')} (andam de mau humor).`);
  const ev = comEvento ? EquipeObra.evento(G.dia, rng) : null;
  if (ev) { if (ev.custo) { G.dinheiro -= ev.custo; G.gastoHoje += ev.custo; } G.feitosHoje.push(ev.texto); }
  if (MAPAS.vila) poePeoes(MAPAS.vila);
}
// (C15) A turma trabalha de hora em hora, das 7h às 17h, até a hora `ate` (as horas puladas, pelo Adiantar ou pelo sono, são
// recuperadas: a turma não para porque o mestre saiu), mesmo com a lista do mestre já paga. Fechou a lista dela: o aviso do dia redondo.
function turmaTrabalhaAte(ate, calada = false) {
  const l = G.obra.lista; if (!ehMestre() || !l || l.dia !== G.dia) return;
  const q = G.equipeObra, H = q.hoje || (q.hoje = EquipeObra.hojeNovo()), T = Obra.turmaDe(l);
  if (q.dia !== G.dia) return;   // (a turma ainda não começou o dia: a lista sai do Bira)
  const de = Math.max(TURMA_HORAS[0], (H.hora || 0) + 1), ate2 = Math.min(TURMA_HORAS[1], ate);
  const ab = Obra.aberta(G.dia, 12 * 60);
  if (de <= ate2 && ab !== 'domingo' && ab !== 'chuva') {
    EquipeObra.garantirFrentes(T.metas);
    for (let h = de; h <= ate2; h++) {
      H.hora = h;
      for (const [id, n] of Object.entries(EquipeObra.hora(T.metas, h))) {
        const t = q.frente[id]; q.frac[t] = (q.frac[t] || 0) + n;
        const inteiro = Math.floor(q.frac[t]); if (inteiro > 0) { q.frac[t] -= inteiro; Obra.trabalho(t, inteiro, true); }   // (a turma: sem o "em dobro" do Jocelino)
      }
    }
    // (rodada 1) a ideia aceita: na hora seguinte, o mestre fica sabendo se deu certo
    const I = H.ideia; if (I && !I.avisada) { I.avisada = true; if (!calada) avisar(I.errada ? `A ideia do ${peao(I.id).nome} não deu certo: a frente dele anda mais devagar hoje.` : `A ideia do ${peao(I.id).nome} deu certo: a frente dele anda mais depressa hoje.`); }
  }
  // (a conferência do redondo vale também para o serviço que o mestre faz com as mãos numa frente da turma)
  if (!H.redonda && Obra.turmaRedonda(l)) { H.redonda = true; if (!calada) { sons.tocar('moedas', 1.2, 0.05, -8); avisar(`A turma fechou a lista dela: dia redondo! Hoje a obra anda um dia e meio, e o Bira acerta Cr$ ${ECO.obra.mestreRedondo} a mais à noite.`); } }
}
ATUALIZADORES.push(() => { if (ehMestre()) turmaTrabalhaAte(Math.floor(G.minutos / 60)); });
NOITE.push(() => { const l = G.obra.lista; if (ehMestre() && l && l.dia === G.dia) EquipeObra.fimDoDia(l.turma ? Obra.turmaRedonda(l) : Obra.completa(), Obra.turmaDe(l).metas); });

// Os peões no canteiro (quem veio), cada um na frente dele; conversar +1 de humor; botão direito com comida dá a comida.
function poePeoes(b) {
  b.moradores = b.moradores.filter(m => !m.peao);
  if (!ehMestre()) return;
  const ze = b.moradores.find(m => m.id === 'ze'), gente = typeof canteiroDaVez === 'function' ? canteiroDaVez().gente : {};   // (no canteiro da obra da vez)
  for (const p of PEOES) {
    if (G.equipeObra.faltou.includes(p.id)) { if (p.id === 'ze' && ze) ze.visivel = false; continue; }
    const [x, y] = gente[p.id] || [p.x, p.y];
    const m = p.id === 'ze' && ze ? ze : Object.assign(b.morador(p.id, p.nome, x, y, DIR.BAIXO), { peao: true });
    m.visivel = true;
    m.aoConversar = () => conversarPeao(p.id);
  }
}
function conversarPeao(id) {
  if (id === 'ze' && G.jog.carga && G.jog.carga.id === 'massa') return conversarZe();
  // (C15) com comida na mão, o clique dá a comida (o conferir fica para o clique seguinte)
  if (alimentarPeao(id)) return true;
  if (id === 'ze' && zeForaDoServico()) return conversaDoZe();   // (T13, rodada 1) fora do serviço o Zé conversa como morador
  if (typeof conferirPeao === 'function' && conferirPeao(id)) return true;   // (C14) a tarefa conferir do mestre (obra_jogo.js)
  if (id === 'ze' && zeTemFalaDoArco()) return conversaDoZe();   // (T13, rodada 1) a fala do arco do Zé de hoje, uma vez, antes do humor
  const h = EquipeObra.conversar(id), p = peao(id);
  const fala = h >= 8 ? 'Hoje a obra rende, mestre!' : h >= 5 ? 'Tô firme, mestre. Bora.' : h >= 3 ? 'Tá puxado, mestre... um café cairia bem.' : 'Não tô bem não, mestre. Se continuar assim, amanhã nem venho.';
  abrirConversa(p.nome, urlArte('retratos/' + id + '_normal'), [`${fala} (frente: ${TAREFAS_OBRA[G.equipeObra.frente[id]] ? nomeDaFrente(G.equipeObra.frente[id]).toLowerCase() : '—'})`]);
  return true;
}
// (T13 das histórias, rodada 1) O Zé é peão da turma só no serviço. Fora dele (a obra fechada agora, ou na roda de samba de sexta) ele
// conversa como morador: as falas dele e do arco (historias/ze.js). No serviço, uma fala do arco de hoje (um tópico, a Noite do Samba, o
// nome do samba: regra até 5 do conversas.js) vem uma vez por dia, depois do conferir e antes do humor da obra.
function _zeDaVila() { return G.mapa && G.mapa.moradores.find(m => m.id === 'ze' && !m._daHistoria) || null; }
function zeForaDoServico() { const z = _zeDaVila(); return !!(z && z._naRoda) || (typeof Obra !== 'undefined' && !!Obra.aberta(G.dia, G.minutos)); }
let _zeArcoNaObra = -1;
function zeTemFalaDoArco() {
  if (typeof Conversas === 'undefined' || _zeArcoNaObra === G.dia) return false;
  const e = Conversas.escolher({ id: 'ze' }, true); if (!e || !(e.regra <= 5)) return false;
  _zeArcoNaObra = G.dia; return true;
}
function conversaDoZe() { return Conversas.abrir(_zeDaVila() || 'ze', { nome: 'Zé' }); }
// A comida da mão para o peão (uma vez por dia conta no humor; a marmita da pensão, mais). false = não tem comida na mão.
function alimentarPeao(id) {
  const comida = itemDaMao(), e = comida && Itens.energia(comida);
  if (!e) return false;
  G.mochila.remover(comida, 1); EquipeObra.comer(id, comida); hudSujo(); sons.tocar('pegar', 0.8, 0.05, -6);
  avisar(`${peao(id).nome} comeu ${Itens.nome(comida).toLowerCase()}${comida === 'marmita' ? ' (a marmita da Rosa dá sustância!)' : ''}.`);
  return true;
}
// A prancheta: cada peão com a frente, o humor e a barra da tarefa; clicar troca a frente.
function abrirPrancheta() {
  if (!ehMestre()) { abrirPlaca('A prancheta do Mestre Bira com a lista do dia.'); return true; }
  const caixa = el('div', { class: 'painel orelhao' });
  const desenha = () => {
    caixa.innerHTML = '';
    const l = G.obra.lista && G.obra.lista.dia === G.dia ? G.obra.lista : null, T = Obra.turmaDe(l);   // (C14) as frentes são da lista da turma
    const fechada = Obra.aberta(G.dia, 12 * 60), comecou = !!l && G.equipeObra.dia === G.dia;
    if (comecou) EquipeObra.garantirFrentes(T.metas);   // (C15) nada de "Frente: undefined" (o save montado, a promoção no meio do dia)
    // (C15) O que a turma faz hoje (a lista dela, sozinha, das 7h às 17h) e o porquê: a lista toda feita é o dia redondo.
    const rf = Obra.turmaFeita(l), vazias = comecou ? Object.keys(T.metas).filter(t => (T.feito[t] || 0) < T.metas[t] && !EquipeObra.presentes().some(id => G.equipeObra.frente[id] === t)) : [];
    const topo = !l ? (fechada === 'domingo' || fechada === 'chuva' ? 'Hoje não tem obra (domingo ou chuva).' : 'A lista de hoje sai com o Mestre Bira: fale com ele, e a turma vai para as frentes.')
      : `${Obra.obra().nome} — ${Obra.obra().etapas[G.obra.etapa].nome}. A turma faz a lista dela sozinha, das 7h às 17h${!rf.total ? '' : `: ${rf.feitas} de ${rf.total} prontas${rf.feitas === rf.total ? ` (dia redondo: a obra anda um dia e meio, e o Bira acerta Cr$ ${ECO.obra.mestreRedondo} a mais à noite)` : ` (com todas prontas, o dia é redondo: a obra anda um dia e meio, e o Bira acerta Cr$ ${ECO.obra.mestreRedondo} a mais à noite)`}`}. Clique num peão para trocar a frente dele: no ofício ele rende mais; de bom humor, mais ainda. Para conferir a frente, fale com o peão no canteiro.`;
    caixa.append(el('div', { class: 'titulo', style: 'font-size:26px' }, 'Prancheta do mestre'),
      el('div', { class: 'rodape', style: 'text-align:left;margin-bottom:8px' }, topo));
    if (vazias.length) caixa.append(el('div', { class: 'rodape', style: 'text-align:left;margin-bottom:8px;color:#b3361b' }, `Ninguém na frente: ${vazias.map(t => nomeDaFrente(t).toLowerCase()).join('; ')}.`));
    const grade = el('div', { class: 'orel-grade' });
    for (const p of PEOES) {
      const falta = G.equipeObra.faltou.includes(p.id), t = G.equipeObra.frente[p.id], h = G.equipeObra.humor[p.id];
      const prog = comecou && T.metas[t] ? ` ${Math.min(T.metas[t], Math.floor(T.feito[t] || 0))}/${T.metas[t]}` : '';
      const frente = !comecou || !TAREFAS_OBRA[t] ? 'Frente: esperando a lista do Bira' : `Frente: ${nomeDaFrente(t)}${p.oficios.includes(t) ? ' (do ofício)' : ''}${prog}`;
      grade.append(el('div', { class: 'orel-item' + (falta ? ' trancado' : ''), style: 'cursor:pointer', onclick: e => { e.stopPropagation(); if (falta || !comecou) return; EquipeObra.trocar(p.id, T.metas); sons.tocar('pagina', 1, 0.05, -8); desenha(); } },
        el('img', { src: urlArte('retratos/' + p.id + '_normal') }),
        el('div', {}, el('b', {}, `${p.nome} — ${p.oficio}`), el('div', { class: 'orel-preco' }, falta ? 'Faltou hoje.' : frente),
          el('div', { class: 'orel-preco' }, 'Humor: ' + '●'.repeat(h) + '○'.repeat(10 - h)))));
    }
    caixa.append(grade, el('div', { style: 'text-align:right;margin-top:10px' }, el('button', { class: 'botao forte', onclick: e => { e.stopPropagation(); fecharModal(); } }, 'Fechar')));
  };
  desenha();
  abrirModal(caixa);
  sons.tocar('pagina', 1, 0.05, -4);
  return true;
}
AO_MONTAR.push(b => { if (b.id === 'vila') { poePeoes(b); const pr = b.objs.find(o => o.id === 'prancheta_obra'); if (pr) pr.acao = () => abrirPrancheta(); } });
AO_ENTRAR_MAPA.push(id => { if (id === 'vila') poePeoes(G.mapa); });
