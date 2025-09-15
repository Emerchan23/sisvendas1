#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🚀 Iniciando instalação automática do Sistema de Gestão de Vendas...');
console.log('=' .repeat(60));

// Função para executar comandos com output em tempo real
function executeCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
        console.log(`\n📋 Executando: ${command} ${args.join(' ')}`);
        
        const child = spawn(command, args, {
            stdio: 'inherit',
            shell: true,
            ...options
        });
        
        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Comando falhou com código ${code}`));
            }
        });
        
        child.on('error', (error) => {
            reject(error);
        });
    });
}

// Verificar se Node.js está instalado
function checkNodeJS() {
    try {
        const version = execSync('node --version', { encoding: 'utf8' }).trim();
        console.log(`✅ Node.js encontrado: ${version}`);
        return true;
    } catch (error) {
        console.log('❌ Node.js não encontrado!');
        return false;
    }
}

// Verificar se npm está instalado
function checkNPM() {
    try {
        const version = execSync('npm --version', { encoding: 'utf8' }).trim();
        console.log(`✅ NPM encontrado: ${version}`);
        return true;
    } catch (error) {
        console.log('❌ NPM não encontrado!');
        return false;
    }
}

// Verificar se o diretório do projeto existe
function checkProjectDirectory() {
    const projectPath = path.join(__dirname);
    const packageJsonPath = path.join(projectPath, 'package.json');
    
    if (fs.existsSync(packageJsonPath)) {
        console.log(`✅ Projeto encontrado em: ${projectPath}`);
        return true;
    } else {
        console.log(`❌ package.json não encontrado em: ${projectPath}`);
        return false;
    }
}

// Instalar dependências npm
async function installDependencies() {
    try {
        console.log('\n📦 Instalando dependências do projeto...');
        await executeCommand('npm', ['install']);
        console.log('✅ Dependências instaladas com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao instalar dependências:', error.message);
        throw error;
    }
}

// Configurar banco de dados
async function setupDatabase() {
    try {
        console.log('\n🗄️ Configurando banco de dados...');
        
        // Verificar se o diretório do banco de dados externo existe
        const dbDir = path.join(__dirname, '..', 'Banco de dados Aqui');
        if (!fs.existsSync(dbDir)) {
            console.log('⚠️ Diretório do banco de dados externo não encontrado:', dbDir);
            console.log('📁 Certifique-se de que a pasta "Banco de dados Aqui" existe no diretório pai');
        }
        
        // Verificar se o script de inicialização do banco existe
        const initDbPath = path.join(__dirname, 'init-db.js');
        if (fs.existsSync(initDbPath)) {
            console.log('🔧 Executando inicialização do banco...');
            await executeCommand('node', ['init-db.js']);
            console.log('✅ Banco de dados inicializado com sucesso!');
        } else {
            console.log('⚠️ Script de inicialização do banco não encontrado, pulando...');
        }
    } catch (error) {
        console.error('❌ Erro ao configurar banco de dados:', error.message);
        console.log('⚠️ Continuando instalação...');
        // Não fazer throw do erro para continuar a instalação
    }
}

// Verificar se todas as dependências estão instaladas
function verifyInstallation() {
    try {
        console.log('\n🔍 Verificando instalação...');
        
        const nodeModulesPath = path.join(__dirname, 'node_modules');
        if (fs.existsSync(nodeModulesPath)) {
            console.log('✅ node_modules encontrado');
        } else {
            throw new Error('node_modules não encontrado');
        }
        
        // Verificar algumas dependências críticas
        const criticalDeps = ['next', 'react', 'sqlite3'];
        for (const dep of criticalDeps) {
            const depPath = path.join(nodeModulesPath, dep);
            if (fs.existsSync(depPath)) {
                console.log(`✅ ${dep} instalado`);
            } else {
                console.log(`⚠️ ${dep} não encontrado`);
            }
        }
        
        return true;
    } catch (error) {
        console.error('❌ Erro na verificação:', error.message);
        return false;
    }
}

// Função principal
async function main() {
    try {
        console.log('\n🔍 Verificando pré-requisitos...');
        
        // Verificar Node.js
        if (!checkNodeJS()) {
            console.log('\n❌ Node.js é necessário para executar este sistema.');
            console.log('📥 Por favor, baixe e instale Node.js de: https://nodejs.org/');
            process.exit(1);
        }
        
        // Verificar NPM
        if (!checkNPM()) {
            console.log('\n❌ NPM é necessário para instalar as dependências.');
            console.log('📥 NPM geralmente vem com Node.js. Reinstale Node.js se necessário.');
            process.exit(1);
        }
        
        // Verificar diretório do projeto
        if (!checkProjectDirectory()) {
            console.log('\n❌ Diretório do projeto inválido.');
            process.exit(1);
        }
        
        console.log('\n✅ Todos os pré-requisitos atendidos!');
        
        // Instalar dependências
        await installDependencies();
        
        // Configurar banco de dados
        await setupDatabase();
        
        // Verificar instalação
        if (verifyInstallation()) {
            console.log('\n🎉 Instalação concluída com sucesso!');
            console.log('=' .repeat(60));
            console.log('\n📋 Próximos passos:');
            console.log('1. Execute: node auto-start.js (para iniciar o sistema)');
            console.log('2. Ou execute: npm run dev (para modo desenvolvimento)');
            console.log('3. Acesse: http://localhost:3000 no seu navegador');
            console.log('\n📚 Para mais informações, consulte README-INSTALACAO.md');
        } else {
            console.log('\n⚠️ Instalação concluída com avisos. Verifique os logs acima.');
        }
        
    } catch (error) {
        console.error('\n💥 Erro durante a instalação:', error.message);
        console.log('\n🔧 Tente executar manualmente:');
        console.log('1. npm install');
        console.log('2. node init-db.js');
        console.log('3. npm run dev');
        process.exit(1);
    }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = { main, checkNodeJS, checkNPM, installDependencies, setupDatabase };