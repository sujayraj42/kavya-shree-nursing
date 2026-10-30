import { Component, HostListener, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';
import { SeoService } from './core/services/seo.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private readonly router = inject(Router);
  private readonly seoService = inject(SeoService);
  protected readonly title = signal('Kavya Shree Institute of Nursing');
  protected readonly isAdminRoute = signal(false);

  public ngOnInit(): void {
    this.seoService.initRouteTracking();
    this.isAdminRoute.set(this.router.url.startsWith('/admin'));
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        const targetUrl = event.urlAfterRedirects || event.url;
        this.isAdminRoute.set(targetUrl.startsWith('/admin'));
      });
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
