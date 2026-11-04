import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ContentService, CourseItem } from '../../../core/services/content.service';
import { ModalService } from '../../../core/services/modal.service';
import { I18nService } from '../../../core/services/i18n.service';
import { SeoService } from '../../../core/services/seo.service';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './course-detail.component.html',
  styleUrl: './course-detail.component.css'
})
export class CourseDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly contentService = inject(ContentService);
  protected readonly modalService = inject(ModalService);
  protected readonly i18n = inject(I18nService);
  private readonly seoService = inject(SeoService);

  protected readonly course = signal<CourseItem | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly activeTab = signal<'syllabus' | 'careers' | 'eligibility'>('syllabus');

  public async ngOnInit(): Promise<void> {
    this.route.paramMap.subscribe(async (params) => {
      const id = params.get('id');
      if (id) {
        this.isLoading.set(true);
        const data = await this.contentService.getCourseById(id);
        this.course.set(data);
        this.isLoading.set(false);
        if (data) {
          this.seoService.updateTags({
            title: `${data.title} | Kavya Shree Institute of Nursing`,
            description: `${data.content.slice(0, 155)}...`,
            keywords: `${data.title}, nursing course bihar, GNM ANM B.Sc admissions 2026`
          });
        }
      }
    });
  }

  protected setTab(tab: 'syllabus' | 'careers' | 'eligibility'): void {
    this.activeTab.set(tab);
  }

  protected openEnquiry(): void {
    const title = this.course()?.title || 'Nursing Program';
    this.modalService.openEnquiryModal(title);
  }
}
