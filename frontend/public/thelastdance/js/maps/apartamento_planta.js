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
      { nome: "Sofá cinza", tipo: "sofa", x0: 2.4, y0: 1.0, x1: 3.3, y1: 3.6, z1: 0.8, arte: "sofa" }, // a TV se liga pelo rack
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
  const somTv = (sim) => { const A = global.NSF && global.NSF.Audio; if (A) { A.tv(sim); A.abafar(sim); } };
  PLANTA.aoLevantar = () => { if (assistindo) somTv(false); assistindo = null; };
  PLANTA.aoInteragir = (tipo) => {
    const api = PLANTA.api;
    if (!api) return;
    if (tipo === "vinho") {
      api.pensar("Bem que eu podia chamar uma gatinha pra tomar um vinho comigo hoje...", 4200);
    } else if (tipo === "tv") {
      api.sentar({ x: 2.62, y: 2.3, dir: "esquerda" });
      assistindo = performance.now();
      somTv(true);
      setTimeout(() => { if (assistindo) api.pensar("Só mais um episódio...", 3000); }, 1500);
    } else if (tipo === "computador") {
      api.sentar({ x: 8.85, y: 4.4, dir: "direita" });
      setTimeout(() => api.pensar("Como é que liga isso aqui?!?!", 3500), 400);
    } else if (tipo === "cama") {
      perguntarDormir(api);
    }
  };

  // Logo depois da ligação da Gatinha de Campinas, o Carioca manda mensagem no ZapZap chamando para surfar (mensagem,
  // não ligação: ninguém atende o Carioca). A escolha aparece direto na tela. Aceitando, ele faz tudo sozinho até a
  // praia; recusando, o dia segue normal.
  const CONVITE_SURF = {
    convidou: "Aê, mermão! O mar tá clássico, pô! 🌊 Bora pegar umas ondas antes da tua mina de Campinas chegar?",
    dispensou: "Aê, mermão! Levou toco, né? Tô sabendo 😂 Bora pro mar que onda cura tudo, pô! 🌊",
    recusou: "Aê, mermão! Tu não atendeu a mina de Campinas, né? 👀 Então bora pro mar, que tá clássico! 🌊",
  };
  let conviteFeito = false; // uma vez por visita (a Gatinha pode ligar de novo depois de recusada)
  PLANTA.aoTerminarLigacao = (resultado, api) => {
    if (ENC_ID || conviteFeito) return; // noite de encontro: nada de surf
    conviteFeito = true;
    const C = global.NSF.Celular, A = global.NSF.Audio;
    const conversar = async () => {
      const texto = CONVITE_SURF[resultado] || CONVITE_SURF.dispensou;
      if (A) A.curtida(); // "plim" de mensagem
      const r = await escolha("💬 Carioca no ZapZap: " + texto, [["🏄", "Bora surfar!", "sim"], ["🛋️", "Hoje não", "nao"]]);
      // a conversa fica no ZapZap do celular
      if (C && C.novaConversa) C.novaConversa({
        id: "carioca_surf_" + Date.now(), nome: "Carioca 🏄", app: "zap", cor: "#00695c", chega: 0,
        mensagens: [{ de: "ele", t: texto },
          { de: "eu", t: r === "sim" ? "BORA! Tô indo, mermão 🏄" : "Hoje não, Carioca..." },
          { de: "ele", t: r === "sim" ? "É isso, brabo! Tô na areia com a rapaziada 🤙" : "Hoje não?? Tu tá namorando? Ih, olha ele..." }],
      });
      if (r === "sim") {
        // nsf_surf: prancha no teto do carro + Praia no menu do carro (para as próximas vezes)
        try { sessionStorage.setItem("nsf_surf", "1"); } catch (_) { /* sem armazenamento */ }
        // sozinho: vai ao guarda-roupa, veste o neoprene e já aparece na praia (sem elevador nem garagem: é rápido)
        api.pensar("Bora! Cadê meu neoprene... 🏄", 2400);
        const arm = PLANTA.caixas.find((x) => x.interacao === "armario");
        const vestirESair = async () => {
          api.jog.dir = "cima";
          await espera(900); // mexendo no armário
          api.vestirRoupas(["neoprene_cima", "neoprene_calca"]);
          if (A) A.curtida();
          api.pensar("Neoprene no corpo! Partiu praia! 🏄", 2000);
          await espera(1300);
          api.sair({ nome: "Praia", url: "surf.html?direto" }, { andando: false });
        };
        if (arm && arm.falarDe) api.irPara(arm.falarDe.x, arm.falarDe.y, vestirESair); else vestirESair();
      } else {
        try { sessionStorage.removeItem("nsf_surf"); } catch (_) { /* ok */ }
        api.pensar(resultado === "convidou" ? "\"Hoje não?? Tu tá namorando?\" — esse Carioca... Tenho que arrumar a casa pra gatinha."
          : "\"Hoje não?? Tu tá namorando?\" — esse Carioca... Hoje é sofá.", 4600);
      }
    };
    const mandar = () => {
      // ligação tocando, conversa, escolha, guarda-roupa ou celular abertos: espera e manda logo depois
      if (document.querySelector(".cel-central, .lig-fundo, .escolha, .armario-fundo") || (C && C.aberto && C.aberto())) {
        setTimeout(mandar, 2000); return;
      }
      conversar();
    };
    setTimeout(mandar, 1800);
  };

  // Guarda-roupa com o personagem 3D (tester): cada look é um conjunto de quadros
  const LOOKS = { "3d": ["👕", "Camiseta branca"], "3d_azul": ["👔", "Camiseta azul"] };
  PLANTA.aoArmarioConjunto = async (api, conjuntos) => {
    if (document.querySelector(".escolha")) return;
    const opcoes = conjuntos.filter((n) => LOOKS[n]).map((n) => [...LOOKS[n], n]);
    opcoes.push(["🧍", "Personagem antigo", "modular"]);
    const r = await escolha("O que você vai vestir hoje?", opcoes);
    if (r === "modular") { await api.trocarConjunto("modular"); api.abrirArmario(); return; }
    if (r === api.conjunto) return;
    api.jog.dir = "cima";
    await api.trocarConjunto(r);
    api.jog.dir = "baixo";
    api.pensar("Agora sim! 😎", 1800);
  };

  // Antes de dormir, pergunta (evita dormir sem querer ao tocar perto da cama).
  function perguntarDormir(api) {
    if (document.querySelector(".escolha")) return;
    const caixa = document.createElement("div");
    caixa.className = "escolha"; caixa.setAttribute("role", "dialog");
    const titulo = document.createElement("div"); titulo.className = "escolha-titulo";
    titulo.textContent = "Dormir e acordar amanhã (" + DIAS[(lerDia() + 1) % 4] + ")?";
    const grade = document.createElement("div"); grade.className = "escolha-grade";
    const opcao = (icone, texto, acao) => {
      const b = document.createElement("button"); b.type = "button";
      const i = document.createElement("span"); i.className = "escolha-icone"; i.textContent = icone;
      b.append(i, document.createTextNode(texto));
      b.addEventListener("click", (e) => { e.stopPropagation(); caixa.remove(); acao(); });
      grade.appendChild(b);
    };
    opcao("😴", "Dormir", () => dormir(api));
    opcao("🙅", "Agora não", () => api.pensar("Ainda tá cedo... a noite é uma criança.", 2600));
    caixa.append(titulo, grade);
    document.body.appendChild(caixa);
  }

  // Dormir: ele deita na cama debaixo do cobertor e ronca, a tela vai fechando devagar, amanhece no dia seguinte.
  let dormindo = null; // instante em que deitou
  function dormir(api) {
    const A = global.NSF.Audio, proximo = (lerDia() + 1) % 4;
    dormindo = performance.now();
    api.jog.oculto = true; // quem aparece agora é o "deitado" (aoDesenhar)
    if (A) { A.musica(false); A.ronco(true); }
    const c = api.cortinaCom("Zzz...", "Boa noite");
    c.style.transition = "opacity 2.6s ease-in";
    setTimeout(() => {
      document.body.appendChild(c);
      requestAnimationFrame(() => requestAnimationFrame(() => c.classList.add("fechada")));
    }, 1800);
    setTimeout(() => { // amanhece
      c.querySelector("small").textContent = "Bom dia!";
      c.querySelector("b").textContent = DIAS[proximo];
      gravarDia(proximo);
      if (A) A.ronco(false);
    }, 6600);
    setTimeout(() => { c.style.transition = "opacity 1.2s ease-out"; c.classList.remove("fechada"); }, 8400);
    setTimeout(() => { // levanta
      c.remove();
      dormindo = null;
      api.jog.oculto = false; api.jog.dir = "baixo";
      if (A) A.musica(true);
      api.pensar("Que dor de cabeça... que horas são?", 3200);
    }, 10200);
  }

  // Deitado: o personagem de frente, girado ao longo da cama (cabeça no travesseiro) e o cobertor por cima.
  const CAMA = PLANTA.caixas.find((c) => c.interacao === "cama");
  function desenharDeitado(ctx, T, agora) {
    const api = PLANTA.api, heroi = api && api.heroi, xm = (CAMA.x0 + CAMA.x1) / 2, zt = CAMA.z1 + 0.06;
    const [hx, hy] = T(xm, CAMA.y0 + 0.18, zt + 0.08), [fx, fy] = T(xm, CAMA.y1 - 0.2, zt);
    const deitado = api && api.poseConjunto && api.poseConjunto("deitado"); // personagem 3D: já vem deitado
    if (deitado) {
      const [cx, cy] = T(xm, CAMA.y0 + 0.12, zt - 0.06); // alto da cabeça no travesseiro
      api.desenharTira(ctx, deitado, cx, cy, agora);
    } else if (heroi) {
      const comp = Math.hypot(hx - fx, hy - fy);
      heroi.definirVista("frente");
      heroi.tocar("parado");
      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(Math.atan2(hy - fy, hx - fx) + Math.PI / 2);
      heroi.desenhar(ctx, 0, 0, (comp * 1.05) / 1375);
      ctx.restore();
    }
    // cobertor: do peito até os pés, caindo pela frente da cama
    const ya = CAMA.y0 + 0.8, yb = CAMA.y1 + 0.04, xa = CAMA.x0 + 0.05, xb = CAMA.x1 - 0.05;
    const P = (pts) => { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); };
    ctx.save();
    ctx.fillStyle = "#b8326e";
    P([T(xa, ya, zt + 0.08), T(xb, ya, zt + 0.08), T(xb, yb, zt), T(xa, yb, zt)]); ctx.fill();
    ctx.fillStyle = "#8f2253"; // frente caindo
    P([T(xa, yb, zt), T(xb, yb, zt), T(xb, yb + 0.02, 0.22), T(xa, yb + 0.02, 0.22)]); ctx.fill();
    ctx.fillStyle = "#a02a5e"; // lateral caindo
    P([T(xb, ya, zt + 0.08), T(xb, yb, zt), T(xb + 0.02, yb, 0.22), T(xb + 0.02, ya, 0.25)]); ctx.fill();
    ctx.fillStyle = "#f2d9e6"; // dobra do lençol no peito
    P([T(xa, ya, zt + 0.1), T(xb, ya, zt + 0.1), T(xb, ya + 0.14, zt + 0.09), T(xa, ya + 0.14, zt + 0.09)]); ctx.fill();
    // volume do corpo debaixo do cobertor (respirando)
    const resp = 1 + 0.04 * Math.sin(agora / 700);
    const [bx, by] = T(xm, (ya + yb) / 2, zt + 0.12);
    ctx.globalAlpha = 0.35; ctx.fillStyle = "#e0569a";
    ctx.beginPath(); ctx.ellipse(bx, by - 4, 30 * resp, 52, Math.atan2(hy - fy, hx - fx) + Math.PI / 2, 0, 7); ctx.fill();
    ctx.restore();
    // Zzz subindo
    ctx.save();
    ctx.font = "800 28px system-ui, sans-serif"; ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#2b1f40"; ctx.lineWidth = 5;
    for (let k = 0; k < 3; k++) {
      const u = ((agora - dormindo) / 2200 + k / 3) % 1;
      ctx.globalAlpha = Math.sin(u * Math.PI);
      const zx = hx + 14 + u * 34, zy = hy - 30 - u * 60;
      const z = k === 2 ? "Z" : "z"; ctx.strokeText(z, zx, zy); ctx.fillText(z, zx, zy);
    }
    ctx.restore();
  }

  // TV ligada: a tela pisca em cores, como uma série passando
  PLANTA.aoDesenhar = (ctx, T, agora) => {
    if (dormindo && CAMA) desenharDeitado(ctx, T, agora);
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


  // ---------------- encontro: a menina que topou na paquera vem com ele (apartamento.html?encontro=<perfil>) ----------------
  // Ela entra atrás dele -> ele já chama para sentar -> vinho na mesinha (os dois sentam e conversam) -> "Chamar pro quarto" -> ele vai ao banheiro
  // e volta de tarja (imagem trancada no pacote dos amigos) -> tela escura com sons -> manhã seguinte: ela já foi, deixou
  // um bilhete e manda mensagem no ZapZap -> ele vai trocar de roupa. Sem nada explícito.
  const qsEnc = new URLSearchParams(global.location ? global.location.search : "");
  const ENC_ID = qsEnc.get("encontro");
  const E = { fase: null, npc: null, alvo: null, nu: false, ultimo: 0, api: null };
  if (ENC_ID && /^[a-z_]+$/.test(ENC_ID)) {
    PLANTA.npcs = PLANTA.npcs || [];
    PLANTA.npcs.push({ id: "encontro", nome: "Ela", personagem: ENC_ID, postura: "em_pe", x: 4.5, y: 0.45, dir: "baixo",
      oculta: true, interagir: false, visual: { pele: "#e2b08a", roupa: "#c8233d", calca: "#c8233d", cabelo: "#2b1a12", estilo: "longo" } });
  }
  PLANTA.ocupado = () => !!E.fase; // durante o encontro o celular não toca
  const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const perfilEnc = () => global.NSF && global.NSF.PAQUERA && global.NSF.PAQUERA.perfis[ENC_ID];
  const imgCorpo = typeof Image !== "undefined" ? new Image() : {}; // (nos testes, sem navegador, não há Image)

  function vistaDe(n, dir) {
    n.dir = dir;
    const api = E.api;
    if (n.modular && api && api.VISTA_MOD) n.modular.definirVista(api.VISTA_MOD[dir] || "frente");
  }
  // Anda em linha reta até (x, y) (ela não esbarra em nada no caminho escolhido); resolve ao chegar.
  function andar(n, x, y) {
    return new Promise((ok) => { E.alvo = { n, x, y, ok }; if (n.modular) n.modular.tocar("andar"); });
  }
  function moverNpc(agora) {
    const dt = E.ultimo ? Math.min(0.1, (agora - E.ultimo) / 1000) : 0;
    E.ultimo = agora;
    const a = E.alvo;
    if (!a) return;
    const dx = a.x - a.n.x, dy = a.y - a.n.y, d = Math.hypot(dx, dy), passo = 1.5 * dt;
    if (d <= passo || d < 0.01) {
      a.n.x = a.x; a.n.y = a.y; E.alvo = null;
      if (a.n.modular) a.n.modular.tocar("parado");
      a.ok();
      return;
    }
    a.n.x += (dx / d) * passo; a.n.y += (dy / d) * passo;
    const sx = dx - dy, sy = dx + dy; // direção na tela
    const dir = Math.abs(sx) > Math.abs(sy) ? (sx > 0 ? "direita" : "esquerda") : (sy > 0 ? "baixo" : "cima");
    if (dir !== a.n.dir) vistaDe(a.n, dir);
  }
  function ela(texto, ms) { if (E.npc) E.npc.balao = { texto, ate: performance.now() + (ms || 2800) }; }
  // Sentada, ela é desenhada junto com a poltrona (como "ocupante", igual a quem já começa sentado no mapa).
  const cadeiraEm = (x, y) => PLANTA.caixas.find((k) => k.tipo === "cadeira" && x > k.x0 && x < k.x1 && y > k.y0 && y < k.y1);
  function sentarNpc(n, x, y, dir) {
    n.x = x; n.y = y; n.postura = "sentado";
    const c = cadeiraEm(x, y); if (c) c.ocupante = n;
    if (n.modular && E.api.poseSentada) E.api.poseSentada(n.modular);
    vistaDe(n, dir);
    if (n.modular) n.modular.tocar(n.modular.vista.startsWith("lado") ? "sentado" : "parado");
  }
  function levantarNpc(n) {
    for (const k of PLANTA.caixas) if (k.ocupante === n) delete k.ocupante;
    n.postura = "em_pe"; if (n.modular) n.modular.tocar("parado");
  }
  function escolha(titulo, opcoes) {
    return new Promise((ok) => {
      const caixa = document.createElement("div");
      caixa.className = "escolha"; caixa.setAttribute("role", "dialog");
      const t = document.createElement("div"); t.className = "escolha-titulo"; t.textContent = titulo;
      const grade = document.createElement("div"); grade.className = "escolha-grade";
      for (const [icone, texto, valor] of opcoes) {
        const b = document.createElement("button"); b.type = "button";
        const i = document.createElement("span"); i.className = "escolha-icone"; i.textContent = icone;
        b.append(i, document.createTextNode(texto));
        b.addEventListener("click", (e) => { e.stopPropagation(); caixa.remove(); ok(valor); });
        grade.appendChild(b);
      }
      caixa.append(t, grade);
      document.body.appendChild(caixa);
    });
  }
  function cortina(a, b) {
    const c = E.api.cortinaCom(a, b);
    document.body.appendChild(c);
    requestAnimationFrame(() => requestAnimationFrame(() => c.classList.add("fechada")));
    return {
      texto(x, y) { c.querySelector("small").textContent = x; c.querySelector("b").textContent = y; },
      abrir() { c.classList.remove("fechada"); setTimeout(() => c.remove(), 700); },
    };
  }
  const FALAS_VINHO = {
    metida: "Pelo menos tem rolha. Tô impressionada.",
    simpatica: "Ai, que fofo, você até separou as taças! 🥰",
    engracada: "Esse vinho tá melhor que as suas piadas, hein 😂",
    timida: "Eu nem bebo muito... só um pouquinho, tá? 🙈",
    fitness: "Uma taça. Amanhã tem treino. Talvez duas.",
  };
  const MAIS_TACA = [
    ["Saúde! Ao último ano de solteiro! 🥂", "Último ano? Sei... 😏"],
    ["Você fica mais bonita a cada taça.", "E você mais engraçado. Ou é o vinho? 😂"],
    ["Essa é a última taça, juro.", "Você fala isso do ano de solteiro também, né? 😂"],
  ];

  async function chegada() {
    const api = E.api, n = E.npc, p = perfilEnc();
    if (p) n.nome = p.nome;
    E.fase = "chegando";
    if (global.history && global.location) { // recarregar não repete o encontro
      const resto = global.location.search.replace(/[?&]encontro=[^&]*/, "").replace(/^&/, "?");
      global.history.replaceState(null, "", global.location.pathname + resto + global.location.hash);
    }
    await espera(2400);          // ele entra pela porta
    n.oculta = false;
    await andar(n, 3.9, 1.7);    // ela entra atrás
    vistaDe(n, "baixo");
    ela("Uau... que apê! Olha essa vista! 😍", 2800);
    await espera(2900);
    // ele já chama ela para sentar e tomar um vinho, e os dois vão para a mesinha
    api.falar("Fica à vontade! Senta aí que eu vou abrir um vinho pra gente 🍷", 3000);
    await espera(1800);
    const mesa = PLANTA.caixas.find((c) => c.interacao === "vinho");
    await new Promise((ok) => { api.irPara(mesa.falarDe.x, mesa.falarDe.y, ok); setTimeout(ok, 6000); });
    if (E.fase === "chegando") vinho();
  }

  async function vinho() {
    const api = E.api, n = E.npc, p = perfilEnc() || {};
    E.fase = "vinho";
    // personagem 3D: um pouco mais para a direita na poltrona (encaixa melhor no desenho dela)
    const tresD = api.poseConjunto && api.poseConjunto("sentado", "direita");
    api.sentar({ x: tresD ? 3.34 : 3.25, y: tresD ? 5.06 : 5.15, dir: "direita" });
    await andar(n, 5.75, 4.6);
    await andar(n, 5.1, 5.15);
    sentarNpc(n, 5.1, 5.15, "esquerda");
    ela("Hmm... vinho chileno? Chique, hein! 🍷", 2800); await espera(3000);
    api.falar("Só o melhor pra você! 😎", 2400); await espera(2300);
    api.pensar("(R$ 39,90. Ela não precisa saber.)", 2400); await espera(2600);
    ela(FALAS_VINHO[p.tipo] || "Tô gostando dessa noite... 😏", 3000); await espera(3200);
    ela("Sabe que você é mais engraçado do que parece? 😏", 3000); await espera(3200);
    let i = 0;
    for (;;) {
      const r = await escolha("E agora?", [["😏", "Chamar pro quarto", "quarto"], ["🍷", "Mais uma taça", "taca"]]);
      if (r === "quarto") break;
      const [dele, dela] = MAIS_TACA[i++ % MAIS_TACA.length];
      api.falar(dele, 2400); await espera(2600);
      ela(dela, 2800); await espera(3000);
    }
    await quarto();
  }

  async function quarto() {
    const api = E.api, n = E.npc, A = global.NSF.Audio;
    E.fase = "quarto";
    ela("Achei que você nunca ia chamar... 😏", 2600);
    await espera(1200);
    api.levantar(); levantarNpc(n);
    api.irPara(8.1, 2.6);
    await andar(n, 5.75, 4.0);
    await andar(n, 6.4, 3.1);
    await andar(n, 7.15, 2.8);
    vistaDe(n, "direita");
    await espera(900);
    api.jog.dir = "esquerda";
    api.falar("Peraí, vou ali rapidinho no banheiro! 🚿", 2400);
    await espera(2600);
    const c = cortina("Enquanto isso...", "no banheiro 🚿");
    await espera(2400);
    const temCorpo = imgCorpo.complete && imgCorpo.naturalWidth > 0;
    if (temCorpo) { api.jog.x = 8.1; api.jog.y = 2.6; api.jog.oculto = true; E.nu = true; vistaDe(n, "direita"); }
    c.abrir();
    await espera(900);
    if (temCorpo) {
      ela("KKKKKKKK MEU DEUS 😳😂", 2600); await espera(2800);
      ela("Que confiança é essa?! 😂", 2400); await espera(2600);
    }
    // tela escura: só os sons (e o vizinho)
    if (A) A.musica(false);
    const c2 = cortina("Mais tarde...", "🔥");
    // som da cena (atores, sem nada visual): "lovemaking1" de ddohler (Freesound, CC BY 4.0), trancado no pacote
    const SOM = "assets/cena18/quarto.mp3";
    let durSom = 0;
    if (A && A.voz) durSom = await A.voz(global.NSF.VIP ? global.NSF.VIP.url(SOM) : SOM).catch(() => 0);
    if (!durSom && A) A.risadinha();
    await espera(Math.max(2200, durSom * 1000 * 0.45));
    c2.texto("...", "nhec... nhec... nhec..."); if (A && !durSom) A.rangido(7);
    await espera(Math.max(4000, durSom * 1000 * 0.55));
    c2.texto("(o vizinho do 19 bateu no teto)", "TUM! TUM! TUM!"); if (A) A.batidas();
    await espera(1800);
    c2.texto("...", "Zzz..."); if (A) A.risadinha();
    await espera(2000);
    // manhã seguinte
    const proximo = (lerDia() + 1) % 4;
    gravarDia(proximo);
    c2.texto("Bom dia!", DIAS[proximo]);
    E.nu = false; n.oculta = true; levantarNpc(n);
    api.jog.oculto = true; dormindo = performance.now();
    await espera(2000);
    c2.abrir();
    if (A) A.musica(true);
    await espera(2600);
    dormindo = null;
    api.jog.oculto = false; api.jog.x = 8.3; api.jog.y = 2.55; api.jog.dir = "baixo";
    const temCorpoManha = imgCorpo.complete && imgCorpo.naturalWidth > 0;
    if (temCorpoManha) { api.jog.semCorpo = true; E.nu = true; } // levanta pelado, de tarja
    const nome = (perfilEnc() || {}).nome || "ela";
    api.pensar(`Ela já foi... deixou um bilhete: "Ontem foi demais 😘 — ${nome}"`, 4600);
    if (global.NSF.Celular && global.NSF.Celular.novaConversa) global.NSF.Celular.novaConversa({
      id: "encontro_" + ENC_ID + "_" + Date.now(), nome: nome + " 💋", app: "zap", cor: "#d81b60",
      mensagens: [], chega: 14, novas: [{ de: "ela", t: "Ontem foi demais 😘" }, { de: "ela", t: "Me chama de novo, hein... e sem a tarja de banheiro 😂" }],
      rodadas: [{ esperaNovas: true, opcoes: [
        { eu: "Quando quiser! O vinho tá garantido 🍷", volta: ["Combinado 😘"] },
        { eu: "Confiança é tudo, gata 😎", volta: ["KKKKKKKK", "Você não presta 😂"] },
      ] }] });
    await espera(4800);
    const arm = PLANTA.caixas.find((x) => x.interacao === "armario");
    if (!E.nu) { E.fase = null; api.pensar("Bora trocar de roupa...", 2400); if (arm) api.irAoVeiculo(arm); return; }
    // pelado até o guarda-roupa; quando ele abre, se veste
    E.fase = "manha";
    api.pensar("Bora me vestir, né... 😅", 2400);
    if (arm) api.irAoVeiculo(arm);
    const vestiu = setInterval(() => {
      if (!(global.NSF.Armario && global.NSF.Armario.aberto && global.NSF.Armario.aberto())) return;
      clearInterval(vestiu);
      E.nu = false; api.jog.semCorpo = false; E.fase = null;
    }, 200);
  }

  // o corpo de tarja, desenhado no lugar dele enquanto E.nu (mesmo tamanho e pés do personagem)
  function desenharCorpo(ctx, T) {
    if (!E.nu || !E.api) return;
    const j = E.api.jog, [x, y0] = T(j.x, j.y, 0), k = y0 - T(j.x, j.y, 1)[1], s = (1.73 * k) / 1375;
    const y = y0 - (j.andando ? Math.abs(Math.sin(performance.now() / 110)) * 5 : 0); // passinhos
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath(); ctx.ellipse(x, y0, 46, 13, 0, 0, 2 * Math.PI); ctx.fill();
    ctx.drawImage(imgCorpo, x - 512 * s, y - 1456 * s, 1024 * s, 1536 * s);
    ctx.restore();
  }

  if (ENC_ID) {
    const iniciarAntes = PLANTA.aoIniciar, interagirAntes = PLANTA.aoInteragir, desenharAntes = PLANTA.aoDesenhar;
    PLANTA.aoIniciar = (api, info) => {
      iniciarAntes(api, info);
      E.api = api;
      E.npc = (api.npcs || []).find((n) => n.id === "encontro");
      const NSFg = global.NSF;
      (NSFg.VIP ? NSFg.VIP.pronto : Promise.resolve()).then(() => {
        const c = "assets/cena18/corpo_frente.png";
        imgCorpo.src = NSFg.VIP ? NSFg.VIP.url(c) : c;
      });
      if (E.npc) chegada();
    };
    PLANTA.aoInteragir = (tipo, c) => {
      if (!E.fase) return interagirAntes(tipo, c);
      if (E.fase === "casa" && tipo === "vinho") { vinho(); return; }
      if (E.fase === "casa") E.api.pensar("Agora não... ela tá aqui! Bora no vinho 🍷", 2600);
      if (E.fase === "manha") E.api.pensar("Antes, uma roupa... 😅", 2200);
    };
    PLANTA.aoDesenhar = (ctx, T, agora) => {
      moverNpc(agora);
      desenharAntes(ctx, T, agora);
      desenharCorpo(ctx, T);
    };
  }

  if (global.NSF) global.NSF.PLANTA_APARTAMENTO = PLANTA;
  if (typeof module !== "undefined") module.exports = PLANTA;
})(typeof window !== "undefined" ? window : globalThis);
