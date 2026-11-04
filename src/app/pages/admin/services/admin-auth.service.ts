import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { AdminUser, AdminLoginResponse } from '../models/admin.models';

const TOKEN_STORAGE_KEY = 'ks_admin_auth_token';
const USER_STORAGE_KEY = 'ks_admin_auth_user';

/**
 * Service managing administrative authentication, session lifecycle,
 * and origin-safe token authorization headers.
 */
@Injectable({
  providedIn: 'root'
})
export class AdminAuthService {
  private readonly router = inject(Router);

  public readonly currentUser = signal<AdminUser | null>(null);
  public readonly isAuthenticated = computed(() => !!this.currentUser());
  public readonly isAuthenticating = signal<boolean>(false);
  public readonly authError = signal<string>('');

  constructor() {
    this.restoreSession();
  }

  /**
   * Restores existing session from sessionStorage if available.
   * SessionStorage ensures the token clears when the browser tab/window closes.
   */
  public restoreSession(): void {
    try {
      const storedUser = sessionStorage.getItem(USER_STORAGE_KEY);
      const storedToken = sessionStorage.getItem(TOKEN_STORAGE_KEY);
      if (storedUser && storedToken) {
        if (this.isTokenExpired()) {
          this.clearSession();
          return;
        }
        this.currentUser.set(JSON.parse(storedUser));
      }
    } catch {
      this.clearSession();
    }
  }

  /**
   * Verifies if the authenticated user has valid administrative privileges.
   */
  public hasAdminRole(): boolean {
    const user = this.currentUser();
    return !!user && (user.role === 'admin' || user.role === 'superadmin');
  }

  /**
   * Checks whether the current session token has expired according to its JWT payload.
   */
  public isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) {
      return true;
    }
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return true;
      }
      const payload = JSON.parse(atob(parts[1]));
      if (!payload.exp) {
        return true;
      }
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }

  /**
   * Authenticates against the backend API and initializes the administrator session.
   * Never prints credentials or tokens to logs or console.
   */
  public async login(credentials: { email: string; password: string }): Promise<boolean> {
    this.isAuthenticating.set(true);
    this.authError.set('');

    try {
      const response = await fetch(`${environment.apiBaseUrl}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok || !data?.success) {
        const errorMsg = data?.error || 'Authentication failed. Please verify your credentials.';
        this.authError.set(errorMsg);
        this.isAuthenticating.set(false);
        return false;
      }

      const loginData = data as AdminLoginResponse;
      this.setSession(loginData.token, loginData.admin);
      this.isAuthenticating.set(false);
      return true;
    } catch (err: any) {
      this.authError.set(err?.message || 'Network error connecting to admissions server. Please try again.');
      this.isAuthenticating.set(false);
      return false;
    }
  }

  /**
   * Clears the current session and redirects the administrator to the login page.
   */
  public logout(): void {
    this.clearSession();
    this.router.navigate(['/admin', 'login']);
  }

  /**
   * Retrieves the raw Bearer token from browser session storage.
   */
  public getToken(): string | null {
    try {
      return sessionStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Safely constructs HTTP headers with the Bearer token.
   * Origin check: The token is strictly attached ONLY if the target URL matches
   * the trusted backend origin configured in environment.apiBaseUrl.
   */
  public getAuthorizedHeaders(targetUrl: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    const token = this.getToken();
    if (token && this.isTrustedOrigin(targetUrl)) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Verifies that the target URL belongs to the configured backend origin.
   */
  public isTrustedOrigin(url: string): boolean {
    try {
      const parsedTarget = new URL(url, window.location.origin);
      const parsedTrusted = new URL(environment.apiBaseUrl, window.location.origin);
      return parsedTarget.origin === parsedTrusted.origin;
    } catch {
      return false;
    }
  }

  /**
   * Validates the active session against GET /api/admin/me.
   * If unauthorized or expired, terminates the session.
   */
  public async verifyProfile(): Promise<boolean> {
    const token = this.getToken();
    if (!token) {
      this.clearSession();
      return false;
    }

    const url = `${environment.apiBaseUrl}/admin/me`;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthorizedHeaders(url)
      });

      if (!response.ok) {
        this.clearSession();
        return false;
      }

      const data = await response.json();
      if (data?.success && data?.admin) {
        this.currentUser.set(data.admin);
        sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.admin));
        return true;
      }

      this.clearSession();
      return false;
    } catch {
      // In case of transient network failure, retain session
      return this.isAuthenticated();
    }
  }

  /**
   * Updates administrator password using current password verification.
   */
  public async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const url = `${environment.apiBaseUrl}/admin/me/password`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: this.getAuthorizedHeaders(url),
      body: JSON.stringify({ currentPassword, newPassword })
    });

    let data: any = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok || !data?.success) {
      throw new Error(data?.error || 'Failed to update administrator password.');
    }

    return data;
  }

  private setSession(token: string, user: AdminUser): void {
    try {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
      sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } catch {
      // Handle storage quota or private browsing exceptions
    }
    this.currentUser.set(user);
  }

  private clearSession(): void {
    try {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      sessionStorage.removeItem(USER_STORAGE_KEY);
    } catch {
      // Ignore storage removal errors
    }
    this.currentUser.set(null);
  }
}
