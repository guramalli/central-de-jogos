/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🃏 AGÊNCIA 3.0 — ETAPA 7: EVENTOS (v342). Do documento do dono: no início de cada semana, 0 a 2 eventos entre os
   jogadores agenciados, pesados pelos traços deles (Baladeiro puxa eventos de noite, Temperamento alto puxa brigas...).
   Cada evento é uma CARTA com duas escolhas (sistema de cartas da etapa 3), com 2–3 variações de texto e os nomes do
   garoto e do familiar. Sem resposta em 4 semanas, vale o "padrão". As 14 cartas do documento + o tio que volta para
   cobrar (Etapa 4). Escolhas que custam "1 ação" usam uma ação desta semana (ou da próxima, se acabaram).
   Carregar DEPOIS de agencia_carreira.js.
   ============================================================ */
const agmFam = j => (j.fam && j.fam.nome) || 'a família', agmNome = j => agPrimeiro(j);
const agmVar = (...l) => agPega(l); // variações de texto
function agmGastaAcao(a) { if (a.acoes > 0) a.acoes--; else a.devidas = (a.devidas || 0) + 1; }
function agmRevela(j, t) { if (!j.revelados.includes(t)) j.revelados.push(t); }
const agmMuda = (j, k, n) => { if (k in j.estado) j.estado[k] = clamp(Math.round(j.estado[k] + n), 0, 100); else if (k === 'confianca') j.confianca = clamp(Math.round(j.confianca + n), 0, 100); else if (k === 'visib') j.visib = clamp(j.visib + n, 0, 100); else j.pers[k] = clamp(Math.round(j.pers[k] + n), 0, 100); };
// [id, quando(j), peso(j), título, texto(j), [escolha A: [texto, efeito(a,j)]], [B], padrão = índice]
const AGM_EVENTOS = [
  ['carro_novo', j => j.fase === 'carreira' && j.pro, j => 1 + (j.pers.ambicao > 60 ? 1 : 0), '🚗 Carro novo',
    j => agmVar(`${agmNome(j)} quer gastar o primeiro salário num carro esportivo vermelho.`, `${agmNome(j)} apareceu no treino com o catálogo de um carrão: quer comprar já!`),
    ['🔑 Deixar (Moral +15, Disciplina −5)', (a, j) => { agmMuda(j, 'moral', 15); agmMuda(j, 'disciplina', -5); return `${agmNome(j)} comprou o carro e está nas nuvens.`; }],
    ['🐷 Convencer a guardar (Moral −10, Confiança +10)', (a, j) => { agmMuda(j, 'moral', -10); agmMuda(j, 'confianca', 10); return `${agmNome(j)} guardou o dinheiro. ${agmFam(j)} adorou a sua conversa.`; }], 1],
  ['adiantamento', j => !!j.fam, j => 1 + (j.fam && j.fam.need.includes('dinheiro') ? 1 : 0), '💵 Pedido de empréstimo',
    j => agmVar(`${agmFam(j)} pediu um empréstimo de 50 mil para consertar a casa.`, `${agmFam(j)} ligou: as contas apertaram e precisam de um adiantamento de 50 mil.`),
    ['🤝 Emprestar (−50 mil, Confiança +15)', (a, j) => { if (G.save.ouro < 50000) { agmMuda(j, 'confianca', -10); return 'Faltaram tostões: a família ficou chateada.'; } G.save.ouro -= 50000; agmMuda(j, 'confianca', 15); return `${agmFam(j)} agradeceu muito.`; }],
    ['🙅 Negar (Confiança −10)', (a, j) => { agmMuda(j, 'confianca', -10); return 'A família ficou chateada.'; }], 1],
  ['agente_rival', j => true, j => 1 + (j.pers.lealdade < 40 ? 2 : 0), '😈 Agente rival',
    j => agmVar(`Um agente rival ofereceu 100 mil por fora para ${agmFam(j)} trocar de agência.`, `A Estrela Sports está rondando: ofereceu 100 mil para levar ${agmNome(j)}.`),
    ['💰 Cobrir a oferta (−100 mil)', (a, j) => { if (G.save.ouro < 100000) return AGM_EVENTOS_POR.agente_rival[6][1](a, j); G.save.ouro -= 100000; agmMuda(j, 'confianca', 5); return `Você cobriu a oferta. ${agmNome(j)} fica.`; }],
    ['❤️ Confiar na relação', (a, j) => { agmRevela(j, 'lealdade'); if (j.pers.lealdade < 40) { agmRompe(a, j); return `${agmNome(j)} (lealdade baixa) foi embora com o rival. Reputação ${AGM_REP_GANHO.rompeu}.`; } agmMuda(j, 'confianca', 5); return `${agmNome(j)} recusou o rival: "Meu empresário é você!"`; }], 1],
  ['polemica_redes', j => agmIdade(j) >= 15, j => 1 + (j.especiais.includes('baladeiro') ? 3 : 0) + (j.pers.disciplina < 35 ? 1 : 0), '📱 Polêmica nas redes',
    j => agmVar(`Um vídeo de ${agmNome(j)} numa festa viralizou e a torcida não gostou.`, `${agmNome(j)} postou um vídeo da balada de madrugada e virou assunto na internet.`),
    ['📝 Nota oficial (Visibilidade −10)', (a, j) => { agmMuda(j, 'visib', -10); return 'A nota oficial acalmou as coisas.'; }],
    ['🙈 Ignorar (30% de um patrocinador cancelar)', (a, j) => { if (j.patrocinios.length && Math.random() < 0.3) { const p = j.patrocinios.splice((Math.random() * j.patrocinios.length) | 0, 1)[0]; return `A ${p.marca} cancelou o patrocínio.`; } return 'A poeira baixou sozinha.'; }], 1],
  ['lesao_leve', j => j.estado.fadiga > 40, j => 1 + j.estado.fadiga / 40, '🤕 Lesão leve',
    j => agmVar(`${agmNome(j)} sente dores na coxa${(j.convites || []).length ? ' bem antes do teste' : ''}.`, `${agmNome(j)} terminou o treino mancando um pouco.`),
    ['⚡ Jogar assim mesmo (25% de lesão grave)', (a, j) => { if (Math.random() < 0.25) { j.lesao = Math.max(j.lesao, agRi(6, 10)); agmMuda(j, 'moral', -10); return `Lesão grave: ${j.lesao} semanas parad${agmO(j)}.`; } return 'Jogou e não sentiu nada. Ufa!'; }],
    ['🧊 Adiar (perde o próximo teste, Moral −5)', (a, j) => { j.convites = []; agmMuda(j, 'moral', -5); agmMuda(j, 'fadiga', -20); return 'Descansou. O teste vai ficar para outra vez.'; }], 1],
  ['namorada', j => agmIdade(j) >= 15, j => 1, '💌 Namoro',
    j => agmVar(`A namorada de ${agmNome(j)} quer que ${agmEle(j)} recuse clubes em outra cidade.`, `${agmNome(j)} está namorando e não quer nem ouvir falar de jogar longe.`),
    ['💞 Apoiar o relacionamento (Moral +10, Ambição −5)', (a, j) => { agmMuda(j, 'moral', 10); agmMuda(j, 'ambicao', -5); agmRevela(j, 'ambicao'); return `${agmNome(j)} ficou feliz.`; }],
    ['🗣️ Conversar sobre carreira (Moral −10)', (a, j) => { agmMuda(j, 'moral', -10); return 'A conversa foi difícil, mas foi sincera.'; }], 0],
  ['escola', j => agmIdade(j) < 18, j => 1 + (j.fam && j.fam.need.includes('estudo') ? 1 : 0), '📚 Notas baixas',
    j => agmVar(`As notas de ${agmNome(j)} caíram e ${agmFam(j)} está preocupad${j.fam && AG_PARENTES[j.fam.par] && !AG_PARENTES[j.fam.par][2] ? 'o' : 'a'}.`, `A escola chamou ${agmFam(j)}: ${agmNome(j)} está indo mal em matemática.`),
    ['📖 Pagar reforço (−30 mil, Confiança +10)', (a, j) => { if (G.save.ouro >= 30000) G.save.ouro -= 30000; agmMuda(j, 'confianca', 10); return 'O reforço funcionou: as notas voltaram a subir.'; }],
    ['⚽ Priorizar o futebol (Confiança −15)', (a, j) => { agmMuda(j, 'confianca', -15); return 'A família não gostou nada.'; }], 0],
  ['briga_treino', j => !!j.clube, j => 0.5 + j.pers.temperamento / 30, '😤 Briga no treino',
    j => agmVar(`${agmNome(j)} discutiu feio com o técnico.`, `${agmNome(j)} saiu do treino batendo a porta depois de uma bronca.`),
    ['🙇 Exigir desculpas (Temperamento −5)', (a, j) => { agmMuda(j, 'temperamento', -5); agmRevela(j, 'temperamento'); return `${agmNome(j)} pediu desculpas ao técnico.`; }],
    ['🛡️ Defender o jogador (Lealdade +10, clube −10)', (a, j) => { agmMuda(j, 'lealdade', 10); j.clubeRel = (j.clubeRel || 0) - 10; agmRevela(j, 'temperamento'); return 'O jogador agradeceu; o clube ficou de cara feia.'; }], 0],
  ['convite_idolo', j => true, j => 0.5, '🌟 Convite de ídolo',
    j => agmVar(`Um ex-craque da seleção quer ser mentor de ${agmNome(j)}.`, `Um ídolo aposentado viu ${agmNome(j)} jogar e quer ajudar.`),
    ['✅ Aceitar (Estabilidade +15, −1 ação)', (a, j) => { agmGastaAcao(a); agmMuda(j, 'estabilidade', 15); agmRevela(j, 'estabilidade'); return `${agmNome(j)} ganhou um mentor de peso.`; }],
    ['🙅 Recusar', () => 'Fica para outra vez.'], 1],
  ['saudade', j => j.clube && j.clube.longe && !j.adaptado, j => 2 + j.pers.saudade / 30, '📞 Saudade',
    j => agmVar(`${agmNome(j)} ligou chorando: quer voltar pra casa.`, `${agmNome(j)} não para de falar de casa. Está difícil longe da família.`),
    ['🚗 Visitar (−1 ação, Moral +20)', (a, j) => { agmGastaAcao(a); j.visitaSem = a.semana; agmMuda(j, 'moral', 20); return 'A visita fez toda a diferença.'; }],
    ['✈️ Mandar a família ir lá (−40 mil, Moral +15)', (a, j) => { if (G.save.ouro >= 40000) G.save.ouro -= 40000; j.visitaSem = a.semana; agmMuda(j, 'moral', 15); return `${agmFam(j)} foi visitar. Que alegria!`; }], 1],
  ['proposta_varzea', j => agmIdade(j) < 18 && j.fase === 'desenvolvimento', j => 1, '🏆 Proposta da várzea',
    j => agmVar(`Um time amador oferece 20 mil de prêmio para ${agmNome(j)} jogar a final do bairro.`, `O pessoal da várzea quer ${agmNome(j)} na final de domingo: prêmio de 20 mil!`),
    ['✅ Liberar (+20 mil, risco de lesão)', (a, j) => { G.save.ouro += 20000; if (Math.random() < 0.2) { j.lesao = Math.max(j.lesao, agRi(1, 3)); return `Ganhou o prêmio... mas se machucou (${j.lesao} sem.).`; } agmMuda(j, 'moral', 5); return `${agmNome(j)} foi o craque da final!`; }],
    ['🙅 Proibir (Moral −5)', (a, j) => { agmMuda(j, 'moral', -5); return 'Ficou chateado(a), mas entendeu.'; }], 1],
  ['imprensa', j => j.visib >= 30, j => 1, '🎤 Entrevista',
    j => agmVar(`Um repórter quer entrevistar ${agmNome(j)}.`, `A TV local quer ${agmNome(j)} no programa de esportes.`),
    ['✅ Aceitar (Visibilidade +10)', (a, j) => { agmRevela(j, 'estabilidade'); if (j.pers.estabilidade < 40 && Math.random() < 0.4) { agmMuda(j, 'visib', -5); agmMuda(j, 'moral', -5); return `Nervos${agmO(j)}, ${agmNome(j)} deu uma gafe ao vivo...`; } agmMuda(j, 'visib', 10); return 'Mandou muito bem na entrevista!'; }],
    ['🙅 Recusar', () => 'Sem entrevista desta vez.'], 1],
  ['irmao', j => !j.irmaoVisto, j => 0.5, '👦 O caçula também joga',
    j => agmVar(`${agmFam(j)} contou que o irmão mais novo de ${agmNome(j)} também joga muito.`, `${agmFam(j)}: "O caçula também é bom de bola, viu? Vem ver!"`),
    ['🔎 Mandar um olheiro (novo candidato)', (a, j) => { j.irmaoVisto = true; const ol = a.olheiros.slice().sort((x, y) => y.olho - x.olho)[0]; const c = agmNovoCandidato(a, j.regiao || 'varzea', ol || null); c.nome = c.nome.split(' ')[0] + ' ' + j.nome.split(' ').slice(-1)[0]; c.look.pele = j.look.pele;
      c.fam = { ...j.fam, sabe: { ...(j.fam.sabe || {}) }, nao: { ...(j.fam.nao || {}) }, visitas: 0, recusas: 0, voltaSem: null, confianca: Math.min(100, j.confianca) };
      c.faixa = { ...agmFaixa(c.P, (c.faixa ? c.faixa.mr : agmMargem(10)) / 2), ol: ol ? ol.id : null, olNome: ol ? ol.nome : 'a família', olho: ol ? ol.olho : 10, reobs: 1 }; a.candidatos.push(c); return `${c.nome} entrou na lista de candidatos (a família já confia em você).`; }],
    ['🙏 Agradecer (Confiança +5)', (a, j) => { j.irmaoVisto = true; agmMuda(j, 'confianca', 5); return 'A família ficou contente com a atenção.'; }], 1],
  ['tio_cobra', j => j.tioCobra != null && agDados().semana >= j.tioCobra, j => 100, '🤑 O tio voltou',
    j => `O tio de ${agmNome(j)} reapareceu: diz que "ajudou a fechar o negócio" e quer 50 mil.`,
    ['💵 Pagar (−50 mil)', (a, j) => { delete j.tioCobra; if (G.save.ouro >= 50000) G.save.ouro -= 50000; return 'O tio sumiu de novo, satisfeito.'; }],
    ['🙅 Recusar (Confiança −20)', (a, j) => { delete j.tioCobra; agmMuda(j, 'confianca', -20); return 'O tio fez um escândalo e a família ficou abalada.'; }], 1],
];
const AGM_EVENTOS_POR = Object.fromEntries(AGM_EVENTOS.map(e => [e[0], e]));
function agmRompe(a, j) { a.jogadores.splice(a.jogadores.indexOf(j), 1); a.rotina = (a.rotina || []).filter(r => r.jog !== j.id); agmGanhaRep(a, AGM_REP_GANHO.rompeu); }
// registra as cartas (o texto é sorteado na hora e guardado na carta)
for (const [id, , , titulo, , A, B, pad] of AGM_EVENTOS) {
  AGM_CARTAS['ev_' + id] = { titulo,
    txt: (a, d) => d.txt || '',
    ops: [A, B].map(([t, fn]) => [t, (a, d) => { const j = a.jogadores.find(x => x.id === d.jog); if (!j) return 'O jogador já não está na agência.'; const r = fn(a, j); agmHist(j, `${titulo}: ${r}`); return r; }]),
    padrao: (a, d) => { const j = a.jogadores.find(x => x.id === d.jog); if (!j) return 'O jogador já não está na agência.'; const r = [A, B][pad][1](a, j); agmHist(j, `${titulo}: ${r}`); return `${titulo} — ${r}`; } };
}
// toda semana: 0 a 2 eventos (um por jogador de cada vez), pesados pelos traços; e as ações devidas
AGM_GANCHOS_SEMANA.push(function (a, lin) {
  if (a.devidas) { const d = Math.min(a.devidas, a.acoes); a.acoes -= d; a.devidas -= d; }
  const ocupados = new Set((a.cartas || []).filter(c => c.tipo.startsWith('ev_')).map(c => c.dados.jog));
  // o tio cobra na hora certa
  for (const j of a.jogadores) if (!ocupados.has(j.id) && AGM_EVENTOS_POR.tio_cobra[1](j)) { agmCriaEvento(a, j, 'tio_cobra', lin); ocupados.add(j.id); }
  const r = Math.random(), n = r < 0.55 ? 0 : r < 0.9 ? 1 : 2;
  for (let k = 0; k < n; k++) {
    const opcoes = [];
    for (const j of a.jogadores) if (!ocupados.has(j.id)) for (const e of AGM_EVENTOS) if (e[0] !== 'tio_cobra' && e[1](j)) opcoes.push([j, e[0], e[2](j)]);
    const tot = opcoes.reduce((t, o) => t + o[2], 0); if (!tot) break;
    let x = Math.random() * tot; const [j, id] = opcoes.find(o => (x -= o[2]) <= 0) || opcoes[opcoes.length - 1];
    agmCriaEvento(a, j, id, lin); ocupados.add(j.id);
  }
});
function agmCriaEvento(a, j, id, lin) { const e = AGM_EVENTOS_POR[id]; agmCarta(a, 'ev_' + id, { jog: j.id, txt: e[4](j) }, lin); }
