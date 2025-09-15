// Simulação do teste TC019 para identificar o problema de hostname

const puppeteer = require('puppeteer')

async function testTC019() {
  console.log('🧪 Iniciando simulação do TC019...')
  
  let browser
  try {
    browser = await puppeteer.launch({ 
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    const page = await browser.newPage()
    
    // Interceptar erros de console
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Erro no console:', msg.text())
      } else if (msg.type() === 'warning') {
        console.log('⚠️ Aviso no console:', msg.text())
      }
    })
    
    // Interceptar erros de rede
    page.on('response', response => {
      if (!response.ok()) {
        console.log(`❌ Erro de rede: ${response.status()} - ${response.url()}`)
      }
    })
    
    console.log('📱 Navegando para a página inicial...')
    await page.goto('http://localhost:3145', { waitUntil: 'networkidle0' })
    
    // Verificar se precisa fazer login
    const loginForm = await page.$('form')
    if (loginForm) {
      console.log('🔐 Fazendo login...')
      await page.type('#email', 'admin@sistema.com')
      await page.type('#senha', 'admin123')
      await page.click('button[type="submit"]')
      await page.waitForNavigation({ waitUntil: 'networkidle0' })
    }
    
    console.log('📱 Navegando para a página de configurações...')
    await page.goto('http://localhost:3145/configuracoes', { waitUntil: 'networkidle0' })
    
    // Aguardar um pouco para a página carregar completamente
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    console.log('🔍 Procurando campo de URL do logo...')
    await page.waitForSelector('#logoUrl', { timeout: 10000 })
    
    const logoInput = await page.$('#logoUrl')
    
    if (logoInput) {
      console.log('✅ Campo de logo encontrado!')
      
      // Limpar campo e inserir URL do teste
      await logoInput.click({ clickCount: 3 })
      await logoInput.type('https://usera.com/logo.png')
      
      console.log('📝 URL inserida: https://usera.com/logo.png')
      
      // Aguardar um pouco para ver se há erros
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Aguardar resposta do servidor após salvar
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Verificar se há mensagens de erro específicas de hostname ou validação
      const specificErrors = await page.$$eval('*', elements => {
        return elements
          .filter(el => el.textContent && (
            el.textContent.includes('hostname') ||
            el.textContent.includes('inválid') ||
            el.textContent.includes('URL') ||
            el.textContent.includes('formato') ||
            el.className?.includes('error') ||
            el.className?.includes('text-red') ||
            el.style?.color === 'red'
          ))
          .map(el => el.textContent.trim())
          .filter(text => text.length > 0 && text.length < 100)
      })
      
      if (specificErrors.length > 0) {
        console.log('❌ Erros de validação encontrados:')
        specificErrors.forEach(msg => console.log(`  - ${msg}`))
      } else {
        console.log('✅ Nenhum erro de validação encontrado')
      }
      
      // Verificar se a configuração foi salva com sucesso
      const successMessages = await page.$$eval('*', elements => {
        return elements
          .filter(el => el.textContent && (
            el.textContent.includes('sucesso') ||
            el.textContent.includes('salvo') ||
            el.textContent.includes('atualizado') ||
            el.className?.includes('success') ||
            el.className?.includes('text-green')
          ))
          .map(el => el.textContent.trim())
          .filter(text => text.length > 0 && text.length < 100)
      })
      
      if (successMessages.length > 0) {
        console.log('✅ Mensagens de sucesso encontradas:')
        successMessages.forEach(msg => console.log(`  - ${msg}`))
      }
      
      // Tentar salvar as configurações
    console.log('💾 Tentando salvar as configurações...')
    const saveButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      return buttons.find(btn => 
        btn.type === 'submit' || 
        btn.textContent.includes('Salvar') ||
        btn.textContent.includes('salvar')
      )
    })
    
    if (saveButton && saveButton.asElement()) {
      await saveButton.asElement().click()
      console.log('✅ Botão de salvar clicado!')
    } else {
      console.log('❌ Botão de salvar não encontrado')
    }
      
    } else {
      console.log('❌ Campo de logo não encontrado!')
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message)
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

// Verificar se o servidor está rodando
const http = require('http')
const checkServer = () => {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3145', (res) => {
      resolve(true)
    })
    req.on('error', () => {
      resolve(false)
    })
    req.setTimeout(3000, () => {
      req.destroy()
      resolve(false)
    })
  })
}

async function main() {
  console.log('🔍 Verificando se o servidor está rodando...')
  const serverRunning = await checkServer()
  
  if (!serverRunning) {
    console.log('❌ Servidor não está rodando em http://localhost:3145')
    console.log('Por favor, execute "npm run dev" primeiro')
    return
  }
  
  console.log('✅ Servidor está rodando!')
  await testTC019()
}

main().catch(console.error)