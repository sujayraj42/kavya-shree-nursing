import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router, NavigationEnd } from '@angular/router';

export interface RouteSeoConfig {
  title: string;
  description: string;
  image?: string;
}

export const ROUTE_SEO_MAP: Record<string, RouteSeoConfig> = {
  '/': {
    title: 'Home | Kavya Shree Institute of Nursing',
    description: 'Kavya Shree Institute of Nursing, Punpun, Patna. Quality nursing education and clinical training for Session 2026.',
    image: 'logo.png'
  },
  '/about': {
    title: 'About Us | Kavya Shree Institute of Nursing',
    description: 'Learn about Kavya Shree Institute of Nursing, Punpun, Patna — mission, academic foundation, leadership, and clinical education.',
    image: 'logo.png'
  },
  '/programs': {
    title: 'Academic Programs | Kavya Shree Institute of Nursing',
    description: 'Nursing programs: ANM, GNM, B.Sc. Nursing, Post Basic B.Sc., and M.Sc. Nursing. Provisional Offerings — Pending Official Confirmation.',
    image: 'logo.png'
  },
  '/admissions': {
    title: 'Admissions & Consultation | Kavya Shree Institute of Nursing',
    description: 'Admissions consultation desk for Session 2026. Review eligibility guidelines and submit admissions enquiries online.',
    image: 'logo.png'
  },
  '/contact': {
    title: 'Contact Admissions Desk | Kavya Shree Institute of Nursing',
    description: 'Admissions desk at Punpun, Patna, Bihar 804453. Helplines: +91 96616 66485 / 62878 79239.',
    image: 'logo.png'
  }
};

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly router = inject(Router);
  private isTracking = false;

  public initRouteTracking(): void {
    if (this.isTracking) {
      return;
    }
    this.isTracking = true;
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const cleanUrl = event.urlAfterRedirects.split('?')[0].split('#')[0] || '/';
        this.updateMetadataForUrl(cleanUrl);
      }
    });
  }

  public updateMetadataForUrl(url: string): void {
    // Admin routes handle their own titles and should not be treated as public 404s
    if (url.startsWith('/admin')) {
      return;
    }

    const config = ROUTE_SEO_MAP[url] || {
      title: 'Page Not Found | Kavya Shree Institute of Nursing',
      description: 'The requested page could not be found. Return to Kavya Shree Institute of Nursing home.',
      image: 'logo.png'
    };

    this.titleService.setTitle(config.title);
    this.metaService.updateTag({ name: 'description', content: config.description });
    this.metaService.updateTag({ property: 'og:title', content: config.title });
    this.metaService.updateTag({ property: 'og:description', content: config.description });
    this.metaService.updateTag({ property: 'og:type', content: 'website' });
    this.metaService.updateTag({ name: 'twitter:card', content: 'summary' });
    this.metaService.updateTag({ name: 'twitter:title', content: config.title });
    this.metaService.updateTag({ name: 'twitter:description', content: config.description });

    if (config.image) {
      this.metaService.updateTag({ property: 'og:image', content: config.image });
      this.metaService.updateTag({ name: 'twitter:image', content: config.image });
    }
  }
}
