import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [RouterLink],
  template: `
    <!-- Hero Banner -->
    <section class="page-hero-banner text-white">
      <div class="container">
        <nav aria-label="Breadcrumb" class="mb-3">
          <ol class="breadcrumb breadcrumb-dark mb-0">
            <li class="breadcrumb-item"><a routerLink="/" class="breadcrumb-link">Home</a></li>
            <li class="breadcrumb-item active" aria-current="page">Privacy Policy</li>
          </ol>
        </nav>
        <span class="badge bg-warning text-dark text-uppercase fw-bold mb-2">Statutory Compliance</span>
        <h1 class="h2 fw-bold text-white mb-2">Digital Privacy Policy &amp; Data Collection Notice</h1>
        <p class="text-white-50 mb-0 max-w-650">
          Compliant with the Digital Personal Data Protection Act, 2023 (DPDP Act) and the Information Technology Act, 2000.
        </p>
      </div>
    </section>

    <!-- Main Content -->
    <section class="py-5 bg-stone">
      <div class="container" style="max-width: 900px;">
        <div class="card p-4 p-md-5 border-0 shadow-sm bg-white rounded-3">
          <div class="alert alert-light border small text-muted mb-4">
            <strong>Effective Date:</strong> Academic Session 2026–2027 &bull; <strong>Data Fiduciary:</strong> Kavya Shree Institute of Nursing, Punpun Station Road, Patna, Bihar &bull; <strong>Contact:</strong> privacy&#64;kavyashreenursing.edu.in
          </div>

          <h2 class="h5 fw-bold text-dark mb-3">1. Scope and Identity of Data Fiduciary</h2>
          <p class="small text-muted mb-4">
            Kavya Shree Institute of Nursing ("Institute", "we", "us") operates this digital admissions portal. Under the provisions of the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong>, the Institute functions as the <em>Data Fiduciary</em> responsible for safeguarding the personal data provided by prospective students, parents, and visitors ("Data Principals").
          </p>

          <h2 class="h5 fw-bold text-dark mb-3">2. Categories of Personal Data Collected</h2>
          <p class="small text-muted mb-2">When you register an admission enquiry or submit an online application, we collect:</p>
          <ul class="small text-muted mb-4 ps-3">
            <li><strong>Candidate Identification:</strong> Legal full name, gender, date of birth, and social category.</li>
            <li><strong>Parental Information:</strong> Father's name and mother's name for counseling records.</li>
            <li><strong>Contact Details:</strong> Verified 10-digit mobile number, WhatsApp contact, email address, and permanent residential address.</li>
            <li><strong>Academic Qualifications:</strong> 10th (Matriculation) and 12th (Intermediate) board names, passing years, overall percentage, and Physics-Chemistry-Biology (PCB) scores.</li>
            <li><strong>Technical Telemetry:</strong> Anonymized server logs, IP addresses, and browser agents strictly for rate limiting, DDoS mitigation, and session integrity.</li>
          </ul>

          <h2 class="h5 fw-bold text-dark mb-3">3. Purpose and Legal Grounds of Processing</h2>
          <p class="small text-muted mb-2">Personal data is processed strictly for legitimate educational purposes based on explicit candidate consent:</p>
          <ul class="small text-muted mb-4 ps-3">
            <li>Verifying candidate eligibility against statutory Indian Nursing Council (INC) and Bihar Nursing Registration Council (BNRC) criteria.</li>
            <li>Generating official candidate application slips and permanent registration numbers.</li>
            <li>Communicating counselling dates, interview schedules, and document scrutiny notices.</li>
            <li>Facilitating Bihar Student Credit Card (BSCC) education loan documentation upon request.</li>
          </ul>

          <h2 class="h5 fw-bold text-dark mb-3">4. Processing of Children and Minors' Data</h2>
          <p class="small text-muted mb-4">
            In compliance with Section 9 of the DPDP Act 2023, where a prospective applicant is below the age of 18 years, the submission of personal data must be accompanied by the knowledge and lawful consent of a parent or legal guardian. The Institute does not engage in behavioral tracking or targeted commercial profiling of minors.
          </p>

          <h2 class="h5 fw-bold text-dark mb-3">5. Data Retention and Security Safeguards</h2>
          <p class="small text-muted mb-4">
            Candidate application records are stored securely using industry-standard AES-256 encryption at rest and TLS 1.3 encryption in transit. Application records for admitted students become part of the permanent student academic registry. Unsuccessful candidate inquiry data is archived and purged after 24 months following the conclusion of the admissions cycle.
          </p>

          <h2 class="h5 fw-bold text-dark mb-3">6. Rights of Data Principals</h2>
          <p class="small text-muted mb-2">Under Sections 11, 12, and 13 of the DPDP Act 2023, you have the right to:</p>
          <ul class="small text-muted mb-4 ps-3">
            <li><strong>Right to Access:</strong> Request a summary of personal data held about you and processing activities.</li>
            <li><strong>Right to Correction &amp; Erasure:</strong> Correct inaccurate information or request deletion of data that is no longer required for statutory admissions records.</li>
            <li><strong>Right to Grievance Redressal:</strong> Register a data protection complaint with our institutional Grievance Redressal Officer.</li>
            <li><strong>Right to Nominate:</strong> Nominate an individual to exercise your data rights in the event of death or incapacity.</li>
          </ul>

          <h2 class="h5 fw-bold text-dark mb-3">7. Data Protection Grievance Officer</h2>
          <div class="p-3 bg-light rounded border small text-muted mb-4">
            <strong class="text-dark d-block mb-1">Nodal Grievance Redressal Officer:</strong>
            Registrar Desk, Kavya Shree Institute of Nursing<br>
            Punpun Station Road, Opp. Manglam Community Hall, PIN 804453, Bihar<br>
            Email: <a href="mailto:privacy@kavyashreenursing.edu.in" class="text-primary fw-bold">privacy&#64;kavyashreenursing.edu.in</a> &bull; Phone: +91 96616 66485
          </div>

          <div class="pt-3 border-top d-flex flex-wrap gap-3">
            <a routerLink="/terms" class="btn btn-outline-dark btn-sm">Terms of Use &rarr;</a>
            <a routerLink="/refund-policy" class="btn btn-outline-secondary btn-sm">Fee &amp; Refund Policy</a>
            <a routerLink="/apply" class="btn btn-warning btn-sm ms-auto fw-bold text-dark">Proceed to Online Application</a>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .page-hero-banner {
      background: linear-gradient(135deg, #0f2942 0%, #181818 100%);
      padding: 48px 0;
      border-bottom: 3px solid var(--color--carrot-orange, #eb9624);
    }
    .bg-stone { background-color: #f8fafc; }
    .max-w-650 { max-width: 650px; }
  `]
})
export class PrivacyComponent {}
