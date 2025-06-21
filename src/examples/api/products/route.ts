// @ts-ignore
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  
  const products = [
    { id: 1, name: 'Laptop', price: 999.99, category: 'electronics' },
    { id: 2, name: 'Book', price: 19.99, category: 'books' },
    { id: 3, name: 'Phone', price: 599.99, category: 'electronics' }
  ]
  
  const filteredProducts = category 
    ? products.filter(p => p.category === category)
    : products
  
  return NextResponse.json(filteredProducts)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  
  const newProduct = {
    id: Date.now(),
    name: body.name,
    price: body.price,
    category: body.category
  }
  
  return NextResponse.json(newProduct, { status: 201 })
}