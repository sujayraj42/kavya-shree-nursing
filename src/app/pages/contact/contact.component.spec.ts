import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ContactComponent } from './contact.component';
import { EnquiryService } from '../../core/services/enquiry.service';

describe('ContactComponent', () => {
  let enquiryServiceSpy: { submitEnquiry: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    enquiryServiceSpy = {
      submitEnquiry: vi.fn().mockReturnValue(
        of({
          success: true,
          message: 'Enquiry registered successfully',
          data: {
            id: '671e6245d8b7a12345678901',
            program: 'General Nursing & Midwifery (GNM)',
            status: 'new',
            createdAt: new Date().toISOString()
          }
        })
      )
    };

    await TestBed.configureTestingModule({
      imports: [ContactComponent],
      providers: [
        provideRouter([]),
        { provide: EnquiryService, useValue: enquiryServiceSpy }
      ]
    }).compileComponents();
  });

  it('should create the contact component', () => {
    const fixture = TestBed.createComponent(ContactComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should validate form and reject empty submission', () => {
    const fixture = TestBed.createComponent(ContactComponent);
    const component = fixture.componentInstance;

    component['sendMessage']();
    expect(component['formValidationError']()).toBeTruthy();
    expect(component['nameError']()).toBeTruthy();
    expect(component['phoneError']()).toBeTruthy();
    expect(component['messageError']()).toBeTruthy();
    expect(component['isMessageSent']()).toBe(false);
    expect(enquiryServiceSpy.submitEnquiry).not.toHaveBeenCalled();
  });

  it('should validate and send message to EnquiryService when all required fields are filled', () => {
    const fixture = TestBed.createComponent(ContactComponent);
    const component = fixture.componentInstance;

    component['contactName'].set('Rahul Sharma');
    component['contactPhone'].set('9876543210');
    component['contactMessage'].set('Inquiring about ANM course syllabus and admission details.');

    component['sendMessage']();
    expect(enquiryServiceSpy.submitEnquiry).toHaveBeenCalled();
    expect(component['isMessageSent']()).toBe(true);
    expect(component['formValidationError']()).toBe('');
  });

  it('should reset contact form when resetContactForm is called', () => {
    const fixture = TestBed.createComponent(ContactComponent);
    const component = fixture.componentInstance;

    component['contactName'].set('Rahul Sharma');
    component['contactPhone'].set('9876543210');
    component['contactMessage'].set('Sample message');
    component['sendMessage']();
    expect(component['isMessageSent']()).toBe(true);

    component['resetContactForm']();
    expect(component['isMessageSent']()).toBe(false);
    expect(component['contactName']()).toBe('');
  });
});
