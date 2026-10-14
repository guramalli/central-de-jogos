// Jocelino — mochila.js — tradução de jogo/nucleo/mochila.gd.
// O tamanho é de cada uma: a mochila do Jocelino tem 48 espaços (4 fileiras; a de couro do Bazar, 60) e o baú, 36.
// Os 12 primeiros são a barra. `mao` é a pilha presa ao mouse. Cada espaço é null ou {id, qtd}.
// Nenhuma operação perde ou duplica item.

class Mochila {
  static BARRA = 12;
  static BAU = 36;        // o baú (bau.js)
  static JOGADOR = 48;    // a mochila do Jocelino desde o começo (14/10, o jogador: "está faltando espaço toda hora")
  constructor(tam = Mochila.BAU) { this.slots = new Array(tam).fill(null); this.mao = null; }
  // O tamanho é o dos espaços (quem troca os espaços leva o tamanho junto).
  get tam() { return this.slots.length; }
  // A mochila maior: ganha os espaços novos vazios no fim (nunca encolhe).
  crescer(tam) { while (this.slots.length < tam) this.slots.push(null); }

  // Põe itens (junta nas pilhas, depois nos vazios). Devolve o que não coube.
  adicionar(id, qtd) {
    let resta = qtd;
    const max = Itens.pilha(id);
    for (let i = 0; i < this.tam && resta > 0; i++) {
      const s = this.slots[i];
      if (s && s.id === id && s.qtd < max) { const cabe = Math.min(max - s.qtd, resta); s.qtd += cabe; resta -= cabe; }
    }
    for (let i = 0; i < this.tam && resta > 0; i++) {
      if (!this.slots[i]) { const cabe = Math.min(max, resta); this.slots[i] = { id, qtd: cabe }; resta -= cabe; }
    }
    return resta;
  }
  // Tab do Stardew: as fileiras de 12 giram; a de baixo vira a barra.
  girarFileiras(sentido = 1) {
    const f = [];
    for (let k = 0; k < this.tam / 12; k++) f.push(this.slots.slice(k * 12, k * 12 + 12));
    if (sentido > 0) f.push(f.shift()); else f.unshift(f.pop());
    this.slots = f.flat();
  }
  cabe(id) { const max = Itens.pilha(id); return this.slots.some(s => !s || (s.id === id && s.qtd < max)); }
  total(id) {
    let n = 0;
    for (const s of this.slots) if (s && s.id === id) n += s.qtd;
    if (this.mao && this.mao.id === id) n += this.mao.qtd;
    return n;
  }
  idEm(i) { return (i >= 0 && i < this.tam && this.slots[i]) ? this.slots[i].id : ''; }
  // Clique esquerdo num espaço: pega a pilha, solta, junta ou troca.
  clicar(i) {
    if (i < 0 || i >= this.tam) return;
    const s = this.slots[i];
    if (!this.mao) { if (s) { this.mao = s; this.slots[i] = null; } return; }
    if (!s) { this.slots[i] = this.mao; this.mao = null; return; }
    if (s.id === this.mao.id) {
      const cabe = Math.min(Itens.pilha(s.id) - s.qtd, this.mao.qtd);
      if (cabe > 0) { s.qtd += cabe; this.mao.qtd -= cabe; if (this.mao.qtd <= 0) this.mao = null; return; }
    }
    this.slots[i] = this.mao; this.mao = s;
  }
  // Arrastar do espaço `de` e soltar no `para` (o Stardew): junta se for o mesmo item (o que não cabe fica onde estava);
  // senão, troca os dois de lugar.
  mover(de, para) {
    if (de === para || de < 0 || para < 0 || de >= this.tam || para >= this.tam || !this.slots[de]) return false;
    const a = this.slots[de], b = this.slots[para];
    if (b && b.id === a.id) {
      const cabe = Math.min(Itens.pilha(a.id) - b.qtd, a.qtd);
      if (cabe > 0) { b.qtd += cabe; a.qtd -= cabe; if (a.qtd <= 0) this.slots[de] = null; return true; }
    }
    this.slots[para] = a; this.slots[de] = b;
    return true;
  }
  // Clique direito: pega um da pilha para a mão.
  clicarDireito(i) {
    if (i < 0 || i >= this.tam || !this.slots[i]) return;
    const s = this.slots[i];
    if (!this.mao) this.mao = { id: s.id, qtd: 1 };
    else if (this.mao.id === s.id && this.mao.qtd < Itens.pilha(s.id)) this.mao.qtd++;
    else return;
    if (--s.qtd <= 0) this.slots[i] = null;
  }
  // O botão "Organizar" (o Stardew): junta as pilhas do mesmo item e ordena as fileiras 2 em diante por tipo e, no tipo,
  // por nome. A barra (fileira 1) não muda. A pilha da mão entra junto, se couber.
  organizar() {
    const juntar = lista => {
      const soma = new Map();
      for (const s of lista) soma.set(s.id, (soma.get(s.id) || 0) + s.qtd);
      const pilhas = [];
      for (const [id, n] of soma) { const max = Itens.pilha(id); for (let r = n; r > 0; r -= max) pilhas.push({ id, qtd: Math.min(max, r) }); }
      const nome = id => Itens.nome(id).toLocaleLowerCase('pt-BR');
      return pilhas.sort((a, b) => Mochila.tipo(a.id) - Mochila.tipo(b.id) || nome(a.id).localeCompare(nome(b.id), 'pt-BR') || b.qtd - a.qtd);
    };
    const resto = this.slots.slice(Mochila.BARRA).filter(Boolean), lugar = this.tam - Mochila.BARRA;
    let pilhas = juntar(this.mao ? resto.concat([this.mao]) : resto), levouMao = !!this.mao;
    if (pilhas.length > lugar) { pilhas = juntar(resto); levouMao = false; }
    if (pilhas.length > lugar) return false;   // (pilha acima do limite, que o jogo não faz: melhor não mexer que perder)
    for (let i = 0; i < lugar; i++) this.slots[Mochila.BARRA + i] = pilhas[i] || null;
    if (levouMao) this.mao = null;
    return true;
  }
  // Guarda a mão de volta; devolve a pilha que não coube (para cair no chão) ou null.
  guardarMao() {
    if (!this.mao) return null;
    const sobra = this.adicionar(this.mao.id, this.mao.qtd);
    const resto = sobra > 0 ? { id: this.mao.id, qtd: sobra } : null;
    this.mao = null;
    return resto;
  }
  espacoPara(id) {
    const max = Itens.pilha(id);
    let n = 0;
    for (const s of this.slots) n += !s ? max : (s.id === id ? max - s.qtd : 0);
    return n;
  }
  // Tira até `qtd` desse item dos espaços (não mexe na mão). Devolve quanto tirou.
  remover(id, qtd) {
    let resta = qtd;
    for (let i = 0; i < this.tam && resta > 0; i++) {
      const s = this.slots[i];
      if (s && s.id === id) { const tira = Math.min(resta, s.qtd); s.qtd -= tira; resta -= tira; if (s.qtd <= 0) this.slots[i] = null; }
    }
    return qtd - resta;
  }
  paraDict() { return { slots: this.slots.map(s => s ? { id: s.id, qtd: s.qtd } : null), mao: this.mao }; }
  // Ao carregar, o que estava na mão volta para a mochila. O save menor (a mochila de 36 de antes) ganha os espaços novos
  // vazios; o maior (a de couro) fica com todos os dele.
  deDict(d) {
    const salvos = (d && d.slots) || [];
    this.slots = new Array(Math.max(this.tam, salvos.length)).fill(null);
    salvos.forEach((s, i) => { if (s && Itens.existe(s.id)) this.slots[i] = { id: s.id, qtd: s.qtd | 0 }; });
    this.mao = d && d.mao ? { id: d.mao.id, qtd: d.mao.qtd | 0 } : null;
    this.guardarMao();
  }
}
// O tipo do item, na ordem do "Organizar": 0 ferramentas, 1 materiais de obra, 2 comida e ingredientes, 3 sementes e horta,
// 4 peixes, 5 outros.
const MATERIAIS_OBRA = new Set(['fibra', 'madeira', 'madeira_lei', 'pedra', 'cimento', 'tijolo', 'vergalhao', 'cadeado', 'cal', 'impermeabilizante',
  'acelerador', 'tinta', 'pigmento', 'pedra_pigmento', 'ladrilho', 'ferro_velho', 'barra_ferro', 'sucata_aco', 'barra_aco', 'bronze_velho', 'barra_bronze',
  'telha', 'bloco_concreto', 'lajota', 'manilha', 'manta', 'manta_boa', 'ripa', 'entulho', 'areia', 'massa']);
Mochila.tipo = id => {
  if (Itens.ehFerramenta(id)) return 0;
  if (typeof DADOS_PEIXE !== 'undefined' && DADOS_PEIXE[id]) return 4;
  if (typeof CULTURAS !== 'undefined' && (CULTURAS[id] || (typeof culturaDaSemente === 'function' && culturaDaSemente(id)))) return 3;
  if (/^semente_/.test(id) || id === 'esterco') return 3;
  if (MATERIAIS_OBRA.has(id)) return 1;
  if (Itens.energia(id) > 0 || /^prato_/.test(id) || (typeof Pratos !== 'undefined' && Pratos.INGREDIENTES && Pratos.INGREDIENTES[id])) return 2;
  return 5;
};
