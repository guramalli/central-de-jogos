// Conteúdo do celular (js/dialogos/celular_conversas.js): conversas, respostas e ligações bem formadas.
const test = require("node:test");
const assert = require("node:assert");
const CEL = require("../js/dialogos/celular_conversas.js");

test("cada conversa tem id único, app válido e mensagens com texto", () => {
  const ids = new Set();
  for (const c of CEL.conversas) {
    assert.ok(!ids.has(c.id), "id repetido: " + c.id); ids.add(c.id);
    assert.ok(["zap", "insta"].includes(c.app), c.id);
    for (const m of [...c.mensagens, ...(c.novas || [])]) assert.ok(m.de && (m.t || m.audio), c.id);
    for (const r of c.rodadas || []) for (const o of r.opcoes) if (o.audio) assert.match(o.audio, /^assets[/]audio[/]amigos[/][\w-]+[.]mp3$/, c.id);
    if (c.novas) assert.ok(c.chega > 0, c.id + ": novas sem 'chega'");
  }
});

test("no grupo, quem fala é membro (ou ele)", () => {
  for (const c of CEL.conversas.filter((x) => x.grupo)) {
    const ok = new Set([...c.membros, "eu"]);
    const falas = [...c.mensagens, ...(c.novas || []), ...(c.rodadas || []).flatMap((r) => r.opcoes.flatMap((o) => o.volta))];
    for (const m of falas) assert.ok(ok.has(m.de), `${c.id}: "${m.de}" não está no grupo`);
  }
});

test("respostas: cada rodada tem opções com o que ele manda", () => {
  for (const c of CEL.conversas) for (const r of c.rodadas || []) {
    assert.ok(r.opcoes.length >= 1, c.id);
    for (const o of r.opcoes) { assert.ok(o.eu, c.id); assert.ok(Array.isArray(o.volta), c.id); }
  }
});

test("ligações: cada uma tem conversas com falas e opções", () => {
  assert.ok(CEL.ligacoes.length >= 2);
  for (const l of CEL.ligacoes) for (const cv of l.conversas) {
    assert.ok((cv.falas && cv.falas.length) || (cv.passos && cv.passos.length), l.id);
    for (const p of cv.passos || []) {
      assert.ok(["ele", "eu"].includes(p.quem) && (p.t || p.audio), l.id);
      if (p.audio) assert.match(p.audio, /^assets\/audio\/amigos\/[\w-]+\.mp3$/, l.id + ": voz fora da pasta trancada");
    }
    for (const o of cv.opcoes || []) assert.ok(o.eu && Array.isArray(o.volta), l.id);
  }
});
