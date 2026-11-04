import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../core/services/i18n.service';

export const CONTACT_CONFIG = {
  primaryPhone: '+919661666485',
  displayPhone: '+91 96616 66485',
  whatsappNumber: '919661666485',
  whatsappMessage: 'Hello, I want to enquire about nursing admissions 2026 at Kavya Shree Institute of Nursing.'
};

@Component({
  selector: 'app-floating-actions',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './floating-actions.component.html',
  styleUrl: './floating-actions.component.css'
})
export class FloatingActionsComponent {
  protected readonly config = CONTACT_CONFIG;
  protected readonly i18n = inject(I18nService);

  protected getWhatsAppUrl(): string {
    const encoded = encodeURIComponent(this.config.whatsappMessage);
    return `https://wa.me/${this.config.whatsappNumber}?text=${encoded}`;
  }
}

