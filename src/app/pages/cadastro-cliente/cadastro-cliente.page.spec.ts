import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { CadastroClientePage } from './cadastro-cliente.page';
import { ClienteService } from '../../services/cliente';

describe('CadastroClientePage', () => {
  let component: CadastroClientePage;
  let fixture: ComponentFixture<CadastroClientePage>;

  const mockToastController = {
    create: jasmine.createSpy('create').and.returnValue(Promise.resolve({ present: jasmine.createSpy('present') })),
  };

  const mockClienteService = {
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
        { provide: ClienteService, useValue: mockClienteService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CadastroClientePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
