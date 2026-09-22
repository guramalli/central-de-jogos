import DicaNova, { marcarDicaVista } from "./DicaNova.jsx";
import { useEffect, useRef, useState } from "react";
import { api, sair, novoSocket } from "./api.js";
import { irParaPagina, linkDaPagina } from "./App.jsx";
import Avatar from "./Avatar.jsx";
import { ConviteRecebido } from "./Convites.jsx";
import { trocarParaClassica } from "../src/utils/versaoSite.js";

// Cabeçalho comum das páginas da v2 (menos as salas, que têm o seu).
// Também mantém a conexão de "presença": sem ela a pessoa aparece OFFLINE
// pros amigos enquanto navega, e não recebe convite de sala.
// Mesmos itens e mesma ordem do menu do site clássico (src/App.jsx).
// "jogo" = lobby daquele jogo; os contadores vêm da rota /avisos.
const ITENS = [
  { chave: "inicio", rotulo: "Lobby" },
  { chave: "stop", rotulo: "Stop", jogo: "stop" },
  { chave: "quiz", rotulo: "Quiz", jogo: "quiz" },
  { chave: "acromania", rotulo: "Acromania", jogo: "acromania" },
  { chave: "ranking", rotulo: "Ranking" },
  { chave: "hall", rotulo: "Hall da Fama" },
  { chave: "missoes", rotulo: "Missões", aviso: "missoes" },
  { chave: "clas", rotulo: "Clã", aviso: "cla" },
  { chave: "amigos", rotulo: "Amigos", aviso: "amigos" },
];
// Barra de baixo do celular: Lobby e os três jogos. Amigos (e o resto) ficam
// no "Mais" — e a bolinha de avisos de Amigos aparece no próprio "Mais".
const NO_CELULAR = ["inicio", "stop", "quiz", "acromania"];

const hrefDe = (it) =>
  it.chave === "inicio" ? "/v2/" : it.jogo ? linkDaPagina("jogar", { jogo: it.jogo }) : linkDaPagina(it.chave);
const irItem = (e, it) => {
  e.preventDefault();
  if (it.chave === "inicio") irParaPagina(null);
  else if (it.jogo) irParaPagina("jogar", { jogo: it.jogo });
  else irParaPagina(it.chave);
};
const ir = (e, pagina) => { e.preventDefault(); irParaPagina(pagina === "inicio" ? null : pagina); };

