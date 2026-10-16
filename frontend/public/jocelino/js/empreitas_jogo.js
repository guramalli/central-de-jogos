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
const LIMPEZA = { limpar_trilha: 'mato', desentulhar_ananias: 'entulho', pedregulho_rua: 'pedregulho' };
// (15/10, T6) A limpeza em ladrilhos fixos (o pé de cada detrito): as pedras que rolaram na estrada nascem sempre nos mesmos lugares
// da rua principal (e não "perto da placa"), sem plaquinha e sem fechar a rua de 3 ladrilhos (cada pedregulho tem 2x2: sobra 1
// ladrilho da pista e as duas calçadas; longe das saídas do leste e dos nomes delas). A s16 confere o caminho até as saídas.
const LIMPEZA_FIXA = { pedregulho_rua: [[30, 12], [33, 13], [36, 12]] };
const NOME_LIMPEZA = { mato: 'matos', entulho: 'entulhos', pedregulho: 'pedregulhos' };
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
// O estrago do serviço curto no lugar de verdade (14/10, relato do jogador: "não havia nenhum indício de onde eu teria que
// fazer o remendo... a cerca da Dona Zélia nem existe"). Como a ponte quebrada da praia do Stardew: enquanto o serviço está
// aceito, o mapa mostra o estrago (a calçada rachada, a cerca quebrada: arte pronta); feito, volta o inteiro (a cerca) ou o chão.
// A calçada é chão (por baixo de quem pisa, sem colisão); a cerca vai em trechos com o portão aberto no meio, sólida só no pé.
// (segunda etapa) O mesmo para a ponte da mata (a arte do chão), a banca do Seu Lourival e o telhado do Tio Juca (a arte do
// objeto de sempre) e o trecho do píer (que fica com as tábuas novas depois do conserto).
const estragoDe = E => E && (E.local || E.estrago);
// A arte do lugar do serviço agora: o estrago com o serviço aberto; depois do conserto, a consertada (se tiver); senão, a de sempre.
function arteDoServico(id, normal) {
  const L = estragoDe(EMPREITAS_CURTAS[id]); if (!L || !L.arte) return normal;
  if (G.empreitas && G.empreitas.aceitas[id]) return L.arte;
  if (L.consertada && G.empreitas && G.empreitas.consertados && G.empreitas.consertados[id]) return L.consertada;
  return L.inteira || normal;
}
function entregaNoObjeto(id) {
  const E = EMPREITAS_CURTAS[id]; if (!G.empreitas || !G.empreitas.aceitas[id]) return false;
  const falta = Object.entries(E.material).filter(([m, q]) => G.mochila.total(m) < q);
  if (falta.length) { avisar(`${E.nome}: traga ${falta.map(([m, q]) => Itens.qtd(q - G.mochila.total(m), m)).join(', ')}${typeof LOJA !== 'undefined' && falta.every(([m]) => LOJA.PRECOS[m] !== undefined) ? ' (o depósito do Seu Ananias vende)' : ''}.${falta.some(([m]) => m === 'lajota') ? ' ' + ONDE_LAJOTA : ''}`); return false; }
  golpeEmpreita(id, E.ferramenta); return true;
}
if (typeof LUZES !== 'undefined') LUZES['objetos/casa_juca_telhado'] = LUZES['objetos/casa_juca'];   // (o mesmo quadro da casa de sempre)
function poeEstragos(b) {
  for (const id in EMPREITAS_CURTAS) {
    const E = EMPREITAS_CURTAS[id], L = estragoDe(E); if (!L || !L.arte || E.mapa !== b.id || L.chao) continue;   // (o chão: o desenhaChao do mapa pergunta)
    if (L.objeto) { const o = b.objs.find(x => x.id === L.objeto); if (o) { if (!o.nomeDeSempre) o.nomeDeSempre = o.nome; o.nome = arteDoServico(id, o.nomeDeSempre);
      // a entrega no próprio objeto (as telhas na casa do Tio Juca): o botão direito nele entrega; sem o material, avisa e segue o de sempre
      if (L.noObjeto && !o.acaoDeSempre) { o.acaoDeSempre = o.acao; o.acao = (...a) => entregaNoObjeto(id) || o.acaoDeSempre(...a); } } continue; }
    const nome = arteDoServico(id, null), A = L.area; if (!nome) continue;
    if (L.piso) {
      const R = L.retalho || A;
      b.objs.push({ tipo: 'enfeite', nome, servicoLocal: id, solido: false, x: (R.x + R.w / 2) * TILE, y: R.y * TILE,
        desenha(ctx) { const img = spr(nome); if (img) ctx.drawImage(img, R.x * TILE, R.y * TILE, R.w * TILE, R.h * TILE); } });
      continue;
    }
    for (const t of L.trechos || [{ x: A.x, w: A.w }]) {
      const pe = (A.y + A.h) * TILE, cx = (t.x + t.w / 2) * TILE;
      const o = { tipo: 'enfeite', nome, servicoLocal: id, solido: true, x: cx, y: pe, tiles: [],
        desenha(ctx) { const img = spr(nome); if (!img) return; ctx.save(); ctx.translate(cx, pe); if (t.espelho) ctx.scale(-1, 1); ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight); ctx.restore(); } };
      o.caixa = { x: t.x * TILE + 4, y: pe - 24, w: t.w * TILE - 8, h: 18 };   // (só o pé da cerca bloqueia)
      b.solidos.push(o.caixa);
      for (let i = 0; i < t.w; i++) { const k = chaveT(t.x + i, A.y + A.h - 1); o.tiles.push({ x: t.x + i, y: A.y + A.h - 1 }); if (!b.ocupado.has(k)) b.ocupado.set(k, o); }
      b.objs.push(o);
    }
  }
}
// A luz no contorno do lugar do serviço aceito (todo dia, até ficar pronto): brilho suave pulsando, por código. No chão (a
// calçada, a ponte, o píer), por baixo de quem pisa; na cerca, em volta dela toda, por cima.
EXTRAS_MUNDO.push(m => {
  if (!G.empreitas) return [];
  const r = [];
  for (const id in G.empreitas.aceitas) {
    const E = dadosEmpreita(id), L = estragoDe(E); if (!L || E.mapa !== m.id || !(L.area || L.luz)) continue;
    if (L.luz) {   // (o objeto de pé: a banca, o telhado) em volta dele, por cima
      const R = L.luz, x = R.x * TILE, y = R.y * TILE, w = R.w * TILE, h = R.h * TILE, o = L.objeto && m.objs.find(q => q.id === L.objeto);
      r.push({ y: (o ? o.y : y + h) + 1, realceServico: id, desenha(ctx) { desenhaLuzDoServico(ctx, x, y, w, h); } });
      continue;
    }
    const A = L.area, alto = L.trechos ? (spr(L.arte) ? spr(L.arte).naturalHeight : TILE) : 0;
    const x = A.x * TILE, y = (A.y + A.h) * TILE - Math.max(A.h * TILE, alto + 6), w = A.w * TILE, h = (A.y + A.h) * TILE - y;
    r.push({ y: alto ? (A.y + A.h) * TILE + 1 : A.y * TILE + 1, realceServico: id, desenha(ctx) { desenhaLuzDoServico(ctx, x, y, w, h); } });
  }
  // (T6) A limpeza fixa (as pedras da estrada): a luz em volta de cada detrito do serviço, por cima dele (o quadro da arte).
  for (const o of m.objs) {
    if (!o.empreitaDet || !LIMPEZA_FIXA[o.empreitaDet] || !G.empreitas.aceitas[o.empreitaDet] || !o.tiles) continue;
    const img = spr(o.nome), w = (img ? img.naturalWidth : TILE) + 12, h = (img ? img.naturalHeight : TILE) + 10, x = o.x - w / 2, y = o.y - h + 4;
    r.push({ y: o.y + 1, realceServico: o.empreitaDet, desenha(ctx) { desenhaLuzDoServico(ctx, x, y, w, h); } });
  }
  return r;
});
// (14/10) Também o realce da reforma da pensão (realceDaReforma, reforma_palco.js). esc: px de mundo por px de tela (o salão
// é desenhado menor, com zoom < 1: lá o traço e a curva crescem na mesma conta, para a luz ter na tela o peso da ponte da mata).
// forte: para fundo claro (o céu pelo buraco do telhado, a parede creme do salão), um contorno escuro por baixo do traço e a luz
// um pouco mais acesa — a amarela sozinha sumia ali.
function desenhaLuzDoServico(ctx, x, y, w, h, esc = 1, forte = false) {
  const p = 0.5 + 0.5 * Math.sin((G.agora || 0) * 3.2), m = 2 * esc, k = forte ? 1.5 : 1;
  ctx.save();
  ctx.beginPath(); ctx.roundRect(x + m, y + m, w - 2 * m, h - 2 * m, 12 * esc);
  ctx.fillStyle = `rgba(255,232,150,${(0.07 * k + 0.07 * k * p).toFixed(3)})`; ctx.fill();
  if (forte) { ctx.lineWidth = 8 * esc; ctx.strokeStyle = 'rgba(60,30,0,.35)'; ctx.stroke(); }
  ctx.shadowColor = 'rgba(255,214,96,.95)'; ctx.shadowBlur = (8 + 10 * p) * k;   // (a sombra não segue a escala do ctx: já é em px de tela)
  ctx.lineWidth = 3 * esc * (forte ? 1.3 : 1); ctx.strokeStyle = `rgba(255,228,128,${Math.min(1, (0.45 + 0.35 * p) * k).toFixed(3)})`; ctx.stroke();
  ctx.restore();
}
function poeEmpreitasNoMapa(b) {
  for (const o of b.objs.filter(o => o.empreita || o.empreitaDet || o.feita || o.servicoLocal)) b.tirar(o);
  poeEstragos(b);
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
    // (T6) A limpeza fixa (as pedras da estrada): cada detrito no seu ladrilho, sem plaquinha; o que já saiu não volta (a.limpos).
    // O detrito do save (sem a marca do serviço) que estiver no lugar sai antes, para o do serviço nascer ali.
    if (E.tipo === 'curta' && LIMPEZA_FIXA[id]) {
      const tam = (VISUAL_DETRITO[LIMPEZA[id]] || {}).tam || 1;
      LIMPEZA_FIXA[id].forEach(([x, y], k) => { if ((a.limpos || []).includes(k)) return;
        for (let i = 0; i < tam; i++) for (let j = 0; j < tam; j++) { const o = b.ocupado.get(chaveT(x + i, y + j)); if (o && (o.achado || (o.tipo === 'detrito' && !o.empreitaDet))) b.tirar(o); }
        const d = b.detrito(LIMPEZA[id], x, y); if (d) { d.empreitaDet = id; d.fixo = k; } });
      continue;
    }
    const p = lugarLivre(b, E.x, E.y);
    if (E.tipo === 'curta' && (E.local || (E.estrago && E.estrago.noObjeto))) continue;   // o serviço no lugar de verdade (ou no próprio objeto): sem plaquinha
    if (E.tipo === 'curta') {
      const o = b.interativo('emp_' + id, 'objetos/plaquinha', p.x, p.y, 1, 1, [8, 6]);
      o.empreita = id;
      o.acao = () => acaoEmpreita(id);
      o.ferramenta = (obj, ferr) => golpeEmpreita(id, ferr);
      // Limpeza: os detritos de verdade em volta da placa; cada um que sai conta.
      if (LIMPEZA[id]) {
        const falta = E.vezes - (a.vezes || 0), f = mulberry(a.dia * 37 + id.length);
        // Os detritos nascem primeiro no caminho (terra ou caminho) perto da placa, depois na grama, do mais perto ao mais
        // longe, até nascerem todos: fora do caminho eles somem na grama alta (teste de 12/10: só 3 dos 8 da trilha apareciam).
        const cand = [];
        for (let dy = -6; dy <= 6; dy++) for (let dx = -10; dx <= 10; dx++) {
          const x = p.x + dx, y = p.y + dy; if (x < 1 || y < 1 || x >= b.larg - 1 || y >= b.alt - 1) continue;
          const ch = b.chaoEm(x, y); if (ch === CH.MAR || ch === CH.RIO) continue;
          cand.push({ x, y, caminho: ch === CH.TERRA || ch === CH.CAMINHO ? 1 : 0, d: Math.abs(dx) + Math.abs(dy) + f() });
        }
        cand.sort((u, v) => (v.caminho - u.caminho) || (u.d - v.d));
        for (let k = 0, n = 0; k < cand.length && n < falta; k++) { const d = b.detrito(LIMPEZA[id], cand[k].x, cand[k].y); if (d) { d.empreitaDet = id; n++; } }
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
  if (typeof poeGalinheiro === 'function') poeGalinheiro(b);   // (16/10) a cerca do Tio Juca pronta é o galinheiro inteiro (quintal_coisas.js)
  brotarCapina(b);
  if (typeof poeBairro === 'function' && b.id === 'bairro') poeBairro(b);
}
// O golpe no lugar de verdade do serviço (a ponte, o píer, a banca, a cerca, a calçada): conta como o golpe do serviço.
function golpeNoLocal(ferr, alvo, vistos = null) {
  if (!G.empreitas) return false;
  for (const cid in G.empreitas.aceitas) {
    const E = dadosEmpreita(cid); if (!E || !E.local || E.mapa !== G.mapaId) continue;
    const A = E.local.area; if (alvo.x < A.x || alvo.x >= A.x + A.w || alvo.y < A.y || alvo.y >= A.y + A.h) continue;
    if (vistos) { if (vistos.has('servico_' + cid)) return true; vistos.add('servico_' + cid); }   // (a pá reforçada pega 3 ladrilhos: conta um golpe só)
    // (14/10, relato do jogador: "tem que usar o machado ali, eu só sabia porque já tinha feito outra vez") A ferramenta errada
    // no lugar do serviço diz qual é a certa.
    if (ferr !== E.ferramenta) {
      const nome = NOME_FERRAMENTA[E.ferramenta] || E.ferramenta, naFerraria = G.ferreiro && G.ferreiro.oficina && G.ferreiro.oficina.id === E.ferramenta;
      sons.tocar('madeira', 1.6, 0.05, -10); avisar(`Aqui é com ${nome}${naFerraria ? ', que está com o Seu Tonico na ferraria' : ''}.`); return true;
    }
    if (typeof lascas === 'function' && ferr !== 'colher') lascas((alvo.x + 0.5) * TILE, (alvo.y + 0.5) * TILE, ferr === 'pa' ? 'terra' : 'madeira');   // (a colher solta a massa na ponta dela, ferramentas.js)
    golpeEmpreita(cid, ferr); return true;
  }
  return false;
}
function golpeEmpreita(id, ferr) {
  const r = Empreitas.trabalhar(id, ferr), E = dadosEmpreita(id), a = G.empreitas.aceitas[id];
  if (r === 'ok') {
    sons.tocar(ferr === 'machado' ? 'madeira' : ferr === 'regador' ? 'agua' : 'terra', 1.1, 0.05, -6); if (a && a.trabalhou) avisar(`${E.nome}: o serviço de hoje está feito.`); hudSujo();
    // (teste de 12/10) o golpe do serviço curto mostra o contador em cima do lugar, como o da obra
    if (E.tipo === 'curta' && a && G.jog) { const f = G.jog.frente(); (G.guiaFlut = G.guiaFlut || []).push({ texto: `${E.nome} ${a.vezes}/${E.vezes}`, x: f.x, y: f.y - 40, ate: (G.agora || 0) + 1.5 }); }
    return;
  }
  if (r === 'pronta') { sons.tocar('moedas', 1, 0.05, -4); sons.tocar('feito', 1, 0.03, -6); avisar(`${E.nome}: pronto! ${CLIENTE_NOME[E.cliente] || ''} pagou Cr$ ${Empreitas.pagaBase(id)}.`); hudSujo(); poeEmpreitasNoMapa(G.mapa); return; }
  if (r === 'estado') { avisar(!a ? '' : a.estado === 'reservada' ? 'Primeiro comece a obra: clique na plaquinha com o material na mochila.' : a.estado === 'pronta' ? 'Está pronta: clique na plaquinha para entregar.' : E.familia ? 'Terminada: à noite a família vê a obra nova.' : 'Entregue: o pagamento vem à noite.'); return; }
  if (r === 'concreto') { avisar('Chovendo, o concreto não pega. Hoje a obra espera.'); return; }
  if (r === 'pintura') { avisar('Com chuva não dá para pintar.'); return; }
  if (r === 'manta') { avisar(`Hoje a ${Itens.nome(a.cura).toLowerCase()} faz o serviço sozinha: à noite o dia avança.`); return; }
  if (r === 'material') avisar(TEXTO_RESULTADO.material + Object.entries(E.material).map(([m, q]) => Itens.qtd(q, m)).join(', ') + '.' + (E.material.lajota && G.mochila.total('lajota') < E.material.lajota ? ' ' + ONDE_LAJOTA : ''));
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
  // (teste de 12/10) A plaquinha explica: quantos golpes, quantos já foram e quando o material é gasto.
  const mat = Object.keys(E.material).length ? ' Tenha na mochila: ' + Object.entries(E.material).map(([m, q]) => Itens.qtd(q, m)).join(', ') + ' (gastas no último golpe).' : '';
  const como = LIMPEZA[id] ? `Limpe ${E.vezes} ${NOME_LIMPEZA[LIMPEZA[id]] || LIMPEZA[id]} em volta com ${NOME_FERRAMENTA[E.ferramenta]}.` : `Escolha ${NOME_FERRAMENTA[E.ferramenta] || E.ferramenta} e dê ${E.vezes} golpes nesta plaquinha (feitos: ${a.vezes || 0}/${E.vezes}).`;
  abrirPlaca(`${E.nome} para ${CLIENTE_NOME[E.cliente]} (Cr$ ${Empreitas.pagaBase(id)}). ${como}${mat}`);
  return true;
}
// A plaquinha da longa: reservada → começar (com o material); pronta → entregar; senão, o que tem para hoje.
function acaoLote(id) {
  const E = dadosEmpreita(id), a = G.empreitas.aceitas[id], quem = E.familia ? 'a família' : CLIENTE_NOME[E.cliente] || '';
  if (typeof aditivoNaPlaquinha === 'function' && aditivoNaPlaquinha(id)) return true;   // (entrega B)
  if (cuidadoNaPlaquinha(id)) return true;   // (15/10, T4) a manta e a lona
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
  if (a.cura) desenhaPe(ctx, 'itens/' + a.cura, o.x - 22, o.y - 6, 1, 0.4);   // (15/10, T4) a manta e a lona instaladas, ao pé da plaquinha
  if (a.lona) desenhaPe(ctx, 'itens/lona', o.x - 22, o.y + 8, 1, 0.4);
  const auto = Empreitas.autoHoje(o.placaDe);
  if (a.estado === 'obra' && !a.trabalhou && auto) desenhaPe(ctx, 'itens/' + a.cura, o.x, o.y - 74 + sobe, 1, 0.75);   // (a manta trabalha hoje)
  else if (a.estado === 'obra' && !a.trabalhou) desenhaPe(ctx, 'itens/' + Empreitas.ferramentaHoje(o.placaDe), o.x, o.y - 74 + sobe, 1, 0.75);
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
  if (o.fixo !== undefined && G.empreitas.aceitas[o.empreitaDet]) { const a = G.empreitas.aceitas[o.empreitaDet]; (a.limpos || (a.limpos = [])).push(o.fixo); }   // (T6: a pedra que saiu da estrada não volta)
  const r = Empreitas.trabalhar(o.empreitaDet, dadosEmpreita(o.empreitaDet).ferramenta);
  if (r === 'pronta') golpeEmpreitaPronta(o.empreitaDet);
}
function golpeEmpreitaPronta(id) { const E = dadosEmpreita(id); sons.tocar('moedas', 1, 0.05, -4); avisar(`${E.nome}: pronto! ${CLIENTE_NOME[E.cliente] || ''} pagou Cr$ ${Empreitas.pagaBase(id)}.`); hudSujo(); if (G.mapa) poeEmpreitasNoMapa(G.mapa); }

// ---------- o quadro da Vila: Pensão e Serviços ----------
// Onde fica cada lugar (o cartão do quadro e a tarefa): o jogador novo não sabe onde é a mata nem a praia (teste de 12/10).
const ONDE_FICA = { vila: 'na Vila', quintal: 'no quintal', mata: 'na mata: saída oeste da Vila', praia: 'na praia: a rua do meio da Vila desce para o sul', pedreira: 'na pedreira', bairro: 'no Bairro Novo' };
const ondeFica = mapa => ONDE_FICA[mapa] || mapa;
function abrirQuadro(aba = 'servicos') {
  if (aba === 'servicos' && typeof Guia !== 'undefined' && !Guia.liberado('quadro')) { abrirPlaca('O quadro de serviços da Vila. Depois de conhecer o pessoal da Vila, os bicos ficam aqui.'); return; }
  const caixa = el('div', { class: 'painel quadro-vila com-pe' });
  const desenha = () => {
    const rolou = (caixa.querySelector('.miolo') || {}).scrollTop || 0;   // (C5) o miolo rola; o redesenho guarda onde estava
    caixa.innerHTML = '';
    const tab = (id, txt) => el('button', { class: 'botao' + (aba === id ? ' forte' : ''), onclick: e => { e.stopPropagation(); aba = id; desenha(); } }, txt);
    caixa.append(el('div', { class: 'titulo', style: 'font-size:26px' }, 'Quadro de pedidos da Vila'), el('div', { class: 'qv-abas' }, tab('servicos', 'Serviços'), tab('pensao', 'Pensão')));
    const miolo = el('div', { class: 'miolo' });   // (C5) o cabeçalho e o Fechar fixos; só o miolo rola
    if (aba === 'pensao') {
      // (16/10, E2 das encomendas de festa) A festa que um morador marcou na pensão: quem, a ocasião, o prato, a turma e a noite (no
      // lugar dos antigos pedidos da Vila com prazo). Só informa: a Rosa já disse sim, não há o que aceitar.
      const p = G.pensao, e = typeof Encomendas !== 'undefined' && p ? Encomendas.aberta(p, G.dia) : null;
      const quando = e && (e.dia === G.dia ? 'hoje à noite' : e.dia === G.dia + 1 ? 'amanhã à noite' : `${(e.dia - 1) % 7 >= 5 ? 'no' : 'na'} ${DIAS[(e.dia - 1) % 7]} à noite`);
      const o = e && Encomendas.ocasiao(e.quem, e.ocasiao);
      miolo.append(el('div', { class: 'qv-lista' }, ...(p && p.estado === 'aberta' ? (e ? [el('div', { class: 'orel-item qv-festa' }, el('img', { src: urlArte(iconePratoGrande(e.prato)) }),
        el('div', {}, el('b', {}, `${Encomendas.nome(e.quem)}: ${o ? o.nome : 'a festa'}`), o && o.convite ? el('div', { class: 'recado-fala' }, `"${o.convite}"`) : null,
          el('div', { class: 'orel-preco' }, `${quando} · a turma de ${e.turma} · ${Pratos.PRATOS[e.prato].nome}`)))]
        : [el('div', { class: 'rodape' }, 'Nenhuma festa marcada. Quando alguém encomendar, a Rosa avisa.')]) : [el('div', { class: 'rodape' }, 'Quando a pensão abrir, o povo da Vila marca as festas com a Rosa.')])));
    } else {
      const ids = G.empreitas.quadro, aceitas = Object.keys(G.empreitas.aceitas);
      const linha = (id, botao) => { const E = dadosEmpreita(id); return el('div', { class: 'orel-item' }, el('img', { src: urlItem(E.ferramenta === 'carga' ? 'telha' : E.ferramenta) }),
        el('div', {}, el('b', {}, `${E.nome} — ${CLIENTE_NOME[E.cliente] || ''}`), E.fala ? el('div', { class: 'recado-fala' }, `"${E.fala}"`) : null, el('div', { class: 'orel-preco' },
          `${ondeFica(E.mapa)} · ${E.tipo === 'longa' ? `Empreita (serviço de ${E.dias} dias)` : E.tipo === 'capina' ? 'a cada 3 dias, até o fim da estação' : 'uma tarde'} · Cr$ ${Empreitas.pagaBase(id)}` +
          (Object.keys(E.material).length ? ' · ' + Object.entries(E.material).map(([m, q]) => Itens.qtd(q, m)).join(', ') : ''))), botao); };
      const fx = Empreitas.faixa(), prox = FAIXAS_VILA[fx.i + 1], cap = G.empreitas.caprichados || 0;
      const pct = prox ? Math.round(100 * Math.min(G.empreitas.entregues / prox.entregues, prox.caprichados ? cap / prox.caprichados : 1)) : 100;
      miolo.append(el('div', { class: 'fala-vila' }, el('b', {}, 'Fala da Vila: ' + fx.nome),
        // (C12) os caprichados num pedaço à parte: a 1ª vez que aparecem, a seta e a fala do Bira vão nele (PRIMEIRA_TELA.caprichado, guia_setas.js)
        el('span', {}, prox ? ` · ${G.empreitas.entregues}/${prox.entregues} serviços` : ' · o nome mais respeitado da Vila',
          // (C12, rodada 1) antes de Pedreiro não sai caprichado (Empreitas.qualidade): o "0/5" não fica à vista sem dar para fazer
          prox && prox.caprichados ? el('span', { class: 'fv-caprichados' }, Empreitas.funcao() >= 2 ? `, ${cap}/${prox.caprichados} caprichados` : ', caprichado só de Pedreiro pra cima') : '', prox ? ` para ${prox.nome}` : ''),
        el('div', { class: 'barra-fala' }, el('div', { style: `width:${Math.min(100, pct)}%` }))));
      // (15/10, T3) O recado do dia: coisa de vizinho, à parte dos serviços (recados_jogo.js); sem recado hoje, a seção não aparece.
      const rec = typeof recadoNoQuadro === 'function' ? recadoNoQuadro(desenha) : null; if (rec) miolo.append(...rec);
      miolo.append(el('div', { class: 'cad-sub' }, 'Pedidos de hoje'), el('div', { class: 'qv-lista' }, ...(ids.length ? ids.map(id => {
        const pode = Empreitas.libera(id);
        const card = linha(id, pode ? el('button', { class: 'botao', onclick: e => { e.stopPropagation(); const r = Empreitas.aceitar(id, G.mochila, G.dinheiro);
          if (r === 'ok') { sons.tocar('carimbo', 1, 0.05, -6); avisar(`Aceito: ${dadosEmpreita(id).nome}.`); if (G.mapa) poeEmpreitasNoMapa(G.mapa); hudSujo(); desenha(); }
          else avisar({ limite: 'Uma empreita longa por vez (duas para o mestre de obras).', material: 'Para começar, traga o material na mochila.', ja: 'Já aceitou essa.' }[r] || 'Não deu.'); } }, 'Aceitar')
          : el('div', { class: 'orel-preco' }, `Pede ${Empreitas.faltaPara(id)}`));   // (C11) só o que falta ("Pede Acabamento 6" para quem já é pedreiro)
        // (C11) O pedido da fama: a Fala da Vila trouxe um serviço do degrau de cima, com o porquê na voz da Vila.
        if (id === G.empreitas.fama) { const E = dadosEmpreita(id), quem = CLIENTE_NOME[E.cliente] || '', falta = Empreitas.faltaPara(id);
          card.classList.add('qv-fama');
          card.children[1].append(el('div', { class: 'recado-fala' }, falta ? `Pela Fala da Vila: ${quem} ouviu falar do seu serviço e quer você nesta obra quando chegar a ${falta}.`
            : `Pela Fala da Vila: ${quem} ouviu falar do seu serviço e chamou você.`)); }
        return card;
      }) : [el('div', { class: 'rodape quadro-vazio' }, 'Por hoje é só: o povo deixa recado de manhã.'),
        // (dia cheio, Frente A) Junto, o que fazer: a mesma sugestão do Agora da tarde livre (cartao.js).
        ...(s => s ? [el('div', { class: 'rodape quadro-sugestao' }, 'Enquanto isso: ' + s.texto)] : [])(typeof ganhoDaTarde === 'function' ? ganhoDaTarde() : null)])));
      const enc = (G.mina && G.mina.encomendas) || [];
      if (enc.length) miolo.append(el('div', { class: 'cad-sub' }, 'Encomendas'), el('div', { class: 'qv-lista' }, ...enc.map((e, i) => el('div', { class: 'orel-item' }, el('img', { src: urlItem(e.item) }),
        el('div', {}, el('b', {}, `${CLIENTE_NOME[e.quem] || e.quem} quer ${Itens.qtd(e.qtd, e.item)}`), el('div', { class: 'orel-preco' }, `até ${DIAS[(e.ate - 1) % 7]} · Cr$ ${e.paga} · tem ${G.mochila.total(e.item)}`)),
        el('button', { class: 'botao', onclick: ev => { ev.stopPropagation(); const r = Mina.entregar(i, G.mochila); if (r === 'ok') { sons.tocar('moedas', 1, 0.05, -4); avisar(`Entregue! + Cr$ ${e.paga}`); hudSujo(); desenha(); } else avisar(r === 'vencida' ? 'Essa encomenda venceu.' : 'Falta material na mochila.'); } }, 'Entregar')))));
      const doBairro = typeof Bairro !== 'undefined' ? Bairro.pedidos() : [];
      if (doBairro.length) miolo.append(el('div', { class: 'cad-sub' }, 'Bairro Novo'), el('div', { class: 'qv-lista' }, ...doBairro.map(id => linha(id, Empreitas.libera(id)
        ? el('button', { class: 'botao', onclick: e => { e.stopPropagation(); const r = Empreitas.aceitar(id, G.mochila, G.dinheiro); if (r === 'ok') { sons.tocar('carimbo', 1, 0.05, -6); avisar(`Aceito: ${dadosEmpreita(id).nome}. A plaquinha está no terreno, no Bairro Novo.`); hudSujo(); desenha(); } else avisar({ limite: 'Uma empreita longa por vez (duas para o mestre de obras).' }[r] || 'Não deu.'); } }, 'Aceitar')
        : el('div', { class: 'orel-preco' }, `Pede ${NOMES_HAB[dadosEmpreita(id).hab.h]} ${dadosEmpreita(id).hab.n}`)))));
      const recAceitos = typeof linhasRecadosAceitos === 'function' ? linhasRecadosAceitos() : [];   // (T3) os recados aceitos, com o estado
      if (aceitas.length || recAceitos.length) miolo.append(el('div', { class: 'cad-sub' }, 'Aceitas'), el('div', { class: 'qv-lista' }, ...aceitas.map(id => linha(id, el('div', { class: 'orel-preco' }, Empreitas.textoEstado(id)))), ...recAceitos));
    }
    caixa.append(miolo, el('div', { class: 'pe', style: 'text-align:right' }, el('button', { class: 'botao forte', onclick: e => { e.stopPropagation(); fecharModal(); } }, 'Fechar')));
    miolo.scrollTop = rolou;
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
  Empreitas.poeQuadro(G.dia);
  if (typeof cartaDePedido === 'function') cartaDePedido(G.dia);
  const c = G.empreitas.capina;
  if (c && Math.floor((G.dia - 1) / 28) % 4 !== c.estacao) { G.empreitas.capina = null; G.feitosHoje.push('A capina do Seu Ananias acabou com a estação.'); }
  // (T6) O canteiro mudou com a obra e o novo não tem carrinho: o serviço do Zé acaba sem cobrança (ele se vira com o de lá).
  for (const id in G.empreitas.aceitas) { const E = EMPREITAS_CURTAS[id]; if (E && E.precisa && !E.precisa()) { delete G.empreitas.aceitas[id]; G.feitosHoje.push(`${CLIENTE_NOME[E.cliente] || ''}: "${E.nome}: deixa, a obra mudou de lugar e o carrinho ficou para trás."`); } }
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
// (C12, 16/10; o teste crítico: "subi de fama sem aviso nenhum") A Fala da Vila subiu de degrau: o aviso com o som da receita nova e o
// porquê (mais pedidos no quadro, e pagam melhor), na 1ª tela livre depois da noite da entrega. Uma vez por degrau (G.limpou.fama_vista:
// o degrau já avisado; o save antigo e o jogo novo começam no de agora, sem aviso).
const avisoDaFama = f => `A Vila te conhece mais: ${f.nome}! Mais pedidos no quadro, e pagam melhor.`;
ATUALIZADORES.push(() => {
  if (!G.empreitas || !G.limpou || typeof Empreitas === 'undefined') return;
  const f = Empreitas.faixa(), v = G.limpou.fama_vista;
  if (typeof v !== 'number') { G.limpou.fama_vista = f.i; return; }
  if (f.i <= v || menuAberto()) return;
  G.limpou.fama_vista = f.i; sons.tocar('receita_nova', 1, 0, -2); avisar(avisoDaFama(f));
});
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
// (15/10, T4) A manta de cura, a manta boa ou a lona na mão, na plaquinha da longa: instala (uma de cada por empreita, a qualquer hora
// antes de ficar pronta). A manta faz sozinha os dias de regador (a boa, também os de pá); a lona deixa trabalhar na chuva.
function cuidadoNaPlaquinha(id) {
  const it = itemDaMao(), a = G.empreitas.aceitas[id];
  if (!a || !(it in CUIDADOS || it === 'lona')) return false;
  const r = Empreitas.aplicarCuidado(id, it, G.mochila);
  if (r !== 'ok') return false;
  avisar({ ok: it === 'lona' ? 'Lona encerada no lote: a chuva não para mais o concreto nem a pintura.' : `${Itens.nome(it)} no lote: ${it === 'manta_boa' ? 'os dias de regador e de pá' : 'os dias de regador'} ela faz sozinha${it === 'manta_boa' ? ' (na chuva, o concreto só pega com a lona)' : ''}.`,
    ja: it === 'lona' ? 'Esse lote já tem lona.' : 'Esse lote já tem manta.', tarde: 'A obra já está pronta.', falta: 'Falta o item.', nao: 'Isso não vai no lote.' }[r]);
  if (r === 'ok') { sons.tocar('pousar', 1, 0.05, -4); hudSujo(); poeEmpreitasNoMapa(G.mapa); }
  return r === 'ok';   // (revisão T4a) já tem, pronta ou não vai: a plaquinha segue o normal (começar, entregar, o que tem para hoje)
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
    const f = typeof faltaDaEmpreita === 'function' && E.tipo === 'curta' ? faltaDaEmpreita(id) : null;
    const falta = f ? ` — falta ${Itens.qtd(f.n, f.item)}${LOJA.PRECOS[f.item] !== undefined ? ' (depósito)' : ''}` : '';
    return { texto: E.tipo === 'longa' ? `${E.nome}: ${Empreitas.textoEstado(id)}` : `Empreita: ${E.nome} (${ondeFica(E.mapa)})${falta}`, feito: E.tipo === 'curta' ? a.vezes : undefined, meta: E.tipo === 'curta' ? E.vezes : undefined, mapa: E.mapa };
  });
  for (let k = linhas.length - 1; k >= 0; k--) if (!linhas[k]) linhas.splice(k, 1);
  if (G.empreitas.capina && G.empreitas.capina.pos.length) linhas.push({ texto: `Capina do Seu Ananias: ${G.empreitas.capina.pos.length} matos no terreno`, mapa: 'vila' });
  return linhas;
});
