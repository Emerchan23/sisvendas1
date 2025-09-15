#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🐳 Iniciando servidor em produção com Docker...');

const child = spawn('docker-compose', ['up', '--build'], {
  stdio: 'inherit',
  cwd: __dirname
});

child.on('close', (code) => {
  console.log(`Docker finalizado com código ${code}`);
});

// Removido process.on('SIGINT') duplicado para evitar MaxListenersExceededWarning
