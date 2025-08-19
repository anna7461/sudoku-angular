import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

export interface GameSettings {
  soundEffects: boolean;
  vibration: boolean;
  themeMode: 'light' | 'dark';
  timer: boolean;
  mistakesLimit: boolean;
  mistakesLimitNumber: number;
  numberFirstInput: boolean;
  autoComplete: boolean;
  autoRemoveNotes: boolean;
  numberCompletionAnimations: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class GameSettingsService {
  private readonly SETTINGS_KEY = 'sudoku-game-settings';
  
  private defaultSettings: GameSettings = {
    soundEffects: false,
    vibration: false,
    themeMode: 'light',
    timer: true,
    mistakesLimit: true,
    mistakesLimitNumber: 3,
    numberFirstInput: false,
    autoComplete: false,
    autoRemoveNotes: false,
    numberCompletionAnimations: false
  };

  private settingsSubject = new BehaviorSubject<GameSettings>(this.defaultSettings);
  public settings$: Observable<GameSettings> = this.settingsSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.loadSettings();
  }

  getSettings(): GameSettings {
    return this.settingsSubject.value;
  }

  updateSettings(updates: Partial<GameSettings>): void {
    const currentSettings = this.settingsSubject.value;
    const newSettings = { ...currentSettings, ...updates };
    this.settingsSubject.next(newSettings);
    this.saveSettings(newSettings);
    
    // Apply theme changes immediately
    if (updates.themeMode) {
      this.applyThemeMode(updates.themeMode);
    }
  }

  toggleSetting(setting: keyof GameSettings): void {
    const currentSettings = this.settingsSubject.value;
    const currentValue = currentSettings[setting];
    
    if (typeof currentValue === 'boolean') {
      this.updateSettings({ [setting]: !currentValue });
    }
  }

  setMistakesLimitNumber(value: number): void {
    this.updateSettings({ mistakesLimitNumber: value });
  }

  setThemeMode(mode: 'light' | 'dark'): void {
    this.updateSettings({ themeMode: mode });
  }

  private applyThemeMode(mode: 'light' | 'dark'): void {
    if (isPlatformBrowser(this.platformId)) {
      const sudokuElement = document.querySelector('app-sudoku');
      if (sudokuElement) {
        // Remove existing theme classes
        sudokuElement.classList.remove('theme-classic-blue', 'theme-forest-green', 'theme-sunset-orange', 'theme-purple-royale', 'theme-warm-sand', 'theme-dark-mode');
        
        // Apply appropriate theme based on mode
        if (mode === 'dark') {
          sudokuElement.classList.add('theme-dark-mode');
        } else {
          sudokuElement.classList.add('theme-classic-blue');
        }
      }
    }
  }

  private loadSettings(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const savedSettings = localStorage.getItem(this.SETTINGS_KEY);
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          // Merge with defaults to ensure all properties exist
          const mergedSettings = { ...this.defaultSettings, ...parsedSettings };
          this.settingsSubject.next(mergedSettings);
          
          // Apply saved theme mode
          if (mergedSettings.themeMode) {
            this.applyThemeMode(mergedSettings.themeMode);
          }
        }
      } catch (error) {
        console.warn('Failed to load game settings:', error);
        this.settingsSubject.next(this.defaultSettings);
      }
    }
  }

  private saveSettings(settings: GameSettings): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
      } catch (error) {
        console.warn('Failed to save game settings:', error);
      }
    }
  }

  resetToDefaults(): void {
    this.settingsSubject.next(this.defaultSettings);
    this.saveSettings(this.defaultSettings);
    this.applyThemeMode(this.defaultSettings.themeMode);
  }
}
