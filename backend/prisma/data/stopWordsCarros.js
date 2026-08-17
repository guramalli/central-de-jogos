// Tema "Carros" do Stop.
//
// CRITÉRIO DE INCLUSÃO — por que a lista é generosa:
// A validação em sala normal é correspondência EXATA no glossário
// (`set.has(normalize(word))` no StopRoom). Se alguém escreve um carro real
// que não está aqui, perde o ponto e sente injustiça — que é a pior coisa
// que pode acontecer numa rodada. Por isso vale MARCA e MODELO no mesmo
// tema: em adedonha, ninguém distingue "Carros: Ford" de "Carros: Fiesta",
// e recusar qualquer um dos dois seria pedir briga no chat.
//
// A ênfase é no mercado brasileiro (Uno, Gol, Celta, Opala, Fusca, Kombi),
// com os importados conhecidos por aqui. Carro que só existe em outro
// continente ficou de fora: não ajuda ninguém e incha a lista.
//
// As letras seguem o sorteio do jogo (LETTERS no StopRoom.js):
// A B C D E F G H I J L M N O P Q R S T U V X Z — sem K, W e Y.
//
// A normalização tira acento e caixa, então "Citroën" cobre "citroen" e
// "CITROEN" automaticamente — não é preciso repetir variação de acento.
export const CARROS_WORDS = {
  A: [
    "Astra", "Audi", "Agile", "Amarok", "Argo", "Aircross", "Accord",
    "Aveo", "Asia", "Apollo", "Arrizo", "Ateca", "Altima", "Aston Martin",
  ],
  B: [
    "BMW", "Bravo", "Blazer", "Brasilia", "Bora", "Bugatti", "Buick",
    "Belina", "Bentley", "Besta", "Bongo", "Berlingo", "Boxer",
  ],
  C: [
    "Corsa", "Celta", "Chevette", "Civic", "Corolla", "Cruze", "Citroen",
    "Chery", "Compass", "Captiva", "Clio", "Cobalt", "Creta", "Cronos",
    "Caravan", "Camaro", "Chevrolet", "Cadillac", "Corvette", "Cherokee",
    "City", "Colt", "Cordoba", "Captur", "CR-V", "CRV", "Ceed",
  ],
  D: [
    "Dodge", "Doblo", "Duster", "Daewoo", "Datsun", "Defender", "Discovery",
    "Dakota", "Delrey", "Daihatsu", "Dacia", "Dart", "Durango",
  ],
  E: [
    "Escort", "Ecosport", "Elba", "Etios", "Evoque", "Equinox", "Elantra",
    "Explorer", "Expedition", "Escalade", "Eclipse", "Edge", "Espace",
  ],
  F: [
    "Fiat", "Ford", "Fusca", "Focus", "Fiesta", "Ferrari", "Fusion", "Fox",
    "Frontier", "Freemont", "Fluence", "Fit", "Forester", "Fiorino",
    "Ford Ka", "F-250", "F250", "Fastback",
  ],
  G: [
    "Gol", "Golf", "Gurgel", "Grand Siena", "Genesis", "Gallardo", "Galaxie",
    "Gladiator", "Grand Cherokee", "Ghibli", "GMC",
  ],
  H: [
    "Honda", "Hyundai", "HB20", "Hilux", "Hummer", "Harrier", "Highlander",
    "Hoggar", "Hafei", "Haval", "Horizon",
  ],
  I: [
    "Ipanema", "Idea", "Impala", "Infiniti", "Integra", "Ibiza", "Ignis",
    "Impreza", "Insignia", "Iveco", "Ioniq",
  ],
  J: [
    "Jeep", "Jetta", "Jaguar", "Jimny", "Journey", "Justy", "Jac",
    "Jumper", "Juke", "Jeep Willys",
  ],
  L: [
    "Lancer", "Lexus", "Logan", "Lamborghini", "Livina", "Land Rover",
    "Lada", "Laguna", "Linea", "L200", "Lotus", "Lancia", "Legacy",
  ],
  M: [
    "Marea", "Monza", "Mercedes", "Mazda", "Mitsubishi", "Mini", "Megane",
    "Mobi", "March", "Meriva", "Montana", "Mustang", "Maserati", "Morgan",
    "Master", "Maverick", "Multipla", "Mondeo", "McLaren",
  ],
  N: [
    "Nissan", "Nivus", "Note", "Niva", "Nubira", "Navara", "Nova",
    "New Beetle", "Nexo",
  ],
  O: [
    "Opala", "Onix", "Omega", "Optra", "Outlander", "Octavia", "Opel",
    "Oroch", "Outback", "Odyssey",
  ],
  P: [
    "Palio", "Parati", "Polo", "Peugeot", "Pajero", "Prisma", "Passat",
    "Porsche", "Punto", "Picanto", "Pointer", "Pampa", "Panamera", "Prius",
    "Pulse", "Partner", "Patrol", "Pontiac",
  ],
  Q: [
    "Quantum", "Qashqai", "Quattro", "Quoris", "Quest", "Q3", "Q5", "Q7",
  ],
  R: [
    "Renault", "Range Rover", "Renegade", "Royale", "Ranger", "Rav4",
    "Rolls Royce", "Rio", "Rampage", "Rural",
  ],
  S: [
    "Santana", "Sandero", "Siena", "Spin", "Saveiro", "Subaru", "Suzuki",
    "Sonic", "Sentra", "Sportage", "Sorento", "Scenic", "Sonata", "Skoda",
    "Sprinter", "Strada", "S10", "Sandero Stepway", "Seat", "Symbol",
  ],
  T: [
    "Toyota", "Tempra", "Tipo", "Tucson", "Tiggo", "Tracker", "Tesla",
    "Tiguan", "Tigra", "Toro", "Trailblazer", "Tucker",
    "Territory", "Tornado", "Twingo", "Taurus", "Tahoe", "Tucson Hybrid",
  ],
  U: [
    "Uno", "Up", "Urus", "Uplander", "Ultima", "Urvan",
  ],
  V: [
    "Volkswagen", "Volvo", "Voyage", "Versa", "Vectra", "Virtus", "Veloster",
    "Vitara", "Veyron", "Viper", "Voyager", "Variant", "Vento",
  ],
  X: [
    "Xsara", "Xantia", "Xterra", "X1", "X3", "X5", "X6", "XC60", "XC90",
  ],
  Z: [
    "Zafira", "Zastava", "Zonda", "Z4", "Z3", "Zotye", "Zephyr",
  ],
};
