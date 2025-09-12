import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const dataPath = path.join(process.cwd(), 'data', 'categorias-fornecedores.json')

// Garantir que o diretório data existe
const dataDir = path.dirname(dataPath)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// Garantir que o arquivo existe
if (!fs.existsSync(dataPath)) {
  const defaultCategories = [
    { id: '1', nome: 'Matéria Prima', cor: '#3B82F6' },
    { id: '2', nome: 'Equipamentos', cor: '#10B981' },
    { id: '3', nome: 'Serviços', cor: '#F59E0B' },
    { id: '4', nome: 'Tecnologia', cor: '#8B5CF6' },
    { id: '5', nome: 'Logística', cor: '#EF4444' }
  ]
  fs.writeFileSync(dataPath, JSON.stringify(defaultCategories, null, 2))
}

function getCategorias() {
  try {
    const data = fs.readFileSync(dataPath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Erro ao ler categorias:', error)
    return []
  }
}

function saveCategorias(categorias: any[]) {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(categorias, null, 2))
    return true
  } catch (error) {
    console.error('Erro ao salvar categorias:', error)
    return false
  }
}

// GET - Listar todas as categorias
export async function GET() {
  try {
    const categorias = getCategorias()
    return NextResponse.json(categorias)
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar categorias' },
      { status: 500 }
    )
  }
}

// POST - Criar nova categoria
export async function POST(request: NextRequest) {
  try {
    const { nome, cor } = await request.json()
    
    if (!nome || !cor) {
      return NextResponse.json(
        { error: 'Nome e cor são obrigatórios' },
        { status: 400 }
      )
    }

    const categorias = getCategorias()
    
    // Verificar se já existe categoria com o mesmo nome
    const categoriaExistente = categorias.find(
      (cat: any) => cat.nome.toLowerCase() === nome.toLowerCase()
    )
    
    if (categoriaExistente) {
      return NextResponse.json(
        { error: 'Já existe uma categoria com este nome' },
        { status: 400 }
      )
    }

    const novaCategoria = {
      id: Date.now().toString(),
      nome,
      cor
    }

    categorias.push(novaCategoria)
    
    if (saveCategorias(categorias)) {
      return NextResponse.json(novaCategoria, { status: 201 })
    } else {
      return NextResponse.json(
        { error: 'Erro ao salvar categoria' },
        { status: 500 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao criar categoria' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir categoria
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID da categoria é obrigatório' },
        { status: 400 }
      )
    }

    const categorias = getCategorias()
    const categoriaIndex = categorias.findIndex((cat: any) => cat.id === id)
    
    if (categoriaIndex === -1) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      )
    }

    categorias.splice(categoriaIndex, 1)
    
    if (saveCategorias(categorias)) {
      return NextResponse.json({ message: 'Categoria excluída com sucesso' })
    } else {
      return NextResponse.json(
        { error: 'Erro ao excluir categoria' },
        { status: 500 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao excluir categoria' },
      { status: 500 }
    )
  }
}