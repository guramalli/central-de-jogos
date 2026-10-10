// Jocelino — empreitas_jogo.js — as empreitas no mundo: o quadro da Vila com as abas Pensão e Serviços, a plaquinha
// das curtas aceitas no lugar do serviço (e o entulho/mato a limpar quando o serviço é limpeza), o lote das longas
// com a arte da etapa, as cartas de pedido, o resumo da noite e as linhas do quadro de tarefas.

// O chão livre mais perto do lugar pedido (o lote não cai em cima de nada nem na água).
function lugarLivre(b, x, y) {
  for (let r = 0; r < 6; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    const tx = x + dx, ty = y + dy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r || !b.livreEm(tx, ty) || b.ocupado.has(chaveT(tx, ty)) || b.ehAgua(tx, ty) || b.saidaEm(tx, ty)) continue;
    return { x: tx, y: ty };
  }
  return { x, y };
}
const LIMPEZA = { limpar_trilha: 'mato', desentulhar_ananias: 'entulho' };
const TEXTO_RESULTADO = { material: 'Falta material: ', ferramenta: 'Isso pede ', feito_hoje: 'Por hoje chega: amanhã continua.' };

// O terreno do lote fica limpo (o cliente tirou o mato e o toco do lugar da obra).
function limparLote(b, E) { for (const t of tilesDoLote(E)) { const o = b.ocupado.get(chaveT(t.x, t.y)); if (o && o.tipo === 'detrito') b.tirar(o); } }
// A capina: o mato nasce no terreno do Ananias no aceite e a cada 3 dias (6 matos, completando os que ficaram).
function brotarCapina(b) {
  const c = G.empreitas && G.empreitas.capina, C = EMPREITAS_EXTRAS.capina_ananias;
  if (!c || b.id !== C.mapa || c.nasceu === G.dia || !Empreitas.capinaNasce(G.dia)) return;
  c.nasceu = G.dia; c.limpo = false;
  const f = mulberry(G.dia * 53 + 7);
  for (let k = 0; k < 80 && c.pos.length < C.matos; k++) {
    const q = lugarLivre(b, C.x + Math.floor(f() * 5) - 2, C.y + Math.floor(f() * 3) - 1);
    if (c.pos.some(([x, y]) => x === q.x && y === q.y)) continue;
    if (b.detrito('mato', q.x, q.y)) c.pos.push([q.x, q.y]);
  }
}
function poeEmpreitasNoMapa(b) {
  for (const o of b.objs.filter(o => o.empreita || o.empreitaDet || o.feita)) b.tirar(o);
  if (!G.empreitas) return;
  // As obras entregues ficam no mapa (a Vila cresce com o que o Jocelino constrói); pegar de novo vira reforma.
  for (const id in G.empreitas.feitas || {}) {
    const E = EMPREITAS_LONGAS[id]; if (!E || E.mapa !== b.id || G.empreitas.aceitas[id]) continue;
    limparLote(b, E);
    const arte = E.artes[E.artes.length - 1], q = G.empreitas.feitas[id], h = E.area ? E.area.h : 1;
    const o = b.interativo('feita_' + id, ARTE_LISTA.includes(arte) ? arte : 'objetos/alicerce', E.x, E.y + h - 1, larguraLote(E), h, null, !E.piso);
    // O piso pronto: a textura de piso recortada na área (por baixo de quem pisa).
    if (E.area) { o.y = E.y * TILE; o.desenha = ctx => { const img = spr(E.area.textura); if (img) ctx.drawImage(img, 0, 0, E.area.w * TILE, E.area.h * TILE, E.x * TILE, E.y * TILE, E.area.w * TILE, E.area.h * TILE); }; }
    o.feita = id; o.acao = () => { abrirPlaca(`${E.nome}, para ${CLIENTE_NOME[E.cliente] || ''}: obra do Jocelino${q > 1 ? ' (' + ({ 1.25: 'bom', 1.5: 'caprichado', 2: 'impecável' }[q] || '') + ')' : ''}.`); return true; };
  }
  for (const id in G.empreitas.aceitas) {
    const E = dadosEmpreita(id), a = G.empreitas.aceitas[id];
    if (!E || E.mapa !== b.id) continue;
    if (E.tipo === 'longa' && EMPREITAS_LONGAS[id]) limparLote(b, E);
    const p = lugarLivre(b, E.x, E.y);
    if (E.tipo === 'curta') {
      const o = b.interativo('emp_' + id, 'objetos/plaquinha', p.x, p.y, 1, 1, [8, 6]);
      o.empreita = id;
      o.acao = () => acaoEmpreita(id);
      o.ferramenta = (obj, ferr) => golpeEmpreita(id, ferr);
      // Limpeza: os detritos de verdade em volta da placa; cada um que sai conta.
      if (LIMPEZA[id]) {
        const falta = E.vezes - (a.vezes || 0), f = mulberry(a.dia * 37 + id.length);
        for (let k = 0, n = 0; k < 80 && n < falta; k++) {
          const q = lugarLivre(b, p.x + Math.floor(f() * 7) - 3, p.y + Math.floor(f() * 5) - 2), d = b.detrito(LIMPEZA[id], q.x, q.y);
          if (d) { d.empreitaDet = id; n++; }
        }
      }
    } else {
      // A plaquinha do serviço (desde a reserva); o lote com a arte da etapa só depois de começar.
      const q = lugarLivre(b, p.x - 1, p.y), pl = b.interativo('emp_placa_' + id, 'objetos/plaquinha', q.x, q.y, 1, 1, [8, 6]);
      pl.empreitaDet = '__placa'; pl.placaDe = id; pl.acao = () => acaoEmpreita(id); pl.ferramenta = (obj, ferr) => golpeEmpreita(id, ferr);
      if (a.estado !== 'reservada') {
        const n = Math.max(1, a.lista.length), k = a.estado === 'obra' ? Math.min(E.artes.length - 1, Math.floor(a.dias / n * E.artes.length)) : E.artes.length - 1;
        const arte = E.artes[k], img = larguraLote(E);
        const o = b.interativo('emp_' + id, ARTE_LISTA.includes(arte) ? arte : 'objetos/alicerce', p.x, p.y, img, 1);
        o.empreita = id; o.acao = () => acaoEmpreita(id); o.ferramenta = (obj, ferr) => golpeEmpreita(id, ferr);
      }
    }
  }
  brotarCapina(b);
}
function golpeEmpreita(id, ferr) {
  const r = Empreitas.trabalhar(id, ferr), E = dadosEmpreita(id), a = G.empreitas.aceitas[id];
  if (r === 'ok') { sons.tocar(ferr === 'machado' ? 'madeira' : ferr === 'regador' ? 'agua' : 'terra', 1.1, 0.05, -6); if (a && a.trabalhou) avisar(`${E.nome}: o serviço de hoje está feito.`); hudSujo(); return; }
  if (r === 'pronta') { sons.tocar('moedas', 1, 0.05, -4); sons.tocar('feito', 1, 0.03, -6); avisar(`${E.nome}: pronto! ${CLIENTE_NOME[E.cliente] || ''} pagou Cr$ ${E.paga}.`); hudSujo(); poeEmpreitasNoMapa(G.mapa); return; }
  if (r === 'estado') { avisar(!a ? '' : a.estado === 'reservada' ? 'Primeiro comece a obra: clique na plaquinha com o material na mochila.' : a.estado === 'pronta' ? 'Está pronta: clique na plaquinha para entregar.' : 'Entregue: o pagamento vem à noite.'); return; }
  if (r === 'concreto') { avisar('Chovendo, o concreto não pega. Hoje a obra espera.'); return; }
  if (r === 'pintura') { avisar('Com chuva não dá para pintar.'); return; }
  if (r === 'material') avisar(TEXTO_RESULTADO.material + Object.entries(E.material).map(([m, q]) => Itens.qtd(q, m)).join(', ') + '.');
  else if (r === 'ferramenta') {
    const pede = E.tipo === 'longa' ? Empreitas.ferramentaHoje(id) : E.ferramenta;
    avisar(G.ferreiro && G.ferreiro.oficina && G.ferreiro.oficina.id === pede ? `Isso pede ${NOME_FERRAMENTA[pede]}, que está com o Seu Tonico na ferraria.`
      : E.tipo === 'longa' ? `Hoje é dia de ${NOME_DIA[pede] || pede}.` : TEXTO_RESULTADO.ferramenta + (NOME_FERRAMENTA[pede] || pede) + '.');
  }
  else if (r === 'feito_hoje') avisar(TEXTO_RESULTADO.feito_hoje);
}
function acaoEmpreita(id) {
  const E = dadosEmpreita(id), a = G.empreitas.aceitas[id];
  if (!a) return true;
  if (E.tipo === 'longa') return acaoLote(id);
  if (E.ferramenta === 'carga') { golpeEmpreita(id, 'carga'); return true; }
  const mat = Object.keys(E.material).length ? ' Material: ' + Object.entries(E.material).map(([m, q]) => Itens.qtd(q, m)).join(', ') + '.' : '';
  const como = LIMPEZA[id] ? `Limpe ${E.vezes} ${LIMPEZA[id] === 'mato' ? 'matos' : 'entulhos'} em volta com ${NOME_FERRAMENTA[E.ferramenta]}.` : `Trabalhe com ${NOME_FERRAMENTA[E.ferramenta] || E.ferramenta}.`;
  abrirPlaca(`${E.nome} para ${CLIENTE_NOME[E.cliente]} (Cr$ ${E.paga}). ${como}${mat}`);
  return true;
}
// A plaquinha da longa: reservada → começar (com o material); pronta → entregar; senão, o que tem para hoje.
function acaoLote(id) {
  const E = dadosEmpreita(id), a = G.empreitas.aceitas[id], quem = CLIENTE_NOME[E.cliente] || '';
  if (typeof aditivoNaPlaquinha === 'function' && aditivoNaPlaquinha(id)) return true;   // (entrega B)
  if (a.estado === 'reservada') {
    const mat = Empreitas.material(id), lista = Object.entries(mat).map(([m, q]) => Itens.qtd(q, m)).join(', ');
    if (Object.keys(mat).some(m => G.mochila.total(m) < mat[m])) { abrirPlaca(`${E.nome} para ${quem}. Para começar, traga na mochila: ${lista}. (${Empreitas.textoEstado(id)})`); return true; }
    perguntar(`${E.nome} para ${quem}: começar a obra? Gasta ${lista}. São ${Empreitas.listaDias(id, a.aditivo).length} dias de serviço.`, ['Começar', 'Agora não'], i => { if (i === 0) comecarObra(id); });
    return true;
  }
  if (a.estado === 'pronta') { Empreitas.entregar(id); sons.tocar('feito', 1, 0.03, -6); avisar(`${E.nome}: entregue! ${quem} paga à noite.`); hudSujo(); poeEmpreitasNoMapa(G.mapa); return true; }
  abrirPlaca(`${E.nome} para ${quem}: ${Empreitas.textoEstado(id)}.`);
  return true;
}
function comecarObra(id) {
  const r = Empreitas.comecar(id, G.mochila);
  if (r === 'ok') { sons.tocar('pousar', 1, 0.05, -4); avisar(`A obra começou! Hoje é dia de ${NOME_DIA[Empreitas.ferramentaHoje(id)]}.`); hudSujo(); poeEmpreitasNoMapa(G.mapa); }
  else avisar('Falta material para começar.');
}
// O ícone da ferramenta do dia em cima da plaquinha (a arte do item, só posicionada); pronta, a exclamação.
EXTRAS_MUNDO.push(m => !G.empreitas ? [] : m.objs.filter(o => o.placaDe && G.empreitas.aceitas[o.placaDe]).map(o => ({ y: o.y + 2, desenha(ctx) {
  const a = G.empreitas.aceitas[o.placaDe], sobe = Math.sin((G.agora || 0) * 3) * 3;
  if (!a) return;
  if (a.estado === 'obra' && !a.trabalhou) desenhaPe(ctx, 'itens/' + Empreitas.ferramentaHoje(o.placaDe), o.x, o.y - 74 + sobe, 1, 0.75);
  else if (a.estado === 'pronta') desenhaFx(ctx, 'exclamacao', o.x, o.y - 74 + sobe);
} })));
function linhaEntrega(r) { const E = dadosEmpreita(r.id); return `Serviço entregue: ${E.nome} para ${CLIENTE_NOME[E.cliente] || ''}, Cr$ ${r.valor}${r.qualidade >= 1.5 ? ' (caprichado!)' : r.qualidade > 1 ? ' (bom)' : ''}.`; }
// A limpeza conta quando o detrito marcado sai.
function quebrouEmpreita(o) {
  const c = G.empreitas && G.empreitas.capina;
  if (c && o.det === 'mato' && G.mapaId === EMPREITAS_EXTRAS.capina_ananias.mapa) {
    const t = o.tiles[0], i = c.pos.findIndex(([x, y]) => x === t.x && y === t.y);
    if (i >= 0) { c.pos.splice(i, 1); if (!c.pos.length) { c.limpo = true; sons.tocar('feito', 1, 0.03, -6); avisar('O terreno do Seu Ananias está limpo! Ele paga à noite.'); } }
  }
  if (!o.empreitaDet || !dadosEmpreita(o.empreitaDet)) return;
  const r = Empreitas.trabalhar(o.empreitaDet, dadosEmpreita(o.empreitaDet).ferramenta);
  if (r === 'pronta') golpeEmpreitaPronta(o.empreitaDet);
}
function golpeEmpreitaPronta(id) { const E = dadosEmpreita(id); sons.tocar('moedas', 1, 0.05, -4); avisar(`${E.nome}: pronto! ${CLIENTE_NOME[E.cliente] || ''} pagou Cr$ ${E.paga}.`); hudSujo(); if (G.mapa) poeEmpreitasNoMapa(G.mapa); }

