import { NextResponse } from 'next/server';

// GETリクエストのハンドラー
export async function GET() {
  return NextResponse.json({ 
    message: 'Hello from Next.js API!',
    time: new Date().toISOString() 
  });
}

// POSTリクエストのハンドラー例
export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ 
    received: body,
    status: 'success' 
  });
}