import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import * as pdfjsLib from 'pdfjs-dist'; // 引入 pdf.js 库
export interface VocabularyEntry {
  word: string;
  pronunciation?: string;
  definition?: string;
}

export interface Progress {
  total: number;
  completed: number;
}
// 日志服务接口（替代 console.log）
interface Logger {
  log(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

// 简单的日志实现（可替换为更复杂的日志服务）
const logger: Logger = {
  log: (message, ...args) => {
    console.log(message, ...args);
  },
  error: (message, ...args) => console.error(message, ...args),
};

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

  constructor() {
    // 初始化时从 localStorage 加载数据
    this.loadFromLocalStorage();
  }
  // 持久化存储到 localStorage
  private saveToLocalStorage(): void {
    try {
      localStorage.setItem('vocabulary', JSON.stringify(this.vocabulary));
      localStorage.setItem('completedWords', JSON.stringify([...this.completedWords]));
      localStorage.setItem('incorrectAttempts', JSON.stringify([...this.incorrectAttempts]));
    } catch (error) {
    }
  }

  // 从 localStorage 加载数据
  private loadFromLocalStorage(): void {
    try {
      const savedVocabulary = localStorage.getItem('vocabulary');
      const savedCompletedWords = localStorage.getItem('completedWords');
      const savedIncorrectAttempts = localStorage.getItem('incorrectAttempts');

      if (savedVocabulary) {
        this.vocabulary = JSON.parse(savedVocabulary);
        this.vocabularySubject.next(this.vocabulary);
      }
      if (savedCompletedWords) {
        this.completedWords = new Set(JSON.parse(savedCompletedWords));
        this.completedWordsSubject.next(this.completedWords.size);
      }
      if (savedIncorrectAttempts) {
        this.incorrectAttempts = new Map(JSON.parse(savedIncorrectAttempts));
        this.incorrectAttemptsSubject.next(this.incorrectAttempts);
      }
    } catch (error) {
    }
  }
  // 输入校验函数
  private validateVocabularyEntry(entry: VocabularyEntry): boolean {
    return !!entry.word && entry.word.trim().length > 0;
  }

  addVocabulary(vocabulary: VocabularyEntry[]): Observable<void> {
    // 校验输入
    if (!vocabulary || !Array.isArray(vocabulary) || vocabulary.length === 0) {
      logger.error('Invalid vocabulary input:', vocabulary);
      return throwError(() => new Error('Vocabulary input is invalid or empty'));
    }

    // 过滤无效条目
    const validEntries = vocabulary.filter(entry => this.validateVocabularyEntry(entry));
    if (validEntries.length === 0) {
      logger.error('No valid vocabulary entries provided');
      return throwError(() => new Error('No valid vocabulary entries provided'));
    }

    this.vocabulary = [...this.vocabulary, ...validEntries];
    this.vocabularySubject.next(this.vocabulary);
    this.saveToLocalStorage();
    logger.log('Vocabulary updated, count:', this.vocabulary.length);
    return new Observable(observer => observer.complete());
  }
  getVocabulary(): VocabularyEntry[] {
    return [...this.vocabulary]; // 返回副本防止外部修改
  }
  getVocabularyObservable(): Observable<VocabularyEntry[]> {
    return this.vocabularySubject.asObservable();
  }

  async importFromPDF(file: File): Promise<void> {
    try {
      // 使用 pdf.js 解析 PDF
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      const words: VocabularyEntry[] = [];

      // 遍历 PDF 页面提取文本
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');

        // 简单解析：假设每行一个单词和定义，用分号分隔
        const lines = pageText.split('\n').filter(line => line.includes(';'));
        for (const line of lines) {
          const [word, definition] = line.split(';').map(s => s.trim());
          if (word && definition) {
            words.push({ word, definition });
          }
        }
      }

      if (words.length === 0) {
        throw new Error('No valid vocabulary entries found in PDF');
      }

      // 使用 addVocabulary 添加词汇
      await this.addVocabulary(words).toPromise();
      logger.log('Imported vocabulary from PDF, count:', words.length);
    } catch (error) {
      logger.error('Failed to import from PDF:', error);
      throw error;
    }
  }
  generateQuizOptions(): { correct: VocabularyEntry; options: string[] } | null {
    const validEntries = this.vocabulary.filter(entry => this.validateVocabularyEntry(entry));
    if (validEntries.length < 4) {
      logger.error('Not enough valid entries for quiz, required: 4, available:', validEntries.length);
      return null;
    }

    const correctIndex = Math.floor(Math.random() * validEntries.length);
    const correct = validEntries[correctIndex];

    const options: string[] = [correct.definition!];
    const otherEntries = validEntries.filter((_, index) => index !== correctIndex);
    const shuffledIndices = Array.from({ length: otherEntries.length }, (_, i) => i);
    for (let i = shuffledIndices.length - 1; i > 0 && options.length < 4; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledIndices[i], shuffledIndices[j]] = [shuffledIndices[j], shuffledIndices[i]];
      const definition = otherEntries[shuffledIndices[i]].definition!;
      if (!options.includes(definition)) {
        options.push(definition);
      }
    }

    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }

    logger.log('Generated quiz options for word:', correct.word);
    return { correct, options };
  }

  markWordCompleted(word: string): void {
    if (!word || !this.vocabulary.some(entry => entry.word === word)) {
      logger.error('Invalid or non-existent word:', word);
      return;
    }
    this.completedWords.add(word);
    this.completedWordsSubject.next(this.completedWords.size);
    this.saveToLocalStorage();
    logger.log('Word marked as completed:', word);
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
    if (!word || !this.vocabulary.some(entry => entry.word === word)) {
      logger.error('Invalid or non-existent word:', word);
      return;
    }
    const currentAttempts = this.incorrectAttempts.get(word) || 0;
    this.incorrectAttempts.set(word, currentAttempts + 1);
    this.incorrectAttemptsSubject.next(new Map(this.incorrectAttempts)); // 触发新 Map 防止引用问题
    this.saveToLocalStorage();
    logger.log(`Word ${word} marked incorrect, attempts:`, currentAttempts + 1);
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
    this.vocabularySubject.next(this.vocabulary);
    this.completedWordsSubject.next(this.completedWords.size);
    this.incorrectAttemptsSubject.next(this.incorrectAttempts);
    this.saveToLocalStorage();
  }
}