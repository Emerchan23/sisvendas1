import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return new Response('Hello World', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  })
}

export async function POST(request: NextRequest) {
  return new Response(JSON.stringify({ message: 'Simple POST response' }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}