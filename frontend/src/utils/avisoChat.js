// Aviso do ANTI-FLOOD dos chats (o servidor manda "chat-limite" quando a
// pessoa manda mensagens rápido demais ou repetidas). Uma faixa discreta no
// rodapé, que some sozinha — funciona em qualquer tela, das duas versões,
// porque é ligada onde a conexão é criada. Estilo inline: não depende de CSS.
let faixa = null;
let temporizador = null;

export function mostrarAvisoChat({ mensagem } = {}) {
  if (!mensagem || typeof document === "undefined") return;
  if (!faixa) {
    faixa = document.createElement("div");
    faixa.setAttribute("role", "status");
    faixa.setAttribute("aria-live", "polite");
    Object.assign(faixa.style, {
      position: "fixed", left: "50%", bottom: "84px", transform: "translateX(-50%)", zIndex: "9999",
      maxWidth: "min(92vw, 460px)", padding: "10px 16px", borderRadius: "14px",
      background: "#2b1b5e", color: "#fff", border: "2px solid #ffd60a",
      font: "700 14px/1.35 system-ui, sans-serif", textAlign: "center",
      boxShadow: "0 8px 24px rgba(0,0,0,.35)", transition: "opacity .3s", opacity: "0", pointerEvents: "none",
    });
    document.body.appendChild(faixa);
  }
  faixa.textContent = `⏳ ${mensagem}`;
  faixa.style.opacity = "1";
  clearTimeout(temporizador);
  temporizador = setTimeout(() => { if (faixa) faixa.style.opacity = "0"; }, 4500);
}

// Liga o aviso num socket (uma vez só por socket).
export function ligarAvisoChat(socket) {
  if (!socket || socket.__avisoChat) return socket;
  socket.__avisoChat = true;
  socket.on("chat-limite", mostrarAvisoChat);
  return socket;
}
