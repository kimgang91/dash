# Vercel 환경변수 설정 체크리스트 (최종 확인)

## ⚠️ 중요: 지금 바로 확인할 것

### 1단계: Vercel 프로젝트 확인
- [ ] Vercel 대시보드 → **정확한 프로젝트** 선택 (sales-dashboard)
- [ ] 상단 **Settings** 탭 클릭
- [ ] 왼쪽 메뉴 **Environment Variables** 클릭

### 2단계: 환경변수 확인 (반드시 이 이름으로!)

현재 코드는 **두 가지 이름 모두** 인식합니다:
- `CLIENT_EMAIL` 또는 `GOOGLE_SHEETS_CLIENT_EMAIL`
- `PRIVATE_KEY` 또는 `GOOGLE_SHEETS_PRIVATE_KEY`

**하지만 Vercel에 정확히 설정되어 있는지 확인하세요:**

#### ✅ CLIENT_EMAIL 확인
- [ ] 리스트에 `CLIENT_EMAIL` 또는 `GOOGLE_SHEETS_CLIENT_EMAIL` 있는지 확인
- [ ] Value가 `dashboard@genial-retina-488004-s8.iam.gserviceaccount.com` 인지 확인
- [ ] 없으면 **Add** 버튼으로 추가:
  - Key: `CLIENT_EMAIL`
  - Value: `dashboard@genial-retina-488004-s8.iam.gserviceaccount.com`
  - Environments: **Production, Preview, Development** 모두 체크
  - **Save** 클릭

#### ✅ PRIVATE_KEY 확인
- [ ] 리스트에 `PRIVATE_KEY` 또는 `GOOGLE_SHEETS_PRIVATE_KEY` 있는지 확인
- [ ] Value가 JSON의 `private_key` 필드 전체인지 확인
- [ ] 없으면 **Add** 버튼으로 추가:
  - Key: `PRIVATE_KEY`
  - Value: JSON 파일의 `private_key` 값 **전체** 복사 (큰따옴표 포함해서)
  - Sensitive: **ON**으로 설정
  - Environments: **Production, Preview, Development** 모두 체크
  - **Save** 클릭

### 3단계: 재배포 (필수!)

환경변수를 추가/수정했다면 **반드시 재배포**해야 합니다:

1. Vercel 대시보드 → **Deployments** 탭
2. 최신 배포(Production) 옆 **...** 메뉴 클릭
3. **Redeploy** 선택
4. 배포 완료 대기 (1-2분)

### 4단계: 로그 확인

재배포 후:

1. **Deployments** → 최신 배포 클릭
2. **Functions** 탭 → `/api/sales` 클릭
3. **Logs** 탭에서 확인:
   - `Available env keys:` 로그에서 `CLIENT_EMAIL`, `PRIVATE_KEY`가 보이는지 확인
   - 에러 메시지가 나오면 그 내용 확인

### 5단계: 브라우저에서 테스트

1. 브라우저에서 직접 API 호출:
   ```
   https://your-app.vercel.app/api/sales
   ```

2. 응답 확인:
   - **성공**: `{"data":[...]}` 형태
   - **실패**: `{"error":"...", "envCheck":{...}}` 형태
     - `envCheck` 객체를 확인해서 어떤 환경변수가 있는지 확인

### 6단계: Google Sheets 공유 확인

환경변수는 맞는데도 에러가 나면:

1. Google Sheets 문서 열기
2. **공유** 버튼 클릭
3. `dashboard@genial-retina-488004-s8.iam.gserviceaccount.com` 이메일이 있는지 확인
4. 권한: **보기 가능(뷰어)**
5. 없으면 추가

---

## 현재 JSON 파일 기준 정확한 값

### CLIENT_EMAIL
```
dashboard@genial-retina-488004-s8.iam.gserviceaccount.com
```

### PRIVATE_KEY
JSON 파일의 `private_key` 필드 전체를 복사:
```
"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDlE1e221+auYtT\n..."
```
(큰따옴표 포함해서 전체 복사)

---

## 문제 해결

### 여전히 "환경변수가 없습니다" 에러가 나면:

1. **Vercel 로그 확인** (가장 중요!)
   - Deployments → Functions → `/api/sales` → Logs
   - `Available env keys:` 로그 확인
   - 실제로 어떤 환경변수가 로드되는지 확인

2. **환경변수 이름 재확인**
   - Key 이름이 정확히 `CLIENT_EMAIL`, `PRIVATE_KEY` 인지 확인
   - 오타 없이 정확히 입력했는지 확인

3. **재배포 확인**
   - 환경변수 추가 후 반드시 **Redeploy** 했는지 확인
   - 배포가 완료되었는지 확인

4. **브라우저에서 직접 API 호출**
   - `https://your-app.vercel.app/api/sales` 직접 열기
   - 응답의 `envCheck` 객체 확인
   - 어떤 환경변수가 `true`인지 확인
