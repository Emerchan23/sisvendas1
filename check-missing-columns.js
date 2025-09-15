const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'Banco de dados Aqui', 'erp.sqlite');
const db = new Database(dbPath);

console.log('=== VERIFICANDO COLUNAS FALTANTES NA TABELA empresas ===');

// Colunas que o código da API está tentando usar
const expectedColumns = [
  'auto_backup_enabled',
  'backup_frequency', 
  'backup_time',
  'keep_local_backup',
  'max_backups',
  'last_backup'
];

// Obter colunas existentes
const schema = db.prepare('PRAGMA table_info(empresas)').all();
const existingColumns = schema.map(col => col.name);

console.log('\n📋 Colunas existentes na tabela:');
existingColumns.forEach(col => console.log(`  ✅ ${col}`));

console.log('\n🔍 Verificando colunas esperadas pelo código da API:');
const missingColumns = [];

expectedColumns.forEach(col => {
  if (existingColumns.includes(col)) {
    console.log(`  ✅ ${col} - EXISTE`);
  } else {
    console.log(`  ❌ ${col} - FALTANDO`);
    missingColumns.push(col);
  }
});

if (missingColumns.length > 0) {
  console.log('\n🚨 COLUNAS FALTANTES ENCONTRADAS:');
  missingColumns.forEach(col => console.log(`  - ${col}`));
  console.log('\n💡 Essas colunas precisam ser adicionadas à tabela empresas.');
} else {
  console.log('\n✅ Todas as colunas necessárias estão presentes!');
}

db.close();
console.log('\n✅ Verificação concluída');