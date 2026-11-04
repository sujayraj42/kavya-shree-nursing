import { Injectable, signal, computed } from '@angular/core';

export type LanguageCode = 'en' | 'hi';

const STORAGE_KEY = 'ks_preferred_language';

const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  en: {
    'brand.name': 'Kavya Shree Institute of Nursing',
    'brand.dept': 'Department of Nursing & Health Sciences',
    'nav.home': 'Home',
    'nav.about': 'About Us',
    'nav.programs': 'Programs',
    'nav.admissions': 'Admissions',
    'nav.gallery': 'Gallery',
    'nav.faculty': 'Faculty & Tie-ups',
    'nav.notices': 'Notices',
    'nav.downloads': 'Downloads',
    'nav.faqs': 'FAQs',
    'nav.contact': 'Contact Desk',
    'nav.apply': 'Apply Online 2026',
    'nav.enquire': 'Enquire Now',
    'notice.banner': 'Admissions Open 2026: Provisional seat allocation and counseling desk operational.',
    'notice.lastDate': 'Last Date to Apply: 31 August 2026',
    'action.callNow': 'Call Desk',
    'action.whatsapp': 'WhatsApp',
    'action.applyOnline': 'Apply Online',
    'action.downloadProspectus': 'Download Prospectus',
    'action.sendEnquiry': 'Send Enquiry',
    'action.submitting': 'Submitting...',
    'form.name': 'Candidate Full Name',
    'form.phone': '10-Digit Mobile Number',
    'form.email': 'Email Address (Optional)',
    'form.program': 'Intended Nursing Program',
    'form.message': 'Message / Inquiry Details (Optional)',
    'form.consent': 'I authorize Kavya Shree Institute admissions desk to contact me regarding course admissions.',
    'status.success': 'Enquiry Submitted Successfully! Reference ID: ',
    'status.error': 'Submission failed. Please call our helpline directly at +91 96616 66485.'
  },
  hi: {
    'brand.name': 'काव्या श्री नर्सिंग संस्थान',
    'brand.dept': 'नर्सिंग एवं स्वास्थ्य विज्ञान विभाग',
    'nav.home': 'होम',
    'nav.about': 'संस्थान परिचय',
    'nav.programs': 'पाठ्यक्रम',
    'nav.admissions': 'प्रवेश प्रक्रिया',
    'nav.gallery': 'परिसर गैलरी',
    'nav.faculty': 'शिक्षक एवं अस्पताल अनुबंध',
    'nav.notices': 'सूचनाएं',
    'nav.downloads': 'डाउनलोड',
    'nav.faqs': 'सामान्य प्रश्नोत्तर',
    'nav.contact': 'संपर्क डेस्क',
    'nav.apply': 'ऑनलाइन आवेदन 2026',
    'nav.enquire': 'पूछताछ करें',
    'notice.banner': 'प्रवेश सत्र 2026 खुला है: अनंतिम सीट आवंटन और काउंसलिंग डेस्क सक्रिय है।',
    'notice.lastDate': 'आवेदन की अंतिम तिथि: 31 अगस्त 2026',
    'action.callNow': 'कॉल करें',
    'action.whatsapp': 'व्हाट्सएप',
    'action.applyOnline': 'ऑनलाइन आवेदन',
    'action.downloadProspectus': 'विवरणिका डाउनलोड',
    'action.sendEnquiry': 'पूछताछ भेजें',
    'action.submitting': 'जमा हो रहा है...',
    'form.name': 'अभ्यर्थी का पूरा नाम',
    'form.phone': '10 अंकों का मोबाइल नंबर',
    'form.email': 'ईमेल पता (वैकल्पिक)',
    'form.program': 'वांछित नर्सिंग पाठ्यक्रम',
    'form.message': 'संदेश या पूछताछ (वैकल्पिक)',
    'form.consent': 'मैं काव्या श्री संस्थान के प्रवेश डेस्क को पाठ्यक्रम परामर्श हेतु संपर्क करने की अनुमति देता/देती हूँ।',
    'status.success': 'पूछताछ सफलतापूर्वक दर्ज की गई! संदर्भ संख्या: ',
    'status.error': 'सबमिशन में त्रुटि। कृपया हमारे हेल्पलाइन नंबर +91 96616 66485 पर सीधा संपर्क करें।'
  }
};

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  public readonly currentLang = signal<LanguageCode>('en');

  constructor() {
    this.initLanguage();
  }

  private initLanguage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
        if (stored === 'hi' || stored === 'en') {
          this.setLanguage(stored);
          return;
        }
      } catch {
        // Fallback to English
      }
    }
    this.setLanguage('en');
  }

  public setLanguage(lang: LanguageCode): void {
    this.currentLang.set(lang);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch {}
      if (document && document.documentElement) {
        document.documentElement.lang = lang;
      }
    }
  }

  public toggleLanguage(): void {
    const nextLang = this.currentLang() === 'en' ? 'hi' : 'en';
    this.setLanguage(nextLang);
  }

  public translate(key: string): string {
    const lang = this.currentLang();
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['en']?.[key] || key;
  }

  public t(key: string): string {
    return this.translate(key);
  }
}
