import { google } from 'googleapis';

// Private Key (JSON 파일에서 직접 복사한 값)
// 이 값은 Vercel 환경변수에 Base64로 인코딩해서 저장하거나, 직접 사용
const DEFAULT_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDlE1e221+auYtT
KnRD92hTbacnjut43kDRitpaCkby4/1LH519p+1eUBBhaDjVEmHN8KickY3/1MEo
+7tG+Y57RJyQUx2DNAivXxrEsN9dLDJPhbIp26QoGaxuKNUgsXfezQEuvozD55eT
b/1VajLTUIrXBqFvoctJ4s3AY1E4DxVbHOP4IQZdAtCRxifjyoi2BNwIkC8f21W5
BPEJBSi3tKNc8mVKItDuLVoHr9LyzsGHODA/25F2qNmt+YRhmMDzJzXt7z0JjlWU
9RlYMEql+1yIZQKRl3ukTvsNTkqYiRO481V76XchT9cXqiCm03PmwajUobiPF600
WsnumwqpAgMBAAECggEACldNseEEV1lB616ywfC0wnNkRNpkUeACoBL7GW52Vnep
Uw9Zzjba9dN6cdNBIYlDZgcTrYG6nc5ua9m1UhZo8rKduLwvzGD4dWY/MJrlcnDQ
0psv+EjEh9Tk3lI0kNXCGgo6H/CVLTDSvGKlVopFQhnUMrHHbuEoaqz06dbx7yxV
Q9n09tqtFmc+liMZfwGEcrP0yjeYoKOyVn8BO2ah/vC7x6ZwD1WzodUGP8mbtf6K
dlgsdvI9DmUN5dSVt4ah4gGkfyUqzcjfkVvI833/iVUFcUHsm0UDFT6rqcVyeFhe
rkjiZVjNapfOmukfRSqb/tQnOwUxnpzdCctI8nD0KQKBgQD6G8AfBNu3aQUSz/kg
tI8LoxTJ4yKxwA2q13tm0wnA0gtV4QM2hgHnI21/ThNjgiFVHDzfLrSrDtZWgLZi
wrL3N9Vckf3yB+c5oPT4BRZr04SCakXrX3RDdH0tiD3zeV8MPWQ6cbr7zxsdJxzE
JsVleWmHSDHPvLBYDU7PTrFazQKBgQDqeMGMw+IbPo01nJ65CdmgciEiWwsIGvDB
7LaaOiWvUlLW/arvchM+i6e/qEYqKerG+1iGv6qDL97yjSOsZ+Capa9YRjWR4QP4
EPUoRC3QK3+9qxdFeQn3IxPgboNcjD/gOk87CTZrc6yCq9PTG7vAgwzuWdLNMTL3
/S5wwyOnTQKBgHe9cW1oVgipLtSi3RLbXuCjYwCEzcdrux9fqqS/xJub8/FZmMAx
yBdwzqt0JbQuSOcGbd4r7jM3F0ayuJ7vt97DzFJVUs7dGcZtWNqlFObqjTYiyva0
7GSfEI8L+xzlrqudeK7CZFLKBKEgaJVAOqEqT2uFFNPv8j01odV+R0rBAoGAKZkQ
5ZNfCuxXCxrlQfjQZlm5LSov09lLu2vunYARbYBSeBf6+o4ngeIu+Z62DAbxwymW
dBmO+8VDbY7CtHSdcXJRoHycRmxAUwNXKzSlWBhPimvPLiEiNnk/roKMxZ+QOYy+
v7+LqxaTlX88jmiOL8JQSf0fnA3NeBev5IuKSMUCgYEAtGOfJ7v7PI3YmpvbiFfD
e1Xf7xryReZRubKxHYQeHROyd98KSDVuZ3jKBS8MvvWoNsviZpg7rAX9mRuvRz5s
2O4etDd2RiZpVvIzE4jNzcqfKoVOYjfzFsqkS8oJk9E4WpQmofElS6W0DZCrEf8/
VIQFb6N9kM6JP69NFVE57Gc=
-----END PRIVATE KEY-----`;

// Google Sheets API 클라이언트 초기화
function getSheetsClient() {
  const clientEmail = 'dashboard@genial-retina-488004-s8.iam.gserviceaccount.com';
  
  // 환경변수에서 Private Key 읽기 시도
  let privateKey = process.env.PRIVATE_KEY || process.env.GOOGLE_SHEETS_PRIVATE_KEY;
  
  // 환경변수가 없으면 기본값 사용 (개발용)
  if (!privateKey) {
    console.warn('환경변수 PRIVATE_KEY가 없어 기본값을 사용합니다. 프로덕션에서는 환경변수를 설정해주세요.');
    privateKey = DEFAULT_PRIVATE_KEY;
  } else {
    // 환경변수에서 읽은 경우 파싱
    privateKey = privateKey.trim();
    
    // 큰따옴표 제거
    while ((privateKey.startsWith('"') && privateKey.endsWith('"')) || 
           (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
      privateKey = privateKey.slice(1, -1).trim();
    }
    
    // \n을 실제 줄바꿈으로 변환
    privateKey = privateKey.replace(/\\n/g, '\n');
    privateKey = privateKey.trim();
  }

  // 최종 검증
  if (!privateKey.includes('BEGIN PRIVATE KEY') || !privateKey.includes('END PRIVATE KEY')) {
    throw new Error(
      `Private Key 형식이 올바르지 않습니다. ` +
      `BEGIN PRIVATE KEY와 END PRIVATE KEY가 포함되어야 합니다. ` +
      `현재 길이: ${privateKey.length}자`
    );
  }

  // Google Auth 설정
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
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
    
    // 시트 목록 확인
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SALES_DB_SPREADSHEET_ID,
    });
    
    // gid=907098998에 해당하는 시트 찾기
    const targetSheet = spreadsheet.data.sheets?.find(
      (sheet: any) => String(sheet.properties?.sheetId) === SALES_DB_SHEET_ID
    );
    
    const sheetName = targetSheet?.properties?.title || 'Sheet1';
    
    // 데이터 가져오기
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SALES_DB_SPREADSHEET_ID,
      range: `${sheetName}!A:Z`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return [];
    }

    // 헤더 찾기 (3번째 행이 헤더)
    let headerRowIndex = 2; // 기본값: 3번째 행
    for (let i = 0; i < Math.min(5, rows.length); i++) {
      if (rows[i] && Array.isArray(rows[i])) {
        const rowText = rows[i].join(' ');
        if (rowText.includes('지역') || rowText.includes('컨택') || rowText.includes('결과')) {
          headerRowIndex = i;
          break;
        }
      }
    }

    const headers = rows[headerRowIndex] as string[];
    if (!headers) {
      return [];
    }

    // 컬럼 매핑 (직접 인덱스 사용)
    const columnMap: { [key: string]: number } = {
      '시/도': 2,        // C열: 지역(광역)
      '시/군/구': 3,     // D열: 지역(시/군/리)
      '담당 MD': 8,      // I열: 컨택MD
      '결과': 10,        // K열: 결과
      '사유': 11,        // L열: 사유
    };

    // 헤더에서 실제 컬럼명 확인하여 매핑 업데이트
    headers.forEach((header, index) => {
      const headerLower = header.trim().toLowerCase();
      if (headerLower.includes('지역') && headerLower.includes('광역')) {
        columnMap['시/도'] = index;
      }
      if (headerLower.includes('지역') && (headerLower.includes('시/군') || headerLower.includes('시군'))) {
        columnMap['시/군/구'] = index;
      }
      if (headerLower.includes('컨택') && headerLower.includes('md')) {
        columnMap['담당 MD'] = index;
      }
      if (headerLower.includes('결과')) {
        columnMap['결과'] = index;
      }
      if (headerLower.includes('사유')) {
        columnMap['사유'] = index;
      }
    });

    // 데이터 처리
    const dataRows = rows.slice(headerRowIndex + 1);
    const data = dataRows
      .map((row: any, index: number) => {
        // 빈 행 체크
        if (!row || !Array.isArray(row) || row.every((cell: any) => !cell || String(cell).trim() === '')) {
          return null;
        }

        const item: any = { 
          id: index + 1,
        };
        
        // 컬럼 값 추출
        if (columnMap['시/도'] !== undefined && row[columnMap['시/도']]) {
          item['시/도'] = String(row[columnMap['시/도']]).trim();
        }
        if (columnMap['시/군/구'] !== undefined && row[columnMap['시/군/구']]) {
          item['시/군/구'] = String(row[columnMap['시/군/구']]).trim();
        }
        if (columnMap['담당 MD'] !== undefined && row[columnMap['담당 MD']]) {
          item['담당 MD'] = String(row[columnMap['담당 MD']]).trim();
        }
        if (columnMap['결과'] !== undefined && row[columnMap['결과']]) {
          item['결과'] = String(row[columnMap['결과']]).trim();
        }
        if (columnMap['사유'] !== undefined && row[columnMap['사유']]) {
          item['사유'] = String(row[columnMap['사유']]).trim();
        }
        
        // 최소한 MD나 결과가 있어야 유효한 데이터
        return (item['담당 MD'] || item['결과']) ? item : null;
      })
      .filter((item: any) => item !== null);

    return data;
  } catch (error: any) {
    console.error('Error fetching sales data:', error);
    
    // 구체적인 에러 메시지
    let errorMessage = '데이터를 불러오는 중 오류가 발생했습니다.';
    
    if (error.message) {
      errorMessage = error.message;
    } else if (error.code === 403) {
      errorMessage = 'Google Sheets 접근 권한이 없습니다. 서비스 계정 이메일(dashboard@genial-retina-488004-s8.iam.gserviceaccount.com)을 Google Sheets에 공유했는지 확인해주세요.';
    } else if (error.code === 404) {
      errorMessage = 'Google Sheets를 찾을 수 없습니다.';
    } else if (error.message?.includes('invalid_grant') || error.message?.includes('JWT')) {
      errorMessage = 'Google API 인증 실패. Private Key 설정을 확인해주세요.';
    }
    
    throw new Error(errorMessage);
  }
}
