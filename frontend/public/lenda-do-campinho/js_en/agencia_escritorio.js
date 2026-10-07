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
const agG = j => j.menina ? { o: '', ele: 'she', Ele: 'She', dele: 'her', jogador: 'player', um: 'a' } : { o: '', ele: 'he', Ele: 'He', dele: 'his', jogador: 'player', um: 'a' };
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
  mae: ['Dona', 'mom', 1, 'son', 'daughter'], pai: ['Seu', 'dad', 0, 'son', 'daughter'], avo_f: ['Dona', 'grandma', 1, 'grandson', 'granddaughter'],
  avo_m: ['Seu', 'grandpa', 0, 'grandson', 'granddaughter'], tia: ['Dona', 'aunt', 1, 'nephew', 'niece'], tio: ['Seu', 'uncle', 0, 'nephew', 'niece'] };
const AG_DESEJO_TXT = { estudo: '📚 to keep studying', dinheiro: '💰 help with the bills at home', perto: '🏠 to stay close to home', sonho: '⚽ to make the dream come true', respeito: '🤝 honesty (they’ve been fooled before)' };
function agFamilia(j) {
  if (j.fam) return j.fam;
  const par = agPega(Object.keys(AG_PARENTES)), P = AG_PARENTES[par], f = !!P[2], idoso = par.startsWith('avo');
  j.fam = { par, desejo: agPega(Object.keys(AG_DESEJO_TXT)),
    nome: `${P[0]} ${agPega(f ? ['Cida', /*pt-en*/'Rosa', 'Fátima', 'Lúcia', 'Graça', 'Márcia', 'Sônia', 'Zezé', 'Lourdes', 'Neusa'] : ['Zé', 'Antônio', 'Carlos', 'Jorge', 'Tião', 'Raimundo', 'Valdir', 'Edson', 'Nonato'])}`,
    look: { tipo: 'humano', corpo: f ? 'f' : 'm', alt: 1.7, pele: j.look.pele, cabelo: agPega(f ? ['cabelo-coque', 'cabelo-liso-longo', 'cabelo-cacheado', 'cabelo-rabo'] : ['cabelo-curto', 'cabelo-raspado', 'cabelo-cacheado']),
      corCabelo: idoso ? 'grisalho' : j.look.corCabelo, roupa: agPega(['roupa-camiseta', 'roupa-xadrez', 'roupa-moletom', 'roupa-regata']), corRoupa: agPega(['#d8603a', '#3a8ad8', '#e0b030', '#7a4ab0', '#3aa070', '#c03a5a']), baixo: f ? 'baixo-saia' : 'baixo-jeans' } };
  return j.fam;
}
function agFamTxt(j) {
  const f = j.fam; if (!f) return '';
  return `👪 ${f.nome} (${AG_PARENTES[f.par][1]})${f.sabe ? ' · wants: ' + AG_DESEJO_TXT[f.desejo] : f.falou ? ' · already talked' : ''}${j.recusas ? ' · ⚠️ already said no once' : ''}`;
}
function agDiretor(clube, marca) {
  if (marca) return { nome: `${marca} marketing manager`, look: { tipo: 'humano', corpo: 'f', alt: 1.68, pele: 'pele-clara', cabelo: 'cabelo-liso-longo', corCabelo: 'loiro', roupa: 'roupa-terno', corRoupa: '#3ac0a0', baixo: 'baixo-saia' } };
  const nomes = [['Seu Orlando', 0], ['Dona Beatriz', 1], ['Seu Rubens', 0], ['Dona Helena', 1], ['Seu Augusto', 0], ['Dona Marta', 1]];
  let h = 0; for (const c of clube.nome) h = (h * 31 + c.charCodeAt(0)) | 0;
  const [nome, f] = nomes[Math.abs(h) % nomes.length];
  return { nome: `${nome}, director${f ? '' : ''} of ${clube.nome}`, look: { tipo: 'humano', corpo: f ? 'f' : 'm', alt: 1.72, pele: ['pele-clara', 'pele-media', 'pele-morena', 'pele-negra'][Math.abs(h >> 3) % 4], cabelo: f ? 'cabelo-coque' : 'cabelo-curto', corCabelo: 'grisalho', roupa: 'roupa-terno', corRoupa: clube.cor || '#1a1a2a', baixo: f ? 'baixo-saia' : 'baixo-jeans' } };
}
const agQ = {
  jog: j => ({ nome: j.nome, look: j.look }),
  fam: j => { const f = agFamilia(j); return { nome: `${f.nome} (${AG_PARENTES[f.par][1]} of ${agPrimeiro(j)})`, look: f.look }; },
  tecnico: j => ({ nome: `Mr. Válter, coach${j.clube ? ' do ' + j.clube.nome : ' at the soccer school'}`, look: AG_LOOK.tecnico }),
  medico: () => ({ nome: 'Dr. Paulo, sports doctor', look: AG_LOOK.medico }),
  assessora: () => ({ nome: 'Lu, the agency’s press officer', look: AG_LOOK.assessora }),
};

/* ---------- a tela de conversa ---------- */
// { titulo, quem:{nome,look}, txt, voce (o que você disse), info, medidor:{rot,v,delta}, ops:[{txt, sub, fn, cls, off}] }
function agDialogo(o) {
  const ret = mkCanvas(96, 120); ret.className = 'agc-ret';
  [0, 400, 1500].forEach(ms => setTimeout(() => { try { pintaAparencia(ret, o.quem.look, { inteiro: true }); } catch (e) { } }, ms));
  const txt = o.txt || '', bolha = el('p', { class: 'agc-bolha', 'aria-label': txt, title: 'tap to see everything' });
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
    el('div', { class: 'agc-fala' }, o.voce ? el('p', { class: 'agc-voce' }, '🗨️ You: “' + o.voce.replace(/^\S+\s/, '').replace(/^["“]+|["”]+$/g, '') + '”') : '', bolha, o.info ? el('div', { class: 'agc-info' }, o.info) : '', med)), ops);
}

