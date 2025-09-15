/**
 * Utilitários para formatação de máscaras de entrada
 */

/**
 * Aplica máscara de CNPJ (00.000.000/0000-00)
 */
export function formatCNPJ(value: string): string {
  // Verifica se o valor é válido
  if (!value || typeof value !== 'string') {
    return ''
  }
  
  // Remove todos os caracteres não numéricos
  const numbers = value.replace(/\D/g, '')
  
  // Aplica a máscara progressivamente
  if (numbers.length <= 2) {
    return numbers
  } else if (numbers.length <= 5) {
    return `${numbers.slice(0, 2)}.${numbers.slice(2)}`
  } else if (numbers.length <= 8) {
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`
  } else if (numbers.length <= 12) {
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`
  } else {
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`
  }
}

/**
 * Aplica máscara de telefone (00) 00000-0000
 */
export function formatPhone(value: string): string {
  // Verifica se o valor é válido
  if (!value || typeof value !== 'string') {
    return ''
  }
  
  // Remove todos os caracteres não numéricos
  const numbers = value.replace(/\D/g, '')
  
  // Aplica a máscara progressivamente
  if (numbers.length <= 2) {
    return numbers
  } else if (numbers.length <= 7) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
  } else {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
  }
}

/**
 * Remove máscara de CNPJ, retornando apenas números
 */
export function unformatCNPJ(value: string): string {
  if (!value || typeof value !== 'string') {
    return ''
  }
  return value.replace(/\D/g, '')
}

/**
 * Remove máscara de telefone, retornando apenas números
 */
export function unformatPhone(value: string): string {
  if (!value || typeof value !== 'string') {
    return ''
  }
  return value.replace(/\D/g, '')
}

/**
 * Valida se um CPF é válido
 * @param cpf CPF para validar
 * @returns true se válido, false caso contrário
 */
export function isValidCPF(cpf: string): boolean {
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

/**
 * Valida se um CNPJ é válido
 * @param cnpj CNPJ para validar
 * @returns true se válido, false caso contrário
 */
export function isValidCNPJ(cnpj: string): boolean {
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

/**
 * Valida se um CPF ou CNPJ é válido
 * @param document CPF ou CNPJ para validar
 * @returns true se válido, false caso contrário
 */
export function isValidCPFOrCNPJ(document: string): boolean {
  const cleanDocument = document.replace(/\D/g, '')
  
  if (cleanDocument.length === 11) {
    return isValidCPF(document)
  } else if (cleanDocument.length === 14) {
    return isValidCNPJ(document)
  }
  
  return false
}

/**
 * Valida se telefone está completo (10 ou 11 dígitos)
 */
export function isValidPhone(value: string): boolean {
  const numbers = unformatPhone(value)
  return numbers.length === 10 || numbers.length === 11
}