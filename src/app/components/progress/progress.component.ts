import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WordService, Progress } from '../../services/word.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="progress">
      <h2>学习进度</h2>
      <p>已完成: {{ progress.completed }} / {{ progress.total }}</p>
      <p>完成百分比: {{ (progress.completed / progress.total * 100) | number:'1.0-2' }}%</p>
    </div>
  `,
  styles: [
    `
      .progress {
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
    `,
  ],
})
export class ProgressComponent implements OnInit {
  progress: Progress = { total: 0, completed: 0 };
  private vocabularySubscription: Subscription | undefined;
  completedWordsCount: number = 0;
  progressPercentage: number = 0;
  constructor(private wordService: WordService) { }

  ngOnInit(): void {
    // 订阅 completedWords 的变化
    this.vocabularySubscription = this.wordService.getCompletedWordsObservable().subscribe(count => {
      this.completedWordsCount = count;
      this.updateProgress();
    });

    // 初始时获取进度
    this.updateProgress();
  }
  ngOnDestroy(): void {
    // 组件销毁时取消订阅，防止内存泄漏
    if (this.vocabularySubscription) {
      this.vocabularySubscription.unsubscribe();
    }
  }

  // 示例：模拟完成一个单词
  completeWord(word: string): void {
    this.wordService.markWordCompleted(word);
  }

  updateProgress(): void {
    this.progress = this.wordService.getProgress();
    console.log(111111, this.progress)
  }
}