import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-refund-policy',
  standalone: true,
  imports: [RouterLink],
  template: `
    <!-- Hero Banner -->
    <section class="page-hero-banner text-white">
      <div class="container">
        <nav aria-label="Breadcrumb" class="mb-3">
          <ol class="breadcrumb breadcrumb-dark mb-0">
            <li class="breadcrumb-item"><a routerLink="/" class="breadcrumb-link">Home</a></li>
            <li class="breadcrumb-item active" aria-current="page">Fee &amp; Refund Policy</li>
          </ol>
        </nav>
        <h1 class="h2 fw-bold text-white mb-2">Institutional Fee &amp; Refund Policy</h1>
        <p class="text-white-50 mb-0 max-w-650">
          Transparent guidelines governing tuition fees, admission cancellation, seat withdrawal, and statutory refund schedules.
        </p>
      </div>
    </section>

    <!-- Main Content -->
    <section class="py-5 bg-stone">
      <div class="container" style="max-width: 900px;">
        <div class="card p-4 p-md-5 border-0 shadow-sm bg-white rounded-3">
          <div class="alert alert-light border small text-muted mb-4">
            <strong>Reference:</strong> Statutory Guidelines on Remittance &amp; Refund of Fees &bull; <strong>Session:</strong> 2026–2027 &bull; <strong>Accounts Contact:</strong> accounts&#64;kavyashreenursing.edu.in
          </div>

          <h2 class="h5 fw-bold text-dark mb-3">1. Policy Objective &amp; Framework</h2>
          <p class="small text-muted mb-4">
            Kavya Shree Institute of Nursing adheres to principles of financial transparency, fairness, and accountability. This policy delineates the procedures and timelines governing the collection of academic fees, seat withdrawal, and fee refunds for students admitted to B.Sc. Nursing, GNM, and ANM programs.
          </p>

          <h2 class="h5 fw-bold text-dark mb-3">2. Components of Institutional Fees</h2>
          <div class="table-responsive mb-4">
            <table class="table table-bordered table-sm small text-muted align-middle">
              <thead class="table-light">
                <tr>
                  <th scope="col" style="width: 25%;">Fee Component</th>
                  <th scope="col" style="width: 25%;">Refundability</th>
                  <th scope="col">Description &amp; Terms</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="fw-bold text-dark">Application / Registration Fee</td>
                  <td><span class="badge bg-secondary">Non-Refundable</span></td>
                  <td>One-time administrative processing fee charged during online or offline application submission.</td>
                </tr>
                <tr>
                  <td class="fw-bold text-dark">Tuition Fee</td>
                  <td><span class="badge bg-success">Conditionally Refundable</span></td>
                  <td>Annual academic instruction fee; refundable strictly according to the statutory withdrawal schedule in Section 3.</td>
                </tr>
                <tr>
                  <td class="fw-bold text-dark">Caution / Security Deposit</td>
                  <td><span class="badge bg-primary">100% Refundable</span></td>
                  <td>Refundable in full after completion of course or lawful clearance, subject to institutional 'No Dues' certification.</td>
                </tr>
                <tr>
                  <td class="fw-bold text-dark">Hostel &amp; Mess Advance</td>
                  <td><span class="badge bg-success">Pro-Rata Refundable</span></td>
                  <td>Unutilized monthly mess advance is refundable upon formal surrender of accommodation with 15 days written notice.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 class="h5 fw-bold text-dark mb-3">3. Withdrawal Timeline &amp; Refund Percentage</h2>
          <p class="small text-muted mb-2">
            If a student officially withdraws from a program, the percentage of tuition and institutional fees refunded is calculated relative to the formally notified last date of admission:
          </p>
          <div class="table-responsive mb-4">
            <table class="table table-bordered table-sm small text-muted align-middle">
              <thead class="table-light">
                <tr>
                  <th scope="col" style="width: 40%;">Notice of Withdrawal Received</th>
                  <th scope="col" style="width: 25%;">Refund Percentage</th>
                  <th scope="col">Deduction / Administrative Charges</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>15 days or more before formally notified last date of admission</td>
                  <td class="fw-bold text-success">100% of Tuition Fees</td>
                  <td>Nominal processing charge not exceeding ₹1,000/-</td>
                </tr>
                <tr>
                  <td>Less than 15 days before formally notified last date of admission</td>
                  <td class="fw-bold text-primary">90% of Tuition Fees</td>
                  <td>10% administrative retention</td>
                </tr>
                <tr>
                  <td>Less than 15 days after formally notified last date of admission</td>
                  <td class="fw-bold text-warning text-dark">80% of Tuition Fees</td>
                  <td>20% retention</td>
                </tr>
                <tr>
                  <td>Between 16 and 30 days after formally notified last date of admission</td>
                  <td class="fw-bold text-warning text-dark">50% of Tuition Fees</td>
                  <td>50% retention</td>
                </tr>
                <tr>
                  <td>More than 30 days after formally notified last date of admission</td>
                  <td class="fw-bold text-danger">0% (Nil)</td>
                  <td>No refund of tuition fees (security deposit returned upon clearance)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 class="h5 fw-bold text-dark mb-3">4. Procedure for Requesting Fee Refund</h2>
          <ol class="small text-muted mb-4 ps-3">
            <li class="mb-2"><strong>Formal Written Application:</strong> The student or parent must submit a written letter signed by both student and guardian to the Office of the Registrar, stating the valid reason for withdrawal alongside original fee receipts.</li>
            <li class="mb-2"><strong>Departmental No Dues:</strong> Clearances must be obtained from Library, Nursing Skills Laboratory, Hostel Warden, and Accounts Section.</li>
            <li class="mb-2"><strong>Electronic Remittance:</strong> Approved refunds are credited directly into the student's or guardian's verified bank account via NEFT/RTGS within <strong>15 to 30 working days</strong> from the receipt of complete clearance. No cash refunds are disbursed.</li>
          </ol>

          <h2 class="h5 fw-bold text-dark mb-3">5. Bihar Student Credit Card (BSCC) Remittances</h2>
          <p class="small text-muted mb-4">
            For candidates funded via the Bihar Student Credit Card Scheme, any excess or returnable balance shall be remitted directly back to the lending authority (BSEFC / designated bank) in compliance with government directives, rather than handed to the individual applicant.
          </p>

          <div class="pt-3 border-top d-flex flex-wrap gap-3">
            <a routerLink="/terms" class="btn btn-outline-dark btn-sm">&larr; Terms of Use</a>
            <a routerLink="/privacy" class="btn btn-outline-secondary btn-sm">Privacy Policy</a>
            <a routerLink="/anti-ragging" class="btn btn-outline-danger btn-sm">Anti-Ragging Policy</a>
            <a routerLink="/apply" class="btn btn-warning btn-sm ms-auto fw-bold text-dark">Admissions Portal</a>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .page-hero-banner {
      background-color: #0f2942;
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
export class RefundPolicyComponent {}
