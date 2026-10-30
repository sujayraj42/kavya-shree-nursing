import {
  Component,
  signal,
  ElementRef,
  DestroyRef,
  afterNextRender,
  inject
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MotionService } from '../../core/services/motion.service';
import { EnquiryService } from '../../core/services/enquiry.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  private readonly motionService = inject(MotionService);
  private readonly enquiryService = inject(EnquiryService);
  private readonly elementRef = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private scrollTriggerRef: any = null;

  // iUniversity Program Tabs State (5 Advertised Programs)
  protected readonly activeProgramTab = signal<'all' | 'degree' | 'diploma' | 'pg'>('all');

  // Candidate Enquiry Form Fields
  protected readonly applicantName = signal('');
  protected readonly applicantPhone = signal('');
  protected readonly applicantEmail = signal('');
  protected readonly selectedProgram = signal('');
  protected readonly applicantMessage = signal('');
  protected readonly applicantConsent = signal(false);

  // Field-Level Validation State
  protected readonly nameError = signal('');
  protected readonly phoneError = signal('');
  protected readonly emailError = signal('');
  protected readonly programError = signal('');
  protected readonly consentError = signal('');
  protected readonly formValidationError = signal('');
  protected readonly serverError = signal('');

  // Submission Status
  protected readonly isSubmitting = signal(false);
  protected readonly isFormSubmitted = signal(false);
  protected readonly confirmedSubmission = signal<{
    id?: string;
    name: string;
    program: string;
    phone: string;
    email: string;
  } | null>(null);

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

      const { gsap, ScrollTrigger } = motion;
      this.scrollTriggerRef = ScrollTrigger;
      const root = this.elementRef.nativeElement;

      ctx = gsap.context(() => {
        // --------------------------------------------------------------------
        // 1. Hero Entrance Animation
        // --------------------------------------------------------------------
        const heroSection = root.querySelector('#hero');
        if (heroSection) {
          const heroTl = gsap.timeline({
            defaults: {
              ease: this.motionService.tokens.ease.smooth,
              duration: this.motionService.tokens.duration.hero
            }
          });

          const kicker = root.querySelector('#hero .ks-section-kicker');
          const heading = root.querySelector('#hero .h1-heading');
          const description = root.querySelector('#hero .para-white');
          const buttons = root.querySelectorAll('#hero .button-container a');
          const metaStrip = root.querySelector('#hero .hero-campus-meta');
          const visualFrame = root.querySelector('#hero .hero-visual-frame');

          if (kicker) {
            heroTl.from(kicker, { opacity: 0, y: -12, duration: 0.5 }, 0);
          }
          if (heading) {
            heroTl.from(heading, { opacity: 0, y: 24, duration: 0.8 }, 0.1);
          }
          if (description) {
            heroTl.from(description, { opacity: 0, y: 18, duration: 0.7 }, 0.25);
          }
          if (buttons && buttons.length) {
            heroTl.from(buttons, { opacity: 0, y: 16, stagger: 0.1, duration: 0.6 }, 0.4);
          }
          if (metaStrip) {
            heroTl.from(metaStrip, { opacity: 0, y: 12, duration: 0.6 }, 0.55);
          }
          if (visualFrame) {
            heroTl.from(
              visualFrame,
              {
                opacity: 0,
                y: 30,
                scale: 0.98,
                duration: 1.0,
                ease: 'power2.out',
                clearProps: 'transform,opacity,scale'
              },
              0.15
            );
          }
        }

        // --------------------------------------------------------------------
        // 2. Section Heading Reveal Helper
        // --------------------------------------------------------------------
        const createScrollReveal = (selector: string, yOffset = 28) => {
          const el = root.querySelector(selector);
          if (!el) return;
          gsap.from(el, {
            scrollTrigger: {
              trigger: el,
              start: 'top 85%',
              once: true
            },
            opacity: 0,
            y: yOffset,
            duration: this.motionService.tokens.duration.standard,
            ease: this.motionService.tokens.ease.smooth,
            clearProps: 'transform,opacity'
          });
        };

        // --------------------------------------------------------------------
        // 3. About Section Reveal
        // --------------------------------------------------------------------
        const aboutCard = root.querySelector('#about .img-div');
        const aboutContent = root.querySelector('#about .about-content-div');
        if (aboutCard && aboutContent) {
          gsap.from([aboutCard, aboutContent], {
            scrollTrigger: {
              trigger: '#about',
              start: 'top 80%',
              once: true
            },
            opacity: 0,
            y: 32,
            stagger: 0.16,
            duration: this.motionService.tokens.duration.standard,
            ease: this.motionService.tokens.ease.smooth,
            clearProps: 'transform,opacity'
          });
        }

        // --------------------------------------------------------------------
        // 4. Courses Header & Staggered Course Cards
        // --------------------------------------------------------------------
        const coursesHeader = root.querySelector('#courses .text-center');
        if (coursesHeader) {
          gsap.from(coursesHeader, {
            scrollTrigger: {
              trigger: '#courses',
              start: 'top 85%',
              once: true
            },
            opacity: 0,
            y: 24,
            duration: this.motionService.tokens.duration.standard,
            ease: this.motionService.tokens.ease.smooth,
            clearProps: 'transform,opacity'
          });
        }

        const courseCards = root.querySelectorAll('#courses .ks-course-card');
        if (courseCards.length) {
          gsap.from(courseCards, {
            scrollTrigger: {
              trigger: '#courses .row.g-4',
              start: 'top 85%',
              once: true
            },
            opacity: 0,
            y: 32,
            stagger: 0.1,
            duration: this.motionService.tokens.duration.standard,
            ease: this.motionService.tokens.ease.smooth,
            clearProps: 'transform,opacity'
          });
        }

        // --------------------------------------------------------------------
        // 5. Consultation Call-to-Action Banner
        // --------------------------------------------------------------------
        createScrollReveal('.cta-section');

        // --------------------------------------------------------------------
        // 6. Strengths / Mission Section Reveal
        // --------------------------------------------------------------------
        const missionContent = root.querySelector('#strengths .about-content-div');
        const clinicalPillars = root.querySelector('#strengths .bg-stone.round-4');
        const clinicalLogos = root.querySelector('#strengths .client-logo-div');

        if (missionContent && clinicalPillars) {
          gsap.from([missionContent, clinicalPillars], {
            scrollTrigger: {
              trigger: '#strengths',
              start: 'top 80%',
              once: true
            },
            opacity: 0,
            y: 30,
            stagger: 0.16,
            duration: this.motionService.tokens.duration.standard,
            ease: this.motionService.tokens.ease.smooth,
            clearProps: 'transform,opacity'
          });
        }

        if (clinicalLogos) {
          createScrollReveal('.client-logo-div');
        }

        // --------------------------------------------------------------------
        // 7. Facilities Staggered Cards Reveal
        // --------------------------------------------------------------------
        const facilitiesHeader = root.querySelector('#facilities .text-center');
        if (facilitiesHeader) {
          createScrollReveal('#facilities .text-center');
        }

        const facilityCards = root.querySelectorAll('#facilities .tab-card');
        if (facilityCards.length) {
          gsap.from(facilityCards, {
            scrollTrigger: {
              trigger: '#facilities .row.g-4',
              start: 'top 85%',
              once: true
            },
            opacity: 0,
            y: 30,
            stagger: 0.12,
            duration: this.motionService.tokens.duration.standard,
            ease: this.motionService.tokens.ease.smooth,
            clearProps: 'transform,opacity'
          });
        }

        // --------------------------------------------------------------------
        // 8. Professional Standards & Ethics Testimonial Section
        // --------------------------------------------------------------------
        const ethicsHeader = root.querySelector('.testimonial-section .text-center');
        if (ethicsHeader) {
          createScrollReveal('.testimonial-section .text-center');
        }

        const ethicsCards = root.querySelectorAll('.testimonial-section .testimonial-card');
        if (ethicsCards.length) {
          gsap.from(ethicsCards, {
            scrollTrigger: {
              trigger: '.testimonial-section .row.g-4',
              start: 'top 85%',
              once: true
            },
            opacity: 0,
            y: 30,
            stagger: 0.12,
            duration: this.motionService.tokens.duration.standard,
            ease: this.motionService.tokens.ease.smooth,
            clearProps: 'transform,opacity'
          });
        }

        // --------------------------------------------------------------------
        // 9. Financial Support Welfare Schemes
        // --------------------------------------------------------------------
        const financialHeader = root.querySelector('#financial-support .text-center');
        if (financialHeader) {
          createScrollReveal('#financial-support .text-center');
        }

        const financialCards = root.querySelectorAll('#financial-support .tab-card');
        if (financialCards.length) {
          gsap.from(financialCards, {
            scrollTrigger: {
              trigger: '#financial-support .row.g-4',
              start: 'top 85%',
              once: true
            },
            opacity: 0,
            y: 30,
            stagger: 0.14,
            duration: this.motionService.tokens.duration.standard,
            ease: this.motionService.tokens.ease.smooth,
            clearProps: 'transform,opacity'
          });
        }

        // --------------------------------------------------------------------
        // 10. Admissions Enquiry & Consultation Desk Reveal
        // --------------------------------------------------------------------
        const admissionsMap = root.querySelector('#admissions-enquiry .map-div');
        const admissionsForm = root.querySelector('#admissions-enquiry .form-container-box');
        if (admissionsMap && admissionsForm) {
          gsap.from([admissionsMap, admissionsForm], {
            scrollTrigger: {
              trigger: '#admissions-enquiry',
              start: 'top 80%',
              once: true
            },
            opacity: 0,
            y: 32,
            stagger: 0.16,
            duration: this.motionService.tokens.duration.standard,
            ease: this.motionService.tokens.ease.smooth,
            clearProps: 'transform,opacity'
          });
        }
      }, root);

      if (isDestroyed) {
        ctx.revert();
      } else {
        // Trigger ScrollTrigger refresh after initial DOM render/paint
        setTimeout(() => {
          if (!isDestroyed && this.scrollTriggerRef) {
            this.scrollTriggerRef.refresh();
          }
        }, 100);
      }
    });
  }

  /**
   * Sets the active program category tab (iUniversity tab system).
   */
  protected setProgramTab(tab: 'all' | 'degree' | 'diploma' | 'pg'): void {
    this.activeProgramTab.set(tab);

    // Refresh ScrollTrigger calculations after Angular renders new tab elements
    if (this.scrollTriggerRef) {
      setTimeout(() => {
        this.scrollTriggerRef?.refresh();
      }, 50);
    }
  }

  /**
   * Preselects an academic program when clicked from a course card
   * and smoothly routes the user to the enquiry form.
   */
  protected onProgramSelect(programName: string): void {
    this.selectedProgram.set(programName);
    this.programError.set('');
  }

  /**
   * Validates all required inputs with rigorous field-level checks
   * and submits the enquiry securely to the backend API.
   */
  protected submitEnquiry(): void {
    if (this.isSubmitting()) {
      return;
    }

    const name = this.applicantName().trim();
    const phone = this.applicantPhone().trim();
    const email = this.applicantEmail().trim();
    const program = this.selectedProgram().trim();
    const message = this.applicantMessage().trim();
    const consent = this.applicantConsent();

    let hasError = false;

    // 1. Name Validation
    if (!name || name.length < 2) {
      this.nameError.set('Please enter the candidate’s full name (at least 2 characters).');
      hasError = true;
    } else {
      this.nameError.set('');
    }

    // 2. Phone Validation (must have at least 10 digits)
    const phoneDigitsOnly = phone.replace(/\D/g, '');
    if (!phone) {
      this.phoneError.set('Please provide a contact phone number.');
      hasError = true;
    } else if (phoneDigitsOnly.length < 10) {
      this.phoneError.set('Please enter a valid phone number with at least 10 digits.');
      hasError = true;
    } else {
      this.phoneError.set('');
    }

    // 3. Email Validation (if provided, must be syntactically valid)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      this.emailError.set('Please enter a valid email address (e.g. name@domain.com).');
      hasError = true;
    } else {
      this.emailError.set('');
    }

    // 4. Program Selection Validation
    if (!program) {
      this.programError.set('Please select an intended academic program.');
      hasError = true;
    } else {
      this.programError.set('');
    }

    // 5. Consent Validation
    if (!consent) {
      this.consentError.set('Candidate consent is required to process an admissions enquiry.');
      hasError = true;
    } else {
      this.consentError.set('');
    }

    if (hasError) {
      this.formValidationError.set('Please rectify the highlighted errors to proceed.');
      return;
    }

    // Clear validation error summary
    this.formValidationError.set('');
    this.serverError.set('');
    this.isSubmitting.set(true);

    this.enquiryService
      .submitEnquiry({
        name,
        phone: phoneDigitsOnly,
        email: email || null,
        program,
        message,
        consent: true
      })
      .subscribe({
        next: (res) => {
          this.isSubmitting.set(false);
          this.confirmedSubmission.set({
            id: res.data?.id,
            name,
            program: res.data?.program || program,
            phone,
            email: email || 'Not provided'
          });
          this.isFormSubmitted.set(true);

          // Reset Form Fields
          this.applicantName.set('');
          this.applicantPhone.set('');
          this.applicantEmail.set('');
          this.selectedProgram.set('');
          this.applicantMessage.set('');
          this.applicantConsent.set(false);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          const serverMsg =
            err?.error?.error ||
            'Unable to connect to the admissions service. Please verify your connection or call our admissions helpline (+91 96616 66485).';
          this.serverError.set(serverMsg);
        }
      });
  }

  /**
   * Resets the submission confirmation banner and reopens the form.
   */
  protected resetForm(): void {
    this.isFormSubmitted.set(false);
    this.confirmedSubmission.set(null);
    this.serverError.set('');
    this.formValidationError.set('');
  }
}
