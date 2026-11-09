import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { environment } from '../../../environments/environment';
import { SeoService } from '../../core/services/seo.service';
import { I18nService } from '../../core/services/i18n.service';

const STORAGE_KEY = 'ks_online_application_draft';
const OFFLINE_QUEUE_KEY = 'ks_offline_applications';
const ADMIN_OFFLINE_QUEUE_KEY = 'ks_nursing_applications_offline_queue';

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
    const sub = this.submittedData();
    if (typeof window === 'undefined') return;
    if (!sub?.applicationNumber) {
      window.print();
      return;
    }

    const receiptWindow = window.open('', '_blank');
    if (!receiptWindow || !receiptWindow.document) {
      window.print();
      return;
    }

    const html = this.buildOfficialReceiptHtml(
      sub.applicationNumber,
      sub.applicantName || this.applicantName(),
      sub.program || this.selectedProgram()
    );
    receiptWindow.document.open();
    receiptWindow.document.write(html);
    receiptWindow.document.close();
  }

  public async submitApplication(): Promise<void> {
    if (this.isSubmitting()) return;
    this.errorMessage.set('');

    if (!this.declaration()) {
      this.errorMessage.set('You must accept the truthfulness declaration before submitting.');
      return;
    }

    this.isSubmitting.set(true);

    const generatedAppNumber = `KSIN-2026-APP-${Math.floor(100000 + Math.random() * 900000)}`;
    const payload = {
      applicationNumber: generatedAppNumber,
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

    // Primary application endpoints in order of proximity and stability
    const endpoints = Array.from(
      new Set([
        '/api/applications',
        `${environment.apiBaseUrl}/applications`,
        'https://kavya-shree-nursing.onrender.com/api/applications'
      ])
    );

    let finalAppNumber = generatedAppNumber;
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
            finalAppNumber = data.data.applicationNumber;
            this.persistOfflineApplication(payload, finalAppNumber);
            this.submittedData.set({
              applicationNumber: finalAppNumber,
              applicantName: data.data.applicantName || payload.applicantName,
              program: data.data.program || payload.program,
              isOffline: false
            });
            succeeded = true;
            break;
          }
        }
      } catch {
        // Continue to next endpoint
      }
    }

    // Bridge: If /api/applications is not mounted on the remote backend (404), persist via /api/enquiries
    // so the complete application record is stored in MongoDB Atlas and visible in Admin Panel.
    if (!succeeded) {
      const enquiryEndpoints = Array.from(
        new Set([
          `${environment.apiBaseUrl}/enquiries`,
          'https://kavya-shree-nursing.onrender.com/api/enquiries',
          '/api/enquiries'
        ])
      );
      const enquiryPayload = {
        name: payload.applicantName,
        phone: payload.phone,
        email: payload.email || undefined,
        program: payload.program,
        message: this.buildStructuredApplicationEnquiryMessage(payload, generatedAppNumber),
        consent: true
      };

      for (const url of enquiryEndpoints) {
        try {
          const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
          const timeoutId = controller ? setTimeout(() => controller.abort(), 9000) : null;

          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(enquiryPayload),
            signal: controller?.signal
          });

          if (timeoutId) clearTimeout(timeoutId);

          if (res.ok) {
            this.persistOfflineApplication(payload, generatedAppNumber);
            this.submittedData.set({
              applicationNumber: generatedAppNumber,
              applicantName: payload.applicantName,
              program: payload.program,
              isOffline: false
            });
            succeeded = true;
            break;
          }
        } catch {
          // Continue to next fallback
        }
      }
    }

    // Safety Net: If all network attempts fail, queue offline so candidate never loses data
    if (!succeeded) {
      this.persistOfflineApplication(payload, generatedAppNumber);

      this.submittedData.set({
        applicationNumber: generatedAppNumber,
        applicantName: payload.applicantName,
        program: payload.program,
        isOffline: true
      });
    }

    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.removeItem(STORAGE_KEY);
    }

    this.isSubmitting.set(false);
  }

  private buildStructuredApplicationEnquiryMessage(payload: any, appNumber: string): string {
    const clean = (v: unknown) => String(v ?? '').replace(/[<>|]/g, ' ').trim();
    return [
      `[ONLINE_APPLICATION ${appNumber}]`,
      `Gender: ${clean(payload.gender || 'Female')}`,
      `DOB: ${clean(payload.dob || '')}`,
      `Category: ${clean(payload.category || 'General')}`,
      `Father: ${clean(payload.fatherName || 'N/A')}`,
      `Mother: ${clean(payload.motherName || 'N/A')}`,
      `Street: ${clean(payload.address?.street || '')}`,
      `District: ${clean(payload.address?.district || 'Patna')}`,
      `State: ${clean(payload.address?.state || 'Bihar')}`,
      `PIN: ${clean(payload.address?.pincode || '')}`,
      `10th: ${clean(payload.academicDetails?.tenthBoard || 'BSEB')} (${clean(payload.academicDetails?.tenthYear || '')}) ${clean(payload.academicDetails?.tenthPercentage ?? '')}%`,
      `12th: ${clean(payload.academicDetails?.twelfthBoard || 'BSEB')} (${clean(payload.academicDetails?.twelfthYear || '')}) ${clean(payload.academicDetails?.twelfthPercentage ?? '')}%`,
      `PCB: ${clean(payload.academicDetails?.pcbPercentage ?? '')}%`
    ]
      .join(' | ')
      .slice(0, 950);
  }

  private persistOfflineApplication(payload: any, appNumber: string): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const record = {
      applicationNumber: appNumber,
      payload,
      status: 'submitted',
      createdAt: new Date().toISOString()
    };

    for (const key of [OFFLINE_QUEUE_KEY, ADMIN_OFFLINE_QUEUE_KEY]) {
      try {
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        const list = Array.isArray(existing) ? existing.filter((e: any) => e?.applicationNumber !== appNumber) : [];
        list.unshift(record);
        localStorage.setItem(key, JSON.stringify(list.slice(0, 100)));
      } catch {}
    }
  }

  private buildOfficialReceiptHtml(appNumber: string, applicantName: string, program: string): string {
    const esc = (v: unknown) =>
      String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const now = new Date();
    const submittedDate = now.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const submittedTime = now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const dobVal = this.dob()
      ? new Date(this.dob()).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
      : 'Not Specified';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Slip - ${esc(appNumber)} - Kavya Shree Institute of Nursing</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #1e293b; background-color: #f1f5f9; padding: 24px 16px; line-height: 1.5; }
    .action-bar { max-width: 800px; margin: 0 auto 16px auto; display: flex; justify-content: space-between; align-items: center; background: #0f2942; color: #ffffff; padding: 12px 20px; border-radius: 8px; }
    .action-bar button { background: #f59e0b; color: #0f2942; border: none; font-weight: 700; padding: 8px 18px; border-radius: 6px; cursor: pointer; font-size: 14px; display: inline-flex; align-items: center; gap: 6px; }
    .receipt-container { max-width: 800px; margin: 0 auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 36px 40px; }
    .institute-header { text-align: center; border-bottom: 2px solid #0f2942; padding-bottom: 16px; margin-bottom: 24px; }
    .institute-name { font-size: 22px; font-weight: 800; color: #0f2942; letter-spacing: 0.5px; text-transform: uppercase; }
    .institute-affil { font-size: 12px; color: #475569; margin-top: 4px; font-weight: 500; }
    .receipt-title-badge { display: inline-block; margin-top: 10px; padding: 4px 14px; background: #f8fafc; border: 1px solid #e2e8f0; color: #0f2942; font-weight: 700; font-size: 13px; border-radius: 4px; text-transform: uppercase; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; background: #f8fafc; padding: 16px 20px; border-radius: 6px; border: 1px solid #e2e8f0; }
    .meta-item label { display: block; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 2px; }
    .meta-item .val { font-size: 15px; font-weight: 700; color: #0f2942; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    .section-title { font-size: 13px; text-transform: uppercase; color: #0f2942; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 10px; border-left: 4px solid #f59e0b; padding-left: 8px; }
    .data-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
    .data-table th, .data-table td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
    .data-table th { background: #f8fafc; color: #475569; font-weight: 700; width: 25%; }
    .status-badge { display: inline-block; padding: 2px 8px; font-size: 11px; font-weight: 700; border-radius: 4px; text-transform: uppercase; background: #dbeafe; color: #1e40af; }
    .declaration-box { font-size: 11px; color: #64748b; background: #f8fafc; padding: 12px 16px; border-radius: 6px; border: 1px solid #e2e8f0; margin-top: 16px; line-height: 1.6; }
    .signatures-row { display: flex; justify-content: space-between; align-items: center; margin-top: 36px; padding-top: 16px; }
    .sig-box { text-align: center; width: 200px; }
    .sig-line { border-top: 1px dashed #94a3b8; margin-bottom: 6px; }
    .sig-label { font-size: 12px; color: #64748b; font-weight: 600; }
    .seal-box { border: 2px solid #0f2942; color: #0f2942; font-size: 11px; font-weight: 700; padding: 10px 14px; border-radius: 50%; width: 90px; height: 90px; display: flex; align-items: center; justify-content: center; text-align: center; text-transform: uppercase; opacity: 0.75; }
    @media print { body { background: #ffffff; padding: 0; } .action-bar { display: none; } .receipt-container { border: none; padding: 0; max-width: 100%; } }
  </style>
</head>
<body>
  <div class="action-bar">
    <div><strong>Kavya Shree Institute of Nursing</strong> &bull; Official Candidate Application Slip</div>
    <div><button onclick="window.print()">Print / Save as PDF</button></div>
  </div>
  <div class="receipt-container">
    <div class="institute-header">
      <div class="institute-name">Kavya Shree Institute of Nursing</div>
      <div class="institute-affil">Statutory Affiliation Application on File &bull; INC &amp; BNRC Process (Session 2026–27) &bull; Punpun, Patna, Bihar</div>
      <div class="receipt-title-badge">Admissions Intake 2026–2027 &bull; Formal Application Acknowledgement</div>
    </div>
    <div class="meta-grid">
      <div class="meta-item"><label>Application Reference Number</label><div class="val">${esc(appNumber)}</div></div>
      <div class="meta-item" style="text-align: right;"><label>Submission Date &amp; Time</label><div class="val" style="font-size: 13px;">${esc(submittedDate)} ${esc(submittedTime)}</div></div>
      <div class="meta-item"><label>Applied Program</label><div class="val" style="font-family: inherit; font-size: 14px; color: #0284c7;">${esc(program)}</div></div>
      <div class="meta-item" style="text-align: right;"><label>Current Status</label><div class="status-badge">SUBMITTED</div></div>
    </div>
    <div class="section-title">1. Applicant Profile &amp; Identity</div>
    <table class="data-table">
      <tr><th>Applicant Full Name</th><td><strong>${esc(applicantName)}</strong></td><th>Date of Birth</th><td>${esc(dobVal)}</td></tr>
      <tr><th>Gender</th><td>${esc(this.gender() || 'Female')}</td><th>Category / Quota</th><td>${esc(this.category() || 'General')}</td></tr>
      <tr><th>Father's Name</th><td>${esc(this.fatherName() || 'N/A')}</td><th>Mother's Name</th><td>${esc(this.motherName() || 'N/A')}</td></tr>
      <tr><th>Contact Mobile</th><td>+91 ${esc(this.phone() || 'N/A')}</td><th>Email Address</th><td>${esc(this.email() || 'N/A')}</td></tr>
      <tr><th>Permanent Address</th><td colspan="3">${this.street() ? esc(this.street()) + ', ' : ''}${esc(this.district() || 'Patna')}, ${esc(this.state() || 'Bihar')} - ${esc(this.pincode() || '')}</td></tr>
    </table>
    <div class="section-title">2. Academic Merit Record</div>
    <table class="data-table">
      <thead><tr><th>Standard</th><th>Board / Council</th><th>Passing Year</th><th>Aggregate / Score</th></tr></thead>
      <tbody>
        <tr><td><strong>10th / Secondary</strong></td><td>${esc(this.tenthBoard())}</td><td>${esc(this.tenthYear())}</td><td><strong>${esc(this.tenthPercentage())}%</strong></td></tr>
        <tr><td><strong>12th / Sr. Secondary</strong></td><td>${esc(this.twelfthBoard())}</td><td>${esc(this.twelfthYear())}</td><td><strong>${esc(this.twelfthPercentage())}%</strong> (PCB: ${esc(this.pcbPercentage())}%)</td></tr>
      </tbody>
    </table>
    <div class="declaration-box">
      <strong>Institutional Undertaking &amp; Counseling Instructions:</strong>
      <ol style="margin-left: 18px; margin-top: 4px;">
        <li>This computer-generated application slip acknowledges receipt of your online application under Reference ID <strong>${esc(appNumber)}</strong>.</li>
        <li>Final admission is subject to physical verification of original 10th &amp; 12th marksheets, CLC/migration certificate, caste/category certificate (if applicable), and medical fitness at the campus counseling desk.</li>
        <li>Admissions Helpline: +91 96616 66485 / +91 62878 79239 &bull; Campus: Punpun Station Road, Patna, Bihar.</li>
      </ol>
    </div>
    <div class="signatures-row">
      <div class="sig-box"><div class="sig-line"></div><div class="sig-label">Candidate Signature</div></div>
      <div class="seal-box">Official<br>Seal</div>
      <div class="sig-box"><div class="sig-line"></div><div class="sig-label">Authorized Admissions Officer</div></div>
    </div>
  </div>
</body>
</html>`;
  }
}
