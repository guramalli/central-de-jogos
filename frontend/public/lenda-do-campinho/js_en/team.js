/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   RUMO AO CRAQUE — MEU TIME (fase adulta, nível 25+)
   Clube próprio, elenco, formação, tática, mercado, estrutura,
   finanças, categoria de base e CAMPEONATOS: pirâmide de
   divisões em cada país (sobe/cai), copa nacional e a
   possibilidade de levar o clube para ligas de outros países.
   ============================================================ */
const NIVEL_TIME = 25;
const POS_NOME = { GOL: 'Goalkeeper', ZAG: 'Center Back', LAT: 'Fullback', VOL: 'Defensive Mid', MEI: 'Midfielder', ATA: 'Striker' };
// v221: cada posição tem uma cor (etiqueta, fundo da linha e faixa no cartão do jogador)
const POS_COR = { GOL: '#e0a000', ZAG: '#2a6ad9', LAT: '#12a0a8', VOL: '#2a9d4a', MEI: '#8a4ad9', ATA: '#d93a3a' };
const POS_COMPAT = { ZAG: ['VOL', 'LAT'], LAT: ['ZAG', 'VOL', 'MEI'], VOL: ['ZAG', 'MEI', 'LAT'], MEI: ['VOL', 'ATA', 'LAT'], ATA: ['MEI'], GOL: [] };
const FORMACOES = {
  '4-4-2': ['GOL', 'ZAG', 'ZAG', 'LAT', 'LAT', 'VOL', 'VOL', 'MEI', 'MEI', 'ATA', 'ATA'],
  '4-3-3': ['GOL', 'ZAG', 'ZAG', 'LAT', 'LAT', 'VOL', 'MEI', 'MEI', 'ATA', 'ATA', 'ATA'],
  '3-5-2': ['GOL', 'ZAG', 'ZAG', 'ZAG', 'LAT', 'LAT', 'VOL', 'MEI', 'MEI', 'ATA', 'ATA'],
  '5-3-2': ['GOL', 'ZAG', 'ZAG', 'ZAG', 'LAT', 'LAT', 'VOL', 'VOL', 'MEI', 'ATA', 'ATA'],
  '4-5-1': ['GOL', 'ZAG', 'ZAG', 'LAT', 'LAT', 'VOL', 'VOL', 'MEI', 'MEI', 'MEI', 'ATA'],
};
const TATICAS = {
  equilibrada: { nome: 'Balanced', atq: 1, mei: 1, def: 1, en: 1, desc: 'Right in the middle.' },
  ofensiva: { nome: 'Attacking', atq: 1.12, mei: 1, def: 0.9, en: 1.05, desc: '+attack, −defense.' },
  defensiva: { nome: 'Park the Bus', atq: 0.86, mei: 1, def: 1.14, en: 0.95, desc: '+defense, −attack.' },
  pressao: { nome: 'High Press', atq: 1.04, mei: 1.12, def: 0.96, en: 1.35, desc: '+midfield, very tiring.' },
  contra: { nome: 'Counterattack', atq: 1.1, mei: 0.9, def: 1.05, en: 1, desc: 'Gives up the ball and uses the open space.' },
};

/* ---------------- países e divisões ---------------- */
// Cada país tem uma pirâmide de divisões (da mais baixa para a mais alta) e a força média dos times.
// v232: forças pela RELEVÂNCIA real do futebol de cada país (ESCADA_PAISES). O Brasil é a casa: a Várzea é
// a liga mais fraca do jogo e a Série A fica acima de Argentina, EUA, Japão, Catar e Egito e abaixo da Europa.
// Países novos entram SEMPRE no fim da lista (t.div é índice em DIVS, e as flags campeao_div<n> também).
const PAISES = [
  { id: 'brasil', nome: 'Brazil', lvl: NIVEL_TIME, copa: 'Brazil Cup', cores: ['#1a9a3a', '#f8d838', '#2a4ad9'], divs: [['Sandlot League', 26], ['Série D', 34], ['Série C', 42], ['Série B', 51], ['Série A', 61]] },
  { id: 'egito', nome: 'Egypt', lvl: 35, copa: 'Egypt Cup', cores: ['#ce1126', '#ffffff', '#1a1a1a'], divs: [['Egyptian 2nd Division', 38], ['Nile League', 44]] },
  { id: 'japao', nome: 'Japan', lvl: 45, copa: 'Japan Cup', cores: ['#ffffff', '#d8203a', '#ffffff'], divs: [['Japanese 2nd Division', 42], ['Rising Sun League', 48]] },
  { id: 'catar', nome: 'Qatar', lvl: 40, copa: 'Emir Cup', cores: ['#ffffff', '#8a1538', '#8a1538'], vert: true, divs: [['Qatar 2nd Division', 40], ['Gulf Stars League', 46]] },
  { id: 'eua', nome: 'United States', lvl: 50, copa: 'USA Cup', cores: ['#b22234', '#ffffff', '#3c3b6e'], divs: [['North American League B', 44], ['North American League', 51]] },
  { id: 'portugal', nome: 'Portugal', lvl: 90, copa: 'Portugal Cup', cores: ['#006600', '#ff0000', '#ff0000'], vert: true, divs: [['Portuguese 3rd League', 62], ['Portuguese 2nd League', 65], ['Lusitanian League', 68]] },
  { id: 'espanha', nome: 'Spain', lvl: 138, copa: 'King\'s Cup', cores: ['#c60b1e', '#ffc400', '#c60b1e'], divs: [['Spanish 3rd Division', 77], ['Spanish 2nd Division', 80], ['Iberian League', 85]] },
  { id: 'italia', nome: 'Italy', lvl: 128, copa: 'Italy Cup', cores: ['#009246', '#ffffff', '#ce2b37'], vert: true, divs: [['Italian Serie C', 74], ['Italian Serie B', 77], ['Italian Serie A', 82]] },
  { id: 'alemanha', nome: 'Germany', lvl: 116, copa: 'Germany Cup', cores: ['#1a1a1a', '#dd0000', '#ffce00'], divs: [['German Regional League', 70], ['German 2nd League', 74], ['German 1st League', 79]] },
  { id: 'inglaterra', nome: 'England', lvl: 148, copa: 'England Cup', cores: ['#ffffff', '#ce1124', '#ffffff'], divs: [['English National Division', 81], ['English Second Division', 85], ['English Top League', 90]] },
  { id: 'mundo', nome: 'World Championship', lvl: 150, copa: null, cores: ['#2a4ad9', '#2ad96a', '#2a4ad9'], divs: [['Club World Cup', 95]] },
  // v232 (sempre no fim: não mexe nos índices dos saves)
  { id: 'argentina', nome: 'Argentina', lvl: 55, copa: 'Argentina Cup', cores: ['#74acdf', '#ffffff', '#74acdf'], divs: [['Primera Nacional', 48], ['Argentine Professional League', 56]] },
  { id: 'franca', nome: 'France', lvl: 104, copa: 'France Cup', cores: ['#0055a4', '#ffffff', '#ef4135'], vert: true, divs: [['French National', 66], ['French Ligue 2', 70], ['French Ligue 1', 74]] },
  // v236: mais ligas (sempre no fim)
  { id: 'china', nome: 'China', lvl: 38, copa: 'China Cup', cores: ['#de2910', '#ffde00', '#de2910'], divs: [['Chinese League B', 36], ['Chinese Super League', 42]] },
  { id: 'arabia', nome: 'Saudi Arabia', lvl: 47, copa: 'Saudi King\'s Cup', cores: ['#006c35', '#ffffff', '#006c35'], divs: [['Saudi 1st Division', 43], ['Saudi Pro League', 50]] },
  { id: 'colombia', nome: 'Colombia', lvl: 51, copa: 'Colombia Cup', cores: ['#fcd116', '#003893', '#ce1126'], divs: [['Colombian Tournament B', 45], ['Colombian League', 52]] },
  { id: 'uruguai', nome: 'Uruguay', lvl: 53, copa: 'Uruguay AUF Cup', cores: ['#ffffff', '#0038a8', '#ffffff'], divs: [['Uruguayan Second Division', 46], ['Uruguayan Championship', 53]] },
  { id: 'mexico', nome: 'Mexico', lvl: 56, copa: 'Copa MX', cores: ['#006847', '#ffffff', '#ce1126'], vert: true, divs: [['Liga de Expansión MX', 48], ['Liga MX', 55]] },
  { id: 'escocia', nome: 'Scotland', lvl: 64, copa: 'Scotland Cup', cores: ['#005eb8', '#ffffff', '#005eb8'], divs: [['Scottish Championship', 55], ['Scottish Premiership', 60]] },
  { id: 'turquia', nome: 'Turkey', lvl: 70, copa: 'Turkey Cup', cores: ['#e30a17', '#ffffff', '#e30a17'], divs: [['Turkish 1st League', 58], ['Turkish 2nd Super League', 61], ['Turkish Super League', 64]] },
  { id: 'belgica', nome: 'Belgium', lvl: 76, copa: 'Belgium Cup', cores: ['#000000', '#fdda24', '#ef3340'], vert: true, divs: [['Belgian Challenger', 60], ['Pro League B', 63], ['Belgian Pro League', 66]] },
  { id: 'holanda', nome: 'Netherlands', lvl: 82, copa: 'Netherlands Cup', cores: ['#ae1c28', '#ffffff', '#21468b'], divs: [['Tweede Divisie', 60], ['Eerste Divisie', 64], ['Eredivisie', 67]] },
];
// ordem de relevância (da liga mais fraca para a mais forte): é a escada mostrada em "Ligas pelo mundo"
const ESCADA_PAISES = ['china', 'egito', 'catar', 'japao', 'arabia', 'eua', 'colombia', 'uruguai', 'mexico', 'argentina', 'escocia', 'brasil', 'turquia', 'belgica', 'holanda', 'portugal', 'franca', 'alemanha', 'italia', 'espanha', 'inglaterra', 'mundo'];
const ESCADA_FOLGA = 5; // campeão de uma liga de força X abre os países cuja divisão de entrada tem força até X+5
const PAIS = Object.fromEntries(PAISES.map(p => [p.id, p]));
const PAISES_EUROPA = ['portugal', 'franca', 'espanha', 'italia', 'alemanha', 'inglaterra', 'escocia', 'turquia', 'belgica', 'holanda'];
// lista "achatada" de todas as divisões — t.div é um índice aqui
const DIVS = PAISES.flatMap(p => p.divs.map(([nome, base], k) => ({ nome, base, pais: p.id, k, topo: k === p.divs.length - 1, piso: k === 0 })));
function divDe(pais, k) { return DIVS.findIndex(d => d.pais === pais && d.k === k); }
const TIMES_LIGA = 10;
const GATILHO_COPA = [5, 11, 17]; // a fase da copa abre depois dessas rodadas da liga
const FASES_COPA = ['Quarterfinals', 'Semifinal', 'Final'];

