import { NextResponse } from 'next/server';
import { getSalesData } from '@/lib/googleSheets';

export async function GET() {
  try {
    const data = await getSalesData();
    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sales data' },
      { status: 500 }
    );
  }
}
