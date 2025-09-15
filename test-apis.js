const axios = require('axios');
const Database = require('better-sqlite3');
const path = require('path');

// Configuração
const BASE_URL = 'http://localhost:3145';
const dbPath = path.join(__dirname, '..', 'Banco de dados Aqui', 'erp.sqlite');

async function testAPIs() {
    let db;
    
    try {
        console.log('🚀 Iniciando teste das APIs...');
        
        // Conectar ao banco
        db = new Database(dbPath);
        console.log('✅ Conectado ao banco de dados');
        
        const testResults = {
            health: false,
            clientes: false,
            vendas: false,
            configuracoes: false,
            orcamentos: false,
            fornecedores: false
        };
        
        // 1. TESTE DE HEALTH CHECK
        console.log('\n🏥 === TESTE DE HEALTH CHECK ===');
        testResults.health = await testHealthCheck();
        
        // 2. TESTE API CLIENTES
        console.log('\n👥 === TESTE API CLIENTES ===');
        testResults.clientes = await testClientesAPI();
        
        // 3. TESTE API VENDAS
        console.log('\n💰 === TESTE API VENDAS ===');
        testResults.vendas = await testVendasAPI();
        
        // 4. TESTE API CONFIGURAÇÕES
        console.log('\n⚙️ === TESTE API CONFIGURAÇÕES ===');
        testResults.configuracoes = await testConfiguracoesAPI();
        
        // 5. TESTE API ORÇAMENTOS
        console.log('\n📦 === TESTE API ORÇAMENTOS ===');
        testResults.orcamentos = await testOrcamentosAPI();
        
        // 6. TESTE API FORNECEDORES
        console.log('\n🏪 === TESTE API FORNECEDORES ===');
        testResults.fornecedores = await testFornecedoresAPI();
        
        // Relatório final
        console.log('\n🎉 === RELATÓRIO FINAL DAS APIs ===');
        let totalAPIs = Object.keys(testResults).length;
        let apisPassaram = Object.values(testResults).filter(r => r).length;
        
        console.log(`✅ APIs funcionando: ${apisPassaram}/${totalAPIs}`);
        
        Object.entries(testResults).forEach(([api, passou]) => {
            console.log(`${passou ? '✅' : '❌'} ${api.toUpperCase()}: ${passou ? 'FUNCIONANDO' : 'COM ERRO'}`);
        });
        
        if (apisPassaram === totalAPIs) {
            console.log('\n🎊 TODAS AS APIs ESTÃO FUNCIONANDO! Integração 100% OK!');
        } else {
            console.log(`\n⚠️ ${totalAPIs - apisPassaram} API(s) com problemas. Verificar logs acima.`);
        }
        
    } catch (error) {
        console.error('❌ Erro durante teste das APIs:', error.message);
    } finally {
        if (db) {
            db.close();
        }
    }
}

// Teste de health check
async function testHealthCheck() {
    try {
        const response = await axios.get(`${BASE_URL}/`, { timeout: 5000 });
        console.log(`✅ Health check OK - Status: ${response.status}`);
        return response.status === 200;
    } catch (error) {
        console.log(`❌ Health check falhou: ${error.message}`);
        return false;
    }
}

// Teste API Clientes
async function testClientesAPI() {
    try {
        // GET clientes
        const getResponse = await axios.get(`${BASE_URL}/api/clientes`, { timeout: 5000 });
        console.log(`✅ GET /api/clientes - Status: ${getResponse.status}`);
        
        // POST novo cliente (teste)
        const novoCliente = {
            nome: 'Cliente Teste API',
            email: 'teste@api.com',
            telefone: '11999999999'
        };
        
        try {
            const postResponse = await axios.post(`${BASE_URL}/api/clientes`, novoCliente, { timeout: 5000 });
            console.log(`✅ POST /api/clientes - Status: ${postResponse.status}`);
        } catch (postError) {
            console.log(`⚠️ POST /api/clientes não disponível: ${postError.response?.status || postError.message}`);
        }
        
        return getResponse.status === 200;
        
    } catch (error) {
        console.log(`❌ API Clientes falhou: ${error.message}`);
        return false;
    }
}

// Teste API Vendas
async function testVendasAPI() {
    try {
        const response = await axios.get(`${BASE_URL}/api/vendas`, { timeout: 5000 });
        console.log(`✅ GET /api/vendas - Status: ${response.status}`);
        return response.status === 200;
    } catch (error) {
        console.log(`❌ API Vendas falhou: ${error.message}`);
        return false;
    }
}

// Teste API Configurações
async function testConfiguracoesAPI() {
    try {
        const response = await axios.get(`${BASE_URL}/api/config`, { timeout: 5000 });
        console.log(`✅ GET /api/config - Status: ${response.status}`);
        return response.status === 200;
    } catch (error) {
        console.log(`❌ API Configurações falhou: ${error.message}`);
        return false;
    }
}

// Teste API Orçamentos
async function testOrcamentosAPI() {
    try {
        const response = await axios.get(`${BASE_URL}/api/orcamentos`, { timeout: 5000 });
        console.log(`✅ GET /api/orcamentos - Status: ${response.status}`);
        return response.status === 200;
    } catch (error) {
        console.log(`❌ API Orçamentos falhou: ${error.message}`);
        return false;
    }
}

// Teste API Fornecedores
async function testFornecedoresAPI() {
    try {
        const response = await axios.get(`${BASE_URL}/api/fornecedores`, { timeout: 5000 });
        console.log(`✅ GET /api/fornecedores - Status: ${response.status}`);
        return response.status === 200;
    } catch (error) {
        console.log(`❌ API Fornecedores falhou: ${error.message}`);
        return false;
    }
}

// Executar teste
testAPIs();