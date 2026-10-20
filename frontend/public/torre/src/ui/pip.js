// Janelinha da obra (pedido do usuário, out/2026): acima dos botões de câmera, uma vista ao vivo da outra ponta da obra.
// Acompanhando o topo, mostra o térreo (serventes, pilha de material, porta dos elevadores, olaria), para ver se o
// fornecimento está parado; olhando lá embaixo, mostra o topo. Desenha a própria cena num canvas pequeno (withTarget,
// em modo prévia: sem partículas, textos nem estado de animação), umas 8 vezes por segundo. Tocar leva a câmera até lá.
import { S } from '../sim/state.js';
import { FH, H } from '../data/constants.js';
import { withTarget } from '../render/canvas.js';
import { render } from '../render/scene.js';
import { worldY, goBase, goTop, isOverview, isFree } from '../render/camera.js';
import { FLAGS } from '../data/flags.js';

const $ = id => document.getElementById(id);
let acc = 1, mode = '';

export function initPip() {
  if (!FLAGS.viva) return;
  $('pip').onclick = () => (mode === 'chao' ? goBase() : goTop());
}

// hidden: abertura, Início ou visão geral (as duas pontas já aparecem)
export function tickPip(dt, hidden) {
  const el = $('pip');
  if (!FLAGS.viva || !el) return;
  const off = hidden || isOverview() || S.floors < 4; // no comecinho a torre inteira cabe na tela
  if (el.hidden !== off) el.hidden = off;
  if (off) return;
  acc += dt; if (acc < 0.12) return; acc = 0;
  const vendoChao = isFree() && worldY(H) < 400; // câmera solta perto do chão (acompanhando a obra, mostra o térreo)
  const m = vendoChao ? 'topo' : 'chao';
  if (m !== mode) { mode = m; $('pipLabel').textContent = m === 'chao' ? 'TÉRREO' : 'TOPO'; el.title = m === 'chao' ? 'Ver o térreo' : 'Ver o topo'; }
  const c = $('pipCv'), g = c.getContext('2d');
  const cam = m === 'chao' ? { cx: 215, cy: 50, z: 0.85 } : { cx: 10, cy: Math.floor(S.floors) * FH + FH * 0.55, z: 0.5 };
  g.imageSmoothingEnabled = false;
  withTarget(g, c.width, c.height, cam, () => render());
}
