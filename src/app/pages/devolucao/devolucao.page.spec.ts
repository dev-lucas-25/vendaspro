import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DevolucaoPage } from './devolucao.page';

describe('DevolucaoPage', () => {
  let component: DevolucaoPage;
  let fixture: ComponentFixture<DevolucaoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DevolucaoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
