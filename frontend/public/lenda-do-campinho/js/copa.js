/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   RUMO AO CRAQUE — COPA DOS SONHOS (modo "7 a 0")
   Escolha a formação → role o dado → pegue 1 jogador do elenco
   sorteado → repita até fechar os 11 → escolha o estilo →
   dispute a Copa (3 jogos de grupo + oitavas, quartas, semi e
   final). Meta máxima: 7 vitórias sem sofrer gol = 7 a 0 PERFEITO.

   Usa o motor de team.js: setores(), lance(), simRapida(), TATICAS.
   Exporta: abrirCopaSonhos(), NPC_COPA, MISSOES_COPA.
   ============================================================ */

/* ---------------- constantes ---------------- */
const COPA_POS = ['GOL', 'ZAG', 'LAT', 'VOL', 'MEI', 'ATA'];
const COPA_POS_NOME = { GOL: 'Goleiro', ZAG: 'Zagueiro', LAT: 'Lateral', VOL: 'Volante', MEI: 'Meia', ATA: 'Atacante' };
// quem pode jogar improvisado em cada posição (goleiro só no gol, e no gol só goleiro)
const COPA_COMPAT = { GOL: [], ZAG: ['VOL', 'LAT'], LAT: ['ZAG', 'VOL', 'MEI'], VOL: ['ZAG', 'MEI', 'LAT'], MEI: ['VOL', 'ATA', 'LAT'], ATA: ['MEI'] };
const COPA_IMPROV = 0.9;     // improvisado joga com 90% da força
const COPA_PULOS = 3;        // pulos de sorteio por Copa
const COPA_NOME_TIME = 'Seleção dos Sonhos';
const COPA_LENDAS = ['Zé Moleque', 'Dadá', 'Tonhão', 'Rei da Areia', 'Rei da Quadra', 'Capitão Sub-20', 'O Paredão'];

// [posição, x%, y%] — y=0 é o gol adversário (ataque em cima)
const COPA_FORMACOES = {
  '4-3-3': [['GOL', 50, 90], ['LAT', 12, 70], ['ZAG', 36, 75], ['ZAG', 64, 75], ['LAT', 88, 70], ['VOL', 50, 57], ['MEI', 27, 45], ['MEI', 73, 45], ['ATA', 16, 22], ['ATA', 50, 15], ['ATA', 84, 22]],
  '4-4-2': [['GOL', 50, 90], ['LAT', 12, 70], ['ZAG', 36, 75], ['ZAG', 64, 75], ['LAT', 88, 70], ['VOL', 37, 55], ['VOL', 63, 55], ['MEI', 13, 42], ['MEI', 87, 42], ['ATA', 36, 17], ['ATA', 64, 17]],
  '4-2-3-1': [['GOL', 50, 90], ['LAT', 12, 70], ['ZAG', 36, 75], ['ZAG', 64, 75], ['LAT', 88, 70], ['VOL', 36, 57], ['VOL', 64, 57], ['ATA', 15, 34], ['MEI', 50, 38], ['ATA', 85, 34], ['ATA', 50, 14]],
  '4-2-4': [['GOL', 50, 90], ['LAT', 12, 70], ['ZAG', 36, 75], ['ZAG', 64, 75], ['LAT', 88, 70], ['VOL', 37, 53], ['MEI', 63, 49], ['ATA', 12, 24], ['ATA', 38, 15], ['ATA', 62, 15], ['ATA', 88, 24]],
  '3-5-2': [['GOL', 50, 90], ['ZAG', 25, 75], ['ZAG', 50, 78], ['ZAG', 75, 75], ['LAT', 9, 50], ['VOL', 50, 58], ['MEI', 31, 42], ['MEI', 69, 42], ['LAT', 91, 50], ['ATA', 36, 17], ['ATA', 64, 17]],
  '5-3-2': [['GOL', 50, 90], ['LAT', 9, 64], ['ZAG', 29, 76], ['ZAG', 50, 79], ['ZAG', 71, 76], ['LAT', 91, 64], ['VOL', 30, 52], ['VOL', 70, 52], ['MEI', 50, 40], ['ATA', 36, 17], ['ATA', 64, 17]],
  '4-5-1': [['GOL', 50, 90], ['LAT', 12, 70], ['ZAG', 36, 75], ['ZAG', 64, 75], ['LAT', 88, 70], ['VOL', 36, 58], ['VOL', 64, 58], ['MEI', 12, 40], ['MEI', 50, 40], ['MEI', 88, 40], ['ATA', 50, 15]],
  '3-4-3': [['GOL', 50, 90], ['ZAG', 25, 75], ['ZAG', 50, 78], ['ZAG', 75, 75], ['LAT', 9, 50], ['VOL', 38, 55], ['MEI', 62, 50], ['LAT', 91, 50], ['ATA', 16, 22], ['ATA', 50, 15], ['ATA', 84, 22]],
};
const COPA_ESTILOS = {
  defensivo: { nome: 'Defensivo', emoji: '🛡️', tatica: 'defensiva', desc: 'Retranca! Fecha a casinha e joga no erro do adversário. Ótimo pra não levar gol.' },
  equilibrado: { nome: 'Equilibrado', emoji: '⚖️', tatica: 'equilibrada', desc: 'Nem lá, nem cá. O time ataca e defende na mesma medida.' },
  ofensivo: { nome: 'Ofensivo', emoji: '⚔️', tatica: 'ofensiva', desc: 'Pra cima deles! Mais gols a favor... mas a defesa fica mais aberta.' },
};
const COPA_FASES = [
  { id: 'g1', nome: 'Fase de grupos — 1ª rodada', curto: 'G1', grupo: true },
  { id: 'g2', nome: 'Fase de grupos — 2ª rodada', curto: 'G2', grupo: true },
  { id: 'g3', nome: 'Fase de grupos — 3ª rodada', curto: 'G3', grupo: true },
  { id: 'oit', nome: 'Oitavas de final', curto: 'OIT', faixa: [80, 84] },
  { id: 'qua', nome: 'Quartas de final', curto: 'QUA', faixa: [84, 87] },
  { id: 'sem', nome: 'Semifinal', curto: 'SEMI', faixa: [86, 89] },
  { id: 'fin', nome: 'FINAL', curto: 'FINAL', faixa: [88, 92] },
];
// atributos a partir da força: base = 99·(força/99)^CURVA (a curva deixa a diferença
// entre um craque 95 e um jogador 75 bem clara no motor), vezes o peso de cada posição [atq, def, pas, fis]
const COPA_CURVA = 6;
const COPA_MULT = { GOL: [0.3, 1, 0.7, 0.95], ZAG: [0.55, 1, 0.75, 0.97], LAT: [0.85, 0.9, 0.88, 0.97], VOL: [0.72, 0.95, 0.95, 0.95], MEI: [0.92, 0.6, 1, 0.9], ATA: [1, 0.5, 0.88, 0.96] };

/* ---------------- elencos do universo do jogo ----------------
   lista: "POS Nome força" separados por vírgula                */
