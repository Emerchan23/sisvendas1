const Database = require('better-sqlite3');
const { join } = require('path');

// Conectar ao banco
const dbPath = join(process.cwd(), 'data', 'erp.sqlite');
const db = new Database(dbPath);

console.log('🔍 Verificando acertos no banco de dados...');

// Consultar os últimos 5 acertos
const acertos = db.prepare(`
  SELECT id, data, titulo, observacoes, status, created_at 
  FROM acertos 
  ORDER BY created_at DESC 
  LIMIT 5
`).all();

console.log('📊 Últimos 5 acertos encontrados:');
console.table(acertos);

// Verificar se há acertos sem título
const acertosSemTitulo = db.prepare(`
  SELECT COUNT(*) as count 
  FROM acertos 
  WHERE titulo IS NULL OR titulo = ''
`).get();

console.log(`\n❌ Acertos sem título: ${acertosSemTitulo.count}`);

// Verificar se há acertos com título
const acertosComTitulo = db.prepare(`
  SELECT COUNT(*) as count 
  FROM acertos 
  WHERE titulo IS NOT NULL AND titulo != ''
`).get();

console.log(`✅ Acertos com título: ${acertosComTitulo.count}`);

db.close();
console.log('\n✅ Verificação concluída!');