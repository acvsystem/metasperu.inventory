import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { firstValueFrom, isObservable, of } from 'rxjs';
import { signal as stateSignal } from '@angular/core';
import { AuthService } from './auth.service';
import { authGuard } from './auth.guard';

describe('authGuard authorization', () => {
  const user = stateSignal<any>(null);
  let checkSession: jasmine.Spy;
  beforeEach(() => {
    user.set(null);
    checkSession = jasmine.createSpy().and.returnValue(of(false));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            user,
            isAuthenticated: () => !!user(),
            checkSession: (...args: any[]) => checkSession(...args),
          },
        },
      ],
    });
  });
  async function run(roles: string[]) {
    const result = TestBed.runInInjectionContext(() =>
      authGuard(
        { data: { roles } } as unknown as ActivatedRouteSnapshot,
        { url: '/inventory/users' } as RouterStateSnapshot,
      ),
    );
    return isObservable(result) ? firstValueFrom(result) : result;
  }
  it('does not allow an already authenticated pocket into administration', async () => {
    user.set({ role: 'pocket' });
    const result = await run(['administrador']);
    expect(result instanceof UrlTree).toBeTrue();
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/inventory/pocket');
  });
  it('uses the verified server role rather than an editable localStorage role', async () => {
    localStorage.setItem('role', 'administrador');
    checkSession.and.callFake(() => {
      user.set({ role: 'pocket' });
      return of(true);
    });
    const result = await run(['administrador']);
    expect(result instanceof UrlTree).toBeTrue();
    localStorage.removeItem('role');
  });
  it('redirects expired sessions to login and preserves the requested URL', async () => {
    const result = await run(['administrador']);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toContain('/login?returnUrl=');
  });
  it('allows an authorized administrator without redirecting away from the requested route', async () => {
    user.set({ role: 'administrador' });
    expect(await run(['administrador'])).toBeTrue();
  });
});
