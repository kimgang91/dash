import { NextResponse } from 'next/server';
import { getSalesData } from '@/lib/googleSheets';

// 동적 라우트로 설정 (빌드 타임에 실행되지 않음)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const data = await getSalesData();
    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error in API route:', error);
    
    const errorMessage = error.message || 'Failed to fetch sales data';
    
    return NextResponse.json(
      { 
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
