// Ghotin2 — banco de mentira para os testes das rotas (nada de Postgres).
// Imita só o que routes/ghotin2.js e ghotin2/auth.js usam do Prisma: as três tabelas Ghotin2*, os @unique (com a regra
// do Postgres: NULL não conflita), os @default, o @updatedAt, o onDelete: Cascade, os filtros { lt, gt }, o filtro pela
// relação (conta: { banido }), orderBy, take, select, { increment } e o erro P2002/P2025 do Prisma.
// O mesmo teste roda contra um Postgres de verdade com G2_TESTE_DB=1 (veja rotas.test.js).
let seq = 0;
const novoId = (p) => `${p}${Date.now().toString(36)}${(seq++).toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export function bancoDeMentira({ agora }) {
  const linhas = { ghotin2Conta: [], ghotin2Personagem: [], ghotin2Comum: [] };
  const unicos = {
    ghotin2Conta: [["id"], ["usuario"], ["resetHash"]],
    ghotin2Personagem: [["id"], ["nomeChave"], ["contaId", "espaco"]],
    ghotin2Comum: [["contaId"]],
  };
  const comUpdatedAt = new Set(["ghotin2Personagem", "ghotin2Comum"]);
  const padroes = {
    ghotin2Conta: () => ({ id: novoId("c"), criadoEm: new Date(agora()), ultimoAcesso: new Date(agora()), falhasLogin: 0, travadoAte: null, tokenVersao: 0, resetHash: null, resetAte: null, sessao: null, sessaoDesde: null, banido: false }),
    ghotin2Personagem: () => ({ id: novoId("p"), espaco: null, nomeChave: null, vocacao: null, nivel: 1, exp: 0, mapa: null, dados: "", tamanho: 0, versao: 0, suspeito: false, suspeitoMotivo: null, subiuEm: new Date(agora()), criadoEm: new Date(agora()), atualizadoEm: new Date(agora()), apagadoEm: null }),
    ghotin2Comum: () => ({ tamanho: 0, versao: 1, criadoEm: new Date(agora()), atualizadoEm: new Date(agora()) }),
  };
  const valor = (x) => (x instanceof Date ? x.getTime() : x);
  function casa(l, where) {
    return Object.entries(where || {}).every(([k, v]) => {
      if (k === "conta") { const c = linhas.ghotin2Conta.find((x) => x.id === l.contaId); return !!c && casa(c, v); }
      const x = l[k];
      if (v && typeof v === "object" && !(v instanceof Date)) {
        if ("lt" in v && !(x != null && valor(x) < valor(v.lt))) return false;
        if ("gt" in v && !(x != null && valor(x) > valor(v.gt))) return false;
        return true;
      }
      return valor(x) === valor(v);
    });
  }
  const escolhe = (l, select) => (select ? Object.fromEntries(Object.keys(select).map((k) => [k, l[k]])) : { ...l });
  function confereUnicos(tab, l, ignorar) {
    for (const campos of unicos[tab]) {
      if (campos.some((c) => l[c] == null)) continue;
      if (linhas[tab].some((o) => o !== ignorar && campos.every((c) => valor(o[c]) === valor(l[c])))) {
        throw Object.assign(new Error(`Unique constraint failed on the fields: (${campos.join(",")})`), { code: "P2002", meta: { target: campos } });
      }
    }
  }
  function aplica(tab, l, data) {
    const novo = { ...l };
    for (const [k, v] of Object.entries(data)) novo[k] = v && typeof v === "object" && "increment" in v ? (l[k] || 0) + v.increment : v;
    if (comUpdatedAt.has(tab) && !("atualizadoEm" in data)) novo.atualizadoEm = new Date(agora());
    confereUnicos(tab, novo, l);
    Object.assign(l, novo);
  }
  function ordena(lista, orderBy) {
    const regras = Array.isArray(orderBy) ? orderBy : orderBy ? [orderBy] : [];
    return [...lista].sort((a, b) => {
      for (const r of regras) {
        const [k, dir] = Object.entries(r)[0];
        const va = valor(a[k]), vb = valor(b[k]);
        if (va === vb) continue;
        return (va < vb ? -1 : 1) * (dir === "desc" ? -1 : 1);
      }
      return 0;
    });
  }
  const db = { linhas, falha: null };
  for (const tab of Object.keys(linhas)) {
    const t = linhas[tab];
    const vigia = () => { if (db.falha) throw db.falha; };
    db[tab] = {
      async findUnique({ where, select }) { vigia(); const l = t.find((x) => casa(x, where)); return l ? escolhe(l, select) : null; },
      async findFirst({ where, select }) { vigia(); const l = t.find((x) => casa(x, where)); return l ? escolhe(l, select) : null; },
      async findMany({ where, orderBy, take, select } = {}) { vigia(); let r = ordena(t.filter((x) => casa(x, where)), orderBy); if (take) r = r.slice(0, take); return r.map((l) => escolhe(l, select)); },
      async create({ data, select }) { vigia(); const l = { ...padroes[tab](), ...data }; confereUnicos(tab, l, null); t.push(l); return escolhe(l, select); },
      async update({ where, data, select }) {
        vigia(); const l = t.find((x) => casa(x, where));
        if (!l) throw Object.assign(new Error("Record to update not found."), { code: "P2025" });
        aplica(tab, l, data); return escolhe(l, select);
      },
      async updateMany({ where, data }) { vigia(); const ls = t.filter((x) => casa(x, where)); for (const l of ls) aplica(tab, l, data); return { count: ls.length }; },
      async delete({ where }) {
        vigia(); const i = t.findIndex((x) => casa(x, where));
        if (i < 0) throw Object.assign(new Error("Record to delete does not exist."), { code: "P2025" });
        const [l] = t.splice(i, 1);
        if (tab === "ghotin2Conta") for (const filha of ["ghotin2Personagem", "ghotin2Comum"]) linhas[filha].splice(0, linhas[filha].length, ...linhas[filha].filter((x) => x.contaId !== l.id));
        return { ...l };
      },
      async deleteMany({ where } = {}) { vigia(); const fica = t.filter((x) => !casa(x, where)); const n = t.length - fica.length; t.splice(0, t.length, ...fica); return { count: n }; },
    };
  }
  return db;
}
