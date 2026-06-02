import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonButton, IonIcon, IonSpinner, IonSegment, IonSegmentButton, IonLabel,
  IonRefresher, IonRefresherContent, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { walletOutline, checkmarkCircleOutline, timeOutline, closeCircleOutline } from 'ionicons/icons';
import { FinanceiroService } from '../../services/financeiro';

@Component({
  selector: 'app-receber',
  templateUrl: './receber.page.html',
  styleUrls: ['./receber.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonButton, IonIcon, IonSpinner, IonSegment, IonSegmentButton, IonLabel,
    IonRefresher, IonRefresherContent
  ]
})
export class ReceberPage implements OnInit {
  recebimentos: any[] = [];
  carregando = true;
  filtro: 'todos' | 'Pendente' | 'Pago' | 'Cancelado' = 'todos';
  processandoId: number | null = null;

  constructor(
    private financeiroService: FinanceiroService,
    private toastCtrl: ToastController
  ) {
    addIcons({ walletOutline, checkmarkCircleOutline, timeOutline, closeCircleOutline });
  }

  async ngOnInit() { await this.carregar(); }
  async ionViewWillEnter() { await this.carregar(); }

  async carregar() {
    this.carregando = true;
    try {
      const status = this.filtro === 'todos' ? undefined : this.filtro as any;
      this.recebimentos = await this.financeiroService.listarRecebimentos(status);
    } finally {
      this.carregando = false;
    }
  }

  async doRefresh(event: any) {
    await this.carregar();
    event.target.complete();
  }

  async registrarPagamento(rec: any) {
    this.processandoId = rec.id;
    try {
      await this.financeiroService.registrarPagamento(rec.id);
      const toast = await this.toastCtrl.create({ message: '✅ Pagamento registrado!', duration: 2500, color: 'success', position: 'bottom' });
      await toast.present();
      await this.carregar();
    } catch (e: any) {
      const toast = await this.toastCtrl.create({ message: `❌ ${e.message}`, duration: 3000, color: 'danger', position: 'bottom' });
      await toast.present();
    } finally {
      this.processandoId = null;
    }
  }

  statusClass(status: string): string {
    if (status === 'Pago') return 'badge-success';
    if (status === 'Pendente') return 'badge-warning';
    return 'badge-danger';
  }

  formatarData(iso: string): string {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }

  get totalPendente(): number {
    return this.recebimentos.filter(r => r.status === 'Pendente').reduce((a, r) => a + r.valor, 0);
  }
}
