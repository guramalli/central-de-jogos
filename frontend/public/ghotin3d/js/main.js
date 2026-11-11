// Ghotin2 3D reduzido: a Vila 1, o Arqueiro e os lobos. Arquivo principal: monta a cena, o laço, a câmera e os comandos.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { N8AOPass } from 'n8ao';
import { TexGen, RECORTE } from './texgen.js';
import * as M from './mapa.js';
import { prepararAlturas, criarTexturasChao, criarNatureza, atualizarNatureza, piso, altura } from './natureza.js';
import { criarVila } from './vila.js';
import { carregarModelos, Heroi, criarLobos, criarMoradores, atualizarMoradores, SKILLS } from './personagens.js';
import { Vfx } from './vfx.js';
import { Som } from './audio.js';
import { Hud } from './hud.js';
import { criarDemo } from './demo.js';
import { AtmosferaPass, Clima, Borboletas } from './atmosfera.js';
import { Ghotin } from './ghotin.js';
import { DragaoGigante } from './dragao.js';
import { criarVulcao, Vulcao } from './vulcao.js';
import { EstatuaImugi } from './estatua.js';

const V3 = THREE.Vector3; const PI = Math.PI; const $ = (id) => document.getElementById(id);
const Q = new URLSearchParams(location.search);
const NIVEL = Q.get('q') || 'alta'; const QUAL = { alta: { g: 1, sombra: 4096, msaa: 4, pr: 1, agua: 1024, ao: 1, atm: 24 }, media: { g: 0.55, sombra: 2048, msaa: 2, pr: 1, agua: 512, ao: 0, atm: 14 }, baixa: { g: 0.3, sombra: 2048, msaa: 0, pr: 0.8, agua: 256, ao: 0, atm: 0 } }[NIVEL] || {};
const COM_AO = Q.get('ao') ? Q.get('ao') === '1' : !!QUAL.ao;
const COM_ATM = Q.get('atm') ? Q.get('atm') === '1' : !!QUAL.atm;   // os raios de sol no ar, a sombra das nuvens e a cúpula das trevas
const GRAVAR = Q.get('gravar') === '1', DEMO = !!Q.get('demo') && Q.get('demo') !== '0';

