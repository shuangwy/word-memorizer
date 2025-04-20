import { Component } from '@angular/core';
import { WordImportComponent } from './components/word-import/word-import.component';
import { QuizComponent } from './components/quiz/quiz.component';
import { ProgressComponent } from './components/progress/progress.component';
import { IncorrectWordsComponent } from './components/incorrect-words/incorrect-words.component'

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    WordImportComponent,
    QuizComponent,
    ProgressComponent,
    IncorrectWordsComponent,
    CommonModule
  ],
  template: `
   <div class="nav-bar">
      <button (click)="showSection(currentSection)" [class.active]="currentSection">Import</button>
      <button (click)="showFailedList(failedVisible)" [class.active]="failedVisible">Failed List</button>
    </div>
    <h1>Word Memorizer</h1>
    <app-word-import *ngIf="!!currentSection"></app-word-import>
    <app-quiz></app-quiz>
    <app-progress></app-progress>
    <app-incorrect-words *ngIf="!!failedVisible"></app-incorrect-words>
  `,
  styles: [
    `
      h1 {
        text-align: center;
        color: #333;
      }
        .nav-bar {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding: 10px;
        background-color: #f0f0f0;
        border-bottom: 1px solid #ccc;
      }
      .nav-bar button {
        padding: 8px 16px;
        border: none;
        background-color: #e0e0e0;
        cursor: pointer;
        border-radius: 4px;
      }
      .nav-bar button.active {
        background-color: #007bff;
        color: white;
      }
      .nav-bar button:hover {
        background-color: #d0d0d0;
      }
    `,
  ],
})
export class AppComponent {
  currentSection: boolean = true;
  failedVisible: boolean = false

  showSection(bool: boolean) {
    this.currentSection = !bool
  }
  showFailedList(bool: boolean) {
    this.failedVisible = !bool
  }
}