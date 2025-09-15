// Teste para verificar permissões do usuário atual
const Database = require('better-sqlite3');

async function testUserPermissions() {
  console.log('🔍 Verificando permissões do usuário atual...');
  
  try {
    // Conectar ao banco de dados
    const db = new Database('../Banco de dados Aqui/erp.sqlite');
    
    // Buscar todos os usuários
    console.log('\n👥 Usuários cadastrados:');
    const usuarios = db.prepare('SELECT * FROM usuarios').all();
    
    usuarios.forEach((usuario, index) => {
      console.log(`\n${index + 1}. Usuário: ${usuario.nome}`);
      console.log(`   Email: ${usuario.email}`);
      console.log(`   Role: ${usuario.role}`);
      console.log(`   Ativo: ${usuario.ativo}`);
      
      // Verificar permissões
      let permissoes = {};
      if (usuario.permissoes) {
        try {
          if (typeof usuario.permissoes === 'string') {
            permissoes = JSON.parse(usuario.permissoes);
          } else {
            permissoes = usuario.permissoes;
          }
        } catch (e) {
          console.log(`   ⚠️ Erro ao parsear permissões: ${e.message}`);
        }
      }
      
      console.log(`   Permissões:`, permissoes);
      console.log(`   Tem permissão 'orcamentos': ${permissoes.orcamentos === true}`);
      console.log(`   É admin: ${usuario.role === 'admin'}`);
    });
    
    // Verificar se há usuário logado (simulação)
    console.log('\n🔐 Simulando verificação de permissão para orçamentos...');
    
    const usuarioTeste = usuarios.find(u => u.ativo === 1);
    if (usuarioTeste) {
      console.log(`\n✅ Usuário de teste: ${usuarioTeste.nome}`);
      
      let permissoes = {};
      if (usuarioTeste.permissoes) {
        try {
          if (typeof usuarioTeste.permissoes === 'string') {
            permissoes = JSON.parse(usuarioTeste.permissoes);
          } else {
            permissoes = usuarioTeste.permissoes;
          }
        } catch (e) {
          console.log(`⚠️ Erro ao parsear permissões: ${e.message}`);
        }
      }
      
      // Simular função hasPermission
      const hasPermission = (permission) => {
        if (!usuarioTeste) return false;
        if (usuarioTeste.role === 'admin') return true;
        return permissoes && permissoes[permission] === true;
      };
      
      console.log(`🔍 hasPermission('orcamentos'): ${hasPermission('orcamentos')}`);
      console.log(`🔍 hasPermission('vendas'): ${hasPermission('vendas')}`);
      console.log(`🔍 hasPermission('clientes'): ${hasPermission('clientes')}`);
      
      // Verificar se o link de orçamentos deveria aparecer
      const shouldShowOrcamentos = hasPermission('orcamentos');
      console.log(`\n📋 Link 'Orçamentos' deveria aparecer: ${shouldShowOrcamentos}`);
      
      if (!shouldShowOrcamentos) {
        console.log('❌ PROBLEMA IDENTIFICADO: Usuário não tem permissão para orçamentos!');
        console.log('💡 SOLUÇÃO: Adicionar permissão "orcamentos" ao usuário ou torná-lo admin.');
      } else {
        console.log('✅ Usuário tem permissão para orçamentos. Problema pode ser em outro lugar.');
      }
    } else {
      console.log('❌ Nenhum usuário ativo encontrado!');
    }
    
    db.close();
    
  } catch (error) {
    console.error('❌ Erro ao verificar permissões:', error);
    console.error('Stack:', error.stack);
  }
}

testUserPermissions();