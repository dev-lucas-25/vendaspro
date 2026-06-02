import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonIcon, IonSpinner, IonRefresher, IonRefresherContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { statsChartOutline, trendingUpOutline, cubeOutline, walletOutline, alertCircleOutline } from 'ionicons/icons';
import { RelatoriosService } from '../../services/relatorios';

@Component({
  selector: 'app-relatorios',
  templateUrl: './relatorios.page.html',
  styleUrls: ['./relatorios.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonIcon, IonSpinner, IonRefresher, IonRefresherContent
  ]
})
export class RelatoriosPage implements OnInit {
  carregando = true;
  totalVendas = 0;
  valorVendido = 0;
  estoque = 0;
  produtosMaisVendidos: any[] = [];
  estoqueBaixo: any[] = [];
  pendentes = 0;

  constructor(private relatoriosService: RelatoriosService) {
    addIcons({ statsChartOutline, trendingUpOutline, cubeOutline, walletOutline, alertCircleOutline });
  }

  async ngOnInit() { await this.carregar(); }
  async ionViewWillEnter() { await this.carregar(); }

  async carregar() {
    this.carregando = true;
    try {
      const [totalVendas, valorVendido, estoque, produtosMaisVendidos, estoqueBaixo, pendentes] = await Promise.all([
        this.relatoriosService.getTotalVendas(),
        this.relatoriosService.getValorVendido(),
        this.relatoriosService.getEstoqueAtual(),
        this.relatoriosService.getProdutosMaisVendidos(5),
        this.relatoriosService.getEstoqueBaixo(10),
        this.relatoriosService.getRecebimentosPendentes()
      ]);
      this.totalVendas = totalVendas;
      this.valorVendido = valorVendido;
      this.estoque = estoque;
      this.produtosMaisVendidos = produtosMaisVendidos;
      this.estoqueBaixo = estoqueBaixo;
      this.pendentes = pendentes.length;
    } finally {
      this.carregando = false;
    }
  }

  async doRefresh(event: any) {
    await this.carregar();
    event.target.complete();
  }
}
