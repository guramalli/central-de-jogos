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
const COPA_POS_NOME = { GOL: 'Goalkeeper', ZAG: 'Center Back', LAT: 'Fullback', VOL: 'Defensive Mid', MEI: 'Midfielder', ATA: 'Striker' };
// quem pode jogar improvisado em cada posição (goleiro só no gol, e no gol só goleiro)
const COPA_COMPAT = { GOL: [], ZAG: ['VOL', 'LAT'], LAT: ['ZAG', 'VOL', 'MEI'], VOL: ['ZAG', 'MEI', 'LAT'], MEI: ['VOL', 'ATA', 'LAT'], ATA: ['MEI'] };
const COPA_IMPROV = 0.9;     // improvisado joga com 90% da força
const COPA_PULOS = 3;        // pulos de sorteio por Copa
const COPA_NOME_TIME = 'Dream Team';
const COPA_LENDAS = ['Pelê', 'Garrinxa', 'Didy', 'Zicu', 'Sócratis', 'Romáriu', 'Ronaldu', 'Ronaldinhu Gaúxo', 'Rivalldo', 'Martta', 'Neimar', 'Maradonna', 'Messy', 'Zidanne', 'Van Bastenn']; // levam a coroa 👑

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
  defensivo: { nome: 'Defensive', emoji: '🛡️', tatica: 'defensiva', desc: 'Park the bus! Close up the back and wait for the opponent\'s mistakes. Great for not conceding goals.' },
  equilibrado: { nome: 'Balanced', emoji: '⚖️', tatica: 'equilibrada', desc: 'Right in the middle. The team attacks and defends in equal measure.' },
  ofensivo: { nome: 'Attacking', emoji: '⚔️', tatica: 'ofensiva', desc: 'Go get \'em! More goals for you... but the defense is more open.' },
};
const COPA_FASES = [
  { id: 'g1', nome: 'Group stage — round 1', curto: 'G1', grupo: true },
  { id: 'g2', nome: 'Group stage — round 2', curto: 'G2', grupo: true },
  { id: 'g3', nome: 'Group stage — round 3', curto: 'G3', grupo: true },
  { id: 'oit', nome: 'Round of 16', curto: 'OIT', faixa: [80, 84] },
  { id: 'qua', nome: 'Quarterfinals', curto: 'QUA', faixa: [84, 87] },
  { id: 'sem', nome: 'Semifinal', curto: 'SEMI', faixa: [86, 89] },
  { id: 'fin', nome: 'FINAL', curto: 'FINAL', faixa: [88, 92] },
];
// atributos a partir da força: base = 99·(força/99)^CURVA (a curva deixa a diferença
// entre um craque 95 e um jogador 75 bem clara no motor), vezes o peso de cada posição [atq, def, pas, fis]
const COPA_CURVA = 6;
const COPA_MULT = { GOL: [0.3, 1, 0.7, 0.95], ZAG: [0.55, 1, 0.75, 0.97], LAT: [0.85, 0.9, 0.88, 0.97], VOL: [0.72, 0.95, 0.95, 0.95], MEI: [0.92, 0.6, 1, 0.9], ATA: [1, 0.5, 0.88, 0.96] };

/* ---------------- elencos históricos ----------------
   Times e jogadores de verdade, com uma letra trocada no nome (Pelê, Zicu, Flamengu...).
   lista: "POS Nome força" separados por vírgula                */
