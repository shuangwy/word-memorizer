import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface VocabularyEntry {
  word: string;
  pronunciation?: string;
  definition?: string;
}

export interface Progress {
  total: number;
  completed: number;
}

@Injectable({
  providedIn: 'root',
})
export class WordService {
  private vocabulary: VocabularyEntry[] = [];
  private completedWords: Set<string> = new Set();
  private vocabularySubject = new BehaviorSubject<VocabularyEntry[]>(this.vocabulary);
  // 新增 BehaviorSubject 来跟踪 completedWords 的变化
  private completedWordsSubject = new BehaviorSubject<number>(this.completedWords.size);

  private incorrectAttempts: Map<string, number> = new Map(); // 新增存储错误次数
  private incorrectAttemptsSubject = new BehaviorSubject<Map<string, number>>(this.incorrectAttempts); // 新增错误次数的Subject

  addVocabulary(vocabulary: VocabularyEntry[]): void {
    this.vocabulary = [...this.vocabulary, ...vocabulary];
    console.log('Vocabulary updated:', this.vocabulary);
    this.vocabularySubject.next(this.vocabulary);
  }

  getVocabulary(): VocabularyEntry[] {
    console.log('Getting vocabulary:', this.vocabulary);
    return this.vocabulary;
  }

  getVocabularyObservable(): Observable<VocabularyEntry[]> {
    return this.vocabularySubject.asObservable();
  }

  async importFromPDF(filePath: string): Promise<void> {
    const words: VocabularyEntry[] = [];
    this.addVocabulary(words);
  }

  generateQuizOptions(): { correct: VocabularyEntry; options: string[] } | null {
    console.log('Generating quiz options. Vocabulary length:', this.vocabulary.length);
    const validEntries = this.vocabulary.filter(entry => entry.definition);
    if (validEntries.length < 4) {
      console.log('Not enough words with definitions to generate quiz options.');
      return null;
    }

    const correctIndex = Math.floor(Math.random() * validEntries.length);
    const correct = validEntries[correctIndex];

    if (!correct.definition) {
      console.log('Correct entry has no definition:', correct);
      return null;
    }

    const options: string[] = [correct.definition];
    const otherEntries = validEntries.filter((_, index) => index !== correctIndex);
    while (options.length < 4) {
      const randomIndex = Math.floor(Math.random() * otherEntries.length);
      const definition = otherEntries[randomIndex].definition;
      if (definition && !options.includes(definition)) {
        options.push(definition);
      }
    }

    options.sort(() => Math.random() - 0.5);

    console.log('Generated quiz options:', { correct, options });
    return { correct, options };
  }

  markWordCompleted(word: string): void {
    this.completedWords.add(word);
    console.log('Word marked as completed:', this.completedWords.size, word);
    // 更新 completedWordsSubject 的值
    this.completedWordsSubject.next(this.completedWords.size);
  }

  getProgress(): Progress {
    return {
      total: this.vocabulary.length,
      completed: this.completedWords.size,
    };
  }

  // 新增方法，提供 completedWords 变化的可观察对象
  getCompletedWordsObservable(): Observable<number> {
    return this.completedWordsSubject.asObservable();
  }

  // 新增方法：标记单词错误
  markWordIncorrect(word: string): void {
    const currentAttempts = this.incorrectAttempts.get(word) || 0;
    this.incorrectAttempts.set(word, currentAttempts + 1);
    console.log(`单词 ${word} 被标记为错误，当前错误次数: ${currentAttempts + 1}`);
    this.incorrectAttemptsSubject.next(this.incorrectAttempts);
  }

  // 新增方法：获取某个单词的错误次数
  getIncorrectAttempts(word: string): number {
    return this.incorrectAttempts.get(word) || 0;
  }

  // 新增方法：提供错误次数变化的可观察对象
  getIncorrectAttemptsObservable(): Observable<Map<string, number>> {
    return this.incorrectAttemptsSubject.asObservable();
  }

  getAllIncorrectAttempts(): Map<string, number> {
    return new Map(this.incorrectAttempts);
  }
  clearVocabulary(): void {
    this.vocabulary = [];
    this.completedWords.clear();
    this.incorrectAttempts.clear();
    console.log('Vocabulary cleared');
    this.vocabularySubject.next(this.vocabulary);
    this.completedWordsSubject.next(this.completedWords.size);
    this.incorrectAttemptsSubject.next(this.incorrectAttempts);
  }
}