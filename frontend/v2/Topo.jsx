import DicaNova, { marcarDicaVista } from "./DicaNova.jsx";
import { useEffect, useState } from "react";
import { api, socketDoPortal } from "./api.js";
import { irParaPagina, lerLocal, linkDaPagina } from "./App.jsx";
import Avatar from "./Avatar.jsx";
import BuscaJogador from "./BuscaJogador.jsx";
import { ConviteRecebido } from "./Convites.jsx";
import { SECOES, contadorDaSecao, secaoDaPagina } from "./navegacao.js";

// Cabeçalho comum das páginas da v2 (menos as salas, que têm o seu).
// Também usa a conexão de "presença" (a do portal, em api.js, que não fecha
// ao trocar de página): sem ela a pessoa aparece OFFLINE pros amigos
// enquanto navega, e não recebe convite de sala.
// Navegação em 5 seções, as MESMAS no topo do computador e na barra de baixo
// do celular (sem "Mais"). A seção marcada sai do endereço (secaoDaPagina),
// não de quem chama o Topo. No computador, "Eu" é o avatar no canto.

const PAGINA_DA_SECAO = { competir: "ranking", social: "amigos", missoes: "missoes" };
const hrefDaSecao = (chave, usuario) =>
  chave === "jogar" ? "/v2/" : chave === "eu" ? linkDaPagina("jogador", { id: usuario.id }) : linkDaPagina(PAGINA_DA_SECAO[chave]);
const irSecao = (e, chave, usuario) => {
  e.preventDefault();
  if (chave === "jogar") irParaPagina(null);
  else if (chave === "eu") { marcarDicaVista("perfil"); irParaPagina("jogador", { id: usuario.id }); }
  else irParaPagina(PAGINA_DA_SECAO[chave]);
};

export default function Topo({ usuario }) {
  const [socket, setSocket] = useState(null);
  const [avisos, setAvisos] = useState({});

  // Só pega a conexão do portal; o ouvinte do convite (ConviteRecebido) se
  // desliga sozinho ao desmontar. Não desconecta: a conexão é da aba.
  useEffect(() => {
    setSocket(socketDoPortal());
  }, []);

  // Contadores (mesma rota e mesmo ritmo do clássico): pedidos de amizade +
  // mensagens + pedidos do clã em Social, missões pra resgatar em Missões.
  useEffect(() => {
    let vivo = true;
    const buscar = () => {
      if (document.hidden) return;
      api.get("/avisos").then(({ data }) => vivo && setAvisos(data || {})).catch(() => {});
    };
    buscar();
    const t = setInterval(buscar, 120000);
    window.addEventListener("v2-mensagens-lidas", buscar);
    return () => { vivo = false; clearInterval(t); window.removeEventListener("v2-mensagens-lidas", buscar); };
  }, []);

  const secao = secaoDaPagina(lerLocal(), usuario.id);
  const marca = (chave) => ({ className: secao === chave ? "ativo" : "", "aria-current": secao === chave ? "page" : undefined });

  return (
    <>
      <header className="v2-topo">
        <a className="v2-logo" href="/v2/" onClick={(e) => irSecao(e, "jogar", usuario)}>
          <img src="/educacao-gamer-logo.png" alt="Educação Gamer" className="v2-logo-img" />
          <span className="v2-selo-beta">beta</span>
        </a>
        <nav className="v2-menu" aria-label="Site">
          {SECOES.filter((s) => s.chave !== "eu").map((s) => {
            const n = contadorDaSecao(s.chave, avisos);
            return (
              <a key={s.chave} href={hrefDaSecao(s.chave, usuario)} {...marca(s.chave)} onClick={(e) => irSecao(e, s.chave, usuario)}>
                {s.rotulo}
                {n > 0 && <span className="v2-bolinha-contador">{n}</span>}
              </a>
            );
          })}
        </nav>
        <div className="v2-topo-dir">
          <BuscaJogador />
          <a href={hrefDaSecao("eu", usuario)} onClick={(e) => irSecao(e, "eu", usuario)} className={`v2-topo-avatar ${secao === "eu" ? "ativo" : ""}`} aria-current={secao === "eu" ? "page" : undefined} title="Eu: perfil, avatar, novidades e conta">
            <Avatar userId={usuario.id} nickname={usuario.nickname} tamanho={44} borda />
            <span className="v2-topo-nick">{usuario.nickname}<small>eu</small></span>
            <DicaNova chave="perfil" texto="Aqui é você! Toque pra ver seu perfil, editar o avatar, ler as novidades e sair da conta." lado="baixo-direita" />
          </a>
        </div>
      </header>

      {/* Celular: as 5 seções na barra fixa embaixo, no dedão. */}
      <nav className="v2-menu-celular" aria-label="Menu">
        {SECOES.map((s) => {
          const n = contadorDaSecao(s.chave, avisos);
          return (
            <a key={s.chave} href={hrefDaSecao(s.chave, usuario)} {...marca(s.chave)} onClick={(e) => irSecao(e, s.chave, usuario)}>
              <span className="v2-menu-icone">
                {s.chave === "eu" ? <Avatar userId={usuario.id} nickname={usuario.nickname} tamanho={24} /> : <IconeSecao nome={s.chave} />}
                {n > 0 && <span className="v2-bolinha-contador">{n}</span>}
              </span>
              {s.rotulo}
            </a>
          );
        })}
      </nav>
      <ConviteRecebido socket={socket} />
    </>
  );
}

function IconeSecao({ nome }) {
  const p = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round" };
  if (nome === "competir") return <svg {...p}><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4zM17 6h3v2a3 3 0 01-3 3M7 6H4v2a3 3 0 003 3" /></svg>;
  if (nome === "social") return <svg {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0113 0M16 4.5a3.5 3.5 0 010 7M18 14a6 6 0 013.5 6" /></svg>;
  if (nome === "missoes") return <svg {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.2" /></svg>;
  return <svg {...p}><rect x="2" y="7" width="20" height="11" rx="5" /><path d="M7 11v3M5.5 12.5h3M15.5 12h.01M18 13.5h.01" /></svg>;
}
