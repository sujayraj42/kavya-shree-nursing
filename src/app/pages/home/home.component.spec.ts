import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideRouter([])]
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
    const linksText = Array.from(heroLinks).map(el => el.textContent?.trim());
    expect(linksText.some(text => text?.includes('Explore Academic Programs'))).toBe(true);
    expect(linksText.some(text => text?.includes('Admission Enquiry'))).toBe(true);
  });

  it('should render the official campus hero image with proper source and alt attributes', async () => {
    const fixture = TestBed.createComponent(HomeComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const heroImg = compiled.querySelector('#hero img.hero-campus-img');
    expect(heroImg).toBeTruthy();
    expect(heroImg?.getAttribute('src')).toBe('images/kavya-shree-campus-hero.png');
    expect(heroImg?.getAttribute('alt')).toContain('Kavya Shree Institute of Nursing');
    expect(heroImg?.getAttribute('loading')).toBe('eager');
  });

  it('should display validation warning if enquiry form submitted empty', async () => {
    const fixture = TestBed.createComponent(HomeComponent);
    const component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();

    component['submitEnquiry']();
    fixture.detectChanges();

    expect(component['formValidationError']()).toBeTruthy();
    expect(component['nameError']()).toBeTruthy();
    expect(component['phoneError']()).toBeTruthy();
    expect(component['programError']()).toBeTruthy();
  });

  it('should display specific error if phone number is less than 10 digits', async () => {
    const fixture = TestBed.createComponent(HomeComponent);
    const component = fixture.componentInstance;
    component['applicantName'].set('Ananya Rao');
    component['applicantPhone'].set('12345');
    component['selectedProgram'].set('B.Sc. Nursing');

    component['submitEnquiry']();

    expect(component['phoneError']()).toContain('at least 10 digits');
    expect(component['isFormSubmitted']()).toBe(false);
  });

  it('should display specific error if email format is invalid', async () => {
    const fixture = TestBed.createComponent(HomeComponent);
    const component = fixture.componentInstance;
    component['applicantName'].set('Ananya Rao');
    component['applicantPhone'].set('9876543210');
    component['applicantEmail'].set('invalid-email-format');
    component['selectedProgram'].set('B.Sc. Nursing');

    component['submitEnquiry']();

    expect(component['emailError']()).toContain('valid email address');
    expect(component['isFormSubmitted']()).toBe(false);
  });

  it('should record enquiry and show confirmation status when inputs are valid', async () => {
    const fixture = TestBed.createComponent(HomeComponent);
    const component = fixture.componentInstance;
    component['applicantName'].set('Ananya Rao');
    component['applicantPhone'].set('9876543210');
    component['applicantEmail'].set('ananya@example.com');
    component['selectedProgram'].set('B.Sc. Nursing');

    component['submitEnquiry']();

    expect(component['isFormSubmitted']()).toBe(true);
    expect(component['confirmedSubmission']()?.name).toBe('Ananya Rao');
    expect(component['confirmedSubmission']()?.program).toBe('B.Sc. Nursing');
  });

  it('should update selected program when onProgramSelect is called', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    const component = fixture.componentInstance;
    expect(component['selectedProgram']()).toBe('');

    component['onProgramSelect']('General Nursing & Midwifery (GNM)');
    expect(component['selectedProgram']()).toBe('General Nursing & Midwifery (GNM)');
    expect(component['programError']()).toBe('');
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

    // Verify all 5 cards display the provisional warning pill
    const provisionalPills = compiled.querySelectorAll('#courses .ks-card-provisional-pill');
    expect(provisionalPills.length).toBe(5);
    provisionalPills.forEach(pill => {
      expect(pill.textContent).toContain('Provisional Offering — Pending Official Confirmation');
    });

    // Check titles for each advertised program
    const titles = Array.from(compiled.querySelectorAll('#courses .ks-course-title')).map(el => el.textContent?.trim());
    expect(titles.some(t => t?.includes('Auxiliary Nurse Midwifery (ANM)'))).toBe(true);
    expect(titles.some(t => t?.includes('General Nursing & Midwifery (GNM)'))).toBe(true);
    expect(titles.some(t => t?.includes('Bachelor of Science in Nursing (B.Sc.)'))).toBe(true);
    expect(titles.some(t => t?.includes('Post Basic B.Sc. Nursing'))).toBe(true);
    expect(titles.some(t => t?.includes('Master of Science in Nursing (M.Sc.)'))).toBe(true);
  });

  it('should filter cards when diploma, degree, or pg tab is selected', async () => {
    const fixture = TestBed.createComponent(HomeComponent);
    const component = fixture.componentInstance;
    await fixture.whenStable();

    // Diploma tab
    component['setProgramTab']('diploma');
    fixture.detectChanges();
    let cards = fixture.nativeElement.querySelectorAll('#courses .ks-course-card');
    expect(cards.length).toBe(2);

    // Degree tab
    component['setProgramTab']('degree');
    fixture.detectChanges();
    cards = fixture.nativeElement.querySelectorAll('#courses .ks-course-card');
    expect(cards.length).toBe(2);

    // PG tab
    component['setProgramTab']('pg');
    fixture.detectChanges();
    cards = fixture.nativeElement.querySelectorAll('#courses .ks-course-card');
    expect(cards.length).toBe(1);
  });
});
