import { computed, DestroyRef, inject, Injectable, InjectionToken, Injector, signal } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { APP_RELEASE } from '../../core/config/app-release';
import { PocketInventoryService } from './pocket-inventory.service';

export interface AppRelease { version: string; title: string; changes: string[]; }
export const UPDATE_RELOAD = new InjectionToken<() => void>('UPDATE_RELOAD', {
  providedIn: 'root', factory: () => () => window.location.reload(),
});

function releaseInfo(data: unknown): AppRelease {
  const value = data as Partial<AppRelease> | undefined;
  return {
    version: typeof value?.version === 'string' ? value.version : 'Nueva versión',
    title: typeof value?.title === 'string' ? value.title : 'Mejoras de la aplicación',
    changes: Array.isArray(value?.changes) ? value.changes.filter((x): x is string => typeof x === 'string') : [],
  };
}

@Injectable({ providedIn: 'root' })
export class AppUpdateService {
  private readonly sw = inject(SwUpdate, { optional: true });
  private readonly destroy = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly reload = inject(UPDATE_RELOAD);
  readonly current = APP_RELEASE;
  readonly supported = !!this.sw?.isEnabled;
  readonly available = signal<AppRelease | null>(null);
  readonly downloading = signal(false);
  readonly checking = signal(false);
  readonly applying = signal(false);
  readonly error = signal('');
  readonly noticeVisible = signal(false);
  readonly hasUpdate = computed(() => !!this.available() || this.downloading());
  private lastCheck = 0;
  private readyHash = '';

  constructor() {
    if (!this.sw?.isEnabled) return;
    this.sw.versionUpdates.pipe(takeUntilDestroyed()).subscribe(event => {
      if (event.type === 'VERSION_DETECTED') { this.downloading.set(true); this.error.set(''); }
      if (event.type === 'VERSION_READY') {
        this.downloading.set(false);
        this.available.set(releaseInfo(event.latestVersion.appData));
        if (this.readyHash !== event.latestVersion.hash) this.noticeVisible.set(true);
        this.readyHash = event.latestVersion.hash;
        this.error.set('');
      }
      if (event.type === 'VERSION_INSTALLATION_FAILED') {
        this.downloading.set(false);
        this.error.set('No se pudo descargar la actualización. Tus conteos siguen guardados. Vuelve a buscar actualizaciones.');
      }
      // The worker may have finished downloading before this tab subscribed (for example at login).
      if (event.type === 'NO_NEW_VERSION_DETECTED' &&
          releaseInfo(event.version.appData).version !== 'Nueva versión' &&
          releaseInfo(event.version.appData).version !== this.current.version) {
        this.available.set(releaseInfo(event.version.appData));
        if (this.readyHash !== event.version.hash) this.noticeVisible.set(true);
        this.readyHash = event.version.hash;
      }
    });
    this.sw.unrecoverable.pipe(takeUntilDestroyed()).subscribe(() => {
      this.error.set('Esta versión necesita recuperarse. Con conexión, busca la actualización para volver a cargarla conservando tus conteos.');
      void this.check();
    });
    const checkWhenVisible = () => {
      if (!document.hidden && Date.now() - this.lastCheck > 30_000) void this.check();
    };
    const interval = window.setInterval(checkWhenVisible, 120_000);
    window.addEventListener('online', checkWhenVisible);
    window.addEventListener('focus', checkWhenVisible);
    document.addEventListener('visibilitychange', checkWhenVisible);
    this.destroy.onDestroy(() => {
      clearInterval(interval);
      window.removeEventListener('online', checkWhenVisible);
      window.removeEventListener('focus', checkWhenVisible);
      document.removeEventListener('visibilitychange', checkWhenVisible);
    });
    void this.check();
  }

  dismissNotice() { this.noticeVisible.set(false); }

  async check() {
    if (!this.sw?.isEnabled || this.checking() || this.applying()) return;
    if (!navigator.onLine) { this.error.set('Conéctate a internet para buscar actualizaciones.'); return; }
    this.checking.set(true); this.error.set(''); this.lastCheck = Date.now();
    try { await this.sw.checkForUpdate(); }
    catch { this.error.set('No se pudo comprobar la versión. Puedes seguir trabajando y reintentar.'); }
    finally { this.checking.set(false); }
  }

  async applyUpdate() {
    if (!this.available() || !this.sw?.isEnabled || this.applying()) return;
    if (!navigator.onLine) { this.error.set('Conéctate a internet antes de actualizar. Tus pendientes siguen en este dispositivo.'); return; }
    this.applying.set(true); this.error.set('');
    try {
      await this.injector.get(PocketInventoryService).prepareForAppUpdate();
      // Reload immediately after activation: never mix old components with new lazy bundles.
      if (!await this.sw.activateUpdate()) throw new Error('No se pudo activar la nueva versión. Busca actualizaciones y reintenta.');
      this.reload();
    } catch (error) {
      this.error.set(error instanceof Error && !/network/i.test(error.message)
        ? error.message : 'No se pudo activar la actualización. Tus conteos siguen guardados; reintenta.');
      this.applying.set(false);
    }
  }
}
