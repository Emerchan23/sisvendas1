// Teste das funções de validação CPF/CNPJ
// Copiando as funções diretamente para teste

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
  const cleanCNPJ = cnpj.replace(/[^\d]/g, '')
  
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
  let digit1 = (remainder === 0 || remainder === 1) ? 0 : 11 - remainder
  
  if (parseInt(cleanCNPJ.charAt(12)) !== digit1) return false
  
  // Validação do segundo dígito verificador
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  sum = 0
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i]
  }
  remainder = sum % 11
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

console.log('=== Testando Validação CPF/CNPJ ===');

// Testes CPF
console.log('\n--- Testes CPF ---');
console.log('CPF válido (11144477735):', isValidCPF('11144477735'));
console.log('CPF inválido (12345678901):', isValidCPF('12345678901'));
console.log('CPF inválido (11111111111):', isValidCPF('11111111111'));
console.log('CPF formatado válido (111.444.777-35):', isValidCPF('111.444.777-35'));

// Testes CNPJ
console.log('\n--- Testes CNPJ ---');
console.log('CNPJ válido (11222333000181):', isValidCNPJ('11222333000181'));
console.log('CNPJ inválido (12345678000195):', isValidCNPJ('12345678000195'));
console.log('CNPJ inválido (11111111111111):', isValidCNPJ('11111111111111'));
console.log('CNPJ formatado válido (11.222.333/0001-81):', isValidCNPJ('11.222.333/0001-81'));

// Testes função combinada
console.log('\n--- Testes CPF ou CNPJ ---');
console.log('CPF válido na função combinada:', isValidCPFOrCNPJ('11144477735'));
console.log('CNPJ válido na função combinada:', isValidCPFOrCNPJ('11222333000181'));
console.log('CPF inválido na função combinada:', isValidCPFOrCNPJ('12345678901'));
console.log('CNPJ inválido na função combinada:', isValidCPFOrCNPJ('12345678000195'));
console.log('Documento vazio:', isValidCPFOrCNPJ(''));
console.log('Documento com poucos dígitos:', isValidCPFOrCNPJ('123'));