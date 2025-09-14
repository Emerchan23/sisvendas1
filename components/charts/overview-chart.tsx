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
  Cell,
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
  
  // Paleta de cores moderna com gradientes
  const modernColors = {
    vendas: {
      primary: "#3B82F6",
      gradient: "url(#vendasGradient)"
    },
    lucros: {
      primary: "#10B981", 
      gradient: "url(#lucrosGradient)"
    },
    lucroLiquido: {
      primary: "#059669",
      gradient: "url(#lucroLiquidoGradient)"
    },
    despesas: {
      primary: "#EF4444",
      gradient: "url(#despesasGradient)"
    },
    impostos: {
      primary: "#F97316",
      gradient: "url(#impostosGradient)"
    }
  }

  // Se não há dados válidos, mostrar mensagem
  if (safeData.length === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-slate-600 font-medium">Nenhum dado disponível</p>
          <p className="text-slate-400 text-sm mt-1">Os dados aparecerão aqui quando disponíveis</p>
        </div>
      </div>
    )
  }
  // Tooltip moderno e elegante
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm p-4 border-0 rounded-xl shadow-2xl ring-1 ring-black/5">
          <div className="mb-3">
            <p className="font-semibold text-slate-800 text-sm">{label}</p>
            <div className="w-8 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 mt-1 rounded-full"></div>
          </div>
          <div className="space-y-2">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full shadow-sm" 
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span className="text-slate-600 text-sm font-medium">{entry.name}</span>
                </div>
                <span className="font-semibold text-slate-800 text-sm">
                  {fmtCurrency(entry.value || 0)}
                </span>
              </div>
            ))}
          </div>
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
          <RBarChart data={safeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="vendasGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.9}/>
                <stop offset="100%" stopColor="#1E40AF" stopOpacity={0.7}/>
              </linearGradient>
              <linearGradient id="lucrosGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.9}/>
                <stop offset="100%" stopColor="#047857" stopOpacity={0.7}/>
              </linearGradient>
              <linearGradient id="lucroLiquidoGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#059669" stopOpacity={0.9}/>
                <stop offset="100%" stopColor="#065F46" stopOpacity={0.7}/>
              </linearGradient>
              <linearGradient id="despesasGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EF4444" stopOpacity={0.9}/>
                <stop offset="100%" stopColor="#B91C1C" stopOpacity={0.7}/>
              </linearGradient>
              <linearGradient id="impostosGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F97316" stopOpacity={0.9}/>
                <stop offset="100%" stopColor="#C2410C" stopOpacity={0.7}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.6} />
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#64748B' }}
            />
            <YAxis 
              tickFormatter={formatYAxis}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#64748B' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
            <Bar 
              dataKey="vendas" 
              fill={modernColors.vendas.gradient}
              name="Vendas"
              radius={[4, 4, 0, 0]}
              animationDuration={1000}
              animationBegin={0}
            />
            <Bar 
              dataKey="lucros" 
              fill={modernColors.lucros.gradient}
              name="Lucros"
              radius={[4, 4, 0, 0]}
              animationDuration={1000}
              animationBegin={200}
            />
            <Bar 
              dataKey="lucroLiquido" 
              fill={modernColors.lucroLiquido.gradient}
              name="Lucro Líquido"
              radius={[4, 4, 0, 0]}
              animationDuration={1000}
              animationBegin={400}
            />
            <Bar 
              dataKey="despesas" 
              fill={modernColors.despesas.gradient}
              name="Despesas"
              radius={[4, 4, 0, 0]}
              animationDuration={1000}
              animationBegin={600}
            />
            <Bar 
              dataKey="impostos" 
              fill={modernColors.impostos.gradient}
              name="Impostos"
              radius={[4, 4, 0, 0]}
              animationDuration={1000}
              animationBegin={800}
            />
          </RBarChart>
        ) : (
          <RLineChart data={safeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="vendasLineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="lucrosLineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.3}/>
                <stop offset="100%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.6} />
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#64748B' }}
            />
            <YAxis 
              tickFormatter={formatYAxis}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#64748B' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
            <Line 
              type="monotone" 
              dataKey="vendas" 
              stroke={modernColors.vendas.primary}
              strokeWidth={3}
              dot={{ fill: modernColors.vendas.primary, strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, stroke: modernColors.vendas.primary, strokeWidth: 2, fill: '#fff' }}
              name="Vendas"
              animationDuration={1500}
            />
            <Line 
              type="monotone" 
              dataKey="lucros" 
              stroke={modernColors.lucros.primary}
              strokeWidth={3}
              dot={{ fill: modernColors.lucros.primary, strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, stroke: modernColors.lucros.primary, strokeWidth: 2, fill: '#fff' }}
              name="Lucros"
              animationDuration={1500}
              animationBegin={200}
            />
            <Line 
              type="monotone" 
              dataKey="lucroLiquido" 
              stroke={modernColors.lucroLiquido.primary}
              strokeWidth={3}
              dot={{ fill: modernColors.lucroLiquido.primary, strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, stroke: modernColors.lucroLiquido.primary, strokeWidth: 2, fill: '#fff' }}
              name="Lucro Líquido"
              animationDuration={1500}
              animationBegin={400}
            />
            <Line 
              type="monotone" 
              dataKey="despesas" 
              stroke={modernColors.despesas.primary}
              strokeWidth={3}
              dot={{ fill: modernColors.despesas.primary, strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, stroke: modernColors.despesas.primary, strokeWidth: 2, fill: '#fff' }}
              name="Despesas"
              animationDuration={1500}
              animationBegin={600}
            />
            <Line 
              type="monotone" 
              dataKey="impostos" 
              stroke={modernColors.impostos.primary}
              strokeWidth={3}
              dot={{ fill: modernColors.impostos.primary, strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, stroke: modernColors.impostos.primary, strokeWidth: 2, fill: '#fff' }}
              name="Impostos"
              animationDuration={1500}
              animationBegin={800}
            />
          </RLineChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
