import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { GameSettingsService, GameSettings } from '../../services/game-settings.service';

@Component({
  standalone: true,
  selector: 'app-settings-overlay',
  imports: [CommonModule, FormsModule],
  templateUrl: './settings-overlay.component.html',
  styleUrl: './settings-overlay.component.scss'
})
export class SettingsOverlayComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();
  
  settings: GameSettings;
  private settingsSubscription!: Subscription;
  mistakesLimitOptions = [3, 5, 10];

  constructor(private gameSettingsService: GameSettingsService) {
    this.settings = this.gameSettingsService.getSettings();
  }

  ngOnInit(): void {
    this.settingsSubscription = this.gameSettingsService.settings$.subscribe(
      settings => this.settings = settings
    );
  }

  ngOnDestroy(): void {
    if (this.settingsSubscription) {
      this.settingsSubscription.unsubscribe();
    }
  }

  toggleSetting(setting: keyof GameSettings): void {
    this.gameSettingsService.toggleSetting(setting);
  }

  setMistakesLimitNumber(value: number): void {
    this.gameSettingsService.setMistakesLimitNumber(value);
  }

  onMistakesLimitChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target && target.value) {
      this.setMistakesLimitNumber(+target.value);
    }
  }

  setThemeMode(mode: 'light' | 'dark'): void {
    this.gameSettingsService.setThemeMode(mode);
  }

  isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  onClose(): void {
    this.close.emit();
  }
}
