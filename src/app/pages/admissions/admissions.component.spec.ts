import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdmissionsComponent } from './admissions.component';

describe('AdmissionsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdmissionsComponent],
      providers: [provideRouter([])]
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
    expect(component['isFormSubmitted']()).toBe(false);
  });

  it('should submit successfully when valid details are provided', () => {
    const fixture = TestBed.createComponent(AdmissionsComponent);
    const component = fixture.componentInstance;

    component['applicantName'].set('Priya Kumari');
    component['applicantPhone'].set('9876543210');
    component['applicantEmail'].set('priya@example.com');
    component['selectedProgram'].set('Bachelor of Science in Nursing (B.Sc.)');

    component['submitEnquiry']();
    expect(component['isFormSubmitted']()).toBe(true);
    expect(component['confirmedSubmission']()?.name).toBe('Priya Kumari');
    expect(component['confirmedSubmission']()?.program).toBe('Bachelor of Science in Nursing (B.Sc.)');
  });

  it('should reset form when resetForm is called', () => {
    const fixture = TestBed.createComponent(AdmissionsComponent);
    const component = fixture.componentInstance;

    component['applicantName'].set('Priya Kumari');
    component['applicantPhone'].set('9876543210');
    component['selectedProgram'].set('B.Sc. Nursing');
    component['submitEnquiry']();
    expect(component['isFormSubmitted']()).toBe(true);

    component['resetForm']();
    expect(component['isFormSubmitted']()).toBe(false);
    expect(component['applicantName']()).toBe('');
    expect(component['confirmedSubmission']()).toBeNull();
  });
});

