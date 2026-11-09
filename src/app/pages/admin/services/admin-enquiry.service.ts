import { Injectable, inject } from '@angular/core';
import { AdminAuthService, BaseAdminFilterParams } from './admin-auth.service';
import {
  AdminEnquiry,
  AdminEnquiryNote,
  EnquiryPagination,
  EnquiryStatus,
  DashboardStats
} from '../models/admin.models';

export type EnquiryFilterParams = BaseAdminFilterParams;

@Injectable({
  providedIn: 'root'
})
export class AdminEnquiryService {
  private readonly authService = inject(AdminAuthService);

  /**
   * Retrieves a paginated list of candidate enquiries with optional status, program, and text search filters.
   */
  public async listEnquiries(
    filters: EnquiryFilterParams = {}
  ): Promise<{ enquiries: AdminEnquiry[]; pagination: EnquiryPagination }> {
    const queryString = this.authService.buildFilterQueryString(filters);
    const endpoint = `/admin/enquiries${queryString ? `?${queryString}` : ''}`;

    const result = await this.authService.request<{
      success: boolean;
      data: { enquiries: AdminEnquiry[]; pagination: EnquiryPagination };
    }>(endpoint, { method: 'GET' });

    return result.data;
  }

  /**
   * Retrieves full enquiry details including historical candidate message and internal notes.
   */
  public async getEnquiryById(id: string): Promise<AdminEnquiry> {
    const result = await this.authService.request<{
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
    const result = await this.authService.request<{
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
    const result = await this.authService.request<{
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
   * Fetches genuine dashboard statistics compiled via backend aggregation.
   */
  public async getDashboardData(): Promise<{
    stats: DashboardStats;
    recentEnquiries: AdminEnquiry[];
  }> {
    const result = await this.authService.request<{
      success: boolean;
      data: { stats: DashboardStats; recentEnquiries: AdminEnquiry[] };
    }>('/admin/stats', { method: 'GET' });

    return result.data;
  }

  /**
   * Downloads official admissions enquiries as a standardized CSV file.
   */
  public async exportEnquiriesCsv(): Promise<void> {
    await this.authService.downloadCsv('/admin/enquiries/export', 'kavya_shree_enquiries');
  }
}
