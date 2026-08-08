import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Faixa fixa no topo pra quem está jogando como visitante — lembra que a
// pontuação não conta e oferece o caminho pro cadastro. Some sozinha
// assim que a pessoa cria uma conta de verdade.
export default function GuestBanner() {
  const { user } = useAuth();

  if (!user?.isGuest) return null;

  return (
    <div className="guest-banner">
      <span className="guest-banner-icon">👤</span>
      <span className="guest-banner-text">
        Você está jogando como <strong>visitante</strong> — sua pontuação não conta pro ranking nem
        pra premiação do mês.
      </span>
      <Link to="/registrar" className="guest-banner-cta">
        Criar conta grátis
      </Link>
    </div>
  );
}
