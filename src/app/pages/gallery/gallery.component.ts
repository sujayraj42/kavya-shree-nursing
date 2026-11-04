import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentService, GalleryItem } from '../../core/services/content.service';
import { SeoService } from '../../core/services/seo.service';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.css'
})
export class GalleryComponent implements OnInit {
  private readonly contentService = inject(ContentService);
  private readonly seoService = inject(SeoService);
  protected readonly i18n = inject(I18nService);

  protected readonly items = signal<GalleryItem[]>([]);
  protected readonly activeCategory = signal<string>('All');
  protected readonly selectedItem = signal<GalleryItem | null>(null);

  protected readonly categories = ['All', 'Campus', 'Labs', 'Clinical', 'Classroom', 'Hostel'];

  public async ngOnInit(): Promise<void> {
    this.seoService.updateTags({
      title: 'Campus & Clinical Training Gallery | Kavya Shree Institute of Nursing',
      description: 'Explore campus infrastructure, nursing simulation laboratories, classrooms, and residential hostel facilities at Kavya Shree Institute.',
      keywords: 'nursing college campus bihar, skills laboratory photos, nursing hostel patna'
    });

    const data = await this.contentService.getGallery();
    this.items.set(data);
  }

  protected filteredItems(): GalleryItem[] {
    const cat = this.activeCategory();
    if (cat === 'All') return this.items();
    return this.items().filter(i => i.data.category === cat);
  }

  protected setCategory(cat: string): void {
    this.activeCategory.set(cat);
  }

  protected openLightbox(item: GalleryItem): void {
    this.selectedItem.set(item);
  }

  protected closeLightbox(): void {
    this.selectedItem.set(null);
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.selectedItem()) {
      this.closeLightbox();
    }
  }

  protected nextImage(): void {
    const current = this.selectedItem();
    if (!current) return;
    const list = this.filteredItems();
    const idx = list.findIndex(i => i.id === current.id);
    const nextIdx = (idx + 1) % list.length;
    this.selectedItem.set(list[nextIdx]);
  }

  protected prevImage(): void {
    const current = this.selectedItem();
    if (!current) return;
    const list = this.filteredItems();
    const idx = list.findIndex(i => i.id === current.id);
    const prevIdx = (idx - 1 + list.length) % list.length;
    this.selectedItem.set(list[prevIdx]);
  }
}
