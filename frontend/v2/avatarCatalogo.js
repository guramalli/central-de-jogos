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

// Enquadramento da miniatura de cada parte (pixels da tela 900×1200), usado
// no editor e na coleção do perfil: um chapéu visto no corpo inteiro ficaria
// minúsculo. Ajustar junto com a arte.
const CORPO_TODO = { x: -150, y: 0, lado: 1200 };
export const ENQUADRAMENTO = {
  pele: CORPO_TODO,
  cabelo: { x: 230, y: 150, lado: 440 },
  chapeu: { x: 230, y: 90, lado: 440 },
  rosto: { x: 260, y: 230, lado: 380 },
  pescoco: { x: 270, y: 480, lado: 360 },
  roupa: { x: 190, y: 520, lado: 520 },
  parteDeBaixo: { x: 220, y: 760, lado: 460 },
  costas: CORPO_TODO,
  mao: CORPO_TODO,
  fundo: CORPO_TODO,
};

export function useCatalogoAvatar() {
  const [c, setC] = useState(catalogo);
  useEffect(() => {
    let vivo = true;
    catalogoAvatar().then((novo) => vivo && novo && setC(novo));
    return () => { vivo = false; };
  }, []);
  return c;
}
