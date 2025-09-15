const Database = require('better-sqlite3');
const path = require('path');

// Conectar ao banco de dados
const dbPath = path.join(process.cwd(), '..', 'Banco de dados Aqui', 'erp.sqlite');
const db = new Database(dbPath);

console.log('=== CRIANDO TABELAS NECESSÁRIAS ===');

try {
  // Criar tabela orcamentos
  console.log('\n1. Criando tabela orcamentos...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS orcamentos (
      id TEXT PRIMARY KEY,
      numero TEXT NOT NULL UNIQUE,
      cliente_id TEXT NOT NULL,
      data_criacao DATE NOT NULL,
      data_orcamento DATE NOT NULL,
      data_validade DATE NOT NULL,
      valor_total DECIMAL(10,2) NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pendente',
      observacoes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cliente_id) REFERENCES clientes(id)
    )
  `);
  console.log('✅ Tabela orcamentos criada com sucesso!');
  
  // Criar tabela orcamento_itens
  console.log('\n2. Criando tabela orcamento_itens...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS orcamento_itens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orcamento_id TEXT NOT NULL,
      descricao TEXT NOT NULL,
      marca TEXT,
      unidade TEXT NOT NULL DEFAULT 'un',
      quantidade DECIMAL(10,3) NOT NULL,
      valor_unitario DECIMAL(10,2) NOT NULL,
      valor_total DECIMAL(10,2) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (orcamento_id) REFERENCES orcamentos(id) ON DELETE CASCADE
    )
  `);
  console.log('✅ Tabela orcamento_itens criada com sucesso!');
  
  // Verificar se as tabelas foram criadas
  console.log('\n=== VERIFICANDO TABELAS CRIADAS ===');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Tabelas existentes:', tables.map(t => t.name));
  
  // Verificar estrutura da tabela orcamentos
  console.log('\n=== ESTRUTURA DA TABELA ORCAMENTOS ===');
  const orcamentosSchema = db.prepare("PRAGMA table_info(orcamentos)").all();
  console.log('Colunas da tabela orcamentos:');
  orcamentosSchema.forEach(col => {
    console.log(`- ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
  });
  
  // Verificar estrutura da tabela orcamento_itens
  console.log('\n=== ESTRUTURA DA TABELA ORCAMENTO_ITENS ===');
  const itensSchema = db.prepare("PRAGMA table_info(orcamento_itens)").all();
  console.log('Colunas da tabela orcamento_itens:');
  itensSchema.forEach(col => {
    console.log(`- ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
  });
  
  console.log('\n✅ Todas as tabelas foram criadas com sucesso!');
  
} catch (error) {
  console.error('❌ Erro ao criar tabelas:', error.message);
} finally {
  db.close();
}