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
//
// AMPLIADO com a curadoria do Gustavinho (setembro/2026), de boa qualidade —
// quase tudo objeto astronômico verificável, com muita cratera marciana e
// cometa que eu não teria lembrado (Gale, Gusev, Hellas, Schiaparelli,
// Hyakutake, Shoemaker-Levy).
//
// Saíram poucas: "Besta-do-Apocalipse", "Bolar", "Quilometa", "Yyr" e
// "Nave Espacial", que não são nomes reais; "Sonda", que é equipamento e não
// objeto celeste; e "Ulysses", que é sonda espacial, não cometa — o mesmo
// erro que eu já tinha cometido e corrigido antes.
//
// K, W e Y ficaram de fora: letras que o Stop não sorteia.
export const SISTEMA_SOLAR_WORDS = {
  A: [
    "Andrômeda", "Antares", "Áries", "Aquário",
    "Aldebarã", "Altair", "Amaltéia", "Ariel",
    "Asteroide", "Auriga", "Anel de Saturno", "Aldebaran",
    "Algol", "Apófis", "Amaltea", "Anel-de-einstein",
    "Aurora-boreal", "Aurora-austral", "Acrux", "Arcturus",
    "Astreia",
  ],
  B: [
    "Betelgeuse", "Bootes", "Bellatrix", "Bólido",
    "Baleia", "Bússola", "Besta", "Bennu",
    "Berenice", "Biela",
  ],
  C: [
    "Cometa", "Calisto", "Caronte", "Cassiopeia",
    "Capricórnio", "Cratera", "Cinturão de asteroides", "Ceres",
    "Canopus", "Cruzeiro do Sul", "Câncer", "Centauro",
    "Capela", "Caranguejo", "Carena", "Churyumov-Gerasimenko",
    "Canguru", "Ciclone-solar", "Coroa-solar", "Cinto-de-órion",
  ],
  D: [
    "Deimos", "Dione", "Draco", "Deneb",
    "Disco de Kuiper", "Dáctil", "Dorado", "Diadema",
    "Donati", "Dufour", "Dupla-hélice",
  ],
  E: [
    "Estrela", "Eclipse", "Europa", "Encélado",
    "Eris", "Eclíptica", "Escorpião", "Estrela cadente",
    "Equinócio", "Eros", "Encke", "Eletra",
    "Erupção-solar", "Eskimo", "Ecdysis",
  ],
  F: [
    "Fobos", "Fotosfera", "Fase lunar", "Fomalhaut",
    "Fênix", "Fajardo", "Faye", "Fáculo",
    "Flora",
  ],
  G: [
    "Ganimedes", "Galáxia", "Gêmeos", "Gigante gasoso",
    "Gigante vermelha", "Gemma", "Gaspra", "Giacobini-Zinner",
    "Gale", "Gusev", "Granulação",
  ],
  H: [
    "Halley", "Hidra", "Hércules", "Hélio",
    "Heliosfera", "Haumea", "Hale-Bopp", "Hélix",
    "Himalia", "Híadas", "Hebe", "Hellas",
    "Hyakutake",
  ],
  I: [
    "Io", "Iapeto", "Índio", "Ida",
    "Ícaro", "Ison", "Inti", "Izmit",
  ],
  J: [
    "Júpiter", "Juno", "Jano", "Julieta",
    "Janus", "Janssen", "Joly", "Jones",
    "Juewa",
  ],
  L: [
    "Lua", "Leão", "Libra", "Lua cheia",
    "Lua nova", "Luz solar", "Lira", "Lobo",
    "Laguna", "Leda", "Lutetia", "Lexell",
    "Lomonosov", "Lente-gravitacional",
  ],
  M: [
    "Marte", "Mercúrio", "Meteoro", "Meteorito",
    "Mimas", "Makemake", "Manchas solares", "Magnetosfera",
    "Mancha Vermelha", "Miranda", "Mira", "Macha",
    "Maia", "Machholz", "Massa-coronal",
  ],
  N: [
    "Netuno", "Nebulosa", "Nova", "Nebulosa de Órion",
    "Núcleo solar", "Nuvem de Oort", "Nix", "Nereida",
    "Northumberland", "Neujmin", "Nuvem-de-magalhães",
  ],
  O: [
    "Órion", "Órbita", "Oberon", "Ofiúco",
    "Oposição", "Olympus Mons", "Olho-de-gato", "Olímpia",
    "Olimpo", "Ohm", "Oumuamua", "Orionídeas",
  ],
  P: [
    "Plutão", "Pégaso", "Perseu", "Plêiades",
    "Peixes", "Planeta anão", "Protuberância solar", "Periélio",
    "Pólux", "Proxima-centauri", "Phoebe", "Pallas",
    "Pons-Brooks", "Prominência-solar", "Ptolemeu", "Pólo-norte-celestial",
  ],
  Q: [
    "Quíron", "Quasar", "Quaoar", "Quirguiz",
    "Qingdao",
  ],
  R: [
    "Rigel", "Reia", "Rotação", "Raios cósmicos",
    "Radiação solar", "Régulo", "Rhea", "Roseta",
    "Rabe", "Raman", "Rios-de-lava", "Raios-solares",
  ],
  S: [
    "Saturno", "Sol", "Sirius", "Satélite",
    "Sistema solar", "Supernova", "Solstício", "Sagitário",
    "Sedna", "Spica", "Shoemaker-Levy", "Sila-Nunam",
    "Sinope", "Styx", "Schiaparelli", "Spícula",
  ],
  T: [
    "Titã", "Terra", "Tritão", "Touro",
    "Tempestade solar", "Titânia", "Trânsito de Vênus", "Tebas",
    "Toro", "Tarântula", "Trifida", "Tuttle",
    "Timbuktu",
  ],
  U: [
    "Urano", "Ursa Maior", "Ursa Menor", "Umbriel",
    "Umbra", "Utopia", "Uvarov",
  ],
  V: [
    "Vênus", "Via Láctea", "Vega", "Virgem",
    "Vento solar", "Vesta", "Vila", "Viking",
    "Véu", "Vales-marineris",
  ],
  X: [
    "Xena", "Xira", "Xanto",
  ],
  Z: [
    "Zênite", "Zodíaco", "Zeta-reticuli", "Zosma",
    "Zubenelgenubi", "Zumba", "Zuni",
  ],
};
