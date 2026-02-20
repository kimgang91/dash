# 최종 환경변수 설정 가이드 (Invalid JWT Signature 해결)

## ⚠️ 문제: Invalid JWT Signature

이 에러는 **Private Key가 올바르게 파싱되지 않았을 때** 발생합니다.

## 해결 방법 (단계별)

### 1단계: 정확한 Private Key 값 준비

프로젝트에 `EXACT_PRIVATE_KEY.txt` 파일이 있습니다. 이 파일을 열어서 **전체 내용을 복사**하세요.

또는 아래 값을 전체 복사:

```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDlE1e221+auYtT
KnRD92hTbacnjut43kDRitpaCkby4/1LH519p+1eUBBhaDjVEmHN8KickY3/1MEo
+7tG+Y57RJyQUx2DNAivXxrEsN9dLDJPhbIp26QoGaxuKNUgsXfezQEuvozD55eT
b/1VajLTUIrXBqFvoctJ4s3AY1E4DxVbHOP4IQZdAtCRxifjyoi2BNwIkC8f21W5
BPEJBSi3tKNc8mVKItDuLVoHr9LyzsGHODA/25F2qNmt+YRhmMDzJzXt7z0JjlWU
9RlYMEql+1yIZQKRl3ukTvsNTkqYiRO481V76XchT9cXqiCm03PmwajUobiPF600
WsnumwqpAgMBAAECggEACldNseEEV1lB616ywfC0wnNkRNpkUeACoBL7GW52Vnep
Uw9Zzjba9dN6cdNBIYlDZgcTrYG6nc5ua9m1UhZo8rKduLwvzGD4dWY/MJrlcnDQ
0psv+EjEh9Tk3lI0kNXCGgo6H/CVLTDSvGKlVopFQhnUMrHHbuEoaqz06dbx7yxV
Q9n09tqtFmc+liMZfwGEcrP0yjeYoKOyVn8BO2ah/vC7x6ZwD1WzodUGP8mbtf6K
dlgsdvI9DmUN5dSVt4ah4gGkfyUqzcjfkVvI833/iVUFcUHsm0UDFT6rqcVyeFhe
rkjiZVjNapfOmukfRSqb/tQnOwUxnpzdCctI8nD0KQKBgQD6G8AfBNu3aQUSz/kg
tI8LoxTJ4yKxwA2q13tm0wnA0gtV4QM2hgHnI21/ThNjgiFVHDzfLrSrDtZWgLZi
wrL3N9Vckf3yB+c5oPT4BRZr04SCakXrX3RDdH0tiD3zeV8MPWQ6cbr7zxsdJxzE
JsVleWmHSDHPvLBYDU7PTrFazQKBgQDqeMGMw+IbPo01nJ65CdmgciEiWwsIGvDB
7LaaOiWvUlLW/arvchM+i6e/qEYqKerG+1iGv6qDL97yjSOsZ+Capa9YRjWR4QP4
EPUoRC3QK3+9qxdFeQn3IxPgboNcjD/gOk87CTZrc6yCq9PTG7vAgwzuWdLNMTL3
/S5wwyOnTQKBgHe9cW1oVgipLtSi3RLbXuCjYwCEzcdrux9fqqS/xJub8/FZmMAx
yBdwzqt0JbQuSOcGbd4r7jM3F0ayuJ7vt97DzFJVUs7dGcZtWNqlFObqjTYiyva0
7GSfEI8L+xzlrqudeK7CZFLKBKEgaJVAOqEqT2uFFNPv8j01odV+R0rBAoGAKZkQ
5ZNfCuxXCxrlQfjQZlm5LSov09lLu2vunYARbYBSeBf6+o4ngeIu+Z62DAbxwymW
dBmO+8VDbY7CtHSdcXJRoHycRmxAUwNXKzSlWBhPimvPLiEiNnk/roKMxZ+QOYy+
v7+LqxaTlX88jmiOL8JQSf0fnA3NeBev5IuKSMUCgYEAtGOfJ7v7PI3YmpvbiFfD
e1Xf7xryReZRubKxHYQeHROyd98KSDVuZ3jKBS8MvvWoNsviZpg7rAX9mRuvRz5s
2O4etDd2RiZpVvIzE4jNzcqfKoVOYjfzFsqkS8oJk9E4WpQmofElS6W0DZCrEf8/
VIQFb6N9kM6JP69NFVE57Gc=
-----END PRIVATE KEY-----
```

**중요:**
- 위 내용 **전체**를 복사 (BEGIN부터 END까지)
- 줄바꿈도 포함해서 복사
- 큰따옴표는 **절대** 넣지 마세요!

### 2단계: Vercel 환경변수 설정

1. **Vercel 대시보드** → 프로젝트 선택
2. **Settings** → **Environment Variables**
3. **PRIVATE_KEY** 환경변수 찾기 (없으면 Add)
4. **Edit** 클릭
5. **Value 필드에** 위에서 복사한 Private Key **전체** 붙여넣기
   - 큰따옴표 없이
   - 줄바꿈 포함해서
6. **Sensitive** 토글 **ON**
7. **Environments**: Production, Preview, Development 모두 체크
8. **Save** 클릭

### 3단계: CLIENT_EMAIL 확인

**CLIENT_EMAIL** 환경변수도 확인:
- Key: `CLIENT_EMAIL`
- Value: `dashboard@genial-retina-488004-s8.iam.gserviceaccount.com`

### 4단계: 재배포 (필수!)

환경변수를 수정했다면 **반드시 재배포**해야 합니다:

1. **Deployments** 탭으로 이동
2. 최신 배포(Production) 옆 **...** 메뉴 클릭
3. **Redeploy** 선택
4. 배포 완료 대기 (1-2분)

### 5단계: 로그 확인

재배포 후:

1. **Deployments** → 최신 배포 클릭
2. **Functions** 탭 → `/api/sales` 클릭
3. **Logs** 탭에서 확인:
   - `Original private key (first 100 chars):` 로그 확인
   - `Final private key starts with:` 로그 확인
   - `Final private key length:` 로그 확인 (1600-1700자 정도여야 함)
   - 에러가 없으면 성공!

### 6단계: Google Sheets 공유 확인

1. Google Sheets 문서 열기
2. **공유** 버튼 클릭
3. `dashboard@genial-retina-488004-s8.iam.gserviceaccount.com` 이메일 확인
4. 권한: **보기 가능(뷰어)**
5. 없으면 추가

---

## 체크리스트

- [ ] `EXACT_PRIVATE_KEY.txt` 파일에서 Private Key 전체 복사
- [ ] Vercel에 `PRIVATE_KEY` 환경변수 Value에 붙여넣기 (큰따옴표 없이)
- [ ] Sensitive 토글 ON
- [ ] Save 클릭
- [ ] **재배포 실행** (Deployments → Redeploy)
- [ ] 로그에서 "Final private key length" 확인 (1600-1700자)
- [ ] Google Sheets 공유 확인

---

## 여전히 안 되면

Vercel 로그에서 다음 정보를 확인하세요:

1. `Original private key (first 100 chars):` - 원본이 어떻게 들어왔는지
2. `Final private key starts with:` - 파싱 후 시작 부분
3. `Final private key length:` - 최종 길이 (1600-1700자여야 함)

이 정보를 알려주시면 더 정확히 진단할 수 있습니다.
