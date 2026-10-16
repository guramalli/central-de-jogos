// Guarda-roupa do quarto: tela de "armário aberto" com as roupas nos cabides e um espelho com o personagem.
// Clicar numa roupa veste na hora (no espelho e no personagem do mapa). As peças vêm das roupas cadastradas no
// personagem modular (personagem_modular/roupas/*), então roupa nova aparece aqui sem mudar este arquivo.
// API: NSF.Armario.abrir({ heroi, previa, aoMudar(vestidas), aoFechar }) ; NSF.Armario.aberto()
//   heroi  = PersonagemModular do mapa (é ele que troca de roupa)
//   previa = outra instância já carregada, só para desenhar o espelho e as miniaturas
(function (global) {
  "use strict";
  const doc = global.document;
  const VISTAS = ["frente", "lado_direito", "costas", "lado_esquerdo"];
  let atual = null;

  function el(tag, classe, texto) {
    const e = doc.createElement(tag);
    if (classe) e.className = classe;
    if (texto != null) e.textContent = texto;
    return e;
  }

  // Desenha a prévia (pés embaixo, no centro) com as roupas dadas.
  function pintar(canvas, previa, vestidas, vista, escala, parte) {
    const ctx = canvas.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    previa.vestidas = vestidas.slice();
    previa.definirVista(vista);
    // miniatura de calça: mostra da cintura para baixo, maior
    if (parte === "baixo") previa.desenhar(ctx, canvas.width / 2, canvas.height - 6, escala * 1.7);
    else previa.desenhar(ctx, canvas.width / 2, canvas.height - 10, escala);
  }
  const PERNAS = /^(coxa|canela|pe)/;
  function parteDe(r) {
    const ossos = Object.values(r.vistas).flatMap((v) => (v.camadas || []).map((c) => c.osso));
    return ossos.length && ossos.every((o) => PERNAS.test(o)) ? "baixo" : "cima";
  }

  function abrir(o) {
    if (atual) return;
    const { heroi, previa } = o;
    previa.pixelado = false;
    // Duas partes: em cima (camiseta, jaqueta, camisa...) e embaixo (calças). A parte de cada roupa sai dos ossos em
    // que ela está presa: só pernas/pés = embaixo. Uma roupa por parte; a de baixo combina com qualquer de cima.
    const roupas = Object.values(heroi.roupas).filter((r) => !r.acessorio); // celular na mão etc. não é roupa
    const opcoes = [{ id: null, parte: "cima", nome: "Só a camiseta" }, { id: null, parte: "baixo", nome: "Jeans de sempre" }]
      .concat(roupas.map((r) => ({ id: r.id, parte: parteDe(r), nome: r.nome || r.id })))
      .sort((a, b) => (a.parte === b.parte ? 0 : a.parte === "cima" ? -1 : 1));
    let vista = 0;

    const fundo = el("div", "armario-fundo");
    fundo.setAttribute("role", "dialog");
    fundo.setAttribute("aria-label", "Guarda-roupa");
    const caixa = el("div", "armario-caixa");
    const topo = el("div", "armario-topo");
    topo.append(el("h2", null, "Guarda-roupa"), el("small", null, "O que você vai vestir hoje?"));

    const corpo = el("div", "armario-corpo");
    // armário aberto: portas, cano e cabides
    const interior = el("div", "armario-interior");
    interior.append(el("div", "armario-porta esq"), el("div", "armario-porta dir"), el("div", "armario-cano"));
    const cabides = el("div", "armario-cabides");
    const botoes = [];
    let parteAtual = null;
    for (const op of opcoes) {
      if (op.parte !== parteAtual) {
        parteAtual = op.parte;
        cabides.appendChild(el("div", "armario-parte", op.parte === "cima" ? "Parte de cima" : "Parte de baixo"));
      }
      const b = el("button", "armario-peca");
      b.setAttribute("aria-pressed", "false");
      const gancho = el("span", "armario-gancho");
      const mini = el("canvas"); mini.width = 96; mini.height = 132;
      pintar(mini, previa, op.id ? [op.id] : [], "frente", 0.085, op.parte);
      b.append(gancho, mini, el("span", "armario-nome", op.nome));
      b.addEventListener("click", () => vestir(op.id, op.parte));
      cabides.appendChild(b);
      botoes.push([op, b]);
    }
    interior.appendChild(cabides);

    // espelho com o personagem girando quando quiser
    const espelho = el("div", "armario-espelho");
    const tela = el("canvas"); tela.width = 240; tela.height = 340;
    const girar = el("div", "armario-girar");
    const bEsq = el("button", null, "◀"), bDir = el("button", null, "▶");
    bEsq.setAttribute("aria-label", "Girar para a esquerda"); bDir.setAttribute("aria-label", "Girar para a direita");
    bEsq.addEventListener("click", () => { vista = (vista + 3) % 4; redesenhar(); });
    bDir.addEventListener("click", () => { vista = (vista + 1) % 4; redesenhar(); });
    girar.append(bEsq, bDir);
    espelho.append(tela, girar);

    corpo.append(interior, espelho);
    const pronto = el("button", "armario-pronto", "Pronto");
    pronto.addEventListener("click", fechar);
    caixa.append(topo, corpo, pronto);
    fundo.appendChild(caixa);
    fundo.addEventListener("pointerdown", (e) => { if (e.target === fundo) fechar(); });
    doc.body.appendChild(fundo);

    function marcar() {
      for (const [op, b] of botoes) {
        const daParte = heroi.vestidas.filter((r) => !heroi.roupas[r].acessorio && parteDe(heroi.roupas[r]) === op.parte);
        const vestida = op.id ? daParte.includes(op.id) : daParte.length === 0;
        b.setAttribute("aria-pressed", String(vestida));
      }
    }
    function vestir(id, parte) {
      for (const r of heroi.vestidas.slice()) {
        if (!heroi.roupas[r].acessorio && parteDe(heroi.roupas[r]) === parte) heroi.tirar(r);
      }
      if (id) heroi.vestir(id);
      marcar();
      redesenhar(); // na hora do clique, sem esperar o próximo quadro
      if (o.aoMudar) o.aoMudar(heroi.vestidas.slice());
    }
    function redesenhar() { pintar(tela, previa, heroi.vestidas, VISTAS[vista], 0.22); }
    let pedido = 0, antes = 0;
    function quadro(agora) {
      const dt = antes ? Math.min(0.1, (agora - antes) / 1000) : 0;
      antes = agora;
      previa.tocar("parado");
      previa.atualizar(dt);
      pintar(tela, previa, heroi.vestidas, VISTAS[vista], 0.22);
      pedido = global.requestAnimationFrame(quadro);
    }
    function fechar() {
      global.cancelAnimationFrame(pedido);
      doc.removeEventListener("keydown", tecla, true);
      fundo.remove();
      atual = null;
      if (o.aoFechar) o.aoFechar();
    }
    function tecla(e) {
      if (e.key === "Escape") { e.preventDefault(); fechar(); }
      e.stopPropagation(); // as setas não andam com o armário aberto
    }
    doc.addEventListener("keydown", tecla, true);
    marcar();
    pedido = global.requestAnimationFrame(quadro);
    pintar(tela, previa, heroi.vestidas, VISTAS[vista], 0.22);
    atual = { fechar };
    (botoes.find(([, b]) => b.getAttribute("aria-pressed") === "true") || botoes[0])[1].focus();
  }

  const Armario = { abrir, aberto: () => !!atual, fechar: () => atual && atual.fechar() };
  if (global.NSF) global.NSF.Armario = Armario;
})(typeof window !== "undefined" ? window : globalThis);
