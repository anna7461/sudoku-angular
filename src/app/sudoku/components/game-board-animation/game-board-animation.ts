import { Component, AfterViewInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-game-board-animation',
  templateUrl: './game-board-animation.html',
  styleUrls: ['./game-board-animation.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class GameBoardAnimationComponent implements AfterViewInit {

  // Full board as 9 boxes × 9 cells each
  board: number[][] = [
    [1,2,3,4,5,6,7,8,9],
    [4,5,6,7,8,9,1,2,3],
    [7,8,9,1,2,3,4,5,6],
    [2,1,4,3,6,5,8,9,7],
    [3,6,5,8,9,7,2,1,4],
    [8,9,7,4,1,2,3,6,5],
    [5,3,1,6,4,2,9,7,8],
    [6,4,2,9,7,8,5,3,1],
    [9,7,8,5,3,1,6,4,2]
  ];

  // Store filled cells (random ~30)
  filledSet = new Set<string>();

  constructor(private el: ElementRef) {
    this.pickRandomFilledCells();
  }

  private pickRandomFilledCells() {
    const allCells: string[] = [];
    for (let box = 0; box < 9; box++) {
      for (let cell = 0; cell < 9; cell++) {
        allCells.push(`${box}-${cell}`);
      }
    }

    // Pick 30 random unique cells
    while (this.filledSet.size < 30) {
      const idx = Math.floor(Math.random() * allCells.length);
      this.filledSet.add(allCells[idx]);
    }
  }

  isFilled(boxIndex: number, cellIndex: number): boolean {
    return this.filledSet.has(`${boxIndex}-${cellIndex}`);
  }

  ngAfterViewInit(): void {
    const cells: HTMLElement[] = Array.from(
      this.el.nativeElement.querySelectorAll('.game-board-animation .box > div.reveal')
    );

    const shuffled = cells.sort(() => Math.random() - 0.5);

    shuffled.forEach((cell, index) => {
      cell.style.animationDelay = `${index * 0.7}s`;
    });
  }
}
