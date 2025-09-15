const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Caminho para o banco de dados atual
const dbPath = path.join(__dirname, '..', 'Banco de dados Aqui', 'erp.sqlite');

console.log('🔍 INVESTIGAÇÃO DO BANCO DE DADOS');
console.log('='.repeat(50));
console.log(`📍 Localização: ${dbPath}`);
console.log(`📁 Arquivo existe: ${fs.existsSync(dbPath) ? 'SIM' : 'NÃO'}`);
console.log('');

let db;
try {
    db = new Database(dbPath);
    console.log('✅ Conectado ao banco de dados SQLite');
    console.log('');
} catch (err) {
    console.error('❌ Erro ao conectar com o banco:', err.message);
    process.exit(1);
}

// Função para listar todas as tabelas
function listTables() {
    try {
        const stmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table'");
        const rows = stmt.all();
        return rows.map(row => row.name);
    } catch (err) {
        throw err;
    }
}

// Função para contar registros em uma tabela
function countRecords(tableName) {
    try {
        const stmt = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`);
        const row = stmt.get();
        return row.count;
    } catch (err) {
        throw err;
    }
}

// Função para obter informações sobre colunas de uma tabela
function getTableInfo(tableName) {
    try {
        const stmt = db.prepare(`PRAGMA table_info(${tableName})`);
        return stmt.all();
    } catch (err) {
        throw err;
    }
}

// Função para obter registros mais antigos e mais recentes
function getDateRange(tableName, dateColumn) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT 
                MIN(${dateColumn}) as oldest,
                MAX(${dateColumn}) as newest,
                COUNT(*) as total
            FROM ${tableName} 
            WHERE ${dateColumn} IS NOT NULL
        `;
        
        db.get(query, [], (err, row) => {
            if (err) {
                resolve({ oldest: null, newest: null, total: 0, error: err.message });
                return;
            }
            resolve(row);
        });
    });
}

// Função para obter alguns registros de exemplo
function getSampleRecords(tableName, limit = 3) {
    try {
        let stmt;
        try {
            stmt = db.prepare(`SELECT * FROM ${tableName} ORDER BY created_at DESC LIMIT ${limit}`);
            return stmt.all();
        } catch (err) {
            // Tentar sem ORDER BY se created_at não existir
            stmt = db.prepare(`SELECT * FROM ${tableName} LIMIT ${limit}`);
            return stmt.all();
        }
    } catch (err) {
        return [];
    }
}

async function investigateDatabase() {
    try {
        console.log('📋 LISTANDO TABELAS...');
        const tables = listTables();
        console.log(`Encontradas ${tables.length} tabelas:`);
        tables.forEach(table => console.log(`  - ${table}`));
        console.log('');

        console.log('📊 ANÁLISE DETALHADA POR TABELA:');
        console.log('='.repeat(50));

        for (const table of tables) {
            console.log(`\n🔍 Tabela: ${table}`);
            console.log('-'.repeat(30));
            
            try {
                // Contar registros
                const count = countRecords(table);
                console.log(`📈 Total de registros: ${count}`);
                
                if (count > 0) {
                    // Obter informações das colunas
                    const columns = getTableInfo(table);
                    const dateColumns = columns.filter(col => 
                        col.name.toLowerCase().includes('data') || 
                        col.name.toLowerCase().includes('date') ||
                        col.name.toLowerCase().includes('created') ||
                        col.name.toLowerCase().includes('updated')
                    );
                    
                    console.log(`📋 Colunas (${columns.length}): ${columns.map(c => c.name).join(', ')}`);
                    
                    // Verificar datas se houver colunas de data
                    if (dateColumns.length > 0) {
                        console.log('📅 Análise de datas:');
                        for (const dateCol of dateColumns) {
                            const dateRange = await getDateRange(table, dateCol.name);
                            if (dateRange.total > 0) {
                                console.log(`  ${dateCol.name}: ${dateRange.oldest} → ${dateRange.newest} (${dateRange.total} registros)`);
                            }
                        }
                    }
                    
                    // Mostrar alguns registros de exemplo
                    const samples = getSampleRecords(table, 2);
                    if (samples.length > 0) {
                        console.log('📝 Exemplos de registros:');
                        samples.forEach((record, index) => {
                            console.log(`  Registro ${index + 1}:`, JSON.stringify(record, null, 2).substring(0, 200) + '...');
                        });
                    }
                } else {
                    console.log('📭 Tabela vazia');
                }
                
            } catch (error) {
                console.log(`❌ Erro ao analisar tabela ${table}:`, error.message);
            }
        }
        
        console.log('\n' + '='.repeat(50));
        console.log('✅ INVESTIGAÇÃO CONCLUÍDA');
        
    } catch (error) {
        console.error('❌ Erro durante a investigação:', error);
    } finally {
        db.close();
        console.log('🔒 Conexão com banco fechada');
    }
}

// Executar investigação
investigateDatabase();