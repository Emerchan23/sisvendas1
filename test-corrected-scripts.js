const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔧 TESTANDO SCRIPTS CORRIGIDOS');
console.log('=' .repeat(60));

// Lista de scripts corrigidos para testar
const CORRECTED_SCRIPTS = [
  {
    name: 'check-correct-db.js',
    description: 'Verificação de correção do banco de dados',
    timeout: 10000
  },
  {
    name: 'init-database.js',
    description: 'Inicialização do banco de dados',
    timeout: 15000
  },
  {
    name: 'fix-user-permissions.js',
    description: 'Correção de permissões de usuário',
    timeout: 10000
  },
  {
    name: 'check-database-content.js',
    description: 'Verificação do conteúdo do banco',
    timeout: 10000
  },
  {
    name: 'test-interface-data.js',
    description: 'Teste de dados da interface',
    timeout: 10000
  }
];

function runScript(scriptPath, timeout = 10000) {
  return new Promise((resolve, reject) => {
    console.log(`\n🚀 Executando: ${path.basename(scriptPath)}`);
    console.log(`   Descrição: ${CORRECTED_SCRIPTS.find(s => s.name === path.basename(scriptPath))?.description || 'Script corrigido'}`);
    
    const child = spawn('node', [scriptPath], {
      cwd: path.dirname(scriptPath),
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    
    // Configurar timeout
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      reject(new Error(`Script timeout após ${timeout}ms`));
    }, timeout);
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      clearTimeout(timer);
      
      if (timedOut) return; // Já foi rejeitado pelo timeout
      
      resolve({
        code,
        stdout,
        stderr,
        success: code === 0
      });
    });
    
    child.on('error', (error) => {
      clearTimeout(timer);
      if (!timedOut) {
        reject(error);
      }
    });
  });
}

function analyzeOutput(output, scriptName) {
  const analysis = {
    hasErrors: output.stderr.length > 0,
    hasSuccess: output.stdout.includes('✅') || output.stdout.includes('SUCCESS') || output.stdout.includes('Sucesso'),
    hasWarnings: output.stdout.includes('⚠️') || output.stdout.includes('WARNING'),
    hasDbConnection: output.stdout.includes('Conectado') || output.stdout.includes('Connected') || output.stdout.includes('banco'),
    hasCorrectPath: output.stdout.includes('../Banco de dados Aqui/erp.sqlite') || output.stdout.includes('Banco de dados Aqui'),
    outputLength: output.stdout.length
  };
  
  return analysis;
}

async function testCorrectedScripts() {
  const results = [];
  let passedTests = 0;
  let failedTests = 0;
  
  for (const script of CORRECTED_SCRIPTS) {
    const scriptPath = path.join(__dirname, script.name);
    
    try {
      // Verificar se o script existe
      if (!fs.existsSync(scriptPath)) {
        console.log(`   ⚠️  Script não encontrado: ${script.name}`);
        results.push({
          script: script.name,
          success: false,
          error: 'Arquivo não encontrado',
          skipped: true
        });
        continue;
      }
      
      const result = await runScript(scriptPath, script.timeout);
      const analysis = analyzeOutput(result, script.name);
      
      if (result.success && !analysis.hasErrors) {
        console.log(`   ✅ SUCESSO - Código de saída: ${result.code}`);
        if (analysis.hasCorrectPath) {
          console.log(`   📂 Caminho correto do banco detectado`);
        }
        if (analysis.hasDbConnection) {
          console.log(`   🔗 Conexão com banco detectada`);
        }
        if (analysis.hasWarnings) {
          console.log(`   ⚠️  Avisos encontrados na saída`);
        }
        
        passedTests++;
        results.push({
          script: script.name,
          success: true,
          exitCode: result.code,
          analysis: analysis,
          outputLength: analysis.outputLength
        });
        
      } else {
        console.log(`   ❌ FALHA - Código de saída: ${result.code}`);
        if (analysis.hasErrors) {
          console.log(`   🚨 Erros detectados:`);
          const errorLines = result.stderr.split('\n').filter(line => line.trim()).slice(0, 3);
          errorLines.forEach(line => console.log(`      ${line}`));
        }
        
        failedTests++;
        results.push({
          script: script.name,
          success: false,
          exitCode: result.code,
          error: result.stderr || 'Código de saída não zero',
          analysis: analysis
        });
      }
      
    } catch (error) {
      console.log(`   ❌ ERRO: ${error.message}`);
      failedTests++;
      
      results.push({
        script: script.name,
        success: false,
        error: error.message,
        crashed: true
      });
    }
    
    // Pequena pausa entre execuções
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Mostrar resumo
  console.log('\n' + '=' .repeat(60));
  console.log('📋 RESUMO DOS TESTES DE SCRIPTS CORRIGIDOS');
  console.log('=' .repeat(60));
  console.log(`✅ Scripts funcionando: ${passedTests}`);
  console.log(`❌ Scripts com problemas: ${failedTests}`);
  console.log(`📊 Total de scripts: ${results.length}`);
  
  if (failedTests > 0) {
    console.log('\n❌ SCRIPTS COM PROBLEMAS:');
    results.filter(r => !r.success).forEach(r => {
      const status = r.skipped ? 'Não encontrado' : r.crashed ? 'Erro de execução' : `Saída ${r.exitCode}`;
      console.log(`   - ${r.script}: ${status}`);
      if (r.error && !r.skipped) {
        console.log(`     Erro: ${r.error.split('\n')[0]}`);
      }
    });
  }
  
  console.log('\n✅ SCRIPTS FUNCIONANDO:');
  results.filter(r => r.success).forEach(r => {
    const info = [];
    if (r.analysis?.hasDbConnection) info.push('DB conectado');
    if (r.analysis?.hasCorrectPath) info.push('Caminho correto');
    if (r.analysis?.hasWarnings) info.push('⚠️ Avisos');
    if (r.outputLength) info.push(`${Math.round(r.outputLength/100)/10}KB saída`);
    
    console.log(`   - ${r.script}: Código ${r.exitCode} ${info.length ? `[${info.join(', ')}]` : ''}`);
  });
  
  // Verificar se todos os scripts usam o caminho correto
  const scriptsWithCorrectPath = results.filter(r => r.success && r.analysis?.hasCorrectPath).length;
  const scriptsWithDbConnection = results.filter(r => r.success && r.analysis?.hasDbConnection).length;
  
  console.log('\n🔍 ANÁLISE DE CORREÇÕES:');
  console.log(`📂 Scripts usando caminho correto: ${scriptsWithCorrectPath}/${passedTests}`);
  console.log(`🔗 Scripts conectando ao banco: ${scriptsWithDbConnection}/${passedTests}`);
  
  return {
    total: results.length,
    passed: passedTests,
    failed: failedTests,
    results: results,
    correctPath: scriptsWithCorrectPath,
    dbConnections: scriptsWithDbConnection
  };
}

// Executar os testes
testCorrectedScripts()
  .then(summary => {
    console.log('\n🎯 TESTE DE SCRIPTS CORRIGIDOS CONCLUÍDO!');
    console.log(`📊 Resultado: ${summary.passed}/${summary.total} scripts funcionando`);
    console.log(`🔧 Correções validadas: ${summary.correctPath} caminhos corretos, ${summary.dbConnections} conexões DB`);
    process.exit(summary.failed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('❌ Erro fatal nos testes:', error);
    process.exit(1);
  });