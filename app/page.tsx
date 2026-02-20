'use client';

import { useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface SalesData {
  id: number;
  '시/도': string;
  '시/군/구': string;
  '담당 MD': string;
  '결과': string;
  '사유': string;
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
  const [filters, setFilters] = useState<FilterState>({
    region: '',
    md: '',
    result: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sales');
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
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      // 더 구체적인 에러 메시지 표시
      const errorMessage = error.message || '데이터를 불러오는 중 오류가 발생했습니다.';
      alert(errorMessage + '\n\nVercel 환경변수 설정을 확인해주세요:\n- GOOGLE_SHEETS_CLIENT_EMAIL\n- GOOGLE_SHEETS_PRIVATE_KEY');
    } finally {
      setLoading(false);
    }
  };

  // 필터링된 데이터
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (filters.region && item['시/도'] !== filters.region) return false;
      if (filters.md && item['담당 MD'] !== filters.md) return false;
      if (filters.result && item['결과'] !== filters.result) return false;
      return true;
    });
  }, [data, filters]);

  // KPI 계산
  const kpis = useMemo(() => {
    const total = filteredData.length;
    const newEntry = filteredData.filter((item) => item['결과'] === '입점(신규)').length;
    const rejected = filteredData.filter((item) => item['결과'] === '거절').length;
    const contacts = filteredData.filter((item) => item['담당 MD']).length;
    return { total, newEntry, rejected, contacts };
  }, [filteredData]);

  // 지역별 현황
  const regionData = useMemo(() => {
    const regionMap: { [key: string]: number } = {};
    filteredData.forEach((item) => {
      const region = item['시/도'] || '미지정';
      regionMap[region] = (regionMap[region] || 0) + 1;
    });
    return Object.entries(regionMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  // 시/군/구 상세 데이터
  const districtData = useMemo(() => {
    const districtMap: { [key: string]: { region: string; count: number } } = {};
    filteredData.forEach((item) => {
      const district = item['시/군/구'] || '미지정';
      const region = item['시/도'] || '미지정';
      if (!districtMap[district]) {
        districtMap[district] = { region, count: 0 };
      }
      districtMap[district].count++;
    });
    return Object.entries(districtMap)
      .map(([name, info]) => ({ name, ...info }))
      .sort((a, b) => b.count - a.count);
  }, [filteredData]);

  // MD별 컨택 현황
  const mdData = useMemo(() => {
    const mdMap: { [key: string]: number } = {};
    filteredData.forEach((item) => {
      const md = item['담당 MD'] || '미지정';
      mdMap[md] = (mdMap[md] || 0) + 1;
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

  // MD 성과 순위 (입점 신규 기준)
  const mdRanking = useMemo(() => {
    const mdMap: { [key: string]: { contacts: number; newEntry: number } } = {};
    filteredData.forEach((item) => {
      const md = item['담당 MD'] || '미지정';
      if (!mdMap[md]) {
        mdMap[md] = { contacts: 0, newEntry: 0 };
      }
      if (item['담당 MD']) {
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

  // 필터 옵션
  const regions = useMemo(() => {
    const regionSet = new Set(data.map((item) => item['시/도']).filter(Boolean));
    return Array.from(regionSet).sort();
  }, [data]);

  const mds = useMemo(() => {
    const mdSet = new Set(data.map((item) => item['담당 MD']).filter(Boolean));
    return Array.from(mdSet).sort();
  }, [data]);

  const results = useMemo(() => {
    const resultSet = new Set(data.map((item) => item['결과']).filter(Boolean));
    return Array.from(resultSet).sort();
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">데이터를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">고캠핑 DB 영업 현황 대시보드</h1>
          <p className="text-gray-600">MD별 영업 성과 및 성과급 대상자 선정</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            데이터 새로고침
          </button>
        </header>

        {/* 필터 */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">필터</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">지역 (시/도)</label>
              <select
                value={filters.region}
                onChange={(e) => setFilters({ ...filters, region: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">전체</option>
                {regions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">담당 MD</label>
              <select
                value={filters.md}
                onChange={(e) => setFilters({ ...filters, md: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">전체</option>
                {mds.map((md) => (
                  <option key={md} value={md}>
                    {md}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">결과</label>
              <select
                value={filters.result}
                onChange={(e) => setFilters({ ...filters, result: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">전체</option>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">총 캠핑장 수</div>
            <div className="text-3xl font-bold text-gray-900">{kpis.total.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">총 컨택 수</div>
            <div className="text-3xl font-bold text-gray-900">{kpis.contacts.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">입점(신규) 수</div>
            <div className="text-3xl font-bold text-green-600">{kpis.newEntry.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">거절 수</div>
            <div className="text-3xl font-bold text-red-600">{kpis.rejected.toLocaleString()}</div>
          </div>
        </div>

        {/* 성과급 대상자 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {topPerformers.map((performer, index) => (
            <div
              key={performer.name}
              className={`bg-white rounded-lg shadow p-6 ${
                index === 0 ? 'border-4 border-yellow-400' : index === 1 ? 'border-4 border-gray-300' : ''
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
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">지역별 캠핑장 현황</h2>
          <div className="h-80 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#0088FE" name="캠핑장 수" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left">시/도</th>
                  <th className="px-4 py-2 text-left">시/군/구</th>
                  <th className="px-4 py-2 text-right">건수</th>
                </tr>
              </thead>
              <tbody>
                {districtData.slice(0, 20).map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="px-4 py-2">{item.region}</td>
                    <td className="px-4 py-2">{item.name}</td>
                    <td className="px-4 py-2 text-right">{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* MD별 컨택 현황 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">MD별 컨택 현황</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mdData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {mdData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left">MD</th>
                    <th className="px-4 py-2 text-right">컨택 수</th>
                    <th className="px-4 py-2 text-right">비율</th>
                  </tr>
                </thead>
                <tbody>
                  {mdData.map((item, index) => {
                    const total = mdData.reduce((sum, d) => sum + d.value, 0);
                    const percentage = ((item.value / total) * 100).toFixed(1);
                    return (
                      <tr key={index} className="border-b">
                        <td className="px-4 py-2">{item.name}</td>
                        <td className="px-4 py-2 text-right">{item.value}</td>
                        <td className="px-4 py-2 text-right">{percentage}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 컨택 결과 분석 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">컨택 결과 분석</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={resultData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {resultData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left">결과</th>
                    <th className="px-4 py-2 text-right">건수</th>
                    <th className="px-4 py-2 text-right">비율</th>
                  </tr>
                </thead>
                <tbody>
                  {resultData.map((item, index) => {
                    const total = resultData.reduce((sum, d) => sum + d.value, 0);
                    const percentage = ((item.value / total) * 100).toFixed(1);
                    return (
                      <tr key={index} className="border-b">
                        <td className="px-4 py-2">{item.name}</td>
                        <td className="px-4 py-2 text-right">{item.value}</td>
                        <td className="px-4 py-2 text-right">{percentage}%</td>
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
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">거절/미진행 사유 분석</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left">순위</th>
                    <th className="px-4 py-2 text-left">사유</th>
                    <th className="px-4 py-2 text-right">건수</th>
                  </tr>
                </thead>
                <tbody>
                  {rejectionReasons.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="px-4 py-2">{index + 1}</td>
                      <td className="px-4 py-2">{item.name}</td>
                      <td className="px-4 py-2 text-right">{item.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MD 성과 순위 테이블 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">MD 성과 순위 (입점 신규 기준)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-center">순위</th>
                  <th className="px-4 py-2 text-left">MD</th>
                  <th className="px-4 py-2 text-right">입점(신규)</th>
                  <th className="px-4 py-2 text-right">컨택 수</th>
                  <th className="px-4 py-2 text-right">전환율</th>
                </tr>
              </thead>
              <tbody>
                {mdRanking.map((item) => (
                  <tr
                    key={item.name}
                    className={`border-b ${
                      item.rank === 1 ? 'bg-yellow-50 font-bold' : item.rank === 2 ? 'bg-gray-50 font-semibold' : ''
                    }`}
                  >
                    <td className="px-4 py-2 text-center">
                      {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank}
                    </td>
                    <td className="px-4 py-2">{item.name}</td>
                    <td className="px-4 py-2 text-right text-green-600 font-semibold">{item.newEntry}건</td>
                    <td className="px-4 py-2 text-right">{item.contacts}건</td>
                    <td className="px-4 py-2 text-right">{item.conversionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
