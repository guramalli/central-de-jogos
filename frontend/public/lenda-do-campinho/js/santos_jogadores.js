/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   ⚪⚫ JOGADORES DE SANTOS (v298): os adversários de Santos eram todos "meninos da Vila" (2 desenhos, camisa branca)
   e ficavam muito parecidos. Agora há 5 jogadores novos da Baixada (Higgsfield, a/boneco_arq_*_santos.webp):
   zagueiro (braçadeira de capitão, âncora), volante (bandana, toalha, broche de baleia), meia (corrente dourada,
   bola no pé), centroavante (quepe de marinheiro, cachecol listrado) e ponta (boné virado, colar de surfista).
   Cada adversário de Santos SORTEIA a sua aparência (fixa para ele) entre as do seu tipo; os meninos da Vila
   continuam na mistura. O Capitão dos Meninos da Vila (chefão) segue único.
   Carregar DEPOIS de santos.js e arquetipos.js.
   ============================================================ */
Object.assign(META_REG, {"arq_zagueiro_santos":[{"cabeca":[33,55,174,151],"tronco":[82,151,118,210]},{"cabeca":[31,55,167,151],"tronco":[82,151,118,210]},{"cabeca":[35,55,170,151],"tronco":[82,151,118,210]},{"cabeca":[31,55,167,151],"tronco":[82,151,118,210]},{"cabeca":[55,60,160,154],"tronco":[82,154,118,212]},{"cabeca":[52,61,156,154],"tronco":[82,154,118,212]},{"cabeca":[53,61,155,154],"tronco":[82,154,118,212]},{"cabeca":[56,62,158,155],"tronco":[82,155,118,212]},{"cabeca":[34,59,163,153],"tronco":[82,153,118,212]},{"cabeca":[36,61,162,154],"tronco":[82,154,118,212]},{"cabeca":[36,59,162,153],"tronco":[82,153,118,212]},{"cabeca":[35,60,163,154],"tronco":[82,154,118,212]}],"arq_volante_santos":[{"cabeca":[22,80,145,166],"tronco":[45,166,142,208]},{"cabeca":[20,80,148,244],"tronco":[76,244,113,246]},{"cabeca":[33,80,160,245],"tronco":[83,245,117,246]},{"cabeca":[24,80,146,166],"tronco":[45,166,142,208]},{"cabeca":[40,81,166,249],"tronco":[81,249,137,254]},{"cabeca":[33,81,160,249],"tronco":[75,249,133,254]},{"cabeca":[29,81,155,248],"tronco":[68,248,128,255]},{"cabeca":[32,81,158,247],"tronco":[68,247,129,256]},{"cabeca":[46,86,156,163],"tronco":[58,163,152,203]},{"cabeca":[32,86,147,244],"tronco":[68,244,107,244]},{"cabeca":[52,86,166,245],"tronco":[91,245,118,245]},{"cabeca":[39,86,152,247],"tronco":[82,247,113,247]}],"arq_meia_santos":[{"cabeca":[50,58,144,166],"tronco":[63,166,138,211]},{"cabeca":[51,58,145,166],"tronco":[64,166,138,211]},{"cabeca":[51,58,146,166],"tronco":[63,166,139,211]},{"cabeca":[53,59,147,166],"tronco":[57,166,140,211]},{"cabeca":[47,79,153,176],"tronco":[75,176,128,217]},{"cabeca":[49,79,152,176],"tronco":[65,176,129,217]},{"cabeca":[48,79,153,176],"tronco":[69,176,129,217]},{"cabeca":[50,79,153,176],"tronco":[67,176,130,217]},{"cabeca":[52,74,147,167],"tronco":[65,167,135,210]},{"cabeca":[54,74,149,167],"tronco":[69,167,134,210]},{"cabeca":[53,74,149,167],"tronco":[63,167,139,210]},{"cabeca":[50,76,145,169],"tronco":[60,169,136,212]}],"arq_centroavante_santos":[{"cabeca":[44,74,144,166],"tronco":[62,166,133,208]},{"cabeca":[46,74,144,166],"tronco":[62,166,133,208]},{"cabeca":[45,74,144,166],"tronco":[63,166,133,208]},{"cabeca":[47,74,143,166],"tronco":[62,166,133,208]},{"cabeca":[29,71,151,157],"tronco":[77,157,123,194]},{"cabeca":[31,72,154,156],"tronco":[76,156,124,194]},{"cabeca":[32,72,152,157],"tronco":[76,157,124,194]},{"cabeca":[36,88,154,172],"tronco":[77,172,125,209]},{"cabeca":[50,88,141,160],"tronco":[58,160,132,203]},{"cabeca":[48,88,139,160],"tronco":[58,160,132,203]},{"cabeca":[49,91,139,163],"tronco":[58,163,132,206]},{"cabeca":[49,89,141,161],"tronco":[57,161,134,205]}],"arq_ponta_santos":[{"cabeca":[42,57,158,166],"tronco":[67,166,134,206]},{"cabeca":[41,57,157,166],"tronco":[67,166,134,205]},{"cabeca":[42,58,157,167],"tronco":[68,167,135,206]},{"cabeca":[42,57,157,166],"tronco":[69,166,134,205]},{"cabeca":[40,61,157,159],"tronco":[79,159,119,199]},{"cabeca":[38,62,155,160],"tronco":[79,160,119,200]},{"cabeca":[40,62,157,160],"tronco":[80,160,120,200]},{"cabeca":[40,62,155,160],"tronco":[80,160,118,200]},{"cabeca":[42,62,161,155],"tronco":[67,155,132,196]},{"cabeca":[43,62,161,155],"tronco":[68,155,132,196]},{"cabeca":[44,62,161,155],"tronco":[68,155,133,196]},{"cabeca":[42,62,160,155],"tronco":[66,155,133,196]}]});
if (typeof CORPOS_MODO !== 'undefined') for (const n of Object.keys(META_REG)) if (/_santos$/.test(n)) CORPOS_MODO[n] = 'chave';
{
  const POOL = {
    santos_rapido: [null, 'arq_ponta_santos', 'arq_centroavante_santos'],     // null = o menino da Vila de sempre
    santos_meia: [null, 'arq_meia_santos', 'arq_volante_santos'],
    santos_zagueiro: [null, 'arq_zagueiro_santos', 'arq_volante_santos'],
  };
  const TIPO = { arq_ponta_santos: 'ponta', arq_centroavante_santos: 'centroavante', arq_meia_santos: 'meia', arq_volante_santos: 'volante', arq_zagueiro_santos: 'zagueiro' };
  const _lookSantos = lookDoMonstro;
  lookDoMonstro = function (m, mapa) {
    const id = m && m.d && Object.keys(POOL).find(k => MONSTROS[k] === m.d);
    if (!id) return _lookSantos.apply(this, arguments);
    const pool = POOL[id], folha = pool[(m.uid || 0) % pool.length];
    if (!folha) return _lookSantos.apply(this, arguments);
    const L = m.d.look, t = TIPO[folha], base = (typeof ARQ_LOOK !== 'undefined' && ARQ_LOOK[t] && ARQ_LOOK[t].m) || {};
    const novo = Object.assign({}, L, base, { folha, corpo: 'm', grande: false });
    for (const k of ['chapeu', 'rosto', 'pescoco', 'costas', 'mao']) delete novo[k];
    delete novo._kb;
    if (folhaReg(folha)) return novo;
    m._regPend = novo; return null; // ainda baixando: usa o de sempre e troca assim que chegar (arquetipos.js)
  };
}
