"use client"

import type React from "react"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useEffect, useMemo, useState } from "react"
import { getConfig, CONFIG_CHANGED_EVENT } from "@/lib/config"
import { useAuth } from "@/contexts/AuthContext"
import { LogOut, User } from "lucide-react"

import { ERP_CHANGED_EVENT } from "@/lib/data-store"


const routes = [
  { href: "/", label: "Dashboard" },
  { href: "/vendas", label: "Vendas" },
  { href: "/acertos", label: "Acertos" },
  { href: "/clientes", label: "Clientes" },
  { href: "/fornecedores", label: "Fornecedores" },
  { href: "/produtos", label: "Produtos" },
  { href: "/vales", label: "Vale" },
  { href: "/relatorios", label: "Relatórios" },
  { href: "/outros-negocios", label: "Outros negócios" },
  { href: "/orcamentos", label: "Orçamentos" },
  { href: "/configuracoes", label: "Configurações" },
]

export function AppHeader({ className = "" }: { className?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const { usuario, logout } = useAuth()
  const [brand, setBrand] = useState<string>("LP IND")
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined)


  const placeholderLogo = useMemo(() => "/placeholder.svg?height=28&width=28", [])
  
  // Função para sanitizar URLs de logo e evitar erro CORS
  const sanitizeLogoUrl = (url: string | undefined): string => {
    if (!url || url.trim() === "") {
      return placeholderLogo
    }
    
    // Verificar se é um link do Google Drive e substituir por placeholder
    if (url.includes('drive.google.com') || url.includes('googleusercontent.com')) {
      console.warn('URL do Google Drive detectada no cabeçalho, usando placeholder para evitar erro CORS:', url)
      return placeholderLogo
    }
    
    return url
  }

  useEffect(() => {
    const initData = async () => {
      try {
        const cfg = getConfig()
        
        // Usar dados da configuração geral
        setBrand(cfg?.nome || "LP IND")
        setLogoUrl(cfg?.logoUrl || undefined)
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
      }
    }

    initData()

    const onConfigChanged = () => {
      const cfg = getConfig()
      setBrand(cfg?.nome || "LP IND")
      setLogoUrl(cfg?.logoUrl || undefined)
    }



    window.addEventListener(CONFIG_CHANGED_EVENT, onConfigChanged as EventListener)
    
    return () => {
      window.removeEventListener(CONFIG_CHANGED_EVENT, onConfigChanged as EventListener)
    }
  }, [pathname])

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className,
      )}
    >
      <div className="mx-auto flex h-16 min-h-16 items-center gap-2 px-4">
        {/* Marca */}
        <Link href="/" className="flex shrink-0 items-center gap-2" title={brand}>
          {logoUrl ? (
            <Image
              src={sanitizeLogoUrl(logoUrl)}
              alt="Logo da empresa"
              width={48}
              height={48}
              className="rounded object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex flex-col items-center justify-center text-white">
              <div className="text-xs font-bold leading-none">ID</div>
              <div className="text-[6px] font-semibold leading-none tracking-wider">DISTRIBUIÇÃO</div>
            </div>
          )}
          <span className="font-semibold truncate max-w-[40vw]">{brand}</span>
        </Link>

        {/* Navegação principal */}
        <nav
          aria-label="Principal"
          className="hidden md:flex flex-1 items-center gap-1 overflow-x-auto whitespace-nowrap
                     [-ms-overflow-style:none] [scrollbar-width:none] min-w-0"
          style={{ scrollbarWidth: "none" } as React.CSSProperties}
        >
          {routes.map((r) => {
            const active = pathname === r.href
            return (
              <Link key={r.href} href={r.href} className="shrink-0">
                <Button
                  variant={active ? "default" : "ghost"}
                  className={cn("text-sm", active ? "" : "text-muted-foreground hover:text-foreground")}
                >
                  {r.label}
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* Menu */}
        <div className="ml-auto flex shrink-0 items-center gap-2 min-w-0">
          {/* Informações do usuário */}
          {usuario && (
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span className="truncate max-w-32">{usuario.nome}</span>
            </div>
          )}

          {/* Botão de logout */}
          {usuario && (
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-sm"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Sair</span>
            </Button>
          )}

          {/* Navegação compacta no mobile */}
          <div className="md:hidden">
            <Link href="/menu">
              <Button variant="ghost" className="text-sm">
                Menu
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Barra secundária no mobile */}
      <div className="md:hidden border-t">
        <div
          className="flex items-center gap-1 overflow-x-auto px-2 py-2 whitespace-nowrap
                     [-ms-overflow-style:none] [scrollbar-width:none]"
          style={{ scrollbarWidth: "none" } as React.CSSProperties}
        >
          {routes.map((r) => {
            const active = pathname === r.href
            return (
              <Link key={r.href} href={r.href} className="shrink-0">
                <Button size="sm" variant={active ? "secondary" : "ghost"} className="text-xs">
                  {r.label}
                </Button>
              </Link>
            )
          })}

        </div>
      </div>
    </header>
  )
}
