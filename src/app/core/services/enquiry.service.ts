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
