import { useEffect, useState } from "react";
import { useCatalogoAvatar } from "./avatarCatalogo.js";
import { MiniaturaPeca } from "./AvatarBoneco.jsx";
import { compartilharPeca } from "./cartaoPeca.js";

// Aviso "Nova peça desbloqueada!" com botão de compartilhar.
//
// Como sabe que é NOVA: guarda no navegador (por conta) os ids que a pessoa
// já viu liberados. Na primeira vez não avisa nada — só anota; senão todo
// mundo receberia o aviso de todas as peças iniciais. Depois, o que aparecer
// liberado e não estiver na lista vira aviso (uma vez só: já anota na hora).
// Sem localStorage (aba anônima, bloqueado), simplesmente não avisa.
const chave = (id) => `eg_avatar_vistos:${id}`;

function novasPecas(usuarioId, liberados) {
  try {
    const guardado = localStorage.getItem(chave(usuarioId));
    localStorage.setItem(chave(usuarioId), JSON.stringify(liberados));
    if (guardado === null) return [];
    const vistos = new Set(JSON.parse(guardado) || []);
    return liberados.filter((id) => !vistos.has(id));
  } catch {
    return [];
  }
}

// `campeonatos` (de /avatar/meu): o mês da plaqueta de um troféu novo no
// cartão de compartilhar.
export default function AvisoPecaNova({ usuarioId, liberados, config, campeonatos }) {
  const catalogo = useCatalogoAvatar();
  const [novas, setNovas] = useState([]);
  const [gerando, setGerando] = useState(false);

  useEffect(() => {
    if (usuarioId && Array.isArray(liberados)) setNovas(novasPecas(usuarioId, liberados));
  }, [usuarioId, liberados]);

  const item = catalogo?.porId.get(novas[0]);
  if (!item) return null;
  const mais = novas.length - 1;

  async function compartilhar() {
    setGerando(true);
    try { await compartilharPeca({ catalogo, config, item, campeonatos }); } finally { setGerando(false); }
  }

  return (
    <div className="v2-peca-nova" role="status">
      <span className="v2-avatar-miniatura"><MiniaturaPeca item={item} corpo={config} /></span>
      <div className="v2-peca-nova-texto">
        <b>Nova peça desbloqueada: {item.nome}!</b>
        {mais > 0 && <small>e mais {mais} {mais === 1 ? "peça" : "peças"} — veja no editor do avatar</small>}
      </div>
      <button className="v2-botao-pequeno" onClick={compartilhar} disabled={gerando}>{gerando ? "Gerando…" : "Compartilhar"}</button>
      <button className="v2-peca-nova-fechar" onClick={() => setNovas([])} aria-label="Fechar aviso">×</button>
    </div>
  );
}
