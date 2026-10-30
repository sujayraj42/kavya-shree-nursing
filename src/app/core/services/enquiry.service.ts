import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface EnquiryPayload {
  name: string;
  phone: string;
  email?: string | null;
  program: string;
  message?: string;
  consent: boolean;
}

export interface EnquiryResponseData {
  id: string;
  program: string;
  status: string;
  createdAt: string;
}

export interface EnquirySuccessResponse {
  success: true;
  message: string;
  data: EnquiryResponseData;
}

export interface EnquiryErrorResponse {
  success: false;
  error: string;
  errors?: Array<{ field: string; message: string }>;
}

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface EnquiryFormValidationResult {
  hasError: boolean;
  phoneDigitsOnly: string;
  nameError: string;
  phoneError: string;
  emailError: string;
  programError: string;
  consentError: string;
}

/**
 * Shared client-side validation for admissions enquiry forms (Home & Admissions pages).
 * Enforces identical lower and upper bounds as the backend Mongoose schema.
 */
export function validateEnquiryForm(input: {
  name: string;
  phone: string;
  email: string;
  program: string;
  consent: boolean;
}): EnquiryFormValidationResult {
  let hasError = false;
  let nameError = '';
  let phoneError = '';
  let emailError = '';
  let programError = '';
  let consentError = '';

  if (!input.name || input.name.length < 2) {
    nameError = 'Please enter the candidate’s full name (at least 2 characters).';
    hasError = true;
  } else if (input.name.length > 100) {
    nameError = 'Candidate name cannot exceed 100 characters.';
    hasError = true;
  }

  const phoneDigitsOnly = input.phone.replace(/\D/g, '');
  if (!input.phone) {
    phoneError = 'Please provide a contact phone number.';
    hasError = true;
  } else if (phoneDigitsOnly.length < 10) {
    phoneError = 'Please enter a valid phone number with at least 10 digits.';
    hasError = true;
  } else if (phoneDigitsOnly.length > 15) {
    phoneError = 'Phone number cannot exceed 15 digits.';
    hasError = true;
  }

  if (input.email && (!EMAIL_REGEX.test(input.email) || input.email.length > 255)) {
    emailError = 'Please enter a valid email address (e.g. name@domain.com).';
    hasError = true;
  }

  if (!input.program) {
    programError = 'Please select an intended academic program.';
    hasError = true;
  }

  if (!input.consent) {
    consentError = 'Candidate consent is required to process an admissions enquiry.';
    hasError = true;
  }

  return {
    hasError,
    phoneDigitsOnly,
    nameError,
    phoneError,
    emailError,
    programError,
    consentError
  };
}

@Injectable({
  providedIn: 'root'
})
export class EnquiryService {
  public readonly apiUrl = `${environment.apiBaseUrl}/enquiries`;

  /**
   * Submits a candidate admissions enquiry to the verified backend API.
   * Uses fetch wrapped in an Observable to keep the initial client bundle strictly under budget.
   */
  public submitEnquiry(payload: EnquiryPayload): Observable<EnquirySuccessResponse> {
    return new Observable<EnquirySuccessResponse>((subscriber) => {
      const abortController = new AbortController();

      fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: abortController.signal
      })
        .then(async (response) => {
          let body: any;
          try {
            body = await response.json();
          } catch {
            body = null;
          }

          if (!response.ok) {
            subscriber.error({
              status: response.status,
              error: body || { success: false, error: 'Request failed' }
            });
          } else {
            subscriber.next(body as EnquirySuccessResponse);
            subscriber.complete();
          }
        })
        .catch((err: any) => {
          if (!subscriber.closed) {
            subscriber.error({
              status: 0,
              error: {
                success: false,
                error: err?.message || 'Network error occurred. Please verify your connection.'
              }
            });
          }
        });

      return () => {
        abortController.abort();
      };
    });
  }
}
