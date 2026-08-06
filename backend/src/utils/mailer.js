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
