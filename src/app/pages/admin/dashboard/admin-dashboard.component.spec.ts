import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { AdminEnquiryService } from '../services/admin-enquiry.service';
import { AdminAuthService } from '../services/admin-auth.service';

describe('AdminDashboardComponent', () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;
  let mockEnquiryService: {
    getDashboardData: ReturnType<typeof vi.fn>;
  };
  let mockAuthService: {
    currentUser: ReturnType<typeof vi.fn>;
  };

  const sampleDashboardData = {
    stats: {
      total: 10,
      new: 4,
      contacted: 2,
      in_review: 2,
      admitted: 1,
      closed: 1,
      archived: 0
    },
    recentEnquiries: [
      {
        id: '671e6245d8b7a12345678901',
        name: 'Pooja Kumari',
        phone: '9876543210',
        email: 'pooja@example.com',
        program: 'General Nursing & Midwifery (GNM)',
        status: 'new' as const,
        notes: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  };

  beforeEach(async () => {
    mockEnquiryService = {
      getDashboardData: vi.fn().mockResolvedValue(sampleDashboardData)
    };
    mockAuthService = {
      currentUser: vi.fn().mockReturnValue({ name: 'Admissions Officer' })
    };

    await TestBed.configureTestingModule({
      imports: [AdminDashboardComponent],
      providers: [
        provideRouter([]),
        { provide: AdminEnquiryService, useValue: mockEnquiryService },
        { provide: AdminAuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create the dashboard component and load data on init', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component).toBeTruthy();
    expect(mockEnquiryService.getDashboardData).toHaveBeenCalled();
    expect((component as any).stats()?.total).toBe(10);
    expect((component as any).recentEnquiries().length).toBe(1);
    expect((component as any).isLoading()).toBe(false);
  });

  it('should display error alert when dashboard data fails to load', async () => {
    mockEnquiryService.getDashboardData.mockRejectedValueOnce(new Error('Connection failure'));

    fixture.detectChanges();
    await fixture.whenStable();

    expect((component as any).errorMessage()).toContain('Connection failure');
    expect((component as any).isLoading()).toBe(false);
  });
});

