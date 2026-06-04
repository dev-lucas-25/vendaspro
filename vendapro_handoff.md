# 📋 VendaPro — Documento Técnico de Handoff

> **Versão:** 1.0 — Gerado em: Junho/2026
> **Finalidade:** Documentação oficial de continuidade do desenvolvimento para transferência a outra IA ou equipe.

---

## 1. Visão Geral do Projeto

### 1.1 Objetivo do Sistema
O **VendaPro** é um sistema de gestão comercial **offline-first** voltado para pequenos negócios. Permite gerenciar todo o ciclo de vendas: cadastro de clientes, produtos, registro de vendas, devoluções e controle financeiro — tudo sem depender de internet ou backend externo.

### 1.2 Tecnologias Utilizadas

| Tecnologia | Versão | Finalidade |
|---|---|---|
| Ionic Framework | ^8.0.0 | Framework de UI mobile/web |
| Angular | ^20.0.0 | Framework frontend (Standalone Components) |
| TypeScript | ~5.9.0 | Tipagem estática |
| sql.js | ^1.14.1 | SQLite compilado em WebAssembly |
| LocalStorage (Browser) | — | Persistência binária do banco SQLite em Base64 |
| ionicons | ^7.0.0 | Biblioteca de ícones |
| Capacitor | 8.x | Bridge para compilação nativa (Android/iOS) |

### 1.3 Arquitetura Adotada

```
Arquitetura: Angular Standalone Components + Service Layer
Padrão: Feature-based pages com Services singleton
Persistência: SQLite (sql.js via WebAssembly) → serializado em LocalStorage (Base64)
Sem backend, sem API externa, sem Firebase.
```

**Fluxo de dados:**
```
[Page Component] ←→ [Service] ←→ [DatabaseService] ←→ [sql.js (SQLite)]
                                                              ↓
                                                     [LocalStorage (Base64)]
```

---

## 2. Estrutura do Projeto

### 2.1 Estrutura de Pastas

```
c:\Users\lucas\vendaspro\
├── angular.json                  # Configuração do Angular CLI / budgets
├── package.json                  # Dependências do projeto
├── capacitor.config.ts           # Configuração do Capacitor
└── src/
    ├── main.ts                   # Bootstrap com APP_INITIALIZER do DatabaseService
    ├── global.scss               # Design system global: variáveis CSS, tipografia, utilitários
    └── app/
        ├── app.routes.ts         # Roteamento lazy-loaded de todos os módulos
        ├── models/               # Interfaces de dados (TypeScript)
        │   ├── usuario.model.ts
        │   ├── cliente.model.ts
        │   ├── produto.model.ts
        │   ├── venda.model.ts
        │   ├── item-venda.model.ts
        │   ├── devolucao.model.ts
        │   └── recebimento.model.ts
        ├── services/             # Lógica de negócio e acesso ao banco
        │   ├── database.ts       # ★ Serviço central do SQLite
        │   ├── usuario.ts
        │   ├── cliente.ts
        │   ├── produto.ts
        │   ├── venda.ts
        │   ├── devolucao.ts
        │   ├── financeiro.ts
        │   └── relatorios.ts
        └── pages/                # Componentes visuais (Ionic Standalone)
            ├── login/
            ├── menu/
            ├── cadastro-usuario/
            ├── lista-usuarios/
            ├── cadastro-cliente/
            ├── lista-clientes/
            ├── cadastro-produto/
            ├── lista-produtos/
            ├── nova-venda/
            ├── lista-vendas/
            ├── detalhes-venda/
            ├── devolucao/
            ├── receber/
            ├── relatorios/
            └── sobre/
```

### 2.2 Descrição de Cada Página

