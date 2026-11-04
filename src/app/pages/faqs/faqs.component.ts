import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ContentService, FaqItem } from '../../core/services/content.service';
import { SeoService } from '../../core/services/seo.service';
import { ModalService } from '../../core/services/modal.service';

@Component({
  selector: 'app-faqs',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './faqs.component.html',
  styleUrl: './faqs.component.css'
})
export class FaqsComponent implements OnInit {
  private readonly contentService = inject(ContentService);
  private readonly seoService = inject(SeoService);
  protected readonly modalService = inject(ModalService);

  protected readonly faqs = signal<FaqItem[]>([]);
  protected readonly searchQuery = signal('');
  protected readonly openFaqId = signal<string | null>('faq-01');

  public async ngOnInit(): Promise<void> {
    this.seoService.updateTags({
      title: 'Frequently Asked Questions (FAQ) | Kavya Shree Institute of Nursing',
      description: 'Find clear answers to questions on admissions eligibility, nursing courses, documents, hostel, and clinical hospital rotations.',
      keywords: 'nursing admissions FAQ, GNM eligibility bihar, nursing college fees patna'
    });

    const data = await this.contentService.getFaqs();
    this.faqs.set(data);
  }

  protected filteredFaqs(): FaqItem[] {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.faqs();
    return this.faqs().filter(f =>
      f.title.toLowerCase().includes(q) || f.content.toLowerCase().includes(q)
    );
  }

  protected toggleFaq(id: string): void {
    if (this.openFaqId() === id) {
      this.openFaqId.set(null);
    } else {
      this.openFaqId.set(id);
    }
  }

  protected isOpen(id: string): boolean {
    return this.openFaqId() === id;
  }
}