// ---------- o quadro da Vila: Pensão e Serviços ----------
function abrirQuadro(aba = 'servicos') {
  const caixa = el('div', { class: 'painel quadro-vila' });
  const desenha = () => {
    caixa.innerHTML = '';
    const tab = (id, txt) => el('button', { class: 'botao' + (aba === id ? ' forte' : ''), onclick: e => { e.stopPropagation(); aba = id; desenha(); } }, txt);
    caixa.append(el('div', { class: 'titulo', style: 'font-size:26px' }, 'Quadro de pedidos da Vila'), el('div', { class: 'qv-abas' }, tab('servicos', 'Serviços'), tab('pensao', 'Pensão')));
    if (aba === 'pensao') {
      const p = G.pensao, ps = ((p && p.agenda) || []).filter(e => e.tipo === 'pedido' && !e.fim);
      caixa.append(el('div', { class: 'qv-lista' }, ...(p && p.estado === 'aberta' ? (ps.length ? ps.map(e => el('div', { class: 'orel-item' }, el('img', { src: urlArte(iconePratoGrande(e.prato)) }),
        el('div', {}, el('b', {}, `${e.quem} quer ${e.qtd} ${Pratos.PRATOS[e.prato].nome}`), el('div', { class: 'orel-preco' }, `até ${DIAS[(e.ate - 1) % 7]} (${e.feito}/${e.qtd}) · Cr$ ${e.premio}`))))
        : [el('div', { class: 'rodape' }, 'Nenhum pedido para a pensão agora.')]) : [el('div', { class: 'rodape' }, 'Quando a pensão abrir, o povo deixa encomenda aqui.')])));
    } else {
      const ids = G.empreitas.quadro, aceitas = Object.keys(G.empreitas.aceitas);
      const linha = (id, botao) => { const E = dadosEmpreita(id); return el('div', { class: 'orel-item' }, el('img', { src: urlItem(E.ferramenta === 'carga' ? 'telha' : E.ferramenta) }),
        el('div', {}, el('b', {}, `${E.nome} — ${CLIENTE_NOME[E.cliente] || ''}`), el('div', { class: 'orel-preco' },
          `${{ vila: 'na Vila', praia: 'na praia', mata: 'na mata', quintal: 'no quintal' }[E.mapa]} · ${E.tipo === 'longa' ? E.dias + ' dias' : E.tipo === 'capina' ? 'a cada 3 dias, até o fim da estação' : 'uma tarde'} · Cr$ ${E.paga}` +
          (Object.keys(E.material).length ? ' · ' + Object.entries(E.material).map(([m, q]) => Itens.qtd(q, m)).join(', ') : ''))), botao); };
      caixa.append(el('div', { class: 'cad-sub' }, 'Pedidos de hoje'), el('div', { class: 'qv-lista' }, ...(ids.length ? ids.map(id => {
        const pode = Empreitas.libera(id);
        return linha(id, pode ? el('button', { class: 'botao', onclick: e => { e.stopPropagation(); const r = Empreitas.aceitar(id, G.mochila, G.dinheiro);
          if (r === 'ok') { sons.tocar('carimbo', 1, 0.05, -6); avisar(`Aceito: ${dadosEmpreita(id).nome}.`); if (G.mapa) poeEmpreitasNoMapa(G.mapa); hudSujo(); desenha(); }
          else avisar({ limite: 'Uma empreita longa por vez (duas para o mestre de obras).', material: 'Para começar, traga o material na mochila.', ja: 'Já aceitou essa.' }[r] || 'Não deu.'); } }, 'Aceitar')
          : el('div', { class: 'orel-preco' }, `Pede ${FUNCOES[dadosEmpreita(id).funcaoMin]}${dadosEmpreita(id).hab ? `, ${NOMES_HAB[dadosEmpreita(id).hab.h]} ${dadosEmpreita(id).hab.n}` : ''}`));
      }) : [el('div', { class: 'rodape' }, 'Nenhum serviço novo hoje. Volte amanhã!')])));
      const enc = (G.mina && G.mina.encomendas) || [];
      if (enc.length) caixa.append(el('div', { class: 'cad-sub' }, 'Encomendas'), el('div', { class: 'qv-lista' }, ...enc.map((e, i) => el('div', { class: 'orel-item' }, el('img', { src: urlItem(e.item) }),
        el('div', {}, el('b', {}, `${CLIENTE_NOME[e.quem] || e.quem} quer ${Itens.qtd(e.qtd, e.item)}`), el('div', { class: 'orel-preco' }, `até ${DIAS[(e.ate - 1) % 7]} · Cr$ ${e.paga} · tem ${G.mochila.total(e.item)}`)),
        el('button', { class: 'botao', onclick: ev => { ev.stopPropagation(); const r = Mina.entregar(i, G.mochila); if (r === 'ok') { sons.tocar('moedas', 1, 0.05, -4); avisar(`Entregue! + Cr$ ${e.paga}`); hudSujo(); desenha(); } else avisar(r === 'vencida' ? 'Essa encomenda venceu.' : 'Falta material na mochila.'); } }, 'Entregar')))));
      if (aceitas.length) caixa.append(el('div', { class: 'cad-sub' }, 'Aceitas'), el('div', { class: 'qv-lista' }, ...aceitas.map(id => linha(id, el('div', { class: 'orel-preco' }, Empreitas.textoEstado(id))))));
    }
    caixa.append(el('div', { style: 'text-align:right;margin-top:10px' }, el('button', { class: 'botao forte', onclick: e => { e.stopPropagation(); fecharModal(); } }, 'Fechar')));
  };
  desenha();
  abrirModal(caixa);
  sons.tocar('abrir', 1, 0.03, -6);
  return true;
}
const abrirQuadroServicos = () => abrirQuadro('servicos');