| Página | Rota | Status | Descrição |
|---|---|---|---|
| `login` | `/login` | ✅ Completa | Autenticação com validação de situação do usuário (bloqueia inativos) |
| `menu` | `/menu` | ✅ Completa | Dashboard com cards de navegação e KPIs resumidos (vendas, estoque, pendentes) |
| `cadastro-usuario` | `/cadastro-usuario` | ✅ Completa | Formulário de criação e edição de usuários com confirmação de senha e seleção de situação |
| `lista-usuarios` | `/lista-usuarios` | ✅ Completa | Listagem com busca, badges de status, botões Ativar/Inativar e Excluir com regras de proteção |
| `cadastro-cliente` | `/cadastro-cliente` | ✅ Completa | Formulário de criação de clientes com máscara de CPF e telefone |
| `lista-clientes` | `/lista-clientes` | ⚠️ Parcial | Listagem com busca e FAB de novo cadastro — **falta edição e exclusão de clientes** |
| `cadastro-produto` | `/cadastro-produto` | ⚠️ Parcial | Formulário de criação de produtos — **falta modo de edição (query param `id`)** |
| `lista-produtos` | `/lista-produtos` | ⚠️ Parcial | Listagem com busca e badges de estoque — **falta edição e exclusão de produtos** |
| `nova-venda` | `/nova-venda` | ✅ Completa | Seleção de cliente, busca de produtos, carrinho dinâmico e finalização de venda |
| `lista-vendas` | `/lista-vendas` | ✅ Completa | Histórico de vendas com link para detalhes |
| `detalhes-venda` | `/detalhes-venda/:id` | ✅ Completa | Detalhamento de venda com cliente, itens e valores |
| `devolucao` | `/devolucao` | ✅ Completa | Registro de devolução de itens por venda com validação de quantidade |
| `receber` | `/receber` | ✅ Completa | Listagem de recebimentos com filtros de status e ação de registrar pagamento |
| `relatorios` | `/relatorios` | ⚠️ Parcial | Exibe KPIs e top produtos — **HTML/SCSS precisam de aprimoramento visual** |
| `sobre` | `/sobre` | ❌ Pendente | Scaffold gerado pelo Ionic CLI — nenhuma implementação realizada |

### 2.3 Descrição de Cada Service

| Service | Arquivo | Responsabilidade |
|---|---|---|
| `DatabaseService` | `database.ts` | Inicializa sql.js, abre/cria o banco SQLite, executa `createTables()`, `runMigrations()`, `insertSeeds()`, expõe `query<T>()`, `run()`, `transaction()`, `getLastInsertId()`, persiste em LocalStorage |
| `UsuarioService` | `usuario.ts` | Login (valida situação), cadastrar, listar, buscarPorId, atualizar (com senha opcional), excluir (com proteção de sessão e verificação de vendas), getLoggedUser, logout |
| `ClienteService` | `cliente.ts` | Cadastrar (CPF único, validação completa), listar, buscarPorId — **faltam atualizar() e excluir()** |
| `ProdutoService` | `produto.ts` | Cadastrar, atualizar, listar, buscarPorId, buscarPorCodigoBarras, atualizarEstoque — **falta excluir()** |
| `VendaService` | `venda.ts` | registrarVenda() (validação de estoque, transação SQLite, baixa de estoque, gera recebimento, grava usuario_id), listarVendas(), buscarPorId() |
| `DevolucaoService` | `devolucao.ts` | registrarDevolucao() (valida quantidade, restaura estoque, ajusta recebimento financeiro, transação SQLite), listarDevolucoes(), buscarPorVenda() |
| `FinanceiroService` | `financeiro.ts` | registrarPagamento(), cancelarRecebimento(), buscarPorId(), buscarPorVenda(), listarRecebimentos() com filtro por status |
| `RelatoriosService` | `relatorios.ts` | getTotalVendas(), getValorVendido(), getProdutosMaisVendidos(), getEstoqueAtual(), getEstoqueBaixo(), getRecebimentosPendentes(), getRecebimentosPagos() |

### 2.4 Descrição dos Models

