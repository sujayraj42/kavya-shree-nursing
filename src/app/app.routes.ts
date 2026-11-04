import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
    title: 'Home | Kavya Shree Institute of Nursing'
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about.component').then(m => m.AboutComponent),
    title: 'About Us | Kavya Shree Institute of Nursing'
  },
  {
    path: 'programs',
    loadComponent: () => import('./pages/programs/programs.component').then(m => m.ProgramsComponent),
    title: 'Academic Programs | Kavya Shree Institute of Nursing'
  },
  {
    path: 'programs/:id',
    loadComponent: () => import('./pages/programs/course-detail/course-detail.component').then(m => m.CourseDetailComponent),
    title: 'Program Details | Kavya Shree Institute of Nursing'
  },
  {
    path: 'admissions',
    loadComponent: () => import('./pages/admissions/admissions.component').then(m => m.AdmissionsComponent),
    title: 'Admissions & Consultation | Kavya Shree Institute of Nursing'
  },
  {
    path: 'apply',
    loadComponent: () => import('./pages/apply/apply.component').then(m => m.ApplyComponent),
    title: 'Online Application 2026 | Kavya Shree Institute of Nursing'
  },
  {
    path: 'approvals',
    loadComponent: () => import('./pages/approvals/approvals.component').then(m => m.ApprovalsComponent),
    title: 'Approvals & Recognitions | Kavya Shree Institute of Nursing'
  },
  {
    path: 'gallery',
    loadComponent: () => import('./pages/gallery/gallery.component').then(m => m.GalleryComponent),
    title: 'Campus & Clinical Gallery | Kavya Shree Institute of Nursing'
  },
  {
    path: 'faculty',
    loadComponent: () => import('./pages/faculty/faculty.component').then(m => m.FacultyComponent),
    title: 'Faculty & Hospital Affiliations | Kavya Shree Institute of Nursing'
  },
  {
    path: 'faqs',
    loadComponent: () => import('./pages/faqs/faqs.component').then(m => m.FaqsComponent),
    title: 'Frequently Asked Questions | Kavya Shree Institute of Nursing'
  },
  {
    path: 'notices',
    loadComponent: () => import('./pages/notices/notices.component').then(m => m.NoticesComponent),
    title: 'Notices & Announcements | Kavya Shree Institute of Nursing'
  },
  {
    path: 'downloads',
    loadComponent: () => import('./pages/downloads/downloads.component').then(m => m.DownloadsComponent),
    title: 'Prospectus & Downloads | Kavya Shree Institute of Nursing'
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact.component').then(m => m.ContactComponent),
    title: 'Contact Admissions Desk | Kavya Shree Institute of Nursing'
  },
  {
    path: 'admin',
    loadChildren: () => import('./pages/admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent),
    title: 'Page Not Found | Kavya Shree Institute of Nursing'
  }
];
