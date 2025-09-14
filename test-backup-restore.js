const Database = require('better-sqlite3');
const fs = require('fs');

async function testBackupRestore() {
  console.log('🔍 Iniciando teste de backup e restore...');
  
  try {
    // 1. Primeiro, vamos adicionar alguns itens ao orçamento existente
    const db = new Database('./data/erp.sqlite');
    
    console.log('\n📝 Adicionando itens de teste ao orçamento 01/2025...');
    const orcamentoId = 'a55694c9-6232-4045-9a4e-e917a85c485f';
    
    // Adicionar alguns itens de teste
    const itensTest = [
      {
        id: 'item-test-1',
        orcamento_id: orcamentoId,
        produto_id: null,
        descricao: 'Produto Teste 1',
        marca: 'Marca A',
        quantidade: 2,
        valor_unitario: 100.50,
        valor_total: 201.00,
        observacoes: 'Item de teste 1'
      },
      {
        id: 'item-test-2', 
        orcamento_id: orcamentoId,
        produto_id: null,
        descricao: 'Produto Teste 2',
        marca: 'Marca B',
        quantidade: 1,
        valor_unitario: 50.25,
        valor_total: 50.25,
        observacoes: 'Item de teste 2'
      }
    ];
    
    const insertStmt = db.prepare(`
      INSERT INTO orcamento_itens (
        id, orcamento_id, produto_id, descricao, marca, quantidade,
        valor_unitario, valor_total, observacoes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const item of itensTest) {
      insertStmt.run(
        item.id, item.orcamento_id, item.produto_id, item.descricao,
        item.marca, item.quantidade, item.valor_unitario, item.valor_total,
        item.observacoes
      );
    }
    
    console.log('✅ Itens adicionados com sucesso');
    
    // 2. Verificar se os itens foram inseridos
    const itensAntes = db.prepare('SELECT * FROM orcamento_itens WHERE orcamento_id = ?').all(orcamentoId);
    console.log('📊 Itens antes do backup:', itensAntes.length);
    
    db.close();
    
    // 3. Fazer backup via API
    console.log('\n💾 Fazendo backup via API...');
    const backupResponse = await fetch('http://localhost:3145/api/backup/export');
    
    if (!backupResponse.ok) {
      throw new Error(`Erro no backup: ${backupResponse.status}`);
    }
    
    const backupData = await backupResponse.json();
    console.log('✅ Backup realizado');
    console.log('📊 Tabelas no backup:', Object.keys(backupData.data));
    console.log('📊 Itens de orçamento no backup:', backupData.data.orcamento_itens?.length || 0);
    
    // 4. Fazer restore via API
    console.log('\n🔄 Fazendo restore via API...');
    const restoreResponse = await fetch('http://localhost:3145/api/backup/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(backupData)
    });
    
    if (!restoreResponse.ok) {
      const errorText = await restoreResponse.text();
      throw new Error(`Erro no restore: ${restoreResponse.status} - ${errorText}`);
    }
    
    const restoreResult = await restoreResponse.json();
    console.log('✅ Restore realizado:', restoreResult.message);
    
    // 5. Verificar se os itens foram restaurados
    console.log('\n🔍 Verificando itens após restore...');
    const dbAfter = new Database('./data/erp.sqlite');
    const itensDepois = dbAfter.prepare('SELECT * FROM orcamento_itens WHERE orcamento_id = ?').all(orcamentoId);
    
    console.log('📊 Itens após restore:', itensDepois.length);
    console.log('📋 Detalhes dos itens:');
    itensDepois.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.descricao} - Qtd: ${item.quantidade} - Valor: R$ ${item.valor_unitario}`);
    });
    
    dbAfter.close();
    
    if (itensDepois.length === itensTest.length) {
      console.log('\n🎉 SUCESSO! Os itens do orçamento foram preservados após backup/restore!');
    } else {
      console.log('\n❌ FALHA! Itens perdidos no processo de backup/restore');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testBackupRestore();