```typescript
// usuario.model.ts
interface Usuario {
  id?: number;
  nome: string;
  login: string;
  senha?: string;
  situacao?: 'Ativo' | 'Inativo';   // ← Adicionado na última sessão
}

// cliente.model.ts
interface Cliente {
  id?: number;
  nome: string;
  telefone: string;
  email: string;
  cpf: string;
}

// produto.model.ts
interface Produto {
  id?: number;
  nome: string;
  descricao: string;
  preco: number;
  estoque: number;
  codigo_barras: string;
}

// venda.model.ts
interface Venda {
  id?: number;
  cliente_id: number;
  usuario_id?: number;    // ← Adicionado na última sessão (auditoria do operador)
  data_venda: string;
  subtotal: number;
  total: number;
  cliente?: Cliente;      // Relacionamento carregado
  itens?: ItemVenda[];    // Relacionamento carregado
}

// item-venda.model.ts
interface ItemVenda {
  id?: number;
  venda_id?: number;
  produto_id: number;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  produto?: Produto;      // Relacionamento carregado
}

// devolucao.model.ts
interface Devolucao {
  id?: number;
  venda_id: number;
  produto_id: number;
  quantidade: number;
  data_devolucao: string;
}

// recebimento.model.ts
interface Recebimento {
  id?: number;
  venda_id: number;
  valor: number;
  status: 'Pendente' | 'Pago' | 'Cancelado';
  data_pagamento?: string;
}
```

---

## 3. Banco de Dados SQLite

### 3.1 Mecanismo de Persistência
O banco é mantido em memória pelo **sql.js** (WebAssembly). A cada operação de escrita (`run()`), o estado binário do banco é exportado e salvo no `localStorage` do navegador como string Base64 na chave `vendapro_db`. Ao inicializar, o banco é restaurado do LocalStorage.

### 3.2 Tabelas e Campos

#### `usuarios`
| Campo | Tipo | Restrições |
|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT |
| `nome` | TEXT | NOT NULL |
| `login` | TEXT | NOT NULL UNIQUE |
| `senha` | TEXT | NOT NULL |
| `situacao` | TEXT | NOT NULL DEFAULT `'Ativo'` |

#### `clientes`
| Campo | Tipo | Restrições |
|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT |
| `nome` | TEXT | NOT NULL |
| `telefone` | TEXT | NOT NULL |
| `email` | TEXT | NOT NULL |
| `cpf` | TEXT | NOT NULL UNIQUE |

#### `produtos`
| Campo | Tipo | Restrições |
|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT |
| `nome` | TEXT | NOT NULL |
| `descricao` | TEXT | NOT NULL |
| `preco` | REAL | NOT NULL |
| `estoque` | INTEGER | NOT NULL |
| `codigo_barras` | TEXT | NOT NULL UNIQUE |

#### `vendas`
| Campo | Tipo | Restrições |
|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT |
| `cliente_id` | INTEGER | NOT NULL, FK → clientes(id) |
| `usuario_id` | INTEGER | FK → usuarios(id) (nullable — auditoria) |
| `data_venda` | TEXT | NOT NULL (ISO 8601) |
| `subtotal` | REAL | NOT NULL |
| `total` | REAL | NOT NULL |

#### `itens_venda`
| Campo | Tipo | Restrições |
|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT |
| `venda_id` | INTEGER | NOT NULL, FK → vendas(id) |
| `produto_id` | INTEGER | NOT NULL, FK → produtos(id) |
| `quantidade` | INTEGER | NOT NULL |
| `preco_unitario` | REAL | NOT NULL |
| `subtotal` | REAL | NOT NULL |

#### `devolucoes`
| Campo | Tipo | Restrições |
|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT |
| `venda_id` | INTEGER | NOT NULL, FK → vendas(id) |
| `produto_id` | INTEGER | NOT NULL, FK → produtos(id) |
| `quantidade` | INTEGER | NOT NULL |
| `data_devolucao` | TEXT | NOT NULL (ISO 8601) |

#### `recebimentos`
| Campo | Tipo | Restrições |
|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT |
| `venda_id` | INTEGER | NOT NULL, FK → vendas(id) |
| `valor` | REAL | NOT NULL |
| `status` | TEXT | NOT NULL, CHECK IN (`'Pendente'`, `'Pago'`, `'Cancelado'`) |
| `data_pagamento` | TEXT | nullable |

### 3.3 Relacionamentos

```
usuarios ──┐
           │ (usuario_id) 1:N
clientes ──┤
           │ (cliente_id) 1:N
           └─────────────────→ vendas ──────────────→ recebimentos (1:1)
                                  │
                                  │ (venda_id) 1:N
                                  └──→ itens_venda ──→ produtos
                                  │
                                  │ (venda_id) 1:N
                                  └──→ devolucoes ───→ produtos
```

