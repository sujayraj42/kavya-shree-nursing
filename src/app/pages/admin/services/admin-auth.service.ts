import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { AdminUser, AdminLoginResponse } from '../models/admin.models';

const TOKEN_STORAGE_KEY = 'ks_admin_auth_token';
const USER_STORAGE_KEY = 'ks_admin_auth_user';

export interface BaseAdminFilterParams {
  page?: number;
  limit?: number;
  status?: string;
  program?: string;
  search?: string;
}

/**
 * Service managing administrative authentication, session lifecycle,
 * shared authenticated API requests, CSV exports, and origin-safe token headers.
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
   * Includes fallback to same-origin `/api` when the primary endpoint encounters a network error.
   * Never prints credentials or tokens to logs or console.
   */
  public async login(credentials: { email: string; password: string }): Promise<boolean> {
    this.isAuthenticating.set(true);
    this.authError.set('');

    const payload = {
      email: (credentials.email || '').trim().toLowerCase(),
      password: credentials.password || ''
    };

    const primaryUrl = `${environment.apiBaseUrl}/admin/login`;
    const fallbackUrl = '/api/admin/login';

    try {
      let response: Response;
      try {
        response = await fetch(primaryUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      } catch (primaryErr) {
        if (primaryUrl !== fallbackUrl) {
          response = await fetch(fallbackUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          });
        } else {
          throw primaryErr;
        }
      }

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
   * the trusted backend origin configured in environment.apiBaseUrl or same-origin.
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
   * Verifies that the target URL belongs to the configured backend origin or current window origin.
   */
  public isTrustedOrigin(url: string): boolean {
    try {
      const parsedTarget = new URL(url, window.location.origin);
      const parsedTrusted = new URL(environment.apiBaseUrl, window.location.origin);
      return (
        parsedTarget.origin === parsedTrusted.origin ||
        (typeof window !== 'undefined' && parsedTarget.origin === window.location.origin)
      );
    } catch {
      return false;
    }
  }

  /**
   * Shared authenticated JSON request helper for admin services.
   * Automatically retries against same-origin `/api` if the primary endpoint is unreachable or returns 404.
   */
  public async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const candidateBaseUrls = Array.from(new Set([environment.apiBaseUrl, '/api']));
    let lastError = 'Request failed';
    let primaryUnauthorized = false;

    for (let i = 0; i < candidateBaseUrls.length; i++) {
      const baseUrl = candidateBaseUrls[i];
      const url = `${baseUrl}${endpoint}`;
      const headers = {
        ...this.getAuthorizedHeaders(url),
        ...(options.headers || {})
      };

      try {
        const response = await fetch(url, {
          ...options,
          headers
        });

        if (response.status === 401) {
          if (i === 0) {
            primaryUnauthorized = true;
          }
          lastError = 'Your session has expired. Please log in again.';
          continue;
        }

        let data: any = null;
        try {
          data = await response.json();
        } catch {
          data = null;
        }

        if (response.status === 404 && i < candidateBaseUrls.length - 1) {
          lastError = data?.error || `Request failed with status ${response.status}`;
          continue;
        }

        if (!response.ok || !data?.success) {
          throw new Error(data?.error || `Request failed with status ${response.status}`);
        }

        return data as T;
      } catch (err: any) {
        lastError = err?.message || 'Network error';
        if (i === candidateBaseUrls.length - 1) {
          break;
        }
      }
    }

    if (primaryUnauthorized) {
      this.logout();
    }

    throw new Error(lastError);
  }

  /**
   * Shared authenticated CSV file download helper for admin services.
   */
  public async downloadCsv(endpoint: string, filenamePrefix: string): Promise<void> {
    const candidateBaseUrls = Array.from(new Set([environment.apiBaseUrl, '/api']));
    let response: Response | null = null;
    let primaryUnauthorized = false;

    for (let i = 0; i < candidateBaseUrls.length; i++) {
      const url = `${candidateBaseUrls[i]}${endpoint}`;
      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: this.getAuthorizedHeaders(url)
        });

        if (res.status === 401) {
          if (i === 0) primaryUnauthorized = true;
          continue;
        }

        if (res.status === 404 && i < candidateBaseUrls.length - 1) {
          continue;
        }

        if (res.ok) {
          response = res;
          break;
        }
      } catch {
        // Try next candidate base URL
      }
    }

    if (primaryUnauthorized && !response) {
      this.logout();
      throw new Error('Your session has expired. Please log in again.');
    }

    if (!response || !response.ok) {
      throw new Error(`Failed to export records${response ? ` (HTTP status ${response.status})` : ''}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  /**
   * Shared query-string builder for paginated admin filter parameters.
   */
  public buildFilterQueryString(filters: BaseAdminFilterParams = {}): string {
    const params = new URLSearchParams();
    if (filters.page) params.set('page', filters.page.toString());
    if (filters.limit) params.set('limit', filters.limit.toString());
    if (filters.status && filters.status !== 'all') params.set('status', filters.status);
    if (filters.program && filters.program !== 'all') params.set('program', filters.program);
    if (filters.search && filters.search.trim()) params.set('search', filters.search.trim());
    return params.toString();
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
      return this.isAuthenticated();
    }
  }

  /**
   * Updates administrator password using current password verification.
   */
  public async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/admin/me/password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword })
    });
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
