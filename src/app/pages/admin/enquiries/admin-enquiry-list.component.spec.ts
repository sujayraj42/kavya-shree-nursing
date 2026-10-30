import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { AdminEnquiryListComponent } from './admin-enquiry-list.component';
import { AdminEnquiryService } from '../services/admin-enquiry.service';

describe('AdminEnquiryListComponent', () => {
  let component: AdminEnquiryListComponent;
  let fixture: ComponentFixture<AdminEnquiryListComponent>;
  let mockEnquiryService: {
    listEnquiries: ReturnType<typeof vi.fn>;
  };

  const sampleEnquiryListResponse = {
    enquiries: [
      {
        id: '671e6245d8b7a12345678901',
        name: 'Ananya Sharma',
        phone: '9661666485',
        email: 'ananya@example.com',
        program: 'Bachelor of Science in Nursing (B.Sc.)',
        status: 'new' as const,
        notes: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    pagination: {
      total: 1,
      page: 1,
      limit: 10,
      pages: 1
    }
  };

  beforeEach(async () => {
    mockEnquiryService = {
      listEnquiries: vi.fn().mockResolvedValue(sampleEnquiryListResponse)
    };

    await TestBed.configureTestingModule({
      imports: [AdminEnquiryListComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: of(new Map([['status', 'new']]))
          }
        },
        { provide: AdminEnquiryService, useValue: mockEnquiryService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminEnquiryListComponent);
    component = fixture.componentInstance;
  });

  it('should create the enquiry list component and load records', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component).toBeTruthy();
    expect(mockEnquiryService.listEnquiries).toHaveBeenCalled();
    expect((component as any).enquiries().length).toBe(1);
    expect((component as any).enquiries()[0].name).toBe('Ananya Sharma');
    expect((component as any).isLoading()).toBe(false);
  });

  it('should filter enquiries on status change', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    (component as any).onStatusFilter('contacted');
    expect((component as any).selectedStatus()).toBe('contacted');
    expect((component as any).currentPage()).toBe(1);
    expect(mockEnquiryService.listEnquiries).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'contacted' })
    );
  });

  it('should filter enquiries on program change', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    (component as any).onProgramFilter('General Nursing & Midwifery (GNM)');
    expect((component as any).selectedProgram()).toBe('General Nursing & Midwifery (GNM)');
    expect(mockEnquiryService.listEnquiries).toHaveBeenCalledWith(
      expect.objectContaining({ program: 'General Nursing & Midwifery (GNM)' })
    );
  });

  it('should reset filters back to all defaults', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    (component as any).searchQuery.set('search test');
    (component as any).selectedStatus.set('closed');
    (component as any).selectedProgram.set('B.Sc.');

    (component as any).resetFilters();

    expect((component as any).searchQuery()).toBe('');
    expect((component as any).selectedStatus()).toBe('all');
    expect((component as any).selectedProgram()).toBe('all');
  });

  it('should display error message when request fails', async () => {
    mockEnquiryService.listEnquiries.mockRejectedValueOnce(new Error('Network error'));

    fixture.detectChanges();
    await fixture.whenStable();

    expect((component as any).errorMessage()).toContain('Network error');
    expect((component as any).isLoading()).toBe(false);
  });
});