const COPA_ELENCOS_BRUTO = [
  { id: 'vila78', time: 'Vila do Campinho', ano: 1978, emoji: '🏡', cor: '#2a8a3a', lore: 'O timaço em que o Seu Zé, ainda moleque, fazia chover no campinho de terra.',
    lista: 'GOL Bigode 76, GOL Bolacha 55, ZAG Toninho Ferro 80, ZAG Pé de Pano 62, ZAG Gordo 58, LAT Sabiá 78, LAT Gafanhoto 66, VOL Cabeção 74, VOL Marreco 60, MEI Zé Moleque 96, MEI Juca 72, MEI Toquinho 64, ATA Tião Canela 88, ATA Tiziu 70, ATA Bambu 57, ATA Lampião 63' },
  { id: 'vila94', time: 'Vila do Campinho', ano: 1994, emoji: '🏡', cor: '#3aa04a', lore: 'A geração do Paçoca, que aprendeu tudo com o Seu Zé já como treinador.',
    lista: 'GOL Pipoca 72, GOL Xodó 54, ZAG Russo 77, ZAG Tatu 71, ZAG Bolinha 52, LAT Duda 75, LAT Carlinhos 63, VOL Formiga 79, VOL Miltinho 61, MEI Paçoca 89, MEI Lelê 70, MEI Jajá 58, ATA Nina 86, ATA Foguinho 73, ATA Neném 60' },
  { id: 'vila14', time: 'Vila do Campinho', ano: 2014, emoji: '🏡', cor: '#4ab85a', lore: 'Kadu e Lari: a dupla que ganhou tudo no torneio de bairro.',
    lista: 'GOL Teco 70, GOL Juju 57, ZAG Davi 74, ZAG Mari 69, ZAG Leco 55, LAT Lari 84, LAT Téo 64, VOL Rafa 72, VOL Gabi 66, MEI Vini 77, MEI Tati 68, MEI Biel 59, ATA Kadu 90, ATA Caio 71, ATA Dedé 62' },
  { id: 'praia86', time: 'Praia do Futevôlei', ano: 1986, emoji: '🏖️', cor: '#f0c030', lore: 'O ano em que o Rei da Areia ganhou a coroa. Ninguém o parava na areia fofa.',
    lista: 'GOL Siri 68, GOL Mexilhão 52, ZAG Coqueiro 85, ZAG Jangada 70, ZAG Bóia 56, LAT Canoa 74, LAT Ostra 61, VOL Maré Alta 76, VOL Pé na Areia 63, MEI Picolé 78, MEI Guarda-Sol 67, MEI Sirizinho 55, ATA Rei da Areia 93, ATA Arraia 72, ATA Tainha 64, ATA Gaivota 58' },
  { id: 'praia02', time: 'Praia do Futevôlei', ano: 2002, emoji: '🏖️', cor: '#ffb040', lore: 'Bia fazia gol de bicicleta toda tarde, e a Maresia deixava todo mundo na cara do gol.',
    lista: 'GOL Sargaço 83, GOL Conchinha 58, ZAG Âncora 76, ZAG Farol 72, ZAG Caranguejo 54, LAT Prancha 73, LAT Sunga 60, VOL Correnteza 71, VOL Espuma 62, MEI Maresia 87, MEI Cocada 69, MEI Chinelo 57, ATA Bia 91, ATA Tubarão 74, ATA Pipa 61' },
  { id: 'quadra10', time: 'Reis da Quadra', ano: 2010, emoji: '🟧', cor: '#e06a1a', lore: 'O reinado do Rei da Quadra. Na quadra de cimento, a bola era dele.',
    lista: 'GOL Paredinha 74, GOL Luva 55, ZAG Xerifinho 73, ZAG Tampinha 66, ZAG Tijolo 53, LAT Ligeirinho 71, LAT Chiclete 65, VOL Fixo Tonico 75, VOL Gingado 62, MEI Rei da Quadra 94, MEI Pedalada 76, MEI Sola 60, ATA Magrão 86, ATA Bico 70, ATA Chapéu 63' },
  { id: 'quadra96', time: 'Reis da Quadra', ano: 1996, emoji: '🟧', cor: '#c05010', lore: 'Faísca era tão rápido que o goleiro só via o brilho da chuteira.',
    lista: 'GOL Polvo 77, GOL Mão de Alface 45, ZAG Muralha 72, ZAG Grilo 64, ZAG Ferrugem 50, LAT Canelinha 70, LAT Pula-Pula 58, VOL Pilão 74, VOL Zoinho 60, MEI Juninho Toque 85, MEI Caramelo 67, MEI Borboleta 56, ATA Faísca 88, ATA Tchê 69, ATA Pingo 61' },
  { id: 'ct18', time: 'CT Sub-20', ano: 2018, emoji: '🎽', cor: '#2a4ad9', lore: 'A turma do Capitão Sub-20: disciplina, pulmão e muita prancheta.',
    lista: 'GOL Gigante 80, GOL Jiló 60, ZAG Tanque 82, ZAG Rocha 74, ZAG Pimenta 62, LAT Flecha 79, LAT Mola 68, VOL Capitão Sub-20 95, VOL Cronômetro 66, MEI Maestro 81, MEI Prancheta 70, MEI Apito 58, ATA Duda Bala 87, ATA Turbo 75, ATA Cone 60, ATA Garrafinha 54' },
  { id: 'ct22', time: 'CT Sub-20', ano: 2022, emoji: '🎽', cor: '#3a6ae8', lore: 'Lua armava o jogo e a goleira Dudinha pegava até pensamento.',
    lista: 'GOL Dudinha 86, GOL Colete 58, ZAG Barreira 77, ZAG Luana 73, ZAG Travinha 57, LAT Joca 74, LAT Estica 62, VOL Pulmão 78, VOL Bruna 64, MEI Lua 90, MEI Kiki 71, MEI Zezinho 59, ATA Relâmpago 84, ATA Tiquinho 70, ATA Nando 60' },
  { id: 'est70', time: 'Estádio Lendário', ano: 1970, emoji: '🏟️', cor: '#f8d838', lore: 'O maior time de todos os tempos. Dadá, a lenda, fazia gol até de olho fechado.',
    lista: 'GOL Seu Bené 82, GOL Bonzão 62, ZAG Dom Pedrão 84, ZAG Ximbica 74, ZAG Carrapato 60, LAT Tico-Tico 80, LAT Baleia 65, VOL Maestro Joaquim 83, VOL Tonel 66, MEI Canhotinha 92, MEI Doutor 81, MEI Jabuti 63, ATA Dadá 99, ATA Rolinha 78, ATA Pé de Anjo 70, ATA Zé Bala 58' },
  { id: 'est90', time: 'Estádio Lendário', ano: 1990, emoji: '🏟️', cor: '#e0b020', lore: 'O Paredão estreou aqui. Diziam que o gol dele era menor que os outros.',
    lista: 'GOL O Paredão 97, GOL Pinguim 60, ZAG Zagueirão 80, ZAG Galo 72, ZAG Mingau 57, LAT Tatá 78, LAT Rabisco 64, VOL Formigão 79, VOL Tamborim 63, MEI Pena 82, MEI Coringa 71, MEI Quindim 58, ATA Furacão 90, ATA Tamanduá 72, ATA Sabugo 61' },
  { id: 'varzea82', time: 'Seleção da Várzea', ano: 1982, emoji: '⚽', cor: '#8a4b24', lore: 'Tonhão na zaga, Fumaça no ataque: o terror dos campos de terra.',
    lista: 'GOL Barrigudo 71, GOL Cebola 50, ZAG Tonhão 90, ZAG Marretão 70, ZAG Cotovelo 55, LAT Chinelão 69, LAT Perninha 58, VOL Trator 74, VOL Bigorna 60, MEI Magrinho 80, MEI Farofa 66, MEI Bolota 52, ATA Fumaça 87, ATA Canhão 73, ATA Poeira 62, ATA Bexiga 48' },
  { id: 'morro98', time: 'Unidos do Morro Alto', ano: 1998, emoji: '⛰️', cor: '#7a2ad9', lore: 'O time que jogava no ritmo do samba. Gingado driblava dançando.',
    lista: 'GOL Cabrito 73, GOL Teimoso 52, ZAG Ladeira 75, ZAG Laje 68, ZAG Tampão 54, LAT Escadinha 72, LAT Pipa Voada 61, VOL Batuque 70, VOL Cuíca 59, MEI Gingado 91, MEI Pandeiro 74, MEI Sambinha 60, ATA Sorriso 86, ATA Mirante 68, ATA Beco 57' },
  { id: 'tord06', time: 'Real Tordesilhas', ano: 2006, emoji: '👑', cor: '#f4f0ff', lore: 'O clube mais rico do mapa: três craques e um bobo da corte no banco.',
    lista: 'GOL Marquês 80, GOL Pajem 56, ZAG Barão 86, ZAG Duque 76, ZAG Escudeiro 61, LAT Visconde 77, LAT Mordomo 63, VOL Cardeal 78, VOL Arauto 64, MEI Dom Rafael 90, MEI Bispo 73, MEI Bobo da Corte 55, ATA Condessa 88, ATA Cavaleiro 74, ATA Corneteiro 60' },
  { id: 'serra62', time: 'Operário Serra Azul', ano: 1962, emoji: '⛏️', cor: '#3aa0e0', lore: 'Time de mineiros: jogavam depois do turno e ainda corriam o jogo inteiro.',
    lista: 'GOL Capacete 74, GOL Lanterna 53, ZAG Picareta 84, ZAG Bigornão 70, ZAG Carvão 56, LAT Trilho 68, LAT Vagonete 57, VOL Britadeira 73, VOL Pá 61, MEI Engenheiro 77, MEI Serrote 65, MEI Parafuso 50, ATA Martelo 88, ATA Dinamite 71, ATA Cascalho 59' },
  { id: 'rioseco58', time: 'Ferroviário Rio Seco', ano: 1958, emoji: '🚂', cor: '#8a1010', lore: 'O Maquinista chegava na área na velocidade do trem das seis.',
    lista: 'GOL Sinaleiro 77, GOL Bilhete 49, ZAG Vagão 82, ZAG Dormente 69, ZAG Graxa 53, LAT Trilheiro 71, LAT Estação 60, VOL Caldeira 75, VOL Carvoeiro 62, MEI Fumacinha 79, MEI Bitola 64, MEI Plataforma 54, ATA Maquinista 91, ATA Expresso 76, ATA Maria-Fumaça 63' },
  { id: 'coqueiral74', time: 'Estrela do Coqueiral', ano: 1974, emoji: '⭐', cor: '#2ad96a', lore: 'Coquinho dava passes tão macios que pareciam água de coco.',
    lista: 'GOL Palmito 70, GOL Sombra 51, ZAG Tronco 74, ZAG Coco Seco 66, ZAG Raiz 52, LAT Cipó 72, LAT Folhinha 58, VOL Tucano 73, VOL Macaquinho 61, MEI Coquinho 88, MEI Caju 69, MEI Siriguela 56, ATA Estrelinha 85, ATA Periquito 70, ATA Jaca 60' },
  { id: 'barro89', time: 'Grêmio Barro Vermelho', ano: 1989, emoji: '🧱', cor: '#b0301a', lore: 'Time humilde de olaria. Só a Poeirinha e o Tijolão salvavam.',
    lista: 'GOL Lamaçal 66, GOL Buraco 44, ZAG Tijolão 82, ZAG Argila 63, ZAG Tatuzão 50, LAT Enxurrada 64, LAT Barrinho 52, VOL Olaria 67, VOL Telha 55, MEI Vermelhinho 72, MEI Adobe 60, MEI Torrão 48, ATA Poeirinha 84, ATA Lamparina 65, ATA Goteira 53' },
  { id: 'lagoa12', time: 'Juventude Lagoa Verde', ano: 2012, emoji: '🐸', cor: '#4fc26a', lore: 'Sapinha pulava mais alto que todo mundo nos escanteios.',
    lista: 'GOL Garça 84, GOL Girino 55, ZAG Jacaré 76, ZAG Capivara 70, ZAG Lodo 54, LAT Libélula 73, LAT Vitória-Régia 62, VOL Pato Bravo 71, VOL Marrequinha 60, MEI Martim 78, MEI Taboa 66, MEI Lambari 55, ATA Sapinha 89, ATA Piaba 72, ATA Traíra 63' },
  { id: 'ventania66', time: 'Independente Ventania', ano: 1966, emoji: '🌪️', cor: '#c0c0c0', lore: 'Redemoinho girava em volta do zagueiro e sumia com a bola.',
    lista: 'GOL Catavento 72, GOL Vendaval 54, ZAG Tufão 78, ZAG Rajada 67, ZAG Poeirão 55, LAT Assobio 74, LAT Friozinho 61, VOL Minuano 72, VOL Garoa 60, MEI Brisa 84, MEI Pipa Alta 68, MEI Sereno 57, ATA Redemoinho 90, ATA Ventinho 71, ATA Trovoada 64' },
  { id: 'paubrasil00', time: 'Atlético Pau-Brasil', ano: 2000, emoji: '🌳', cor: '#e03a3a', lore: 'Brasa, Ipê e o goleiro Jequitibá: três árvores que ninguém derrubava.',
    lista: 'GOL Jequitibá 85, GOL Graveto 52, ZAG Aroeira 77, ZAG Jatobá 71, ZAG Casca 56, LAT Sabiazinho 74, LAT Galho 60, VOL Cerne 76, VOL Seiva 63, MEI Brasa 89, MEI Caixeta 68, MEI Farpa 54, ATA Ipê 86, ATA Mogno 70, ATA Semente 58' },
  { id: 'mangueiral85', time: 'União do Mangueiral', ano: 1985, emoji: '🥭', cor: '#ff7a1a', lore: 'Manga Rosa fazia gol e dividia manga com a torcida depois do jogo.',
    lista: 'GOL Caroço 69, GOL Fiapo 50, ZAG Espada 75, ZAG Bacurau 66, ZAG Galhudo 53, LAT Carlota 82, LAT Chupinha 60, VOL Mangueirão 72, VOL Suco 59, MEI Rosinha 76, MEI Polpa 64, MEI Casquinha 52, ATA Manga Rosa 87, ATA Doce 68, ATA Sabiá-Laranjeira 57' },
  { id: 'solnasc16', time: 'Sociedade Sol Nascente', ano: 2016, emoji: '🌅', cor: '#ffd23f', lore: 'Aurora e Raio: o time que acordava cedo pra treinar e dormia campeão.',
    lista: 'GOL Madrugada 75, GOL Orvalho 56, ZAG Horizonte 83, ZAG Alvorada 72, ZAG Neblina 55, LAT Galo Cantor 73, LAT Luzinha 61, VOL Meio-Dia 74, VOL Sombrinha 62, MEI Aurora 88, MEI Girassol 70, MEI Crepúsculo 57, ATA Raio 90, ATA Clarão 73, ATA Faísca Jr. 61' },
  { id: 'pombal50', time: 'Esporte Clube Pombal', ano: 1950, emoji: '🕊️', cor: '#e8e8f0', lore: 'O time mais antigo da região. Jogava com bola de capotão pesada.',
    lista: 'GOL Ninho 70, GOL Pena Velha 47, ZAG Poleiro 71, ZAG Bicudo 62, ZAG Farelo 49, LAT Voador 68, LAT Arrulho 55, VOL Alpiste 69, VOL Milho 57, MEI Asa Branca 83, MEI Pombinha 64, MEI Penugem 51, ATA Pombo Correio 85, ATA Rasante 67, ATA Pardal 56' },
  { id: 'cajueiro20', time: 'Meninas do Cajueiro', ano: 2020, emoji: '🌸', cor: '#ff5ad0', lore: 'Castanha e Maju lideraram as meninas ao título invicto da região.',
    lista: 'GOL Tetê 82, GOL Lulu 58, ZAG Rafa Muralha 76, ZAG Dandara 72, ZAG Cacau 56, LAT Pitanga 75, LAT Mel 63, VOL Jabuticaba 74, VOL Kaká 61, MEI Maju 87, MEI Cajuína 70, MEI Flor 57, ATA Castanha 91, ATA Lelinha 73, ATA Pimentinha 62' },
  { id: 'quebra79', time: 'Associação Quebra-Canela', ano: 1979, emoji: '🦴', cor: '#5a3a1a', lore: 'Time pegador! O Carrinho dava carrinho até no aquecimento.',
    lista: 'GOL Muralhão 73, GOL Fura-Rede 46, ZAG Carrinho 88, ZAG Canelada 71, ZAG Tranco 58, LAT Rasteira 70, LAT Cotovelinho 57, VOL Botinada 84, VOL Pisão 62, MEI Maloqueiro 74, MEI Cabeçada 63, MEI Topada 50, ATA Chuveirinho 82, ATA Bicuda 67, ATA Canela Fina 55' },
];
const COPA_ELENCOS = COPA_ELENCOS_BRUTO.map(e => ({
  id: e.id, time: e.time, ano: e.ano, emoji: e.emoji, cor: e.cor, lore: e.lore,
  jogadores: e.lista.split(',').map(s => {
    const p = s.trim().split(/\s+/); const pos = p.shift(); const forca = +p.pop(); const nome = p.join(' ');
    return { nome, pos, forca, lenda: COPA_LENDAS.includes(nome) };
  }),
}));

// times dos sonhos da IA
const COPA_NOMES_IA = ['Zeca', 'Tonho', 'Luan', 'Biel', 'Caio', 'Davi', 'Rafa', 'Gui', 'Nando', 'Tuca', 'Neném', 'Pipoca', 'Foguinho', 'Carlinhos', 'Jajá', 'Lelê', 'Nina', 'Bia', 'Duda', 'Mari', 'Juju', 'Lari', 'Tati', 'Gabi', 'Téo', 'Kadu', 'Vini', 'Leco', 'Dedé', 'Fumaça', 'Tatu', 'Paçoca', 'Magrão', 'Baixinho', 'Alemão', 'Cabeção', 'Formiga', 'Bolinha', 'Russo', 'Ceará', 'Paraíba', 'Tchê', 'Mineiro', 'Canela', 'Faísca', 'Sabiá', 'Tiziu', 'Bambu', 'Jacaré', 'Xodó', 'Pingo', 'Taco', 'Toquinho', 'Marreco', 'Cacau', 'Lulu', 'Maju', 'Tetê', 'Kiki', 'Dandara', 'Pitoco', 'Chumbinho', 'Trovão', 'Parafuso', 'Batata', 'Quiabo', 'Pimpão', 'Bochecha', 'Tampinha', 'Vavá'];
const COPA_TIMES_PRE = ['Esquadrão', 'Galácticos', 'Dinastia', 'Lendas', 'Máquina', 'Relâmpagos', 'Titãs', 'Feras', 'Magos', 'Guerreiros', 'Furacões', 'Astros', 'Tubarões', 'Dragões', 'Leões', 'Onças'];
const COPA_TIMES_SUF = ['do Cajueiro', 'da Ventania', 'do Trovão', 'do Sertão', 'da Serra', 'do Litoral', 'da Colina', 'do Pantanal', 'da Garoa', 'do Mangue', 'do Poeirão', 'da Lagoa', 'do Pombal', 'do Coqueiral', 'da Ladeira', 'do Cerrado', 'da Chapada', 'do Vale Verde', 'da Pedra Lisa', 'do Rio Seco', 'da Areia Branca', 'do Sol Nascente'];
const COPA_EMOJIS_IA = ['🦁', '🐯', '🦈', '🐉', '🦅', '🐺', '🐆', '🦂', '🐍', '🦏', '🐗', '🦬', '🐊', '🦉', '🐝', '🔥', '⚡', '🌋', '🌊', '☄️', '🌵', '🍀', '🎯', '💎'];
const COPA_CORES_IA = ['#e03a3a', '#2a4ad9', '#2ad96a', '#1a1a1a', '#ff7a1a', '#7a2ad9', '#3aa0e0', '#8a1010', '#ff5ad0', '#5a3a1a', '#0a7a6a', '#b0a020'];

