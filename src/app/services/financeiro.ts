import { Injectable } from '@angular/core';
import { DatabaseService } from './database';
import { Recebimento } from '../models/recebimento.model';

@Injectable({
  providedIn: 'root',
})
export class FinanceiroService {
  constructor(private db: DatabaseService) {}

  /**
   * Registra o pagamento de um recebimento.
   * Altera o status para 'Pago' e define a data do pagamento.
   */
  async registrarPagamento(recebimentoId: number, dataPagamento?: string): Promise<void> {
    if (!recebimentoId) {
      throw new Error('Identificador do recebimento é obrigatório.');
    }

    const recebimentoResult = this.db.query<Recebimento>(
      'SELECT * FROM recebimentos WHERE id = ?',
      [recebimentoId]
    );

    if (recebimentoResult.length === 0) {
      throw new Error('Recebimento não encontrado.');
    }

    const recebimento = recebimentoResult[0];

    if (recebimento.status === 'Cancelado') {
      throw new Error('Não é possível registrar pagamento para um recebimento que foi cancelado.');
    }
    if (recebimento.status === 'Pago') {
      throw new Error('Este recebimento já está pago.');
    }

    const dataPgto = dataPagamento || new Date().toISOString();

    this.db.run(
      'UPDATE recebimentos SET status = ?, data_pagamento = ? WHERE id = ?',
      ['Pago', dataPgto, recebimentoId]
    );
  }

  /**
   * Cancela manualmente um recebimento.
   */
  async cancelarRecebimento(recebimentoId: number): Promise<void> {
    if (!recebimentoId) {
      throw new Error('Identificador do recebimento é obrigatório.');
    }

    const recebimentoResult = this.db.query<Recebimento>(
      'SELECT * FROM recebimentos WHERE id = ?',
      [recebimentoId]
    );

    if (recebimentoResult.length === 0) {
      throw new Error('Recebimento não encontrado.');
    }

    const recebimento = recebimentoResult[0];
    if (recebimento.status === 'Pago') {
      throw new Error('Não é possível cancelar um recebimento que já foi pago.');
    }

    this.db.run(
      'UPDATE recebimentos SET status = ? WHERE id = ?',
      ['Cancelado', recebimentoId]
    );
  }

  /**
   * Busca um recebimento pelo ID.
   */
  async buscarPorId(id: number): Promise<Recebimento | null> {
    const results = this.db.query<Recebimento>('SELECT * FROM recebimentos WHERE id = ?', [id]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Busca o recebimento associado a uma venda.
   */
  async buscarPorVenda(vendaId: number): Promise<Recebimento | null> {
    const results = this.db.query<Recebimento>(
      'SELECT * FROM recebimentos WHERE venda_id = ?',
      [vendaId]
    );
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Retorna a lista de recebimentos com informações estendidas (nome do cliente e data da venda).
   * Permite filtrar opcionalmente por status.
   */
  async listarRecebimentos(status?: 'Pendente' | 'Pago' | 'Cancelado'): Promise<any[]> {
    let sql = `
      SELECT 
        r.id, r.venda_id, r.valor, r.status, r.data_pagamento,
        c.nome as cliente_nome,
        v.data_venda
      FROM recebimentos r
      JOIN vendas v ON r.venda_id = v.id
      JOIN clientes c ON v.cliente_id = c.id
    `;
    
    const params: any[] = [];
    if (status) {
      sql += ' WHERE r.status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY r.id DESC';
    
    return this.db.query<any>(sql, params);
  }
}
export { FinanceiroService as Financeiro };
