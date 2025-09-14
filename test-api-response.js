// Script para testar a resposta da API /api/linhas
const http = require('http');

console.log('🔍 Testando resposta da API /api/linhas...');

// Fazer requisição para a API local
const options = {
  hostname: 'localhost',
  port: 3145,
  path: '/api/linhas',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const linhas = JSON.parse(data);
      
      console.log(`✅ API respondeu com ${linhas.length} linhas`);
      
      // Filtrar linhas com acerto
      const linhasComAcerto = linhas.filter(linha => linha.acertoId);
      console.log(`📋 Linhas com acertoId: ${linhasComAcerto.length}`);
      
      if (linhasComAcerto.length > 0) {
        console.log('\n📊 Detalhes das linhas com acerto:');
        linhasComAcerto.forEach((linha, index) => {
          console.log(`   ${index + 1}. ${linha.numeroOF || linha.id}:`);
          console.log(`      - settlementStatus: ${linha.settlementStatus}`);
          console.log(`      - acertoId: ${linha.acertoId}`);
          console.log(`      - paymentStatus: ${linha.paymentStatus}`);
        });
        
        // Verificar se há linhas com settlementStatus = 'ACERTADO'
        const linhasAcertadas = linhasComAcerto.filter(linha => linha.settlementStatus === 'ACERTADO');
        console.log(`\n✅ Linhas com settlementStatus = 'ACERTADO': ${linhasAcertadas.length}`);
        
        if (linhasAcertadas.length > 0) {
          console.log('\n💡 CONCLUSÃO: A API está retornando os dados corretos!');
          console.log('   O problema deve estar na interface (cache do navegador ou filtros).');
          console.log('\n🔧 SOLUÇÕES SUGERIDAS:');
          console.log('   1. Limpar cache do navegador (Ctrl+Shift+R)');
          console.log('   2. Verificar se há filtros ativos na aba vendas');
          console.log('   3. Recarregar a página completamente');
        } else {
          console.log('\n❌ PROBLEMA: A API não está retornando linhas com settlementStatus = "ACERTADO"');
        }
      } else {
        console.log('\n⚠️  Nenhuma linha com acertoId encontrada na resposta da API');
      }
      
    } catch (error) {
      console.error('❌ Erro ao parsear resposta da API:', error);
      console.log('Resposta bruta:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erro na requisição:', error);
  console.log('\n💡 Certifique-se de que o servidor está rodando em http://localhost:3145');
});

req.end();

console.log('⏳ Fazendo requisição para http://localhost:3145/api/linhas...');