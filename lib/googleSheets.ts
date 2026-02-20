import { google } from 'googleapis';

// Google Sheets API 클라이언트 초기화
function getSheetsClient() {
  // 1) 환경변수 이름 매핑 (둘 중 아무거나 있어도 동작하게)
  const clientEmail =
    process.env.GOOGLE_SHEETS_CLIENT_EMAIL || process.env.CLIENT_EMAIL;
  let privateKey =
    process.env.GOOGLE_SHEETS_PRIVATE_KEY || process.env.PRIVATE_KEY;

  if (!clientEmail) {
    throw new Error(
      'Google 서비스 계정 이메일 환경변수가 없습니다. Vercel에서 GOOGLE_SHEETS_CLIENT_EMAIL 또는 CLIENT_EMAIL 이름으로 설정해주세요.'
    );
  }

  if (!privateKey) {
    throw new Error(
      'Google 서비스 계정 Private Key 환경변수가 없습니다. Vercel에서 GOOGLE_SHEETS_PRIVATE_KEY 또는 PRIVATE_KEY 이름으로 설정해주세요.'
    );
  }

  // 2) Private Key 문자열 정리
  privateKey = privateKey.trim();

  // 양 끝에 " 로 둘러싸여 있으면 제거 (JSON에서 그대로 붙여넣은 경우)
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }

  // JSON에서 온 \n 을 실제 줄바꿈으로 변환
  const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

  // Private Key 형식 검증
  if (!formattedPrivateKey.includes('BEGIN PRIVATE KEY')) {
    throw new Error(
      'Google Private Key 형식이 올바르지 않습니다. BEGIN/END PRIVATE KEY 구간 전체를 복사했는지 확인해주세요.'
    );
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: formattedPrivateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  return google.sheets({ version: 'v4', auth });
}

// 고캠핑 DB 스프레드시트 ID
const SALES_DB_SPREADSHEET_ID = '1_laE9Yxj-tajY23k36z3Bg2A_Mds8_V2A81DHnrUO68';
const SALES_DB_SHEET_ID = '907098998'; // gid (시트 ID)

