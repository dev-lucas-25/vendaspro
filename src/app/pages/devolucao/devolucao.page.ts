import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonButton, IonIcon, IonInput, IonSelect, IonSelectOption, IonSpinner,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { returnDownBackOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { DevolucaoService } from '../../services/devolucao';
import { VendaService } from '../../services/venda';
import { Venda } from '../../models/venda.model';

@Component({
  selector: 'app-devolucao',
  templateUrl: './devolucao.page.html',
  styleUrls: ['./devolucao.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonButton, IonIcon, IonInput, IonSelect, IonSelectOption, IonSpinner
  ]
})
export class DevolucaoPage implements OnInit {
  vendas: Venda[] = [];
  vendaSelecionadaId: number | null = null;
  vendaDetalhe: Venda | null = null;
  produtoSelecionadoId: number | null = null;
  quantidade = 1;
  processando = false;
  carregandoVenda = false;
  erro = '';
  sucesso = '';

  constructor(
    private devolucaoService: DevolucaoService,
    private vendaService: VendaService,
    private route: ActivatedRoute,
    private toastCtrl: ToastController
  ) {
    addIcons({ returnDownBackOutline, checkmarkCircleOutline });
  }

  async ngOnInit() {
    this.vendas = await this.vendaService.listarVendas();
    const vendaId = this.route.snapshot.queryParamMap.get('vendaId');
    if (vendaId) {
      this.vendaSelecionadaId = +vendaId;
      await this.carregarVenda();
    }
  }

  async carregarVenda() {
    if (!this.vendaSelecionadaId) return;
    const id = Number(this.vendaSelecionadaId);
    if (isNaN(id)) return;
    this.carregandoVenda = true;
    this.vendaDetalhe = null;
    this.produtoSelecionadoId = null;
    try {
      this.vendaDetalhe = await this.vendaService.buscarPorId(id);
      if (this.vendaDetalhe && !Array.isArray(this.vendaDetalhe.itens)) {
        this.vendaDetalhe.itens = [];
      }
    } finally {
      this.carregandoVenda = false;
    }
  }

  async registrarDevolucao() {
    if (!this.vendaSelecionadaId || !this.produtoSelecionadoId || this.quantidade <= 0) return;
    this.processando = true;
    this.erro = '';
    try {
      await this.devolucaoService.registrarDevolucao(this.vendaSelecionadaId, this.produtoSelecionadoId, this.quantidade);
      const toast = await this.toastCtrl.create({ message: '✅ Devolução registrada com sucesso!', duration: 2500, color: 'success', position: 'bottom' });
      await toast.present();
      this.produtoSelecionadoId = null;
      this.quantidade = 1;
      await this.carregarVenda();
      // Recarregar lista de vendas para refletir alterações no select
      this.vendas = await this.vendaService.listarVendas();
    } catch (e: any) {
      this.erro = e.message || 'Erro ao registrar devolução.';
    } finally {
      this.processando = false;
    }
  }

  get podeDevolver(): boolean {
    return !!this.vendaSelecionadaId && !!this.produtoSelecionadoId && this.quantidade > 0;
  }
}
