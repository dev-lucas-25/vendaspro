import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { DetalhesVendaPage } from './detalhes-venda.page';
import { VendaService } from '../../services/venda';
import { FinanceiroService } from '../../services/financeiro';

describe('DetalhesVendaPage', () => {
  let component: DetalhesVendaPage;
  let fixture: ComponentFixture<DetalhesVendaPage>;

  const mockToastController = {
    create: jasmine.createSpy('create').and.returnValue(Promise.resolve({ present: jasmine.createSpy('present') })),
  };

  const mockVendaService = {
    buscarPorId: jasmine.createSpy('buscarPorId').and.returnValue(Promise.resolve(null)),
  };

  const mockFinanceiroService = {
    buscarPorVenda: jasmine.createSpy('buscarPorVenda').and.returnValue(Promise.resolve(null)),
    registrarPagamento: jasmine.createSpy('registrarPagamento').and.returnValue(Promise.resolve()),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        { provide: ToastController, useValue: mockToastController },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({}) } } },
        { provide: VendaService, useValue: mockVendaService },
        { provide: FinanceiroService, useValue: mockFinanceiroService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DetalhesVendaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
