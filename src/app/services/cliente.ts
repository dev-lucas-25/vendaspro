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
