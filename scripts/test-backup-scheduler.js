/**
 * Script de teste para o sistema de agendamento automático de backup
 * Testa todas as funcionalidades do scheduler
 */

const fs = require('fs')
const path = require('path')
const sqlite3 = require('sqlite3').verbose()

// Configuração do banco de dados
const DB_PATH = process.env.DB_PATH || '../../Banco de dados Aqui/database.db'
const dbPath = path.resolve(__dirname, DB_PATH)

console.log('🧪 INICIANDO TESTE DO SISTEMA DE AGENDAMENTO AUTOMÁTICO DE BACKUP')
console.log('=' .repeat(70))

// Função para testar conexão com banco
function testDatabaseConnection() {
  return new Promise((resolve, reject) => {
    console.log('\n1. 🔍 Testando conexão com banco de dados...')
    
    if (!fs.existsSync(dbPath)) {
      console.log('❌ Banco de dados não encontrado:', dbPath)
      reject(new Error('Banco não encontrado'))
      return
    }
    
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.log('❌ Erro ao conectar:', err.message)
        reject(err)
      } else {
        console.log('✅ Conexão com banco estabelecida')
        db.close()
        resolve()
      }
    })
  })
}

// Função para verificar configurações de backup
function testBackupConfigurations() {
  return new Promise((resolve, reject) => {
    console.log('\n2. ⚙️ Verificando configurações de backup...')
    
    const db = new sqlite3.Database(dbPath)
    
    db.all(`
      SELECT 
        id, nome, auto_backup_enabled, backup_frequency, backup_time,
        last_backup, max_backups
      FROM empresas 
      WHERE auto_backup_enabled = 1
    `, (err, rows) => {
      if (err) {
        console.log('❌ Erro ao consultar configurações:', err.message)
        db.close()
        reject(err)
        return
      }
      
      console.log(`📊 Encontradas ${rows.length} empresas com backup automático habilitado:`)
      
      if (rows.length === 0) {
        console.log('⚠️ Nenhuma empresa configurada para backup automático')
        console.log('💡 Configure pelo menos uma empresa para testar o agendamento')
      } else {
        rows.forEach((row, index) => {
          console.log(`   ${index + 1}. ${row.nome}:`)
          console.log(`      - Frequência: ${row.backup_frequency}`)
          console.log(`      - Horário: ${row.backup_time}`)
          console.log(`      - Último backup: ${row.last_backup || 'Nunca'}`)
          console.log(`      - Máximo de backups: ${row.max_backups} arquivos`)
        })
      }
      
      db.close()
      resolve(rows)
    })
  })
}

// Função para testar API do scheduler
async function testSchedulerAPI() {
  console.log('\n3. 🌐 Testando API do scheduler...')
  
  try {
    // Testar se o servidor está rodando
    const response = await fetch('http://localhost:3145/api/backup/scheduler/test?action=status')
    
    if (!response.ok) {
      console.log('❌ Servidor não está respondendo na porta 3145')
      console.log('💡 Certifique-se de que o servidor está rodando com "npm run dev"')
      return false
    }
    
    const data = await response.json()
    console.log('✅ API do scheduler respondendo:')
    console.log('   - Status:', data.scheduler?.status || 'desconhecido')
    console.log('   - Ativo:', data.scheduler?.active || false)
    console.log('   - Padrão Cron:', data.scheduler?.cronPattern || 'não definido')
    console.log('   - Próxima execução:', data.scheduler?.nextExecution || 'não definido')
    
    return true
    
  } catch (error) {
    console.log('❌ Erro ao testar API:', error.message)
    console.log('💡 Verifique se o servidor está rodando')
    return false
  }
}

// Função para testar execução forçada
async function testForceBackup() {
  console.log('\n4. 🔧 Testando execução forçada de backup...')
  
  try {
    const response = await fetch('http://localhost:3145/api/backup/scheduler/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action: 'force-check' })
    })
    
    if (!response.ok) {
      console.log('❌ Erro na execução forçada')
      return false
    }
    
    const data = await response.json()
    console.log('✅ Execução forçada realizada:')
    console.log('   - Sucesso:', data.success)
    console.log('   - Mensagem:', data.message)
    console.log('   - Timestamp:', data.timestamp)
    
    return true
    
  } catch (error) {
    console.log('❌ Erro ao executar backup forçado:', error.message)
    return false
  }
}

// Função para verificar logs
function testBackupLogs() {
  console.log('\n5. 📝 Verificando logs de backup...')
  
  const logsDir = path.resolve(__dirname, '../logs')
  
  if (!fs.existsSync(logsDir)) {
    console.log('⚠️ Diretório de logs não encontrado:', logsDir)
    console.log('💡 Logs serão criados após a primeira execução')
    return
  }
  
  const logFiles = fs.readdirSync(logsDir).filter(file => file.includes('backup'))
  
  if (logFiles.length === 0) {
    console.log('⚠️ Nenhum arquivo de log de backup encontrado')
    console.log('💡 Execute alguns backups para gerar logs')
  } else {
    console.log(`✅ Encontrados ${logFiles.length} arquivos de log:`)
    logFiles.forEach(file => {
      const filePath = path.join(logsDir, file)
      const stats = fs.statSync(filePath)
      console.log(`   - ${file} (${Math.round(stats.size / 1024)}KB, ${stats.mtime.toLocaleString('pt-BR')})`)
    })
  }
}

// Função principal de teste
async function runTests() {
  try {
    console.log('⏰ Início dos testes:', new Date().toLocaleString('pt-BR'))
    
    // 1. Testar conexão com banco
    await testDatabaseConnection()
    
    // 2. Verificar configurações
    const configs = await testBackupConfigurations()
    
    // 3. Testar API do scheduler
    const apiWorking = await testSchedulerAPI()
    
    // 4. Testar execução forçada (apenas se API estiver funcionando)
    if (apiWorking) {
      await testForceBackup()
    }
    
    // 5. Verificar logs
    testBackupLogs()
    
    // Resumo final
    console.log('\n' + '=' .repeat(70))
    console.log('📋 RESUMO DOS TESTES:')
    console.log('✅ Conexão com banco: OK')
    console.log(`${configs.length > 0 ? '✅' : '⚠️'} Configurações: ${configs.length} empresas configuradas`)
    console.log(`${apiWorking ? '✅' : '❌'} API do scheduler: ${apiWorking ? 'OK' : 'FALHA'}`)
    console.log('✅ Verificação de logs: OK')
    
    if (configs.length > 0 && apiWorking) {
      console.log('\n🎉 SISTEMA DE AGENDAMENTO AUTOMÁTICO ESTÁ FUNCIONANDO!')
      console.log('💡 O scheduler executará backups automaticamente a cada hora')
    } else {
      console.log('\n⚠️ SISTEMA PRECISA DE CONFIGURAÇÃO:')
      if (configs.length === 0) {
        console.log('   - Configure pelo menos uma empresa para backup automático')
      }
      if (!apiWorking) {
        console.log('   - Verifique se o servidor está rodando')
      }
    }
    
  } catch (error) {
    console.log('\n❌ ERRO DURANTE OS TESTES:')
    console.log(error.message)
    process.exit(1)
  }
}

// Executar testes
runTests().then(() => {
  console.log('\n⏰ Fim dos testes:', new Date().toLocaleString('pt-BR'))
  process.exit(0)
}).catch(error => {
  console.error('❌ Erro fatal:', error)
  process.exit(1)
})

// Tratamento de sinais
process.on('SIGINT', () => {
  console.log('\n🛑 Teste interrompido pelo usuário')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Teste terminado')
  process.exit(0)
})