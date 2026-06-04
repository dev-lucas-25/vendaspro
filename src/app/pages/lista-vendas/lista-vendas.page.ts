import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonIcon, IonSpinner, IonRefresher, IonRefresherContent, IonFab, IonFabButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cartOutline, addOutline, calendarOutline, personOutline, arrowForwardOutline } from 'ionicons/icons';
import { VendaService } from '../../services/venda';
import { Venda } from '../../models/venda.model';

@Component({
  selector: 'app-lista-vendas',
  templateUrl: './lista-vendas.page.html',
  styleUrls: ['./lista-vendas.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonIcon, IonSpinner, IonRefresher, IonRefresherContent, IonFab, IonFabButton
  ]
})
export class ListaVendasPage implements OnInit {
  vendas: Venda[] = [];
  carregando = true;

  constructor(
    private vendaService: VendaService,
    private router: Router
  ) {
    addIcons({ cartOutline, addOutline, calendarOutline, personOutline, arrowForwardOutline });
  }

  async ngOnInit() { await this.carregar(); }
  async ionViewWillEnter() { await this.carregar(); }

  async carregar() {
    this.carregando = true;
    try {
      this.vendas = await this.vendaService.listarVendas();
    } finally {
      this.carregando = false;
    }
  }

  async doRefresh(event: any) {
    await this.carregar();
    event.target.complete();
  }

  verDetalhes(venda: Venda) {
    this.router.navigate(['/detalhes-venda', venda.id]);
  }

  novaVenda() {
    this.router.navigateByUrl('/nova-venda');
  }

  formatarData(iso: string): string {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
