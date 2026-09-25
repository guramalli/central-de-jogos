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
const POS_NOME = { GOL: 'Goleiro', ZAG: 'Zagueiro', LAT: 'Lateral', VOL: 'Volante', MEI: 'Meia', ATA: 'Atacante' };
const POS_COMPAT = { ZAG: ['VOL', 'LAT'], LAT: ['ZAG', 'VOL', 'MEI'], VOL: ['ZAG', 'MEI', 'LAT'], MEI: ['VOL', 'ATA', 'LAT'], ATA: ['MEI'], GOL: [] };
const FORMACOES = {
  '4-4-2': ['GOL', 'ZAG', 'ZAG', 'LAT', 'LAT', 'VOL', 'VOL', 'MEI', 'MEI', 'ATA', 'ATA'],
  '4-3-3': ['GOL', 'ZAG', 'ZAG', 'LAT', 'LAT', 'VOL', 'MEI', 'MEI', 'ATA', 'ATA', 'ATA'],
  '3-5-2': ['GOL', 'ZAG', 'ZAG', 'ZAG', 'LAT', 'LAT', 'VOL', 'MEI', 'MEI', 'ATA', 'ATA'],
  '5-3-2': ['GOL', 'ZAG', 'ZAG', 'ZAG', 'LAT', 'LAT', 'VOL', 'VOL', 'MEI', 'ATA', 'ATA'],
  '4-5-1': ['GOL', 'ZAG', 'ZAG', 'LAT', 'LAT', 'VOL', 'VOL', 'MEI', 'MEI', 'MEI', 'ATA'],
};
const TATICAS = {
  equilibrada: { nome: 'Equilibrada', atq: 1, mei: 1, def: 1, en: 1, desc: 'Nem lá, nem cá.' },
  ofensiva: { nome: 'Ofensiva', atq: 1.12, mei: 1, def: 0.9, en: 1.05, desc: '+ataque, −defesa.' },
  defensiva: { nome: 'Retranca', atq: 0.86, mei: 1, def: 1.14, en: 0.95, desc: '+defesa, −ataque.' },
  pressao: { nome: 'Pressão alta', atq: 1.04, mei: 1.12, def: 0.96, en: 1.35, desc: '+meio-campo, cansa muito.' },
  contra: { nome: 'Contra-ataque', atq: 1.1, mei: 0.9, def: 1.05, en: 1, desc: 'Cede a bola e aproveita os espaços.' },
};

/* ---------------- países e divisões ---------------- */
// Cada país tem uma pirâmide de divisões (da mais baixa para a mais alta) e a força média dos times.
// A divisão de entrada de um país tem mais ou menos a força da elite do país anterior.
const PAISES = [
  { id: 'brasil', nome: 'Brasil', lvl: NIVEL_TIME, copa: 'Copa do Brasil', cores: ['#1a9a3a', '#f8d838', '#2a4ad9'], divs: [['Várzea', 26], ['Série D', 34], ['Série C', 42], ['Série B', 50], ['Série A', 58]] },
  { id: 'egito', nome: 'Egito', lvl: 50, copa: 'Copa do Egito', cores: ['#ce1126', '#ffffff', '#1a1a1a'], divs: [['2ª Divisão Egípcia', 57], ['Liga do Nilo', 62]] },
  { id: 'japao', nome: 'Japão', lvl: 62, copa: 'Copa do Japão', cores: ['#ffffff', '#d8203a', '#ffffff'], divs: [['2ª Divisão Japonesa', 61], ['Liga do Sol Nascente', 66]] },
  { id: 'catar', nome: 'Catar', lvl: 74, copa: 'Copa do Emir', cores: ['#ffffff', '#8a1538', '#8a1538'], vert: true, divs: [['2ª Divisão do Catar', 65], ['Liga das Estrelas do Golfo', 70]] },
  { id: 'eua', nome: 'Estados Unidos', lvl: 86, copa: 'Copa dos EUA', cores: ['#b22234', '#ffffff', '#3c3b6e'], divs: [['Liga Norte-Americana B', 69], ['Liga Norte-Americana', 73]] },
  { id: 'portugal', nome: 'Portugal', lvl: 100, copa: 'Taça de Portugal', cores: ['#006600', '#ff0000', '#ff0000'], vert: true, divs: [['3ª Liga Portuguesa', 72], ['2ª Liga Portuguesa', 75], ['Liga Lusitana', 78]] },
  { id: 'espanha', nome: 'Espanha', lvl: 112, copa: 'Copa do Rei', cores: ['#c60b1e', '#ffc400', '#c60b1e'], divs: [['3ª Divisão Espanhola', 76], ['2ª Divisão Espanhola', 79], ['Liga Ibérica', 82]] },
  { id: 'italia', nome: 'Itália', lvl: 124, copa: 'Copa da Itália', cores: ['#009246', '#ffffff', '#ce2b37'], vert: true, divs: [['Série C Italiana', 80], ['Série B Italiana', 83], ['Série A Italiana', 86]] },
  { id: 'alemanha', nome: 'Alemanha', lvl: 136, copa: 'Copa da Alemanha', cores: ['#1a1a1a', '#dd0000', '#ffce00'], divs: [['Liga Regional Alemã', 83], ['2ª Liga Alemã', 86], ['1ª Liga Alemã', 89]] },
  { id: 'inglaterra', nome: 'Inglaterra', lvl: 148, copa: 'Copa da Inglaterra', cores: ['#ffffff', '#ce1124', '#ffffff'], divs: [['Divisão Nacional Inglesa', 86], ['Segundona Inglesa', 89], ['Primeira Liga Inglesa', 92]] },
  { id: 'mundo', nome: 'Mundial', lvl: 150, copa: null, cores: ['#2a4ad9', '#2ad96a', '#2a4ad9'], divs: [['Mundial de Clubes', 95]] },
];
const PAIS = Object.fromEntries(PAISES.map(p => [p.id, p]));
const PAISES_EUROPA = ['portugal', 'espanha', 'italia', 'alemanha', 'inglaterra'];
// lista "achatada" de todas as divisões — t.div é um índice aqui
const DIVS = PAISES.flatMap(p => p.divs.map(([nome, base], k) => ({ nome, base, pais: p.id, k, topo: k === p.divs.length - 1, piso: k === 0 })));
function divDe(pais, k) { return DIVS.findIndex(d => d.pais === pais && d.k === k); }
const TIMES_LIGA = 10;
const GATILHO_COPA = [5, 11, 17]; // a fase da copa abre depois dessas rodadas da liga
const FASES_COPA = ['Quartas de final', 'Semifinal', 'Final'];

