export async function GET() {
  try {
    const data = { message: 'Basic API working' };
    console.log('API básica chamada, retornando:', data);
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Erro na API básica:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export async function POST() {
  return Response.json({ message: 'Basic POST working' })
}