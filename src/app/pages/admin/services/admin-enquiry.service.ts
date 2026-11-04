import { Injectable, inject } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { AdminAuthService } from './admin-auth.service';
import {
  AdminEnquiry,
  AdminEnquiryNote,
  EnquiryPagination,
  EnquiryStatus,
  DashboardStats
} from '../models/admin.models';

export interface EnquiryFilterParams {
  page?: number;
  limit?: number;
  status?: string;
  program?: string;
  search?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminEnquiryService {
  private readonly authService = inject(AdminAuthService);

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${environment.apiBaseUrl}${endpoint}`;
    const headers = {
      ...this.authService.getAuthorizedHeaders(url),
      ...(options.headers || {})
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (response.status === 401) {
      this.authService.logout();
      throw new Error('Your session has expired. Please log in again.');
    }

    let data: any = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok || !data?.success) {
      throw new Error(data?.error || `Request failed with status ${response.status}`);
    }

    return data;
  }

  /**
   * Retrieves a paginated list of candidate enquiries with optional status, program, and text search filters.
   */
  public async listEnquiries(
    filters: EnquiryFilterParams = {}
  ): Promise<{ enquiries: AdminEnquiry[]; pagination: EnquiryPagination }> {
    const params = new URLSearchParams();

    if (filters.page) {
      params.set('page', filters.page.toString());
    }
    if (filters.limit) {
      params.set('limit', filters.limit.toString());
    }
    if (filters.status && filters.status !== 'all') {
      params.set('status', filters.status);
    }
    if (filters.program && filters.program !== 'all') {
      params.set('program', filters.program);
    }
    if (filters.search && filters.search.trim()) {
      params.set('search', filters.search.trim());
    }

    const queryString = params.toString();
    const endpoint = `/admin/enquiries${queryString ? `?${queryString}` : ''}`;

    const result = await this.request<{
      success: boolean;
      data: { enquiries: AdminEnquiry[]; pagination: EnquiryPagination };
    }>(endpoint, { method: 'GET' });

    return result.data;
  }

  /**
   * Retrieves full enquiry details including historical candidate message and internal notes.
   */
  public async getEnquiryById(id: string): Promise<AdminEnquiry> {
    const result = await this.request<{
      success: boolean;
      data: AdminEnquiry;
    }>(`/admin/enquiries/${id}`, { method: 'GET' });

    return result.data;
  }

  /**
   * Updates enquiry workflow status across the agreed 6-state lifecycle.
   */
  public async updateStatus(
    id: string,
    status: EnquiryStatus
  ): Promise<{ id: string; status: EnquiryStatus; updatedAt: string }> {
    const result = await this.request<{
      success: boolean;
      message: string;
      data: { id: string; status: EnquiryStatus; updatedAt: string };
    }>(`/admin/enquiries/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });

    return result.data;
  }

  /**
   * Appends an internal staff note. The author is automatically derived by the server.
   */
  public async addNote(id: string, text: string): Promise<AdminEnquiryNote> {
    const result = await this.request<{
      success: boolean;
      message: string;
      data: AdminEnquiryNote;
    }>(`/admin/enquiries/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ text })
    });

    return result.data;
  }

  /**
   * Fetches data to compile genuine dashboard statistics without fabricating metrics.
   * Utilizes high-performance database aggregation on the backend.
   */
  public async getDashboardData(): Promise<{
    stats: DashboardStats;
    recentEnquiries: AdminEnquiry[];
  }> {
    const result = await this.request<{
      success: boolean;
      data: { stats: DashboardStats; recentEnquiries: AdminEnquiry[] };
    }>('/admin/stats', { method: 'GET' });

    return result.data;
  }

  /**
   * Downloads official admissions enquiries as a standardized CSV file.
   */
  public async exportEnquiriesCsv(): Promise<void> {
    const url = `${environment.apiBaseUrl}/admin/enquiries/export`;
    const response = await fetch(url, {
      method: 'GET',
      headers: this.authService.getAuthorizedHeaders(url)
    });

    if (!response.ok) {
      throw new Error(`Failed to export enquiries (HTTP status ${response.status})`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `kavya_shree_enquiries_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }
}
