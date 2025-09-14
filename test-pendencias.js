// Teste simples para verificar se as vendas com status 'Pago' aparecem como pendentes
const path = require('path');
const Database = require('better-sqlite3');

// Conectar ao banco
const dbPath = path.join(__dirname, 'data', 'erp.sqlite');
const db = new Database(dbPath);

console.log('=== TESTE: VENDAS PAGAS PENDENTES DE ACERTO ===\n');

try {
  // Buscar todas as linhas
  const stmt = db.prepare('SELECT * FROM linhas_venda ORDER BY id');
  const todasLinhas = stmt.all();
  
  console.log(`Total de linhas no banco: ${todasLinhas.length}`);
  
  // Mostrar todas as linhas
  console.log('\n--- TODAS AS LINHAS ---');
  todasLinhas.forEach((linha, index) => {
    console.log(`${index + 1}. ${linha.cliente} (ID: ${linha.id})`);
    console.log(`   - Status Pagamento: '${linha.paymentStatus}'`);
    console.log(`   - Status Acerto: '${linha.settlementStatus}'`);
    console.log(`   - Valor: R$ ${linha.valor}`);
    console.log('');
  });
  
  // Aplicar a lógica de filtro: paymentStatus = 'Pago' E settlementStatus != 'Acertado'
  const linhasPendentes = todasLinhas.filter(linha => {
    const pagamentoOk = linha.paymentStatus === 'Pago';
    const acertoNaoFeito = linha.settlementStatus !== 'Acertado';
    
    console.log(`Linha ${linha.cliente}:`);
    console.log(`  - Pagamento é 'Pago'? ${pagamentoOk} (valor: '${linha.paymentStatus}')`);
    console.log(`  - Acerto não é 'Acertado'? ${acertoNaoFeito} (valor: '${linha.settlementStatus}')`);
    console.log(`  - Deve aparecer na aba Acertos? ${pagamentoOk && acertoNaoFeito}`);
    console.log('');
    
    return pagamentoOk && acertoNaoFeito;
  });
  
  console.log('--- RESULTADO FINAL ---');
  console.log(`Linhas que DEVEM aparecer na aba Acertos: ${linhasPendentes.length}`);
  
  if (linhasPendentes.length > 0) {
    console.log('\nDetalhes das linhas pendentes:');
    linhasPendentes.forEach((linha, index) => {
      console.log(`  ${index + 1}. ${linha.cliente} (ID: ${linha.id})`);
      console.log(`     - Valor: R$ ${linha.valor}`);
    });
    
    console.log('\n✅ ESTAS VENDAS DEVEM APARECER NA ABA ACERTOS!');
  } else {
    console.log('\n❌ NENHUMA VENDA DEVE APARECER NA ABA ACERTOS!');
    console.log('Verifique se há vendas com:');
    console.log('- paymentStatus = "Pago"');
    console.log('- settlementStatus != "Acertado"');
  }
  
} catch (error) {
  console.error('❌ ERRO:', error.message);
  console.error(error.stack);
}

db.close();
console.log('\n=== FIM DO TESTE ===');