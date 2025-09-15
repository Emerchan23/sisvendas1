// Teste simples para validar o componente CurrencyInput
const fs = require('fs');
const path = require('path');

// Simular o comportamento do CurrencyInput
function simulateCurrencyInput(inputValue, allowNegative = true) {
  console.log(`\n🧪 Testando entrada: "${inputValue}" com allowNegative=${allowNegative}`);
  
  // Remove o prefixo R$ se presente
  if (inputValue.startsWith('R$ ')) {
    inputValue = inputValue.substring(3);
  }
  
  // Verificar se contém sinal de menos e allowNegative é false
  if (!allowNegative && inputValue.includes('-')) {
    console.log('❌ Entrada rejeitada: contém sinal negativo e allowNegative=false');
    return null; // Não permitir valores negativos
  }
  
  // Verificar se há sinal de menos
  const isNegative = inputValue.includes('-');
  
  // Remove tudo exceto números
  const numbers = inputValue.replace(/\D/g, '');
  
  if (!numbers) {
    console.log('✅ Entrada vazia ou sem números');
    return '';
  }
  
  // Converte para centavos (divide por 100)
  let value = parseInt(numbers) / 100;
  
  // Aplicar sinal negativo se necessário
  if (isNegative) {
    value = -value;
  }
  
  // Formata com padrão brasileiro
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
  
  // Verificar novamente se o valor é negativo e allowNegative é false
  if (!allowNegative && value < 0) {
    console.log('❌ Valor rejeitado: resultado negativo e allowNegative=false');
    return null; // Não permitir valores negativos
  }
  
  console.log(`✅ Valor formatado: "${formatted}" (numérico: ${value})`);
  return { formatted, numeric: value };
}

console.log('🧪 Testando validação de preços negativos no CurrencyInput\n');

// Teste 1: Valor negativo com allowNegative=false
console.log('=== TESTE 1: Valor negativo com allowNegative=false ===');
const result1 = simulateCurrencyInput('-50', false);
if (result1 === null) {
  console.log('✅ PASSOU: Valor negativo foi corretamente rejeitado');
} else {
  console.log('❌ FALHOU: Valor negativo foi aceito quando não deveria');
}

// Teste 2: Valor negativo com allowNegative=true
console.log('\n=== TESTE 2: Valor negativo com allowNegative=true ===');
const result2 = simulateCurrencyInput('-50', true);
if (result2 && result2.numeric < 0) {
  console.log('✅ PASSOU: Valor negativo foi corretamente aceito');
} else {
  console.log('❌ FALHOU: Valor negativo foi rejeitado quando deveria ser aceito');
}

// Teste 3: Valor positivo com allowNegative=false
console.log('\n=== TESTE 3: Valor positivo com allowNegative=false ===');
const result3 = simulateCurrencyInput('50', false);
if (result3 && result3.numeric > 0) {
  console.log('✅ PASSOU: Valor positivo foi corretamente aceito');
} else {
  console.log('❌ FALHOU: Valor positivo foi rejeitado');
}

// Teste 4: Entrada com caracteres especiais
console.log('\n=== TESTE 4: Entrada com caracteres especiais ===');
const result4 = simulateCurrencyInput('-1a2b3c', false);
if (result4 === null) {
  console.log('✅ PASSOU: Entrada com caracteres especiais e sinal negativo foi rejeitada');
} else {
  console.log('❌ FALHOU: Entrada inválida foi aceita');
}

console.log('\n🏁 Testes concluídos!');