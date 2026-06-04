# PROJECT_STATE.md — VendaPro
> **Última atualização:** Junho/2026  
> **Finalidade:** Documento de handoff para continuidade do desenvolvimento por outra IA.  
> **LEIA ESTE ARQUIVO INTEIRO ANTES DE FAZER QUALQUER ALTERAÇÃO NO PROJETO.**

---

## 1. Stack Tecnológica

```
Framework:     Ionic Angular 8 + Angular 20 (Standalone Components)
Linguagem:     TypeScript 5.9
Banco:         sql.js v1.14.1 (SQLite via WebAssembly)
Persistência:  LocalStorage (banco serializado em Base64, chave: "vendapro_db")
Estilo:        SCSS por componente + Design System global em src/global.scss
Ícones:        ionicons v7 (importação individual via addIcons())
Bootstrap:     APP_INITIALIZER em src/main.ts inicializa DatabaseService antes de tudo
Sem backend.   Sem Firebase. Sem API externa. 100% offline.
```

---

## 2. Estado Atual do Projeto

### ✅ COMPLETO — Pronto para uso

| Módulo | Pages | Service | Observação |
|---|---|---|---|
| **Login** | `login` | `UsuarioService.login()` | Bloqueia inativos; guarda sessão em memória |
| **Menu/Dashboard** | `menu` | `RelatoriosService` (KPIs) | Exibe 4 KPIs e grade de navegação |
| **Usuários** | `cadastro-usuario`, `lista-usuarios` | `UsuarioService` (CRUD completo) | Ativar/Inativar, exclusão protegida, anti auto-exclusão |
| **Vendas** | `nova-venda`, `lista-vendas`, `detalhes-venda` | `VendaService` | Carrinho, validação estoque, transação atômica, audit trail |
| **Devoluções** | `devolucao` | `DevolucaoService` | Valida quantidade, restaura estoque, ajusta recebimento |
| **Financeiro** | `receber` | `FinanceiroService` | Filtros de status, registrar pagamento |

### ⚠️ PARCIAL — Funciona mas incompleto

| Módulo | O que falta | Onde implementar |
|---|---|---|
| **Clientes** | Edição e Exclusão na `lista-clientes` | Adicionar `atualizar()` e `excluir()` em `cliente.ts` + botões de ação nos cards + modo edição em `cadastro-cliente` via `?id=` |
| **Produtos** | Edição e Exclusão na `lista-produtos` | Adicionar `excluir()` em `produto.ts` + botões de ação nos cards + modo edição em `cadastro-produto` via `?id=` |
| **Relatórios** | Visual da tela `/relatorios` fraco | HTML/SCSS de `relatorios.page.html` precisa redesign premium; lógica do TS já está completa |

### ❌ NÃO INICIADO — Scaffold vazio

| Módulo | Page | Estado |
|---|---|---|
| **Sobre** | `sobre` | Ionic CLI scaffold puro — `ngOnInit()` vazio, HTML sem conteúdo |

---

## 3. Funcionalidades Detalhadas por Status

### 3.1 O que já funciona (testado em `ionic serve`)
- Login com `admin` / `admin123` (seed do banco)
- Criação de banco SQLite do zero + seeds na primeira execução
- Migração automática de bancos antigos (ALTER TABLE tolerante)
- Cadastro de usuários com confirmação de senha
- Edição de usuários (senha opcional — deixar vazio = mantém senha atual)
- Ativar / Inativar usuários — com bloqueio de auto-inativação
- Exclusão de usuário — bloqueada se tiver vendas vinculadas
- Cadastro de clientes com máscara de CPF e telefone
- Listagem de clientes com busca em tempo real
- Cadastro de produtos com código de barras único
- Listagem de produtos com badge de nível de estoque
- Nova venda: seleção de cliente, busca de produto, carrinho, finalização
- Baixa automática de estoque ao finalizar venda
- Geração de recebimento pendente ao finalizar venda
- Auditoria: `usuario_id` do operador gravado em cada venda
- Listagem de vendas + tela de detalhes da venda
- Devolução de itens com validação de quantidade
- Restauração de estoque na devolução
- Ajuste financeiro proporcional na devolução
- Listagem de recebimentos com filtros (Todos/Pendente/Pago/Cancelado)
- Registrar pagamento de recebimento pendente
- Relatórios: 6 KPIs carregados via `Promise.all()` no `RelatoriosService`

