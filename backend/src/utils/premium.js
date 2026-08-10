import { prisma } from "../db.js";

// ===== Conta premium =====
//
// PRINCÍPIO: premium é só ESTÉTICA, CONVENIÊNCIA e STATUS. Nada aqui dá
// vantagem competitiva — nem pontos extras, nem tempo a mais, nem dica.
// O ranking tem premiação em dinheiro; se quem paga jogasse com vantagem,
// a disputa perderia a legitimidade e quem não paga iria embora.

// Chave mestra: enquanto false, TODO o premium fica desligado no site.
// Serve pra construir e testar tudo agora e ligar quando fizer sentido.
export const PREMIUM_ATIVO = false;

// Molduras disponíveis. O id é o que fica salvo no banco; o CSS de cada
// uma vive no frontend (classe .moldura-<id>).
export const MOLDURAS = [
  { id: "dourada", nome: "Dourada", descricao: "Contorno dourado com brilho suave" },
  { id: "neon", nome: "Neon", descricao: "Borda azul pulsante" },
  { id: "fogo", nome: "Fogo", descricao: "Gradiente quente animado" },
  { id: "floresta", nome: "Floresta", descricao: "Verde com leve movimento" },
  { id: "retro", nome: "Retrô", descricao: "Pixel art em roxo e ciano" },
];

// Cores de nickname liberadas. Lista fechada de propósito: cor livre
// permitiria escolher tons ilegíveis no chat de fundo preto, ou imitar as
// cores reservadas do sistema (verde de acerto, vermelho de erro).
export const CORES_NICK = [
  { id: "ouro", hex: "#ffd166", nome: "Ouro" },
  { id: "ciano", hex: "#4cc9f0", nome: "Ciano" },
  { id: "rosa", hex: "#ff70a6", nome: "Rosa" },
  { id: "lima", hex: "#b5e48c", nome: "Lima" },
  { id: "lavanda", hex: "#c8b6ff", nome: "Lavanda" },
  { id: "coral", hex: "#ff9f80", nome: "Coral" },
];

// Emojis exclusivos de premium no chat.
export const EMOJIS_PREMIUM = ["👑", "💎", "🔱", "⚜️", "🏵️", "🎖️", "🃏", "🦄"];

// Uma conta é premium se tiver cortesia vitalícia ou assinatura na validade.
export function ehPremium(user) {
  if (!PREMIUM_ATIVO) return false;
  if (!user) return false;
  if (user.premiumVitalicio) return true;
  if (!user.premiumAte) return false;
  return new Date(user.premiumAte) > new Date();
}

// Versão que consulta o banco, pra quando só temos o id.
export async function ehPremiumPorId(userId) {
  if (!PREMIUM_ATIVO || !userId) return false;
  try {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { premiumAte: true, premiumVitalicio: true },
    });
    return ehPremium(u);
  } catch {
    return false;
  }
}

// Devolve só o que o frontend precisa pra desenhar os enfeites de alguém.
// Se a pessoa não for premium (ou o recurso estiver desligado), volta tudo
// nulo — assim quem chama não precisa checar nada.
export function enfeitesDe(user) {
  if (!ehPremium(user)) {
    return { premium: false, moldura: null, corNickname: null, titulo: null };
  }
  return {
    premium: true,
    moldura: user.molduraAvatar || null,
    corNickname: user.corNickname || null,
    titulo: user.tituloPerfil || null,
  };
}

// Limpa e valida o que a pessoa escolheu, pra não entrar lixo no banco.
export function validarEscolhas({ moldura, corNickname, titulo, saudacaoEntrada, saudacaoSaida }) {
  const erros = [];
  const limpo = {};

  if (moldura !== undefined) {
    if (moldura === null || moldura === "") limpo.molduraAvatar = null;
    else if (MOLDURAS.some((m) => m.id === moldura)) limpo.molduraAvatar = moldura;
    else erros.push("Moldura inválida.");
  }

  if (corNickname !== undefined) {
    if (corNickname === null || corNickname === "") limpo.corNickname = null;
    else if (CORES_NICK.some((c) => c.hex === corNickname)) limpo.corNickname = corNickname;
    else erros.push("Cor de nickname inválida.");
  }

  // Textos livres passam por limite de tamanho e checagem básica — eles
  // aparecem pra todo mundo no chat, então não podem virar propaganda ou
  // muro de texto.
  const texto = (v, nome, max) => {
    const t = String(v || "").trim();
    if (t.length > max) {
      erros.push(`${nome} deve ter no máximo ${max} caracteres.`);
      return null;
    }
    if (/https?:\/\/|www\.|\.com|\.br\b/i.test(t)) {
      erros.push(`${nome} não pode conter links.`);
      return null;
    }
    return t;
  };

  if (titulo !== undefined) {
    const t = texto(titulo, "O título", 40);
    if (t !== null) limpo.tituloPerfil = t || null;
  }
  if (saudacaoEntrada !== undefined) {
    const t = texto(saudacaoEntrada, "A saudação de entrada", 60);
    if (t !== null) limpo.saudacaoEntrada = t || null;
  }
  if (saudacaoSaida !== undefined) {
    const t = texto(saudacaoSaida, "A saudação de saída", 60);
    if (t !== null) limpo.saudacaoSaida = t || null;
  }

  return { limpo, erros };
}

// ===== Saudações personalizadas =====
//
// Usado pelos três jogos (Stop, Quiz e Acromania) pra não repetir a mesma
// lógica em cada um. Devolve o texto pronto ou null.

// Busca no banco os dados de saudação de alguém. Falha em silêncio: uma
// saudação nunca pode impedir a pessoa de entrar numa sala.
// Fica true se o banco ainda não tiver as colunas de premium (falta rodar
// `npx prisma db push`). Nesse caso, o recurso se desliga sozinho em vez de
// derrubar o fluxo do jogo a cada entrada de jogador.
let colunasIndisponiveis = false;

export async function carregarSaudacoes(userId) {
  if (!PREMIUM_ATIVO || !userId || colunasIndisponiveis) return null;
  try {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        premiumAte: true, premiumVitalicio: true,
        saudacaoEntrada: true, saudacaoSaida: true,
      },
    });
    if (!ehPremium(u)) return null;
    return {
      entrada: u.saudacaoEntrada || null,
      saida: u.saudacaoSaida || null,
    };
  } catch (err) {
    // Coluna inexistente: avisa uma vez e desliga o recurso até o próximo
    // restart, pra não repetir o erro a cada jogador que entra.
    if (/column|does not exist|Unknown arg/i.test(err.message || "")) {
      colunasIndisponiveis = true;
      console.warn("Colunas de premium ausentes no banco — rode `npx prisma db push`. Recurso desativado por ora.");
    }
    return null;
  }
}

// Monta a mensagem de entrada, ou null se não houver.
export function mensagemDeEntrada(nickname, saudacoes) {
  if (!saudacoes?.entrada) return null;
  return `✨ ${nickname}: ${saudacoes.entrada}`;
}

// Monta a mensagem de saída. Sem saudação configurada, devolve null e cada
// jogo usa o texto padrão dele ("Fulano saiu da sala").
export function mensagemDeSaida(nickname, saudacaoSaida) {
  if (!saudacaoSaida) return null;
  return `✨ ${nickname}: ${saudacaoSaida}`;
}
