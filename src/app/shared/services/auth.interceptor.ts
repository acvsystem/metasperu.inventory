// auth.interceptor.ts
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  // 1. Obtener el token de localStorage
  const token = localStorage.getItem('auth_token');

  // 2. Si existe, clonar la petición y añadir el header Authorization
  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned); // <-- Aquí es donde estaba el error, se llama como función
  }

  // 3. Si no hay token, pasar la petición original
  return next(req);
};