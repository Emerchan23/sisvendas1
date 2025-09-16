// Modalidades via backend API

"use client"

import { api, type Modalidade } from "./api-client"
import { emitChange } from "./data-store"

export type { Modalidade }

export async function getModalidades(): Promise<Modalidade[]> {
  console.log('getModalidades: Fazendo requisição para API...')
  try {
    const result = await api.modalidades.list()
    console.log('getModalidades: Resultado da API:', result)
    return result
  } catch (error) {
    console.error('getModalidades: Erro na requisição:', error)
    throw error
  }
}
export async function saveModalidade(m: Partial<Modalidade> & { id?: string }) {
  if (m.id) await api.modalidades.update(m.id, m)
  else await api.modalidades.create(m)
  emitChange("modalidades")
}
export async function deleteModalidade(id: string) {
  await api.modalidades.delete(id)
  emitChange("modalidades")
}
