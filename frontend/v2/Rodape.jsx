import { useEffect, useState } from "react";
import { api } from "./api.js";
import { irParaPagina, linkDaPagina } from "./App.jsx";
import { ModalFeedback } from "./Modais.jsx";
import { DISCORD_URL } from "../src/data/comunidade.js";

// Rodapé com os mesmos links do clássico (src/components/Footer.jsx).
// As páginas .html são as de SEO — precisam ser linkadas de dentro do site.
export default function Rodape() {
  const [stats, setStats] = useState(null);
  const [suporte, setSuporte] = useState(false);

  useEffect(() => {
    api.get("/platform-stats").then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  return (
    <footer className="v2-rodape-site">
      <img src="/educacao-gamer-logo.png" alt="Educação Gamer" className="v2-rodape-logo" />
      <p className="v2-rodape-copy">© {new Date().getFullYear()} EDUCAÇÃO GAMER</p>
      <nav className="v2-rodape-links" aria-label="Rodapé">
        <a href="/jogar-stop-online.html">Como jogar Stop</a>
        <a href="/palavras-stop-letras-dificeis.html">Palavras difíceis</a>
        <a href="/quiz-online.html">Sobre o Quiz</a>
        <a href="/central-de-jogos-quiznet.html">Central de Jogos</a>
        <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer">Discord</a>
        <a href={linkDaPagina("novidades")} onClick={(e) => { e.preventDefault(); irParaPagina("novidades"); }}>Novidades</a>
        <a href={linkDaPagina("termos")} onClick={(e) => { e.preventDefault(); irParaPagina("termos"); }}>Termos de Uso</a>
        <a href={linkDaPagina("privacidade")} onClick={(e) => { e.preventDefault(); irParaPagina("privacidade"); }}>Privacidade</a>
        <button type="button" onClick={() => setSuporte(true)}>Suporte</button>
      </nav>
      {stats && (
        <div className="v2-rodape-stats">
          {Number(stats.totalUsers || 0).toLocaleString("pt-BR")} cadastrados · recorde de {Number(stats.peakConcurrentPlayers || 0).toLocaleString("pt-BR")} simultâneos
        </div>
      )}
      {suporte && <ModalFeedback aoFechar={() => setSuporte(false)} />}
    </footer>
  );
}
