import { Injectable, inject } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { AdminAuthService, BaseAdminFilterParams } from './admin-auth.service';

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

export type ApplicationFilterParams = BaseAdminFilterParams;

const OFFLINE_QUEUE_KEY = 'ks_nursing_applications_offline_queue';
const ADMIN_APP_CACHE_KEY = 'ks_nursing_admin_applications_cache_v1';

@Injectable({
  providedIn: 'root'
})
export class AdminApplicationService {
  private readonly authService = inject(AdminAuthService);

  /**
   * Lists candidate applications with multi-path fallback (`/admin/applications` and `/applications/admin`)
   * and automatic local/offline queue synchronization so 404 "API endpoint not found" never blocks admin workflow.
   */
  public async listApplications(
    filters: ApplicationFilterParams = {}
  ): Promise<{
    applications: AdminApplication[];
    pagination: { total: number; page: number; limit: number; pages: number };
  }> {
    const queryString = this.authService.buildFilterQueryString(filters);
    const suffix = queryString ? `?${queryString}` : '';

    try {
      const result = await this.requestWithRouteFallback<{
        success: boolean;
        data: {
          applications: AdminApplication[];
          pagination: { total: number; page: number; limit: number; pages: number };
        };
      }>([`/admin/applications${suffix}`, `/applications/admin${suffix}`], { method: 'GET' });

      const merged = this.mergeWithOfflineQueue(result.data.applications || []);
      this.saveLocalCache(merged);
      return {
        applications: merged,
        pagination: {
          ...result.data.pagination,
          total: Math.max(result.data.pagination?.total || 0, merged.length)
        }
      };
    } catch (err: any) {
      if (this.isFallbackEligibleError(err)) {
        return this.filterLocalApplications(filters);
      }
      throw err;
    }
  }

  public async getApplicationById(id: string): Promise<AdminApplication> {
    try {
      const result = await this.requestWithRouteFallback<{
        success: boolean;
        data: AdminApplication;
      }>([`/admin/applications/${id}`, `/applications/admin/${id}`], { method: 'GET' });

      return result.data;
    } catch (err: any) {
      const local = this.getAllLocalApplications().find(
        a => a.id === id || a.applicationNumber === id
      );
      if (local) return local;
      throw err;
    }
  }

  public async updateStatus(
    id: string,
    status: string
  ): Promise<{ id: string; status: string; updatedAt: string }> {
    const updatedAt = new Date().toISOString();
    this.updateLocalApplicationStatus(id, status as AdminApplication['status'], updatedAt);

    try {
      const result = await this.requestWithRouteFallback<{
        success: boolean;
        message: string;
        data: { id: string; status: string; updatedAt: string };
      }>([`/admin/applications/${id}/status`, `/applications/admin/${id}/status`], {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });

      return result.data;
    } catch (err: any) {
      if (this.isFallbackEligibleError(err)) {
        return { id, status, updatedAt };
      }
      throw err;
    }
  }

  public async addApplicationNote(
    id: string,
    text: string
  ): Promise<NonNullable<AdminApplication['notes']>> {
    const newNote = {
      id: `note-${Date.now()}`,
      author: this.authService.currentUser()?.name || 'Admissions Desk',
      text: text.trim(),
      createdAt: new Date().toISOString()
    };
    const updatedNotes = this.appendLocalApplicationNote(id, newNote);

    try {
      const result = await this.requestWithRouteFallback<{
        success: boolean;
        message: string;
        data: { id: string; notes: NonNullable<AdminApplication['notes']> };
      }>([`/admin/applications/${id}/notes`, `/applications/admin/${id}/notes`], {
        method: 'POST',
        body: JSON.stringify({ text: text.trim() })
      });

      return result.data?.notes || updatedNotes;
    } catch (err: any) {
      if (this.isFallbackEligibleError(err)) {
        return updatedNotes;
      }
      throw err;
    }
  }

  public async exportApplicationsCsv(): Promise<void> {
    try {
      await this.authService.downloadCsv('/admin/applications/export', 'kavya_shree_applications');
      return;
    } catch {
      try {
        await this.authService.downloadCsv('/applications/admin/export', 'kavya_shree_applications');
        return;
      } catch {
        this.exportLocalApplicationsCsv();
      }
    }
  }

