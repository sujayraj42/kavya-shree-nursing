import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';
import { Router, NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';
import {
  SeoService,
  ROUTE_SEO_MAP,
  SITE_BASE_URL,
  DEFAULT_ROBOTS_INDEX,
  NOINDEX_ROBOTS
} from './seo.service';

describe('SeoService', () => {
  let service: SeoService;
  let titleService: Title;
  let metaService: Meta;
  let doc: Document;
  let routerEvents$: Subject<any>;
  let mockRouter: any;

  beforeEach(() => {
    routerEvents$ = new Subject<any>();
    mockRouter = {
      events: routerEvents$.asObservable()
    };

    TestBed.configureTestingModule({
      providers: [
        SeoService,
        Title,
        Meta,
        { provide: Router, useValue: mockRouter }
      ]
    });

    service = TestBed.inject(SeoService);
    titleService = TestBed.inject(Title);
    metaService = TestBed.inject(Meta);
    doc = TestBed.inject(DOCUMENT);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should update title, meta tags, canonical link, and JSON-LD for home route', () => {
    const titleSpy = vi.spyOn(titleService, 'setTitle');
    const metaSpy = vi.spyOn(metaService, 'updateTag');

    service.updateMetadataForUrl('/');

    expect(titleSpy).toHaveBeenCalledWith(ROUTE_SEO_MAP['/'].title);
    expect(metaSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'description', content: ROUTE_SEO_MAP['/'].description })
    );
    expect(metaSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'keywords', content: ROUTE_SEO_MAP['/'].keywords })
    );
    expect(metaSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'robots', content: DEFAULT_ROBOTS_INDEX })
    );
    expect(metaSpy).toHaveBeenCalledWith(
      expect.objectContaining({ property: 'og:title', content: ROUTE_SEO_MAP['/'].title })
    );
    expect(metaSpy).toHaveBeenCalledWith(
      expect.objectContaining({ property: 'og:url', content: `${SITE_BASE_URL}/` })
    );

    const canonical = doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    expect(canonical?.getAttribute('href')).toBe(`${SITE_BASE_URL}/`);

    const routeJsonLd = doc.head.querySelector<HTMLScriptElement>('script#ks-route-schema');
    expect(routeJsonLd).toBeTruthy();
    expect(routeJsonLd?.textContent).toContain('BreadcrumbList');
  });

  it('should update title, canonical URL, and BreadcrumbList for admissions route', () => {
    const titleSpy = vi.spyOn(titleService, 'setTitle');
    const metaSpy = vi.spyOn(metaService, 'updateTag');

    service.updateMetadataForUrl('/admissions');

    expect(titleSpy).toHaveBeenCalledWith(ROUTE_SEO_MAP['/admissions'].title);
    expect(metaSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'description', content: ROUTE_SEO_MAP['/admissions'].description })
    );

    const canonical = doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    expect(canonical?.getAttribute('href')).toBe(`${SITE_BASE_URL}/admissions`);

    const routeJsonLd = doc.head.querySelector<HTMLScriptElement>('script#ks-route-schema');
    expect(routeJsonLd?.textContent).toContain(`${SITE_BASE_URL}/admissions`);
    expect(routeJsonLd?.textContent).toContain('Admissions & Consultation');
  });

  it('should fallback to 404 metadata with noindex robots and remove route JSON-LD for unknown route', () => {
    const titleSpy = vi.spyOn(titleService, 'setTitle');
    const metaSpy = vi.spyOn(metaService, 'updateTag');

    service.updateMetadataForUrl('/unknown-page');

    expect(titleSpy).toHaveBeenCalledWith('Page Not Found | Kavya Shree Institute of Nursing');
    expect(metaSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'description' })
    );
    expect(metaSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'robots', content: NOINDEX_ROBOTS })
    );
    expect(doc.head.querySelector('script#ks-route-schema')).toBeNull();
  });

  it('should apply noindex, nofollow on admin routes', () => {
    const metaSpy = vi.spyOn(metaService, 'updateTag');

    service.updateMetadataForUrl('/admin/login');

    expect(metaSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'robots', content: NOINDEX_ROBOTS })
    );
  });

  it('should listen to NavigationEnd events when initRouteTracking is called', () => {
    const updateSpy = vi.spyOn(service, 'updateMetadataForUrl');

    service.initRouteTracking();

    routerEvents$.next(new NavigationEnd(1, '/programs', '/programs'));

    expect(updateSpy).toHaveBeenCalledWith('/programs');
  });
});
