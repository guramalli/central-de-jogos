// Card de destaque do Lenda do Campinho — o RPG de futebol, carro-chefe do site.
//
// É um <a> comum (sem irParaPagina): o jogo é uma página à parte, fora do
// React, servida de public/lenda-do-campinho/. Mesmo endereço do site = o
// jogo enxerga a sessão (eg_token / eg_user) e manda os bugs pra rota de
// feedback que já existe.
//
// `publico`: na entrada pública o card lembra que dá pra jogar sem cadastro.
export default function LendaDestaque({ publico = false }) {
  return (
    <a className="v2-lenda" href="/lenda-do-campinho/">
      <span className="v2-lenda-selos"><b className="v2-lenda-novo">Novo</b><b className="v2-lenda-beta">Beta</b></span>
      <img className="v2-lenda-logo" src="/lenda-do-campinho/a/logo_jogo.webp" alt="Lenda do Campinho" />
      <div className="v2-lenda-texto">
        <span className="v2-lenda-sobre">O RPG de futebol do Educação Gamer</span>
        <h2>Lenda do Campinho</h2>
        <p>
          Nasça na Vila do Campinho, treine desde criança e vire uma lenda do futebol mundial.
          Dribles, arenas de chefões, itens míticos, casa própria, montarias e um time pra levar
          até o Mundial.
        </p>
        <ul className="v2-lenda-lista">
          <li>⚽ Mais de 150 níveis</li>
          <li>🏟️ Arenas de chefões</li>
          <li>🏠 Casa própria</li>
          <li>📱 Joga no celular</li>
        </ul>
        <span className="v2-lenda-cta">Jogar agora →</span>
        {publico && <small className="v2-lenda-obs">Dá pra jogar sem cadastro. Com conta, você manda bugs direto pra equipe.</small>}
      </div>
    </a>
  );
}
