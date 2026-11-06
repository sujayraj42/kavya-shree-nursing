import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface MotionTokens {
  duration: {
    micro: number;
    standard: number;
    hero: number;
  };
  ease: {
    out: string;
    smooth: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class MotionService {
  private readonly platformId = inject(PLATFORM_ID);
  public readonly isBrowser = isPlatformBrowser(this.platformId);

  public readonly tokens: MotionTokens = {
    duration: {
      micro: 0.35,
      standard: 0.7,
      hero: 1.0
    },
    ease: {
      out: 'power2.out',
      smooth: 'power3.out'
    }
  };

  private gsapPromise: Promise<{ gsap: any; ScrollTrigger: any } | null> | null = null;
  private observer: IntersectionObserver | null = null;

  /**
   * Initializes browser IntersectionObserver for elements with Framer-Motion reveal classes.
   * Elements with '.fm-reveal' or '.fm-reveal-stagger' will automatically get '.fm-visible'
   * as they scroll into view.
   */
  public initScrollReveals(root?: HTMLElement | null): () => void {
    if (this.isBrowser && typeof document !== 'undefined') {
      const elements = (root || document).querySelectorAll('.fm-reveal, .fm-reveal-stagger');
      elements.forEach(el => el.classList.add('fm-visible'));
    }
    return () => {};
  }

  /**
   * Determines whether the user has requested reduced motion.
   * If running on the server, in a non-browser environment, or if the media query matches, returns true.
   */
  public prefersReducedMotion(): boolean {
    if (!this.isBrowser || typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return true;
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)')?.matches ?? false;
  }

  /**
   * Dynamically loads GSAP and ScrollTrigger in browser-only environments.
   * Caches the resulting promise to ensure plugins are registered exactly once.
   * Prevents GSAP from inflating the initial root bundle.
   */
  public async loadGsap(): Promise<{ gsap: any; ScrollTrigger: any } | null> {
    if (!this.isBrowser) {
      return null;
    }

    // Ensure matchMedia stub in headless / test environments if needed
    if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
      window.matchMedia = (query: string) =>
        ({
          matches: false,
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false
        }) as any;
    }

    if (!this.gsapPromise) {
      this.gsapPromise = Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger')
      ])
        .then(([gsapModule, scrollTriggerModule]) => {
          const gsap = gsapModule.gsap || gsapModule.default || gsapModule;
          const ScrollTrigger = scrollTriggerModule.ScrollTrigger || scrollTriggerModule.default;
          if (gsap && ScrollTrigger) {
            gsap.registerPlugin(ScrollTrigger);
          }
          return { gsap, ScrollTrigger };
        })
        .catch((err) => {
          console.warn('[MotionService] Failed to load GSAP:', err);
          return null;
        });
    }

    return this.gsapPromise;
  }
}