/* ---------- 1) CONTRATAR: a conversa com a família ---------- */
const AG_FAM_ABRE = {
  estudo: (j, g) => `Good afternoon! Look, soccer is wonderful, but in this house school comes first. ${agPrimeiro(j)} is not dropping out of school, no way, okay?`,
  dinheiro: (j, g) => `Good afternoon... Life here isn’t easy, I work all day long. If soccer can help with the bills at home, that would be a blessing.`,
  perto: (j, g) => `${g.Ele} has never slept away from home, you know? My heart aches just thinking about ${g.o === 'a' ? 'nela' : 'nele'} going so far away, so young${g.o}.`,
  sonho: (j, g) => `Ever since tiny${g.o}, ${g.ele} has slept cuddled up${g.o} with the ball! Being a ${g.jogador} is ${g.dele} biggest dream.`,
  respeito: (j, g) => `Hmm... Lots of agents have come here promising the moon. Then they all vanished. Why should I trust you?`,
};
const AG_ABORD = {
  estudo: '📚 The agency helps with school: studies and soccer go together.',
  dinheiro: '💰 The agency pays the family an allowance every month.',
  perto: '🏠 At first, practice will be right here, close to home.',
  sonho: '⚽ I see a pro future here. Let’s make this dream come true!',
  respeito: '🤝 I came from the sandlot too. I don’t promise miracles: I promise hard work and honesty.',
};
const AG_FAM_SIM = {
  estudo: f => `Oh, that makes me so much more ${f ? 'tranquila' : 'tranquilo'}! Studies and soccer, together. I like it.`,
  dinheiro: () => 'Wow... that would help us so much. Thank you so much.',
  perto: f => `Phew! Close to home, I feel much more ${f ? 'sossegada' : 'sossegado'}.`,
  sonho: () => 'That’s it! Look, the kid’s eyes are even sparkling now!',
  respeito: () => 'Finally someone who tells the truth. I like you.',
};
const AG_PERS_FALA = {
  ambicioso: 'I want to play in Europe! I want to be the best in the world and win the Ballon d’Or!',
  relaxado: 'I play because it’s fun, you know? I don’t really like pressure...',
  trabalhador: 'I train every day, even in the rain. I just need a chance.',
  ganancioso: 'And how much will I make? I want to buy my family a new house.',
  leal: 'I’d like to stay close to my friends on the team here...',
  temperamental: 'I got kicked off a team once for fighting. But the ref was the one who was wrong!',
};
const AG_PERS_FRASE = {
  ambicioso: '🌍 With training and a good head, Europe is the way!',
  relaxado: '😎 No pressure: one step at a time, enjoying the game.',
  trabalhador: '💪 Hard work always shows. With me, you’ll get your chance.',
  ganancioso: '💰 A good contract comes with good soccer. I’ll get you the best deal.',
  leal: '❤️ Your friends and the team here will always be your home.',
  temperamental: '🧘 Stars keep a cool head too. We’ll practice that together.',
};
const AG_PERS_SIM = {
  ambicioso: 'YES! Write it down: I’m gonna be the best in the world!', relaxado: 'Oh, I like that. No stress!', trabalhador: 'You can count on me. I never miss practice!',
  ganancioso: 'Oh, nice! I’ll be able to help my family.', leal: 'That’s great... my friends will be happy.', temperamental: 'Okay... I’ll try. For real.',
};
function agConversaFamilia(j) {
  const a = agDados(), s = G.save, g = agG(j), f = agFamilia(j), P = AG_PARENTES[f.par], mulher = !!P[2];
  const titulo = `💬 Talk with ${agPrimeiro(j)}’s family`, qF = agQ.fam(j), qJ = agQ.jog(j);
  const custo = Math.max(50000, Math.round(agValor(j) * 0.6)), rival = j.potV && j.potV[1] >= 85;
  let conf = 15 + agNivelRep() * 8;
  const med = d => ({ rot: '🤝 Family trust', v: conf, delta: d });
  const aindaAqui = () => a.achados.includes(j);
  // 1. a família fala primeiro: a preocupação dela aparece nas entrelinhas
  agDialogo({ titulo, quem: qF, txt: AG_FAM_ABRE[f.desejo](j, g), medidor: med(), info: rival ? '' : `You’re in the living room of ${j.nome}’s family (${j.idade} years old, ${AG_POS[j.pos][0]}). Pay close attention to what worries the family.`,
    ops: [...agOpcoes(Object.keys(AG_ABORD), f.desejo, 4).map(k => ({ txt: AG_ABORD[k], fn: () => passo2(k) })), { txt: '🚪 Better come back another time', cls: 'cinza', fn: () => abreAgencia('talentos') }] });
  function passo2(k) {
    let d, r;
    if (k === f.desejo) { d = 30; r = AG_FAM_SIM[f.desejo](mulher); f.sabe = true; }
    else if (f.desejo === 'respeito' && (k === 'dinheiro' || k === 'sonho')) { d = -10; r = 'Hmm... I’ve heard that before. Promises are easy, right?'; }
    else { d = 5; r = agPega(['Hmm... all right.', 'I see... but that’s not really what worried me.', 'Maybe. We’ll see.']); }
    conf += d; f.falou = true;
    let info = '';
    if (rival) { conf -= 12; info = `📞 The family’s phone rings: it’s Estrela Sports, a rival agency, wanting to set up a visit. There’s competition! (−12)`; }
    agDialogo({ titulo, quem: qF, voce: AG_ABORD[k], txt: r, info, medidor: med(rival ? d - 12 : d), ops: [{ txt: `▶ Talk with ${agPrimeiro(j)}`, cls: 'amarelo', fn: passo3 }] });
  }
  // 2. o garoto (a garota) entra na conversa: a personalidade aparece no jeito de falar
  function passo3() {
    agDialogo({ titulo, quem: qJ, txt: AG_PERS_FALA[j.pers], medidor: med(), info: `Personality: ${AG_PERS[j.pers].nome} — ${AG_PERS[j.pers].desc}`,
      ops: agOpcoes(Object.keys(AG_PERS_FRASE), j.pers, 4).map(k => ({ txt: AG_PERS_FRASE[k], fn: () => passo4(k) })) });
  }
  function passo4(k) {
    let d, r;
    if (k === j.pers) { d = 25; r = AG_PERS_SIM[j.pers]; }
    else if (j.pers === 'ambicioso' && k === 'relaxado') { d = -5; r = 'No pressure?! I WANT pressure! I want to be the best!'; }
    else if (j.pers === 'relaxado' && k === 'ambicioso') { d = -5; r = 'Europe?! Easy... I just want to play ball.'; }
    else if (j.pers === 'temperamental' && k === 'trabalhador') { d = -5; r = 'Nobody trains harder than me! You think I’m lazy?'; }
    else { d = 0; r = agPega(['Hmm... okay.', 'Oh... okay.', '(looks at the floor without saying a word)', 'Cool... I guess.']); }
    conf += d;
    agDialogo({ titulo, quem: qJ, voce: AG_PERS_FRASE[k], txt: r, medidor: med(d), ops: [{ txt: '▶ Make the offer', cls: 'amarelo', fn: passo5 }] });
  }
  // 3. a proposta: quanto mais generosa, mais confiança (e a família valoriza o que combina com ela)
  function passo5() {
    const pacotes = [
      ['padrao', '📄 The agency’s standard contract', custo, 0],
      ['kit', '🎁 Contract + full kit (cleats, uniform and ball)', Math.round(custo * 1.5), 12 + (f.desejo === 'sonho' ? 6 : 0)],
      ['bolsa', '🎓 Contract + scholarship and allowance', Math.round(custo * 2.2), 20 + (f.desejo === 'estudo' || f.desejo === 'dinheiro' ? 10 : 0)],
    ];
    agDialogo({ titulo, quem: qF, txt: `Very well... and what does your agency offer ${g.o === 'a' ? 'our girl' : 'our boy'}?`, medidor: med(),
      ops: [...pacotes.map(([id, txt, c, d]) => ({ txt, sub: `💰 ${agFmt(c)} coins (only paid if they accept)`, off: s.ouro < c ? `💸 ${agFmt(c - s.ouro)} coins short` : null, fn: () => passo6(id, txt, c, d) })),
        { txt: '🚪 Better come back another time', cls: 'cinza', fn: () => abreAgencia('talentos') }] });
  }
  function passo6(id, txt, c, d) {
    conf += d;
    agDialogo({ titulo, quem: qF, voce: txt, txt: `Let me go inside for a minute and see what ${g.ele} thinks...`, medidor: med(d), info: '(The more the family trusts you, the better the chance they’ll accept.)',
      ops: [{ txt: '🤞 Wait for the answer', cls: 'amarelo', fn: () => resposta(id, c) }] });
  }
  function resposta(id, c) {
    if (!aindaAqui()) { log('This talent isn’t waiting anymore.', 'l-sis'); abreAgencia('talentos'); return; }
    if (a.jogadores.length >= agMaxJogadores()) { log(`Your agency can only represent ${agMaxJogadores()} players right now.`, 'l-sis'); abreAgencia('talentos'); return; }
    const ok = agSorte(clamp(conf, 5, 95));
    if (ok && s.ouro >= c) {
      s.ouro -= c; a.achados.splice(a.achados.indexOf(j), 1); j.fase = 'treino'; agMoral(j, Math.round(conf / 4) - 10);
      agHist(j, `signed with your agency${id === 'bolsa' ? ' (with a scholarship)' : id === 'kit' ? ' (got a full kit)' : ''}`);
      a.jogadores.push(j); agGanhaRep(6 + Math.max(0, j.pot - 75)); agMarco('assinados');
      log(`✍️ ${j.nome} is now represented${g.o} by ${a.nome}!`, 'l-loot'); som('moeda'); salvar();
      agDialogo({ titulo: `✍️ ${j.nome} signed with ${a.nome}!`, quem: qJ, txt: agPega(['YAAAY! You can count on me, I’ll give it my all!', 'For real?! I’m going pro! Thank you' + g.o + '!', 'Thanks! I promise you won’t regret it!']),
        info: `${qF.nome.split(' (')[0]}: “Take good care of ${g.dele} future, okay?”`, ops: [{ txt: '👤 See my players', cls: 'amarelo', fn: () => abreAgencia('jogadores') }] });
      return;
    }
    j.recusas = (j.recusas || 0) + 1;
    if (j.recusas >= 2) {
      a.achados.splice(a.achados.indexOf(j), 1); salvar();
      agDialogo({ titulo: '❌ Not this time', quem: qF, txt: `Sorry... We thought hard about it and decided to go with another agency. But thank you${mulher ? '' : ''} for the visit.`,
        info: `${j.nome} is no longer on your list. Tip: pay attention to what the family and the kid say — each one wants to hear something different.`, ops: [{ txt: '↩ Back to the agency', fn: () => abreAgencia('talentos') }] });
      return;
    }
    j.pensa = a.nPer || 0; salvar();
    agDialogo({ titulo: '⏳ The family will think about it', quem: qF, txt: 'We’re still not sure... Let’s think it over calmly. Come back in a few months?',
      info: `You can try again next period (a second no and ${g.ele} goes to another agency). ${f.sabe ? '' : 'Tip: what could this family be worried about?'}`, ops: [{ txt: '↩ Back to the agency', fn: () => abreAgencia('talentos') }] });
  }
}

