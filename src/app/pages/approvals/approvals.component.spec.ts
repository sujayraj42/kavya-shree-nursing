import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ApprovalsComponent } from './approvals.component';
import { ContentService, ApprovalItem } from '../../core/services/content.service';
import { SeoService } from '../../core/services/seo.service';

describe('ApprovalsComponent', () => {
  let component: ApprovalsComponent;
  let fixture: ComponentFixture<ApprovalsComponent>;
  let mockContentService: { getApprovals: () => Promise<ApprovalItem[]> };
  let mockSeoService: { updateTags: () => void };

  const dummyApprovals: ApprovalItem[] = [
    {
      id: 'app-01',
      title: 'Statutory Regulatory Framework',
      subtitle: 'State Nursing Registration Council & Affiliation',
      content: 'Institutional operations adhere strictly to statutory curriculum requirements.',
      data: {
        authority: 'State Nursing Examination Council',
        status: 'Provisional Institutional Framework 2026',
        documentUrl: 'assets/documents/affiliation-provisional.pdf',
        documentType: 'PDF Document',
        noticeText: 'Official certificates on file.'
      }
    }
  ];

  beforeEach(async () => {
    mockContentService = {
      getApprovals: () => Promise.resolve(dummyApprovals)
    };
    mockSeoService = {
      updateTags: () => {}
    };

    await TestBed.configureTestingModule({
      imports: [ApprovalsComponent],
      providers: [
        provideRouter([]),
        { provide: ContentService, useValue: mockContentService },
        { provide: SeoService, useValue: mockSeoService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ApprovalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the approvals component', () => {
    expect(component).toBeTruthy();
  });

  it('should load approvals on init', async () => {
    await component.ngOnInit();
    expect((component as any).approvals().length).toBe(1);
    expect((component as any).approvals()[0].title).toBe('Statutory Regulatory Framework');
  });

  it('should view document details on viewDocument and close on closeDocument', () => {
    expect((component as any).selectedDoc()).toBeNull();

    (component as any).viewDocument(dummyApprovals[0]);
    expect((component as any).selectedDoc()).toEqual(dummyApprovals[0]);

    (component as any).closeDocument();
    expect((component as any).selectedDoc()).toBeNull();
  });
});

