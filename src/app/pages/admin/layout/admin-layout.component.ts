import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { AdminAuthService } from '../services/admin-auth.service';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent implements OnInit {
  private readonly router = inject(Router);
  protected readonly authService = inject(AdminAuthService);
  protected readonly isMobileMenuOpen = signal(false);
  protected readonly currentYear = new Date().getFullYear();

  public ngOnInit(): void {
    this.authService.verifyProfile();
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
}
