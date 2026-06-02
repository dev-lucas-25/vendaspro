import { TestBed } from '@angular/core/testing';
import { DatabaseService } from './database';
import { UsuarioService } from './usuario';
import { ProdutoService } from './produto';
import { ClienteService } from './cliente';
import { VendaService } from './venda';
import { DevolucaoService } from './devolucao';
import { FinanceiroService } from './financeiro';
import { RelatoriosService } from './relatorios';
import { ItemVenda } from '../models/item-venda.model';

describe('VendaPro - Integração de Processos de Negócio', () => {
  let dbService: DatabaseService;
  let usuarioService: UsuarioService;
  let produtoService: ProdutoService;
  let clienteService: ClienteService;
  let vendaService: VendaService;
  let devolucaoService: DevolucaoService;
  let financeiroService: FinanceiroService;
  let relatoriosService: RelatoriosService;

  beforeEach(async () => {
    // Limpar o LocalStorage para testar em um ambiente limpo
    localStorage.removeItem('vendapro_db');

    TestBed.configureTestingModule({
      providers: [
        DatabaseService,
        UsuarioService,
        ProdutoService,
        ClienteService,
        VendaService,
        DevolucaoService,
        FinanceiroService,
        RelatoriosService,
      ],
    });

    dbService = TestBed.inject(DatabaseService);
    usuarioService = TestBed.inject(UsuarioService);
    produtoService = TestBed.inject(ProdutoService);
    clienteService = TestBed.inject(ClienteService);
    vendaService = TestBed.inject(VendaService);
    devolucaoService = TestBed.inject(DevolucaoService);
    financeiroService = TestBed.inject(FinanceiroService);
    relatoriosService = TestBed.inject(RelatoriosService);

    // Inicializar o banco de dados antes dos testes
    await dbService.initialize();
  });

  // PROCESSO 1 - LOGIN
  describe('Processo 1: Autenticação de Usuários', () => {
    it('deve autenticar o usuário administrador semeado por padrão', async () => {
      const user = await usuarioService.login('admin', 'admin123');
      expect(user).toBeTruthy();
      expect(user?.nome).toBe('Administrador');
      expect(usuarioService.getLoggedUser()).toEqual(user);
    });

    it('deve falhar ao autenticar com senha incorreta', async () => {
      const user = await usuarioService.login('admin', 'senha_errada');
      expect(user).toBeNull();
      expect(usuarioService.getLoggedUser()).toBeNull();
    });

    it('deve cadastrar um novo usuário e permitir seu login', async () => {
      await usuarioService.cadastrar({
        nome: 'Vendedor Teste',
        login: 'vendedor',
        senha: '123',
      });

      const user = await usuarioService.login('vendedor', '123');
      expect(user).toBeTruthy();
      expect(user?.nome).toBe('Vendedor Teste');
    });

    it('não deve permitir cadastrar usuário com login duplicado', async () => {
      await expectAsync(
        usuarioService.cadastrar({
          nome: 'Outro Admin',
          login: 'admin',
          senha: '123',
        })
      ).toBeRejectedWithError('Este login já está cadastrado.');
    });
  });

  // PROCESSO 2 - PRODUTOS
  describe('Processo 2: Cadastro de Produtos', () => {
    it('deve cadastrar um novo produto e disponibilizá-lo para venda', async () => {
      await produtoService.cadastrar({
        nome: 'Caneta Azul',
        descricao: 'Caneta esferográfica azul',
        preco: 1.5,
        estoque: 150,
        codigo_barras: '1111111111111',
      });

      const prod = await produtoService.buscarPorCodigoBarras('1111111111111');
      expect(prod).toBeTruthy();
      expect(prod?.nome).toBe('Caneta Azul');
      expect(prod?.preco).toBe(1.5);
    });

    it('não deve permitir cadastrar produtos com código de barras duplicado', async () => {
      await expectAsync(
        produtoService.cadastrar({
          nome: 'Produto Duplicado',
          descricao: 'Código de barras igual à Caneca VendaPro (semente)',
          preco: 10.0,
          estoque: 5,
          codigo_barras: '7891234567890', // Código da Caneca
        })
      ).toBeRejectedWithError('Já existe um produto cadastrado com este código de barras.');
    });
  });

  // PROCESSO 3 - CLIENTES
  describe('Processo 3: Cadastro de Clientes', () => {
    it('deve cadastrar um novo cliente e validar seus dados', async () => {
      await clienteService.cadastrar({
        nome: 'Lucas Santos',
        telefone: '11977777777',
        email: 'lucas@santos.com',
        cpf: '123.456.789-99',
      });

      const clientes = await clienteService.listar();
      const lucas = clientes.find(c => c.cpf === '123.456.789-99');
      expect(lucas).toBeTruthy();
      expect(lucas?.nome).toBe('Lucas Santos');
    });

    it('não deve permitir cadastrar CPF duplicado', async () => {
      await expectAsync(
        clienteService.cadastrar({
          nome: 'Clone João',
          telefone: '11900000000',
          email: 'clone@joao.com',
          cpf: '123.456.789-00', // CPF do João Silva semente
        })
      ).toBeRejectedWithError('Já existe um cliente cadastrado com este CPF.');
    });
  });

  // PROCESSO 4 E 6 - VENDA E FINANCEIRO
  describe('Processo 4 e 6: Venda e Geração de Recebimento Financeiro', () => {
    it('deve realizar uma venda com sucesso, baixar estoque e gerar recebimento pendente', async () => {
      // Obter estoque inicial da Caneca VendaPro (id 1)
      const produtoAntes = await produtoService.buscarPorId(1);
      expect(produtoAntes).toBeTruthy();
      const estoqueOriginal = produtoAntes!.estoque; // 50 unidades

      // Montar itens da venda
      const itens: ItemVenda[] = [
        {
          produto_id: 1, // Caneca
          quantidade: 5,
          preco_unitario: 0, // calculado pelo service
          subtotal: 0, // calculado pelo service
        },
      ];

      // Registrar venda para o cliente João Silva (id 1)
      const vendaId = await vendaService.registrarVenda(
        {
          cliente_id: 1,
          data_venda: new Date().toISOString(),
          subtotal: 0,
          total: 0,
        },
        itens
      );

      expect(vendaId).toBeGreaterThan(0);

      // Verificar redução do estoque
      const produtoDepois = await produtoService.buscarPorId(1);
      expect(produtoDepois?.estoque).toBe(estoqueOriginal - 5);

      // Verificar criação automática de recebimento correspondente
      const recebimento = await financeiroService.buscarPorVenda(vendaId);
      expect(recebimento).toBeTruthy();
      expect(recebimento?.valor).toBe(25.0 * 5); // Caneca custa 25.0
      expect(recebimento?.status).toBe('Pendente');

      // Processo 6: Registrar pagamento
      await financeiroService.registrarPagamento(recebimento!.id!);
      const recebimentoPago = await financeiroService.buscarPorId(recebimento!.id!);
      expect(recebimentoPago?.status).toBe('Pago');
      expect(recebimentoPago?.data_pagamento).toBeTruthy();
    });

    it('não deve permitir venda de produto com estoque insuficiente', async () => {
      const itens: ItemVenda[] = [
        {
          produto_id: 2, // Camiseta VendaPro (estoque semente = 30)
          quantidade: 31, // solicita maior que o estoque
          preco_unitario: 0,
          subtotal: 0,
        },
      ];

      await expectAsync(
        vendaService.registrarVenda(
          {
            cliente_id: 1,
            data_venda: new Date().toISOString(),
            subtotal: 0,
            total: 0,
          },
          itens
        )
      ).toBeRejected();
    });
  });

  // PROCESSO 5 - DEVOLUÇÃO
  describe('Processo 5: Devolução de Mercadorias', () => {
    it('deve devolver produtos, restaurar o estoque e ajustar o recebimento financeiro', async () => {
      // 1. Criar uma venda de 10 camisetas (id 2, preço 59.90, estoque semente 30)
      const itens: ItemVenda[] = [
        {
          produto_id: 2,
          quantidade: 10,
          preco_unitario: 0,
          subtotal: 0,
        },
      ];

      const vendaId = await vendaService.registrarVenda(
        {
          cliente_id: 1,
          data_venda: new Date().toISOString(),
          subtotal: 0,
          total: 0,
        },
        itens
      );

      // Estoque após venda deve ser 20
      let prod = await produtoService.buscarPorId(2);
      expect(prod?.estoque).toBe(20);

      // Recebimento inicial de R$ 599.00
      let recebimento = await financeiroService.buscarPorVenda(vendaId);
      expect(recebimento?.valor).toBe(599.0);

      // 2. Registrar devolução de 4 camisetas
      await devolucaoService.registrarDevolucao(vendaId, 2, 4);

      // Estoque deve retornar para 24
      prod = await produtoService.buscarPorId(2);
      expect(prod?.estoque).toBe(24);

      // Recebimento deve ser reajustado para R$ 359.40 (599.00 - 4 * 59.90)
      recebimento = await financeiroService.buscarPorVenda(vendaId);
      expect(recebimento?.valor).toBe(359.4);

      // 3. Tentar devolver uma quantidade que excede o total vendido
      await expectAsync(
        devolucaoService.registrarDevolucao(vendaId, 2, 7) // Já devolveu 4, restam 6. Tentar devolver 7 deve falhar
      ).toBeRejectedWithError(/Quantidade excedente/);
    });
  });

  // PROCESSO 7 - RELATÓRIOS
  describe('Processo 7: Relatórios de Desempenho', () => {
    it('deve computar e retornar dados estatísticos precisos do negócio', async () => {
      // Realizar uma venda para gerar métricas
      const itens: ItemVenda[] = [
        {
          produto_id: 3, // Chaveiro (preco 10.0, estoque 100)
          quantidade: 10,
          preco_unitario: 0,
          subtotal: 0,
        },
      ];

      await vendaService.registrarVenda(
        {
          cliente_id: 2,
          data_venda: new Date().toISOString(),
          subtotal: 0,
          total: 0,
        },
        itens
      );

      // Estatísticas
      const totalVendas = await relatoriosService.getTotalVendas();
      const valorVendido = await relatoriosService.getValorVendido();
      const maisVendidos = await relatoriosService.getProdutosMaisVendidos(1);
      const estoqueBaixo = await relatoriosService.getEstoqueBaixo(20);

      expect(totalVendas).toBe(1);
      expect(valorVendido).toBe(100.0);
      expect(maisVendidos.length).toBe(1);
      expect(maisVendidos[0].nome).toBe('Chaveiro VendaPro');
      expect(maisVendidos[0].quantidade_vendida).toBe(10);

      // Modificar um produto para baixo estoque e testar
      await produtoService.atualizarEstoque(1, -45); // Baixar Caneca de 50 para 5
      const estoqueBaixo2 = await relatoriosService.getEstoqueBaixo(10);
      expect(estoqueBaixo2.find(p => p.id === 1)).toBeTruthy();
    });
  });
});
