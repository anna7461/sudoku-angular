import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { PauseService } from '../../sudoku/services/pause.service';
import { ThemeService, Theme } from '../../sudoku/services/theme.service';
import { filter } from 'rxjs/operators';
import { ScrollToTopService } from '../../services/scroll-to-top.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.scss']
})
export class AppHeaderComponent implements OnInit, OnDestroy {
  isSudokuPage = false;
  currentTheme!: Theme;
  showThemePopup = false;
  availableThemes: Theme[] = [];

  constructor(
    private router: Router,
    private pauseService: PauseService,
    private themeService: ThemeService,
    private scrollToTopService: ScrollToTopService
  ) {
    // Get all available themes
    this.availableThemes = this.themeService.getAllThemes();
    
    // Set initial theme
    this.currentTheme = this.themeService.getCurrentTheme();
    
    // Subscribe to theme changes
    this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
    });
  }

  ngOnInit() {
    // Check current route and subscribe to route changes
    this.checkCurrentRoute();
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkCurrentRoute();
      // Scroll to top on route changes
      this.scrollToTopService.scrollToTop();
    });
  }

  ngOnDestroy() {
    // Cleanup handled by async pipe
  }

  private checkCurrentRoute() {
    this.isSudokuPage = this.router.url === '/sudoku';
  }

  onSudokuTitleClick() {
    // Scroll to top before navigating to dashboard
    this.scrollToTopService.scrollToTopInstant();
    this.router.navigate(['/']);
  }

  onPauseClick() {
    this.pauseService.pauseGame();
  }

  onThemeToggleClick() {
    this.showThemePopup = !this.showThemePopup;
  }

  onThemeSelect(theme: Theme) {
    this.themeService.setTheme(theme);
    this.showThemePopup = false;
  }

  onCloseThemePopup() {
    this.showThemePopup = false;
  }
}
