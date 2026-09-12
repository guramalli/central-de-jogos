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
// SUFIXOS DOS COMPOSTOS "COBRA-X" (setembro/2026): quem escreve "espada"
// numa rodada de Cobras está pensando em "cobra-espada", e recusar seria
// frustrar resposta legítima. Cada composto virou duas entradas: a completa
// e o sufixo sozinho, cada uma na sua letra.
//
// EXCEÇÃO: sufixo que é só cor ou adjetivo ficou de fora — "verde", "preta",
// "grande", "listrada". Aceitos, tornariam o tema sem sentido (bastaria
// escrever uma cor pra pontuar), e essas palavras já são resposta certa no
// tema Cor.
//
// TERCEIRA LISTA (setembro/2026): a melhor de todas pro tema — nomes
// regionais brasileiros de verdade, incluindo os compostos em tupi ("-boia":
// açuambóia, japoboia, trairamboia, periquitamboia) e as dezenas de
// variações de jararaca, surucucu e coral que cada região usa.
//
// O QUE SAIU DELA: "Açucena" e "Hortelã" (flores), "Arapuá" e "Irapuã"
// (abelhas), "Minhoca", "Zebra" e "Espada" sozinhos — os dois primeiros são
// outros bichos e o terceiro é objeto; só valem nos compostos
// ("cobra-espada", "zebra-do-mato"). Também saíram "Patioba", "Pindoba" e
// "Ouricana", que são palmeiras e só aparecem dentro de nomes compostos.
//
export const COBRAS_WORDS = {
  A: [
    "Acanthophis", "Acrochordo", "Açuambóia", "Acutiara",
    "Adder", "Aesculapian snake", "African-rock-python", "Anaconda-amarela",
    "Anaconda-verde", "Anfisbena", "Arco-íris", "Ashe-spitting-cobra",
    "Áspide", "Azulão-boia",
  ],
  B: [
    "Ball python", "Bico-de-jaca", "Bico-de-papagaio", "Bicuda",
    "Black mamba", "Boa", "Boa-constritora", "Boca-de-algodão",
    "Boca-podre", "Boiaçu", "Boiatininga", "Boicoatiara",
    "Boicorá", "Boicotiara", "Boiguaçu", "Boipeba",
    "Boipeva", "Boipeva-d'água", "Boipinima", "Boiuna",
    "Boomslang", "Bothrops", "Bothrops-jararaca", "Brown-snake",
    "Bungarus", "Bushmaster",
  ],
  C: [
    "Caiçaca", "California kingsnake", "Caninana", "Capelo",
    "Cascavel", "Cega", "Cega-preta", "Chironius",
    "Cipó", "Cipó-listrada", "Cipó-malhada", "Cipó-marrom",
    "Clelia", "Coatiara", "Cobra-arco-íris", "Cobra-bicuda",
    "Cobra-capelo", "Cobra-cega", "Cobra-cega-preta", "Cobra-cipó",
    "Cobra-cipó-listrada", "Cobra-cipó-malhada", "Cobra-cipó-marrom", "Cobra-corá",
    "Cobra-coral-anelada", "Cobra-coral-de-anéis", "Cobra-coral-de-cabeça-preta", "Cobra-coral-de-cabeça-vermelha",
    "Cobra-coral-de-cinta-branca", "Cobra-coral-de-costas-pretas", "Cobra-coral-fina", "Cobra-coral-pampeana",
    "Cobra-coral-pequena", "Cobra-coral-uruguaia", "Cobra-coral-vermelha", "Cobra-d'água",
    "Cobra-d'água-meridional", "Cobra-d'água-preta", "Cobra-d'água-serrana", "Cobra-da-morte",
    "Cobra-da-terra", "Cobra-de-caçote", "Cobra-de-cadarço", "Cobra-de-capelo",
    "Cobra-de-capim", "Cobra-de-chumbinho", "Cobra-de-duas-cabeças", "Cobra-de-esculápio",
    "Cobra-de-leite", "Cobra-de-listra-vermelha", "Cobra-de-parede", "Cobra-de-veado",
    "Cobra-do-lodo", "Cobra-do-mato", "Cobra-do-milho", "Cobra-do-rabo-branco",
    "Cobra-do-rio", "Cobra-espada", "Cobra-espada-de-água", "Cobra-espada-pampeana",
    "Cobra-espada-pintada", "Cobra-fio", "Cobra-garter", "Cobra-gato",
    "Cobra-grande", "Cobra-jericoá", "Cobra-liga", "Cobra-lisa",
    "Cobra-listrada", "Cobra-marinha", "Cobra-nariguda", "Cobra-nariguda-das-dunas",
    "Cobra-nebulosa", "Cobra-olho-de-gato", "Cobra-papagaio", "Cobra-paraíso",
    "Cobra-preta", "Cobra-rabo-de-pau", "Cobra-rajada", "Cobra-rateira",
    "Cobra-rei", "Cobra-rei-californiana", "Cobra-sol", "Cobra-topete",
    "Cobra-verde", "Cobra-vermelha", "Cobra-voadora", "Cobrinha-da-terra",
    "Comboia", "Copperhead", "Corá", "Coral",
    "Coral snake", "Coral-anelada", "Coral-de-anéis", "Coral-de-cabeça-preta",
    "Coral-de-cabeça-vermelha", "Coral-de-cara-preta", "Coral-de-cinta-branca", "Coral-de-cintas-simples",
    "Coral-de-colar-branco", "Coral-de-costas-pretas", "Coral-falsa", "Coral-fina",
    "Coral-pampeana", "Coral-pequena", "Coral-uruguaia", "Coral-verdadeira",
    "Coral-vermelha", "Corallus", "Corn snake", "Corre-campo",
    "Corredeira", "Corredeira-do-banhado", "Corredeira-listrada", "Cotiara",
    "Cottonmouth", "Crossed pit viper", "Crotalus", "Cruzeira",
    "Cruzeiro", "Cuamboia", "Cuiama", "Cuiama-nariguda",
  ],
  D: [
    "D'água", "D'água-meridional", "D'água-preta", "D'água-serrana",
    "Da-morte", "Dama-d'água", "De-caçote", "De-cadarço",
    "De-capelo", "De-capim", "De-chumbinho", "De-duas-cabeças",
    "De-esculápio", "De-leite", "De-listra-vermelha", "De-parede",
    "De-veado", "Death adder", "Dekay-brown-snake", "Dendroaspis",
    "Desert-king-snake", "Dione-rat-snake", "Dipsas", "Do-lodo",
    "Do-milho", "Do-rabo-branco", "Dorme-dorme", "Dormideira",
    "Dormideira-cipó", "Dormideira-cipó-cinzenta", "Dorminhoca", "Drymarchon",
    "Dwarf-water-cobra",
  ],
  E: [
    "Eastern-hognose-snake", "Eastern-indigo", "Echis", "Egyptian-cobra",
    "Emerald tree boa", "Epicrates", "Equatorial-spitting-cobra", "Erythrolamprus",
    "Espada", "Espada-de-água", "Espada-pampeana", "Espada-pintada",
    "Eunectes", "Eyelash viper",
  ],
  F: [
    "Falsa-coral", "Falsa-coral-bicuda", "Falsa-cruzeira", "Falsa-jararaca",
    "Falsa-muçurana", "False coral snake", "False fer-de-lance", "Fio",
    "Focinho-de-porco", "Forest-cobra", "Foxsnake", "Fura-terra",
  ],
  G: [
    "Gaboon viper", "Garter", "Garter snake", "Gato",
    "Giboia", "Giboia-anã", "Giboia-branca", "Giboia-cinzenta",
    "Giboia-da-cauda-vermelha", "Giboia-do-cerrado", "Giboia-dormideira", "Giboia-rosada",
    "Gongylophis", "Gopher-snake", "Grass snake", "Green mamba",
    "Green snake",
  ],
  H: [
    "Harlequin-coral-snake", "Helicops", "Hemachatus", "Herald-snake",
    "Horned viper",
  ],
  I: [
    "Ibiboboca", "Ibiboca", "Ilhoa", "Indian-cobra",
    "Indian-rat-snake", "Indigo-snake",
  ],
  J: [
    "Japoboia", "Jararaca-açu", "Jararaca-agosto", "Jararaca-barriga-preta",
    "Jararaca-bicuda", "Jararaca-caçadora", "Jararaca-da-amazônia", "Jararaca-da-praia",
    "Jararaca-das-árvores", "Jararaca-das-dunas", "Jararaca-de-alcatrazes", "Jararaca-de-parede",
    "Jararaca-de-patioba", "Jararaca-de-tabuleiro", "Jararaca-do-campo", "Jararaca-do-chaco",
    "Jararaca-do-norte", "Jararaca-do-rabo-branco", "Jararaca-do-rabo-fino", "Jararaca-grão-de-arroz",
    "Jararaca-ilhoa", "Jararaca-listrada", "Jararaca-nariguda", "Jararaca-pintada",
    "Jararaca-pintada-do-sul", "Jararaca-preta", "Jararaca-rabo-de-porco", "Jararaca-verde",
    "Jararaca-vermelha", "Jararacuçu", "Jararacuçu-do-brejo", "Jararacussu",
    "Jararaquinha", "Jararaquinha-d'água", "Jararaquinha-da-praia", "Jararaquinha-pintada",
    "Javan-spitting-cobra", "Jericoá", "Jiboia-anã", "Jiboia-arco-íris",
    "Jiboia-branca", "Jiboia-cinzenta", "Jiboia-da-areia", "Jiboia-da-cauda-vermelha",
    "Jiboia-do-cerrado", "Jiboia-dormideira", "Jiboia-esmeralda", "Jiboinha",
    "Jiboinha-comum", "Jiboinha-rosada",
  ],
  L: [
    "Lachesis", "Lachesis muta", "Lampropeltis", "Leopard-snake",
    "Leptophis", "Liga", "Limpa-mato", "Limpa-pasto",
    "Lined-snake", "Liophis", "Long-nosed-snake",
  ],
  M: [
    "Malayan-pit-viper", "Mamba", "Mamba-negra", "Mamba-verde",
    "Mapanare", "Marine file snake", "Marinha", "Micrurus",
    "Milk snake", "Minhocão", "Mozambique-spitting-cobra", "Muçurana",
    "Muçurana-comum", "Muçurana-nariguda", "Mussurana",
  ],
  N: [
    "Naja-cuspideira", "Naja-cuspideira-anelada", "Nariguda", "Nariguda-comum",
    "Nariguda-das-dunas", "Nariguda-grande", "Nariguda-preta", "Night-snake",
    "Northern-water-snake", "Nubian-spitting-cobra",
  ],
  O: [
    "Ocellated-shieldtail", "Olho-de-gato", "Olive-house-snake", "Orsini-viper",
    "Oxybelis", "Oxyuranus",
  ],
  P: [
    "Papa-lesma", "Papa-ovo", "Papa-pinto", "Papagaio",
    "Paraíso", "Paramboia", "Periquitambóia", "Philodryas",
    "Pico-de-jaca", "Pine-snake", "Píton", "Píton-birmanesa",
    "Píton-bola", "Píton-real", "Píton-reticulada", "Pseudoboa",
    "Puff-adder", "Python",
  ],
  Q: [
    "Quatro-ventas", "Queen-snake", "Queimada-grande",
  ],
  R: [
    "Rabo-de-fino", "Rabo-de-mucura", "Rabo-de-mulita", "Rabo-de-pau",
    "Rabo-de-pavio", "Rabo-de-porco", "Rainbow boa", "Rat-snake",
    "Rateira", "Rattlesnake", "Rei", "Rei-californiana",
    "Reticulated python", "Rhinoceros-viper", "Ringhals", "Ringneck-snake",
    "Rinkhals", "Russell-viper",
  ],
  S: [
    "Salamanta", "Salamanta-boi", "Sand boa", "Sand viper",
    "Saw-scaled viper", "Sea snake", "Serpente-do-mar", "Sibynomorphus",
    "Sidewinder", "Snail-eating snake", "Sol", "South American bushmaster",
    "Spilotes", "Spitting cobra", "Suaçubóia", "Sucuri",
    "Sucuri-amarela", "Sucuri-de-patioba", "Sucuri-do-pantanal", "Sucuri-pinta-de-ouro",
    "Sucuri-verde", "Sucurijú", "Sucurijuba", "Sucurucurana",
    "Sunbeam snake", "Surucucu", "Surucucu-bico-de-jaca", "Surucucu-cospe-fogo",
    "Surucucu-da-várzea", "Surucucu-de-fogo", "Surucucu-de-ouricana", "Surucucu-de-patioba",
    "Surucucu-de-pindoba", "Surucucu-do-barranco", "Surucucu-pico-de-jaca", "Surucucu-pinta-de-ouro",
    "Surucucu-vermelha", "Surucutinga",
  ],
  T: [
    "Taipan", "Taipan-da-costa", "Taipan-do-interior", "Tantilla",
    "Thamnodynastes", "Tiger-snake", "Topete", "Trairamboia",
    "Tropidodryas", "Twig-snake",
  ],
  U: [
    "Urutu-cruzeira", "Urutu-cruzeiro", "Ushant-viper",
  ],
  V: [
    "Verrugosa", "Víbora-cornuda", "Víbora-da-areia", "Víbora-de-escamas-de-serra",
    "Víbora-de-gabão", "Víbora-de-pestana", "Víbora-de-russell", "Víbora-do-gabão",
    "Víbora-do-mar", "Viborão", "Vine snake", "Viper",
    "Vipera", "Voadora",
  ],
  X: [
    "Xenodon", "Xenodonte", "Xenopeltis",
  ],
  Z: [
    "Zamenis", "Zebra-d'água", "Zebra-do-mato", "Zebra-spitting-cobra",
    "Zigzag-viper",
  ],
};
