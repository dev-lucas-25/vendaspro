import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonButton, IonIcon, IonSpinner, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { returnDownBackOutline, walletOutline, receiptOutline, personOutline, calendarOutline } from 'ionicons/icons';
import { VendaService } from '../../services/venda';
import { FinanceiroService } from '../../services/financeiro';
import { Venda } from '../../models/venda.model';
import { Recebimento } from '../../models/recebimento.model';

@Component({
  selector: 'app-detalhes-venda',
  templateUrl: './detalhes-venda.page.html',
  styleUrls: ['./detalhes-venda.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonButton, IonIcon, IonSpinner
  ]
})
export class DetalhesVendaPage implements OnInit {
  venda: Venda | null = null;
  recebimento: Recebimento | null = null;
  carregando = true;
  processando = false;

  constructor(
    private vendaService: VendaService,
    private financeiroService: FinanceiroService,
    private route: ActivatedRoute,
    private router: Router,
    private toastCtrl: ToastController
  ) {
    addIcons({ returnDownBackOutline, walletOutline, receiptOutline, personOutline, calendarOutline });
  }

  async ngOnInit() {
    const id = this.route.snapshot.queryParamMap.get('id');
    if (id) await this.carregar(+id);
  }

  async carregar(id: number) {
    this.carregando = true;
    try {
      this.venda = await this.vendaService.buscarPorId(id);
      if (this.venda) {
        this.recebimento = await this.financeiroService.buscarPorVenda(id);
      }
    } finally {
      this.carregando = false;
    }
  }

  async registrarPagamento() {
    if (!this.recebimento) return;
    this.processando = true;
    try {
      await this.financeiroService.registrarPagamento(this.recebimento.id!);
      const toast = await this.toastCtrl.create({ message: '✅ Pagamento registrado!', duration: 2500, color: 'success', position: 'bottom' });
      await toast.present();
      await this.carregar(this.venda!.id!);
    } catch (e: any) {
      const toast = await this.toastCtrl.create({ message: `❌ ${e.message}`, duration: 3000, color: 'danger', position: 'bottom' });
      await toast.present();
    } finally {
      this.processando = false;
    }
  }

  irParaDevolucao() {
    this.router.navigate(['/devolucao'], { queryParams: { vendaId: this.venda!.id } });
  }

  formatarData(iso: string): string {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  statusClass(status: string): string {
    if (status === 'Pago') return 'badge-success';
    if (status === 'Pendente') return 'badge-warning';
    return 'badge-danger';
  }
}
