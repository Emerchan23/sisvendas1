// Teste simples para verificar a API de modalidades
const http = require('http');

async function testModalidadesAPI() {
  console.log('🧪 Testando API de modalidades...');
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3145,
      path: '/api/modalidades-compra',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = http.request(options, (res) => {
      console.log(`📊 Status da resposta: ${res.statusCode}`);
      
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const modalidades = JSON.parse(data);
          console.log('✅ Modalidades carregadas com sucesso!');
          console.log(`📈 Total de modalidades: ${modalidades.length}`);
          console.log('📦 Dados:', modalidades);
          resolve(modalidades);
        } catch (error) {
          console.error('❌ Erro ao fazer parse dos dados:', error);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Erro na requisição:', error);
      reject(error);
    });
    
    req.end();
  });
}

testModalidadesAPI().catch(console.error);