import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import {
  FALLBACK_COURSES,
  FALLBACK_NOTICES,
  FALLBACK_GALLERY,
  FALLBACK_FACULTY
} from '../data/fallback-content';

export interface NoticeItem {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  data?: {
    lastDate?: string;
    isNoticeBarActive?: boolean;
    bannerText?: string;
    badge?: string;
    priority?: string;
  };
  createdAt?: string;
}

export interface CourseItem {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  data: {
    code: string;
    duration: string;
    level: string;
    eligibility: string;
    seats: string;
    fees: string;
    careerOptions: string[];
    syllabus: string[];
  };
}

export interface GalleryItem {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  data: {
    category: string;
    imageUrl: string;
    thumbnailUrl: string;
    alt: string;
  };
}

export interface ApprovalItem {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  data: {
    authority: string;
    status: string;
    documentUrl?: string;
    documentType?: string;
    noticeText?: string;
  };
}

export interface FacultyItem {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  data: {
    role: string;
    qualification: string;
    imageUrl?: string;
    isPlaceholder?: boolean;
    notice?: string;
  };
}

export interface HospitalTieupItem {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  data: {
    location: string;
    bedCapacity: string;
    specialties: string[];
  };
}

export interface FaqItem {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  data: {
    category: string;
    order?: number;
  };
}

export interface DownloadItem {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  data: {
    fileType: string;
    fileSize: string;
    downloadUrl: string;
    category?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ContentService {
  private readonly baseUrl = environment.apiBaseUrl;

  public async getNotices(): Promise<NoticeItem[]> {
    const data = await this.fetchContent<NoticeItem[]>('/content/notices', FALLBACK_NOTICES);
    return data && data.length > 0 ? data : FALLBACK_NOTICES;
  }

  public async getCourses(): Promise<CourseItem[]> {
    const data = await this.fetchContent<CourseItem[]>('/content/courses', FALLBACK_COURSES);
    return data && data.length > 0 ? data : FALLBACK_COURSES;
  }

  public async getCourseById(id: string): Promise<CourseItem | null> {
    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), 4000) : null;
      const res = await fetch(`${this.baseUrl}/content/courses/${id}`, {
        signal: controller?.signal
      });
      if (timeoutId) clearTimeout(timeoutId);
      if (res.ok) {
        const json = await res.json();
        if (json.data) return json.data;
      }
    } catch {
      // Fallback
    }
    return FALLBACK_COURSES.find(c => c.id === id) || null;
  }

  public async getApprovals(): Promise<ApprovalItem[]> {
    return this.fetchContent<ApprovalItem[]>('/content/approvals', []);
  }

  public async getFaculty(): Promise<FacultyItem[]> {
    const data = await this.fetchContent<FacultyItem[]>('/content/faculty', FALLBACK_FACULTY);
    return data && data.length > 0 ? data : FALLBACK_FACULTY;
  }

  public async getHospitalTieups(): Promise<HospitalTieupItem[]> {
    return this.fetchContent<HospitalTieupItem[]>('/content/hospital-tieups', []);
  }

  public async getGallery(): Promise<GalleryItem[]> {
    const data = await this.fetchContent<GalleryItem[]>('/content/gallery', FALLBACK_GALLERY);
    return data && data.length > 0 ? data : FALLBACK_GALLERY;
  }

  public async getFaqs(): Promise<FaqItem[]> {
    return this.fetchContent<FaqItem[]>('/content/faqs', []);
  }

  public async getDownloads(): Promise<DownloadItem[]> {
    return this.fetchContent<DownloadItem[]>('/content/downloads', []);
  }

  private async fetchContent<T>(endpoint: string, fallback: T): Promise<T> {
    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), 4000) : null;
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        signal: controller?.signal
      });
      if (timeoutId) clearTimeout(timeoutId);
      if (!res.ok) return fallback;
      const json = await res.json();
      return (json.data as T) || fallback;
    } catch {
      return fallback;
    }
  }
}
