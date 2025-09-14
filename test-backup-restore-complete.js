const Database = require('better-sqlite3');
const path = require('path');

// Configurar caminho do banco
const dbPath = path.join(__dirname, 'data', 'erp.sqlite');

console.log('=== TESTE COMPLETO DE BACKUP E RESTAURAÇÃO ===\n');

// Função para verificar dados atuais
function checkCurrentData() {
    return new Promise((resolve, reject) => {
        try {
            const db = new Database(dbPath);
            const results = {};
            
            console.log('📊 VERIFICANDO DADOS ATUAIS NO BANCO...');
            
            // Verificar orçamentos
            const orcamentosCount = db.prepare(`SELECT COUNT(*) as count FROM orcamentos`).get();
            results.orcamentos_count = orcamentosCount.count;
            console.log(`   📋 Orçamentos: ${results.orcamentos_count}`);
            
            // Verificar itens de orçamentos
            const itensCount = db.prepare(`SELECT COUNT(*) as count FROM orcamento_itens`).get();
            results.orcamento_itens_count = itensCount.count;
            console.log(`   📦 Itens de orçamentos: ${results.orcamento_itens_count}`);
            
            // Verificar clientes
            const clientesCount = db.prepare(`SELECT COUNT(*) as count FROM clientes`).get();
            results.clientes_count = clientesCount.count;
            console.log(`   👥 Clientes: ${results.clientes_count}`);
            
            // Verificar produtos
            const produtosCount = db.prepare(`SELECT COUNT(*) as count FROM produtos`).get();
            results.produtos_count = produtosCount.count;
            console.log(`   🛍️ Produtos: ${results.produtos_count}`);
            
            // Verificar detalhes de orçamentos específicos
            const orcamentosDetails = db.prepare(`
                SELECT o.id, o.cliente_id, o.valor_total as total, 
                       COUNT(oi.id) as itens_count,
                       SUM(oi.quantidade * oi.valor_unitario) as total_calculado
                FROM orcamentos o 
                LEFT JOIN orcamento_itens oi ON o.id = oi.orcamento_id 
                GROUP BY o.id 
                ORDER BY o.id DESC 
                LIMIT 5
            `).all();
            
            results.orcamentos_details = orcamentosDetails;
            console.log('\n   📋 DETALHES DOS ÚLTIMOS 5 ORÇAMENTOS:');
            orcamentosDetails.forEach(row => {
                console.log(`      ID: ${row.id} | Cliente ID: ${row.cliente_id} | Total: R$ ${row.total} | Itens: ${row.itens_count} | Total Calc: R$ ${row.total_calculado || 0}`);
            });
            
            db.close();
            console.log('\n✅ Verificação de dados atuais concluída!\n');
            resolve(results);
            
        } catch (error) {
            console.error('❌ Erro ao verificar dados atuais:', error.message);
            reject(error);
        }
    });
}

// Função para executar backup
function executeBackup() {
    return new Promise((resolve, reject) => {
        console.log('💾 EXECUTANDO BACKUP...');
        
        const { spawn } = require('child_process');
        const curl = spawn('curl', [
            '-X', 'GET',
            'http://localhost:3145/backup/export',
            '-H', 'Content-Type: application/json',
            '-o', 'backup-test.json'
        ]);
        
        curl.on('close', (code) => {
            if (code === 0) {
                console.log('✅ Backup executado com sucesso!');
                console.log('📁 Arquivo salvo como: backup-test.json\n');
                resolve();
            } else {
                console.error(`❌ Erro no backup. Código de saída: ${code}`);
                reject(new Error(`Backup failed with code ${code}`));
            }
        });
        
        curl.on('error', (err) => {
            console.error('❌ Erro ao executar backup:', err.message);
            reject(err);
        });
    });
}

// Função para executar restauração
function executeRestore() {
    return new Promise((resolve, reject) => {
        console.log('🔄 EXECUTANDO RESTAURAÇÃO...');
        
        const fs = require('fs');
        
        // Verificar se o arquivo de backup existe
        if (!fs.existsSync('backup-test.json')) {
            console.error('❌ Arquivo de backup não encontrado!');
            return reject(new Error('Backup file not found'));
        }
        
        const { spawn } = require('child_process');
        const curl = spawn('curl', [
            '-X', 'POST',
            'http://localhost:3145/backup/import',
            '-H', 'Content-Type: application/json',
            '-d', `@backup-test.json`
        ]);
        
        let output = '';
        curl.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        curl.stderr.on('data', (data) => {
            console.error('Stderr:', data.toString());
        });
        
        curl.on('close', (code) => {
            if (code === 0) {
                console.log('✅ Restauração executada com sucesso!');
                console.log('📄 Resposta:', output);
                console.log('');
                resolve();
            } else {
                console.error(`❌ Erro na restauração. Código de saída: ${code}`);
                console.error('Output:', output);
                reject(new Error(`Restore failed with code ${code}`));
            }
        });
        
        curl.on('error', (err) => {
            console.error('❌ Erro ao executar restauração:', err.message);
            reject(err);
        });
    });
}

