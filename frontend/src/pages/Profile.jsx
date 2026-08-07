import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import Seo from "../components/Seo.jsx";

export default function Profile() {
  const [celebration, setCelebration] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/users/me")
      .then(({ data }) => setCelebration(data.celebration || ""))
      .finally(() => setLoading(false));
  }, []);

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

  if (loading) return <p>Carregando...</p>;

  return (
    <div>
      <Seo title="Meu Perfil" />
      <h1>Meu Perfil</h1>
      <div className="card" style={{ maxWidth: 480 }}>
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
  );
}
