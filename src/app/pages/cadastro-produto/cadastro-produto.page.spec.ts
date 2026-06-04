import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { CadastroProdutoPage } from './cadastro-produto.page';
import { ProdutoService } from '../../services/produto';

describe('CadastroProdutoPage', () => {
  let component: CadastroProdutoPage;
  let fixture: ComponentFixture<CadastroProdutoPage>;

  const mockToastController = {
    create: jasmine.createSpy('create').and.returnValue(Promise.resolve({ present: jasmine.createSpy('present') })),
  };

  const mockProdutoService = {
    buscarPorId: jasmine.createSpy('buscarPorId').and.returnValue(Promise.resolve(null)),
    cadastrar: jasmine.createSpy('cadastrar').and.returnValue(Promise.resolve()),
    atualizar: jasmine.createSpy('atualizar').and.returnValue(Promise.resolve()),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        { provide: ToastController, useValue: mockToastController },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } },
        { provide: ProdutoService, useValue: mockProdutoService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CadastroProdutoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
