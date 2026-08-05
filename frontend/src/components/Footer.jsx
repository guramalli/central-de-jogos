// Rodapé retrô, no mesmo espírito do design da placa "STOP!".
export default function Footer() {
  return (
    <footer className="site-footer">
      <span className="site-footer-wordmark">STOP!</span>
      <p className="site-footer-copy">© {new Date().getFullYear()} STOP! CENTRAL DE JOGOS — EDUCAÇÃO GAMER</p>
      <div className="site-footer-links">
        <a href="#">Termos de Uso</a>
        <a href="#">Privacidade</a>
        <a href="#">Suporte</a>
      </div>
    </footer>
  );
}
