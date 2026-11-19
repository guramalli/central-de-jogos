// Optional password-reset transport. AccountService owns token hashing, expiry,
// revocation, enumeration protection and persistent abuse/volume limits.
// Configure a verified sending domain with open/click tracking disabled.
const SEND_URL = 'https://api.resend.com/emails';
const TOKEN = /^[A-Za-z0-9_-]{43}$/;
const REQUEST_ID = /^[A-Za-z0-9_-]{1,128}$/;
const MESSAGE_ID = /^[A-Za-z0-9_-]{1,128}$/;
const MAX_RESPONSE_BYTES = 16 * 1024;
const MAX_EXPIRY_MS = 30 * 60 * 1000;

export class RecoveryMailerError extends Error {
  constructor(message, status = 503, code = 'recovery_delivery_unavailable') {
    super(message);
    this.name = 'RecoveryMailerError';
    this.status = status;
    this.code = code;
  }
}
const ensure = (condition, message, status, code) => {
  if (!condition) throw new RecoveryMailerError(message, status, code);
};
const emailAddress = value => {
  if (typeof value !== 'string' || value.length > 254 || !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+$/.test(value)) return '';
  const [local,domain] = value.split('@');
  if (local.length > 64 || local.startsWith('.') || local.endsWith('.') || local.includes('..') || !domain.includes('.')) return '';
  if (domain.split('.').some(label => !/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/.test(label))) return '';
  return value.toLowerCase();
};
const trustedAppUrl = value => {
  if (typeof value !== 'string' || value.length > 2048 || /[\s\u0000-\u001f\u007f]/.test(value) || /%0[ad]/i.test(value)) return '';
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' && url.hostname && !url.username && !url.password && !url.port && !url.search && !url.hash && !value.includes('?') && !value.includes('#')) return url.href;
  } catch {}
  return '';
};

/**
 * This only checks local configuration, not DNS verification or provider quota.
 * appUrl is trusted server configuration; never pass request headers/body here.
 * No provider response, exception cause, token or recipient is logged/returned.
 */
