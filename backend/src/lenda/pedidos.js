// ===== Lenda do Campinho — PEDIDO REPETIDO na feira (v411.4, revisão de 07/10/2026) =====
//
// Problema: a internet cai DEPOIS que o servidor já comprou/cancelou/recolheu — o jogo não recebe a resposta e não
// sabe que deu certo (o item comprado não chega, o item cancelado some, os tostões recolhidos não entram).
// Solução sem coluna nova no banco: o jogo manda um `pedido` (código aleatório) em cada compra/cancelamento/recolha
// e, se a requisição falhar pela rede, REPETE com o MESMO pedido. Aqui o servidor lembra, por PEDIDO_TTL_MS, a
// resposta de cada pedido já feito e devolve a MESMA resposta sem fazer de novo. Se a primeira ainda está sendo
// feita, a repetição espera por ela. Resposta de erro do servidor (5xx) não fica guardada: nada foi feito
// (a compra roda numa transação), então a repetição tenta de verdade.
// Limite (documentado): a memória some quando o servidor reinicia (1–2 min, em horário vazio). Uma repetição que
// chegue DEPOIS de um reinício é tratada como pedido novo — as travas de sempre continuam valendo (não vende duas
// vezes a mesma unidade, não devolve duas vezes o mesmo anúncio). Para guardar no banco, ver MIGRACAO_PEDIDO abaixo.
const RE_PEDIDO = /^[A-Za-z0-9_-]{8,40}$/;
export const PEDIDO_TTL_MS = 10 * 60_000;

// (só se um dia quiserem o pedido no banco — NÃO aplicado; decidir com o dono)
//   model LendaVenda { ... pedido String? @unique }   → a compra grava o pedido junto com a venda; a repetição
//   procura a venda pelo pedido e devolve a resposta. Para cancelar/recolher precisaria de uma tabela
//   LendaPedido { chave String @id, resposta Json, criadoEm DateTime @default(now()) } limpa a cada dia.
export const MIGRACAO_PEDIDO = "LendaVenda.pedido String? @unique (+ tabela LendaPedido para cancelar/recolher)";

export function criaPedidos({ ttlMs = PEDIDO_TTL_MS, max = 20_000, agora = () => Date.now() } = {}) {
  const mapa = new Map(); // chave -> { em, pronto: Promise<{ status, body } | null> }

  const limpa = (t) => {
    if (mapa.size <= max) return;
    for (const [k, e] of mapa) if (t - e.em > ttlMs) mapa.delete(k);
    if (mapa.size > max) { let sobra = mapa.size - Math.floor(max * 0.9); for (const k of mapa.keys()) { if (sobra-- <= 0) break; mapa.delete(k); } }
  };

  // middleware de uma rota (depois do login): sem `pedido` no corpo, segue como antes (jogo antigo)
  function umaVez(nome) {
    return async (req, res, next) => {
      const p = req.body?.pedido;
      if (p == null) return next();
      if (typeof p !== "string" || !RE_PEDIDO.test(p)) return res.status(400).json({ error: "Pedido inválido." });
      const chave = `${nome}:${req.user.id}:${req.params.id || ""}:${p}`;
      for (;;) {
        const e = mapa.get(chave);
        if (!e || agora() - e.em > ttlMs) break;
        const r = await e.pronto;
        if (r) { res.set("X-Pedido-Repetido", "1"); return res.status(r.status).json(r.body); }
        if (mapa.get(chave) === e) mapa.delete(chave); // a primeira deu erro: faz de verdade (o primeiro que chegar)
      }
      let fim; const ent = { em: agora(), pronto: new Promise((ok) => { fim = ok; }) };
      mapa.set(chave, ent); limpa(ent.em);
      let feito = false;
      const solta = (r) => { if (feito) return; feito = true; if (!r && mapa.get(chave) === ent) mapa.delete(chave); fim(r); };
      const json0 = res.json.bind(res);
      res.json = (body) => { solta(res.statusCode >= 500 ? null : { status: res.statusCode, body }); return json0(body); };
      res.on("close", () => solta(null));
      next();
    };
  }
  return { umaVez, tamanho: () => mapa.size };
}
