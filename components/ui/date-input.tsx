"use client"

import React, { useState, useEffect } from 'react'
import { Input } from './input'
import { cn } from '@/lib/utils'

interface DateInputProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function DateInput({ 
  value = '', 
  onChange, 
  placeholder = 'dd/mm/aaaa', 
  className, 
  disabled 
}: DateInputProps) {
  const [displayValue, setDisplayValue] = useState('')

  // Converte ISO para formato brasileiro
  const isoToBrazilian = (isoDate: string): string => {
    if (!isoDate) return ''
    const date = new Date(isoDate + 'T00:00:00')
    if (isNaN(date.getTime())) return ''
    
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear().toString()
    
    return `${day}/${month}/${year}`
  }

  // Converte formato brasileiro para ISO
  const brazilianToIso = (brazilianDate: string): string => {
    if (!brazilianDate || brazilianDate.length !== 10) return ''
    
    const [day, month, year] = brazilianDate.split('/')
    if (!day || !month || !year) return ''
    
    const dayNum = parseInt(day, 10)
    const monthNum = parseInt(month, 10)
    const yearNum = parseInt(year, 10)
    
    // Validação básica
    if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900 || yearNum > 2100) {
      return ''
    }
    
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  // Aplica máscara de entrada
  const applyMask = (input: string): string => {
    // Remove tudo que não é número
    const numbers = input.replace(/\D/g, '')
    
    // Aplica a máscara dd/mm/aaaa
    if (numbers.length <= 2) {
      return numbers
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`
    } else {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`
    }
  }

  // Valida se a data é válida
  const isValidDate = (dateString: string): boolean => {
    if (dateString.length !== 10) return false
    
    const [day, month, year] = dateString.split('/')
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    
    return date.getDate() === parseInt(day) &&
           date.getMonth() === parseInt(month) - 1 &&
           date.getFullYear() === parseInt(year)
  }

  // Atualiza o valor de exibição quando o valor prop muda
  useEffect(() => {
    setDisplayValue(isoToBrazilian(value))
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    const maskedValue = applyMask(inputValue)
    
    setDisplayValue(maskedValue)
    
    // Se a data está completa e válida, converte para ISO e chama onChange
    if (maskedValue.length === 10 && isValidDate(maskedValue)) {
      const isoValue = brazilianToIso(maskedValue)
      onChange?.(isoValue)
    } else if (maskedValue === '') {
      onChange?.('')
    }
  }

  return (
    <Input
      type="text"
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={cn(className)}
      disabled={disabled}
      maxLength={10}
    />
  )
}