// 영업 현황 데이터 가져오기
export async function getSalesData() {
  try {
    const sheets = getSheetsClient();
    
    // 시트 목록 확인하여 올바른 시트 찾기
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SALES_DB_SPREADSHEET_ID,
    });
    
    // gid=907098998에 해당하는 시트 찾기
    const targetSheet = spreadsheet.data.sheets?.find(
      (sheet: any) => sheet.properties?.sheetId === parseInt(SALES_DB_SHEET_ID)
    );
    
    const sheetName = targetSheet?.properties?.title || 'Sheet1';
    console.log(`Using sheet: ${sheetName} (gid: ${SALES_DB_SHEET_ID})`);
    
    // 시트의 데이터 가져오기 (C열: 시/도, D열: 시/군/구, I열: 담당 MD, K열: 결과, L열: 사유)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SALES_DB_SPREADSHEET_ID,
      range: `${sheetName}!A:Z`, // 충분한 범위
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('No rows found in spreadsheet');
      return [];
    }

    console.log(`Total rows fetched: ${rows.length}`);

    // 헤더 찾기
    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(5, rows.length); i++) {
      if (rows[i] && Array.isArray(rows[i])) {
        const rowText = rows[i].join(' ');
        // 헤더 키워드 확인 (시/도, 담당 MD, 결과 등)
        if (rowText.includes('시/도') || rowText.includes('담당') || rowText.includes('MD') || rowText.includes('결과')) {
          headerRowIndex = i;
          console.log(`Header found at row index: ${headerRowIndex}`);
          break;
        }
      }
    }

    if (!rows[headerRowIndex]) {
      console.error('Header row not found');
      return [];
    }

    const headers = rows[headerRowIndex] as string[];
    console.log(`Headers: ${headers.join(', ')}`);

    // 헤더 매핑 (컬럼 인덱스 찾기)
    // 요구사항: C열(2)=시/도, D열(3)=시/군/구, I열(8)=담당 MD, K열(10)=결과, L열(11)=사유
    const columnMap: { [key: string]: number } = {};
    
    // 먼저 헤더에서 찾기
    headers.forEach((header, index) => {
      const headerLower = header.trim().toLowerCase();
      if (headerLower.includes('시/도') || headerLower.includes('시도')) {
        columnMap['시/도'] = index;
      }
      if (headerLower.includes('시/군/구') || headerLower.includes('시군구')) {
        columnMap['시/군/구'] = index;
      }
      if (headerLower.includes('담당') && (headerLower.includes('md') || headerLower.includes('m.d'))) {
        columnMap['담당 MD'] = index;
      }
      if (headerLower.includes('결과')) {
        columnMap['결과'] = index;
      }
      if (headerLower.includes('사유')) {
        columnMap['사유'] = index;
      }
    });
    
    // 헤더에서 찾지 못한 경우 직접 인덱스 사용 (C=2, D=3, I=8, K=10, L=11)
    if (columnMap['시/도'] === undefined && headers.length > 2) columnMap['시/도'] = 2;
    if (columnMap['시/군/구'] === undefined && headers.length > 3) columnMap['시/군/구'] = 3;
    if (columnMap['담당 MD'] === undefined && headers.length > 8) columnMap['담당 MD'] = 8;
    if (columnMap['결과'] === undefined && headers.length > 10) columnMap['결과'] = 10;
    if (columnMap['사유'] === undefined && headers.length > 11) columnMap['사유'] = 11;

    // 헤더 다음 행부터 데이터 시작
    const dataRows = rows.slice(headerRowIndex + 1);
    console.log(`Data rows (after header): ${dataRows.length}`);

    const data = dataRows
      .map((row, index) => {
        // 행이 비어있는지 확인
        const hasData = row && Array.isArray(row) && row.some((cell: any) => {
          const cellValue = String(cell || '').trim();
          return cellValue !== '' && cellValue !== 'undefined' && cellValue !== 'null';
        });

        if (!hasData) {
          return null;
        }

        const item: any = { 
          id: index + 1,
          rowNumber: headerRowIndex + index + 2 // 실제 스프레드시트 행 번호
        };
        
        // 매핑된 컬럼 값 추출
        if (columnMap['시/도'] !== undefined) {
          item['시/도'] = (row as any[])[columnMap['시/도']] ? String((row as any[])[columnMap['시/도']]).trim() : '';
        }
        if (columnMap['시/군/구'] !== undefined) {
          item['시/군/구'] = (row as any[])[columnMap['시/군/구']] ? String((row as any[])[columnMap['시/군/구']]).trim() : '';
        }
        if (columnMap['담당 MD'] !== undefined) {
          item['담당 MD'] = (row as any[])[columnMap['담당 MD']] ? String((row as any[])[columnMap['담당 MD']]).trim() : '';
        }
        if (columnMap['결과'] !== undefined) {
          item['결과'] = (row as any[])[columnMap['결과']] ? String((row as any[])[columnMap['결과']]).trim() : '';
        }
        if (columnMap['사유'] !== undefined) {
          item['사유'] = (row as any[])[columnMap['사유']] ? String((row as any[])[columnMap['사유']]).trim() : '';
        }
        
        return item;
      })
      .filter((item: any) => item !== null && (item['담당 MD'] || item['결과'])); // null 제거 및 필수 데이터 확인

    console.log(`Processed data items: ${data.length}`);
    return data;
  } catch (error: any) {
    console.error('Error fetching sales data:', error);
    
    // 구체적인 에러 메시지 생성
    let errorMessage = '데이터를 불러오는 중 오류가 발생했습니다.';
    
    if (error.message) {
      errorMessage = error.message;
    } else if (error.code === 403 || error.message?.includes('PERMISSION_DENIED')) {
      errorMessage = 'Google Sheets 접근 권한이 없습니다. 서비스 계정 이메일을 Google Sheets에 공유했는지 확인해주세요.';
    } else if (error.code === 404 || error.message?.includes('not found')) {
      errorMessage = 'Google Sheets를 찾을 수 없습니다. 스프레드시트 ID를 확인해주세요.';
    } else if (error.message?.includes('invalid_grant') || error.message?.includes('unauthorized')) {
      errorMessage = 'Google API 인증 실패. 환경변수(GOOGLE_SHEETS_CLIENT_EMAIL, GOOGLE_SHEETS_PRIVATE_KEY) 설정을 확인해주세요.';
    } else if (error.message?.includes('환경변수')) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
}
