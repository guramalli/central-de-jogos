// TEMA "COBRAS"
//
// ESCOPO: serpentes pelo nome vulgar, científico ou em inglês, conforme
// definido — muita cobra é conhecida pelo nome científico ("Bothrops") ou
// pelo inglês ("cobra king", "black mamba").
//
// ESTE ARQUIVO NÃO REPETE o que vem da segmentação de "Animais". Aquelas 11
// já entram pelo script: anaconda, cobra, cobra-coral, jararaca, jibóia,
// naja, serpente, serpente-cascavel, urutu, víbora.
//
// CUIDADO ESPECÍFICO DESTE TEMA: nome de serpente é onde eu mais erraria —
// há muita variação regional e nome parecido entre espécies diferentes.
// Listei só as que consigo afirmar com segurança, mesmo que isso deixe
// letras magras. Uma cobra inventada no glossário valida resposta errada
// pra sempre.
//
// LISTA AMPLIADA com a curadoria do Gustavinho (setembro/2026), que trouxe
// os nomes em inglês e os científicos. Três observações do que veio de lá:
//
//   - "Salamanta" e "Surucucu" estavam agrupadas na letra R, mas começam
//     com S. Cada nome foi pra letra com que ELE começa, não pra do grupo.
//
//   - Krait, Woma e Yarará ficaram de fora: K, W e Y não são sorteadas no
//     Stop, então palavra nessas letras nunca sairia numa rodada.
//
//   - Os nomes em inglês entram como palavras próprias, cada um na sua
//     letra: "Rattlesnake" é a tradução de "Cascavel", mas vale em R.
//
// ⚠️ SOBRE A SEGUNDA LISTA DE COBRAS (a de 300+ itens):
// Ela estava contaminada — a maior parte era a LISTA DE PEIXES enviada
// antes (atum, bacalhau, badejo, corvina, pirarucu, tubarão), mais algumas
// flores (verbena, violeta, zínia) e objetos do Sistema Solar (Rigel,
// Sirius, Vega, Pallas). Importada inteira, "atum" valeria ponto numa
// rodada de Cobras.
//
// Extraí só as serpentes de verdade: 57 de mais de 300 itens.
//
// EQUILÍBRIO DE IDIOMA (setembro/2026): o tema tinha chegado a 45% de nomes
// em inglês, porque as duas listas recebidas vinham quase todas assim. O
// inglês é aceito por definição do escopo e continua valendo — mas um tema
// de Stop brasileiro precisa que o nome que a pessoa digita primeiro esteja
// lá. Foram acrescentados os nomes em português, com peso nas serpentes
// brasileiras: jararacuçu, caninana, boipeva, cotiara, periquitambóia,
// suaçubóia, salamanta, papa-pinto, fura-terra.
//
export const COBRAS_WORDS = {
  A: [
    "Acanthophis", "Acrochordo", "Adder", "Aesculapian snake",
    "African-rock-python", "Anaconda-amarela", "Anaconda-verde", "Anfisbena",
    "Ashe-spitting-cobra", "Áspide",
  ],
  B: [
    "Ball python", "Bico-de-jaca", "Black mamba", "Boa",
    "Boa-constritora", "Boca-de-algodão", "Boipeva", "Boiuna",
    "Boomslang", "Bothrops", "Bothrops-jararaca", "Brown-snake",
    "Bungarus", "Bushmaster",
  ],
  C: [
    "California kingsnake", "Caninana", "Cascavel", "Chironius",
    "Clelia", "Cobra-arco-íris", "Cobra-bicuda", "Cobra-capelo",
    "Cobra-cega", "Cobra-cipó", "Cobra-d'água", "Cobra-da-morte",
    "Cobra-de-capelo", "Cobra-de-capim", "Cobra-de-duas-cabeças", "Cobra-de-esculápio",
    "Cobra-de-leite", "Cobra-do-milho", "Cobra-garter", "Cobra-grande",
    "Cobra-liga", "Cobra-lisa", "Cobra-marinha", "Cobra-nariguda",
    "Cobra-papagaio", "Cobra-preta", "Cobra-rateira", "Cobra-rei",
    "Cobra-rei-californiana", "Cobra-sol", "Cobra-verde", "Cobra-voadora",
    "Copperhead", "Coral", "Coral snake", "Coral-verdadeira",
    "Corallus", "Corn snake", "Cotiara", "Cottonmouth",
    "Crossed pit viper", "Crotalus",
  ],
  D: [
    "Death adder", "Dekay-brown-snake", "Dendroaspis", "Desert-king-snake",
    "Dione-rat-snake", "Dipsas", "Dormideira", "Drymarchon",
    "Dwarf-water-cobra",
  ],
  E: [
    "Eastern-hognose-snake", "Eastern-indigo", "Echis", "Egyptian-cobra",
    "Emerald tree boa", "Epicrates", "Equatorial-spitting-cobra", "Erythrolamprus",
    "Eunectes", "Eyelash viper",
  ],
  F: [
    "Falsa-coral", "Falsa-jararaca", "False coral snake", "False fer-de-lance",
    "Forest-cobra", "Foxsnake", "Fura-terra",
  ],
  G: [
    "Gaboon viper", "Garter snake", "Gongylophis", "Gopher-snake",
    "Grass snake", "Green mamba", "Green snake",
  ],
  H: [
    "Harlequin-coral-snake", "Helicops", "Hemachatus", "Herald-snake",
    "Horned viper",
  ],
  I: [
    "Indian-cobra", "Indian-rat-snake", "Indigo-snake",
  ],
  J: [
    "Jararaca-do-rabo-branco", "Jararaca-ilhoa", "Jararaca-pintada", "Jararacuçu",
    "Jararacussu", "Javan-spitting-cobra", "Jiboia-arco-íris", "Jiboia-da-areia",
    "Jiboia-esmeralda",
  ],
  L: [
    "Lachesis", "Lachesis muta", "Lampropeltis", "Leopard-snake",
    "Leptophis", "Lined-snake", "Liophis", "Long-nosed-snake",
  ],
  M: [
    "Malayan-pit-viper", "Mamba", "Mamba-negra", "Mamba-verde",
    "Marine file snake", "Micrurus", "Milk snake", "Mozambique-spitting-cobra",
    "Muçurana", "Mussurana",
  ],
  N: [
    "Naja-cuspideira", "Naja-cuspideira-anelada", "Night-snake", "Northern-water-snake",
    "Nubian-spitting-cobra",
  ],
  O: [
    "Ocellated-shieldtail", "Olive-house-snake", "Orsini-viper", "Oxybelis",
    "Oxyuranus",
  ],
  P: [
    "Papa-ovo", "Papa-pinto", "Periquitambóia", "Philodryas",
    "Pine-snake", "Píton", "Píton-birmanesa", "Píton-bola",
    "Píton-real", "Píton-reticulada", "Pseudoboa", "Puff-adder",
    "Python",
  ],
  Q: [
    "Queen-snake", "Queimada-grande",
  ],
  R: [
    "Rainbow boa", "Rat-snake", "Ratsnake", "Rattlesnake",
    "Reticulated python", "Rhinoceros-viper", "Ringhals", "Ringneck-snake",
    "Rinkhals", "Russell-viper",
  ],
  S: [
    "Salamanta", "Sand boa", "Sand viper", "Saw-scaled viper",
    "Sea snake", "Serpente-do-mar", "Sibynomorphus", "Sidewinder",
    "Snail-eating snake", "South American bushmaster", "Spilotes", "Spitting cobra",
    "Suaçubóia", "Sucuri", "Sucuri-amarela", "Sucuri-verde",
    "Sunbeam snake", "Surucucu", "Surucucu-pico-de-jaca",
  ],
  T: [
    "Taipan", "Taipan-da-costa", "Taipan-do-interior", "Tantilla",
    "Thamnodynastes", "Tiger-snake", "Tropidodryas", "Twig-snake",
  ],
  U: [
    "Urutu-cruzeiro", "Ushant-viper",
  ],
  V: [
    "Verrugosa", "Víbora-cornuda", "Víbora-da-areia", "Víbora-de-escamas-de-serra",
    "Víbora-de-gabão", "Víbora-de-pestana", "Víbora-de-russell", "Víbora-do-gabão",
    "Víbora-do-mar", "Vine snake", "Viper", "Vipera",
  ],
  X: [
    "Xenodon", "Xenopeltis",
  ],
  Z: [
    "Zamenis", "Zebra-spitting-cobra", "Zigzag-viper",
  ],
};
