const path = require('path');
const Database = require('better-sqlite3');
const fetch = require('node-fetch');

// Configurar o caminho do banco de dados
const dbPath = path.join(__dirname, '..', 'Banco de dados Aqui', 'erp.sqlite');
const db = new Database(dbPath);

console.log('🧪 TESTE FINAL - SISTEMA DE VALIDADE DE ORÇAMENTOS');
console.log('=' .repeat(60));

async function testarSistemaCompleto() {
  try {
    console.log('\n1️⃣ Verificando configuração atual na tabela configuracoes...');
    
    // Verificar configuração atual
    const configAtual = db.prepare('SELECT * FROM configuracoes WHERE config_key = ?').get('validade_orcamento');
    console.log('📋 Configuração atual:', configAtual);
    
    console.log('\n2️⃣ Testando API de configurações...');
    
    // Testar atualização da configuração via API
    const updateResponse = await fetch('http://localhost:3145/api/configuracoes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        config_key: 'validade_orcamento',
        config_value: '45',
        descricao: 'Validade padrão dos orçamentos em dias (atualizada via teste)'
      })
    });
    
    const updateResult = await updateResponse.json();
    console.log('📤 Status da atualização:', updateResponse.status);
    console.log('📝 Resultado:', updateResult);
    
    console.log('\n3️⃣ Verificando se a configuração foi salva...');
    
    const configAtualizada = db.prepare('SELECT * FROM configuracoes WHERE config_key = ?').get('validade_orcamento');
    console.log('📋 Configuração atualizada:', configAtualizada);
    
    console.log('\n4️⃣ Testando criação de orçamento sem data de validade...');
    
    const orcamentoData = {
      cliente_id: 1,
      data_orcamento: '2024-01-15',
      descricao: 'Teste final - deve usar validade configurada',
      modalidade: 'DIRETA',
      itens: [
        {
          descricao: 'Item teste final',
          quantidade: 1,
          valor_unitario: 100
        }
      ]
    };
    
    console.log('📤 Criando orçamento sem data_validade...');
    
    const orcamentoResponse = await fetch('http://localhost:3145/api/orcamentos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orcamentoData)
    });
    
    const orcamentoResult = await orcamentoResponse.json();
    console.log('📥 Status:', orcamentoResponse.status);
    console.log('📝 Orçamento criado:', {
      id: orcamentoResult.id,
      numero: orcamentoResult.numero,
      data_orcamento: orcamentoResult.data_orcamento,
      data_validade: orcamentoResult.data_validade,
      modalidade: orcamentoResult.modalidade
    });
    
    if (orcamentoResult.data_validade) {
      const dataOrcamento = new Date(orcamentoResult.data_orcamento);
      const dataValidade = new Date(orcamentoResult.data_validade);
      const diferencaDias = Math.ceil((dataValidade - dataOrcamento) / (1000 * 60 * 60 * 24));
      
      console.log('📅 Diferença em dias:', diferencaDias);
      console.log('✅ Validade aplicada corretamente:', diferencaDias === parseInt(configAtualizada.config_value));
    }
    
    console.log('\n5️⃣ Verificando orçamento salvo no banco...');
    
    const orcamentoSalvo = db.prepare('SELECT * FROM orcamentos WHERE id = ?').get(orcamentoResult.id);
    console.log('💾 Orçamento no banco:', {
      id: orcamentoSalvo.id,
      numero: orcamentoSalvo.numero,
      data_orcamento: orcamentoSalvo.data_orcamento,
      data_validade: orcamentoSalvo.data_validade,
      modalidade: orcamentoSalvo.modalidade,
      status: orcamentoSalvo.status
    });
    
    console.log('\n✅ TESTE FINAL CONCLUÍDO!');
    console.log('=' .repeat(60));
    console.log('📊 RESUMO:');
    console.log(`   • Configuração na tabela: ${configAtualizada.config_value} dias`);
    console.log(`   • Validade aplicada: ${orcamentoResult.data_validade}`);
    console.log(`   • Orçamento salvo: ${orcamentoSalvo ? 'SIM' : 'NÃO'}`);
    console.log(`   • Sistema funcionando: ${orcamentoResult.data_validade && orcamentoSalvo ? '✅ SIM' : '❌ NÃO'}`);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    db.close();
  }
}

testarSistemaCompleto();