// Script para inicializar o banco de dados
const Database = require('better-sqlite3');
const { join } = require('path');

const dbPath = join(process.cwd(), 'data', 'erp.sqlite');
const db = new Database(dbPath);

console.log('🔧 Inicializando banco de dados...');

try {
  // Configurar WAL mode para melhor performance
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = 1000');
  db.pragma('foreign_keys = ON');
  db.pragma('temp_store = memory');

  // Criar tabelas
  db.exec(`
    CREATE TABLE IF NOT EXISTS empresas (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      razao_social TEXT,
      cnpj TEXT,
      endereco TEXT,
      telefone TEXT,
      email TEXT,
      logo_url TEXT,
      nome_do_sistema TEXT DEFAULT 'LP IND',
      imposto_padrao REAL,
      capital_padrao REAL,
      layout_orcamento TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS clientes (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      cpf_cnpj TEXT,
      endereco TEXT,
      telefone TEXT,
      email TEXT,
      empresa_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (empresa_id) REFERENCES empresas(id)
    );

    CREATE TABLE IF NOT EXISTS produtos (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      descricao TEXT,
      marca TEXT,
      preco REAL NOT NULL,
      custo REAL DEFAULT 0,
      taxa_imposto REAL DEFAULT 0,
      modalidade_venda TEXT,
      estoque INTEGER DEFAULT 0,
      link_ref TEXT,
      custo_ref REAL,
      categoria TEXT,
      empresa_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (empresa_id) REFERENCES empresas(id)
    );

    CREATE TABLE IF NOT EXISTS vendas (
      id TEXT PRIMARY KEY,
      cliente_id TEXT,
      produto_id TEXT,
      quantidade INTEGER NOT NULL,
      preco_unitario REAL NOT NULL,
      total REAL NOT NULL,
      data_venda DATETIME DEFAULT CURRENT_TIMESTAMP,
      empresa_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cliente_id) REFERENCES clientes(id),
      FOREIGN KEY (produto_id) REFERENCES produtos(id),
      FOREIGN KEY (empresa_id) REFERENCES empresas(id)
    );

    CREATE TABLE IF NOT EXISTS orcamentos (
      id TEXT PRIMARY KEY,
      numero TEXT NOT NULL UNIQUE,
      cliente_id TEXT NOT NULL,
      data_orcamento TEXT NOT NULL,
      data_validade TEXT,
      valor_total REAL NOT NULL DEFAULT 0,
      descricao TEXT,
      status TEXT DEFAULT 'pendente',
      observacoes TEXT,
      condicoes_pagamento TEXT,
      prazo_entrega TEXT,
      vendedor_id TEXT,
      desconto REAL DEFAULT 0,
      modalidade TEXT DEFAULT 'compra_direta',
      numero_pregao TEXT,
      numero_dispensa TEXT,
      empresa_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cliente_id) REFERENCES clientes(id),
      FOREIGN KEY (empresa_id) REFERENCES empresas(id)
    );

    CREATE TABLE IF NOT EXISTS orcamento_itens (
      id TEXT PRIMARY KEY,
      orcamento_id TEXT NOT NULL,
      produto_id TEXT,
      descricao TEXT NOT NULL,
      marca TEXT,
      unidade_medida TEXT DEFAULT 'un',
      quantidade REAL NOT NULL,
      valor_unitario REAL NOT NULL,
      valor_total REAL NOT NULL,
      observacoes TEXT,
      link_ref TEXT,
      custo_ref REAL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (orcamento_id) REFERENCES orcamentos (id)
    );

    CREATE TABLE IF NOT EXISTS user_prefs (
      userId TEXT PRIMARY KEY,
      json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS linhas_venda (
      id TEXT PRIMARY KEY,
      companyId TEXT,
      dataPedido TEXT NOT NULL,
      numeroOF TEXT,
      numeroDispensa TEXT,
      cliente TEXT,
      produto TEXT,
      modalidade TEXT,
      valorVenda REAL NOT NULL DEFAULT 0,
      taxaCapitalPerc REAL NOT NULL DEFAULT 0,
      taxaCapitalVl REAL NOT NULL DEFAULT 0,
      taxaImpostoPerc REAL NOT NULL DEFAULT 0,
      taxaImpostoVl REAL NOT NULL DEFAULT 0,
      custoMercadoria REAL NOT NULL DEFAULT 0,
      somaCustoFinal REAL NOT NULL DEFAULT 0,
      lucroValor REAL NOT NULL DEFAULT 0,
      lucroPerc REAL NOT NULL DEFAULT 0,
      dataRecebimento TEXT,
      paymentStatus TEXT NOT NULL DEFAULT 'pendente',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS outros_negocios (
      id TEXT PRIMARY KEY,
      companyId TEXT,
      descricao TEXT NOT NULL,
      valor REAL NOT NULL DEFAULT 0,
      data TEXT NOT NULL,
      tipo TEXT NOT NULL DEFAULT 'receita',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS acertos (
      id TEXT PRIMARY KEY,
      companyId TEXT,
      descricao TEXT NOT NULL,
      valor REAL NOT NULL DEFAULT 0,
      data TEXT NOT NULL,
      tipo TEXT NOT NULL DEFAULT 'despesa',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('✅ Tabelas criadas com sucesso!');

  // Verificar se as tabelas foram criadas
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('📋 Tabelas no banco:', tables.map(t => t.name).join(', '));

} catch (error) {
  console.error('❌ Erro ao inicializar banco:', error.message);
} finally {
  db.close();
}