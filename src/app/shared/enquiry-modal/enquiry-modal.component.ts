import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalService } from '../../core/services/modal.service';
import { EnquiryService, validateEnquiryForm } from '../../core/services/enquiry.service';
import { I18nService } from '../../core/services/i18n.service';

const PROGRAMS = [
  'Auxiliary Nursing & Midwifery (ANM)',
  'General Nursing & Midwifery (GNM)',
  'Bachelor of Science in Nursing (B.Sc.)',
  'Post Basic B.Sc. Nursing',
  'Master of Science in Nursing (M.Sc.)'
];

@Component({
  selector: 'app-enquiry-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './enquiry-modal.component.html',
  styleUrl: './enquiry-modal.component.css'
})
export class EnquiryModalComponent {
  protected readonly modalService = inject(ModalService);
  private readonly enquiryService = inject(EnquiryService);
  protected readonly i18n = inject(I18nService);

  protected readonly programs = PROGRAMS;

  // Form Fields
  protected name = signal('');
  protected phone = signal('');
  protected email = signal('');
  protected message = signal('');
  protected consent = signal(true);

  // States
  protected isSubmitting = signal(false);
  protected errorMessage = signal('');
  protected successMessage = signal('');
  protected referenceId = signal('');

  // Field validation errors
  protected nameError = signal('');
  protected phoneError = signal('');
  protected emailError = signal('');

  protected close(): void {
    this.modalService.closeEnquiryModal();
  }

  protected async onSubmit(): Promise<void> {
    if (this.isSubmitting()) return;

    this.errorMessage.set('');
    this.successMessage.set('');

    const validation = validateEnquiryForm({
      name: this.name(),
      phone: this.phone(),
      email: this.email(),
      program: this.modalService.selectedProgram(),
      consent: this.consent()
    });

    this.nameError.set(validation.nameError);
    this.phoneError.set(validation.phoneError);
    this.emailError.set(validation.emailError);

    if (validation.hasError) {
      return;
    }

    this.isSubmitting.set(true);

    this.enquiryService.submitEnquiry({
      name: this.name().trim(),
      phone: validation.phoneDigitsOnly,
      email: this.email().trim() || null,
      program: this.modalService.selectedProgram(),
      message: this.message().trim() || '',
      consent: true
    }).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.referenceId.set(res.data?.id ? res.data.id.slice(-6).toUpperCase() : 'REC-2026');
        this.successMessage.set(this.i18n.translate('status.success') + this.referenceId());
        // Reset form
        this.name.set('');
        this.phone.set('');
        this.email.set('');
        this.message.set('');
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err?.error?.error || err?.message || this.i18n.translate('status.error'));
      }
    });
  }
}

