import { Injectable, inject } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { AdminAuthService } from './admin-auth.service';

export interface AdminApplication {
  id: string;
  applicationNumber: string;
  applicantName: string;
  gender: string;
  dob: string;
  fatherName: string;
  motherName: string;
  phone: string;
  email: string;
  category: string;
  address: {
    street?: string;
    district: string;
    state: string;
    pincode: string;
  };
  program: string;
  academicDetails: {
    tenthBoard?: string;
    tenthYear?: number;
    tenthPercentage?: number;
    twelfthBoard?: string;
    twelfthYear?: number;
    twelfthPercentage?: number;
    pcbPercentage?: number;
  };
  documents?: {
    photoUrl?: string;
    tenthMarksheetUrl?: string;
    twelfthMarksheetUrl?: string;
  };
  status: 'submitted' | 'under_review' | 'document_verified' | 'provisionally_selected' | 'rejected';
  notes?: Array<{
    id?: string;
    author: string;
    text: string;
    createdAt?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationFilterParams {
  page?: number;
  limit?: number;
  status?: string;
  program?: string;
  search?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminApplicationService {
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

  public async listApplications(
    filters: ApplicationFilterParams = {}
  ): Promise<{ applications: AdminApplication[]; pagination: { total: number; page: number; limit: number; pages: number } }> {
    const params = new URLSearchParams();

    if (filters.page) params.set('page', filters.page.toString());
    if (filters.limit) params.set('limit', filters.limit.toString());
    if (filters.status && filters.status !== 'all') params.set('status', filters.status);
    if (filters.program && filters.program !== 'all') params.set('program', filters.program);
    if (filters.search && filters.search.trim()) params.set('search', filters.search.trim());

    const queryString = params.toString();
    const endpoint = `/applications/admin${queryString ? `?${queryString}` : ''}`;

    const result = await this.request<{
      success: boolean;
      data: { applications: AdminApplication[]; pagination: { total: number; page: number; limit: number; pages: number } };
    }>(endpoint, { method: 'GET' });

    return result.data;
  }

  public async getApplicationById(id: string): Promise<AdminApplication> {
    const result = await this.request<{
      success: boolean;
      data: AdminApplication;
    }>(`/applications/admin/${id}`, { method: 'GET' });

    return result.data;
  }

  public async updateStatus(
    id: string,
    status: string
  ): Promise<{ id: string; status: string; updatedAt: string }> {
    const result = await this.request<{
      success: boolean;
      message: string;
      data: { id: string; status: string; updatedAt: string };
    }>(`/applications/admin/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });

    return result.data;
  }

  public async exportApplicationsCsv(): Promise<void> {
    const url = `${environment.apiBaseUrl}/applications/admin/export`;
    const response = await fetch(url, {
      method: 'GET',
      headers: this.authService.getAuthorizedHeaders(url)
    });

    if (!response.ok) {
      throw new Error(`Failed to export applications (HTTP status ${response.status})`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `kavya_shree_applications_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }
}

