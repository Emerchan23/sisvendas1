// Importar o db usando require com extensão .ts
const path = require('path');
const fs = require('fs');

// Verificar se o arquivo de banco existe
const dbPath = path.join(process.cwd(), 'data', 'erp.sqlite');
console.log('=== Verificando banco de dados ===');
console.log('Caminho do banco:', dbPath);

if (!fs.existsSync(dbPath)) {
  console.log('❌ Arquivo do banco não existe:', dbPath);
  console.log('Criando diretório data...');
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('✅ Diretório data criado');
  }
} else {
  console.log('✅ Arquivo do banco existe');
}

// Tentar importar o db
try {
  // Usar require dinâmico para o módulo TypeScript compilado
  const Database = require('better-sqlite3');
  const db = new Database(dbPath);
  
  console.log('\n=== Verificando estrutura do banco ===');
  
  // Listar todas as tabelas
  console.log('\nTabelas no banco:');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table';").all();
  tables.forEach(t => console.log('- ' + t.name));
  
  // Verificar se a tabela unidades_medida existe
  const unidadesTable = tables.find(t => t.name === 'unidades_medida');
  
  if (unidadesTable) {
    console.log('\n=== Estrutura da tabela unidades_medida ===');
    const schema = db.prepare("PRAGMA table_info(unidades_medida);").all();
    schema.forEach(col => {
      console.log(`${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
    });
    
    // Verificar dados existentes
    console.log('\n=== Dados existentes ===');
    const count = db.prepare("SELECT COUNT(*) as total FROM unidades_medida;").get();
    console.log(`Total de registros: ${count.total}`);
    
    if (count.total > 0) {
      const samples = db.prepare("SELECT * FROM unidades_medida LIMIT 5;").all();
      console.log('Primeiros 5 registros:');
      samples.forEach(row => console.log(row));
    } else {
      console.log('\n⚠️  Tabela existe mas está vazia. Inserindo dados padrão...');
      
      // Inserir algumas unidades padrão
      const insertStmt = db.prepare(`
        INSERT OR IGNORE INTO unidades_medida (id, codigo, descricao, ativo)
        VALUES (?, ?, ?, 1)
      `);
      
      const unidadesPadrao = [
        ['un-kg', 'kg', 'Quilograma'],
        ['un-g', 'g', 'Grama'],
        ['un-l', 'l', 'Litro'],
        ['un-ml', 'ml', 'Mililitro'],
        ['un-m', 'm', 'Metro'],
        ['un-cm', 'cm', 'Centímetro'],
        ['un-un', 'un', 'Unidade'],
        ['un-pc', 'pc', 'Peça'],
        ['un-cx', 'cx', 'Caixa'],
        ['un-pct', 'pct', 'Pacote']
      ];
      
      unidadesPadrao.forEach(([id, codigo, descricao]) => {
        insertStmt.run(id, codigo, descricao);
      });
      
      console.log('✅ Unidades padrão inseridas!');
    }
  } else {
    console.log('\n❌ PROBLEMA: Tabela unidades_medida NÃO EXISTE!');
    console.log('A tabela deveria ter sido criada automaticamente pelo db.ts');
    console.log('Vamos criar manualmente...');
    
    db.exec(`
      CREATE TABLE IF NOT EXISTS unidades_medida (
        id TEXT PRIMARY KEY,
        codigo TEXT NOT NULL UNIQUE,
        descricao TEXT NOT NULL,
        ativo BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ Tabela unidades_medida criada com sucesso!');
    
    // Inserir algumas unidades padrão
    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO unidades_medida (id, codigo, descricao, ativo)
      VALUES (?, ?, ?, 1)
    `);
    
    const unidadesPadrao = [
      ['un-kg', 'kg', 'Quilograma'],
      ['un-g', 'g', 'Grama'],
      ['un-l', 'l', 'Litro'],
      ['un-ml', 'ml', 'Mililitro'],
      ['un-m', 'm', 'Metro'],
      ['un-cm', 'cm', 'Centímetro'],
      ['un-un', 'un', 'Unidade'],
      ['un-pc', 'pc', 'Peça'],
      ['un-cx', 'cx', 'Caixa'],
      ['un-pct', 'pct', 'Pacote']
    ];
    
    unidadesPadrao.forEach(([id, codigo, descricao]) => {
      insertStmt.run(id, codigo, descricao);
    });
    
    console.log('✅ Unidades padrão inseridas!');
  }
  
  db.close();
  
} catch (error) {
  console.error('❌ Erro ao verificar banco:', error);
}

console.log('\n=== Verificação concluída ===');