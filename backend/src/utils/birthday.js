// Confere se hoje é o aniversário de alguém, comparando só dia+mês (ignora o
// ano). Usa os componentes UTC porque a data de nascimento é salva como
// "YYYY-MM-DD" (meia-noite UTC), então fica consistente não importa o fuso
// horário do servidor.
export function isBirthdayToday(birthDate) {
  if (!birthDate) return false;
  const today = new Date();
  const bd = new Date(birthDate);
  return bd.getUTCMonth() === today.getUTCMonth() && bd.getUTCDate() === today.getUTCDate();
}
