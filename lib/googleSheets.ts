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
    
    // 처음 10개 행 출력하여 구조 확인
    console.log('=== 시트 구조 확인 ===');
    for (let i = 0; i < Math.min(10, rows.length); i++) {
      console.log(`Row ${i + 1}:`, rows[i]?.slice(0, 15)); // 처음 15개 컬럼
    }

    // 헤더 찾기 - 시트 구조에 맞게 수정
    // 4행이 헤더 (인덱스 3)
    let headerRowIndex = -1;
    
    // 여러 키워드로 헤더 행 찾기
    const headerKeywords = ['캠핑장명', '지역(광역)', '지역(시/군/리)', '컨택MD', '컨택 최종일', '결과', '사유', '내용'];
    
    // 먼저 4행(인덱스 3) 확인
    if (rows[3] && rows[3].length > 0) {
      const rowText = rows[3].join(' ').toLowerCase();
      let matchCount = 0;
      headerKeywords.forEach(keyword => {
        if (rowText.includes(keyword.toLowerCase())) {
          matchCount++;
        }
      });
      if (matchCount >= 3) {
        headerRowIndex = 3;
        console.log(`헤더 행 발견: 4행 (매칭 키워드: ${matchCount}개)`);
      }
    }
    
    // 4행이 헤더가 아니면 다른 행 찾기
    if (headerRowIndex === -1) {
      for (let i = 0; i < Math.min(10, rows.length); i++) {
        if (!rows[i] || rows[i].length === 0) continue;
        
        const rowText = rows[i].join(' ').toLowerCase();
        let matchCount = 0;
        
        headerKeywords.forEach(keyword => {
          if (rowText.includes(keyword.toLowerCase())) {
            matchCount++;
          }
        });
        
        if (matchCount >= 3) {
          headerRowIndex = i;
          console.log(`헤더 행 발견: ${i + 1}행 (매칭 키워드: ${matchCount}개)`);
          break;
        }
      }
    }
    
    // 헤더를 찾지 못한 경우, "캠핑장명"이 포함된 행 찾기
    if (headerRowIndex === -1) {
      for (let i = 0; i < Math.min(10, rows.length); i++) {
        if (rows[i] && rows[i].length > 0) {
          // F열(인덱스 5)에 "캠핑장명"이 있는지 확인
          const hasCampingName = rows[i][5] && String(rows[i][5]).trim().includes('캠핑장명');
          if (hasCampingName) {
            headerRowIndex = i;
            console.log(`헤더 행 발견 (캠핑장명 기준): ${i + 1}행`);
            break;
          }
        }
      }
    }
    
    if (headerRowIndex === -1) {
      throw new Error('헤더 행을 찾을 수 없습니다. 시트 구조를 확인해주세요.');
    }

    const headers = rows[headerRowIndex] || [];
    if (headers.length === 0) {
      throw new Error('헤더 행이 비어있습니다.');
    }

    console.log(`Header row: ${headerRowIndex + 1}, Columns: ${headers.length}`);
    console.log(`전체 헤더 목록:`, headers);

    // 모든 헤더를 컬럼명으로 사용 (공백 제거 및 정규화)
    const columnMap: { [key: string]: number } = {};
    const normalizedColumnMap: { [key: string]: string } = {}; // 정규화된 이름 -> 원본 이름
    
    headers.forEach((header, index) => {
      const headerKey = header.trim();
      if (headerKey) {
        columnMap[headerKey] = index;
        // 정규화된 키도 저장 (공백 제거, 대소문자 무시)
        const normalized = headerKey.replace(/\s+/g, '').toLowerCase();
        normalizedColumnMap[normalized] = headerKey;
      }
    });

    // 주요 컬럼 찾기 (다양한 변형 시도)
    const findColumnIndex = (possibleNames: string[]): number | null => {
      for (const name of possibleNames) {
        // 정확한 매칭
        if (columnMap[name] !== undefined) {
          return columnMap[name];
        }
        // 정규화된 매칭
        const normalized = name.replace(/\s+/g, '').toLowerCase();
        if (normalizedColumnMap[normalized]) {
          return columnMap[normalizedColumnMap[normalized]];
        }
        // 부분 매칭
        for (const headerKey in columnMap) {
          if (headerKey.includes(name) || name.includes(headerKey)) {
            return columnMap[headerKey];
          }
        }
      }
      return null;
    };

    // 캠핑장명 컬럼 찾기
    const campingNameIndex = findColumnIndex(['캠핑장명', '캠핑장', '장명']) ?? 5;
    
    // 주요 컬럼 인덱스 확인
    const regionWideIndex = findColumnIndex(['지역(광역)', '지역광역', '광역']);
    const regionDetailIndex = findColumnIndex(['지역(시/군/리)', '지역시군리', '시군리']);
    const contactMDIndex = findColumnIndex(['컨택MD', '컨택 MD', '담당MD', 'MD']);
    const contactDateIndex = findColumnIndex(['컨택 최종일', '컨택최종일', '최종일']);
    const resultIndex = findColumnIndex(['결과']);
    const reasonIndex = findColumnIndex(['사유']);
    const contentIndex = findColumnIndex(['내용']);

    console.log(`=== 컬럼 인덱스 매핑 ===`);
    console.log(`캠핑장명: ${campingNameIndex}`);
    console.log(`지역(광역): ${regionWideIndex ?? '없음'}`);
    console.log(`지역(시/군/리): ${regionDetailIndex ?? '없음'}`);
    console.log(`컨택MD: ${contactMDIndex ?? '없음'}`);
    console.log(`컨택 최종일: ${contactDateIndex ?? '없음'}`);
    console.log(`결과: ${resultIndex ?? '없음'}`);
    console.log(`사유: ${reasonIndex ?? '없음'}`);
    console.log(`내용: ${contentIndex ?? '없음'}`);
    console.log(`총 컬럼 수: ${headers.length}`);

    // 데이터 처리 - 헤더 다음 행부터 시작 (5행부터, 인덱스 4)
    // 시트 구조: 4행이 헤더, 5행부터 데이터
    let dataStartIndex = headerRowIndex + 1;
    
    // 헤더 다음 몇 개 행을 확인하여 실제 데이터 시작 위치 찾기
    for (let i = headerRowIndex + 1; i < Math.min(headerRowIndex + 3, rows.length); i++) {
      if (rows[i] && rows[i].length > 0) {
        const campingName = rows[i][campingNameIndex]?.trim();
        // 캠핑장명이 있고, 헤더가 아닌 경우 데이터 행으로 간주
        // 빈 행(구분만 있고 캠핑장명이 없는 경우)은 스킵
        if (campingName && campingName !== '' && !headers.includes(campingName) && campingName !== '구 분') {
          dataStartIndex = i;
          break;
        }
      }
    }
    
    console.log(`데이터 시작 행: ${dataStartIndex + 1}`);
    const dataRows = rows.slice(dataStartIndex);
    
    const data = dataRows
      .map((row: string[], index: number) => {
        if (!row || row.length === 0) {
          return null;
        }
        
        // 캠핑장명이 있는지 확인 (F열 = 인덱스 5)
        const campingName = row[campingNameIndex]?.trim();
        if (!campingName || campingName === '' || headers.includes(campingName) || campingName === '구 분') {
          return null; // 캠핑장명이 없거나 헤더와 동일하거나 빈 행이면 스킵
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
            // '구 분' 같은 헤더는 제외
            if (headerKey !== '구 분' && headerKey !== '') {
              item[headerKey] = cellValue;
            }
          }
        });
        
        // 주요 컬럼이 없으면 인덱스로 직접 매핑 (컬럼명이 다를 수 있음)
        // C열(인덱스 2) = 지역(광역)
        if ((!item['지역(광역)'] || item['지역(광역)'] === '') && row[2]) {
          item['지역(광역)'] = String(row[2]).trim();
        }
        // D열(인덱스 3) = 지역(시/군/리)
        if ((!item['지역(시/군/리)'] || item['지역(시/군/리)'] === '') && row[3]) {
          item['지역(시/군/리)'] = String(row[3]).trim();
        }
        // I열(인덱스 8) = 컨택MD
        if ((!item['컨택MD'] || item['컨택MD'] === '') && row[8]) {
          item['컨택MD'] = String(row[8]).trim();
        }
        // J열(인덱스 9) = 컨택 최종일
        if ((!item['컨택 최종일'] || item['컨택 최종일'] === '') && row[9]) {
          item['컨택 최종일'] = String(row[9]).trim();
        }
        // K열(인덱스 10) = 결과
        if ((!item['결과'] || item['결과'] === '') && row[10]) {
          item['결과'] = String(row[10]).trim();
        }
        // L열(인덱스 11) = 사유
        if ((!item['사유'] || item['사유'] === '') && row[11]) {
          item['사유'] = String(row[11]).trim();
        }
        // M열(인덱스 12) = 내용
        if ((!item['내용'] || item['내용'] === '') && row[12]) {
          item['내용'] = String(row[12]).trim();
        }
        
        return item;
      })
      .filter((item: any) => item !== null && item['캠핑장명']);

    console.log(`Processed ${data.length} camping sites`);
    
    if (data.length === 0) {
      console.warn('⚠️ 처리된 데이터가 없습니다. 시트 구조를 확인해주세요.');
      throw new Error('처리된 데이터가 없습니다. 시트 구조가 변경되었을 수 있습니다.');
    }
    
    if (data.length > 0) {
      console.log(`Sample data (first item):`, data[0]);
      console.log(`Sample data keys:`, Object.keys(data[0]));
      // 컬럼명 확인
      const sampleItem = data[0];
      console.log(`컬럼 확인:`, {
        '지역(광역)': sampleItem['지역(광역)'],
        '지역(시/군/리)': sampleItem['지역(시/군/리)'],
        '컨택MD': sampleItem['컨택MD'],
        '결과': sampleItem['결과'],
        '사유': sampleItem['사유'],
      });
      // 컨택MD가 있는 항목 수 확인
      const withMD = data.filter(item => item['컨택MD'] && item['컨택MD'].trim() !== '').length;
      const withResult = data.filter(item => item['결과'] && item['결과'].trim() !== '').length;
      console.log(`컨택MD가 있는 항목: ${withMD}개`);
      console.log(`결과가 있는 항목: ${withResult}개`);
    }
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
