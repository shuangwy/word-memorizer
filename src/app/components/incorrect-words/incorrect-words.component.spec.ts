import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncorrectWordsComponent } from './incorrect-words.component';

describe('IncorrectWordsComponent', () => {
  let component: IncorrectWordsComponent;
  let fixture: ComponentFixture<IncorrectWordsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncorrectWordsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IncorrectWordsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
