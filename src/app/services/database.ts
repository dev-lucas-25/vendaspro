import { Injectable } from '@angular/core';
import initSqlJs, { Database as SqlDatabase, SqlJsStatic } from 'sql.js';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  private db: SqlDatabase | null = null;
  private SQL: SqlJsStatic | null = null;
  private isInitialized = false;
  private isInTransaction = false;

  constructor() {}

  /**
   * Inicializa o banco de dados SQLite.
   * Carrega o WebAssembly do sql.js e abre a base de dados a partir do LocalStorage (se existir).
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('DatabaseService: Inicializando sql.js...');
      this.SQL = await initSqlJs({
        locateFile: (filename: string) => {
          const isKarma = typeof window !== 'undefined' && (window as any).__karma__;
          return isKarma ? `/base/node_modules/sql.js/dist/${filename}` : `/assets/${filename}`;
        },
      });

      const savedDb = localStorage.getItem('vendapro_db');
      if (savedDb) {
        console.log('DatabaseService: Carregando banco de dados existente do LocalStorage...');
        const binaryDb = this.base64ToUint8Array(savedDb);
        this.db = new this.SQL.Database(binaryDb);
      } else {
        console.log('DatabaseService: Criando novo banco de dados...');
        this.db = new this.SQL.Database();
        this.createTables();
        this.insertSeeds();
      }

      this.runMigrations();

      this.isInitialized = true;
      console.log('DatabaseService: Banco de dados inicializado com sucesso.');
    } catch (error) {
      console.error('DatabaseService: Erro ao inicializar o banco de dados:', error);
      throw error;
    }
  }

  /**
   * Executa uma consulta SELECT e retorna um array de objetos tipados.
   */
  query<T = any>(sql: string, params: any[] = []): T[] {
    if (!this.db) {
      throw new Error('Banco de dados não inicializado. Chame initialize() primeiro.');
    }

    try {
      const stmt = this.db.prepare(sql);
      stmt.bind(params);
      const results: T[] = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject() as T);
      }
      stmt.free();
      return results;
    } catch (error) {
      console.error(`DatabaseService: Erro ao executar query [${sql}]:`, error);
      throw error;
    }
  }

  /**
   * Executa uma instrução SQL de alteração de dados (INSERT, UPDATE, DELETE, DDL).
   * Persiste as alterações no LocalStorage automaticamente (exceto durante transações).
   */
  run(sql: string, params: any[] = []): void {
    if (!this.db) {
      throw new Error('Banco de dados não inicializado. Chame initialize() primeiro.');
    }

    try {
      const stmt = this.db.prepare(sql);
      stmt.run(params);
      stmt.free();
      // Apenas persiste fora de transações para evitar conflitos com COMMIT/ROLLBACK
      if (!this.isInTransaction) {
        this.persist();
      }
    } catch (error) {
      console.error(`DatabaseService: Erro ao executar run [${sql}]:`, error);
      throw error;
    }
  }

  /**
   * Retorna o ID do último registro inserido (AUTOINCREMENT).
   */
  getLastInsertId(): number {
    const res = this.query<{ id: number }>('SELECT last_insert_rowid() as id');
    return res.length > 0 ? res[0].id : 0;
  }

  /**
   * Executa operações dentro de uma transação SQLite.
   * Faz Rollback em caso de erro, ou Commit caso tenha sucesso.
   * Define flag isInTransaction para evitar persist() durante operações dentro da transação.
   */
  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    if (!this.db) {
      throw new Error('Banco de dados não inicializado. Chame initialize() primeiro.');
    }

    try {
      this.isInTransaction = true;
      this.db.exec('BEGIN TRANSACTION;');
      const result = await callback();
      this.db.exec('COMMIT;');
      this.isInTransaction = false;
      this.persist();
      return result;
    } catch (error) {
      console.warn('DatabaseService: Ocorreu um erro. Executando ROLLBACK na transação.', error);
      try {
        this.db.exec('ROLLBACK;');
      } catch (rollbackError) {
        console.error('DatabaseService: Erro ao executar ROLLBACK:', rollbackError);
      }
      this.isInTransaction = false;
      throw error;
    }
  }

  /**
   * Salva o estado atual do banco de dados no LocalStorage em formato Base64.
   */
  private persist(): void {
    if (!this.db) return;
    try {
      const binaryArray = this.db.export();
      const base64 = this.uint8ArrayToBase64(binaryArray);
      localStorage.setItem('vendapro_db', base64);
    } catch (error) {
      console.error('DatabaseService: Erro ao persistir dados:', error);
    }
  }

  /**
   * Cria as tabelas do sistema caso não existam.
   */
  private createTables(): void {
    console.log('DatabaseService: Criando tabelas do sistema...');
    
    // Tabela: usuarios
    this.run(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        login TEXT NOT NULL UNIQUE,
        senha TEXT NOT NULL,
        situacao TEXT NOT NULL DEFAULT 'Ativo'
      );
    `);

    // Tabela: clientes
    this.run(`
      CREATE TABLE IF NOT EXISTS clientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        telefone TEXT NOT NULL,
        email TEXT NOT NULL,
        cpf TEXT NOT NULL UNIQUE
      );
    `);

    // Tabela: produtos
    this.run(`
      CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        descricao TEXT NOT NULL,
        preco REAL NOT NULL,
        estoque INTEGER NOT NULL,
        codigo_barras TEXT NOT NULL UNIQUE
      );
    `);

    // Tabela: vendas
    this.run(`
      CREATE TABLE IF NOT EXISTS vendas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente_id INTEGER NOT NULL,
        usuario_id INTEGER,
        data_venda TEXT NOT NULL,
        subtotal REAL NOT NULL,
        total REAL NOT NULL,
        forma_pagamento TEXT,
        data_vencimento TEXT,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      );
    `);

    // Tabela: itens_venda
    this.run(`
      CREATE TABLE IF NOT EXISTS itens_venda (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        venda_id INTEGER NOT NULL,
        produto_id INTEGER NOT NULL,
        quantidade INTEGER NOT NULL,
        preco_unitario REAL NOT NULL,
        subtotal REAL NOT NULL,
        FOREIGN KEY (venda_id) REFERENCES vendas(id),
        FOREIGN KEY (produto_id) REFERENCES produtos(id)
      );
    `);

    // Tabela: devolucoes
    this.run(`
      CREATE TABLE IF NOT EXISTS devolucoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        venda_id INTEGER NOT NULL,
        produto_id INTEGER NOT NULL,
        quantidade INTEGER NOT NULL,
        data_devolucao TEXT NOT NULL,
        FOREIGN KEY (venda_id) REFERENCES vendas(id),
        FOREIGN KEY (produto_id) REFERENCES produtos(id)
      );
    `);

    // Tabela: recebimentos
    this.run(`
      CREATE TABLE IF NOT EXISTS recebimentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        venda_id INTEGER NOT NULL,
        valor REAL NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('Pendente', 'Pago', 'Cancelado')),
        data_pagamento TEXT,
        FOREIGN KEY (venda_id) REFERENCES vendas(id)
      );
    `);
  }

  /**
   * Executa migrações incrementais no banco de dados SQLite para atualizar a estrutura de tabelas existentes.
   */
  private runMigrations(): void {
    console.log('DatabaseService: Verificando e executando migrações...');
    
    // Adicionar coluna 'situacao' na tabela 'usuarios'
    try {
      this.run("ALTER TABLE usuarios ADD COLUMN situacao TEXT NOT NULL DEFAULT 'Ativo';");
      console.log('DatabaseService: Migração - Coluna "situacao" adicionada à tabela "usuarios".');
    } catch (e) {
      // Ignora erro se a coluna já existir
    }

    // Adicionar coluna 'usuario_id' na tabela 'vendas'
    try {
      this.run("ALTER TABLE vendas ADD COLUMN usuario_id INTEGER;");
      console.log('DatabaseService: Migração - Coluna "usuario_id" adicionada à tabela "vendas".');
    } catch (e) {
      // Ignora erro se a coluna já existir
    }

    // Adicionar coluna 'forma_pagamento' na tabela 'vendas'
    try {
      this.run("ALTER TABLE vendas ADD COLUMN forma_pagamento TEXT;");
      console.log('DatabaseService: Migração - Coluna "forma_pagamento" adicionada à tabela "vendas".');
    } catch (e) {
      // Ignora erro se a coluna já existir
    }

    // Adicionar coluna 'data_vencimento' na tabela 'vendas'
    try {
      this.run("ALTER TABLE vendas ADD COLUMN data_vencimento TEXT;");
      console.log('DatabaseService: Migração - Coluna "data_vencimento" adicionada à tabela "vendas".');
    } catch (e) {
      // Ignora erro se a coluna já existir
    }
  }

  /**
   * Insere dados semente padrão no banco de dados recém-criado.
   */
  private insertSeeds(): void {
    console.log('DatabaseService: Inserindo dados semente (Seeds)...');

    // Usuário administrador padrão (senha: admin123)
    this.run(
      'INSERT OR IGNORE INTO usuarios (id, nome, login, senha) VALUES (?, ?, ?, ?);',
      [1, 'Administrador', 'admin', 'admin123']
    );

    // Clientes
    this.run(
      'INSERT OR IGNORE INTO clientes (id, nome, telefone, email, cpf) VALUES (?, ?, ?, ?, ?);',
      [1, 'João Silva', '(11) 99999-9999', 'joao@email.com', '123.456.789-00']
    );
    this.run(
      'INSERT OR IGNORE INTO clientes (id, nome, telefone, email, cpf) VALUES (?, ?, ?, ?, ?);',
      [2, 'Maria Oliveira', '(11) 98888-8888', 'maria@email.com', '987.654.321-11']
    );

    // Produtos
    this.run(
      'INSERT OR IGNORE INTO produtos (id, nome, descricao, preco, estoque, codigo_barras) VALUES (?, ?, ?, ?, ?, ?);',
      [1, 'Caneca VendaPro', 'Caneca personalizada em cerâmica VendaPro', 25.00, 50, '7891234567890']
    );
    this.run(
      'INSERT OR IGNORE INTO produtos (id, nome, descricao, preco, estoque, codigo_barras) VALUES (?, ?, ?, ?, ?, ?);',
      [2, 'Camiseta VendaPro', 'Camiseta oficial em algodão VendaPro', 59.90, 30, '7891234567891']
    );
    this.run(
      'INSERT OR IGNORE INTO produtos (id, nome, descricao, preco, estoque, codigo_barras) VALUES (?, ?, ?, ?, ?, ?);',
      [3, 'Chaveiro VendaPro', 'Chaveiro emborrachado logotipo VendaPro', 10.00, 100, '7891234567892']
    );
  }

  // Métodos utilitários de conversão binária
  private uint8ArrayToBase64(arr: Uint8Array): string {
    let binary = '';
    const len = arr.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(arr[i]);
    }
    return btoa(binary);
  }

  private base64ToUint8Array(base64: string): Uint8Array {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}
