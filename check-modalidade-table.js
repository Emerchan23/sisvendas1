// Script para verificar estrutura da tabela orcamentos
const Database = require('better-sqlite3');
const { join } = require('path');

// Usar o mesmo caminho do banco que está no db.ts
const dbPath = process.env.DB_PATH || join(process.cwd(), '..', 'Banco de dados Aqui', 'erp.sqlite');

console.log('Caminho do banco:', dbPath);

try {
  const db = new Database(dbPath);
  
  console.log('=== ESTRUTURA DA TABELA ORCAMENTOS ===');
  
  // Verificar estrutura da tabela
  const tableInfo = db.prepare("PRAGMA table_info(orcamentos)").all();
  console.log('Colunas da tabela orcamentos:');
  tableInfo.forEach(column => {
    console.log(`- ${column.name}: ${column.type} (${column.notnull ? 'NOT NULL' : 'NULL'}) ${column.dflt_value ? 'DEFAULT ' + column.dflt_value : ''}`);
  });
  
  // Verificar se existe campo modalidade
  const modalidadeColumn = tableInfo.find(col => col.name === 'modalidade');
  if (modalidadeColumn) {
    console.log('\n✅ Campo modalidade EXISTE na tabela!');
    console.log('Detalhes:', modalidadeColumn);
  } else {
    console.log('\n❌ Campo modalidade NÃO EXISTE na tabela!');
  }
  
  console.log('\n=== DADOS EXISTENTES ===');
  
  // Verificar dados existentes
  const orcamentos = db.prepare("SELECT id, cliente_id, modalidade, numero_pregao, numero_dispensa FROM orcamentos LIMIT 5").all();
  console.log('Primeiros 5 orçamentos:');
  orcamentos.forEach(orc => {
    console.log(`ID: ${orc.id}, Cliente: ${orc.cliente_id}, Modalidade: ${orc.modalidade || 'NULL'}, Pregão: ${orc.numero_pregao || 'NULL'}, Dispensa: ${orc.numero_dispensa || 'NULL'}`);
  });
  
  console.log('\n=== TESTE DE INSERÇÃO ===');
  
  // Testar inserção com modalidade
  try {
    const testId = 'test-' + Date.now();
    db.prepare(`
      INSERT INTO orcamentos (id, cliente_id, modalidade, numero_pregao, total, subtotal, desconto)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(testId, 'cliente-test', 'pregao_eletronico', '123/2024', 100, 100, 0);
    
    // Verificar se foi inserido
    const inserted = db.prepare("SELECT * FROM orcamentos WHERE id = ?").get(testId);
    console.log('Teste de inserção:', inserted);
    
    // Limpar teste
    db.prepare("DELETE FROM orcamentos WHERE id = ?").run(testId);
    console.log('✅ Teste de inserção com modalidade funcionou!');
    
  } catch (error) {
    console.log('❌ Erro no teste de inserção:', error.message);
  }
  
  db.close();
  
} catch (error) {
  console.error('Erro ao conectar com o banco:', error.message);
}