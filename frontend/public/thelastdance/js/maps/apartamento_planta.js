// Planta do APARTAMENTO do protagonista (FASE 4, esquema em blocos — ainda sem arte).
// Unidade: metro. Eixo x vai para baixo-direita na tela, y para baixo-esquerda; z para cima.
// As paredes do fundo ficam em x = 0 (esquerda da tela) e y = 0 (direita); as da frente são cortadas baixas.
// Fontes: sala = vídeo do cômodo (descrição em docs/inventario_assets.md, seção 7); quarto = painel
// "Apartamento" do moodboard. Medidas são PROPORÇÕES de jogo, não medidas reais (o vídeo não permite medir).
(function (global) {
  "use strict";

  const PE_DIREITO = 2.7;     // altura das paredes do fundo
  const CORTE_FRENTE = 0.35;  // paredes da frente, cortadas baixas para ver o interior
  const CORTE_MEIO = 1.0;     // parede entre sala e quarto, cortada (vira transparente na FASE 5)
  const ESP = 0.15;           // espessura das paredes

  const PLANTA = {
    nome: "Apartamento",
    largura: 10, profundidade: 7,      // x: 0..10, y: 0..7
    peDireito: PE_DIREITO,
    id: "apartamento",
    inicio: { x: 4.5, y: 1.0, dir: "baixo" }, // logo depois de entrar pela porta
    inicios: { sala: { x: 4.5, y: 1.0 }, entrada: { x: 4.5, y: 0.9 }, quarto: { x: 8.0, y: 2.6 } },
    inicioPadrao: "quarto",
    ligacao: "gatinha_campinas",   // roteiro de js/dialogos/ que toca neste mapa
    roteiroDemo: ["frente do sofá", "varanda (porta de vidro)", "mesa redonda", "lado da cama",
      "mesa do computador", "armário", "aparador", "porta de entrada"],
    // Sair de casa é sempre pelo elevador até a garagem; o menu de destinos fica no carro (garagem_planta.js).

    comodos: [
      { nome: "Sala", x0: 0, y0: 0, x1: 6, y1: 7, piso: "#3b3640", piso2: "#433d49", piso_arte: "piso_sala" },
      { nome: "Quarto", x0: 6, y0: 0, x1: 10, y1: 7, piso: "#4a3a33", piso2: "#523f37", piso_arte: "piso_madeira" },
    ],

    // Caixas sólidas (colisão + desenho). tipo define a cor do bloco.
    caixas: [
      // paredes do fundo (altas) e da frente (cortadas)
      { nome: "", tipo: "parede", x0: -ESP, y0: -ESP, x1: 0, y1: 7, z1: PE_DIREITO, fundo: true },
      { nome: "", tipo: "parede", x0: 0, y0: -ESP, x1: 4.0, y1: 0, z1: PE_DIREITO, fundo: true },
      { nome: "", tipo: "parede", x0: 5.0, y0: -ESP, x1: 10, y1: 0, z1: PE_DIREITO, fundo: true },
      { nome: "", tipo: "parede", x0: 10, y0: -ESP, x1: 10 + ESP, y1: 7 + ESP, z1: CORTE_FRENTE },
      { nome: "", tipo: "parede", x0: -ESP, y0: 7, x1: 10, y1: 7 + ESP, z1: CORTE_FRENTE },
      // parede entre sala e quarto, com vão de porta em y 2.6..3.6
      { nome: "", tipo: "parede", x0: 6, y0: 0, x1: 6 + ESP, y1: 2.6, z1: CORTE_MEIO },
      { nome: "", tipo: "parede", x0: 6, y0: 3.6, x1: 6 + ESP, y1: 7, z1: CORTE_MEIO },

      // SALA (do vídeo)
      // TV (toque no rack ou na TV) e sofá: ele senta e assiste uma série
      { nome: "Rack + TV", tipo: "movel", x0: 0, y0: 1.2, x1: 0.45, y1: 3.4, z1: 0.5, arte: "rack",
        interacao: "tv", toqueZ: 1.95, falarDe: { x: 1.7, y: 2.3 } },
      { nome: "Sofá cinza", tipo: "sofa", x0: 2.4, y0: 1.0, x1: 3.3, y1: 3.6, z1: 0.8, arte: "sofa",
        interacao: "tv", falarDe: { x: 1.7, y: 2.3 } },
      { nome: "Mesa lateral", tipo: "movel", x0: 2.45, y0: 0.45, x1: 2.95, y1: 0.95, z1: 0.5, arte: "mesa_lateral" },
      { nome: "Mesa redonda", tipo: "mesa", x0: 3.6, y0: 4.6, x1: 4.7, y1: 5.7, z1: 0.75, redonda: true, arte: "mesa_redonda",
        interacao: "vinho", falarDe: { x: 4.15, y: 4.15 },
        enfeites: [{ tipo: "vinho", dx: 0.55, dy: 0.45 }, { tipo: "taca", dx: 0.35, dy: 0.7 }, { tipo: "taca", dx: 0.8, dy: 0.65 }] },
      { nome: "Cadeira", tipo: "cadeira", x0: 3.0, y0: 4.85, x1: 3.5, y1: 5.45, z1: 0.9, arte: "poltrona" },
      { nome: "Cadeira", tipo: "cadeira", x0: 4.85, y0: 4.85, x1: 5.35, y1: 5.45, z1: 0.9, arte: "poltrona" },
      { nome: "Cadeira", tipo: "cadeira", x0: 3.85, y0: 5.85, x1: 4.45, y1: 6.35, z1: 0.9, arte: "poltrona" },
      { nome: "Aparador", tipo: "movel", x0: 0.5, y0: 0, x1: 2.0, y1: 0.45, z1: 0.85, arte: "aparador" },
      { nome: "Luminária", tipo: "luz", x0: 0.3, y0: 3.75, x1: 0.6, y1: 4.05, z1: 1.6, arte: "luminaria" },
      { nome: "Planta", tipo: "planta", x0: 5.3, y0: 0.2, x1: 5.8, y1: 0.7, z1: 1.5, arte: "planta" },

      // QUARTO (do moodboard)
      // armário no fundo: alto na frente da câmera taparia a sala
      { nome: "Armário", tipo: "armario", x0: 6.15, y0: 0, x1: 7.05, y1: 0.6, z1: 2.1, arte: "armario",
        interacao: "armario", falarDe: { x: 6.6, y: 1.05 } },   // tocar: escolhe a roupa do dia
      { nome: "Cama", tipo: "cama", x0: 7.35, y0: 0, x1: 9.25, y1: 2.1, z1: 0.55, arte: "cama",
        interacao: "cama", falarDe: { x: 8.3, y: 2.55 } },
      { nome: "Criado-mudo", tipo: "movel", x0: 9.35, y0: 0, x1: 9.85, y1: 0.45, z1: 0.55, arte: "criado_mudo" },
      { nome: "Mesa + computador", tipo: "mesa", x0: 9.3, y0: 3.6, x1: 10, y1: 5.2, z1: 0.75, arte: "mesa_computador",
        interacao: "computador", toqueZ: 1.3, falarDe: { x: 8.2, y: 4.4 } },
      { nome: "Cadeira", tipo: "cadeira", x0: 8.6, y0: 4.15, x1: 9.1, y1: 4.65, z1: 0.9, arte: "cadeira",
        interacao: "computador", falarDe: { x: 8.2, y: 4.4 } },
      { nome: "Roupas no chão", tipo: "baixo", x0: 7.6, y0: 3.0, x1: 8.4, y1: 3.6, z1: 0.08, passavel: true, arte: "roupas_chao" },
      { nome: "Planta", tipo: "planta", x0: 9.4, y0: 6.3, x1: 9.85, y1: 6.75, z1: 1.2, arte: "planta" },
    ],

    // Coisas na parede (sem colisão): plano "x0" = parede da esquerda (x = 0), "y0" = da direita (y = 0).
    // a..b = trecho ao longo da parede; z0..z1 = altura.
    naParede: [
      { nome: "Ripado de madeira", tipo: "ripado", plano: "x0", a: 1.0, b: 3.6, z0: 0, z1: 2.7, arte: "ripado" },
      { nome: "TV", tipo: "tv", plano: "x0", a: 1.5, b: 3.1, z0: 1.0, z1: 1.92, arte: "tv" },
      { nome: "Porta de vidro (varanda)", tipo: "vidro", plano: "x0", a: 4.4, b: 6.6, z0: 0, z1: 2.3, arte: "porta_vidro" },
      { nome: "Parede cimentícia", tipo: "cimento", plano: "y0", a: 0, b: 2.8, z0: 0, z1: 2.7, arte: "cimento" },
      { nome: "Fita de LED", tipo: "led", plano: "y0", a: 2.35, b: 2.45, z0: 0.2, z1: 2.5 },
      { nome: "Parede vermelha", tipo: "vermelha", plano: "y0", a: 2.8, b: 6.0, z0: 0, z1: 2.7, arte: "parede_vermelha" },
      { nome: "Porta de entrada", tipo: "porta", plano: "y0", a: 4.0, b: 5.0, z0: 0, z1: 2.15, saida: true, vai: { nome: "Elevador", url: "elevador.html?descer=1" }, arte: "porta_entrada" },
      { nome: "Quadro pop-art", tipo: "quadro", plano: "y0", a: 3.05, b: 3.65, z0: 1.15, z1: 2.03, arte: "quadro_popart" },
      { nome: "Neon \"Mais uma noite?\"", tipo: "neon", plano: "y0", a: 7.5, b: 9.1, z0: 1.4, z1: 2.2, arte: "neon" },
      { nome: "Janela", tipo: "vidro", plano: "y0", a: 9.3, b: 9.95, z0: 0.95, z1: 2.25, arte: "janela" },
    ],

    // Pontos de interesse (FASE 6 vai usar para interação); aqui servem para testar se tudo é alcançável.
    pontos: [
      { nome: "porta de entrada", x: 4.5, y: 0.5 },
      { nome: "frente do sofá", x: 1.6, y: 2.3 },
      { nome: "mesa redonda", x: 4.2, y: 4.2 },
      { nome: "varanda (porta de vidro)", x: 0.5, y: 5.5 },
      { nome: "aparador", x: 1.2, y: 0.8 },
      { nome: "lado da cama", x: 8.0, y: 2.6 },
      { nome: "mesa do computador", x: 8.9, y: 5.0 },
      { nome: "armário", x: 6.6, y: 1.1 },
    ],
  };

  // ---------------- interações da casa dele ----------------
  // Dias da semana do jogo (quinta a domingo); dormir passa para o próximo.
  const DIAS = ["Quinta-feira", "Sexta-feira", "Sábado", "Domingo"];
  const lerDia = () => { try { return +(localStorage.getItem("nsf_dia") || 0) % 4; } catch (_) { return 0; } };
  const gravarDia = (d) => { try { localStorage.setItem("nsf_dia", String(d)); } catch (_) { /* sem armazenamento */ } };
  let assistindo = null; // instante em que ligou a TV
  PLANTA.aoIniciar = (api) => { PLANTA.api = api; };
  PLANTA.aoLevantar = () => { assistindo = null; };
  PLANTA.aoInteragir = (tipo) => {
    const api = PLANTA.api;
    if (!api) return;
    if (tipo === "vinho") {
      api.pensar("Bem que eu podia chamar uma gatinha pra tomar um vinho comigo hoje...", 4200);
    } else if (tipo === "tv") {
      api.sentar({ x: 2.62, y: 2.3, dir: "esquerda" });
      assistindo = performance.now();
      setTimeout(() => { if (assistindo) api.pensar("Só mais um episódio...", 3000); }, 1500);
    } else if (tipo === "computador") {
      api.sentar({ x: 8.85, y: 4.4, dir: "direita" });
      setTimeout(() => api.pensar("Como é que liga isso aqui?!?!", 3500), 400);
    } else if (tipo === "cama") {
      const proximo = (lerDia() + 1) % 4;
      const c = api.cortinaCom("Zzz...", "Boa noite");
      document.body.appendChild(c);
      requestAnimationFrame(() => requestAnimationFrame(() => c.classList.add("fechada")));
      if (global.NSF.Audio) global.NSF.Audio.musica(false);
      setTimeout(() => { api.jog.oculto = true; }, 600);
      setTimeout(() => { // amanhece
        c.querySelector("small").textContent = "Bom dia!";
        c.querySelector("b").textContent = DIAS[proximo];
        gravarDia(proximo);
      }, 2200);
      setTimeout(() => {
        api.jog.oculto = false; api.jog.dir = "baixo";
        c.classList.remove("fechada");
        if (global.NSF.Audio) global.NSF.Audio.musica(true);
        setTimeout(() => { c.remove(); api.pensar("Que dor de cabeça... que horas são?", 3200); }, 650);
      }, 4200);
    }
  };
  // TV ligada: a tela pisca em cores, como uma série passando
  PLANTA.aoDesenhar = (ctx, T, agora) => {
    if (!assistindo) return;
    const tv = PLANTA.naParede.find((w) => w.tipo === "tv");
    if (!tv) return;
    const m = 0.06, q = [T(0, tv.a + m, tv.z0 + m), T(0, tv.b - m, tv.z0 + m), T(0, tv.b - m, tv.z1 - m), T(0, tv.a + m, tv.z1 - m)];
    const fase = Math.floor((agora - assistindo) / 900);
    const cores = ["#3a6fd8", "#d8873a", "#2fa36b", "#b33a7a", "#d8c33a", "#5a3ad8"];
    ctx.save();
    ctx.globalAlpha = 0.75 + 0.2 * Math.sin(agora / 70);
    ctx.fillStyle = cores[fase % cores.length];
    ctx.beginPath(); q.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 0.5; ctx.fillStyle = "#fff"; // "personagem" da série
    const [cx, cy] = T(0, (tv.a + tv.b) / 2 + Math.sin(fase) * 0.3, (tv.z0 + tv.z1) / 2);
    ctx.beginPath(); ctx.arc(cx, cy - 6, 5, 0, 7); ctx.fill(); ctx.fillRect(cx - 4, cy, 8, 12);
    ctx.restore();
  };

  if (global.NSF) global.NSF.PLANTA_APARTAMENTO = PLANTA;
  if (typeof module !== "undefined") module.exports = PLANTA;
})(typeof window !== "undefined" ? window : globalThis);
