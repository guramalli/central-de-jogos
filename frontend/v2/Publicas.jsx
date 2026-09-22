import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import { api, entrarComEmail, cadastrar, entrarComGoogle, entrarComoVisitante } from "./api.js";
import { irParaPagina, linkDaPagina } from "./App.jsx";
import Rodape from "./Rodape.jsx";
import { trocarParaClassica } from "../src/utils/versaoSite.js";

// PÁGINAS PÚBLICAS (quem não está logado) — mesmas regras e rotas do
// clássico: Home, Login, Register, ForgotPassword, ResetPassword.
// Termos e Privacidade reaproveitam os componentes do clássico (texto
// jurídico com UMA fonte só), só com o visual novo por fora.

const TermosDeUso = lazy(() => import("../src/pages/TermosDeUso.jsx"));
const Privacidade = lazy(() => import("../src/pages/Privacidade.jsx"));
const temGoogle = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Depois de entrar: se veio de uma página da área logada, recarrega nela;
// se estava na tela de entrar/cadastro, vai pro Início.
function depoisDeEntrar() {
  const pagina = new URLSearchParams(window.location.search).get("pagina");
  if (["entrar", "cadastro", "esqueci-senha", "redefinir-senha"].includes(pagina)) window.location.replace("/v2/");
  else window.location.reload();
}
const irLink = (pagina, extra) => (e) => { e.preventDefault(); irParaPagina(pagina, extra); };

// JOGAR SEM CADASTRO, com UM clique: entra como visitante com um apelido
// automático ("Jogador 4821") e abre direto o destino (a lobby do jogo).
// Antes, o "Jogar grátis" só rolava a página até o formulário de cadastro —
// quem vinha de fora achava que o botão estava quebrado (e ninguém se
// cadastra sem jogar uma vez). Se o número já estiver em uso, tenta outro.
async function jogarSemCadastro(destino) {
  for (let tentativa = 0; tentativa < 4; tentativa++) {
    const apelido = `Jogador ${Math.floor(1000 + Math.random() * 9000)}`;
    try {
      await entrarComoVisitante(apelido);
      window.location.replace(destino);
      return;
    } catch (err) {
      if (err.response?.status !== 409) throw err; // 409 = apelido em uso agora
    }
  }
  throw new Error("Não foi possível entrar agora. Tenta de novo?");
}

function TopoPublico() {
  return (
    <header className="v2-topo v2-topo-publico">
      <a className="v2-logo" href="/v2/" onClick={(e) => { e.preventDefault(); irParaPagina(null); }}>
        <img src="/educacao-gamer-logo.png" alt="Educação Gamer" className="v2-logo-img" />
        <span className="v2-selo-beta">beta</span>
      </a>
      <div className="v2-topo-dir">
        <button type="button" className="v2-troca-versao" onClick={() => trocarParaClassica()} title="Voltar para a versão clássica do site">Versão clássica</button>
        <a className="v2-botao-pequeno" href={linkDaPagina("entrar")} onClick={irLink("entrar")}>Entrar</a>
        <a className="v2-botao v2-botao-amarelo v2-botao-topo" href={linkDaPagina("cadastro")} onClick={irLink("cadastro")}>Criar conta</a>
      </div>
    </header>
  );
}

function Moldura({ children, larga = false }) {
  return (
    <div className="v2-app">
      <TopoPublico />
      <main className={`v2-pagina ${larga ? "" : "v2-pagina-estreita"}`}>{children}</main>
      <Rodape />
    </div>
  );
}

function BotaoGoogle({ texto = "continue_with", aoErro }) {
  if (!temGoogle) return null;
  return (
    <div className="v2-google">
      <GoogleLogin
        onSuccess={async (r) => { try { await entrarComGoogle(r.credential); depoisDeEntrar(); } catch (err) { aoErro(err.response?.data?.error || "Erro ao entrar com Google."); } }}
        onError={() => aoErro("Erro ao entrar com Google.")}
        text={texto}
        locale="pt-BR"
        width="320"
        shape="pill"
      />
    </div>
  );
}

