import {createHmac, timingSafeEqual} from 'node:crypto';

// Fixed commercial offer. Never accept amount, currency or API origin from a browser.
export const MP_MONTHLY_AMOUNT = 350;
export const MP_CURRENCY = 'BRL';
const API_ORIGIN = 'https://api.mercadopago.com';
const RESOURCE_ID = /^[A-Za-z0-9_-]{1,128}$/;
const REFERENCE = /^[A-Za-z0-9_-]{1,128}$/;
const TYPES = new Set(['payment', 'subscription_preapproval', 'subscription_authorized_payment']);
const MAX_RESPONSE_BYTES = 256 * 1024;

export class MercadoPagoError extends Error {
  constructor(message, status = 502, code = 'provider_error') {
    super(message);
    this.name = 'MercadoPagoError';
    this.status = status;
    this.code = code;
  }
}
const ensure = (condition, message, status, code) => {
  if (!condition) throw new MercadoPagoError(message, status, code);
};
const scalar = value => typeof value === 'string' ? value : (typeof value === 'number' && Number.isSafeInteger(value) ? String(value) : '');
const resourceId = value => {
  const id = scalar(value);
  ensure(RESOURCE_ID.test(id), 'Identificador de cobrança inválido.', 422, 'invalid_id');
  return id;
};
const referenceId = value => {
  const reference = scalar(value);
  ensure(REFERENCE.test(reference), 'Referência da assinatura inválida.', 422, 'invalid_reference');
  return reference;
};
const trustedReturnUrl = value => {
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' && !url.username && !url.password && !url.hash && !url.search) return url.href;
  } catch {}
  return '';
};
const matchAmount = object => ensure(
  (typeof object?.transaction_amount === 'number' || typeof object?.transaction_amount === 'string') &&
  Number(object.transaction_amount) === MP_MONTHLY_AMOUNT && object.currency_id === MP_CURRENCY,
  'Valor ou moeda da cobrança não corresponde à assinatura.', 422, 'unexpected_amount'
);
const matchReference = (object, expected, allowMissing = false) => {
  const actual = scalar(object?.external_reference);
  if (!actual && allowMissing && expected) return;
  ensure(REFERENCE.test(actual) && (!expected || actual === expected),
    'Cobrança sem vínculo válido com esta assinatura.', 422, 'unexpected_reference');
};
const readValue = (container, key) => {
  if (container instanceof URLSearchParams) {
    const values = container.getAll(key);
    return values.length === 1 ? values[0] : undefined;
  }
  if (typeof Headers !== 'undefined' && container instanceof Headers) return container.get(key);
  return container?.[key];
};

/**
 * baseUrl is the exact trusted public return URL, not an API base.
 * Trial/access state and durable event idempotency belong to CommercialService.
 * No outbound request is retried automatically: an ambiguous create must be
 * reconciled against its persisted local reference before another checkout.
 */