const NOMES_PAIS = {
  egito: { a: ['Clube', 'Pharaohs of', 'Star of', 'Union of', 'Falcons of', 'Scarabs of'], b: ['Giza', 'Luxor', 'Aswan', 'Alexandria', 'Suez', 'Karnak', 'Sinai', 'Delta', 'Faiyum', 'Port Said', 'Memphis', 'Edfu'] },
  japao: { a: ['FC', 'Tigers of', 'Dragons of', 'Samurai of', 'Cherry Blossoms of', 'Herons of'], b: ['Osaka', 'Kyoto', 'Nagoya', 'Sapporo', 'Kobe', 'Yokohama', 'Sendai', 'Fukuoka', 'Hiroshima', 'Nara', 'Kanazawa', 'Okinawa'] },
  catar: { a: ['Clube', 'Falcons of', 'Pearls of', 'Dunes of', 'Star of', 'Oasis of'], b: ['Doha', 'Al Wakrah', 'Lusail', 'Al Khor', 'Dukhan', 'Mesaieed', 'Umm Salal', 'Zubarah', 'Shamal', 'Ras Laffan'] },
  eua: { b: ['Orlando', 'Tampa', 'Austin', 'Denver', 'Boston', 'Seattle', 'Phoenix', 'Atlanta', 'Chicago', 'Houston', 'Detroit', 'Portland'], c: ['Sharks', 'Comets', 'Rattlers', 'Thunder', 'Eagles', 'Pioneers', 'Storm', 'Rockets', 'Coyotes', 'Surfers'] },
  portugal: { a: ['Académico de', 'Desportivo de', 'Union of', 'Star of', 'Atlético de', 'Os Leões de'], b: ['Aveiro', 'Évora', 'Faro', 'Viseu', 'Leiria', 'Setúbal', 'Sintra', 'Cascais', 'Tomar', 'Óbidos', 'Nazaré', 'Lagos'] },
  espanha: { a: ['Deportivo', 'Atlético', 'Unión', 'Club', 'Racing', 'Sporting'], b: ['Toledo', 'Salamanca', 'Segovia', 'Córdoba', 'Zamora', 'Ávila', 'Murcia', 'Burgos', 'Cáceres', 'Teruel', 'Huesca', 'Lugo'] },
  italia: { a: ['Associazione', 'Unione', 'Sportiva', 'Atletico', 'Virtus', 'Robur'], b: ['Siena', 'Pisa', 'Lucca', 'Trento', 'Rimini', 'Padova', 'Lecce', 'Como', 'Perugia', 'Modena', 'Ravenna', 'Ancona'] },
  alemanha: { a: ['SV', 'FC', 'TSV', 'SC', 'Viktoria', 'Fortuna'], b: ['Ulm', 'Kassel', 'Trier', 'Passau', 'Rostock', 'Lübeck', 'Erfurt', 'Jena', 'Bamberg', 'Göttingen', 'Würzburg', 'Koblenz'] },
  inglaterra: { b: ['Bath', 'York', 'Dover', 'Chester', 'Exeter', 'Durham', 'Kent', 'Hull', 'Lincoln', 'Bristol', 'Salisbury', 'Canterbury'], c: ['Rovers', 'Athletic', 'Albion', 'Wanderers', 'Town', 'Harriers', 'Rangers', 'Mariners'] },
  argentina: { a: ['Club Atlético', 'Deportivo', 'Sportivo', 'Racing de', 'Unión de', 'Estudiantes de'], b: ['Rosario', 'Mendoza', 'Córdoba', 'Salta', 'Tucumán', 'La Plata', 'Mar del Plata', 'Bahía Blanca', 'Santa Fe', 'Jujuy', 'Neuquén', 'Paraná'] },
  franca: { a: ['Olympique de', 'Stade', 'AS', 'FC', 'Racing de', 'Étoile de'], b: ['Rouen', 'Dijon', 'Tours', 'Nancy', 'Grenoble', 'Avignon', 'Orléans', 'Limoges', 'Calais', 'Toulon', 'Annecy', 'Amiens'] },
  china: { a: ['Dragons of', 'Tigers of', 'Star of', 'FC', 'Union of', 'Herons of'], b: ['Hangzhou', 'Nanjing', 'Qingdao', 'Dalian', 'Xiamen', 'Suzhou', 'Kunming', 'Harbin', 'Xian', 'Changsha', 'Hefei', 'Jinan'] },
  arabia: { a: ['Al', 'Clube', 'Falcons of', 'Star of', 'Union of', 'Oasis of'], b: ['Abha', 'Hail', 'Tabuk', 'Najran', 'Jizan', 'Buraidah', 'Khobar', 'Yanbu', 'Taif', 'Qassim', 'Jubail', 'Medina'] },
  colombia: { a: ['Deportivo', 'Atlético', 'Real', 'Independiente', 'Unión', 'Club'], b: ['Cúcuta', 'Pasto', 'Neiva', 'Armenia', 'Ibagué', 'Manizales', 'Santa Marta', 'Villavicencio', 'Tunja', 'Popayán', 'Montería', 'Valledupar'] },
  uruguai: { a: ['Club', 'Atlético', 'Sportivo', 'Deportivo', 'Racing', 'Unión'], b: ['Salto', 'Paysandú', 'Rivera', 'Maldonado', 'Colonia', 'Durazno', 'Tacuarembó', 'Florida', 'Mines', 'Rocha', 'Artigas', 'Melo'] },
  mexico: { a: ['Club', 'Atlético', 'Deportivo', 'Leones de', 'Águilas de', 'Venados de'], b: ['Puebla', 'Oaxaca', 'Mérida', 'Querétaro', 'Tijuana', 'Cancún', 'Morelia', 'Zacatecas', 'Veracruz', 'Durango', 'Sinaloa', 'Tepic'] },
  escocia: { a: ['FC', 'Athletic', 'Rovers', 'United', 'Thistle', 'Academical'], b: ['Perth', 'Inverness', 'Stirling', 'Dunfermline', 'Falkirk', 'Ayr', 'Arbroath', 'Montrose', 'Greenock', 'Paisley', 'Airdrie', 'Hamilton'] },
  turquia: { a: ['Spor', 'Gençlik', 'FK', 'Belediye', 'Kulübü', 'Yıldız'], b: ['Bursa', 'Izmir', 'Adana', 'Samsun', 'Kayseri', 'Eskişehir', 'Malatya', 'Denizli', 'Rize', 'Manisa', 'Sakarya', 'Bodrum'] },
  belgica: { a: ['Royal', 'KV', 'KAS', 'Sporting', 'Racing', 'Union'], b: ['Ostende', 'Lommel', 'Lier', 'Beveren', 'Tubize', 'Namur', 'Mons', 'Tournai', 'Hasselt', 'Aalst', 'Ronse', 'Waregem'] },
  holanda: { a: ['FC', 'SC', 'VV', 'Go Ahead', 'Fortuna', 'Excelsior'], b: ['Deventer', 'Zwolle', 'Almere', 'Breda', 'Tilburg', 'Nijmegen', 'Leeuwarden', 'Emmen', 'Venlo', 'Den Bosch', 'Maastricht', 'Dordrecht'] },
  mundo: { a: ['Real', 'Inter', 'Atlético', 'Sporting', 'Dynamo', 'Olympic', 'Racing', 'Imperial'], b: ['Tordesillas', 'New Lisbon', 'New York', 'Tokyo', 'Cairo', 'Old Madrid', 'Monte Alto', 'Porto Frio', 'Sydney', 'Buenos Aires', 'South Munich', 'North Doha'] },
};
// clubes conhecidos com uma pequena mudança criativa no nome — [nome, cor1, cor2], do mais forte para o mais fraco
// cada país: lista de divisões da MAIS BAIXA para a MAIS ALTA (mesma ordem de PAISES[].divs)
const CLUBES_PAIS = {
  brasil: [
    [['Juventos da Mooca', '#8a1a2a', '#ffffff'], ['Bangüê', '#d42a2a', '#ffffff'], ['Madureirinha', '#f0c030', '#1a4ad9'], ['Amérikinha do Rio', '#d42a2a', '#ffffff'], ['Olarya', '#1a4ad9', '#ffffff'], ['XVI de Piracicaba', '#1a1a1a', '#ffffff'], ['São Cristóvinho', '#ffffff', '#1a1a1a'], ['Tuna Lusa', '#d42a2a', '#1a8a3a'], ['Nacionau Paulista', '#1a4ad9', '#ffffff'], ['Íbiscoito', '#d42a2a', '#1a1a1a']],
    [['Náutyco', '#d42a2a', '#ffffff'], ['Santa Cruiz', '#1a1a1a', '#d42a2a'], ['Remador', '#1a2a6a', '#ffffff'], ['Figueirensse', '#1a1a1a', '#ffffff'], ['Portuguesinha', '#d42a2a', '#1a8a3a'], ['ABCD', '#1a1a1a', '#ffffff'], ['CRBzinho', '#d42a2a', '#ffffff'], ['CSÁ', '#1a4ad9', '#ffffff'], ['Ferroviárya', '#8a1a2a', '#ffffff'], ['Botafogo Paulistinha', '#d42a2a', '#ffffff']],
    [['Coritibinha', '#1a6a3a', '#ffffff'], ['Goyás', '#1a8a3a', '#ffffff'], ['Amérika Mineiro', '#1a8a3a', '#1a1a1a'], ['Chapecoensse', '#1a8a3a', '#ffffff'], ['Cuiabalá', '#f0c030', '#1a8a3a'], ['Ponte Pretinha', '#1a1a1a', '#ffffff'], ['Guaranim', '#1a8a3a', '#ffffff'], ['Avahy', '#1a4ad9', '#ffffff'], ['Criciúmba', '#f0c030', '#1a1a1a'], ['Paysandoo', '#6ab0e0', '#ffffff']],
    [['Vasco da Grama', '#1a1a1a', '#ffffff'], ['Sanctos', '#ffffff', '#1a1a1a'], ['Bahêa', '#1a4ad9', '#d42a2a'], ['Fortaleiza', '#d42a2a', '#1a4ad9'], ['Atlético Paranaensse', '#d42a2a', '#1a1a1a'], ['Bragantinho', '#ffffff', '#d42a2a'], ['Sporte Recife', '#d42a2a', '#1a1a1a'], ['Siará', '#1a1a1a', '#ffffff'], ['Vitóriah', '#d42a2a', '#1a1a1a'], ['Juventudi', '#1a8a3a', '#ffffff']],
    [['Framengo', '#d42a2a', '#1a1a1a'], ['Palmeiral', '#1a8a3a', '#ffffff'], ['Atlético Mineirinho', '#1a1a1a', '#ffffff'], ['Botafofo', '#1a1a1a', '#ffffff'], ['São Paolo', '#ffffff', '#d42a2a'], ['Curintchians', '#ffffff', '#1a1a1a'], ['Flumineense', '#8a1a2a', '#1a8a3a'], ['Grêmyo', '#3aa0e0', '#1a1a1a'], ['Internacionau', '#d42a2a', '#ffffff'], ['Cruzeyro', '#1a4ad9', '#ffffff']],
  ],
  egito: [
    [['El Gunna', '#1a4ad9', '#ffffff'], ['Farcô', '#1a4ad9', '#f0c030'], ['Gazel El Mahalla', '#ffffff', '#1a4ad9'], ['Talaea El Gaixa', '#d42a2a', '#ffffff'], ['Modérn Sport', '#1a1a1a', '#f0c030'], ['Banco Nacionau', '#1a4ad9', '#f0c030'], ['Haras El Hodud', '#f0c030', '#1a8a3a'], ['Assuã SC', '#1a8a3a', '#ffffff'], ['Petrojato', '#ffffff', '#1a4ad9'], ['Arab Construtoras', '#f0c030', '#1a1a1a']],
    [['Al Ahlyy', '#d42a2a', '#ffffff'], ['Zamaleque', '#ffffff', '#d42a2a'], ['Piramidões FC', '#1a2a6a', '#ffffff'], ['Al Masrinho', '#1a8a3a', '#ffffff'], ['Ismaíly', '#f0c030', '#1a4ad9'], ['Futurinho FC', '#1a1a1a', '#d42a2a'], ['Smouhá', '#6ab0e0', '#ffffff'], ['ENPIPI', '#1a4ad9', '#d42a2a'], ['Itihadd Alexandria', '#1a8a3a', '#ffffff'], ['Cleópatra Cerâmicas', '#f0a030', '#1a1a1a']],
  ],
  japao: [
    [['Kashiwa Reisol', '#f0c030', '#1a1a1a'], ['Shimizu S-Pulso', '#ff8a1a', '#ffffff'], ['Júbilo Iwatá', '#6ab0e0', '#ffffff'], ['Consadoli Sapporo', '#d42a2a', '#1a1a1a'], ['Albirécs Niigata', '#ff8a1a', '#1a4ad9'], ['Sagão Tosu', '#3aa0e0', '#ff5ab0'], ['Shonan Belmarre', '#1a8a3a', '#6ab0e0'], ['Kyoto Sangá', '#7a2ad9', '#ffffff'], ['Avispinha Fukuoka', '#1a2a6a', '#ffffff'], ['Tokyo Verdinho', '#1a8a3a', '#ffffff']],
    [['Kashima Antlérs', '#8a1a2a', '#1a2a6a'], ['Urawa Redz', '#d42a2a', '#ffffff'], ['Yokohama Marinhos', '#1a4ad9', '#ffffff'], ['Kawasaki Frontalle', '#3aa0e0', '#1a1a1a'], ['Vissél Kobe', '#8a1a2a', '#ffffff'], ['Sanfreche Hiroshima', '#7a2ad9', '#ffffff'], ['Gambá Osaka', '#1a4ad9', '#1a1a1a'], ['Cerejo Osaka', '#ff5ab0', '#1a2a6a'], ['Nagoya Grampos', '#d42a2a', '#f0c030'], ['FC Tokyu', '#1a4ad9', '#d42a2a']],
  ],
  catar: [
    [['Al Korr', '#1a4ad9', '#f0c030'], ['Al Sailya', '#8a1a2a', '#ffffff'], ['Muaitherr', '#d42a2a', '#ffffff'], ['Al Marquia', '#1a8a3a', '#ffffff'], ['Lusaiú', '#8a1538', '#ffffff'], ['Al Xahania', '#1a1a1a', '#f0c030'], ['Mesaimir', '#ff8a1a', '#ffffff'], ['Al Caraitiyat', '#8a1538', '#f0c030'], ['Uni Qatarr', '#1a2a6a', '#ffffff'], ['Al Bida', '#6ab0e0', '#ffffff']],
    [['Al Sadi', '#ffffff', '#1a1a1a'], ['Al Duhaiu', '#d42a2a', '#ffffff'], ['Al Raiã', '#d42a2a', '#ffffff'], ['Al Garrafa', '#1a4ad9', '#f0c030'], ['Al Arabinho', '#d42a2a', '#ffffff'], ['Al Wacra', '#6ab0e0', '#ffffff'], ['Qatarzinho SC', '#f0c030', '#1a8a3a'], ['Umm Salaú', '#8a1a2a', '#ffffff'], ['Al Ahlí', '#1a8a3a', '#ffffff'], ['Al Xamal', '#1a2a6a', '#ffffff']],
  ],
  eua: [
    [['Orlando Citty', '#7a2ad9', '#ffffff'], ['Austim FC', '#1a8a3a', '#1a1a1a'], ['Nashvile SC', '#f0c030', '#1a2a6a'], ['FC Cincinatti', '#ff8a1a', '#1a2a6a'], ['Torontto FC', '#d42a2a', '#ffffff'], ['Sporting Kansas', '#6ab0e0', '#1a2a6a'], ['Real Sal Lake', '#d42a2a', '#1a2a6a'], ['Houston Dínamo', '#ff8a1a', '#1a1a1a'], ['Chicago Fogo', '#d42a2a', '#ffffff'], ['DC Unidos', '#1a1a1a', '#d42a2a']],
    [['LA Galaxxy', '#ffffff', '#1a2a6a'], ['Inter Miamy', '#ff5ab0', '#1a1a1a'], ['LAFCê', '#1a1a1a', '#f0c030'], ['Seattle Sounderz', '#1a8a3a', '#1a4ad9'], ['Atlanta Unidos', '#d42a2a', '#1a1a1a'], ['NY Red Touros', '#d42a2a', '#ffffff'], ['NYC FCê', '#6ab0e0', '#1a2a6a'], ['Columbus Crú', '#f0c030', '#1a1a1a'], ['Filadélfia Union', '#1a2a6a', '#f0c030'], ['Portland Timbérs', '#1a6a3a', '#f0c030']],
  ],
  portugal: [
    [['Portimonensse', '#1a1a1a', '#ffffff'], ['Chavinhas', '#1a4ad9', '#d42a2a'], ['Tondelha', '#1a8a3a', '#f0c030'], ['Feirensse', '#1a4ad9', '#ffffff'], ['Leixõezinhos', '#d42a2a', '#ffffff'], ['Penafieu', '#d42a2a', '#1a1a1a'], ['Estrela Amadorra', '#d42a2a', '#1a8a3a'], ['Casa Pía', '#1a1a1a', '#ffffff'], ['Olhanensse', '#d42a2a', '#1a1a1a'], ['Varzinho', '#1a1a1a', '#ffffff']],
    [['Marítymo', '#1a8a3a', '#d42a2a'], ['Nacionau da Madeira', '#1a1a1a', '#ffffff'], ['Belenensses', '#1a4ad9', '#ffffff'], ['Académika', '#1a1a1a', '#ffffff'], ['Vitória Setúbau', '#1a8a3a', '#ffffff'], ['Farensse', '#1a1a1a', '#ffffff'], ['Aroucca', '#f0c030', '#1a4ad9'], ['Moreirensse', '#1a8a3a', '#ffffff'], ['Passos de Ferreira', '#f0c030', '#1a8a3a'], ['Santa Clarinha', '#d42a2a', '#ffffff']],
    [['Benfika', '#d42a2a', '#ffffff'], ['FC Portu', '#1a4ad9', '#ffffff'], ['Sportingue', '#1a8a3a', '#ffffff'], ['Braguinha', '#d42a2a', '#ffffff'], ['Vitória Guimarãis', '#ffffff', '#1a1a1a'], ['Boavistta', '#1a1a1a', '#ffffff'], ['Rio Avê', '#1a8a3a', '#ffffff'], ['Famalicãozinho', '#1a2a6a', '#ffffff'], ['Gil Vicentte', '#d42a2a', '#1a4ad9'], ['Estorilzinho', '#f0c030', '#1a4ad9']],
  ],
  espanha: [
    [['Sporting Gijom', '#d42a2a', '#ffffff'], ['Real Ovieda', '#1a4ad9', '#ffffff'], ['Granadinha', '#d42a2a', '#ffffff'], ['Cádis', '#f0c030', '#1a4ad9'], ['Alavês', '#1a4ad9', '#ffffff'], ['Las Palmitas', '#f0c030', '#1a4ad9'], ['Elxe', '#ffffff', '#1a8a3a'], ['Racing Santanderr', '#1a8a3a', '#ffffff'], ['Tenerifi', '#1a4ad9', '#ffffff'], ['Almeríta', '#d42a2a', '#ffffff']],
    [['Deportivo La Corunha', '#1a4ad9', '#ffffff'], ['Espanyolo', '#1a4ad9', '#ffffff'], ['Getafê', '#1a4ad9', '#ffffff'], ['Osasunna', '#d42a2a', '#1a2a6a'], ['Málagua', '#1a4ad9', '#ffffff'], ['Mayorca', '#d42a2a', '#1a1a1a'], ['Raio Vallecano', '#ffffff', '#d42a2a'], ['Gironna', '#d42a2a', '#ffffff'], ['Real Saragoça', '#1a4ad9', '#ffffff'], ['Levanttis', '#1a2a6a', '#8a1a2a']],
    [['Real Madrís', '#ffffff', '#7a2ad9'], ['Barcelonha', '#1a2a6a', '#8a1a2a'], ['Atlético de Madrís', '#d42a2a', '#ffffff'], ['Sevylla', '#ffffff', '#d42a2a'], ['Real Sociedá', '#1a4ad9', '#ffffff'], ['Athletic Bilbau', '#d42a2a', '#ffffff'], ['Villarreau', '#f0c030', '#1a4ad9'], ['Real Bettis', '#1a8a3a', '#ffffff'], ['Valênsia', '#ffffff', '#1a1a1a'], ['Celtinha de Vigo', '#6ab0e0', '#ffffff']],
  ],
  italia: [
    [['Barri', '#ffffff', '#d42a2a'], ['Salernitanna', '#8a1a2a', '#ffffff'], ['Brescya', '#1a4ad9', '#ffffff'], ['Cremonesse', '#d42a2a', '#7a7a7a'], ['Spezzia', '#ffffff', '#1a1a1a'], ['Venezzia', '#ff8a1a', '#1a8a3a'], ['Frosinonne', '#f0c030', '#1a4ad9'], ['Comò 1907', '#1a4ad9', '#ffffff'], ['Pisa Torta', '#1a1a1a', '#1a4ad9'], ['Monzza', '#d42a2a', '#ffffff']],
    [['Sampdorya', '#1a4ad9', '#ffffff'], ['Genoá', '#8a1a2a', '#1a2a6a'], ['Udinesse', '#1a1a1a', '#ffffff'], ['Sassuollo', '#1a8a3a', '#1a1a1a'], ['Parmesão', '#f0c030', '#1a4ad9'], ['Veronna', '#f0c030', '#1a2a6a'], ['Cagliary', '#8a1a2a', '#1a2a6a'], ['Empolli', '#1a4ad9', '#ffffff'], ['Palermmo', '#ff5ab0', '#1a1a1a'], ['Lecci', '#f0c030', '#d42a2a']],
    [['Juventos', '#ffffff', '#1a1a1a'], ['Internazionalle', '#1a2a6a', '#1a1a1a'], ['AC Mylan', '#d42a2a', '#1a1a1a'], ['Nápolis', '#6ab0e0', '#ffffff'], ['Atalantta', '#1a1a1a', '#1a4ad9'], ['Romma', '#8a1a2a', '#f0a030'], ['Lazzio', '#6ab0e0', '#ffffff'], ['Fiorentinna', '#7a2ad9', '#ffffff'], ['Bolonhesa', '#d42a2a', '#1a2a6a'], ['Torinno', '#8a1a2a', '#ffffff']],
  ],
  alemanha: [
    [['Fortuna Düsseldorfe', '#d42a2a', '#ffffff'], ['Kaiserslauterno', '#d42a2a', '#ffffff'], ['São Pauli', '#5a3a1a', '#ffffff'], ['Karlsruher SK', '#1a4ad9', '#ffffff'], ['Bochumm', '#1a4ad9', '#ffffff'], ['Darmstad', '#1a4ad9', '#ffffff'], ['Paderborno', '#1a2a6a', '#1a1a1a'], ['Heidenheimm', '#d42a2a', '#1a4ad9'], ['Armínia Bielefelde', '#1a4ad9', '#1a1a1a'], ['Dínamo Dresda', '#f0c030', '#1a1a1a']],
    [['Hamburguer SV', '#1a4ad9', '#ffffff'], ['Hertha Berlim', '#1a4ad9', '#ffffff'], ['Colônia FC', '#ffffff', '#d42a2a'], ['Friburgo SC', '#d42a2a', '#1a1a1a'], ['Hoffenheimm', '#1a4ad9', '#ffffff'], ['Union Berlim', '#d42a2a', '#ffffff'], ['Mainzz 05', '#d42a2a', '#ffffff'], ['Augsburg', '#d42a2a', '#1a8a3a'], ['Hannover 97', '#d42a2a', '#1a1a1a'], ['Nuremberga', '#8a1a2a', '#1a1a1a']],
    [['Bayernn München', '#d42a2a', '#ffffff'], ['Borússia Dortmundo', '#f0c030', '#1a1a1a'], ['Bayer Leverkuzen', '#d42a2a', '#1a1a1a'], ['RB Leipzigue', '#ffffff', '#d42a2a'], ['Eintracht Frankfurte', '#1a1a1a', '#d42a2a'], ['Stuttgartt', '#ffffff', '#d42a2a'], ['Wolfsburgo', '#1a8a3a', '#ffffff'], ['Gladbachinho', '#ffffff', '#1a8a3a'], ['Werder Bremmen', '#1a8a3a', '#ffffff'], ['Schalke 05', '#1a4ad9', '#ffffff']],
  ],
  inglaterra: [
    [['Burnlei', '#8a1a2a', '#6ab0e0'], ['Watfordd', '#f0c030', '#d42a2a'], ['Norwichi', '#f0c030', '#1a8a3a'], ['Middlesbrô', '#d42a2a', '#ffffff'], ['Sheffield Unaited', '#d42a2a', '#ffffff'], ['Blackburno', '#1a4ad9', '#ffffff'], ['Derby Countri', '#ffffff', '#1a1a1a'], ['Ipswichi', '#1a4ad9', '#ffffff'], ['Queens Park Rangérs', '#1a4ad9', '#ffffff'], ['Bristol Citty', '#d42a2a', '#ffffff']],
    [['Leeds Unaited', '#ffffff', '#f0c030'], ['Leicestter', '#1a4ad9', '#ffffff'], ['Lobos de Wolverhampton', '#f0a030', '#1a1a1a'], ['Palácio de Cristal', '#1a4ad9', '#d42a2a'], ['Nottingham Floresta', '#d42a2a', '#ffffff'], ['Brightom', '#1a4ad9', '#ffffff'], ['Fulhamm', '#ffffff', '#1a1a1a'], ['Brentfordd', '#d42a2a', '#ffffff'], ['Southamptom', '#d42a2a', '#ffffff'], ['Sunderlandia', '#d42a2a', '#ffffff']],
    [['Manchester Citty', '#6ab0e0', '#ffffff'], ['Liverpúl', '#d42a2a', '#ffffff'], ['Arsenau', '#d42a2a', '#ffffff'], ['Chelsi', '#1a4ad9', '#ffffff'], ['Manchester Unaited', '#d42a2a', '#1a1a1a'], ['Newcastello', '#1a1a1a', '#ffffff'], ['Totenhamm', '#ffffff', '#1a2a6a'], ['Aston Vila', '#8a1a2a', '#6ab0e0'], ['West Hamm', '#8a1a2a', '#6ab0e0'], ['Evertão', '#1a4ad9', '#ffffff']],
  ],
  argentina: [
    [['Huracánn', '#ffffff', '#d42a2a'], ['Lanúss', '#8a1a2a', '#ffffff'], ['Banfieldd', '#1a8a3a', '#ffffff'], ['Argentinos Juniorz', '#d42a2a', '#ffffff'], ['Gimnasia La Platta', '#ffffff', '#1a2a6a'], ['Colón de Santa Fé', '#d42a2a', '#1a1a1a'], ['Unión de Santa Fé', '#d42a2a', '#ffffff'], ['Quilmez', '#ffffff', '#1a2a6a'], ['Chacarita Juniorz', '#d42a2a', '#1a1a1a'], ['Tigrê', '#1a4ad9', '#d42a2a']],
    [['Boca Juniorz', '#1a2a6a', '#f0c030'], ['Ríver Plata', '#ffffff', '#d42a2a'], ['Racing Clube', '#6ab0e0', '#ffffff'], ['Independientte', '#d42a2a', '#ffffff'], ['San Lorenço', '#1a2a6a', '#d42a2a'], ['Estudiantis', '#d42a2a', '#ffffff'], ['Vélez Sarsfieldd', '#ffffff', '#1a4ad9'], ["Newell's Old Boyz", '#d42a2a', '#1a1a1a'], ['Rosário Centrau', '#1a4ad9', '#f0c030'], ['Tayeres de Córdoba', '#1a2a6a', '#ffffff']],
  ],
  franca: [
    [['Sochauxx', '#f0c030', '#1a2a6a'], ['Nancyê', '#d42a2a', '#ffffff'], ['Caenn', '#1a2a6a', '#d42a2a'], ['Guingampê', '#d42a2a', '#1a1a1a'], ['Bastiá', '#1a4ad9', '#ffffff'], ['Amiênss', '#ffffff', '#1a1a1a'], ['Valenciennê', '#d42a2a', '#ffffff'], ['Dijonn', '#d42a2a', '#ffffff'], ['Niort Chamois', '#1a4ad9', '#ffffff'], ['Estrela Vermelha de Paris', '#1a8a3a', '#ffffff']],
    [['Saint-Étiennê', '#1a8a3a', '#ffffff'], ['Girondinos de Bordéus', '#1a2a6a', '#ffffff'], ['Montpelliê', '#1a2a6a', '#ff8a1a'], ['Toulousê', '#7a2ad9', '#ffffff'], ['Auxerrê', '#ffffff', '#1a4ad9'], ['Metzê', '#8a1a2a', '#ffffff'], ['Stade de Reimss', '#d42a2a', '#ffffff'], ['Brestê', '#d42a2a', '#ffffff'], ['Angers SCO', '#1a1a1a', '#ffffff'], ['Le Havrê', '#6ab0e0', '#1a2a6a']],
    [['Paris Saint-Germã', '#1a2a6a', '#d42a2a'], ['Olympique de Marselha', '#ffffff', '#6ab0e0'], ['Olympique Lyonês', '#ffffff', '#1a4ad9'], ['Mônaco AS', '#d42a2a', '#ffffff'], ['Lillê', '#d42a2a', '#1a2a6a'], ['Stade Rennês', '#d42a2a', '#1a1a1a'], ['Nicê', '#d42a2a', '#1a1a1a'], ['Lensê', '#f0c030', '#d42a2a'], ['Nantis', '#f0c030', '#1a8a3a'], ['Estrasburgo', '#1a4ad9', '#ffffff']],
  ],
  china: [null, [['Shanghai Portô', '#d42a2a', '#ffffff'], ['Shandong Taishão', '#ff8a1a', '#1a1a1a'], ['Beijing Guoã', '#1a8a3a', '#ffffff'], ['Guangzhou Tigres do Sul', '#d42a2a', '#f0c030'], ['Wuhan Três Cidades', '#1a4ad9', '#ffffff'], ['Chengdu Rongchen', '#d42a2a', '#1a1a1a'], ['Tianjin Tigre', '#1a4ad9', '#f0c030'], ['Shanghai Shenhuá', '#1a4ad9', '#ffffff'], ['Zhejiang Verde', '#1a8a3a', '#ffffff'], ['Changchun Yatai', '#ff8a1a', '#ffffff']]],
  arabia: [null, [['Al Hilaal', '#1a4ad9', '#ffffff'], ['Al Nassar', '#f0c030', '#1a4ad9'], ['Al Ittihaad', '#f0c030', '#1a1a1a'], ['Al Ahlii Jidá', '#1a8a3a', '#ffffff'], ['Al Shabaab', '#ffffff', '#1a1a1a'], ['Al Ettifaq', '#1a8a3a', '#d42a2a'], ['Al Fateh', '#1a4ad9', '#ffffff'], ['Al Taawon', '#f0c030', '#ffffff'], ['Al Fayha', '#ff8a1a', '#1a4ad9'], ['Damac Abha', '#d42a2a', '#f0c030']]],
  colombia: [null, [['Atlético Nacionau', '#1a8a3a', '#ffffff'], ['Millonários', '#1a4ad9', '#ffffff'], ['América de Calli', '#d42a2a', '#ffffff'], ['Deportivo Calli', '#1a8a3a', '#ffffff'], ['Júnior Barranquila', '#d42a2a', '#ffffff'], ['Santa Fé Bogotá', '#d42a2a', '#ffffff'], ['Independente Medellín', '#d42a2a', '#1a4ad9'], ['Once Caldass', '#ffffff', '#1a1a1a'], ['Tolimá', '#8a1a2a', '#f0c030'], ['Pereirá', '#f0c030', '#d42a2a']]],
  uruguai: [null, [['Peñarou', '#f0c030', '#1a1a1a'], ['Nacionau de Montevidéu', '#ffffff', '#1a4ad9'], ['Defensor Esportin', '#7a2ad9', '#ffffff'], ['Danubiô', '#ffffff', '#1a1a1a'], ['Liverpúl de Montevidéu', '#1a1a1a', '#1a4ad9'], ['Wanderers Montevidéu', '#ffffff', '#1a1a1a'], ['River Plate Montevidéu', '#d42a2a', '#ffffff'], ['Cerro Largô', '#1a4ad9', '#ffffff'], ['Phoenix', '#7a2ad9', '#ffffff'], ['Progresso', '#d42a2a', '#f0c030']]],
  mexico: [null, [['Clube Amérika', '#f0c030', '#1a4ad9'], ['Chivás', '#d42a2a', '#ffffff'], ['Cruz Azúl', '#1a4ad9', '#ffffff'], ['Tigres de Nuevo León', '#f0c030', '#1a4ad9'], ['Monterrey Rayados', '#1a2a6a', '#ffffff'], ['Pumas da Capital', '#1a2a6a', '#f0c030'], ['Toluca Diablos', '#d42a2a', '#ffffff'], ['León Esmeralda', '#1a8a3a', '#ffffff'], ['Pachuca Tuzos', '#1a4ad9', '#ffffff'], ['Santos Laguna', '#1a8a3a', '#ffffff']]],
  escocia: [null, [['Celtik', '#1a8a3a', '#ffffff'], ['Rangérs', '#1a4ad9', '#ffffff'], ['Aberdín', '#d42a2a', '#ffffff'], ['Hearts de Edimburgo', '#8a1a2a', '#ffffff'], ['Hibernián', '#1a8a3a', '#ffffff'], ['Dundee Unaited', '#ff8a1a', '#1a1a1a'], ['Motherwéll', '#f0c030', '#8a1a2a'], ['Kilmarnók', '#1a4ad9', '#ffffff'], ['St. Mirrén', '#1a1a1a', '#ffffff'], ['Ross Countri', '#1a2a6a', '#d42a2a']]],
  turquia: [null, null, [['Galatasarai', '#d42a2a', '#f0c030'], ['Fenerbahçê', '#f0c030', '#1a2a6a'], ['Besiktás', '#1a1a1a', '#ffffff'], ['Trabzonspôr', '#8a1a2a', '#6ab0e0'], ['Basaksehír', '#ff8a1a', '#1a2a6a'], ['Konyaspôr', '#1a8a3a', '#ffffff'], ['Antalyaspôr', '#d42a2a', '#ffffff'], ['Kasimpasá', '#1a2a6a', '#ffffff'], ['Sivasspôr', '#d42a2a', '#ffffff'], ['Alanyaspôr', '#ff8a1a', '#1a8a3a']]],
  belgica: [null, null, [['Club Bruges', '#1a4ad9', '#1a1a1a'], ['Anderléchti', '#7a2ad9', '#ffffff'], ['Genk Racing', '#1a4ad9', '#ffffff'], ['Antuérpia Royal', '#d42a2a', '#ffffff'], ['Standard de Liège', '#d42a2a', '#ffffff'], ['Gent Búfalos', '#1a4ad9', '#ffffff'], ['Union Saint-Gilles', '#f0c030', '#1a4ad9'], ['Charleroí', '#1a1a1a', '#ffffff'], ['Mechelén', '#d42a2a', '#f0c030'], ['Cercle Bruges', '#1a8a3a', '#1a1a1a']]],
  holanda: [null, null, [['Ajáx', '#ffffff', '#d42a2a'], ['PSV Eindhovén', '#d42a2a', '#ffffff'], ['Feyenoordi', '#d42a2a', '#1a1a1a'], ['AZ Alkmar', '#d42a2a', '#ffffff'], ['Twenté', '#d42a2a', '#ffffff'], ['Utrecht FC', '#d42a2a', '#ffffff'], ['Vitésse', '#f0c030', '#1a1a1a'], ['Heerenveen Frísio', '#1a4ad9', '#ffffff'], ['Groningên', '#1a8a3a', '#ffffff'], ['Sparta Roterdã', '#d42a2a', '#ffffff']]],
  mundo: [
    [['Real Madrís', '#ffffff', '#7a2ad9'], ['Manchester Citty', '#6ab0e0', '#ffffff'], ['Bayernn München', '#d42a2a', '#ffffff'], ['Barcelonha', '#1a2a6a', '#8a1a2a'], ['Liverpúl', '#d42a2a', '#ffffff'], ['Juventos', '#ffffff', '#1a1a1a'], ['Framengo', '#d42a2a', '#1a1a1a'], ['Palmeiral', '#1a8a3a', '#ffffff'], ['Boca Juniorz', '#1a2a6a', '#f0c030'], ['Ríver Plata', '#ffffff', '#d42a2a']],
  ],
};
function nomeTimeIA(pais, r) {
  const pick = a => a[Math.floor(r() * a.length)];
  if (pais === 'brasil') return pick(PREF_T) + ' ' + pick(SUF_T);
  const n = NOMES_PAIS[pais];
  return n.c ? pick(n.b) + ' ' + pick(n.c) : pick(n.a) + ' ' + pick(n.b);
}

