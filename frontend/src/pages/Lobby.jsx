import { useState, useEffect } from "react";
import { useAcromaniaAtivo } from "../components/useAcromaniaAtivo.js";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import FeedbackModal from "../components/FeedbackModal.jsx";
import InviteButton from "../components/InviteButton.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import Seo from "../components/Seo.jsx";
import NovidadeBanner from "../components/NovidadeBanner.jsx";
import PainelDoJogador from "../components/PainelDoJogador.jsx";
import GeneralChatWidget from "../components/GeneralChatWidget.jsx";

export default function Lobby() {
  const acromaniaAtivo = useAcromaniaAtivo();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [showFeedback, setShowFeedback] = useState(false);

  // Garante que a página inicial sempre abre no topo — sem isso, o
  // navegador podia manter a rolagem de onde a pessoa estava antes.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="lobby-page">
      <NovidadeBanner />

      <Seo title="Início" description="Jogue Stop, Quiz e Acromania com a galera — a nostalgia da Central de Jogos, de volta, com ranking, patentes e premiação." />
      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}

      {/* Painel de boas-vindas */}
      <section className="glossy-panel lobby-hero">
        <div>
          <p className="lobby-hero-tag">BEM-VINDO DE VOLTA</p>
          <h1 className="lobby-hero-title">{user?.nickname}</h1>
          <p className="lobby-hero-subtitle">
            Escolha um jogo, suba de patente e dispute a premiação mensal.
          </p>
          <div style={{ marginTop: 14 }}>
            <InviteButton message="Vem jogar comigo na Educação Gamer! 🎮 Stop, Quiz e muito mais:" />
          </div>
        </div>
        <PainelDoJogador userId={user?.id} />
      </section>

      {/* Cards dos jogos */}
      <div className="lobby-game-grid">
        <Link to="/jogos/stop" className="glossy-panel lobby-game-card home-game-card">
          <img src="/stop-logo.png" alt="Stop!" className="lobby-game-logo" />
          <div>
            <h3 className="lobby-game-title">Stop</h3>
            <p className="lobby-game-desc">
              Aqui não adianta saber todos os temas: tem que ser rápido de verdade. 6 temas, 1 letra
              sorteada, e quem hesita perde a rodada pro dedo mais veloz da sala.
            </p>
            <span className="lobby-game-cta">
              Ver salas <span className="material-symbols-outlined">arrow_forward</span>
            </span>
          </div>
        </Link>

        <Link to="/jogos/quiz" className="glossy-panel lobby-game-card home-game-card">
          <img src={theme === "light" ? "/quiz-logo-light.png" : "/quiz-logo.png"} alt="Quiz!" className="lobby-game-logo" />
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

        {/* Acromania: liberado em fase de testes. O selo é honesto e serve de
            expectativa — é a primeira vez que o jogo roda com gente real, e
            avisar evita que um problema seja lido como descaso. */}
        {acromaniaAtivo && (
        <Link to="/jogos/acromania" className="glossy-panel lobby-game-card home-game-card home-game-card-beta">
          <span className="home-game-beta-badge">EM TESTES</span>
          <img src={theme === "light" ? "/acromania-logo-light.png" : "/acromania-logo.png"} alt="Acromania" className="lobby-game-logo" />
          <div>
            <h3 className="lobby-game-title">Acromania</h3>
            <p className="lobby-game-desc">
              Um tema, algumas letras, e você cria a frase mais criativa possível — a galera vota
              na melhor. Quanto mais gente na sala, melhor fica.
            </p>
            <span className="lobby-game-cta">
              Ver salas <span className="material-symbols-outlined">arrow_forward</span>
            </span>
          </div>
        </Link>
        )}
      </div>

      {/* Premiação do mês */}
      <div className="prize-banner">
        <div className="prize-banner-header">
          <span className="prize-badge">🏆 PREMIAÇÃO</span>
          <span className="prize-banner-intro">
            Neste mês de testes, o <strong>ranking mensal do Stop</strong> vai premiar de verdade!
          </span>
        </div>
        <div className="prize-list">
          <div className="prize-row">
            <span className="prize-medal">🥇</span>
            <span className="prize-place">1º lugar</span>
            <span className="prize-value">R$ 200</span>
          </div>
          <div className="prize-row">
            <span className="prize-medal">🥈</span>
            <span className="prize-place">2º lugar</span>
            <span className="prize-value">R$ 100</span>
          </div>
          <div className="prize-row">
            <span className="prize-medal">🥉</span>
            <span className="prize-place">3º lugar</span>
            <span className="prize-value">R$ 50</span>
          </div>
        </div>
        <p className="prize-banner-note">Pagamento via Pix.</p>
        <Link to="/ranking" className="prize-banner-link">Ver ranking →</Link>
      </div>

      <GeneralChatWidget />

      {/* Links rápidos */}
      <div className={`lobby-quick-grid ${!(user?.role === "ADMIN" || user?.role === "MODERATOR") ? "lobby-quick-grid-single" : ""}`}>
        <Link to="/ranking" className="glossy-panel lobby-quick-card lobby-ranking-card">
          <svg className="lobby-podium-svg" viewBox="0 0 120 70" xmlns="http://www.w3.org/2000/svg">
            <text x="30" y="14" textAnchor="middle" fontSize="20">🥈</text>
            <rect x="14" y="34" width="32" height="30" rx="4" fill="#c0c0c0" />
            <text x="60" y="2" textAnchor="middle" fontSize="22">🥇</text>
            <rect x="44" y="22" width="32" height="42" rx="4" fill="#ffd700" />
            <text x="90" y="22" textAnchor="middle" fontSize="18">🥉</text>
            <rect x="74" y="42" width="32" height="22" rx="4" fill="#cd7f32" />
          </svg>
          <div>
            <h4>Ranking</h4>
            <p>Mensal e vitalício</p>
          </div>
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

      {/* Aviso de Beta — no pé da página, acima do rodapé: informa sem
          empurrar o conteúdo principal pra baixo logo na chegada. */}
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
    </div>
  );
}
