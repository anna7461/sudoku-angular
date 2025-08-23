import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface HeaderAction {
  type: 'settings' | 'help';
  source: string; // 'dashboard' | 'sudoku' | 'arcade'
}

@Injectable({
  providedIn: 'root'
})
export class HeaderService {
  private actionSubject = new Subject<HeaderAction>();
  public action$ = this.actionSubject.asObservable();

  constructor() {}

  openSettings(source: string): void {
    this.actionSubject.next({ type: 'settings', source });
  }

  openHelp(source: string): void {
    this.actionSubject.next({ type: 'help', source });
  }
}
