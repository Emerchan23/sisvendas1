const fs = require('fs')
const path = require('path')
const os = require('os')

function diagnoseSystem() {
  console.log('🔍 Diagnóstico do Sistema ERP-BR\n')
  console.log('=' .repeat(50))
  
  // 1. Informações do sistema
  console.log('\n📊 INFORMAÇÕES DO SISTEMA:')
  console.log(`✅ Node.js: ${process.version}`)
  console.log(`✅ Plataforma: ${os.platform()} ${os.arch()}`)
  console.log(`✅ Diretório atual: ${process.cwd()}`)
  console.log(`✅ Usuário: ${os.userInfo().username}`)
  
  // 2. Verificar variáveis de ambiente
  console.log('\n🔧 VARIÁVEIS DE AMBIENTE:')
  console.log(`DB_PATH: ${process.env.DB_PATH || 'não definido (usando padrão)'}`)
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'não definido'}`)
  console.log(`PORT: ${process.env.PORT || '3145 (padrão)'}`)
  
  // 3. Verificar caminho do banco
  const dbPath = process.env.DB_PATH || path.join(process.cwd(), '..', 'Banco de dados Aqui', 'erp.sqlite')
  console.log('\n💾 BANCO DE DADOS:')
  console.log(`📁 Caminho do banco: ${dbPath}`)
  
  // 4. Verificar diretório e permissões
  const dir = path.dirname(dbPath)
  console.log(`📁 Diretório do banco: ${dir}`)
  
  try {
    // Verificar se diretório existe
    if (!fs.existsSync(dir)) {
      console.log(`⚠️  Diretório não existe, tentando criar...`)
      fs.mkdirSync(dir, { recursive: true })
      console.log(`✅ Diretório criado: ${dir}`)
    } else {
      console.log(`✅ Diretório existe: ${dir}`)
    }
    
    // Verificar permissões de escrita
    const testFile = path.join(dir, '.test-write-permission')
    fs.writeFileSync(testFile, 'test de permissão')
    fs.unlinkSync(testFile)
    console.log('✅ Permissões de escrita: OK')
    
    // Verificar se banco existe
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath)
      console.log(`✅ Arquivo do banco existe (${(stats.size / 1024).toFixed(2)} KB)`)
    } else {
      console.log(`⚠️  Arquivo do banco não existe (será criado na primeira execução)`)
    }
    
  } catch (error) {
    console.log(`❌ Erro de permissões: ${error.message}`)
    console.log('\n🔧 POSSÍVEIS SOLUÇÕES:')
    console.log('1. Execute como administrador')
    console.log('2. Verifique permissões da pasta')
    console.log('3. Use uma pasta diferente com DB_PATH')
    return false
  }
  
  // 5. Testar conexão com banco (se better-sqlite3 estiver disponível)
  try {
    const Database = require('better-sqlite3')
    console.log('\n🔌 TESTE DE CONEXÃO:')
    
    const db = new Database(dbPath)
    console.log('✅ Conexão com banco: OK')
    
    // Testar operações básicas
    db.exec('CREATE TABLE IF NOT EXISTS test_diagnose (id INTEGER PRIMARY KEY, data TEXT)')
    const insert = db.prepare('INSERT INTO test_diagnose (data) VALUES (?)')
    const result = insert.run('teste de diagnóstico')
    console.log(`✅ Inserção de dados: OK (ID: ${result.lastInsertRowid})`)
    
    const select = db.prepare('SELECT * FROM test_diagnose WHERE id = ?')
    const row = select.get(result.lastInsertRowid)
    console.log(`✅ Leitura de dados: OK (${row.data})`)
    
    // Limpar teste
    db.exec('DROP TABLE test_diagnose')
    db.close()
    console.log('✅ Limpeza e fechamento: OK')
    
  } catch (error) {
    console.log(`❌ Erro de conexão com banco: ${error.message}`)
    console.log('\n🔧 POSSÍVEIS SOLUÇÕES:')
    console.log('1. Instale as dependências: npm install')
    console.log('2. Verifique se better-sqlite3 está instalado')
    console.log('3. Recompile módulos nativos: npm rebuild')
    return false
  }
  
  // 6. Verificar arquivos importantes
  console.log('\n📄 ARQUIVOS DO PROJETO:')
  const importantFiles = [
    'package.json',
    'next.config.mjs',
    'lib/db.ts',
    'middleware.ts',
    '.env.local'
  ]
  
  importantFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file)
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file}: existe`)
    } else {
      console.log(`⚠️  ${file}: não encontrado`)
    }
  })
  
  // 7. Verificar portas
  console.log('\n🌐 CONFIGURAÇÃO DE REDE:')
  const port = process.env.PORT || 3145
  console.log(`✅ Porta configurada: ${port}`)
  console.log(`✅ URL local: http://localhost:${port}`)
  
  // Tentar detectar IP da máquina
  const networkInterfaces = os.networkInterfaces()
  console.log('\n🔗 IPs DISPONÍVEIS:')
  Object.keys(networkInterfaces).forEach(interfaceName => {
    const interfaces = networkInterfaces[interfaceName]
    interfaces.forEach(iface => {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`✅ ${interfaceName}: http://${iface.address}:${port}`)
      }
    })
  })
  
  console.log('\n' + '=' .repeat(50))
  console.log('🎉 DIAGNÓSTICO CONCLUÍDO!')
  console.log('\n📋 RESUMO:')
  console.log('✅ Sistema operacional: OK')
  console.log('✅ Node.js: OK')
  console.log('✅ Permissões de arquivo: OK')
  console.log('✅ Banco de dados: OK')
  console.log('\n🚀 O sistema está pronto para uso!')
  
  return true
}

// Função para mostrar ajuda
function showHelp() {
  console.log('\n🆘 AJUDA - Script de Diagnóstico ERP-BR')
  console.log('\nUso:')
  console.log('  node scripts/diagnose.js          - Executar diagnóstico completo')
  console.log('  node scripts/diagnose.js --help   - Mostrar esta ajuda')
  console.log('\nO que este script verifica:')
  console.log('• Versão do Node.js e informações do sistema')
  console.log('• Variáveis de ambiente importantes')
  console.log('• Permissões de arquivo e diretório')
  console.log('• Conectividade com banco de dados SQLite')
  console.log('• Arquivos importantes do projeto')
  console.log('• Configuração de rede e IPs disponíveis')
  console.log('\nEm caso de problemas:')
  console.log('1. Execute como administrador')
  console.log('2. Verifique se todas as dependências estão instaladas')
  console.log('3. Configure DB_PATH se necessário')
}

// Executar diagnóstico se chamado diretamente
if (require.main === module) {
  const args = process.argv.slice(2)
  
  if (args.includes('--help') || args.includes('-h')) {
    showHelp()
  } else {
    try {
      diagnoseSystem()
    } catch (error) {
      console.error('❌ Erro durante diagnóstico:', error.message)
      process.exit(1)
    }
  }
}

module.exports = { diagnoseSystem, showHelp }