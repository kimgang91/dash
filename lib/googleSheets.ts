// Google Sheets 공개 CSV 방식으로 데이터 가져오기
// 인증 없이 공개 스프레드시트에서 데이터를 가져올 수 있습니다

const SALES_DB_SPREADSHEET_ID = '1_laE9Yxj-tajY23k36z3Bg2A_Mds8_V2A81DHnrUO68';
const SALES_DB_SHEET_ID = '907098998'; // gid (시트 ID)

// CSV URL 생성 (공개 스프레드시트용)
function getCSVUrl(sheetId: string) {
  // Google Sheets CSV export URL 형식
  return `https://docs.google.com/spreadsheets/d/${SALES_DB_SPREADSHEET_ID}/export?format=csv&gid=${sheetId}`;
}

// CSV 데이터 파싱 (간단한 방식)
function parseCSV(csvText: string): string[][] {
  const rows: string[][] = [];
  const lines = csvText.split(/\r?\n/);
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    // 간단한 CSV 파싱 (쉼표로 분리, 따옴표 처리)
    const row: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    // 마지막 필드 추가
    row.push(current.trim());
    rows.push(row);
  }
  
  return rows;
}

// 영업 현황 데이터 가져오기 (CSV 방식)
export async function getSalesData() {
  try {
    // CSV URL로 데이터 가져오기
    const csvUrl = getCSVUrl(SALES_DB_SHEET_ID);
    console.log(`Fetching data from: ${csvUrl}`);
    
    const response = await fetch(csvUrl, {
      cache: 'no-store', // 항상 최신 데이터 가져오기
    });
    
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error(
          `Google Sheets가 공개되어 있지 않습니다.\n\n` +
          `해결 방법:\n` +
          `1. Google Sheets 문서를 엽니다:\n` +
          `   https://docs.google.com/spreadsheets/d/${SALES_DB_SPREADSHEET_ID}/edit\n` +
          `2. 우측 상단 "공유" 버튼을 클릭합니다\n` +
          `3. "링크가 있는 모든 사용자" 또는 "공개"로 설정합니다\n` +
          `4. 권한을 "보기 가능(뷰어)"로 설정합니다\n` +
          `5. "완료"를 클릭합니다`
        );
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const csvText = await response.text();
    const rows = parseCSV(csvText);
    
    if (!rows || rows.length === 0) {
      console.log('No rows found in CSV');
      return [];
    }

    console.log(`Total rows fetched: ${rows.length}`);

    // 헤더 찾기 (3번째 행이 헤더)
    let headerRowIndex = 2;
    for (let i = 0; i < Math.min(5, rows.length); i++) {
      if (rows[i] && rows[i].length > 0) {
        const rowText = rows[i].join(' ');
        if (rowText.includes('지역') || rowText.includes('컨택') || rowText.includes('결과')) {
          headerRowIndex = i;
          break;
        }
      }
    }

    const headers = rows[headerRowIndex] || [];
    if (headers.length === 0) {
      throw new Error('헤더 행을 찾을 수 없습니다.');
    }

    console.log(`Header row: ${headerRowIndex + 1}, Columns: ${headers.length}`);

    // 컬럼 매핑
    const columnMap: { [key: string]: number } = {
      '시/도': 2,
      '시/군/구': 3,
      '담당 MD': 8,
      '결과': 10,
      '사유': 11,
    };

    // 헤더에서 실제 컬럼명 확인
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
      .map((row: string[], index: number) => {
        if (!row || row.length === 0) {
          return null;
        }
        
        const hasData = row.some((cell: string) => cell && cell.trim() !== '');
        if (!hasData) {
          return null;
        }

        const item: any = { 
          id: index + 1,
        };
        
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
        
        return (item['담당 MD'] || item['결과']) ? item : null;
      })
      .filter((item: any) => item !== null);

    console.log(`Processed ${data.length} data items`);
    return data;
  } catch (error: any) {
    console.error('Error fetching sales data:', error);
    
    let errorMessage = '데이터를 불러오는 중 오류가 발생했습니다.';
    
    if (error.message) {
      errorMessage = error.message;
    } else if (error.code === 403 || error.message?.includes('공개')) {
      errorMessage = `Google Sheets가 공개되어 있지 않습니다.\n\n` +
        `해결 방법:\n` +
        `1. Google Sheets 문서를 엽니다:\n` +
        `   https://docs.google.com/spreadsheets/d/${SALES_DB_SPREADSHEET_ID}/edit\n` +
        `2. 우측 상단 "공유" 버튼을 클릭합니다\n` +
        `3. "링크가 있는 모든 사용자" 또는 "공개"로 설정합니다\n` +
        `4. 권한을 "보기 가능(뷰어)"로 설정합니다\n` +
        `5. "완료"를 클릭합니다`;
    }
    
    throw new Error(errorMessage);
  }
}
