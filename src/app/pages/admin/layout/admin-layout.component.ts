import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminAuthService } from '../services/admin-auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, FormsModule],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent implements OnInit {
  private readonly router = inject(Router);
  protected readonly authService = inject(AdminAuthService);
  protected readonly isMobileMenuOpen = signal(false);
  protected readonly currentYear = new Date().getFullYear();

  // Password Modal State
  protected readonly isPasswordModalOpen = signal(false);
  protected readonly currentPassword = signal('');
  protected readonly newPassword = signal('');
  protected readonly confirmPassword = signal('');
  protected readonly isChangingPassword = signal(false);
  protected readonly passwordError = signal('');
  protected readonly passwordSuccess = signal('');

  public ngOnInit(): void {
    this.authService.verifyProfile();
  }

  @HostListener('document:keydown.escape')
  protected onEscapeKey(): void {
    if (this.isPasswordModalOpen()) {
      this.closePasswordModal();
    } else if (this.isMobileMenuOpen()) {
      this.closeMobileMenu();
    }
  }

  protected isActive(path: string): boolean {
    return this.router.url.startsWith(path);
  }

  protected toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(v => !v);
  }

  protected closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  protected onLogout(): void {
    this.authService.logout();
  }

  protected openPasswordModal(): void {
    this.currentPassword.set('');
    this.newPassword.set('');
    this.confirmPassword.set('');
    this.passwordError.set('');
    this.passwordSuccess.set('');
    this.isPasswordModalOpen.set(true);
  }

  protected closePasswordModal(): void {
    this.isPasswordModalOpen.set(false);
  }

  protected async submitChangePassword(): Promise<void> {
    this.passwordError.set('');
    this.passwordSuccess.set('');

    if (!this.currentPassword() || !this.newPassword()) {
      this.passwordError.set('Please fill in both current and new passwords.');
      return;
    }

    if (this.newPassword().length < 8) {
      this.passwordError.set('New password must contain at least 8 characters.');
      return;
    }

    if (this.newPassword() !== this.confirmPassword()) {
      this.passwordError.set('New passwords do not match.');
      return;
    }

    this.isChangingPassword.set(true);
    try {
      await this.authService.changePassword(this.currentPassword(), this.newPassword());
      this.passwordSuccess.set('Password updated successfully.');
      setTimeout(() => {
        this.closePasswordModal();
      }, 1500);
    } catch (err: any) {
      this.passwordError.set(err?.message || 'Failed to change password.');
    } finally {
      this.isChangingPassword.set(false);
    }
  }
}
