const Database = require('better-sqlite3');
const path = require('path');

// Conectar ao banco de dados
const dbPath = path.join(__dirname, '..', 'Banco de dados Aqui', 'erp.sqlite');
const db = new Database(dbPath);

console.log('=== CORRIGINDO ESTRUTURA DAS TABELAS ===');

try {
  // Dropar e recriar a tabela orcamentos com todas as colunas necessárias
  console.log('\n1. Recriando tabela orcamentos com estrutura completa...');
  
  db.exec('DROP TABLE IF EXISTS orcamento_itens');
  db.exec('DROP TABLE IF EXISTS orcamentos');
  
  db.exec(`
    CREATE TABLE orcamentos (
      id TEXT PRIMARY KEY,
      numero TEXT NOT NULL UNIQUE,
      cliente_id TEXT NOT NULL,
      data_orcamento DATE NOT NULL,
      data_validade DATE NOT NULL,
      valor_total DECIMAL(10,2) NOT NULL DEFAULT 0,
      descricao TEXT,
      status TEXT NOT NULL DEFAULT 'pendente',
      observacoes TEXT,
      condicoes_pagamento TEXT,
      prazo_entrega TEXT,
      vendedor_id TEXT,
      desconto DECIMAL(10,2) DEFAULT 0,
      modalidade TEXT DEFAULT 'normal',
      numero_pregao TEXT,
      numero_dispensa TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cliente_id) REFERENCES clientes(id)
    )
  `);
  console.log('✅ Tabela orcamentos recriada!');
  
  // Recriar tabela orcamento_itens com estrutura completa
  console.log('\n2. Recriando tabela orcamento_itens com estrutura completa...');
  db.exec(`
    CREATE TABLE orcamento_itens (
      id TEXT PRIMARY KEY,
      orcamento_id TEXT NOT NULL,
      produto_id TEXT,
      descricao TEXT NOT NULL,
      marca TEXT,
      quantidade DECIMAL(10,3) NOT NULL,
      valor_unitario DECIMAL(10,2) NOT NULL,
      valor_total DECIMAL(10,2) NOT NULL,
      observacoes TEXT,
      link_ref TEXT,
      custo_ref DECIMAL(10,2) DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (orcamento_id) REFERENCES orcamentos(id) ON DELETE CASCADE
    )
  `);
  console.log('✅ Tabela orcamento_itens recriada!');
  
  // Verificar estrutura final
  console.log('\n=== ESTRUTURA FINAL DAS TABELAS ===');
  
  console.log('\nTabela orcamentos:');
  const orcamentosSchema = db.prepare("PRAGMA table_info(orcamentos)").all();
  orcamentosSchema.forEach(col => {
    console.log(`- ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
  });
  
  console.log('\nTabela orcamento_itens:');
  const itensSchema = db.prepare("PRAGMA table_info(orcamento_itens)").all();
  itensSchema.forEach(col => {
    console.log(`- ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
  });
  
  console.log('\n✅ Estrutura das tabelas corrigida com sucesso!');
  
} catch (error) {
  console.error('❌ Erro ao corrigir estrutura:', error.message);
} finally {
  db.close();
}