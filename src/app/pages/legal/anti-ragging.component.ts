import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-anti-ragging',
  standalone: true,
  imports: [RouterLink],
  template: `
    <!-- Hero Banner -->
    <section class="page-hero-banner text-white">
      <div class="container">
        <nav aria-label="Breadcrumb" class="mb-3">
          <ol class="breadcrumb breadcrumb-dark mb-0">
            <li class="breadcrumb-item"><a routerLink="/" class="breadcrumb-link">Home</a></li>
            <li class="breadcrumb-item active" aria-current="page">Anti-Ragging</li>
          </ol>
        </nav>
        <h1 class="h2 fw-bold text-white mb-2">Statutory Anti-Ragging Framework &amp; Helpline</h1>
        <p class="text-white-50 mb-0 max-w-650">
          Strictly enforced pursuant to the Hon'ble Supreme Court of India directives, UGC Regulations 2009, and Indian Nursing Council guidelines.
        </p>
      </div>
    </section>

    <!-- Main Content -->
    <section class="py-5 bg-stone">
      <div class="container" style="max-width: 900px;">
        <div class="card p-4 p-md-5 border-0 shadow-sm bg-white rounded-3">

          <!-- 24x7 Helpline Alert -->
          <div class="alert alert-danger border-danger p-3 mb-4 rounded-3">
            <div class="d-flex align-items-center flex-wrap justify-content-between gap-3">
              <div>
                <strong class="h6 text-danger mb-1 d-block">National Anti-Ragging 24x7 Toll-Free Helpline:</strong>
                <span class="h4 fw-bold text-dark d-block">1800-180-5522</span>
                <span class="small text-muted">Email: <a href="mailto:helpline@antiragging.in" class="text-danger fw-bold">helpline&#64;antiragging.in</a> &bull; Web: <a href="https://www.antiragging.in" target="_blank" rel="noopener" class="text-danger">www.antiragging.in</a></span>
              </div>
              <div class="text-md-end">
                <span class="badge bg-danger px-3 py-2 text-uppercase">Toll Free 24x7</span>
              </div>
            </div>
          </div>

          <h2 class="h5 fw-bold text-dark mb-3">1. Zero Tolerance Mandate</h2>
          <p class="small text-muted mb-4">
            Kavya Shree Institute of Nursing maintains an uncompromising <strong>ZERO TOLERANCE POLICY</strong> towards ragging in all its forms. Ragging within the campus premises, clinical teaching hospitals, college transport, or off-campus hostels is strictly prohibited, classified as a cognizable criminal offence, and dealt with maximum penal severity under law.
          </p>

          <h2 class="h5 fw-bold text-dark mb-3">2. Legal Definition of Ragging</h2>
          <p class="small text-muted mb-2">Under UGC Regulations and Indian Penal Code provisions, ragging includes but is not limited to:</p>
          <ul class="small text-muted mb-4 ps-3">
            <li>Any conduct by a student (verbal, written, or electronic) teasing, treating, or handling rudely any fresh or junior student.</li>
            <li>Indulging in rowdy or undisciplined activities causing annoyance, hardship, or psychological harm to any student.</li>
            <li>Asking a student to do any act that causes shame, embarrassment, humiliation, or psychological trauma.</li>
            <li>Any act of financial extortion or forceful expenditure put on a student.</li>
            <li>Any physical abuse, assault, or forceful confinement.</li>
          </ul>

          <h2 class="h5 fw-bold text-dark mb-3">3. Institutional Anti-Ragging Committee (ARC)</h2>
          <div class="table-responsive mb-4">
            <table class="table table-bordered table-sm small text-muted align-middle">
              <thead class="table-light">
                <tr>
                  <th scope="col">Designation in ARC</th>
                  <th scope="col">Role / Representation</th>
                  <th scope="col">Contact</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="fw-bold text-dark">Chairman</td>
                  <td>Principal / Head of Institute</td>
                  <td>principal&#64;kavyashreenursing.edu.in</td>
                </tr>
                <tr>
                  <td class="fw-bold text-dark">Member Secretary</td>
                  <td>Vice Principal / Senior Faculty (Nursing)</td>
                  <td>viceprincipal&#64;kavyashreenursing.edu.in</td>
                </tr>
                <tr>
                  <td class="fw-bold text-dark">Civil Administration Representative</td>
                  <td>Local Police Station Officer-in-Charge</td>
                  <td>Punpun PS, Patna District</td>
                </tr>
                <tr>
                  <td class="fw-bold text-dark">Member (Hostel Administration)</td>
                  <td>Chief Warden (Girls &amp; Boys Hostel)</td>
                  <td>warden&#64;kavyashreenursing.edu.in</td>
                </tr>
                <tr>
                  <td class="fw-bold text-dark">Parent &amp; Student Representatives</td>
                  <td>Nominated PTA Members &amp; Student Council</td>
                  <td>Dean of Student Welfare</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 class="h5 fw-bold text-dark mb-3">4. Institutional Anti-Ragging Squad (ARS)</h2>
          <p class="small text-muted mb-4">
            An internal Vigilance and Anti-Ragging Squad conducts surprise inspections in hostels, canteen, clinical training wards, and recreational zones during day and night hours to ensure complete safety and peace of mind for newly enrolled students.
          </p>

          <h2 class="h5 fw-bold text-dark mb-3">5. Mandatory Undertaking by Student &amp; Parents</h2>
          <p class="small text-muted mb-4">
            Every candidate admitted to B.Sc. Nursing, GNM, or ANM, alongside their parent/guardian, must submit an anti-ragging affidavit/undertaking online at <strong>www.antiragging.in</strong> or <strong>www.amanmovement.org</strong> at the time of admission enrollment, and furnish the reference certificate to the Registrar desk.
          </p>

          <h2 class="h5 fw-bold text-dark mb-3">6. Internal Complaints Committee (ICC) / PoSH</h2>
          <p class="small text-muted mb-4">
            The Institute maintains an active <em>Internal Complaints Committee</em> pursuant to the Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013 (PoSH), safeguarding all female nursing candidates, faculty members, and clinical staff.
          </p>

          <div class="pt-3 border-top d-flex flex-wrap gap-3">
            <a routerLink="/privacy" class="btn btn-outline-dark btn-sm">Privacy Policy</a>
            <a routerLink="/terms" class="btn btn-outline-secondary btn-sm">Terms of Use</a>
            <a routerLink="/contact" class="btn btn-outline-primary btn-sm">Grievance Desk</a>
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
      border-bottom: 3px solid #dc3545;
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
export class AntiRaggingComponent {}
