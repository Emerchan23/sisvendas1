// Script para alterar o status de acerto da venda OF 252
const Database = require('better-sqlite3');
const path = require('path');

console.log('=== CORREÇÃO VENDA OF 252 ===\n');

const dbPath = path.join(process.cwd(), '..', 'Banco de dados Aqui', 'erp.sqlite');
const db = new Database(dbPath);

try {
  // Buscar a venda atual
  const venda = db.prepare('SELECT * FROM linhas_venda WHERE numeroOF = ? AND cliente LIKE ?')
    .get('252', '%FUNDO MUNICIPAL DE SAUDE%');
  
  if (!venda) {
    console.log('❌ Venda não encontrada!');
    process.exit(1);
  }
  
  console.log('📋 VENDA ATUAL:');
  console.log('ID:', venda.id);
  console.log('Cliente:', venda.cliente);
  console.log('Payment Status:', venda.paymentStatus);
  console.log('Settlement Status:', venda.settlementStatus);
  console.log('');
  
  if (venda.settlementStatus === 'Pendente') {
    console.log('✅ A venda já está com status Pendente!');
    console.log('Ela DEVE aparecer na aba de acertos.');
  } else {
    console.log('🔄 Alterando settlementStatus de "' + venda.settlementStatus + '" para "Pendente"...');
    
    // Atualizar o status
    const result = db.prepare('UPDATE linhas_venda SET settlementStatus = ? WHERE id = ?')
      .run('Pendente', venda.id);
    
    if (result.changes > 0) {
      console.log('✅ Status alterado com sucesso!');
      console.log('🎯 A venda agora DEVE aparecer na aba de acertos.');
      
      // Verificar a alteração
      const vendaAtualizada = db.prepare('SELECT settlementStatus FROM linhas_venda WHERE id = ?')
        .get(venda.id);
      console.log('📋 Novo settlementStatus:', vendaAtualizada.settlementStatus);
    } else {
      console.log('❌ Erro ao alterar o status!');
    }
  }
  
} catch (error) {
  console.error('❌ Erro:', error.message);
} finally {
  db.close();
}

console.log('\n💡 DICA: Atualize a página da aplicação para ver as mudanças.');