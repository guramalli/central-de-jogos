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
