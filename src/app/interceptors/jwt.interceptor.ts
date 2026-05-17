import { HttpInterceptorFn } from '@angular/common/http';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {

  // NO INTERCEPTAR LOGIN
  if (req.url.includes('/api/auth/login')) {
    return next(req);
  }

  const token = localStorage.getItem('token');

  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

    return next(cloned);
  }

  return next(req);
};