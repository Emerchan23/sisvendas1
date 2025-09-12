"use client"

import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useRouter } from "next/navigation"

const menuItems = [
  { href: "/", label: "Dashboard", description: "Visão geral do sistema" },
  { href: "/vendas", label: "Vendas", description: "Gerenciar vendas e pedidos" },
  { href: "/acertos", label: "Acertos", description: "Controle de acertos" },
  { href: "/clientes", label: "Clientes", description: "Cadastro de clientes" },
  { href: "/fornecedores", label: "Fornecedores", description: "Cadastro de fornecedores" },
  { href: "/produtos", label: "Produtos", description: "Cadastro de produtos" },
  { href: "/vales", label: "Vale", description: "Controle de vales" },
  { href: "/relatorios", label: "Relatórios", description: "Relatórios do sistema" },
  { href: "/outros-negocios", label: "Outros negócios", description: "Outros tipos de negócio" },
  { href: "/orcamentos", label: "Orçamentos", description: "Gerenciar orçamentos" },
  { href: "/configuracoes", label: "Configurações", description: "Configurações do sistema" },
]

export default function MenuPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Menu Principal</h1>
            <Button onClick={() => router.back()} variant="outline">
              Voltar
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg">{item.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}