import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonFab, IonFabButton, IonIcon, IonSearchbar, IonSpinner,
  IonRefresher, IonRefresherContent, IonBadge
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, cubeOutline, pricetagOutline, alertCircleOutline } from 'ionicons/icons';
import { ProdutoService } from '../../services/produto';
import { Produto } from '../../models/produto.model';

@Component({
  selector: 'app-lista-produtos',
  templateUrl: './lista-produtos.page.html',
  styleUrls: ['./lista-produtos.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonFab, IonFabButton, IonIcon, IonSearchbar, IonSpinner,
    IonRefresher, IonRefresherContent, IonBadge
  ]
})
export class ListaProdutosPage implements OnInit {
  produtos: Produto[] = [];
  produtosFiltrados: Produto[] = [];
  termoBusca = '';
  carregando = true;

  constructor(
    private produtoService: ProdutoService,
    private router: Router
  ) {
    addIcons({ addOutline, cubeOutline, pricetagOutline, alertCircleOutline });
  }

  async ngOnInit() { await this.carregar(); }
  async ionViewWillEnter() { await this.carregar(); }

  async carregar() {
    this.carregando = true;
    try {
      this.produtos = await this.produtoService.listar();
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
      this.produtosFiltrados = this.produtos;
    } else {
      const t = this.termoBusca.toLowerCase();
      this.produtosFiltrados = this.produtos.filter(p =>
        p.nome.toLowerCase().includes(t) ||
        (p.descricao || '').toLowerCase().includes(t) ||
        p.codigo_barras.includes(t)
      );
    }
  }

  novoProduto() {
    this.router.navigateByUrl('/cadastro-produto');
  }

  estoqueClass(estoque: number): string {
    if (estoque === 0) return 'estoque-zero';
    if (estoque <= 5) return 'estoque-baixo';
    return 'estoque-ok';
  }

  estoqueLabel(estoque: number): string {
    if (estoque === 0) return 'Sem estoque';
    if (estoque <= 5) return 'Estoque baixo';
    return `${estoque} un.`;
  }
}
