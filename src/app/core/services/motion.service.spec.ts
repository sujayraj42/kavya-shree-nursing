import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { MotionService } from './motion.service';

describe('MotionService', () => {
  let service: MotionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MotionService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    service = TestBed.inject(MotionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(service.isBrowser).toBe(true);
  });

  it('should expose standardized motion tokens with restrained easings', () => {
    expect(service.tokens.duration.micro).toBeLessThanOrEqual(0.4);
    expect(service.tokens.duration.standard).toBeGreaterThanOrEqual(0.5);
    expect(service.tokens.duration.standard).toBeLessThanOrEqual(0.8);
    expect(service.tokens.duration.hero).toBeGreaterThanOrEqual(0.8);
    expect(service.tokens.duration.hero).toBeLessThanOrEqual(1.2);
    expect(service.tokens.ease.out).toBe('power2.out');
    expect(service.tokens.ease.smooth).toBe('power3.out');
  });

  it('should detect prefers-reduced-motion safely', () => {
    const isReduced = service.prefersReducedMotion();
    expect(typeof isReduced).toBe('boolean');
  });

  it('should load GSAP and ScrollTrigger dynamically in browser', async () => {
    const motion = await service.loadGsap();
    expect(motion).not.toBeNull();
    if (motion) {
      expect(motion.gsap).toBeDefined();
      expect(motion.ScrollTrigger).toBeDefined();
    }
  }, 20000);
});

