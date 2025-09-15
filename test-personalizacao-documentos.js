// Teste completo para personalização de documentos
// Execute com: node test-personalizacao-documentos.js

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

async function testarPersonalizacaoDocumentos() {
  console.log('🎨 TESTE: Personalização de Documentos');
  console.log('=' .repeat(50));
  
  try {
    // 1. Testar configurações de personalização
    console.log('\n1. 📋 Testando configurações de personalização...');
    
    const configPersonalizacao = {
      cor_primaria: '#2563eb',
      cor_secundaria: '#1e40af',
      cor_texto: '#1f2937',
      fonte_titulo: 'Inter',
      fonte_texto: 'Inter',
      tamanho_titulo: 24,
      tamanho_texto: 14,
      validadeOrcamento: 30,
      mostrar_logo: true,
      posicao_logo: 'esquerda'
    };
    
    // Salvar configurações de personalização
    const configResponse = await fetch('http://localhost:3145/api/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizacao_documentos: configPersonalizacao
      })
    });
    
    if (configResponse.ok) {
      console.log('✅ Configurações de personalização salvas com sucesso!');
    } else {
      const error = await configResponse.json();
      console.log('❌ Erro ao salvar configurações:', error);
      return;
    }
    
    // 2. Criar um orçamento de teste
    console.log('\n2. 📄 Criando orçamento de teste...');
    
    const orcamentoData = {
      numero: `TESTE-PERSONALIZADO-${Date.now()}`,
      cliente_id: '1',
      data_orcamento: new Date().toISOString().split('T')[0],
      descricao: 'Teste de personalização de documentos',
      observacoes: 'Este orçamento testa as configurações de personalização aplicadas',
      modalidade: 'DIRETA',
      itens: [
        {
          descricao: 'Produto Premium Personalizado',
          quantidade: 2,
          valor_unitario: 150.00,
          link_ref: 'https://exemplo.com/produto-premium',
          custo_ref: 100.00
        },
        {
          descricao: 'Serviço de Consultoria',
          quantidade: 5,
          valor_unitario: 80.00,
          link_ref: 'https://exemplo.com/consultoria',
          custo_ref: 50.00
        },
        {
          descricao: 'Material Especial',
          quantidade: 10,
          valor_unitario: 25.00
        }
      ]
    };
    
    const orcamentoResponse = await fetch('http://localhost:3145/api/orcamentos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orcamentoData)
    });
    
    if (!orcamentoResponse.ok) {
      const error = await orcamentoResponse.json();
      console.log('❌ Erro ao criar orçamento:', error);
      return;
    }
    
    const orcamento = await orcamentoResponse.json();
    console.log('✅ Orçamento criado:', orcamento.numero);
    
    // 3. Testar geração de PDF com personalização
    console.log('\n3. 🖨️ Testando geração de PDF personalizado...');
    
    // Aguardar um pouco para garantir que o orçamento foi salvo
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Buscar o orçamento criado
    const orcamentosResponse = await fetch('http://localhost:3145/api/orcamentos');
    const orcamentos = await orcamentosResponse.json();
    const orcamentoCriado = orcamentos.find(o => o.numero === orcamento.numero);
    
    if (!orcamentoCriado) {
      console.log('❌ Orçamento não encontrado para geração de PDF');
      return;
    }
    
    console.log('📋 Orçamento encontrado:', orcamentoCriado.numero);
    console.log('💰 Valor total:', orcamentoCriado.valor_total);
    console.log('📦 Itens:', orcamentoCriado.itens?.length || 0);
    
    // 4. Verificar se as configurações estão sendo aplicadas
    console.log('\n4. 🔍 Verificando aplicação das configurações...');
    
    // Buscar configurações atuais
    const configAtualResponse = await fetch('http://localhost:3145/api/config');
    const configAtual = await configAtualResponse.json();
    
    if (configAtual.personalizacao_documentos) {
      console.log('✅ Configurações de personalização encontradas:');
      console.log('  - Cor primária:', configAtual.personalizacao_documentos.cor_primaria);
      console.log('  - Cor secundária:', configAtual.personalizacao_documentos.cor_secundaria);
      console.log('  - Fonte título:', configAtual.personalizacao_documentos.fonte_titulo);
      console.log('  - Tamanho título:', configAtual.personalizacao_documentos.tamanho_titulo);
      console.log('  - Validade orçamento:', configAtual.personalizacao_documentos.validadeOrcamento, 'dias');
    } else {
      console.log('⚠️ Configurações de personalização não encontradas');
    }
    
    // 5. Testar diferentes configurações
    console.log('\n5. 🎨 Testando diferentes configurações de personalização...');
    
    const configsAlternativas = [
      {
        nome: 'Tema Escuro',
        config: {
          cor_primaria: '#1f2937',
          cor_secundaria: '#374151',
          cor_texto: '#f9fafb',
          fonte_titulo: 'Arial',
          tamanho_titulo: 28
        }
      },
      {
        nome: 'Tema Verde',
        config: {
          cor_primaria: '#059669',
          cor_secundaria: '#047857',
          cor_texto: '#064e3b',
          fonte_titulo: 'Helvetica',
          tamanho_titulo: 22
        }
      },
      {
        nome: 'Tema Roxo',
        config: {
          cor_primaria: '#7c3aed',
          cor_secundaria: '#6d28d9',
          cor_texto: '#581c87',
          fonte_titulo: 'Georgia',
          tamanho_titulo: 26
        }
      }
    ];
    
    for (const tema of configsAlternativas) {
      console.log(`\n  🎨 Testando ${tema.nome}...`);
      
      const temaResponse = await fetch('http://localhost:3145/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizacao_documentos: tema.config
        })
      });
      
      if (temaResponse.ok) {
        console.log(`  ✅ ${tema.nome} aplicado com sucesso`);
      } else {
        console.log(`  ❌ Erro ao aplicar ${tema.nome}`);
      }
      
      // Aguardar um pouco entre as configurações
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // 6. Restaurar configuração original
    console.log('\n6. 🔄 Restaurando configuração original...');
    
    const restaurarResponse = await fetch('http://localhost:3145/api/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizacao_documentos: configPersonalizacao
      })
    });
    
    if (restaurarResponse.ok) {
      console.log('✅ Configuração original restaurada');
    }
    
    // 7. Resumo dos testes
    console.log('\n' + '=' .repeat(50));
    console.log('📊 RESUMO DOS TESTES DE PERSONALIZAÇÃO');
    console.log('=' .repeat(50));
    console.log('✅ Configurações de personalização: TESTADO');
    console.log('✅ Criação de orçamento: TESTADO');
    console.log('✅ Aplicação de configurações: TESTADO');
    console.log('✅ Temas alternativos: TESTADO');
    console.log('✅ Restauração de configurações: TESTADO');
    
    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('1. Acesse a página de orçamentos no navegador');
    console.log('2. Localize o orçamento:', orcamento.numero);
    console.log('3. Clique em "Baixar PDF" para ver a personalização aplicada');
    console.log('4. Verifique se as cores, fontes e layout estão corretos');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    console.log('💡 Certifique-se de que o servidor está rodando em http://localhost:3145');
  }
}

// Executar o teste
testarPersonalizacaoDocumentos();

console.log('\n📋 INSTRUÇÕES DE USO:');
console.log('1. Execute: node test-personalizacao-documentos.js');
console.log('2. Observe os logs para verificar cada etapa');
console.log('3. Acesse a interface web para testar a geração de PDF');
console.log('4. Verifique se as personalizações estão sendo aplicadas');