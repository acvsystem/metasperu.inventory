// true: APIs locales para pruebas. false: servidor de METAS Perú.
// Reinicia ng serve o recompila después de cambiar este valor.
export const isLocalService = true;

export function createServiceConfig(local: boolean, hostname = 'localhost') {
  const localHost = hostname === '127.0.0.1' ? '127.0.0.1' : 'localhost';
  const server = 'https://api.metasperu.net.pe';
  return {
    authApiUrl: `${local ? `http://${localHost}:3000` : server}/s2/auth`,
    inventoryApiUrl: `${local ? `http://${localHost}:3001` : server}/s3/inventory`,
    socketUrl: local ? `http://${localHost}:3001` : server,
    socketPath: local ? '/socket.io/' : '/s3/socket/',
  };
}

export const serviceConfig = createServiceConfig(isLocalService, globalThis.location?.hostname);

export function isServiceApiRequest(url: URL, config = serviceConfig): boolean {
  return [config.authApiUrl, config.inventoryApiUrl].some((base) => {
    const api = new URL(base);
    return url.origin === api.origin &&
      (url.pathname === api.pathname || url.pathname.startsWith(`${api.pathname}/`));
  });
}
