import { useEffect, useState } from "react";

// Conjunto de emojis padrão, disponível pra todo mundo. Organizado em
// categorias simples só pra facilitar a leitura visual no seletor.
const EMOJI_CATEGORIES = [
  {
    label: "Reações",
    emojis: ["😀", "😂", "😅", "😉", "😍", "😎", "🤔", "😭", "😱", "😡", "🥳", "🙄"],
  },
  {
    label: "Jogo",
    emojis: ["🎮", "🏆", "🔥", "⚡", "💯", "👑", "🎯", "🍀", "⭐", "💪", "🚀", "🎉"],
  },
  {
    label: "Gestos",
    emojis: ["👍", "👎", "👏", "🙌", "🤝", "✋", "🤞", "👋", "🙏", "❤️", "💔", "😴"],
  },
];

// PONTO DE EXTENSÃO PRA CONTA PREMIUM (futuro): quando o sistema de contas
// premium existir, basta receber uma prop tipo `isPremium` aqui e adicionar
// uma categoria extra em EMOJI_CATEGORIES (ou um array separado
// PREMIUM_EMOJI_CATEGORIES), renderizada só quando isPremium for true. A
// estrutura de categorias já foi pensada pra isso — não precisa reescrever
// nada, só adicionar o bloco novo condicionalmente.
export default function EmojiPicker({ onSelect }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function close() {
      setOpen(false);
    }
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [open]);

  return (
    <div className="emoji-picker">
      <button
        type="button"
        className="emoji-picker-btn"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        title="Emojis"
      >
        😊
      </button>
      {open && (
        <div className="emoji-picker-popover" onClick={(e) => e.stopPropagation()}>
          {EMOJI_CATEGORIES.map((cat) => (
            <div key={cat.label} className="emoji-picker-category">
              <span className="emoji-picker-category-label">{cat.label}</span>
              <div className="emoji-picker-grid">
                {cat.emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="emoji-picker-item"
                    onClick={() => {
                      onSelect(emoji);
                      setOpen(false);
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
