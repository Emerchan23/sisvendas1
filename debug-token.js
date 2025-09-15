const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const { join } = require('path');
require('dotenv').config({ path: '.env.local' });

// Configurações - usar a mesma chave do servidor
const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-muito-segura-aqui';
const dbPath = join(process.cwd(), '..', 'Banco de dados Aqui', 'erp.sqlite');

console.log('🔐 JWT_SECRET sendo usado:', JWT_SECRET);

// Conectar ao banco
const db = new Database(dbPath);

// Buscar usuário existente
const usuario = db.prepare('SELECT * FROM usuarios WHERE ativo = 1 LIMIT 1').get();
console.log('👤 Usuário encontrado:', usuario.nome, '- ID:', usuario.id);

if (!usuario) {
  console.log('❌ Nenhum usuário ativo encontrado');
  process.exit(1);
}

// Gerar token
const payload = {
  userId: usuario.id,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (60 * 60)
};

console.log('📋 Payload do token:', payload);

const token = jwt.sign(payload, JWT_SECRET);
console.log('🔑 Token gerado:', token.substring(0, 50) + '...');

// Tentar decodificar o token
try {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('✅ Token decodificado com sucesso');
  
  // Verificar se usuário existe com o ID do token
  const usuarioVerificado = db.prepare(`
    SELECT id, nome, email, role, ativo, permissoes
    FROM usuarios 
    WHERE id = ? AND ativo = 1
  `).get(decoded.userId);
  
  if (usuarioVerificado) {
    console.log('✅ Validação completa bem-sucedida');
    
    // Testar a API com este token
    testAPI(token);
  } else {
    console.log('❌ Usuário não encontrado ou inativo');
  }
  
} catch (error) {
  console.log('❌ Erro ao decodificar token:', error.message);
}

async function testAPI(token) {
  try {
    console.log('\n🧪 Testando API com token válido...');
    
    const response = await fetch('http://localhost:3145/api/backup/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        data: {
          clientes: [{
            id: 'test-debug-' + Date.now(),
            nome: 'Cliente Teste Debug',
            cpf_cnpj: '12345678901',
            telefone: '11999999999',
            email: 'debug@teste.com',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]
        }
      })
    });
    
    console.log('📊 Status:', response.status);
    const responseText = await response.text();
    console.log('📊 Resposta:', responseText);
    
    if (response.ok) {
      console.log('\n🎉 API de backup funcionando corretamente!');
      console.log('✅ O problema do botão "Importar Backup" está resolvido!');
      
      // Verificar se o cliente foi inserido
      const clienteInserido = db.prepare('SELECT * FROM clientes WHERE nome = ?').get('Cliente Teste Debug');
      if (clienteInserido) {
        console.log('✅ Cliente foi inserido no banco:', clienteInserido.nome);
        
        // Limpar dados de teste
        db.prepare('DELETE FROM clientes WHERE id = ?').run(clienteInserido.id);
        console.log('🧹 Dados de teste removidos');
      }
    } else {
      console.log('\n❌ API ainda não está funcionando');
    }
    
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
  }
}

db.close();