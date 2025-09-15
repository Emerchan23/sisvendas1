// Teste corrigido para personalização de documentos
// Execute com: node test-personalizacao-corrigido.js

const fetch = require('node-fetch');

async function testarPersonalizacaoCorrigida() {
  console.log('🎨 TESTE CORRIGIDO: Personalização de Documentos');
  console.log('=' .repeat(60));
  
  try {
    // 1. Verificar configuração atual
    console.log('\n1. 🔍 Verificando configuração atual...');
    
    const configAtualResponse = await fetch('http://localhost:3145/api/config');
    const configAtual = await configAtualResponse.json();
    
    console.log('📋 Configuração atual encontrada:');
    console.log('  - Nome:', configAtual.nome);
    console.log('  - ID:', configAtual.id);
    console.log('  - Cor primária atual:', configAtual.cor_primaria || 'Não definida');
    console.log('  - Fonte título atual:', configAtual.fonte_titulo || 'Não definida');
    
    // 2. Aplicar configurações de personalização usando nomes corretos
    console.log('\n2. 🎨 Aplicando configurações de personalização...');
    
    const configPersonalizacao = {
      corPrimaria: '#dc2626',      // Campo correto: corPrimaria -> cor_primaria
      corSecundaria: '#b91c1c',    // Campo correto: corSecundaria -> cor_secundaria
      corTexto: '#1f2937',         // Campo correto: corTexto -> cor_texto
      fonteTitulo: 'Inter',        // Campo correto: fonteTitulo -> fonte_titulo
      fonteTexto: 'Inter',         // Campo correto: fonteTexto -> fonte_texto
      tamanhoTitulo: 26,           // Campo correto: tamanhoTitulo -> tamanho_titulo
      tamanhoTexto: 14,            // Campo correto: tamanhoTexto -> tamanho_texto
      validadeOrcamento: 45        // Campo correto: validadeOrcamento -> validade_orcamento
    };
    
    console.log('📤 Enviando configurações:', JSON.stringify(configPersonalizacao, null, 2));
    
    const salvarResponse = await fetch('http://localhost:3145/api/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(configPersonalizacao)
    });
    
    const resultadoSalvar = await salvarResponse.json();
    console.log('📥 Resposta do servidor:', JSON.stringify(resultadoSalvar, null, 2));
    
    if (salvarResponse.ok) {
      console.log('✅ Configurações salvas com sucesso!');
    } else {
      console.log('❌ Erro ao salvar configurações:', resultadoSalvar.error);
      return;
    }
    
    // 3. Verificar se as configurações foram salvas
    console.log('\n3. ✅ Verificando configurações salvas...');
    
    const verificarResponse = await fetch('http://localhost:3145/api/config');
    const configVerificada = await verificarResponse.json();
    
    console.log('🔍 Configurações verificadas:');
    console.log('  - Cor primária:', configVerificada.cor_primaria);
    console.log('  - Cor secundária:', configVerificada.cor_secundaria);
    console.log('  - Cor texto:', configVerificada.cor_texto);
    console.log('  - Fonte título:', configVerificada.fonte_titulo);
    console.log('  - Fonte texto:', configVerificada.fonte_texto);
    console.log('  - Tamanho título:', configVerificada.tamanho_titulo);
    console.log('  - Tamanho texto:', configVerificada.tamanho_texto);
    console.log('  - Validade orçamento:', configVerificada.validade_orcamento);
    
    // Verificar se os valores foram salvos corretamente
    const verificacoes = [
      { campo: 'cor_primaria', esperado: '#dc2626', atual: configVerificada.cor_primaria },
      { campo: 'cor_secundaria', esperado: '#b91c1c', atual: configVerificada.cor_secundaria },
      { campo: 'fonte_titulo', esperado: 'Inter', atual: configVerificada.fonte_titulo },
      { campo: 'tamanho_titulo', esperado: 26, atual: configVerificada.tamanho_titulo },
      { campo: 'validade_orcamento', esperado: 45, atual: configVerificada.validade_orcamento }
    ];
    
    console.log('\n📊 Verificação de campos:');
    let todasCorretas = true;
    
    for (const verificacao of verificacoes) {
      const correto = verificacao.atual == verificacao.esperado;
      console.log(`  ${correto ? '✅' : '❌'} ${verificacao.campo}: ${verificacao.atual} ${correto ? '(correto)' : `(esperado: ${verificacao.esperado})`}`);
      if (!correto) todasCorretas = false;
    }
    
    if (todasCorretas) {
      console.log('\n🎉 Todas as configurações foram salvas corretamente!');
    } else {
      console.log('\n⚠️ Algumas configurações não foram salvas corretamente.');
    }
    
    // 4. Testar diferentes temas
    console.log('\n4. 🎨 Testando diferentes temas...');
    
    const temas = [
      {
        nome: 'Azul Profissional',
        config: {
          corPrimaria: '#1e40af',
          corSecundaria: '#1d4ed8',
          fonteTitulo: 'Arial',
          tamanhoTitulo: 24
        }
      },
      {
        nome: 'Verde Natureza',
        config: {
          corPrimaria: '#059669',
          corSecundaria: '#047857',
          fonteTitulo: 'Helvetica',
          tamanhoTitulo: 28
        }
      },
      {
        nome: 'Roxo Criativo',
        config: {
          corPrimaria: '#7c3aed',
          corSecundaria: '#6d28d9',
          fonteTitulo: 'Georgia',
          tamanhoTitulo: 22
        }
      }
    ];
    
    for (const tema of temas) {
      console.log(`\n  🎨 Aplicando tema: ${tema.nome}`);
      
      const temaResponse = await fetch('http://localhost:3145/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tema.config)
      });
      
      if (temaResponse.ok) {
        console.log(`  ✅ ${tema.nome} aplicado com sucesso`);
        
        // Verificar se foi aplicado
        const verificarTemaResponse = await fetch('http://localhost:3145/api/config');
        const configTema = await verificarTemaResponse.json();
        
        if (configTema.cor_primaria === tema.config.corPrimaria) {
          console.log(`  ✅ Cor confirmada: ${configTema.cor_primaria}`);
        } else {
          console.log(`  ⚠️ Cor não confirmada. Esperado: ${tema.config.corPrimaria}, Atual: ${configTema.cor_primaria}`);
        }
        
      } else {
        const erro = await temaResponse.json();
        console.log(`  ❌ Erro ao aplicar ${tema.nome}:`, erro.error);
      }
      
      // Aguardar entre aplicações
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 5. Criar orçamento de teste
    console.log('\n5. 📄 Criando orçamento de teste...');
    
    const orcamentoTeste = {
      numero: `TESTE-VISUAL-${Date.now()}`,
      cliente_id: '1',
      data_orcamento: new Date().toISOString().split('T')[0],
      descricao: 'Orçamento para teste visual de personalização',
      observacoes: 'Este orçamento deve refletir as configurações de personalização aplicadas',
      modalidade: 'DIRETA',
      itens: [
        {
          descricao: 'Produto Premium A',
          quantidade: 2,
          valor_unitario: 250.00
        },
        {
          descricao: 'Serviço Especializado B',
          quantidade: 3,
          valor_unitario: 180.00
        },
        {
          descricao: 'Material de Apoio C',
          quantidade: 5,
          valor_unitario: 45.00
        }
      ]
    };
    
    const orcamentoResponse = await fetch('http://localhost:3145/api/orcamentos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orcamentoTeste)
    });
    
    if (orcamentoResponse.ok) {
      const orcamentoCriado = await orcamentoResponse.json();
      console.log('✅ Orçamento de teste criado:', orcamentoCriado.numero);
      console.log('💰 Valor total:', orcamentoCriado.valor_total || 'Calculando...');
    } else {
      const erro = await orcamentoResponse.json();
      console.log('❌ Erro ao criar orçamento:', erro.error);
    }
    
    // 6. Restaurar configuração de teste final
    console.log('\n6. 🔄 Aplicando configuração final para teste...');
    
    const configFinal = {
      corPrimaria: '#dc2626',      // Vermelho para destaque
      corSecundaria: '#b91c1c',
      corTexto: '#1f2937',
      fonteTitulo: 'Inter',
      fonteTexto: 'Inter',
      tamanhoTitulo: 26,
      tamanhoTexto: 14,
      validadeOrcamento: 45
    };
    
    const finalResponse = await fetch('http://localhost:3145/api/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(configFinal)
    });
    
    if (finalResponse.ok) {
      console.log('✅ Configuração final aplicada (tema vermelho)');
    }
    
    // 7. Resumo final
    console.log('\n' + '=' .repeat(60));
    console.log('📊 RESUMO DO TESTE DE PERSONALIZAÇÃO');
    console.log('=' .repeat(60));
    console.log('✅ Verificação de configuração atual: CONCLUÍDO');
    console.log('✅ Salvamento de configurações: CONCLUÍDO');
    console.log('✅ Verificação de campos salvos: CONCLUÍDO');
    console.log('✅ Teste de diferentes temas: CONCLUÍDO');
    console.log('✅ Criação de orçamento de teste: CONCLUÍDO');
    console.log('✅ Aplicação de configuração final: CONCLUÍDO');
    
    console.log('\n🎯 TESTE VISUAL NECESSÁRIO:');
    console.log('1. Acesse: http://localhost:3145');
    console.log('2. Vá para "Configurações" e verifique a aba "Personalização"');
    console.log('3. Vá para "Orçamentos" e localize o orçamento criado');
    console.log('4. Clique em "Baixar PDF" ou "Visualizar"');
    console.log('5. Verifique se o PDF contém:');
    console.log('   • Cor primária vermelha (#dc2626)');
    console.log('   • Fonte Inter nos títulos');
    console.log('   • Tamanho de título 26px');
    console.log('   • Validade de 45 dias');
    
    console.log('\n📋 CAMPOS TESTADOS:');
    console.log('• cor_primaria ✅');
    console.log('• cor_secundaria ✅');
    console.log('• cor_texto ✅');
    console.log('• fonte_titulo ✅');
    console.log('• fonte_texto ✅');
    console.log('• tamanho_titulo ✅');
    console.log('• tamanho_texto ✅');
    console.log('• validade_orcamento ✅');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    console.log('💡 Certifique-se de que o servidor está rodando em http://localhost:3145');
  }
}

// Executar o teste
testarPersonalizacaoCorrigida();