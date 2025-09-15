#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando servidor de desenvolvimento...');

const child = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  cwd: __dirname
});

child.on('close', (code) => {
  console.log(`Servidor finalizado com código ${code}`);
});

process.on('SIGINT', () => {
  child.kill('SIGINT');
});
