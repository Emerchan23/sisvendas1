const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

console.log('🧪 Teste de Backup Manual');
console.log('========================\n');

// Configurações
const BASE_URL = 'http://localhost:3145';
const API_URL = `${BASE_URL}/api/backup`;

// Função para fazer login e obter token
async function getAuthToken() {
  try {
    console.log('🔐 Fazendo login para obter token...');
    
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@teste.com',
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Falha no login. Tentando com credenciais alternativas...');
      
      // Tentar com outras credenciais comuns
      const altLoginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'teste@teste.com',
          password: '123456'
        })
      });
      
      if (!altLoginResponse.ok) {
        console.log('❌ Login falhou com credenciais alternativas também');
        return null;
      }
      
      const altData = await altLoginResponse.json();
      console.log('✅ Login realizado com credenciais alternativas');
      return altData.token;
    }
    
    const data = await loginResponse.json();
    console.log('✅ Login realizado com sucesso');
    return data.token;
    
  } catch (error) {
    console.error('❌ Erro no login:', error.message);
    return null;
  }
}

// Função para testar exportação de backup
async function testBackupExport(token) {
  try {
    console.log('\n📤 Testando exportação de backup...');
    
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.log(`❌ Falha na exportação: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log('Erro:', errorText);
      return null;
    }
    
    const data = await response.json();
    
    if (data.success && data.backup) {
      console.log('✅ Backup exportado com sucesso!');
      console.log(`📊 Timestamp: ${data.backup.timestamp}`);
      console.log(`📊 Versão: ${data.backup.version}`);
      
      const tableCount = Object.keys(data.backup.data).length;
      console.log(`📊 Tabelas exportadas: ${tableCount}`);
      
      // Mostrar estatísticas das tabelas
      let totalRecords = 0;
      for (const [tableName, records] of Object.entries(data.backup.data)) {
        const recordCount = Array.isArray(records) ? records.length : 0;
        totalRecords += recordCount;
        if (recordCount > 0) {
          console.log(`  - ${tableName}: ${recordCount} registros`);
        }
      }
      
      console.log(`📊 Total de registros: ${totalRecords}`);
      
      // Salvar backup para teste de importação
      const backupPath = path.join(__dirname, 'backup-test.json');
      fs.writeFileSync(backupPath, JSON.stringify(data.backup, null, 2));
      console.log(`💾 Backup salvo em: ${backupPath}`);
      
      return data.backup;
    } else {
      console.log('❌ Resposta de backup inválida');
      return null;
    }
    
  } catch (error) {
    console.error('❌ Erro na exportação:', error.message);
    return null;
  }
}

// Função para testar importação de backup
async function testBackupImport(token, backupData) {
  try {
    console.log('\n📥 Testando importação de backup...');
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ backup: backupData })
    });
    
    if (!response.ok) {
      console.log(`❌ Falha na importação: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log('Erro:', errorText);
      return false;
    }
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Backup importado com sucesso!');
      console.log(`📊 Timestamp: ${data.timestamp}`);
      console.log(`📊 Mensagem: ${data.message}`);
      return true;
    } else {
      console.log('❌ Falha na importação');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erro na importação:', error.message);
    return false;
  }
}

// Função principal de teste
async function runBackupTest() {
  console.log('🚀 Iniciando teste de backup manual...\n');
  
  // 1. Obter token de autenticação
  const token = await getAuthToken();
  if (!token) {
    console.log('\n💥 Teste falhou: Não foi possível obter token de autenticação');
    return;
  }
  
  // 2. Testar exportação
  const backupData = await testBackupExport(token);
  if (!backupData) {
    console.log('\n💥 Teste falhou: Não foi possível exportar backup');
    return;
  }
  
  // 3. Testar importação
  const importSuccess = await testBackupImport(token, backupData);
  if (!importSuccess) {
    console.log('\n💥 Teste falhou: Não foi possível importar backup');
    return;
  }
  
  console.log('\n🎉 TESTE DE BACKUP MANUAL CONCLUÍDO COM SUCESSO!');
  console.log('✅ Exportação funcionando');
  console.log('✅ Importação funcionando');
  console.log('✅ Sistema de backup manual operacional');
}

// Executar teste
runBackupTest().catch(error => {
  console.error('\n💥 Erro geral no teste:', error.message);
});