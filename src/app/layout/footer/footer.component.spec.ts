import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  it('should create the footer component', () => {
    const fixture = TestBed.createComponent(FooterComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should render official footer logo with proper source and alt attributes', async () => {
    const fixture = TestBed.createComponent(FooterComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const footerLogo = compiled.querySelector('img.ks-footer-logo');
    expect(footerLogo).toBeTruthy();
    expect(footerLogo?.getAttribute('src')).toBe('logo.png');
    expect(footerLogo?.getAttribute('alt')).toContain('Kavya Shree Institute of Nursing Official Logo');
  });

  it('should render current year in copyright', async () => {
    const fixture = TestBed.createComponent(FooterComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const currentYear = new Date().getFullYear().toString();
    expect(compiled.textContent).toContain(currentYear);
  });
});
