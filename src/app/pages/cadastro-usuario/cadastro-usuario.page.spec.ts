import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { CadastroUsuarioPage } from './cadastro-usuario.page';
import { UsuarioService } from '../../services/usuario';

describe('CadastroUsuarioPage', () => {
  let component: CadastroUsuarioPage;
  let fixture: ComponentFixture<CadastroUsuarioPage>;

  const mockToastController = {
    create: jasmine.createSpy('create').and.returnValue(Promise.resolve({ present: jasmine.createSpy('present') })),
  };

  const mockUsuarioService = {
    buscarPorId: jasmine.createSpy('buscarPorId').and.returnValue(Promise.resolve(null)),
    cadastrar: jasmine.createSpy('cadastrar').and.returnValue(Promise.resolve()),
    atualizar: jasmine.createSpy('atualizar').and.returnValue(Promise.resolve()),
    getLoggedUser: jasmine.createSpy('getLoggedUser').and.returnValue(null),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        { provide: ToastController, useValue: mockToastController },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } },
        { provide: UsuarioService, useValue: mockUsuarioService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CadastroUsuarioPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
