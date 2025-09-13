"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Upload, Trash2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import type { DespesaPendente, Participante } from "@/lib/acertos"
import { fmtCurrency } from "@/lib/format"

type Props = {
  pendentes?: DespesaPendente[]
  participantes?: Participante[]
  onUse?: (ids: string[]) => void
  onDelete?: (ids: string[]) => void
  title?: string
  className?: string
}

export default function DespesasPendentesPanel({
  pendentes = [],
  participantes = [],
  onUse = () => {},
  onDelete = () => {},
  title = "Despesas salvas anteriormente",
  className = "",
}: Props) {
  const [sel, setSel] = useState<Record<string, boolean>>({})

  const allSelected = useMemo(() => {
    if (pendentes.length === 0) return false
    const count = Object.values(sel).filter(Boolean).length
    return count === pendentes.length
  }, [pendentes, sel])

  const anySelected = useMemo(() => Object.values(sel).some(Boolean), [sel])

  function toggleAll(v: boolean) {
    setSel(v ? Object.fromEntries(pendentes.map((d) => [d.id, true])) : {})
  }

  function selectedIds() {
    return Object.keys(sel).filter((k) => sel[k])
  }

  return (
    <div className={`rounded-lg border bg-white shadow-sm ${className}`}>
      <div className="flex items-center justify-between border-b bg-gradient-to-r from-emerald-50 to-emerald-100/50 px-4 py-3 rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="h-5 w-1.5 rounded-full bg-emerald-400" />
          <Label className="text-sm font-medium text-emerald-800">{title}</Label>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            size="sm" 
            onClick={() => onUse(selectedIds())} 
            disabled={!anySelected}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            <Upload className="mr-2 h-4 w-4" />
            Usar selecionadas
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
            onClick={() => onDelete(selectedIds())}
            disabled={!anySelected}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </Button>
        </div>
      </div>
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-100">
              <TableHead className="w-12 py-4">
                <Checkbox checked={allSelected} onCheckedChange={(v) => toggleAll(Boolean(v))} className="border-gray-300" />
              </TableHead>
              <TableHead className="font-semibold text-gray-700">Descrição</TableHead>
              <TableHead className="font-semibold text-gray-700">Tipo</TableHead>
              <TableHead className="font-semibold text-gray-700">Participante</TableHead>
              <TableHead className="font-semibold text-gray-700">Valor</TableHead>
              <TableHead className="font-semibold text-gray-700">Criada em</TableHead>
              <TableHead className="text-right font-semibold text-gray-700">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendentes.map((d) => {
              const part = participantes.find((p) => p.id === d.participanteId)
              return (
                <TableRow key={d.id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell className="w-12 py-4">
                    <Checkbox
                      checked={!!sel[d.id]}
                      onCheckedChange={(v) => setSel((s) => ({ ...s, [d.id]: Boolean(v) }))}
                      className="border-gray-300"
                    />
                  </TableCell>
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
                  <TableCell className="text-gray-500 py-4">{d.createdAt ? new Date(d.createdAt).toLocaleDateString("pt-BR") : "-"}</TableCell>
                  <TableCell className="text-right py-4">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => onDelete([d.id])}
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                    >
                      Excluir
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
            {pendentes.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <Upload className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">Nenhuma despesa pendente salva</p>
                    <p className="text-gray-400 text-sm">As despesas salvas aparecerão aqui</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