### 3.4 Regras de Integridade
- SQLite usa `FOREIGN KEY` com suporte ativo (verificar se `PRAGMA foreign_keys = ON` é necessário em futuras versões do sql.js).
- Unicidade: `login` em `usuarios`, `cpf` em `clientes`, `codigo_barras` em `produtos`.
- Status de recebimento: campo `CHECK` garante apenas os valores `'Pendente'`, `'Pago'` ou `'Cancelado'`.
- **Migrações**: O método `runMigrations()` em `DatabaseService` garante compatibilidade incremental com bancos já existentes em LocalStorage usando `ALTER TABLE ... ADD COLUMN` em blocos `try/catch`.

### 3.5 Dados Semente (Seeds)
Inseridos automaticamente na primeira execução do app (banco novo):
- **Usuário admin**: login `admin`, senha `admin123`, situação `Ativo`
- **Clientes**: João Silva (CPF: 123.456.789-00), Maria Oliveira (CPF: 987.654.321-11)
- **Produtos**: Caneca VendaPro (R$25,00, estoque 50), Camiseta VendaPro (R$59,90, estoque 30), Chaveiro VendaPro (R$10,00, estoque 100)

---

## 4. Funcionalidades Implementadas por Módulo

### 🔐 Login
- **Status:** ✅ Completo
- **O que funciona:** Validação de credenciais no SQLite, bloqueio de usuários inativos, redirecionamento autenticado para o Menu, guarda do estado logado em memória (`loggedUser`)
- **Testado:** Fluxo de login com credenciais corretas e incorretas
- **Pendente:** Não há tela de recuperação de senha (desnecessário — sistema local)

### 👤 Usuários
- **Status:** ✅ Completo
- **O que funciona:** Listar, cadastrar, editar (com senha opcional na edição), ativar/inativar (inativação lógica), excluir fisicamente (bloqueado se tiver vendas), proteção de auto-exclusão e auto-inativação, bloqueio de login para inativos
- **Testado:** Build compilado com sucesso, fluxos validados via código
- **Pendente:** —

### 👥 Clientes
- **Status:** ⚠️ Parcial
- **O que funciona:** Listar com busca em tempo real, cadastrar com validação de CPF único e máscara automática de CPF/telefone
- **Testado:** Cadastro e listagem
- **Pendente:** Implementar edição de clientes (query param `?id=` no cadastro), implementar exclusão com proteção de vendas vinculadas, adicionar `atualizar()` e `excluir()` no `ClienteService`

### 📦 Produtos
- **Status:** ⚠️ Parcial
- **O que funciona:** Listar com busca e badges de estoque (Sem estoque / Baixo / OK), cadastrar com validação de código de barras único
- **Testado:** Cadastro e listagem
- **Pendente:** Implementar modo de edição (query param `?id=` no cadastro-produto), implementar exclusão com proteção de itens vendidos, adicionar `excluir()` no `ProdutoService`, adicionar botões de ação (editar/excluir) nos cards da lista

### 🛒 Vendas
- **Status:** ✅ Completo
- **O que funciona:** Criar nova venda com seleção de cliente, busca de produtos por nome/código de barras, carrinho dinâmico com incremento/decremento, validação de estoque, transação SQLite, baixa automática de estoque, geração de recebimento pendente, gravação do `usuario_id` do operador, listagem de vendas, detalhes da venda com itens
- **Testado:** Fluxo completo validado em ionic serve
- **Pendente:** Não há cancelamento de venda implementado

### 🔄 Devoluções
- **Status:** ✅ Completo
- **O que funciona:** Seleção de venda, seleção de produto da venda, entrada de quantidade devolvida, validação de quantidade (não exceder total vendido menos devoluções anteriores), restauração de estoque, ajuste do recebimento financeiro (reduz valor proporcional; zera = Cancelado), listagem de devoluções
- **Testado:** Fluxo de devolução válido e inválido via código
- **Pendente:** —

### 💰 Financeiro
- **Status:** ✅ Completo
- **O que funciona:** Listagem de recebimentos com filtro por status (Todos / Pendente / Pago / Cancelado), ação de registrar pagamento (muda status para Pago, registra data), bloqueio de ações duplicadas, exibição de total pendente
- **Testado:** Fluxo de pagamento registrado via ionic serve
- **Pendente:** Cancelamento manual de recebimento ainda não tem botão na tela (o método `cancelarRecebimento()` existe no service, mas não está exposto na UI)

