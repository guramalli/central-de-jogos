/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🏢 AGÊNCIA 2.0 (v333). O dono achou o modo Empresário "muito cru": só botões de "resolver", poucas
   conversas e a fase 2 chegando rápido demais. Agora:
   - ESCRITÓRIO de verdade na Vila do Campinho (rua de cima): a secretária (agenda, propostas e metas),
     o chefe dos olheiros e o Quadro de Talentos. O escritório ganha troféus a cada nível da agência.
   - CONTRATAR virou CONVERSA com a família: cada família tem uma preocupação (estudo, dinheiro, ficar perto
     de casa, o sonho, ou desconfiança de empresário) e cada garoto tem a sua personalidade. Leia as pistas,
     escolha o que dizer, faça a proposta... e a família aceita ou pede um tempo. Agência rival também aparece.
   - PROBLEMAS viraram conversas em 2 etapas (faltas, redes sociais, saudade, lesão, aumento, escola, banco):
     o resultado depende da escolha E da personalidade.
   - NEGOCIAR é sentar com o diretor do clube (ou o gerente da marca): argumentos, blefe, paciência que acaba.
   - O NÍVEL da agência pede metas concretas (agencia.js AG_METAS), mostradas aqui como lista de tarefas.
   Carregar DEPOIS de agencia.js (no fim).
   ============================================================ */
const agSorte = p => Math.random() * 100 < p;
const agTem = (j, ...ps) => ps.includes(j.pers);
const agMoral = (j, n) => { j.moral = clamp(Math.round(j.moral + n), 0, 100); };
const agCusto = (j, k = 1) => Math.round(Math.max(30000, agValor(j) * 0.01) * k);
const agPrimeiro = j => j.nome.split(' ')[0];
const agG = j => j.menina ? { o: 'a', ele: 'ela', Ele: 'Ela', dele: 'dela', jogador: 'jogadora', um: 'uma' } : { o: 'o', ele: 'ele', Ele: 'Ele', dele: 'dele', jogador: 'jogador', um: 'um' };
const agEmb = l => { l = l.slice(); for (let i = l.length - 1; i > 0; i--) { const k = (Math.random() * (i + 1)) | 0; [l[i], l[k]] = [l[k], l[i]]; } return l; };
// escolhe n opções embaralhadas, sempre incluindo a "certa"
const agOpcoes = (todas, certa, n) => agEmb([certa, ...agEmb(todas.filter(x => x !== certa)).slice(0, n - 1)]);

/* ---------- quem fala ---------- */
const AG_LOOK = {
  secretaria: { tipo: 'humano', corpo: 'f', alt: 1.66, pele: 'pele-morena', cabelo: 'cabelo-coque', corCabelo: 'castanho', roupa: 'roupa-terno', corRoupa: '#6a3ad9', baixo: 'baixo-saia' },
  olheiro: { tipo: 'humano', corpo: 'm', alt: 1.72, pele: 'pele-negra', cabelo: 'cabelo-curto', corCabelo: 'grisalho', roupa: 'roupa-moletom', corRoupa: '#2a7a3a', baixo: 'baixo-jeans', pescoco: 'pescoco-apito' },
  tecnico: { tipo: 'humano', corpo: 'm', alt: 1.74, pele: 'pele-clara', cabelo: 'cabelo-raspado', corCabelo: 'preto', roupa: 'roupa-moletom', corRoupa: '#2a4aa0', baixo: 'baixo-jeans', pescoco: 'pescoco-apito' },
  medico: { tipo: 'humano', corpo: 'm', alt: 1.72, pele: 'pele-media', cabelo: 'cabelo-curto', corCabelo: 'grisalho', roupa: 'roupa-jaleco', corRoupa: '#f4f4f8', baixo: 'baixo-jeans' },
  assessora: { tipo: 'humano', corpo: 'f', alt: 1.68, pele: 'pele-negra', cabelo: 'cabelo-black-power', corCabelo: 'preto', roupa: 'roupa-terno', corRoupa: '#e05a8a', baixo: 'baixo-saia' },
};
const AG_PARENTES = { // [tratamento, parentesco, mulher?, o garoto, a garota]
  mae: ['Dona', 'mãe', 1, 'filho', 'filha'], pai: ['Seu', 'pai', 0, 'filho', 'filha'], avo_f: ['Dona', 'avó', 1, 'neto', 'neta'],
  avo_m: ['Seu', 'avô', 0, 'neto', 'neta'], tia: ['Dona', 'tia', 1, 'sobrinho', 'sobrinha'], tio: ['Seu', 'tio', 0, 'sobrinho', 'sobrinha'] };
const AG_DESEJO_TXT = { estudo: '📚 que continue estudando', dinheiro: '💰 ajuda com as contas de casa', perto: '🏠 que fique perto de casa', sonho: '⚽ realizar o sonho', respeito: '🤝 sinceridade (já foram enganados)' };
function agFamilia(j) {
  if (j.fam) return j.fam;
  const par = agPega(Object.keys(AG_PARENTES)), P = AG_PARENTES[par], f = !!P[2], idoso = par.startsWith('avo');
  j.fam = { par, desejo: agPega(Object.keys(AG_DESEJO_TXT)),
    nome: `${P[0]} ${agPega(f ? ['Cida', 'Rosa', 'Fátima', 'Lúcia', 'Graça', 'Márcia', 'Sônia', 'Zezé', 'Lourdes', 'Neusa'] : ['Zé', 'Antônio', 'Carlos', 'Jorge', 'Tião', 'Raimundo', 'Valdir', 'Edson', 'Nonato'])}`,
    look: { tipo: 'humano', corpo: f ? 'f' : 'm', alt: 1.7, pele: j.look.pele, cabelo: agPega(f ? ['cabelo-coque', 'cabelo-liso-longo', 'cabelo-cacheado', 'cabelo-rabo'] : ['cabelo-curto', 'cabelo-raspado', 'cabelo-cacheado']),
      corCabelo: idoso ? 'grisalho' : j.look.corCabelo, roupa: agPega(['roupa-camiseta', 'roupa-xadrez', 'roupa-moletom', 'roupa-regata']), corRoupa: agPega(['#d8603a', '#3a8ad8', '#e0b030', '#7a4ab0', '#3aa070', '#c03a5a']), baixo: f ? 'baixo-saia' : 'baixo-jeans' } };
  return j.fam;
}
function agFamTxt(j) {
  const f = j.fam; if (!f) return '';
  return `👪 ${f.nome} (${AG_PARENTES[f.par][1]})${f.sabe ? ' · quer: ' + AG_DESEJO_TXT[f.desejo] : f.falou ? ' · já conversaram' : ''}${j.recusas ? ' · ⚠️ já recusou uma vez' : ''}`;
}
function agDiretor(clube, marca) {
  if (marca) return { nome: `Gerente de marketing da ${marca}`, look: { tipo: 'humano', corpo: 'f', alt: 1.68, pele: 'pele-clara', cabelo: 'cabelo-liso-longo', corCabelo: 'loiro', roupa: 'roupa-terno', corRoupa: '#3ac0a0', baixo: 'baixo-saia' } };
  const nomes = [['Seu Orlando', 0], ['Dona Beatriz', 1], ['Seu Rubens', 0], ['Dona Helena', 1], ['Seu Augusto', 0], ['Dona Marta', 1]];
  let h = 0; for (const c of clube.nome) h = (h * 31 + c.charCodeAt(0)) | 0;
  const [nome, f] = nomes[Math.abs(h) % nomes.length];
  return { nome: `${nome}, diretor${f ? 'a' : ''} do ${clube.nome}`, look: { tipo: 'humano', corpo: f ? 'f' : 'm', alt: 1.72, pele: ['pele-clara', 'pele-media', 'pele-morena', 'pele-negra'][Math.abs(h >> 3) % 4], cabelo: f ? 'cabelo-coque' : 'cabelo-curto', corCabelo: 'grisalho', roupa: 'roupa-terno', corRoupa: clube.cor || '#1a1a2a', baixo: f ? 'baixo-saia' : 'baixo-jeans' } };
}
const agQ = {
  jog: j => ({ nome: j.nome, look: j.look }),
  fam: j => { const f = agFamilia(j); return { nome: `${f.nome} (${AG_PARENTES[f.par][1]} d${agG(j).o} ${agPrimeiro(j)})`, look: f.look }; },
  tecnico: j => ({ nome: `Professor Válter, técnico${j.clube ? ' do ' + j.clube.nome : ' da escolinha'}`, look: AG_LOOK.tecnico }),
  medico: () => ({ nome: 'Doutor Paulo, médico do esporte', look: AG_LOOK.medico }),
  assessora: () => ({ nome: 'Lu, assessora de imprensa da agência', look: AG_LOOK.assessora }),
};