AO_MONTAR.push(b => poeEmpreitasNoMapa(b));
AO_ENTRAR_MAPA.push(() => { if (G.mapa) poeEmpreitasNoMapa(G.mapa); });
MANHA.push(() => {
  G.empreitas.dia = G.dia; G.empreitas.quadro = Empreitas.quadroDoDia(G.dia);
  // Às vezes o pedido vem por carta (e já fica no quadro).
  if (G.dia % 5 === 0 && G.empreitas.quadro.length) {
    const id = G.empreitas.quadro[0], E = dadosEmpreita(id);
    CARTAS['servico_' + G.dia] = { de: CLIENTE_NOME[E.cliente] || 'Um vizinho', dia: G.dia, texto: `Seu Jocelino, preciso de um serviço: ${E.nome.toLowerCase()} (${{ vila: 'na Vila', praia: 'na praia', mata: 'na mata', quintal: 'no quintal' }[E.mapa]}). Pago Cr$ ${E.paga}. O pedido está no quadro de Serviços da Vila.` };
  }
  const c = G.empreitas.capina;
  if (c && Math.floor((G.dia - 1) / 28) % 4 !== c.estacao) { G.empreitas.capina = null; G.feitosHoje.push('A capina do Seu Ananias acabou com a estação.'); }
  for (const id in MAPAS) poeEmpreitasNoMapa(MAPAS[id]);
});
NOITE.push(linhas => {
  const chove = typeof Clima !== 'undefined' && Clima.chove(G.dia);
  for (const r of Empreitas.noite(chove)) {
    const E = dadosEmpreita(r.id), quem = CLIENTE_NOME[E.cliente] || '';
    if (r.desistiu) linhas.push(`${quem} desistiu de ${E.nome.toLowerCase()}: a obra não começou em 3 dias.`);
    else if (r.entregue) { linhas.push(linhaEntrega(r)); for (const x of r.extra || []) linhas.push(x); }
    else if (r.pronta) linhas.push(`${E.nome}: pronta! Entregue na plaquinha.`);
  }
  const vc = Empreitas.capinaNoite(); if (vc) linhas.push(`Capina do Seu Ananias: Cr$ ${vc}.`);
});
TAREFAS.push(() => {
  if (!G.empreitas) return [];
  const linhas = Object.keys(G.empreitas.aceitas).map(id => {
    const E = dadosEmpreita(id), a = G.empreitas.aceitas[id];
    return { texto: E.tipo === 'longa' ? `${E.nome}: ${Empreitas.textoEstado(id)}` : `Empreita: ${E.nome}`, feito: E.tipo === 'curta' ? a.vezes : undefined, meta: E.tipo === 'curta' ? E.vezes : undefined };
  });
  if (G.empreitas.capina && G.empreitas.capina.pos.length) linhas.push({ texto: `Capina do Seu Ananias: ${G.empreitas.capina.pos.length} matos no terreno` });
  return linhas;
});
