// Only the public interface is cached. Account data and writes always stay online.
const appBase = new URL('./', import.meta.url);
const connection = document.createElement('aside');
connection.id = 'pwa-connection';
connection.className = 'pwa-connection';
connection.setAttribute('role', 'status');
connection.textContent = 'Sem conexão. Conecte-se à internet para entrar, consultar dados e salvar alterações.';
connection.hidden = navigator.onLine;
document.body.prepend(connection);
const updateConnection = () => { connection.hidden = navigator.onLine; };
window.addEventListener('online', updateConnection);
window.addEventListener('offline', updateConnection);

async function registerInterfaceCache() {
  if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
  try {
    const registration = await navigator.serviceWorker.register(new URL('sw.js', appBase), {
      scope: appBase.pathname,
      updateViaCache: 'none',
    });
    let lastCheck = 0;
    const checkForUpdate = () => {
      if (!navigator.onLine || document.visibilityState === 'hidden' || Date.now() - lastCheck < 60000) return;
      lastCheck = Date.now();
      registration.update().catch(() => {});
    };
    checkForUpdate();
    document.addEventListener('visibilitychange', checkForUpdate);
    window.addEventListener('online', checkForUpdate);
    // Normal worker activation avoids reloading forms or replacing a session mid-edit.
  } catch {
    // Installation is optional: the online app keeps working when storage is unavailable.
  }
}
if (document.readyState === 'complete') registerInterfaceCache();
else window.addEventListener('load', registerInterfaceCache, {once: true});
