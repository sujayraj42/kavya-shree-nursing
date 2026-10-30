export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'superadmin';
  lastLoginAt?: string | null;
}

export interface AdminLoginResponse {
  success: boolean;
  message: string;
  token: string;
  admin: AdminUser;
}

export interface AdminEnquiryNote {
  id: string;
  author: string;
  text: string;
  createdAt: string;
  updatedAt?: string;
}

export type EnquiryStatus = 'new' | 'contacted' | 'in_review' | 'admitted' | 'closed' | 'archived';

export const VALID_ENQUIRY_STATUSES: EnquiryStatus[] = [
  'new',
  'contacted',
  'in_review',
  'admitted',
  'closed',
  'archived'
];

export const ADVERTISED_PROGRAMS: string[] = [
  'Auxiliary Nursing & Midwifery (ANM)',
  'General Nursing & Midwifery (GNM)',
  'Bachelor of Science in Nursing (B.Sc.)',
  'Post Basic B.Sc. Nursing',
  'Master of Science in Nursing (M.Sc.)'
];

export const ENQUIRY_STATUS_LABELS: Record<EnquiryStatus, string> = {
  new: 'New Submission',
  contacted: 'Contacted',
  in_review: 'In Review',
  admitted: 'Admitted',
  closed: 'Closed',
  archived: 'Archived'
};

export const ENQUIRY_STATUS_BADGE_CLASS: Record<EnquiryStatus, string> = {
  new: 'badge bg-primary',
  contacted: 'badge bg-info text-dark',
  in_review: 'badge bg-warning text-dark',
  admitted: 'badge bg-success',
  closed: 'badge bg-secondary',
  archived: 'badge bg-dark'
};

export function getEnquiryBadgeClass(status: string): string {
  return ENQUIRY_STATUS_BADGE_CLASS[status as EnquiryStatus] || 'badge bg-secondary';
}

export function getEnquiryStatusLabel(status: string): string {
  return ENQUIRY_STATUS_LABELS[status as EnquiryStatus] || status;
}

export interface AdminEnquiry {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  program: string;
  message?: string;
  consent: boolean;
  status: EnquiryStatus;
  notes: AdminEnquiryNote[];
  createdAt: string;
  updatedAt: string;
}

export interface EnquiryPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface EnquiryListResponse {
  success: boolean;
  data: {
    enquiries: AdminEnquiry[];
    pagination: EnquiryPagination;
  };
}

export interface EnquiryDetailResponse {
  success: boolean;
  data: AdminEnquiry;
}

export interface EnquiryStatusUpdateResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    status: EnquiryStatus;
    updatedAt: string;
  };
}

export interface EnquiryNoteAddResponse {
  success: boolean;
  message: string;
  data: AdminEnquiryNote;
}

export interface DashboardStats {
  total: number;
  new: number;
  contacted: number;
  in_review: number;
  admitted: number;
  closed: number;
  archived: number;
}

/**
 * Formats ISO timestamps using native browser Intl API.
 * Avoids bundling heavy Angular locale tables into the root bundle.
 */
export function formatAdminDate(isoString: string | undefined | null, includeTime = false): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    if (includeTime) {
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return isoString;
  }
}

export function formatRefId(id: string | undefined | null): string {
  if (!id) return '';
  return id.slice(-6);
}
