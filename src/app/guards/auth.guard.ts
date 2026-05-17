import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = () => {

  const router = inject(Router);
  const token = localStorage.getItem('token');

  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));

    const now = Math.floor(Date.now() / 1000);

    if (payload.exp < now) {
      localStorage.removeItem('token');
      router.navigate(['/login']);
      return false;
    }

    return true;

  } catch (e) {
    localStorage.removeItem('token');
    router.navigate(['/login']);
    return false;
  }
};