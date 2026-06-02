import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonButton, IonIcon, IonInput, IonItem, IonLabel, IonSpinner, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { saveOutline, personOutline, callOutline, mailOutline, cardOutline } from 'ionicons/icons';
import { ClienteService } from '../../services/cliente';
import { Cliente } from '../../models/cliente.model';

@Component({
  selector: 'app-cadastro-cliente',
  templateUrl: './cadastro-cliente.page.html',
  styleUrls: ['./cadastro-cliente.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonButton, IonIcon, IonInput, IonItem, IonLabel, IonSpinner
  ]
})
export class CadastroClientePage implements OnInit {
  cliente: Cliente = { nome: '', telefone: '', email: '', cpf: '' };
  salvando = false;
  erro = '';

  constructor(
    private clienteService: ClienteService,
    private router: Router,
    private toastCtrl: ToastController
  ) {
    addIcons({ saveOutline, personOutline, callOutline, mailOutline, cardOutline });
  }

  ngOnInit() {}

  async salvar() {
    this.erro = '';
    this.salvando = true;
    try {
      await this.clienteService.cadastrar(this.cliente);
      const toast = await this.toastCtrl.create({
        message: '✅ Cliente cadastrado com sucesso!',
        duration: 2500,
        position: 'bottom',
        color: 'success'
      });
      await toast.present();
      this.router.navigateByUrl('/lista-clientes', { replaceUrl: true });
    } catch (e: any) {
      this.erro = e.message || 'Erro ao cadastrar cliente.';
    } finally {
      this.salvando = false;
    }
  }

  formatarCpf(event: any) {
    let v = event.detail.value?.replace(/\D/g, '') || '';
    if (v.length > 3) v = v.slice(0, 3) + '.' + v.slice(3);
    if (v.length > 7) v = v.slice(0, 7) + '.' + v.slice(7);
    if (v.length > 11) v = v.slice(0, 11) + '-' + v.slice(11);
    if (v.length > 14) v = v.slice(0, 14);
    this.cliente.cpf = v;
  }

  formatarTelefone(event: any) {
    let v = event.detail.value?.replace(/\D/g, '') || '';
    if (v.length > 2) v = '(' + v.slice(0, 2) + ') ' + v.slice(2);
    if (v.length > 10) v = v.slice(0, 10) + '-' + v.slice(10);
    if (v.length > 15) v = v.slice(0, 15);
    this.cliente.telefone = v;
  }
}
