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
      'SELECT id, nome, login FROM usuarios WHERE login = ? AND senha = ?',
      [login.trim(), senha]
    );

    if (results.length > 0) {
      this.loggedUser = results[0];
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
      'INSERT INTO usuarios (nome, login, senha) VALUES (?, ?, ?)',
      [usuario.nome.trim(), usuario.login.trim(), usuario.senha]
    );
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
