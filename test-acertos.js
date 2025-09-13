// Script de teste para verificar a função pendenciasDeAcerto
const Database = require('better-sqlite3');
const path = require('path');

// Conectar ao banco
const dbPath = path.join(process.cwd(), 'data', 'erp.sqlite');
const db = new Database(dbPath);

console.log('=== TESTE COMPLETO DA FUNÇÃO pendenciasDeAcerto ===');

// 1. Verificar todas as linhas no banco
const todasLinhas = db.prepare(`
  SELECT id, cliente, paymentStatus, settlementStatus, dataPedido 
  FROM linhas_venda
  ORDER BY dataPedido DESC
`).all();

console.log('\n1. TODAS AS LINHAS NO BANCO:');
console.log('Total de linhas:', todasLinhas.length);
todasLinhas.forEach(linha => {
  console.log(`  - ${linha.cliente}: paymentStatus='${linha.paymentStatus}', settlementStatus='${linha.settlementStatus || 'NULL'}'`);
});

// 2. Aplicar o filtro da função linhasPendentesDeAcerto
const linhasPendentes = todasLinhas.filter(linha => 
  linha.paymentStatus === "Pago" && 
  (!linha.settlementStatus || linha.settlementStatus === "Pendente")
);

console.log('\n2. LINHAS QUE DEVEM APARECER NA ABA ACERTOS:');
console.log('Total de linhas pendentes:', linhasPendentes.length);
linhasPendentes.forEach(linha => {
  console.log(`  ✓ ${linha.cliente} (${linha.id})`);
});

// 3. Testar a API diretamente
console.log('\n3. TESTANDO A API /api/linhas:');
const fetch = require('node-fetch');

fetch('http://localhost:3145/api/linhas')
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(apiLinhas => {
    console.log('API retornou', apiLinhas.length, 'linhas');
    
    // Aplicar o mesmo filtro nos dados da API
    const apiPendentes = apiLinhas.filter(linha => 
      linha.paymentStatus === "Pago" && 
      (!linha.settlementStatus || linha.settlementStatus === "Pendente")
    );
    
    console.log('Linhas pendentes via API:', apiPendentes.length);
    apiPendentes.forEach(linha => {
      console.log(`  ✓ ${linha.cliente} (${linha.id})`);
    });
    
    // Comparar resultados
    if (linhasPendentes.length === apiPendentes.length) {
      console.log('\n✅ RESULTADO: Banco e API retornam o mesmo número de linhas pendentes!');
    } else {
      console.log('\n❌ PROBLEMA: Diferença entre banco e API!');
      console.log('Banco:', linhasPendentes.length, 'linhas');
      console.log('API:', apiPendentes.length, 'linhas');
    }
  })
  .catch(error => {
    console.error('\n❌ ERRO ao testar API:', error.message);
    console.log('\nVerifique se o servidor está rodando em http://localhost:3145');
  })
  .finally(() => {
    db.close();
  });