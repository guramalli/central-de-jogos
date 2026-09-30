import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Banner de novidade da home — anuncia lançamentos pros jogadores ativos.
// Dispensável: quem fecha não vê mais (guardado no navegador por ID, então
// uma PRÓXIMA novidade com outro ID reaparece normalmente).
//
// Pra anunciar outra coisa no futuro: troca o NOVIDADE_ID, o texto e o link.
// ID novo = banner reaparece pra todo mundo, inclusive pra quem fechou o
// anterior. É o comportamento certo aqui: quem já joga Quiz não vai descobrir
// sozinho que agora vale prêmio.
const NOVIDADE_ID = "aviso-fim-premiacao-out2026";

export default function NovidadeBanner() {
  const { user } = useAuth();
  const [fechado, setFechado] = useState(() => {
    try {
      return localStorage.getItem(NOVIDADE_ID) === "fechado";
    } catch {
      return false;
    }
  });

  if (fechado) return null;

  function fechar() {
    setFechado(true);
    try {
      localStorage.setItem(NOVIDADE_ID, "fechado");
    } catch {
      // navegador sem storage (modo privado antigo): só fecha nesta visita
    }
  }

  return (
    <div className="novidade-banner">
      <div className="novidade-banner-texto">
        <span className="novidade-banner-tag">AVISO</span>
        <span>
          📢 <strong>Setembro é o último mês com premiação em Pix.</strong> A partir de outubro, o
          Stop e o Quiz não pagam mais prêmio em dinheiro. Os rankings mensais continuam, com
          patentes, títulos e a coroa e o troféu de campeão do mês.
        </span>
      </div>
      <div className="novidade-banner-acoes">
        <Link className="btn btn-sm" to={user ? "/ranking" : "/login"} onClick={fechar}>
          {user ? "Ver o ranking" : "Entrar e jogar"}
        </Link>
        {/* O banner anuncia UM destaque; a página guarda o histórico. Quem
            some por duas semanas e volta não descobre pelo banner o que
            mudou nesse meio-tempo. */}
        <Link className="btn btn-sm secondary" to="/novidades" onClick={fechar}>
          Novidades
        </Link>
        <button className="novidade-banner-fechar" onClick={fechar} aria-label="Fechar aviso">
          ✕
        </button>
      </div>
    </div>
  );
}
