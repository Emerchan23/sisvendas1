const Database = require('better-sqlite3');
const path = require('path');

// Conectar ao banco de dados
const dbPath = path.join(__dirname, '..', 'Banco de dados Aqui', 'erp.sqlite');
const db = new Database(dbPath);

console.log('=== VERIFICAÇÃO DE INTEGRIDADE DOS DADOS ===');

try {
  // 1. Verificar estrutura da tabela
  console.log('\n1. Verificando estrutura da tabela orcamento_itens...');
  const schema = db.prepare('PRAGMA table_info(orcamento_itens)').all();
  
  console.log('Colunas da tabela:');
  schema.forEach(col => {
    console.log(`  - ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
  });
  
  const hasItemId = schema.some(col => col.name === 'item_id');
  const hasProdutoId = schema.some(col => col.name === 'produto_id');
  
  if (!hasItemId) {
    console.error('❌ Coluna item_id não encontrada!');
    process.exit(1);
  }
  
  if (!hasProdutoId) {
    console.error('❌ Coluna produto_id não encontrada!');
    process.exit(1);
  }
  
  console.log('✅ Ambas as colunas item_id e produto_id estão presentes!');
  
  // 2. Verificar dados existentes
  console.log('\n2. Verificando dados existentes...');
  
  const totalItens = db.prepare('SELECT COUNT(*) as count FROM orcamento_itens').get();
  console.log(`Total de itens na tabela: ${totalItens.count}`);
  
  if (totalItens.count > 0) {
    // Verificar itens com item_id NULL
    const itensComItemIdNull = db.prepare('SELECT COUNT(*) as count FROM orcamento_itens WHERE item_id IS NULL').get();
    console.log(`Itens com item_id NULL: ${itensComItemIdNull.count}`);
    
    // Verificar itens com produto_id NULL
    const itensComProdutoIdNull = db.prepare('SELECT COUNT(*) as count FROM orcamento_itens WHERE produto_id IS NULL').get();
    console.log(`Itens com produto_id NULL: ${itensComProdutoIdNull.count}`);
    
    // Verificar itens com ambos preenchidos
    const itensCompletos = db.prepare(`
      SELECT COUNT(*) as count FROM orcamento_itens 
      WHERE item_id IS NOT NULL AND produto_id IS NOT NULL
    `).get();
    console.log(`Itens com ambos item_id e produto_id preenchidos: ${itensCompletos.count}`);
    
    // Mostrar alguns exemplos de dados
    console.log('\n3. Exemplos de dados (primeiros 5 registros):');
    const exemplos = db.prepare(`
      SELECT id, orcamento_id, item_id, produto_id, descricao, quantidade, valor_unitario
      FROM orcamento_itens 
      LIMIT 5
    `).all();
    
    if (exemplos.length > 0) {
      exemplos.forEach((item, index) => {
        console.log(`\nItem ${index + 1}:`);
        console.log(`  ID: ${item.id}`);
        console.log(`  Orçamento ID: ${item.orcamento_id}`);
        console.log(`  Item ID: ${item.item_id || 'NULL'}`);
        console.log(`  Produto ID: ${item.produto_id || 'NULL'}`);
        console.log(`  Descrição: ${item.descricao}`);
        console.log(`  Quantidade: ${item.quantidade}`);
        console.log(`  Valor Unitário: ${item.valor_unitario}`);
      });
    } else {
      console.log('Nenhum item encontrado.');
    }
    
    // 4. Verificar consistência com orçamentos
    console.log('\n4. Verificando consistência com orçamentos...');
    
    const itensOrfaos = db.prepare(`
      SELECT COUNT(*) as count 
      FROM orcamento_itens oi
      LEFT JOIN orcamentos o ON oi.orcamento_id = o.id
      WHERE o.id IS NULL
    `).get();
    
    console.log(`Itens órfãos (sem orçamento correspondente): ${itensOrfaos.count}`);
    
    if (itensOrfaos.count > 0) {
      console.log('⚠️ Encontrados itens órfãos! Isso pode indicar problemas de integridade.');
      
      const exemplosOrfaos = db.prepare(`
        SELECT oi.id, oi.orcamento_id, oi.descricao
        FROM orcamento_itens oi
        LEFT JOIN orcamentos o ON oi.orcamento_id = o.id
        WHERE o.id IS NULL
        LIMIT 3
      `).all();
      
      console.log('Exemplos de itens órfãos:');
      exemplosOrfaos.forEach(item => {
        console.log(`  - Item ID: ${item.id}, Orçamento ID: ${item.orcamento_id}, Descrição: ${item.descricao}`);
      });
    } else {
      console.log('✅ Todos os itens têm orçamentos correspondentes!');
    }
    
    // 5. Verificar duplicatas de item_id
    console.log('\n5. Verificando duplicatas de item_id...');
    
    const duplicatasItemId = db.prepare(`
      SELECT item_id, COUNT(*) as count
      FROM orcamento_itens
      WHERE item_id IS NOT NULL
      GROUP BY item_id
      HAVING COUNT(*) > 1
    `).all();
    
    if (duplicatasItemId.length > 0) {
      console.log(`⚠️ Encontradas ${duplicatasItemId.length} duplicatas de item_id:`);
      duplicatasItemId.forEach(dup => {
        console.log(`  - item_id: ${dup.item_id} (${dup.count} ocorrências)`);
      });
    } else {
      console.log('✅ Nenhuma duplicata de item_id encontrada!');
    }
    
  } else {
    console.log('ℹ️ Tabela vazia - nenhum dado para verificar.');
  }
  
  // 6. Verificar índices e constraints
  console.log('\n6. Verificando índices...');
  
  const indices = db.prepare('PRAGMA index_list(orcamento_itens)').all();
  if (indices.length > 0) {
    console.log('Índices encontrados:');
    indices.forEach(index => {
      const indexInfo = db.prepare(`PRAGMA index_info(${index.name})`).all();
      const columns = indexInfo.map(col => col.name).join(', ');
      console.log(`  - ${index.name}: ${columns} ${index.unique ? '(UNIQUE)' : ''}`);
    });
  } else {
    console.log('Nenhum índice encontrado.');
  }
  
  // 7. Verificar foreign keys
  console.log('\n7. Verificando foreign keys...');
  
  const foreignKeys = db.prepare('PRAGMA foreign_key_list(orcamento_itens)').all();
  if (foreignKeys.length > 0) {
    console.log('Foreign keys encontradas:');
    foreignKeys.forEach(fk => {
      console.log(`  - ${fk.from} -> ${fk.table}.${fk.to}`);
    });
  } else {
    console.log('Nenhuma foreign key encontrada.');
  }
  
  console.log('\n🎉 VERIFICAÇÃO DE INTEGRIDADE CONCLUÍDA!');
  console.log('\n📊 RESUMO:');
  console.log(`- Total de itens: ${totalItens.count}`);
  if (totalItens.count > 0) {
    const itensComItemIdNull = db.prepare('SELECT COUNT(*) as count FROM orcamento_itens WHERE item_id IS NULL').get();
    const itensOrfaos = db.prepare(`
      SELECT COUNT(*) as count 
      FROM orcamento_itens oi
      LEFT JOIN orcamentos o ON oi.orcamento_id = o.id
      WHERE o.id IS NULL
    `).get();
    
    console.log(`- Itens com item_id NULL: ${itensComItemIdNull.count}`);
    console.log(`- Itens órfãos: ${itensOrfaos.count}`);
    const duplicatasItemIdFinal = db.prepare(`
      SELECT item_id, COUNT(*) as count
      FROM orcamento_itens
      WHERE item_id IS NOT NULL
      GROUP BY item_id
      HAVING COUNT(*) > 1
    `).all();
    console.log(`- Duplicatas de item_id: ${duplicatasItemIdFinal.length}`);
    
    if (itensComItemIdNull.count === 0 && itensOrfaos.count === 0 && duplicatasItemIdFinal.length === 0) {
      console.log('✅ Integridade dos dados está OK!');
    } else {
      console.log('⚠️ Alguns problemas de integridade foram encontrados.');
    }
  }
  
} catch (error) {
  console.error('❌ Erro durante a verificação:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
} finally {
  db.close();
  console.log('\n🔒 Conexão com banco fechada.');
}