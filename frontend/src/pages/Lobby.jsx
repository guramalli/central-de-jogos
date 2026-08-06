import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import FeedbackModal from "../components/FeedbackModal.jsx";
import { api } from "../api/client.js";

export default function Lobby() {
  const { user } = useAuth();
  const [showFeedback, setShowFeedback] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/platform-stats").then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  return (
    <div className="lobby-page">
      {/* Aviso de Beta */}
      <div className="beta-banner">
        <span className="beta-badge">BETA</span>
        <span>
          O portal está em fase de <strong>testes (Beta)</strong> — pode encontrar bugs ou
          lentidão de vez em quando. Obrigado pela paciência! Encontrou algo estranho? Manda pra
          gente:
        </span>
        <button className="beta-feedback-btn" onClick={() => setShowFeedback(true)}>
          💬 Enviar feedback
        </button>
      </div>

      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}

      {/* Painel de boas-vindas */}
      <section className="glossy-panel lobby-hero">
        <div>
          <p className="lobby-hero-tag">BEM-VINDO DE VOLTA</p>
          <h1 className="lobby-hero-title">{user?.nickname}</h1>
          <p className="lobby-hero-subtitle">
            Escolha um jogo, suba de patente e dispute a premiação mensal.
          </p>
        </div>
        <div className="lobby-hero-benefits">
          <div className="lobby-benefit">
            <span className="material-symbols-outlined lobby-benefit-icon">emoji_events</span>
            <span>Ranking mensal com premiação</span>
          </div>
          <div className="lobby-benefit">
            <span className="material-symbols-outlined lobby-benefit-icon">star</span>
            <span>Patente vitalícia por jogo</span>
          </div>
          <div className="lobby-benefit lobby-benefit-muted">
            <span className="material-symbols-outlined">group</span>
            <span>Chat e jogadores online</span>
          </div>
        </div>
      </section>

      {/* Estatísticas da plataforma */}
      {stats && (
        <div className="platform-stats-row">
          <div className="glossy-panel platform-stat-card">
            <span className="material-symbols-outlined platform-stat-icon">group</span>
            <div>
              <div className="platform-stat-value">{stats.totalUsers.toLocaleString("pt-BR")}</div>
              <div className="platform-stat-label">Jogadores cadastrados</div>
            </div>
          </div>
          <div className="glossy-panel platform-stat-card">
            <span className="material-symbols-outlined platform-stat-icon">trending_up</span>
            <div>
              <div className="platform-stat-value">{stats.peakConcurrentPlayers.toLocaleString("pt-BR")}</div>
              <div className="platform-stat-label">Recorde de jogadores simultâneos</div>
            </div>
          </div>
        </div>
      )}

      {/* Cards dos jogos */}
      <div className="lobby-game-grid">
        <Link to="/jogos/stop" className="glossy-panel lobby-game-card">
          <img src="/stop-logo.png" alt="Stop!" className="lobby-game-logo" />
          <div>
            <h3 className="lobby-game-title">Stop</h3>
            <p className="lobby-game-desc">
              Teste sua velocidade de digitação e seus conhecimentos gerais contra o relógio — 6
              temas, 1 letra sorteada, e quem escreve mais rápido (e certo) sai na frente.
            </p>
            <span className="lobby-game-cta">
              Ver salas <span className="material-symbols-outlined">arrow_forward</span>
            </span>
          </div>
        </Link>

        <Link to="/jogos/quiz" className="glossy-panel lobby-game-card">
          <img src="/quiz-logo.png" alt="Quiz!" className="lobby-game-logo" />
          <div>
            <h3 className="lobby-game-title">Quiz</h3>
            <p className="lobby-game-desc">
              Perguntas por tema — Esportes, Ciências, História, Cinema e Letras. Quem acerta
              primeiro leva os pontos!
            </p>
            <span className="lobby-game-cta">
              Ver salas <span className="material-symbols-outlined">arrow_forward</span>
            </span>
          </div>
        </Link>
      </div>

      {/* Links rápidos */}
      <div className="lobby-quick-grid">
        <Link to="/ranking" className="glossy-panel lobby-quick-card">
          <h4>Ver ranking</h4>
          <p>Mensal e vitalício</p>
        </Link>
        {(user?.role === "ADMIN" || user?.role === "MODERATOR") && (
          <Link to="/admin" className="glossy-panel lobby-quick-card">
            <h4>Painel admin</h4>
            <p>Moderar glossário</p>
          </Link>
        )}
      </div>

      {/* Sobre o projeto */}
      <section className="glossy-panel about-project">
        <h4>Sobre o projeto</h4>
        <p>
          A Educação Gamer nasceu do carinho de um ex-jogador da antiga <strong>Central de Jogos</strong>,
          que queria reviver os momentos incríveis vividos na adolescência jogando com os amigos.
          Foi por causa dessa vontade de recuperar aquela época boa que essa plataforma começou a
          ser recriada — com bastante carinho, e ainda em construção. Obrigado por fazer parte
          dessa jornada! 🎮
        </p>
      </section>
    </div>
  );
}
