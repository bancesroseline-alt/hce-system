import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = () => {

  const router = inject(Router);

  const token = localStorage.getItem('token');
  const usuario = localStorage.getItem('usuario');
  const offlineAutorizado = localStorage.getItem('offlineAutorizado');

  if (!token || !usuario || offlineAutorizado !== 'true') {
    router.navigate(['/login']);
    return false;
  }

  if (!navigator.onLine) {
    return true;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp < now) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      localStorage.removeItem('offlineAutorizado');
      localStorage.removeItem('fechaAutorizacionOffline');

      router.navigate(['/login']);
      return false;
    }

    return true;

  } catch (e) {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('offlineAutorizado');
    localStorage.removeItem('fechaAutorizacionOffline');

    router.navigate(['/login']);
    return false;
  }
};