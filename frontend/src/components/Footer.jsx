// Rodapé com a logo oficial da Educação Gamer.
export default function Footer() {
  return (
    <footer className="site-footer">
      <img src="/educacao-gamer-logo.png" alt="Educação Gamer" className="site-footer-logo-img" />
      <p className="site-footer-copy">© {new Date().getFullYear()} EDUCAÇÃO GAMER — CENTRAL DE JOGOS</p>
      <div className="site-footer-links">
        <a href="#">Termos de Uso</a>
        <a href="#">Privacidade</a>
        <a href="#">Suporte</a>
      </div>
    </footer>
  );
}
