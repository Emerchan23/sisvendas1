"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarIcon, Save, X, FileText, User, Package, DollarSign, Calculator, Clock, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { type LinhaVenda } from "@/lib/planilha"
import { type Rate } from "@/lib/rates"
import { type Modalidade } from "@/lib/modalidades"
import { type Cliente } from "@/lib/data-store"
import ClienteCombobox from "@/components/cliente-combobox"
import { CurrencyInput } from "@/components/currency-input"

interface VendaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  linha: LinhaVenda | null
  onSave: (linha: Partial<LinhaVenda>) => void
  capitalRates: Rate[]
  impostoRates: Rate[]
  modalidades: Modalidade[]
  clientes: Cliente[]
}

export function VendaDialog({
  open,
  onOpenChange,
  linha,
  onSave,
  capitalRates,
  impostoRates,
  modalidades,
  clientes
}: VendaDialogProps) {

  const [formData, setFormData] = useState<Partial<LinhaVenda>>({
    dataPedido: new Date().toISOString().split('T')[0],
    numeroOF: '',
    numeroDispensa: '',
    cliente: '',
    modalidade: '',
    valorVenda: 0,
    taxaCapitalPerc: 0,
    taxaCapitalVl: 0,
    taxaImpostoPerc: 0,
    taxaImpostoVl: 0,
    custoMercadoria: 0,
    somaCustoFinal: 0,
    lucroValor: 0,
    lucroPerc: 0,
    dataRecebimento: '',
    paymentStatus: 'Pendente',
    settlementStatus: 'Pendente'
  })

  const [dataPedido, setDataPedido] = useState<Date | undefined>(new Date())
  const [dataRecebimento, setDataRecebimento] = useState<Date | undefined>()



  useEffect(() => {
    if (linha) {
      setFormData(linha)
      setDataPedido(linha.dataPedido ? new Date(linha.dataPedido) : new Date())
      setDataRecebimento(linha.dataRecebimento ? new Date(linha.dataRecebimento) : undefined)
    } else {
      const newData = {
        dataPedido: new Date().toISOString().split('T')[0],
        numeroOF: '',
        numeroDispensa: '',
        cliente: '',
        modalidade: '',
        valorVenda: 0,
        taxaCapitalPerc: 0,
        taxaCapitalVl: 0,
        taxaImpostoPerc: 0,
        taxaImpostoVl: 0,
        custoMercadoria: 0,
        somaCustoFinal: 0,
        lucroValor: 0,
        lucroPerc: 0,
        dataRecebimento: '',
        paymentStatus: 'Pendente',
        settlementStatus: 'Pendente'
      }
      setFormData(newData)
      setDataPedido(new Date())
      setDataRecebimento(undefined)
    }
  }, [linha, open])

  // Calcular valores automaticamente
  useEffect(() => {
    const valorVenda = formData.valorVenda || 0
    const taxaCapitalPerc = formData.taxaCapitalPerc || 0
    const taxaImpostoPerc = formData.taxaImpostoPerc || 0
    const custoMercadoria = formData.custoMercadoria || 0

    const taxaCapitalVl = (valorVenda * taxaCapitalPerc) / 100
    const taxaImpostoVl = (valorVenda * taxaImpostoPerc) / 100
    const somaCustoFinal = custoMercadoria + taxaCapitalVl + taxaImpostoVl
    const lucroValor = valorVenda - somaCustoFinal
    const lucroPerc = valorVenda > 0 ? (lucroValor / valorVenda) * 100 : 0

    setFormData(prev => ({
      ...prev,
      taxaCapitalVl,
      taxaImpostoVl,
      somaCustoFinal,
      lucroValor,
      lucroPerc
    }))
  }, [formData.valorVenda, formData.taxaCapitalPerc, formData.taxaImpostoPerc, formData.custoMercadoria])

  const handleSave = () => {
    const dataToSave = {
      ...formData,
      dataPedido: dataPedido ? dataPedido.toISOString().split('T')[0] : '',
      dataRecebimento: dataRecebimento ? dataRecebimento.toISOString().split('T')[0] : ''
    }
    onSave(dataToSave)
  }

  const handleCapitalRateChange = (rateId: string) => {
    const rate = capitalRates.find(r => r.id === rateId)
    if (rate) {
      setFormData(prev => ({ ...prev, taxaCapitalPerc: rate.percentual }))
    }
  }

  const handleImpostoRateChange = (rateId: string) => {
    const rate = impostoRates.find(r => r.id === rateId)
    if (rate) {
      setFormData(prev => ({ ...prev, taxaImpostoPerc: rate.percentual }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden bg-white w-full">
        <DialogHeader className="pb-4 border-b border-slate-200">
          <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            {linha ? 'Editar Venda' : 'Nova Venda'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="basicas" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-1 mb-4 h-auto p-1">
              <TabsTrigger value="basicas" className="flex items-center gap-1 px-2 py-2 text-xs lg:text-sm whitespace-nowrap">
                <FileText className="h-3 w-3 lg:h-4 lg:w-4" />
                <span className="hidden sm:inline">Informações</span>
                <span className="sm:hidden">Info</span>
              </TabsTrigger>
              <TabsTrigger value="cliente" className="flex items-center gap-1 px-2 py-2 text-xs lg:text-sm whitespace-nowrap">
                <User className="h-3 w-3 lg:h-4 lg:w-4" />
                <span className="hidden sm:inline">Cliente</span>
                <span className="sm:hidden">CLI</span>
              </TabsTrigger>
              <TabsTrigger value="valores" className="flex items-center gap-1 px-2 py-2 text-xs lg:text-sm whitespace-nowrap">
                <Calculator className="h-3 w-3 lg:h-4 lg:w-4" />
                <span className="hidden sm:inline">Valores</span>
                <span className="sm:hidden">VAL</span>
              </TabsTrigger>
              <TabsTrigger value="status" className="flex items-center gap-1 px-2 py-2 text-xs lg:text-sm whitespace-nowrap">
                <CheckCircle className="h-3 w-3 lg:h-4 lg:w-4" />
                <span className="hidden sm:inline">Status</span>
                <span className="sm:hidden">STA</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto">
              <TabsContent value="basicas" className="space-y-4 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-slate-700 font-medium">
                      <Clock className="h-4 w-4 text-blue-600" />
                      Data do Pedido
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal h-10 bg-white border-slate-300 focus:border-blue-500",
                            !dataPedido && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dataPedido ? format(dataPedido, "PPP", { locale: ptBR }) : "Selecione uma data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dataPedido}
                          onSelect={setDataPedido}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-slate-700 font-medium">
                      <FileText className="h-4 w-4 text-blue-600" />
                      Número OF
                    </Label>
                    <Input
                      value={formData.numeroOF || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, numeroOF: e.target.value }))}
                      placeholder="Digite o número OF"
                      className="bg-white border-slate-300 focus:border-blue-500 h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-slate-700 font-medium">
                      <FileText className="h-4 w-4 text-blue-600" />
                      Número Dispensa
                    </Label>
                    <Input
                      value={formData.numeroDispensa || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, numeroDispensa: e.target.value }))}
                      placeholder="Digite o número da dispensa"
                      className="h-10"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="cliente" className="space-y-4 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-slate-700 font-medium">
                      <User className="h-4 w-4 text-green-600" />
                      Cliente
                    </Label>
                    <ClienteCombobox
                      value={formData.cliente || ''}
                      onChange={(value) => setFormData(prev => ({ ...prev, cliente: value }))}
                      clientes={clientes}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-slate-700 font-medium">
                      <Package className="h-4 w-4 text-green-600" />
                      Modalidade
                    </Label>
                    <Select
                      value={formData.modalidade || ''}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, modalidade: value }))}
                    >
                      <SelectTrigger className="bg-white border-slate-300 focus:border-green-500 h-10">
                        <SelectValue placeholder="Selecione a modalidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {modalidades.map((modalidade) => (
                          <SelectItem key={modalidade.id} value={modalidade.nome}>
                            {modalidade.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>


              </TabsContent>

              <TabsContent value="valores" className="space-y-4 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-slate-700 font-medium">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      Valor Venda (R$)
                    </Label>
                    <CurrencyInput
                      value={formData.valorVenda || 0}
                      onChange={(value) => setFormData(prev => ({ ...prev, valorVenda: value }))}
                      placeholder="0,00"
                      className="bg-white border-slate-300 focus:border-green-500 h-10"
                      allowNegative={false}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-slate-700 font-medium">
                      <Package className="h-4 w-4 text-green-600" />
                      Custo Mercadoria (R$)
                    </Label>
                    <CurrencyInput
                      value={formData.custoMercadoria || 0}
                      onChange={(value) => setFormData(prev => ({ ...prev, custoMercadoria: value }))}
                      placeholder="0,00"
                      className="bg-white border-slate-300 focus:border-green-500 h-10"
                      allowNegative={false}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-slate-700 font-medium">
                      <Calculator className="h-4 w-4 text-green-600" />
                      Taxa Capital (%)
                    </Label>
                    <div className="flex gap-2">
                      <Select onValueChange={handleCapitalRateChange}>
                        <SelectTrigger className="w-32 bg-white border-slate-300 focus:border-green-500 h-10">
                          <SelectValue placeholder="Taxa" />
                        </SelectTrigger>
                        <SelectContent>
                          {capitalRates.map((rate) => (
                            <SelectItem key={rate.id} value={rate.id}>
                              {rate.percentual}% - {rate.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.taxaCapitalPerc || 0}
                        onChange={(e) => setFormData(prev => ({ ...prev, taxaCapitalPerc: parseFloat(e.target.value) || 0 }))}
                        placeholder="%"
                        className="bg-white border-slate-300 focus:border-green-500 h-10 flex-1"
                      />
                    </div>
                    <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded">
                      <span className="font-medium">Valor: R$ {(formData.taxaCapitalVl || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-slate-700 font-medium">
                      <Calculator className="h-4 w-4 text-green-600" />
                      Taxa Imposto (%)
                    </Label>
                    <div className="flex gap-2">
                      <Select onValueChange={handleImpostoRateChange}>
                        <SelectTrigger className="w-32 bg-white border-slate-300 focus:border-green-500 h-10">
                          <SelectValue placeholder="Taxa" />
                        </SelectTrigger>
                        <SelectContent>
                          {impostoRates.map((rate) => (
                            <SelectItem key={rate.id} value={rate.id}>
                              {rate.percentual}% - {rate.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.taxaImpostoPerc || 0}
                        onChange={(e) => setFormData(prev => ({ ...prev, taxaImpostoPerc: parseFloat(e.target.value) || 0 }))}
                        placeholder="%"
                        className="bg-white border-slate-300 focus:border-green-500 h-10 flex-1"
                      />
                    </div>
                    <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded">
                      <span className="font-medium">Valor: R$ {(formData.taxaImpostoVl || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h4 className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Resultados Calculados
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-700">
                        R$ {(formData.somaCustoFinal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-green-600">Custo Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-700">
                        R$ {(formData.lucroValor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-green-600">Lucro</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-700">
                        {(formData.lucroPerc || 0).toFixed(1)}%
                      </div>
                      <div className="text-xs text-green-600">Margem</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-lg font-bold ${
                        (formData.lucroPerc || 0) > 20 ? 'text-green-600' : 
                        (formData.lucroPerc || 0) > 10 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {(formData.lucroPerc || 0) > 20 ? 'Boa' : 
                         (formData.lucroPerc || 0) > 10 ? 'Regular' : 'Baixa'}
                      </div>
                      <div className="text-xs text-green-600">Status</div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="status" className="space-y-4 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-slate-700 font-medium">
                      <Clock className="h-4 w-4 text-blue-600" />
                      Data Recebimento
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal h-10",
                            !dataRecebimento && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dataRecebimento ? format(dataRecebimento, "PPP", { locale: ptBR }) : "Selecione uma data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dataRecebimento}
                          onSelect={setDataRecebimento}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-slate-700 font-medium">
                      <DollarSign className="h-4 w-4 text-blue-600" />
                      Status Pagamento
                    </Label>
                    <Select
                      value={formData.paymentStatus || 'Pendente'}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, paymentStatus: value }))}
                    >
                      <SelectTrigger className="bg-white border-slate-300 focus:border-blue-500 h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pendente">🟡 Pendente</SelectItem>
                        <SelectItem value="Parcial">🟠 Parcial</SelectItem>
                        <SelectItem value="Pago">🟢 Pago</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="flex items-center gap-2 text-slate-700 font-medium">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      Status Acerto
                    </Label>
                    <Select
                      value={formData.settlementStatus || 'Pendente'}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, settlementStatus: value }))}
                      disabled={true}
                    >
                      <SelectTrigger className="bg-gray-100 border-slate-300 focus:border-blue-500 h-10 cursor-not-allowed">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pendente">🟡 Pendente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="px-8 py-3 h-12 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors text-base"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            className="px-8 py-3 h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all text-base"
          >
            <Save className="h-4 w-4 mr-2" />
            {linha ? 'Atualizar Venda' : 'Criar Venda'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}