const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Função para garantir que o diretório de dados existe
function ensureDataDirectory() {
  const dataDir = process.env.DB_PATH ? path.dirname(process.env.DB_PATH) : './data';
  
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`✅ Diretório de dados criado: ${dataDir}`);
  }
  
  // Definir permissões
  try {
    fs.chmodSync(dataDir, 0o777);
    console.log(`✅ Permissões definidas para: ${dataDir}`);
  } catch (error) {
    console.warn(`⚠️ Não foi possível definir permissões: ${error.message}`);
  }
}

// Função para executar o script de instalação
function runInstallScript() {
  return new Promise((resolve, reject) => {
    console.log('🔧 Executando script de instalação...');
    
    const installProcess = spawn('node', ['install.js'], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    installProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Script de instalação concluído com sucesso');
        resolve();
      } else {
        console.log(`⚠️ Script de instalação terminou com código: ${code}`);
        resolve(); // Continuar mesmo se houver erro
      }
    });
    
    installProcess.on('error', (error) => {
      console.error('❌ Erro ao executar script de instalação:', error.message);
      resolve(); // Continuar mesmo se houver erro
    });
  });
}

// Função para iniciar o servidor Next.js
function startNextServer() {
  console.log('🚀 Iniciando servidor Next.js...');
  
  const nextProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: process.env.PORT || '3000'
    }
  });
  
  nextProcess.on('error', (error) => {
    console.error('❌ Erro ao iniciar servidor:', error.message);
    process.exit(1);
  });
  
  nextProcess.on('close', (code) => {
    console.log(`🔴 Servidor encerrado com código: ${code}`);
    process.exit(code);
  });
  
  // Capturar sinais de encerramento
  process.on('SIGTERM', () => {
    console.log('📡 Recebido SIGTERM, encerrando servidor...');
    nextProcess.kill('SIGTERM');
  });
  
  process.on('SIGINT', () => {
    console.log('📡 Recebido SIGINT, encerrando servidor...');
    nextProcess.kill('SIGINT');
  });
}

// Função principal
async function main() {
  try {
    console.log('🐳 Iniciando ERP-BR no Docker...');
    
    // Garantir que o diretório de dados existe
    ensureDataDirectory();
    
    // Executar script de instalação
    await runInstallScript();
    
    // Aguardar um pouco antes de iniciar o servidor
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Iniciar servidor Next.js
    startNextServer();
    
  } catch (error) {
    console.error('❌ Erro durante inicialização:', error.message);
    process.exit(1);
  }
}

// Executar função principal
main();