function Visitante({ aoErro }) {
  const [aberto, setAberto] = useState(false);
  const [nick, setNick] = useState("");
  const [entrando, setEntrando] = useState(false);
  const ref = useRef(null);
  async function entrar(e) {
    e.preventDefault();
    setEntrando(true);
    try { await entrarComoVisitante(nick); depoisDeEntrar(); }
    catch (err) { aoErro(err.response?.data?.error || "Erro ao entrar. Tenta de novo?"); setEntrando(false); }
  }
  if (!aberto) {
    return <button type="button" className="v2-link v2-visitante-link" onClick={() => { setAberto(true); requestAnimationFrame(() => ref.current?.focus()); }}>Prefiro escolher meu apelido de visitante →</button>;
  }
  return (
    <form className="v2-visitante" onSubmit={entrar}>
      <label htmlFor="v2-nick-visitante" className="v2-oculto">Apelido de visitante</label>
      <input id="v2-nick-visitante" ref={ref} className="v2-campo" placeholder="Escolha um apelido de visitante" value={nick} onChange={(e) => setNick(e.target.value)} maxLength={15} required />
      <button className="v2-botao v2-botao-contorno" type="submit" disabled={entrando}>{entrando ? "Entrando…" : "Testar sem cadastro"}</button>
      <p className="v2-cartao-nota">Visitantes jogam à vontade, mas só contas cadastradas pontuam no ranking, ganham títulos e concorrem à premiação mensal.</p>
    </form>
  );
}

