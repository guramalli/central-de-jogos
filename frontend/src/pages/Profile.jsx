import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import Seo from "../components/Seo.jsx";
import AvatarUpload from "../components/AvatarUpload.jsx";
import TitulosPerfil from "../components/TitulosPerfil.jsx";

export default function Profile() {
  const { user } = useAuth();
  const [celebration, setCelebration] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [hasPassword, setHasPassword] = useState(true);
  const [podeTrocarNick, setPodeTrocarNick] = useState(false);
  const [novoNick, setNovoNick] = useState("");
  const [nickMsg, setNickMsg] = useState("");
  const [nickErro, setNickErro] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);

  useEffect(() => {
    api
      .get("/users/me")
      .then(({ data }) => {
        setCelebration(data.celebration || "");
        setAvatarUrl(data.avatarUrl || null);
        setHasPassword(data.hasPassword);
        setPodeTrocarNick(!!data.podeTrocarNick);
      })
      .finally(() => setLoading(false));
  }, []);

  async function trocarNick(e) {
    e.preventDefault();
    setNickErro("");
    setNickMsg("");
    if (!novoNick.trim()) return;
    if (!window.confirm(
      `Trocar seu nickname para "${novoNick.trim()}"?\n\n` +
      `ATENÇÃO: esta é a ÚNICA troca permitida. Depois disso o nickname fica fixo para sempre.\n\n` +
      `Confirma?`
    )) return;
    try {
      const { data } = await api.patch("/users/me/nickname", { nickname: novoNick.trim() });
      setNickMsg(`Pronto! Agora você é ${data.nickname}.`);
      setPodeTrocarNick(false);
      // Recarrega pra o nick novo aparecer no cabeçalho e no resto do site.
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      setNickErro(err.response?.data?.error || "Erro ao trocar o nick.");
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setSaved(false);
    try {
      await api.patch("/users/me", { celebration });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e.response?.data?.error || "Erro ao salvar.");
    }
  }

  async function handlePasswordSave(e) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSaved(false);
    if (newPassword !== confirmPassword) {
      setPasswordError("As senhas novas não são iguais.");
      return;
    }
    try {
      const { data } = await api.patch("/users/me/password", { currentPassword, newPassword });
      setPasswordSaved(true);
      setHasPassword(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSaved(false), 3000);
    } catch (e) {
      setPasswordError(e.response?.data?.error || "Erro ao trocar senha.");
    }
  }

  if (loading) return <p>Carregando...</p>;

  return (
    <div>
      <Seo title="Meu Perfil" noindex />
      <h1>Meu Perfil</h1>

      {/* Duas colunas no desktop: configurações à esquerda, títulos à
          direita — sem o vazio que sobrava com tudo espremido em 480px.
          No celular vira uma coluna só (ver .perfil-grid no CSS). */}
      <div className="perfil-grid">
        <div className="perfil-col">
      <div className="card" style={{ marginBottom: 20 }}>
        <h2>Sua foto</h2>
        <AvatarUpload
          currentAvatar={avatarUrl}
          onUpdated={(url) => {
            setAvatarUrl(url);
            // Avisa o cabeçalho pra trocar a foto na hora, sem recarregar.
            window.dispatchEvent(new Event("avatar-changed"));
          }}
        />
        {user && (
          <Link to={`/jogador/${user.id}`} className="btn secondary" style={{ marginTop: 14, display: "inline-block" }}>
            Ver como os outros veem seu perfil →
          </Link>
        )}
      </div>

      {/* Troca única de nick.
          Quem entrou pelo Google recebeu um nick gerado do nome da conta
          ("JoaoSilva2") sem escolher nada — e o nick aparece em toda sala, no
          ranking e no chat. O card só aparece pra quem ainda tem a troca
          disponível; depois de usada, some. */}
      {podeTrocarNick && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2>Trocar meu nickname</h2>
          {/* O aviso de "uma vez" ganha um bloco próprio, com borda e cor de
              alerta, em vez de ficar diluído no parágrafo: é uma decisão
              irreversível e a pessoa precisa parar pra ler antes de digitar. */}
          <div className="nick-aviso-unico">
            <span className="material-symbols-outlined">warning</span>
            <div>
              <strong>Atenção: isso só pode ser feito UMA vez.</strong>
              <span>
                Depois da troca, o nickname fica fixo para sempre — não dá para mudar de novo.
                É o nome que aparece no ranking, nos títulos e no histórico de campeões.
              </span>
            </div>
          </div>
          <form onSubmit={trocarNick} style={{ display: "flex", gap: 8, maxWidth: 380 }}>
            <input
              value={novoNick}
              onChange={(e) => setNovoNick(e.target.value)}
              placeholder="Novo nickname"
              maxLength={15}
              style={{ flex: 1, minWidth: 0 }}
            />
            <button className="btn" type="submit">Trocar</button>
          </form>
          <p style={{ color: "var(--text-dim)", fontSize: 12, marginTop: 6 }}>
            3 a 15 caracteres, apenas letras, números e underline.
          </p>
          {nickErro && <div className="error-msg">{nickErro}</div>}
          {nickMsg && <div className="success-msg">{nickMsg}</div>}
        </div>
      )}

      <div className="card" style={{ marginBottom: 20 }}>
        <h2>{hasPassword ? "Trocar senha" : "Definir senha"}</h2>
        <p style={{ color: "var(--text-dim)", fontSize: 13 }}>
          {hasPassword
            ? "Escolha uma senha nova pra sua conta."
            : "Sua conta entrou pelo Google e ainda não tem senha própria. Defina uma se quiser poder entrar também pelo formulário normal (e-mail + senha), sem depender do Google."}
        </p>
        {passwordError && <div className="error-msg">{passwordError}</div>}
        <form onSubmit={handlePasswordSave}>
          {hasPassword && (
            <input
              type="password"
              placeholder="Senha atual"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          )}
          <input
            type="password"
            placeholder="Senha nova (mín. 8 caracteres)"
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirme a senha nova"
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button className="btn" type="submit">{hasPassword ? "Trocar senha" : "Definir senha"}</button>
          {passwordSaved && <span style={{ marginLeft: 12, color: "#06d6a0", fontSize: 13 }}>✓ Salvo!</span>}
        </form>
      </div>

      <div className="card">
        <h2>Comemoração do Quiz</h2>
        <p style={{ color: "var(--text-dim)", fontSize: 13 }}>
          Essa frase aparece no chat toda vez que você acerta uma pergunta no Quiz. Máximo de 20
          caracteres. Deixe em branco pra não ter comemoração especial.
        </p>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSave}>
          <input
            value={celebration}
            onChange={(e) => setCelebration(e.target.value.slice(0, 20))}
            maxLength={20}
            placeholder="Ex: mandou bem!"
          />
          <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: -8, marginBottom: 12 }}>
            {celebration.length}/20
          </div>
          <button className="btn" type="submit">Salvar</button>
          {saved && <span style={{ marginLeft: 12, color: "#06d6a0", fontSize: 13 }}>✓ Salvo!</span>}
        </form>
      </div>
        </div>

        <div className="perfil-col">
          <TitulosPerfil userId={user?.id} podeEscolher />
        </div>
      </div>
    </div>
  );
}
