const puppeteer = require('puppeteer');
const Database = require('better-sqlite3');
const path = require('path');

// Configuração
const BASE_URL = 'http://localhost:3145';
const dbPath = path.join(__dirname, '..', 'Banco de dados Aqui', 'erp.sqlite');

async function testSMTPDetailed() {
    let browser;
    let db;
    
    try {
        console.log('🚀 Iniciando teste detalhado da configuração SMTP...');
        
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
        console.log('🌐 Navegando para', BASE_URL);
        await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
        
        // Aguardar carregamento
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('\n📋 === TESTE DETALHADO DA ABA CONFIGURAÇÕES ===');
        
        // Navegar diretamente para configurações
        console.log('🔍 Navegando para aba Configurações...');
        await page.goto(`${BASE_URL}/configuracoes`, { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Procurar pela aba E-mail
        console.log('📧 Procurando aba E-mail...');
        
        // Tentar clicar na aba E-mail com seletores corretos
        const emailTabSelectors = [
            'button[value="email"]',
            '[role="tab"][value="email"]',
            'button:contains("E-mail")',
            'button[data-state="inactive"][value="email"]'
        ];
        
        let emailTabFound = false;
        for (const selector of emailTabSelectors) {
            try {
                // Para seletores com :contains, usar evaluate
                if (selector.includes(':contains')) {
                    const emailTab = await page.evaluate(() => {
                        const buttons = Array.from(document.querySelectorAll('button'));
                        return buttons.find(btn => btn.textContent?.includes('E-mail'));
                    });
                    if (emailTab) {
                        console.log(`✅ Aba E-mail encontrada com texto`);
                        await page.evaluate(() => {
                            const buttons = Array.from(document.querySelectorAll('button'));
                            const emailBtn = buttons.find(btn => btn.textContent?.includes('E-mail'));
                            if (emailBtn) emailBtn.click();
                        });
                        emailTabFound = true;
                        break;
                    }
                } else {
                    const emailTab = await page.$(selector);
                    if (emailTab) {
                        await emailTab.click();
                        console.log(`✅ Clicou na aba E-mail com seletor: ${selector}`);
                        emailTabFound = true;
                        break;
                    }
                }
            } catch (e) {
                // Continuar tentando
            }
        }
        
        if (!emailTabFound) {
            // Tentar encontrar usando evaluate
            const emailTabClicked = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const emailButton = buttons.find(btn => 
                    btn.textContent && btn.textContent.toLowerCase().includes('e-mail')
                );
                if (emailButton) {
                    emailButton.click();
                    return true;
                }
                return false;
            });
            
            if (emailTabClicked) {
                console.log('✅ Clicou na aba E-mail usando evaluate');
                emailTabFound = true;
            }
        }
        
        if (!emailTabFound) {
            console.log('⚠️ Aba E-mail não encontrada, continuando mesmo assim...');
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('\n📧 === TESTANDO CAMPOS SMTP ===');
        
        // Dados de teste SMTP
        const smtpTestData = {
            smtpHost: 'smtp.gmail.com',
            smtpPort: '587',
            smtpUser: 'teste@gmail.com',
            smtpPassword: 'senha123',
            smtpFromName: 'Sistema ERP Teste',
            smtpFromEmail: 'noreply@sistema.com'
        };
        
        // Campos SMTP com IDs corretos
        const smtpFields = [
            { id: 'smtpHost', value: smtpTestData.smtpHost, label: 'Servidor SMTP' },
            { id: 'smtpPort', value: smtpTestData.smtpPort, label: 'Porta SMTP' },
            { id: 'smtpUser', value: smtpTestData.smtpUser, label: 'Usuário SMTP' },
            { id: 'smtpPassword', value: smtpTestData.smtpPassword, label: 'Senha SMTP' },
            { id: 'smtpFromName', value: smtpTestData.smtpFromName, label: 'Nome do Remetente' },
            { id: 'smtpFromEmail', value: smtpTestData.smtpFromEmail, label: 'Email do Remetente' }
        ];
        
        let camposPreenchidos = 0;
        
        for (const field of smtpFields) {
            console.log(`🔍 Procurando campo: ${field.label} (ID: ${field.id})`);
            
            try {
                // Aguardar o campo aparecer
                await page.waitForSelector(`#${field.id}`, { timeout: 5000 });
                
                const fieldElement = await page.$(`#${field.id}`);
                if (fieldElement) {
                    // Limpar campo e preencher
                    await fieldElement.click({ clickCount: 3 });
                    await fieldElement.type(field.value);
                    console.log(`  ✅ Preenchido: ${field.label} = ${field.value}`);
                    camposPreenchidos++;
                } else {
                    console.log(`  ⚠️ Campo não encontrado: ${field.label}`);
                }
            } catch (e) {
                console.log(`  ❌ Erro ao preencher ${field.label}: ${e.message}`);
            }
        }
        
        console.log(`\n📊 Campos SMTP preenchidos: ${camposPreenchidos}/${smtpFields.length}`);
        
        // Procurar checkbox SMTP Secure
        console.log('\n🔒 Procurando checkbox SMTP Secure...');
        try {
            const secureCheckbox = await page.$('#smtpSecure');
            if (secureCheckbox) {
                await secureCheckbox.click();
                console.log('✅ Checkbox SMTP Secure marcado');
            } else {
                console.log('⚠️ Checkbox SMTP Secure não encontrado');
            }
        } catch (e) {
            console.log('❌ Erro ao marcar checkbox SMTP Secure:', e.message);
        }
        
        // Procurar e clicar no botão salvar SMTP
        console.log('\n💾 Procurando botão salvar SMTP...');
        
        let saveButtonClicked = false;
        try {
            const saveButton = await page.evaluateHandle(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                return buttons.find(button => {
                    const text = button.textContent || '';
                    return text.includes('Salvar Configurações SMTP');
                });
            });
            
            if (saveButton.asElement()) {
                console.log('✅ Botão "Salvar Configurações SMTP" encontrado');
                await saveButton.asElement().click();
                console.log('💾 Configurações SMTP salvas!');
                saveButtonClicked = true;
                
                // Aguardar processamento
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        } catch (e) {
            console.log('⚠️ Botão salvar SMTP não encontrado:', e.message);
        }
        
        console.log('\n🔄 === TESTE DE PERSISTÊNCIA ===');
        console.log('🔄 Recarregando página para testar persistência...');
        
        // Recarregar página
        await page.reload({ waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Navegar novamente para configurações e aba email
        await page.goto(`${BASE_URL}/configuracoes`, { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Clicar na aba E-mail novamente
        if (emailTabFound) {
            await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const emailButton = buttons.find(btn => 
                    btn.textContent && btn.textContent.toLowerCase().includes('e-mail')
                );
                if (emailButton) {
                    emailButton.click();
                }
            });
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        console.log('\n🔍 === VERIFICANDO PERSISTÊNCIA NO BANCO ===');
        
        // Verificar no banco de dados
        const configFromDB = db.prepare(`
            SELECT smtp_host, smtp_port, smtp_user, smtp_password, smtp_from_name, smtp_from_email, smtp_secure
            FROM empresas 
            LIMIT 1
        `).get();
        
        let dadosPersistidos = 0;
        if (configFromDB) {
            console.log('✅ Configurações encontradas no banco:');
            console.log(`  📧 SMTP Host: ${configFromDB.smtp_host || 'NÃO DEFINIDO'}`);
            console.log(`  🔌 SMTP Port: ${configFromDB.smtp_port || 'NÃO DEFINIDO'}`);
            console.log(`  👤 SMTP User: ${configFromDB.smtp_user || 'NÃO DEFINIDO'}`);
            console.log(`  🔑 SMTP Password: ${configFromDB.smtp_password ? '***DEFINIDA***' : 'NÃO DEFINIDA'}`);
            console.log(`  📝 From Name: ${configFromDB.smtp_from_name || 'NÃO DEFINIDO'}`);
            console.log(`  📧 From Email: ${configFromDB.smtp_from_email || 'NÃO DEFINIDO'}`);
            console.log(`  🔒 SMTP Secure: ${configFromDB.smtp_secure ? 'SIM' : 'NÃO'}`);
            
            // Verificar se os dados foram salvos corretamente
            if (configFromDB.smtp_host === smtpTestData.smtpHost) dadosPersistidos++;
            if (configFromDB.smtp_port == smtpTestData.smtpPort) dadosPersistidos++;
            if (configFromDB.smtp_user === smtpTestData.smtpUser) dadosPersistidos++;
            if (configFromDB.smtp_password === smtpTestData.smtpPassword) dadosPersistidos++;
            if (configFromDB.smtp_from_name === smtpTestData.smtpFromName) dadosPersistidos++;
            if (configFromDB.smtp_from_email === smtpTestData.smtpFromEmail) dadosPersistidos++;
            
            console.log(`\n📊 Dados persistidos corretamente no banco: ${dadosPersistidos}/6`);
        } else {
            console.log('❌ Nenhuma configuração encontrada no banco');
        }
        
        console.log('\n🔍 === VERIFICANDO PERSISTÊNCIA NA INTERFACE ===');
        
        // Verificar se os campos ainda estão preenchidos na interface
        let camposPersistidosInterface = 0;
        
        for (const field of smtpFields) {
            try {
                const fieldElement = await page.$(`#${field.id}`);
                if (fieldElement) {
                    const value = await fieldElement.evaluate(el => el.value);
                    if (value === field.value) {
                        console.log(`  ✅ ${field.label}: Valor persistido na interface`);
                        camposPersistidosInterface++;
                    } else {
                        console.log(`  ⚠️ ${field.label}: Valor diferente (esperado: ${field.value}, atual: ${value})`);
                    }
                } else {
                    console.log(`  ❌ ${field.label}: Campo não encontrado na interface`);
                }
            } catch (e) {
                console.log(`  ❌ Erro ao verificar ${field.label}: ${e.message}`);
            }
        }
        
        console.log(`\n📊 Campos persistidos na interface: ${camposPersistidosInterface}/${smtpFields.length}`);
        
        // Relatório final
        console.log('\n🎉 === RELATÓRIO FINAL SMTP ===');
        console.log(`✅ Campos preenchidos: ${camposPreenchidos}/${smtpFields.length}`);
        console.log(`✅ Botão salvar clicado: ${saveButtonClicked ? 'SIM' : 'NÃO'}`);
        console.log(`✅ Dados no banco: ${dadosPersistidos}/6`);
        console.log(`✅ Interface persistida: ${camposPersistidosInterface}/${smtpFields.length}`);
        
        const pontuacaoTotal = camposPreenchidos + dadosPersistidos + camposPersistidosInterface + (saveButtonClicked ? 1 : 0);
        const pontuacaoMaxima = smtpFields.length + 6 + smtpFields.length + 1;
        
        console.log(`\n🏆 PONTUAÇÃO FINAL: ${pontuacaoTotal}/${pontuacaoMaxima}`);
        
        if (pontuacaoTotal >= pontuacaoMaxima * 0.8) {
            console.log('🎊 CONFIGURAÇÃO SMTP: EXCELENTE!');
        } else if (pontuacaoTotal >= pontuacaoMaxima * 0.6) {
            console.log('👍 CONFIGURAÇÃO SMTP: BOA!');
        } else {
            console.log('⚠️ CONFIGURAÇÃO SMTP: PRECISA MELHORAR');
        }
        
        // Teste de conexão SMTP
        console.log('\n🧪 === TESTANDO CONEXÃO SMTP ===');
        try {
            const testButton = await page.evaluateHandle(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                return buttons.find(button => {
                    const text = button.textContent || '';
                    return text.includes('Testar Conexão');
                });
            });
            
            if (testButton.asElement()) {
                console.log('🧪 Testando conexão SMTP...');
                await testButton.asElement().click();
                await new Promise(resolve => setTimeout(resolve, 5000));
                console.log('✅ Teste de conexão executado');
            } else {
                console.log('⚠️ Botão de teste de conexão não encontrado');
            }
        } catch (e) {
            console.log('❌ Erro ao testar conexão:', e.message);
        }
        
    } catch (error) {
        console.error('❌ Erro durante teste SMTP:', error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
        if (db) {
            db.close();
        }
    }
}

// Executar teste
testSMTPDetailed();