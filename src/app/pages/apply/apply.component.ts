import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { environment } from '../../../environments/environment';
import { SeoService } from '../../core/services/seo.service';
import { I18nService } from '../../core/services/i18n.service';

const STORAGE_KEY = 'ks_online_application_draft';
const OFFLINE_QUEUE_KEY = 'ks_offline_applications';

export interface ProgramCard {
  id: string;
  name: string;
  code: string;
  duration: string;
  level: string;
  eligibility: string;
  badge?: string;
  seats: number;
}

export const PROGRAM_OPTIONS: ProgramCard[] = [
  {
    id: 'b-sc-nursing',
    name: 'Bachelor of Science in Nursing (B.Sc.)',
    code: 'B.Sc. Nursing',
    duration: '4 Years',
    level: 'Undergraduate Degree',
    eligibility: '10+2 with Physics, Chemistry, Biology & English (Min 45% aggregate)',
    badge: 'Most Popular',
    seats: 60
  },
  {
    id: 'gnm',
    name: 'General Nursing & Midwifery (GNM)',
    code: 'GNM Diploma',
    duration: '3 Years',
    level: 'Diploma',
    eligibility: '10+2 in any stream (Science PCB preferred) with min 40% marks',
    badge: 'High Demand',
    seats: 60
  },
  {
    id: 'anm',
    name: 'Auxiliary Nursing & Midwifery (ANM)',
    code: 'ANM Diploma',
    duration: '2 Years',
    level: 'Diploma',
    eligibility: '10+2 passed from recognized board, min age 17 years',
    seats: 40
  },
  {
    id: 'pb-b-sc',
    name: 'Post Basic B.Sc. Nursing',
    code: 'P.B. B.Sc.',
    duration: '2 Years',
    level: 'Degree (Post-Diploma)',
    eligibility: 'GNM qualified with active State Nursing Council registration',
    seats: 30
  },
  {
    id: 'm-sc-nursing',
    name: 'Master of Science in Nursing (M.Sc.)',
    code: 'M.Sc. Nursing',
    duration: '2 Years',
    level: 'Postgraduate Degree',
    eligibility: 'B.Sc. Nursing / P.B. B.Sc. with min 55% aggregate & 1 yr experience',
    seats: 25
  }
];

@Component({
  selector: 'app-apply',
  standalone: true,
  imports: [RouterLink, FormsModule, DecimalPipe],
  templateUrl: './apply.component.html',
  styleUrl: './apply.component.css'
})
export class ApplyComponent implements OnInit {
  private readonly seoService = inject(SeoService);
  protected readonly i18n = inject(I18nService);

  protected readonly apiBaseUrl = environment.apiBaseUrl;
  protected readonly programCards = PROGRAM_OPTIONS;
  protected readonly currentStep = signal<number>(1);
  protected readonly totalSteps = 5;

  // Step 1: Personal Details
  protected applicantName = signal('');
  protected gender = signal('Female');
  protected dob = signal('');
  protected category = signal('General');

  // Step 2: Family & Contact
  protected fatherName = signal('');
  protected motherName = signal('');
  protected phone = signal('');
  protected email = signal('');
  protected street = signal('');
  protected district = signal('Patna');
  protected state = signal('Bihar');
  protected pincode = signal('');

  // Step 3: Program Selection
  protected selectedProgram = signal('Bachelor of Science in Nursing (B.Sc.)');

  // Step 4: Academic Details
  protected tenthBoard = signal('BSEB');
  protected tenthYear = signal(2021);
  protected tenthPercentage = signal(75);
  protected twelfthBoard = signal('BSEB');
  protected twelfthYear = signal(2023);
  protected twelfthPercentage = signal(70);
  protected pcbPercentage = signal(68);

  // Step 5: Declaration & State
  protected declaration = signal(false);
  protected isSubmitting = signal(false);
  protected errorMessage = signal('');
  protected submittedData = signal<{
    applicationNumber: string;
    applicantName: string;
    program: string;
    isOffline?: boolean;
  } | null>(null);

  // Validation errors & UI flags
  protected stepError = signal('');
  protected copiedReference = signal(false);