// ---------- Página inicial pública (a "Home" do clássico) ----------
export function Entrada() {
  const [online, setOnline] = useState(null);
  const [acroAtivo, setAcroAtivo] = useState(true);
  const [erro, setErro] = useState("");
  const [entrando, setEntrando] = useState(null); // chave do jogo (ou "inicio") enquanto entra
  const entradaRef = useRef(null);

  async function jogar(chave) {
    if (entrando) return;
    setErro(""); setEntrando(chave);
    try {
      // O Tribunal tem página própria; os outros abrem a lobby de salas do jogo.
      const destino = chave === "inicio" ? "/v2/" : chave === "tribunal" ? linkDaPagina("tribunal") : linkDaPagina("jogar", { jogo: chave });
      await jogarSemCadastro(destino);
    } catch (err) {
      setErro(err.response?.data?.error || err.message || "Não foi possível entrar agora. Tenta de novo?");
      setEntrando(null);
    }
  }

  useEffect(() => {
    api.get("/platform-stats/online").then(({ data }) => setOnline(data)).catch(() => {});
    api.get("/acromania-rooms").then(({ data }) => setAcroAtivo(Array.isArray(data) ? true : data.ativo !== false)).catch(() => {});
  }, []);

  const jogos = [
    { chave: "stop", logo: "/stop-logo.png", cor: "#FF8A7F", sombra: "#C7493F", texto: "A adedonha de verdade, online. 6 temas, 1 letra sorteada, e quem hesita perde a rodada." },
    { chave: "quiz", logo: "/quiz-logo.png", cor: "#FFD60A", sombra: "#B88A00", texto: "Milhares de perguntas por tema — Futebol, Anime, Games, Terceirão e muito mais. Quem acerta primeiro leva os pontos!" },
    { chave: "acromania", logo: "/acromania-logo.png", cor: "#C3A6FF", sombra: "#8465D1", texto: "Um tema, algumas letras, e você cria a frase mais criativa — a galera vota na melhor.", beta: true },
    { chave: "tribunal", logo: "/tribunal-logo.png", cor: "#7CC8FF", sombra: "#3F84C4", texto: "Alguém é acusado de um crime absurdo. Promotor acusa, advogado defende, e o júri decide: culpado ou inocente?", beta: true },
  ].filter((j) => j.chave !== "acromania" || acroAtivo);

  return (
    <Moldura larga>
      <section className="v2-hero-publico">
        <div className="v2-hero-texto">
          <img src="/educacao-gamer-logo.png" alt="Educação Gamer" className="v2-hero-logo" />
          <h1>Stop, Quiz e Acromania — juntos de novo, direto do navegador</h1>
          <p>A nostalgia da Central de Jogos, de volta: salas multiplayer em tempo real, chat, patentes e <b>ranking mensal com premiação em dinheiro</b>. Sem download, sem instalação.</p>
          {online?.total > 0 && <div className="v2-jogando v2-jogando-grande"><span className="v2-ponto-vivo" />{online.total === 1 ? "1 pessoa jogando agora" : `${online.total} pessoas jogando agora`}</div>}
          <ul className="v2-vantagens">
            <li>Grátis pra jogar</li>
            <li>Salas públicas e privadas com amigos</li>
            <li>Premiação mensal via Pix</li>
          </ul>
        </div>
        <div className="v2-cartao v2-cartao-entrada" ref={entradaRef}>
          <h2>Comece a jogar agora</h2>
          {erro && <div className="v2-faixa-aviso erro" role="alert">{erro}</div>}
          <button type="button" className="v2-botao v2-botao-amarelo v2-botao-largo" onClick={() => jogar("inicio")} disabled={!!entrando}>
            {entrando === "inicio" ? "Entrando…" : "Jogar agora, sem cadastro"}
          </button>
          <p className="v2-cartao-nota v2-centralizado">Sem e-mail, sem senha. Gostou? Crie sua conta pra entrar no <b>ranking</b>, ganhar <b>patentes</b> e concorrer à <b>premiação via Pix</b>.</p>
          <div className="v2-entrada-divisor"><span>ou</span></div>
          <BotaoGoogle aoErro={setErro} />
          <a className="v2-botao v2-botao-contorno v2-botao-largo" href={linkDaPagina("cadastro")} onClick={irLink("cadastro")}>Criar conta grátis</a>
          <a className="v2-link v2-centralizado" href={linkDaPagina("entrar")} onClick={irLink("entrar")}>Já tenho conta — entrar</a>
          <Visitante aoErro={setErro} />
        </div>
      </section>

      <div className="v2-jogos-cards">
        {jogos.map((j, i) => (
          <button key={j.chave} type="button" className="v2-jogo-card" style={{ "--cor": j.cor, "--sombra": j.sombra, animationDelay: `${i * 80}ms` }}
            onClick={() => jogar(j.chave)} disabled={!!entrando} aria-busy={entrando === j.chave}>
            {j.beta && <span className="v2-jogo-card-beta">em testes</span>}
            <img src={j.logo} alt={j.chave} />
            <p>{j.texto}</p>
            <span className="v2-jogo-card-cta">{entrando === j.chave ? "Entrando…" : "Jogar grátis, sem cadastro →"}</span>
          </button>
        ))}
      </div>
    </Moldura>
  );
}

// ---------- Entrar ----------
export function Entrar() {
  const sessaoExpirada = new URLSearchParams(window.location.search).get("sessao") === "expirada";
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  async function enviar(e) {
    e.preventDefault();
    setErro(""); setEnviando(true);
    try { await entrarComEmail(email, senha); depoisDeEntrar(); }
    catch (err) { setErro(err.response?.data?.error || "Erro ao entrar."); setEnviando(false); }
  }
  return (
    <Moldura>
      <section className="v2-cartao v2-auth">
        <h1>Entrar</h1>
        {sessaoExpirada && !erro && <div className="v2-faixa-aviso">Sua sessão expirou por inatividade. Entre de novo pra continuar jogando.</div>}
        {erro && <div className="v2-faixa-aviso erro" role="alert">{erro}</div>}
        <BotaoGoogle aoErro={setErro} />
        {temGoogle && <div className="v2-divisor"><span>ou entre com e-mail</span></div>}
        <form className="v2-auth-form" onSubmit={enviar}>
          <label>E-mail<input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label>Senha<input type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} required /></label>
          <button className="v2-botao v2-botao-amarelo v2-botao-largo" type="submit" disabled={enviando}>{enviando ? "Entrando…" : "Entrar"}</button>
        </form>
        <a className="v2-link" href={linkDaPagina("esqueci-senha")} onClick={irLink("esqueci-senha")}>Esqueci minha senha</a>
        <p className="v2-cartao-nota">Não tem conta? <a className="v2-link" href={linkDaPagina("cadastro")} onClick={irLink("cadastro")}>Criar conta grátis</a></p>
        <Visitante aoErro={setErro} />
      </section>
    </Moldura>
  );
}

