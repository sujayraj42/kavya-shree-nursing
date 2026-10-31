import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AdminAuthService } from './admin-auth.service';
import { environment } from '../../../../environments/environment';

describe('AdminAuthService', () => {
  let service: AdminAuthService;
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    sessionStorage.clear();
    mockRouter = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        AdminAuthService,
        { provide: Router, useValue: mockRouter }
      ]
    });

    service = TestBed.inject(AdminAuthService);
  });

  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('should initialize with no authenticated user when sessionStorage is empty', () => {
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should restore existing session from sessionStorage', () => {
    const mockUser = {
      id: '507f1f77bcf86cd799439011',
      email: 'admin@kavyashreenursing.edu.in',
      name: 'Admissions Officer',
      role: 'admin' as const
    };
    sessionStorage.setItem('ks_admin_auth_user', JSON.stringify(mockUser));
    sessionStorage.setItem('ks_admin_auth_token', 'mock-jwt-token-string');

    service.restoreSession();

    expect(service.currentUser()).toEqual(mockUser);
    expect(service.isAuthenticated()).toBe(true);
  });

  it('should authenticate successfully with valid credentials and set session', async () => {
    const mockResponse = {
      success: true,
      token: 'jwt.token.valid',
      admin: {
        id: 'admin-1',
        email: 'admin@kavyashreenursing.edu.in',
        name: 'Dr. Officer',
        role: 'superadmin' as const
      }
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse
    } as Response);

    const success = await service.login({
      email: 'admin@kavyashreenursing.edu.in',
      password: 'SecurePassword123!'
    });

    expect(success).toBe(true);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()?.email).toBe('admin@kavyashreenursing.edu.in');
    expect(sessionStorage.getItem('ks_admin_auth_token')).toBe('jwt.token.valid');
  });

  it('should handle failed login and populate authError without setting session', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ success: false, error: 'Invalid email or password' })
    } as Response);

    const success = await service.login({
      email: 'admin@kavyashreenursing.edu.in',
      password: 'WrongPassword'
    });

    expect(success).toBe(false);
    expect(service.isAuthenticated()).toBe(false);
    expect(service.authError()).toBe('Invalid email or password');
    expect(sessionStorage.getItem('ks_admin_auth_token')).toBeNull();
  });

  it('should clear session and redirect to /admin/login on logout', () => {
    sessionStorage.setItem('ks_admin_auth_token', 'token');
    sessionStorage.setItem('ks_admin_auth_user', JSON.stringify({ email: 'test@example.com' }));

    service.logout();

    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem('ks_admin_auth_token')).toBeNull();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin', 'login']);
  });

  it('should attach Bearer token strictly to trusted backend origin', () => {
    sessionStorage.setItem('ks_admin_auth_token', 'valid-token-123');

    const trustedUrl = `${environment.apiBaseUrl}/admin/enquiries`;
    const headers = service.getAuthorizedHeaders(trustedUrl);

    expect(headers['Authorization']).toBe('Bearer valid-token-123');
  });

  it('should NEVER attach Bearer token to untrusted or third-party URLs', () => {
    sessionStorage.setItem('ks_admin_auth_token', 'valid-token-123');

    const untrustedUrl = 'https://malicious-external-api.com/steal-token';
    const headers = service.getAuthorizedHeaders(untrustedUrl);

    expect(headers['Authorization']).toBeUndefined();
  });

  it('hasAdminRole should return true for admin and superadmin, false for others', () => {
    expect(service.hasAdminRole()).toBe(false);

    service.currentUser.set({
      id: '1',
      email: 'admin@edu.in',
      name: 'Admin',
      role: 'admin'
    });
    expect(service.hasAdminRole()).toBe(true);

    service.currentUser.set({
      id: '2',
      email: 'super@edu.in',
      name: 'Super Admin',
      role: 'superadmin'
    });
    expect(service.hasAdminRole()).toBe(true);

    service.currentUser.set({
      id: '3',
      email: 'guest@edu.in',
      name: 'Guest User',
      role: 'guest' as any
    });
    expect(service.hasAdminRole()).toBe(false);
  });

  it('isTokenExpired should return true when token is absent or has passed exp', () => {
    expect(service.isTokenExpired()).toBe(true);

    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    const validPayload = btoa(JSON.stringify({ exp: futureExp }));
    sessionStorage.setItem('ks_admin_auth_token', `header.${validPayload}.sig`);
    expect(service.isTokenExpired()).toBe(false);

    const pastExp = Math.floor(Date.now() / 1000) - 3600;
    const expiredPayload = btoa(JSON.stringify({ exp: pastExp }));
    sessionStorage.setItem('ks_admin_auth_token', `header.${expiredPayload}.sig`);
    expect(service.isTokenExpired()).toBe(true);
  });
});

