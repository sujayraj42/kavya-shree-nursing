import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ApplyComponent } from './apply.component';

describe('ApplyComponent', () => {
  let component: ApplyComponent;
  let fixture: ComponentFixture<ApplyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplyComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(ApplyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the apply component with initial state at step 1', () => {
    expect(component).toBeTruthy();
    expect((component as any).currentStep()).toBe(1);
    expect((component as any).totalSteps).toBe(5);
  });

  it('should mark the active wizard step with aria-current="step"', () => {
    const activeStep = fixture.nativeElement.querySelector('[aria-current="step"]');
    expect(activeStep).toBeTruthy();
    expect(activeStep.textContent).toContain('1');
  });

  it('should reject progression to step 2 if candidate name is too short', () => {
    (component as any).applicantName.set('A');
    component.nextStep();
    expect((component as any).stepError()).toContain('at least 2 characters');
    expect((component as any).currentStep()).toBe(1);
  });

  it('should reject progression to step 2 if date of birth is missing', () => {
    (component as any).applicantName.set('Anjali Sharma');
    (component as any).dob.set('');
    component.nextStep();
    expect((component as any).stepError()).toContain('date of birth');
    expect((component as any).currentStep()).toBe(1);
  });

  it('should advance to step 2 when step 1 details are valid', () => {
    (component as any).applicantName.set('Anjali Sharma');
    (component as any).dob.set('2004-06-15');
    component.nextStep();
    expect((component as any).stepError()).toBe('');
    expect((component as any).currentStep()).toBe(2);
  });

  it('should validate contact details in step 2', () => {
    (component as any).currentStep.set(2);
    (component as any).fatherName.set('');
    component.nextStep();
    expect((component as any).stepError()).toContain('parents’ names');

    (component as any).fatherName.set('Ramesh Sharma');
    (component as any).motherName.set('Sunita Sharma');
    (component as any).phone.set('123'); // invalid phone
    component.nextStep();
    expect((component as any).stepError()).toContain('10-digit mobile number');

    (component as any).phone.set('9876543210');
    (component as any).district.set('Patna');
    (component as any).pincode.set('800001');
    component.nextStep();
    expect((component as any).stepError()).toBe('');
    expect((component as any).currentStep()).toBe(3);
  });

  it('should allow program selection and update draft', () => {
    component.selectProgram('General Nursing & Midwifery (GNM)');
    expect((component as any).selectedProgram()).toBe('General Nursing & Midwifery (GNM)');
  });

  it('should navigate backward using prevStep', () => {
    (component as any).currentStep.set(3);
    component.prevStep();
    expect((component as any).currentStep()).toBe(2);
  });

  it('should reject submission if declaration is not accepted', async () => {
    (component as any).currentStep.set(5);
    (component as any).declaration.set(false);
    await component.submitApplication();
    expect((component as any).errorMessage()).toContain('declaration');
    expect((component as any).submittedData()).toBeNull();
  });

  it('should successfully submit and generate reference number even when offline', async () => {
    (component as any).currentStep.set(5);
    (component as any).applicantName.set('Priya Kumari');
    (component as any).dob.set('2004-05-10');
    (component as any).fatherName.set('Sunil Kumar');
    (component as any).motherName.set('Geeta Devi');
    (component as any).phone.set('9876543210');
    (component as any).district.set('Patna');
    (component as any).pincode.set('800001');
    (component as any).selectedProgram.set('Bachelor of Science in Nursing (B.Sc.)');
    (component as any).declaration.set(true);

    // Mock fetch to simulate offline network error
    const originalFetch = globalThis.fetch;
    globalThis.fetch = () => Promise.reject(new Error('Network offline'));

    try {
      await component.submitApplication();
      const sub = (component as any).submittedData();
      expect(sub).not.toBeNull();
      expect(sub.applicationNumber).toMatch(/^KSIN-2026-APP-\d+$/);
      expect(sub.applicantName).toBe('Priya Kumari');
      expect(sub.isOffline).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('should allow copying reference number', () => {
    (component as any).submittedData.set({
      applicationNumber: 'KSIN-2026-APP-123456',
      applicantName: 'Test Student',
      program: 'GNM'
    });

    const mockClipboard = {
      writeText: () => Promise.resolve()
    };
    Object.assign(navigator, { clipboard: mockClipboard });

    component.copyReference();
    // Verify no throw
    expect((component as any).submittedData()?.applicationNumber).toBe('KSIN-2026-APP-123456');
  });

  it('should open application receipt window and render official slip HTML when printReceipt is called with submittedData', () => {
    (component as any).submittedData.set({
      applicationNumber: 'KSIN-2026-APP-778899',
      applicantName: 'Test Student',
      program: 'GNM'
    });

    const mockDoc = {
      open: vi.fn(),
      write: vi.fn(),
      close: vi.fn()
    };
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => ({ document: mockDoc } as any));
    component.printReceipt();
    expect(openSpy).toHaveBeenCalledWith('', '_blank');
    expect(mockDoc.open).toHaveBeenCalled();
    expect(mockDoc.write).toHaveBeenCalledWith(expect.stringContaining('KSIN-2026-APP-778899'));
    expect(mockDoc.write).toHaveBeenCalledWith(expect.stringContaining('Test Student'));
    expect(mockDoc.close).toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it('should bridge application submission to /api/enquiries when /api/applications returns 404', async () => {
    (component as any).currentStep.set(5);
    (component as any).applicantName.set('Neha Kumari');
    (component as any).dob.set('2004-08-12');
    (component as any).fatherName.set('Manoj Kumar');
    (component as any).motherName.set('Rekha Devi');
    (component as any).phone.set('9876543210');
    (component as any).district.set('Patna');
    (component as any).pincode.set('800001');
    (component as any).selectedProgram.set('General Nursing & Midwifery (GNM)');
    (component as any).declaration.set(true);

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (String(url).includes('/applications')) {
        return Promise.resolve({
          ok: false,
          status: 404,
          json: async () => ({ success: false, error: 'API endpoint not found' })
        });
      }
      if (String(url).includes('/enquiries')) {
        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({ success: true, data: { id: 'enq_123' } })
        });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });

    try {
      await component.submitApplication();
      const sub = (component as any).submittedData();
      expect(sub).not.toBeNull();
      expect(sub.applicationNumber).toMatch(/^KSIN-2026-APP-\d+$/);
      expect(sub.applicantName).toBe('Neha Kumari');
      expect(sub.isOffline).toBe(false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('should call window.print as fallback when submittedData is not present', () => {
    (component as any).submittedData.set(null);
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    component.printReceipt();
    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
  });
});

