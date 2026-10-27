import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  it('should create the header component', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should render official logo with proper source and alt attributes', async () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const logoImg = compiled.querySelector('img.ks-brand-logo');
    expect(logoImg).toBeTruthy();
    expect(logoImg?.getAttribute('src')).toBe('logo.png');
    expect(logoImg?.getAttribute('alt')).toContain('Kavya Shree Institute of Nursing Official Logo');
  });

  it('should toggle mobile menu state on toggleMenu call', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    const component = fixture.componentInstance;
    expect(component['isMenuOpen']()).toBe(false);

    component['toggleMenu']();
    expect(component['isMenuOpen']()).toBe(true);

    component['closeMenu']();
    expect(component['isMenuOpen']()).toBe(false);
  });

  it('should close mobile menu on Escape key press', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    const component = fixture.componentInstance;
    component['toggleMenu']();
    expect(component['isMenuOpen']()).toBe(true);

    component['onEscape']();
    expect(component['isMenuOpen']()).toBe(false);
  });

  it('should have proper ARIA attributes on mobile toggler', async () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('button.navbar-toggler');
    expect(button?.getAttribute('aria-label')).toBe('Toggle navigation menu');
    expect(button?.getAttribute('aria-expanded')).toBe('false');
  });

  it('should update activeSection and close menu when selectSection is called', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    const component = fixture.componentInstance;
    component['toggleMenu']();
    expect(component['isMenuOpen']()).toBe(true);

    component['selectSection']('courses');
    expect(component['activeSection']()).toBe('courses');
    expect(component['isMenuOpen']()).toBe(false);
  });

  it('should render active class on the currently selected section link', async () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    const component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const homeLink = compiled.querySelector('.nav-link[routerLink="/"]');
    expect(homeLink?.classList.contains('active')).toBe(true);

    component['selectSection']('about');
    fixture.detectChanges();
    expect(homeLink?.classList.contains('active')).toBe(false);

    const aboutLink = Array.from(compiled.querySelectorAll('.nav-link')).find(
      el => el.textContent?.trim() === 'About Us'
    );
    expect(aboutLink?.classList.contains('active')).toBe(true);
  });
});