/* ---------- a tela de conversa ---------- */
// { titulo, quem:{nome,look}, txt, voce (o que você disse), info, medidor:{rot,v,delta}, ops:[{txt, sub, fn, cls, off}] }
function agDialogo(o) {
  const ret = mkCanvas(96, 120); ret.className = 'agc-ret';
  [0, 400, 1500].forEach(ms => setTimeout(() => { try { pintaAparencia(ret, o.quem.look, { inteiro: true }); } catch (e) { } }, ms));
  const txt = o.txt || '', bolha = el('p', { class: 'agc-bolha', 'aria-label': txt, title: 'toque para ver tudo' });
  let i = 0; const iv = setInterval(() => { i += 2; bolha.textContent = txt.slice(0, i); if (i >= txt.length) clearInterval(iv); }, 16);
  bolha.onclick = () => { i = txt.length; bolha.textContent = txt; };
  let med = '';
  if (o.medidor) {
    const m = o.medidor, v = clamp(Math.round(m.v), 0, 100);
    med = el('div', { class: 'agc-med' }, el('small', {}, m.rot), el('div', { class: 'agc-barra' }, el('i', { style: `width:${v}%;background:${v >= 66 ? '#3aa84a' : v >= 36 ? '#e0a020' : '#d8483a'}` })),
      m.delta ? el('b', { class: 'agc-delta ' + (m.delta > 0 ? 'mais' : 'menos') }, (m.delta > 0 ? '+' : '') + m.delta) : '');
  }
  const ops = el('div', { class: 'agc-ops' }, ...(o.ops || []).map((op, k) => el('button', { class: 'btn agc-op ' + (op.cls || (k === 0 && o.ops.length === 1 ? 'amarelo' : '')), type: 'button', disabled: op.off ? 'disabled' : null, style: `animation-delay:${0.08 * k}s`,
    onclick: () => { clearInterval(iv); op.fn(); } }, el('span', {}, op.txt), op.sub || op.off ? el('small', {}, op.off || op.sub) : '')));
  abreModal.largo = true;
  abreModal(el('h2', {}, o.titulo), el('div', { class: 'agc' }, el('div', { class: 'agc-quem' }, ret, el('b', {}, o.quem.nome)),
    el('div', { class: 'agc-fala' }, o.voce ? el('p', { class: 'agc-voce' }, '🗨️ Você: “' + o.voce.replace(/^\S+\s/, '').replace(/^["“]+|["”]+$/g, '') + '”') : '', bolha, o.info ? el('div', { class: 'agc-info' }, o.info) : '', med)), ops);
}

/* ---------- 1) CONTRATAR: a conversa com a família ---------- */
const AG_FAM_ABRE = {
  estudo: (j, g) => `Boa tarde! Olha, futebol é lindo, mas aqui em casa a escola vem primeiro. ${agPrimeiro(j)} não larga os estudos de jeito nenhum, viu?`,
  dinheiro: (j, g) => `Boa tarde... A vida aqui não tá fácil, eu trabalho o dia inteiro. Se o futebol puder ajudar nas contas de casa, já seria uma bênção.`,
  perto: (j, g) => `${g.Ele} nunca dormiu longe de casa, sabe? Meu coração aperta só de pensar ${g.o === 'a' ? 'nela' : 'nele'} indo pra longe tão novinh${g.o}.`,
  sonho: (j, g) => `Desde pequenininh${g.o} ${g.ele} dorme abraçad${g.o} com a bola! Ser ${g.jogador} é o sonho da vida ${g.dele}.`,
  respeito: (j, g) => `Hum... Já apareceu muito empresário aqui prometendo mundos e fundos. Depois sumiram todos. Por que eu devia confiar em você?`,
};
const AG_ABORD = {
  estudo: '📚 A agência ajuda com a escola: estudo e bola andam juntos.',
  dinheiro: '💰 A agência paga uma ajuda de custo para a família todo mês.',
  perto: '🏠 No começo, os treinos vão ser aqui pertinho de casa.',
  sonho: '⚽ Eu vejo um futuro profissional aqui. Vamos realizar esse sonho!',
  respeito: '🤝 Eu também vim da várzea. Não prometo milagre: prometo trabalho e sinceridade.',
};
const AG_FAM_SIM = {
  estudo: f => `Ah, isso me deixa muito mais ${f ? 'tranquila' : 'tranquilo'}! Estudo e bola, juntos. Gostei.`,
  dinheiro: () => 'Nossa... isso ajudaria demais a gente. Muito obrigado mesmo.',
  perto: f => `Ufa! Pertinho de casa eu fico bem mais ${f ? 'sossegada' : 'sossegado'}.`,
  sonho: () => 'É isso! Olha só, os olhinhos até brilharam agora!',
  respeito: () => 'Finalmente alguém que fala a verdade. Gostei de você.',
};
const AG_PERS_FALA = {
  ambicioso: 'Eu quero jogar na Europa! Quero ser o melhor do mundo, ganhar a Bola de Ouro!',
  relaxado: 'Eu jogo porque é divertido, sabe? Não curto muita pressão...',
  trabalhador: 'Eu treino todo dia, até com chuva. Só preciso de uma chance.',
  ganancioso: 'E quanto eu vou ganhar? Quero comprar uma casa nova pra minha família.',
  leal: 'Eu queria continuar perto dos meus amigos do time daqui...',
  temperamental: 'Já me tiraram de um time por causa de briga. Mas o juiz que tava errado!',
};
const AG_PERS_FRASE = {
  ambicioso: '🌍 Com treino e cabeça boa, a Europa é o caminho!',
  relaxado: '😎 Sem pressão: um passo de cada vez, curtindo o jogo.',
  trabalhador: '💪 Trabalho duro sempre aparece. Comigo você vai ter a chance.',
  ganancioso: '💰 Bom contrato vem com bom futebol. Vou negociar o melhor pra você.',
  leal: '❤️ Seus amigos e o time daqui vão ser sempre a sua casa.',
  temperamental: '🧘 Craque também controla a cabeça. A gente treina isso juntos.',
};
const AG_PERS_SIM = {
  ambicioso: 'ISSO! Pode escrever: eu vou ser o melhor do mundo!', relaxado: 'Ah, assim eu gosto. Sem estresse!', trabalhador: 'Pode contar comigo. Eu não falto nunca!',
  ganancioso: 'Opa, gostei! Vou poder ajudar minha família.', leal: 'Que bom... meus amigos vão ficar felizes.', temperamental: 'Tá... eu vou tentar. Sério mesmo.',
};
function agConversaFamilia(j) {
  const a = agDados(), s = G.save, g = agG(j), f = agFamilia(j), P = AG_PARENTES[f.par], mulher = !!P[2];
  const titulo = `💬 Conversa com a família de ${agPrimeiro(j)}`, qF = agQ.fam(j), qJ = agQ.jog(j);
  const custo = Math.max(50000, Math.round(agValor(j) * 0.6)), rival = j.potV && j.potV[1] >= 85;
  let conf = 15 + agNivelRep() * 8;
  const med = d => ({ rot: '🤝 Confiança da família', v: conf, delta: d });
  const aindaAqui = () => a.achados.includes(j);
  // 1. a família fala primeiro: a preocupação dela aparece nas entrelinhas
  agDialogo({ titulo, quem: qF, txt: AG_FAM_ABRE[f.desejo](j, g), medidor: med(), info: rival ? '' : `Você está na sala da família de ${j.nome} (${j.idade} anos, ${AG_POS[j.pos][0]}). Leia com atenção o que preocupa a família.`,
    ops: [...agOpcoes(Object.keys(AG_ABORD), f.desejo, 4).map(k => ({ txt: AG_ABORD[k], fn: () => passo2(k) })), { txt: '🚪 Melhor voltar outra hora', cls: 'cinza', fn: () => abreAgencia('talentos') }] });
  function passo2(k) {
    let d, r;
    if (k === f.desejo) { d = 30; r = AG_FAM_SIM[f.desejo](mulher); f.sabe = true; }
    else if (f.desejo === 'respeito' && (k === 'dinheiro' || k === 'sonho')) { d = -10; r = 'Hum... já ouvi essa conversa antes. Promessa é fácil, né?'; }
    else { d = 5; r = agPega(['Hum... tá certo.', 'Entendi... mas não era bem isso que me preocupava.', 'Pode ser. Vamos ver.']); }
    conf += d; f.falou = true;
    let info = '';
    if (rival) { conf -= 12; info = `📞 O celular da família toca: é a Estrela Sports, uma agência rival, querendo marcar uma visita. Tem concorrência! (−12)`; }
    agDialogo({ titulo, quem: qF, voce: AG_ABORD[k], txt: r, info, medidor: med(rival ? d - 12 : d), ops: [{ txt: `▶ Conversar com ${agPrimeiro(j)}`, cls: 'amarelo', fn: passo3 }] });
  }
  // 2. o garoto (a garota) entra na conversa: a personalidade aparece no jeito de falar
  function passo3() {
    agDialogo({ titulo, quem: qJ, txt: AG_PERS_FALA[j.pers], medidor: med(), info: `Personalidade: ${AG_PERS[j.pers].nome} — ${AG_PERS[j.pers].desc}`,
      ops: agOpcoes(Object.keys(AG_PERS_FRASE), j.pers, 4).map(k => ({ txt: AG_PERS_FRASE[k], fn: () => passo4(k) })) });
  }
  function passo4(k) {
    let d, r;
    if (k === j.pers) { d = 25; r = AG_PERS_SIM[j.pers]; }
    else if (j.pers === 'ambicioso' && k === 'relaxado') { d = -5; r = 'Sem pressão?! Eu QUERO pressão! Quero ser o melhor!'; }
    else if (j.pers === 'relaxado' && k === 'ambicioso') { d = -5; r = 'Europa?! Calma... eu só quero jogar bola.'; }
    else if (j.pers === 'temperamental' && k === 'trabalhador') { d = -5; r = 'Ninguém treina mais que eu! Tá achando que eu sou preguiçoso?'; }
    else { d = 0; r = agPega(['Hmm... tá.', 'Ah... ok.', '(olha para o chão, sem dizer nada)', 'Legal... eu acho.']); }
    conf += d;
    agDialogo({ titulo, quem: qJ, voce: AG_PERS_FRASE[k], txt: r, medidor: med(d), ops: [{ txt: '▶ Fazer a proposta', cls: 'amarelo', fn: passo5 }] });
  }
  // 3. a proposta: quanto mais generosa, mais confiança (e a família valoriza o que combina com ela)
  function passo5() {
    const pacotes = [
      ['padrao', '📄 O contrato padrão da agência', custo, 0],
      ['kit', '🎁 Contrato + kit completo (chuteira, uniforme e bola)', Math.round(custo * 1.5), 12 + (f.desejo === 'sonho' ? 6 : 0)],
      ['bolsa', '🎓 Contrato + bolsa de estudos e ajuda de custo', Math.round(custo * 2.2), 20 + (f.desejo === 'estudo' || f.desejo === 'dinheiro' ? 10 : 0)],
    ];
    agDialogo({ titulo, quem: qF, txt: `Muito bem... e o que a sua agência oferece para ${g.o === 'a' ? 'a nossa menina' : 'o nosso menino'}?`, medidor: med(),
      ops: [...pacotes.map(([id, txt, c, d]) => ({ txt, sub: `💰 ${agFmt(c)} tostões (só paga se aceitarem)`, off: s.ouro < c ? `💸 faltam ${agFmt(c - s.ouro)} tostões` : null, fn: () => passo6(id, txt, c, d) })),
        { txt: '🚪 Melhor voltar outra hora', cls: 'cinza', fn: () => abreAgencia('talentos') }] });
  }
  function passo6(id, txt, c, d) {
    conf += d;
    agDialogo({ titulo, quem: qF, voce: txt, txt: `Deixa eu conversar um minutinho com ${g.ele} lá dentro...`, medidor: med(d), info: '(Quanto maior a confiança da família, maior a chance de aceitarem.)',
      ops: [{ txt: '🤞 Esperar a resposta', cls: 'amarelo', fn: () => resposta(id, c) }] });
  }
  function resposta(id, c) {
    if (!aindaAqui()) { log('Esse talento já não está mais esperando.', 'l-sis'); abreAgencia('talentos'); return; }
    if (a.jogadores.length >= agMaxJogadores()) { log(`Sua agência só representa ${agMaxJogadores()} jogadores agora.`, 'l-sis'); abreAgencia('talentos'); return; }
    const ok = agSorte(clamp(conf, 5, 95));
    if (ok && s.ouro >= c) {
      s.ouro -= c; a.achados.splice(a.achados.indexOf(j), 1); j.fase = 'treino'; agMoral(j, Math.round(conf / 4) - 10);
      agHist(j, `assinou com a sua agência${id === 'bolsa' ? ' (com bolsa de estudos)' : id === 'kit' ? ' (ganhou um kit completo)' : ''}`);
      a.jogadores.push(j); agGanhaRep(6 + Math.max(0, j.pot - 75)); agMarco('assinados');
      log(`✍️ ${j.nome} agora é representad${g.o} pela ${a.nome}!`, 'l-loot'); som('moeda'); salvar();
      agDialogo({ titulo: `✍️ ${j.nome} assinou com a ${a.nome}!`, quem: qJ, txt: agPega(['EBAAA! Pode contar comigo, eu vou dar o meu melhor!', 'Sério?! Eu vou ser profissional! Obrigad' + g.o + '!', 'Valeu! Prometo que você não vai se arrepender!']),
        info: `${qF.nome.split(' (')[0]}: “Cuida bem ${g.dele}, viu?”`, ops: [{ txt: '👤 Ver meus jogadores', cls: 'amarelo', fn: () => abreAgencia('jogadores') }] });
      return;
    }
    j.recusas = (j.recusas || 0) + 1;
    if (j.recusas >= 2) {
      a.achados.splice(a.achados.indexOf(j), 1); salvar();
      agDialogo({ titulo: '❌ Não foi desta vez', quem: qF, txt: `Desculpa... A gente pensou muito e decidiu fechar com outra agência. Mas obrigad${mulher ? 'a' : 'o'} pela visita.`,
        info: `${j.nome} não está mais na sua lista. Dica: preste atenção no que a família e o garoto dizem — cada um quer ouvir uma coisa.`, ops: [{ txt: '↩ Voltar para a agência', fn: () => abreAgencia('talentos') }] });
      return;
    }
    j.pensa = a.nPer || 0; salvar();
    agDialogo({ titulo: '⏳ A família vai pensar', quem: qF, txt: 'A gente ainda não tem certeza... Vamos pensar com calma. Volta daqui a uns meses?',
      info: `Você pode tentar de novo no próximo período (uma segunda recusa e ${g.ele} vai para outra agência). ${f.sabe ? '' : 'Dica: o que será que preocupa essa família?'}`, ops: [{ txt: '↩ Voltar para a agência', fn: () => abreAgencia('talentos') }] });
  }
}

