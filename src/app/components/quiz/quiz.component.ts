import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WordService, VocabularyEntry } from '../../services/word.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="quiz">
      <!-- <h2>select</h2> -->
      <button (click)="refreshQuiz()">刷新题目</button>
      <div *ngIf="currentQuestion; else noQuestions">
        <p>单词: {{ currentQuestion!.correct.word }} 
          <button (click)="readWord(currentQuestion!.correct.word)" style="margin-left: 10px;">🔊</button>
          <span class="incorrect-count" *ngIf="getIncorrectCount(currentQuestion!.correct.word) > 0">(The number of failures : {{ getIncorrectCount(currentQuestion!.correct.word) }})</span></p>
        <p *ngIf="currentQuestion!.correct.pronunciation">音标: {{ currentQuestion!.correct.pronunciation }}</p>
        <div class="options">
          <button *ngFor="let option of currentQuestion!.options; let i = index"
                  (click)="checkAnswer(option)"
                  [ngClass]="{'correct': selectedOption === option && option === currentQuestion!.correct.definition, 'incorrect': selectedOption === option && option !== currentQuestion!.correct.definition}">
            {{ option }}
          </button>
        </div>
        <button (click)="nextQuestion()" [disabled]="!selectedOption">下一题</button>
      </div>
      <ng-template #noQuestions>
        <p>词汇表中没有足够的单词（需要至少 4 个，且需有释义）。</p>
      </ng-template>
    </div>
  `,
  styles: [
    `
      .quiz {
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        margin-bottom: 20px;
      }
      .options {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-bottom: 20px;
      }
      button {
        padding: 10px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        background: #f0f0f0;
        margin-bottom: 10px;
      }
      button:hover {
        background: #e0e0e0;
      }
      .correct {
        background: #4caf50;
        color: white;
      }
      .incorrect {
        background: #f44336;
        color: white;
      }
        .incorrect-count {
        color: #f44336;
        font-size: 0.9em;
        margin-left: 10px;
      }
    `,
  ],
})
export class QuizComponent implements OnInit, OnDestroy {
  currentQuestion: { correct: VocabularyEntry; options: string[] } | null = null;
  selectedOption: string | null = null;
  private vocabularySubscription: Subscription | undefined;

  constructor(private wordService: WordService) { }

  ngOnInit(): void {
    this.vocabularySubscription = this.wordService.getVocabularyObservable().subscribe(vocabulary => {
      console.log('QuizComponent: Vocabulary changed:', vocabulary);
      this.nextQuestion();
    });

    this.nextQuestion();
  }

  ngOnDestroy(): void {
    if (this.vocabularySubscription) {
      this.vocabularySubscription.unsubscribe();
    }
  }

  nextQuestion(): void {
    this.selectedOption = null;
    this.currentQuestion = this.wordService.generateQuizOptions();
    if (this.currentQuestion?.correct?.word) {
      this.readWord(this.currentQuestion?.correct?.word)
    }
    console.log('QuizComponent: Current question:', this.currentQuestion);
  }

  checkAnswer(option: string): void {
    this.selectedOption = option;
    if (option === this.currentQuestion!.correct.definition) {
      this.wordService.markWordCompleted(this.currentQuestion!.correct.word);
      this.nextQuestion()
    } else {
      this.wordService.markWordIncorrect(this.currentQuestion!.correct.word); // 记录错误答案
    }
  }

  refreshQuiz(): void {
    console.log('Refreshing quiz...');
    this.nextQuestion();
  }
  // 新增方法：获取单词的错误次数
  getIncorrectCount(word: string): number {
    return this.wordService.getIncorrectAttempts(word);
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