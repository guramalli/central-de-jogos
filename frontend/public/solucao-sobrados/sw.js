/* Public application shell only. Never cache APIs, accounts, uploads or form writes. */
const VERSION = '20261119-photo31';
const APP_BASE = new URL(self.registration.scope);
const CACHE_PREFIX = `solucao-sobrados-public:${APP_BASE.pathname}:`;
const CACHE_NAME = CACHE_PREFIX + VERSION;
// Exact paths and query strings are deliberate. New module versions fall through to
// the network until their matching worker is activated. Do not use ignoreSearch.
const PUBLIC_FILES = [
  'tutorials-ui.mjs?v=20261119-tutorial17',
  'tutorials-content.mjs?v=20261119-tutorial17',
  'tutorials.css?v=20261119-tutorial17',
  'commercial-ui.mjs?v=20261119-checkout21',
  'commercial.css?v=20261119-commerce15',
  'jpeg-privacy.mjs?v=20261119-photo14',
  './',
  'reports-ui.mjs?v=20261119-viability30',
  'reports-domain.mjs?v=20261119-viability30',
  'reports-pdf.mjs?v=20261118-reports12',
  'reports.css?v=20261118-reports12',
  'app.mjs?v=20261119-photo31',
  'pwa.mjs?v=20261119-photo31',
  'styles.css?v=20261119-photo31',
  'access-domain.mjs?v=20261118-access8',
  'account-ui.mjs?v=20261119-recovery22',
  'account.css?v=20261119-recovery22',
  'maintenance-ui.mjs?v=20261119-photo31',
  'maintenance.css?v=20261118-maintenance13',
  'market-search.mjs?v=20261118-access8',
  'market-search.mjs?v=20261118-sales5',
  'domain.mjs?v=20261119-viability30',
  'domain.mjs?v=20261118-trash1',
  'demo.mjs?v=20261118-access8',
  'diary.mjs?v=20261119-photo31',
  'diary.css?v=20261119-photo31',
  'project-photo.mjs?v=20261119-recovery22',
  'documents-ui.mjs?v=20261118-access8',
  'documents.css?v=20261118-access8',
  'reminders-ui.mjs?v=20261118-access8',
  'reminder-domain.mjs?v=20261118-trash1',
  'reminders.css?v=20261118-access8',
  'manifest.webmanifest?v=20261119-dialog23',
  'pwa-icons/icon-180.png',
  'pwa-icons/icon-192.png',
  'pwa-icons/icon-512.png',
];
const ALLOWED = new Set(PUBLIC_FILES.map(path => new URL(path, APP_BASE).href));
const SHELL_URL = new URL('./', APP_BASE).href;
const INDEX_URL = new URL('index.html', APP_BASE).href;

function isPublicResponse(response, url) {
  if (!response || response.status !== 200 || response.redirected || !['basic', 'default'].includes(response.type)) return false;
  if (response.url && response.url !== url) return false;
  const type = (response.headers.get('Content-Type') || '').split(';')[0].trim().toLowerCase();
  const pathname = new URL(url).pathname;
  if (url === SHELL_URL) return type === 'text/html';
  if (pathname.endsWith('.mjs')) return ['text/javascript', 'application/javascript'].includes(type);
  if (pathname.endsWith('.css')) return type === 'text/css';
  if (pathname.endsWith('.webmanifest')) return ['application/manifest+json', 'application/json'].includes(type);
  if (pathname.endsWith('.png')) return type === 'image/png';
  return false;
}

async function shellMatchesVersion(response) {
  const html = await response.clone().text();
  const resources = new Set([...html.matchAll(/<(?:script|link)\b[^>]*\b(?:src|href)=["']([^"']+)["']/gi)]
    .map(match => new URL(match[1], APP_BASE).href));
  return ['app.mjs', 'styles.css', 'pwa.mjs'].every(file => resources.has(new URL(`${file}?v=${VERSION}`, APP_BASE).href));
}

async function fetchPublic(url, signal) {
  // Even when a user is signed in, precaching cannot fetch personalized responses.
  return fetch(url, {credentials: 'omit', cache: 'no-store', redirect: 'error', signal});
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all([...ALLOWED].map(async url => {
      const response = await fetchPublic(url);
      if (!isPublicResponse(response, url) || url === SHELL_URL && !(await shellMatchesVersion(response))) throw new Error('Public shell resource unavailable');
      await cache.put(url, response);
    }));
    // Do not skipWaiting: existing pages may contain unsaved forms.
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

async function publicAsset(url) {
  const cache = await caches.open(CACHE_NAME).catch(() => null);
  const cached = await cache?.match(url).catch(() => undefined);
  if (cached) return cached;
  const response = await fetchPublic(url);
  if (cache && isPublicResponse(response, url)) await cache.put(url, response.clone()).catch(() => {});
  return response;
}

async function publicShell() {
  const cache = await caches.open(CACHE_NAME).catch(() => null);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    // Fresh HTML discovers new versioned modules on every visit.
    const response = await fetchPublic(SHELL_URL, controller.signal);
    if (isPublicResponse(response, SHELL_URL)) {
      // Keep this worker's offline shell paired with its own versioned assets.
      // A newer online HTML is returned, but belongs to the next worker's cache.
      if (cache && await shellMatchesVersion(response)) await cache.put(SHELL_URL, response.clone()).catch(() => {});
      return response;
    }
    return (await cache?.match(SHELL_URL).catch(() => undefined)) || response;
  } catch (error) {
    const cached = await cache?.match(SHELL_URL).catch(() => undefined);
    if (cached) return cached;
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || request.headers.has('Authorization') || request.headers.has('Range')) return;
  const url = new URL(request.url);
  if (url.origin !== APP_BASE.origin) return;
  // Only the static landing document is a navigation fallback. Unknown routes and
  // query strings, including API/account parameters, never enter this cache.
  if (request.mode === 'navigate' && (url.href === SHELL_URL || url.href === INDEX_URL)) {
    event.respondWith(publicShell());
  } else if (request.mode !== 'navigate' && url.href !== SHELL_URL && ALLOWED.has(url.href)) {
    event.respondWith(publicAsset(url.href));
  }
});
