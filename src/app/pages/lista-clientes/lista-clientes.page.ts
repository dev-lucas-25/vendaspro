import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonFab, IonFabButton, IonIcon, IonSearchbar, IonSpinner,
  IonRefresher, IonRefresherContent, AlertController, ToastController
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
    IonRefresher, IonRefresherContent
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

  iniciais(nome: string): string {
    return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }
}
