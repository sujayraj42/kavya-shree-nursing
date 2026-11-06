import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HomeComponent } from './home.component';
import { EnquiryService } from '../../core/services/enquiry.service';

describe('HomeComponent', () => {
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
            id: 'mock-reg-id-12345',
            program: 'Bachelor of Science in Nursing (B.Sc.)',
            status: 'new',
            createdAt: new Date().toISOString()
          }
        })
    };

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        { provide: EnquiryService, useValue: mockEnquiryService }
      ]
    }).compileComponents();
  });

  it('should create the home component', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should render all core sections with valid IDs', async () => {
    const fixture = TestBed.createComponent(HomeComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('#hero')).toBeTruthy();
    expect(compiled.querySelector('#about')).toBeTruthy();
    expect(compiled.querySelector('#courses')).toBeTruthy();
    expect(compiled.querySelector('#strengths')).toBeTruthy();
    expect(compiled.querySelector('#facilities')).toBeTruthy();
    expect(compiled.querySelector('#financial-support')).toBeTruthy();
    expect(compiled.querySelector('#admissions-enquiry')).toBeTruthy();
    expect(compiled.querySelector('#contact')).toBeTruthy();
  });

  it('should have functional CTAs linking to courses and admissions enquiry', async () => {
    const fixture = TestBed.createComponent(HomeComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const heroLinks = compiled.querySelectorAll('#hero a');
    const linksText = Array.from(heroLinks).map((el) => el.textContent?.trim());
    expect(linksText.some((text) => text?.includes('Explore Academic Programs'))).toBe(true);
    expect(linksText.some((text) => text?.includes('Admission Enquiry'))).toBe(true);
  });

  it('should render the official campus hero image with proper source and alt attributes', async () => {
    const fixture = TestBed.createComponent(HomeComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const heroImg = compiled.querySelector<HTMLImageElement>('.hero-campus-img');
    expect(heroImg).toBeTruthy();
    expect(heroImg?.src).toContain('images/kavya-shree-campus-hero.png');
    expect(heroImg?.alt).toContain('Kavya Shree Institute of Nursing campus');
  });

  it('should display the official institute logo in the header and about cards', async () => {
    const fixture = TestBed.createComponent(HomeComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const logos = compiled.querySelectorAll<HTMLImageElement>('img[src="logo.png"]');
    expect(logos.length).toBeGreaterThan(0);
  });

  it('should validate form and reject submission when required fields are missing', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    const component = fixture.componentInstance;

    component['submitEnquiry']();
    expect(component['formValidationError']()).toBeTruthy();
    expect(component['nameError']()).toBeTruthy();
    expect(component['phoneError']()).toBeTruthy();
    expect(component['programError']()).toBeTruthy();
    expect(component['consentError']()).toBeTruthy();
    expect(component['isFormSubmitted']()).toBe(false);
  });

  it('should submit successfully and register candidate when valid details and consent are provided', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    const component = fixture.componentInstance;

    component['applicantName'].set('Anjali Kumari');
    component['applicantPhone'].set('9876543210');
    component['applicantEmail'].set('anjali@example.com');
    component['selectedProgram'].set('Bachelor of Science in Nursing (B.Sc.)');
    component['applicantConsent'].set(true);

    component['submitEnquiry']();

    expect(component['isFormSubmitted']()).toBe(true);
    expect(component['confirmedSubmission']()?.name).toBe('Anjali Kumari');
    expect(component['confirmedSubmission']()?.id).toBe('mock-reg-id-12345');
    expect(component['confirmedSubmission']()?.program).toBe('Bachelor of Science in Nursing (B.Sc.)');
  });

  it('should display server error message when API fails', () => {
    mockEnquiryService.submitEnquiry = () =>
      throwError(() => ({
        error: { error: 'Database service temporarily unavailable' }
      }));

    const fixture = TestBed.createComponent(HomeComponent);
    const component = fixture.componentInstance;

    component['applicantName'].set('Anjali Kumari');
    component['applicantPhone'].set('9876543210');
    component['selectedProgram'].set('Bachelor of Science in Nursing (B.Sc.)');
    component['applicantConsent'].set(true);

    component['submitEnquiry']();

    expect(component['isFormSubmitted']()).toBe(false);
    expect(component['serverError']()).toBe('Database service temporarily unavailable');
    // Ensure form values are preserved on failure
    expect(component['applicantName']()).toBe('Anjali Kumari');
    expect(component['applicantPhone']()).toBe('9876543210');
  });

  it('should switch active program tab correctly', async () => {
    const fixture = TestBed.createComponent(HomeComponent);
    const component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component['activeProgramTab']()).toBe('all');

    component['setProgramTab']('degree');
    fixture.detectChanges();
    expect(component['activeProgramTab']()).toBe('degree');

    component['setProgramTab']('diploma');
    fixture.detectChanges();
    expect(component['activeProgramTab']()).toBe('diploma');

    component['setProgramTab']('pg');
    fixture.detectChanges();
    expect(component['activeProgramTab']()).toBe('pg');
  });

  it('should reset form and error states when resetForm is called', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    const component = fixture.componentInstance;
    component['applicantName'].set('Test Name');
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

  it('should render all 5 advertised course cards with provisional badges in the all tab', async () => {
    const fixture = TestBed.createComponent(HomeComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const cards = compiled.querySelectorAll('#courses .ks-course-card');
    expect(cards.length).toBe(5);

    const provisionalPills = compiled.querySelectorAll('#courses .ks-card-provisional-pill');
    expect(provisionalPills.length).toBe(5);
    provisionalPills.forEach((pill) => {
      expect(pill.textContent).toContain('Provisional Offering: Pending Official Confirmation');
    });

    const titles = Array.from(compiled.querySelectorAll('#courses .ks-course-title')).map((el) =>
      el.textContent?.trim()
    );
    expect(titles.some((t) => t?.includes('Auxiliary Nurse Midwifery (ANM)'))).toBe(true);
    expect(titles.some((t) => t?.includes('General Nursing & Midwifery (GNM)'))).toBe(true);
    expect(titles.some((t) => t?.includes('Bachelor of Science in Nursing (B.Sc.)'))).toBe(true);
    expect(titles.some((t) => t?.includes('Post Basic B.Sc. Nursing'))).toBe(true);
    expect(titles.some((t) => t?.includes('Master of Science in Nursing (M.Sc.)'))).toBe(true);
  });

  it('should filter cards when diploma, degree, or pg tab is selected', async () => {
    const fixture = TestBed.createComponent(HomeComponent);
    const component = fixture.componentInstance;
    await fixture.whenStable();

    component['setProgramTab']('diploma');
    fixture.detectChanges();
    let cards = fixture.nativeElement.querySelectorAll('#courses .ks-course-card');
    expect(cards.length).toBe(2);

    component['setProgramTab']('degree');
    fixture.detectChanges();
    cards = fixture.nativeElement.querySelectorAll('#courses .ks-course-card');
    expect(cards.length).toBe(2);

    component['setProgramTab']('pg');
    fixture.detectChanges();
    cards = fixture.nativeElement.querySelectorAll('#courses .ks-course-card');
    expect(cards.length).toBe(1);
  });
});
