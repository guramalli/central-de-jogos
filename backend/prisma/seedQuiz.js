// Seed do banco de perguntas do Quiz. Roda separado do seed principal
// (npm run prisma:seed:quiz), pra não misturar com os temas/palavras do Stop.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const QUESTIONS = {
  esportes: [
    { question: "Em que esporte se usa uma raquete e uma peteca?", answer: "Badminton" },
    { question: "Qual país sediou a Copa do Mundo de 2014?", answer: "Brasil" },
    { question: "Quantos jogadores um time de futebol tem em campo?", answer: "Onze" },
    { question: "Qual é o esporte mais popular do mundo?", answer: "Futebol" },
    { question: "Em que esporte Michael Jordan é uma lenda?", answer: "Basquete" },
    { question: "Quantos tempos tem uma partida de futebol?", answer: "Dois" },
    { question: "Em que cidade brasileira aconteceram as Olimpíadas de 2016?", answer: "Rio de Janeiro" },
    { question: "Qual esporte é jogado numa quadra com rede alta, sem a bola tocar o chão?", answer: "Volei" },
    { question: "Qual é o principal troféu do futebol mundial, disputado a cada 4 anos?", answer: "Copa do Mundo" },
    { question: "Em que esporte times competem numa piscina, arremessando uma bola pra um gol?", answer: "Polo Aquatico" },
  ],
  ciencias: [
    { question: "Qual é o menor planeta do sistema solar?", answer: "Mercurio" },
    { question: "Qual gás os humanos precisam respirar pra viver?", answer: "Oxigenio" },
    { question: "Quem propôs a teoria da relatividade?", answer: "Einstein" },
    { question: "Qual órgão do corpo humano bombeia o sangue?", answer: "Coracao" },
    { question: "Qual é o maior órgão do corpo humano?", answer: "Pele" },
    { question: "Qual cientista formulou a lei da gravidade?", answer: "Newton" },
    { question: "Qual é a fórmula química da água?", answer: "H2O" },
    { question: "Qual é o planeta conhecido como planeta vermelho?", answer: "Marte" },
    { question: "Qual gás as plantas liberam durante a fotossíntese?", answer: "Oxigenio" },
    { question: "Como se chama a célula reprodutiva masculina?", answer: "Espermatozoide" },
  ],
  historia: [
    { question: "Em que ano o Brasil foi descoberto pelos portugueses?", answer: "1500" },
    { question: "Em que ano a Segunda Guerra Mundial terminou?", answer: "1945" },
    { question: "Quem assinou a Lei Áurea, abolindo a escravidão no Brasil?", answer: "Princesa Isabel" },
    { question: "Qual civilização antiga construiu as pirâmides do Egito?", answer: "Egipcios" },
    { question: "Em que ano o Brasil se tornou independente de Portugal?", answer: "1822" },
    { question: "Quem foi o líder da Alemanha nazista na Segunda Guerra?", answer: "Hitler" },
    { question: "Qual muro caiu em 1989, símbolo do fim da Guerra Fria?", answer: "Muro de Berlim" },
    { question: "Qual navegador português chegou ao Brasil em 1500?", answer: "Cabral" },
    { question: "Em que ano começou a Revolução Francesa?", answer: "1789" },
    { question: "Quem foi o primeiro presidente do Brasil?", answer: "Deodoro da Fonseca" },
  ],
  cinema: [
    { question: "Quem dirigiu o filme Tubarão, de 1975?", answer: "Spielberg" },
    { question: "Qual é o nome do protagonista de Star Wars, filho de Darth Vader?", answer: "Luke" },
    { question: "Qual estúdio de animação criou Toy Story?", answer: "Pixar" },
    { question: "Qual filme de 1997 conta a história do naufrágio de um navio famoso?", answer: "Titanic" },
    { question: "Qual é o nome do super-herói conhecido como Homem de Ferro?", answer: "Tony Stark" },
    { question: "Qual personagem da Disney tem os poderes de congelar tudo com as mãos?", answer: "Elsa" },
    { question: "Quem dirigiu Vingadores: Ultimato (sobrenome)?", answer: "Russo" },
    { question: "Qual filme brasileiro ganhou o Oscar de Melhor Filme Internacional em 2025?", answer: "Ainda Estou Aqui" },
    { question: "Qual é o nome do tubarão do filme clássico de 1975?", answer: "Bruce" },
    { question: "Em que cidade fica a maior parte da indústria de cinema americana?", answer: "Hollywood" },
  ],
  letras: [
    { question: "Quem escreveu o livro Dom Casmurro?", answer: "Machado de Assis" },
    { question: "Qual é o autor de O Cortiço?", answer: "Aluisio Azevedo" },
    { question: "Quem escreveu as peças Romeu e Julieta?", answer: "Shakespeare" },
    { question: "Qual saga de livros conta a história de um menino bruxo?", answer: "Harry Potter" },
    { question: "Quem escreveu Grande Sertão: Veredas?", answer: "Guimaraes Rosa" },
    { question: "Quantas letras tem o alfabeto português atual?", answer: "26" },
    { question: "Quem escreveu Memórias Póstumas de Brás Cubas?", answer: "Machado de Assis" },
    { question: "Como se chama uma composição poética de 14 versos?", answer: "Soneto" },
    { question: "Quem escreveu o romance Vidas Secas?", answer: "Graciliano Ramos" },
    { question: "Qual autor português escreveu Os Lusíadas?", answer: "Camoes" },
  ],
};

async function main() {
  let count = 0;
  for (const [themeKey, questions] of Object.entries(QUESTIONS)) {
    for (const q of questions) {
      const exists = await prisma.quizQuestion.findFirst({
        where: { themeKey, question: q.question },
      });
      if (!exists) {
        await prisma.quizQuestion.create({ data: { themeKey, ...q } });
        count++;
      }
    }
  }
  console.log(`Seed do Quiz concluído. ${count} pergunta(s) nova(s) adicionada(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
