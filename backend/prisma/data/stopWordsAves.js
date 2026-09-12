// TEMA "AVES"
//
// O tema nasceu da segmentação de "Animais": cerca de 60 aves que estavam
// misturadas com mamíferos foram movidas pra cá. Este arquivo é o reforço.
//
// ⚠️ ERRO CONHECIDO DA SEGMENTAÇÃO: "Xexéu" foi classificado como PEIXE e
// está no tema Peixes. É ave — o japim, pássaro de ninho pendurado. Vale
// apagar de lá pelo painel; aqui ele entra no lugar certo.
//
// IDIOMA: português. Ave tem nome nosso, e quase sempre o nome popular é o
// que a pessoa digita. Os regionais brasileiros são o que faz este tema
// render: acauã, curicaca, suindara, urutau, trinca-ferro.
//
// CRITÉRIO: ave de verdade. Ficam de fora nomes de time ("Corinthians" não
// é ave) e personagens.
//
// SOBRE O HÍFEN: não é preciso cadastrar "bem-te-vi" e "bem te vi" como
// entradas separadas. A normalização do jogo passou a ignorar hífen, espaço
// e apóstrofo (ver normalize() no StopRoom), então as três grafias —
// "bem-te-vi", "bem te vi" e "bemtevi" — valem com uma linha só. Isso vale
// pra TODO o glossário, não só pras aves.
//
// SEGUNDA LISTA (setembro/2026): trouxe muito nome regional brasileiro. O
// que saiu dela: "Bufo" (é sapo), "Pirilampo" (inseto), "Gato-do-mato" e
// "Irará" (mamíferos), "Pequi" e "Manacá" (plantas), e vários que não
// consegui confirmar como ave — "Cherry", "Filipe", "Dardo", "Relógio".
export const AVES_WORDS = {
  A: [
    "Abelharuco", "Abibe", "Acauã", "Açor",
    "Adjutante", "Agapórnis", "Águia-pescadora", "Águia-real",
    "Albatroz-errante", "Alcaravão", "Alcatraz", "Alcatraz-pardo",
    "Alma-de-gato", "Alvéola", "Amazona", "Anambé",
    "Andorinha-do-mar", "Andorinhão", "Anhuma", "Anu-branco",
    "Anu-coroca", "Anu-preto", "Araçari-poca", "Arapaçu",
    "Arapapá", "Araponga", "Arara-azul", "Arara-canindé",
    "Arara-vermelha", "Arenaria", "Ariramba", "Asa-branca",
    "Atobá", "Avestruz-africano", "Avoante", "Azulão",
    "Azulinho",
  ],
  B: [
    "Bacurau", "Bacurau-tesoura", "Balança-rabo", "Barbudo",
    "Bate-bico", "Batuíra", "Beija-flor", "Beija-flor-tesoura",
    "Bem-te-vi-rajado", "Bico-chato", "Bico-de-lacre", "Bico-de-pimenta",
    "Bico-grosso", "Bico-torto", "Bicudinho", "Bicudo",
    "Bigodinho", "Bigodudo", "Biguá", "Biguatinga",
    "Borralhara",
  ],
  C: [
    "Cabeça-seca", "Cabeçudo", "Caboclinho", "Caboclinho-branco",
    "Cacatua", "Cachimbo", "Cambacica", "Cambaxirra",
    "Canário", "Canário-da-terra", "Canela-verde", "Caneleiro",
    "Cantador", "Capitão-de-saíra", "Caracará", "Carão",
    "Cara-pintada", "Carcará", "Cardeal", "Cardeal-do-nordeste",
    "Carijó", "Carpinteiro", "Carrapateiro", "Casaca-de-couro",
    "Chauá", "Chibante", "Choca", "Chopim",
    "Choquinha", "Chororó", "Cigarra", "Cisne",
    "Cisne-negro", "Codorna-buraqueira", "Codorniz", "Coleirinho",
    "Coleiro", "Colhereiro", "Condor", "Corocochó",
    "Corruíra", "Corrupião", "Corujinha", "Cotovia",
    "Crejoá", "Cuco", "Curicaca", "Curió",
  ],
  D: [
    "Dançador", "Dedo-duro", "Dom-fafe", "Dourado-cardeal",
  ],
  E: [
    "Entufado", "Ermitão", "Ermitão-de-barba", "Escrevedeira",
    "Esmerilhão", "Estorninho", "Estrelinha", "Estrelinha-ametista",
  ],
  F: [
    "Falcão-peregrino", "Ferreirinho", "Figuinha", "Fim-fim",
    "Flamingo-chileno", "Formigueiro", "Formigueiro-assobiador", "Franga-d'água",
    "Frango-d'água", "Freirinha", "Fruxu", "Fura-barreira",
  ],
  G: [
    "Gaivotão", "Galinha-d'angola", "Galo-da-serra", "Gansinho",
    "Garça-branca", "Garça-moura", "Garrincha", "Garrinchão",
    "Gaturamo", "Gavião-bombachinha", "Gavião-caboclo", "Gavião-carijó",
    "Gavião-pega-macaco", "Gavião-pombo", "Gavião-real", "Gavião-tesoura",
    "Gaviãozinho", "Gralha-azul", "Graúna", "Grimpeiro",
    "Guaracava", "Guaxe", "Guaxo", "Guriatã",
  ],
  I: [
    "Ibijau", "Inambu-chororó", "Inhambu-chintã", "Inhambuguaçu",
    "Inhapim", "Inhuma", "Inhuma-do-norte", "Ipecu",
    "Irerê",
  ],
  J: [
    "Jaburu-moleque", "Jacamar", "Jacamim", "Jaçanã",
    "Jacu", "Jacupemba", "Jacutinga", "Jandaia",
    "Jandaia-verdadeira", "Jaó", "Japacanim", "Japiim",
    "Japu", "Japuíra", "João-barbudo", "João-bobo",
    "João-corta-pau", "João-grande", "João-pinto", "João-porca",
    "João-teneném", "Juruva", "Juruviara",
  ],
  L: [
    "Lambe-lambe", "Lavadeira", "Lavandeira", "Lenhador",
    "Lenheiro", "Limpa-folha", "Lorito",
  ],
  M: [
    "Maçarico", "Maçarico-de-bico-torto", "Maçarico-real", "Macuco",
    "Macuquinho", "Maitaca", "Maracanã", "Maracanã-verdadeira",
    "Maria-cavaleira", "Maria-é-dia", "Maria-faceira", "Maria-leque",
    "Marianinha", "Maria-preta", "Maria-preta-de-penacho", "Marinheiro",
    "Marreca-ananaí", "Marreca-irerê", "Marreca-piadeira", "Martim-pescador",
    "Mergulhão", "Mexeriqueira", "Miudinho", "Murucututu",
    "Mutum",
  ],
  N: [
    "Nambu", "Nambuguaçu", "Narceja", "Negrinho",
    "Neinei", "Ninfa", "Noivinha", "Noivinha-branca",
  ],
  O: [
    "Olho-de-fogo", "Olho-de-ouro", "Ostraceiro",
  ],
  P: [
    "Papa-arroz", "Papa-capim", "Papa-formiga", "Papagaio-charão",
    "Papagaio-moleiro", "Papagaio-verdadeiro", "Papa-lagarta", "Papa-mosca",
    "Papa-taoca", "Pardela", "Patativa", "Patinho",
    "Pato-do-mato", "Pato-mergulhão", "Pavó", "Pega",
    "Pelicano", "Perdiz", "Periquitão", "Periquito",
    "Pernilongo-do-brejo", "Picaparra", "Pica-pau", "Pica-pau-anão",
    "Pica-pau-do-campo", "Pica-pau-rei", "Pinguim-imperador", "Pintassilgo",
    "Pintassilva", "Piolhinho", "Pipira", "Pipira-preta",
    "Pitiguari", "Poaieiro", "Pomba", "Pomba-galega",
    "Pomba-rola", "Pomba-trocal", "Procne",
  ],
  Q: [
    "Quete",
  ],
  R: [
    "Rabo-branco", "Rabo-de-espinho", "Rabo-de-palha", "Rabo-de-tesoura",
    "Rapazinho", "Rasga-mortalha", "Rendeira", "Rolinha",
    "Rolinha-roxa", "Roxinho",
  ],
  S: [
    "Sabiá-barranco", "Sabiá-branco", "Sabiacica", "Sabiá-coleira",
    "Sabiá-do-campo", "Sabiá-laranjeira", "Sabiá-poca", "Saí-andorinha",
    "Saí-azul", "Saí-canário", "Saíra", "Saíra-amarela",
    "Saíra-sete-cores", "Sangue-de-boi", "Sanhaço", "Sanhaçu",
    "Saracura", "Sebito", "Sericora", "Serrador",
    "Sibite", "Sicalis", "Soldadinho", "Sovi",
    "Suindara", "Suiriri", "Suriri", "Surucuá",
  ],
  T: [
    "Tachã", "Talha-mar", "Tangará", "Tapaculo",
    "Taperuçu", "Tarambola", "Teque-teque", "Tesoura",
    "Tesourão", "Tesoureiro", "Tesourinha", "Tico-tico",
    "Tico-tico-rei", "Tiê", "Tiê-sangue", "Tijuca",
    "Tinguaçu", "Tiriba", "Tiziu", "Topetinho",
    "Tordo", "Torquato", "Trepador", "Trinca-ferro",
    "Tucano-de-bico-verde", "Tucanuçu", "Tuim", "Tuiuiú-grande",
    "Tuquinha",
  ],
  U: [
    "Uirapuru-verdadeiro", "Uru", "Uruaçu", "Urubitinga",
    "Urubu-caçador", "Urubu-de-cabeça-vermelha", "Urubu-rei", "Urutau",
    "Urutaurana",
  ],
  V: [
    "Vaqueiro", "Veste-amarela", "Vira-bosta", "Vira-folha",
    "Vira-pedras", "Viuvinha", "Viuvinha-de-óculos",
  ],
  X: [
    "Xexéu", "Xexéu-preto",
  ],
  Z: [
    "Zoiúdo", "Zorzal",
  ],
};
