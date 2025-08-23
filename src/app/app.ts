import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { HeaderComponent } from './sudoku/components/header/header.component';
import { HeaderService } from './sudoku/services/header.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('sudoku-angular');

  constructor(
    private router: Router,
    private headerService: HeaderService
  ) {}

  onOpenSettings(): void {
    // Get current route to determine source
    const currentRoute = this.router.url;
    let source = 'dashboard';
    
    if (currentRoute.includes('/sudoku')) {
      source = 'sudoku';
    } else if (currentRoute.includes('/arcade')) {
      source = 'arcade';
    }
    
    this.headerService.openSettings(source);
  }

  onOpenHelp(): void {
    // Get current route to determine source
    const currentRoute = this.router.url;
    let source = 'dashboard';
    
    if (currentRoute.includes('/sudoku')) {
      source = 'sudoku';
    } else if (currentRoute.includes('/arcade')) {
      source = 'arcade';
    }
    
    this.headerService.openHelp(source);
  }

  onTitleClick(): void {
    // Navigate to dashboard
    this.router.navigate(['/']);
  }
}
