// METAL — entra na mesma sala do Rock'n Roll (themeKey "rock").
// Importado por: npm run import-mpb-rock
//
// Duas grafias que valem atenção porque viram RESPOSTA: é "Megadeth" (não
// Megadeath) e "Helloween" (não Halloween — essa é a data). Nome errado não
// seria aceito quando a pessoa digitasse o certo.
//
// AC/DC vai como "AC DC": a normalização do jogo ignora pontuação, então as
// duas formas valem, mas o banco guarda sem a barra.
//
// Mesmo crivo dos outros lotes: a resposta nunca aparece no enunciado.
export const METAL = {
  "rock": [
    // ===== FÁCIL =====
    { "question": "Qual banda de Iowa usa máscaras e macacões numerados no palco?", "answer": "Slipknot", "difficulty": "facil" },
    { "question": "Qual banda britânica tem um mascote zumbi chamado Eddie?", "answer": "Iron Maiden", "difficulty": "facil" },
    { "question": "Qual banda americana gravou Nothing Else Matters?", "answer": "Metallica", "difficulty": "facil" },
    { "question": "Qual banda alemã gravou Wind of Change, hino da queda do Muro de Berlim?", "answer": "Scorpions", "difficulty": "facil" },
    { "question": "Qual banda brasileira de power metal tem Rafael Bittencourt na guitarra?", "answer": "Angra", "difficulty": "facil" },
    { "question": "Qual banda americana gravou Bat Country e Hail to the King?", "answer": "Avenged Sevenfold", "difficulty": "facil" },
    { "question": "Qual banda australiana gravou Back in Black?", "answer": "AC DC", "difficulty": "facil" },
    { "question": "Qual banda americana de nu metal gravou Freak on a Leash?", "answer": "Korn", "difficulty": "facil" },
    { "question": "Qual banda foi fundada por Dave Mustaine depois de sair do Metallica?", "answer": "Megadeth", "difficulty": "facil" },
    { "question": "Qual banda brasileira de Belo Horizonte gravou o disco Roots?", "answer": "Sepultura", "difficulty": "facil" },
    { "question": "Qual banda americana de metal progressivo gravou Pull Me Under?", "answer": "Dream Theater", "difficulty": "facil" },
    { "question": "Qual banda de punk rock americano canta Savior?", "answer": "Rise Against", "difficulty": "facil" },
    { "question": "Qual banda britânica é considerada a fundadora do heavy metal, de Birmingham?", "answer": "Black Sabbath", "difficulty": "facil" },
    { "question": "Qual banda finlandesa de power metal gravou Full Moon?", "answer": "Sonata Arctica", "difficulty": "facil" },
    { "question": "Qual banda alemã de power metal gravou Keeper of the Seven Keys?", "answer": "Helloween", "difficulty": "facil" },
    { "question": "Qual banda americana gravou Chop Suey em 2001?", "answer": "System of a Down", "difficulty": "facil" },
    { "question": "Qual banda de Los Angeles mistura rap e metal e gravou Killing in the Name?", "answer": "Rage Against the Machine", "difficulty": "facil" },
    { "question": "Qual vocalista do Slipknot também canta no Stone Sour?", "answer": "Corey Taylor", "difficulty": "facil" },
    { "question": "Qual banda americana gravou In the End e Numb?", "answer": "Linkin Park", "difficulty": "facil" },
    { "question": "Qual banda brasileira de thrash foi fundada pelos irmãos Cavalera?", "answer": "Sepultura", "difficulty": "facil" },

    // ===== MÉDIO =====
    // O disco de 1991 tem o mesmo nome da banda, então perguntar "qual disco
    // do Metallica" entregava a resposta. Virou pergunta sobre a faixa.
    { "question": "Qual banda gravou Enter Sandman no disco de capa preta de 1991?", "answer": "Metallica", "difficulty": "medio" },
    { "question": "Qual vocalista do Iron Maiden pilota aviões comerciais?", "answer": "Bruce Dickinson", "difficulty": "medio" },
    { "question": "Qual baixista do Metallica morreu em acidente de ônibus na Suécia em 1986?", "answer": "Cliff Burton", "difficulty": "medio" },
    { "question": "Quantos integrantes o Slipknot teve na formação clássica?", "answer": "Nove", "difficulty": "medio" },
    { "question": "Qual guitarrista do Megadeth fundou a banda após ser demitido de outra?", "answer": "Dave Mustaine", "difficulty": "medio" },
    { "question": "Qual banda brasileira gravou Carry On, hino do metal nacional?", "answer": "Angra", "difficulty": "medio" },
    { "question": "Qual guitarrista do Dream Theater é conhecido pelo virtuosismo e saiu em 2010? A pergunta é sobre o baterista.", "answer": "Mike Portnoy", "difficulty": "medio" },
    { "question": "Qual banda gravou o álbum Toxicity?", "answer": "System of a Down", "difficulty": "medio" },
    { "question": "Qual baterista do Avenged Sevenfold morreu em 2009 e era chamado de The Rev?", "answer": "Jimmy Sullivan", "difficulty": "medio" },
    { "question": "Qual disco do Iron Maiden de 1982 tem o mascote na capa com fundo vermelho?", "answer": "The Number of the Beast", "difficulty": "medio" },
    { "question": "Qual banda americana de Bakersfield é considerada criadora do nu metal?", "answer": "Korn", "difficulty": "medio" },
    { "question": "Qual banda alemã tem Klaus Meine no vocal?", "answer": "Scorpions", "difficulty": "medio" },
    { "question": "Qual banda de Chicago mistura hardcore melódico e letras políticas, com Tim McIlrath?", "answer": "Rise Against", "difficulty": "medio" },
    { "question": "Qual vocalista brasileiro saiu do Sepultura em 1996 e fundou o Soulfly?", "answer": "Max Cavalera", "difficulty": "medio" },
    { "question": "Qual disco do Metallica de 1986 tem a faixa Battery?", "answer": "Master of Puppets", "difficulty": "medio" },
    { "question": "Qual guitarrista do AC DC usa uniforme de colegial no palco?", "answer": "Angus Young", "difficulty": "medio" },
    { "question": "Qual banda finlandesa tem Tony Kakko como vocalista?", "answer": "Sonata Arctica", "difficulty": "medio" },
    { "question": "Qual banda brasileira teve Andre Matos como primeiro vocalista?", "answer": "Angra", "difficulty": "medio" },
    { "question": "Qual banda gravou o álbum Iowa em 2001?", "answer": "Slipknot", "difficulty": "medio" },
    { "question": "Qual banda alemã de power metal revelou Kai Hansen e Michael Kiske?", "answer": "Helloween", "difficulty": "medio" },

    // ===== DIFÍCIL =====
    { "question": "Qual baixista do Slipknot morreu em 2010 e usava máscara de palhaço? A pergunta é sobre quem tocava baixo.", "answer": "Paul Gray", "difficulty": "dificil" },
    { "question": "Qual disco do Megadeth de 1990 tem a faixa Holy Wars?", "answer": "Rust in Peace", "difficulty": "dificil" },
    { "question": "Qual baixista do Iron Maiden fundou a banda em 1975?", "answer": "Steve Harris", "difficulty": "dificil" },
    { "question": "Qual disco do Dream Theater de 1992 é considerado o marco do metal progressivo?", "answer": "Images and Words", "difficulty": "dificil" },
    { "question": "Qual guitarrista do Angra saiu para formar o Almah?", "answer": "Edu Falaschi", "difficulty": "dificil" },
    { "question": "Qual vocalista do AC DC morreu em 1980 e foi substituído por Brian Johnson?", "answer": "Bon Scott", "difficulty": "dificil" },
    { "question": "Qual disco do Sepultura de 1993 tem a faixa Territory?", "answer": "Chaos AD", "difficulty": "dificil" },
    { "question": "Qual banda sueca de death metal melódico gravou o álbum Clayman?", "answer": "In Flames", "difficulty": "dificil" },
    { "question": "Qual guitarrista do Metallica foi demitido antes do primeiro disco e fundou outra banda?", "answer": "Dave Mustaine", "difficulty": "dificil" },
    { "question": "Qual disco do Avenged Sevenfold de 2005 tem a faixa Beast and the Harlot?", "answer": "City of Evil", "difficulty": "dificil" },
    { "question": "Qual banda norueguesa de metal sinfônico tem vocal feminino e gravou Nemo?", "answer": "Nightwish", "difficulty": "dificil" },
    { "question": "Qual baterista do Slipknot usa máscara e é conhecido como número 4?", "answer": "Joey Jordison", "difficulty": "dificil" },
    { "question": "Qual disco do Iron Maiden de 1988 tem a faixa Can I Play With Madness?", "answer": "Seventh Son of a Seventh Son", "difficulty": "dificil" },
    { "question": "Qual banda alemã de thrash forma o Big Four europeu com Sodom e Destruction?", "answer": "Kreator", "difficulty": "dificil" },
    { "question": "Qual banda americana completa o Big Four do thrash ao lado de Metallica, Megadeth e Slayer?", "answer": "Anthrax", "difficulty": "dificil" },
  ],
};