const COPA_ELENCOS_BRUTO = [
  { id: 'sel58', time: 'Brazil National Team', ano: 1958, emoji: '🇧🇷', cor: '#f8d838', lore: 'The first star: a 17-year-old boy named Pelê and Garrinxa’s bent legs.',
    lista: 'GOL Gilmarr 86, GOL Castilhu 70, ZAG Bellinni 82, ZAG Orlandu 78, ZAG Mauru 74, LAT Djalma Santus 85, LAT Nilton Santus 89, VOL Zitu 82, VOL Dinu Sani 72, MEI Didy 91, MEI Zagalu 81, MEI Moacyrr 68, ATA Pelê 97, ATA Garrinxa 96, ATA Vavâ 87, ATA Mazzolla 78' },
  { id: 'sel70', time: 'Brazil National Team', ano: 1970, emoji: '🇧🇷', cor: '#f8d838', lore: 'The most beautiful team of all time. Three-time champions in Mexico, with a goal for the ages by Carlus Alberto.',
    lista: 'GOL Félis 78, GOL Adu 62, ZAG Britu 80, ZAG Piaza 80, ZAG Baldochi 66, LAT Carlus Alberto 90, LAT Everaldu 77, VOL Clodoaldu 84, VOL Fontanna 64, MEI Gérsun 91, MEI Rivellinu 92, MEI Paulu Cézar 76, ATA Pelê 99, ATA Jairzinhu 93, ATA Tostãu 91, ATA Dariu 70' },
  { id: 'sel82', time: 'Brazil National Team', ano: 1982, emoji: '🇧🇷', cor: '#f8d838', lore: 'They didn’t lift the trophy, but they amazed the world: Zicu, Sócratis and Falcãu in the same midfield.',
    lista: 'GOL Valdir Peres 72, GOL Carlus 68, ZAG Oscarr 82, ZAG Luizinhu 80, ZAG Edinhu 68, LAT Leandru 85, LAT Júniur 88, VOL Cerezu 84, VOL Batistta 70, MEI Sócratis 93, MEI Zicu 96, MEI Falcãu 92, MEI Paulu Isidoro 76, ATA Édder 86, ATA Serginhu 74, ATA Careka 84' },
  { id: 'sel94', time: 'Brazil National Team', ano: 1994, emoji: '🇧🇷', cor: '#f8d838', lore: 'The fourth title, on penalties! Romáriu and Bebetu rocking the baby in their celebration.',
    lista: 'GOL Taffarell 88, GOL Zetty 78, ZAG Aldayr 84, ZAG Márciu Santos 80, ZAG Ricardu Rocha 74, LAT Jorginhu 86, LAT Brancu 80, LAT Leonardu 78, VOL Dunca 85, VOL Mauru Silva 84, MEI Zinhu 78, MEI Raý 82, MEI Mazinhu 80, ATA Romáriu 97, ATA Bebetu 91, ATA Müler 78, ATA Violla 72' },
  { id: 'sel02', time: 'Brazil National Team', ano: 2002, emoji: '🇧🇷', cor: '#f8d838', lore: 'The fifth title! The three R’s — Ronaldu, Rivalldo and Ronaldinhu — and the most famous haircut of the World Cup.',
    lista: 'GOL Marcus 86, GOL Dyda 80, ZAG Lúciu 88, ZAG Edmilsun 82, ZAG Roque Júniur 80, LAT Kafu 90, LAT Roberto Carlus 92, VOL Gilbertu Silva 85, VOL Klébersun 80, MEI Ronaldinhu Gaúxo 95, MEI Rivalldo 96, MEI Juninhu Paulista 82, MEI Caká 80, ATA Ronaldu 98, ATA Edilsun 76, ATA Luisão 78' },
  { id: 'fem07', time: 'Brazil Women’s National Team', ano: 2007, emoji: '🇧🇷', cor: '#3aa04a', lore: 'Martta, the Queen, and the tireless Formigga: World Cup runners-up and Pan American Games gold.',
    lista: 'GOL Andréa 80, GOL Bárbarra 72, ZAG Aline Pelegrinu 84, ZAG Renatta Costa 80, ZAG Tânia Maranhãu 82, LAT Elayne 80, LAT Rosanna 82, VOL Formigga 90, VOL Esther 80, MEI Daniella Alves 84, MEI Martta 99, MEI Graziele 78, ATA Cristiany 92, ATA Pretinnha 80, ATA Kátya 78' },
  { id: 'santos62', time: 'Santus', ano: 1962, emoji: '⚪', cor: '#f0f0f0', lore: 'The Santus of Pelê and Coutinhu: two-time world champions, touring the whole planet.',
    lista: 'GOL Gilmarr 86, GOL Lalâ 60, ZAG Mauru 82, ZAG Calvetu 76, ZAG Haroldu 70, LAT Limma 80, LAT Dalmu 78, VOL Zitu 84, VOL Mengálviu 82, MEI Tité 72, ATA Pelê 99, ATA Coutinhu 90, ATA Pepê 88, ATA Dorvau 80' },
  { id: 'bota62', time: 'Botafogu', ano: 1962, emoji: '⭐', cor: '#202020', lore: 'Garrinxa, Didy, Nilton Santus, Zagalu and Amarildu: half the national team in black and white.',
    lista: 'GOL Mangga 82, GOL Ernany 60, ZAG Zé Marria 76, ZAG Airtun 74, ZAG Rildu 76, LAT Paulistinhu 72, LAT Nilton Santus 90, VOL Pampolinni 70, MEI Didy 92, MEI Zagalu 84, ATA Garrinxa 98, ATA Quarentinhu 86, ATA Amarildu 88' },
  { id: 'fla81', time: 'Flamengu', ano: 1981, emoji: '🔴', cor: '#c8102e', lore: 'World champions in Tokyo: Galinho Zicu leading the greatest red-and-black generation.',
    lista: 'GOL Raull 84, GOL Cantarelly 70, ZAG Marinhu 80, ZAG Mozerr 84, ZAG Figueiredu 70, LAT Leandru 88, LAT Júniur 90, VOL Andradi 86, VOL Adíliu 87, MEI Zicu 98, MEI Licu 82, MEI Vitorr 66, ATA Nunis 88, ATA Titta 84, ATA Baltazarr 76' },
  { id: 'spfc92', time: 'São Paulu', ano: 1992, emoji: '🔺', cor: '#d42a2a', lore: 'Telê’s Tricolor: Raý, Kafu and Müler conquering the world against Barçelona.',
    lista: 'GOL Zetty 86, GOL Rogériu Ceni 70, ZAG Adilsun 80, ZAG Ronaldãu 82, ZAG Ivann 74, LAT Kafu 88, LAT Ronaldu Luís 78, VOL Pintadu 80, VOL Toninhu Cerezu 86, MEI Raý 93, MEI Palhinnha 88, ATA Müler 90, ATA Macedu 80, ATA Elivéltun 78' },
  { id: 'palm99', time: 'Palmeiraz', ano: 1999, emoji: '🟢', cor: '#0a6a3a', lore: 'The Libertadores of Saint Marcus, who could stop penalties even with his eyes closed.',
    lista: 'GOL Marcus 90, GOL Sérgiu 70, ZAG Júniur Baiano 82, ZAG Roqui Júnior 84, ZAG Cléberr 74, LAT Arçe 86, LAT Júniur 80, VOL César Sampaiu 84, VOL Galeanu 78, MEI Alexx 90, MEI Zinhu 84, MEI Rogériu 76, ATA Paulu Nunes 86, ATA Osséas 80, ATA Evairr 84' },
  { id: 'gremio83', time: 'Grêmiu', ano: 1983, emoji: '🔵', cor: '#1a7ad0', lore: 'Renatu Gaúcho scored twice against Hamburg and Grêmiu became world champions.',
    lista: 'GOL Mazarópy 82, GOL Remy 60, ZAG Baideck 78, ZAG Hugu De León 88, ZAG Newmar 70, LAT Paulu Roberto 80, LAT Casemiru 78, VOL Xina 80, VOL Osvaldu 80, MEI Mário Sérgiu 84, MEI Paulu César Caju 82, ATA Renatu Gaúcho 94, ATA Tarcisu 84, ATA Caiu 80' },
  { id: 'inter06', time: 'Internacionau', ano: 2006, emoji: '🔴', cor: '#d42a2a', lore: 'Colorado knocked out Ronaldinhu’s Barçelona with a goal by Adrianu Gabiru.',
    lista: 'GOL Clemerr 84, GOL Renann 70, ZAG Índiu 84, ZAG Fabianu Eller 80, ZAG Bolívarr 78, LAT Ciará 80, LAT Rubens Cardosu 76, VOL Edinhu 82, VOL Wellingtun Monteiro 80, MEI Tingga 86, MEI Iarlei 86, ATA Fernandãu 92, ATA Alexandri Pato 88, ATA Adrianu Gabiru 82' },
  { id: 'cor12', time: 'Corintians', ano: 2012, emoji: '⚫', cor: '#1a1a1a', lore: 'An unbeaten Libertadores and the Club World Cup in Japan, with a goal by Guerreru and saves by Cássiu.',
    lista: 'GOL Cássiu 90, GOL Júliu César 70, ZAG Chiccão 84, ZAG Paulu André 84, ZAG Felipi 70, LAT Alessandru 80, LAT Fábiu Santos 80, VOL Ralph 86, VOL Paulinhu 90, MEI Danilu 86, MEI Douglaz 80, ATA Emersun Sheik 90, ATA Guerreru 90, ATA Jorgi Henrique 82, ATA Romarinhu 80' },
  { id: 'cruz76', time: 'Cruzeiru', ano: 1976, emoji: '🦊', cor: '#1a3ab9', lore: 'Raposa’s first Libertadores, with Nelinhu’s rocket shot and Palinha’s goals.',
    lista: 'GOL Raull 86, GOL Gilbertu 60, ZAG Moraez 80, ZAG Ozirez 72, ZAG Piaza 84, LAT Nelinhu 88, LAT Vanderley 76, VOL Zé Carlus 82, VOL Eduardu 78, MEI Palinha 90, MEI Dirceu Lopis 88, ATA Joãozinhu 90, ATA Jairzinhu 88' },
  { id: 'vasco98', time: 'Vascu', ano: 1998, emoji: '✠', cor: '#1a1a1a', lore: 'In the club’s 100th year, the Libertadores came with Juninhu Pernambucanu’s perfect free kick.',
    lista: 'GOL Carlus Germano 84, GOL Márciu 60, ZAG Odvann 82, ZAG Mauru Galvão 84, ZAG Alex Pinhu 72, LAT Felipi 84, LAT Válberr 74, VOL Luisinhu 80, VOL Nasah 78, MEI Juninhu Pernambucanu 92, MEI Ramõn 84, MEI Pedrinhu 80, ATA Luisãu 88, ATA Donizety 84, ATA Edmundu 90' },
  { id: 'galo13', time: 'Atlétiku Mineiro', ano: 2013, emoji: '🐓', cor: '#2a2a2a', lore: 'I believe! Victorr’s foot stopped the penalty and Galo conquered the continent.',
    lista: 'GOL Victorr 90, GOL Giovanny 60, ZAG Rever 86, ZAG Leonardu Silva 82, ZAG Gilbertu Silva 80, LAT Marcus Rocha 80, LAT Richarlisson 76, VOL Pierri 84, VOL Josuê 80, MEI Ronaldinhu Gaúxo 94, MEI Diegu Tardelli 88, ATA Bernardu 86, ATA Jó 88, ATA Luann 80' },
  { id: 'santos11', time: 'Santus', ano: 2011, emoji: '⚪', cor: '#f0f0f0', lore: 'The Meninos da Vila: Neimar, Ganssu and the third Libertadores.',
    lista: 'GOL Rafaell 84, GOL Vladimirr 60, ZAG Edu Dracenna 82, ZAG Durvall 80, ZAG Brunu Rodrigo 74, LAT Parah 76, LAT Leô 80, VOL Arouka 86, VOL Adrianu 76, MEI Ganssu 90, MEI Elanu 84, MEI Alann Patrick 78, ATA Neimar 96, ATA Zé Lovu 82, ATA Borgis 84' },
  { id: 'flu23', time: 'Fluminensi', ano: 2023, emoji: '🟩', cor: '#7a1a3a', lore: '"Dinizismo" at the Maracanã: Canu scored in the final and Flu won their first Libertadores.',
    lista: 'GOL Fábiu 86, GOL Pedru Rangel 60, ZAG Ninu 84, ZAG Felipi Melo 84, ZAG Manoell 78, LAT Samuel Xavierr 80, LAT Marcelu 92, VOL Andrê 88, VOL Martinelly 82, MEI Ganssu 88, MEI Limma 80, MEI Kenu 82, ATA Germán Canu 92, ATA Jhon Aryas 88, ATA John Kennedi 82' },
  { id: 'barca11', time: 'Barçelona', ano: 2011, emoji: '🔵', cor: '#a50044', lore: 'The tiki-taka of Xavy and Iniestta with Messy at his peak: maybe the best club team in history.',
    lista: 'GOL Valdéz 84, GOL Pintu 70, ZAG Piquê 88, ZAG Puyoll 88, ZAG Mascheranu 84, LAT Daniel Alvez 90, LAT Abidall 82, VOL Busquetz 90, VOL Keïta 80, MEI Xavy 95, MEI Iniestta 96, MEI Thiagu 80, ATA Messy 99, ATA Davit Villa 90, ATA Pedru 86' },
  { id: 'real02', time: 'Reau Madrid', ano: 2002, emoji: '👑', cor: '#f4f0ff', lore: 'The Galácticos: Zidanne, Figu, Raúll and Roberto Carlus on the same team.',
    lista: 'GOL Casilhas 88, GOL Césarr 70, ZAG Hierru 88, ZAG Helguerra 82, ZAG Pavõn 74, LAT Míchel Salgadu 84, LAT Roberto Carlus 92, VOL Makelelê 90, VOL Flávio Conseição 78, MEI Zidanne 98, MEI Figu 94, MEI Solarri 80, ATA Raúll 92, ATA Morientis 86, ATA Ronaldu 97' },
  { id: 'milan89', time: 'Millan', ano: 1989, emoji: '🔴', cor: '#c8102e', lore: 'The Dutch trio Gullitt, Van Bastenn and Rijkardd, with Baresy and Maldinni at the back.',
    lista: 'GOL Gallí 84, GOL Pazzaglli 70, ZAG Baresy 95, ZAG Maldinni 94, ZAG Costacurtta 88, LAT Tassottí 84, LAT Filippu Galli 78, VOL Rijkardd 92, VOL Ancelotty 86, MEI Donadonni 86, MEI Evaní 80, ATA Van Bastenn 97, ATA Gullitt 96, ATA Massarro 80' },
  { id: 'arg86', time: 'Argentyna', ano: 1986, emoji: '🩵', cor: '#6ab8e8', lore: 'Maradonna’s World Cup: the most beautiful goal of all time, dribbling past half the other team.',
    lista: 'GOL Pumpidu 80, GOL Islaz 60, ZAG Ruggerri 86, ZAG Browm 80, ZAG Cuciuffo 76, LAT Olarticoexea 76, LAT Clausem 72, VOL Giustti 80, VOL Batistta 82, MEI Maradonna 99, MEI Burruchagga 88, MEI Enrrique 80, ATA Valdanu 90, ATA Pascully 74, ATA Borgui 72' },
];
const COPA_ELENCOS = COPA_ELENCOS_BRUTO.map(e => ({
  id: e.id, time: e.time, ano: e.ano, emoji: e.emoji, cor: e.cor, lore: e.lore,
  jogadores: e.lista.split(',').map(s => {
    const p = s.trim().split(/\s+/); const pos = p.shift(); const forca = +p.pop(); const nome = p.join(' ');
    return { nome, pos, forca, lenda: COPA_LENDAS.includes(nome) };
  }),
}));

