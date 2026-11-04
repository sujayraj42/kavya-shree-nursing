import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentService, NoticeItem } from '../../core/services/content.service';
import { I18nService } from '../../core/services/i18n.service';

const DISMISS_KEY = 'ks_notice_bar_dismissed';

@Component({
  selector: 'app-notice-bar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './notice-bar.component.html',
  styleUrl: './notice-bar.component.css'
})
export class NoticeBarComponent implements OnInit {
  private readonly contentService = inject(ContentService);
  protected readonly i18n = inject(I18nService);

  protected readonly activeNotice = signal<NoticeItem | null>(null);
  protected readonly isDismissed = signal(false);

  public async ngOnInit(): Promise<void> {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      if (sessionStorage.getItem(DISMISS_KEY) === 'true') {
        this.isDismissed.set(true);
        return;
      }
    }

    try {
      const notices = await this.contentService.getNotices();
      const active = notices.find(n => n.data?.isNoticeBarActive);
      if (active) {
        this.activeNotice.set(active);
      }
    } catch {
      // Graceful fallback
    }
  }

  protected dismiss(): void {
    this.isDismissed.set(true);
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.setItem(DISMISS_KEY, 'true');
    }
  }
}
