// ===== Lenda do Campinho — estatísticas ANÔNIMAS (só contagens por dia) =====
//
// O jogo manda marcos como "abriu o jogo", "chegou ao nível 10", "entrou em
// Atlântida". Aqui cada um vira +1 num contador do dia (tabela LendaContagem).
// Não existe linha por pessoa: nada de conta, nome, aparelho, cookie, texto
// livre — e o IP NÃO é gravado (só fica na memória por 1 min para barrar abuso).
// Com isso dá para ver onde os jogadores desistem sem saber quem é quem
// (LGPD art. 12: dado anonimizado não é dado pessoal — público infantil).

// Só estes eventos existem; o valor de cada um é conferido aqui.
export const EVENTOS = {
  abriu: /^(novo|volta)?$/,
  jogou: /^$/,
  personagem: /^[a-z_]{0,20}$/,          // classe escolhida
  tutorial: /^fim$/,
  nivel: /^\d{1,4}$/,
  mapa: /^[a-z0-9_]{1,30}$/,
  derrota: /^primeira$/,
  sessao: /^m(0_5|5_15|15_30|30_60|60)$/,
  retorno: /^d(1|7|30)$/,
  // v407 (Raio-X I7): onde as crianças param
  missao: /^[a-z0-9_]{1,40}$/,           // missão concluída (só o ID da missão, uma vez por personagem)
  desistiu: /^criacao$/,                  // fechou o jogo na tela de criar personagem
  primeira: /^(caca|chefe)$/,             // primeira área de caça / primeiro chefão vencido
};
// v407 (Raio-X I7): no painel, número com menos de MIN_PESSOAS não aparece (com tão pouca gente daria para adivinhar quem é)
export const MIN_PESSOAS = 5;
export const PLATAFORMAS = new Set(["celular", "computador"]);
export const MAX_EVENTOS = 20;
export const GUARDAR_DIAS = 400;

// Corpo: { v: versão do jogo, p: plataforma, ev: [{ e, v }] }  (texto JSON)
export function validarContagens(corpo) {
  let d = corpo;
  if (typeof d === "string") { try { d = JSON.parse(d); } catch { return { ok: false, erro: "JSON inválido" }; } }
  if (!d || typeof d !== "object" || !Array.isArray(d.ev)) return { ok: false, erro: "Formato inválido" };
  const versao = /^\d{1,5}$/.test(String(d.v)) ? String(d.v) : "?";
  const plataforma = PLATAFORMAS.has(d.p) ? d.p : "?";
  const itens = [];
  for (const x of d.ev.slice(0, MAX_EVENTOS)) {
    if (!x || typeof x !== "object") continue;
    const evento = String(x.e || ""), valor = String(x.v ?? "");
    if (!Object.hasOwn(EVENTOS, evento) || !EVENTOS[evento].test(valor)) continue;
    itens.push({ evento, valor, versao, plataforma });
  }
  return { ok: true, itens };
}

// "2026-10-02" no horário de Brasília (o dia do jogador, não o UTC)
export function diaDe(agora = Date.now()) {
  return new Date(agora - 3 * 3600e3).toISOString().slice(0, 10);
}

// Barreira de abuso: no máximo LIMITE envios por minuto do mesmo IP (só na memória).
const LIMITE = 30;
const vistos = new Map();
export function podeContar(ip, agora = Date.now()) {
  const k = String(ip || "?");
  const e = vistos.get(k);
  if (!e || agora - e.t > 60_000) { vistos.set(k, { t: agora, n: 1 }); if (vistos.size > 5000) limpa(agora); return true; }
  e.n++;
  return e.n <= LIMITE;
}
function limpa(agora) { for (const [k, e] of vistos) if (agora - e.t > 60_000) vistos.delete(k); }

// Soma +1 em cada contador (eventos iguais no mesmo envio somam juntos).
export async function somarContagens(prisma, itens, agora = Date.now()) {
  const dia = diaDe(agora);
  const soma = new Map();
  for (const it of itens) { const k = [it.evento, it.valor, it.plataforma, it.versao].join("|"); soma.set(k, { ...it, n: (soma.get(k)?.n || 0) + 1 }); }
  for (const it of soma.values()) {
    const chave = { dia, evento: it.evento, valor: it.valor, plataforma: it.plataforma, versao: it.versao };
    await prisma.lendaContagem.upsert({
      where: { dia_evento_valor_plataforma_versao: chave },
      create: { ...chave, n: it.n },
      update: { n: { increment: it.n } },
    });
  }
}

// Resumo para o painel do dono: soma por evento/valor no período (e por dia).
// v407 (Raio-X I7): o que tem menos de MIN_PESSOAS sai do resultado (a chave vai para `poucos`, o painel mostra "menos de 5").
export function resumir(linhas, minimo = MIN_PESSOAS) {
  const total = {}, porDia = {};
  for (const l of linhas) {
    const k = l.evento + (l.valor ? ":" + l.valor : "");
    total[k] = (total[k] || 0) + l.n;
    (porDia[l.dia] ||= {})[k] = ((porDia[l.dia] || {})[k] || 0) + l.n;
  }
  const poucos = [];
  for (const k of Object.keys(total)) if (total[k] < minimo) { poucos.push(k); delete total[k]; }
  for (const d of Object.keys(porDia)) for (const k of Object.keys(porDia[d])) if (porDia[d][k] < minimo) delete porDia[d][k];
  return { total, porDia, poucos, minimo };
}
