import { useEffect, useState } from "react";
import { buscarPerfil, perfilEmCache } from "./perfil.js";
import { iniciais, corDoJogador } from "./temas.js";
import AvatarBoneco, { montagemNaBolinha } from "./AvatarBoneco.jsx";

// Foto do jogador. Sem foto: bolinha colorida com as iniciais.
// Na v2 a foto aparece SEMPRE — o título escolhido fica só no hover do nick
// (a opção "medalha no lugar da foto" do clássico não vale aqui).
//
// Avatar montado: quem escolheu "Avatar" pras bolinhas aparece com o busto
// do boneco no lugar da foto. `sempreBoneco` é pros lugares grandes (pódio,
// cartão do nick), onde o avatar aparece mesmo pra quem escolheu "Foto".
export default function Avatar({ userId, nickname, tamanho = 40, borda = false, sempreBoneco = false }) {
  const [perfil, setPerfil] = useState(() => perfilEmCache(userId));
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    let vivo = true;
    buscarPerfil(userId).then((p) => vivo && p && setPerfil(p));
    return () => { vivo = false; };
  }, [userId]);

  const boneco = montagemNaBolinha(perfil, sempreBoneco);
  const src = perfil?.avatarUrl;
  const estilo = {
    width: tamanho,
    height: tamanho,
    fontSize: Math.round(tamanho * 0.36),
    background: boneco || (src && !falhou) ? "#22164d" : corDoJogador(userId),
  };

  return (
    <span className={`v2-avatar-foto ${borda ? "com-borda" : ""}`} style={estilo}>
      {boneco ? (
        <AvatarBoneco config={boneco} busto tamanho={tamanho} preencher />
      ) : src && !falhou ? (
        <img src={src} alt="" onError={() => setFalhou(true)} />
      ) : (
        iniciais(nickname)
      )}
    </span>
  );
}
