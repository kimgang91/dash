import { NextResponse } from 'next/server';
import { getSalesData } from '@/lib/googleSheets';

// 동적 라우트로 설정 (빌드 타임에 실행되지 않음)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Node.js runtime 사용

export async function GET(request: Request) {
  try {
    // 캐시 방지 헤더 설정
    const data = await getSalesData();
    return NextResponse.json(
      { data },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error: any) {
    console.error('Error in API route:', error);
    
    const errorMessage = error.message || 'Failed to fetch sales data';
    
    return NextResponse.json(
      { 
        error: errorMessage,
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}