export function createRecoveryMailer({
  enabled = process.env.SS_RECOVERY_ENABLED === 'true',
  registrationEnabled = process.env.SS_REGISTRATION_VERIFICATION_ENABLED === 'true',
  apiKey = process.env.SS_RESEND_API_KEY || '',
  from = process.env.SS_RECOVERY_FROM || '',
  appUrl = process.env.SS_PUBLIC_APP_URL || '',
  fetchImpl = globalThis.fetch,
  now = Date.now,
  timeoutMs = 8000
} = {}) {
  const sender = emailAddress(from), base = trustedAppUrl(appUrl);
  const validConfiguration = Boolean(sender) && Boolean(base) &&
    typeof apiKey === 'string' && apiKey.length > 0 && apiKey.length <= 512 && !/[\s\u0000-\u001f\u007f]/.test(apiKey) &&
    typeof fetchImpl === 'function' && typeof now === 'function' && Number.isSafeInteger(timeoutMs) && timeoutMs >= 1 && timeoutMs <= 8000;

  const configured = enabled === true && validConfiguration;
  const registrationConfigured = registrationEnabled === true && validConfiguration;
  async function send({email,token,requestId,expiresAt} = {}, registration = false) {
    ensure(registration ? registrationConfigured : configured, registration ? 'Confirmação de cadastro por e-mail ainda não configurada.' : 'Recuperação de senha por e-mail ainda não configurada.', 503, 'recovery_not_configured');
    const recipient = emailAddress(email);
    ensure(recipient && typeof token === 'string' && TOKEN.test(token) && Buffer.from(token,'base64url').toString('base64url') === token && typeof requestId === 'string' && REQUEST_ID.test(requestId),
      'Solicitação de recuperação inválida.', 422, 'invalid_recovery_message');
    const expiry = expiresAt instanceof Date ? expiresAt.valueOf() : typeof expiresAt === 'number' ? expiresAt : typeof expiresAt === 'string' ? Date.parse(expiresAt) : NaN;
    let current;
    try { current = Number(now()); } catch {}
    ensure(Number.isFinite(current) && Number.isFinite(expiry) && expiry > current && expiry - current <= MAX_EXPIRY_MS,
      'Prazo da recuperação inválido.', 422, 'invalid_recovery_expiry');
    const link = new URL(base);
    link.hash = (registration ? 'confirmar-email=' : 'redefinir-senha=') + token;
    const expiration = new Date(expiry).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',dateStyle:'short',timeStyle:'short'});
    const body = JSON.stringify({
      from:sender, to:[recipient], subject:registration ? 'Confirme seu e-mail — Solução Sobrados' : 'Redefinir sua senha — Solução Sobrados',
      text:(registration ? [
        'Recebemos um pedido para criar uma conta no Solução Sobrados.',
        'Para confirmar seu e-mail e escolher sua senha, abra este link:', link.href,
        `O link é de uso único e expira às ${expiration} (horário de Brasília).`,
        'Se você não solicitou o cadastro, ignore esta mensagem. Nenhuma conta será criada.'
      ] : [
        'Recebemos uma solicitação para redefinir a senha da sua conta no Solução Sobrados.',
        'Para escolher uma nova senha, abra este link:', link.href,
        `Este link é de uso único e vale por até 30 minutos a partir da solicitação, até ${expiration} (horário de Brasília).`,
        'Ao redefinir a senha, todas as sessões da conta serão encerradas. Entre novamente com a nova senha.',
        'Se você não solicitou esta alteração, ignore este e-mail. Sua senha continuará a mesma.',
        'Não compartilhe este link. Nossa equipe não pede sua senha.'
      ]).join('\n\n')
    });
    const controller = new AbortController();
    let timer;
    const timeout = new Promise((_,reject) => {
      timer = setTimeout(() => { controller.abort(); reject(new RecoveryMailerError('Não foi possível confirmar o envio do e-mail.')); },timeoutMs);
    });
    const operation = async () => {
      let response;
      try {
        response = await fetchImpl(SEND_URL,{
          method:'POST', redirect:'error', signal:controller.signal,
          headers:{Authorization:'Bearer ' + apiKey,'Content-Type':'application/json',Accept:'application/json','Idempotency-Key':(registration ? 'registration/' : 'recovery/') + requestId},
          body
        });
      } catch { throw new RecoveryMailerError('Não foi possível confirmar o envio do e-mail.'); }
      if (!response?.ok) {
        // Never consume error payloads: they can contain personal data or tokens.
        try { await response?.body?.cancel?.(); } catch {}
        throw new RecoveryMailerError('O serviço de e-mail não confirmou o envio.', 503, 'recovery_delivery_rejected');
      }
      let data;
      try {
        const length = Number(response.headers?.get?.('content-length') || 0);
        if (!Number.isFinite(length) || length < 0 || length > MAX_RESPONSE_BYTES) throw new Error();
        const chunks=[];
        let size=0;
        for await (const chunk of response.body) {
          size += chunk.byteLength;
          if (size > MAX_RESPONSE_BYTES) throw new Error();
          chunks.push(Buffer.from(chunk));
        }
        data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        if (!data || typeof data !== 'object' || Array.isArray(data) || typeof data.id !== 'string' || !MESSAGE_ID.test(data.id)) throw new Error();
      } catch { throw new RecoveryMailerError('Resposta inválida do serviço de e-mail.', 503, 'invalid_recovery_response'); }
      // Accepted by the provider is not a delivery-to-inbox guarantee.
      return Object.freeze({id:data.id});
    };
    try { return await Promise.race([operation(),timeout]); }
    finally { clearTimeout(timer);controller.abort(); }
  }
  return Object.freeze({configured,registrationConfigured,sendPasswordReset:input=>send(input),sendRegistrationVerification:input=>send(input,true)});
}
