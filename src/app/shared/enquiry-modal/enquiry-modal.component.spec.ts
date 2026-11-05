import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { EnquiryModalComponent } from './enquiry-modal.component';
import { ModalService } from '../../core/services/modal.service';
import { EnquiryService, EnquirySuccessResponse } from '../../core/services/enquiry.service';
import { I18nService } from '../../core/services/i18n.service';

describe('EnquiryModalComponent', () => {
  let component: EnquiryModalComponent;
  let fixture: ComponentFixture<EnquiryModalComponent>;
  let mockModalService: any;
  let mockEnquiryService: any;
  let mockI18nService: any;

  beforeEach(async () => {
    mockModalService = {
      isEnquiryModalOpen: () => true,
      selectedProgram: () => 'General Nursing & Midwifery (GNM)',
      closeEnquiryModal: vi.fn()
    };

    mockEnquiryService = {
      submitEnquiry: vi.fn()
    };

    mockI18nService = {
      currentLang: () => 'en',
      translate: (key: string) => (key === 'status.success' ? 'Enquiry Submitted! Ref: ' : 'An error occurred.')
    };

    await TestBed.configureTestingModule({
      imports: [EnquiryModalComponent],
      providers: [
        { provide: ModalService, useValue: mockModalService },
        { provide: EnquiryService, useValue: mockEnquiryService },
        { provide: I18nService, useValue: mockI18nService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EnquiryModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the enquiry modal component', () => {
    expect(component).toBeTruthy();
  });

  it('should close the modal when close() is called', () => {
    (component as any).close();
    expect(mockModalService.closeEnquiryModal).toHaveBeenCalled();
  });

  it('should reject submit if validation fails', async () => {
    (component as any).name.set('A'); // too short
    (component as any).phone.set('123'); // invalid phone
    await (component as any).onSubmit();

    expect((component as any).nameError()).toBeTruthy();
    expect((component as any).phoneError()).toBeTruthy();
    expect(mockEnquiryService.submitEnquiry).not.toHaveBeenCalled();
  });

  it('should submit enquiry successfully and update success state', async () => {
    const successRes: EnquirySuccessResponse = {
      success: true,
      message: 'Enquiry received',
      data: {
        id: '672000000000000000001234',
        program: 'General Nursing & Midwifery (GNM)',
        status: 'new',
        createdAt: new Date().toISOString()
      }
    };
    mockEnquiryService.submitEnquiry.mockReturnValue(of(successRes));

    (component as any).name.set('Pooja Kumari');
    (component as any).phone.set('9876543210');
    (component as any).email.set('pooja@example.com');
    (component as any).message.set('Need syllabus details');

    await (component as any).onSubmit();

    expect(mockEnquiryService.submitEnquiry).toHaveBeenCalled();
    expect((component as any).isSubmitting()).toBe(false);
    expect((component as any).referenceId()).toBe('001234');
    expect((component as any).successMessage()).toContain('001234');
    expect((component as any).name()).toBe('');
    expect((component as any).phone()).toBe('');
  });

  it('should extract error message from err.error.error on submission failure', async () => {
    mockEnquiryService.submitEnquiry.mockReturnValue(
      throwError(() => ({
        status: 409,
        error: { success: false, error: 'A recent enquiry with this phone number was already received.' }
      }))
    );

    (component as any).name.set('Pooja Kumari');
    (component as any).phone.set('9876543210');

    await (component as any).onSubmit();

    expect((component as any).isSubmitting()).toBe(false);
    expect((component as any).errorMessage()).toBe(
      'A recent enquiry with this phone number was already received.'
    );
  });
});

