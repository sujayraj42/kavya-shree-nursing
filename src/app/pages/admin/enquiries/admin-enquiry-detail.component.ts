import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminEnquiryService } from '../services/admin-enquiry.service';
import {
  AdminEnquiry,
  EnquiryStatus,
  ENQUIRY_STATUS_BADGE_CLASS,
  ENQUIRY_STATUS_LABELS,
  VALID_ENQUIRY_STATUSES,
  formatAdminDate
} from '../models/admin.models';

@Component({
  selector: 'app-admin-enquiry-detail',
  imports: [RouterLink, FormsModule],
  templateUrl: './admin-enquiry-detail.component.html',
  styleUrl: './admin-enquiry-detail.component.css'
})
export class AdminEnquiryDetailComponent implements OnInit {
  private readonly enquiryService = inject(AdminEnquiryService);
  private readonly route = inject(ActivatedRoute);

  protected readonly validStatuses = VALID_ENQUIRY_STATUSES;

  protected readonly enquiry = signal<AdminEnquiry | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');

  // Status Update State
  protected readonly selectedStatus = signal<EnquiryStatus>('new');
  protected readonly isUpdatingStatus = signal(false);
  protected readonly statusSuccessMessage = signal('');
  protected readonly statusErrorMessage = signal('');

  // Internal Note State
  protected readonly newNoteText = signal('');
  protected readonly isSubmittingNote = signal(false);
  protected readonly noteErrorMessage = signal('');

  public ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.loadEnquiry(id);
      } else {
        this.errorMessage.set('Invalid or missing enquiry reference.');
        this.isLoading.set(false);
      }
    });
  }

  public async loadEnquiry(id: string): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const data = await this.enquiryService.getEnquiryById(id);
      this.enquiry.set(data);
      this.selectedStatus.set(data.status);
      this.isLoading.set(false);
    } catch (err: any) {
      this.errorMessage.set(err?.message || 'Failed to load enquiry details.');
      this.isLoading.set(false);
    }
  }

  protected async updateStatus(): Promise<void> {
    if (this.isUpdatingStatus()) return;
    const current = this.enquiry();
    if (!current) return;

    const newStatus = this.selectedStatus();
    if (newStatus === current.status) {
      return;
    }

    this.isUpdatingStatus.set(true);
    this.statusSuccessMessage.set('');
    this.statusErrorMessage.set('');

    try {
      const res = await this.enquiryService.updateStatus(current.id, newStatus);
      this.enquiry.update((e) => (e ? { ...e, status: res.status, updatedAt: res.updatedAt } : null));
      this.statusSuccessMessage.set(`Workflow status updated to "${ENQUIRY_STATUS_LABELS[res.status]}".`);
      this.isUpdatingStatus.set(false);
    } catch (err: any) {
      this.statusErrorMessage.set(err?.message || 'Failed to update status.');
      this.isUpdatingStatus.set(false);
    }
  }

  protected async addInternalNote(): Promise<void> {
    if (this.isSubmittingNote()) return;
    const current = this.enquiry();
    const text = this.newNoteText().trim();

    if (!current) return;

    if (!text) {
      this.noteErrorMessage.set('Please enter a note before submitting.');
      return;
    }
    if (text.length > 1000) {
      this.noteErrorMessage.set('Note cannot exceed 1000 characters.');
      return;
    }

    this.isSubmittingNote.set(true);
    this.noteErrorMessage.set('');

    try {
      const createdNote = await this.enquiryService.addNote(current.id, text);
      this.enquiry.update((e) => {
        if (!e) return null;
        return {
          ...e,
          notes: [...e.notes, createdNote]
        };
      });
      this.newNoteText.set('');
      this.isSubmittingNote.set(false);
    } catch (err: any) {
      this.noteErrorMessage.set(err?.message || 'Failed to save internal note.');
      this.isSubmittingNote.set(false);
    }
  }

  protected getBadgeClass(status: string): string {
    return ENQUIRY_STATUS_BADGE_CLASS[status as EnquiryStatus] || 'badge bg-secondary';
  }

  protected getStatusLabel(status: string): string {
    return ENQUIRY_STATUS_LABELS[status as EnquiryStatus] || status;
  }

  protected formatDate(dateStr: string, includeTime = false): string {
    return formatAdminDate(dateStr, includeTime);
  }
}
