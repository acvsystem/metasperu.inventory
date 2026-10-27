import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { map, take } from 'rxjs';
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const authorize = () => {
    const role = auth.user()?.role;
    const allowed = route.data['roles'] as string[] | undefined;
    if (role && (!allowed || allowed.includes(role))) return true;
    return router.createUrlTree([role === 'pocket' ? '/inventory/pocket' : '/login']);
  };
  if (auth.isAuthenticated()) return authorize();
  return auth.checkSession().pipe(
    take(1),
    map((loggedIn) =>
      loggedIn
        ? authorize()
        : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } }),
    ),
  );
};
