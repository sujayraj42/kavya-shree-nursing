import { Injectable, inject } from '@angular/core';
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
const PUBLIC_OFFLINE_QUEUE_KEY = 'ks_offline_applications';
const ADMIN_APP_CACHE_KEY = 'ks_nursing_admin_applications_cache_v1';

@Injectable({
  providedIn: 'root'
})
export class AdminApplicationService {
  private readonly authService = inject(AdminAuthService);

  /**
   * Lists candidate applications with multi-path fallback (`/admin/applications`, `/applications/admin`,
   * and `/admin/enquiries` `[ONLINE_APPLICATION ...]` bridge) plus local/offline queue synchronization
   * so applications submitted on `/apply` are always visible in the Admin Panel.
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

      const bridged = await this.fetchApplicationsFromEnquiriesBridge().catch(() => []);
      const merged = this.mergeApplicationLists(result.data.applications || [], bridged);
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
        const bridged = await this.fetchApplicationsFromEnquiriesBridge().catch(() => []);
        if (bridged.length > 0) {
          const merged = this.mergeApplicationLists(bridged, []);
          this.saveLocalCache(merged);
        }
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
        (a) => a.id === id || a.applicationNumber === id
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
        // Persist status change to MongoDB via /admin/enquiries/:id/status if record is a bridged MongoDB ObjectId
        if (/^[a-f\d]{24}$/i.test(id)) {
          const enquiryStatus = this.mapAppStatusToEnquiryStatus(status);
          await this.authService
            .request(`/admin/enquiries/${id}/status`, {
              method: 'PATCH',
              body: JSON.stringify({ status: enquiryStatus })
            })
            .catch(() => {});
        }
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
        // Persist note to MongoDB via /admin/enquiries/:id/notes if record is a bridged MongoDB ObjectId
        if (/^[a-f\d]{24}$/i.test(id)) {
          await this.authService
            .request(`/admin/enquiries/${id}/notes`, {
              method: 'POST',
              body: JSON.stringify({ text: text.trim() })
            })
            .catch(() => {});
        }
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
   * Opens the printable institutional application slip in a new tab immediately using the complete
   * application dossier in memory so 404 remote receipt endpoints never block staff printing.
   */
  public openApplicationReceipt(app: AdminApplication): void {
    if (typeof window === 'undefined' || !app) return;

    const receiptWindow = window.open('', '_blank');
    if (!receiptWindow || !receiptWindow.document) return;

    receiptWindow.document.open();
    receiptWindow.document.write(this.buildFallbackReceiptHtml(app));
    receiptWindow.document.close();
  }

  /**
   * Fetches `[ONLINE_APPLICATION ...]` entries stored in Render's `/admin/enquiries` collection
   * and reconstructs full `AdminApplication` records.
   */
  private async fetchApplicationsFromEnquiriesBridge(): Promise<AdminApplication[]> {
    const res = await this.authService.request<{
      success: boolean;
      data: {
        enquiries: Array<{
          id?: string;
          _id?: string;
          name: string;
          phone: string;
          email?: string;
          program: string;
          message?: string;
          status?: string;
          notes?: Array<{ id?: string; author: string; text: string; createdAt?: string }>;
          createdAt?: string;
          updatedAt?: string;
        }>;
      };
    }>('/admin/enquiries?page=1&limit=100', { method: 'GET' });

    const enquiries = res?.data?.enquiries;
    if (!Array.isArray(enquiries)) return [];

    const apps: AdminApplication[] = [];
    for (const enq of enquiries) {
      const msg = String(enq?.message || '').trim();
      if (!msg.includes('[ONLINE_APPLICATION')) continue;
      apps.push(this.parseEnquiryToApplication(enq));
    }
    return apps;
  }

  private parseEnquiryToApplication(enq: any): AdminApplication {
    const msg = String(enq?.message || '').trim();
    const headerMatch = msg.match(/\[ONLINE_APPLICATION\s+([^\]]+)\]/i);
    const rawId = String(enq?.id || enq?._id || '');
    const applicationNumber = headerMatch?.[1]?.trim() || `KSIN-2026-APP-${rawId.slice(-6).toUpperCase()}`;

