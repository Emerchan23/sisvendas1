// Teste da API usada pela página de acertos
const fetch = require('node-fetch');

console.log('=== TESTE DA API DE ACERTOS ===\n');

async function testarAPI() {
  try {
    console.log('1. Testando API /api/linhas (usada para buscar vendas)...');
    const responseLinhas = await fetch('http://localhost:3145/api/linhas');
    
    if (!responseLinhas.ok) {
      throw new Error(`HTTP ${responseLinhas.status}: ${responseLinhas.statusText}`);
    }
    
    const linhas = await responseLinhas.json();
    console.log(`   ✅ API retornou ${linhas.length} linha(s)`);
    
    // Mostrar detalhes das linhas
    console.log('\n--- LINHAS RETORNADAS PELA API ---');
    linhas.forEach((linha, index) => {
      console.log(`${index + 1}. ${linha.cliente} (ID: ${linha.id})`);
      console.log(`   - Status Pagamento: '${linha.paymentStatus}'`);
      console.log(`   - Status Acerto: '${linha.settlementStatus || 'N/A'}'`);
      console.log(`   - Valor: R$ ${linha.valorVenda || linha.valor || 'N/A'}`);
      console.log('');
    });
    
    // Filtrar as que devem aparecer na aba acertos
    const linhasPendentes = linhas.filter(linha => {
      return linha.paymentStatus === 'Pago' && linha.settlementStatus !== 'Acertado';
    });
    
    console.log('--- RESULTADO DO FILTRO ---');
    console.log(`Linhas que DEVEM aparecer na aba Acertos: ${linhasPendentes.length}`);
    
    if (linhasPendentes.length > 0) {
      console.log('\nDetalhes das linhas pendentes:');
      linhasPendentes.forEach((linha, index) => {
        console.log(`  ${index + 1}. ${linha.cliente} (ID: ${linha.id})`);
      });
      console.log('\n✅ ESTAS VENDAS DEVEM APARECER NA ABA ACERTOS!');
    } else {
      console.log('\n❌ NENHUMA VENDA DEVE APARECER NA ABA ACERTOS!');
    }
    
    // Testar também a API de acertos existentes
    console.log('\n2. Testando API /api/acertos (acertos já criados)...');
    const responseAcertos = await fetch('http://localhost:3145/api/acertos');
    
    if (responseAcertos.ok) {
      const acertos = await responseAcertos.json();
      console.log(`   ✅ API retornou ${acertos.length} acerto(s) já criado(s)`);
    } else {
      console.log(`   ⚠️ API de acertos retornou: ${responseAcertos.status}`);
    }
    
  } catch (error) {
    console.error('❌ ERRO ao testar APIs:', error.message);
  }
}

testarAPI().then(() => {
  console.log('\n=== FIM DO TESTE ===');
});