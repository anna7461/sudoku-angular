import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  @Output() openSettings = new EventEmitter<void>();
  @Output() openHelp = new EventEmitter<void>();
  @Output() titleClick = new EventEmitter<void>();

  onOpenSettings(): void {
    this.openSettings.emit();
  }

  onOpenHelp(): void {
    this.openHelp.emit();
  }

  onTitleClick(): void {
    this.titleClick.emit();
  }
}
