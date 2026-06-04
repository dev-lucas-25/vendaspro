import { Injectable } from '@angular/core';
import { DatabaseService } from './database';
import { Cliente } from '../models/cliente.model';

@Injectable({
  providedIn: 'root',
})
export class ClienteService {
  constructor(private db: DatabaseService) {}

  /**
   * Cadastra um novo cliente com validações de dados (CPF único).
   */
  async cadastrar(cliente: Cliente): Promise<void> {
    this.validarCliente(cliente);

    const cpfLimpo = this.limparCpf(cliente.cpf);

    // Verificar se o CPF já está cadastrado
    const existente = this.db.query<Cliente>(
      'SELECT id FROM clientes WHERE replace(replace(cpf, ".", ""), "-", "") = ?',
      [cpfLimpo]
    );

    if (existente.length > 0) {
      throw new Error('Já existe um cliente cadastrado com este CPF.');
    }

    this.db.run(
      'INSERT INTO clientes (nome, telefone, email, cpf) VALUES (?, ?, ?, ?)',
      [
        cliente.nome.trim(),
        cliente.telefone.trim(),
        cliente.email.trim().toLowerCase(),
        cliente.cpf.trim(),
      ]
    );
  }

  /**
   * Retorna a lista de todos os clientes ordenados por nome.
   */
  async listar(): Promise<Cliente[]> {
    return this.db.query<Cliente>('SELECT * FROM clientes ORDER BY nome ASC');
  }

  /**
   * Busca um cliente pelo ID.
   */
  async buscarPorId(id: number): Promise<Cliente | null> {
    const results = this.db.query<Cliente>('SELECT * FROM clientes WHERE id = ?', [id]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Atualiza os dados de um cliente existente.
   */
  async atualizar(cliente: Cliente): Promise<void> {
    if (!cliente.id) {
      throw new Error('ID do cliente é obrigatório para atualização.');
    }

    this.validarCliente(cliente);
    const cpfLimpo = this.limparCpf(cliente.cpf);

    const existente = this.db.query<Cliente>(
      'SELECT id FROM clientes WHERE replace(replace(cpf, ".", ""), "-", "") = ? AND id != ?',
      [cpfLimpo, cliente.id]
    );

    if (existente.length > 0) {
      throw new Error('Já existe outro cliente cadastrado com este CPF.');
    }

    this.db.run(
      'UPDATE clientes SET nome = ?, telefone = ?, email = ?, cpf = ? WHERE id = ?',
      [
        cliente.nome.trim(),
        cliente.telefone.trim(),
        cliente.email.trim().toLowerCase(),
        cliente.cpf.trim(),
        cliente.id,
      ]
    );
  }

  /**
   * Exclui um cliente se não houver vendas vinculadas.
   */
  async excluir(id: number): Promise<void> {
    if (!id) {
      throw new Error('ID do cliente é obrigatório para exclusão.');
    }

    const vendas = this.db.query<{ count: number }>(
      'SELECT COUNT(*) as count FROM vendas WHERE cliente_id = ?',
      [id]
    );

    if (vendas.length > 0 && vendas[0].count > 0) {
      throw new Error('Este cliente possui vendas vinculadas e não pode ser excluído.');
    }

    this.db.run('DELETE FROM clientes WHERE id = ?', [id]);
  }

  /**
   * Valida os campos obrigatórios do cliente.
   */
  private validarCliente(cliente: Cliente): void {
    if (!cliente.nome || !cliente.nome.trim()) {
      throw new Error('Nome do cliente é obrigatório.');
    }
    if (!cliente.telefone || !cliente.telefone.trim()) {
      throw new Error('Telefone do cliente é obrigatório.');
    }
    if (!cliente.email || !cliente.email.trim()) {
      throw new Error('E-mail do cliente é obrigatório.');
    }
    if (!cliente.email.includes('@')) {
      throw new Error('E-mail informado é inválido.');
    }
    if (!cliente.cpf || !cliente.cpf.trim()) {
      throw new Error('CPF do cliente é obrigatório.');
    }

    const cpfLimpo = this.limparCpf(cliente.cpf);
    if (cpfLimpo.length !== 11) {
      throw new Error('CPF informado deve conter exatamente 11 dígitos numéricos.');
    }
  }

  /**
   * Remove pontos, traços e espaços do CPF.
   */
  private limparCpf(cpf: string): string {
    return cpf.replace(/\D/g, '');
  }
}
export { ClienteService as Cliente };
