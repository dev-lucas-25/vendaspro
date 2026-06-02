import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
{
  path: '',
  redirectTo: 'login',
  pathMatch: 'full',
},
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'menu',
    loadComponent: () => import('./pages/menu/menu.page').then( m => m.MenuPage)
  },
  {
    path: 'cadastro-usuario',
    loadComponent: () => import('./pages/cadastro-usuario/cadastro-usuario.page').then( m => m.CadastroUsuarioPage)
  },
  {
    path: 'lista-usuarios',
    loadComponent: () => import('./pages/lista-usuarios/lista-usuarios.page').then( m => m.ListaUsuariosPage)
  },
  {
    path: 'cadastro-produto',
    loadComponent: () => import('./pages/cadastro-produto/cadastro-produto.page').then( m => m.CadastroProdutoPage)
  },
  {
    path: 'lista-produtos',
    loadComponent: () => import('./pages/lista-produtos/lista-produtos.page').then( m => m.ListaProdutosPage)
  },
  {
    path: 'cadastro-cliente',
    loadComponent: () => import('./pages/cadastro-cliente/cadastro-cliente.page').then( m => m.CadastroClientePage)
  },
  {
    path: 'lista-clientes',
    loadComponent: () => import('./pages/lista-clientes/lista-clientes.page').then( m => m.ListaClientesPage)
  },
  {
    path: 'nova-venda',
    loadComponent: () => import('./pages/nova-venda/nova-venda.page').then( m => m.NovaVendaPage)
  },
  {
    path: 'lista-vendas',
    loadComponent: () => import('./pages/lista-vendas/lista-vendas.page').then( m => m.ListaVendasPage)
  },
{
  path: 'detalhes-venda/:id',
  loadComponent: () =>
    import('./pages/detalhes-venda/detalhes-venda.page')
      .then(m => m.DetalhesVendaPage)
},
  {
    path: 'devolucao',
    loadComponent: () => import('./pages/devolucao/devolucao.page').then( m => m.DevolucaoPage)
  },
  {
    path: 'receber',
    loadComponent: () => import('./pages/receber/receber.page').then( m => m.ReceberPage)
  },
  {
    path: 'relatorios',
    loadComponent: () => import('./pages/relatorios/relatorios.page').then( m => m.RelatoriosPage)
  },
  {
    path: 'sobre',
    loadComponent: () => import('./pages/sobre/sobre.page').then( m => m.SobrePage)
  },
];
