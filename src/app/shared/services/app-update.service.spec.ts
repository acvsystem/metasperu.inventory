import { TestBed } from '@angular/core/testing';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { AppUpdateService, UPDATE_RELOAD } from './app-update.service';
import { PocketInventoryService } from './pocket-inventory.service';

describe('Safe application updates', () => {
  let events: Subject<VersionEvent>;
  let sw: any;
  let reload: jasmine.Spy;
  let pocket: any;
  let service: AppUpdateService;
  beforeEach(() => {
    events = new Subject();
    sw = { isEnabled: true, versionUpdates: events, unrecoverable: new Subject(),
      checkForUpdate: jasmine.createSpy().and.resolveTo(false),
      activateUpdate: jasmine.createSpy().and.resolveTo(true) };
    reload = jasmine.createSpy('reload');
    pocket = { prepareForAppUpdate: jasmine.createSpy().and.resolveTo(4) };
    TestBed.configureTestingModule({ providers: [
      { provide: SwUpdate, useValue: sw },
      { provide: PocketInventoryService, useValue: pocket },
      { provide: UPDATE_RELOAD, useValue: reload },
    ] });
    service = TestBed.inject(AppUpdateService);
  });
  function ready() {
    events.next({ type: 'VERSION_READY', currentVersion: { hash: 'old' },
      latestVersion: { hash: 'new', appData: { version: '2.0.0', title: 'Mejoras', changes: ['Conteos seguros'] } } });
  }
  it('notifies when downloaded, keeps the header indicator after dismissing, never reloads automatically', () => {
    ready(); expect(service.available()?.version).toBe('2.0.0');
    expect(service.noticeVisible()).toBeTrue(); service.dismissNotice();
    expect(service.noticeVisible()).toBeFalse(); expect(service.hasUpdate()).toBeTrue();
    expect(reload).not.toHaveBeenCalled();
  });
  it('waits for Pocket durability checks before activating and reloading', async () => {
    ready(); let finish!: (n: number) => void;
    pocket.prepareForAppUpdate.and.returnValue(new Promise<number>(resolve => finish = resolve));
    const result = service.applyUpdate(); expect(sw.activateUpdate).not.toHaveBeenCalled();
    finish(4); await result;
    expect(pocket.prepareForAppUpdate).toHaveBeenCalledTimes(1);
    expect(sw.activateUpdate).toHaveBeenCalledTimes(1); expect(reload).toHaveBeenCalledTimes(1);
  });
  it('does not activate or reload when a count is being saved or sent', async () => {
    ready(); pocket.prepareForAppUpdate.and.rejectWith(Error('Espere a que termine el envío.'));
    await service.applyUpdate(); expect(sw.activateUpdate).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled(); expect(service.error()).toContain('envío');
  });
  it('keeps the old app and data when activation fails, and allows retry', async () => {
    ready(); sw.activateUpdate.and.rejectWith(Error('network'));
    await service.applyUpdate(); expect(reload).not.toHaveBeenCalled(); expect(service.available()).not.toBeNull();
    sw.activateUpdate.and.resolveTo(true); await service.applyUpdate(); expect(reload).toHaveBeenCalledTimes(1);
  });
  it('does not update without a downloaded version', async () => {
    await service.applyUpdate(); expect(sw.activateUpdate).not.toHaveBeenCalled(); expect(reload).not.toHaveBeenCalled();
  });
  it('shows download failure without discarding the active version', () => {
    events.next({ type: 'VERSION_INSTALLATION_FAILED', version: { hash: 'bad' }, error: 'download' });
    expect(service.error()).toBeTruthy(); expect(reload).not.toHaveBeenCalled();
  });
  it('finds a version downloaded before the tab subscribed', () => {
    events.next({ type: 'NO_NEW_VERSION_DETECTED', version: {
      hash: 'cached-new', appData: { version: '2.0.0', title: 'Lista', changes: ['Mejora'] },
    } });
    expect(service.available()?.version).toBe('2.0.0'); expect(service.noticeVisible()).toBeTrue();
  });
});