/* ---------- 2) PROBLEMAS: conversas em 2 etapas ---------- */
// cada opção devolve { prox: etapa } ou { fala, res, bom|ruim, quem?, cena? }
const AG_CONVERSAS = {
  falta: {
    titulo: 'Faltas no treino', quando: () => true,
    txt: j => `🚨 ${j.nome} faltou a três treinos seguidos e o técnico está bravo.`,
    abre: j => ({ quem: agQ.tecnico(j), fala: `Empresário, ${agPrimeiro(j)} faltou a TRÊS treinos esta semana! Se continuar assim, vai para o banco. Resolve isso!`, ops: [
      { txt: '👂 Conversar com calma e ouvir o que está acontecendo', fn: j => ({ prox: agFaltaMotivo(j) }) },
      { txt: '📢 Dar uma bronca firme', fn: j => agTem(j, 'trabalhador', 'ambicioso') ? (agMoral(j, -2), { fala: 'Foi mal... você tem razão. Amanhã eu chego primeiro que todo mundo.', res: 'Levou a bronca a sério e voltou a treinar.', bom: 1 })
        : agTem(j, 'temperamental') ? (agMoral(j, -20), agSorte(50) && (j.parado += 1), { fala: 'Ninguém me entende! Vocês só sabem gritar!', res: 'Explodiu com a bronca e ficou ainda pior.', ruim: 1 })
        : agSorte(60) ? (agMoral(j, -6), { fala: 'Tá bom, tá bom... eu volto.', res: 'Voltou a treinar, meio chateado(a).' }) : (agMoral(j, -12), { fala: '...', res: 'Ficou magoado(a) com a bronca.', ruim: 1 }) },
      { txt: '🙈 Deixar pra lá', fn: j => agSorte(50) ? (j.parado += 2, agMoral(j, -10), { fala: '(faltou mais uma semana inteira)', res: 'Piorou: ficou 2 períodos sem evoluir.', ruim: 1 }) : { fala: '(voltou a treinar sozinho, sem dizer nada)', res: 'Desta vez passou...' } },
    ] }),
  },
  redes: {
    titulo: 'Confusão nas redes sociais', quando: j => j.idade >= 15,
    txt: j => `📱 ${j.nome} postou um vídeo zoando o time rival e a torcida ficou brava.`,
    abre: j => ({ quem: agQ.assessora(), fala: `Chefe, o vídeo d${agG(j).o} ${agPrimeiro(j)} zoando o rival viralizou... e não foi do jeito bom. A torcida rival está furiosa nos comentários!`, ops: [
      { txt: '📝 Ajudar a escrever um pedido de desculpas sincero', fn: j => { j.fama = (j.fama || 0) + 2; return { quem: agQ.jog(j), fala: 'Eu não queria magoar ninguém... Pedi desculpas e até o capitão do rival respondeu numa boa.', res: 'O pedido de desculpas foi elogiado. Todo mundo erra!', bom: 1 }; } },
      { txt: '😂 Gravar um vídeo brincando com a situação', sub: '🎲 arriscado', fn: j => agSorte(40 + (j.fama || 0) / 2) ? (j.fama = (j.fama || 0) + 8, { fala: 'Virou meme do bem! Até a torcida rival riu.', res: 'A brincadeira deu certo: a fama subiu.', bom: 1 })
        : (j.fama = Math.max(0, (j.fama || 0) - 8), { fala: 'Ih... piorou. Agora são DUAS torcidas bravas.', res: 'A brincadeira pegou mal: a fama caiu.', ruim: 1 }) },
      { txt: '🔇 Pedir para ficar uma semana longe das redes', fn: j => agTem(j, 'temperamental', 'ganancioso') ? (agMoral(j, -10), { quem: agQ.jog(j), fala: 'Uma semana SEM celular?! Isso é castigo!', res: 'Obedeceu, mas emburrado(a).' })
        : (agMoral(j, -2), { quem: agQ.jog(j), fala: 'Tá bom. Vou aproveitar pra treinar mais.', res: 'Sumiu das redes e a poeira baixou.', bom: 1 }) },
      { txt: '🙈 Deixar passar', fn: j => agSorte(50) ? (j.fama = Math.max(0, (j.fama || 0) - 10), { fala: 'A confusão cresceu e saiu até no jornal...', res: 'Pegou mal: a fama caiu.', ruim: 1 }) : { fala: 'No dia seguinte todo mundo já tinha esquecido.', res: 'Passou sozinho.' } },
    ] }),
  },
  saudade: {
    titulo: 'Saudade de casa', quando: j => j.idade < 21,
    txt: j => `🏠 ${j.nome} está com muita saudade da família.`,
    abre: j => ({ quem: agQ.jog(j), fala: `Tô com muita saudade de casa... da comida d${AG_PARENTES[agFamilia(j).par][2] ? 'a minha ' : 'o meu '}${AG_PARENTES[agFamilia(j).par][1]}, dos meus amigos. Acho que eu quero voltar...`, ops: [
      { txt: '✈️ Trazer a família para uma visita', custo: j => agCusto(j, 2), fn: j => (agMoral(j, 22), { quem: agQ.fam(j), fala: `Que saudade de você, ${agPrimeiro(j)}! Olha só como você cresceu!`, res: 'A família veio visitar. Voltou a sorrir!', bom: 1, cena: 'saudade' }) },
      { txt: '📞 Combinar uma chamada de vídeo todo domingo', fn: j => agTem(j, 'leal', 'relaxado', 'trabalhador') ? (agMoral(j, 10), { fala: 'Todo domingo? Combinado! Já tô mais feliz.', res: 'As chamadas de domingo viraram tradição.', bom: 1 }) : (agMoral(j, 4), { fala: 'Ajuda um pouco... mas não é a mesma coisa.', res: 'Melhorou um pouquinho.' }) },
      { txt: '🏠 Deixar passar uma semana em casa', fn: j => (agMoral(j, 15), j.parado += 1, { fala: 'Sério?! Obrigad' + agG(j).o + '! Volto com energia total!', res: 'Matou a saudade (ficou 1 período sem treinar).', bom: 1 }) },
      { txt: '💪 "Craque tem que ser forte, segura a onda"', fn: j => agTem(j, 'trabalhador') ? (agMoral(j, -3), { fala: 'É... você tem razão. Vou focar no treino.', res: 'Segurou a saudade.' }) : (agMoral(j, -15), { fala: '(ficou em silêncio, com os olhos marejados)', res: 'Ficou muito triste com a resposta.', ruim: 1 }) },
    ] }),
  },
  lesao: {
    titulo: 'Lesão no treino', quando: () => true,
    txt: j => `🤕 ${j.nome} sentiu uma dor na coxa no treino.`,
    abre: j => ({ quem: agQ.medico(), fala: `É uma lesão leve na coxa. Com repouso, uns 2 períodos parad${agG(j).o}. Mas tem outros caminhos... a decisão é sua.`, ops: [
      { txt: '🏥 Fisioterapia completa', custo: j => agCusto(j, 1.5), fn: j => ({ fala: 'Com a fisioterapia, a recuperação vai ser rapidinha. Já pode treinar leve!', res: 'Recuperação rápida, já está treinando!', bom: 1 }) },
      { txt: '🧊 Repouso e gelo, sem pressa', fn: j => (j.parado += 2, agTem(j, 'ambicioso', 'trabalhador') && agMoral(j, -5), { fala: 'Decisão responsável. Corpo de atleta precisa de cuidado.', res: 'Vai ficar 2 períodos parado(a), mas sem risco.', bom: 1 }) },
      { txt: '⚡ Deixar jogar a final do fim de semana', sub: '⚠️ arriscado', fn: j => agSorte(35) ? (j.fama = (j.fama || 0) + 6, { fala: 'Jogou... e brilhou! Mas foi sorte. Não faça isso de novo.', res: 'Jogou a final e foi bem, mas o susto foi grande.' })
        : (j.parado += 4, agMoral(j, -10), { fala: 'Eu avisei... a lesão piorou. Agora são 4 períodos de recuperação.', res: 'A lesão piorou: 4 períodos parado(a).', ruim: 1 }) },
    ] }),
  },
  aumento: {
    titulo: 'Pedido de aumento', quando: j => j.fase === 'pro' && !j.meuClube && (j.pers === 'ganancioso' || Math.random() < 0.3),
    txt: j => `💰 ${j.nome} quer um aumento de salário no ${j.clube.nome}.`,
    abre: j => ({ quem: agQ.jog(j), fala: 'Descobri que um colega do time ganha o dobro de mim! E eu jogo mais que ele. Quero aumento!', ops: [
      { txt: '📊 Ir até o clube negociar o aumento', fn: j => ({ prox: { quem: agDiretor(j.clube), fala: `Aumento? O contrato d${agG(j).o} ${agPrimeiro(j)} foi assinado há pouco tempo...`, ops: [
        { txt: `📈 Mostrar as estatísticas ${agG(j).dele}`, fn: j => agSorte(45 + (j.ovr - AG_CLUBES[j.clube.nivel].ovr) * 5) ? (j.salario = Math.round(j.salario * 1.2), agMoral(j, 10), { fala: 'Os números não mentem. Tudo bem: 20% de aumento.', res: `Aumento de 20%: salário agora ${agFmt(j.salario)}/mês.`, bom: 1 })
          : (agMoral(j, -5), { fala: 'Bons números, mas ainda não o suficiente. Fica para a próxima temporada.', res: 'O clube não se convenceu.' }) },
        { txt: '🤝 Propor um aumento menor + bônus por gol', fn: j => agSorte(75) ? (j.salario = Math.round(j.salario * 1.1), agMoral(j, 6), { fala: 'Assim fica bom para os dois lados. Fechado!', res: `Aumento de 10% + bônus: salário ${agFmt(j.salario)}/mês.`, bom: 1 }) : (agMoral(j, -4), { fala: 'Nem assim, desculpe. O orçamento está apertado.', res: 'O clube recusou até o aumento pequeno.' }) },
        { txt: '🚪 "Se não der aumento, ele(a) vai embora!"', sub: '🎲 arriscado', fn: j => agSorte(30 + agNivelRep() * 8) ? (j.salario = Math.round(j.salario * 1.3), agMoral(j, 12), { fala: 'Calma, calma! Ninguém vai embora. 30% de aumento, pode ser?', res: `Aumento de 30%: salário ${agFmt(j.salario)}/mês!`, bom: 1 })
          : (agMoral(j, -10), { fala: 'Ameaça aqui não funciona. A porta está aberta.', res: 'O clube não gostou da ameaça.', ruim: 1 }) },
      ] } }) },
      { txt: '⏳ Pedir paciência até o fim da temporada', fn: j => agTem(j, 'ganancioso') ? (agMoral(j, -12), { fala: 'Paciência, paciência... sempre a mesma conversa!', res: 'Aceitou esperar, contrariado(a).', ruim: 1 }) : (agMoral(j, -4), { fala: 'Tá bom, eu espero. Mas não esquece, hein!', res: 'Topou esperar.' }) },
      { txt: '🎯 "Mostra em campo: jogando bem, o aumento vem"', fn: j => agTem(j, 'ambicioso', 'trabalhador') ? (agMoral(j, 4), { fala: 'Desafio aceito! Vou fazer chover em campo!', res: 'Topou o desafio e ganhou motivação.', bom: 1 }) : agTem(j, 'ganancioso') ? (agMoral(j, -15), { fala: 'Eu JÁ jogo bem! Você é meu empresário ou do clube?', res: 'Ficou bravo(a) com a resposta.', ruim: 1 }) : (agMoral(j, -5), { fala: 'Hum... tá.', res: 'Não gostou muito.' }) },
    ] }),
  },
  escola: {
    titulo: 'As notas da escola', quando: j => j.idade < 18,
    txt: j => `📚 A escola de ${j.nome} ligou: as notas caíram.`,
    abre: j => ({ quem: agQ.fam(j), fala: `A escola ligou: as notas d${agG(j).o} ${agPrimeiro(j)} caíram muito! Eu sempre disse que estudo vem primeiro...`, ops: [
      { txt: '📚 Pagar um professor particular', custo: j => agCusto(j), fn: j => (agMoral(j, 5), { fala: 'Com o professor, as notas já estão subindo! Muito obrigada(o)!', res: 'As notas voltaram a subir!', bom: 1 }) },
      { txt: '⚽ Combinar: nota boa = mais tempo de bola', fn: j => agTem(j, 'trabalhador', 'leal', 'ambicioso') || agSorte(65) ? (agMoral(j, 6), { quem: agQ.jog(j), fala: 'Combinado! Vou tirar nota boa pra jogar mais!', res: 'O combinado funcionou: notas e bola em dia.', bom: 1 }) : (agMoral(j, -2), { quem: agQ.jog(j), fala: 'Ah, mas matemática é muito difícil...', res: 'Ainda está difícil na escola.' }) },
      { txt: '🙈 "O importante é o futebol"', fn: j => (agMoral(j, -5), { fala: 'Como assim?! Eu não acredito que ouvi isso de você.', res: 'A família ficou chateada com você.', ruim: 1 }) },
    ] }),
  },
  banco: {
    titulo: 'Só no banco de reservas', quando: j => j.fase === 'pro' || j.fase === 'base',
    txt: j => `🪑 ${j.nome} está reclamando que só fica no banco de reservas.`,
    abre: j => ({ quem: agQ.jog(j), fala: 'O técnico me deixou no banco de novo! Eu treino tanto... não é justo!', ops: [
      { txt: '🎥 Ver os vídeos dos jogos juntos e achar o que melhorar', fn: j => { agMoral(j, 6); agTreinoFoco(j); return { fala: 'Nossa, eu nem tinha reparado nisso! Vou treinar exatamente essa parte.', res: 'Acharam juntos o que melhorar: evoluiu um pouco!', bom: 1 }; } },
      { txt: '📞 Ligar para o técnico', fn: j => agSorte(50) ? (j.fama = (j.fama || 0) + 4, agMoral(j, 8), { quem: agQ.tecnico(j), fala: 'Tá certo, vou dar uma chance no próximo jogo. Que aproveite!', res: 'Ganhou uma chance como titular e foi bem!', bom: 1 }) : (agMoral(j, -6), { quem: agQ.tecnico(j), fala: 'Quem escala o time sou eu, empresário.', res: 'O técnico não gostou da ligação.' }) },
      { txt: '😌 "Paciência: a chance vai chegar"', fn: j => agTem(j, 'relaxado', 'leal', 'trabalhador') ? (agMoral(j, 2), { fala: 'É... vou continuar treinando firme.', res: 'Seguiu firme, esperando a chance.' }) : (agMoral(j, -10), { fala: 'Paciência eu já tive demais!', res: 'Ficou frustrado(a).', ruim: 1 }) },
    ] }),
  },
};
function agFaltaMotivo(j) {
  const m = j.pers === 'temperamental' ? 'briga' : j.pers === 'relaxado' ? 'game' : agPega(['escola', 'game', 'cansaco']);
  const q = agQ.jog(j);
  if (m === 'briga') return { quem: q, fala: 'O técnico gritou comigo na frente de todo mundo! Eu não volto lá enquanto ele não pedir desculpa!', ops: [
    { txt: '🤝 Marcar uma conversa dos dois juntos, com você no meio', fn: j => agSorte(j.pers === 'temperamental' ? 60 : 75) ? (agMoral(j, 12), { fala: 'A gente conversou e ficou tudo certo. Ele até me elogiou depois!', res: 'Fizeram as pazes com o técnico.', bom: 1 }) : (agMoral(j, -3), { fala: 'Conversamos... mas eu ainda tô chateado.', res: 'Voltou a treinar, mas o clima não é dos melhores.' }) },
    { txt: '😠 "O técnico está certo e ponto final"', fn: j => j.pers === 'temperamental' ? (agMoral(j, -20), j.parado += 1, { fala: 'Até você?! Então eu não volto MESMO!', res: 'Explodiu e ficou 1 período sem treinar.', ruim: 1 }) : (agMoral(j, -8), { fala: 'Tá... vou voltar.', res: 'Voltou, contrariado(a).' }) },
    { txt: '🧊 "Descansa hoje e volta amanhã com a cabeça fria"', fn: j => (agMoral(j, 5), { fala: 'É... acho que eu também exagerei um pouco.', res: 'Esfriou a cabeça e voltou no dia seguinte.', bom: 1 }) },
  ] };
  if (m === 'game') return { quem: q, fala: 'Ah... eu fiquei jogando videogame até de madrugada e perdi a hora. Foi mal...', ops: [
    { txt: '⏰ Combinar um horário para dormir, com despertador', fn: j => agTem(j, 'relaxado') && !agSorte(70) ? (agMoral(j, -2), { fala: 'Hmm... vou tentar, mas é difícil.', res: 'Ainda perde a hora de vez em quando.' }) : (agMoral(j, 5), { fala: 'Combinado! Nunca mais perco a hora.', res: 'Criou o hábito de dormir cedo.', bom: 1 }) },
    { txt: '📵 Guardar o videogame por um mês', fn: j => agTem(j, 'temperamental', 'ganancioso') ? (agMoral(j, -15), { fala: 'UM MÊS?! Isso não é justo!', res: 'Ficou bravo(a), mas parou de faltar.', ruim: 1 }) : (agMoral(j, -5), { fala: 'Tá bom... eu entendo.', res: 'Parou de faltar.', bom: 1 }) },
    { txt: '🏆 "Se não faltar o mês todo, ganha o jogo novo de futebol"', custo: j => agCusto(j, 0.5), fn: j => (agMoral(j, 10), { fala: 'Fechado! Pode comprar que eu não falto nenhum dia!', res: 'Não faltou mais e ganhou o jogo novo.', bom: 1 }) },
  ] };
  if (m === 'escola') return { quem: q, fala: 'É que eu tô com prova na escola e não tava dando tempo de estudar e treinar...', ops: [
    { txt: '📚 Pagar um professor particular', custo: j => agCusto(j), fn: j => (agMoral(j, 12), { fala: 'Com o professor, deu pra fazer tudo! Tirei nota boa!', res: 'Estudo e treino em dia.', bom: 1 }) },
    { txt: '📅 Montar uma agenda de estudo e treino juntos', fn: j => agTem(j, 'trabalhador', 'leal') || agSorte(70) ? (agMoral(j, 6), { fala: 'Assim fica bem mais fácil de organizar!', res: 'A agenda funcionou.', bom: 1 }) : (agMoral(j, -2), { fala: 'Mesmo com a agenda, tá puxado...', res: 'Ainda está difícil conciliar.' }) },
    { txt: '⚽ "Treino é mais importante que prova"', fn: j => (agMoral(j, -5), { quem: agQ.fam(j), fala: 'COMO É QUE É?! Estudo vem primeiro nessa casa!', res: 'A família ficou brava com você.', ruim: 1 }) },
  ] };
  return { quem: q, fala: 'Eu tô muito cansad' + agG(j).o + '... treino de manhã, de tarde, escola... não tô aguentando.', ops: [
    { txt: '🛌 Pedir ao clube uma semana de descanso', fn: j => (agMoral(j, 10), { fala: 'Descansei e voltei com tudo!', res: 'Voltou renovado(a).', bom: 1 }) },
    { txt: '🥗 Contratar um nutricionista', custo: j => agCusto(j), fn: j => (agMoral(j, 8), { fala: 'Comendo direito, a energia voltou!', res: 'Com alimentação certa, a energia voltou.', bom: 1 }) },
    { txt: '💪 "Cansaço é frescura"', fn: j => (agMoral(j, -12), agSorte(40) && (j.parado += 2), { fala: '...', res: 'Continuou exausto(a) e desanimado(a).', ruim: 1 }) },
  ] };
}
// "achar o que melhorar": +1 em dois atributos (dentro do limite do potencial)
function agTreinoFoco(j) {
  const k = Object.keys(AG_ATR); for (let i = 0; i < 2; i++) { const at = agPega(k); j.atr[at] = Math.min(clamp(j.pot + 3, 20, 99), j.atr[at] + 1); }
  j.ovr = Math.min(j.pot, agOvr(j));
}
function agConversaProblema(e) {
  const j = agJog(e.jog), C = AG_CONVERSAS[e.conv];
  if (!j || !C) { e.feito = true; e.resultado = '✔ resolvido'; salvar(); abreAgencia('hoje'); return; }
  const titulo = `💬 ${C.titulo} — ${j.nome}`;
  const mostra = (etapa, voce) => agDialogo({ titulo, quem: etapa.quem, txt: etapa.fala, voce, info: voce ? '' : `${AG_PERS[j.pers].nome} · moral ${Math.round(j.moral)}`,
    ops: etapa.ops.map(op => { const custo = op.custo ? op.custo(j) : 0; return { txt: op.txt, sub: custo ? `💰 ${agFmt(custo)} tostões` : op.sub, off: custo && G.save.ouro < custo ? `💸 faltam ${agFmt(custo - G.save.ouro)} tostões` : null,
      fn: () => {
        if (e.feito) { abreAgencia('hoje'); return; }
        if (custo) G.save.ouro -= custo;
        const antes = { moral: j.moral, fama: j.fama || 0, parado: j.parado, ovr: j.ovr };
        const r = op.fn(j);
        if (r.prox) return mostra(r.prox, op.txt);
        fim(r, op.txt, etapa.quem, antes);
      } }; }) });
  const fim = (r, voce, quem, antes) => {
    j.moral = clamp(j.moral, 0, 100);
    const efeitos = [];
    const dm = Math.round(j.moral - antes.moral), df = Math.round((j.fama || 0) - antes.fama), dp = j.parado - antes.parado, dv = j.ovr - antes.ovr;
    if (dm) efeitos.push(`${dm > 0 ? '😊' : '😟'} moral ${dm > 0 ? '+' : ''}${dm}`); if (df) efeitos.push(`⭐ fama ${df > 0 ? '+' : ''}${df}`);
    if (dp > 0) efeitos.push(`🤕 ${dp} período(s) parado`); if (dv > 0) efeitos.push(`📈 overall +${dv}`);
    e.feito = true; e.resultado = `${r.bom ? '👍' : r.ruim ? '👎' : '➖'} ${r.res}`; agHist(j, r.res);
    if (r.bom) { agGanhaRep(5); agMarco('bons'); }
    salvar();
    agDialogo({ titulo: r.bom ? '👍 Bem resolvido!' : r.ruim ? '👎 Não deu muito certo...' : '➖ Resolvido', quem: r.quem || quem, voce, txt: r.fala,
      info: el('span', {}, el('b', {}, r.res), efeitos.length ? el('small', {}, ' · ' + efeitos.join(' · ')) : '', r.bom ? el('small', {}, ' · 🎯 +1 problema bem resolvido (meta da agência)') : ''),
      ops: [{ txt: '↩ Voltar para a agência', cls: 'amarelo', fn: () => abreAgencia('hoje') }] });
    if (r.cena) agFila(r.cena, '🏠 A família chegou!', `${j.nome} ganhou a visita da família e voltou a sorrir.`, 'confete');
  };
  mostra(C.abre(j));
}

