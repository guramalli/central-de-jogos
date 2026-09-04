// Terceirão — lote para a sala AVANÇADA (dificuldade "dificil").
//
// MOTIVO: a sala tinha 203 perguntas e ciclo de 28 segundos — 1h34 até
// repetir, entre as piores do Quiz. E é o tema com apelo educacional, o que
// abre porta para parcerias com professores e cursinhos.
//
// LACUNAS IDENTIFICADAS na lista das 201 respostas existentes:
//   Bem cobertos  → Física (cinemática, eletricidade, termo), Química
//                   (ligações, termoquímica, orgânica), Matemática
//                   (geometria, PA/PG, trigonometria), Genética mendeliana,
//                   Literatura do romantismo ao modernismo, Filosofia
//                   (Kant, Sartre, Beauvoir), Sociologia clássica.
//   Descobertos   → Geografia FÍSICA (clima, relevo, solo, hidrografia),
//                   História antiga e medieval, Brasil colonial, Ecologia,
//                   Evolução, Botânica, Microbiologia, Gramática e sintaxe,
//                   Estatística e probabilidade, Matrizes e logaritmos,
//                   Óptica, Radioatividade, Eletroquímica, Vanguardas
//                   europeias, Arte brasileira.
//
// REGRA APLICADA (corrigida): o que não pode repetir é a PERGUNTA.
// Resposta igual a outra já existente é permitida — perguntas diferentes
// podem legitimamente levar ao mesmo lugar. Nenhuma resposta foi distorcida
// para "passar no crivo": se o fato natural já estava coberto, escolhi outro
// fato em vez de maquiar.
//
// Importado por:
//   npm run importar-checado -- quizTerceiraoAvancado.js TERCEIRAO_AVANCADO
export const TERCEIRAO_AVANCADO = {
  terceirao: [
    // ===== Geografia física =====
    { question: "Qual tipo climático predomina no interior do Nordeste brasileiro, marcado por chuvas escassas e irregulares?", answer: "Semiárido", difficulty: "dificil" },
    { question: "Qual fenômeno de aquecimento anômalo das águas do Pacífico altera o regime de chuvas no Brasil?", answer: "El Niño", difficulty: "dificil" },
    { question: "Qual o nome do fenômeno oposto ao aquecimento anômalo do Pacífico, marcado pelo resfriamento das águas?", answer: "La Niña", difficulty: "dificil" },
    { question: "Qual tipo de solo escuro e fértil, comum no Paraná, é formado pela decomposição de rochas basálticas?", answer: "Terra roxa", difficulty: "dificil" },
    { question: "Como é chamado o processo de perda da camada fértil do solo pela ação da água ou do vento?", answer: "Erosão", difficulty: "dificil" },
    { question: "Qual rio brasileiro tem a maior vazão de água do mundo?", answer: "Rio Amazonas", difficulty: "dificil" },
    { question: "Qual tipo de precipitação resulta do encontro entre massas de ar quentes e frias?", answer: "Frontal", difficulty: "dificil" },
    { question: "Que tipo de precipitação ocorre quando o ar úmido sobe por uma encosta e se resfria?", answer: "Orográfica", difficulty: "dificil" },
    { question: "Qual formação vegetal brasileira é considerada a savana mais rica em biodiversidade do mundo?", answer: "Cerrado", difficulty: "dificil" },
    { question: "Como se chama o processo de transformação de áreas em desertos por degradação do solo?", answer: "Desertificação", difficulty: "dificil" },
    { question: "Qual camada da atmosfera concentra o gás que filtra a radiação ultravioleta?", answer: "Estratosfera", difficulty: "dificil" },
    { question: "Qual massa de água quente do Atlântico Norte ameniza o clima da Europa Ocidental?", answer: "Gulf Stream", difficulty: "dificil" },
    { question: "Qual o nome do relevo formado pelo desgaste de terrenos antigos, comum no Brasil Central?", answer: "Planalto", difficulty: "dificil" },
    { question: "Qual agente do relevo é responsável pela formação de dunas em regiões litorâneas e áridas?", answer: "Vento", difficulty: "dificil" },

    // ===== História antiga e medieval =====
    { question: "Qual sistema político da Grécia Antiga permitia a participação direta dos cidadãos nas decisões?", answer: "Democracia ateniense", difficulty: "dificil" },
    { question: "Qual conjunto de leis romanas foi compilado no século VI por ordem de Justiniano?", answer: "Corpus Juris Civilis", difficulty: "dificil" },
    { question: "Qual sistema econômico e social medieval baseava-se na relação entre senhor e servo em torno da terra?", answer: "Feudalismo", difficulty: "dificil" },
    { question: "Como era chamada a porção de terra do feudo cultivada exclusivamente para o senhor?", answer: "Manso senhorial", difficulty: "dificil" },
    { question: "Qual movimento militar e religioso levou europeus ao Oriente Médio entre os séculos XI e XIII?", answer: "Cruzadas", difficulty: "dificil" },
    { question: "Qual epidemia dizimou um terço da população europeia no século XIV?", answer: "Peste bubônica", difficulty: "dificil" },
    { question: "Qual documento de 1215 limitou os poderes do rei inglês frente aos nobres?", answer: "Magna Carta", difficulty: "dificil" },
    { question: "Qual cidade foi a capital da porção oriental do mundo romano após a divisão?", answer: "Constantinopla", difficulty: "dificil" },
    { question: "Qual movimento cultural europeu dos séculos XV e XVI retomou os valores da Antiguidade Clássica?", answer: "Renascimento", difficulty: "dificil" },
    { question: "Em qual cidade alemã Lutero afixou suas 95 teses, em 1517?", answer: "Wittenberg", difficulty: "dificil" },
    { question: "Como ficou conhecida a resposta organizada da Igreja Católica ao avanço protestante?", answer: "Contrarreforma", difficulty: "dificil" },

    // ===== Brasil colonial e império =====
    { question: "Qual sistema de exploração da cana no Nordeste colonial combinava monocultura, latifúndio e escravidão?", answer: "Plantation", difficulty: "dificil" },
    { question: "Qual foi o primeiro sistema de administração territorial adotado por Portugal no Brasil, em 1534?", answer: "Capitanias hereditárias", difficulty: "dificil" },
    { question: "Qual documento concedia ao donatário o direito de posse sobre a terra na colônia?", answer: "Carta de doação", difficulty: "dificil" },
    { question: "Qual movimento de resistência de africanos escravizados formou comunidades autônomas no interior?", answer: "Quilombos", difficulty: "dificil" },
    { question: "Qual foi o maior quilombo da história do Brasil, localizado na atual Alagoas?", answer: "Palmares", difficulty: "dificil" },
    { question: "Qual expedição colonial percorria o interior em busca de riquezas e de indígenas para escravizar?", answer: "Bandeiras", difficulty: "dificil" },
    { question: "Qual imposto cobrado sobre a produção de ouro no século XVIII gerou revolta em Minas Gerais?", answer: "Quinto", difficulty: "dificil" },
    { question: "Qual cobrança forçada de impostos atrasados provocou a Inconfidência Mineira?", answer: "Derrama", difficulty: "dificil" },
    { question: "Qual acordo de 1494 dividiu as terras descobertas entre Portugal e Espanha?", answer: "Tratado de Tordesilhas", difficulty: "dificil" },
    { question: "Qual lei de 1850 proibiu definitivamente o tráfico de africanos escravizados para o Brasil?", answer: "Lei Eusébio de Queirós", difficulty: "dificil" },
    { question: "Qual lei de 1885 concedeu liberdade aos escravizados com mais de sessenta anos?", answer: "Lei dos Sexagenários", difficulty: "dificil" },

    // ===== Ecologia e evolução =====
    { question: "Como é chamada a relação em que os dois organismos envolvidos são beneficiados e dependem um do outro?", answer: "Mutualismo", difficulty: "dificil" },
    { question: "Como é chamada a relação em que um organismo se beneficia sem prejudicar o outro?", answer: "Comensalismo", difficulty: "dificil" },
    { question: "Como é chamado o conjunto de todos os seres vivos de uma mesma espécie numa área?", answer: "População", difficulty: "dificil" },
    { question: "Como é chamado o papel que uma espécie desempenha dentro do ecossistema?", answer: "Nicho ecológico", difficulty: "dificil" },
    { question: "Qual fenômeno descreve o acúmulo crescente de poluentes ao longo da cadeia alimentar?", answer: "Magnificação trófica", difficulty: "dificil" },
    { question: "Qual naturalista inglês propôs a seleção natural como mecanismo da evolução?", answer: "Darwin", difficulty: "dificil" },
    { question: "Qual naturalista francês defendeu a herança dos caracteres adquiridos, hipótese depois refutada?", answer: "Lamarck", difficulty: "dificil" },
    { question: "Como é chamada a semelhança entre estruturas de origem embrionária comum, como o braço humano e a asa do morcego?", answer: "Órgãos homólogos", difficulty: "dificil" },
    { question: "Como é chamada a semelhança entre estruturas de função igual mas origens diferentes, como a asa do inseto e a da ave?", answer: "Órgãos análogos", difficulty: "dificil" },
    { question: "Qual teoria integra as ideias de seleção natural com os conhecimentos de genética?", answer: "Neodarwinismo", difficulty: "dificil" },

    // ===== Botânica e microbiologia =====
    { question: "Qual tecido vegetal conduz a seiva bruta da raiz até as folhas?", answer: "Xilema", difficulty: "dificil" },
    { question: "Qual tecido vegetal transporta a seiva elaborada produzida nas folhas?", answer: "Floema", difficulty: "dificil" },
    { question: "Qual estrutura da folha regula a entrada de gases e a perda de água pela planta?", answer: "Estômato", difficulty: "dificil" },
    { question: "Qual hormônio vegetal é responsável pelo crescimento em direção à luz?", answer: "Auxina", difficulty: "dificil" },
    { question: "Qual grupo de plantas possui sementes protegidas dentro de frutos?", answer: "Angiospermas", difficulty: "dificil" },
    { question: "Qual grupo vegetal tem sementes nuas, sem fruto, como os pinheiros?", answer: "Gimnospermas", difficulty: "dificil" },
    { question: "Qual estrutura os vírus utilizam para se reproduzir, já que não possuem metabolismo próprio?", answer: "Célula hospedeira", difficulty: "dificil" },
    { question: "Qual processo bacteriano permite a troca de material genético por meio de uma ponte citoplasmática?", answer: "Conjugação", difficulty: "dificil" },
    { question: "Qual reino agrupa organismos como cogumelos e leveduras, decompositores por natureza?", answer: "Fungi", difficulty: "dificil" },

    // ===== Gramática e sintaxe =====
    { question: "Qual termo da oração indica a quem ou ao que se refere a ação, ligado ao verbo sem preposição?", answer: "Objeto direto", difficulty: "dificil" },
    { question: "Qual termo da oração complementa o verbo por meio de uma preposição obrigatória?", answer: "Objeto indireto", difficulty: "dificil" },
    { question: "Como é chamada a oração que exerce a função de sujeito da oração principal?", answer: "Subordinada subjetiva", difficulty: "dificil" },
    { question: "Qual termo da oração determina a flexão do verbo em número e pessoa?", answer: "Sujeito", difficulty: "dificil" },
    { question: "Como é chamado o processo de formação de palavras que une dois radicais, como em passatempo?", answer: "Composição", difficulty: "dificil" },
    { question: "Como é chamado o processo que forma palavras acrescentando afixos a um radical?", answer: "Derivação", difficulty: "dificil" },
    { question: "Qual figura consiste em atribuir características humanas a seres inanimados?", answer: "Prosopopeia", difficulty: "dificil" },
    { question: "Qual figura de linguagem exagera intencionalmente uma ideia para dar ênfase?", answer: "Hipérbole", difficulty: "dificil" },
    { question: "Qual vício de linguagem consiste na repetição desnecessária de uma mesma ideia?", answer: "Pleonasmo", difficulty: "dificil" },
    { question: "Como é chamada a diferença no modo de falar entre habitantes de regiões distintas?", answer: "Regionalismo", difficulty: "dificil" },

    // ===== Estatística, probabilidade e álgebra =====
    { question: "Qual medida estatística representa o valor central de um conjunto ordenado de dados?", answer: "Mediana", difficulty: "dificil" },
    { question: "Qual medida estatística indica o valor que aparece com maior frequência num conjunto?", answer: "Moda", difficulty: "dificil" },
    { question: "Qual medida indica o quanto os dados de um conjunto se afastam da média?", answer: "Desvio padrão", difficulty: "dificil" },
    { question: "Qual nome recebe a matriz quadrada com números um na diagonal principal e zeros no resto?", answer: "Identidade", difficulty: "dificil" },
    { question: "Qual operação transforma as linhas de uma matriz em colunas?", answer: "Transposição", difficulty: "dificil" },
    { question: "Qual é o valor do logaritmo de um número na sua própria base?", answer: "Igual a um", difficulty: "dificil" },
    { question: "Em que operação se transforma a multiplicação quando aplicamos logaritmo aos fatores?", answer: "Adição", difficulty: "dificil" },
    { question: "Como é chamado o conjunto de valores que uma função pode assumir como saída?", answer: "Imagem", difficulty: "dificil" },
    { question: "Qual é o formato do gráfico de uma função do segundo grau no plano cartesiano?", answer: "Parábola", difficulty: "dificil" },
    { question: "Qual operação se usa para calcular a chance de dois acontecimentos ocorrerem juntos?", answer: "Multiplicação", difficulty: "dificil" },

    // ===== Óptica, radioatividade e eletroquímica =====
    { question: "Qual fenômeno óptico ocorre quando a luz muda de direção ao passar de um meio para outro?", answer: "Refração", difficulty: "dificil" },
    { question: "Qual defeito de visão ocorre quando a imagem se forma antes da retina?", answer: "Miopia", difficulty: "dificil" },
    { question: "Qual defeito de visão faz a imagem se formar depois da retina, dificultando enxergar de perto?", answer: "Hipermetropia", difficulty: "dificil" },
    { question: "Qual elemento químico corresponde ao núcleo emitido na radiação alfa?", answer: "Hélio", difficulty: "dificil" },
    { question: "Como é chamado o tempo necessário para que metade dos átomos de uma amostra radioativa se desintegre?", answer: "Meia-vida", difficulty: "dificil" },
    { question: "Qual elemento químico é usado como combustível nas usinas atômicas brasileiras?", answer: "Urânio", difficulty: "dificil" },
    { question: "Qual reação une núcleos leves de hidrogênio e mantém as estrelas brilhando?", answer: "Fusão", difficulty: "dificil" }, { question: "Qual elemento é o principal combustível das estrelas como o Sol?", answer: "Hidrogênio", difficulty: "dificil" },
    { question: "Em uma pilha, qual eletrodo sofre oxidação e libera elétrons?", answer: "Ânodo", difficulty: "dificil" },
    { question: "Em uma pilha, qual eletrodo recebe os elétrons e sofre redução?", answer: "Cátodo", difficulty: "dificil" },
    { question: "Qual processo usa corrente elétrica para provocar uma reação química não espontânea?", answer: "Eletrólise", difficulty: "dificil" },

    // ===== Arte e vanguardas =====
    { question: "Qual vanguarda europeia representava objetos decompostos em formas geométricas?", answer: "Cubismo", difficulty: "dificil" },
    { question: "Qual vanguarda exaltava a velocidade, a máquina e a modernidade industrial?", answer: "Futurismo", difficulty: "dificil" },
    { question: "Qual vanguarda buscava expressar o mundo dos sonhos e do inconsciente?", answer: "Surrealismo", difficulty: "dificil" },
    { question: "Qual vanguarda nasceu como negação da própria arte, em plena Primeira Guerra?", answer: "Dadaísmo", difficulty: "dificil" },
    { question: "Qual pintora brasileira é autora do quadro Abaporu, símbolo do modernismo nacional?", answer: "Tarsila do Amaral", difficulty: "dificil" },
    { question: "Qual evento de 1922 em São Paulo marcou o início do modernismo brasileiro?", answer: "Semana de Arte Moderna", difficulty: "dificil" },
    { question: "Qual arquiteto brasileiro projetou os principais prédios públicos de Brasília?", answer: "Oscar Niemeyer", difficulty: "dificil" },
    { question: "Qual pintor brasileiro retratou operários e a vida urbana em obras como Os Retirantes?", answer: "Portinari", difficulty: "dificil" },
  ],
};
