import { Injectable } from '@angular/core';
import { DatabaseService } from './database';
import { Venda } from '../models/venda.model';
import { ItemVenda } from '../models/item-venda.model';
import { Cliente } from '../models/cliente.model';
import { Produto } from '../models/produto.model';
import { UsuarioService } from './usuario';

@Injectable({
  providedIn: 'root',
})
export class VendaService {
  constructor(private db: DatabaseService, private usuarioService: UsuarioService) {}

  /**
   * Registra uma nova venda, valida o estoque de cada produto,
   * deduz a quantidade do estoque e gera o recebimento pendente.
   * Executado dentro de uma transação SQLite para consistência.
   */
  async registrarVenda(venda: Venda, itens: ItemVenda[]): Promise<number> {
    // 1. Validações preliminares
    if (!venda.cliente_id) {
      throw new Error('É necessário selecionar um cliente.');
    }
    if (!itens || itens.length === 0) {
      throw new Error('A venda deve conter pelo menos um produto.');
    }

    // Verificar se cliente existe
    const clienteResult = this.db.query<Cliente>('SELECT id FROM clientes WHERE id = ?', [venda.cliente_id]);
    if (clienteResult.length === 0) {
      throw new Error('Cliente selecionado não foi encontrado no sistema.');
    }

    // 2. Validar preços e estoque de todos os itens
    const itensValidados: ItemVenda[] = [];
    let calculadoSubtotal = 0;

    for (const item of itens) {
      if (item.quantidade <= 0) {
        throw new Error('A quantidade do produto deve ser maior que zero.');
      }

      // Buscar produto no banco para obter preço oficial e estoque
      const produtoResult = this.db.query<Produto>('SELECT * FROM produtos WHERE id = ?', [item.produto_id]);
      if (produtoResult.length === 0) {
        throw new Error(`Produto com ID ${item.produto_id} não foi encontrado.`);
      }

      const produto = produtoResult[0];

      // Validar estoque
      if (produto.estoque < item.quantidade) {
        throw new Error(
          `Estoque insuficiente para o produto "${produto.nome}". Disponível: ${produto.estoque}, Solicitado: ${item.quantidade}.`
        );
      }

      const subtotalItem = produto.preco * item.quantidade;
      calculadoSubtotal += subtotalItem;

      itensValidados.push({
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: produto.preco,
        subtotal: subtotalItem,
      });
    }

    venda.subtotal = calculadoSubtotal;
    venda.total = calculadoSubtotal; // Pode ser estendido futuramente para descontos/taxas
    if (!venda.data_venda) {
      venda.data_venda = new Date().toISOString();
    }

    // 3. Execução da transação no SQLite
    return this.db.transaction(async () => {
      const loggedUser = this.usuarioService.getLoggedUser();
      const usuarioId = loggedUser ? loggedUser.id : null;

      // a) Criar venda (inclui forma de pagamento e data de vencimento)
      this.db.run(
        'INSERT INTO vendas (cliente_id, usuario_id, data_venda, subtotal, total, forma_pagamento, data_vencimento) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [venda.cliente_id, usuarioId, venda.data_venda, venda.subtotal, venda.total, venda.forma_pagamento ?? null, venda.data_vencimento ?? null]
      );
      const vendaId = this.db.getLastInsertId();

      // b) Criar itens da venda e baixar estoque dos produtos
      for (const item of itensValidados) {
        this.db.run(
          'INSERT INTO itens_venda (venda_id, produto_id, quantidade, preco_unitario, subtotal) VALUES (?, ?, ?, ?, ?)',
          [vendaId, item.produto_id, item.quantidade, item.preco_unitario, item.subtotal]
        );

        // Baixar estoque
        this.db.run(
          'UPDATE produtos SET estoque = estoque - ? WHERE id = ?',
          [item.quantidade, item.produto_id]
        );
      }

      // c) Gerar recebimento financeiro automático com regras por forma de pagamento
      const metodo = (venda.forma_pagamento || '').toString().toLowerCase();
      const immediateMethods = ['dinheiro', 'pix', 'debito', 'débito'];
      const isImmediate = immediateMethods.includes(metodo);
      const status = isImmediate ? 'Pago' : 'Pendente';
      const dataPagamento = isImmediate ? new Date().toISOString() : null;

      this.db.run(
        'INSERT INTO recebimentos (venda_id, valor, status, data_pagamento) VALUES (?, ?, ?, ?)',
        [vendaId, venda.total, status, dataPagamento]
      );

      return vendaId;
    });
  }

  /**
   * Lista todas as vendas e popula os dados básicos do cliente.
   */
  async listarVendas(): Promise<Venda[]> {
    const querySql = `
      SELECT 
        v.id, v.cliente_id, v.data_venda, v.subtotal, v.total,
        c.nome as cliente_nome, c.telefone as cliente_telefone, c.email as cliente_email, c.cpf as cliente_cpf
      FROM vendas v
      JOIN clientes c ON v.cliente_id = c.id
      ORDER BY v.id DESC
    `;
    const rows = this.db.query<any>(querySql);

    return rows.map(row => ({
      id: row.id,
      cliente_id: row.cliente_id,
      data_venda: row.data_venda,
      subtotal: row.subtotal,
      total: row.total,
      cliente: {
        id: row.cliente_id,
        nome: row.cliente_nome,
        telefone: row.cliente_telefone,
        email: row.cliente_email,
        cpf: row.cliente_cpf
      }
    }));
  }

  /**
   * Busca os detalhes de uma venda pelo ID, populando Cliente e ItensVenda (com Produto).
   */
  async buscarPorId(id: number): Promise<Venda | null> {
    const vendaResult = this.db.query<any>(
      `SELECT v.*, c.nome as cliente_nome, c.telefone as cliente_telefone, c.email as cliente_email, c.cpf as cliente_cpf
       FROM vendas v
       JOIN clientes c ON v.cliente_id = c.id
       WHERE v.id = ?`,
      [id]
    );

    if (vendaResult.length === 0) {
      return null;
    }

    const row = vendaResult[0];
    const venda: Venda = {
      id: row.id,
      cliente_id: row.cliente_id,
      data_venda: row.data_venda,
      subtotal: row.subtotal,
      total: row.total,
      cliente: {
        id: row.cliente_id,
        nome: row.cliente_nome,
        telefone: row.cliente_telefone,
        email: row.cliente_email,
        cpf: row.cliente_cpf
      },
      itens: []
    };

    // Buscar itens da venda
    const itensRows = this.db.query<any>(
      `SELECT iv.*, p.nome as produto_nome, p.descricao as produto_descricao, p.preco as produto_preco, p.codigo_barras as produto_codigo_barras
       FROM itens_venda iv
       JOIN produtos p ON iv.produto_id = p.id
       WHERE iv.venda_id = ?`,
      [id]
    );

    venda.itens = itensRows.map(itemRow => ({
      id: itemRow.id,
      venda_id: itemRow.venda_id,
      produto_id: itemRow.produto_id,
      quantidade: itemRow.quantidade,
      preco_unitario: itemRow.preco_unitario,
      subtotal: itemRow.subtotal,
      produto: {
        id: itemRow.produto_id,
        nome: itemRow.produto_nome,
        descricao: itemRow.produto_descricao,
        preco: itemRow.produto_preco,
        estoque: 0, // não relevante para o histórico
        codigo_barras: itemRow.produto_codigo_barras
      }
    }));

    return venda;
  }
}
export { VendaService as Venda };
