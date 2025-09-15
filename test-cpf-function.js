// Teste direto da função isValidCPFOrCNPJ
// Copiando as funções do masks.ts para JavaScript

function isValidCPF(cpf) {
  const cleanCPF = cpf.replace(/\D/g, '')
  
  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) return false
  
  // Verifica se todos os dígitos são iguais (CPFs inválidos conhecidos)
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false
  
  // Lista de CPFs conhecidos como inválidos
  const invalidCPFs = [
    '12345678909', '98765432100', '11111111111', '22222222222',
    '33333333333', '44444444444', '55555555555', '66666666666',
    '77777777777', '88888888888', '99999999999', '00000000000'
  ]
  if (invalidCPFs.includes(cleanCPF)) return false
  
  // Validação do primeiro dígito verificador
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i)
  }
  let remainder = sum % 11
  let digit1 = remainder < 2 ? 0 : 11 - remainder
  
  if (parseInt(cleanCPF.charAt(9)) !== digit1) return false
  
  // Validação do segundo dígito verificador
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i)
  }
  remainder = sum % 11
  let digit2 = remainder < 2 ? 0 : 11 - remainder
  
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

// Teste com CPF inválido usado no teste
const cpfInvalido = '123.456.789-00';
const cpfValido = '111.444.777-35';

console.log('=== TESTE DA FUNÇÃO isValidCPFOrCNPJ ===');
console.log(`CPF inválido (${cpfInvalido}):`, isValidCPFOrCNPJ(cpfInvalido));
console.log(`CPF válido (${cpfValido}):`, isValidCPFOrCNPJ(cpfValido));

// Teste com números limpos
const cpfInvalidoLimpo = '12345678900';
const cpfValidoLimpo = '11144477735';

console.log(`\nCPF inválido limpo (${cpfInvalidoLimpo}):`, isValidCPFOrCNPJ(cpfInvalidoLimpo));
console.log(`CPF válido limpo (${cpfValidoLimpo}):`, isValidCPFOrCNPJ(cpfValidoLimpo));

// Teste adicional com CPF vazio
console.log(`\nCPF do teste ('12345678909'):`, isValidCPFOrCNPJ('12345678909'));
console.log(`CPF vazio (''):`, isValidCPFOrCNPJ(''));
console.log(`CPF com poucos dígitos ('123'):`, isValidCPFOrCNPJ('123'));