/* ---------------- estrutura do clube ---------------- */
const ESTRUTURA = {
  ct: { nome: 'Training Center', base: 1500, desc: n => `Practices and matches give players +${n * 30}% XP.` },
  med: { nome: 'Medical Department', base: 1200, desc: n => `Energy comes back ${n * 25}% faster and the team gets ${n * 5}% less tired.` },
  estadio: { nome: 'Stadium', base: 2000, desc: n => `Ticket sales +${Math.round(estrMult(n) * 50)}% in home games.` },
  base: { nome: 'Youth Academy', base: 1800, desc: n => `${1 + Math.ceil(n / 2)} young prospect(s) per season, potential +${n * 2}.` },
  olheiro: { nome: 'Scout Network', base: 1000, desc: n => `Market with ${6 + n} players, ${n ? '+' + n : 'no bonus'} strength.` },
  // v236: evoluções novas
  loja: { nome: 'Store & Marketing', base: 2200, desc: n => `Jersey and merch sales: +${Math.round(estrMult(n) * 15)}% of the round prize in every game.` },
  torcida: { nome: 'Fan Club Members', base: 2600, desc: n => `+${Math.round(estrMult(n, 1.35) * 6)}% ticket sales at home, and team morale never drops below ${-3 + Math.min(3, Math.ceil(n / 2))}.` },
};
const ESTR_MAX = 8; // v236: 5 → 8 níveis
// v239: as obras de renda (estádio, loja, sócio-torcedor) rendem cada vez mais por nível, acompanhando o preço (antes: +50% por nível e custo ×2,6 = nunca se pagavam)
function estrMult(n, r = 1.7) { return n > 0 ? (Math.pow(r, n) - 1) / (r - 1) : 0; }
function custoEstr(k, n) { return Math.round(ESTRUTURA[k].base * Math.pow(2.6, n)); }
const METAS = {
  campeao: { txt: 'Be the CHAMPION', ok: pos => pos === 1 },
  subir: { txt: 'Get PROMOTED (top 2)', ok: pos => pos <= 2 },
  top5: { txt: 'Finish in the top 5', ok: pos => pos <= 5 },
  escapar: { txt: 'Don\'t get relegated (stay out of the bottom 2)', ok: pos => pos <= TIMES_LIGA - 2 },
};

