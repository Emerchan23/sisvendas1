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
 * Valida se CNPJ está completo (14 dígitos)
 */
export function isValidCNPJ(value: string): boolean {
  const numbers = unformatCNPJ(value)
  return numbers.length === 14
}

/**
 * Valida se telefone está completo (10 ou 11 dígitos)
 */
export function isValidPhone(value: string): boolean {
  const numbers = unformatPhone(value)
  return numbers.length === 10 || numbers.length === 11
}