// times dos sonhos da IA
// v407 (Raio-X U3): apelido 'Cabeção' virou 'Cometa' (não caçoar da aparência)
const COPA_NOMES_IA = ['Zeca', 'Tonho', 'Luan', 'Biel', 'Caio', 'Davi', 'Rafa', 'Gui', 'Nando', 'Tuca', 'Neném', 'Pipoca', 'Foguinho', 'Carlinhos', 'Jajá', 'Lelê', 'Nina', 'Bia', 'Duda', 'Mari', 'Juju', 'Lari', 'Tati', 'Gabi', 'Téo', 'Kadu', 'Vini', 'Leco', 'Dedé', 'Fumaça', 'Tatu', 'Paçoca', 'Magrão', 'Baixinho', 'Alemão', 'Comet', 'Formiga', 'Bolinha', 'Russo', 'Ceará', 'Paraíba', 'Tchê', 'Mineiro', 'Canela', 'Faísca', 'Sabiá', 'Tiziu', 'Bambu', 'Jacaré', 'Xodó', 'Pingo', 'Taco', 'Toquinho', 'Marreco', 'Cacau', 'Lulu', 'Maju', 'Tetê', 'Kiki', 'Dandara', 'Pitoco', 'Chumbinho', 'Trovão', 'Parafuso', 'Batata', 'Quiabo', 'Pimpão', 'Bochecha', 'Tampinha', 'Vavá'];
const COPA_TIMES_PRE = ['Squad', 'Galácticos', 'Dynasty', 'Legends', 'Machine', 'Lightning Bolts', 'Titans', 'Beasts', 'Wizards', 'Warriors', 'Hurricanes', 'Stars', 'Sharks', 'Dragons', 'Lions', 'Jaguars'];
const COPA_TIMES_SUF = ['of the Cashew Grove', 'of the Gale', 'of the Thunder', 'of the Backlands', 'of the Mountains', 'of the Coast', 'of the Hill', 'of the Wetlands', 'of the Drizzle', 'of the Mangroves', 'of the Dust Bowl', 'of the Lagoon', 'of the Dovecote', 'of the Coconut Grove', 'of the Slope', 'of the Savanna', 'of the Plateau', 'of Green Valley', 'of Smooth Rock', 'of Dry River', 'of White Sands', 'of the Rising Sun'];
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
  while (out.length < n) out.push({ nome: `Mystery Team ${out.length + 1}`, emoji: '❔', cor: '#555' });
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
function copaGoleiro(slots) { const g = slots.find(s => s.pos === 'GOL' && s.p); return g ? { nome: g.p.nome, forca: copaForcaEfetiva(g.p, 'GOL') } : { nome: 'the goalkeeper', forca: 40 }; }
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
  ['B', 'D', 'F', 'H'].forEach((L, i) => { grupos[L].push(mata[i]); mata[i].origem = `${i % 2 ? '1º' : '2º'} in Group ${L}`; });
  'BCDEFGH'.split('').forEach(L => { while (grupos[L].length < 4) grupos[L].push(outros[o++]); });
  grupo.forEach(t => { t.origem = 'Group A'; });
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
// prêmios (XP, tostões, pacotinho) só nas primeiras Copas do dia; depois dá para jogar por diversão
// (feedback de jogador: dava para ganhar dinheiro sem parar)
const COPA_PREMIADAS_DIA = 3;
function copaHoje() { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; }
function copaPremiadasRestam() { const c = copaDados(); return c.premioDia === copaHoje() ? Math.max(0, COPA_PREMIADAS_DIA - (c.premioN || 0)) : COPA_PREMIADAS_DIA; }
function copaUsaPremio() { const c = copaDados(); if (c.premioDia !== copaHoje()) { c.premioDia = copaHoje(); c.premioN = 0; } if (c.premioN >= COPA_PREMIADAS_DIA) return false; c.premioN++; return true; }
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
    const titulo = s.p ? `${s.p.nome} (${copaPosNome(s.p.pos)}) — ${s.p.elenco}${s.p.pos !== s.pos ? ' — out of position' : ''}` : `${copaPosNome(s.pos)} — open spot`;
    const clicavel = opts.onSlot && !opts.mini;
    const b = el(clicavel ? 'button' : 'div', { class: cls, title: titulo, type: clicavel ? 'button' : null, 'aria-label': titulo }, bola);
    if (!opts.mini) {
      if (s.p) { b.append(el('span', { class: 'rot' }, s.p.nome)); if (s.p.pos !== s.pos) b.append(el('span', { class: 'imp' }, `out of position −${Math.round((1 - COPA_IMPROV) * 100)}%`)); }
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
  const almBtn = el('button', { class: 'btn ' + (dados.almanaque ? 'roxo' : ''), onclick: () => { dados.almanaque = !dados.almanaque; copaSom('equip'); salvar(); abrirCopaSonhos(); } }, `📖 Almanac Mode: ${dados.almanaque ? 'ON' : 'OFF'}`);
  COPA.atalhos = { Enter: () => copaTelaFormacao(), n: () => copaTelaFormacao(), a: () => almBtn.click() };
  if (emAndamento) COPA.atalhos.c = () => copaContinuar();
  copaMostra(
    el('h2', {}, '🏆 Dream Cup'),
    el('p', {}, 'Build the team of your dreams with stars from every era of our region and try to win the Cup!'),
    el('ol', { class: 'regras' },
      el('li', {}, 'Pick a formation (4-3-3, 4-4-2...).'),
      el('li', {}, 'Roll the die 🎲: you get a historic squad — National Team, great clubs from Brazil and the world — from a specific year.'),
      el('li', {}, 'Pick 1 player from that squad and click an open spot on the field. Only 1 per roll!'),
      el('li', {}, `Don't like it? Skip the roll (only ${COPA_PULOS} times). But careful: the next one could be worse!`),
      el('li', {}, 'With all 11 in the lineup, pick a play style and play the Cup: 3 group games (top 2 advance) + round of 16, quarterfinals, semifinal and final.'),
      el('li', {}, 'Ultimate goal: win all 7 games without conceding a single goal. That\'s the PERFECT 7-0! 🏅')),
    el('div', { class: 'stats' },
      el('div', { class: 'stat' }, el('b', {}, fmt(dados.jogadas)), el('small', {}, 'Cups played')),
      el('div', { class: 'stat' }, el('b', {}, fmt(dados.titulos)), el('small', {}, 'Titles 🏆')),
      el('div', { class: 'stat' }, el('b', {}, fmt(dados.perfeitos)), el('small', {}, 'Perfect 7-0s 🏅')),
      el('div', { class: 'stat' }, el('b', {}, m.vitorias ? `${m.vitorias}W · ${m.golsSofridos}GA` : '—'), el('small', {}, 'Best run'))),
    m.time && m.time.length ? el('p', { class: 'dica' }, `Team with the best run: ${m.time.join(', ')}.`) : null,
    el('div', { class: 'alm' + (dados.almanaque ? ' on' : '') }, almBtn,
      el('p', {}, 'In Almanac Mode the players\' power is HIDDEN during the roll. Only people who know soccer history will do well! Prizes ×1.5.')),
    el('p', { class: 'dica' }, `Prize per win: ${fmt(pb.xp * mult)} XP and ${fmt(pb.ouro * mult)} coins. Champion bonus and perfect 7-0 bonus (with a sticker pack!).`),
    el('p', { class: 'dica', style: 'font-weight:800' }, copaPremiadasRestam() ? `🎁 Prize Cups left today: ${copaPremiadasRestam()} of ${COPA_PREMIADAS_DIA}. After that, you can play just for fun.` : `🎮 Today's ${COPA_PREMIADAS_DIA} prize Cups are used up! You can play for fun (no XP or coins) — prizes come back tomorrow.`),
    el('div', { class: 'opcoes' },
      el('button', { class: 'btn amarelo grande', onclick: () => copaTelaFormacao() }, emAndamento ? '⚽ New Cup (start over)' : '⚽ New Cup'),
      emAndamento ? el('button', { class: 'btn verde grande', onclick: () => copaContinuar() }, '▶ Continue Cup') : null),
    el('p', { class: 'dica' }, 'Shortcuts: ', copaKbd('N'), ' new cup · ', copaKbd('A'), ' almanaque', emAndamento ? [' · ', copaKbd('C'), ' continuar'] : ''));
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
    el('h2', {}, '🏆 Dream Cup — Formation'),
    copaPasso(1, 'Pick your team\'s formation. It decides how many spots of each position you\'ll fill.'),
    dados.almanaque ? el('p', { class: 'dica' }, '📖 Almanac Mode ON: power hidden during the roll (prizes ×1.5).') : null,
    el('div', { class: 'forms' }, ...nomes.map((f, i) => el('button', { class: 'form-card', type: 'button', onclick: () => escolhe(f), title: conta(f) },
      el('span', {}, f), copaCampo(COPA_FORMACOES[f].map(([pos, x, y]) => ({ pos, x, y, p: null })), { mini: true }), el('small', {}, conta(f)), el('small', {}, copaKbd(String(i + 1)))))),
    el('div', { class: 'opcoes' }, el('button', { class: 'btn', onclick: () => abrirCopaSonhos() }, '← Back')));
}

