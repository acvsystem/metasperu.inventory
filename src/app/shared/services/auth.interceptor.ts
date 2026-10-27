import { isServiceApiRequest } from '../../core/config/service-config';
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const url = new URL(req.url, window.location.origin);
  const inventoryApi = isServiceApiRequest(url);
  // Credentials are sent only to the inventory API; never to third parties.
  if (!inventoryApi) return next(req);
  const auth = inject(AuthService);
  return next(req.clone({ withCredentials: true })).pipe(catchError(error => {
    if (error.status === 401 && url.pathname.startsWith('/s3/inventory/')) auth.expireSession();
    return throwError(() => error);
  }));
};