### 📊 Relatórios
- **Status:** ⚠️ Parcial
- **O que funciona:** Carregamento dos KPIs (total de vendas, valor vendido, estoque atual, recebimentos pendentes), top 5 produtos mais vendidos, lista de produtos com estoque baixo (≤10 unidades)
- **Testado:** Compilação e carregamento de dados
- **Pendente:** Design visual da tela (HTML/SCSS) precisa de aprimoramento, não há filtro por período, não há exportação de relatórios

---

## 5. Processos de Negócio

### 5.1 Fluxo de Login
1. Usuário informa login e senha na tela `/login`
2. `UsuarioService.login()` executa query: `SELECT ... WHERE login = ? AND senha = ? AND situacao = 'Ativo'`
3. Se não encontrado → retorna `null`, tela exibe erro genérico
4. Se encontrado mas `situacao === 'Inativo'` → lança erro informando usuário inativo
5. Se autenticado → guarda `loggedUser` em memória no service
6. Navega para `/menu`

### 5.2 Fluxo de Cadastro de Usuários
1. Acessar `/lista-usuarios` → botão FAB `+` → navega para `/cadastro-usuario`
2. **Criação**: preencher Nome, Login, Senha, Confirmar Senha (todos obrigatórios)
3. Validações locais: campos vazios, senhas não coincidentes
4. `UsuarioService.cadastrar()`: verifica unicidade do login → INSERT com `situacao = 'Ativo'`
5. Toast de sucesso → redireciona para `/lista-usuarios`
6. **Edição**: acessar via botão de editar na lista → navega para `/cadastro-usuario?id=X`
7. `ngOnInit` detecta `id` → chama `buscarPorId()` → preenche formulário (senha em branco)
8. `UsuarioService.atualizar()`: atualiza nome, login, situação; atualiza senha apenas se preenchida

### 5.3 Fluxo de Cadastro de Clientes
1. Acessar `/lista-clientes` → botão FAB `+` → navega para `/cadastro-cliente`
2. Preencher Nome, CPF (com máscara automática), Telefone (com máscara), E-mail
3. `ClienteService.cadastrar()`: normaliza CPF para 11 dígitos, verifica unicidade → INSERT
4. Toast de sucesso → redireciona para `/lista-clientes`

### 5.4 Fluxo de Cadastro de Produtos
1. Acessar `/lista-produtos` → botão FAB `+` → navega para `/cadastro-produto`
2. Preencher Nome, Código de Barras, Preço, Estoque inicial, Descrição (opcional)
3. `ProdutoService.cadastrar()`: valida preço > 0, estoque ≥ 0, código único → INSERT
4. Toast de sucesso → redireciona para `/lista-produtos`

### 5.5 Fluxo de Venda
1. Acessar `/nova-venda` → carregar lista de clientes e produtos com estoque > 0
2. Selecionar cliente no `ion-select`
3. Buscar produtos por nome ou código de barras (campo de texto com filtro dinâmico)
4. Tocar no produto → adicionado ao carrinho; controles `+`/`-` ajustam quantidade (limitado ao estoque disponível)
5. Botão "Finalizar Venda" → `VendaService.registrarVenda()`:
   - Valida estoque de todos os itens
   - Captura `usuario_id` do operador logado
   - Inicia transação SQLite
   - INSERT na tabela `vendas` (com `usuario_id`)
   - INSERT em `itens_venda` para cada item
   - UPDATE de estoque: `estoque = estoque - quantidade` para cada produto
   - INSERT em `recebimentos` com `status = 'Pendente'`
   - COMMIT
6. Toast com número da venda → redireciona para `/lista-vendas`

### 5.6 Fluxo de Baixa de Estoque
- Ocorre automaticamente dentro da transação de venda (passo 5.5)
- Operação: `UPDATE produtos SET estoque = estoque - ? WHERE id = ?`
- Validação prévia: se `produto.estoque < item.quantidade` → erro antes da transação