### 3.2 O que existe no service mas não está na UI
- `FinanceiroService.cancelarRecebimento()` — método implementado, sem botão na tela `/receber`
- `ProdutoService.atualizar()` — método implementado, sem tela de edição ativada
- `RelatoriosService.getRecebimentosPagos()` — método implementado, não exibido em lugar algum

---

## 4. Bugs Conhecidos

| # | Severidade | Local | Descrição | Causa |
|---|---|---|---|---|
| B01 | ⚠️ Baixo | `angular.json` | Warnings de `IonItem`, `IonLabel`, `IonBadge` não usados em alguns componentes | Imports declarados mas não utilizados nos templates; não bloqueia build |
| B02 | ⚠️ Baixo | `sql.js` | Warning "Module 'sql.js' is not ESM" no build | sql.js é CommonJS; não afeta funcionalidade, mas causa optimization bailout no Angular |
| B03 | 🔴 Potencial | `lista-clientes` | Clicar no card de cliente não tem ação — usuário pode ter expectativa de edição | Edição não implementada ainda |
| B04 | 🔴 Potencial | `lista-produtos` | Mesmo problema: card sem ação de edição | Edição não implementada ainda |
| B05 | ℹ️ Info | `nova-venda` | Produto já adicionado ao carrinho não incrementa ao clicar novamente se quantidade = estoque disponível (silencioso, sem feedback) | Comportamento intencional, mas sem mensagem ao usuário |

---

## 5. Decisões Arquiteturais Tomadas

### 5.1 Standalone Components (OBRIGATÓRIO respeitar)
**Todos** os componentes são `standalone: true`. Não existe `AppModule`. Cada componente declara seus próprios imports Ionic no array `imports: []` do `@Component`.

```typescript
// CORRETO — Standalone
@Component({
  standalone: true,
  imports: [IonContent, IonHeader, IonButton, CommonModule, FormsModule]
})

// ERRADO — Não fazer
@NgModule({ declarations: [...] })
```

### 5.2 Services injetados via constructor — nunca no `imports[]`
`AlertController`, `ToastController`, `NavController` são **serviços Angular**, não componentes. Devem ir no constructor, não em `imports`.

```typescript
// CORRETO
constructor(private alertCtrl: AlertController, private toastCtrl: ToastController) {}

// ERRADO — quebra o build
imports: [..., AlertController, ToastController]  // ← NUNCA FAZER
```

### 5.3 `DatabaseService` é síncrono após a inicialização
`db.query()` e `db.run()` são síncronos. Apenas `db.initialize()` e `db.transaction()` são assíncronos. Os métodos dos Services usam `async/await` por convenção mas as queries internas são síncronas.

### 5.4 Ícones Ionicons — importação individual obrigatória
Todos os ícones devem ser registrados via `addIcons()` no `constructor()`.

```typescript
// CORRETO
import { addOutline, trashOutline } from 'ionicons/icons';
constructor() { addIcons({ addOutline, trashOutline }); }
```

### 5.5 Roteamento — Lazy Loading com QueryParams para edição
Navegação para edição usa `queryParams`, não path params dinâmicos (exceto `detalhes-venda/:id`).

```typescript
// Padrão de edição
this.router.navigate(['/cadastro-cliente'], { queryParams: { id: cliente.id } });

// No componente de edição
const id = this.route.snapshot.queryParamMap.get('id');
```

