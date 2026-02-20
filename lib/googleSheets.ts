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

    // 헤더 찾기 (3번째 행이 헤더, F열에 "캠핑장명"이 있음)
    let headerRowIndex = 2; // 기본값: 3행 (인덱스 2)
    for (let i = 0; i < Math.min(5, rows.length); i++) {
      if (rows[i] && rows[i].length > 0) {
        const rowText = rows[i].join(' ');
        // 캠핑장명이 F열(인덱스 5)에 있는지 확인
        const hasCampingName = rows[i][5] && String(rows[i][5]).trim().includes('캠핑장명');
        if (hasCampingName || rowText.includes('지역') || rowText.includes('컨택') || rowText.includes('결과')) {
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

    // 모든 헤더를 컬럼명으로 사용
    const columnMap: { [key: string]: number } = {};
    headers.forEach((header, index) => {
      const headerKey = header.trim();
      if (headerKey) {
        columnMap[headerKey] = index;
      }
    });

    // 정확한 컬럼 매핑 (3행 헤더 기준)
    // C열(인덱스 2) = 지역(광역)
    // D열(인덱스 3) = 지역(시/군/리)
    // F열(인덱스 5) = 캠핑장명
    // I열(인덱스 8) = 컨택MD
    // J열(인덱스 9) = 컨택 최종일
    // K열(인덱스 10) = 결과
    // L열(인덱스 11) = 사유
    // M열(인덱스 12) = 내용

    // 컬럼명 매핑 (헤더명과 내부 키 매핑)
    const columnNameMap: { [key: string]: string } = {
      '지역(광역)': '지역(광역)',
      '지역(시/군/리)': '지역(시/군/리)',
      '캠핑장명': '캠핑장명',
      '컨택MD': '컨택MD',
      '컨택 최종일': '컨택 최종일',
      '결과': '결과',
      '사유': '사유',
      '내용': '내용',
    };

    // 주요 컬럼 인덱스 확인
    const campingNameIndex = columnMap['캠핑장명'] !== undefined ? columnMap['캠핑장명'] : 5; // F열 = 인덱스 5

    console.log(`캠핑장명 컬럼 인덱스: ${campingNameIndex}`);
    console.log(`총 컬럼 수: ${headers.length}`);
    console.log(`헤더 목록:`, headers.slice(0, 15)); // 처음 15개 컬럼만 로그

    // 데이터 처리 (5행부터 시작, 0-based로는 4행부터)
    // 헤더가 3행(인덱스 2)이므로 데이터는 4행(인덱스 3)부터 시작
    // 하지만 사용자가 5행부터라고 했으므로 인덱스 4부터 시작
    const dataStartIndex = headerRowIndex + 2; // 헤더 다음 다음 행부터 (5행 = 인덱스 4)
    const dataRows = rows.slice(dataStartIndex);
    
    const data = dataRows
      .map((row: string[], index: number) => {
        if (!row || row.length === 0) {
          return null;
        }
        
        // 캠핑장명이 있는지 확인 (F열 = 인덱스 5)
        const campingName = row[campingNameIndex]?.trim();
        if (!campingName || campingName === '') {
          return null; // 캠핑장명이 없으면 스킵
        }
        
        // 모든 컬럼 데이터를 객체로 변환
        const item: any = { 
          id: dataStartIndex + index + 1, // 실제 행 번호
          '캠핑장명': campingName,
        };
        
        // 모든 헤더에 대해 데이터 매핑 (원본 헤더명 그대로 사용)
        headers.forEach((header, colIndex) => {
          const headerKey = header.trim();
          if (headerKey && row[colIndex] !== undefined) {
            const cellValue = String(row[colIndex]).trim();
            // 빈 값도 포함하되, null/undefined는 제외
            if (cellValue !== '' && cellValue !== 'undefined' && cellValue !== 'null') {
              item[headerKey] = cellValue;
            }
          }
        });
        
        return item;
      })
      .filter((item: any) => item !== null && item['캠핑장명']);

    console.log(`Processed ${data.length} camping sites`);
    console.log(`Sample data (first item):`, data[0] ? Object.keys(data[0]) : 'No data');
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
