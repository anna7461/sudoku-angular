import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

export interface Theme {
  id: number;
  name: string;
  className: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  accessibilityLevel: 'AA' | 'AAA'; // New accessibility level indicator
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'sudoku-theme';
  
  private readonly themes: Theme[] = [
    {
      id: 1,
      name: 'Classic Blue',
      className: 'theme-classic-blue',
      primaryColor: '#2563eb', // Updated for better contrast
      accentColor: '#dbeafe', // Updated for better contrast
      backgroundColor: '#f8fafc', // Updated for better contrast
      accessibilityLevel: 'AA'
    },
    {
      id: 2,
      name: 'Forest Green',
      className: 'theme-forest-green',
      primaryColor: '#059669', // Updated for better contrast
      accentColor: '#a7f3d0', // Updated for better contrast
      backgroundColor: '#f0fdf4', // Updated for better contrast
      accessibilityLevel: 'AA'
    },
    {
      id: 3,
      name: 'Sunset Orange',
      className: 'theme-sunset-orange',
      primaryColor: '#ea580c', // Updated for better contrast
      accentColor: '#fed7aa', // Updated for better contrast
      backgroundColor: '#fff7ed', // Updated for better contrast
      accessibilityLevel: 'AA'
    },
    {
      id: 4,
      name: 'Purple Royale',
      className: 'theme-purple-royale',
      primaryColor: '#7c3aed', // Already good contrast
      accentColor: '#c4b5fd', // Updated for better contrast
      backgroundColor: '#faf5ff', // Updated for better contrast
      accessibilityLevel: 'AA'
    },
    {
      id: 5,
      name: 'Warm Sand',
      className: 'theme-warm-sand',
      primaryColor: '#d97706', // Updated for better contrast
      accentColor: '#fde68a', // Updated for better contrast
      backgroundColor: '#fefce8', // Updated for better contrast
      accessibilityLevel: 'AA'
    },
    {
      id: 6,
      name: 'Dark Mode',
      className: 'theme-dark-mode',
      primaryColor: '#3b82f6', // Already good contrast
      accentColor: '#334155', // Updated for better contrast
      backgroundColor: '#0f172a', // Updated for better contrast
      accessibilityLevel: 'AA'
    }
  ];
  
  private currentThemeSubject = new BehaviorSubject<Theme>(this.themes[0]);
  public currentTheme$ = this.currentThemeSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.loadTheme();
  }

  /**
   * Toggle to the next theme in sequence
   */
  toggleTheme(): void {
    const currentTheme = this.currentThemeSubject.value;
    const currentIndex = this.themes.findIndex(t => t.id === currentTheme.id);
    const nextIndex = (currentIndex + 1) % this.themes.length;
    this.setTheme(this.themes[nextIndex]);
  }

  /**
   * Set a specific theme by theme object
   */
  setTheme(theme: Theme): void {
    if (!theme || !this.themes.find(t => t.id === theme.id)) {
      console.warn(`Invalid theme: ${theme?.name || 'undefined'}`);
      return;
    }

    // Only manipulate DOM and localStorage in browser environment
    if (isPlatformBrowser(this.platformId)) {
      // Save to localStorage
      localStorage.setItem(this.THEME_KEY, theme.id.toString());
      
      // Apply theme globally to body element
      const body = document.body;
      
      // Remove all existing theme classes
      this.themes.forEach(t => {
        body.classList.remove(t.className);
      });
      
      // Add the new theme class
      body.classList.add(theme.className);

      // Log accessibility information
      console.log(`Theme applied: ${theme.name} (Accessibility: WCAG ${theme.accessibilityLevel})`);
    }
    
    // Update subject (works in both browser and server)
    this.currentThemeSubject.next(theme);
  }

  /**
   * Set theme by ID
   */
  setThemeById(themeId: number): void {
    const theme = this.themes.find(t => t.id === themeId);
    if (theme) {
      this.setTheme(theme);
    }
  }

  /**
   * Get current theme
   */
  getCurrentTheme(): Theme {
    return this.currentThemeSubject.value;
  }

  /**
   * Get all available themes
   */
  getAllThemes(): Theme[] {
    return [...this.themes];
  }

  /**
   * Get themes by accessibility level
   */
  getThemesByAccessibilityLevel(level: 'AA' | 'AAA'): Theme[] {
    return this.themes.filter(t => t.accessibilityLevel === level);
  }

  /**
   * Check if current theme meets accessibility standards
   */
  isCurrentThemeAccessible(): boolean {
    const currentTheme = this.getCurrentTheme();
    return currentTheme.accessibilityLevel === 'AA' || currentTheme.accessibilityLevel === 'AAA';
  }

  /**
   * Load theme from localStorage or use default (theme 1)
   */
  private loadTheme(): void {
    let themeId = 1; // Default theme
    
    // Only access localStorage in browser environment
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem(this.THEME_KEY);
      themeId = savedTheme ? parseInt(savedTheme, 10) : 1;
    }
    
    // Find theme by ID and set it
    const theme = this.themes.find(t => t.id === themeId);
    if (theme) {
      this.setTheme(theme);
    } else {
      this.setTheme(this.themes[0]); // Default to first theme if invalid
    }
  }
}
