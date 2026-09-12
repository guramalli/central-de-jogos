// Tema "Estilos Musicais" do Stop.
//
// ESCOPO: GÊNEROS e ritmos musicais apenas.
//
// FICAM DE FORA, e essa fronteira decide a rodada:
//   - artistas e bandas (Beatles, Anitta, Pixies)
//   - instrumentos (violão, bateria)
//   - músicas e álbuns
// "Rock" é gênero; "Rolling Stones" é banda.
//
// CRITÉRIO DE INCLUSÃO — por que a lista é generosa:
// A validação em sala normal é correspondência EXATA, então entram as
// variações que o brasileiro digita: "MPB" e "Música Popular Brasileira",
// "Funk" e "Funk Carioca", "Sertanejo" e "Sertanejo Universitário". Cada
// forma não listada seria um ponto perdido à toa.
//
// A normalização tira acento e caixa, então "Forró" cobre "forro" e
// "Reggaeton" cobre "reggaeton".
//
// AMPLIADO com a curadoria do Gustavinho (setembro/2026). Lista de boa
// qualidade — gênero musical de verdade, sem contaminação.
//
// O HÍFEN não precisa ser duplicado: a normalização do jogo ignora hífen e
// espaço, então "Acid House", "Acid-House" e "AcidHouse" valem com uma linha
// só. Isso importa muito aqui, porque quase todo gênero é composto.
//
// SOBRE AS LETRAS MAGRAS: gênero musical é um conjunto finito e bem menor
// que "cidade" ou "nome". Com a segunda lista (Q a Z), até as piores letras
// ficaram razoáveis — Q, U, X e Z saíram de 3 ou 4 palavras pra algo
// jogável. K, W e Y continuam fora por não serem sorteadas no Stop, o que
// descartou blocos inteiros da lista original (K-Pop, Witch House, Yacht
// Rock).
export const ESTILOS_MUSICAIS_WORDS = {
  A: [
    "Acid-House", "Acid Jazz", "Acid-Rock", "Afoxé",
    "Afrobeat", "Afrobeats", "Afro-Cuban-Jazz", "Afro-House",
    "Afro-Pop", "Afro-Soul", "Alternative-Country", "Alternative-Dance",
    "Alternative-Metal", "Alternative-Rock", "Alternativo", "Amapiano",
    "Ambient", "Ambient-House", "Ambient-Pop", "Americana",
    "Anarcho-Punk", "Arrocha", "Arrocha Funk", "Art-Pop",
    "Art Rock", "Avant-Garde", "Avant-Garde-Jazz", "Axé",
  ],
  B: [
    "Bachata", "Baião", "Baile Funk", "Balearic-Beat",
    "Baltimore-Club", "Baroque-Pop", "Bass-House", "Bassline",
    "Bebop", "Big-Band", "Big-Beat", "Black-Metal",
    "Black Music", "Bluegrass", "Blues", "Blues-Rock",
    "Bolero", "Boogie", "Boogie-Woogie", "Bossa Nova",
    "Brazilian-Funk", "Breakbeat", "Breakcore", "Breaks",
    "Brega", "Brega Funk", "Brega-Pop", "British-Blues",
    "Britpop", "Bubblegum-Pop", "Bumba Meu Boi",
  ],
  C: [
    "Cajun", "Calypso", "Canterbury-Scene", "Capoeira",
    "Carimbó", "Celtic-Rock", "Chamber-Pop", "Charme",
    "Chicago-Blues", "Chicago-House", "Chillout", "Chillwave",
    "Chiptune", "Chorinho", "Choro", "Christian-Rock",
    "Ciranda", "City-Pop", "Clássica", "Cloud-Rap",
    "Club-Music", "Coco", "Coldwave", "Country",
    "Country-Blues", "Country-Pop", "Country-Rap", "Country-Rock",
    "Crossover-Thrash", "Crunk", "Cumbia", "Cumbia-Pop",
    "Cumbia-Villera", "Cyber-Metal",
  ],
  D: [
    "Dance", "Dancehall", "Dance-Pop", "Dark-Ambient",
    "Dark-Electro", "Dark-Jazz", "Darkwave", "Deathcore",
    "Death Metal", "Deep House", "Delta-Blues", "Detroit-Techno",
    "Digital-Hardcore", "Disco", "Disco-House", "Doom Metal",
    "Downtempo", "Dream-Pop", "Dream-Trance", "Drill",
    "Drum and Bass", "Drumstep", "Dub", "Dubstep",
    "Dub-Techno", "Dungeon-Synth", "Dutch-House",
  ],
  E: [
    "EDM", "Electro", "Electroclash", "Electro-House",
    "Electronic", "Electronicore", "Electropop", "Electro Swing",
    "Eletro Funk", "Eletrônica", "Emo", "Emo-Pop",
    "Emo-Rap", "Enka", "Eurobeat", "Eurodance",
    "Europop", "Experimental", "Experimental-Pop", "Experimental-Rock",
    "Extreme-Metal",
  ],
  F: [
    "Fado", "Flamenco", "Folk", "Folk-Metal",
    "Folk-Pop", "Folk-Punk", "Folk-Rock", "Footwork",
    "Forró", "Free-Improvisation", "Free Jazz", "French-House",
    "Frevo", "Funk", "Funk Carioca", "Funk Melody",
    "Funk-Metal", "Funk-Rock", "Funk Soul", "Future-Bass",
    "Future-Funk", "Future-Garage", "Future-House", "Future-Pop",
  ],
  G: [
    "Gabber", "Gangsta-Rap", "Garage", "Garage-House",
    "Garage-Punk", "Garage-Rock", "G-Funk", "Glam-Metal",
    "Glam Rock", "Glitch", "Glitch-Hop", "Goregrind",
    "Gospel", "Gothic-Metal", "Gothic-Rock", "Gótico",
    "Gqom", "Gregoriano", "Grime", "Grindcore",
    "Groove", "Groove-Metal", "Grunge", "Guarânia",
  ],
  H: [
    "Hard-Bop", "Hardcore", "Hardcore-Punk", "Hard-House",
    "Hard Rock", "Hardstyle", "Hard-Techno", "Hard-Trance",
    "Heavy Metal", "Highlife", "Hinos", "Hi-NRG",
    "Hip Hop", "Hiphop-Soul", "Honky-Tonk", "Horrorcore",
    "House", "House-Music", "Hyperpop",
  ],
  I: [
    "IDM", "Iê-iê-iê", "Indie", "Indie-Country",
    "Indie-Folk", "Indie Pop", "Indie Rock", "Indietronica",
    "Industrial", "Industrial-Metal", "Industrial-Rock", "Industrial-Techno",
    "Instrumental", "Instrumental-Rock", "Irish-Folk", "Italo-Dance",
    "Italo Disco", "Italo-House",
  ],
  J: [
    "Jangle-Pop", "Jazz", "Jazz-Funk", "Jazz Fusion",
    "Jazz-Rap", "Jazz-Rock", "Jazztronica", "Jersey-Club",
    "Jongo", "Jovem Guarda", "J-Pop", "J-Rock",
    "Juke", "Jump-Blues", "Jumpstyle", "Jungle",
  ],
  L: [
    "Lambada", "Lambadão", "Latin-House", "Latin-Jazz",
    "Latin Pop", "Latin-Rock", "Latin-Techno", "Latin-Trap",
    "Liquid-Drum-and-Bass", "Liquid-Funk", "Liturgia", "Lo-fi",
    "Lo-fi-Hip-Hop", "Lo-fi-House", "Lounge", "Lounge-Music",
    "Louvor", "Lovers-Rock",
  ],
  M: [
    "Mambo", "Mandopop", "Maracatu", "Marchinha",
    "Mathcore", "Math Rock", "Melodic Death Metal", "Melodic-Hardcore",
    "Merengue", "Metal", "Metalcore", "Miami-Bass",
    "Minimal-House", "Minimal-Techno", "Moda de Viola", "Modão",
    "Morna", "Motown", "Motown-Soul", "MPB",
    "Música Clássica", "Música-Eletrônica", "Música-Experimental", "Música-Instrumental",
    "Musical", "Música Popular Brasileira", "Música-Sertaneja", "Musique-Concrète",
  ],
  N: [
    "Nashville-Sound", "Neoclassical-Metal", "Neofolk", "Neo-Psychedelia",
    "Neo-Punk", "Neo-R&B", "Neo Soul", "Neue-Deutsche-Welle",
    "New Age", "New-Jack-Swing", "New Wave", "Noise",
    "Noise-Rock", "Nortenha", "Northern Soul", "Nu-Disco",
    "Nu-Jazz", "Nu Metal", "Nu-Skool-Breaks",
  ],
  O: [
    "Oi", "Old School", "Old-School-Hip-Hop", "Old-School-Rap",
    "Ópera", "Opera-Rock", "Opereta", "Orchestral-Pop",
    "Orchestral-Rock", "Organic-House", "Orquestral", "Outlaw-Country",
  ],
  P: [
    "Pagode", "Pagode Baiano", "Pagode-Romântico", "Piano-House",
    "Piseiro", "Polca", "Pop", "Pop-Metal",
    "Pop-Punk", "Pop-Rap", "Pop Rock", "Post-Grunge",
    "Post-Hardcore", "Post-Metal", "Post Punk", "Post-Rock",
    "Power Metal", "Power-Pop", "Progressive-House", "Progressive-Metal",
    "Progressive-Rock", "Progressivo", "Psicodélico", "Psybient",
    "Psychedelic-Pop", "Psychedelic-Rock", "Psytrance", "Punk",
    "Punk-Hardcore", "Punk-Pop", "Punk Rock",
  ],
  Q: [
    "Qawwali", "Quadrilha", "Quartetto", "Queercore",
    "Quiet-Storm",
  ],
  R: [
    "R&B", "Ragtime", "Rap", "Rap-Metal",
    "Rap Nacional", "Rap-Rock", "Rave", "Reggae",
    "Reggae-Fusion", "Reggae-Rock", "Reggae-Roots", "Reggaeton",
    "Reggaeton-Pop", "Repente", "Rhythm and Blues", "Riot-Grrrl",
    "RnB", "Rock", "Rockabilly", "Rock-Alternativo",
    "Rock-and-Roll", "Rock Progressivo", "Rock-Psicodélico", "Romantic",
    "Roots Reggae", "Roots-Rock", "Rumba", "Rumba-Catalana",
    "Rumba-Flamenca",
  ],
  S: [
    "Salsa", "Samba", "Samba-de-Roda", "Samba Enredo",
    "Samba-Reggae", "Samba Rock", "Sertanejo", "Sertanejo-Raiz",
    "Sertanejo Universitário", "Shoegaze", "Ska", "Ska-Punk",
    "Slam-Metal", "Smooth-Jazz", "Soca", "Sofrência",
    "Soft Rock", "Soul", "Soul-Jazz", "Soul-Pop",
    "Southern-Rock", "Speedcore", "Speed-Metal", "Stoner-Metal",
    "Stoner-Rock", "Swing", "Swing-Jazz", "Swing-Revival",
    "Symphonic-Metal", "Symphonic-Rock", "Synthpop", "Synthwave",
  ],
  T: [
    "Tango", "Tango-Nuevo", "Tech-House", "Technical-Death-Metal",
    "Techno", "Techno-Pop", "Tech-Trance", "Tecno",
    "Tecnobrega", "Teen-Pop", "Thrash Metal", "Trance",
    "Trancecore", "Trap", "Trap-Funk", "Trap-Metal",
    "Trap Nacional", "Trap-Soul", "Trip-Hop", "Tropical-House",
    "Tropicália", "Tropical-Pop", "Turntablism", "Twee-Pop",
    "Twist",
  ],
  U: [
    "UK-Drill", "UK-Funky", "UK Garage", "UK-Hardcore",
    "UK-House", "Unblack-Metal", "Underground", "Underground-Hip-Hop",
    "Underground-Rap", "Uptempo", "Urbano", "Urban-Pop",
  ],
  V: [
    "Vallenato", "Valsa", "Vaneira", "Vanguarda",
    "Vaportrap", "Vaporwave", "Vaudeville", "Viking-Metal",
    "Visual-Kei", "Vocal-House", "Vocal Jazz", "Vocal-Trance",
  ],
  X: [
    "Xamânica", "Xaxado", "Xhosa-Music", "Xote",
    "Xote-Gaúcho", "Xote-Nordestino",
  ],
  Z: [
    "Zamba", "Zarzuela", "Zeuhl", "Zombiecore",
    "Zouk", "Zouk-Bass", "Zouk-Love", "Zydeco",
  ],
};
