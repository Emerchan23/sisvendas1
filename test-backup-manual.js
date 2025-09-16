const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Configurar o caminho do banco de dados
const dbPath = path.join(__dirname, '..', 'Banco de dados Aqui', 'erp.sqlite');
const db = new Database(dbPath);

console.log('=== TESTE COMPLETO DO BACKUP MANUAL ===');
console.log('Caminho do banco:', dbPath);

try {
  // 1. Verificar dados atuais
  console.log('\n1. DADOS ATUAIS NO BANCO:');
  const vendasCount = db.prepare('SELECT COUNT(*) as count FROM vendas').get();
  const valesCount = db.prepare('SELECT COUNT(*) as count FROM vales').get();
  console.log(`- Vendas: ${vendasCount.count}`);
  console.log(`- Vales: ${valesCount.count}`);

  // 2. Simular exportação de backup
  console.log('\n2. SIMULANDO EXPORTAÇÃO DE BACKUP:');
  const vendas = db.prepare('SELECT * FROM vendas').all();
  const vales = db.prepare('SELECT * FROM vales').all();
  
  const backupData = {
    timestamp: new Date().toISOString(),
    version: '1.0',
    data: {
      vendas: vendas,
      vales: vales
    }
  };
  
  console.log(`- Vendas exportadas: ${vendas.length}`);
  console.log(`- Vales exportados: ${vales.length}`);
  
  // Verificar se há dados com ID null
  const vendasComIdNull = vendas.filter(v => v.id === null);
  const valesComIdNull = vales.filter(v => v.id === null);
  
  if (vendasComIdNull.length > 0) {
    console.log(`⚠️  PROBLEMA: ${vendasComIdNull.length} vendas com ID null`);
  }
  
  if (valesComIdNull.length > 0) {
    console.log(`⚠️  PROBLEMA: ${valesComIdNull.length} vales com ID null`);
  }
  
  // 3. Salvar backup em arquivo
  const backupFile = path.join(__dirname, 'backup-test.json');
  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
  console.log(`- Backup salvo em: ${backupFile}`);
  
  // 4. Verificar conteúdo do backup
  console.log('\n3. VERIFICANDO CONTEÚDO DO BACKUP:');
  const backupContent = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
  console.log(`- Vendas no backup: ${backupContent.data.vendas.length}`);
  console.log(`- Vales no backup: ${backupContent.data.vales.length}`);
  
  // 5. Mostrar estrutura dos dados
  console.log('\n4. ESTRUTURA DOS DADOS:');
  if (backupContent.data.vendas.length > 0) {
    console.log('Primeira venda:', JSON.stringify(backupContent.data.vendas[0], null, 2));
  }
  
  if (backupContent.data.vales.length > 0) {
    console.log('Primeiro vale:', JSON.stringify(backupContent.data.vales[0], null, 2));
  }
  
  console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO!');
  
} catch (error) {
  console.error('❌ ERRO NO TESTE:', error.message);
} finally {
  db.close();
}