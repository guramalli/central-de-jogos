import { useEffect, useState } from "react";
import { buscarPerfil, perfilEmCache } from "./perfil.js";
import { iniciais, corDoJogador } from "./temas.js";
import AvatarBoneco, { montagemNaBolinha } from "./AvatarBoneco.jsx";

// Foto do jogador. Sem foto: bolinha colorida com as iniciais.
// Na v2 a foto aparece SEMPRE — o título escolhido fica só no hover do nick
// (a opção "medalha no lugar da foto" do clássico não vale aqui).
//
// Avatar montado (regra em montagemNaBolinha): quem escolheu "Avatar", ou
// não tem foto, aparece com a CABEÇA do boneco (legível até 28px).
// `sempreBoneco` é pros lugares grandes (pódio, cartão do nick): o avatar
// aparece sempre, em busto (cabeça e ombros).
export default function Avatar({ userId, nickname, tamanho = 40, borda = false, sempreBoneco = false }) {
  const [perfil, setPerfil] = useState(() => perfilEmCache(userId));
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    let vivo = true;
    buscarPerfil(userId).then((p) => vivo && p && setPerfil(p));
    return () => { vivo = false; };
  }, [userId]);

  const src = perfil?.avatarUrl;
  const fotoOk = !!src && !falhou;
  const boneco = montagemNaBolinha(perfil, sempreBoneco, fotoOk);
  const estilo = {
    width: tamanho,
    height: tamanho,
    fontSize: Math.round(tamanho * 0.36),
    background: boneco || fotoOk ? "#22164d" : corDoJogador(userId),
  };

  return (
    <span className={`v2-avatar-foto ${borda ? "com-borda" : ""}`} style={estilo}>
      {boneco ? (
        <AvatarBoneco config={boneco} busto={sempreBoneco ? "busto" : "cabeca"} tamanho={tamanho} preencher />
      ) : fotoOk ? (
        <img src={src} alt="" onError={() => setFalhou(true)} />
      ) : (
        iniciais(nickname)
      )}
    </span>
  );
}
