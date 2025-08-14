import { Component, Input, Output, EventEmitter, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface GameCompletionData {
  difficulty: string;
  timeSpent: string;
  score: number;
  mistakes: number;
}

@Component({
  selector: 'app-congratulations-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './congratulations-modal.component.html',
  styleUrls: ['./congratulations-modal.component.scss']
})
export class CongratulationsModalComponent implements OnInit, AfterViewInit {
  @ViewChild('modalContent') modalContent!: ElementRef;
  @Input() set isVisible(value: boolean) {
    this._isVisible = value;
    if (value && this.modalContent) {
      // Focus the modal when it becomes visible
      setTimeout(() => {
        this.modalContent.nativeElement.focus();
      }, 100);
    }
  }
  get isVisible(): boolean {
    return this._isVisible;
  }

  private _isVisible: boolean = false;

  @Input() gameData: GameCompletionData | null = null;
  @Output() newGame = new EventEmitter<string>();
  @Output() closeModal = new EventEmitter<void>();

  selectedDifficulty: string = 'easy';
  difficulties: { value: string; label: string }[] = [
    { value: 'test', label: 'Test' },
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
    { value: 'expert', label: 'Expert' }
  ];

  ngOnInit() {
    if (this.gameData) {
      this.selectedDifficulty = this.gameData.difficulty || 'easy';
    }
  }

  ngAfterViewInit() {
    // Focus management will be handled here if needed
  }

  onNewGame() {
    this.newGame.emit(this.selectedDifficulty);
  }

  onClose() {
    this.closeModal.emit();
  }

  onDifficultyChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    if (target) {
      this.selectedDifficulty = target.value;
    }
  }

  // Prevent modal from closing when clicking inside the modal content
  onModalContentClick(event: Event) {
    event.stopPropagation();
  }

  // Close modal when clicking outside
  onBackdropClick() {
    this.onClose();
  }

  // Handle escape key
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.onClose();
    }
  }

  // Prevent tab from moving focus outside modal
  onTabKey(event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    const focusableElements = this.modalContent?.nativeElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (keyboardEvent.shiftKey) {
      if (document.activeElement === firstElement) {
        keyboardEvent.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        keyboardEvent.preventDefault();
        firstElement.focus();
      }
    }
  }
}
