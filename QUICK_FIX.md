# 빠른 해결 가이드

## 현재 상황
- 스프레드시트 연결 코드는 정상 ✅
- 환경변수 문제로 API가 작동하지 않음 ❌

## 해결 방법

### 1단계: Vercel 환경변수 확인

Vercel → 프로젝트 → Settings → Environment Variables에서:

**반드시 확인할 것:**
- [ ] `CLIENT_EMAIL` 또는 `GOOGLE_SHEETS_CLIENT_EMAIL` 존재
- [ ] `PRIVATE_KEY` 또는 `GOOGLE_SHEETS_PRIVATE_KEY` 존재
- [ ] 각 환경변수의 **Environments**가 **Production, Preview, Development 모두** 체크되어 있는지

### 2단계: 환경변수 값 확인

**CLIENT_EMAIL** 값:
```
dashboard@genial-retina-488004-s8.iam.gserviceaccount.com
```

**PRIVATE_KEY** 값:
- `EXACT_PRIVATE_KEY.txt` 파일의 전체 내용 복사
- 또는 JSON 파일의 `private_key` 필드 값 전체 (큰따옴표 제외)

### 3단계: 재배포

환경변수를 확인/수정했다면:
1. Deployments → 최신 배포 → ... → **Redeploy**
2. 배포 완료 대기

### 4단계: 런타임 로그 확인

재배포 후:
1. Deployments → 최신 배포 → Functions → `/api/sales` → Logs
2. 다음 로그 확인:
   ```
   === ENVIRONMENT VARIABLES DEBUG ===
   All relevant env keys: [...]
   CLIENT_EMAIL: SET 또는 NOT SET
   PRIVATE_KEY: SET 또는 NOT SET
   ```

이 로그에서 **어떤 환경변수가 실제로 로드되는지** 확인할 수 있습니다.

---

## 문제가 계속되면

Vercel 로그의 `=== ENVIRONMENT VARIABLES DEBUG ===` 부분을 복사해서 알려주세요.
그러면 정확히 어떤 환경변수가 문제인지 파악할 수 있습니다.
