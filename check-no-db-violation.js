#!/usr/bin/env node
/**
 * SCRIPT DE PROTEÇÃO CONTRA VIOLAÇÃO DO PRD
 * Verifica se há arquivos de banco de dados na pasta gestao vendas
 * TODOS OS BANCOS DEVEM ESTAR EM: ../Banco de dados Aqui/
 */

const fs = require('fs');
const path = require('path');

function findDatabaseFiles(dir, foundFiles = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Pular node_modules e .git
      if (item !== 'node_modules' && item !== '.git' && item !== '.next') {
        findDatabaseFiles(fullPath, foundFiles);
      }
    } else {
      // Verificar extensões de banco de dados
      const ext = path.extname(item).toLowerCase();
      if (['.sqlite', '.db', '.sqlite3', '.database'].includes(ext)) {
        foundFiles.push(fullPath);
      }
    }
  }
  
  return foundFiles;
}

console.log('🔍 VERIFICANDO VIOLAÇÕES DO PRD...');
console.log('📋 Procurando arquivos de banco de dados na pasta gestao vendas...');

const currentDir = __dirname;
const dbFiles = findDatabaseFiles(currentDir);

if (dbFiles.length === 0) {
  console.log('✅ CONFORMIDADE OK: Nenhum arquivo de banco encontrado na pasta gestao vendas');
  console.log('✅ Sistema está em conformidade com o PRD');
  process.exit(0);
} else {
  console.log('❌ VIOLAÇÃO DO PRD DETECTADA!');
  console.log('❌ Arquivos de banco encontrados na pasta gestao vendas:');
  
  dbFiles.forEach(file => {
    console.log(`   - ${file}`);
  });
  
  console.log('');
  console.log('🚨 AÇÃO NECESSÁRIA:');
  console.log('   1. Mover todos os arquivos para: ../Banco de dados Aqui/');
  console.log('   2. Atualizar código para usar o caminho correto');
  console.log('   3. Verificar se não há código criando bancos locais');
  
  process.exit(1);
}