import { google } from 'googleapis';

// 서비스 계정 정보 (JSON 파일에서 직접)
const SERVICE_ACCOUNT = {
  type: 'service_account',
  project_id: 'genial-retina-488004-s8',
  private_key_id: '3903822f056926ad2d3bcf3184532ccb8ff15d26',
  private_key: `-----BEGIN PRIVATE KEY-----
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
-----END PRIVATE KEY-----`,
  client_email: 'dashboard@genial-retina-488004-s8.iam.gserviceaccount.com',
  client_id: '102732460311255439751',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/dashboard%40genial-retina-488004-s8.iam.gserviceaccount.com',
  universe_domain: 'googleapis.com'
};

// Google Sheets API 클라이언트 초기화
function getSheetsClient() {
  // 서비스 계정 정보 직접 사용
  const auth = new google.auth.GoogleAuth({
    credentials: SERVICE_ACCOUNT,
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
    console.log(`Using sheet: ${sheetName} (gid: ${SALES_DB_SHEET_ID})`);
    
    // 데이터 가져오기
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SALES_DB_SPREADSHEET_ID,
      range: `${sheetName}!A:Z`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('No rows found in spreadsheet');
      return [];
    }

    console.log(`Total rows fetched: ${rows.length}`);

    // 헤더 찾기 (3번째 행이 헤더)
    let headerRowIndex = 2; // 기본값: 3번째 행
    for (let i = 0; i < Math.min(5, rows.length); i++) {
      if (rows[i] && Array.isArray(rows[i])) {
        const rowText = rows[i].join(' ');
        if (rowText.includes('지역') || rowText.includes('컨택') || rowText.includes('결과')) {
          headerRowIndex = i;
          console.log(`Header found at row index: ${headerRowIndex}`);
          break;
        }
      }
    }

    const headers = rows[headerRowIndex] as string[];
    if (!headers) {
      console.error('Header row not found');
      return [];
    }

    console.log(`Headers: ${headers.slice(0, 5).join(', ')}...`);

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

    console.log(`Processed data items: ${data.length}`);
    return data;
  } catch (error: any) {
    console.error('Error fetching sales data:', error);
    
    // 구체적인 에러 메시지
    let errorMessage = '데이터를 불러오는 중 오류가 발생했습니다.';
    
    if (error.message) {
      errorMessage = error.message;
    } else if (error.code === 403) {
      errorMessage = `Google Sheets 접근 권한이 없습니다. 
서비스 계정 이메일(${SERVICE_ACCOUNT.client_email})을 Google Sheets에 공유했는지 확인해주세요.
Google Sheets 문서를 열고 "공유" 버튼을 클릭하여 위 이메일을 추가하세요.`;
    } else if (error.code === 404) {
      errorMessage = 'Google Sheets를 찾을 수 없습니다. 스프레드시트 ID를 확인해주세요.';
    } else if (error.message?.includes('invalid_grant') || error.message?.includes('JWT')) {
      errorMessage = `Google API 인증 실패. 
서비스 계정이 올바르게 설정되었는지 확인해주세요.
에러 코드: ${error.code || 'N/A'}`;
    }
    
    throw new Error(errorMessage);
  }
}