/* ---------- 2) PROBLEMAS: conversas em 2 etapas ---------- */
// cada opção devolve { prox: etapa } ou { fala, res, bom|ruim, quem?, cena? }
const AG_CONVERSAS = {
  falta: {
    titulo: 'Skipping practice', quando: () => true,
    txt: j => `🚨 ${j.nome} skipped three practices in a row and the coach is mad.`,
    abre: j => ({ quem: agQ.tecnico(j), fala: `Hey, agent, ${agPrimeiro(j)} skipped THREE practices this week! If this keeps up, it’s the bench. Fix this!`, ops: [
      { txt: '👂 Talk calmly and listen to what’s going on', fn: j => ({ prox: agFaltaMotivo(j) }) },
      { txt: '📢 Give a firm scolding', fn: j => agTem(j, 'trabalhador', 'ambicioso') ? (agMoral(j, -2), { fala: 'Sorry... you’re right. Tomorrow I’ll get there before everyone else.', res: 'Took the scolding seriously and went back to practice.', bom: 1 })
        : agTem(j, 'temperamental') ? (agMoral(j, -20), agSorte(50) && (j.parado += 1), { fala: 'Nobody understands me! All you do is yell!', res: 'Blew up at the scolding and got even worse.', ruim: 1 })
        : agSorte(60) ? (agMoral(j, -6), { fala: 'Fine, fine... I’ll go back.', res: 'Went back to practice, a bit upset.' }) : (agMoral(j, -12), { fala: '...', res: 'Felt hurt by the scolding.', ruim: 1 }) },
      { txt: '🙈 Let it go', fn: j => agSorte(50) ? (j.parado += 2, agMoral(j, -10), { fala: '(skipped another whole week)', res: 'It got worse: 2 periods with no progress.', ruim: 1 }) : { fala: '(went back to practice alone, without a word)', res: 'This time it worked out...' } },
    ] }),
  },
  redes: {
    titulo: 'Social media mess', quando: j => j.idade >= 15,
    txt: j => `📱 ${j.nome} posted a video making fun of the rival team and the fans got mad.`,
    abre: j => ({ quem: agQ.assessora(), fala: `Boss, the video of${agG(j).o} ${agPrimeiro(j)} making fun of the rival went viral... and not in a good way. The rival fans are furious in the comments!`, ops: [
      { txt: '📝 Help write a sincere apology', fn: j => { j.fama = (j.fama || 0) + 2; return { quem: agQ.jog(j), fala: 'I didn’t mean to hurt anyone... I said sorry and even the rival captain replied nicely.', res: 'The apology got praised. Everybody makes mistakes!', bom: 1 }; } },
      { txt: '😂 Film a video joking about the situation', sub: '🎲 risky', fn: j => agSorte(40 + (j.fama || 0) / 2) ? (j.fama = (j.fama || 0) + 8, { fala: 'It turned into a good meme! Even the rival fans laughed.', res: 'The joke worked: fame went up.', bom: 1 })
        : (j.fama = Math.max(0, (j.fama || 0) - 8), { fala: 'Uh-oh... it got worse. Now TWO sets of fans are mad.', res: 'The joke backfired: fame went down.', ruim: 1 }) },
      { txt: '🔇 Ask the kid to stay off social media for a week', fn: j => agTem(j, 'temperamental', 'ganancioso') ? (agMoral(j, -10), { quem: agQ.jog(j), fala: 'A week WITHOUT my phone?! That’s a punishment!', res: 'Obeyed, but sulking.' })
        : (agMoral(j, -2), { quem: agQ.jog(j), fala: 'Okay. I’ll use the time to train more.', res: 'Stayed off social media and things calmed down.', bom: 1 }) },
      { txt: '🙈 Let it slide', fn: j => agSorte(50) ? (j.fama = Math.max(0, (j.fama || 0) - 10), { fala: 'The mess grew and even made the newspaper...', res: 'It looked bad: fame went down.', ruim: 1 }) : { fala: 'By the next day, everyone had forgotten.', res: 'It blew over on its own.' } },
    ] }),
  },
  saudade: {
    titulo: 'Homesick', quando: j => j.idade < 21,
    txt: j => `🏠 ${j.nome} misses the family a lot.`,
    abre: j => ({ quem: agQ.jog(j), fala: `I miss home so much... ${AG_PARENTES[agFamilia(j).par][2] ? 'my ' : 'my '}${AG_PARENTES[agFamilia(j).par][1]}’s cooking, my friends. I think I want to go back...`, ops: [
      { txt: '✈️ Bring the family over for a visit', custo: j => agCusto(j, 2), fn: j => (agMoral(j, 22), { quem: agQ.fam(j), fala: `We missed you so much, ${agPrimeiro(j)}! Look how much you’ve grown!`, res: 'The family came to visit. The smile is back!', bom: 1, cena: 'saudade' }) },
      { txt: '📞 Set up a video call every Sunday', fn: j => agTem(j, 'leal', 'relaxado', 'trabalhador') ? (agMoral(j, 10), { fala: 'Every Sunday? Deal! I’m already happier.', res: 'The Sunday calls became a tradition.', bom: 1 }) : (agMoral(j, 4), { fala: 'It helps a little... but it’s not the same.', res: 'A little better.' }) },
      { txt: '🏠 Let the kid spend a week at home', fn: j => (agMoral(j, 15), j.parado += 1, { fala: 'For real?! Thank you' + agG(j).o + '! I’ll come back with full energy!', res: 'No more homesickness (missed 1 period of training).', bom: 1 }) },
      { txt: '💪 "Stars have to be tough, hang in there"', fn: j => agTem(j, 'trabalhador') ? (agMoral(j, -3), { fala: 'Yeah... you’re right. I’ll focus on training.', res: 'Pushed through the homesickness.' }) : (agMoral(j, -15), { fala: '(stayed silent, eyes full of tears)', res: 'Got very sad at the answer.', ruim: 1 }) },
    ] }),
  },
  lesao: {
    titulo: 'Practice injury', quando: () => true,
    txt: j => `🤕 ${j.nome} felt pain in the thigh during practice.`,
    abre: j => ({ quem: agQ.medico(), fala: `It’s a minor thigh injury. With rest, about 2 periods out${agG(j).o}. But there are other options... it’s your call.`, ops: [
      { txt: '🏥 Full physical therapy', custo: j => agCusto(j, 1.5), fn: j => ({ fala: 'With physical therapy, recovery will be super quick. Light training can start already!', res: 'Quick recovery, already training!', bom: 1 }) },
      { txt: '🧊 Rest and ice, no rush', fn: j => (j.parado += 2, agTem(j, 'ambicioso', 'trabalhador') && agMoral(j, -5), { fala: 'A responsible choice. An athlete’s body needs care.', res: 'Will be out for 2 periods, but no risk.', bom: 1 }) },
      { txt: '⚡ Let them play the weekend final', sub: '⚠️ risky', fn: j => agSorte(35) ? (j.fama = (j.fama || 0) + 6, { fala: 'Played... and shined! But it was luck. Don’t do that again.', res: 'Played the final and did well, but it was a big scare.' })
        : (j.parado += 4, agMoral(j, -10), { fala: 'I warned you... the injury got worse. Now it’s 4 periods of recovery.', res: 'The injury got worse: 4 periods out.', ruim: 1 }) },
    ] }),
  },
  aumento: {
    titulo: 'Raise request', quando: j => j.fase === 'pro' && !j.meuClube && (j.pers === 'ganancioso' || Math.random() < 0.3),
    txt: j => `💰 ${j.nome} wants a raise at ${j.clube.nome}.`,
    abre: j => ({ quem: agQ.jog(j), fala: 'I found out a teammate makes twice as much as me! And I play better than him. I want a raise!', ops: [
      { txt: '📊 Go to the club to negotiate the raise', fn: j => ({ prox: { quem: agDiretor(j.clube), fala: `A raise? The contract for${agG(j).o} ${agPrimeiro(j)} was signed just recently...`, ops: [
        { txt: `📈 Show ${agG(j).dele} stats`, fn: j => agSorte(45 + (j.ovr - AG_CLUBES[j.clube.nivel].ovr) * 5) ? (j.salario = Math.round(j.salario * 1.2), agMoral(j, 10), { fala: 'The numbers don’t lie. All right: a 20% raise.', res: `20% raise: salary is now ${agFmt(j.salario)}/month.`, bom: 1 })
          : (agMoral(j, -5), { fala: 'Good numbers, but not enough yet. Maybe next season.', res: 'The club wasn’t convinced.' }) },
        { txt: '🤝 Propose a smaller raise + a bonus per goal', fn: j => agSorte(75) ? (j.salario = Math.round(j.salario * 1.1), agMoral(j, 6), { fala: 'That works for both sides. Deal!', res: `10% raise + bonus: salary ${agFmt(j.salario)}/month.`, bom: 1 }) : (agMoral(j, -4), { fala: 'Not even that, sorry. The budget is tight.', res: 'The club turned down even the small raise.' }) },
        { txt: '🚪 "No raise, and the kid walks!"', sub: '🎲 risky', fn: j => agSorte(30 + agNivelRep() * 8) ? (j.salario = Math.round(j.salario * 1.3), agMoral(j, 12), { fala: 'Easy, easy! Nobody’s leaving. A 30% raise, how’s that?', res: `30% raise: salary ${agFmt(j.salario)}/month!`, bom: 1 })
          : (agMoral(j, -10), { fala: 'Threats don’t work here. The door is open.', res: 'The club didn’t like the threat.', ruim: 1 }) },
      ] } }) },
      { txt: '⏳ Ask for patience until the end of the season', fn: j => agTem(j, 'ganancioso') ? (agMoral(j, -12), { fala: 'Patience, patience... always the same old story!', res: 'Agreed to wait, reluctantly.', ruim: 1 }) : (agMoral(j, -4), { fala: 'Okay, I’ll wait. But don’t forget, huh!', res: 'Agreed to wait.' }) },
      { txt: '🎯 "Show it on the field: play well and the raise will come"', fn: j => agTem(j, 'ambicioso', 'trabalhador') ? (agMoral(j, 4), { fala: 'Challenge accepted! I’m gonna light up the field!', res: 'Took on the challenge and got motivated.', bom: 1 }) : agTem(j, 'ganancioso') ? (agMoral(j, -15), { fala: 'I ALREADY play well! Are you my agent or the club’s?', res: 'Got mad at the answer.', ruim: 1 }) : (agMoral(j, -5), { fala: 'Hmm... okay.', res: 'Didn’t like it much.' }) },
    ] }),
  },
  escola: {
    titulo: 'School grades', quando: j => j.idade < 18,
    txt: j => `📚 ${j.nome}’s school called: the grades dropped.`,
    abre: j => ({ quem: agQ.fam(j), fala: `The school called about${agG(j).o} ${agPrimeiro(j)}: the grades dropped a lot! I always said school comes first...`, ops: [
      { txt: '📚 Pay for a private tutor', custo: j => agCusto(j), fn: j => (agMoral(j, 5), { fala: 'With the tutor, the grades are already going up! Thank you so much!', res: 'The grades are going up again!', bom: 1 }) },
      { txt: '⚽ Make a deal: good grades = more time for soccer', fn: j => agTem(j, 'trabalhador', 'leal', 'ambicioso') || agSorte(65) ? (agMoral(j, 6), { quem: agQ.jog(j), fala: 'Deal! I’ll get good grades so I can play more!', res: 'The deal worked: grades and soccer both on track.', bom: 1 }) : (agMoral(j, -2), { quem: agQ.jog(j), fala: 'Aw, but math is really hard...', res: 'School is still tough.' }) },
      { txt: '🙈 "Soccer is what matters"', fn: j => (agMoral(j, -5), { fala: 'What?! I can’t believe I heard that from you.', res: 'The family got upset with you.', ruim: 1 }) },
    ] }),
  },
  banco: {
    titulo: 'Stuck on the bench', quando: j => j.fase === 'pro' || j.fase === 'base',
    txt: j => `🪑 ${j.nome} is complaining about always sitting on the bench.`,
    abre: j => ({ quem: agQ.jog(j), fala: 'The coach left me on the bench again! I train so hard... it’s not fair!', ops: [
      { txt: '🎥 Watch game videos together and find what to improve', fn: j => { agMoral(j, 6); agTreinoFoco(j); return { fala: 'Wow, I hadn’t even noticed that! I’ll practice exactly that part.', res: 'Found what to improve together: got a little better!', bom: 1 }; } },
      { txt: '📞 Call the coach', fn: j => agSorte(50) ? (j.fama = (j.fama || 0) + 4, agMoral(j, 8), { quem: agQ.tecnico(j), fala: 'All right, I’ll give the kid a chance next game. Make the most of it!', res: 'Got a chance as a starter and did well!', bom: 1 }) : (agMoral(j, -6), { quem: agQ.tecnico(j), fala: 'I’m the one who picks the lineup, agent.', res: 'The coach didn’t like the call.' }) },
      { txt: '😌 "Be patient: your chance will come"', fn: j => agTem(j, 'relaxado', 'leal', 'trabalhador') ? (agMoral(j, 2), { fala: 'Yeah... I’ll keep training hard.', res: 'Kept working hard, waiting for a chance.' }) : (agMoral(j, -10), { fala: 'I’ve been patient way too long!', res: 'Got frustrated.', ruim: 1 }) },
    ] }),
  },
};
function agFaltaMotivo(j) {
  const m = j.pers === 'temperamental' ? 'briga' : j.pers === 'relaxado' ? 'game' : agPega(['escola', 'game', 'cansaco']);
  const q = agQ.jog(j);
  if (m === 'briga') return { quem: q, fala: 'The coach yelled at me in front of everyone! I’m not going back until he says sorry!', ops: [
    { txt: '🤝 Set up a talk with both of them, with you in the middle', fn: j => agSorte(j.pers === 'temperamental' ? 60 : 75) ? (agMoral(j, 12), { fala: 'We talked and everything’s fine now. He even praised me afterward!', res: 'Made peace with the coach.', bom: 1 }) : (agMoral(j, -3), { fala: 'We talked... but I’m still upset.', res: 'Back to practice, but the mood isn’t great.' }) },
    { txt: '😠 "The coach is right, end of story"', fn: j => j.pers === 'temperamental' ? (agMoral(j, -20), j.parado += 1, { fala: 'You too?! Then I’m REALLY not going back!', res: 'Blew up and missed 1 period of training.', ruim: 1 }) : (agMoral(j, -8), { fala: 'Okay... I’ll go back.', res: 'Went back, reluctantly.' }) },
    { txt: '🧊 "Rest today and come back tomorrow with a cool head"', fn: j => (agMoral(j, 5), { fala: 'Yeah... I guess I overreacted a little too.', res: 'Cooled off and came back the next day.', bom: 1 }) },
  ] };
  if (m === 'game') return { quem: q, fala: 'Well... I was playing video games late into the night and overslept. Sorry...', ops: [
    { txt: '⏰ Set a bedtime, with an alarm clock', fn: j => agTem(j, 'relaxado') && !agSorte(70) ? (agMoral(j, -2), { fala: 'Hmm... I’ll try, but it’s hard.', res: 'Still oversleeps once in a while.' }) : (agMoral(j, 5), { fala: 'Deal! I’ll never oversleep again.', res: 'Built the habit of going to bed early.', bom: 1 }) },
    { txt: '📵 Put the video game away for a month', fn: j => agTem(j, 'temperamental', 'ganancioso') ? (agMoral(j, -15), { fala: 'A WHOLE MONTH?! That’s not fair!', res: 'Got mad, but stopped skipping.', ruim: 1 }) : (agMoral(j, -5), { fala: 'Okay... I understand.', res: 'Stopped skipping.', bom: 1 }) },
    { txt: '🏆 "No missed practices all month, and you get the new soccer game"', custo: j => agCusto(j, 0.5), fn: j => (agMoral(j, 10), { fala: 'Deal! Go ahead and buy it, I won’t miss a single day!', res: 'Never missed again and got the new game.', bom: 1 }) },
  ] };
  if (m === 'escola') return { quem: q, fala: 'It’s just that I have tests at school and there wasn’t time to study and train...', ops: [
    { txt: '📚 Pay for a private tutor', custo: j => agCusto(j), fn: j => (agMoral(j, 12), { fala: 'With the tutor, I managed to do it all! I got good grades!', res: 'School and training on track.', bom: 1 }) },
    { txt: '📅 Make a study and training schedule together', fn: j => agTem(j, 'trabalhador', 'leal') || agSorte(70) ? (agMoral(j, 6), { fala: 'That makes it way easier to stay organized!', res: 'The schedule worked.', bom: 1 }) : (agMoral(j, -2), { fala: 'Even with the schedule, it’s tough...', res: 'Still hard to balance.' }) },
    { txt: '⚽ "Training is more important than tests"', fn: j => (agMoral(j, -5), { quem: agQ.fam(j), fala: 'EXCUSE ME?! School comes first in this house!', res: 'The family got mad at you.', ruim: 1 }) },
  ] };
  return { quem: q, fala: 'I’m so tired' + agG(j).o + '... practice in the morning, practice in the afternoon, school... I can’t take it anymore.', ops: [
    { txt: '🛌 Ask the club for a week of rest', fn: j => (agMoral(j, 10), { fala: 'I rested and came back at full speed!', res: 'Came back refreshed.', bom: 1 }) },
    { txt: '🥗 Hire a nutritionist', custo: j => agCusto(j), fn: j => (agMoral(j, 8), { fala: 'Eating right, my energy is back!', res: 'With the right food, the energy came back.', bom: 1 }) },
    { txt: '💪 "Being tired is just whining"', fn: j => (agMoral(j, -12), agSorte(40) && (j.parado += 2), { fala: '...', res: 'Still exhausted and discouraged.', ruim: 1 }) },
  ] };
}
// "achar o que melhorar": +1 em dois atributos (dentro do limite do potencial)
function agTreinoFoco(j) {
  const k = Object.keys(AG_ATR); for (let i = 0; i < 2; i++) { const at = agPega(k); j.atr[at] = Math.min(clamp(j.pot + 3, 20, 99), j.atr[at] + 1); }
  j.ovr = Math.min(j.pot, agOvr(j));
}
function agConversaProblema(e) {
  const j = agJog(e.jog), C = AG_CONVERSAS[e.conv];
  if (!j || !C) { e.feito = true; e.resultado = '✔ solved'; salvar(); abreAgencia('hoje'); return; }
  const titulo = `💬 ${C.titulo} — ${j.nome}`;
  const mostra = (etapa, voce) => agDialogo({ titulo, quem: etapa.quem, txt: etapa.fala, voce, info: voce ? '' : `${AG_PERS[j.pers].nome} · morale ${Math.round(j.moral)}`,
    ops: etapa.ops.map(op => { const custo = op.custo ? op.custo(j) : 0; return { txt: op.txt, sub: custo ? `💰 ${agFmt(custo)} coins` : op.sub, off: custo && G.save.ouro < custo ? `💸 ${agFmt(custo - G.save.ouro)} coins short` : null,
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
    if (dm) efeitos.push(`${dm > 0 ? '😊' : '😟'} moral ${dm > 0 ? '+' : ''}${dm}`); if (df) efeitos.push(`⭐ fame ${df > 0 ? '+' : ''}${df}`);
    if (dp > 0) efeitos.push(`🤕 ${dp} period(s) out`); if (dv > 0) efeitos.push(`📈 overall +${dv}`);
    e.feito = true; e.resultado = `${r.bom ? '👍' : r.ruim ? '👎' : '➖'} ${r.res}`; agHist(j, r.res);
    if (r.bom) { agGanhaRep(5); agMarco('bons'); }
    salvar();
    agDialogo({ titulo: r.bom ? '👍 Well handled!' : r.ruim ? '👎 That didn’t go too well...' : '➖ Resolved', quem: r.quem || quem, voce, txt: r.fala,
      info: el('span', {}, el('b', {}, r.res), efeitos.length ? el('small', {}, ' · ' + efeitos.join(' · ')) : '', r.bom ? el('small', {}, ' · 🎯 +1 problem well handled (agency goal)') : ''),
      ops: [{ txt: '↩ Back to the agency', cls: 'amarelo', fn: () => abreAgencia('hoje') }] });
    if (r.cena) agFila(r.cena, '🏠 The family is here!', `${j.nome} got a visit from the family and is smiling again.`, 'confete');
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
  const titulo = tipo === 'contrato' ? `📑 ${e.renova ? 'Renewal' : 'Contract'}: ${j.nome}` : tipo === 'transferencia' ? `💼 Transfer: ${j.nome}` : `📣 Sponsorship: ${j.nome}`;
  const valTxt = v => tipo === 'contrato' ? `${agFmt(v)} per month (${o.anos} years, your commission ${o.com}%)` : tipo === 'transferencia' ? `${agFmt(v)} coins (your commission: ${agFmt(v * Math.max(5, j.comissao || 10) / 100)})` : `${agFmt(v)} coins (your share: ${agFmt(v * 0.2)})`;
  const T = [
    { id: 'numeros', txt: tipo === 'patrocinio' ? `📊 Show how many followers ${g.ele} has` : `📊 Show ${g.dele} stats on the field`, chance: () => tipo === 'patrocinio' ? 30 + fama : 45 + (j.ovr - cOvr) * 4, sobe: [0.08, 0.14],
      ok: 'Hmm... the numbers really are good.', nao: 'I’ve got numbers here too. Not impressed.' },
    { id: 'fama', txt: tipo === 'patrocinio' ? `⭐ ${g.Ele} is a role model for kids` : '⭐ Talk about how much the fans love the kid', chance: () => tipo === 'patrocinio' ? 50 + fama / 2 : 25 + fama * 0.9, sobe: [0.06, 0.12],
      ok: `It’s true, everyone loves ${g.dele} way of playing.`, nao: `Fans? Hardly anyone knows who ${g.ele} is yet.` },
    { id: 'blefe', txt: tipo === 'patrocinio' ? '📞 "Another brand wants in too..."' : '📞 "There’s another club interested..."', sub: '🎲 if it fails, patience drops more', chance: () => 30 + agNivelRep() * 9, sobe: [0.12, 0.2], pac: 2,
      ok: 'Another one?! Easy, easy... let’s improve this offer.', nao: 'Then go ahead and call them. I don’t like bluffs!' },
    { id: 'parceria', txt: '🤝 Propose a long-term partnership', chance: () => 72, sobe: [0.03, 0.06], ok: 'I like partners. I can improve it a little.', nao: 'A partnership is nice, but the budget is short.' },
  ];
  if (tipo === 'contrato' && e.renova && j.pers === 'leal') T.push({ id: 'leal', txt: `❤️ "${g.Ele} loves this club and wants to stay"`, chance: () => 80, sobe: [0.06, 0.1], ok: 'That’s rare these days. I’ll take it into account.', nao: 'That’s nice... but love doesn’t pay the club’s bills.' });
  if (tipo === 'transferencia' && j.pers === 'ambicioso') T.push({ id: 'sonho', txt: `🌟 "Playing here is ${g.dele} dream"`, chance: () => 60, sobe: [0.04, 0.08], ok: 'I like players who come in hungry to win!', nao: 'Dreams are nice, but business is business.' });
  const abre = tipo === 'contrato' ? `Our offer for ${agPrimeiro(j)}: ${agFmt(base)} per month, ${o.anos} years. It’s a good offer${e.renova ? '' : ' for a young player'}.`
    : tipo === 'transferencia' ? `We want ${agPrimeiro(j)} on our team. We’re offering ${agFmt(base)} coins. A fair offer, don’t you think?`
    : `${o.marca} wants ${agPrimeiro(j)} as a brand ambassador${g.o} for 1 year: ${agFmt(base)} coins.`;
  const rodada = (fala, voce, d) => {
    const ultima = pac <= 0 || T.every(t => usadas.has(t.id));
    const info = el('span', {}, el('b', {}, `Offer on the table: ${valTxt(atual)}`), atual > base ? el('small', { class: 'agc-up' }, ` ▲ +${Math.round((atual / base - 1) * 100)}%`) : '');
    const ops = ultima ? [] : T.filter(t => !usadas.has(t.id)).map(t => ({ txt: t.txt, sub: t.sub, fn: () => argumento(t) }));
    ops.push({ txt: `✅ Accept: ${agFmt(atual)}`, cls: 'amarelo', fn: aceitar }, { txt: tipo === 'contrato' && e.renova ? '❌ Turn it down (the player stays without a club)' : '❌ Turn it down and end', cls: 'cinza', fn: recusar });
    agDialogo({ titulo, quem, voce, txt: ultima ? `${fala ? fala + ' ' : ''}This is my final offer: ${agFmt(atual)}. Take it or leave it.` : fala, info, medidor: { rot: '⏳ The other side’s patience', v: pac / pacMax * 100, delta: d }, ops });
  };
  function argumento(t) {
    usadas.add(t.id); const ok = agSorte(clamp(t.chance(), 5, 92)); const antes = pac;
    if (ok) { atual = Math.min(teto, Math.round(atual * (1 + agRnd(t.sobe[0], t.sobe[1])))); pac -= 1; }
    else pac -= t.pac || 1;
    pac = Math.max(0, pac);
    rodada(ok ? `${t.ok} I can go up to ${agFmt(atual)}.` : t.nao, t.txt, pac - antes);
  }
  function aceitar() {
    if (e.feito) { abreAgencia('negocios'); return; }
    const v = Math.round(atual), ganhou = v / base - 1;
    if (tipo === 'contrato') agFechaContrato(j, e, { salario: v, anos: o.anos, com: o.com });
    else if (tipo === 'transferencia') agVende(j, e, v); else agPatrocinioFecha(j, e, v);
    if (ganhou >= 0.15) { agGanhaRep(5); log(`🕴️ Master negotiator: +${Math.round(ganhou * 100)}% over the first offer!`, 'l-loot'); }
    if (j.pers === 'ganancioso' && tipo === 'contrato' && ganhou < 0.05) { agMoral(j, -8); agHist(j, 'wanted you to negotiate more'); }
    salvar(); abreAgencia('negocios'); agComemoraNegocio(e, j);
  }
  function recusar() {
    e.feito = true; e.resultado = 'You turned down the offer.';
    if (tipo === 'contrato' && e.renova) { j.fase = 'treino'; j.clube = null; j.salario = 0; agHist(j, 'was left without a club (didn\'t renew)'); }
    salvar(); abreAgencia('negocios');
  }
  rodada(abre);
}

/* ---------- 4) METAS: a lista de tarefas do próximo nível ---------- */
function agMetasBox(a) {
  a = a || agDados(); const k = agNivelRep(a) + 1;
  if (!AG_REP[k]) return el('div', { class: 'ag-metas topo' }, el('b', {}, '👑 You reached the top: SUPER AGENT!'));
  const ms = agMetas(a, k);
  return el('div', { class: 'ag-metas' }, el('b', {}, `🎯 Goals to become ${AG_REP[k][2]} ${AG_REP[k][1]} (${ms.filter(m => m[3]).length}/${ms.length})`),
    ...ms.map(([t, v, alvo, ok]) => el('div', { class: 'ag-meta' + (ok ? ' ok' : '') }, el('span', {}, (ok ? '✅ ' : '⬜ ') + t),
      el('div', { class: 'agc-barra' }, el('i', { style: `width:${Math.round(v / alvo * 100)}%` })), el('small', {}, alvo >= 1e5 ? `${agFmt(v)}/${agFmt(alvo)}` : `${fmt(v)}/${fmt(alvo)}`))),
    el('small', { class: 'ag-libera' }, `🔓 When you level up: ${agLibera(k)}`));
}
function agMetasMini() {
  const a = agDados(), k = agNivelRep(a) + 1; if (!AG_REP[k]) return '';
  const ms = agMetas(a, k), falta = ms.find(m => !m[3]);
  return el('button', { class: 'ag-metas-mini', type: 'button', onclick: () => abreAgencia('agencia') }, `🎯 Road to ${AG_REP[k][1]}: ${ms.filter(m => m[3]).length}/${ms.length} goals`, falta ? el('small', {}, ` · next: ${falta[0]} (${falta[2] >= 1e5 ? agFmt(falta[1]) : fmt(falta[1])}/${falta[2] >= 1e5 ? agFmt(falta[2]) : fmt(falta[2])})`) : '');
}

/* ---------- 5) O ESCRITÓRIO na Vila do Campinho ---------- */
TEMA_PAREDE.agencia = { papel: '#ece4f6', listra: '#e0d4f0', rodape: '#4a2a8a' };
NPCS.ag_secretaria = { nome: 'Dona Rosa, the agency’s secretary', look: AG_LOOK.secretaria, agEsc: 'secretaria', ola: 'Welcome to the agency! Can I help you?' };
NPCS.ag_olheiro = { nome: 'Seu Tonho, head scout', look: AG_LOOK.olheiro, agEsc: 'olheiro', ola: 'Forty years of sandlot soccer, ace. I know where the good players are.' };
NPCS.ag_quadro = { nome: 'Talent Board', quadro: true, agEsc: 'quadro', ola: 'Your agency’s players.' };
const AG_ESC_X = 19, AG_ESC_Y = 9, AG_ESC_PORTA = 21;
MAPAS_DEF.agencia_escritorio = function () {
  const b = interior('agencia_escritorio', 'Agency Office', 13, 9, CH.PISO, 'agencia', 'vila');
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
        if (!m.obj[(y + h - 1) * m.w + x + w]) { m.obj[(y + h - 1) * m.w + x + w] = { t: 'placa', v: 0 }; m.placas.push({ x: x + w, y: y + h - 1, texto: 'LENDAS FC — TALENT AGENCY. Secretary, scouts and the Talent Board inside.' }); }
      }
    } catch (e) { }
    return m;
  };
}
function agFalaSecretaria() {
  const s = G.save; if (!agLiberada()) return `Welcome${s && s.genero === 'f' ? '' : ''} to Lendas FC! The agency is still closed: it opens when you reach level ${AG_NIVEL} or finish Career and Club.`;
  const a = agDados(); if (!a) return 'Everything’s ready to open YOUR agency! Just sign the paperwork here with me.';
  const nov = a.eventos.filter(e => !e.visto).length, prop = a.eventos.filter(e => e.acoes === true && !e.feito).length, conv = a.eventos.filter(e => e.acoes === 'conversa' && !e.feito).length;
  const fam = a.achados.filter(j => j.pensa == null || j.pensa !== (a.nPer || 0)).length;
  const partes = [];
  if (nov) partes.push(`${nov} new item(s) on the schedule`); if (prop) partes.push(`${prop} offer(s) on the table`); if (conv) partes.push(`${conv} player(s) wanting to talk`); if (fam) partes.push(`${fam} family(ies) waiting for your visit`);
  const k = agNivelRep(a) + 1, falta = AG_REP[k] && agMetas(a, k).find(m => !m[3]);
  return `Good morning, boss! ${partes.length ? 'Today we have ' + partes.join(', ') + '.' : 'All quiet around here today.'}${falta ? ` To become ${AG_REP[k][1]}, you still need: ${falta[0].toLowerCase()}.` : ''}`;
}
function agFalaOlheiro() {
  if (!agLiberada() || !agDados()) return NPCS.ag_olheiro.ola + ' When the agency opens, my scouts and I will travel the country looking for stars.';
  const a = agDados();
  if (a.missoes.length) { const m = a.missoes[0], r = AG_REGIOES.find(x => x.id === m.regiao); return `My crew is on the road: ${a.missoes.length} scout(s) traveling. The first one gets back from ${r ? r.nome : 'viagem'} in ${Math.max(1, Math.ceil((m.fim - Date.now()) / 60000))} min.`; }
  const reg = AG_REGIOES.filter(r => agNivelRep(a) >= r.rep);
  return `My scouts are ready! ${agPega(['I heard that', 'A friend told me that', 'Word is that'])} ${agPega(['on a dirt pitch', 'at the neighborhood soccer school', 'at a sandlot tournament', 'on the school court'])} in ${agPega(reg).nome.replace(/^\S+\s/, '')} there’s ${agPega(['a boy', 'a girl'])} who plays like a pro. Shall we go?`;
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
      if (!agLiberada()) poe(bt('🔒 How to unlock the agency', () => abreAgencia(), 'amarelo'));
      else if (!a) poe(bt('🕴️ Open my agency', () => abreAgencia(), 'amarelo'));
      else if (a.v === 2 && d.agEsc === 'secretaria') { // Agência 3.0 (agencia_semana.js)
        poe(bt('📅 Weekly report and actions', () => abreAgencia('semana'), 'amarelo'));
        poe(bt('🔁 Weekly routine', () => abreAgencia('rotina')));
        poe(bt('🎯 Agency goals', () => abreAgencia('agencia')));
      } else if (a.v === 2) {
        poe(bt('🔎 Scouts and prospects', () => abreAgencia('olheiros'), 'amarelo'));
      } else if (d.agEsc === 'secretaria') {
        const prop = a.eventos.filter(e => e.acoes === true && !e.feito).length;
        poe(bt('☀️ Today’s schedule', () => abreAgencia('hoje'), 'amarelo'));
        poe(bt(`💼 Offers on the table${prop ? ` (${prop})` : ''}`, () => abreAgencia('negocios')));
        poe(bt('🎯 Agency goals', () => abreAgencia('agencia')));
      } else {
        const fam = a.achados.length;
        poe(bt('🔎 Send a scout', () => abreAgencia('talentos'), 'amarelo'));
        if (fam) poe(bt(`👪 Talents waiting to talk (${fam})`, () => abreAgencia('talentos')));
      }
    } catch (e) { }
    return r;
  };
  const _iconeNPCAge = iconeNPC;
  iconeNPC = function (n) { const d = (n && (n.d || NPCS[n.id])) || {}; if (d.agEsc === 'secretaria') return '💼'; if (d.agEsc === 'olheiro') return '🔎'; return _iconeNPCAge.apply(this, arguments); };
  const _pertoAge = interacaoPerto;
  interacaoPerto = function () { const r = _pertoAge.apply(this, arguments); if (r && r.n && r.n.d && r.n.d.agEsc === 'quadro') r.txt = 'See the Talent Board'; return r; };
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
    try { agTick(); if (agLiberada() && agDados()) log(G.save.treinoOn ? '🕴️ The Agency is PAUSED too (scouts and periods stop until you turn off Training Mode).' : '🕴️ The Agency is running again.', 'l-sis'); } catch (e) { }
    return r;
  };
}
