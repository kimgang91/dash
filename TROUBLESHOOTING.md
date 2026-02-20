# 문제 해결 가이드

## 환경변수 에러가 발생하는 경우

### 1. Vercel 로그 확인 (가장 중요!)

1. Vercel 대시보드 → 프로젝트 선택
2. 상단 메뉴에서 **Deployments** 클릭
3. 최신 배포(Production) 클릭
4. **Functions** 탭 클릭
5. `/api/sales` 함수 클릭
6. **Logs** 탭에서 에러 메시지 확인

**예상되는 에러 메시지:**
- `GOOGLE_SHEETS_CLIENT_EMAIL 환경변수가 설정되지 않았습니다` → 환경변수 Key 이름 확인
- `GOOGLE_SHEETS_PRIVATE_KEY 형식이 올바르지 않습니다` → Private Key 전체 복사 확인
- `PERMISSION_DENIED` → Google Sheets 공유 권한 확인
- `invalid_grant` → 환경변수 값이 잘못됨

---

### 2. 환경변수 설정 체크리스트

#### ✅ Step 1: Vercel 프로젝트로 이동
- [ ] Vercel 대시보드에서 **정확한 프로젝트** 선택 (sales-dashboard)
- [ ] 상단 **Settings** 탭 클릭
- [ ] 왼쪽 메뉴에서 **Environment Variables** 선택

#### ✅ Step 2: GOOGLE_SHEETS_CLIENT_EMAIL 추가
- [ ] **Add** 버튼 클릭
- [ ] **Key** 필드에 정확히 입력: `GOOGLE_SHEETS_CLIENT_EMAIL` (대문자, 언더스코어)
- [ ] **Value** 필드에 서비스 계정 이메일 입력 (예: `xxxx@project.iam.gserviceaccount.com`)
- [ ] Environments: **Production, Preview, Development** 모두 선택
- [ ] **Save** 버튼 클릭
- [ ] 리스트에 `GOOGLE_SHEETS_CLIENT_EMAIL`이 보이는지 확인

#### ✅ Step 3: GOOGLE_SHEETS_PRIVATE_KEY 추가
- [ ] **Add** 버튼 클릭 (또는 "+ Add Another")
- [ ] **Key** 필드에 정확히 입력: `GOOGLE_SHEETS_PRIVATE_KEY` (대문자, 언더스코어)
- [ ] **Value** 필드에 Private Key **전체** 붙여넣기:
  ```
  -----BEGIN PRIVATE KEY-----
  MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
  (중간 내용 전체)
  ...
  -----END PRIVATE KEY-----
  ```
- [ ] **Sensitive** 토글을 **ON**으로 변경
- [ ] Environments: **Production, Preview, Development** 모두 선택
- [ ] **Save** 버튼 클릭
- [ ] 리스트에 `GOOGLE_SHEETS_PRIVATE_KEY`가 보이는지 확인

#### ✅ Step 4: 재배포
- [ ] 상단 **Deployments** 탭으로 이동
- [ ] 최신 배포 옆 **...** 메뉴 클릭
- [ ] **Redeploy** 선택
- [ ] 배포 완료 대기 (1-2분)

#### ✅ Step 5: Google Sheets 공유 확인
- [ ] Google Sheets 문서 열기: `1_laE9Yxj-tajY23k36z3Bg2A_Mds8_V2A81DHnrUO68`
- [ ] 우측 상단 **공유** 버튼 클릭
- [ ] 서비스 계정 이메일 주소 입력 (GOOGLE_SHEETS_CLIENT_EMAIL 값)
- [ ] 권한: **보기 가능(뷰어)** 선택
- [ ] **완료** 클릭

---

### 3. 브라우저에서 직접 API 테스트

1. 브라우저에서 다음 URL 열기:
   ```
   https://your-vercel-app.vercel.app/api/sales
   ```

2. 응답 확인:
   - **성공**: `{"data":[...]}` 형태의 JSON
   - **실패**: `{"error":"..."}` 형태의 에러 메시지

3. 에러 메시지를 복사해서 확인

---

### 4. 자주 하는 실수

❌ **Key 필드에 값을 넣음**
- 잘못: Key = `-----BEGIN PRIVATE KEY-----`
- 올바름: Key = `GOOGLE_SHEETS_PRIVATE_KEY`

❌ **Private Key 일부만 복사**
- 잘못: `MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...`
- 올바름: `-----BEGIN PRIVATE KEY-----\n...전체...\n-----END PRIVATE KEY-----\n`

❌ **환경변수 추가 후 재배포 안 함**
- 환경변수 변경 후에는 **반드시 Redeploy** 필요!

❌ **다른 프로젝트에 환경변수 추가**
- 정확한 프로젝트(sales-dashboard)의 Settings에서 추가해야 함

❌ **Google Sheets 공유 안 함**
- 서비스 계정 이메일을 Google Sheets에 공유해야 접근 가능

---

### 5. 여전히 안 되면

1. Vercel Functions 로그에서 정확한 에러 메시지 확인
2. 에러 메시지를 복사해서 개발자에게 전달
3. 환경변수 Key 이름이 정확한지 다시 확인
4. Private Key가 전체인지 확인 (BEGIN부터 END까지)
