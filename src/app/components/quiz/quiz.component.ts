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
        <p style="margin: 6px 0;">单词: {{ currentQuestion!.correct.word }} 
          <button
            (click)="readWord(currentQuestion!.correct.word)"
            style="background: none; border: none; cursor: pointer; margin-left: -5px; font-size: 16px; color: #555; transition: color 0.3s;"
            onmouseover="this.style.color='#007BFF'"
            onmouseout="this.style.color='#555'"
          >🔊</button>
            <span class="incorrect-count" *ngIf="getIncorrectCount(currentQuestion!.correct.word) > 0">(The number of failures : {{ getIncorrectCount(currentQuestion!.correct.word) }})</span>
        </p>
        <p *ngIf="currentQuestion!.correct.pronunciation" style="margin:4px 0 10px 0;">音标: {{ currentQuestion!.correct.pronunciation }}</p>
        <div class="options">
          <button *ngFor="let option of currentQuestion!.options; let i = index"
                  (click)="checkAnswer(option)"
                  [ngClass]="{'correct': selectedOption === option && option === currentQuestion!.correct.definition, 'incorrect': selectedOption === option && option !== currentQuestion!.correct.definition}">
            {{ option }}
          </button>
        </div>
          <div *ngIf="exampleSentence" style="background: #f9f9f9; border-radius: 5px;">
          <p style="padding: 0; margin: 0"><strong>例句：</strong> {{ exampleSentence }}
          <button (click)="playExampleSentence()">🔊 朗读</button>
          </p>
          <p style="padding: 0;margin-top:0" *ngIf="exampleTranslation"><strong>翻译：</strong> {{ exampleTranslation }}</p>
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
        padding:8px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        background: #f0f0f0;
        margin-bottom: 0;
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
  exampleSentence: string | null = null;
  exampleTranslation: string | null = null;

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
    this.exampleSentence = null;
    this.exampleTranslation = null;

    if (this.currentQuestion?.correct?.word) {
      this.readWord(this.currentQuestion?.correct?.word)
      this.fetchExampleSentence(this.currentQuestion.correct.word); // 👈 加这句，自动查例句
    }
    console.log('QuizComponent: Current question:', this.currentQuestion);
  }

  checkAnswer(option: string): void {
    this.selectedOption = option;
    if (option === this.currentQuestion!.correct.definition) {
      this.wordService.markWordCompleted(this.currentQuestion!.correct.word);
      // this.readWord(this.currentQuestion!.correct.word)
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
  fetchExampleSentence(word: string): void {
    if (!word) return;

    fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
      .then(response => response.json())
      .then(data => {
        if (!Array.isArray(data) || !data[0]?.meanings) {
          console.error('No example sentence found');
          this.exampleSentence = null;
          this.exampleTranslation = null;
          return;
        }

        let exampleSentence: string | undefined;
        for (const meaning of data[0].meanings) {
          for (const definition of meaning.definitions) {
            if (definition.example) {
              exampleSentence = definition.example;
              break;
            }
          }
          if (exampleSentence) break;
        }

        if (exampleSentence) {
          this.exampleSentence = exampleSentence;
          this.translateSentence(exampleSentence); // 顺便翻译
        } else {
          console.error('No example sentence found for', word);
          this.exampleSentence = null;
          this.exampleTranslation = null;
        }
      })
      .catch(error => {
        console.error('Failed to fetch example sentence:', error);
        this.exampleSentence = null;
        this.exampleTranslation = null;
      });
  }

  playExampleSentence(): void {
    if (this.exampleSentence) {
      const utterance = new SpeechSynthesisUtterance(this.exampleSentence);
      utterance.lang = 'en-US'; // 美式英语
      const voices = speechSynthesis.getVoices();

      let preferredVoice = voices.find(voice => voice.name === 'Samantha')
        || voices.find(voice => voice.lang === 'en-US');

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.rate = 1;
      speechSynthesis.speak(utterance);
    }
  }
  async translateSentence(sentence: string): Promise<void> {
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=${encodeURIComponent(sentence)}`;
      const response = await fetch(url);
      const data = await response.json();

      if (Array.isArray(data) && Array.isArray(data[0]) && Array.isArray(data[0][0])) {
        this.exampleTranslation = data[0].map((item: any) => item[0]).join('');
      } else {
        this.exampleTranslation = '';
      }
    } catch (error) {
      console.error('Translation failed:', error);
      this.exampleTranslation = '';
    }
  }
}