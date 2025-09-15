// Copiando as funções de validação do arquivo masks.ts
function isValidCPF(cpf) {
  const cleanCPF = cpf.replace(/\D/g, '')
  
  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) return false
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false
  
  // Validação do primeiro dígito verificador
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i)
  }
  let remainder = 11 - (sum % 11)
  let digit1 = remainder < 2 ? 0 : remainder
  
  if (parseInt(cleanCPF.charAt(9)) !== digit1) return false
  
  // Validação do segundo dígito verificador
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i)
  }
  remainder = 11 - (sum % 11)
  let digit2 = remainder < 2 ? 0 : remainder
  
  return parseInt(cleanCPF.charAt(10)) === digit2
}

function isValidCNPJ(cnpj) {
  const cleanCNPJ = cnpj.replace(/\D/g, '')
  
  // Verifica se tem 14 dígitos
  if (cleanCNPJ.length !== 14) return false
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false
  
  // Verifica CNPJs conhecidos como inválidos (sequenciais ou padrões comuns)
  const invalidCNPJs = [
    '12345678000195', '11111111111111', '22222222222222', '33333333333333',
    '44444444444444', '55555555555555', '66666666666666', '77777777777777',
    '88888888888888', '99999999999999', '00000000000000'
  ]
  if (invalidCNPJs.includes(cleanCNPJ)) return false
  
  // Validação do primeiro dígito verificador
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i]
  }
  let remainder = sum % 11
  // Regra correta: se resto for 0 ou 1, dígito é 0; senão é 11 - resto
  let digit1 = (remainder === 0 || remainder === 1) ? 0 : 11 - remainder
  
  if (parseInt(cleanCNPJ.charAt(12)) !== digit1) return false
  
  // Validação do segundo dígito verificador
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  sum = 0
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i]
  }
  remainder = sum % 11
  // Regra correta: se resto for 0 ou 1, dígito é 0; senão é 11 - resto
  let digit2 = (remainder === 0 || remainder === 1) ? 0 : 11 - remainder
  
  return parseInt(cleanCNPJ.charAt(13)) === digit2
}

function isValidCPFOrCNPJ(document) {
  const cleanDocument = document.replace(/\D/g, '')
  
  if (cleanDocument.length === 11) {
    return isValidCPF(document)
  } else if (cleanDocument.length === 14) {
    return isValidCNPJ(document)
  }
  
  return false
}

// Teste de CPFs inválidos
const invalidCPFs = [
  '123.456.789-09', // CPF inválido usado no teste
  '111.111.111-11', // Todos os dígitos iguais
  '000.000.000-00', // Zeros
  '123.456.789-00', // Dígitos verificadores incorretos
  '12345678909',    // Sem formatação
];

// Teste de CPFs válidos
const validCPFs = [
  '123.456.789-09', // Este deveria ser inválido, mas vamos testar
  '111.444.777-35', // CPF válido
  '123.456.789-10', // Outro teste
];

// Teste de CNPJs inválidos
const invalidCNPJs = [
  '11.111.111/1111-11', // Todos os dígitos iguais
  '12.345.678/0001-90', // CNPJ inválido
  '00.000.000/0000-00', // Zeros
];

// Teste de CNPJs válidos
const validCNPJs = [
  '11.222.333/0001-81', // CNPJ válido
  '12.345.678/0001-95', // Outro CNPJ válido
];

console.log('=== TESTE DE VALIDAÇÃO CPF/CNPJ ===\n');

console.log('CPFs INVÁLIDOS (devem retornar false):');
invalidCPFs.forEach(cpf => {
  const result = isValidCPFOrCNPJ(cpf);
  console.log(`${cpf}: ${result} ${result ? '❌ ERRO - deveria ser inválido!' : '✅ OK'}`);
});

console.log('\nCPFs VÁLIDOS (devem retornar true):');
validCPFs.forEach(cpf => {
  const result = isValidCPFOrCNPJ(cpf);
  console.log(`${cpf}: ${result} ${result ? '✅ OK' : '❌ ERRO - deveria ser válido!'}`);
});

console.log('\nCNPJs INVÁLIDOS (devem retornar false):');
invalidCNPJs.forEach(cnpj => {
  const result = isValidCPFOrCNPJ(cnpj);
  console.log(`${cnpj}: ${result} ${result ? '❌ ERRO - deveria ser inválido!' : '✅ OK'}`);
});

console.log('\nCNPJs VÁLIDOS (devem retornar true):');
validCNPJs.forEach(cnpj => {
  const result = isValidCPFOrCNPJ(cnpj);
  console.log(`${cnpj}: ${result} ${result ? '✅ OK' : '❌ ERRO - deveria ser válido!'}`);
});

// Teste específico do CPF usado no teste automatizado
console.log('\n=== TESTE ESPECÍFICO DO CPF DO TESTE AUTOMATIZADO ===');
const testCPF = '123.456.789-09';
const testResult = isValidCPFOrCNPJ(testCPF);
console.log(`CPF do teste: ${testCPF}`);
console.log(`Resultado: ${testResult}`);
console.log(`Status: ${testResult ? '❌ PROBLEMA - Este CPF é inválido mas está sendo aceito!' : '✅ OK - CPF inválido rejeitado corretamente'}`);