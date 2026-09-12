// TEMA "SISTEMA SOLAR"
//
// ESCOPO, conforme definido: planetas e planetas anões, asteroides, nebulosas
// difusas, satélites naturais, cometas, crateras de Marte, fenômenos solares,
// constelações e estrelas.
//
// É um escopo largo e isso salva o tema: só com planetas seriam 8 palavras e
// a maioria das letras ficaria vazia. Com luas, estrelas e constelações o
// tema fecha as 23 letras.
//
// IDIOMA: nomes em português quando existe forma consagrada ("Júpiter", não
// "Jupiter"; "Ursa Maior", não "Ursa Major"). Nomes que só circulam na forma
// original entram como são ("Hubble", "Kuiper" — este último cai em K, que
// não é sorteada).
//
// A normalização tira acento, então "Vênus" já cobre "venus".
export const SISTEMA_SOLAR_WORDS = {
  A: [
    "Andrômeda", "Antares", "Áries", "Aquário",
    "Aldebarã", "Altair", "Amaltéia", "Ariel",
    "Asteroide", "Auriga", "Anel de Saturno",
  ],
  B: [
    "Betelgeuse", "Bootes", "Bellatrix", "Bólido",
    "Baleia", "Bússola",
  ],
  C: [
    "Cometa", "Calisto", "Caronte", "Cassiopeia",
    "Capricórnio", "Cratera", "Cinturão de asteroides", "Ceres",
    "Canopus", "Cruzeiro do Sul", "Câncer", "Centauro",
  ],
  D: [
    "Deimos", "Dione", "Draco", "Deneb",
    "Disco de Kuiper",
  ],
  E: [
    "Estrela", "Eclipse", "Europa", "Encélado",
    "Eris", "Eclíptica", "Escorpião", "Estrela cadente",
    "Equinócio",
  ],
  F: [
    "Fobos", "Fotosfera", "Fase lunar", "Fomalhaut",
    "Fênix",
  ],
  G: [
    "Ganimedes", "Galáxia", "Gêmeos", "Gigante gasoso",
    "Gigante vermelha",
  ],
  H: [
    "Halley", "Hidra", "Hércules", "Hélio",
    "Heliosfera", "Haumea",
  ],
  I: [
    "Io", "Iapeto", "Índio", "Ida",
    "Ícaro",
  ],
  J: [
    "Júpiter", "Juno", "Jano", "Julieta",
  ],
  L: [
    "Lua", "Leão", "Libra", "Lua cheia",
    "Lua nova", "Luz solar", "Lira", "Lobo",
  ],
  M: [
    "Marte", "Mercúrio", "Meteoro", "Meteorito",
    "Mimas", "Makemake", "Manchas solares", "Magnetosfera",
    "Mancha Vermelha",
  ],
  N: [
    "Netuno", "Nebulosa", "Nova", "Nebulosa de Órion",
    "Núcleo solar", "Nuvem de Oort",
  ],
  O: [
    "Órion", "Órbita", "Oberon", "Ofiúco",
    "Oposição", "Olympus Mons",
  ],
  P: [
    "Plutão", "Pégaso", "Perseu", "Plêiades",
    "Peixes", "Planeta anão", "Protuberância solar", "Periélio",
  ],
  Q: [
    "Quíron", "Quasar", "Quaoar",
  ],
  R: [
    "Rigel", "Reia", "Rotação", "Raios cósmicos",
    "Radiação solar",
  ],
  S: [
    "Saturno", "Sol", "Sirius", "Satélite",
    "Sistema solar", "Supernova", "Solstício", "Sagitário",
    "Sedna",
  ],
  T: [
    "Titã", "Terra", "Tritão", "Touro",
    "Tempestade solar", "Titânia", "Trânsito de Vênus",
  ],
  U: [
    "Urano", "Ursa Maior", "Ursa Menor", "Umbriel",
    "Umbra",
  ],
  V: [
    "Vênus", "Via Láctea", "Vega", "Virgem",
    "Vento solar", "Vesta",
  ],
  X: [
    "Xena",
  ],
  Z: [
    "Zênite", "Zodíaco",
  ],
};
