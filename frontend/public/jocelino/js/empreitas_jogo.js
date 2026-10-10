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

function poeEmpreitasNoMapa(b) {
  for (const o of b.objs.filter(o => o.empreita || o.empreitaDet)) b.tirar(o);
  if (!G.empreitas) return;
  for (const id in G.empreitas.aceitas) {
    const E = dadosEmpreita(id), a = G.empreitas.aceitas[id];
    if (!E || E.mapa !== b.id) continue;
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
      const arte = E.artes[Math.min(E.artes.length - 1, a.dias)], img = arte === 'objetos/muro' || arte.endsWith('_praia') ? 3 : 2;
      const o = b.interativo('emp_' + id, ARTE_LISTA.includes(arte) ? arte : 'objetos/alicerce', p.x, p.y, img, 1);
      o.empreita = id;
      o.acao = () => acaoEmpreita(id);
      o.ferramenta = (obj, ferr) => golpeEmpreita(id, ferr);
      // A plaquinha do serviço ao lado do lote (o lugar fica óbvio desde o primeiro dia).
      const q = lugarLivre(b, p.x - 1, p.y), pl = b.interativo('emp_placa_' + id, 'objetos/plaquinha', q.x, q.y, 1, 1, [8, 6]);
      pl.empreitaDet = '__placa'; pl.acao = () => acaoEmpreita(id);
    }
  }
}
function golpeEmpreita(id, ferr) {
  const r = Empreitas.trabalhar(id, ferr), E = dadosEmpreita(id);
  if (r === 'ok') { sons.tocar(E.ferramenta === 'machado' ? 'madeira' : 'terra', 1.1, 0.05, -6); return; }
  if (r === 'pronta') { sons.tocar('moedas', 1, 0.05, -4); sons.tocar('feito', 1, 0.03, -6); avisar(`${E.nome}: pronto! ${CLIENTE_NOME[E.cliente] || ''} pagou Cr$ ${E.paga}.`); hudSujo(); poeEmpreitasNoMapa(G.mapa); return; }
  if (r === 'material') avisar(TEXTO_RESULTADO.material + Object.entries(E.material).map(([m, q]) => Itens.qtd(q, m)).join(', ') + '.');
  else if (r === 'ferramenta') avisar(TEXTO_RESULTADO.ferramenta + (NOME_FERRAMENTA[E.ferramenta] || E.ferramenta) + '.');
  else if (r === 'feito_hoje') avisar(TEXTO_RESULTADO.feito_hoje);
}
function acaoEmpreita(id) {
  const E = dadosEmpreita(id), a = G.empreitas.aceitas[id];
  if (!a) return true;
  if (E.ferramenta === 'carga') { golpeEmpreita(id, 'carga'); return true; }
  const mat = Object.keys(E.material).length ? ' Material: ' + Object.entries(E.material).map(([m, q]) => Itens.qtd(q, m)).join(', ') + '.' : '';
  const como = LIMPEZA[id] ? `Limpe ${E.vezes} ${LIMPEZA[id] === 'mato' ? 'matos' : 'entulhos'} em volta com ${NOME_FERRAMENTA[E.ferramenta]}.` : `Trabalhe com ${NOME_FERRAMENTA[E.ferramenta] || E.ferramenta}.`;
  abrirPlaca(E.tipo === 'longa'
    ? `${E.nome} para ${CLIENTE_NOME[E.cliente]}: dia ${a.dias}/${E.dias}. ${a.trabalhou ? 'Hoje já trabalhou: amanhã continua.' : `Hoje: ${a.feitoHoje}/${E.vezesDia} com ${NOME_FERRAMENTA[E.ferramenta]}.`}`
    : `${E.nome} para ${CLIENTE_NOME[E.cliente]} (Cr$ ${E.paga}). ${como}${mat}`);
  return true;
}
// A limpeza conta quando o detrito marcado sai.
function quebrouEmpreita(o) {
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
          `${{ vila: 'na Vila', praia: 'na praia', mata: 'na mata', quintal: 'no quintal' }[E.mapa]} · ${E.tipo === 'longa' ? E.dias + ' dias' : 'uma tarde'} · Cr$ ${E.paga}` +
          (Object.keys(E.material).length ? ' · ' + Object.entries(E.material).map(([m, q]) => Itens.qtd(q, m)).join(', ') : ''))), botao); };
      caixa.append(el('div', { class: 'cad-sub' }, 'Pedidos de hoje'), el('div', { class: 'qv-lista' }, ...(ids.length ? ids.map(id => {
        const pode = Empreitas.libera(id);
        return linha(id, pode ? el('button', { class: 'botao', onclick: e => { e.stopPropagation(); const r = Empreitas.aceitar(id, G.mochila, G.dinheiro);
          if (r === 'ok') { sons.tocar('carimbo', 1, 0.05, -6); avisar(`Aceito: ${dadosEmpreita(id).nome}.`); if (G.mapa) poeEmpreitasNoMapa(G.mapa); hudSujo(); desenha(); }
          else avisar({ limite: 'Uma empreita longa por vez (duas para o mestre de obras).', material: 'Para começar, traga o material na mochila.', ja: 'Já aceitou essa.' }[r] || 'Não deu.'); } }, 'Aceitar')
          : el('div', { class: 'orel-preco' }, `Pede ${FUNCOES[dadosEmpreita(id).funcaoMin]}${dadosEmpreita(id).hab ? `, ${NOMES_HAB[dadosEmpreita(id).hab.h]} ${dadosEmpreita(id).hab.n}` : ''}`));
      }) : [el('div', { class: 'rodape' }, 'Nenhum serviço novo hoje. Volte amanhã!')])));
      if (aceitas.length) caixa.append(el('div', { class: 'cad-sub' }, 'Aceitas'), el('div', { class: 'qv-lista' }, ...aceitas.map(id => linha(id, el('div', { class: 'orel-preco' }, G.empreitas.aceitas[id].tipo === 'longa' ? `dia ${G.empreitas.aceitas[id].dias}/${dadosEmpreita(id).dias}` : 'em andamento')))));
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
  for (const id in MAPAS) poeEmpreitasNoMapa(MAPAS[id]);
});
NOITE.push(linhas => {
  for (const r of Empreitas.noite(typeof Clima !== 'undefined' && Clima.chove(G.dia))) {
    if (!r.entregue) continue;
    const E = dadosEmpreita(r.id);
    linhas.push(`Serviço entregue: ${E.nome} para ${CLIENTE_NOME[E.cliente] || ''}, Cr$ ${r.valor}${r.qualidade >= 1.5 ? ' (caprichado!)' : r.qualidade > 1 ? ' (bom)' : ''}.`);
  }
});
TAREFAS.push(() => G.empreitas ? Object.keys(G.empreitas.aceitas).map(id => {
  const E = dadosEmpreita(id), a = G.empreitas.aceitas[id];
  return { texto: E.tipo === 'longa' ? `Empreita: ${E.nome} (dia ${a.dias + 1}/${E.dias}${a.trabalhou ? ', hoje feito' : ''})` : `Empreita: ${E.nome}`, feito: E.tipo === 'curta' ? a.vezes : undefined, meta: E.tipo === 'curta' ? E.vezes : undefined };
}) : []);
