import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { AdminEnquiryDetailComponent } from './admin-enquiry-detail.component';
import { AdminEnquiryService } from '../services/admin-enquiry.service';

describe('AdminEnquiryDetailComponent', () => {
  let component: AdminEnquiryDetailComponent;
  let fixture: ComponentFixture<AdminEnquiryDetailComponent>;
  let mockEnquiryService: {
    getEnquiryById: ReturnType<typeof vi.fn>;
    updateStatus: ReturnType<typeof vi.fn>;
    addNote: ReturnType<typeof vi.fn>;
  };

  const sampleEnquiry = {
    id: '671e6245d8b7a12345678901',
    name: 'Ananya Sharma',
    phone: '9661666485',
    email: 'ananya@example.com',
    program: 'Bachelor of Science in Nursing (B.Sc.)',
    message: 'Need hostel accommodations for 2026.',
    consent: true,
    status: 'new' as const,
    notes: [
      {
        id: 'note-1',
        author: 'Institute Administrator',
        text: 'Initial review complete.',
        createdAt: new Date().toISOString()
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  beforeEach(async () => {
    mockEnquiryService = {
      getEnquiryById: vi.fn().mockResolvedValue(sampleEnquiry),
      updateStatus: vi.fn().mockResolvedValue({
        id: sampleEnquiry.id,
        status: 'contacted',
        updatedAt: new Date().toISOString()
      }),
      addNote: vi.fn().mockResolvedValue({
        id: 'note-2',
        author: 'Admissions Officer',
        text: 'Called candidate. Prospectus dispatched.',
        createdAt: new Date().toISOString()
      })
    };

    await TestBed.configureTestingModule({
      imports: [AdminEnquiryDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(new Map([['id', '671e6245d8b7a12345678901']]))
          }
        },
        { provide: AdminEnquiryService, useValue: mockEnquiryService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminEnquiryDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create the component and load enquiry details on init', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component).toBeTruthy();
    expect(mockEnquiryService.getEnquiryById).toHaveBeenCalledWith('671e6245d8b7a12345678901');
    expect((component as any).enquiry()?.name).toBe('Ananya Sharma');
    expect((component as any).selectedStatus()).toBe('new');
    expect((component as any).isLoading()).toBe(false);
  });

  it('should update status and reflect new status in the view', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    (component as any).selectedStatus.set('contacted');
    await (component as any).updateStatus();

    expect(mockEnquiryService.updateStatus).toHaveBeenCalledWith('671e6245d8b7a12345678901', 'contacted');
    expect((component as any).enquiry()?.status).toBe('contacted');
    expect((component as any).statusSuccessMessage()).toContain('Contacted');
  });

  it('should add internal note and append it to existing notes timeline', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    (component as any).newNoteText.set('Called candidate. Prospectus dispatched.');
    await (component as any).addInternalNote();

    expect(mockEnquiryService.addNote).toHaveBeenCalledWith(
      '671e6245d8b7a12345678901',
      'Called candidate. Prospectus dispatched.'
    );
    expect((component as any).enquiry()?.notes.length).toBe(2);
    expect((component as any).newNoteText()).toBe('');
  });

  it('should reject empty note submission', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    (component as any).newNoteText.set('   ');
    await (component as any).addInternalNote();

    expect(mockEnquiryService.addNote).not.toHaveBeenCalled();
    expect((component as any).noteErrorMessage()).toContain('enter a note');
  });
});