/* ============================================================
   LÓGICA (sem DOM — testável no node)
   ============================================================ */
const copaCl = (v, a, b) => Math.max(a, Math.min(b, v));
function copaPosNome(p) { return (typeof POS_NOME !== 'undefined' && POS_NOME[p]) || COPA_POS_NOME[p] || p; }
// 1 = posição certa, 0.9 = improvisado, 0 = não pode
function copaFator(pos, slot) {
  if (pos === slot) return 1;
  if (pos === 'GOL' || slot === 'GOL') return 0;
  return (COPA_COMPAT[slot] || []).includes(pos) ? COPA_IMPROV : 0;
}
function copaForcaEfetiva(p, slot) { return Math.round(p.forca * copaFator(p.pos, slot)); }
function copaAtributos(forca, slot) {
  const m = COPA_MULT[slot]; const base = 99 * Math.pow(copaCl(forca, 1, 99) / 99, COPA_CURVA);
  const c = k => copaCl(Math.round(base * m[k]), 3, 99);
  return { pos: slot, atq: c(0), def: c(1), pas: c(2), fis: c(3), energia: 100 };
}
// slots [{pos, p}] → escalados [{slot, j}] no formato do motor (team.js)
function copaEscalados(slots) {
  return slots.map(s => ({ slot: s.pos, j: s.p ? Object.assign(copaAtributos(copaForcaEfetiva(s.p, s.pos), s.pos), { nome: s.p.nome }) : null }));
}
function copaForcaMedia(slots) {
  const ch = slots.filter(s => s.p); if (!ch.length) return 0;
  return Math.round(ch.reduce((a, s) => a + copaForcaEfetiva(s.p, s.pos), 0) / ch.length);
}
function copaTatica(estilo) { return (COPA_ESTILOS[estilo] || COPA_ESTILOS.equilibrado).tatica; }
function copaSetores(slots, estilo) { return setores(copaEscalados(slots), copaTatica(estilo), 0); }

/* ---------- draft ---------- */
function copaNovoDraft(formacao, almanaque) {
  return { formacao, almanaque: !!almanaque, slots: COPA_FORMACOES[formacao].map(([pos, x, y]) => ({ pos, x, y, p: null })), pulos: COPA_PULOS, usados: [], atual: null, rolagens: 0, ultimo: null };
}
function copaRolar(d, r = Math.random) {
  let pool = COPA_ELENCOS.filter(e => !d.usados.includes(e.id));
  if (!pool.length) { d.usados = []; pool = COPA_ELENCOS.slice(); }
  const e = pool[Math.floor(r() * pool.length)];
  d.usados.push(e.id); d.atual = e; d.rolagens++; d.ultimo = null;
  return e;
}
// índices das posições livres que aceitam o jogador (melhor encaixe primeiro)
function copaSlotsPara(d, jog) {
  return d.slots.map((s, i) => ({ i, f: s.p ? 0 : copaFator(jog.pos, s.pos) })).filter(x => x.f > 0).sort((a, b) => b.f - a.f).map(x => x.i);
}
function copaEscolhivel(d, jog) { return copaSlotsPara(d, jog).length > 0; }
function copaColocar(d, jog, idx) {
  const s = d.slots[idx]; if (!d.atual || !s || s.p || copaFator(jog.pos, s.pos) <= 0) return false;
  const e = d.atual;
  s.p = { nome: jog.nome, pos: jog.pos, forca: jog.forca, lenda: jog.lenda, elenco: `${e.time} ${e.ano}`, elencoId: e.id, cor: e.cor, emoji: e.emoji };
  d.ultimo = { idx, elenco: e }; d.atual = null;
  return true;
}
function copaDesfazer(d) {
  if (!d.ultimo) return false;
  d.slots[d.ultimo.idx].p = null; d.atual = d.ultimo.elenco; d.ultimo = null; return true;
}
function copaPular(d) { if (!d.atual || d.pulos <= 0) return false; d.pulos--; d.atual = null; return true; }
function copaDraftCompleto(d) { return d.slots.every(s => s.p); }
function copaLivres(d) { return d.slots.filter(s => !s.p).length; }

/* ---------- times da IA ---------- */
function copaTimeIA(info, alvo, r = Math.random) {
  const forms = Object.keys(COPA_FORMACOES); const fk = forms[Math.floor(r() * forms.length)];
  const usados = new Set();
  const slots = COPA_FORMACOES[fk].map(([pos, x, y]) => {
    let n, t = 0; do { n = COPA_NOMES_IA[Math.floor(r() * COPA_NOMES_IA.length)]; } while (usados.has(n) && ++t < 50); usados.add(n);
    return { pos, x, y, p: { nome: n, pos, forca: copaCl(Math.round(alvo + r() * 8 - 4 + (pos === 'GOL' ? 1 : 0)), 40, 99) } };
  });
  const est = Object.keys(COPA_ESTILOS); const estilo = est[Math.floor(r() * est.length)];
  const t = Object.assign({ ia: true, alvo: Math.round(alvo), formacao: fk, estilo, slots }, info);
  t.forca = copaForcaMedia(slots);
  return t;
}
function copaNomesTimes(n, r = Math.random) {
  const out = []; const usados = new Set(); let tent = 0;
  while (out.length < n && tent++ < 5000) {
    const pre = COPA_TIMES_PRE[Math.floor(r() * COPA_TIMES_PRE.length)], suf = COPA_TIMES_SUF[Math.floor(r() * COPA_TIMES_SUF.length)];
    if (usados.has(pre) && out.length < COPA_TIMES_PRE.length) continue; // variedade
    const nome = `${pre} ${suf}`; if (out.some(o => o.nome === nome || (o.suf === suf && out.length < COPA_TIMES_SUF.length))) continue;
    usados.add(pre);
    out.push({ nome, suf, emoji: COPA_EMOJIS_IA[out.length % COPA_EMOJIS_IA.length], cor: COPA_CORES_IA[Math.floor(r() * COPA_CORES_IA.length)] });
  }
  while (out.length < n) out.push({ nome: `Seleção Misteriosa ${out.length + 1}`, emoji: '❔', cor: '#555' });
  return out;
}

/* ---------- partidas ---------- */
const COPA_PESO_GOL = { ATA: 5, MEI: 3, LAT: 1.2, VOL: 1, ZAG: 0.6, GOL: 0 };
const COPA_PESO_ASS = { MEI: 4, LAT: 2, ATA: 2, VOL: 1.5, ZAG: 0.4, GOL: 0.05 };
function copaSorteia(slots, pesos, exceto) {
  const lista = slots.filter(s => s.p && s.p.nome !== exceto).map(s => ({ s, w: (pesos[s.pos] || 0) * s.p.forca }));
  const tot = lista.reduce((a, x) => a + x.w, 0); let k = Math.random() * tot;
  for (const x of lista) { k -= x.w; if (k <= 0) return x.s.p; }
  return lista.length ? lista[lista.length - 1].s.p : { nome: '?' };
}
function copaGoleiro(slots) { const g = slots.find(s => s.pos === 'GOL' && s.p); return g ? { nome: g.p.nome, forca: copaForcaEfetiva(g.p, 'GOL') } : { nome: 'o goleiro', forca: 40 }; }
function copaSimula(nosSlots, estilo, adv) {
  const A = copaSetores(nosSlots, estilo), B = copaSetores(adv.slots, adv.estilo);
  const mins = Array.from({ length: 16 }, () => 1 + Math.floor(Math.random() * 90)).sort((a, b) => a - b);
  let ga = 0, gb = 0, salvou = null, perdeu = null, defesaNossa = null; const eventos = [];
  for (let i = 0; i < 16; i++) {
    const l = lance(A, B); const m = mins[i];
    if (l.gol) {
      if (l.atacaA) ga++; else gb++;
      const t = l.atacaA ? nosSlots : adv.slots; const autor = copaSorteia(t, COPA_PESO_GOL); const ass = copaSorteia(t, COPA_PESO_ASS, autor.nome);
      eventos.push({ min: m, nos: l.atacaA, autor: autor.nome, assist: ass.nome });
    } else if (l.tipo === 'defesa' && !l.atacaA && !defesaNossa) defesaNossa = { min: m, autor: copaSorteia(adv.slots, COPA_PESO_GOL).nome };
    else if (l.tipo === 'defesa' && l.atacaA && !salvou) salvou = { min: m, autor: copaSorteia(nosSlots, COPA_PESO_GOL).nome };
    else if (l.tipo === 'fora' && l.atacaA && !perdeu) perdeu = { min: m, autor: copaSorteia(nosSlots, COPA_PESO_GOL).nome };
  }
  return { ga, gb, eventos, salvou, perdeu, defesaNossa };
}
// pênaltis: cara ou coroa com peso pela força dos goleiros
function copaPenaltis(gkNos, gkAdv, r = Math.random) {
  const p = copaCl(0.5 + (gkNos - gkAdv) * 0.025, 0.2, 0.8);
  const venceNos = r() < p;
  let w = 3 + Math.floor(r() * 3), l = Math.max(0, w - 1 - Math.floor(r() * 3));
  if (w === 5 && r() < 0.25) { w = 6 + Math.floor(r() * 2); l = w - 1; } // alternadas
  return { venceNos, nos: venceNos ? w : l, adv: venceNos ? l : w, chance: p };
}

/* ---------- campanha ---------- */
function copaLinhaTabela(t) { return { id: t.id, nome: t.nome, emoji: t.emoji, pts: 0, j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sorte: Math.random() }; }
function copaNovaCampanha(slots, estilo, almanaque, r = Math.random) {
  const nomes = copaNomesTimes(31, r); let k = 0;
  const mk = alvo => { const t = copaTimeIA(nomes[k], alvo, r); t.id = 't' + k; k++; return t; };
  // grupo: 3 rivais de força 70–80, do mais fraco pro mais forte
  const grupo = [mk(70 + r() * 3.3), mk(73.3 + r() * 3.3), mk(76.6 + r() * 3.4)];
  const mata = COPA_FASES.slice(3).map(f => mk(f.faixa[0] + r() * (f.faixa[1] - f.faixa[0])));
  const outros = Array.from({ length: 24 }, () => mk(68 + r() * 18));
  // grupos B–H (28 vagas): os 4 adversários do mata-mata + 24 outros times
  const grupos = {}; let o = 0;
  'BCDEFGH'.split('').forEach(L => { grupos[L] = []; });
  ['B', 'D', 'F', 'H'].forEach((L, i) => { grupos[L].push(mata[i]); mata[i].origem = `${i % 2 ? '1º' : '2º'} do Grupo ${L}`; });
  'BCDEFGH'.split('').forEach(L => { while (grupos[L].length < 4) grupos[L].push(outros[o++]); });
  grupo.forEach(t => { t.origem = 'Grupo A'; });
  const tabela = [copaLinhaTabela({ id: 'nos', nome: COPA_NOME_TIME, emoji: '⭐' }), ...grupo.map(copaLinhaTabela)];
  return {
    slots, estilo, almanaque: !!almanaque, fase: 0, grupo, mata, grupos, tabela, jogos: [],
    v: 0, e: 0, d: 0, gp: 0, gc: 0, fim: false, campeao: false, eliminadoEm: null, perfeito: false, posGrupo: null,
    premio: { xp: 0, ouro: 0, itens: [] }, processado: false,
  };
}
function copaAdvDaFase(c, f = c.fase) { return f < 3 ? c.grupo[f] : c.mata[f - 3]; }
function copaRegistra(tab, idA, idB, ga, gb) {
  const a = tab.find(x => x.id === idA), b = tab.find(x => x.id === idB);
  a.j++; b.j++; a.gp += ga; a.gc += gb; b.gp += gb; b.gc += ga;
  if (ga > gb) { a.v++; b.d++; a.pts += 3; } else if (gb > ga) { b.v++; a.d++; b.pts += 3; } else { a.e++; b.e++; a.pts++; b.pts++; }
}
function copaTabela(c) { return [...c.tabela].sort((x, y) => y.pts - x.pts || (y.gp - y.gc) - (x.gp - x.gc) || y.gp - x.gp || y.sorte - x.sorte); }
// joga a próxima partida da campanha e atualiza tudo
function copaJogarProximo(c) {
  if (c.fim) return null;
  const f = c.fase; const fase = COPA_FASES[f]; const adv = copaAdvDaFase(c);
  const res = copaSimula(c.slots, c.estilo, adv);
  res.fase = f; res.advId = adv.id; res.advNome = adv.nome; res.advEmoji = adv.emoji; res.advForca = adv.forca;
  if (!fase.grupo && res.ga === res.gb) res.pen = copaPenaltis(copaGoleiro(c.slots).forca, copaGoleiro(adv.slots).forca);
  res.resultado = res.ga > res.gb || (res.pen && res.pen.venceNos) ? 'v' : (res.ga === res.gb && !res.pen ? 'e' : 'd');
  c[res.resultado]++; c.gp += res.ga; c.gc += res.gb; c.jogos.push(res);
  if (fase.grupo) {
    copaRegistra(c.tabela, 'nos', adv.id, res.ga, res.gb);
    const par = [[1, 2], [0, 2], [0, 1]][f]; const a = c.grupo[par[0]], b = c.grupo[par[1]];
    const [x, y] = simRapida(copaSetores(a.slots, a.estilo), copaSetores(b.slots, b.estilo));
    copaRegistra(c.tabela, a.id, b.id, x, y); res.outro = { a: a.nome, b: b.nome, ga: x, gb: y };
    if (f === 2) {
      const pos = copaTabela(c).findIndex(t => t.id === 'nos') + 1; c.posGrupo = pos; res.classificou = pos <= 2;
      if (pos > 2) { c.fim = true; c.eliminadoEm = f; }
    }
  } else if (res.resultado === 'd') { c.fim = true; c.eliminadoEm = f; }
  else if (f === COPA_FASES.length - 1) { c.fim = true; c.campeao = true; }
  if (!c.fim) c.fase++;
  if (c.fim) {
    c.perfeito = c.campeao && c.v === 7 && c.gc === 0;
    c.campeaoNome = c.campeao ? COPA_NOME_TIME : copaQuemFoiCampeao(c);
  }
  return res;
}
// se fomos eliminados, descobre quem levou a taça (simulação rápida do resto da chave)
function copaQuemFoiCampeao(c) {
  let atual = c.eliminadoEm >= 3 ? c.mata[c.eliminadoEm - 3] : c.mata[0];
  const ini = c.eliminadoEm >= 3 ? c.eliminadoEm - 2 : 1;
  for (let i = ini; i < c.mata.length; i++) {
    const o = c.mata[i]; const [x, y] = simRapida(copaSetores(atual.slots, atual.estilo), copaSetores(o.slots, o.estilo));
    if (y > x || (x === y && Math.random() < 0.5)) atual = o;
  }
  return atual.nome;
}