const NOMES_PAIS = {
  egito: { a: ['Clube', 'Faraós de', 'Estrela de', 'União de', 'Falcões de', 'Escaravelhos de'], b: ['Gizé', 'Luxor', 'Assuã', 'Alexandria', 'Suez', 'Karnak', 'Sinai', 'Delta', 'Faium', 'Port Said', 'Mênfis', 'Edfu'] },
  japao: { a: ['FC', 'Tigres de', 'Dragões de', 'Samurais de', 'Cerejeiras de', 'Garças de'], b: ['Osaka', 'Kyoto', 'Nagoya', 'Sapporo', 'Kobe', 'Yokohama', 'Sendai', 'Fukuoka', 'Hiroshima', 'Nara', 'Kanazawa', 'Okinawa'] },
  catar: { a: ['Clube', 'Falcões de', 'Pérolas de', 'Dunas de', 'Estrela de', 'Oásis de'], b: ['Doha', 'Al Wakrah', 'Lusail', 'Al Khor', 'Dukhan', 'Mesaieed', 'Umm Salal', 'Zubarah', 'Shamal', 'Ras Laffan'] },
  eua: { b: ['Orlando', 'Tampa', 'Austin', 'Denver', 'Boston', 'Seattle', 'Phoenix', 'Atlanta', 'Chicago', 'Houston', 'Detroit', 'Portland'], c: ['Sharks', 'Comets', 'Rattlers', 'Thunder', 'Eagles', 'Pioneers', 'Storm', 'Rockets', 'Coyotes', 'Surfers'] },
  portugal: { a: ['Académico de', 'Desportivo de', 'União de', 'Estrela de', 'Atlético de', 'Os Leões de'], b: ['Aveiro', 'Évora', 'Faro', 'Viseu', 'Leiria', 'Setúbal', 'Sintra', 'Cascais', 'Tomar', 'Óbidos', 'Nazaré', 'Lagos'] },
  espanha: { a: ['Deportivo', 'Atlético', 'Unión', 'Club', 'Racing', 'Sporting'], b: ['Toledo', 'Salamanca', 'Segóvia', 'Córdoba', 'Zamora', 'Ávila', 'Múrcia', 'Burgos', 'Cáceres', 'Teruel', 'Huesca', 'Lugo'] },
  italia: { a: ['Associazione', 'Unione', 'Sportiva', 'Atletico', 'Virtus', 'Robur'], b: ['Siena', 'Pisa', 'Lucca', 'Trento', 'Rimini', 'Pádua', 'Lecce', 'Como', 'Perugia', 'Módena', 'Ravena', 'Ancona'] },
  alemanha: { a: ['SV', 'FC', 'TSV', 'SC', 'Viktoria', 'Fortuna'], b: ['Ulm', 'Kassel', 'Trier', 'Passau', 'Rostock', 'Lübeck', 'Erfurt', 'Jena', 'Bamberg', 'Göttingen', 'Würzburg', 'Coblença'] },
  inglaterra: { b: ['Bath', 'York', 'Dover', 'Chester', 'Exeter', 'Durham', 'Kent', 'Hull', 'Lincoln', 'Bristol', 'Salisbury', 'Canterbury'], c: ['Rovers', 'Athletic', 'Albion', 'Wanderers', 'Town', 'Harriers', 'Rangers', 'Mariners'] },
  mundo: { a: ['Real', 'Inter', 'Atlético', 'Sporting', 'Dínamo', 'Olímpico', 'Racing', 'Imperial'], b: ['Tordesilhas', 'Lisboa Nova', 'Nova Iorque', 'Tóquio', 'Cairo', 'Madri Velha', 'Monte Alto', 'Porto Frio', 'Sidney', 'Buenos Aires', 'Munique Sul', 'Doha Norte'] },
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
    [['Hamburguer SV', '#1a4ad9', '#ffffff'], ['Hertha Berlim', '#1a4ad9', '#ffffff'], ['Colônia FC', '#ffffff', '#d42a2a'], ['Friburgo SC', '#d42a2a', '#1a1a1a'], ['Hoffenheimm', '#1a4ad9', '#ffffff'], ['Union Berlim', '#d42a2a', '#ffffff'], ['Mainzz 05', '#d42a2a', '#ffffff'], ['Augsburgo', '#d42a2a', '#1a8a3a'], ['Hannover 97', '#d42a2a', '#1a1a1a'], ['Nuremberga', '#8a1a2a', '#1a1a1a']],
    [['Bayernn München', '#d42a2a', '#ffffff'], ['Borússia Dortmundo', '#f0c030', '#1a1a1a'], ['Bayer Leverkuzen', '#d42a2a', '#1a1a1a'], ['RB Leipzigue', '#ffffff', '#d42a2a'], ['Eintracht Frankfurte', '#1a1a1a', '#d42a2a'], ['Stuttgartt', '#ffffff', '#d42a2a'], ['Wolfsburgo', '#1a8a3a', '#ffffff'], ['Gladbachinho', '#ffffff', '#1a8a3a'], ['Werder Bremmen', '#1a8a3a', '#ffffff'], ['Schalke 05', '#1a4ad9', '#ffffff']],
  ],
  inglaterra: [
    [['Burnlei', '#8a1a2a', '#6ab0e0'], ['Watfordd', '#f0c030', '#d42a2a'], ['Norwichi', '#f0c030', '#1a8a3a'], ['Middlesbrô', '#d42a2a', '#ffffff'], ['Sheffield Unaited', '#d42a2a', '#ffffff'], ['Blackburno', '#1a4ad9', '#ffffff'], ['Derby Countri', '#ffffff', '#1a1a1a'], ['Ipswichi', '#1a4ad9', '#ffffff'], ['Queens Park Rangérs', '#1a4ad9', '#ffffff'], ['Bristol Citty', '#d42a2a', '#ffffff']],
    [['Leeds Unaited', '#ffffff', '#f0c030'], ['Leicestter', '#1a4ad9', '#ffffff'], ['Lobos de Wolverhampton', '#f0a030', '#1a1a1a'], ['Palácio de Cristal', '#1a4ad9', '#d42a2a'], ['Nottingham Floresta', '#d42a2a', '#ffffff'], ['Brightom', '#1a4ad9', '#ffffff'], ['Fulhamm', '#ffffff', '#1a1a1a'], ['Brentfordd', '#d42a2a', '#ffffff'], ['Southamptom', '#d42a2a', '#ffffff'], ['Sunderlandia', '#d42a2a', '#ffffff']],
    [['Manchester Citty', '#6ab0e0', '#ffffff'], ['Liverpúl', '#d42a2a', '#ffffff'], ['Arsenau', '#d42a2a', '#ffffff'], ['Chelsi', '#1a4ad9', '#ffffff'], ['Manchester Unaited', '#d42a2a', '#1a1a1a'], ['Newcastello', '#1a1a1a', '#ffffff'], ['Totenhamm', '#ffffff', '#1a2a6a'], ['Aston Vila', '#8a1a2a', '#6ab0e0'], ['West Hamm', '#8a1a2a', '#6ab0e0'], ['Evertão', '#1a4ad9', '#ffffff']],
  ],
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
  ct: { nome: 'Centro de Treinamento', base: 1500, desc: n => `Treinos e jogos dão +${n * 30}% de XP aos jogadores.` },
  med: { nome: 'Departamento Médico', base: 1200, desc: n => `Energia volta ${n * 25}% mais rápido e o time cansa ${n * 5}% menos.` },
  estadio: { nome: 'Estádio', base: 2000, desc: n => `Bilheteria +${n * 50}% nos jogos em casa.` },
  base: { nome: 'Categoria de Base', base: 1800, desc: n => `${1 + Math.ceil(n / 2)} jovem(ns) promessa(s) por temporada, potencial +${n * 2}.` },
  olheiro: { nome: 'Rede de Olheiros', base: 1000, desc: n => `Mercado com ${6 + n} jogadores, ${n ? '+' + n : 'sem bônus'} de força.` },
};
const ESTR_MAX = 5;
function custoEstr(k, n) { return Math.round(ESTRUTURA[k].base * Math.pow(2.6, n)); }
const METAS = {
  campeao: { txt: 'Ser CAMPEÃO', ok: pos => pos === 1 },
  subir: { txt: 'Conseguir o ACESSO (top 2)', ok: pos => pos <= 2 },
  top5: { txt: 'Terminar entre os 5 primeiros', ok: pos => pos <= 5 },
  escapar: { txt: 'Não cair (fora dos 2 últimos)', ok: pos => pos <= TIMES_LIGA - 2 },
};

