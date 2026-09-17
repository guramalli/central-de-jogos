import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";

// BUSCA DE JOGADORES — digita o nick, clica, abre o perfil.
//
// Antes só dava pra chegar num perfil clicando no nick de alguém que estava
// na mesma sala ou no ranking. Quem quisesse ver o perfil de um adversário de
// ontem não tinha caminho nenhum.
//
// A busca é feita com atraso (300ms depois da última tecla): sem isso, cada
// letra digitada vira uma consulta ao banco — "guramalli" seriam nove idas
// pro Neon, que cobra por tempo acordado.
export default function BuscarJogador({ aoFechar = null }) {
  const [termo, setTermo] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [buscouAlgo, setBuscouAlgo] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const texto = termo.trim();
    if (texto.length < 2) {
      setResultados([]);
      setBuscouAlgo(false);
      return;
    }

    let vivo = true;
    setBuscando(true);
    const timer = setTimeout(() => {
      api
        .get(`/users/buscar?q=${encodeURIComponent(texto)}`)
        .then(({ data }) => {
          if (!vivo) return;
          setResultados(Array.isArray(data) ? data : []);
          setBuscouAlgo(true);
        })
        .catch(() => vivo && setResultados([]))
        .finally(() => vivo && setBuscando(false));
    }, 300);

    return () => {
      vivo = false;
      clearTimeout(timer);
    };
  }, [termo]);

  function abrirPerfil(userId) {
    navigate(`/jogador/${userId}`);
    aoFechar?.();
  }

  return (
    <div className="buscar-jogador">
      <input
        ref={inputRef}
        className="buscar-jogador-input"
        placeholder="Procurar jogador pelo nick..."
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
        maxLength={30}
        autoComplete="off"
        onKeyDown={(e) => {
          // Enter abre o primeiro resultado: quem digitou o nick inteiro não
          // precisa tirar a mão do teclado pra clicar.
          if (e.key === "Enter" && resultados[0]) abrirPerfil(resultados[0].id);
          if (e.key === "Escape") aoFechar?.();
        }}
      />

      {termo.trim().length >= 2 && (
        <div className="buscar-jogador-lista">
          {buscando && <p className="buscar-jogador-vazio">procurando...</p>}

          {!buscando && buscouAlgo && resultados.length === 0 && (
            <p className="buscar-jogador-vazio">Nenhum jogador com esse nick.</p>
          )}

          {!buscando &&
            resultados.map((j) => (
              <button
                key={j.id}
                className="buscar-jogador-item"
                onClick={() => abrirPerfil(j.id)}
              >
                {j.avatarUrl ? (
                  <img src={j.avatarUrl} alt="" className="buscar-jogador-foto" />
                ) : (
                  <span className="buscar-jogador-foto buscar-jogador-foto-vazia">
                    {j.nickname.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span>{j.nickname}</span>
              </button>
            ))}
        </div>
      )}

      {termo.trim().length === 1 && (
        <p className="buscar-jogador-vazio">Digite pelo menos 2 letras.</p>
      )}
    </div>
  );
}
