import { TestBed } from '@angular/core/testing';
import { AdminApplicationService } from './admin-application.service';
import { AdminAuthService } from './admin-auth.service';

describe('AdminApplicationService', () => {
  let service: AdminApplicationService;
  let authServiceSpy: any;

  beforeEach(() => {
    authServiceSpy = {
      getAuthorizedHeaders: vi.fn().mockReturnValue({ Authorization: 'Bearer test-token' }),
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

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
