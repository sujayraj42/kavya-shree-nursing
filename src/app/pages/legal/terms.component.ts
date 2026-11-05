import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [RouterLink],
  template: `
    <!-- Hero Banner -->
    <section class="page-hero-banner text-white">
      <div class="container">
        <nav aria-label="Breadcrumb" class="mb-3">
          <ol class="breadcrumb breadcrumb-dark mb-0">
            <li class="breadcrumb-item"><a routerLink="/" class="breadcrumb-link">Home</a></li>
            <li class="breadcrumb-item active" aria-current="page">Terms of Use</li>
          </ol>
        </nav>
        <span class="badge bg-warning text-dark text-uppercase fw-bold mb-2">Legal Governance</span>
        <h1 class="h2 fw-bold text-white mb-2">Terms of Use &amp; Institutional Disclaimer</h1>
        <p class="text-white-50 mb-0 max-w-650">
          General terms, conditions of admission portal usage, intellectual property, and institutional disclaimers.
        </p>
      </div>
    </section>

    <!-- Main Content -->
    <section class="py-5 bg-stone">
      <div class="container" style="max-width: 900px;">
        <div class="card p-4 p-md-5 border-0 shadow-sm bg-white rounded-3">
          <div class="alert alert-light border small text-muted mb-4">
            <strong>Applicability:</strong> Academic Session 2026–2027 &bull; <strong>Jurisdiction:</strong> Courts of Competent Jurisdiction at Patna, Bihar, India &bull; <strong>Contact:</strong> admin&#64;kavyashreenursing.edu.in
          </div>

          <h2 class="h5 fw-bold text-dark mb-3">1. Acceptance of Terms</h2>
          <p class="small text-muted mb-4">
            By accessing, browsing, registering an enquiry, or submitting an online admission application on this website (kavyashreenursing.edu.in and associated domains), you explicitly acknowledge and agree to comply with these Terms of Use, the Privacy Policy, and all applicable statutory regulations of India.
          </p>

          <h2 class="h5 fw-bold text-dark mb-3">2. Admissions &amp; Regulatory Disclosures</h2>
          <p class="small text-muted mb-2">
            The Institute provides nursing education preparatory information, curriculum details, and application facilitation. All applicants and visitors acknowledge:
          </p>
          <ul class="small text-muted mb-4 ps-3">
            <li><strong>Provisional Application:</strong> Online submission of an application or enquiry does not constitute an offer or guarantee of admission.</li>
            <li><strong>Regulatory Adherence:</strong> Course offerings (including B.Sc. Nursing, GNM, and ANM) are subject to statutory affiliation and recognition notifications by the Indian Nursing Council (INC), Bihar Nursing Registration Council (BNRC), and affiliating State Health Universities. Applications for upcoming sessions are submitted and processed per council calendar guidelines.</li>
            <li><strong>Document Verification:</strong> Final seat allocation is contingent upon physical verification of original academic marksheets, caste/income certificates (where applicable), medical fitness certificates, and payment of approved statutory fees.</li>
            <li><strong>Bihar Student Credit Card (BSCC):</strong> While the Institute assists eligible admitted candidates with documentation for the BSCC scheme, sanction and disbursement remain at the sole discretion of the Bihar State Education Finance Corporation (BSEFC).</li>
          </ul>

          <h2 class="h5 fw-bold text-dark mb-3">3. Accuracy of Candidate Submissions</h2>
          <p class="small text-muted mb-4">
            Candidates and guardians are solely responsible for providing true, current, and complete details. Any falsification, concealment, or misrepresentation of academic qualifications or personal data discovered at any stage of admission or enrollment will result in immediate disqualification and forfeiture of submitted fees, alongside statutory reporting to regulatory bodies.
          </p>

          <h2 class="h5 fw-bold text-dark mb-3">4. Intellectual Property &amp; Permitted Use</h2>
          <p class="small text-muted mb-4">
            All text, photographs, graphic illustrations, institutional crests, and portal source code on this website are protected under Indian copyright, trademark, and intellectual property laws. Content may be downloaded or printed solely for personal, non-commercial admissions use. No part of this portal may be reproduced, mirrored, scraped, or modified without prior written authorization from the Institute Registrar.
          </p>

          <h2 class="h5 fw-bold text-dark mb-3">5. Disclaimer of Warranties &amp; Limitation of Liability</h2>
          <p class="small text-muted mb-4">
            While reasonable diligence is exercised to maintain current and error-free portal information, syllabus outlines, seat matrices, and fee schedules are subject to periodic update in accordance with statutory council guidelines. The Institute and its administrators shall not be liable for any indirect, incidental, or consequential damages resulting from portal downtime, technical transmission errors, or network interruptions.
          </p>

          <h2 class="h5 fw-bold text-dark mb-3">6. Governing Law &amp; Dispute Resolution</h2>
          <p class="small text-muted mb-4">
            These Terms shall be interpreted and enforced under the laws of the Republic of India. In the event of any legal dispute or claim arising from admission processes, portal interactions, or institutional policies, the courts situated in <strong>Patna, Bihar</strong> shall have exclusive territorial jurisdiction.
          </p>

          <div class="pt-3 border-top d-flex flex-wrap gap-3">
            <a routerLink="/privacy" class="btn btn-outline-dark btn-sm">&larr; Privacy Policy</a>
            <a routerLink="/refund-policy" class="btn btn-outline-secondary btn-sm">Fee &amp; Refund Policy</a>
            <a routerLink="/anti-ragging" class="btn btn-outline-danger btn-sm">Anti-Ragging Undertaking</a>
            <a routerLink="/apply" class="btn btn-warning btn-sm ms-auto fw-bold text-dark">Online Application</a>
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
    .breadcrumb-dark .breadcrumb-item + .breadcrumb-item::before {
      color: rgba(255, 255, 255, 0.4);
    }
    .breadcrumb-link {
      color: rgba(255, 255, 255, 0.7);
      text-decoration: none;
    }
    .breadcrumb-link:hover {
      color: #fff;
    }
    .max-w-650 {
      max-width: 650px;
    }
    .bg-stone {
      background-color: #f8fafc;
    }
  `]
})
export class TermsComponent {}
