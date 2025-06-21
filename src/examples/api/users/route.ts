// @ts-ignore
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json([
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
  ])
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  
  const newUser = {
    id: Date.now(),
    name: body.name,
    email: body.email
  }
  
  return NextResponse.json(newUser, { status: 201 })
}