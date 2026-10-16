#!/usr/bin/env node
/**
 * Importa uma roupa desenhada no KIT DE MOLDE para o personagem modular.
 *
 * Entrada: uma pasta com as vistas do kit e os PNGs 1024x1536 de cada peça:
 *   <pasta>/1_frente/roupa_tronco.png, roupa_coxa_esq.png, ...
 *   <pasta>/2_costas/...  <pasta>/3_lado_direito/...  <pasta>/4_lado_esquerdo/...
 *   (pode faltar vista ou peça; só o que existir é importado)
 *
 * O que o script faz, para cada PNG:
 *   1. prende a imagem no osso da peça de mesmo nome (roupa_coxa_esq -> osso coxa_esq), logo acima dela;
 *   2. desenha o contorno preto grosso do estilo do personagem nas bordas de fora
 *      (não onde a peça encosta em outra peça da mesma roupa, para não criar emenda nas juntas);
 *   3. nas laterais, cria a cópia escurecida para o braço/perna/pé do lado de lá;
 *   4. recorta e salva em <pacote>/roupas/<id>/<vista>/, escreve roupa.json e registra em dados.js.
 *
 * Uso (na pasta frontend):
 *   npm install --save-dev pngjs          (uma vez)
 *   node scripts/importar-roupa.mjs <pasta-da-roupa> --id calca_cargo --nome "Calça cargo"
 *
 * Opções:
 *   --pacote <pasta>     pasta personagem_modular (padrão: public/thelastdance/personagem_modular)
 *   --contorno <px>      espessura do contorno preto (padrão 8; 0 = não desenhar, ex. se a arte já tem contorno)
 *   --escurecer <0..1>   brilho da cópia do lado de lá (padrão 0.8)
 *   --nao-registrar      não mexe no dados.js (só gera a pasta e o roupa.json)
 *   --substituir         sobrescreve uma roupa com o mesmo id
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let PNG;
try { ({ PNG } = require('pngjs')); } catch {
  console.error('Falta o pacote "pngjs". Rode na pasta frontend:  npm install --save-dev pngjs');
  process.exit(1);
}

// ---------------------------------------------------------------- argumentos
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = { contorno: 8, escurecer: 0.8, registrar: true, substituir: false };
const posicionais = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--id') opt.id = args[++i];
  else if (a === '--nome') opt.nome = args[++i];
  else if (a === '--pacote') opt.pacote = args[++i];
  else if (a === '--contorno') opt.contorno = Number(args[++i]);
  else if (a === '--escurecer') opt.escurecer = Number(args[++i]);
  else if (a === '--nao-registrar') opt.registrar = false;
  else if (a === '--substituir') opt.substituir = true;
  else if (a === '-h' || a === '--help') { console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0]); process.exit(0); }
  else posicionais.push(a);
}
const pastaRoupa = posicionais[0];
if (!pastaRoupa) { console.error('Uso: node scripts/importar-roupa.mjs <pasta-da-roupa> --id <id> --nome "<nome>"'); process.exit(1); }
if (!fs.existsSync(pastaRoupa)) { console.error('Pasta não encontrada: ' + pastaRoupa); process.exit(1); }
opt.id = opt.id || path.basename(path.resolve(pastaRoupa)).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
opt.nome = opt.nome || opt.id.replace(/_/g, ' ');
if (!/^[a-z0-9_]+$/.test(opt.id)) { console.error('--id deve ter só letras minúsculas, números e _ (ex.: calca_cargo)'); process.exit(1); }

const candidatosPacote = [opt.pacote, 'public/thelastdance/personagem_modular', path.join(__dirname, '../public/thelastdance/personagem_modular')].filter(Boolean);
const pacote = candidatosPacote.find((p) => fs.existsSync(path.join(p, 'rig.json')));
if (!pacote) { console.error('Não achei o rig.json. Informe a pasta com --pacote <.../personagem_modular>'); process.exit(1); }

const rig = JSON.parse(fs.readFileSync(path.join(pacote, 'rig.json'), 'utf8'));
const [W, H] = rig.canvas;
const PASTAS = { '1_frente': 'frente', '2_costas': 'costas', '3_lado_direito': 'lado_direito', '4_lado_esquerdo': 'lado_esquerdo' };
const TRAS = { coxa: 'coxa_tras', canela: 'canela_tras', pe_frente: 'pe_tras', braco: 'braco_tras' };

// ---------------------------------------------------------------- utilidades de imagem
function lerPNG(arq) {
  const png = PNG.sync.read(fs.readFileSync(arq));
  if (png.width !== W || png.height !== H) throw new Error(`${arq}: tem ${png.width}x${png.height}, precisa ser ${W}x${H} (canvas do kit de molde)`);
  const d = png.data;
  for (let i = 0; i < d.length; i += 4) { if (d[i + 3] >= 128) d[i + 3] = 255; else { d[i] = d[i + 1] = d[i + 2] = d[i + 3] = 0; } }
  return d;
}
function mascara(d) { const m = new Uint8Array(W * H); for (let p = 0; p < W * H; p++) m[p] = d[p * 4 + 3] ? 1 : 0; return m; }
function dilatar(m, r) { // quadrado (2r+1)x(2r+1), separável
  const t = new Uint8Array(W * H), o = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) { let c = 0; const row = y * W;
    for (let x = -r; x < W; x++) { if (x + r < W && m[row + x + r]) c++; if (x - r - 1 >= 0 && m[row + x - r - 1]) c--; if (x >= 0) t[row + x] = c > 0 ? 1 : 0; } }
  for (let x = 0; x < W; x++) { let c = 0;
    for (let y = -r; y < H; y++) { if (y + r < H && t[(y + r) * W + x]) c++; if (y - r - 1 >= 0 && t[(y - r - 1) * W + x]) c--; if (y >= 0) o[y * W + x] = c > 0 ? 1 : 0; } }
  return o;
}
function distancia(alvo) { // distância (chanfro 3-4, em px) até o pixel "alvo" mais próximo
  const INF = 1e9, d = new Float64Array(W * H);
  for (let p = 0; p < W * H; p++) d[p] = alvo[p] ? 0 : INF;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const p = y * W + x; let v = d[p];
    if (x > 0) v = Math.min(v, d[p - 1] + 3); if (y > 0) { v = Math.min(v, d[p - W] + 3);
      if (x > 0) v = Math.min(v, d[p - W - 1] + 4); if (x < W - 1) v = Math.min(v, d[p - W + 1] + 4); } d[p] = v; }
  for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) { const p = y * W + x; let v = d[p];
    if (x < W - 1) v = Math.min(v, d[p + 1] + 3); if (y < H - 1) { v = Math.min(v, d[p + W] + 3);
      if (x < W - 1) v = Math.min(v, d[p + W + 1] + 4); if (x > 0) v = Math.min(v, d[p + W - 1] + 4); } d[p] = v; }
  for (let p = 0; p < W * H; p++) d[p] /= 3;
  return d;
}
function salvarRecorte(d, arq) {
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return null;
  const w = x1 - x0 + 1, h = y1 - y0 + 1, png = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++) d.copy(png.data, y * w * 4, ((y0 + y) * W + x0) * 4, ((y0 + y) * W + x1 + 1) * 4);
  fs.mkdirSync(path.dirname(arq), { recursive: true });
  fs.writeFileSync(arq, PNG.sync.write(png, { colorType: 6 }));
  return { x: x0, y: y0 };
}

// ---------------------------------------------------------------- importação
const destino = path.join(pacote, 'roupas', opt.id);
if (fs.existsSync(destino)) {
  if (!opt.substituir) { console.error(`Já existe a roupa "${opt.id}". Use --substituir para sobrescrever, ou outro --id.`); process.exit(1); }
  fs.rmSync(destino, { recursive: true, force: true });
}
const roupa = { id: opt.id, nome: opt.nome, vistas: {} };
let total = 0;
const avisos = [];

for (const [pasta, vista] of Object.entries(PASTAS)) {
  const dir = path.join(pastaRoupa, pasta);
  if (!fs.existsSync(dir)) { avisos.push(`vista ${vista}: pasta ${pasta} não existe (ignorada)`); continue; }
  const v = rig.vistas[vista];
  const pecas = Object.fromEntries(v.camadas.map((c) => [c.nome, c]));
  const brutas = [];
  for (const f of fs.readdirSync(dir).filter((f) => /^roupa_.+\.png$/i.test(f)).sort()) {
    const peca = f.slice(6, -4);
    if (!pecas[peca]) { avisos.push(`vista ${vista}: "${f}" não corresponde a nenhuma peça (${Object.keys(pecas).join(', ')})`); continue; }
    const d = lerPNG(path.join(dir, f));
    const m = mascara(d);
    if (!m.some(Boolean)) continue;
    brutas.push({ peca, d, m });
  }
  if (!brutas.length) continue;

  const camadas = [];
  let k = 0;
  for (const b of brutas) {
    if (opt.contorno > 0) {
      const outras = new Uint8Array(W * H);
      for (const o of brutas) if (o !== b) for (let p = 0; p < W * H; p++) if (o.m[p]) outras[p] = 1;
      const outrasD = dilatar(outras, 2);
      const fora = new Uint8Array(W * H);
      for (let p = 0; p < W * H; p++) fora[p] = !b.m[p] && !outrasD[p] ? 1 : 0;
      const dist = distancia(fora);
      for (let p = 0; p < W * H; p++) if (b.m[p] && dist[p] <= opt.contorno) { b.d[p * 4] = b.d[p * 4 + 1] = b.d[p * 4 + 2] = 0; }
    }
    const camada = pecas[b.peca];
    const add = (dados, nomePeca) => {
      const c = pecas[nomePeca];
      const rel = `roupas/${opt.id}/${vista}/${c.osso}_${k++}.png`;
      const pos = salvarRecorte(dados, path.join(pacote, rel));
      if (pos) { camadas.push({ osso: c.osso, z: c.z + 0.5, img: rel, x: pos.x, y: pos.y }); total++; }
    };
    add(b.d, b.peca);
    if (TRAS[b.peca] && pecas[TRAS[b.peca]]) {
      const esc = Buffer.from(b.d);
      for (let p = 0; p < W * H; p++) if (esc[p * 4 + 3]) for (let c = 0; c < 3; c++) esc[p * 4 + c] = Math.round(esc[p * 4 + c] * opt.escurecer);
      add(esc, TRAS[b.peca]);
    }
    void camada;
  }
  roupa.vistas[vista] = { camadas };
  console.log(`  ${vista}: ${camadas.length} camada(s)`);
}

if (!total) { console.error('Nenhuma camada importada. Confira os nomes: <pasta>/1_frente/roupa_<peça>.png'); process.exit(1); }
fs.mkdirSync(destino, { recursive: true });
fs.writeFileSync(path.join(destino, 'roupa.json'), JSON.stringify(roupa, null, 1));

if (opt.registrar) {
  const arqDados = path.join(pacote, 'dados.js');
  const txt = fs.readFileSync(arqDados, 'utf8');
  const ini = txt.indexOf('window.PERSONAGEM_MODULAR = ') + 'window.PERSONAGEM_MODULAR = '.length;
  const fim = txt.lastIndexOf(';');
  const dados = JSON.parse(txt.slice(ini, fim));
  dados.roupas = dados.roupas || {};
  dados.roupas[opt.id] = roupa;
  fs.writeFileSync(arqDados, txt.slice(0, ini) + JSON.stringify(dados) + txt.slice(fim));
}

for (const a of avisos) console.warn('aviso: ' + a);
console.log(`\nRoupa "${opt.nome}" (${opt.id}) importada: ${total} camada(s) em ${path.relative(process.cwd(), destino) || destino}`);
console.log(opt.registrar ? 'Registrada em dados.js. No jogo: heroi.vestir(\'' + opt.id + '\')' : 'dados.js não foi alterado (--nao-registrar).');
console.log('Confira abrindo teste.html: aparece um botão para a roupa nova.');
