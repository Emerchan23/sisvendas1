"use client"

import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  BarChart3, 
  ShoppingCart, 
  CheckCircle, 
  Users, 
  Truck, 
  Package, 
  CreditCard, 
  FileText, 
  Briefcase, 
  Calculator, 
  Settings,
  ArrowLeft
} from "lucide-react"

const menuItems = [
  { href: "/", label: "Dashboard", description: "Visão geral do sistema", icon: BarChart3, gradient: "from-blue-500 to-cyan-500" },
  { href: "/vendas", label: "Vendas", description: "Gerenciar vendas e pedidos", icon: ShoppingCart, gradient: "from-green-500 to-emerald-500" },
  { href: "/acertos", label: "Acertos", description: "Controle de acertos", icon: CheckCircle, gradient: "from-purple-500 to-pink-500" },
  { href: "/clientes", label: "Clientes", description: "Cadastro de clientes", icon: Users, gradient: "from-orange-500 to-red-500" },
  { href: "/fornecedores", label: "Fornecedores", description: "Cadastro de fornecedores", icon: Truck, gradient: "from-indigo-500 to-purple-500" },
  
  { href: "/vales", label: "Vale", description: "Controle de vales", icon: CreditCard, gradient: "from-yellow-500 to-orange-500" },
  { href: "/relatorios", label: "Relatórios", description: "Relatórios do sistema", icon: FileText, gradient: "from-slate-500 to-gray-500" },
  { href: "/outros-negocios", label: "Outros negócios", description: "Outros tipos de negócio", icon: Briefcase, gradient: "from-rose-500 to-pink-500" },
  { href: "/orcamentos", label: "Orçamentos", description: "Gerenciar orçamentos", icon: Calculator, gradient: "from-violet-500 to-purple-500" },
  { href: "/configuracoes", label: "Configurações", description: "Configurações do sistema", icon: Settings, gradient: "from-gray-500 to-slate-500" },
]

export default function MenuPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <AppHeader />
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Menu Principal
              </h1>
              <p className="text-slate-600 mt-2">
                Navegue pelas funcionalidades do sistema
              </p>
            </div>
            <Button 
              onClick={() => router.back()} 
              variant="outline"
              className="border-2 border-slate-200 hover:border-slate-300 bg-white/80 hover:bg-slate-50 text-slate-700 font-medium px-6 py-3 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item) => {
              const IconComponent = item.icon
              return (
                <Link key={item.href} href={item.href}>
                  <Card className="bg-white/80 backdrop-blur-sm shadow-2xl border-0 rounded-2xl overflow-hidden hover:shadow-3xl transition-all duration-300 transform hover:scale-105 cursor-pointer group">
                    <CardHeader className={`bg-gradient-to-r ${item.gradient} text-white p-6`}>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm">
                          <IconComponent className="h-6 w-6 text-white" />
                        </div>
                        <CardTitle className="text-xl font-semibold">{item.label}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 bg-gradient-to-br from-white to-slate-50/50">
                      <p className="text-slate-600 font-medium group-hover:text-slate-700 transition-colors">
                        {item.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}