import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { MenuController } from '@ionic/angular/standalone';
import MainComponent from './main';
import { ThemeService } from '../../../../shared/services/theme.service';
import { PocketInventoryService } from '../../../../shared/services/pocket-inventory.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { StorageService } from '@metasperu/services/store.service';
import { InventoryService } from '@metasperu/services/inventory.service';

describe('account menu cleanup', () => {
  function setup() {
    const logout = jasmine.createSpy('logout').and.resolveTo();
    TestBed.configureTestingModule({ providers: [
      { provide: ThemeService, useValue: {} },
      { provide: PocketInventoryService, useValue: {} },
      { provide: AuthService, useValue: { currentUser: signal('Tester'), logout } },
      { provide: Router, useValue: { url: '/inventory/session' } },
      { provide: MenuController, useValue: {} },
      { provide: StorageService, useValue: {} },
      { provide: InventoryService, useValue: {} },
    ] });
    const component = TestBed.runInInjectionContext(() => new MainComponent());
    return { component, logout };
  }

  it('waits for the account overlay to close before logging out and navigating', async () => {
    const { component, logout } = setup();
    let finishDismiss!: (value: boolean) => void;
    const dismiss = jasmine.createSpy('dismiss').and.returnValue(new Promise<boolean>(resolve => finishDismiss = resolve));
    component.accountPopover = { dismiss } as any;
    const result = component.logout();
    expect(dismiss).toHaveBeenCalled();
    expect(logout).not.toHaveBeenCalled();
    finishDismiss(true);
    await result;
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('dismisses its account overlay when the layout is destroyed', () => {
    const { component } = setup();
    const dismiss = jasmine.createSpy('dismiss').and.resolveTo(true);
    component.accountPopover = { dismiss } as any;
    component.ngOnDestroy();
    expect(dismiss).toHaveBeenCalledTimes(1);
  });
});