/* ---------- draft ---------- */
function copaTelaDraft(novo) {
  const d = COPA.draft; COPA.etapa = 'draft';
  if (d && !d.atual && COPA.pendente) { d.atual = COPA.pendente; COPA.pendente = null; COPA.rolando = false; }
  if (copaDraftCompleto(d)) return copaTelaEstilo();
  const alm = d.almanaque; const esc = 11 - copaLivres(d);
  const sel = d.atual && COPA.sel != null ? d.atual.jogadores[COPA.sel] : null;
  if (sel && !copaEscolhivel(d, sel)) COPA.sel = null;
  const selJ = d.atual && COPA.sel != null ? d.atual.jogadores[COPA.sel] : null;

  const colocar = i => {
    if (!d.atual) { copaSom('erro'); return; }
    if (!selJ) { COPA.msg = 'First pick a player from the list next to it 👉'; copaSom('erro'); return copaTelaDraft(); }
    if (!copaColocar(d, selJ, i)) { COPA.msg = `${selJ.nome} can't play as ${copaPosNome(d.slots[i].pos)}.`; copaSom('erro'); return copaTelaDraft(); }
    COPA.sel = null; COPA.msg = null; copaSom('moeda');
    if (copaDraftCompleto(d)) { if (typeof banner === 'function') banner('TEAM COMPLETE!', 'Now pick a play style'); copaSom('nivel'); return copaTelaEstilo(i); }
    copaTelaDraft(i);
  };
  const autoColoca = () => { if (!selJ) return; const ss = copaSlotsPara(d, selJ); if (ss.length) colocar(ss[0]); };

  // cabeçalho
  const prog = el('div', { class: 'progresso', style: 'width:120px;display:inline-block;vertical-align:middle;margin:0' }); const pi = el('i'); pi.style.width = (esc / 11 * 100) + '%'; prog.append(pi);
  const topo = el('div', { class: 'topo-draft' },
    el('span', { class: 'pill roxo' }, `Formation ${d.formacao}`),
    el('span', { class: 'pill' }, `Lineup ${esc}/11 `, prog),
    el('span', { class: 'pill', title: 'Roll skips left' }, `Skips: ${'🔁'.repeat(d.pulos) || '—'} (${d.pulos})`),
    el('span', { class: 'pill' }, `Rolls: ${d.rolagens}`),
    alm ? el('span', { class: 'pill', style: 'background:#e2d4ff' }, '📖 Almanac: power hidden') : el('span', { class: 'pill' }, `Average power: ${esc ? copaForcaMedia(d.slots) : '—'}`));

  // passo atual
  let passo;
  if (!d.atual) passo = copaPasso(2, esc === 0 ? 'Roll the die to draw a squad! 🎲' : `Nice! ${11 - esc} to go. Roll the die to draw the next squad.`);
  else if (!selJ) passo = copaPasso(3, 'Pick 1 player from this squad (click the name).');
  else passo = copaPasso(4, `Now click an open spot for ${selJ.nome}: green = right position, yellow = out of position (−${Math.round((1 - COPA_IMPROV) * 100)}%).`);

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
      el('button', { class: 'btn amarelo grande', onclick: rolar }, '🎲 Roll the die'),
      el('p', { class: 'dica' }, 'Press ', copaKbd('Space'), ' ou ', copaKbd('D'), ' to roll.'),
      d.ultimo ? el('button', { class: 'btn mini', onclick: () => { copaDesfazer(d); COPA.sel = null; copaTelaDraft(); } }, `↩ Undo (remove ${d.slots[d.ultimo.idx].p.nome})`) : null));
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
        title: ok ? `${j.nome} — ${copaPosNome(j.pos)}${alm ? '' : ` — strength ${j.forca}`}. Double-click to put them straight in the lineup.` : `There's no open spot for ${copaPosNome(j.pos)}.` },
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
      el('p', { class: 'dica' }, el('span', { class: 'leg', style: 'background:#4fc26a' }), 'right position', el('span', { class: 'leg', style: 'background:#e8c83a' }), 'improvisado', alm ? '' : ' · 👑 = legend'),
      el('div', { class: 'opcoes' },
        el('button', { class: 'btn verde', disabled: selJ ? null : 'disabled', onclick: autoColoca }, selJ ? `✔ Add ${selJ.nome} (best spot)` : '✔ Add to lineup'),
        el('button', { class: 'btn', disabled: d.pulos > 0 ? null : 'disabled', onclick: pular, title: 'Throws out this squad and rolls again' }, `🔁 Skip roll (${d.pulos})`)),
      el('p', { class: 'dica' }, 'Keyboard: ', copaKbd('1'), '–', copaKbd('0'), ' picks · ', copaKbd('Enter'), ' adds to lineup · ', copaKbd('P'), ' pula'));
  }
  copaMostra(el('h2', {}, '🏆 Build your dream team'), topo, passo, el('div', { class: 'grade' }, el('div', {}, campo), painel),
    el('div', { class: 'opcoes' }, esc === 0 && !d.atual ? el('button', { class: 'btn mini', onclick: () => copaTelaFormacao() }, '← Change formation') : null,
      el('button', { class: 'btn mini', onclick: () => abrirCopaSonhos() }, 'Cup Menu')));
}
function copaAnimaRolagem(painel) {
  if (COPA.rolando) return;
  const d = COPA.draft; COPA.sel = null; COPA.msg = null;
  const alvo = copaRolar(d); d.atual = null; COPA.pendente = alvo; // só mostra depois da animação (se fechar antes, não se perde)
  COPA.atalhos = {};
  const nome = el('div', { class: 'tit', style: 'font-size:20px;font-weight:700;min-height:28px' }, '...');
  painel.innerHTML = '';
  painel.append(el('div', { class: 'dado-zona' }, el('div', { class: 'dado gira' }, '🎲'), el('p', {}, 'Drawing a squad...'), nome));
  copaSom('equip');
  let n = 0;
  copaTimer(() => { const e = COPA_ELENCOS[Math.floor(Math.random() * COPA_ELENCOS.length)]; nome.textContent = `${e.emoji} ${e.time} ${e.ano}`; n++; }, 70, true);
  COPA.rolando = true;
  const fim = setTimeout(() => { copaLimpaTimers(); d.atual = alvo; COPA.pendente = null; copaSom('moeda'); copaTelaDraft(); }, 850);
  COPA.timers.push(fim);
}

