const https = require('http');
const fs = require('fs');

console.log('🧪 Testando funcionalidades críticas do sistema...');

const baseUrl = 'http://localhost:3145';
let authToken = '';

// Função para fazer requisições HTTP
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3145,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonBody });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testFeatures() {
  try {
    console.log('\n🔐 1. Testando LOGIN...');
    const loginResponse = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@sistema.com',
      senha: 'admin123'
    });
    
    if (loginResponse.status === 200 && loginResponse.data.token) {
      authToken = loginResponse.data.token;
      console.log('  ✅ Login realizado com sucesso');
    } else {
      console.log('  ❌ Falha no login:', loginResponse.status);
      return;
    }

    const authHeaders = { 'Authorization': `Bearer ${authToken}` };

    console.log('\n👥 2. Testando CRUD de CLIENTES...');
    
    // CREATE Cliente
    const createClientResponse = await makeRequest('POST', '/api/clientes', {
      nome: 'Cliente Teste API',
      email: 'cliente.teste@api.com',
      telefone: '11987654321',
      endereco: 'Rua Teste, 123'
    }, authHeaders);
    
    if (createClientResponse.status === 201) {
      console.log('  ✅ Cliente criado com sucesso');
      
      // READ Clientes
      const readClientsResponse = await makeRequest('GET', '/api/clientes', null, authHeaders);
      if (readClientsResponse.status === 200) {
        console.log(`  ✅ Listagem de clientes: ${readClientsResponse.data.length || 0} encontrados`);
      } else {
        console.log('  ❌ Falha na listagem de clientes');
      }
    } else {
      console.log('  ❌ Falha na criação de cliente:', createClientResponse.status);
    }

    console.log('\n📦 3. Testando CRUD de PRODUTOS...');
    
    // READ Produtos
    const readProductsResponse = await makeRequest('GET', '/api/produtos', null, authHeaders);
    if (readProductsResponse.status === 200) {
      console.log(`  ✅ Listagem de produtos: ${readProductsResponse.data.length || 0} encontrados`);
    } else {
      console.log('  ❌ Falha na listagem de produtos');
    }

    console.log('\n💰 4. Testando VENDAS...');
    
    // READ Vendas
    const readSalesResponse = await makeRequest('GET', '/api/vendas', null, authHeaders);
    if (readSalesResponse.status === 200) {
      console.log(`  ✅ Listagem de vendas: ${readSalesResponse.data.length || 0} encontradas`);
    } else {
      console.log('  ❌ Falha na listagem de vendas');
    }

    console.log('\n📊 5. Testando RELATÓRIOS...');
    
    // Teste de relatório de vendas
    const reportResponse = await makeRequest('GET', '/api/relatorios/vendas?periodo=mes', null, authHeaders);
    if (reportResponse.status === 200) {
      console.log('  ✅ Relatório de vendas gerado com sucesso');
    } else {
      console.log('  ❌ Falha na geração de relatório:', reportResponse.status);
    }

    console.log('\n💾 6. Testando BACKUP...');
    
    // Teste de backup
    const backupResponse = await makeRequest('POST', '/backup/export', {}, authHeaders);
    if (backupResponse.status === 200) {
      console.log('  ✅ Backup gerado com sucesso');
    } else {
      console.log('  ❌ Falha na geração de backup:', backupResponse.status);
    }

    console.log('\n⚙️ 7. Testando CONFIGURAÇÕES...');
    
    // READ Configurações
    const configResponse = await makeRequest('GET', '/api/configuracoes', null, authHeaders);
    if (configResponse.status === 200) {
      console.log('  ✅ Configurações carregadas com sucesso');
    } else {
      console.log('  ❌ Falha no carregamento de configurações');
    }

    console.log('\n✅ Teste de funcionalidades críticas concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
  }
}

testFeatures();