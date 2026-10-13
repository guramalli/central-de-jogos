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
function metaDaBarrinha() {
  const mil = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'), f = m => Math.max(0, Math.min(G.dinheiro, m)), de = m => `${mil(f(m))}/${mil(m)}`;
  const lj = typeof Lojinha !== 'undefined' ? Lojinha.metaDinheiro() : null;
  if (lj) return { tipo: 'lojinha', curto: lj.curto, texto: `${lj.texto} de entrada (a fachada amarela, na Vila)`, feito: lj.feito, meta: lj.meta };
  const b = typeof Bazar !== 'undefined' && G.bazar ? Bazar.metaEscolhida() : null;
  if (b) return { tipo: 'bazar', curto: `${b.nome}: ${b.curto} — ${de(b.preco)}`, texto: `Juntando para: ${b.nome} (${b.curto}) — Cr$ ${de(b.preco)}`, feito: f(b.preco), meta: b.preco };
  { const c = casaEtapas(), E = c && c.juntar;   // (revisão 3: a etapa em obra já foi paga; a barrinha junta para a seguinte, ou some)
    if (E) return { tipo: 'casa', curto: `Casa nova, ${E.nome}: Cr$ ${de(E.dinheiro)}`, texto: `${c.emObra ? `A casa nova: ${c.atual.nome} em obra; juntando para a próxima, ${E.nome}` : `A casa nova (${E.nome})`}: Cr$ ${de(E.dinheiro)} e o material, na plaquinha do terreno`, feito: f(E.dinheiro), meta: E.dinheiro }; }
  const p = G.pensao;
  if (p && p.estado === 'aberta' && typeof MELHORIAS !== 'undefined') { const m = Object.entries(MELHORIAS).filter(([id, x]) => !p.melhorias.includes(id) && p.grau() >= x.grau && !x.premio).sort((a, c) => a[1].preco - c[1].preco)[0];
    if (m) return { tipo: 'melhoria', curto: `${m[1].nome}, para o salão: ${de(m[1].preco)}`, texto: `Juntando para o salão da pensão: ${m[1].nome} — Cr$ ${de(m[1].preco)}`, feito: f(m[1].preco), meta: m[1].preco }; }
  return null;
}
// A linha do trabalho na mão (o quadro) vale no mapa dela; 'pensao' vale no salão e na cozinha.
// (revisão: o que é da pensão aberta — as ★ da Rosa, o VIP, o concurso — aparece também na Vila, onde ela fica)
const noMapaDaLinha = t => !!t.mapa && (t.mapa === G.mapaId || (t.mapa === 'pensao' && (/^pensao/.test(G.mapaId || '') || G.mapaId === 'vila')));
// O "Agora": a obra pela metade fora da Vila; a carta do guia; o passo do guia em palavras de gente; o serviço aceito em
// outro mapa; o primeiro aviso; uma ideia da Caderneta (que o clique transforma em seta: agoraFamilia.ideia).
function agoraFamilia(avisos = []) {
  agoraFamilia.ideia = null; agoraFamilia.tarde = '';
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
  // (revisão 3) Depois das 17h, sem nada mais (a noite livre), o Dormir vale mesmo com serviço aceito; e o serviço curto aceito no mapa
  // de agora também aparece no Agora (antes só o de outro mapa).
  if (G.empreitas && tardeLivre() !== 'noite') for (const cid of Object.keys(G.empreitas.aceitas)) { const E = dadosEmpreita(cid), a = G.empreitas.aceitas[cid];
    if (E && E.mapa !== G.mapaId && !(typeof E.familia === 'string' && a.estado === 'reservada')) return `O serviço aceito: ${E.nome} (${typeof ondeFica === 'function' ? ondeFica(E.mapa) : E.mapa})`;
    if (E && E.mapa === G.mapaId && E.tipo === 'curta') return `O serviço aceito, aqui mesmo: ${E.nome} (a seta mostra onde)`; }
  if (avisos.length) return avisos[0].texto;
  // (13/10) Dia vazio: uma sugestão só, com o porquê (a seta é a linha 'ideia_dia', ver Caderneta.linha mais abaixo). Na tarde livre
  // (teste de 13/10: o serviço do dia feito, o quadro vazio), ela diz como ganhar dinheiro até o fim da tarde, ou de dormir.
  const d = ideiaDoDia();
  if (d) { agoraFamilia.ideia = IDEIA_DIA; agoraFamilia.tarde = tardeLivre(); return d.texto; }
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
const TOCAR_REFORMA = { texto: 'Tocar a reforma da pensão — a Rosa só abre o restaurante com o salão pronto', alvo: { mapa: 'vila', objeto: 'pensao' } };
// A reforma de hoje pendente: limpar o salão, ou a etapa com o material todo entregue e o dia de hoje ainda não trabalhado.
function reformaDoDia() {
  const p = G.pensao; if (!p || !(p.estado === 'limpar' || ECO.reforma.some(e => e.id === p.estado))) return null;
  if (p.estado !== 'limpar' && (Object.keys(p.faltaMaterial()).length || p.feitaHoje(G.dia) || p.comecaAmanha(G.dia))) return null;
  return TOCAR_REFORMA;
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
    return !c.a.trabalhou && fr && !Empreitas.impedeHoje(c.id, chove)
      ? { texto: `A casa nova (${nome}) — o trabalho de hoje (${(typeof NOME_FERRAMENTA !== 'undefined' && NOME_FERRAMENTA[fr]) || fr}) na plaquinha do terreno: é a casa da família`, alvo, rotulo: 'Na plaquinha: o trabalho de hoje na casa' } : null; }
  if (c.estado === 'pronta') return { texto: `A casa nova (${nome}) — a etapa está pronta: entregue na plaquinha do terreno`, alvo, rotulo: 'Na plaquinha: entregar a etapa' };
  return null;
}
function ideiaDoDia() {
  // (revisão de 13/10) O que é de hoje vem antes do ganho da tarde: 1) a reforma do dia pendente (o material todo e o dia ainda
  // não trabalhado); 2) colher os pés prontos; 3) a casa nova do dia (casaDoDia); 4) só então a tarde livre (ganhar dinheiro, ou dormir).
  const ref = reformaDoDia(); if (ref) return Object.assign({ rotulo: ref.texto.split(' — ')[0] }, ref);
  const prontas = Object.entries((G.horta || {}).covas || {}).filter(([, c]) => c.planta && Horta.madura(c));
  const colher = prontas.length && (([x, y]) => ({ texto: `Colher a horta — ${prontas.length} pé(s) pronto(s): comida para a família e para a pensão da Rosa`, alvo: { mapa: 'quintal', ponto: { x: (x + 0.5) * TILE, y: y * TILE } }, rotulo: 'Botão direito: colher' }))(prontas[0][0].split(',').map(Number));
  if (colher) return colher;
  const casa = casaDoDia(); if (casa) return casa;   // (revisão 3) 3) a casa do dia; 4) só então o ganho da tarde
  { const t = tardeLivre(), g = t === 'tarde' ? ganhoDaTarde() : t === 'noite' ? dormirDaNoite() : null; if (g) return Object.assign({ rotulo: g.texto.split(' — ')[0] }, g); }
  const op = [];
  if (typeof QuintalMarcos !== 'undefined' && G.quintalMarcos && QuintalMarcos.proximo())
    op.push({ texto: `Limpar o quintal — mais chão para plantar e o presente do Tio Juca em ${QuintalMarcos.proximo()}%`, alvo: typeof _alvoLimparQuintal === 'function' ? _alvoLimparQuintal : { mapa: 'quintal' } });
  if (G.casa && G.casa.aberta && !G.casa.mudou) { const E = ECO.casa.etapas[Math.min(G.casa.etapa || 0, ECO.casa.etapas.length - 1)], T = QUINTAL.TERRENO;
    op.push({ texto: `A casa nova — ${E.nome}, na plaquinha do terreno do quintal: é a casa da família`, alvo: { mapa: 'quintal', ponto: { x: (T.x + T.w / 2) * TILE, y: (T.y + T.h / 2) * TILE } } }); }
  // (revisão final) Para onde vai o dinheiro do bico: antes do sonho da Rosa, só na hora; antes da compra, a lojinha; depois, a pensão.
  // (teste de 13/10) Só com serviço no quadro: o quadro vazio mandava o jogador para lá à toa.
  if (quadroComServico()) { const L = G.lojinha || {};
    op.push({ texto: `Um serviço do quadro da Vila — ${L.comprada ? 'paga na hora, e o dinheiro vai para a pensão' : L.conversou ? 'paga na hora, e o dinheiro vai para a lojinha da Rosa' : 'dinheiro na hora, no bolso da família'}`, alvo: { mapa: 'vila', objeto: 'quadro_pedidos' } }); }
  if (G.lugares && G.lugares.praia) op.push({ texto: 'Pescar no píer — peixe vira prato na pensão', alvo: { mapa: 'praia', morador: 'lourival' } });
  // O sonho da Rosa (o restaurante): a entrada da lojinha, e depois a reforma pela metade.
  if (G.lojinha && G.lojinha.conversou && !G.lojinha.comprada) op.push({ texto: `Juntar a entrada da lojinha — Cr$ ${Math.min(Math.max(0, G.dinheiro), ECO.lojinha.entrada)} de ${ECO.lojinha.entrada}: é o sonho da Rosa, o restaurante dela`, alvo: { mapa: 'vila', objeto: 'pensao' } });
  else if (G.pensao && (G.pensao.estado === 'limpar' || ECO.reforma.some(e => e.id === G.pensao.estado)) && !G.pensao.feitaHoje(G.dia)) op.push(TOCAR_REFORMA);
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
  && G.empreitas.quadro.some(id => { const E = dadosEmpreita(id); return E && (E.tipo !== 'longa' || Empreitas.longasContadas() < Empreitas.limite()); });
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
    return a.estado === 'pronta' || (a.estado === 'obra' && !a.trabalhou && !!Empreitas.ferramentaHoje(id) && !Empreitas.impedeHoje(id, chove)); });
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
// O material que a família ainda vai usar (a reforma da pensão, a etapa da casa) não entra na sugestão de venda.
function materialGuardado() {
  const r = {}, p = G.pensao;
  if (p && typeof p.faltaMaterial === 'function' && ECO.reforma.some(e => e.id === p.estado)) Object.assign(r, p.faltaMaterial());
  { const c = casaEtapas(); if (c && c.juntar) Object.assign(r, c.juntar.material || {}); }
  return r;
}
// (revisão de 13/10) A colheita e o peixe são o prato da pensão (o coração do jogo): nunca entram na venda. Vende-se só o que a pensão
// não usa: a madeira, a pedra, a fibra e a coleta do chão (com a pensão aberta, a fruta que a Rosa usa vai para a despensa dela).
const ACHADOS_TODOS = () => typeof ACHADOS_ESTACAO === 'undefined' ? [] : [...new Set([].concat(...ACHADOS_ESTACAO, ...ACHADOS_MATA, ACHADOS_PRAIA).map(([id]) => id))];
const pensaoAberta = () => !!G.pensao && G.pensao.estado === 'aberta';
const usaNaPensao = id => id !== 'pedra' && typeof Pratos !== 'undefined' && !!Pratos.INGREDIENTES[id];
const VENDE_NA_TARDE = () => ['madeira', 'pedra', 'fibra'].concat(ACHADOS_TODOS()).filter(id => !(pensaoAberta() && usaNaPensao(id)));
const DETS_DO_QUINTAL = ['galho', 'pedra', 'toco', 'pedregulho', 'arvore'];
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
  const pr = id => CaixaVenda.preco(id), porque = porqueDoDinheiro(), guarda = materialGuardado();
  // 0. Com a pensão aberta, o ingrediente da mochila (a colheita, o peixe, a fruta) vai para a despensa da Rosa: vira o prato da janta.
  if (pensaoAberta()) { const ing = Object.keys(Pratos.INGREDIENTES).filter(id => usaNaPensao(id) && G.mochila.total(id) > 0 && G.pensao.aceita(id)).sort((a, b) => G.mochila.total(b) - G.mochila.total(a));
    if (ing.length) return { texto: `Guardar na despensa da Rosa — ${ing.slice(0, 2).map(id => Itens.qtd(G.mochila.total(id), id)).join(' e ')}${ing.length > 2 ? ' e mais' : ''}: entre na pensão e a Rosa guarda; na janta vira prato, e prato vendido é a pensão crescendo`,
      alvo: { mapa: 'vila', objeto: 'pensao' }, rotulo: 'Entrar na pensão: a Rosa guarda' }; }
  // 1. O que já está na mochila e a pensão não usa: a caixa de venda do quintal (o carroceiro paga de madrugada).
  const itens = VENDE_NA_TARDE().filter(id => G.mochila.total(id) > 0 && pr(id) > 0 && !guarda[id]).map(id => ({ id, n: G.mochila.total(id), v: pr(id) })).sort((a, b) => b.n * b.v - a.n * a.v);
  const total = itens.reduce((t, i) => t + i.n * i.v, 0);
  if (itens.length && total >= 10) { const i = itens[0];
    return { texto: `Vender na caixa de venda do quintal — ${Itens.qtd(i.n, i.id)} a Cr$ ${i.v} cada${itens.length > 1 ? ` (tudo o que dá para vender: Cr$ ${total})` : ` = Cr$ ${total}`}; o carroceiro paga de madrugada, ${porque}`,
      alvo: { mapa: 'quintal', objeto: 'caixa_venda' }, rotulo: 'Botão direito: vender na caixa' }; }
  // 1b. (dia cheio, Frente A) A coleta à vista hoje (os achados que nasceram nos mapas já vistos): o mais valioso dá o preço do ECO.
  { const ach = achadosAVista(); if (ach.n) { const id = ach.melhor, nome = Itens.nome(id).toLowerCase(), rosa = pensaoAberta() && usaNaPensao(id);
    // (revisão 3) o nome do que se cata vem do melhor achado: fruta, flor, cogumelo; a pedra bonita e a concha são "achados"
    const tipo = ['flor'].includes(id) ? 'flor' : id === 'cogumelo' ? 'cogumelo' : ['pedra_bonita', 'concha'].includes(id) ? 'achados' : 'fruta';
    return { texto: `Catar ${tipo} ${ach.onde} — ${ach.n} ${ach.n === 1 ? 'achado' : 'achados'} hoje: ${rosa ? `${nome} vai para a despensa da Rosa` : `${nome} vale Cr$ ${pr(id)} na caixa de venda`}; ${porque}`,
      alvo: () => { const o = (G.mapa && G.jog ? G.mapa.objs.filter(x => x.achado) : []).sort((a, b) => Math.hypot(a.x - G.jog.x, a.y - G.jog.y) - Math.hypot(b.x - G.jog.x, b.y - G.jog.y))[0];
        return o ? { mapa: G.mapaId, ponto: { x: o.x, y: o.y - 40 } } : { mapa: ach.mapas[0] }; }, rotulo: 'Botão direito: catar' }; } }
  // 2. O quintal com galho e pedra: limpar dá madeira e pedra para a caixa (e o presente do Tio Juca).
  const Q = typeof MAPAS !== 'undefined' && MAPAS.quintal, dets = Q ? Q.objs.filter(o => o.tipo === 'detrito' && DETS_DO_QUINTAL.includes(o.det)).length : 0;
  if (dets) { const m = typeof QuintalMarcos !== 'undefined' && G.quintalMarcos ? QuintalMarcos.proximo() : null;
    return { texto: `Limpar o quintal — o galho vira madeira (Cr$ ${pr('madeira')} cada na caixa de venda), a pedra vende a Cr$ ${pr('pedra')}: ${porque}${m ? `, e o Tio Juca dá um presente em ${m}% limpo` : ''}`,
      alvo: typeof _alvoLimparQuintal === 'function' ? _alvoLimparQuintal : { mapa: 'quintal' }, rotulo: 'Limpar o quintal: madeira e pedra para vender' }; }
  // 3. Plantar: a semente mais barata da estação vira colheita (a comida da família e o prato da pensão; o valor só para medir).
  if (typeof sementesDaLoja === 'function') { const s = sementesDaLoja().map(culturaDaSemente).filter(Boolean).sort((a, b) => CULTURAS[a].dias - CULTURAS[b].dias)[0];
    if (s && G.dinheiro >= precoSemente(CULTURAS[s].semente)) return { texto: `Plantar mais covas — ${Itens.nome(CULTURAS[s].semente).toLowerCase()} no depósito do Seu Ananias a Cr$ ${precoSemente(CULTURAS[s].semente)}; em ${Horta.diasPara(s)} dias regando, cada pé (que vale Cr$ ${PRECO_CAIXA[s]}) é comida da família e prato da pensão da Rosa`,
      alvo: { mapa: 'vila', objeto: 'deposito' }, rotulo: 'Sementes no Seu Ananias' }; }
  // 4. Pescar no píer (a praia aberta): o peixe é o prato da pensão (o preço dos de todo dia, a sardinha e a tainha, só para medir).
  if (G.lugares && G.lugares.praia && pr('sardinha') && pr('tainha'))
    return { texto: `Pescar no píer — o peixe é o prato da pensão da Rosa (a sardinha vale Cr$ ${pr('sardinha')}, a tainha Cr$ ${pr('tainha')}); a vara é do Seu Lourival`, alvo: { mapa: 'praia', morador: 'lourival' } };
  return null;
}
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
