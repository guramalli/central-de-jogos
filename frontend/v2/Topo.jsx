import { useEffect, useRef, useState } from "react";
import { api, sair, novoSocket } from "./api.js";
import { irParaPagina, linkDaPagina } from "./App.jsx";
import Avatar from "./Avatar.jsx";
import { ConviteRecebido } from "./Convites.jsx";

// Cabeçalho comum das páginas da v2 (menos as salas, que têm o seu).
// Também mantém a conexão de "presença": sem ela a pessoa aparece OFFLINE
// pros amigos enquanto navega, e não recebe convite de sala.
const ITENS = [
  { pagina: "inicio", rotulo: "Início" },
  { pagina: "jogar", rotulo: "Jogar" },
  { pagina: "ranking", rotulo: "Ranking" },
  { pagina: "missoes", rotulo: "Missões" },
  { pagina: "amigos", rotulo: "Amigos" },
  { pagina: "clas", rotulo: "Clãs" },
  { pagina: "patentes", rotulo: "Patentes" },
];
const NO_CELULAR = ["inicio", "jogar", "ranking", "amigos", "missoes"];

const hrefDe = (pagina) => (pagina === "inicio" ? "/v2/" : linkDaPagina(pagina));
const ir = (e, pagina) => { e.preventDefault(); irParaPagina(pagina === "inicio" ? null : pagina); };

export default function Topo({ usuario, ativo = null }) {
  const [socket, setSocket] = useState(null);
  const [maisAberto, setMaisAberto] = useState(false);
  const [naoLidas, setNaoLidas] = useState(0);

  useEffect(() => {
    const s = novoSocket();
    s.connect();
    setSocket(s);
    return () => { s.removeAllListeners(); s.disconnect(); };
  }, []);

  // Mensagens não lidas: bolinha vermelha em "Amigos".
  useEffect(() => {
    let vivo = true;
    const contar = () => {
      if (document.hidden) return;
      api.get("/friends/conversas")
        .then(({ data }) => vivo && setNaoLidas((data || []).reduce((n, c) => n + (c.naoLidas || 0), 0)))
        .catch(() => {});
    };
    contar();
    const t = setInterval(contar, 30000);
    window.addEventListener("v2-mensagens-lidas", contar);
    return () => { vivo = false; clearInterval(t); window.removeEventListener("v2-mensagens-lidas", contar); };
  }, []);

  return (
    <>
      <header className="v2-topo">
        <a className="v2-logo" href="/v2/" onClick={(e) => ir(e, "inicio")}>
          <span className="v2-logo-icone" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="11" rx="5" /><path d="M7 11v3M5.5 12.5h3" /><circle cx="16" cy="11.5" r="0.8" /><circle cx="18" cy="13.5" r="0.8" /></svg>
          </span>
          educação<span className="v2-destaque"> gamer</span>
          <span className="v2-selo-beta">v2 beta</span>
        </a>
        <nav className="v2-menu" aria-label="Site">
          {ITENS.map((it) => (
            <a
              key={it.pagina}
              href={hrefDe(it.pagina)}
              className={ativo === it.pagina ? "ativo" : ""}
              aria-current={ativo === it.pagina ? "page" : undefined}
              onClick={(e) => ir(e, it.pagina)}
            >
              {it.rotulo}
              {it.pagina === "amigos" && naoLidas > 0 && <span className="v2-bolinha-contador" aria-label={`${naoLidas} mensagens não lidas`}>{naoLidas}</span>}
            </a>
          ))}
        </nav>
        <div className="v2-topo-dir">
          <BuscaJogador />
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
        {ITENS.filter((it) => NO_CELULAR.includes(it.pagina)).map((it) => (
          <a key={it.pagina} href={hrefDe(it.pagina)} className={ativo === it.pagina ? "ativo" : ""} onClick={(e) => ir(e, it.pagina)}>
            <span className="v2-menu-icone">
              <IconeMenu nome={it.pagina} />
              {it.pagina === "amigos" && naoLidas > 0 && <span className="v2-bolinha-contador">{naoLidas}</span>}
            </span>
            {it.rotulo}
          </a>
        ))}
        <button className={maisAberto ? "ativo" : ""} onClick={() => setMaisAberto((v) => !v)} aria-expanded={maisAberto}>
          <span className="v2-menu-icone"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg></span>
          Mais
        </button>
      </nav>
      {maisAberto && (
        <div className="v2-mais-fundo" onClick={() => setMaisAberto(false)}>
          <nav className="v2-mais" aria-label="Mais páginas" onClick={(e) => e.stopPropagation()}>
            {[["clas", "Clãs"], ["patentes", "Patentes"], ["hall", "Hall da Fama"], ["novidades", "Novidades"], ["editar-perfil", "Meu perfil"]].map(([pg, r]) => (
              <a key={pg} href={linkDaPagina(pg)} onClick={(e) => { setMaisAberto(false); ir(e, pg); }}>{r}</a>
            ))}
            <a href="/">Site clássico</a>
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
  if (nome === "inicio") return <svg {...p}><path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z" /></svg>;
  if (nome === "ranking") return <svg {...p}><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4zM17 6h3v2a3 3 0 01-3 3M7 6H4v2a3 3 0 003 3" /></svg>;
  if (nome === "missoes") return <svg {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.2" /></svg>;
  if (nome === "amigos") return <svg {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0113 0M16 4.5a3.5 3.5 0 010 7M18 14a6 6 0 013.5 6" /></svg>;
  return <svg {...p}><polygon points="7 4 20 12 7 20 7 4" /></svg>;
}
