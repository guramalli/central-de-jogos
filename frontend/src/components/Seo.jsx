import { Helmet } from "react-helmet-async";

// Componente reutilizável pra definir título e descrição de cada página —
// sem isso, toda página do site mostrava o mesmo título genérico, tanto na
// aba do navegador quanto (o que importa mais) nos resultados de busca.
export default function Seo({ title, description }) {
  const fullTitle = title ? `${title} — Educação Gamer` : "Educação Gamer";
  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
    </Helmet>
  );
}
