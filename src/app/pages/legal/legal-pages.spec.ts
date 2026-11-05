import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PrivacyComponent } from './privacy.component';
import { TermsComponent } from './terms.component';
import { RefundPolicyComponent } from './refund-policy.component';
import { AntiRaggingComponent } from './anti-ragging.component';

describe('Legal & Statutory Components', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PrivacyComponent,
        TermsComponent,
        RefundPolicyComponent,
        AntiRaggingComponent
      ],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  describe('PrivacyComponent', () => {
    it('should create and render DPDP Act 2023 compliance notice', async () => {
      const fixture = TestBed.createComponent(PrivacyComponent);
      await fixture.whenStable();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.querySelector('h1')?.textContent).toContain('Digital Privacy Policy');
      expect(compiled.textContent).toContain('Digital Personal Data Protection Act, 2023');
      expect(compiled.textContent).toContain('privacy@kavyashreenursing.edu.in');
    });
  });

  describe('TermsComponent', () => {
    it('should create and render Terms of Use with Patna jurisdiction', async () => {
      const fixture = TestBed.createComponent(TermsComponent);
      await fixture.whenStable();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.querySelector('h1')?.textContent).toContain('Terms of Use');
      expect(compiled.textContent).toContain('Patna, Bihar');
      expect(compiled.textContent).toContain('Provisional Application');
    });
  });

  describe('RefundPolicyComponent', () => {
    it('should create and render Fee & Refund withdrawal schedule', async () => {
      const fixture = TestBed.createComponent(RefundPolicyComponent);
      await fixture.whenStable();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.querySelector('h1')?.textContent).toContain('Fee & Refund Policy');
      expect(compiled.textContent).toContain('100% of Tuition Fees');
      expect(compiled.textContent).toContain('Caution / Security Deposit');
    });
  });

  describe('AntiRaggingComponent', () => {
    it('should create and render National Anti-Ragging toll-free helpline', async () => {
      const fixture = TestBed.createComponent(AntiRaggingComponent);
      await fixture.whenStable();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.querySelector('h1')?.textContent).toContain('Anti-Ragging');
      expect(compiled.textContent).toContain('1800-180-5522');
      expect(compiled.textContent).toContain('helpline@antiragging.in');
      expect(compiled.textContent).toContain('Anti-Ragging Committee');
    });
  });
});

