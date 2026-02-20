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
    
    // 상세한 에러 정보 반환
    const errorMessage = error.message || 'Failed to fetch sales data';
    
    // 환경변수 체크 (모든 가능한 이름 확인)
    const envCheck = {
      GOOGLE_SHEETS_CLIENT_EMAIL: !!process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      CLIENT_EMAIL: !!process.env.CLIENT_EMAIL,
      GOOGLE_SHEETS_PRIVATE_KEY: !!process.env.GOOGLE_SHEETS_PRIVATE_KEY,
      PRIVATE_KEY: !!process.env.PRIVATE_KEY,
      clientEmailValue: (process.env.GOOGLE_SHEETS_CLIENT_EMAIL || process.env.CLIENT_EMAIL || '').substring(0, 30) + '...',
    };
    
    return NextResponse.json(
      { 
        error: errorMessage,
        envCheck,
        hint: 'Vercel 환경변수 이름을 확인하세요. CLIENT_EMAIL과 PRIVATE_KEY 또는 GOOGLE_SHEETS_CLIENT_EMAIL과 GOOGLE_SHEETS_PRIVATE_KEY 중 하나를 사용하세요.'
      },
      { status: 500 }
    );
  }
}
