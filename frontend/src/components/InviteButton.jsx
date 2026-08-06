import { useEffect, useState } from "react";

// Botão de convidar amigos — abre um mini-menu com WhatsApp e "copiar link".
// Usa a Web Share API nativa no celular quando disponível (abre o menu de
// compartilhar de verdade do sistema), com o mini-menu como alternativa.
export default function InviteButton({ url, message, label = "Convidar amigos" }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [open]);

  const shareUrl = url || window.location.origin;
  const shareText = message || "Vem jogar comigo na Educação Gamer! 🎮";
  const fullText = `${shareText} ${shareUrl}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(fullText)}`;

  async function handleClick(e) {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({ title: "Educação Gamer", text: shareText, url: shareUrl });
      } catch {
        // usuário cancelou o compartilhamento — sem problema, não faz nada
      }
    } else {
      setOpen((o) => !o);
    }
  }

  async function handleCopy(e) {
    e.stopPropagation();
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="invite-btn-wrap">
      <button className="retro-btn" onClick={handleClick}>
        📣 {label}
      </button>
      {open && (
        <div className="invite-popover" onClick={(e) => e.stopPropagation()}>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="invite-option">
            💬 Compartilhar no WhatsApp
          </a>
          <button className="invite-option" onClick={handleCopy}>
            {copied ? "✓ Link copiado!" : "🔗 Copiar link"}
          </button>
        </div>
      )}
    </div>
  );
}
