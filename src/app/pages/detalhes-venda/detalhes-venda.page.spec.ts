import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DetalhesVendaPage } from './detalhes-venda.page';

describe('DetalhesVendaPage', () => {
  let component: DetalhesVendaPage;
  let fixture: ComponentFixture<DetalhesVendaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DetalhesVendaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
