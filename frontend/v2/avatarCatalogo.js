import { useEffect, useState } from "react";
import { api } from "./api.js";

// Catálogo das peças do avatar (GET /api/avatar/catalogo), baixado UMA vez
// por aba e compartilhado por todo boneco da tela — numa sala com 12
// jogadores seriam 12 buscas iguais.
//
// Uma cópia fica no navegador pra o boneco aparecer já no primeiro desenho
// (sem piscar a bolinha de iniciais); a busca de fundo atualiza se o
// catálogo mudou de versão.
const CHAVE = "eg_avatar_catalogo";
let catalogo = lerCopia();
let promessa = null;

function lerCopia() {
  try {
    const c = JSON.parse(localStorage.getItem(CHAVE) || "null");
    return c?.itens ? indexar(c) : null;
  } catch {
    return null;
  }
}

// Mapa id -> peça, pra achar a arte de cada slot sem varrer a lista.
function indexar(c) {
  return { ...c, porId: new Map(c.itens.map((i) => [i.id, i])) };
}

export function catalogoAvatar() {
  if (!promessa) {
    promessa = api
      .get("/avatar/catalogo")
      .then(({ data }) => {
        catalogo = indexar(data);
        try { localStorage.setItem(CHAVE, JSON.stringify(data)); } catch {}
        return catalogo;
      })
      .catch(() => {
        promessa = null; // tenta de novo no próximo boneco
        return catalogo;
      });
  }
  return promessa;
}

export function useCatalogoAvatar() {
  const [c, setC] = useState(catalogo);
  useEffect(() => {
    let vivo = true;
    catalogoAvatar().then((novo) => vivo && novo && setC(novo));
    return () => { vivo = false; };
  }, []);
  return c;
}
