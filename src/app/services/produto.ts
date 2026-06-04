import { Injectable } from '@angular/core';
import { DatabaseService } from './database';
import { Produto } from '../models/produto.model';

@Injectable({
  providedIn: 'root',
})
export class ProdutoService {
  constructor(private db: DatabaseService) {}

  /**
   * Valida e insere um novo produto no banco.
   * Disponibiliza o produto para vendas.
   */
  async cadastrar(produto: Produto): Promise<void> {
    this.validarProduto(produto);

    // Verificar se o código de barras já existe
    const existente = this.db.query<Produto>(
      'SELECT id FROM produtos WHERE codigo_barras = ?',
      [produto.codigo_barras.trim()]
    );
    if (existente.length > 0) {
      throw new Error('Já existe um produto cadastrado com este código de barras.');
    }

    this.db.run(
      'INSERT INTO produtos (nome, descricao, preco, estoque, codigo_barras) VALUES (?, ?, ?, ?, ?)',
      [
        produto.nome.trim(),
        (produto.descricao || '').trim(),
        produto.preco,
        produto.estoque,
        produto.codigo_barras.trim(),
      ]
    );
  }

  /**
   * Atualiza as informações de um produto existente.
   */
  async atualizar(produto: Produto): Promise<void> {
    if (!produto.id) {
      throw new Error('ID do produto é obrigatório para atualização.');
    }
    this.validarProduto(produto);

    // Verificar se o código de barras está em uso por outro produto
    const existente = this.db.query<Produto>(
      'SELECT id FROM produtos WHERE codigo_barras = ? AND id != ?',
      [produto.codigo_barras.trim(), produto.id]
    );
    if (existente.length > 0) {
      throw new Error('Já existe outro produto cadastrado com este código de barras.');
    }

    this.db.run(
      'UPDATE produtos SET nome = ?, descricao = ?, preco = ?, estoque = ?, codigo_barras = ? WHERE id = ?',
      [
        produto.nome.trim(),
        (produto.descricao || '').trim(),
        produto.preco,
        produto.estoque,
        produto.codigo_barras.trim(),
        produto.id,
      ]
    );
  }

  /**
   * Retorna a lista de todos os produtos cadastrados.
   */
  async listar(): Promise<Produto[]> {
    return this.db.query<Produto>('SELECT * FROM produtos ORDER BY nome ASC');
  }

  /**
   * Busca um produto por ID.
   */
  async buscarPorId(id: number): Promise<Produto | null> {
    const results = this.db.query<Produto>('SELECT * FROM produtos WHERE id = ?', [id]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Exclui um produto se não houver vendas ou devoluções vinculadas.
   */
  async excluir(id: number): Promise<void> {
    if (!id) {
      throw new Error('ID do produto é obrigatório para exclusão.');
    }

    const vendas = this.db.query<{ count: number }>(
      'SELECT COUNT(*) as count FROM itens_venda WHERE produto_id = ?',
      [id]
    );

    if (vendas.length > 0 && vendas[0].count > 0) {
      throw new Error('Este produto possui vendas vinculadas e não pode ser excluído.');
    }

    const devolucoes = this.db.query<{ count: number }>(
      'SELECT COUNT(*) as count FROM devolucoes WHERE produto_id = ?',
      [id]
    );

    if (devolucoes.length > 0 && devolucoes[0].count > 0) {
      throw new Error('Este produto possui devoluções vinculadas e não pode ser excluído.');
    }

    this.db.run('DELETE FROM produtos WHERE id = ?', [id]);
  }

  /**
   * Busca um produto por código de barras (útil na tela de Vendas).
   */
  async buscarPorCodigoBarras(codigo: string): Promise<Produto | null> {
    if (!codigo) return null;
    const results = this.db.query<Produto>(
      'SELECT * FROM produtos WHERE codigo_barras = ?',
      [codigo.trim()]
    );
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Incrementa ou decrementa o estoque de um produto específico.
   * quantidadeAlterada pode ser positiva (entrada/devolução) ou negativa (venda).
   */
  async atualizarEstoque(produtoId: number, quantidadeAlterada: number): Promise<void> {
    const produto = await this.buscarPorId(produtoId);
    if (!produto) {
      throw new Error('Produto não encontrado para alteração de estoque.');
    }

    const novoEstoque = produto.estoque + quantidadeAlterada;
    if (novoEstoque < 0) {
      throw new Error(`Estoque insuficiente para o produto "${produto.nome}". Estoque atual: ${produto.estoque}.`);
    }

    this.db.run('UPDATE produtos SET estoque = ? WHERE id = ?', [novoEstoque, produtoId]);
  }

  /**
   * Valida as regras de consistência dos dados do produto.
   */
  private validarProduto(produto: Produto): void {
    if (!produto.nome || !produto.nome.trim()) {
      throw new Error('Nome do produto é obrigatório.');
    }
    if (produto.preco === undefined || produto.preco <= 0) {
      throw new Error('O preço do produto deve ser maior que zero.');
    }
    if (produto.estoque === undefined || produto.estoque < 0) {
      throw new Error('O estoque inicial do produto não pode ser negativo.');
    }
    if (!produto.codigo_barras || !produto.codigo_barras.trim()) {
      throw new Error('Código de barras é obrigatório.');
    }
  }
}
export { ProdutoService as Produto };
