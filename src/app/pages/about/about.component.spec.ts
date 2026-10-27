import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AboutComponent } from './about.component';

describe('AboutComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutComponent],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  it('should create the about component', () => {
    const fixture = TestBed.createComponent(AboutComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should render page heading and institutional identity', async () => {
    const fixture = TestBed.createComponent(AboutComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain('About Our Institute');
    expect(compiled.textContent).toContain('Kavya Shree Institute of Nursing');
    expect(compiled.textContent).toContain('Punpun');
  });

  it('should render administrative transparency notice', async () => {
    const fixture = TestBed.createComponent(AboutComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const notice = compiled.querySelector('.ks-memorandum');
    expect(notice).toBeTruthy();
    expect(notice?.textContent).toContain('Administrative Transparency');
  });
});

