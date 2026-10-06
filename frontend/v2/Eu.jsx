import { irParaPagina, linkDaPagina } from "./App.jsx";
import { sair } from "./api.js";
import Moldura from "./Moldura.jsx";
import PainelJogador from "./PainelJogador.jsx";
import Perfil from "./Perfil.jsx";
import { trocarParaClassica } from "../src/utils/versaoSite.js";

// EU — o meu canto: resumo (patente do mês, próximo título, próxima peça),
// atalhos da conta e, embaixo, o meu perfil completo (títulos, conquistas,
// patentes). Abre em ?pagina=jogador&id=<eu> (o mesmo endereço de antes).
export default function Eu({ usuario }) {
  const admin = usuario.role === "ADMIN" || usuario.role === "MODERATOR";
  const ir = (pagina) => (e) => { e.preventDefault(); irParaPagina(pagina); };
  return (
    <Moldura usuario={usuario}>
      <PainelJogador usuario={usuario} />
      <nav className="v2-cartao v2-eu-atalhos" aria-label="Minha conta">
        <a href={linkDaPagina("editar-perfil")} onClick={ir("editar-perfil")}>Editar avatar e perfil <span aria-hidden="true">→</span></a>
        <a href={linkDaPagina("novidades")} onClick={ir("novidades")}>Novidades do site <span aria-hidden="true">→</span></a>
        {admin && <a href={linkDaPagina("admin")} onClick={ir("admin")}>Painel Admin <span aria-hidden="true">→</span></a>}
        <button type="button" onClick={() => trocarParaClassica()}>Versão clássica do site</button>
        <button type="button" className="v2-eu-sair" onClick={() => { if (confirm("Sair da conta?")) { sair(); window.location.reload(); } }}>Sair da conta</button>
      </nav>
      <Perfil usuario={usuario} userId={usuario.id} embutido />
    </Moldura>
  );
}
