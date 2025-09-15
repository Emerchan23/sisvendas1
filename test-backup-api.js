const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const { join } = require('path');
const fs = require('fs');

// Configurações
const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-muito-segura-aqui';
const API_URL = 'http://localhost:3145/api/backup/import';
const dbPath = join(process.cwd(), '..', 'Banco de dados Aqui', 'erp.sqlite');

// Conectar ao banco
let db;
try {
  db = new Database(dbPath);
  console.log('✅ Conectado ao banco de dados');
} catch (error) {
  console.error('❌ Erro ao conectar ao banco:', error.message);
  process.exit(1);
}

// Verificar se existe usuário ativo
const existingUser = db.prepare('SELECT * FROM usuarios WHERE ativo = 1 LIMIT 1').get();

let userId;
if (existingUser) {
  console.log('👤 Usuário existente encontrado:', existingUser.nome);
  userId = existingUser.id;
} else {
  // Criar usuário de teste
  console.log('👤 Criando usuário de teste...');
  userId = 'test-user-' + Date.now();
  
  const insertUser = db.prepare(`
    INSERT INTO usuarios (id, nome, email, senha, role, ativo, permissoes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  insertUser.run(
    userId,
    'Usuário Teste',
    'teste@exemplo.com',
    'senha-hash-teste',
    'admin',
    1,
    JSON.stringify({ backup: true, admin: true })
  );
  
  console.log('✅ Usuário de teste criado com ID:', userId);
}

// Gerar token JWT válido
const payload = {
  userId: userId,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hora
};

const token = jwt.sign(payload, JWT_SECRET);
console.log('🔑 Token JWT gerado para usuário:', userId);

// Criar dados de backup de teste
const backupData = {
  data: {
    clientes: [
      {
        id: 'cliente-backup-test-' + Date.now(),
        nome: 'Cliente Teste Backup',
        cpf_cnpj: '12345678901',
        telefone: '11999999999',
        email: 'teste@backup.com',
        endereco: 'Rua Teste, 123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
  }
};

// Função para testar a API
async function testBackupAPI() {
  try {
    console.log('\n📤 Testando API de backup...');
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(backupData)
    });
    
    console.log('📊 Status da resposta:', response.status);
    
    const responseData = await response.text();
    console.log('📊 Dados da resposta:', responseData);
    
    if (response.ok) {
      console.log('✅ API de backup funcionando corretamente!');
      
      // Verificar se o cliente foi inserido
      const clienteInserido = db.prepare('SELECT * FROM clientes WHERE nome = ?').get('Cliente Teste Backup');
      if (clienteInserido) {
        console.log('✅ Cliente de teste foi inserido no banco:', clienteInserido.nome);
        
        // Limpar dados de teste
        db.prepare('DELETE FROM clientes WHERE id = ?').run(clienteInserido.id);
        console.log('🧹 Dados de teste removidos');
      }
      
      return true;
    } else {
      console.log('❌ API de backup retornou erro:', response.status);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar API:', error.message);
    return false;
  }
}

// Executar teste
testBackupAPI().then(success => {
  // Fechar conexão com banco
  db.close();
  
  if (success) {
    console.log('\n🎉 Teste da API de backup concluído com sucesso!');
    console.log('✅ O botão "Importar Backup" deveria funcionar corretamente.');
  } else {
    console.log('\n💥 Teste da API de backup falhou!');
    console.log('❌ O botão "Importar Backup" não está funcionando.');
  }
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Erro fatal:', error);
  if (db) db.close();
  process.exit(1);
});