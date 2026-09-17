import { useEffect, useState } from "react";
import { api } from "../api/client.js";

/**
 * ONDE TEM GENTE JOGANDO AGORA.
 *
 * Nasceu de uma observação do Gustavinho: quem chega no site escolhe o jogo
 * no escuro. Se cair numa sala vazia vai embora, mesmo que houvesse gente
 * jogando no jogo ao lado.
 *
 * O selo só aparece quando HÁ alguém. Mostrar "0 jogadores" seria pior que
 * não mostrar nada — anunciaria que o site está vazio justo pra quem acabou
 * de chegar.
 */
const INTERVALO_MS = 20000;

// Um pedido só, compartilhado pelos três cards.
//
// Sem isso, três selos na tela dariam três requisições a cada 20 segundos —
// o triplo de carga no Render pra buscar exatamente o mesmo dado.
let cache = { dados: null, buscadoEm: 0 };
let pedidoEmVoo = null;

async function buscarOnline() {
  const agora = Date.now();
  if (cache.dados && agora - cache.buscadoEm < INTERVALO_MS - 2000) return cache.dados;
  if (pedidoEmVoo) return pedidoEmVoo;

  pedidoEmVoo = api
    .get("/platform-stats/online")
    .then(({ data }) => {
      cache = { dados: data, buscadoEm: Date.now() };
      return data;
    })
    .catch(() => cache.dados)
    .finally(() => {
      pedidoEmVoo = null;
    });

  return pedidoEmVoo;
}

/**
 * `jogo` aceita "stop", "quiz", "acromania" — ou "total", que soma as
 * pessoas distintas nos três.
 *
 * O total é o que vai na página de quem NÃO está logado: ali o visitante
 * ainda não escolheu jogo nenhum, e o que convence é "tem gente aqui agora",
 * não a divisão por sala.
 */
export default function JogadoresOnline({ jogo, texto = null }) {
  const [quantos, setQuantos] = useState(0);

  useEffect(() => {
    let vivo = true;

    async function atualizar() {
      const dados = await buscarOnline();
      if (vivo && dados) setQuantos(dados[jogo] || 0);
    }

    atualizar();
    const timer = setInterval(atualizar, INTERVALO_MS);
    return () => {
      vivo = false;
      clearInterval(timer);
    };
  }, [jogo]);

  if (quantos < 1) return null;

  return (
    <span className="jogadores-online" title="Jogando agora">
      <span className="jogadores-online-ponto" />
      {texto
        ? texto(quantos)
        : `${quantos} ${quantos === 1 ? "jogador agora" : "jogadores agora"}`}
    </span>
  );
}