const CORES_TIME = ['#e03a3a', '#f8d838', '#2a4ad9', '#2ad96a', '#ffffff', '#1a1a1a', '#ff7a1a', '#7a2ad9', '#3aa0e0', '#8a1010', '#ff5ad0', '#5a3a1a'];
const NOMES_J = ['Zeca', 'Tonho', 'Luan', 'Biel', 'Caio', 'Davi', 'Rafa', 'Gui', 'Nando', 'Tuca', 'Neném', 'Pipoca', 'Foguinho', 'Carlinhos', 'Miltinho', 'Jajá', 'Lelê', 'Nina', 'Bia', 'Duda', 'Mari', 'Juju', 'Lari', 'Tati', 'Gabi', 'Téo', 'Kadu', 'Vini', 'Leco', 'Dedé', 'Fumaça', 'Tatu', 'Paçoca', 'Magrão', 'Baixinho', 'Alemão', 'Cabeção', 'Formiga', 'Bolinha', 'Russo', 'Ceará', 'Paraíba', 'Tchê', 'Mineiro', 'Carioca', 'Branco', 'Pretinho', 'Sorriso', 'Canela', 'Faísca', 'Sabiá', 'Tiziu', 'Bambu', 'Jacaré', 'Xodó', 'Pingo', 'Taco', 'Toquinho', 'Lampião', 'Marreco'];
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
function nomeDivisaoPais(d) { const x = DIVS[d] || DIVS[0]; return x.pais === 'brasil' ? `${x.nome} (Brasil)` : x.nome; }
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
function limiteSaque() { return premioDiv(G.save.time.div) * 8; }
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
    pais: 'brasil', nomesReais: true, caixa: 1500, patro: 1, estr: { ct: 0, med: 0, estadio: 0, base: 0, olheiro: 0 }, base: [], trofeus: [], campeoes: {}, finTemp: { ent: 0, sai: 0 }, fin: [],
  };
  ['GOL', 'ZAG', 'ZAG', 'LAT', 'LAT', 'VOL', 'VOL', 'MEI', 'MEI', 'ATA', 'ATA'].forEach(p => s.time.elenco.push(geraJogador(p, 27)));
  s.time.piramide = gerarPiramide('brasil', 0);
  s.time.liga = gerarLiga(0); s.time.copa = novaCopa();
  autoEscalar(); s.time.meta = defineMeta();
  log(`Você fundou o ${nome}! Começa na Várzea. Suba divisão por divisão até a Série A — e depois conquiste o mundo!`, 'l-lvl'); banner(nome.toUpperCase(), 'Seu time foi fundado!'); som('nivel');
  salvar();
}
// saves antigos (liga única de 8 times) viram a pirâmide nova
function renomeiaRivais() {
  const t = G.save.time; const reais = CLUBES_PAIS[t.pais]; if (!reais) return;
  const mapa = {};
  t.piramide.divs.forEach((lista, k) => [...lista].sort((a, b) => b.ovr - a.ovr).forEach((a, i) => { const r = reais[k][i]; if (!r) return; [a.nome, a.cor1, a.cor2] = r; mapa[a.id] = a; }));
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
  log(`Novo sistema de campeonatos! O ${t.nome} foi inscrito na ${nomeDivisaoPais(k)} com 10 times, copa nacional e caixa próprio.`, 'l-lvl');
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
  const t = G.save.time; if (!t) return; const agora = Date.now(); const min = (agora - (t.ultEnergia || agora)) / 60000; t.ultEnergia = agora;
  const ganho = min * 12 * (1 + 0.25 * ((t.estr && t.estr.med) || 0)); // 12 pontos por minuto real
  t.elenco.forEach(j => j.energia = Math.min(100, j.energia + ganho)); t.energiaEu = Math.min(100, (t.energiaEu || 100) + ganho);
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
    if (s.nivel < NIVEL_TIME) { abreModal(el('h2', {}, 'Meu Time'), el('p', {}, `Na fase adulta (Sub-20, nível ${NIVEL_TIME}) você poderá fundar seu próprio clube: contratar jogadores, montar a escalação e disputar campeonatos — da Várzea até as grandes ligas do mundo.`), el('p', {}, `Você está no nível ${s.nivel}. Continue treinando! Quando chegar lá, procure o Empresário Rodrigues na Cidade.`)); return; }
    return modalFundar();
  }
  garanteTime(); recuperaEnergia();
  abreModal.largo = true;
  const t = s.time; const L = t.liga;
  const tabs = el('div', { class: 'tabs-modal' }, ...[['elenco', 'Elenco'], ['liga', 'Liga'], ['copa', 'Copa'], ['clube', 'Clube'], ['mercado', 'Mercado'], ['jogar', 'Jogar partida']].map(([k, n]) => el('button', { class: 'btn ' + (aba === k ? 'amarelo' : ''), onclick: () => abrirTime(k) }, n)));
  const cab = el('div', { class: 'time-cab' }, escudo(t.cor1, t.cor2, 40), el('div', {}, el('h2', { style: 'margin:0' }, t.nome),
    el('div', {}, bandeira(t.pais), `${nomeDivisao(t.div)} · Temporada ${t.temporada} · Rodada ${Math.min(L.rodadas.length, L.rodada + 1)}/${L.rodadas.length} · Títulos: ${t.titulos} · Caixa: `, precoTag(t.caixa))));
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
  const en = el('div', { class: 'bl-hp', title: 'Energia' }); const i = el('i'); i.style.width = clamp(j.energia, 0, 100) + '%'; i.style.background = j.energia > 60 ? '#3ad83a' : j.energia > 30 ? '#e8d23a' : '#e83a3a'; en.append(i);
  return el('div', { class: 'linha-item' + (j.eu ? ' eu-card' : '') }, c,
    el('div', { class: 'nm' }, el('b', {}, (j.eu ? '★ ' : '') + j.nome + (j.lenda ? ' (lenda)' : '')), el('small', {}, `${POS_NOME[j.pos]} · ATQ ${j.atq} · DEF ${j.def} · PAS ${j.pas} · FÍS ${j.fis}${j.eu ? '' : ` · nível ${j.nivel} (máx ${j.pot}) · ${j.idade || '?'} anos · salário ${fmt(salario(j))}`}`), en),
    el('b', { class: 'ovr', title: 'Força geral' }, ovr(j)), extra || '');
}
function telaElenco() {
  const t = G.save.time; const wrap = el('div');
  const fSel = el('select', { class: 'sel' }, ...Object.keys(FORMACOES).map(f => el('option', { value: f, selected: f === t.formacao ? 'selected' : null }, f)));
  fSel.onchange = () => { t.formacao = fSel.value; autoEscalar(); abrirTime('elenco'); };
  const tSel = el('select', { class: 'sel' }, ...Object.entries(TATICAS).map(([k, v]) => el('option', { value: k, selected: k === t.tatica ? 'selected' : null }, `${v.nome} — ${v.desc}`)));
  tSel.onchange = () => { t.tatica = tSel.value; abrirTime('elenco'); };
  const treinoOk = t.diaTreino !== G.save.dia; const ct = custoTreino();
  wrap.append(el('div', { class: 'opcoes', style: 'align-items:center' }, el('label', {}, 'Formação ', fSel), el('label', {}, 'Tática ', tSel),
    el('button', { class: 'btn', onclick: () => { autoEscalar(); abrirTime('elenco'); } }, 'Escalar automático'),
    el('button', { class: 'btn verde', disabled: !treinoOk || t.caixa < ct ? 'disabled' : null, title: 'Uma vez por dia do jogo, pago pelo caixa do clube', onclick: () => {
      t.caixa -= ct; t.finTemp.sai -= ct; t.diaTreino = G.save.dia; const xp = Math.round(45 * (1 + 0.3 * t.estr.ct)); t.elenco.forEach(j => ganhaXpJogador(j, xp)); log(`Treino do ${t.nome} feito! Todos ganharam ${xp} de experiência.`, 'l-xp'); som('apito'); abrirTime('elenco');
    } }, treinoOk ? `Treinar elenco (${fmt(ct)} do caixa)` : 'Treino feito hoje')));
  const esc = escalacaoAtual(); const s = setores(esc, t.tatica, t.moral);
  wrap.append(barrasSetores(s, null));
  wrap.append(el('h3', {}, `Titulares — força média ${forcaTitulares()} (divisão: ~${DIVS[t.div].base})`));
  const lista = el('div', { class: 'lista' });
  const todos = elencoCompleto();
  esc.forEach(({ slot, j }, i) => {
    const sel = el('select', { class: 'sel' }, el('option', { value: '' }, '— vazio —'), ...todos.map(x => el('option', { value: x.id, selected: j && x.id === j.id ? 'selected' : null }, `${x.nome} (${x.pos} ${ovr(x)})`)));
    sel.onchange = () => { const v = sel.value || null; const k = t.titulares.indexOf(v); if (v && k >= 0) t.titulares[k] = t.titulares[i]; t.titulares[i] = v; abrirTime('elenco'); };
    const aviso = j && j.pos !== slot ? el('small', { style: 'color:#b0301a' }, ' fora de posição') : '';
    lista.append(el('div', { class: 'slot-esc' }, el('b', { class: 'pos-tag' }, slot), j ? cartaJogador(j) : el('div', { class: 'linha-item bloq' }, 'Ninguém escalado'), el('div', {}, sel, aviso)));
  });
  wrap.append(lista);
  const reservas = todos.filter(j => !t.titulares.includes(j.id));
  wrap.append(el('h3', {}, `Reservas (${reservas.length}) — elenco ${t.elenco.length + 1}/20 · folha salarial ${fmt(folhaSalarial())} por rodada`));
  const lr = el('div', { class: 'lista' });
  reservas.forEach(j => {
    const venda = Math.round(precoJogador(j) * 0.5);
    lr.append(cartaJogador(j, j.eu ? '' : el('button', { class: 'btn mini', title: 'Vende o jogador; o dinheiro vai para o caixa do clube', onclick: () => { if (!confirm(`Vender ${j.nome} por ${fmt(venda)} tostões?`)) return; t.elenco = t.elenco.filter(x => x.id !== j.id); t.titulares = t.titulares.map(id => id === j.id ? null : id); t.caixa += venda; t.finTemp.ent += venda; log(`${j.nome} foi vendido por ${fmt(venda)} tostões.`, 'l-loot'); som('moeda'); salvar(); abrirTime('elenco'); } }, `Vender (${fmt(venda)})`)));
  });
  if (!reservas.length) lr.append(el('p', { class: 'vazio' }, 'Sem reservas. Contrate no Mercado para poder revezar quem está cansado.'));
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
  box.append(linha('Ataque', a.atq, b && b.atq, mx('atq')), linha('Meio', a.mei, b && b.mei, mx('mei')), linha('Defesa', a.def, b && b.def, mx('def')), linha('Goleiro', a.gol, b && b.gol, mx('gol')));
  return box;
}
function telaLiga() {
  const t = G.save.time; const L = t.liga; const d = DIVS[t.div]; const wrap = el('div'); const n = L.times.length;
  const zona = i => i === 0 && d.topo ? ' 🏆' : i < 2 && !d.topo ? ' ▲' : i >= n - 2 && !d.piso ? ' ▼' : '';
  const tab = el('table', { class: 'rank-tab' }, el('tr', {}, ...['#', 'Time', 'P', 'J', 'V', 'E', 'D', 'SG', 'GP'].map(h => el('th', {}, h))));
  tabelaOrdenada(L).forEach((x, i) => tab.append(el('tr', { class: (x.id === 'eu' ? 'eu ' : '') + (zona(i).includes('▲') || zona(i).includes('🏆') ? 'z-sobe' : zona(i).includes('▼') ? 'z-cai' : '') }, el('td', {}, (i + 1) + zona(i)), el('td', {}, miniEscudo(x), ' ' + x.nome + (x.id !== 'eu' ? ` (${x.ovr})` : '')), el('td', {}, el('b', {}, x.pts)), el('td', {}, x.j), el('td', {}, x.v), el('td', {}, x.e), el('td', {}, x.d), el('td', {}, x.gp - x.gc), el('td', {}, x.gp))));
  const regra = [d.topo ? (t.pais === 'mundo' ? 'O 1º é CAMPEÃO DO MUNDO' : `O 1º é CAMPEÃO de ${PAIS[t.pais].nome} e recebe convite para ligas de outros países`) : 'Os 2 primeiros SOBEM de divisão', d.piso ? '' : 'os 2 últimos CAEM'].filter(Boolean).join('; ');
  wrap.append(el('p', {}, bandeira(t.pais), `${d.nome} — ${L.rodadas.length} rodadas (turno e returno). ${regra}.`),
    el('p', { class: 'meta-linha' }, `🎯 Meta do patrocinador: ${METAS[t.meta].txt}. Hoje você está em ${minhaPosicao()}º.`), tab);
  if (L.ultimos.length) {
    wrap.append(el('h3', {}, `Resultados da rodada ${L.rodada}`));
    const box = el('div', { class: 'resultados' });
    L.ultimos.forEach(([a, b, x, y]) => box.append(el('div', { class: L.times[a].id === 'eu' || L.times[b].id === 'eu' ? 'eu' : '' }, `${L.times[a].nome} ${x} × ${y} ${L.times[b].nome}`)));
    wrap.append(box);
  }
  // pirâmide do país
  const p = PAIS[t.pais]; const pir = el('div', { class: 'piramide' });
  for (let k = p.divs.length - 1; k >= 0; k--) {
    const aqui = k === d.k; const dd = DIVS[divDe(t.pais, k)];
    pir.append(el('div', { class: 'pdiv' + (aqui ? ' aqui' : ''), style: `width:${60 + (p.divs.length - 1 - k) * 40 / Math.max(1, p.divs.length - 1)}%` }, `${dd.nome} · força ~${dd.base}${aqui ? ' ← VOCÊ' : ''}`));
  }
  wrap.append(el('h3', {}, `Pirâmide de ${p.nome}`), pir);
  if (t.historico.length) { wrap.append(el('h3', {}, 'Histórico')); t.historico.slice(-8).reverse().forEach(h => wrap.append(el('p', {}, h))); }
  return wrap;
}
function telaCopa() {
  const t = G.save.time; const c = t.copa; const L = t.liga; const wrap = el('div');
  if (!c) { wrap.append(el('p', {}, 'No Mundial de Clubes não há copa nacional: cada jogo da liga vale como uma final!')); return wrap; }
  wrap.append(el('h3', {}, `🏆 ${c.nome}`), el('p', {}, `Mata-mata com times de todas as divisões de ${PAIS[t.pais].nome}. Empate vai para os pênaltis. As fases acontecem depois das rodadas ${GATILHO_COPA.join(', ')} da liga.`));
  const lista = el('div', { class: 'lista' });
  FASES_COPA.forEach((f, i) => {
    const adv = c.advs[i]; const r = c.res[i];
    let st;
    if (r) st = `${r.gn} × ${r.ge}${r.pen ? ` (pên. ${r.pen[0]}×${r.pen[1]})` : ''} — ${r.venceu ? 'classificado!' : 'eliminado'}`;
    else if (c.status !== 'vivo' || i > c.fase) st = c.status === 'eliminado' ? '—' : `depois da rodada ${GATILHO_COPA[i]}`;
    else st = L.rodada >= GATILHO_COPA[i] ? 'PRÓXIMO JOGO!' : `depois da rodada ${GATILHO_COPA[i]}`;
    lista.append(el('div', { class: 'linha-item' + (c.status === 'eliminado' && !r ? ' bloq' : '') }, el('b', { class: 'pos-tag' }, i + 1), el('div', { class: 'nm' }, el('b', {}, f), el('small', {}, i <= c.fase || r ? `vs ${adv.nome} (força ${adv.ovr})` : 'adversário a definir')), el('b', {}, st)));
  });
  wrap.append(lista);
  if (c.status === 'campeao') wrap.append(el('p', { class: 'meta-linha' }, `CAMPEÃO da ${c.nome}!`));
  if (c.status === 'eliminado') wrap.append(el('p', { class: 'vazio' }, 'Fora da copa nesta temporada. Na próxima tem mais!'));
  wrap.append(el('p', { class: 'vazio' }, `Prêmios: quartas ${fmt(Math.round(premioDiv(t.div) * 1.5))}, semi ${fmt(premioDiv(t.div) * 2)}, final ${fmt(premioDiv(t.div) * 3)} + bônus de campeão ${fmt(premioDiv(t.div) * 4)}.`));
  return wrap;
}
function telaClube() {
  const s = G.save; const t = s.time; const wrap = el('div');
  // caixa
  const inp = el('input', { type: 'number', min: 0, value: Math.min(s.ouro, 1000), style: 'width:110px' });
  wrap.append(el('h3', {}, '💰 Caixa do clube'),
    el('p', {}, 'O caixa paga salários, contratações, treinos e obras. Entram prêmios, patrocínio, bilheteria e vendas. A cada vitória você (o craque) ainda ganha um bicho de 25% do prêmio no seu bolso.'),
    el('div', { class: 'opcoes', style: 'align-items:center' }, el('b', {}, 'Caixa: '), precoTag(t.caixa), el('span', {}, ' · Seu bolso: '), precoTag(s.ouro), inp,
      el('button', { class: 'btn verde mini', onclick: () => { const v = Math.floor(+inp.value || 0); if (v <= 0 || v > s.ouro) { log('Valor inválido.', 'l-dano'); return; } s.ouro -= v; t.caixa += v; t.finTemp.ent += v; log(`Você investiu ${fmt(v)} tostões no ${t.nome}.`, 'l-loot'); som('moeda'); salvar(); abrirTime('clube'); } }, 'Investir no clube'),
      el('button', { class: 'btn mini', title: `Taxa de 25%. Limite por temporada: ${fmt(limiteSaque())}`, onclick: () => { const v = Math.floor(+inp.value || 0); if (v <= 0 || v > t.caixa) { log('Valor inválido.', 'l-dano'); return; } if ((t.sacado || 0) + v > limiteSaque()) { log(`O conselho só libera ${fmt(limiteSaque())} de saque por temporada (já sacou ${fmt(t.sacado || 0)}).`, 'l-dano'); som('erro'); return; } t.sacado = (t.sacado || 0) + v; t.caixa -= v; t.finTemp.sai -= v; s.ouro += Math.floor(v * 0.75); log(`Você sacou ${fmt(v)} do caixa (recebeu ${fmt(Math.floor(v * 0.75))} após a taxa).`, 'l-loot'); salvar(); abrirTime('clube'); } }, 'Sacar (taxa 25%)')));
  if (t.caixa < 0) wrap.append(el('p', { style: 'color:#b0301a' }, 'Caixa NEGATIVO: os salários atrasam e o moral do time cai a cada rodada. Invista ou venda jogadores!'));
  // patrocínio e finanças
  const fin = el('div', { class: 'fin' });
  (t.fin || []).forEach(([rot, v]) => fin.append(el('div', { class: 'fin-linha' }, el('span', {}, rot), el('b', { class: v >= 0 ? 'pos' : 'neg' }, (v >= 0 ? '+' : '') + fmt(v)))));
  wrap.append(el('h3', {}, '📈 Patrocínio e finanças'),
    el('p', {}, `Patrocínio: ${fmt(Math.round(premioDiv(t.div) * t.patro))} por rodada (contrato ×${t.patro.toFixed(2)}). Folha salarial: ${fmt(folhaSalarial())} por rodada.`),
    el('p', { class: 'meta-linha' }, `🎯 Meta desta temporada: ${METAS[t.meta].txt}. Cumprir renova o patrocínio com aumento de 15% e bônus; falhar corta 8%.`),
    el('p', {}, `Nesta temporada: entradas `, el('b', { class: 'pos' }, '+' + fmt(t.finTemp.ent)), ' · saídas ', el('b', { class: 'neg' }, fmt(t.finTemp.sai))));
  if (t.fin && t.fin.length) wrap.append(el('small', {}, 'Última partida:'), fin);
  // estrutura
  wrap.append(el('h3', {}, '🏗️ Estrutura'));
  const le = el('div', { class: 'lista' });
  for (const [k, e] of Object.entries(ESTRUTURA)) {
    const n = t.estr[k] || 0; const custo = custoEstr(k, n);
    le.append(el('div', { class: 'linha-item' }, el('div', { class: 'nm' }, el('b', {}, `${e.nome} ${'★'.repeat(n)}${'☆'.repeat(ESTR_MAX - n)}`), el('small', {}, (n ? e.desc(n) : 'Ainda não construído.') + (n < ESTR_MAX ? ` Próximo nível: ${e.desc(n + 1)}` : ''))),
      n >= ESTR_MAX ? el('b', {}, 'MÁXIMO') : el('span', { class: 'preco-col' }, precoTag(custo), el('button', { class: 'btn amarelo mini', disabled: t.caixa < custo ? 'disabled' : null, onclick: () => { if (t.caixa < custo) return; t.caixa -= custo; t.finTemp.sai -= custo; t.estr[k] = n + 1; log(`Obra concluída: ${e.nome} nível ${n + 1}!`, 'l-lvl'); som('nivel'); salvar(); abrirTime('clube'); } }, 'Melhorar'))));
  }
  wrap.append(le);
  // base
  wrap.append(el('h3', {}, `🌱 Categoria de base (${t.base.length})`));
  const lb = el('div', { class: 'lista' });
  t.base.forEach(j => lb.append(cartaJogador(j, el('span', { class: 'preco-col' },
    el('button', { class: 'btn verde mini', onclick: () => { if (t.elenco.length >= 19) { log('Elenco cheio (20). Venda alguém primeiro.', 'l-dano'); return; } t.base = t.base.filter(x => x !== j); t.elenco.push(j); log(`${j.nome} subiu da base para o profissional!`, 'l-loot'); salvar(); abrirTime('clube'); } }, 'Promover'),
    el('button', { class: 'btn mini', onclick: () => { t.base = t.base.filter(x => x !== j); abrirTime('clube'); } }, 'Liberar')))));
  if (!t.base.length) lb.append(el('p', { class: 'vazio' }, 'Novas promessas aparecem no fim de cada temporada. Melhore a Categoria de Base para receber mais e melhores.'));
  wrap.append(lb);
  // troféus
  wrap.append(el('h3', {}, `🏆 Sala de troféus (${t.trofeus.length})`));
  wrap.append(t.trofeus.length ? el('div', { class: 'trofeus' }, ...t.trofeus.map(x => el('span', { class: 'trofeu' }, `🏆 ${x.nome} (T${x.temp})`))) : el('p', { class: 'vazio' }, 'Nenhum troféu ainda. Vença uma liga ou copa!'));
  // mundo
  wrap.append(el('h3', {}, '🌍 Ligas pelo mundo'), el('p', {}, 'Campeão da divisão principal de um país? O clube recebe convite para disputar a liga do próximo país (começando na divisão de entrada). Também é preciso ter o nível do seu craque.'));
  const lm = el('div', { class: 'lista' });
  PAISES.forEach((p, i) => {
    const aqui = t.pais === p.id; const r = requisitoPais(p.id);
    lm.append(el('div', { class: 'linha-item' + (r.ok || aqui ? '' : ' bloq') }, bandeira(p.id), el('div', { class: 'nm' }, el('b', {}, p.nome + (t.campeoes[p.id] ? ' 🏆' : '')), el('small', {}, `${p.divs.length} divisão(ões) · força ${p.divs[0][1]}–${p.divs[p.divs.length - 1][1]} · ${aqui ? 'VOCÊ ESTÁ AQUI' : r.ok ? 'convite disponível' : r.motivo}`)),
      aqui || !r.ok ? '' : el('button', { class: 'btn amarelo mini', onclick: () => mudarPais(p.id) }, 'Transferir clube')));
  });
  wrap.append(lm);
  return wrap;
}
function requisitoPais(pid) {
  const s = G.save; const t = s.time; const i = PAISES.findIndex(p => p.id === pid); const p = PAISES[i];
  if (s.nivel < p.lvl) return { ok: false, motivo: `precisa do nível ${p.lvl}` };
  if (i === 0) return { ok: true };
  if (pid === 'mundo') return PAISES_EUROPA.some(x => t.campeoes[x]) ? { ok: true } : { ok: false, motivo: 'seja campeão da liga principal de um país europeu' };
  const ant = PAISES[i - 1];
  return t.campeoes[ant.id] || t.campeoes[pid] ? { ok: true } : { ok: false, motivo: `seja campeão da ${ant.divs[ant.divs.length - 1][0]} (${ant.nome})` };
}
function mudarPais(pid) {
  const t = G.save.time; const p = PAIS[pid];
  if (!requisitoPais(pid).ok) return;
  if (t.liga.rodada > 0 && !confirm(`Transferir o ${t.nome} para ${p.nome}? A temporada atual será abandonada e o clube começa na ${p.divs[0][0]}.`)) return;
  t.historico.push(`Temporada ${t.temporada}: o clube se mudou para ${p.nome}!`);
  t.pais = pid; t.div = divDe(pid, 0); t.piramide = gerarPiramide(pid, 0); t.liga = gerarLiga(t.div); t.copa = novaCopa(); t.meta = defineMeta(); t.mercado = []; t.finTemp = { ent: 0, sai: 0 };
  banner(`${t.nome.toUpperCase()} EM ${p.nome.toUpperCase()}!`, p.divs[0][0]); log(`O ${t.nome} agora disputa a ${p.divs[0][0]} (${p.nome}). Novos rivais, novos desafios!`, 'l-lvl'); som('apito');
  salvar(); abrirTime('liga');
}
function telaMercado() {
  const s = G.save; const t = s.time; const wrap = el('div');
  if (t.diaMercado !== s.dia || !t.mercado.length) { t.diaMercado = s.dia; t.mercado = geraMercado(); }
  wrap.append(el('p', {}, `O olheiro traz jogadores novos a cada dia do jogo. Contratações saem do caixa do clube: `, precoTag(t.caixa)));
  const lista = el('div', { class: 'lista' });
  t.mercado.forEach(j => {
    const preco = precoJogador(j);
    lista.append(cartaJogador(j, el('span', { class: 'preco-col' }, precoTag(preco), el('button', { class: 'btn verde mini', onclick: () => {
      if (t.elenco.length >= 19) { log('Elenco cheio (20). Venda alguém primeiro.', 'l-dano'); return; }
      if (t.caixa < preco) { log('Caixa do clube insuficiente. Invista no clube (aba Clube) ou venda jogadores.', 'l-dano'); som('erro'); return; }
      t.caixa -= preco; t.finTemp.sai -= preco; t.elenco.push(j); t.mercado = t.mercado.filter(x => x !== j); log(`${j.nome} (${POS_NOME[j.pos]}) assinou com o ${t.nome}!`, 'l-loot'); som('moeda'); salvar(); abrirTime('mercado');
    } }, 'Contratar'))));
  });
  wrap.append(lista);
  const custo = Math.round(premioDiv(t.div) * 1.2);
  wrap.append(el('div', { class: 'opcoes' }, el('button', { class: 'btn', onclick: () => { if (t.caixa < custo) return; t.caixa -= custo; t.finTemp.sai -= custo; t.mercado = geraMercado(); abrirTime('mercado'); } }, `Chamar o olheiro de novo (${fmt(custo)} do caixa)`)));
  // lendas: chefões vencidos
  wrap.append(el('h3', {}, 'Lendas (chefões que você venceu)'));
  const ll = el('div', { class: 'lista' });
  for (const [id, L] of Object.entries(LENDAS)) {
    const venceu = s.flags['venceu_' + id]; const ja = t.elenco.some(j => j.lendaId === id);
    const j = { id: 'L_' + id, lendaId: id, lenda: true, nome: MONSTROS[id].nome.split(',')[0], pos: L.pos, atq: L.atq, def: L.def, pas: L.pas, fis: L.fis, pot: L.pot, nivel: 1, xp: 0, energia: 100, idade: 30, look: { corpo: MONSTROS[id].look.corpo, pele: MONSTROS[id].look.pele, cabelo: MONSTROS[id].look.cabelo, corCabelo: MONSTROS[id].look.corCabelo } };
    if (!venceu) { ll.append(el('div', { class: 'linha-item bloq' }, el('div', { class: 'nm' }, el('b', {}, '???'), el('small', {}, `Vença ${MONSTROS[id].nome} para poder contratar.`)))); continue; }
    ll.append(cartaJogador(j, ja ? el('b', {}, 'No elenco') : el('span', { class: 'preco-col' }, precoTag(L.preco), el('button', { class: 'btn amarelo mini', onclick: () => {
      if (t.elenco.length >= 19 || t.caixa < L.preco) { log(t.caixa < L.preco ? 'Caixa do clube insuficiente.' : 'Elenco cheio.', 'l-dano'); return; }
      t.caixa -= L.preco; t.finTemp.sai -= L.preco; j.id = 'L_' + id + Date.now().toString(36); t.elenco.push(j); log(`A LENDA ${j.nome} agora joga no ${t.nome}!`, 'l-lvl'); banner(j.nome.toUpperCase(), 'Contratação de peso!'); som('nivel'); salvar(); abrirTime('mercado');
    } }, 'Contratar lenda'))));
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
  if (!pj) { wrap.append(el('p', {}, 'Temporada encerrada.'), el('button', { class: 'btn amarelo', onclick: () => fimTemporada() }, 'Ver resultado da temporada')); return wrap; }
  const { nos, eles, esc } = forcasJogo(pj); const faltam = esc.filter(x => !x.j).length;
  // estimativa rápida de chance
  let v = 0, e = 0; for (let i = 0; i < 300; i++) { const [a, b] = simRapida(nos, eles); if (a > b) v++; else if (a === b) e++; }
  const titulo = pj.tipo === 'copa' ? `🏆 ${t.copa.nome} — ${FASES_COPA[pj.fase]}` : `${nomeDivisao(t.div)} — Rodada ${t.liga.rodada + 1}`;
  const local = pj.tipo === 'copa' && pj.fase === 2 ? 'campo neutro' : pj.casa ? 'em casa' : 'fora';
  wrap.append(el('h3', { style: 'text-align:center;margin:4px 0' }, titulo));
  wrap.append(el('div', { class: 'placar-pre' }, el('div', {}, escudo(t.cor1, t.cor2, 48), el('b', {}, t.nome)), el('div', { class: 'vs' }, local, el('br'), 'VS'), el('div', {}, escudo(pj.adv.cor1, pj.adv.cor2, 48), el('b', {}, pj.adv.nome))));
  wrap.append(el('p', { style: 'text-align:center' }, `Adversário: força ~${pj.adv.ovr}, formação ${pj.adv.formacao}, ${TATICAS[pj.adv.tatica].nome}.`));
  wrap.append(el('div', { class: 'legenda-setor' }, el('span', { class: 'a' }, 'Nós'), el('span', { class: 'b' }, 'Eles')), barrasSetores(nos, eles));
  wrap.append(el('p', { style: 'text-align:center' }, `Chance estimada: vitória ${Math.round(v / 3)}% · empate ${Math.round(e / 3)}%${pj.tipo === 'copa' ? ' (pênaltis)' : ''} · derrota ${Math.round((300 - v - e) / 3)}%`));
  const cansados = esc.filter(x => x.j && x.j.energia < 45).map(x => x.j.nome);
  if (cansados.length) wrap.append(el('p', { style: 'color:#b0301a;text-align:center' }, `Cansados: ${cansados.join(', ')}. Energia baixa derruba o rendimento (recupera com o tempo).`));
  const mult = pj.tipo === 'copa' ? [1.5, 2, 3][pj.fase] : 1;
  wrap.append(el('p', { class: 'vazio' }, `Prêmio por vitória: ${fmt(Math.round(premioDiv(t.div) * mult))} tostões (+25% de bicho no seu bolso) e ${fmt(Math.round(xpDiv(t.div) * mult))} XP. Jogando, VOCÊ decide seus lances; simulando, ganha só metade do XP.`));
  wrap.append(el('div', { class: 'opcoes', style: 'justify-content:center' },
    el('button', { class: 'btn amarelo grande', disabled: faltam ? 'disabled' : null, onclick: () => jogarPartida(pj, nos, eles) }, faltam ? `Faltam ${faltam} titulares` : 'Apito inicial!'),
    el('button', { class: 'btn', disabled: faltam ? 'disabled' : null, onclick: () => simularPartida(pj, nos, eles) }, 'Simular resultado')));
  return wrap;
}
function temporadaAcabou() { const t = G.save.time; return !proximoJogo() && t.liga.rodada >= t.liga.rodadas.length; }
function botaoContinuar() {
  return temporadaAcabou() ? el('button', { class: 'btn amarelo', onclick: () => fimTemporada() }, 'Fim da temporada!') : el('button', { class: 'btn amarelo', onclick: () => abrirTime('jogar') }, 'Continuar');
}
function simularPartida(pj, nos, eles) {
  const t = G.save.time; const [gn, ge] = simRapida(nos, eles);
  const r = concluiJogo(pj, gn, ge, escalacaoAtual(), true, nos, eles);
  const fin = el('div', { class: 'fin' }); r.fin.forEach(([rot, v]) => fin.append(el('div', { class: 'fin-linha' }, el('span', {}, rot), el('b', { class: v >= 0 ? 'pos' : 'neg' }, (v >= 0 ? '+' : '') + fmt(v)))));
  abreModal.largo = true;
  abreModal(el('h2', {}, 'Resultado'), el('div', { class: 'placar-ao-vivo' }, el('span', {}, t.nome), el('b', {}, `${gn} × ${ge}`), el('span', {}, pj.adv.nome)),
    el('p', { style: 'text-align:center' }, r.txt), el('p', { style: 'text-align:center' }, `Seu bolso: +${fmt(r.bicho)} tostões · +${fmt(r.xp)} XP`), el('small', {}, 'Caixa do clube:'), fin,
    el('div', { class: 'opcoes', style: 'justify-content:center' }, botaoContinuar()));
}
function concluiJogo(pj, gn, ge, escN, rapido, nos, eles) {
  const s = G.save; const t = s.time; const L = t.liga; const d = t.div; const P = premioDiv(d), X = xpDiv(d);
  const tt = TATICAS[t.tatica]; const est = t.estr;
  escN.forEach(x => { if (!x.j) return; const gasto = rndi(16, 24) * tt.en * (1 - 0.05 * est.med); if (x.j.eu) t.energiaEu = Math.max(0, t.energiaEu - gasto); else { x.j.energia = Math.max(0, x.j.energia - gasto); ganhaXpJogador(x.j, Math.round(30 * (1 + 0.2 * est.ct))); } });
  t.jogos++;
  let venceu = gn > ge, empate = gn === ge, pen = null;
  if (pj.tipo === 'copa' && empate) { venceu = Math.random() < clamp(0.5 + (nos.gol - eles.gol) * 0.006, 0.25, 0.75); empate = false; pen = venceu ? [rndi(4, 5), rndi(2, 3)] : [rndi(2, 3), rndi(4, 5)]; }
  const mult = pj.tipo === 'copa' ? [1.5, 2, 3][pj.fase] : 1;
  const premio = Math.round(P * mult * (venceu ? 1 : empate ? 0.4 : 0.15));
  const xp = Math.round(X * mult * (venceu ? 1 : empate ? 0.4 : 0.15) * (rapido ? 0.5 : 1));
  const bicho = venceu ? Math.round(premio * 0.25) : 0;
  const fin = [['Prêmio da partida', premio]];
  if (pj.casa) fin.push(['Bilheteria', Math.round(P * 0.5 * (1 + 0.5 * est.estadio) * (1 + t.moral * 0.08))]);
  if (pj.tipo === 'liga') fin.push(['Patrocínio', Math.round(P * t.patro)], ['Salários', -folhaSalarial()]);
  const saldo = fin.reduce((a, [, v]) => a + v, 0); t.caixa += saldo; t.fin = fin;
  fin.forEach(([, v]) => { if (v >= 0) t.finTemp.ent += v; else t.finTemp.sai += v; });
  s.ouro += bicho; ganhaXp(xp);
  if (venceu) { t.vitorias++; t.moral = Math.min(3, t.moral + 1); } else if (!empate) t.moral = Math.max(-3, t.moral - 1);
  if (t.caixa < 0) { t.moral = Math.max(-3, t.moral - 1); log('O caixa do clube está NEGATIVO! Salários atrasados derrubam o moral. Invista no clube ou venda jogadores.', 'l-dano'); }
  const placar = `${t.nome} ${gn} × ${ge} ${pj.adv.nome}${pen ? ` (pênaltis ${pen[0]}×${pen[1]})` : ''}`;
  let txt = venceu ? 'VITÓRIA!' : empate ? 'Empate.' : 'Derrota...';
  if (pj.tipo === 'liga') {
    registraJogo(L, pj.jogo[0], pj.jogo[1], pj.casa ? gn : ge, pj.casa ? ge : gn);
    L.ultimos = [[pj.jogo[0], pj.jogo[1], pj.casa ? gn : ge, pj.casa ? ge : gn]];
    for (const [a, b] of L.rodadas[L.rodada]) { if (a === pj.jogo[0] && b === pj.jogo[1]) continue; const A = setores(timeIA(L.times[a]), L.times[a].tatica), B = setores(timeIA(L.times[b]), L.times[b].tatica); const [x, y] = simRapida(A, B); registraJogo(L, a, b, x, y); L.ultimos.push([a, b, x, y]); }
    L.rodada++;
    txt += ` Você está em ${minhaPosicao()}º na ${nomeDivisao(d)}.`;
  } else {
    const c = t.copa; c.res[pj.fase] = { gn, ge, pen, venceu };
    if (venceu) {
      c.fase++;
      if (c.fase >= 3) { c.status = 'campeao'; const bonus = P * 4; t.caixa += bonus; t.finTemp.ent += bonus; t.trofeus.push({ nome: c.nome, temp: t.temporada }); banner('CAMPEÃO DA COPA!', c.nome); som('nivel'); txt = `CAMPEÃO DA ${c.nome.toUpperCase()}! +${fmt(bonus)} no caixa.`; }
      else txt = `Classificado para a ${FASES_COPA[c.fase]} da ${c.nome}!`;
    } else { c.status = 'eliminado'; txt = `Eliminado da ${c.nome}.`; }
  }
  if (typeof carreiraEvento === 'function') carreiraEvento('partida', { vitoria: venceu });
  log(`${placar}. ${txt} +${fmt(bicho)} tostões, +${fmt(xp)} XP.`, venceu ? 'l-xp' : 'l-info');
  salvar();
  return { txt: `${placar}. ${txt}`, venceu, empate, pen, bicho, xp, fin, saldo };
}
function nomeLance(esc, pesos) {
  const lista = esc.filter(x => x.j); const tot = lista.reduce((a, x) => a + (pesos[x.slot] || 0.2), 0); let r = Math.random() * tot;
  for (const x of lista) { r -= pesos[x.slot] || 0.2; if (r <= 0) return x.j; } return lista[0].j;
}
function jogarPartida(pj, nos, eles) {
  const s = G.save; const t = s.time; const escN = escalacaoAtual(); const escE = timeIA(pj.adv);
  const minutos = Array.from({ length: 16 }, () => rndi(1, 90)).sort((a, b) => a - b);
  let i = 0, gn = 0, ge = 0, pausa = false, vel = 1200, timer = null, fim = false;
  const eu = escN.find(x => x.j && x.j.eu); const euJ = eu ? eu.j : null;
  let decisoes = 0;
  const narr = el('div', { class: 'narracao' });
  const placar = el('div', { class: 'placar-ao-vivo' });
  const cv = el('canvas', { width: 320, height: 150, class: 'campinho' }); const cx = cv.getContext('2d');
  const escolha = el('div', { class: 'escolha' });
  const ctl = el('div', { class: 'opcoes', style: 'justify-content:center' });
  let bola = { x: 160, y: 75, tx: 160, ty: 75 };
  const atualizaPlacar = (min) => { placar.innerHTML = ''; placar.append(el('span', {}, t.nome), el('b', {}, `${gn} × ${ge}`), el('span', {}, pj.adv.nome), el('small', {}, min != null ? `${min}'` : '')); };
  const diz = (txt, cls = '') => { narr.prepend(el('div', { class: cls }, txt)); };
  function desenhaCampo() {
    cx.fillStyle = '#3fa34a'; cx.fillRect(0, 0, 320, 150); for (let x = 0; x < 320; x += 32) { cx.fillStyle = (x / 32) % 2 ? '#48b052' : '#3fa34a'; cx.fillRect(x, 0, 32, 150); }
    cx.strokeStyle = '#f4f4f4'; cx.lineWidth = 2; cx.strokeRect(6, 6, 308, 138); cx.beginPath(); cx.moveTo(160, 6); cx.lineTo(160, 144); cx.stroke(); cx.beginPath(); cx.arc(160, 75, 20, 0, 7); cx.stroke();
    cx.strokeRect(6, 40, 40, 70); cx.strokeRect(274, 40, 40, 70);
    bola.x += (bola.tx - bola.x) * 0.08; bola.y += (bola.ty - bola.y) * 0.08;
    const dots = (esc, c1, c2, lado) => esc.forEach((x, k) => { const col = { GOL: 0.05, ZAG: 0.2, LAT: 0.28, VOL: 0.38, MEI: 0.5, ATA: 0.66 }[x.slot]; const px = lado ? 320 - col * 300 - 10 : col * 300 + 10; const py = 20 + ((k * 37) % 110) + Math.sin(performance.now() / 600 + k) * 3; cx.fillStyle = '#140c24'; cx.fillRect(px - 4, py - 4, 8, 8); cx.fillStyle = x.slot === 'GOL' ? '#2ad96a' : c1; cx.fillRect(px - 3, py - 3, 6, 6); if (x.j && x.j.eu) { cx.fillStyle = '#ffe14a'; cx.fillRect(px - 1, py - 8, 2, 3); } });
    dots(escN, t.cor1, t.cor2, false); dots(escE, pj.adv.cor1, pj.adv.cor2, true);
    cx.fillStyle = '#140c24'; cx.fillRect(bola.x - 3, bola.y - 3, 6, 6); cx.fillStyle = '#fff'; cx.fillRect(bola.x - 2, bola.y - 2, 4, 4);
    if (!fim) raf = requestAnimationFrame(desenhaCampo);
  }
  let raf = requestAnimationFrame(desenhaCampo);
  const ATQ_P = { ATA: 3, MEI: 2, LAT: 1, VOL: 0.5, ZAG: 0.2, GOL: 0 };
  function proximo() {
    if (pausa || fim) return;
    if (i >= minutos.length) return terminar();
    const min = minutos[i++]; atualizaPlacar(min);
    if (i === 9) diz("45' Fim do primeiro tempo.", 'n-sis');
    const r = lance(nos, eles);
    const X = r.atacaA ? escN : escE, Y = r.atacaA ? escE : escN; const nomeT = r.atacaA ? t.nome : pj.adv.nome;
    const atac = nomeLance(X, ATQ_P); const zag = nomeLance(Y, { ZAG: 3, VOL: 2, LAT: 1 }); const gk = Y.find(x => x.slot === 'GOL'); const gkN = gk && gk.j ? gk.j.nome : 'O goleiro';
    bola.tx = r.atacaA ? rndi(200, 300) : rndi(20, 120); bola.ty = rndi(25, 125);
    // lance decisivo SEU
    if (r.atacaA && euJ && r.tipo !== 'desarme' && decisoes < 3 && (atac.eu || Math.random() < 0.28)) { decisoes++; return decisao(min); }
    if (r.tipo === 'desarme') diz(`${min}' ${atac.nome} tenta passar, mas ${zag.nome} desarma.`);
    else if (r.tipo === 'fora') diz(`${min}' ${atac.nome} (${nomeT}) finaliza... pra fora!`);
    else if (r.tipo === 'defesa') diz(`${min}' ${atac.nome} chuta forte e ${gkN} faz uma defesaça!`, 'n-def');
    else { if (r.atacaA) gn++; else ge++; bola.tx = r.atacaA ? 312 : 8; bola.ty = 75; diz(`${min}' GOOOOL do ${nomeT}! ${atac.nome} manda pra rede!`, r.atacaA ? 'n-gol' : 'n-golc'); som(r.atacaA ? 'gol' : 'ai'); }
    atualizaPlacar(min);
    timer = setTimeout(proximo, vel);
  }
  function decisao(min) {
    pausa = true; const defMed = eles.def / 4.3; const gol = eles.gol;
    bola.tx = 250; bola.ty = 75;
    diz(`${min}' A bola chega em VOCÊ, ${s.nome}, perto da área!`, 'n-eu');
    const pChute = clamp(0.25 + (euJ.chu - gol) * 0.012, 0.05, 0.8);
    const pDrible = clamp(0.5 + (euJ.drb - defMed) * 0.015, 0.1, 0.9);
    const pPasse = clamp(0.6 + (euJ.pas - defMed) * 0.012, 0.2, 0.92);
    const res = (ok, txt) => { escolha.innerHTML = ''; pausa = false; diz(`${min}' ${txt}`, ok === 'gol' ? 'n-gol' : ''); if (ok === 'gol') { gn++; bola.tx = 312; som('gol'); } atualizaPlacar(min); timer = setTimeout(proximo, vel); };
    const b = (rot, p, fn) => el('button', { class: 'btn amarelo', onclick: fn }, `${rot} (${Math.round(p * 100)}%)`);
    escolha.innerHTML = '';
    escolha.append(el('p', {}, 'O que você faz?'), el('div', { class: 'opcoes', style: 'justify-content:center' },
      b('Chutar', pChute, () => { treinaSkill('chute', 3); Math.random() < pChute ? res('gol', `GOLAÇO DE ${s.nome.toUpperCase()}! Que chute!`) : res(0, `${s.nome} chuta e ${escE[0].j.nome} defende!`); }),
      b('Driblar', pDrible, () => { treinaSkill('drible', 3); if (Math.random() < pDrible) { const p2 = clamp(0.45 + (euJ.chu - gol) * 0.01, 0.15, 0.85); Math.random() < p2 ? res('gol', `${s.nome} dá um drible desconcertante e marca! GOOOL!`) : res(0, `${s.nome} passa pelo zagueiro, mas o goleiro salva!`); } else res(0, `${s.nome} tenta o drible e perde a bola.`); }),
      b('Tocar', pPasse, () => { treinaSkill('visao', 20); if (Math.random() < pPasse) { const comp = nomeLance(escN.filter(x => x.j && !x.j.eu), ATQ_P); Math.random() < 0.42 ? res('gol', `${s.nome} dá um passe açucarado e ${comp.nome} marca! GOOOL!`) : res(0, `${s.nome} toca para ${comp.nome}, que chuta por cima.`); } else res(0, `O passe de ${s.nome} é interceptado.`); })));
  }
  function terminar() {
    fim = true; clearTimeout(timer); escolha.innerHTML = '';
    const r = concluiJogo(pj, gn, ge, escN, false, nos, eles);
    diz(`Fim de jogo! ${r.txt}`, 'n-sis');
    som(r.venceu ? 'nivel' : 'apito');
    ctl.innerHTML = ''; ctl.append(botaoContinuar());
  }
  ctl.append(el('button', { class: 'btn', onclick: () => { vel = vel === 1200 ? 450 : 1200; } }, 'Velocidade'), el('button', { class: 'btn', onclick: () => { vel = 30; } }, 'Pular'));
  window.pararPartida = () => { if (!fim) { clearTimeout(timer); fim = true; } cancelAnimationFrame(raf); window.pararPartida = null; };
  abreModal.largo = true;
  abreModal(el('h2', {}, pj.tipo === 'copa' ? `${t.copa.nome} — ${FASES_COPA[pj.fase]}` : 'Partida'), placar, cv, escolha, ctl, narr);
  $('#modal .fechar').hidden = true;
  atualizaPlacar(0); diz("0' Rola a bola!", 'n-sis'); som('apito');
  timer = setTimeout(proximo, 900);
  // o botão de fechar só volta no fim
  const vigia = setInterval(() => { if (fim) { $('#modal .fechar').hidden = false; clearInterval(vigia); } }, 300);
}

/* ---------------- fim de temporada ---------------- */
function fimTemporada() {
  const s = G.save; const t = s.time; const L = t.liga; const d = DIVS[t.div]; const p = PAIS[t.pais]; const P = premioDiv(t.div);
  const tab = tabelaOrdenada(L); const pos = tab.findIndex(x => x.id === 'eu') + 1; const n = tab.length;
  const linhas = []; let msg = `Temporada ${t.temporada} (${nomeDivisaoPais(t.div)}): ${pos}º lugar.`;
  // título
  if (pos === 1) {
    t.titulos++; const premio = P * 6; t.caixa += premio; t.finTemp.ent += premio; s.ouro += Math.round(premio * 0.2); ganhaXp(xpDiv(t.div) * 5);
    t.trofeus.push({ nome: d.nome, temp: t.temporada }); s.flags['campeao_div' + t.div] = true;
    msg += ' CAMPEÃO!'; linhas.push(`🏆 CAMPEÃO da ${d.nome}! +${fmt(premio)} no caixa e ${fmt(Math.round(premio * 0.2))} no seu bolso.`);
    banner('CAMPEÃO!', d.nome); som('nivel');
    if (d.topo) {
      const novo = !t.campeoes[t.pais]; t.campeoes[t.pais] = true; s.flags['campeao_pais_' + t.pais] = true;
      if (t.pais === 'mundo') { addItem('medalha_ouro'); linhas.push('🌍 CAMPEÃO DO MUNDO! Você ganhou uma Medalha de Ouro.'); }
      else if (novo) { const i = PAISES.findIndex(x => x.id === t.pais); const prox = PAISES[i + 1]; if (prox) linhas.push(`✉️ CONVITE: o clube pode disputar a liga de ${prox.nome} (nível ${prox.lvl}). Veja em Clube → Ligas pelo mundo.`); }
    }
  }
  // premiação por colocação na liga
  const colocacao = Math.round(P * (n - pos + 1) * 0.5); t.caixa += colocacao; t.finTemp.ent += colocacao;
  linhas.push(`💰 Premiação pela ${pos}ª colocação: +${fmt(colocacao)} no caixa.`);
  // meta do patrocinador
  const meta = METAS[t.meta];
  if (meta.ok(pos)) { const bonus = P * 3; t.patro = Math.min(2, +(t.patro * 1.15).toFixed(2)); t.caixa += bonus; t.finTemp.ent += bonus; linhas.push(`🎯 Meta cumprida (${meta.txt})! Patrocínio renovado com aumento (×${t.patro.toFixed(2)}) e bônus de ${fmt(bonus)}.`); }
  else { t.patro = Math.max(0.7, +(t.patro * 0.92).toFixed(2)); linhas.push(`🎯 Meta não cumprida (${meta.txt}). O patrocinador cortou o contrato para ×${t.patro.toFixed(2)}.`); }
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
  if (minhaK > k) { msg += ` SUBIU para a ${p.divs[minhaK][0]}!`; linhas.push(`▲ ACESSO! Na próxima temporada o ${t.nome} joga a ${p.divs[minhaK][0]}.`); }
  else if (minhaK < k) { msg += ` Caiu para a ${p.divs[minhaK][0]}.`; linhas.push(`▼ Rebaixado para a ${p.divs[minhaK][0]}. Reforce o time e volte mais forte!`); }
  else linhas.push(`Continua na ${d.nome}.`);
  t.div = divDe(t.pais, minhaK);
  // envelhecimento e aposentadorias
  const aposentados = [];
  t.elenco = t.elenco.filter(j => {
    j.idade = (j.idade || 28) + 1;
    if (j.idade >= 32) { j.fis = Math.max(5, j.fis - rndi(1, 3)); const a = ['atq', 'def', 'pas'][rndi(0, 2)]; j[a] = Math.max(5, j[a] - 1); }
    if (j.idade >= 36 && !j.lenda) { aposentados.push(j.nome); return false; }
    return true;
  });
  if (aposentados.length) { linhas.push(`👴 Se aposentaram: ${aposentados.join(', ')}.`); t.titulares = t.titulares.map(id => id === 'eu' || t.elenco.some(j => j.id === id) ? id : null); }
  // categoria de base
  const nb = 1 + Math.ceil(t.estr.base / 2); const posB = ['GOL', 'ZAG', 'LAT', 'VOL', 'MEI', 'ATA'];
  for (let i = 0; i < nb; i++) { const j = geraJogador(posB[rndi(0, 5)], DIVS[t.div].base - 8); j.idade = rndi(16, 18); j.pot = clamp(DIVS[t.div].base - 8 + rndi(12, 22) + t.estr.base * 2, 20, 99); t.base.push(j); }
  t.base = t.base.slice(-8);
  linhas.push(`🌱 ${nb} jovem(ns) da base apareceram (aba Clube).`);
  // nova temporada
  t.historico.push(msg); log(msg, 'l-lvl');
  t.temporada++; t.liga = gerarLiga(t.div); t.copa = novaCopa(); t.mercado = []; t.finTemp = { ent: 0, sai: 0 }; t.sacado = 0;
  autoEscalar(); t.meta = defineMeta();
  linhas.push(`Nova meta do patrocinador: ${METAS[t.meta].txt}.`);
  salvar();
  abreModal.largo = true;
  abreModal(el('h2', {}, `Fim da temporada ${t.temporada - 1}`), el('p', {}, el('b', {}, msg)), ...linhas.map(x => el('p', {}, x)),
    el('div', { class: 'opcoes', style: 'justify-content:center' }, el('button', { class: 'btn amarelo', onclick: () => abrirTime('liga') }, `Começar a temporada ${t.temporada}`)));
}
function modalFundar() {
  const s = G.save; let c1 = '#f8d838', c2 = '#2a8a3a';
  const inp = el('input', { maxlength: 24, placeholder: 'Ex.: Esporte Clube Campinho', value: `${s.nome} FC` });
  const prev = el('div', { class: 'prev-escudo' });
  const render = () => { prev.innerHTML = ''; prev.append(escudo(c1, c2, 64)); };
  const paleta = (qual) => el('div', { class: 'chips' }, ...CORES_TIME.map(c => { const b = el('button', { class: 'chip', type: 'button' }); const i = el('i'); i.style.background = c; b.append(i); b.onclick = () => { if (qual === 1) c1 = c; else c2 = c; render(); }; return b; }));
  render();
  abreModal(el('h2', {}, 'Fundar meu time'), el('p', {}, 'Você é adulto(a) e já tem nome no futebol. Hora de montar seu próprio clube! Você será o craque do time e vai começar na Várzea, com amigos da vila. Contrate reforços, cuide do caixa e da estrutura, suba de divisão até a Série A — e depois leve o clube para as ligas do Egito, Japão, Europa... até o Mundial de Clubes.'),
    el('div', { class: 'npc-topo' }, prev, el('div', { style: 'flex:1' }, el('label', {}, 'Nome do time', inp), el('p', {}, 'Cor principal'), paleta(1), el('p', {}, 'Cor secundária'), paleta(2))),
    el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo grande', onclick: () => { const n = inp.value.trim().replace(/[<>]/g, ''); if (n.length < 3) return; if (s.ouro < 500) { log('Fundar o time custa 500 tostões.', 'l-dano'); return; } s.ouro -= 500; fundarTime(n, c1, c2); abrirTime('elenco'); } }, 'Fundar (500 tostões)')));
}
