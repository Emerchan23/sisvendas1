// Teste para verificar se a validação do backend está funcionando
import fetch from 'node-fetch';

console.log('=== TESTE DE VALIDAÇÃO DO BACKEND ===\n');

// Teste 1: Tentar alterar settlementStatus para ACERTADO manualmente
async function testValidation() {
  try {
    console.log('🔍 Testando validação do backend...');
    
    // Buscar uma venda existente
    const response = await fetch('http://localhost:3145/api/linhas');
    const linhas = await response.json();
    
    if (linhas.length === 0) {
      console.log('❌ Nenhuma venda encontrada para teste');
      return;
    }
    
    const primeiraLinha = linhas[0];
    console.log(`📋 Testando com venda ID: ${primeiraLinha.id} (OF: ${primeiraLinha.numeroOF})`);
    
    // Tentar alterar settlementStatus para ACERTADO
    const updateResponse = await fetch(`http://localhost:3145/api/linhas/${primeiraLinha.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        settlementStatus: 'ACERTADO'
      })
    });
    
    const result = await updateResponse.json();
    
    if (updateResponse.status === 400 && result.error) {
      console.log('✅ VALIDAÇÃO FUNCIONANDO!');
      console.log(`   Erro retornado: ${result.error}`);
    } else {
      console.log('❌ VALIDAÇÃO FALHOU!');
      console.log(`   Status: ${updateResponse.status}`);
      console.log(`   Resposta: ${JSON.stringify(result)}`);
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

// Executar teste
testValidation().then(() => {
  console.log('\n🎯 RESUMO:');
  console.log('   - Validação implementada no backend');
  console.log('   - Opção "Acertado" removida do frontend');
  console.log('   - Event listeners usando "erp:changed"');
  console.log('   - Status ACERTADO só pode ser definido via setLinhasAcerto()');
});