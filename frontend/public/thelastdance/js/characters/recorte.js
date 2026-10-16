// Animação por recorte (cutout): o personagem é um conjunto de peças pintadas presas a ossos.
// Cada osso gira/desloca/escala em torno do seu pivô; os filhos herdam. Sem engine, Canvas 2D puro.
// Coordenadas do rig = pixels do desenho-fonte (conceito 1024×1536). Ângulos em graus, positivo = horário na tela.
(function (global) {
  "use strict";

  // Matriz afim no formato do canvas: [a, b, c, d, e, f].
  function multiplicar(m, n) {
    return [
      m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1],
      m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
      m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5],
    ];
  }

  // Transformação local de um osso: desloca (x, y), gira e escala em torno do pivô.
  function local(pivo, k) {
    const r = ((k && k.rot) || 0) * Math.PI / 180;
    const sx = k && k.sx != null ? k.sx : 1;
    const sy = k && k.sy != null ? k.sy : 1;
    const cos = Math.cos(r), sen = Math.sin(r);
    const a = cos * sx, b = sen * sx, c = -sen * sy, d = cos * sy;
    const px = pivo[0], py = pivo[1];
    return [a, b, c, d,
      px + ((k && k.x) || 0) - (a * px + c * py),
      py + ((k && k.y) || 0) - (b * px + d * py)];
  }

  function aplicar(m, x, y) {
    return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
  }

  // Matriz de mundo de cada osso. Os ossos do rig vêm na ordem pai-antes-do-filho.
  function mundo(rig, pose) {
    const m = {};
    for (const o of rig.ossos) {
      const l = local(o.pivo, pose[o.nome]);
      m[o.nome] = o.pai ? multiplicar(m[o.pai], l) : l;
    }
    return m;
  }

  // Opacidade de cada osso (multiplica pela do pai). Osso "oculto" no rig começa invisível: a animação liga
  // com { a: 1 }. Serve para objetos (garrafa, cigarro) e para a fumaça sumindo.
  function alfas(rig, pose) {
    const a = {};
    for (const o of rig.ossos) {
      const k = pose[o.nome];
      const proprio = k && k.a != null ? k.a : (o.oculto ? 0 : 1);
      a[o.nome] = (o.pai ? a[o.pai] : 1) * proprio;
    }
    return a;
  }

  const osso = (rig, nome) => rig.ossos.find((o) => o.nome === nome);
  const girar = (v, graus) => {
    const r = graus * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
    return [v[0] * c - v[1] * s, v[0] * s + v[1] * c];
  };

  // Onde um ponto do desenho vai parar depois da transformação local de um osso (ex.: a boca, com a cabeça
  // inclinada), no espaço do pai desse osso.
  function pontoLocal(rig, nome, k, ponto) {
    return aplicar(local(osso(rig, nome).pivo, k), ponto[0], ponto[1]);
  }

  // Alcance de dois ossos (braço + antebraço): leva o PUNHO até 'alvo' (no espaço do pai do braço, o torso).
  // Lei dos cossenos. Se não alcança, estica até 'esticarMax' (exagero de desenho animado) e o resto vira
  // deslocamento do ombro na direção do alvo. dobra: +1 ou −1, para que lado o cotovelo dobra.
  // encurta (< 1): o braço aponta para a câmera e parece mais curto (de frente, para a mão chegar ao queixo).
  // O esticamento é uma escala UNIFORME só no braço (antebraço e mão herdam): escala só em y, aninhada,
  // esticaria o antebraço duas vezes e o entortaria quando girado.
  // Devolve { ombro: {rot, x, y, sx, sy}, cotovelo: {rot}, escala } para usar na pose.
  function alcancar(rig, cadeia, alvo, opcoes) {
    const op = Object.assign({ dobra: 1, esticarMax: 1.12, desloqueMax: 60, encurta: 1 }, opcoes);
    const S = osso(rig, cadeia[0]).pivo, E = osso(rig, cadeia[1]).pivo, W = osso(rig, cadeia[2]).pivo;
    const L1 = Math.hypot(E[0] - S[0], E[1] - S[1]), L2 = Math.hypot(W[0] - E[0], W[1] - E[1]);
    let dx = alvo[0] - S[0], dy = alvo[1] - S[1];
    let d = Math.hypot(dx, dy);
    const f = op.encurta;
    const k = f * Math.min(op.esticarMax, Math.max(1, d / ((L1 + L2) * f)));
    let mx = 0, my = 0;
    const sobra = d - (L1 + L2) * k;
    if (sobra > 0) { // o ombro vai um pouco na direção do alvo
      const m = Math.min(op.desloqueMax, sobra + 0.5);
      mx = dx / d * m; my = dy / d * m;
      dx -= mx; dy -= my; d = Math.hypot(dx, dy);
    }
    const a = L1 * k, b = L2 * k;
    const dd = Math.max(Math.abs(a - b) + 1e-3, Math.min(a + b - 1e-3, d));
    const angAlvo = Math.atan2(dy, dx);
    const a1 = Math.acos((a * a + dd * dd - b * b) / (2 * a * dd));
    const dirSup = angAlvo - op.dobra * a1;
    const cx = Math.cos(dirSup) * a, cy = Math.sin(dirSup) * a;
    const dirInf = Math.atan2(dy - cy, dx - cx);
    const grau = 180 / Math.PI;
    const repSup = Math.atan2(E[1] - S[1], E[0] - S[0]), repInf = Math.atan2(W[1] - E[1], W[0] - E[0]);
    const rotSup = (dirSup - repSup) * grau;
    const rotInf = (dirInf - repInf) * grau - rotSup;
    const esc = k / f; // parte uniforme (esticar); o encurtamento f fica só no eixo do braço
    return { ombro: { rot: rotSup, x: mx, y: my, sx: esc, sy: k }, cotovelo: { rot: rotInf }, escala: esc };
  }

  // Facilidades para escrever animações: t vai de 0 a 1 dentro do ciclo.
  const onda = (t, fase) => Math.sin(2 * Math.PI * (t + (fase || 0)));
  const suave = (t) => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
  // Valor por trechos com transição suave: chaves = [[t, valor], ...] em ordem crescente de t.
  function chaves(t, lista) {
    if (t <= lista[0][0]) return lista[0][1];
    for (let i = 1; i < lista.length; i++) {
      if (t <= lista[i][0]) {
        const [t0, v0] = lista[i - 1], [t1, v1] = lista[i];
        return v0 + (v1 - v0) * suave((t - t0) / (t1 - t0));
      }
    }
    return lista[lista.length - 1][1];
  }

  // Mantém os pés no chão enquanto o corpo balança: desfaz nas pernas o deslocamento e o giro do corpo.
  function plantarPes(pose) {
    const c = pose.corpo || {};
    for (const lado of ["dir", "esq"]) {
      const coxa = pose["coxa_" + lado] = pose["coxa_" + lado] || {};
      const canela = pose["canela_" + lado] = pose["canela_" + lado] || {};
      coxa.rot = (coxa.rot || 0) - (c.rot || 0);
      canela.x = (canela.x || 0) - (c.x || 0);
      canela.y = (canela.y || 0) - (c.y || 0);
    }
    return pose;
  }

  // Pose de uma animação no tempo (segundos). Animação = { duracao, laco, pose(t01, rig) }.
  function amostrar(anim, segundos, rig) {
    const t = anim.laco === false
      ? Math.min(1, segundos / anim.duracao)
      : ((segundos / anim.duracao) % 1 + 1) % 1;
    return anim.pose(t, rig);
  }

  // Carrega rig.json e as imagens das peças (navegador).
  async function carregar(pasta) {
    const rig = await (await fetch(pasta + "rig.json")).json();
    const imagens = {};
    await Promise.all(rig.pecas.map((p) => new Promise((ok, erro) => {
      const img = new Image();
      img.onload = () => ok();
      img.onerror = () => erro(new Error("peça não carregou: " + p.arquivo));
      img.src = pasta + p.arquivo;
      imagens[p.nome] = img;
    })));
    return { rig, imagens };
  }

  // Desenha o boneco com os pés (osso raiz) em (x, y) da tela. escala: 1 = tamanho do desenho-fonte.
  function desenhar(ctx, boneco, pose, x, y, escala, espelhar) {
    const mats = mundo(boneco.rig, pose);
    const opac = alfas(boneco.rig, pose);
    const raiz = boneco.rig.ossos[0].pivo;
    const base = multiplicar([escala * (espelhar ? -1 : 1), 0, 0, escala, x, y], [1, 0, 0, 1, -raiz[0], -raiz[1]]);
    for (const p of boneco.rig.pecas) {
      if (opac[p.osso] <= 0) continue;
      const m = multiplicar(base, mats[p.osso]);
      ctx.save();
      ctx.globalAlpha *= Math.min(1, opac[p.osso]);
      ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
      ctx.drawImage(boneco.imagens[p.nome], p.origem[0], p.origem[1]);
      ctx.restore();
    }
    return { mats, base };
  }

  // Depuração: pivôs e ligações entre ossos.
  function desenharOssos(ctx, boneco, info) {
    ctx.save();
    ctx.lineWidth = 3;
    for (const o of boneco.rig.ossos) {
      const m = multiplicar(info.base, info.mats[o.nome]);
      const [x, y] = aplicar(m, o.pivo[0], o.pivo[1]);
      if (o.pai) {
        const pai = boneco.rig.ossos.find((q) => q.nome === o.pai);
        const mp = multiplicar(info.base, info.mats[o.pai]);
        const [xp, yp] = aplicar(mp, pai.pivo[0], pai.pivo[1]);
        ctx.strokeStyle = "rgba(0,255,200,0.8)";
        ctx.beginPath(); ctx.moveTo(xp, yp); ctx.lineTo(x, y); ctx.stroke();
      }
      ctx.fillStyle = "#00ffc8";
      ctx.beginPath(); ctx.arc(x, y, 6, 0, 2 * Math.PI); ctx.fill();
    }
    ctx.restore();
  }

  const Recorte = { multiplicar, local, aplicar, mundo, alfas, girar, pontoLocal, alcancar, onda, suave, chaves, plantarPes, amostrar, carregar, desenhar, desenharOssos };
  if (global.NSF) global.NSF.Recorte = Recorte;
  if (typeof module !== "undefined") module.exports = Recorte;
})(typeof window !== "undefined" ? window : globalThis);
