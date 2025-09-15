// Script para verificar a estrutura e dados da tabela modalidades_compra
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), '..', 'Banco de dados Aqui', 'erp.sqlite');

try {
  const db = new Database(dbPath);
  
  console.log('📋 Estrutura da tabela modalidades_compra:');
  const schema = db.prepare('PRAGMA table_info(modalidades_compra)').all();
  schema.forEach(col => {
    console.log(`   - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? 'DEFAULT ' + col.dflt_value : ''}`);
  });
  
  console.log('\n📊 Dados das modalidades:');
  const modalidades = db.prepare('SELECT * FROM modalidades_compra').all();
  modalidades.forEach(mod => {
    console.log(`   ID: ${mod.id}, Código: ${mod.codigo}, Nome: ${mod.nome}, Requer processo: ${mod.requer_numero_processo}`);
  });
  
  db.close();
  console.log('\n✅ Verificação concluída!');
} catch (error) {
  console.error('❌ Erro:', error.message);
}