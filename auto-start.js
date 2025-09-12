#!/usr/bin/env node

/**
 * Script de Inicialização Automática do Sistema de Gestão de Vendas
 * Este script verifica se o sistema está instalado e inicia o servidor automaticamente
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class AutoStart {
    constructor() {
        this.projectDir = process.cwd();
        this.packageJsonPath = path.join(this.projectDir, 'package.json');
        this.nodeModulesPath = path.join(this.projectDir, 'node_modules');
        this.dbPath = path.join(this.projectDir, 'data', 'erp.sqlite');
    }

    // Verificar se o sistema está instalado
    checkInstallation() {
        console.log('🔍 Verificando instalação do sistema...');
        
        // Verificar package.json
        if (!fs.existsSync(this.packageJsonPath)) {
            console.log('❌ package.json não encontrado!');
            return false;
        }
        
        // Verificar node_modules
        if (!fs.existsSync(this.nodeModulesPath)) {
            console.log('❌ Dependências não instaladas!');
            return false;
        }
        
        // Verificar banco de dados
        if (!fs.existsSync(this.dbPath)) {
            console.log('❌ Banco de dados não encontrado!');
            return false;
        }
        
        console.log('✅ Sistema instalado corretamente!');
        return true;
    }

    // Executar instalação automática se necessário
    async runInstallation() {
        console.log('🚀 Executando instalação automática...');
        
        const installScript = path.join(this.projectDir, 'auto-install.js');
        if (!fs.existsSync(installScript)) {
            console.error('❌ Script de instalação não encontrado!');
            process.exit(1);
        }
        
        try {
            execSync('node auto-install.js', { 
                cwd: this.projectDir, 
                stdio: 'inherit' 
            });
            console.log('✅ Instalação concluída!');
        } catch (error) {
            console.error('❌ Erro durante a instalação:', error.message);
            process.exit(1);
        }
    }

    // Iniciar o servidor
    startServer() {
        console.log('\n🚀 Iniciando servidor do sistema...');
        
        try {
            // Verificar se existe script de desenvolvimento
            const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
            
            if (packageJson.scripts && packageJson.scripts.dev) {
                console.log('📦 Executando: npm run dev');
                
                const serverProcess = spawn('npm', ['run', 'dev'], {
                    cwd: this.projectDir,
                    stdio: 'inherit',
                    shell: true
                });
                
                // Aguardar alguns segundos para o servidor iniciar
                setTimeout(() => {
                    console.log('\n🌐 Sistema iniciado com sucesso!');
                    console.log('📱 Acesse: http://localhost:3000');
                    console.log('\n💡 Para parar o servidor, pressione Ctrl+C');
                }, 3000);
                
                // Lidar com sinais de interrupção
                process.on('SIGINT', () => {
                    console.log('\n🛑 Parando servidor...');
                    serverProcess.kill('SIGINT');
                    process.exit(0);
                });
                
                process.on('SIGTERM', () => {
                    console.log('\n🛑 Parando servidor...');
                    serverProcess.kill('SIGTERM');
                    process.exit(0);
                });
                
            } else {
                console.error('❌ Script "dev" não encontrado no package.json!');
                process.exit(1);
            }
            
        } catch (error) {
            console.error('❌ Erro ao iniciar servidor:', error.message);
            process.exit(1);
        }
    }

    // Função principal
    async start() {
        console.log('🎯 Sistema de Gestão de Vendas - Inicialização Automática');
        console.log('=' .repeat(60));
        
        try {
            // Verificar se está instalado
            if (!this.checkInstallation()) {
                console.log('\n⚠️  Sistema não está instalado. Executando instalação automática...');
                await this.runInstallation();
            }
            
            // Iniciar servidor
            this.startServer();
            
        } catch (error) {
            console.error('❌ Erro fatal:', error.message);
            process.exit(1);
        }
    }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
    const autoStart = new AutoStart();
    autoStart.start();
}

module.exports = AutoStart;