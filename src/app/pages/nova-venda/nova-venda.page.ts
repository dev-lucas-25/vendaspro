import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonButton, IonIcon, IonInput, IonSelect, IonSelectOption, IonSpinner,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline, trashOutline, cartOutline, searchOutline,
  checkmarkCircleOutline, removeOutline, addCircleOutline
} from 'ionicons/icons';
import { VendaService } from '../../services/venda';
import { ClienteService } from '../../services/cliente';
import { ProdutoService } from '../../services/produto';
import { Cliente } from '../../models/cliente.model';
import { Produto } from '../../models/produto.model';
import { ItemVenda } from '../../models/item-venda.model';

interface ItemCarrinho {
  produto: Produto;
  quantidade: number;
  subtotal: number;
}

@Component({
  selector: 'app-nova-venda',
  templateUrl: './nova-venda.page.html',
  styleUrls: ['./nova-venda.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonButton, IonIcon, IonInput, IonSelect, IonSelectOption, IonSpinner
  ]
})
export class NovaVendaPage implements OnInit {
  clientes: Cliente[] = [];
  produtos: Produto[] = [];
  clienteSelecionadoId: number | null = null;
  carrinho: ItemCarrinho[] = [];
  termoProduto = '';
  produtosFiltrados: Produto[] = [];
  formaPagamento = 'Dinheiro';
  dataVencimento: string | null = null;
  finalizando = false;
  erro = '';

  constructor(
    private vendaService: VendaService,
    private clienteService: ClienteService,
    private produtoService: ProdutoService,
    private router: Router,
    private toastCtrl: ToastController
  ) {
    addIcons({
      addOutline, trashOutline, cartOutline, searchOutline,
      checkmarkCircleOutline, removeOutline, addCircleOutline
    });
  }

  async ngOnInit() {
    await this.carregarDados();
  }

  async carregarDados() {
    const [clientes, produtos] = await Promise.all([
      this.clienteService.listar(),
      this.produtoService.listar()
    ]);
    this.clientes = clientes;
    this.produtos = produtos;
    this.produtosFiltrados = produtos.filter(p => p.estoque > 0);
  }

  filtrarProdutos() {
    const t = this.termoProduto.toLowerCase().trim();
    this.produtosFiltrados = this.produtos.filter(p =>
      p.estoque > 0 &&
      (p.nome.toLowerCase().includes(t) || p.codigo_barras.includes(t))
    );
  }

  adicionarProduto(produto: Produto) {
    const existente = this.carrinho.find(i => i.produto.id === produto.id);
    if (existente) {
      if (existente.quantidade < produto.estoque) {
        existente.quantidade++;
        existente.subtotal = existente.quantidade * produto.preco;
      }
    } else {
      this.carrinho.push({
        produto,
        quantidade: 1,
        subtotal: produto.preco
      });
    }
    this.termoProduto = '';
    this.produtosFiltrados = this.produtos.filter(p => p.estoque > 0);
  }

  incrementar(item: ItemCarrinho) {
    if (item.quantidade < item.produto.estoque) {
      item.quantidade++;
      item.subtotal = item.quantidade * item.produto.preco;
    }
  }

  decrementar(item: ItemCarrinho) {
    if (item.quantidade > 1) {
      item.quantidade--;
      item.subtotal = item.quantidade * item.produto.preco;
    } else {
      this.remover(item);
    }
  }

  remover(item: ItemCarrinho) {
    this.carrinho = this.carrinho.filter(i => i !== item);
  }

  get total(): number {
    return this.carrinho.reduce((acc, i) => acc + i.subtotal, 0);
  }

  get podeFinalizarVenda(): boolean {
    return !!this.clienteSelecionadoId && this.carrinho.length > 0;
  }

  async finalizar() {
    if (!this.podeFinalizarVenda) return;
    this.erro = '';

    if (!this.formaPagamento) {
      this.erro = 'Selecione a forma de pagamento.';
      return;
    }

    const metodo = this.formaPagamento.toLowerCase();
    const requiresDueDate = metodo === 'boleto' || metodo === 'crédito' || metodo === 'credito';
    if (requiresDueDate && !this.dataVencimento) {
      this.erro = 'Informe a data de vencimento para pagamentos a prazo.';
      return;
    }

    this.finalizando = true;

    try {
      const itens: ItemVenda[] = this.carrinho.map(item => ({
        produto_id: item.produto.id!,
        quantidade: item.quantidade,
        preco_unitario: item.produto.preco,
        subtotal: item.subtotal
      }));

      const vendaId = await this.vendaService.registrarVenda(
        {
          cliente_id: this.clienteSelecionadoId!,
          data_venda: new Date().toISOString(),
          subtotal: this.total,
          total: this.total,
          forma_pagamento: this.formaPagamento,
          data_vencimento: this.dataVencimento
        },
        itens
      );

      const toast = await this.toastCtrl.create({
        message: `✅ Venda #${vendaId} registrada com sucesso!`,
        duration: 3000,
        position: 'bottom',
        color: 'success'
      });
      await toast.present();
      this.router.navigateByUrl('/lista-vendas', { replaceUrl: true });
    } catch (e: any) {
      this.erro = e.message || 'Erro ao registrar a venda.';
    } finally {
      this.finalizando = false;
    }
  }

  nomeCliente(id: number | null): string {
    if (!id) return '';
    return this.clientes.find(c => c.id === id)?.nome || '';
  }

  requiresDueDate(): boolean {
    const metodo = this.formaPagamento?.toLowerCase() || '';
    return metodo === 'boleto' || metodo === 'crédito' || metodo === 'credito';
  }
}
