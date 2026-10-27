import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  imports: [RouterLink, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  // iUniversity Program Tabs State (5 Advertised Programs)
  protected readonly activeProgramTab = signal<'all' | 'degree' | 'diploma' | 'pg'>('all');

  // Candidate Enquiry Form Fields
  protected readonly applicantName = signal('');
  protected readonly applicantPhone = signal('');
  protected readonly applicantEmail = signal('');
  protected readonly selectedProgram = signal('');
  protected readonly applicantMessage = signal('');

  // Field-Level Validation State
  protected readonly nameError = signal('');
  protected readonly phoneError = signal('');
  protected readonly emailError = signal('');
  protected readonly programError = signal('');
  protected readonly formValidationError = signal('');

  // Submission Status
  protected readonly isFormSubmitted = signal(false);
  protected readonly confirmedSubmission = signal<{
    name: string;
    program: string;
    phone: string;
    email: string;
  } | null>(null);

  /**
   * Sets the active program category tab (iUniversity tab system).
   */
  protected setProgramTab(tab: 'all' | 'degree' | 'diploma' | 'pg'): void {
    this.activeProgramTab.set(tab);
  }

  /**
   * Preselects an academic program when clicked from a course card
   * and smoothly routes the user to the enquiry form.
   */
  protected onProgramSelect(programName: string): void {
    this.selectedProgram.set(programName);
    this.programError.set('');
  }

  /**
   * Validates all required inputs with rigorous field-level checks
   * and simulates a secure local demonstration submission.
   */
  protected submitEnquiry(): void {
    const name = this.applicantName().trim();
    const phone = this.applicantPhone().trim();
    const email = this.applicantEmail().trim();
    const program = this.selectedProgram().trim();

    let hasError = false;

    // 1. Name Validation
    if (!name || name.length < 2) {
      this.nameError.set('Please enter the candidate’s full name (at least 2 characters).');
      hasError = true;
    } else {
      this.nameError.set('');
    }

    // 2. Phone Validation (must have at least 10 digits)
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

    // 3. Email Validation (if provided, must be syntactically valid)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      this.emailError.set('Please enter a valid email address (e.g. name@domain.com).');
      hasError = true;
    } else {
      this.emailError.set('');
    }

    // 4. Program Selection Validation
    if (!program) {
      this.programError.set('Please select an intended academic program.');
      hasError = true;
    } else {
      this.programError.set('');
    }

    if (hasError) {
      this.formValidationError.set('Please review and correct the highlighted fields above.');
      return;
    }

    // Success State
    this.formValidationError.set('');
    this.confirmedSubmission.set({
      name,
      program,
      phone,
      email: email || 'Not provided'
    });
    this.isFormSubmitted.set(true);
  }

  /**
   * Resets all form fields and error indicators.
   */
  protected resetForm(): void {
    this.applicantName.set('');
    this.applicantPhone.set('');
    this.applicantEmail.set('');
    this.selectedProgram.set('');
    this.applicantMessage.set('');

    this.nameError.set('');
    this.phoneError.set('');
    this.emailError.set('');
    this.programError.set('');
    this.formValidationError.set('');

    this.confirmedSubmission.set(null);
    this.isFormSubmitted.set(false);
  }
}
