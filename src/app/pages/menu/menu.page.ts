import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon,
  IonButtons, AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  peopleOutline, cubeOutline, cartOutline, personOutline,
  statsChartOutline, returnDownBackOutline, walletOutline,
  logOutOutline, settingsOutline, arrowForwardOutline,
  informationCircleOutline
} from 'ionicons/icons';
import { UsuarioService } from '../../services/usuario';
import { RelatoriosService } from '../../services/relatorios';
import { Usuario } from '../../models/usuario.model';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
  standalone: true,
  imports: [
    CommonModule, IonContent, IonHeader, IonToolbar, IonTitle,
    IonButton, IonIcon, IonButtons
  ]
})
export class MenuPage implements OnInit {
  usuario: Usuario | null = null;
  currentDate = new Date();
  stats = { totalVendas: 0, valorVendido: 0, estoque: 0, pendentes: 0 };

  menuItems = [
    { label: 'Clientes',    icon: 'people-outline',             rota: '/lista-clientes',   cor: '#6C63FF', desc: 'Gerenciar cadastros' },
    { label: 'Produtos',    icon: 'cube-outline',               rota: '/lista-produtos',   cor: '#00D4AA', desc: 'Estoque e catálogo' },
    { label: 'Vendas',      icon: 'cart-outline',               rota: '/lista-vendas',     cor: '#FFB347', desc: 'Histórico de vendas' },
    { label: 'Nova Venda',  icon: 'arrow-forward-outline',      rota: '/nova-venda',       cor: '#FF4B6E', desc: 'Registrar venda' },
    { label: 'Financeiro',  icon: 'wallet-outline',             rota: '/receber',          cor: '#8B84FF', desc: 'Recebimentos' },
    { label: 'Devoluções',  icon: 'return-down-back-outline',   rota: '/devolucao',        cor: '#FF7F50', desc: 'Devoluções' },
    { label: 'Usuários',    icon: 'person-outline',             rota: '/lista-usuarios',   cor: '#20B2AA', desc: 'Controle de acesso' },
    { label: 'Relatórios',  icon: 'stats-chart-outline',        rota: '/relatorios',       cor: '#9370DB', desc: 'Análises' },
    { label: 'Sobre',       icon: 'information-circle-outline', rota: '/sobre',            cor: '#778899', desc: 'Sobre o app' },
  ];

  constructor(
    private usuarioService: UsuarioService,
    private relatoriosService: RelatoriosService,
    private router: Router,
    private alertCtrl: AlertController
  ) {
    addIcons({
      peopleOutline, cubeOutline, cartOutline, personOutline,
      statsChartOutline, returnDownBackOutline, walletOutline,
      logOutOutline, settingsOutline, arrowForwardOutline,
      informationCircleOutline
    });
  }

  async ngOnInit() {
    this.usuario = this.usuarioService.getLoggedUser();
    if (!this.usuario) {
      this.router.navigateByUrl('/login', { replaceUrl: true });
      return;
    }
    await this.carregarStats();
  }

  async ionViewWillEnter() {
    await this.carregarStats();
  }

  async carregarStats() {
    try {
      const [totalVendas, valorVendido, estoque, pendentes] = await Promise.all([
        this.relatoriosService.getTotalVendas(),
        this.relatoriosService.getValorVendido(),
        this.relatoriosService.getEstoqueAtual(),
        this.relatoriosService.getRecebimentosPendentes()
      ]);
      this.stats = {
        totalVendas,
        valorVendido,
        estoque,
        pendentes: pendentes.length
      };
    } catch {}
  }

  navegar(rota: string) {
    this.router.navigateByUrl(rota);
  }

  async sair() {
    const alert = await this.alertCtrl.create({
      header: 'Sair do Sistema',
      message: 'Deseja realmente sair?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Sair',
          handler: () => {
            this.usuarioService.logout();
            this.router.navigateByUrl('/login', { replaceUrl: true });
          }
        }
      ]
    });
    await alert.present();
  }

  get saudacao(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  }
}
