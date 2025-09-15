// Teste para verificar a validação de URL

// Função de validação copiada do código
const isValidUrl = (url) => {
  if (!url.trim()) return true // URL vazia é válida
  try {
    const urlObj = new URL(url)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return false
  }
}

// Testes
const testUrls = [
  'https://usera.com/logo.png',
  'http://example.com/image.jpg',
  'https://www.google.com/logo.png',
  'invalid-url',
  'ftp://example.com/file.txt',
  '',
  'https://subdomain.example.com/path/to/image.png'
]

console.log('🧪 Testando validação de URLs:')
console.log('================================')

testUrls.forEach(url => {
  const isValid = isValidUrl(url)
  console.log(`URL: "${url}" -> ${isValid ? '✅ Válida' : '❌ Inválida'}`)
})

console.log('\n🔍 Testando especificamente a URL do TC019:')
const tc019Url = 'https://usera.com/logo.png'
const tc019Valid = isValidUrl(tc019Url)
console.log(`TC019 URL: "${tc019Url}" -> ${tc019Valid ? '✅ Válida' : '❌ Inválida'}`)

if (tc019Valid) {
  console.log('\n✅ A validação de URL está funcionando corretamente!')
  console.log('O problema pode estar em outro lugar...')
} else {
  console.log('\n❌ Problema encontrado na validação de URL!')
}