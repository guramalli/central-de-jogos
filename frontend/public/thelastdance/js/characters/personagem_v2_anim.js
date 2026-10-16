// Animações do PERSONAGEM V2 (camiseta branca), vistas de FRENTE e de LADO (olhando para a direita da tela;
// para a esquerda, o jogo espelha). Cada animação devolve a pose dos ossos num instante t (0 a 1).
// Graus: positivo = horário na tela. De frente, braço direito dele (à esquerda da tela) abre com +, o esquerdo com −.
// De lado, um membro pendurado vai para a FRENTE com − (anti-horário) e para trás com +.
// Objetos (garrafa, cigarro, fumaca1..3) começam escondidos: { a: 1 } mostra.
(function (global) {
  "use strict";
  const R = global.NSF && global.NSF.Recorte ? global.NSF.Recorte : require("./recorte.js");
  const { onda, chaves, plantarPes, alcancar, pontoLocal, girar } = R;
  const PI2 = 2 * Math.PI;

  // Pontos do desenho usados pelo alcance automático (coordenadas da prancha).
  const PONTOS = {
    frente: { boca: [210, 425], garrafa: [-5, -52], cigarro: [43, 12] },   // garrafa/cigarro: punho -> ponta que vai à boca
    lado: { boca: [1478, 425], garrafa: [7, -50], cigarro: [11, 12] },
  };
  const BRACO_DIR = ["braco_dir", "antebraco_dir", "mao_dir"];
  const BRACO_ESQ = ["braco_esq", "antebraco_esq", "mao_esq"];
  const mistura = (k, q) => ({ rot: (k.rot || 0) * q, x: (k.x || 0) * q, y: (k.y || 0) * q,
    sx: 1 + ((k.sx ?? 1) - 1) * q, sy: 1 + ((k.sy ?? 1) - 1) * q });

  // Leva a ponta do objeto (ou o punho) até 'alvo'. anguloMao: inclinação da mão no espaço do torso.
  // q: 0 = braço em repouso, 1 = no alvo. Sem rig (testes antigos), não faz nada.
  function levar(pose, rig, cadeia, alvo, vetor, anguloMao, q, op) {
    if (!rig || q <= 0) return pose;
    const v = girar(vetor, anguloMao);
    let ik = { escala: 1 };
    for (let i = 0; i < 3; i++) { // a mão e o objeto crescem junto quando o braço estica: refaz a conta
      ik = alcancar(rig, cadeia, [alvo[0] - v[0] * ik.escala, alvo[1] - v[1] * ik.escala], op);
    }
    pose[cadeia[0]] = mistura(ik.ombro, q);
    pose[cadeia[1]] = mistura(ik.cotovelo, q);
    pose[cadeia[2]] = Object.assign(pose[cadeia[2]] || {}, { rot: (anguloMao - ik.ombro.rot - ik.cotovelo.rot) * q });
    return pose;
  }
  // A boca já com a cabeça inclinada (no espaço do torso).
  const boca = (rig, pose, vista) => pontoLocal(rig, "cabeca", pose.cabeca, PONTOS[vista].boca);

  // Três baforadas saindo da boca: sobem, crescem e somem, uma atrás da outra. dir = para onde a fumaça vai.
  function fumaca(t, inicio, fim, dir) {
    const p = {};
    for (let i = 0; i < 3; i++) {
      const u = (t - inicio - i * 0.06) / (fim - inicio - 0.12);
      if (u <= 0 || u >= 1) { p["fumaca" + (i + 1)] = { a: 0 }; continue; }
      const s = 0.5 + 1.8 * u;
      p["fumaca" + (i + 1)] = {
        a: 0.95 * Math.sin(Math.PI * Math.min(1, u * 1.4)) * (1 - u),
        x: dir * (18 + 70 * u) + 10 * Math.sin(u * 7 + i), y: -20 - 120 * u - i * 6, sx: s, sy: s,
      };
    }
    return p;
  }

  // Mão chegando à boca e voltando: 0 parado, 1 na boca. Segura entre "chega" e "sai".
  const leva = (t, chega, sai) => chaves(t, [[0, 0], [chega, 1], [sai, 1], [Math.min(1, sai + chega), 0], [1, 0]]);

  const FRENTE = {
    parado: {
      duracao: 2.8,
      pose(t) {
        const r = onda(t);
        return plantarPes({
          corpo: { y: -1.5 * r }, torso: { sy: 1 + 0.008 * r },
          cabeca: { rot: -1 * onda(t, -0.12), y: -1.2 * onda(t, -0.12) },
          braco_dir: { rot: 1.2 * r }, braco_esq: { rot: -1.2 * r },
          antebraco_dir: { rot: 1 * onda(t, -0.1) }, antebraco_esq: { rot: -1 * onda(t, -0.1) },
        });
      },
    },

    // De frente, no lugar: o pé sobe, o corpo desce no apoio e balança para o lado do apoio.
    andar: {
      duracao: 0.9,
      pose(t) {
        const passo = onda(t, 0.25);
        const sobe = Math.abs(onda(t));
        const levDir = t < 0.5 ? Math.sin(PI2 * t) : 0;
        const levEsq = t >= 0.5 ? Math.sin(PI2 * (t - 0.5)) : 0;
        return plantarPes({
          corpo: { y: 5 - 9 * sobe, x: 4 * passo, rot: 2 * passo },
          torso: { rot: -1.4 * passo }, cabeca: { rot: -1.2 * passo, y: 1.5 * sobe },
          braco_dir: { rot: 5 * passo, sy: 1 - 0.06 * Math.max(0, -passo) },
          braco_esq: { rot: 5 * passo, sy: 1 - 0.06 * Math.max(0, passo) },
          antebraco_dir: { rot: -6 * Math.max(0, -passo) }, antebraco_esq: { rot: 6 * Math.max(0, passo) },
          coxa_dir: { rot: 2 * levDir }, canela_dir: { y: -18 * levDir, x: 2 * levDir },
          coxa_esq: { rot: -2 * levEsq }, canela_esq: { y: -18 * levEsq, x: -2 * levEsq },
        });
      },
    },

    // Dança: quica a cada batida, quadril de um lado para o outro, punhos para o alto ao lado da cabeça,
    // um de cada vez.
    danca: {
      duracao: 1.1,
      pose(t, rig) {
        const bate = Math.abs(onda(t));
        const lado = onda(t, 0.25);
        const p = {
          corpo: { y: 10 * bate, x: 7 * lado, rot: 4 * lado },
          torso: { rot: -3 * lado }, cabeca: { rot: 6 * onda(2 * t, 0.1), y: 2 * bate },
          coxa_dir: { rot: -2 * lado }, coxa_esq: { rot: -2 * lado },
        };
        levar(p, rig, BRACO_DIR, [48, 415 - 40 * Math.max(0, lado)], [0, 0], -20, 1, { dobra: 1 });
        levar(p, rig, BRACO_ESQ, [372, 415 - 40 * Math.max(0, -lado)], [0, 0], 20, 1, { dobra: -1 });
        return plantarPes(p);
      },
    },

    // Pegar algo na altura da cintura, à frente: o braço vem para a câmera (encurta e a mão cresce),
    // fecha a mão e volta.
    pegar: {
      duracao: 2.2,
      pose(t) {
        const vai = chaves(t, [[0, 0], [0.3, 1], [0.55, 1], [0.85, 0], [1, 0]]);
        const fecha = chaves(t, [[0, 0], [0.32, 0], [0.42, 1], [1, 1]]) * (t < 0.95 ? 1 : 0);
        return plantarPes({
          corpo: { y: 7 * vai }, torso: { rot: -2 * vai, sy: 1 - 0.02 * vai }, cabeca: { rot: 3 * vai, y: 4 * vai },
          braco_dir: { rot: -14 * vai, sy: 1 - 0.32 * vai }, antebraco_dir: { rot: -38 * vai, sy: 1 - 0.15 * vai },
          mao_dir: { rot: 25 * vai, sx: 1 + 0.18 * vai - 0.06 * fecha, sy: 1 + 0.18 * vai - 0.08 * fecha },
          braco_esq: { rot: -2 * vai },
        });
      },
    },

    // Guarda de luta (de desenho animado): pernas abertas e joelhos dobrados, cotovelos junto ao corpo e
    // punhos erguidos na altura do peito, gingando; um jab com a esquerda vindo para a câmera.
    luta: {
      duracao: 1.6,
      pose(t) {
        const ginga = onda(2 * t);
        const jab = chaves(t, [[0, 0], [0.5, 0], [0.56, 1], [0.66, 1], [0.76, 0], [1, 0]]);
        return plantarPes({
          corpo: { y: 16 + 3 * ginga, rot: 1.5 * onda(t) },
          torso: { rot: -1.5 * onda(t) + 2 * jab }, cabeca: { y: 3, rot: -2 * jab },
          coxa_dir: { rot: 7 }, coxa_esq: { rot: -7 },
          braco_dir: { rot: -8 }, antebraco_dir: { rot: 168 + 4 * ginga }, mao_dir: { rot: -178, sx: 1.15, sy: 1.15 },
          braco_esq: { rot: 8 - 4 * jab, sy: 1 - 0.45 * jab },
          antebraco_esq: { rot: -168 - 4 * ginga + 150 * jab, sy: 1 - 0.3 * jab },
          mao_esq: { rot: 178 - 160 * jab, sx: 1.15 + 0.4 * jab, sy: 1.15 + 0.4 * jab, x: -40 * jab, y: -30 * jab },
        });
      },
    },

    // Beber: ergue a garrafa até a boca (braço dobrado na frente do peito), inclina, dois goles, abaixa.
    beber: {
      duracao: 3.4,
      pose(t, rig) {
        const q = leva(t, 0.22, 0.72);
        const gole = t > 0.3 && t < 0.68 ? 0.5 + 0.5 * onda((t - 0.3) / 0.19) : 0;
        const p = {
          garrafa: { a: 1 }, corpo: { y: -2 * q }, torso: { rot: -1.5 * q },
          cabeca: { rot: -3 * q - 2 * gole, y: -4 * q - 2 * gole },
        };
        levar(p, rig, BRACO_DIR, boca(rig, p, "frente"), PONTOS.frente.garrafa, 70 + 30 * q + 12 * gole, q, { dobra: -1 });
        return plantarPes(p);
      },
    },

    // Fumar: leva o cigarro à boca, traga, abaixa e solta a fumaça.
    fumar: {
      duracao: 4.2,
      pose(t, rig) {
        const q = leva(t, 0.16, 0.42);
        const traga = t > 0.2 && t < 0.42 ? Math.sin(Math.PI * (t - 0.2) / 0.22) : 0;
        const p = Object.assign({
          cigarro: { a: 1, sx: -1 },
          torso: { sy: 1 + 0.01 * traga }, cabeca: { rot: -2 * q, y: -2 * q },
        }, fumaca(t, 0.5, 1, 1));
        levar(p, rig, BRACO_DIR, boca(rig, p, "frente"), PONTOS.frente.cigarro, -10, q, { dobra: -1 });
        return plantarPes(p);
      },
    },
  };

  // De lado: a perna de longe fica um pouco à frente na pose de base (como no desenho).
  const baseLado = (p) => {
    p.coxa_esq = p.coxa_esq || {}; p.canela_esq = p.canela_esq || {};
    p.coxa_esq.rot = (p.coxa_esq.rot || 0) - 6;
    p.canela_esq.rot = (p.canela_esq.rot || 0) + 3;
    return p;
  };

  const LADO = {
    parado: {
      duracao: 2.8,
      pose(t) {
        const r = onda(t);
        return plantarPes(baseLado({
          corpo: { y: -1.5 * r }, torso: { rot: 0.6 * r }, cabeca: { rot: -1.2 * onda(t, -0.12) },
          braco_dir: { rot: -1.5 * r }, braco_esq: { rot: 1.5 * r },
        }));
      },
    },

    // Caminhada de perfil (no lugar): coxas vão e vêm, o joelho dobra quando a perna passa para a frente,
    // braços no sentido oposto às pernas, corpo desce no apoio.
    andar: {
      duracao: 0.9,
      pose(t) {
        const p = PI2 * t;
        const dobra = (fase) => 38 * Math.max(0, Math.sin(p + fase));
        return {
          corpo: { y: 4 * Math.cos(2 * p) - 2 }, torso: { rot: 2 }, cabeca: { rot: -1 + 1.5 * Math.cos(2 * p) },
          coxa_dir: { rot: -24 * Math.cos(p) }, canela_dir: { rot: dobra(Math.PI) },
          coxa_esq: { rot: 24 * Math.cos(p) }, canela_esq: { rot: dobra(0) },
          braco_dir: { rot: 20 * Math.cos(p) }, antebraco_dir: { rot: -12 - 8 * Math.max(0, -Math.cos(p)) },
          braco_esq: { rot: -20 * Math.cos(p) }, antebraco_esq: { rot: -12 - 8 * Math.max(0, Math.cos(p)) },
        };
      },
    },

    // Dança de perfil: quica, punhos socando o ar para a frente e para cima (na altura do peito, sem tampar
    // o rosto), um de cada vez; cabeça balança.
    danca: {
      duracao: 1.1,
      pose(t, rig) {
        const bate = Math.abs(onda(t));
        const alterna = onda(t, 0.25);
        const p = baseLado({
          corpo: { y: 10 * bate }, torso: { rot: 4 * bate }, cabeca: { rot: 7 * onda(2 * t) },
          coxa_dir: { rot: -4 * bate }, canela_dir: { rot: 8 * bate },
        });
        levar(p, rig, BRACO_DIR, [1430 + 25 * Math.max(0, alterna), 505 - 50 * Math.max(0, alterna)], [0, 0], -40, 1, { dobra: -1 });
        levar(p, rig, BRACO_ESQ, [1420 + 25 * Math.max(0, -alterna), 515 - 50 * Math.max(0, -alterna)], [0, 0], -40, 1, { dobra: -1 });
        return plantarPes(p);
      },
    },

    // Pegar algo à frente, na altura da cintura: o braço vai para a frente, a mão fecha, volta.
    pegar: {
      duracao: 2.2,
      pose(t) {
        const vai = chaves(t, [[0, 0], [0.3, 1], [0.55, 1], [0.85, 0], [1, 0]]);
        const fecha = chaves(t, [[0, 0], [0.32, 0], [0.42, 1], [1, 1]]) * (t < 0.95 ? 1 : 0);
        return plantarPes(baseLado({
          corpo: { y: 6 * vai }, torso: { rot: 7 * vai }, cabeca: { rot: 4 * vai },
          braco_dir: { rot: -62 * vai }, antebraco_dir: { rot: -22 * vai }, mao_dir: { rot: -8 * vai, sy: 1 - 0.06 * fecha },
          braco_esq: { rot: 8 * vai },
        }));
      },
    },

    // Guarda de boxe de perfil: perna de perto à frente, joelhos dobrados, punhos no queixo, gingando; um jab.
    luta: {
      duracao: 1.6,
      pose(t) {
        const ginga = onda(2 * t);
        const jab = chaves(t, [[0, 0], [0.5, 0], [0.56, 1], [0.66, 1], [0.76, 0], [1, 0]]);
        return plantarPes({
          corpo: { y: 16 + 3 * ginga }, torso: { rot: 6 + 4 * jab }, cabeca: { rot: 3 },
          coxa_dir: { rot: -16 }, canela_dir: { rot: 10 }, coxa_esq: { rot: 18 }, canela_esq: { rot: 8 },
          braco_dir: { rot: -38 - 52 * jab }, antebraco_dir: { rot: -118 + 108 * jab },
          braco_esq: { rot: -62 }, antebraco_esq: { rot: -112 + 4 * ginga },
        });
      },
    },

    // Beber de perfil: garrafa à boca com o fundo para cima, cabeça para trás, dois goles, abaixa.
    beber: {
      duracao: 3.4,
      pose(t, rig) {
        const q = leva(t, 0.22, 0.72);
        const gole = t > 0.3 && t < 0.68 ? 0.5 + 0.5 * onda((t - 0.3) / 0.19) : 0;
        const p = baseLado({ garrafa: { a: 1 }, torso: { rot: -3 * q }, cabeca: { rot: -12 * q - 3 * gole } });
        levar(p, rig, BRACO_DIR, boca(rig, p, "lado"), PONTOS.lado.garrafa, 100 + 15 * q + 10 * gole, q, { dobra: -1 });
        return plantarPes(p);
      },
    },

    // Fumar de perfil: cigarro à boca, traga, abaixa, solta a fumaça para a frente.
    fumar: {
      duracao: 4.2,
      pose(t, rig) {
        const q = leva(t, 0.16, 0.42);
        const traga = t > 0.2 && t < 0.42 ? Math.sin(Math.PI * (t - 0.2) / 0.22) : 0;
        const p = baseLado(Object.assign({
          cigarro: { a: 1 },
          torso: { rot: -1 * q, sy: 1 + 0.01 * traga }, cabeca: { rot: -3 * q + 4 * traga },
        }, fumaca(t, 0.5, 1, 1)));
        levar(p, rig, BRACO_DIR, boca(rig, p, "lado"), PONTOS.lado.cigarro, -15, q, { dobra: -1 });
        return plantarPes(p);
      },
    },
  };

  const ANIM = { frente: FRENTE, lado: LADO };
  if (global.NSF) global.NSF.ANIM_V2 = ANIM;
  if (typeof module !== "undefined") module.exports = ANIM;
})(typeof window !== "undefined" ? window : globalThis);
