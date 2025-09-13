// Script para debugar o carregamento de dados na página de acertos
const fetch = require('node-fetch');

console.log('=== DEBUG COMPLETO DA ABA ACERTOS ===\n');

async function debugAcertos() {
  try {
    // 1. Testar a função pendenciasDeAcerto via API
    console.log('1. Testando função pendenciasDeAcerto...');
    
    // Simular a chamada que a página faz
    const Database = require('better-sqlite3');
    const path = require('path');
    const dbPath = path.join(process.cwd(), 'data', 'erp.sqlite');
    const db = new Database(dbPath);
    
    // Simular a função linhasPendentesDeAcerto
    const todasLinhas = db.prepare('SELECT * FROM linhas_venda').all();
    console.log(`   Total de linhas no banco: ${todasLinhas.length}`);
    
    const linhasPendentes = todasLinhas.filter(linha => 
      linha.paymentStatus === "Pago" && 
      (!linha.settlementStatus || linha.settlementStatus === "Pendente")
    );
    console.log(`   Linhas pendentes (filtro local): ${linhasPendentes.length}`);
    
    if (linhasPendentes.length > 0) {
      linhasPendentes.forEach((linha, index) => {
        console.log(`     ${index + 1}. ${linha.cliente} - ${linha.dataPedido}`);
      });
    }
    
    // 2. Testar a API /api/linhas
    console.log('\n2. Testando API /api/linhas...');
    const responseLinhas = await fetch('http://localhost:3145/api/linhas');
    
    if (!responseLinhas.ok) {
      throw new Error(`HTTP ${responseLinhas.status}: ${responseLinhas.statusText}`);
    }
    
    const apiLinhas = await responseLinhas.json();
    console.log(`   API retornou: ${apiLinhas.length} linhas`);
    
    const apiPendentes = apiLinhas.filter(linha => 
      linha.paymentStatus === "Pago" && 
      (!linha.settlementStatus || linha.settlementStatus === "Pendente")
    );
    console.log(`   Linhas pendentes (filtro API): ${apiPendentes.length}`);
    
    if (apiPendentes.length > 0) {
      apiPendentes.forEach((linha, index) => {
        console.log(`     ${index + 1}. ${linha.cliente} - ${linha.dataPedido}`);
      });
    }
    
    // 3. Verificar filtro por ano
    console.log('\n3. Testando filtro por ano (2025)...');
    const anoSelecionado = 2025;
    const pendentesFiltrados = apiPendentes.filter(linha => {
      if (!linha.dataPedido) return false;
      const anoLinha = new Date(linha.dataPedido).getFullYear();
      return anoLinha === anoSelecionado;
    });
    
    console.log(`   Linhas após filtro por ano ${anoSelecionado}: ${pendentesFiltrados.length}`);
    
    if (pendentesFiltrados.length > 0) {
      pendentesFiltrados.forEach((linha, index) => {
        console.log(`     ${index + 1}. ${linha.cliente} - ${linha.dataPedido} (ano: ${new Date(linha.dataPedido).getFullYear()})`);
      });
      console.log('\n   ✅ ESTAS VENDAS DEVEM APARECER NA TABELA!');
    } else {
      console.log('\n   ❌ NENHUMA VENDA DEVE APARECER NA TABELA!');
    }
    
    // 4. Verificar se há diferenças entre banco e API
    console.log('\n4. Comparando dados do banco vs API...');
    
    if (linhasPendentes.length !== apiPendentes.length) {
      console.log(`   ⚠️ DIFERENÇA ENCONTRADA!`);
      console.log(`   Banco: ${linhasPendentes.length} pendentes`);
      console.log(`   API: ${apiPendentes.length} pendentes`);
    } else {
      console.log(`   ✅ Banco e API retornam a mesma quantidade de pendentes`);
    }
    
    db.close();
    
  } catch (error) {
    console.error('❌ ERRO durante debug:', error.message);
  }
}

debugAcertos().then(() => {
  console.log('\n=== FIM DO DEBUG ===');
});