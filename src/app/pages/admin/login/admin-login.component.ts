import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminAuthService } from '../services/admin-auth.service';

@Component({
  selector: 'app-admin-login',
  imports: [RouterLink, FormsModule],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.css'
})
export class AdminLoginComponent {
  protected readonly authService = inject(AdminAuthService);
  private readonly router = inject(Router);
  protected readonly currentYear = new Date().getFullYear();

  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly showPassword = signal(false);

  protected readonly emailError = signal('');
  protected readonly passwordError = signal('');
  protected readonly loginError = signal('');

  protected toggleShowPassword(): void {
    this.showPassword.update(v => !v);
  }

  protected async onSubmit(): Promise<void> {
    if (this.authService.isAuthenticating()) {
      return;
    }

    const rawEmail = this.email().trim();
    const rawPass = this.password();

    let hasError = false;
    this.emailError.set('');
    this.passwordError.set('');
    this.loginError.set('');

    if (!rawEmail) {
      this.emailError.set('Please enter your administrator email address.');
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
      this.emailError.set('Please enter a valid email address.');
      hasError = true;
    }

    if (!rawPass) {
      this.passwordError.set('Please enter your password.');
      hasError = true;
    } else if (rawPass.length < 8) {
      this.passwordError.set('Password must contain at least 8 characters.');
      hasError = true;
    }

    if (hasError) {
      return;
    }

    const success = await this.authService.login({
      email: rawEmail,
      password: rawPass
    });

    if (success) {
      this.router.navigate(['/admin', 'dashboard']);
    } else {
      this.loginError.set(this.authService.authError());
    }
  }
}

