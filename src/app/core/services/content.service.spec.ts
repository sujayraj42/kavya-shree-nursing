import { TestBed } from '@angular/core/testing';
import { ContentService } from './content.service';

describe('ContentService', () => {
  let service: ContentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ContentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return fallback courses when API is unavailable', async () => {
    const courses = await service.getCourses();
    expect(courses.length).toBeGreaterThanOrEqual(5);
    expect(courses.some(c => c.id === 'anm')).toBe(true);
    expect(courses.some(c => c.id === 'gnm')).toBe(true);
    expect(courses.some(c => c.id === 'bsc-nursing')).toBe(true);
  });

  it('should return single course by id', async () => {
    const bsc = await service.getCourseById('bsc-nursing');
    expect(bsc).toBeTruthy();
    expect(bsc?.title).toContain('Bachelor of Science in Nursing');
  });

  it('should return fallback gallery items', async () => {
    const gallery = await service.getGallery();
    expect(gallery.length).toBeGreaterThanOrEqual(1);
    expect(gallery[0].data.imageUrl).toContain('images/');
  });

  it('should return fallback notices', async () => {
    const notices = await service.getNotices();
    expect(notices.length).toBeGreaterThanOrEqual(1);
  });
});
