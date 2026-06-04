import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonButton, IonIcon, IonInput, IonSpinner, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { saveOutline, cubeOutline, pricetagOutline, layersOutline, documentTextOutline } from 'ionicons/icons';
import { ProdutoService } from '../../services/produto';
import { Produto } from '../../models/produto.model';

@Component({
  selector: 'app-cadastro-produto',
  templateUrl: './cadastro-produto.page.html',
  styleUrls: ['./cadastro-produto.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonButton, IonIcon, IonInput, IonSpinner
  ]
})
export class CadastroProdutoPage implements OnInit {
  produto: Produto = { nome: '', descricao: '', preco: 0, estoque: 0, codigo_barras: '' };
  modoEdicao = false;
  salvando = false;
  erro = '';

  constructor(
    private produtoService: ProdutoService,
    private router: Router,
    private route: ActivatedRoute,
    private toastCtrl: ToastController
  ) {
    addIcons({ saveOutline, cubeOutline, pricetagOutline, layersOutline, documentTextOutline });
  }

  async ngOnInit() {
    const idParam = this.route.snapshot.queryParamMap.get('id');
    if (idParam) {
      const id = parseInt(idParam, 10);
      if (!isNaN(id)) {
        this.modoEdicao = true;
        this.salvando = true;
        try {
          const produto = await this.produtoService.buscarPorId(id);
          if (produto) {
            this.produto = { ...produto };
          } else {
            this.erro = 'Produto não encontrado.';
          }
        } catch (e: any) {
          this.erro = e.message || 'Erro ao carregar produto.';
        } finally {
          this.salvando = false;
        }
      }
    }
  }

  async salvar() {
    this.erro = '';
    this.salvando = true;
    try {
      if (this.modoEdicao) {
        await this.produtoService.atualizar(this.produto);
        const toast = await this.toastCtrl.create({
          message: '✅ Produto atualizado com sucesso!',
          duration: 2500,
          position: 'bottom',
          color: 'success'
        });
        await toast.present();
      } else {
        await this.produtoService.cadastrar(this.produto);
        const toast = await this.toastCtrl.create({
          message: '✅ Produto cadastrado com sucesso!',
          duration: 2500,
          position: 'bottom',
          color: 'success'
        });
        await toast.present();
      }
      this.router.navigateByUrl('/lista-produtos', { replaceUrl: true });
    } catch (e: any) {
      this.erro = e.message || 'Erro ao salvar produto.';
    } finally {
      this.salvando = false;
    }
  }
}