### 5.7 Fluxo de Devolução
1. Acessar `/devolucao` → selecionar a venda no `ion-select`
2. Sistema carrega os itens da venda via `VendaService.buscarPorId()`
3. Selecionar produto e informar quantidade a devolver
4. `DevolucaoService.registrarDevolucao()`:
   - Valida se produto pertence à venda
   - Calcula devoluções anteriores do mesmo item
   - Valida quantidade (não exceder disponível)
   - Transação SQLite:
     - INSERT em `devolucoes`
     - UPDATE estoque: `estoque = estoque + quantidade_devolvida`
     - UPDATE recebimento: deduz valor proporcional (`quantidade × preco_unitario`)
     - Se valor do recebimento ≤ 0 → muda status para `'Cancelado'`
5. Toast de sucesso → recarrega detalhes da venda

### 5.8 Fluxo Financeiro
1. Acessar `/receber` → lista todos os recebimentos com filtro de status
2. Tocar em "Registrar Pagamento" num recebimento Pendente
3. `FinanceiroService.registrarPagamento()`:
   - Valida que não está Cancelado nem já Pago
   - UPDATE: `status = 'Pago'`, `data_pagamento = now`
4. Toast de sucesso → lista recarrega

### 5.9 Fluxo de Relatórios
1. Acessar `/relatorios` → carrega todos os KPIs simultaneamente via `Promise.all()`
2. Exibe: total de vendas, valor total vendido, estoque atual somado, pendentes financeiros
3. Lista top 5 produtos mais vendidos (com quantidade e faturamento)
4. Lista produtos com estoque ≤ 10 unidades

---

## 6. Regras de Negócio

### ✅ Implementadas

| # | Módulo | Regra |
|---|---|---|
| RN01 | Usuários | Login bloqueado para usuários com `situacao = 'Inativo'` |
| RN02 | Usuários | Usuário não pode excluir a si mesmo (proteção de sessão) |
| RN03 | Usuários | Exclusão física bloqueada se usuário tiver `usuario_id` em vendas |
| RN04 | Usuários | Usuário não pode inativar a si mesmo pela lista |
| RN05 | Usuários | Login deve ser único no banco |
| RN06 | Clientes | CPF deve ser único no banco |
| RN07 | Clientes | CPF deve ter exatamente 11 dígitos numéricos |
| RN08 | Clientes | E-mail deve conter `@` |
| RN09 | Produtos | Código de barras deve ser único no banco |
| RN10 | Produtos | Preço deve ser maior que zero |
| RN11 | Produtos | Estoque inicial não pode ser negativo |
| RN12 | Vendas | Venda deve ter pelo menos um item |
| RN13 | Vendas | Quantidade vendida não pode exceder o estoque disponível do produto |
| RN14 | Vendas | Toda venda gera um recebimento com `status = 'Pendente'` automaticamente |
| RN15 | Vendas | Toda venda grava o `usuario_id` do operador ativo para auditoria |
| RN16 | Devoluções | Quantidade devolvida não pode exceder (quantidade vendida − devoluções anteriores) |
| RN17 | Devoluções | Devolução restaura o estoque do produto automaticamente |
| RN18 | Devoluções | Devolução ajusta o valor do recebimento proporcionalmente |
| RN19 | Devoluções | Se o valor do recebimento zerar por devolução → status `'Cancelado'` |
| RN20 | Financeiro | Recebimento `'Cancelado'` não pode ser pago |
| RN21 | Financeiro | Recebimento já `'Pago'` não pode ser pago novamente |
| RN22 | Financeiro | Recebimento já `'Pago'` não pode ser cancelado |

### 📋 Planejadas (Não Implementadas)
- **RN23** — Clientes: Impedir exclusão de clientes com vendas vinculadas
- **RN24** — Produtos: Impedir exclusão de produtos presentes em `itens_venda` ou `devolucoes`
- **RN25** — Vendas: Impedir nova venda para clientes com recebimentos em aberto acima de X dias (regra de crédito opcional)
- **RN26** — Usuários: Exigir senha de mínimo 6 caracteres (validação atual apenas verifica não-vazio)

---

## 7. Pendências

