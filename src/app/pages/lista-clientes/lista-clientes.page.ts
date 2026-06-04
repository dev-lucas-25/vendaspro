import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonFab, IonFabButton, IonIcon, IonSearchbar, IonSpinner,
  IonRefresher, IonRefresherContent, AlertController, ToastController, IonButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, personOutline, callOutline, mailOutline, trashOutline, createOutline } from 'ionicons/icons';
import { ClienteService } from '../../services/cliente';
import { Cliente } from '../../models/cliente.model';

@Component({
  selector: 'app-lista-clientes',
  templateUrl: './lista-clientes.page.html',
  styleUrls: ['./lista-clientes.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonFab, IonFabButton, IonIcon, IonSearchbar, IonSpinner,
    IonRefresher, IonRefresherContent, IonButton
  ]
})
export class ListaClientesPage implements OnInit {
  clientes: Cliente[] = [];
  clientesFiltrados: Cliente[] = [];
  termoBusca = '';
  carregando = true;

  constructor(
    private clienteService: ClienteService,
    private router: Router,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {
    addIcons({ addOutline, personOutline, callOutline, mailOutline, trashOutline, createOutline });
  }

  async ngOnInit() {
    await this.carregar();
  }

  async ionViewWillEnter() {
    await this.carregar();
  }

  async carregar() {
    this.carregando = true;
    try {
      this.clientes = await this.clienteService.listar();
      this.filtrar();
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
      this.clientesFiltrados = this.clientes;
    } else {
      const t = this.termoBusca.toLowerCase();
      this.clientesFiltrados = this.clientes.filter(c =>
        c.nome.toLowerCase().includes(t) ||
        c.cpf.includes(t) ||
        c.email.toLowerCase().includes(t) ||
        c.telefone.includes(t)
      );
    }
  }

  novoCliente() {
    this.router.navigateByUrl('/cadastro-cliente');
  }

  editarCliente(id: number) {
    this.router.navigate(['/cadastro-cliente'], { queryParams: { id } });
  }

  async excluirCliente(cliente: Cliente) {
    if (!cliente.id) {
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Excluir Cliente',
      message: `Tem certeza que deseja excluir o cliente "${cliente.nome}"? Esta ação não pode ser desfeita.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: async () => {
            try {
              await this.clienteService.excluir(cliente.id!);
              const toast = await this.toastCtrl.create({
                message: '✅ Cliente excluído com sucesso!',
                duration: 2500,
                position: 'bottom',
                color: 'success'
              });
              await toast.present();
              await this.carregar();
            } catch (e: any) {
              const toast = await this.toastCtrl.create({
                message: e.message || 'Erro ao excluir cliente.',
                duration: 3000,
                position: 'bottom',
                color: 'danger'
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
    return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }
}
