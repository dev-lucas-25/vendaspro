import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { DevolucaoPage } from './devolucao.page';
import { DevolucaoService } from '../../services/devolucao';
import { VendaService } from '../../services/venda';

describe('DevolucaoPage', () => {
  let component: DevolucaoPage;
  let fixture: ComponentFixture<DevolucaoPage>;

  const mockToastController = {
    create: jasmine.createSpy('create').and.returnValue(Promise.resolve({ present: jasmine.createSpy('present') })),
  };

  const mockVendaService = {
    listarVendas: jasmine.createSpy('listarVendas').and.returnValue(Promise.resolve([])),
    buscarPorId: jasmine.createSpy('buscarPorId').and.returnValue(Promise.resolve(null)),
  };

  const mockDevolucaoService = {
    registrarDevolucao: jasmine.createSpy('registrarDevolucao').and.returnValue(Promise.resolve()),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        { provide: ToastController, useValue: mockToastController },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } },
        { provide: VendaService, useValue: mockVendaService },
        { provide: DevolucaoService, useValue: mockDevolucaoService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DevolucaoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