const CORES_TIME = ['#e03a3a', '#f8d838', '#2a4ad9', '#2ad96a', '#ffffff', '#1a1a1a', '#ff7a1a', '#7a2ad9', '#3aa0e0', '#8a1010', '#ff5ad0', '#5a3a1a'];
// v407 (Raio-X U3): apelido 'Cabeção' virou 'Cometa' (não caçoar da aparência)
const NOMES_J = ['Zeca', 'Tonho', 'Luan', 'Biel', 'Caio', 'Davi', 'Rafa', 'Gui', 'Nando', 'Tuca', 'Neném', 'Pipoca', 'Foguinho', 'Carlinhos', 'Miltinho', 'Jajá', 'Lelê', 'Nina', 'Bia', 'Duda', 'Mari', 'Juju', 'Lari', 'Tati', 'Gabi', 'Téo', 'Kadu', 'Vini', 'Leco', 'Dedé', 'Fumaça', 'Tatu', 'Paçoca', 'Magrão', 'Baixinho', 'Alemão', 'Comet', 'Formiga', 'Bolinha', 'Russo', 'Ceará', 'Paraíba', 'Tchê', 'Mineiro', 'Carioca', 'White', 'Pretinho', 'Sorriso', 'Canela', 'Faísca', 'Sabiá', 'Tiziu', 'Bambu', 'Jacaré', 'Xodó', 'Pingo', 'Taco', 'Toquinho', 'Lampião', 'Marreco'];
// nomes por gênero (menino/menina), para o visual combinar com o nome
const NOMES_J_F = ['Nina', 'Bia', 'Duda', 'Mari', 'Juju', 'Lari', 'Tati', 'Gabi', 'Lelê', 'Ana', 'Júlia', 'Clara', 'Malu', 'Manu', 'Isa', 'Lara', 'Bela', 'Jade', 'Luna', 'Maya', 'Cris', 'Dani', 'Marta'];
const NOMES_J_M = NOMES_J.filter(n => !NOMES_J_F.includes(n));
const CABELOS_M = ['cabelo-curto', 'cabelo-cacheado', 'cabelo-black-power', 'cabelo-moicano', 'cabelo-topete'], CABELOS_F = ['cabelo-liso-longo', 'cabelo-coque', 'cabelo-rabo', 'cabelo-cacheado', 'cabelo-black-power'];
const PREF_T = ['Esporte Clube', 'Grêmio', 'Atlético', 'Unidos do', 'Sociedade Esportiva', 'Real', 'Independente', 'Juventude do', 'Estrela do', 'Operário', 'Ferroviário', 'Associação', 'Clube Atlético', 'União do'];
const SUF_T = ['Campinho', 'Poeirão', 'Morro Alto', 'Ladeira', 'Pombal', 'Coqueiral', 'Areia Branca', 'Serra Azul', 'Rio Seco', 'Pedra Lisa', 'Lagoa Verde', 'Cajueiro', 'Mangueiral', 'Ventania', 'Trovão', 'Beira-Mar', 'Vale Verde', 'Alto da Colina', 'Barro Vermelho', 'Pau-Brasil', 'Sol Nascente', 'Quebra-Canela', 'Boa Vista', 'Porto Alegre do Norte', 'Ribeirão Fundo', 'Chapadão', 'Maracujá', 'Bananal', 'Jatobá', 'Ipê Amarelo', 'Buriti', 'Cachoeirinha', 'Pedra Branca', 'Vila Nova', 'Canoas', 'Monte Verde', 'Três Coqueiros', 'Carnaubal', 'Sertãozinho', 'Mangue Seco', 'Arraial', 'Ponte Velha', 'Siriema', 'Tucano', 'Jabuticabal', 'Morro do Sabiá', 'Lajedo', 'Aroeira'];
const LENDAS = {
  tonhao: { pos: 'ZAG', atq: 30, def: 56, pas: 36, fis: 60, pot: 72, preco: 3000 },
  rei_areia: { pos: 'ATA', atq: 66, def: 22, pas: 50, fis: 62, pot: 80, preco: 9000 },
  rei_quadra: { pos: 'MEI', atq: 70, def: 32, pas: 74, fis: 60, pot: 86, preco: 18000 },
  capitao_sub20: { pos: 'VOL', atq: 55, def: 80, pas: 78, fis: 80, pot: 92, preco: 35000 },
  paredao: { pos: 'GOL', atq: 20, def: 94, pas: 60, fis: 86, pot: 99, preco: 70000 },
};

function nomeDivisao(d) { return (DIVS[d] || DIVS[0]).nome; }
function nomeDivisaoPais(d) { const x = DIVS[d] || DIVS[0]; return x.pais === 'brasil' ? `${x.nome} (Brazil)` : x.nome; }
function bandeira(pid) {
  const p = PAIS[pid] || PAIS.brasil; const c = p.cores;
  return el('span', { class: 'bandeira', title: p.nome, style: `background:linear-gradient(${p.vert ? 'to right' : 'to bottom'},${c[0]} 0 33%,${c[1]} 33% 67%,${c[2]} 67%)` });
}
function ovr(j) {
  const w = { GOL: [0, 0.75, 0.05, 0.2], ZAG: [0.02, 0.62, 0.1, 0.26], LAT: [0.15, 0.4, 0.2, 0.25], VOL: [0.08, 0.4, 0.32, 0.2], MEI: [0.3, 0.05, 0.48, 0.17], ATA: [0.62, 0, 0.13, 0.25] }[j.pos];
  return Math.round(j.atq * w[0] + j.def * w[1] + j.pas * w[2] + j.fis * w[3]);
}
function geraJogador(pos, alvo, r = Math.random) {
  const ri = (a, b) => Math.floor(a + r() * (b - a + 1));
  const base = alvo + ri(-5, 5);
  const off = { GOL: [-40, 6, -12, -2], ZAG: [-18, 5, -10, 3], LAT: [-5, 1, -2, 3], VOL: [-10, 2, 3, 0], MEI: [3, -15, 5, -3], ATA: [6, -22, -5, 2] }[pos];
  const c = v => clamp(Math.round(v + ri(-3, 3)), 5, 99);
  const menina = r() < 0.3; const pele = AVATAR.peles[ri(0, 4)]; const cabs = menina ? CABELOS_F : CABELOS_M; const cab = { id: cabs[ri(0, cabs.length - 1)] }; const nomes = menina ? NOMES_J_F : NOMES_J_M;
  return {
    id: 'j' + Date.now().toString(36) + ri(0, 1e6).toString(36), nome: nomes[ri(0, nomes.length - 1)], pos,
    atq: c(base + off[0]), def: c(base + off[1]), pas: c(base + off[2]), fis: c(base + off[3]),
    pot: clamp(base + ri(4, 20), 20, 99), nivel: 1, xp: 0, energia: 100, idade: ri(17, 33),
    look: { corpo: menina ? 'f' : 'm', pele: pele.id, cabelo: cab.id, corCabelo: ['preto', 'castanho', 'loiro', 'ruivo', 'grisalho'][ri(0, 4)] },
  };
}
function jogadorEu() {
  const s = G.save; const st = stats(); const t = s.time;
  const pos = { atacante: 'ATA', meia: 'MEI', zagueiro: 'ZAG' }[s.posicao] || 'MEI';
  // o craque nunca fica muito atrás do próprio nível: piso de 18 + nível/2 em cada atributo
  const piso = 18 + s.nivel * 0.5; const v = x => Math.min(99, Math.round(Math.max(piso, x)));
  return {
    id: 'eu', eu: true, nome: s.nome, pos, nivel: s.nivel, energia: t ? t.energiaEu : 100,
    atq: v((st.drible + st.chute) / 2 + st.nivel * 0.3 + st.atr.habilidade * 0.25),
    def: v(st.defesa * 0.9 + st.nivel * 0.3 + st.atr.defesa * 0.25),
    pas: v(15 + st.visao * 1.6 + st.nivel * 0.4 + st.atr.inteligencia * 0.25),
    fis: v(20 + st.nivel + st.atr.folego * 0.25),
    drb: Math.min(99, Math.round(st.drible * 0.9 + st.nivel * 0.3)), chu: Math.min(99, Math.round(st.chute * 0.9 + st.nivel * 0.3)),
  };
}
function elencoCompleto() { const t = G.save.time; return [jogadorEu(), ...t.elenco]; }
function jogadorPorId(id) { return elencoCompleto().find(j => j.id === id); }
function lookJogadorTime(j, cor1, cor2) {
  if (j.eu) return { ...lookJogador(), roupa: 'roupa-futebol', corRoupa: cor1 };
  const lk = j.look || {};
  const g = typeof generoDoNome === 'function' ? generoDoNome(j.nome) : null; // saves antigos: o nome manda
  return { tipo: 'humano', corpo: g || lk.corpo || 'm', pele: lk.pele && lk.pele[0] !== '#' ? lk.pele : 'pele-media', cabelo: lk.cabelo && String(lk.cabelo).startsWith('cabelo') ? lk.cabelo : 'cabelo-curto', corCabelo: lk.corCabelo || 'preto', roupa: 'roupa-futebol', corRoupa: j.pos === 'GOL' ? '#2ad96a' : cor1, baixo: 'baixo-shorts', chapeu: j.lenda && MONSTROS[j.lendaId] ? MONSTROS[j.lendaId].look.chapeu : undefined };
}

/* ---------------- dinheiro ---------------- */
function premioForca(f) { return Math.round(120 * Math.pow(f / 26, 3.2)); }
function premioDiv(d) { return premioForca(DIVS[d].base); }
function xpDiv(d) { return Math.round(120 * Math.pow(DIVS[d].base / 26, 4)); }
// compatibilidade com código antigo
function premioVitoria(d) { return premioDiv(d); }
function xpPartida(d) { return xpDiv(d); }
function precoJogador(j) { const p = premioForca(ovr(j)); return Math.round(p * 4 + Math.max(0, j.pot - ovr(j)) * p * 0.15 + 300); }
function salario(j) { return j.eu ? 0 : Math.max(2, Math.round(premioForca(ovr(j)) * 0.05)); }
function folhaSalarial() { return G.save.time.elenco.reduce((a, j) => a + salario(j), 0); }
function limiteSaque() { return premioDiv(G.save.time.div) * 25; } // v239: era ×8
// v243: o treino libera num dia novo do jogo OU a cada 3 jogos do clube (jogando partidas seguidas o relógio quase não anda)
const TREINO_JOGOS = 3;
function faltamJogosTreino(t) { return t.jogosTreino == null ? 0 : Math.max(0, TREINO_JOGOS - ((t.jogos || 0) - t.jogosTreino)); }
function treinoLiberado(t) { return t.diaTreino !== G.save.dia || faltamJogosTreino(t) === 0; }
function custoTreino() { return Math.round(premioDiv(G.save.time.div) * 0.6); }

/* ---------------- força por setor ---------------- */
function fatorEnergia(j) { return 0.62 + 0.38 * clamp(j.energia, 0, 100) / 100; }
function setores(escalados, taticaId, moral = 0) {
  const tt = TATICAS[taticaId] || TATICAS.equilibrada;
  let atq = 0, mei = 0, def = 0, gol = 0;
  for (const { j, slot } of escalados) {
    if (!j) continue;
    let f = j.pos === slot ? 1 : (POS_COMPAT[slot] || []).includes(j.pos) ? 0.85 : 0.68;
    if (slot === 'GOL' && j.pos !== 'GOL') f = 0.4;
    f *= fatorEnergia(j);
    switch (slot) {
      case 'GOL': gol += (j.def * 0.75 + j.fis * 0.25) * f; break;
      case 'ZAG': def += (j.def * 0.8 + j.fis * 0.2) * f; mei += j.pas * 0.1 * f; break;
      case 'LAT': def += (j.def * 0.5 + j.fis * 0.2) * f; mei += j.pas * 0.2 * f; atq += j.atq * 0.25 * f; break;
      case 'VOL': def += j.def * 0.45 * f; mei += (j.pas * 0.55 + j.fis * 0.2) * f; break;
      case 'MEI': mei += (j.pas * 0.7 + j.fis * 0.1) * f; atq += j.atq * 0.5 * f; break;
      case 'ATA': atq += (j.atq * 0.9 + j.fis * 0.2) * f; mei += j.pas * 0.15 * f; break;
    }
  }
  const m = 1 + moral * 0.04;
  return { atq: atq * tt.atq * m, mei: mei * tt.mei * m, def: def * tt.def * m, gol: gol * m };
}
function escalacaoAtual() {
  const t = G.save.time; const slots = FORMACOES[t.formacao];
  return slots.map((slot, i) => ({ slot, j: jogadorPorId(t.titulares[i]) || null }));
}
function forcaTitulares() { const esc = escalacaoAtual().filter(x => x.j && !x.j.eu); return esc.length ? Math.round(esc.reduce((a, x) => a + ovrNoSlot(x.j, x.slot), 0) / esc.length) : 0; } // já desconta quem joga fora de posição
function timeIA(tm) {
  // gera os 11 do adversário a partir da semente (não precisa guardar); o -2 faz a força exibida ser a média real dos 11
  const r = mulberry(tm.seed); const slots = FORMACOES[tm.formacao || '4-4-2'];
  return slots.map((slot, i) => { const j = geraJogador(slot, tm.ovr - 2 + (i === 0 ? 2 : 0), r); j.energia = 100; return { slot, j }; });
}

