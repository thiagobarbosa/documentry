// app/api/users/route.ts

type UserRequest = {
  name: string;
  email: string;
  age?: number;
};

type UserResponse = {
  id: number;
  name: string;
  email: string;
  createdAt: string;
};

export async function GET(request: Request) {
  // Get query parameters
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')

  // Return mock user list
  return Response.json([
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      createdAt: new Date().toISOString()
    }
  ])
}

export async function POST(request: Request) {
  // Parse request body
  const body: UserRequest = await request.json()

  // Create new user (mock)
  const user: UserResponse = {
    id: 123,
    name: body.name,
    email: body.email,
    createdAt: new Date().toISOString()
  }

  return Response.json(user)
}

export async function DELETE(request: Request) {
  // Get user ID from query parameters
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return new Response('User ID is required', { status: 400 })
  }

  // Delete user (mock)
  return new Response(null, { status: 204 })
}