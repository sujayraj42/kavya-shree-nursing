import { TestBed } from '@angular/core/testing';
import { I18nService } from './i18n.service';

describe('I18nService', () => {
  let service: I18nService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(I18nService);
    service.setLanguage('en');
  });

  it('should be created with default language', () => {
    expect(service).toBeTruthy();
    expect(service.currentLang()).toBe('en');
  });

  it('should switch language to Hindi and translate keys', () => {
    service.setLanguage('hi');
    expect(service.currentLang()).toBe('hi');
    expect(service.t('nav.home')).toBe('होम');
    expect(service.t('nav.apply')).toBe('ऑनलाइन आवेदन 2026');
  });

  it('should fallback gracefully to English if translation is missing', () => {
    service.setLanguage('en');
    expect(service.t('nav.home')).toBe('Home');
    expect(service.t('non.existent.key')).toBe('non.existent.key');
  });

  it('should toggle language back and forth', () => {
    service.setLanguage('en');
    service.toggleLanguage();
    expect(service.currentLang()).toBe('hi');
    service.toggleLanguage();
    expect(service.currentLang()).toBe('en');
  });
});
