import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentService, DownloadItem } from '../../core/services/content.service';
import { SeoService } from '../../core/services/seo.service';
import { ModalService } from '../../core/services/modal.service';

@Component({
  selector: 'app-downloads',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './downloads.component.html',
  styleUrl: './downloads.component.css'
})
export class DownloadsComponent implements OnInit {
  private readonly contentService = inject(ContentService);
  private readonly seoService = inject(SeoService);
  protected readonly modalService = inject(ModalService);

  protected readonly downloads = signal<DownloadItem[]>([]);

  public async ngOnInit(): Promise<void> {
    this.seoService.updateTags({
      title: 'Prospectus & Admission Forms Download | Kavya Shree Institute',
      description: 'Download the official Academic Prospectus 2026, offline admission form, and course syllabus summaries.',
      keywords: 'nursing prospectus download bihar, admission form PDF nursing, syllabus PDF'
    });

    const data = await this.contentService.getDownloads();
    this.downloads.set(data);
  }
}
