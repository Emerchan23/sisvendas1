// Script para testar se a interface está recebendo os dados corretos do banco
const Database = require('better-sqlite3');
const path = require('path');

// Conectar ao banco de dados
const dbPath = path.join(__dirname, 'data', 'erp.sqlite');
const db = new Database(dbPath);

console.log('🔍 Testando dados que a interface deveria receber...');

try {
  // 1. Simular a consulta que a API /api/linhas faz
  console.log('\n1. Simulando consulta da API /api/linhas:');
  const linhasFromAPI = db.prepare(`
    SELECT * FROM linhas_venda
    ORDER BY dataPedido DESC
  `).all();
  
  console.log(`   Total de linhas retornadas: ${linhasFromAPI.length}`);
  
  // 2. Filtrar apenas as que têm acertoId
  const linhasComAcerto = linhasFromAPI.filter(linha => linha.acertoId);
  console.log(`   Linhas com acertoId: ${linhasComAcerto.length}`);
  
  // 3. Mostrar detalhes das linhas com acerto
  console.log('\n2. Detalhes das linhas com acerto:');
  linhasComAcerto.forEach((linha, index) => {
    console.log(`   ${index + 1}. ${linha.numeroOF || linha.id}:`);
    console.log(`      - settlementStatus: ${linha.settlementStatus}`);
    console.log(`      - acertoId: ${linha.acertoId}`);
    console.log(`      - paymentStatus: ${linha.paymentStatus}`);
    console.log(`      - dataPedido: ${linha.dataPedido}`);
  });
  
  // 4. Verificar se existem acertos fechados
  console.log('\n3. Verificando acertos fechados:');
  const acertosFechados = db.prepare(`
    SELECT id, titulo, status, linhaIds
    FROM acertos 
    WHERE status = 'fechado'
  `).all();
  
  console.log(`   Acertos fechados: ${acertosFechados.length}`);
  
  acertosFechados.forEach((acerto, index) => {
    console.log(`   ${index + 1}. ${acerto.titulo} (${acerto.id}):`);
    
    let linhaIds = [];
    try {
      linhaIds = JSON.parse(acerto.linhaIds || '[]');
    } catch (error) {
      console.log(`      ❌ Erro ao parsear linhaIds`);
      return;
    }
    
    console.log(`      - Vendas vinculadas: ${linhaIds.length}`);
    
    // Verificar cada venda vinculada
    linhaIds.forEach(linhaId => {
      const venda = db.prepare(`
        SELECT numeroOF, settlementStatus, acertoId
        FROM linhas_venda 
        WHERE id = ?
      `).get(linhaId);
      
      if (venda) {
        console.log(`        * ${venda.numeroOF}: ${venda.settlementStatus}`);
      }
    });
  });
  
  // 5. Verificar se há inconsistências
  console.log('\n4. Verificando inconsistências:');
  const inconsistencias = db.prepare(`
    SELECT 
      lv.id,
      lv.numeroOF,
      lv.settlementStatus,
      lv.acertoId,
      a.status as acerto_status,
      a.titulo as acerto_titulo
    FROM linhas_venda lv
    LEFT JOIN acertos a ON lv.acertoId = a.id
    WHERE lv.acertoId IS NOT NULL
    ORDER BY lv.dataPedido DESC
  `).all();
  
  console.log(`   Vendas com acertoId: ${inconsistencias.length}`);
  
  const problemasEncontrados = [];
  
  inconsistencias.forEach(linha => {
    const problema = [];
    
    if (!linha.acerto_status) {
      problema.push('acerto não encontrado');
    } else if (linha.acerto_status === 'fechado' && linha.settlementStatus !== 'ACERTADO') {
      problema.push(`acerto fechado mas status é ${linha.settlementStatus}`);
    } else if (linha.acerto_status === 'aberto' && linha.settlementStatus === 'ACERTADO') {
      problema.push(`acerto aberto mas status é ACERTADO`);
    }
    
    if (problema.length > 0) {
      problemasEncontrados.push({
        numeroOF: linha.numeroOF,
        problemas: problema
      });
    }
  });
  
  if (problemasEncontrados.length === 0) {
    console.log('   ✅ Nenhuma inconsistência encontrada no banco de dados!');
    console.log('   \n💡 CONCLUSÃO: O problema está na interface, não no banco.');
    console.log('   Possíveis causas:');
    console.log('   - Cache do navegador');
    console.log('   - Dados não sendo atualizados na interface após mudança de status');
    console.log('   - Problema na consulta ou filtros da interface');
  } else {
    console.log(`   ❌ Encontradas ${problemasEncontrados.length} inconsistências:`);
    problemasEncontrados.forEach(problema => {
      console.log(`      - ${problema.numeroOF}: ${problema.problemas.join(', ')}`);
    });
  }
  
  // 6. Dados para debug da interface
  console.log('\n5. Dados para debug da interface:');
  console.log('   Exemplo de linha com acerto fechado que deveria aparecer como ACERTADO:');
  
  const exemploLinha = db.prepare(`
    SELECT 
      lv.*,
      a.status as acerto_status,
      a.titulo as acerto_titulo
    FROM linhas_venda lv
    INNER JOIN acertos a ON lv.acertoId = a.id
    WHERE a.status = 'fechado'
    LIMIT 1
  `).get();
  
  if (exemploLinha) {
    console.log('   Dados da linha:');
    console.log(`     - id: ${exemploLinha.id}`);
    console.log(`     - numeroOF: ${exemploLinha.numeroOF}`);
    console.log(`     - settlementStatus: ${exemploLinha.settlementStatus}`);
    console.log(`     - acertoId: ${exemploLinha.acertoId}`);
    console.log(`     - acerto_status: ${exemploLinha.acerto_status}`);
    console.log(`     - acerto_titulo: ${exemploLinha.acerto_titulo}`);
    console.log('   \n   Esta linha deveria aparecer na interface com settlementStatus = "ACERTADO"');
  }
  
} catch (error) {
  console.error('❌ Erro durante o teste:', error);
} finally {
  db.close();
}

console.log('\n✅ Teste finalizado!');