// ao gravar, o acaso tem semente: a mesma gravação sai igual toda vez
if (GRAVAR) { let a = (+Q.get('semente') || 20261111) | 0; Math.random = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const ctx = { vento: { u: { value: new THREE.Vector3(0.8, 0.6, 1) }, rajada: 0 }, uTrevasGrama: { value: new THREE.Vector4(0, 0, 1, 0) }, uSolV: { value: new THREE.Vector3(0, 1, 0) }, uSolF: { value: 1 }, pedras: [], qAgua: QUAL.agua, tempo: 0, uTempo: { value: 0 }, qualidade: QUAL.g ?? 1, estat: { abates: 0 }, agenda: [], vozSempre: DEMO, recargaCurta: Q.get('recarga') === 'curta', semTitulos: false };
window.G = ctx;
ctx.agendar = (atraso, fn) => ctx.agenda.push({ t: ctx.tempo + atraso, fn });

const tela = $('tela');
const renderer = new THREE.WebGLRenderer({ canvas: tela, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: GRAVAR });
renderer.setPixelRatio(QUAL.pr ?? 1); renderer.setSize(innerWidth, innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.86;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
ctx.renderer = renderer;
const cena = new THREE.Scene(); ctx.cena = cena; cena.fog = new THREE.FogExp2(0xbccddd, 0.00105);
const camera = new THREE.PerspectiveCamera(34, innerWidth / innerHeight, 0.5, 9500); camera.layers.enable(1); ctx.camera = camera;
ctx.tg = new TexGen(renderer);

// o sol: fim de tarde, vindo do sul-sudoeste
const sol = new V3(-0.74, 0.60, 0.62).normalize(); ctx.sol = sol;   // sol baixo de fim de tarde, vindo do sudoeste
const SOL_FORCA = 4.1, CEU_FORCA = 1.15, EXPOSICAO = 0.86;
const luzSol = new THREE.DirectionalLight(0xffd9a8, SOL_FORCA); luzSol.castShadow = true; luzSol.shadow.mapSize.set(QUAL.sombra || 4096, QUAL.sombra || 4096); luzSol.shadow.bias = -0.00035; luzSol.shadow.normalBias = 0.045;
const sc = luzSol.shadow.camera; sc.near = 1; sc.far = 420; cena.add(luzSol, luzSol.target);
const luzCeu = new THREE.HemisphereLight(0xf3efe6, 0xb8a078, CEU_FORCA); cena.add(luzCeu);

// pós-processamento: brilho, gradação de cor, saída
const alvoRT = new THREE.WebGLRenderTarget(innerWidth, innerHeight, { type: THREE.HalfFloatType, samples: (COM_AO || COM_ATM) ? 0 : (QUAL.msaa ?? 4) });
if (COM_ATM && !COM_AO) alvoRT.depthTexture = new THREE.DepthTexture(innerWidth, innerHeight);   // a atmosfera precisa da profundidade da cena
const composer = new EffectComposer(renderer, alvoRT); composer.setPixelRatio(QUAL.pr ?? 1); composer.setSize(innerWidth, innerHeight); ctx.composer = composer;
// (o clone do alvo divide a mesma textura de profundidade; o segundo alvo precisa da sua, senão a atmosfera leria a textura em que está desenhando)
if (alvoRT.depthTexture) composer.renderTarget2.depthTexture = new THREE.DepthTexture(alvoRT.width, alvoRT.height);
// com a oclusão de ambiente (sombras de contato nos cantos, embaixo dos beirais), o N8AO faz o desenho da cena; sem ela, o passe comum com MSAA
let passeAO = null;
if (COM_AO) { passeAO = new N8AOPass(cena, camera, innerWidth, innerHeight); const c = passeAO.configuration; c.aoRadius = 1.4; c.distanceFalloff = 1.0; c.intensity = 1.7; c.aoSamples = 16; c.denoiseSamples = 6; c.denoiseRadius = 10; c.halfRes = false; c.gammaCorrection = false; c.color = new THREE.Color(0.02, 0.025, 0.05); composer.addPass(passeAO); ctx.passeAO = passeAO; }
else composer.addPass(new RenderPass(cena, camera));
// limpa valores inválidos antes do brilho (um NaN viraria um quadrado preto)
composer.addPass(new ShaderPass({ uniforms: { tDiffuse: { value: null } }, vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }', fragmentShader: 'uniform sampler2D tDiffuse; varying vec2 vUv; void main(){ vec4 c=texture2D(tDiffuse,vUv); vec3 v=c.rgb; if(isnan(v.r)||isinf(v.r)) v.r=0.; if(isnan(v.g)||isinf(v.g)) v.g=0.; if(isnan(v.b)||isinf(v.b)) v.b=0.; v=max(v,vec3(0.)); gl_FragColor=vec4(min(v,vec3(48.)),1.); }' }));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.22, 0.7, 1.0); composer.addPass(bloom);
const grade = new ShaderPass({ uniforms: { tDiffuse: { value: null }, uVig: { value: 0.55 }, uSat: { value: 1.17 } }, vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uVig,uSat; varying vec2 vUv;
    void main(){ vec4 c=texture2D(tDiffuse,vUv); float l=dot(c.rgb,vec3(.2126,.7152,.0722)); c.rgb=mix(vec3(l),c.rgb,uSat);
      c.rgb*=mix(vec3(.95,.99,1.06),vec3(1.05,1.,.93),smoothstep(0.,1.2,l)); vec2 d=vUv-.5; c.rgb*=1.-uVig*dot(d,d)*1.5; gl_FragColor=c; }` });
composer.addPass(grade); composer.addPass(new OutputPass());
if (COM_AO || COM_ATM) composer.addPass(new SMAAPass(innerWidth, innerHeight));

// ---------- a câmera ----------
const cam = { yaw: PI / 4, pitch: 37 * PI / 180, dist: 14.5, alvo: new V3(), cine: null, yawOff: 0, yawEf: PI / 4, distEf: 14.5 };
const _olhar = new V3();
ctx.cam = cam;
function atualizarCamera(dt) {
  const h = ctx.heroi; const al = new V3(h.pos.x, h.pos.y + 1.15, h.pos.z);
  if (cam.alvo.lengthSq() === 0 || cam.alvo.distanceTo(al) > 12) cam.alvo.copy(al); else cam.alvo.lerp(al, Math.min(1, dt * 9));
  if (cam.cine) { camera.position.copy(cam.cine.pos); camera.lookAt(cam.cine.alvo); camera.fov = cam.cine.fov || 34; camera.updateProjectionMatrix(); return; }
  // na ilha vulcânica a câmera vai para trás do herói (do lado de fora da cratera), sobe e se afasta: o Dragão fica sempre à frente dele
  let yaw = cam.yaw, pitch = cam.pitch, dist = cam.dist; const ar = ctx.vulcao ? ctx.vulcao.arena : 0; const olhar = _olhar.copy(cam.alvo);
  if (ar > 0.001) { const V = M.VULCAO; const rx = cam.alvo.x - V.x, rz = cam.alvo.z - V.z, rl = Math.hypot(rx, rz) || 1;
    let a = Math.atan2(rz, rx), dp = a - V.picoAng; while (dp > PI) dp -= 2 * PI; while (dp < -PI) dp += 2 * PI; if (Math.abs(dp) < 1.1) a = V.picoAng + (dp < 0 ? -1.1 : 1.1);   // nunca atrás do pico (ele taparia a vista)
    let d = Math.atan2(Math.cos(a), Math.sin(a)) + cam.yawOff - yaw; while (d > PI) d -= 2 * PI; while (d < -PI) d += 2 * PI;
    yaw += d * ar; pitch -= 0.146 * ar; dist += 20 * ar; olhar.x -= rx / rl * 5 * ar; olhar.z -= rz / rl * 5 * ar; olhar.y += 10 * ar; } else cam.yawOff = 0;
  const kv = ctx.dragao && ctx.dragao.voo ? ctx.dragao.voo.k * ar : 0; if (kv > 0.001) olhar.lerp(ctx.dragao.centro, 0.42 * kv);   // com o Dragão no ar, o olhar sobe para ele
  cam.yawEf = yaw; cam.distEf = dist; { const fov = 34 + 16 * ar + 10 * kv; if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix(); } }
  const cp = Math.cos(pitch); const p = new V3(cam.alvo.x + Math.sin(yaw) * cp * dist, cam.alvo.y + Math.sin(pitch) * dist, cam.alvo.z + Math.cos(yaw) * cp * dist);
  const chao = piso(p.x, p.z) + 0.6; if (p.y < chao) p.y = chao;
  const tr = ctx.vfx.tremor; if (tr > 0) { p.x += (Math.random() - 0.5) * tr * 0.5; p.y += (Math.random() - 0.5) * tr * 0.5; p.z += (Math.random() - 0.5) * tr * 0.5; }
  camera.position.copy(p); camera.lookAt(olhar);
}
function atualizarSombra() {
  const c = cam.cine ? cam.cine.alvo : cam.alvo; const meio = cam.cine ? 60 : Math.min(62, Math.max(24, cam.distEf * 2.1)); const passo = 2;
  const x = Math.round(c.x / passo) * passo, z = Math.round(c.z / passo) * passo; luzSol.target.position.set(x, 0, z); luzSol.position.set(x + sol.x * 200, sol.y * 200, z + sol.z * 200);
  if (sc.right !== meio) { sc.left = -meio; sc.right = meio; sc.top = meio; sc.bottom = -meio; sc.updateProjectionMatrix(); }
}

// ---------- os comandos ----------
const rato = { x: innerWidth / 2, y: innerHeight / 2, esq: false, dir: false, arrastou: 0, chao: new V3(), sobre: null };
const teclas = new Set(); const raio = new THREE.Raycaster();
function pontoChao(mx, my, out) {
  raio.setFromCamera(new THREE.Vector2(mx / innerWidth * 2 - 1, -(my / innerHeight) * 2 + 1), camera); const o = raio.ray.origin, d = raio.ray.direction; let t = 0, ant = 0;
  for (let i = 0; i < 260; i++) { t += 0.5 + t * 0.012; const x = o.x + d.x * t, y = o.y + d.y * t, z = o.z + d.z * t; if (y <= piso(x, z)) { let a = ant, b = t; for (let k = 0; k < 14; k++) { const m = (a + b) / 2; if (o.y + d.y * m <= piso(o.x + d.x * m, o.z + d.z * m)) b = m; else a = m; } out.set(o.x + d.x * b, 0, o.z + d.z * b); out.y = piso(out.x, out.z); return true; } ant = t; if (t > 400) break; }
  return false;
}
function loboSobRato() {
  let m = null, md = 1e9; const v = new V3();
  for (const l of ctx.inimigos()) { if (l.morto) continue; const s = ctx.hud.projetar(l.peito(v)); if (!s.ok) continue; const dist = camera.position.distanceTo(v); const r = Math.max(26, 900 / dist * (l.ehPedra ? 2.6 : l.tipo === 'alfa' ? 1.5 : 1)); const d = Math.hypot(s.x - rato.x, s.y - rato.y); if (d < r && d < md) { md = d; m = l; } }
  return m;
}
function ligarComandos() {
  const h = ctx.heroi;
  tela.addEventListener('contextmenu', e => e.preventDefault());
  addEventListener('mousemove', e => { if (rato.dir) { if (ctx.vulcao && ctx.vulcao.arena > 0.5) cam.yawOff -= e.movementX * 0.0052; else cam.yaw -= e.movementX * 0.0052; cam.pitch = Math.min(1.25, Math.max(0.16, cam.pitch + e.movementY * 0.004)); rato.arrastou += Math.abs(e.movementX) + Math.abs(e.movementY); } rato.x = e.clientX; rato.y = e.clientY; });
  tela.addEventListener('mousedown', e => {
    ctx.som.destravar();
    if (e.button === 2) { rato.dir = true; rato.arrastou = 0; return; }
    if (e.button !== 0) return; rato.esq = true; clicar(true);
  });
  addEventListener('mouseup', e => { if (e.button === 2) { rato.dir = false; if (rato.arrastou < 4 && h.mirando) h.mirando = false; } if (e.button === 0) rato.esq = false; });
  tela.addEventListener('wheel', e => { cam.dist = Math.min(46, Math.max(5.5, cam.dist * Math.pow(1.0012, e.deltaY))); e.preventDefault(); }, { passive: false });
  addEventListener('keydown', e => {
    if (e.repeat) return; ctx.som.destravar(); const k = e.key.toLowerCase(); teclas.add(k);
    if (k >= '1' && k <= '5') { const i = +k - 1; if (SKILLS[i].id === 'chuva' && ctx.hud && h.recargas[i] <= 0 && h.mana >= SKILLS[i].mana) { h.mirando = !h.mirando; if (h.mirando) ctx.hud.aviso('Mire no chão e clique para soltar a chuva', 2.5); } else h.usarSkill(i); }
    else if (k === 'tab') { e.preventDefault(); const vivos = ctx.lobos.filter(l => !l.morto).sort((a, b) => a.pos.distanceTo(h.pos) - b.pos.distanceTo(h.pos)).slice(0, 6); if (vivos.length) { const i = vivos.indexOf(h.alvo); h.alvo = vivos[(i + 1) % vivos.length]; } }
    else if (k === 'escape') { if (ctx.verVoo) ctx.verVoo = false; else if (h.mirando) h.mirando = false; else { h.alvo = null; h.auto = false; } }
    else if (k === 'v') { const dg = ctx.dragao; if (!dg || ctx.demo) return; if (ctx.verVoo) ctx.verVoo = false; else if (dg.voo || dg.voar()) { ctx.verVoo = true; ctx.hud.aviso('O Dragão levanta voo · V ou Esc volta para o herói', 3.5); } else ctx.hud.aviso('O Dragão está ocupado; tente de novo daqui a pouco', 2.5); }
    else if (k === 'r') { const ch = ctx.clima.alternar(); ctx.hud.aviso(ch ? 'O céu fecha: vem chuva' : 'A chuva passa: o sol volta', 2.4); ctx.som.tocar(ch ? 'trovao' : 'magia_buff', { vol: 0.5 }); }
    else if (k === 'm') { ctx.hud.aviso(ctx.som.alternarMusica() ? 'Música ligada' : 'Música desligada'); }
    else if (k === 'h') { const a = $('ajuda'); a.style.display = a.style.display === 'none' ? 'block' : 'none'; }
    else if (k === 'c') document.body.classList.toggle('cine');
    else if (k === 'f2') { e.preventDefault(); const ordem = ['alta', 'media', 'baixa']; Q.set('q', ordem[(ordem.indexOf(NIVEL) + 1) % 3]); location.search = Q.toString(); }
    else if (k === 'f3') { e.preventDefault(); ctx.verFps = !ctx.verFps; $('fps').textContent = ''; }
  });
  addEventListener('keyup', e => teclas.delete(e.key.toLowerCase()));
  addEventListener('blur', () => { teclas.clear(); rato.esq = rato.dir = false; });
  addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight, false); composer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); });
}
let tClique = 0;
function clicar(novo) {
  const h = ctx.heroi; if (h.morto) return; if (!pontoChao(rato.x, rato.y, rato.chao)) return;
  if (h.mirando) { if (novo) h.usarSkill(3, rato.chao.clone()); return; }
  const l = novo ? loboSobRato() : null;
  if (l) { h.atacar(l); ctx.som.tocar('ui_clique', { vol: 0.4 }); return; }
  h.irPara(rato.chao.x, rato.chao.z); if (novo) { ctx.vfx.anel(rato.chao.x, rato.chao.z, 0.15, 0.7, 0.45, 0xffe9a8); }
}

// ---------- o que acontece sozinho no mundo ----------
let acFum = 0, acPolen = 0, acPet = 0, acFolhaArv = 0;
function mundoVivo(dt) {
  const v = ctx.vfx, h = ctx.heroi; acFum += dt;
  if (acFum > 0.09) { acFum = 0; for (const f of ctx.fumacas) { if (Math.hypot(f.x - h.pos.x, f.z - h.pos.z) > 70) continue; if (f.tipo === 'chamine') { v.fumacaSobe(new V3(f.x, f.y, f.z), 1.5, [0.2, 0.19, 0.18], 0.42); } else if (Math.random() < (f.forte ? 0.9 : 0.5)) v.fumacaSobe(new V3(f.x, f.y, f.z), f.forte ? 0.9 : 0.5, [0.72, 0.72, 0.74], 0.22); } }
  for (const f of ctx.fogos) { if (Math.hypot(f.x - h.pos.x, f.z - h.pos.z) > 50) continue; if (Math.random() < dt * 30) v.chama(new V3(f.x + (Math.random() - 0.5) * f.s * 0.8, f.y, f.z + (Math.random() - 0.5) * f.s * 0.8), f.s); }
  const tp = ctx.teleporte; if (tp && Math.random() < dt * 14) { const a = Math.random() * 2 * PI, r = 0.6 + Math.random() * 0.9; v.luz.emitir({ p: new V3(tp.x + Math.cos(a) * r, tp.y, tp.z + Math.sin(a) * r), v: new V3(0, 0.6 + Math.random() * 1.2, 0), vida: 1.6, t0: 0.12, t1: 0.02, c0: [0.3, 0.8, 1], a0: 0.9, a1: 0, q: 2 }); }
  // pólen ao sol e pétalas das cerejeiras
  acPolen += dt * 16; while (acPolen > 1) { acPolen -= 1; const c = cam.alvo; v.luz.emitir({ p: new V3(c.x + (Math.random() - 0.5) * 30, c.y + Math.random() * 5, c.z + (Math.random() - 0.5) * 30), v: new V3(0.3 + Math.random() * 0.3, (Math.random() - 0.4) * 0.2, 0.2 + Math.random() * 0.2), vida: 4 + Math.random() * 3, t0: 0.05, t1: 0.05, c0: [1, 0.92, 0.7], a0: 0.5 * (1 - (ctx.clima ? ctx.clima.chuva : 0)), a1: 0, q: 0, entra: 0.3, vento: 0.35 }); }
  // folhas que se soltam das árvores perto
  acFolhaArv += dt * 5 * ctx.vento.u.value.z; while (acFolhaArv > 1) { acFolhaArv -= 1; const arv = ctx.arvores; const a = arv[(Math.random() * arv.length) | 0]; if (!a || a.tipo > 1 || Math.hypot(a.x - cam.alvo.x, a.z - cam.alvo.z) > 30) continue; const an = Math.random() * 2 * PI, r = Math.random() * 2.6 * a.esc;
    v.fumo.emitir({ p: new V3(a.x + Math.cos(an) * r, a.y + (4 + Math.random() * 3) * a.esc, a.z + Math.sin(an) * r), v: new V3((Math.random() - 0.5) * 0.6, -0.5 - Math.random() * 0.5, (Math.random() - 0.5) * 0.6), vida: 5 + Math.random() * 3, t0: 0.13, t1: 0.13, c0: a.tipo === 1 ? [0.85, 0.55, 0.16] : [0.38, 0.52, 0.18], a0: 0.95, a1: 0, q: 3, giro: (Math.random() - 0.5) * 8, arr: 0.25, chao: true, entra: 0.05, vento: 0.55 }); }
  acPet += dt * 4; while (acPet > 1) { acPet -= 1; const cer = ctx.cerejeiras; if (!cer.length) break; const a = cer[(Math.random() * cer.length) | 0]; if (Math.hypot(a.x - cam.alvo.x, a.z - cam.alvo.z) > 34) continue; const an = Math.random() * 2 * PI, r = Math.random() * 2.2 * a.esc; v.fumo.emitir({ p: new V3(a.x + Math.cos(an) * r, a.y + (2.6 + Math.random() * 2.2) * a.esc, a.z + Math.sin(an) * r), v: new V3(0.5 + Math.random() * 0.6, -0.5 - Math.random() * 0.4, 0.35 + Math.random() * 0.5), vida: 4 + Math.random() * 2.5, t0: 0.075, t1: 0.075, c0: [0.95, 0.66, 0.76], c1: [0.9, 0.7, 0.78], a0: 0.9, a1: 0.0, q: 3, vento: 0.7, giro: (Math.random() - 0.5) * 7, arr: 0.2, chao: true, entra: 0.05 }); }
}
function somDoLugar() {
  const h = ctx.heroi, s = ctx.som; const naCid = M.dentroRet(h.pos.x, h.pos.z, M.CID); const flo = Math.exp(-((h.pos.x + 46) ** 2 + (h.pos.z + 40) ** 2) / 1100) > 0.35; const forja = ctx.bigorna ? Math.max(0, 1 - Math.hypot(h.pos.x - ctx.bigorna.x, h.pos.z - ctx.bigorna.z) / 12) : 0;
  const ch = ctx.clima ? ctx.clima.chuva : 0; const vp = ctx.vulcao ? ctx.vulcao.perto : 0;   // perto do vulcão: o crepitar da lava no lugar dos grilos
  s.ambiente({ vila_loop: naCid ? 1 - ch * 0.6 : 0, campo_loop: !naCid && !flo ? (1 - ch * 0.8) * (1 - vp) : 0, floresta_loop: flo ? 1 - ch * 0.5 : 0, vento_loop: (naCid ? 0.3 : 0.7) + ch * 0.5, fogueira_loop: Math.max(forja, vp), chuva_loop: ch });
  const briga = ctx.lobos.some(l => !l.morto && (l.estado === 'perseguir' || l.estado === 'morder')); if (briga) ctx.tBriga = 4; else ctx.tBriga = Math.max(0, (ctx.tBriga || 0) - 0.5);
  s.musica(ctx.tBriga > 0 ? 'combate' : naCid ? 'vila' : 'campo');
}

// ---------- o laço ----------
let acSom = 0, quadros = 0, tFps = 0, discoMira = null, discoAlvo = null;
function quadro(dt) {
  ctx.tempo += dt; ctx.uTempo.value = ctx.tempo; ctx.som.tempoJogo = ctx.tempo; const h = ctx.heroi;
  for (let i = ctx.agenda.length - 1; i >= 0; i--) if (ctx.agenda[i].t <= ctx.tempo) { const a = ctx.agenda.splice(i, 1)[0]; a.fn(); }
  // teclas de andar, relativas à câmera
  let fx = 0, fz = 0; if (teclas.has('w') || teclas.has('arrowup')) fz += 1; if (teclas.has('s') || teclas.has('arrowdown')) fz -= 1; if (teclas.has('d') || teclas.has('arrowright')) fx += 1; if (teclas.has('a') || teclas.has('arrowleft')) fx -= 1;
  h.teclas.x = -Math.sin(cam.yawEf) * fz + Math.cos(cam.yawEf) * fx; h.teclas.z = -Math.cos(cam.yawEf) * fz - Math.sin(cam.yawEf) * fx;
  if (rato.esq && !h.mirando) { tClique -= dt; if (tClique <= 0) { tClique = 0.12; clicar(false); } }
  if (ctx.demo) ctx.demo.atualizar(dt);
  // assistir ao voo do Dragão (tecla V): a câmera fica de longe, olhando para ele; acaba quando ele pousa
  if (ctx.verVoo && ctx.dragao && ctx.dragao.voo && !ctx.demo) { const c = ctx.dragao.centro; if (!cam.cine || !cam.cine.voo) { cam.cine = { pos: new V3(82, 11, 17), alvo: new V3(126, 16, -4), fov: 52, voo: true }; document.body.classList.add('cine'); } cam.cine.alvo.lerp(_olhar.set(c.x * 0.7 + M.VULCAO.x * 0.3, c.y * 0.82 + 3, c.z * 0.7 + M.VULCAO.z * 0.3), Math.min(1, dt * 2.5)); }
  else if (cam.cine && cam.cine.voo) { ctx.verVoo = false; cam.cine = null; document.body.classList.remove('cine'); }
  h.atualizar(dt); for (const l of ctx.lobos) l.atualizar(dt); for (const pd of ctx.pedras) pd.atualizar(dt); if (ctx.dragao) ctx.dragao.atualizar(dt); ctx.vulcao.atualizar(dt); ctx.estatua.atualizar(dt);
  if (ctx.lobos.some(l => l.remover)) { for (const l of ctx.lobos) if (l.remover) cena.remove(l.raiz); ctx.lobos = ctx.lobos.filter(l => !l.remover); }
  atualizarMoradores(ctx, dt); mundoVivo(dt);
  atualizarCamera(dt); camera.updateMatrixWorld(); ctx.vfx.atualizar(dt, camera, ctx.tempo); if (ctx.uBrilho) ctx.uBrilho.esc.value = ctx.vfx.luz.mat.uniforms.esc.value; atualizarSombra(); const centro = cam.cine ? cam.cine.alvo : cam.alvo; atualizarNatureza(ctx, ctx.tempo, centro);
  ctx.clima.atualizar(dt, centro); ctx.borboletas.atualizar(dt, centro, ctx.clima.chuva); ctx.uSolV.value.copy(sol).transformDirection(camera.matrixWorldInverse); ctx.uSolF.value = luzSol.intensity / SOL_FORCA;
  // o recorte em volta do herói
  { const p = h.peito(new V3()); const vz = p.clone().applyMatrix4(camera.matrixWorldInverse); const s = p.clone().project(camera); const escala = renderer.domElement.height / (2 * Math.tan(camera.fov * PI / 360)); RECORTE.uRec.value.set((s.x * 0.5 + 0.5) * renderer.domElement.width, (s.y * 0.5 + 0.5) * renderer.domElement.height, cam.cine ? 0 : 1.5 * escala / -vz.z, -vz.z); ctx.recRaio = RECORTE.uRec.value.z; }
  // a mira da chuva e o anel do alvo
  if (h.mirando && pontoChao(rato.x, rato.y, rato.chao)) { const s = SKILLS[3]; const d = Math.hypot(rato.chao.x - h.pos.x, rato.chao.z - h.pos.z); let x = rato.chao.x, z = rato.chao.z; if (d > s.alcance) { x = h.pos.x + (x - h.pos.x) * s.alcance / d; z = h.pos.z + (z - h.pos.z) * s.alcance / d; } discoMira.visible = true; ctx.vfx.assentar(discoMira, x, z, 3.2 * (1 + Math.sin(ctx.tempo * 6) * 0.02)); h.virarPara(x, z); } else discoMira.visible = false;
  if (h.alvo && !h.alvo.morto) { discoAlvo.visible = true; ctx.vfx.assentar(discoAlvo, h.alvo.pos.x, h.alvo.pos.z, h.alvo.raio * 1.9 * (1 + Math.sin(ctx.tempo * 5) * 0.05)); } else discoAlvo.visible = false;
  tela.style.cursor = h.mirando ? 'crosshair' : (rato.sobre ? 'pointer' : 'default');
  ctx.som.ouvinte.x = h.pos.x; ctx.som.ouvinte.z = h.pos.z; ctx.som.ouvinte.dx = Math.cos(cam.yawEf); ctx.som.ouvinte.dz = -Math.sin(cam.yawEf);
  acSom += dt; if (acSom > 0.5) { acSom = 0; somDoLugar(); rato.sobre = loboSobRato(); }
  ctx.hud.atualizar(dt);
  composer.render();
}
let ultimo = 0;
function laco(agora) {
  requestAnimationFrame(laco); const dt = Math.min(0.05, (agora - ultimo) / 1000 || 0.016); ultimo = agora; quadro(dt);
  quadros++; tFps += dt; if (tFps > 0.5) { if (ctx.verFps) $('fps').innerHTML = `${Math.round(quadros / tFps)} qps<br>${renderer.info.render.calls} chamadas · ${(renderer.info.render.triangles / 1e6).toFixed(2)} M tri<br>qualidade ${NIVEL}`; quadros = 0; tFps = 0; }
}

// ---------- a montagem ----------
async function montar() {
  const barra = $('cBarra'), txt = $('cTxt'); let feito = 0; const total = 49;
  const passo = async (t) => { feito++; barra.style.width = Math.min(100, feito / total * 100) + '%'; if (t) txt.textContent = t; await new Promise(r => setTimeout(r, 0)); };
  await passo('Pintando as texturas do chão...'); criarTexturasChao(ctx);
  await passo('Levantando o relevo das ilhas...'); prepararAlturas(); M.marcarAgua(altura);
  await passo('Erguendo a capital murada...'); criarVila(ctx);
  await passo('Acendendo o vulcão e erguendo a ponte...'); criarVulcao(ctx);
  await passo('Plantando a grama e as árvores...'); criarNatureza(ctx); ctx.cerejeiras = ctx.arvores.filter(a => a.tipo === 2);
  // o reflexo da água não leva o recorte do herói
  { const ag = ctx.agua, ant = ag.onBeforeRender; ag.onBeforeRender = function (...a) { const z = RECORTE.uRec.value.z; RECORTE.uRec.value.z = 0; ant.apply(this, a); RECORTE.uRec.value.z = z; }; ag.material.uniforms.sunColor.value.set(0xfff0d8); if (QUAL.agua) { /* tamanho do reflexo fixado na criação */ } }
  for (const l of ctx.luzes) { const pl = new THREE.PointLight(l.cor, l.forca, l.raio, 2); pl.position.set(l.x, l.y, l.z); cena.add(pl); }
  // o brilho das lanternas e dos braseiros: pontos de luz somada (um desenho só)
  { const cores = [[1, 0.32, 0.12], [1, 0.72, 0.36], [1, 0.55, 0.2]]; const P = [], C = [], T = []; for (const l of ctx.lanternas) { P.push(l.x, l.y, l.z); const c = cores[l.cor] || cores[0]; C.push(c[0], c[1], c[2]); T.push(l.s); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('cor', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('tam', new THREE.Float32BufferAttribute(T, 1));
    ctx.uBrilho = { esc: { value: 1000 }, uT: ctx.uTempo, f: { value: 0.3 } };
    const m = new THREE.ShaderMaterial({ uniforms: ctx.uBrilho, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexShader: 'attribute vec3 cor; attribute float tam; varying vec3 vC; uniform float esc,uT; void main(){ vC=cor*(.82+.18*sin(uT*9.+position.x*7.+position.z*3.)); vec4 mv=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mv; gl_PointSize=min(400.,tam*1.5*esc/max(.1,-mv.z)); }', fragmentShader: 'varying vec3 vC; uniform float f; void main(){ float d=length(gl_PointCoord-.5)*2.; float a=pow(max(0.,1.-d),2.2); gl_FragColor=vec4(vC*a*f,1.); }' });
    const pts = new THREE.Points(g, m); pts.frustumCulled = false; pts.renderOrder = 8; cena.add(pts); }
  await passo('Chamando o arqueiro e os lobos...');
  ctx.som = new Som(); ctx.som.mudo = Q.get('mudo') === '1' || GRAVAR;
  await Promise.all([carregarModelos(ctx, () => passo()), ctx.som.carregar('assets/sons/', () => passo()).catch(e => console.warn('som', e))]);
  ctx.vfx = new Vfx(ctx); ctx.heroi = new Heroi(ctx); criarLobos(ctx); criarMoradores(ctx); ctx.hud = new Hud(ctx); ctx.hud.criarRotulos();
  // a atmosfera entra logo depois do desenho da cena
  if (COM_ATM) { ctx.atm = new AtmosferaPass(ctx, luzSol, (rb) => passeAO ? passeAO.beautyRenderTarget.depthTexture : rb.depthTexture, { passos: +QUAL.atm || 24 }); ctx.atm.setSize(innerWidth * (QUAL.pr ?? 1), innerHeight * (QUAL.pr ?? 1)); composer.insertPass(ctx.atm, 1); }
  ctx.clima = new Clima(ctx, { luzSol, luzCeu, solForca: SOL_FORCA, ceuForca: CEU_FORCA, exposicao: EXPOSICAO, atm: ctx.atm }); ctx.borboletas = new Borboletas(ctx);
  if (Q.get('clima')) ctx.clima.definir(Q.get('clima') === 'chuva', true);
  // a ilha vulcânica viva (lava, fumaça, erupções) e a estátua do Imugi no centro da praça
  ctx.vulcao = new Vulcao(ctx); ctx.estatua = new EstatuaImugi(ctx);
  { const e = ctx.estatua; const d = document.createElement('div'); d.className = 'rot npc'; d.innerHTML = `${e.nome}<small>${e.titulo}</small>`; ctx.hud.camada.appendChild(d); ctx.hud.rotulos.push({ d, tipo: 'npc', o: { x: e.x, z: e.z, raiz: e.raiz, alt: e.alt, longe: 24 } }); }
  // o Dragão gigante no meio da ilha vulcânica (entra na lista dos moradores só para ter o rótulo e o ponto no mapa)
  if (Q.get('dragao') !== '0') { const dg = new DragaoGigante(ctx, M.DRAGAO.x, M.DRAGAO.z, { esc: +(Q.get('dragao') || 0) || M.DRAGAO.esc, rot: M.DRAGAO.rot }); ctx.dragao = dg; const rot = { nome: dg.nome, titulo: dg.titulo, x: dg.x, z: dg.z, raiz: dg.raiz, alt: dg.alt, anim: '-', mixer: { update() { } }, longe: 90, mapa: 'dragao' }; dg.rotulo = rot; ctx.moradores.push(rot); const d = document.createElement('div'); d.className = 'rot npc'; d.innerHTML = `${dg.nome}<small>${dg.titulo}</small>`; ctx.hud.camada.appendChild(d); ctx.hud.rotulos.push({ d, tipo: 'npc', o: rot }); }
  // a Pedra Ghotin de teste, com as trevas
  if (Q.get('ghotin') !== '0') { const pd = new Ghotin(ctx, M.GHOTIN.x, M.GHOTIN.z, { nivel: M.GHOTIN.nivel }); ctx.pedras.push(pd); ctx.hud.rotuloPedra(pd); }
  discoMira = ctx.vfx.disco(3.2, ctx.vfx.texAnel, 0x9fd4ff, true, 0.9); discoMira.visible = false; discoAlvo = ctx.vfx.disco(1, ctx.vfx.texAnel, 0xff4a30, true, 0.8); discoAlvo.visible = false;
  if (Q.get('pos')) { const [x, z] = Q.get('pos').split(',').map(Number); ctx.heroi.pos.set(x, piso(x, z), z); }
  if (Q.get('hud') === '0') document.body.classList.add('cine');
  if (Q.get('cine')) { const v = Q.get('cine').split(',').map(Number); cam.cine = { pos: new V3(v[0], v[1], v[2]), alvo: new V3(v[3], v[4], v[5]), fov: v[6] || 38 }; }
  if (Q.get('cam')) { const [d, y, p] = Q.get('cam').split(',').map(Number); cam.dist = d; if (!isNaN(y)) cam.yaw = y * PI / 180; if (!isNaN(p)) cam.pitch = p * PI / 180; }
  ligarComandos();
  if (DEMO) { ctx.demo = criarDemo(ctx, cam, Q); $('ajuda').style.display = 'none'; }
  await passo('Acendendo as lanternas...'); quadro(0.016); await passo(); quadro(0.016);
  barra.style.width = '100%'; txt.textContent = 'Pronto. A Vila 1 espera por você.'; window.PRONTO = true;
  const entrar = () => { ctx.som.destravar(); $('carga').style.opacity = 0; if (GRAVAR) $('carga').remove(); else setTimeout(() => $('carga').remove(), 850); if (!DEMO) { const [zn, zs] = ctx.hud.zona(ctx.heroi.pos.x, ctx.heroi.pos.z); ctx.hud.titulo(zn, zs, 4); } ctx.som.tocar('ui_abrir', { vol: 0.6 }); if (!GRAVAR) { ultimo = performance.now(); requestAnimationFrame(laco); } };
  if (GRAVAR || Q.get('auto') === '1' || DEMO) entrar(); else { const b = $('entrar'); b.style.display = 'inline-block'; b.onclick = entrar; }
  // para gravar: avança quadros de tempo fixo, sem depender do relógio
  window.avancar = (n = 1, dt = 1 / 30) => { for (let i = 0; i < n; i++) quadro(dt); return ctx.tempo; };
  window.sonsGravados = () => ctx.som.registro;
}
montar().catch(e => { console.error(e); $('erro').textContent = 'Erro ao montar: ' + (e && e.stack || e); });
