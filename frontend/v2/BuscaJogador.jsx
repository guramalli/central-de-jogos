import { useEffect, useRef, useState } from "react";
import { api } from "./api.js";
import { irParaPagina, linkDaPagina } from "./App.jsx";
import Avatar from "./Avatar.jsx";

// Busca de jogador por nick (mínimo 2 letras, até 12 resultados — mesma
// rota do clássico). No topo é uma lupa que abre a caixa; em Social
// (`fixa`) o campo fica sempre à mostra.
export default function BuscaJogador({ fixa = false }) {
  const [aberta, setAberta] = useState(fixa);
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
    if (!aberta || fixa) return;
    const fora = (e) => caixaRef.current && !caixaRef.current.contains(e.target) && setAberta(false);
    document.addEventListener("mousedown", fora);
    requestAnimationFrame(() => campoRef.current?.focus());
    return () => document.removeEventListener("mousedown", fora);
  }, [aberta, fixa]);

  const idCampo = fixa ? "v2-busca-campo-fixa" : "v2-busca-campo";
  return (
    <div className={fixa ? "v2-busca v2-busca-fixa" : "v2-busca"} ref={caixaRef}>
      {!fixa && (
        <button className="v2-sair" aria-label="Buscar jogador" title="Buscar jogador" onClick={() => setAberta((a) => !a)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
        </button>
      )}
      {aberta && (
        <div className="v2-busca-caixa">
          <label htmlFor={idCampo} className="v2-oculto">Nick do jogador</label>
          <input id={idCampo} ref={campoRef} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Buscar jogador pelo nick…" autoComplete="off" />
          {texto.trim().length >= 2 && resultados.length === 0 && <div className="v2-busca-vazio">Ninguém encontrado.</div>}
          {resultados.map((r) => (
            <a key={r.id} className="v2-busca-item" href={linkDaPagina("jogador", { id: r.id })} onClick={(e) => { e.preventDefault(); if (!fixa) setAberta(false); irParaPagina("jogador", { id: r.id }); }}>
              <Avatar userId={r.id} nickname={r.nickname} tamanho={30} />
              <span>{r.nickname}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
