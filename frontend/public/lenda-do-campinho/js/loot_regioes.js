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
  vila: ['Vila', ['Tampinha de Garrafa', 'Figurinha Repetida', 'Bola de Capotão Antiga', 'Chuteira do Primeiro Gol']],
  praia: ['Praia', ['Conchinha Colorida', 'Estrela-do-Mar', 'Garrafa com Mensagem', 'Pérola do Pôr do Sol']],
  cidade: ['Cidade', ['Ficha de Fliperama', 'Boné Autografado', 'Bola de Futsal Dourada', 'Troféu do Campeonato de Bairro']],
  ct: ['Centro de Treinamento', ['Cone de Treino Lascado', 'Prancheta Rabiscada', 'Cronômetro de Ouro', 'Apito do Treinador Lendário']],
  estadio: ['Estádio', ['Ingresso Amassado', 'Cachecol da Torcida', 'Pedaço da Rede Histórica', 'Taça da Primeira Divisão']],
  cairo: ['Cairo', ['Saquinho de Areia Dourada', 'Papiro Antigo', 'Amuleto do Escaravelho', 'Máscara do Faraó-Craque']],
  doha: ['Doha', ['Tâmara Doce', 'Lanterna Árabe', 'Falcão de Cristal', 'Bola do Deserto Cravejada']],
  toquio: ['Tóquio', ['Origami de Bola', 'Gato da Sorte', 'Lanterna de Papel', 'Leque do Samurai Dourado']],
  miami: ['Miami', ['Óculos Espelhado', 'Prancha de Surfe Mini', 'Flamingo de Neon', 'Disco de Ouro do DJ']],
  buenos: ['Buenos Aires', ['Cuia de Mate', 'Sapato de Tango', 'Bandoneón de Brinquedo', 'Medalha do Tango Eterno']],
  rio: ['Rio', ['Pandeirinho', 'Saquinho de Confete', 'Fantasia de Plumas', 'Bola Dourada do Carnaval']],
  lisboa: ['Lisboa', ['Azulejo Português', 'Bondinho de Lata', 'Guitarrinha de Fado', 'Caravela de Ouro']],
  paris: ['Paris', ['Croissant de Pano', 'Boina de Pintor', 'Torre de Bronze em Miniatura', 'Pintura do Gol Perfeito']],
  munique: ['Munique', ['Pretzel de Pano', 'Chapéu Tirolês', 'Relógio Cuco', 'Castelo de Cristal']],
  milao: ['Milão', ['Botão de Alfaiate', 'Gravata de Seda', 'Óculos de Grife', 'Manto Dourado da Passarela']],
  madri: ['Madri', ['Leque Flamenco', 'Castanholas', 'Guitarra Flamenca', 'Coroa do Reino Branco']],
  londres: ['Londres', ['Xícara de Chá', 'Guarda-chuva Listrado', 'Ônibus Vermelho em Miniatura', 'Relógio da Torre de Ouro']],
  santos: ['Santos', ['Grão de Café', 'Âncora de Latão', 'Navio Cargueiro em Miniatura', 'Chuteira Dourada do Litoral']],
  caca_esgotos: ['Esgotos', ['Tampa de Bueiro Mini', 'Ratinho de Pelúcia', 'Lanterna do Esgoto', 'Chave-Mestra Dourada']],
  caca_dunas: ['Dunas', ['Vidro do Deserto', 'Rosa do Deserto', 'Bússola Antiga', 'Ampulheta Eterna']],
  caca_morcegos: ['Caverna dos Morcegos', ['Estalactite Brilhante', 'Lampião de Caverna', 'Morcego de Cristal', 'Eco Engarrafado']],
  caca_aranha: ['Ninho das Aranhas', ['Fio de Teia Prateado', 'Casulo Dourado', 'Aranha de Ametista', 'Coroa de Teia de Diamante']],
  caca_minas: ['Minas', ['Pepita de Cobre', 'Picareta em Miniatura', 'Pepita de Ouro', 'Diamante Bruto Gigante']],
  caca_piramide: ['Pirâmide', ['Faixa de Linho Antiga', 'Estatueta de Gato Sagrado', 'Cetro do Faraó', 'Sarcófago de Ouro em Miniatura']],
  caca_tanukis: ['Bosque dos Tanukis', ['Folha Mágica', 'Sininho de Bronze', 'Chaleira Encantada', 'Estátua do Tanuki da Sorte']],
  caca_deserto: ['Deserto', ['Escama de Areia', 'Cacto de Cristal', 'Miragem Engarrafada', 'Oásis em Miniatura']],
  caca_jacares: ['Pântano dos Jacarés', ['Escama de Jacaré', 'Ovo de Pedra do Pântano', 'Dente de Jacaré', 'Jacaré Dourado']],
  caca_recife: ['Recife de Coral', ['Coral Vermelho', 'Pérola Negra', 'Concha Gigante', 'Tridente de Coral']],
  caca_touros: ['Arena dos Touros', ['Ferradura', 'Sino de Vaca', 'Chifre Decorado', 'Touro de Bronze']],
  caca_catedral: ['Catedral', ['Vitral Colorido', 'Vela Perfumada', 'Sino de Prata', 'Gárgula de Pedra Lunar']],
  caca_yeti: ['Montanha do Yeti', ['Floco de Neve Eterno', 'Tufo de Pelo de Yeti', 'Cristal de Gelo', 'Pegada de Yeti Congelada']],
  caca_fantasma: ['Casarão Assombrado', ['Lençol de Fantasma', 'Corrente Leve', 'Lanterna Assombrada', 'Coroa do Rei Fantasma']],
  caca_vulcao: ['Vulcão', ['Pedra-Pomes', 'Obsidiana', 'Rubi de Lava', 'Coração do Vulcão']],
  caca_covil: ['Covil do Dragão', ['Escama de Dragão', 'Garra de Dragão', 'Ovo de Dragão', 'Tesouro do Dragão Ancião']],
  lua: ['Lua', ['Poeira Lunar', 'Pedra da Lua', 'Bandeirinha Lunar', 'Pegada do Craque Lunar']],
  marte: ['Marte', ['Areia Vermelha', 'Parafuso de Rover', 'Cristal Marciano', 'Painel Solar de Ouro']],
  saturno: ['Saturno', ['Gelo dos Anéis', 'Pedaço de Anel', 'Satélite em Miniatura', 'Anel de Saturno Polido']],
  nebulosa: ['Nebulosa', ['Poeira Estelar', 'Nebulosa Engarrafada', 'Estrela Cadente', 'Coração da Nebulosa']],
  caca_mv_minas: ['Minas dos Anões', ['Pepita Anã', 'Martelo Rúnico', 'Gema Rúnica', 'Bigorna Dourada dos Anões']],
  caca_mv_grutas: ['Grutas Brilhantes', ['Cogumelo Brilhante', 'Musgo Luminoso', 'Cristal da Gruta', 'Lanterna Viva']],
  caca_mv_lava: ['Rio de Lava', ['Brasa Eterna', 'Pedra de Magma', 'Ave de Fogo de Ferro', 'Chama Engarrafada']],
  caca_mv_trono: ['Trono da Montanha', ['Moeda Anã Antiga', 'Taça de Pedra', 'Brasão Anão', 'Coroa do Rei da Montanha']],
  caca_mv_nuvens: ['Reino das Nuvens', ['Algodão de Nuvem', 'Pena de Grifo', 'Raio Engarrafado', 'Harpa das Nuvens']],
  caca_mv_floresta: ['Floresta Gigante', ['Bolota Gigante', 'Seiva Dourada', 'Semente Mágica', 'Galho da Árvore do Mundo']],
  caca_mv_ponte: ['Ponte dos Trolls', ['Moeda do Pedágio', 'Corrente de Ferro', 'Lanterna do Troll', 'Ponte de Ouro em Miniatura']],
  caca_mv_pico: ['Pico Nublado', ['Gelo do Pico', 'Pena de Águia Gigante', 'Coroa de Gelo', 'Estrela do Topo do Mundo']],
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
  reg => `Achado comum de ${reg}. Qualquer loja compra.`,
  reg => `Achado incomum de ${reg}. Vale um bom dinheiro na loja.`,
  reg => `Achado RARO de ${reg}! Vale muito na loja.`,
  reg => `⭐ COLECIONÁVEL de ${reg}: só os caçadores mais pacientes encontram (muito, muito raro). Vale uma fortuna na loja — ou exponha na sua casa!`,
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
