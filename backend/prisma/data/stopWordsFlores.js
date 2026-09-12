// TEMA "FLORES"
//
// ESCOPO: flores do Brasil e do mundo. Nome científico também vale, conforme
// definido — muita flor é conhecida assim ("Anthurium", "Hibiscus").
//
// IDIOMA: nome popular em português E nome científico. Quando as duas formas
// circulam, entram as duas ("copo-de-leite" e "Zantedeschia") — a validação
// é exata, e cada forma ausente é um ponto perdido.
//
// CRITÉRIO: flor ou planta ornamental florífera. Ficam de fora árvores cujo
// nome não é usado como flor ("ipê" entra, porque a flor do ipê é o que se
// conhece; "eucalipto" não).
//
// A normalização tira acento, então "Begônia" já cobre "begonia".
export const FLORES_WORDS = {
  A: [
    "Azaleia", "Amor-perfeito", "Antúrio", "Anthurium",
    "Agapanto", "Alamanda", "Astromélia", "Açucena",
    "Amarílis", "Angélica", "Alstroemeria",
  ],
  B: [
    "Begônia", "Bromélia", "Bico-de-papagaio", "Boca-de-leão",
    "Buganvília", "Brinco-de-princesa", "Bela-emília", "Bougainvillea",
  ],
  C: [
    "Cravo", "Camélia", "Copo-de-leite", "Crisântemo",
    "Cerejeira", "Calêndula", "Capuchinha", "Celósia",
    "Cosmos", "Ciclame", "Cravina",
  ],
  D: [
    "Dália", "Dracena", "Dente-de-leão", "Delfínio",
    "Dama-da-noite", "Dedaleira", "Dipladênia",
  ],
  E: [
    "Estrelítzia", "Espirradeira", "Escova-de-garrafa", "Eustoma",
    "Edelvais",
  ],
  F: [
    "Flor-de-lis", "Flor de maio", "Fúcsia", "Freesia",
    "Flamboyant", "Flor-do-campo",
  ],
  G: [
    "Gérbera", "Girassol", "Gardênia", "Gladíolo",
    "Gloriosa", "Gipsofila", "Glicínia",
  ],
  H: [
    "Hibisco", "Hortênsia", "Hibiscus", "Helicônia",
    "Hemerocale",
  ],
  I: [
    "Íris", "Ipê", "Ixora", "Impatiens",
    "Íris-amarela",
  ],
  J: [
    "Jasmim", "Jacinto", "Jaborandi", "Jasmim-manga",
  ],
  L: [
    "Lírio", "Lavanda", "Lisianto", "Lótus",
    "Lantana", "Lágrima-de-cristo", "Lírio-do-vale",
  ],
  M: [
    "Margarida", "Magnólia", "Maria-sem-vergonha", "Manacá",
    "Mimosa", "Miosótis", "Malva", "Mandevilla",
  ],
  N: [
    "Narciso", "Ninfeia", "Noivinha", "Nemésia",
    "Nastúrcio",
  ],
  O: [
    "Orquídea", "Onze-horas", "Orelha-de-urso", "Ornitógalo",
  ],
  P: [
    "Peônia", "Petúnia", "Primavera", "Prímula",
    "Papoula", "Pata-de-vaca", "Palma-de-santa-rita", "Pingo-de-ouro",
  ],
  Q: [
    "Quaresmeira",
  ],
  R: [
    "Rosa", "Rododendro", "Ranúnculo", "Rosa-do-deserto",
    "Russélia", "Resedá",
  ],
  S: [
    "Suculenta", "Sempre-viva", "Saudade", "Sálvia",
    "Sininho", "Solidago",
  ],
  T: [
    "Tulipa", "Tagete", "Trevo", "Trombeta",
    "Torênia", "Tumbérgia",
  ],
  U: [
    "Urze", "Unha-de-gato",
  ],
  V: [
    "Violeta", "Verbena", "Vitória-régia", "Viburno",
    "Vinca",
  ],

  X: [
    "Xerantemo",
  ],
  Z: [
    "Zínia", "Zantedeschia", "Zamioculca", "Zinnia",
  ],
};
