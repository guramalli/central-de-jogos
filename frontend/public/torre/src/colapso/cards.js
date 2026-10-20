// Colapso (protótipo): as cartas. Cada uma tem um lado bom e, quase sempre, um preço.
// bom/ruim: linhas mostradas na carta (verde / vermelho). peso: chance de aparecer. max: quantas vezes na run.
export const CARDS = {
  contravento: { n: 'Contraventamento', icon: 'escoramento', bom: ['Ventania −30%'], ruim: ['Obra 10% mais lenta'], peso: 3,
    apply: R => { R.m.wind *= 0.7; R.m.speed *= 0.9; } },
  amortecedor: { n: 'Amortecedor de massa', icon: 'amortecedor', bom: ['Ventania −40%'], ruim: [], peso: 1, max: 2,
    apply: R => { R.m.wind *= 0.6; } },
  fachada: { n: 'Fachada aerodinâmica', icon: 'vidroSolar', bom: ['Ventania −25%'], ruim: [], peso: 2, max: 2,
    apply: R => { R.m.wind *= 0.75; } },
  fundacao: { n: 'Fundação profunda', icon: 'estacas', bom: ['Terremoto −30%'], ruim: [], peso: 3,
    apply: R => { R.m.quake *= 0.7; } },
  isoladores: { n: 'Isoladores sísmicos', icon: 'flutuante', bom: ['Terremoto −50%'], ruim: ['Obra 15% mais lenta'], peso: 2,
    apply: R => { R.m.quake *= 0.5; R.m.speed *= 0.85; } },
  aco: { n: 'Estrutura de aço', icon: 'siderurgica', bom: ['Terremoto −25%'], ruim: ['Ventania +15%'], peso: 2,
    apply: R => { R.m.quake *= 0.75; R.m.wind *= 1.15; } },
  nucleo: { n: 'Núcleo de concreto', icon: 'concretoAD', bom: ['Ventania −20%', 'Terremoto −20%'], ruim: ['Obra 20% mais lenta'], peso: 2,
    apply: R => { R.m.wind *= 0.8; R.m.quake *= 0.8; R.m.speed *= 0.8; } },
  concretoAD: { n: 'Concreto de alta resistência', icon: 'argamassa', bom: ['Integridade máxima +25', 'Recupera 25'], ruim: [], peso: 2,
    apply: R => { R.hpMax += 25; R.hp += 25; } },
  reparo: { n: 'Reparo emergencial', icon: 'ferram', bom: ['Recupera 40 de integridade'], ruim: [], peso: 3,
    apply: R => { R.hp = Math.min(R.hpMax, R.hp + 40); } },
  manutencao: { n: 'Equipe de manutenção', icon: 'mestre', bom: ['+0,4 de integridade por segundo'], ruim: [], peso: 2, max: 3,
    apply: R => { R.m.regen += 0.4; } },
  turno: { n: 'Turno da noite', icon: 'turnoNoite', bom: ['Obra 35% mais rápida'], ruim: ['Todo dano +10%'], peso: 2,
    apply: R => { R.m.speed *= 1.35; R.m.dmg *= 1.1; } },
  premold: { n: 'Pré-moldados', icon: 'premold', bom: ['Obra 50% mais rápida'], ruim: ['Ventania +20%'], peso: 2,
    apply: R => { R.m.speed *= 1.5; R.m.wind *= 1.2; } },
  guindaste: { n: 'Guindaste extra', icon: 'guindaste', bom: ['Obra 25% mais rápida'], ruim: [], peso: 2,
    apply: R => { R.m.speed *= 1.25; } },
  barato: { n: 'Material barato', icon: 'reciclagem', bom: ['Obra 30% mais rápida'], ruim: ['Integridade máxima −20'], peso: 2,
    apply: R => { R.m.speed *= 1.3; R.hpMax = Math.max(20, R.hpMax - 20); } },
  mutirao: { n: 'Mutirão', icon: 'mutirao', bom: ['Próximos 5 andares 3× mais rápidos'], ruim: [], peso: 2,
    apply: R => { R.m.rush += 5; } },
  previsao: { n: 'Previsão do tempo', icon: 'projeto', bom: ['Aviso 5 s mais cedo', 'Todo dano −10%'], ruim: [], peso: 1, max: 1,
    apply: R => { R.m.warn += 5; R.m.dmg *= 0.9; } },
  seguro: { n: 'Seguro de obra', icon: 'corretores', bom: ['A próxima ameaça fatal deixa a torre de pé'], ruim: [], peso: 1, max: 2,
    apply: R => { R.m.seguro++; } },
};
export const CARD_IDS = Object.keys(CARDS);

// sorteia 3 cartas diferentes pelo peso, sem passar do máximo de cada uma
export function drawOffer(R) {
  const count = id => R.cards.filter(c => c === id).length;
  let pool = CARD_IDS.filter(id => CARDS[id].max === undefined || count(id) < CARDS[id].max);
  const out = [];
  while (out.length < 3 && pool.length) {
    const tot = pool.reduce((a, id) => a + CARDS[id].peso, 0);
    let x = R.rand() * tot, id = pool[0];
    for (const k of pool) { x -= CARDS[k].peso; if (x <= 0) { id = k; break; } }
    out.push(id); pool = pool.filter(k => k !== id);
  }
  return out;
}
