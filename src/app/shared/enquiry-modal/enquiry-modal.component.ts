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

    // OPTIMISTIC UI: Instantly display provisional success while dispatching HTTP request
    const optimisticRef = 'KSN-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    this.referenceId.set(optimisticRef);
    this.successMessage.set(this.i18n.translate('status.success') + optimisticRef);
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
        const finalRef = res.data?.id ? res.data.id.slice(-6).toUpperCase() : optimisticRef;
        this.referenceId.set(finalRef);
        this.successMessage.set(this.i18n.translate('status.success') + finalRef);
        // Reset form once verified
        this.name.set('');
        this.phone.set('');
        this.email.set('');
        this.message.set('');
      },
      error: (err) => {
        this.isSubmitting.set(false);
        // Rollback optimistic feedback on network failure
        this.successMessage.set('');
        this.referenceId.set('');
        this.errorMessage.set(err?.error?.error || err?.message || this.i18n.translate('status.error'));
      }
    });
  }
}

