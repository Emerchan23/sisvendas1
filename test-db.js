const Database = require('better-sqlite3');
const path = require('path');

// Configurar caminho do banco
const dbPath = process.env.DB_PATH || path.join(process.cwd(), '..', 'Banco de dados Aqui', 'erp.sqlite');

try {
  console.log('Tentando conectar ao banco:', dbPath);
  const db = new Database(dbPath);
  
  // Verificar se as tabelas existem
  console.log('\n=== VERIFICANDO TABELAS ===');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Tabelas encontradas:', tables.map(t => t.name));
  
  // Verificar estrutura da tabela vendas
  try {
    console.log('\n=== ESTRUTURA TABELA VENDAS ===');
    const vendasStructure = db.prepare('PRAGMA table_info(vendas)').all();
    console.log('Estrutura vendas:', vendasStructure);
    
    const vendasCount = db.prepare('SELECT COUNT(*) as count FROM vendas').get();
    console.log('Total de registros em vendas:', vendasCount.count);
    
    if (vendasCount.count > 0) {
      const sampleVendas = db.prepare('SELECT * FROM vendas LIMIT 3').all();
      console.log('Amostra de vendas:', sampleVendas);
    }
  } catch (error) {
    console.log('Erro ao verificar tabela vendas:', error.message);
  }
  
  // Verificar estrutura da tabela vales
  try {
    console.log('\n=== ESTRUTURA TABELA VALES ===');
    const valesStructure = db.prepare('PRAGMA table_info(vales)').all();
    console.log('Estrutura vales:', valesStructure);
    
    const valesCount = db.prepare('SELECT COUNT(*) as count FROM vales').get();
    console.log('Total de registros em vales:', valesCount.count);
    
    if (valesCount.count > 0) {
      const sampleVales = db.prepare('SELECT * FROM vales LIMIT 3').all();
      console.log('Amostra de vales:', sampleVales);
    }
  } catch (error) {
    console.log('Erro ao verificar tabela vales:', error.message);
  }
  
  db.close();
  console.log('\n✅ Teste concluído com sucesso!');
  
} catch (error) {
  console.error('❌ Erro ao conectar com banco:', error.message);
  console.error('Caminho tentado:', dbPath);
}