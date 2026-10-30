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
    path: 'admissions',
    loadComponent: () => import('./pages/admissions/admissions.component').then(m => m.AdmissionsComponent),
    title: 'Admissions & Consultation | Kavya Shree Institute of Nursing'
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
