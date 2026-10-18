// Jocelino — casa_familia.js — a casa da família no terreno do quintal (as reformas da Robin no Stardew): quando o Jocelino
// vira meio-oficial, o Tio Juca escreve; são 6 etapas, cada uma uma obra longa do Jocelino (o laço das empreitas: começar
// com o material e o dinheiro, um dia por ferramenta, terminar), sem pagamento. A cozinha deixa a marmita mais forte, o
// quarto do casal faz acordar com mais energia e a última etapa é a mudança: festa da família, a cama nova e o despertar
// na porta de casa. Até a mudança, a família dorme na casa do Tio Juca.
const CasaFamilia = {
  iniciar(s) { const c = s.casa || {}; G.casa = { aberta: !!c.aberta, etapa: c.etapa || 0, mudou: !!c.mudou }; },
  salvar(s) { s.casa = Object.assign({}, G.casa); },
  tem(n) { return !!G.casa && G.casa.etapa >= n; },
  mudou() { return !!G.casa && G.casa.mudou; },
  porta() { const T = QUINTAL.TERRENO; return { x: T.x + 4, y: T.y + T.h }; },
  abrir() { if (G.casa.aberta) return; G.casa.aberta = true; Empreitas.aceitar('casa_fam_1', G.mochila, G.dinheiro, { familia: true }); },
  // (C16; a solução 7 do teste crítico C: "a plaquinha diz 'Um dia a gente levanta aqui a nossa casa' com a fundação já pronta") A frase
  // da plaquinha do terreno e da casa em obra muda a cada etapa entregue, e diz a etapa seguinte com o preço (o dinheiro com destino).
  FRASES: ['Um dia a gente levanta aqui a nossa casa', 'A fundação é nossa. Agora as paredes!', 'Já dá pra ver os quartos… Falta o telhado',
    'Com telhado, chuva nenhuma molha a gente. Agora a cozinha da Rosa!', 'A Rosa já escolheu onde vai o fogão. Falta o quarto do casal',
    'Só falta o quarto das crianças, e a gente se muda!', 'Agora sim, a gente tem um canto nosso'],
  placa() {
    const L = ECO.casa.etapas, n = G.casa ? Math.min(G.casa.etapa || 0, L.length) : 0, prox = L[n], mil = v => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    if (G.casa && G.casa.mudou) return `A casa da família Santos. "${CasaFamilia.FRASES[L.length]}", diz a Rosa.`;
    // (C16, rodada 1) A etapa da vez já paga e em obra (casaEtapas, cartao.js): a plaquinha diz quantos dias faltam, sem o preço (já
    // pago); antes ela dizia "a próxima etapa: Paredes, Cr$ 3.500" com as Paredes em obra, e "um dia a gente levanta" na fundação em obra.
    const c = typeof casaEtapas === 'function' ? casaEtapas() : null, a = c && c.emObra && c.a && c.a.estado !== 'entregue' ? c.a : null;
    if (a) {
      const falta = Math.max(0, (a.lista || []).length - (a.dias || 0) - (a.trabalhou ? 1 : 0)), cab = !n ? 'O terreno da casa da família.' : `A casa da família: a etapa ${n} de ${L.length} (${L[n - 1].nome}) pronta.`;
      const obra = a.estado === 'pronta' || !falta ? `${c.atual.nome}: obra pronta, é só entregar na plaquinha da obra` : `${c.atual.nome} em obra — faltam ${falta} dia${falta > 1 ? 's' : ''} de trabalho`;
      return `${cab} ${obra}. "${!n ? 'A nossa casa tá saindo do chão!' : CasaFamilia.FRASES[n]}", diz o Tio Juca.`;
    }
    const frase = `"${CasaFamilia.FRASES[n]}", diz o Tio Juca.`;
    if (!n) return `O terreno da casa da família. ${frase}` + (G.casa && G.casa.aberta && prox ? ` A primeira etapa: ${prox.nome}, Cr$ ${mil(prox.dinheiro)} e o material.` : '');
    return `A casa da família: a etapa ${n} de ${L.length} (${L[n - 1].nome}) pronta. ${frase}` + (prox ? ` A próxima etapa: ${prox.nome}, Cr$ ${mil(prox.dinheiro)} e o material (faltam ${L.length - n}).` : '');
  },
};
INICIADORES.push(s => CasaFamilia.iniciar(s));
COLETORES.push(s => CasaFamilia.salvar(s));
// As 6 etapas viram empreitas longas (a plaquinha na grama à esquerda do terreno, logo abaixo da placa antiga; a do lote fica
// em x − 1, então x é o canto do terreno).
ECO.casa.etapas.forEach((F, i) => {
  const T = QUINTAL.TERRENO, n = i + 1;
  EMPREITAS_EXTRAS['casa_fam_' + n] = { nome: `A casa da família: ${F.nome}`, cliente: 'juca', mapa: 'quintal', x: T.x, y: T.y + 4, material: Object.assign({}, F.material),
    etapas: F.etapas.slice(), paga: 0, custo: F.dinheiro, funcaoMin: 1, tipo: 'longa', dias: F.etapas.length, vezesDia: 3, ferramenta: F.etapas[0], artes: ['objetos/vala', 'objetos/alicerce'], familia: n };
});
CARTAS.casa_familia = { de: 'Tio Juca', dia: 1e9, aoLer: () => CasaFamilia.abrir(),
  texto: 'Jocelino, meio-oficial! Tô orgulhoso. Aquele terreno marcado do lado da minha casa é de vocês: tá na hora de levantar um teto de vocês. São seis etapas, do alicerce ao quarto das crianças; cada uma custa o material e um dinheirinho, e quem levanta é você. A plaquinha já tá lá. — Tio Juca' };
