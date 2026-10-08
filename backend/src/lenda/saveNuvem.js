// ===== Lenda do Campinho — regras do SAVE NA NUVEM (PUT /api/lenda/save) =====
//
// v411.4 (revisão de 07/10/2026), sem coluna nova no banco:
//   1) FECHANDO A PÁGINA: o jogo manda o último pacote ao fechar/esconder a aba (fetch keepalive). Antes caía quase
//      sempre dentro dos 10 s de um envio normal → 429 → o último progresso se perdia. Agora o envio marcado
//      `fechando: true` passa com 1,5 s do último gravado — com um teto por conta (FECHANDO_MAX em FECHANDO_JANELA_MS),
//      para ninguém usar o "fechando" para gravar sem limite. Fora do teto, vale a regra normal de 10 s.
//   2) ORDEM: um envio mais VELHO que chega depois não pode apagar um mais novo. O jogo manda `salvoEm` (a hora do
//      salvamento, sempre crescente dentro da mesma página) e `sessao` (um código por página aberta). O servidor guarda,
//      em memória, o último salvoEm aceito de cada conta e responde 409 { velho: true } SEM gravar quando chega um
//      salvoEm menor da MESMA sessão. Entre sessões (outro aparelho, outra aba) não compara: o relógio de cada aparelho
//      é diferente e um relógio adiantado travaria o save do outro — esse caso já é tratado pelo jogo (sessao_unica.js).
//      Os envios de uma conta passam um de cada vez (fila por conta), então dois PUT ao mesmo tempo não se atropelam.
//   Servidor reiniciou (memória vazia): o primeiro envio de cada conta é aceito como antes (sem comparar ordem) —
//   seguro, porque o reinício leva 1–2 min e envios fora de ordem só acontecem com segundos de diferença.
//   Jogo antigo (sem salvoEm/sessao): funciona como antes.
//   (A fila e a memória valem para UM servidor — o Render roda uma instância; o mundo online também depende disso.)
import { validarSave } from "./validar.js";

export const SAVE_INTERVALO_MS = 10_000;
export const FECHANDO_INTERVALO_MS = 1_500;
export const FECHANDO_JANELA_MS = 10 * 60_000;
export const FECHANDO_MAX = 30; // envios "fechando" que furam os 10 s, por conta, a cada 10 min (trocar de aba conta)
const ESQUECER_MS = 60 * 60_000; // ordem de 1 h atrás não importa mais (nenhum envio fica 1 h no caminho)
const RE_SESSAO = /^[A-Za-z0-9_-]{6,40}$/;

// O que o jogo manda sobre a ordem. Valor estranho = ignorado (como se fosse o jogo antigo).
export function ordemDoCorpo(body) {
  const b = body || {};
  const salvoEm = Number.isSafeInteger(b.salvoEm) && b.salvoEm > 0 && b.salvoEm < 1e14 ? b.salvoEm : null;
  const sessao = typeof b.sessao === "string" && RE_SESSAO.test(b.sessao) ? b.sessao : null;
  return { salvoEm, sessao, fechando: b.fechando === true };
}

export function criaGuardaSave({ agora = () => Date.now(), maxContas = 50_000 } = {}) {
  const ultimo = new Map(); // userId -> { sessao, salvoEm, em, fechandos: [hora, ...] }
  const filas = new Map(); // userId -> fim da fila (promessa)

  // um envio de cada vez por conta
  function emFila(chave, fn) {
    const antes = filas.get(chave) || Promise.resolve();
    const p = antes.then(fn);
    const cauda = p.then(() => {}, () => {});
    filas.set(chave, cauda);
    cauda.then(() => { if (filas.get(chave) === cauda) filas.delete(chave); });
    return p;
  }

  const fechandosRecentes = (u, t) => (u ? u.fechandos.filter((h) => t - h < FECHANDO_JANELA_MS) : []);

  // pode gravar? `gravadoEm` = atualizadoEm do save que está no banco (ms) ou null se não tem save
  function decide(userId, ordem, gravadoEm) {
    const t = agora(), u = ultimo.get(userId);
    if (u && t - u.em < ESQUECER_MS && ordem.sessao && ordem.salvoEm != null && u.sessao === ordem.sessao && u.salvoEm != null && ordem.salvoEm < u.salvoEm) {
      return { ok: false, status: 409, velho: true, error: "Já tem um save mais novo deste jogo na nuvem." };
    }
    if (gravadoEm != null) {
      const passou = t - gravadoEm;
      if (passou < SAVE_INTERVALO_MS) {
        const podeFechando = ordem.fechando && passou >= FECHANDO_INTERVALO_MS && fechandosRecentes(u, t).length < FECHANDO_MAX;
        if (!podeFechando) return { ok: false, status: 429, error: "Salvando rápido demais. Tente em alguns segundos." };
        return { ok: true, furouIntervalo: true };
      }
    }
    return { ok: true, furouIntervalo: false };
  }

  // gravou: lembra a ordem (e quantos "fechando" furaram o intervalo)
  function registra(userId, ordem, d) {
    const t = agora(), u = ultimo.get(userId);
    const fechandos = fechandosRecentes(u, t);
    if (d && d.furouIntervalo) fechandos.push(t);
    ultimo.set(userId, { sessao: ordem.sessao, salvoEm: ordem.salvoEm, em: t, fechandos });
    if (ultimo.size > maxContas) for (const [k, v] of ultimo) if (t - v.em > ESQUECER_MS) ultimo.delete(k);
  }

  return { emFila, decide, registra, tamanho: () => ultimo.size, esquece: () => ultimo.clear() };
}

// A rota PUT /save. `sinal` = registrarSinal (sessoes.js); nos testes, nada.
export function criaPutSave({ prisma, guarda = criaGuardaSave(), sinal = () => {} }) {
  return async (req, res) => {
    const v = validarSave(req.body);
    if (!v.ok) return res.status(400).json({ error: v.erro });
    const eu = req.user.id, ordem = ordemDoCorpo(req.body);
    const r = await guarda.emFila(eu, async () => {
      const antes = await prisma.lendaSave.findUnique({ where: { userId: eu }, select: { atualizadoEm: true } });
      const d = guarda.decide(eu, ordem, antes ? new Date(antes.atualizadoEm).getTime() : null);
      if (!d.ok) return d;
      const s = await prisma.lendaSave.upsert({
        where: { userId: eu },
        create: { userId: eu, dados: v.dados, nivel: v.nivel, tamanho: v.dados.length },
        update: { dados: v.dados, nivel: v.nivel, tamanho: v.dados.length },
        select: { atualizadoEm: true },
      });
      guarda.registra(eu, ordem, d);
      return { ok: true, atualizadoEm: s.atualizadoEm };
    });
    if (!r.ok) return res.status(r.status).json(r.velho ? { error: r.error, velho: true } : { error: r.error });
    sinal(prisma, eu, v.nivel, req.headers["user-agent"]);
    res.json({ ok: true, atualizadoEm: r.atualizadoEm });
  };
}
