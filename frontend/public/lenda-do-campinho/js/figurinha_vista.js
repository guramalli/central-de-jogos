/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🃏 FIGURINHA À VISTA (v408.3, ECA Digital — Lei 15.211/2025, que proíbe "caixas de recompensa" em jogos para crianças)
   Pedido do dono: comprar algo cuja recompensa é sorteada = caixa de recompensa. Então:
   - O PACOTINHO NÃO SE COMPRA MAIS (em loja nenhuma). Na banca do Seu Juca (e no Presidente do clube, que também vendia)
     aparece uma VITRINE com 3 figurinhas À VISTA (desenho e nome), escolhidas entre as que faltam no álbum, primeiro as
     do lugar onde a banca está. Cada uma custa FV_PRECO tostões (o preço do antigo pacotinho). A vaga comprada é
     reposta na hora e a vitrine toda muda a cada dia. Álbum completo: a vitrine fecha com um recado.
   - PACOTINHOS DE PRESENTE (cadastro, recompensa do dia, baú do Hoje, Copa, missões, desafios) continuam: não há
     pagamento. Ao abrir, a figurinha aparece na hora numa cartinha. Os que já estão na mochila (saves antigos) abrem igual.
   - FEIRA DOS JOGADORES: pacotinho fechado e Baú da Torre não podem ser anunciados, e anúncio antigo deles não se
     compra (seria pagar tostões por um sorteio). [o servidor também deveria recusar — ver relatório ao coordenador]
   - TAREFAS DE CAÇA: a troca "3 Pacotinhos" virou "as 3 figurinhas da vitrine", com os nomes escritos antes de trocar.
   Fica salvo em save.fvVit = { dia, ids }. Prefixo: fv. Carregar no FIM (depois de ui.js/itens.js/itens_marcas.js/
   luxo.js — todos os embrulhos de modalLoja —, game.js, carreira_metas.js, tarefas_loja.js, mercado.js e caderno.js).
   ============================================================ */
const FV_PRECO = 120, FV_VAGAS = 3;
const FV_FEIRA_FORA = new Set(['pacotinho', 'bau_torre']); // itens-sorteio que não podem ser vendidos por tostões na Feira
// de que lugar é cada figurinha (os adversários de cada mapa da cidade natal; os mestres no lugar onde ensinam)
const FV_REGIAO = {
  f_pombo: 'vila', f_fominha: 'vila', f_caramelo: 'vila', f_zagueiro_rua: 'vila', f_tonhao: 'vila', f_ze: 'vila',
  f_caranguejo: 'praia', f_gaivota: 'praia', f_futevoleiro: 'praia', f_salva: 'praia', f_rei_areia: 'praia', f_tata: 'praia',
  f_skatista: 'cidade', f_pivo: 'cidade', f_ala: 'cidade', f_goleiro_linha: 'cidade', f_rei_quadra: 'cidade', f_ginga: 'cidade',
  f_volante: 'ct', f_lateral: 'ct', f_preparador: 'ct', f_zagueiro_sub20: 'ct', f_capitao: 'ct',
  f_meia: 'estadio', f_centroavante: 'estadio', f_xerife: 'estadio', f_arbitro: 'estadio', f_paredao: 'estadio', f_dada: 'estadio',
};
const FV_REG_NOME = { vila: 'Vila', praia: 'Praia', cidade: 'Cidade', ct: 'CT', estadio: 'Estádio' };

/* ---------- o pacotinho sai das lojas ---------- */
// (data.js já não põe o pacotinho em loja nenhuma; isto pega qualquer loja que outro arquivo tenha montado com ele)
function fvTiraDaLoja(d) {
  if (!d || !Array.isArray(d.loja) || !d.loja.includes('pacotinho')) return;
  d.loja = d.loja.filter(x => x !== 'pacotinho'); d.fvVitrine = true;
}
for (const k of ['juca', 'presidente']) if (NPCS[k]) NPCS[k].fvVitrine = true;
for (const n of Object.values(NPCS)) fvTiraDaLoja(n);
if (ITENS.pacotinho) {
  delete ITENS.pacotinho.preco; // sem preço, nenhuma loja consegue vender (modalLoja pula item sem preço)
  ITENS.pacotinho.desc = 'Presente do jogo: abra e a figurinha aparece na hora! Pacotinho não se vende nas lojas: na banca do Seu Juca você escolhe a figurinha que quer, vendo antes.';
}

