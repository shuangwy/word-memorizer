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
  readWord(word: string): void {
    if (word) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US'; // 语言设定美式英语

      const voices = speechSynthesis.getVoices();

      // 优先找 Mac 系统里的 "Samantha" 声音
      let preferredVoice = voices.find(voice => voice.name === 'Samantha');

      // 如果找不到，再找 "Alex" 或其他美式音色
      if (!preferredVoice) {
        preferredVoice = voices.find(voice =>
          voice.lang === 'en-US' &&
          (voice.name === 'Alex' || voice.name === 'Victoria' || voice.name === 'Susan')
        );
      }

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.rate = 1; // 正常语速
      speechSynthesis.speak(utterance);
    }
  }
}