// Função para verificar dados após restauração
function verifyDataAfterRestore(originalData) {
    return new Promise((resolve, reject) => {
        try {
            const db = new Database(dbPath);
            const results = {};
            let issues = [];
            
            console.log('🔍 VERIFICANDO DADOS APÓS RESTAURAÇÃO...');
            
            // Verificar orçamentos
            const orcamentosCount = db.prepare(`SELECT COUNT(*) as count FROM orcamentos`).get();
            results.orcamentos_count = orcamentosCount.count;
            console.log(`   📋 Orçamentos: ${results.orcamentos_count} (antes: ${originalData.orcamentos_count})`);
            
            if (results.orcamentos_count !== originalData.orcamentos_count) {
                issues.push(`Orçamentos: esperado ${originalData.orcamentos_count}, encontrado ${results.orcamentos_count}`);
            }
            
            // Verificar itens de orçamentos
            const itensCount = db.prepare(`SELECT COUNT(*) as count FROM orcamento_itens`).get();
            results.orcamento_itens_count = itensCount.count;
            console.log(`   📦 Itens de orçamentos: ${results.orcamento_itens_count} (antes: ${originalData.orcamento_itens_count})`);
            
            if (results.orcamento_itens_count !== originalData.orcamento_itens_count) {
                issues.push(`Itens de orçamentos: esperado ${originalData.orcamento_itens_count}, encontrado ${results.orcamento_itens_count}`);
            }
            
            // Verificar clientes
            const clientesCount = db.prepare(`SELECT COUNT(*) as count FROM clientes`).get();
            results.clientes_count = clientesCount.count;
            console.log(`   👥 Clientes: ${results.clientes_count} (antes: ${originalData.clientes_count})`);
            
            if (results.clientes_count !== originalData.clientes_count) {
                issues.push(`Clientes: esperado ${originalData.clientes_count}, encontrado ${results.clientes_count}`);
            }
            
            // Verificar produtos
            const produtosCount = db.prepare(`SELECT COUNT(*) as count FROM produtos`).get();
            results.produtos_count = produtosCount.count;
            console.log(`   🛍️ Produtos: ${results.produtos_count} (antes: ${originalData.produtos_count})`);
            
            if (results.produtos_count !== originalData.produtos_count) {
                issues.push(`Produtos: esperado ${originalData.produtos_count}, encontrado ${results.produtos_count}`);
            }
            
            // Verificar detalhes dos orçamentos
            const orcamentosDetails = db.prepare(`
                SELECT o.id, o.cliente_id, o.valor_total as total, 
                       COUNT(oi.id) as itens_count,
                       SUM(oi.quantidade * oi.valor_unitario) as total_calculado
                FROM orcamentos o 
                LEFT JOIN orcamento_itens oi ON o.id = oi.orcamento_id 
                GROUP BY o.id 
                ORDER BY o.id DESC 
                LIMIT 5
            `).all();
            
            results.orcamentos_details = orcamentosDetails;
            console.log('\n   📋 DETALHES DOS ÚLTIMOS 5 ORÇAMENTOS APÓS RESTAURAÇÃO:');
            orcamentosDetails.forEach(row => {
                console.log(`      ID: ${row.id} | Cliente ID: ${row.cliente_id} | Total: R$ ${row.total} | Itens: ${row.itens_count} | Total Calc: R$ ${row.total_calculado || 0}`);
            });
            
            // Comparar detalhes dos orçamentos
            console.log('\n   🔍 COMPARAÇÃO DETALHADA DOS ORÇAMENTOS:');
            originalData.orcamentos_details.forEach(originalOrc => {
                const restoredOrc = orcamentosDetails.find(r => r.id === originalOrc.id);
                if (restoredOrc) {
                    const totalMatch = Math.abs(parseFloat(originalOrc.total) - parseFloat(restoredOrc.total)) < 0.01;
                    const itensMatch = originalOrc.itens_count === restoredOrc.itens_count;
                    const calcMatch = Math.abs((originalOrc.total_calculado || 0) - (restoredOrc.total_calculado || 0)) < 0.01;
                    
                    console.log(`      ID ${originalOrc.id}: Total ${totalMatch ? '✅' : '❌'} | Itens ${itensMatch ? '✅' : '❌'} | Calc ${calcMatch ? '✅' : '❌'}`);
                    
                    if (!totalMatch) {
                        issues.push(`Orçamento ${originalOrc.id}: total original R$ ${originalOrc.total}, restaurado R$ ${restoredOrc.total}`);
                    }
                    if (!itensMatch) {
                        issues.push(`Orçamento ${originalOrc.id}: itens original ${originalOrc.itens_count}, restaurado ${restoredOrc.itens_count}`);
                    }
                } else {
                    console.log(`      ID ${originalOrc.id}: ❌ NÃO ENCONTRADO`);
                    issues.push(`Orçamento ${originalOrc.id} não foi restaurado`);
                }
            });
            
            db.close();
            
            results.issues = issues;
            console.log('\n✅ Verificação após restauração concluída!\n');
            resolve(results);
            
        } catch (error) {
            console.error('❌ Erro ao verificar dados após restauração:', error.message);
            reject(error);
        }
    });
}

