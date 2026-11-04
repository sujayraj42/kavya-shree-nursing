import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentService, FacultyItem, HospitalTieupItem } from '../../core/services/content.service';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-faculty',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './faculty.component.html',
  styleUrl: './faculty.component.css'
})
export class FacultyComponent implements OnInit {
  private readonly contentService = inject(ContentService);
  private readonly seoService = inject(SeoService);

  protected readonly facultyList = signal<FacultyItem[]>([]);
  protected readonly hospitalList = signal<HospitalTieupItem[]>([]);

  public async ngOnInit(): Promise<void> {
    this.seoService.updateTags({
      title: 'Nursing Faculty & Clinical Hospital Tie-ups | Kavya Shree Institute',
      description: 'Meet our academic faculty mentors and explore affiliated clinical training multi-specialty hospitals.',
      keywords: 'nursing faculty bihar, clinical hospital training nursing, nursing tutors patna'
    });

    const [faculty, hospitals] = await Promise.all([
      this.contentService.getFaculty(),
      this.contentService.getHospitalTieups()
    ]);

    this.facultyList.set(faculty);
    this.hospitalList.set(hospitals);
  }
}

