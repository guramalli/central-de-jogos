import { useEffect, useState } from "react";
import { buscarPerfil, perfilEmCache } from "./perfil.js";
import { iniciais, corDoJogador } from "./temas.js";

// Foto do jogador. Sem foto: bolinha colorida com as iniciais.
// Na v2 a foto aparece SEMPRE — o título escolhido fica só no hover do nick
// (a opção "medalha no lugar da foto" do clássico não vale aqui).
export default function Avatar({ userId, nickname, tamanho = 40, borda = false }) {
  const [perfil, setPerfil] = useState(() => perfilEmCache(userId));
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    let vivo = true;
    buscarPerfil(userId).then((p) => vivo && p && setPerfil(p));
    return () => { vivo = false; };
  }, [userId]);

  const src = perfil?.avatarUrl;
  const estilo = {
    width: tamanho,
    height: tamanho,
    fontSize: Math.round(tamanho * 0.36),
    background: src && !falhou ? "#22164d" : corDoJogador(userId),
  };

  return (
    <span className={`v2-avatar-foto ${borda ? "com-borda" : ""}`} style={estilo}>
      {src && !falhou ? (
        <img src={src} alt="" onError={() => setFalhou(true)} />
      ) : (
        iniciais(nickname)
      )}
    </span>
  );
}
