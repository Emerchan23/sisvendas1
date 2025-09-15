// Teste específico para geração de PDF com personalização
// Execute com: node test-pdf-personalizacao.js

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

async function testarGeracaoPDFPersonalizado() {
  console.log('🎨 TESTE: Geração de PDF com Personalização');
  console.log('=' .repeat(60));
  
  try {
    // 1. Configurar personalização específica para teste
    console.log('\n1. 🎨 Configurando personalização para teste...');
    
    const configTeste = {
      cor_primaria: '#dc2626', // Vermelho
      cor_secundaria: '#b91c1c',
      cor_texto: '#1f2937',
      fonte_titulo: 'Inter',
      fonte_texto: 'Inter',
      tamanho_titulo: 26,
      tamanho_texto: 14,
      validadeOrcamento: 45,
      mostrar_logo: true,
      posicao_logo: 'centro'
    };
    
    const configResponse = await fetch('http://localhost:3145/api/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizacao_documentos: configTeste
      })
    });
    
    if (configResponse.ok) {
      console.log('✅ Configuração de teste aplicada (tema vermelho)');
    } else {
      console.log('❌ Erro ao aplicar configuração de teste');
      return;
    }
    
    // 2. Buscar orçamentos existentes
    console.log('\n2. 📋 Buscando orçamentos existentes...');
    
    const orcamentosResponse = await fetch('http://localhost:3145/api/orcamentos');
    const orcamentos = await orcamentosResponse.json();
    
    console.log(`📊 Total de orçamentos encontrados: ${orcamentos.length}`);
    
    if (orcamentos.length === 0) {
      console.log('⚠️ Nenhum orçamento encontrado. Criando um novo...');
      
      // Criar orçamento de teste
      const novoOrcamento = {
        numero: `PDF-TEST-${Date.now()}`,
        cliente_id: '1',
        data_orcamento: new Date().toISOString().split('T')[0],
        descricao: 'Teste de geração de PDF personalizado',
        observacoes: 'Este orçamento testa a aplicação de personalização no PDF gerado',
        modalidade: 'DIRETA',
        itens: [
          {
            descricao: 'Produto A - Teste PDF',
            quantidade: 3,
            valor_unitario: 120.00
          },
          {
            descricao: 'Serviço B - Teste PDF',
            quantidade: 2,
            valor_unitario: 200.00
          }
        ]
      };
      
      const criarResponse = await fetch('http://localhost:3145/api/orcamentos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(novoOrcamento)
      });
      
      if (criarResponse.ok) {
        const orcamentoCriado = await criarResponse.json();
        console.log('✅ Orçamento criado:', orcamentoCriado.numero);
        orcamentos.push(orcamentoCriado);
      } else {
        console.log('❌ Erro ao criar orçamento de teste');
        return;
      }
    }
    
    // 3. Selecionar orçamento para teste
    const orcamentoTeste = orcamentos[0];
    console.log(`\n3. 📄 Testando com orçamento: ${orcamentoTeste.numero}`);
    console.log(`   💰 Valor: R$ ${orcamentoTeste.valor_total}`);
    console.log(`   📅 Data: ${orcamentoTeste.data_orcamento}`);
    
    // 4. Verificar configurações atuais
    console.log('\n4. 🔍 Verificando configurações aplicadas...');
    
    const configAtualResponse = await fetch('http://localhost:3145/api/config');
    const configAtual = await configAtualResponse.json();
    
    if (configAtual.personalizacao_documentos) {
      const config = configAtual.personalizacao_documentos;
      console.log('✅ Configurações encontradas:');
      console.log(`   🎨 Cor primária: ${config.cor_primaria}`);
      console.log(`   🎨 Cor secundária: ${config.cor_secundaria}`);
      console.log(`   📝 Fonte título: ${config.fonte_titulo}`);
      console.log(`   📏 Tamanho título: ${config.tamanho_titulo}px`);
      console.log(`   ⏰ Validade: ${config.validadeOrcamento} dias`);
      console.log(`   🖼️ Mostrar logo: ${config.mostrar_logo ? 'Sim' : 'Não'}`);
    } else {
      console.log('⚠️ Configurações de personalização não encontradas');
    }
    
    // 5. Testar função makeOrcamentoHTML diretamente
    console.log('\n5. 🧪 Testando função makeOrcamentoHTML...');
    
    try {
      // Importar a função de geração de HTML
      const printModule = require('./lib/print.js');
      
      if (printModule.makeOrcamentoHTML) {
        console.log('✅ Função makeOrcamentoHTML encontrada');
        
        // Testar geração de HTML
        const htmlGerado = await printModule.makeOrcamentoHTML(orcamentoTeste.id);
        
        if (htmlGerado) {
          console.log('✅ HTML gerado com sucesso');
          console.log(`📏 Tamanho do HTML: ${htmlGerado.length} caracteres`);
          
          // Verificar se contém as personalizações
          const contemCores = htmlGerado.includes(configTeste.cor_primaria);
          const contemFonte = htmlGerado.includes(configTeste.fonte_titulo);
          
          console.log(`🎨 Contém cor primária (${configTeste.cor_primaria}): ${contemCores ? '✅' : '❌'}`);
          console.log(`📝 Contém fonte título (${configTeste.fonte_titulo}): ${contemFonte ? '✅' : '❌'}`);
          
          // Salvar HTML para inspeção
          const htmlPath = path.join(__dirname, 'test-output-personalizado.html');
          fs.writeFileSync(htmlPath, htmlGerado);
          console.log(`💾 HTML salvo em: ${htmlPath}`);
          
        } else {
          console.log('❌ Falha na geração de HTML');
        }
        
      } else {
        console.log('❌ Função makeOrcamentoHTML não encontrada');
      }
      
    } catch (error) {
      console.log('⚠️ Erro ao testar função diretamente:', error.message);
      console.log('💡 Isso pode ser normal se houver dependências do banco de dados');
    }
    
    // 6. Testar diferentes configurações de personalização
    console.log('\n6. 🎨 Testando variações de personalização...');
    
    const variacoes = [
      {
        nome: 'Azul Corporativo',
        config: {
          cor_primaria: '#1e40af',
          cor_secundaria: '#1d4ed8',
          fonte_titulo: 'Arial',
          tamanho_titulo: 24
        }
      },
      {
        nome: 'Verde Sustentável',
        config: {
          cor_primaria: '#059669',
          cor_secundaria: '#047857',
          fonte_titulo: 'Helvetica',
          tamanho_titulo: 28
        }
      },
      {
        nome: 'Roxo Criativo',
        config: {
          cor_primaria: '#7c3aed',
          cor_secundaria: '#6d28d9',
          fonte_titulo: 'Georgia',
          tamanho_titulo: 22
        }
      }
    ];
    
    for (const variacao of variacoes) {
      console.log(`\n   🎨 Aplicando ${variacao.nome}...`);
      
      const variacaoResponse = await fetch('http://localhost:3145/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizacao_documentos: {
            ...configTeste,
            ...variacao.config
          }
        })
      });
      
      if (variacaoResponse.ok) {
        console.log(`   ✅ ${variacao.nome} aplicado`);
        
        // Verificar se a configuração foi salva
        const verificarResponse = await fetch('http://localhost:3145/api/config');
        const configVerificar = await verificarResponse.json();
        
        if (configVerificar.personalizacao_documentos?.cor_primaria === variacao.config.cor_primaria) {
          console.log(`   ✅ Configuração confirmada: ${variacao.config.cor_primaria}`);
        } else {
          console.log(`   ⚠️ Configuração não confirmada`);
        }
        
      } else {
        console.log(`   ❌ Erro ao aplicar ${variacao.nome}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // 7. Resumo final
    console.log('\n' + '=' .repeat(60));
    console.log('📊 RESUMO DO TESTE DE PDF PERSONALIZADO');
    console.log('=' .repeat(60));
    console.log('✅ Configuração de personalização: TESTADO');
    console.log('✅ Busca de orçamentos: TESTADO');
    console.log('✅ Verificação de configurações: TESTADO');
    console.log('✅ Variações de personalização: TESTADO');
    
    console.log('\n🎯 INSTRUÇÕES PARA TESTE VISUAL:');
    console.log('1. Acesse: http://localhost:3145');
    console.log('2. Vá para a página de Orçamentos');
    console.log(`3. Localize o orçamento: ${orcamentoTeste.numero}`);
    console.log('4. Clique em "Baixar PDF" ou "Visualizar"');
    console.log('5. Verifique se as cores e fontes estão aplicadas');
    console.log('6. Teste diferentes configurações na página de Configurações');
    
    console.log('\n📋 VERIFICAÇÕES MANUAIS NECESSÁRIAS:');
    console.log('• PDF gerado contém as cores personalizadas');
    console.log('• Fontes estão sendo aplicadas corretamente');
    console.log('• Layout está respeitando as configurações');
    console.log('• Logo está na posição configurada (se aplicável)');
    console.log('• Validade do orçamento está correta');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    console.log('💡 Certifique-se de que o servidor está rodando em http://localhost:3145');
  }
}

// Executar o teste
testarGeracaoPDFPersonalizado();