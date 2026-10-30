import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AdmissionsComponent } from './admissions.component';
import { EnquiryService } from '../../core/services/enquiry.service';

describe('AdmissionsComponent', () => {
  let mockEnquiryService: {
    submitEnquiry: any;
  };

  beforeEach(async () => {
    mockEnquiryService = {
      submitEnquiry: () =>
        of({
          success: true,
          message: 'Enquiry registered successfully',
          data: {
            id: 'mock-reg-id-98765',
            program: 'Bachelor of Science in Nursing (B.Sc.)',
            status: 'new',
            createdAt: new Date().toISOString()
          }
        })
    };

    await TestBed.configureTestingModule({
      imports: [AdmissionsComponent],
      providers: [
        provideRouter([]),
        { provide: EnquiryService, useValue: mockEnquiryService }
      ]
    }).compileComponents();
  });

  it('should create the admissions component', () => {
    const fixture = TestBed.createComponent(AdmissionsComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should validate form and show error when submitted empty', () => {
    const fixture = TestBed.createComponent(AdmissionsComponent);
    const component = fixture.componentInstance;

    component['submitEnquiry']();
    expect(component['formValidationError']()).toBeTruthy();
    expect(component['nameError']()).toBeTruthy();
    expect(component['phoneError']()).toBeTruthy();
    expect(component['programError']()).toBeTruthy();
    expect(component['consentError']()).toBeTruthy();
    expect(component['isFormSubmitted']()).toBe(false);
  });

  it('should submit successfully when valid details and consent are provided', () => {
    const fixture = TestBed.createComponent(AdmissionsComponent);
    const component = fixture.componentInstance;

    component['applicantName'].set('Priya Kumari');
    component['applicantPhone'].set('9876543210');
    component['applicantEmail'].set('priya@example.com');
    component['selectedProgram'].set('Bachelor of Science in Nursing (B.Sc.)');
    component['applicantConsent'].set(true);

    component['submitEnquiry']();
    expect(component['isFormSubmitted']()).toBe(true);
    expect(component['confirmedSubmission']()?.name).toBe('Priya Kumari');
    expect(component['confirmedSubmission']()?.program).toBe('Bachelor of Science in Nursing (B.Sc.)');
    expect(component['confirmedSubmission']()?.id).toBe('mock-reg-id-98765');
  });

  it('should display server error message on API failure', () => {
    mockEnquiryService.submitEnquiry = () =>
      throwError(() => ({
        error: { error: 'Database service temporarily unavailable' }
      }));

    const fixture = TestBed.createComponent(AdmissionsComponent);
    const component = fixture.componentInstance;

    component['applicantName'].set('Priya Kumari');
    component['applicantPhone'].set('9876543210');
    component['selectedProgram'].set('Bachelor of Science in Nursing (B.Sc.)');
    component['applicantConsent'].set(true);

    component['submitEnquiry']();
    expect(component['isFormSubmitted']()).toBe(false);
    expect(component['serverError']()).toBe('Database service temporarily unavailable');
  });

  it('should reset form when resetForm is called', () => {
    const fixture = TestBed.createComponent(AdmissionsComponent);
    const component = fixture.componentInstance;

    component['applicantName'].set('Priya Kumari');
    component['applicantPhone'].set('9876543210');
    component['selectedProgram'].set('B.Sc. Nursing');
    component['applicantConsent'].set(true);
    component['submitEnquiry']();
    expect(component['isFormSubmitted']()).toBe(true);

    component['resetForm']();
    expect(component['isFormSubmitted']()).toBe(false);
    expect(component['applicantName']()).toBe('');
    expect(component['confirmedSubmission']()).toBeNull();
  });
});
