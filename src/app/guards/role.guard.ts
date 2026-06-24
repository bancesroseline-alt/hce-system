import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const roleGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const rolesPermitidos = (route.data?.['roles'] || []) as string[];
  const rolActual = normalizarRol(usuario?.rol);

  if (rolesPermitidos.length === 0 || rolesPermitidos.includes(rolActual)) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};

function normalizarRol(rol: any): string {
  const normalizado = (rol || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace('ROLE_', '')
    .toUpperCase();

  return normalizado === 'ADMINISTRADOR' ? 'ADMIN' : normalizado;
}