/* ---------- 3) NEGOCIAR: rodadas com o diretor do clube (ou a marca) ---------- */
function agConversaNegocio(e, j) {
  const o = e.oferta, tipo = e.tipo, campo = tipo === 'contrato' ? 'salario' : 'valor', g = agG(j);
  const base = o[campo], teto = base * 1.6; let atual = base;
  const pacMax = 3 + (agNivelRep() >= 3 ? 1 : 0); let pac = pacMax; const usadas = new Set();
  const quem = tipo === 'patrocinio' ? agDiretor(null, o.marca) : agDiretor(e.clube);
  const cOvr = e.clube ? AG_CLUBES[e.clube.nivel].ovr : 50, fama = j.fama || 0;
  const titulo = tipo === 'contrato' ? `📑 ${e.renova ? 'Renovação' : 'Contrato'} de ${j.nome}` : tipo === 'transferencia' ? `💼 Transferência de ${j.nome}` : `📣 Patrocínio de ${j.nome}`;
  const valTxt = v => tipo === 'contrato' ? `${agFmt(v)} por mês (${o.anos} anos, sua comissão ${o.com}%)` : tipo === 'transferencia' ? `${agFmt(v)} tostões (sua comissão: ${agFmt(v * Math.max(5, j.comissao || 10) / 100)})` : `${agFmt(v)} tostões (sua parte: ${agFmt(v * 0.2)})`;
  const T = [
    { id: 'numeros', txt: tipo === 'patrocinio' ? `📊 Mostrar quantos seguidores ${g.ele} tem` : `📊 Mostrar os números ${g.dele} em campo`, chance: () => tipo === 'patrocinio' ? 30 + fama : 45 + (j.ovr - cOvr) * 4, sobe: [0.08, 0.14],
      ok: 'Hmm... os números são bons mesmo.', nao: 'Números eu também tenho aqui. Não me impressionou.' },
    { id: 'fama', txt: tipo === 'patrocinio' ? `⭐ ${g.Ele} é exemplo para as crianças` : '⭐ Falar do carinho da torcida', chance: () => tipo === 'patrocinio' ? 50 + fama / 2 : 25 + fama * 0.9, sobe: [0.06, 0.12],
      ok: `É verdade, todo mundo gosta ${g.dele}.`, nao: `Torcida? Pouca gente conhece ${g.ele} ainda.` },
    { id: 'blefe', txt: tipo === 'patrocinio' ? '📞 "Outra marca também quer..."' : '📞 "Tem outro clube interessado..."', sub: '🎲 se falhar, a paciência cai mais', chance: () => 30 + agNivelRep() * 9, sobe: [0.12, 0.2], pac: 2,
      ok: 'Outro?! Calma, calma... vamos melhorar essa proposta.', nao: 'Então pode ligar para eles. Eu não gosto de blefe!' },
    { id: 'parceria', txt: '🤝 Propor uma parceria de longo prazo', chance: () => 72, sobe: [0.03, 0.06], ok: 'Gosto de parceiros. Dá para melhorar um pouquinho.', nao: 'Parceria é bom, mas o orçamento está curto.' },
  ];
  if (tipo === 'contrato' && e.renova && j.pers === 'leal') T.push({ id: 'leal', txt: `❤️ "${g.Ele} ama este clube e quer ficar"`, chance: () => 80, sobe: [0.06, 0.1], ok: 'Isso é raro hoje em dia. Vou valorizar.', nao: 'Que bom... mas amor não paga as contas do clube.' });
  if (tipo === 'transferencia' && j.pers === 'ambicioso') T.push({ id: 'sonho', txt: `🌟 "Jogar aqui é o sonho ${g.dele}"`, chance: () => 60, sobe: [0.04, 0.08], ok: 'Gosto de quem chega com fome de vitória!', nao: 'Sonho é bonito, mas negócio é negócio.' });
  const abre = tipo === 'contrato' ? `Nossa proposta para ${agPrimeiro(j)}: ${agFmt(base)} por mês, ${o.anos} anos. É uma boa proposta${e.renova ? '' : ' para um jovem'}.`
    : tipo === 'transferencia' ? `Queremos ${agPrimeiro(j)} no nosso time. Oferecemos ${agFmt(base)} tostões. Proposta justa, não acha?`
    : `A ${o.marca} quer ${agPrimeiro(j)} como garot${g.o}-propaganda por 1 ano: ${agFmt(base)} tostões.`;
  const rodada = (fala, voce, d) => {
    const ultima = pac <= 0 || T.every(t => usadas.has(t.id));
    const info = el('span', {}, el('b', {}, `Oferta na mesa: ${valTxt(atual)}`), atual > base ? el('small', { class: 'agc-up' }, ` ▲ +${Math.round((atual / base - 1) * 100)}%`) : '');
    const ops = ultima ? [] : T.filter(t => !usadas.has(t.id)).map(t => ({ txt: t.txt, sub: t.sub, fn: () => argumento(t) }));
    ops.push({ txt: `✅ Aceitar: ${agFmt(atual)}`, cls: 'amarelo', fn: aceitar }, { txt: tipo === 'contrato' && e.renova ? '❌ Recusar (ele(a) fica sem clube)' : '❌ Recusar e encerrar', cls: 'cinza', fn: recusar });
    agDialogo({ titulo, quem, voce, txt: ultima ? `${fala ? fala + ' ' : ''}Essa é a minha última oferta: ${agFmt(atual)}. É pegar ou largar.` : fala, info, medidor: { rot: '⏳ Paciência do outro lado', v: pac / pacMax * 100, delta: d }, ops });
  };
  function argumento(t) {
    usadas.add(t.id); const ok = agSorte(clamp(t.chance(), 5, 92)); const antes = pac;
    if (ok) { atual = Math.min(teto, Math.round(atual * (1 + agRnd(t.sobe[0], t.sobe[1])))); pac -= 1; }
    else pac -= t.pac || 1;
    pac = Math.max(0, pac);
    rodada(ok ? `${t.ok} Posso chegar a ${agFmt(atual)}.` : t.nao, t.txt, pac - antes);
  }
  function aceitar() {
    if (e.feito) { abreAgencia('negocios'); return; }
    const v = Math.round(atual), ganhou = v / base - 1;
    if (tipo === 'contrato') agFechaContrato(j, e, { salario: v, anos: o.anos, com: o.com });
    else if (tipo === 'transferencia') agVende(j, e, v); else agPatrocinioFecha(j, e, v);
    if (ganhou >= 0.15) { agGanhaRep(5); log(`🕴️ Negociação de mestre: +${Math.round(ganhou * 100)}% sobre a primeira oferta!`, 'l-loot'); }
    if (j.pers === 'ganancioso' && tipo === 'contrato' && ganhou < 0.05) { agMoral(j, -8); agHist(j, 'queria que você negociasse mais'); }
    salvar(); abreAgencia('negocios'); agComemoraNegocio(e, j);
  }
  function recusar() {
    e.feito = true; e.resultado = 'Você recusou a proposta.';
    if (tipo === 'contrato' && e.renova) { j.fase = 'treino'; j.clube = null; j.salario = 0; agHist(j, 'ficou sem clube (não renovou)'); }
    salvar(); abreAgencia('negocios');
  }
  rodada(abre);
}

