const fs = require('fs');
const path = require('path');

console.log('🧪 Testando funcionalidade completa de importação de backup...');

// Função para fazer requisições HTTP
function makeRequest(method, url, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const http = require('http');
    const urlParts = new URL(`http://localhost:3145${url}`);
    
    const options = {
      hostname: urlParts.hostname,
      port: urlParts.port,
      path: urlParts.pathname + urlParts.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const data = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
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

// Dados de backup de teste
const testBackupData = {
  version: 1,
  timestamp: new Date().toISOString(),
  data: {
    clientes: [
      {
        id: '999-test-backup-client',
        nome: 'Cliente Teste Backup Import',
        email: 'teste.backup@email.com',
        telefone: '(11) 99999-9999',
        cpf_cnpj: '123.456.789-01',
        endereco: 'Rua Teste, 123',
        empresa_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    produtos: [
      {
        id: '999-test-backup-product',
        nome: 'Produto Teste Backup',
        descricao: 'Produto para teste de backup',
        marca: 'Teste',
        preco: 99.99,
        custo: 50.00,
        taxa_imposto: 0,
        modalidade_venda: null,
        estoque: 10,
        link_ref: null,
        custo_ref: null,
        categoria: 'Teste',
        empresa_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
  }
};

async function testBackupImportFunctionality() {
  try {
    console.log('\n🔐 1. Fazendo login para obter token...');
    const loginResponse = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@sistema.com',
      senha: 'admin123'
    });
    
    if (loginResponse.status !== 200) {
      console.error('  ❌ Erro no login:', loginResponse.data);
      return false;
    }
    
    const token = loginResponse.data.token;
    console.log('  ✅ Login realizado com sucesso');
    
    const authHeaders = {
      'Authorization': `Bearer ${token}`
    };
    
    console.log('\n📤 2. Testando importação de backup...');
    const importResponse = await makeRequest('POST', '/api/backup/import', testBackupData, authHeaders);
    
    console.log('  📊 Status da resposta:', importResponse.status);
    console.log('  📊 Dados da resposta:', importResponse.data);
    
    if (importResponse.status === 200) {
      console.log('  ✅ Backup importado com sucesso!');
      
      // Verificar se os dados foram realmente importados
      console.log('\n🔍 3. Verificando dados importados...');
      
      // Verificar cliente
      const clientesResponse = await makeRequest('GET', '/api/clientes', null, authHeaders);
      if (clientesResponse.status === 200) {
        const clienteImportado = clientesResponse.data.find(c => c.nome === 'Cliente Teste Backup Import');
        if (clienteImportado) {
          console.log('  ✅ Cliente do backup encontrado na base de dados');
          console.log('    📋 Nome:', clienteImportado.nome);
          console.log('    📋 Email:', clienteImportado.email);
        } else {
          console.log('  ❌ Cliente do backup NÃO encontrado na base de dados');
          return false;
        }
      } else {
        console.log('  ❌ Erro ao verificar clientes:', clientesResponse.data);
        return false;
      }
      
      // Verificar produto
      const produtosResponse = await makeRequest('GET', '/api/produtos', null, authHeaders);
      if (produtosResponse.status === 200) {
        const produtoImportado = produtosResponse.data.find(p => p.nome === 'Produto Teste Backup');
        if (produtoImportado) {
          console.log('  ✅ Produto do backup encontrado na base de dados');
          console.log('    📋 Nome:', produtoImportado.nome);
          console.log('    📋 Preço:', produtoImportado.preco);
        } else {
          console.log('  ❌ Produto do backup NÃO encontrado na base de dados');
          return false;
        }
      } else {
        console.log('  ❌ Erro ao verificar produtos:', produtosResponse.data);
        return false;
      }
      
      return true;
    } else {
      console.log('  ❌ Erro na importação do backup');
      console.log('    📋 Status:', importResponse.status);
      console.log('    📋 Erro:', importResponse.data);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    return false;
  }
}

// Executar teste
testBackupImportFunctionality().then(success => {
  if (success) {
    console.log('\n🎉 Teste de importação de backup concluído com SUCESSO!');
    console.log('✅ A funcionalidade "Importar Backup" está funcionando corretamente.');
    console.log('✅ Dados foram importados e verificados na base de dados.');
  } else {
    console.log('\n💥 Teste de importação de backup FALHOU!');
    console.log('❌ A funcionalidade "Importar Backup" apresenta problemas.');
    console.log('🔧 Verifique os logs acima para identificar o problema.');
  }
  
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Erro fatal durante o teste:', error);
  process.exit(1);
});