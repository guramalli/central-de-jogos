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
// Cópia de VERSAO_CATALOGO (backend/src/avatar/catalogo.js): vai no "?v="
// da busca, pra o cache HTTP do navegador (1h) não segurar um catálogo velho
// depois de uma mudança. Suba junto com a do backend.
export const VERSAO_CATALOGO = 8;
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
      .get("/avatar/catalogo", { params: { v: VERSAO_CATALOGO } })
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
// minúsculo. Medido na arte final: personagem de x ~160 a 740 e de y ~290
// (topo da cabeça) a ~1100 (pés); chapéus sobem até ~y 100.
export const ENQUADRAMENTO = {
  pele: { x: 25, y: 260, lado: 850 },
  cabelo: { x: 170, y: 200, lado: 560 },
  chapeu: { x: 130, y: 60, lado: 640 },
  rosto: { x: 250, y: 380, lado: 400 },
  pescoco: { x: 270, y: 590, lado: 360 },
  roupa: { x: 140, y: 580, lado: 620 },
  parteDeBaixo: { x: 250, y: 775, lado: 400 },
  costas: { x: 60, y: 300, lado: 780 },
  // Os objetos ficam na mão direita do boneco (lado direito da tela); na
  // mão esquerda, espelhados, do lado esquerdo (x = 900 - 410 - 520).
  mao: { x: 410, y: 580, lado: 520 },
  maoEsquerda: { x: -30, y: 580, lado: 520 },
  fundo: { x: 0, y: 150, lado: 900 },
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

// Slot de onde vêm as peças de um slot (a mão esquerda usa as da mão).
export function slotDasPecas(catalogo, slot) {
  return catalogo?.slots?.find((s) => s.slot === slot)?.pecasDe || slot;
}

// Chave do mês da plaqueta em cada mão (avatarMontado.mesTrofeu...).
export const CHAVE_DO_MES = { mao: "mesTrofeu", maoEsquerda: "mesTrofeuEsquerda" };

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
// "2026-09" -> "Set/2026" (null se não for um mês).
export function mesCurto(monthKey) {
  const m = /^(\d{4})-(\d{2})$/.exec(monthKey || "");
  return m && MESES[Number(m[2]) - 1] ? `${MESES[Number(m[2]) - 1]}/${m[1]}` : null;
}
// "2026-09" -> "SET/26": o texto da plaqueta do troféu.
export function textoDaPlaca(monthKey) {
  const m = mesCurto(monthKey);
  return m ? `${m.slice(0, 3).toUpperCase()}/${m.slice(-2)}` : null;
}

// Meses de campeão (do mais recente pro mais antigo) do jogo de uma coroa
// ou troféu. `campeonatos` vem de /avatar/meu e /avatar/colecao.
export function mesesDeCampeao(item, campeonatos) {
  return item?.desbloqueio?.tipo === "campeao" ? campeonatos?.[item.desbloqueio.jogo] || [] : [];
}

// Como uma peça liberada foi ganha (texto fixo do catálogo, gerado da regra
// no servidor). Coroa e troféu de campeão ganham os meses de quem ganhou,
// quando a tela os tem ("…do Acromania em Set/2026, Ago/2026."). Catálogo
// antigo guardado no navegador pode vir sem motivo — a busca de fundo traz
// o novo.
const NOME_DO_JOGO = { stop: "Stop", quiz: "Quiz", acromania: "Acromania" };
export function motivoDe(item, campeonatos) {
  const meses = mesesDeCampeao(item, campeonatos).map(mesCurto).filter(Boolean);
  if (meses.length) return `Conquistada como campeão do ${NOME_DO_JOGO[item.desbloqueio.jogo] || item.desbloqueio.jogo} em ${meses.join(", ")}.`;
  return item?.motivo || "Peça liberada.";
}

// "Conquistada com..." -> "conquistada com..." (depois de "Coroa — ").
export function minuscula(texto) {
  return texto ? texto[0].toLowerCase() + texto.slice(1) : "";
}
