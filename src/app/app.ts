import { Component, DestroyRef, HostListener, PLATFORM_ID, signal, inject, OnInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';
import { NoticeBarComponent } from './layout/notice-bar/notice-bar.component';
import { FloatingActionsComponent } from './layout/floating-actions/floating-actions.component';
import { EnquiryModalComponent } from './shared/enquiry-modal/enquiry-modal.component';
import { SeoService } from './core/services/seo.service';
import { environment } from '../environments/environment';

const KEEP_ALIVE_INTERVAL_MS = 10 * 60 * 1000;

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, NoticeBarComponent, FloatingActionsComponent, EnquiryModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private readonly router = inject(Router);
  private readonly seoService = inject(SeoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  protected readonly isAdminRoute = signal(false);

  public ngOnInit(): void {
    this.seoService.initRouteTracking();
    this.isAdminRoute.set(this.router.url.startsWith('/admin'));
    if (environment.production && isPlatformBrowser(this.platformId)) {
      this.startBackendKeepAlive();
    }
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((event) => {
        const targetUrl = event.urlAfterRedirects || event.url;
        this.isAdminRoute.set(targetUrl.startsWith('/admin'));
      });
  }

  public pingBackendHealth(): void {
    if (typeof fetch !== 'function') {
      return;
    }
    fetch(`${environment.apiBaseUrl}/health`, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-store'
    }).catch(() => {
      // Silent warmup/keep-alive ping; never disrupt user navigation
    });
  }

  private startBackendKeepAlive(): void {
    this.pingBackendHealth();
    const timerId = window.setInterval(() => {
      this.pingBackendHealth();
    }, KEEP_ALIVE_INTERVAL_MS);
    this.destroyRef.onDestroy(() => window.clearInterval(timerId));
  }

  @HostListener('document:click', ['$event'])
  protected keepFragmentTargetVisible(event: MouseEvent): void {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const link = target.closest<HTMLAnchorElement>('a[href*="#"]');
    const fragment = link ? new URL(link.href, window.location.href).hash.slice(1) : '';
    if (!fragment) {
      return;
    }

    window.setTimeout(() => this.scrollFragmentBelowHeader(fragment), 100);
  }

  private scrollFragmentBelowHeader(fragment: string): void {
    const section = document.getElementById(fragment);
    if (!section) {
      return;
    }

    const headerHeight = document.querySelector<HTMLElement>('.ks-site-header')?.offsetHeight ?? 0;
    const top = section.getBoundingClientRect().top + window.scrollY - headerHeight - 16;
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

    window.scrollTo({ top: Math.max(0, top), behavior });
  }
}
