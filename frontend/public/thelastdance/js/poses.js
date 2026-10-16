// Poses extras do personagem modular, montadas girando os ossos (sem desenho novo).
// "celular": ele levanta o antebraço e olha o celular, preso na mão como um acessório (roupa "celular_mao").
// "bigode": ele leva a mão ao rosto e enrola a ponta do bigode (acessório "pose_bigode" põe o braço na frente do rosto).
// API: NSF.Poses.preparar(heroi) (uma vez) ; depois heroi.tocar("celular") + heroi.vestir("celular_mao"),
//      ou heroi.tocar("bigode") + heroi.vestir("pose_bigode").
(function (global) {
  "use strict";

  // Rotação de "graus" em volta do ponto (px, py), no formato de matriz do personagem: [a, b, c, d, e, f].
  function girar(graus, px, py) {
    const r = graus * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
    return [c, s, -s, c, px - c * px + s * py, py - s * px - c * py];
  }

  // Desenho do celular (com a tela do app de fotos), já inclinado para ficar em pé quando a mão gira.
  function imagemCelular(inclinacao) {
    const c = global.document.createElement("canvas");
    c.width = 240; c.height = 240;          // no tamanho do desenho do personagem (a mão tem ~70 px)
    const g = c.getContext("2d");
    g.translate(120, 120); g.rotate(inclinacao * Math.PI / 180); g.scale(2.2, 2.2);
    g.fillStyle = "#14141a"; g.strokeStyle = "#000"; g.lineWidth = 4;
    g.beginPath(); g.roundRect(-20, -34, 40, 68, 7); g.fill(); g.stroke();
    const tela = g.createLinearGradient(-15, -28, 15, 26);
    tela.addColorStop(0, "#ff5ad8"); tela.addColorStop(0.5, "#ff8a3d"); tela.addColorStop(1, "#7a3cff");
    g.fillStyle = tela; g.fillRect(-15, -28, 30, 54);
    g.fillStyle = "rgba(255,255,255,0.85)"; // "foto" e o coraçãozinho
    g.fillRect(-11, -22, 22, 22);
    g.fillStyle = "#ff2d55"; g.beginPath(); g.arc(-4, 10, 4, 0, 7); g.arc(4, 10, 4, 0, 7); g.moveTo(-8, 11); g.lineTo(0, 19); g.lineTo(8, 11); g.fill();
    return c;
  }

  // Braço de duas partes (ombro S -> cotovelo E0 -> pulso W0) apontado para o alvo; o cotovelo vai para "lado"
  // (+1 = para a direita da tela). Devolve as rotações (graus) do braço e do antebraço, para a função girar.
  function ik(S, E0, W0, alvo, lado) {
    const L1 = Math.hypot(E0[0] - S[0], E0[1] - S[1]), L2 = Math.hypot(W0[0] - E0[0], W0[1] - E0[1]);
    const dx = alvo[0] - S[0], dy = alvo[1] - S[1], d = Math.min(Math.hypot(dx, dy), L1 + L2 - 1);
    const base = Math.atan2(dy, dx), a = Math.acos((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d));
    const ang1 = [base + a, base - a].sort((p, q) => lado * (Math.cos(q) - Math.cos(p)))[0];
    const E = [S[0] + L1 * Math.cos(ang1), S[1] + L1 * Math.sin(ang1)];
    const ang2 = Math.atan2(alvo[1] - E[1], alvo[0] - E[0]);
    const g = (r) => r * 180 / Math.PI;
    const r1 = g(ang1 - Math.atan2(E0[1] - S[1], E0[0] - S[0]));
    const r2 = g(ang2 - Math.atan2(W0[1] - E0[1], W0[0] - E0[0])) - r1; // relativo ao braço (osso filho)
    return [r1, r2];
  }

  function preparar(heroi) {
    if (heroi.animacoes.celular) return;
    const ossos = heroi.rig.vistas;
    // frente: braço direito (lado direito da tela). O antebraço sobe ~140° e a mão volta o mesmo tanto (fica reta).
    const fr = ossos.frente.ossos, ANG = 140;
    const frenteQuadro = (balanco) => ({
      antbraco_dir: girar(ANG + balanco, fr.antbraco_dir.pivo[0], fr.antbraco_dir.pivo[1]),
      mao_dir: girar(-ANG - balanco, fr.mao_dir.pivo[0], fr.mao_dir.pivo[1]),
      braco_sup_dir: girar(-8, fr.braco_sup_dir.pivo[0], fr.braco_sup_dir.pivo[1]),
      cabeca: girar(0, 0, 0).map((v, i) => (i === 5 ? v + 6 : v)), // cabeça um pouco para baixo
    });
    // laterais: o braço inteiro vai para a frente do rosto; a cabeça inclina para olhar a tela
    const lado = (vista, sinal) => {
      const o = ossos[vista].ossos;
      return (balanco) => ({
        braco: girar(sinal * (-75 - balanco), o.braco.pivo[0], o.braco.pivo[1]),
        cabeca: girar(sinal * 9, o.cabeca.pivo[0], o.cabeca.pivo[1]),
      });
    };
    const ld = lado("lado_direito", 1), le = lado("lado_esquerdo", -1);
    const costas = ossos.costas.ossos;
    const quadros = (f) => [f(0), f(2), f(0), f(-2)]; // rolando o feed: o braço mexe de leve
    heroi.animacoes.celular = {
      fps: 3, loop: true,
      vistas: {
        frente: quadros(frenteQuadro),
        lado_direito: quadros(ld),
        lado_esquerdo: quadros(le),
        costas: quadros(() => ({ cabeca: girar(0, 0, 0).map((v, i) => (i === 5 ? v + 6 : v)),
          braco_dir: girar(-25, costas.braco_dir.pivo[0], costas.braco_dir.pivo[1]) })),
      },
    };
    // bigode: a mão vai até a boca e enrola a ponta (balança alguns graus)
    const [r1, r2] = ik(fr.braco_sup_dir.pivo, fr.antbraco_dir.pivo, fr.mao_dir.pivo, [612, 680], 1);
    const bigodeFrente = (b) => ({
      braco_sup_dir: girar(r1, fr.braco_sup_dir.pivo[0], fr.braco_sup_dir.pivo[1]),
      antbraco_dir: girar(r2 + b, fr.antbraco_dir.pivo[0], fr.antbraco_dir.pivo[1]),
      mao_dir: girar(15 + 3 * b, fr.mao_dir.pivo[0], fr.mao_dir.pivo[1]),
    });
    const bigodeLado = (vista, sinal) => {
      const o = ossos[vista].ossos;
      return (b) => ({
        braco: girar(sinal * (-142 - b), o.braco.pivo[0], o.braco.pivo[1]),
        cabeca: girar(sinal * -4, o.cabeca.pivo[0], o.cabeca.pivo[1]),
      });
    };
    const enrolar = (f) => [f(0), f(6), f(10), f(6)];
    heroi.animacoes.bigode = {
      fps: 6, loop: true,
      vistas: {
        frente: enrolar(bigodeFrente),
        lado_direito: enrolar(bigodeLado("lado_direito", 1)),
        lado_esquerdo: enrolar(bigodeLado("lado_esquerdo", -1)),
        costas: enrolar((b) => ({ braco_dir: girar(-150 - b, costas.braco_dir.pivo[0], costas.braco_dir.pivo[1]) })),
      },
    };
    heroi.roupas.pose_bigode = {
      id: "pose_bigode", nome: "Mão no bigode", acessorio: true,
      vistas: {
        frente: { camadas: [], substituir: { antbraco_dir: { z: 20 }, mao_dir: { z: 21 } } }, // braço de cima fica atrás
        lado_direito: { camadas: [], substituir: { braco: { z: 20 } } },
        lado_esquerdo: { camadas: [], substituir: { braco: { z: 20 } } },
        costas: { camadas: [] },
      },
    };

    // o celular é uma "roupa": preso no osso da mão; na frente, também põe antebraço e mão por cima do tronco
    heroi.imagens["pose:celular_frente"] = imagemCelular(0);
    heroi.imagens["pose:celular_ld"] = imagemCelular(75);
    heroi.imagens["pose:celular_le"] = imagemCelular(-75);
    const pm = fr.mao_dir.pivo;
    heroi.roupas.celular_mao = {
      id: "celular_mao", nome: "Celular na mão", acessorio: true,
      vistas: {
        frente: {
          camadas: [{ osso: "mao_dir", z: 16, img: "pose:celular_frente", x: pm[0] - 120, y: pm[1] - 95 }],
          substituir: { antbraco_dir: { z: 14 }, mao_dir: { z: 15 } },
        },
        lado_direito: { camadas: [{ osso: "braco", z: 16, img: "pose:celular_ld",
          x: ossos.lado_direito.ossos.braco.pivo[0] - 120, y: ossos.lado_direito.ossos.braco.pivo[1] + 150 }] },
        lado_esquerdo: { camadas: [{ osso: "braco", z: 16, img: "pose:celular_le",
          x: ossos.lado_esquerdo.ossos.braco.pivo[0] - 120, y: ossos.lado_esquerdo.ossos.braco.pivo[1] + 150 }] },
        costas: { camadas: [] },
      },
    };
  }

  const Poses = { preparar, girar };
  if (global.NSF) global.NSF.Poses = Poses;
  global.NSF_POSES = Poses;
})(typeof window !== "undefined" ? window : globalThis);
