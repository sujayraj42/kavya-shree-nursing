import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProgramsComponent } from './programs.component';

describe('ProgramsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgramsComponent],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  it('should create the programs component', () => {
    const fixture = TestBed.createComponent(ProgramsComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should render all 5 advertised courses by default', async () => {
    const fixture = TestBed.createComponent(ProgramsComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const cards = compiled.querySelectorAll('.ks-course-card');
    expect(cards.length).toBe(5);

    const pills = compiled.querySelectorAll('.ks-card-provisional-pill');
    expect(pills.length).toBe(5);
    pills.forEach(pill => {
      expect(pill.textContent).toContain('Provisional Offering: Pending Official Confirmation');
    });
  });

  it('should filter courses by category', async () => {
    const fixture = TestBed.createComponent(ProgramsComponent);
    const component = fixture.componentInstance;
    await fixture.whenStable();

    component['setTab']('diploma');
    fixture.detectChanges();
    let cards = fixture.nativeElement.querySelectorAll('.ks-course-card');
    expect(cards.length).toBe(2);

    component['setTab']('degree');
    fixture.detectChanges();
    cards = fixture.nativeElement.querySelectorAll('.ks-course-card');
    expect(cards.length).toBe(2);

    component['setTab']('pg');
    fixture.detectChanges();
    cards = fixture.nativeElement.querySelectorAll('.ks-course-card');
    expect(cards.length).toBe(1);
  });
});

