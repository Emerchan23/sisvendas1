const Database = require('better-sqlite3');
const path = require('path');

// Conectar ao banco de dados
const dbPath = path.join(__dirname, '..', 'Banco de dados Aqui', 'erp.sqlite');
const db = new Database(dbPath);

console.log('=== VERIFICANDO ESTRUTURA DO BANCO ===');

try {
  // Listar todas as tabelas
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('\nTabelas existentes:', tables.map(t => t.name));
  
  // Verificar estrutura da tabela orcamentos
  console.log('\n=== ESTRUTURA DA TABELA ORCAMENTOS ===');
  try {
    const orcamentosSchema = db.prepare("PRAGMA table_info(orcamentos)").all();
    console.log('Colunas da tabela orcamentos:');
    orcamentosSchema.forEach(col => {
      console.log(`- ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
    });
    
    // Verificar chaves estrangeiras
    const foreignKeys = db.prepare("PRAGMA foreign_key_list(orcamentos)").all();
    console.log('\nChaves estrangeiras da tabela orcamentos:');
    if (foreignKeys.length > 0) {
      foreignKeys.forEach(fk => {
        console.log(`- ${fk.from} -> ${fk.table}.${fk.to}`);
      });
    } else {
      console.log('Nenhuma chave estrangeira encontrada.');
    }
  } catch (error) {
    console.log('Tabela orcamentos não existe:', error.message);
  }
  
  // Verificar estrutura da tabela orcamento_itens
  console.log('\n=== ESTRUTURA DA TABELA ORCAMENTO_ITENS ===');
  try {
    const itensSchema = db.prepare("PRAGMA table_info(orcamento_itens)").all();
    console.log('Colunas da tabela orcamento_itens:');
    itensSchema.forEach(col => {
      console.log(`- ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
    });
    
    // Verificar chaves estrangeiras
    const foreignKeysItens = db.prepare("PRAGMA foreign_key_list(orcamento_itens)").all();
    console.log('\nChaves estrangeiras da tabela orcamento_itens:');
    if (foreignKeysItens.length > 0) {
      foreignKeysItens.forEach(fk => {
        console.log(`- ${fk.from} -> ${fk.table}.${fk.to}`);
      });
    } else {
      console.log('Nenhuma chave estrangeira encontrada.');
    }
  } catch (error) {
    console.log('Tabela orcamento_itens não existe:', error.message);
  }
  
  // Verificar se o cliente existe
  console.log('\n=== VERIFICANDO CLIENTE ===');
  const cliente = db.prepare('SELECT id, nome FROM clientes WHERE id = ?').get('f72ad049-0c26-4b23-9303-fe73bd8eb03e');
  if (cliente) {
    console.log('✅ Cliente encontrado:', cliente);
  } else {
    console.log('❌ Cliente não encontrado!');
  }
  
} catch (error) {
  console.error('Erro:', error.message);
} finally {
  db.close();
}