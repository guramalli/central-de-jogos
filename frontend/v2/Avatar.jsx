import { useEffect, useState } from "react";
import { buscarPerfil, perfilEmCache } from "./perfil.js";
import { iniciais, corDoJogador } from "./temas.js";

// Foto do jogador (ou a medalha, se ele escolheu mostrar o título no lugar
// da foto). Sem foto: bolinha colorida com as iniciais.
export default function Avatar({ userId, nickname, tamanho = 40, borda = false }) {
  const [perfil, setPerfil] = useState(() => perfilEmCache(userId));
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    let vivo = true;
    buscarPerfil(userId).then((p) => vivo && p && setPerfil(p));
    return () => { vivo = false; };
  }, [userId]);

  const medalha = perfil?.medalhaNoLugarDaFoto && perfil?.tituloExibidoLogo;
  const src = medalha ? perfil.tituloExibidoLogo : perfil?.avatarUrl;
  const estilo = {
    width: tamanho,
    height: tamanho,
    fontSize: Math.round(tamanho * 0.36),
    background: src && !falhou ? (medalha ? "transparent" : "#22164d") : corDoJogador(userId),
  };

  return (
    <span className={`v2-avatar-foto ${borda ? "com-borda" : ""} ${medalha ? "medalha" : ""}`} style={estilo}>
      {src && !falhou ? (
        <img src={src} alt="" onError={() => setFalhou(true)} />
      ) : (
        iniciais(nickname)
      )}
    </span>
  );
}
