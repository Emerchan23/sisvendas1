// Script para testar a função linhasPendentesDeAcerto diretamente
const fetch = require('node-fetch');

console.log('=== DEBUG DA FUNÇÃO linhasPendentesDeAcerto ===\n');

async function debugLinhasPendentes() {
  try {
    // 1. Testar a API /api/linhas diretamente
    console.log('1. Testando API /api/linhas...');
    const response = await fetch('http://localhost:3145/api/linhas');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const linhas = await response.json();
    console.log(`   API retornou: ${linhas.length} linhas`);
    
    linhas.forEach((linha, index) => {
      console.log(`   ${index + 1}. ${linha.cliente} - Status: ${linha.paymentStatus}/${linha.settlementStatus}`);
    });
    
    // 2. Aplicar o filtro da função linhasPendentesDeAcerto
    console.log('\n2. Aplicando filtro linhasPendentesDeAcerto...');
    const pendentes = linhas.filter(linha => 
      linha.paymentStatus === "Pago" && 
      (!linha.settlementStatus || linha.settlementStatus === "Pendente")
    );
    
    console.log(`   Linhas pendentes encontradas: ${pendentes.length}`);
    pendentes.forEach((linha, index) => {
      console.log(`   ${index + 1}. ${linha.cliente} - ${linha.dataPedido}`);
    });
    
    // 3. Simular a chamada da função pendenciasDeAcerto
    console.log('\n3. Testando função pendenciasDeAcerto via fetch...');
    
    // Como a função pendenciasDeAcerto não tem endpoint próprio, vamos simular
    // o que ela faria internamente
    console.log('   A função pendenciasDeAcerto() chama linhasPendentesDeAcerto()');
    console.log('   Que por sua vez chama getLinhas() e aplica o filtro');
    console.log(`   Resultado esperado: ${pendentes.length} linhas pendentes`);
    
    if (pendentes.length === 0) {
      console.log('\n   ❌ PROBLEMA: Nenhuma linha pendente encontrada!');
      console.log('   Verificando se há problema no filtro...');
      
      linhas.forEach(linha => {
        const statusPago = linha.paymentStatus === "Pago";
        const statusPendente = !linha.settlementStatus || linha.settlementStatus === "Pendente";
        console.log(`   ${linha.cliente}: statusPago=${statusPago}, statusPendente=${statusPendente}`);
      });
    } else {
      console.log('\n   ✅ Linhas pendentes encontradas corretamente!');
    }
    
  } catch (error) {
    console.error('❌ ERRO durante debug:', error.message);
  }
}

debugLinhasPendentes().then(() => {
  console.log('\n=== FIM DO DEBUG ===');
});