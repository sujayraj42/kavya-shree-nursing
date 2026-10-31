import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminAuthService } from '../services/admin-auth.service';

/**
 * Functional guard protecting administrative routes.
 * Redirects unauthenticated visitors to /admin/login.
 */
export const adminAuthGuard: CanActivateFn = () => {
  const authService = inject(AdminAuthService);
  const router = inject(Router);

  const isAuth = authService.isAuthenticated();
  const notExpired = typeof authService.isTokenExpired === 'function' ? !authService.isTokenExpired() : true;
  const hasRole = typeof authService.hasAdminRole === 'function' ? authService.hasAdminRole() : true;

  if (isAuth && notExpired && hasRole) {
    return true;
  }

  return router.createUrlTree(['/admin', 'login']);
};

/**
 * Functional guard preventing authenticated administrators from accessing the login screen.
 * Redirects active sessions to /admin/dashboard.
 */
export const adminGuestGuard: CanActivateFn = () => {
  const authService = inject(AdminAuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return router.createUrlTree(['/admin', 'dashboard']);
  }

  return true;
};

