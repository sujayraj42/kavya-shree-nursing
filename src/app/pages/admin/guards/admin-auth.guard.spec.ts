import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { adminAuthGuard, adminGuestGuard } from './admin-auth.guard';
import { AdminAuthService } from '../services/admin-auth.service';

describe('Admin Route Guards', () => {
  let mockAuthService: { isAuthenticated: ReturnType<typeof vi.fn> };
  let mockRouter: { createUrlTree: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockAuthService = {
      isAuthenticated: vi.fn()
    };
    mockRouter = {
      createUrlTree: vi.fn().mockImplementation((commands) => ({ toString: () => commands.join('/') } as UrlTree))
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AdminAuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    });
  });

  describe('adminAuthGuard', () => {
    it('should allow access when administrator is authenticated', () => {
      mockAuthService.isAuthenticated.mockReturnValue(true);

      const result = TestBed.runInInjectionContext(() => adminAuthGuard({} as any, {} as any));

      expect(result).toBe(true);
      expect(mockRouter.createUrlTree).not.toHaveBeenCalled();
    });

    it('should redirect to /admin/login when administrator is not authenticated', () => {
      mockAuthService.isAuthenticated.mockReturnValue(false);

      const result = TestBed.runInInjectionContext(() => adminAuthGuard({} as any, {} as any));

      expect(result).not.toBe(true);
      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/admin', 'login']);
    });

    it('should redirect to /admin/login when administrator token is expired', () => {
      mockAuthService.isAuthenticated.mockReturnValue(true);
      (mockAuthService as any).isTokenExpired = vi.fn().mockReturnValue(true);

      const result = TestBed.runInInjectionContext(() => adminAuthGuard({} as any, {} as any));

      expect(result).not.toBe(true);
      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/admin', 'login']);
    });

    it('should redirect to /admin/login when user lacks administrative role', () => {
      mockAuthService.isAuthenticated.mockReturnValue(true);
      (mockAuthService as any).isTokenExpired = vi.fn().mockReturnValue(false);
      (mockAuthService as any).hasAdminRole = vi.fn().mockReturnValue(false);

      const result = TestBed.runInInjectionContext(() => adminAuthGuard({} as any, {} as any));

      expect(result).not.toBe(true);
      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/admin', 'login']);
    });
  });

  describe('adminGuestGuard', () => {
    it('should allow access to login page when administrator is not logged in', () => {
      mockAuthService.isAuthenticated.mockReturnValue(false);

      const result = TestBed.runInInjectionContext(() => adminGuestGuard({} as any, {} as any));

      expect(result).toBe(true);
      expect(mockRouter.createUrlTree).not.toHaveBeenCalled();
    });

    it('should redirect active sessions from login to /admin/dashboard', () => {
      mockAuthService.isAuthenticated.mockReturnValue(true);

      const result = TestBed.runInInjectionContext(() => adminGuestGuard({} as any, {} as any));

      expect(result).not.toBe(true);
      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/admin', 'dashboard']);
    });
  });
});

