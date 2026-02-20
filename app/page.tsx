'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
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
  reason: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export default function SalesDashboard() {
  const [data, setData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    reason: '',
  });
  const [insights, setInsights] = useState<any>(null);
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null); // 확장된 인사이트 키 (전체 요약: 'overall', 사유별: reason명)

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (showSuccess = false) => {
    try {
      setLoading(true);
      setError(null); // 에러 초기화
      
      // 디바이스 정보 로깅 (모바일 디버깅용)
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const userAgent = navigator.userAgent;
      console.log(`📱 디바이스 정보: ${isMobile ? '모바일' : 'PC'}, User-Agent: ${userAgent}`);
      console.log(`🌐 네트워크 상태: ${navigator.onLine ? '온라인' : '오프라인'}`);
      
      // 캐시 방지를 위해 타임스탬프 추가
      const timestamp = new Date().getTime();
      const apiUrl = `/api/sales?t=${timestamp}`;
      console.log(`🔗 API 호출 시작: ${apiUrl}`);
      
      // fetch 타임아웃 설정 (모바일 네트워크 대응)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30초 타임아웃
      
      const response = await fetch(apiUrl, {
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
      
      clearTimeout(timeoutId);
      
      console.log(`📡 API 응답 상태: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Response Error:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText.substring(0, 200)}`);
      }
      
      const result = await response.json();
      console.log(`📦 응답 데이터 타입:`, typeof result, 'has data:', !!result.data, 'is array:', Array.isArray(result.data));
      
      if (result.error) {
        // 상세한 에러 메시지 표시
        let errorMsg = result.error;
        console.error('❌ API returned error:', errorMsg);
        setError(errorMsg);
        throw new Error(errorMsg);
      }
      
      if (!result.data) {
        console.error('❌ No data in response:', result);
        setError('데이터가 없습니다. 서버에서 데이터를 가져오지 못했습니다.');
        setData([]);
        return;
      }
      
      if (Array.isArray(result.data)) {
        console.log(`✅ 데이터 로드 완료: ${result.data.length}개 캠핑장`);
        if (result.data.length > 0) {
          console.log(`📊 샘플 데이터:`, result.data[0]);
          // 컬럼명 확인
          const sample = result.data[0];
          console.log(`📊 컬럼명 확인:`, Object.keys(sample).slice(0, 20));
          console.log(`📊 주요 컬럼 값:`, {
            '지역(광역)': sample['지역(광역)'],
            '컨택MD': sample['컨택MD'],
            '결과': sample['결과'],
          });
        } else {
          console.warn('⚠️ 데이터 배열이 비어있습니다.');
          setError('데이터가 비어있습니다. Google Sheets에 데이터가 있는지 확인해주세요.');
          setData([]);
          return;
        }
        setData(result.data);
        setLastUpdateTime(new Date());
        setRefreshKey(prev => prev + 1);
        setError(null); // 성공 시 에러 초기화
        if (showSuccess) {
          console.log(`✅ 데이터 새로고침 완료: ${result.data.length}개 캠핑장 로드됨`);
        }
      } else {
        console.error('❌ Invalid data format:', typeof result.data, result.data);
        setError(`데이터 형식이 올바르지 않습니다. (타입: ${typeof result.data})`);
        setData([]);
      }
    } catch (error: any) {
      console.error('❌ Error fetching data:', error);
      
      // 더 구체적인 에러 메시지 표시
      let errorMessage = '데이터를 불러오는 중 오류가 발생했습니다.';
      
      if (error.name === 'AbortError') {
        errorMessage = '요청 시간이 초과되었습니다. 네트워크 연결을 확인하고 다시 시도해주세요.';
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.';
      }
      
      setError(errorMessage);
      setData([]); // 에러 시 빈 배열로 설정
      
      // 에러 메시지에 따라 다른 안내 표시
      if (errorMessage.includes('접근 권한') || errorMessage.includes('403') || errorMessage.includes('공개')) {
        console.error('⚠️ Google Sheets 공개 설정 필요');
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
      // 사유 필터
      if (filters.reason && item['사유'] !== filters.reason) return false;
      return true;
    });
  }, [data, filters, searchTerm]);

  // KPI 계산 (원본 데이터 기준)
  const kpis = useMemo(() => {
    const total = data.length;
    // 결과 필드가 있는 항목만 카운트 (빈 문자열이 아닌 경우)
    const newEntry = data.filter((item) => {
      const result = item['결과'];
      return result && result.trim() !== '' && result === '입점(신규)';
    }).length;
    const rejected = data.filter((item) => {
      const result = item['결과'];
      return result && result.trim() !== '' && result === '거절';
    }).length;
    // 컨택MD가 있는 항목만 카운트 (빈 문자열이 아닌 경우)
    const contacts = data.filter((item) => {
      const md = item['컨택MD'];
      return md && md.trim() !== '';
    }).length;
    
    // 디버깅 로그
    if (data.length > 0 && contacts === 0) {
      console.warn('⚠️ 컨택MD가 없는 것으로 보입니다. 샘플 데이터 확인:', {
        sample: data[0],
        allKeys: Object.keys(data[0]),
        hasContactMD: data[0]['컨택MD'],
        hasContactMDAlt: data[0]['컨택 MD'], // 공백이 다를 수 있음
        hasContactMDAlt2: data[0]['컨택MD '], // 뒤에 공백이 있을 수 있음
      });
    }
    
    return { total, newEntry, rejected, contacts };
  }, [data]);

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

  // 사유 옵션 (드롭다운용) - L열 드롭다운과 동일
  const reasons = useMemo(() => {
    return ['수수료', '기능', '서비스', '현재만족', '약정기간', '기타', '공사중'];
  }, []);

  // AI 분석 함수 (결과, 사유, 내용 요약) - 더 디테일하게
  const analyzeData = useCallback(async () => {
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

      // 결과 요약 (더 상세) - 기존입점 제외
      const resultSummary = Object.entries(resultStats)
        .filter(([result]) => !result.includes('기존입점') && result.trim() !== '') // 기존입점 제외
        .sort((a, b) => b[1] - a[1])
        .map(([result, count]) => ({
          result,
          count,
          percentage: filteredData.length > 0 ? ((count / filteredData.length) * 100).toFixed(1) : '0',
          trend: 'stable', // 추후 개선 가능
        }));

      // 사유 분석 (더 상세) - L열 드롭다운과 동일한 카테고리
      const reasonMap: { [key: string]: number } = {};
      const reasonCategories: { [category: string]: number } = {
        '수수료': 0,
        '기능': 0,
        '서비스': 0,
        '현재만족': 0,
        '약정기간': 0,
        '기타': 0,
        '공사중': 0,
      };
      
      // 실제 데이터에서 사유 수집 및 카테고리 분류
      filteredData.forEach((item) => {
        const reason = item['사유']?.trim();
        if (reason && reason !== '') {
          reasonMap[reason] = (reasonMap[reason] || 0) + 1;
          
          // 카테고리 분류 (L열 드롭다운 기준)
          const reasonLower = reason.toLowerCase();
          if (reasonLower.includes('수수료') || reasonLower.includes('가격') || reasonLower.includes('비용') || reasonLower.includes('요금')) {
            reasonCategories['수수료']++;
          } else if (reasonLower.includes('기능') || reasonLower.includes('기능불만')) {
            reasonCategories['기능']++;
          } else if (reasonLower.includes('서비스') || reasonLower.includes('서비스불만')) {
            reasonCategories['서비스']++;
          } else if (reasonLower.includes('현재만족') || reasonLower.includes('만족')) {
            reasonCategories['현재만족']++;
          } else if (reasonLower.includes('약정') || reasonLower.includes('기간')) {
            reasonCategories['약정기간']++;
          } else if (reasonLower.includes('공사') || reasonLower.includes('공사중')) {
            reasonCategories['공사중']++;
          } else {
            reasonCategories['기타']++;
          }
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
  }, [filteredData]);

  // 내용 분석 및 인사이트 생성 함수
  const generateInsights = useMemo(() => {
    if (filteredData.length === 0) return null;

    const contents = filteredData
      .filter((item) => item['내용'] && item['내용'].trim())
      .map((item) => ({
        content: item['내용'],
        reason: item['사유'] || '기타',
        result: item['결과'] || '',
        md: item['컨택MD'] || '',
        fullData: item, // 전체 데이터도 포함
      }));

    if (contents.length === 0) return null;

    // 사유별 내용 분석
    const reasonBasedAnalysis: { [key: string]: string[] } = {};
    reasons.forEach((reason) => {
      const reasonContents = contents.filter((c) => c.reason === reason);
      if (reasonContents.length > 0) {
        reasonBasedAnalysis[reason] = reasonContents.map((c) => c.content);
      }
    });

    // 감정/반응 키워드 분석 (확장)
    const sentimentKeywords = {
      positive: ['좋', '만족', '괜찮', '좋아', '추천', '감사', '도움', '유용', '편리', '입점 예정', '예정', '준비', '진행', '완료', '승인', '협의 완료'],
      negative: ['불만', '문제', '어려', '불편', '아쉽', '부족', '개선', '불안', '걱정', '거절', '불가', '어렵', '불가능'],
      neutral: ['확인', '검토', '논의', '협의', '대기', '보류', '고려', '재연락', '재검토'],
      // 시간/일정 관련 키워드 (긍정적 맥락)
      timeline: ['예정', '준비', '공사', '작업', '진행', '완료', '오픈', '시작', '개장', '입점', '월', '일', '초', '중', '말'],
    };

    // 결과+사유+내용 종합 분석을 위한 데이터 구조
    const resultReasonContentMap: { [key: string]: { [key: string]: any[] } } = {};
    
    contents.forEach((item) => {
      const resultKey = item.result || '미지정';
      const reasonKey = item.reason || '기타';
      
      if (!resultReasonContentMap[resultKey]) {
        resultReasonContentMap[resultKey] = {};
      }
      if (!resultReasonContentMap[resultKey][reasonKey]) {
        resultReasonContentMap[resultKey][reasonKey] = [];
      }
      resultReasonContentMap[resultKey][reasonKey].push(item);
    });

    // 사유별 인사이트 생성 (결과와 내용을 함께 분석)
    const insightsByReason: { [key: string]: string } = {};

    reasons.forEach((reason) => {
      // 해당 사유를 가진 모든 항목 (결과와 내용 포함)
      const reasonItems = contents.filter((c) => c.reason === reason);
      if (reasonItems.length === 0) return;

      const reasonContents = reasonItems.map((c) => c.content);
      const allText = reasonContents.join(' ');
      
      // 결과별 분류
      const resultGroups: { [key: string]: number } = {};
      reasonItems.forEach((item) => {
        const result = item.result || '미지정';
        resultGroups[result] = (resultGroups[result] || 0) + 1;
      });

      // 감정 분석 (내용 기반)
      const positiveCount = sentimentKeywords.positive.filter((kw) => allText.includes(kw)).length;
      const negativeCount = sentimentKeywords.negative.filter((kw) => allText.includes(kw)).length;
      const timelineCount = sentimentKeywords.timeline.filter((kw) => allText.includes(kw)).length;
      
      // 시간/일정 관련 키워드 확인 (입점 예정, 공사 중 등)
      const hasTimeline = timelineCount > 0 || 
        /(\d+월|월초|월말|월 중|일|일자|예정|준비|공사|작업|진행|완료|오픈|시작|개장|입점)/.test(allText);
      
      // 결과 기반 분석
      const hasReviewResult = Object.keys(resultGroups).some(r => 
        r.includes('검토') || r.includes('재연락') || r.includes('대기') || r.includes('논의')
      );
      const hasPositiveResult = Object.keys(resultGroups).some(r => 
        r.includes('입점') || r.includes('신규') || r.includes('승인')
      );
      const hasNegativeResult = Object.keys(resultGroups).some(r => 
        r.includes('거절') || r.includes('불가')
      );

      // 주요 키워드 추출
      const commonWords = ['수수료', '가격', '비용', '기능', '서비스', '시스템', '플랫폼', '약정', '계약', '조건', '공사', '입점', '예정'];
      const foundKeywords = commonWords.filter((word) => allText.includes(word));

      // 인사이트 생성 (결과+사유+내용 종합 분석)
      let insight = '';
      
      // 결과가 "검토", "재연락" 등이고 내용에 시간/일정이 있으면 긍정적 맥락
      if (hasReviewResult && hasTimeline && !hasNegativeResult) {
        // 일정 추출 (예: "3월초", "3월 중", "내년 1월", "공사 중 3월초 입점 예정" 등)
        const timelinePattern = /(\d+월\s*(초|중|말|말경)?|월\s*(초|중|말)|내년|다음\s*달|곧|조만간|준비\s*중|공사\s*중|작업\s*중|진행\s*중|입점\s*예정|오픈\s*예정)/g;
        const timelineMatches = allText.match(timelinePattern);
        const timelineText = timelineMatches ? [...new Set(timelineMatches)].join(', ') : '';
        
        // 내용에서 구체적인 일정 정보 추출 (예: "공사 중 3월초 입점 예정")
        const detailedTimeline = allText.match(/(공사\s*중|작업\s*중|준비\s*중).*?(\d+월\s*(초|중|말)?|입점\s*예정|오픈\s*예정)/g);
        const detailedText = detailedTimeline ? detailedTimeline[0] : '';
        
        if (reason === '기타' || !reasons.includes(reason)) {
          // 기타 사유이거나 사유가 없는 경우
          if (detailedText) {
            insight = `검토 중이며, 내용상 "${detailedText}"와 같은 일정/준비 관련 언급이 있어 입점 가능성이 높아 보입니다. 내부 공사나 준비 작업으로 인해 당장 입점하지 못하는 상황으로 보이며, 명시된 일정에 맞춰 재연락하고 입점 준비를 지원하면 전환 가능성이 높습니다.`;
          } else if (timelineText) {
            insight = `검토 중이며, 내용상 일정/준비 관련 언급(${timelineText})이 있어 입점 가능성이 높아 보입니다. 명시된 일정(${timelineText})에 맞춰 재연락하고, 입점 준비를 지원하면 전환 가능성이 높습니다.`;
          } else {
            insight = `검토 중이며, 내용상 일정/준비 관련 언급이 있어 입점 가능성이 높아 보입니다. 구체적인 일정을 확인하고 지속적인 팔로업을 통해 전환을 유도할 수 있습니다.`;
          }
        } else {
          // 특정 사유가 있는 경우
          if (detailedText) {
            insight = `검토 중이며, ${reason} 관련 이슈가 있지만 "${detailedText}"와 같은 일정/준비 관련 내용이 있어 긍정적 신호로 보입니다. 해당 이슈를 해결하고 명시된 일정에 맞춰 재연락하면 입점 가능성이 높습니다.`;
          } else if (timelineText) {
            insight = `검토 중이며, ${reason} 관련 이슈가 있지만 일정/준비 관련 내용(${timelineText})이 있어 긍정적 신호로 보입니다. 해당 이슈를 해결하고 ${timelineText ? `일정(${timelineText})에 맞춰` : '적절한 시점에'} 재연락하면 입점 가능성이 높습니다.`;
          } else {
            insight = `검토 중이며, ${reason} 관련 이슈가 있지만 일정/준비 관련 내용이 있어 긍정적 신호로 보입니다. 해당 이슈를 해결하고 적절한 시점에 재연락하면 입점 가능성이 높습니다.`;
          }
        }
      } else if (hasReviewResult && !hasTimeline && !hasNegativeResult) {
        // 검토 중이지만 일정이 명확하지 않은 경우
        if (reason === '기타') {
          insight = `검토 중입니다. 구체적인 일정이나 준비 상황을 확인하고, 지속적인 팔로업을 통해 입점 가능성을 높일 수 있습니다.`;
        } else {
          insight = `검토 중이며, ${reason} 관련 이슈가 있습니다. 해당 이슈를 해결하고 구체적인 일정을 확인한 후 재연락하면 입점 가능성이 높아집니다.`;
        }
      } else if (hasPositiveResult) {
        // 이미 긍정적 결과
        if (reason === '수수료') {
          insight = `입점 관련 긍정적 결과가 있으며, 수수료에 대한 논의가 있었습니다. 현재 수수료 체계가 수용 가능한 것으로 보이며, 최종 입점을 위한 후속 조치가 필요합니다.`;
        } else {
          insight = `입점 관련 긍정적 결과가 있습니다. ${reason} 관련 내용이 있지만 전반적으로 긍정적인 흐름으로 보입니다.`;
        }
      } else if (hasNegativeResult) {
        // 부정적 결과
        if (reason === '수수료') {
          insight = `수수료 관련 부정적 반응으로 인해 거절되었습니다. 가격 정책 재검토 또는 유연한 수수료 체계(할인, 단계별 수수료 등) 제안이 필요합니다. 구체적 우려사항을 해결하면 재검토 기회를 만들 수 있습니다.`;
        } else if (reason === '기능' || reason === '기능불만') {
          insight = `기능 관련 개선 요구로 인해 거절되었습니다. 주요 기능 개선사항을 우선적으로 반영하거나, 개발 로드맵을 공유하여 신뢰도를 높이는 것이 중요합니다.`;
        } else if (reason === '서비스' || reason === '서비스불만') {
          insight = `서비스 품질에 대한 우려로 인해 거절되었습니다. 고객 지원 강화, 응대 시간 단축, 전문성 향상 등을 통해 신뢰도를 높이고, 개선 계획을 구체적으로 제시하면 재검토 기회를 만들 수 있습니다.`;
        } else if (reason === '공사중') {
          insight = `공사 중으로 인해 당장 입점하지 못하는 상황입니다. 공사 완료 일정을 확인하고, 완료 후 입점 절차를 안내하면 전환 가능성이 높습니다.`;
        } else {
          insight = `${reason} 관련 이슈로 인해 거절되었습니다. 구체적인 우려사항을 파악하고 맞춤형 해결 방안을 제시하면 재검토 가능성이 있습니다.`;
        }
      } else {
        // 검토 중이거나 중립적
        if (reason === '수수료') {
          if (negativeCount > positiveCount) {
            insight = `수수료 관련 부정적 반응이 우세합니다. 가격 정책 재검토 또는 유연한 수수료 체계(할인, 단계별 수수료 등) 제안이 필요합니다. ${foundKeywords.length > 0 ? foundKeywords[0] + ' 관련' : ''} 구체적 우려사항을 해결하면 전환 가능성이 높아집니다.`;
          } else if (positiveCount > negativeCount) {
            insight = `수수료에 대한 긍정적 반응이 있습니다. 현재 수수료 체계가 수용 가능한 수준으로 보이며, 추가 가치 제안으로 입점을 유도할 수 있습니다.`;
          } else {
            insight = `수수료 관련 논의가 진행 중입니다. 명확한 가격 제안과 ROI(투자 대비 효과)를 구체적으로 제시하면 결정에 도움이 될 것입니다.`;
          }
        } else if (reason === '기능' || reason === '기능불만') {
          const featureKeywords = foundKeywords.filter(kw => ['기능', '시스템', '플랫폼'].includes(kw));
          insight = `기능 관련 개선 요구가 ${reasonContents.length}건 확인되었습니다. ${featureKeywords.length > 0 ? featureKeywords.join(', ') + ' 관련' : '주요'} 기능 개선사항을 우선적으로 반영하거나, 개발 로드맵을 공유하면 신뢰도 향상에 도움이 됩니다.`;
        } else if (reason === '서비스' || reason === '서비스불만') {
          insight = `서비스 품질에 대한 우려가 ${reasonContents.length}건 확인되었습니다. 고객 지원 강화, 응대 시간 단축, 전문성 향상 등을 통해 신뢰도를 높이는 것이 중요합니다. 개선 계획을 구체적으로 제시하면 재검토 기회를 만들 수 있습니다.`;
        } else if (reason === '현재만족') {
          insight = `현재 서비스에 만족하고 있어 추가 제안이 어려울 수 있습니다. 장기적 관계 구축과 점진적 업셀링 전략을 고려하세요. 새로운 기능이나 혜택을 소개하는 방식으로 접근하면 효과적일 수 있습니다.`;
        } else if (reason === '약정기간') {
          insight = `약정 기간 관련 협의가 필요합니다. 유연한 약정 옵션(단기/중기/장기) 제공 또는 기간별 혜택 차별화(기간이 길수록 할인율 증가 등)로 합의점을 찾을 수 있습니다.`;
        } else if (reason === '공사중') {
          // 공사중은 검토 중 + 일정이 있는 경우와 유사하게 처리
          if (hasTimeline && !hasNegativeResult) {
            const timelinePattern = /(\d+월\s*(초|중|말|말경)?|월\s*(초|중|말)|내년|다음\s*달|곧|조만간|준비\s*중|공사\s*중|작업\s*중|진행\s*중|입점\s*예정|오픈\s*예정)/g;
            const timelineMatches = allText.match(timelinePattern);
            const timelineText = timelineMatches ? [...new Set(timelineMatches)].join(', ') : '';
            
            if (timelineText) {
              insight = `공사 중이며, 내용상 일정/준비 관련 언급(${timelineText})이 있어 입점 가능성이 높아 보입니다. 공사 완료 일정(${timelineText})을 확인하고, 완료 후 입점 절차를 안내하면 전환 가능성이 높습니다.`;
            } else {
              insight = `공사 중으로 인해 당장 입점하지 못하는 상황입니다. 공사 완료 일정을 확인하고, 완료 후 입점 절차를 안내하면 전환 가능성이 높습니다.`;
            }
          } else {
            insight = `공사 중으로 인해 당장 입점하지 못하는 상황입니다. 공사 완료 일정을 확인하고, 완료 후 입점 절차를 안내하면 전환 가능성이 높습니다.`;
          }
        } else {
          // 기타 사유 - 내용 분석 강화
          if (hasTimeline && !hasNegativeResult) {
            insight = `기타 사유이지만, 내용상 일정/준비 관련 언급이 있어 입점 가능성이 있습니다. 구체적인 일정을 확인하고 지속적인 팔로업을 통해 전환을 유도할 수 있습니다.`;
          } else if (hasReviewResult) {
            insight = `기타 사유로 검토 중입니다. 내용을 종합적으로 분석한 결과, 개별 맞춤 접근이 필요하며 구체적인 우려사항을 정확히 파악한 후 맞춤형 솔루션을 제시하는 것이 중요합니다.`;
          } else {
            insight = `기타 사유로 인한 반응입니다. 개별 맞춤 접근이 필요하며, 구체적인 우려사항을 정확히 파악한 후 맞춤형 솔루션을 제시하는 것이 중요합니다.`;
          }
        }
      }

      insightsByReason[reason] = insight;
    });

    // 전체 인사이트 요약 (결과+사유+내용 종합 분석)
    const totalContents = contents.length;
    
    // 결과와 내용을 함께 분석하여 긍정/부정 판단
    const positiveReactions = contents.filter((c) => {
      const text = c.content.toLowerCase();
      const result = (c.result || '').toLowerCase();
      
      // 결과가 긍정적이거나, 내용에 긍정 키워드가 있거나, 시간/일정 관련이 있으면 긍정
      const hasPositiveResult = result.includes('입점') || result.includes('신규') || result.includes('승인');
      const hasPositiveContent = sentimentKeywords.positive.some((kw) => text.includes(kw));
      const hasTimeline = sentimentKeywords.timeline.some((kw) => text.includes(kw)) ||
        /(\d+월|월초|월말|예정|준비|공사|작업|진행|완료|오픈|시작|개장|입점)/.test(text);
      const isReviewWithTimeline = (result.includes('검토') || result.includes('재연락') || result.includes('대기')) && hasTimeline;
      
      return hasPositiveResult || (hasPositiveContent && !sentimentKeywords.negative.some((kw) => text.includes(kw))) || isReviewWithTimeline;
    }).length;

    const negativeReactions = contents.filter((c) => {
      const text = c.content.toLowerCase();
      const result = (c.result || '').toLowerCase();
      
      // 결과가 부정적이거나, 내용에 부정 키워드가 있고 긍정적 신호가 없으면 부정
      const hasNegativeResult = result.includes('거절') || result.includes('불가');
      const hasNegativeContent = sentimentKeywords.negative.some((kw) => text.includes(kw));
      const hasPositiveContent = sentimentKeywords.positive.some((kw) => text.includes(kw));
      const hasTimeline = sentimentKeywords.timeline.some((kw) => text.includes(kw));
      
      return hasNegativeResult || (hasNegativeContent && !hasPositiveContent && !hasTimeline);
    }).length;

    const neutralReactions = totalContents - positiveReactions - negativeReactions;
    const positiveRate = totalContents > 0 ? ((positiveReactions / totalContents) * 100).toFixed(1) : '0';
    const negativeRate = totalContents > 0 ? ((negativeReactions / totalContents) * 100).toFixed(1) : '0';

    // 사유별 통계
    const reasonCounts = reasons.map((reason) => ({
      reason,
      count: reasonBasedAnalysis[reason]?.length || 0,
    })).filter((r) => r.count > 0).sort((a, b) => b.count - a.count);

    const topReason = reasonCounts[0];
    
    let overallInsight = `전체 ${totalContents}건의 피드백을 분석한 결과, 긍정적 반응 ${positiveReactions}건(${positiveRate}%), 부정적 반응 ${negativeReactions}건(${negativeRate}%)입니다. `;
    
    if (positiveReactions > negativeReactions * 1.5) {
      overallInsight += `전반적으로 매우 긍정적인 분위기로, 현재 영업 전략이 효과적입니다. 추가 가치 제안으로 입점 전환율을 더욱 높일 수 있는 기회가 있습니다.`;
    } else if (positiveReactions > negativeReactions) {
      overallInsight += `긍정적 반응이 우세합니다. 현재 접근 방식이 효과적이며, 부정적 반응을 줄이기 위한 개선사항을 반영하면 전환율이 더욱 향상될 것입니다.`;
    } else if (negativeReactions > positiveReactions * 1.5) {
      overallInsight += `부정적 반응이 우세합니다. ${topReason ? topReason.reason + ' 관련' : '주요'} 이슈를 우선적으로 해결하고, 명확한 개선 계획을 제시하면 신뢰 회복과 전환율 향상에 도움이 됩니다.`;
    } else if (negativeReactions > positiveReactions) {
      overallInsight += `부정적 반응이 다소 많습니다. ${topReason ? topReason.reason + ' 관련' : '주요'} 우려사항을 해결하고, 구체적인 해결 방안을 제시하면 전환 가능성이 높아집니다.`;
    } else {
      overallInsight += `반응이 혼재되어 있습니다. 개별 맞춤 접근이 효과적이며, 각 사장님의 구체적 우려사항을 파악한 후 맞춤형 솔루션을 제시하는 것이 중요합니다.`;
    }
    
    if (topReason && topReason.count > totalContents * 0.3) {
      overallInsight += ` 특히 ${topReason.reason} 관련 피드백이 ${topReason.count}건(${((topReason.count / totalContents) * 100).toFixed(1)}%)로 가장 많아 이 부분에 대한 집중 대응이 필요합니다.`;
    }

    return {
      overallInsight,
      insightsByReason,
      reasonStats: reasons.map((reason) => ({
        reason,
        count: reasonBasedAnalysis[reason]?.length || 0,
        insight: insightsByReason[reason] || '',
      })),
      totalAnalyzed: totalContents,
    };
  }, [filteredData, reasons]);

  // AI 분석 실행
  useEffect(() => {
    if (filteredData.length > 0) {
      analyzeData();
    } else {
      setAiAnalysis(null);
      setInsights(null);
    }
  }, [filteredData, analyzeData]); // analyzeData도 의존성에 추가

  // 인사이트 업데이트 (generateInsights가 변경될 때만)
  useEffect(() => {
    if (generateInsights) {
      setInsights(generateInsights);
    } else {
      setInsights(null);
    }
  }, [generateInsights]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-xl font-semibold text-gray-700">데이터를 불러오는 중...</div>
          <div className="text-sm text-gray-500 mt-2">잠시만 기다려주세요</div>
        </div>
      </div>
    );
  }

  if (error) {
    const isMobile = typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isOnline = typeof window !== 'undefined' && navigator.onLine;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl shadow-lg p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-red-800 mb-4 flex items-center gap-2">
              <span className="text-3xl">⚠️</span> 데이터 로드 오류
            </h1>
            
            {/* 디버깅 정보 (모바일용) */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 sm:p-4 mb-4">
              <p className="text-xs sm:text-sm text-yellow-800 font-semibold mb-2">디버깅 정보:</p>
              <div className="text-xs sm:text-sm text-yellow-700 space-y-1">
                <p>• 디바이스: {isMobile ? '모바일' : 'PC'}</p>
                <p>• 네트워크: {isOnline ? '온라인 ✅' : '오프라인 ❌'}</p>
                <p>• 시간: {new Date().toLocaleString('ko-KR')}</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 sm:p-6 mb-6">
              <p className="text-base sm:text-lg text-gray-800 mb-4 font-semibold">오류 메시지:</p>
              <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap break-words">{error}</p>
            </div>
            
            {error.includes('공개') || error.includes('403') || error.includes('접근 권한') ? (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6 mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-blue-800 mb-3">해결 방법:</h2>
                <ol className="list-decimal list-inside space-y-2 text-sm sm:text-base text-gray-700">
                  <li>Google Sheets 문서를 엽니다:
                    <br />
                    <a 
                      href="https://docs.google.com/spreadsheets/d/1_laE9Yxj-tajY23k36z3Bg2A_Mds8_V2A81DHnrUO68/edit" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 underline break-all"
                    >
                      https://docs.google.com/spreadsheets/d/1_laE9Yxj-tajY23k36z3Bg2A_Mds8_V2A81DHnrUO68/edit
                    </a>
                  </li>
                  <li>우측 상단 "공유" 버튼을 클릭합니다</li>
                  <li>"링크가 있는 모든 사용자" 또는 "공개"로 설정합니다</li>
                  <li>권한을 "보기 가능(뷰어)"로 설정합니다</li>
                  <li>"완료"를 클릭합니다</li>
                </ol>
              </div>
            ) : null}
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => fetchData(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg font-medium text-base"
              >
                🔄 다시 시도
              </button>
              <button
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  fetchData();
                }}
                className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all shadow-md hover:shadow-lg font-medium text-base"
              >
                🔃 새로고침
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-2 sm:p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <header className="mb-4 sm:mb-6 md:mb-8">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 md:p-6 border border-gray-100">
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
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-100">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
            <span className="text-xl sm:text-2xl">🔍</span> 필터 및 검색
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                지역(광역) 필터
              </label>
              <select
                value={filters.region}
                onChange={(e) => setFilters({ ...filters, region: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">전체 결과</option>
                {results.map((result) => (
                  <option key={result} value={result}>
                    {result}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사유 필터
              </label>
              <select
                value={filters.reason}
                onChange={(e) => setFilters({ ...filters, reason: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">전체 사유</option>
                {reasons.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {topPerformers.map((performer, index) => (
            <div
              key={performer.name}
              className={`bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 border-2 transform hover:scale-105 transition-all ${
                index === 0 
                  ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100' 
                  : index === 1 
                  ? 'border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100' 
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="text-2xl sm:text-4xl font-bold">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'} <span className="text-lg sm:text-2xl">{performer.rank}위</span>
                </div>
                <div className="text-right">
                  <div className="text-xs sm:text-sm text-gray-600">MD</div>
                  <div className="text-base sm:text-xl font-bold break-words">{performer.name}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4">
                <div>
                  <div className="text-xs sm:text-sm text-gray-600">입점(신규)</div>
                  <div className="text-xl sm:text-2xl font-bold text-green-600">{performer.newEntry}건</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-gray-600">컨택 수</div>
                  <div className="text-xl sm:text-2xl font-bold">{performer.contacts}건</div>
                </div>
              </div>
              <div className="mt-3 sm:mt-4">
                <div className="text-xs sm:text-sm text-gray-600">전환율</div>
                <div className="text-lg sm:text-xl font-bold">{performer.conversionRate}%</div>
              </div>
            </div>
          ))}
        </div>

        {/* 지역별 현황 */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-100">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
            <span className="text-xl sm:text-2xl">📍</span> 지역별 캠핑장 현황
          </h2>
          <div className="w-full h-64 sm:h-80 mb-4 sm:mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-2 sm:p-4 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%" minHeight={256}>
              <BarChart data={regionData} margin={{ top: 5, right: 5, left: 5, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={80}
                  stroke="#64748b"
                  tick={{ fontSize: 9 }}
                  interval={0}
                />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} width={40} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e0e7ff',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    fontSize: '11px',
                    padding: '8px'
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="value" fill="#4f46e5" name="캠핑장 수" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">지역별 상세 현황 (TOP 10)</h3>
              {districtData.length > 10 && (
                <button
                  onClick={() => setShowAllDistricts(!showAllDistricts)}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-xs sm:text-sm whitespace-nowrap"
                >
                  {showAllDistricts ? '접기' : '자세히 보기'}
                </button>
              )}
            </div>
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left rounded-tl-lg whitespace-nowrap">지역(광역)</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left whitespace-nowrap">지역(시/군/리)</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-right rounded-tr-lg whitespace-nowrap">건수</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(showAllDistricts ? districtData : districtData.slice(0, 10)).map((item, index) => (
                      <tr 
                        key={index} 
                        className="border-b hover:bg-blue-50 transition-colors"
                      >
                        <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium text-xs sm:text-sm">{item.region}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">{item.name}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold text-blue-600 text-xs sm:text-sm">{item.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* MD별 컨택 현황 */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-100">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
            <span className="text-xl sm:text-2xl">👥</span> MD별 컨택 현황
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="w-full h-64 sm:h-80 min-h-[256px]">
              <ResponsiveContainer width="100%" height="100%" minHeight={256}>
                <PieChart>
                  <Pie
                    data={mdData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => {
                      const label = `${name}: ${(percent * 100).toFixed(0)}%`;
                      return label.length > 15 ? `${name.substring(0, 8)}...` : label;
                    }}
                    outerRadius={typeof window !== 'undefined' && window.innerWidth < 640 ? 50 : 60}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {mdData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      fontSize: '11px',
                      padding: '8px',
                      backgroundColor: 'white',
                      border: '1px solid #e0e7ff',
                      borderRadius: '8px'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left rounded-tl-lg whitespace-nowrap">MD</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-right whitespace-nowrap">컨택 수</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-right rounded-tr-lg whitespace-nowrap">비율</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mdData.map((item, index) => {
                      const total = mdData.reduce((sum, d) => sum + d.value, 0);
                      const percentage = ((item.value / total) * 100).toFixed(1);
                      return (
                        <tr key={index} className="border-b hover:bg-indigo-50 transition-colors">
                          <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium text-xs sm:text-sm truncate max-w-[120px]">{item.name}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold text-indigo-600 text-xs sm:text-sm">{item.value}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-right">
                            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium whitespace-nowrap">
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
        </div>

        {/* 컨택 결과 분석 */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-100">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
            <span className="text-xl sm:text-2xl">📈</span> 컨택 결과 분석
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="w-full h-64 sm:h-80 min-h-[256px]">
              <ResponsiveContainer width="100%" height="100%" minHeight={256}>
                <PieChart>
                  <Pie
                    data={resultData}
                    cx="50%"
                    cy="50%"
                    innerRadius={typeof window !== 'undefined' && window.innerWidth < 640 ? 35 : 45}
                    outerRadius={typeof window !== 'undefined' && window.innerWidth < 640 ? 50 : 60}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {resultData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      fontSize: '11px',
                      padding: '8px',
                      backgroundColor: 'white',
                      border: '1px solid #e0e7ff',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left rounded-tl-lg whitespace-nowrap">결과</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-right whitespace-nowrap">건수</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-right rounded-tr-lg whitespace-nowrap">비율</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultData.map((item, index) => {
                      const total = resultData.reduce((sum, d) => sum + d.value, 0);
                      const percentage = ((item.value / total) * 100).toFixed(1);
                      return (
                        <tr key={index} className="border-b hover:bg-green-50 transition-colors">
                          <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium text-xs sm:text-sm">{item.name}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold text-green-600 text-xs sm:text-sm">{item.value}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-right">
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium whitespace-nowrap">
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
        </div>

        {/* 거절/미진행 사유 분석 */}
        {rejectionReasons.length > 0 && (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-100">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
              <span className="text-xl sm:text-2xl">⚠️</span> 거절/미진행 사유 분석
            </h2>
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-red-600 to-pink-600 text-white">
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left rounded-tl-lg whitespace-nowrap">순위</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left whitespace-nowrap">사유</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-right rounded-tr-lg whitespace-nowrap">건수</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rejectionReasons.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-red-50 transition-colors">
                        <td className="px-2 sm:px-4 py-2 sm:py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                            index === 0 ? 'bg-yellow-400 text-yellow-900' :
                            index === 1 ? 'bg-gray-300 text-gray-900' :
                            'bg-gray-200 text-gray-700'
                          }`}>
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium text-xs sm:text-sm break-words">{item.name}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold text-red-600 text-xs sm:text-sm">{item.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MD 성과 순위 테이블 */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-100">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
            <span className="text-xl sm:text-2xl">🏆</span> MD 성과 순위 (입점 신규 기준)
          </h2>
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full text-xs sm:text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 text-white">
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-center rounded-tl-lg whitespace-nowrap">순위</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left whitespace-nowrap">MD</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-right whitespace-nowrap">입점(신규)</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-right whitespace-nowrap">컨택 수</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-right rounded-tr-lg whitespace-nowrap">전환율</th>
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
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                        <span className="text-base sm:text-xl">
                          {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : item.rank}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium text-xs sm:text-sm truncate max-w-[100px] sm:max-w-none">{item.name}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-right">
                        <span className="px-2 sm:px-3 py-1 bg-green-100 text-green-700 rounded-full font-semibold text-xs sm:text-sm whitespace-nowrap">
                          {item.newEntry}건
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-right font-medium text-xs sm:text-sm">{item.contacts}건</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-right">
                        <span className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold text-xs sm:text-sm whitespace-nowrap">
                          {item.conversionRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* AI 분석 섹션 - 더 디테일하게 */}
        {aiAnalysis && (
          <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 rounded-xl sm:rounded-2xl shadow-xl p-3 sm:p-4 md:p-6 mb-6 sm:mb-8 border border-purple-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 md:mb-6 gap-2">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-lg sm:text-xl md:text-2xl">🤖</span> AI 데이터 분석 요약
              </h2>
              {aiAnalysis.analysisTime && (
                <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">분석 시간: {aiAnalysis.analysisTime}</span>
              )}
            </div>
            {analyzing ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">분석 중...</p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {/* 첫 번째 행: 결과 분석, 사유 분석, 키워드 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                  {/* 결과 분석 */}
                  <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 shadow-md">
                    <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-800 mb-2 sm:mb-3 md:mb-4 flex items-center gap-2">
                      <span className="text-base sm:text-lg md:text-xl">📊</span> 결과 분석
                    </h3>
                    <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
                      {aiAnalysis.resultSummary.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-1.5 sm:p-2 bg-gray-50 rounded-lg">
                          <span className="text-xs sm:text-sm font-medium text-gray-700 truncate flex-1 min-w-0">{item.result}</span>
                          <div className="flex items-center gap-1 sm:gap-2 ml-2 flex-shrink-0">
                            <span className="text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">{item.count}건</span>
                            <span className="text-xs text-gray-500 whitespace-nowrap">({item.percentage}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 사유 분석 */}
                  <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 shadow-md">
                    <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-800 mb-2 sm:mb-3 md:mb-4 flex items-center gap-2">
                      <span className="text-base sm:text-lg md:text-xl">💬</span> 주요 사유 (TOP 10)
                    </h3>
                    <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
                      {aiAnalysis.topReasons.slice(0, 10).map((item: any, index: number) => (
                        <div key={index} className="p-1.5 sm:p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-1 sm:gap-2 mb-1">
                            <span className="text-xs font-bold text-purple-600 flex-shrink-0">#{index + 1}</span>
                            <div className="text-xs sm:text-sm font-medium text-gray-700 line-clamp-2 flex-1 min-w-0 break-words">{item.reason}</div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 whitespace-nowrap">{item.count}회</span>
                            <span className="text-xs text-gray-400 whitespace-nowrap">({item.percentage}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 내용 키워드 분석 */}
                  <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 shadow-md">
                    <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-800 mb-2 sm:mb-3 md:mb-4 flex items-center gap-2">
                      <span className="text-base sm:text-lg md:text-xl">🔑</span> 내용 키워드
                    </h3>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                      {Object.entries(aiAnalysis.phraseCounts)
                        .sort((a: any, b: any) => b[1] - a[1])
                        .slice(0, 12)
                        .map(([phrase, count]: any, index: number) => (
                          <span
                            key={index}
                            className="px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-full text-xs font-medium whitespace-nowrap"
                          >
                            {phrase} ({count})
                          </span>
                        ))}
                    </div>
                    <div className="pt-2 sm:pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-600 space-y-0.5 sm:space-y-1">
                        <div className="break-words">📊 분석 대상: {aiAnalysis.totalAnalyzed}개</div>
                        <div className="break-words">💬 사유 포함: {aiAnalysis.hasReasons}개</div>
                        <div className="break-words">📝 내용 포함: {aiAnalysis.hasContents}개</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 두 번째 행: 사유 카테고리, MD 성과, 지역 성과 */}
                {aiAnalysis.reasonCategories && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                    {/* 사유 카테고리 분석 */}
                    <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 shadow-md">
                      <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-800 mb-2 sm:mb-3 md:mb-4 flex items-center gap-2">
                        <span className="text-base sm:text-lg md:text-xl">📂</span> 사유 카테고리
                      </h3>
                      <div className="space-y-1.5 sm:space-y-2">
                        {Object.entries(aiAnalysis.reasonCategories)
                          .sort((a: any, b: any) => b[1] - a[1])
                          .map(([category, count]: any, index: number) => (
                            <div key={index} className="flex justify-between items-center p-1.5 sm:p-2 bg-gray-50 rounded-lg">
                              <span className="text-xs sm:text-sm font-medium text-gray-700 break-words flex-1">{category}</span>
                              <span className="text-xs sm:text-sm font-semibold text-gray-900 ml-2 whitespace-nowrap flex-shrink-0">{count}건</span>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* MD 성과 분석 */}
                    {aiAnalysis.mdPerformance && aiAnalysis.mdPerformance.length > 0 && (
                      <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 shadow-md">
                        <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-800 mb-2 sm:mb-3 md:mb-4 flex items-center gap-2">
                          <span className="text-base sm:text-lg md:text-xl">👥</span> MD 성과 분석 (TOP 5)
                        </h3>
                        <div className="space-y-1.5 sm:space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
                          {aiAnalysis.mdPerformance.slice(0, 5).map((item: any, index: number) => (
                            <div key={index} className="p-1.5 sm:p-2 bg-gray-50 rounded-lg">
                              <div className="text-xs sm:text-sm font-semibold text-gray-800 mb-1 break-words">{item.md}</div>
                              <div className="flex justify-between text-xs text-gray-600 gap-2">
                                <span className="whitespace-nowrap">입점: {item.newEntry}건</span>
                                <span className="whitespace-nowrap">전환율: {item.conversionRate}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 지역 성과 분석 */}
                    {aiAnalysis.regionPerformance && aiAnalysis.regionPerformance.length > 0 && (
                      <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 shadow-md">
                        <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-800 mb-2 sm:mb-3 md:mb-4 flex items-center gap-2">
                          <span className="text-base sm:text-lg md:text-xl">📍</span> 지역 성과 분석 (TOP 5)
                        </h3>
                        <div className="space-y-1.5 sm:space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
                          {aiAnalysis.regionPerformance.slice(0, 5).map((item: any, index: number) => (
                            <div key={index} className="p-1.5 sm:p-2 bg-gray-50 rounded-lg">
                              <div className="text-xs sm:text-sm font-semibold text-gray-800 mb-1 break-words">{item.region}</div>
                              <div className="flex justify-between text-xs text-gray-600 gap-2">
                                <span className="whitespace-nowrap">입점: {item.newEntry}건</span>
                                <span className="whitespace-nowrap">전환율: {item.conversionRate}%</span>
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

        {/* 영업 인사이트 섹션 */}
        {insights && (
          <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-xl sm:rounded-2xl shadow-xl p-3 sm:p-4 md:p-6 mb-6 sm:mb-8 border border-amber-100">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2">
              <span className="text-lg sm:text-xl md:text-2xl">💡</span> 영업 인사이트 (사장님 반응 분석)
            </h2>
            
            {/* 전체 인사이트 */}
            <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 mb-3 sm:mb-4 md:mb-6 shadow-md border-l-4 border-amber-500">
              <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                <span className="text-base sm:text-lg">📈</span> 전체 요약
              </h3>
              <div 
                className={`text-xs sm:text-sm md:text-base text-gray-700 leading-relaxed break-words cursor-pointer hover:bg-amber-50 p-2 -m-2 rounded transition-colors ${
                  expandedInsight === 'overall' ? '' : 'line-clamp-4'
                }`}
                onClick={() => setExpandedInsight(expandedInsight === 'overall' ? null : 'overall')}
              >
                {insights.overallInsight}
              </div>
              {insights.overallInsight && insights.overallInsight.length > 150 && (
                <button
                  onClick={() => setExpandedInsight(expandedInsight === 'overall' ? null : 'overall')}
                  className="mt-2 text-xs sm:text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
                >
                  {expandedInsight === 'overall' ? (
                    <>
                      <span>접기</span>
                      <span>▲</span>
                    </>
                  ) : (
                    <>
                      <span>전체 내용 보기</span>
                      <span>▼</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* 사유별 인사이트 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {insights.reasonStats
                .filter((stat: any) => stat.count > 0)
                .map((stat: any, index: number) => {
                  const insightKey = `reason-${stat.reason}`;
                  const isExpanded = expandedInsight === insightKey;
                  const needsExpansion = stat.insight && stat.insight.length > 120;
                  
                  return (
                    <div 
                      key={index} 
                      className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 shadow-md hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-2 sm:mb-3 gap-2">
                        <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-800 flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
                          <span className="text-base sm:text-lg flex-shrink-0">🏷️</span> 
                          <span className="break-words">{stat.reason}</span>
                        </h3>
                        <span className="px-2 sm:px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap flex-shrink-0">
                          {stat.count}건
                        </span>
                      </div>
                      {stat.insight && (
                        <div>
                          <div 
                            className={`text-xs sm:text-sm text-gray-700 leading-relaxed break-words cursor-pointer hover:bg-amber-50 p-2 -m-2 rounded transition-colors ${
                              isExpanded ? '' : 'line-clamp-3'
                            }`}
                            onClick={() => needsExpansion && setExpandedInsight(isExpanded ? null : insightKey)}
                          >
                            {stat.insight}
                          </div>
                          {needsExpansion && (
                            <button
                              onClick={() => setExpandedInsight(isExpanded ? null : insightKey)}
                              className="mt-2 text-xs sm:text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
                            >
                              {isExpanded ? (
                                <>
                                  <span>접기</span>
                                  <span>▲</span>
                                </>
                              ) : (
                                <>
                                  <span>전체 내용 보기</span>
                                  <span>▼</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            {/* 분석 통계 */}
            <div className="mt-3 sm:mt-4 md:mt-6 pt-3 sm:pt-4 border-t border-amber-200">
              <div className="text-xs sm:text-sm text-gray-600 flex flex-wrap gap-2 sm:gap-4">
                <span className="break-words">📊 분석된 피드백: {insights.totalAnalyzed}건</span>
                <span className="break-words">🏷️ 사유 분류: {insights.reasonStats.filter((s: any) => s.count > 0).length}개</span>
              </div>
            </div>
          </div>
        )}

        {/* 캠핑장 목록 */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-100">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
            <span className="text-xl sm:text-2xl">📋</span> 캠핑장 목록 ({filteredData.length.toLocaleString()}개)
          </h2>
          <div className="overflow-x-auto -mx-2 sm:mx-0 max-h-96 overflow-y-auto">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full text-xs sm:text-sm">
                <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white sticky top-0 z-10">
                  <tr>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left rounded-tl-lg whitespace-nowrap">번호</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left whitespace-nowrap min-w-[120px]">캠핑장명</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left hidden sm:table-cell whitespace-nowrap">지역(광역)</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left hidden md:table-cell whitespace-nowrap">지역(시/군/리)</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left hidden lg:table-cell whitespace-nowrap">컨택MD</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left whitespace-nowrap">결과</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-center rounded-tr-lg whitespace-nowrap">상세</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-colors">
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-600 text-xs sm:text-sm">{item.id}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-900 text-xs sm:text-sm break-words">{item['캠핑장명'] || '-'}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 hidden sm:table-cell text-xs sm:text-sm">{item['지역(광역)'] || '-'}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell text-xs sm:text-sm">{item['지역(시/군/리)'] || '-'}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 hidden lg:table-cell text-xs sm:text-sm">{item['컨택MD'] || '-'}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
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
