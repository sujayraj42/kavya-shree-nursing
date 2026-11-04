import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentService, ApprovalItem } from '../../core/services/content.service';
import { SeoService } from '../../core/services/seo.service';
import { ModalService } from '../../core/services/modal.service';

@Component({
  selector: 'app-approvals',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './approvals.component.html',
  styleUrl: './approvals.component.css'
})
export class ApprovalsComponent implements OnInit {
  private readonly contentService = inject(ContentService);
  private readonly seoService = inject(SeoService);
  protected readonly modalService = inject(ModalService);

  protected readonly approvals = signal<ApprovalItem[]>([]);
  protected readonly selectedDoc = signal<ApprovalItem | null>(null);

  public async ngOnInit(): Promise<void> {
    this.seoService.updateTags({
      title: 'Approvals & Affiliations | Kavya Shree Institute of Nursing',
      description: 'Official statutory affiliations, nursing examination council framework, and curriculum compliance documentation.',
      keywords: 'nursing council affiliation bihar, INC approval status, nursing college recognition'
    });

    const data = await this.contentService.getApprovals();
    this.approvals.set(data);
  }

  protected viewDocument(item: ApprovalItem): void {
    this.selectedDoc.set(item);
  }

  protected closeDocument(): void {
    this.selectedDoc.set(null);
  }
}
