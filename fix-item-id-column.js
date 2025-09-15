const Database = require('better-sqlite3');
const path = require('path');

// Conectar ao banco de dados
const dbPath = path.join(__dirname, '..', 'Banco de dados Aqui', 'erp.sqlite');
const db = new Database(dbPath);

console.log('=== CORRIGINDO COLUNA ITEM_ID NA TABELA ORCAMENTO_ITENS ===');

try {
  // Verificar estrutura atual da tabela
  console.log('\n1. Verificando estrutura atual da tabela orcamento_itens...');
  const currentSchema = db.prepare('PRAGMA table_info(orcamento_itens)').all();
  console.log('Colunas atuais:');
  currentSchema.forEach(col => {
    console.log(`- ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
  });
  
  // Verificar se a coluna item_id já existe
  const itemIdExists = currentSchema.some(col => col.name === 'item_id');
  
  if (itemIdExists) {
    console.log('\n✅ A coluna item_id já existe na tabela orcamento_itens!');
  } else {
    console.log('\n2. Adicionando coluna item_id...');
    
    // Adicionar a coluna item_id
    db.exec('ALTER TABLE orcamento_itens ADD COLUMN item_id TEXT');
    console.log('✅ Coluna item_id adicionada com sucesso!');
    
    // Verificar se há dados existentes para migrar
    console.log('\n3. Verificando dados existentes...');
    const existingItems = db.prepare('SELECT id, produto_id FROM orcamento_itens').all();
    console.log(`Encontrados ${existingItems.length} itens existentes`);
    
    if (existingItems.length > 0) {
      console.log('\n4. Migrando dados existentes...');
      // Migrar dados da coluna produto_id para item_id
      const updateStmt = db.prepare('UPDATE orcamento_itens SET item_id = produto_id WHERE id = ?');
      
      let migratedCount = 0;
      for (const item of existingItems) {
        if (item.produto_id) {
          updateStmt.run(item.id);
          migratedCount++;
        }
      }
      
      console.log(`✅ ${migratedCount} itens migrados com sucesso!`);
    }
  }
  
  // Verificar estrutura final
  console.log('\n5. Verificando estrutura final...');
  const finalSchema = db.prepare('PRAGMA table_info(orcamento_itens)').all();
  console.log('Colunas finais:');
  finalSchema.forEach(col => {
    console.log(`- ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
  });
  
  // Testar uma inserção simples
  console.log('\n6. Testando inserção com nova coluna...');
  const testId = 'test-' + Date.now();
  const testOrcamentoId = 'test-orcamento-' + Date.now();
  
  try {
    db.prepare(`
      INSERT INTO orcamento_itens (
        id, orcamento_id, item_id, produto_id, descricao, marca, quantidade,
        valor_unitario, valor_total, observacoes, link_ref, custo_ref
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      testId,
      testOrcamentoId,
      'test-item-id',
      'test-produto-id',
      'Teste de inserção',
      'Marca Teste',
      1,
      10.00,
      10.00,
      'Teste',
      '',
      0
    );
    
    console.log('✅ Teste de inserção bem-sucedido!');
    
    // Limpar dados de teste
    db.prepare('DELETE FROM orcamento_itens WHERE id = ?').run(testId);
    console.log('✅ Dados de teste removidos!');
    
  } catch (testError) {
    console.error('❌ Erro no teste de inserção:', testError.message);
  }
  
  console.log('\n🎉 CORREÇÃO CONCLUÍDA COM SUCESSO!');
  console.log('A coluna item_id foi adicionada à tabela orcamento_itens.');
  console.log('O sistema agora deve funcionar corretamente para salvar orçamentos.');
  
} catch (error) {
  console.error('❌ Erro durante a correção:', error);
  console.error('Stack trace:', error.stack);
} finally {
  db.close();
  console.log('\n🔒 Conexão com banco fechada.');
}