/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🛂 PASSAPORTE DO CRAQUE — v408 (Raio-X I3, a parte EDUCAÇÃO do Educação Gamer; dono: "vamos começar a onda 2").
   - Em cada lugar (Vila, Praia, Cidade, CT, Estádio, Rio, Santos, as 11 cidades do mundo, Atlântida, a Estação e os
     4 planetas, o Multiverso, Pedraforte, os Picos Nublados, o Vale Celeste e o Vale Jurássico) um personagem que JÁ
     mora ali faz 3 perguntas de múltipla escolha (sorteadas de um banco de 6 a 9 daquele lugar).
     Acertou as 3 → carimbo no Passaporte. Errou → vê a explicação de cada resposta e tenta de novo depois de 1 minuto.
     Com o carimbo, dá para treinar de novo quando quiser (sem prêmio).
   - Conteúdo para 9–12 anos, ligado ao que o jogador vê no lugar: monumentos (placas de monumentos.js), geografia,
     cultura, história do futebol do país; na Europa, as REGRAS e o JOGO LIMPO (impedimento, cartões, vantagem...);
     Atlântida = oceanos; espaço = planetas, gravidade e a Lua; Multiverso = ciência; Pedraforte = rochas e metais;
     Picos Nublados = nuvens e clima; Vale Celeste = meteoros; Jurássico = paleontologia (Dra. Fóssil).
     Sem nomes de clubes, marcas ou jogadores reais (regra do jogo).
   - Recompensa SÓ de reconhecimento (regra do dono: nenhuma fonte nova de poder): tostões pequenos por carimbo,
     títulos por marcos (5, 15 e todos) e, com todos os carimbos, o adorno "Moldura do Viajante" (só visual).
   - Janela do Passaporte: window.abrePassaporte() (a aba 🛂 do Caderno do Craque, caderno.js, usa este nome) com
     passaporteProgresso() e passaporteProximas() para a % e as dicas do Caderno; botão no ☰ Menu e no menu do celular.
   - Missões leves de apresentação (Dona Zuleide, Agência de Turismo da Vila, nível 8 e 20), no padrão
     "📍 Onde achar e como chegar" (como_chegar.js: o bloco aponta quem faz as perguntas).
   - Seu Juca: o quiz de futebol ganha perguntas de regras e jogo limpo.
   Save: s.passaporte = { c: { lugar: data do carimbo }, ate: { lugar: pode tentar de novo a partir de }, tit: [marcos] }
   Prefixo: psp. Carregar NO FIM (depois de ui.js, data.js, como_chegar.js, adornos2.js e de todo arquivo que embrulha abrirNPC).
   ============================================================ */

/* ---------- os lugares e as perguntas ----------
   [pergunta, [resposta certa, errada, errada], explicação] — a ordem das respostas é sorteada na tela */
