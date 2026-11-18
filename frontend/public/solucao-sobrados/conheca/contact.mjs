export const CONTACT_EMAIL = 'Sobradosvendas@moove.ai';
export const CONTACT_INTERESTS = Object.freeze({
  teste: 'Solicitar acesso',
  contratacao: 'Conversar sobre contratação',
  duvida: 'Tirar uma dúvida',
});
export const CONTACT_LIMITS = Object.freeze({name: 100, email: 254, company: 120, message: 1000});

export class ContactValidationError extends Error {
  constructor(field, message) { super(message); this.name = 'ContactValidationError'; this.field = field; }
}

export function validateContact(values = {}) {
  const result = {};
  for (const field of ['name', 'email', 'company', 'message']) {
    const raw = values[field];
    if (raw != null && typeof raw !== 'string') throw new ContactValidationError(field, 'Confira este campo.');
    const value = (raw || '').replace(/\r\n?/g, '\n').trim();
    const invalid = field === 'message' ? /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/ : /[\u0000-\u001f\u007f]/;
    if (invalid.test(value)) throw new ContactValidationError(field, 'Remova os caracteres inválidos deste campo.');
    if (value.length > CONTACT_LIMITS[field]) throw new ContactValidationError(field, `Use até ${CONTACT_LIMITS[field]} caracteres.`);
    result[field] = value;
  }
  if (result.name.length < 2) throw new ContactValidationError('name', 'Informe seu nome com pelo menos 2 caracteres.');
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(result.email)) throw new ContactValidationError('email', 'Informe um e-mail válido.');
  if (!result.message) throw new ContactValidationError('message', 'Escreva uma mensagem sobre o que você precisa.');
  if (!Object.hasOwn(CONTACT_INTERESTS, values.interest)) throw new ContactValidationError('interest', 'Escolha o assunto do contato.');
  result.interest = values.interest;
  return result;
}

export function buildContactRequest(values) {
  const data = validateContact(values);
  const subject = `Solução Sobrados — ${CONTACT_INTERESTS[data.interest]}`;
  const body = [
    'Olá, equipe Solução Sobrados!', '',
    `Nome: ${data.name}`, `E-mail para retorno: ${data.email}`,
    ...(data.company ? [`Empresa: ${data.company}`] : []),
    `Interesse: ${CONTACT_INTERESTS[data.interest]}`, '', data.message.replace(/\n/g, '\r\n'),
  ].join('\r\n');
  return {
    recipient: CONTACT_EMAIL, subject, body,
    url: `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    copyText: `Para: ${CONTACT_EMAIL}\nAssunto: ${subject}\n\n${body.replace(/\r\n/g, '\n')}`,
  };
}

// This only prepares a message. Sending is always confirmed in the visitor's mail app.
export function mountContact(root = document, options = {}) {
  const form = root.querySelector('#contact-form');
  if (!form) return () => {};
  const fieldset = root.querySelector('#contact-fields');
  const status = root.querySelector('#contact-status');
  const preview = root.querySelector('#contact-preview');
  const copyButton = root.querySelector('#contact-copy');
  const directLink = root.querySelector('#contact-email');
  const view = root.defaultView || root.ownerDocument?.defaultView || globalThis;
  const openMail = options.openMail || (url => view.location.assign(url));
  const copyText = options.copyText || (text => {
    if (!view.navigator?.clipboard?.writeText) throw new Error('Clipboard unavailable');
    return view.navigator.clipboard.writeText(text);
  });
  const input = name => form.elements.namedItem(name);
  const announce = text => { if (status) status.textContent = text; };
  const clearError = event => event.target?.setCustomValidity?.('');
  for (const field of ['name', 'email', 'company', 'message']) {
    if (input(field)) { input(field).maxLength = CONTACT_LIMITS[field]; input(field).required = field !== 'company'; }
  }
  if (input('email')) input('email').type = 'email';
  if (input('interest')) {
    input('interest').required = true;
    if (!Object.hasOwn(CONTACT_INTERESTS, input('interest').value)) input('interest').value = 'teste';
  }
  if (directLink) directLink.href = `mailto:${CONTACT_EMAIL}`;
  if (preview) preview.readOnly = true;

  function prepare() {
    if (!form.reportValidity()) return null;
    try {
      const request = buildContactRequest(Object.fromEntries(['name', 'email', 'company', 'interest', 'message'].map(name => [name, input(name)?.value || ''])));
      if (preview) { preview.value = request.copyText; preview.hidden = false; }
      return request;
    } catch (error) {
      if (!(error instanceof ContactValidationError)) throw error;
      const field = input(error.field);
      field?.setCustomValidity(error.message);
      field?.reportValidity();
      field?.focus();
      announce(error.message);
      return null;
    }
  }
  function selectPreview() { if (preview) { preview.hidden = false; preview.focus(); preview.select(); } }
  function submit(event) {
    event.preventDefault();
    const request = prepare();
    if (!request) return;
    announce('Pedido preparado. Revise e envie no seu aplicativo de e-mail. Se ele não abrir, use Copiar pedido. Nada foi enviado por esta página.');
    try { openMail(request.url); }
    catch { selectPreview(); announce(`Não foi possível abrir seu e-mail. Copie o pedido abaixo e envie para ${CONTACT_EMAIL}. Nada foi enviado por esta página.`); }
  }
  async function copy(event) {
    event.preventDefault();
    const request = prepare();
    if (!request) return;
    try {
      await copyText(request.copyText);
      announce(`Pedido copiado. Cole em um e-mail para ${CONTACT_EMAIL}, revise e envie. Nada foi enviado por esta página.`);
    } catch {
      selectPreview();
      announce(`Selecione e copie o pedido abaixo, depois envie por e-mail para ${CONTACT_EMAIL}. Nada foi enviado por esta página.`);
    }
  }
  function chooseInterest(event) {
    const link = event.target?.closest?.('[data-interest]');
    if (!link || !Object.hasOwn(CONTACT_INTERESTS, link.dataset.interest)) return;
    const field = input('interest');
    if (field) { field.value = link.dataset.interest; field.setCustomValidity(''); field.focus({preventScroll: true}); }
  }
  form.addEventListener('submit', submit);
  form.addEventListener('input', clearError);
  form.addEventListener('change', clearError);
  copyButton?.addEventListener('click', copy);
  root.addEventListener('click', chooseInterest);
  // HTML starts disabled so unavailable JavaScript can never submit personal data by GET.
  if (fieldset) fieldset.disabled = false;
  return () => {
    if (fieldset) fieldset.disabled = true;
    form.removeEventListener('submit', submit);
    form.removeEventListener('input', clearError);
    form.removeEventListener('change', clearError);
    copyButton?.removeEventListener('click', copy);
    root.removeEventListener('click', chooseInterest);
  };
}
