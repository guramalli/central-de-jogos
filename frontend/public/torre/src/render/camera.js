// Câmera: segue devagar o andar em construção, com zoom manual, visão geral e
// "momentos especiais" que afastam a câmera quando a torre bate marcos de andares.
import { W, H, FH } from '../data/constants.js';

export const cam = { cx: 30, cy: 160, z: 1 };   // centro da tela em coordenadas de mundo e zoom
export const ZMAX = 2;
export const MILESTONES = [10, 50, 100, 500, 1000, 5000, 10000, 50000, 100000];

const ctl = {
  userZ: 1,          // zoom escolhido pelo jogador
  overview: false,   // botão de visão geral ligado
  cine: null,        // momento especial em andamento { t, title, sub }
  snap: true,        // próximo quadro pula direto para o alvo
  topY: FH,          // topo atual da obra (mundo)
};

// mundo → tela
export const sx = x => (x - cam.cx) * cam.z + W / 2;
export const sy = y => H / 2 - (y - cam.cy) * cam.z;
// tela → altura no mundo
export const worldY = screenY => cam.cy + (H / 2 - screenY) / cam.z;

// zoom que mostra a torre inteira, do chão ao topo
export const fitZ = topY => Math.min(1, (H - 110) / Math.max(FH * 2, topY + FH * 1.5));
const minZ = () => Math.min(0.5, fitZ(ctl.topY));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------- controles ----------
export function zoomBy(f) {
  ctl.cine = null;
  const base = ctl.overview ? cam.z : ctl.userZ;
  ctl.overview = false;
  ctl.userZ = clamp(base * f, minZ(), ZMAX);
  // afastou até caber tudo: vira visão geral (acompanha a torre crescendo)
  if (ctl.userZ <= fitZ(ctl.topY) * 1.001) ctl.overview = true;
}
export function toggleOverview() {
  ctl.cine = null;
  ctl.overview = !ctl.overview;
  if (!ctl.overview && ctl.userZ < 0.6) ctl.userZ = 1;
}
export const isOverview = () => ctl.overview;
export const cinematic = () => ctl.cine;
export const snapCamera = () => { ctl.snap = true; };
export function resetCamera() { ctl.userZ = 1; ctl.overview = false; ctl.cine = null; ctl.snap = true; }

export function startMilestone(floors, title, sub) {
  if (ctl.cine) return false;
  ctl.cine = { t: 0, floors, title, sub };
  return true;
}

// ---------- atualização por quadro ----------
// buildTop: y do topo dos andares prontos; topY: topo da obra incluindo o que está subindo;
// zCap: zoom máximo do modo; above: espaço extra acima do topo que o modo precisa mostrar (andar içado, megabloco)
export function updateCamera(dt, buildTop, topY, zCap = ZMAX, above = 0) {
  ctl.topY = topY;
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
  cam.cx = 30 * Math.min(1, cam.z);
  ctl.snap = false;
}