/* ---------- 4) METAS: a lista de tarefas do próximo nível ---------- */
function agMetasBox(a) {
  a = a || agDados(); const k = agNivelRep(a) + 1;
  if (!AG_REP[k]) return el('div', { class: 'ag-metas topo' }, el('b', {}, '👑 Você chegou ao topo: SUPERAGENTE!'));
  const ms = agMetas(a, k);
  return el('div', { class: 'ag-metas' }, el('b', {}, `🎯 Metas para virar ${AG_REP[k][2]} ${AG_REP[k][1]} (${ms.filter(m => m[3]).length}/${ms.length})`),
    ...ms.map(([t, v, alvo, ok]) => el('div', { class: 'ag-meta' + (ok ? ' ok' : '') }, el('span', {}, (ok ? '✅ ' : '⬜ ') + t),
      el('div', { class: 'agc-barra' }, el('i', { style: `width:${Math.round(v / alvo * 100)}%` })), el('small', {}, alvo >= 1e5 ? `${agFmt(v)}/${agFmt(alvo)}` : `${fmt(v)}/${fmt(alvo)}`))),
    el('small', { class: 'ag-libera' }, `🔓 Ao subir: ${agLibera(k)}`));
}
function agMetasMini() {
  const a = agDados(), k = agNivelRep(a) + 1; if (!AG_REP[k]) return '';
  const ms = agMetas(a, k), falta = ms.find(m => !m[3]);
  return el('button', { class: 'ag-metas-mini', type: 'button', onclick: () => abreAgencia('agencia') }, `🎯 Rumo a ${AG_REP[k][1]}: ${ms.filter(m => m[3]).length}/${ms.length} metas`, falta ? el('small', {}, ` · próxima: ${falta[0]} (${falta[2] >= 1e5 ? agFmt(falta[1]) : fmt(falta[1])}/${falta[2] >= 1e5 ? agFmt(falta[2]) : fmt(falta[2])})`) : '');
}

