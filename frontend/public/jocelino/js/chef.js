// Jocelino — chef.js — a Rosa como chef (pedido do jogador: "as receitas são aprendidas conforme o chef evolui"): ela
// ganha experiência a cada prato que sai da cozinha; cada nível (1 a 10) dá preparo mais rápido e, nos níveis 3, 6 e 9,
// mais uma boca no fogão (como os preparos simultâneos do Bancho, 3 → 5) e uma receita inventada por ela.
// Regras puras (testadas na s1); o aviso e a fanfarra ficam em pensao_tela.js.

const Chef = {
  NIVEL_MAX: 10,
  NIVEIS_INVENTA: [3, 6, 9],
  xpPara(nivel) { return Math.round(ECO.chef.xpBase * Math.pow(ECO.chef.xpCresce, nivel - 1)); },
  bocas(p) { return Math.min(5, 2 + Math.floor((p.chef ? p.chef.nivel : 1) / 3)); },
  preparo(p) { return 1 - ECO.chef.preparoPorNivel * ((p.chef ? p.chef.nivel : 1) - 1); },
  // Soma a experiência de n pratos; devolve {subiu: novo nível ou 0, inventou: [receitas]}.
  ganhar(p, n) {
    const c = p.chef, r = { subiu: 0, inventou: [] };
    c.xp += n;
    while (c.nivel < Chef.NIVEL_MAX && c.xp >= Chef.xpPara(c.nivel)) {
      c.xp -= Chef.xpPara(c.nivel); c.nivel++; r.subiu = c.nivel;
      if (Chef.NIVEIS_INVENTA.includes(c.nivel)) { const id = Chef.receitaNova(p, 'chef'); if (id) { p.receitas.push(id); r.inventou.push(id); } }
    }
    return r;
  },
  // A próxima receita que alguém (a Rosa ou um ajudante) ensina: a de menor raridade que ainda não está no caderno.
  receitaNova(p, quem) {
    const lista = Object.keys(typeof RECEITAS_NOVAS !== 'undefined' ? RECEITAS_NOVAS : {}).filter(id => !p.receitas.includes(id) && RECEITAS_NOVAS[id].caminho === quem);
    lista.sort((a, b) => (RECEITAS_NOVAS[a].raridade || Pratos.PRATOS[a].fase || 1) - (RECEITAS_NOVAS[b].raridade || Pratos.PRATOS[b].fase || 1));
    return lista[0] || '';
  },
};
