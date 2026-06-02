import { Injectable } from '@angular/core';
import { DatabaseService } from './database';
import { Devolucao } from '../models/devolucao.model';
import { ItemVenda } from '../models/item-venda.model';
import { Recebimento } from '../models/recebimento.model';

@Injectable({
  providedIn: 'root',
})
export class DevolucaoService {
  constructor(private db: DatabaseService) {}

  /**
   * Registra a devolução de um item de uma venda.
   * Valida se a quantidade devolvida é menor ou igual à quantidade vendida (descontando devoluções prévias).
   * Atualiza o estoque do produto e ajusta o valor do recebimento financeiro correspondente.
   * Tudo executado sob transação SQLite para consistência.
   */
  async registrarDevolucao(vendaId: number, produtoId: number, quantidadeDevolvida: number): Promise<void> {
    if (!vendaId || !produtoId) {
      throw new Error('Identificadores de venda e produto são obrigatórios.');
    }
    if (quantidadeDevolvida <= 0) {
      throw new Error('A quantidade de devolução deve ser maior que zero.');
    }

    // 1. Buscar o item original vendido
    const itemVendidoResult = this.db.query<ItemVenda>(
      'SELECT * FROM itens_venda WHERE venda_id = ? AND produto_id = ?',
      [vendaId, produtoId]
    );

    if (itemVendidoResult.length === 0) {
      throw new Error('Este produto não pertence à venda informada.');
    }

    const itemVendido = itemVendidoResult[0];

    // 2. Calcular devoluções anteriores desse mesmo item na venda
    const devolucoesAnterioresResult = this.db.query<{ total: number }>(
      'SELECT SUM(quantidade) as total FROM devolucoes WHERE venda_id = ? AND produto_id = ?',
      [vendaId, produtoId]
    );

    const totalDevolvidoAnteriormente = devolucoesAnterioresResult[0]?.total || 0;
    const quantidadeDisponivelParaDevolucao = itemVendido.quantidade - totalDevolvidoAnteriormente;

    // Regra de Negócio: Não permitir devolver quantidade maior que a vendida
    if (quantidadeDevolvida > quantidadeDisponivelParaDevolucao) {
      throw new Error(
        `Quantidade excedente. Total vendido: ${itemVendido.quantidade}, já devolvido: ${totalDevolvidoAnteriormente}, solicitado: ${quantidadeDevolvida}. Máximo permitido para devolução agora: ${quantidadeDisponivelParaDevolucao}.`
      );
    }

    // 3. Buscar recebimento financeiro da venda para atualizar
    const recebimentoResult = this.db.query<Recebimento>(
      'SELECT * FROM recebimentos WHERE venda_id = ?',
      [vendaId]
    );

    const recebimento = recebimentoResult.length > 0 ? recebimentoResult[0] : null;
    const valorReembolso = quantidadeDevolvida * itemVendido.preco_unitario;

    // 4. Executar a transação de devolução
    await this.db.transaction(async () => {
      const dataDevolucao = new Date().toISOString();

      // a) Registrar devolução
      this.db.run(
        'INSERT INTO devolucoes (venda_id, produto_id, quantidade, data_devolucao) VALUES (?, ?, ?, ?)',
        [vendaId, produtoId, quantidadeDevolvida, dataDevolucao]
      );

      // b) Atualizar estoque do produto (devolve itens ao estoque)
      this.db.run(
        'UPDATE produtos SET estoque = estoque + ? WHERE id = ?',
        [quantidadeDevolvida, produtoId]
      );

      // c) Atualizar financeiro
      if (recebimento) {
        let novoValor = recebimento.valor - valorReembolso;
        let novoStatus = recebimento.status;

        if (novoValor <= 0) {
          novoValor = 0;
          novoStatus = 'Cancelado'; // Se zerar o valor total da venda por devoluções, cancela o recebimento
        }

        this.db.run(
          'UPDATE recebimentos SET valor = ?, status = ? WHERE id = ?',
          [novoValor, novoStatus, recebimento.id]
        );
      }
    });
  }

  /**
   * Retorna a lista de todas as devoluções registradas no sistema.
   */
  async listarDevolucoes(): Promise<any[]> {
    const sql = `
      SELECT 
        d.id, d.venda_id, d.produto_id, d.quantidade, d.data_devolucao,
        p.nome as produto_nome, p.codigo_barras as produto_codigo_barras,
        c.nome as cliente_nome
      FROM devolucoes d
      JOIN produtos p ON d.produto_id = p.id
      JOIN vendas v ON d.venda_id = v.id
      JOIN clientes c ON v.cliente_id = c.id
      ORDER BY d.id DESC
    `;
    return this.db.query<any>(sql);
  }

  /**
   * Retorna as devoluções de uma venda específica.
   */
  async buscarPorVenda(vendaId: number): Promise<any[]> {
    const sql = `
      SELECT 
        d.id, d.venda_id, d.produto_id, d.quantidade, d.data_devolucao,
        p.nome as produto_nome
      FROM devolucoes d
      JOIN produtos p ON d.produto_id = p.id
      WHERE d.venda_id = ?
      ORDER BY d.id ASC
    `;
    return this.db.query<any>(sql, [vendaId]);
  }
}
export { DevolucaoService as Devolucao };
