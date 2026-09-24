import { useEffect, useState } from "react";
import { api } from "./api.js";
import { useCatalogoAvatar, motivoDe } from "./avatarCatalogo.js";
import { MiniaturaPeca, useBonecoNaBolinha } from "./AvatarBoneco.jsx";

// Vitrine do perfil: todas as peças do avatar, vestidas no corpo do dono do
// perfil — as conquistadas em cor, as trancadas apagadas e com cadeado.
// Hover ou toque: a trancada mostra a dica de como ganhar; a conquistada,
// COMO foi ganha (o `motivo` do catálogo; coroas e troféus com os meses
// em que a pessoa foi campeã).
// Uma busca só (GET /api/avatar/colecao/:id, cache de 60s no servidor), e
// só nesta página — nunca no hover do nick.
export default function ColecaoAvatar({ userId }) {
  const catalogo = useCatalogoAvatar();
  const [liberados, setLiberados] = useState(null);
  const [campeonatos, setCampeonatos] = useState({});
  const [dica, setDica] = useState(null); // peça tocada: { item, ok }
  // O corpo (pele) do dono do perfil, pras miniaturas.
  const corpo = useBonecoNaBolinha(userId, true);

  useEffect(() => {
    let vivo = true;
    setLiberados(null);
    api.get(`/avatar/colecao/${userId}`)
      .then(({ data }) => { if (!vivo) return; setLiberados(new Set(data.liberados)); setCampeonatos(data.campeonatos || {}); })
      .catch(() => vivo && setLiberados(new Set()));
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
              className={`v2-colecao-peca raridade-${item.raridade || "base"} ${ok ? "" : "trancada"} ${dica?.item.id === item.id ? "ativa" : ""}`}
              title={ok ? `${item.nome} — ${motivoDe(item, campeonatos)}` : `${item.nome} — ${item.dica}`}
              aria-label={ok ? `${item.nome}, conquistada: ${motivoDe(item, campeonatos)}` : `${item.nome}, trancada: ${item.dica}`}
              onClick={() => setDica({ item, ok })}
            >
              <span className="v2-avatar-miniatura">
                <MiniaturaPeca item={item} tamanho={52} corpo={corpo} />
                {!ok && <span className="v2-avatar-cadeado" aria-hidden="true">🔒</span>}
              </span>
            </button>
          );
        })}
      </div>
      <p className="v2-avatar-dica" role="status">{dica ? (dica.ok ? <>✔ <b>{dica.item.nome}</b>: {motivoDe(dica.item, campeonatos)}</> : <>🔒 <b>{dica.item.nome}</b>: {dica.item.dica}</>) : " "}</p>
    </section>
  );
}
