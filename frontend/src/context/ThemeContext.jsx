import { createContext, useContext, useEffect } from "react";

const ThemeContext = createContext(null);

// Alternador de tema temporariamente desativado — fica travado em "dark".
// Toda a estrutura (paleta clara, logos alternativas, lógica de troca) já
// está pronta no CSS e nos componentes; pra reativar no futuro, basta trocar
// esse valor fixo de volta por um estado controlável (useState + toggle).
const FIXED_THEME = "dark";

export function ThemeProvider({ children }) {
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", FIXED_THEME);
  }, []);

  function toggleTheme() {
    // desativado por enquanto — não faz nada
  }

  return (
    <ThemeContext.Provider value={{ theme: FIXED_THEME, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
