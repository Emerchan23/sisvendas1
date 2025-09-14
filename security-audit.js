console.log('🔒 Auditoria de Segurança - Sistema ERP Vendas');
console.log('=' .repeat(50));

// 1. Verificar variáveis de ambiente
console.log('\n📋 1. VARIÁVEIS DE AMBIENTE:');
const envVars = {
  'JWT_SECRET': process.env.JWT_SECRET,
  'NODE_ENV': process.env.NODE_ENV,
  'DATABASE_URL': process.env.DATABASE_URL,
  'NEXTAUTH_SECRET': process.env.NEXTAUTH_SECRET,
  'NEXTAUTH_URL': process.env.NEXTAUTH_URL
};

Object.entries(envVars).forEach(([key, value]) => {
  if (value) {
    if (key.includes('SECRET') || key.includes('PASSWORD')) {
      console.log(`  ✅ ${key}: [DEFINIDO - ${value.length} caracteres]`);
    } else {
      console.log(`  ✅ ${key}: ${value}`);
    }
  } else {
    console.log(`  ❌ ${key}: NÃO DEFINIDO`);
  }
});

// 2. Verificar configurações de JWT
console.log('\n🎫 2. CONFIGURAÇÕES JWT:');
const jwtSecret = process.env.JWT_SECRET || 'sua-chave-secreta-muito-segura-aqui';
if (jwtSecret === 'sua-chave-secreta-muito-segura-aqui') {
  console.log('  ⚠️  JWT_SECRET usando valor padrão - RISCO DE SEGURANÇA!');
  console.log('  📝 Recomendação: Definir JWT_SECRET com valor único e seguro');
} else {
  console.log(`  ✅ JWT_SECRET personalizado definido (${jwtSecret.length} caracteres)`);
}

// 3. Verificar configurações de CORS
console.log('\n🌐 3. CONFIGURAÇÕES CORS:');
try {
  const nextConfig = require('./next.config.js');
  if (nextConfig.async && nextConfig.async.headers) {
    console.log('  ✅ Headers CORS configurados');
  } else {
    console.log('  ⚠️  Headers CORS não encontrados na configuração');
  }
} catch (e) {
  console.log('  ℹ️  Configuração CORS padrão do Next.js');
}

// 4. Verificar configurações de banco de dados
console.log('\n🗄️  4. SEGURANÇA DO BANCO:');
const Database = require('better-sqlite3');
try {
  const db = new Database('./data/erp.sqlite');
  
  // Verificar se há usuários com senhas fracas
  const usuarios = db.prepare('SELECT id, email, senha FROM usuarios').all();
  console.log(`  📊 Total de usuários: ${usuarios.length}`);
  
  usuarios.forEach(user => {
    if (user.senha && user.senha.startsWith('$2')) {
      console.log(`  ✅ ${user.email}: Senha criptografada (bcrypt)`);
    } else {
      console.log(`  ❌ ${user.email}: Senha não criptografada - RISCO CRÍTICO!`);
    }
  });
  
  db.close();
} catch (e) {
  console.log('  ❌ Erro ao verificar banco:', e.message);
}

// 5. Verificar configurações de produção
console.log('\n🏭 5. CONFIGURAÇÕES DE PRODUÇÃO:');
if (process.env.NODE_ENV === 'production') {
  console.log('  ✅ Ambiente: PRODUÇÃO');
  console.log('  📝 Verificações adicionais necessárias:');
  console.log('    - HTTPS habilitado');
  console.log('    - Rate limiting configurado');
  console.log('    - Logs de segurança ativos');
  console.log('    - Backup automático configurado');
} else {
  console.log('  ⚠️  Ambiente: DESENVOLVIMENTO');
  console.log('  📝 Para produção, configure:');
  console.log('    - NODE_ENV=production');
  console.log('    - JWT_SECRET único');
  console.log('    - HTTPS obrigatório');
}

// 6. Recomendações de segurança
console.log('\n🛡️  6. RECOMENDAÇÕES DE SEGURANÇA:');
console.log('  📌 Implementar rate limiting nas APIs');
console.log('  📌 Configurar HTTPS em produção');
console.log('  📌 Implementar logs de auditoria');
console.log('  📌 Configurar backup automático');
console.log('  📌 Implementar validação de entrada rigorosa');
console.log('  📌 Configurar monitoramento de segurança');

console.log('\n' + '=' .repeat(50));
console.log('✅ Auditoria de segurança concluída!');