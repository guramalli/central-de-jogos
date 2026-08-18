// Tema "Esportes" do Stop.
//
// ESCOPO: modalidades esportivas — o esporte em si, não atletas nem times
// (times já têm o tema `times_futebol`). Inclui olímpicos, radicais, artes
// marciais e os populares no Brasil.
//
// CRITÉRIO DE INCLUSÃO — por que a lista é generosa:
// A validação em sala normal é correspondência EXATA no glossário. Se alguém
// escreve um esporte real que não está aqui, perde o ponto e sente injustiça.
// Por isso entram as variações que o brasileiro realmente digita: "Vôlei" e
// "Voleibol", "Tênis de mesa" e "Pingue-pongue", "Caratê" e "Karatê".
//
// A normalização tira acento e caixa, então "Judô" já cobre "judo" e "JUDO".
//
// SEM A LETRA Z: não existe modalidade conhecida começando com Z em
// português. Isso é normal no sistema — a maioria dos temas pula letras
// difíceis (raça de cachorro cobre 14 das 23, ossos do corpo também), e o
// sorteio já dá a Q, X e Z cerca de um quinto da chance das outras letras.
export const ESPORTES_WORDS = {
  A: [
    "Atletismo", "Automobilismo", "Alpinismo", "Arco e flecha", "Asa delta",
    "Aeromodelismo", "Airsoft", "Arremesso de peso", "Arremesso de disco",
    "Acrobacia", "Aikido", "Asa-delta",
  ],
  B: [
    "Basquete", "Basquetebol", "Boxe", "Beisebol", "Badminton", "Bocha",
    "Bilhar", "Boliche", "Bodyboard", "Biatlo", "Balonismo", "Bungee jump",
    "Beach tennis", "Body board",
  ],
  C: [
    "Ciclismo", "Corrida", "Canoagem", "Capoeira", "Caratê", "Críquete", "Cricket",
    "Curling", "Crossfit", "Caminhada", "Ciclismo de estrada", "Cross country",
    "Caiaque", "Corrida de rua", "Canoagem slalom",
  ],
  D: [
    "Dardo", "Decatlo", "Downhill", "Dança esportiva", "Duatlo",
    "Drift", "Dança de salão",
  ],
  E: [
    "Esgrima", "Escalada", "Equitação", "Esqui", "Enduro", "Esqui aquático",
    "Esportes radicais", "Escalada esportiva", "E-sports", "Esports",
  ],
  F: [
    "Futebol", "Futsal", "Fórmula 1", "Frescobol", "Futevôlei",
    "Fisiculturismo", "Futebol americano", "Futebol de areia", "Flag football",
  ],
  G: [
    "Ginástica", "Golfe", "Ginástica rítmica", "Ginástica artística",
    "Goalball", "Grappling", "Ginástica de trampolim",
  ],
  H: [
    "Handebol", "Halterofilismo", "Hipismo", "Hóquei", "Hidroginástica",
    "Hóquei no gelo", "Hóquei sobre grama",
  ],
  I: [
    "Iatismo", "Ioga", "Iron man", "Iatismo a vela",
  ],
  J: [
    "Judô", "Jiu-jitsu", "Jogging", "Jóquei", "Jet ski",
  ],
  L: [
    "Luta livre", "Levantamento de peso", "Lacrosse", "Luta greco-romana",
    "Luta olímpica", "Lançamento de dardo", "Lançamento de martelo",
  ],
  M: [
    "Maratona", "Motocross", "Muay thai", "Mergulho", "MMA", "Montanhismo",
    "Musculação", "Motociclismo", "Maratona aquática", "Motovelocidade",
  ],
  N: [
    "Natação", "Nado sincronizado", "Netball", "Natação artística",
  ],
  O: [
    "Orientação", "Off-road", "Obstáculos",
  ],
  P: [
    "Polo", "Paraquedismo", "Patinação", "Pentatlo", "Pesca esportiva",
    "Parkour", "Pingue-pongue", "Peteca", "Patinação artística", "Powerlifting",
    "Polo aquático", "Paraciclismo", "Punhobol",
  ],
  Q: [
    "Queda de braço",
  ],
  R: [
    "Rugby", "Remo", "Rafting", "Rali", "Rapel", "Rugby sevens", "Roller derby",
  ],
  S: [
    "Surfe", "Skate", "Snowboard", "Sumô", "Slackline", "Salto em altura",
    "Salto em distância", "Squash", "Sinuca", "Salto com vara", "Skeleton",
    "Softbol", "Salto ornamental", "Stand up paddle",
  ],
  T: [
    "Tênis", "Taekwondo", "Triatlo", "Tiro ao alvo", "Tênis de mesa",
    "Trekking", "Tiro com arco", "Tiro esportivo", "Trampolim", "Tiro prático",
  ],
  U: [
    "Ultramaratona", "Ultimate frisbee",
  ],
  V: [
    "Vôlei", "Voleibol", "Vôlei de praia", "Vela", "Velocross", "Vaquejada",
    "Vôlei sentado",
  ],
  X: [
    "Xadrez",
  ],
};
