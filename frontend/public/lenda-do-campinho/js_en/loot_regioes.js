/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   💰 LOOT DAS REGIÕES (v361, dono: "a pessoa caça e não faz tostão só com moedas, e sim vendendo itens dropados;
   drops raros com taxa baixíssima, para ficar horas numa hunt por um item"; decisão: metade moeda, metade itens;
   qualquer loja compra).
   - Os adversários COMUNS dão METADE das moedas de antes.
   - Cada região tem 4 itens próprios (lr_<região>_1..4), que juntos devolvem a outra metade em média:
       1 comum (~30%, em pilhas) · 2 incomum (~7%) · 3 RARO (~1 em 110) · 4 ⭐ COLECIONÁVEL (~1 em 5.000).
     O preço de cada item segue o nível da região; a quantidade/chance se ajusta a cada adversário (mais forte = mais).
   - Colecionáveis não entram no "Vender todo o loot" (só vendendo um por um) e podem ser expostos em casa.
   - Arenas e times de estádio usam a região da cidade deles. Chefões, Torre e Pedras não mudam.
   Carregar NO FIM (depois de todos os arquivos que criam adversários e mapas).
   ============================================================ */
// [rótulo da região, [comum, incomum, raro, colecionável]]
const LOOT_REG = {
  vila: ['Village', ['Bottle Cap', 'Duplicate Sticker', 'Old Leather Ball', 'Boot of the First Goal']],
  praia: ['Beach', ['Colorful Seashell', 'Starfish', 'Message in a Bottle', 'Sunset Pearl']],
  cidade: ['City', ['Arcade Token', 'Autographed Cap', 'Golden Futsal Ball', 'Neighborhood Cup Trophy']],
  ct: ['Training Center', ['Chipped Training Cone', 'Scribbled Clipboard', 'Golden Stopwatch', 'Legendary Coach\'s Whistle']],
  estadio: ['Stadium', ['Crumpled Ticket', 'Fan Scarf', 'Piece of the Historic Net', 'First Division Cup']],
  cairo: ['Cairo', ['Pouch of Golden Sand', 'Ancient Papyrus', 'Scarab Amulet', 'Pharaoh-Ace Mask']],
  doha: ['Doha', ['Sweet Date', 'Arabian Lantern', 'Crystal Falcon', 'Jeweled Desert Ball']],
  toquio: ['Tokyo', ['Origami Ball', 'Lucky Cat', 'Paper Lantern', 'Golden Samurai Fan']],
  miami: ['Miami', ['Mirrored Sunglasses', 'Mini Surfboard', 'Neon Flamingo', 'DJ\'s Gold Record']],
  buenos: ['Buenos Aires', ['Mate Gourd', 'Tango Shoe', 'Toy Bandoneon', 'Eternal Tango Medal']],
  rio: ['Rio', ['Little Tambourine', 'Pouch of Confetti', 'Feather Costume', 'Golden Carnival Ball']],
  lisboa: ['Lisbon', ['Portuguese Tile', 'Tin Tram', 'Little Fado Guitar', 'Golden Caravel']],
  paris: ['Paris', ['Cloth Croissant', 'Painter\'s Beret', 'Miniature Bronze Tower', 'Painting of the Perfect Goal']],
  munique: ['Munich', ['Cloth Pretzel', 'Tyrolean Hat', 'Cuckoo Clock', 'Crystal Castle']],
  milao: ['Milan', ['Tailor\'s Button', 'Silk Tie', 'Designer Glasses', 'Golden Runway Cloak']],
  madri: ['Madrid', ['Flamenco Fan', 'Castanets', 'Flamenco Guitar', 'Crown of the White Kingdom']],
  londres: ['London', ['Teacup', 'Striped Umbrella', 'Miniature Red Bus', 'Golden Tower Clock']],
  santos: ['Santos', ['Coffee Bean', 'Brass Anchor', 'Miniature Cargo Ship', 'Golden Coast Boot']],
  caca_esgotos: ['Sewers', ['Mini Manhole Cover', 'Plush Little Rat', 'Sewer Lantern', 'Golden Master Key']],
  caca_dunas: ['Dunes', ['Desert Glass', 'Desert Rose', 'Antique Compass', 'Eternal Hourglass']],
  caca_morcegos: ['Bat Cave', ['Glowing Stalactite', 'Cave Lamp', 'Crystal Bat', 'Bottled Echo']],
  caca_aranha: ['Spider Nest', ['Silver Web Thread', 'Golden Cocoon', 'Amethyst Spider', 'Diamond Web Crown']],
  caca_minas: ['Mines', ['Copper Nugget', 'Miniature Pickaxe', 'Gold Nugget', 'Giant Rough Diamond']],
  caca_piramide: ['Pyramid', ['Ancient Linen Strip', 'Sacred Cat Statuette', 'Pharaoh\'s Scepter', 'Miniature Golden Sarcophagus']],
  caca_tanukis: ['Tanuki Grove', ['Magic Leaf', 'Bronze Bell', 'Enchanted Teapot', 'Lucky Tanuki Statue']],
  caca_deserto: ['Desert', ['Sand Scale', 'Crystal Cactus', 'Bottled Mirage', 'Miniature Oasis']],
  caca_jacares: ['Alligator Swamp', ['Alligator Scale', 'Swamp Stone Egg', 'Alligator Tooth', 'Golden Alligator']],
  caca_recife: ['Coral Reef', ['Red Coral', 'Black Pearl', 'Giant Shell', 'Coral Trident']],
  caca_touros: ['Bull Ranch', ['Horseshoe', 'Cowbell', 'Decorated Horn', 'Bronze Bull']],
  caca_catedral: ['Cathedral', ['Stained Glass Shard', 'Scented Candle', 'Silver Bell', 'Moonstone Gargoyle']],
  caca_yeti: ['Yeti Mountain', ['Eternal Snowflake', 'Tuft of Yeti Fur', 'Ice Crystal', 'Frozen Yeti Footprint']],
  caca_fantasma: ['Haunted Mansion', ['Ghost Sheet', 'Light Chain', 'Haunted Lantern', 'Ghost King Crown']],
  caca_vulcao: ['Volcano', ['Pumice Stone', 'Obsidian', 'Lava Ruby', 'Heart of the Volcano']],
  caca_covil: ['Dragon\'s Lair', ['Dragon Scale', 'Dragon Claw', 'Dragon Egg', 'Ancient Dragon\'s Treasure']],
  lua: ['Moon', ['Moon Dust', 'Moonstone', 'Little Moon Flag', 'Lunar Ace\'s Footprint']],
  marte: ['Mars', ['Red Sand', 'Rover Bolt', 'Martian Crystal', 'Golden Solar Panel']],
  saturno: ['Saturn', ['Ring Ice', 'Ring Fragment', 'Miniature Satellite', 'Polished Ring of Saturn']],
  nebulosa: ['Nebula', ['Stardust', 'Bottled Nebula', 'Shooting Star', 'Heart of the Nebula']],
  caca_mv_minas: ['Dwarf Mines', ['Dwarf Nugget', 'Runic Hammer', 'Runic Gem', 'Golden Dwarf Anvil']],
  caca_mv_grutas: ['Glowing Grottos', ['Glowing Mushroom', 'Luminous Moss', 'Grotto Crystal', 'Living Lantern']],
  caca_mv_lava: ['Lava River', ['Eternal Ember', 'Magma Stone', 'Iron Firebird', 'Bottled Flame']],
  caca_mv_trono: ['Mountain Throne', ['Ancient Dwarf Coin', 'Stone Goblet', 'Dwarf Crest', 'Crown of the Mountain King']],
  caca_mv_nuvens: ['Cloud Kingdom', ['Cloud Cotton', 'Griffin Feather', 'Bottled Lightning', 'Cloud Harp']],
  caca_mv_floresta: ['Giant Forest', ['Giant Acorn', 'Golden Sap', 'Magic Seed', 'Branch of the World Tree']],
  caca_mv_ponte: ['Troll Bridge', ['Toll Coin', 'Iron Chain', 'Troll\'s Lantern', 'Miniature Golden Bridge']],
  caca_mv_pico: ['Cloudy Peak', ['Peak Ice', 'Giant Eagle Feather', 'Ice Crown', 'Star of the Top of the World']],
};
// arenas usam a cidade de nível parecido
const LOOT_REG_ALIAS = { arena_terrao: 'cidade', arena_ondas: 'ct', arena_piramides: 'cairo', arena_neon: 'toquio', arena_nevasca: 'munique', arena_lendas: 'londres', arena_copa: 'santos' };
const LOOT_TIER = [ // [chance base, parte da renda (fração das moedas ANTIGAS), valor (× moedas médias da região), peso]
  [0.30, 0.22, 0.37, 0.5],
  [0.07, 0.14, 2, 1],
  [0.009, 0.09, 10, 2],
  [0.0002, 0.05, 250, 3],
];
const LOOT_TIER_TXT = [
  reg => `A common find from ${reg}. Any shop buys it.`,
  reg => `An uncommon find from ${reg}. Worth good money at the shop.`,
  reg => `A RARE find from ${reg}! Worth a lot at the shop.`,
  reg => `⭐ COLLECTIBLE from ${reg}: only the most patient hunters find it (very, very rare). Worth a fortune at the shop — or show it off in your house!`,
];
const MOEDAS_PARTE = 0.5; // os comuns dão metade das moedas de antes
const redondo = v => v < 20 ? Math.max(1, Math.round(v)) : v < 200 ? Math.round(v / 5) * 5 : v < 2000 ? Math.round(v / 10) * 10 : v < 20000 ? Math.round(v / 100) * 100 : Math.round(v / 1000) * 1000;
// os itens existem desde o começo (o save pode tê-los); os preços saem da média de moedas de cada região
for (const [reg, [rotulo, nomes]] of Object.entries(LOOT_REG)) nomes.forEach((nome, t) => {
  const id = `lr_${reg}_${t + 1}`;
  ITENS[id] = { nome, tipo: 'loot', venda: 1, peso: LOOT_TIER[t][3], raro: t >= 2, colecionavel: t === 3, regiao: reg, desc: LOOT_TIER_TXT[t](rotulo),
    icon: { k: 'pacote', c: ['#a8743a', '#3a9a5a', '#3a6ad0', '#e0b020'][t] } }; // (desenho provisório enquanto a arte carrega)
  const ic = 'i_' + id; if (!ASSET_SET.has(ic)) { ASSETS.push(ic); ASSET_SET.add(ic); }
});
function regiaoDoLoot(id) {
  let k = null; try { const sp = indice().spawn[id]; if (sp) k = sp.mapa; } catch (e) { }
  if (!k) { const m = id.match(/^est_([a-z]+)_\d+$/); if (m) k = m[1]; }
  k = LOOT_REG_ALIAS[k] || k; return LOOT_REG[k] ? k : null;
}
let LOOT_REG_OK = false;
function montaLootRegioes() {
  if (LOOT_REG_OK) return; LOOT_REG_OK = true;
  const porReg = {};
  for (const [id, d] of Object.entries(MONSTROS)) {
    if (!d || d.chefe || !d.loot || !Array.isArray(d.ouro) || d.lootReg) continue;
    const reg = regiaoDoLoot(id); if (!reg) continue;
    (porReg[reg] = porReg[reg] || []).push([id, d, (d.ouro[0] + d.ouro[1]) / 2]);
  }
  for (const [reg, lista] of Object.entries(porReg)) {
    const cs = lista.map(x => x[2]).sort((a, b) => a - b), cReg = Math.max(2, cs[cs.length >> 1]);
    LOOT_TIER.forEach(([, , mult], t) => { ITENS[`lr_${reg}_${t + 1}`].venda = redondo(cReg * mult); });
    for (const [, d, c] of lista) {
      if (c <= 0) continue;
      const v = t => ITENS[`lr_${reg}_${t + 1}`].venda;
      const [ch0, parte0] = LOOT_TIER[0]; const qMed = parte0 * c / (ch0 * v(0));
      d.loot.push([`lr_${reg}_1`, ch0, Math.max(1, Math.round(qMed * 0.5)), Math.max(1, Math.round(qMed * 1.5))]);
      for (let t = 1; t < 4; t++) { const ch = Math.min(0.5, LOOT_TIER[t][1] * c / v(t)); if (ch > 0) d.loot.push([`lr_${reg}_${t + 1}`, ch, 1, 1]); }
      d.ouro = d.ouro.map(x => Math.max(0, Math.round(x * MOEDAS_PARTE))); d.lootReg = reg;
    }
  }
  window.LOOT_REGIOES = Object.keys(porReg).length; // (testes)
}
{ const _iniLR = iniciarJogo; iniciarJogo = async function () { try { montaLootRegioes(); } catch (e) { console.warn('loot das regiões', e); } return _iniLR.apply(this, arguments); }; }
// colecionável não entra no "Vender todo o loot" (só um por um, de propósito)
if (typeof lootVendavel === 'function') { const _lv = lootVendavel; lootVendavel = function () { return _lv.apply(this, arguments).filter(m => !(ITENS[m.id] && ITENS[m.id].colecionavel)); }; }
// v361 (dono: "as artes das poções estão muito ruins"): família nova (Higgsfield) — Fôlego = garrafas vermelhas com
// coração, Foco = azuis com raio, crescendo do Mini ao Lendário/Multiverso. Arquivos novos (i_poc_*): sem cache velho.
for (const id of ['agua', 'acai', 'vitamina', 'energetico', 'kit_massagista', 'elixir_mar', 'soro_estelar', 'elixir_multiverso',
  'isotonico', 'suco_verde', 'agua_coco', 'guarana', 'isotonico_pro', 'perola_azul', 'cristal_foco', 'foco_multiverso']) {
  if (!ITENS[id]) continue; const nome = 'i_poc_' + id;
  if (!ASSET_SET.has(nome)) { ASSETS.push(nome); ASSET_SET.add(nome); }
  ICON_ALIAS[id] = nome; delete ITENS[id].iconeBase; if (typeof ASSET_VER !== 'undefined') ASSET_VER[nome] = 3612;
}
