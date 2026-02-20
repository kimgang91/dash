import { NextResponse } from 'next/server';
import { getSalesData } from '@/lib/googleSheets';

export async function GET() {
  try {
    const data = await getSalesData();
    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error in API route:', error);
    
    // 상세한 에러 정보 반환
    const errorMessage = error.message || 'Failed to fetch sales data';
    
    // 개발 환경에서는 더 자세한 정보 제공
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    return NextResponse.json(
      { 
        error: errorMessage,
        ...(isDevelopment && {
          details: error.stack,
          envCheck: {
            hasClientEmail: !!process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
            hasPrivateKey: !!process.env.GOOGLE_SHEETS_PRIVATE_KEY,
            clientEmailPrefix: process.env.GOOGLE_SHEETS_CLIENT_EMAIL?.substring(0, 20) + '...',
          }
        })
      },
      { status: 500 }
    );
  }
}
