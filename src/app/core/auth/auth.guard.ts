import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { map, take } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Si ya sabemos que está autenticado por el Signal, permitimos el paso
    if (authService.isAuthenticated()) {
        return true;
    }

    // Si no, verificamos la sesión con el servidor (útil para F5 o acceso directo por URL)
    return authService.checkSession().pipe(
        take(1),
        map(isLoggedIn => {
            if (isLoggedIn) {
                return true;
            } else {
                // Redirigimos al login y guardamos la URL a la que quería ir
                return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
            }
        })
    );
};