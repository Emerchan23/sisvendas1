const http = require('http');
const https = require('https');
const { URL } = require('url');

const BASE_URL = 'http://localhost:3145';

// Lista de rotas da API para testar
const API_ROUTES = [
  // Rotas básicas
  { method: 'GET', path: '/api/basic', description: 'API básica' },
  { method: 'GET', path: '/api/simple', description: 'API simples' },
  { method: 'GET', path: '/api/test', description: 'API de teste' },
  
  // Clientes
  { method: 'GET', path: '/api/clientes', description: 'Listar clientes' },
  { method: 'POST', path: '/api/clientes', description: 'Criar cliente', body: { nome: 'Cliente Teste', cpf_cnpj: '12345678901', telefone: '11999999999' } },
  
  // Vendas
  { method: 'GET', path: '/api/vendas', description: 'Listar vendas' },
  
  // Fornecedores
  { method: 'GET', path: '/api/fornecedores', description: 'Listar fornecedores' },
  
  // Usuários
  { method: 'GET', path: '/api/usuarios', description: 'Listar usuários' },
  
  // Modalidades de compra
  { method: 'GET', path: '/api/modalidades-compra', description: 'Modalidades de compra' },
  
  // Outros negócios
  { method: 'GET', path: '/api/outros-negocios', description: 'Outros negócios' },
  
  // Preferências do usuário
  { method: 'GET', path: '/api/user-prefs', description: 'Preferências do usuário' }
];

function makeRequest(method, url, data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'API-Test-Script'
      }
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : null;
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: jsonBody
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testAPIRoutes() {
  console.log('🚀 INICIANDO TESTES DAS ROTAS DA API');
  console.log('=' .repeat(50));
  
  const results = [];
  let passedTests = 0;
  let failedTests = 0;
  
  for (const route of API_ROUTES) {
    try {
      console.log(`\n📡 Testando: ${route.method} ${route.path}`);
      console.log(`   Descrição: ${route.description}`);
      
      const response = await makeRequest(route.method, `${BASE_URL}${route.path}`, route.body);
      
      const success = response.status >= 200 && response.status < 400;
      
      if (success) {
        console.log(`   ✅ SUCESSO - Status: ${response.status}`);
        passedTests++;
      } else {
        console.log(`   ❌ FALHA - Status: ${response.status}`);
        failedTests++;
      }
      
      // Mostrar dados retornados (limitado)
      if (response.body && typeof response.body === 'object') {
        if (Array.isArray(response.body)) {
          console.log(`   📊 Dados: Array com ${response.body.length} itens`);
        } else {
          console.log(`   📊 Dados: ${JSON.stringify(response.body).substring(0, 100)}...`);
        }
      } else if (response.body) {
        console.log(`   📊 Dados: ${response.body.substring(0, 100)}...`);
      }
      
      results.push({
        route: `${route.method} ${route.path}`,
        description: route.description,
        status: response.status,
        success: success,
        hasData: !!response.body
      });
      
    } catch (error) {
      console.log(`   ❌ ERRO: ${error.message}`);
      failedTests++;
      results.push({
        route: `${route.method} ${route.path}`,
        description: route.description,
        status: 'ERROR',
        success: false,
        error: error.message
      });
    }
    
    // Pequena pausa entre requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('📋 RESUMO DOS TESTES DAS APIS');
  console.log('=' .repeat(50));
  console.log(`✅ Testes bem-sucedidos: ${passedTests}`);
  console.log(`❌ Testes falharam: ${failedTests}`);
  console.log(`📊 Total de testes: ${results.length}`);
  
  if (failedTests > 0) {
    console.log('\n❌ ROTAS COM PROBLEMAS:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.route}: ${r.error || `Status ${r.status}`}`);
    });
  }
  
  console.log('\n✅ ROTAS FUNCIONANDO:');
  results.filter(r => r.success).forEach(r => {
    console.log(`   - ${r.route}: Status ${r.status} ${r.hasData ? '(com dados)' : '(sem dados)'}`);
  });
  
  return {
    total: results.length,
    passed: passedTests,
    failed: failedTests,
    results: results
  };
}

// Executar os testes
testAPIRoutes()
  .then(summary => {
    console.log('\n🎯 TESTE DE APIS CONCLUÍDO!');
    process.exit(summary.failed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('❌ Erro fatal nos testes:', error);
    process.exit(1);
  });