import { Component, HostListener, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Kavya Shree Institute of Nursing');

  @HostListener('document:click', ['$event'])
  protected keepFragmentTargetVisible(event: MouseEvent): void {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const link = target.closest<HTMLAnchorElement>('a[href*="#"]');
    const fragment = link ? new URL(link.href, window.location.href).hash.slice(1) : '';
    if (!fragment) {
      return;
    }

    window.setTimeout(() => this.scrollFragmentBelowHeader(fragment), 100);
  }

  private scrollFragmentBelowHeader(fragment: string): void {
    const section = document.getElementById(fragment);
    if (!section) {
      return;
    }

    const headerHeight = document.querySelector<HTMLElement>('.ks-site-header')?.offsetHeight ?? 0;
    const top = section.getBoundingClientRect().top + window.scrollY - headerHeight - 16;
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

    window.scrollTo({ top: Math.max(0, top), behavior });
  }
}
