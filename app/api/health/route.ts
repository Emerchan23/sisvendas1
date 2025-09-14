import { NextResponse } from 'next/server'
import { db } from '../../../lib/db'

export async function GET() {
  try {
    // Verificar se o banco de dados está acessível
    const result = db.prepare('SELECT 1 as test').get()
    
    return NextResponse.json({
      ok: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: result ? 'connected' : 'disconnected',
      service: 'ERP-BR API'
    })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      {
        ok: false,
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        service: 'ERP-BR API',
        error: 'Database connection failed'
      },
      { status: 500 }
    )
  }
}