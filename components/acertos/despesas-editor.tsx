"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CurrencyInput } from "@/components/ui/currency-input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Plus } from "lucide-react"
import type { Despesa, Participante } from "@/lib/acertos"
import { fmtCurrency } from "@/lib/format"

type Props = {
  participantes?: Participante[]
  despesas?: Despesa[]
  onAdd?: (d: Omit<Despesa, "id">) => void
  onRemove?: (id: string) => void
  onSavePendente?: (d: Omit<Despesa, "id">) => void
  title?: string
  className?: string
}

export default function DespesasEditor({
  participantes = [],
  despesas = [],
  onAdd = () => {},
  onRemove = () => {},
  onSavePendente = () => {},
  title = "Despesas do acerto",
  className = "",
}: Props) {
  const [descricao, setDescricao] = useState("")
  const [valor, setValor] = useState("")
  const [tipo, setTipo] = useState<Despesa["tipo"]>("rateio")
  const [participanteId, setParticipanteId] = useState<string>("")

  const totalRateio = useMemo(
    () => despesas.filter((d) => d.tipo === "rateio").reduce((a, d) => a + (d.valor || 0), 0),
    [despesas],
  )
  const totalIndividuais = useMemo(
    () => despesas.filter((d) => d.tipo === "individual").reduce((a, d) => a + (d.valor || 0), 0),
    [despesas],
  )

  function buildPayload(): Omit<Despesa, "id"> | null {
    // CurrencyInput já retorna valor como string numérica
    const v = Number(valor || "0")
    if (!descricao.trim() || !isFinite(v) || v <= 0) return null
    if (tipo === "individual" && !participanteId) return null
    return {
      descricao: descricao.trim(),
      valor: +v.toFixed(2),
      tipo,
      participanteId: tipo === "individual" ? participanteId : undefined,
    }
  }

  function handleAdd() {
    const payload = buildPayload()
    if (!payload) return
    onAdd(payload)
    resetInputs()
  }

  function handleSavePendente() {
    const payload = buildPayload()
    if (!payload) return
    onSavePendente(payload)
    resetInputs()
  }

  function resetInputs() {
    setDescricao("")
    setValor("")
    setTipo("rateio")
    setParticipanteId("")
  }

  return (
    <div className={`rounded-lg border bg-white shadow-sm ${className}`}>
      <div className="flex items-center justify-between border-b bg-gradient-to-r from-rose-50 to-rose-100/50 px-4 py-3 rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="h-5 w-1.5 rounded-full bg-rose-400" />
          <Label className="text-sm font-medium text-rose-800">{title}</Label>
        </div>
        <div className="flex gap-3">
          <Button 
            size="sm" 
            onClick={handleAdd}
            className="bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar despesa
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleSavePendente}
            className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
          >
            <Download className="mr-2 h-4 w-4" />
            Salvar pendente
          </Button>
        </div>
      </div>

      <div className="bg-gray-50/50 p-4 border-b">
        <div className="grid gap-4 md:grid-cols-5">
          <div className="md:col-span-2">
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Descrição</Label>
            <Input 
              value={descricao} 
              onChange={(e) => setDescricao(e.target.value)} 
              placeholder="Ex.: Frete, Combustível..." 
              className="border-gray-200 focus:border-rose-300 focus:ring-rose-200"
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Valor (R$)</Label>
            <CurrencyInput
              value={valor}
              onChange={setValor}
              placeholder="0,00"
              className="border-gray-200 focus:border-rose-300 focus:ring-rose-200"
              allowNegative={false}
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Tipo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as Despesa["tipo"])}>
              <SelectTrigger className="border-gray-200 focus:border-rose-300 focus:ring-rose-200">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rateio">Rateio geral</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Participante</Label>
            <Select value={participanteId} onValueChange={setParticipanteId} disabled={tipo !== "individual"}>
              <SelectTrigger className={`border-gray-200 focus:border-rose-300 focus:ring-rose-200 ${
                tipo !== "individual" ? "bg-gray-100 text-gray-400" : ""
              }`}>
                <SelectValue placeholder={tipo === "individual" ? "Selecione" : "N/A"} />
              </SelectTrigger>
              <SelectContent>
                {participantes.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="overflow-auto px-4 pb-4">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-100">
              <TableHead className="font-semibold text-gray-700 py-4">Descrição</TableHead>
              <TableHead className="font-semibold text-gray-700 py-4">Tipo</TableHead>
              <TableHead className="font-semibold text-gray-700 py-4">Participante</TableHead>
              <TableHead className="font-semibold text-gray-700 py-4">Valor</TableHead>
              <TableHead className="text-right font-semibold text-gray-700 py-4">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {despesas.map((d) => {
              const part = participantes.find((p) => p.id === d.participanteId)
              return (
                <TableRow key={d.id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell className="font-medium text-gray-900 py-4">{d.descricao}</TableCell>
                  <TableCell className="capitalize text-gray-600 py-4">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      d.tipo === 'rateio' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {d.tipo}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-600 py-4">{part?.nome ?? "-"}</TableCell>
                  <TableCell className="tabular-nums font-semibold text-gray-900 py-4">{fmtCurrency(d.valor)}</TableCell>
                  <TableCell className="text-right py-4">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => onRemove(d.id)}
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                    >
                      Remover
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
            {despesas.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <Plus className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">Nenhuma despesa adicionada</p>
                    <p className="text-gray-400 text-sm">Use o formulário acima para adicionar despesas</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 p-4 rounded-lg border border-blue-200">
            <Label className="text-sm font-medium text-blue-800 mb-2 block">Total despesas de rateio</Label>
            <div className="text-2xl font-bold text-blue-900">{fmtCurrency(totalRateio)}</div>
            <p className="text-xs text-blue-600 mt-1">Dividido entre todos os participantes</p>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-purple-100/50 p-4 rounded-lg border border-purple-200">
            <Label className="text-sm font-medium text-purple-800 mb-2 block">Total despesas individuais</Label>
            <div className="text-2xl font-bold text-purple-900">{fmtCurrency(totalIndividuais)}</div>
            <p className="text-xs text-purple-600 mt-1">Descontado de participantes específicos</p>
          </div>
        </div>
      </div>
    </div>
  )
}
