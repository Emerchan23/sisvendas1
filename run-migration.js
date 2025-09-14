const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

console.log('=== Executando migração modalidades_compra ===');

// Configurar caminho do banco
const dbPath = path.join(process.cwd(), 'database.db');
console.log('Caminho do banco:', dbPath);

// Criar conexão com o banco
const db = new Database(dbPath);
console.log('✅ Conexão com banco estabelecida');

// Ler arquivo de migração
const migrationPath = path.join(process.cwd(), 'migrations', 'create_modalidades_compra.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

try {
  // Executar migração
  db.exec(migrationSQL);
  console.log('✅ Migração executada com sucesso!');
  
  // Verificar se a tabela foi criada
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='modalidades_compra'").all();
  console.log('Tabela modalidades_compra existe:', tables.length > 0);
  
  if (tables.length > 0) {
    // Verificar dados inseridos
    const count = db.prepare('SELECT COUNT(*) as count FROM modalidades_compra').get();
    console.log('Registros na tabela modalidades_compra:', count.count);
    
    // Mostrar os dados
    const modalidades = db.prepare('SELECT * FROM modalidades_compra').all();
    console.log('\n📋 Modalidades cadastradas:');
    modalidades.forEach((modalidade, index) => {
      console.log(`${index + 1}. ${modalidade.codigo} - ${modalidade.nome}`);
    });
  }
  
} catch (error) {
  console.error('❌ Erro ao executar migração:', error.message);
} finally {
  db.close();
  console.log('\n✅ Processo concluído!');
}