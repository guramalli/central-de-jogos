// A interface: barras, skills, alvo, rótulos, números de dano, minimapa.
import * as THREE from 'three';
import * as M from './mapa.js';
import { SKILLS } from './personagens.js';
import { altura } from './natureza.js';

const $ = (id) => document.getElementById(id);
const V3 = THREE.Vector3;

export class Hud {
  constructor(ctx) {
    this.ctx = ctx; this.camada = $('camada'); this.nums = []; this.tAviso = 0; this.tZona = 0; this.zonaAtual = ''; this.tMapa = 0; this.v = new V3();
    // skills
    const cx = $('skills'); this.slots = [];
    SKILLS.forEach((s, i) => {
      const d = document.createElement('div'); d.className = 'skill'; d.style.backgroundImage = `url(assets/icones/arqueiro_${i}.webp)`;
      d.innerHTML = `<span class="tecla">${s.tecla}</span><div class="sem"></div><div class="cd"></div>`; cx.appendChild(d);
      d.addEventListener('mouseenter', () => { const t = $('dica'); t.style.display = 'block'; t.innerHTML = `<b>${s.nome}</b><br>${s.desc}<br><small>Recarga ${s.recarga} s · Mana ${s.mana}</small>`; });
      d.addEventListener('mouseleave', () => { $('dica').style.display = 'none'; });
      d.addEventListener('mousedown', (e) => { e.stopPropagation(); ctx.heroi.usarSkill(i); });
      this.slots.push({ d, cd: d.querySelector('.cd'), sem: d.querySelector('.sem'), ant: 0 });
    });
    for (let i = 0; i < 46; i++) { const d = document.createElement('div'); d.className = 'num'; this.camada.appendChild(d); this.nums.push({ d, t: 9, vida: 1, p: new V3(), dx: 0 }); }
    this.rotulos = [];
    this.fundoMapa = null; this.gm = $('mapa').getContext('2d');
  }
  criarRotulos() {
    for (const n of this.ctx.moradores) { const d = document.createElement('div'); d.className = 'rot npc'; d.innerHTML = `${n.nome}<small>${n.titulo}</small>`; this.camada.appendChild(d); this.rotulos.push({ d, tipo: 'npc', o: n }); }
    for (const l of this.ctx.lobos) this.rotuloLobo(l);
  }
  rotuloLobo(l) { const d = document.createElement('div'); d.innerHTML = `<span class="nm"></span> <span style="opacity:.8;font-weight:500">Nv ${l.nivel}</span><div class="hp"><i></i></div>`; this.camada.appendChild(d); this.rotulos.push({ d, tipo: 'lobo', o: l, nm: d.querySelector('.nm'), hp: d.querySelector('.hp'), hpi: d.querySelector('.hp i'), nome: '' }); }
  rotuloPedra(p) { const d = document.createElement('div'); d.className = 'rot pedra'; d.innerHTML = `${p.nome} <span style="opacity:.8;font-weight:500">Nv ${p.nivel}</span><small>Pedra Ghotin · trevas de ${p.raioTrevas.toFixed(0)} m</small><div class="hp"><i></i></div>`; this.camada.appendChild(d); this.rotulos.push({ d, tipo: 'pedra', o: p, hp: d.querySelector('.hp'), hpi: d.querySelector('.hp i') }); }
  aviso(txt, dur = 1.7) { const a = $('aviso'); a.textContent = txt; a.style.opacity = 1; this.tAviso = dur; }
  titulo(t, sub, dur = 3.4) { $('zTit').textContent = t; $('zSub').textContent = sub; $('zona').style.opacity = 1; this.tZona = dur; }
  registro(html) { const r = $('registro'); const d = document.createElement('div'); d.innerHTML = html; r.appendChild(d); while (r.children.length > 6) r.removeChild(r.firstChild); setTimeout(() => { d.style.opacity = 0; setTimeout(() => d.remove(), 1100); }, 7000); }
  numero(p, valor, tipo) { let n = this.nums.find(n => n.t >= n.vida); if (!n) n = this.nums[0]; n.t = 0; n.vida = tipo === 'critico' ? 1.25 : 1.0; n.p.copy(p); n.dx = (Math.random() - 0.5) * 46; n.d.className = 'num n-' + tipo; n.d.textContent = typeof valor === 'number' ? (tipo === 'critico' ? valor + '!' : valor) : valor; n.d.style.display = 'block'; }
  projetar(p) { const v = this.v.copy(p).project(this.ctx.camera); return { x: (v.x * 0.5 + 0.5) * innerWidth, y: (-v.y * 0.5 + 0.5) * innerHeight, ok: v.z < 1 && v.z > -1 && Math.abs(v.x) < 1.15 && Math.abs(v.y) < 1.2 }; }
  zona(x, z) {
    if (M.dentroRet(x, z, M.CID)) { if (M.dentroRet(x, z, M.TERRACO, 1) || (z < -4 && Math.abs(x) < 16)) return ['Palácio da Pérola', 'Vila 1 · a capital']; if (x < -17 && z < 0) return ['Jardim do Pagode', 'Vila 1 · a capital']; if (x > 17 && z < 0) return ['Quartel', 'Vila 1 · a capital']; if (x > 6 && z > 11) return ['Feira e Forja', 'Vila 1 · a capital']; if (x < -6.5 && z > 11.5) return ['Bairro das Casas', 'Vila 1 · a capital']; return ['Vila 1', 'A capital murada']; }
    for (const pd of (this.ctx.pedras || [])) if (!pd.morto && Math.hypot(x - pd.pos.x, z - pd.pos.z) < pd.raioTrevas + 1.5) return ['Trevas da Ghotin', 'As criaturas daqui estão amaldiçoadas'];
    if (Math.hypot(x - M.LOBOS.x, z - M.LOBOS.z) < M.LOBOS.r + 9) return ['Campos dos Cães', 'Lobos · níveis 1 a 22'];
    if (Math.hypot(x - M.ESTATUA.x, z - M.ESTATUA.z) < M.ESTATUA.r + 0.3 || (z < M.PONTE.z - M.PONTE.larg / 2 && z > M.ESTATUA.z && Math.abs(x - M.ESTATUA.x) < 1.8)) return ['Terraço do Imugi', 'O guardião da entrada do vulcão'];
    if (x > M.PONTE.x2 - 0.5 && M.naIlhaVulcanica(x, z)) return Math.hypot(x - M.VULCAO.x, z - M.VULCAO.z) < M.VULCAO.patio + 1 ? ['Ninho do Dragão', 'O pátio no meio da cratera'] : ['Ilha do Vulcão', 'Lava, cinza e basalto'];
    if (x > M.PONTE.xr && x <= M.PONTE.x2 && Math.abs(z - M.PONTE.z) < M.PONTE.larg / 2) return ['Ponte do Dragão', 'A travessia para a ilha do vulcão'];
    if (Math.hypot(x - M.MIRANTE.x, z - M.MIRANTE.z) < 10) return ['Mirante do Leste', 'A beira do mundo-pintura'];
    if (Math.hypot(x - M.LAGO.x, z - M.LAGO.z) < M.LAGO.r + 10) return ['Lago do Oeste', 'Águas calmas'];
    if (M.dentroRet(x, z, M.TREINO, 3)) return ['Campo de Treino', 'Alvos e bonecos'];
    if (M.dentroRet(x, z, M.ROCA, 3)) return ['Roça do Sul', 'Campos de trigo'];
    if (Math.exp(-((x + 46) ** 2 + (z + 40) ** 2) / 1100) > 0.35) return ['Floresta do Norte', 'Pinheiros e carvalhos'];
    return ['Arredores da Vila 1', 'Campos abertos'];
  }
  fazerFundoMapa() {
    // o mapa inteiro, 1 ponto por metro: a ilha da vila, a ponte e a ilha vulcânica. O minimapa mostra um quadro de 180 m em volta do herói.
    const X0 = -96, X1 = 184, Z0 = -96, Z1 = 96, W = X1 - X0, H = Z1 - Z0; const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); const im = g.createImageData(W, H); const V = M.VULCAO, B = M.PONTE;
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const x = X0 + i + 0.5, z = Z0 + j + 0.5; const h = altura(x, z); let r, gg, b;
      if (h < -0.05) { r = 22; gg = 60; b = 78; } else if (h < 0.75 && x < 90 && M.costa(x, z) > 52) { r = 190; gg = 170; b = 124; } else { const s = Math.min(1, Math.max(0, (h - 1) / 6)); r = 74 + s * 20; gg = 104 + s * 14; b = 50 + s * 12; if (M.distEstrada(x, z) < 0) { r = 150; gg = 124; b = 88; } }
      if (M.dentroRet(x, z, M.CID)) { r = 128; gg = 120; b = 108; if (M.dentroRet(x, z, M.CID, -1.6)) { r = 104; gg = 98; b = 90; } if (Math.abs(x) < 4.2 && z > -4.6 || (Math.abs(x) < 16 && z > -4.6 && z < 10) || (z > 1.4 && z < 6.6)) { r = 164; gg = 156; b = 138; } if (M.dentroRet(x, z, M.TERRACO)) { r = 176; gg = 140; b = 70; } }
      // a ilha vulcânica: basalto escuro, a lava acesa, o pátio e o corredor mais claros
      if (x > 90 && h >= -0.05) { const [vb, vq] = M.vulcaoInfo(x, z, h); if (vb > 0.3) { const s = Math.min(1, Math.max(0, (h - 1) / 20)); r = 50 + s * 50; gg = 48 + s * 46; b = 54 + s * 46; if (h < 0.8) { r = 40; gg = 40; b = 45; }
          if (vq > 0.86 || (h < V.lava && Math.hypot(x - V.x, z - V.z) < V.fosso + 2.5)) { r = 255; gg = 124; b = 30; } else if (vq > 0.5) { r = 172; gg = 70; b = 28; } if (M.vulcaoAndavel(x, z)) { r = 104; gg = 98; b = 98; } } }
      if ((x > B.xr && x < B.x2 + 0.6 && Math.abs(z - B.z) < B.larg / 2) || Math.hypot(x - M.ESTATUA.x, z - M.ESTATUA.z) < M.ESTATUA.r || (Math.abs(x - M.ESTATUA.x) < 1.6 && z < B.z && z > M.ESTATUA.z)) { r = 190; gg = 184; b = 170; }     // a ponte e o terraço da estátua
      const k = (j * W + i) * 4; im.data[k] = r; im.data[k + 1] = gg; im.data[k + 2] = b; im.data[k + 3] = 255;
    }
    g.putImageData(im, 0, 0); this.fundoMapa = c; this.mapa = { X0, X1, Z0, Z1 };
  }
  desenharMapa() {
    const g = this.gm, ctx = this.ctx, h = ctx.heroi; if (!this.fundoMapa) this.fazerFundoMapa(); const mp = this.mapa;
    const ox = Math.round(Math.max(mp.X0, Math.min(mp.X1 - 180, h.pos.x - 90))), oz = Math.round(Math.max(mp.Z0, Math.min(mp.Z1 - 180, h.pos.z - 90))); const mx = (x) => x - ox, mz = (z) => z - oz;
    g.drawImage(this.fundoMapa, mp.X0 - ox, mp.Z0 - oz);
    for (const n of ctx.moradores) { if (n.mapa === 'dragao') { g.fillStyle = '#ff7a2a'; g.strokeStyle = '#2a0c04'; g.lineWidth = 1; g.beginPath(); g.arc(mx(n.x), mz(n.z), 5, 0, 6.283); g.fill(); g.stroke(); continue; } g.fillStyle = '#ffe07a'; g.beginPath(); g.arc(mx(n.x), mz(n.z), 2, 0, 6.283); g.fill(); }
    if (ctx.estatua) { g.fillStyle = '#e9e2cf'; g.strokeStyle = '#3a3428'; g.lineWidth = 1; g.beginPath(); g.rect(mx(ctx.estatua.x) - 3, mz(ctx.estatua.z) - 3, 6, 6); g.fill(); g.stroke(); }
    for (const pd of (ctx.pedras || [])) { if (pd.morto) continue; const px = mx(pd.pos.x), pz = mz(pd.pos.z); g.fillStyle = 'rgba(20,10,30,0.55)'; g.beginPath(); g.arc(px, pz, pd.raioTrevas + 2, 0, 6.283); g.fill(); g.fillStyle = '#c05cff'; g.strokeStyle = '#1a0a24'; g.lineWidth = 1; g.beginPath(); g.moveTo(px, pz - 5); g.lineTo(px + 4, pz); g.lineTo(px, pz + 5); g.lineTo(px - 4, pz); g.closePath(); g.fill(); g.stroke(); }
    for (const l of ctx.lobos) { if (l.morto) continue; g.fillStyle = l.tipo === 'alfa' ? '#ff5a2a' : '#e8402e'; g.beginPath(); g.arc(mx(l.pos.x), mz(l.pos.z), l.tipo === 'alfa' ? 3.2 : 2.2, 0, 6.283); g.fill(); }
    g.save(); g.translate(mx(h.pos.x), mz(h.pos.z)); g.rotate(-h.rot + Math.PI); g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, -6); g.lineTo(4.5, 5); g.lineTo(0, 2.5); g.lineTo(-4.5, 5); g.closePath(); g.fill(); g.stroke(); g.restore();
  }
  atualizar(dt) {
    const ctx = this.ctx, h = ctx.heroi;
    $('bVida').style.transform = `scaleX(${h.vida / h.vidaMax})`; $('tVida').textContent = `${Math.ceil(h.vida)} / ${h.vidaMax}`; $('bMana').style.transform = `scaleX(${h.mana / h.manaMax})`; $('tMana').textContent = `${Math.floor(h.mana)} / ${h.manaMax}`; $('bXp').style.transform = `scaleX(${h.xp / h.xpProx})`; $('nivel').textContent = h.nivel;
    // skills
    SKILLS.forEach((s, i) => {
      const sl = this.slots[i], r = h.recargas[i];
      if (r > 0) { const total = s.recarga * (ctx.recargaCurta ? 0.25 : 1); const k = r / total; sl.cd.style.display = 'grid'; sl.cd.style.background = `conic-gradient(rgba(0,0,0,.72) ${k * 360}deg, rgba(0,0,0,.18) 0deg)`; sl.cd.textContent = r >= 1 ? Math.ceil(r) : r.toFixed(1); }
      else { if (sl.ant > 0) { sl.d.classList.remove('pronta'); void sl.d.offsetWidth; sl.d.classList.add('pronta'); } sl.cd.style.display = 'none'; }
      sl.ant = r; sl.sem.style.display = r <= 0 && h.mana < s.mana ? 'block' : 'none'; sl.d.classList.toggle('ativa', (s.id === 'chuva' && h.mirando) || (s.id === 'passos' && h.buffPassos > 0));
    });
    const bf = $('buffs'); if (h.buffPassos > 0) { if (!this.buffEl) { this.buffEl = document.createElement('div'); this.buffEl.className = 'buff'; this.buffEl.style.backgroundImage = 'url(assets/icones/arqueiro_4.webp)'; this.buffEl.innerHTML = '<span></span>'; bf.appendChild(this.buffEl); } this.buffEl.firstChild.textContent = Math.ceil(h.buffPassos); } else if (this.buffEl) { this.buffEl.remove(); this.buffEl = null; }
    // alvo
    const a = h.alvo; const qa = $('alvo'); if (a && !a.morto) { qa.style.display = 'block'; $('aNome').textContent = a.nome; $('aNivel').textContent = 'Nível ' + a.nivel; $('aVida').style.transform = `scaleX(${Math.max(0, a.vida / a.vidaMax)})`; $('aTxt').textContent = `${Math.ceil(a.vida)} / ${a.vidaMax}`; $('aEst').innerHTML = (a.veneno > 0 ? `<span class="e-ven">Envenenado ${Math.ceil(a.veneno)} s</span>` : '') + (a.fogo > 0 ? `<span class="e-fog">Queimando ${Math.ceil(a.fogo)} s</span>` : '') + (a.atordoado > 0 ? `<span class="e-ato">Atordoado</span>` : ''); } else qa.style.display = 'none';
    // avisos e zona
    if (this.tAviso > 0) { this.tAviso -= dt; if (this.tAviso <= 0) $('aviso').style.opacity = 0; }
    if (this.tZona > 0) { this.tZona -= dt; if (this.tZona <= 0) $('zona').style.opacity = 0; }
    const [zn, zs] = this.zona(h.pos.x, h.pos.z); if (zn !== this.zonaAtual) { this.zonaAtual = zn; $('zonaNome').textContent = zn; if (ctx.tempo > 1 && !ctx.semTitulos) this.titulo(zn, zs); }
    // rótulos
    const p = new V3();
    for (let i = this.rotulos.length - 1; i >= 0; i--) {
      const r = this.rotulos[i]; let ver = false; const o = r.o;
      if (o.remover) { r.d.remove(); this.rotulos.splice(i, 1); continue; }
      if (r.tipo === 'npc') { const d = Math.hypot(o.x - h.pos.x, o.z - h.pos.z); if (d < (o.longe || 20)) { p.set(o.x, o.raiz.position.y + o.alt + 0.1, o.z); ver = true; } }
      else if (!o.morto) { const d = Math.hypot(o.pos.x - h.pos.x, o.pos.z - h.pos.z); if (d < (r.tipo === 'pedra' ? 34 : 24)) { p.set(o.pos.x, o.pos.y + o.altura + (r.tipo === 'pedra' ? 0.9 : 0.45), o.pos.z); ver = true; const mh = r.tipo === 'pedra' || o.mostrarVida > 0 || h.alvo === o || o.vida < o.vidaMax; r.hp.style.display = mh ? 'block' : 'none'; if (mh) r.hpi.style.transform = `scaleX(${Math.max(0, o.vida / o.vidaMax)})`;
          if (r.tipo === 'lobo' && r.nome !== o.nome) { r.nome = o.nome; r.nm.textContent = o.nome; r.d.className = 'rot lobo' + (o.tipo === 'alfa' ? ' alfa' : '') + (o.maldita ? ' maldito' : ''); } } }
      if (ver) { const sc = this.projetar(p); if (sc.ok) { r.d.style.display = 'block'; r.d.style.transform = `translate(${sc.x.toFixed(1)}px,${sc.y.toFixed(1)}px) translate(-50%,-100%)`; } else r.d.style.display = 'none'; } else r.d.style.display = 'none';
    }
    // números
    for (const n of this.nums) { if (n.t >= n.vida) continue; n.t += dt; if (n.t >= n.vida) { n.d.style.display = 'none'; continue; } const k = n.t / n.vida; const s = this.projetar(n.p); const sobe = (1 - (1 - k) * (1 - k)) * 70; const esc = k < 0.12 ? 0.6 + k / 0.12 * 0.6 : 1.2 - Math.min(1, (k - 0.12) / 0.2) * 0.2; n.d.style.transform = `translate(${(s.x + n.dx * k).toFixed(1)}px,${(s.y - sobe).toFixed(1)}px) translate(-50%,-50%) scale(${esc.toFixed(2)})`; n.d.style.opacity = k > 0.65 ? (1 - (k - 0.65) / 0.35).toFixed(2) : 1; }
    this.tMapa -= dt; if (this.tMapa <= 0) { this.tMapa = 0.15; this.desenharMapa(); }
    if (ctx.clima) { const c = ctx.clima; const txt = c.chuva > 0.5 ? (c.alvo > 0.5 ? 'Chuva' : 'A chuva passa') : (c.alvo > 0.5 ? 'Vem chuva' : 'Sol'); if (txt !== this.climaTxt) { this.climaTxt = txt; $('clima').textContent = txt + ' · R muda o tempo'; } }
  }
}