/* ---------------- pirâmide, liga e copa ---------------- */
function novoTimeIA(pais, base, usados, r = Math.random, lugares = new Set()) {
  // nome inédito no país e "lugar" (última parte do nome) inédito na divisão
  let nome = '', tent = 0; const lugar = n => n.split(' ').slice(-1)[0];
  do { nome = nomeTimeIA(pais, r); tent++; } while ((usados.has(nome) || lugares.has(lugar(nome))) && tent < 80);
  usados.add(nome); lugares.add(lugar(nome));
  const c1 = CORES_TIME[Math.floor(r() * CORES_TIME.length)]; let c2 = CORES_TIME[Math.floor(r() * CORES_TIME.length)]; if (c2 === c1) c2 = c1 === '#ffffff' ? '#1a1a1a' : '#ffffff';
  return { id: 'a' + Math.floor(r() * 1e9).toString(36) + usados.size, nome, cor1: c1, cor2: c2, ovr: base + Math.round((r() - 0.5) * 10), seed: (r() * 1e9) | 0, formacao: Object.keys(FORMACOES)[Math.floor(r() * 5)], tatica: Object.keys(TATICAS)[Math.floor(r() * 5)] };
}
function gerarPiramide(pais, minhaK) {
  const usados = new Set([G.save.time.nome]);
  const reais = CLUBES_PAIS[pais];
  if (reais) return { pais, divs: PAIS[pais].divs.map(([, base], k) => {
    if (!reais[k]) { const lugares = new Set(); return Array.from({ length: k === minhaK ? TIMES_LIGA - 1 : TIMES_LIGA }, () => novoTimeIA(pais, base, usados, Math.random, lugares)); } // v236: sem clubes conhecidos nesta divisão
    // o mais forte da lista começa com força base+4, o mais fraco base-5; se você está na divisão, o último fica de fora
    const lista = reais[k].slice(0, k === minhaK ? TIMES_LIGA - 1 : TIMES_LIGA);
    return lista.map(([nome, cor1, cor2], i) => ({ ...novoTimeIA(pais, base, usados), nome, cor1, cor2, ovr: base + 4 - i + rndi(-1, 1) }));
  }) };
  return { pais, divs: PAIS[pais].divs.map(([, base], k) => { const lugares = new Set(); return Array.from({ length: k === minhaK ? TIMES_LIGA - 1 : TIMES_LIGA }, () => novoTimeIA(pais, base, usados, Math.random, lugares)); }) };
}
function gerarLiga(d) {
  const t = G.save.time; const k = DIVS[d].k;
  const times = [{ id: 'eu', nome: t.nome, cor1: t.cor1, cor2: t.cor2 }, ...t.piramide.divs[k].map(a => ({ ...a }))];
  times.forEach(x => Object.assign(x, { pts: 0, j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0 }));
  // embaralha para variar a tabela de jogos
  for (let i = times.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [times[i], times[j]] = [times[j], times[i]]; }
  // rodízio (método do círculo): n-1 rodadas, n/2 jogos cada
  const n = times.length; const idx = [...Array(n).keys()]; const rodadas = [];
  for (let rd = 0; rd < n - 1; rd++) {
    const jogos = []; for (let i = 0; i < n / 2; i++) { const a = idx[i], b = idx[n - 1 - i]; jogos.push(rd % 2 ? [b, a] : [a, b]); }
    rodadas.push(jogos); idx.splice(1, 0, idx.pop());
  }
  // returno: mesmos confrontos com mando invertido
  rodadas.push(...rodadas.map(r => r.map(([a, b]) => [b, a])));
  return { div: d, rodada: 0, times, rodadas, ultimos: [] };
}
function novaCopa() {
  const t = G.save.time; const p = PAIS[t.pais]; if (!p.copa) return null;
  const k = DIVS[t.div].k; const divs = t.piramide.divs; const n = divs.length;
  const usados = new Set();
  const pega = kk => { const l = divs[clamp(kk, 0, n - 1)].filter(a => !usados.has(a.id)); const a = l[Math.floor(Math.random() * l.length)]; usados.add(a.id); return { ...a }; };
  const advs = [pega(k - 1), pega(k), pega(k + 1)];
  // a final é contra o mais forte dos três
  advs.sort((a, b) => a.ovr - b.ovr);
  return { nome: p.copa, fase: 0, status: 'vivo', advs, res: [] };
}
function defineMeta() {
  // compara a força do time com a dos rivais da divisão: posição "esperada" na tabela
  const t = G.save.time; const d = DIVS[t.div]; const f = forcaTitulares();
  const rivais = t.piramide.divs[d.k]; const esperada = 1 + rivais.filter(a => a.ovr >= f).length;
  if (esperada <= 1) return d.topo ? 'campeao' : 'subir';
  if (esperada <= 3 && !d.topo) return 'subir';
  if (esperada <= 6) return 'top5';
  return 'escapar';
}
function fundarTime(nome, cor1, cor2) {
  const s = G.save;
  s.time = {
    nome, cor1, cor2, formacao: '4-4-2', tatica: 'equilibrada', elenco: [], titulares: [], energiaEu: 100, moral: 0, titulos: 0, temporada: 1, historico: [], mercado: [], diaMercado: 0, diaTreino: 0, ultEnergia: Date.now(), div: 0, jogos: 0, vitorias: 0,
    pais: 'brasil', nomesReais: true, caixa: 1500, patro: 1, estr: { ct: 0, med: 0, estadio: 0, base: 0, olheiro: 0, loja: 0, torcida: 0 }, base: [], trofeus: [], campeoes: {}, finTemp: { ent: 0, sai: 0 }, fin: [],
  };
  ['GOL', 'ZAG', 'ZAG', 'LAT', 'LAT', 'VOL', 'VOL', 'MEI', 'MEI', 'ATA', 'ATA'].forEach(p => s.time.elenco.push(geraJogador(p, 27)));
  s.time.piramide = gerarPiramide('brasil', 0);
  s.time.liga = gerarLiga(0); s.time.copa = novaCopa();
  autoEscalar(); s.time.meta = defineMeta();
  log(`You founded ${nome}! You start in the Sandlot League. Climb division by division up to Série A — and then conquer the world!`, 'l-lvl'); banner(nome.toUpperCase(), 'Your team has been founded!'); som('nivel');
  salvar();
}
// saves antigos (liga única de 8 times) viram a pirâmide nova
function renomeiaRivais() {
  const t = G.save.time; const reais = CLUBES_PAIS[t.pais]; if (!reais) return;
  const mapa = {};
  t.piramide.divs.forEach((lista, k) => [...lista].sort((a, b) => b.ovr - a.ovr).forEach((a, i) => { const r = reais[k] && reais[k][i]; if (!r) return; [a.nome, a.cor1, a.cor2] = r; mapa[a.id] = a; }));
  const copia = x => { const a = mapa[x.id]; if (a) { x.nome = a.nome; x.cor1 = a.cor1; x.cor2 = a.cor2; } };
  t.liga.times.forEach(copia); if (t.copa) t.copa.advs.forEach(copia);
}
function garanteTime() {
  const t = G.save.time; if (!t) return;
  if (t.pais && !t.nomesReais) { t.nomesReais = true; renomeiaRivais(); }
  if (t.pais) return;
  const k = Math.min(t.liga ? t.liga.div : 0, 4);
  Object.assign(t, { pais: 'brasil', div: k, caixa: 1500 + premioDiv(k) * 10, patro: 1, estr: { ct: 0, med: 0, estadio: 0, base: 0, olheiro: 0 }, base: [], trofeus: [], campeoes: {}, finTemp: { ent: 0, sai: 0 }, fin: [] });
  t.piramide = gerarPiramide('brasil', k); t.liga = gerarLiga(k); t.copa = novaCopa(); t.meta = defineMeta(); t.nomesReais = true;
  log(`New league system! ${t.nome} has joined the ${nomeDivisaoPais(k)} with 10 teams, a national cup and its own club funds.`, 'l-lvl');
}
function autoEscalar() {
  const t = G.save.time; const slots = FORMACOES[t.formacao]; const usados = new Set(); const tit = [];
  const todos = elencoCompleto();
  // você sempre joga (é o craque do time)
  const eu = todos[0]; let iEu = slots.indexOf(eu.pos); if (iEu < 0) iEu = slots.findIndex(s => (POS_COMPAT[s] || []).includes(eu.pos)); if (iEu < 0) iEu = slots.length - 1;
  slots.forEach((slot, i) => {
    if (i === iEu) { tit[i] = 'eu'; usados.add('eu'); return; }
    const cand = todos.filter(j => !usados.has(j.id) && !j.eu).map(j => ({ j, v: ovrNoSlot(j, slot) * fatorEnergia(j) })).sort((a, b) => b.v - a.v);
    if (cand[0]) { tit[i] = cand[0].j.id; usados.add(cand[0].j.id); } else tit[i] = null;
  });
  t.titulares = tit;
}
function ovrNoSlot(j, slot) { const o = ovr({ ...j, pos: slot }); const f = j.pos === slot ? 1 : (POS_COMPAT[slot] || []).includes(j.pos) ? 0.85 : 0.68; return o * (slot === 'GOL' && j.pos !== 'GOL' ? 0.4 : f); }
function recuperaEnergia() {
  const t = G.save.time; if (!t) return; const agora = Date.now();
  if (G.save.treinoOn) { t.ultEnergia = agora; return; } // v225: com o Modo Treino (calendário parado) o time NÃO descansa
  const min = (agora - (t.ultEnergia || agora)) / 60000; t.ultEnergia = agora;
  const ganho = min * 12 * (1 + 0.25 * ((t.estr && t.estr.med) || 0)); // 12 pontos por minuto real
  t.elenco.forEach(j => j.energia = Math.min(100, j.energia + ganho)); t.energiaEu = Math.min(100, (Number.isFinite(t.energiaEu) ? t.energiaEu : 100) + ganho);
}

/* ---------------- simulação ---------------- */
function simRapida(A, B) { // retorna [golsA, golsB]
  let ga = 0, gb = 0;
  for (let i = 0; i < 16; i++) { const r = lance(A, B); if (r.gol) r.atacaA ? ga++ : gb++; }
  return [ga, gb];
}
function lance(A, B) {
  const pa = Math.pow(A.mei, 2) / (Math.pow(A.mei, 2) + Math.pow(B.mei, 2));
  const atacaA = Math.random() < pa; const X = atacaA ? A : B, Y = atacaA ? B : A;
  const q = Math.pow(X.atq, 1.6) / (Math.pow(X.atq, 1.6) + Math.pow(Y.def * 0.9, 1.6));
  if (Math.random() > 0.35 + 0.5 * q) return { atacaA, tipo: 'desarme' };
  const gkF = 1 - 0.45 * Y.gol / (Y.gol + X.atq / 3.5);
  const pGol = 0.65 * Math.pow(q, 1.1) * gkF;
  const r = Math.random();
  if (r < pGol) return { atacaA, tipo: 'gol', gol: true };
  if (r < pGol + 0.3) return { atacaA, tipo: 'defesa' };
  return { atacaA, tipo: 'fora' };
}
function registraJogo(liga, ia, ib, ga, gb) {
  const a = liga.times[ia], b = liga.times[ib];
  a.j++; b.j++; a.gp += ga; a.gc += gb; b.gp += gb; b.gc += ga;
  if (ga > gb) { a.v++; b.d++; a.pts += 3; } else if (gb > ga) { b.v++; a.d++; b.pts += 3; } else { a.e++; b.e++; a.pts++; b.pts++; }
}
function tabelaOrdenada(liga) { return [...liga.times].sort((x, y) => y.pts - x.pts || (y.gp - y.gc) - (x.gp - x.gc) || y.gp - x.gp); }
function minhaPosicao() { return tabelaOrdenada(G.save.time.liga).findIndex(x => x.id === 'eu') + 1; }

