// Jocelino — cartao.js — o cartão da família (13/10: "o jogo precisa ter um norte e a pessoa saber o porquê de cada coisa").
// Como é no Stardew: o HUD não tem lista de missões; o norte é a fazenda do avô e o Centro Comunitário, e o diário fica num
// botão. Aqui (divergência pequena e de propósito, o jogador pediu um norte): um cartão discreto no canto com a META DA
// FAMÍLIA (a casa própria no terreno do Tio Juca: primeiro aprender o ofício, depois juntar etapa por etapa) e uma linha
// "Agora" com uma sugestão só e o porquê. O quadro de tarefas fica só com o trabalho na mão (as linhas com `mapa`, no mapa
// delas); os avisos (sem `mapa`) disputam o "Agora" e ficam todos na Caderneta.

// A meta da família: { titulo, texto, feito, meta }.
function metaFamilia() {
  if (!G.obra) return null;
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
    const E = ECO.casa.etapas[Math.min(casa.etapa || 0, ECO.casa.etapas.length - 1)];
    return { titulo: 'A casa da família', texto: `${E.nome}: Cr$ ${E.dinheiro} e o material (plaquinha no terreno do quintal)`, feito: Math.min(Math.max(0, G.dinheiro), E.dinheiro), meta: E.dinheiro };
  }
  const f = Obra.falta(1), r = REQUISITOS_FUNCAO[1];
  const meta = r.obras + r.alvenaria + r.empreitas, falta = f ? f.obras + f.alvenaria + f.empreitas : 0;
  return { titulo: 'A casa da família', texto: `Para começar a casa: virar meio-oficial na obra do Bira (${f && falta ? faltaFuncao(f) : 'fale com o Bira!'})`, feito: meta - falta, meta };
}
const faltaFuncao = f => { const p = [f.obras ? `entregar ${f.obras} obra${f.obras > 1 ? 's' : ''}` : '', f.alvenaria ? `subir ${f.alvenaria} ${f.alvenaria > 1 ? 'níveis' : 'nível'} de Alvenaria` : '', f.empreitas ? `fazer ${f.empreitas} serviço(s) do quadro` : ''].filter(Boolean); return p.length ? 'falta: ' + p.join(', ') : 'pronto'; };
// A linha do trabalho na mão (o quadro) vale no mapa dela; 'pensao' vale no salão e na cozinha.
// (revisão: o que é da pensão aberta — as ★ da Rosa, o VIP, o concurso — aparece também na Vila, onde ela fica)
const noMapaDaLinha = t => !!t.mapa && (t.mapa === G.mapaId || (t.mapa === 'pensao' && (/^pensao/.test(G.mapaId || '') || G.mapaId === 'vila')));
// O "Agora": a obra pela metade fora da Vila; a carta do guia; o passo do guia em palavras de gente; o serviço aceito em
// outro mapa; o primeiro aviso; uma ideia da Caderneta (que o clique transforma em seta: agoraFamilia.ideia).
function agoraFamilia(avisos = []) {
  agoraFamilia.ideia = null;
  // (13/10) A aula de cada ferramenta, no quintal: o Agora diz o mesmo que a seta (a fala do Tio Juca).
  { const sa = typeof setaAgora === 'function' && G.mapaId === 'quintal' ? setaAgora() : null; if (sa && sa.missao === 'aula' && sa.aula) return 'Aula do Tio Juca: ' + sa.aula.fala; }
  const l = G.obra && typeof listaDeHoje === 'function' ? listaDeHoje() : null;
  if (l && !l.paga && !l.fechado && G.mapaId !== 'vila' && typeof Obra !== 'undefined' && !Obra.aberta(G.dia, G.minutos)) {
    const falta = Object.keys(l.metas).filter(id => (l.feito[id] || 0) < l.metas[id]).length;
    return falta ? `A obra do Bira está pela metade: faltam ${falta} tarefa(s) da lista (Cr$ ${Obra.diaria()} o dia)` : 'A lista da obra está completa: receba a diária com o Bira';
  }
  const g = G.guia;
  if (g && g.ativo && G.correio) for (const id of g.abertas) { const m = Guia.missao(id); if (m && m.carta && G.correio.caixa.includes(m.carta)) return `Chegou carta de ${m.quem}: a caixa de correio, no quintal`; }
  // (revisão) O que é só de hoje (o VIP, a festa, o concurso, o viajante, a ferramenta pronta, a promoção) passa na frente do guia.
  const urg = avisos.find(t => t.urgente); if (urg) return urg.texto;
  // (o Agora diz o mesmo que a seta: o passo cujo lugar é o mapa de agora vem primeiro)
  const sm = typeof setaAgora === 'function' ? setaAgora() : null, daSeta = sm && g && g.abertas.includes(sm.missao) ? [sm.missao] : [];
  if (g && g.ativo && typeof _missoesDaSeta === 'function') for (const id of daSeta.concat(_missoesDaSeta())) {
    const m = Guia.missao(id); if (!m) continue;
    // (revisão) Não mandar para o que está fechado agora: a obra fora do horário (domingo, chuva, depois das 17h), a janta sem pensão.
    if (id === 'obra' && typeof Obra !== 'undefined' && Obra.aberta(G.dia, G.minutos)) continue;
    if (id === 'janta' && typeof pensaoAbreHoje === 'function' && !pensaoAbreHoje()) continue;
    // (revisão final) A reforma de hoje já foi (o material todo e o dia trabalhado): a pensão cede, e vem o que o dia ainda tem.
    if (id === 'pensao' && G.pensao && G.pensao.feitaHoje && G.pensao.feitaHoje(G.dia)) continue;
    const txt = typeof m.agora === 'function' ? m.agora() : (m.agora || m.texto);
    return txt + (m.meta ? ` (${Guia.progresso(m)}/${m.meta})` : '');
  }
  if (G.empreitas) for (const cid of Object.keys(G.empreitas.aceitas)) { const E = dadosEmpreita(cid), a = G.empreitas.aceitas[cid];
    if (E && E.mapa !== G.mapaId && !(typeof E.familia === 'string' && a.estado === 'reservada')) return `O serviço aceito: ${E.nome} (${typeof ondeFica === 'function' ? ondeFica(E.mapa) : E.mapa})`; }
  if (avisos.length) return avisos[0].texto;
  // (13/10) Dia vazio: uma sugestão só, com o porquê (a seta é a linha 'ideia_dia', ver Caderneta.linha mais abaixo).
  const d = ideiaDoDia();
  if (d) { agoraFamilia.ideia = IDEIA_DIA; return d.texto; }
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
function ideiaDoDia() {
  const op = [];
  const prontas = Object.entries((G.horta || {}).covas || {}).filter(([, c]) => c.planta && Horta.madura(c));
  if (prontas.length) { const [x, y] = prontas[0][0].split(',').map(Number);
    op.push({ texto: `Colher a horta — ${prontas.length} pé(s) pronto(s): comida para a família e venda na caixa`, alvo: { mapa: 'quintal', ponto: { x: (x + 0.5) * TILE, y: y * TILE } }, rotulo: 'Botão direito: colher' }); }
  if (typeof QuintalMarcos !== 'undefined' && G.quintalMarcos && QuintalMarcos.proximo())
    op.push({ texto: `Limpar o quintal — mais chão para plantar e o presente do Tio Juca em ${QuintalMarcos.proximo()}%`, alvo: typeof _alvoLimparQuintal === 'function' ? _alvoLimparQuintal : { mapa: 'quintal' } });
  if (G.casa && G.casa.aberta && !G.casa.mudou) { const E = ECO.casa.etapas[Math.min(G.casa.etapa || 0, ECO.casa.etapas.length - 1)], T = QUINTAL.TERRENO;
    op.push({ texto: `A casa nova — ${E.nome}, na plaquinha do terreno do quintal: é a casa da família`, alvo: { mapa: 'quintal', ponto: { x: (T.x + T.w / 2) * TILE, y: (T.y + T.h / 2) * TILE } } }); }
  // (revisão final) Para onde vai o dinheiro do bico: antes do sonho da Rosa, só na hora; antes da compra, a lojinha; depois, a pensão.
  if (typeof Guia !== 'undefined' && Guia.liberado('quadro')) { const L = G.lojinha || {};
    op.push({ texto: `Um serviço do quadro da Vila — ${L.comprada ? 'paga na hora, e o dinheiro vai para a pensão' : L.conversou ? 'paga na hora, e o dinheiro vai para a lojinha da Rosa' : 'dinheiro na hora, no bolso da família'}`, alvo: { mapa: 'vila', objeto: 'quadro_pedidos' } }); }
  if (G.lugares && G.lugares.praia) op.push({ texto: 'Pescar no píer — peixe vira prato na pensão', alvo: { mapa: 'praia', morador: 'lourival' } });
  // O sonho da Rosa (o restaurante): a entrada da lojinha, e depois a reforma pela metade.
  if (G.lojinha && G.lojinha.conversou && !G.lojinha.comprada) op.push({ texto: `Juntar a entrada da lojinha — Cr$ ${Math.min(Math.max(0, G.dinheiro), ECO.lojinha.entrada)} de ${ECO.lojinha.entrada}: é o sonho da Rosa, o restaurante dela`, alvo: { mapa: 'vila', objeto: 'pensao' } });
  else if (G.pensao && (G.pensao.estado === 'limpar' || ECO.reforma.some(e => e.id === G.pensao.estado)) && !G.pensao.feitaHoje(G.dia)) op.push({ texto: 'Tocar a reforma da pensão — a Rosa só abre o restaurante com o salão pronto', alvo: { mapa: 'vila', objeto: 'pensao' } });
  if (!op.length) return null;
  const o = op[G.dia % op.length];
  return Object.assign({ rotulo: o.texto.split(' — ')[0] }, o);
}
// A seta da ideia do dia: o clique no Agora fixa a linha 'ideia_dia'; a seta (guia_setas.js) a lê aqui, como lê as da Caderneta.
if (typeof Caderneta !== 'undefined') { const _linha = Caderneta.linha; Caderneta.linha = id => id === IDEIA_DIA ? (d => d && Object.assign({ id: IDEIA_DIA, aba: 'hoje' }, d))(ideiaDoDia()) : _linha(id); }
// As pendências (os avisos) na Caderneta, aba Hoje: nada se perde por sair da tela.
CADERNETA.push(() => (typeof tarefasQuadro === 'function' ? tarefasQuadro() : []).filter(t => !noMapaDaLinha(t)).map((t, i) => ({ id: 'pend_' + i, aba: 'hoje', texto: t.texto + (t.meta ? ` (${t.feito}/${t.meta})` : '') })));
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
  // (a ideia vira seta com um clique; de novo, tira)
  HUD.cartaoAgora._ideia = agoraFamilia.ideia; HUD.cartaoAgora.classList.toggle('ideia', !!agoraFamilia.ideia || !!G.setaFixa);
  if (!HUD.cartaoAgora.onclick) HUD.cartaoAgora.onclick = () => { const id = HUD.cartaoAgora._ideia; if (G.setaFixa) G.setaFixa = null; else if (id) G.setaFixa = id; hudSujo(); };
}
