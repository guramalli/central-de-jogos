// Central de testes da árvore: cada Worker roda simulados (lab/robo.js) sem travar a página.
// Mensagem: { id, cfg } → responde { id, tipo: 'progresso', p } de 5 em 5 min de jogo e { id, tipo: 'fim', res } (ou 'erro').
const mem = new Map();
globalThis.localStorage = { getItem: k => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: k => mem.delete(k), clear: () => mem.clear() };
globalThis.TORRE_FLAGS = { viva: true, risco: true };
let robo = null;
self.onmessage = async e => {
  const { id, cfg } = e.data;
  try {
    robo ||= await import('./robo.js');
    const res = robo.simular(cfg, p => self.postMessage({ id, tipo: 'progresso', p }));
    self.postMessage({ id, tipo: 'fim', res });
  } catch (err) { self.postMessage({ id, tipo: 'erro', msg: String((err && err.stack) || err) }); }
};
