import { Injectable } from '@angular/core';
import { LocalStorageService, GameMode, GameState, SavedGameInfo } from './local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  
  constructor(private localStorageService: LocalStorageService) {}

  /**
   * Get saved game info for classic mode (backward compatibility)
   */
  getSavedGameInfo(): SavedGameInfo {
    return this.localStorageService.getSavedGameInfo('classic');
  }

  /**
   * Check if there's a saved game for classic mode (backward compatibility)
   */
  hasSavedGame(): boolean {
    return this.localStorageService.hasSavedGame('classic');
  }

  /**
   * Clear saved game for classic mode (backward compatibility)
   */
  clearSavedGame(): void {
    this.localStorageService.clearSavedGame('classic');
  }

  /**
   * Get the localStorage service for direct access
   */
  getLocalStorageService(): LocalStorageService {
    return this.localStorageService;
  }
}
