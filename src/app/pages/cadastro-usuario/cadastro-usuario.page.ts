import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonButton, IonIcon, IonInput, IonSpinner, IonSelect, IonSelectOption,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { saveOutline, personOutline, lockClosedOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { UsuarioService } from '../../services/usuario';
import { Usuario } from '../../models/usuario.model';

@Component({
  selector: 'app-cadastro-usuario',
  templateUrl: './cadastro-usuario.page.html',
  styleUrls: ['./cadastro-usuario.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonButton, IonIcon, IonInput, IonSpinner, IonSelect, IonSelectOption
  ]
})
export class CadastroUsuarioPage implements OnInit {
  usuario: Usuario = { nome: '', login: '', senha: '', situacao: 'Ativo' };
  confirmarSenha = '';
  modoEdicao = false;
  salvando = false;
  erro = '';
  isCurrentUser = false;

  constructor(
    private usuarioService: UsuarioService,
    private router: Router,
    private route: ActivatedRoute,
    private toastCtrl: ToastController
  ) {
    addIcons({ saveOutline, personOutline, lockClosedOutline, checkmarkCircleOutline });
  }

  async ngOnInit() {
    const idParam = this.route.snapshot.queryParamMap.get('id');
    if (idParam) {
      const id = parseInt(idParam, 10);
      if (!isNaN(id)) {
        this.modoEdicao = true;
        this.salvando = true;
        try {
          const u = await this.usuarioService.buscarPorId(id);
          if (u) {
            this.usuario = {
              id: u.id,
              nome: u.nome,
              login: u.login,
              senha: '', // Senha vazia por segurança na edição
              situacao: u.situacao
            };
            this.confirmarSenha = '';
            
            // Verificar se o usuário que está sendo editado é o usuário logado
            const logged = this.usuarioService.getLoggedUser();
            this.isCurrentUser = logged ? logged.id === u.id : false;
          } else {
            this.erro = 'Usuário não encontrado.';
          }
        } catch (e: any) {
          this.erro = e.message || 'Erro ao carregar usuário.';
        } finally {
          this.salvando = false;
        }
      }
    }
  }

  async salvar() {
    this.erro = '';

    if (!this.usuario.nome || !this.usuario.nome.trim()) {
      this.erro = 'Nome do usuário é obrigatório.';
      return;
    }
    if (!this.usuario.login || !this.usuario.login.trim()) {
      this.erro = 'Login do usuário é obrigatório.';
      return;
    }

    if (!this.modoEdicao) {
      if (!this.usuario.senha || !this.usuario.senha.trim()) {
        this.erro = 'Senha do usuário é obrigatória.';
        return;
      }
      if (this.usuario.senha !== this.confirmarSenha) {
        this.erro = 'As senhas informadas não coincidem.';
        return;
      }
    } else {
      // Na edição, se digitar senha, precisa confirmar
      if (this.usuario.senha && this.usuario.senha.trim()) {
        if (this.usuario.senha !== this.confirmarSenha) {
          this.erro = 'As senhas informadas não coincidem.';
          return;
        }
      }
    }

    this.salvando = true;
    try {
      if (this.modoEdicao) {
        await this.usuarioService.atualizar(this.usuario);
        const toast = await this.toastCtrl.create({
          message: '✅ Usuário atualizado com sucesso!',
          duration: 2500,
          position: 'bottom',
          color: 'success'
        });
        await toast.present();
      } else {
        await this.usuarioService.cadastrar(this.usuario);
        const toast = await this.toastCtrl.create({
          message: '✅ Usuário cadastrado com sucesso!',
          duration: 2500,
          position: 'bottom',
          color: 'success'
        });
        await toast.present();
      }
      this.router.navigateByUrl('/lista-usuarios', { replaceUrl: true });
    } catch (e: any) {
      this.erro = e.message || 'Erro ao salvar usuário.';
    } finally {
      this.salvando = false;
    }
  }
}
