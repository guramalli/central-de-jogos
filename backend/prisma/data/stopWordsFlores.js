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
//
// AMPLIADO com a curadoria do Gustavinho (setembro/2026) — mas SÓ EM PARTE,
// e isso precisa ficar registrado.
//
// Aquela lista trazia centenas de nomes, e boa parte NÃO ERA FLOR: "Judo",
// "Juiz", "Jersey", "Marte", "Narval", "Namorado", "Mexilhão", "Nasua" (que
// é o quati), "Moss", "Nettle", "Nurture", "Dielétrico", "Nanquim", "Nácar"
// — além de uma entrada com caracteres japoneses no meio.
//
// Somando isso a centenas de gêneros em latim impossíveis de verificar um a
// um, importar tudo encheria o glossário de palavras que validariam resposta
// errada pra sempre. Aproveitei os ~270 que são flor de verdade e descartei
// o resto.
//
// A segunda parte (O a Z) veio bem melhor: quase tudo com nome científico
// verificável. Ainda assim saíram "Teco-teco", "Tule", "Roliça", "Xativa",
// "Yanga" e "Raiz-de-boca", que não são flores.
//
// Também ficou de fora o nome popular vulgar de uma Psychotria — o gênero
// entrou, o apelido não. O site tem público de todas as idades.
//
// W e Y não entraram: são letras que o Stop não sorteia.
export const FLORES_WORDS = {
  A: [
    "Azaleia", "Amor-perfeito", "Antúrio", "Anthurium",
    "Agapanto", "Alamanda", "Astromélia", "Açucena",
    "Amarílis", "Angélica", "Alstroemeria", "Abélia",
    "Acácia", "Acanto", "Adelfa", "Agerato",
    "Aguapé", "Agave", "Alfazema", "Alisso",
    "Alstroemélia", "Amor-crescido", "Anêmona", "Aquilégia",
    "Arnica", "Artemísia", "Áster", "Astilbe",
    "Azulzinha",
  ],
  B: [
    "Begônia", "Bromélia", "Bico-de-papagaio", "Boca-de-leão",
    "Buganvília", "Brinco-de-princesa", "Bela-emília", "Bougainvillea",
    "Babiana", "Bacopa", "Beijo-de-frade", "Bela-manhã",
    "Beladona", "Bergênia", "Bignônia", "Bonina",
    "Borragem", "Buquê-de-noiva",
  ],
  C: [
    "Cravo", "Camélia", "Copo-de-leite", "Crisântemo",
    "Cerejeira", "Calêndula", "Capuchinha", "Celósia",
    "Cosmos", "Ciclame", "Cravina", "Caládio",
    "Calandrínia", "Calanchoê", "Calceolária", "Caliandra",
    "Calistemo", "Camomila", "Campânula", "Cambará",
    "Canna", "Cardo-santo", "Cássia", "Catleia",
    "Centáurea", "Cheiranthus", "Cinerária", "Clematite",
    "Clerodendro", "Clitória", "Clívia", "Coração-sangrento",
    "Coroa-de-cristo", "Coroa-imperial", "Crino", "Crocus",
    "Crossandra", "Crotalária", "Cunhã", "Cúrcuma",
  ],
  D: [
    "Dália", "Dracena", "Dente-de-leão", "Delfínio",
    "Dama-da-noite", "Dedaleira", "Dipladênia", "Dama-entre-verdes",
    "Daphne", "Datura", "Dendróbio", "Diantus",
    "Diáscia", "Dicentra", "Dietes", "Digitalis",
    "Dimorfoteca", "Dionéia", "Drosera", "Duranta",
  ],
  E: [
    "Estrelítzia", "Espirradeira", "Escova-de-garrafa", "Eustoma",
    "Edelvais", "Echeveria", "Equinácea", "Eremurus",
    "Érica", "Erígeron", "Escabiosa", "Espatódea",
    "Esporeira", "Estapélia", "Estátice", "Estrelícia",
    "Eucomis", "Eufórbia", "Eupatório", "Exacum",
  ],
  F: [
    "Flor-de-lis", "Flor de maio", "Fúcsia", "Freesia",
    "Flamboyant", "Flor-do-campo", "Falsa-érica", "Felícia",
    "Filipêndula", "Flox", "Flor-de-cera", "Flor-de-lótus",
    "Flor-de-mel", "Flor-de-são-joão", "Flor-de-seda", "Flor-do-cardeal",
    "Flor-do-caribe", "Flor-do-deserto", "Flor-do-maracujá", "Flor-do-paraíso",
    "Forsythia", "Frangipani", "Frésia", "Fritilária",
    "Fumária",
  ],
  G: [
    "Gérbera", "Girassol", "Gardênia", "Gladíolo",
    "Gloriosa", "Gipsofila", "Glicínia", "Gaillardia",
    "Galanto", "Genciana", "Gerânio", "Gesnéria",
    "Globulária", "Gloxínia", "Goivo", "Gonfrena",
    "Gravatá", "Grevílea", "Guzmânia",
  ],
  H: [
    "Hibisco", "Hortênsia", "Hibiscus", "Helicônia",
    "Hemerocale", "Hamamélis", "Hedychium", "Helênio",
    "Heliântemo", "Heliotrópio", "Hélebo", "Hepática",
    "Heuchera", "Hosta", "Hoya",
  ],
  I: [
    "Íris", "Ipê", "Ixora", "Impatiens",
    "Íris-amarela", "Íberis", "Indigófera", "Ipomeia",
    "Ixia",
  ],
  J: [
    "Jasmim", "Jacinto", "Jaborandi", "Jasmim-manga",
    "Jacobínia", "Jálapa", "Jasmim-da-noite", "Jatrofa",
    "Joanésia", "Junquilho",
  ],
  L: [
    "Lírio", "Lavanda", "Lisianto", "Lótus",
    "Lantana", "Lágrima-de-cristo", "Lírio-do-vale", "Lachenália",
    "Laélia", "Lampranthus", "Lavátera", "Leucadendro",
    "Leucanto", "Liatris", "Libertia", "Lobélia",
    "Lonicera", "Lupino", "Lírio-da-paz", "Lírio-asiático",
    "Lírio-tigre", "Lírio-dos-incas", "Lycaste",
  ],
  M: [
    "Margarida", "Magnólia", "Maria-sem-vergonha", "Manacá",
    "Mimosa", "Miosótis", "Malva", "Mandevilla",
    "Madressilva", "Malmequer", "Malva-rosa", "Malvavisco",
    "Manacá-da-serra", "Mandevila", "Mandrágora", "Maravilha",
    "Margarida-africana", "Mariposa", "Matíola", "Matricária",
    "Medinila", "Melaleuca", "Melissa", "Mikania",
    "Mímulo", "Mirabilis", "Mirto", "Moluccella",
    "Monarda", "Moreia", "Mosquitinho", "Mussaenda",
    "Muscari", "Myosotis",
  ],
  N: [
    "Narciso", "Ninfeia", "Noivinha", "Nemésia",
    "Nastúrcio", "Nandina", "Nardo", "Nemophila",
    "Nepeta", "Neomarica", "Neoregélia", "Nerine",
    "Nerium", "Nicotiana", "Nidulário", "Nierembergia",
    "Nigella",
  ],
  O: [
    "Orquídea", "Onze-horas", "Orelha-de-urso", "Ornitógalo",
    "Oleandro", "Olho-de-boi", "Oncídio", "Orquídea-borboleta",
    "Orquídea-sapatinho", "Orquídea-garça", "Orégano", "Orobanche",
    "Osmanthus", "Osteospermum", "Otacanthus", "Oxalis",
    "Olho-de-gato", "Olho-de-pavão", "Onopordum", "Oenothera",
    "Orquídea-bambu", "Orquídea-macaco", "Orquídea-negra", "Oregano-de-flores",
    "Oxypetalum",
  ],
  P: [
    "Peônia", "Petúnia", "Primavera", "Prímula",
    "Papoula", "Pata-de-vaca", "Palma-de-santa-rita", "Pingo-de-ouro",
    "Pachystachys", "Pompom", "Papoula-da-califórnia", "Papoula-azul",
    "Papo-de-peru", "Paradisia", "Pariparoba", "Passiflora",
    "Patrinia", "Pavônia", "Pedilanthus", "Pelargonium",
    "Penstemon", "Pensamento", "Peperômia", "Pervinca",
    "Petúnia-selvagem", "Phlox", "Physalis", "Phalaenopsis",
    "Píretro", "Pitósporo", "Platycodon", "Plumbago",
    "Plumeria", "Poinsettia", "Polemonium", "Polianthes",
    "Polygonum", "Portulaca", "Potentilla", "Protea",
    "Prunella", "Pseuderanthemum", "Psychotria", "Pueraria",
    "Pulsatilla",
  ],
  Q: [
    "Quaresmeira", "Quaresmeira-rasteira", "Quebra-pedra", "Quamoclit",
    "Quassia", "Quelone", "Quenopódio", "Querofilo",
    "Quisqualis", "Quina",
  ],
  R: [
    "Rosa", "Rododendro", "Ranúnculo", "Rosa-do-deserto",
    "Russélia", "Resedá", "Rainha-da-noite", "Rainha-dos-prados",
    "Ramonda", "Rapunzel", "Resedá-cheiroso", "Rhamnus",
    "Rhexia", "Rosa-louca", "Rosa-de-saron", "Rosa-chá",
    "Rosa-mosqueta", "Rosa-de-gueldres", "Rosa-de-porcelana", "Roseta",
    "Rosmaninho", "Rotala", "Rudbeckia", "Ruellia",
  ],
  S: [
    "Suculenta", "Sempre-viva", "Saudade", "Sálvia",
    "Sininho", "Solidago", "Sabugueiro", "Sagittaria",
    "Saia-branca", "Saintpaulia", "Salva-vermelha", "Sálvia-azul",
    "Sambac", "Sanguinária", "Sanvitalia", "Sapatinho-de-vênus",
    "Saponária", "Sarracênia", "Saxifraga", "Scabiosa",
    "Scilla", "Scutellaria", "Sedum", "Sene",
    "Senecio", "Serratula", "Serissa", "Silene",
    "Sinningia", "Sisyrinchium", "Skimmia", "Solandra",
    "Solanum", "Sophora", "Sparaxis", "Spiraea",
    "Stachys", "Stapelia", "Statice", "Sternbergia",
    "Stokesia", "Strelitzia", "Streptocarpus", "Sucupira",
    "Suspiro", "Sutera", "Symphytum", "Syringa",
  ],
  T: [
    "Tulipa", "Tagete", "Trevo", "Trombeta",
    "Torênia", "Tumbérgia", "Tabebuia", "Tacca",
    "Tagetes", "Talinum", "Tamariz", "Tanacetum",
    "Taraxacum", "Tecophilaea", "Tecoma", "Tellima",
    "Tetragonia", "Teucrium", "Thalia", "Thalictrum",
    "Thlaspi", "Thunbergia", "Thunbergia-azul", "Thymus",
    "Tibouchina", "Tiarella", "Tigridia", "Tília",
    "Tipuana", "Tithonia", "Trachelium", "Tradescantia",
    "Trevo-de-quatro-folhas", "Trichosanthes", "Tricyrtis", "Trifolium",
    "Trillium", "Tritonia", "Trollius", "Tropaeolum",
    "Tulipa-negra", "Tumbérgia-arbustiva", "Turnera", "Tussilagem",
    "Typha",
  ],
  U: [
    "Urze", "Unha-de-gato", "Ulex", "Ulmeária",
    "Unha-de-vaca", "Urginea", "Urospermum", "Ursinia",
    "Urtiga-morta", "Utricularia", "Uvularia",
  ],
  V: [
    "Violeta", "Verbena", "Vitória-régia", "Viburno",
    "Vinca", "Valeriana", "Vanda", "Vandopsis",
    "Vanilla", "Vara-de-ouro", "Velame", "Vellósia",
    "Venidium", "Veratrum", "Verbasco", "Verônica",
    "Viburnum", "Viola", "Violeta-africana", "Violeta-pendente",
    "Violeta-da-pérsia", "Viperina", "Virga-áurea", "Viscaria",
    "Vitaliana", "Vitex", "Vittadinia", "Vochysia",
    "Volubilis", "Vriésia",
  ],
  X: [
    "Xerantemo", "Xanthorrhoea", "Xanthosoma", "Xeranthemum",
    "Xerophyllum", "Ximenia", "Xiphion", "Xixá",
    "Xylobium", "Xyris",
  ],
  Z: [
    "Zínia", "Zantedeschia", "Zamioculca", "Zinnia",
    "Zapania", "Zauschneria", "Zea", "Zebrina",
    "Zelkova", "Zenobia", "Zephyranthes", "Zingiber",
    "Ziziphora", "Zygopetalum", "Zygophyllum",
  ],
};
