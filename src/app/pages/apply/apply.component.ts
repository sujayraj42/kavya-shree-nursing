import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { environment } from '../../../environments/environment';
import { SeoService } from '../../core/services/seo.service';
import { I18nService } from '../../core/services/i18n.service';

const STORAGE_KEY = 'ks_online_application_draft';

const PROGRAMS = [
  'Auxiliary Nursing & Midwifery (ANM)',
  'General Nursing & Midwifery (GNM)',
  'Bachelor of Science in Nursing (B.Sc.)',
  'Post Basic B.Sc. Nursing',
  'Master of Science in Nursing (M.Sc.)'
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
  protected readonly programs = PROGRAMS;
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
  protected submittedData = signal<{ applicationNumber: string; applicantName: string; program: string } | null>(null);

  // Validation errors
  protected stepError = signal('');

  public ngOnInit(): void {
    this.seoService.updateTags({
      title: 'Online Application 2026 | Kavya Shree Institute of Nursing',
      description: 'Submit your formal online application for ANM, GNM, and B.Sc. Nursing programs for academic session 2026.',
      keywords: 'nursing online application form, B.Sc nursing admission bihar, GNM apply online'
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
          if (draft.district) this.district.set(draft.district);
          if (draft.pincode) this.pincode.set(draft.pincode);
          if (draft.selectedProgram) this.selectedProgram.set(draft.selectedProgram);
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
          district: this.district(),
          pincode: this.pincode(),
          selectedProgram: this.selectedProgram()
        };
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      } catch {}
    }
  }

  protected nextStep(): void {
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
      if (!this.email().trim() || !this.email().includes('@')) {
        this.stepError.set('Please enter a valid contact email address.');
        return;
      }
      if (!this.district().trim() || !this.pincode().trim()) {
        this.stepError.set('Please enter district and 6-digit postal pincode.');
        return;
      }
    }

    this.saveDraft();
    if (this.currentStep() < this.totalSteps) {
      this.currentStep.update(s => s + 1);
    }
  }

  protected prevStep(): void {
    this.stepError.set('');
    if (this.currentStep() > 1) {
      this.currentStep.update(s => s - 1);
    }
  }

  protected async submitApplication(): Promise<void> {
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

    try {
      const res = await fetch(`${environment.apiBaseUrl}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to submit application. Please check your connection.');
      }

      this.submittedData.set({
        applicationNumber: data.data.applicationNumber,
        applicantName: data.data.applicantName,
        program: data.data.program
      });

      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.removeItem(STORAGE_KEY);
      }
      this.isSubmitting.set(false);
    } catch (err: any) {
      this.isSubmitting.set(false);
      this.errorMessage.set(err?.message || 'Submission failed. Please call the helpline.');
    }
  }
}