export default function Topo({ usuario, ativo = null }) {
  const [socket, setSocket] = useState(null);
  const [maisAberto, setMaisAberto] = useState(false);
  const [avisos, setAvisos] = useState({});
  const [acroAtivo, setAcroAtivo] = useState(true);

  useEffect(() => {
    const s = novoSocket();
    s.connect();
    setSocket(s);
    return () => { s.removeAllListeners(); s.disconnect(); };
  }, []);

  // Contadores do menu (mesma rota e mesmo ritmo do clássico): pedidos de
  // amizade + mensagens em "Amigos", missões pra resgatar, pedidos do clã.
  useEffect(() => {
    let vivo = true;
    const buscar = () => {
      if (document.hidden) return;
      api.get("/avisos").then(({ data }) => vivo && setAvisos(data || {})).catch(() => {});
    };
    buscar();
    const t = setInterval(buscar, 120000);
    window.addEventListener("v2-mensagens-lidas", buscar);
    api.get("/acromania-rooms").then(({ data }) => vivo && setAcroAtivo(Array.isArray(data) ? true : data.ativo !== false)).catch(() => {});
    return () => { vivo = false; clearInterval(t); window.removeEventListener("v2-mensagens-lidas", buscar); };
  }, []);

  const contador = (it) => (it.aviso === "amigos" ? (avisos.amigos || 0) + (avisos.mensagens || 0) : it.aviso ? avisos[it.aviso] || 0 : 0);
  const itens = ITENS.filter((it) => it.chave !== "acromania" || acroAtivo);
  const admin = usuario.role === "ADMIN" || usuario.role === "MODERATOR";

  return (
    <>
      <header className="v2-topo">
        <a className="v2-logo" href="/v2/" onClick={(e) => ir(e, "inicio")}>
          <img src="/educacao-gamer-logo.png" alt="Educação Gamer" className="v2-logo-img" />
          <span className="v2-selo-beta">beta</span>
        </a>
        <nav className="v2-menu" aria-label="Site">
          {itens.map((it) => (
            <a
              key={it.chave}
              href={hrefDe(it)}
              className={ativo === it.chave ? "ativo" : ""}
              aria-current={ativo === it.chave ? "page" : undefined}
              onClick={(e) => irItem(e, it)}
            >
              {it.rotulo}
              {contador(it) > 0 && <span className="v2-bolinha-contador">{contador(it)}</span>}
            </a>
          ))}
          {admin && <a href={linkDaPagina("admin")} className={ativo === "admin" ? "ativo" : ""} onClick={(e) => { e.preventDefault(); irParaPagina("admin"); }}>Painel Admin</a>}
        </nav>
        <div className="v2-topo-dir">
          <BuscaJogador />
          {/* Volta pro site clássico, na MESMA página (a escolha fica guardada). */}
          <button type="button" className="v2-troca-versao" onClick={() => trocarParaClassica()} title="Voltar para a versão clássica do site">Versão clássica</button>
                    <a href={linkDaPagina("jogador", { id: usuario.id })} onClick={(e) => { e.preventDefault(); marcarDicaVista("perfil"); irParaPagina("jogador", { id: usuario.id }); }} className="v2-topo-avatar" title="Meu perfil, títulos e conquistas">
            <Avatar userId={usuario.id} nickname={usuario.nickname} tamanho={44} borda />
            <span className="v2-topo-nick">{usuario.nickname}<small>ver perfil</small></span>
            <DicaNova chave="perfil" texto="Aqui é você! Toque pra ver seu perfil, os títulos que já conquistou e sua patente em cada jogo." lado="baixo-direita" />
          </a>
          <button className="v2-sair" title="Sair da conta" aria-label="Sair da conta" onClick={() => { if (confirm("Sair da conta?")) { sair(); window.location.reload(); } }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></svg>
          </button>
        </div>
      </header>

      {/* Menu do celular: barra fixa embaixo, no dedão. */}
      <nav className="v2-menu-celular" aria-label="Menu">
        {itens.filter((it) => NO_CELULAR.includes(it.chave)).map((it) => (
          <a key={it.chave} href={hrefDe(it)} className={ativo === it.chave ? "ativo" : ""} onClick={(e) => irItem(e, it)}>
            <span className="v2-menu-icone">
              <IconeMenu nome={it.chave} />
              {contador(it) > 0 && <span className="v2-bolinha-contador">{contador(it)}</span>}
            </span>
            {it.rotulo}
          </a>
        ))}
        <button className={maisAberto ? "ativo" : ""} onClick={() => setMaisAberto((v) => !v)} aria-expanded={maisAberto}>
          <span className="v2-menu-icone">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg>
            {(() => { const n = itens.filter((it) => !NO_CELULAR.includes(it.chave)).reduce((t, it) => t + contador(it), 0); return n > 0 ? <span className="v2-bolinha-contador">{n}</span> : null; })()}
          </span>
          Mais
        </button>
      </nav>
      {maisAberto && (
        <div className="v2-mais-fundo" onClick={() => setMaisAberto(false)}>
          <nav className="v2-mais" aria-label="Mais páginas" onClick={(e) => e.stopPropagation()}>
            {itens.filter((it) => !NO_CELULAR.includes(it.chave)).map((it) => (
              <a key={it.chave} href={hrefDe(it)} onClick={(e) => { setMaisAberto(false); irItem(e, it); }}>
                {it.rotulo}
                {contador(it) > 0 && <span className="v2-bolinha-contador">{contador(it)}</span>}
              </a>
            ))}
            {admin && <a href={linkDaPagina("admin")} onClick={(e) => { setMaisAberto(false); e.preventDefault(); irParaPagina("admin"); }}>Painel Admin</a>}
            <a href={linkDaPagina("jogador", { id: usuario.id })} onClick={(e) => { setMaisAberto(false); e.preventDefault(); irParaPagina("jogador", { id: usuario.id }); }}>Meu perfil</a>
            <button className="v2-mais-classico" onClick={() => trocarParaClassica()}>Versão clássica do site</button>
            <button onClick={() => { if (confirm("Sair da conta?")) { sair(); window.location.reload(); } }}>Sair da conta</button>
          </nav>
        </div>
      )}
      <ConviteRecebido socket={socket} />
    </>
  );
}

// Busca de jogador por nick (mínimo 2 letras, até 12 resultados — mesma
// rota do clássico).
function BuscaJogador() {
  const [aberta, setAberta] = useState(false);
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState([]);
  const caixaRef = useRef(null);
  const campoRef = useRef(null);

  useEffect(() => {
    const t = texto.trim();
    if (t.length < 2) { setResultados([]); return; }
    let vivo = true;
    const espera = setTimeout(() => {
      api.get(`/users/buscar?q=${encodeURIComponent(t)}`)
        .then(({ data }) => vivo && setResultados(Array.isArray(data) ? data : []))
        .catch(() => vivo && setResultados([]));
    }, 250);
    return () => { vivo = false; clearTimeout(espera); };
  }, [texto]);

  useEffect(() => {
    if (!aberta) return;
    const fora = (e) => caixaRef.current && !caixaRef.current.contains(e.target) && setAberta(false);
    document.addEventListener("mousedown", fora);
    requestAnimationFrame(() => campoRef.current?.focus());
    return () => document.removeEventListener("mousedown", fora);
  }, [aberta]);

  return (
    <div className="v2-busca" ref={caixaRef}>
      <button className="v2-sair" aria-label="Buscar jogador" title="Buscar jogador" onClick={() => setAberta((a) => !a)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
      </button>
      {aberta && (
        <div className="v2-busca-caixa">
          <label htmlFor="v2-busca-campo" className="v2-oculto">Nick do jogador</label>
          <input id="v2-busca-campo" ref={campoRef} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Buscar jogador pelo nick…" autoComplete="off" />
          {texto.trim().length >= 2 && resultados.length === 0 && <div className="v2-busca-vazio">Ninguém encontrado.</div>}
          {resultados.map((r) => (
            <a key={r.id} className="v2-busca-item" href={linkDaPagina("jogador", { id: r.id })} onClick={(e) => { e.preventDefault(); setAberta(false); irParaPagina("jogador", { id: r.id }); }}>
              <Avatar userId={r.id} nickname={r.nickname} tamanho={30} />
              <span>{r.nickname}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function IconeMenu({ nome }) {
  const p = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round" };
  if (nome === "stop") return <svg {...p}><path d="M7 11V6a2 2 0 014 0v5M11 10V4a2 2 0 014 0v6M15 10V6a2 2 0 014 0v8a7 7 0 01-7 7h-1a7 7 0 01-6-3.5L3 13a2 2 0 013.3-2.2L7 12" /></svg>;
  if (nome === "quiz") return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 015 .5c0 1.5-2.5 2-2.5 3.5M12 17h.01" /></svg>;
  if (nome === "acromania") return <svg {...p}><path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" /></svg>;
  if (nome === "inicio") return <svg {...p}><path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z" /></svg>;
  if (nome === "ranking") return <svg {...p}><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4zM17 6h3v2a3 3 0 01-3 3M7 6H4v2a3 3 0 003 3" /></svg>;
  if (nome === "missoes") return <svg {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.2" /></svg>;
  if (nome === "amigos") return <svg {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0113 0M16 4.5a3.5 3.5 0 010 7M18 14a6 6 0 013.5 6" /></svg>;
  return <svg {...p}><polygon points="7 4 20 12 7 20 7 4" /></svg>;
}
