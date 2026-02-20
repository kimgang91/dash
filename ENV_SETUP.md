# 환경 변수 설정 가이드

## Google Sheets API 인증 설정

### 1. Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. **API 및 서비스** > **라이브러리**로 이동
4. "Google Sheets API" 검색 후 활성화

### 2. 서비스 계정 생성

1. **API 및 서비스** > **사용자 인증 정보**로 이동
2. **사용자 인증 정보 만들기** > **서비스 계정** 선택
3. 서비스 계정 이름 입력 (예: `sales-dashboard`)
4. **역할**: 선택 사항 (필요 시 설정)
5. **만들기** 클릭

### 3. JSON 키 다운로드

1. 생성된 서비스 계정 클릭
2. **키** 탭으로 이동
3. **키 추가** > **새 키 만들기** 선택
4. 키 유형: **JSON** 선택
5. **만들기** 클릭 → JSON 파일이 자동 다운로드됨

### 4. Google Sheets 문서 공유

1. 다운로드한 JSON 파일에서 `client_email` 값 복사
   - 예: `sales-dashboard@project-name.iam.gserviceaccount.com`
2. Google Sheets 문서 열기
3. **공유** 버튼 클릭
4. 서비스 계정 이메일 주소 입력
5. 권한: **뷰어** 선택 (읽기 전용)
6. **완료** 클릭

### 5. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일 생성:

```env
GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account-email@project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

#### Private Key 설정 방법

1. 다운로드한 JSON 파일 열기
2. `private_key` 필드의 값을 복사
3. 전체 키를 따옴표로 감싸고, `\n`을 실제 줄바꿈으로 변환

**예시:**
```json
{
  "type": "service_account",
  "project_id": "your-project",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  "client_email": "...",
  ...
}
```

`.env.local` 파일에 다음과 같이 설정:
```env
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

**중요:** 
- 전체 키를 따옴표로 감싸야 합니다
- `\n`은 실제 줄바꿈이 아니라 백슬래시와 n 문자입니다
- JSON 파일에서 복사한 그대로 사용하면 됩니다

### 6. Vercel 배포 시 환경 변수 설정

1. Vercel 프로젝트 설정으로 이동
2. **Settings** > **Environment Variables** 선택
3. 다음 변수 추가:
   - `GOOGLE_SHEETS_CLIENT_EMAIL`: 서비스 계정 이메일
   - `GOOGLE_SHEETS_PRIVATE_KEY`: Private Key (전체 키를 따옴표로 감싸서 입력)

### 보안 주의사항

⚠️ **절대 다음 파일을 Git에 커밋하지 마세요:**
- `.env.local`
- JSON 키 파일
- 기타 인증 정보가 포함된 파일

`.gitignore` 파일에 이미 포함되어 있지만, 확인하세요.
