import { TestBed } from '@angular/core/testing';
import { EnquiryService, EnquiryPayload, EnquirySuccessResponse } from './enquiry.service';

describe('EnquiryService', () => {
  let service: EnquiryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EnquiryService]
    });

    service = TestBed.inject(EnquiryService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should post enquiry payload to the API and return success response', async () => {
    const mockPayload: EnquiryPayload = {
      name: 'Pooja Kumari',
      phone: '9661666485',
      email: 'pooja@example.com',
      program: 'Bachelor of Science in Nursing (B.Sc.)',
      message: 'Hostel facilities inquiry',
      consent: true
    };

    const mockResponse: EnquirySuccessResponse = {
      success: true,
      message: 'Enquiry registered successfully',
      data: {
        id: '671e6245d8b7a12345678901',
        program: 'Bachelor of Science in Nursing (B.Sc.)',
        status: 'new',
        createdAt: new Date().toISOString()
      }
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => mockResponse
    } as Response);

    await new Promise<void>((resolve) => {
      service.submitEnquiry(mockPayload).subscribe((response) => {
        expect(response.success).toBe(true);
        expect(response.message).toBe('Enquiry registered successfully');
        expect(response.data.id).toBe('671e6245d8b7a12345678901');
        expect(response.data.program).toBe('Bachelor of Science in Nursing (B.Sc.)');
        resolve();
      });
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      service.apiUrl,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockPayload)
      })
    );
  });

  it('should handle API errors and propagate them to subscriber', async () => {
    const mockPayload: EnquiryPayload = {
      name: 'Rohan Verma',
      phone: '9876543210',
      program: 'General Nursing & Midwifery (GNM)',
      consent: true
    };

    const errorBody = { success: false, error: 'Database service temporarily unavailable' };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => errorBody
    } as Response);

    await new Promise<void>((resolve) => {
      service.submitEnquiry(mockPayload).subscribe({
        next: () => {
          throw new Error('Expected request to fail with 503');
        },
        error: (error) => {
          expect(error.status).toBe(503);
          expect(error.error.error).toBe('Database service temporarily unavailable');
          resolve();
        }
      });
    });
  });

  it('should handle network failure gracefully', async () => {
    const mockPayload: EnquiryPayload = {
      name: 'Rohan Verma',
      phone: '9876543210',
      program: 'General Nursing & Midwifery (GNM)',
      consent: true
    };

    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Failed to fetch'));

    await new Promise<void>((resolve) => {
      service.submitEnquiry(mockPayload).subscribe({
        next: () => {
          throw new Error('Expected request to fail with network error');
        },
        error: (error) => {
          expect(error.status).toBe(0);
          expect(error.error.error).toContain('Failed to fetch');
          resolve();
        }
      });
    });
  });
});

