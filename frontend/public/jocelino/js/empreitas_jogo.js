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

// O piso pronto: a textura (arte pronta) recortada na área, na escala de verdade. O ladrilho hidráulico: peças de
// meio metro (a arte de 384 px tem 2×2 peças: cada peça vira 24 px), repetido; o cimento e a calçada,
// recortados como antes.
function desenhaPiso(ctx, tex, x, y, w, h) {
  const img = spr(tex); if (!img) return;
  if (tex !== 'texturas/piso_ladrilho') { ctx.drawImage(img, 0, 0, w * TILE, h * TILE, x * TILE, y * TILE, w * TILE, h * TILE); return; }
  const lado = TILE;   // um ladrilho do mapa = a arte inteira (2×2 peças de uns 50 cm)
  ctx.save(); ctx.beginPath(); ctx.rect(x * TILE, y * TILE, w * TILE, h * TILE); ctx.clip();
  for (let py = y * TILE; py < (y + h) * TILE; py += lado) for (let px = x * TILE; px < (x + w) * TILE; px += lado) ctx.drawImage(img, px, py, lado, lado);
  ctx.restore();
}
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
// Empreiteiro: cavar e assentar no lote de uma longa não gastam energia.
function fatorEnergiaLote(id, alvo) {
  if ((id !== 'pa' && id !== 'colher') || typeof Habilidades === 'undefined' || !Habilidades.tem('empreiteiro') || !G.mapa) return 1;
  const o = G.mapa.ocupado.get(chaveT(alvo.x, alvo.y)), E = o && dadosEmpreita(o.empreita || o.placaDe);
  return E && E.tipo === 'longa' ? 0 : 1;
}
function poeEmpreitasNoMapa(b) {
  for (const o of b.objs.filter(o => o.empreita || o.empreitaDet || o.feita)) b.tirar(o);
  if (!G.empreitas) return;
  // As obras entregues ficam no mapa (a Vila cresce com o que o Jocelino constrói); pegar de novo vira reforma.
  for (const id in G.empreitas.feitas || {}) {
    const E = dadosEmpreita(id); if (!E || E.mapa !== b.id || G.empreitas.aceitas[id]) continue;
    limparLote(b, E);
    if (tilesDoLote(E).slice(1).some(t => { const o = b.ocupado.get(chaveT(t.x, t.y)); return o && !o.achado; })) continue;   // nunca por cima de outra coisa
    const arte = E.artes[E.artes.length - 1], q = G.empreitas.feitas[id], h = E.area ? E.area.h : 1;
    const o = b.interativo('feita_' + id, ARTE_LISTA.includes(arte) ? arte : 'objetos/alicerce', E.x, E.y + h - 1, larguraLote(E), h, null, !E.piso);
    // O piso pronto: a textura de piso recortada na área (por baixo de quem pisa).
    if (E.area) { o.y = E.y * TILE; o.desenha = ctx => desenhaPiso(ctx, E.area.textura, E.x, E.y, E.area.w, E.area.h); }
    o.feita = id; o.acao = () => { abrirPlaca(`${E.nome}, para ${CLIENTE_NOME[E.cliente] || ''}: obra do Jocelino${q > 1 ? ' (' + ({ 1.25: 'bom', 1.5: 'caprichado', 2: 'impecável' }[q] || '') + ')' : ''}.`); return true; };
  }
  for (const id in G.empreitas.aceitas) {
    const E = dadosEmpreita(id), a = G.empreitas.aceitas[id];
    if (!E || E.mapa !== b.id) continue;
    if (E.tipo === 'longa' && !E.bairro && !E.familia) limparLote(b, E);
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
      if (a.estado !== 'reservada' && !E.bairro && !E.familia) {
        const n = Math.max(1, a.lista.length), k = a.estado === 'obra' ? Math.min(E.artes.length - 1, Math.floor(a.dias / n * E.artes.length)) : E.artes.length - 1;
        const arte = E.artes[k], img = larguraLote(E);
        const o = b.interativo('emp_' + id, ARTE_LISTA.includes(arte) ? arte : 'objetos/alicerce', p.x, p.y, img, 1);
        o.empreita = id; o.acao = () => acaoEmpreita(id); o.ferramenta = (obj, ferr) => golpeEmpreita(id, ferr);
      }
    }
  }
  brotarCapina(b);
  if (typeof poeBairro === 'function' && b.id === 'bairro') poeBairro(b);
}
function golpeEmpreita(id, ferr) {
  const r = Empreitas.trabalhar(id, ferr), E = dadosEmpreita(id), a = G.empreitas.aceitas[id];
  if (r === 'ok') { sons.tocar(ferr === 'machado' ? 'madeira' : ferr === 'regador' ? 'agua' : 'terra', 1.1, 0.05, -6); if (a && a.trabalhou) avisar(`${E.nome}: o serviço de hoje está feito.`); hudSujo(); return; }
  if (r === 'pronta') { sons.tocar('moedas', 1, 0.05, -4); sons.tocar('feito', 1, 0.03, -6); avisar(`${E.nome}: pronto! ${CLIENTE_NOME[E.cliente] || ''} pagou Cr$ ${E.paga}.`); hudSujo(); poeEmpreitasNoMapa(G.mapa); return; }
  if (r === 'estado') { avisar(!a ? '' : a.estado === 'reservada' ? 'Primeiro comece a obra: clique na plaquinha com o material na mochila.' : a.estado === 'pronta' ? 'Está pronta: clique na plaquinha para entregar.' : E.familia ? 'Terminada: à noite a família vê a obra nova.' : 'Entregue: o pagamento vem à noite.'); return; }
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
  const E = dadosEmpreita(id), a = G.empreitas.aceitas[id], quem = E.familia ? 'a família' : CLIENTE_NOME[E.cliente] || '';
  if (typeof aditivoNaPlaquinha === 'function' && aditivoNaPlaquinha(id)) return true;   // (entrega B)
  if (a.estado === 'reservada') {
    const mat = Empreitas.material(id), lista = Object.entries(mat).map(([m, q]) => Itens.qtd(q, m)).join(', ');
    if (Object.keys(mat).some(m => G.mochila.total(m) < mat[m])) { abrirPlaca(`${E.nome} para ${quem}. Para começar, traga na mochila: ${lista}. (${Empreitas.textoEstado(id)})`); return true; }
    perguntar(`${E.nome} para ${quem}: começar a obra? Gasta ${lista}${E.custo ? ` e Cr$ ${E.custo}` : ''}. São ${Empreitas.listaDias(id, a.aditivo).length} dias de serviço.`, ['Começar', 'Agora não'], i => { if (i === 0) comecarObra(id); });
    return true;
  }
  if (a.estado === 'pronta') { Empreitas.entregar(id); sons.tocar('feito', 1, 0.03, -6); avisar(E.familia ? `${E.nome}: terminada! À noite a família vê a obra nova.` : `${E.nome}: entregue! ${quem} paga à noite.`); hudSujo(); poeEmpreitasNoMapa(G.mapa); return true; }
  abrirPlaca(`${E.nome} para ${quem}: ${Empreitas.textoEstado(id)}.`);
  return true;
}
function comecarObra(id) {
  const r = Empreitas.comecar(id, G.mochila);
  if (r === 'ok') { sons.tocar('pousar', 1, 0.05, -4); avisar(`A obra começou! Hoje é dia de ${NOME_DIA[Empreitas.ferramentaHoje(id)]}.`); hudSujo(); poeEmpreitasNoMapa(G.mapa); }
  else if (r === 'dinheiro') avisar(`Esta etapa custa Cr$ ${dadosEmpreita(id).custo}.`);
  else avisar('Falta material para começar.');
}
// O ícone da ferramenta do dia em cima da plaquinha (a arte do item, só posicionada); pronta, a exclamação.
EXTRAS_MUNDO.push(m => !G.empreitas ? [] : m.objs.filter(o => o.placaDe && G.empreitas.aceitas[o.placaDe]).map(o => ({ y: o.y + 2, desenha(ctx) {
  const a = G.empreitas.aceitas[o.placaDe], sobe = Math.sin((G.agora || 0) * 3) * 3;
  if (!a) return;
  if (a.aditivo) desenhaPe(ctx, 'itens/' + a.aditivo, o.x + 22, o.y - 6, 1, 0.4);
  if (a.estado === 'obra' && !a.trabalhou) desenhaPe(ctx, 'itens/' + Empreitas.ferramentaHoje(o.placaDe), o.x, o.y - 74 + sobe, 1, 0.75);
  else if (a.estado === 'pronta') desenhaFx(ctx, 'exclamacao', o.x, o.y - 74 + sobe);
} })));
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
  if (aba === 'servicos' && typeof Guia !== 'undefined' && !Guia.liberado('quadro')) { abrirPlaca('O quadro de serviços da Vila. Depois de conhecer o pessoal da Vila, os bicos ficam aqui.'); return; }
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
          `${{ vila: 'na Vila', praia: 'na praia', mata: 'na mata', quintal: 'no quintal', bairro: 'no Bairro Novo' }[E.mapa]} · ${E.tipo === 'longa' ? E.dias + ' dias' : E.tipo === 'capina' ? 'a cada 3 dias, até o fim da estação' : 'uma tarde'} · Cr$ ${E.paga}` +
          (Object.keys(E.material).length ? ' · ' + Object.entries(E.material).map(([m, q]) => Itens.qtd(q, m)).join(', ') : ''))), botao); };
      const fx = Empreitas.faixa(), prox = FAIXAS_VILA[fx.i + 1], cap = G.empreitas.caprichados || 0;
      const pct = prox ? Math.round(100 * Math.min(G.empreitas.entregues / prox.entregues, prox.caprichados ? cap / prox.caprichados : 1)) : 100;
      caixa.append(el('div', { class: 'fala-vila' }, el('b', {}, 'Fala da Vila: ' + fx.nome),
        el('span', {}, prox ? ` · ${G.empreitas.entregues}/${prox.entregues} serviços${prox.caprichados ? `, ${cap}/${prox.caprichados} caprichados` : ''} para ${prox.nome}` : ' · o nome mais respeitado da Vila'),
        el('div', { class: 'barra-fala' }, el('div', { style: `width:${Math.min(100, pct)}%` }))));
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
      const doBairro = typeof Bairro !== 'undefined' ? Bairro.pedidos() : [];
      if (doBairro.length) caixa.append(el('div', { class: 'cad-sub' }, 'Bairro Novo'), el('div', { class: 'qv-lista' }, ...doBairro.map(id => linha(id, Empreitas.libera(id)
        ? el('button', { class: 'botao', onclick: e => { e.stopPropagation(); const r = Empreitas.aceitar(id, G.mochila, G.dinheiro); if (r === 'ok') { sons.tocar('carimbo', 1, 0.05, -6); avisar(`Aceito: ${dadosEmpreita(id).nome}. A plaquinha está no terreno, no Bairro Novo.`); hudSujo(); desenha(); } else avisar({ limite: 'Uma empreita longa por vez (duas para o mestre de obras).' }[r] || 'Não deu.'); } }, 'Aceitar')
        : el('div', { class: 'orel-preco' }, `Pede ${NOMES_HAB[dadosEmpreita(id).hab.h]} ${dadosEmpreita(id).hab.n}`)))));
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
  if (typeof cartaDePedido === 'function') cartaDePedido(G.dia);
  const c = G.empreitas.capina;
  if (c && Math.floor((G.dia - 1) / 28) % 4 !== c.estacao) { G.empreitas.capina = null; G.feitosHoje.push('A capina do Seu Ananias acabou com a estação.'); }
  for (const id in MAPAS) poeEmpreitasNoMapa(MAPAS[id]);
});
// As falas da entrega (o selo e o comentário do cliente), por qualidade.
const FALAS_ENTREGA = {
  geral: { 1: 'Serviço feito. Obrigado, Jocelino.', 1.25: 'Ficou bom, Jocelino!', 1.5: 'Ficou uma beleza, Jocelino!', 2: 'Nunca vi serviço tão bem feito na Vila!' },
  zelia: { 1.5: 'Uma beleza! Vou contar para a Vila inteira.', 2: 'Jocelino, isso está melhor que obra de capital!' },
  juca: { 1: 'Tá firme. É o que importa.', 1.5: 'Capricho de quem aprendeu direito!' },
  lourival: { 1.5: 'Compadre, ficou um brinco!', 2: 'Nem o mar derruba isso, compadre!' },
  cida: { 1.5: 'Que capricho! Passa amanhã que tem pãozinho para você.' },
  ananias: { 1: 'Bom. Material bem gasto.', 2: 'Isso vale o dobro do que eu paguei.' },
  tonico: { 1.5: 'Serviço de ferreiro: sem rebarba!' },
};
const falaEntrega = (cliente, q) => (FALAS_ENTREGA[cliente] || {})[q] || FALAS_ENTREGA.geral[q] || FALAS_ENTREGA.geral[1];
function linhaEntrega(r) { const E = dadosEmpreita(r.id); return `Serviço entregue: ${E.nome} para ${CLIENTE_NOME[E.cliente] || ''}: Cr$ ${r.valor} (${NOME_QUALIDADE[r.qualidade]}). "${falaEntrega(E.cliente, r.qualidade)}"`; }
// O carimbo da entrega caprichada ou impecável: de manhã, quando a tela fica livre, 3 segundos (arte pronta).
let _carimboPendente = '', _carimbo = null;
const carimboPara = q => { if (q >= 1.5) _carimboPendente = q >= 2 ? 'impecavel' : 'caprichado'; };
const carimboNaTela = () => _carimbo && (G.agora || 0) < _carimbo.ate ? _carimbo.nome : '';
ATUALIZADORES.push(() => { if (_carimboPendente && !menuAberto()) { _carimbo = { nome: 'ui/carimbo_' + _carimboPendente, ate: (G.agora || 0) + 3 }; _carimboPendente = ''; } });
DESENHOS_TELA.push(ctx => {
  const n = carimboNaTela(), img = n && spr(n); if (!img) return;
  const falta = _carimbo.ate - (G.agora || 0), w = img.naturalWidth * 1.4, h = img.naturalHeight * 1.4;
  ctx.save(); ctx.globalAlpha = Math.min(1, falta); ctx.drawImage(img, G.larg / 2 - w / 2, G.alt * 0.25, w, h); ctx.restore();
});
// O aditivo na mão, na plaquinha: aplica (a cal que é material da obra não vira aditivo quando falta para começar).
function aditivoNaPlaquinha(id) {
  const ad = itemDaMao(), a = G.empreitas.aceitas[id];
  if (!(ad in ADITIVOS) || !a) return false;
  if (a.aditivo || !(a.estado === 'reservada' || (a.estado === 'obra' && a.dias === 0 && a.feitoHoje === 0 && !a.trabalhou))) return false;   // já tem ou já é tarde: a plaquinha faz o resto
  const mat = Empreitas.material(id);
  if (a.estado === 'reservada' && mat[ad] && G.mochila.total(ad) <= mat[ad]) return false;
  const r = Empreitas.aplicarAditivo(id, ad, G.mochila);
  avisar({ ok: `${Itens.nome(ad)} aplicado: ${ad === 'acelerador' ? 'a obra fica mais curta' : 'o acabamento sai melhor'}.`, ja: 'Essa obra já tem aditivo.', tarde: 'O aditivo vai antes de começar a obra.', falta: 'Falta o aditivo.', nao: 'Isso não é aditivo.', curta: 'Essa obra já é curta demais para o acelerador.' }[r]);
  if (r === 'ok') { sons.tocar('pousar', 1, 0.05, -4); hudSujo(); poeEmpreitasNoMapa(G.mapa); }
  return true;
}
NOITE.push(linhas => {
  const chove = typeof Clima !== 'undefined' && Clima.chove(G.dia);
  if (typeof Tiao !== 'undefined') Tiao.trabalhar(chove);   // o Tião cuida antes da noite avançar as obras
  for (const r of Empreitas.noite(chove)) {
    const E = dadosEmpreita(r.id), quem = CLIENTE_NOME[E.cliente] || '';
    if (r.desistiu) linhas.push(`${quem} desistiu de ${E.nome.toLowerCase()}: a obra não começou em 3 dias.`);
    else if (r.entregue && E.familia) { for (const x of r.extra || []) linhas.push(x); }   // a obra da família não é serviço pago: só o que ela ganhou
    else if (r.entregue) { carimboPara(r.qualidade); linhas.push(linhaEntrega(r)); for (const x of r.extra || []) linhas.push(x); }
    else if (r.pronta) linhas.push(`${E.nome}: pronta! Entregue na plaquinha.`);
  }
  const vc = Empreitas.capinaNoite(); if (vc) linhas.push(`Capina do Seu Ananias: Cr$ ${vc}.`);
});
TAREFAS.push(() => {
  if (!G.empreitas) return [];
  const linhas = Object.keys(G.empreitas.aceitas).map(id => {
    const E = dadosEmpreita(id), a = G.empreitas.aceitas[id];
    if (typeof E.familia === 'string' && a.estado === 'reservada') return null;   // os aluguéis por começar ficam só na plaquinha (são opcionais)
    return { texto: E.tipo === 'longa' ? `${E.nome}: ${Empreitas.textoEstado(id)}` : `Empreita: ${E.nome}`, feito: E.tipo === 'curta' ? a.vezes : undefined, meta: E.tipo === 'curta' ? E.vezes : undefined };
  });
  for (let k = linhas.length - 1; k >= 0; k--) if (!linhas[k]) linhas.splice(k, 1);
  if (G.empreitas.capina && G.empreitas.capina.pos.length) linhas.push({ texto: `Capina do Seu Ananias: ${G.empreitas.capina.pos.length} matos no terreno` });
  return linhas;
});
