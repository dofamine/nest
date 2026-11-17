import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly darkTheme = signal(true);
  readonly dark = this.darkTheme.asReadonly();

  constructor(@Inject(DOCUMENT) private readonly document: Document) {
    let dark = true;
    try {
      dark =
        this.document.defaultView?.localStorage.getItem('portal-theme') !==
        'light';
    } catch {
      // Keep the default when browser storage is unavailable.
    }
    this.applyTheme(dark);
  }

  toggleTheme(): void {
    this.applyTheme(!this.dark());
    try {
      this.document.defaultView?.localStorage.setItem(
        'portal-theme',
        this.dark() ? 'dark' : 'light',
      );
    } catch {
      // Switching themes still works when browser storage is unavailable.
    }
  }

  private applyTheme(dark: boolean): void {
    this.darkTheme.set(dark);
    this.document.documentElement.classList.toggle('portal-dark', dark);
  }
}
