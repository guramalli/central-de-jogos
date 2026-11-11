// A demonstração, para os vídeos:
//   ?demo=mapa  um passeio de câmera: a vila, a estátua do Imugi, a ponte, a ilha vulcânica com o Dragão, o vento nos campos, o lago, a chuva com relâmpagos;
//   ?demo=luta  um robô que caça os lobos com as 5 skills e depois quebra a Ghotin da Tristeza;
//   ?demo=vulcao a estátua do Imugi na entrada da ilha, a travessia da ponte a pé e o Dragão, que levanta voo, dá a volta e pousa;
//   ?demo=1     as duas primeiras, uma depois da outra.
import * as THREE from 'three';
import * as M from './mapa.js';
import { piso } from './natureza.js';

const V3 = THREE.Vector3;
const suave = (t) => t * t * (3 - 2 * t);

export function criarDemo(ctx, cam, Q) {
  const h = ctx.heroi; const modo = Q.get('demo') === 'mapa' ? 'mapa' : Q.get('demo') === 'vulcao' ? 'vulcao' : (Q.get('demo') === 'luta' || Q.get('so') === 'luta') ? 'luta' : 'tudo';
  ctx.recargaCurta = true; ctx.renascerLobos = 9; ctx.clima.auto = false; ctx.clima.definir(false, true);
  const dano0 = h.receber.bind(h); h.receber = (d, de) => dano0(Math.round(d * 0.35), de);
  // os planos de câmera: [duração, posição A, posição B, alvo A, alvo B, abertura, o que acontece no começo do plano]
  const dg = ctx.dragao;
  const lista = [
    [5.0, [46, 31, 90], [26, 18, 60], [0, 5, 14], [0, 7, 20], 40],                                   // a ilha e a capital, de fora
    [5.5, [11.5, 2.6, 0], [9.5, 2.4, 3.5], [-9, 6, 13], [-10, 6.5, 14], 52],                       // a praça contra o sol: os raios de luz
    [5.0, [0.6, 10, 21], [0.3, 6.5, 8.5], [0, 5, -6], [0, 9, -22], 40],                              // pela avenida até o palácio
    [6.0, [86.5, 9.2, -3.2], [101, 9.6, -2.2], [132, 13, -9], [128, 15.5, -9], 54, () => ctx.agendar(1.6, () => dg && dg.agir('rugir'))],   // pela ponte até a ilha vulcânica: a estátua do Imugi na entrada, e o Dragão ruge
    [5.5, [100, 23.5, -14], [104, 21.5, -9.5], [131.5, 15, -2.5], [130, 15.5, -1], 52, () => { if (dg) { dg.estado = 'parado'; dg.agir('sopro'); } ctx.agendar(2.2, () => ctx.vulcao.erupcao(1.5)); }],   // sopra fogo, e o pico entra em erupção
    [12.0, [82, 11, 17], [80, 12.5, 20], [126, 14, -4], [126, 14, -4], 52, () => { if (dg) { dg.estado = 'parado'; dg.tocar('parado'); dg.voar(6); } ctx.agendar(5.5, () => ctx.vulcao.erupcao(1)); }, 'voo'],   // o Dragão levanta voo e dá a volta por cima do vulcão
    [5.5, [38.5, 4.6, 12], [41, 4.0, 15.5], [52, 1.6, 24], [52, 1.8, 22], 46],                       // o vento nos campos dos lobos
    [5.0, [-40.5, 3.3, 1.5], [-43, 2.7, 5.5], [-56, 0.2, 12], [-56, 0.4, 11], 48, () => ctx.clima.definir(true)],   // o lago, e a chuva chegando
    [7.0, [15, 9.5, 17], [10, 8, 12], [0, 3.4, 3], [0, 3.8, 2.5], 42, () => ctx.agendar(2.4, () => ctx.clima.raio(new V3(-12, 0, -62), true))],   // a chuva na praça
    [5.5, [2.6, 2.3, 9.5], [1.4, 2.1, 14], [0, 4.6, 30], [0, 5.2, 30], 50, () => { ctx.agendar(1.4, () => ctx.clima.raio(new V3(9, 0, 78), true)); ctx.agendar(2.6, () => ctx.clima.definir(false)); ctx.agendar(3.8, () => ctx.clima.raio(new V3(-14, 0, 70), true)); }],   // a avenida molhada
    [6.5, [72, 26, 70], [156, 74, 108], [22, 4, 4], [72, 0, -2], 40],                                // o sol volta: as duas ilhas e a ponte
  ];
  const planos = []; { let t = 0; for (const p of lista) { planos.push([t, t + p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7]]); t += p[0]; } }
  const segueVoo = () => { if (dg && dg.voo && cam.cine) { const c = dg.centro; cam.cine.alvo.set(c.x * 0.7 + M.VULCAO.x * 0.3, c.y * 0.82 + 3, c.z * 0.7 + M.VULCAO.z * 0.3); } };   // a câmera olha para o Dragão no ar
  const total = planos[planos.length - 1][1]; let planoAtual = -1;
  const fimPasseio = modo === 'luta' ? 0 : total; let fase = 0, tFase = 0, tBot = 0, t0 = 0; const kite = new V3(); const fimDado = +(Q.get('fim') || 0);
  if (modo !== 'luta') document.body.classList.add('cine'); else { h.pos.set(40, piso(40, 4.5), 4.5); fase = 2; }
  const pedra = () => ctx.pedras[0];
  if (ctx.pedras[0]) { const pd = ctx.pedras[0]; pd.vidaMax = Math.round(pd.vidaMax * 0.62); pd.vida = pd.vidaMax; }   // na demonstração a pedra cai mais depressa, para caber no vídeo
  const lobosPerto = (r) => ctx.lobos.filter(l => !l.morto && Math.hypot(l.pos.x - h.pos.x, l.pos.z - h.pos.z) < r);
  const centro = () => { const ls = lobosPerto(15); if (!ls.length) return null; let x = 0, z = 0; for (const l of ls) { x += l.pos.x; z += l.pos.z; } return new V3(x / ls.length, 0, z / ls.length); };
  // ?demo=vulcao: a estátua na entrada da ilha, a travessia da ponte a pé (com a câmera do jogo) e o voo do Dragão
  const vulc = { fase: 0, tJogo: 0, tChegou: 0, tFim: 0 };
  const tomada = (t, t0, t1, a, b, c, d, fov) => { const k = suave(Math.min(1, Math.max(0, (t - t0) / (t1 - t0)))); cam.cine = { pos: new V3().fromArray(a).lerp(new V3().fromArray(b), k), alvo: new V3().fromArray(c).lerp(new V3().fromArray(d), k), fov }; };
  function roteiroVulcao(dt) {
    const t = ctx.tempo, v = vulc; h.mana = h.manaMax;
    if (t < 5) return tomada(t, 0, 5, [150, 62, 112], [128, 44, 92], [60, 0, -4], [74, 2, -5], 40);                    // as duas ilhas e a ponte
    if (t < 10) return tomada(t, 5, 10, [93, 9.4, -2.6], [100.5, 8.2, -6.4], [107, 10.2, -16], [106.7, 11.4, -16.2], 52);   // pela ponte até a estátua do Imugi, na entrada da ilha
    if (t < 14.5) return tomada(t, 10, 14.5, [102.6, 6.5, -8.6], [108.8, 6.9, -9.4], [106.7, 10.4, -16.2], [106.7, 11.3, -16.2], 58);   // a estátua de frente, vista do fim da ponte
    if (v.fase === 0) { v.fase = 1; v.tJogo = t; cam.cine = null; document.body.classList.remove('cine'); h.pos.set(71.2, piso(71.2, -5.6), -5.6); h.rot = Math.PI / 2; cam.alvo.set(0, 0, 0); cam.dist = 14.5; cam.yaw = Math.PI / 4; h.irPara(127.4, -5.4); ctx.agendar(0.5, () => h.usarSkill(4)); }
    if (v.fase === 1) { if (!h.rota && t - v.tJogo > 1) { v.fase = 2; v.tChegou = t; if (dg) { ctx.agendar(0.5, () => dg.agir('rugir')); ctx.agendar(4.2, () => { dg.estado = 'parado'; dg.tocar('parado'); dg.voar(7); }); } ctx.agendar(7.5, () => ctx.vulcao.erupcao(1.5)); } return; }
    if (v.fase === 2) { if (t - v.tChegou > 12.6) { v.fase = 3; v.tFim = t; document.body.classList.add('cine'); } else return; }   // do pátio, o herói vê o Dragão decolar
    const u = t - v.tFim;
    if (u < 8.2) { tomada(u, 0, 8.2, [82, 11, 17], [80, 12.5, 20], [126, 14, -4], [126, 14, -4], 52); segueVoo(); return; }   // de longe: a volta por cima do vulcão
    if (u < 15.2) return tomada(u, 8.2, 15.2, [181, 33, 30], [170, 25, 42], [140, 15, -7], [139, 9, -6], 44);              // do mar: ele desce e pousa no pátio
    return tomada(u, 15.2, 20.5, [78, 24, 62], [156, 74, 108], [112, 4, -4], [72, 0, -2], 40);                           // as duas ilhas, de longe
  }
  return {
    modo,
    atualizar(dt) {
      if (modo === 'vulcao') { roteiroVulcao(dt); return; }
      const t = ctx.tempo; tFase += dt; h.mana = Math.min(h.manaMax, h.mana + 45 * dt);          // na demonstração a mana volta depressa
      // o fecho: a câmera sobe e mostra a ilha
      const fim = this.fim || fimDado; if (fim && t >= fim) { if (!this.fecho) { this.fecho = { de: ctx.camera.position.clone(), alvo: cam.alvo.clone() }; document.body.classList.add('cine'); } const k = suave(Math.min(1, (t - fim) / 5)); cam.cine = { pos: this.fecho.de.clone().lerp(new V3(96, 44, 62), k), alvo: this.fecho.alvo.clone().lerp(new V3(8, 4, 2), k), fov: 34 + 6 * k }; }
      if (t < fimPasseio) {
        const ip = Math.max(0, planos.findIndex(p => t >= p[0] && t < p[1])); const p = planos[ip]; if (ip !== planoAtual) { planoAtual = ip; if (p[7]) p[7](); } const k = suave((t - p[0]) / (p[1] - p[0]));
        cam.cine = { pos: new V3().fromArray(p[2]).lerp(new V3().fromArray(p[3]), k), alvo: new V3().fromArray(p[4]).lerp(new V3().fromArray(p[5]), k), fov: p[6] || 40 }; if (p[8] === 'voo') segueVoo();
        return;
      }
      if (modo === 'mapa') return;
      if (fase === 0) { cam.cine = null; document.body.classList.remove('cine'); fase = 2; tFase = 0; h.pos.set(40, piso(40, 4.5), 4.5); cam.alvo.set(0, 0, 0); cam.dist = 16; ctx.clima.definir(false, true); }
      if (fase === 2) { if (tFase < 0.1) { h.irPara(48.5, 13.5); t0 = t; } if (tFase > 1.0 && !this.passos) { this.passos = true; h.usarSkill(4); } if (tFase > 2.9) { fase = 3; tFase = 0; } return; }
      if (this.fecho) return;
      tBot -= dt; if (tBot > 0) return; tBot = 0.22; if (h.morto) return;
      const pd = pedra(); const naPedra = fase === 4;
      // depois de 19 s de caçada, vai até a Ghotin
      if (fase === 3 && t - t0 > 21) { fase = 4; tFase = 0; this.fuga = 0; h.irPara(47.6, 31.8, false); ctx.hud.aviso('A Ghotin da Tristeza: as trevas a sudeste', 3); return; }
      if (fase === 4 && tFase < 4.2 && Math.hypot(h.pos.x - 47.6, h.pos.z - 31.8) > 1.5) { if (!h.rota) h.irPara(47.6, 31.8, false); if (h.recargas[4] <= 0 && h.buffPassos <= 0) h.usarSkill(4); return; }
      if (naPedra && pd && pd.morto && pd.estado === 'morta' && !this.fim) { this.fim = t + 3.2; }
      if (h.acao && !h.acao.solto) return;                                                 // não corta o tiro
      const perto = ctx.loboMaisPerto(h.pos, 30); const dL = perto ? Math.hypot(perto.pos.x - h.pos.x, perto.pos.z - h.pos.z) : 99; const bravo = perto && (perto.estado === 'perseguir' || perto.estado === 'morder');
      const alvoPedra = naPedra && pd && !pd.morto && pd.estado === 'viva';
      let alvo = alvoPedra ? pd : perto; if (alvoPedra && bravo && dL < 2.6 && lobosPerto(3).length >= 3) alvo = perto;      // a horda em cima: limpa um pouco
      if (!alvo) { if (!h.rota) h.irPara(M.LOBOS.x - 6, M.LOBOS.z - 6); return; }
      const d = Math.hypot(alvo.pos.x - h.pos.x, alvo.pos.z - h.pos.z); if (h.alvo !== alvo) h.marcar(alvo); const c = alvoPedra ? new V3(pd.pos.x, 0, pd.pos.z) : centro();
      if (!(this.fuga > t) || d > 4) for (const i of [1, 3, 0, 2]) {
        if (h.recargas[i] > 0 || h.mana < 130 || d > 11.5) continue;
        if (i === 3) { if (!c) continue; const ponto = new V3(c.x, piso(c.x, c.z), c.z); if (Math.hypot(ponto.x - h.pos.x, ponto.z - h.pos.z) > 13) continue; h.usarSkill(3, ponto); this.fuga = 0; return; }
        if (h.usarSkill(i)) { this.fuga = 0; return; }
      }
      // sem skill pronta: se chegaram perto, corre para longe do bando (com os Passos Leves) e volta a atirar
      if (bravo && dL < 3.0 && !(this.fuga > t)) {
        const cc = centro() || perto.pos; kite.set(h.pos.x - cc.x, 0, h.pos.z - cc.z).normalize(); const base = alvoPedra ? pd.pos : new V3(M.LOBOS.x, 0, M.LOBOS.z); let tx = h.pos.x + kite.x * 8, tz = h.pos.z + kite.z * 8;
        if (M.bloqueado(tx, tz) || Math.hypot(tx - base.x, tz - base.z) > (alvoPedra ? 11 : 22)) { tx = h.pos.x - kite.z * 7 - kite.x * 2; tz = h.pos.z + kite.x * 7 - kite.z * 2; }
        if (M.bloqueado(tx, tz) || Math.hypot(tx - base.x, tz - base.z) > (alvoPedra ? 12 : 24)) { const a = Math.atan2(h.pos.z - base.z, h.pos.x - base.x) + 1.2; tx = base.x + Math.cos(a) * (alvoPedra ? 8 : 6); tz = base.z + Math.sin(a) * (alvoPedra ? 8 : 6); }
        if (h.recargas[4] <= 0 && h.buffPassos <= 0) h.usarSkill(4); h.irPara(tx, tz); this.fuga = t + 1.4; return;
      }
      if (this.fuga > t) return;
      h.atacar(alvo);
    },
  };
}
