// IDIOMA DAS PALAVRAS, POR TEMA
//
// Este arquivo não é lido por código nenhum — é uma referência pra quem
// escrever lotes novos de palavra. Existe porque a regra muda de tema pra
// tema e isso já causou retrabalho: um lote de "Animais" saiu com "ibex",
// "zorro" e "quokka", que ninguém digitaria numa rodada em português.
//
// A pergunta que decide é sempre a mesma:
//   "O jogador brasileiro, na pressa da rodada, escreveria ISSO?"
//
//
// ===== TEMAS QUE PEDEM PORTUGUÊS =====
//
// Animais, Frutas, Cores, Objetos, Partes do corpo, Profissões, Comidas,
// Cidade/Estado/País, Nomes de pessoa.
//
// O nome estrangeiro existe, mas não é o que se digita: "cabra-montês" e não
// "ibex", "raposa" e não "zorro", "gambá" e não "skunk". Aceitar o
// estrangeirismo não ajuda ninguém e ainda infla a contagem do tema.
//
// Exceção natural: nome estrangeiro que virou o nome corrente aqui.
// "Hamster" e "Narval" são isso — não existe alternativa em português que
// alguém use de verdade.
//
//
// ===== TEMAS QUE ACEITAM ESTRANGEIRO =====
//
// Estilos Musicais, Games, Anime e HQ, Filmes e Séries, Marcas, Carros.
//
// Aqui o nome estrangeiro É o nome. Ninguém escreve "casa" para House, nem
// "bola de fogo" para Fireball. Nesses temas vale o contrário: incluir
// AMBAS as formas quando as duas circulam, porque a validação é exata e
// cada forma ausente é um ponto perdido à toa.
//
//   "Cavaleiros do Zodíaco" E "Saint Seiya"
//   "Homem-Aranha" E "Spider-Man"
//   "Música Popular Brasileira" E "MPB"
//
//
// ===== VALE PRA TODOS =====
//
// - Só as 23 letras do sorteio (K, W e Y não saem)
// - Nada de termo técnico que ninguém digita ("isópode", "quelônio")
// - Nada de nome inventado pra encher letra difícil — letra magra e honesta
//   é melhor que glossário que valida palavra falsa pra sempre
// - Nada de raça, marca ou subtipo quando o tema pede a categoria
// As chaves abaixo são as REAIS do banco (conferidas no seed.js). Escrever
// chave inventada aqui tornaria este documento inútil na hora de usar.
export const IDIOMA_POR_TEMA = {
  portugues: [
    "animais",
    "frutas",
    "cor",
    "profissao",
    "bebida",
    "verbos",
    "nomes_pessoas",
    "cep",                    // Cidade, Estado, País
    "ossos_corpo_humano",
    "elementos_quimicos",
    "gentilico_paises",
    "idiomas",
    "ensino_superior",
    "instrumentos_musicais",
    "esportes",
    "comida_estranha",
    "apelido",
  ],
  aceitaEstrangeiro: [
    "estilosMusicais",
    "games",
    "animeHq",
    "filmes",
    "novelas_series",
    "carros",
    "bandas_musicais",
    "times_futebol",          // Manchester, Liverpool, Bayern
    "raca_cachorro",          // pinscher, poodle, shih tzu
    "meme_internet",
  ],
};

// FORA DESTA CONTA: os temas da Sala da Zoeira (coisa_da_sogra,
// coisas_todo_mundo_odeia, motivo_termino, coisas_pegam_fogo,
// grito_de_torcida). Eles não têm glossário — a Zoeira não pontua e quem
// julga é a própria mesa —, então não há palavra a cadastrar neles.
