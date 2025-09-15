const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'Banco de dados Aqui', 'erp.sqlite');
const db = new Database(dbPath);

console.log('=== ADICIONANDO COLUNAS DE BACKUP À TABELA empresas ===');

try {
  // Adicionar colunas de backup uma por uma
  const backupColumns = [
    { name: 'auto_backup_enabled', type: 'BOOLEAN', default: '0' },
    { name: 'backup_frequency', type: 'TEXT', default: "'daily'" },
    { name: 'backup_time', type: 'TEXT', default: "'02:00'" },
    { name: 'keep_local_backup', type: 'BOOLEAN', default: '1' },
    { name: 'max_backups', type: 'INTEGER', default: '7' },
    { name: 'last_backup', type: 'TEXT', default: 'NULL' }
  ];

  backupColumns.forEach(column => {
    try {
      const alterQuery = `ALTER TABLE empresas ADD COLUMN ${column.name} ${column.type} DEFAULT ${column.default}`;
      console.log(`📝 Adicionando coluna: ${column.name}`);
      db.exec(alterQuery);
      console.log(`✅ Coluna ${column.name} adicionada com sucesso`);
    } catch (error) {
      if (error.message.includes('duplicate column name')) {
        console.log(`⚠️ Coluna ${column.name} já existe`);
      } else {
        console.error(`❌ Erro ao adicionar coluna ${column.name}:`, error.message);
      }
    }
  });

  console.log('\n🔍 Verificando estrutura atualizada da tabela empresas:');
  const schema = db.prepare('PRAGMA table_info(empresas)').all();
  const columnNames = schema.map(col => col.name);
  
  backupColumns.forEach(column => {
    if (columnNames.includes(column.name)) {
      console.log(`  ✅ ${column.name} - PRESENTE`);
    } else {
      console.log(`  ❌ ${column.name} - AINDA FALTANDO`);
    }
  });

  console.log('\n✅ Migração de colunas de backup concluída!');
  console.log('📊 Total de colunas na tabela empresas:', schema.length);

} catch (error) {
  console.error('❌ Erro durante a migração:', error);
} finally {
  db.close();
  console.log('\n🔒 Conexão com banco fechada');
}