/* ---------- 5) O ESCRITÓRIO na Vila do Campinho ---------- */
TEMA_PAREDE.agencia = { papel: '#ece4f6', listra: '#e0d4f0', rodape: '#4a2a8a' };
NPCS.ag_secretaria = { nome: 'Dona Rosa, secretária da agência', look: AG_LOOK.secretaria, agEsc: 'secretaria', ola: 'Bem-vinda(o) à agência! Posso ajudar?' };
NPCS.ag_olheiro = { nome: 'Seu Tonho, chefe dos olheiros', look: AG_LOOK.olheiro, agEsc: 'olheiro', ola: 'Quarenta anos de várzea, craque. Eu sei onde a bola rola bonito.' };
NPCS.ag_quadro = { nome: 'Quadro de Talentos', quadro: true, agEsc: 'quadro', ola: 'Os jogadores da sua agência.' };
const AG_ESC_X = 19, AG_ESC_Y = 9, AG_ESC_PORTA = 21;
MAPAS_DEF.agencia_escritorio = function () {
  const b = interior('agencia_escritorio', 'Escritório da Agência', 13, 9, CH.PISO, 'agencia', 'vila');
  b.obj(1, 2, 'estante'); b.obj(2, 2, 'estante'); b.npc('ag_quadro', 5, 2); b.obj(8, 2, 'tv'); b.obj(11, 2, 'palmeira_vaso');
  b.obj(2, 4, 'balcao'); b.obj(3, 4, 'balcao'); b.npc('ag_secretaria', 4, 4);
  b.npc('ag_olheiro', 9, 4); b.obj(10, 4, 'mesa');
  b.obj(1, 5, 'sofa'); b.obj(1, 6, 'sofa'); b.obj(11, 7, 'vaso'); b.obj(1, 7, 'palmeira_vaso');
  agDecoraEscritorio(b.m);
  return b.m;
};
// os troféus do escritório: um a cada nível da agência (o escritório "cresce" com você)
const AG_DECOR = [[1, 3, 2, 'medalha_craque'], [2, 7, 2, 'trofeu'], [3, 10, 2, 'taca_liga'], [4, 11, 5, 'chuteira_ouro'], [5, 9, 7, 'estatua']];
function agDecoraEscritorio(m) {
  m = m || (typeof MAPAS !== 'undefined' && MAPAS.agencia_escritorio); if (!m) return;
  const k = G.save && agDados() ? agNivelRep() : 0;
  for (const [nv, x, y, t] of AG_DECOR) { const i = y * m.w + x, cur = m.obj[i]; if (nv <= k && !cur) m.obj[i] = { t, v: 0 }; else if (nv > k && cur && cur.t === t) m.obj[i] = null; }
  m._mini = null;
}
{
  const _mapaVilaAg = mapaVila;
  mapaVila = function () {
    const m = _mapaVilaAg.apply(this, arguments);
    try { // o prédio amarelo de colunas (b_sede) na rua de cima, entre a sua casa e o bazar
      const x = AG_ESC_X, y = AG_ESC_Y, w = 5, h = 4, livre = (i, j2) => !m.obj[j2 * m.w + i];
      let ok = true; for (let j2 = y; j2 < y + h; j2++) for (let i = x; i < x + w; i++) if (!livre(i, j2)) ok = false;
      if (ok) {
        for (let j2 = y; j2 < y + h; j2++) for (let i = x; i < x + w; i++) m.obj[j2 * m.w + i] = { t: 'x', v: 0, predio: true };
        m.predios.push({ spr: 'b_sede', x, y, w, h, porta: { x: AG_ESC_PORTA, y: y + h - 1 }, interior: 'agencia_escritorio' });
        m.obj[(y + h - 1) * m.w + AG_ESC_PORTA] = null;
        m.saidas.push({ x: AG_ESC_PORTA, y: y + h - 1, para: 'agencia_escritorio', porta: true });
        if (!m.obj[(y + h - 1) * m.w + x + w]) { m.obj[(y + h - 1) * m.w + x + w] = { t: 'placa', v: 0 }; m.placas.push({ x: x + w, y: y + h - 1, texto: 'LENDAS FC — AGÊNCIA DE TALENTOS. Secretária, olheiros e o Quadro de Talentos lá dentro.' }); }
      }
    } catch (e) { }
    return m;
  };
}
function agFalaSecretaria() {
  const s = G.save; if (!agLiberada()) return `Bem-vind${s && s.genero === 'f' ? 'a' : 'o'} à Lendas FC! A agência ainda está fechada: ela abre quando você chegar ao nível ${AG_NIVEL} ou zerar a Carreira e o Clube.`;
  const a = agDados(); if (!a) return 'Está tudo pronto para abrir a SUA agência! É só assinar a papelada aqui comigo.';
  const nov = a.eventos.filter(e => !e.visto).length, prop = a.eventos.filter(e => e.acoes === true && !e.feito).length, conv = a.eventos.filter(e => e.acoes === 'conversa' && !e.feito).length;
  const fam = a.achados.filter(j => j.pensa == null || j.pensa !== (a.nPer || 0)).length;
  const partes = [];
  if (nov) partes.push(`${nov} novidade(s) na agenda`); if (prop) partes.push(`${prop} proposta(s) na mesa`); if (conv) partes.push(`${conv} jogador(es) querendo conversar`); if (fam) partes.push(`${fam} família(s) esperando a sua visita`);
  const k = agNivelRep(a) + 1, falta = AG_REP[k] && agMetas(a, k).find(m => !m[3]);
  return `Bom dia, chefe! ${partes.length ? 'Hoje temos ' + partes.join(', ') + '.' : 'Tudo calmo por aqui hoje.'}${falta ? ` Para virar ${AG_REP[k][1]}, falta: ${falta[0].toLowerCase()}.` : ''}`;
}
function agFalaOlheiro() {
  if (!agLiberada() || !agDados()) return NPCS.ag_olheiro.ola + ' Quando a agência abrir, eu e meus olheiros vamos rodar o país atrás de craques.';
  const a = agDados();
  if (a.missoes.length) { const m = a.missoes[0], r = AG_REGIOES.find(x => x.id === m.regiao); return `Meu pessoal está na estrada: ${a.missoes.length} olheiro(s) viajando. O primeiro volta de ${r ? r.nome : 'viagem'} em ${Math.max(1, Math.ceil((m.fim - Date.now()) / 60000))} min.`; }
  const reg = AG_REGIOES.filter(r => agNivelRep(a) >= r.rep);
  return `Meus olheiros estão prontos! ${agPega(['Ouvi dizer que', 'Um amigo me contou que', 'Dizem por aí que'])} ${agPega(['no campinho de terra', 'na escolinha do bairro', 'num torneio de várzea', 'na quadra da escola'])} de ${agPega(reg).nome.replace(/^\S+\s/, '')} tem ${agPega(['um menino', 'uma menina'])} que joga demais. Bora?`;
}
{
  const _abrirNPCAge = abrirNPC;
  abrirNPC = function (npc) {
    const d = npc && npc.d; if (!d || !d.agEsc) return _abrirNPCAge.apply(this, arguments);
    if (d.agEsc === 'quadro') return agLiberada() && agDados() ? abreAgencia('jogadores') : abreAgencia();
    const r = _abrirNPCAge.apply(this, arguments);
    try {
      const fala = document.querySelector('#modalConteudo .fala p'); if (fala) fala.textContent = d.agEsc === 'secretaria' ? agFalaSecretaria() : agFalaOlheiro();
      const ops = document.querySelector('#modalConteudo .opcoes'), tchau = ops && [...ops.children].pop(), poe = b => tchau ? tchau.before(b) : ops && ops.append(b);
      const bt = (txt, fn, cls = '') => el('button', { class: 'btn ' + cls, type: 'button', onclick: fn }, txt);
      const a = agLiberada() && agDados();
      if (!agLiberada()) poe(bt('🔒 Como liberar a agência', () => abreAgencia(), 'amarelo'));
      else if (!a) poe(bt('🕴️ Abrir minha agência', () => abreAgencia(), 'amarelo'));
      else if (a.v === 2 && d.agEsc === 'secretaria') { // Agência 3.0 (agencia_semana.js)
        poe(bt('📅 Relatório e ações da semana', () => abreAgencia('semana'), 'amarelo'));
        poe(bt('🔁 Rotina da semana', () => abreAgencia('rotina')));
        poe(bt('🎯 Metas da agência', () => abreAgencia('agencia')));
      } else if (a.v === 2) {
        poe(bt('🔎 Olheiros e candidatos', () => abreAgencia('olheiros'), 'amarelo'));
      } else if (d.agEsc === 'secretaria') {
        const prop = a.eventos.filter(e => e.acoes === true && !e.feito).length;
        poe(bt('☀️ Agenda do dia', () => abreAgencia('hoje'), 'amarelo'));
        poe(bt(`💼 Propostas na mesa${prop ? ` (${prop})` : ''}`, () => abreAgencia('negocios')));
        poe(bt('🎯 Metas da agência', () => abreAgencia('agencia')));
      } else {
        const fam = a.achados.length;
        poe(bt('🔎 Mandar um olheiro', () => abreAgencia('talentos'), 'amarelo'));
        if (fam) poe(bt(`👪 Talentos esperando conversa (${fam})`, () => abreAgencia('talentos')));
      }
    } catch (e) { }
    return r;
  };
  const _iconeNPCAge = iconeNPC;
  iconeNPC = function (n) { const d = (n && (n.d || NPCS[n.id])) || {}; if (d.agEsc === 'secretaria') return '💼'; if (d.agEsc === 'olheiro') return '🔎'; return _iconeNPCAge.apply(this, arguments); };
  const _pertoAge = interacaoPerto;
  interacaoPerto = function () { const r = _pertoAge.apply(this, arguments); if (r && r.n && r.n.d && r.n.d.agEsc === 'quadro') r.txt = 'Ver o Quadro de Talentos'; return r; };
}

