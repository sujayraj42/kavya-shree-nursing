import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  public readonly isEnquiryModalOpen = signal(false);
  public readonly selectedProgram = signal<string>('General Nursing & Midwifery (GNM)');
  public readonly preselectedProgram = this.selectedProgram;

  public openEnquiryModal(program?: string): void {
    if (program) {
      this.selectedProgram.set(program);
    }
    this.isEnquiryModalOpen.set(true);
    if (typeof document !== 'undefined') {
      document.body.classList.add('modal-open');
    }
  }

  public closeEnquiryModal(): void {
    this.isEnquiryModalOpen.set(false);
    if (typeof document !== 'undefined') {
      document.body.classList.remove('modal-open');
    }
  }
}
