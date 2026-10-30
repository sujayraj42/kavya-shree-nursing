import { TestBed } from '@angular/core/testing';
import { Title, Meta } from '@angular/platform-browser';
import { Router, NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { SeoService, ROUTE_SEO_MAP } from './seo.service';

describe('SeoService', () => {
  let service: SeoService;
  let titleService: Title;
  let metaService: Meta;
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
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should update title and meta tags for home route', () => {
    const titleSpy = vi.spyOn(titleService, 'setTitle');
    const metaSpy = vi.spyOn(metaService, 'updateTag');

    service.updateMetadataForUrl('/');

    expect(titleSpy).toHaveBeenCalledWith(ROUTE_SEO_MAP['/'].title);
    expect(metaSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'description', content: ROUTE_SEO_MAP['/'].description })
    );
    expect(metaSpy).toHaveBeenCalledWith(
      expect.objectContaining({ property: 'og:title', content: ROUTE_SEO_MAP['/'].title })
    );
  });

  it('should update title and meta tags for admissions route', () => {
    const titleSpy = vi.spyOn(titleService, 'setTitle');
    const metaSpy = vi.spyOn(metaService, 'updateTag');

    service.updateMetadataForUrl('/admissions');

    expect(titleSpy).toHaveBeenCalledWith(ROUTE_SEO_MAP['/admissions'].title);
    expect(metaSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'description', content: ROUTE_SEO_MAP['/admissions'].description })
    );
  });

  it('should fallback to 404 metadata for unknown route', () => {
    const titleSpy = vi.spyOn(titleService, 'setTitle');
    const metaSpy = vi.spyOn(metaService, 'updateTag');

    service.updateMetadataForUrl('/unknown-page');

    expect(titleSpy).toHaveBeenCalledWith('Page Not Found | Kavya Shree Institute of Nursing');
    expect(metaSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'description' })
    );
  });

  it('should listen to NavigationEnd events when initRouteTracking is called', () => {
    const updateSpy = vi.spyOn(service, 'updateMetadataForUrl');

    service.initRouteTracking();

    routerEvents$.next(new NavigationEnd(1, '/programs', '/programs'));

    expect(updateSpy).toHaveBeenCalledWith('/programs');
  });
});