/* ============================================================
   INTERFACE
   ============================================================ */
let COPA = null; // { etapa, draft, camp, estilo, sel, rolando, timers, atalhos, ultimoRes }

function copaCss() {
  if (typeof document === 'undefined' || document.getElementById('copa-css')) return;
  const st = document.createElement('style'); st.id = 'copa-css';
  st.textContent = `
.copa { font-family: Nunito, sans-serif; color: var(--tinta, #3b2410); font-variant-ligatures: none; font-feature-settings: "liga" 0, "clig" 0; }
.copa * { font-variant-ligatures: none; }
.copa h2, .copa h3, .copa .tit { font-family: 'Fredoka', 'Pixelify Sans', sans-serif; }
.copa h2 { margin: 0 36px 6px 0; }
.copa .passo { background: #fff6c0; border: 2px dashed #e0b030; border-radius: 8px; padding: 8px 12px; font-weight: 800; font-size: 16px; margin: 6px 0 10px; display: flex; gap: 10px; align-items: center; }
.copa .passo .n { background: var(--roxo2, #3a2780); color: #fff; border-radius: 50%; min-width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; font-family: 'Fredoka', sans-serif; }
.copa .regras { margin: 6px 0 10px; padding-left: 0; list-style: none; counter-reset: r; font-weight: 700; }
.copa .regras li { counter-increment: r; display: flex; gap: 8px; align-items: flex-start; margin: 5px 0; line-height: 1.35; }
.copa .regras li::before { content: counter(r); background: var(--madeira, #8a4b24); color: var(--papel, #f7e3b5); border-radius: 50%; min-width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; }
.copa .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; margin: 8px 0; }
.copa .stat { background: #fffaf0; border: 2px solid var(--papel2, #ecd09a); border-radius: 8px; padding: 8px; text-align: center; }
.copa .stat b { display: block; font-size: 26px; font-family: 'Fredoka', sans-serif; color: var(--madeira2, #5e2f14); }
.copa .stat small { font-weight: 700; opacity: .8; }
.copa .alm { display: flex; gap: 10px; align-items: center; background: #efe6ff; border: 2px solid #b8a0f0; border-radius: 8px; padding: 8px 10px; margin: 8px 0; }
.copa .alm.on { background: #e2d4ff; border-color: var(--roxo2, #3a2780); }
.copa .alm p { margin: 0 !important; font-size: 13px; }
.copa .topo-draft { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-bottom: 4px; }
.copa .pill { background: #fffaf0; border: 2px solid var(--papel2, #ecd09a); border-radius: 999px; padding: 3px 10px; font-weight: 800; font-size: 13px; white-space: nowrap; }
.copa .pill.roxo { background: var(--roxo2, #3a2780); color: #fff; border-color: #24125e; }
.copa .grade { display: grid; grid-template-columns: minmax(250px, 360px) 1fr; gap: 14px; align-items: start; }
.copa .campo { position: relative; width: 100%; max-width: 360px; aspect-ratio: 68 / 94; margin: 0 auto; border: 3px solid var(--madeira2, #5e2f14); border-radius: 8px;
  background: repeating-linear-gradient(180deg, #3fa34a 0 10%, #48b052 10% 20%); box-shadow: inset 0 0 0 3px rgba(255,255,255,.6); }
.copa .campo .lm { position: absolute; left: 3px; right: 3px; top: 50%; height: 2px; background: rgba(255,255,255,.7); }
.copa .campo .cc { position: absolute; left: 50%; top: 50%; width: 22%; aspect-ratio: 1; border: 2px solid rgba(255,255,255,.7); border-radius: 50%; transform: translate(-50%, -50%); }
.copa .campo .ar { position: absolute; left: 25%; right: 25%; height: 13%; border: 2px solid rgba(255,255,255,.7); }
.copa .campo .ar.cima { top: 3px; border-top: 0; } .copa .campo .ar.baixo { bottom: 3px; border-bottom: 0; }
.copa .slotc { position: absolute; transform: translate(-50%, -50%); width: 64px; display: flex; flex-direction: column; align-items: center; gap: 1px; background: none; border: 0; padding: 0; font-family: Nunito, sans-serif; cursor: default; z-index: 1; }
.copa .slotc .bola { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 12px; border: 2px dashed rgba(255,255,255,.85); background: rgba(0,0,0,.18); color: #fff; text-shadow: 0 1px 0 rgba(0,0,0,.5); transition: transform .15s; position: relative; }
.copa .slotc.cheio .bola { border: 2px solid #1a1026; box-shadow: 0 2px 0 rgba(0,0,0,.35); text-shadow: none; }
.copa .slotc .rot { font-size: 11px; font-weight: 800; color: #fff; background: rgba(20,12,36,.72); border-radius: 4px; padding: 0 4px; max-width: 76px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 15px; }
.copa .slotc .fz { position: absolute; right: -10px; top: -8px; background: #1a1026; color: var(--amarelo, #ffd23f); font-size: 11px; border-radius: 6px; padding: 0 4px; line-height: 15px; }
.copa .slotc .imp { white-space: nowrap; font-size: 10px; font-weight: 800; background: #ffd23f; color: #3b2410; border-radius: 4px; padding: 0 3px; }
.copa .slotc.alvo-ok, .copa .slotc.alvo-imp { cursor: pointer; z-index: 2; }
.copa .slotc.alvo-ok .bola { border: 3px solid #b8ff9a; background: rgba(60,200,80,.75); animation: copaPulsoV 1s infinite; }
.copa .slotc.alvo-imp .bola { border: 3px solid #fff08a; background: rgba(230,180,20,.8); animation: copaPulsoA 1s infinite; }
.copa .slotc.alvo-ok:hover .bola, .copa .slotc.alvo-imp:hover .bola, .copa .slotc:focus-visible .bola { transform: scale(1.18); }
.copa .slotc.bloq { opacity: .4; }
.copa .slotc.novo .bola { animation: copaPop .45s ease-out; }
.copa .campo.mini { max-width: 120px; pointer-events: none; }
.copa .campo.mini .slotc { width: auto; } .copa .campo.mini .slotc .bola { width: 12px; height: 12px; font-size: 0; border: 1px solid #fff; background: var(--amarelo, #ffd23f); }
.copa .forms { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
.copa .form-card { background: #fffaf0; border: 3px solid var(--madeira3, #b8733a); border-radius: 10px; padding: 8px; display: flex; flex-direction: column; align-items: center; gap: 6px; font-family: 'Fredoka', 'Pixelify Sans', sans-serif; font-size: 20px; color: var(--madeira2, #5e2f14); }
.copa .form-card:hover, .copa .form-card:focus-visible { border-color: var(--amarelo2, #f0a81a); background: #fff2c0; transform: translateY(-2px); }
.copa .form-card small { font-family: Nunito, sans-serif; font-size: 11px; color: #6a5030; }
.copa .painel-sorteio { background: #fffaf0; border: 3px solid var(--papel2, #ecd09a); border-radius: 10px; padding: 10px; min-height: 260px; }
.copa .dado-zona { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; min-height: 230px; text-align: center; }
.copa .dado { font-size: 64px; line-height: 1; filter: drop-shadow(0 3px 0 rgba(0,0,0,.25)); }
.copa .dado.gira { animation: copaDado .35s linear infinite; }
.copa .elenco-cab { display: flex; align-items: center; gap: 10px; border-radius: 8px; padding: 8px 10px; margin-bottom: 6px; border: 2px solid rgba(0,0,0,.25); animation: copaPop .35s ease-out; }
.copa .elenco-cab .em { font-size: 34px; }
.copa .elenco-cab .tit { font-size: 20px; font-weight: 700; line-height: 1.1; }
.copa .elenco-cab small { display: block; font-size: 12px; font-weight: 700; opacity: .85; }
.copa .jogs { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
.copa .jog { display: flex; align-items: center; gap: 6px; background: #fff; border: 2px solid var(--papel2, #ecd09a); border-radius: 7px; padding: 4px 6px; font-family: Nunito, sans-serif; font-weight: 800; font-size: 14px; color: var(--tinta, #3b2410); text-align: left; min-height: 34px; }
.copa .jog:hover:not(:disabled) { border-color: var(--amarelo2, #f0a81a); background: #fff8dc; }
.copa .jog.sel { border-color: var(--roxo2, #3a2780); background: #efe6ff; box-shadow: 0 0 0 2px #b8a0f0; }
.copa .jog:disabled { opacity: .4; cursor: not-allowed; text-decoration: line-through; }
.copa .jog .k { font-size: 10px; color: #8a7050; min-width: 10px; }
.copa .jog .nm { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.copa .jog .f { min-width: 30px; text-align: center; border-radius: 5px; padding: 1px 4px; background: #eee3c8; }
.copa .f90 { background: linear-gradient(#ffe070, #f0a81a) !important; color: #3b2410; }
.copa .f80 { background: #bdf0b0 !important; } .copa .f70 { background: #e8f0d0 !important; } .copa .f0 { background: #e8d8d0 !important; color: #7a5a4a; }
.copa .fq { background: #d8ccf0 !important; color: #3a2780; }
.copa .pos { display: inline-block; min-width: 34px; text-align: center; color: #fff; border-radius: 4px; font-size: 11px; padding: 1px 3px; font-weight: 800; }
.copa .p-GOL { background: #1a8a4a; } .copa .p-ZAG { background: #2a4ad9; } .copa .p-LAT { background: #0a8a9a; } .copa .p-VOL { background: #7a2ad9; } .copa .p-MEI { background: #d97a1a; } .copa .p-ATA { background: #d0302a; }
.copa .dica { font-size: 12px; font-weight: 700; margin: 6px 0 0; opacity: .85; }
.copa .leg { display: inline-block; width: 12px; height: 12px; border-radius: 50%; vertical-align: -2px; margin: 0 3px 0 8px; }
.copa .estilos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.copa .est { background: #fffaf0; border: 3px solid var(--madeira3, #b8733a); border-radius: 10px; padding: 10px; text-align: center; font-family: Nunito, sans-serif; color: var(--tinta, #3b2410); }
.copa .est .em { font-size: 34px; display: block; }
.copa .est b { font-family: 'Fredoka', 'Pixelify Sans', sans-serif; font-size: 19px; display: block; }
.copa .est small { display: block; font-weight: 700; font-size: 12px; margin-top: 4px; }
.copa .est .ef { color: #6a3aa0; }
.copa .est.sel { border-color: var(--roxo2, #3a2780); background: #efe6ff; box-shadow: 0 0 0 3px #b8a0f0; }
.copa .caminho { display: flex; gap: 4px; flex-wrap: wrap; margin: 4px 0 10px; }
.copa .caminho span { flex: 1; min-width: 48px; text-align: center; font-size: 12px; font-weight: 800; border-radius: 6px; padding: 4px 2px; background: #e8dcc0; color: #7a6040; border: 2px solid transparent; }
.copa .caminho .v { background: #4fc26a; color: #fff; } .copa .caminho .e { background: #e8c83a; color: #3b2410; } .copa .caminho .d { background: #e84a4a; color: #fff; }
.copa .caminho .agora { border-color: var(--roxo2, #3a2780); background: #fff; color: var(--roxo2, #3a2780); animation: copaPulsoR 1.2s infinite; }
.copa .confronto { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 10px; text-align: center; background: #fffaf0; border: 3px solid var(--papel2, #ecd09a); border-radius: 12px; padding: 12px; }
.copa .confronto .lado .em { font-size: 40px; display: block; }
.copa .confronto .lado b { font-family: 'Fredoka', 'Pixelify Sans', sans-serif; font-size: 18px; display: block; }
.copa .confronto .lado small { font-weight: 700; font-size: 12px; opacity: .8; }
.copa .placar { font-family: 'Fredoka', 'Pixelify Sans', sans-serif; font-size: 44px; background: #1a1026; color: var(--amarelo, #ffd23f); border-radius: 10px; padding: 2px 16px; min-width: 130px; }
.copa .placar .g { display: inline-block; }
.copa .placar .g.pop { animation: copaPop .5s ease-out; }
.copa .relogio { font-size: 14px; font-weight: 800; color: #6a5030; margin-top: 4px; }
.copa .relogio .barra-t { height: 6px; background: #e0d0b0; border-radius: 3px; overflow: hidden; margin-top: 3px; }
.copa .relogio .barra-t i { display: block; height: 100%; background: var(--roxo2, #3a2780); }
.copa .narr { background: #fffaf0; border: 2px solid var(--papel2, #ecd09a); border-radius: 8px; padding: 6px 10px; margin-top: 8px; min-height: 120px; font-weight: 700; }
.copa .narr div { padding: 3px 0; border-bottom: 1px dashed #e8d8b8; animation: copaEntra .3s ease-out; }
.copa .narr .gn { color: #1a7a1a; font-weight: 900; font-size: 16px; } .copa .narr .ga { color: #b01a1a; font-weight: 900; } .copa .narr .sis { color: #7a5a3a; font-style: italic; } .copa .narr .def { color: #1a5aa0; }
.copa .resultado { text-align: center; font-family: 'Fredoka', 'Pixelify Sans', sans-serif; font-size: 30px; margin: 8px 0 2px; animation: copaPop .5s ease-out; }
.copa .resultado.v { color: #1a8a2a; } .copa .resultado.e { color: #b08a0a; } .copa .resultado.d { color: #c02a2a; }
.copa .centro { display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
.copa .rank-tab td, .copa .rank-tab th { padding: 4px 6px; }
.copa .rank-tab tr.nos { background: #fff2a0; }
.copa .rank-tab tr.cls td:first-child { box-shadow: inset 4px 0 0 #4fc26a; }
.copa .fim-card { text-align: center; background: #fffaf0; border: 3px solid var(--madeira3, #b8733a); border-radius: 12px; padding: 12px; }
.copa .fim-card .trofeu { font-size: 64px; animation: copaPop .6s ease-out; }
.copa .selo7 { display: inline-block; font-family: 'Fredoka', 'Pixelify Sans', sans-serif; font-size: 30px; font-weight: 700; color: #3b2410; padding: 8px 22px; border-radius: 14px; border: 4px solid #9a5a0a;
  background: linear-gradient(110deg, #ffe070 20%, #fff8d0 40%, #ffe070 60%, #f0a81a 100%); background-size: 250% 100%; animation: copaBrilho 2s linear infinite, copaPop .7s ease-out; box-shadow: 0 4px 0 rgba(0,0,0,.3); margin: 6px 0; }
.copa .recorde { display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; margin: 8px 0; }
.copa .caminho-tab { width: 100%; border-collapse: collapse; font-weight: 700; font-size: 14px; margin-top: 8px; }
.copa .caminho-tab td { padding: 4px 6px; border-bottom: 1px solid var(--papel2, #ecd09a); text-align: left; }
.copa .caminho-tab .r { font-weight: 900; text-align: center; border-radius: 5px; color: #fff; }
.copa .caminho-tab .r.v { background: #4fc26a; } .copa .caminho-tab .r.e { background: #e8c83a; color: #3b2410; } .copa .caminho-tab .r.d { background: #e84a4a; }
.copa .kbd { display: inline-block; background: #fff; border: 1px solid #aaa; border-bottom-width: 3px; border-radius: 4px; padding: 0 5px; font-size: 11px; color: #333; font-weight: 800; }
@keyframes copaPop { 0% { transform: scale(.6); opacity: .3; } 60% { transform: scale(1.18); opacity: 1; } 100% { transform: scale(1); } }
@keyframes copaDado { to { transform: rotate(360deg); } }
@keyframes copaPulsoV { 50% { box-shadow: 0 0 0 7px rgba(120,255,120,.35); } }
@keyframes copaPulsoA { 50% { box-shadow: 0 0 0 7px rgba(255,220,60,.4); } }
@keyframes copaPulsoR { 50% { box-shadow: 0 0 0 4px rgba(122,90,224,.35); } }
@keyframes copaEntra { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: none; } }
@keyframes copaBrilho { to { background-position: -250% 0; } }
@media (max-width: 760px) {
  .copa .grade { grid-template-columns: 1fr; }
  .copa .campo:not(.mini) { max-width: 280px; }
  .copa .estilos { grid-template-columns: 1fr; }
  .copa .jogs { grid-template-columns: 1fr; }
  .copa .slotc { width: 56px; } .copa .slotc .rot { font-size: 10px; max-width: 60px; } .copa .slotc .bola { width: 30px; height: 30px; }
  .copa .placar { font-size: 34px; min-width: 100px; }
  .copa .confronto .lado .em { font-size: 30px; }
}`;
  document.head.appendChild(st);
}

