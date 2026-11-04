import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { AdminLayoutComponent } from './admin-layout.component';
import { AdminAuthService } from '../services/admin-auth.service';
import { AdminUser } from '../models/admin.models';

describe('AdminLayoutComponent', () => {
  let component: AdminLayoutComponent;
  let fixture: ComponentFixture<AdminLayoutComponent>;
  let mockAuthService: {
    currentUser: ReturnType<typeof signal<AdminUser | null>>;
    isAuthenticated: ReturnType<typeof signal<boolean>>;
    logout: ReturnType<typeof vi.fn>;
    verifyProfile: ReturnType<typeof vi.fn>;
  };

  const sampleUser: AdminUser = {
    id: 'admin_123',
    email: 'admissions@kavyashree.edu.in',
    name: 'Admissions Officer',
    role: 'admin',
    lastLoginAt: new Date().toISOString()
  };

  beforeEach(async () => {
    mockAuthService = {
      currentUser: signal<AdminUser | null>(sampleUser),
      isAuthenticated: signal<boolean>(true),
      logout: vi.fn(),
      verifyProfile: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [AdminLayoutComponent],
      providers: [
        provideRouter([]),
        { provide: AdminAuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the admin layout component and verify profile on init', () => {
    expect(component).toBeTruthy();
    expect(mockAuthService.verifyProfile).toHaveBeenCalled();
  });

  it('should render administrator identity badge and navigation links', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Admissions Officer');
    expect(el.textContent).toContain('admissions@kavyashree.edu.in');
    expect(el.querySelector('a[href="/admin/dashboard"]')).toBeTruthy();
    expect(el.querySelector('a[href="/admin/enquiries"]')).toBeTruthy();
  });

  it('should toggle and close mobile drawer', () => {
    expect((component as any).isMobileMenuOpen()).toBe(false);
    (component as any).toggleMobileMenu();
    expect((component as any).isMobileMenuOpen()).toBe(true);
    (component as any).closeMobileMenu();
    expect((component as any).isMobileMenuOpen()).toBe(false);
  });

  it('should trigger authService.logout on logout button click', () => {
    const el = fixture.nativeElement as HTMLElement;
    const logoutBtn = el.querySelector('button[aria-label="Log out of administrator session"]') as HTMLButtonElement;
    expect(logoutBtn).toBeTruthy();
    logoutBtn.click();
    expect(mockAuthService.logout).toHaveBeenCalled();
  });
});
