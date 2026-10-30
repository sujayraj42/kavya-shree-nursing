import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EMAIL_REGEX, EnquiryService } from '../../core/services/enquiry.service';

@Component({
  selector: 'app-contact',
  imports: [RouterLink, FormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent {
  private readonly enquiryService = inject(EnquiryService);

  protected readonly contactName = signal('');
  protected readonly contactPhone = signal('');
  protected readonly contactEmail = signal('');
  protected readonly contactProgram = signal('General Nursing & Midwifery (GNM)');
  protected readonly contactSubject = signal('');
  protected readonly contactMessage = signal('');
  protected readonly contactConsent = signal(true);

  protected readonly nameError = signal('');
  protected readonly phoneError = signal('');
  protected readonly emailError = signal('');
  protected readonly messageError = signal('');
  protected readonly consentError = signal('');
  protected readonly formValidationError = signal('');
  protected readonly serverError = signal('');

  protected readonly isSubmitting = signal(false);
  protected readonly isMessageSent = signal(false);
  protected readonly confirmedReferenceId = signal('');

  protected sendMessage(): void {
    if (this.isSubmitting()) {
      return;
    }

    const name = this.contactName().trim();
    const phone = this.contactPhone().trim();
    const email = this.contactEmail().trim();
    const program = this.contactProgram().trim() || 'General Nursing & Midwifery (GNM)';
    const subject = this.contactSubject().trim();
    const message = this.contactMessage().trim();
    const consent = this.contactConsent();

    let hasError = false;

    if (!name || name.length < 2) {
      this.nameError.set('Please enter your full name (at least 2 characters).');
      hasError = true;
    } else if (name.length > 100) {
      this.nameError.set('Name cannot exceed 100 characters.');
      hasError = true;
    } else {
      this.nameError.set('');
    }

    const phoneDigits = phone.replace(/\D/g, '');
    if (!phone) {
      this.phoneError.set('Please provide a contact phone number.');
      hasError = true;
    } else if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      this.phoneError.set('Please provide a valid 10-digit phone number.');
      hasError = true;
    } else {
      this.phoneError.set('');
    }

    if (email && (!EMAIL_REGEX.test(email) || email.length > 255)) {
      this.emailError.set('Please enter a valid email address.');
      hasError = true;
    } else {
      this.emailError.set('');
    }

    if (!message || message.length < 5) {
      this.messageError.set('Please enter a message or query (at least 5 characters).');
      hasError = true;
    } else if (message.length > 900) {
      this.messageError.set('Message cannot exceed 900 characters.');
      hasError = true;
    } else {
      this.messageError.set('');
    }

    if (!consent) {
      this.consentError.set('Consent is required to process your inquiry.');
      hasError = true;
    } else {
      this.consentError.set('');
    }

    if (hasError) {
      this.formValidationError.set('Please correct the highlighted fields before submitting.');
      return;
    }

    this.formValidationError.set('');
    this.serverError.set('');
    this.isSubmitting.set(true);

    const combinedMessage = subject ? `[${subject}] ${message}` : message;

    this.enquiryService
      .submitEnquiry({
        name,
        phone: phoneDigits,
        email: email || null,
        program,
        message: combinedMessage,
        consent: true
      })
      .subscribe({
        next: (res) => {
          this.isSubmitting.set(false);
          this.confirmedReferenceId.set(res.data?.id || '');
          this.isMessageSent.set(true);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          const serverMsg =
            err?.error?.error ||
            'Unable to reach the admissions desk service. Please verify your connection or call +91 96616 66485.';
          this.serverError.set(serverMsg);
        }
      });
  }

  protected resetContactForm(): void {
    this.contactName.set('');
    this.contactPhone.set('');
    this.contactEmail.set('');
    this.contactProgram.set('General Nursing & Midwifery (GNM)');
    this.contactSubject.set('');
    this.contactMessage.set('');
    this.contactConsent.set(true);

    this.nameError.set('');
    this.phoneError.set('');
    this.emailError.set('');
    this.messageError.set('');
    this.consentError.set('');
    this.formValidationError.set('');
    this.serverError.set('');
    this.confirmedReferenceId.set('');

    this.isMessageSent.set(false);
  }
}
