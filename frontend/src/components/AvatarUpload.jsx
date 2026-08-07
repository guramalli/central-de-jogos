import { useRef, useState } from "react";
import { api } from "../api/client.js";

const AVATAR_SIZE = 150; // pixels — pequeno de propósito, pra não pesar no banco

// Redimensiona a imagem escolhida pra um quadrado pequeno, direto no
// navegador (usando um <canvas> escondido), antes de mandar pro servidor —
// assim a imagem já chega pequena, sem precisar de nenhum processamento
// pesado do lado do servidor.
function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = AVATAR_SIZE;
        canvas.height = AVATAR_SIZE;
        const ctx = canvas.getContext("2d");

        // Corta o centro da imagem num quadrado, pra não distorcer o rosto
        // se a foto original for retangular.
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);

        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AvatarUpload({ currentAvatar, onUpdated }) {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(currentAvatar);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");

    if (!file.type.startsWith("image/")) {
      setError("Escolhe um arquivo de imagem (jpg, png, etc).");
      return;
    }

    setSaving(true);
    try {
      const resized = await resizeImage(file);
      const { data } = await api.post("/users/me/avatar", { avatarUrl: resized });
      setPreview(data.avatarUrl);
      onUpdated?.(data.avatarUrl);
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao enviar a foto.");
    } finally {
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemove() {
    setSaving(true);
    setError("");
    try {
      await api.delete("/users/me/avatar");
      setPreview(null);
      onUpdated?.(null);
    } catch {
      setError("Erro ao remover a foto.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="avatar-upload">
      <div className="avatar-upload-preview">
        {preview ? (
          <img src={preview} alt="Seu avatar" className="avatar-img avatar-img-large" />
        ) : (
          <div className="avatar-placeholder avatar-placeholder-large">🎮</div>
        )}
      </div>
      <div className="avatar-upload-actions">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={saving}
          style={{ display: "none" }}
          id="avatar-file-input"
        />
        <label htmlFor="avatar-file-input" className="btn secondary" style={{ cursor: "pointer" }}>
          {saving ? "Enviando..." : preview ? "Trocar foto" : "Enviar foto"}
        </label>
        {preview && (
          <button className="btn secondary" onClick={handleRemove} disabled={saving} type="button">
            Remover
          </button>
        )}
      </div>
      {error && <div className="error-msg" style={{ marginTop: 8 }}>{error}</div>}
    </div>
  );
}
