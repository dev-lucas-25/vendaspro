import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NovaVendaPage } from './nova-venda.page';

describe('NovaVendaPage', () => {
  let component: NovaVendaPage;
  let fixture: ComponentFixture<NovaVendaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(NovaVendaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
