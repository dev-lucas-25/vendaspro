import { Injectable } from '@angular/core';
import { DatabaseService } from './database';
import { Produto } from '../models/produto.model';
import { Recebimento } from '../models/recebimento.model';

@Injectable({
  providedIn: 'root',
})
export class RelatoriosService {
  constructor(private db: DatabaseService) {}

  /**
   * Retorna o número total de vendas realizadas.
   */
  async getTotalVendas(): Promise<number> {
    const results = this.db.query<{ total: number }>('SELECT COUNT(*) as total FROM vendas');
    return results.length > 0 ? results[0].total : 0;
  }

  /**
   * Retorna a soma do valor total vendido em todas as vendas.
   */
  async getValorVendido(): Promise<number> {
    const results = this.db.query<{ total: number }>('SELECT SUM(total) as total FROM vendas');
    return results.length > 0 && results[0].total !== null ? results[0].total : 0;
  }

  /**
   * Retorna os produtos mais vendidos ordenados pela quantidade total comercializada.
   */
  async getProdutosMaisVendidos(limite: number = 5): Promise<any[]> {
    const sql = `
      SELECT 
        p.id, p.nome, p.codigo_barras,
        SUM(iv.quantidade) as quantidade_vendida,
        SUM(iv.subtotal) as total_faturado
      FROM itens_venda iv
      JOIN produtos p ON iv.produto_id = p.id
      GROUP BY p.id, p.nome, p.codigo_barras
      ORDER BY quantidade_vendida DESC
      LIMIT ?
    `;
    return this.db.query<any>(sql, [limite]);
  }

  /**
   * Retorna a quantidade total acumulada de itens em estoque.
   */
  async getEstoqueAtual(): Promise<number> {
    const results = this.db.query<{ total: number }>('SELECT SUM(estoque) as total FROM produtos');
    return results.length > 0 && results[0].total !== null ? results[0].total : 0;
  }

  /**
   * Retorna a lista de produtos com estoque abaixo de um limite específico.
   */
  async getEstoqueBaixo(limiar: number = 10): Promise<Produto[]> {
    return this.db.query<Produto>(
      'SELECT * FROM produtos WHERE estoque <= ? ORDER BY estoque ASC',
      [limiar]
    );
  }

  /**
   * Retorna a lista de todos os recebimentos que estão pendentes.
   */
  async getRecebimentosPendentes(): Promise<Recebimento[]> {
    return this.db.query<Recebimento>(
      'SELECT * FROM recebimentos WHERE status = "Pendente" ORDER BY id DESC'
    );
  }

  /**
   * Retorna a lista de todos os recebimentos que já foram pagos.
   */
  async getRecebimentosPagos(): Promise<Recebimento[]> {
    return this.db.query<Recebimento>(
      'SELECT * FROM recebimentos WHERE status = "Pago" ORDER BY id DESC'
    );
  }
}
export { RelatoriosService as Relatorios };