/* ---------- estilo de jogo ---------- */
function copaTelaEstilo(novo) {
  const d = COPA.draft; COPA.etapa = 'estilo';
  if (!COPA.estilo) COPA.estilo = 'equilibrado';
  const tt = k => (typeof TATICAS !== 'undefined' && TATICAS[COPA_ESTILOS[k].tatica]) || { atq: 1, def: 1 };
  const efeito = k => { const t = tt(k); const pa = Math.round((t.atq - 1) * 100), pd = Math.round((t.def - 1) * 100); return pa === 0 && pd === 0 ? 'Normal attack and defense' : `Attack ${pa > 0 ? '+' : ''}${pa}% · Defense ${pd > 0 ? '+' : ''}${pd}%`; };
  const media = copaForcaMedia(d.slots);
  const escolhe = k => { COPA.estilo = k; copaSom('equip'); copaTelaEstilo(); };
  const comecar = () => { COPA.camp = copaNovaCampanha(d.slots, COPA.estilo, d.almanaque); COPA.camp.comPremio = copaUsaPremio(); COPA.etapa = 'copa'; copaSom('apito'); copaTelaCopa(); };
  COPA.atalhos = { '1': () => escolhe('defensivo'), '2': () => escolhe('equilibrado'), '3': () => escolhe('ofensivo'), Enter: comecar };
  const improv = d.slots.filter(s => s.p.pos !== s.pos).length;
  copaMostra(
    el('h2', {}, '🏆 Team complete!'),
    d.almanaque ? copaPasso('📖', `Almanac reveal: your team's average power is ${media}! See each player's power on the field.`) : copaPasso(5, `Your team has an average power of ${media}. Now pick a play style.`),
    el('div', { class: 'grade' },
      el('div', {}, copaCampo(d.slots, { mostraForca: true, novo })),
      el('div', {},
        el('h3', {}, 'Play style'),
        el('div', { class: 'estilos' }, ...Object.entries(COPA_ESTILOS).map(([k, v], i) => el('button', { class: 'est' + (COPA.estilo === k ? ' sel' : ''), type: 'button', onclick: () => escolhe(k) },
          el('span', { class: 'em' }, v.emoji), el('b', {}, v.nome), el('small', {}, v.desc), el('small', { class: 'ef' }, efeito(k)), el('small', {}, copaKbd(String(i + 1)))))),
        improv ? el('p', { class: 'dica', style: 'color:#b0601a' }, `⚠ ${improv} player(s) out of position: they play at ${Math.round(COPA_IMPROV * 100)}% power.`) : el('p', { class: 'dica', style: 'color:#1a7a1a' }, '✔ Everyone is in the right position!'),
        el('p', {}, 'The Cup: 3 games in Group A (top 2 advance), then round of 16, quarterfinals, semifinal and FINAL. In the knockout rounds, a tie goes to penalties.'),
        el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo grande', onclick: comecar }, '🏆 Start the Cup!')),
        el('p', { class: 'dica' }, copaKbd('1'), copaKbd('2'), copaKbd('3'), ' style · ', copaKbd('Enter'), ' start'))));
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
  const tab = el('table', { class: 'rank-tab' }, el('tr', {}, ...['#', 'Group A', 'P', 'J', 'V', 'E', 'D', 'SG', 'GP'].map(h => el('th', {}, h))));
  copaTabela(c).forEach((t, i) => tab.append(el('tr', { class: (t.id === 'nos' ? 'nos ' : '') + (i < 2 ? 'cls' : '') },
    el('td', {}, i + 1), el('td', {}, `${t.emoji} ${t.nome}`), el('td', {}, el('b', {}, t.pts)), el('td', {}, t.j), el('td', {}, t.v), el('td', {}, t.e), el('td', {}, t.d), el('td', {}, t.gp - t.gc), el('td', {}, t.gp))));
  return el('div', {}, tab, el('p', { class: 'dica' }, 'The top 2 (green stripe) go to the round of 16. Tiebreakers: points, goal difference, goals scored.'));
}
function copaLadoNos(c) { return el('div', { class: 'lado' }, el('span', { class: 'em' }, '⭐'), el('b', {}, COPA_NOME_TIME), el('small', {}, `Power ${copaForcaMedia(c.slots)} · ${COPA_ESTILOS[c.estilo].emoji} ${COPA_ESTILOS[c.estilo].nome}`)); }
function copaLadoAdv(a) { return el('div', { class: 'lado' }, el('span', { class: 'em' }, a.emoji), el('b', {}, a.nome), el('small', {}, `Power ${a.forca} · ${a.formacao} · ${COPA_ESTILOS[a.estilo].nome}`), a.origem ? el('small', { style: 'display:block' }, a.origem) : null); }
function copaTelaCopa() {
  const c = COPA.camp; COPA.etapa = 'copa';
  if (c.fim) return copaTelaFim();
  const f = COPA_FASES[c.fase]; const adv = copaAdvDaFase(c);
  const jogar = () => copaTelaJogo();
  COPA.atalhos = { Enter: jogar, ' ': jogar };
  const invicto = c.jogos.length > 0 && c.gc === 0 && c.d === 0 && c.e === 0;
  copaMostra(
    el('h2', {}, `🏆 Dream Cup — ${f.nome}`),
    copaCaminho(c, c.fase),
    f.grupo && c.fase > 0 ? copaTabelaGrupo(c) : null,
    f.grupo && c.fase === 0 ? el('p', {}, `Your group: ${c.grupo.map(t => `${t.emoji} ${t.nome}`).join(', ')}. The top 2 advance!`) : null,
    invicto ? el('p', { style: 'color:#1a7a1a;text-align:center' }, `🔥 ${c.v} win(s) and no goals conceded! The dream of a perfect 7-0 is still alive!`) : null,
    el('div', { class: 'confronto' }, copaLadoNos(c), el('div', { class: 'tit', style: 'font-size:28px;color:var(--madeira2)' }, 'VS'), copaLadoAdv(adv)),
    !f.grupo ? el('p', { class: 'dica', style: 'text-align:center' }, 'Knockout round: whoever loses is out. A tie goes to penalties!') : null,
    el('div', { class: 'centro' }, el('button', { class: 'btn amarelo grande', onclick: jogar }, '▶ Play match'), el('button', { class: 'btn', onclick: () => abrirCopaSonhos() }, 'Cup Menu')),
    el('p', { class: 'dica', style: 'text-align:center' }, copaKbd('Enter'), ' plays the match'));
}
function copaNarracao(res, c, adv) {
  const L = [];
  const fase = COPA_FASES[res.fase];
  const nosGk = copaGoleiro(c.slots).nome, advGk = copaGoleiro(adv.slots).nome;
  const pick = a => a[Math.floor(Math.random() * a.length)];
  L.push({ min: 0, cls: 'sis', txt: `0' The referee blows the whistle! Starting ${fase.grupo ? 'the game' : 'a ' + fase.nome.toLowerCase().replace('final', 'final')} against ${adv.nome}.` });
  let gn = 0, ga = 0;
  res.eventos.forEach(e => {
    if (e.nos) {
      gn++;
      L.push({ min: e.min, cls: 'gn', gol: 'nos', txt: pick([
        `${e.min}' GOOOOAL! ${e.autor} gets it from ${e.assist} and slots it into the corner!`,
        `${e.min}' SCREAMER by ${e.autor}! A shot from outside the box, ${advGk} didn't even see it!`,
        `${e.min}' ${e.autor} dribbles past two and slips it past ${advGk}. GOAL!`,
        `${e.min}' Cross from ${e.assist}, header by ${e.autor}... GOOOAL!`,
        `${e.min}' One-two between ${e.assist} and ${e.autor}, who puts it in the net!`]) });
    } else {
      ga++;
      L.push({ min: e.min, cls: 'ga', gol: 'adv', txt: pick([
        `${e.min}' Uh-oh... goal for ${adv.nome}. ${e.autor} took advantage of a defensive slip.`,
        `${e.min}' ${e.autor} hits a rocket and ${nosGk} can't reach it. Their goal.`,
        `${e.min}' A fast counterattack and ${e.autor} scores for ${adv.nome}.`]) });
    }
  });
  // lances de efeito (até 2)
  if (res.defesaNossa) L.push({ min: res.defesaNossa.min, cls: 'def', txt: `${res.defesaNossa.min}' ${res.defesaNossa.autor} shoots hard... WHAT A SAVE by ${nosGk}!` });
  if (res.salvou) L.push({ min: res.salvou.min, cls: 'def', txt: `${res.salvou.min}' ${res.salvou.autor} shoots and ${advGk} tips it out for a corner!` });
  else if (res.perdeu) L.push({ min: res.perdeu.min, cls: '', txt: `${res.perdeu.min}' ${res.perdeu.autor} tries from distance... over the bar!` });
  L.sort((a, b) => a.min - b.min);
  let fimTxt = `90' Full time: ${COPA_NOME_TIME} ${res.ga} × ${res.gb} ${adv.nome}.`;
  L.push({ min: 90, cls: 'sis', txt: fimTxt });
  if (res.pen) L.push({ min: 91, cls: res.pen.venceNos ? 'gn' : 'ga', pen: true, txt: `Penalties! ${nosGk} x ${advGk}... ${res.pen.venceNos ? `WE WON ${res.pen.nos} to ${res.pen.adv}!` : `we lost ${res.pen.nos} to ${res.pen.adv}...`}` });
  const antes = c.jogos.slice(0, -1);
  const invictoAntes = antes.every(j => j.gb === 0 && j.resultado === 'v');
  if (res.resultado === 'v' && res.gb === 0 && invictoAntes) L.push({ min: 92, cls: 'gn', txt: `Another game without conceding! ${c.v}/7 on the way to the perfect 7-0! 🏅` });
  else if (res.gb > 0 && antes.every(j => j.gb === 0)) L.push({ min: 92, cls: 'sis', txt: 'We conceded... the perfect 7-0 will have to wait. But the Cup goes on!' });
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
    relogio.firstChild.textContent = res.pen ? 'End (penalties)' : "90' End"; barra.style.width = '100%';
    caminho.replaceWith(copaCaminho(c, c.fase));
    copaSom(res.resultado === 'v' ? 'nivel' : 'apito');
    const txt = res.resultado === 'v' ? (res.pen ? 'PENALTY SHOOTOUT WIN!' : 'VICTORY!') : res.resultado === 'e' ? 'TIE' : (res.pen ? 'Lost on penalties...' : 'DEFEAT...');
    fimBox.append(el('div', { class: 'resultado ' + res.resultado }, txt));
    if (res.outro) fimBox.append(el('p', { class: 'dica', style: 'text-align:center' }, `Other group game: ${res.outro.a} ${res.outro.ga} × ${res.outro.gb} ${res.outro.b}`));
    if (res.premio) fimBox.append(el('p', { class: 'dica', style: 'text-align:center;color:#1a7a1a' }, `+${fmt(res.premio.xp)} XP · +${fmt(res.premio.ouro)} coins`));
    if (COPA_FASES[res.fase].grupo && res.fase === 2) fimBox.append(copaTabelaGrupo(c), el('p', { style: 'text-align:center' }, res.classificou ? `Qualified in ${c.posGrupo}º place! On to the round of 16! 🎉` : `We finished in ${c.posGrupo}º place... we were knocked out in the group. 😢`));
    else if (COPA_FASES[res.fase].grupo) fimBox.append(copaTabelaGrupo(c));
    const cont = () => (c.fim ? copaTelaFim() : copaTelaCopa());
    ctl.innerHTML = ''; ctl.append(el('button', { class: 'btn amarelo grande', onclick: cont }, c.fim ? '🏁 See the Cup result' : 'Continue ➜'));
    COPA.atalhos = { Enter: cont, ' ': cont };
  };
  ctl.append(el('button', { class: 'btn', onclick: termina }, '⏩ Skip animation'));
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
  if (res.resultado === 'v' && c.comPremio !== false) {
    const xp = Math.round(pb.xp * mult), ouro = Math.round(pb.ouro * mult);
    res.premio = { xp, ouro }; c.premio.xp += xp; c.premio.ouro += ouro;
    G.save.ouro += ouro; ganhaXp(xp);
  }
  if (c.fim && !c.processado) copaFechaCopa();
  salvar();
}
function copaFechaCopa() {
  const c = COPA.camp; const dados = copaDados(); const pb = copaPremioBase(); const mult = c.comPremio === false ? 0 : c.almanaque ? 1.5 : 1; // Copa por diversão: sem prêmio
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
      if (mult > 0 && typeof addItem === 'function' && addItem('pacotinho', pac)) c.premio.itens.push(`${pac}x Sticker Pack`);
      conta('copa7a0');
      G.save.flags = G.save.flags || {}; G.save.flags.copa7a0 = true;
      if (typeof log === 'function') log('PERFECT 7-0 in the Dream Cup! 7 wins without conceding a single goal!', 'l-lvl');
      if (typeof banner === 'function') banner('PERFECT 7-0!', 'Dream Cup');
    } else {
      if (typeof log === 'function') log(`Dream Cup CHAMPION! ${c.v}W ${c.e}T ${c.d}L, ${c.gp} goals for and ${c.gc} against.`, 'l-lvl');
      if (typeof banner === 'function') banner('CHAMPIONS!', 'Dream Cup');
    }
  } else if (typeof log === 'function') {
    log(`Dream Cup: knocked out in the "${COPA_FASES[c.eliminadoEm].nome}" stage. Champion: ${c.campeaoNome}.`, 'l-info');
  }
  if (typeof log === 'function' && c.premio.xp) log(`Dream Cup: +${fmt(c.premio.xp)} XP and +${fmt(c.premio.ouro)} coins in total.`, 'l-xp');
  salvar();
}
function copaTelaFim() {
  const c = COPA.camp; COPA.etapa = 'fim';
  if (!c.processado) copaFechaCopa();
  const jogar = () => copaTelaFormacao();
  COPA.atalhos = { Enter: jogar, j: jogar, m: () => abrirCopaSonhos() };
  const fase = COPA_FASES[c.eliminadoEm != null ? c.eliminadoEm : 6];
  let titulo, trofeu;
  if (c.perfeito) { titulo = 'UNBEATEN CHAMPION WITHOUT CONCEDING A GOAL!'; trofeu = '🏆'; }
  else if (c.campeao) { titulo = 'DREAM CUP CHAMPION!'; trofeu = '🏆'; }
  else if (c.eliminadoEm <= 2) { titulo = 'Knocked out in the group stage'; trofeu = '😢'; }
  else { titulo = `Knocked out ${fase.id === 'fin' ? 'in the FINAL (runner-up!)' : fase.id === 'sem' ? 'in the semifinal' : fase.id === 'qua' ? 'in the quarterfinals' : 'in the round of 16'}`; trofeu = fase.id === 'fin' ? '🥈' : '💪'; }
  const tab = el('table', { class: 'caminho-tab' });
  c.jogos.forEach(j => tab.append(el('tr', {}, el('td', {}, COPA_FASES[j.fase].nome.replace('Group stage — ', 'Group · ')), el('td', {}, `${j.advEmoji} ${j.advNome}`),
    el('td', {}, `${j.ga} × ${j.gb}${j.pen ? ` (pen. ${j.pen.nos}×${j.pen.adv})` : ''}`), el('td', { class: 'r ' + j.resultado }, j.resultado.toUpperCase()))));
  const dica = c.perfeito ? 'You made history! Very few players pull this off.'
    : c.campeao ? `So close to the perfect 7-0${c.gc ? ` (conceded ${c.gc} goal${c.gc > 1 ? 's' : ''})` : ''}. Try the Defensive style and a great goalkeeper!`
      : 'Tip: stars in the right position are worth more than players out of position. And use your roll skips wisely!';
  copaMostra(
    el('h2', {}, '🏆 Dream Cup — Result'),
    el('div', { class: 'fim-card' },
      el('div', { class: 'trofeu' }, trofeu),
      el('div', { class: 'tit', style: 'font-size:24px;font-weight:700;color:var(--madeira2)' }, titulo),
      c.perfeito ? el('div', { class: 'selo7' }, '🏅 PERFECT 7-0! 🏅') : null,
      !c.campeao ? el('p', {}, `Cup champion: ${c.campeaoNome}.`) : null,
      c.recorde ? el('p', { style: 'color:#7a2ab0' }, '⭐ New best run!') : null,
      el('div', { class: 'recorde' },
        el('span', { class: 'pill' }, `${c.v}V · ${c.e}E · ${c.d}D`),
        el('span', { class: 'pill' }, `Goals for: ${c.gp}`),
        el('span', { class: 'pill' }, `Goals against: ${c.gc}`),
        el('span', { class: 'pill' }, `Team power: ${copaForcaMedia(c.slots)}`),
        c.almanaque ? el('span', { class: 'pill', style: 'background:#e2d4ff' }, '📖 Almanac ×1.5') : null),
      el('p', { style: 'color:#1a7a1a' }, `Prizes: +${fmt(c.premio.xp)} XP · +${fmt(c.premio.ouro)} coins${c.premio.itens.length ? ' · ' + c.premio.itens.join(', ') : ''}`),
      el('p', { class: 'dica' }, dica)),
    el('div', { class: 'grade', style: 'margin-top:10px' }, el('div', {}, copaCampo(c.slots, { mostraForca: true })), el('div', {}, el('h3', {}, 'Campaign'), tab)),
    el('div', { class: 'centro' }, el('button', { class: 'btn amarelo grande', onclick: jogar }, '🔄 Play again'), el('button', { class: 'btn', onclick: () => abrirCopaSonhos() }, 'Cup Menu')),
    el('p', { class: 'dica', style: 'text-align:center' }, copaKbd('Enter'), ' play again · ', copaKbd('M'), ' menu'));
}