/* ---------- utilidades de UI ---------- */
function copaDados() {
  const s = G.save; if (!s.copa) s.copa = {};
  const c = s.copa;
  if (c.jogadas == null) c.jogadas = 0; if (c.titulos == null) c.titulos = 0; if (c.perfeitos == null) c.perfeitos = 0;
  if (!c.melhor) c.melhor = { vitorias: 0, golsSofridos: 0, time: [] };
  if (c.almanaque == null) c.almanaque = false;
  return c;
}
function copaPremioBase() { const n = (G.save && G.save.nivel) || 1; return { xp: 15 + n * 6, ouro: 5 + n * 2 }; }
function copaSom(t) { try { if (typeof som === 'function') som(t); } catch (e) { /* sem som */ } }
function copaCorTexto(hex) {
  const h = hex.replace('#', ''); const n = parseInt(h.length === 3 ? h.split('').map(x => x + x).join('') : h, 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? '#2a1a10' : '#ffffff';
}
function copaClasseForca(f) { return f >= 90 ? 'f90' : f >= 80 ? 'f80' : f >= 70 ? 'f70' : 'f0'; }
function copaLimpaTimers() {
  if (!COPA) return; (COPA.timers || []).forEach(t => { clearTimeout(t); clearInterval(t); }); COPA.timers = []; COPA.rolando = false;
}
function copaTimer(fn, ms, repete) {
  const t = repete ? setInterval(fn, ms) : setTimeout(fn, ms); COPA.timers.push(t);
  window.pararPartida = () => { copaLimpaTimers(); window.pararPartida = null; };
  return t;
}
function copaTecla(ev) {
  if (!COPA || !COPA.atalhos) return;
  const tag = (ev.target && ev.target.tagName || '').toLowerCase();
  if ((ev.key === 'Enter' || ev.key === ' ') && (tag === 'button' || tag === 'select' || tag === 'a')) return; // o botão focado já recebe o clique
  const k = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;
  const fn = COPA.atalhos[k]; if (fn) { ev.preventDefault(); fn(); }
}
function copaMostra(...nodes) {
  copaCss(); copaLimpaTimers();
  abreModal.largo = true;
  abreModal(el('div', { class: 'copa' }, ...nodes));
  window.teclaModal = copaTecla;
}
function copaKbd(t) { return el('span', { class: 'kbd' }, t); }
function copaPasso(n, txt) { return el('div', { class: 'passo' }, el('span', { class: 'n' }, n), el('span', {}, txt)); }

/* ---------- campo (diagrama) ---------- */
// opts: { mini, alvo: jogador selecionado, mostraForca, onSlot(i), novo: idx }
function copaCampo(slots, opts = {}) {
  const campo = el('div', { class: 'campo' + (opts.mini ? ' mini' : '') }, el('div', { class: 'lm' }), el('div', { class: 'cc' }), el('div', { class: 'ar cima' }), el('div', { class: 'ar baixo' }));
  slots.forEach((s, i) => {
    let cls = 'slotc'; let fat = 0;
    if (s.p) cls += ' cheio';
    if (opts.alvo) { fat = s.p ? 0 : copaFator(opts.alvo.pos, s.pos); cls += fat === 1 ? ' alvo-ok' : fat > 0 ? ' alvo-imp' : ' bloq'; }
    if (opts.novo === i) cls += ' novo';
    const bola = el('span', { class: 'bola' }, s.pos);
    if (s.p) { bola.style.background = s.p.cor; bola.style.color = copaCorTexto(s.p.cor); }
    if (s.p && opts.mostraForca && !opts.mini) { const fe = copaForcaEfetiva(s.p, s.pos); bola.append(el('span', { class: 'fz' }, fe)); }
    const titulo = s.p ? `${s.p.nome} (${copaPosNome(s.p.pos)}) — ${s.p.elenco}${s.p.pos !== s.pos ? ' — improvisado' : ''}` : `${copaPosNome(s.pos)} — posição livre`;
    const clicavel = opts.onSlot && !opts.mini;
    const b = el(clicavel ? 'button' : 'div', { class: cls, title: titulo, type: clicavel ? 'button' : null, 'aria-label': titulo }, bola);
    if (!opts.mini) {
      if (s.p) { b.append(el('span', { class: 'rot' }, s.p.nome)); if (s.p.pos !== s.pos) b.append(el('span', { class: 'imp' }, `improv. −${Math.round((1 - COPA_IMPROV) * 100)}%`)); }
      else if (opts.alvo && fat > 0 && fat < 1) b.append(el('span', { class: 'imp' }, `−${Math.round((1 - COPA_IMPROV) * 100)}%`));
      else b.append(el('span', { class: 'rot' }, copaPosNome(s.pos)));
    }
    b.style.left = s.x + '%'; b.style.top = s.y + '%';
    if (clicavel) b.onclick = () => opts.onSlot(i);
    campo.append(b);
  });
  return campo;
}

/* ---------- tela inicial ---------- */
function abrirCopaSonhos() {
  if (!G || !G.save) return;
  const dados = copaDados();
  if (!COPA) COPA = { etapa: 'inicio', timers: [], atalhos: {} };
  const pb = copaPremioBase(); const mult = dados.almanaque ? 1.5 : 1;
  const emAndamento = COPA.draft && COPA.etapa !== 'inicio' && !(COPA.camp && COPA.camp.fim && COPA.camp.processado && COPA.etapa === 'fim');
  const m = dados.melhor;
  const almBtn = el('button', { class: 'btn ' + (dados.almanaque ? 'roxo' : ''), onclick: () => { dados.almanaque = !dados.almanaque; copaSom('equip'); salvar(); abrirCopaSonhos(); } }, `📖 Modo Almanaque: ${dados.almanaque ? 'LIGADO' : 'DESLIGADO'}`);
  COPA.atalhos = { Enter: () => copaTelaFormacao(), n: () => copaTelaFormacao(), a: () => almBtn.click() };
  if (emAndamento) COPA.atalhos.c = () => copaContinuar();
  copaMostra(
    el('h2', {}, '🏆 Copa dos Sonhos'),
    el('p', {}, 'Monte o time dos seus sonhos com craques de todas as épocas da nossa região e tente ganhar a Copa!'),
    el('ol', { class: 'regras' },
      el('li', {}, 'Escolha uma formação (4-3-3, 4-4-2...).'),
      el('li', {}, 'Role o dado 🎲: sai um elenco de um time de verdade da região, de um ano específico.'),
      el('li', {}, 'Escolha 1 jogador desse elenco e clique numa posição livre do campo. Só 1 por sorteio!'),
      el('li', {}, `Não gostou? Pule o sorteio (só ${COPA_PULOS} vezes). Mas cuidado: o próximo pode ser pior!`),
      el('li', {}, 'Com os 11 escalados, escolha o estilo de jogo e dispute a Copa: 3 jogos de grupo (passam os 2 melhores) + oitavas, quartas, semi e final.'),
      el('li', {}, 'Meta máxima: ganhar os 7 jogos sem levar nenhum gol. É o 7 a 0 PERFEITO! 🏅')),
    el('div', { class: 'stats' },
      el('div', { class: 'stat' }, el('b', {}, fmt(dados.jogadas)), el('small', {}, 'Copas jogadas')),
      el('div', { class: 'stat' }, el('b', {}, fmt(dados.titulos)), el('small', {}, 'Títulos 🏆')),
      el('div', { class: 'stat' }, el('b', {}, fmt(dados.perfeitos)), el('small', {}, '7 a 0 perfeitos 🏅')),
      el('div', { class: 'stat' }, el('b', {}, m.vitorias ? `${m.vitorias}V · ${m.golsSofridos}GS` : '—'), el('small', {}, 'Melhor campanha'))),
    m.time && m.time.length ? el('p', { class: 'dica' }, `Time da melhor campanha: ${m.time.join(', ')}.`) : null,
    el('div', { class: 'alm' + (dados.almanaque ? ' on' : '') }, almBtn,
      el('p', {}, 'No Modo Almanaque as forças dos jogadores ficam ESCONDIDAS no sorteio. Só quem conhece a história dos craques da região se dá bem! Prêmios ×1,5.')),
    el('p', { class: 'dica' }, `Prêmio por vitória: ${fmt(pb.xp * mult)} XP e ${fmt(pb.ouro * mult)} tostões. Bônus de campeão e bônus do 7 a 0 perfeito (com pacotinho de figurinhas!).`),
    el('div', { class: 'opcoes' },
      el('button', { class: 'btn amarelo grande', onclick: () => copaTelaFormacao() }, emAndamento ? '⚽ Nova Copa (recomeçar)' : '⚽ Nova Copa'),
      emAndamento ? el('button', { class: 'btn verde grande', onclick: () => copaContinuar() }, '▶ Continuar Copa') : null),
    el('p', { class: 'dica' }, 'Atalhos: ', copaKbd('N'), ' nova copa · ', copaKbd('A'), ' almanaque', emAndamento ? [' · ', copaKbd('C'), ' continuar'] : ''));
}
function copaContinuar() {
  if (!COPA || !COPA.draft) return copaTelaFormacao();
  if (COPA.camp) return COPA.camp.fim && COPA.camp.processado ? copaTelaFim() : copaTelaCopa();
  if (copaDraftCompleto(COPA.draft)) return copaTelaEstilo();
  return copaTelaDraft();
}

/* ---------- formação ---------- */
function copaTelaFormacao() {
  const dados = copaDados();
  COPA = { etapa: 'formacao', timers: [], atalhos: {}, draft: null, camp: null, almanaque: dados.almanaque };
  const nomes = Object.keys(COPA_FORMACOES);
  const conta = f => { const c = {}; COPA_FORMACOES[f].forEach(([p]) => { c[p] = (c[p] || 0) + 1; }); return ['ZAG', 'LAT', 'VOL', 'MEI', 'ATA'].filter(p => c[p]).map(p => `${c[p]} ${p}`).join(' · '); };
  const escolhe = f => { COPA.draft = copaNovoDraft(f, dados.almanaque); COPA.etapa = 'draft'; copaSom('apito'); copaTelaDraft(); };
  nomes.forEach((f, i) => { COPA.atalhos[String(i + 1)] = () => escolhe(f); });
  copaMostra(
    el('h2', {}, '🏆 Copa dos Sonhos — Formação'),
    copaPasso(1, 'Escolha a formação do seu time. Ela define quantas vagas de cada posição você vai preencher.'),
    dados.almanaque ? el('p', { class: 'dica' }, '📖 Modo Almanaque LIGADO: forças escondidas durante o sorteio (prêmios ×1,5).') : null,
    el('div', { class: 'forms' }, ...nomes.map((f, i) => el('button', { class: 'form-card', type: 'button', onclick: () => escolhe(f), title: conta(f) },
      el('span', {}, f), copaCampo(COPA_FORMACOES[f].map(([pos, x, y]) => ({ pos, x, y, p: null })), { mini: true }), el('small', {}, conta(f)), el('small', {}, copaKbd(String(i + 1)))))),
    el('div', { class: 'opcoes' }, el('button', { class: 'btn', onclick: () => abrirCopaSonhos() }, '← Voltar')));
}

/* ---------- draft ---------- */
function copaTelaDraft(novo) {
  const d = COPA.draft; COPA.etapa = 'draft';
  if (copaDraftCompleto(d)) return copaTelaEstilo();
  const alm = d.almanaque; const esc = 11 - copaLivres(d);
  const sel = d.atual && COPA.sel != null ? d.atual.jogadores[COPA.sel] : null;
  if (sel && !copaEscolhivel(d, sel)) COPA.sel = null;
  const selJ = d.atual && COPA.sel != null ? d.atual.jogadores[COPA.sel] : null;

  const colocar = i => {
    if (!d.atual) { copaSom('erro'); return; }
    if (!selJ) { COPA.msg = 'Primeiro escolha um jogador da lista ao lado 👉'; copaSom('erro'); return copaTelaDraft(); }
    if (!copaColocar(d, selJ, i)) { COPA.msg = `${selJ.nome} não pode jogar de ${copaPosNome(d.slots[i].pos)}.`; copaSom('erro'); return copaTelaDraft(); }
    COPA.sel = null; COPA.msg = null; copaSom('moeda');
    if (copaDraftCompleto(d)) { if (typeof banner === 'function') banner('TIME COMPLETO!', 'Agora escolha o estilo de jogo'); copaSom('nivel'); return copaTelaEstilo(i); }
    copaTelaDraft(i);
  };
  const autoColoca = () => { if (!selJ) return; const ss = copaSlotsPara(d, selJ); if (ss.length) colocar(ss[0]); };

  // cabeçalho
  const prog = el('div', { class: 'progresso', style: 'width:120px;display:inline-block;vertical-align:middle;margin:0' }); const pi = el('i'); pi.style.width = (esc / 11 * 100) + '%'; prog.append(pi);
  const topo = el('div', { class: 'topo-draft' },
    el('span', { class: 'pill roxo' }, `Formação ${d.formacao}`),
    el('span', { class: 'pill' }, `Escalados ${esc}/11 `, prog),
    el('span', { class: 'pill', title: 'Pulos de sorteio restantes' }, `Pulos: ${'🔁'.repeat(d.pulos) || '—'} (${d.pulos})`),
    el('span', { class: 'pill' }, `Sorteios: ${d.rolagens}`),
    alm ? el('span', { class: 'pill', style: 'background:#e2d4ff' }, '📖 Almanaque: forças escondidas') : el('span', { class: 'pill' }, `Força média: ${esc ? copaForcaMedia(d.slots) : '—'}`));

  // passo atual
  let passo;
  if (!d.atual) passo = copaPasso(2, esc === 0 ? 'Role o dado para sortear um elenco! 🎲' : `Boa! Faltam ${11 - esc}. Role o dado para sortear o próximo elenco.`);
  else if (!selJ) passo = copaPasso(3, 'Escolha 1 jogador desse elenco (clique no nome).');
  else passo = copaPasso(4, `Agora clique numa posição livre pra ${selJ.nome}: verde = posição certa, amarelo = improvisado (−${Math.round((1 - COPA_IMPROV) * 100)}%).`);

  // campo
  const campo = copaCampo(d.slots, { alvo: selJ, mostraForca: !alm, onSlot: colocar, novo });

  // painel do sorteio
  const painel = el('div', { class: 'painel-sorteio' });
  COPA.atalhos = {};
  if (!d.atual) {
    const rolar = () => copaAnimaRolagem(painel);
    COPA.atalhos[' '] = rolar; COPA.atalhos.d = rolar; COPA.atalhos.Enter = rolar;
    painel.append(el('div', { class: 'dado-zona' },
      el('div', { class: 'dado' }, '🎲'),
      el('button', { class: 'btn amarelo grande', onclick: rolar }, '🎲 Rolar o dado'),
      el('p', { class: 'dica' }, 'Aperte ', copaKbd('Espaço'), ' ou ', copaKbd('D'), ' para rolar.'),
      d.ultimo ? el('button', { class: 'btn mini', onclick: () => { copaDesfazer(d); COPA.sel = null; copaTelaDraft(); } }, `↩ Desfazer (tirar ${d.slots[d.ultimo.idx].p.nome})`) : null));
    if (d.ultimo) COPA.atalhos.u = () => { copaDesfazer(d); COPA.sel = null; copaTelaDraft(); };
  } else {
    const e = d.atual;
    const cab = el('div', { class: 'elenco-cab', style: `background:${e.cor};color:${copaCorTexto(e.cor)}` }, el('span', { class: 'em' }, e.emoji), el('div', {}, el('div', { class: 'tit' }, `${e.time} ${e.ano}`), el('small', {}, e.lore)));
    const jogs = el('div', { class: 'jogs' });
    const ordem = e.jogadores.map((j, i) => ({ j, i })).sort((a, b) => COPA_POS.indexOf(a.j.pos) - COPA_POS.indexOf(b.j.pos));
    ordem.forEach(({ j, i }, n) => {
      const ok = copaEscolhivel(d, j);
      const tecla = n < 9 ? String(n + 1) : n === 9 ? '0' : '';
      const fTxt = alm ? '??' : j.forca;
      const b = el('button', { class: 'jog' + (COPA.sel === i ? ' sel' : ''), type: 'button', disabled: ok ? null : 'disabled',
        title: ok ? `${j.nome} — ${copaPosNome(j.pos)}${alm ? '' : ` — força ${j.forca}`}. Clique duas vezes para escalar direto.` : `Não há posição livre para ${copaPosNome(j.pos)}.` },
        el('span', { class: 'k' }, tecla), el('span', { class: 'pos p-' + j.pos }, j.pos), el('span', { class: 'nm' }, j.nome + (j.lenda && !alm ? ' 👑' : '')),
        el('span', { class: 'f ' + (alm ? 'fq' : copaClasseForca(j.forca)) }, fTxt));
      if (ok) {
        const escolher = () => { COPA.sel = COPA.sel === i ? null : i; COPA.msg = null; copaSom('equip'); copaTelaDraft(); };
        b.onclick = escolher;
        b.ondblclick = () => { COPA.sel = i; const ss = copaSlotsPara(d, j); if (ss.length) colocar(ss[0]); };
        if (tecla) COPA.atalhos[tecla] = escolher;
      }
      jogs.append(b);
    });
    const pular = () => { if (copaPular(d)) { COPA.sel = null; copaSom('apito'); copaAnimaRolagem(painel); } else copaSom('erro'); };
    COPA.atalhos.p = pular;
    if (selJ) COPA.atalhos.Enter = autoColoca;
    painel.append(cab, jogs,
      el('p', { class: 'dica', style: 'color:#b0301a', hidden: COPA.msg ? null : 'hidden' }, COPA.msg || ''),
      el('p', { class: 'dica' }, el('span', { class: 'leg', style: 'background:#4fc26a' }), 'posição certa', el('span', { class: 'leg', style: 'background:#e8c83a' }), 'improvisado', alm ? '' : ' · 👑 = lenda'),
      el('div', { class: 'opcoes' },
        el('button', { class: 'btn verde', disabled: selJ ? null : 'disabled', onclick: autoColoca }, selJ ? `✔ Escalar ${selJ.nome} (melhor vaga)` : '✔ Escalar'),
        el('button', { class: 'btn', disabled: d.pulos > 0 ? null : 'disabled', onclick: pular, title: 'Descarta este elenco e rola de novo' }, `🔁 Pular sorteio (${d.pulos})`)),
      el('p', { class: 'dica' }, 'Teclado: ', copaKbd('1'), '–', copaKbd('0'), ' escolhe · ', copaKbd('Enter'), ' escala · ', copaKbd('P'), ' pula'));
  }
  copaMostra(el('h2', {}, '🏆 Monte seu time dos sonhos'), topo, passo, el('div', { class: 'grade' }, el('div', {}, campo), painel),
    el('div', { class: 'opcoes' }, esc === 0 && !d.atual ? el('button', { class: 'btn mini', onclick: () => copaTelaFormacao() }, '← Trocar formação') : null,
      el('button', { class: 'btn mini', onclick: () => abrirCopaSonhos() }, 'Menu da Copa')));
}
function copaAnimaRolagem(painel) {
  if (COPA.rolando) return;
  const d = COPA.draft; COPA.sel = null; COPA.msg = null;
  const alvo = copaRolar(d); d.atual = null; // só mostra depois da animação
  COPA.atalhos = {};
  const nome = el('div', { class: 'tit', style: 'font-size:20px;font-weight:700;min-height:28px' }, '...');
  painel.innerHTML = '';
  painel.append(el('div', { class: 'dado-zona' }, el('div', { class: 'dado gira' }, '🎲'), el('p', {}, 'Sorteando um elenco...'), nome));
  copaSom('equip');
  let n = 0;
  copaTimer(() => { const e = COPA_ELENCOS[Math.floor(Math.random() * COPA_ELENCOS.length)]; nome.textContent = `${e.emoji} ${e.time} ${e.ano}`; n++; }, 70, true);
  COPA.rolando = true;
  const fim = setTimeout(() => { copaLimpaTimers(); d.atual = alvo; copaSom('moeda'); copaTelaDraft(); }, 850);
  COPA.timers.push(fim);
}

/* ---------- estilo de jogo ---------- */
function copaTelaEstilo(novo) {
  const d = COPA.draft; COPA.etapa = 'estilo';
  if (!COPA.estilo) COPA.estilo = 'equilibrado';
  const tt = k => (typeof TATICAS !== 'undefined' && TATICAS[COPA_ESTILOS[k].tatica]) || { atq: 1, def: 1 };
  const efeito = k => { const t = tt(k); const pa = Math.round((t.atq - 1) * 100), pd = Math.round((t.def - 1) * 100); return pa === 0 && pd === 0 ? 'Ataque e defesa normais' : `Ataque ${pa > 0 ? '+' : ''}${pa}% · Defesa ${pd > 0 ? '+' : ''}${pd}%`; };
  const media = copaForcaMedia(d.slots);
  const escolhe = k => { COPA.estilo = k; copaSom('equip'); copaTelaEstilo(); };
  const comecar = () => { COPA.camp = copaNovaCampanha(d.slots, COPA.estilo, d.almanaque); COPA.etapa = 'copa'; copaSom('apito'); copaTelaCopa(); };
  COPA.atalhos = { '1': () => escolhe('defensivo'), '2': () => escolhe('equilibrado'), '3': () => escolhe('ofensivo'), Enter: comecar };
  const improv = d.slots.filter(s => s.p.pos !== s.pos).length;
  copaMostra(
    el('h2', {}, '🏆 Time completo!'),
    d.almanaque ? copaPasso('📖', `Revelação do Almanaque: a força média do seu time é ${media}! Veja no campo a força de cada um.`) : copaPasso(5, `Seu time tem força média ${media}. Agora escolha o estilo de jogo.`),
    el('div', { class: 'grade' },
      el('div', {}, copaCampo(d.slots, { mostraForca: true, novo })),
      el('div', {},
        el('h3', {}, 'Estilo de jogo'),
        el('div', { class: 'estilos' }, ...Object.entries(COPA_ESTILOS).map(([k, v], i) => el('button', { class: 'est' + (COPA.estilo === k ? ' sel' : ''), type: 'button', onclick: () => escolhe(k) },
          el('span', { class: 'em' }, v.emoji), el('b', {}, v.nome), el('small', {}, v.desc), el('small', { class: 'ef' }, efeito(k)), el('small', {}, copaKbd(String(i + 1)))))),
        improv ? el('p', { class: 'dica', style: 'color:#b0601a' }, `⚠ ${improv} jogador(es) improvisado(s): jogam com ${Math.round(COPA_IMPROV * 100)}% da força.`) : el('p', { class: 'dica', style: 'color:#1a7a1a' }, '✔ Todo mundo na posição certa!'),
        el('p', {}, 'A Copa: 3 jogos no Grupo A (passam os 2 primeiros), depois oitavas, quartas, semifinal e FINAL. No mata-mata, empate vai para os pênaltis.'),
        el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo grande', onclick: comecar }, '🏆 Começar a Copa!')),
        el('p', { class: 'dica' }, copaKbd('1'), copaKbd('2'), copaKbd('3'), ' estilo · ', copaKbd('Enter'), ' começar'))));
}

/* ---------- a Copa ---------- */
function copaCaminho(c, atual, oculta) {
  return el('div', { class: 'caminho' }, ...COPA_FASES.map((f, i) => {
    const j = i === oculta ? null : c.jogos[i]; let cls = ''; let txt = f.curto;
    if (i === oculta) cls = 'agora';
    else if (j) { cls = j.resultado; txt = `${f.curto} ${j.ga}×${j.gb}${j.pen ? 'p' : ''}`; } else if (i === atual && !c.fim) cls = 'agora';
    return el('span', { class: cls, title: f.nome }, txt);
  }));
}
function copaTabelaGrupo(c) {
  const tab = el('table', { class: 'rank-tab' }, el('tr', {}, ...['#', 'Grupo A', 'P', 'J', 'V', 'E', 'D', 'SG', 'GP'].map(h => el('th', {}, h))));
  copaTabela(c).forEach((t, i) => tab.append(el('tr', { class: (t.id === 'nos' ? 'nos ' : '') + (i < 2 ? 'cls' : '') },
    el('td', {}, i + 1), el('td', {}, `${t.emoji} ${t.nome}`), el('td', {}, el('b', {}, t.pts)), el('td', {}, t.j), el('td', {}, t.v), el('td', {}, t.e), el('td', {}, t.d), el('td', {}, t.gp - t.gc), el('td', {}, t.gp))));
  return el('div', {}, tab, el('p', { class: 'dica' }, 'Os 2 primeiros (faixa verde) vão para as oitavas. Desempate: pontos, saldo de gols, gols marcados.'));
}
function copaLadoNos(c) { return el('div', { class: 'lado' }, el('span', { class: 'em' }, '⭐'), el('b', {}, COPA_NOME_TIME), el('small', {}, `Força ${copaForcaMedia(c.slots)} · ${COPA_ESTILOS[c.estilo].emoji} ${COPA_ESTILOS[c.estilo].nome}`)); }
function copaLadoAdv(a) { return el('div', { class: 'lado' }, el('span', { class: 'em' }, a.emoji), el('b', {}, a.nome), el('small', {}, `Força ${a.forca} · ${a.formacao} · ${COPA_ESTILOS[a.estilo].nome}`), a.origem ? el('small', { style: 'display:block' }, a.origem) : null); }
function copaTelaCopa() {
  const c = COPA.camp; COPA.etapa = 'copa';
  if (c.fim) return copaTelaFim();
  const f = COPA_FASES[c.fase]; const adv = copaAdvDaFase(c);
  const jogar = () => copaTelaJogo();
  COPA.atalhos = { Enter: jogar, ' ': jogar };
  const invicto = c.jogos.length > 0 && c.gc === 0 && c.d === 0 && c.e === 0;
  copaMostra(
    el('h2', {}, `🏆 Copa dos Sonhos — ${f.nome}`),
    copaCaminho(c, c.fase),
    f.grupo && c.fase > 0 ? copaTabelaGrupo(c) : null,
    f.grupo && c.fase === 0 ? el('p', {}, `Seu grupo: ${c.grupo.map(t => `${t.emoji} ${t.nome}`).join(', ')}. Passam os 2 primeiros!`) : null,
    invicto ? el('p', { style: 'color:#1a7a1a;text-align:center' }, `🔥 ${c.v} vitória(s) e nenhum gol sofrido! O sonho do 7 a 0 continua vivo!`) : null,
    el('div', { class: 'confronto' }, copaLadoNos(c), el('div', { class: 'tit', style: 'font-size:28px;color:var(--madeira2)' }, 'VS'), copaLadoAdv(adv)),
    !f.grupo ? el('p', { class: 'dica', style: 'text-align:center' }, 'Mata-mata: quem perder está fora. Empate vai para os pênaltis!') : null,
    el('div', { class: 'centro' }, el('button', { class: 'btn amarelo grande', onclick: jogar }, '▶ Jogar partida'), el('button', { class: 'btn', onclick: () => abrirCopaSonhos() }, 'Menu da Copa')),
    el('p', { class: 'dica', style: 'text-align:center' }, copaKbd('Enter'), ' joga a partida'));
}
function copaNarracao(res, c, adv) {
  const L = [];
  const fase = COPA_FASES[res.fase];
  const nosGk = copaGoleiro(c.slots).nome, advGk = copaGoleiro(adv.slots).nome;
  const pick = a => a[Math.floor(Math.random() * a.length)];
  L.push({ min: 0, cls: 'sis', txt: `0' Apita o árbitro! Começa ${fase.grupo ? 'o jogo' : 'a ' + fase.nome.toLowerCase().replace('final', 'decisão')} contra ${adv.nome}.` });
  let gn = 0, ga = 0;
  res.eventos.forEach(e => {
    if (e.nos) {
      gn++;
      L.push({ min: e.min, cls: 'gn', gol: 'nos', txt: pick([
        `${e.min}' GOOOOL! ${e.autor} recebe de ${e.assist} e bate no cantinho!`,
        `${e.min}' GOLAÇO de ${e.autor}! Chute de fora da área, ${advGk} nem viu!`,
        `${e.min}' ${e.autor} dribla dois e toca na saída de ${advGk}. É GOL!`,
        `${e.min}' Cruzamento de ${e.assist}, cabeçada de ${e.autor}... GOOOL!`,
        `${e.min}' Tabelinha de ${e.assist} com ${e.autor}, que manda pra rede!`]) });
    } else {
      ga++;
      L.push({ min: e.min, cls: 'ga', gol: 'adv', txt: pick([
        `${e.min}' Ih... gol do ${adv.nome}. ${e.autor} aproveitou a bobeira da zaga.`,
        `${e.min}' ${e.autor} acerta um chutaço e ${nosGk} não alcança. Gol deles.`,
        `${e.min}' Contra-ataque rápido e ${e.autor} marca para o ${adv.nome}.`]) });
    }
  });
  // lances de efeito (até 2)
  if (res.defesaNossa) L.push({ min: res.defesaNossa.min, cls: 'def', txt: `${res.defesaNossa.min}' ${res.defesaNossa.autor} bate forte... QUE DEFESA de ${nosGk}!` });
  if (res.salvou) L.push({ min: res.salvou.min, cls: 'def', txt: `${res.salvou.min}' ${res.salvou.autor} chuta e ${advGk} espalma pra escanteio!` });
  else if (res.perdeu) L.push({ min: res.perdeu.min, cls: '', txt: `${res.perdeu.min}' ${res.perdeu.autor} tenta de longe... por cima do gol!` });
  L.sort((a, b) => a.min - b.min);
  let fimTxt = `90' Fim de jogo: ${COPA_NOME_TIME} ${res.ga} × ${res.gb} ${adv.nome}.`;
  L.push({ min: 90, cls: 'sis', txt: fimTxt });
  if (res.pen) L.push({ min: 91, cls: res.pen.venceNos ? 'gn' : 'ga', pen: true, txt: `Pênaltis! ${nosGk} x ${advGk}... ${res.pen.venceNos ? `VENCEMOS por ${res.pen.nos} a ${res.pen.adv}!` : `perdemos por ${res.pen.nos} a ${res.pen.adv}...`}` });
  const antes = c.jogos.slice(0, -1);
  const invictoAntes = antes.every(j => j.gb === 0 && j.resultado === 'v');
  if (res.resultado === 'v' && res.gb === 0 && invictoAntes) L.push({ min: 92, cls: 'gn', txt: `Mais um jogo sem levar gol! ${c.v}/7 rumo ao 7 a 0 perfeito! 🏅` });
  else if (res.gb > 0 && antes.every(j => j.gb === 0)) L.push({ min: 92, cls: 'sis', txt: 'Levamos gol... o 7 a 0 perfeito fica pra próxima. Mas a Copa continua!' });
  return L;
}
function copaTelaJogo() {
  const c = COPA.camp; const adv = copaAdvDaFase(c);
  const res = copaJogarProximo(c); if (!res) return copaTelaCopa();
  COPA.ultimoRes = res;
  copaPosJogo(res);  // prêmios e fim de copa já aplicados (fechar a janela não perde nada)
  const linhas = copaNarracao(res, c, adv);
  const gN = el('span', { class: 'g' }, '0'), gA = el('span', { class: 'g' }, '0');
  const placar = el('div', { class: 'placar' }, gN, ' × ', gA);
  const barra = el('i'); barra.style.width = '0%';
  const relogio = el('div', { class: 'relogio' }, el('span', {}, "0'"), el('div', { class: 'barra-t' }, barra));
  const narr = el('div', { class: 'narr' });
  const fimBox = el('div');
  const ctl = el('div', { class: 'centro' });
  let min = 0, k = 0, n = 0, a = 0, acabou = false;
  const mostraLinha = ln => {
    narr.append(el('div', { class: ln.cls }, ln.txt));
    if (ln.gol === 'nos') { n++; gN.textContent = n; gN.classList.remove('pop'); void gN.offsetWidth; gN.classList.add('pop'); copaSom('gol'); }
    if (ln.gol === 'adv') { a++; gA.textContent = a; gA.classList.remove('pop'); void gA.offsetWidth; gA.classList.add('pop'); copaSom('erro'); }
  };
  const termina = () => {
    if (acabou) return; acabou = true; copaLimpaTimers();
    while (k < linhas.length) mostraLinha(linhas[k++]);
    relogio.firstChild.textContent = res.pen ? 'Fim (pênaltis)' : "90' Fim"; barra.style.width = '100%';
    caminho.replaceWith(copaCaminho(c, c.fase));
    copaSom(res.resultado === 'v' ? 'nivel' : 'apito');
    const txt = res.resultado === 'v' ? (res.pen ? 'VITÓRIA NOS PÊNALTIS!' : 'VITÓRIA!') : res.resultado === 'e' ? 'EMPATE' : (res.pen ? 'Derrota nos pênaltis...' : 'DERROTA...');
    fimBox.append(el('div', { class: 'resultado ' + res.resultado }, txt));
    if (res.outro) fimBox.append(el('p', { class: 'dica', style: 'text-align:center' }, `Outro jogo do grupo: ${res.outro.a} ${res.outro.ga} × ${res.outro.gb} ${res.outro.b}`));
    if (res.premio) fimBox.append(el('p', { class: 'dica', style: 'text-align:center;color:#1a7a1a' }, `+${fmt(res.premio.xp)} XP · +${fmt(res.premio.ouro)} tostões`));
    if (COPA_FASES[res.fase].grupo && res.fase === 2) fimBox.append(copaTabelaGrupo(c), el('p', { style: 'text-align:center' }, res.classificou ? `Classificados em ${c.posGrupo}º lugar! Rumo às oitavas! 🎉` : `Terminamos em ${c.posGrupo}º lugar... fomos eliminados no grupo. 😢`));
    else if (COPA_FASES[res.fase].grupo) fimBox.append(copaTabelaGrupo(c));
    const cont = () => (c.fim ? copaTelaFim() : copaTelaCopa());
    ctl.innerHTML = ''; ctl.append(el('button', { class: 'btn amarelo grande', onclick: cont }, c.fim ? '🏁 Ver resultado da Copa' : 'Continuar ➜'));
    COPA.atalhos = { Enter: cont, ' ': cont };
  };
  ctl.append(el('button', { class: 'btn', onclick: termina }, '⏩ Pular animação'));
  const caminho = copaCaminho(c, res.fase, res.fase); // sem spoiler do placar durante a animação
  COPA.atalhos = { s: termina, Enter: termina, ' ': termina };
  copaMostra(
    el('h2', {}, `🏆 ${COPA_FASES[res.fase].nome}`),
    caminho,
    el('div', { class: 'confronto' }, copaLadoNos(c), el('div', {}, placar, relogio), copaLadoAdv(adv)),
    narr, fimBox, ctl);
  COPA.atalhos = { s: termina, Enter: termina, ' ': termina };
  copaSom('apito');
  copaTimer(() => {
    if (acabou) return;
    min += 1; relogio.firstChild.textContent = `${Math.min(min, 90)}'`; barra.style.width = Math.min(100, min / 90 * 100) + '%';
    while (k < linhas.length && linhas[k].min <= min) mostraLinha(linhas[k++]);
    if (min >= 92) termina();
  }, 50, true);
}
// aplica prêmios por vitória e, se a Copa acabou, o fechamento (estatísticas, missões, bônus)
function copaPosJogo(res) {
  const c = COPA.camp; const pb = copaPremioBase(); const mult = c.almanaque ? 1.5 : 1;
  if (res.resultado === 'v') {
    const xp = Math.round(pb.xp * mult), ouro = Math.round(pb.ouro * mult);
    res.premio = { xp, ouro }; c.premio.xp += xp; c.premio.ouro += ouro;
    G.save.ouro += ouro; ganhaXp(xp);
  }
  if (c.fim && !c.processado) copaFechaCopa();
  salvar();
}
function copaFechaCopa() {
  const c = COPA.camp; const dados = copaDados(); const pb = copaPremioBase(); const mult = c.almanaque ? 1.5 : 1;
  c.processado = true;
  dados.jogadas++;
  const nomes = c.slots.map(s => s.p.nome);
  const m = dados.melhor;
  if (c.v > m.vitorias || (c.v === m.vitorias && c.v > 0 && c.gc < m.golsSofridos)) { dados.melhor = { vitorias: c.v, golsSofridos: c.gc, time: nomes }; c.recorde = true; }
  const conta = t => { try { if (typeof contaEvento === 'function') contaEvento(t); } catch (e) { /* ignora */ } };
  conta('copa');
  if (c.campeao) {
    dados.titulos++;
    const xp = Math.round(pb.xp * 4 * mult), ouro = Math.round(pb.ouro * 6 * mult);
    c.premio.xp += xp; c.premio.ouro += ouro; G.save.ouro += ouro; ganhaXp(xp);
    conta('copaTitulo');
    if (c.perfeito) {
      dados.perfeitos++;
      const xp2 = Math.round(pb.xp * 6 * mult), ouro2 = Math.round(pb.ouro * 10 * mult), pac = c.almanaque ? 2 : 1;
      c.premio.xp += xp2; c.premio.ouro += ouro2; G.save.ouro += ouro2; ganhaXp(xp2);
      if (typeof addItem === 'function' && addItem('pacotinho', pac)) c.premio.itens.push(`${pac}x Pacotinho de Figurinhas`);
      conta('copa7a0');
      G.save.flags = G.save.flags || {}; G.save.flags.copa7a0 = true;
      if (typeof log === 'function') log('7 A 0 PERFEITO na Copa dos Sonhos! 7 vitórias sem sofrer nenhum gol!', 'l-lvl');
      if (typeof banner === 'function') banner('7 A 0 PERFEITO!', 'Copa dos Sonhos');
    } else {
      if (typeof log === 'function') log(`CAMPEÃO da Copa dos Sonhos! ${c.v}V ${c.e}E ${c.d}D, ${c.gp} gols pró e ${c.gc} contra.`, 'l-lvl');
      if (typeof banner === 'function') banner('CAMPEÃO!', 'Copa dos Sonhos');
    }
  } else if (typeof log === 'function') {
    log(`Copa dos Sonhos: eliminado na fase "${COPA_FASES[c.eliminadoEm].nome}". Campeão: ${c.campeaoNome}.`, 'l-info');
  }
  if (typeof log === 'function' && c.premio.xp) log(`Copa dos Sonhos: +${fmt(c.premio.xp)} XP e +${fmt(c.premio.ouro)} tostões no total.`, 'l-xp');
  salvar();
}
function copaTelaFim() {
  const c = COPA.camp; COPA.etapa = 'fim';
  if (!c.processado) copaFechaCopa();
  const jogar = () => copaTelaFormacao();
  COPA.atalhos = { Enter: jogar, j: jogar, m: () => abrirCopaSonhos() };
  const fase = COPA_FASES[c.eliminadoEm != null ? c.eliminadoEm : 6];
  let titulo, trofeu;
  if (c.perfeito) { titulo = 'CAMPEÃO INVICTO SEM LEVAR GOL!'; trofeu = '🏆'; }
  else if (c.campeao) { titulo = 'CAMPEÃO DA COPA DOS SONHOS!'; trofeu = '🏆'; }
  else if (c.eliminadoEm <= 2) { titulo = 'Eliminado na fase de grupos'; trofeu = '😢'; }
  else { titulo = `Eliminado ${fase.id === 'fin' ? 'na FINAL (vice-campeão!)' : fase.id === 'sem' ? 'na semifinal' : fase.id === 'qua' ? 'nas quartas de final' : 'nas oitavas de final'}`; trofeu = fase.id === 'fin' ? '🥈' : '💪'; }
  const tab = el('table', { class: 'caminho-tab' });
  c.jogos.forEach(j => tab.append(el('tr', {}, el('td', {}, COPA_FASES[j.fase].nome.replace('Fase de grupos — ', 'Grupo · ')), el('td', {}, `${j.advEmoji} ${j.advNome}`),
    el('td', {}, `${j.ga} × ${j.gb}${j.pen ? ` (pên. ${j.pen.nos}×${j.pen.adv})` : ''}`), el('td', { class: 'r ' + j.resultado }, j.resultado.toUpperCase()))));
  const dica = c.perfeito ? 'Você entrou para a história! Poucos conseguem isso.'
    : c.campeao ? `Faltou pouco para o 7 a 0 perfeito${c.gc ? ` (sofreu ${c.gc} gol${c.gc > 1 ? 's' : ''})` : ''}. Tente o estilo Defensivo e um goleiraço!`
      : 'Dica: craques na posição certa valem mais que improvisados. E use bem os pulos de sorteio!';
  copaMostra(
    el('h2', {}, '🏆 Copa dos Sonhos — Resultado'),
    el('div', { class: 'fim-card' },
      el('div', { class: 'trofeu' }, trofeu),
      el('div', { class: 'tit', style: 'font-size:24px;font-weight:700;color:var(--madeira2)' }, titulo),
      c.perfeito ? el('div', { class: 'selo7' }, '🏅 7 a 0 PERFEITO! 🏅') : null,
      !c.campeao ? el('p', {}, `Campeão da Copa: ${c.campeaoNome}.`) : null,
      c.recorde ? el('p', { style: 'color:#7a2ab0' }, '⭐ Nova melhor campanha!') : null,
      el('div', { class: 'recorde' },
        el('span', { class: 'pill' }, `${c.v}V · ${c.e}E · ${c.d}D`),
        el('span', { class: 'pill' }, `Gols pró: ${c.gp}`),
        el('span', { class: 'pill' }, `Gols contra: ${c.gc}`),
        el('span', { class: 'pill' }, `Força do time: ${copaForcaMedia(c.slots)}`),
        c.almanaque ? el('span', { class: 'pill', style: 'background:#e2d4ff' }, '📖 Almanaque ×1,5') : null),
      el('p', { style: 'color:#1a7a1a' }, `Prêmios: +${fmt(c.premio.xp)} XP · +${fmt(c.premio.ouro)} tostões${c.premio.itens.length ? ' · ' + c.premio.itens.join(', ') : ''}`),
      el('p', { class: 'dica' }, dica)),
    el('div', { class: 'grade', style: 'margin-top:10px' }, el('div', {}, copaCampo(c.slots, { mostraForca: true })), el('div', {}, el('h3', {}, 'Campanha'), tab)),
    el('div', { class: 'centro' }, el('button', { class: 'btn amarelo grande', onclick: jogar }, '🔄 Jogar de novo'), el('button', { class: 'btn', onclick: () => abrirCopaSonhos() }, 'Menu da Copa')),
    el('p', { class: 'dica', style: 'text-align:center' }, copaKbd('Enter'), ' jogar de novo · ', copaKbd('M'), ' menu'));
}

/* ============================================================
   INTEGRAÇÃO COM O RPG
   ============================================================ */
const NPC_COPA = {
  nome: 'Ademir do Almanaque',
  look: { tipo: 'humano', corpo: 'm', pele: 'pele-negra', cabelo: 'cabelo-curto', corCabelo: 'grisalho', roupa: 'roupa-xadrez', baixo: 'baixo-jeans', rosto: 'rosto-redondos', mao: 'mao-livro' },
  ola: 'Opa, craque! Eu sei a escalação de TODOS os times dessa região desde 1950. Quer montar um time dos sonhos com as lendas do Campinho, da Praia e do Estádio? Role o dado e vamos ver se você conquista a Copa... quem sabe até um 7 a 0 perfeito!',
  copa: true,
};
const MISSOES_COPA = [
  { id: 'q_copa1', npc: 'almanaque', titulo: 'Sonhar não custa nada', lvl: 3,
    texto: 'Já ouviu falar da Copa dos Sonhos? Você monta um time com craques de todas as épocas, um sorteio de cada vez. Dispute uma Copa inteira, do primeiro jogo até o fim, e me conte como foi!',
    req: { copa: 1, desc: 'Complete 1 Copa dos Sonhos (até a eliminação ou o título)' },
    rec: { xp: 150, ouro: 40, itens: [['pacotinho', 1]] },
    fim: 'Viu só? Escolher o time é metade do jogo! Toma um pacotinho pra começar sua coleção de lendas.' },
  { id: 'q_copa2', npc: 'almanaque', titulo: 'Levanta essa taça!', lvl: 6,
    texto: 'Participar é bom, mas levantar a taça é MUITO melhor. Seja campeão da Copa dos Sonhos: passe do grupo e ganhe oitavas, quartas, semi e final!',
    req: { copaTitulo: 1, desc: 'Seja campeão da Copa dos Sonhos' },
    rec: { xp: 500, ouro: 150, itens: [['pacotinho', 2]] },
    fim: 'CAMPEÃO! Vou anotar seu nome aqui no meu almanaque, do lado do Dadá e do Zé Moleque!' },
  { id: 'q_copa3', npc: 'almanaque', titulo: 'O 7 a 0 perfeito', lvl: 10,
    texto: 'Agora o desafio dos desafios: ganhar os 7 jogos da Copa SEM SOFRER NENHUM GOL. Só os maiores times da história conseguiram. Dica de quem sabe: goleiro bom e zaga forte!',
    req: { copa7a0: 1, desc: 'Vença os 7 jogos da Copa dos Sonhos sem sofrer gol' },
    rec: { xp: 2000, ouro: 500, itens: [['pacotinho', 3]] },
    fim: 'Eu nunca tinha visto isso nesses 50 anos de almanaque! 7 a 0 PERFEITO! Você é lenda, craque!' },
];
