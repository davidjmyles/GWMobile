import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResubmitPage } from './resubmit.page';

describe('ResubmitPage', () => {
  let component: ResubmitPage;
  let fixture: ComponentFixture<ResubmitPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ResubmitPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
