// Script para corrigir o acerto com linhaIds em formato incorreto
const path = require('path');
const Database = require('better-sqlite3');

console.log('=== CORREÇÃO: ACERTO COM LINHAIDS INCORRETO ===\n');

const dbPath = path.join(process.cwd(), 'data', 'erp.sqlite');
const db = new Database(dbPath);

try {
    // 1. Identificar o acerto problemático
    console.log('1. Identificando acerto problemático...');
    
    const acertoProblematico = db.prepare(`
        SELECT id, titulo, linhaIds, status 
        FROM acertos 
        WHERE id = 'a3891780-45a0-4077-8e31-3f14508b42ae'
    `).get();
    
    if (!acertoProblematico) {
        console.log('❌ Acerto problemático não encontrado!');
        return;
    }
    
    console.log('Acerto encontrado:');
    console.log(`   ID: ${acertoProblematico.id}`);
    console.log(`   Título: ${acertoProblematico.titulo}`);
    console.log(`   Status: ${acertoProblematico.status}`);
    console.log(`   LinhaIds atual: ${acertoProblematico.linhaIds}`);
    
    // 2. Tentar parsear o linhaIds atual
    let linhaIdsArray;
    try {
        linhaIdsArray = JSON.parse(acertoProblematico.linhaIds);
        console.log(`   LinhaIds parseado: ${JSON.stringify(linhaIdsArray)}`);
        console.log(`   Tipo: ${Array.isArray(linhaIdsArray) ? 'Array' : typeof linhaIdsArray}`);
    } catch (error) {
        console.log(`   ❌ Erro ao parsear linhaIds: ${error.message}`);
        return;
    }
    
    // 3. Verificar se a venda referenciada existe
    if (Array.isArray(linhaIdsArray) && linhaIdsArray.length > 0) {
        console.log('\n2. Verificando vendas referenciadas...');
        
        for (const linhaId of linhaIdsArray) {
            const venda = db.prepare(`
                SELECT id, numeroOF, cliente, settlementStatus, acertoId
                FROM linhas_venda 
                WHERE id = ?
            `).get(linhaId);
            
            if (venda) {
                console.log(`   ✅ Venda encontrada: ${venda.numeroOF} (${venda.id})`);
                console.log(`      Status: ${venda.settlementStatus}, AcertoId: ${venda.acertoId}`);
            } else {
                console.log(`   ❌ Venda NÃO encontrada: ${linhaId}`);
                console.log(`      Esta venda não existe no banco de dados!`);
            }
        }
    }
    
    // 4. Opções de correção
    console.log('\n3. Opções de correção...');
    
    // Verificar se há vendas válidas no array
    const vendasExistentes = [];
    if (Array.isArray(linhaIdsArray)) {
        for (const linhaId of linhaIdsArray) {
            const venda = db.prepare(`
                SELECT id FROM linhas_venda WHERE id = ?
            `).get(linhaId);
            if (venda) {
                vendasExistentes.push(linhaId);
            }
        }
    }
    
    console.log(`Vendas existentes no array: ${vendasExistentes.length}`);
    
    if (vendasExistentes.length === 0) {
        console.log('\n🗑️  RECOMENDAÇÃO: Deletar este acerto');
        console.log('   Motivo: Não há vendas válidas vinculadas a este acerto');
        
        // Confirmar se queremos deletar
        console.log('\n4. Deletando acerto inválido...');
        
        const deleteResult = db.prepare(`
            DELETE FROM acertos WHERE id = ?
        `).run(acertoProblematico.id);
        
        if (deleteResult.changes > 0) {
            console.log('   ✅ Acerto deletado com sucesso!');
        } else {
            console.log('   ❌ Falha ao deletar acerto');
        }
        
    } else {
        console.log('\n🔧 RECOMENDAÇÃO: Corrigir linhaIds');
        console.log(`   Manter apenas vendas existentes: ${vendasExistentes.join(', ')}`);
        
        // Corrigir o formato do linhaIds
        const linhaIdsCorrigido = JSON.stringify(vendasExistentes);
        
        console.log('\n4. Corrigindo linhaIds...');
        console.log(`   Novo valor: ${linhaIdsCorrigido}`);
        
        const updateResult = db.prepare(`
            UPDATE acertos 
            SET linhaIds = ?, updated_at = ?
            WHERE id = ?
        `).run(
            linhaIdsCorrigido,
            new Date().toISOString(),
            acertoProblematico.id
        );
        
        if (updateResult.changes > 0) {
            console.log('   ✅ LinhaIds corrigido com sucesso!');
            
            // Atualizar as vendas para apontar para este acerto
            console.log('\n5. Atualizando vendas vinculadas...');
            
            for (const linhaId of vendasExistentes) {
                const updateVenda = db.prepare(`
                    UPDATE linhas_venda 
                    SET acertoId = ?, settlementStatus = 'ACERTADO'
                    WHERE id = ?
                `).run(acertoProblematico.id, linhaId);
                
                if (updateVenda.changes > 0) {
                    console.log(`   ✅ Venda ${linhaId} atualizada`);
                } else {
                    console.log(`   ❌ Falha ao atualizar venda ${linhaId}`);
                }
            }
        } else {
            console.log('   ❌ Falha ao corrigir linhaIds');
        }
    }
    
    // 5. Verificar resultado final
    console.log('\n=== VERIFICAÇÃO FINAL ===');
    
    const acertoFinal = db.prepare(`
        SELECT id, titulo, linhaIds, status 
        FROM acertos 
        WHERE id = ?
    `).get(acertoProblematico.id);
    
    if (acertoFinal) {
        console.log('Acerto após correção:');
        console.log(`   ID: ${acertoFinal.id}`);
        console.log(`   LinhaIds: ${acertoFinal.linhaIds}`);
        
        // Verificar vendas vinculadas
        try {
            const linhaIds = JSON.parse(acertoFinal.linhaIds);
            if (Array.isArray(linhaIds) && linhaIds.length > 0) {
                const vendasVinculadas = db.prepare(`
                    SELECT id, numeroOF, settlementStatus, acertoId
                    FROM linhas_venda 
                    WHERE id IN (${linhaIds.map(() => '?').join(',')})
                `).all(...linhaIds);
                
                console.log(`\nVendas vinculadas: ${vendasVinculadas.length}`);
                vendasVinculadas.forEach(venda => {
                    console.log(`   - ${venda.numeroOF}: ${venda.settlementStatus} (acertoId: ${venda.acertoId})`);
                });
            }
        } catch (error) {
            console.log(`   ❌ Erro ao verificar vendas: ${error.message}`);
        }
    } else {
        console.log('✅ Acerto foi deletado (como esperado)');
    }
    
} catch (error) {
    console.error('❌ Erro durante a correção:', error.message);
} finally {
    db.close();
}