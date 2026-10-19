// Câmera: segue devagar o andar em construção, com zoom manual, visão geral e
// "momentos especiais" que afastam a câmera quando a torre bate marcos de andares.
// O jogador pode arrastar e dar zoom no ponto do mouse: aí a câmera fica livre até ele
// pedir para seguir a obra de novo (ou ficar FREE_RETURN segundos sem mexer).
import { W, H, FH } from '../data/constants.js';

export const cam = { cx: 30, cy: 160, z: 1 };   // centro da tela em coordenadas de mundo e zoom
export const ZMAX = 2;
export const MILESTONES = [10, 50, 100, 500, 1000, 5000, 10000, 50000, 100000];
const FREE_RETURN = 30;

const ctl = {
  userZ: 1,          // zoom escolhido pelo jogador (modo seguir)
  overview: false,   // visão geral ligada
  free: false,       // câmera solta pelo jogador
  idle: 0,           // segundos desde o último toque na câmera livre
  cine: null,        // momento especial em andamento { t, title, sub }
  snap: true,        // próximo quadro pula direto para o alvo
  topY: FH,          // topo atual da obra (mundo)
};

// mundo → tela
export const sx = x => (x - cam.cx) * cam.z + W / 2;
export const sy = y => H / 2 - (y - cam.cy) * cam.z;
// tela → mundo
export const worldX = screenX => cam.cx + (screenX - W / 2) / cam.z;
export const worldY = screenY => cam.cy + (H / 2 - screenY) / cam.z;

// zoom que mostra a torre inteira, do chão ao topo
export const fitZ = topY => Math.min(1, (H - 110) / Math.max(FH * 2, topY + FH * 1.5));
const minZ = () => Math.min(0.5, fitZ(ctl.topY));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// limites da câmera livre: do chão até um pouco acima do topo, e não muito para os lados
function clampFree() {
  cam.cx = clamp(cam.cx, -700, 800);
  cam.cy = clamp(cam.cy, (H / 2 - 110) / cam.z, Math.max((H / 2 - 110) / cam.z, ctl.topY + FH * 3));
}
function goFree() {
  if (!ctl.free) { ctl.free = true; ctl.overview = false; }
  ctl.cine = null; ctl.idle = 0;
}

// ---------- controles ----------
// zoom mantendo fixo o ponto da tela (px, py) — o ponto sob o mouse
export function zoomAt(px, py, f) {
  goFree();
  const wx = worldX(px), wy = worldY(py);
  cam.z = clamp(cam.z * f, minZ(), ZMAX);
  cam.cx = wx - (px - W / 2) / cam.z;
  cam.cy = wy - (H / 2 - py) / cam.z;
  ctl.userZ = cam.z;
  clampFree();
}
// arrastar: dx, dy em pixels do canvas
export function panBy(dx, dy) {
  goFree();
  cam.cx -= dx / cam.z; cam.cy += dy / cam.z;
  clampFree();
}
// botões + e −: na câmera livre aproxima no centro da tela; seguindo, no andar em obra
export function zoomBy(f) {
  if (ctl.free) { zoomAt(W / 2, H / 2, f); return; }
  ctl.cine = null;
  const base = ctl.overview ? cam.z : ctl.userZ;
  ctl.overview = false;
  ctl.userZ = clamp(base * f, minZ(), ZMAX);
  if (ctl.userZ <= fitZ(ctl.topY) * 1.001) ctl.overview = true; // afastou até caber tudo
}
export function toggleOverview() {
  ctl.cine = null;
  ctl.overview = !ctl.overview || ctl.free;
  ctl.free = false;
  if (!ctl.overview && ctl.userZ < 0.6) ctl.userZ = 1;
}
export function followBuild() { ctl.free = false; ctl.overview = false; ctl.cine = null; if (ctl.userZ < 0.6) ctl.userZ = 1; }
export const isOverview = () => ctl.overview && !ctl.free;
export const isFree = () => ctl.free;
export const cinematic = () => ctl.cine;
export const snapCamera = () => { ctl.snap = true; };
export function resetCamera() { ctl.userZ = 1; ctl.overview = false; ctl.free = false; ctl.cine = null; ctl.snap = true; }

// momentos especiais só quando a câmera está seguindo a obra
export function startMilestone(floors, title, sub) {
  if (ctl.cine || ctl.free) return false;
  ctl.cine = { t: 0, floors, title, sub };
  return true;
}

// ---------- atualização por quadro ----------
// buildTop: y do topo dos andares prontos; topY: topo da obra incluindo o que está subindo;
// zCap: zoom máximo do modo; above: espaço extra acima do topo que o modo precisa mostrar (andar içado, megabloco)
export function updateCamera(dt, buildTop, topY, zCap = ZMAX, above = 0) {
  ctl.topY = topY;
  if (ctl.free) {
    ctl.idle += dt;
    if (ctl.idle > FREE_RETURN) followBuild(); // esqueceu a câmera solta: volta a seguir a obra
    else { clampFree(); ctl.snap = false; return; }
  }
  let tz, anchorGround = false;
  const c = ctl.cine;
  if (c) {
    c.t += dt;
    if (c.t < 4.6) { tz = fitZ(topY); anchorGround = true; }
    else { tz = ctl.overview ? fitZ(topY) : Math.min(ctl.userZ, zCap); anchorGround = ctl.overview; }
    if (c.t > 6.2) ctl.cine = null;
  } else if (ctl.overview) { tz = fitZ(topY); anchorGround = true; }
  else tz = Math.min(ctl.userZ, zCap);

  // zoom suave em escala logarítmica
  const k = ctl.snap ? 1 : 1 - Math.exp(-dt * (c ? 2.2 : 5));
  cam.z = Math.exp(Math.log(cam.z) + (Math.log(tz) - Math.log(cam.z)) * k);

  // enquadramento: o topo pronto fica a 40% da altura da tela (sobra 1 andar de céu para o guindaste)
  let ty = anchorGround ? (H / 2 - 50) / cam.z : buildTop + above / 2 - 0.1 * H / cam.z;
  ty = Math.max(ty, (H / 2 - 110) / cam.z); // nunca deixa o chão subir acima de H-110
  const ky = ctl.snap ? 1 : 1 - Math.exp(-dt * (c || anchorGround ? 4 : 2.5));
  if (Math.abs(ty - cam.cy) * cam.z > H * 3) cam.cy = ty; // salto grande (carregar save): vai direto
  else cam.cy += (ty - cam.cy) * ky;
  const tx = 30 * Math.min(1, cam.z);
  cam.cx += (tx - cam.cx) * (ctl.snap ? 1 : 1 - Math.exp(-dt * 3));
  ctl.snap = false;
}
