import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-help-overlay',
  imports: [CommonModule],
  templateUrl: './help-overlay.component.html',
  styleUrl: './help-overlay.component.scss'
})
export class HelpOverlayComponent {
  @Output() close = new EventEmitter<void>();
  
  helpItems = [
    {
      title: 'Get Hints',
      description: 'Receive helpful hints to solve the puzzle',
      comingSoon: true
    },
    {
      title: 'Statistics',
      description: 'View your game statistics and progress',
      comingSoon: true
    },
    {
      title: 'How to Play',
      description: 'Learn the rules and basic strategies',
      comingSoon: true
    },
    {
      title: 'Strategies',
      description: 'Advanced solving techniques and tips',
      comingSoon: true
    }
  ];

  onClose(): void {
    this.close.emit();
  }
}
