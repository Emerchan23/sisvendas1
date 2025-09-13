import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, DollarSign, PiggyBank, Calculator, Receipt, Percent } from "lucide-react"

interface MetricCardProps {
  title: string
  value: string
  icon: 'trending' | 'dollar' | 'piggy' | 'calculator' | 'receipt' | 'percent'
  gradient: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'amber'
  tooltip?: string
}

const iconMap = {
  trending: TrendingUp,
  dollar: DollarSign,
  piggy: PiggyBank,
  calculator: Calculator,
  receipt: Receipt,
  percent: Percent,
}

const gradientMap = {
  blue: 'from-blue-400/20 via-cyan-400/10 to-blue-500/20',
  green: 'from-green-400/20 via-emerald-400/10 to-green-500/20',
  purple: 'from-purple-400/20 via-violet-400/10 to-purple-500/20',
  orange: 'from-orange-400/20 via-amber-400/10 to-orange-500/20',
  red: 'from-red-400/20 via-pink-400/10 to-red-500/20',
  amber: 'from-amber-400/20 via-yellow-400/10 to-amber-500/20',
}

const iconColors = {
  blue: 'text-blue-600',
  green: 'text-green-600',
  purple: 'text-purple-600',
  orange: 'text-orange-600',
  red: 'text-red-600',
  amber: 'text-amber-600',
}

const borderColors = {
  blue: 'border-blue-200/50',
  green: 'border-green-200/50',
  purple: 'border-purple-200/50',
  orange: 'border-orange-200/50',
  red: 'border-red-200/50',
  amber: 'border-amber-200/50',
}

export function MetricCard({ 
  title = "Métrica", 
  value = "-", 
  hint = "",
  icon = 'dollar',
  gradient = 'blue'
}: MetricCardProps) {
  const IconComponent = iconMap[icon]
  const gradientClass = gradientMap[gradient as keyof typeof gradientMap] || gradientMap.blue
  const iconColor = iconColors[gradient as keyof typeof iconColors] || iconColors.blue
  const borderColor = borderColors[gradient as keyof typeof borderColors] || borderColors.blue
  
  return (
    <Card className={`
      relative overflow-hidden bg-gradient-to-br ${gradientClass} 
      border-2 ${borderColor} shadow-lg hover:shadow-xl 
      transition-all duration-300 hover:scale-[1.02] rounded-2xl
      bg-white/80 backdrop-blur-sm group
    `}>
      <CardHeader className="pb-3 relative">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-slate-700">{title}</CardTitle>
          <div className="p-3 rounded-2xl bg-white/40 backdrop-blur-sm shadow-md group-hover:scale-110 transition-all duration-300">
            <IconComponent className={`h-5 w-5 ${iconColor}`} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 relative">
        <div className="text-3xl font-bold text-slate-800 mb-2">{value}</div>
        {hint && (
          <p className="text-xs text-slate-600 font-medium">{hint}</p>
        )}
      </CardContent>
    </Card>
  )
}