    const fields: Record<string, string> = {};
    const bodyAfterHeader = msg.replace(/\[ONLINE_APPLICATION[^\]]*\]/i, '').trim();

    if (bodyAfterHeader.includes('|')) {
      for (const part of bodyAfterHeader.split('|')) {
        const idx = part.indexOf(':');
        if (idx > 0) {
          const key = part.slice(0, idx).trim().toLowerCase();
          const val = part.slice(idx + 1).trim();
          fields[key] = val;
        }
      }
    } else {
      // Legacy comma-separated format: Father: X, Mother: Y, District: Z, 12th PCB: W%
      for (const part of bodyAfterHeader.split(',')) {
        const idx = part.indexOf(':');
        if (idx > 0) {
          const key = part.slice(0, idx).trim().toLowerCase();
          const val = part.slice(idx + 1).trim();
          fields[key] = val;
        }
      }
    }

    const parseAcadRow = (raw: string | undefined) => {
      if (!raw) return { board: 'BSEB', year: undefined, pct: undefined };
      const m = raw.match(/^([^(%]+?)(?:\((\d{4})\))?\s*([\d.]+)?%?$/);
      if (!m) return { board: raw, year: undefined, pct: undefined };
      return {
        board: m[1]?.trim() || 'BSEB',
        year: m[2] ? Number(m[2]) : undefined,
        pct: m[3] ? Number(m[3]) : undefined
      };
    };

    const tenth = parseAcadRow(fields['10th']);
    const twelfth = parseAcadRow(fields['12th']);
    const pcbRaw = (fields['pcb'] || fields['12th pcb'] || '').replace('%', '').trim();
    const pcbPct = pcbRaw && !Number.isNaN(Number(pcbRaw)) ? Number(pcbRaw) : undefined;

    const created = enq.createdAt || new Date().toISOString();
    return {
      id: rawId || applicationNumber,
      applicationNumber,
      applicantName: enq.name || 'Candidate',
      gender: fields['gender'] || 'Female',
      dob: fields['dob'] || '',
      fatherName: fields['father'] && fields['father'] !== 'N/A' ? fields['father'] : '',
      motherName: fields['mother'] && fields['mother'] !== 'N/A' ? fields['mother'] : '',
      phone: enq.phone || '',
      email: enq.email || '',
      category: fields['category'] || 'General',
      address: {
        street: fields['street'] || '',
        district: fields['district'] && fields['district'] !== 'N/A' ? fields['district'] : 'Patna',
        state: fields['state'] || 'Bihar',
        pincode: fields['pin'] || ''
      },
      program: enq.program || 'General Nursing & Midwifery (GNM)',
      academicDetails: {
        tenthBoard: tenth.board,
        tenthYear: tenth.year,
        tenthPercentage: tenth.pct,
        twelfthBoard: twelfth.board,
        twelfthYear: twelfth.year,
        twelfthPercentage: twelfth.pct,
        pcbPercentage: pcbPct
      },
      status: this.mapEnquiryStatusToAppStatus(enq.status),
      notes: Array.isArray(enq.notes) ? enq.notes : [],
      createdAt: created,
      updatedAt: enq.updatedAt || created
    };
  }

  private mapEnquiryStatusToAppStatus(enqStatus?: string): AdminApplication['status'] {
    switch (enqStatus) {
      case 'in_review':
        return 'under_review';
      case 'contacted':
        return 'document_verified';
      case 'admitted':
        return 'provisionally_selected';
      case 'closed':
      case 'archived':
        return 'rejected';
      default:
        return 'submitted';
    }
  }

  private mapAppStatusToEnquiryStatus(appStatus: string): string {
    switch (appStatus) {
      case 'under_review':
        return 'in_review';
      case 'document_verified':
        return 'contacted';
      case 'provisionally_selected':
        return 'admitted';
      case 'rejected':
        return 'closed';
      default:
        return 'new';
    }
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
    return this.mergeApplicationLists(cached, []);
  }

  private mergeApplicationLists(
    primaryList: AdminApplication[],
    secondaryList: AdminApplication[]
  ): AdminApplication[] {
    const byAppNum = new Map<string, AdminApplication>();

    for (const item of [...primaryList, ...secondaryList]) {
      if (item && item.applicationNumber && !byAppNum.has(item.applicationNumber)) {
        byAppNum.set(item.applicationNumber, item);
      }
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      for (const key of [OFFLINE_QUEUE_KEY, PUBLIC_OFFLINE_QUEUE_KEY]) {
        try {
          const offlineRaw = JSON.parse(localStorage.getItem(key) || '[]');
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
      }
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
    const updated = all.map((app) =>
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
    const updated = all.map((app) => {
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
      list = list.filter((a) => a.status === filters.status);
    }
    if (filters.program && filters.program !== 'all') {
      list = list.filter((a) => a.program === filters.program);
    }
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter(
        (a) =>
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

    const rows = apps.map((app) => [
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

    const csv = [headers.map(escapeCell).join(','), ...rows.map((r) => r.join(','))].join('\r\n');
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

    const submittedDate = app.createdAt
      ? new Date(app.createdAt).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
      : new Date().toLocaleDateString('en-IN');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Application Slip - ${esc(app.applicationNumber)} - Kavya Shree Institute of Nursing</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #1e293b; background-color: #f1f5f9; padding: 24px 16px; line-height: 1.5; }
    .action-bar { max-width: 800px; margin: 0 auto 16px auto; display: flex; justify-content: space-between; align-items: center; background: #0f2942; color: #ffffff; padding: 12px 20px; border-radius: 8px; }
    .action-bar button { background: #f59e0b; color: #0f2942; border: none; font-weight: 700; padding: 8px 18px; border-radius: 6px; cursor: pointer; font-size: 14px; }
    .receipt-container { max-width: 800px; margin: 0 auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 36px 40px; }
    .institute-header { text-align: center; border-bottom: 2px solid #0f2942; padding-bottom: 16px; margin-bottom: 24px; }
    .institute-name { font-size: 22px; font-weight: 800; color: #0f2942; letter-spacing: 0.5px; text-transform: uppercase; }
    .institute-affil { font-size: 12px; color: #475569; margin-top: 4px; font-weight: 500; }
    .receipt-title-badge { display: inline-block; margin-top: 10px; padding: 4px 14px; background: #f8fafc; border: 1px solid #e2e8f0; color: #0f2942; font-weight: 700; font-size: 13px; border-radius: 4px; text-transform: uppercase; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; background: #f8fafc; padding: 16px 20px; border-radius: 6px; border: 1px solid #e2e8f0; }
    .meta-item label { display: block; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 2px; }
    .meta-item .val { font-size: 15px; font-weight: 700; color: #0f2942; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    .section-title { font-size: 13px; text-transform: uppercase; color: #0f2942; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 10px; border-left: 4px solid #f59e0b; padding-left: 8px; }
    .data-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
    .data-table th, .data-table td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
    .data-table th { background: #f8fafc; color: #475569; font-weight: 700; width: 25%; }
    .status-badge { display: inline-block; padding: 2px 8px; font-size: 11px; font-weight: 700; border-radius: 4px; text-transform: uppercase; background: #dbeafe; color: #1e40af; }
    .signatures-row { display: flex; justify-content: space-between; align-items: center; margin-top: 36px; padding-top: 16px; }
    .sig-box { text-align: center; width: 200px; }
    .sig-line { border-top: 1px dashed #94a3b8; margin-bottom: 6px; }
    .sig-label { font-size: 12px; color: #64748b; font-weight: 600; }
    .seal-box { border: 2px solid #0f2942; color: #0f2942; font-size: 11px; font-weight: 700; padding: 10px 14px; border-radius: 50%; width: 90px; height: 90px; display: flex; align-items: center; justify-content: center; text-align: center; text-transform: uppercase; opacity: 0.75; }
    @media print { body { background: #ffffff; padding: 0; } .action-bar { display: none; } .receipt-container { border: none; padding: 0; max-width: 100%; } }
  </style>
</head>
<body>
  <div class="action-bar">
    <div><strong>Kavya Shree Institute of Nursing</strong> &bull; Official Candidate Application Slip (Staff Copy)</div>
    <div><button onclick="window.print()">Print / Save as PDF</button></div>
  </div>
  <div class="receipt-container">
    <div class="institute-header">
      <div class="institute-name">Kavya Shree Institute of Nursing</div>
      <div class="institute-affil">Punpun, Patna, Bihar &bull; Admissions Intake 2026–2027</div>
      <div class="receipt-title-badge">Official Candidate Application Dossier</div>
    </div>
    <div class="meta-grid">
      <div class="meta-item"><label>Application Number</label><div class="val">${esc(app.applicationNumber)}</div></div>
      <div class="meta-item" style="text-align:right;"><label>Submission Date</label><div class="val">${esc(submittedDate)}</div></div>
      <div class="meta-item"><label>Applied Program</label><div class="val" style="font-family:inherit;font-size:14px;color:#0284c7;">${esc(app.program)}</div></div>
      <div class="meta-item" style="text-align:right;"><label>Status</label><div class="status-badge">${esc(app.status)}</div></div>
    </div>
    <div class="section-title">1. Candidate &amp; Contact Information</div>
    <table class="data-table">
      <tr><th>Applicant Name</th><td><strong>${esc(app.applicantName)}</strong></td><th>DOB / Gender</th><td>${esc(app.dob || 'N/A')} (${esc(app.gender)})</td></tr>
      <tr><th>Father's Name</th><td>${esc(app.fatherName || 'N/A')}</td><th>Mother's Name</th><td>${esc(app.motherName || 'N/A')}</td></tr>
      <tr><th>Phone</th><td>${esc(app.phone)}</td><th>Email</th><td>${esc(app.email || 'N/A')}</td></tr>
      <tr><th>Category</th><td>${esc(app.category)}</td><th>Address</th><td>${esc(app.address?.street)} ${esc(app.address?.district)}, ${esc(app.address?.state)} - ${esc(app.address?.pincode)}</td></tr>
    </table>
    <div class="section-title">2. Academic Merit Record</div>
    <table class="data-table">
      <tr><th>10th Score</th><td>${esc(app.academicDetails?.tenthBoard || 'BSEB')} (${esc(app.academicDetails?.tenthYear || '-')}) - <strong>${esc(app.academicDetails?.tenthPercentage ?? 'N/A')}%</strong></td><th>12th / PCB</th><td>${esc(app.academicDetails?.twelfthBoard || 'BSEB')} (${esc(app.academicDetails?.twelfthYear || '-')}) - <strong>${esc(app.academicDetails?.twelfthPercentage ?? 'N/A')}%</strong> (PCB: ${esc(app.academicDetails?.pcbPercentage ?? 'N/A')}%)</td></tr>
    </table>
    <div class="signatures-row">
      <div class="sig-box"><div class="sig-line"></div><div class="sig-label">Candidate Signature</div></div>
      <div class="seal-box">Official<br>Seal</div>
      <div class="sig-box"><div class="sig-line"></div><div class="sig-label">Authorized Admissions Officer</div></div>
    </div>
  </div>
</body>
</html>`;
  }
}
