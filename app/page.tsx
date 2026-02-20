'use client';

import { useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface SalesData {
  id: number;
  '캠핑장명': string;
  '지역(광역)'?: string;
  '지역(시/군/리)'?: string;
  '컨택MD'?: string;
  '컨택 최종일'?: string;
  '결과'?: string;
  '사유'?: string;
  '내용'?: string;
  [key: string]: any; // 모든 컬럼 데이터를 포함
}

interface FilterState {
  region: string;
  md: string;
  result: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export default function SalesDashboard() {
  const [data, setData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<SalesData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllDistricts, setShowAllDistricts] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filters, setFilters] = useState<FilterState>({
    region: '',
    md: '',
    result: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (showSuccess = false) => {
    try {
      setLoading(true);
      // 캐시 방지를 위해 타임스탬프 추가
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/sales?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (result.error) {
        // 상세한 에러 메시지 표시
        let errorMsg = result.error;
        if (result.details && process.env.NODE_ENV === 'development') {
          console.error('Error details:', result.details);
          console.error('Env check:', result.envCheck);
        }
        throw new Error(errorMsg);
      }
      if (result.data) {
        setData(result.data);
        setLastUpdateTime(new Date());
        setRefreshKey(prev => prev + 1);
        if (showSuccess) {
          console.log(`✅ 데이터 새로고침 완료: ${result.data.length}개 캠핑장 로드됨`);
        }
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      // 더 구체적인 에러 메시지 표시
      const errorMessage = error.message || '데이터를 불러오는 중 오류가 발생했습니다.';
      // 에러 메시지에 따라 다른 안내 표시
      if (errorMessage.includes('접근 권한') || errorMessage.includes('403') || errorMessage.includes('공개')) {
        alert(
          'Google Sheets가 공개되어 있지 않습니다.\n\n' +
          '해결 방법:\n' +
          '1. Google Sheets 문서를 엽니다:\n' +
          '   https://docs.google.com/spreadsheets/d/1_laE9Yxj-tajY23k36z3Bg2A_Mds8_V2A81DHnrUO68/edit\n' +
          '2. 우측 상단 "공유" 버튼 클릭\n' +
          '3. "링크가 있는 모든 사용자" 또는 "공개"로 설정\n' +
          '4. 권한: "보기 가능(뷰어)" 선택\n' +
          '5. "완료" 클릭'
        );
      } else {
        alert(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // 필터링된 데이터
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // 검색어 필터 (캠핑장명, 내용에서 검색)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const campingName = (item['캠핑장명'] || '').toLowerCase();
        const content = (item['내용'] || '').toLowerCase();
        if (!campingName.includes(searchLower) && !content.includes(searchLower)) {
          return false;
        }
      }
      // 지역 필터 (지역(광역))
      if (filters.region && item['지역(광역)'] !== filters.region) return false;
      // MD 필터 (컨택MD)
      if (filters.md && item['컨택MD'] !== filters.md) return false;
      // 결과 필터
      if (filters.result && item['결과'] !== filters.result) return false;
      return true;
    });
  }, [data, filters, searchTerm]);

  // KPI 계산
  const kpis = useMemo(() => {
    const total = filteredData.length;
    const newEntry = filteredData.filter((item) => item['결과'] === '입점(신규)').length;
    const rejected = filteredData.filter((item) => item['결과'] === '거절').length;
    const contacts = filteredData.filter((item) => item['컨택MD']).length;
    return { total, newEntry, rejected, contacts };
  }, [filteredData]);

  // 지역별 현황 (지역(광역))
  const regionData = useMemo(() => {
    const regionMap: { [key: string]: number } = {};
    filteredData.forEach((item) => {
      const region = item['지역(광역)'] || '미지정';
      regionMap[region] = (regionMap[region] || 0) + 1;
    });
    return Object.entries(regionMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  // 시/군/구 상세 데이터 (지역(시/군/리))
  const districtData = useMemo(() => {
    const districtMap: { [key: string]: { region: string; count: number } } = {};
    filteredData.forEach((item) => {
      const district = item['지역(시/군/리)'] || '미지정';
      const region = item['지역(광역)'] || '미지정';
      if (!districtMap[district]) {
        districtMap[district] = { region, count: 0 };
      }
      districtMap[district].count++;
    });
    return Object.entries(districtMap)
      .map(([name, info]) => ({ name, ...info }))
      .sort((a, b) => b.count - a.count);
  }, [filteredData]);

  // MD별 컨택 현황 (컨택MD)
  const mdData = useMemo(() => {
    const mdMap: { [key: string]: number } = {};
    filteredData.forEach((item) => {
      const md = item['컨택MD'] || '미지정';
      if (md !== '미지정') {
        mdMap[md] = (mdMap[md] || 0) + 1;
      }
    });
    return Object.entries(mdMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  // 결과별 분포
  const resultData = useMemo(() => {
    const resultMap: { [key: string]: number } = {};
    filteredData.forEach((item) => {
      const result = item['결과'] || '미지정';
      resultMap[result] = (resultMap[result] || 0) + 1;
    });
    return Object.entries(resultMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  // 거절 사유 분석
  const rejectionReasons = useMemo(() => {
    const reasonMap: { [key: string]: number } = {};
    filteredData
      .filter((item) => item['결과'] === '거절' && item['사유'])
      .forEach((item) => {
        const reason = item['사유'].trim();
        if (reason) {
          reasonMap[reason] = (reasonMap[reason] || 0) + 1;
        }
      });
    return Object.entries(reasonMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10
  }, [filteredData]);

  // MD 성과 순위 (입점 신규 기준) - 컨택MD 사용
  const mdRanking = useMemo(() => {
    const mdMap: { [key: string]: { contacts: number; newEntry: number } } = {};
    filteredData.forEach((item) => {
      const md = item['컨택MD'] || '미지정';
      if (md === '미지정') return;
      if (!mdMap[md]) {
        mdMap[md] = { contacts: 0, newEntry: 0 };
      }
      if (item['컨택MD']) {
        mdMap[md].contacts++;
      }
      if (item['결과'] === '입점(신규)') {
        mdMap[md].newEntry++;
      }
    });
    return Object.entries(mdMap)
      .map(([name, stats]) => ({
        name,
        contacts: stats.contacts,
        newEntry: stats.newEntry,
        conversionRate: stats.contacts > 0 ? ((stats.newEntry / stats.contacts) * 100).toFixed(1) : '0.0',
      }))
      .filter((item) => item.contacts > 0)
      .sort((a, b) => b.newEntry - a.newEntry)
      .map((item, index) => ({ ...item, rank: index + 1 }));
  }, [filteredData]);

  // 성과급 대상자 (1위, 2위)
  const topPerformers = useMemo(() => {
    return mdRanking.slice(0, 2);
  }, [mdRanking]);

  // 필터 옵션 (드롭다운용)
  const regions = useMemo(() => {
    const regionSet = new Set(data.map((item) => item['지역(광역)']).filter(Boolean));
    return Array.from(regionSet).sort();
  }, [data]);

  const mds = useMemo(() => {
    const mdSet = new Set(data.map((item) => item['컨택MD']).filter(Boolean));
    return Array.from(mdSet).sort();
  }, [data]);

  const results = useMemo(() => {
    const resultSet = new Set(data.map((item) => item['결과']).filter(Boolean));
    return Array.from(resultSet).sort();
  }, [data]);

  // AI 분석 함수 (결과, 사유, 내용 요약) - 더 디테일하게
  const analyzeData = async () => {
    try {
      setAnalyzing(true);
      
      // 결과별 통계
      const resultStats: { [key: string]: number } = {};
      const reasons: string[] = [];
      const contents: string[] = [];
      const mdResultMap: { [md: string]: { [result: string]: number } } = {};
      const regionResultMap: { [region: string]: { [result: string]: number } } = {};
      const dateMap: { [date: string]: number } = {};
      
      filteredData.forEach((item) => {
        // 결과 통계
        if (item['결과']) {
          resultStats[item['결과']] = (resultStats[item['결과']] || 0) + 1;
        }
        
        // MD별 결과 통계
        if (item['컨택MD'] && item['결과']) {
          if (!mdResultMap[item['컨택MD']]) {
            mdResultMap[item['컨택MD']] = {};
          }
          mdResultMap[item['컨택MD']][item['결과']] = (mdResultMap[item['컨택MD']][item['결과']] || 0) + 1;
        }
        
        // 지역별 결과 통계
        if (item['지역(광역)'] && item['결과']) {
          if (!regionResultMap[item['지역(광역)']]) {
            regionResultMap[item['지역(광역)']] = {};
          }
          regionResultMap[item['지역(광역)']][item['결과']] = (regionResultMap[item['지역(광역)']][item['결과']] || 0) + 1;
        }
        
        // 날짜 통계
        if (item['컨택 최종일']) {
          dateMap[item['컨택 최종일']] = (dateMap[item['컨택 최종일']] || 0) + 1;
        }
        
        // 사유 수집
        if (item['사유'] && item['사유'].trim()) {
          reasons.push(item['사유'].trim());
        }
        
        // 내용 수집
        if (item['내용'] && item['내용'].trim()) {
          contents.push(item['내용'].trim());
        }
      });

      // 결과 요약 (더 상세)
      const resultSummary = Object.entries(resultStats)
        .sort((a, b) => b[1] - a[1])
        .map(([result, count]) => ({
          result,
          count,
          percentage: filteredData.length > 0 ? ((count / filteredData.length) * 100).toFixed(1) : '0',
          trend: 'stable', // 추후 개선 가능
        }));

      // 사유 분석 (더 상세)
      const reasonMap: { [key: string]: number } = {};
      const reasonCategories: { [category: string]: number } = {
        '가격': 0,
        '조건': 0,
        '시설': 0,
        '위치': 0,
        '기타': 0,
      };
      
      reasons.forEach((reason) => {
        reasonMap[reason] = (reasonMap[reason] || 0) + 1;
        
        // 카테고리 분류
        const reasonLower = reason.toLowerCase();
        if (reasonLower.includes('가격') || reasonLower.includes('비용') || reasonLower.includes('요금')) {
          reasonCategories['가격']++;
        } else if (reasonLower.includes('조건') || reasonLower.includes('계약')) {
          reasonCategories['조건']++;
        } else if (reasonLower.includes('시설') || reasonLower.includes('환경')) {
          reasonCategories['시설']++;
        } else if (reasonLower.includes('위치') || reasonLower.includes('접근')) {
          reasonCategories['위치']++;
        } else {
          reasonCategories['기타']++;
        }
      });
      
      const topReasons = Object.entries(reasonMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([reason, count]) => ({ 
          reason, 
          count,
          percentage: reasons.length > 0 ? ((count / reasons.length) * 100).toFixed(1) : '0',
        }));

      // 내용 키워드 추출 (더 상세)
      const allContents = contents.join(' ');
      const commonPhrases = [
        '입점', '거절', '검토', '대기', '연락', '협의', '진행', '완료', '보류',
        '성공', '실패', '재검토', '추가', '변경', '확인', '요청', '승인', '거부',
      ];
      const phraseCounts: { [key: string]: number } = {};
      commonPhrases.forEach((phrase) => {
        const regex = new RegExp(phrase, 'g');
        const matches = allContents.match(regex);
        if (matches) {
          phraseCounts[phrase] = matches.length;
        }
      });

      // MD별 성과 분석
      const mdPerformance = Object.entries(mdResultMap).map(([md, results]) => {
        const total = Object.values(results).reduce((sum, count) => sum + count, 0);
        const newEntry = results['입점(신규)'] || 0;
        return {
          md,
          total,
          newEntry,
          rejected: results['거절'] || 0,
          conversionRate: total > 0 ? ((newEntry / total) * 100).toFixed(1) : '0',
        };
      }).sort((a, b) => b.newEntry - a.newEntry);

      // 지역별 성과 분석
      const regionPerformance = Object.entries(regionResultMap).map(([region, results]) => {
        const total = Object.values(results).reduce((sum, count) => sum + count, 0);
        const newEntry = results['입점(신규)'] || 0;
        return {
          region,
          total,
          newEntry,
          rejected: results['거절'] || 0,
          conversionRate: total > 0 ? ((newEntry / total) * 100).toFixed(1) : '0',
        };
      }).sort((a, b) => b.newEntry - a.newEntry);

      // 날짜별 트렌드
      const dateTrend = Object.entries(dateMap)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-30) // 최근 30일
        .map(([date, count]) => ({ date, count }));

      setAiAnalysis({
        resultSummary,
        topReasons,
        reasonCategories,
        phraseCounts,
        mdPerformance: mdPerformance.slice(0, 10),
        regionPerformance: regionPerformance.slice(0, 10),
        dateTrend: dateTrend.slice(-7), // 최근 7일
        totalAnalyzed: filteredData.length,
        hasReasons: reasons.length,
        hasContents: contents.length,
        analysisTime: new Date().toLocaleString('ko-KR'),
      });
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    if (filteredData.length > 0) {
      analyzeData();
    }
  }, [filteredData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">데이터를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-2 sm:p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <header className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              고캠핑 DB 영업 현황 대시보드
            </h1>
            <p className="text-gray-600 text-sm sm:text-base md:text-lg mb-4">MD별 영업 성과 및 성과급 대상자 선정</p>
            <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
              <button
                onClick={() => fetchData(true)}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-medium text-sm sm:text-base"
              >
                🔄 데이터 새로고침
              </button>
              <div className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 flex items-center shadow-sm">
                📊 총 {data.length.toLocaleString()}개 캠핑장
              </div>
              {lastUpdateTime && (
                <div className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl text-xs sm:text-sm font-medium text-gray-700 flex items-center shadow-sm">
                  ⏰ 마지막 업데이트: {lastUpdateTime.toLocaleTimeString('ko-KR')}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* 필터 및 검색 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">🔍</span> 필터 및 검색
          </h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              캠핑장명/내용 검색
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="캠핑장명 또는 내용을 입력하세요..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                지역(광역) 필터
              </label>
              <select
                value={filters.region}
                onChange={(e) => setFilters({ ...filters, region: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">전체 지역</option>
                {regions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                컨택MD 필터
              </label>
              <select
                value={filters.md}
                onChange={(e) => setFilters({ ...filters, md: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">전체 MD</option>
                {mds.map((md) => (
                  <option key={md} value={md}>
                    {md}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                결과 필터
              </label>
              <select
                value={filters.result}
                onChange={(e) => setFilters({ ...filters, result: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">전체 결과</option>
                {results.map((result) => (
                  <option key={result} value={result}>
                    {result}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* KPI 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 text-white transform hover:scale-105 transition-all">
            <div className="text-xs sm:text-sm font-medium text-blue-100 mb-1 sm:mb-2">총 캠핑장 수</div>
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold">{kpis.total.toLocaleString()}</div>
          </div>
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 text-white transform hover:scale-105 transition-all">
            <div className="text-xs sm:text-sm font-medium text-indigo-100 mb-1 sm:mb-2">총 컨택 수</div>
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold">{kpis.contacts.toLocaleString()}</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 text-white transform hover:scale-105 transition-all">
            <div className="text-xs sm:text-sm font-medium text-green-100 mb-1 sm:mb-2">입점(신규) 수</div>
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold">{kpis.newEntry.toLocaleString()}</div>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 text-white transform hover:scale-105 transition-all">
            <div className="text-xs sm:text-sm font-medium text-red-100 mb-1 sm:mb-2">거절 수</div>
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold">{kpis.rejected.toLocaleString()}</div>
          </div>
        </div>

        {/* 성과급 대상자 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {topPerformers.map((performer, index) => (
            <div
              key={performer.name}
              className={`bg-white rounded-2xl shadow-xl p-6 border-2 transform hover:scale-105 transition-all ${
                index === 0 
                  ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100' 
                  : index === 1 
                  ? 'border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100' 
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl font-bold">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'} {performer.rank}위
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">MD</div>
                  <div className="text-xl font-bold">{performer.name}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <div className="text-sm text-gray-600">입점(신규)</div>
                  <div className="text-2xl font-bold text-green-600">{performer.newEntry}건</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">컨택 수</div>
                  <div className="text-2xl font-bold">{performer.contacts}건</div>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-sm text-gray-600">전환율</div>
                <div className="text-xl font-bold">{performer.conversionRate}%</div>
              </div>
            </div>
          ))}
        </div>

        {/* 지역별 현황 */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-100">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
            <span className="text-xl sm:text-2xl">📍</span> 지역별 캠핑장 현황
          </h2>
          <div className="h-64 sm:h-80 mb-4 sm:mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-2 sm:p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={80}
                  stroke="#64748b"
                  tick={{ fontSize: 10 }}
                />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e0e7ff',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    fontSize: '12px'
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="value" fill="#4f46e5" name="캠핑장 수" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">지역별 상세 현황 (TOP 10)</h3>
              {districtData.length > 10 && (
                <button
                  onClick={() => setShowAllDistricts(!showAllDistricts)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
                >
                  {showAllDistricts ? '접기' : '자세히 보기'}
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                    <th className="px-4 py-3 text-left rounded-tl-lg">지역(광역)</th>
                    <th className="px-4 py-3 text-left">지역(시/군/리)</th>
                    <th className="px-4 py-3 text-right rounded-tr-lg">건수</th>
                  </tr>
                </thead>
                <tbody>
                  {(showAllDistricts ? districtData : districtData.slice(0, 10)).map((item, index) => (
                    <tr 
                      key={index} 
                      className="border-b hover:bg-blue-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium">{item.region}</td>
                      <td className="px-4 py-3">{item.name}</td>
                      <td className="px-4 py-3 text-right font-semibold text-blue-600">{item.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* MD별 컨택 현황 */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-100">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
            <span className="text-xl sm:text-2xl">👥</span> MD별 컨택 현황
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mdData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {mdData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                    <th className="px-4 py-3 text-left rounded-tl-lg">MD</th>
                    <th className="px-4 py-3 text-right">컨택 수</th>
                    <th className="px-4 py-3 text-right rounded-tr-lg">비율</th>
                  </tr>
                </thead>
                <tbody>
                  {mdData.map((item, index) => {
                    const total = mdData.reduce((sum, d) => sum + d.value, 0);
                    const percentage = ((item.value / total) * 100).toFixed(1);
                    return (
                      <tr key={index} className="border-b hover:bg-indigo-50 transition-colors">
                        <td className="px-4 py-3 font-medium">{item.name}</td>
                        <td className="px-4 py-3 text-right font-semibold text-indigo-600">{item.value}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                            {percentage}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 컨택 결과 분석 */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-100">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
            <span className="text-xl sm:text-2xl">📈</span> 컨택 결과 분석
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={resultData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {resultData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                    <th className="px-4 py-3 text-left rounded-tl-lg">결과</th>
                    <th className="px-4 py-3 text-right">건수</th>
                    <th className="px-4 py-3 text-right rounded-tr-lg">비율</th>
                  </tr>
                </thead>
                <tbody>
                  {resultData.map((item, index) => {
                    const total = resultData.reduce((sum, d) => sum + d.value, 0);
                    const percentage = ((item.value / total) * 100).toFixed(1);
                    return (
                      <tr key={index} className="border-b hover:bg-green-50 transition-colors">
                        <td className="px-4 py-3 font-medium">{item.name}</td>
                        <td className="px-4 py-3 text-right font-semibold text-green-600">{item.value}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            {percentage}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 거절/미진행 사유 분석 */}
        {rejectionReasons.length > 0 && (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-100">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
              <span className="text-xl sm:text-2xl">⚠️</span> 거절/미진행 사유 분석
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-red-600 to-pink-600 text-white">
                    <th className="px-4 py-3 text-left rounded-tl-lg">순위</th>
                    <th className="px-4 py-3 text-left">사유</th>
                    <th className="px-4 py-3 text-right rounded-tr-lg">건수</th>
                  </tr>
                </thead>
                <tbody>
                  {rejectionReasons.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-red-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          index === 0 ? 'bg-yellow-400 text-yellow-900' :
                          index === 1 ? 'bg-gray-300 text-gray-900' :
                          'bg-gray-200 text-gray-700'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">{item.name}</td>
                      <td className="px-4 py-3 text-right font-semibold text-red-600">{item.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MD 성과 순위 테이블 */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-100">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
            <span className="text-xl sm:text-2xl">🏆</span> MD 성과 순위 (입점 신규 기준)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 text-white">
                  <th className="px-4 py-3 text-center rounded-tl-lg">순위</th>
                  <th className="px-4 py-3 text-left">MD</th>
                  <th className="px-4 py-3 text-right">입점(신규)</th>
                  <th className="px-4 py-3 text-right">컨택 수</th>
                  <th className="px-4 py-3 text-right rounded-tr-lg">전환율</th>
                </tr>
              </thead>
              <tbody>
                {mdRanking.map((item) => (
                  <tr
                    key={item.name}
                    className={`border-b transition-colors ${
                      item.rank === 1 
                        ? 'bg-gradient-to-r from-yellow-50 to-amber-50 hover:from-yellow-100 hover:to-amber-100 font-bold' 
                        : item.rank === 2 
                        ? 'bg-gradient-to-r from-gray-50 to-slate-50 hover:from-gray-100 hover:to-slate-100 font-semibold' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-4 py-3 text-center">
                      <span className="text-xl">
                        {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : item.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
                        {item.newEntry}건
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{item.contacts}건</td>
                    <td className="px-4 py-3 text-right">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold">
                        {item.conversionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI 분석 섹션 - 더 디테일하게 */}
        {aiAnalysis && (
          <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 rounded-2xl shadow-xl p-4 sm:p-6 mb-6 sm:mb-8 border border-purple-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-xl sm:text-2xl">🤖</span> AI 데이터 분석 요약
              </h2>
              {aiAnalysis.analysisTime && (
                <span className="text-xs sm:text-sm text-gray-500">분석 시간: {aiAnalysis.analysisTime}</span>
              )}
            </div>
            {analyzing ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">분석 중...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 첫 번째 행: 결과 분석, 사유 분석, 키워드 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                  {/* 결과 분석 */}
                  <div className="bg-white rounded-xl p-4 sm:p-5 shadow-md">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                      <span className="text-lg sm:text-xl">📊</span> 결과 분석
                    </h3>
                    <div className="space-y-2 sm:space-y-3 max-h-64 overflow-y-auto">
                      {aiAnalysis.resultSummary.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                          <span className="text-xs sm:text-sm font-medium text-gray-700 truncate flex-1">{item.result}</span>
                          <div className="flex items-center gap-1 sm:gap-2 ml-2">
                            <span className="text-xs sm:text-sm font-semibold text-gray-900">{item.count}건</span>
                            <span className="text-xs text-gray-500">({item.percentage}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 사유 분석 */}
                  <div className="bg-white rounded-xl p-4 sm:p-5 shadow-md">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                      <span className="text-lg sm:text-xl">💬</span> 주요 사유 (TOP 10)
                    </h3>
                    <div className="space-y-2 sm:space-y-3 max-h-64 overflow-y-auto">
                      {aiAnalysis.topReasons.slice(0, 10).map((item: any, index: number) => (
                        <div key={index} className="p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-purple-600">#{index + 1}</span>
                            <div className="text-xs sm:text-sm font-medium text-gray-700 line-clamp-2 flex-1">{item.reason}</div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">{item.count}회</span>
                            <span className="text-xs text-gray-400">({item.percentage}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 내용 키워드 분석 */}
                  <div className="bg-white rounded-xl p-4 sm:p-5 shadow-md">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                      <span className="text-lg sm:text-xl">🔑</span> 내용 키워드
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {Object.entries(aiAnalysis.phraseCounts)
                        .sort((a: any, b: any) => b[1] - a[1])
                        .slice(0, 12)
                        .map(([phrase, count]: any, index: number) => (
                          <span
                            key={index}
                            className="px-2 sm:px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-full text-xs font-medium"
                          >
                            {phrase} ({count})
                          </span>
                        ))}
                    </div>
                    <div className="pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>📊 분석 대상: {aiAnalysis.totalAnalyzed}개</div>
                        <div>💬 사유 포함: {aiAnalysis.hasReasons}개</div>
                        <div>📝 내용 포함: {aiAnalysis.hasContents}개</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 두 번째 행: 사유 카테고리, MD 성과, 지역 성과 */}
                {aiAnalysis.reasonCategories && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                    {/* 사유 카테고리 분석 */}
                    <div className="bg-white rounded-xl p-4 sm:p-5 shadow-md">
                      <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                        <span className="text-lg sm:text-xl">📂</span> 사유 카테고리
                      </h3>
                      <div className="space-y-2">
                        {Object.entries(aiAnalysis.reasonCategories)
                          .sort((a: any, b: any) => b[1] - a[1])
                          .map(([category, count]: any, index: number) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                              <span className="text-xs sm:text-sm font-medium text-gray-700">{category}</span>
                              <span className="text-xs sm:text-sm font-semibold text-gray-900">{count}건</span>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* MD 성과 분석 */}
                    {aiAnalysis.mdPerformance && aiAnalysis.mdPerformance.length > 0 && (
                      <div className="bg-white rounded-xl p-4 sm:p-5 shadow-md">
                        <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                          <span className="text-lg sm:text-xl">👥</span> MD 성과 분석 (TOP 5)
                        </h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {aiAnalysis.mdPerformance.slice(0, 5).map((item: any, index: number) => (
                            <div key={index} className="p-2 bg-gray-50 rounded-lg">
                              <div className="text-xs sm:text-sm font-semibold text-gray-800 mb-1">{item.md}</div>
                              <div className="flex justify-between text-xs text-gray-600">
                                <span>입점: {item.newEntry}건</span>
                                <span>전환율: {item.conversionRate}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 지역 성과 분석 */}
                    {aiAnalysis.regionPerformance && aiAnalysis.regionPerformance.length > 0 && (
                      <div className="bg-white rounded-xl p-4 sm:p-5 shadow-md">
                        <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                          <span className="text-lg sm:text-xl">📍</span> 지역 성과 분석 (TOP 5)
                        </h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {aiAnalysis.regionPerformance.slice(0, 5).map((item: any, index: number) => (
                            <div key={index} className="p-2 bg-gray-50 rounded-lg">
                              <div className="text-xs sm:text-sm font-semibold text-gray-800 mb-1">{item.region}</div>
                              <div className="flex justify-between text-xs text-gray-600">
                                <span>입점: {item.newEntry}건</span>
                                <span>전환율: {item.conversionRate}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 캠핑장 목록 */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-100">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
            <span className="text-xl sm:text-2xl">📋</span> 캠핑장 목록 ({filteredData.length.toLocaleString()}개)
          </h2>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white sticky top-0">
                <tr>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left rounded-tl-lg">번호</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left">캠핑장명</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left hidden sm:table-cell">지역(광역)</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left hidden md:table-cell">지역(시/군/리)</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left hidden lg:table-cell">컨택MD</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left">결과</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-center rounded-tr-lg">상세</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-colors">
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-600">{item.id}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-900 text-xs sm:text-sm">{item['캠핑장명'] || '-'}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 hidden sm:table-cell">{item['지역(광역)'] || '-'}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell">{item['지역(시/군/리)'] || '-'}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 hidden lg:table-cell">{item['컨택MD'] || '-'}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item['결과'] === '입점(신규)' 
                          ? 'bg-green-100 text-green-700' 
                          : item['결과'] === '거절'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {item['결과'] || '-'}
                      </span>
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="px-2 sm:px-4 py-1 sm:py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition text-xs font-medium shadow-sm whitespace-nowrap"
                      >
                        상세보기
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 상세 정보 모달 */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-2xl font-bold">캠핑장 상세 정보</h2>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-white hover:text-gray-200 text-3xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 transition"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedItem['캠핑장명']}</h3>
                <div className="flex gap-4 text-sm text-gray-600">
                  {selectedItem['지역(광역)'] && (
                    <span className="flex items-center gap-1">
                      <span>📍</span> {selectedItem['지역(광역)']} {selectedItem['지역(시/군/리)']}
                    </span>
                  )}
                  {selectedItem['컨택MD'] && (
                    <span className="flex items-center gap-1">
                      <span>👤</span> {selectedItem['컨택MD']}
                    </span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(selectedItem)
                  .filter(([key]) => key !== 'id' && key !== '캠핑장명')
                  .map(([key, value]) => (
                    <div key={key} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition">
                      <div className="text-xs font-semibold text-gray-500 uppercase mb-1">{key}</div>
                      <div className="text-base text-gray-900 font-medium">{String(value || '-')}</div>
                    </div>
                  ))}
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t p-4 flex justify-end rounded-b-2xl">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-8 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition font-medium shadow-md"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
