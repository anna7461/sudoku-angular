import { Component, Renderer2, signal, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AppHeaderComponent } from './components/app-header/app-header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, AppHeaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('sudoku-angular');

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    // Only add event listeners in browser environment
    if (isPlatformBrowser(this.platformId)) {
      // Prevent touch scrolling
      document.addEventListener('touchmove', (event: TouchEvent) => {
        event.preventDefault();
      }, { passive: false });
    }
  }
}