  public ngOnInit(): void {
    this.seoService.updateTags({
      title: 'Online Application 2026-2027 | Kavya Shree Institute of Nursing',
      description: 'Submit your formal online application for ANM, GNM, and B.Sc. Nursing programs for academic session 2026-2027. INC & BNRC recognized campus.',
      keywords: 'nursing online application form, B.Sc nursing admission bihar, GNM apply online, ANM admission 2026'
    });

    this.restoreDraft();
  }

  private restoreDraft(): void {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (raw) {
          const draft = JSON.parse(raw);
          if (draft.applicantName) this.applicantName.set(draft.applicantName);
          if (draft.gender) this.gender.set(draft.gender);
          if (draft.dob) this.dob.set(draft.dob);
          if (draft.category) this.category.set(draft.category);
          if (draft.fatherName) this.fatherName.set(draft.fatherName);
          if (draft.motherName) this.motherName.set(draft.motherName);
          if (draft.phone) this.phone.set(draft.phone);
          if (draft.email) this.email.set(draft.email);
          if (draft.street) this.street.set(draft.street);
          if (draft.district) this.district.set(draft.district);
          if (draft.state) this.state.set(draft.state);
          if (draft.pincode) this.pincode.set(draft.pincode);
          if (draft.selectedProgram) this.selectedProgram.set(draft.selectedProgram);
          if (draft.tenthBoard) this.tenthBoard.set(draft.tenthBoard);
          if (draft.tenthYear) this.tenthYear.set(draft.tenthYear);
          if (draft.tenthPercentage) this.tenthPercentage.set(draft.tenthPercentage);
          if (draft.twelfthBoard) this.twelfthBoard.set(draft.twelfthBoard);
          if (draft.twelfthYear) this.twelfthYear.set(draft.twelfthYear);
          if (draft.twelfthPercentage) this.twelfthPercentage.set(draft.twelfthPercentage);
          if (draft.pcbPercentage) this.pcbPercentage.set(draft.pcbPercentage);
        }
      } catch {}
    }
  }

  protected saveDraft(): void {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        const draft = {
          applicantName: this.applicantName(),
          gender: this.gender(),
          dob: this.dob(),
          category: this.category(),
          fatherName: this.fatherName(),
          motherName: this.motherName(),
          phone: this.phone(),
          email: this.email(),
          street: this.street(),
          district: this.district(),
          state: this.state(),
          pincode: this.pincode(),
          selectedProgram: this.selectedProgram(),
          tenthBoard: this.tenthBoard(),
          tenthYear: this.tenthYear(),
          tenthPercentage: this.tenthPercentage(),
          twelfthBoard: this.twelfthBoard(),
          twelfthYear: this.twelfthYear(),
          twelfthPercentage: this.twelfthPercentage(),
          pcbPercentage: this.pcbPercentage()
        };
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      } catch {}
    }
  }

  public goToStep(target: number): void {
    if (target < this.currentStep()) {
      this.stepError.set('');
      this.currentStep.set(target);
    } else if (target === this.currentStep() + 1) {
      this.nextStep();
    }
  }

  public selectProgram(programName: string): void {
    this.selectedProgram.set(programName);
    this.saveDraft();
  }

  public nextStep(): void {
    this.stepError.set('');

    if (this.currentStep() === 1) {
      if (!this.applicantName().trim() || this.applicantName().trim().length < 2) {
        this.stepError.set('Please enter the candidate’s full legal name (at least 2 characters).');
        return;
      }
      if (!this.dob()) {
        this.stepError.set('Please provide the date of birth.');
        return;
      }
    } else if (this.currentStep() === 2) {
      if (!this.fatherName().trim() || !this.motherName().trim()) {
        this.stepError.set('Please enter both parents’ names.');
        return;
      }
      const digits = this.phone().replace(/\D/g, '');
      if (digits.length < 10) {
        this.stepError.set('Please enter a valid 10-digit mobile number.');
        return;
      }
      if (this.email().trim() && !this.email().includes('@')) {
        this.stepError.set('Please enter a valid contact email address.');
        return;
      }
      if (!this.district().trim() || !this.pincode().trim()) {
        this.stepError.set('Please enter district and 6-digit postal pincode.');
        return;
      }
    } else if (this.currentStep() === 3) {
      if (!this.selectedProgram()) {
        this.stepError.set('Please select your preferred nursing program.');
        return;
      }
    } else if (this.currentStep() === 4) {
      if (!this.tenthBoard() || !this.tenthPercentage()) {
        this.stepError.set('Please provide 10th standard board and percentage.');
        return;
      }
      if (!this.twelfthBoard() || !this.twelfthPercentage()) {
        this.stepError.set('Please provide 12th standard board and percentage.');
        return;
      }
    }

    this.saveDraft();
    if (this.currentStep() < this.totalSteps) {
      this.currentStep.update(s => s + 1);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 180, behavior: 'smooth' });
      }
    }
  }

  public prevStep(): void {
    this.stepError.set('');
    if (this.currentStep() > 1) {
      this.currentStep.update(s => s - 1);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 180, behavior: 'smooth' });
      }
    }
  }

  public copyReference(): void {
    const sub = this.submittedData();
    if (!sub || typeof navigator === 'undefined' || !navigator.clipboard) return;
    navigator.clipboard.writeText(sub.applicationNumber).then(() => {
      this.copiedReference.set(true);
      setTimeout(() => this.copiedReference.set(false), 2500);
    }).catch(() => {});
  }

  public printReceipt(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  public async submitApplication(): Promise<void> {
    if (this.isSubmitting()) return;
    this.errorMessage.set('');

    if (!this.declaration()) {
      this.errorMessage.set('You must accept the truthfulness declaration before submitting.');
      return;
    }

    this.isSubmitting.set(true);

    const payload = {
      applicantName: this.applicantName().trim(),
      gender: this.gender(),
      dob: this.dob(),
      fatherName: this.fatherName().trim(),
      motherName: this.motherName().trim(),
      phone: this.phone().replace(/\D/g, ''),
      email: this.email().trim().toLowerCase(),
      category: this.category(),
      address: {
        street: this.street().trim(),
        district: this.district().trim(),
        state: this.state().trim(),
        pincode: this.pincode().trim()
      },
      program: this.selectedProgram(),
      academicDetails: {
        tenthBoard: this.tenthBoard(),
        tenthYear: Number(this.tenthYear()),
        tenthPercentage: Number(this.tenthPercentage()),
        twelfthBoard: this.twelfthBoard(),
        twelfthYear: Number(this.twelfthYear()),
        twelfthPercentage: Number(this.twelfthPercentage()),
        pcbPercentage: Number(this.pcbPercentage())
      },
      declaration: true
    };

    // Candidate candidate endpoints to try in order of proximity and stability
    const endpoints = [
      '/api/applications',
      `${environment.apiBaseUrl}/applications`,
      'https://kavya-shree-nursing.onrender.com/api/applications'
    ];

    let lastError = '';
    let succeeded = false;

    for (const url of endpoints) {
      try {
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timeoutId = controller ? setTimeout(() => controller.abort(), 9000) : null;

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller?.signal
        });

        if (timeoutId) clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data?.success && data?.data?.applicationNumber) {
            this.submittedData.set({
              applicationNumber: data.data.applicationNumber,
              applicantName: data.data.applicantName || payload.applicantName,
              program: data.data.program || payload.program,
              isOffline: false
            });
            succeeded = true;
            break;
          }
        } else {
          try {
            const errJson = await res.json();
            lastError = errJson?.error || `HTTP ${res.status}`;
          } catch {
            lastError = `HTTP ${res.status}`;
          }
        }
      } catch (err: any) {
        lastError = err?.message || 'Network unreachable';
      }
    }

    // Safety Net: If all network attempts fail, queue offline so candidate never loses data
    if (!succeeded) {
      const fallbackAppNumber = `KSIN-2026-APP-${Math.floor(100000 + Math.random() * 900000)}`;
      this.persistOfflineApplication(payload, fallbackAppNumber);

      this.submittedData.set({
        applicationNumber: fallbackAppNumber,
        applicantName: payload.applicantName,
        program: payload.program,
        isOffline: true
      });
      succeeded = true;
    }

    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.removeItem(STORAGE_KEY);
    }

    this.isSubmitting.set(false);
  }

  private persistOfflineApplication(payload: any, appNumber: string): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const existing = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
      existing.push({
        applicationNumber: appNumber,
        payload,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(existing));
    } catch {}
  }
}
