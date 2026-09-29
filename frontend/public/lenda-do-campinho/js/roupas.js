/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   👕 ROUPAS DE CADA CIDADE (v246)
   Antes, do nível 60 ao 106, Cairo/Doha/Tóquio/Miami vendiam o mesmo conjunto "Mundo" (nível 55)
   e chapéu/calção quase sumiam depois do 40. Agora cada cidade do mundo tem o seu visual:
   chapéu + camisa de estilo + calção (e, no buraco 60–106, também chuteira e caneleira; alguns acessórios).
   Vendidos na loja da cidade; o chapéu e o calção também caem (raro) dos adversários de lá.
   Os atributos seguem a curva entre os conjuntos Mundo/Elite/Titã/Galáxia (as camisas de estilo são
   alternativas: um pouco abaixo da camisa principal do nível, com um bônus diferente).
   Ícones: a/i_<id>.webp (Higgsfield, grade 2x2). O visual usa peças que o boneco já desenha.
   Carregar DEPOIS de game.js e ANTES de montarias.js (a skin de luxo continua valendo por cima).
   ============================================================ */
const ROUPAS_CIDADE = {
  // cidade: [nível, [peças]]  peça = [id, slot, nome, avatar, cor, extra]
  doha: [70, [
    ['chapeu_dunas', 'cabeca', 'Chapéu do Deserto', 'chapeu-palha', null, { st: { vel: 3 } }],
    ['regata_dunas', 'camisa', 'Regata das Dunas', 'roupa-regata', '#e8c070', { st: { vel: 4 } }],
    ['bermuda_oasis', 'calcao', 'Bermuda do Oásis', 'baixo-praia', '#c8a060', {}],
    ['chuteira_dunas', 'chuteira', 'Chuteira das Dunas', null, '#e0b050', {}],
    ['caneleira_areia', 'perna', 'Caneleira de Areia', null, '#d8b070', {}]]],
  toquio: [82, [
    ['headset_neon', 'cabeca', 'Headset Neon', 'chapeu-headset', null, { st: { foco: 60, visao: 1 } }],
    ['moletom_sakura', 'camisa', 'Moletom Sakura', 'roupa-moletom', '#ff5ad0', { st: { foco: 50 } }],
    ['calca_neon', 'calcao', 'Calça de Moletom Neon', 'baixo-moletom', '#2a2a4a', {}],
    ['chuteira_shinkansen', 'chuteira', 'Chuteira Shinkansen', null, '#f4f4f8', { st: { drible: 1 } }],
    ['caneleira_samurai', 'perna', 'Caneleira Samurai', null, '#b01a2a', {}]]],
  miami: [95, [
    ['panama_miami', 'cabeca', 'Chapéu Panamá de Miami', 'chapeu-panama', null, {}],
    ['camiseta_flamingo', 'camisa', 'Camiseta Flamingo', 'roupa-camiseta', '#ff7ab0', { st: { vel: 4 } }],
    ['bermuda_surf', 'calcao', 'Bermuda Surf', 'baixo-praia', '#3ad0e0', {}],
    ['oculos_miami', 'acessorio', 'Óculos Escuros de Miami', 'rosto-escuros', null, { st: { visao: 2 } }],
    ['chuteira_surfista', 'chuteira', 'Chuteira Surfista', null, '#3ad0e0', { st: { chute: 1 } }],
    ['caneleira_salva', 'perna', 'Caneleira Salva-Vidas', null, '#ff5a3a', {}]]],
  buenos: [108, [
    ['gorro_tango', 'cabeca', 'Gorro Portenho', 'chapeu-gorro', null, {}],
    ['terno_tango', 'camisa', 'Terno do Tango', 'roupa-terno', '#1a1a2a', { st: { drible: 2 } }],
    ['calca_tango', 'calcao', 'Calça do Tango', 'baixo-jeans', '#1a1a2a', {}]]],
  rio: [120, [
    ['bone_maraca', 'cabeca', 'Boné do Maracanã', 'chapeu-bone', null, {}],
    ['regata_copacabana', 'camisa', 'Regata de Copacabana', 'roupa-regata', '#2a9a4a', { st: { vel: 5 } }],
    ['bermuda_ipanema', 'calcao', 'Bermuda de Ipanema', 'baixo-praia', '#ffd23f', {}],
    ['colar_carnaval', 'acessorio', 'Colar de Flores do Carnaval', 'pescoco-havaiano', null, {}]]],
  lisboa: [132, [
    ['chapeu_tejo', 'cabeca', 'Chapéu de Palha do Tejo', 'chapeu-palha', null, {}],
    ['xadrez_bonde', 'camisa', 'Camisa Xadrez do Bonde', 'roupa-xadrez', '#b03a3a', { st: { defesa: 1 } }],
    ['jeans_alfama', 'calcao', 'Jeans de Alfama', 'baixo-jeans', '#3a4a8a', {}]]],
  paris: [144, [
    ['faixa_saibro', 'cabeca', 'Faixa do Saibro', 'chapeu-faixa', null, { st: { drible: 1 } }],
    ['jaqueta_paris', 'camisa', 'Jaqueta de Couro Parisiense', 'roupa-couro', '#1a1a1a', { st: { chute: 2 } }],
    ['short_saibro', 'calcao', 'Short do Saibro', 'baixo-shorts', '#f4f4f8', {}],
    ['echarpe_paris', 'acessorio', 'Echarpe de Paris', 'pescoco-cachecol', null, {}]]],
  munique: [156, [
    ['gorro_alpes', 'cabeca', 'Gorro dos Alpes', 'chapeu-gorro', null, { st: { hp: 60 } }],
    ['moletom_alpes', 'camisa', 'Moletom dos Alpes', 'roupa-moletom', '#2a5a3a', { st: { defesa: 1 } }],
    ['calca_alpes', 'calcao', 'Calça dos Alpes', 'baixo-jeans', '#5a3a1a', {}]]],
  milao: [164, [
    ['panama_milao', 'cabeca', 'Chapéu Fashion de Milão', 'chapeu-panama', null, {}],
    ['terno_milao', 'camisa', 'Terno Fashion de Milão', 'roupa-terno', '#5a1a6a', { st: { drible: 2 } }],
    ['short_grife', 'calcao', 'Short de Grife', 'baixo-shorts', '#1a1a1a', {}]]],
  madri: [172, [
    ['headset_classico', 'cabeca', 'Headset do Clássico', 'chapeu-headset', null, { st: { foco: 80 } }],
    ['regata_madri', 'camisa', 'Regata Madrilenha', 'roupa-regata', '#e8e8f0', { st: { vel: 5 } }],
    ['short_classico', 'calcao', 'Short do Clássico', 'baixo-shorts', '#5a1a8a', {}]]],
  londres: [186, [
    ['cartola_londres', 'cabeca', 'Cartola Londrina', 'chapeu-cartola', null, { st: { visao: 2 } }],
    ['terno_londres', 'camisa', 'Terno Londrino', 'roupa-terno', '#1a2a4a', { st: { chute: 2 } }],
    ['calca_bigben', 'calcao', 'Calça do Big Ben', 'baixo-jeans', '#2a2a2a', {}],
    ['gravata_londres', 'acessorio', 'Gravata Londrina', 'pescoco-gravata', null, {}]]],
  santos: [190, [
    ['louros_rei', 'cabeca', 'Louros do Rei', 'chapeu-louros', null, { st: { drible: 2, chute: 2 } }],
    ['camiseta_vila', 'camisa', 'Camiseta Praiana da Vila', 'roupa-camiseta', '#f4f4f8', { st: { vel: 5 } }],
    ['bermuda_gonzaga', 'calcao', 'Bermuda do Gonzaga', 'baixo-praia', '#1a1a1a', {}]]],
};
// preço pela curva dos conjuntos que já existem (Mundo 55, Elite 108, Titã 130, Galáxia 172, Copa 188)
function precoRoupa(L) {
  const P = [[55, 23000], [70, 30000], [82, 38000], [95, 48000], [108, 62000], [130, 165000], [172, 450000], [190, 600000]];
  for (let i = 1; i < P.length; i++) if (L <= P[i][0]) { const [a, pa] = P[i - 1], [b, pb] = P[i]; return Math.round((pa + (pb - pa) * (L - a) / (b - a)) / 500) * 500; }
  return 600000;
}
const ROUPAS_IDS = [];
{
  const soma = (a, b) => { const r = Object.assign({}, a); for (const [k, v] of Object.entries(b || {})) r[k] = (r[k] || 0) + v; return r; };
  for (const [cid, [L, pecas]] of Object.entries(ROUPAS_CIDADE)) for (const [id, slot, nome, avatar, cor, extra] of pecas) {
    let it; const lv = L + ({ camisa: 1, acessorio: 2, perna: 2 }[slot] || 0);
    if (slot === 'cabeca') it = { def: Math.round(4 + lv * 0.07), st: soma({ hp: Math.round(lv * 1.1), drible: Math.floor(lv / 45), chute: Math.floor(lv / 45) }, extra.st), fator: 0.8 };
    else if (slot === 'camisa') it = { def: Math.round(12 + lv * 0.12), st: soma({ hp: Math.round(lv * 2) }, extra.st), fator: 1 };
    else if (slot === 'calcao') it = { def: Math.round(5 + lv * 0.075), st: soma({ vel: Math.round(3 + lv / 30), hp: Math.round(lv * 0.8) }, extra.st), fator: 0.8 };
    else if (slot === 'acessorio') it = { def: Math.round(2 + lv * 0.03), st: soma({ foco: Math.round(lv * 1.2), regen: Math.round(1 + lv / 60) }, extra.st), fator: 1 };
    else if (slot === 'chuteira') it = { atk: Math.round(19 + lv * 0.1), st: soma({ vel: Math.round(5 + lv / 30) }, extra.st), fator: 0.9 };
    else if (slot === 'perna') it = { def: Math.round(6 + lv * 0.045), st: soma({ defesa: 1, hp: Math.round(lv * 0.7) }, extra.st), fator: 0.9 };
    const preco = Math.round(precoRoupa(lv) * it.fator / 500) * 500;
    const partes = []; if (it.atk) partes.push(`Ataque ${it.atk}`);
    const NOME_ST = { hp: 'fôlego', foco: 'foco', vel: 'velocidade', drible: 'drible', chute: 'chute', visao: 'visão', defesa: 'defesa', regen: 'recuperação' };
    for (const [k, v] of Object.entries(it.st)) if (v) partes.push(`+${fmt(v)} ${NOME_ST[k] || k}`);
    const nomeCid = { doha: 'Doha', toquio: 'Tóquio', miami: 'Miami', buenos: 'Buenos Aires', rio: 'Rio de Janeiro', lisboa: 'Lisboa', paris: 'Paris', munique: 'Munique', milao: 'Milão', madri: 'Madri', londres: 'Londres', santos: 'Santos' }[cid] || cid;
    ITENS[id] = Object.assign({ nome, tipo: 'equip', slot, lvl: lv, preco, venda: Math.round(preco * 0.22), desc: `${partes.join(', ')}. Estilo de ${nomeCid}.`, cidadeRoupa: cid },
      it.atk ? { atk: it.atk } : { def: it.def }, { st: it.st }, avatar ? { avatar } : {}, cor ? { cor } : {});
    ROUPAS_IDS.push(id);
    const n = 'i_' + id; if (typeof ASSET_SET !== 'undefined' && !ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); }
  }
}
// o boneco veste a cor da camisa de estilo e do calção; o acessório de rosto (óculos) vai no rosto
{
  const _lookRoupas = lookJogador;
  lookJogador = function (retrato) {
    const L = _lookRoupas.apply(this, arguments); const eq = G.save && G.save.equip; if (!L || !eq) return L;
    const cam = eq.camisa && ITENS[eq.camisa], cal = eq.calcao && ITENS[eq.calcao], ace = eq.acessorio && ITENS[eq.acessorio];
    if (cam && cam.cidadeRoupa && cam.cor) L.corRoupa = cam.cor;
    if (cal && cal.cidadeRoupa && cal.cor) L.corBaixo = cal.cor;
    if (ace && ace.avatar && /^rosto-/.test(ace.avatar)) { L.rosto = ace.avatar; if (L.pescoco === ace.avatar) delete L.pescoco; }
    return L;
  };
}
// lojas das cidades e quedas raras (depois que todas as cidades foram montadas)
function roupasNasLojas() {
  for (const [cid, [, pecas]] of Object.entries(ROUPAS_CIDADE)) {
    const ids = pecas.map(p => p[0]);
    for (const nid of ['loja_' + cid, 'lojista_' + cid]) { const n = NPCS[nid]; if (n && Array.isArray(n.loja)) for (const id of ids) if (!n.loja.includes(id)) n.loja.push(id); }
    const cab = pecas.find(p => p[1] === 'cabeca'), cal = pecas.find(p => p[1] === 'calcao');
    for (const [tid, d] of Object.entries(MONSTROS)) {
      if (d.treino || d.chefe || !Array.isArray(d.loot) || !d._arq) continue;
      const sp = typeof indice === 'function' && indice().spawn[tid]; let h = sp && sp.mapa;
      if (h && typeof CACA_POR_ID !== 'undefined' && CACA_POR_ID[h]) h = CACA_POR_ID[h].host;
      if (h !== cid) continue;
      const qual = d._arq === 'zagueiro' ? cab : d._arq === 'ponta' ? cal : null;
      if (qual && !d.loot.some(l => l[0] === qual[0])) d.loot.push([qual[0], 0.003, 1, 1]);
    }
  }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', roupasNasLojas); else setTimeout(roupasNasLojas, 0);