/* ---------- estilo ---------- */
{
  const st = document.createElement('style');
  st.textContent = `
  .agc { display: flex; gap: 14px; align-items: flex-start; margin: 6px 0 10px; }
  .agc-quem { display: flex; flex-direction: column; align-items: center; gap: 4px; width: 118px; flex-shrink: 0; text-align: center; }
  .agc-quem b { font-size: 12px; line-height: 1.2; }
  .agc-ret { width: 96px; height: 120px; border-radius: 50% 50% 14px 14px; border: 3px solid #c8a46a; background: radial-gradient(circle at 50% 35%, #fff6d8, #e8d4a8 70%); }
  .agc-fala { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
  .agc-voce { margin: 0; font-style: italic; opacity: .75; font-size: 13px; }
  .agc-bolha { position: relative; margin: 0; background: #fff; color: #2a1a10; border: 2px solid #c8a46a; border-radius: 14px; padding: 10px 14px; font-size: 16px; line-height: 1.4; min-height: 48px; cursor: pointer; box-shadow: 0 3px 8px rgba(0,0,0,.12); }
  .agc-bolha::before { content: ''; position: absolute; left: -11px; top: 18px; border: 9px solid transparent; border-right-color: #c8a46a; border-left: 0; }
  .agc-info { font-size: 13px; background: #fff3c8; border-radius: 10px; padding: 6px 10px; color: #4a3210; }
  .agc-med { display: flex; align-items: center; gap: 8px; }
  .agc-med small { font-weight: 700; white-space: nowrap; }
  .agc-barra { flex: 1; height: 12px; border-radius: 6px; background: #e8dcc0; overflow: hidden; border: 1px solid #c8b48a; min-width: 60px; }
  .agc-barra i { display: block; height: 100%; background: #3aa84a; transition: width .6s ease; }
  .agc-delta { font-size: 14px; animation: agcDelta 1.2s ease-out both; }
  .agc-delta.mais { color: #2a9a3a; } .agc-delta.menos { color: #d8382a; }
  @keyframes agcDelta { from { transform: translateY(8px) scale(1.6); opacity: 0; } to { transform: none; opacity: 1; } }
  .agc-up { color: #2a9a3a; font-weight: 800; }
  .agc-ops { display: flex; flex-direction: column; gap: 6px; }
  .agc-op { display: flex; flex-direction: column; align-items: flex-start; text-align: left; padding: 8px 12px; animation: agcOp .3s ease-out both; }
  .agc-op small { opacity: .8; font-size: 11.5px; font-weight: 400; }
  .agc-op.cinza { opacity: .8; }
  @keyframes agcOp { from { transform: translateX(-10px); opacity: 0; } to { transform: none; opacity: 1; } }
  .ag-metas { background: #fff8e6; border: 2px solid #d8c090; border-radius: 12px; padding: 8px 12px; display: flex; flex-direction: column; gap: 4px; margin: 6px 0; }
  .ag-meta { display: grid; grid-template-columns: 1fr 120px auto; gap: 8px; align-items: center; font-size: 13px; }
  .ag-meta.ok span { color: #2a7a3a; font-weight: 700; }
  .ag-meta .agc-barra i { background: #e0a020; } .ag-meta.ok .agc-barra i { background: #3aa84a; }
  .ag-libera { opacity: .8; }
  .ag-metas-mini { display: block; width: 100%; text-align: left; margin: 4px 0 8px; padding: 6px 10px; border-radius: 10px; border: 2px dashed #e0a000; background: #fff6d0; font: inherit; font-weight: 700; color: inherit; cursor: pointer; }
  .ag-metas-mini small { font-weight: 400; }
  .ag-fam { display: block; opacity: .85; }
  .ag-pensa { color: #8a5a10; font-weight: 700; }
  @media (max-width: 560px) {
    .agc { gap: 8px; } .agc-quem { width: 76px; } .agc-ret { width: 68px; height: 85px; } .agc-bolha { font-size: 14.5px; padding: 8px 10px; }
    .ag-meta { grid-template-columns: 1fr 70px; } .ag-meta small { display: none; }
  }
  @media (prefers-reduced-motion: reduce) { .agc-op, .agc-delta { animation: none !important; } }
  `;
  document.head.append(st);
}

/* ---------- v334: o Modo Treino também pausa a agência (agTick empurra o relógio dela) ---------- */
if (typeof alternaModoTreino === 'function') {
  const _modoTreinoAg = alternaModoTreino;
  alternaModoTreino = function () {
    try { agTick(); } catch (e) { } // fecha a conta do tempo até agora (correndo ou pausado)
    const r = _modoTreinoAg.apply(this, arguments);
    try { agTick(); if (agLiberada() && agDados()) log(G.save.treinoOn ? '🕴️ A Agência também ficou PAUSADA (olheiros e períodos param até você desligar o Modo Treino).' : '🕴️ A Agência voltou a funcionar.', 'l-sis'); } catch (e) { }
    return r;
  };
}
