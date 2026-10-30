import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminEnquiryService } from '../services/admin-enquiry.service';
import { AdminAuthService } from '../services/admin-auth.service';
import {
  AdminEnquiry,
  DashboardStats,
  ENQUIRY_STATUS_BADGE_CLASS,
  ENQUIRY_STATUS_LABELS,
  EnquiryStatus,
  formatAdminDate
} from '../models/admin.models';

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  protected readonly enquiryService = inject(AdminEnquiryService);
  protected readonly authService = inject(AdminAuthService);

  protected readonly stats = signal<DashboardStats | null>(null);
  protected readonly recentEnquiries = signal<AdminEnquiry[]>([]);
  protected readonly isLoading = signal<boolean>(true);
  protected readonly errorMessage = signal<string>('');

  public ngOnInit(): void {
    this.loadDashboard();
  }

  public async loadDashboard(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const data = await this.enquiryService.getDashboardData();
      this.stats.set(data.stats);
      this.recentEnquiries.set(data.recentEnquiries);
      this.isLoading.set(false);
    } catch (err: any) {
      this.errorMessage.set(err?.message || 'Failed to load dashboard metrics. Please try again.');
      this.isLoading.set(false);
    }
  }

  protected formatDate(dateStr: string): string {
    return formatAdminDate(dateStr);
  }

  protected getBadgeClass(status: string): string {
    return ENQUIRY_STATUS_BADGE_CLASS[status as EnquiryStatus] || 'badge bg-secondary';
  }

  protected getStatusLabel(status: string): string {
    return ENQUIRY_STATUS_LABELS[status as EnquiryStatus] || status;
  }
}
