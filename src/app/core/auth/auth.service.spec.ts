import { serviceConfig } from '../config/service-config';
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { authInterceptor } from '../../shared/services/auth.interceptor';
import { InventoryService } from '@metasperu/services/inventory.service';
import { InventorySocketService } from '@metasperu/services/inventory-socket.service';

describe('protected browser sessions', () => {
  let http: HttpTestingController;
  const sockets = { connect: jasmine.createSpy(), disconnect: jasmine.createSpy() };
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: InventoryService, useValue: { onMenu: { emit() {} } } },
        { provide: InventorySocketService, useValue: sockets },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
  });
  afterEach(() => {
    http.verify();
    localStorage.removeItem('role');
    localStorage.removeItem('auth_token');
  });
  it('sends cookie credentials to the API and never saves a bearer token after login', () => {
    localStorage.setItem('auth_token', 'obsolete-test-token');
    const auth = TestBed.inject(AuthService);
    auth.login({ username: 'test', password: 'test' }).subscribe();
    const request = http.expectOne(serviceConfig.authApiUrl + '/login');
    expect(request.request.withCredentials).toBeTrue();
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush({ user: { id: 7, username: 'test', role: 'pocket' } });
    expect(auth.user()?.role).toBe('pocket');
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(sockets.connect).toHaveBeenCalled();
  });
  it('never adds API credentials to a third-party request', () => {
    localStorage.setItem('auth_token', 'obsolete-test-token');
    TestBed.inject(HttpClient).get('https://third-party.example/file').subscribe();
    const request = http.expectOne('https://third-party.example/file');
    expect(request.request.withCredentials).toBeFalse();
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush({});
  });
  it('redirects an expired API session without deleting pending offline work', () => {
    const auth = TestBed.inject(AuthService);
    const expired = spyOn(auth, 'expireSession').and.callThrough();
    TestBed.inject(HttpClient).get(serviceConfig.inventoryApiUrl + '/sessions').subscribe({ error: () => {} });
    http.expectOne(serviceConfig.inventoryApiUrl + '/sessions').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(expired).toHaveBeenCalled();
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/login'], jasmine.any(Object));
  });
  it('does not redirect again when pending unauthorized responses arrive on the login page', () => {
    const router = TestBed.inject(Router);
    spyOnProperty(router, 'url', 'get').and.returnValue('/login?returnUrl=%2Finventory%2Fsession');
    TestBed.inject(AuthService).expireSession();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(sockets.disconnect).toHaveBeenCalled();
  });
  it('restores the trusted current role and clears authentication on an expired session', () => {
    const auth = TestBed.inject(AuthService);
    auth.checkSession().subscribe((valid) => expect(valid).toBeTrue());
    http
      .expectOne(serviceConfig.authApiUrl + '/check-session')
      .flush({ id: 7, username: 'test', role: 'auditor' });
    expect(auth.user()?.role).toBe('auditor');
    localStorage.setItem('role', 'administrador');
    expect(auth.canAdminister()).toBeFalse();
    auth.checkSession().subscribe((valid) => expect(valid).toBeFalse());
    http
      .expectOne(serviceConfig.authApiUrl + '/check-session')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.isAuthenticated()).toBeFalse();
    expect(sockets.disconnect).toHaveBeenCalled();
  });
});
