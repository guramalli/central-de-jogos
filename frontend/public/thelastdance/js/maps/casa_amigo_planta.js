// Planta da CASA DO AMIGO: varanda gourmet de apartamento (baseada nas fotos de uma varanda real): ilha de mármore
// com banquetas, bancada da pia, torre da churrasqueira, nicho com cervejeira e geladeira, mesa redonda de madeira
// com cadeiras de corda azul, vasos grandes, parede de azulejo com arandelas, guarda-corpo de vidro com a cidade e
// as portas de vidro para a sala (saída). A caixa de som liga e desliga a música.
// Base em blocos com os nomes das artes do kit do ChatGPT (kit_chatgpt/casa_amigo).
// Unidade: metro. Paredes do fundo: x = 0 (esquerda da tela, o vidro com a cidade) e y = 0 (direita, a cozinha).
(function (global) {
  "use strict";

  const LARG = 12, PROF = 9;
  const PE_DIREITO = 2.7, CORTE_FRENTE = 0.35, ESP = 0.15;
  const cadeira = (x0, y0, arte) => ({ nome: "Cadeira de corda", tipo: "cadeira", x0, y0, x1: x0 + 0.6, y1: y0 + 0.6, z1: 0.85, arte });
  const banqueta = (x0) => ({ nome: "Banqueta", tipo: "cadeira", x0, y0: 3.05, x1: x0 + 0.45, y1: 3.5, z1: 1.0, arte: "banqueta_corda" });
  const vaso = (x0, y0) => ({ nome: "Vaso com planta", tipo: "planta", x0, y0, x1: x0 + 0.6, y1: y0 + 0.6, z1: 1.8, arte: "vaso_planta_grande" });

  const PLANTA = {
    id: "casa_amigo",
    nome: "Casa do amigo",
    musica: "sertanejo",
    largura: LARG, profundidade: PROF,
    peDireito: PE_DIREITO,
    texturaParede: "parede_varanda",
    inicio: { x: 8.8, y: 1.0, dir: "baixo" },
    inicios: { entrada: { x: 8.8, y: 1.0 } },
    inicioPadrao: "entrada",
    roteiroDemo: ["churrasqueira", "geladeiras", "mesa", "caixa de som", "vidro", "porta"],

    comodos: [
      { nome: "Varanda gourmet", x0: 0, y0: 0, x1: LARG, y1: PROF, piso: "#b9b5ad", piso2: "#c2beb6", piso_arte: "piso_porcelanato" },
    ],

    caixas: [
      // paredes
      { nome: "", tipo: "parede", x0: -ESP, y0: -ESP, x1: 0, y1: PROF, z1: PE_DIREITO, fundo: true },
      { nome: "", tipo: "parede", x0: 0, y0: -ESP, x1: LARG, y1: 0, z1: PE_DIREITO, fundo: true },
      { nome: "", tipo: "parede", x0: LARG, y0: -ESP, x1: LARG + ESP, y1: PROF + ESP, z1: CORTE_FRENTE },
      { nome: "", tipo: "parede", x0: -ESP, y0: PROF, x1: LARG, y1: PROF + ESP, z1: CORTE_FRENTE },

      // cozinha na parede do fundo
      { nome: "Bancada da pia", tipo: "mesa", x0: 0.3, y0: 0, x1: 2.9, y1: 0.65, z1: 0.95, arte: "bancada_cozinha",
        enfeites: [{ tipo: "churrasco", dx: 1.2, dy: 0.35 }, { tipo: "cerveja", dx: 2.2, dy: 0.3 }, { tipo: "latinha", dx: 0.4, dy: 0.32 }] },
      // a churrasqueira é dele: tocar -> ele assume a grelha (chiado e mais fumaça)
      { nome: "Churrasqueira", tipo: "movel", x0: 3.0, y0: 0, x1: 4.5, y1: 0.8, z1: 2.4, arte: "churrasqueira_marmore",
        interacao: "churrasqueira", falarDe: { x: 3.75, y: 1.3 } },
      { nome: "Cervejeira e geladeira", tipo: "armario", x0: 4.6, y0: 0, x1: 6.4, y1: 0.75, z1: 2.3, arte: "nicho_geladeiras" },
      vaso(11.1, 0.2),

      // ilha de mármore com as banquetas
      { nome: "Ilha", tipo: "movel", x0: 1.0, y0: 2.0, x1: 4.0, y1: 2.9, z1: 1.12, arte: "ilha_marmore",
        enfeites: [{ tipo: "churrasco", dx: 1.5, dy: 0.45 }, { tipo: "cerveja", dx: 0.5, dy: 0.3 }, { tipo: "cerveja", dx: 2.6, dy: 0.55 },
          { tipo: "copo", dx: 0.9, dy: 0.65 }, { tipo: "copo", dx: 2.2, dy: 0.3 }] },
      banqueta(1.35), banqueta(2.3), banqueta(3.25),

      // mesa redonda com 6 cadeiras (cada lado com a cadeira virada para a mesa)
      { nome: "Mesa redonda", tipo: "mesa", x0: 6.5, y0: 4.2, x1: 8.1, y1: 5.8, z1: 0.76, redonda: true, arte: "mesa_redonda_madeira",
        enfeites: [{ tipo: "cerveja", dx: 0.5, dy: 0.6 }, { tipo: "cerveja", dx: 1.1, dy: 0.9 }, { tipo: "copo", dx: 0.7, dy: 1.1 },
          { tipo: "copo", dx: 1.0, dy: 0.5 }, { tipo: "latinha", dx: 1.2, dy: 1.2, cor: "#d8a700" }, { tipo: "churrasco", dx: 0.8, dy: 0.8 }] },
      cadeira(6.6, 3.5, "cadeira_corda"), cadeira(7.4, 3.5, "cadeira_corda"),
      cadeira(6.6, 5.9, "cadeira_corda_sul"), cadeira(7.4, 5.9, "cadeira_corda_sul"),
      cadeira(5.8, 4.7, "cadeira_corda_lado"), cadeira(8.2, 4.7, "cadeira_corda_costas"),

      // caixa de som (toque: liga/desliga a música)
      { nome: "Caixa de som", tipo: "baixo", x0: 9.6, y0: 2.2, x1: 10.02, y1: 2.56, z1: 0.8, arte: "caixa_som",
        interacao: "caixa_som", falarDe: { x: 9.8, y: 3.05 } },

      // vasos na frente da parede de azulejo
      vaso(0.15, 6.0), vaso(0.15, 7.0), vaso(0.15, 8.1),
    ],

    naParede: [
      // parede do fundo (y = 0): portas de vidro para a sala (saída) e a TV
      { nome: "Portas de vidro", tipo: "vidro", plano: "y0", a: 7.0, b: 10.6, z0: 0, z1: 2.4, saida: true, arte: "porta_vidro_sala" },
      { nome: "TV", tipo: "tv", plano: "y0", a: 8.0, b: 9.6, z0: 1.5, z1: 2.4, arte: "tv_parede" },
      // parede da esquerda (x = 0): guarda-corpo de vidro com a cidade e a parede de azulejo com arandelas
      { nome: "Guarda-corpo de vidro", tipo: "vidro", plano: "x0", a: 0.4, b: 5.6, z0: 0, z1: 2.4, arte: "vidro_cidade" },
      { nome: "Parede de azulejo", tipo: "cimento", plano: "x0", a: 5.8, b: 8.9, z0: 0, z1: 2.4, arte: "parede_azulejo_luzes" },
    ],

    // A turma do churrasco. "personagem" = a arte modular (fica só na máquina por enquanto: rosto de pessoa real);
    // sem ela (no site), aparece o boneco provisório com as cores de "visual".
    npcs: [
      { id: "vibola", nome: "Vibola", personagem: "vibola", postura: "em_pe", x: 5.2, y: 2.9, dir: "baixo",
        falarDe: { x: 5.2, y: 3.6 }, fala: ["\"Ô churrasqueiro, cadê a carne? Tô vendo só fumaça!\"", "\"Mais um ano solteiro... de novo, né?\""],
        visual: { pele: "#b9825a", roupa: "#1a1a1a", calca: "#ececec", cabelo: "#2a1a10", estilo: "curto" } },
      // personagem3d: o Gustavinho em pixel art (3D), com parado e risada (a única interação dele: tocar = ele ri)
      { id: "gustavinho", nome: "Gustavinho", personagem: "gustavinho", personagem3d: true, riAoFalar: true, postura: "em_pe", x: 2.75, y: 3.95, dir: "baixo",
        falarDe: { x: 2.75, y: 4.6 }, fala: ["\"KKKKKKKKKKK para, mano! 😂\"", "\"HAHAHAHA essa do réveillon de novo?! 😭\""],
        visual: { pele: "#c48d63", roupa: "#111111", calca: "#2f5fb0", cabelo: "#2a1a10", estilo: "curto" } },
      { id: "juan", nome: "Juan", personagem: "juan", postura: "sentado", x: 6.9, y: 3.8, dir: "baixo",
        falarDe: { x: 6.9, y: 3.05 }, fala: ["\"Pega uma gelada aí na cervejeira!\"", "\"Vira essa carne, mestre!\""],
        visual: { pele: "#d29a6e", roupa: "#4f6b2a", calca: "#22304a", cabelo: "#5a3a22", estilo: "curto" } },
      // em pé ao lado do nicho das geladeiras, de frente para a câmera
      { id: "vini", nome: "Vini", personagem: "vini", postura: "em_pe", x: 6.85, y: 1.15, dir: "baixo",
        falarDe: { x: 6.85, y: 1.9 }, fala: ["\"Aumenta esse sertanejo aí!\"", "\"Já mostrou o insta pra todo mundo? Mostra pra mim de novo.\""],
        visual: { pele: "#c98f63", roupa: "#2b2b2b", calca: "#e79b8c", cabelo: "#2a1a10", estilo: "volume" } },
      { id: "jamil", nome: "Jamil", personagem: "jamil", postura: "sentado", x: 7.7, y: 3.8, dir: "baixo",
        falarDe: { x: 7.7, y: 3.05 }, fala: ["\"Vim direto da missa. Alguém precisa rezar por esse churrasqueiro.\"",
          "\"Terno no churrasco? Elegância não tira folga.\""],
        visual: { pele: "#d6a27a", roupa: "#d9cfbd", calca: "#d9cfbd", cabelo: "#4a4a4a", estilo: "curto" } },
      { id: "elcio", nome: "Elcio", personagem: "elcio", postura: "sentado", x: 6.1, y: 5.0, dir: "direita",
        falarDe: { x: 5.2, y: 5.0 }, fala: ["\"Óculos escuros de noite? É o brilho do meu futuro, irmão.\"",
          "\"Cadê a piscina? Vim de shorts à toa.\""],
        visual: { pele: "#c48d63", roupa: "#c48d63", calca: "#e0404a", cabelo: "#1c120c", estilo: "curto" } },
      // atrás da ilha, do lado da churrasqueira, de frente para a câmera
      { id: "borrinha", nome: "Borrinha", personagem: "borrinha", postura: "em_pe", x: 2.4, y: 1.3, dir: "baixo",
        falarDe: { x: 1.75, y: 1.3 }, fala: ["\"Hoje tem jogo do Brasil? Não? Vim de amarelo do mesmo jeito.\"",
          "\"Ô churrasqueiro, solta uma linguiça aqui pro torcedor!\""],
        visual: { pele: "#e0b48e", roupa: "#f2d21b", calca: "#1a1a1a", cabelo: "#111", estilo: "bone" } },
      // na banqueta da ponta da ilha, de lado, virado para a turma (assento alto: 0,75 m)
      { id: "pabo", nome: "Pabo", personagem: "pabo", postura: "sentado", assento: 0.75, x: 3.475, y: 3.275, dir: "direita",
        falarDe: { x: 4.2, y: 3.4 }, fala: ["\"Me vê só a proteína dessa picanha, sem a gordura.\"",
          "\"Bora treinar amanhã? Ah, esqueci: você só treina a mandíbula.\""],
        visual: { pele: "#c98f63", roupa: "#2b2b2b", calca: "#b5b5b5", cabelo: "#6b4226", estilo: "curto" } },
    ],

    // As portas de vidro levam para: (de volta ao carro, ou outro lugar)
    destinos: [
      { nome: "Casa", descricao: "Voltar de carro para o prédio", url: "garagem.html?comodo=carro", ativo: true },
      { nome: "Padaria", descricao: "Café, pão na chapa e energia para mais uma noite", url: "padaria.html", ativo: true },
      { nome: "Balada", descricao: "Em breve", ativo: false },
    ],

    pontos: [
      { nome: "porta", x: 8.8, y: 0.6 },
      { nome: "churrasqueira", x: 3.75, y: 1.3 },
      { nome: "geladeiras", x: 5.5, y: 1.3 },
      { nome: "mesa", x: 9.2, y: 6.9 },
      { nome: "caixa de som", x: 9.8, y: 3.05 },
      { nome: "vidro", x: 0.7, y: 4.2 },
    ],
  };

  // ---------------- clima do churrasco ----------------
  // Fumaça saindo da churrasqueira e tomando o lugar; mais forte quando ele mexe na grelha.
  const fumaca = [];
  let relogio = 0, acumulado = 0, forte = 0;
  function desenharFumaca(ctx, T, agora) {
    const dt = relogio ? Math.min(0.1, (agora - relogio) / 1000) : 0;
    relogio = agora;
    const intenso = agora < forte;
    acumulado += dt * (intenso ? 16 : 5);
    while (acumulado >= 1 && fumaca.length < 80) {
      acumulado -= 1;
      const daGrelha = Math.random() < 0.45;
      fumaca.push({ x: 3.75 + (Math.random() - 0.5) * 0.6, y: daGrelha ? 0.85 : 0.4, z: daGrelha ? 1.1 : 2.4,
        vx: 0.15 + Math.random() * 0.25, vy: 0.25 + Math.random() * 0.35, vz: 0.15 + Math.random() * 0.15,
        t0: agora, dur: 6500 + Math.random() * 3000 });
    }
    // névoa no lugar todo
    ctx.save();
    ctx.fillStyle = intenso ? "rgba(205,205,212,0.16)" : "rgba(205,205,212,0.08)";
    ctx.fillRect(-6000, -6000, 12000, 12000);
    for (let i = fumaca.length - 1; i >= 0; i--) {
      const f = fumaca[i], u = (agora - f.t0) / f.dur;
      if (u >= 1) { fumaca.splice(i, 1); continue; }
      f.x += f.vx * dt; f.y += f.vy * dt; f.z += f.vz * dt;
      const [px, py] = T(f.x, f.y, f.z), r = 14 + u * 75, a = 0.3 * (1 - u) * Math.min(1, u * 6);
      const g = ctx.createRadialGradient(px, py, 0, px, py, r);
      g.addColorStop(0, `rgba(215,215,222,${a})`); g.addColorStop(1, "rgba(215,215,222,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, r, 0, 7); ctx.fill();
    }
    ctx.restore();
  }

  // Zoeira automática: as rodadas de js/dialogos/churrasco_zoeira.js, uma fala por vez, em balões.
  function zoeira() {
    const Z = global.NSF.DIALOGOS && global.NSF.DIALOGOS.churrasco_zoeira;
    const api = PLANTA.api;
    if (!Z || !api) return;
    let r = 0, f = 0;
    const ocupado = () => (global.NSF.Ligacao && global.NSF.Ligacao.aberta()) || api.porta.menu || api.porta.saindo;
    const seguir = (espera) => {
      const rodada = Z.rodadas[r];
      f++;
      if (f >= rodada.length) { f = 0; r = (r + 1) % Z.rodadas.length; espera += Z.pausaEntreRodadas * 1000; }
      setTimeout(proxima, espera);
    };
    const proxima = () => {
      if (ocupado()) { setTimeout(proxima, 1500); return; }
      const rodada = Z.rodadas[r], fala = rodada[f], ms = Z.segundosPorFala * 1000;
      if (fala.audio) { // voz gravada: só toca com o som liberado e o pacote dos amigos aberto; senão, pula a fala
        const A = global.NSF.Audio, url = global.NSF.VIP ? global.NSF.VIP.url(fala.audio) : fala.audio;
        if (!A || !A.voz) { seguir(0); return; }
        A.voz(url).then((dur) => { // falando ao vivo: só as ondinhas de voz em quem fala
          const ate = performance.now() + dur * 1000;
          if (fala.quem === "eu") api.jog.falandoAte = ate;
          else { const n = api.npcs.find((x) => x.id === fala.quem); if (n) { n.balao = null; n.falandoAte = ate; } }
          seguir(dur * 1000 + 700);
        }).catch(() => seguir(0));
        return;
      }
      if (fala.quem === "todos") { // a turma inteira reage junto (ex.: todo mundo rindo)
        const RISOS = ["KKKKKKKKKKKK 😂", "HAHAHAHAHA", "kkkkkk socorro 😭", "AHUSHAUSHAUSH", "KKKKKK para!!"];
        api.npcs.filter((n) => !n.oculta).forEach((n, i) => {
          n.balao = { texto: fala.texto === "KKKKKKKKKKKK" ? RISOS[i % RISOS.length] : fala.texto, ate: performance.now() + ms - 200 };
          n.rindoAte = performance.now() + ms - 200; // quem tem animação de risada (o Gustavinho 3D) ri junto
        });
        seguir(ms);
        return;
      }
      if (fala.quem === "eu") {
        api.falar(fala.texto, ms - 200);
        const mod = api.heroi && api.heroi.roupas && api.heroi.roupas.celular_mao;
        if (fala.celular && !api.jog.sentado && (mod || (api.poseConjunto && api.poseConjunto("celular")))) {
          if (mod) api.heroi.vestir("celular_mao");
          api.jog.pose = "celular";
          setTimeout(() => { if (mod) api.heroi.tirar("celular_mao"); if (api.jog.pose === "celular") api.jog.pose = null; }, ms);
        }
      } else {
        const n = api.npcs.find((x) => x.id === fala.quem);
        if (n) n.balao = { texto: fala.texto, ate: performance.now() + ms - 200 };
      }
      seguir(ms);
    };
    proxima();
  }

  PLANTA.aoIniciar = (api, info) => {
    PLANTA.api = api;
    if (api.heroi && global.NSF.Poses) global.NSF.Poses.preparar(api.heroi);
    setTimeout(zoeira, info && info.chegando ? 4500 : 2500);
  };
  PLANTA.aoInteragir = (tipo) => {
    const api = PLANTA.api;
    if (tipo !== "churrasqueira" || !api) return;
    api.jog.dir = "cima";
    forte = performance.now() + 7000;
    if (global.NSF.Audio) global.NSF.Audio.chiado();
    api.falar("Sai da frente, que o mestre do churrasco chegou!", 3000);
  };
  PLANTA.aoDesenhar = desenharFumaca;

  if (global.NSF) { global.NSF.PLANTA_CASA_AMIGO = PLANTA; global.NSF.PLANTA_ATUAL = PLANTA; }
  if (typeof module !== "undefined") module.exports = PLANTA;
})(typeof window !== "undefined" ? window : globalThis);
