import { useEffect, useState } from "react";

// Convite pra instalar o site como app.
//
// O navegador só dispara o evento de instalação quando a pessoa já
// demonstrou algum interesse (visitou mais de uma vez, passou um tempo na
// página). Não dá pra forçar — o que dá é aproveitar bem quando ele vem.
//
// A faixa aparece uma vez; se a pessoa dispensar, não volta a incomodar.
const CHAVE_DISPENSADO = "eg_pwa_dispensado";

export default function InstalarApp() {
  const [evento, setEvento] = useState(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(CHAVE_DISPENSADO)) return;

    function aoPoderInstalar(e) {
      // Sem isso o Chrome mostra o próprio banner, no momento dele e com
      // texto genérico. Preferimos convidar no nosso tempo e com contexto.
      e.preventDefault();
      setEvento(e);
      setVisivel(true);
    }

    window.addEventListener("beforeinstallprompt", aoPoderInstalar);
    // Se a pessoa instalar por outro caminho (menu do navegador), some.
    window.addEventListener("appinstalled", () => setVisivel(false));

    return () => window.removeEventListener("beforeinstallprompt", aoPoderInstalar);
  }, []);

  async function instalar() {
    if (!evento) return;
    evento.prompt();
    await evento.userChoice;
    // Recusando ou aceitando, o evento não pode ser reutilizado.
    setEvento(null);
    setVisivel(false);
  }

  function dispensar() {
    localStorage.setItem(CHAVE_DISPENSADO, "1");
    setVisivel(false);
  }

  if (!visivel) return null;

  return (
    <div className="instalar-app">
      <img src="/pwa-192.png" alt="" className="instalar-app-icone" />
      <div className="instalar-app-texto">
        <strong>Instale o Educação Gamer</strong>
        <span>Fica com ícone na tela inicial, abre direto no jogo.</span>
      </div>
      <button className="instalar-app-btn" onClick={instalar}>
        Instalar
      </button>
      <button className="instalar-app-fechar" onClick={dispensar} aria-label="Dispensar">
        ✕
      </button>
    </div>
  );
}
