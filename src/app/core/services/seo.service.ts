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
  },
  '/apply': {
    title: 'Formal Online Application 2026 | Kavya Shree Institute of Nursing',
    description:
      'Candidate online registration portal for ANM, GNM, and B.Sc. Nursing disciplines for academic intake session 2026.',
    keywords:
      'Nursing Application Form 2026, Apply ANM GNM Patna, B.Sc Nursing Registration Bihar, Kavya Shree Online Admission',
    canonicalPath: '/apply',
    image: 'logo.png',
    imageAlt: 'Online Application Portal — Kavya Shree Institute of Nursing',
    ogType: 'website',
    robots: DEFAULT_ROBOTS_INDEX,
    schemaType: 'WebPage',
    breadcrumbLabel: 'Online Application'
  },
  '/approvals': {
    title: 'Recognitions & Regulatory Approvals | Kavya Shree Institute of Nursing',
    description:
      'Statutory regulatory framework, Indian Nursing Council (INC) syllabus alignment, Bihar Nursing Registration Council (BNRC), and university affiliations.',
    keywords:
      'INC Approved Nursing College Patna, BNRC Recognized Nursing Bihar, Affiliated Nursing Institute Patna, Kavya Shree Approvals',
    canonicalPath: '/approvals',
    image: 'logo.png',
    imageAlt: 'Regulatory Recognitions and Approvals — Kavya Shree Institute of Nursing',
    ogType: 'website',
    robots: DEFAULT_ROBOTS_INDEX,
    schemaType: 'ItemPage',
    breadcrumbLabel: 'Approvals & Recognitions'
  },
  '/gallery': {
    title: 'Campus, Labs & Clinical Gallery | Kavya Shree Institute of Nursing',
    description:
      'Explore institutional infrastructure including nursing simulation labs, hospital clinical rotations, lecture theaters, and health sciences library.',
    keywords:
      'Nursing College Campus Photos, Simulation Lab Photos Patna, Clinical Ward Training Pictures, Kavya Shree Campus Gallery',
    canonicalPath: '/gallery',
    image: 'logo.png',
    imageAlt: 'Campus & Clinical Training Gallery — Kavya Shree Institute of Nursing',
    ogType: 'website',
    robots: DEFAULT_ROBOTS_INDEX,
    schemaType: 'ImageGallery',
    breadcrumbLabel: 'Campus Gallery'
  },
  '/faculty': {
    title: 'Faculty Mentors & Hospital Partners | Kavya Shree Institute of Nursing',
    description:
      'Meet nursing department educators and explore affiliations with multi-specialty civil hospitals and rural primary health centers.',
    keywords:
      'Nursing Faculty Patna, Clinical Mentors Bihar, Hospital Affiliation Nursing College, Kavya Shree Faculty',
    canonicalPath: '/faculty',
    image: 'logo.png',
    imageAlt: 'Faculty Mentors & Hospital Tie-Ups — Kavya Shree Institute of Nursing',
    ogType: 'website',
    robots: DEFAULT_ROBOTS_INDEX,
    schemaType: 'AboutPage',
    breadcrumbLabel: 'Faculty & Hospital Tie-Ups'
  },
  '/faqs': {
    title: 'Frequently Asked Questions | Kavya Shree Institute of Nursing',
    description:
      'Official answers regarding nursing eligibility, 10+2 PCB criteria, hostel accommodation, fee structures, and admissions counseling.',
    keywords:
      'Nursing Admission FAQs Patna, B.Sc Nursing Eligibility Bihar, GNM Admission Questions, Kavya Shree FAQs',
    canonicalPath: '/faqs',
    image: 'logo.png',
    imageAlt: 'Admissions & Academic FAQs — Kavya Shree Institute of Nursing',
    ogType: 'website',
    robots: DEFAULT_ROBOTS_INDEX,
    schemaType: 'FAQPage',
    breadcrumbLabel: 'FAQs'
  },
  '/notices': {
    title: 'Notices & Announcements | Kavya Shree Institute of Nursing',
    description:
      'Latest administrative circulars, session 2026 admission deadlines, counseling schedules, and examination announcements.',
    keywords:
      'Nursing Admission Notices Patna, Counseling Schedule Bihar 2026, Kavya Shree Circulars, Nursing Exam Dates',
    canonicalPath: '/notices',
    image: 'logo.png',
    imageAlt: 'Notices & Circulars — Kavya Shree Institute of Nursing',
    ogType: 'website',
    robots: DEFAULT_ROBOTS_INDEX,
    schemaType: 'CollectionPage',
    breadcrumbLabel: 'Notices & News'
  },
  '/downloads': {
    title: 'Prospectus & Form Downloads | Kavya Shree Institute of Nursing',
    description:
      'Download session 2026 official institutional prospectus, offline admission application forms, and curriculum syllabus outlines.',
    keywords:
      'Download Nursing Prospectus Patna, Nursing Admission Form PDF, Syllabus Download ANM GNM B.Sc, Kavya Shree Downloads',
    canonicalPath: '/downloads',
    image: 'logo.png',
    imageAlt: 'Prospectus and Application Downloads — Kavya Shree Institute of Nursing',
    ogType: 'website',
    robots: DEFAULT_ROBOTS_INDEX,
    schemaType: 'CollectionPage',
    breadcrumbLabel: 'Downloads & Prospectus'
  },
  '/programs/anm': {
    title: 'ANM (Auxiliary Nursing & Midwifery) Course | Kavya Shree Institute of Nursing',
    description:
      '2-Year full-time diploma in Auxiliary Nursing & Midwifery (ANM). Primary healthcare, maternal & child care, community immunization training in Patna.',
    keywords: 'ANM Course Patna, ANM Nursing Bihar, Auxiliary Nurse Midwifery Admission, ANM Fee Structure Patna',
    canonicalPath: '/programs/anm',
    image: 'logo.png',
    imageAlt: 'ANM Nursing Program at Kavya Shree Institute of Nursing',
    ogType: 'website',
    robots: DEFAULT_ROBOTS_INDEX,
    schemaType: 'Course',
    breadcrumbLabel: 'ANM Program'
  },
  '/programs/gnm': {
    title: 'GNM (General Nursing & Midwifery) Course | Kavya Shree Institute of Nursing',
    description:
      '3-Year full-time diploma with mandatory 6-month clinical internship. Medical-surgical, psychiatric, and bedside patient care training in Patna.',
    keywords: 'GNM Course Patna, GNM Nursing Bihar, General Nursing Midwifery Admission, GNM Clinical Internship Patna',
    canonicalPath: '/programs/gnm',
    image: 'logo.png',
    imageAlt: 'GNM Nursing Program at Kavya Shree Institute of Nursing',
    ogType: 'website',
    robots: DEFAULT_ROBOTS_INDEX,
    schemaType: 'Course',
    breadcrumbLabel: 'GNM Program'
  },
  '/programs/bsc-nursing': {
    title: 'B.Sc. Nursing (Bachelor of Science) | Kavya Shree Institute of Nursing',
    description:
      '4-Year professional university undergraduate degree. Advanced critical care, pharmacology, nursing administration, and hospital rotations in Patna.',
    keywords: 'B.Sc Nursing Patna, B.Sc Nursing College Bihar, Bachelor of Science Nursing Admission 2026, Nursing Degree Patna',
    canonicalPath: '/programs/bsc-nursing',
    image: 'logo.png',
    imageAlt: 'B.Sc. Nursing Degree Program at Kavya Shree Institute of Nursing',
    ogType: 'website',
    robots: DEFAULT_ROBOTS_INDEX,
    schemaType: 'Course',
    breadcrumbLabel: 'B.Sc. Nursing'
  },
  '/programs/post-basic-bsc': {
    title: 'Post Basic B.Sc. Nursing Course | Kavya Shree Institute of Nursing',
    description:
      '2-Year degree program for registered GNM nurses. Advance clinical competence, teaching skills, and healthcare supervisory roles.',
    keywords: 'Post Basic B.Sc Nursing Patna, PB B.Sc Nursing Bihar, Registered Nurse Degree Upgrade',
    canonicalPath: '/programs/post-basic-bsc',
    image: 'logo.png',
    imageAlt: 'Post Basic B.Sc. Nursing at Kavya Shree Institute of Nursing',
    ogType: 'website',
    robots: DEFAULT_ROBOTS_INDEX,
    schemaType: 'Course',
    breadcrumbLabel: 'Post Basic B.Sc.'
  },
  '/programs/msc-nursing': {
    title: 'M.Sc. Nursing (Master of Science) | Kavya Shree Institute of Nursing',
    description:
      '2-Year postgraduate specialization in health sciences. Clinical leadership, evidence-based research, and nursing collegiate education.',
    keywords: 'M.Sc Nursing Patna, Master of Science Nursing Bihar, Nursing Post Graduation, Nursing Leadership',
    canonicalPath: '/programs/msc-nursing',
    image: 'logo.png',
    imageAlt: 'M.Sc. Nursing Degree Program at Kavya Shree Institute of Nursing',
    ogType: 'website',
    robots: DEFAULT_ROBOTS_INDEX,
    schemaType: 'Course',
    breadcrumbLabel: 'M.Sc. Nursing'
  },
  '/privacy': {
    title: 'Digital Privacy Policy & DPDP Notice | Kavya Shree Institute of Nursing',
    description: 'Official Privacy Policy compliant with Digital Personal Data Protection Act 2023 (DPDP Act) and IT Act 2000.',
    keywords: 'privacy policy nursing institute, DPDP Act 2023 compliance Patna, student data protection Bihar',
    canonicalPath: '/privacy',
    image: 'logo.png',
    imageAlt: 'Kavya Shree Institute of Nursing Privacy Policy',
    ogType: 'website',
    robots: DEFAULT_ROBOTS_INDEX,
    schemaType: 'WebPage',
    breadcrumbLabel: 'Privacy Policy'
  },
  '/terms': {
    title: 'Terms of Use & Institutional Disclaimers | Kavya Shree Institute of Nursing',
    description: 'Official Terms of Use, admissions portal guidelines, disclaimers, and jurisdiction at Patna, Bihar.',
    keywords: 'terms of use, nursing admission rules, college guidelines Patna',
    canonicalPath: '/terms',
    image: 'logo.png',
    imageAlt: 'Kavya Shree Institute of Nursing Terms of Use',
    ogType: 'website',
    robots: DEFAULT_ROBOTS_INDEX,
    schemaType: 'WebPage',
    breadcrumbLabel: 'Terms of Use'
  },
  '/refund-policy': {
    title: 'Institutional Fee & Refund Policy | Kavya Shree Institute of Nursing',
    description: 'Transparent guidelines governing tuition fees, seat withdrawal timelines, and statutory refund schedules.',
    keywords: 'fee refund nursing, B.Sc nursing fee refund, college fee policy Bihar',
    canonicalPath: '/refund-policy',
    image: 'logo.png',
    imageAlt: 'Kavya Shree Institute of Nursing Fee and Refund Policy',
    ogType: 'website',
    robots: DEFAULT_ROBOTS_INDEX,
    schemaType: 'WebPage',
    breadcrumbLabel: 'Fee & Refund Policy'
  },
  '/anti-ragging': {
    title: 'Statutory Anti-Ragging Framework & 24x7 Helpline | Kavya Shree Institute of Nursing',
    description: 'Zero-tolerance anti-ragging policy, institutional committee, and national toll-free helpline 1800-180-5522.',
    keywords: 'anti ragging nursing college, anti ragging helpline 1800-180-5522, student safety Patna',
    canonicalPath: '/anti-ragging',
    image: 'logo.png',
    imageAlt: 'Anti-Ragging Committee and Helpline',
    ogType: 'website',
    robots: DEFAULT_ROBOTS_INDEX,
    schemaType: 'WebPage',
    breadcrumbLabel: 'Anti-Ragging'
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

  public updateTags(tags: Partial<RouteSeoConfig>): void {
    if (tags.title) {
      this.titleService.setTitle(tags.title);
      this.metaService.updateTag({ property: 'og:title', content: tags.title });
      this.metaService.updateTag({ name: 'twitter:title', content: tags.title });
    }
    if (tags.description) {
      this.metaService.updateTag({ name: 'description', content: tags.description });
      this.metaService.updateTag({ property: 'og:description', content: tags.description });
      this.metaService.updateTag({ name: 'twitter:description', content: tags.description });
    }
    if (tags.keywords) {
      this.metaService.updateTag({ name: 'keywords', content: tags.keywords });
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
        },
        ...(config.schemaType === 'Course'
          ? [
              {
                '@type': 'Course',
                '@id': `${canonicalUrl}#course`,
                name: config.title,
                description: config.description,
                provider: {
                  '@type': 'EducationalOrganization',
                  name: 'Kavya Shree Institute of Nursing',
                  sameAs: SITE_BASE_URL
                }
              }
            ]
          : [])
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
