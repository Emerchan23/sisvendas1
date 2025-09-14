const Database = require('better-sqlite3');
const path = require('path');

console.log('=== Verificando tabela modalidades_compra ===');

// Configurar caminho do banco correto
const dbPath = path.join(process.cwd(), 'data', 'erp.sqlite');
console.log('Caminho do banco:', dbPath);

try {
  const db = new Database(dbPath);
  
  // Verificar se a tabela existe
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='modalidades_compra'").all();
  console.log('Tabela modalidades_compra existe:', tables.length > 0);
  
  if (tables.length > 0) {
    // Verificar estrutura da tabela
    console.log('\n=== ESTRUTURA DA TABELA modalidades_compra ===');
    const columns = db.prepare('PRAGMA table_info(modalidades_compra)').all();
    columns.forEach(col => {
      console.log(`- ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? 'DEFAULT ' + col.dflt_value : ''}`);
    });
    
    // Verificar dados
    const count = db.prepare('SELECT COUNT(*) as count FROM modalidades_compra').get();
    console.log('\nRegistros na tabela:', count.count);
    
    if (count.count > 0) {
      console.log('\n=== DADOS NA TABELA ===');
      const modalidades = db.prepare('SELECT * FROM modalidades_compra LIMIT 3').all();
      modalidades.forEach((modalidade, index) => {
        console.log(`${index + 1}. ${modalidade.codigo} - ${modalidade.nome}`);
      });
    }
  }
  
  db.close();
  
} catch (error) {
  console.error('Erro:', error.message);
}