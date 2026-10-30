import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { AdminLoginComponent } from './admin-login.component';
import { AdminAuthService } from '../services/admin-auth.service';

describe('AdminLoginComponent', () => {
  let component: AdminLoginComponent;
  let fixture: ComponentFixture<AdminLoginComponent>;
  let mockAuthService: {
    login: ReturnType<typeof vi.fn>;
    isAuthenticating: ReturnType<typeof vi.fn>;
    authError: ReturnType<typeof vi.fn>;
  };
  let router: Router;

  beforeEach(async () => {
    mockAuthService = {
      login: vi.fn(),
      isAuthenticating: vi.fn().mockReturnValue(false),
      authError: vi.fn().mockReturnValue('')
    };

    await TestBed.configureTestingModule({
      imports: [AdminLoginComponent],
      providers: [
        provideRouter([]),
        { provide: AdminAuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(AdminLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the admin login component', () => {
    expect(component).toBeTruthy();
  });

  it('should require email and password before calling login', async () => {
    await (component as any).onSubmit();

    expect(mockAuthService.login).not.toHaveBeenCalled();
    expect((component as any).emailError()).toContain('enter your administrator email');
    expect((component as any).passwordError()).toContain('enter your password');
  });

  it('should reject malformed email address', async () => {
    (component as any).email.set('invalid-email-string');
    (component as any).password.set('SecretPassword123');

    await (component as any).onSubmit();

    expect(mockAuthService.login).not.toHaveBeenCalled();
    expect((component as any).emailError()).toContain('valid email address');
  });

  it('should call authService.login and navigate to dashboard on success', async () => {
    (component as any).email.set('admin@kavyashreenursing.edu.in');
    (component as any).password.set('ValidPassword123');
    mockAuthService.login.mockResolvedValue(true);

    await (component as any).onSubmit();

    expect(mockAuthService.login).toHaveBeenCalledWith({
      email: 'admin@kavyashreenursing.edu.in',
      password: 'ValidPassword123'
    });
    expect(router.navigate).toHaveBeenCalledWith(['/admin', 'dashboard']);
  });

  it('should set loginError when authService.login fails', async () => {
    (component as any).email.set('admin@kavyashreenursing.edu.in');
    (component as any).password.set('WrongPassword');
    mockAuthService.login.mockResolvedValue(false);
    mockAuthService.authError.mockReturnValue('Invalid email or password');

    await (component as any).onSubmit();

    expect((component as any).loginError()).toBe('Invalid email or password');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should toggle password visibility flag', () => {
    expect((component as any).showPassword()).toBe(false);
    (component as any).toggleShowPassword();
    expect((component as any).showPassword()).toBe(true);
    (component as any).toggleShowPassword();
    expect((component as any).showPassword()).toBe(false);
  });
});