/* ---------- a vitrine ---------- */
const fvHoje = () => typeof diaHoje === 'function' ? diaHoje() : new Date().toISOString().slice(0, 10);
const fvFig = id => FIGURINHAS.find(f => f.id === id);
function fvRegiaoAqui() {
  const m = typeof G !== 'undefined' && G.mapa; if (!m) return null;
  if (FV_REG_NOME[m.id]) return m.id;
  return FV_REG_NOME[m.tema] ? m.tema : null;
}
// escolhe n figurinhas que faltam (e que ainda não estão na vitrine): primeiro as do lugar onde você está
function fvEscolhe(s, ja, n) {
  if (n <= 0) return [];
  const figs = s.figs || {}, reg = fvRegiaoAqui();
  const falta = FIGURINHAS.filter(f => !figs[f.id] && !ja.includes(f.id)).map(f => f.id);
  const mistura = l => { for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; } return l; };
  const daqui = mistura(falta.filter(id => reg && FV_REGIAO[id] === reg)), resto = mistura(falta.filter(id => !(reg && FV_REGIAO[id] === reg)));
  return daqui.concat(resto).slice(0, n);
}
// as figurinhas da vitrine hoje (repõe as vagas que ficaram livres; dia novo = vitrine nova)
function fvVitrine() {
  const s = G.save; if (!s) return [];
  s.figs = s.figs || {};
  let v = s.fvVit; const hoje = fvHoje();
  if (!v || typeof v !== 'object' || !Array.isArray(v.ids)) v = s.fvVit = { dia: hoje, ids: [] };
  if (v.dia !== hoje) { v.dia = hoje; v.ids = []; }
  v.ids = v.ids.filter(id => fvFig(id) && !s.figs[id]);
  v.ids.push(...fvEscolhe(s, v.ids, FV_VAGAS - v.ids.length));
  return v.ids;
}
// o desenho da figurinha (o mesmo do álbum)
function fvCarta(fid, w = 64, h = 80) {
  const f = fvFig(fid), c = mkCanvas(w, h);
  const mon = Object.values(MONSTROS).find(m => m.fig === fid);
  const npcLook = { f_ze: NPCS.ze, f_tata: NPCS.tata, f_ginga: NPCS.ginga, f_dada: NPCS.dada }[fid];
  const look = mon ? mon.look : npcLook ? npcLook.look : { tipo: 'humano', corpo: 'm', pele: 'pele-clara', cabelo: 'cabelo-anime', corCabelo: 'roxo', roupa: 'roupa-futebol', corRoupa: '#7a4aff', baixo: 'baixo-shorts' };
  try { pintaAparencia(c, look, { fundo: f ? f.cor : '#ccc' }); } catch (e) { }
  return c;
}
function fvCompra(fid, npc) {
  const s = G.save, f = fvFig(fid); if (!s || !f || s.figs[fid] || !fvVitrine().includes(fid)) return;
  if (s.ouro < FV_PRECO) { log(`Tostões insuficientes! A figurinha custa ${fmt(FV_PRECO)} tostões.`, 'l-dano'); som('erro'); return; }
  s.ouro -= FV_PRECO;
  log(`🃏 Você comprou a figurinha ${f.nome} por ${fmt(FV_PRECO)} tostões.`, 'l-loot');
  ganhaFigurinha(fid); // (nova: entra no álbum e conta para a carreira)
  fvVitrine(); // a vaga é reposta na hora
  salvar(); G.uiSujo = true;
  if (npc) modalLoja(npc, 'comprar');
}
function fvVitrineEl(npc) {
  const s = G.save, ids = fvVitrine();
  const box = el('div', { class: 'fv-vitrine' }, el('h3', {}, '🃏 Vitrine de figurinhas'));
  if (!ids.length) {
    box.append(el('p', { class: 'fv-vazia' }, s.flags && s.flags.album_premio ? '🎉 Você já tem TODAS as figurinhas do álbum! A vitrine fechou: não falta nenhuma.'
      : '🎉 Você já tem TODAS as figurinhas do álbum! A vitrine fechou. Abra o Álbum (no Caderno do Craque) para resgatar o seu prêmio!'));
    return box;
  }
  box.append(el('p', { class: 'dica' }, `Escolha a figurinha que você quer: você VÊ qual leva antes de pagar. Cada uma custa ${fmt(FV_PRECO)} tostões. Só aparecem as que faltam no seu álbum; a vitrine muda quando você compra uma e a cada dia.`));
  const g = el('div', { class: 'fv-cartas' });
  for (const id of ids) {
    const f = fvFig(id), reg = FV_REGIAO[id], pobre = s.ouro < FV_PRECO;
    g.append(el('div', { class: 'fv-carta', 'data-fig': id }, fvCarta(id), el('b', {}, f.nome), el('small', {}, reg ? `📍 ${FV_REG_NOME[reg]}` : '⭐ Especial'), precoTag(FV_PRECO),
      el('button', { class: 'btn verde mini fv-compra', type: 'button', disabled: pobre ? 'disabled' : null, title: pobre ? 'Tostões insuficientes' : '', onclick: () => fvCompra(id, npc) }, 'Comprar')));
  }
  box.append(g);
  return box;
}
{
  const _fvLoja = modalLoja;
  modalLoja = function (npc, aba = 'comprar') {
    const d = npc && npc.d; fvTiraDaLoja(d);
    const r = _fvLoja.apply(this, arguments);
    try {
      if (aba === 'comprar' && d && d.fvVitrine) {
        const lista = document.querySelector('#modalConteudo .lista');
        if (lista) { lista.before(fvVitrineEl(npc)); if (!lista.children.length) lista.remove(); }
      }
    } catch (e) { console.error('vitrine de figurinhas', e); }
    return r;
  };
}

