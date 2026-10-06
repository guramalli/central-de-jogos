// Card de destaque do Lenda do Campinho — o RPG de futebol, carro-chefe do site.
// Mesmo visual da vitrine do jogo (/lenda/): a arte da capa ao fundo com um
// véu indigo, o logo novo, selos de vidro e dois botões (jogar e conhecer).
//
// Os links são <a> comuns (sem irParaPagina): o jogo e a vitrine são páginas
// à parte, fora do React, servidas de public/. Mesmo endereço do site = o
// jogo enxerga a sessão (eg_token / eg_user). "Jogar" leva ?jogar=1: quem
// escolheu jogar daqui não é mandado pra vitrine antes.
//
// `publico`: na entrada pública o card lembra que dá pra jogar sem cadastro.
export default function LendaDestaque({ publico = false }) {
  return (
    <article className="v2-lenda">
      <div className="v2-lenda-arte" aria-hidden="true">
        <div className="v2-lenda-palco">
          <img src="/lenda/a/capa_card.webp" alt="" loading="lazy" decoding="async" width="1400" height="788" />
          <span className="v2-lenda-brilho" />
        </div>
      </div>
      <span className="v2-lenda-selos"><b className="v2-lenda-novo">Novo</b></span>
      <div className="v2-lenda-texto">
        <h2 className="v2-lenda-titulo">
          <img className="v2-lenda-logo" src="/lenda/a/logo.webp" alt="Lenda do Campinho" width="1006" height="640" loading="lazy" decoding="async" />
        </h2>
        <span className="v2-lenda-sobre">O RPG de futebol do Educação Gamer</span>
        <p>
          Nasça na Vila do Campinho, treine desde criança e vire uma lenda do futebol mundial.
          Dribles, arenas de chefões, itens míticos, casa própria, montarias e um time pra levar
          até o Mundial.
        </p>
        <ul className="v2-lenda-lista">
          <li>Mais de 150 níveis</li>
          <li>Arenas de chefões</li>
          <li>Casa própria</li>
          <li>Joga no celular</li>
        </ul>
        <div className="v2-lenda-acoes">
          <a className="v2-lenda-jogar" href="/lenda-do-campinho/?jogar=1">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l10.98-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14z" /></svg>
            Jogar grátis
          </a>
          <a className="v2-lenda-conhecer" href="/lenda/">Conheça o jogo</a>
        </div>
        {publico && <small className="v2-lenda-obs">Dá pra jogar sem cadastro. Com conta, você manda bugs direto pra equipe.</small>}
      </div>
    </article>
  );
}