export function createMercadoPagoProvider({
  fetchImpl = globalThis.fetch,
  accessToken = process.env.SS_MP_ACCESS_TOKEN || '',
  webhookSecret = process.env.SS_MP_WEBHOOK_SECRET || '',
  collectorId = process.env.SS_MP_COLLECTOR_ID || '',
  baseUrl = process.env.SS_PUBLIC_APP_URL || ''
} = {}) {
  const receiver = scalar(collectorId);
  const returnUrl = trustedReturnUrl(baseUrl);
  const configured = typeof accessToken === 'string' && accessToken.length > 0 &&
    !/[\r\n]/.test(accessToken) && typeof webhookSecret === 'string' && webhookSecret.length > 0 &&
    /^[1-9]\d{0,19}$/.test(receiver) && Boolean(returnUrl) && typeof fetchImpl === 'function';
  const verifiedNotices = new WeakSet();
  const ready = () => ensure(configured, 'Pagamento online ainda não configurado.', 503, 'not_configured');
  const matchReceiver = object => ensure(scalar(object?.collector_id) === receiver,
    'Cobrança pertence a outra conta recebedora.', 422, 'unexpected_receiver');

  async function request(path, {method = 'GET', body} = {}) {
    ready();
    let response;
    try {
      response = await fetchImpl(API_ORIGIN + path, {
        method, redirect:'error', signal:AbortSignal.timeout(12000),
        headers:{Authorization:'Bearer ' + accessToken, Accept:'application/json', 'Content-Type':'application/json'},
        ...(body ? {body:JSON.stringify(body)} : {})
      });
    } catch {
      throw new MercadoPagoError('Não foi possível confirmar a operação no Mercado Pago. Tente consultar novamente.', 503, 'provider_unavailable');
    }
    // Do not return provider payloads/errors: they can contain personal data or credentials.
    ensure(response.ok, 'O Mercado Pago não confirmou a operação.', 502, 'provider_rejected');
    let data;
    try {
      const length = Number(response.headers?.get?.('content-length') || 0);
      ensure(length <= MAX_RESPONSE_BYTES, 'Resposta de cobrança excedeu o limite.');
      const chunks = [];
      let total = 0;
      for await (const chunk of response.body) {
        total += chunk.byteLength;
        ensure(total <= MAX_RESPONSE_BYTES, 'Resposta de cobrança excedeu o limite.');
        chunks.push(Buffer.from(chunk));
      }
      data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
      throw new MercadoPagoError('Resposta inválida do Mercado Pago.', 502, 'invalid_response');
    }
    ensure(data && typeof data === 'object' && !Array.isArray(data), 'Resposta inválida do Mercado Pago.', 502, 'invalid_response');
    return data;
  }
  function validateSubscription(data, {id, reference} = {}) {
    if (id) ensure(scalar(data.id) === id, 'Assinatura divergente.', 422, 'unexpected_id');
    else resourceId(data.id);
    matchReceiver(data);
    matchAmount(data.auto_recurring);
    ensure(data.auto_recurring.frequency === 1 && data.auto_recurring.frequency_type === 'months',
      'Recorrência diferente do plano mensal.', 422, 'unexpected_recurrence');
    matchReference(data, reference);
    return data;
  }
  async function fetchSubscription(id, {reference} = {}) {
    const cleanId = resourceId(id);
    return validateSubscription(await request('/preapproval/' + cleanId), {
      id:cleanId, reference:reference === undefined ? undefined : referenceId(reference)
    });
  }
  async function createSubscription({reference, email, backUrl} = {}) {
    ready();
    const cleanReference = referenceId(reference);
    ensure(typeof email === 'string' && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
      'Informe um e-mail válido para a assinatura.', 422, 'invalid_email');
    ensure(backUrl === undefined || trustedReturnUrl(backUrl) === returnUrl,
      'Endereço de retorno não autorizado.', 422, 'invalid_return_url');
    const data = validateSubscription(await request('/preapproval', {
      method:'POST',
      body:{
        reason:'Solução Sobrados — assinatura mensal',
        external_reference:cleanReference, payer_email:email.trim().toLowerCase(),
        auto_recurring:{frequency:1, frequency_type:'months', transaction_amount:MP_MONTHLY_AMOUNT, currency_id:MP_CURRENCY},
        back_url:returnUrl, status:'pending'
      }
    }), {reference:cleanReference});
    let checkout;
    try { checkout = new URL(data.init_point); } catch {}
    ensure(checkout?.protocol === 'https:' && checkout.hostname === 'www.mercadopago.com.br' &&
      !checkout.username && !checkout.password && !checkout.port &&
      checkout.pathname === '/subscriptions/checkout' &&
      checkout.searchParams.getAll('preapproval_id').length === 1 &&
      checkout.searchParams.get('preapproval_id') === scalar(data.id),
      'Link de assinatura inválido.', 502, 'invalid_checkout_url');
    ensure(data.status === 'pending', 'Assinatura não está aguardando autorização.', 502, 'unexpected_status');
    return data;
  }
  async function cancelSubscription(id, {reference} = {}) {
    // Always bind cancellation to a known local reference before any mutation.
    const expected = referenceId(reference);
    const current = await fetchSubscription(id, {reference:expected});
    if (current.status === 'cancelled') return current;
    const result = validateSubscription(await request('/preapproval/' + resourceId(id), {
      method:'PUT', body:{status:'cancelled'}
    }), {id:scalar(id), reference:expected});
    ensure(result.status === 'cancelled', 'Cancelamento ainda não confirmado.', 502, 'unexpected_status');
    return result;
  }
  async function fetchPayment(id, {reference, allowMissingReference = false} = {}) {
    const cleanId = resourceId(id);
    const expected = reference === undefined ? undefined : referenceId(reference);
    const data = await request('/v1/payments/' + cleanId);
    ensure(scalar(data.id) === cleanId, 'Pagamento divergente.', 422, 'unexpected_id');
    ensure(data.live_mode === true, 'Pagamento de teste não libera acesso comercial.', 422, 'test_payment');
    matchReceiver(data);
    matchAmount(data);
    // Recurring payment can omit external_reference. Only an authenticated invoice
    // already linked to the local subscription may supply that missing binding.
    matchReference(data, expected, allowMissingReference);
    return data;
  }
  async function fetchAuthorizedPayment(id, {reference} = {}) {
    const cleanId = resourceId(id);
    const data = await request('/authorized_payments/' + cleanId);
    ensure(scalar(data.id) === cleanId, 'Fatura divergente.', 422, 'unexpected_id');
    matchAmount(data);
    matchReference(data, reference === undefined ? undefined : referenceId(reference));
    // Invoice response does not carry collector_id; check its parent subscription.
    await fetchSubscription(data.preapproval_id, {reference:scalar(data.external_reference)});
    return data;
  }
  function verifyWebhook({headers, query, body} = {}) {
    ready();
    const invalid = () => { throw new MercadoPagoError('Notificação de pagamento inválida.', 401, 'invalid_signature'); };
    const signature = readValue(headers, 'x-signature');
    const requestId = readValue(headers, 'x-request-id');
    const id = readValue(query, 'data.id');
    if (typeof signature !== 'string' || signature.length > 512 ||
        typeof requestId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(requestId) ||
        typeof id !== 'string' || !RESOURCE_ID.test(id)) invalid();
    const parts = Object.create(null);
    for (const part of signature.split(',')) {
      const match = /^\s*(ts|v\d+)\s*=\s*([a-fA-F0-9]+)\s*$/.exec(part);
      if (!match || parts[match[1]]) invalid();
      parts[match[1]] = match[2];
    }
    if (!/^\d{1,16}$/.test(parts.ts || '') || !/^[a-fA-F0-9]{64}$/.test(parts.v1 || '')) invalid();
    // Current official SDK preserves data.id case in this manifest.
    const manifest = 'id:' + id + ';request-id:' + requestId + ';ts:' + parts.ts + ';';
    const expected = createHmac('sha256', webhookSecret).update(manifest).digest();
    if (!timingSafeEqual(expected, Buffer.from(parts.v1, 'hex'))) invalid();
    const type = readValue(query, 'type') ?? body?.type;
    if (!TYPES.has(type) || (body?.type !== undefined && body.type !== type) ||
        (body?.data?.id !== undefined && scalar(body.data.id) !== id)) invalid();
    // No short expiry window: delayed provider retries must remain usable.
    // The service re-fetches current state and deduplicates payment IDs in SQL.
    const notice = Object.freeze({type, id, requestId, timestamp:parts.ts});
    verifiedNotices.add(notice);
    return notice;
  }
  return Object.freeze({
    configured, createSubscription, cancelSubscription, fetchSubscription,
    fetchAuthorizedPayment, fetchPayment, verifyWebhook,
    isVerifiedNotification:notice => Boolean(notice && verifiedNotices.has(notice))
  });
}
