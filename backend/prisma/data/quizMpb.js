// MPB — música popular brasileira.
// Importado por: npm run import-mpb
//
// REGRA QUE VALE PRA TODO LOTE (ver o crivo do projeto):
//   - a resposta NÃO pode aparecer no enunciado, nem palavra de 5+ letras
//     dela. "Quem cantou Garota de Ipanema?" -> resposta não pode ser
//     "Garota de Ipanema".
//   - resposta repetida entre perguntas é PERMITIDA. Duas perguntas
//     diferentes podem levar ao mesmo artista — são fatos distintos.
//   - a resposta é a forma que a pessoa DIGITARIA: "Chico Buarque", não
//     "Francisco Buarque de Hollanda".
export const MPB = {
  "mpb": [
    // ===== FÁCIL =====
    { "question": "Qual cantora baiana é conhecida como a Rainha do Axé?", "answer": "Ivete Sangalo", "difficulty": "facil" },
    { "question": "Quem compôs a canção Construção, sobre um operário que cai de um prédio?", "answer": "Chico Buarque", "difficulty": "facil" },
    { "question": "Qual cantor baiano criou o movimento Tropicália junto com Gilberto Gil?", "answer": "Caetano Veloso", "difficulty": "facil" },
    { "question": "Qual cantora mineira ficou conhecida como a maior voz do Brasil e morreu em 1982?", "answer": "Elis Regina", "difficulty": "facil" },
    { "question": "Quem é o maestro autor de Garota de Ipanema?", "answer": "Tom Jobim", "difficulty": "facil" },
    { "question": "Qual banda de Salvador tem Samuel Rosa como vocalista?", "answer": "Skank", "difficulty": "facil" },
    { "question": "Qual cantor pernambucano liderou o movimento manguebeat e morreu em 1997?", "answer": "Chico Science", "difficulty": "facil" },
    { "question": "Quem gravou o disco Acústico MTV com a música O Sol?", "answer": "Jota Quest", "difficulty": "facil" },
    { "question": "Qual cantora carioca ficou famosa com Maria Maria e Cálice ao lado de nomes da MPB?", "answer": "Milton Nascimento", "difficulty": "facil" },
    { "question": "Qual sanfoneiro pernambucano é chamado de Rei do Baião?", "answer": "Luiz Gonzaga", "difficulty": "facil" },
    { "question": "Quem canta a música Trem das Onze, clássico do samba paulista?", "answer": "Adoniran Barbosa", "difficulty": "facil" },
    { "question": "Qual cantor e compositor baiano escreveu Refazenda e Aquele Abraço?", "answer": "Gilberto Gil", "difficulty": "facil" },
    { "question": "Qual grupo carioca revelou Zeca Pagodinho e renovou o samba nos anos 80?", "answer": "Fundo de Quintal", "difficulty": "facil" },
    { "question": "Qual cantora é conhecida como Pequena Notável e gravou Taí?", "answer": "Carmen Miranda", "difficulty": "facil" },
    { "question": "Quem canta Codinome Beija-Flor e Ideologia?", "answer": "Cazuza", "difficulty": "facil" },
    { "question": "Qual compositor é autor do samba Aquarela do Brasil?", "answer": "Ary Barroso", "difficulty": "facil" },
    { "question": "Qual cantora paulista ficou famosa com Olhos Coloridos?", "answer": "Sandra de Sa", "difficulty": "facil" },
    { "question": "Quem é o autor de Asa Branca junto com Humberto Teixeira?", "answer": "Luiz Gonzaga", "difficulty": "facil" },
    { "question": "Qual cantor mineiro é conhecido pela voz aguda e pelo Clube da Esquina?", "answer": "Milton Nascimento", "difficulty": "facil" },
    { "question": "Qual estilo brasileiro nasceu na praia do Rio nos anos 50 com violão e voz baixa?", "answer": "Bossa Nova", "difficulty": "facil" },

    // ===== MÉDIO =====
    { "question": "Qual violonista é considerado o criador da batida da bossa nova?", "answer": "Joao Gilberto", "difficulty": "medio" },
    { "question": "Qual poeta e diplomata escreveu a letra de Chega de Saudade?", "answer": "Vinicius de Moraes", "difficulty": "medio" },
    { "question": "Qual cantora gravou o clássico Águas de Março em dueto com o compositor da canção?", "answer": "Elis Regina", "difficulty": "medio" },
    { "question": "Qual trio reuniu Marisa Monte, Arnaldo Antunes e Carlinhos Brown em 2002?", "answer": "Tribalistas", "difficulty": "medio" },
    { "question": "Qual compositor carioca escreveu Carinhoso, um dos maiores clássicos do choro?", "answer": "Pixinguinha", "difficulty": "medio" },
    { "question": "Qual cantora baiana gravou Beija Eu e integrou os Tribalistas?", "answer": "Marisa Monte", "difficulty": "medio" },
    { "question": "Qual banda de Recife lançou o disco Da Lama ao Caos?", "answer": "Nacao Zumbi", "difficulty": "medio" },
    { "question": "Qual cantor gaúcho escreveu Mente Que Eu Gosto e integrou os Engenheiros?", "answer": "Humberto Gessinger", "difficulty": "medio" },
    { "question": "Qual sambista carioca ficou conhecido como Poeta da Vila?", "answer": "Noel Rosa", "difficulty": "medio" },
    { "question": "Qual cantora nordestina é conhecida como a Rainha do Forró?", "answer": "Elba Ramalho", "difficulty": "medio" },
    { "question": "Qual compositor baiano escreveu Andar com Fé?", "answer": "Gilberto Gil", "difficulty": "medio" },
    { "question": "Qual cantor foi vocalista do Barão Vermelho antes da carreira solo?", "answer": "Cazuza", "difficulty": "medio" },
    { "question": "Qual sambista é autor de Volta por Cima?", "answer": "Paulo Vanzolini", "difficulty": "medio" },
    { "question": "Qual banda mineira gravou Por Enquanto e Inverno?", "answer": "Legiao Urbana", "difficulty": "medio" },
    { "question": "Qual cantor pernambucano canta Anunciação?", "answer": "Alceu Valenca", "difficulty": "medio" },
    { "question": "Qual sambista carioca ficou famoso com Deixa a Vida Me Levar?", "answer": "Zeca Pagodinho", "difficulty": "medio" },
    { "question": "Qual cantora e compositora é autora de Tigresa e integrou a Tropicália?", "answer": "Gal Costa", "difficulty": "medio" },
    { "question": "Qual banda paulista tem Rita Lee como fundadora?", "answer": "Os Mutantes", "difficulty": "medio" },
    { "question": "Qual cantor mineiro lançou Encontros e Despedidas?", "answer": "Milton Nascimento", "difficulty": "medio" },
    { "question": "Qual compositor escreveu Apesar de Você durante a ditadura militar?", "answer": "Chico Buarque", "difficulty": "medio" },

    // ===== DIFÍCIL =====
    { "question": "Qual maestro e arranjador assinou os arranjos do disco Elis & Tom?", "answer": "Claus Ogerman", "difficulty": "dificil" },
    { "question": "Qual disco de 1972 reuniu Milton Nascimento e Lô Borges com capa de meninos na estrada?", "answer": "Clube da Esquina", "difficulty": "dificil" },
    { "question": "Qual compositor carioca escreveu O Trenzinho do Caipira em obra erudita brasileira?", "answer": "Villa Lobos", "difficulty": "dificil" },
    { "question": "Qual cantora foi a primeira brasileira indicada ao Grammy, nos anos 60?", "answer": "Astrud Gilberto", "difficulty": "dificil" },
    { "question": "Qual letrista assinou Travessia com Milton Nascimento?", "answer": "Fernando Brant", "difficulty": "dificil" },
    { "question": "Qual sambista é autor de Ouro de Tolo, gravada em 1973?", "answer": "Raul Seixas", "difficulty": "dificil" },
    { "question": "Qual compositor paulista assina Sampa, homenagem à capital?", "answer": "Caetano Veloso", "difficulty": "dificil" },
    { "question": "Qual movimento musical de 1968 misturou guitarra elétrica com cultura brasileira?", "answer": "Tropicalia", "difficulty": "dificil" },
    { "question": "Qual violonista carioca é chamado de pai do choro moderno e tocava flauta?", "answer": "Pixinguinha", "difficulty": "dificil" },
    { "question": "Qual cantora gravou Maria Maria e Nos Bailes da Vida em parceria com Milton?", "answer": "Elis Regina", "difficulty": "dificil" },
    { "question": "Qual parceiro escreveu as letras de grande parte das canções de Tom Jobim?", "answer": "Vinicius de Moraes", "difficulty": "dificil" },
    { "question": "Qual banda de Brasília lançou o disco Dois em 1986?", "answer": "Legiao Urbana", "difficulty": "dificil" },
    { "question": "Qual compositor escreveu Detalhes e Como Vai Você?", "answer": "Roberto Carlos", "difficulty": "dificil" },
    { "question": "Qual cantora baiana gravou o álbum Domingo com João Gilberto em 1967?", "answer": "Gal Costa", "difficulty": "dificil" },
    { "question": "Qual compositor mineiro é autor de Nos Bailes da Vida junto com Fernando Brant?", "answer": "Milton Nascimento", "difficulty": "dificil" },
  ],
};
