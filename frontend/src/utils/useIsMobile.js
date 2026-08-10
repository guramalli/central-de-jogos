import { useEffect, useState } from "react";

// Detecta telas estreitas (mobile) de forma reativa — atualiza sozinho se a
// pessoa girar o celular ou redimensionar a janela.
export function useIsMobile(breakpoint = 700) {
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia(`(max-width: ${breakpoint}px)`).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);

  return isMobile;
}

// Detecta a plataforma pra registrar no perfil. Combina o tamanho da tela
// com o user agent: tela pequena OU dispositivo de toque conta como mobile,
// porque nem todo celular tem tela estreita (tablets, celular deitado).
export function detectarPlataforma() {
  try {
    const telaPequena = window.matchMedia("(max-width: 820px)").matches;
    const temToque = navigator.maxTouchPoints > 0;
    const ua = /Android|iPhone|iPad|iPod|Mobile|Opera Mini/i.test(navigator.userAgent || "");
    return telaPequena || (temToque && ua) ? "mobile" : "desktop";
  } catch {
    return "desktop";
  }
}
