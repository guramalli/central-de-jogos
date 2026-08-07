import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import FeedbackModal from "./FeedbackModal.jsx";

// Rodapé com a logo oficial da Educação Gamer, e um cantinho discreto com
// estatísticas da plataforma (total de cadastrados + recorde simultâneo).
export default function Footer() {
  const [stats, setStats] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    api.get("/platform-stats").then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  return (
    <footer className="site-footer">
      <img src="/educacao-gamer-logo.png" alt="Educação Gamer" className="site-footer-logo-img" />
      <p className="site-footer-copy">© {new Date().getFullYear()} EDUCAÇÃO GAMER — CENTRAL DE JOGOS</p>
      <div className="site-footer-links">
        <Link to="/termos-de-uso">Termos de Uso</Link>
        <a href="#">Privacidade</a>
        <button className="site-footer-link-btn" onClick={() => setShowFeedback(true)}>Suporte</button>
      </div>
      {stats && (
        <div className="site-footer-stats">
          👥 {stats.totalUsers.toLocaleString("pt-BR")} cadastrados · 🔥 recorde de{" "}
          {stats.peakConcurrentPlayers.toLocaleString("pt-BR")} simultâneos
        </div>
      )}
      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
    </footer>
  );
}
