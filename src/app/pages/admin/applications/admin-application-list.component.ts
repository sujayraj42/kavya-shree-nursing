import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AdminApplicationService, AdminApplication } from '../services/admin-application.service';
import { environment } from '../../../../environments/environment';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'document_verified', label: 'Document Verified' },
  { value: 'provisionally_selected', label: 'Provisionally Selected' },
  { value: 'rejected', label: 'Rejected' }
];

const PROGRAM_OPTIONS = [
  { value: 'all', label: 'All Programs' },
  { value: 'Auxiliary Nursing & Midwifery (ANM)', label: 'ANM' },
  { value: 'General Nursing & Midwifery (GNM)', label: 'GNM' },
  { value: 'Bachelor of Science in Nursing (B.Sc.)', label: 'B.Sc. Nursing' },
  { value: 'Post Basic B.Sc. Nursing', label: 'Post Basic B.Sc.' },
  { value: 'Master of Science in Nursing (M.Sc.)', label: 'M.Sc. Nursing' }
];

@Component({
  selector: 'app-admin-application-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-application-list.component.html',
  styleUrl: './admin-application-list.component.css'
})
export class AdminApplicationListComponent implements OnInit {
  private readonly appService = inject(AdminApplicationService);

  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly programOptions = PROGRAM_OPTIONS;

  // Filters
  protected readonly searchQuery = signal('');
  protected readonly selectedStatus = signal('all');
  protected readonly selectedProgram = signal('all');
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);

  // Data signals
  protected readonly applications = signal<AdminApplication[]>([]);
  protected readonly pagination = signal({ total: 0, page: 1, limit: 10, pages: 1 });
  protected readonly isLoading = signal(true);
  protected readonly isExporting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');

  // Selected Detail Modal
  protected readonly selectedApp = signal<AdminApplication | null>(null);
  protected readonly newStatus = signal('');
  protected readonly isUpdatingStatus = signal(false);

  public ngOnInit(): void {
    this.loadApplications();
  }

  public async loadApplications(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const data = await this.appService.listApplications({
        page: this.currentPage(),
        limit: this.pageSize(),
        status: this.selectedStatus(),
        program: this.selectedProgram(),
        search: this.searchQuery()
      });

      this.applications.set(data.applications);
      this.pagination.set(data.pagination);
    } catch (err: any) {
      this.errorMessage.set(err?.message || 'Failed to load applications.');
    } finally {
      this.isLoading.set(false);
    }
  }

  protected onSearch(): void {
    this.currentPage.set(1);
    this.loadApplications();
  }

  protected onStatusFilter(status: string): void {
    this.selectedStatus.set(status);
    this.currentPage.set(1);
    this.loadApplications();
  }

  protected onProgramFilter(program: string): void {
    this.selectedProgram.set(program);
    this.currentPage.set(1);
    this.loadApplications();
  }

  protected resetFilters(): void {
    this.searchQuery.set('');
    this.selectedStatus.set('all');
    this.selectedProgram.set('all');
    this.currentPage.set(1);
    this.loadApplications();
  }

  protected goToPage(page: number): void {
    if (page < 1 || page > this.pagination().pages || page === this.currentPage()) {
      return;
    }
    this.currentPage.set(page);
    this.loadApplications();
  }

  protected openDetail(app: AdminApplication): void {
    this.selectedApp.set(app);
    this.newStatus.set(app.status);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  protected closeDetail(): void {
    this.selectedApp.set(null);
  }

  protected async updateStatus(): Promise<void> {
    const app = this.selectedApp();
    const status = this.newStatus();
    if (!app || !status || status === app.status) return;

    this.isUpdatingStatus.set(true);
    try {
      await this.appService.updateStatus(app.id, status);
      this.successMessage.set(`Status updated to ${status}`);
      // Refresh current record
      const updated = { ...app, status: status as AdminApplication['status'] };
      this.selectedApp.set(updated);
      this.loadApplications();
    } catch (err: any) {
      this.errorMessage.set(err?.message || 'Failed to update application status.');
    } finally {
      this.isUpdatingStatus.set(false);
    }
  }

  protected async exportCsv(): Promise<void> {
    if (this.isExporting()) return;
    this.isExporting.set(true);
    try {
      await this.appService.exportApplicationsCsv();
    } catch (err: any) {
      this.errorMessage.set(err?.message || 'Failed to export applications CSV.');
    } finally {
      this.isExporting.set(false);
    }
  }

  protected printReceipt(app: AdminApplication): void {
    if (!app || !app.applicationNumber) return;
    const url = `${environment.apiBaseUrl}/applications/${app.applicationNumber}/receipt`;
    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
  }

  protected getBadgeClass(status: string): string {
    switch (status) {
      case 'submitted': return 'badge bg-secondary';
      case 'under_review': return 'badge bg-warning text-dark';
      case 'document_verified': return 'badge bg-info text-dark';
      case 'provisionally_selected': return 'badge bg-success';
      case 'rejected': return 'badge bg-danger';
      default: return 'badge bg-light text-dark';
    }
  }

  protected getStatusLabel(status: string): string {
    switch (status) {
      case 'submitted': return 'Submitted';
      case 'under_review': return 'Under Review';
      case 'document_verified': return 'Document Verified';
      case 'provisionally_selected': return 'Provisionally Selected';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  }
}

