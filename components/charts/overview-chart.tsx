"use client"

import React from "react"
import {
  LineChart as RLineChart,
  Line,
  BarChart as RBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts"
import { fmtCurrency } from "@/lib/format"

type Point = { name: string; vendas?: number; lucros?: number; impostos?: number; despesas?: number; lucroLiquido?: number }

export function OverviewChart({
  data = [],
  type = "bar",
}: {
  data?: Point[]
  type?: "bar" | "line"
}) {
  // Garantir que data seja sempre um array válido
  const safeData = React.useMemo(() => {
    if (!Array.isArray(data)) {
      return []
    }

    const validData = data.filter(item => {
      const isValid = item && 
        typeof item.name === 'string' && 
        (typeof item.vendas === 'number' || typeof item.lucros === 'number' || 
         typeof item.impostos === 'number' || typeof item.despesas === 'number' || 
         typeof item.lucroLiquido === 'number')
      return isValid
    })
    return validData
  }, [data])
  
  // Se não há dados válidos, mostrar mensagem
  if (safeData.length === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center text-muted-foreground">
        Nenhum dado disponível para exibir
      </div>
    )
  }
  // Formatador customizado para o tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${fmtCurrency(entry.value || 0)}`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  // Formatador para o eixo Y
  const formatYAxis = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(1)}K`
    }
    return fmtCurrency(value)
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {type === "bar" ? (
          <RBarChart data={safeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={formatYAxis} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="vendas" fill="hsl(200 84% 70%)" name="Vendas" />
            <Bar dataKey="lucros" fill="hsl(142 76% 36%)" name="Lucros" />
            <Bar dataKey="lucroLiquido" fill="hsl(120 100% 25%)" name="Lucro Líquido" />
            <Bar dataKey="despesas" fill="hsl(0 84% 60%)" name="Despesas" />
            <Bar dataKey="impostos" fill="hsl(24 95% 53%)" name="Impostos" />
          </RBarChart>
        ) : (
          <RLineChart data={safeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={formatYAxis} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line type="monotone" dataKey="vendas" stroke="hsl(200 84% 70%)" name="Vendas" />
            <Line type="monotone" dataKey="lucros" stroke="hsl(142 76% 36%)" name="Lucros" />
            <Line type="monotone" dataKey="lucroLiquido" stroke="hsl(120 100% 25%)" name="Lucro Líquido" />
            <Line type="monotone" dataKey="despesas" stroke="hsl(0 84% 60%)" name="Despesas" />
            <Line type="monotone" dataKey="impostos" stroke="hsl(24 95% 53%)" name="Impostos" />
          </RLineChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
