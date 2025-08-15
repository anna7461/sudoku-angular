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
      primaryColor: '#3d55cc',
      accentColor: '#dadef2',
      backgroundColor: '#f5f6fa'
    },
    {
      id: 2,
      name: 'Forest Green',
      className: 'theme-forest-green',
      primaryColor: '#2d8a3f',
      accentColor: '#c8e6d0',
      backgroundColor: '#f0f8f2'
    },
    {
      id: 3,
      name: 'Sunset Orange',
      className: 'theme-sunset-orange',
      primaryColor: '#d47500',
      accentColor: '#e6d0a8',
      backgroundColor: '#faf6f0'
    },
    {
      id: 4,
      name: 'Purple Royale',
      className: 'theme-purple-royale',
      primaryColor: '#7c3aed',
      accentColor: '#d4c7e6',
      backgroundColor: '#f5f2fa'
    },
    {
      id: 5,
      name: 'Warm Sand',
      className: 'theme-warm-sand',
      primaryColor: '#b8860b',
      accentColor: '#f4e4bc',
      backgroundColor: '#fdfbf5'
    },
    {
      id: 6,
      name: 'Dark Mode',
      className: 'theme-dark-mode',
      primaryColor: '#3b82f6',
      accentColor: '#374151',
      backgroundColor: '#111827'
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
