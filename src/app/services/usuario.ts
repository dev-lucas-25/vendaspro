import { Injectable } from '@angular/core';
import { DatabaseService } from './database';
import { Usuario } from '../models/usuario.model';

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  private loggedUser: Usuario | null = null;

  constructor(private db: DatabaseService) {}

  /**
   * Tenta realizar o login de um usuário validando as credenciais no banco SQLite.
   */
  async login(login: string, senha: string): Promise<Usuario | null> {
    if (!login || !senha) {
      throw new Error('Login e senha são obrigatórios.');
    }

    const results = this.db.query<Usuario>(
      "SELECT id, nome, login, situacao FROM usuarios WHERE login = ? AND senha = ?",
      [login.trim(), senha]
    );

    if (results.length > 0) {
      const user = results[0];
      if (user.situacao === 'Inativo') {
        throw new Error('Este usuário está inativo e não pode efetuar login.');
      }
      this.loggedUser = user;
      return this.loggedUser;
    }

    this.loggedUser = null;
    return null;
  }

  /**
   * Cadastra um novo usuário no banco SQLite com validação de dados.
   */
  async cadastrar(usuario: Usuario): Promise<void> {
    if (!usuario.nome || !usuario.nome.trim()) {
      throw new Error('Nome do usuário é obrigatório.');
    }
    if (!usuario.login || !usuario.login.trim()) {
      throw new Error('Login do usuário é obrigatório.');
    }
    if (!usuario.senha || !usuario.senha.trim()) {
      throw new Error('Senha do usuário é obrigatória.');
    }

    // Verificar se o login já existe
    const existente = this.db.query<Usuario>(
      'SELECT id FROM usuarios WHERE login = ?',
      [usuario.login.trim()]
    );
    if (existente.length > 0) {
      throw new Error('Este login já está cadastrado.');
    }

    this.db.run(
      "INSERT INTO usuarios (nome, login, senha, situacao) VALUES (?, ?, ?, 'Ativo')",
      [usuario.nome.trim(), usuario.login.trim(), usuario.senha]
    );
  }

  /**
   * Retorna a lista de todos os usuários.
   */
  async listar(): Promise<Usuario[]> {
    return this.db.query<Usuario>('SELECT id, nome, login, situacao FROM usuarios ORDER BY nome ASC');
  }

  /**
   * Busca um usuário pelo ID.
   */
  async buscarPorId(id: number): Promise<Usuario | null> {
    const results = this.db.query<Usuario>('SELECT id, nome, login, situacao FROM usuarios WHERE id = ?', [id]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Atualiza os dados de um usuário existente.
   */
  async atualizar(usuario: Usuario): Promise<void> {
    if (!usuario.id) {
      throw new Error('ID do usuário é obrigatório para atualização.');
    }
    if (!usuario.nome || !usuario.nome.trim()) {
      throw new Error('Nome do usuário é obrigatório.');
    }
    if (!usuario.login || !usuario.login.trim()) {
      throw new Error('Login do usuário é obrigatório.');
    }

    // Verificar se o login já existe em outro usuário
    const existente = this.db.query<Usuario>(
      'SELECT id FROM usuarios WHERE login = ? AND id != ?',
      [usuario.login.trim(), usuario.id]
    );
    if (existente.length > 0) {
      throw new Error('Este login já está cadastrado para outro usuário.');
    }

    if (usuario.senha && usuario.senha.trim()) {
      // Atualizar com senha
      this.db.run(
        'UPDATE usuarios SET nome = ?, login = ?, senha = ?, situacao = ? WHERE id = ?',
        [usuario.nome.trim(), usuario.login.trim(), usuario.senha, usuario.situacao || 'Ativo', usuario.id]
      );
    } else {
      // Atualizar sem alterar a senha
      this.db.run(
        'UPDATE usuarios SET nome = ?, login = ?, situacao = ? WHERE id = ?',
        [usuario.nome.trim(), usuario.login.trim(), usuario.situacao || 'Ativo', usuario.id]
      );
    }

    // Atualizar o estado do usuário logado se for o próprio
    if (this.loggedUser && this.loggedUser.id === usuario.id) {
      this.loggedUser.nome = usuario.nome.trim();
      this.loggedUser.login = usuario.login.trim();
      if (usuario.situacao) {
        this.loggedUser.situacao = usuario.situacao;
      }
    }
  }

  /**
   * Exclui um usuário se ele não tiver nenhuma venda registrada.
   */
  async excluir(id: number): Promise<void> {
    if (this.loggedUser && this.loggedUser.id === id) {
      throw new Error('Não é permitido excluir o usuário ativo da sessão.');
    }

    // Verificar se possui vendas
    const vendas = this.db.query<{ count: number }>('SELECT COUNT(*) as count FROM vendas WHERE usuario_id = ?', [id]);
    if (vendas.length > 0 && vendas[0].count > 0) {
      throw new Error('Este usuário possui vendas vinculadas e não pode ser excluído permanentemente.');
    }

    this.db.run('DELETE FROM usuarios WHERE id = ?', [id]);
  }

  /**
   * Retorna o usuário atualmente autenticado.
   */
  getLoggedUser(): Usuario | null {
    return this.loggedUser;
  }

  /**
   * Finaliza a sessão do usuário.
   */
  logout(): void {
    this.loggedUser = null;
  }
}
export { UsuarioService as Usuario };