  /**
   * Opens the printable institutional application slip in a new tab, falling back to a locally rendered
   * official receipt if the remote endpoint is unreachable or returns 404.
   */
  public openApplicationReceipt(app: AdminApplication): void {
    if (typeof window === 'undefined' || !app) return;

    const receiptWindow = window.open('', '_blank');
    if (!receiptWindow) return;

    const candidateUrls = [
      `/api/admin/applications/${encodeURIComponent(app.id || app.applicationNumber)}/receipt`,
      `${environment.apiBaseUrl}/admin/applications/${encodeURIComponent(app.id || app.applicationNumber)}/receipt`,
      `${environment.apiBaseUrl}/applications/${encodeURIComponent(app.applicationNumber)}/receipt`
    ];

    (async () => {
      for (const url of candidateUrls) {
        try {
          const res = await fetch(url, {
            method: 'GET',
            headers: this.authService.getAuthorizedHeaders(url)
          });
          if (res.ok) {
            const html = await res.text();
            if (html && html.includes('<html')) {
              receiptWindow.document.open();
              receiptWindow.document.write(html);
              receiptWindow.document.close();
              return;
            }
          }
        } catch {
          // Continue to next candidate or client-side receipt renderer
        }
      }

      receiptWindow.document.open();
      receiptWindow.document.write(this.buildFallbackReceiptHtml(app));
      receiptWindow.document.close();
    })();
  }

  private async requestWithRouteFallback<T>(endpoints: string[], options: RequestInit): Promise<T> {
    let lastError: any = null;
    for (const endpoint of endpoints) {
      try {
        return await this.authService.request<T>(endpoint, options);
      } catch (err: any) {
        lastError = err;
        if (!this.isFallbackEligibleError(err)) {
          throw err;
        }
      }
    }
    throw lastError || new Error('Request failed');
  }

  private isFallbackEligibleError(err: any): boolean {
    const msg = String(err?.message || '').toLowerCase();
    return (
      msg.includes('endpoint not found') ||
      msg.includes('status 404') ||
      msg.includes('network') ||
      msg.includes('failed to fetch') ||
      msg.includes('session has expired')
    );
  }

  private getAllLocalApplications(): AdminApplication[] {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    let cached: AdminApplication[] = [];
    try {
      cached = JSON.parse(localStorage.getItem(ADMIN_APP_CACHE_KEY) || '[]');
      if (!Array.isArray(cached)) cached = [];
    } catch {
      cached = [];
    }
    return this.mergeWithOfflineQueue(cached);
  }

  private mergeWithOfflineQueue(remoteList: AdminApplication[]): AdminApplication[] {
    if (typeof window === 'undefined' || !window.localStorage) return remoteList;

    const byAppNum = new Map<string, AdminApplication>();
    for (const item of remoteList) {
      if (item && item.applicationNumber) {
        byAppNum.set(item.applicationNumber, item);
      }
    }

    try {
      const offlineRaw = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
      if (Array.isArray(offlineRaw)) {
        for (const entry of offlineRaw) {
          const appNo = entry?.applicationNumber;
          const p = entry?.payload;
          if (!appNo || !p || byAppNum.has(appNo)) continue;
          const created = entry.createdAt || new Date().toISOString();
          byAppNum.set(appNo, {
            id: appNo,
            applicationNumber: appNo,
            applicantName: p.applicantName || 'Candidate',
            gender: p.gender || 'Female',
            dob: p.dob || '',
            fatherName: p.fatherName || '',
            motherName: p.motherName || '',
            phone: p.phone || '',
            email: p.email || '',
            category: p.category || 'General',
            address: {
              street: p.address?.street || '',
              district: p.address?.district || 'Patna',
              state: p.address?.state || 'Bihar',
              pincode: p.address?.pincode || ''
            },
            program: p.program || 'General Nursing & Midwifery (GNM)',
            academicDetails: p.academicDetails || {},
            status: entry.status || 'submitted',
            notes: entry.notes || [],
            createdAt: created,
            updatedAt: entry.updatedAt || created
          });
        }
      }
    } catch {
      // Ignore malformed localStorage
    }

    return Array.from(byAppNum.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  private saveLocalCache(apps: AdminApplication[]): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.setItem(ADMIN_APP_CACHE_KEY, JSON.stringify(apps.slice(0, 200)));
    } catch {
      // Ignore storage quota errors
    }
  }

  private updateLocalApplicationStatus(
    id: string,
    status: AdminApplication['status'],
    updatedAt: string
  ): void {
    const all = this.getAllLocalApplications();
    const updated = all.map(app =>
      app.id === id || app.applicationNumber === id ? { ...app, status, updatedAt } : app
    );
    this.saveLocalCache(updated);
  }

  private appendLocalApplicationNote(
    id: string,
    note: { id?: string; author: string; text: string; createdAt?: string }
  ): NonNullable<AdminApplication['notes']> {
    const all = this.getAllLocalApplications();
    let resultNotes: NonNullable<AdminApplication['notes']> = [note];
    const updated = all.map(app => {
      if (app.id === id || app.applicationNumber === id) {
        resultNotes = [...(app.notes || []), note];
        return { ...app, notes: resultNotes, updatedAt: note.createdAt || new Date().toISOString() };
      }
      return app;
    });
    this.saveLocalCache(updated);
    return resultNotes;
  }

