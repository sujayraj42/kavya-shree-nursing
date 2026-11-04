import { TestBed } from '@angular/core/testing';
import { ModalService } from './modal.service';

describe('ModalService', () => {
  let service: ModalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ModalService);
    service.closeEnquiryModal();
  });

  it('should be created with modal closed by default', () => {
    expect(service).toBeTruthy();
    expect(service.isEnquiryModalOpen()).toBe(false);
  });

  it('should open modal with optional course preselection', () => {
    service.openEnquiryModal('B.Sc. Nursing');
    expect(service.isEnquiryModalOpen()).toBe(true);
    expect(service.preselectedProgram()).toBe('B.Sc. Nursing');
  });

  it('should close modal and preserve selection', () => {
    service.openEnquiryModal('ANM');
    service.closeEnquiryModal();
    expect(service.isEnquiryModalOpen()).toBe(false);
    expect(service.selectedProgram()).toBe('ANM');
  });
});
