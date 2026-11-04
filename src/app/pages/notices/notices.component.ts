import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentService, NoticeItem } from '../../core/services/content.service';
import { SeoService } from '../../core/services/seo.service';
import { ModalService } from '../../core/services/modal.service';

@Component({
  selector: 'app-notices',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './notices.component.html',
  styleUrl: './notices.component.css'
})
export class NoticesComponent implements OnInit {
  private readonly contentService = inject(ContentService);
  private readonly seoService = inject(SeoService);
  protected readonly modalService = inject(ModalService);

  protected readonly notices = signal<NoticeItem[]>([]);
  protected readonly selectedNotice = signal<NoticeItem | null>(null);

  public async ngOnInit(): Promise<void> {
    this.seoService.updateTags({
      title: 'Notices & Announcements | Kavya Shree Institute of Nursing',
      description: 'Official academic notices, admission window dates, document verification schedules, and circulars for Session 2026.',
      keywords: 'nursing admission dates 2026, nursing college notices bihar, counseling schedule'
    });

    const data = await this.contentService.getNotices();
    this.notices.set(data);
  }

  protected selectNotice(notice: NoticeItem): void {
    this.selectedNotice.set(notice);
  }

  protected clearSelection(): void {
    this.selectedNotice.set(null);
  }
}

