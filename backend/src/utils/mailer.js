import nodemailer from "nodemailer";

const FEEDBACK_TO = "guramalli@gmail.com";

// O envio de e-mail é OPCIONAL — só funciona se EMAIL_USER e EMAIL_PASS
// estiverem configurados nas variáveis de ambiente (uma conta do Gmail com
// "senha de app" gerada). Sem isso configurado, o feedback continua sendo
// salvo no banco normalmente (visível no Painel Admin), só não manda e-mail.
let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
}

export async function sendFeedbackEmail({ nickname, email, type, message }) {
  if (!transporter) return false;
  try {
    await transporter.sendMail({
      from: `"Educação Gamer" <${process.env.EMAIL_USER}>`,
      to: FEEDBACK_TO,
      subject: `[Feedback - ${type}] de ${nickname}`,
      text: `De: ${nickname} (${email})\nTipo: ${type}\n\n${message}`,
    });
    return true;
  } catch (err) {
    console.error("Falha ao enviar e-mail de feedback:", err.message);
    return false;
  }
}

export async function sendPasswordResetEmail({ nickname, email, resetUrl }) {
  if (!transporter) return false;
  try {
    await transporter.sendMail({
      from: `"Educação Gamer" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Redefinir sua senha — Educação Gamer",
      text: `Oi, ${nickname}!\n\nRecebemos um pedido pra redefinir a senha da sua conta na Educação Gamer.\n\nClica no link abaixo pra escolher uma senha nova (válido por 1 hora):\n${resetUrl}\n\nSe você não pediu isso, pode ignorar esse e-mail — sua senha continua a mesma.`,
    });
    return true;
  } catch (err) {
    console.error("Falha ao enviar e-mail de redefinição de senha:", err.message);
    return false;
  }
}
