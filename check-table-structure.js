const Database = require('better-sqlite3');
const path = require('path');

// Configurar o caminho do banco de dados
const dbPath = path.join(__dirname, '..', 'Banco de dados Aqui', 'erp.sqlite');
const db = new Database(dbPath);

console.log('=== VERIFICAÇÃO DA ESTRUTURA DAS TABELAS ===');
console.log('Caminho do banco:', dbPath);

try {
  // Verificar estrutura da tabela vendas
  console.log('\n1. ESTRUTURA DA TABELA VENDAS:');
  const vendasSchema = db.prepare('PRAGMA table_info(vendas)').all();
  vendasSchema.forEach(col => {
    console.log(`- ${col.name}: ${col.type} (PK: ${col.pk ? 'SIM' : 'NÃO'}, NotNull: ${col.notnull ? 'SIM' : 'NÃO'})`);
  });
  
  // Verificar estrutura da tabela vales
  console.log('\n2. ESTRUTURA DA TABELA VALES:');
  const valesSchema = db.prepare('PRAGMA table_info(vales)').all();
  valesSchema.forEach(col => {
    console.log(`- ${col.name}: ${col.type} (PK: ${col.pk ? 'SIM' : 'NÃO'}, NotNull: ${col.notnull ? 'SIM' : 'NÃO'})`);
  });
  
  // Verificar se as chaves primárias estão configuradas corretamente
  console.log('\n3. VERIFICAÇÃO DE CHAVES PRIMÁRIAS:');
  const vendasPK = vendasSchema.filter(col => col.pk === 1);
  const valesPK = valesSchema.filter(col => col.pk === 1);
  
  console.log(`- Vendas PK: ${vendasPK.length > 0 ? vendasPK[0].name : 'NENHUMA'}`);
  console.log(`- Vales PK: ${valesPK.length > 0 ? valesPK[0].name : 'NENHUMA'}`);
  
  // Verificar dados com IDs null
  console.log('\n4. VERIFICAÇÃO DE IDs NULL:');
  const vendasNullIds = db.prepare('SELECT COUNT(*) as count FROM vendas WHERE id IS NULL').get();
  const valesNullIds = db.prepare('SELECT COUNT(*) as count FROM vales WHERE id IS NULL').get();
  
  console.log(`- Vendas com ID null: ${vendasNullIds.count}`);
  console.log(`- Vales com ID null: ${valesNullIds.count}`);
  
  // Verificar se existe AUTOINCREMENT ou similar
  console.log('\n5. VERIFICAÇÃO DE AUTO INCREMENT:');
  const vendasCreateSQL = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='vendas'").get();
  const valesCreateSQL = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='vales'").get();
  
  console.log('SQL de criação da tabela vendas:');
  console.log(vendasCreateSQL ? vendasCreateSQL.sql : 'Não encontrado');
  
  console.log('\nSQL de criação da tabela vales:');
  console.log(valesCreateSQL ? valesCreateSQL.sql : 'Não encontrado');
  
  console.log('\n✅ VERIFICAÇÃO CONCLUÍDA!');
  
} catch (error) {
  console.error('❌ ERRO:', error.message);
} finally {
  db.close();
}