/* ---------------- telas do time ---------------- */
function abrirTime(aba = 'elenco') {
  const s = G.save;
  if (!s.time) {
    if (s.nivel < NIVEL_TIME) { abreModal(el('h2', {}, 'My Team'), el('p', {}, `As an adult (Under-20, level ${NIVEL_TIME}) you can found your own club: sign players, pick the lineup and play in leagues — from the Sandlot League all the way to the big leagues of the world.`), el('p', {}, `You're at level ${s.nivel}. Keep training! When you get there, look for Agent Rodrigues in the City.`)); return; }
    return modalFundar();
  }
  garanteTime(); recuperaEnergia();
  abreModal.largo = true;
  const t = s.time; const L = t.liga;
  const tabs = el('div', { class: 'tabs-modal' }, ...[['elenco', 'Squad'], ['liga', 'League'], ['copa', 'Cup'], ['clube', 'Clube'], ['mercado', 'Market'], ['jogar', 'Play match']].map(([k, n]) => el('button', { class: 'btn ' + (aba === k ? 'amarelo' : ''), onclick: () => abrirTime(k) }, n)));
  const cab = el('div', { class: 'time-cab' }, escudo(t.cor1, t.cor2, 40), el('div', {}, el('h2', { style: 'margin:0' }, t.nome),
    el('div', {}, bandeira(t.pais), `${nomeDivisao(t.div)} · Season ${t.temporada} · Round ${Math.min(L.rodadas.length, L.rodada + 1)}/${L.rodadas.length} · Titles: ${t.titulos} · Funds: `, precoTag(t.caixa))));
  let corpo;
  if (aba === 'elenco') corpo = telaElenco(); else if (aba === 'liga') corpo = telaLiga(); else if (aba === 'copa') corpo = telaCopa(); else if (aba === 'clube') corpo = telaClube(); else if (aba === 'mercado') corpo = telaMercado(); else corpo = telaPreJogo();
  abreModal(cab, tabs, corpo);
}
function escudo(c1, c2, tam = 32) {
  const c = mkCanvas(16, 18); const x = c.getContext('2d');
  x.fillStyle = '#1a1026'; x.fillRect(1, 0, 14, 12); x.fillRect(2, 12, 12, 3); x.fillRect(4, 15, 8, 2); x.fillRect(6, 17, 4, 1);
  x.fillStyle = c1; x.fillRect(2, 1, 12, 11); x.fillRect(3, 12, 10, 2); x.fillRect(5, 14, 6, 2);
  x.fillStyle = c2; x.fillRect(7, 1, 2, 15); x.fillRect(2, 5, 12, 2);
  c.style.width = tam + 'px'; c.style.height = tam * 18 / 16 + 'px'; c.style.imageRendering = 'pixelated'; return c;
}
function miniEscudo(x) { return el('span', { class: 'mini-escudo', style: `background:linear-gradient(90deg,${x.cor1} 50%,${x.cor2} 50%)` }); }
function cartaJogador(j, extra) {
  const t = G.save.time; const c = mkCanvas(96, 120); pintaAparencia(c, lookJogadorTime(j, t.cor1, t.cor2));
  c.style.width = '40px'; c.style.height = '50px';
  const en = el('div', { class: 'bl-hp', title: 'Energy' }); const i = el('i'); i.style.width = clamp(j.energia, 0, 100) + '%'; i.style.background = j.energia > 60 ? '#3ad83a' : j.energia > 30 ? '#e8d23a' : '#e83a3a'; en.append(i);
  return el('div', { class: 'linha-item pc-card' + (j.eu ? ' eu-card' : ''), style: `--pc:${POS_COR[j.pos] || '#888'}` }, c,
    el('div', { class: 'nm' }, el('b', {}, (j.eu ? '★ ' : '') + j.nome + (j.lenda ? ' (legend)' : '')), el('small', {}, `${POS_NOME[j.pos]} · ATK ${j.atq} · DEF ${j.def} · PAS ${j.pas} · PHY ${j.fis}${j.eu ? '' : ` · level ${j.nivel} (max ${j.pot}) · age ${j.idade || '?'} · salary ${fmt(salario(j))}`}`), en),
    el('b', { class: 'ovr', title: 'Overall strength' }, ovr(j)), extra || '');
}
function telaElenco() {
  const t = G.save.time; const wrap = el('div');
  const fSel = el('select', { class: 'sel' }, ...Object.keys(FORMACOES).map(f => el('option', { value: f, selected: f === t.formacao ? 'selected' : null }, f)));
  fSel.onchange = () => { t.formacao = fSel.value; autoEscalar(); abrirTime('elenco'); };
  const tSel = el('select', { class: 'sel' }, ...Object.entries(TATICAS).map(([k, v]) => el('option', { value: k, selected: k === t.tatica ? 'selected' : null }, `${v.nome} — ${v.desc}`)));
  tSel.onchange = () => { t.tatica = tSel.value; abrirTime('elenco'); };
  const treinoOk = treinoLiberado(t); const ct = custoTreino();
  wrap.append(el('div', { class: 'opcoes', style: 'align-items:center' }, el('label', {}, 'Formation ', fSel), el('label', {}, 'Tactic ', tSel),
    el('button', { class: 'btn', onclick: () => { autoEscalar(); abrirTime('elenco'); } }, 'Auto lineup'),
    el('button', { class: 'btn verde', disabled: !treinoOk || t.caixa < ct ? 'disabled' : null, title: `Unlocks on a new game day or every ${TREINO_JOGOS} club matches. Paid from club funds.`, onclick: () => {
      t.caixa -= ct; t.finTemp.sai -= ct; t.diaTreino = G.save.dia; t.jogosTreino = t.jogos || 0; const xp = Math.round(45 * (1 + 0.3 * t.estr.ct)); t.elenco.forEach(j => ganhaXpJogador(j, xp)); log(`${t.nome} practice done! Everyone earned ${xp} experience.`, 'l-xp'); som('apito'); abrirTime('elenco');
    } }, treinoOk ? `Train squad (${fmt(ct)} from club funds)` : (() => { const f = faltamJogosTreino(t); return `Practice done · next in ${f} game${f > 1 ? 's' : ''} (or tomorrow)`; })())));
  const esc = escalacaoAtual(); const s = setores(esc, t.tatica, t.moral);
  wrap.append(barrasSetores(s, null));
  wrap.append(el('h3', {}, `Starters — average strength ${forcaTitulares()} (division: ~${DIVS[t.div].base})`));
  const lista = el('div', { class: 'lista' });
  const todos = elencoCompleto();
  esc.forEach(({ slot, j }, i) => {
    // v221: a lista mostra só quem está aqui e os RESERVAS (primeiro os da posição, depois os outros com a força que teriam aqui)
    const reserv = todos.filter(x => !t.titulares.includes(x.id));
    const opc = x => el('option', { value: x.id, style: `background:${POS_COR[x.pos]}22` }, `${x.nome} — ${x.pos} ${ovr(x)}${x.pos !== slot ? ` (plays at ${Math.round(ovrNoSlot(x, slot))} here)` : ''}`);
    const daPos = reserv.filter(x => x.pos === slot).sort((a, b) => ovr(b) - ovr(a)), outros = reserv.filter(x => x.pos !== slot).sort((a, b) => ovrNoSlot(b, slot) - ovrNoSlot(a, slot));
    const sel = el('select', { class: 'sel', style: `border-color:${POS_COR[slot]}` },
      j ? el('option', { value: j.id, selected: 'selected' }, `✓ ${j.nome} — ${j.pos} ${ovr(j)}`) : el('option', { value: '', selected: 'selected' }, '— nobody —'),
      daPos.length ? el('optgroup', { label: `Reserve ${POS_NOME[slot].toLowerCase()}s` }, ...daPos.map(opc)) : '',
      outros.length ? el('optgroup', { label: 'Other reserves (out of position)' }, ...outros.map(opc)) : '',
      !reserv.length ? el('option', { value: '', disabled: 'disabled' }, 'No reserves — sign players in the Market') : '',
      j ? el('option', { value: '' }, '— take off the team —') : '');
    sel.onchange = () => { const v = sel.value || null; const k = t.titulares.indexOf(v); if (v && k >= 0) t.titulares[k] = t.titulares[i]; t.titulares[i] = v; abrirTime('elenco'); };
    const aviso = j && j.pos !== slot ? el('small', { style: 'color:#b0301a' }, ' out of position') : '';
    lista.append(el('div', { class: 'slot-esc', style: `--pc:${POS_COR[slot]}` }, el('b', { class: 'pos-tag', title: POS_NOME[slot] }, slot), j ? cartaJogador(j) : el('div', { class: 'linha-item bloq' }, 'Nobody in the lineup'), el('div', {}, sel, aviso)));
  });
  wrap.append(lista);
  const reservas = todos.filter(j => !t.titulares.includes(j.id));
  wrap.append(el('h3', {}, `Reserves (${reservas.length}) — squad ${t.elenco.length + 1}/20 · payroll ${fmt(folhaSalarial())} per round`));
  const lr = el('div', { class: 'lista' });
  reservas.forEach(j => {
    const venda = Math.round(Math.min(precoJogador(j), j.lenda && LENDAS[j.lendaId] ? LENDAS[j.lendaId].preco : Infinity) * 0.5); // lenda: no máximo metade do que custou (comprar e vender não dá lucro)
    lr.append(cartaJogador(j, j.eu ? '' : el('button', { class: 'btn mini', title: 'Sells the player; the money goes to the club funds', onclick: async () => { if (!(await perguntaJogo(`Sell ${j.nome} for ${fmt(venda)} coins?`, { sim: 'Sell', perigo: true }))) return; t.elenco = t.elenco.filter(x => x.id !== j.id); t.titulares = t.titulares.map(id => id === j.id ? null : id); t.caixa += venda; t.finTemp.ent += venda; log(`${j.nome} was sold for ${fmt(venda)} coins.`, 'l-loot'); som('moeda'); salvar(); abrirTime('elenco'); } }, `Sell (${fmt(venda)})`)));
  });
  if (!reservas.length) lr.append(el('p', { class: 'vazio' }, 'No reserves. Sign players in the Market so you can rotate out tired ones.'));
  wrap.append(lr);
  return wrap;
}
function barrasSetores(a, b) {
  const box = el('div', { class: 'setores' });
  const linha = (nome, va, vb, max) => {
    const la = el('i'); la.style.width = clamp(va / max * 100, 2, 100) + '%';
    const row = el('div', { class: 'setor' }, el('span', {}, nome), el('div', { class: 'sbar a' }, la), el('b', {}, Math.round(va)));
    if (vb != null) { const lb = el('i'); lb.style.width = clamp(vb / max * 100, 2, 100) + '%'; row.append(el('b', {}, Math.round(vb)), el('div', { class: 'sbar b' }, lb)); }
    return row;
  };
  const REF = { atq: 380, mei: 360, def: 420, gol: 99 };
  const mx = k => b ? Math.max(a[k], b[k]) * 1.15 : Math.max(REF[k], a[k]);
  box.append(linha('Attack', a.atq, b && b.atq, mx('atq')), linha('Midfield', a.mei, b && b.mei, mx('mei')), linha('Defense', a.def, b && b.def, mx('def')), linha('Goalkeeper', a.gol, b && b.gol, mx('gol')));
  return box;
}
function telaLiga() {
  const t = G.save.time; const L = t.liga; const d = DIVS[t.div]; const wrap = el('div'); const n = L.times.length;
  const zona = i => i === 0 && d.topo ? ' 🏆' : i < 2 && !d.topo ? ' ▲' : i >= n - 2 && !d.piso ? ' ▼' : '';
  const tab = el('table', { class: 'rank-tab' }, el('tr', {}, ...['#', 'Team', 'P', 'J', 'V', 'E', 'D', 'SG', 'GP'].map(h => el('th', {}, h))));
  tabelaOrdenada(L).forEach((x, i) => tab.append(el('tr', { class: (x.id === 'eu' ? 'eu ' : '') + (zona(i).includes('▲') || zona(i).includes('🏆') ? 'z-sobe' : zona(i).includes('▼') ? 'z-cai' : '') }, el('td', {}, (i + 1) + zona(i)), el('td', {}, miniEscudo(x), ' ' + x.nome + (x.id !== 'eu' ? ` (${x.ovr})` : '')), el('td', {}, el('b', {}, x.pts)), el('td', {}, x.j), el('td', {}, x.v), el('td', {}, x.e), el('td', {}, x.d), el('td', {}, x.gp - x.gc), el('td', {}, x.gp))));
  const regra = [d.topo ? (t.pais === 'mundo' ? '1st place is WORLD CHAMPION' : `1st place is CHAMPION of ${PAIS[t.pais].nome} and gets invited to leagues in other countries`) : 'The top 2 get PROMOTED', d.piso ? '' : 'the bottom 2 get RELEGATED'].filter(Boolean).join('; ');
  wrap.append(el('p', {}, bandeira(t.pais), `${d.nome} — ${L.rodadas.length} rounds (home and away). ${regra}.`),
    el('p', { class: 'meta-linha' }, `🎯 Sponsor goal: ${METAS[t.meta].txt}. Right now you're #${minhaPosicao()}.`), tab);
  if (L.ultimos.length) {
    wrap.append(el('h3', {}, `Round ${L.rodada} results`));
    const box = el('div', { class: 'resultados' });
    L.ultimos.forEach(([a, b, x, y]) => box.append(el('div', { class: L.times[a].id === 'eu' || L.times[b].id === 'eu' ? 'eu' : '' }, `${L.times[a].nome} ${x} × ${y} ${L.times[b].nome}`)));
    wrap.append(box);
  }
  // pirâmide do país
  const p = PAIS[t.pais]; const pir = el('div', { class: 'piramide' });
  for (let k = p.divs.length - 1; k >= 0; k--) {
    const aqui = k === d.k; const dd = DIVS[divDe(t.pais, k)];
    pir.append(el('div', { class: 'pdiv' + (aqui ? ' aqui' : ''), style: `width:${60 + (p.divs.length - 1 - k) * 40 / Math.max(1, p.divs.length - 1)}%` }, `${dd.nome} · strength ~${dd.base}${aqui ? ' ← YOU' : ''}`));
  }
  wrap.append(el('h3', {}, `${p.nome} league pyramid`), pir);
  if (t.historico.length) { wrap.append(el('h3', {}, 'History')); t.historico.slice(-8).reverse().forEach(h => wrap.append(el('p', {}, h))); }
  return wrap;
}
function telaCopa() {
  const t = G.save.time; const c = t.copa; const L = t.liga; const wrap = el('div');
  if (!c) { wrap.append(el('p', {}, 'The Club World Cup has no national cup: every league match counts like a final!')); return wrap; }
  wrap.append(el('h3', {}, `🏆 ${c.nome}`), el('p', {}, `Knockout with teams from every division of ${PAIS[t.pais].nome}. Ties go to penalties. The rounds happen after league rounds ${GATILHO_COPA.join(', ')}.`));
  const lista = el('div', { class: 'lista' });
  FASES_COPA.forEach((f, i) => {
    const adv = c.advs[i]; const r = c.res[i];
    let st;
    if (r) st = `${r.gn} × ${r.ge}${r.pen ? ` (pen. ${r.pen[0]}×${r.pen[1]})` : ''} — ${r.venceu ? 'advanced!' : 'eliminado'}`;
    else if (c.status !== 'vivo' || i > c.fase) st = c.status === 'eliminado' ? '—' : `after round ${GATILHO_COPA[i]}`;
    else st = L.rodada >= GATILHO_COPA[i] ? 'NEXT GAME!' : `after round ${GATILHO_COPA[i]}`;
    lista.append(el('div', { class: 'linha-item' + (c.status === 'eliminado' && !r ? ' bloq' : '') }, el('b', { class: 'pos-tag' }, i + 1), el('div', { class: 'nm' }, el('b', {}, f), el('small', {}, i <= c.fase || r ? `vs ${adv.nome} (strength ${adv.ovr})` : 'opponent to be decided')), el('b', {}, st)));
  });
  wrap.append(lista);
  if (c.status === 'campeao') wrap.append(el('p', { class: 'meta-linha' }, `${c.nome} CHAMPIONS!`));
  if (c.status === 'eliminado') wrap.append(el('p', { class: 'vazio' }, 'Out of the cup this season. There\'s always next season!'));
  wrap.append(el('p', { class: 'vazio' }, `Prizes: quarterfinals ${fmt(Math.round(premioDiv(t.div) * 1.5))}, semis ${fmt(premioDiv(t.div) * 2)}, final ${fmt(premioDiv(t.div) * 3)} + champion bonus ${fmt(premioDiv(t.div) * 4)}.`));
  return wrap;
}
function telaClube() {
  const s = G.save; const t = s.time; const wrap = el('div');
  // caixa
  const inp = el('input', { type: 'number', min: 0, value: Math.min(s.ouro, 1000), style: 'width:110px' });
  wrap.append(el('h3', {}, '💰 Club funds'),
    el('p', {}, 'Club funds pay for wages, signings, practices and building upgrades. Money comes in from prizes, sponsorship, ticket sales and player sales. With every win you (the star) also get a 25% win bonus of the prize in your pocket, and at the end of the season 25% of the PROFIT from games goes to you.'),
    el('div', { class: 'opcoes', style: 'align-items:center' }, el('b', {}, 'Funds: '), precoTag(t.caixa), el('span', {}, ' · Your pocket: '), precoTag(s.ouro), inp,
      el('button', { class: 'btn verde mini', onclick: () => { const v = Math.floor(+inp.value || 0); if (v <= 0 || v > s.ouro) { log('Invalid amount.', 'l-dano'); return; } s.ouro -= v; t.caixa += v; t.finTemp.ent += v; log(`You invested ${fmt(v)} coins in ${t.nome}.`, 'l-loot'); som('moeda'); salvar(); abrirTime('clube'); } }, 'Invest in the club'),
      el('button', { class: 'btn mini', title: `10% fee. Limit per season: ${fmt(limiteSaque())}`, onclick: () => { const v = Math.floor(+inp.value || 0); if (v <= 0 || v > t.caixa) { log('Invalid amount.', 'l-dano'); return; } if ((t.sacado || 0) + v > limiteSaque()) { log(`The board only allows ${fmt(limiteSaque())} in withdrawals per season (you've already withdrawn ${fmt(t.sacado || 0)}).`, 'l-dano'); som('erro'); return; } t.sacado = (t.sacado || 0) + v; t.caixa -= v; t.finTemp.sai -= v; s.ouro += Math.floor(v * 0.9); log(`You withdrew ${fmt(v)} from the club funds (you got ${fmt(Math.floor(v * 0.9))} after the fee).`, 'l-loot'); salvar(); abrirTime('clube'); } }, 'Withdraw (10% fee)')));
  if (t.caixa < 0) wrap.append(el('p', { style: 'color:#b0301a' }, 'NEGATIVE funds: wages are late and team morale drops every round. Invest or sell players!'));
  // patrocínio e finanças
  const fin = el('div', { class: 'fin' });
  (t.fin || []).forEach(([rot, v]) => fin.append(el('div', { class: 'fin-linha' }, el('span', {}, rot), el('b', { class: v >= 0 ? 'pos' : 'neg' }, (v >= 0 ? '+' : '') + fmt(v)))));
  wrap.append(el('h3', {}, '📈 Sponsorship & finances'),
    el('p', {}, `Sponsorship: ${fmt(Math.round(premioDiv(t.div) * t.patro))} per round (contract ×${t.patro.toFixed(2)}). Payroll: ${fmt(folhaSalarial())} per round.`),
    el('p', { class: 'meta-linha' }, `🎯 This season's goal: ${METAS[t.meta].txt}. Hitting it renews the sponsorship with a 15% raise and a bonus; missing it cuts 8%.`),
    el('p', {}, `This season: money in `, el('b', { class: 'pos' }, '+' + fmt(t.finTemp.ent)), ' · money out ', el('b', { class: 'neg' }, fmt(t.finTemp.sai))));
  if (t.fin && t.fin.length) wrap.append(el('small', {}, 'Last match:'), fin);
  // estrutura
  wrap.append(el('h3', {}, '🏗️ Facilities'));
  const le = el('div', { class: 'lista' });
  for (const [k, e] of Object.entries(ESTRUTURA)) {
    const n = t.estr[k] || 0; const custo = custoEstr(k, n);
    le.append(el('div', { class: 'linha-item' }, el('div', { class: 'nm' }, el('b', {}, `${e.nome} ${'★'.repeat(n)}${'☆'.repeat(ESTR_MAX - n)}`), el('small', {}, (n ? e.desc(n) : 'Not built yet.') + (n < ESTR_MAX ? ` Next level: ${e.desc(n + 1)}` : '')), typeof estrRendaTxt === 'function' ? estrRendaTxt(k, n) : null),
      n >= ESTR_MAX ? el('b', {}, 'MAX') : el('span', { class: 'preco-col' }, precoTag(custo), el('button', { class: 'btn amarelo mini', disabled: t.caixa < custo ? 'disabled' : null, onclick: () => { if (t.caixa < custo) { log('Not enough club funds to call the scout.', 'l-dano'); som('erro'); return; } t.caixa -= custo; t.finTemp.sai -= custo; t.estr[k] = n + 1; log(`Construction complete: ${e.nome} level ${n + 1}!`, 'l-lvl'); som('nivel'); salvar(); abrirTime('clube'); } }, 'Upgrade'))));
  }
  wrap.append(le);
  // base
  wrap.append(el('h3', {}, `🌱 Youth academy (${t.base.length})`));
  const lb = el('div', { class: 'lista' });
  t.base.forEach(j => lb.append(cartaJogador(j, el('span', { class: 'preco-col' },
    el('button', { class: 'btn verde mini', onclick: () => { if (t.elenco.length >= 19) { log('Squad is full (20). Sell someone first.', 'l-dano'); return; } t.base = t.base.filter(x => x !== j); t.elenco.push(j); log(`${j.nome} moved up from the academy to the first team!`, 'l-loot'); salvar(); abrirTime('clube'); } }, 'Promote'),
    el('button', { class: 'btn mini', onclick: () => { t.base = t.base.filter(x => x !== j); abrirTime('clube'); } }, 'Release')))));
  if (!t.base.length) lb.append(el('p', { class: 'vazio' }, 'New prospects show up at the end of every season. Upgrade the Youth Academy to get more and better ones.'));
  wrap.append(lb);
  // troféus
  wrap.append(el('h3', {}, `🏆 Trophy room (${t.trofeus.length})`));
  wrap.append(t.trofeus.length ? el('div', { class: 'trofeus' }, ...t.trofeus.map(x => el('span', { class: 'trofeu' }, `🏆 ${x.nome} (T${x.temp})`))) : el('p', { class: 'vazio' }, 'No trophies yet. Win a league or a cup!'));
  // mundo
  wrap.append(el('h3', {}, '🌍 Leagues around the world'), el('p', {}, `From the weakest league to the strongest. Each title opens countries with a league of similar strength (up to +${ESCADA_FOLGA}); the club enters the division that matches its strength. Your star player also needs the required level.${melhorTitulo() ? ` Your best title: strength ${melhorTitulo()}.` : ''}`));
  const lm = el('div', { class: 'lista' });
  ESCADA_PAISES.map(id => PAIS[id]).forEach(p => {
    const aqui = t.pais === p.id; const r = requisitoPais(p.id);
    lm.append(el('div', { class: 'linha-item' + (r.ok || aqui ? '' : ' bloq') }, bandeira(p.id), el('div', { class: 'nm' }, el('b', {}, p.nome + (t.campeoes[p.id] ? ' 🏆' : '')), el('small', {}, `${p.divs.length} division(s) · strength ${p.divs[0][1]}–${p.divs[p.divs.length - 1][1]} · ${aqui ? 'YOU ARE HERE' : r.ok ? 'invite available' : r.motivo}`)),
      aqui || !r.ok ? '' : el('button', { class: 'btn amarelo mini', onclick: () => mudarPais(p.id) }, 'Move club')));
  });
  wrap.append(lm);
  return wrap;
}
// força da liga mais forte em que o clube já foi campeão (flags campeao_div<índice>)
function melhorTitulo() { const f = G.save.flags || {}; return DIVS.reduce((m, d, i) => f['campeao_div' + i] ? Math.max(m, d.base) : m, 0); }
// divisão em que o clube entra ao se mudar: a mais alta com força até o melhor título + folga
function divEntrada(pid) { const p = PAIS[pid]; const lim = melhorTitulo() + ESCADA_FOLGA; let k = 0; p.divs.forEach(([, base], i) => { if (base <= lim) k = i; }); return pid === 'brasil' ? Math.min(k, 3) : k; }
function requisitoPais(pid) {
  const s = G.save; const t = s.time; const p = PAIS[pid];
  if (s.nivel < p.lvl) return { ok: false, motivo: `needs level ${p.lvl}` };
  if (pid === 'brasil' || t.campeoes[pid]) return { ok: true };
  if (pid === 'mundo') return PAISES_EUROPA.some(x => t.campeoes[x]) ? { ok: true } : { ok: false, motivo: 'win the top league of a European country' };
  const ent = p.divs[0][1];
  return melhorTitulo() + ESCADA_FOLGA >= ent ? { ok: true } : { ok: false, motivo: `win a league with strength ${ent - ESCADA_FOLGA} or higher` };
}
async function mudarPais(pid) {
  const t = G.save.time; const p = PAIS[pid];
  if (!requisitoPais(pid).ok) return;
  const k0 = divEntrada(pid); const nomeDiv = p.divs[k0][0];
  if (t.liga.rodada > 0 && !(await perguntaJogo(`Move ${t.nome} to ${p.nome}? The current season will be abandoned and the club starts in the ${nomeDiv}.`, { sim: 'Move', perigo: true }))) return;
  t.historico.push(`Season ${t.temporada}: the club moved to ${p.nome}!`);
  t.pais = pid; t.div = divDe(pid, k0); t.piramide = gerarPiramide(pid, k0); t.liga = gerarLiga(t.div); t.copa = novaCopa(); t.meta = defineMeta(); t.mercado = []; t.finTemp = { ent: 0, sai: 0 };
  banner(`${t.nome.toUpperCase()} IN ${p.nome.toUpperCase()}!`, nomeDiv); log(`${t.nome} now plays in the ${nomeDiv} (${p.nome}). New rivals, new challenges!`, 'l-lvl'); som('apito');
  salvar(); abrirTime('liga');
}
function telaMercado() {
  const s = G.save; const t = s.time; const wrap = el('div');
  if (t.diaMercado !== s.dia) { t.diaMercado = s.dia; t.mercado = geraMercado(); } // esvaziou comprando todos: o olheiro só volta amanhã (ou chame pagando)
  wrap.append(el('p', {}, `The scout brings new players every game day. Signings are paid from the club funds: `, precoTag(t.caixa)));
  const lista = el('div', { class: 'lista' });
  t.mercado.forEach(j => {
    const preco = precoJogador(j);
    lista.append(cartaJogador(j, el('span', { class: 'preco-col' }, precoTag(preco), el('button', { class: 'btn verde mini', onclick: () => {
      if (t.elenco.length >= 19) { log('Squad is full (20). Sell someone first.', 'l-dano'); return; }
      if (t.caixa < preco) { log('Not enough club funds. Invest in the club (Club tab) or sell players.', 'l-dano'); som('erro'); return; }
      t.caixa -= preco; t.finTemp.sai -= preco; t.elenco.push(j); t.mercado = t.mercado.filter(x => x !== j); log(`${j.nome} (${POS_NOME[j.pos]}) signed with ${t.nome}!`, 'l-loot'); som('moeda'); salvar(); abrirTime('mercado');
    } }, 'Sign'))));
  });
  wrap.append(lista);
  const custo = Math.round(premioDiv(t.div) * 1.2);
  wrap.append(el('div', { class: 'opcoes' }, el('button', { class: 'btn', onclick: () => { if (t.caixa < custo) return; t.caixa -= custo; t.finTemp.sai -= custo; t.mercado = geraMercado(); abrirTime('mercado'); } }, `Call the scout again (${fmt(custo)} from club funds)`)));
  // lendas: chefões vencidos
  wrap.append(el('h3', {}, 'Legends (bosses you\'ve beaten)'));
  const ll = el('div', { class: 'lista' });
  for (const [id, L] of Object.entries(LENDAS)) {
    const venceu = s.flags['venceu_' + id]; const ja = t.elenco.some(j => j.lendaId === id);
    const j = { id: 'L_' + id, lendaId: id, lenda: true, nome: MONSTROS[id].nome.split(',')[0], pos: L.pos, atq: L.atq, def: L.def, pas: L.pas, fis: L.fis, pot: L.pot, nivel: 1, xp: 0, energia: 100, idade: 30, look: { corpo: MONSTROS[id].look.corpo, pele: MONSTROS[id].look.pele, cabelo: MONSTROS[id].look.cabelo, corCabelo: MONSTROS[id].look.corCabelo } };
    if (!venceu) { ll.append(el('div', { class: 'linha-item bloq' }, el('div', { class: 'nm' }, el('b', {}, '???'), el('small', {}, `Beat ${MONSTROS[id].nome} to be able to sign them.`)))); continue; }
    ll.append(cartaJogador(j, ja ? el('b', {}, 'In the squad') : el('span', { class: 'preco-col' }, precoTag(L.preco), el('button', { class: 'btn amarelo mini', onclick: () => {
      if (t.elenco.length >= 19 || t.caixa < L.preco) { log(t.caixa < L.preco ? 'Not enough club funds.' : 'Squad is full.', 'l-dano'); return; }
      t.caixa -= L.preco; t.finTemp.sai -= L.preco; j.id = 'L_' + id + Date.now().toString(36); t.elenco.push(j); log(`The LEGEND ${j.nome} now plays for ${t.nome}!`, 'l-lvl'); banner(j.nome.toUpperCase(), 'Huge signing!'); som('nivel'); salvar(); abrirTime('mercado');
    } }, 'Sign legend'))));
  }
  wrap.append(ll);
  return wrap;
}
function geraMercado() {
  const t = G.save.time; const ol = (t.estr && t.estr.olheiro) || 0; const base = DIVS[t.div].base + ol;
  const pos = ['GOL', 'ZAG', 'LAT', 'VOL', 'MEI', 'ATA'];
  return Array.from({ length: 6 + ol }, (_, i) => geraJogador(pos[i % 6], base + rndi(-4, 6)));
}
function ganhaXpJogador(j, n) {
  j.xp += n; let subiu = false;
  while (j.xp >= 100 + j.nivel * 40) {
    j.xp -= 100 + j.nivel * 40; j.nivel++; subiu = true;
    const pesos = { GOL: ['def', 'def', 'fis'], ZAG: ['def', 'def', 'fis', 'pas'], LAT: ['def', 'fis', 'pas', 'atq'], VOL: ['def', 'pas', 'pas', 'fis'], MEI: ['pas', 'pas', 'atq', 'fis'], ATA: ['atq', 'atq', 'fis', 'pas'] }[j.pos];
    for (let k = 0; k < 2; k++) { const a = pesos[rndi(0, pesos.length - 1)]; if (j[a] < j.pot) j[a]++; }
  }
  return subiu;
}

