// Jocelino — cartao.js — o cartão da família (13/10: "o jogo precisa ter um norte e a pessoa saber o porquê de cada coisa").
// Como é no Stardew: o HUD não tem lista de missões; o norte é a fazenda do avô e o Centro Comunitário, e o diário fica num
// botão. Aqui (divergência pequena e de propósito, o jogador pediu um norte): um cartão discreto no canto com a META DA
// FAMÍLIA (a casa própria no terreno do Tio Juca: primeiro aprender o ofício, depois juntar etapa por etapa) e uma linha
// "Agora" com uma sugestão só e o porquê. O quadro de tarefas fica só com o trabalho na mão (as linhas com `mapa`, no mapa
// delas); os avisos (sem `mapa`) disputam o "Agora" e ficam todos na Caderneta.

// A meta da família: { titulo, texto, feito, meta }.
function metaFamilia() {
  if (!G.obra) return null;
  // (C20) Da carta do Moreira em diante, a meta da família é a firma (o capital, os marcos que faltam, a inauguração, a firma aberta).
  { const fm = typeof Firma !== 'undefined' ? Firma.metaFamilia() : null; if (fm) return fm; }
  // (roteiro de 13/10) Antes da casa, o sonho da Rosa: a entrada da lojinha.
  if (G.lojinha && G.lojinha.conversou && !G.lojinha.comprada) return { titulo: 'A lojinha da Rosa', texto: `A lojinha da Rosa: a entrada de Cr$ ${ECO.lojinha.entrada} (a fachada amarela, na Vila)`, feito: Math.min(Math.max(0, G.dinheiro), ECO.lojinha.entrada), meta: ECO.lojinha.entrada };
  const casa = G.casa || {};
  if (casa.mudou) {
    const f = typeof Obra !== 'undefined' ? Obra.falta() : null;
    if (f) { const r = REQUISITOS_FUNCAO[G.obra.funcao + 1], meta = r.obras + r.alvenaria + r.empreitas, falta = f.obras + f.alvenaria + f.empreitas;
      return { titulo: 'A família na casa nova', texto: `Crescer no ofício: ${FUNCOES[G.obra.funcao + 1]} (${faltaFuncao(f)})`, feito: meta - falta, meta }; }
    return { titulo: 'A família na casa nova', texto: 'A casa está de pé. Agora é crescer: a pensão da Rosa, a firma, a Vila.', feito: 1, meta: 1 };
  }
  // (revisão) Meio-oficial e a carta da casa ainda na caixa (ou por chegar): o próximo passo é ler a carta.
  if (!casa.aberta && G.obra.funcao >= 1) return { titulo: 'A casa da família', texto: 'Meio-oficial! Chegou a hora da casa: a carta do Tio Juca está na caixa de correio, no quintal', feito: 1, meta: 1 };
  if (casa.aberta) {
    // (revisão 3) A etapa já paga (em obra ou pronta: o dinheiro sai ao começar) não pede mais dinheiro: a meta passa para a seguinte.
    const c = casaEtapas(), E = c.juntar, din = E ? Math.min(Math.max(0, G.dinheiro), E.dinheiro) : 1;
    if (c.emObra) return { titulo: 'A casa da família', texto: E ? `${c.atual.nome} em obra (plaquinha no terreno do quintal); a próxima, ${E.nome}: Cr$ ${E.dinheiro} e o material` : `${c.atual.nome} em obra: a última etapa, depois é a mudança`, feito: din, meta: E ? E.dinheiro : 1 };
    return { titulo: 'A casa da família', texto: `${E.nome}: Cr$ ${E.dinheiro} e o material (plaquinha no terreno do quintal)`, feito: din, meta: E.dinheiro };
  }
  const f = Obra.falta(1), r = REQUISITOS_FUNCAO[1];
  const meta = r.obras + r.alvenaria + r.empreitas, falta = f ? f.obras + f.alvenaria + f.empreitas : 0;
  return { titulo: 'A casa da família', texto: `Para começar a casa: virar meio-oficial na obra do Bira (${f && falta ? faltaFuncao(f) : 'fale com o Bira!'})`, feito: meta - falta, meta };
}
// A casa nova, etapa por etapa (as empreitas casa_fam_N): a etapa da vez (a primeira não entregue), o estado dela e a etapa a juntar —
// a mesma enquanto reservada; a seguinte (ou nenhuma) quando a da vez já foi paga, em obra ou pronta (empreitas.js: comecar).
function casaEtapas() {
  if (!G.casa || !G.casa.aberta || G.casa.mudou) return null;
  const L = ECO.casa.etapas, k = Math.min(G.casa.etapa || 0, L.length - 1), id = 'casa_fam_' + (k + 1);
  const a = G.empreitas && G.empreitas.aceitas[id], estado = a ? a.estado : 'reservada', emObra = estado === 'obra' || estado === 'pronta' || estado === 'entregue';
  return { k, id, a, estado, atual: L[k], emObra, juntar: emObra ? L[k + 1] || null : L[k] };
}
const faltaFuncao = f => { const p = [f.obras ? `entregar ${f.obras} obra${f.obras > 1 ? 's' : ''}` : '', f.alvenaria ? `subir ${f.alvenaria} ${f.alvenaria > 1 ? 'níveis' : 'nível'} de Alvenaria` : '', f.empreitas ? `fazer ${f.empreitas} serviço(s) do quadro` : ''].filter(Boolean); return p.length ? 'falta: ' + p.join(', ') : 'pronto'; };
// A barrinha sob o relógio e a linha do resumo da noite (dia cheio, Frente A: "tem uma meta para comprar uma garrafa térmica mas eu
// não faço ideia o porquê"). Como é no Stardew: a meta de dinheiro é a que o jogo mostra com o porquê (a mochila maior na vitrine
// do Pierre). Aqui, a meta da família em dinheiro: a entrada da lojinha; o item do Bazar que o jogador escolheu no "Juntar para"
// (com o efeito); a etapa da casa nova; com a pensão aberta, a melhoria do salão ao alcance. Antes disso (a primeira diária), nada.
// → { tipo, curto (a barrinha estreita), texto (o resumo), feito, meta } ou null.
// (tarefa 7, o robô jogador) Dentro do salão aberto (noSalao) a barrinha é a do restaurante (a melhoria ao alcance), como no Dave: lá dentro
// não aparece a casa nova nem o Bazar.
// (C13, 16/10; a solução 7 do teste crítico C. O B, dias 5, 9, 10 e ~40: "a meta embaixo do relógio pulou sozinha para a próxima
// melhoria e tirou a casa da vista") A META NÃO TROCA SOZINHA. O "Juntar para" escolhido no Bazar fica até ser comprado. Sem escolha,
// a ordem é a casa nova, depois a melhoria do salão. E a melhoria da vez fica fixa (G.metaBarra.melhoria) até ser comprada: a estrela
// nova que abre uma melhoria mais barata não pula a barrinha para ela. Antes de tudo, da conversa da Rosa até a compra, a entrada da
// lojinha. No salão aberto, a do restaurante (a melhoria fixa), como no Dave.
INICIADORES.push(s => { G.metaBarra = Object.assign({}, s.metaBarra || {}); });
COLETORES.push(s => { s.metaBarra = Object.assign({}, G.metaBarra || {}); });
// A melhoria da vez para a barrinha: a fixa enquanto não for comprada (e ainda à venda); senão a mais barata ao alcance, que fica fixa.
function melhoriaDaBarrinha(p) {
  if (!p || p.estado !== 'aberta' || typeof MELHORIAS === 'undefined') return null;
  const vale = id => { const x = MELHORIAS[id]; return !!x && !p.melhorias.includes(id) && p.grau() >= x.grau && !x.premio; };
  const mb = G.metaBarra = G.metaBarra || {};
  if (!mb.melhoria || !vale(mb.melhoria)) {
    const m = Object.keys(MELHORIAS).filter(vale).sort((a, c) => MELHORIAS[a].preco - MELHORIAS[c].preco)[0];
    mb.melhoria = m || '';
  }
  return mb.melhoria ? Object.assign({ id: mb.melhoria }, MELHORIAS[mb.melhoria]) : null;
}
function metaDaBarrinha(noSalao) {
  const mil = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'), f = m => Math.max(0, Math.min(G.dinheiro, m)), de = m => `${mil(f(m))}/${mil(m)}`;
  const lj = typeof Lojinha !== 'undefined' && !noSalao ? Lojinha.metaDinheiro() : null;
  if (lj) return { tipo: 'lojinha', curto: lj.curto, texto: `${lj.texto} de entrada (a fachada amarela, na Vila)`, feito: lj.feito, meta: lj.meta };
  const b = typeof Bazar !== 'undefined' && G.bazar && !noSalao ? Bazar.metaEscolhida() : null;
  // (C20, 17/10; a C19: "a meta do capital tem de aparecer desde o prédio, senão o jogador real paga depois") O capital da firma é a
  // prioridade da barrinha da carta do Moreira até o pagamento, também no salão. Só o "Juntar para" escolhido DEPOIS da carta (que
  // limpa a escolha de antes: firma.js) passa na frente, até ser comprado (C13: a meta não troca sozinha).
  const fm = typeof Firma !== 'undefined' ? Firma.metaBarrinha() : null;
  if (fm && !b) return fm;
  if (b) return { tipo: 'bazar', curto: `${b.nome}: ${b.curto} — ${de(b.preco)}`, texto: `Juntando para: ${b.nome} (${b.curto}) — Cr$ ${de(b.preco)}`, feito: f(b.preco), meta: b.preco };
  if (!noSalao) { const c = casaEtapas(), E = c && c.juntar;   // (revisão 3: a etapa em obra já foi paga; a barrinha junta para a seguinte, ou some)
    if (E) return { tipo: 'casa', curto: `Casa nova, ${E.nome}: Cr$ ${de(E.dinheiro)}`, texto: `${c.emObra ? `A casa nova: ${c.atual.nome} em obra; juntando para a próxima, ${E.nome}` : `A casa nova (${E.nome})`}: Cr$ ${de(E.dinheiro)} e o material, na plaquinha do terreno`, feito: f(E.dinheiro), meta: E.dinheiro }; }
  const m = melhoriaDaBarrinha(G.pensao);
  if (m) return { tipo: 'melhoria', curto: `${m.nome}, para o salão: ${de(m.preco)}`, texto: `Juntando para o salão da pensão: ${m.nome} — Cr$ ${de(m.preco)}`, feito: f(m.preco), meta: m.preco };
  // (o Bazar sem escolha continua fora da barrinha: a decisão do dono no dia cheio, Frente A, e a s21; ele entra pelo "Juntar para")
  return null;
}
// (C3, 16/10; o teste crítico: o Agora e a seta mandaram ao Bazar às 8h e ao depósito às 6h20, antes de abrirem) O lugar do alvo
// fechado agora: o depósito do Seu Ananias e a Mercearia (8h–17h, loja.js) e o Bazar do Salim (9h–17h, menos no domingo, bazar.js).
// Devolve a frase "O Bazar do Salim abre às 9h" (ou '' com o lugar aberto, ou sem lugar com horário). Como no Stardew: o Pierre
// fechado diz o horário na porta, e o jogo não manda ninguém para lá antes da hora. A seta pula o alvo fechado (guia_setas.js).
function lugarFechado(a) {
  if (!a) return '';
  if ((a.objeto === 'deposito' || a.mercearia) && typeof depositoFechado === 'function' && depositoFechado())
    return `O depósito do Seu Ananias abre ${G.minutos >= DEPOSITO_HORARIO.fecha ? 'amanhã ' : ''}às ${DEPOSITO_HORARIO.abre / 60}h`;
  if (a.objeto === 'balcao_bazar' && typeof Bazar !== 'undefined' && !Bazar.aberto(G.dia, G.minutos)) {
    const sem = (G.dia - 1) % 7, tarde = G.minutos >= 17 * 60;
    return `O Bazar do Salim abre ${sem === 6 || (sem === 5 && tarde) ? 'na segunda, ' : tarde ? 'amanhã ' : ''}às 9h`;
  }
  return '';
}
const alvoAberto = a => !lugarFechado(a);
// A linha do trabalho na mão (o quadro) vale no mapa dela; 'pensao' vale no salão e na cozinha.
// (revisão: o que é da pensão aberta — as ★ da Rosa, o VIP, o concurso — aparece também na Vila, onde ela fica)
const noMapaDaLinha = t => !!t.mapa && (t.mapa === G.mapaId || (t.mapa === 'pensao' && (/^pensao/.test(G.mapaId || '') || G.mapaId === 'vila')));
// O "Agora": a obra pela metade fora da Vila; a carta do guia; o passo do guia em palavras de gente; o serviço aceito em
// outro mapa; o primeiro aviso; uma ideia da Caderneta (que o clique transforma em seta: agoraFamilia.ideia).
function agoraFamilia(avisos = []) {
  agoraFamilia.ideia = null; agoraFamilia.tarde = ''; agoraFamilia.convite = null; agoraFamilia.novidade = null;
  // (C10, 16/10; a C9: a linha "Janta na Pensão da Rosa às 17h" tomava o Agora desde as 7h e a tarde ficava sem nada) O lembrete da janta
  // só a partir das 16h (a hora em que a seta também passa a ir para a pensão, guia_setas.js); antes, o Agora fica para o convite da
  // tarde, a novidade do dia ou a ideia.
  if (G.minutos < JANTA_NO_AGORA) avisos = avisos.filter(t => !t.lembrete);
  // (13/10) A aula de cada ferramenta, no quintal: o Agora diz o mesmo que a seta (a fala do Tio Juca).
  { const sa = typeof setaAgora === 'function' && G.mapaId === 'quintal' ? setaAgora() : null; if (sa && sa.missao === 'aula' && sa.aula) return 'Aula do Tio Juca: ' + sa.aula.fala; }
  const l = G.obra && typeof listaDeHoje === 'function' ? listaDeHoje() : null;
  if (l && !l.paga && !l.fechado && G.mapaId !== 'vila' && typeof Obra !== 'undefined' && !Obra.aberta(G.dia, G.minutos)) {
    // (C2, 16/10) a tarefa que falta e onde ("Falta: 10 pedras do quintal (picareta) → entregar ao Bira"), e não "faltam 1 tarefa(s)"
    const falta = typeof faltaDaObra === 'function' ? faltaDaObra(l) : '';
    return falta ? `A obra do Bira (Cr$ ${Obra.diaria()} o dia) — ${falta}` : 'A lista da obra está completa: receba a diária com o Bira';
  }
  const g = G.guia;
  if (g && g.ativo && G.correio) for (const id of g.abertas) { const m = Guia.missao(id); if (m && m.carta && G.correio.caixa.includes(m.carta)) return `Chegou carta de ${m.quem}: a caixa de correio, no quintal`; }
  // (revisão) O que é só de hoje (o VIP, a festa, o concurso, o viajante, a ferramenta pronta, a promoção) passa na frente do guia.
  // (C7, 16/10) Das 14h às 17h, a despensa curta para a janta de hoje (o que a Mercearia vende): a linha da Rosa, urgente, na frente dos
  // outros urgentes (a Mercearia fecha às 17h e a janta abre logo depois); a seta vai na Mercearia (guia_setas.js).
  // (rodada 2) Como a linha da Mercearia lá embaixo: só quando a seta é a da Mercearia (ou não há seta). Com a obra do Bira, a reforma
  // ou a janta na frente, a seta fica nelas e o Agora também (a Rosa já avisou pela fala).
  { const uj = typeof urgenteDaJanta === 'function' ? urgenteDaJanta() : null, sa = uj && typeof setaAgora === 'function' ? setaAgora() : null;
    if (uj && (!sa || sa.missao === 'mercearia')) return uj.texto; }
  const urg = avisos.find(t => t.urgente); if (urg) return urg.texto;
  // (onda final, o robô #26: o Agora diz o mesmo que a seta) a seta de um serviço aceito ou da obra do dia, aqui no mapa de agora: o
  // Agora segue a seta (antes dizia "Obra: falar com o Mestre Bira" com a seta em "entregar a obra (Muro da divisa)")
  { const sa = typeof setaAgora === 'function' ? setaAgora() : null;
    if (sa && sa.tipo === 'alvo' && sa.mapa === G.mapaId && sa.rotulo) {
      // (14/10) a seta do serviço fica no lugar dele todo dia; depois das 17h (a noite livre) o Dormir segue valendo (revisão 3, abaixo)
      if (sa.missao === 'servico' && !(G.empreitas && typeof tardeLivre === 'function' && tardeLivre() === 'noite')) { const E = sa.empreita && typeof dadosEmpreita === 'function' ? dadosEmpreita(sa.empreita) : null; return `O serviço aceito, aqui mesmo${E ? ': ' + E.nome : ''} — ${sa.rotulo}`; }
      if (sa.missao === 'obra_dia') return `A obra do Mestre Bira (Cr$ ${Obra.diaria()} o dia) — ${sa.rotulo}`;
      // (15/10, T4) a seta da 1ª vez do recado: o Agora diz de quem é
      // (revisão da T4: à noite, a janta manda) depois das 17h, nunca o recado (a janta ou o Dormir)
      if (sa.missao === 'recado' && sa.recado && typeof PEDIDOS_VILA !== 'undefined' && G.minutos < TARDE_FIM && tardeLivre() !== 'noite') { const c = PEDIDOS_VILA[sa.recado].cliente; return `O recado ${RECADO_ARTIGO[c] === 'a' ? 'da' : 'do'} ${Recados.nome(c)} — ${sa.rotulo}`; } } }
  // (C8, 16/10) O convite da tarde (conviteDaTarde, mais abaixo): num dia de janta, depois da obra (ou das 13h), o que falta no cardápio
  // de hoje, com o valor na janta. É "de hoje", como o urgente da despensa: vem antes das missões do guia, e com a mesma regra da C7 (o
  // Agora diz o mesmo que a seta): só com a seta nele (a 1ª vez), na ideia acesa pelo clique, ou sem seta. O clique acende a seta.
  // (C9; a revisão da C8) As setas de "sem nenhuma outra seta" do fim do guiaSetaMundo — o 1º achado, a árvore da mata, a serra, a
  // plaquinha da casa sem o dinheiro — cedem ao convite (guia_setas.js): sem elas, o Agora e a seta dizem a mesma coisa. Antes o Agora
  // dizia "peixe" e a seta apontava a árvore.
  { const c = conviteDaTarde(), sa = c && typeof setaAgora === 'function' ? setaAgora() : null;
    if (c && (!sa || sa.missao === 'convite' || (sa.missao === 'caderneta' && G.setaFixa === IDEIA_DIA))) { agoraFamilia.ideia = IDEIA_DIA; agoraFamilia.convite = c; marcaConvite(c); return c.texto; } }
  // (o Agora diz o mesmo que a seta: o passo cujo lugar é o mapa de agora vem primeiro)
  // (C3, 16/10) A meta que a seta segue (a fixa, guia_setas.js) vem primeiro; depois as outras, na ordem de prioridade da seta.
  const sm = typeof setaAgora === 'function' ? setaAgora() : null, daSeta = sm && g && g.abertas.includes(sm.missao) ? [sm.missao] : [];
  let fechado = '', lugar = '';   // (C3) a linha de um lugar fechado agora: "O Bazar do Salim abre às 9h — ...", se nada mais vier
  if (g && g.ativo && typeof _missoesDaSeta === 'function') for (const id of daSeta.concat(_missoesDaSeta())) {
    const m = Guia.missao(id); if (!m) continue;
    // (revisão) Não mandar para o que está fechado agora: a obra fora do horário (domingo, chuva, depois das 17h), a janta sem pensão.
    if (id === 'obra' && typeof Obra !== 'undefined' && Obra.aberta(G.dia, G.minutos)) continue;
    if (id === 'janta' && typeof pensaoAbreHoje === 'function' && !pensaoAbreHoje()) continue;
    // (revisão final) A reforma de hoje já foi (o material todo e o dia trabalhado): a pensão cede, e vem o que o dia ainda tem.
    if (id === 'pensao' && G.pensao && G.pensao.feitaHoje && G.pensao.feitaHoje(G.dia)) continue;
    const txt = typeof m.agora === 'function' ? m.agora() : (m.agora || m.texto);
    // (C3; o teste crítico: o Agora mandou ao Bazar às 8h e ao depósito às 6h20) o lugar fechado: sem seta, e o Agora mostra a próxima
    // coisa; a linha "abre às Nh" fica para quando nada mais vier
    { const f = lugarFechado(typeof _alvoDaMissao === 'function' ? _alvoDaMissao(id) : null); if (f) { if (!fechado) { fechado = `${f} — ${txt}`; lugar = f; } continue; } }
    return txt + (m.meta ? ` (${Guia.progresso(m)}/${m.meta})` : '');
  }
  // (revisão 3) Depois das 17h, sem nada mais (a noite livre), o Dormir vale mesmo com serviço aceito; e o serviço curto aceito no mapa
  // de agora também aparece no Agora (antes só o de outro mapa).
  // (revisão da T4: à noite, a janta manda) depois das 17h com a janta por fazer, o serviço aceito também cede
  if (G.empreitas && tardeLivre() !== 'noite' && !(G.minutos >= TARDE_FIM && jantaPorFazer())) for (const cid of Object.keys(G.empreitas.aceitas)) { const E = dadosEmpreita(cid), a = G.empreitas.aceitas[cid];
    if (E && E.mapa !== G.mapaId && !(typeof E.familia === 'string' && a.estado === 'reservada') && !(typeof casaSemDinheiro === 'function' && casaSemDinheiro(E, a))) return `O serviço aceito: ${E.nome} (${typeof ondeFica === 'function' ? ondeFica(E.mapa) : E.mapa})`;   // (tarefa 7: a etapa da casa sem o dinheiro dela não é "o serviço aceito")
    if (E && E.mapa === G.mapaId && E.tipo === 'curta') return `O serviço aceito, aqui mesmo: ${E.nome} (a seta mostra onde)`; }
  // (16/10, o gasto por prato) O cardápio da janta de hoje pede o que a despensa não tem: a Mercearia (a seta vai junto, guia_setas.js).
  // (rodada 1) Só quando a seta é a da Mercearia (ou não há seta): o Mostrar da Caderneta, as missões e os serviços vêm antes, nos dois.
  { const cj = typeof compraDaJanta === 'function' ? compraDaJanta() : null, sj = cj && typeof setaAgora === 'function' ? setaAgora() : null;
    if (cj && lugarFechado({ mercearia: true })) { if (!fechado) { lugar = lugarFechado({ mercearia: true }); fechado = `${lugar} — ${cj.texto}`; } }
    else if (cj && (!sj || sj.missao === 'mercearia')) return cj.texto; }
  // (C7; a revisão da C3: às 6h30 o Agora mostrava só o aviso, sem o "abre às 8h") o aviso leva junto o horário do lugar fechado
  if (avisos.length) return avisos[0].texto + (lugar ? ` · ${lugar}` : '');
  // (C10) A novidade do dia (a carta lida hoje que trouxe algo novo), sem seta: só quando nenhuma seta aponta outra coisa.
  { const n = novidadeDoDia(); if (n && !(typeof setaAgora === 'function' && setaAgora())) { agoraFamilia.novidade = n; return n.texto; } }
  if (fechado) return fechado;
  // (13/10) Dia vazio: uma sugestão só, com o porquê (a seta é a linha 'ideia_dia', ver Caderneta.linha mais abaixo). Na tarde livre
  // (teste de 13/10: o serviço do dia feito, o quadro vazio), ela diz como ganhar dinheiro até o fim da tarde, ou de dormir.
  const d = ideiaDoDia();
  if (d) { agoraFamilia.ideia = IDEIA_DIA; agoraFamilia.tarde = tardeLivre(); if (d.convite) { agoraFamilia.convite = d; marcaConvite(d); } return d.texto; }
  const i = typeof Caderneta !== 'undefined' ? Caderneta.ideias(1)[0] : null;
  if (i) { agoraFamilia.ideia = i.id; return i.texto; }
  return 'Dia livre: a horta, o quintal, a pesca, os bicos. Você escolhe.';
}
// Com o dia vazio (sem urgente, sem passo do guia, sem a obra por fazer): uma sugestão só, com o porquê (roteiro de 13/10:
// "se não está fazendo nada, ele pode cuidar da lavoura, da família, criar mais espaço para plantio, continuar a casa nova...
// você tem que estar jogando por alguma meta, nunca por nada"). Como é no Stardew: não há lista de missões; o mundo mostra o que
// fazer (a horta pronta, o mato, a casa) e o jogador escolhe. Aqui, uma só, no formato "Texto — o porquê", que o clique no Agora
// transforma em seta. Sorteio fixo no dia (G.dia % n): amanhã a sugestão é outra.
const IDEIA_DIA = 'ideia_dia';
// (C10, 16/10) O lembrete "Janta na Pensão da Rosa às 17h" (pensao_tela.js) só entra no Agora a partir das 16h.
const JANTA_NO_AGORA = 16 * 60;
// (C10, 16/10; o teste crítico: do dia 6 ao 18 nada novo aparecia, e o que chegava não dizia para que servia) A NOVIDADE DO DIA: a carta
// lida hoje que trouxe algo novo, em uma linha com o porquê, até as 16h (depois, a janta). Como o Stardew: a carta do Willy diz "vem
// pescar" e a da mãe "mandei biscoitos"; o jogo não vira lista de tarefas — é uma linha só, sem seta, e some no dia seguinte. As cartas
// do guia (a pesca, o Bazar, a pedreira, o Grêmio, a mina) já viram a missão no Agora; aqui ficam as outras.
const NO_DIA = d => { const k = (d - 1) % 7; return (k >= 5 ? 'No ' : 'Na ') + ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'][k]; };   // (no sábado, na quarta)
const NOVIDADE_CARTA = {
  zefa_1000: () => 'As cocadas da Dona Zefa, de Aracaju — estão na mochila: botão direito na barra, +40 de energia e mais sorte hoje',
  zefa_5000: () => 'O queijo coalho e a farinha da Dona Zefa estão na despensa da pensão — viram prato na janta da Rosa',
  pai_15000: () => 'Cr$ 500 do pé-de-meia do seu pai — é para o tijolo da casa da família',
  fama_2: () => 'A primeira estrela da Pensão da Rosa — cabe mais um prato no quadro de giz: mais freguês, mais dinheiro',
  lourival_serra: () => 'A Mata da Serra abriu — do outro lado da ponte da mata: a trilha da Cachoeira Grande, e o rio dá tabarana',
  prefeitura_abre: () => 'A Prefeitura abriu o quadro dela, ao lado do Mercado — uma obra pública por semana, com prazo de 7 dias e pagamento em dia',
};
function novidadeDoDia() {
  const c = G.correio, n = c && c.novidade; if (!n || n.dia !== G.dia || G.minutos >= JANTA_NO_AGORA) return null;
  const f = NOVIDADE_CARTA[n.id]; if (f) return { texto: f() };
  if (/^fama_\d$/.test(n.id)) return { texto: 'A Pensão da Rosa subiu de estrela — a Dona Cotinha escreveu: a fama traz mais freguês à noite' };
  // o VIP e a festa da agenda (eventos.js): o dia, o prato e o porquê de encher a despensa antes
  const e = G.pensao && (G.pensao.agenda || []).find(x => !x.fim && (x.tipo === 'vip' ? 'vip_' : 'festa_') + (x.avisado || x.dia - 1) === n.id);
  if (!e || !Pratos.PRATOS[e.prato]) return null;
  const prato = Pratos.PRATOS[e.prato].nome;
  return e.tipo === 'vip' ? { texto: `${NO_DIA(e.dia)} janta ${vipDe(e.id).nome}: quer ${prato} — servido, dá prêmio e curtidas: encha a despensa antes` }
    : { texto: `${NO_DIA(e.dia)} é a ${e.nome} — ${prato} vale 50% mais e vem mais gente: encha a despensa antes` };
}
// (C1, 16/10) A frase diz quantas etapas faltam (a de agora conta) e que a Rosa abre no dia em que a pintura ficar pronta.
function tocarReforma() {
  const p = G.pensao, k = p ? ECO.reforma.findIndex(e => e.id === p.estado) : -1, n = k < 0 ? ECO.reforma.length : ECO.reforma.length - k;
  return { texto: `A reforma da pensão — falta${n > 1 ? 'm' : ''} ${n} etapa${n > 1 ? 's' : ''}: a Rosa abre o restaurante no dia em que a pintura ficar pronta`, alvo: { mapa: 'vila', objeto: 'pensao' } };
}
// A reforma de hoje pendente: limpar o salão, ou a etapa com o material todo entregue e o dia de hoje ainda não trabalhado.
function reformaDoDia() {
  const p = G.pensao; if (!p || !(p.estado === 'limpar' || ECO.reforma.some(e => e.id === p.estado))) return null;
  if (p.estado !== 'limpar' && (Object.keys(p.faltaMaterial()).length || p.feitaHoje(G.dia))) return null;
  return tocarReforma();
}
// (revisão 3) A casa nova de hoje: a etapa reservada com o material e o dinheiro na mão (começar), em obra com o trabalho de hoje por
// fazer (sem a chuva impedir), ou pronta para entregar. A seta vai na plaquinha do terreno.
function casaDoDia() {
  const c = casaEtapas(); if (!c || !c.a || typeof dadosEmpreita !== 'function') return null;
  const E = dadosEmpreita(c.id), alvo = { mapa: 'quintal', objeto: 'emp_placa_' + c.id }, nome = c.atual.nome; if (!E) return null;
  if (c.estado === 'reservada') { const mat = Empreitas.material(c.id);
    return Object.keys(mat).every(m => G.mochila.total(m) >= mat[m]) && G.dinheiro >= (E.custo || 0)
      ? { texto: `Começar a etapa da casa nova (${nome}) — o material e o dinheiro estão na mão: na plaquinha do terreno, no quintal`, alvo, rotulo: 'Na plaquinha: começar a etapa da casa' } : null; }
  if (c.estado === 'obra') { const chove = typeof Clima !== 'undefined' && Clima.chove(G.dia), fr = Empreitas.ferramentaHoje(c.id);
    return !c.a.trabalhou && fr && !Empreitas.impedeHoje(c.id, chove) && !Empreitas.autoHoje(c.id, chove)   // (T4a: o dia que a manta faz sozinha já está cuidado)
      ? { texto: `A casa nova (${nome}) — o trabalho de hoje (${(typeof NOME_FERRAMENTA !== 'undefined' && NOME_FERRAMENTA[fr]) || fr}) na plaquinha do terreno: é a casa da família`, alvo, rotulo: 'Na plaquinha: o trabalho de hoje na casa' } : null; }
  if (c.estado === 'pronta') return { texto: `A casa nova (${nome}) — a etapa está pronta: entregue na plaquinha do terreno`, alvo, rotulo: 'Na plaquinha: entregar a etapa' };
  return null;
}
function ideiaDoDia() {
  // (revisão de 13/10) O que é de hoje vem antes do ganho da tarde: 1) a reforma do dia pendente (o material todo e o dia ainda
  // não trabalhado); 2) colher os pés prontos; 3) a casa nova do dia (casaDoDia); 4) só então a tarde livre (ganhar dinheiro, ou dormir).
  const ref = reformaDoDia(); if (ref) return Object.assign({ rotulo: ref.texto.split(' — ')[0] }, ref);
  // (C8, 16/10) Num dia de janta, depois das 13h (ou com a tarde livre), o convite da tarde vem antes do "colher a horta" genérico e do
  // sorteio de ideias: é o que enche a panela de hoje (o convite já fala da couve pronta, com o valor na janta).
  { const c = conviteDaTarde(); if (c) return c; }
  const prontas = Object.entries((G.horta || {}).covas || {}).filter(([, c]) => c.planta && Horta.madura(c));
  const colher = prontas.length && (([x, y]) => ({ texto: `Colher a horta — ${prontas.length} pé(s) pronto(s): comida para a família e para a pensão da Rosa`, alvo: { mapa: 'quintal', ponto: { x: (x + 0.5) * TILE, y: y * TILE } }, rotulo: 'Botão direito: colher' }))(prontas[0][0].split(',').map(Number));
  if (colher) return colher;
  const casa = casaDoDia(); if (casa) return casa;   // (revisão 3) 3) a casa do dia; 4) só então o ganho da tarde
  { const t = tardeLivre(), g = t === 'tarde' ? ganhoDaTarde() : t === 'noite' ? dormirDaNoite() : null; if (g) return Object.assign({ rotulo: g.texto.split(' — ')[0] }, g); }
  const op = [];
  if (typeof QuintalMarcos !== 'undefined' && G.quintalMarcos && QuintalMarcos.proximo())
    op.push({ texto: `Limpar o quintal${contaDoQuintal()} — mais chão para plantar e o presente do Tio Juca`, alvo: typeof _alvoLimparQuintal === 'function' ? _alvoLimparQuintal : { mapa: 'quintal' } });
  // (relato de 14/10) o quintal sem madeira ou sem pedra: onde tem (a mata, ou a pedreira para a pedra)
  { const mf = materialDaTarde(); if (mf && !/^Limpar o quintal/.test(mf.texto)) op.push(mf); }
  if (G.casa && G.casa.aberta && !G.casa.mudou) { const E = ECO.casa.etapas[Math.min(G.casa.etapa || 0, ECO.casa.etapas.length - 1)], T = QUINTAL.TERRENO;
    op.push({ texto: `A casa nova — ${E.nome}, na plaquinha do terreno do quintal: é a casa da família`, alvo: { mapa: 'quintal', ponto: { x: (T.x + T.w / 2) * TILE, y: (T.y + T.h / 2) * TILE } } }); }
  // (revisão final) Para onde vai o dinheiro do bico: antes do sonho da Rosa, só na hora; antes da compra, a lojinha; depois, a pensão.
  // (teste de 13/10) Só com serviço no quadro: o quadro vazio mandava o jogador para lá à toa.
  if (quadroComServico()) { const L = G.lojinha || {};
    op.push({ texto: `Um serviço do quadro da Vila — ${L.comprada ? 'paga na hora, e o dinheiro vai para a pensão' : L.conversou ? 'paga na hora, e o dinheiro vai para a lojinha da Rosa' : 'dinheiro na hora, no bolso da família'}`, alvo: { mapa: 'vila', objeto: 'quadro_pedidos' } }); }
  if (G.lugares && G.lugares.praia) op.push(pescarNoPier());
  // O sonho da Rosa (o restaurante): a entrada da lojinha, e depois a reforma pela metade.
  if (G.lojinha && G.lojinha.conversou && !G.lojinha.comprada) op.push({ texto: `Juntar a entrada da lojinha — Cr$ ${Math.min(Math.max(0, G.dinheiro), ECO.lojinha.entrada)} de ${ECO.lojinha.entrada}: é o sonho da Rosa, o restaurante dela`, alvo: { mapa: 'vila', objeto: 'pensao' } });
  else if (G.pensao && (G.pensao.estado === 'limpar' || ECO.reforma.some(e => e.id === G.pensao.estado)) && !G.pensao.feitaHoje(G.dia)) op.push(tocarReforma());
  if (!op.length) return null;
  const o = op[G.dia % op.length];
  return Object.assign({ rotulo: o.texto.split(' — ')[0] }, o);
}
// ---------- a tarde livre (teste de 13/10: "após plantar, regar, ir à Vila, trabalhar pro Bira, falar com a Rosa, fazer as missões do
// quadro da Vila ainda sobrou tempo e fiquei perdido sem saber o que fazer... precisa ter algo que ele possa fazer para ganhar dinheiro
// até o fim da tarde, e então ele poder ir dormir") ----------
// Como é no Stardew: não existe "acabou o trabalho"; o jogador sempre vê o que fazer no próprio mundo — o mato, os galhos e as pedras
// da fazenda (a madeira e a pedra que a caixa de remessa e o Pierre compram), a lavoura, a pesca — e o dia termina quando ele vai
// dormir (o resumo da noite mostra o que a caixa pagou). Aqui o mundo não falou alto o bastante: o Agora sugeria o quadro já vazio,
// ou limpar o quintal sem dizer que aquilo vira dinheiro. Agora, com o serviço do dia feito e o quadro sem serviço à mão, o Agora dá UMA
// forma concreta de ganhar dinheiro até o fim da tarde, com o preço e o porquê (pela situação: vender o que está na mochila; limpar
// o quintal; plantar; pescar), a primeira vez o Tio Juca (ou a Rosa) explica numa fala, e depois das 17h lembra de dormir na cama.
const TARDE_FIM = 17 * 60;
const quadroComServico = () => !!G.empreitas && typeof Guia !== 'undefined' && Guia.liberado('quadro') && typeof dadosEmpreita === 'function'
  && G.empreitas.quadro.some(id => { const E = dadosEmpreita(id); return E && Empreitas.libera(id) && (E.tipo !== 'longa' || Empreitas.longasContadas() < Empreitas.limite()); });   // (C11: o pedido da fama ainda trancado não conta)
// O serviço do dia: a diária do Bira recebida; ou a obra fechada o dia todo (domingo, chuva), mas só depois das 11h (de manhã
// cedo ainda é hora de outra coisa: a fala "acabou o serviço e ainda tem sol?" não sai às 6h).
const TARDE_DOMINGO = 11 * 60;
function servicoDoDiaFeito() {
  if (!G.obra || typeof Obra === 'undefined' || typeof listaDeHoje !== 'function') return false;
  const l = listaDeHoje(), fechada = Obra.aberta(G.dia, 12 * 60);
  return !!(l && l.paga) || ((fechada === 'domingo' || fechada === 'chuva') && G.minutos >= TARDE_DOMINGO);
}
// Um serviço aceito ainda por fazer hoje: o curto aceito (some quando entrega), a longa com o dia de hoje por trabalhar (sem a
// chuva impedir) ou pronta para entregar. A longa só reservada (esperando o material) não segura a tarde.
function servicoEmAndamento() {
  if (!G.empreitas || typeof dadosEmpreita !== 'function') return false;
  const chove = typeof Clima !== 'undefined' && Clima.chove(G.dia);
  return Object.keys(G.empreitas.aceitas).some(id => { const E = dadosEmpreita(id), a = G.empreitas.aceitas[id]; if (!E) return false;
    if (E.tipo === 'curta') return true;
    return a.estado === 'pronta' || (a.estado === 'obra' && !a.trabalhou && !!Empreitas.ferramentaHoje(id) && !Empreitas.impedeHoje(id, chove) && !Empreitas.autoHoje(id, chove)); });
}
const jantaPorFazer = () => !!G.pensao && typeof pensaoAbreHoje === 'function' && pensaoAbreHoje() && G.pensao.ultimaJanta !== G.dia && G.minutos < 20 * 60;
// 'tarde' (o serviço feito, o quadro vazio, nenhum serviço aceito por fazer, antes das 17h), 'noite' (depois das 17h, sem quadro nem
// janta; revisão 3: o serviço aceito não segura mais a noite — o Dormir vale) ou ''.
function tardeLivre() {
  if (!G.obra || !G.mochila || (typeof noPalco === 'function' && noPalco()) || quadroComServico()) return '';
  if (G.minutos < TARDE_FIM) return servicoDoDiaFeito() && !servicoEmAndamento() ? 'tarde' : '';
  return jantaPorFazer() ? '' : 'noite';
}
// Para onde vai o dinheiro (o porquê): a entrada da lojinha, a etapa da casa a juntar ou o bolso da família.
function porqueDoDinheiro() {
  const L = G.lojinha || {}, c = casaEtapas();
  if (L.conversou && !L.comprada) return 'para a entrada da lojinha da Rosa';   // (o quanto falta está na meta, logo acima)
  if (c && c.juntar) return 'para a casa nova';
  return 'dinheiro no bolso da família';
}
// O material que a família ainda vai usar não entra na sugestão de venda: { item: quantos guardar }. (C2, 16/10) A reforma da pensão
// inteira (a etapa de agora e as que faltam: no telhado, a madeira do balcão já fica guardada; antes só a etapa de agora), a etapa da
// casa, o que os recados aceitos pedem e as pedras da obra do Bira de hoje. O teste crítico achou o Agora mandando vender 15 madeiras
// na véspera de o balcão pedir 20, e as 16 pedras do recado do Seu Ananias.
function materialGuardado() {
  const r = {}, soma = (it, q) => { if (q > 0) r[it] = (r[it] || 0) + q; };
  { const m = typeof materialDaReforma === 'function' ? materialDaReforma() : {}; for (const it in m) soma(it, m[it]); }
  { const c = casaEtapas(); if (c && c.juntar) for (const [it, q] of Object.entries(c.juntar.material || {})) soma(it, q); }
  if (G.recados && typeof PEDIDOS_VILA !== 'undefined') for (const id of Object.keys(G.recados.ativos)) { const P = PEDIDOS_VILA[id]; if (P) soma(P.item, P.qtd); }
  { const l = typeof listaDeHoje === 'function' && G.obra ? listaDeHoje() : null; if (l && !l.paga && !l.fechado && typeof faltaDePedras === 'function') soma('pedra', faltaDePedras(l)); }
  return r;
}
// Quanto do item dá para vender sem mexer no que a família guarda.
const sobraParaVender = (id, guarda = materialGuardado()) => Math.max(0, G.mochila.total(id) - (guarda[id] || 0));
// (revisão de 13/10) A colheita e o peixe são o prato da pensão (o coração do jogo): nunca entram na venda. Vende-se só o que a pensão
// não usa: a madeira, a pedra, a fibra e a coleta do chão (com a pensão aberta, a fruta que a Rosa usa vai para a despensa dela).
const ACHADOS_TODOS = () => typeof ACHADOS_ESTACAO === 'undefined' ? [] : [...new Set([].concat(...ACHADOS_ESTACAO, ...ACHADOS_MATA, ACHADOS_PRAIA).map(([id]) => id))];
const pensaoAberta = () => !!G.pensao && G.pensao.estado === 'aberta';
const usaNaPensao = id => id !== 'pedra' && typeof Pratos !== 'undefined' && !!Pratos.INGREDIENTES[id];
const VENDE_NA_TARDE = () => ['madeira', 'pedra', 'fibra'].concat(ACHADOS_TODOS()).filter(id => !(pensaoAberta() && usaNaPensao(id)));
// Os achados de hoje ainda no chão, nos mapas já montados e abertos: { n, onde ("no quintal e na Vila"), mapas, melhor (o de mais valor) }.
const ONDE_ACHADO = { quintal: 'no quintal', vila: 'na Vila', praia: 'na praia', mata: 'na mata' };
function achadosAVista() {
  const r = { n: 0, mapas: [], melhor: '' }; if (typeof MAPAS === 'undefined') return r;
  let v = -1;
  for (const id of Object.keys(ONDE_ACHADO)) { const m = MAPAS[id]; if (!m || (typeof Mundo !== 'undefined' && !Mundo.aberto(id))) continue;
    const os = m.objs.filter(o => o.achado); if (!os.length) continue;
    r.n += os.length; r.mapas.push(id);
    for (const o of os) { const it = String(o.nome || '').replace('itens/', ''), p = CaixaVenda.preco(it); if (p > v) { v = p; r.melhor = it; } } }
  r.onde = r.mapas.map(id => ONDE_ACHADO[id]).join(r.mapas.length > 2 ? ', ' : ' e ').replace(/, ([^,]*)$/, ' e $1');
  return r;
}
function ganhoDaTarde() {
  // (C8) num dia de janta, a 1ª opção é o que falta no cardápio de hoje, com o valor na janta (o elo do Dave: o peixe do dia é o prato
  // da noite); com o ingrediente já na mochila, o convite cala e vem o "Guardar na despensa" logo abaixo
  { const c = conviteDaTarde(); if (c) return c; }
  const pr = id => CaixaVenda.preco(id), porque = porqueDoDinheiro(), guarda = materialGuardado();
  // 0. Com a pensão aberta, o ingrediente da mochila (a colheita, o peixe, a fruta) vai para a despensa da Rosa: vira o prato da janta.
  if (pensaoAberta()) { const ing = Object.keys(Pratos.INGREDIENTES).filter(id => usaNaPensao(id) && G.mochila.total(id) > 0 && G.pensao.aceita(id)).sort((a, b) => G.mochila.total(b) - G.mochila.total(a));
    // (o cardápio do Bancho) com rendimento, a dica curta: o que guardar e o que vira na panela; sem receita para ele, a frase de sempre
    const rend = melhorRendimento(ing), alvo = { mapa: 'vila', objeto: 'pensao' }, rotulo = 'Entrar na pensão: a Rosa guarda';
    if (rend) return { texto: `Guardar ${rend.quanto} na despensa — ${rend.texto}`, alvo, rotulo };
    if (ing.length) return { texto: `Guardar na despensa da Rosa — ${ing.slice(0, 2).map(id => Itens.qtd(G.mochila.total(id), id)).join(' e ')}${ing.length > 2 ? ' e mais' : ''}: entre na pensão e a Rosa guarda; na janta vira prato, e prato vendido é a pensão crescendo`,
      alvo, rotulo }; }
  // 1. O que já está na mochila e a pensão não usa: a caixa de venda do quintal (o carroceiro paga de madrugada).
  // (C2) só o que sobra do material guardado (a madeira acima do que a reforma ainda pede; antes, o item guardado saía inteiro)
  const itens = VENDE_NA_TARDE().map(id => ({ id, n: sobraParaVender(id, guarda), v: pr(id) })).filter(i => i.n > 0 && i.v > 0).sort((a, b) => b.n * b.v - a.n * a.v);
  const total = itens.reduce((t, i) => t + i.n * i.v, 0);
  if (itens.length && total >= 10) { const i = itens[0];
    const fica = itens.filter(x => guarda[x.id]).map(x => Itens.qtd(Math.min(guarda[x.id], G.mochila.total(x.id)), x.id));   // (C2) o que fica na mochila
    return { texto: `Vender na caixa de venda do quintal — ${Itens.qtd(i.n, i.id)} a Cr$ ${i.v} cada${itens.length > 1 ? ` (tudo o que dá para vender: Cr$ ${total})` : ` = Cr$ ${total}`}; o carroceiro paga de madrugada, ${porque}${fica.length ? `; guarde ${fica.join(' e ')}, que a família vai usar` : ''}`,
      alvo: { mapa: 'quintal', objeto: 'caixa_venda' }, rotulo: 'Botão direito: vender na caixa' }; }
  // 1a. (dia cheio, Frente B) A pesca nova (a vara do Seu Lourival chega no dia 2, como a do Willy): até pegar o jeito (Pesca nível 1,
  // uns 6 peixes), pescar vem antes da coleta, da limpeza e do plantio — é a novidade da semana (o Stardew abre a praia no dia 2 para isso).
  if (pescaNova()) return pescarNoPier();
  // 1b. (dia cheio, Frente A) A coleta à vista hoje (os achados que nasceram nos mapas já vistos): o mais valioso dá o preço do ECO.
  { const ach = achadosAVista(); if (ach.n) { const id = ach.melhor, nome = Itens.nome(id).toLowerCase(), rosa = pensaoAberta() && usaNaPensao(id);
    // (revisão 3) o nome do que se cata vem do melhor achado: fruta, flor, cogumelo; a pedra bonita e a concha são "achados"
    const tipo = ['flor'].includes(id) ? 'flor' : id === 'cogumelo' ? 'cogumelo' : ['pedra_bonita', 'concha'].includes(id) ? 'achados' : 'fruta';
    return { texto: `Catar ${tipo} ${ach.onde} — ${ach.n} ${ach.n === 1 ? 'achado' : 'achados'} hoje: ${rosa ? `${nome} vai para a despensa da Rosa` : `${nome} vale Cr$ ${pr(id)} na caixa de venda`}; ${porque}`,
      alvo: () => { const o = (G.mapa && G.jog ? G.mapa.objs.filter(x => x.achado) : []).sort((a, b) => Math.hypot(a.x - G.jog.x, a.y - G.jog.y) - Math.hypot(b.x - G.jog.x, b.y - G.jog.y))[0];
        return o ? { mapa: G.mapaId, ponto: { x: o.x, y: o.y - 40 } } : { mapa: ach.mapas[0] }; }, rotulo: 'Botão direito: catar' }; } }
  // 2. A madeira e a pedra: o quintal com galho e pedra (e o presente do Tio Juca); sem elas, a mata ou a pedreira.
  { const m = materialDaTarde(porque); if (m) return m; }
  // 3. Plantar: a semente mais barata da estação vira colheita (a comida da família e o prato da pensão; o valor só para medir).
  if (typeof sementesDaLoja === 'function') { const s = sementesDaLoja().map(culturaDaSemente).filter(Boolean).sort((a, b) => CULTURAS[a].dias - CULTURAS[b].dias)[0];
    if (s && G.dinheiro >= precoSemente(CULTURAS[s].semente)) return { texto: `Plantar mais covas — ${Itens.nome(CULTURAS[s].semente).toLowerCase()} no depósito do Seu Ananias a Cr$ ${precoSemente(CULTURAS[s].semente)}; em ${Horta.diasPara(s)} dias regando, cada pé (que vale Cr$ ${PRECO_CAIXA[s]}) é comida da família e prato da pensão da Rosa`,
      alvo: { mapa: 'vila', objeto: 'deposito' }, rotulo: 'Sementes no Seu Ananias' }; }
  // 4. Pescar no píer (a praia aberta): o peixe é o prato da pensão (o preço dos de todo dia, a sardinha e a tainha, só para medir).
  if (G.lugares && G.lugares.praia && pr('sardinha') && pr('tainha')) return pescarNoPier();
  return null;
}
// (relato de 14/10: "acabei com toda a madeira do quintal, não tinha mais onde pegar... preciso de mais local que possa pegar essas
// madeiras e pedras além do quintal") Como é no Stardew: a fazenda rebrota pouco, e a madeira e a pedra de sempre vêm da Floresta da
// Seiva, do Bosque Secreto e da pedreira. Aqui o quintal rebrota pouco (quintal_marcos.js); a mata (o bosque antes da ponte e a beira
// do rio, mapa_mata.js) e a pedreira repõem toda manhã. Uma coisa só, com o porquê: o quintal com madeira e pedra, limpar o quintal;
// sem madeira, a mata; com madeira e sem pedra, a pedreira (aberta no dia 5; antes dela, a beira do rio da mata).
const DETS_MADEIRA = ['galho', 'toco', 'arvore'], DETS_PEDRA = ['pedra', 'pedregulho'];
// (C3, 16/10; o teste crítico: "limpei 32 coisas em 1h50 e a frase não mudou nem mostrou barra") A conta da limpeza, como a linha
// quintal_limpar da Caderneta: ": 32 de 120 (o presente em 25%)". Sem o marco seguinte (tudo dado), só a conta; sem os marcos, nada.
function contaDoQuintal() {
  if (typeof QuintalMarcos === 'undefined' || !G.quintalMarcos) return '';
  const t = QuintalMarcos.total(), f = Math.max(0, t - QuintalMarcos.restantes()), m = QuintalMarcos.proximo();
  return t ? `: ${f} de ${t}${m ? ` (o presente em ${m}%)` : ''}` : '';
}
const _maisPertoNoMapa = (mapa, dets) => () => { if (G.mapaId !== mapa) return { mapa };
  const o = typeof _maisPerto === 'function' ? _maisPerto(x => x.tipo === 'detrito' && dets.includes(x.det) && !x.empreitaDet) : null;
  return o ? { mapa, ponto: { x: o.x, y: o.y - 56 }, det: o.det } : null; };
function materialDaTarde(porque = porqueDoDinheiro()) {
  const pr = id => CaixaVenda.preco(id), Q = typeof MAPAS !== 'undefined' && MAPAS.quintal;
  const noQuintal = dets => !!Q && Q.objs.some(o => o.tipo === 'detrito' && dets.includes(o.det) && !o.empreitaDet);
  if (!Q) return null;
  const mad = noQuintal(DETS_MADEIRA), ped = noQuintal(DETS_PEDRA), aberto = id => typeof Mundo === 'undefined' || Mundo.aberto(id);
  // (a mata ainda não montada vem cheia; a mata já limpa hoje não é sugestão: amanhã ela repõe)
  const naMata = dets => !MAPAS.mata || MAPAS.mata.objs.some(o => o.tipo === 'detrito' && dets.includes(o.det) && !o.empreitaDet);
  // (C2, 16/10) com a reforma da pensão pedindo madeira, o galho não é "para vender": é a madeira da reforma (o Agora não contradiz)
  const refMad = (typeof materialDaReforma === 'function' ? materialDaReforma() : {}).madeira || 0;
  const madeiraVale = refMad ? `a reforma da pensão ainda pede ${Itens.qtd(refMad, 'madeira')}` : `Cr$ ${pr('madeira')} cada na caixa de venda`;
  const quintal = () => ({ texto: `Limpar o quintal${contaDoQuintal()} — o galho vira madeira (${madeiraVale}), a pedra vende a Cr$ ${pr('pedra')}: ${porque}`,
      alvo: typeof _alvoLimparQuintal === 'function' ? _alvoLimparQuintal : { mapa: 'quintal' }, rotulo: refMad ? 'Limpar o quintal: madeira para a reforma' : 'Limpar o quintal: madeira e pedra para vender' });
  if (mad && ped) return quintal();
  if (mad && aberto('pedreira')) return { texto: `Quebrar pedra na pedreira — o quintal está sem pedra; as rochas da entrada da pedreira se refazem toda manhã (a pedra vale Cr$ ${pr('pedra')} na caixa de venda e serve nas obras): ${porque}`,
    alvo: _maisPertoNoMapa('pedreira', ['rocha']), rotulo: 'A pedreira: pedra nova toda manhã' };
  if (aberto('mata') && !mad && naMata(DETS_MADEIRA)) return { texto: `Cortar madeira na mata — o quintal está sem madeira; na mata, antes da ponte, entre a trilha e o rio, tem árvore e galho para cortar (${madeiraVale})${ped ? '' : ' e pedra na beira do rio'}, e a mata repõe de manhã: ${porque}`,
    alvo: _maisPertoNoMapa('mata', ped ? DETS_MADEIRA : DETS_MADEIRA.concat(DETS_PEDRA)), rotulo: 'Na mata, antes da ponte: árvore e galho' };
  if (aberto('mata') && !ped && naMata(DETS_PEDRA)) return { texto: `Pegar pedra na mata — o quintal está sem pedra; na beira do rio da mata tem pedra e pedregulho para a picareta (Cr$ ${pr('pedra')} cada na caixa de venda), e a mata repõe de manhã: ${porque}`,
    alvo: _maisPertoNoMapa('mata', DETS_PEDRA), rotulo: 'Na beira do rio da mata: pedra' };
  return mad || ped ? quintal() : null;
}
// (dia cheio, Frente B) Pescar no píer, com o preço e para onde vai o peixe (a banca do Seu Lourival, ou a despensa da Rosa com a pensão
// aberta, e então quanto cada peixe rende na panela: o cardápio do Bancho).
const pescarNoPier = () => ({ texto: `Pescar no píer — ${typeof pescaParaOnde === 'function' ? pescaParaOnde() : 'o peixe é o prato da pensão da Rosa'}${rendimentoDoPeixe()}`, alvo: { mapa: 'praia', morador: 'lourival' } });
// ---------- o rendimento à vista (o cardápio do Bancho, 13/10) ----------
// O Dave mostra, no estoque e no cardápio, quantas porções cada receita dá; aqui, a dica da tarde diz o que o ingrediente da mochila
// vira na panela da Rosa ("com 3 sardinhas dá 3 panelas de Peixe Frito do Lourival = 12 porções"). Só com a pensão aberta (antes, a
// despensa não existe). A chave é o ingrediente da receita: 'peixe' junta todos os peixes que a pensão aceita.
const chaveDaPanela = id => Pratos.PEIXES.includes(id) ? 'peixe' : id;
// (o nome curto: "farinha", e não "pacote de farinha")
const nomeNaPanela = k => k === 'peixe' ? 'peixe' : Itens.nome(k).toLowerCase().replace(/^(saco|pacote) de /, '');
const ondeTem = k => k === 'peixe' ? 'no píer' : (Pratos.INGREDIENTES[k] || {}).origem || '';
function naMochilaDaPanela(k) {
  const p = G.pensao;
  return k === 'peixe' ? Pratos.PEIXES.reduce((t, px) => t + (p.aceita(px) ? G.mochila.total(px) : 0), 0) : G.mochila.total(k);
}
// A receita do caderno que mais rende com n do ingrediente: { prato, q (quanto cada panela leva), panelas, porcoes, falta: [o resto que
// não está na despensa nem na mochila] }, ou null (nenhuma receita usa).
function rendimentoNaPanela(chave, n) {
  const p = G.pensao; if (!pensaoAberta() || !G.mochila) return null;
  let melhor = null;
  for (const prato of p.receitas) {
    const P = Pratos.PRATOS[prato], g = P && p.gasto(prato), q = g && g[chave]; if (!q) continue;   // (16/10) o gasto da panela (Pensao.gasto)
    const panelas = Math.floor(n / q), porcoes = panelas * p.porcoesPorPanela(prato);
    const falta = Object.keys(g).filter(k => k !== chave && p._tem(k) + naMochilaDaPanela(k) < g[k] * Math.max(1, panelas));
    if (!melhor || porcoes > melhor.porcoes || (porcoes === melhor.porcoes && (falta.length < melhor.falta.length || (falta.length === melhor.falta.length && q < melhor.q)))) melhor = { prato, q, panelas, porcoes, falta };
  }
  return melhor;
}
// O que falta, cada um com onde tem: "; falta farinha (Mercearia do Ananias) e peixe (no píer)".
const faltaNaPanela = f => f.length ? `; falta ${f.map(k => nomeNaPanela(k) + (ondeTem(k) ? ` (${ondeTem(k)})` : '')).join(' e ')}` : '';
// O melhor rendimento entre os ingredientes da mochila: { quanto ("3 sardinhas"), texto ("3 panelas de … (12 porções)") } ou null.
function melhorRendimento(ids) {
  let r = null, id0 = null;
  for (const id of ids) { const x = rendimentoNaPanela(chaveDaPanela(id), naMochilaDaPanela(chaveDaPanela(id)));
    if (x && (!r || x.porcoes > r.porcoes)) { r = x; id0 = id; } }
  if (!r) return null;
  const ch = chaveDaPanela(id0), n = naMochilaDaPanela(ch), nome = Pratos.PRATOS[r.prato].nome;
  const quanto = ch === 'peixe' && Pratos.PEIXES.filter(px => G.pensao.aceita(px) && G.mochila.total(px) > 0).length > 1 ? `${n} peixes` : Itens.qtd(n, id0);
  if (!r.panelas) return { quanto, texto: `ainda não dá panela de ${nome}: cada uma leva ${r.q}` };
  return { quanto, texto: `${r.panelas} ${r.panelas === 1 ? 'panela' : 'panelas'} de ${nome} (${r.porcoes} porções)${faltaNaPanela(r.falta)}` };
}
// Na dica da pesca: quanto cada peixe rende ('' com a pensão fechada).
function rendimentoDoPeixe() {
  const r = rendimentoNaPanela('peixe', Math.max(1, G.mochila ? naMochilaDaPanela('peixe') : 0)); if (!r) return '';
  const P = Pratos.PRATOS[r.prato], g = G.pensao.gasto(r.prato), outros = Object.keys(g).filter(k => k !== 'peixe');
  const falta = outros.filter(k => G.pensao._tem(k) < g[k]);
  return `; cada ${r.q === 1 ? 'peixe' : r.q + ' peixes'}${outros.length ? ' com ' + outros.map(k => `${g[k]} de ${nomeNaPanela(k)}`).join(' e ') : ''} é 1 panela de ${P.nome} = ${G.pensao.porcoesPorPanela(r.prato)} porções${faltaNaPanela(falta)}`;
}
const pescaNova = () => !!(G.lugares && G.lugares.praia && G.hab && G.hab.xp && (G.hab.xp.pesca || 0) < Habilidades.NIVEIS[0] && G.mochila && G.mochila.total('vara') > 0);
// ---------- o convite da tarde (C8, 16/10; o teste crítico C, solução 5: "o dia em três tempos, como no Dave") ----------
// O teste crítico achou a tarde vazia: o dia guiado acaba às 8–10h e sobram ~600 min de jogo sem nada apontado; o Agora sugeria vender
// pedra a Cr$ 1 ou pescar sardinha a Cr$ 3, e o que se faz à tarde não aparecia na janta. Como é no Dave the Diver: o dia é o mergulho,
// a preparação e a noite no Bancho, e o peixe pescado de dia é o cardápio da noite. Como é no Stardew: a tarde é livre, mas o mundo dá o
// motivo (a pesca, a colheita, a coleta). Aqui, num dia de janta, o Agora traz UMA sugestão: o que falta no cardápio de hoje que o
// Jocelino consegue sozinho à tarde (o peixe no píer, o pé pronto da horta, o coco da praia), com o porquê em dinheiro da janta:
// "A Rosa quer peixe pra janta de hoje — 2 peixes = 1 panela de Peixe Frito do Lourival = ~Cr$ 44 na janta (no píer, com o Lourival)".
// Vivência, não missão: uma linha só, e só quando falta mesmo; o que a Mercearia vende é da linha da despensa das 14h (C7, despensa.js).
// A 1ª vez, a Rosa conta numa fala e a seta vai junto (o ATUALIZADOR mais abaixo); depois, o clique no Agora acende a seta, como as ideias.
const TARDE_CONVITE = 13 * 60;   // a tarde do convite: das 13h (o "depois do almoço" do Adiantar, palco.js) às 17h; antes, com a tarde livre
// Os pratos da janta de hoje: [prato, panelas, quem]. O cardápio guardado no quadro de giz; sem ele (a 1ª janta), as receitas do caderno,
// uma panela cada, até as vagas do degrau (é o que o quadro oferece na abertura). E, com vaga no quadro, mais dois casos, sempre com o
// resto da receita (o que se compra, a pedra) já na despensa depois das panelas do quadro, ou na mochila:
// - o prato do morador que janta hoje (clientela.js: o Seu Tonico na terça pede o Peixe Frito, a Dona Cida a Sopa de Pedra, a Dona Zélia
//   na quarta a Cocada): servido, ele dá uma curtida e amizade. É o freguês fixo do Bancho, e o que se pega de dia vira o prato dele;
// - a noite curta (a despensa não dá pratos para os fregueses de sempre: pratosDaJanta, despensa.js): as receitas fora do quadro, com as
//   panelas que faltam para a noite.
const daTarde = k => k === 'peixe' || (k !== 'pedra' && Pratos.MERCEARIA[k] == null);   // (o que o Jocelino pega sozinho; o resto se compra)
function pratosDeHoje(p = G.pensao) {
  const esc = Object.entries(p.cardapioNoite || {}).filter(([id, e]) => (e.panelas | 0) > 0 && p.receitas.includes(id) && Pratos.PRATOS[id]).map(([id, e]) => [id, e.panelas | 0, '']);
  const moradores = typeof Clientela !== 'undefined' ? Clientela.daNoite(p, G.dia).filter(c => c.favorito && Pratos.PRATOS[c.favorito]) : [];
  if (!esc.length) return p.receitas.filter(id => Pratos.PRATOS[id]).slice(0, p.vagas()).map(id => [id, 1, (moradores.find(c => c.favorito === id) || {}).nome || '']);
  for (const e of esc) { const c = moradores.find(m => m.favorito === e[0]); if (c) e[2] = c.nome; }
  const sobra = typeof contaDoQuadro === 'function' ? contaDoQuadro(p, p.cardapioNoite).sobra : p;
  // quantas panelas do prato de fora o resto da receita (o que não se pega à tarde) ainda dá
  const daResto = (id, n) => { const g = p.gasto(id); for (const x of Object.keys(g)) if (!daTarde(x)) n = Math.min(n, Math.floor((sobra._tem(x) + G.mochila.total(x)) / g[x])); return n; };
  for (const c of moradores) if (esc.length < p.vagas() && !esc.some(([x]) => x === c.favorito) && daResto(c.favorito, 1) > 0) esc.push([c.favorito, 1, c.nome]);
  if (esc.length >= p.vagas() || typeof pratosDaJanta !== 'function') return esc;
  const cj = pratosDaJanta(); let falta = cj.esperados - cj.da;
  for (const id of p.receitas) {
    if (esc.length >= p.vagas() || falta <= 0) break;
    if (!Pratos.PRATOS[id] || esc.some(([x]) => x === id)) continue;
    const n = daResto(id, Math.ceil(falta / p.porcoesPorPanela(id)));
    if (n > 0) { esc.push([id, n, '']); falta -= n * p.porcoesPorPanela(id); }
  }
  return esc;
}
// Onde o Jocelino consegue o ingrediente hoje à tarde, sozinho: { tem (quanto dá para pegar; Infinity no mar), como, alvo, rotulo, pedido }
// ou null. Só o que não se compra (a Mercearia é da C7) e só o que dá hoje: o peixe com a praia aberta e a vara; o pé pronto da horta;
// o achado de hoje no chão (o coco da praia). A pedra da sopa volta para a despensa: nunca falta.
function fonteDaTarde(k) {
  const aberto = id => typeof Mundo === 'undefined' || Mundo.aberto(id);
  if (k === 'peixe') {
    const vara = typeof VARAS !== 'undefined' ? VARAS.some(v => G.mochila.total(v) > 0) : G.mochila.total('vara') > 0;
    if (!vara || !G.lugares || !G.lugares.praia || !aberto('praia') || typeof PRAIA === 'undefined') return null;
    const ponta = { x: (PRAIA.PIER_X + 1) * TILE, y: PRAIA.PIER_FIM * TILE };
    // (como a seta da 1ª pescaria, guia_setas.js: na ponta do píer com a vara na mão, a seta some e o Jocelino pesca)
    const pescando = () => G.mapaId === 'praia' && G.jog && Math.hypot(ponta.x - G.jog.x, ponta.y + 36 - G.jog.y) < 1.6 * TILE && typeof itemDaMao === 'function' && typeof VARAS !== 'undefined' && VARAS.includes(itemDaMao());
    return { tem: Infinity, como: 'no píer, com o Lourival', pedido: n => `Pesca ${n === 1 ? 'um' : n} pra mim no píer`, rotulo: 'Pescar no píer: peixe pra janta de hoje',
      alvo: () => pescando() ? null : G.mapaId === 'praia' ? { mapa: 'praia', ponto: ponta, rotuloFixo: 'Pesque da ponta do píer, com a vara na mão: peixe pra janta de hoje' } : { mapa: 'praia' } };
  }
  if (typeof CULTURAS !== 'undefined' && CULTURAS[k]) {
    const prontos = Object.entries((G.horta || {}).covas || {}).filter(([, c]) => c.planta === k && typeof Horta !== 'undefined' && Horta.madura(c));
    if (!prontos.length) return null;
    const [x, y] = prontos[0][0].split(',').map(Number);
    return { tem: prontos.length, como: 'colher na horta do quintal', pedido: n => `Colhe ${n === 1 ? 'o pé' : 'os ' + n + ' pés'} de ${nomeNaPanela(k)} da horta`, rotulo: 'Botão direito: colher',
      alvo: { mapa: 'quintal', ponto: { x: (x + 0.5) * TILE, y: y * TILE } } };
  }
  if (typeof MAPAS === 'undefined') return null;
  // o achado de hoje (o coco): os mapas abertos que têm, o de mais primeiro
  const eh = o => o.achado && String(o.nome || '').replace('itens/', '') === k, quantos = id => MAPAS[id].objs.filter(eh).length;
  const onde = Object.keys(ONDE_ACHADO).filter(id => MAPAS[id] && aberto(id) && quantos(id) > 0).sort((a, c) => quantos(c) - quantos(a));
  if (!onde.length) return null;
  const lugares = typeof listaE === 'function' ? listaE(onde.map(id => ONDE_ACHADO[id])) : ONDE_ACHADO[onde[0]];
  return { tem: onde.reduce((t, id) => t + quantos(id), 0), como: `catar ${lugares}`, pedido: q => `Cata ${typeof ingredienteNaPanela === 'function' ? ingredienteNaPanela(k, q) : q} ${lugares}`, rotulo: 'Botão direito: catar',
    alvo: () => { const o = G.mapa && G.jog && onde.includes(G.mapaId) ? G.mapa.objs.filter(eh).sort((a, c) => Math.hypot(a.x - G.jog.x, a.y - G.jog.y) - Math.hypot(c.x - G.jog.x, c.y - G.jog.y))[0] : null;
      return o ? { mapa: G.mapaId, ponto: { x: o.x, y: o.y - 40 } } : { mapa: onde[0] }; } };
}
// (C9, 16/10; a revisão da C8: o "~Cr$ 44 na janta" era a panela inteira, e com a noite já coberta pelo PF quase tudo isso a casa
// já ganhava) O GANHO A MAIS na janta. Os fregueses comem o que tem: a porção nova ou cobre um freguês que ficaria sem prato (a noite
// curta: no lugar do prato da casa, ECO.pensao.pratoCasa) ou toma o lugar do prato mais barato que o quadro já faz hoje (a base).
// fora: os pratos em conta (não servem de base). → { casa, base: { id, v }, descobertas (os fregueses sem prato hoje), C (contaDoQuadro) }
function contaAMais(p, fora = []) {
  const C = contaDoQuadro(p, p.cardapioNoite || {}), cj = pratosDaJanta(), casa = ECO.pensao.pratoCasa.preco;
  let base = null;
  for (const id of Object.keys(C.efe)) if (C.efe[id] > 0 && !fora.includes(id)) { const v = p.preco(id, 1); if (!base || v < base.v) base = { id, v }; }
  // (C9, rodada 1) servidos: os fregueses que o quadro já serve hoje — a troca só acontece com eles (a panela é SOMADA ao quadro: a
  // Rosa não tira panela de ninguém, só a sobra; panelaDaRosa, pensao_tela.js). Porção além deles não vende: não conta.
  return { casa, base: base || { id: Pensao.CASA, v: casa }, descobertas: Math.max(0, cj.esperados - cj.da), servidos: Math.min(cj.esperados, cj.da), C };
}
// O a mais de uma panela de n porções a preço pr, somada ao quadro: as porções que cobrem os fregueses sem prato (A.descobertas) valem
// pr − o prato da casa; as outras só valem quando a troca acontece (um freguês servido pelo quadro, A.servidos, pede a nova): pr − a base.
function aMaisDaPanela(A, pr, n) {
  const d = Math.min(n, A.descobertas), t = Math.min(n - d, A.servidos);
  A.descobertas -= d; A.servidos -= t;
  return d * (pr - A.casa) + t * (pr - A.base.v);
}
// O artigo do prato ("o PF", "a Sopa de Pedra"): a 1ª palavra terminada em "a" é feminina (a Couve à Mineira também).
const artigoPrato = nome => { const w = String(nome).split(/[ -]/)[0]; return w === 'Couve' || /a$/.test(w) ? 'a' : 'o'; };
// O convite: { texto, alvo, rotulo, convite: { tipo, k, q, panelas, valor, prato, quem, base, fala } } ou null. Num dia de janta (a
// pensão aberta, a janta de hoje por fazer, antes das 17h), com o serviço do dia feito (a diária do Bira) ou das 13h em diante.
// 1) tipo 'falta': o ingrediente do cardápio de hoje que mais vale na janta, entre os que faltam (a despensa e a mochila juntas não dão
//    as panelas do quadro) e que dá para pegar hoje. O valor (C9): o ganho a mais (contaAMais), na raridade 1 (por isso o "~"). Sem
//    ganho a mais, só o prato do morador (a curtida) convida.
// 2) tipo 'melhora' (C9, decisão do coordenador): a despensa já cobre a noite, e um prato que a Rosa sabe, fora do quadro, vale mais
//    que o prato mais barato do quadro; falta só uma coisa que o Jocelino pega sozinho (o peixe, o pé pronto, o coco). É o laço do
//    Dave: o que se pega de dia vira o prato melhor da noite. Às 17h, se ele trouxe, a Rosa põe a panela (panelaDaRosa, pensao_tela.js).
function conviteDaTarde() {
  const p = G.pensao;
  if (!pensaoAberta() || !G.mochila || G.turno || !jantaPorFazer() || G.minutos >= TARDE_FIM) return null;
  if (G.minutos < TARDE_CONVITE && !servicoDoDiaFeito()) return null;   // (de manhã, a obra do Bira primeiro)
  const precisa = {};   // { ingrediente: { q: quanto os pratos de hoje gastam, pratos: [{ prato, g: o gasto da panela, n: panelas, por: porções, pr: preço, quem }] } }
  for (const [prato, n, quem] of pratosDeHoje(p)) {
    const g = p.gasto(prato);
    for (const k of Object.keys(g)) {
      if (!daTarde(k) || (k !== 'peixe' && !p.aceita(k))) continue;
      const P = precisa[k] = precisa[k] || { q: 0, pratos: [] };
      P.q += g[k] * n; P.pratos.push({ prato, g: g[k], n, por: p.porcoesPorPanela(prato), pr: p.preco(prato, 1), quem });
    }
  }
  let melhor = null;
  for (const k of Object.keys(precisa)) {
    const P = precisa[k], tem = p._tem(k) + naMochilaDaPanela(k);
    if (tem >= P.q) continue;
    const F = fonteDaTarde(k); if (!F) continue;
    // as panelas que faltam, prato a prato, na ordem do quadro: o que a despensa já tem cobre as primeiras
    const A = contaAMais(p, P.pratos.map(x => x.prato));
    let sobra = tem, q = 0, panelas = 0, valor = 0, prato = P.pratos[0].prato, quem = '';
    for (const x of P.pratos) for (let j = 0; j < x.n; j++) {
      if (sobra >= x.g) { sobra -= x.g; continue; }
      const pega = x.g - sobra; if (q + pega > F.tem) break;
      q += pega; sobra = 0; panelas++; valor += aMaisDaPanela(A, x.pr, x.por); if (panelas === 1) { prato = x.prato; quem = x.quem; }
    }
    if (!panelas || (valor <= 0 && !quem)) continue;
    // (o prato do morador de hoje vem primeiro: ele pede e dá a curtida)
    if (!melhor || (!!quem !== !!melhor.quem ? !!quem : valor > melhor.valor)) melhor = { tipo: 'falta', k, q, panelas, valor, prato, quem, F };
  }
  if (!melhor) melhor = melhoraDaTarde(p);
  if (!melhor) return null;
  const { tipo, k, q, panelas, valor, prato, quem, F } = melhor, nome = Pratos.PRATOS[prato].nome;
  const quanto = typeof ingredienteNaPanela === 'function' ? ingredienteNaPanela(k, q) : `${q} ${nomeNaPanela(k)}`;
  const panTxt = `${panelas} ${panelas === 1 ? 'panela' : 'panelas'}`, dele = /^Dona /.test(quem) ? 'dela' : 'dele';
  const base = melhor.base ? Pratos.PRATOS[melhor.base].nome : '', comBase = base ? `${artigoPrato(base)} ${base}` : '';
  if (tipo === 'melhora') return { texto: `Com ${quanto} a Rosa faz ${nome} hoje — ~Cr$ ${valor} a mais que ${comBase} na janta (${F.como})`,
    alvo: F.alvo, rotulo: F.rotulo,
    convite: { tipo, k, q, panelas, valor, prato, quem: '', base: melhor.base,
      fala: `A janta já tá garantida, mas com ${quanto} eu faço ${nome}: uns Cr$ ${valor} a mais que ${comBase}. ${F.pedido(q)}?` } };
  const ganho = valor > 0 ? ` = ~Cr$ ${valor} a mais na janta` : '';
  return { texto: quem ? `${quem} janta hoje e pede ${nome} — ${quanto} = ${panTxt}${ganho}, e a curtida ${dele} (${F.como})`
      : `A Rosa quer ${nomeNaPanela(k)} pra janta de hoje — ${quanto} = ${panTxt} de ${nome}${ganho} (${F.como})`,
    alvo: F.alvo, rotulo: F.rotulo,
    convite: { tipo, k, q, panelas, valor, prato, quem, fala: `${F.pedido(q)}? Na janta vira ${panTxt} de ${nome}${valor > 0 ? `, uns Cr$ ${valor} a mais` : ''}${quem ? `, e ${/^Dona /.test(quem) ? 'a' : 'o'} ${quem} sai feliz da vida` : ''}.` } };
}
// (C9) A melhora da tarde (o tipo 'melhora' do convite): só com a noite coberta (pratosDaJanta) e vaga no quadro; o prato do caderno
// fora do quadro com o resto da receita (o que se compra, a pedra) já na despensa depois das panelas do quadro (ou na mochila), uma
// coisa só para buscar (que dá hoje: fonteDaTarde) e ganho a mais sobre o prato mais barato do quadro. Uma panela, o maior ganho.
// → { tipo, k, q, panelas: 1, valor, prato, base, F } ou null.
function melhoraDaTarde(p) {
  const cj = pratosDaJanta(); if (cj.da < cj.esperados) return null;
  const A = contaAMais(p), C = A.C, feitos = Object.keys(C.efe).filter(id => C.efe[id] > 0);
  if (!feitos.length || A.base.id === Pensao.CASA) return null;
  const ocupa = new Set(feitos.concat(p.pratosDaNoite())); if (ocupa.size >= p.vagas()) return null;
  let melhor = null;
  for (const prato of p.receitas) {
    if (!Pratos.PRATOS[prato] || ocupa.has(prato)) continue;
    const g = p.gasto(prato), ks = Object.keys(g);
    if (ks.some(x => daTarde(x) ? x !== 'peixe' && !p.aceita(x) : C.sobra._tem(x) + G.mochila.total(x) < g[x])) continue;
    const busca = ks.filter(x => daTarde(x) && C.sobra._tem(x) + naMochilaDaPanela(x) < g[x]);
    if (busca.length !== 1) continue;   // (com tudo em casa, não há o que buscar à tarde; duas coisas já não é "uma sugestão")
    const k = busca[0], q = g[k] - C.sobra._tem(k) - naMochilaDaPanela(k), F = fonteDaTarde(k);
    if (!F || F.tem < q) continue;
    const valor = aMaisDaPanela(Object.assign({}, A), p.preco(prato, 1), p.porcoesPorPanela(prato));   // (rodada 1: a mesma conta da panela somada)
    if (valor > 0 && (!melhor || valor > melhor.valor)) melhor = { tipo: 'melhora', k, q, panelas: 1, valor, prato, quem: '', base: A.base.id, F };
  }
  return melhor;
}
// (C9) O convite que chegou ao Agora fica guardado no dia (G.conviteHoje): às 17h, o prato dele fora do quadro, com o ingrediente já
// na despensa, a Rosa põe sozinha (panelaDaRosa, pensao_tela.js).
INICIADORES.push(s => { const c = s.conviteHoje; G.conviteHoje = c && c.dia ? Object.assign({}, c) : null; });
COLETORES.push(s => { s.conviteHoje = G.conviteHoje ? Object.assign({}, G.conviteHoje) : null; });
function marcaConvite(c) {
  const v = c && c.convite; if (!v) return;
  if (!G.conviteHoje || G.conviteHoje.dia !== G.dia || G.conviteHoje.prato !== v.prato) G.conviteHoje = { dia: G.dia, prato: v.prato, k: v.k, panelas: v.panelas, tipo: v.tipo };
}
// A 1ª vez (regra de 13/10: toda primeira vez tem seta e frase no lugar, e elas somem depois): no dia do 1º convite
// (G.limpou.convite_tarde_dia) a seta vai junto (guia_setas.js, a missão 'convite', logo depois da Mercearia urgente); nos outros dias
// o convite é só a linha do Agora, e o clique nela acende a seta (como as ideias). → o alvo da seta, ou null.
function conviteGuiado() {
  if (!G.limpou || (G.limpou.convite_tarde_dia && G.limpou.convite_tarde_dia !== G.dia)) return null;
  const c = conviteDaTarde(); if (!c) return null;
  const a = typeof c.alvo === 'function' ? c.alvo() : c.alvo;
  return a && Object.assign({ rotuloFixo: c.rotulo }, a);
}
// ... e a frase: a Rosa conta numa fala (de perto, na Vila; longe, o recado dela), uma vez por save, quando o convite chega ao Agora.
// Ela lembra de descansar: a tarde tem motivo, mas não é para trabalhar sem parar (o dono, 16/10).
let _conviteT = 0;
ATUALIZADORES.push(dt => {
  if ((_conviteT += dt) < 0.5) return; _conviteT = 0;
  // (C9) nunca no meio da pescaria: a fala abria por cima da linha e recolhia o peixe (a s26 achou, com a melhora na praia)
  if (!G.limpou || G.limpou.convite_tarde_dia || !agoraFamilia.convite || menuAberto() || G.linha || (typeof noPalco === 'function' && noPalco())) return;
  // (C10, revisão) nem por cima da caixa de dica (a aula da pesca do Lourival, o passo do Bira): a fala espera a dica fechar
  if (typeof guiaPasso === 'function' && guiaPasso()) return;
  const c = conviteDaTarde(); if (!c) return;
  G.limpou.convite_tarde_dia = G.dia;
  const v = c.convite, perto = G.mapaId === 'vila' || /^pensao/.test(G.mapaId || '');
  // (C9) a melhora: a fala dela já começa por "A janta já tá garantida, mas..."
  const abre = v.tipo === 'melhora' ? minusculaInicial(v.fala) : `${v.quem ? `${v.quem} janta hoje e vai pedir ${Pratos.PRATOS[v.prato].nome}, e ` : 'pra janta de hoje '}falta ${nomeNaPanela(v.k)}. ${v.fala}`;
  abrirConversa(perto ? 'Rosa' : 'Recado da Rosa', urlArte('retratos/rosa_normal'), [`Jocelino, ${abre} A seta te mostra onde. Depois descansa um pouco, que a noite é puxada!`]);
});
// Depois das 17h, sem nada a fazer: dormir na cama de casa encerra o dia (a seta: o quintal, a porta de casa, a cama).
function dormirDaNoite() {
  const casa = G.casa && G.casa.mudou ? 'casa_familia' : 'casa_juca';
  return { texto: 'Dormir — o dia de trabalho acabou: deite na cama de casa (botão direito) e o dia termina; o resumo da noite mostra quanto você ganhou',
    alvo: () => typeof naCasa === 'function' && naCasa() ? { mapa: G.mapaId, objeto: 'cama' } : G.mapaId === 'quintal' ? { mapa: 'quintal', objeto: casa } : { mapa: 'quintal' }, rotulo: 'Dormir na cama de casa' };
}
// A primeira tarde livre (uma vez por save, G.limpou.tarde_livre): no quintal o Tio Juca, na Vila a Rosa, numa fala curta.
const FALA_TARDE_LIVRE = {
  quintal: ['Tio Juca', 'retratos/juca_normal', ['Acabou o serviço e ainda tem sol? Tarde livre é pra juntar um trocado: limpa o quintal e vende a madeira e a pedra na caixa de venda, planta mais umas covas ou pesca no píer. Quando escurecer, é só dormir na cama lá de casa: o dia acaba, e de noite você vê quanto ganhou.']],
  vila: ['Rosa', 'retratos/rosa_normal', ['Já acabou por hoje, meu bem? Ainda dá pra ganhar um dinheirinho: limpa o quintal e vende a madeira e a pedra na caixa de venda, planta mais umas covas ou pesca no píer. Quando escurecer, vem dormir na cama de casa: o dia acaba, e de noite a gente vê quanto rendeu.']],
};
let _tardeT = 0;
ATUALIZADORES.push(dt => {
  if ((_tardeT += dt) < 0.5) return; _tardeT = 0;
  const F = FALA_TARDE_LIVRE[G.mapaId];
  if (!F || !G.limpou || G.limpou.tarde_livre || agoraFamilia.tarde !== 'tarde' || tardeLivre() !== 'tarde' || menuAberto()) return;
  G.limpou.tarde_livre = 1; abrirConversa(F[0], urlArte(F[1]), F[2]);
});
// A seta da ideia do dia: o clique no Agora fixa a linha 'ideia_dia'; a seta (guia_setas.js) a lê aqui, como lê as da Caderneta.
if (typeof Caderneta !== 'undefined') { const _linha = Caderneta.linha; Caderneta.linha = id => id === IDEIA_DIA ? (d => d && Object.assign({ id: IDEIA_DIA, aba: 'hoje' }, d))(ideiaDoDia()) : _linha(id); }
// As pendências (os avisos) na Caderneta, aba Hoje: nada se perde por sair da tela.
// (T4) o recado tem linha própria na Caderneta (caderneta.js): fica de fora daqui.
CADERNETA.push(() => (typeof tarefasQuadro === 'function' ? tarefasQuadro() : []).filter(t => !t.recado && !noMapaDaLinha(t)).map((t, i) => ({ id: 'pend_' + i, aba: 'hoje', texto: t.texto + (t.meta ? ` (${t.feito}/${t.meta})` : '') })));
// O cartão no HUD: a meta (título, barrinha e o passo) e o "Agora".
function atualizaCartao(avisos, noSalao) {
  if (!HUD.cartao) return;
  const m = noSalao ? null : metaFamilia();
  HUD.cartao.hidden = !m;
  if (!m) return;
  HUD.cartaoTitulo.textContent = m.titulo;
  HUD.cartaoNivel.style.width = Math.round(100 * Math.min(1, m.meta ? m.feito / m.meta : 1)) + '%';
  HUD.cartaoTexto.textContent = m.texto;
  HUD.cartaoAgora.textContent = 'Agora: ' + agoraFamilia(avisos);
  // (C4, 16/10; o pedido da C3) "Limpar o quintal: N de T" ganha a barrinha de baixo (o trilho de madeira, como a da meta), com a conta.
  if (HUD.cartaoConta) { const q = /^Agora: Limpar o quintal/.test(HUD.cartaoAgora.textContent) && typeof QuintalMarcos !== 'undefined' && G.quintalMarcos ? QuintalMarcos.total() : 0;
    HUD.cartaoConta.hidden = !q;
    if (q) { const f = Math.max(0, q - QuintalMarcos.restantes()), m = QuintalMarcos.proximo();
      HUD.cartaoContaTexto.textContent = `O quintal: ${f} de ${q}${m ? ` (o presente em ${m}%)` : ''}`; HUD.cartaoContaNivel.style.width = Math.round(100 * Math.min(1, f / q)) + '%'; } }
  // (a ideia vira seta com um clique; de novo, tira)
  HUD.cartaoAgora._ideia = agoraFamilia.ideia; HUD.cartaoAgora.classList.toggle('ideia', !!agoraFamilia.ideia || !!G.setaFixa);
  // (C3) o clique no Agora troca a meta da seta: a meta fixa do dia (G.guia.fixa, guia_setas.js) é escolhida de novo
  if (!HUD.cartaoAgora.onclick) HUD.cartaoAgora.onclick = () => { const id = HUD.cartaoAgora._ideia; if (G.setaFixa) G.setaFixa = null; else if (id) G.setaFixa = id; if (G.guia) G.guia.fixa = null; hudSujo(); };
}