// ---------- Cadastro ----------
export function Cadastro() {
  const [nick, setNick] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [aceite, setAceite] = useState(false);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  async function enviar(e) {
    e.preventDefault();
    setErro("");
    if (!aceite) { setErro("Você precisa aceitar os Termos de Uso para se cadastrar."); return; }
    setEnviando(true);
    try { await cadastrar(nick, email, senha, { birthDate: nascimento, termsAccepted: aceite }); depoisDeEntrar(); }
    catch (err) { setErro(err.response?.data?.error || "Erro ao cadastrar."); setEnviando(false); }
  }
  return (
    <Moldura>
      <section className="v2-cartao v2-auth">
        <h1>Criar conta</h1>
        <p className="v2-cartao-nota">Crie sua conta e comece a acumular pontos vitalícios hoje mesmo.</p>
        {erro && <div className="v2-faixa-aviso erro" role="alert">{erro}</div>}
        <BotaoGoogle texto="signup_with" aoErro={setErro} />
        {temGoogle && (
          <>
            <p className="v2-cartao-nota v2-centralizado">Ao continuar com o Google, você concorda com nossos <a className="v2-link" href={linkDaPagina("termos")} target="_blank" rel="noopener noreferrer">Termos de Uso</a>.</p>
            <div className="v2-divisor"><span>ou cadastre com e-mail</span></div>
          </>
        )}
        <form className="v2-auth-form" onSubmit={enviar}>
          <label>Nickname<input value={nick} onChange={(e) => setNick(e.target.value)} maxLength={15} autoComplete="nickname" required /></label>
          <label>E-mail<input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label>Senha <em>(mínimo 8 caracteres)</em><input type="password" minLength={8} autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} required /></label>
          <label>Data de nascimento <em>(opcional)</em><input type="date" value={nascimento} onChange={(e) => setNascimento(e.target.value)} /></label>
          <label className="v2-aceite">
            <input type="checkbox" checked={aceite} onChange={(e) => setAceite(e.target.checked)} />
            <span>Li e aceito os <a className="v2-link" href={linkDaPagina("termos")} target="_blank" rel="noopener noreferrer">Termos de Uso</a></span>
          </label>
          <button className="v2-botao v2-botao-amarelo v2-botao-largo" type="submit" disabled={enviando}>{enviando ? "Cadastrando…" : "Cadastrar"}</button>
        </form>
        <p className="v2-cartao-nota">Já tem conta? <a className="v2-link" href={linkDaPagina("entrar")} onClick={irLink("entrar")}>Entrar</a></p>
      </section>
    </Moldura>
  );
}

