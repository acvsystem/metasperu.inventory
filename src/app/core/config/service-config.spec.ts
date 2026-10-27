import { createServiceConfig, isServiceApiRequest } from './service-config';

describe('service destination switch', () => {
  it('routes authentication, inventory, chat and sockets locally when enabled', () => {
    const config = createServiceConfig(true);
    expect(config.authApiUrl).toBe('http://localhost:3000/s2/auth');
    expect(config.inventoryApiUrl).toBe('http://localhost:3001/s3/inventory');
    expect(config.socketUrl).toBe('http://localhost:3001');
    expect(config.socketPath).toBe('/socket.io/');
    expect(isServiceApiRequest(new URL(config.inventoryApiUrl + '/chat/contacts'), config)).toBeTrue();
  });
  it('preserves loopback host so cookies use the same hostname during local tests', () => {
    const config = createServiceConfig(true, '127.0.0.1');
    expect(config.authApiUrl).toBe('http://127.0.0.1:3000/s2/auth');
    expect(config.socketUrl).toBe('http://127.0.0.1:3001');
  });
  it('routes every API and socket to the existing server when disabled', () => {
    const config = createServiceConfig(false);
    expect(config.authApiUrl).toBe('https://api.metasperu.net.pe/s2/auth');
    expect(config.inventoryApiUrl).toBe('https://api.metasperu.net.pe/s3/inventory');
    expect(config.socketUrl).toBe('https://api.metasperu.net.pe');
    expect(config.socketPath).toBe('/s3/socket/');
  });
  it('limits cookie credentials to exact API origins and paths of the selected destination', () => {
    for (const config of [createServiceConfig(true), createServiceConfig(false)]) {
      expect(isServiceApiRequest(new URL(config.authApiUrl + '/login'), config)).toBeTrue();
      expect(isServiceApiRequest(new URL(config.inventoryApiUrl + '/stores'), config)).toBeTrue();
      expect(isServiceApiRequest(new URL('https://api.metasperu.net.pe.evil.test/s2/auth/login'), config)).toBeFalse();
      expect(isServiceApiRequest(new URL('http://localhost:3009/s3/inventory/stores'), config)).toBeFalse();
      expect(isServiceApiRequest(new URL(config.inventoryApiUrl + '-other/stores'), config)).toBeFalse();
    }
    expect(isServiceApiRequest(new URL(createServiceConfig(false).authApiUrl + '/login'), createServiceConfig(true))).toBeFalse();
  });
});