// Função para testar edição de orçamentos
function testBudgetEditing() {
    return new Promise((resolve, reject) => {
        try {
            console.log('✏️ TESTANDO FUNCIONALIDADE DE EDIÇÃO DE ORÇAMENTOS...');
            
            const db = new Database(dbPath);
            
            // Buscar um orçamento para testar
            const row = db.prepare(`SELECT id, cliente_id, valor_total as total FROM orcamentos ORDER BY id DESC LIMIT 1`).get();
            
            if (!row) {
                console.log('⚠️ Nenhum orçamento encontrado para teste de edição');
                db.close();
                return resolve({ success: false, message: 'Nenhum orçamento encontrado' });
            }
            
            console.log(`   📋 Testando edição do orçamento ID: ${row.id}`);
            console.log(`   👤 Cliente ID: ${row.cliente_id}`);
            console.log(`   💰 Total atual: R$ ${row.total}`);
            
            // Tentar atualizar o orçamento
            const novoTotal = parseFloat(row.total) + 10.50;
            const updateStmt = db.prepare(`UPDATE orcamentos SET valor_total = ? WHERE id = ?`);
            updateStmt.run(novoTotal, row.id);
            
            console.log(`   ✅ Orçamento atualizado com sucesso!`);
            console.log(`   💰 Novo total: R$ ${novoTotal}`);
            
            // Verificar se a atualização foi persistida
            const updatedRow = db.prepare(`SELECT valor_total as total FROM orcamentos WHERE id = ?`).get(row.id);
            
            const totalPersistido = parseFloat(updatedRow.total);
            const updateSuccess = Math.abs(totalPersistido - novoTotal) < 0.01;
            
            console.log(`   🔍 Verificação: ${updateSuccess ? '✅ SUCESSO' : '❌ FALHOU'}`);
            console.log(`   💾 Total persistido: R$ ${totalPersistido}`);
            
            // Restaurar valor original
            const restoreStmt = db.prepare(`UPDATE orcamentos SET valor_total = ? WHERE id = ?`);
            restoreStmt.run(row.total, row.id);
            console.log(`   🔄 Valor original restaurado`);
            
            db.close();
            console.log('\n✅ Teste de edição concluído!\n');
            resolve({ 
                success: updateSuccess, 
                originalTotal: row.total, 
                newTotal: novoTotal, 
                persistedTotal: totalPersistido 
            });
            
        } catch (error) {
            console.error('❌ Erro durante teste de edição:', error.message);
            reject(error);
        }
    });
}

// Função principal
async function runCompleteTest() {
    try {
        // 1. Verificar dados atuais
        const originalData = await checkCurrentData();
        
        // 2. Executar backup
        await executeBackup();
        
        // 3. Executar restauração
        await executeRestore();
        
        // 4. Verificar dados após restauração
        const verificationResults = await verifyDataAfterRestore(originalData);
        
        // 5. Testar edição de orçamentos
        const editingResults = await testBudgetEditing();
        
        // 6. Gerar relatório final
        console.log('📊 ===== RELATÓRIO FINAL DO TESTE =====');
        console.log('');
        console.log('🔍 RESULTADOS DA VERIFICAÇÃO:');
        if (verificationResults.issues.length === 0) {
            console.log('   ✅ Todos os dados foram preservados corretamente!');
        } else {
            console.log('   ❌ Problemas encontrados:');
            verificationResults.issues.forEach(issue => {
                console.log(`      • ${issue}`);
            });
        }
        
        console.log('');
        console.log('✏️ RESULTADOS DO TESTE DE EDIÇÃO:');
        if (editingResults.success) {
            console.log('   ✅ Funcionalidade de edição está funcionando corretamente!');
        } else {
            console.log('   ❌ Problemas na funcionalidade de edição detectados!');
        }
        
        console.log('');
        console.log('🎯 CONCLUSÃO GERAL:');
        const allTestsPassed = verificationResults.issues.length === 0 && editingResults.success;
        if (allTestsPassed) {
            console.log('   🎉 TODOS OS TESTES PASSARAM! O sistema de backup/restauração está funcionando corretamente.');
        } else {
            console.log('   ⚠️ ALGUNS TESTES FALHARAM. Verifique os problemas relatados acima.');
        }
        
        console.log('');
        console.log('===== FIM DO TESTE =====');
        
    } catch (error) {
        console.error('❌ Erro durante o teste:', error.message);
        process.exit(1);
    }
}

// Executar o teste
runCompleteTest();