// ---------- Esqueci a senha ----------
export function EsqueciSenha() {
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState(null);
  async function enviar(e) {
    e.preventDefault();
    setEstado("enviando");
    try { await api.post("/auth/forgot-password", { email }); setEstado("ok"); }
    catch (err) { setEstado({ erro: err.response?.data?.error || "Não foi possível enviar agora. Tenta de novo?" }); }
  }
  return (
    <Moldura>
      <section className="v2-cartao v2-auth">
        <h1>Esqueci minha senha</h1>
        {estado === "ok" ? (
          <div className="v2-faixa-aviso ok" role="status">Se esse e-mail tiver conta, mandamos um link pra criar uma senha nova. Confira a caixa de entrada (e o spam).</div>
        ) : (
          <>
            <p className="v2-cartao-nota">Digite o e-mail da sua conta e enviamos um link pra você criar uma senha nova.</p>
            {estado?.erro && <div className="v2-faixa-aviso erro" role="alert">{estado.erro}</div>}
            <form className="v2-auth-form" onSubmit={enviar}>
              <label>E-mail<input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
              <button className="v2-botao v2-botao-amarelo v2-botao-largo" type="submit" disabled={estado === "enviando"}>{estado === "enviando" ? "Enviando…" : "Enviar link"}</button>
            </form>
          </>
        )}
        <a className="v2-link" href={linkDaPagina("entrar")} onClick={irLink("entrar")}>← Voltar pra entrar</a>
      </section>
    </Moldura>
  );
}

// ---------- Redefinir a senha (link do e-mail) ----------
export function RedefinirSenha({ token }) {
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [estado, setEstado] = useState(null);
  async function enviar(e) {
    e.preventDefault();
    if (senha !== confirma) { setEstado({ erro: "As senhas não são iguais." }); return; }
    setEstado("enviando");
    try { await api.post("/auth/reset-password", { token, password: senha }); setEstado("ok"); }
    catch (err) { setEstado({ erro: err.response?.data?.error || "Não foi possível trocar a senha. O link pode ter expirado." }); }
  }
  return (
    <Moldura>
      <section className="v2-cartao v2-auth">
        <h1>Criar senha nova</h1>
        {!token ? (
          <div className="v2-faixa-aviso erro">Link inválido. Peça um novo em <a className="v2-link" href={linkDaPagina("esqueci-senha")} onClick={irLink("esqueci-senha")}>esqueci minha senha</a>.</div>
        ) : estado === "ok" ? (
          <>
            <div className="v2-faixa-aviso ok" role="status">Senha trocada! Agora é só entrar com ela.</div>
            <a className="v2-botao v2-botao-amarelo v2-botao-largo" href={linkDaPagina("entrar")} onClick={irLink("entrar")}>Entrar</a>
          </>
        ) : (
          <>
            {estado?.erro && <div className="v2-faixa-aviso erro" role="alert">{estado.erro}</div>}
            <form className="v2-auth-form" onSubmit={enviar}>
              <label>Nova senha <em>(mínimo 8 caracteres)</em><input type="password" minLength={8} autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} required /></label>
              <label>Confirmar a nova senha<input type="password" minLength={8} autoComplete="new-password" value={confirma} onChange={(e) => setConfirma(e.target.value)} required /></label>
              <button className="v2-botao v2-botao-amarelo v2-botao-largo" type="submit" disabled={estado === "enviando"}>{estado === "enviando" ? "Salvando…" : "Salvar senha nova"}</button>
            </form>
          </>
        )}
      </section>
    </Moldura>
  );
}

// ---------- Termos de uso e Privacidade ----------
// O texto é o do clássico (src/pages), com uma fonte só. O Helmet e o
// roteador de memória são o que aqueles componentes esperam ter em volta.
export function Legal({ qual, comTopo }) {
  const Pagina = qual === "privacidade" ? Privacidade : TermosDeUso;
  const caminho = qual === "privacidade" ? "/privacidade" : "/termos-de-uso";
  const conteudo = (
    <div className="v2-legal">
      <HelmetProvider>
        <MemoryRouter initialEntries={[caminho]}>
          <Suspense fallback={<div className="v2-carregando">Carregando…</div>}>
            <Pagina />
          </Suspense>
        </MemoryRouter>
      </HelmetProvider>
    </div>
  );
  return comTopo ? comTopo(conteudo) : <Moldura>{conteudo}</Moldura>;
}
