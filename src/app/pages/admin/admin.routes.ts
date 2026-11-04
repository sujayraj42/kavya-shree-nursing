import { Routes } from '@angular/router';
import { adminAuthGuard, adminGuestGuard } from './guards/admin-auth.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: 'login',
        canActivate: [adminGuestGuard],
        loadComponent: () => import('./login/admin-login.component').then(m => m.AdminLoginComponent),
        title: 'Admin Login | Kavya Shree Institute of Nursing'
      },
      {
        path: '',
        canActivate: [adminAuthGuard],
        loadComponent: () => import('./layout/admin-layout.component').then(m => m.AdminLayoutComponent),
        children: [
          {
            path: '',
            pathMatch: 'full',
            redirectTo: 'dashboard'
          },
          {
            path: 'dashboard',
            loadComponent: () => import('./dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
            title: 'Admin Dashboard | Kavya Shree Institute of Nursing'
          },
          {
            path: 'enquiries',
            loadComponent: () => import('./enquiries/admin-enquiry-list.component').then(m => m.AdminEnquiryListComponent),
            title: 'Admissions Enquiry Management | Kavya Shree Institute of Nursing'
          },
          {
            path: 'applications',
            loadComponent: () => import('./applications/admin-application-list.component').then(m => m.AdminApplicationListComponent),
            title: 'Online Applications Management | Kavya Shree Institute of Nursing'
          },
          {
            path: 'enquiries/:id',
            loadComponent: () => import('./enquiries/admin-enquiry-detail.component').then(m => m.AdminEnquiryDetailComponent),
            title: 'Candidate Dossier | Kavya Shree Institute of Nursing'
          }
        ]
      }
    ]
  }
];
