/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   ⚖️ PADRÃO DOS ITENS (v347, aprovado pelo dono): todo equipamento segue UMA regra — tipo × nível × raridade.
   - RARIDADE = FORÇA (antes era só "como se consegue"):
       Comum    loja até o nível 39 ............ 0 bônus · ×1,0
       Incomum  loja do nível 40 em diante ..... 1 bônus · ×1,1
       Raro     drop de adversário / missão .... 2 bônus · ×1,2
       Épico    conjuntos das dungeons ......... 3 bônus · ×1,3   (Atlântida, Espaço, Multiverso)
       Lendário Quest Lendária, Caçador, únicos  4 bônus · ×1,45
       Mítico   troféus de Arena e Relíquias ... 4 bônus · ×1,6
   - BASE fixa de cada tipo: Chuteira = Ataque + Velocidade · Camisa = Defesa + Fôlego · Calção = Defesa + Velocidade + Fôlego
     · Caneleira = Defesa + Fôlego + Marcação · Cabeça = Defesa + Fôlego · Acessório = Defesa + Foco + Recuperação.
     (abaixo do nível 10, só o atributo principal)
   - BÔNUS: o item mantém a "cara" (os bônus que já dava, do mais forte para o mais fraco); se faltar, completa pela lista do tipo.
     Todo bônus vale o mesmo ⚔️ Poder no mesmo nível (o "câmbio" de cada atributo está nos pesos PI_W).
   - Os valores saem das tabelas PI_TAB (valor típico em 10 níveis-âncora, em escala log; entre eles, linha reta), calculadas
     a partir dos itens de antes para a média de cada tipo/nível continuar a mesma. Mesmo tipo e raridade: nível maior nunca é mais fraco.
   - ⚔️ PODER na dica de cada item (com ▲/▼ em relação ao que você usa); a seta da mochila decide pelo Poder quando a troca é "mista".
   - Item NOVO no futuro: basta criar (slot, lvl e a origem: loja / drop / flags) — os números saem daqui sozinhos.
   - Script que gerou as tabelas: _teste/padrao_itens.py (só rodar de novo se a regra mudar). Carregar DEPOIS de todos os itens.
   ============================================================ */
const PI_MULT = { comum: 1.0, incomum: 1.1, raro: 1.2, epico: 1.3, lendario: 1.45, mitico: 1.6 };
const PI_NB = { comum: 0, incomum: 1, raro: 2, epico: 3, lendario: 4, mitico: 4 };
const PI_BASE = { chuteira: ['atk', 'vel'], camisa: ['def', 'hp'], calcao: ['def', 'vel', 'hp'], perna: ['def', 'hp', 'defesa'], cabeca: ['def', 'hp'], acessorio: ['def', 'foco', 'regen'] };
const PI_MAIN = { chuteira: 'atk', camisa: 'def', calcao: 'def', perna: 'def', cabeca: 'def', acessorio: 'foco' };
const PI_BONUS = { chuteira: ['chute', 'drible', 'visao', 'defesa'], camisa: ['drible', 'chute', 'visao', 'defesa'], calcao: ['drible', 'chute', 'defesa', 'visao'],
  perna: ['vel', 'drible', 'chute', 'visao'], cabeca: ['drible', 'chute', 'visao', 'foco'], acessorio: ['hp', 'visao', 'drible', 'chute'] };
