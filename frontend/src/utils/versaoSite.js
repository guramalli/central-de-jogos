// VERSÃO DO SITE — nova (v2) ou clássica.
//
// A versão nova é a PRINCIPAL: quem abre uma página do clássico que existe
// na nova é levado pra ela — logado ou não, já que a entrada pública, o
// login, o cadastro, os termos e a privacidade também existem lá —, a não
// ser que tenha escolhido o clássico no botão do topo (a escolha fica
// neste navegador). As páginas de SEO (.html) são arquivos à parte e não
// passam por aqui.
//
// Usado pelos dois sites (src/ e v2/) — um arquivo só pra que as duas
// traduções de endereço não divirjam.

const CHAVE = "eg_versao_site";

export function versaoPreferida() {
  try {
    return localStorage.getItem(CHAVE) === "classica" ? "classica" : "nova";
  } catch {
    return "nova";
  }
}

function guardar(versao) {
  try {
    localStorage.setItem(CHAVE, versao);
  } catch {}
}

const q = (params) => {
  const s = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== "")).toString();
  return s ? `/v2/?${s}` : "/v2/";
};

// Página do clássico -> endereço equivalente na nova (ou null se a página
// só existe no clássico: login, cadastro, termos, privacidade...).
export function classicoParaNova(pathname = "/", search = "") {
  const busca = new URLSearchParams(search);
  const p = pathname.replace(/\/+$/, "") || "/";
  let m;
  if (p === "/") return "/v2/";
  if ((m = p.match(/^\/jogos\/(stop|quiz|acromania)$/))) return q({ pagina: "jogar", jogo: m[1] });
  if ((m = p.match(/^\/jogos\/(stop|quiz)\/varias$/))) return q({ pagina: "varias", jogo: m[1] });
  if ((m = p.match(/^\/jogos\/(stop|acromania)\/privada$/))) return q({ pagina: "privadas", jogo: m[1], privada: busca.get("sala") });
  if ((m = p.match(/^\/jogos\/stop\/([^/]+)$/))) return q({ stop: decodeURIComponent(m[1]) });
  if ((m = p.match(/^\/jogos\/quiz\/([^/]+)$/))) return q({ sala: decodeURIComponent(m[1]) });
  if ((m = p.match(/^\/jogos\/acromania\/([^/]+)$/))) return q({ acro: decodeURIComponent(m[1]) });
  if (p === "/ranking") return q({ pagina: "ranking", jogo: busca.get("game") });
  if (p === "/ranking/historico") return q({ pagina: "hall" });
  if (p === "/missoes") return q({ pagina: "missoes" });
  if (p === "/patentes") return q({ pagina: "patentes", jogo: "stop" });
  if (p === "/patentes-quiz") return q({ pagina: "patentes", jogo: "quiz" });
  if (p === "/patentes-acromania") return q({ pagina: "patentes", jogo: "acromania" });
  if (p === "/amigos") return q({ pagina: "amigos" });
  if (p === "/cla") return q({ pagina: "clas" });
  if ((m = p.match(/^\/cla\/([^/]+)$/))) return q({ pagina: "cla", id: m[1] });
  if ((m = p.match(/^\/jogador\/([^/]+)$/))) return q({ pagina: "jogador", id: m[1] });
  if (p === "/perfil") return q({ pagina: "editar-perfil" });
  if (p === "/novidades") return q({ pagina: "novidades" });
  if (p === "/admin") return q({ pagina: "admin" });
  if (p === "/login") return q({ pagina: "entrar", sessao: busca.get("sessao") });
  if (p === "/registrar") return q({ pagina: "cadastro" });
  if (p === "/esqueci-senha") return q({ pagina: "esqueci-senha" });
  if (p === "/redefinir-senha") return q({ pagina: "redefinir-senha", token: busca.get("token") });
  if (p === "/termos-de-uso") return q({ pagina: "termos" });
  if (p === "/privacidade") return q({ pagina: "privacidade" });
  return null;
}

// Endereço da nova (os parâmetros da URL) -> página equivalente no clássico.
export function novaParaClassico(search = "") {
  const b = new URLSearchParams(search);
  const jogo = b.get("jogo");
  if (b.get("sala")) return `/jogos/quiz/${encodeURIComponent(b.get("sala"))}`;
  if (b.get("stop")) return `/jogos/stop/${encodeURIComponent(b.get("stop"))}`;
  if (b.get("acro")) return `/jogos/acromania/${encodeURIComponent(b.get("acro"))}`;
  switch (b.get("pagina")) {
    case "jogar": return `/jogos/${jogo === "stop" || jogo === "acromania" ? jogo : "quiz"}`;
    case "varias": return `/jogos/${jogo === "quiz" ? "quiz" : "stop"}/varias`;
    case "privadas": {
      const sala = b.get("privada");
      return `/jogos/${jogo === "acromania" ? "acromania" : "stop"}/privada${sala ? `?sala=${encodeURIComponent(sala)}` : ""}`;
    }
    case "ranking": return jogo ? `/ranking?game=${jogo}` : "/ranking";
    case "hall": return "/ranking/historico";
    case "missoes": return "/missoes";
    case "patentes": return jogo === "quiz" ? "/patentes-quiz" : jogo === "acromania" ? "/patentes-acromania" : "/patentes";
    case "amigos": return "/amigos";
    case "clas": return "/cla";
    case "cla": return b.get("id") ? `/cla/${b.get("id")}` : "/cla";
    case "jogador": return b.get("id") ? `/jogador/${b.get("id")}` : "/perfil";
    case "editar-perfil": return "/perfil";
    case "novidades": return "/novidades";
    case "admin": return "/admin";
    case "entrar": return "/login";
    case "cadastro": return "/registrar";
    case "esqueci-senha": return "/esqueci-senha";
    case "redefinir-senha": return b.get("token") ? `/redefinir-senha?token=${encodeURIComponent(b.get("token"))}` : "/redefinir-senha";
    case "termos": return "/termos-de-uso";
    case "privacidade": return "/privacidade";
    default: return "/";
  }
}

// No clássico: pra onde mandar esta pessoa, ou null pra ficar onde está.
export function destinoNaNova(pathname = window.location.pathname, search = window.location.search) {
  if (versaoPreferida() === "classica") return null;
  return classicoParaNova(pathname, search);
}

// Botões do topo: guardam a escolha e levam pra MESMA página na outra versão.
export function trocarParaNova(pathname = window.location.pathname, search = window.location.search) {
  guardar("nova");
  window.location.assign(classicoParaNova(pathname, search) || "/v2/");
}
export function trocarParaClassica(search = window.location.search) {
  guardar("classica");
  window.location.assign(novaParaClassico(search));
}
