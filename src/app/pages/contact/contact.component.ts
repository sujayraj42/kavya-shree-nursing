import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EMAIL_REGEX } from '../../core/services/enquiry.service';

@Component({
  selector: 'app-contact',
  imports: [RouterLink, FormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent {
  protected readonly contactName = signal('');
  protected readonly contactPhone = signal('');
  protected readonly contactEmail = signal('');
  protected readonly contactSubject = signal('');
  protected readonly contactMessage = signal('');

  protected readonly nameError = signal('');
  protected readonly phoneError = signal('');
  protected readonly emailError = signal('');
  protected readonly messageError = signal('');
  protected readonly formValidationError = signal('');

  protected readonly isMessageSent = signal(false);

  protected sendMessage(): void {
    const name = this.contactName().trim();
    const phone = this.contactPhone().trim();
    const email = this.contactEmail().trim();
    const message = this.contactMessage().trim();

    let hasError = false;

    if (!name || name.length < 2) {
      this.nameError.set('Please enter your full name (at least 2 characters).');
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
    } else {
      this.messageError.set('');
    }

    if (hasError) {
      this.formValidationError.set('Please correct the highlighted fields before submitting.');
      return;
    }

    this.formValidationError.set('');
    this.isMessageSent.set(true);
  }

  protected resetContactForm(): void {
    this.contactName.set('');
    this.contactPhone.set('');
    this.contactEmail.set('');
    this.contactSubject.set('');
    this.contactMessage.set('');

    this.nameError.set('');
    this.phoneError.set('');
    this.emailError.set('');
    this.messageError.set('');
    this.formValidationError.set('');

    this.isMessageSent.set(false);
  }
}

