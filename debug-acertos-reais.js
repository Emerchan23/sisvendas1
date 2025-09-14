// Script para debugar acertos reais no banco de dados
const path = require('path');
const Database = require('better-sqlite3');

console.log('=== DEBUG: ACERTOS REAIS NO BANCO ===\n');

const dbPath = path.join(process.cwd(), 'data', 'erp.sqlite');
const db = new Database(dbPath);

try {
    // 1. Verificar todos os acertos
    console.log('1. Verificando todos os acertos...');
    
    const todosAcertos = db.prepare('SELECT * FROM acertos ORDER BY created_at DESC').all();
    console.log(`   Total de acertos: ${todosAcertos.length}`);
    
    if (todosAcertos.length === 0) {
        console.log('   ❌ Nenhum acerto encontrado no banco!');
        return;
    }
    
    // 2. Analisar cada acerto
    console.log('\n2. Analisando cada acerto...');
    
    todosAcertos.forEach((acerto, index) => {
        console.log(`\n--- ACERTO ${index + 1} ---`);
        console.log(`ID: ${acerto.id}`);
        console.log(`Título: ${acerto.titulo || 'Sem título'}`);
        console.log(`Status: ${acerto.status}`);
        console.log(`Data: ${acerto.data}`);
        console.log(`LinhaIds: ${acerto.linhaIds}`);
        
        // Verificar vendas vinculadas
        if (acerto.linhaIds) {
            const linhaIdsArray = acerto.linhaIds.split(',').filter(id => id.trim());
            console.log(`Número de vendas esperadas: ${linhaIdsArray.length}`);
            
            // Buscar vendas no banco
            const vendasVinculadas = db.prepare(`
                SELECT id, numeroOF, cliente, settlementStatus, acertoId, paymentStatus
                FROM linhas_venda 
                WHERE id IN (${linhaIdsArray.map(() => '?').join(',')})
            `).all(...linhaIdsArray);
            
            console.log(`Vendas encontradas no banco: ${vendasVinculadas.length}`);
            
            if (vendasVinculadas.length !== linhaIdsArray.length) {
                console.log(`   ⚠️  INCONSISTÊNCIA: Esperado ${linhaIdsArray.length}, encontrado ${vendasVinculadas.length}`);
                
                // Verificar quais IDs não foram encontrados
                const idsEncontrados = vendasVinculadas.map(v => v.id);
                const idsNaoEncontrados = linhaIdsArray.filter(id => !idsEncontrados.includes(id));
                if (idsNaoEncontrados.length > 0) {
                    console.log(`   IDs não encontrados: ${idsNaoEncontrados.join(', ')}`);
                }
            }
            
            // Verificar status das vendas
            let vendasCorretas = 0;
            let vendasIncorretas = 0;
            
            vendasVinculadas.forEach(venda => {
                const statusEsperado = acerto.status === 'fechado' ? 'ACERTADO' : 'ACERTADO'; // Mesmo aberto deveria ter ACERTADO
                const statusAtual = venda.settlementStatus;
                const acertoIdCorreto = venda.acertoId === acerto.id;
                
                if (statusAtual === 'ACERTADO' && acertoIdCorreto) {
                    vendasCorretas++;
                    console.log(`   ✅ ${venda.numeroOF}: Status correto (${statusAtual}, acertoId: ${venda.acertoId})`);
                } else {
                    vendasIncorretas++;
                    console.log(`   ❌ ${venda.numeroOF}: Status incorreto`);
                    console.log(`      - settlementStatus: ${statusAtual} (esperado: ACERTADO)`);
                    console.log(`      - acertoId: ${venda.acertoId} (esperado: ${acerto.id})`);
                    console.log(`      - paymentStatus: ${venda.paymentStatus}`);
                }
            });
            
            console.log(`   Resumo: ${vendasCorretas} corretas, ${vendasIncorretas} incorretas`);
            
            // Se há vendas incorretas e o acerto está fechado, isso é um problema
            if (vendasIncorretas > 0 && acerto.status === 'fechado') {
                console.log(`   🚨 PROBLEMA DETECTADO: Acerto fechado com vendas em status incorreto!`);
            }
        } else {
            console.log(`   ⚠️  Acerto sem linhaIds definidos`);
        }
    });
    
    // 3. Verificar vendas órfãs (com acertoId mas acerto não existe)
    console.log('\n3. Verificando vendas órfãs...');
    
    const vendasComAcerto = db.prepare(`
        SELECT id, numeroOF, acertoId, settlementStatus
        FROM linhas_venda 
        WHERE acertoId IS NOT NULL AND acertoId != ''
    `).all();
    
    console.log(`Vendas com acertoId: ${vendasComAcerto.length}`);
    
    const acertosIds = todosAcertos.map(a => a.id);
    const vendasOrfas = vendasComAcerto.filter(v => !acertosIds.includes(v.acertoId));
    
    if (vendasOrfas.length > 0) {
        console.log(`\n🚨 VENDAS ÓRFÃS DETECTADAS: ${vendasOrfas.length}`);
        vendasOrfas.forEach(venda => {
            console.log(`   - ${venda.numeroOF} (ID: ${venda.id}) aponta para acerto inexistente: ${venda.acertoId}`);
        });
    } else {
        console.log(`✅ Nenhuma venda órfã detectada`);
    }
    
    // 4. Verificar vendas pendentes que deveriam estar acertadas
    console.log('\n4. Verificando vendas pendentes...');
    
    const vendasPendentes = db.prepare(`
        SELECT id, numeroOF, paymentStatus, settlementStatus, acertoId
        FROM linhas_venda 
        WHERE paymentStatus = 'Pago' 
        AND (settlementStatus IS NULL OR settlementStatus = 'Pendente')
    `).all();
    
    console.log(`Vendas pagas mas pendentes de acerto: ${vendasPendentes.length}`);
    
    if (vendasPendentes.length > 0) {
        vendasPendentes.forEach(venda => {
            console.log(`   - ${venda.numeroOF}: ${venda.settlementStatus || 'NULL'} (acertoId: ${venda.acertoId || 'NULL'})`);
        });
    }
    
    // 5. Estatísticas gerais
    console.log('\n5. Estatísticas gerais...');
    
    const stats = {
        totalVendas: db.prepare('SELECT COUNT(*) as count FROM linhas_venda').get().count,
        vendasPagas: db.prepare("SELECT COUNT(*) as count FROM linhas_venda WHERE paymentStatus = 'Pago'").get().count,
        vendasAcertadas: db.prepare("SELECT COUNT(*) as count FROM linhas_venda WHERE settlementStatus = 'ACERTADO'").get().count,
        vendasPendentes: db.prepare("SELECT COUNT(*) as count FROM linhas_venda WHERE settlementStatus = 'Pendente' OR settlementStatus IS NULL").get().count,
        acertosAbertos: db.prepare("SELECT COUNT(*) as count FROM acertos WHERE status = 'aberto'").get().count,
        acertosFechados: db.prepare("SELECT COUNT(*) as count FROM acertos WHERE status = 'fechado'").get().count
    };
    
    console.log(`Total de vendas: ${stats.totalVendas}`);
    console.log(`Vendas pagas: ${stats.vendasPagas}`);
    console.log(`Vendas acertadas: ${stats.vendasAcertadas}`);
    console.log(`Vendas pendentes: ${stats.vendasPendentes}`);
    console.log(`Acertos abertos: ${stats.acertosAbertos}`);
    console.log(`Acertos fechados: ${stats.acertosFechados}`);
    
    // 6. Conclusão
    console.log('\n=== CONCLUSÃO ===');
    
    if (stats.acertosFechados > 0 && stats.vendasPendentes > 0) {
        console.log('🚨 PROBLEMA CONFIRMADO: Existem acertos fechados mas ainda há vendas pendentes!');
        console.log('   Isso indica que o processo de finalização não está atualizando corretamente o status das vendas.');
    } else if (stats.acertosFechados === 0) {
        console.log('ℹ️  Nenhum acerto fechado encontrado. O problema pode não ter ocorrido ainda.');
    } else {
        console.log('✅ Aparentemente não há problemas detectados no banco de dados.');
    }
    
} catch (error) {
    console.error('❌ Erro durante a análise:', error.message);
} finally {
    db.close();
}