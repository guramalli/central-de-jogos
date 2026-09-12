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
// SOBRE AS LETRAS MAGRAS: gênero musical é um conjunto finito e bem menor
// que "cidade" ou "nome". Algumas letras têm de fato pouquíssimos gêneros
// reais, e a lista reflete isso em vez de inventar nomes pra encher — um
// gênero falso no glossário validaria resposta errada pra sempre. Se K, W
// e Y se mostrarem frustrantes na prática, a saída é reduzir o peso dessas
// letras no sorteio, não fabricar entradas.
export const ESTILOS_MUSICAIS_WORDS = {
  A: [
    "Axé", "Arrocha", "Ambient", "Afrobeat", "Acid Jazz",
    "Arrocha Funk", "Alternativo", "Art Rock", "Afoxé",
  ],
  B: [
    "Bossa Nova", "Blues", "Brega", "Baião", "Bolero",
    "Bluegrass", "Britpop", "Brega Funk", "Bachata", "Baile Funk",
    "Black Music", "Bumba Meu Boi",
  ],
  C: [
    "Country", "Choro", "Cumbia", "Clássica", "Charme",
    "Calypso", "Ciranda", "Capoeira", "Carimbó", "Cúmbia",
    "Chorinho", "Coco",
  ],
  D: [
    "Dance", "Disco", "Drum and Bass", "Dubstep", "Deep House",
    "Death Metal", "Dub", "Doom Metal", "Dancehall", "Drill",
  ],
  E: [
    "Eletrônica", "Emo", "Eurodance", "Experimental", "Electro Swing",
    "Eletro Funk", "Enka", "Electropop",
  ],
  F: [
    "Funk", "Forró", "Fado", "Folk", "Frevo",
    "Funk Carioca", "Flamenco", "Funk Melody", "Free Jazz", "Funk Soul",
  ],
  G: [
    "Gospel", "Grunge", "Garage", "Glam Rock", "Groove",
    "Gótico", "Grime", "Gregoriano", "Guarânia",
  ],
  H: [
    "Hip Hop", "House", "Hard Rock", "Heavy Metal", "Hardcore",
    "Hardstyle", "Hyperpop", "Hinos", "Highlife",
  ],
  I: [
    "Indie", "Industrial", "Instrumental", "Indie Rock", "Italo Disco",
    "Indie Pop", "Iê-iê-iê",
  ],
  J: [
    "Jazz", "Jungle", "Jovem Guarda", "J-Pop", "J-Rock",
    "Jazz Fusion", "Jongo",
  ],
  L: [
    "Lambada", "Lo-fi", "Latin Pop", "Lounge", "Liturgia",
    "Lambadão", "Louvor",
  ],
  M: [
    "MPB", "Metal", "Música Popular Brasileira", "Maracatu", "Merengue",
    "Mambo", "Marchinha", "Música Clássica", "Modão", "Math Rock",
    "Melodic Death Metal", "Moda de Viola",
  ],
  N: [
    "New Wave", "Nu Metal", "Neo Soul", "Noise", "Northern Soul",
    "New Age", "Nortenha",
  ],
  O: [
    "Ópera", "Old School", "Opereta", "Orquestral", "Oi",
  ],
  P: [
    "Pop", "Pagode", "Punk", "Piseiro", "Progressivo",
    "Pop Rock", "Post Punk", "Psicodélico", "Power Metal", "Punk Rock",
    "Polca", "Pagode Baiano",
  ],
  Q: [
    "Quadrilha", "Quartetto", "Qawwali",
  ],
  R: [
    "Rock", "Rap", "Reggae", "R&B", "Reggaeton",
    "Rockabilly", "Rock Progressivo", "Rumba", "Repente", "Rap Nacional",
    "Rhythm and Blues", "Roots Reggae",
  ],
  S: [
    "Samba", "Sertanejo", "Soul", "Ska", "Salsa",
    "Swing", "Synthpop", "Samba Enredo", "Sertanejo Universitário",
    "Sofrência", "Shoegaze", "Soft Rock", "Samba Rock",
  ],
  T: [
    "Trap", "Tecno", "Tango", "Trance", "Techno",
    "Trap Nacional", "Tropicália", "Thrash Metal", "Tecnobrega", "Twist",
  ],
  U: [
    "UK Garage", "Underground", "Urbano", "Uptempo",
  ],
  V: [
    "Valsa", "Vaporwave", "Vanguarda", "Vaneira", "Vocal Jazz",
  ],
  X: [
    "Xote", "Xaxado", "Xamânica",
  ],
  Z: [
    "Zouk", "Zamba", "Zydeco", "Zeuhl",
  ],
};
