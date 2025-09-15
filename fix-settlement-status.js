// Script para corrigir o settlementStatus das vendas vinculadas aos acertos fechados
const Database = require('better-sqlite3');
const path = require('path');

// Conectar ao banco de dados
const dbPath = path.join(__dirname, '..', 'Banco de dados Aqui', 'erp.sqlite');
const db = new Database(dbPath);

console.log('🔧 Iniciando correção do settlementStatus das vendas...');

try {
  // 1. Buscar todos os acertos com status 'fechado'
  console.log('\n1. Buscando acertos fechados...');
  const acertosFechados = db.prepare(`
    SELECT id, titulo, linhaIds, status, updated_at
    FROM acertos 
    WHERE status = 'fechado'
    ORDER BY updated_at DESC
  `).all();
  
  console.log(`   Encontrados ${acertosFechados.length} acertos fechados`);
  
  let totalVendasCorrigidas = 0;
  let totalVendasJaCorretas = 0;
  
  // 2. Para cada acerto fechado, verificar e corrigir as vendas vinculadas
  for (const acerto of acertosFechados) {
    console.log(`\n📋 Processando acerto: ${acerto.titulo} (${acerto.id})`);
    
    let linhaIds = [];
    try {
      linhaIds = JSON.parse(acerto.linhaIds || '[]');
    } catch (error) {
      console.log(`   ❌ Erro ao parsear linhaIds: ${error.message}`);
      continue;
    }
    
    console.log(`   Vendas vinculadas: ${linhaIds.length}`);
    
    if (linhaIds.length === 0) {
      console.log(`   ⚠️  Nenhuma venda vinculada`);
      continue;
    }
    
    // 3. Verificar o status atual das vendas
    for (const linhaId of linhaIds) {
      const venda = db.prepare(`
        SELECT id, numeroOF, settlementStatus, acertoId
        FROM linhas_venda 
        WHERE id = ?
      `).get(linhaId);
      
      if (!venda) {
        console.log(`   ❌ Venda não encontrada: ${linhaId}`);
        continue;
      }
      
      const statusAtual = venda.settlementStatus;
      const acertoIdAtual = venda.acertoId;
      
      // 4. Verificar se precisa corrigir
      const precisaCorrigir = statusAtual !== 'ACERTADO' || acertoIdAtual !== acerto.id;
      
      if (precisaCorrigir) {
        console.log(`   🔄 Corrigindo venda ${venda.numeroOF || venda.id}:`);
        console.log(`      - settlementStatus: ${statusAtual} → ACERTADO`);
        console.log(`      - acertoId: ${acertoIdAtual} → ${acerto.id}`);
        
        // Atualizar a venda
        const updateResult = db.prepare(`
          UPDATE linhas_venda 
          SET settlementStatus = 'ACERTADO', acertoId = ?
          WHERE id = ?
        `).run(acerto.id, linhaId);
        
        if (updateResult.changes > 0) {
          console.log(`      ✅ Venda corrigida com sucesso`);
          totalVendasCorrigidas++;
        } else {
          console.log(`      ❌ Falha ao corrigir venda`);
        }
      } else {
        console.log(`   ✅ Venda ${venda.numeroOF || venda.id} já está correta`);
        totalVendasJaCorretas++;
      }
    }
  }
  
  // 5. Resumo final
  console.log('\n📊 RESUMO DA CORREÇÃO:');
  console.log(`   Acertos fechados processados: ${acertosFechados.length}`);
  console.log(`   Vendas corrigidas: ${totalVendasCorrigidas}`);
  console.log(`   Vendas já corretas: ${totalVendasJaCorretas}`);
  
  // 6. Verificação final
  console.log('\n🔍 Verificação final...');
  const vendasInconsistentes = db.prepare(`
    SELECT lv.id, lv.numeroOF, lv.settlementStatus, lv.acertoId, a.status as acerto_status
    FROM linhas_venda lv
    INNER JOIN acertos a ON lv.acertoId = a.id
    WHERE a.status = 'fechado' AND lv.settlementStatus != 'ACERTADO'
  `).all();
  
  if (vendasInconsistentes.length === 0) {
    console.log('   ✅ Todas as vendas vinculadas aos acertos fechados estão com status ACERTADO');
  } else {
    console.log(`   ❌ Ainda existem ${vendasInconsistentes.length} vendas inconsistentes:`);
    vendasInconsistentes.forEach(venda => {
      console.log(`      - ${venda.numeroOF}: ${venda.settlementStatus} (acerto: ${venda.acerto_status})`);
    });
  }
  
} catch (error) {
  console.error('❌ Erro durante a correção:', error);
} finally {
  db.close();
  console.log('\n🔒 Conexão com banco fechada.');
}

console.log('\n✅ Script de correção finalizado!');