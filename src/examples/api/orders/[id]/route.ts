// @ts-ignore
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const orderId = params.id
  
  const order = {
    id: orderId,
    userId: 1,
    items: [
      { productId: 1, quantity: 2, price: 999.99 },
      { productId: 2, quantity: 1, price: 19.99 }
    ],
    total: 2019.97,
    status: 'pending'
  }
  
  return NextResponse.json(order)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const orderId = params.id
  const body = await request.json()
  
  const updatedOrder = {
    id: orderId,
    ...body,
    updatedAt: new Date().toISOString()
  }
  
  return NextResponse.json(updatedOrder)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const orderId = params.id
  
  return NextResponse.json({ 
    message: `Order ${orderId} deleted successfully` 
  })
}