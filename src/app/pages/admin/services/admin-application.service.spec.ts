import { TestBed } from '@angular/core/testing';
import { AdminApplicationService } from './admin-application.service';
import { AdminAuthService } from './admin-auth.service';

describe('AdminApplicationService', () => {
  let service: AdminApplicationService;
  let authServiceSpy: {
    getAuthorizedHeaders: ReturnType<typeof vi.fn>;
    buildFilterQueryString: ReturnType<typeof vi.fn>;
    request: ReturnType<typeof vi.fn>;
    downloadCsv: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    localStorage.clear();
    authServiceSpy = {
      getAuthorizedHeaders: vi.fn().mockReturnValue({ Authorization: 'Bearer test-token' }),
      buildFilterQueryString: vi.fn().mockReturnValue(''),
      request: vi.fn(),
      downloadCsv: vi.fn(),
      logout: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        AdminApplicationService,
        { provide: AdminAuthService, useValue: authServiceSpy }
      ]
    });
    service = TestBed.inject(AdminApplicationService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should retry /applications/admin if /admin/applications returns 404', async () => {
    authServiceSpy.request
      .mockRejectedValueOnce(new Error('API endpoint not found'))
      .mockResolvedValueOnce({
        success: true,
        data: {
          applications: [
            {
              id: 'app-1',
              applicationNumber: 'KSIN-2026-APP-1001',
              applicantName: 'Priya Kumari',
              status: 'submitted',
              createdAt: new Date().toISOString()
            }
          ],
          pagination: { total: 1, page: 1, limit: 10, pages: 1 }
        }
      });

    const res = await service.listApplications();
    expect(authServiceSpy.request).toHaveBeenCalledTimes(2);
    expect(res.applications.length).toBe(1);
    expect(res.applications[0].applicationNumber).toBe('KSIN-2026-APP-1001');
  });

  it('should gracefully return local/offline applications instead of throwing when remote returns 404 API endpoint not found', async () => {
    localStorage.setItem(
      'ks_nursing_applications_offline_queue',
      JSON.stringify([
        {
          applicationNumber: 'KSIN-2026-APP-OFFLINE1',
          createdAt: new Date().toISOString(),
          payload: {
            applicantName: 'Suman Devi',
            phone: '9876543210',
            program: 'General Nursing & Midwifery (GNM)',
            address: { district: 'Patna', state: 'Bihar', pincode: '800001' }
          }
        }
      ])
    );

    authServiceSpy.request.mockRejectedValue(new Error('API endpoint not found'));

    const res = await service.listApplications();
    expect(res.applications.length).toBe(1);
    expect(res.applications[0].applicantName).toBe('Suman Devi');
    expect(res.pagination.total).toBe(1);
  });
});