### 5.6 Migração de banco sem remover dados existentes
O método `runMigrations()` em `database.ts` usa `ALTER TABLE ... ADD COLUMN` dentro de `try/catch`. Se a coluna já existir, o erro é silenciado. **Nunca usar `DROP TABLE` ou `CREATE TABLE` sem `IF NOT EXISTS`.**

### 5.7 Export duplo em cada service (não remover)
Todos os services têm uma exportação adicional no final do arquivo:
```typescript
export { UsuarioService as Usuario };   // ← NÃO REMOVER
```
Esta convenção foi definida no início do projeto. Manter em todos os services.

### 5.8 Build budget de CSS
O `angular.json` foi configurado com budget de `6kb` (warning) e `10kb` (error) para component styles. Valores anteriores (2kb/4kb) causavam falhas na build com os estilos premium do app.

---

## 6. Convenções de Código

### 6.1 Nomenclatura de arquivos
```
Services:   src/app/services/usuario.ts           (sem sufixo "service")
Pages:      src/app/pages/lista-usuarios/lista-usuarios.page.ts
Models:     src/app/models/usuario.model.ts
```

### 6.2 Classes CSS globais disponíveis (de `global.scss`)
Usar sempre estas classes — nunca criar estilos inline no HTML:

| Classe | Uso |
|---|---|
| `.vp-page-content` | Container principal da `ion-content` (padding padrão) |
| `.vp-section-title` | Título de seção ou contador de itens |
| `.vp-empty-state` | Estado vazio centralizado (spinner ou mensagem) |
| `.vp-fab` | Estilo padrão do botão FAB flutuante |
| `.vp-searchbar` | Estilos da barra de busca com fundo escuro |
| `.vp-form` | Container de formulário com gap padrão |
| `.badge-success` | Badge verde |
| `.badge-warning` | Badge amarelo |
| `.badge-danger` | Badge vermelho |
| `.badge-muted` | Badge cinza |
| `.badge-primary` | Badge roxo primário |
| `.animate-fade-in-up` | Animação de entrada suave |
| `.animate-delay-1` a `.animate-delay-4` | Delays escalonados para animações |

### 6.3 Variáveis CSS do Design System
```scss
// Cores principais
--vp-primary: #6C63FF        // Roxo primário
--vp-accent: #00D4AA         // Verde azulado
--vp-danger: #FF4B6E         // Vermelho
--vp-warning: #FFB347        // Laranja

// Backgrounds
--vp-bg-dark: #0D0F1A        // Fundo da página
--vp-bg-card: #151826        // Fundo dos cards
--vp-bg-input: #1A1D2E       // Fundo dos inputs

// Textos
--vp-text-primary: #F0F2FF   // Texto principal
--vp-text-secondary: #8B8FA8 // Texto secundário
--vp-text-muted: #555870     // Texto desabilitado/placeholder

// Border
--vp-border: rgba(255,255,255,0.08)
```

### 6.4 Padrão de formulário (SCSS por componente)
Todos os formulários de cadastro usam o padrão de classes abaixo (ver `cadastro-usuario.page.scss` como referência):
```
.form-header → cabeçalho com emoji, título e subtítulo
.field-group  → wrapper de cada campo (label + input)
.field-label  → label uppercase 0.75rem
.field-input-wrap → container flex com ícone + input
.field-icon   → ícone à esquerda do input
.vp-field-input → ion-input estilizado
.erro-msg     → bloco de erro em vermelho
.btn-salvar   → botão de submit com gradiente roxo
```

### 6.5 Padrão de listagem
Todas as telas de lista usam este padrão (ver `lista-usuarios.page.ts` como referência):
- `ionViewWillEnter()` + `ngOnInit()` para carregar lista
- `ion-refresher` para recarga por gesto
- `termoBusca: string` + método `filtrar()` para busca local
- `carregando: boolean` com spinner no estado de carregamento
- Empty state com ícone emoji, título e descrição

