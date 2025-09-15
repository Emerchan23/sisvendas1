const http = require('http');
const fs = require('fs');

console.log('🧪 Testando funcionalidade de importação de backup...');

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

    const req = http.request(options, (res) => {
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

async function testBackupImport() {
  try {
    console.log('\n🔐 1. Fazendo login...');
    const loginResponse = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@sistema.com',
      senha: 'admin123'
    });
    
    if (loginResponse.status === 200 && loginResponse.data.token) {
      authToken = loginResponse.data.token;
      console.log('  ✅ Login realizado com sucesso');
    } else {
      console.log('  ❌ Falha no login:', loginResponse.status, loginResponse.data);
      return;
    }

    const authHeaders = { 'Authorization': `Bearer ${authToken}` };

    console.log('\n📂 2. Carregando arquivo de backup...');
    
    let backupData;
    try {
      const backupContent = fs.readFileSync('./test-backup.json', 'utf8');
      backupData = JSON.parse(backupContent);
      console.log('  ✅ Arquivo de backup carregado com sucesso');
      console.log(`  📊 Clientes no backup: ${backupData.data.clientes.length}`);
      console.log(`  📦 Produtos no backup: ${backupData.data.produtos.length}`);
    } catch (error) {
      console.log('  ❌ Erro ao carregar arquivo de backup:', error.message);
      return;
    }

    console.log('\n💾 3. Testando importação de backup...');
    
    const importResponse = await makeRequest('POST', '/api/backup/import', backupData, authHeaders);
    
    console.log('  📡 Status da resposta:', importResponse.status);
    console.log('  📄 Dados da resposta:', importResponse.data);
    
    if (importResponse.status === 200) {
      console.log('  ✅ Backup importado com sucesso!');
      
      // Verificar se os dados foram realmente importados
      console.log('\n🔍 4. Verificando dados importados...');
      
      const clientesResponse = await makeRequest('GET', '/api/clientes', null, authHeaders);
      if (clientesResponse.status === 200) {
        const clienteImportado = clientesResponse.data.find(c => c.nome === 'Cliente Teste Backup');
        if (clienteImportado) {
          console.log('  ✅ Cliente do backup encontrado na base de dados');
        } else {
          console.log('  ⚠️ Cliente do backup não encontrado na base de dados');
        }
      }
      
      const produtosResponse = await makeRequest('GET', '/api/produtos', null, authHeaders);
      if (produtosResponse.status === 200) {
        const produtoImportado = produtosResponse.data.find(p => p.nome === 'Produto Teste Backup');
        if (produtoImportado) {
          console.log('  ✅ Produto do backup encontrado na base de dados');
        } else {
          console.log('  ⚠️ Produto do backup não encontrado na base de dados');
        }
      }
      
    } else {
      console.log('  ❌ Falha na importação de backup');
      console.log('  🔍 Detalhes do erro:', importResponse.data);
    }

    console.log('\n✅ Teste de importação de backup concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

testBackupImport();