MANHA.push(() => { if (G.casa && !G.casa.aberta && G.obra && G.obra.funcao >= 1 && !G.correio.caixa.includes('casa_familia') && !G.correio.lidas.includes('casa_familia')) G.correio.caixa.push('casa_familia'); });
// A etapa entregue: anota, reserva a próxima e, na última, a mudança.
AO_ENTREGAR.push((id, q) => {
  const E = dadosEmpreita(id); if (!E || typeof E.familia !== 'number') return '';   // só as etapas da casa (os aluguéis têm o gancho deles)
  G.casa.etapa = Math.max(G.casa.etapa, E.familia);
  if (E.familia < ECO.casa.etapas.length) { Empreitas.aceitar('casa_fam_' + (E.familia + 1), G.mochila, G.dinheiro, { familia: true }); if (MAPAS.quintal) poeCasaFamilia(MAPAS.quintal); return `A casa da família ganhou: ${ECO.casa.etapas[E.familia - 1].nome}.`; }
  // (T1 das conversas) A família não tem número de amizade: a mudança é carinho, numa fala (antes, +2 para cada um).
  G.casa.mudou = true;
  if (MAPAS.quintal) poeCasaFamilia(MAPAS.quintal);
  // (T15, rodada 1) a festa da mudança é a cena "Casa nossa" (historias/atos.js), na 1ª noite em casa: aqui só a mudança
  return 'A família se mudou para a casa nova! As crianças ganharam o quarto delas, e a Rosa já está pensando na primeira janta lá.';
});
// Save antigo: o que o jogador pôs ou plantou no terreno da obra da família volta para a mochila antes do prédio subir
// (a cerca, o irrigador; a cova plantada devolve a semente).
function liberaTerreno(b, r) {
  for (const c of G.horta.colocados.filter(c => dentroR(r, c.x, c.y))) {
    G.horta.colocados = G.horta.colocados.filter(k => k !== c);
    const o = b && b.objs.find(q => q.cx === c.x && q.cy === c.y); if (o) b.tirar(o);
    const sobra = G.mochila.adicionar(c.id, 1); if (sobra && b === G.mapa && G.jog) soltar(c.id, sobra, G.jog.x, G.jog.y);
    avisar(`${Itens.nome(c.id)} saiu do terreno da obra e voltou para a mochila.`);
  }
  for (const k of Object.keys(G.horta.covas)) {
    const [x, y] = k.split(',').map(Number); if (!dentroR(r, x, y)) continue;
    const cv = G.horta.covas[k]; delete G.horta.covas[k];
    if (cv.planta && CULTURAS[cv.planta]) G.mochila.adicionar(CULTURAS[cv.planta].semente, 1);
  }
}
// A casa no terreno: a arte da etapa entregue; depois da mudança, a porta dá para dormir.
function poeCasaFamilia(b) {
  if (!b || b.id !== 'quintal' || !G.casa) return;
  const velha = b.objs.find(o => o.id === 'casa_familia'); if (velha) b.tirar(velha);
  if (G.casa.etapa < 1) return;
  const T = QUINTAL.TERRENO;
  liberaTerreno(b, T);
  for (let y = T.y; y < T.y + T.h; y++) for (let x = T.x; x < T.x + T.w; x++) { const o = b.ocupado.get(chaveT(x, y)); if (o && o.tipo === 'detrito') b.tirar(o); }
  const o = b.interativo('casa_familia', 'objetos/casa_familia_' + Math.min(6, G.casa.etapa), T.x, T.y + T.h - 1, 8, 4, [150, 40]);
  o.acao = () => G.casa.mudou ? (typeof entrarEmCasa === 'function' ? entrarEmCasa('casa_familia_dentro') : true) : abrirPlaca(CasaFamilia.placa());
}
AO_MONTAR.push(b => poeCasaFamilia(b));
// Os aluguéis (depois da mudança): o quartinho e a casa de aluguel, cada um uma obra do Jocelino com custo; o aluguel cai no
// domingo à noite, uma vez.
for (const k of ['quartinho', 'casa']) {
  const A = ECO.alugueis[k], R = QUINTAL.ALUGUEIS[k];
  EMPREITAS_EXTRAS['aluguel_' + k] = { nome: A.nome, cliente: 'juca', mapa: 'quintal', x: R.x, y: R.y + R.h, material: Object.assign({}, A.material), etapas: A.etapas.slice(),   // a plaquinha na grama, logo abaixo do canto esquerdo
    paga: 0, custo: A.dinheiro, funcaoMin: 1, tipo: 'longa', dias: A.etapas.length, vezesDia: 3, ferramenta: A.etapas[0], artes: ['objetos/vala', 'objetos/alicerce'], familia: k };
}
const Alugueis = {
  iniciar(s) { const a = s.alugueis || {}; G.alugueis = { quartinho: !!a.quartinho, casa: !!a.casa, pagoDia: a.pagoDia || 0 }; },
  salvar(s) { s.alugueis = Object.assign({}, G.alugueis); },
  semana() { const v = (G.alugueis.quartinho ? ECO.alugueis.quartinho.semana : 0) + (G.alugueis.casa ? ECO.alugueis.casa.semana : 0);
    return Math.round(v * (typeof Habilidades !== 'undefined' && Habilidades.tem('patrao') ? ECO.alugueis.patrao : 1)); },
  noite(linhas) {
    if ((G.dia - 1) % 7 !== 6 || G.alugueis.pagoDia === G.dia) return;
    const v = Alugueis.semana(); if (!v) return;
    G.alugueis.pagoDia = G.dia; G.dinheiro += v; G.ganhoHoje += v; linhas.push(`O aluguel da semana: Cr$ ${v}.`);
  },
};
INICIADORES.push(s => Alugueis.iniciar(s));
COLETORES.push(s => Alugueis.salvar(s));
NOITE.push(linhas => { if (G.alugueis) Alugueis.noite(linhas); });
// Na mudança, as duas obras ficam reservadas (a plaquinha aparece); entregue, o prédio fica no quintal.
AO_ENTREGAR.push(id => {
  const E = dadosEmpreita(id); if (!E || !E.familia) return '';
  if (E.familia === ECO.casa.etapas.length) { for (const k of ['quartinho', 'casa']) Empreitas.aceitar('aluguel_' + k, G.mochila, G.dinheiro, { familia: true }); return 'No quintal ainda cabem um quartinho e uma casa de aluguel: as plaquinhas estão lá.'; }
  if (E.familia === 'quartinho' || E.familia === 'casa') { G.alugueis[E.familia] = true; if (MAPAS.quintal) poeAlugueis(MAPAS.quintal); return `${E.nome} pronto: o aluguel cai todo domingo à noite.`; }
  return '';
});
function poeAlugueis(b) {
  if (!b || b.id !== 'quintal' || !G.alugueis) return;
  for (const k of ['quartinho', 'casa']) {
    const velho = b.objs.find(o => o.id === 'aluguel_' + k); if (velho) b.tirar(velho);
    if (!G.alugueis[k]) continue;
    const A = ECO.alugueis[k], R = QUINTAL.ALUGUEIS[k];
    liberaTerreno(b, R);
    for (let y = R.y; y < R.y + R.h; y++) for (let x = R.x; x < R.x + R.w; x++) { const o = b.ocupado.get(chaveT(x, y)); if (o && o.tipo === 'detrito') b.tirar(o); }
    b.interativo('aluguel_' + k, A.arte, R.x, R.y + R.h - 2, A.w, A.h - 1, [A.w * 18, 30]).acao = () => abrirPlaca(`${A.nome}: Cr$ ${ECO.alugueis[k].semana} por semana.`);
  }
}
AO_MONTAR.push(b => poeAlugueis(b));
