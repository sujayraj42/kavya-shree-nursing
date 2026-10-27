import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-programs',
  imports: [RouterLink],
  templateUrl: './programs.component.html',
  styleUrl: './programs.component.css'
})
export class ProgramsComponent {
  protected readonly activeTab = signal<'all' | 'diploma' | 'degree' | 'pg'>('all');

  protected setTab(tab: 'all' | 'diploma' | 'degree' | 'pg'): void {
    this.activeTab.set(tab);
  }
}