### 🔴 Críticas (Bloqueantes para uso em produção)
1. **Módulo de Clientes — Edição**: Falta implementar modo edição no `cadastro-cliente` e adicionar `atualizar()` no `ClienteService`
2. **Módulo de Clientes — Exclusão**: Falta botões de ação na `lista-clientes` e método `excluir()` no `ClienteService` com proteção de vendas vinculadas
3. **Módulo de Produtos — Edição**: Falta detecção de query param `?id=` no `cadastro-produto` e integração com `ProdutoService.atualizar()`
4. **Módulo de Produtos — Exclusão**: Falta botões de ação na `lista-produtos` e método `excluir()` no `ProdutoService` com proteção de histórico

### 🟡 Importantes (Afetam experiência do usuário)
5. **Página Sobre**: Scaffold vazio — nenhuma implementação
6. **Relatórios — Visual**: HTML/SCSS da página `/relatorios` precisam de redesign premium
7. **Financeiro — Cancelamento na UI**: Botão de cancelar recebimento não existe na tela (method existe no service)
8. **Segurança de senha**: Sem regra de complexidade mínima (6+ caracteres, etc.)

### 🟢 Melhorias Desejáveis
9. **Relatórios — Filtro por período**: Filtrar vendas e recebimentos por data
10. **Relatórios — Exportação**: Exportar dados como CSV ou PDF
11. **Vendas — Cancelamento**: Implementar cancelamento de venda (reverter estoque, cancelar recebimento)
12. **Clientes — Endereço**: Adicionar campo de endereço no cadastro de clientes
13. **Produtos — Categoria**: Adicionar campo de categoria/grupo de produtos
14. **Dashboard — Gráficos**: Substituir KPIs estáticos por gráficos de barras/linha no menu
15. **Multi-empresa**: Estrutura atual é single-tenant; isolamento por empresa requer redesign do banco

---

## 8. Próximos Passos Priorizados

### 🔴 Alta Prioridade
1. **Completar CRUD de Clientes** — Edição + Exclusão (com proteção de RN23)
2. **Completar CRUD de Produtos** — Edição + Exclusão (com proteção de RN24)
3. **Implementar Página Sobre** — Informações do app, versão, créditos

### 🟡 Média Prioridade
4. **Redesign da Página de Relatórios** — Interface visual premium com cards de KPI e tabelas
5. **Botão de Cancelar Recebimento na UI** — Expor `FinanceiroService.cancelarRecebimento()` na tela `/receber`
6. **Validação de Senha com Complexidade Mínima** — Mínimo 6 caracteres
7. **Filtro por Período nos Relatórios** — Date range picker para filtrar vendas/recebimentos

### 🟢 Baixa Prioridade
8. **Cancelamento de Venda** — Reverter estoque e cancelar recebimento associado
9. **Exportação de Relatórios** — Gerar CSV via Blob download
10. **Campos Adicionais** — Endereço no cliente, categoria no produto
11. **Gráficos no Dashboard** — Integrar Chart.js ou ng2-charts

---

## 9. Arquivos Importantes

