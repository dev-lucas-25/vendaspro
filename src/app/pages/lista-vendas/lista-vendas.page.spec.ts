import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListaVendasPage } from './lista-vendas.page';

describe('ListaVendasPage', () => {
  let component: ListaVendasPage;
  let fixture: ComponentFixture<ListaVendasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ListaVendasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