/* ---------------- pré-jogo e partida ---------------- */
function proximoJogo() {
  const t = G.save.time; const L = t.liga; const c = t.copa;
  if (c && c.status === 'vivo' && c.fase < 3 && L.rodada >= GATILHO_COPA[c.fase]) return { tipo: 'copa', fase: c.fase, casa: c.fase === 1, adv: c.advs[c.fase] };
  if (L.rodada >= L.rodadas.length) return null;
  const jogo = L.rodadas[L.rodada].find(([a, b]) => L.times[a].id === 'eu' || L.times[b].id === 'eu');
  const casa = L.times[jogo[0]].id === 'eu';
  return { tipo: 'liga', jogo, casa, adv: L.times[casa ? jogo[1] : jogo[0]] };
}
function forcasJogo(pj) {
  const t = G.save.time; const esc = escalacaoAtual();
  const nos = setores(esc, t.tatica, t.moral); const eles = setores(timeIA(pj.adv), pj.adv.tatica);
  if (pj.casa) { nos.atq *= 1.04; nos.mei *= 1.04; nos.def *= 1.04; } else if (!(pj.tipo === 'copa' && pj.fase === 2)) { eles.atq *= 1.04; eles.mei *= 1.04; eles.def *= 1.04; }
  return { nos, eles, esc };
}
function telaPreJogo() {
  const t = G.save.time; const wrap = el('div');
  const pj = proximoJogo();
  if (!pj) { wrap.append(el('p', {}, 'Season over.'), el('button', { class: 'btn amarelo', onclick: () => fimTemporada() }, 'See season results')); return wrap; }
  const { nos, eles, esc } = forcasJogo(pj); const faltam = esc.filter(x => !x.j).length;
  // estimativa rápida de chance
  let v = 0, e = 0; for (let i = 0; i < 300; i++) { const [a, b] = simRapida(nos, eles); if (a > b) v++; else if (a === b) e++; }
  const titulo = pj.tipo === 'copa' ? `🏆 ${t.copa.nome} — ${FASES_COPA[pj.fase]}` : `${nomeDivisao(t.div)} — Round ${t.liga.rodada + 1}`;
  const local = pj.tipo === 'copa' && pj.fase === 2 ? 'campo neutro' : pj.casa ? 'em casa' : 'fora';
  wrap.append(el('h3', { style: 'text-align:center;margin:4px 0' }, titulo));
  wrap.append(el('div', { class: 'placar-pre' }, el('div', {}, escudo(t.cor1, t.cor2, 48), el('b', {}, t.nome)), el('div', { class: 'vs' }, local, el('br'), 'VS'), el('div', {}, escudo(pj.adv.cor1, pj.adv.cor2, 48), el('b', {}, pj.adv.nome))));
  wrap.append(el('p', { style: 'text-align:center' }, `Opponent: strength ~${pj.adv.ovr}, formation ${pj.adv.formacao}, ${TATICAS[pj.adv.tatica].nome}.`));
  wrap.append(el('div', { class: 'legenda-setor' }, el('span', { class: 'a' }, 'Us'), el('span', { class: 'b' }, 'Them')), barrasSetores(nos, eles));
  wrap.append(el('p', { style: 'text-align:center' }, `Estimated chance: win ${Math.round(v / 3)}% · draw ${Math.round(e / 3)}%${pj.tipo === 'copa' ? ' (penalties)' : ''} · loss ${Math.round((300 - v - e) / 3)}%`));
  const cansados = esc.filter(x => x.j && x.j.energia < 45).map(x => x.j.nome);
  if (cansados.length) wrap.append(el('p', { style: 'color:#b0301a;text-align:center' }, `Tired: ${cansados.join(', ')}. Low energy hurts performance (it recovers over time).`));
  const mult = pj.tipo === 'copa' ? [1.5, 2, 3][pj.fase] : 1;
  wrap.append(el('p', { class: 'vazio' }, `Win prize: ${fmt(Math.round(premioDiv(t.div) * mult))} coins (+25% win bonus in your pocket) and ${fmt(Math.round(xpDiv(t.div) * mult))} XP. If you watch (Kickoff), you follow the game live, make changes whenever you want and get all the XP; if you simulate, you only get the score and half the XP.`));
  wrap.append(el('div', { class: 'opcoes', style: 'justify-content:center' },
    el('button', { class: 'btn amarelo grande', disabled: faltam ? 'disabled' : null, onclick: () => jogarPartida(pj, nos, eles) }, faltam ? `${faltam} starters missing` : '📺 Kickoff! (watch)'),
    el('button', { class: 'btn', disabled: faltam ? 'disabled' : null, onclick: () => simularPartida(pj, nos, eles) }, 'Simulate result')));
  return wrap;
}
function temporadaAcabou() { const t = G.save.time; return !proximoJogo() && t.liga.rodada >= t.liga.rodadas.length; }
function botaoContinuar() {
  return temporadaAcabou() ? el('button', { class: 'btn amarelo', onclick: () => fimTemporada() }, 'End of the season!') : el('button', { class: 'btn amarelo', onclick: () => abrirTime('jogar') }, 'Continue');
}
function simularPartida(pj, nos, eles) {
  const t = G.save.time; const [gn, ge] = simRapida(nos, eles);
  const r = concluiJogo(pj, gn, ge, escalacaoAtual(), true, nos, eles);
  const fin = el('div', { class: 'fin' }); r.fin.forEach(([rot, v]) => fin.append(el('div', { class: 'fin-linha' }, el('span', {}, rot), el('b', { class: v >= 0 ? 'pos' : 'neg' }, (v >= 0 ? '+' : '') + fmt(v)))));
  abreModal.largo = true;
  abreModal(el('h2', {}, 'Result'), el('div', { class: 'placar-ao-vivo' }, el('span', {}, t.nome), el('b', {}, `${gn} × ${ge}`), el('span', {}, pj.adv.nome)),
    el('p', { style: 'text-align:center' }, r.txt), el('p', { style: 'text-align:center' }, `Your pocket: +${fmt(r.bicho)} coins · +${fmt(r.xp)} XP`), el('small', {}, 'Club funds:'), fin,
    el('div', { class: 'opcoes', style: 'justify-content:center' }, botaoContinuar()));
}
function concluiJogo(pj, gn, ge, escN, rapido, nos, eles) {
  const s = G.save; const t = s.time; const L = t.liga; const d = t.div; const P = premioDiv(d), X = xpDiv(d);
  const tt = TATICAS[t.tatica]; const est = t.estr;
  escN.forEach(x => { if (!x.j) return; const gasto = rndi(16, 24) * tt.en * (1 - 0.05 * est.med); if (x.j.eu) t.energiaEu = Math.max(0, t.energiaEu - gasto); else { x.j.energia = Math.max(0, x.j.energia - gasto); ganhaXpJogador(x.j, Math.round(30 * (1 + 0.3 * est.ct))); } });
  t.jogos++;
  let venceu = gn > ge, empate = gn === ge, pen = null;
  if (pj.tipo === 'copa' && empate) { venceu = Math.random() < clamp(0.5 + (nos.gol - eles.gol) * 0.006, 0.25, 0.75); empate = false; pen = venceu ? [rndi(4, 5), rndi(2, 3)] : [rndi(2, 3), rndi(4, 5)]; }
  const mult = pj.tipo === 'copa' ? [1.5, 2, 3][pj.fase] : 1;
  const premio = Math.round(P * mult * (venceu ? 1 : empate ? 0.4 : 0.15));
  const xp = Math.round(X * mult * (venceu ? 1 : empate ? 0.4 : 0.15) * (rapido ? 0.5 : 1));
  const bicho = venceu ? Math.round(premio * 0.25) : 0;
  const fin = [['Match prize', premio]];
  if (pj.casa) fin.push(['Ticket sales', Math.round(P * 0.5 * (1 + 0.5 * estrMult(est.estadio)) * (1 + t.moral * 0.08))]);
  if (pj.tipo === 'liga') fin.push(['Sponsorship', Math.round(P * t.patro)], ['Wages', -folhaSalarial()]);
  const saldo = fin.reduce((a, [, v]) => a + v, 0); t.caixa += saldo; t.fin = fin;
  fin.forEach(([, v]) => { if (v >= 0) t.finTemp.ent += v; else t.finTemp.sai += v; });
  s.ouro += bicho; ganhaXp(xp);
  if (venceu) { t.vitorias++; t.moral = Math.min(3, t.moral + 1); } else if (!empate) t.moral = Math.max(-3, t.moral - 1);
  if (t.caixa < 0) { t.moral = Math.max(-3, t.moral - 1); log('Club funds are NEGATIVE! Late wages hurt morale. Invest in the club or sell players.', 'l-dano'); }
  const placar = `${t.nome} ${gn} × ${ge} ${pj.adv.nome}${pen ? ` (penalties ${pen[0]}×${pen[1]})` : ''}`;
  let txt = venceu ? 'VICTORY!' : empate ? 'Draw.' : 'Loss...';
  if (pj.tipo === 'liga') {
    registraJogo(L, pj.jogo[0], pj.jogo[1], pj.casa ? gn : ge, pj.casa ? ge : gn);
    L.ultimos = [[pj.jogo[0], pj.jogo[1], pj.casa ? gn : ge, pj.casa ? ge : gn]];
    for (const [a, b] of L.rodadas[L.rodada]) { if (a === pj.jogo[0] && b === pj.jogo[1]) continue; const A = setores(timeIA(L.times[a]), L.times[a].tatica), B = setores(timeIA(L.times[b]), L.times[b].tatica); const [x, y] = simRapida(A, B); registraJogo(L, a, b, x, y); L.ultimos.push([a, b, x, y]); }
    L.rodada++;
    txt += ` You're #${minhaPosicao()} in the ${nomeDivisao(d)}.`;
  } else {
    const c = t.copa; c.res[pj.fase] = { gn, ge, pen, venceu };
    if (venceu) {
      c.fase++;
      if (c.fase >= 3) { c.status = 'campeao'; const bonus = P * 4; t.caixa += bonus; t.finTemp.ent += bonus; t.trofeus.push({ nome: c.nome, temp: t.temporada }); banner('CUP CHAMPIONS!', c.nome); som('nivel'); txt = `${c.nome.toUpperCase()} CHAMPIONS! +${fmt(bonus)} to club funds.`; }
      else txt = `Through to the ${FASES_COPA[c.fase]} of the ${c.nome}!`;
    } else { c.status = 'eliminado'; txt = `Knocked out of the ${c.nome}.`; }
  }
  if (typeof carreiraEvento === 'function') carreiraEvento('partida', { vitoria: venceu });
  log(`${placar}. ${txt} +${fmt(bicho)} coins, +${fmt(xp)} XP.`, venceu ? 'l-xp' : 'l-info');
  salvar();
  return { txt: `${placar}. ${txt}`, venceu, empate, pen, bicho, xp, fin, saldo };
}
function nomeLance(esc, pesos) {
  const lista = esc.filter(x => x.j); const tot = lista.reduce((a, x) => a + (pesos[x.slot] || 0.2), 0); let r = Math.random() * tot;
  for (const x of lista) { r -= pesos[x.slot] || 0.2; if (r <= 0) return x.j; } return lista[0].j;
}
// v407 (Raio-X T4): jogarPartida saiu daqui — partida.js declara a mesma função depois e só a de lá rodava.