### 6.6 Feedback ao usuário — padrão de Toast
```typescript
const toast = await this.toastCtrl.create({
  message: '✅ Mensagem de sucesso!',
  duration: 2500,
  position: 'bottom',
  color: 'success'   // ou 'danger', 'warning'
});
await toast.present();
```

### 6.7 Confirmações destrutivas — padrão de Alert
```typescript
const alert = await this.alertCtrl.create({
  header: 'Confirmar Exclusão',
  message: 'Descrição clara da ação irreversível.',
  buttons: [
    { text: 'Cancelar', role: 'cancel' },
    { text: 'Excluir', role: 'destructive', handler: async () => { ... } }
  ]
});
await alert.present();
```

---

## 7. Estrutura de Arquivos Críticos

```
src/
├── main.ts                           ← Bootstrap + APP_INITIALIZER do banco
├── global.scss                       ← Design system completo (NÃO ALTERAR sem necessidade)
└── app/
    ├── app.routes.ts                 ← Todas as rotas (lazy-loaded)
    ├── models/
    │   ├── usuario.model.ts          ← { id?, nome, login, senha?, situacao? }
    │   ├── cliente.model.ts          ← { id?, nome, telefone, email, cpf }
    │   ├── produto.model.ts          ← { id?, nome, descricao, preco, estoque, codigo_barras }
    │   ├── venda.model.ts            ← { id?, cliente_id, usuario_id?, data_venda, subtotal, total, cliente?, itens? }
    │   ├── item-venda.model.ts       ← { id?, venda_id?, produto_id, quantidade, preco_unitario, subtotal, produto? }
    │   ├── devolucao.model.ts        ← { id?, venda_id, produto_id, quantidade, data_devolucao }
    │   └── recebimento.model.ts      ← { id?, venda_id, valor, status, data_pagamento? }
    ├── services/
    │   ├── database.ts               ← ★ CRÍTICO — query(), run(), transaction(), runMigrations()
    │   ├── usuario.ts                ← login, cadastrar, listar, buscarPorId, atualizar, excluir, getLoggedUser, logout
    │   ├── cliente.ts                ← cadastrar, listar, buscarPorId [FALTAM: atualizar, excluir]
    │   ├── produto.ts                ← cadastrar, atualizar, listar, buscarPorId, buscarPorCodigoBarras, atualizarEstoque [FALTA: excluir]
    │   ├── venda.ts                  ← registrarVenda (c/ usuario_id), listarVendas, buscarPorId
    │   ├── devolucao.ts              ← registrarDevolucao, listarDevolucoes, buscarPorVenda
    │   ├── financeiro.ts             ← registrarPagamento, cancelarRecebimento, listar, buscarPorId, buscarPorVenda
    │   └── relatorios.ts             ← getTotalVendas, getValorVendido, getProdutosMaisVendidos, getEstoqueAtual, getEstoqueBaixo, getRecebimentosPendentes, getRecebimentosPagos
    └── pages/
        ├── login/                    ✅ Completo
        ├── menu/                     ✅ Completo
        ├── cadastro-usuario/         ✅ Completo (criação + edição)
        ├── lista-usuarios/           ✅ Completo (busca, ativar/inativar, excluir)
        ├── cadastro-cliente/         ⚠️ Parcial (apenas criação)
        ├── lista-clientes/           ⚠️ Parcial (sem edição/exclusão)
        ├── cadastro-produto/         ⚠️ Parcial (apenas criação)
        ├── lista-produtos/           ⚠️ Parcial (sem edição/exclusão)
        ├── nova-venda/               ✅ Completo
        ├── lista-vendas/             ✅ Completo
        ├── detalhes-venda/           ✅ Completo
        ├── devolucao/                ✅ Completo
        ├── receber/                  ✅ Completo
        ├── relatorios/               ⚠️ Parcial (lógica OK, visual fraco)
        └── sobre/                    ❌ Não implementado
```

