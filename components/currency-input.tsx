import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'

interface CurrencyInputProps {
  value: number
  onChange: (value: number) => void
  placeholder?: string
  className?: string
  allowNegative?: boolean
  onError?: (error: string | null) => void
  id?: string
}

export function CurrencyInput({ value, onChange, placeholder = "0,00", className, allowNegative = false, onError, id }: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Converter string para número (formato brasileiro)
  const parseCurrency = (str: string): number => {
    if (!str) return 0
    // Remove pontos (separadores de milhares) e substitui vírgula por ponto
    const cleanStr = str.replace(/\./g, '').replace(',', '.')
    const num = parseFloat(cleanStr)
    return isNaN(num) ? 0 : num
  }

  // Formatar número para exibição brasileira
  const formatCurrency = (num: number): string => {
    if (num === 0 || isNaN(num)) return ''
    return num.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  // Validar entrada permitindo apenas números, pontos e vírgula
  const isValidInput = (str: string): boolean => {
    // Permite números, pontos, vírgula e opcionalmente sinal de menos
    const regex = allowNegative ? /^-?[0-9.,]*$/ : /^[0-9.,]*$/
    if (!regex.test(str)) return false
    
    // Se não permite negativo, não pode começar com -
    if (!allowNegative && str.startsWith('-')) return false
    
    // Máximo uma vírgula
    const commaCount = (str.match(/,/g) || []).length
    if (commaCount > 1) return false
    
    // Se tem vírgula, máximo 2 dígitos depois
    if (str.includes(',')) {
      const parts = str.split(',')
      if (parts[1] && parts[1].length > 2) return false
    }
    
    return true
  }

  // Atualizar display quando value prop mudar (apenas se não estiver focado)
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatCurrency(value))
    }
  }, [value, isFocused])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    
    // Validar entrada
    if (isValidInput(inputValue)) {
      setDisplayValue(inputValue)
      
      // Converter para número e validar
      const numericValue = parseCurrency(inputValue)
      
      // Validar valores negativos
      if (!allowNegative && numericValue < 0) {
        const errorMsg = "Valores negativos não são permitidos"
        setError(errorMsg)
        if (onError) onError(errorMsg)
        return
      } else {
        setError(null)
        if (onError) onError(null)
      }
      
      onChange(numericValue)
    }
  }

  const handleFocus = () => {
    setIsFocused(true)
  }

  const handleBlur = () => {
    setIsFocused(false)
    // Reformatar o valor ao perder o foco
    const numericValue = parseCurrency(displayValue)
    setDisplayValue(formatCurrency(numericValue))
  }

  return (
    <div className="space-y-1">
      <Input
        id={id}
        type="text"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`${className} ${error ? 'border-red-500 focus:border-red-500' : ''}`}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}