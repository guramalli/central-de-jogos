import { useEffect, useState } from "react";
import { sair, novoSocket } from "./api.js";
import { irPara, irParaPagina, linkDaPagina } from "./App.jsx";
import Avatar from "./Avatar.jsx";
import { ConviteRecebido } from "./Convites.jsx";

// Cabeçalho comum das páginas da v2 (menos a sala, que tem o seu).
// Também mantém a conexão de "presença": sem ela a pessoa aparece OFFLINE
// pros amigos enquanto navega, e não recebe convite de sala.
const ITENS = [
  { pagina: null, rotulo: "Jogar" },
  { pagina: "ranking", rotulo: "Ranking" },
  { pagina: "missoes", rotulo: "Missões" },
  { pagina: "patentes", rotulo: "Patentes" },
  { href: "/amigos", rotulo: "Amigos" },
  { href: "/cla", rotulo: "Clãs" },
];

export default function Topo({ usuario, ativo = null }) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const s = novoSocket();
    s.connect();
    setSocket(s);
    return () => { s.removeAllListeners(); s.disconnect(); };
  }, []);

  const ir = (e, pagina) => {
    e.preventDefault();
    if (pagina) irParaPagina(pagina); else irPara(null);
  };

  return (
    <>
      <header className="v2-topo">
        <a className="v2-logo" href="/v2/" onClick={(e) => ir(e, null)}>
          <span className="v2-logo-icone" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="11" rx="5" /><path d="M7 11v3M5.5 12.5h3" /><circle cx="16" cy="11.5" r="0.8" /><circle cx="18" cy="13.5" r="0.8" /></svg>
          </span>
          educação<span className="v2-destaque"> gamer</span>
          <span className="v2-selo-beta">v2 beta</span>
        </a>
        <nav className="v2-menu" aria-label="Site">
          {ITENS.map((it) =>
            it.href ? (
              <a key={it.rotulo} href={it.href}>{it.rotulo}</a>
            ) : (
              <a
                key={it.rotulo}
                href={it.pagina ? linkDaPagina(it.pagina) : "/v2/"}
                className={ativo === (it.pagina || "jogar") ? "ativo" : ""}
                aria-current={ativo === (it.pagina || "jogar") ? "page" : undefined}
                onClick={(e) => ir(e, it.pagina)}
              >
                {it.rotulo}
              </a>
            )
          )}
        </nav>
        <div className="v2-topo-dir">
          <a className="v2-link-classico" href="/">site clássico</a>
          <a href={linkDaPagina("jogador", { id: usuario.id })} onClick={(e) => { e.preventDefault(); irParaPagina("jogador", { id: usuario.id }); }} className="v2-topo-avatar" title="Meu perfil">
            <Avatar userId={usuario.id} nickname={usuario.nickname} tamanho={44} borda />
          </a>
          <button className="v2-sair" title="Sair da conta" aria-label="Sair da conta" onClick={() => { if (confirm("Sair da conta?")) { sair(); window.location.reload(); } }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></svg>
          </button>
        </div>
      </header>

      {/* Menu do celular: barra fixa embaixo, no dedão. */}
      <nav className="v2-menu-celular" aria-label="Menu">
        {ITENS.slice(0, 4).map((it) => (
          <a
            key={it.rotulo}
            href={it.pagina ? linkDaPagina(it.pagina) : "/v2/"}
            className={ativo === (it.pagina || "jogar") ? "ativo" : ""}
            onClick={(e) => ir(e, it.pagina)}
          >
            <IconeMenu nome={it.pagina || "jogar"} />
            {it.rotulo}
          </a>
        ))}
      </nav>
      <ConviteRecebido socket={socket} />
    </>
  );
}

function IconeMenu({ nome }) {
  const p = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round" };
  if (nome === "ranking") return <svg {...p}><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4zM17 6h3v2a3 3 0 01-3 3M7 6H4v2a3 3 0 003 3" /></svg>;
  if (nome === "missoes") return <svg {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.2" /></svg>;
  if (nome === "patentes") return <svg {...p}><path d="M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.3 6.8 19.1l1-5.8L3.5 9.2l5.9-.8z" /></svg>;
  return <svg {...p}><polygon points="7 4 20 12 7 20 7 4" /></svg>;
}