const PSP_LUGARES = [
  // ===== Brasil =====
  { id: 'vila', mapa: 'vila', npc: 'agente_turismo', nome: 'Campinho Village', curto: 'VILA', ic: '🏡', cor: '#2e8b57', grupo: 'brasil', lv: 1, tema: 'Brazil and maps', p: [
    ['What is the capital of Brazil?', ['Brasília', 'Rio de Janeiro', 'São Paulo'], 'Brasília became the capital in 1960. Before that, the capital was Rio de Janeiro.'],
    ['How many states does Brazil have?', ['26 states and the Federal District', '20 states', '30 states and two capitals'], 'There are 26 states plus the Federal District, where Brasília is. On the flag, each one is a star: that\'s 27 stars!'],
    ['Which side does the Sun rise on?', ['East', 'West', 'North'], 'The Sun rises in the east and sets in the west. If you know that, it\'s much harder to get lost!'],
    ['A compass needle always points to...', ['The north', 'The south', 'The nearest sea'], 'The needle is a magnet and points to Earth\'s magnetic north. Travelers use it to find their way.'],
    ['What is the biggest tropical rainforest in the world, with a large part of it in Brazil?', ['Amazon Rainforest', 'Atlantic Forest', 'Black Forest'], 'The Amazon Rainforest is the biggest tropical forest on the planet, with animals and plants that don\'t exist anywhere else.'],
    ['Brazil borders almost every country in South America. Which two are left out?', ['Chile and Ecuador', 'Argentina and Uruguay', 'Paraguay and Bolivia'], 'Brazil is so big that it touches almost everyone on the continent: only Chile and Ecuador aren\'t its neighbors.'],
    ['What is written on the white band of Brazil\'s flag?', ['Order and Progress', 'Brazil Champion', 'Peace and Love'], 'The motto "Order and Progress" is on the white band, over the starry blue sky.'],
  ] },
  { id: 'praia', mapa: 'praia', npc: 'tata', nome: 'Footvolley Beach', curto: 'BEACH', ic: '🏖️', cor: '#e08a1e', grupo: 'brasil', lv: 5, tema: 'Beach, sun and sea', p: [
    ['Where was footvolley invented?', ['In Brazil, on the beaches of Rio de Janeiro', 'In Australia', 'In Japan'], 'Footvolley was born on the sands of Copacabana, in Rio, in the 1960s. It\'s soccer mixed with volleyball!'],
    ['In footvolley, which part of the body can NOT touch the ball?', ['Hands and arms', 'The head', 'The chest'], 'Feet, thighs, chest, shoulders and head are allowed. Hands and arms, never: just like soccer!'],
    ['How often should you put sunscreen on again at the beach?', ['Every 2 hours and after getting out of the water', 'Once a week', 'Only when it\'s cloudy'], 'Sunscreen comes off with sweat and water. Put it on again every 2 hours and after every swim.'],
    ['At the beach, what does the lifeguard\'s red flag mean?', ['Danger: better not go in the sea', 'Calm sea, you can swim', 'Snack time'], 'The red flag warns that the sea is dangerous there, with strong currents or big waves. Always listen to the lifeguard!'],
    ['What pulls the tides the most, making the sea rise and fall?', ['The Moon', 'The wind', 'The fish'], 'The Moon\'s gravity pulls the water of the oceans (the Sun helps a little). That\'s why the sea rises and falls every day.'],
    ['What is beach sand mostly made of?', ['Tiny bits of rock, like quartz', 'Sugar', 'Rock salt'], 'Waves, wind and rain break rocks into very small grains over a long, long time.'],
    ['At what time is the sun strongest, so it\'s good to stay in the shade?', ['Between 10 a.m. and 4 p.m.', 'Very early, at 7 a.m.', 'At night'], 'From mid-morning to mid-afternoon the sun burns the most. At that time: shade, a cap, a T-shirt and water!'],
  ] },
  { id: 'cidade', mapa: 'cidade', npc: 'ginga', nome: 'City', curto: 'CITY', ic: '🏙️', cor: '#c0307a', grupo: 'brasil', lv: 17, tema: 'Futsal and the city', p: [
    ['How many players does each team have on the court in futsal, counting the goalkeeper?', ['5', '7', '11'], 'In futsal there are 5 on each side: 1 goalkeeper and 4 field players. That\'s why everyone attacks and everyone defends!'],
    ['When the ball goes out over the sideline in futsal, how does it come back into play?', ['With the feet, with the ball still on the line', 'With the hands, over the head', 'The referee throws the ball up'], 'In futsal, the kick-in is taken with the foot, with the ball still on the sideline.'],
    ['How is a futsal ball different from a regular soccer ball?', ['A bit smaller and bounces much less', 'Bigger and much lighter', 'Square'], 'A futsal ball bounces very little, so it stays on the ground more. Perfect for quick passing on the court!'],
    ['In futsal, how many substitutions can a team make?', ['As many as they want', 'Only 3', 'None'], 'In futsal, substitutions are unlimited: a player who comes off can go back in later, as many times as the coach wants.'],
    ['What is the safe way to cross the street in the city?', ['At the crosswalk, looking both ways', 'Running between the cars', 'Stepping out from behind a parked bus'], 'Cross at the crosswalk, with the green light for pedestrians, and look both ways before you go.'],
    ['Skateboarding became an Olympic sport for the first time at which Olympics?', ['Tokyo, held in 2021', 'Rio 2016', 'Beijing 2008'], 'Skateboarding debuted at the Tokyo Olympics, which took place in 2021. And Brazil won medals right in its debut!'],
  ] },
  { id: 'ct', mapa: 'ct', npc: 'aurelio', nome: 'Youth Training Center', curto: 'YOUTH TRAINING CENTER', ic: '🏃', cor: '#3a6ad0', grupo: 'brasil', lv: 25, tema: 'Training and health', p: [
    ['Why should you warm up before training?', ['It gets your muscles ready and helps prevent injuries', 'To get tired before the game', 'It\'s useless'], 'Warming up heats up your muscles and speeds up your heart little by little. Your body gets ready and gets hurt less.'],
    ['What is the best thing to drink during training?', ['Water', 'Soda', 'Nothing, so you don\'t feel heavy'], 'When we sweat, the body loses water. Drink water before, during and after training, in small sips.'],
    ['How many hours a night does a 9- to 12-year-old kid need to sleep?', ['Between 9 and 12 hours', 'Only 5 hours', 'About 15 hours or more'], 'While you sleep, your body grows and recovers from training, and your brain stores what you learned. Stars sleep well!'],
    ['Why does your heart beat faster when you run?', ['To bring more oxygen to the muscles', 'Because it\'s scared', 'To cool the body down'], 'Working muscles need more oxygen, and the blood carries it. So the heart speeds up!'],
    ['Which snack gives you good energy for training?', ['A fruit, like a banana', 'A bag of candy', 'A glass of soda'], 'Fruits have energy, vitamins and fiber. Too much sugar gives you quick energy, but it runs out fast.'],
    ['When do muscles get stronger?', ['During rest, when the body recovers from training', 'Only during the game', 'Never, muscles don\'t change'], 'Training sends the message and rest does the work: muscles get stronger while they recover.'],
  ] },
  { id: 'estadio', mapa: 'estadio', npc: 'dada', nome: 'Legendary Stadium', curto: 'STADIUM', ic: '🏟️', cor: '#b08a10', grupo: 'brasil', lv: 35, tema: 'The history of soccer in Brazil', p: [
    ['In what years did Brazil host the men’s World Cup?', ['1950 e 2014', '1970 e 2002', '1962 e 1994'], 'Brazil hosted the World Trophy twice: in 1950 and in 2014.'],
    ['When did soccer arrive in Brazil?', ['In the late 1800s', 'A thousand years ago', 'In 1990'], 'It arrived at the end of the 19th century, brought by a young man who had studied in England. He came back with balls and a rulebook in his suitcase!'],
    ['From 1941 to 1979, an unfair law in Brazil banned who from playing soccer?', ['Women', 'Children', 'Goalkeepers'], 'It was a very unfair rule. Today soccer is for everyone, and Brazilian women players are among the best in the world!'],
    ['Who helps the referee from the edge of the field by raising a flag?', ['The assistant referee, the "linesman"', 'The ball kid', 'The team physio'], 'The two assistants stand on the sidelines and raise the flag to signal offside, throw-ins, corner kicks and fouls.'],
    ['What does a good fan do at the stadium?', ['Sings and cheers for the team, without insulting anyone', 'Throws things onto the field', 'Fights with the rival fans'], 'Cheering is a party! Respecting the opponent, the referee and the other fans is also part of fair play.'],
    ['What do you call the person who fetches the ball when it goes off the field during the game?', ['Ball kid', 'Goalkeeper', 'Captain'], 'Ball kids stand around the field and give the ball back super fast, so the game doesn\'t stop.'],
    ['What color has the Brazil national team’s main jersey been since the 1950s?', ['Yellow', 'White', 'Red'], 'The yellow jersey with green details debuted in 1954. Before that, the national team played in white.'],
  ] },
  { id: 'rio', mapa: 'rio', npc: 'lider_rio', nome: 'Rio de Janeiro', curto: 'RIO DE JANEIRO', ic: '⛰️', cor: '#1a8a5a', grupo: 'brasil', lv: 112, tema: 'The Wonderful City', p: [
    ['How tall is Christ the Redeemer, counting the pedestal?', ['38 meters', '8 meters', '300 meters'], 'It\'s a 30-meter statue on an 8-meter pedestal, at the top of Corcovado. It\'s one of the New Seven Wonders of the World!'],
    ['Since when has the Sugarloaf Mountain cable car been running?', ['1912', '1999', '1800'], 'It was one of the first aerial cable cars in the world! It takes people to the top of the hill to see the city.'],
    ['Why is the city called Rio de Janeiro ("River of January")?', ['The explorers arrived in January and thought the bay was a river', 'Because it only rains in January', 'Because of a king named January'], 'In January 1502, the Portuguese saw Guanabara Bay and thought it was the mouth of a river. The name stuck!'],
    ['Until 1960, Rio de Janeiro was...', ['The capital of Brazil', 'A desert island', 'A city in Portugal'], 'Rio was the capital of Brazil for almost 200 years, until Brasília opened in 1960.'],
    ['The Copacabana promenade has a famous pattern of little black and white stones. What pattern is it?', ['Waves', 'Stars', 'Soccer balls'], 'The waves are made of Portuguese pavement, with little stones placed one by one. They remind you of the sea right next to it.'],
    ['Rio hosted the first Olympics in South America. In what year?', ['2016', '2000', '1950'], 'The Rio Olympic Games took place in 2016, with athletes from all over the world.'],
  ] },
  { id: 'santos', mapa: 'santos', npc: 'guia_rei', nome: 'Santos', curto: 'SANTOS', ic: '⚓', cor: '#2a2a2a', grupo: 'brasil', lv: 182, tema: 'The port, coffee and the King', p: [
    ['What is the Port of Santos famous for?', ['It\'s the biggest port in Latin America', 'It only gets fishing boats', 'It\'s in the middle of the forest'], 'Ships from all over the world pass through here. For more than a hundred years, Brazil\'s coffee went out to the world through this port.'],
    ['Why are some buildings on the Santos waterfront crooked?', ['They were built on soft clay ground', 'Because of the strong wind', 'They were built crooked on purpose'], 'With all the weight, the clay ground sank more on one side. Today new buildings are made with much deeper foundations.'],
    ['The Santos Waterfront Garden went into the book of records as...', ['The biggest beach garden in the world', 'The smallest garden in the world', 'The coldest garden in the world'], 'It\'s more than 5 kilometers of garden along the beach, with flowers, trees and paths.'],
    ['Which product made the Santos Official Coffee Exchange famous?', ['Coffee', 'Chocolate', 'Cotton candy'], 'At the Coffee Exchange, opened in 1922, people did business with the coffee that left through the port. Its tower clock is famous!'],
    ['In 1908, the first ship with immigrants from which country arrived at the Port of Santos?', ['Japan', 'Australia', 'Canada'], 'Japanese immigrants arrived in 1908 and helped build Brazil. Today Brazil has the largest Japanese community outside Japan.'],
    ['The golden statue in the square honors the King of Soccer. How many World Cups did he win?', ['3', '1', '5'], 'He was champion in 1958, 1962 and 1970: the only player with three World Cups. And he played almost his whole career right here in Santos!'],
  ] },
  // ===== Pelo mundo =====
  { id: 'cairo', mapa: 'cairo', npc: 'lider_cairo', nome: 'Cairo', curto: 'CAIRO', ic: '🐫', cor: '#c8781e', grupo: 'mundo', lv: 50, tema: 'Ancient Egypt and the Nile', p: [
    ['The Great Sphinx of Giza has the body of which animal?', ['Lion', 'Camel', 'Elephant'], 'It has the body of a lion and the head of a pharaoh, and it was carved from a single rock about 4,500 years ago.'],
    ['Why were the pyramids of Giza built?', ['To be tombs for the pharaohs', 'To store wheat', 'To see the stars up close'], 'Each great pyramid was the tomb of a pharaoh, the king of ancient Egypt. The biggest one is more than 4,500 years old!'],
    ['Which river flows through Cairo?', ['The Nile River', 'The Amazon River', 'The Tagus River'], 'The Nile is one of the longest rivers in the world. Without it, Egypt would be almost all desert.'],
    ['What is the writing of ancient Egypt, made with pictures, called?', ['Hieroglyphs', 'Emojis', 'Graffiti'], 'Hieroglyphs used pictures of people, animals and objects. They were written on stone walls and on papyrus.'],
    ['Papyrus, the "paper" of ancient Egypt, was made from what?', ['From a plant on the banks of the Nile', 'From desert sand', 'From camel hair'], 'The Egyptians cut the plant\'s stem into strips, laid them across each other and pressed them until they became a sheet.'],
    ['Which continent is Egypt in?', ['Africa', 'Europe', 'South America'], 'Egypt is in northeast Africa. A little tip of it, the Sinai Peninsula, is already in Asia!'],
    ['Which country has won Africa\'s big national-team soccer tournament the most times?', ['Egypt', 'Brazil', 'Japan'], 'Egypt is the national team that has won Africa\'s national-team tournament the most times.'],
  ] },
  { id: 'doha', mapa: 'doha', npc: 'lider_doha', nome: 'Doha', curto: 'DOHA', ic: '🏜️', cor: '#8a1a4a', grupo: 'mundo', lv: 62, tema: 'Qatar\'s desert and sea', p: [
    ['The 2022 World Cup, in Qatar, was the first...', ['In an Arab country', 'In South America', 'Played in the snow'], 'It was the first World Trophy in the Arab world. And it was in November and December, when it\'s less hot there.'],
    ['Qatar is a peninsula. What does that mean?', ['It\'s surrounded by water on three sides', 'It\'s on top of a mountain', 'It\'s underground'], 'A peninsula is land surrounded by water on three sides and joined to the mainland on just one side.'],
    ['Before oil, how did many people in Qatar make a living?', ['Diving for pearls and fishing', 'Growing coffee', 'Hunting penguins'], 'Divers went deep, with no equipment, to find oysters with pearls. It was really hard work!'],
    ['Which bird is part of an old desert tradition called falconry?', ['The falcon', 'The penguin', 'The parrot'], 'Falcons are trained to fly off and come back to the falconer\'s arm. They are super fast birds!'],
    ['Where is the Museum of Islamic Art in Doha?', ['On a man-made island in the bay', 'Under the sand', 'On top of a dune'], 'The museum was built on an island made by people, and it holds works of art more than a thousand years old.'],
    ['What makes the dunes in the desert?', ['The wind, which pushes the sand', 'Heavy rain', 'Camels digging'], 'The wind carries grains of sand and piles them up. That\'s why dunes change shape and even "walk" very slowly.'],
  ] },
  { id: 'toquio', mapa: 'toquio', npc: 'lider_toquio', nome: 'Tokyo', curto: 'TOKYO', ic: '🗼', cor: '#d0302a', grupo: 'mundo', lv: 74, tema: 'Japan', p: [
    ['Why is Tokyo Tower painted orange and white?', ['So airplanes can see it clearly', 'Because those are a team\'s colors', 'To keep it warm in winter'], 'Very tall buildings use bright colors so pilots can see them from far away. It\'s 333 meters tall!'],
    ['Mount Fuji, the tallest mountain in Japan, is...', ['A volcano', 'A mountain of ice', 'A giant building'], 'Fuji is a volcano 3,776 meters tall. It hasn\'t erupted in more than 300 years.'],
    ['In which season do cherry trees bloom in Japan?', ['Primavera', 'Inverno', 'Only at night'], 'In spring, the trees are covered in pink flowers and families have picnics under them: it\'s called hanami!'],
    ['Japan is made up of...', ['Thousands of islands', 'Just one island', 'A big desert'], 'Japan has thousands of islands, but almost everyone lives on the four biggest ones.'],
    ['Which country has the biggest Japanese community outside Japan?', ['Brazil', 'Australia', 'Egypt'], 'The first Japanese immigrants arrived in Brazil in 1908, at the Port of Santos. Today there are millions of descendants!'],
    ['In 2002, Japan hosted a World Cup together with which country?', ['South Korea', 'China', 'Brazil'], 'It was the first World Trophy in Asia and the first with two host countries. And Brazil won its fifth title there!'],
    ['How do people usually greet each other in Japan?', ['With a bow, bending forward', 'Clapping three times', 'Jumping'], 'A bow shows respect. At Master Kenji\'s dojo, every practice starts and ends this way.'],
  ] },
  { id: 'miami', mapa: 'miami', npc: 'lider_miami', nome: 'Miami', curto: 'MIAMI', ic: '🌴', cor: '#e0508a', grupo: 'mundo', lv: 86, tema: 'Florida and the sea', p: [
    ['Which country is Miami in?', ['United States', 'Mexico', 'Canada'], 'Miami is in Florida, in the southeast of the United States, on the Atlantic Ocean.'],
    ['The Everglades, near Miami, are the only place in the world where these live together...', ['Alligators and crocodiles', 'Lions and tigers', 'Penguins and polar bears'], 'It\'s a huge, protected swamp. There, alligators and crocodiles share the same water!'],
    ['What style are the colorful buildings on Ocean Drive?', ['Art Deco', 'Egyptian pyramid', 'Medieval castle'], 'Art Deco has straight lines, soft curves and cheerful colors. Miami has hundreds of buildings like that!'],
    ['Why is the Freedom Tower in Miami famous?', ['It welcomed thousands of people who came to start a new life', 'It\'s the tallest tower in the world', 'It\'s made of chocolate'], 'People arriving from another country were welcomed and helped there. That\'s why it\'s a symbol of welcome.'],
    ['Which countries hosted the 2026 World Cup?', ['United States, Canada and Mexico', 'Only England', 'Brazil and Argentina'], 'It was the first World Trophy with three host countries and 48 national teams!'],
    ['What is a hurricane?', ['A giant spinning storm with very strong winds', 'A volcano in the sea', 'A heat wave'], 'Hurricanes form over warm seas. In Miami, people follow the weather forecast and know how to stay safe.'],
  ] },
  { id: 'buenos', mapa: 'buenos', npc: 'lider_buenos', nome: 'Buenos Aires', curto: 'BUENOS AIRES', ic: '💃', cor: '#3a8ad8', grupo: 'mundo', lv: 100, tema: 'Argentina', p: [
    ['The Obelisk of Buenos Aires stands on an avenue famous for being...', ['One of the widest in the world', 'The shortest in the world', 'Made of water'], '9 de Julio Avenue is super wide. The Obelisk, in the middle of it, is 67 meters tall.'],
    ['Which dance was born in the Río de la Plata region, where Buenos Aires is?', ['Tango', 'Samba', 'Frevo'], 'Tango was born in the neighborhoods near the port, in the late 1800s, and today it\'s danced all over the world.'],
    ['What are the little houses in the La Boca neighborhood like?', ['Painted in lots of colors', 'All white', 'Made of ice'], 'People say the locals painted their houses with leftover paint from the boats in the port. That\'s why every wall has a different color!'],
    ['Argentina won the 2022 World Cup. In which country was that World Cup played?', ['Qatar', 'Brazil', 'Japan'], 'The 2022 World Trophy was in Qatar, and Argentina won the final on penalties.'],
    ['What is in the middle of Argentina\'s flag?', ['A sun with a face', 'A red star', 'A ball'], 'It\'s the Sun of May, a symbol of the country\'s independence.'],
    ['Mate, a typical drink from Argentina, is also drunk in which region of Brazil?', ['In the South, where it\'s called chimarrão', 'Only in Amazonas', 'Nowhere in Brazil'], 'Mate is made with yerba mate and hot water, in a gourd. In Rio Grande do Sul, it\'s the famous chimarrão.'],
  ] },
  { id: 'lisboa', mapa: 'lisboa', npc: 'lider_lisboa', nome: 'Lisbon', curto: 'LISBON', ic: '🚋', cor: '#d0a020', grupo: 'mundo', lv: 124, tema: 'Portugal and the rules of the game', p: [
    ['What was Belém Tower used for?', ['Guarding the entrance to Lisbon along the Tagus River', 'Keeping the city\'s bells', 'Being a lighthouse for airplanes'], 'It watched the boats coming in along the river. The caravels of the Age of Discovery set sail from there!'],
    ['The fleet that reached Brazil in 1500 left from which city?', ['Lisbon', 'Paris', 'London'], 'The Portuguese ships left Lisbon and reached the coast of Bahia in April 1500.'],
    ['Which famous pastry was born in the Belém neighborhood of Lisbon?', ['The pastel de nata', 'The brigadeiro', 'The churro'], 'The pastel de nata is a little puff pastry tart filled with custard. The recipe came from the monks of a monastery in Belém.'],
    ['Why are Lisbon\'s yellow trams always going up and down hills?', ['The city is built on several hills', 'The city is completely flat', 'The tracks are crooked on purpose'], 'Lisbon is called the city of seven hills. The trams, called "elétricos" there, help people get up the hills!'],
    ['What is required on a throw-in?', ['Using both hands, with the ball going from behind and over the head', 'Using just one hand', 'Kicking the ball'], 'And both feet must stay on the ground, on the line or outside it. If it\'s done wrong, the throw-in goes to the other team.'],
    ['Can an attacker be offside in their own team\'s half?', ['No, only in the opponent\'s half', 'Yes, anywhere', 'Only on a corner kick'], 'A player in their own team\'s half is never in an offside position.'],
  ] },
  { id: 'paris', mapa: 'paris', npc: 'lider_paris', nome: 'Paris', curto: 'PARIS', ic: '🗼', cor: '#4a5ad0', grupo: 'mundo', lv: 136, tema: 'France and fair play', p: [
    ['Why does the Eiffel Tower get a few centimeters taller in summer?', ['Heat makes the iron expand (stretch)', 'It gets watered like a plant', 'They put a hat on it'], 'When it\'s hot, metal expands. The tower, from 1889, can grow about 15 centimeters!'],
    ['Which famous painting is in the Louvre Museum?', ['The Mona Lisa', 'Abaporu', 'The Scream'], 'The Louvre is one of the biggest art museums in the world, and the Mona Lisa is its most visited work.'],
    ['How many avenues start from the square around the Arc de Triomphe?', ['12', '2', '100'], 'The 12 avenues form a star around the arch. That\'s why the place is called the Square of the Star!'],
    ['Where is Notre-Dame Cathedral?', ['On an island in the middle of the Seine River', 'On top of the Eiffel Tower', 'Underground'], 'It\'s on an island in the center of Paris and has stone gargoyles on its roofs.'],
    ['In which city was the organization that runs the World Cup founded, in 1904?', ['Paris', 'Rio de Janeiro', 'Tokyo'], 'The organization that looks after soccer around the whole world was born in Paris, in 1904, with seven countries.'],
    ['An opponent got hurt and fell, and his team kicked the ball out. What\'s fair play on the restart?', ['Giving the ball back to the team that stopped the game', 'Taking the chance to attack fast', 'Hiding the ball'], 'It\'s not written in the rules, but it\'s a fair play custom: the team that stopped the game to help gets the ball back.'],
    ['What is the "advantage rule"?', ['The referee lets play go on if stopping would be worse for the team that was fouled', 'Whoever gets to the ball first wins', 'The home team plays with one extra player'], 'If the team that was fouled still has a good attack going, the referee stretches both arms forward and waves play on!'],
  ] },
  { id: 'munique', mapa: 'munique', npc: 'lider_munique', nome: 'Munich', curto: 'MUNICH', ic: '🥨', cor: '#2a7ad8', grupo: 'mundo', lv: 148, tema: 'Germany and restarts', p: [
    ['What happens on the clock of Munich\'s New Town Hall tower?', ['Figures dance and spin to the sound of bells', 'Water comes out like a fountain', 'It runs backward'], 'It\'s the Glockenspiel: a clock with bells and big figures that put on a show high up in the tower.'],
    ['In which city was the 1974 World Cup final played?', ['Munich', 'Rio de Janeiro', 'Tokyo'], 'Germany won that World Trophy at home, with the final right here in Munich.'],
    ['Munich is the capital of which region of Germany?', ['Bavaria', 'Patagonia', 'Siberia'], 'Bavaria is in the south of Germany, near the Alps. The pretzel, a bread shaped like a knot, is really famous there.'],
    ['Munich is near which famous mountains?', ['The Alps', 'The Andes', 'The Himalayas'], 'On a clear day, from high places in the city, you can see the peaks of the Alps on the horizon.'],
    ['The ball went over the goal line and the last player to touch it was a DEFENDER. What does the referee call?', ['Corner kick', 'Goal kick', 'Penalty'], 'A defender touched it last and the ball went over the goal line, outside the goal? Corner kick for the attack!'],
    ['And if the ball goes over the goal line after a touch by an ATTACKER?', ['Goal kick', 'Corner kick', 'Fullback'], 'Then the ball goes back to the defending team, with a goal kick taken from inside the goal area.'],
    ['Can you score directly from a corner kick?', ['Yes, it\'s called a "gol olímpico"', 'No, never', 'Only with your hand'], 'A goal straight from a corner kick counts, and it even has a special name: "gol olímpico"!'],
  ] },
  { id: 'milao', mapa: 'milao', npc: 'lider_milao', nome: 'Milan', curto: 'MILAN', ic: '⛪', cor: '#2a9a5a', grupo: 'mundo', lv: 156, tema: 'Italy and the goal rules', p: [
    ['How long did it take to finish Milan Cathedral?', ['Almost 600 years', 'Two weeks', 'Ten years'], 'Construction started in 1386 and was finished little by little. The cathedral has more than 3,400 statues!'],
    ['The map of Italy has a famous shape. What does it look like?', ['A boot', 'A ball', 'A fish'], 'Italy looks like a tall boot. And at the tip, it seems to kick a ball: the island of Sicily!'],
    ['Milan is famous around the world as a capital of what?', ['Fashion', 'Ice', 'Dinosaurs'], 'Milan hosts big fashion shows, and designers from all over the world work there.'],
    ['In what year did Italy win the World Cup played in Germany?', ['2006', '1950', '2014'], 'Italy won the 2006 World Trophy, in Germany, in a final decided on penalties.'],
    ['Can the goalkeeper pick up a ball that a teammate kicked to them on purpose?', ['No, then they have to play it with their feet', 'Yes, always', 'Only in the second half'], 'It\'s the back-pass rule, created in 1992 so the game wouldn\'t stall. If the keeper picks it up, it\'s an indirect free kick for the opponent.'],
    ['When does a goal count?', ['When the whole ball crosses the goal line', 'When half the ball crosses', 'When the ball touches the post'], 'If even a tiny bit of the ball is still on the line, it\'s not a goal. The whole ball has to cross!'],
    ['How does the referee show that a free kick is indirect?', ['By raising one arm', 'By blowing the whistle three times', 'By sitting on the ground'], 'On an indirect free kick, the ball has to touch another player before going into the goal. The raised arm signals that.'],
  ] },
  { id: 'madri', mapa: 'madri', npc: 'lider_madri', nome: 'Madrid', curto: 'MADRID', ic: '💃', cor: '#c8302a', grupo: 'mundo', lv: 162, tema: 'Spain and the cards', p: [
    ['What was the Puerta de Alcalá in Madrid?', ['One of the gates into the city', 'A stadium', 'A churro factory'], 'It\'s more than 240 years old. Long ago, anyone arriving in Madrid from that side went through this gate.'],
    ['Where is Madrid in Spain?', ['Right in the center of the country', 'On an island', 'On the border with Brazil'], 'Madrid is in the middle of Spain. In the Puerta del Sol square there\'s the "kilometer zero" plaque, where the country\'s roads are measured from.'],
    ['In what year did Spain’s men’s national team win its first World Cup?', ['2010', '1950', '1994'], 'Spain became champion in 2010, in South Africa, playing with lots of short passes.'],
    ['Flamenco, music and dance full of clapping and foot stomping, comes from which region of Spain?', ['From the south, from Andalusia', 'From the North Pole', 'From an island in the Pacific'], 'Flamenco was born in Andalusia, in the south of Spain, and today it\'s danced all over the country.'],
    ['What happens to a player who gets two yellow cards in the same game?', ['They get a red card and leave the game', 'They win a prize', 'Nothing, they can keep playing'], 'Two yellows make a red. The player leaves and the team plays with one player fewer.'],
    ['When a player is sent off, can the team put someone else in their place?', ['No, the team plays with one player fewer', 'Yes, right away', 'Only if the coach asks politely'], 'That\'s the "penalty" of a red card: the whole team plays with fewer players until the end.'],
    ['Is an attacker exactly level with the second-to-last defender offside?', ['No, level is OK', 'Yes, always', 'Only if it\'s the goalkeeper'], 'To be offside, they need to be closer to the goal than both the ball and the second-to-last opponent. Level with them is OK!'],
  ] },
  { id: 'londres', mapa: 'londres', npc: 'lider_londres', nome: 'London', curto: 'LONDON', ic: '💂', cor: '#b0202a', grupo: 'mundo', lv: 176, tema: 'England, birthplace of the rules', p: [
    ['What is the name "Big Ben" really for?', ['The giant bell inside the tower', 'A king', 'A guard\'s wristwatch'], 'Big Ben is the bell that weighs more than 13 tons. Today the clock tower is called the Elizabeth Tower.'],
    ['In which city were the first rules of modern soccer written, in 1863?', ['London', 'Rio de Janeiro', 'Cairo'], 'In 1863, English clubs met in London and agreed on the same rules for everyone. Soccer as we know it was born!'],
    ['In what year did England win the World Cup at home?', ['1966', '2002', '1930'], 'The 1966 World Trophy was held in England, and the final was played right here in London.'],
    ['What color are London\'s famous double-decker buses?', ['Red', 'Green', 'Purple'], 'The red double-decker buses are a symbol of the city, just like the red phone booths.'],
    ['Which river runs through London?', ['The Thames', 'The Nile', 'The Amazon'], 'The River Thames cuts through the city, and the Big Ben tower sits right on its bank.'],
    ['What is the minimum number of players a team needs on the field for the game to go on?', ['7', '3', '11'], 'If a team has fewer than 7 players, the game can\'t go on.'],
    ['What is VAR?', ['Video referees who help review important plays', 'A type of soccer cleat', 'A famous dribble'], 'VAR helps with goals, penalties and red cards. At a World Cup, it made its debut in 2018.'],
  ] },
  // ===== Mar e espaço =====
  { id: 'atlantida', mapa: 'atlantida', npc: 'lider_atl', nome: 'Atlantis', curto: 'ATLANTIS', ic: '🐙', cor: '#1aa0b0', grupo: 'mar', lv: 196, tema: 'Oceans and sea life', p: [
    ['How much of Earth\'s surface is covered by oceans?', ['About 70%', 'Only 10%', 'None, it\'s all land'], 'Oceans cover about 71% of the planet. That\'s why Earth looks blue from space!'],
    ['What is the largest ocean in the world?', ['Pacific', 'Atlântico', 'Indian'], 'The Pacific is so big that all the continents together would fit inside it.'],
    ['Are whales fish?', ['No, they are mammals and breathe air', 'Yes, they are giant fish', 'They are dinosaurs'], 'Whales come up to breathe through a little hole on top of their heads, and the babies drink their mother\'s milk.'],
    ['How many hearts does an octopus have?', ['3', '1', '8'], 'An octopus has 3 hearts and blue blood. And it also has 8 arms full of suckers!'],
    ['Corals are...', ['Tiny animals that live in colonies', 'Colorful rocks', 'Plastic plants'], 'Each coral is made of thousands of tiny animals called polyps. Coral reefs are home to lots of fish.'],
    ['With seahorses, who carries the eggs until the babies hatch?', ['The dad', 'The mom', 'Auntie Octopus'], 'The mom puts the eggs in a little pouch on the dad\'s belly, and he takes care of them until the babies are born!'],
    ['What is a shark\'s skeleton made of?', ['Cartilage, like the tip of your nose', 'Very hard bones', 'Wood'], 'Sharks have no bones: their skeleton is made of cartilage, which is lighter and more flexible. Squeeze the tip of your nose: that\'s cartilage!'],
    ['What is the deepest place in the oceans?', ['The Mariana Trench', 'The pond in the park', 'Guanabara Bay'], 'It is almost 11 kilometers deep: all of Mount Everest would fit inside!'],
    ['Why shouldn\'t you throw plastic bags into the sea?', ['Turtles can mistake them for jellyfish and swallow them', 'Because the bags sink ships', 'Because it makes the sea fresh water'], 'Sea turtles eat jellyfish, and a floating bag looks a lot like one. Trash goes in the trash!'],
  ] },
  { id: 'estacao', mapa: 'estacao', npc: 'lider_esp', nome: 'Space Station', curto: 'SPACE STATION', ic: '🛰️', cor: '#3a4ab0', grupo: 'mar', lv: 298, tema: 'The Solar System', p: [
    ['How many planets are in the Solar System?', ['8', '12', '3'], 'Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus and Neptune. Today Pluto is called a dwarf planet.'],
    ['The Sun is a...', ['Star', 'Planet', 'Comet'], 'The Sun is the closest star to Earth. It is so big that more than a million Earths would fit inside it!'],
    ['How long does sunlight take to reach Earth?', ['About 8 minutes', '1 second', '1 year'], 'Light is the fastest thing there is, but the Sun is so far away that its light takes about 8 minutes to get here.'],
    ['Why do astronauts float inside a space station?', ['The station is always "falling" around Earth, and they fall along with it', 'Because there is no gravity at all up there', 'Because they are very light'], 'Earth\'s gravity still pulls on the station, but it moves so fast that it keeps falling around the planet without ever hitting the ground. Everyone inside falls with it and floats!'],
    ['The International Space Station goes around Earth once in about...', ['1 and a half hours', '1 year', '1 week'], 'It flies at about 28 thousand kilometers per hour. The astronauts see the sunrise about 16 times a day!'],
    ['Counting from the Sun, which number planet is Earth?', ['3º', '1º', '8º'], 'First comes Mercury, then Venus, and then Earth: not too close, not too far. The perfect spot for liquid water!'],
  ] },
  { id: 'lua', mapa: 'lua', npc: 'lider_lua', nome: 'Moon', curto: 'LUA', ic: '🌙', cor: '#6a6a7a', grupo: 'mar', lv: 300, tema: 'The Moon and gravity', p: [
    ['How much would you weigh on the Moon?', ['About 6 times less', 'The same as on Earth', 'Twice as much'], 'The Moon\'s gravity is about 1/6 of Earth\'s gravity. Your jumps would go way higher there!'],
    ['Does the Moon make its own light?', ['No, it reflects sunlight', 'Yes, it\'s a giant lamp', 'Only during a full moon'], 'The Moon shines because the Sun lights it up. Its phases change depending on how much of the lit part we can see from here.'],
    ['In what year did people first walk on the Moon?', ['1969', '1500', '2010'], 'In July 1969, two astronauts walked on the Moon, very close to here: in the Sea of Tranquility!'],
    ['Why can footprints left on the Moon last for millions of years?', ['There\'s no wind or rain there to erase them', 'They were stuck on with glue', 'The Moon is made of cement'], 'The Moon has almost no air, so there\'s no wind or rain. The footprints just stay there, perfectly still.'],
    ['Do the Moon\'s "seas", like the Sea of Tranquility, have water?', ['No, they are plains of ancient lava that hardened', 'Yes, full of fish', 'Only when it rains'], 'Long ago, people thought the dark spots were seas. They are actually plains of lava that cooled billions of years ago.'],
    ['Why do we always see the same side of the Moon?', ['It spins around itself in the same time it takes to go around Earth', 'Because the Moon doesn\'t spin', 'Because the other side is invisible'], 'The Moon takes about 27 days to spin once and also to go around Earth. That\'s why it always shows us the same "face".'],
    ['If you shouted on the Moon without a radio, would anyone hear you?', ['No, without air, sound can\'t travel', 'Yes, even louder', 'Only during the day'], 'Sound needs air (or water) to travel. That\'s why astronauts talk through the radio in their helmets.'],
  ] },
  { id: 'marte', mapa: 'marte', npc: 'lider_marte', nome: 'Mars', curto: 'MARTE', ic: '🔴', cor: '#c0482a', grupo: 'mar', lv: 325, tema: 'The Red Planet', p: [
    ['Why is Mars red?', ['The ground has lots of rusty iron', 'It\'s on fire', 'Somebody painted it'], 'Mars dust has iron oxide, the same stuff as rust. That\'s why it\'s called the Red Planet.'],
    ['How many moons does Mars have?', ['2', 'None', '20'], 'It has two small, potato-shaped moons: Phobos and Deimos.'],
    ['What is the largest known volcano in the Solar System, found on Mars?', ['Olympus Mons', 'Mount Fuji', 'Sugarloaf Mountain'], 'Olympus Mons is more than 20 kilometers tall: more than twice the height of Mount Everest!'],
    ['How long is a day on Mars?', ['A little longer than an Earth day', 'One hour', 'A whole year'], 'A day on Mars lasts about 24 hours and 40 minutes. Very close to ours!'],
    ['Who is exploring Mars these days?', ['Robot rovers with wheels', 'Tourists on vacation', 'Nobody has ever sent anything there'], 'Several robot rovers have already driven around Mars, taking pictures and studying the rocks. People haven\'t gone yet... maybe it\'ll be you?'],
    ['Does Mars have ice?', ['Yes, at the poles and under the ground', 'No, it\'s all fire there', 'Only on its moons'], 'Mars has ice caps at its poles, like Earth, and also ice hidden under the soil.'],
    ['Counting from the Sun, which number planet is Mars?', ['4º', '2º', '7º'], 'Mars comes right after Earth. It is smaller than Earth and much colder.'],
  ] },
  { id: 'saturno', mapa: 'saturno', npc: 'lider_saturno', nome: 'Saturn', curto: 'SATURN', ic: '🪐', cor: '#b08a3a', grupo: 'mar', lv: 350, tema: 'The rings and the giants', p: [
    ['What are Saturn\'s rings made of?', ['Chunks of ice and rock', 'Solid gold', 'Colorful smoke'], 'The rings are billions of chunks of ice and rock, from the size of sand grains to the size of houses, spinning around the planet.'],
    ['What kind of planet is Saturn?', ['Gas giant', 'Rocky, like Earth', 'A star'], 'Saturn is made almost entirely of gas. There\'s no solid ground to land on!'],
    ['What is the largest planet in the Solar System?', ['Jupiter', 'Saturn', 'Earth'], 'Saturn is the second largest. The largest is Jupiter, its neighbor.'],
    ['If there were a giant bathtub just the right size, Saturn would...', ['Float, because it is less dense than water', 'Sink right away', 'Melt'], 'Saturn is huge, but very "fluffy": it\'s so low in density that it would float in a giant bathtub!'],
    ['What is Saturn\'s largest moon, the one with methane lakes?', ['Titan', 'Phobos', 'Our Moon'], 'Titan has a very thick atmosphere and lakes of liquid methane, not water. It is the second largest moon in the Solar System.'],
    ['How long does Saturn take to go around the Sun once?', ['Almost 30 Earth years', '1 day', '1 month'], 'Saturn is so far away that it takes about 29 and a half years to go around. A "year" there is really long!'],
    ['How many moons does Saturn have?', ['More than 100', 'None', 'Only 1'], 'Astronomers have already found more than 100 moons around Saturn, and they keep finding new ones!'],
  ] },
  { id: 'nebulosa', mapa: 'nebulosa', npc: 'lider_nebulosa', nome: 'Orion Nebula', curto: 'ORION NEBULA', ic: '🌌', cor: '#7a3ac0', grupo: 'mar', lv: 375, tema: 'The stars', p: [
    ['What is a nebula?', ['A cloud of gas and dust where stars are born', 'A cotton planet', 'A hole in the sky'], 'In nebulas, gravity pulls gas and dust together until new stars form. The Orion Nebula is a star nursery!'],
    ['The "Three Marys", as Brazilians call three stars in a row in their night sky, are part of which constellation?', ['Orion', 'Southern Cross', 'Big Dipper (Ursa Major)'], 'The Three Marys are the belt of Orion the hunter. Right near them is the Orion Nebula, which you can see even without a telescope!'],
    ['What does a light-year measure?', ['Distance', 'Time', 'Weight'], 'A light-year is the distance light travels in one year: almost 10 trillion kilometers!'],
    ['What is the closest star to Earth?', ['The Sun', 'The Morning Star', 'The Moon'], 'The Sun is a star! (The Morning Star is actually the planet Venus.) After the Sun, the closest star is about 4 light-years away.'],
    ['What does the color of a star show?', ['Its temperature', 'The age of the closest planet', 'Its mood'], 'Bluish stars are the hottest; reddish ones are "cooler" (but still super hot!).'],
    ['Why do stars seem to twinkle?', ['Earth\'s moving air bends their light', 'They turn on and off', 'Somebody flips a switch'], 'The light passes through moving layers of hot and cold air, so it seems to shake. Seen from space, stars don\'t twinkle!'],
  ] },
  // ===== Multiverso, vales e Jurássico =====
  { id: 'multiverso', mapa: 'multiverso', npc: 'guardiao_mv', nome: 'Multiverse', curto: 'MULTIVERSE', ic: '🌀', cor: '#5a3ad8', grupo: 'mv', lv: 400, tema: 'Science fun facts', p: [
    ['Which is hotter?', ['A lightning bolt', 'The surface of the Sun', 'A campfire'], 'A lightning bolt can reach about 30,000 °C, about five times hotter than the surface of the Sun!'],
    ['How many bones are in an adult\'s body?', ['206', '50', '1.000'], 'Babies are born with about 300 tiny bones. Some of them join together as we grow, until there are 206.'],
    ['What do plants release into the air when they do photosynthesis?', ['Oxygen', 'Fumaça', 'Glitter'], 'With sunlight, water and carbon dioxide, plants make their own food and release the oxygen we breathe.'],
    ['At what temperature does water boil at sea level?', ['100 °C', '0 °C', '37 °C'], 'Water boils at 100 °C and freezes at 0 °C. High up in the mountains, it boils with less heat!'],
    ['Which is faster: light or sound?', ['Light', 'Sound', 'They\'re the same'], 'That\'s why we see the lightning before we hear the thunder. Light is the fastest thing in the universe.'],
    ['Which of these objects does a magnet attract?', ['An iron nail', 'An eraser', 'A sheet of paper'], 'Magnets attract materials like iron. Plastic, paper and wood? Nope.'],
    ['What happens to water when it freezes?', ['It takes up more space', 'It disappears', 'It shrinks and sinks'], 'Ice takes up more space than liquid water. That\'s why ice floats, and a full bottle can burst in the freezer!'],
  ] },
  { id: 'pedraforte', mapa: 'pedraforte', npc: 'rei_barbaferro', nome: 'Stonehold', curto: 'STONEHOLD', ic: '⛏️', cor: '#7a5a3a', grupo: 'mv', lv: 400, tema: 'Rocks and metals', p: [
    ['What is the hardest natural mineral there is?', ['Diamond', 'Gold', 'Chalk'], 'Diamond scratches almost everything, and almost nothing scratches it. That\'s why it\'s used in drills and saws.'],
    ['Diamond and graphite (the tip of a pencil) are made of the same element. Which one?', ['Carbon', 'Iron', 'Gold'], 'Both are pure carbon! What changes is how the atoms are arranged.'],
    ['What does iron need to rust?', ['Water and oxygen from the air', 'Only darkness', 'Loud music'], 'Rust appears when iron reacts with oxygen, with help from moisture. Gold doesn\'t rust!'],
    ['When lava from a volcano cools down, it turns into...', ['Rocha', 'Beach sand, right away', 'Ice'], 'Lava that cools down turns into rocks called igneous rocks, like basalt.'],
    ['Bronze, used in medals and statues, is a mix of which metals?', ['Copper and tin', 'Gold and silver', 'Iron and plastic'], 'Mixing metals makes an alloy. Bronze was so important that it named a whole era: the Bronze Age!'],
    ['Steel, used in bridges and buildings, is mostly made of what?', ['Iron with a tiny bit of carbon', 'Aluminum and water', 'Stone and sand'], 'A tiny bit of carbon makes iron much stronger. That\'s how steel is made!'],
  ] },
  { id: 'picos', mapa: 'picos_nublados', npc: 'rainha_nimbus', nome: 'Cloudy Peaks', curto: 'CLOUDY PEAKS', ic: '☁️', cor: '#4a8ad0', grupo: 'mv', lv: 475, tema: 'Clouds and weather', p: [
    ['What are clouds made of?', ['Tiny water droplets and ice crystals', 'Cotton', 'Chimney smoke'], 'Water vapor rises, cools down and turns into super tiny droplets. Millions of them together make a cloud.'],
    ['When you climb a really tall mountain, the air gets...', ['Colder', 'Warmer', 'The same'], 'The higher you go, the colder it gets: that\'s why there\'s snow on top of tall mountains, even in hot countries.'],
    ['To see a rainbow, where does the Sun need to be?', ['Behind you', 'In front of you', 'Underground'], 'With the Sun at your back and raindrops in front of you, the light splits into the colors of the rainbow.'],
    ['Why do we see lightning before we hear thunder?', ['Light is much faster than sound', 'Thunder happens later', 'Our ears are lazy'], 'They both happen at the same time! Count the seconds between the flash and the boom: every 3 seconds, the lightning is about 1 kilometer away.'],
    ['What is the tallest mountain in the world?', ['Mount Everest', 'Sugarloaf Mountain', 'Mount Fuji'], 'Everest is about 8,849 meters tall and sits in the Himalayas, between Nepal and China.'],
    ['What is the order of the water cycle?', ['It evaporates, becomes a cloud and falls as rain', 'It rains, turns into stone and disappears', 'It freezes, melts and turns into fire'], 'The Sun heats the water, it evaporates, becomes a cloud and comes back as rain to the rivers and seas. And it all starts again!'],
    ['How many points does a snowflake usually have?', ['6', '3', '10'], 'Ice crystals grow with six sides. That\'s why snowflakes have six points, and almost no two are alike!'],
  ] },
  { id: 'vale', mapa: 'vale_celeste', npc: 'guardiao_vale', nome: 'Valley of the Celestial Stones', curto: 'CELESTIAL VALLEY', ic: '☄️', cor: '#c05a1a', grupo: 'mv', lv: 1, tema: 'Meteors and comets', p: [
    ['What is a "shooting star"?', ['A little space rock glowing as it enters Earth\'s air', 'A star really falling', 'An airplane'], 'It\'s not a star! It\'s a meteor: a little piece of rock that enters the air super fast and glows as it heats up.'],
    ['What do you call a space rock that reaches the ground?', ['Meteorite', 'Comet', 'Satellite'], 'In space it\'s a meteoroid; glowing in the sky, a meteor; and the piece that reaches the ground is a meteorite!'],
    ['What is the name of the biggest meteorite ever found in Brazil, weighing more than 5 tons?', ['Bendegó', 'Saci', 'Curupira'], 'Bendegó was found in Bahia in 1784 and today it\'s at the National Museum, in Rio. It even survived the museum fire in 2018!'],
    ['What is a comet made of?', ['Ice, dust and rock', 'Pure fire', 'Melted metal'], 'When a comet gets close to the Sun, the ice turns into gas and makes a glowing tail.'],
    ['Which way does a comet\'s tail point?', ['Always away from the Sun', 'Always toward the Sun', 'Always toward Earth'], 'The "wind" of particles coming from the Sun pushes the tail. That\'s why it points away from the Sun.'],
    ['According to scientists, what wiped out most of the dinosaurs, 66 million years ago?', ['A giant asteroid crashing down', 'A one-week winter', 'They left by boat'], 'An asteroid about 10 kilometers wide fell where Mexico is today. Birds are the descendants of the dinosaurs that survived!'],
    ['Where is the asteroid belt in the Solar System?', ['Between Mars and Jupiter', 'Around the Moon', 'Inside the Sun'], 'Millions of rocks spin around the Sun there. Most of them are pretty small.'],
  ] },
  { id: 'jurassico', mapa: 'jur_acampamento', npc: 'dra_fossil', nome: 'Jurassic Valley', curto: 'JURASSIC VALLEY', ic: '🦖', cor: '#4a7a2a', grupo: 'mv', lv: 560, tema: 'Dinosaurs and fossils', p: [
    ['What does a paleontologist do?', ['Studies fossils to understand life in the past', 'Takes care of teeth', 'Builds buildings'], 'Paleontologists like me dig up bones, footprints and shells that turned to stone, and find out what Earth was like millions of years ago.'],
    ['Did Tyrannosaurus rex live in the Jurassic period?', ['No, it lived later, in the Cretaceous', 'Yes, it was the king of the Jurassic', 'It still lives today'], 'T. rex lived at the end of the Cretaceous, about 68 million years ago. Other dinosaurs lived in the Jurassic, like Stegosaurus.'],
    ['Did people and giant dinosaurs live at the same time?', ['No, millions of years separate them', 'Yes, people rode them', 'Only in Brazil'], 'The big dinosaurs disappeared 66 million years ago. The first humans showed up only about 300 thousand years ago.'],
    ['Which animals today are descendants of the dinosaurs?', ['Birds', 'Cats', 'The fish'], 'Chickens, pigeons and hummingbirds are related to dinosaurs! Many dinosaurs even had feathers.'],
    ['How does a fossil form?', ['The body gets covered with dirt and, over time, minerals take the place of the bones', 'Someone carves it into stone', 'The animal freezes in a freezer'], 'It takes thousands or millions of years: layers of mud and sand cover the remains and slowly turn into stone along with them.'],
    ['What do you call dinosaur poop that turned into a fossil?', ['Coprolite', 'Pumice', 'Amber'], 'Yes, fossilized poop is real! It shows scientists what dinosaurs ate.'],
    ['Pterosaurs, which flew in the time of the dinosaurs, were they dinosaurs?', ['No, they were flying reptiles, their cousins', 'Yes, dinosaurs with wings', 'They were giant bats'], 'Pterosaurs were close relatives, but they were not dinosaurs. Brazil has beautiful pterosaur fossils in the Chapada do Araripe, in Ceará!'],
    ['Some of the oldest dinosaurs in the world were found in which Brazilian state?', ['Rio Grande do Sul', 'Amazonas', 'Pernambuco'], 'About 230 million years ago, small dinosaurs lived there that are among the very first in history!'],
  ] },
];
const PSP_GRUPOS = [['brasil', '🌎 Brazil'], ['mundo', '✈️ Around the world'], ['mar', '🌊 Sea and space'], ['mv', '🌀 Multiverse, valleys and Jurassic']];
const PSP_POR_ID = Object.fromEntries(PSP_LUGARES.map(L => [L.id, L]));
const PSP_POR_NPC = Object.fromEntries(PSP_LUGARES.map(L => [L.npc, L]));
const PSP_ESPERA = 60000; // errou: tenta de novo depois de 1 minuto
// títulos por marco (só reconhecimento)
const PSP_MARCOS = [
  { n: 5, id: 'viajante', ic: '🧭', nome: 'Savvy Traveler' },
  { n: 15, id: 'explorador', ic: '🗺️', nome: 'Knowledge Explorer' },
  { n: PSP_LUGARES.length, id: 'sabio', ic: '🌍', nome: 'Sage of the Universe', moldura: true },
];