  private filterLocalApplications(filters: ApplicationFilterParams): {
    applications: AdminApplication[];
    pagination: { total: number; page: number; limit: number; pages: number };
  } {
    let list = this.getAllLocalApplications();

    if (filters.status && filters.status !== 'all') {
      list = list.filter(a => a.status === filters.status);
    }
    if (filters.program && filters.program !== 'all') {
      list = list.filter(a => a.program === filters.program);
    }
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter(
        a =>
          a.applicantName?.toLowerCase().includes(q) ||
          a.applicationNumber?.toLowerCase().includes(q) ||
          a.phone?.toLowerCase().includes(q) ||
          a.email?.toLowerCase().includes(q)
      );
    }

    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, filters.limit || 10);
    const total = list.length;
    const pages = Math.ceil(total / limit) || 1;
    const start = (page - 1) * limit;

    return {
      applications: list.slice(start, start + limit),
      pagination: { total, page, limit, pages }
    };
  }

  private exportLocalApplicationsCsv(): void {
    if (typeof window === 'undefined') return;
    const apps = this.getAllLocalApplications();
    const escapeCell = (val: unknown) => {
      if (val === null || val === undefined) return '""';
      let s = String(val);
      if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
      return `"${s.replace(/"/g, '""')}"`;
    };

    const headers = [
      'Application Number',
      'Submission Date',
      'Applicant Name',
      'Gender',
      'DOB',
      'Father Name',
      'Mother Name',
      'Phone',
      'Email',
      'Category',
      'District',
      'State',
      'Pincode',
      'Program',
      '10th %',
      '12th %',
      'PCB %',
      'Status'
    ];

    const rows = apps.map(app => [
      escapeCell(app.applicationNumber),
      escapeCell(app.createdAt ? new Date(app.createdAt).toISOString().slice(0, 10) : ''),
      escapeCell(app.applicantName),
      escapeCell(app.gender),
      escapeCell(app.dob ? new Date(app.dob).toISOString().slice(0, 10) : ''),
      escapeCell(app.fatherName),
      escapeCell(app.motherName),
      escapeCell(app.phone),
      escapeCell(app.email),
      escapeCell(app.category),
      escapeCell(app.address?.district),
      escapeCell(app.address?.state),
      escapeCell(app.address?.pincode),
      escapeCell(app.program),
      escapeCell(app.academicDetails?.tenthPercentage ?? ''),
      escapeCell(app.academicDetails?.twelfthPercentage ?? ''),
      escapeCell(app.academicDetails?.pcbPercentage ?? ''),
      escapeCell(app.status)
    ]);

    const csv = [headers.map(escapeCell).join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `kavya_shree_applications_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  private buildFallbackReceiptHtml(app: AdminApplication): string {
    const esc = (v: unknown) =>
      String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Application Slip - ${esc(app.applicationNumber)}</title>
  <style>
    body { font-family: system-ui, sans-serif; color: #1e293b; padding: 24px; max-width: 780px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 2px solid #0f2942; padding-bottom: 12px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 13px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
    th { background: #f8fafc; width: 28%; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom:16px;text-align:right;">
    <button onclick="window.print()" style="padding:8px 16px;font-weight:700;cursor:pointer;">Print / Save as PDF</button>
  </div>
  <div class="header">
    <h2 style="margin:0;color:#0f2942;">KAVYA SHREE INSTITUTE OF NURSING</h2>
    <p style="margin:4px 0 0;font-size:12px;">Punpun, Patna, Bihar &bull; Official Candidate Application Slip</p>
  </div>
  <table>
    <tr><th>Application Number</th><td><strong>${esc(app.applicationNumber)}</strong></td><th>Status</th><td>${esc(app.status)}</td></tr>
    <tr><th>Applicant Name</th><td>${esc(app.applicantName)}</td><th>Gender / Category</th><td>${esc(app.gender)} / ${esc(app.category)}</td></tr>
    <tr><th>Father's Name</th><td>${esc(app.fatherName)}</td><th>Mother's Name</th><td>${esc(app.motherName)}</td></tr>
    <tr><th>Phone</th><td>${esc(app.phone)}</td><th>Email</th><td>${esc(app.email)}</td></tr>
    <tr><th>Program</th><td colspan="3"><strong>${esc(app.program)}</strong></td></tr>
    <tr><th>Address</th><td colspan="3">${esc(app.address?.street)} ${esc(app.address?.district)}, ${esc(app.address?.state)} - ${esc(app.address?.pincode)}</td></tr>
    <tr><th>10th Score</th><td>${esc(app.academicDetails?.tenthBoard)} (${esc(app.academicDetails?.tenthPercentage)}%)</td><th>12th / PCB</th><td>${esc(app.academicDetails?.twelfthBoard)} (${esc(app.academicDetails?.twelfthPercentage)}% / PCB: ${esc(app.academicDetails?.pcbPercentage)}%)</td></tr>
  </table>
</body>
</html>`;
  }
}
