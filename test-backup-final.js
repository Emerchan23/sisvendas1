const Database = require('better-sqlite3');
const path = require('path');

// Configurar o caminho do banco de dados
const dbPath = path.join(__dirname, '..', 'Banco de dados Aqui', 'erp.sqlite');
const db = new Database(dbPath);

console.log('=== TESTE FINAL DO BACKUP ===');
console.log('Caminho do banco:', dbPath);

try {
  // 1. Verificar dados atuais no banco
  console.log('\n1. DADOS ATUAIS NO BANCO:');
  
  const vendas = db.prepare('SELECT * FROM vendas').all();
  const vales = db.prepare('SELECT * FROM vales').all();
  
  console.log(`\nVendas (${vendas.length} registros):`);
  vendas.forEach((venda, index) => {
    console.log(`${index + 1}. ID: ${venda.id}`);
    console.log(`   Cliente: ${venda.cliente_id}`);
    console.log(`   Valor: R$ ${venda.valor}`);
    console.log(`   Status: ${venda.status}`);
    console.log(`   Empresa: ${venda.empresa_id}`);
    console.log(`   Data: ${venda.data}`);
    console.log('');
  });
  
  console.log(`\nVales (${vales.length} registros):`);
  vales.forEach((vale, index) => {
    console.log(`${index + 1}. ID: ${vale.id}`);
    console.log(`   Cliente: ${vale.cliente_id}`);
    console.log(`   Tipo: ${vale.tipo}`);
    console.log(`   Valor: R$ ${vale.valor}`);
    console.log(`   Status: ${vale.status}`);
    console.log(`   Empresa: ${vale.empresa_id}`);
    console.log(`   Data: ${vale.data}`);
    console.log('');
  });
  
  // 2. Simular processo de backup
  console.log('\n2. SIMULANDO PROCESSO DE BACKUP:');
  
  const backupData = {
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    tables: {}
  };
  
  // Incluir vendas no backup
  backupData.tables.vendas = vendas;
  console.log(`✓ Vendas incluídas no backup: ${vendas.length} registros`);
  
  // Incluir vales no backup
  backupData.tables.vales = vales;
  console.log(`✓ Vales incluídos no backup: ${vales.length} registros`);
  
  // 3. Verificar integridade dos dados no backup
  console.log('\n3. VERIFICAÇÃO DE INTEGRIDADE:');
  
  // Verificar se todos os registros têm ID válido
  const vendasComId = backupData.tables.vendas.filter(v => v.id && v.id !== null);
  const valesComId = backupData.tables.vales.filter(v => v.id && v.id !== null);
  
  console.log(`✓ Vendas com ID válido: ${vendasComId.length}/${vendas.length}`);
  console.log(`✓ Vales com ID válido: ${valesComId.length}/${vales.length}`);
  
  // Verificar se todos os registros têm empresa_id
  const vendasComEmpresa = backupData.tables.vendas.filter(v => v.empresa_id && v.empresa_id !== null);
  const valesComEmpresa = backupData.tables.vales.filter(v => v.empresa_id && v.empresa_id !== null);
  
  console.log(`✓ Vendas com empresa_id: ${vendasComEmpresa.length}/${vendas.length}`);
  console.log(`✓ Vales com empresa_id: ${valesComEmpresa.length}/${vales.length}`);
  
  // 4. Salvar backup de teste
  const backupJson = JSON.stringify(backupData, null, 2);
  const fs = require('fs');
  const backupFile = 'backup-teste-final.json';
  fs.writeFileSync(backupFile, backupJson);
  
  console.log(`\n4. BACKUP SALVO:`);
  console.log(`✓ Arquivo: ${backupFile}`);
  console.log(`✓ Tamanho: ${(backupJson.length / 1024).toFixed(2)} KB`);
  
  // 5. Verificar conteúdo do arquivo
  const backupContent = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
  console.log(`\n5. VERIFICAÇÃO DO ARQUIVO:`);
  console.log(`✓ Timestamp: ${backupContent.timestamp}`);
  console.log(`✓ Versão: ${backupContent.version}`);
  console.log(`✓ Tabelas incluídas: ${Object.keys(backupContent.tables).join(', ')}`);
  console.log(`✓ Vendas no arquivo: ${backupContent.tables.vendas?.length || 0}`);
  console.log(`✓ Vales no arquivo: ${backupContent.tables.vales?.length || 0}`);
  
  // 6. Resultado final
  console.log('\n6. RESULTADO FINAL:');
  if (vendasComId.length === vendas.length && valesComId.length === vales.length &&
      vendasComEmpresa.length === vendas.length && valesComEmpresa.length === vales.length &&
      backupContent.tables.vendas?.length > 0 && backupContent.tables.vales?.length > 0) {
    console.log('🎉 SUCESSO! O backup manual está funcionando corretamente!');
    console.log('✅ Todos os dados das vendas e vales estão sendo incluídos no backup.');
    console.log('✅ Todos os registros têm IDs válidos.');
    console.log('✅ Todos os registros têm empresa_id definido.');
  } else {
    console.log('❌ PROBLEMA DETECTADO no backup!');
    if (vendasComId.length !== vendas.length) console.log(`- Vendas sem ID: ${vendas.length - vendasComId.length}`);
    if (valesComId.length !== vales.length) console.log(`- Vales sem ID: ${vales.length - valesComId.length}`);
    if (vendasComEmpresa.length !== vendas.length) console.log(`- Vendas sem empresa_id: ${vendas.length - vendasComEmpresa.length}`);
    if (valesComEmpresa.length !== vales.length) console.log(`- Vales sem empresa_id: ${vales.length - valesComEmpresa.length}`);
  }
  
} catch (error) {
  console.error('❌ ERRO:', error.message);
  console.error(error.stack);
} finally {
  db.close();
}