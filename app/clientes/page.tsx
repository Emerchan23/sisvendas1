"use client"

import { useEffect, useMemo, useState } from "react"
import { AppHeader } from "@/components/app-header"
import { type Cliente, ensureInit, getClientes } from "@/lib/data-store"
// Removed empresa imports - system simplified
import { api } from "@/lib/api-client"
import { fmtDate } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CnpjCpfInput, PhoneInput } from "@/components/ui/masked-input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/hooks/use-toast"
import { Users, UserPlus, Search, Edit, Trash2, Mail, Phone, MapPin, FileText, Calendar, Plus } from "lucide-react"

export default function ClientesPage() {
  const [list, setList] = useState<Cliente[]>([])
  const [filtro, setFiltro] = useState("")
  const [editing, setEditing] = useState<Cliente | null>(null)

  useEffect(() => {
    async function loadData() {
      ensureInit()
      try {
        const clientes = await getClientes()
        setList(clientes)
      } catch (error) {
        console.error('Erro ao carregar clientes:', error)
        setList([])
      }
    }
    loadData()
  }, [])

  async function refresh() {
    try {
      const clientes = await getClientes()
      setList(clientes)
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
      setList([])
    }
  }

  async function onSubmit(formData: FormData) {
    const payload = {
      nome: String(formData.get("nome") || ""),
      documento: String(formData.get("documento") || ""),
      endereco: String(formData.get("endereco") || ""),
      telefone: String(formData.get("telefone") || ""),
      email: String(formData.get("email") || ""),
    }
    if (!payload.nome || !payload.documento) {
      toast({ title: "Preencha Nome e CNPJ/CPF." })
      return
    }

    // Check for duplicate names when creating new client
    if (!editing?.id) {
      const trimmedName = payload.nome.trim()
      const existingClient = list.find(c => c.nome.toLowerCase() === trimmedName.toLowerCase())
      if (existingClient) {
        toast({ title: "Já existe um cliente com este nome!", variant: "destructive" })
        return
      }
    }
    
    try {
      if (editing?.id) {
        await api.clientes.update(editing.id, payload)
      } else {
        await api.clientes.create(payload)
      }
      setEditing(null)
      refresh()
    } catch (error) {
      console.error('Erro ao salvar cliente:', error)
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        toast({ title: "Já existe um cliente com este nome!", variant: "destructive" })
      } else {
        toast({ title: "Erro ao salvar cliente. Tente novamente.", variant: "destructive" })
      }
    }
  }

  const filtrados = useMemo(() => {
    const term = filtro.toLowerCase().trim()
    if (!term) return list
    return list.filter((c) => c.nome.toLowerCase().includes(term) || c.documento.toLowerCase().includes(term))
  }, [list, filtro])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50">
      {/* Decorative background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.1),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(236,72,153,0.1),transparent_50%)] pointer-events-none" />
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-transparent rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-purple-200/20 to-transparent rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      <AppHeader />
      <main className="container mx-auto px-4 py-8 space-y-8">
        <Card className="bg-white/90 border border-white/20 shadow-2xl relative overflow-hidden">

          <CardHeader className="bg-gradient-to-r from-slate-50/80 to-blue-50/80 border-b border-white/30 relative">

            <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-3 relative z-10">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                <UserPlus className="h-5 w-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                {editing ? 'Editar Cliente' : 'Cadastro de Clientes'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 relative z-10">
            <form
              action={onSubmit}
              className="grid gap-6 md:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault()
                onSubmit(new FormData(e.currentTarget))
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="nome" className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Users className="h-4 w-4 text-blue-400" />
                  Nome
                </Label>
                <Input 
                  id="nome" 
                  name="nome" 
                  defaultValue={editing?.nome || ""} 
                  className="bg-white/90 backdrop-blur-sm border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-xl shadow-lg hover:shadow-xl focus:shadow-blue-500/25 transition-all duration-300 hover:bg-white focus:bg-white group-hover:border-blue-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="documento" className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <FileText className="h-4 w-4 text-indigo-400" />
                  CNPJ/CPF
                </Label>
                <CnpjCpfInput 
                  id="documento" 
                  name="documento" 
                  defaultValue={editing?.documento || ""} 
                  className="bg-white/90 backdrop-blur-sm border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 rounded-xl shadow-lg hover:shadow-xl focus:shadow-indigo-500/25 transition-all duration-300 hover:bg-white focus:bg-white group-hover:border-indigo-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endereco" className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <MapPin className="h-4 w-4 text-green-400" />
                  Endereço
                </Label>
                <Input 
                  id="endereco" 
                  name="endereco" 
                  defaultValue={editing?.endereco || ""} 
                  className="bg-white/90 backdrop-blur-sm border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-500/20 rounded-xl shadow-lg hover:shadow-xl focus:shadow-green-500/25 transition-all duration-300 hover:bg-white focus:bg-white group-hover:border-green-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone" className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Phone className="h-4 w-4 text-purple-400" />
                  Telefone
                </Label>
                <PhoneInput 
                  id="telefone" 
                  name="telefone" 
                  defaultValue={editing?.telefone || ""} 
                  className="bg-white/90 backdrop-blur-sm border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 rounded-xl shadow-lg hover:shadow-xl focus:shadow-purple-500/25 transition-all duration-300 hover:bg-white focus:bg-white group-hover:border-purple-300"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Mail className="h-4 w-4 text-orange-400" />
                  Email
                </Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  defaultValue={editing?.email || ""} 
                  className="bg-white/90 backdrop-blur-sm border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 rounded-xl shadow-lg hover:shadow-xl focus:shadow-orange-500/25 transition-all duration-300 hover:bg-white focus:bg-white group-hover:border-orange-300"
                />
              </div>
              <div className="flex gap-3 md:col-span-2 pt-4">
                <Button 
                  type="submit" 
                  className="flex-1 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white font-semibold py-3 px-6 rounded-xl shadow-2xl relative overflow-hidden"
                >

                  <span className="relative z-10 flex items-center gap-2">
                    {editing ? "✨ Atualizar" : "🚀 Cadastrar"}
                  </span>
                </Button>
                {editing && (
                  <Button 
                    type="button" 
                    onClick={() => setEditing(null)} 
                    variant="outline" 
                    className="px-6 py-3 bg-white/90 border-2 border-slate-300 text-slate-700 rounded-xl shadow-lg relative overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      ❌ Cancelar
                    </span>
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-white/80 border border-white/20 shadow-2xl relative overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-50/80 to-green-50/80 border-b border-white/30 relative">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-3 relative z-10">
                <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <span className="bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Clientes Cadastrados
                </span>
                <div className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-semibold rounded-full shadow-lg">
                  {filtrados.length}
                </div>
              </CardTitle>
              <div className="flex items-center gap-3 relative z-10">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
                  <Input 
                    placeholder="Buscar cliente..." 
                    value={filtro} 
                    onChange={(e) => setFiltro(e.target.value)}
                    className="w-72 pl-10 bg-white/90 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-500/20 rounded-xl shadow-lg"
                  />
                  {filtro && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 relative z-10">
            <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-white/30">
                      <TableHead className="text-slate-700 font-bold py-5 text-sm uppercase tracking-wide">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-500" />
                          Nome
                        </div>
                      </TableHead>
                      <TableHead className="text-slate-700 font-bold py-5 text-sm uppercase tracking-wide">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-indigo-500" />
                          CNPJ/CPF
                        </div>
                      </TableHead>
                      <TableHead className="text-slate-700 font-bold py-5 text-sm uppercase tracking-wide">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-purple-500" />
                          Telefone
                        </div>
                      </TableHead>
                      <TableHead className="text-slate-700 font-bold py-5 text-sm uppercase tracking-wide">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-orange-500" />
                          Email
                        </div>
                      </TableHead>
                      <TableHead className="text-slate-700 font-bold py-5 text-center text-sm uppercase tracking-wide">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
              <TableBody>
                {filtrados.map((c, index) => (
                  <TableRow key={c.id} className={`border-b border-white/20 group ${index % 2 === 0 ? 'bg-white/50' : 'bg-slate-50/30'}`}>
                    <TableCell className="font-semibold text-slate-800 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                          {c.nome.charAt(0).toUpperCase()}
                        </div>
                        <span>{c.nome}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600 py-5 font-mono text-sm">{c.documento}</TableCell>
                    <TableCell className="text-slate-600 py-5">{c.telefone}</TableCell>
                    <TableCell className="text-slate-600 py-5">{c.email}</TableCell>
                    <TableCell className="text-right py-5">
                      <div className="flex gap-3 justify-end">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => setEditing(c)}
                          className="text-blue-600 border-2 border-blue-200 shadow-lg rounded-xl relative overflow-hidden"
                        >
                          <Edit className="h-4 w-4 mr-2 relative z-10" />
                          <span className="relative z-10">Editar</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 border-2 border-red-200 shadow-lg rounded-xl relative overflow-hidden"
                          onClick={async () => {
                            try {
                              await api.clientes.delete(c.id)
                              refresh()
                              toast({
                                title: "Cliente excluído",
                                description: "Cliente excluído com sucesso.",
                              })
                            } catch (error: any) {
                              // Verifica se é erro de dependências (HTTP 400)
                              if (error.message && error.message.includes('400')) {
                                // Buscar detalhes dos registros vinculados
                                try {
                                  const response = await fetch(`/api/clientes/${c.id}/dependencies`)
                                  const dependencies = await response.json()
                                  
                                  let detailsMessage = "Este cliente não pode ser excluído pois possui:\n\n"
                                  if (dependencies.vendas > 0) detailsMessage += `• ${dependencies.vendas} venda(s)\n`
                                  if (dependencies.orcamentos > 0) detailsMessage += `• ${dependencies.orcamentos} orçamento(s)\n`
                                  if (dependencies.outrosNegocios > 0) detailsMessage += `• ${dependencies.outrosNegocios} outro(s) negócio(s)\n`
                                  if (dependencies.valeMovimentos > 0) detailsMessage += `• ${dependencies.valeMovimentos} movimento(s) de vale\n`
                                  detailsMessage += "\nExclua primeiro esses registros para poder deletar o cliente."
                                  
                                  alert(detailsMessage)
                                } catch {
                                  toast({
                                    title: "Não é possível excluir",
                                    description: "Este cliente possui registros associados. Exclua primeiro os registros relacionados.",
                                    variant: "destructive",
                                  })
                                }
                              } else {
                                console.error('Erro ao excluir cliente:', error)
                                toast({
                                  title: "Erro",
                                  description: "Erro inesperado ao excluir cliente.",
                                  variant: "destructive",
                                })
                              }
                            }
                          }}
                        >

                          <Trash2 className="h-4 w-4 mr-2 relative z-10" />
                          <span className="relative z-10">Excluir</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtrados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center gap-4 text-slate-500">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                          <Users className="h-8 w-8 text-slate-400" />
                        </div>
                        <div className="text-lg font-medium">Nenhum cliente encontrado</div>
                        <div className="text-sm">Tente ajustar os filtros de busca</div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
                </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
