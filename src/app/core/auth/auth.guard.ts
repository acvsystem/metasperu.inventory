import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { map, take } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
    console.log(route, state);
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

                // 1. Obtener el rol del usuario (desde localStorage o un servicio)
                const userRole = localStorage.getItem('role');

                // 2. Obtener los roles permitidos para esta ruta desde la data
                const rolesPermitidos = route.data['roles'] as Array<string>;

                // 3. Validar

                if (userRole && rolesPermitidos.includes(userRole)) {

                    if (userRole == 'administrador' || userRole == 'auditor') {
                        router.navigate(['/inventory/session']);

                    } else if (userRole == 'pocket') {
                        router.navigate(['/inventory/pocket']);
                    }

                    return true; // Acceso permitido
                } else {
                    // Redirigir al dashboard o login si no tiene permiso
                    router.navigate(['/login']);
                    return false; // Acceso denegado
                }

                return true;
            } else {
                // Redirigimos al login y guardamos la URL a la que quería ir
                return router.createUrlTree(['/' + state.url], { queryParams: { returnUrl: state.url } });
            }
        })
    );
};