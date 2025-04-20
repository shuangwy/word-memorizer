import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WordService, VocabularyEntry } from '../../services/word.service'; // Adjust path if needed
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-incorrect-words',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './incorrect-words.component.html',
  styleUrls: ['./incorrect-words.component.scss'],
})
export class IncorrectWordsComponent implements OnInit, OnDestroy {
  incorrectWords: { word: string; incorrectCount: number; pronunciation?: string; definition?: string }[] = [];
  private incorrectAttemptsSubscription: Subscription | undefined;

  constructor(private wordService: WordService) { }

  ngOnInit(): void {
    this.incorrectAttemptsSubscription = this.wordService.getIncorrectAttemptsObservable().subscribe(incorrectAttempts => {
      this.updateIncorrectWordsList(incorrectAttempts);
    });

    this.updateIncorrectWordsList(this.wordService.getAllIncorrectAttempts());
  }

  ngOnDestroy(): void {
    if (this.incorrectAttemptsSubscription) {
      this.incorrectAttemptsSubscription.unsubscribe();
    }
  }

  private updateIncorrectWordsList(incorrectAttempts: Map<string, number>): void {
    const vocabulary = this.wordService.getVocabulary();
    this.incorrectWords = Array.from(incorrectAttempts.entries())
      .map(([word, incorrectCount]) => {
        const vocabEntry = vocabulary.find(entry => entry.word === word);
        return {
          word,
          incorrectCount,
          pronunciation: vocabEntry?.pronunciation,
          definition: vocabEntry?.definition,
        };
      })
      .sort((a, b) => b.incorrectCount - a.incorrectCount);
  }
}