/* ---------------- fim de temporada ---------------- */
function fimTemporada() {
  const s = G.save; const t = s.time; const L = t.liga; const d = DIVS[t.div]; const p = PAIS[t.pais]; const P = premioDiv(t.div);
  const tab = tabelaOrdenada(L); const pos = tab.findIndex(x => x.id === 'eu') + 1; const n = tab.length;
  const linhas = []; let msg = `Season ${t.temporada} (${nomeDivisaoPais(t.div)}): finished #${pos}.`;
  // título
  const abertosAntes = new Set(ESCADA_PAISES.filter(id => melhorTitulo() + ESCADA_FOLGA >= PAIS[id].divs[0][1]));
  if (pos === 1) {
    t.titulos++; const premio = P * 6; t.caixa += premio; t.finTemp.ent += premio; s.ouro += Math.round(premio * 0.2); ganhaXp(xpDiv(t.div) * 5);
    t.trofeus.push({ nome: d.nome, temp: t.temporada }); s.flags['campeao_div' + t.div] = true;
    msg += ' CHAMPIONS!'; linhas.push(`🏆 ${d.nome} CHAMPIONS! +${fmt(premio)} to club funds and ${fmt(Math.round(premio * 0.2))} in your pocket.`);
    banner('CHAMPIONS!', d.nome); som('nivel');
    if (d.topo) {
      const novo = !t.campeoes[t.pais]; t.campeoes[t.pais] = true; s.flags['campeao_pais_' + t.pais] = true;
      if (t.pais === 'mundo') { const cabe = recebeItem('medalha_ouro') === 'mochila'; linhas.push(cabe ? '🌍 WORLD CHAMPIONS! You earned a Gold Medal.' : '🌍 WORLD CHAMPIONS! You earned a Gold Medal (backpack full: it went to your storage).'); }
    }
    const novos = ESCADA_PAISES.filter(id => id !== 'mundo' && id !== t.pais && !abertosAntes.has(id) && melhorTitulo() + ESCADA_FOLGA >= PAIS[id].divs[0][1]);
    if (novos.length) linhas.push(`✉️ INVITE: the club can play in the league of ${novos.map(id => `${PAIS[id].nome} (level ${PAIS[id].lvl})`).join(', ')}. Check Club → Leagues around the world.`);
  }
  // premiação por colocação na liga
  const colocacao = Math.round(P * (n - pos + 1) * 0.5); t.caixa += colocacao; t.finTemp.ent += colocacao;
  linhas.push(`💰 Prize for finishing #${pos}: +${fmt(colocacao)} to club funds.`);
  // meta do patrocinador
  const meta = METAS[t.meta];
  if (meta.ok(pos)) { const bonus = P * 3; t.patro = Math.min(2, +(t.patro * 1.15).toFixed(2)); t.caixa += bonus; t.finTemp.ent += bonus; linhas.push(`🎯 Goal reached (${meta.txt})! Sponsorship renewed with a raise (×${t.patro.toFixed(2)}) and a bonus of ${fmt(bonus)}.`); }
  else { t.patro = Math.max(0.7, +(t.patro * 0.92).toFixed(2)); linhas.push(`🎯 Goal missed (${meta.txt}). The sponsor cut the contract to ×${t.patro.toFixed(2)}.`); }
  // acesso e rebaixamento na pirâmide inteira
  const divs = t.piramide.divs; const nd = divs.length; const k = d.k;
  const rank = divs.map((lista, kk) => kk === k
    ? tab.map(x => x.id === 'eu' ? 'EU' : lista.find(a => a.id === x.id)).filter(Boolean)
    : lista.map(a => ({ a, sc: a.ovr + rnd(-8, 8) })).sort((x, y) => y.sc - x.sc).map(x => x.a));
  const novas = divs.map(() => []);
  let minhaK = k;
  rank.forEach((lista, kk) => lista.forEach((a, i) => {
    let dest = kk;
    if (i < 2 && kk < nd - 1) dest = kk + 1; else if (i >= lista.length - 2 && kk > 0) dest = kk - 1;
    if (a === 'EU') { minhaK = dest; return; }
    const base = p.divs[dest][1];
    a.ovr = Math.round((a.ovr + (dest - kk) * 2) * 0.75 + base * 0.25 + rndi(-2, 2));
    a.pts = a.j = a.v = a.e = a.d = a.gp = a.gc = 0;
    novas[dest].push(a);
  }));
  t.piramide.divs = novas;
  if (minhaK > k) { msg += ` PROMOTED to the ${p.divs[minhaK][0]}!`; linhas.push(`▲ PROMOTED! Next season ${t.nome} plays in the ${p.divs[minhaK][0]}.`); }
  else if (minhaK < k) { msg += ` Relegated to the ${p.divs[minhaK][0]}.`; linhas.push(`▼ Relegated to the ${p.divs[minhaK][0]}. Strengthen the team and come back stronger!`); }
  else linhas.push(`Staying in the ${d.nome}.`);
  t.div = divDe(t.pais, minhaK);
  // envelhecimento e aposentadorias
  const aposentados = [];
  t.elenco = t.elenco.filter(j => {
    j.idade = (j.idade || 28) + 1;
    if (j.idade >= 32) { j.fis = Math.max(5, j.fis - rndi(1, 3)); const a = ['atq', 'def', 'pas'][rndi(0, 2)]; j[a] = Math.max(5, j[a] - 1); }
    if (j.idade >= 36 && !j.lenda) { aposentados.push(j.nome); return false; }
    return true;
  });
  if (aposentados.length) { linhas.push(`👴 Retired: ${aposentados.join(', ')}.`); t.titulares = t.titulares.map(id => id === 'eu' || t.elenco.some(j => j.id === id) ? id : null); }
  // categoria de base
  const nb = 1 + Math.ceil(t.estr.base / 2); const posB = ['GOL', 'ZAG', 'LAT', 'VOL', 'MEI', 'ATA'];
  for (let i = 0; i < nb; i++) { const j = geraJogador(posB[rndi(0, 5)], DIVS[t.div].base - 8); j.idade = rndi(16, 18); j.pot = clamp(DIVS[t.div].base - 8 + rndi(12, 22) + t.estr.base * 2, 20, 99); t.base.push(j); }
  t.base = t.base.slice(-8);
  linhas.push(`🌱 ${nb} young player(s) came up from the academy (Club tab).`);
  // nova temporada
  t.historico.push(msg); log(msg, 'l-lvl');
  t.temporada++; t.liga = gerarLiga(t.div); t.copa = novaCopa(); t.mercado = []; t.finTemp = { ent: 0, sai: 0 }; t.sacado = 0;
  autoEscalar(); t.meta = defineMeta();
  linhas.push(`New sponsor goal: ${METAS[t.meta].txt}.`);
  salvar();
  abreModal.largo = true;
  abreModal(el('h2', {}, `End of season ${t.temporada - 1}`), el('p', {}, el('b', {}, msg)), ...linhas.map(x => el('p', {}, x)),
    el('div', { class: 'opcoes', style: 'justify-content:center' }, el('button', { class: 'btn amarelo', onclick: () => abrirTime('liga') }, `Start season ${t.temporada}`)));
}
function modalFundar() {
  const s = G.save; let c1 = '#f8d838', c2 = '#2a8a3a';
  // v408 (dono: "Deixe o skalzinho escolher um nick, não uma lista"): o nome do time é ESCRITO pelo jogador (até 24 letras),
  // com filtro de palavrões e o botão 🎲 Sugerir (as listas da v407). O campo e o filtro moram em online_seguro.js.
  const inpT = el('input', { maxlength: 24, placeholder: 'E.g.: Village Lions', value: `${s.nome} FC`.slice(0, 24) });
  const nomeT = typeof osgSeletorTime === 'function' ? osgSeletorTime(`${s.nome} FC`.slice(0, 24)) : { el: inpT, nome: () => { const n = inpT.value.trim().replace(/[<>]/g, ''); return n.length >= 3 ? n : null; }, partes: () => null, erro: () => 'Use at least 3 letters. 🙂' };
  const prev = el('div', { class: 'prev-escudo' });
  const render = () => { prev.innerHTML = ''; prev.append(escudo(c1, c2, 64)); };
  const paleta = (qual) => el('div', { class: 'chips' }, ...CORES_TIME.map(c => { const b = el('button', { class: 'chip', type: 'button' }); const i = el('i'); i.style.background = c; b.append(i); b.onclick = () => { if (qual === 1) c1 = c; else c2 = c; render(); }; return b; }));
  render();
  abreModal(el('h2', {}, 'Found my team'), el('p', {}, 'You’re a grown-up now and already have a name in soccer. Time to build your own club! You’ll be the team’s star and start in the Sandlot League, with friends from the village. Sign new players, take care of the club funds and facilities, climb the divisions up to Série A — and then take your club to the leagues of Egypt, Japan, Europe... all the way to the Club World Cup.'),
    el('div', { class: 'npc-topo' }, prev, el('div', { style: 'flex:1' }, el('label', {}, 'Team name', nomeT.el), el('p', {}, 'Main color'), paleta(1), el('p', {}, 'Secondary color'), paleta(2))),
    el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo grande', onclick: () => { const n = nomeT.nome(); if (!n) { avisoJogo(nomeT.erro ? nomeT.erro() : 'That name isn’t allowed. Pick another one! 🙂'); return; } if (s.ouro < 500) { log('Founding a team costs 500 coins.', 'l-dano'); return; } s.ouro -= 500; fundarTime(n, c1, c2); const p = nomeT.partes(); if (p) s.time.partes = p; abrirTime('elenco'); } }, 'Found (500 coins)')));
}
