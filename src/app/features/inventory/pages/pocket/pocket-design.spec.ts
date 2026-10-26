import { signal } from '@angular/core';
import Pocket from './pocket';

describe('Pocket synchronization presentation', () => {
  let page: Pocket;
  beforeEach(() => {
    page = Object.create(Pocket.prototype);
    Object.assign(page, {
      isOnline: signal(true),
      pendingCount: signal(0),
      isSyncing: false,
      syncStatus: { phase: 'idle', confirmed: 0, total: 0 },
      operationMode: 'online',
    });
  });
  it('distinguishes an online connection from pending records', () => {
    page.pendingCount.set(3);
    expect((page as any).syncStateLabel).toBe('3 registros pendientes');
  });
  it('does not claim global synchronization when this device has no pending records', () => {
    expect((page as any).syncStateLabel).toBe('Sin pendientes en este dispositivo');
  });
  it('shows the offline storage state', () => {
    page.isOnline.set(false);
    expect((page as any).syncStateLabel).toBe('Sin conexión · guardando en el dispositivo');
  });
  it('shows confirmed progress while sending', () => {
    page.isSyncing = true;
    page.syncStatus = {
      sessionCode: 'TEST',
      phase: 'sending',
      confirmed: 2,
      total: 5,
      message: '',
      lastSuccess: null,
    };
    expect((page as any).syncStateLabel).toBe('Sincronizando · 2 de 5 confirmados');
  });
});
