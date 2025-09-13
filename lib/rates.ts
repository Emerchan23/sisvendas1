// Rates (capital e imposto) via backend API

"use client"

import { api, type Rate } from "./api-client"
import { emitChange } from "./data-store"

export type { Rate }

export async function getCapitalRates(): Promise<Rate[]> {
  const rates = await api.rates.capital.list()
  return rates.map(rate => ({
    id: rate.id,
    name: rate.nome,
    percentage: rate.percentual
  }))
}
export async function saveCapitalRate(rate: Partial<Rate> & { id?: string }) {
  if (rate.id) await api.rates.capital.update(rate.id, rate)
  else await api.rates.capital.create(rate)
  emitChange("rates_capital")
}
export async function deleteCapitalRate(id: string) {
  await api.rates.capital.delete(id)
  emitChange("rates_capital")
}

export async function getImpostoRates(): Promise<Rate[]> {
  const rates = await api.rates.imposto.list()
  return rates.map(rate => ({
    id: rate.id,
    name: rate.nome,
    percentage: rate.percentual
  }))
}
export async function saveImpostoRate(rate: Partial<Rate> & { id?: string }) {
  if (rate.id) await api.rates.imposto.update(rate.id, rate)
  else await api.rates.imposto.create(rate)
  emitChange("rates_imposto")
}
export async function deleteImpostoRate(id: string) {
  await api.rates.imposto.delete(id)
  emitChange("rates_imposto")
}
