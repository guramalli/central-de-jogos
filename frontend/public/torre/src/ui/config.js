// Configurações do aparelho (Obra Viva): valem para todos os espaços de save e não vão no save.
//   vol 0..1 · som liga/desliga · leve = gráficos leves (sem partículas, menos nuvens, sem ondas na areia nem pássaros)
//   dicas = dicas para quem começa ligadas
const KEY = 'torre-config';
const DEF = { vol: 0.7, som: true, leve: false, dicas: true };
let c = null;
function read() {
  let o = {};
  try { o = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { }
  // preferência antiga de som (torre-infinita-som) vira a configuração nova
  try { if (!('som' in o) && localStorage.getItem('torre-infinita-som') === '0') o.som = false; } catch (e) { }
  return { ...DEF, ...o };
}
export const cfg = () => (c ||= read());
export function setCfg(patch) {
  c = { ...cfg(), ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) { }
  return c;
}