/* ---------- estado ---------- */
function pspEstado() {
  const s = G.save; if (!s) return { c: {}, ate: {}, tit: [] };
  let p = s.passaporte; if (!p || typeof p !== 'object') p = s.passaporte = {};
  if (!p.c || typeof p.c !== 'object') p.c = {}; if (!p.ate || typeof p.ate !== 'object') p.ate = {}; if (!Array.isArray(p.tit)) p.tit = [];
  return p;
}
const pspFeitos = () => PSP_LUGARES.filter(L => pspEstado().c[L.id]).length;
const pspTem = id => !!pspEstado().c[id];
const pspFalta = id => Math.max(0, (pspEstado().ate[id] || 0) - Date.now());
const pspNpcNome = L => ((typeof NPCS !== 'undefined' && NPCS[L.npc] && NPCS[L.npc].nome) || L.npc);
const pspNpcCurto = L => pspNpcNome(L).split(',')[0];
function pspNivelLugar(L) { // nível de chegada (só para mostrar): voo da cidade, planeta, senão o do dado
  try { if (typeof VOOS !== 'undefined' && VOOS[L.id] && VOOS[L.id].lvl > 1) return VOOS[L.id].lvl; } catch (e) { }
  try { if (typeof PLANETAS !== 'undefined') { const pl = PLANETAS.find(x => x.id === L.mapa); if (pl && pl.req) return pl.req; } } catch (e) { }
  return L.lv || 1;
}
function pspTituloAtual() { const n = pspFeitos(); let t = null; for (const m of PSP_MARCOS) if (n >= m.n) t = m; return t; }
// para o Caderno do Craque (caderno.js): % e as próximas coisas fáceis
window.passaporteProgresso = function () { try { return { feitos: G.save ? pspFeitos() : 0, total: PSP_LUGARES.length }; } catch (e) { return { feitos: 0, total: PSP_LUGARES.length }; } };
window.passaporteProximas = function () {
  try {
    const nv = (G.save && G.save.nivel) || 1;
    return PSP_LUGARES.filter(L => !pspTem(L.id) && pspNivelLugar(L) <= nv).sort((a, b) => pspNivelLugar(a) - pspNivelLugar(b)).slice(0, 2)
      .map(L => ({ txt: `🛂 ${L.nome} stamp: 3 questions with ${pspNpcCurto(L)}`, peso: 0.45 }));
  } catch (e) { return []; }
};
// marca as flags das missões de apresentação (psp_c1, psp_c3) conforme o número de carimbos
function pspFlags() { const s = G.save; if (!s || !s.flags) return; const n = pspFeitos(); if (n >= 1) s.flags.psp_c1 = true; if (n >= 3) s.flags.psp_c3 = true; }