---

## 8. Banco de Dados — Schema Atual

```sql
-- Tabela de usuários (com situacao — adicionada via migration)
CREATE TABLE usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  login TEXT NOT NULL UNIQUE,
  senha TEXT NOT NULL,
  situacao TEXT NOT NULL DEFAULT 'Ativo'
);

-- Clientes
CREATE TABLE clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE
);

-- Produtos
CREATE TABLE produtos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  descricao TEXT NOT NULL,
  preco REAL NOT NULL,
  estoque INTEGER NOT NULL,
  codigo_barras TEXT NOT NULL UNIQUE
);

-- Vendas (usuario_id adicionado via migration)
CREATE TABLE vendas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id),
  usuario_id INTEGER REFERENCES usuarios(id),  -- auditoria do operador
  data_venda TEXT NOT NULL,
  subtotal REAL NOT NULL,
  total REAL NOT NULL
);

-- Itens de venda
CREATE TABLE itens_venda (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  venda_id INTEGER NOT NULL REFERENCES vendas(id),
  produto_id INTEGER NOT NULL REFERENCES produtos(id),
  quantidade INTEGER NOT NULL,
  preco_unitario REAL NOT NULL,
  subtotal REAL NOT NULL
);

-- Devoluções
CREATE TABLE devolucoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  venda_id INTEGER NOT NULL REFERENCES vendas(id),
  produto_id INTEGER NOT NULL REFERENCES produtos(id),
  quantidade INTEGER NOT NULL,
  data_devolucao TEXT NOT NULL
);

-- Recebimentos financeiros
CREATE TABLE recebimentos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  venda_id INTEGER NOT NULL REFERENCES vendas(id),
  valor REAL NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('Pendente', 'Pago', 'Cancelado')),
  data_pagamento TEXT
);
```

**Seeds (inseridos automaticamente no primeiro uso):**
- `usuarios`: admin / admin123 / Ativo
- `clientes`: João Silva, Maria Oliveira
- `produtos`: Caneca VendaPro, Camiseta VendaPro, Chaveiro VendaPro

---

## 9. Regras de Negócio Implementadas

```
RN01  Login de usuários inativos é BLOQUEADO
RN02  Usuário NÃO pode excluir a si mesmo
RN03  Usuário com vendas NÃO pode ser excluído fisicamente (inativar é a alternativa)
RN04  Usuário NÃO pode inativar a si mesmo
RN05  Login de usuário deve ser único
RN06  CPF de cliente deve ser único (normalizado para 11 dígitos numéricos na comparação)
RN07  CPF deve ter exatamente 11 dígitos numéricos
RN08  E-mail de cliente deve conter '@'
RN09  Código de barras de produto deve ser único
RN10  Preço de produto deve ser > 0
RN11  Estoque inicial de produto não pode ser negativo
RN12  Venda deve ter pelo menos 1 item
RN13  Quantidade vendida não pode exceder estoque disponível do produto
RN14  Toda venda gera recebimento automático com status 'Pendente'
RN15  Toda venda registra o usuario_id do operador ativo (auditoria)
RN16  Quantidade devolvida não pode exceder (vendida - já devolvida anteriormente)
RN17  Devolução SEMPRE restaura o estoque do produto
RN18  Devolução SEMPRE ajusta o valor do recebimento proporcionalmente
RN19  Se valor do recebimento zerar por devolução → status muda para 'Cancelado'
RN20  Recebimento 'Cancelado' NÃO pode ser pago
RN21  Recebimento 'Pago' NÃO pode ser pago novamente
RN22  Recebimento 'Pago' NÃO pode ser cancelado
```

**Regras PLANEJADAS mas não implementadas:**
```
RN23  Clientes com vendas NÃO devem ser excluídos (excluir() no ClienteService)
RN24  Produtos com histórico de vendas NÃO devem ser excluídos (excluir() no ProdutoService)
RN25  Senha deve ter no mínimo 6 caracteres (validação de complexidade)
```

