import {
  Component,
  HostListener,
  PLATFORM_ID,
  inject,
  signal,
  OnInit,
  OnDestroy,
  ElementRef,
  DestroyRef,
  afterNextRender
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { MotionService } from '../../core/services/motion.service';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly motionService = inject(MotionService);
  private readonly elementRef = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly i18n = inject(I18nService);
  private routerSub?: Subscription;

  protected readonly isMenuOpen = signal(false);
  protected readonly activeSection = signal<string>('home');

  constructor() {
    let ctx: any = null;
    let isDestroyed = false;

    // Synchronously register destruction hook in constructor context
    this.destroyRef.onDestroy(() => {
      isDestroyed = true;
      ctx?.revert();
    });

    afterNextRender(async () => {
      if (isDestroyed || this.motionService.prefersReducedMotion()) {
        return;
      }
      const motion = await this.motionService.loadGsap();
      if (isDestroyed || !motion) {
        return;
      }
      const { gsap } = motion;
      const headerEl = this.elementRef.nativeElement.querySelector('.ks-site-header');
      if (!headerEl || isDestroyed) {
        return;
      }

      ctx = gsap.context(() => {
        gsap.from(headerEl, {
          y: -16,
          opacity: 0,
          duration: this.motionService.tokens.duration.standard,
          ease: this.motionService.tokens.ease.out,
          clearProps: 'transform,opacity'
        });
      }, this.elementRef.nativeElement);

      if (isDestroyed) {
        ctx.revert();
      }
    });
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.isMenuOpen()) {
      this.closeMenu();
    }
  }

  @HostListener('window:scroll')
  protected onWindowScroll(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.updateActiveSectionFromScroll();
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.syncActiveSectionFromUrl();
      this.routerSub = this.router.events
        .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
        .subscribe(() => {
          this.syncActiveSectionFromUrl();
        });
    }
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  protected toggleMenu(): void {
    this.isMenuOpen.update(open => !open);
  }

  protected closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  protected selectSection(sectionId: string): void {
    this.activeSection.set(sectionId);
    this.closeMenu();
  }

  private syncActiveSectionFromUrl(): void {
    try {
      const tree = this.router.parseUrl(this.router.url);
      const primary = tree.root.children['primary'];
      const segment = primary?.segments[0]?.path;
      const fragment = tree.fragment;
      if (fragment) {
        this.activeSection.set(fragment);
      } else if (segment) {
        if (segment === 'programs' || segment === 'courses') {
          this.activeSection.set('courses');
        } else if (segment === 'admissions' || segment === 'admission') {
          this.activeSection.set('admissions');
        } else if (segment === 'approvals' || segment === 'affiliations' || segment === 'affiliation') {
          this.activeSection.set('approvals');
        } else if (segment === 'gallery') {
          this.activeSection.set('gallery');
        } else {
          this.activeSection.set(segment);
        }
      } else {
        this.activeSection.set('home');
      }
    } catch {
      this.activeSection.set('home');
    }
  }

  private updateActiveSectionFromScroll(): void {
    try {
      const tree = this.router.parseUrl(this.router.url);
      const segment = tree.root.children['primary']?.segments[0]?.path;
      if (segment) {
        return;
      }
    } catch {
      return;
    }

    const scrollY = window.scrollY;
    if (scrollY < 200) {
      this.activeSection.set('home');
      return;
    }

    const sections = ['contact', 'admissions-enquiry', 'facilities', 'strengths', 'courses', 'about'];
    const headerOffset = 160;

    for (const id of sections) {
      const el = document.getElementById(id);
      if (el) {
        const top = el.getBoundingClientRect().top;
        if (top <= headerOffset) {
          this.activeSection.set(id);
          return;
        }
      }
    }
  }
}
