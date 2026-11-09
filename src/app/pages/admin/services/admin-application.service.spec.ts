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
    currentUser: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    localStorage.clear();
    authServiceSpy = {
      getAuthorizedHeaders: vi.fn().mockReturnValue({ Authorization: 'Bearer test-token' }),
      buildFilterQueryString: vi.fn().mockReturnValue(''),
      request: vi.fn(),
      downloadCsv: vi.fn(),
      logout: vi.fn(),
      currentUser: vi.fn().mockReturnValue({ name: 'Admissions Officer' })
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
      })
      .mockResolvedValueOnce({
        success: true,
        data: { enquiries: [] }
      });

    const res = await service.listApplications();
    expect(res.applications.length).toBe(1);
    expect(res.applications[0].applicationNumber).toBe('KSIN-2026-APP-1001');
  });

  it('should reconstruct applications from /admin/enquiries [ONLINE_APPLICATION] bridge when /admin/applications returns 404', async () => {
    authServiceSpy.request.mockImplementation((endpoint: string) => {
      if (endpoint.includes('/admin/enquiries')) {
        return Promise.resolve({
          success: true,
          data: {
            enquiries: [
              {
                id: '671e6245d8b7a12345678901',
                name: 'Anjali Verma',
                phone: '9876543210',
                email: 'anjali@example.com',
                program: 'Bachelor of Science in Nursing (B.Sc.)',
                message:
                  '[ONLINE_APPLICATION KSIN-2026-APP-486710] | Gender: Female | DOB: 2005-04-12 | Category: OBC | Father: Ramesh Verma | Mother: Sunita Devi | Street: Rampur | District: Patna | State: Bihar | PIN: 800001 | 10th: BSEB (2021) 82% | 12th: BSEB (2023) 76% | PCB: 74%',
                status: 'in_review',
                notes: [],
                createdAt: new Date().toISOString()
              }
            ]
          }
        });
      }
      return Promise.reject(new Error('API endpoint not found'));
    });

    const res = await service.listApplications();
    expect(res.applications.length).toBe(1);
    expect(res.applications[0].applicationNumber).toBe('KSIN-2026-APP-486710');
    expect(res.applications[0].applicantName).toBe('Anjali Verma');
    expect(res.applications[0].fatherName).toBe('Ramesh Verma');
    expect(res.applications[0].academicDetails.twelfthPercentage).toBe(76);
    expect(res.applications[0].academicDetails.pcbPercentage).toBe(74);
    expect(res.applications[0].status).toBe('under_review');
  });

  it('should gracefully return local/offline applications from both queue keys when remote returns 404 API endpoint not found', async () => {
    localStorage.setItem(
      'ks_offline_applications',
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

  it('should render printable receipt HTML immediately in openApplicationReceipt', () => {
    const mockDoc = {
      open: vi.fn(),
      write: vi.fn(),
      close: vi.fn()
    };
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => ({ document: mockDoc } as any));

    service.openApplicationReceipt({
      id: '1',
      applicationNumber: 'KSIN-2026-APP-486710',
      applicantName: 'Pooja Kumari',
      gender: 'Female',
      dob: '2005-01-15',
      fatherName: 'Rajesh Kumar',
      motherName: 'Meena Devi',
      phone: '9876543210',
      email: 'pooja@example.com',
      category: 'General',
      address: { district: 'Patna', state: 'Bihar', pincode: '800001' },
      program: 'General Nursing & Midwifery (GNM)',
      academicDetails: { tenthPercentage: 80, twelfthPercentage: 75, pcbPercentage: 72 },
      status: 'submitted',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    expect(openSpy).toHaveBeenCalledWith('', '_blank');
    expect(mockDoc.write).toHaveBeenCalledWith(expect.stringContaining('KSIN-2026-APP-486710'));
    expect(mockDoc.write).toHaveBeenCalledWith(expect.stringContaining('Pooja Kumari'));
    openSpy.mockRestore();
  });
});