/* ============================================================
   INTEGRAÇÃO COM O RPG
   ============================================================ */
const NPC_COPA = {
  nome: 'Almanac Ademir',
  look: { tipo: 'humano', corpo: 'm', pele: 'pele-negra', cabelo: 'cabelo-curto', corCabelo: 'grisalho', roupa: 'roupa-xadrez', baixo: 'baixo-jeans', rosto: 'rosto-redondos', mao: 'mao-livro' },
  ola: 'Hey there, star! I know the lineup of EVERY great team in history, all the way back to 1958! Want to build a dream team with Pelê, Zicu, Romáriu, Martta, Maradonna and Messy? Roll the die and let’s see if you win the Cup... maybe even with a perfect 7-0!',
  copa: true,
};
// v407 (Raio-X R8): caixa alta só para nome de chefão (palavras de ênfase e nomes de cidade voltaram ao normal)
const MISSOES_COPA = [
  { id: 'q_copa1', npc: 'almanaque', titulo: 'Dreaming is free', lvl: 3,
    texto: 'Ever heard of the Dream Cup? You build a team with stars from every era, one roll at a time. Play a whole Cup, from the first game to the end, and tell me how it went!',
    req: { copa: 1, desc: 'Complete 1 Dream Cup (until you\'re knocked out or win the title)' },
    rec: { xp: 150, ouro: 40, itens: [['pacotinho', 1]] },
    fim: 'See? Picking the team is half the game! Here\'s a sticker pack to start your legends collection.' },
  { id: 'q_copa2', npc: 'almanaque', titulo: 'Lift that trophy!', lvl: 6,
    texto: 'Playing is nice, but lifting the trophy is way better. Win the Dream Cup: get through the group stage and win the round of 16, quarterfinals, semifinal and final!',
    req: { copaTitulo: 1, desc: 'Become Dream Cup champion' },
    rec: { xp: 500, ouro: 150, itens: [['pacotinho', 2]] },
    fim: 'CHAMPION! I’m writing your name right here in my almanac, next to Pelê and Garrinxa!' },
  { id: 'q_copa3', npc: 'almanaque', titulo: 'The perfect 7-0', lvl: 10,
    texto: 'Now the challenge of all challenges: win all 7 Cup games without letting in a single goal. Only the greatest teams in history have done it. A tip from someone who knows: a good goalkeeper and a strong defense!',
    req: { copa7a0: 1, desc: 'Win all 7 Dream Cup games without conceding a goal' },
    rec: { xp: 2000, ouro: 500, itens: [['pacotinho', 3]] },
    fim: 'In 50 years of keeping my almanac, I\'ve never seen anything like it! A PERFECT 7-0! You\'re a legend, star!' },
];
