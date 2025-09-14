export const fmtCurrency = (n: number | undefined | null) => {
  if (n === null || n === undefined || isNaN(n)) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(0)
  }
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)
}

export const fmtDate = (d: string | Date | null | undefined) => {
  if (!d) return '-'
  const date = new Date(d)
  if (isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat("pt-BR").format(date)
}

// Converte string com vírgula para número
export function parseDecimal(value: string | number | null | undefined): number {
  if (!value && value !== 0) {
    return 0
  }
  
  const normalized = String(value).replace(/[^\d,-]/g, '').replace(',', '.')
  const parsed = parseFloat(normalized)
  const result = isNaN(parsed) ? 0 : parsed
  return result
}

// Formata número para exibição com vírgula
export const formatDecimal = (value: number | string): string => {
  if (value === '' || value === null || value === undefined) return ''
  const num = typeof value === 'string' ? parseDecimal(value) : value
  return num.toString().replace('.', ',')
}
