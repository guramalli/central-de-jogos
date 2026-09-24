import { useEffect, useState } from "react";
import { api } from "./api.js";
import { useCatalogoAvatar } from "./avatarCatalogo.js";
import { MiniaturaPeca } from "./AvatarBoneco.jsx";

// Vitrine do perfil: todas as peças do avatar, as conquistadas em cor e as
// trancadas como silhueta escura, com a dica de como ganhar (hover ou toque).
// Uma busca só (GET /api/avatar/colecao/:id, cache de 60s no servidor), e
// só nesta página — nunca no hover do nick.
export default function ColecaoAvatar({ userId }) {
  const catalogo = useCatalogoAvatar();
  const [liberados, setLiberados] = useState(null);
  const [dica, setDica] = useState(null);

  useEffect(() => {
    let vivo = true;
    setLiberados(null);
    api.get(`/avatar/colecao/${userId}`).then(({ data }) => vivo && setLiberados(new Set(data.liberados))).catch(() => vivo && setLiberados(new Set()));
    return () => { vivo = false; };
  }, [userId]);

  if (!catalogo || !liberados) return null;
  const total = catalogo.itens.length;
  const tem = catalogo.itens.filter((i) => liberados.has(i.id)).length;

  return (
    <section className="v2-cartao v2-colecao">
      <div className="v2-colecao-cabeca">
        <h2>Coleção</h2>
        <span className="v2-colecao-contador"><b>{tem}</b> de {total} peças</span>
      </div>
      <div className="v2-missao-barra" aria-hidden="true"><div style={{ width: `${Math.round((tem / total) * 100)}%` }} /></div>
      <div className="v2-colecao-grade">
        {catalogo.itens.map((item) => {
          const ok = liberados.has(item.id);
          return (
            <button
              key={item.id}
              type="button"
              className={`v2-colecao-peca ${ok ? "" : "trancada"} ${dica?.id === item.id ? "ativa" : ""}`}
              title={ok ? item.nome : `${item.nome} — ${item.dica}`}
              aria-label={ok ? item.nome : `${item.nome}, trancada: ${item.dica}`}
              onClick={() => setDica(ok ? null : item)}
            >
              <span className="v2-avatar-miniatura"><MiniaturaPeca item={item} tamanho={52} /></span>
            </button>
          );
        })}
      </div>
      <p className="v2-avatar-dica" role="status">{dica ? <>🔒 <b>{dica.nome}</b>: {dica.dica}</> : " "}</p>
    </section>
  );
}