---

## 10. ✅ PRÓXIMA TAREFA RECOMENDADA

### Completar o CRUD de Clientes e Produtos (Alta Prioridade)

Esta é a tarefa mais impactante para tornar o sistema completo. O padrão já está estabelecido pelo módulo de Usuários — basta replicar.

#### Passo a Passo para Clientes:

**1. Adicionar métodos em `src/app/services/cliente.ts`:**
```typescript
// Adicionar após buscarPorId():

async atualizar(cliente: Cliente): Promise<void> {
  if (!cliente.id) throw new Error('ID obrigatório para atualização.');
  this.validarCliente(cliente);
  const existente = this.db.query<Cliente>(
    'SELECT id FROM clientes WHERE replace(replace(cpf, ".", ""), "-", "") = ? AND id != ?',
    [this.limparCpf(cliente.cpf), cliente.id]
  );
  if (existente.length > 0) throw new Error('Já existe outro cliente com este CPF.');
  this.db.run(
    'UPDATE clientes SET nome = ?, telefone = ?, email = ?, cpf = ? WHERE id = ?',
    [cliente.nome.trim(), cliente.telefone.trim(), cliente.email.trim().toLowerCase(), cliente.cpf.trim(), cliente.id]
  );
}

async excluir(id: number): Promise<void> {
  const vendas = this.db.query<{count: number}>('SELECT COUNT(*) as count FROM vendas WHERE cliente_id = ?', [id]);
  if (vendas[0].count > 0) throw new Error('Cliente possui vendas vinculadas e não pode ser excluído.');
  this.db.run('DELETE FROM clientes WHERE id = ?', [id]);
}
```

**2. Adaptar `cadastro-cliente.page.ts`** para detectar `?id=` via `ActivatedRoute` (igual ao padrão do `cadastro-usuario.page.ts`).

**3. Adicionar botões de ação em `lista-clientes.page.html`** nos cards (editar + excluir), injetando `AlertController` e `ToastController` no construtor (igual ao padrão do `lista-usuarios.page.ts`).

#### Passo a Passo para Produtos:
- Mesmo padrão acima. `ProdutoService.atualizar()` já existe. Falta apenas `excluir()` com proteção de `itens_venda`.
- Adaptar `cadastro-produto.page.ts` para detecção de `?id=` via `ActivatedRoute`.
- Adicionar botões de ação em `lista-produtos.page.html`.

#### Referências de Código (copiar padrão de):
- Service: [`src/app/services/usuario.ts`](file:///c:/Users/lucas/vendaspro/src/app/services/usuario.ts)
- Page TS: [`src/app/pages/lista-usuarios/lista-usuarios.page.ts`](file:///c:/Users/lucas/vendaspro/src/app/pages/lista-usuarios/lista-usuarios.page.ts)
- Page TS: [`src/app/pages/cadastro-usuario/cadastro-usuario.page.ts`](file:///c:/Users/lucas/vendaspro/src/app/pages/cadastro-usuario/cadastro-usuario.page.ts)
- SCSS cards: [`src/app/pages/lista-usuarios/lista-usuarios.page.scss`](file:///c:/Users/lucas/vendaspro/src/app/pages/lista-usuarios/lista-usuarios.page.scss)

---

## 11. Como Verificar se o Projeto Compila

```bash
cd c:\Users\lucas\vendaspro
npm run build
# Esperado: "Application bundle generation complete." sem ERRORs
# Warnings de IonBadge/IonItem/IonLabel não utilizados são normais e não bloqueantes
```

```bash
# Para desenvolvimento com live reload:
ionic serve
# ou
npm start
```

---

## 12. Credenciais de Teste Padrão

```
Login:  admin
Senha:  admin123
```

---

*Documento gerado em Junho/2026. Manter atualizado a cada sessão de desenvolvimento.*
