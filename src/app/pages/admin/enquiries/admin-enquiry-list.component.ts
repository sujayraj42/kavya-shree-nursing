import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminEnquiryService } from '../services/admin-enquiry.service';
import {
  AdminEnquiry,
  EnquiryPagination,
  EnquiryStatus,
  ENQUIRY_STATUS_BADGE_CLASS,
  ENQUIRY_STATUS_LABELS,
  VALID_ENQUIRY_STATUSES,
  formatAdminDate,
  formatRefId
} from '../models/admin.models';

const ADVERTISED_PROGRAMS = [
  'Auxiliary Nursing & Midwifery (ANM)',
  'General Nursing & Midwifery (GNM)',
  'Bachelor of Science in Nursing (B.Sc.)',
  'Post Basic B.Sc. Nursing',
  'Master of Science in Nursing (M.Sc.)'
];

@Component({
  selector: 'app-admin-enquiry-list',
  imports: [RouterLink, FormsModule],
  templateUrl: './admin-enquiry-list.component.html',
  styleUrl: './admin-enquiry-list.component.css'
})
export class AdminEnquiryListComponent implements OnInit {
  private readonly enquiryService = inject(AdminEnquiryService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly advertisedPrograms = ADVERTISED_PROGRAMS;
  protected readonly validStatuses = VALID_ENQUIRY_STATUSES;

  // Filter Signals
  protected readonly searchQuery = signal('');
  protected readonly selectedStatus = signal('all');
  protected readonly selectedProgram = signal('all');
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);

  // Data Signals
  protected readonly enquiries = signal<AdminEnquiry[]>([]);
  protected readonly pagination = signal<EnquiryPagination>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1
  });
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');

  public ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const statusParam = params.get('status');
      this.selectedStatus.set(statusParam || 'all');
      const pageParam = parseInt(params.get('page') || '1', 10);
      if (pageParam > 0) {
        this.currentPage.set(pageParam);
      }
      this.loadEnquiries();
    });
  }

  public async loadEnquiries(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const data = await this.enquiryService.listEnquiries({
        page: this.currentPage(),
        limit: this.pageSize(),
        status: this.selectedStatus(),
        program: this.selectedProgram(),
        search: this.searchQuery()
      });

      this.enquiries.set(data.enquiries);
      this.pagination.set(data.pagination);
      this.isLoading.set(false);
    } catch (err: any) {
      this.errorMessage.set(err?.message || 'Failed to retrieve enquiries. Please check connection.');
      this.isLoading.set(false);
    }
  }

  protected onSearch(): void {
    this.currentPage.set(1);
    this.loadEnquiries();
  }

  protected onStatusFilter(status: string): void {
    this.selectedStatus.set(status);
    this.currentPage.set(1);
    this.loadEnquiries();
  }

  protected onProgramFilter(program: string): void {
    this.selectedProgram.set(program);
    this.currentPage.set(1);
    this.loadEnquiries();
  }

  protected resetFilters(): void {
    this.searchQuery.set('');
    this.selectedStatus.set('all');
    this.selectedProgram.set('all');
    this.currentPage.set(1);
    this.loadEnquiries();
  }

  protected goToPage(page: number): void {
    if (page < 1 || page > this.pagination().pages || page === this.currentPage()) {
      return;
    }
    this.currentPage.set(page);
    this.loadEnquiries();
  }

  protected getBadgeClass(status: string): string {
    return ENQUIRY_STATUS_BADGE_CLASS[status as EnquiryStatus] || 'badge bg-secondary';
  }

  protected getStatusLabel(status: string): string {
    return ENQUIRY_STATUS_LABELS[status as EnquiryStatus] || status;
  }

  protected formatRef(id: string): string {
    return formatRefId(id);
  }

  protected formatDate(dateStr: string): string {
    return formatAdminDate(dateStr, false);
  }
}
