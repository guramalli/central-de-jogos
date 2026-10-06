import { useEffect, useRef, useState } from "react";
import { api } from "./api.js";
import { irParaPagina, linkDaPagina } from "./App.jsx";
import Topo from "./Topo.jsx";
import Rodape from "./Rodape.jsx";
import { esquecerPerfil } from "./perfil.js";
import EditorAvatar from "./EditorAvatar.jsx";

// Foto: recorta no centro e reduz pra 150×150 antes de enviar (igual ao
// clássico) — pesa pouco no banco e carrega rápido em todo lugar.
const LADO = 150;
function reduzir(arquivo) {
  return new Promise((ok, falha) => {
    const img = new Image();
    const leitor = new FileReader();
    leitor.onload = (e) => {
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = LADO; c.height = LADO;
        const lado = Math.min(img.width, img.height);
        c.getContext("2d").drawImage(img, (img.width - lado) / 2, (img.height - lado) / 2, lado, lado, 0, 0, LADO, LADO);
        ok(c.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = falha;
      img.src = e.target.result;
    };
    leitor.onerror = falha;
    leitor.readAsDataURL(arquivo);
  });
}

const nivel = (logo) => (typeof logo === "string" && logo.match(/-(bronze|prata|ouro)\.png$/i)?.[1]?.toLowerCase()) || "";

export default function EditarPerfil({ usuario }) {
  const [eu, setEu] = useState(null);
  const [titulos, setTitulos] = useState(null);
  const [foto, setFoto] = useState(null);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [msg, setMsg] = useState({}); // por seção: { foto, nick, comemoracao, senha, titulo }
  const [novoNick, setNovoNick] = useState("");
  const [comemoracao, setComemoracao] = useState("");
  const [senhas, setSenhas] = useState({ atual: "", nova: "", confirma: "" });
  const arquivoRef = useRef(null);

  const avisar = (secao, ok, texto) => setMsg((m) => ({ ...m, [secao]: { ok, texto } }));

  useEffect(() => {
    api.get("/users/me").then(({ data }) => { setEu(data); setFoto(data.avatarUrl || null); setComemoracao(data.celebration || ""); }).catch(() => setEu({}));
    api.get(`/users/${usuario.id}/titulos`).then(({ data }) => setTitulos(data)).catch(() => setTitulos({ quiz: [], stop: [] }));
  }, [usuario.id]);

  async function trocarFoto(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) { avisar("foto", false, "Escolhe um arquivo de imagem (jpg, png…)."); return; }
    setEnviandoFoto(true);
    try {
      const { data } = await api.post("/users/me/avatar", { avatarUrl: await reduzir(f) });
      setFoto(data.avatarUrl);
      esquecerPerfil(usuario.id);
      avisar("foto", true, "Foto atualizada!");
    } catch (err) {
      avisar("foto", false, err.response?.data?.error || "Erro ao enviar a foto.");
    } finally {
      setEnviandoFoto(false);
      if (arquivoRef.current) arquivoRef.current.value = "";
    }
  }
  async function tirarFoto() {
    setEnviandoFoto(true);
    try { await api.delete("/users/me/avatar"); setFoto(null); esquecerPerfil(usuario.id); avisar("foto", true, "Foto removida."); }
    catch { avisar("foto", false, "Não foi possível remover agora."); }
    finally { setEnviandoFoto(false); }
  }

  async function trocarNick(e) {
    e.preventDefault();
    const n = novoNick.trim();
    if (!n) return;
    if (!confirm(`Trocar seu nickname para "${n}"?\n\nATENÇÃO: esta é a ÚNICA troca permitida. Depois disso o nickname fica fixo para sempre.`)) return;
    try {
      const { data } = await api.patch("/users/me/nickname", { nickname: n });
      // O nick também mora no navegador (eg_user): atualiza pra não
      // aparecer o antigo até o próximo login.
      try {
        const u = JSON.parse(localStorage.getItem("eg_user") || "{}");
        localStorage.setItem("eg_user", JSON.stringify({ ...u, nickname: data.nickname }));
      } catch {}
      avisar("nick", true, `Pronto! Agora você é ${data.nickname}.`);
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      avisar("nick", false, err.response?.data?.error || "Erro ao trocar o nick.");
    }
  }

  async function salvarComemoracao(e) {
    e.preventDefault();
    try { await api.patch("/users/me", { celebration: comemoracao }); avisar("comemoracao", true, "Salvo!"); }
    catch (err) { avisar("comemoracao", false, err.response?.data?.error || "Erro ao salvar."); }
  }

  async function trocarSenha(e) {
    e.preventDefault();
    if (senhas.nova !== senhas.confirma) { avisar("senha", false, "As senhas novas não são iguais."); return; }
    try {
      const { data } = await api.patch("/users/me/password", { currentPassword: senhas.atual, newPassword: senhas.nova });
      setSenhas({ atual: "", nova: "", confirma: "" });
      setEu((x) => ({ ...x, hasPassword: true }));
      avisar("senha", true, data?.message || "Senha alterada!");
    } catch (err) {
      avisar("senha", false, err.response?.data?.error || "Erro ao trocar a senha.");
    }
  }

  async function escolherTitulo(nome) {
    const novo = eu?.tituloExibido === nome ? null : nome; // clicar de novo desmarca
    try {
      await api.patch("/users/me/titulo-exibido", { titulo: novo });
      setEu((x) => ({ ...x, tituloExibido: novo }));
      esquecerPerfil(usuario.id);
      avisar("titulo", true, novo ? `"${novo}" aparece agora no hover do seu nick.` : "Nenhum título exibido.");
    } catch (err) {
      avisar("titulo", false, err.response?.data?.error || "Erro ao salvar o título.");
    }
  }
  const Aviso = ({ s }) => (msg[s] ? <p className={msg[s].ok ? "v2-modal-ok" : "v2-modal-erro"} role="status">{msg[s].texto}</p> : null);
  const ItemTitulo = ({ t, unidade }) => {
    const ativo = eu?.tituloExibido === t.nome;
    return (
      <button className={`v2-titulo ${t.desbloqueado ? "ok" : ""} ${ativo ? "ativo" : ""}`} disabled={!t.desbloqueado} onClick={() => escolherTitulo(t.nome)} title={t.desbloqueado ? (ativo ? "Clique pra deixar de exibir" : "Clique pra exibir no hover do seu nick") : `Falta: ${t.min} ${unidade}`}>
        {t.logo ? <img src={t.logo} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} /> : <span className="v2-titulo-sem" />}
        <b className={t.desbloqueado ? `v2-medalha-${nivel(t.logo)}` : ""}>{t.nome}</b>
        <small>{t.desbloqueado ? (ativo ? "exibindo" : "exibir") : `${t.min} ${unidade}`}</small>
      </button>
    );
  };

  return (
    <div className="v2-app v2-com-menu">
      <Topo usuario={usuario} ativo={null} />
      <main className="v2-pagina">
        <div className="v2-pagina-cabeca">
          <h1>Meu perfil</h1>
          <a className="v2-link" href={linkDaPagina("jogador", { id: usuario.id })} onClick={(e) => { e.preventDefault(); irParaPagina("jogador", { id: usuario.id }); }}>ver como os outros veem →</a>
        </div>
        {!eu && <div className="v2-carregando">Carregando…</div>}
        {eu && (
          <div className="v2-editar-grade">
            <section className="v2-cartao v2-editar-foto">
              <h2>Foto</h2>
              <div className="v2-foto-grande">{foto ? <img src={foto} alt="Sua foto" /> : <span>{usuario.nickname.slice(0, 2).toUpperCase()}</span>}</div>
              <input ref={arquivoRef} type="file" accept="image/*" onChange={trocarFoto} className="v2-oculto" id="v2-arquivo-foto" />
              <div className="v2-editar-botoes">
                <label htmlFor="v2-arquivo-foto" className="v2-botao v2-botao-amarelo" aria-disabled={enviandoFoto}>{enviandoFoto ? "Enviando…" : foto ? "Trocar foto" : "Enviar foto"}</label>
                {foto && <button className="v2-botao v2-botao-contorno" onClick={tirarFoto} disabled={enviandoFoto}>Remover</button>}
              </div>
              <Aviso s="foto" />
            </section>

            <section className="v2-cartao">
              <h2>Comemoração</h2>
              <p className="v2-cartao-nota">A frase que você "grita" no chat quando acerta nas arenas do Quiz. Até 20 caracteres.</p>
              <form className="v2-linha-form" onSubmit={salvarComemoracao}>
                <label htmlFor="v2-comemoracao" className="v2-oculto">Comemoração</label>
                <input id="v2-comemoracao" value={comemoracao} onChange={(e) => setComemoracao(e.target.value.slice(0, 20))} placeholder="Ex.: Toma essa!" />
                <button className="v2-botao v2-botao-amarelo" type="submit">Salvar</button>
              </form>
              <Aviso s="comemoracao" />

              {eu.podeTrocarNick && (
                <>
                  <h2 className="v2-editar-sub">Trocar nickname</h2>
                  <p className="v2-cartao-nota">Você tem <b>uma única troca</b>. Depois, o nick fica fixo para sempre.</p>
                  <form className="v2-linha-form" onSubmit={trocarNick}>
                    <label htmlFor="v2-novo-nick" className="v2-oculto">Novo nickname</label>
                    <input id="v2-novo-nick" value={novoNick} onChange={(e) => setNovoNick(e.target.value)} placeholder="Novo nickname" maxLength={15} />
                    <button className="v2-botao v2-botao-amarelo" type="submit">Trocar</button>
                  </form>
                  <Aviso s="nick" />
                </>
              )}
            </section>

            <section className="v2-cartao">
              <h2>{eu.hasPassword ? "Trocar senha" : "Definir uma senha"}</h2>
              {!eu.hasPassword && <p className="v2-cartao-nota">Você entra com o Google. Definindo uma senha, também dá pra entrar com e-mail e senha.</p>}
              <form className="v2-modal-form" onSubmit={trocarSenha}>
                {eu.hasPassword && <label>Senha atual<input type="password" className="data-cs-mask" autoComplete="current-password" value={senhas.atual} onChange={(e) => setSenhas((x) => ({ ...x, atual: e.target.value }))} required /></label>}
                <label>Nova senha<input type="password" className="data-cs-mask" autoComplete="new-password" value={senhas.nova} onChange={(e) => setSenhas((x) => ({ ...x, nova: e.target.value }))} required minLength={6} /></label>
                <label>Confirmar nova senha<input type="password" className="data-cs-mask" autoComplete="new-password" value={senhas.confirma} onChange={(e) => setSenhas((x) => ({ ...x, confirma: e.target.value }))} required minLength={6} /></label>
                <button className="v2-botao v2-botao-amarelo" type="submit">Salvar senha</button>
              </form>
              <Aviso s="senha" />
            </section>
          </div>
        )}

        {eu && <EditorAvatar usuario={usuario} foto={foto} />}

        {titulos && (
          <section className="v2-cartao">
            <h2>Títulos</h2>
            <p className="v2-cartao-nota">Clique num título conquistado pra exibi-lo no cartão que aparece quando passam o mouse no seu nick. Clicar de novo tira. Sua foto (ou seu avatar) continua aparecendo em todo o site.</p>
            <Aviso s="titulo" />

            {titulos.trofeus?.todos?.length > 0 && (
              <>
                <div className="v2-bloco-titulo">Campeão mensal</div>
                <div className="v2-titulos">
                  {titulos.trofeus.todos.map((t) => <ItemTitulo key={`${t.gameKey}-${t.monthKey}`} t={{ ...t, desbloqueado: true }} unidade="" />)}
                </div>
              </>
            )}

            {titulos.lendario && (
              <div className={`v2-lendario ${titulos.lendario.desbloqueado ? "ok" : ""}`}>
                {titulos.lendario.logo && <img src={titulos.lendario.logo} alt="" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} />}
                <div>
                  <b>{titulos.lendario.nome}</b>
                  <small>{titulos.lendario.descricao}</small>
                  {titulos.lendario.desbloqueado ? <span className="v2-selo-ok">Conquistado</span> : (
                    <>
                      <div className="v2-missao-barra"><div style={{ width: `${Math.round((titulos.lendario.conquistados / titulos.lendario.total) * 100)}%` }} /></div>
                      <small>{titulos.lendario.conquistados} de {titulos.lendario.total} — faltam {titulos.lendario.faltam}</small>
                    </>
                  )}
                </div>
              </div>
            )}

            {titulos.quiz?.length > 0 && <div className="v2-bloco-titulo">Quiz — acertos por tema</div>}
            {(titulos.quiz || []).map((t) => (
              <div key={t.tema} className="v2-titulos-linha">
                <div className="v2-titulos-linha-topo"><b>{t.nomeTema}</b><span>{t.acertos} acertos</span></div>
                <div className="v2-titulos">{(t.titulos || []).map((n) => <ItemTitulo key={n.nome} t={n} unidade="acertos" />)}</div>
                <ProgressoTitulo valor={t.acertos} proximo={t.proximo} unidade="acertos" />
              </div>
            ))}
            {titulos.stop?.length > 0 && <div className="v2-bloco-titulo">Stop — STOPs pedidos</div>}
            {(titulos.stop || []).map((t) => (
              <div key={t.grupo} className="v2-titulos-linha">
                <div className="v2-titulos-linha-topo"><b>{t.rotulo}</b><span>{t.stops} STOPs</span></div>
                <div className="v2-titulos">{(t.titulos || []).map((n) => <ItemTitulo key={n.nome} t={n} unidade="STOPs" />)}</div>
                <ProgressoTitulo valor={t.stops} proximo={t.proximo} unidade="STOPs" />
              </div>
            ))}
          </section>
        )}
      </main>
      <Rodape />
    </div>
  );
}

// Barra até o próximo título do tema (igual ao clássico). Com todos os
// níveis conquistados, não aparece.
function ProgressoTitulo({ valor = 0, proximo, unidade }) {
  if (!proximo) return null;
  const pct = Math.min(100, Math.round((valor / proximo.min) * 100));
  return (
    <div className="v2-titulo-progresso" title={`${valor} de ${proximo.min} ${unidade}`}>
      <div className="v2-titulo-progresso-barra" role="progressbar" aria-valuemin={0} aria-valuemax={proximo.min} aria-valuenow={valor} aria-label={`Progresso até ${proximo.nome}`}>
        <div style={{ width: `${pct}%` }} />
      </div>
      <span>faltam <b>{Math.max(0, proximo.min - valor).toLocaleString("pt-BR")}</b> {unidade} para <b>{proximo.nome}</b> · {pct}%</span>
    </div>
  );
}
