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
export const COBRAS_WORDS = {
  A: [
    "Áspide", "Anfisbena", "Anaconda-verde", "Acanthophis",
    "Acrochordo", "Aesculapian snake", "Adder", "African-rock-python",
    "Ashe-spitting-cobra",
  ],
  B: [
    "Boipeva", "Boa", "Bothrops", "Boa-constritora",
    "Boiuna", "Bothrops-jararaca", "Bico-de-jaca", "Bungarus",
    "Bushmaster", "Black mamba", "Ball python", "Boca-de-algodão",
    "Boomslang", "Brown-snake",
  ],
  C: [
    "Cascavel", "Caninana", "Coral", "Cobra-cega",
    "Cobra-verde", "Cobra-d'água", "Cobra-rei", "Crotalus",
    "Cobra-do-milho", "Cobra-cipó", "Coral-verdadeira", "Cobra-nariguda",
    "Cotiara", "Cobra-da-morte", "Cobra-arquivos", "Cobra-capelo",
    "Coral snake", "Cobra-de-capim", "Cobra-de-leite", "Corn snake",
    "Cobra-garter", "Cobra-liga", "Cobra-papagaio", "Cobra-rateira",
    "Cobra-comeseleiras", "Cobra-rei-californiana", "California kingsnake", "Cobra-bicuda",
    "Cobra-arco-íris", "Cobra-sol", "Cobra-de-esculápio", "Crossed pit viper",
    "Cobra-de-capelo", "Cobra-marinha", "Copperhead", "Cottonmouth",
  ],
  D: [
    "Dendroaspis", "Death adder", "Dipsas", "Dekay-brown-snake",
    "Desert-king-snake", "Dione-rat-snake", "Dwarf-water-cobra",
  ],
  E: [
    "Eunectes", "Emerald tree boa", "Echis", "Eyelash viper",
    "Eastern-hognose-snake", "Eastern-indigo", "Egyptian-cobra", "Equatorial-spitting-cobra",
  ],
  F: [
    "Falsa-coral", "Falsa-jararaca", "False coral snake", "False fer-de-lance",
    "Fer-de-lance", "Forest-cobra", "Foxsnake",
  ],
  G: [
    "Grass snake", "Garter snake", "Green snake", "Gongylophis",
    "Green mamba", "Golden lancehead", "Gaboon viper", "Gopher-snake",
  ],
  H: [
    "Hemachatus", "Horned viper", "Harlequin-coral-snake", "Herald-snake",
  ],
  I: [
    "Insubre", "Indian-cobra", "Indian-rat-snake", "Indigo-snake",
  ],
  J: [
    "Jararacuçu", "Jiboia-constritora", "Jararaca-ilhoa", "Jiboia-da-areia",
    "Jararacussu", "Jararaca-pintada", "Javan-spitting-cobra", "Jiboia-esmeralda",
  ],
  L: [
    "Lachesis", "Lachesis muta", "Lampropeltis", "Leopard-snake",
    "Lined-snake", "Long-nosed-snake",
  ],
  M: [
    "Mamba", "Mamba-negra", "Muçurana", "Micrurus",
    "Mussurana", "Mamba-verde", "Marine file snake", "Milk snake",
    "Malayan-pit-viper", "Mozambique-spitting-cobra",
  ],
  N: [
    "Naja-real", "Naja-cuspideira-anelada", "Naja-cuspideira", "Night-snake",
    "Northern-water-snake", "Nubian-spitting-cobra",
  ],
  O: [
    "Oxyuranus", "Oxybelis", "Ocellated-shieldtail", "Olive-house-snake",
    "Orsini-viper",
  ],
  P: [
    "Píton", "Papa-pinto", "Píton-real", "Píton-birmanesa",
    "Papa-ovo", "Pseudoboa", "Python", "Píton-bola",
    "Píton-reticulada", "Pine-snake", "Puff-adder",
  ],
  Q: [
    "Queimada-grande", "Queen-snake",
  ],
  R: [
    "Rattlesnake", "Ratsnake", "Rinkhals", "Ringhals",
    "Reticulated python", "Rainbow boa", "Rat-snake", "Rhinoceros-viper",
    "Ringneck-snake", "Russell-viper",
  ],
  S: [
    "Sucuri", "Salamanta", "Surucucu", "Serpente-do-mar",
    "Suaçubóia", "Sucuri-amarela", "South American bushmaster", "Snail-eating snake",
    "Saw-scaled viper", "Sand boa", "Sea snake", "Spitting cobra",
    "Sand viper", "Sunbeam snake", "Sidewinder", "Surucucu-pico-de-jaca",
  ],
  T: [
    "Taipan", "Taipan-do-interior", "Traquíschio", "Taipan-da-costa",
    "Tiger-snake", "Twig-snake",
  ],
  U: [
    "Urutu-cruzeiro", "Ushant-viper",
  ],
  V: [
    "Víbora-do-gabão", "Verrugosa", "Víbora-de-russell", "Víbora-de-escamas-de-serra",
    "Víbora-submarina", "Vine snake", "Viper", "Víbora-cornuda",
    "Víbora-da-areia", "Víbora-de-gabão", "Víbora-de-pestana", "Víbora-do-mar",
    "Vipera-latastei",
  ],
  X: [
    "Xenopeltis", "Xenodon",
  ],
  Z: [
    "Zamenis", "Zebra-spitting-cobra", "Zigzag-viper",
  ],
};
