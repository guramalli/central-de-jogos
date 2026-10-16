// Ligação telefônica com conversa em balões (estilo app de mensagens), por cima do jogo.
// Usa um roteiro de js/dialogos/*.js. O telefone toca -> Atender/Recusar -> falas uma a uma (com "digitando…")
// -> o jogador escolhe uma opção -> mais falas -> fim. Enquanto a tela está aberta, o personagem não anda.
// API: NSF.Ligacao.tocar(roteiro, { aoTerminar(resultado) }) (tela de chamada) ; .atender(...) (direto na conversa) ;
// NSF.Ligacao.aberta() ; NSF.Ligacao.fechar()
(function (global) {
  "use strict";
  const doc = global.document;

  const CSS = `
  .lig-fundo { position: fixed; inset: 0; z-index: 20; display: flex; align-items: flex-end; justify-content: center;
    background: rgba(5, 2, 12, 0.55); font: 15px/1.4 system-ui, sans-serif; color: #f3ecff;
    padding: max(10px, env(safe-area-inset-top)) 10px max(10px, env(safe-area-inset-bottom)); }
  .lig-tel { width: min(420px, 100%); max-height: min(640px, 100%); display: flex; flex-direction: column;
    background: #160d24; border: 2px solid #5b3d86; border-radius: 22px; overflow: hidden;
    box-shadow: 0 0 0 4px #0b0712, 0 0 30px rgba(255, 90, 216, 0.25); }
  .lig-topo { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: #241536;
    border-bottom: 1px solid #3d2a5c; }
  .lig-foto { width: 46px; height: 46px; border-radius: 50%; background: #3a2550 center/cover no-repeat;
    border: 2px solid #ff5ad8; flex: none; image-rendering: auto; }
  .lig-nome { font-weight: 700; } .lig-status { font-size: 12px; color: #b3a3d4; }
  .lig-msgs { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px;
    min-height: 220px; }
  .lig-linha { display: flex; gap: 8px; align-items: flex-end; animation: lig-entra .18s ease-out; }
  .lig-linha.eu { justify-content: flex-end; }
  .lig-mini { width: 30px; height: 30px; border-radius: 50%; background: #3a2550 center/cover no-repeat; flex: none; }
  .lig-balao { max-width: 78%; padding: 8px 12px; border-radius: 16px; background: #2e1e45; border-bottom-left-radius: 4px; }
  .lig-linha.eu .lig-balao { background: #b0279a; border-bottom-left-radius: 16px; border-bottom-right-radius: 4px; }
  .lig-digitando { color: #b3a3d4; font-style: italic; }
  .lig-sistema { align-self: center; font-size: 13px; color: #d8c8ff; background: #241536; border-radius: 10px;
    padding: 6px 10px; text-align: center; }
  .lig-acoes { padding: 10px; display: flex; flex-direction: column; gap: 8px; border-top: 1px solid #3d2a5c; }
  .lig-acoes button { font: 600 15px system-ui, sans-serif; color: #fff; background: #3a2550; border: 1px solid #6e4aa0;
    border-radius: 12px; padding: 12px; cursor: pointer; text-align: left; }
  .lig-acoes button:hover, .lig-acoes button:focus-visible { border-color: #ff5ad8; outline: none; }
  .lig-acoes .verde { background: #1f8f4e; border-color: #3ddc84; text-align: center; }
  .lig-acoes .vermelho { background: #7a1f2e; border-color: #e0475f; text-align: center; }
  .lig-chamada { padding: 26px 16px 18px; display: flex; flex-direction: column; align-items: center; gap: 10px; }
  .lig-chamada .lig-foto { width: 110px; height: 110px; animation: lig-pulsa 1s ease-in-out infinite; }
  .lig-chamada .lig-nome { font-size: 20px; }
  .lig-par { display: flex; gap: 10px; width: 100%; } .lig-par button { flex: 1; }
  @keyframes lig-entra { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
  @keyframes lig-pulsa { 50% { box-shadow: 0 0 0 10px rgba(255, 90, 216, 0.15); } }
  @media (prefers-reduced-motion: reduce) { .lig-linha, .lig-chamada .lig-foto { animation: none; } }`;

  let estilo = null, fundo = null, atual = null;

  function el(tag, classe, texto) {
    const e = doc.createElement(tag);
    if (classe) e.className = classe;
    if (texto != null) e.textContent = texto;
    return e;
  }

  function fechar() {
    if (fundo) fundo.remove();
    fundo = null;
    atual = null;
  }

  // Esqueleto do "telefone": topo com foto e nome, área de mensagens, área de botões.
  function montar(roteiro, status) {
    if (!estilo) { estilo = el("style"); estilo.textContent = CSS; doc.head.appendChild(estilo); }
    fundo = el("div", "lig-fundo");
    fundo.setAttribute("role", "dialog");
    fundo.setAttribute("aria-label", "Ligação de " + roteiro.contato);
    const tel = el("div", "lig-tel");
    fundo.appendChild(tel);
    doc.body.appendChild(fundo);
    return { tel, status };
  }

  function topo(tel, roteiro, status) {
    const t = el("div", "lig-topo");
    const foto = el("div", "lig-foto");
    foto.style.backgroundImage = `url("${roteiro.foto}")`;
    const txt = el("div");
    txt.append(el("div", "lig-nome", roteiro.contato), el("div", "lig-status", status));
    t.append(foto, txt);
    tel.appendChild(t);
    return t;
  }

  // Tela 1: telefone tocando.
  function tocar(roteiro, opcoes) {
    if (atual) return;
    const o = opcoes || {};
    atual = { roteiro, o, fila: [], esperando: null };
    const { tel } = montar(roteiro);
    const c = el("div", "lig-chamada");
    const foto = el("div", "lig-foto");
    foto.style.backgroundImage = `url("${roteiro.foto}")`;
    c.append(foto, el("div", "lig-nome", roteiro.contato), el("div", "lig-status", "chamando…"));
    const acoes = el("div", "lig-acoes");
    const par = el("div", "lig-par");
    const nao = el("button", "vermelho", "Recusar");
    const sim = el("button", "verde", "Atender");
    par.append(nao, sim);
    acoes.appendChild(par);
    tel.append(c, acoes);
    sim.focus();
    nao.onclick = () => { const f = o.aoTerminar; fechar(); if (f) f("recusou"); };
    sim.onclick = () => conversa(roteiro, o);
  }

  // Atender direto (o jogador tocou no celular): abre já na conversa, sem a tela de chamada.
  function atender(roteiro, opcoes) {
    if (atual) return;
    atual = { roteiro, o: opcoes || {}, fila: [], esperando: null };
    montar(roteiro);
    conversa(roteiro, atual.o);
  }

  // Tela 2: conversa.
  function conversa(roteiro, o) {
    fundo.firstChild.replaceChildren();
    const tel = fundo.firstChild;
    topo(tel, roteiro, "em ligação");
    const msgs = el("div", "lig-msgs");
    msgs.setAttribute("aria-live", "polite");
    const acoes = el("div", "lig-acoes");
    tel.append(msgs, acoes);
    atual.msgs = msgs;
    atual.acoes = acoes;
    no(roteiro.inicio);
  }

  const RAPIDO = () => global.NSF && global.NSF.estado && global.NSF.estado.modoTeste;

  function balao(f) {
    const linha = el("div", "lig-linha" + (f.quem === "eu" ? " eu" : ""));
    if (f.quem !== "eu") {
      const mini = el("div", "lig-mini");
      mini.style.backgroundImage = `url("${atual.roteiro.foto}")`;
      linha.appendChild(mini);
    }
    linha.appendChild(el("div", "lig-balao", f.texto));
    atual.msgs.appendChild(linha);
    atual.msgs.scrollTop = atual.msgs.scrollHeight;
  }

  // Mostra as falas de um nó uma a uma (as dela com "digitando…"), depois as opções ou o fim.
  function no(id) {
    const n = atual.roteiro.nos[id];
    atual.acoes.replaceChildren();
    let i = 0;
    const proxima = () => {
      if (!atual) return;
      if (i >= n.falas.length) return depois(n);
      const f = n.falas[i++];
      if (f.quem === "eu") { balao(f); atual.esperando = setTimeout(proxima, RAPIDO() ? 0 : 450); return; }
      const dig = el("div", "lig-linha");
      dig.appendChild(el("div", "lig-balao lig-digitando", "digitando…"));
      atual.msgs.appendChild(dig);
      atual.msgs.scrollTop = atual.msgs.scrollHeight;
      const tempo = RAPIDO() ? 0 : Math.min(1600, 500 + f.texto.length * 18);
      atual.esperando = setTimeout(() => { dig.remove(); balao(f); atual.esperando = setTimeout(proxima, RAPIDO() ? 0 : 250); }, tempo);
    };
    proxima();
  }

  function depois(n) {
    if (n.opcoes) {
      n.opcoes.forEach((op, k) => {
        const b = el("button", null, `${k + 1}. ${op.texto}`);
        b.onclick = () => no(op.vai);
        atual.acoes.appendChild(b);
      });
      atual.acoes.querySelector("button").focus();
      return;
    }
    const s = el("div", "lig-sistema", n.fim.texto);
    atual.msgs.appendChild(s);
    atual.msgs.scrollTop = atual.msgs.scrollHeight;
    const b = el("button", "vermelho", "Desligar");
    const f = atual.o.aoTerminar, r = n.fim.resultado;
    b.onclick = () => { fechar(); if (f) f(r); };
    atual.acoes.appendChild(b);
    b.focus();
  }

  // Atalhos de teclado: 1/2 escolhem opção, Enter/espaço aciona o botão em foco (o navegador já faz).
  global.addEventListener("keydown", (e) => {
    if (!atual || !fundo) return;
    const botoes = [...fundo.querySelectorAll(".lig-acoes button")];
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= botoes.length && botoes.length > 1 && !botoes[0].classList.contains("vermelho")) {
      e.preventDefault(); botoes[n - 1].click();
    }
    e.stopPropagation();
  }, true);

  const Ligacao = {
    tocar,
    atender,
    aberta: () => !!atual,
    fechar,
  };
  if (global.NSF) global.NSF.Ligacao = Ligacao;
})(typeof window !== "undefined" ? window : globalThis);
