import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WordImportComponent } from './word-import.component';

describe('WordImportComponent', () => {
  let component: WordImportComponent;
  let fixture: ComponentFixture<WordImportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WordImportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WordImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