/* ---------- o carimbo (desenhado por código) ---------- */
function pspHash(t) { let h = 2166136261; for (const ch of String(t)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function pspRnd(seed) { let a = seed || 1; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function pspTextoArco(x, txt, r, embaixo) {
  const chars = [...txt], ws = chars.map(c => x.measureText(c).width), tot = ws.reduce((a, b) => a + b, 0);
  let a = embaixo ? Math.PI / 2 + tot / (2 * r) : -Math.PI / 2 - tot / (2 * r);
  for (let i = 0; i < chars.length; i++) {
    const da = ws[i] / r, m = embaixo ? a - da / 2 : a + da / 2;
    x.save(); x.rotate(m); x.translate(r, 0); x.rotate(embaixo ? -Math.PI / 2 : Math.PI / 2); x.fillText(chars[i], 0, 0); x.restore();
    a = embaixo ? a - da : a + da;
  }
}
function pspCarimbo(L, feito, tam = 120) {
  const c = document.createElement('canvas'); c.width = c.height = tam; c.className = 'psp-cv';
  const x = c.getContext('2d'), R = tam / 2, rnd = pspRnd(pspHash(L.id));
  x.translate(R, R);
  if (!feito) {
    x.strokeStyle = 'rgba(120,100,70,.45)'; x.lineWidth = 2; x.setLineDash([5, 5]);
    x.beginPath(); x.arc(0, 0, R * 0.86, 0, Math.PI * 2); x.stroke(); x.setLineDash([]);
    x.globalAlpha = 0.28; x.font = `${Math.round(tam * 0.32)}px "Segoe UI Emoji", "Noto Color Emoji", sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
    try { x.filter = 'grayscale(1)'; } catch (e) { } x.fillText(L.ic, 0, 0); x.filter = 'none'; x.globalAlpha = 1;
    return c;
  }
  x.rotate((rnd() - 0.5) * 0.45);
  const tinta = L.cor;
  x.strokeStyle = tinta; x.fillStyle = tinta;
  x.lineWidth = tam * 0.04; x.beginPath(); x.arc(0, 0, R * 0.9, 0, Math.PI * 2); x.stroke();
  x.lineWidth = tam * 0.015; x.beginPath(); x.arc(0, 0, R * 0.62, 0, Math.PI * 2); x.stroke();
  // o nome em volta (em cima) e "PASSAPORTE DO CRAQUE" (embaixo)
  x.textAlign = 'center'; x.textBaseline = 'middle';
  let f = tam * 0.12; const rTxt = R * 0.76, max = Math.PI * rTxt * 0.92;
  const mede = (t, px) => { x.font = `800 ${px}px Fredoka, Nunito, sans-serif`; return x.measureText(t).width; };
  while (f > tam * 0.06 && mede(L.curto, f) > max) f -= 0.5;
  x.font = `800 ${f}px Fredoka, Nunito, sans-serif`; pspTextoArco(x, L.curto, rTxt, false);
  x.font = `700 ${tam * 0.07}px Fredoka, Nunito, sans-serif`; pspTextoArco(x, 'STAR\'S PASSPORT', rTxt, true);
  // estrelinhas dos lados
  for (const s of [-1, 1]) { x.save(); x.translate(s * rTxt, 0); x.font = `${tam * 0.08}px sans-serif`; x.fillText('★', 0, 0); x.restore(); }
  // o ícone no meio
  x.font = `${Math.round(tam * 0.3)}px "Segoe UI Emoji", "Noto Color Emoji", sans-serif`; x.globalAlpha = 0.92; x.fillText(L.ic, 0, -tam * 0.03); x.globalAlpha = 1;
  // a data
  const d = new Date(pspEstado().c[L.id] || Date.now()), dd = n => String(n).padStart(2, '0');
  x.font = `700 ${tam * 0.07}px Fredoka, Nunito, sans-serif`; x.fillText(`${dd(d.getDate())}/${dd(d.getMonth() + 1)}/${String(d.getFullYear()).slice(2)}`, 0, tam * 0.2);
  // falhas de tinta (cara de carimbo de verdade)
  x.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 70; i++) { const a = rnd() * Math.PI * 2, rr = rnd() * R * 0.95; x.globalAlpha = 0.25 + rnd() * 0.6; x.beginPath(); x.arc(Math.cos(a) * rr, Math.sin(a) * rr, 0.6 + rnd() * tam * 0.018, 0, Math.PI * 2); x.fill(); }
  x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
  return c;
}

/* ---------- as 3 perguntas ---------- */
function pspSorteia(L) {
  const p = pspEstado(); p.ult = p.ult && typeof p.ult === 'object' ? p.ult : {};
  const ult = Array.isArray(p.ult[L.id]) ? p.ult[L.id] : [];
  const idx = L.p.map((_, i) => i); for (let i = idx.length - 1; i > 0; i--) { const k = Math.floor(Math.random() * (i + 1)); [idx[i], idx[k]] = [idx[k], idx[i]]; }
  idx.sort((a, b) => ult.includes(a) - ult.includes(b)); // as que não caíram da última vez vêm primeiro
  const tres = idx.slice(0, 3); p.ult[L.id] = tres; return tres;
}
function pspProva(L, npc) {
  if (!G.save) return;
  const pratica = pspTem(L.id);
  if (!pratica && pspFalta(L.id) > 0) return pspEspera(L, npc);
  const qs = pspSorteia(L), certos = [];
  let i = 0;
  const topo = conteudo => el('div', { class: 'npc-topo' }, npc && typeof retratoNPC === 'function' ? retratoNPC(npc) : el('div', { class: 'psp-ic-grande' }, L.ic), el('div', { class: 'fala' }, ...conteudo));
  const pontos = () => el('div', { class: 'psp-pontos' }, ...qs.map((_, k) => el('span', { class: k < certos.length ? (certos[k] ? 'ok' : 'nao') : k === i ? 'agora' : '' }, k < certos.length ? (certos[k] ? '✔' : '✘') : String(k + 1))));
  const mostra = () => {
    const [perg, ops, expl] = L.p[qs[i]], certa = ops[0];
    const emb = [...ops]; for (let k = emb.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [emb[k], emb[j]] = [emb[j], emb[k]]; }
    let resp = false;
    const grade = el('div', { class: 'quiz-op psp-op' }), fim = el('div', { class: 'psp-fim' }), ops2 = el('div', { class: 'opcoes' });
    const responder = (op, b) => {
      if (resp) return; resp = true; window.teclaModal = null;
      const ok = op === certa; certos.push(ok);
      grade.querySelectorAll('button').forEach(x => { x.disabled = true; if (x.dataset.op === certa) x.classList.add('certo'); });
      if (!ok && b) b.classList.add('errado');
      try { som(ok ? 'moeda' : 'erro'); } catch (e) { }
      fim.append(el('p', { class: 'psp-res ' + (ok ? 'ok' : 'nao') }, ok ? '✔ That\'s right!' : `✘ Not this time. The right answer is: ${certa}`), el('p', { class: 'psp-expl' }, '💡 ', expl));
      const ultima = i >= qs.length - 1;
      ops2.append(el('button', { class: 'btn amarelo', type: 'button', onclick: () => { if (ultima) resultado(); else { i++; mostra(); } } }, ultima ? 'See the result' : 'Next question'));
    };
    emb.forEach((op, k) => { const b = el('button', { class: 'btn', type: 'button', 'data-op': op }, `${k + 1}. ${op}`); b.onclick = () => responder(op, b); grade.append(b); });
    window.teclaModal = ev => { const n = '123456789'.indexOf(ev.key); if (n >= 0 && n < grade.children.length && !resp) grade.children[n].click(); };
    abreModal(el('h2', {}, `❓ Passport: ${L.nome}${pratica ? ' (practice)' : ''}`), topo([el('p', { class: 'psp-tema' }, `${L.ic} ${L.tema} · question ${i + 1} of 3`), el('p', { class: 'psp-perg' }, perg)]), pontos(), grade, fim, ops2,
      el('div', { class: 'opcoes' }, el('button', { class: 'btn', type: 'button', onclick: () => { if (!pratica && certos.includes(false)) { pspEstado().ate[L.id] = Date.now() + PSP_ESPERA; salvar(); } fechaModal(); } }, 'Exit')));
  };
  const resultado = () => {
    const n = certos.filter(Boolean).length, tudo = n === qs.length;
    if (pratica) {
      abreModal(el('h2', {}, `❓ Passport: ${L.nome} (practice)`), topo([el('p', {}, tudo ? 'All 3 right again! You really know everything about this place.' : `You got ${n} of 3 right. Read the explanations again and practice whenever you want.`)]), pontos(),
        el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', type: 'button', onclick: () => pspProva(L, npc) }, 'Practice again'), el('button', { class: 'btn', type: 'button', onclick: () => window.abrePassaporte() }, '🛂 See the passport'), el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'Close')));
      return;
    }
    if (!tudo) {
      pspEstado().ate[L.id] = Date.now() + PSP_ESPERA; salvar();
      abreModal(el('h2', {}, `❓ Passport: ${L.nome}`), topo([el('p', {}, `You got ${n} of 3 right. Almost there! To earn the stamp, you need to get all 3 right.`), el('p', {}, 'Read the explanations again, rest for a minute and try once more. The questions change a little each time!')]), pontos(),
        el('div', { class: 'opcoes' }, el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'Deal!')));
      return;
    }
    pspDaCarimbo(L, npc, topo, pontos);
  };
  mostra();
}
function pspEspera(L, npc) {
  const txt = el('b', {}, fmtFalta(pspFalta(L.id)));
  const tm = setInterval(() => { if (!document.body.contains(txt)) return clearInterval(tm); const f = pspFalta(L.id); if (f <= 0) { clearInterval(tm); pspProva(L, npc); return; } txt.textContent = fmtFalta(f); }, 500);
  abreModal(el('h2', {}, `❓ Passport: ${L.nome}`), el('p', {}, `${pspNpcCurto(L)} is getting new questions ready. Come back in `, txt, '.'),
    el('p', { class: 'vazio' }, 'Meanwhile, how about reading the monument\'s sign or taking a walk around the place?'), el('div', { class: 'opcoes' }, el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'OK')));
}
function pspDaCarimbo(L, npc, topo, pontos) {
  const s = G.save, p = pspEstado();
  if (p.c[L.id]) return;
  p.c[L.id] = Date.now(); delete p.ate[L.id];
  const ouro = Math.round(Math.min(2500, 40 + (s.nivel || 1) * 5)); // tostões pequenos (só reconhecimento)
  s.ouro += ouro; G.uiSujo = true;
  pspFlags();
  const n = pspFeitos();
  log(`🛂 PASSPORT STAMP: ${L.nome}! (${n} of ${PSP_LUGARES.length}) +${fmt(ouro)} coins.`, 'l-lvl');
  try { som('nivel'); } catch (e) { }
  const novos = PSP_MARCOS.filter(m => n >= m.n && !p.tit.includes(m.id));
  for (const m of novos) { p.tit.push(m.id); log(`${m.ic} NEW TITLE: ${m.nome}! (${m.n} stamps in the Star's Passport)`, 'l-lendario'); if (m.moldura) log('🛂 Cosmetic unlocked: Traveler Frame (Equipment → ✨ Cosmetics).', 'l-lendario'); }
  try { banner(novos.length ? `${novos[novos.length - 1].ic} ${novos[novos.length - 1].nome}` : `🛂 Stamp: ${L.nome}`, novos.length ? 'New Passport title!' : `${n} of ${PSP_LUGARES.length} stamps`); } catch (e) { }
  salvar();
  const cv = pspCarimbo(L, true, 150); cv.classList.add('psp-bate');
  abreModal(el('h2', {}, `❓ Passport: ${L.nome}`), topo([el('p', {}, 'All 3 right! You learned a ton about this place. Here\'s your stamp!')]), pontos(),
    el('div', { class: 'psp-novo' }, cv, el('div', {}, el('b', {}, `${n} of ${PSP_LUGARES.length} stamps`), el('small', {}, `+${fmt(ouro)} coins`),
      ...novos.map(m => el('div', { class: 'psp-tit-novo' }, `${m.ic} New title: ${m.nome}!`)))),
    el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', type: 'button', onclick: () => window.abrePassaporte() }, '🛂 See the passport'), el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'Close')));
}

/* ---------- a janela do Passaporte ---------- */
let PSP_SEL = null;
function pspComoChegar(L) { // texto curto de como chegar até quem faz as perguntas
  try {
    if (typeof ccRota !== 'function') return '';
    const r = ccRota(L.mapa); if (!r) return '';
    const cam = typeof ccCaminhoTxt === 'function' ? ccCaminhoTxt(r) : '';
    return [r.viagem, cam ? 'Route ' + cam : ''].filter(Boolean).join(' · ');
  } catch (e) { return ''; }
}
window.abrePassaporte = function abrePassaporte() {
  if (!G.save) return;
  const p = pspEstado(), n = pspFeitos(), T = PSP_LUGARES.length, nv = G.save.nivel || 1;
  const tit = pspTituloAtual(), prox = PSP_MARCOS.find(m => n < m.n);
  const cab = el('div', { class: 'psp-cab' },
    el('div', { class: 'psp-conta' }, el('b', {}, `${n} of ${T} stamps`), el('div', { class: 'psp-barra' }, el('i', { style: `width:${Math.round(n / T * 100)}%` }))),
    el('div', { class: 'psp-titulo' }, tit ? `Title: ${tit.ic} ${tit.nome}` : 'No title yet', prox ? el('small', {}, ` · ${prox.n - n} more to ${prox.ic} ${prox.nome}`) : el('small', {}, ' · you completed the passport! 🎉')));
  const det = el('div', { class: 'psp-det' });
  const mostraDet = L => {
    det.innerHTML = '';
    if (!L) { det.append(el('p', { class: 'vazio' }, 'In each place, a local asks 3 questions. Get all 3 right and earn the stamp! Click a stamp to see who to look for.')); return; }
    const tem = !!p.c[L.id], lvL = pspNivelLugar(L);
    det.append(el('b', {}, `${L.ic} ${L.nome} — ${L.tema}`), el('div', {}, `🙋 Who asks: ${pspNpcNome(L)}`));
    if (!tem && lvL > nv) det.append(el('div', {}, `🔒 You'll get there around level ${lvL}.`));
    else { const cc = pspComoChegar(L); if (cc) det.append(el('div', {}, `🧭 ${cc}`)); }
    if (tem) { const q = L.p[pspHash(L.id + (p.c[L.id] || 0) + new Date().getDate()) % L.p.length]; det.append(el('div', { class: 'psp-lembra' }, '💡 You learned: ', q[2])); }
    else if (pspFalta(L.id) > 0) det.append(el('div', {}, `⏳ You can try again in ${fmtFalta(pspFalta(L.id))}.`));
  };
  const paginas = PSP_GRUPOS.map(([g, nomeG]) => {
    const ls = PSP_LUGARES.filter(L => L.grupo === g), ng = ls.filter(L => p.c[L.id]).length;
    return el('div', { class: 'psp-pag' }, el('h3', {}, `${nomeG} `, el('small', {}, `${ng}/${ls.length}`)),
      el('div', { class: 'psp-grade' }, ...ls.map(L => {
        const tem = !!p.c[L.id];
        const card = el('button', { type: 'button', class: 'psp-card' + (tem ? ' tem' : '') + (PSP_SEL === L.id ? ' sel' : ''), title: tem ? `${L.nome}: stamped!` : `${L.nome}: talk to ${pspNpcCurto(L)}` },
          pspCarimbo(L, tem, 96), el('b', {}, L.nome), el('small', {}, tem ? '✔ stamped' : pspNpcCurto(L)));
        card.onclick = () => { PSP_SEL = L.id; document.querySelectorAll('.psp-card.sel').forEach(x => x.classList.remove('sel')); card.classList.add('sel'); mostraDet(L); };
        return card;
      })));
  });
  mostraDet(PSP_SEL && PSP_POR_ID[PSP_SEL]);
  const marcos = el('div', { class: 'psp-marcos' }, ...PSP_MARCOS.map(m => el('span', { class: n >= m.n ? 'ok' : '' }, `${n >= m.n ? m.ic : '🔒'} ${m.nome} (${m.n})${m.moldura ? ' + Traveler Frame' : ''}`)));
  abreModal.largo = true;
  abreModal(el('h2', {}, '🛂 Star\'s Passport'), cab, det, ...paginas, marcos,
    el('p', { class: 'dica' }, 'Each stamp gives you some coins. The titles and the frame are just to show how much you know.'),
    el('div', { class: 'opcoes' }, el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'Close')));
};

/* ---------- o botão na conversa com quem faz as perguntas ---------- */
function pspPoeBotao(npc) {
  if (!npc || !G.save || !G.mapa) return;
  const L = PSP_POR_NPC[npc.id]; if (!L || L.mapa !== G.mapa.id) return;
  const M = document.getElementById('modal'), C = document.getElementById('modalConteudo'); if (!M || M.hidden || !C) return;
  const ops = C.querySelector('.opcoes'); if (!ops || ops.querySelector('.psp-bt')) return;
  const tem = pspTem(L.id), f = pspFalta(L.id);
  const rot = tem ? '🛂 Passport: practice the questions (stamp ✔)' : f > 0 ? `🛂 Passport: 3 questions (back in ${fmtFalta(f)})` : `🛂 Passport: 3 questions about ${L.nome}`;
  const b = el('button', { class: 'btn roxo psp-bt', type: 'button', onclick: () => pspProva(L, npc) }, rot);
  const ult = ops.lastElementChild; if (ult && /Tchau|Um dia eu vou|Fechar/.test(ult.textContent)) ult.before(b); else ops.append(b);
}
// a Dona Zuleide abre a janela dos cartões-postais (vila_nova.js), sem os botões de missão: as missões do Passaporte entram aqui
function pspMissoesZuleide(npc) {
  if (!npc || npc.id !== 'agente_turismo' || !G.save) return;
  const C = document.getElementById('modalConteudo'), ops = C && C.querySelector('.opcoes'); if (!ops || ops.querySelector('.psp-mq')) return;
  const qs = MISSOES.filter(q => q.npc === 'agente_turismo' && /^psp_/.test(q.id));
  const pronta = qs.find(q => statusMissao(q) === 'pronta'), ativa = qs.find(q => statusMissao(q) === 'ativa'), disp = qs.find(q => statusMissao(q) === 'disponivel');
  const poe = b => { b.classList.add('psp-mq'); ops.prepend(b); };
  if (pronta) poe(el('button', { class: 'btn amarelo', type: 'button', onclick: () => { entregaMissao(pronta); abrirNPCDepois(npc, pronta.fim); } }, `Turn in: ${pronta.titulo}`));
  else if (disp) poe(el('button', { class: 'btn amarelo', type: 'button', onclick: () => modalMissao(npc, disp) }, `Mission: ${disp.titulo}`));
  else if (ativa) {
    const fala = C.querySelector('.fala'); const [a, b2] = progressoMissao(ativa);
    if (fala && !fala.querySelector('.psp-mq-linha')) {
      const li = el('div', { class: 'linha-item psp-mq-linha' }, el('div', { class: 'nm' }, el('b', {}, ativa.titulo), el('small', {}, `${descMissao(ativa)} — ${a}/${b2}`)));
      try { const bl = typeof blocoComoChegar === 'function' && blocoComoChegar(ativa, true); if (bl) li.querySelector('.nm').append(bl); } catch (e) { }
      fala.append(li);
    }
  }
}
{
  const _abPsp = abrirNPC;
  abrirNPC = function (npc) {
    const r = _abPsp.apply(this, arguments);
    try { pspMissoesZuleide(npc); } catch (e) { console.warn('passport (missions)', e); }
    try { pspPoeBotao(npc); } catch (e) { console.warn('passaporte', e); }
    return r;
  };
}

/* ---------- missões de apresentação (padrão "📍 Onde achar e como chegar") ---------- */
MISSOES.push(
  { id: 'psp_m1', npc: 'agente_turismo', titulo: '🛂 The Star\'s Passport', lvl: 8, pspOnde: ['agente_turismo'],
    texto: 'Every star who travels learns a little about each place! This is your Star\'s Passport. Get my 3 questions right, here at the Campinho Village Travel Agency, and earn your first stamp.',
    req: { flag: 'psp_c1', desc: 'Earn 1 stamp in the Star\'s Passport (3 questions from Dona Zuleide, in the Village)' },
    rec: { xp: 300, ouro: 80 },
    fim: 'What a pretty stamp! In lots of places around the world, someone has questions for you. Look for the 🛂 button in conversations.' },
  { id: 'psp_m2', npc: 'agente_turismo', titulo: '🛂 Stamps on the road', lvl: 20, pre: 'psp_m1', pspOnde: ['tata', 'ginga'],
    texto: 'Take the passport on the road! Master Tatá, at Footvolley Beach, and Master Ginga, at the City Futsal Courts, also ask questions and give stamps. Collect 3 stamps and come back here to the Travel Agency.',
    req: { flag: 'psp_c3', desc: 'Have 3 stamps in the Passport (Beach: Master Tatá · City: Master Ginga)' },
    rec: { xp: 1500, ouro: 250 },
    fim: '3 stamps! When you fly around the world, every city has its own. With 5 stamps, you earn the title Savvy Traveler!' },
);
// quem procurar agora: o primeiro lugar da missão ainda sem carimbo
function pspOndeNpc(q) { const l = q.pspOnde || []; return l.find(id => { const L = PSP_POR_NPC[id]; return L && !pspTem(L.id); }) || l[l.length - 1]; }
if (typeof ccInfo === 'function') {
  const _ccPsp = ccInfo;
  ccInfo = function (q) {
    try {
      if (q && q.pspOnde) {
        const id = pspOndeNpc(q), a = indice().npc[id];
        if (a && a.mapa) return { quem: NPCS[id] ? NPCS[id].nome : id, npc: id, como: 'asks the 3 Passport questions', mapa: a.mapa, onde: ccNome(a.mapa), parte: ccParte(a.mapa, a.x, a.y), rota: ccRota(a.mapa), lugarDe: true };
      }
    } catch (e) { }
    return _ccPsp.apply(this, arguments);
  };
  if (window.COMO_CHEGAR) window.COMO_CHEGAR.ccInfo = ccInfo;
}
// a seta amarela: missão do passaporte em andamento → quem faz as perguntas
{
  const _oaPsp = objetivoAtual;
  objetivoAtual = function () {
    const r = _oaPsp.apply(this, arguments);
    try {
      const s = G.save; if (!s || !G.guiaOn || (typeof TUTORIAL !== 'undefined' && s.tut < TUTORIAL.length)) return r;
      if (MISSOES.some(q => statusMissao(q) === 'pronta')) return r;
      const q = MISSOES.find(q => statusMissao(q) === 'ativa');
      if (q && q.pspOnde) { const a = alvoNpc(pspOndeNpc(q)); if (a) return a; }
    } catch (e) { }
    return r;
  };
}

/* ---------- adorno: Moldura do Viajante (todos os carimbos; só visual) ---------- */
try {
  if (window.ADORNOS2 && ADORNOS2.OPCOES && ADORNOS2.OPCOES.extra && !ADORNOS2.OPCOES.extra.some(o => o[0] === 'moldura_viajante'))
    ADORNOS2.OPCOES.extra.push(['moldura_viajante', 'Traveler Frame', '🛂', { ok: () => !!G.save && pspFeitos() >= PSP_LUGARES.length, txt: '🔒 All the stamps in the Star\'s Passport' }, 'Your name on a little blue stamp plaque (visual only).']);
} catch (e) { }
if (typeof rotulo === 'function') {
  const _rotPsp = rotulo;
  rotulo = function (ctx, txt, x, y, cor, tam) {
    try {
      const s = G.save;
      if (s && window.ADORNOS2 && txt === `Lv ${s.nivel} ${s.nome}`) {
        const ex = ADORNOS2.atual('extra');
        if (ex.includes('moldura_viajante') && !ex.includes('moldura')) {
          const f = tam * G.dpr; ctx.font = `700 ${f}px Fredoka, Nunito, sans-serif`;
          const w = ctx.measureText(txt).width + f * 1.6, h = f * 1.5, x0 = x - w / 2, y0 = y - f * 1.05;
          ctx.save(); ctx.fillStyle = 'rgba(10,30,70,0.78)'; ctx.beginPath(); ctx.roundRect(x0 - 2, y0 - 2, w + 4, h + 4, 5 * G.dpr); ctx.fill();
          ctx.strokeStyle = '#7ec8ff'; ctx.lineWidth = 2 * G.dpr; ctx.setLineDash([4 * G.dpr, 3 * G.dpr]); ctx.beginPath(); ctx.roundRect(x0, y0, w, h, 4 * G.dpr); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = '#ffd25a'; ctx.font = `${f * 0.7}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('★', x0 + f * 0.45, y0 + h / 2); ctx.fillText('★', x0 + w - f * 0.45, y0 + h / 2);
          ctx.restore();
          return _rotPsp.call(this, ctx, txt, x, y, '#cfe9ff', tam);
        }
      }
    } catch (e) { }
    return _rotPsp.apply(this, arguments);
  };
}

/* ---------- Seu Juca: perguntas de regras e jogo limpo (o quiz sorteia de QUIZ; a 1ª resposta é a certa) ---------- */
if (typeof QUIZ !== 'undefined' && !QUIZ.some(q => q[0].startsWith('How many yellow cards in the same game'))) QUIZ.push(
  ['How many yellow cards in the same game get a player sent off?', ['2', '3', '1', '4']],
  ['Can a team with a player sent off put someone else in their place?', ['No, they play with one player fewer', 'Yes, right away', 'Only at halftime', 'Only if the opponent allows it']],
  ['In which of these plays is there NO offside?', ['Throw-in', 'Long pass to the striker', 'Cross into the box', 'One-Two']],
  ['Can a player in their own team\'s half of the field be offside?', ['No', 'Yes', 'Only if they\'re running', 'Only if they\'re a striker']],
  ['For it to be a goal, how much of the ball has to cross the goal line?', ['The whole ball', 'Half of it', 'Just a little bit', 'Just touching the line is enough']],
  ['The referee stretched both arms forward. What does that mean?', ['Advantage: play goes on', 'End of the game', 'Penalty', 'Substitution']],
  ['The referee raised one arm on a free kick. What does that mean?', ['Indirect free kick', 'Goal disallowed', 'Red card', 'End of the first half']],
  ['A player went down hurt and the other team kicked the ball out. What\'s fair play when the game restarts?', ['Give the ball back to them', 'Take it fast and attack', 'Pretend you didn\'t see', 'Complain to the referee']],
  ['Can the goalkeeper pick up with their hands a ball that a teammate kicked back to them on purpose?', ['No', 'Yes', 'Only outside the box', 'Only in the second half']],
  ['What is the minimum number of players a team needs on the field for the game to go on?', ['7', '9', '5', '11']],
  ['Can you score directly from the kickoff, at the center of the field?', ['Yes, the goal counts', 'No, never', 'Only with a header', 'Only if the goalkeeper lets you']],
  ['What is VAR for?', ['Helping the referee review plays on video', 'Picking the best player of the game', 'Counting the crowd', 'Cutting the grass']],
  ['Faking a foul to trick the referee (diving) gets you what?', ['Yellow card', 'Penalty', 'None', 'A goal']],
  ['On a throw-in, where are the player\'s two feet?', ['On the ground, on the line or outside it', 'In the air', 'Inside the field', 'One on each side of the line, jumping']],
  ['When the ball goes out over the end line after a defender touches it, what is given?', ['Corner kick', 'Goal kick', 'Fullback', 'Penalty']],
  ['What does a player with good sportsmanship do at the end of the game?', ['Shakes hands with the opponents and the referee', 'Leaves without talking to anyone', 'Complains about the result', 'Hides the ball']],
);

/* ---------- menu e começo do jogo ---------- */
function pspMenu() {
  const lista = document.querySelector('#topo .tb-lista');
  if (lista && !document.getElementById('btnPassaporte')) {
    const b = el('button', { class: 'btn', id: 'btnPassaporte', type: 'button', role: 'menuitem', title: 'Star\'s Passport: stamps from the places you know', onclick: () => window.abrePassaporte() }, '🛂 Star\'s Passport');
    const ref = lista.querySelector('#btnCaderno') || lista.querySelector('[data-abre="album"]'); if (ref) ref.after(b); else lista.append(b);
  }
  const grade = document.querySelector('#celMenu .cm-grade');
  if (grade && !document.getElementById('cmPassaporte')) grade.append(el('button', { class: 'btn cm-bt', id: 'cmPassaporte', type: 'button', onclick: () => { if (typeof fechaMenuCel === 'function') fechaMenuCel(); window.abrePassaporte(); } }, el('span', { class: 'cm-ic' }, '🛂'), 'Passport'));
}
try { // o ☰ Menu em grade: o Passaporte no grupo 🏅 Coleção
  if (typeof OPC_GRUPOS !== 'undefined') { const g = OPC_GRUPOS.find(x => x[0] === 'colecao'); if (g && !/passaporte/.test(g[2].source)) g[2] = new RegExp(g[2].source + '|passaporte', g[2].flags); }
} catch (e) { }
{
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(pspMenu, 0)); else setTimeout(pspMenu, 0);
  const _iniPsp = iniciarJogo;
  iniciarJogo = async function () { const r = await _iniPsp.apply(this, arguments); try { pspMenu(); pspFlags(); } catch (e) { } return r; };
  setInterval(() => { try { pspMenu(); } catch (e) { } }, 2000); // (o menu do celular chega depois)
}
{
  const st = document.createElement('style'); st.id = 'passaporte-css';
  st.textContent = `
  .psp-cab { display: flex; flex-wrap: wrap; gap: 6px 16px; align-items: center; margin: 4px 0 8px; }
  .psp-conta { display: flex; align-items: center; gap: 8px; } .psp-barra { width: 160px; max-width: 40vw; height: 10px; border-radius: 6px; background: rgba(0,0,0,.15); overflow: hidden; }
  .psp-barra i { display: block; height: 100%; background: linear-gradient(90deg, #2e9e5a, #f0c030); }
  .psp-titulo { font-weight: 700; } .psp-titulo small { font-weight: 400; opacity: .8; }
  .psp-det { margin: 4px 0 8px; padding: 8px 10px; border-radius: 10px; background: rgba(240,200,80,.14); border-left: 3px solid #d0a020; font-size: 14px; line-height: 1.4; }
  .psp-det .psp-lembra { margin-top: 4px; font-style: italic; }
  .psp-pag { background: #fbf4e2; color: #3a2a1a; border-radius: 12px; padding: 8px 10px 10px; margin: 8px 0; box-shadow: inset 0 0 0 2px #e8d8b0; }
  .psp-pag h3 { margin: 2px 0 6px; font-size: 16px; } .psp-pag h3 small { opacity: .65; font-weight: 400; }
  .psp-grade { display: grid; grid-template-columns: repeat(auto-fill, minmax(108px, 1fr)); gap: 6px; }
  .psp-card { display: flex; flex-direction: column; align-items: center; gap: 1px; background: transparent; border: 2px solid transparent; border-radius: 10px; padding: 4px 2px; cursor: pointer; color: inherit; font: inherit; }
  .psp-card:hover, .psp-card.sel { border-color: #d0a020; background: rgba(208,160,32,.1); }
  .psp-card .psp-cv { width: 84px; height: 84px; } .psp-card b { font-size: 12px; text-align: center; line-height: 1.15; } .psp-card small { font-size: 11px; opacity: .7; text-align: center; line-height: 1.1; }
  .psp-card:not(.tem) b { opacity: .7; }
  .psp-marcos { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0; } .psp-marcos span { padding: 3px 8px; border-radius: 12px; background: rgba(0,0,0,.08); font-size: 13px; } .psp-marcos span.ok { background: #2e9e5a; color: #fff; }
  .psp-tema { font-size: 13px !important; opacity: .8; margin: 0 0 4px; } .psp-perg { font-size: 19px !important; font-weight: 700; }
  .psp-pontos { display: flex; gap: 6px; justify-content: center; margin: 6px 0; } .psp-pontos span { width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; font-weight: 800; background: rgba(0,0,0,.12); font-size: 13px; }
  .psp-pontos span.agora { background: #f0c030; color: #2a1a00; } .psp-pontos span.ok { background: #2e9e5a; color: #fff; } .psp-pontos span.nao { background: #c0302a; color: #fff; }
  .psp-op .btn { white-space: normal; }
  .psp-fim .psp-res { font-weight: 800; margin: 8px 0 2px; } .psp-fim .psp-res.ok { color: #1e8a4a; } .psp-fim .psp-res.nao { color: #c0302a; }
  .psp-fim .psp-expl { margin: 2px 0 6px; padding: 6px 8px; border-radius: 8px; background: rgba(240,200,80,.18); line-height: 1.4; }
  .psp-novo { display: flex; align-items: center; gap: 14px; justify-content: center; margin: 8px 0; } .psp-novo > div { display: flex; flex-direction: column; gap: 2px; }
  .psp-tit-novo { font-weight: 800; color: #b07a00; }
  .psp-ic-grande { font-size: 64px; line-height: 1; }
  .psp-bate { animation: pspBate .55s cubic-bezier(.2,1.6,.4,1) both; } @keyframes pspBate { 0% { transform: scale(2.2) rotate(-20deg); opacity: 0; } 60% { opacity: 1; } 100% { transform: scale(1) rotate(0); opacity: 1; } }
  @media (max-width: 640px) { .psp-grade { grid-template-columns: repeat(auto-fill, minmax(92px, 1fr)); } .psp-card .psp-cv { width: 72px; height: 72px; } .psp-perg { font-size: 17px !important; } }`;
  document.head.append(st);
}
