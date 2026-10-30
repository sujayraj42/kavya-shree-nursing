import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EnquiryService } from '../../core/services/enquiry.service';

@Component({
  selector: 'app-admissions',
  imports: [RouterLink, FormsModule],
  templateUrl: './admissions.component.html',
  styleUrl: './admissions.component.css'
})
export class AdmissionsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly enquiryService = inject(EnquiryService);

  // Form Fields
  protected readonly applicantName = signal('');
  protected readonly applicantPhone = signal('');
  protected readonly applicantEmail = signal('');
  protected readonly selectedProgram = signal('');
  protected readonly applicantMessage = signal('');
  protected readonly applicantConsent = signal(false);

  // Field-Level Validation State
  protected readonly nameError = signal('');
  protected readonly phoneError = signal('');
  protected readonly emailError = signal('');
  protected readonly programError = signal('');
  protected readonly consentError = signal('');
  protected readonly formValidationError = signal('');
  protected readonly serverError = signal('');

  // Submission Status
  protected readonly isSubmitting = signal(false);
  protected readonly isFormSubmitted = signal(false);
  protected readonly confirmedSubmission = signal<{
    id?: string;
    name: string;
    program: string;
    phone: string;
    email: string;
  } | null>(null);

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const prog = params.get('program');
      if (prog) {
        this.selectedProgram.set(prog);
      }
    });
  }

  protected submitEnquiry(): void {
    if (this.isSubmitting()) {
      return;
    }

    const name = this.applicantName().trim();
    const phone = this.applicantPhone().trim();
    const email = this.applicantEmail().trim();
    const program = this.selectedProgram().trim();
    const message = this.applicantMessage().trim();
    const consent = this.applicantConsent();

    let hasError = false;

    if (!name || name.length < 2) {
      this.nameError.set('Please enter the candidate’s full name (at least 2 characters).');
      hasError = true;
    } else {
      this.nameError.set('');
    }

    const phoneDigitsOnly = phone.replace(/\D/g, '');
    if (!phone) {
      this.phoneError.set('Please provide a contact phone number.');
      hasError = true;
    } else if (phoneDigitsOnly.length < 10) {
      this.phoneError.set('Please enter a valid phone number with at least 10 digits.');
      hasError = true;
    } else {
      this.phoneError.set('');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      this.emailError.set('Please enter a valid email address (e.g. name@domain.com).');
      hasError = true;
    } else {
      this.emailError.set('');
    }

    if (!program) {
      this.programError.set('Please select an intended academic program.');
      hasError = true;
    } else {
      this.programError.set('');
    }

    if (!consent) {
      this.consentError.set('Candidate consent is required to process an admissions enquiry.');
      hasError = true;
    } else {
      this.consentError.set('');
    }

    if (hasError) {
      this.formValidationError.set('Please review and correct the highlighted fields above.');
      return;
    }

    this.formValidationError.set('');
    this.serverError.set('');
    this.isSubmitting.set(true);

    this.enquiryService
      .submitEnquiry({
        name,
        phone: phoneDigitsOnly,
        email: email || null,
        program,
        message,
        consent: true
      })
      .subscribe({
        next: (res) => {
          this.isSubmitting.set(false);
          this.confirmedSubmission.set({
            id: res.data?.id,
            name,
            program: res.data?.program || program,
            phone,
            email: email || 'Not provided'
          });
          this.isFormSubmitted.set(true);

          this.applicantName.set('');
          this.applicantPhone.set('');
          this.applicantEmail.set('');
          this.selectedProgram.set('');
          this.applicantMessage.set('');
          this.applicantConsent.set(false);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          const serverMsg =
            err?.error?.error ||
            'Unable to connect to the admissions service. Please verify your connection or call our admissions helpline (+91 96616 66485).';
          this.serverError.set(serverMsg);
        }
      });
  }

  protected resetForm(): void {
    this.applicantName.set('');
    this.applicantPhone.set('');
    this.applicantEmail.set('');
    this.selectedProgram.set('');
    this.applicantMessage.set('');
    this.applicantConsent.set(false);

    this.nameError.set('');
    this.phoneError.set('');
    this.emailError.set('');
    this.programError.set('');
    this.consentError.set('');
    this.formValidationError.set('');
    this.serverError.set('');

    this.confirmedSubmission.set(null);
    this.isFormSubmitted.set(false);
  }
}
