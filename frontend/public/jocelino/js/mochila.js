// Jocelino — mochila.js — tradução de jogo/nucleo/mochila.gd.
// Mochila de 36 espaços; os 12 primeiros são a barra. `mao` é a pilha presa ao mouse.
// Cada espaço é null ou {id, qtd}. Nenhuma operação perde ou duplica item.

class Mochila {
  static TAM = 36;
  static BARRA = 12;
  constructor() { this.slots = new Array(Mochila.TAM).fill(null); this.mao = null; }

  // Põe itens (junta nas pilhas, depois nos vazios). Devolve o que não coube.
  adicionar(id, qtd) {
    let resta = qtd;
    const max = Itens.pilha(id);
    for (let i = 0; i < Mochila.TAM && resta > 0; i++) {
      const s = this.slots[i];
      if (s && s.id === id && s.qtd < max) { const cabe = Math.min(max - s.qtd, resta); s.qtd += cabe; resta -= cabe; }
    }
    for (let i = 0; i < Mochila.TAM && resta > 0; i++) {
      if (!this.slots[i]) { const cabe = Math.min(max, resta); this.slots[i] = { id, qtd: cabe }; resta -= cabe; }
    }
    return resta;
  }
  // Tab do Stardew: as fileiras de 12 giram; a de baixo vira a barra.
  girarFileiras(sentido = 1) {
    const f = [];
    for (let k = 0; k < Mochila.TAM / 12; k++) f.push(this.slots.slice(k * 12, k * 12 + 12));
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
  idEm(i) { return (i >= 0 && i < Mochila.TAM && this.slots[i]) ? this.slots[i].id : ''; }
  // Clique esquerdo num espaço: pega a pilha, solta, junta ou troca.
  clicar(i) {
    if (i < 0 || i >= Mochila.TAM) return;
    const s = this.slots[i];
    if (!this.mao) { if (s) { this.mao = s; this.slots[i] = null; } return; }
    if (!s) { this.slots[i] = this.mao; this.mao = null; return; }
    if (s.id === this.mao.id) {
      const cabe = Math.min(Itens.pilha(s.id) - s.qtd, this.mao.qtd);
      if (cabe > 0) { s.qtd += cabe; this.mao.qtd -= cabe; if (this.mao.qtd <= 0) this.mao = null; return; }
    }
    this.slots[i] = this.mao; this.mao = s;
  }
  // Clique direito: pega um da pilha para a mão.
  clicarDireito(i) {
    if (i < 0 || i >= Mochila.TAM || !this.slots[i]) return;
    const s = this.slots[i];
    if (!this.mao) this.mao = { id: s.id, qtd: 1 };
    else if (this.mao.id === s.id && this.mao.qtd < Itens.pilha(s.id)) this.mao.qtd++;
    else return;
    if (--s.qtd <= 0) this.slots[i] = null;
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
    for (let i = 0; i < Mochila.TAM && resta > 0; i++) {
      const s = this.slots[i];
      if (s && s.id === id) { const tira = Math.min(resta, s.qtd); s.qtd -= tira; resta -= tira; if (s.qtd <= 0) this.slots[i] = null; }
    }
    return qtd - resta;
  }
  paraDict() { return { slots: this.slots.map(s => s ? { id: s.id, qtd: s.qtd } : null), mao: this.mao }; }
  // Ao carregar, o que estava na mão volta para a mochila.
  deDict(d) {
    this.slots = new Array(Mochila.TAM).fill(null);
    (d && d.slots || []).slice(0, Mochila.TAM).forEach((s, i) => { if (s && Itens.existe(s.id)) this.slots[i] = { id: s.id, qtd: s.qtd | 0 }; });
    this.mao = d && d.mao ? { id: d.mao.id, qtd: d.mao.qtd | 0 } : null;
    this.guardarMao();
  }
}
