const puppeteer = require('puppeteer');
const Database = require('better-sqlite3');
const path = require('path');

// Configuração do banco de dados
const dbPath = path.join(__dirname, '..', 'Banco de dados Aqui', 'erp.sqlite');

async function testSMTPConfiguration() {
    console.log('🚀 Iniciando teste SMTP simplificado...');
    
    let browser;
    let db;
    
    try {
        // Conectar ao banco
        db = new Database(dbPath);
        console.log('✅ Conectado ao banco de dados');
        
        // Iniciar browser
        browser = await puppeteer.launch({ 
            headless: false,
            defaultViewport: null,
            args: ['--start-maximized']
        });
        
        const page = await browser.newPage();
        
        // Navegar para a página de configurações
        console.log('🌐 Navegando para configurações...');
        await page.goto('http://localhost:3145/configuracoes', { waitUntil: 'networkidle0' });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Forçar ativação da aba E-mail usando JavaScript
        console.log('📧 Ativando aba E-mail...');
        const tabActivated = await page.evaluate(() => {
            // Procurar pela aba E-mail
            const tabs = document.querySelectorAll('button[role="tab"]');
            for (let tab of tabs) {
                if (tab.textContent && tab.textContent.includes('E-mail')) {
                    tab.click();
                    return true;
                }
            }
            
            // Tentar com seletor direto
            const emailTab = document.querySelector('button[value="email"]');
            if (emailTab) {
                emailTab.click();
                return true;
            }
            
            return false;
        });
        
        if (tabActivated) {
            console.log('✅ Aba E-mail ativada com sucesso!');
        } else {
            console.log('❌ Não foi possível ativar a aba E-mail');
        }
        
        // Aguardar carregamento da aba
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Testar preenchimento dos campos SMTP
        console.log('\n📧 === TESTANDO CAMPOS SMTP ===');
        
        const smtpData = {
            smtpHost: 'smtp.gmail.com',
            smtpPort: '587',
            smtpUser: 'teste@gmail.com',
            smtpPassword: 'senha123',
            smtpFromName: 'Sistema Teste',
            smtpFromEmail: 'sistema@teste.com'
        };
        
        let fieldsFound = 0;
        let fieldsFilled = 0;
        
        for (const [fieldId, value] of Object.entries(smtpData)) {
            try {
                console.log(`🔍 Procurando campo: ${fieldId}`);
                
                // Tentar encontrar o campo
                const fieldExists = await page.evaluate((id) => {
                    const field = document.querySelector(`#${id}`);
                    return field !== null;
                }, fieldId);
                
                if (fieldExists) {
                    fieldsFound++;
                    console.log(`  ✅ Campo ${fieldId} encontrado`);
                    
                    // Preencher o campo
                    await page.focus(`#${fieldId}`);
                    await page.evaluate((id) => {
                        document.querySelector(`#${id}`).value = '';
                    }, fieldId);
                    await page.type(`#${fieldId}`, value);
                    fieldsFilled++;
                    console.log(`  ✅ Campo ${fieldId} preenchido com: ${value}`);
                } else {
                    console.log(`  ❌ Campo ${fieldId} não encontrado`);
                }
            } catch (error) {
                console.log(`  ❌ Erro ao preencher ${fieldId}:`, error.message);
            }
        }
        
        console.log(`\n📊 Campos encontrados: ${fieldsFound}/6`);
        console.log(`📊 Campos preenchidos: ${fieldsFilled}/6`);
        
        // Procurar e clicar no botão salvar
        console.log('\n💾 Procurando botão salvar...');
        let saveButtonClicked = false;
        
        try {
            const saveButtonExists = await page.evaluate(() => {
                // Procurar por botões que contenham "Salvar" no texto
                const buttons = document.querySelectorAll('button');
                for (let btn of buttons) {
                    if (btn.textContent && btn.textContent.includes('Salvar')) {
                        btn.click();
                        return true;
                    }
                }
                return false;
            });
            
            if (saveButtonExists) {
                console.log('✅ Botão salvar clicado!');
                saveButtonClicked = true;
                await new Promise(resolve => setTimeout(resolve, 2000));
            } else {
                console.log('❌ Botão salvar não encontrado');
            }
        } catch (error) {
            console.log('❌ Erro ao clicar no botão salvar:', error.message);
        }
        
        // Verificar persistência no banco
        console.log('\n🔍 === VERIFICANDO PERSISTÊNCIA NO BANCO ===');
        const stmt = db.prepare('SELECT * FROM configuracoes WHERE config_key LIKE ?');
        const configData = stmt.all('smtp_%');
        
        let dbPersistence = 0;
        const expectedValues = {
            smtp_host: 'smtp.gmail.com',
            smtp_port: '587',
            smtp_user: 'teste@gmail.com',
            smtp_password: 'senha123',
            smtp_from_name: 'Sistema Teste',
            smtp_from_email: 'sistema@teste.com'
        };

        if (configData && configData.length > 0) {
            console.log('📊 Dados encontrados no banco:');
            const configMap = {};
            configData.forEach(row => {
                configMap[row.config_key] = row.config_value;
            });
            
            Object.keys(expectedValues).forEach(key => {
                const value = configMap[key];
                const expected = expectedValues[key];
                const match = value === expected;
                console.log(`  ${match ? '✅' : '❌'} ${key}: ${value || 'null'} ${match ? '(correto)' : `(esperado: ${expected})`}`);
                if (match) dbPersistence++;
            });
        } else {
            console.log('❌ Nenhuma configuração SMTP encontrada no banco');
        }
        
        console.log(`\n📊 Dados persistidos corretamente no banco: ${dbPersistence}/6`);
        
        // Recarregar página para testar persistência na interface
        console.log('\n🔄 === TESTE DE PERSISTÊNCIA NA INTERFACE ===');
        await page.reload({ waitUntil: 'networkidle0' });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Reativar aba E-mail
        await page.evaluate(() => {
            const tabs = document.querySelectorAll('button[role="tab"]');
            for (let tab of tabs) {
                if (tab.textContent && tab.textContent.includes('E-mail')) {
                    tab.click();
                    break;
                }
            }
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Verificar se os valores persistiram na interface
        let interfacePersistence = 0;
        for (const [fieldId, expectedValue] of Object.entries(smtpData)) {
            try {
                const actualValue = await page.evaluate((id) => {
                    const field = document.querySelector(`#${id}`);
                    return field ? field.value : null;
                }, fieldId);
                
                if (actualValue === expectedValue) {
                    console.log(`  ✅ ${fieldId}: ${actualValue}`);
                    interfacePersistence++;
                } else {
                    console.log(`  ❌ ${fieldId}: esperado '${expectedValue}', encontrado '${actualValue}'`);
                }
            } catch (error) {
                console.log(`  ❌ ${fieldId}: Campo não encontrado`);
            }
        }
        
        console.log(`\n📊 Campos persistidos na interface: ${interfacePersistence}/6`);
        
        // Relatório final
        console.log('\n🎉 === RELATÓRIO FINAL SMTP ===');
        console.log(`✅ Campos encontrados: ${fieldsFound}/6`);
        console.log(`✅ Campos preenchidos: ${fieldsFilled}/6`);
        console.log(`✅ Botão salvar clicado: ${saveButtonClicked ? 'SIM' : 'NÃO'}`);
        console.log(`✅ Dados no banco: ${dbPersistence}/6`);
        console.log(`✅ Interface persistida: ${interfacePersistence}/6`);
        
        const totalScore = fieldsFound + fieldsFilled + (saveButtonClicked ? 1 : 0) + dbPersistence + interfacePersistence;
        const maxScore = 6 + 6 + 1 + 6 + 6; // 25 pontos máximos
        
        console.log(`\n🏆 PONTUAÇÃO FINAL: ${totalScore}/${maxScore}`);
        
        if (totalScore >= 20) {
            console.log('🎉 CONFIGURAÇÃO SMTP: EXCELENTE!');
        } else if (totalScore >= 15) {
            console.log('✅ CONFIGURAÇÃO SMTP: BOA!');
        } else if (totalScore >= 10) {
            console.log('⚠️ CONFIGURAÇÃO SMTP: PRECISA MELHORAR');
        } else {
            console.log('❌ CONFIGURAÇÃO SMTP: CRÍTICA!');
        }
        
    } catch (error) {
        console.error('❌ Erro durante o teste:', error);
    } finally {
        if (db) {
            db.close();
            console.log('🔒 Conexão com banco fechada');
        }
        if (browser) {
            await browser.close();
            console.log('🔒 Browser fechado');
        }
    }
}

// Executar o teste
testSMTPConfiguration().catch(console.error);