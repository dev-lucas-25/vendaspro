import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonFab, IonFabButton, IonIcon, IonSearchbar, IonSpinner,
  IonRefresher, IonRefresherContent, IonBadge, AlertController, ToastController,
  IonButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, personOutline, trashOutline, createOutline, powerOutline } from 'ionicons/icons';
import { UsuarioService } from '../../services/usuario';
import { Usuario } from '../../models/usuario.model';

@Component({
  selector: 'app-lista-usuarios',
  templateUrl: './lista-usuarios.page.html',
  styleUrls: ['./lista-usuarios.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonFab, IonFabButton, IonIcon, IonSearchbar, IonSpinner,
    IonRefresher, IonRefresherContent, IonBadge, IonButton
  ]
})
export class ListaUsuariosPage implements OnInit {
  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];
  termoBusca = '';
  carregando = true;
  loggedUser: Usuario | null = null;

  constructor(
    private usuarioService: UsuarioService,
    private router: Router,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {
    addIcons({ addOutline, personOutline, trashOutline, createOutline, powerOutline });
  }

  async ngOnInit() {
    this.loggedUser = this.usuarioService.getLoggedUser();
    await this.carregar();
  }

  async ionViewWillEnter() {
    this.loggedUser = this.usuarioService.getLoggedUser();
    await this.carregar();
  }

  async carregar() {
    this.carregando = true;
    try {
      this.usuarios = await this.usuarioService.listar();
      this.filtrar();
    } catch {
      // Ignorar ou mostrar erro básico
    } finally {
      this.carregando = false;
    }
  }

  async doRefresh(event: any) {
    await this.carregar();
    event.target.complete();
  }

  filtrar() {
    if (!this.termoBusca.trim()) {
      this.usuariosFiltrados = this.usuarios;
    } else {
      const t = this.termoBusca.toLowerCase();
      this.usuariosFiltrados = this.usuarios.filter(u =>
        u.nome.toLowerCase().includes(t) ||
        u.login.toLowerCase().includes(t)
      );
    }
  }

  novoUsuario() {
    this.router.navigateByUrl('/cadastro-usuario');
  }

  editarUsuario(id: number) {
    this.router.navigate(['/cadastro-usuario'], { queryParams: { id } });
  }

  async excluirUsuario(usuario: Usuario) {
    if (!usuario.id) return;

    if (this.loggedUser && this.loggedUser.id === usuario.id) {
      const toast = await this.toastCtrl.create({
        message: '⚠️ Você não pode excluir a si mesmo.',
        duration: 3000,
        color: 'warning',
        position: 'bottom'
      });
      await toast.present();
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Excluir Usuário',
      message: `Tem certeza que deseja excluir definitivamente o usuário "${usuario.nome}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: async () => {
            try {
              await this.usuarioService.excluir(usuario.id!);
              const toast = await this.toastCtrl.create({
                message: '✅ Usuário excluído permanentemente!',
                duration: 2500,
                color: 'success',
                position: 'bottom'
              });
              await toast.present();
              await this.carregar();
            } catch (e: any) {
              const msg = e.message || '';
              if (msg.includes('vendas vinculadas')) {
                const infoAlert = await this.alertCtrl.create({
                  header: 'Bloqueio de Exclusão',
                  message: `O usuário "${usuario.nome}" não pode ser excluído fisicamente pois existem vendas registradas por ele no sistema. Como alternativa, você pode inativá-lo para revogar seu acesso e preservar todo o histórico de auditoria do app.`,
                  buttons: ['Entendido']
                });
                await infoAlert.present();
              } else {
                const errorAlert = await this.alertCtrl.create({
                  header: 'Erro',
                  message: msg || 'Ocorreu um erro ao excluir o usuário.',
                  buttons: ['OK']
                });
                await errorAlert.present();
              }
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async alternarSituacao(usuario: Usuario) {
    if (!usuario.id) return;

    if (this.loggedUser && this.loggedUser.id === usuario.id) {
      const toast = await this.toastCtrl.create({
        message: '⚠️ Você não pode inativar seu próprio usuário em sessão.',
        duration: 3000,
        color: 'warning',
        position: 'bottom'
      });
      await toast.present();
      return;
    }

    const novaSituacao = usuario.situacao === 'Ativo' ? 'Inativo' : 'Ativo';
    const acaoLabel = novaSituacao === 'Ativo' ? 'ativar' : 'inativar';

    const alert = await this.alertCtrl.create({
      header: `${novaSituacao === 'Ativo' ? 'Ativar' : 'Inativar'} Usuário`,
      message: `Deseja realmente ${acaoLabel} o acesso do usuário "${usuario.nome}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: novaSituacao === 'Ativo' ? 'Ativar' : 'Inativar',
          handler: async () => {
            try {
              usuario.situacao = novaSituacao;
              await this.usuarioService.atualizar(usuario);
              const toast = await this.toastCtrl.create({
                message: `✅ Usuário ${novaSituacao === 'Ativo' ? 'ativado' : 'inativado'} com sucesso!`,
                duration: 2500,
                color: 'success',
                position: 'bottom'
              });
              await toast.present();
              await this.carregar();
            } catch (e: any) {
              const toast = await this.toastCtrl.create({
                message: e.message || 'Erro ao alterar situação.',
                duration: 3000,
                color: 'danger',
                position: 'bottom'
              });
              await toast.present();
            }
          }
        }
      ]
    });
    await alert.present();
  }

  iniciais(nome: string): string {
    if (!nome) return 'US';
    return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }
}
