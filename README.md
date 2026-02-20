# 고캠핑 DB 영업 현황 대시보드

Google Sheets 기반 고캠핑 DB 영업 현황을 시각화하여 MD별 영업 성과를 실시간으로 파악하고, 입점(신규) 성과 순위 기반 프로모션 성과급 대상자 선정이 가능한 웹 대시보드입니다.

## 주요 기능

### 1. 지역별 캠핑장 현황
- 시/도별 캠핑장 수 집계 (막대그래프)
- 시/군/구 Drill-down 상세 테이블
- 지역 필터 적용 시 전체 지표 연동

### 2. MD별 컨택 현황
- MD별 컨택 수 집계
- 비율 파이차트
- MD 선택 시 전체 대시보드 필터링

### 3. 컨택 결과 분석
- 결과 분포 도넛 차트
- 결과별 건수 테이블
- 입점(신규), 입점(기존), 거절, 검토중, 미응답 등

### 4. 거절/미진행 사유 분석
- 사유별 빈도 분석
- 결과=거절 필터 시 사유 분석 자동 변경
- Top 사유 리스트 표시

### 5. MD 성과 순위 & 성과급 대상자 기능 ⭐
- **프로모션 성과급 지급 기준: 결과 = 입점(신규)**
- MD별 실적 순위 산출
- 1등 / 2등 자동 표시 (성과급 대상)
- 필터 연동 순위 (지역/결과 필터 적용 시 동적 재계산)
- 전환율 계산 (입점(신규) / 컨택 수)

## 데이터 소스

Google Sheets 문서:
- 스프레드시트 ID: `1_laE9Yxj-tajY23k36z3Bg2A_Mds8_V2A81DHnrUO68`
- 시트 ID (gid): `907098998`

### 사용 컬럼
- **C열**: 시/도
- **D열**: 시/군/구
- **I열**: 담당 MD
- **K열**: 결과
- **L열**: 사유

## 설치 및 실행

### 1. 의존성 설치

```bash
cd sales-dashboard
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 환경 변수를 설정하세요:

```env
GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account-email@project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 3. Google Sheets API 설정

1. Google Cloud Console에서 프로젝트 생성
2. Google Sheets API 활성화
3. 서비스 계정 생성 및 JSON 키 다운로드
4. 서비스 계정 이메일을 Google Sheets 문서에 공유 (읽기 권한)
5. 환경 변수에 `client_email`과 `private_key` 설정

자세한 설정 방법은 `campfit-crm/GOOGLE_SHEETS_SETUP.md`를 참고하세요.

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 배포

### Vercel 배포

1. Vercel에 프로젝트 연결
2. 환경 변수 설정:
   - `GOOGLE_SHEETS_CLIENT_EMAIL`
   - `GOOGLE_SHEETS_PRIVATE_KEY`
3. 배포 완료

## 기술 스택

- **Frontend**: Next.js 14 (App Router)
- **Chart**: Recharts
- **Styling**: Tailwind CSS
- **Data**: Google Sheets API

## 대시보드 구성

### 상단 KPI 카드
- 총 캠핑장 수
- 총 컨택 수
- 입점(신규) 수
- 거절 수

### 성과급 대상자 카드
- 🥇 1위 MD (입점 신규 수, 컨택 수, 전환율)
- 🥈 2위 MD

### 메인 영역
1. **지역별 분포**: 시/도별 막대그래프 + 시/군/구 상세 테이블
2. **MD별 컨택 현황**: 파이차트 + 테이블
3. **결과 분포**: 도넛 차트 + 테이블
4. **사유 분석**: Top 사유 리스트
5. **MD 순위 테이블**: 입점(신규) 기준 순위, 전환율 포함

## 필터 기능

- **지역 필터**: 시/도별 필터링
- **MD 필터**: 담당 MD별 필터링
- **결과 필터**: 컨택 결과별 필터링
- 필터 적용 시 모든 지표 및 순위가 동적으로 재계산됩니다.

## 기대 효과

✅ MD 성과를 객관적 지표로 관리  
✅ 성과급 대상 자동 산출 → 운영 효율 향상  
✅ 지역/사유 기반 영업 전략 개선 가능  
✅ 실시간 데이터 반영으로 의사결정 속도 향상

## 확장 고려사항

- 향후 CRM 대시보드 통합 가능 구조
- 캠핏 기존 입점 DB와 매칭 가능하도록 설계
- 기간별 성과 리포트 자동 생성 확장 가능
- 기간 필터 기능 추가 (날짜 컬럼 기반)