| Arquivo | Finalidade |
|---|---|
| [`src/main.ts`](file:///c:/Users/lucas/vendaspro/src/main.ts) | Bootstrap do Angular com `APP_INITIALIZER` que inicializa o banco SQLite antes de qualquer componente |
| [`src/global.scss`](file:///c:/Users/lucas/vendaspro/src/global.scss) | Design system completo: variáveis CSS (cores, tipografia), classes utilitárias, animações, dark theme |
| [`src/app/app.routes.ts`](file:///c:/Users/lucas/vendaspro/src/app/app.routes.ts) | Roteamento lazy-loaded de todas as páginas |
| [`src/app/services/database.ts`](file:///c:/Users/lucas/vendaspro/src/app/services/database.ts) | **Serviço mais crítico**: instancia sql.js, gerencia o banco, executa migrations, persiste em LocalStorage |
| [`src/app/services/usuario.ts`](file:///c:/Users/lucas/vendaspro/src/app/services/usuario.ts) | Autenticação, gestão de sessão, CRUD de usuários com regras de negócio |
| [`src/app/services/venda.ts`](file:///c:/Users/lucas/vendaspro/src/app/services/venda.ts) | Lógica transacional de vendas: estoque, itens, recebimento, audit trail |
| [`src/app/services/devolucao.ts`](file:///c:/Users/lucas/vendaspro/src/app/services/devolucao.ts) | Lógica de devolução com validação cruzada de quantidades e ajuste financeiro |
| [`angular.json`](file:///c:/Users/lucas/vendaspro/angular.json) | Configuração do build: assets (sql-wasm.wasm), budgets de CSS (6kb/10kb), environments |
| [`package.json`](file:///c:/Users/lucas/vendaspro/package.json) | Dependências: `sql.js: ^1.14.1`, `@ionic/angular: ^8.0.0`, `@angular: ^20.0.0` |

---

## 10. Checklist Final

### Infraestrutura e Arquitetura
- [x] [Concluído] Projeto Ionic Angular Standalone criado e configurado
- [x] [Concluído] sql.js instalado e configurado no angular.json (wasm no assets)
- [x] [Concluído] DatabaseService com inicialização assíncrona via APP_INITIALIZER
- [x] [Concluído] Sistema de migrations incrementais (ALTER TABLE tolerante a falhas)
- [x] [Concluído] Seeds iniciais inseridos (admin, clientes e produtos demo)
- [x] [Concluído] Design system global (dark theme, variáveis CSS, animações)
- [x] [Concluído] Roteamento lazy-loaded de todas as páginas

### Models
- [x] [Concluído] `Usuario` (com campo `situacao`)
- [x] [Concluído] `Cliente`
- [x] [Concluído] `Produto`
- [x] [Concluído] `Venda` (com campo `usuario_id`)
- [x] [Concluído] `ItemVenda`
- [x] [Concluído] `Devolucao`
- [x] [Concluído] `Recebimento`

### Services (Lógica de Negócio)
- [x] [Concluído] `DatabaseService` — completo
- [x] [Concluído] `UsuarioService` — CRUD completo + inativação + proteções
- [~] [Parcial] `ClienteService` — faltam `atualizar()` e `excluir()`
- [~] [Parcial] `ProdutoService` — falta `excluir()`
- [x] [Concluído] `VendaService` — completo + audit trail de usuario
- [x] [Concluído] `DevolucaoService` — completo
- [x] [Concluído] `FinanceiroService` — completo
- [x] [Concluído] `RelatoriosService` — completo

### Páginas / UI
- [x] [Concluído] `login` — autenticação com bloqueio de inativos
- [x] [Concluído] `menu` — dashboard com KPIs e navegação
- [x] [Concluído] `cadastro-usuario` — criação e edição com senha opcional
- [x] [Concluído] `lista-usuarios` — busca, ativar/inativar, excluir com proteções
- [x] [Concluído] `cadastro-cliente` — criação com máscaras
- [~] [Parcial] `lista-clientes` — falta edição e exclusão
- [x] [Concluído] `cadastro-produto` — criação completa
- [~] [Parcial] `lista-produtos` — falta edição e exclusão
- [x] [Concluído] `nova-venda` — carrinho completo com validações
- [x] [Concluído] `lista-vendas` — histórico
- [x] [Concluído] `detalhes-venda` — detalhamento completo
- [x] [Concluído] `devolucao` — formulário com validações cruzadas
- [x] [Concluído] `receber` — listagem e ação de pagamento
- [~] [Parcial] `relatorios` — lógica OK, visual precisa de redesign
- [ ] [Pendente] `sobre` — não implementada

### Regras de Negócio
- [x] [Concluído] Login — bloqueio de inativos
- [x] [Concluído] Usuários — proteção de sessão e histórico
- [x] [Concluído] Clientes — CPF único e validações
- [x] [Concluído] Produtos — código único, preço > 0, estoque ≥ 0
- [x] [Concluído] Vendas — validação de estoque, transação atômica
- [x] [Concluído] Devoluções — validação de quantidade cruzada
- [x] [Concluído] Financeiro — regras de estado (Pendente→Pago, bloqueios)
- [ ] [Pendente] Clientes — proteção de exclusão com vendas vinculadas (RN23)
- [ ] [Pendente] Produtos — proteção de exclusão com histórico (RN24)
- [ ] [Pendente] Senhas — validação de complexidade mínima (RN26)

---

*Documento gerado automaticamente pelo agente de desenvolvimento Antigravity.*
*Última atualização: Junho de 2026.*
