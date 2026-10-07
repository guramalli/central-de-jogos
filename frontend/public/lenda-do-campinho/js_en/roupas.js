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
    ['chapeu_dunas', 'cabeca', 'Desert Hat', 'chapeu-palha', null, { st: { vel: 3 } }],
    ['regata_dunas', 'camisa', 'Dune Tank Top', 'roupa-regata', '#e8c070', { st: { vel: 4 } }],
    ['bermuda_oasis', 'calcao', 'Oasis Shorts', 'baixo-praia', '#c8a060', {}],
    ['chuteira_dunas', 'chuteira', 'Dune Cleats', null, '#e0b050', {}],
    ['caneleira_areia', 'perna', 'Sand Shin Guards', null, '#d8b070', {}]]],
  toquio: [82, [
    ['headset_neon', 'cabeca', 'Neon Headset', 'chapeu-headset', null, { st: { foco: 60, visao: 1 } }],
    ['moletom_sakura', 'camisa', 'Sakura Hoodie', 'roupa-moletom', '#ff5ad0', { st: { foco: 50 } }],
    ['calca_neon', 'calcao', 'Neon Sweatpants', 'baixo-moletom', '#2a2a4a', {}],
    ['chuteira_shinkansen', 'chuteira', 'Shinkansen Cleats', null, '#f4f4f8', { st: { drible: 1 } }],
    ['caneleira_samurai', 'perna', 'Samurai Shin Guards', null, '#b01a2a', {}]]],
  miami: [95, [
    ['panama_miami', 'cabeca', 'Miami Panama Hat', 'chapeu-panama', null, {}],
    ['camiseta_flamingo', 'camisa', 'Flamingo T-Shirt', 'roupa-camiseta', '#ff7ab0', { st: { vel: 4 } }],
    ['bermuda_surf', 'calcao', 'Surf Shorts', 'baixo-praia', '#3ad0e0', {}],
    ['oculos_miami', 'acessorio', 'Miami Sunglasses', 'rosto-escuros', null, { st: { visao: 2 } }],
    ['chuteira_surfista', 'chuteira', 'Surfer Cleats', null, '#3ad0e0', { st: { chute: 1 } }],
    ['caneleira_salva', 'perna', 'Lifeguard Shin Guards', null, '#ff5a3a', {}]]],
  buenos: [108, [
    ['gorro_tango', 'cabeca', 'Porteño Beanie', 'chapeu-gorro', null, {}],
    ['terno_tango', 'camisa', 'Tango Suit', 'roupa-terno', '#1a1a2a', { st: { drible: 2 } }],
    ['calca_tango', 'calcao', 'Tango Pants', 'baixo-jeans', '#1a1a2a', {}]]],
  rio: [120, [
    ['bone_maraca', 'cabeca', 'Maracanã Cap', 'chapeu-bone', null, {}],
    ['regata_copacabana', 'camisa', 'Copacabana Tank Top', 'roupa-regata', '#2a9a4a', { st: { vel: 5 } }],
    ['bermuda_ipanema', 'calcao', 'Ipanema Shorts', 'baixo-praia', '#ffd23f', {}],
    ['colar_carnaval', 'acessorio', 'Carnival Flower Necklace', 'pescoco-havaiano', null, {}]]],
  lisboa: [132, [
    ['chapeu_tejo', 'cabeca', 'Tagus Straw Hat', 'chapeu-palha', null, {}],
    ['xadrez_bonde', 'camisa', 'Tram Plaid Shirt', 'roupa-xadrez', '#b03a3a', { st: { defesa: 1 } }],
    ['jeans_alfama', 'calcao', 'Alfama Jeans', 'baixo-jeans', '#3a4a8a', {}]]],
  paris: [144, [
    ['faixa_saibro', 'cabeca', 'Clay Court Headband', 'chapeu-faixa', null, { st: { drible: 1 } }],
    ['jaqueta_paris', 'camisa', 'Parisian Leather Jacket', 'roupa-couro', '#1a1a1a', { st: { chute: 2 } }],
    ['short_saibro', 'calcao', 'Clay Court Shorts', 'baixo-shorts', '#f4f4f8', {}],
    ['echarpe_paris', 'acessorio', 'Paris Scarf', 'pescoco-cachecol', null, {}]]],
  munique: [156, [
    ['gorro_alpes', 'cabeca', 'Alpine Beanie', 'chapeu-gorro', null, { st: { hp: 60 } }],
    ['moletom_alpes', 'camisa', 'Alpine Hoodie', 'roupa-moletom', '#2a5a3a', { st: { defesa: 1 } }],
    ['calca_alpes', 'calcao', 'Alpine Pants', 'baixo-jeans', '#5a3a1a', {}]]],
  milao: [164, [
    ['panama_milao', 'cabeca', 'Milan Fashion Hat', 'chapeu-panama', null, {}],
    ['terno_milao', 'camisa', 'Milan Fashion Suit', 'roupa-terno', '#5a1a6a', { st: { drible: 2 } }],
    ['short_grife', 'calcao', 'Designer Shorts', 'baixo-shorts', '#1a1a1a', {}]]],
  madri: [172, [
    ['headset_classico', 'cabeca', 'Derby Headset', 'chapeu-headset', null, { st: { foco: 80 } }],
    ['regata_madri', 'camisa', 'Madrid Tank Top', 'roupa-regata', '#e8e8f0', { st: { vel: 5 } }],
    ['short_classico', 'calcao', 'Derby Shorts', 'baixo-shorts', '#5a1a8a', {}]]],
  londres: [186, [
    ['cartola_londres', 'cabeca', 'London Top Hat', 'chapeu-cartola', null, { st: { visao: 2 } }],
    ['terno_londres', 'camisa', 'London Suit', 'roupa-terno', '#1a2a4a', { st: { chute: 2 } }],
    ['calca_bigben', 'calcao', 'Big Ben Pants', 'baixo-jeans', '#2a2a2a', {}],
    ['gravata_londres', 'acessorio', 'London Tie', 'pescoco-gravata', null, {}]]],
  santos: [190, [
    ['louros_rei', 'cabeca', 'King\'s Laurels', 'chapeu-louros', null, { st: { drible: 2, chute: 2 } }],
    ['camiseta_vila', 'camisa', 'Village Beach T-Shirt', 'roupa-camiseta', '#f4f4f8', { st: { vel: 5 } }],
    ['bermuda_gonzaga', 'calcao', 'Gonzaga Shorts', 'baixo-praia', '#1a1a1a', {}]]],
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
    const partes = []; if (it.atk) partes.push(`Attack ${it.atk}`);
    const NOME_ST = { hp: 'stamina', foco: 'foco', vel: 'velocidade', drible: 'drible', chute: 'chute', visao: 'vision', defesa: 'defesa', regen: 'recovery' };
    for (const [k, v] of Object.entries(it.st)) if (v) partes.push(`+${fmt(v)} ${NOME_ST[k] || k}`);
    const nomeCid = { doha: 'Doha', toquio: 'Tokyo', miami: 'Miami', buenos: 'Buenos Aires', rio: 'Rio de Janeiro', lisboa: 'Lisbon', paris: 'Paris', munique: 'Munich', milao: 'Milan', madri: 'Madrid', londres: 'London', santos: 'Santos' }[cid] || cid;
    ITENS[id] = Object.assign({ nome, tipo: 'equip', slot, lvl: lv, preco, venda: Math.round(preco * 0.22), desc: `${partes.join(', ')}. ${nomeCid} style.`, cidadeRoupa: cid },
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