const PI_PODE_BONUS = ['hp', 'foco', 'vel', 'drible', 'chute', 'visao', 'defesa']; // recuperação só como base do acessório
const PI_NIVEL_PODER = { medalha_colecionador: 100 }; // prêmio do álbum completo: força de nível 100 (pode usar desde o 1)
const PI_DUNG = ['abissal', 'draconica', 'marciana', 'estelar', 'galactica', 'coroa_dragao', 'capacete_estelar'];
const PI_W = { atk: 1, def: 1, hp: 0.04781, foco: 0.11613, vel: 1.68097, regen: 4, drible: 3.0, chute: 3.0, visao: 3.0, defesa: 3.0 };
const PI_K = [1, 10, 30, 60, 110, 190, 300, 420, 550, 1000].map(x => Math.log(x + 10));
const PI_TAB = {
  'chuteira|atk': [0.46168, 1.74215, 2.40628, 2.803925, 3.153078, 3.643709, 4.265056, 4.762136, 5.068391, 5.321027],
  'chuteira|vel': [1.492382, 1.534843, 1.571192, 1.740442, 1.905404, 2.300481, 2.817313, 3.308684, 3.589525, 3.807098],
  'chuteira>drible': [-0.431534, -0.068735, 0.244637, 0.468121, 0.530013, 0.975452, 1.552553, 2.212743, 2.620688, 2.652325],
  'chuteira>chute': [-0.431534, -0.068735, 0.244637, 0.468121, 0.530013, 0.975452, 1.552553, 2.212743, 2.620688, 2.652325],
  'chuteira>visao': [-0.431534, -0.068735, 0.244637, 0.468121, 0.530013, 0.975452, 1.552553, 2.212743, 2.620688, 2.652325],
  'chuteira>defesa': [-0.431534, -0.068735, 0.244637, 0.468121, 0.530013, 0.975452, 1.552553, 2.212743, 2.620688, 2.652325],
  'chuteira>vel': [0.147707, 0.510506, 0.823878, 1.047363, 1.109255, 1.554693, 2.131794, 2.791985, 3.199929, 3.231567],
  'chuteira>hp': [3.707607, 4.070406, 4.383778, 4.607262, 4.669154, 5.114593, 5.691694, 6.351884, 6.759829, 6.791467],
  'chuteira>foco': [2.820121, 3.18292, 3.496292, 3.719776, 3.781668, 4.227107, 4.804208, 5.464398, 5.872342, 5.90398],
  'camisa|def': [0.305856, 1.533753, 2.340123, 2.759273, 3.024659, 3.361586, 3.92646, 4.393023, 4.664216, 4.799824],
  'camisa|hp': [1.991866, 3.033661, 4.0498, 4.721951, 5.167113, 5.942414, 7.153125, 8.056773, 8.472384, 8.706442],
  'camisa>drible': [-0.044474, 0.2788, 0.533103, 0.657654, 0.657654, 0.992458, 1.510705, 2.139339, 2.527992, 2.537621],
  'camisa>chute': [-0.044474, 0.2788, 0.533103, 0.657654, 0.657654, 0.992458, 1.510705, 2.139339, 2.527992, 2.537621],
  'camisa>visao': [-0.044474, 0.2788, 0.533103, 0.657654, 0.657654, 0.992458, 1.510705, 2.139339, 2.527992, 2.537621],
  'camisa>defesa': [-0.044474, 0.2788, 0.533103, 0.657654, 0.657654, 0.992458, 1.510705, 2.139339, 2.527992, 2.537621],
  'camisa>vel': [0.534767, 0.858042, 1.112344, 1.236895, 1.236895, 1.5717, 2.089946, 2.71858, 3.107233, 3.116863],
  'camisa>hp': [4.094667, 4.417941, 4.672244, 4.796795, 4.796795, 5.131599, 5.649846, 6.27848, 6.667133, 6.676763],
  'camisa>foco': [3.20718, 3.530455, 3.784758, 3.909309, 3.909309, 4.244113, 4.762359, 5.390993, 5.779646, 5.789276],
  'calcao|def': [-0.081932, 0.736381, 1.383316, 1.780001, 2.123745, 2.431717, 2.580377, 2.83972, 3.057451, 3.180183],
  'calcao|vel': [1.027318, 1.135752, 1.264165, 1.348468, 1.506051, 1.755512, 2.098481, 2.418052, 2.606307, 2.693457],
  'calcao|hp': [2.907474, 3.065806, 3.244116, 3.514551, 3.994345, 4.479232, 4.947275, 5.905889, 6.560395, 7.002903],
  'calcao>drible': [-0.270456, -0.033846, 0.179426, 0.341815, 0.352933, 0.705118, 1.147288, 1.795646, 2.223861, 2.279383],
  'calcao>chute': [-0.270456, -0.033846, 0.179426, 0.341815, 0.352933, 0.705118, 1.147288, 1.795646, 2.223861, 2.279383],
  'calcao>visao': [-0.270456, -0.033846, 0.179426, 0.341815, 0.352933, 0.705118, 1.147288, 1.795646, 2.223861, 2.279383],
  'calcao>defesa': [-0.270456, -0.033846, 0.179426, 0.341815, 0.352933, 0.705118, 1.147288, 1.795646, 2.223861, 2.279383],
  'calcao>vel': [0.308785, 0.545395, 0.758667, 0.921056, 0.932174, 1.28436, 1.726529, 2.374887, 2.803103, 2.858624],
  'calcao>hp': [3.868685, 4.105295, 4.318567, 4.480956, 4.492074, 4.84426, 5.286429, 5.934787, 6.363003, 6.418524],
  'calcao>foco': [2.981199, 3.217808, 3.431081, 3.59347, 3.604588, 3.956773, 4.398943, 5.0473, 5.475516, 5.531037],
  'perna|def': [-0.304518, 0.673469, 1.366686, 1.614954, 1.781472, 2.227871, 2.786036, 3.181101, 3.41836, 3.597725],
  'perna|hp': [1.761154, 2.215908, 2.68606, 3.156603, 3.661527, 4.662719, 5.867079, 6.749091, 7.197367, 7.54766],
  'perna|defesa': [-0.688572, -0.604557, -0.505144, -0.405339, -0.00255, 0.831711, 1.439945, 1.854707, 2.198895, 2.492205],
  'perna>drible': [-0.38535, -0.116249, 0.124935, 0.24618, 0.24618, 0.618712, 1.168223, 1.809295, 2.223861, 2.279383],
  'perna>chute': [-0.38535, -0.116249, 0.124935, 0.24618, 0.24618, 0.618712, 1.168223, 1.809295, 2.223861, 2.279383],
  'perna>visao': [-0.38535, -0.116249, 0.124935, 0.24618, 0.24618, 0.618712, 1.168223, 1.809295, 2.223861, 2.279383],
  'perna>defesa': [-0.38535, -0.116249, 0.124935, 0.24618, 0.24618, 0.618712, 1.168223, 1.809295, 2.223861, 2.279383],
  'perna>vel': [0.193891, 0.462992, 0.704177, 0.825421, 0.825421, 1.197953, 1.747464, 2.388536, 2.803103, 2.858624],
  'perna>hp': [3.753791, 4.022892, 4.264077, 4.385321, 4.385321, 4.757853, 5.307364, 5.948436, 6.363003, 6.418524],
  'perna>foco': [2.866304, 3.135406, 3.37659, 3.497835, 3.497835, 3.870367, 4.419878, 5.06095, 5.475516, 5.531037],
  'cabeca|def': [-0.427418, 0.563209, 1.331788, 1.994332, 2.512751, 2.72873, 2.72873, 2.875942, 3.158892, 3.24107],
  'cabeca|hp': [2.55759, 3.109858, 3.670802, 4.315858, 4.832729, 5.357987, 6.147645, 6.939085, 7.380542, 7.575147],
  'cabeca>drible': [-0.404501, 0.055217, 0.480295, 0.784988, 0.852427, 1.221764, 1.661179, 2.222454, 2.575741, 2.575741],
  'cabeca>chute': [-0.404501, 0.055217, 0.480295, 0.784988, 0.852427, 1.221764, 1.661179, 2.222454, 2.575741, 2.575741],
  'cabeca>visao': [-0.404501, 0.055217, 0.480295, 0.784988, 0.852427, 1.221764, 1.661179, 2.222454, 2.575741, 2.575741],
  'cabeca>defesa': [-0.404501, 0.055217, 0.480295, 0.784988, 0.852427, 1.221764, 1.661179, 2.222454, 2.575741, 2.575741],
  'cabeca>vel': [0.174741, 0.634458, 1.059536, 1.364229, 1.431668, 1.801005, 2.24042, 2.801696, 3.154983, 3.154983],
  'cabeca>hp': [3.734641, 4.194358, 4.619436, 4.924129, 4.991568, 5.360905, 5.80032, 6.361595, 6.714883, 6.714883],
  'cabeca>foco': [2.847154, 3.306871, 3.73195, 4.036643, 4.104081, 4.473419, 4.912834, 5.474109, 5.827396, 5.827396],
  'acessorio|def': [-0.987457, -0.368342, 0.394759, 0.859665, 1.086955, 1.66413, 1.962544, 2.190251, 2.393791, 2.506762],
  'acessorio|foco': [1.964758, 2.500494, 3.180216, 4.04036, 4.417946, 5.043206, 5.697551, 6.439987, 6.907834, 7.184793],
  'acessorio|regen': [0.708432, 0.708432, 0.708432, 0.708432, 0.708432, 1.209873, 1.763856, 1.956597, 2.106529, 2.220653],
  'acessorio>drible': [-0.301198, -0.189656, 0.022556, 0.272053, 0.384812, 0.856502, 1.418891, 2.054589, 2.438571, 2.443211],
  'acessorio>chute': [-0.301198, -0.189656, 0.022556, 0.272053, 0.384812, 0.856502, 1.418891, 2.054589, 2.438571, 2.443211],
  'acessorio>visao': [-0.301198, -0.189656, 0.022556, 0.272053, 0.384812, 0.856502, 1.418891, 2.054589, 2.438571, 2.443211],
  'acessorio>defesa': [-0.301198, -0.189656, 0.022556, 0.272053, 0.384812, 0.856502, 1.418891, 2.054589, 2.438571, 2.443211],
  'acessorio>vel': [0.278043, 0.389585, 0.601798, 0.851294, 0.964053, 1.435743, 1.998132, 2.63383, 3.017813, 3.022453],
  'acessorio>hp': [3.837943, 3.949485, 4.161698, 4.411194, 4.523953, 4.995643, 5.558032, 6.19373, 6.577713, 6.582352],
  'acessorio>foco': [2.950457, 3.061999, 3.274211, 3.523708, 3.636467, 4.108157, 4.670546, 5.306244, 5.690226, 5.694866],
  'bonus|drible': [-0.107316, 0.23469, 0.533382, 0.711743, 0.711743, 1.100281, 1.646018, 2.306471, 2.734687, 2.790208],
  'bonus|chute': [-0.107316, 0.23469, 0.533382, 0.711743, 0.711743, 1.100281, 1.646018, 2.306471, 2.734687, 2.790208],
  'bonus|visao': [-0.107316, 0.23469, 0.533382, 0.711743, 0.711743, 1.100281, 1.646018, 2.306471, 2.734687, 2.790208],
  'bonus|defesa': [-0.107316, 0.23469, 0.533382, 0.711743, 0.711743, 1.100281, 1.646018, 2.306471, 2.734687, 2.790208],
  'bonus|vel': [0.471925, 0.813931, 1.112623, 1.290984, 1.290984, 1.679522, 2.225259, 2.885712, 3.313928, 3.36945],
  'bonus|hp': [4.031825, 4.373831, 4.672523, 4.850884, 4.850884, 5.239422, 5.785159, 6.445612, 6.873828, 6.92935],
  'bonus|foco': [3.144339, 3.486345, 3.785037, 3.963398, 3.963398, 4.351936, 4.897673, 5.558126, 5.986342, 6.041863],
};
function piEv(chave, L) {
  const a = PI_TAB[chave]; const x = Math.log(L + 10); let j = 0;
  while (j < PI_K.length - 2 && x > PI_K[j + 1]) j++;
  const t = Math.min(1, Math.max(0, (x - PI_K[j]) / (PI_K[j + 1] - PI_K[j])));
  return Math.exp(a[j] * (1 - t) + a[j + 1] * t);
}
const PI_ORIG = {}; // atributos de antes (só para manter a "cara" de cada item)
function piRaridade(id, it, vendidos) {
  if (it.arena || it.mitico || it.reliquia) return 'mitico';
  if (it.lenda || it.raro || it.cacador) return 'lendario';
  if (it.faixaMv || PI_DUNG.some(x => id.includes(x))) return 'epico';
  if (vendidos.has(id)) return (it.lvl || 0) >= 40 ? 'incomum' : 'comum';
  if (id === 'pe_descalco') return 'comum';
  return 'raro';
}
function piAplica(id, vendidos) {
  const it = ITENS[id]; if (!it || it.tipo !== 'equip' || !PI_BASE[it.slot]) return;
  if (!PI_ORIG[id]) { const o = {}; if (it.atk) o.atk = it.atk; if (it.def) o.def = it.def; Object.assign(o, it.st || {}); PI_ORIG[id] = o; }
  const old = PI_ORIG[id], slot = it.slot, t = piRaridade(id, it, vendidos), m = PI_MULT[t], L = PI_NIVEL_PODER[id] || it.lvl || 1;
  const arred = x => Math.max(1, Math.floor(x + 0.5)), out = {};
  for (const st of PI_BASE[slot]) if (L >= 10 || st === PI_MAIN[slot]) out[st] = arred(piEv(slot + '|' + st, L) * m);
  const cand = Object.keys(old).filter(k => PI_PODE_BONUS.includes(k) && !PI_BASE[slot].includes(k))
    .sort((a, b) => old[b] / piEv('bonus|' + b, L) - old[a] / piEv('bonus|' + a, L));
  for (const k of PI_BONUS[slot]) if (!cand.includes(k)) cand.push(k);
  for (const k of cand.slice(0, PI_NB[t])) out[k] = arred(piEv(slot + '>' + k, L) * m);
  delete it.atk; delete it.def; const st = {};
  for (const k in out) { if (k === 'atk' || k === 'def') it[k] = out[k]; else st[k] = out[k]; }
  it.st = st; it.rarPadrao = t;
  // a descrição não repete números (mudaram e já aparecem na dica): ficam só as frases de "história"
  if (it.desc) it.desc = it.desc.split(/(?<=\.)\s+/).filter(f => !/\d|LENDÁRI|MÍTIC|em tudo/i.test(f)).join(' ');
}
function piAplicaTodos() {
  const vendidos = new Set(); for (const k in NPCS) (NPCS[k].loja || []).forEach(i => vendidos.add(i));
  for (const id in ITENS) piAplica(id, vendidos);
  if (typeof RAR_CACHE !== 'undefined') RAR_CACHE = null;
}
piAplicaTodos();
// as roupas das cidades entram nas lojas só no DOMContentLoaded (roupas.js): recalcula depois disso (é idempotente)
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(piAplicaTodos, 0)); else setTimeout(piAplicaTodos, 0);
// raridade = força (equipamentos); o resto continua como era
{ const _rarPI = raridadeItem; raridadeItem = function (id) { const it = ITENS[id]; return (it && it.rarPadrao) || _rarPI(id); }; }
// ⚔️ Poder: um número só para comparar (conta a Forja do jeito do jogo)
function poderItem(id, r = 0) { const v = valoresItem(id, r); let p = 0; for (const k in v) p += (PI_W[k] || 0) * v[k]; return Math.round(p); }
{
  const _cmpPI = comparaItem;
  comparaItem = function (id, r = 0) {
    const c = _cmpPI.apply(this, arguments); if (!c) return c;
    c.poder = poderItem(id, r); c.poderEq = c.eq ? poderItem(c.eq.id, c.eq.r) : 0;
    if (c.veredito === 'misto') c.veredito = c.poder > c.poderEq ? 'melhor' : c.poder < c.poderEq ? 'pior' : 'misto';
    return c;
  };
  const _tipPI = tipItem;
  tipItem = function (id, r, extra) {
    const box = _tipPI.apply(this, arguments); const it = ITENS[id]; if (!it || it.tipo !== 'equip') return box;
    const c = comparaItem(id, r || 0), p = poderItem(id, r || 0);
    const linha = el('div', { class: 'tip-poder' }, el('span', {}, '⚔️ Poder '), el('b', {}, fmtN(p)));
    if (c && c.eq && !(c.eq.id === id && c.eq.r === (r || 0))) { const dp = p - c.poderEq; if (dp) linha.append(el('i', { class: dp > 0 ? 'tip-pos' : 'tip-neg' }, dp > 0 ? ` ▲ +${fmtN(dp)}` : ` ▼ ${fmtN(dp)}`)); }
    const tipo = box.querySelector('.tip-tipo'); if (tipo) tipo.after(linha); else box.append(linha);
    return box;
  };
  const css = document.createElement('style');
  css.textContent = '.tip-poder { font-size: 14px; margin: 2px 0 4px; } .tip-poder b { font-size: 15px; }';
  document.head.append(css);
}
// aviso único para quem já jogava antes do padrão (personagem criado agora já nasce sabendo)
{
  const _novoPI = novoSave; novoSave = function () { const s = _novoPI.apply(this, arguments); if (s && s.flags) s.flags.padrao_itens_v347 = true; return s; };
  const iv = setInterval(() => {
    const s = G.save; if (!s || !G.rodando || !s.flags) return;
    clearInterval(iv); if (s.flags.padrao_itens_v347) return; s.flags.padrao_itens_v347 = true;
    setTimeout(() => { try { avisoJogo('Agora todo equipamento segue um padrão: a COR (raridade) mostra a força, cada raridade tem um número fixo de bônus e a dica mostra o ⚔️ Poder do item, com ▲ ou ▼ em relação ao que você usa. Alguns itens ficaram mais fortes e outros mais fracos — vale olhar a mochila!', { titulo: '⚖️ Itens rebalanceados', ok: 'Entendi' }); } catch (e) { } }, 1500);
  }, 2000);
}