/* ---------- pacotinho de presente: a figurinha aparece na hora ---------- */
let FV_ABRINDO = null, FV_CAIXA = null;
{
  const _fvGanha = ganhaFigurinha;
  ganhaFigurinha = function (fid) {
    if (FV_ABRINDO) FV_ABRINDO.push([fid, !((G.save && G.save.figs) || {})[fid]]);
    return _fvGanha.apply(this, arguments);
  };
  const _fvAbre = abrirPacotinho;
  abrirPacotinho = function () {
    FV_ABRINDO = [];
    try { return _fvAbre.apply(this, arguments); }
    finally { const lista = FV_ABRINDO; FV_ABRINDO = null; for (const [fid, nova] of lista) try { fvMostraCarta(fid, nova); } catch (e) { } }
  };
}
// uma cartinha por pacotinho; abrindo vários seguidos, as cartinhas entram na mesma caixa
function fvMostraCarta(fid, nova) {
  const f = fvFig(fid); if (!f) return;
  const s = G.save, n = Object.keys(s.figs || {}).length;
  const carta = el('div', { class: 'fv-carta fv-aberta' + (nova ? ' fv-nova' : ''), 'data-fig': fid }, fvCarta(fid, 96, 120), el('b', {}, f.nome),
    el('small', {}, nova ? `NOVA! Álbum: ${n}/${FIGURINHAS.length}` : 'Repetida: virou 25 tostões'));
  if (FV_CAIXA && document.body.contains(FV_CAIXA)) { FV_CAIXA.querySelector('.fv-cartas').append(carta); FV_CAIXA.querySelector('h3').textContent = '🃏 Você abriu os pacotinhos!'; return; }
  if (typeof cjCaixa !== 'function') { banner(nova ? 'FIGURINHA NOVA!' : 'Figurinha repetida', f.nome); return; }
  cjCaixa((caixa, fecha) => {
    FV_CAIXA = caixa; caixa.classList.add('fv-caixa');
    const h = document.createElement('h3'); h.textContent = '🃏 Você abriu o pacotinho!'; caixa.append(h);
    caixa.append(el('div', { class: 'fv-cartas' }, carta));
    const ops = el('div', { class: 'cj-ops' }, el('button', { class: 'btn amarelo cj-foco', type: 'button', onclick: () => { FV_CAIXA = null; fecha(true); } }, 'Oba!'));
    caixa.append(ops);
    return { enter: true, esc: true };
  }).then(() => { FV_CAIXA = null; });
}

