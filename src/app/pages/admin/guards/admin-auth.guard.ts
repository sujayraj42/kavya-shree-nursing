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

  if (authService.isAuthenticated()) {
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

