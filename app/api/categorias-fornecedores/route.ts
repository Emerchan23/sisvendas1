import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const dataPath = path.join(process.cwd(), 'data', 'categorias-fornecedores.json')

async function ensureDataFile() {
  try {
    const dataDir = path.dirname(dataPath)
    await fs.mkdir(dataDir, { recursive: true })
    
    try {
      await fs.access(dataPath)
    } catch {
      const defaultCategories = [
        { id: '1', nome: 'Matéria Prima', cor: '#3B82F6' },
        { id: '2', nome: 'Equipamentos', cor: '#10B981' },
        { id: '3', nome: 'Serviços', cor: '#F59E0B' },
        { id: '4', nome: 'Tecnologia', cor: '#8B5CF6' },
        { id: '5', nome: 'Logística', cor: '#EF4444' }
      ]
      await fs.writeFile(dataPath, JSON.stringify(defaultCategories, null, 2))
    }
  } catch (error) {
    console.error('Erro ao garantir arquivo de dados:', error)
  }
}

async function getCategorias() {
  try {
    await ensureDataFile()
    const data = await fs.readFile(dataPath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Erro ao ler categorias:', error)
    return []
  }
}

async function saveCategorias(categorias: any[]) {
  try {
    await ensureDataFile()
    await fs.writeFile(dataPath, JSON.stringify(categorias, null, 2))
    return true
  } catch (error) {
    console.error('Erro ao salvar categorias:', error)
    return false
  }
}

// GET - Listar todas as categorias
export async function GET() {
  try {
    const categorias = await getCategorias()
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

    const categorias = await getCategorias()
    
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
    
    if (await saveCategorias(categorias)) {
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
    console.log('DELETE request received')
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    console.log('Category ID to delete:', id)

    if (!id) {
      console.log('No ID provided')
      return NextResponse.json(
        { error: 'ID da categoria é obrigatório' },
        { status: 400 }
      )
    }

    const filePath = path.join(process.cwd(), 'data', 'categorias-fornecedores.json')
    console.log('File path:', filePath)
    
    const fileData = await fs.readFile(filePath, 'utf8')
    const categorias = JSON.parse(fileData)
    console.log('Current categories:', categorias)

    const categoriaIndex = categorias.findIndex((cat: any) => cat.id === id)
    console.log('Category index found:', categoriaIndex)
    
    if (categoriaIndex === -1) {
      console.log('Category not found')
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      )
    }

    const removedCategory = categorias[categoriaIndex]
    console.log('Removing category:', removedCategory)
    
    categorias.splice(categoriaIndex, 1)
    console.log('Categories after removal:', categorias)
    
    await fs.writeFile(filePath, JSON.stringify(categorias, null, 2))
    console.log('File written successfully')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar categoria:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    )
  }
}