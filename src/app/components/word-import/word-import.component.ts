import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WordService, VocabularyEntry } from '../../services/word.service';

declare global {
  interface Window {
    electronAPI: {
      writeFile: (arrayBuffer: ArrayBuffer) => string;
      unlinkFile: (filePath: string) => void;
      pathJoin: (dir: string, fileName: string) => string;
    };
  }
}

@Component({
  selector: 'app-word-import',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="word-import">
      <h2>导入词汇表</h2>
      <input type="file" accept=".csv,.json,.pdf" (change)="onFileSelected($event)" />
    </div>
  `,
  styles: [
    `
      .word-import {
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        margin-bottom: 20px;
      }
      input {
        width: 100%;
        margin-bottom: 10px;
      }
    `,
  ],
})
export class WordImportComponent {
  constructor(private wordService: WordService) { }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const fileName = file.name.toLowerCase();

      try {
        if (fileName.endsWith('.pdf')) {
          const arrayBuffer = await file.arrayBuffer();
          const tempPath = window.electronAPI.writeFile(arrayBuffer);
          try {
            await this.wordService.importFromPDF(tempPath);
            alert('PDF 导入成功！');
          } finally {
            window.electronAPI.unlinkFile(tempPath);
          }
        } else if (fileName.endsWith('.csv')) {
          const text = await file.text();
          const vocabulary = this.parseCSV(text);
          console.log('Parsed vocabulary:', vocabulary); // 调试日志
          this.wordService.addVocabulary(vocabulary);
          alert('CSV 词汇表导入成功！');
        } else if (fileName.endsWith('.json')) {
          const text = await file.text();
          const vocabulary = this.parseJSON(text);
          this.wordService.addVocabulary(vocabulary);
          alert('JSON 词汇表导入成功！');
        } else {
          alert('不支持的文件格式！请上传 .pdf、.csv 或 .json 文件。');
        }
      } catch (error) {
        console.error('导入失败:', error);
        alert('词汇表导入失败！');
      }
    }
  }
  private splitCSVLine(line: string): string[] {
    const fields: string[] = [];
    let currentField = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        insideQuotes = !insideQuotes;
        continue;
      }

      if (char === ',' && !insideQuotes) {
        fields.push(currentField.trim());
        currentField = '';
        continue;
      }

      currentField += char;
    }

    // 添加最后一个字段
    fields.push(currentField.trim());

    return fields;
  }

  private parseCSV(csvText: string): VocabularyEntry[] {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    const vocabulary: VocabularyEntry[] = [];

    // 跳过标题行
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const fields = this.splitCSVLine(line);

      if (fields.length < 4) {
        console.log('Skipping invalid line:', line);
        continue;
      }

      const [index, word, pronunciation, definition] = fields;

      if (!word) {
        console.log('Skipping invalid word:', word);
        continue;
      }

      // 清理定义字段，移除 HTML 标签并规范化空格
      const cleanDefinition = definition
        .replace(/<[^>]+>/g, ' ') // 移除 HTML 标签
        .replace(/\s+/g, ' ') // 合并多余空格
        .replace(/"/g, '') // 移除引号
        .trim();

      vocabulary.push({
        word: word.replace(/"/g, ''),
        pronunciation: pronunciation?.replace(/"/g, '') || undefined,
        definition: cleanDefinition || undefined,
      });
    }

    return vocabulary;
  }
  private parseJSON(jsonText: string): VocabularyEntry[] {
    const data = JSON.parse(jsonText);
    if (!Array.isArray(data)) {
      throw new Error('JSON 文件必须包含一个数组！');
    }

    return data.map((item: any) => {
      if (!item.word) {
        throw new Error('JSON 条目必须包含 "word" 字段！');
      }
      return {
        word: item.word,
        pronunciation: item.pronunciation,
        definition: item.definition,
      };
    });
  }
}