import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NotFoundComponent } from './not-found.component';

describe('NotFoundComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotFoundComponent],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  it('should create the not-found component', () => {
    const fixture = TestBed.createComponent(NotFoundComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should render 404 heading and return home action', async () => {
    const fixture = TestBed.createComponent(NotFoundComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain('Page Not Found');
    expect(compiled.textContent).toContain('HTTP Error 404');
    expect(compiled.querySelector('a[routerLink="/"]')?.textContent).toContain('Return to Homepage');
  });
});

