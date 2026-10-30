import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';
import { Router, NavigationEnd } from '@angular/router';

export const SITE_BASE_URL = 'https://kavya-shree-nursing.vercel.app';
export const DEFAULT_ROBOTS_INDEX =
  'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
export const NOINDEX_ROBOTS = 'noindex, nofollow';

export interface RouteSeoConfig {
  title: string;
  description: string;
  keywords: string;
  canonicalPath: string;
  image?: string;
  imageAlt?: string;
  ogType?: string;
  robots?: string;
  schemaType?: string;
  breadcrumbLabel?: string;
}

export const ROUTE_SEO_MAP: Record<string, RouteSeoConfig> = {
  '/': {
    title: 'Home | Kavya Shree Institute of Nursing',
    description:
      'Kavya Shree Institute of Nursing, Punpun, Patna. Quality nursing education and clinical training for Session 2026.',
    keywords:
      'Kavya Shree Institute of Nursing, Nursing College in Patna, Nursing Institute Punpun, ANM GNM B.Sc Nursing Patna, Bihar Nursing Admission 2026',
    canonicalPath: '/',
    image: 'logo.png',
    imageAlt: 'Kavya Shree Institute of Nursing Official Crest',
    ogType: 'website',
    robots: DEFAULT_ROBOTS_INDEX,
    schemaType: 'WebPage',
    breadcrumbLabel: 'Home'
  },
  '/about': {
    title: 'About Us | Kavya Shree Institute of Nursing',
    description:
      'Learn about Kavya Shree Institute of Nursing, Punpun, Patna — mission, academic foundation, leadership, and clinical education.',
    keywords:
      'About Kavya Shree Institute of Nursing, Nursing College Punpun Patna, Nursing Education Bihar, Clinical Training Patna',
    canonicalPath: '/about',
    image: 'logo.png',
    imageAlt: 'About Kavya Shree Institute of Nursing, Punpun, Patna',
    ogType: 'website',
    robots: DEFAULT_ROBOTS_INDEX,
    schemaType: 'AboutPage',
    breadcrumbLabel: 'About Us'
  },
  '/programs': {
    title: 'Academic Programs | Kavya Shree Institute of Nursing',
    description:
      'Nursing programs: ANM, GNM, B.Sc. Nursing, Post Basic B.Sc., and M.Sc. Nursing. Provisional Offerings — Pending Official Confirmation.',
    keywords:
      'ANM Nursing Patna, GNM Nursing Course Bihar, B.Sc Nursing Patna, Post Basic B.Sc Nursing, M.Sc Nursing Bihar, Nursing Courses Session 2026',
    canonicalPath: '/programs',
    image: 'logo.png',
    imageAlt: 'Academic Nursing Programs at Kavya Shree Institute of Nursing',
    ogType: 'website',
    robots: DEFAULT_ROBOTS_INDEX,
    schemaType: 'CollectionPage',
    breadcrumbLabel: 'Academic Programs'
  },
  '/admissions': {
    title: 'Admissions & Consultation | Kavya Shree Institute of Nursing',
    description:
      'Admissions consultation desk for Session 2026. Review eligibility guidelines and submit admissions enquiries online.',
    keywords:
      'Nursing Admission 2026 Patna, Nursing Enquiry Bihar, ANM GNM B.Sc Nursing Eligibility, Kavya Shree Nursing Admissions Desk',
    canonicalPath: '/admissions',
    image: 'logo.png',
    imageAlt: 'Admissions & Consultation Desk — Kavya Shree Institute of Nursing',
    ogType: 'website',
    robots: DEFAULT_ROBOTS_INDEX,
    schemaType: 'WebPage',
    breadcrumbLabel: 'Admissions & Consultation'
  },
  '/contact': {
    title: 'Contact Admissions Desk | Kavya Shree Institute of Nursing',
    description:
      'Admissions desk at Punpun, Patna, Bihar 804453. Helplines: +91 96616 66485 / 62878 79239.',
    keywords:
      'Contact Kavya Shree Institute of Nursing, Punpun Station Road Nursing College, Patna Nursing Helpline, Bihar Nursing Campus Address',
    canonicalPath: '/contact',
    image: 'logo.png',
    imageAlt: 'Contact Kavya Shree Institute of Nursing Admissions Desk',
    ogType: 'website',
    robots: DEFAULT_ROBOTS_INDEX,
    schemaType: 'ContactPage',
    breadcrumbLabel: 'Contact Us'
  }
};

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
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
    const normalizedUrl = url.split('?')[0].split('#')[0] || '/';

    // Admin routes must never be indexed by search engines
    if (normalizedUrl.startsWith('/admin')) {
      this.metaService.updateTag({ name: 'robots', content: NOINDEX_ROBOTS });
      this.updateCanonicalLink(`${SITE_BASE_URL}${normalizedUrl}`);
      this.removeRouteJsonLd();
      return;
    }

    const matchedConfig = ROUTE_SEO_MAP[normalizedUrl];
    const config: RouteSeoConfig = matchedConfig || {
      title: 'Page Not Found | Kavya Shree Institute of Nursing',
      description:
        'The requested page could not be found. Return to Kavya Shree Institute of Nursing home.',
      keywords: 'Kavya Shree Institute of Nursing, Page Not Found',
      canonicalPath: normalizedUrl,
      image: 'logo.png',
      imageAlt: 'Kavya Shree Institute of Nursing',
      ogType: 'website',
      robots: NOINDEX_ROBOTS,
      schemaType: 'WebPage',
      breadcrumbLabel: 'Not Found'
    };

    const canonicalUrl = `${SITE_BASE_URL}${config.canonicalPath === '/' ? '/' : config.canonicalPath}`;
    const ogType = config.ogType || 'website';
    const robots = config.robots || DEFAULT_ROBOTS_INDEX;

    this.titleService.setTitle(config.title);
    this.metaService.updateTag({ name: 'description', content: config.description });
    this.metaService.updateTag({ name: 'keywords', content: config.keywords });
    this.metaService.updateTag({ name: 'robots', content: robots });

    // OpenGraph tags
    this.metaService.updateTag({ property: 'og:locale', content: 'en_IN' });
    this.metaService.updateTag({
      property: 'og:site_name',
      content: 'Kavya Shree Institute of Nursing'
    });
    this.metaService.updateTag({ property: 'og:title', content: config.title });
    this.metaService.updateTag({ property: 'og:description', content: config.description });
    this.metaService.updateTag({ property: 'og:type', content: ogType });
    this.metaService.updateTag({ property: 'og:url', content: canonicalUrl });

    // Twitter Card tags
    this.metaService.updateTag({ name: 'twitter:card', content: 'summary' });
    this.metaService.updateTag({ name: 'twitter:title', content: config.title });
    this.metaService.updateTag({ name: 'twitter:description', content: config.description });

    if (config.image) {
      this.metaService.updateTag({ property: 'og:image', content: config.image });
      this.metaService.updateTag({ name: 'twitter:image', content: config.image });
      if (config.imageAlt) {
        this.metaService.updateTag({ property: 'og:image:alt', content: config.imageAlt });
        this.metaService.updateTag({ name: 'twitter:image:alt', content: config.imageAlt });
      }
    }

    this.updateCanonicalLink(canonicalUrl);

    if (matchedConfig) {
      this.updateRouteJsonLd(config, canonicalUrl);
    } else {
      this.removeRouteJsonLd();
    }
  }

  private updateCanonicalLink(canonicalUrl: string): void {
    const head = this.document?.head;
    if (!head) {
      return;
    }

    let linkEl = head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!linkEl) {
      linkEl = this.document.createElement('link');
      linkEl.setAttribute('rel', 'canonical');
      head.appendChild(linkEl);
    }
    linkEl.setAttribute('href', canonicalUrl);
  }

  private updateRouteJsonLd(config: RouteSeoConfig, canonicalUrl: string): void {
    const head = this.document?.head;
    if (!head) {
      return;
    }

    const breadcrumbItems: Array<Record<string, unknown>> = [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${SITE_BASE_URL}/`
      }
    ];

    if (config.canonicalPath !== '/') {
      breadcrumbItems.push({
        '@type': 'ListItem',
        position: 2,
        name: config.breadcrumbLabel || config.title,
        item: canonicalUrl
      });
    }

    const schemaPayload = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': config.schemaType || 'WebPage',
          '@id': `${canonicalUrl}#webpage`,
          url: canonicalUrl,
          name: config.title,
          description: config.description,
          inLanguage: 'en-IN',
          isPartOf: {
            '@id': `${SITE_BASE_URL}/#website`
          },
          about: {
            '@id': `${SITE_BASE_URL}/#organization`
          }
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${canonicalUrl}#breadcrumb`,
          itemListElement: breadcrumbItems
        }
      ]
    };

    let scriptEl = head.querySelector<HTMLScriptElement>('script#ks-route-schema');
    if (!scriptEl) {
      scriptEl = this.document.createElement('script');
      scriptEl.id = 'ks-route-schema';
      scriptEl.type = 'application/ld+json';
      head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify(schemaPayload);
  }

  private removeRouteJsonLd(): void {
    const scriptEl = this.document?.head?.querySelector('script#ks-route-schema');
    if (scriptEl) {
      scriptEl.remove();
    }
  }
}
