// Teste para verificar o filtro por ano na aba Acertos
const Database = require('better-sqlite3');
const path = require('path');

// Conectar ao banco
const dbPath = path.join(process.cwd(), 'data', 'erp.sqlite');
const db = new Database(dbPath);

console.log('=== TESTE DO FILTRO POR ANO ===\n');

// Buscar todas as linhas pendentes
const linhasPendentes = db.prepare(`
  SELECT id, cliente, paymentStatus, settlementStatus, dataPedido, valorVenda
  FROM linhas_venda 
  WHERE paymentStatus = 'Pago' 
  AND (settlementStatus IS NULL OR settlementStatus = 'Pendente')
  ORDER BY dataPedido DESC
`).all();

console.log(`Total de vendas pendentes de acerto: ${linhasPendentes.length}`);

if (linhasPendentes.length > 0) {
  console.log('\n--- DETALHES DAS VENDAS PENDENTES ---');
  linhasPendentes.forEach((linha, index) => {
    const dataPedido = new Date(linha.dataPedido);
    const ano = dataPedido.getFullYear();
    
    console.log(`${index + 1}. ${linha.cliente} (ID: ${linha.id})`);
    console.log(`   - Data do Pedido: ${linha.dataPedido}`);
    console.log(`   - Ano: ${ano}`);
    console.log(`   - Status Pagamento: '${linha.paymentStatus}'`);
    console.log(`   - Status Acerto: '${linha.settlementStatus || 'NULL'}'`);
    console.log(`   - Valor: R$ ${linha.valorVenda || 'N/A'}`);
    console.log('');
  });
  
  // Verificar quantas vendas são de 2025 (ano atual)
  const anoAtual = new Date().getFullYear();
  const vendasAnoAtual = linhasPendentes.filter(linha => {
    if (!linha.dataPedido) return false;
    const anoLinha = new Date(linha.dataPedido).getFullYear();
    return anoLinha === anoAtual;
  });
  
  console.log('--- FILTRO POR ANO ---');
  console.log(`Ano atual: ${anoAtual}`);
  console.log(`Vendas pendentes do ano ${anoAtual}: ${vendasAnoAtual.length}`);
  
  if (vendasAnoAtual.length > 0) {
    console.log('\nVendas que DEVEM aparecer na aba Acertos (ano atual):');
    vendasAnoAtual.forEach((linha, index) => {
      console.log(`  ${index + 1}. ${linha.cliente} - ${linha.dataPedido}`);
    });
    console.log('\n✅ ESTAS VENDAS DEVEM APARECER NA ABA ACERTOS!');
  } else {
    console.log('\n❌ NENHUMA VENDA DO ANO ATUAL DEVE APARECER NA ABA ACERTOS!');
    console.log('\n💡 POSSÍVEL SOLUÇÃO: Verificar se as datas das vendas estão no ano correto.');
  }
  
  // Mostrar distribuição por ano
  const vendasPorAno = {};
  linhasPendentes.forEach(linha => {
    if (linha.dataPedido) {
      const ano = new Date(linha.dataPedido).getFullYear();
      vendasPorAno[ano] = (vendasPorAno[ano] || 0) + 1;
    }
  });
  
  console.log('\n--- DISTRIBUIÇÃO POR ANO ---');
  Object.keys(vendasPorAno).sort().forEach(ano => {
    console.log(`${ano}: ${vendasPorAno[ano]} venda(s)`);
  });
  
} else {
  console.log('\n❌ NENHUMA VENDA PENDENTE ENCONTRADA!');
}

db.close();
console.log('\n=== FIM DO TESTE ===');