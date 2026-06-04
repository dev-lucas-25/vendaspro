import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonFab, IonFabButton, IonButton, IonIcon, IonSearchbar, IonSpinner,
  IonRefresher, IonRefresherContent, IonBadge, AlertController, ToastController
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
    IonFab, IonFabButton, IonButton, IonIcon, IonSearchbar, IonSpinner,
    IonRefresher, IonRefresherContent
  ]
})
export class ListaProdutosPage implements OnInit {
  produtos: Produto[] = [];
  produtosFiltrados: Produto[] = [];
  termoBusca = '';
  carregando = true;

  constructor(
    private produtoService: ProdutoService,
    private router: Router,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
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

  editarProduto(id: number) {
    this.router.navigate(['/cadastro-produto'], { queryParams: { id } });
  }

  async excluirProduto(produto: Produto) {
    if (!produto.id) {
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Excluir Produto',
      message: `Tem certeza que deseja excluir o produto "${produto.nome}"? Esta ação não pode ser desfeita.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: async () => {
            try {
              await this.produtoService.excluir(produto.id!);
              const toast = await this.toastCtrl.create({
                message: '✅ Produto excluído com sucesso!',
                duration: 2500,
                position: 'bottom',
                color: 'success'
              });
              await toast.present();
              await this.carregar();
            } catch (e: any) {
              const toast = await this.toastCtrl.create({
                message: e.message || 'Erro ao excluir produto.',
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
