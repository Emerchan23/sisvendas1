#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🐳 Iniciando servidor em produção com Docker...');

const isWindows = process.platform === 'win32';
const dockerCmd = isWindows ? 'docker-compose.exe' : 'docker-compose';

const child = spawn(dockerCmd, ['up', '--build'], {
  stdio: 'inherit',
  cwd: __dirname,
  shell: isWindows
});

child.on('close', (code) => {
  console.log(`Docker finalizado com código ${code}`);
});

process.on('SIGINT', () => {
  spawn(dockerCmd, ['down'], { stdio: 'inherit', cwd: __dirname, shell: isWindows });
  child.kill('SIGINT');
});