/* ---------- Feira dos jogadores: nada de pagar tostões por um sorteio ---------- */
if (typeof mktFormAnuncio === 'function') {
  const _fvForm = mktFormAnuncio;
  mktFormAnuncio = function () {
    const s = G.save, orig = s.mochila;
    s.mochila = orig.filter(x => !FV_FEIRA_FORA.has(x.id)); // a lista de "o que dá para vender" não mostra os itens-sorteio
    let r; try { r = _fvForm.apply(this, arguments); } finally { s.mochila = orig; }
    try { if (orig.some(x => FV_FEIRA_FORA.has(x.id)) && r && r.append) r.append(el('small', { class: 'fv-feira' }, '🃏 Pacotinho de figurinhas e Baú da Torre não podem ser vendidos na feira: o que tem dentro é surpresa.')); } catch (e) { }
    return r;
  };
}
if (typeof mktLinhaAnuncio === 'function') {
  const _fvLinha = mktLinhaAnuncio;
  mktLinhaAnuncio = function (a) {
    const r = _fvLinha.apply(this, arguments);
    try {
      if (a && FV_FEIRA_FORA.has(a.itemId) && a.vendedorId !== (typeof PORTAL !== 'undefined' && PORTAL.contaId)) {
        const b = r.querySelector('button'); if (b) b.replaceWith(el('small', { class: 'fv-feira' }, '🔒 Surpresa fechada: não se compra'));
      }
    } catch (e) { }
    return r;
  };
}
if (typeof mktCompra === 'function') {
  const _fvCompraMkt = mktCompra;
  mktCompra = function (a, q, depois) {
    if (a && FV_FEIRA_FORA.has(a.itemId)) { avisoJogo('🏪 Esse item é uma surpresa fechada (o que tem dentro é sorteado), então não pode ser comprado com tostões.'); return depois && depois(); }
    return _fvCompraMkt.apply(this, arguments);
  };
}

/* ---------- Tarefas de caça: as figurinhas que você leva aparecem antes ---------- */
if (typeof TAR_LOJA !== 'undefined') {
  const o = TAR_LOJA.find(x => x.id === 'figs');
  if (o) Object.assign(o, {
    nome: () => { const ids = fvVitrine(); return ids.length === 1 ? `A figurinha ${fvFig(ids[0]).nome}` : `${ids.length} figurinhas: ${ids.map(id => fvFig(id).nome).join(', ')}`; },
    desc: 'Você vê antes quais figurinhas leva: são as da vitrine do Seu Juca de hoje (só as que faltam no seu álbum).',
    mostra: () => fvVitrine().length > 0,
    da: () => { const ids = fvVitrine().slice(); for (const id of ids) ganhaFigurinha(id); fvVitrine(); },
  });
}

/* ---------- estilo ---------- */
(function () {
  if (document.getElementById('fv-css')) return;
  const st = document.createElement('style'); st.id = 'fv-css';
  st.textContent = `
  .fv-vitrine { background: #fff8e4; border: 2px solid #e0b860; border-radius: 10px; padding: 8px 10px; margin: 6px 0 10px; }
  .fv-vitrine h3 { margin: 0 0 4px; font-family: Fredoka, Nunito, sans-serif; }
  .fv-vitrine .dica { margin: 0 0 6px; }
  .fv-vazia { margin: 4px 0; font-weight: 700; }
  .fv-cartas { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
  .fv-carta { width: 100px; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 6px 4px; border-radius: 8px; border: 3px solid #c8901a;
    background: linear-gradient(160deg, #fff6d0, #ffd86a); text-align: center; font-size: 12px; line-height: 1.15; }
  .fv-carta canvas { width: 64px; height: 80px; border-radius: 4px; }
  .fv-carta b { font: 700 13px Fredoka, Nunito, sans-serif; }
  .fv-carta small { color: #6a5040; }
  .fv-carta .preco { font-weight: 800; }
  .fv-carta .fv-compra { margin-top: auto; width: 100%; min-height: 32px; padding-left: 4px; padding-right: 4px; }
  @media (max-width: 420px) { .fv-cartas { gap: 5px; } .fv-carta { width: 92px; padding: 5px 3px; } .fv-carta b { font-size: 12px; } }
  .fv-carta.fv-aberta { width: 128px; } .fv-carta.fv-aberta canvas { width: 96px; height: 120px; }
  .fv-carta.fv-nova { box-shadow: 0 0 10px #ffc83a; } .fv-carta.fv-nova small { color: #1f8a3a; font-weight: 800; }
  .fv-caixa .fv-cartas { margin: 6px 0; max-height: 60vh; overflow-y: auto; }
  .fv-feira { color: #8a5a2a; font-weight: 700; }
  `;
  document.head.append(st);
})();
