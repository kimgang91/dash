import { NextResponse } from 'next/server';
import { getSalesData } from '@/lib/googleSheets';

// 동적 라우트로 설정 (빌드 타임에 실행되지 않음)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Node.js runtime 사용

export async function GET(request: Request) {
  const startTime = Date.now();
  console.log(`[API] GET /api/sales 요청 시작 - ${new Date().toISOString()}`);
  
  try {
    // User-Agent 로깅 (모바일 디버깅용)
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
    console.log(`[API] 클라이언트: ${isMobile ? '모바일' : 'PC'}, User-Agent: ${userAgent.substring(0, 100)}`);
    
    // 캐시 방지 헤더 설정
    console.log(`[API] Google Sheets 데이터 가져오기 시작...`);
    const data = await getSalesData();
    const elapsed = Date.now() - startTime;
    
    console.log(`[API] 데이터 가져오기 완료: ${data.length}개 항목, 소요 시간: ${elapsed}ms`);
    
    return NextResponse.json(
      { data },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Data-Count': String(data.length),
          'X-Response-Time': String(elapsed),
        },
      }
    );
  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    console.error(`[API] 오류 발생 (소요 시간: ${elapsed}ms):`, error);
    console.error(`[API] 오류 스택:`, error.stack);
    
    const errorMessage = error.message || 'Failed to fetch sales data';
    
    return NextResponse.json(
      { 
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
          'X-Error': 'true',
          'X-Response-Time': String(elapsed),
        },
      }
    );
  }
}
